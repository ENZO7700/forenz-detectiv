import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateCaseIntegrityDigest } from '@/utils/cryptoUtils';

/**
 * Súdny PDF Exporter s kryptografickým SHA-256 hashóm a reťazcom dôkazov.
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
  scopeTitle = 'Celý spis',
  options = {
    includeCitations: true,
    includeMapAlibi: true,
    includeAuditLog: true
  },
  customSha256 = null
}) {
  // 1. Výpočet kryptografického kontrolného súčtu (SHA-256)
  const sha256Digest = customSha256 || await generateCaseIntegrityDigest({
    documents,
    persons,
    redFlags,
    contradictions,
    events,
    caseTitle: scopeTitle
  });

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
    if (cursorY - neededHeight < MARGIN + 40) {
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      cursorY = PAGE_HEIGHT - MARGIN;
    }
  };

  // 1. Hlavička dokumentu (Dark Navy Banner)
  const headerHeight = 78;
  currentPage.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerHeight,
    width: PAGE_WIDTH,
    height: headerHeight,
    color: rgb(0.01, 0.02, 0.09) // slate-950
  });

  // Amber accent strip
  currentPage.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - headerHeight,
    width: PAGE_WIDTH,
    height: 3,
    color: rgb(0.96, 0.62, 0.04) // amber-500
  });

  currentPage.drawText('PROTOKOL O FORENZNEJ ANALÝZE SPISU A ROZPOROV', {
    x: MARGIN,
    y: PAGE_HEIGHT - 28,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1)
  });

  currentPage.drawText(`KAUZA: ${scopeTitle.toUpperCase()}  |  DÁTUM: ${new Date().toLocaleString('sk-SK')}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 44,
    size: 8,
    font: fontRegular,
    color: rgb(0.7, 0.75, 0.82)
  });

  currentPage.drawText(`SHA-256 HASH INTEGRITY: ${sha256Digest.slice(0, 48)}...`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 60,
    size: 7,
    font: fontRegular,
    color: rgb(0.96, 0.62, 0.04)
  });

  cursorY = PAGE_HEIGHT - headerHeight - 20;

  const drawSectionTitle = (title) => {
    checkPageBreak(35);
    currentPage.drawText(title.toUpperCase(), {
      x: MARGIN,
      y: cursorY,
      size: 10,
      font: fontBold,
      color: rgb(0.08, 0.24, 0.65)
    });
    cursorY -= 4;
    currentPage.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: PAGE_WIDTH - MARGIN, y: cursorY },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92)
    });
    cursorY -= 15;
  };

  // 2. Prehľadová štatistika (Overview Cards)
  drawSectionTitle('1. Prehľad analyzovaných materiálov & Reťazec dôkazov');
  const statBoxWidth = (CONTENT_WIDTH - 24) / 4;
  const statBoxHeight = 36;

  const stats = [
    { label: 'Výpovede a listiny', val: String(documents.length) },
    { label: 'Identifikované osoby', val: String(persons.length) },
    { label: 'Zaznamenané vzťahy', val: String(relationships.length) },
    { label: 'Identifikované rozpory', val: String(contradictions.length + redFlags.length) }
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

  // 3. Tabuľka vložených dokumentov
  if (documents.length > 0) {
    documents.slice(0, 10).forEach((doc) => {
      checkPageBreak(18);
      currentPage.drawText(`• ${doc.title || doc.file_name || 'Dokument'}`, {
        x: MARGIN + 5,
        y: cursorY,
        size: 8,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35)
      });
      currentPage.drawText(`Dĺžka: ${(doc.content || '').length} znakov | Dátum vloženia: ${doc.created_at || 'Neuvedený'}`, {
        x: MARGIN + 220,
        y: cursorY,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.5, 0.55, 0.6)
      });
      cursorY -= 14;
    });
    cursorY -= 10;
  }

  // 4. Detegované rozpory s citáciami (Contradictions & Red Flags)
  if (contradictions.length > 0 || redFlags.length > 0) {
    drawSectionTitle('2. Identifikované rozpory a nemožné alibi');

    contradictions.forEach((c) => {
      checkPageBreak(65);
      currentPage.drawRectangle({
        x: MARGIN,
        y: cursorY - 55,
        width: CONTENT_WIDTH,
        height: 55,
        color: rgb(1.0, 0.95, 0.95),
        borderColor: rgb(0.95, 0.75, 0.75),
        borderWidth: 1
      });

      currentPage.drawText(`[KRITICKÝ ROZPOR] ${c.entity_ref || c.person || 'Nezrovnalosť'}: ${c.type || 'Fyzikálny nesúlad'}`, {
        x: MARGIN + 10,
        y: cursorY - 14,
        size: 9,
        font: fontBold,
        color: rgb(0.8, 0.1, 0.1)
      });

      const exp = (c.explanation || c.description || '').slice(0, 120);
      currentPage.drawText(exp, {
        x: MARGIN + 10,
        y: cursorY - 28,
        size: 8,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2)
      });

      if (c.quoteA || c.quoteB) {
        const qSnippet = `Citácia: "${(c.quoteA || c.quoteB || '').slice(0, 110)}"`;
        currentPage.drawText(qSnippet, {
          x: MARGIN + 10,
          y: cursorY - 42,
          size: 7.5,
          font: fontOblique,
          color: rgb(0.4, 0.4, 0.45)
        });
      }

      cursorY -= 65;
    });

    redFlags.slice(0, 6).forEach((rf) => {
      checkPageBreak(25);
      currentPage.drawText(`• [VAROVANIE] ${rf.description || rf}`, {
        x: MARGIN + 5,
        y: cursorY,
        size: 8,
        font: fontRegular,
        color: rgb(0.7, 0.15, 0.15)
      });
      cursorY -= 14;
    });

    cursorY -= 15;
  }

  // 5. Graf väzieb ak je zapnutý a dostupný
  if (graphCanvasElement) {
    try {
      const dataUrl = graphCanvasElement.toDataURL('image/png');
      const pngImageBytes = await fetch(dataUrl).then((res) => res.arrayBuffer());
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      checkPageBreak(200);
      drawSectionTitle('3. Graf väzieb a vzťahov aktérov');

      const imgWidth = CONTENT_WIDTH;
      const imgHeight = 160;
      currentPage.drawImage(pngImage, {
        x: MARGIN,
        y: cursorY - imgHeight,
        width: imgWidth,
        height: imgHeight
      });
      cursorY -= imgHeight + 20;
    } catch (err) {
      console.warn('Nie je možné exportovať snapshot grafu do PDF', err);
    }
  }

  // 6. Právne posúdenie (Zákon č. 300/2005 Z. z.)
  drawSectionTitle('4. Právne posúdenie & Normatívna doložka (Zákon č. 300/2005 Z. z.)');

  checkPageBreak(85);
  currentPage.drawRectangle({
    x: MARGIN,
    y: cursorY - 75,
    width: CONTENT_WIDTH,
    height: 75,
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

  currentPage.drawText('Normatívna doložka: Závery protokolu majú informatívny a analytický charakter.', {
    x: MARGIN + 10,
    y: cursorY - 30,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.25, 0.3, 0.4)
  });

  currentPage.drawText('Kryptografická pečať garantuje, že analyzované vstupné dáta neboli dodatočne zmenené.', {
    x: MARGIN + 10,
    y: cursorY - 44,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2)
  });

  currentPage.drawText('Vyžaduje finálne posúdenie advokátom / vyšetrovateľom: ÁNO (STRICT HUMAN IN THE LOOP)', {
    x: MARGIN + 10,
    y: cursorY - 60,
    size: 8,
    font: fontBold,
    color: rgb(0.75, 0.15, 0.15)
  });

  cursorY -= 90;

  // 7. Päta na každej strane vrátane SHA-256 a číslovania
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    
    // Top border line above footer
    page.drawLine({
      start: { x: MARGIN, y: 32 },
      end: { x: PAGE_WIDTH - MARGIN, y: 32 },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92)
    });

    page.drawText(`ForenzDetectiv Forensic Protocol  |  Strana ${i + 1} z ${pageCount}`, {
      x: MARGIN,
      y: 20,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.55)
    });

    page.drawText(`SHA-256: ${sha256Digest.slice(0, 32)}...`, {
      x: PAGE_WIDTH - MARGIN - 170,
      y: 20,
      size: 7,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.55)
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `forenz-protokol-${scopeTitle.toLowerCase().replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return { sha256: sha256Digest };
}
