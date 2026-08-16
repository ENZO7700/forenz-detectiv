import React, { useRef } from 'react';
import { Layers, Loader2, XOctagon } from 'lucide-react';

export default function BulkScanButton({ onBulkScan, scanning, progress, onCancel }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onBulkScan(files);
    e.target.value = '';
  };

  const label = scanning && progress ? `${progress.done}/${progress.total}` : 'Hromadne (≤20/100)';
  const title = scanning && progress
    ? `Done ${progress.done} · Analýza ${progress.analyzing || 0} · Chyba ${progress.failed || 0} / ${progress.total}`
    : 'Hromadne nahrať výpovede (mobil ≤20, desktop ≤100)';

  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.doc,.odt"
        multiple
        data-testid="bulk-file-input"
        aria-label="Hromadne nahrať výpovede a PDF spisy (do 50 MB / súbor)"
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

      {scanning && onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-medium transition-colors"
          title="Zastaviť spracovanie"
          aria-label="Zastaviť spracovanie"
        >
          <XOctagon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}