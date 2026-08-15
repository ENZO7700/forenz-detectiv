import React from 'react';
import { Calendar, Users, MapPin, Car, Network, Flag, AlertOctagon, CalendarClock, ExternalLink, FileText } from 'lucide-react';

const STATUS = {
  pending: { label: 'Čaká', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  analyzing: { label: 'Analyzuje sa', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
  done: { label: 'Hotové', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  error: { label: 'Chyba', cls: 'bg-red-500/15 text-red-700 dark:text-red-300' }
};

function Count({ icon: Icon, label, n }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-none text-xs">
      <Icon className="w-3 h-3 text-indigo-500 dark:text-slate-400 shrink-0" />
      <span className="text-slate-700 dark:text-slate-300 tabular-nums">{n}</span>
      <span className="text-slate-400 dark:text-slate-500 text-[10px]">{label}</span>
    </div>
  );
}

function LinkRow({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-1.5 text-left rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <span className="flex-1 min-w-0">{children}</span>
      <ExternalLink className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-blue-400 shrink-0" />
    </button>
  );
}

function Section({ title, accent, children }) {
  return (
    <div>
      <h4 className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${accent === 'red' ? 'text-red-500 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{title}</h4>
      <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-none overflow-hidden">{children}</div>
    </div>
  );
}

export default function ArchiveMetaPanel({
  doc,
  persons,
  relationships,
  redFlags,
  flaggedPassages,
  claims,
  events,
  locations,
  vehicles,
  contradictions,
  onJumpToPerson,
  onJumpToEdge,
  onJumpToContradiction,
  readOnly
}) {
  const docId = doc?.id;
  const docPersons = docId ? persons.filter((p) => p.document_id === docId) : [];
  const docEvents = docId ? events.filter((e) => e.document_id === docId) : [];
  const docLocations = docId ? locations.filter((l) => l.document_id === docId) : [];
  const docVehicles = docId ? vehicles.filter((v) => v.document_id === docId) : [];
  const docRelationships = docId ? relationships.filter((r) => r.document_id === docId) : [];
  const docRedFlags = docId ? redFlags.filter((r) => r.document_id === docId) : [];
  const docFlagged = docId ? flaggedPassages.filter((p) => p.document_id === docId) : [];
  const docClaims = docId ? claims.filter((c) => c.document_id === docId) : [];
  const docContradictions = docId
    ? contradictions.filter((c) => c.document_a_id === docId || c.document_b_id === docId)
    : [];

  return (
    <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col max-h-[40vh] lg:max-h-none min-w-0 overflow-hidden">
      <div className="overflow-y-auto flex-1">
        {!doc ? (
          <div className="p-6 text-center text-slate-400 dark:text-slate-600 text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Vyberte dokument z archívu
          </div>
        ) : (
          <div className="p-3 space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words">{doc.title}</h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${(STATUS[doc.status] || STATUS.pending).cls}`}>
                  {(STATUS[doc.status] || STATUS.pending).label}
                </span>
                {doc.created_date && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.created_date).toLocaleDateString('sk-SK')}
                  </span>
                )}
              </div>
              {doc.summary && <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{doc.summary}</p>}
              {readOnly && <p className="text-[10px] text-violet-600 dark:text-violet-400/70 mt-1.5">Len na čítanie</p>}
            </div>

            {/* Counts */}
            <div className="flex flex-wrap gap-1.5">
              <Count icon={Users} label="osoby" n={docPersons.length} />
              <Count icon={CalendarClock} label="udalosti" n={docEvents.length} />
              <Count icon={MapPin} label="miesta" n={docLocations.length} />
              <Count icon={Car} label="vozidlá" n={docVehicles.length} />
              <Count icon={Network} label="vzťahy" n={docRelationships.length} />
              <Count icon={Flag} label="varovania" n={docRedFlags.length} />
              <Count icon={AlertOctagon} label="rozpory" n={docContradictions.length} />
            </div>

            {/* Osoby */}
            {docPersons.length > 0 && (
              <Section title="Osoby">
                {docPersons.map((p) => (
                  <LinkRow key={p.id} onClick={() => onJumpToPerson(p)}>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 ml-1">[{p.type}]</span>
                    {p.details && <span className="block text-[10px] text-slate-500 dark:text-slate-500 truncate">{p.details}</span>}
                  </LinkRow>
                ))}
              </Section>
            )}

            {/* Udalosti */}
            {docEvents.length > 0 && (
              <Section title="Udalosti">
                {docEvents.map((e) => (
                  <div key={e.id} className="px-2 py-1.5 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{e.title}</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-500">
                      {[e.time || e.date, e.location].filter(Boolean).join(' · ') || '—'}
                    </span>
                    {e.persons?.length > 0 && (
                      <span className="block text-[10px] text-slate-400 dark:text-slate-600 truncate">{e.persons.join(', ')}</span>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* Vozidlá */}
            {docVehicles.length > 0 && (
              <Section title="Vozidlá">
                {docVehicles.map((v) => (
                  <div key={v.id} className="px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200">
                    {[v.type, v.brand_model, v.color, v.license_plate].filter(Boolean).join(' · ')}
                    {v.owner_name && <span className="block text-[10px] text-slate-500 dark:text-slate-500">Majiteľ: {v.owner_name}</span>}
                  </div>
                ))}
              </Section>
            )}

            {/* Vzťahy */}
            {docRelationships.length > 0 && (
              <Section title="Vzťahy">
                {docRelationships.map((r) => (
                  <LinkRow key={r.id} onClick={() => onJumpToEdge(r.document_id, r.id)}>
                    {r.time && <span className="text-[10px] text-slate-500 dark:text-slate-500 mr-1">{r.time}</span>}
                    <span className="text-xs text-slate-800 dark:text-slate-200">{r.source_name} → {r.target_name}</span>
                    <span className="text-[10px] text-indigo-600 dark:text-blue-400/80 ml-1">({r.label})</span>
                  </LinkRow>
                ))}
              </Section>
            )}

            {/* Rozpory */}
            {docContradictions.length > 0 && (
              <Section title="Rozpory" accent="red">
                {docContradictions.map((c) => (
                  <LinkRow key={c.id} onClick={() => onJumpToContradiction(c)}>
                    <span className={`text-[10px] px-1 rounded ${c.severity === 'high' ? 'bg-red-500/15 text-red-600 dark:text-red-300' : c.severity === 'medium' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300' : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'}`}>
                      {c.severity}
                    </span>
                    <span className="ml-1 text-xs text-slate-700 dark:text-slate-300">{c.type.replace(/_/g, ' ')}</span>
                    {c.explanation && <span className="block text-[10px] text-slate-500 dark:text-slate-500">{c.explanation}</span>}
                  </LinkRow>
                ))}
              </Section>
            )}

            {/* Dôležité pasáže */}
            {(docFlagged.length > 0 || docClaims.length > 0) && (
              <Section title="Dôležité pasáže">
                {docFlagged.map((p) => (
                  <div key={p.id} className={`rounded-lg p-2 text-xs border-l-2 mb-1.5 ${p.category === 'rozpor' ? 'border-red-500 bg-red-500/10' : 'border-amber-400 bg-amber-400/10'}`}>
                    <span className={`font-semibold ${p.category === 'rozpor' ? 'text-red-600 dark:text-red-300' : 'text-amber-700 dark:text-amber-200'}`}>
                      {p.category === 'rozpor' ? 'Rozpor' : 'Neistota'}
                    </span>
                    <p className="text-slate-700 dark:text-slate-200 italic mt-0.5">„{p.text}"</p>
                    {p.explanation && <p className="text-slate-500 dark:text-slate-400 mt-1">{p.explanation}</p>}
                  </div>
                ))}
                {docClaims.map((c) => (
                  <div key={c.id} className="rounded-lg p-2 text-xs bg-slate-100 dark:bg-slate-800/60 mb-1.5 border-l-2 border-slate-300 dark:border-slate-600">
                    <span className="text-slate-700 dark:text-slate-300">{c.subject} {c.predicate} {c.object}</span>
                    {c.source_quote && <p className="text-slate-500 dark:text-slate-500 italic mt-0.5">„{c.source_quote}"</p>}
                    <span className="text-[10px] text-slate-400 dark:text-slate-600">istota {Math.round((c.confidence ?? 0.5) * 100)}%</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Varovania */}
            {docRedFlags.length > 0 && (
              <Section title="Varovania">
                {docRedFlags.map((r) => (
                  <div key={r.id} className="px-2 py-1.5 text-xs">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">[{r.category}]</span>
                    <span className="text-slate-700 dark:text-slate-300 ml-1">{r.description}</span>
                  </div>
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}