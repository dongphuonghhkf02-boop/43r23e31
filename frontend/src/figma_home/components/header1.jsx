import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import CONTACTS1 from "./c-o-n-t-a-c-t-s1";
import FrameComponent17 from "./frame-component17";
import { useCustomerAuth } from "../../pages/public/CustomerAuth";
import { useLang } from "../../i18n";
import CarSearchDropdown from "../../components/public/CarSearchDropdown";
import { useGetInTouch } from "../../components/public/GetInTouchModal";
import styles from "./header1.module.css";

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

/**
 * DM Auto top header — TWO-TIER layout (June 2026 redesign).
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │  📞 phone1  ·  📞 phone2   ·   ⌚ working hours          🌐 ENG ▾ 👤 │  ← utility row
 *   ├──────────────────────────────────────────────────────────────────┤
 *   │  LOGO              CATALOG · CALCULATOR · ABOUT · CONTACTS              🔍 search        [CONTACT US] │  ← main row
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Why two tiers
 * - Phones, language and profile are "utility" actions → they live in a
 *   thin row on top so the main row can focus on the primary discovery
 *   surface (logo, navigation, search, CTA).
 * - Visually different from the legacy single-row hero so the DM Auto site
 *   has its own identity.
 * - All elements from the old header are preserved 1:1 (CATALOG, CALCULATOR,
 *   ABOUT, CONTACTS, VIN search, both phones, language switcher, profile
 *   icon, CONTACT US CTA).
 */
const Header1 = ({ className = "" }) => {
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  const { lang } = useLang();
  const { open: openGetInTouch } = useGetInTouch();
  const [siteInfo, setSiteInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSiteInfo().then((d) => {
      if (!cancelled) setSiteInfo(d);
    });
    return () => { cancelled = true; };
  }, []);

  // Admin-managed phones (with sensible default)
  const phones = useMemo(() => {
    const fromHeader = (siteInfo?.header?.phones || []).filter(Boolean);
    if (fromHeader.length) return fromHeader;
    const fromFooter = (siteInfo?.footer?.contacts?.phones || []).filter(Boolean);
    if (fromFooter.length) return fromFooter;
    return ["+359 875 313 158", "+359 897 884 804"];
  }, [siteInfo]);

  // Working hours — policy is now "available 24 / 7, Mon – Sun" so we
  // bypass any admin-set working_hours override and always show the
  // localized 24/7 string. Admin can still force a value via the explicit
  // `working_hours_<lang>` key if it ever needs to be different.
  const workingHours = useMemo(() => {
    const langKey = lang === "ru" ? "ru" : "en";
    const localized = siteInfo?.footer?.contacts?.[`working_hours_${langKey}`];
    if (localized) return localized;
    return lang === "ru" ? "Пн–Вс · 24/7" : "Mon–Sun · 24/7";
  }, [siteInfo, lang]);

  // Admin-managed email / social contacts shown on the utility row right side.
  const contactEmail = useMemo(() => (
    siteInfo?.footer?.contacts?.email
      || siteInfo?.header?.email
      || "info@dm-auto.bg"
  ), [siteInfo]);
  const socialLinks = useMemo(() => {
    const s = siteInfo?.footer?.social || siteInfo?.header?.social || {};
    return {
      telegram: s.telegram || "https://t.me/dmauto",
      whatsapp: s.whatsapp || `https://wa.me/${(phones[0] || "+359875313158").replace(/[^0-9]/g, "")}`,
      instagram: s.instagram || "https://instagram.com/dmauto",
    };
  }, [siteInfo, phones]);

  const navItems = useMemo(() => {
    const isRu = lang === "ru";
    // 2026-06 pivot: "Каталог" menu item removed — the home page hosts the
    // curated picks directly. Header now exposes only Calculator / About /
    // Contacts. The /catalog route still resolves (Navigate → "/") so old
    // links don't 404.
    return isRu
      ? [
          { key: "calculator", label: "КАЛЬКУЛЯТОР", path: "/calculator", cONTACTSWidth: "126px", cONTACTSWidth1: "128px" },
          { key: "about",      label: "О НАС",       path: "/about",      cONTACTSWidth: "60px",  cONTACTSWidth1: "62px"  },
          { key: "contacts",   label: "КОНТАКТЫ",    path: "/contacts",   cONTACTSWidth: "100px", cONTACTSWidth1: "102px" },
        ]
      : [
          { key: "calculator", label: "CALCULATOR", path: "/calculator", cONTACTSWidth: "100px", cONTACTSWidth1: "110px" },
          { key: "about",      label: "ABOUT US",   path: "/about",      cONTACTSWidth: "82px",  cONTACTSWidth1: "84px"  },
          { key: "contacts",   label: "CONTACTS",   path: "/contacts",   cONTACTSWidth: "82px",  cONTACTSWidth1: "91px"  },
        ];
  }, [lang]);

  const [vinQuery, setVinQuery] = useState("");
  const [vinOpen, setVinOpen] = useState(false);

  const handleVinSubmit = (e) => {
    e.preventDefault();
    // Submit no longer routes to legacy /vin/<query>. The CarSearchDropdown
    // handles navigation via the curated /api/public/cars/search endpoint.
    // If the user hits Enter without picking a suggestion, just open the
    // panel so they can see the empty-state CTA to talk to a manager.
    if ((vinQuery || "").trim().length >= 2) setVinOpen(true);
  };

  const handleProfileClick = () => {
    let sess = null;
    try { sess = JSON.parse(localStorage.getItem("customer_session") || "null"); } catch { /* ignore */ }
    const id = customer?.customerId || sess?.customerId;
    navigate(id ? `/cabinet/${id}` : "/cabinet/login");
  };

  const handleContactClick = () => {
    if (typeof openGetInTouch === "function") {
      openGetInTouch();
      return;
    }
    navigate("/contacts#reach-out");
  };

  const isAuthed = !!(customer?.customerId || (() => {
    try { return JSON.parse(localStorage.getItem("customer_session") || "null")?.customerId; }
    catch { return null; }
  })());
  const customerName = customer?.name || customer?.email || "";

  return (
    <header className={[styles.header, className].join(" ")}>
      {/* ═══════════ TIER 1 — UTILITY ROW (dark navy strip) ═══════════ */}
      <div className={styles.utilityRow}>
        <div className={styles.utilityLeft}>
          {phones[0] && (
            <a
              href={`tel:${(phones[0] || "").replace(/\s+/g, "")}`}
              className={styles.utilityPhone}
              data-testid="utility-phone-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{phones[0]}</span>
            </a>
          )}
          {phones[1] && (
            <>
              <span className={styles.utilityDivider} aria-hidden="true" />
              <a
                href={`tel:${(phones[1] || "").replace(/\s+/g, "")}`}
                className={styles.utilityPhone}
                data-testid="utility-phone-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.91.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{phones[1]}</span>
              </a>
            </>
          )}
          <span className={styles.utilityDivider} aria-hidden="true" />
          <span className={styles.utilityHours} data-testid="utility-hours">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {workingHours}
          </span>
        </div>

        <div className={styles.utilityRight}>
          <a
            href={`mailto:${contactEmail}`}
            className={styles.utilityEmail}
            data-testid="utility-email"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="m2 8 10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{contactEmail}</span>
          </a>
          <span className={styles.utilityDivider} aria-hidden="true" />
          <div className={styles.utilitySocials}>
            <a
              href={socialLinks.telegram}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              data-testid="utility-telegram"
              title="Telegram"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21.94 4.34a1 1 0 0 0-1.07-.18L3.13 11.21a1 1 0 0 0 .04 1.87l4.4 1.46 2.06 6.18a1 1 0 0 0 1.66.36l2.8-2.74 4.4 3.21a1 1 0 0 0 1.57-.6l3-15a1 1 0 0 0-.12-.61ZM10.6 14.41l-.32 4.13-1.46-4.38 8.2-7.05-6.42 7.3Z"/>
              </svg>
            </a>
            <a
              href={socialLinks.whatsapp}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              data-testid="utility-whatsapp"
              title="WhatsApp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91a9.85 9.85 0 0 0-2.91-7.01Zm-7.01 15.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c-.01 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.04-.38-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.48-.01-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.74 2.65 4.21 3.72.59.25 1.04.41 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z"/>
              </svg>
            </a>
            <a
              href={socialLinks.instagram}
              className={styles.socialLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              data-testid="utility-instagram"
              title="Instagram"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════ TIER 2 — MAIN ROW ═══════════ */}
      <div className={styles.mainRow}>
        <Link to="/" aria-label="DM Auto — Home" className={styles.logoLink}>
          <img
            className={styles.bibiLogo021Icon}
            loading="lazy"
            height={45.8}
            sizes="100vw"
            alt="DM Auto"
            src="/figma/dm-auto-logo.png"
            style={{ height: 45.8, width: 'auto' }}
          />
        </Link>

        <nav className={styles.mainNav} aria-label="Primary">
          {navItems.map((item) => (
            <CONTACTS1
              key={item.key}
              cONTACTS={item.label}
              cONTACTSWidth={item.cONTACTSWidth}
              cONTACTSWidth1={item.cONTACTSWidth1}
              to={item.path}
              navKey={item.key}
            />
          ))}
        </nav>

        <div className={styles.mainRight}>
          <form
            className={styles.searchInput}
            onSubmit={handleVinSubmit}
            role="search"
            data-testid="header-vin-search"
            style={{ position: "relative" }}
          >
            <div className={styles.searchInputChild} />
            <div className={styles.boxiconssearchParent}>
              <img
                className={styles.boxiconssearch}
                width={20}
                height={20}
                sizes="100vw"
                alt=""
                src="/figma/boxicons-search.svg"
                onClick={handleVinSubmit}
                style={{ cursor: "pointer" }}
              />
              <input
                className={styles.searchByVin}
                placeholder={lang === "ru" ? "Поиск авто, например Audi" : "Search e.g. Audi"}
                type="text"
                value={vinQuery}
                onChange={(e) => { setVinQuery(e.target.value); setVinOpen(true); }}
                onFocus={() => setVinOpen(true)}
                autoComplete="off"
                data-testid="header-car-search-input"
              />
            </div>
            <CarSearchDropdown
              query={vinQuery}
              open={vinOpen}
              onClose={() => setVinOpen(false)}
              align="left"
              variant="dark"
            />
          </form>

          <FrameComponent17
            variant="utility"
            onProfileClick={handleProfileClick}
            isAuthed={isAuthed}
            customerName={customerName}
          />

          <FrameComponent17
            variant="cta"
            onContactClick={handleContactClick}
          />
        </div>
      </div>
    </header>
  );
};

export default Header1;
