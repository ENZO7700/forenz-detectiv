import { loadStripe } from '@stripe/stripe-js';

const STRIPE_PUBLIC_KEY = import.meta.env?.VITE_STRIPE_PUBLIC_KEY || '';

let stripePromise = null;
export function getStripe() {
  if (!stripePromise && STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

/**
 * Presmeruje používateľa na Stripe Checkout alebo simuluje úspešnú aktiváciu v testovacom režime.
 * @param {string} priceId - ID cenového plánu v Stripe
 * @param {string} mode - 'subscription' | 'payment'
 */
export async function redirectToCheckout({ plan = 'pro', interval = 'month' }) {
  if (!STRIPE_PUBLIC_KEY) {
    console.info(`[STRIPE TEST MODE] Simulácia aktivácie predplatného pre plán: ${plan} (${interval})`);
    return { success: true, testMode: true, plan, interval };
  }

  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe knižnicu sa nepodarilo inicializovať.');
  }

  // Ak existuje reálny backend Stripe endpoint:
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, interval })
  });

  const session = await response.json();
  return stripe.redirectToCheckout({ sessionId: session.id });
}
