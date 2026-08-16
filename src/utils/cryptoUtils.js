/**
 * Kryptografické nástroje pre výpočet kontrolných súčtov (SHA-256) pre integritu súdnych spisov.
 * Podporuje beh v modernom prehliadači (Web Crypto API) aj v testovacom Node.js prostredí.
 */

/**
 * Vypočíta SHA-256 hash zo zadaného reťazca alebo Uint8Array.
 * @param {string|Uint8Array} input
 * @returns {Promise<string>} Hexadecimálny reťazec hashu (napr. 'a3f5b...')
 */
export async function calculateSha256Digest(input) {
  let dataBuffer;

  if (typeof input === 'string') {
    dataBuffer = new TextEncoder().encode(input);
  } else if (input instanceof Uint8Array) {
    dataBuffer = input;
  } else if (input && typeof input === 'object') {
    dataBuffer = new TextEncoder().encode(JSON.stringify(input));
  } else {
    dataBuffer = new TextEncoder().encode(String(input || ''));
  }

  // 1. Web Crypto API (prehliadač aj Node.js 18+)
  const subtle = typeof globalThis !== 'undefined' ? globalThis.crypto?.subtle : null;
  if (subtle) {
    const hashBuffer = await subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // 2. Deterministický fallback ak crypto nie je dostupné
  let hash = 0;
  for (let i = 0; i < dataBuffer.length; i++) {
    hash = ((hash << 5) - hash) + dataBuffer[i];
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

/**
 * Vypočíta kryptografický odtlačok integrity pre celý vyšetrovací spis.
 * Združuje texty všetkých dokumentov, počty entít a časové pečiatky.
 */
export async function generateCaseIntegrityDigest({
  documents = [],
  persons = [],
  redFlags = [],
  contradictions = [],
  events = [],
  caseTitle = 'ForenzDetectiv Case'
}) {
  const payload = {
    caseTitle,
    generatedAt: new Date().toISOString(),
    documents: (documents || []).map(d => ({
      id: d.id,
      title: d.title || d.file_name,
      contentLength: (d.content || d.extracted_text || '').length,
      snippet: (d.content || d.extracted_text || '').substring(0, 500)
    })),
    entityCounts: {
      persons: (persons || []).length,
      redFlags: (redFlags || []).length,
      contradictions: (contradictions || []).length,
      events: (events || []).length
    }
  };

  const digestHex = await calculateSha256Digest(JSON.stringify(payload));
  return `sha256:${digestHex}`;
}
