import React from 'react';
import { ShieldAlert } from 'lucide-react';

const CATEGORY_LABEL = {
  časová_nesúlad: 'Časová nesúlad',
  chýbajúce_info: 'Chýbajúce info',
  lingvistika: 'Lingvistika',
  rozpor: 'Rozpor',
  iné: 'Iné'
};

export default function RedFlagsPanel({ redFlags }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-3 sticky top-0 bg-white/70 backdrop-blur-3xl border-b border-white/60 flex items-center gap-2 z-10">
        <ShieldAlert className="w-4 h-4 text-red-600" />
        <h3 className="text-sm font-semibold text-blue-700">Analýza dôveryhodnosti</h3>
        <span className="ml-auto text-xs text-blue-500">{redFlags.length}</span>
      </div>
      <div className="p-3 space-y-2">
        {redFlags.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center py-6">
            Žiadne varovania. Naskenujte výpovede pre detekciu nezrovnalostí.
          </p>
        ) : (
          redFlags.map((rf) => (
            <div key={rf.id} className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-amber-800 dark:text-amber-100/90">{rf.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      {CATEGORY_LABEL[rf.category] || rf.category}
                    </span>
                    {rf.document_title && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-600 truncate">{rf.document_title}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}