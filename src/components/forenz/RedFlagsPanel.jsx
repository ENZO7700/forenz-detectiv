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

export default function RedFlagsPanel({ redFlags = [] }) {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 border-t border-slate-800">
      <div className="px-4 py-3 sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center gap-2 z-10">
        <ShieldAlert className="w-4 h-4 text-red-400" />
        <h3 className="text-xs font-semibold text-slate-100">Analýza dôveryhodnosti</h3>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-950 text-red-400 font-semibold border border-red-800">
          {redFlags.length}
        </span>
      </div>
      <div className="p-3 space-y-2">
        {redFlags.length === 0 ? (
          <div className="text-center py-6 px-4 bg-slate-900/40 border border-slate-800 rounded-xl">
            <ShieldAlert className="w-7 h-7 mx-auto mb-2 text-slate-600 opacity-60" />
            <p className="text-xs text-slate-400">
              Žiadne varovania. Naskenujte výpovede pre automatickú detekciu nezrovnalostí a nemožných alibi.
            </p>
          </div>
        ) : (
          redFlags.map((rf) => {
            const isCritical = rf.category === 'geografická_nesúlad' || rf.category === 'rozpor' || rf.severity === 'critical';
            return (
              <div
                key={rf.id}
                className={`rounded-xl p-3 border transition-all ${
                  isCritical
                    ? 'border-red-900/70 bg-red-950/30 hover:border-red-700'
                    : 'border-amber-900/60 bg-amber-950/25 hover:border-amber-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    isCritical ? 'bg-red-900/50 text-red-400' : 'bg-amber-900/50 text-amber-400'
                  }`}>
                    {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 leading-snug">{rf.description}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-900/60 text-red-300 border border-red-800'
                          : 'bg-amber-900/60 text-amber-300 border border-amber-800'
                      }`}>
                        {CATEGORY_LABEL[rf.category] || rf.category}
                      </span>
                      {rf.document_title && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono">
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