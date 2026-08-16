/**
 * Minimal deterministic ZIP (STORE / no compression) for court dossier packages.
 * CRC-32 + local/central headers; timestamps are fixed for integrity reproducibility.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function encodeUtf8(str) {
  return new TextEncoder().encode(String(str ?? ''));
}

function u16(n) {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n >>> 0, true);
  return b;
}

function u32(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0, true);
  return b;
}

function concat(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Build a ZIP archive from named file entries.
 * @param {Array<{ name: string, data: Uint8Array|string }>} entries
 * @returns {Uint8Array}
 */
export function buildZipStore(entries = []) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  // Fixed DOS datetime: 2026-08-16 12:00:00 → reproducible archives
  const dosTime = (12 << 11) | (0 << 5) | (0 >> 1); // 12:00:00
  const dosDate = ((2026 - 1980) << 9) | (8 << 5) | 16;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const data =
      typeof entry.data === 'string'
        ? encodeUtf8(entry.data)
        : entry.data instanceof Uint8Array
          ? entry.data
          : new Uint8Array(entry.data || []);

    const checksum = crc32(data);
    const localHeader = concat([
      u32(0x04034b50),
      u16(20), // version needed
      u16(0), // flags
      u16(0), // STORE
      u16(dosTime),
      u16(dosDate),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0), // extra
      nameBytes
    ]);

    const centralHeader = concat([
      u32(0x02014b50),
      u16(20), // version made by
      u16(20), // version needed
      u16(0),
      u16(0),
      u16(dosTime),
      u16(dosDate),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes
    ]);

    localParts.push(localHeader, data);
    centralParts.push(centralHeader);
    offset += localHeader.length + data.length;
  }

  const centralDir = concat(centralParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDir.length),
    u32(offset),
    u16(0)
  ]);

  return concat([...localParts, centralDir, end]);
}

/**
 * Parse ZIP STORE archive into name → bytes map (for tests / verification).
 * @param {Uint8Array} zipBytes
 * @returns {Record<string, Uint8Array>}
 */
export function listZipStoreEntries(zipBytes) {
  const view = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
  const files = {};
  let i = 0;
  while (i + 30 <= zipBytes.length) {
    const sig = view.getUint32(i, true);
    if (sig !== 0x04034b50) break;
    const compression = view.getUint16(i + 8, true);
    const compSize = view.getUint32(i + 18, true);
    const nameLen = view.getUint16(i + 26, true);
    const extraLen = view.getUint16(i + 28, true);
    const nameStart = i + 30;
    const name = new TextDecoder().decode(zipBytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    const data = zipBytes.subarray(dataStart, dataStart + compSize);
    if (compression !== 0) {
      throw new Error(`Unsupported ZIP compression method ${compression} for ${name}`);
    }
    files[name] = new Uint8Array(data);
    i = dataStart + compSize;
  }
  return files;
}
