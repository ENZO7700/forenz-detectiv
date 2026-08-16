import { base44 } from '../api/base44Client.js';

const STRIPE_PUBLIC_KEY = import.meta.env?.VITE_STRIPE_PUBLIC_KEY || import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Presmeruje používateľa na Checkout session URL alebo simuluje úspešnú aktiváciu.
 * Bezpečne neťahá žiadne externé blokujúce Stripe skripty.
 * @param {string} plan - 'pro' | 'team' | 'agency'
 * @param {string} interval - 'month' | 'year'
 */
export async function redirectToCheckout({ plan = 'pro', interval = 'month' } = {}) {
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
    if (session?.url && typeof window !== 'undefined') {
      window.location.href = session.url;
      return { success: true, sessionId: session.id };
    }

    return { success: true, testMode: true, plan, interval };
  } catch (err) {
    console.warn('[Checkout] createCheckoutSession zlyhalo, prepínam na testovací režim:', err);
    return { success: true, testMode: true, plan, interval };
  }
}
