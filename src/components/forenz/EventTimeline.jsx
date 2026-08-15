import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, MapPin, User, AlertTriangle, Search, Filter, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { parseTimeToMinutes } from '@/lib/forenzUtils';

export default function EventTimeline({
  events = [],
  contradictions = [],
  persons = [],
  selectedPerson = null,
  onSelectPerson = null
}) {
  const [search, setSearch] = useState('');
  const [selectedPersonFilter, setSelectedPersonFilter] = useState(selectedPerson?.name || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [onlyConflicts, setOnlyConflicts] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Získanie unikátnych typov udalostí
  const eventTypes = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.type) set.add(e.type);
    });
    return Array.from(set);
  }, [events]);

  // Zoradenie udalostí chronologicky (podľa dátumu a času)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      const timeA = parseTimeToMinutes(a.time || a.time_start || '') ?? 9999;
      const timeB = parseTimeToMinutes(b.time || b.time_start || '') ?? 9999;
      return timeA - timeB;
    });
  }, [events]);

  // Filtrovanie udalostí
  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((ev) => {
      // 1. Filter podľa osoby
      if (selectedPersonFilter !== 'all') {
        const matchesPerson = Array.isArray(ev.persons) && ev.persons.some((p) => p.toLowerCase().includes(selectedPersonFilter.toLowerCase()));
        if (!matchesPerson) return false;
      }

      // 2. Filter podľa typu
      if (typeFilter !== 'all' && ev.type !== typeFilter) {
        return false;
      }

      // 3. Filter iba s rozporom / varovaním
      if (onlyConflicts) {
        const hasConflict = contradictions.some(
          (c) =>
            (ev.description && c.explanation && ev.description.toLowerCase().includes(c.entity_ref?.toLowerCase())) ||
            (ev.persons && ev.persons.some((p) => c.entity_ref?.toLowerCase().includes(p.toLowerCase())))
        );
        if (!hasConflict) return false;
      }

      // 4. Vyhľadávanie textu
      if (search.trim()) {
        const q = search.toLowerCase();
        const inTitle = ev.title?.toLowerCase().includes(q);
        const inDesc = ev.description?.toLowerCase().includes(q);
        const inLoc = ev.location?.toLowerCase().includes(q);
        const inQuote = ev.source_quote?.toLowerCase().includes(q);
        const inPersons = Array.isArray(ev.persons) && ev.persons.some((p) => p.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inLoc && !inQuote && !inPersons) return false;
      }

      return true;
    });
  }, [sortedEvents, selectedPersonFilter, typeFilter, onlyConflicts, search, contradictions]);

  return (
    <div className="flex flex-col h-full bg-white/60 dark:bg-slate-900 backdrop-blur-3xl border-[1.5px] border-white dark:border-white/10 rounded-[32px] shadow-xl overflow-hidden p-4">
      {/* Hlavička & Ovládací panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Časová os vyšetrovania</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {filteredEvents.length} udalostí
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Chronologický sled udalostí, výpovedí a alibi</p>
        </div>

        {/* Vyhľadávanie a rýchle filtre */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hľadať v udalostiach..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <button
            onClick={() => setOnlyConflicts((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
              onlyConflicts
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Iba rozpory
          </button>
        </div>
      </div>

      {/* Druhý riadok filtrov (Osoby a Typy) */}
      <div className="flex flex-wrap items-center gap-2 py-2.5 border-b border-slate-200/40 dark:border-white/5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Osoba:</span>
        </div>
        <select
          value={selectedPersonFilter}
          onChange={(e) => setSelectedPersonFilter(e.target.value)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
        >
          <option value="all">Všetky osoby ({persons.length})</option>
          {persons.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>

        {eventTypes.length > 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Všetky typy
              </button>
              {eventTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize transition ${
                    typeFilter === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Telo časovej osi */}
      <div className="flex-1 overflow-y-auto pt-4 pr-1 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-center">
            <Clock className="w-8 h-8 mb-2 opacity-40 text-blue-500" />
            <p className="text-sm font-medium">Žiadne udalosti nezodpovedajú zvolenému filtru</p>
            <p className="text-xs text-slate-500 mt-1">Skúste zmeniť vyhľadávací dotaz alebo resetovať filtre.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-indigo-500 before:to-slate-300 dark:before:to-slate-700">
            {filteredEvents.map((ev, idx) => {
              const hasConflict = contradictions.some(
                (c) =>
                  (ev.description && c.explanation && ev.description.toLowerCase().includes(c.entity_ref?.toLowerCase())) ||
                  (ev.persons && ev.persons.some((p) => c.entity_ref?.toLowerCase().includes(p.toLowerCase())))
              );
              const isExpanded = expandedId === (ev.id || idx);

              return (
                <motion.div
                  key={ev.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(0.3, idx * 0.03) }}
                  className="relative group"
                >
                  {/* Časový bod (Dot na osi) */}
                  <div
                    className={`absolute -left-[29px] top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 transition-transform group-hover:scale-125 ${
                      hasConflict ? 'bg-rose-500 shadow-md shadow-rose-500/40' : 'bg-blue-600 shadow-md shadow-blue-500/40'
                    }`}
                  />

                  {/* Karta udalosti */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : (ev.id || idx))}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      hasConflict
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                        : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-blue-400/80 shadow-sm'
                    }`}
                  >
                    {/* Horný riadok: Čas, Dátum & Typ */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {ev.time ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-xs">
                            <Clock className="w-3 h-3" />
                            {ev.time}
                            {ev.approximate_time && <span className="text-[10px] font-normal opacity-80">(cca)</span>}
                          </span>
                        ) : ev.time_start || ev.time_end ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs">
                            <Clock className="w-3 h-3" />
                            {ev.time_start || '?'} – {ev.time_end || '?'}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Čas neuvedený</span>
                        )}

                        {ev.date && (
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {ev.date}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {ev.type && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {ev.type}
                          </span>
                        )}
                        {hasConflict && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Rozpor
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Názov a popis */}
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">{ev.title}</h4>
                    {ev.description && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{ev.description}</p>}

                    {/* Zúčastnené osoby & Miesto */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/50 text-xs">
                      {ev.location && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{ev.location}</span>
                        </div>
                      )}

                      {Array.isArray(ev.persons) && ev.persons.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 ml-auto">
                          {ev.persons.map((name, pIdx) => (
                            <span
                              key={pIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                const pObj = persons.find((p) => p.name === name);
                                if (pObj && onSelectPerson) onSelectPerson(pObj);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium text-[11px] hover:bg-blue-100 transition-colors"
                            >
                              <User className="w-2.5 h-2.5" />
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Rozšírené detaily (Dôkazný citát zo spisu) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 space-y-2 text-xs"
                        >
                          {ev.source_quote && (
                            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border-l-2 border-blue-500 italic text-slate-700 dark:text-slate-300">
                              <span className="font-semibold not-italic block text-[10px] uppercase text-blue-600 dark:text-blue-400 mb-0.5">
                                Doslovná citácia z výpovede:
                              </span>
                              "{ev.source_quote}"
                            </div>
                          )}

                          {ev.document_title && (
                            <div className="text-[11px] text-slate-400 flex items-center justify-between">
                              <span>Zdrojový dokument: <strong>{ev.document_title}</strong></span>
                              {ev.confidence != null && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  Istota AI: {Math.round(ev.confidence * 100)}%
                                </span>
                              )}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
