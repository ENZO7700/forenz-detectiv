import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPdfFile,
  buildPdfPageTitle,
  buildPdfContainerTitle,
  planPdfDocumentBudget,
  PDF_MAX_PAGES,
  PDF_ANALYZE_CONCURRENCY,
  PDF_RENDER_CONCURRENCY,
  PDF_PAGE_CHUNKING_IMPLEMENTED,
  PIPELINE_STEPS
} from '../src/lib/documentPipeline.js';

describe('PDF page-chunking helpers', () => {
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
});
