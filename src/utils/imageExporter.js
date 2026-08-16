import html2canvas from 'html2canvas';

/**
 * Exportuje zadaný DOM element do PNG obrázku s vysokým rozlíšením (Retina/High-DPI).
 * @param {HTMLElement} element - DOM element na export
 * @param {string} filename - Názov výsledného súboru (bez prípony alebo s .png)
 * @returns {Promise<string>} Data URL vygenerovaného obrázku
 */
export async function exportElementAsPng(element, filename = 'forenz-alibi-card.png') {
  if (!element) {
    throw new Error('Element pre export do PNG neexistuje.');
  }

  const canvas = await html2canvas(element, {
    scale: 2, // 2x škálovanie pre ostrý výstup a retina displeje
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

  const canvas = await html2canvas(element, {
    scale: 2,
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
