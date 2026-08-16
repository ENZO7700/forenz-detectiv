import React from 'react';
import { FileText, Loader2, Trash2, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';

const STATUS_BADGE = {
  pending: { label: 'Čaká', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  analyzing: { label: 'Analyzuje sa', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
  done: { label: 'Hotové', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  error: { label: 'Chyba', cls: 'bg-red-500/15 text-red-400 border border-red-500/30' }
};

export default function DocumentList({ documents, selectedDocId, onSelect, onDelete, onRetry }) {
  return (
    <div className="w-full h-full shrink-0 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col max-h-[20vh] lg:max-h-none overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Výpovede & Spisy
        </h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-mono">
          {documents.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            !selectedDocId
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          🌐 Všetky spisy (kompletný pavúk)
        </button>
        {documents.length === 0 && (
          <p className="text-xs text-slate-500 px-3 py-6 text-center">
            Zatiaľ žiadne výpovede. Naskenujte alebo nahrajte dokument.
          </p>
        )}
        {documents.map((doc) => {
          const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.pending;
          return (
            <div
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`group cursor-pointer rounded-xl border p-2.5 transition-all ${
                selectedDocId === doc.id
                  ? 'bg-blue-600/15 border-blue-500/50 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {doc.status === 'analyzing' ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin mt-0.5 shrink-0" />
                ) : doc.status === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                ) : doc.status === 'done' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate">{doc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badge.cls}`}>{badge.label}</span>
                    {doc.status === 'done' && (
                      <span className="text-[10px] text-slate-400">
                        {doc.person_count || 0} osôb · {doc.relationship_count || 0} vzťahov
                      </span>
                    )}
                  </div>
                  {doc.status === 'error' && doc.error && (
                    <p className="text-[10px] text-red-400 mt-1 line-clamp-2">{doc.error}</p>
                  )}
                </div>
                {onRetry && doc.status === 'error' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRetry(doc); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-400 p-1 transition"
                    title="Znovu analyzovať"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(doc); }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1 transition"
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