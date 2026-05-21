import React, { createContext, useContext, useState, useCallback } from 'react';
import { en } from './en.js';
import { bn } from './bn.js';

const LOCALES = { en, bn };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const switchLang = useCallback((l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key) => LOCALES[lang]?.[key] ?? LOCALES.en[key] ?? key, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
