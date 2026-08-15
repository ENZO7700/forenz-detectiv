// PWA silent install — zachytí beforeinstallprompt, potlačí systémový banner
// a sprístupní prompt cez context pre neskoršie použitie (napr. tlačidlo v nastaveniach).
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const PwaInstallContext = createContext({ canInstall: false, promptInstall: async () => false, installed: false });

export function PwaInstallProvider({ children }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBefore = (e) => {
      e.preventDefault(); // potlačenie automatického banneru
      setDeferred(e);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome === 'accepted';
  }, [deferred]);

  return (
    <PwaInstallContext.Provider value={{ canInstall: !!deferred, promptInstall, installed }}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export const usePwaInstall = () => useContext(PwaInstallContext);