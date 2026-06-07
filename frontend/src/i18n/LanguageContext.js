/**
 * Language Context
 *
 * Languages:
 *   • Public site (landing, catalog, vin-check, calculator etc.): EN + RU
 *   • Customer cabinet: RU only
 *   • Admin / staff cabinets:  RU only
 *
 * Bulgarian (BG) and Ukrainian (UK) have been fully removed; English (EN)
 * has been removed from both cabinets per product decision — only the
 * public site stays bilingual.
 *
 * Persistence: localStorage["bibi_lang"].  Inside any /cabinet/* or
 * /admin/* route we hard-force the language to 'ru' so the UI never
 * flips back to English even if the user previously chose EN on the
 * public landing page.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

// Full set of languages technically known by the i18n layer.
export const LANGUAGES = [
  { code: 'en', label: 'ENG', flag: '🇬🇧', name: 'English' },
  { code: 'ru', label: 'RU',  flag: '🇷🇺', name: 'Русский' },
];

// Public site + customer auth — EN and RU available.
export const PUBLIC_LANGUAGES = LANGUAGES;

// Customer cabinet — RU only.
export const CUSTOMER_LANGUAGES = LANGUAGES.filter((l) => l.code === 'ru');

// Staff (admin / manager / team-lead) cabinets — RU only.
export const STAFF_LANGUAGES = LANGUAGES.filter((l) => l.code === 'ru');

const SUPPORTED = LANGUAGES.map((l) => l.code);
const PUBLIC_SUPPORTED = PUBLIC_LANGUAGES.map((l) => l.code);
const DEFAULT_LANG = 'ru';

/** Detect path-based forced locale. */
const pathRequiresRu = () => {
  if (typeof window === 'undefined') return false;
  const p = (window.location && window.location.pathname) || '';
  return p.startsWith('/cabinet') || p.startsWith('/admin');
};

/**
 * Detect the user's preferred language from the browser, restricted to the
 * languages the public site supports (EN, RU).
 */
const detectBrowserLang = () => {
  if (typeof navigator === 'undefined') return DEFAULT_LANG;
  const langs = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  for (const raw of langs) {
    if (!raw) continue;
    const code = raw.toLowerCase().slice(0, 2);
    if (PUBLIC_SUPPORTED.includes(code)) return code;
  }
  return DEFAULT_LANG;
};

// Legacy aliases — any old stored 'bg' / 'uk' / 'ua' is mapped to RU.
const normalizeLang = (raw) => {
  if (!raw) return null;
  if (raw === 'bg' || raw === 'uk' || raw === 'ua') return 'ru';
  return SUPPORTED.includes(raw) ? raw : null;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANG;
    // Cabinet / admin routes are RU-only — never use a stale EN preference.
    if (pathRequiresRu()) {
      try { localStorage.setItem('bibi_lang', 'ru'); } catch (e) {}
      return 'ru';
    }
    let stored = null;
    try { stored = localStorage.getItem('bibi_lang'); } catch (e) {}
    let initial = normalizeLang(stored);
    if (!initial) initial = detectBrowserLang();
    try { localStorage.setItem('bibi_lang', initial); } catch (e) {}
    return initial;
  });

  // Persist language preference and reflect on <html lang="…">.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem('bibi_lang', lang); } catch (e) {}
    try { document.documentElement.setAttribute('lang', lang); } catch (e) {}
    try { document.body && document.body.setAttribute('data-app-lang', lang); } catch (e) {}
  }, [lang]);

  // Keep cabinet / admin locked to RU on every route change.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const enforce = () => {
      if (pathRequiresRu() && lang !== 'ru') setLang('ru');
    };
    enforce();
    window.addEventListener('popstate', enforce);
    return () => window.removeEventListener('popstate', enforce);
  }, [lang]);

  // Translation lookup — current language first, then RU fallback, then EN, then the key itself.
  const t = (key) => (
    translations[lang]?.[key]
    ?? translations.ru?.[key]
    ?? translations.en?.[key]
    ?? key
  );

  // Toggle between EN ↔ RU (only meaningful on the public site).
  const toggleLang = () => {
    if (pathRequiresRu()) return;
    const idx = LANGUAGES.findIndex((l) => l.code === lang);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLang(next.code);
  };

  // Set specific language. In cabinets we ignore non-RU requests.
  const changeLang = (newLang) => {
    if (pathRequiresRu()) {
      setLang('ru');
      return;
    }
    const normalized = normalizeLang(newLang);
    if (!normalized) return;
    setLang(normalized);
  };

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang: changeLang,
        t,
        toggleLang,
        changeLang,
        languages: LANGUAGES,
        publicLanguages: PUBLIC_LANGUAGES,
        customerLanguages: CUSTOMER_LANGUAGES,
        staffLanguages: STAFF_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      lang: DEFAULT_LANG,
      setLang: () => {},
      t: (key) => translations[DEFAULT_LANG]?.[key] || key,
      toggleLang: () => {},
      changeLang: () => {},
      languages: LANGUAGES,
      publicLanguages: PUBLIC_LANGUAGES,
      customerLanguages: CUSTOMER_LANGUAGES,
      staffLanguages: STAFF_LANGUAGES,
    };
  }
  return context;
};

export default LanguageContext;
