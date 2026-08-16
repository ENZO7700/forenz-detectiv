/**
 * Production post-upload analysis pipeline (no demo shortcuts).
 *
 * Steps (implemented):
 * 1. validateUploadSize — reject files over MAX_FILE_SIZE_BYTES (50 MB)
 * 2. prepareFileForUpload — normalize images; non-PDF text pass-through
 * 3. PDF page-chunking (pdf.js) — multi-page PDFs → JPEG page Documents
 *    linked via parent_document_id / page_number (see pdfPageChunker.js)
 * 4. UploadFile → Document.create(status: pending) per analysis unit
 * 5. analyzeDocument / runAnalysis — Pixtral extraction → entity write
 * 6. runContradictionDetection — cross-document claims / alibi checks
 *
 * Demo case remains gated behind VITE_ENABLE_DEMO (see demoFlag.js).
 */

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export {
  PDF_MAX_PAGES,
  PDF_RENDER_MAX_EDGE,
  PDF_JPEG_QUALITY,
  PDF_RENDER_CONCURRENCY,
  PDF_ANALYZE_CONCURRENCY,
  isPdfFile,
  buildPdfPageTitle,
  buildPdfContainerTitle,
  planPdfDocumentBudget,
  forEachPdfPage,
  chunkAndProcessPdf
} from './pdfPageChunker.js';

export const PIPELINE_STEPS = [
  { id: 'validate', label: 'Kontrola veľkosti a typu súboru' },
  { id: 'prepare', label: 'Príprava (normalizácia obrázka / PDF chunking)' },
  { id: 'chunk', label: 'PDF → stránky (JPEG) s väzbou parent/child' },
  { id: 'upload', label: 'Upload do úložiska a vytvorenie Document (pending)' },
  { id: 'analyze', label: 'AI analyzeDocument → entity write' },
  { id: 'contradictions', label: 'Detekcia rozporov naprieč dokumentmi' }
];

/** @returns {{ ok: true } | { ok: false, sizeKb: number }} */
export function validateUploadSize(file, maxBytes = MAX_FILE_SIZE_BYTES) {
  if (!file) return { ok: false, sizeKb: 0 };
  if (file.size > maxBytes) {
    return { ok: false, sizeKb: Math.round(file.size / 1024) };
  }
  return { ok: true };
}

/** True when multi-page PDFs are split into page images before Pixtral. */
export const PDF_PAGE_CHUNKING_IMPLEMENTED = true;
