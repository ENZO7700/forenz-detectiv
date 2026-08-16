import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Zap } from 'lucide-react';
import { useForenzStore } from '@/store/useForenzStore';
import { useTranslation } from '@/i18n/i18nContext';

export default function QuickTip() {
  const [visible, setVisible] = useState(false);
  const loadDemoCase = useForenzStore((s) => s.loadDemoCase);
  const documents = useForenzStore((s) => s.documents);
  const { t } = useTranslation();

  useEffect(() => {
    const isDismissed = localStorage.getItem('forenz_quicktip_dismissed');
    if (!isDismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('forenz_quicktip_dismissed', 'true');
    setVisible(false);
  };

  const handleRunDemo = () => {
    handleDismiss();
    loadDemoCase();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[92%] sm:w-auto p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 text-slate-200 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <p className="text-xs text-slate-300 truncate">
          <strong className="text-amber-400">{t('quickTip.label')}</strong> {t('quickTip.text')}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {documents.length === 0 && (
          <button
            onClick={handleRunDemo}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
          >
            <Zap className="w-3 h-3 fill-slate-950" /> {t('quickTip.demo')}
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label={t('quickTip.close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
