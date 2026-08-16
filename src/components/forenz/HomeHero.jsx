import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Zap,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Scale,
  Files
} from 'lucide-react';
import { useForenzStore } from '@/store/useForenzStore';

export default function HomeHero({ onScan, onBulkScan = null, scanning = false }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const loadDemoCase = useForenzStore((s) => s.loadDemoCase);

  const handleFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (files.length > 1 && onBulkScan) {
      onBulkScan(files);
    } else if (onScan) {
      onScan(files[0]);
    }
  };

  const handleFileChange = (e) => {
    handleFiles(e.target.files);
    // Reset file input value to allow re-upload of same files
    e.target.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center p-4 lg:p-8 overflow-y-auto bg-slate-950 text-slate-100">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl w-full flex flex-col items-center text-center z-10 my-auto">
        {/* Pill Tag */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300 shadow-sm mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 font-semibold">ForenzDetectiv AI</span>
          <span className="text-slate-500">·</span>
          <span>Slovenská forenzná analýza spisov</span>
        </motion.div>

        {/* Hero Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]"
        >
          Odhaľte skryté <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">rozpory</span> a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-500">nemožné alibi</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-sm sm:text-base text-slate-400 max-w-2xl mt-4 mb-8 leading-relaxed"
        >
          Prvá platforma pre vyšetrovateľov a advokátov, ktorá v spise automaticky nájde protirečenia medzi výpoveďami s doslovným citátom zo zdroja a geospatiálnou kontrolou.
        </motion.p>

        {/* Drag & Drop Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-2xl p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer relative overflow-hidden group shadow-2xl ${
            isDragOver
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-900/80 hover:border-amber-500/50 hover:bg-slate-900'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.txt"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all shadow-inner">
              <Upload className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {scanning ? 'Spracovávam výpoveď...' : 'Pretiahnite sem 1 alebo viacero zápisníc naraz'}
              </h3>
              <p className="text-xs text-slate-400">
                Podpora hromadného nahratia (Bulk upload): PDF zápisnice, fotografie svedectiev (OCR), textové súbory
              </p>
            </div>

            <button
              type="button"
              disabled={scanning}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all group-hover:shadow-amber-500/20"
            >
              <Files className="w-4 h-4" /> Nahrať spis / výpovede (PDF / Foto)
            </button>
          </div>
        </motion.div>

        {/* 1-Tap Demo CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="w-full max-w-2xl mt-4"
        >
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg hover:border-amber-500/40 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                  Nemáte pri sebe spis?
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">1-Klik Demo</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Vyskúšajte reálnu kauzu: Bratislava 14:15 ➡️ Košice 14:55 (Alibi paradox 675 km/h)
                </p>
              </div>
            </div>

            <button
              onClick={loadDemoCase}
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all hover:scale-[1.02]"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Spustiť Demo spis <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>

        {/* Proof Strip / Feature Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl mt-8 pt-6 border-t border-slate-900"
        >
          <div className="flex items-center gap-2 text-left p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Krížové rozpory</div>
              <div className="text-[11px] text-slate-500">100% citácie zo zdroja</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">SK Alibi mapa</div>
              <div className="text-[11px] text-slate-500">Haversine kalkulácia</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Lokálny sandbox</div>
              <div className="text-[11px] text-slate-500">GDPR & RLS bezpečnosť</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-left p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Súdny PDF export</div>
              <div className="text-[11px] text-slate-500">SHA-256 hash integrity</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
