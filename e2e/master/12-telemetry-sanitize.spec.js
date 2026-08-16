import { test, expect } from '@playwright/test';
import { sanitizeAnalyticsProps } from '../../src/lib/analytics.js';
import { gotoApp, dismissQuickTipIfPresent, expectUploadFirstHome } from '../helpers.js';

test.describe('S12 — Telemetria & GDPR sanitizácia', () => {
  test('sanitizeAnalyticsProps stripuje PII', async () => {
    const clean = sanitizeAnalyticsProps({
      name: 'Ján Novák',
      source_quote: 'Bol som v Bratislave',
      email: 'jan@example.com',
      contradiction_type: 'alibi',
      count: 2
    });
    expect(clean.name).toBeUndefined();
    expect(clean.source_quote).toBeUndefined();
    expect(clean.email).toBeUndefined();
    expect(clean.contradiction_type).toBe('alibi');
    expect(clean.count).toBe(2);
  });

  test('Po návšteve Home žiadny PostHog payload s citáciou (ak beží)', async ({ page }) => {
    const leaked = [];
    page.on('request', (req) => {
      const url = req.url();
      if (!/posthog|i\.posthog|sentry/i.test(url)) return;
      const post = req.postData() || '';
      if (/Novák|source_quote|rodn|@gmail|citát/i.test(post)) {
        leaked.push(post.slice(0, 200));
      }
    });

    await expectUploadFirstHome(page);
    await page.waitForTimeout(800);
    expect(leaked).toEqual([]);
  });
});
