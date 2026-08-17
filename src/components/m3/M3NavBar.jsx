import React from 'react';
import { Network, Layers, BarChart3, Search, MapPin } from 'lucide-react';
import { useTranslation } from '@/i18n/i18nContext';

export default function M3NavBar({ activeView, onTabChange, onSherlock }) {
  const { t } = useTranslation();
  const TABS = [
    { key: 'graph', label: t('nav.spider'), icon: Network },
    { key: 'archive', label: t('nav.case'), icon: Layers },
    { key: 'map', label: t('nav.alibi'), icon: MapPin },
    { key: 'timeline', label: t('nav.timeline'), icon: BarChart3 },
    { key: 'sherlock', label: t('nav.sherlock'), icon: Search }
  ];

  const isActive = (key) => {
    if (key === 'sherlock') return activeView === 'sherlock';
    return activeView === key;
  };

  const handle = (tab) => {
    if (tab.key === 'sherlock') {
      onSherlock?.();
    } else {
      onTabChange(tab.key);
    }
  };

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="lg:hidden shrink-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 text-slate-100"
      style={{ paddingBottom: 'max(0.5rem, var(--safe-bottom, 0px))' }}
    >
      <div className="flex items-stretch h-14">
        {TABS.map((tab) => {
          const active = isActive(tab.key);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handle(tab)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-all min-h-[44px] min-w-[44px] ${
                active ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              )}
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
