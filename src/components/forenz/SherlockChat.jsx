import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Send, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { parseTimeToMinutes } from '@/lib/forenzUtils';

const COMPLEX_KEYWORDS = ['prečo', 'súvisí', 'analyzuj', 'porovnaj', 'vyhodnoť', 'kto mohol', 'rozpor', 'odporujú', 'protireč'];

function isComplex(q) {
  const l = q.toLowerCase();
  return COMPLEX_KEYWORDS.some((k) => l.includes(k));
}

function localAnswer(question, persons, edges, redFlags) {
  const q = question.toLowerCase();
  const timeMatch = q.match(/(\d{1,2})[:.](\d{2})/);
  const timeMin = timeMatch ? parseTimeToMinutes(`${timeMatch[1]}:${timeMatch[2]}`) : null;

  if (q.includes('alibi')) {
    const alibis = persons.filter((p) => p.type === 'alibi');
    const relAlibis = edges.filter((e) => e.label.toLowerCase().includes('alibi'));
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

// Detekcia istoty z AI odpovede — ISTOTA: HIGH/VYSOKÁ, MEDIUM, LOW/NÍZKA.
function parseConfidence(text) {
  const t = String(text || '');
  if (/ISTOTA[:\s]*(HIGH|VYSOK[AÁ])/i.test(t) || /\b(HIGH|VYSOK[AÁ])\b/i.test(t)) return 'high';
  if (/ISTOTA[:\s]*(LOW|NÍZK)/i.test(t) || /\bLOW\b/i.test(t)) return 'low';
  return 'medium';
}

export default function SherlockChat({ persons, edges, redFlags, flaggedPassages = [], claims = [], events = [], contradictions = [], openSignal = 0 }) {
  const [open, setOpen] = useState(false);
  const [showFlags, setShowFlags] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // Aditívny vstup z bottom navu — otvorí panel bez zmeny existujúcej FAB logiky.
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
      <button
        onClick={() => setOpen((o) => !o)}
        className="absolute bottom-4 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition bg-blue-600/10 text-blue-700 border border-blue-200/40 hover:bg-blue-600/20 backdrop-blur-3xl"
        title="Sherlock AI"
      >
        {open ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-20 right-4 z-30 w-[18rem] h-[26rem] bg-white/80 backdrop-blur-3xl border-[1.5px] border-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-white/60 flex items-center gap-2 bg-blue-50/40">
              <Search className="w-4 h-4 text-blue-700" />
              <span className="text-sm font-semibold text-blue-800">Sherlock 🔍</span>
              <span className="ml-auto text-[10px] text-blue-500">AI nad prípadom</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {flaggedPassages.length > 0 && (
                <div className="mb-2 border border-amber-500/30 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowFlags((s) => !s)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-700 text-xs font-semibold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Varovné pasáže ({flaggedPassages.length})</span>
                    <span className="ml-auto shrink-0">{showFlags ? 'skryť' : 'zobraziť'}</span>
                  </button>
                  {showFlags && (
                    <div className="max-h-32 overflow-y-auto p-2 space-y-1.5 bg-amber-50/30">
                      {flaggedPassages.map((p) => (
                        <div
                          key={p.id}
                          className={`rounded-lg p-2 text-xs border-l-2 ${
                            p.category === 'rozpor' ? 'border-red-500 bg-red-500/10' : 'border-amber-400 bg-amber-400/10'
                          }`}
                        >
                          <span className={`font-semibold ${p.category === 'rozpor' ? 'text-red-600' : 'text-amber-700'}`}>
                            {p.category === 'rozpor' ? 'Rozpor' : 'Neistota'}
                          </span>
                          <p className="text-slate-700 italic mt-0.5">„{p.text}"</p>
                          {p.explanation && <p className="text-slate-500 mt-1">{p.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {messages.length === 0 && (
                <p className="text-xs text-blue-400 text-center mt-8 px-4">
                  Pýtajte sa na prípad, napr. „Kto má alibi o 14:30?" alebo „Prečo sa názory svedkov líšia?"
                </p>
              )}
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] bg-blue-600/15 text-blue-800 text-sm rounded-2xl rounded-br-sm px-3 py-2 border border-blue-200/40">{m.text}</div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-200/40 flex items-center justify-center shrink-0">
                      <Search className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    <div className="max-w-[85%] bg-blue-50/50 text-blue-900 text-sm rounded-2xl rounded-bl-sm px-3 py-2 whitespace-pre-wrap">
                      {m.confidence === 'high' && (
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-blue-200/50">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Overená analýza</span>
                        </div>
                      )}
                      {m.text}
                    </div>
                  </div>
                )
              )}
              {busy && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-200/40 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-blue-700 animate-spin" />
                  </div>
                  <div className="bg-blue-50/50 text-blue-500 text-sm rounded-2xl px-3 py-2">Sherlock premýšľa…</div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div className="p-2 border-t border-white/60 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                placeholder="Napíš otázku…"
                className="flex-1 bg-white/60 text-blue-900 text-sm rounded-full px-4 py-2 outline-none focus:ring-2 ring-blue-500 placeholder:text-blue-300"
              />
              <button onClick={send} disabled={busy} className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-700 border border-blue-200/40 hover:bg-blue-600/20 disabled:opacity-50 flex items-center justify-center shrink-0 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}