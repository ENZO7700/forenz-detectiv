# Master E2E Specification — ForenzDetectiv 2026

Mapovanie 12 scenárov na **Playwright** (`e2e/master/*.spec.js`) a existujúce **unit** suite (`npm test`).

## Spustenie

```bash
npm test
npm run test:e2e
npx playwright test e2e/master
```

Playwright štartuje Vite na **127.0.0.1:5174** (oddelené od `npm run dev` na 5173).

**Poznámka:** Produkt nemá demo case. E2E overuje upload-first Home, limity súborov, paywall, PWA shell. Graph/map/alibi s reálnymi dátami = unit testy (`geospatialEngine`, integrity) + manuálny upload. 49–52 MB heap = `tests/upload49mbSmoke.test.js`.

## Coverage matrix

| Scenár | Playwright | Unit / iné | Súbory |
|--------|------------|------------|--------|
| **01** Onboarding, guest, IndexedDB | `01-onboarding-idb.spec.js` | — | HomeHero, offlineDb |
| **02** Mega upload / bulk / 50 MB gate | `02-upload-pipeline.spec.js` | `upload49mbSmoke`, BULK-CAP | HomeHero |
| **03** Graph empty / shell | `03-graph-map.spec.js` | PageRank integrity | GraphCanvas |
| **04** Alibi mapa | empty + unit geospatial | geospatialEngine | MapView |
| **05** Legal § 300/2005 | smoke | `legalIntegration` | LegalRetriever |
| **06** Timeline | empty home | — | EventTimeline |
| **07** Archív | empty home | — | ArchiveView |
| **08** Sherlock shell | button visible | `aiRetry` | SherlockChat |
| **09** PDF export | hidden without case | crypto/pdf tests | PdfExportDialog |
| **10** Paywall + license | `10-paywall-license.spec.js` | plan guard | PricingModal |
| **11** PWA / mobile / offline | `11-pwa-mobile.spec.js` | — | MobileDrawer |
| **12** Telemetry sanitization | `12-telemetry-sanitize.spec.js` | analytics sanitizer | analytics.js |

## Zámerné limity E2E

- Žiadny live Mistral call v CI.
- Žiadny synthetic BA–KE demo v produkte ani v E2E bootstrap.
- Looker / Stripe live / GitHub billing = ops (`docs/REMAINING_BACKLOG.md`).
