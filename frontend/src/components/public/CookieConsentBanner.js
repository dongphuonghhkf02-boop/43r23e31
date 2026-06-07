/**
 * DM Auto — Cookie Consent Banner (V5 — compact corner card)
 *
 * Redesigned June 2026 per design feedback:
 *   • Compact rectangular card (≈360 px wide) anchored to the BOTTOM-LEFT
 *     corner of the viewport (was previously a full-width bar).
 *   • Single-column stacked layout: icon + GDPR badge → title → body →
 *     primary CTA → secondary "Learn more" link.
 *   • Improved colour hierarchy — navy headline on cream-tinted white
 *     card, soft grey body, amber accent on the GDPR badge. CTA is solid
 *     navy with high-contrast cream text.
 *   • Mobile: full-bleed bottom card with 12 px insets.
 *
 * Behaviour unchanged:
 *   • One-time consent stored in localStorage
 *   • Hidden on admin/team/manager routes
 *   • Optional admin-controlled copy via /api/site-info
 *
 * Storage: bibi_cookie_consent = { essential: true, ts }
 */
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Check, Cookie, ShieldCheck } from '@phosphor-icons/react';
import axios from 'axios';
import { useLang } from '../../i18n';
import { usePolicyModal } from './PolicyModal';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const STORAGE_KEY = 'bibi_cookie_consent';

const hasConsent = () => {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
};

const persist = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ essential: true, ts: new Date().toISOString() }),
    );
  } catch {
    /* localStorage may be blocked in sandboxed contexts; ignore. */
  }
};

export default function CookieConsentBanner() {
  const { lang } = useLang();
  const { pathname } = useLocation();
  const { open: openPolicy } = usePolicyModal();
  const [open, setOpen] = useState(false);
  const [bannerCopy, setBannerCopy] = useState(null);
  const [enabled, setEnabled] = useState(true);

  // Hide on admin/team/manager routes
  const isPublicRoute =
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/team') &&
    !pathname.startsWith('/manager');

  useEffect(() => {
    if (!isPublicRoute) return;
    if (hasConsent()) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/site-info`);
        if (cancelled) return;
        const cb = r.data?.cookie_banner || {};
        setEnabled(cb.enabled !== false);
        setBannerCopy(cb);
        if (cb.enabled !== false) {
          setTimeout(() => !cancelled && setOpen(true), 600);
        }
      } catch {
        if (!cancelled) {
          setBannerCopy({});
          setTimeout(() => !cancelled && setOpen(true), 600);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPublicRoute]);

  if (!isPublicRoute || !open || !enabled) return null;

  const isRu = lang === 'ru';

  /* ─────── i18n strings ─────── */
  const T = isRu
    ? {
        title: 'Мы заботимся о вашей конфиденциальности',
        body:
          'Мы используем только необходимые cookie — для сохранения сессии и защиты аккаунта. Без трекинга и рекламных сетей.',
        accept: 'Принять',
        learnMore: 'Подробнее о cookies',
        close: 'Закрыть',
        secure: 'GDPR',
      }
    : {
        title: 'We value your privacy',
        body:
          'We only use essential cookies to keep your session secure and your preferences saved. No tracking pixels, no ad networks.',
        accept: 'Accept',
        learnMore: 'Learn more about cookies',
        close: 'Close',
        secure: 'GDPR',
      };

  /* Backend override (admin-controlled copy). Falls back to localised default. */
  const bodyOverride =
    (isRu ? bannerCopy?.body_ru : bannerCopy?.body_en) || null;
  const titleOverride =
    (isRu ? bannerCopy?.title_ru : bannerCopy?.title_en) || null;
  const title = titleOverride || T.title;
  const body = bodyOverride || T.body;

  const accept = () => {
    persist();
    setOpen(false);
  };

  /*
   * Layout:
   *   Compact card, bottom-left corner.
   *   Desktop: 360 × auto, 20 px gap from edges.
   *   Mobile (< 480 px): full-width with 12 px insets.
   */
  return (
    <div
      className="fixed z-[100] bottom-3 left-3 sm:bottom-5 sm:left-5 right-3 sm:right-auto pointer-events-none"
      data-testid="cookie-banner"
      role="dialog"
      aria-label={title}
    >
      <div
        className="
          pointer-events-auto
          relative
          w-full sm:w-[360px]
          max-w-full
          bg-white
          border border-[#E6DED4]
          rounded-2xl
          shadow-[0_24px_56px_-20px_rgba(15,31,54,0.32),0_8px_18px_-8px_rgba(15,31,54,0.18)]
          overflow-hidden
          animate-[bibi-cookie-in_0.45s_cubic-bezier(0.22,1,0.36,1)_both]
        "
      >
        {/* Subtle amber top accent */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FEAE00] via-[#FFC83D] to-[#FEAE00] opacity-90"
        />

        {/* Close (X) button — top right */}
        <button
          type="button"
          onClick={accept}
          aria-label={T.close}
          className="
            absolute top-2.5 right-2.5
            w-8 h-8 rounded-lg
            text-[#6E7C88] hover:text-[#162E51]
            hover:bg-[rgba(22,46,81,0.06)]
            flex items-center justify-center
            transition-colors
            z-10
          "
          data-testid="cookie-close"
        >
          <X size={16} weight="bold" />
        </button>

        <div className="p-5 pt-[22px] flex flex-col gap-3">
          {/* Row: cookie icon + GDPR pill */}
          <div className="flex items-center gap-2.5">
            <div
              className="
                w-10 h-10 rounded-xl shrink-0
                bg-gradient-to-br from-[#FFEFCD] to-[#FFD37A]
                text-[#7A4B00]
                flex items-center justify-center
                shadow-[inset_0_-1px_0_rgba(122,75,0,0.12),0_4px_10px_rgba(254,174,0,0.22)]
              "
            >
              <Cookie size={20} weight="fill" />
            </div>
            <span
              className="
                inline-flex items-center gap-1
                text-[10.5px] font-semibold uppercase tracking-[0.12em]
                text-[#A06B00]
                bg-[#FFF5DC]
                border border-[#FCD37A]
                rounded-full
                px-2.5 py-1
                leading-none
              "
            >
              <ShieldCheck size={11} weight="bold" />
              {T.secure}
            </span>
          </div>

          {/* Title */}
          <h3
            className="
              m-0
              text-[15px] font-semibold
              text-[#162E51]
              tracking-tight
              leading-snug
              pr-6
            "
          >
            {title}
          </h3>

          {/* Body */}
          <p
            className="
              m-0
              text-[12.5px]
              text-[#4A5260]
              leading-[1.55]
            "
          >
            {body}
          </p>

          {/* Accept CTA — full width inside the card */}
          <button
            type="button"
            onClick={accept}
            className="
              mt-1
              w-full
              inline-flex items-center justify-center gap-2
              bg-[#162E51] hover:bg-[#1A4480] active:bg-[#0F1F36]
              text-[#F5F0E8]
              text-[13px] font-semibold uppercase tracking-[0.08em]
              rounded-xl
              h-11 px-5
              transition-all
              shadow-[0_10px_24px_-10px_rgba(22,46,81,0.55),0_4px_10px_-4px_rgba(22,46,81,0.4)]
              hover:shadow-[0_14px_30px_-10px_rgba(22,46,81,0.65),0_6px_14px_-6px_rgba(22,46,81,0.45)]
              hover:-translate-y-px
            "
            data-testid="cookie-accept"
          >
            <Check size={15} weight="bold" />
            {T.accept}
          </button>

          {/* Learn more — secondary text link */}
          <button
            type="button"
            onClick={() => openPolicy('cookies')}
            className="
              self-center
              text-[12px] font-medium
              text-[#162E51]/75 hover:text-[#162E51]
              underline underline-offset-[3px] decoration-[#162E51]/30 hover:decoration-[#162E51]
              bg-transparent border-0 p-0
              cursor-pointer
              transition-colors
            "
            data-testid="cookie-banner-learn-more"
          >
            {T.learnMore} →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bibi-cookie-in {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
}
