import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Loader2, FileText, Users, Link2, AlertTriangle, Flag, CheckCircle2, XCircle, Clock, Percent, Network
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const STATUS_LABELS = { pending: 'Čaká', analyzing: 'Analyzuje', done: 'Hotovo', error: 'Chyba' };
const STATUS_COLORS = { pending: '#f59e0b', analyzing: '#3b82f6', done: '#22c55e', error: '#ef4444' };
const FLAG_LABELS = {
  časová_nesúlad: 'Časová nezhoda',
  chýbajúce_info: 'Chýbajúce info',
  lingvistika: 'Lingvistika',
  rozpor: 'Rozpor',
  iné: 'Iné'
};

function KpiCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </span>
      </div>
      <span className="text-2xl font-semibold text-slate-100 tabular-nums">{value}</span>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [documents, persons, relationships, redFlags, flaggedPassages] = await Promise.all([
          base44.entities.Document.list('-created_date', 500),
          base44.entities.Person.list('-created_date', 2000),
          base44.entities.Relationship.list('-created_date', 5000),
          base44.entities.RedFlag.list('-created_date', 2000),
          base44.entities.FlaggedPassage.list('-created_date', 2000)
        ]);
        setData({ documents, persons, relationships, redFlags, flaggedPassages });
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300 gap-3">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p>Nepodarilo sa načítať štatistiky: {error}</p>
        <Link to="/" className="text-blue-400 hover:underline">Späť na aplikáciu</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const { documents, persons, relationships, redFlags, flaggedPassages } = data;
  const byStatus = { pending: 0, analyzing: 0, done: 0, error: 0 };
  documents.forEach((d) => { byStatus[d.status] = (byStatus[d.status] || 0) + 1; });
  const successBase = byStatus.done + byStatus.error;
  const successRate = successBase ? Math.round((byStatus.done / successBase) * 100) : 0;

  const statusData = Object.entries(STATUS_LABELS).map(([k, v]) => ({ name: v, value: byStatus[k] || 0, key: k }));
  const statusTotal = documents.length || 1;

  const flagByCat = {};
  redFlags.forEach((r) => { flagByCat[r.category] = (flagByCat[r.category] || 0) + 1; });
  const flagData = Object.entries(FLAG_LABELS).map(([k, v]) => ({ name: v, value: flagByCat[k] || 0 }));

  const kpis = [
    { label: 'Dokumenty', value: documents.length, icon: FileText, color: '#3b82f6' },
    { label: 'Spracované', value: byStatus.done, icon: CheckCircle2, color: '#22c55e' },
    { label: 'V analýze', value: byStatus.analyzing + byStatus.pending, icon: Clock, color: '#f59e0b' },
    { label: 'Chyby', value: byStatus.error, icon: XCircle, color: '#ef4444' },
    { label: 'Úspešnosť', value: `${successRate}%`, icon: Percent, color: '#8b5cf6' },
    { label: 'Osoby', value: persons.length, icon: Users, color: '#06b6d4' },
    { label: 'Vzťahy', value: relationships.length, icon: Link2, color: '#0ea5e9' },
    { label: 'Varovania', value: redFlags.length, icon: AlertTriangle, color: '#f97316' },
    { label: 'Varovné pasáže', value: flaggedPassages.length, icon: Flag, color: '#eab308' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900">
        <Network className="w-5 h-5 text-blue-400" />
        <h1 className="text-base font-semibold">Dashboard · ForenzDetectiv</h1>
        <Link
          to="/"
          className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm"
        >
          <Network className="w-4 h-4" />
          <span className="hidden sm:inline">Späť na prípad</span>
        </Link>
      </header>

      <main className="px-4 py-5 space-y-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((k) => (
            <KpiCard key={k.label} {...k} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Stavy dokumentov</h2>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Zatiaľ žiadne dokumenty.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(e) => `${e.name}: ${e.value}`}
                    >
                      {statusData.map((d) => (
                        <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            {documents.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {statusData.map((d) => (
                  <div key={d.key} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm" style={{ background: STATUS_COLORS[d.key] }} />
                    <span className="text-slate-400">{d.name}</span>
                    <span className="ml-auto tabular-nums text-slate-200">
                      {d.value} ({Math.round((d.value / statusTotal) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Varovania podľa kategórie</h2>
            {redFlags.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">Zatiaľ žiadne varovania.</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flagData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }} cursor={{ fill: '#1e293b55' }} />
                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}