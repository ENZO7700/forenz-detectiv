import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  Dialog,
  DialogContent,
  DialogHeader
} from '@/components/ui/dialog';
import { Search, User, Link2, Calendar, FileText, AlertTriangle, ShieldAlert, ChevronRight } from 'lucide-react';

export default function QuickSearchDialog({
  open,
  onOpenChange,
  persons = [],
  relationships = [],
  events = [],
  claims = [],
  redFlags = [],
  documents = [],
  contradictions = [],
  onSelectPerson = null,
  onSelectEdge = null,
  onSelectDoc = null,
  onSelectEvent = null
}) {
  const [query, setQuery] = useState('');

  // Vybudovanie zjednoteného vyhľadávacieho indexu pre Fuse.js
  const searchIndex = useMemo(() => {
    const items = [];

    // 1. Osoby
    persons.forEach((p) => {
      items.push({
        id: p.id,
        category: 'osoba',
        title: p.name,
        subtitle: `${p.type} · ${p.details || 'Bez detailu'}`,
        badge: p.type,
        badgeColor: p.type === 'podozrivý' ? 'bg-rose-500' : 'bg-blue-600',
        raw: p
      });
    });

    // 2. Vzťahy
    relationships.forEach((r) => {
      items.push({
        id: r.id,
        category: 'vzťah',
        title: `${r.source_name || 'Osoba A'} → ${r.target_name || 'Osoba B'}`,
        subtitle: `${r.label || 'kontakt'} ${r.time ? `(${r.time})` : ''} · ${r.description || ''}`,
        badge: r.label || 'vzťah',
        badgeColor: 'bg-indigo-600',
        raw: r
      });
    });

    // 3. Udalosti
    events.forEach((ev) => {
      items.push({
        id: ev.id,
        category: 'udalosť',
        title: ev.title,
        subtitle: `${ev.time || ev.date || ''} ${ev.location ? `· ${ev.location}` : ''} · ${ev.description || ''}`,
        badge: ev.type || 'udalosť',
        badgeColor: 'bg-emerald-600',
        raw: ev
      });
    });

    // 4. Rozpory & Varovania
    contradictions.forEach((c) => {
      items.push({
        id: c.id,
        category: 'rozpor',
        title: `Rozpor: ${c.entity_ref || 'Forenzný nesúlad'}`,
        subtitle: c.explanation || '',
        badge: 'ROZPOR',
        badgeColor: 'bg-rose-600',
        raw: c
      });
    });

    redFlags.forEach((rf) => {
      items.push({
        id: rf.id,
        category: 'varovanie',
        title: 'Varovanie',
        subtitle: rf.description || rf,
        badge: 'RED FLAG',
        badgeColor: 'bg-amber-600',
        raw: rf
      });
    });

    // 5. Dokumenty
    documents.forEach((d) => {
      items.push({
        id: d.id,
        category: 'dokument',
        title: d.title || 'Dokument',
        subtitle: d.summary || 'Naskenovaná výpoveď',
        badge: 'SPIS',
        badgeColor: 'bg-slate-600',
        raw: d
      });
    });

    return items;
  }, [persons, relationships, events, contradictions, redFlags, documents]);

  // Inicializácia Fuse.js
  const fuse = useMemo(() => {
    return new Fuse(searchIndex, {
      keys: ['title', 'subtitle', 'badge'],
      threshold: 0.35,
      ignoreLocation: true,
      includeScore: true
    });
  }, [searchIndex]);

  // Výsledky vyhľadávania
  const results = useMemo(() => {
    if (!query.trim()) {
      return searchIndex.slice(0, 10);
    }
    return fuse.search(query).map((res) => res.item).slice(0, 20);
  }, [query, fuse, searchIndex]);

  // Klávesová skratka Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  const handleSelect = (item) => {
    onOpenChange(false);
    if (item.category === 'osoba' && onSelectPerson) {
      onSelectPerson(item.raw);
    } else if (item.category === 'vzťah' && onSelectEdge) {
      onSelectEdge(item.raw);
    } else if (item.category === 'dokument' && onSelectDoc) {
      onSelectDoc(item.raw.id);
    } else if (item.category === 'udalosť' && onSelectEvent) {
      onSelectEvent(item.raw);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'osoba':
        return <User className="w-4 h-4 text-blue-500" />;
      case 'vzťah':
        return <Link2 className="w-4 h-4 text-indigo-500" />;
      case 'udalosť':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'rozpor':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'varovanie':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-xl p-0 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl">
        <DialogHeader className="p-4 border-b border-slate-100 dark:border-white/5 flex flex-row items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rýchle vyhľadávanie v celom prípade (osoby, časy, rozpory)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            Esc
          </kbd>
        </DialogHeader>

        <div className="max-h-[22rem] overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Nenašli sa žiadne zhodné záznamy pre "{query}"
            </div>
          ) : (
            results.map((item) => (
              <button
                key={`${item.category}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/80 text-left transition-colors group"
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 shrink-0 transition-colors shadow-xs">
                  {getCategoryIcon(item.category)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Stlačte <strong>Enter</strong> pre výber</span>
          <span>Indexovaných {searchIndex.length} položiek prípadu</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
