import React, { createContext, useContext, useState, useEffect } from 'react';
import skDict from '@/locales/sk.json';
import csDict from '@/locales/cs.json';

const dictionaries = {
  sk: skDict,
  cs: csDict
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'sk';
    const stored = localStorage.getItem('forenz_lang');
    if (stored && (stored === 'sk' || stored === 'cs')) return stored;
    const browserLang = navigator.language?.toLowerCase();
    if (browserLang && browserLang.startsWith('cs')) return 'cs';
    return 'sk';
  });

  const setLanguage = (newLang) => {
    if (dictionaries[newLang]) {
      setLangState(newLang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('forenz_lang', newLang);
      }
    }
  };

  /**
   * Preloží kľúč v tvare 'nav.dashboard' s podporou interpolácie napr. t('files.count', { count: 5 })
   */
  const t = (keyPath, params = {}) => {
    const currentDict = dictionaries[lang] || dictionaries.sk;
    const keys = keyPath.split('.');
    
    let current = currentDict;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback do SK slovníka
        let fallback = dictionaries.sk;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return keyPath;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let result = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
    }
    return result;
  };

  return (
    <I18nContext.Provider value={{ language: lang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Bezpečný fallback, ak komponent nie je obalený v provideri
    return {
      language: 'sk',
      setLanguage: () => {},
      t: (key) => key
    };
  }
  return context;
}
