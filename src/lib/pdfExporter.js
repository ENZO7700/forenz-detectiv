import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Moderný PDF Exporter vyšetrovacieho spisu s podporou štatistík, rozporov a grafu.
 */
export async function exportForensicCasePdf({
  documents = [],
  persons = [],
  relationships = [],
  redFlags = [],
  flaggedPassages = [],
  claims = [],
  events = [],
  contradictions = [],
  graphCanvasElement = null,
  scopeTitle = 'Celý prípad'
}) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 595.28; // A4 portrait width in points
  const PAGE_HEIGHT = 841.89; // A4 portrait height in points
  const MARGIN = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN;

  const checkPageBreak = (neededHeight) => {
    if (cursorY - neededHeight < MARGIN) {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - MARGIN;
    }
  };

  // 1. Hlavička dokumentu (Dark Navy Banner)
  const headerHeight = 70;
  currentPage.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerHeight,
    width: PAGE_WIDTH,
    height: headerHeight,
    color: rgb(0.06, 0.09, 0.16) // #0f172a
  });

  currentPage.drawText('FORENZ DETECTIV', {
    x: MARGIN,
    y: PAGE_HEIGHT - 32,
    size: 20,
    font: fontBold,
    color: rgb(0.95, 0.97, 1.0)
  });

  currentPage.drawText('Forenzný analytický protokol vyšetrovania', {
    x: MARGIN,
    y: PAGE_HEIGHT - 48,
    size: 10,
    font: fontRegular,
    color: rgb(0.58, 0.64, 0.72)
  });

  const genDate = new Date().toLocaleString('sk-SK');
  currentPage.drawText(`Dátum exportu: ${genDate}`, {
    x: PAGE_WIDTH - MARGIN - 180,
    y: PAGE_HEIGHT - 32,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.9)
  });

  currentPage.drawText(`Rozsah: ${scopeTitle}`, {
    x: PAGE_WIDTH - MARGIN - 180,
    y: PAGE_HEIGHT - 46,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.8, 0.85, 0.9)
  });

  cursorY = PAGE_HEIGHT - headerHeight - 25;

  // Sekcia Helper
  const drawSectionTitle = (title) => {
    checkPageBreak(35);
    currentPage.drawText(title.toUpperCase(), {
      x: MARGIN,
      y: cursorY,
      size: 11,
      font: fontBold,
      color: rgb(0.08, 0.24, 0.65) // #143da6
    });
    cursorY -= 6;
    currentPage.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: PAGE_WIDTH - MARGIN, y: cursorY },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92)
    });
    cursorY -= 15;
  };

  // 2. Prehľadová štatistika (Overview Cards)
  drawSectionTitle('1. Prehľad vyšetrovacieho spisu');
  const statBoxWidth = (CONTENT_WIDTH - 24) / 4;
  const statBoxHeight = 36;

  const stats = [
    { label: 'Dokumenty / Výpovede', val: String(documents.length) },
    { label: 'Identifikované osoby', val: String(persons.length) },
    { label: 'Zaznamenané vzťahy', val: String(relationships.length) },
    { label: 'Detegované rozpory', val: String(contradictions.length) }
  ];

  stats.forEach((s, idx) => {
    const bx = MARGIN + idx * (statBoxWidth + 8);
    currentPage.drawRectangle({
      x: bx,
      y: cursorY - statBoxHeight,
      width: statBoxWidth,
      height: statBoxHeight,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.88, 0.91, 0.95),
      borderWidth: 1
    });

    currentPage.drawText(s.val, {
      x: bx + 10,
      y: cursorY - 18,
      size: 14,
      font: fontBold,
      color: rgb(0.08, 0.24, 0.65)
    });

    currentPage.drawText(s.label, {
      x: bx + 10,
      y: cursorY - 30,
      size: 7,
      font: fontRegular,
      color: rgb(0.35, 0.4, 0.48)
    });
  });

  cursorY -= statBoxHeight + 25;

  // 3. Vloženie snímky grafu vzťahov (ak je dostupný canvas)
  if (graphCanvasElement) {
    try {
      const dataUrl = graphCanvasElement.toDataURL('image/png');
      const pngImageBytes = await fetch(dataUrl).then((res) => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      checkPageBreak(220);
      drawSectionTitle('2. Graf väzieb a vzťahov');

      const imgWidth = CONTENT_WIDTH;
      const imgHeight = 180;
      currentPage.drawImage(pngImage, {
        x: MARGIN,
        y: cursorY - imgHeight,
        width: imgWidth,
        height: imgHeight
      });
      cursorY -= imgHeight + 25;
    } catch (err) {
      console.warn('Nie je možné exportovať snapshot grafu do PDF', err);
    }
  }

  // 4. Detegované rozpory (Contradictions & Red Flags)
  if (contradictions.length > 0 || redFlags.length > 0) {
    drawSectionTitle('3. Kritické rozpory a varovania');

    contradictions.forEach((c) => {
      checkPageBreak(50);
      currentPage.drawRectangle({
        x: MARGIN,
        y: cursorY - 40,
        width: CONTENT_WIDTH,
        height: 40,
        color: rgb(1.0, 0.95, 0.95),
        borderColor: rgb(0.95, 0.75, 0.75),
        borderWidth: 1
      });

      currentPage.drawText(`[ROZPOR] ${c.entity_ref || 'Nezrovnalosť'}: ${c.type || ''}`, {
        x: MARGIN + 10,
        y: cursorY - 14,
        size: 9,
        font: fontBold,
        color: rgb(0.8, 0.1, 0.1)
      });

      const explanationSnippet = (c.explanation || '').slice(0, 110);
      currentPage.drawText(explanationSnippet, {
        x: MARGIN + 10,
        y: cursorY - 28,
        size: 8,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2)
      });

      cursorY -= 48;
    });

    redFlags.slice(0, 8).forEach((rf) => {
      checkPageBreak(25);
      currentPage.drawText(`• ${rf.description || rf}`, {
        x: MARGIN + 5,
        y: cursorY,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.7, 0.15, 0.15)
      });
      cursorY -= 14;
    });

    cursorY -= 15;
  }

  // 5. Zoznam osôb v prípade
  drawSectionTitle('4. Osoby v prípade');
  persons.slice(0, 25).forEach((p) => {
    checkPageBreak(20);
    const typeLabel = `[${(p.type || 'svedok').toUpperCase()}]`;
    currentPage.drawText(p.name || 'Neznáma osoba', {
      x: MARGIN,
      y: cursorY,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.25)
    });

    currentPage.drawText(typeLabel, {
      x: MARGIN + 140,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: p.type === 'podozrivý' ? rgb(0.8, 0.1, 0.1) : rgb(0.1, 0.35, 0.75)
    });

    if (p.details) {
      currentPage.drawText(p.details.slice(0, 65), {
        x: MARGIN + 230,
        y: cursorY,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.45, 0.5)
      });
    }

    cursorY -= 15;
  });

  cursorY -= 15;

  // 6. Chronologické udalosti (Timeline Summary)
  if (events.length > 0) {
    drawSectionTitle('5. Chronologický priebeh udalostí');
    events.slice(0, 20).forEach((ev) => {
      checkPageBreak(30);
      const timeStr = ev.time || ev.time_start || '--:--';
      const dateStr = ev.date ? `${ev.date} ` : '';

      currentPage.drawText(`${dateStr}${timeStr}`, {
        x: MARGIN,
        y: cursorY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.08, 0.24, 0.65)
      });

      currentPage.drawText(ev.title || 'Udalosť', {
        x: MARGIN + 90,
        y: cursorY,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.2)
      });

      if (ev.source_quote) {
        cursorY -= 12;
        currentPage.drawText(`"${ev.source_quote.slice(0, 95)}"`, {
          x: MARGIN + 90,
          y: cursorY,
          size: 7.5,
          font: fontOblique,
          color: rgb(0.4, 0.45, 0.5)
        });
      }

      cursorY -= 16;
    });
  }

  // 7. Právne posúdenie (Zákon č. 300/2005 Z. z. — Source of Truth)
  if (contradictions.length > 0) {
    drawSectionTitle('6. Právne posúdenie relevancie (Zákon č. 300/2005 Z. z.)');

    checkPageBreak(90);
    currentPage.drawRectangle({
      x: MARGIN,
      y: cursorY - 80,
      width: CONTENT_WIDTH,
      height: 80,
      color: rgb(0.96, 0.97, 1.0),
      borderColor: rgb(0.75, 0.82, 0.95),
      borderWidth: 1
    });

    currentPage.drawText('Potenciálne relevantné ustanovenie: § 346 (Krivá výpoveď a krivá prísaha)', {
      x: MARGIN + 10,
      y: cursorY - 16,
      size: 8.5,
      font: fontBold,
      color: rgb(0.08, 0.24, 0.65)
    });

    currentPage.drawText('Status: Potenciálne relevantné (Potentially relevant) · Dôkazný zdroj: Zbierka zákonov SR (s. 160)', {
      x: MARGIN + 10,
      y: cursorY - 30,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.25, 0.3, 0.4)
    });

    currentPage.drawText('Dôvod: Zistený časový/priestorový rozpor vo výpovediach zakladá potrebu preverenia dôveryhodnosti.', {
      x: MARGIN + 10,
      y: cursorY - 44,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2)
    });

    currentPage.drawText('Chýbajúce dôkazy: Preukázanie priameho úmyslu vedome klamať, vylúčenie omylu a poučenie svedka.', {
      x: MARGIN + 10,
      y: cursorY - 58,
      size: 7.5,
      font: fontOblique,
      color: rgb(0.35, 0.4, 0.45)
    });

    currentPage.drawText('Vyžaduje právne posúdenie vyšetrovateľom / prokurátorom: ÁNO (REQUIRES_HUMAN_REVIEW)', {
      x: MARGIN + 10,
      y: cursorY - 72,
      size: 8,
      font: fontBold,
      color: rgb(0.75, 0.15, 0.15)
    });

    cursorY -= 95;
  }

  // Pätička na každej strane
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    page.drawText(`ForenzDetectiv · Strana ${i + 1} z ${pageCount}`, {
      x: PAGE_WIDTH / 2 - 40,
      y: 20,
      size: 8,
      font: fontRegular,
      color: rgb(0.6, 0.65, 0.7)
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `forenz-spis-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
