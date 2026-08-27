/**
 * Post-bulk-upload sync helpers — guest/offline must not call cloud fetch
 * (fetchData overwrites locally created documents with stale/empty cache).
 */

export function shouldSyncBulkViaOfflineOnly({ localOnlyCount, cloudCount }) {
  return localOnlyCount > 0 && cloudCount === 0;
}

export function buildBulkOfflineSuccessMessage(count) {
  if (count === 1) {
    return 'Spis bol načítaný a bezpečne uložený do lokálneho archívu (IndexedDB). AI analýza vyžaduje pripojenie na server.';
  }
  return `${count} súborov bolo načítaných a uložených do lokálneho archívu (IndexedDB). AI analýza vyžaduje pripojenie na server.`;
}

export function buildBulkAnalyzeFailureMessage(failedCount) {
  if (!failedCount || failedCount <= 0) return null;
  if (failedCount === 1) {
    return 'Jeden súbor bol uložený, ale AI analýza zlyhala — skúste to znova po pripojení na server.';
  }
  return `${failedCount} súborov bolo uložených, ale AI analýza zlyhala — skúste to znova po pripojení na server.`;
}

/** Strip transient flags before persisting a case snapshot. */
export function casePayloadFromStore(state) {
  const stripLocal = (doc) => {
    if (!doc || typeof doc !== 'object') return doc;
    const { __localOnly, ...rest } = doc;
    return rest;
  };
  return {
    documents: (state.documents || []).map(stripLocal),
    persons: state.persons || [],
    relationships: state.relationships || [],
    redFlags: state.redFlags || [],
    flaggedPassages: state.flaggedPassages || [],
    claims: state.claims || [],
    events: state.events || [],
    locations: state.locations || [],
    vehicles: state.vehicles || [],
    contradictions: state.contradictions || [],
    overrides: state.overrides || []
  };
}

/** Re-merge locally created docs after a cloud fetch (mixed online/offline batch). */
export function mergeLocalDocuments(existingDocs, localSnapshots) {
  const current = Array.isArray(existingDocs) ? existingDocs : [];
  const locals = Array.isArray(localSnapshots) ? localSnapshots : [];
  if (!locals.length) return current;
  const ids = new Set(current.map((d) => d?.id).filter(Boolean));
  const toAdd = locals.filter((d) => d?.id && !ids.has(d.id));
  return toAdd.length ? [...toAdd, ...current] : current;
}

/**
 * After a cloud fetch returns empty/stale data, preserve in-memory or offline docs
 * so guest uploads are not wiped (regression: fetchData overwrote local txt/png docs).
 */
export function mergeCloudCaseWithLocal(cloudPayload, localPayload) {
  const cloud = cloudPayload && typeof cloudPayload === 'object' ? cloudPayload : {};
  const local = localPayload && typeof localPayload === 'object' ? localPayload : {};
  const cloudDocs = Array.isArray(cloud.documents) ? cloud.documents : [];
  const localDocs = Array.isArray(local.documents) ? local.documents : [];

  const cloudEmpty =
    cloudDocs.length === 0 &&
    !(Array.isArray(cloud.persons) && cloud.persons.length) &&
    !(Array.isArray(cloud.events) && cloud.events.length) &&
    !(Array.isArray(cloud.claims) && cloud.claims.length);

  if (!cloudEmpty || !localDocs.length) {
    return {
      ...cloud,
      documents: mergeLocalDocuments(cloudDocs, localDocs)
    };
  }

  return {
    ...cloud,
    documents: mergeLocalDocuments(cloudDocs, localDocs),
    persons: mergeLocalDocuments(cloud.persons || [], local.persons || []),
    relationships: mergeLocalDocuments(cloud.relationships || [], local.relationships || []),
    redFlags: mergeLocalDocuments(cloud.redFlags || [], local.redFlags || []),
    flaggedPassages: mergeLocalDocuments(cloud.flaggedPassages || [], local.flaggedPassages || []),
    claims: mergeLocalDocuments(cloud.claims || [], local.claims || []),
    events: mergeLocalDocuments(cloud.events || [], local.events || []),
    locations: mergeLocalDocuments(cloud.locations || [], local.locations || []),
    vehicles: mergeLocalDocuments(cloud.vehicles || [], local.vehicles || []),
    contradictions: mergeLocalDocuments(cloud.contradictions || [], local.contradictions || []),
    overrides: mergeLocalDocuments(cloud.overrides || [], local.overrides || [])
  };
}

/** Whether a post-upload refresh should skip cloud fetchData (guest/offline-only batch). */
export function shouldSkipFetchAfterUpload({ localOnlyCount = 0, cloudCount = 0, guestOffline = false } = {}) {
  if (guestOffline) return true;
  return shouldSyncBulkViaOfflineOnly({ localOnlyCount, cloudCount });
}
