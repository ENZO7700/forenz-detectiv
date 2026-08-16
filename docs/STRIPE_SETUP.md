# Stripe Setup — ForenzDetectiv Pro

## Test mode (predvolené)

Ak nie je nastavený `VITE_STRIPE_PUBLIC_KEY` (ani `VITE_STRIPE_PUBLISHABLE_KEY`), aplikácia beží v **test mode**:

- [`src/lib/stripe.js`](../src/lib/stripe.js) simuluje úspešný checkout
- [`PricingModal`](../src/components/pricing/PricingModal.jsx) zobrazí banner „Testovací režim“
- Plán sa uloží do `localStorage` (`forenz_user_plan`)

## Live mode

1. Vytvor produkty v Stripe Dashboard:
   - Pro monthly / Pro yearly (−20 %)
   - Agency (voliteľné)
2. Pridaj do `.env.local`:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

3. Implementuj backend endpoint `POST /api/create-checkout-session` (Base44 function), ktorý vráti `{ id: sessionId }`.
4. Frontend volá `stripe.redirectToCheckout({ sessionId })`.

## Licenčné kľúče (offline / B2B)

Aktívne kľúče v [`usePlanStore`](../src/store/usePlanStore.js):

- `PRO-LAWYER-2026` → Pro 365 dní
- `DEMO-VIP` → Pro 90 dní
- `ACADEMIA-SK` → Pro 180 dní
- `AGENCY-PARTNER` → Agency 365 dní

## Referral

Pri prvej návšteve s `?ref=USER_ID` sa udeľuje 30-dňový Pro kredit (`forenz_referral_rewarded`).
