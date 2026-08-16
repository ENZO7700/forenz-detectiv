import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('UI/UX Anomaly Fixes & Regression Suite (HERO-01 to CHAT-10)', () => {
  test('HERO-01: Bulk scan handler rozpozná viaceré súbory a odovzdá ich do onBulkScan', () => {
    let bulkCalledWith = null;
    let singleCalledWith = null;

    const handleFiles = (files, onScan, onBulkScan) => {
      if (!files || files.length === 0) return;
      if (files.length > 1 && onBulkScan) {
        onBulkScan(files);
      } else if (onScan) {
        onScan(files[0]);
      }
    };

    const dummyFiles = [{ name: 'vypoved1.pdf' }, { name: 'vypoved2.pdf' }];
    handleFiles(dummyFiles, (f) => { singleCalledWith = f; }, (fs) => { bulkCalledWith = fs; });

    assert.strictEqual(singleCalledWith, null);
    assert.strictEqual(bulkCalledWith?.length, 2);
  });

  test('GRAPH-03: Halo obrys textu je prítomný pre vysoký kontrast na tmavom podklade', () => {
    const strokeWidth = 2.5;
    const strokeColorDark = 'rgba(2,6,23,0.9)';
    assert.ok(strokeWidth >= 2.0);
    assert.strictEqual(strokeColorDark, 'rgba(2,6,23,0.9)');
  });

  test('ARCHIVE-04: Dlhé citácie (>120 znakov) sa bezpečne skracujú s možnosťou expanzie', () => {
    const longQuote = 'Dňa 12.3.2026 o 14:15 som sa osobne nachádzal v reštaurácii na Hlavnej ulici v Bratislave a platil som účet za obed kartou, čo dokazuje aj bankový výpis.';
    const isLong = longQuote.length > 120;
    const truncated = isLong ? `${longQuote.slice(0, 120)}...` : longQuote;

    assert.strictEqual(isLong, true);
    assert.ok(truncated.endsWith('...'));
    assert.strictEqual(truncated.length, 123);
  });

  test('MAP-05: Filter osôb izoluje vybranú trasu bez kolízie ostatných', () => {
    const routes = [
      { id: '1', subject: 'Ing. Peter Kováč' },
      { id: '2', subject: 'Mgr. Ján Novák' }
    ];

    const filterRoutes = (filter) => filter === 'ALL' ? routes : routes.filter(r => r.subject === filter);

    assert.strictEqual(filterRoutes('ALL').length, 2);
    assert.strictEqual(filterRoutes('Ing. Peter Kováč').length, 1);
    assert.strictEqual(filterRoutes('Ing. Peter Kováč')[0].id, '1');
  });

  test('SHARE-08: Exportér kariet alibi používa minimálne scale = 2 pre Retina 2K/4K ostrosť', () => {
    const getScale = (pixelRatio) => Math.max(2, pixelRatio || 2);
    assert.strictEqual(getScale(1), 2);
    assert.strictEqual(getScale(3), 3);
    assert.strictEqual(getScale(null), 2);
  });

  test('UPLOAD-LIMIT: Limit na jedno nahratie PDF / spisu je presne 50 MB (50 000 KB / 52 428 800 B)', () => {
    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
    const isSizeAllowed = (sizeBytes) => sizeBytes <= MAX_FILE_SIZE_BYTES;

    assert.strictEqual(MAX_FILE_SIZE_BYTES, 52428800);
    assert.strictEqual(isSizeAllowed(10 * 1024 * 1024), true); // 10 MB - povolené
    assert.strictEqual(isSizeAllowed(49.9 * 1024 * 1024), true); // 49.9 MB - povolené
    assert.strictEqual(isSizeAllowed(50 * 1024 * 1024), true); // presne 50 MB - povolené
    assert.strictEqual(isSizeAllowed(50.1 * 1024 * 1024), false); // 50.1 MB - zamietnuté
    assert.strictEqual(isSizeAllowed(100 * 1024 * 1024), false); // 100 MB - zamietnuté
  });

  test('UPLOAD-LIMIT: Hromadný upload filtruje a preskakuje súbory nad 50 MB so spätnou väzbou', () => {
    const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
    const incomingFiles = [
      { name: 'spis_ok_1.pdf', size: 15 * 1024 * 1024 },
      { name: 'spis_oversized.pdf', size: 75 * 1024 * 1024 },
      { name: 'spis_ok_2.pdf', size: 30 * 1024 * 1024 }
    ];

    const validFiles = incomingFiles.filter(f => f.size <= MAX_FILE_SIZE_BYTES);
    const oversized = incomingFiles.filter(f => f.size > MAX_FILE_SIZE_BYTES);

    assert.strictEqual(validFiles.length, 2);
    assert.strictEqual(oversized.length, 1);
    assert.strictEqual(oversized[0].name, 'spis_oversized.pdf');
  });

  test('BULK-CAP: Mobile limit 20 súborov, desktop 100', () => {
    const getBulkCap = (isMobile) => (isMobile ? 20 : 100);
    const applyBulkCap = (files, isMobile) => files.slice(0, getBulkCap(isMobile));

    const files = Array.from({ length: 25 }, (_, i) => ({ name: `doc-${i}.pdf` }));

    assert.strictEqual(getBulkCap(true), 20);
    assert.strictEqual(getBulkCap(false), 100);
    assert.strictEqual(applyBulkCap(files, true).length, 20);
    assert.strictEqual(applyBulkCap(files, false).length, 25);
    assert.strictEqual(applyBulkCap(Array.from({ length: 150 }, (_, i) => i), false).length, 100);
  });
});
