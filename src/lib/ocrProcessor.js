import { createWorker } from 'tesseract.js';

/**
 * Extrakcia textu z obrázku pomocou Tesseract.js OCR.
 * Podporuje slovenčinu (slk) a angličtinu (eng) a reportuje reálny priebeh v percentách (0–100%).
 *
 * @param {string|File|Blob} imageSource - URL, Base64 alebo File objekt dokumentu
 * @param {Function} [onProgress] - Callback volaný s percentami priebehu (0-100)
 * @param {string} [languages='slk+eng'] - Jazykový model pre OCR
 * @returns {Promise<{ text: string, confidence: number, lines: string[] }>}
 */
export async function extractTextFromImage(imageSource, onProgress = null, languages = 'slk+eng') {
  let worker = null;
  try {
    if (onProgress) onProgress(5);
    worker = await createWorker(languages, 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(m.progress * 100);
          onProgress(Math.max(10, Math.min(99, pct)));
        }
      }
    });

    if (onProgress) onProgress(20);
    const result = await worker.recognize(imageSource);
    if (onProgress) onProgress(100);

    const text = result?.data?.text?.trim() || '';
    const confidence = result?.data?.confidence || 0;
    const lines = (result?.data?.lines || []).map((l) => l.text.trim()).filter(Boolean);

    return {
      text,
      confidence,
      lines,
      success: text.length > 0
    };
  } catch (error) {
    console.error('[OCR Error]', error);
    throw new Error('Nepodarilo sa rozpoznať text z obrázka: ' + (error.message || 'Neznáma chyba'));
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {}
    }
  }
}
