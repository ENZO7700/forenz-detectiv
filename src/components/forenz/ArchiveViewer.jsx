import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, Expand, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export default function ArchiveViewer({ documents, selectedDocId, onSelect }) {
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const drag = useRef(null);

  const idx = documents.findIndex((d) => d.id === selectedDocId);
  const doc = idx >= 0 ? documents[idx] : null;
  const prevDoc = idx > 0 ? documents[idx - 1] : null;
  const nextDoc = idx >= 0 && idx < documents.length - 1 ? documents[idx + 1] : null;

  // Preload prev/next full-res images (deps zahrňajú image_url, nie len id — vyhnúť sa stale closure)
  useEffect(() => {
    [prevDoc, nextDoc].forEach((d) => {
      if (d?.image_url) { const img = new Image(); img.src = d.image_url; }
    });
  }, [prevDoc?.id, prevDoc?.image_url, nextDoc?.id, nextDoc?.image_url]);

  // Reset transforms when document changes
  useEffect(() => {
    setZoom(1);
    setRotate(0);
    setOffset({ x: 0, y: 0 });
  }, [selectedDocId]);

  const fit = useCallback(() => { setZoom(1); setOffset({ x: 0, y: 0 }); }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  // Keyboard prev/next
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft' && prevDoc) onSelect(prevDoc.id);
      else if (e.key === 'ArrowRight' && nextDoc) onSelect(nextDoc.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevDoc, nextDoc, onSelect]);

  const onDown = (e) => {
    if (zoom <= 1) return;
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.ox + (e.clientX - drag.current.sx),
      y: drag.current.oy + (e.clientY - drag.current.sy)
    });
  };
  const onUp = () => { drag.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.5, Math.min(5, z * delta)));
  };

  const btn =
    'w-8 h-8 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-h-0 overflow-hidden">
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50">
        <button className={btn} onClick={() => prevDoc && onSelect(prevDoc.id)} disabled={!prevDoc} title="Predchádzajúci">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1 text-center px-2">{doc?.title || '—'}</span>
        <button className={btn} onClick={() => nextDoc && onSelect(nextDoc.id)} disabled={!nextDoc} title="Nasledujúci">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1 shrink-0" />
        <button className={btn} onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))} title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
        <span className="text-[10px] text-slate-500 dark:text-slate-500 w-10 text-center tabular-nums shrink-0">{Math.round(zoom * 100)}%</span>
        <button className={btn} onClick={() => setZoom((z) => Math.min(5, z * 1.2))} title="Zoom in"><ZoomIn className="w-4 h-4" /></button>
        <button className={btn} onClick={fit} title="Fit to screen"><Maximize2 className="w-4 h-4" /></button>
        <button className={btn} onClick={() => setRotate((r) => r + 90)} title="Otočiť"><RotateCw className="w-4 h-4" /></button>
        <button className={btn} onClick={toggleFullscreen} title="Celá obrazovka"><Expand className="w-4 h-4" /></button>
      </div>
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        onWheel={onWheel}
        onMouseDown={onDown}
        onMouseMove={onMove}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
      >
        {doc?.image_url ? (
          <img
            src={doc.image_url}
            alt={doc.title}
            draggable={false}
            className="object-contain select-none pointer-events-none"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotate}deg)`,
              maxWidth: '100%',
              maxHeight: '100%',
              transition: drag.current ? 'none' : 'transform 0.15s ease-out'
            }}
          />
        ) : (
          <div className="text-slate-400 dark:text-slate-600 text-center">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{documents.length ? 'Vyberte dokument z archívu' : 'Žiadne dokumenty'}</p>
          </div>
        )}
      </div>
    </div>
  );
}