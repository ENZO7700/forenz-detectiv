# Stripe Setup — ForenzDetectiv Pro

## Fail-closed (produkcia)

Bez `VITE_STRIPE_PUBLIC_KEY` / `VITE_STRIPE_PUBLISHABLE_KEY` a bez `STRIPE_SECRET_KEY` v Base44 secrets:

- [`src/lib/stripe.js`](../src/lib/stripe.js) **nezaktivuje** plán a vráti chybu
- [`createCheckoutSession`](../base44/functions/createCheckoutSession/entry.ts) vráti **503** (žiadny mock checkout)
- [`PricingModal`](../src/components/pricing/PricingModal.jsx) zobrazí chybovú hlášku — žiadny voľný upgrade

## Live mode

1. Vytvor produkty v Stripe Dashboard:
   - Pro monthly / Pro yearly (−20 %)
   - Agency (voliteľné)
2. Pridaj do `.env.local` / Vercel env:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

3. Nastav Base44 secret `STRIPE_SECRET_KEY`.
4. Frontend volá `createCheckoutSession` a redirectuje na `session.url`.
5. Upgrade plánu až po overení platby (success URL / webhook) — nie v klientovi pred platbou.

## Licenčné kľúče (offline / B2B)

Aktívne kľúče v [`usePlanStore`](../src/store/usePlanStore.js):

- `PRO-LAWYER-2026` → Pro 365 dní
- `ACADEMIA-SK` → Pro 180 dní
- `AGENCY-PARTNER` → Agency 365 dní

## Referral

`?ref=USER_ID` iba zaznamená referrer do `localStorage` (`forenz_incoming_ref`). **Neudeľuje** automatický Pro kredit.
