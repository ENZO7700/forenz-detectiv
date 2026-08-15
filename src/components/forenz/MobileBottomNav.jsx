import React from 'react';
import { Network, Layers, BarChart3, Search } from 'lucide-react';

const TABS = [
  { key: 'graph', label: 'Pavúk', icon: Network },
  { key: 'archive', label: 'Kartotéka', icon: Layers },
  { key: 'timeline', label: 'Timeline', icon: BarChart3, disabled: true },
  { key: 'sherlock', label: 'Sherlock', icon: Search }
];

export default function MobileBottomNav({ activeView, onTabChange, onSherlock }) {
  const isActive = (key) => {
    if (key === 'sherlock') return activeView === 'sherlock';
    return activeView === key;
  };

  const handle = (tab) => {
    if (tab.disabled) return;
    if (tab.key === 'sherlock') {
      onSherlock?.();
    } else {
      onTabChange(tab.key);
    }
  };

  return (
    <nav
      className="lg:hidden shrink-0 z-40 bg-white/70 backdrop-blur-3xl border-t border-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {TABS.map((tab) => {
          const active = isActive(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => handle(tab)}
              disabled={tab.disabled}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                tab.disabled ? 'text-slate-400 cursor-not-allowed' : active ? 'text-blue-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {active && !tab.disabled && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-700" />
              )}
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}