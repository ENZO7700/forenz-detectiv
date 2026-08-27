/**
 * Monetization is hard-disabled for clean production testing.
 * Stripe checkout UI and client deps are removed; backend createCheckoutSession
 * remains for later RB-05 re-enable. Flip to true only after restoring
 * src/lib/stripe.js + @stripe packages + PricingModal wiring.
 */
export const isMonetizationEnabled = false;
