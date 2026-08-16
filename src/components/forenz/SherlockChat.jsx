import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Send, Loader2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { parseTimeToMinutes } from '@/lib/forenzUtils';

const COMPLEX_KEYWORDS = ['prečo', 'súvisí', 'analyzuj', 'porovnaj', 'vyhodnoť', 'kto mohol', 'rozpor', 'odporujú', 'protireč'];

function isComplex(q) {
  const l = q.toLowerCase();
  return COMPLEX_KEYWORDS.some((k) => l.includes(k));
}

function localAnswer(question, persons = [], edges = [], redFlags = []) {
  const q = question.toLowerCase();
  const timeMatch = q.match(/(\d{1,2})[:.](\d{2})/);
  const timeMin = timeMatch ? parseTimeToMinutes(`${timeMatch[1]}:${timeMatch[2]}`) : null;

  if (q.includes('alibi')) {
    const alibis = persons.filter((p) => p.type === 'alibi');
    const relAlibis = edges.filter((e) => (e.label || '').toLowerCase().includes('alibi'));
    if (alibis.length || relAlibis.length) {
      const parts = [];
      if (alibis.length) parts.push('Alibi osoby: ' + alibis.map((p) => p.name + (p.details ? ` (${p.details})` : '')).join(', '));
      if (relAlibis.length) parts.push('Vzťahy alibi: ' + relAlibis.map((e) => `${e.sourceName}→${e.targetName} ${e.time || ''}`).join('; '));
      return parts.join('\n');
    }
    return 'V prípade sa nenašli osoby alebo vzťahy typu alibi.';
  }

  if (timeMin != null) {
    const atTime = edges.filter((e) => {
      const t = parseTimeToMinutes(e.time);
      return t != null && t <= timeMin;
    });
    if (atTime.length) {
      return `Do ${timeMatch[0]} boli zaznamenané tieto vzťahy:\n` + atTime.map((e) => `${e.time} ${e.sourceName} → ${e.targetName} (${e.label})`).join('\n');
    }
    return `K času ${timeMatch[0]} neevidujem žiadne časovo viazané vzťahy.`;
  }

  const mentioned = persons.filter((p) => p.name && q.includes(p.name.toLowerCase()));
  if (mentioned.length) {
    return mentioned
      .map((p) => {
        const rels = edges.filter((e) => e.source === p.id || e.target === p.id);
        let s = `${p.name} [${p.type}]`;
        if (p.details) s += ` — ${p.details}`;
        if (rels.length) s += `\nVzťahy: ${rels.map((e) => `${e.sourceName}→${e.targetName} (${e.label}${e.time ? ', ' + e.time : ''})`).join('; ')}`;
        return s;
      })
      .join('\n\n');
  }

  let s = `Prípad: ${persons.length} osôb, ${edges.length} vzťahov, ${redFlags.length} varovaní.\n`;
  s += 'Osoby: ' + persons.map((p) => `${p.name}(${p.type})`).join(', ') + '.';
  if (redFlags.length) s += `\nVarovania: ${redFlags.slice(0, 5).map((r) => r.description).join('; ')}`;
  s += '\n\nTip: pre hlbšiu analýzu použi slová ako „prečo", „analyzuj", „kto mohol".';
  return s;
}

function parseConfidence(text) {
  const t = String(text || '');
  if (/ISTOTA[:\s]*(HIGH|VYSOK[AÁ])/i.test(t) || /\b(HIGH|VYSOK[AÁ])\b/i.test(t)) return 'high';
  if (/ISTOTA[:\s]*(LOW|NÍZK)/i.test(t) || /\bLOW\b/i.test(t)) return 'low';
  return 'medium';
}

export default function SherlockChat({ persons = [], edges = [], redFlags = [], flaggedPassages = [], claims = [], events = [], contradictions = [], openSignal = 0 }) {
  const [open, setOpen] = useState(false);
  const [showFlags, setShowFlags] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (openSignal > 0) setOpen(true);
  }, [openSignal]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      let answer;
      let confidence = null;
      if (isComplex(text)) {
        const ctx = JSON.stringify({
          osoby: persons.map((p) => ({ meno: p.name, typ: p.type, detail: p.details, dok: p.document_title })),
          vztahy: edges.map((e) => ({ z: e.sourceName, do: e.targetName, typ: e.label, cas: e.time, popis: e.description, dok: e.document_title })),
          varovania: redFlags.map((r) => ({ text: r.description, dok: r.document_title })),
          tvrdenia: (claims || []).map((c) => ({ subjekt: c.subject, vztah: c.predicate, objekt: c.object, cas: c.event_time, miesto: c.location, citat: c.source_quote, dok: c.document_title, istota: c.confidence })),
          udalosti: (events || []).map((ev) => ({ nazov: ev.title, cas: ev.time, miesto: ev.location, osoby: ev.persons, citat: ev.source_quote, dok: ev.document_title })),
          rozpory: (contradictions || []).map((cn) => ({ typ: cn.type, subjekt: cn.entity_ref, stav: cn.status, istota: cn.confidence, vysvetlenie: cn.explanation }))
        });
        const historyPayload = messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          text: m.text
        }));
        const res = await base44.functions.invoke('sherlockChat', { question: text, context: ctx, history: historyPayload });
        answer = res?.data?.answer || res?.data?.error || 'Nepodarilo sa získať odpoveď.';
        confidence = parseConfidence(answer);
      } else {
        answer = localAnswer(text, persons, edges, redFlags);
      }
      setMessages((m) => [...m, { role: 'sherlock', text: answer, confidence }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'sherlock', text: 'Chyba: ' + e.message, confidence: null }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Plávajúce tlačidlo Sherlock AI - vždy nad všetkými prvkami s vysokým z-indexom */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all bg-slate-900/95 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-700/80 backdrop-blur-xl hover:scale-105 active:scale-95"
        title="Sherlock AI Forenzný Asistent"
        aria-label="Sherlock AI Forenzný Asistent"
      >
        {open ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
      </button>

      {/* Okno chatu Sherlock AI - plávajúce nad celým rozhraním */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-[max(5rem,env(safe-area-inset-bottom,0px))] right-3 sm:right-6 lg:bottom-20 lg:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[24rem] h-[min(30rem,85dvh)] max-h-[85dvh] bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-3.5 py-2.5 border-b border-slate-800 flex items-center gap-2 bg-slate-900/90">
              <div className="w-6 h-6 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-slate-100">Sherlock AI Forenzný Asistent</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">v1.2</span>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                title="Zatvoriť okno"
                aria-label="Zatvoriť okno"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {flaggedPassages.length > 0 && (
                <div className="mb-2 border border-amber-900/50 rounded-xl overflow-hidden bg-amber-950/20">
                  <button
                    onClick={() => setShowFlags((s) => !s)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 bg-amber-900/40 text-amber-300 text-xs font-semibold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Varovné pasáže ({flaggedPassages.length})</span>
                    <span className="ml-auto shrink-0 text-[10px] text-amber-400/80">{showFlags ? 'skryť' : 'zobraziť'}</span>
                  </button>
                  {showFlags && (
                    <div className="max-h-32 overflow-y-auto p-2 space-y-1.5">
                      {flaggedPassages.map((p) => (
                        <div
                          key={p.id}
                          className={`rounded-lg p-2 text-xs border-l-2 ${
                            p.category === 'rozpor' ? 'border-red-500 bg-red-950/40' : 'border-amber-500 bg-amber-950/30'
                          }`}
                        >
                          <span className={`font-semibold ${p.category === 'rozpor' ? 'text-red-400' : 'text-amber-400'}`}>
                            {p.category === 'rozpor' ? 'Rozpor' : 'Neistota'}
                          </span>
                          <p className="text-slate-300 italic mt-0.5">„{p.text}"</p>
                          {p.explanation && <p className="text-slate-400 mt-1 text-[11px]">{p.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {messages.length === 0 && (
                <p className="text-xs text-slate-400 text-center mt-8 px-4 leading-relaxed">
                  Pýtajte sa na prípad, napr. <span className="text-blue-400 font-medium">„Kto má alibi o 14:30?"</span> alebo <span className="text-blue-400 font-medium">„Prečo sa výpovede svedkov líšia?"</span>
                </p>
              )}
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] bg-blue-600 text-white text-xs rounded-xl rounded-br-sm px-3 py-2 shadow-sm font-medium">{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2">
                    <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Search className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="max-w-[85%] bg-slate-800/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl rounded-bl-sm px-3 py-2 whitespace-pre-wrap leading-relaxed shadow-sm">
                      {m.confidence === 'high' && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-700">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-400">Overená analýza</span>
                        </div>
                      )}
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {busy && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700/80 text-slate-400 text-xs rounded-xl px-3 py-2">Sherlock analyzuje fakty…</div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="p-2.5 border-t border-slate-800 bg-slate-900/90 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                onFocus={() => endRef.current?.scrollIntoView({ behavior: "smooth" })} placeholder="Napíšte otázku vyšetrovateľovi…"
                className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
              <button onClick={send} disabled={busy} className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center justify-center shrink-0 transition-colors shadow-sm" aria-label="Odoslať otázku">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
