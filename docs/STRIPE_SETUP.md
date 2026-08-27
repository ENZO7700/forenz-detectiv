# Stripe Setup — ForenzDetectiv Pro

## Status: PAUSED (clean production testing)

Monetization is **hard-disabled** in the frontend:

- [`src/lib/monetization.js`](../src/lib/monetization.js) → `isMonetizationEnabled = false`
- [`src/lib/stripe.js`](../src/lib/stripe.js) **removed** (client checkout)
- `@stripe/*` npm packages **removed**
- Paywall / Pricing / Referral UI **not rendered**
- Client license keys (`PRO-LAWYER-2026`, …) **removed**
- Limits: unlimited cases/docs while paused

Backend function [`createCheckoutSession`](../base44/functions/createCheckoutSession/entry.ts) remains in the repo for later RB-05 re-enable — do not publish/use until Stripe is restored.

## Re-enable checklist (RB-05)

1. Restore `src/lib/stripe.js` + `@stripe/stripe-js` (or keep direct `createCheckoutSession` invoke)
2. Set `isMonetizationEnabled = true` (or env gate)
3. Wire PricingModal / PaywallGate / AppBar entry points again
4. Add Stripe domains back to CSP in `index.html`
5. Set `VITE_STRIPE_PUBLIC_KEY` (Vercel) + Base44 secret `STRIPE_SECRET_KEY`
6. Stripe Dashboard products / price IDs + webhook / success URL plan sync

## Referral

`?ref=USER_ID` only stores `forenz_incoming_ref` in localStorage. No Pro credit.
