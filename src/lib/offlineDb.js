import { openDB } from 'idb';

const DB_NAME = 'ForenzDetectiv_OfflineDB';
const DB_VERSION = 2;

let dbPromise = null;

function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function asString(value, fallback = '') {
  if (value == null) return fallback;
  return String(value);
}

function sanitizeEntityList(list, sanitizer) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    const cleaned = sanitizer(item);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

function sanitizeWithId(item) {
  if (!isRecord(item)) return null;
  const id = asString(item.id).trim();
  if (!id) return null;
  return { ...item, id };
}

/** Valid document for offline storage — requires id + title */
export function sanitizeDocument(doc) {
  if (!isRecord(doc)) return null;
  const id = asString(doc.id).trim();
  const title = asString(doc.title).trim();
  if (!id || !title) return null;
  return {
    ...doc,
    id,
    title,
    status: asString(doc.status, 'pending') || 'pending',
    image_url: doc.image_url ?? null,
    source_kind: doc.source_kind ?? 'upload',
    created_date: doc.created_date || new Date().toISOString()
  };
}

export function sanitizePerson(person) {
  if (!isRecord(person)) return null;
  const id = asString(person.id).trim();
  const name = asString(person.name).trim();
  if (!id || !name) return null;
  return { ...person, id, name };
}

export function sanitizeEvent(event) {
  if (!isRecord(event)) return null;
  const id = asString(event.id).trim() || `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const persons = Array.isArray(event.persons)
    ? event.persons.filter((p) => typeof p === 'string' && p.trim()).map((p) => p.trim())
    : [];
  return { ...event, id, persons };
}

export function sanitizeLocation(loc) {
  if (!isRecord(loc)) return null;
  const name = asString(loc.name || loc.address).trim();
  if (!name) return null;
  const id = asString(loc.id).trim() || name;
  return { ...loc, id, name };
}

export function sanitizeClaim(claim) {
  if (!isRecord(claim)) return null;
  const id = asString(claim.id).trim();
  if (!id) return null;
  return { ...claim, id };
}

const CASE_ENTITY_KEYS = [
  'documents',
  'persons',
  'relationships',
  'redFlags',
  'flaggedPassages',
  'claims',
  'events',
  'locations',
  'vehicles',
  'contradictions',
  'overrides'
];

/** True when legacy IDB stored an entity list as a non-array (e.g. object after a bad write). */
export function casePayloadNeedsRepair(raw = {}) {
  if (!isRecord(raw)) return true;
  return CASE_ENTITY_KEYS.some((key) => {
    const val = raw[key];
    return val != null && !Array.isArray(val);
  });
}

/** Strip null entries and incomplete entities from a case snapshot */
export function sanitizeCasePayload(raw = {}) {
  if (!isRecord(raw)) {
    return {
      documents: [],
      persons: [],
      relationships: [],
      redFlags: [],
      flaggedPassages: [],
      claims: [],
      events: [],
      locations: [],
      vehicles: [],
      contradictions: [],
      overrides: []
    };
  }

  return {
    documents: sanitizeEntityList(raw.documents, sanitizeDocument),
    persons: sanitizeEntityList(raw.persons, sanitizePerson),
    relationships: sanitizeEntityList(raw.relationships, sanitizeWithId),
    redFlags: sanitizeEntityList(raw.redFlags, sanitizeWithId),
    flaggedPassages: sanitizeEntityList(raw.flaggedPassages, sanitizeWithId),
    claims: sanitizeEntityList(raw.claims, sanitizeClaim),
    events: sanitizeEntityList(raw.events, sanitizeEvent),
    locations: sanitizeEntityList(raw.locations, sanitizeLocation),
    vehicles: sanitizeEntityList(raw.vehicles, sanitizeWithId),
    contradictions: sanitizeEntityList(raw.contradictions, sanitizeWithId),
    overrides: sanitizeEntityList(raw.overrides, sanitizeWithId)
  };
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('cases')) {
          db.createObjectStore('cases', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('by_doc_id', 'id', { unique: true });
        }
        if (!db.objectStoreNames.contains('analysis_cache')) {
          db.createObjectStore('analysis_cache', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('file_blobs')) {
          db.createObjectStore('file_blobs', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

// Uloženie dokumentu a súboru do IndexedDB (kapacita 50 MB - 1 GB+)
export async function saveDocumentOffline(doc, fileBlob = null) {
  const clean = sanitizeDocument(doc);
  if (!clean) {
    console.warn('[OfflineDB] Preskočené uloženie nekompletného dokumentu (chýba id/title)');
    return false;
  }
  try {
    const db = await getDb();
    await db.put('documents', {
      ...clean,
      savedAt: new Date().toISOString()
    });
    if (fileBlob && clean.id) {
      await db.put('file_blobs', {
        id: clean.id,
        blob: fileBlob,
        name: clean.title,
        type: fileBlob.type || 'application/pdf',
        size: fileBlob.size
      });
    }
    return true;
  } catch (err) {
    console.warn('[OfflineDB] Uloženie dokumentu do IndexedDB zlyhalo:', err);
    return false;
  }
}

// Načítanie všetkých offline dokumentov
export async function getAllDocumentsOffline() {
  try {
    const db = await getDb();
    const raw = (await db.getAll('documents')) || [];
    return sanitizeEntityList(raw, sanitizeDocument);
  } catch (err) {
    console.warn('[OfflineDB] Načítanie dokumentov zlyhalo:', err);
    return [];
  }
}

// Načítanie súborového blobu z IndexedDB
export async function getFileBlobOffline(docId) {
  try {
    const db = await getDb();
    return (await db.get('file_blobs', docId)) || null;
  } catch (err) {
    console.warn('[OfflineDB] Načítanie blobu zlyhalo:', err);
    return null;
  }
}

// Uloženie kompletného vyšetrovacieho spisu offline
export async function saveCaseOffline(caseId = 'current', caseData = {}) {
  const sanitized = sanitizeCasePayload(caseData);
  try {
    const db = await getDb();
    await db.put('cases', {
      id: caseId,
      updatedAt: new Date().toISOString(),
      ...sanitized
    });
    return true;
  } catch (err) {
    console.warn('[OfflineDB] Nepodarilo sa uložiť dáta do offline cache:', err);
    return false;
  }
}

// Načítanie vyšetrovacieho spisu z offline cache
export async function getCaseOffline(caseId = 'current') {
  try {
    const db = await getDb();
    const raw = (await db.get('cases', caseId)) || null;
    if (!raw) return null;
    const { id, updatedAt, savedAt, ...payload } = raw;
    const sanitized = sanitizeCasePayload(payload);
    const needsRepair = casePayloadNeedsRepair(payload);
    const dropped =
      (Array.isArray(payload.documents) ? payload.documents.length : 0) - sanitized.documents.length +
      (Array.isArray(payload.persons) ? payload.persons.length : 0) - sanitized.persons.length +
      (Array.isArray(payload.events) ? payload.events.length : 0) - sanitized.events.length +
      (Array.isArray(payload.locations) ? payload.locations.length : 0) - sanitized.locations.length;
    if (dropped > 0 || needsRepair) {
      if (dropped > 0) {
        console.warn(`[OfflineDB] Odstránených ${dropped} nekompletných záznamov z offline cache`);
      }
      if (needsRepair) {
        console.warn('[OfflineDB] Opravená poškodená štruktúra offline cache (entity pole nebolo pole)');
      }
      await saveCaseOffline(caseId, sanitized);
    }
    return { id, updatedAt, ...sanitized };
  } catch (err) {
    console.warn('[OfflineDB] Nepodarilo sa načítať dáta z offline cache:', err);
    return null;
  }
}

/** Odstráni nekompletné dokumenty z documents store */
export async function purgeInvalidOfflineDocuments() {
  try {
    const db = await getDb();
    const raw = (await db.getAll('documents')) || [];
    let removed = 0;
    for (const doc of raw) {
      if (!sanitizeDocument(doc)) {
        await db.delete('documents', doc.id);
        if (doc?.id) await db.delete('file_blobs', doc.id);
        removed += 1;
      }
    }
    return removed;
  } catch (err) {
    console.warn('[OfflineDB] Purge invalid documents failed:', err);
    return 0;
  }
}

// Uloženie OCR extrakcie pre rýchly offline prístup
export async function cacheAnalysisOffline(documentId, data) {
  if (!documentId) return;
  try {
    const db = await getDb();
    await db.put('analysis_cache', {
      key: `analysis_${documentId}`,
      documentId,
      data,
      cachedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[OfflineDB] Cache error:', err);
  }
}
