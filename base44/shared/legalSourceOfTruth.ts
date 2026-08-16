// base44/shared/legalSourceOfTruth.ts
// Official Centralized Legal Source of Truth Gateway for Zákon č. 300/2005 Z. z. (Trestný zákon SR)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export interface LegalProvenance {
  lawId: string;
  title: string;
  paragraph: string;
  fullTitle: string;
  section?: string;
  text: string;
  sourceFile: string;
  sourcePage: number;
  sourcePageEnd: number;
  sourceHash: string;
}

export interface LegalManifest {
  law_id: string;
  title: string;
  official_title: string;
  jurisdiction: string;
  source_type: string;
  source_url: string;
  local_file: string;
  sha256: string;
  promulgation_date: string;
  effective_from: string;
  effective_to: string;
  version_label: string;
  extracted_at: string;
  page_count: number;
  paragraphs_count: number;
}

export interface LegalSection {
  id: string;
  label: string;
  num?: string;
  text: string;
  letters: Array<{ letter: string; text: string }>;
  source: {
    file: string;
    page: number;
    pageEnd: number;
  };
}

export interface LegalParagraph {
  paragraph: string;
  title: string;
  full_title: string;
  text: string;
  part: string | null;
  hlava: string | null;
  diel: string | null;
  oddiel: string | null;
  source: {
    file: string;
    pageStart: number;
    pageEnd: number;
  };
  sections: LegalSection[];
}

export interface LegalTopic {
  topic: string;
  topic_sk: string;
  paragraphs: string[];
  source: string;
  status: string;
}

let cachedManifest: LegalManifest | null = null;
let cachedParagraphs: LegalParagraph[] | null = null;
let cachedParagraphMap: Map<string, LegalParagraph> | null = null;
let cachedTopics: LegalTopic[] | null = null;

function resolveLegalDir(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const candidate1 = path.resolve(__dirname, '../../docs/legal');
    if (fs.existsSync(candidate1)) return candidate1;
    const candidate2 = path.resolve(process.cwd(), 'docs/legal');
    if (fs.existsSync(candidate2)) return candidate2;
  } catch (_) {}
  return path.resolve(process.cwd(), 'docs/legal');
}

export function getLegalSourceManifest(): LegalManifest {
  if (cachedManifest) return cachedManifest;
  const legalDir = resolveLegalDir();
  const manifestPath = path.join(legalDir, 'source-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`LEGAL_SOURCE_UNAVAILABLE: Manifest not found at ${manifestPath}`);
  }
  cachedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as LegalManifest;
  return cachedManifest;
}

export function loadAllParagraphs(): LegalParagraph[] {
  if (cachedParagraphs) return cachedParagraphs;
  const legalDir = resolveLegalDir();
  const paragraphsPath = path.join(legalDir, 'paragraphs.json');
  if (!fs.existsSync(paragraphsPath)) {
    throw new Error(`LEGAL_SOURCE_UNAVAILABLE: Paragraphs dataset not found at ${paragraphsPath}`);
  }
  cachedParagraphs = JSON.parse(fs.readFileSync(paragraphsPath, 'utf8')) as LegalParagraph[];
  cachedParagraphMap = new Map();
  for (const p of cachedParagraphs) {
    cachedParagraphMap.set(p.paragraph, p);
  }
  return cachedParagraphs;
}

export function loadAllTopics(): LegalTopic[] {
  if (cachedTopics) return cachedTopics;
  const legalDir = resolveLegalDir();
  const topicsPath = path.join(legalDir, 'topics.json');
  if (!fs.existsSync(topicsPath)) return [];
  cachedTopics = JSON.parse(fs.readFileSync(topicsPath, 'utf8')) as LegalTopic[];
  return cachedTopics;
}

export function getLegalParagraph(paragraphNumber: string | number): LegalParagraph | null {
  loadAllParagraphs();
  const numStr = String(paragraphNumber).trim().replace(/^§\s*/, '');
  return cachedParagraphMap?.get(numStr) || null;
}

export function getLegalProvenance(paragraphNumber: string | number, sectionId?: string): LegalProvenance | null {
  const p = getLegalParagraph(paragraphNumber);
  if (!p) return null;
  const manifest = getLegalSourceManifest();

  if (sectionId) {
    const sec = p.sections.find((s) => s.id === sectionId || s.label === sectionId || s.num === sectionId);
    if (sec) {
      return {
        lawId: manifest.law_id,
        title: manifest.title,
        paragraph: p.paragraph,
        fullTitle: p.full_title,
        section: sec.label,
        text: sec.text,
        sourceFile: sec.source.file,
        sourcePage: sec.source.page,
        sourcePageEnd: sec.source.pageEnd,
        sourceHash: manifest.sha256
      };
    }
  }

  return {
    lawId: manifest.law_id,
    title: manifest.title,
    paragraph: p.paragraph,
    fullTitle: p.full_title,
    text: p.text,
    sourceFile: p.source.file,
    sourcePage: p.source.pageStart,
    sourcePageEnd: p.source.pageEnd,
    sourceHash: manifest.sha256
  };
}

export function getLegalSection(paragraphNumber: string | number, sectionId: string): LegalSection | null {
  const p = getLegalParagraph(paragraphNumber);
  if (!p) return null;
  return p.sections.find((s) => s.id === sectionId || s.label === sectionId || s.num === sectionId) || null;
}

export function searchLegalSource(query: string, maxResults = 10): LegalProvenance[] {
  if (!query || typeof query !== 'string') return [];
  const qLower = query.toLowerCase().trim();
  const paragraphs = loadAllParagraphs();
  const manifest = getLegalSourceManifest();
  const results: LegalProvenance[] = [];

  // 1. Exact paragraph number match
  const exactParaMatch = qLower.match(/^(?:§\s*)?(\d+[a-z]?)$/i);
  if (exactParaMatch) {
    const p = getLegalParagraph(exactParaMatch[1]);
    if (p) {
      const prov = getLegalProvenance(p.paragraph);
      if (prov) results.push(prov);
      return results;
    }
  }

  // 2. Scan paragraphs by title and text
  for (const p of paragraphs) {
    const inTitle = p.title.toLowerCase().includes(qLower);
    const inText = p.text.toLowerCase().includes(qLower);
    if (inTitle || inText) {
      const prov = getLegalProvenance(p.paragraph);
      if (prov) {
        results.push(prov);
        if (results.length >= maxResults) break;
      }
    }
  }

  return results;
}

export function getRelevantLegalParagraphs(topicNameOrNames: string | string[]): LegalParagraph[] {
  const topics = loadAllTopics();
  const requested = Array.isArray(topicNameOrNames) ? topicNameOrNames : [topicNameOrNames];
  const matchedParaNums = new Set<string>();

  for (const req of requested) {
    const reqLower = req.toLowerCase().trim();
    for (const t of topics) {
      if (
        t.topic.toLowerCase().includes(reqLower) ||
        t.topic_sk.toLowerCase().includes(reqLower) ||
        reqLower.includes(t.topic.toLowerCase()) ||
        reqLower.includes(t.topic_sk.toLowerCase())
      ) {
        t.paragraphs.forEach((num) => matchedParaNums.add(num));
      }
    }
  }

  const result: LegalParagraph[] = [];
  for (const num of matchedParaNums) {
    const p = getLegalParagraph(num);
    if (p) result.push(p);
  }
  return result;
}

export function verifyLegalSourceIntegrity(): { ok: boolean; sha256: string; error?: string } {
  try {
    const manifest = getLegalSourceManifest();
    const legalDir = resolveLegalDir();
    const pdfPath = path.resolve(legalDir, '..', 'source-of-truth.pdf');

    if (!fs.existsSync(pdfPath)) {
      return { ok: false, sha256: '', error: `PDF file not found at ${pdfPath}` };
    }

    const buf = fs.readFileSync(pdfPath);
    const calculatedHash = crypto.createHash('sha256').update(buf).digest('hex');

    if (calculatedHash !== manifest.sha256) {
      return {
        ok: false,
        sha256: calculatedHash,
        error: `SHA-256 mismatch: calculated ${calculatedHash} !== manifest ${manifest.sha256}`
      };
    }

    const paragraphs = loadAllParagraphs();
    if (paragraphs.length !== manifest.paragraphs_count) {
      return {
        ok: false,
        sha256: calculatedHash,
        error: `Paragraphs count mismatch: ${paragraphs.length} !== ${manifest.paragraphs_count}`
      };
    }

    return { ok: true, sha256: calculatedHash };
  } catch (err: any) {
    return { ok: false, sha256: '', error: err.message || 'Unknown verification error' };
  }
}

export function resolveLegalVersion(options: {
  lawId: string;
  incidentDate?: string | null;
}): { status: 'AVAILABLE' | 'LEGAL_VERSION_UNAVAILABLE'; version?: LegalManifest; details?: string } {
  const manifest = getLegalSourceManifest();
  if (options.lawId !== '300/2005') {
    return {
      status: 'LEGAL_VERSION_UNAVAILABLE',
      details: `Požadovaný zákon č. ${options.lawId} nie je v lokálnom Source of Truth datasete.`
    };
  }

  if (!options.incidentDate) {
    return { status: 'AVAILABLE', version: manifest };
  }

  const inc = options.incidentDate.slice(0, 10);
  if (inc >= manifest.effective_from && inc <= manifest.effective_to) {
    return { status: 'AVAILABLE', version: manifest };
  }

  return {
    status: 'LEGAL_VERSION_UNAVAILABLE',
    details: `Dátum skutku ${inc} nespadá do časového intervalu účinnosti tejto verzie (${manifest.effective_from} – ${manifest.effective_to}).`
  };
}
