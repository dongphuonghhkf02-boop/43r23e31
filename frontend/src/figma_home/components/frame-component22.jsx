import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CarSearchDropdown from "../../components/public/CarSearchDropdown";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import { useLang } from "../../i18n";
import styles from "./frame-component22.module.css";

/**
 * "Calculate yourself" block — REDESIGN (June 2026).
 *
 * Goal: completely recomposed vs. the previous Figma frame (centred title +
 * Ford-pickup square photo on the LEFT, form on the RIGHT). The new layout:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ thin navy outer ring (24px)                                  │
 *   │ ┌──────────────────────────────────────────────────────────┐ │
 *   │ │ cream inner card                                          │ │
 *   │ │                                                            │ │
 *   │ │ ┌────────────────────┐  ┌────────────────────────────────┐│ │
 *   │ │ │ FORM (left, 55%)   │  │ CAR PHOTO (right, 45%)         ││ │
 *   │ │ │  • eyebrow chip    │  │  • luxury sedan, breaks out    ││ │
 *   │ │ │  • title (left)    │  │    of card with rounded corners││ │
 *   │ │ │  • subtitle        │  │  • floating amber "ALL-IN €"   ││ │
 *   │ │ │  • VIN input       │  │    badge in top-right          ││ │
 *   │ │ │  • [CALC] [Catalog]│  │  • subtle corner glyphs        ││ │
 *   │ │ │  • trust badges    │  │                                 ││ │
 *   │ │ └────────────────────┘  └────────────────────────────────┘│ │
 *   │ └──────────────────────────────────────────────────────────┘ │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Behavioural contract is UNCHANGED:
 *   - empty submit → /calculator (the calculator page)
 *   - non-empty submit → /vin/<query>
 *   - VinSearchDropdown typeahead identical to header
 */
const FrameComponent22 = ({ className = "" }) => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRu = lang === "ru";
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const T = isRu
    ? {
        eyebrow: "ИТОГ В ЕВРО",
        line1: "Точная цена",
        line2: "за минуту",
        subtitle: "Расскажите модель — менеджер подберёт варианты и посчитает доставку, таможню и регистрацию под ключ.",
        sourceLabel: "Из Европы",
        searchPlaceholder: "Например, Audi A6",
        searchAria: "Поиск по марке и модели",
        calculate: "Рассчитать",
        allCatalog: "Весь каталог",
        trust1: "Цена под ключ",
        trust2: "Без скрытых комиссий",
        trust3: "Расчёт за минуту",
        badge: "ВКЛ. ВСЕ СБОРЫ",
        carAlt: "Mercedes-Benz S-Class",
      }
    : {
        eyebrow: "ALL-IN EUR",
        line1: "Exact price",
        line2: "in a minute",
        subtitle: "Tell us the model — our manager will pick options and quote turnkey transport, customs and registration.",
        sourceLabel: "From Europe",
        searchPlaceholder: "e.g. Audi A6",
        searchAria: "Search by make and model",
        calculate: "Calculate",
        allCatalog: "Full catalog",
        trust1: "Turnkey price",
        trust2: "No hidden fees",
        trust3: "1-minute estimate",
        badge: "INCLUDES ALL FEES",
        carAlt: "Mercedes-Benz S-Class",
      };

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = q.trim();
    if (!v) {
      navigate("/calculator");
      return;
    }
    // Keep the dropdown open so the user can pick a curated match or
    // hit the "contact a manager" CTA.
    setOpen(true);
  };

  const [gridRef, gridInView] = useInView();

  // Reliable luxury-sedan photo (Unsplash CDN) — falls back to the legacy
  // figma asset if the network image fails.
  const PRIMARY_IMG = "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80";
  const FALLBACK_IMG = "/figma/image-93@2x.webp";

  return (
    <section className={[styles.rectangleParent, className].join(" ")} data-testid="calculate-yourself">
      <div className={styles.calculate}>
        <div
          ref={gridRef}
          className={`${styles.calcGrid} ${gridInView ? "is-visible" : ""}`}
        >
          {/* ────────── LEFT — copy + form ────────── */}
          <div
            className={styles.calcLeft}
            data-stagger="80"
            style={{ "--stagger-step": "120ms" }}
          >
            <span className={styles.eyebrow} data-testid="calc-eyebrow">
              <span className={styles.eyebrowDot} aria-hidden="true" />
              {T.eyebrow}
            </span>

            <h2 className={styles.calculateACar}>
              <AnimatedHeading
                as="span"
                className={styles.calculateLine1}
                text={T.line1}
              />
              <AnimatedHeading
                as="span"
                className={styles.withAPrice}
                text={T.line2}
                baseDelay={T.line1.replace(/\s/g, "").length * 28}
              />
            </h2>

            <p className={styles.subtitle}>
              <span className={styles.sourcePill}>{T.sourceLabel}</span>
              <span>{T.subtitle}</span>
            </p>

            <form
              className={styles.searchForm}
              onSubmit={handleSubmit}
              role="search"
              data-testid="welcome-vin-search"
            >
              <div className={styles.inputWrapper} style={{ position: "relative" }}>
                <img
                  className={styles.boxiconssearch}
                  alt=""
                  src="/figma/boxicons-search.svg"
                />
                <input
                  className={styles.searchByVin}
                  placeholder={T.searchPlaceholder}
                  type="text"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setOpen(true); }}
                  onFocus={() => setOpen(true)}
                  autoComplete="off"
                  aria-label={T.searchAria}
                  data-testid="welcome-vin-input"
                />
                <CarSearchDropdown
                  query={q}
                  open={open}
                  onClose={() => setOpen(false)}
                  align="left"
                  variant="dark"
                />
              </div>

              <div className={styles.ctaRow}>
                <button type="submit" className={styles.calcCta} data-testid="welcome-vin-submit">
                  {T.calculate}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <Link to="/catalog" className={styles.allCatalog} data-testid="welcome-all-catalog">
                  {T.allCatalog}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </div>
            </form>

            <ul className={styles.trustList} aria-label="benefits">
              {[T.trust1, T.trust2, T.trust3].map((tt) => (
                <li key={tt} className={styles.trustItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{tt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ────────── RIGHT — car photo + floating badge ────────── */}
          <div className={`${styles.imageBox} reveal reveal--fade-up`} style={{ animationDelay: "0ms" }}>
            <div className={styles.imageInner}>
              <img
                className={styles.image93Icon}
                loading="lazy"
                alt={T.carAlt}
                src={PRIMARY_IMG}
                onError={(e) => {
                  if (!e.currentTarget.dataset.fallback) {
                    e.currentTarget.dataset.fallback = "1";
                    e.currentTarget.src = FALLBACK_IMG;
                  }
                }}
              />
              <span className={styles.imageGlow} aria-hidden="true" />
              {/* Decorative corner glyphs — quiet brand accent */}
              <span className={`${styles.cornerTick} ${styles.cornerTickTL}`} aria-hidden="true" />
              <span className={`${styles.cornerTick} ${styles.cornerTickBR}`} aria-hidden="true" />

              {/* Floating amber "ALL-IN" badge */}
              <div className={styles.priceBadge} data-testid="calc-price-badge">
                <span className={styles.priceBadgeLabel}>{T.badge}</span>
                <span className={styles.priceBadgeValue}>€ <span className={styles.priceBadgeDots}>•••</span></span>
                <span className={styles.priceBadgeHint}>{isRu ? "Введите VIN →" : "Enter VIN →"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrameComponent22;
