import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, Zap } from 'lucide-react';
import { requestCameraStream, captureFrameFromVideo, stopCameraStream } from '@/lib/camera';
import LiquidGlassModal from '@/components/ui/LiquidGlassModal';
import LiquidGlassButton from '@/components/ui/LiquidGlassButton';

export default function CameraScanner({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [capturedPreview, setCapturedPreview] = useState(null);

  const startCamera = useCallback(async (mode) => {
    setError(null);
    setLoading(true);
    try {
      if (stream) stopCameraStream(stream);
      const newStream = await requestCameraStream(mode);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setError(err.message || 'Chyba kamery');
    } finally {
      setLoading(false);
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
    } else {
      if (stream) stopCameraStream(stream);
      setStream(null);
      setCapturedPreview(null);
      setError(null);
    }
    return () => {
      if (stream) stopCameraStream(stream);
    };
  }, [open]);

  const handleFlipCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSnap = async () => {
    if (!videoRef.current) return;
    const result = await captureFrameFromVideo(videoRef.current);
    if (result) {
      setCapturedPreview(result);
    }
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      onCapture(capturedPreview.file);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
  };

  return (
    <LiquidGlassModal
      open={open}
      onClose={onClose}
      title="Skenovanie výpovede kamerou"
      subtitle="Namierte kameru priamo na písomnú zápisnicu alebo protokol"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {error ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <p className="font-bold">Nepodarilo sa spustiť kameru</p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          </div>
        ) : capturedPreview ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black max-h-[50vh] flex items-center justify-center">
              <img
                src={capturedPreview.dataUrl}
                alt="Zachytená výpoveď"
                className="w-full h-auto object-contain"
              />
              <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Pripravené na analýzu
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <LiquidGlassButton variant="ghost" onClick={handleRetake}>
                <RefreshCw className="w-4 h-4" /> Znova odfotiť
              </LiquidGlassButton>
              <LiquidGlassButton variant="primary" onClick={handleConfirm}>
                <Check className="w-4 h-4" /> Analyzovať výpoveď
              </LiquidGlassButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-slate-950 aspect-[4/3] flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-white gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm font-medium">Spúšťam kameru...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Forenzný zameriavací rámček na dokument */}
              <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-blue-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] text-blue-300 font-mono">
                  <span>[OCR SCAN]</span>
                  <span>A4 DOKUMENT</span>
                </div>
                <div className="text-center text-[11px] text-white/80 font-medium bg-black/40 backdrop-blur-sm py-1 px-3 rounded-full mx-auto">
                  Zarovnajte text do rámčeka
                </div>
              </div>

              {/* Tlačidlo otočenia kamery */}
              <button
                type="button"
                onClick={handleFlipCamera}
                className="absolute bottom-3 right-3 p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 transition-transform active:scale-95"
                title="Prepnúť kameru (predná / zadná)"
                aria-label="Prepnúť kameru"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={handleSnap}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-white to-red-600 p-1 shadow-glow-blue hover:scale-105 active:scale-95 transition-transform"
                title="Odfotiť dokument"
                aria-label="Odfotiť dokument"
              >
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </LiquidGlassModal>
  );
}
