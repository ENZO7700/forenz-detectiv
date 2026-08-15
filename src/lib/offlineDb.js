import { openDB } from 'idb';

const DB_NAME = 'ForenzDetectiv_OfflineDB';
const DB_VERSION = 1;

let dbPromise = null;

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
      }
    });
  }
  return dbPromise;
}

// Uloženie kompletného vyšetrovacieho spisu offline
export async function saveCaseOffline(caseId = 'current', caseData = {}) {
  try {
    const db = await getDb();
    await db.put('cases', {
      id: caseId,
      updatedAt: new Date().toISOString(),
      ...caseData
    });
    return true;
  } catch (err) {
    console.warn('Nepodarilo sa uložiť dáta do offline cache:', err);
    return false;
  }
}

// Načítanie vyšetrovacieho spisu z offline cache
export async function getCaseOffline(caseId = 'current') {
  try {
    const db = await getDb();
    return (await db.get('cases', caseId)) || null;
  } catch (err) {
    console.warn('Nepodarilo sa načítať dáta z offline cache:', err);
    return null;
  }
}

// Uloženie OCR extrakcie pre rýchly offline prístup
export async function cacheAnalysisOffline(documentId, data) {
  try {
    const db = await getDb();
    await db.put('analysis_cache', {
      key: `analysis_${documentId}`,
      documentId,
      data,
      cachedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Cache error:', err);
  }
}
