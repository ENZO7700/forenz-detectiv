/**
 * Production post-upload analysis pipeline (no demo shortcuts).
 *
 * Steps (implemented unless noted):
 * 1. validateUploadSize — reject files over MAX_FILE_SIZE_BYTES (50 MB)
 * 2. prepareFileForUpload — normalize images; PDF/text pass-through as-is
 * 3. UploadFile → Document.create(status: pending)
 * 4. analyzeDocument / runAnalysis — Pixtral extraction → entity write
 * 5. runContradictionDetection — cross-document claims / alibi checks
 *
 * Gap: multi-page PDF chunk/split into page images before Pixtral is NOT
 * implemented yet. Large PDFs are uploaded whole; analysis expects image_url
 * (vision model). Next step: render PDF pages → N Document parts or page jobs.
 */

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export const PIPELINE_STEPS = [
  { id: 'validate', label: 'Kontrola veľkosti a typu súboru' },
  { id: 'prepare', label: 'Príprava (normalizácia obrázka / PDF pass-through)' },
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

/** True when PDF page-splitting for vision analysis is still missing. */
export const PDF_PAGE_CHUNKING_IMPLEMENTED = false;
