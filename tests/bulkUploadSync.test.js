import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  shouldSyncBulkViaOfflineOnly,
  buildBulkOfflineSuccessMessage,
  buildBulkAnalyzeFailureMessage,
  casePayloadFromStore,
  mergeLocalDocuments,
  mergeCloudCaseWithLocal,
  shouldSkipFetchAfterUpload
} from '../src/lib/bulkUploadSync.js';

describe('Bulk PNG / offline upload sync', () => {
  test('offline-only bulk batch skips cloud fetch (regression: fetchData wiped local docs)', () => {
    assert.equal(shouldSyncBulkViaOfflineOnly({ localOnlyCount: 3, cloudCount: 0 }), true);
    assert.equal(shouldSyncBulkViaOfflineOnly({ localOnlyCount: 1, cloudCount: 0 }), true);
    assert.equal(shouldSyncBulkViaOfflineOnly({ localOnlyCount: 0, cloudCount: 2 }), false);
    assert.equal(shouldSyncBulkViaOfflineOnly({ localOnlyCount: 2, cloudCount: 1 }), false);
  });

  test('offline success messages mention local archive and AI requirement in Slovak', () => {
    assert.match(buildBulkOfflineSuccessMessage(1), /lokáln/);
    assert.match(buildBulkOfflineSuccessMessage(4), /4 súborov/);
    assert.match(buildBulkOfflineSuccessMessage(4), /AI analýza vyžaduje pripojenie/);
  });

  test('analyze failure message is graceful, not a crash string', () => {
    assert.equal(buildBulkAnalyzeFailureMessage(0), null);
    assert.match(buildBulkAnalyzeFailureMessage(2), /AI analýza zlyhala/);
  });

  test('casePayloadFromStore strips __localOnly before IndexedDB save', () => {
    const payload = casePayloadFromStore({
      documents: [{ id: 'doc_1', title: 'a.png', __localOnly: true }],
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
    assert.equal(payload.documents[0].title, 'a.png');
    assert.equal('__localOnly' in payload.documents[0], false);
  });

  test('mergeLocalDocuments preserves cloud docs and re-attaches offline uploads', () => {
    const cloud = [{ id: 'cloud-1', title: 'remote.pdf' }];
    const local = [{ id: 'doc_local', title: 'scan1.png' }, { id: 'doc_local2', title: 'scan2.png' }];
    const merged = mergeLocalDocuments(cloud, local);
    assert.deepEqual(merged.map((d) => d.id), ['doc_local', 'doc_local2', 'cloud-1']);
    assert.deepEqual(mergeLocalDocuments(cloud, [{ id: 'cloud-1', title: 'dup' }]), cloud);
  });

  test('mergeCloudCaseWithLocal keeps guest txt docs when cloud list is empty', () => {
    const merged = mergeCloudCaseWithLocal(
      { documents: [], persons: [], events: [], claims: [] },
      {
        documents: [{ id: 'doc_txt', title: 'vypoved.txt', status: 'done' }],
        persons: [],
        events: [],
        claims: []
      }
    );
    assert.equal(merged.documents.length, 1);
    assert.equal(merged.documents[0].title, 'vypoved.txt');
  });

  test('shouldSkipFetchAfterUpload true for guest offline session', () => {
    assert.equal(
      shouldSkipFetchAfterUpload({ localOnlyCount: 0, cloudCount: 0, guestOffline: true }),
      true
    );
  });
});
