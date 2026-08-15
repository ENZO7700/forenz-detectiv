import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Split, X, ShieldCheck, Info } from 'lucide-react';

export default function IdentityPanel({ overrides, persons, onRevokeOverride }) {
  const personName = (id) => persons.find((p) => p.id === id)?.name || 'Neznáma';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 min-h-0">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Identity Control Center</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manuálne korekcie automatického zlučovania AI. V grafe použite{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-xs">Shift+Click</kbd>{' '}
            (desktop) alebo dlhé podržanie (mobil) uzla pre výber, potom zlúčte alebo rozdeľte identity.
          </p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> zlúčené človekom</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> rozdelené človekom</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Audit trail</h3>
            <span className="text-xs text-slate-500">{overrides.length} zmien</span>
          </div>

          {overrides.length === 0 ? (
            <div className="text-center py-10">
              <Info className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-500">Zatiaľ žiadne manuálne korekcie identít.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {overrides.map((o) => {
                  const isMerge = o.override_type === 'merge';
                  return (
                    <motion.div
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50 dark:bg-slate-800/40"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isMerge ? 'bg-indigo-500/15 text-indigo-500' : 'bg-amber-500/15 text-amber-500'}`}>
                        {isMerge ? <UserPlus className="w-4 h-4" /> : <Split className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {isMerge ? 'Zlúčenie identity' : 'Rozdelenie identity'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {personName(o.source_person_id)} {isMerge ? '→' : '⊘'} {personName(o.target_person_id)}
                        </p>
                        {o.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">„{o.note}"</p>}
                        {o.created_date && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                            {new Date(o.created_date).toLocaleString('sk-SK')}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onRevokeOverride(o.id)}
                        className="shrink-0 w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center"
                        title="Zrušiť opravu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}