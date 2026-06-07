/**
 * Social / messenger configuration — single source of truth.
 *
 * Replaces all hard-coded `viber://chat?…` URLs scattered across the
 * codebase.  The Viber channel was retired in December 2026 in favour of
 * Telegram + WhatsApp as the primary client-facing messengers, with
 * Avito as the public track-record / reviews surface.
 *
 * All values can be overridden by the backend `/api/site-info`
 * payload (Admin → Info → Footer → Socials).  This file just provides
 * sane defaults so the UI never renders an empty <a href="">.
 */

export const SOCIAL_DEFAULTS = {
  telegram: {
    url: 'https://t.me/dmauto_official',
    handle: '@dmauto_official',
    label_ru: 'Канал и быстрая связь',
    label_en: 'Channel & direct chat',
  },
  whatsapp: {
    // WhatsApp deep link via wa.me — works on desktop + mobile.
    url: 'https://wa.me/359875313158',
    handle: '+359 875 313 158',
    label_ru: 'Напишите нам в WhatsApp',
    label_en: 'Message us on WhatsApp',
  },
  instagram: {
    url: 'https://www.instagram.com/dmauto.official/',
    handle: '@dmauto.official',
    label_ru: 'Витрина и истории',
    label_en: 'Showroom & stories',
  },
  facebook: {
    url: 'https://www.facebook.com/dmauto.official',
    handle: 'DM Auto',
    label_ru: 'Новости компании',
    label_en: 'Company updates',
  },
  avito: {
    url:
      'https://www.avito.ru/user/198a2416adaa84a2b3e8f17d1b73aaf6/profile/all/predlozheniya_uslug?sellerId=198a2416adaa84a2b3e8f17d1b73aaf6',
    handle: 'DM Auto · 67+ отзывов',
    label_ru: 'Активные сделки и отзывы клиентов',
    label_en: 'Active deals & client reviews',
    rating: 4.9,
    reviews_count: 67,
  },
};

/**
 * Pull a social entry from /api/site-info if the admin has overridden it,
 * otherwise fall back to SOCIAL_DEFAULTS.
 *
 *   getSocial(siteInfo, 'telegram') → { url, handle, label_ru, label_en, … }
 */
export function getSocial(siteInfo, key) {
  const admin = siteInfo?.footer?.socials?.[key] || {};
  const base = SOCIAL_DEFAULTS[key] || {};
  return { ...base, ...admin };
}

/** Localised label helper. */
export function socialLabel(entry, lang) {
  if (!entry) return '';
  if (lang === 'ru') return entry.label_ru || entry.label_en || '';
  return entry.label_en || entry.label_ru || '';
}

export default SOCIAL_DEFAULTS;
