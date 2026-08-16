/**
 * Client-side PDF → page JPEG chunking for Pixtral vision analysis.
 * Renders page-at-a-time (low concurrency) so a 50 MB multi-page PDF
 * does not explode heap. Uses pdf.js (pdfjs-dist) + canvas.
 */
import { mapWithConcurrency } from './forenzUtils.js';

export const PDF_MAX_PAGES = 40;
export const PDF_RENDER_MAX_EDGE = 1600;
export const PDF_JPEG_QUALITY = 0.82;
/** Keep at 1 on mobile/memory-constrained devices — one canvas at a time. */
export const PDF_RENDER_CONCURRENCY = 1;
/** How many page analyzeDocument jobs may run in parallel after upload. */
export const PDF_ANALYZE_CONCURRENCY = 2;

export function isPdfFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'application/pdf' || type === 'application/x-pdf') return true;
  return /\.pdf$/i.test(file.name || '');
}

export function buildPdfPageTitle(fileName, pageNumber, pageCount) {
  const base = String(fileName || 'dokument.pdf').replace(/\.pdf$/i, '');
  return `${base}.pdf · s. ${pageNumber}/${pageCount}`;
}

export function buildPdfContainerTitle(fileName, pageCount) {
  const name = fileName || 'dokument.pdf';
  return `${name} (${pageCount} strán)`;
}

/**
 * How many Document rows we can create for a PDF given remaining plan slots.
 * Parent container + N page docs (parent skipped when pages === 1).
 */
export function planPdfDocumentBudget(remainingSlots, pageCount, maxPages = PDF_MAX_PAGES) {
  const cappedPages = Math.min(Math.max(0, pageCount | 0), maxPages);
  const slots = remainingSlots == null || !Number.isFinite(remainingSlots)
    ? Number.POSITIVE_INFINITY
    : Math.max(0, remainingSlots);

  if (cappedPages <= 0 || slots < 1) {
    return { ok: false, createParent: false, pages: 0, truncated: pageCount > cappedPages };
  }

  // Single page: one JPEG Document only (no container) — Pixtral needs an image.
  if (cappedPages === 1) {
    return {
      ok: true,
      createParent: false,
      pages: 1,
      truncated: pageCount > 1
    };
  }

  if (slots < 2) {
    return { ok: false, createParent: false, pages: 0, truncated: true };
  }

  const pages = Math.min(cappedPages, slots - 1);
  return {
    ok: pages >= 1,
    createParent: true,
    pages,
    truncated: pages < cappedPages || pageCount > maxPages
  };
}

let pdfjsModulePromise = null;

async function loadPdfjs() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import('pdfjs-dist').then((pdfjs) => {
      if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      }
      return pdfjs;
    });
  }
  return pdfjsModulePromise;
}

/**
 * @returns {{ pdf: import('pdfjs-dist').PDFDocumentProxy, pageCount: number }}
 */
export async function loadPdfDocument(file) {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({
    data,
    // Prefer streaming when possible; still safe for File-backed buffers.
    disableAutoFetch: true,
    useSystemFonts: true
  });
  const pdf = await loadingTask.promise;
  return { pdf, pageCount: pdf.numPages || 0 };
}

/**
 * Render one PDF page to a JPEG File, then release canvas memory.
 * @param {import('pdfjs-dist').PDFDocumentProxy} pdf
 */
export async function renderPdfPageToFile(pdf, pageNumber, opts = {}) {
  const maxEdge = opts.maxEdge ?? PDF_RENDER_MAX_EDGE;
  const quality = opts.quality ?? PDF_JPEG_QUALITY;
  const fileName = opts.fileName || 'page.pdf';

  const page = await pdf.getPage(pageNumber);
  let canvas = null;
  try {
    const baseViewport = page.getViewport({ scale: 1 });
    const longest = Math.max(baseViewport.width, baseViewport.height) || 1;
    const scale = Math.min(2, maxEdge / longest);
    const viewport = page.getViewport({ scale: Math.max(0.4, scale) });

    canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('canvas_2d_unavailable');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('canvas_toBlob_failed'))),
        'image/jpeg',
        quality
      );
    });

    const stem = String(fileName).replace(/\.pdf$/i, '') || 'stranka';
    return new File([blob], `${stem}_p${pageNumber}.jpg`, { type: 'image/jpeg' });
  } finally {
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
    try {
      page.cleanup();
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * Walk PDF pages sequentially (or with tiny concurrency) and await onPage
 * for each rendered File. Does not accumulate all page Files in memory.
 *
 * @param {File|Blob} file
 * @param {(ctx: { pageNumber: number, pageCount: number, originalPageCount: number, file: File }) => Promise<void>} onPage
 * @param {{ maxPages?: number, pagesLimit?: number, renderConcurrency?: number, maxEdge?: number, quality?: number }} [options]
 */
export async function forEachPdfPage(file, onPage, options = {}) {
  const maxPages = options.maxPages ?? PDF_MAX_PAGES;
  const { pdf, pageCount } = await loadPdfDocument(file);
  const pagesLimit = options.pagesLimit != null
    ? Math.min(pageCount, maxPages, options.pagesLimit)
    : Math.min(pageCount, maxPages);
  const renderConcurrency = Math.max(1, options.renderConcurrency ?? PDF_RENDER_CONCURRENCY);

  try {
    if (pagesLimit < 1) {
      return { pageCount: 0, originalPageCount: pageCount, truncated: pageCount > 0 };
    }

    const pageNumbers = Array.from({ length: pagesLimit }, (_, i) => i + 1);
    await mapWithConcurrency(pageNumbers, renderConcurrency, async (pageNumber) => {
      const pageFile = await renderPdfPageToFile(pdf, pageNumber, {
        fileName: file.name,
        maxEdge: options.maxEdge,
        quality: options.quality
      });
      await onPage({
        pageNumber,
        pageCount: pagesLimit,
        originalPageCount: pageCount,
        file: pageFile
      });
    });

    return {
      pageCount: pagesLimit,
      originalPageCount: pageCount,
      truncated: pageCount > pagesLimit
    };
  } finally {
    try {
      await pdf.destroy();
    } catch (_) {
      /* ignore */
    }
  }
}

/**
 * Full PDF upload path: load once → budget slots → optional parent Document →
 * page-at-a-time render/upload/create/analyze. Releases pdf.js document in finally.
 *
 * @param {File} file
 * @param {{
 *   remainingSlots: number,
 *   maxPages?: number,
 *   pageConcurrency?: number,
 *   uploadBinary: (f: File|Blob) => Promise<string>,
 *   createDocument: (fields: object) => Promise<object>,
 *   analyzeDocument: (doc: object) => Promise<unknown>,
 *   onPageProgress?: (info: { pageNumber: number, pageCount: number }) => void,
 * }} handlers
 */
export async function chunkAndProcessPdf(file, handlers = {}) {
  const maxPages = handlers.maxPages ?? PDF_MAX_PAGES;
  const pageConcurrency = Math.max(1, handlers.pageConcurrency ?? PDF_RENDER_CONCURRENCY);
  const { pdf, pageCount } = await loadPdfDocument(file);
  const budget = planPdfDocumentBudget(handlers.remainingSlots, pageCount, maxPages);

  if (!budget.ok) {
    try { await pdf.destroy(); } catch (_) { /* ignore */ }
    return {
      ok: false,
      reason: 'slots',
      pageCount: 0,
      originalPageCount: pageCount,
      truncated: true
    };
  }

  let parentDoc = null;
  try {
    if (budget.createParent) {
      const parentUrl = await handlers.uploadBinary(file);
      parentDoc = await handlers.createDocument({
        title: buildPdfContainerTitle(file.name, budget.pages),
        image_url: parentUrl,
        status: 'done',
        source_kind: 'pdf_container',
        page_count: budget.pages,
        summary: `PDF kontajner · ${budget.pages} stránok pripravených na AI analýzu`
      });
    }

    const pageNumbers = Array.from({ length: budget.pages }, (_, i) => i + 1);

    const pageDocs = await mapWithConcurrency(pageNumbers, pageConcurrency, async (pageNumber) => {
      const pageFile = await renderPdfPageToFile(pdf, pageNumber, {
        fileName: file.name,
        maxEdge: handlers.maxEdge,
        quality: handlers.quality
      });
      const pageUrl = await handlers.uploadBinary(pageFile);
      const pageDoc = await handlers.createDocument({
        title: buildPdfPageTitle(file.name, pageNumber, budget.pages),
        image_url: pageUrl,
        status: 'pending',
        source_kind: 'pdf_page',
        parent_document_id: parentDoc?.id || '',
        page_number: pageNumber,
        page_count: budget.pages
      });
      if (handlers.onPageProgress) {
        handlers.onPageProgress({ pageNumber, pageCount: budget.pages });
      }
      if (handlers.analyzeDocument) {
        await handlers.analyzeDocument(pageDoc);
      }
      return pageDoc;
    });

    return {
      ok: true,
      parentDoc,
      pageDocs,
      pageCount: budget.pages,
      originalPageCount: pageCount,
      truncated: budget.truncated || pageCount > maxPages
    };
  } finally {
    try {
      await pdf.destroy();
    } catch (_) {
      /* ignore */
    }
  }
}
