import React, { useRef, useEffect, useCallback } from 'react';
import { FileText, Users, Network, Flag, AlertOctagon } from 'lucide-react';

const STATUS_BADGE = {
  pending: { label: 'Čaká', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  analyzing: { label: 'Analyzuje', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  done: { label: 'Hotové', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  error: { label: 'Chyba', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' }
};

export default function ArchiveFilmstrip({ documents, selectedDocId, onSelect, contradictionCounts = {} }) {
  const scrollRef = useRef(null);
  const drag = useRef({ active: false, moved: false, sx: 0, scrollLeft: 0 });

  useEffect(() => {
    if (!scrollRef.current || !selectedDocId) return;
    const idx = documents.findIndex((d) => d.id === selectedDocId);
    if (idx < 0) return;
    const card = scrollRef.current.children[idx];
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedDocId, documents]);

  const onWheel = useCallback((e) => {
    if (scrollRef.current) scrollRef.current.scrollLeft += e.deltaY;
  }, []);

  const onDown = (e) => {
    drag.current = { active: true, moved: false, sx: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
  };
  const onMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.sx;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    scrollRef.current.scrollLeft = drag.current.scrollLeft - dx;
  };
  const onUp = () => { drag.current.active = false; };

  const handleSelect = (id) => {
    if (drag.current.moved) { drag.current.moved = false; return; }
    onSelect(id);
  };

  return (
    <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Archív dokumentov</span>
        <span className="text-xs text-slate-400 dark:text-slate-600">{documents.length}</span>
      </div>
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        className="flex gap-3 overflow-x-auto px-4 pb-3 hide-scrollbar"
        style={{ cursor: 'grab' }}
      >
        {documents.length === 0 && (
          <div className="text-xs text-slate-400 dark:text-slate-600 py-6">Žiadne dokumenty v archíve.</div>
        )}
        {documents.map((doc) => {
          const badge = STATUS_BADGE[doc.status] || STATUS_BADGE.pending;
          const active = doc.id === selectedDocId;
          const date = doc.created_date ? new Date(doc.created_date).toLocaleDateString('sk-SK') : '';
          const contras = contradictionCounts[doc.id] || 0;
          return (
            <button
              key={doc.id}
              onClick={() => handleSelect(doc.id)}
              className={`group relative shrink-0 w-40 rounded-2xl border overflow-hidden transition-all text-left shadow-sm ${
                active
                  ? 'border-indigo-500 ring-1 ring-indigo-500/40 bg-slate-50 dark:bg-slate-800'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-slate-600'
              }`}
            >
              <div className="relative h-24 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                {doc.image_url ? (
                  <img
                    src={doc.image_url}
                    alt={doc.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
                <span className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 rounded ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>
              <div className="p-2">
                <p className="text-xs text-slate-800 dark:text-slate-200 truncate">{doc.title}</p>
                {date && <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-0.5">{date}</p>}
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="inline-flex items-center gap-0.5" title="Osoby"><Users className="w-3 h-3" />{doc.person_count ?? 0}</span>
                  <span className="inline-flex items-center gap-0.5" title="Vzťahy"><Network className="w-3 h-3" />{doc.relationship_count ?? 0}</span>
                  <span className="inline-flex items-center gap-0.5" title="Varovania"><Flag className="w-3 h-3" />{doc.red_flag_count ?? 0}</span>
                  {contras > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-red-500 dark:text-red-400" title="Rozpory"><AlertOctagon className="w-3 h-3" />{contras}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}