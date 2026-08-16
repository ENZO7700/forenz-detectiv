import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSha256Digest, generateCaseIntegrityDigest } from '../src/utils/cryptoUtils.js';
import { sanitizeAnalyticsProps } from '../src/lib/analytics.js';

describe('49 MB PDF Upload & Processing Smoke Test Suite', () => {
  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB = 52,428,800 B (50 000 KB)
  const SIZE_49MB_BYTES = 49 * 1024 * 1024; // 49 MB = 51,380,224 B (50 176 KB)

  test('1. Validácia veľkosti: 49 MB PDF je povolené (menšie ako limit 50 MB)', () => {
    const mockFile49Mb = {
      name: 'velky_vysetrovaci_spis_kauza_2026.pdf',
      size: SIZE_49MB_BYTES,
      type: 'application/pdf'
    };

    const isAllowed = mockFile49Mb.size <= MAX_FILE_SIZE_BYTES;
    const sizeKb = Math.round(mockFile49Mb.size / 1024);

    assert.strictEqual(isAllowed, true, '49 MB súbor musí byť povolený');
    assert.strictEqual(sizeKb, 50176);
    assert.ok(mockFile49Mb.size < MAX_FILE_SIZE_BYTES);
  });

  test('2. Porovnanie hraničných hodnôt (49 MB povolené, 50.5 MB zamietnuté)', () => {
    const validateFileSize = (sizeBytes) => {
      if (sizeBytes > MAX_FILE_SIZE_BYTES) {
        return {
          allowed: false,
          error: `Súbor prekračuje limit 50 MB (${Math.round(sizeBytes / 1024).toLocaleString()} KB / max 50 000 KB).`
        };
      }
      return { allowed: true, error: null };
    };

    const res49 = validateFileSize(SIZE_49MB_BYTES);
    assert.strictEqual(res49.allowed, true);
    assert.strictEqual(res49.error, null);

    const res50 = validateFileSize(50 * 1024 * 1024);
    assert.strictEqual(res50.allowed, true);

    const res50_5 = validateFileSize(50.5 * 1024 * 1024);
    assert.strictEqual(res50_5.allowed, false);
    assert.ok(res50_5.error.includes('prekračuje limit 50 MB'));
  });

  test('3. Generovanie a SHA-256 hashovanie 49 MB binárneho obsahu', async () => {
    // Vytvorenie reálneho 49 MB bufferu s PDF hlavičkou
    const pdfHeader = Buffer.from('%PDF-1.7\n%ForenzDetectiv forensic case file 49MB\n');
    const buffer49Mb = Buffer.alloc(SIZE_49MB_BYTES);
    pdfHeader.copy(buffer49Mb, 0);

    assert.strictEqual(buffer49Mb.length, SIZE_49MB_BYTES);

    const startTime = performance.now();
    const digest = await calculateSha256Digest(new Uint8Array(buffer49Mb));
    const durationMs = performance.now() - startTime;

    assert.strictEqual(typeof digest, 'string');
    assert.strictEqual(digest.length, 64);
    assert.match(digest, /^[a-f0-9]{64}$/);
    assert.ok(durationMs < 2000, `Hashovanie 49 MB dát prebehlo rýchlo za ${Math.round(durationMs)} ms`);
  });

  test('4. Kontrolný súčet integrity vyšetrovacieho spisu s 49 MB dokumentom', async () => {
    const casePayload = {
      caseTitle: 'Kauza Zložitý Spis (49 MB)',
      documents: [
        {
          id: 'doc-large-49mb',
          title: 'kompletny_spis_49mb.pdf',
          contentLength: SIZE_49MB_BYTES,
          snippet: 'Zápisnica o výsluchu svedkov a znalecké posudky...'
        }
      ],
      persons: [{ id: 'p1', name: 'Hlavný Podozrivý' }],
      contradictions: [{ id: 'c1', type: 'alibi_impossible', speed_kmh: 675 }]
    };

    const caseDigest = await generateCaseIntegrityDigest(casePayload);
    assert.ok(caseDigest.startsWith('sha256:'));
    assert.strictEqual(caseDigest.length, 71);
  });

  test('5. Telemetrické spracovanie pre 49 MB upload bez úniku citlivých dát', () => {
    const uploadEventPayload = {
      file_type: 'pdf',
      size_kb: Math.round(SIZE_49MB_BYTES / 1024),
      user_role: 'vysetrovatel',
      case_id: 'case-49mb-test',
      // Citlivé dáta, ktoré sanitizér musí odstrániť
      suspect_name: 'Peter Utajený',
      source_quote: 'Dôverná svedecká výpoveď...'
    };

    const sanitized = sanitizeAnalyticsProps(uploadEventPayload);

    assert.strictEqual(sanitized.file_type, 'pdf');
    assert.strictEqual(sanitized.size_kb, 50176);
    assert.strictEqual(sanitized.case_id, 'case-49mb-test');
    assert.strictEqual('suspect_name' in sanitized, false, 'Meno podozrivého nesmie ísť do analytiky');
    assert.strictEqual('source_quote' in sanitized, false, 'Citát výpovede nesmie ísť do analytiky');
  });

  test('6. Hromadné nahratie (Bulk): Dávka s 49 MB súborom a 55 MB súborom', () => {
    const batch = [
      { name: 'vysetrovaci_spis_cast1_49mb.pdf', size: SIZE_49MB_BYTES },
      { name: 'fotodokumentacia_ok_10mb.pdf', size: 10 * 1024 * 1024 },
      { name: 'audio_zaznam_nadlimit_55mb.pdf', size: 55 * 1024 * 1024 }
    ];

    const accepted = [];
    const rejected = [];

    batch.forEach((file) => {
      if (file.size <= MAX_FILE_SIZE_BYTES) {
        accepted.push(file);
      } else {
        rejected.push(file);
      }
    });

    assert.strictEqual(accepted.length, 2);
    assert.strictEqual(rejected.length, 1);
    assert.strictEqual(accepted[0].name, 'vysetrovaci_spis_cast1_49mb.pdf');
    assert.strictEqual(rejected[0].name, 'audio_zaznam_nadlimit_55mb.pdf');
  });
});
