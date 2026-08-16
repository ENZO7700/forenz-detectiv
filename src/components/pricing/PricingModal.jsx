import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Zap, Sparkles, Key, Loader2 } from 'lucide-react';
import { usePlanStore } from '@/store/usePlanStore';
import { redirectToCheckout } from '@/lib/stripe';
import { useTranslation } from '@/i18n/i18nContext';

export default function PricingModal({ isOpen, onClose }) {
  const { plan, upgradePlan, activateLicenseKey } = usePlanStore();
  const [annual, setAnnual] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [promoMsg, setPromoMsg] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { t } = useTranslation();

  const handleSelectPlan = async (selectedPlan) => {
    if (selectedPlan === 'free') {
      upgradePlan('free');
      onClose();
      return;
    }

    try {
      setLoadingPlan(selectedPlan);
      const result = await redirectToCheckout({ plan: selectedPlan, interval: annual ? 'year' : 'month' });
      if (!result?.success) {
        setPromoMsg({
          type: 'error',
          text: result?.error || 'Checkout zlyhal. Skúste to znova neskôr.'
        });
        return;
      }
      // Upgrade prebieha až po overení platby (success URL / webhook) — tu iba zatvoríme modal pri redirecte
      onClose();
    } catch (err) {
      console.error(err);
      setPromoMsg({ type: 'error', text: err?.message || 'Checkout zlyhal.' });
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleApplyPromo = (e) => {
    e.preventDefault();
    const res = activateLicenseKey(promoCode);
    if (res.success) {
      setPromoMsg({ type: 'success', text: `Licencia aktivovaná! Získali ste plán ${res.plan.toUpperCase()} na ${res.days} dní.` });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setPromoMsg({ type: 'error', text: res.error });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-950 border-slate-800 text-slate-100 p-6 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center sm:text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mx-auto">
            <Zap className="h-3.5 w-3.5" />
            <span>{t('pricing.badge')}</span>
          </div>
          <DialogTitle className="text-2xl sm:text-3xl font-black text-white">
            {t('pricing.title')}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm max-w-xl mx-auto">
            Objavte skryté nezrovnalosti, vytvorte súdne PDF protokoly so SHA-256 hashóm a vyhodnocujte zložité kauzy v sekundách.
          </DialogDescription>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <span className={`text-xs font-semibold ${!annual ? 'text-white' : 'text-slate-400'}`}>Mesačne</span>
            <button
              type="button"
              onClick={() => setAnnual(!annual)}
              className="w-12 h-6 rounded-full bg-slate-800 p-1 flex items-center border border-slate-700 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full bg-amber-500 transition-transform ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${annual ? 'text-white' : 'text-slate-400'}`}>Ročne</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                -20% ZĽAVA
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {/* 1. Free Tier */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
            plan === 'free' ? 'border-slate-600 bg-slate-900/80' : 'border-slate-800/80 bg-slate-900/40'
          }`}>
            <div>
              <p className="text-xs font-mono uppercase text-slate-400 font-semibold">Free Základ</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">0 €</span>
                <span className="text-xs text-slate-400">/ navždy</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Vyskúšanie základnej detekcie rozporov na menších prípadoch.</p>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400" /> Max 2 spisy
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400" /> Max 5 výpovedí na spis
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-slate-400" /> Základná alibi kontrola
                </li>
              </ul>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectPlan('free')}
              disabled={plan === 'free'}
              className="mt-6 border-slate-700 text-slate-300 hover:text-white"
            >
              {plan === 'free' ? 'Aktuálny plán' : 'Prejsť na Free'}
            </Button>
          </div>

          {/* 2. Pro Tier (Popular) */}
          <div className="p-5 rounded-2xl border border-amber-500/50 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-900 flex flex-col justify-between relative shadow-xl shadow-amber-500/5">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
              Najobľúbenejší
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono uppercase text-amber-400 font-bold">Pro Vyšetrovateľ</p>
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{annual ? '24 €' : '29 €'}</span>
                <span className="text-xs text-slate-400">/ mesiac</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Kompletný arzenál pre advokátov a samostatných expertov.</p>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-200">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400" /> <strong>Neobmedzený</strong> počet spisov
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400" /> <strong>Neobmedzené</strong> výpovede a PDF
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400" /> Súdny PDF protokol so <strong>SHA-256 hashóm</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400" /> Virálna karta Alibi Impossible (PNG export)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-amber-400" /> Prioritné AI spracovanie bez fronty
                </li>
              </ul>
            </div>

            <Button
              type="button"
              onClick={() => handleSelectPlan('pro')}
              disabled={loadingPlan === 'pro'}
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
            >
              {loadingPlan === 'pro' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aktivovať Pro'}
            </Button>
          </div>

          {/* 3. Agency Tier */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono uppercase text-blue-400 font-bold">Kancelária / Tím</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">{annual ? '79 €' : '99 €'}</span>
                <span className="text-xs text-slate-400">/ mesiac</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Pre advokátske kancelárie a vyšetrovacie tímy.</p>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" /> Všetko z Pro plánu
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" /> <strong>3 licencie</strong> pre kolegov v cene
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" /> Zdieľané spisy (Shared Workspace)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-400" /> Prednostný 24/7 SLA support
                </li>
              </ul>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectPlan('agency')}
              disabled={loadingPlan === 'agency'}
              className="mt-6 border-slate-700 hover:border-blue-500 text-slate-200"
            >
              {loadingPlan === 'agency' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aktivovať Agency'}
            </Button>
          </div>
        </div>

        {/* Promo / License Key Redemption */}
        <form onSubmit={handleApplyPromo} className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Key className="h-4 w-4 text-amber-400" />
            <span>Máte promo kód alebo licenčný kľúč advokátskej komory?</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Licenčný kľúč"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-amber-500"
            />
            <Button type="submit" size="sm" variant="secondary" className="bg-slate-800 hover:bg-slate-700 text-xs">
              Uplatniť
            </Button>
          </div>
        </form>

        {promoMsg && (
          <p className={`text-xs text-center font-medium mt-2 ${promoMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
            {promoMsg.text}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
