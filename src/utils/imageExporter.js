import html2canvas from 'html2canvas';

/**
 * Capture DOM element as PNG bytes (high-DPI / ~2K when element is large enough).
 * Does not trigger download.
 * @param {HTMLElement} element
 * @returns {Promise<Uint8Array>}
 */
export async function captureElementAsPngBytes(element) {
  if (!element) {
    throw new Error('Element pre export do PNG neexistuje.');
  }

  const retinaScale = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2;

  const canvas = await html2canvas(element, {
    scale: retinaScale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#020617',
    logging: false
  });

  const dataUrl = canvas.toDataURL('image/png');
  const b64 = dataUrl.split(',')[1] || '';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/**
 * Exportuje zadaný DOM element do PNG obrázku s vysokým rozlíšením (Retina/High-DPI 2K).
 * @param {HTMLElement} element - DOM element na export
 * @param {string} filename - Názov výsledného súboru (bez prípony alebo s .png)
 * @returns {Promise<string>} Data URL vygenerovaného obrázku
 */
export async function exportElementAsPng(element, filename = 'forenz-alibi-card.png') {
  if (!element) {
    throw new Error('Element pre export do PNG neexistuje.');
  }

  const retinaScale = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2;

  const canvas = await html2canvas(element, {
    scale: retinaScale, // 2x+ škálovanie pre ostrý výstup a retina displeje
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#020617', // slate-950
    logging: false
  });

  const dataUrl = canvas.toDataURL('image/png');
  const downloadName = filename.endsWith('.png') ? filename : `${filename}.png`;

  const link = document.createElement('a');
  link.download = downloadName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

/**
 * Skopíruje vygenerovaný PNG obrázok elementu priamo do schránky (Clipboard API).
 * @param {HTMLElement} element - DOM element na skopírovanie
 * @returns {Promise<boolean>} Úspešnosť skopírovania
 */
export async function copyElementImageToClipboard(element) {
  if (!element) {
    throw new Error('Element pre kopírovanie do schránky neexistuje.');
  }

  const retinaScale = typeof window !== 'undefined' ? Math.max(2, window.devicePixelRatio || 2) : 2;

  const canvas = await html2canvas(element, {
    scale: retinaScale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#020617',
    logging: false
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Nepodarilo sa vytvoriť blob obrázku.'));
        return;
      }

      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } else {
          reject(new Error('ClipboardItem API nie je podporované v tomto prehliadači.'));
        }
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}
