import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Link2, X, Clock, Quote, FileText } from 'lucide-react';
import { TYPE_COLOR } from '@/lib/forenzUtils';

const spring = { type: 'spring', stiffness: 300, damping: 30 };

export default function PersonPanel({ person, edge, onClose, onShowEvidence }) {
  const key = edge ? `edge-${edge.id}` : person ? `person-${person.id}` : 'empty';
  let content;

  if (edge) {
    const color = '#fbbf24';
    content = (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4" style={{ color }} />
            <h3 className="text-sm font-semibold text-blue-700">Vzťah</h3>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 truncate max-w-[45%]">{edge.sourceName}</span>
            <span className="text-slate-600 shrink-0">→</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-blue-700 truncate max-w-[45%]">{edge.targetName}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <span className="text-slate-600">Typ:</span>
            <span className="font-medium">{edge.label}</span>
          </div>
          {edge.time && (
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-mono">{edge.time}</span>
            </div>
          )}
          {edge.description && (
            <div className="flex gap-2 text-slate-500 dark:text-slate-600 mt-2">
              <Quote className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-600 dark:text-slate-600" />
              <p className="text-sm italic">{edge.description}</p>
            </div>
          )}
          {edge.document_title && (
            <p className="text-[11px] text-slate-600 dark:text-slate-600 pt-2 border-t border-slate-200 dark:border-slate-800">Z: {edge.document_title}</p>
          )}
          {onShowEvidence && edge.document_id && (
            <button
              onClick={() => onShowEvidence(edge.document_id)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Zobraziť dôkaz v Kartotéke
            </button>
          )}
        </div>
      </>
    );
  } else if (!person) {
    content = (
      <>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-blue-700">Detail osoby</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-600">
          Kliknite na uzol v grafe pre zobrazenie profilu osoby, alebo na hranu pre detail vzťahu.
        </p>
      </>
    );
  } else {
    const color = TYPE_COLOR[person.type] || '#3b82f6';
    content = (
      <>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" style={{ color }} />
            <h3 className="text-sm font-semibold text-blue-700">Detail osoby</h3>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-lg font-semibold text-blue-900">{person.name}</p>
            <span
              className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${color}22`, color }}
            >
              {person.type}
            </span>
          </div>
          {person.details && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-600 mb-1">Kontext</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{person.details}</p>
            </div>
          )}
          {person.document_title && (
            <p className="text-[11px] text-slate-600 dark:text-slate-600 pt-2 border-t border-slate-200 dark:border-slate-800">Z výpovede: {person.document_title}</p>
          )}
          {onShowEvidence && person.document_id && (
            <button
              onClick={() => onShowEvidence(person.document_id)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Zobraziť dôkaz v Kartotéke
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <div className="p-4 border-b border-white/60">
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={spring}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}