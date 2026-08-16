import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withAiRetry, isRetryableError, AiRetryError } from '../src/lib/aiRetry.js';

describe('Resilient AI Retry Engine', () => {
  test('isRetryableError správne deteguje HTTP 429, 503 a sieťové chyby', () => {
    assert.equal(isRetryableError({ status: 429 }), true);
    assert.equal(isRetryableError({ statusCode: 503 }), true);
    assert.equal(isRetryableError(new Error('Rate limit exceeded')), true);
    assert.equal(isRetryableError(new Error('Too many requests')), true);
    assert.equal(isRetryableError(new Error('Server overloaded')), true);
    assert.equal(isRetryableError(new Error('SyntaxError in JSON')), false);
    assert.equal(isRetryableError(null), false);
  });

  test('withAiRetry vráti výsledok okamžite pri úspešnom volaní', async () => {
    let callCount = 0;
    const result = await withAiRetry(async () => {
      callCount++;
      return { ok: true, data: 'analyzed' };
    });

    assert.equal(callCount, 1);
    assert.deepEqual(result, { ok: true, data: 'analyzed' });
  });

  test('withAiRetry opakuje pokus pri 429 a po úspechu vráti dáta', async () => {
    let callCount = 0;
    const retryLogs = [];

    const result = await withAiRetry(
      async () => {
        callCount++;
        if (callCount < 3) {
          const err = new Error('HTTP 429 Rate limit exceeded');
          err.status = 429;
          throw err;
        }
        return { ok: true, successOnAttempt: callCount };
      },
      {
        maxRetries: 3,
        initialDelayMs: 10,
        backoffFactor: 1.5,
        onRetry: (info) => retryLogs.push(info)
      }
    );

    assert.equal(callCount, 3);
    assert.equal(result.ok, true);
    assert.equal(retryLogs.length, 2);
    assert.equal(retryLogs[0].attempt, 1);
    assert.equal(retryLogs[1].attempt, 2);
  });

  test('withAiRetry neopakuje pri nekritických chybách (napr. 400 Bad Request)', async () => {
    let callCount = 0;

    await assert.rejects(
      async () => {
        await withAiRetry(async () => {
          callCount++;
          const err = new Error('Invalid document format');
          err.status = 400;
          throw err;
        });
      },
      { message: 'Invalid document format' }
    );

    assert.equal(callCount, 1);
  });
});
