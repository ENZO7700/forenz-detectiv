# Remaining backlog — po PROMPT-01..12 (100 %)

Stav: produktový sprint + **PROMPT-OPS-01 cutover** (demo gated, PDF chunking, E2E harden, Document schema push).

**Zámerné rozhodnutia (neotvárať znova):**

- Demo CTA / `loadDemoCase` len s `VITE_ENABLE_DEMO=true` (alebo E2E `__FORENZ_E2E_DEMO__`) — produkcia bez synthetic cases
- Graph / Sherlock systémové stringy ostávajú SK v tejto vlne
- Do `assetlinks.json` sa nedáva fake SHA-256 — len fingerprint z reálneho keystore

**Ako použiť:** každý ticket nižšie skopíruj do GitHub Issue. `gh` CLI môže vyžadovať `gh auth login`.

**Pipeline (hotové):** upload → validate ≤50 MB → PDF page-chunking (`pdf_container` + `pdf_page`, max 40 strán) → `analyzeDocument` → contradictions. Polia `parent_document_id` / `page_number` / `page_count` / `source_kind` sú v `Document.jsonc` a **`base44 entities push` prebehlo** (PROMPT-OPS-01).

---

## Done vs Remaining

| Oblasť | Stav | Poznámka |
|--------|------|----------|
| Debug HMR / WS probe | Done | HMR na `127.0.0.1`, bez ingestu |
| UTM + LeadCapture; MiniPlayground odstránený | Done | HomeHero = upload-first |
| Audit `logAction` + AuditLogViewer | Done | |
| PostHog 8 helperov + wiring | Done | |
| Onboarding QuickTip / non-blocking intro | Done | |
| PdfExportDialog, bulk ≤20, i18n shell SK/CS | Done | |
| `canCreateCase` + referral credit | Done | |
| TWA scaffolding + PNG + docs | Done | fingerprint = placeholder → RB-06 |
| Stripe test mode + docs | Done | live Checkout → RB-05 |
| Looker / Ads **docs** | Done | live dashboard → RB-04 / RB-07 |
| PDF page-chunking + Document schema push | Done | **PROMPT-OPS-01** |
| Demo production gate (`VITE_ENABLE_DEMO`) | Done | **PROMPT-OPS-01** |
| Master E2E (Playwright S01–S12) | Done | merge `cursor/e2e-master-hardening` |
| Lokálny CI gate | Done | focused + lint/typecheck/build |
| `trackContradictionDetected` mimo demo | Done | **RB-03** |
| Stripe `createCheckoutSession` | Done | **RB-05** |
| GitHub Actions zelený | Remaining | billing lock → **RB-01** |
| PostHog EU prod key | Remaining | **RB-02** |
| Looker North Star chart | Remaining | **RB-04** |
| assetlinks SHA-256 z keystore | Remaining | **RB-06** |
| Beta 100 + Ads ops | Remaining | **RB-07** |

```mermaid
flowchart TD
  T1[RB01_GitHub_Billing_CI] --> T2[RB02_PostHog_Live]
  T2 --> T3[RB03_ContradictionDetected_Wire]
  T2 --> T4[RB04_Looker_Dashboard]
  T5[RB05_Stripe_Checkout_Function] --> T6[RB06_TWA_Fingerprint]
  T4 --> T7[RB07_Beta_Ads]
```

---

## RB-01 — Unlock GitHub Actions billing + re-run CI

**Title:** `ops: unlock GitHub billing and get CI green on main`

**Why:** Actions job `test-lint-build` končí failure s 0 steps — účet je locked due to billing. Lokálny gate už PASS; bez odomknutia nie je GitHub „zelený“.

**Acceptance:**

- [ ] Billing issue na GitHub účte vyriešený
- [ ] Workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) na `main` prebehne: test → lint → typecheck → build
- [ ] Posledný run na `main` má conclusion `success`

**Owner hint:** Account admin (GitHub Settings → Billing). Dev: po unlock re-run failed workflow alebo prázdny commit.

**Depends on:** nič

---

## RB-02 — PostHog EU live keys

**Title:** `ops: set VITE_POSTHOG_KEY for EU production analytics`

**Why:** Bez kľúča je analytika no-op — North Star (`contradiction_viewed`) sa v cloude nemeria.

**Acceptance:**

- [ ] `VITE_POSTHOG_KEY` (+ `VITE_POSTHOG_HOST=https://eu.i.posthog.com`) v prod / Base44 env
- [ ] Po `demo_launched` alebo uploade viditeľný event v PostHog EU Live
- [ ] Session recording ostáva vypnutá (súlad s [`src/lib/analytics.js`](../src/lib/analytics.js))

**Owner hint:** Product / DevOps. Referencia: [`docs/LOOKER_POSTHOG.md`](LOOKER_POSTHOG.md), [`.env.example`](../.env.example).

**Depends on:** RB-01 voliteľné (nezávislé od CI)

---

## RB-03 — Wire `trackContradictionDetected` on real detection

**Title:** `fix(analytics): fire contradiction_detected outside demo load`

**Why:** `trackContradictionDetected` sa dnes volá len v [`src/store/useForenzStore.js`](../src/store/useForenzStore.js) pri `loadDemoCase`. Reálna detekcia rozporov North Star funnel skresľuje.

**Acceptance:**

- [ ] Po úspešnom `detectContradictions` / store update reálnych rozporov sa volá `trackContradictionDetected(count, hasAlibiConflict)`
- [ ] Demo path ostáva bez dvojitého double-count (alebo je explicitne OK)
- [ ] `npm test` + lint/typecheck PASS; žiadne PII v properties

**Owner hint:** Frontend. Súbory: `useForenzStore.js`, handlery v `ForenzDetectiv.jsx` / contradiction engine callback.

**Depends on:** RB-02 (aby sa event dal overiť v PostHog; kód ide aj bez neho)

---

## RB-04 — Looker Studio North Star chart

**Title:** `ops: Looker Studio WAU contradiction_viewed + funnel`

**Why:** Docs existujú; chýba zdieľateľný dashboard pre Weekly Active Investigators.

**Acceptance:**

- [ ] Looker Studio data source napojený na PostHog EU (alebo BigQuery export)
- [ ] Scorecard: weekly unique users s eventom `contradiction_viewed`
- [ ] Funnel: `demo_launched` → `case_created` → `contradiction_detected` → `contradiction_viewed` → `pdf_exported`
- [ ] Zdieľateľný link (screenshot do repo **nie** povinný)

**Owner hint:** Growth / Analytics. Špec: [`docs/LOOKER_POSTHOG.md`](LOOKER_POSTHOG.md).

**Depends on:** RB-02

---

## RB-05 — Stripe live `createCheckoutSession`

**Title:** `feat(stripe): Base44 createCheckoutSession + live Checkout redirect`

**Why:** [`src/lib/stripe.js`](../src/lib/stripe.js) volá `/api/create-checkout-session` len keď je public key; backend funkcia ešte neexistuje. Bez nej live key padne na chýbajúci endpoint.

**Acceptance:**

- [ ] Nová Base44 function (vzor v [`base44/functions/`](../base44/functions/)) vytvorí Stripe Checkout Session a vráti `{ id }`
- [ ] S `VITE_STRIPE_PUBLIC_KEY` → `redirectToCheckout`
- [ ] Bez kľúča ostáva test mode + banner v PricingModal
- [ ] Aktualizovaný [`docs/STRIPE_SETUP.md`](STRIPE_SETUP.md) (secrets, price IDs)
- [ ] Žiadne falošné live charge v CI

**Owner hint:** Backend + Frontend. Secrets: Stripe secret key v Base44, nie v gite.

**Depends on:** Stripe účet (business). Kód nezávisí od RB-01.

---

## RB-06 — TWA upload-key SHA-256

**Title:** `ops(twa): replace assetlinks placeholder with keystore SHA-256`

**Why:** [`public/.well-known/assetlinks.json`](../public/.well-known/assetlinks.json) má `REPLACE_WITH_UPLOAD_KEY_SHA256`. Play / Digital Asset Links bez fingerprintu neprejde.

**Acceptance:**

- [ ] Keystore / Bubblewrap upload key existuje
- [ ] SHA-256 vložený do `assetlinks.json` (formát `AA:BB:…`)
- [ ] Na produkcii `/.well-known/assetlinks.json` → 200
- [ ] Digital Asset Links verification OK (Chrome / Play)

**Owner hint:** Mobile / Release. Kroky: [`docs/TWA_SETUP.md`](TWA_SETUP.md). PNG ikony a `android/twa-manifest.json` už sú.

**Depends on:** RB-05 nie je tvrdé; prakticky po Play signing. Nezávisí od PostHog.

---

## RB-07 — Beta 100 + Ads ops

**Title:** `ops: segmented beta 100 + SK/CZ Google Ads UTM checklist`

**Why:** Growth mimo kódu — overiť funnel s reálnymi investigátormi a atribúciu cez UTM.

**Acceptance:**

- [ ] Zoznam / segment ~100 beta (LEA, advokáti, investigátori) s invite flow
- [ ] Landing URL s UTM podľa [`docs/GOOGLE_ADS.md`](GOOGLE_ADS.md)
- [ ] Overené: `lead_captured` / `case_created` v PostHog s `utm_source`
- [ ] Kampane SK/CZ checklist (brand + intent + negatives) — **spend a kill-CPI = business rozhodnutie**, nie kódový DoD

**Owner hint:** Founder / Growth. Tech depends: RB-02 (meranie), ideálne RB-04.

**Depends on:** RB-02; odporúčané RB-04

---

## Referencie

| Doc | Účel |
|-----|------|
| [LOOKER_POSTHOG.md](LOOKER_POSTHOG.md) | 8 eventov, North Star, Looker |
| [GOOGLE_ADS.md](GOOGLE_ADS.md) | UTM + kampane SK/CZ |
| [STRIPE_SETUP.md](STRIPE_SETUP.md) | Test vs live Stripe |
| [TWA_SETUP.md](TWA_SETUP.md) | Bubblewrap, assetlinks, Play |
| [todo.md](todo.md) | Historický katalóg PROMPT-01..12 (nemazať / neprepisovať statusy tu) |
