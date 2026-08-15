import React from 'react';
import { FileText, Loader2, Trash2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

const STATUS_BADGE = {
  pending: { label: 'Čaká', cls: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  analyzing: { label: 'Analyzuje sa', cls: 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' },
  done: { label: 'Hotové', cls: 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
  error: { label: 'Chyba', cls: 'bg-red-500/15 dark:bg-red-500/20 text-red-700 dark:text-red-300' }
};

export default function DocumentList({ documents, selectedDocId, onSelect, onDelete, onRetry }) {
  return (
    <div className="w-full h-full shrink-0 bg-white/70 backdrop-blur-3xl border-[1.5px] border-white rounded-[32px] shadow-xl flex flex-col max-h-[20vh] lg:max-h-none overflow-hidden">
      <div className="px-4 py-3 border-b border-white/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-blue-700">Výpovede</h2>
        <span className="text-xs text-blue-500">{documents.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            !selectedDocId ? 'bg-blue-600/10 dark:bg-blue-600/20 text-blue-700 dark:text-blue-200 border border-blue-600/40' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Všetky spisy (pavúk)
        </button>
        {documents.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-600 px-3 py-6 text-center">
            Zatiaľ žiadne výpovede. Naskenujte A4 dokument.
          </p>
        )}
        {documents.map((doc) => {
          const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.pending;
          return (
            <div
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`group cursor-pointer rounded-lg border px-3 py-2 transition-colors ${
                selectedDocId === doc.id
                  ? 'bg-blue-600/10 dark:bg-blue-600/20 border-blue-600/40'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-2">
                {doc.status === 'analyzing' ? (
                  <Loader2 className="w-4 h-4 text-amber-500 dark:text-amber-300 animate-spin mt-0.5 shrink-0" />
                ) : doc.status === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
                ) : doc.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-blue-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                    {doc.status === 'done' && (
                      <span className="text-[10px] text-slate-500">
                        {doc.person_count} os. · {doc.relationship_count} vz.
                      </span>
                    )}
                  </div>
                  {doc.status === 'error' && doc.error && (
                    <p className="text-[10px] text-red-600 dark:text-red-400/80 mt-1 line-clamp-2">{doc.error}</p>
                  )}
                </div>
                {onRetry && doc.status === 'error' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRetry(doc); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="Znovu analyzovať"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}