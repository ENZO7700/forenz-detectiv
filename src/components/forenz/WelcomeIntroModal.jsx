import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch,
  Network,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Bot,
  Clock,
  Users,
  X,
  ShieldCheck,
  Zap,
  FileText,
  Lightbulb
} from 'lucide-react';

export default function WelcomeIntroModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('features'); // 'features' | 'prompts'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;
      if (e.key === 'ArrowRight' && step < 3) setStep((s) => s + 1);
      if (e.key === 'ArrowLeft' && step > 1) setStep((s) => s - 1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, step, onClose]);

  if (!open) return null;

  const handleFinish = () => {
    localStorage.setItem('forenz_intro_seen', 'true');
    onClose();
  };

  const slides = [
    {
      id: 1,
      tag: 'Krok 1 zo 3 · Vstupné dáta a OCR',
      title: 'Skenovanie a extrakcia slovenských výpovedí',
      subtitle: 'Okamžitá digitalizácia zápisníc a svedectiev pomocou AI videnia a slovenského Tesseract OCR.',
      colorAccent: 'blue',
      features: [
        {
          icon: FileSearch,
          title: 'Optické čítanie slovenských textov',
          desc: 'Automatická podpora diakritiky (č, š, ž, ť, ď) priamo z fotiek zápisníc alebo PDF súborov.'
        },
        {
          icon: Users,
          title: 'Detekcia osôb a kľúčových rolí',
          desc: 'AI identifikuje a priradí roly: Svedok (modrá), Podozrivý (červená), Alibi (zelená), Obeť (oranžová).'
        },
        {
          icon: ShieldCheck,
          title: '100% Bezpečnosť & Zod validácia',
          desc: 'Ochrana pred manipuláciou promptu. Všetky dáta prechádzajú striktnou typovou kontrolou.'
        }
      ],
      prompts: [
        { label: 'Tip pre sken', text: 'Pre najlepšiu presnosť foťte zápisnice kolmo pri dennom svetle alebo nahrávajte čisté PDF.' },
        { label: 'Hromadný import', text: 'Tlačidlo "Hromadný sken" dokáže spracovať viacero výpovedí súbežne s adaptívnym riadením záťaže.' }
      ],
      mockup: (
        <div className="relative w-full h-full p-4 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900/90 via-blue-950/80 to-slate-900/90 border border-blue-500/30 text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-white" />
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs font-mono text-slate-300 ml-2">vypoved_svedok_01.pdf</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">OCR OK</span>
          </div>

          <div className="space-y-2.5 my-auto">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <p className="text-slate-300 italic">„...okolo 14:30 som videl pána Jána Nováka pri aute na Hlavnej ulici..."</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-medium">
                <Users className="w-3 h-3" /> Ján Novák (Podozrivý)
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-medium">
                <Clock className="w-3 h-3" /> 14:30
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/20 text-xs font-medium">
                Hlavná ulica
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10">
            <span>Extrahované: 3 osoby · 2 časy</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Pripravené na analýzu
            </span>
          </div>
        </div>
      )
    },
    {
      id: 2,
      tag: 'Krok 2 zo 3 · Vizuálna analýza',
      title: 'Interaktívny pavúk vzťahov a časová os',
      subtitle: 'Dynamická 2D vizualizácia všetkých kontaktov, stretnutí a rekonštrukcia sledu udalostí minútu po minúte.',
      colorAccent: 'red',
      features: [
        {
          icon: Network,
          title: '2D Canvas pavúk vzťahov (D3 Force)',
          desc: 'Plynulé približovanie, presúvanie a prepájanie osôb s automatickým rozložením hustoty siete.'
        },
        {
          icon: Clock,
          title: 'Forenzná časová os & Replay simulácia',
          desc: 'Posuvníkom času môžete prehrať vývoj udalostí a sledovať pulzujúce väzby v reálnom čase.'
        },
        {
          icon: Users,
          title: 'Správa identít (Merge / Split)',
          desc: 'Jedným klikom zlučujte prezývky a duplicitné záznamy (napr. Ján Novák = Janko = Podozrivý).'
        }
      ],
      prompts: [
        { label: 'Ovládanie grafu', text: 'Kliknutím na osobu alebo čiaru vzťahu okamžite otvoríte detailný výsluch a citáciu v archíve.' },
        { label: 'Replay mód', text: 'Stlačte tlačidlo Replay v spodnej lište a graf vám animovane prehrá sled udalostí podľa výpovedí.' }
      ],
      mockup: (
        <div className="relative w-full h-full p-4 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900/90 via-red-950/40 to-slate-900/90 border border-red-500/30 text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-semibold text-red-300 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" /> Pavúk vzťahov
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              Replay: 14:30
            </span>
          </div>

          <div className="relative my-auto flex items-center justify-center h-32">
            {/* Uzly simulácie */}
            <div className="absolute left-8 top-6 p-2 rounded-full bg-blue-600/40 border-2 border-blue-400 text-xs font-bold shadow-lg shadow-blue-500/20 animate-pulse">
              Ján N.
            </div>
            <div className="absolute right-8 top-16 p-2 rounded-full bg-red-600/40 border-2 border-red-400 text-xs font-bold shadow-lg shadow-red-500/20">
              Peter K.
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 p-2 rounded-full bg-white/20 border-2 border-white text-xs font-bold shadow-lg">
              Svedok B.
            </div>
            <svg className="w-full h-full pointer-events-none stroke-slate-400/50 stroke-[1.5] stroke-dasharray-2">
              <line x1="30%" y1="35%" x2="70%" y2="55%" />
              <line x1="30%" y1="35%" x2="50%" y2="80%" />
            </svg>
          </div>

          <div className="pt-2 bg-black/30 p-2 rounded-xl border border-white/5 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <div className="flex-1 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div className="w-3/5 h-full bg-gradient-to-r from-blue-500 via-white to-red-500" />
            </div>
            <span className="text-[10px] font-mono text-slate-300">14:30</span>
          </div>
        </div>
      )
    },
    {
      id: 3,
      tag: 'Krok 3 zo 3 · AI Vyšetrovateľ & Report',
      title: 'Forenzná AI a odhaľovanie alibi konfliktov',
      subtitle: 'Algoritmické porovnávanie výpovedí naprieč celým spisom, Sherlock AI asistent a exporty do oficiálneho PDF protokolu.',
      colorAccent: 'white',
      features: [
        {
          icon: ShieldAlert,
          title: 'Automatická detekcia rozporov v alibi',
          desc: 'Systém okamžite upozorní, ak dve rôzne osoby tvrdia nekompatibilné fakty o rovnakom čase a mieste.'
        },
        {
          icon: Bot,
          title: 'Sherlock Chat asistent',
          desc: 'Pýtajte sa v slovenčine otázky typu „Kto nemá alibi medzi 14:00 a 15:00?" a získajte presné odpovede.'
        },
        {
          icon: FileText,
          title: 'Oficiálny PDF vyšetrovací protokol',
          desc: 'Kompletný export prípadu s tabuľkou osôb, červenými vlajkami, grafom vzťahov a slovenskou diakritikou.'
        }
      ],
      prompts: [
        { label: 'Ako sa pýtať Sherlocka', text: '„Analyzuj rozpor v čase medzi výpoveďou svedka A a podozrivého B."' },
        { label: 'Prehľad alibi', text: '„Ktoré osoby sa podľa spisov nachádzali na Hlavnej ulici o 14:30?"' },
        { label: 'Rýchle hľadanie', text: 'Stlačte kdekoľvek klávesovú skratku Ctrl+K / Cmd+K pre bleskové vyhľadanie v celom spise.' }
      ],
      mockup: (
        <div className="relative w-full h-full p-4 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-800 to-blue-950/80 border border-white/20 text-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-400" /> Sherlock AI Asistent
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold border border-red-400/30">
              1 Rozpor nájdený
            </span>
          </div>

          <div className="space-y-2 my-auto">
            <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-xs">
              <div className="flex items-center gap-1.5 text-red-300 font-bold text-[11px] mb-1">
                <ShieldAlert className="w-3 h-3" /> Konflikt v alibi (14:30)
              </div>
              <p className="text-slate-300 text-[11px]">
                Výpoveď 1 uvádza Bratislava, Výpoveď 2 uvádza Košice v rovnakom čase.
              </p>
            </div>

            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-slate-300 text-[11px]">
                Sherlock: „Podozrivý Ján Novák nemá potvrdené alibi medzi 14:15 a 14:45."
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10">
            <span className="text-blue-300 font-medium">Ctrl+K pre vyhľadávanie</span>
            <span className="px-2 py-0.5 rounded bg-white/15 text-white font-mono text-[10px]">Export PDF</span>
          </div>
        </div>
      )
    }
  ];

  const currentSlide = slides[step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Celá výška 100vh & 100dvh responzívne pre mobil a desktop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-5xl h-full max-h-[100dvh] md:max-h-[92vh] flex flex-col rounded-3xl md:rounded-[36px] liquid-glass-panel text-slate-100 shadow-glass-lg overflow-hidden"
      >
        {/* Dekoratívne slovenské farby v pozadí (Modrá - Biela - Červená) */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-white to-red-600 z-20" />
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

        {/* Hlavička modalu */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-red-600 p-0.5 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">ForenzDetectiv</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600/30 to-red-600/30 text-blue-200 border border-white/15">
                  Sprievodca systémom
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentSlide.tag}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Indikátory krokov (Trikolóra) */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              {[1, 2, 3].map((i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    step === i
                      ? i === 1 ? 'bg-blue-500 ring-4 ring-blue-500/20 scale-110' : i === 2 ? 'bg-red-500 ring-4 ring-red-500/20 scale-110' : 'bg-white ring-4 ring-white/20 scale-110'
                      : 'bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Krok ${i}`}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-400 hover:text-white transition-colors"
              aria-label="Zavrieť"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hlavné telo prezentácie */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1"
            >
              {/* Ľavá textová a funkčná časť */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {currentSlide.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Prepínač: Funkcie vs. Nápoveda / Prompty */}
                <div className="flex items-center gap-2 pt-1 border-b border-white/10 pb-2">
                  <button
                    onClick={() => setActiveTab('features')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                      activeTab === 'features'
                        ? 'bg-white/15 text-white border border-white/20 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Kľúčové funkcie
                  </button>
                  <button
                    onClick={() => setActiveTab('prompts')}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      activeTab === 'prompts'
                        ? 'bg-blue-600/30 text-blue-200 border border-blue-400/30 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Vysvetlivky a tipy
                  </button>
                </div>

                {activeTab === 'features' ? (
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {currentSlide.features.map((f, idx) => {
                      const Icon = f.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                        >
                          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600/20 to-red-600/20 border border-white/10 text-white shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">{f.title}</h4>
                            <p className="text-xs text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 pt-1">
                    {currentSlide.prompts.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/20 text-xs space-y-1"
                      >
                        <span className="font-bold text-blue-300 uppercase tracking-wider text-[10px]">
                          {p.label}
                        </span>
                        <p className="text-slate-200 leading-relaxed italic">{p.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pravá interaktívna mockup vizualizácia */}
              <div className="lg:col-span-5 h-64 sm:h-72 md:h-80 w-full flex items-center justify-center">
                {currentSlide.mockup}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pätička s navigáciou (Ďalej / Späť / Začať) */}
        <div className="px-5 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 text-xs sm:text-sm font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Späť
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="text-xs sm:text-sm text-slate-400 hover:text-slate-200 px-3 py-2 transition-colors font-medium"
              >
                Preskočiť
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-900/40 border border-white/20 transition-all scale-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                Ďalej <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-900/40 border border-white/30 transition-all scale-100 hover:scale-[1.03] active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" /> Vstúpiť do vyšetrovania
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
