/**
 * Cross-Examination AI Engine — generates citation-backed confrontation questions.
 * Prefer deterministic local templates; optional AI invoke with citation validation + fallback.
 */

export const CROSS_EXAM_MODES = {
  mild: {
    id: 'mild',
    label: 'Mierny výsluch svedka',
    description: 'Neutrálne, objasňujúce otázky vhodné pre svedka na pojednávaní.',
    tone: 'mierny'
  },
  aggressive: {
    id: 'aggressive',
    label: 'Agresívny krížový výslech obhajoby',
    description: 'Konfrontačné otázky zamerané na rozpor a nedôveryhodnosť.',
    tone: 'agresívny'
  },
  alibi: {
    id: 'alibi',
    label: 'Detailná verifikácia alibi',
    description: 'Chronologické a geografické overenie tvrdeného alibi.',
    tone: 'verifikačný'
  }
};

/** Citation must include page/line OR document title + passage reference. */
const CITATION_RE =
  /(?:s\.\s*\d+|str(?:ana|\.)\s*\d+|riad(?:ok|\.)\s*\d+|l\.\s*\d+|strana\s+\d+|riadok\s+\d+|„[^"]{3,}“|"[^"]{3,}"|'[^']{3,}'|\([^)]*(?:s\.|str\.|riad|dokument|výpoveď|spis)[^)]*\)|dokument[:\s„"].+|výpoveď[:\s„"].+|pasáž[:\s„"].+)/i;

/**
 * Build a concrete citation from case materials.
 * @returns {{ text: string, documentTitle: string, page: number|null, line: number|null, passage: string }}
 */
export function buildCitation(source = {}, documents = []) {
  const docId = source.document_id || source.document_a_id || source.documentId || null;
  const doc =
    (docId && documents.find((d) => d.id === docId)) ||
    documents.find((d) => d.title === source.document_title) ||
    null;

  const documentTitle =
    source.document_title ||
    doc?.title ||
    doc?.file_name ||
    source.docTitle ||
    'Nezaradený spis';

  const page =
    source.page_number ??
    source.page ??
    doc?.page_number ??
    extractPageFromTitle(documentTitle);

  const line = source.line_number ?? source.line ?? null;
  const passage = String(
    source.source_quote ||
      source.quoteA ||
      source.quoteB ||
      source.quote ||
      source.text ||
      source.explanation ||
      source.description ||
      source.details ||
      ''
  )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

  const pagePart = page != null ? `s. ${page}` : null;
  const linePart = line != null ? `riad. ${line}` : null;
  const loc = [pagePart, linePart].filter(Boolean).join(', ');
  const passagePart = passage ? `pasáž: „${passage}"` : 'pasáž: (odkaz na relevantnú časť spisu)';

  const text = loc
    ? `${documentTitle} (${loc}) — ${passagePart}`
    : `${documentTitle} — ${passagePart}`;

  return { text, documentTitle, page: page ?? null, line: line ?? null, passage };
}

function extractPageFromTitle(title) {
  const m = String(title || '').match(/(?:s\.|str\.?|strana)\s*(\d+)/i);
  return m ? Number(m[1]) : null;
}

/**
 * Legal safety: every question must carry a concrete citation.
 */
export function hasValidCitation(questionOrCitation) {
  if (!questionOrCitation) return false;
  if (typeof questionOrCitation === 'string') {
    return CITATION_RE.test(questionOrCitation);
  }
  const c = questionOrCitation.citation || questionOrCitation.citationText || '';
  const q = questionOrCitation.question || questionOrCitation.text || '';
  if (questionOrCitation.citation && typeof questionOrCitation.citation === 'object') {
    const ct = questionOrCitation.citation.text || '';
    return CITATION_RE.test(ct) || CITATION_RE.test(`${q} ${ct}`);
  }
  return CITATION_RE.test(String(c)) || CITATION_RE.test(`${q} ${c}`);
}

export function validateQuestionSet(questions = []) {
  const invalid = [];
  const valid = [];
  for (const q of questions) {
    if (hasValidCitation(q)) valid.push(q);
    else invalid.push(q);
  }
  return {
    ok: invalid.length === 0 && valid.length > 0,
    valid,
    invalid,
    total: questions.length
  };
}

function resolveMode(mode) {
  if (!mode) return CROSS_EXAM_MODES.mild;
  if (typeof mode === 'string') {
    return CROSS_EXAM_MODES[mode] || Object.values(CROSS_EXAM_MODES).find((m) => m.id === mode || m.label === mode) || CROSS_EXAM_MODES.mild;
  }
  return mode.id ? CROSS_EXAM_MODES[mode.id] || mode : CROSS_EXAM_MODES.mild;
}

function pickClaimsForContradiction(contradiction, claims = []) {
  const a = claims.find((c) => c.id === contradiction.claim_a_id);
  const b = claims.find((c) => c.id === contradiction.claim_b_id);
  return { claimA: a || null, claimB: b || null };
}

function relatedContradictionsForPerson(person, contradictions = []) {
  if (!person) return [];
  const name = String(person.name || '').toLowerCase();
  return contradictions.filter((c) => {
    const ref = String(c.entity_ref || c.person || c.personName || '').toLowerCase();
    return ref && name && (ref.includes(name) || name.includes(ref));
  });
}

/**
 * Deterministic template questions for a contradiction / red flag.
 */
export function generateTemplateQuestions({
  target = null,
  mode = 'mild',
  documents = [],
  claims = [],
  contradictions = []
} = {}) {
  const resolved = resolveMode(mode);
  const isPerson = target && (target.name || target.type) && !target.type?.includes?.('conflict') && !target.claim_a_id && !target.category;
  const isContradiction =
    target &&
    (target.claim_a_id ||
      target.type?.includes?.('conflict') ||
      target.severity ||
      target.explanation ||
      target.quoteA ||
      target.category);

  let sources = [];
  if (isContradiction) {
    sources = [target];
  } else if (isPerson) {
    sources = relatedContradictionsForPerson(target, contradictions);
    if (sources.length === 0) {
      sources = [
        {
          entity_ref: target.name,
          type: 'factual_conflict',
          explanation: target.details || `Profil osoby ${target.name}`,
          document_title: target.document_title,
          document_id: target.document_id,
          page_number: target.page_number,
          source_quote: target.details || `Osoba ${target.name} v spise`
        }
      ];
    }
  } else if (target) {
    sources = [target];
  }

  if (sources.length === 0) {
    return [];
  }

  const questions = [];
  let seq = 1;

  for (const src of sources.slice(0, 4)) {
    const { claimA, claimB } = pickClaimsForContradiction(src, claims);
    const citeA = buildCitation(
      {
        document_id: src.document_a_id || src.document_id || claimA?.document_id,
        document_title: claimA?.document_title || src.document_title,
        page_number: claimA?.page_number ?? src.page_number ?? src.page_a,
        line_number: claimA?.line_number ?? src.line_a,
        source_quote: claimA?.source_quote || src.quoteA || src.explanation || src.description
      },
      documents
    );
    const citeB = buildCitation(
      {
        document_id: src.document_b_id || claimB?.document_id,
        document_title: claimB?.document_title || src.document_title_b || src.document_title,
        page_number: claimB?.page_number ?? src.page_b,
        line_number: claimB?.line_number ?? src.line_b,
        source_quote: claimB?.source_quote || src.quoteB || src.explanation || src.description
      },
      documents
    );

    const personName = src.entity_ref || src.person || src.personName || target?.name || 'svedok';
    const conflictType = (src.type || src.category || 'rozpor').replace(/_/g, ' ');
    const locA = claimA?.location || src.locationA || src.locA || '';
    const locB = claimB?.location || src.locationB || src.locB || '';
    const timeA = claimA?.event_time || src.timeA || '';
    const timeB = claimB?.event_time || src.timeB || '';

    const templates = buildModeTemplates(resolved.id, {
      personName,
      conflictType,
      locA,
      locB,
      timeA,
      timeB,
      citeA,
      citeB,
      explanation: src.explanation || src.description || ''
    });

    for (const t of templates) {
      const item = {
        id: `QX-${seq++}`,
        mode: resolved.id,
        modeLabel: resolved.label,
        question: t.question,
        citation: t.citation,
        citationText: t.citation.text,
        tactic: t.tactic,
        targetRef: personName,
        conflictType,
        source: 'template'
      };
      if (!hasValidCitation(item)) {
        item.citationText = citeA.text;
        item.citation = citeA;
        item.question = `${item.question} [Citácia: ${citeA.text}]`;
      }
      questions.push(item);
    }
  }

  return questions;
}

function buildModeTemplates(modeId, ctx) {
  const { personName, conflictType, locA, locB, timeA, timeB, citeA, citeB, explanation } = ctx;
  const placeTimeA = [locA, timeA].filter(Boolean).join(' o ') || 'uvedenom mieste/čase';
  const placeTimeB = [locB, timeB].filter(Boolean).join(' o ') || 'druhom mieste/čase';

  if (modeId === 'aggressive') {
    return [
      {
        tactic: 'konfrontácia',
        citation: citeA,
        question: `Pane/pani ${personName}, trváte na tom, že ste boli na ${placeTimeA}, hoci spis uvádza niečo iné? Odvolávam sa na ${citeA.text}.`
      },
      {
        tactic: 'uzavretie rozporu',
        citation: citeB,
        question: `Ako vysvetlíte, že tá istá osoba nemôže byť súčasne na ${placeTimeA} aj ${placeTimeB}? Porovnajte s ${citeB.text}.`
      },
      {
        tactic: 'dôveryhodnosť',
        citation: citeA,
        question: `Nie je pravda, že Vaša výpoveď o type „${conflictType}" je v priamom rozpore so spisom? Citácia: ${citeA.text}.`
      }
    ];
  }

  if (modeId === 'alibi') {
    return [
      {
        tactic: 'chronológia',
        citation: citeA,
        question: `Presne o akej hodine ste podľa Vás boli na ${placeTimeA}? Overujem podľa ${citeA.text}.`
      },
      {
        tactic: 'geografia',
        citation: citeB,
        question: `Ako ste sa dostali z ${locA || 'prvého miesta'} na ${locB || 'druhé miesto'} medzi ${timeA || 'časom A'} a ${timeB || 'časom B'}? Porovnanie: ${citeB.text}.`
      },
      {
        tactic: 'nezávislé overenie',
        citation: citeA,
        question: `Kto Vás môže nezávisle potvrdiť na ${placeTimeA}? Alibi sa viaže na ${citeA.text}.`
      },
      {
        tactic: 'fyzická uskutočniteľnosť',
        citation: citeB,
        question: `Beriete na vedomie, že interval medzi tvrdeniami nemusí stačiť na presun? Detaily v ${citeB.text}${explanation ? ` — ${explanation.slice(0, 80)}` : ''}.`
      }
    ];
  }

  // mild (default)
  return [
    {
      tactic: 'objasnenie',
      citation: citeA,
      question: `Môžete, prosím, spresniť, kde ste boli v čase týkajúcom sa ${placeTimeA}? Odkaz: ${citeA.text}.`
    },
    {
      tactic: 'porovnanie výpovedí',
      citation: citeB,
      question: `Ako vnímate rozdiel oproti druhej výpovedi o ${placeTimeB}? Porovnávam s ${citeB.text}.`
    },
    {
      tactic: 'doplnenie',
      citation: citeA,
      question: `Je niečo, čo by ste chceli doplniť k bodu „${conflictType}"? Vychádzam z ${citeA.text}.`
    }
  ];
}

/**
 * Generate cross-examination questions. Uses templates; optionally tries AI and validates citations.
 */
export async function generateCrossExamination({
  target = null,
  mode = 'mild',
  documents = [],
  claims = [],
  contradictions = [],
  aiInvoke = null
} = {}) {
  const resolved = resolveMode(mode);
  const templateQs = generateTemplateQuestions({
    target,
    mode: resolved,
    documents,
    claims,
    contradictions
  });

  if (typeof aiInvoke !== 'function') {
    const validation = validateQuestionSet(templateQs);
    return {
      mode: resolved,
      questions: validation.valid,
      validation,
      source: 'template'
    };
  }

  try {
    const aiRaw = await aiInvoke({
      mode: resolved,
      target,
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title || d.file_name,
        page_number: d.page_number
      })),
      claims: claims.slice(0, 40),
      contradictions: contradictions.slice(0, 20)
    });
    const normalized = normalizeAiQuestions(aiRaw, documents, resolved);
    const validation = validateQuestionSet(normalized);
    if (validation.ok) {
      return { mode: resolved, questions: validation.valid, validation, source: 'ai' };
    }
    // Partial AI + fill gaps from templates
    const merged = [...validation.valid, ...templateQs].filter(
      (q, idx, arr) => arr.findIndex((x) => x.question === q.question) === idx
    );
    const mergedVal = validateQuestionSet(merged);
    return {
      mode: resolved,
      questions: mergedVal.valid.length ? mergedVal.valid : templateQs,
      validation: mergedVal,
      source: 'ai+template_fallback'
    };
  } catch {
    const validation = validateQuestionSet(templateQs);
    return {
      mode: resolved,
      questions: validation.valid,
      validation,
      source: 'template_fallback'
    };
  }
}

function normalizeAiQuestions(raw, documents, mode) {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.questions)
      ? raw.questions
      : [];

  return list.map((item, i) => {
    const question = typeof item === 'string' ? item : item.question || item.text || '';
    const hasExplicitCite =
      (typeof item === 'object' && item &&
        (item.citation || item.document_title || item.page != null || item.passage || item.quote)) ||
      false;

    if (!hasExplicitCite) {
      return {
        id: item?.id || `AI-${i + 1}`,
        mode: mode.id,
        modeLabel: mode.label,
        question,
        citation: { text: '' },
        citationText: '',
        tactic: item?.tactic || 'ai',
        source: 'ai'
      };
    }

    let citation =
      typeof item === 'object' && item.citation
        ? typeof item.citation === 'string'
          ? buildCitation({ source_quote: item.citation, document_title: item.document_title }, documents)
          : item.citation
        : buildCitation(
            {
              document_title: item?.document_title,
              page_number: item?.page,
              line_number: item?.line,
              source_quote: item?.passage || item?.quote || question
            },
            documents
          );

    // Empty string citation from AI counts as missing
    if (typeof item?.citation === 'string' && !String(item.citation).trim()) {
      citation = { text: '' };
    }

    const row = {
      id: item?.id || `AI-${i + 1}`,
      mode: mode.id,
      modeLabel: mode.label,
      question,
      citation,
      citationText: citation.text || '',
      tactic: item?.tactic || 'ai',
      source: 'ai'
    };
    if (citation.text && !hasValidCitation(row)) {
      row.question = `${question} [Citácia: ${citation.text}]`;
    }
    return row;
  });
}

/**
 * Optional Base44 AI invoke wrapper — returns null-friendly callable.
 */
export function createBase44CrossExamInvoker(base44Client) {
  if (!base44Client?.functions?.invoke) return null;
  return async ({ mode, target, documents, claims, contradictions }) => {
    const res = await base44Client.functions.invoke('generateCrossExamination', {
      mode: mode.id,
      modeLabel: mode.label,
      target,
      documents,
      claims,
      contradictions,
      instruction:
        'Vygeneruj súdne otázky na krížový výsluch v slovenčine. Každá otázka MUSÍ obsahovať citáciu so stranou/riadkom alebo názvom dokumentu a pasážou zo spisu. Vráť JSON { questions: [{ question, citation: { documentTitle, page, line, passage, text }, tactic }] }.'
    });
    return res?.data || res;
  };
}
