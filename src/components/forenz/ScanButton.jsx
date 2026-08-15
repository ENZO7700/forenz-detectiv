import React, { useRef } from 'react';
import { ScanLine, Loader2 } from 'lucide-react';

export default function ScanButton({ onScan, scanning }) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onScan(file);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        data-testid="scan-file-input"
        aria-label="Nahrať fotografickú výpoveď"
        className="sr-only"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
        <span className="hidden sm:inline">{scanning ? 'Analyzujem...' : 'Skenovať dokument'}</span>
      </button>
    </>
  );
}