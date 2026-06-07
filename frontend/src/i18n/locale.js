/**
 * Locale helpers — pick the right BCP-47 locale tag for date/number formatting
 * based on the current bibi_lang stored in localStorage.
 *
 *   en → 'en-US'
 *   ru → 'ru-RU'
 *
 * Legacy aliases (bg, uk, ua) are silently coerced to 'en-US' so users who
 * still have an old preference stored don't see broken formatting.
 */

const LOCALE_MAP = {
  en: 'en-US',
  ru: 'ru-RU',
  bg: 'ru-RU', // legacy fallback → RU
  uk: 'ru-RU', // legacy fallback → RU
  ua: 'ru-RU', // legacy fallback → RU
};

const DEFAULT_LOCALE = 'en-US';

/**
 * Returns the BCP-47 locale tag for the currently active language.
 * Reads from localStorage["bibi_lang"], falls back to 'en-US'.
 */
export const getLocale = () => {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_LOCALE;
  try {
    const lang = (window.localStorage.getItem('bibi_lang') || '').toLowerCase();
    return LOCALE_MAP[lang] || DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

/**
 * Map a 2-letter language code to a BCP-47 locale.
 */
export const localeFor = (lang) => LOCALE_MAP[(lang || '').toLowerCase()] || DEFAULT_LOCALE;

/**
 * Convenience: format a date with the current locale.
 */
export const fmtDate = (date, opts) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date ?? '');
    return d.toLocaleDateString(getLocale(), opts);
  } catch {
    return String(date ?? '');
  }
};

/**
 * Convenience: format date + time with the current locale.
 */
export const fmtDateTime = (date, opts) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date ?? '');
    return d.toLocaleString(getLocale(), opts);
  } catch {
    return String(date ?? '');
  }
};

/**
 * Convenience: format time with the current locale.
 */
export const fmtTime = (date, opts) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return String(date ?? '');
    return d.toLocaleTimeString(getLocale(), opts);
  } catch {
    return String(date ?? '');
  }
};

export default { getLocale, localeFor, fmtDate, fmtDateTime, fmtTime };
