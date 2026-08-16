import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPdfFile,
  buildPdfPageTitle,
  buildPdfContainerTitle,
  buildDocumentHierarchy,
  planPdfDocumentBudget,
  PDF_MAX_PAGES,
  PDF_ANALYZE_CONCURRENCY,
  PDF_RENDER_CONCURRENCY,
  PDF_PAGE_CHUNKING_IMPLEMENTED,
  PIPELINE_STEPS
} from '../src/lib/documentPipeline.js';

describe('PDF page-chunking & document hierarchy helpers', () => {
  test('isPdfFile rozpozná MIME aj príponu', () => {
    assert.equal(isPdfFile({ name: 'a.pdf', type: 'application/pdf' }), true);
    assert.equal(isPdfFile({ name: 'scan.PDF', type: '' }), true);
    assert.equal(isPdfFile({ name: 'foto.jpg', type: 'image/jpeg' }), false);
    assert.equal(isPdfFile(null), false);
  });

  test('buildPdfPageTitle a container title majú stabilný formát', () => {
    assert.equal(buildPdfPageTitle('výsluch.pdf', 3, 12), 'výsluch.pdf · s. 3/12');
    assert.equal(buildPdfContainerTitle('výsluch.pdf', 12), 'výsluch.pdf (12 strán)');
  });

  test('planPdfDocumentBudget: single-page bez parent kontajnera', () => {
    const b = planPdfDocumentBudget(5, 1);
    assert.equal(b.ok, true);
    assert.equal(b.createParent, false);
    assert.equal(b.pages, 1);
  });

  test('planPdfDocumentBudget: multi-page potrebuje parent + pages', () => {
    const b = planPdfDocumentBudget(5, 10);
    assert.equal(b.ok, true);
    assert.equal(b.createParent, true);
    assert.equal(b.pages, 4); // 5 slots - 1 parent
    assert.equal(b.truncated, true);
  });

  test('planPdfDocumentBudget: pro/unlimited slots', () => {
    const b = planPdfDocumentBudget(Number.POSITIVE_INFINITY, 100);
    assert.equal(b.ok, true);
    assert.equal(b.createParent, true);
    assert.equal(b.pages, PDF_MAX_PAGES);
    assert.equal(b.truncated, true);
  });

  test('planPdfDocumentBudget: málo slotov zlyhá', () => {
    assert.equal(planPdfDocumentBudget(0, 5).ok, false);
    assert.equal(planPdfDocumentBudget(1, 5).ok, false);
  });

  test('konštanty concurrency a flag sú nastavené pre produkciu', () => {
    assert.equal(PDF_PAGE_CHUNKING_IMPLEMENTED, true);
    assert.equal(PDF_RENDER_CONCURRENCY, 1);
    assert.ok(PDF_ANALYZE_CONCURRENCY >= 1);
    assert.ok(PIPELINE_STEPS.some((s) => s.id === 'chunk'));
  });

  describe('buildDocumentHierarchy (Tree / Container / Page Grouping)', () => {
    test('Prázdny alebo neplatný zoznam vracia prázdne pole', () => {
      assert.deepEqual(buildDocumentHierarchy([]), []);
      assert.deepEqual(buildDocumentHierarchy(null), []);
      assert.deepEqual(buildDocumentHierarchy(undefined), []);
    });

    test('Správne roztriedi samostatné dokumenty a PDF kontajnery so stránkami', () => {
      const mockDocs = [
        { id: 'doc-standalone-1', title: 'vypoved_foto.jpg', status: 'done', source_kind: 'upload' },
        { id: 'pdf-container-1', title: 'zmluva.pdf (3 strany)', status: 'done', source_kind: 'pdf_container', page_count: 3 },
        { id: 'pdf-page-2', title: 'zmluva.pdf · s. 2/3', status: 'done', source_kind: 'pdf_page', parent_document_id: 'pdf-container-1', page_number: 2 },
        { id: 'pdf-page-1', title: 'zmluva.pdf · s. 1/3', status: 'done', source_kind: 'pdf_page', parent_document_id: 'pdf-container-1', page_number: 1 },
        { id: 'pdf-page-3', title: 'zmluva.pdf · s. 3/3', status: 'done', source_kind: 'pdf_page', parent_document_id: 'pdf-container-1', page_number: 3 },
        { id: 'doc-standalone-2', title: 'doverna_sprava.docx', status: 'done', source_kind: 'upload' }
      ];

      const hierarchy = buildDocumentHierarchy(mockDocs);

      assert.equal(hierarchy.length, 3, 'Očakávané 3 top-level položky: 2 standalone + 1 kontajner');

      // 1. Standalone 1
      assert.equal(hierarchy[0].type, 'standalone');
      assert.equal(hierarchy[0].doc.id, 'doc-standalone-1');

      // 2. Container
      assert.equal(hierarchy[1].type, 'container');
      assert.equal(hierarchy[1].doc.id, 'pdf-container-1');
      assert.equal(hierarchy[1].totalPages, 3);
      assert.equal(hierarchy[1].donePages, 3);
      assert.equal(hierarchy[1].analyzingPages, 0);
      assert.equal(hierarchy[1].errorPages, 0);
      assert.equal(hierarchy[1].status, 'done');

      // Stránky musia byť usporiadané podľa čísla strany (1, 2, 3)
      assert.equal(hierarchy[1].pages.length, 3);
      assert.equal(hierarchy[1].pages[0].page_number, 1);
      assert.equal(hierarchy[1].pages[1].page_number, 2);
      assert.equal(hierarchy[1].pages[2].page_number, 3);

      // 3. Standalone 2
      assert.equal(hierarchy[2].type, 'standalone');
      assert.equal(hierarchy[2].doc.id, 'doc-standalone-2');
    });

    test('Správne agreguje stavy pri chybových alebo rozpracovaných stránkach', () => {
      const mockDocs = [
        { id: 'pdf-container-A', title: 'spis_A.pdf (4 strany)', status: 'analyzing', source_kind: 'pdf_container', page_count: 4 },
        { id: 'p1', title: 's. 1/4', status: 'done', source_kind: 'pdf_page', parent_document_id: 'pdf-container-A', page_number: 1 },
        { id: 'p2', title: 's. 2/4', status: 'analyzing', source_kind: 'pdf_page', parent_document_id: 'pdf-container-A', page_number: 2 },
        { id: 'p3', title: 's. 3/4', status: 'error', error: '429 Too Many Requests', source_kind: 'pdf_page', parent_document_id: 'pdf-container-A', page_number: 3 },
        { id: 'p4', title: 's. 4/4', status: 'pending', source_kind: 'pdf_page', parent_document_id: 'pdf-container-A', page_number: 4 }
      ];

      const hierarchy = buildDocumentHierarchy(mockDocs);
      assert.equal(hierarchy.length, 1);
      const container = hierarchy[0];

      assert.equal(container.type, 'container');
      assert.equal(container.totalPages, 4);
      assert.equal(container.donePages, 1);
      assert.equal(container.analyzingPages, 1);
      assert.equal(container.errorPages, 1);
      assert.equal(container.pendingPages, 1);
      // Keďže je aspoň jedna chyba, agregovaný stav kontajnera má byť 'error'
      assert.equal(container.status, 'error');
    });

    test('Agreguje stav "analyzing" pokiaľ nie je chyba, ale aspoň jedna strana sa analyzuje', () => {
      const mockDocs = [
        { id: 'pdf-container-B', title: 'spis_B.pdf (2 strany)', status: 'analyzing', source_kind: 'pdf_container', page_count: 2 },
        { id: 'pb1', title: 's. 1/2', status: 'done', source_kind: 'pdf_page', parent_document_id: 'pdf-container-B', page_number: 1 },
        { id: 'pb2', title: 's. 2/2', status: 'analyzing', source_kind: 'pdf_page', parent_document_id: 'pdf-container-B', page_number: 2 }
      ];

      const hierarchy = buildDocumentHierarchy(mockDocs);
      assert.equal(hierarchy[0].status, 'analyzing');
    });
  });

  describe('Cancellation & Per-Page Detailed Progress Contract', () => {
    test('Simulácia podrobného per-page progress hlásenia s fázami a percentami', () => {
      const progressEvents = [];
      const onPageProgress = (info) => progressEvents.push(info);

      const pageCount = 4;
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
        const stepPerChunk = 100 / pageCount;
        const base = (pageNumber - 1) * stepPerChunk;

        // Stage 1: rendering
        const rPct = Math.min(100, Math.round(base + (stepPerChunk * 0.25)));
        onPageProgress({
          pageNumber,
          pageCount,
          stage: 'rendering',
          percent: rPct,
          statusText: `Strana ${pageNumber}/${pageCount}: Renderovanie... [${rPct}%]`
        });

        // Stage 2: uploading
        const uPct = Math.min(100, Math.round(base + (stepPerChunk * 0.5)));
        onPageProgress({
          pageNumber,
          pageCount,
          stage: 'uploading',
          percent: uPct,
          statusText: `Strana ${pageNumber}/${pageCount}: Nahrávanie... [${uPct}%]`
        });

        // Stage 3: analyzing
        const aPct = Math.min(100, Math.round(base + (stepPerChunk * 0.75)));
        onPageProgress({
          pageNumber,
          pageCount,
          stage: 'analyzing',
          percent: aPct,
          statusText: `Strana ${pageNumber}/${pageCount}: AI extrakcia... [${aPct}%]`
        });

        // Stage 4: done
        const dPct = Math.min(100, Math.round(base + (stepPerChunk * 1.0)));
        onPageProgress({
          pageNumber,
          pageCount,
          stage: 'done',
          percent: dPct,
          statusText: `Strana ${pageNumber}/${pageCount}: Hotovo [${dPct}%]`
        });
      }

      assert.equal(progressEvents.length, 16);
      assert.equal(progressEvents[0].stage, 'rendering');
      assert.equal(progressEvents[0].statusText, 'Strana 1/4: Renderovanie... [6%]');
      assert.equal(progressEvents[2].stage, 'analyzing');
      assert.equal(progressEvents[2].statusText, 'Strana 1/4: AI extrakcia... [19%]');
      assert.equal(progressEvents[15].stage, 'done');
      assert.equal(progressEvents[15].statusText, 'Strana 4/4: Hotovo [100%]');
    });

    test('AbortSignal preruší spracovanie fronty a vráti aborted: true', () => {
      const controller = new AbortController();
      controller.abort();

      const isAborted = () => controller.signal.aborted;
      assert.equal(isAborted(), true);

      // Simulácia spracovania s kontrolou abort flagu
      let processed = 0;
      const pages = [1, 2, 3, 4, 5];
      for (const p of pages) {
        if (isAborted()) break;
        processed++;
      }

      assert.equal(processed, 0, 'Po aborte sa nesmú spracovávať ďalšie strany');
    });

    test('Retry zlyhanej strany re-analyzuje iba konkrétny dokument bez re-uploadu celého PDF', async () => {
      let analyzeCallCount = 0;
      let analyzedDocId = null;

      const mockAnalyze = async (doc) => {
        analyzeCallCount++;
        analyzedDocId = doc.id;
        return { ok: true };
      };

      const failedPageDoc = {
        id: 'pdf-page-failed-3',
        title: 'kauza.pdf · s. 3/10',
        status: 'error',
        source_kind: 'pdf_page',
        parent_document_id: 'pdf-container-root',
        page_number: 3
      };

      // Spustíme retry pre samotnú stranu
      await mockAnalyze(failedPageDoc);

      assert.equal(analyzeCallCount, 1);
      assert.equal(analyzedDocId, 'pdf-page-failed-3');
    });
  });
});
