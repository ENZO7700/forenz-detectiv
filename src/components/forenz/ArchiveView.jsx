import React, { useMemo } from 'react';
import ArchiveFilmstrip from '@/components/forenz/ArchiveFilmstrip';
import ArchiveViewer from '@/components/forenz/ArchiveViewer';
import ArchiveMetaPanel from '@/components/forenz/ArchiveMetaPanel';

export default function ArchiveView({
  documents,
  persons,
  relationships,
  redFlags,
  flaggedPassages,
  claims,
  events,
  locations,
  vehicles,
  contradictions,
  selectedDocId,
  onSelectDoc,
  onJumpToPerson,
  onJumpToEdge,
  onJumpToContradiction,
  readOnly
}) {
  const effectiveDocId = selectedDocId || documents[0]?.id || null;
  const doc = useMemo(() => documents.find((d) => d.id === effectiveDocId) || null, [documents, effectiveDocId]);

  const contradictionCounts = useMemo(() => {
    const m = {};
    contradictions.forEach((c) => {
      if (c.document_a_id) m[c.document_a_id] = (m[c.document_a_id] || 0) + 1;
      if (c.document_b_id && c.document_b_id !== c.document_a_id) m[c.document_b_id] = (m[c.document_b_id] || 0) + 1;
    });
    return m;
  }, [contradictions]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <ArchiveFilmstrip
        documents={documents}
        selectedDocId={effectiveDocId}
        onSelect={onSelectDoc}
        contradictionCounts={contradictionCounts}
      />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <ArchiveViewer
          documents={documents}
          selectedDocId={effectiveDocId}
          onSelect={onSelectDoc}
        />
        <ArchiveMetaPanel
          doc={doc}
          persons={persons}
          relationships={relationships}
          redFlags={redFlags}
          flaggedPassages={flaggedPassages}
          claims={claims}
          events={events}
          locations={locations}
          vehicles={vehicles}
          contradictions={contradictions}
          onJumpToPerson={onJumpToPerson}
          onJumpToEdge={onJumpToEdge}
          onJumpToContradiction={onJumpToContradiction}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}