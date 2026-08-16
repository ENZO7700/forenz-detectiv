import React, { useRef, useState } from 'react';
import { Loader2, Camera, UploadCloud } from 'lucide-react';
import CameraScanner from '@/components/forenz/CameraScanner';

export default function ScanButton({ onScan, scanning }) {
  const inputRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onScan(file);
    e.target.value = '';
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.txt,.docx,.doc,.odt"
        data-testid="scan-file-input"
        aria-label="Nahrať fotografickú výpoveď alebo PDF"
        className="sr-only"
        onChange={handleChange}
      />

      {/* Tlačidlo nahrávania súboru */}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={scanning}
        className="liquid-glass-btn liquid-glass-btn-primary shadow-glass-sm"
        title="Nahrať výpoveď z disku (Obrázok alebo PDF)"
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        <span className="hidden sm:inline">{scanning ? 'Analyzujem...' : 'Nahrať výpoveď'}</span>
      </button>

      {/* Tlačidlo skenovania kamerou (PWA Camera) */}
      <button
        onClick={() => setCameraOpen(true)}
        disabled={scanning}
        className="liquid-glass-btn bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-700 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-white/10 shadow-glass-sm p-2 sm:px-3"
        title="Odfotiť výpoveď kamerou"
        aria-label="Odfotiť výpoveď kamerou"
      >
        <Camera className="w-4 h-4" />
        <span className="hidden md:inline">Kamera</span>
      </button>

      {/* Modálne okno kamery */}
      <CameraScanner
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          onScan(file);
          setCameraOpen(false);
        }}
      />
    </div>
  );
}