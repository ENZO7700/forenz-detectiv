import { openDB } from 'idb';

const DB_NAME = 'ForenzDetectiv_OfflineDB';
const DB_VERSION = 2;

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
  try {
    const db = await getDb();
    await db.put('documents', {
      ...doc,
      savedAt: new Date().toISOString()
    });
    if (fileBlob && doc.id) {
      await db.put('file_blobs', {
        id: doc.id,
        blob: fileBlob,
        name: doc.title,
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
    return (await db.getAll('documents')) || [];
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
  try {
    const db = await getDb();
    await db.put('cases', {
      id: caseId,
      updatedAt: new Date().toISOString(),
      ...caseData
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
    return (await db.get('cases', caseId)) || null;
  } catch (err) {
    console.warn('[OfflineDB] Nepodarilo sa načítať dáta z offline cache:', err);
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
    console.warn('[OfflineDB] Cache error:', err);
  }
}
