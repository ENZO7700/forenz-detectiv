import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

const CATEGORY_LABEL = {
  časová_nesúlad: 'Časový nesúlad',
  geografická_nesúlad: 'Nemožné alibi (Geografický presun)',
  chýbajúce_info: 'Chýbajúce info',
  lingvistika: 'Lingvistická anomália',
  rozpor: 'Forenzný rozpor',
  iné: 'Iné varovanie'
};

export default function RedFlagsPanel({ redFlags }) {
  return (
    <div className="flex-1 overflow-y-auto gpu-accelerated">
      <div className="px-4 py-3 sticky top-0 liquid-glass-panel border-b border-white/40 dark:border-white/10 flex items-center gap-2 z-10">
        <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
        <h3 className="text-sm font-bold text-blue-900 dark:text-white">Analýza dôveryhodnosti</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 font-bold border border-red-500/20">
          {redFlags.length}
        </span>
      </div>
      <div className="p-3 space-y-2.5">
        {redFlags.length === 0 ? (
          <div className="text-center py-8 px-4 liquid-glass-card rounded-2xl">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Žiadne varovania. Naskenujte výpovede pre automatickú detekciu nezrovnalostí a nemožných alibi.
            </p>
          </div>
        ) : (
          redFlags.map((rf) => {
            const isCritical = rf.category === 'geografická_nesúlad' || rf.category === 'rozpor' || rf.severity === 'critical';
            return (
              <div
                key={rf.id}
                className={`liquid-glass-card rounded-2xl p-3.5 relative overflow-hidden transition-all ${
                  isCritical ? 'border-red-500/40 bg-red-500/5 hover:neon-glow-red' : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                    isCritical ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {isCritical ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{rf.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-600/20 text-red-700 dark:text-red-300 border border-red-500/30'
                          : 'bg-amber-600/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      }`}>
                        {CATEGORY_LABEL[rf.category] || rf.category}
                      </span>
                      {rf.document_title && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[140px] font-mono">
                          {rf.document_title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}