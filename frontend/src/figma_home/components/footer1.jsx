/**
 * DM Auto — Footer1 v2 (editorial-modern redesign).
 *
 * Renders inside <ScaledChrome> at its native 1920 × N frame and scales
 * down on smaller viewports. The new design replaces the old sparse
 * absolute-anchor layout with a coherent vertical composition:
 *
 *   1. TOP HERO BAND
 *      Eyebrow + display heading + amber CTA + supporting copy.
 *      Wrapped with the site-wide corner-tick frame (TL + BR).
 *
 *   2. MAIN GRID (4 cols)
 *      • Brand card     — logo, tagline, working hours
 *      • Explore        — primary nav links
 *      • Contact        — phones, addresses, registration
 *      • Stay In Touch  — Telegram channel widget + social row
 *
 *   3. WORDMARK BAND
 *      Giant subtle "DM AUTO" wordmark spanning the full 1920 width — pure
 *      visual signature, gives the footer its "размашистость" without
 *      reusing the original logo layout.
 *
 *   4. LEGAL STRIP
 *      Copyright • company info • policy buttons • credit.
 *
 * All data sources (siteInfo, phones, addresses, working hours, telegram
 * widget, socials, registration address) are PRESERVED — only the visual
 * organisation has been transformed. Admin-driven fields keep working.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BUTTON1 from "./b-u-t-t-o-n1";
import { useGetInTouch } from "../../components/public/GetInTouchModal";
import { usePolicyModal } from "../../components/public/PolicyModal";
import { useLang } from "../../i18n";
import { SOCIAL_DEFAULTS, getSocial } from "../../lib/socials";
import styles from "./footer1.module.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";
const SITE_INFO_CACHE = "__bibi_site_info_promise__";

function fetchSiteInfo() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!window[SITE_INFO_CACHE]) {
    window[SITE_INFO_CACHE] = axios
      .get(`${API_URL}/api/site-info`)
      .then((r) => r.data)
      .catch(() => null);
  }
  return window[SITE_INFO_CACHE];
}

const FOOTER_T = {
  en: {
    heroEyebrow: "● LET'S TALK",
    heroTitle: "Bring your dream car\nfrom auction to keys.",
    heroLead:
      "From the first call to the moment the car is parked in your driveway — we handle every step. Tell us what you want, we'll handle the rest.",
    ctaPrimary: "Get in touch",
    ctaSecondary: "Browse the catalogue",
    colBrandTitle: "DM AUTO",
    colBrandTag: "Cross-border car procurement — Belarus · Russia.",
    colExploreTitle: "EXPLORE",
    colContactTitle: "CONTACT",
    colTouchTitle: "STAY CONNECTED",
    phoneLabel: "Phone",
    addressLabel: "Address",
    workingHoursLabel: "Availability",
    telegramLabel: "Telegram channel & direct chat",
    socialLabel: "Social",
    registrationLabel: "Registration address",
    defaultRegistrationAddress: "Belarus / Russia — by appointment",
    copyright: "All right reserved. DM AUTO",
    conditions: "Conditions",
    privacy: "Privacy Policy",
    cookies: "Cookies",
    bandEyebrow: "● DRIVE MORE",
    bandTag: "Cross-border car procurement, end to end.",
    backToTop: "Back to top",
    menu: { catalog: "Catalog", calculator: "Calculator", about: "About us", blog: "Blog" },
    defaultHours: "Mon – Sun · 24/7",
  },
  ru: {
    heroEyebrow: "● ПОГОВОРИМ",
    heroTitle: "Привезём авто мечты\nс аукциона до ключей.",
    heroLead:
      "От первого звонка до момента, когда машина уже у вашего дома — мы берём всё на себя. Скажите, какую хотите — остальное за нами.",
    ctaPrimary: "Связаться с нами",
    ctaSecondary: "Открыть каталог",
    colBrandTitle: "DM AUTO",
    colBrandTag: "Подбор и пригон авто — Беларусь · Россия.",
    colExploreTitle: "РАЗДЕЛЫ",
    colContactTitle: "КОНТАКТЫ",
    colTouchTitle: "НА СВЯЗИ",
    phoneLabel: "Телефон",
    addressLabel: "Адрес",
    workingHoursLabel: "Доступность",
    telegramLabel: "Telegram-канал и прямой чат",
    socialLabel: "Соцсети",
    registrationLabel: "Адрес регистрации",
    defaultRegistrationAddress: "Беларусь / Россия — по записи",
    copyright: "Все права защищены. DM AUTO",
    conditions: "Общие условия",
    privacy: "Политика конфиденциальности",
    cookies: "Cookies",
    bandEyebrow: "● DRIVE MORE",
    bandTag: "Подбор и пригон авто под ключ.",
    backToTop: "Наверх",
    menu: { catalog: "Каталог", calculator: "Калькулятор", about: "О нас", blog: "Блог" },
    defaultHours: "Пн – Вс · 24/7",
  },
};

const Footer1 = ({ className = "" }) => {
  const { open } = useGetInTouch();
  const { open: openPolicy } = usePolicyModal();
  const { lang } = useLang();
  const T = lang === "ru" ? FOOTER_T.ru : FOOTER_T.en;
  const [siteInfo, setSiteInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSiteInfo().then((d) => {
      if (!cancelled) setSiteInfo(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const phones = useMemo(() => {
    const fromFooter = (siteInfo?.footer?.contacts?.phones || []).filter(Boolean);
    if (fromFooter.length) return fromFooter;
    return ["+359 875 313 158", "+359 897 884 804"];
  }, [siteInfo]);

  const addresses = useMemo(() => {
    const langKey = lang === "ru" ? "ru" : "en";
    const langList = (siteInfo?.footer?.contacts?.[`addresses_${langKey}`] || []).filter(Boolean);
    if (langList.length) return langList;
    if (langKey === "ru") {
      return ["Беларусь, Минск — по записи", "Россия, Москва — по записи"];
    }
    const list = (siteInfo?.footer?.contacts?.addresses || []).filter(Boolean);
    if (list.length) return list;
    return ["Belarus, Minsk — by appointment", "Russia, Moscow — by appointment"];
  }, [siteInfo, lang]);

  // Working hours — policy is now "available 24 / 7, Mon – Sun" so we
  // intentionally bypass any admin-set working_hours override and always
  // use the localized T.defaultHours string. Admin will need to set
  // working_hours_<lang> explicitly if a different value is ever required
  // (and the value will then take precedence).
  const workingHours = (() => {
    const langKey = lang === "ru" ? "ru" : "en";
    const localized = siteInfo?.footer?.contacts?.[`working_hours_${langKey}`];
    if (localized) return localized;
    return T.defaultHours;
  })();

  const viber = siteInfo?.footer?.viber_community || {};
  const telegramSocial = getSocial(siteInfo, "telegram");
  const telegramCommunity = {
    url: telegramSocial.url || viber.url || SOCIAL_DEFAULTS.telegram.url,
    enabled: telegramSocial.enabled !== false && viber.enabled !== false,
  };
  const showTelegram = telegramCommunity.enabled !== false && telegramCommunity.url;
  const telegramLabel =
    (lang === "ru"
      ? telegramSocial.label_ru || telegramSocial.label_en
      : telegramSocial.label_en || telegramSocial.label_ru) || T.telegramLabel;

  const socialUrl = (k) => {
    const raw = siteInfo?.footer?.socials?.[k];
    if (raw && typeof raw === "object" && raw.enabled === false) return "";
    if (typeof raw === "string" && raw) return raw;
    if (raw && raw.url) return raw.url;
    return SOCIAL_DEFAULTS[k]?.url || "";
  };

  const registrationAddress = (() => {
    const langKey = lang === "ru" ? "ru" : "en";
    const localized = siteInfo?.footer?.contacts?.[`registration_address_${langKey}`];
    if (localized) return localized;
    if (langKey === "ru") return T.defaultRegistrationAddress;
    return siteInfo?.footer?.contacts?.registration_address || T.defaultRegistrationAddress;
  })();

  /* Social entries — only render those with a URL configured. */
  const socials = [
    { k: "instagram", icon: "/figma/ri-instagram-line.svg", label: "Instagram" },
    { k: "facebook", icon: "/figma/ic-twotone-facebook.svg", label: "Facebook" },
    { k: "telegram", icon: "/figma/ic-round-telegram.svg", label: "Telegram" },
    { k: "whatsapp", icon: "/figma/ic-whatsapp.svg", label: "WhatsApp" },
    { k: "avito", icon: "/figma/ic-avito.svg", label: "Avito" },
  ].filter((s) => socialUrl(s.k));

  return (
    <section className={[styles.footer, className].join(" ")}>
      {/* ── (1) TOP HERO BAND ── REMOVED 2026-06 ─────────────────────────
       *  The cross-page "ПОГОВОРИМ — Привезём авто мечты с аукциона до
       *  ключей." banner referenced auction logic that no longer matches
       *  the admin-curated catalog. The CTA has been replaced by
       *  page-specific lead bands (see LeadCtaBand on Calculator /
       *  Contacts / SingleCarPage) so each surface owns its own call to
       *  action instead of relying on a sweeping footer block.
       *  Translation strings (heroEyebrow/heroTitle/...) remain in
       *  FOOTER_T for back-compat with any external code, but are no
       *  longer rendered here.
       * ───────────────────────────────────────────────────────────── */}

      {/* ── (2) MAIN GRID — 4 columns ───────────────────────────────────── */}
      <div className={styles.grid}>
        {/* Col 1 — Brand */}
        <div className={styles.col}>
          <div className={styles.colHead}>
            <span className={styles.colAccent} />
            <h3 className={styles.colTitle}>{T.colBrandTitle}</h3>
          </div>
          <img
            className={styles.brandLogo}
            sizes="100vw"
            alt="DM Auto"
            src="/figma/dm-auto-logo.png"
          />
          <p className={styles.brandTag}>{T.colBrandTag}</p>
          <div className={styles.brandHours}>
            <span className={styles.brandHoursLabel}>{T.workingHoursLabel}</span>
            <span className={styles.brandHoursVal}>{workingHours}</span>
          </div>
        </div>

        {/* Col 2 — Explore */}
        <div className={styles.col}>
          <div className={styles.colHead}>
            <span className={styles.colAccent} />
            <h3 className={styles.colTitle}>{T.colExploreTitle}</h3>
          </div>
          <nav className={styles.navList}>
            {/* 2026-06 pivot: catalog link removed from explore column. */}
            <Link to="/calculator" className={styles.navItem} data-testid="footer-nav-calculator">
              <span>{T.menu.calculator}</span>
              <span className={styles.navArrow} aria-hidden="true">↗</span>
            </Link>
            <Link to="/about" className={styles.navItem} data-testid="footer-nav-about">
              <span>{T.menu.about}</span>
              <span className={styles.navArrow} aria-hidden="true">↗</span>
            </Link>
            <Link to="/blog" className={styles.navItem} data-testid="footer-nav-blog">
              <span>{T.menu.blog}</span>
              <span className={styles.navArrow} aria-hidden="true">↗</span>
            </Link>
          </nav>
        </div>

        {/* Col 3 — Contact */}
        <div className={styles.col}>
          <div className={styles.colHead}>
            <span className={styles.colAccent} />
            <h3 className={styles.colTitle}>{T.colContactTitle}</h3>
          </div>
          <div className={styles.contactGroup}>
            <span className={styles.contactLabel}>{T.phoneLabel}</span>
            <div className={styles.phoneList}>
              {phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p.replace(/\s+/g, "")}`}
                  className={styles.phoneLink}
                  data-testid={`footer-phone-${p.replace(/\D/g, "")}`}
                >
                  {p}
                </a>
              ))}
            </div>
          </div>
          <div className={styles.contactGroup}>
            <span className={styles.contactLabel}>{T.addressLabel}</span>
            <ul className={styles.addressList}>
              {addresses.map((a, i) => (
                <li key={`${a}-${i}`}>{a}</li>
              ))}
            </ul>
          </div>
          <div
            className={styles.contactGroup}
            data-testid="footer-registration-address"
          >
            <span className={styles.contactLabel}>{T.registrationLabel}</span>
            <div className={styles.registrationVal}>{registrationAddress}</div>
          </div>
        </div>

        {/* Col 4 — Stay Connected */}
        <div className={styles.col}>
          <div className={styles.colHead}>
            <span className={styles.colAccent} />
            <h3 className={styles.colTitle}>{T.colTouchTitle}</h3>
          </div>

          {showTelegram && (
            <a
              href={telegramCommunity.url}
              aria-label="Telegram channel"
              target="_blank"
              rel="noreferrer noopener"
              data-testid="footer-telegram-community-link"
              className={styles.telegramCard}
            >
              <span className={`${styles.cornerTick} ${styles.cornerTL}`} aria-hidden="true" />
              <span className={`${styles.cornerTick} ${styles.cornerBR}`} aria-hidden="true" />
              <div className={styles.telegramBody}>
                <img
                  src="/figma/ic-round-telegram.svg"
                  className={styles.telegramIcon}
                  width={36}
                  height={36}
                  alt=""
                />
                <span className={styles.telegramLabel}>{telegramLabel}</span>
              </div>
              <span className={styles.telegramArrow} aria-hidden="true">→</span>
            </a>
          )}

          {socials.length > 0 && (
            <div className={styles.socialBlock}>
              <span className={styles.contactLabel}>{T.socialLabel}</span>
              <div className={styles.socialRow}>
                {socials.map((s) => (
                  <a
                    key={s.k}
                    href={socialUrl(s.k)}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    data-testid={`footer-social-${s.k}`}
                    className={styles.socialChip}
                  >
                    <img src={s.icon} alt="" className={styles.socialIcon} width={22} height={22} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── (3) BRAND STATEMENT BAND ────────────────────────────────────── */}
      <div className={styles.brandBand}>
        <div className={styles.brandBandTop}>
          <span className={styles.brandBandEyebrow}>{T.bandEyebrow}</span>
          <button
            type="button"
            className={styles.backToTop}
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            data-testid="footer-back-to-top"
          >
            <span>{T.backToTop}</span>
            <span className={styles.backToTopArrow} aria-hidden="true">↑</span>
          </button>
        </div>

        <div className={styles.brandBandCore}>
          {/* Wordmark — split typographic composition:
              · "DM" — solid navy filled letters
              · centre divider — a stylized amber notch + circle
              · "AUTO" — outline-stroke navy letters
              An "EST. 2020" pill floats above as decorative anchor.
              Overall vertical footprint is preserved (≈ 238 px) so the
              brand band keeps its current height and width. */}
          <div className={styles.wordmark} aria-hidden="true">
            <span className={styles.wordmarkChip}>EST. 2020</span>
            <div className={styles.wordmarkRow}>
              <span className={styles.wordmarkSolid}>DM</span>
              <span className={styles.wordmarkDivider} aria-hidden="true">
                <span className={styles.wordmarkDividerBar} />
                <span className={styles.wordmarkDividerDot} />
                <span className={styles.wordmarkDividerBar} />
              </span>
              <span className={styles.wordmarkOutline}>AUTO</span>
            </div>
          </div>
          <span className={styles.brandBandTag}>{T.bandTag}</span>
        </div>
      </div>

      {/* ── (4) BOTTOM LEGAL STRIP — copyright + policy links only ──────── */}
      <footer className={styles.legal}>
        <div className={styles.legalLeft}>
          <img
            className={styles.legalCopyIcon}
            width={18}
            height={18}
            alt=""
            src="/figma/ant-design-copyright-circle-outlined.svg"
          />
          <span className={styles.legalCopy}>2026. {T.copyright}</span>
        </div>

        <div className={styles.legalRight}>
          <button
            type="button"
            className={`${styles.legalItem} ${styles.legalBtn}`}
            onClick={() => openPolicy("conditions")}
            data-testid="footer-policy-conditions"
          >
            {T.conditions}
          </button>
          <span className={styles.legalDot} aria-hidden="true">·</span>
          <button
            type="button"
            className={`${styles.legalItem} ${styles.legalBtn}`}
            onClick={() => openPolicy("privacy")}
            data-testid="footer-policy-privacy"
          >
            {T.privacy}
          </button>
          <span className={styles.legalDot} aria-hidden="true">·</span>
          <button
            type="button"
            className={`${styles.legalItem} ${styles.legalBtn}`}
            onClick={() => openPolicy("cookies")}
            data-testid="footer-policy-cookies"
          >
            {T.cookies}
          </button>
        </div>
      </footer>
    </section>
  );
};

export default Footer1;
