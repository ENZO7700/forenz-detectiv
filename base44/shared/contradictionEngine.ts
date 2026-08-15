import { evaluateTravelFeasibility } from './geospatialEngine.ts';

// Cross-document forensic contradiction engine.
// Conservative, evidence-grounded: compares normalized ForensicClaims across
// documents owned by the SAME user. Never compares data across users.
// Distinguishes CONFIRMED_CONTRADICTION / POSSIBLE_CONTRADICTION / NO_CONTRADICTION.
// Idempotent per-document: re-analysis invalidates only contradictions touching that doc.

// ---- small utils (backend runtime; src/lib/forenzUtils.js is frontend-only) ----
function removeDiacritics(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[m];
}
function parseTimeToMinutes(time) {
  if (!time) return null;
  const m = String(time).match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  const h = parseInt(m[1], 10), min = parseInt(m[2], 10);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
function str(v, max) { return v == null ? '' : String(v).slice(0, max); }
function num01(v) { const n = Number(v); if (isNaN(n)) return 0.5; return Math.max(0, Math.min(1, n)); }
function asBool(v) { return v === true || v === 'true' || v === 1; }

// ---- entity resolution: subject matching (EXACT / LIKELY / POSSIBLE / UNRELATED) ----
// Conservative: contradiction requires LIKELY+. Substring only counts when lengths are close.
export function subjectMatchLevel(a, b) {
  const na = removeDiacritics(a), nb = removeDiacritics(b);
  if (!na || !nb) return 'UNRELATED';
  if (na === nb) return 'EXACT';
  if (na.includes(nb) || nb.includes(na)) {
    const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
    return ratio >= 0.8 ? 'LIKELY' : 'POSSIBLE';
  }
  const lev = levenshtein(na, nb);
  const ld = Math.abs(na.length - nb.length);
  if (lev === 1 && ld <= 1) return 'LIKELY';
  if (lev === 2 && ld <= 2) return 'POSSIBLE';
  return 'UNRELATED';
}

function normPred(p) {
  return removeDiacritics(p).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
const LOC_PRED = new Set(['bol_v', 'byla_v', 'was_at', 'was_in', 'located_in', 'at', 'in', 'present_at', 'seen_at', 'seen_in', 'v', 'prebyval', 'videl_v', 'isiel_do', 'isla_do']);
function isLocPred(p) {
  const n = normPred(p);
  if (!n) return false;
  if (LOC_PRED.has(n)) return true;
  return n.startsWith('bol_') || n.startsWith('byla_') || n.startsWith('v_') || n.startsWith('isiel_') || n.startsWith('isla_') || n.includes('locat');
}
function predicateCompatible(a, b) {
  const na = normPred(a), nb = normPred(b);
  if (!na || !nb) return true;            // unknown predicate → do not block
  if (na === nb) return true;
  if (isLocPred(a) && isLocPred(b)) return true;   // bol_v ≈ was_at etc.
  return false;
}
function isLocationClaim(c) {
  return !!(c.location && String(c.location).trim()) || isLocPred(c.predicate);
}
function locOf(c) { return str(c.location, 200) || str(c.object, 200); }

function normLoc(s) {
  return removeDiacritics(s).replace(/[^a-z0-9, ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
// SAME | COMPATIBLE (one contains the other, e.g. Bratislava vs Bratislava-Ružinov) | DIFFERENT | UNKNOWN
function locationRelation(a, b) {
  const na = normLoc(a), nb = normLoc(b);
  if (!na || !nb) return 'UNKNOWN';
  if (na === nb) return 'SAME';
  if (na.includes(nb) || nb.includes(na)) return 'COMPATIBLE';
  return 'DIFFERENT';
}
// EQUAL (exact equal minute, both exact) | CLOSE (≤15 min or approximate) | DIFFERENT | UNKNOWN
function timeRelation(aTime, aApprox, bTime, bApprox) {
  const ta = parseTimeToMinutes(aTime), tb = parseTimeToMinutes(bTime);
  if (ta == null || tb == null) return 'UNKNOWN';
  const diff = Math.abs(ta - tb);
  if (diff === 0 && !aApprox && !bApprox) return 'EQUAL';
  if (diff <= 15) return 'CLOSE';
  return 'DIFFERENT';
}

export function detectPair(a, b) {
  const sm = subjectMatchLevel(a.subject, b.subject);
  if (sm !== 'EXACT' && sm !== 'LIKELY') return null;   // conservative: POSSIBLE is not enough
  if (!predicateCompatible(a.predicate, b.predicate)) return null;

  const aLoc = isLocationClaim(a), bLoc = isLocationClaim(b);
  const t = timeRelation(a.event_time, asBool(a.approximate_time), b.event_time, asBool(b.approximate_time));

  let type = null, status = null, conf = 0, sev = 'low';
  let customExplanation = null;

  if (aLoc && bLoc) {
    const locA = locOf(a);
    const locB = locOf(b);
    const lr = locationRelation(locA, locB);

    if (lr === 'DIFFERENT') {
      if (t === 'EQUAL') {
        type = 'location_time_conflict';
        status = 'confirmed';
        conf = 0.9;
        sev = 'high';
      } else if (t === 'CLOSE') {
        type = 'location_time_conflict';
        status = 'possible';
        conf = 0.6;
        sev = 'medium';
      } else {
        // Skontroluj fyzikálnu uskutočniteľnosť presunu (Geospatiálna analýza)
        if (a.event_time && b.event_time) {
          const geoCheck = evaluateTravelFeasibility(locA, a.event_time, locB, b.event_time, str(a.subject, 80));
          if (geoCheck && !geoCheck.isFeasible) {
            type = 'geospatial_impossible_travel';
            status = 'confirmed';
            conf = 0.95;
            sev = geoCheck.severity;
            customExplanation = geoCheck.explanation;
          } else {
            return null; // Presun je uskutočniteľný $\rightarrow$ nejde o rozpor
          }
        } else if (t === 'UNKNOWN') {
          type = 'location_conflict';
          status = 'possible';
          conf = 0.4;
          sev = 'medium';
        } else {
          return null;
        }
      }
    } else {
      return null; // Rovnaká/kompatibilná lokalita $\rightarrow$ žiadny rozpor
    }
  } else {
    // non-location factual comparison on object
    const obj = locationRelation(a.object, b.object);
    if (obj === 'DIFFERENT') {
      if (t === 'EQUAL') { type = 'factual_conflict'; status = 'confirmed'; conf = 0.8; sev = 'high'; }
      else if (t === 'CLOSE' || t === 'UNKNOWN') { type = 'factual_conflict'; status = 'possible'; conf = 0.45; sev = 'medium'; }
      else return null;
    } else return null;
  }
  if (!type) return null;

  const explanation = customExplanation ||
    ('Tvrdenia o „' + str(a.subject, 80) + '" sa odporujú: ' +
      (a.document_title || 'Dokument A') + ' → ' + (locOf(a) || a.object || '?') + (a.event_time ? ' @ ' + a.event_time : '') + '. ' +
      (b.document_title || 'Dokument B') + ' → ' + (locOf(b) || b.object || '?') + (b.event_time ? ' @ ' + b.event_time : '') + '.');

  return {
    claim_a_id: a.id, claim_b_id: b.id,
    document_a_id: a.document_id, document_b_id: b.document_id,
    entity_ref: str(a.subject, 200),
    type, severity: sev, confidence: conf,
    explanation, status,
    document_id: a.document_id, document_title: str(a.document_title, 200)
  };
}

// ec = base44 client (user context or asServiceRole). userId = owner of the docs.
// scopeDocId: if set, (re)compute only contradictions touching that doc; else full recompute.
// Never crosses users — claims are filtered by created_by_id.
export async function runContradictionDetection(ec, userId, scopeDocId) {
  const allClaims = await ec.entities.ForensicClaim.filter({ created_by_id: userId }, '-created_date', 5000);

  // Idempotent invalidation: remove contradictions touched by the scope doc (or all for full recompute).
  if (scopeDocId) {
    await ec.entities.Contradiction.deleteMany({ document_a_id: scopeDocId });
    await ec.entities.Contradiction.deleteMany({ document_b_id: scopeDocId });
  } else {
    await ec.entities.Contradiction.deleteMany({ created_by_id: userId });
  }

  // Candidate narrowing: pairs across documents only.
  let pairs = [];
  if (scopeDocId) {
    const focus = allClaims.filter((c) => c.document_id === scopeDocId);
    for (const f of focus) {
      for (const o of allClaims) {
        if (o.document_id && f.document_id && o.document_id !== f.document_id) pairs.push([f, o]);
      }
    }
  } else {
    for (let i = 0; i < allClaims.length; i++) {
      for (let j = i + 1; j < allClaims.length; j++) {
        if (allClaims[i].document_id && allClaims[j].document_id && allClaims[i].document_id !== allClaims[j].document_id) {
          pairs.push([allClaims[i], allClaims[j]]);
        }
      }
    }
  }

  const created = [];
  const seen = new Set();
  for (const [a, b] of pairs) {
    const r = detectPair(a, b);
    if (!r) continue;
    const key = [a.id, b.id].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    created.push(r);
  }
  if (created.length) await ec.entities.Contradiction.bulkCreate(created);
  return { created: created.length, scope: scopeDocId ? 'document' : 'full', candidates: pairs.length };
}