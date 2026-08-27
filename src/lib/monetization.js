/**
 * Monetization (Stripe, paywall, pricing UI) is paused by default for production testing.
 * Set VITE_ENABLE_MONETIZATION=true to re-enable limits and checkout flows.
 */
export const isMonetizationEnabled =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_ENABLE_MONETIZATION === 'true';
