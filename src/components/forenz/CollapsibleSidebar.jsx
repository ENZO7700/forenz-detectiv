import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Liquid Glass kolabujúci sidebar — desktop animácia šírky + mliečna bublina pri zbalení.
export default function CollapsibleSidebar({ side, collapsed, onToggle, expandedWidth, bubbleIcon: Icon, bubbleLabel, children }) {
  return (
    <>
      {/* Mobilné zobrazenie: vždy viditeľné, vertikálne skladowané */}
      <div className="lg:hidden">{children}</div>

      {/* Desktop: kolabujúci panel s Liquid Glass ťahadlom */}
      <motion.div
        animate={{ width: collapsed ? 0 : expandedWidth }}
        transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        className="hidden lg:flex shrink-0 overflow-hidden"
      >
        <div style={{ width: expandedWidth }} className="h-full flex">
          {side === 'right' && <Handle side={side} onToggle={onToggle} />}
          <div className="flex-1 min-w-0 h-full">{children}</div>
          {side === 'left' && <Handle side={side} onToggle={onToggle} />}
        </div>
      </motion.div>

      {/* Plávajúca mliečna bublina pri zbalenom stave */}
      <AnimatePresence>
        {collapsed && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            onClick={onToggle}
            className={`hidden lg:flex absolute top-4 z-30 items-center gap-1.5 px-3 py-2 rounded-full bg-white/70 backdrop-blur-3xl border border-white shadow-xl text-blue-700 text-xs font-semibold hover:bg-white/90 transition-colors ${side === 'left' ? 'left-4' : 'right-4'}`}
          >
            {side === 'left' ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{bubbleLabel}</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

function Handle({ side, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-4 shrink-0 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white/40 rounded-lg transition-colors"
      title="Zbaliť panel"
    >
      {side === 'left' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );
}