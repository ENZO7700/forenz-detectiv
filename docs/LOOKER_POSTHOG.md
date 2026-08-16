# PostHog EU → Looker Studio

Privacy-first produktová analytika ForenzDetectiv (EU host, bez session recording, maskovaný text).

## North Star

**Weekly investigators with `contradiction_viewed`**

Tzn. počet unikátnych používateľov (alebo anonymous distinct_id), ktorí za posledných 7 dní odoslali aspoň jednu udalosť `contradiction_viewed`.

## 8 kľúčových eventov

| Event | Kedy | Vlastnosti (bez PII) |
|-------|------|----------------------|
| `case_created` | Prvý upload / bulk | `source`, `file_count` |
| `file_uploaded` | Každý súbor | `file_type`, `size_kb` |
| `contradiction_detected` | Engine našiel rozpory | `count`, `has_alibi_conflict` |
| `contradiction_viewed` | **North Star** — user otvorí rozpor | `contradiction_type`, `time_to_view_sec` |
| `alibi_checked` | Map / geospatial check | `status`, `speed_kmh`, `distance_km` |
| `pdf_exported` | PDF export | `page_count`, `with_hash` |
| `share_card_generated` | Share card | `type` |
| `lead_captured` | Lead form | `source`, `has_email`, `utm_source` |

Doplnkové: `lead_captured` payload **bez** emailu (iba `has_email`).

## PostHog setup

1. Vytvor projekt v [PostHog EU](https://eu.posthog.com) (`https://eu.i.posthog.com`).
2. Do `.env.local`:

```bash
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

3. Over v Live events po `case_created` / uploade.
4. Vytvor Insight: Unique users where event = `contradiction_viewed`, interval = week.

## Looker Studio connector

1. Otvor [Looker Studio](https://lookerstudio.google.com) → Create → Data source.
2. Použi **PostHog** partner connector (alebo BigQuery export z PostHog → Looker).
3. Pripoj EU projekt (API key s read-only scope).
4. Odporúčané charts:
   - Scorecard: WAU of `contradiction_viewed`
   - Funnel: `case_created` → `contradiction_detected` → `contradiction_viewed` → `pdf_exported`
   - Time series: `alibi_checked` by `status`
   - Table: `lead_captured` by `utm_source` / `source`

## GDPR poznámky

- `sanitizeAnalyticsProps` v [`src/lib/analytics.js`](../src/lib/analytics.js) stripuje quote/name/email/phone.
- Session recording je vypnuté (`disable_session_recording: true`).
- Autocapture off; len explicitné `trackEvent` volania.
