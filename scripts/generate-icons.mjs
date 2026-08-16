/**
 * Regeneruje simplified slate/amber PNG ikony pre PWA/TWA.
 * Použitie: node scripts/generate-icons.mjs
 */
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/icons');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([len, typeB, data, crc]);
}

function png(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0;
    for (let x = 0; x < size; x++) {
      const cx = size / 2;
      const cy = size / 2;
      const d = Math.hypot(x - cx, y - cy);
      const i = y * (1 + size * 3) + 1 + x * 3;
      if (d < size * 0.38) {
        raw[i] = 245; raw[i + 1] = 158; raw[i + 2] = 11;
      } else if (d < size * 0.46) {
        raw[i] = 15; raw[i + 1] = 23; raw[i + 2] = 42;
      } else {
        raw[i] = 2; raw[i + 1] = 6; raw[i + 2] = 23;
      }
    }
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'icon-192.png'), png(192));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png(512));
console.log('Wrote icon-192.png and icon-512.png to public/icons/');
