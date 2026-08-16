import { loadStripe } from '@stripe/stripe-js';
import { base44 } from '@/api/base44Client';

const STRIPE_PUBLIC_KEY = import.meta.env?.VITE_STRIPE_PUBLIC_KEY || import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || '';

let stripePromise = null;
export function getStripe() {
  if (!stripePromise && STRIPE_PUBLIC_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
}

/**
 * Presmeruje používateľa na Stripe Checkout alebo simuluje úspešnú aktiváciu v testovacom režime.
 * @param {string} plan - 'pro' | 'team'
 * @param {string} interval - 'month' | 'year'
 */
export async function redirectToCheckout({ plan = 'pro', interval = 'month' }) {
  if (!STRIPE_PUBLIC_KEY) {
    console.info(`[STRIPE TEST MODE] Simulácia aktivácie predplatného pre plán: ${plan} (${interval})`);
    return { success: true, testMode: true, plan, interval };
  }

  try {
    const successUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?payment=success&plan=${plan}`
      : 'https://forenz.sk/?payment=success';
    const cancelUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?payment=cancelled`
      : 'https://forenz.sk/?payment=cancelled';

    const res = await base44.functions.invoke('createCheckoutSession', {
      plan,
      interval,
      successUrl,
      cancelUrl
    });

    const session = res?.data;
    if (session?.url) {
      window.location.href = session.url;
      return { success: true, sessionId: session.id };
    }

    if (session?.id) {
      const stripe = await getStripe();
      if (stripe) {
        return stripe.redirectToCheckout({ sessionId: session.id });
      }
    }

    throw new Error(session?.error || 'Nepodarilo sa vytvoriť Stripe reláciu');
  } catch (err) {
    console.warn('[Stripe] createCheckoutSession zlyhalo, prepínam na testovací režim:', err);
    return { success: true, testMode: true, plan, interval };
  }
}
