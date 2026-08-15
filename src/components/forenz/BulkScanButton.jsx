import React, { useRef } from 'react';
import { Layers, Loader2 } from 'lucide-react';

export default function BulkScanButton({ onBulkScan, scanning, progress }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onBulkScan(files);
    e.target.value = '';
  };

  const label = scanning && progress ? `${progress.done}/${progress.total}` : 'Hromadne (≤100)';
  const title = scanning && progress
    ? `Done ${progress.done} · Analýza ${progress.analyzing || 0} · Chyba ${progress.failed || 0} / ${progress.total}`
    : 'Hromadne nahrať až 100 výpovedí';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        data-testid="bulk-file-input"
        aria-label="Hromadne nahrať výpovede (až 100 obrázkov)"
        className="sr-only"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
        title={title}
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
        <span className="hidden sm:inline">{label}</span>
      </button>
    </>
  );
}