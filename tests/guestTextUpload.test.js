import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeCloudCaseWithLocal,
  shouldSkipFetchAfterUpload,
  casePayloadFromStore
} from '../src/lib/bulkUploadSync.js';
import { mergeClientOcrIntoCase } from '../src/lib/clientOcrPipeline.js';

describe('Guest/offline .txt upload persistence', () => {
  test('mergeCloudCaseWithLocal preserves in-memory txt docs when cloud fetch is empty', () => {
    const localDoc = {
      id: 'doc_local_txt',
      title: 'Výpoveď číslo 1 - Dimiti Cohen.txt',
      status: 'done',
      source_kind: 'text_upload'
    };
    const merged = mergeCloudCaseWithLocal(
      { documents: [], persons: [], events: [], claims: [] },
      { documents: [localDoc], persons: [{ id: 'p1', name: 'Ján', document_id: 'doc_local_txt' }] }
    );
    assert.equal(merged.documents.length, 1);
    assert.equal(merged.documents[0].title, localDoc.title);
    assert.equal(merged.persons.length, 1);
  });

  test('shouldSkipFetchAfterUpload for guest/offline-only batches', () => {
    assert.equal(
      shouldSkipFetchAfterUpload({ localOnlyCount: 0, cloudCount: 0, guestOffline: true }),
      true
    );
    assert.equal(
      shouldSkipFetchAfterUpload({ localOnlyCount: 1, cloudCount: 0, guestOffline: false }),
      true
    );
    assert.equal(
      shouldSkipFetchAfterUpload({ localOnlyCount: 0, cloudCount: 2, guestOffline: false }),
      false
    );
  });

  test('mergeClientOcrIntoCase appends document when missing from store (cloud create without setDocuments)', () => {
    const ocrShape = {
      ok: true,
      text: 'Svedok Peter Kováč uviedol, že bol doma o 21:30.',
      confidence: 92,
      lines: ['Svedok Peter Kováč uviedol, že bol doma o 21:30.'],
      lowConfidence: false,
      source: 'text_file'
    };
    const merged = mergeClientOcrIntoCase(
      { documents: [], persons: [], relationships: [], redFlags: [], flaggedPassages: [], claims: [], events: [], locations: [], vehicles: [], contradictions: [], overrides: [] },
      {
        documentTitle: 'vypoved.txt',
        entities: { persons: [], events: [], claims: [], flaggedPassages: [] },
        documentPatch: { extracted_text: ocrShape.text, summary: 'OCR: 52 znakov' }
      },
      'doc_orphan_txt'
    );
    assert.equal(merged.documents.length, 1);
    assert.equal(merged.documents[0].id, 'doc_orphan_txt');
    assert.equal(merged.documents[0].title, 'vypoved.txt');
    assert.match(merged.documents[0].extracted_text, /Peter Kováč/);
  });

  test('casePayloadFromStore strips __localOnly before IndexedDB save', () => {
    const payload = casePayloadFromStore({
      documents: [{
        id: 'doc_txt_1',
        title: 'Výpoveď číslo 1 - Dimiti Cohen.txt',
        status: 'done',
        source_kind: 'text_upload',
        __localOnly: true
      }],
      persons: [],
      relationships: [],
      redFlags: [],
      flaggedPassages: [],
      claims: [],
      events: [],
      locations: [],
      vehicles: [],
      contradictions: [],
      overrides: []
    });
    assert.equal(payload.documents.length, 1);
    assert.equal(payload.documents[0].title, 'Výpoveď číslo 1 - Dimiti Cohen.txt');
    assert.equal('__localOnly' in payload.documents[0], false);
  });
});
