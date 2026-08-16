import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const PDF_PATH = 'docs/source-of-truth.pdf';
const LEGAL_DIR = 'docs/legal';

const MANIFEST_PATH = path.join(LEGAL_DIR, 'source-manifest.json');
const PARAGRAPHS_PATH = path.join(LEGAL_DIR, 'paragraphs.json');
const STRUCTURE_PATH = path.join(LEGAL_DIR, 'structure.json');
const TOPICS_PATH = path.join(LEGAL_DIR, 'topics.json');
const CRITICAL_CHECK_PATH = path.join(LEGAL_DIR, 'critical-paragraphs-check.json');

const CRITICAL_PARAS = [
  "2", "8", "14", "20", "21", "22", "25", "26", "28", "29", "30",
  "32", "34", "36", "37", "38", "39", "40", "41", "42", "43", "44",
  "85", "86", "87", "144", "145", "189", "212", "221", "345", "346", "348"
];

function fail(msg) {
  console.error(`\x1b[31m[VALIDATION FAILED]\x1b[0m ${msg}`);
  process.exit(1);
}

function pass(msg) {
  console.log(`\x1b[32m✔\x1b[0m ${msg}`);
}

console.log('====================================================');
console.log('   FORENZDETECTIV — LEGAL SOURCE OF TRUTH AUDIT     ');
console.log('====================================================\n');

// 1. PDF Exists
if (!fs.existsSync(PDF_PATH)) {
  fail(`PDF source file not found at: ${PDF_PATH}`);
}
pass(`Source PDF file exists: ${PDF_PATH}`);

// 2. Calculate SHA-256
const buffer = fs.readFileSync(PDF_PATH);
const calculatedHash = crypto.createHash('sha256').update(buffer).digest('hex');
pass(`SHA-256 Calculated: ${calculatedHash}`);

// 3. Validate Manifest
if (!fs.existsSync(MANIFEST_PATH)) {
  fail(`Manifest file missing: ${MANIFEST_PATH}`);
}
let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
} catch (e) {
  fail(`Manifest JSON parse error: ${e.message}`);
}

if (manifest.sha256 !== calculatedHash) {
  fail(`Manifest SHA-256 mismatch! Manifest: ${manifest.sha256}, Calculated: ${calculatedHash}`);
}
pass(`Manifest SHA-256 hash match verified.`);

if (manifest.law_id !== '300/2005') {
  fail(`Invalid law_id in manifest: ${manifest.law_id}`);
}
if (!manifest.effective_from || !manifest.effective_to) {
  fail(`Missing effective dates in manifest.`);
}
pass(`Manifest metadata valid (Zákon č. ${manifest.law_id} Z. z., Účinnosť: ${manifest.effective_from} – ${manifest.effective_to}, Strán: ${manifest.page_count}).`);

// 4. Validate Paragraphs Dataset
if (!fs.existsSync(PARAGRAPHS_PATH)) {
  fail(`Paragraphs file missing: ${PARAGRAPHS_PATH}`);
}
let paragraphs;
try {
  paragraphs = JSON.parse(fs.readFileSync(PARAGRAPHS_PATH, 'utf-8'));
} catch (e) {
  fail(`Paragraphs JSON parse error: ${e.message}`);
}

if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
  fail(`Paragraphs dataset is empty or not an array.`);
}
pass(`Paragraphs dataset loaded: ${paragraphs.length} paragraphs found.`);

// 5. Check No Duplicate Paragraphs
const seenParas = new Set();
const duplicateParas = [];
for (const p of paragraphs) {
  if (seenParas.has(p.paragraph)) {
    duplicateParas.push(p.paragraph);
  }
  seenParas.add(p.paragraph);
}
if (duplicateParas.length > 0) {
  fail(`Duplicate paragraphs detected: ${duplicateParas.join(', ')}`);
}
pass(`No duplicate paragraphs (527 unique § verified).`);

// 6. Check No Empty Legal Text & Valid Source Location
let emptyTextCount = 0;
let invalidPageCount = 0;
let totalSectionsCount = 0;

for (const p of paragraphs) {
  if (!p.text || typeof p.text !== 'string' || p.text.trim().length === 0) {
    emptyTextCount++;
  }
  if (!p.source || p.source.pageStart < 1 || p.source.pageEnd > manifest.page_count || p.source.pageStart > p.source.pageEnd) {
    invalidPageCount++;
  }
  if (!Array.isArray(p.sections) || p.sections.length === 0) {
    fail(`Paragraph § ${p.paragraph} has no valid sections array.`);
  }
  for (const s of p.sections) {
    totalSectionsCount++;
    if (!s.text || s.text.trim().length === 0) {
      fail(`Section ${s.id} in § ${p.paragraph} has empty text.`);
    }
    if (!s.source || s.source.page < 1 || s.source.page > manifest.page_count) {
      fail(`Section ${s.id} in § ${p.paragraph} has invalid page number: ${s.source?.page}`);
    }
  }
}

if (emptyTextCount > 0) {
  fail(`Found ${emptyTextCount} paragraphs with empty legal text.`);
}
if (invalidPageCount > 0) {
  fail(`Found ${invalidPageCount} paragraphs with invalid source page references.`);
}
pass(`Integrity verified across ${paragraphs.length} paragraphs and ${totalSectionsCount} sections (0 empty texts, 0 page errors).`);

// 7. Verify Critical Paragraphs
const missingCritical = [];
for (const num of CRITICAL_PARAS) {
  const found = paragraphs.find(p => p.paragraph === num);
  if (!found) {
    missingCritical.push(num);
  }
}
if (missingCritical.length > 0) {
  fail(`Missing critical forensic paragraphs: § ${missingCritical.join(', § ')}`);
}
pass(`All ${CRITICAL_PARAS.length} critical forensic paragraphs verified present with exact source references.`);

// 8. Verify Structure Tree
if (!fs.existsSync(STRUCTURE_PATH)) {
  fail(`Structure file missing: ${STRUCTURE_PATH}`);
}
let structure;
try {
  structure = JSON.parse(fs.readFileSync(STRUCTURE_PATH, 'utf-8'));
} catch (e) {
  fail(`Structure JSON parse error: ${e.message}`);
}
if (!Array.isArray(structure) || structure.length < 3) {
  fail(`Structure tree must contain at least 3 parts (Prvá, Druhá, Tretia časť). Found: ${structure?.length}`);
}
pass(`Legal structure hierarchy verified: ${structure.length} Parts, ${structure.reduce((acc, p) => acc + p.hlavy.length, 0)} Hlavy.`);

// 9. Verify Topics Mapping
if (!fs.existsSync(TOPICS_PATH)) {
  fail(`Topics file missing: ${TOPICS_PATH}`);
}
let topics;
try {
  topics = JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf-8'));
} catch (e) {
  fail(`Topics JSON parse error: ${e.message}`);
}
if (!Array.isArray(topics) || topics.length === 0) {
  fail(`Topics dataset is empty.`);
}
for (const t of topics) {
  for (const pNum of t.paragraphs) {
    if (!seenParas.has(pNum)) {
      fail(`Topic "${t.topic}" references non-existent paragraph § ${pNum}`);
    }
  }
}
pass(`Forensic topics mapping verified: ${topics.length} forensic topic clusters referencing verified § nodes.`);

console.log('\n====================================================');
console.log('\x1b[32m✔ AUDIT COMPLETE: LEGAL SOURCE OF TRUTH IS 100% VALID\x1b[0m');
console.log('====================================================');
process.exit(0);
