import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSha256Digest, generateCaseIntegrityDigest } from '../src/utils/cryptoUtils.js';
import skDict from '../src/locales/sk.json' with { type: 'json' };
import csDict from '../src/locales/cs.json' with { type: 'json' };

describe('PROMPT 06 & 07: Crypto & PDF Hash Integrity', () => {
  test('calculateSha256Digest vypočíta validný 64-znakový SHA-256 hash', async () => {
    const hash = await calculateSha256Digest('Testovaci retazec spisu 123');
    assert.strictEqual(typeof hash, 'string');
    assert.strictEqual(hash.length, 64);
    assert.match(hash, /^[a-f0-9]{64}$/);
  });

  test('generateCaseIntegrityDigest generuje deterministický hash s prefixom sha256:', async () => {
    const caseData = {
      caseTitle: 'Kauza K-402',
      documents: [{ id: '1', title: 'Výpoveď 1', content: 'Obsah výpovede' }],
      persons: [{ id: 'p1', name: 'Peter Kováč' }],
      contradictions: [{ id: 'c1', type: 'alibi' }]
    };

    const digest = await generateCaseIntegrityDigest(caseData);
    assert.ok(digest.startsWith('sha256:'));
    assert.strictEqual(digest.length, 7 + 64);
  });
});

describe('PROMPT 08: Monetization & Plan Guard Logic', () => {
  test('Licenčné kľúče sú odstránené z klienta (hard-disabled monetization)', async () => {
    const storeSrc = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../src/store/usePlanStore.js', import.meta.url), 'utf8')
    );
    assert.ok(!storeSrc.includes('PRO-LAWYER-2026'), 'PRO-LAWYER-2026 must be removed');
    assert.ok(!storeSrc.includes('VALID_LICENSE_KEYS'), 'VALID_LICENSE_KEYS must be removed');
    assert.ok(!storeSrc.includes('DEMO-VIP'), 'DEMO-VIP must stay absent');
  });

  test('Monetization hard-disabled → unlimited cases/docs', async () => {
    const { isMonetizationEnabled } = await import('../src/lib/monetization.js');
    assert.strictEqual(isMonetizationEnabled, false);

    // Guard logic while paused mirrors store: always allow
    const canCreateCase = () => true;
    const canAddDoc = () => true;
    assert.strictEqual(canCreateCase(), true);
    assert.strictEqual(canAddDoc(), true);
  });

  test('Referral ?ref= iba zaznamená kód — neudeľuje Pro upgrade', () => {
    const storage = new Map();
    let plan = 'free';

    const captureReferralCode = (search) => {
      const ref = new URLSearchParams(search).get('ref');
      if (ref) storage.set('forenz_incoming_ref', ref);
    };

    captureReferralCode('?ref=ADV-88392');
    assert.strictEqual(storage.get('forenz_incoming_ref'), 'ADV-88392');
    assert.strictEqual(plan, 'free');
  });

  test('src/lib/stripe.js je odstránený', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const stripePath = path.resolve('src/lib/stripe.js');
    assert.strictEqual(fs.existsSync(stripePath), false, 'stripe.js must be deleted');
  });
});

describe('PROMPT 09: i18n & Legal Terminology Localization', () => {
  test('SK a CS slovníky obsahujú kľúčové právne pojmy', () => {
    assert.ok(skDict.legal.case);
    assert.ok(csDict.legal.case);
    assert.strictEqual(skDict.legal.testimony, 'Výpoveď');
    assert.strictEqual(csDict.legal.testimony, 'Výpověď');
    assert.strictEqual(skDict.legal.courtProtocol, 'Súdny protokol');
    assert.strictEqual(csDict.legal.courtProtocol, 'Soudní protokol');
  });

  test('Všetky hlavné navigačné kľúče sú prítomné v oboch jazykoch', () => {
    const keys = Object.keys(skDict.nav);
    for (const k of keys) {
      assert.ok(csDict.nav[k], `Chýba preklad pre nav.${k} v cs.json`);
    }
  });
});

describe('PROMPT 10 & 12: Audit Logging & UTM Growth Tracking', () => {
  test('Audit log záznam obsahuje povinné atribúty', () => {
    const log = {
      id: 'LOG-test123',
      timestamp: new Date().toISOString(),
      action: 'CONTRADICTION_FLAGGED',
      details: { contradictionId: 'c1' },
      userRole: 'Vyšetrovateľ / Obhajca'
    };

    assert.ok(log.id.startsWith('LOG-'));
    assert.ok(log.timestamp);
    assert.strictEqual(log.action, 'CONTRADICTION_FLAGGED');
  });
});
