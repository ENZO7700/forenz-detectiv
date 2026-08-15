import React from 'react';
import { FileText, CheckCircle2, Clock, XCircle, Percent, Users, Link2, AlertTriangle, Flag } from 'lucide-react';

export default function StatsBar({ documents, persons, relationships, redFlags, flaggedPassages }) {
  const byStatus = { pending: 0, analyzing: 0, done: 0, error: 0 };
  documents.forEach((d) => { byStatus[d.status] = (byStatus[d.status] || 0) + 1; });
  const successBase = byStatus.done + byStatus.error;
  const successRate = successBase ? Math.round((byStatus.done / successBase) * 100) : 0;

  const chips = [
    { label: 'Dokumenty', value: documents.length, icon: FileText, color: '#3b82f6' },
    { label: 'Spracované', value: byStatus.done, icon: CheckCircle2, color: '#22c55e' },
    { label: 'V analýze', value: byStatus.analyzing + byStatus.pending, icon: Clock, color: '#f59e0b' },
    { label: 'Chyby', value: byStatus.error, icon: XCircle, color: '#ef4444' },
    { label: 'Úspešnosť', value: `${successRate}%`, icon: Percent, color: '#8b5cf6' },
    { label: 'Osoby', value: persons.length, icon: Users, color: '#06b6d4' },
    { label: 'Vzťahy', value: relationships.length, icon: Link2, color: '#0ea5e9' },
    { label: 'Varovania', value: redFlags.length, icon: AlertTriangle, color: '#f97316' },
    { label: 'Zvýraznenia', value: flaggedPassages.length, icon: Flag, color: '#eab308' }
  ];

  return (
    <div className="px-4 py-2.5 bg-white/70 backdrop-blur-3xl border-b border-white grid grid-cols-3 gap-2 shrink-0 lg:flex lg:flex-wrap lg:items-center">
      {chips.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/60 border border-white lg:w-auto whitespace-nowrap min-w-0"
        >
          <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}1f` }}>
            <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} />
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{c.label}</span>
          <span className="font-semibold text-blue-700 tabular-nums ml-auto lg:ml-0">{c.value}</span>
        </div>
      ))}
    </div>
  );
}