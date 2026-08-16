# Master E2E Specification — ForenzDetectiv 2026

Mapovanie 12 scenárov na **Playwright** (`e2e/master/*.spec.js`) a existujúce **unit** suite (`npm test`). Plná špecifikácia správania ostáva v tomto dokumente + v testoch.

## Spustenie

```bash
# Unit + legal + upload gates (rýchle, CI-friendly)
npm test

# Browser E2E — Playwright štartuje Vite na **127.0.0.1:5174** s `VITE_ENABLE_DEMO=true`
# (+ `window.__FORENZ_E2E_DEMO__` v addInitScript). Port 5174 = oddelený od bežného `npm run dev` (5173).
npm run test:e2e

# Len master suite
npx playwright test e2e/master
```

**Poznámka:** Produkčný build má demo vypnuté (`isDemoEnabled()` → `VITE_ENABLE_DEMO=true` len v E2E). 49–52 MB heap testy sú v `tests/upload49mbSmoke.test.js`; Playwright overuje size gate cez fake `File.size`.

## Coverage matrix

| Scenár | Playwright | Unit / iné | Súbory |
|--------|------------|------------|--------|
| **01** Onboarding, guest, IndexedDB | `01-onboarding-idb.spec.js` | — | HomeHero, offlineDb |
| **02** Mega upload / bulk / 50 MB gate | `02-upload-pipeline.spec.js` | `upload49mbSmoke`, `uiUxRegression` BULK-CAP | HomeHero, ForenzDetectiv |
| **03** Graph + PageRank UI | `03-graph-map.spec.js` | `integrity` PageRank | GraphCanvas |
| **04** Mapa alibi BA–KE | `03-graph-map.spec.js` (demo→map) | geospatialEngine tests | MapView, demoCaseData |
| **05** Legal § 300/2005 | smoke v `05-legal-sherlock-pdf.spec.js` | `legalIntegration`, integrity §8 | LegalRetriever |
| **06** Timeline / replay | `06-timeline-archive.spec.js` | — | EventTimeline / TimeSlider |
| **07** Archív / PDF filmstrip | `06-timeline-archive.spec.js` | — | ArchiveView |
| **08** Sherlock + AI retry toast copy | `05-legal-sherlock-pdf.spec.js` | `aiRetry` | SherlockChat |
| **09** PDF export dialog + SHA helper | `05-legal-sherlock-pdf.spec.js` | prompts06To12 crypto | PdfExportDialog |
| **10** Paywall + `PRO-LAWYER-2026` | `10-paywall-license.spec.js` | prompts08 plan guard | PricingModal, usePlanStore |
| **11** PWA / mobile / offline | `11-pwa-mobile.spec.js` | — | MobileDrawer, BottomNav |
| **12** Telemetry sanitization | `12-telemetry-sanitize.spec.js` | `analyticsAndSanitizer` | analytics.js |

## Zámerné limity E2E

- Žiadny live Mistral call (demo dataset namiesto upload→AI).
- Memory-leak heap profiling nie je v CI (S02 poznámka v teste).
- Looker / Stripe live / GitHub billing = ops (`docs/REMAINING_BACKLOG.md`), nie E2E.
