import { create } from 'zustand';

const VALID_LICENSE_KEYS = {
  'PRO-LAWYER-2026': { plan: 'pro', validDays: 365 },
  'DEMO-VIP': { plan: 'pro', validDays: 90 },
  'ACADEMIA-SK': { plan: 'pro', validDays: 180 },
  'AGENCY-PARTNER': { plan: 'agency', validDays: 365 }
};

const getStoredPlan = () => {
  if (typeof window === 'undefined') return 'free';
  return localStorage.getItem('forenz_user_plan') || 'free';
};

const getStoredUserId = () => {
  if (typeof window === 'undefined') return 'USR-101';
  let uid = localStorage.getItem('forenz_user_id');
  if (!uid) {
    uid = 'ADV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem('forenz_user_id', uid);
  }
  return uid;
};

export const usePlanStore = create((set, get) => ({
  plan: getStoredPlan(), // 'free' | 'pro' | 'agency'
  userId: getStoredUserId(),
  referralCreditsDays: 0,
  pricingModalOpen: false,
  paywallReason: null,

  setPricingModalOpen: (open, reason = null) => set({ pricingModalOpen: open, paywallReason: reason }),

  upgradePlan: (newPlan) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('forenz_user_plan', newPlan);
    }
    set({ plan: newPlan, pricingModalOpen: false, paywallReason: null });
  },

  canCreateCase: (currentCaseCount = 0) => {
    const { plan } = get();
    if (plan === 'pro' || plan === 'agency') return true;
    return currentCaseCount < 2; // Free limit: 2 cases
  },

  canAddDocument: (currentDocCount = 0) => {
    const { plan } = get();
    if (plan === 'pro' || plan === 'agency') return true;
    return currentDocCount < 5; // Free limit: 5 documents per case
  },

  activateLicenseKey: (key) => {
    const trimmed = (key || '').trim().toUpperCase();
    const license = VALID_LICENSE_KEYS[trimmed];
    if (license) {
      get().upgradePlan(license.plan);
      return { success: true, plan: license.plan, days: license.validDays };
    }
    return { success: false, error: 'Neplatný alebo expirovaný licenčný kľúč.' };
  },

  getReferralLink: () => {
    const { userId } = get();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://forenzdetectiv.sk';
    return `${origin}?ref=${userId}`;
  },

  captureReferralCode: () => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('forenz_incoming_ref', ref);
    }
  }
}));
