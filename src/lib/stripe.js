import { base44 } from '../api/base44Client.js';

const STRIPE_PUBLIC_KEY = import.meta.env?.VITE_STRIPE_PUBLIC_KEY || import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Presmeruje používateľa na Stripe Checkout session.
 * Bez verejného kľúča alebo bez session URL zlyhá zatvorene — žiadny testovací upgrade.
 * @param {string} plan - 'pro' | 'team' | 'agency'
 * @param {string} interval - 'month' | 'year'
 */
export async function redirectToCheckout({ plan = 'pro', interval = 'month' } = {}) {
  if (!STRIPE_PUBLIC_KEY) {
    return {
      success: false,
      error: 'Platby nie sú nakonfigurované. Nastavte VITE_STRIPE_PUBLIC_KEY v produkcii.'
    };
  }

  try {
    const successUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?payment=success&plan=${plan}`
      : 'https://forenzdetectiv.sk/?payment=success';
    const cancelUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?payment=cancelled`
      : 'https://forenzdetectiv.sk/?payment=cancelled';

    const res = await base44.functions.invoke('createCheckoutSession', {
      plan,
      interval,
      successUrl,
      cancelUrl
    });

    const session = res?.data;
    if (session?.error) {
      return { success: false, error: session.error };
    }
    if (session?.testMode) {
      return {
        success: false,
        error: 'Stripe nie je nakonfigurovaný na serveri. Checkout nie je dostupný.'
      };
    }
    if (session?.url && typeof window !== 'undefined') {
      window.location.href = session.url;
      return { success: true, sessionId: session.id };
    }

    return { success: false, error: 'Nepodarilo sa vytvoriť Stripe Checkout session.' };
  } catch (err) {
    console.warn('[Checkout] createCheckoutSession zlyhalo:', err);
    return {
      success: false,
      error: err?.message || 'Checkout zlyhal. Skúste to znova neskôr.'
    };
  }
}
