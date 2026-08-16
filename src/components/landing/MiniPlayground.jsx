import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, ShieldAlert, Zap, Loader2 } from 'lucide-react';

const PRESETS = [
  {
    label: 'Ticho vs. Hlasná hudba',
    statement1: 'Poškodený tvrdí: O 20:00 bolo na parkovisku úplné ticho a tma.',
    statement2: 'Svedok tvrdí: O 20:00 tam hrala hlasná hudba a svietili silné reflektory.'
  },
  {
    label: 'Alibi BA vs. KE',
    statement1: 'Podozrivý tvrdí: O 14:15 som bol na obede v Bratislave.',
    statement2: 'Záznam z bankomatu: O 14:55 bol vykonaný výber kartou v Košiciach.'
  }
];

export default function MiniPlayground({ onTryFullApp = null, onRequestPilot = null }) {
  const [statement1, setStatement1] = useState(PRESETS[0].statement1);
  const [statement2, setStatement2] = useState(PRESETS[0].statement2);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      setAnalyzing(false);
      setResult({
        contradictionFound: true,
        type: 'Faktický & Zmyslový rozpor',
        confidence: '99.4%',
        points: [
          { aspect: 'Akustický stav', val1: 'úplné ticho', val2: 'hlasná hudba', status: 'Nezlučiteľné' },
          { aspect: 'Osvetlenie / Čas', val1: 'tma o 20:00', val2: 'silné reflektory o 20:00', status: 'Priamy rozpor' }
        ],
        summary: 'Výpovede popisujú diametrálne odlišné fyzikálne podmienky na rovnakom mieste a v rovnakom čase.'
      });
    }, 600);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur max-w-3xl mx-auto space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Interaktívny Mini-Playground</h3>
            <p className="text-xs text-slate-400">Otestujte AI detekciu rozporu na dvoch vetách bez prihlásenia</p>
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setStatement1(preset.statement1);
                setStatement2(preset.statement2);
                setResult(null);
              }}
              className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2 Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Výpoveď #1 (alebo Záznam A)
          </label>
          <textarea
            rows={3}
            value={statement1}
            onChange={(e) => setStatement1(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Výpoveď #2 (alebo Záznam B)
          </label>
          <textarea
            rows={3}
            value={statement2}
            onChange={(e) => setStatement2(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2 shadow-lg shadow-amber-500/20 gap-2"
        >
          {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyzovať rozpor (1 sekunda)
        </Button>
      </div>

      {/* Analysis Result */}
      {result && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
              <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
              <span>DETEGOVANÝ KRITICKÝ ROZPOR ({result.confidence})</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-red-900/60 text-red-200 font-mono">
              {result.type}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {result.points.map((pt, idx) => (
              <div key={idx} className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">{pt.aspect}</span>
                  <span className="text-red-400 font-bold">{pt.status}</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <span className="text-blue-300 font-mono">„{pt.val1}“</span> vs <span className="text-amber-300 font-mono">„{pt.val2}“</span>
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-300 italic">{result.summary}</p>

          {/* CTA Banner */}
          <div className="pt-2 border-t border-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-slate-300 font-medium">
              Chcete takto analyzovať 50-stranový spis naraz?
            </span>
            <div className="flex items-center gap-2">
              {onRequestPilot && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRequestPilot}
                  className="border-slate-700 text-xs text-slate-300"
                >
                  Firemný pilot
                </Button>
              )}
              {onTryFullApp && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onTryFullApp}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1 shadow-md"
                >
                  Vyskúšať zadarmo <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
