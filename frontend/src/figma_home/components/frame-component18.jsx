import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import styles from "./frame-component18.module.css";
import { CAR_BRANDS, MODELS_BY_BRAND, GENERIC_MODELS, YEARS } from "../../data/cars";
import { useLang } from "../../i18n";
import { useGetInTouch } from "../../components/public/GetInTouchModal";
import { renderKpiWithRolling } from "../../components/RollingNumber";
import SplitText from "../../components/SplitText";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Original hardcoded copy + image — kept verbatim as the visual fallback
// so the site looks IDENTICAL to the Figma design until the admin
// changes anything in /admin/info → Hero Banner.
const ORIGINAL_HERO = {
  enabled: true,
  eyebrow_en: "europe",
  eyebrow_ru: "Европа",
  title_line1_en: "From Europe.",
  title_line1_ru: "Из Европы.",
  title_line2_en: "To your",
  title_line2_ru: "Прямо к вашему",
  title_line3_en: "driveway.",
  title_line3_ru: "порогу.",
  kpi1_en: "/ Mobile.de · BCA · Autobid",
  kpi1_ru: "/ Mobile.de · BCA · Autobid",
  kpi2_en: "/ MILD logistics across EU",
  kpi2_ru: "/ Логистика MILD по ЕС",
  kpi3_en: "/ Transparent EUR pricing",
  kpi3_ru: "/ Прозрачные цены в евро",
  kpi4_en: "/ Delivery across Russia & Belarus",
  kpi4_ru: "/ Доставка по России и Беларуси",
  image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2400&q=72",
};

// Resolve relative `/api/static/...` paths to an absolute URL
const resolveImageUrl = (raw) => {
  if (!raw) return ORIGINAL_HERO.image_url;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/api/")) return `${API_URL}${raw}`;
  return raw; // relative `/figma/...` etc — served by the SPA itself
};

const Dropdown = ({ label, value, options, onSelect, isOpen, onToggle, searchable = true }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      // small timeout so DOM mounts before we focus
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  /* `options` may be:
     • an array of strings (legacy)                          → no count, always available
     • an array of `{ name, count, available }` objects     → real DB-backed
     We normalise to the object shape so the render code stays simple. */
  const normalisedOptions = useMemo(() => (
    options.map((o) =>
      typeof o === "string"
        ? { name: o, count: null, available: true, isAnyOption: true }
        : o
    )
  ), [options]);

  const filtered = useMemo(() => {
    if (!query.trim()) return normalisedOptions;
    const q = query.trim().toLowerCase();
    return normalisedOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [query, normalisedOptions]);

  // i18n inline for the search placeholder + empty message
  const { lang } = useLang();
  const isRu = lang === "ru";
  const searchPlaceholder = isRu
    ? `Поиск ${label.toLowerCase()}...`
    : `Search ${label.toLowerCase()}...`;
  const noMatches = isRu ? "Нет совпадений" : "No matches";

  return (
    <div className={styles.filterCellWrap}>
      <button
        type="button"
        className={`${styles.filterCell} ${isOpen ? styles.filterCellOpen : ""}`}
        onClick={onToggle}
      >
        <span className={styles.filterLabel}>{value || label}</span>
        <img
          className={`${styles.filterCaret} ${isOpen ? styles.filterCaretOpen : ""}`}
          alt=""
          src="/figma/lsicon-down-filled.svg"
        />
      </button>
      {isOpen && (
        <div className={styles.dropdownPanel} role="listbox">
          {searchable && (
            <div className={styles.dropdownSearchBox}>
              <img
                className={styles.dropdownSearchIcon}
                src="/figma/boxicons-search.svg"
                alt=""
              />
              <input
                ref={inputRef}
                className={styles.dropdownSearchInput}
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <div className={styles.dropdownList}>
            {filtered.length === 0 ? (
              <div className={styles.dropdownEmpty}>{noMatches}</div>
            ) : (
              filtered.map((opt) => {
                // "Any …" option is always treated as available.
                const isDimmed = !opt.isAnyOption && opt.available === false;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    className={[
                      styles.dropdownItem,
                      value === opt.name ? styles.dropdownItemActive : "",
                      isDimmed ? styles.dropdownItemUnavailable : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => onSelect(opt.name)}
                    title={isDimmed ? (isRu ? "Нет доступных автомобилей" : "No cars currently available") : undefined}
                  >
                    {opt.name}
                    {opt.count != null && opt.count > 0 && (
                      <span className={styles.dropdownItemCount}>({opt.count})</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FrameComponent18 = ({ className = "" }) => {
  const { lang } = useLang();
  const isRu = lang === "ru";
  const { open: openGetInTouch } = useGetInTouch();

  const [openMenu, setOpenMenu] = useState(null);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [hero, setHero] = useState(ORIGINAL_HERO);
  const filterRef = useRef(null);

  // Real catalog data — distinct brands/models with live availability counts.
  // Falls back to the static `CAR_BRANDS`/`MODELS_BY_BRAND` lists if the
  // API is unreachable, so the dropdowns are never empty.
  const [brandsData, setBrandsData] = useState(null); // [{name,count,available}] | null
  const [modelsData, setModelsData] = useState(null); // [{name,count,available}] | null

  // Pull admin-configured hero copy + image (silently falls back to ORIGINAL_HERO)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/site-info`);
        if (cancelled) return;
        const h = r?.data?.hero;
        if (h && typeof h === "object") {
          setHero({ ...ORIGINAL_HERO, ...h });
        }
      } catch {
        /* keep defaults */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load real brand availability from the catalog backend (same endpoint
  // the /catalog Brand filter uses, so the homepage and the catalog see
  // the exact same data set).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/public/brands`);
        if (cancelled) return;
        if (Array.isArray(r?.data?.data)) {
          setBrandsData(r.data.data);
        }
      } catch {
        /* keep null → fallback to static list */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load models for the currently picked brand. Empty brand → no models.
  useEffect(() => {
    let cancelled = false;
    if (!brand) {
      setModelsData(null);
      return undefined;
    }
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/public/models`, {
          params: { brand },
        });
        if (cancelled) return;
        if (Array.isArray(r?.data?.data)) {
          setModelsData(r.data.data);
        }
      } catch {
        setModelsData(null);
      }
    })();
    return () => { cancelled = true; };
  }, [brand]);

  // Pick a field with graceful fallback: current lang → other lang → original
  const pick = (key) => {
    const cur = hero[`${key}${isRu ? "_ru" : "_en"}`];
    const alt = hero[`${key}${isRu ? "_en" : "_ru"}`];
    return (cur && cur.trim()) || (alt && alt.trim()) || ORIGINAL_HERO[`${key}_en`] || "";
  };

  const eyebrow = pick("eyebrow");
  const t1 = pick("title_line1");
  const t2 = pick("title_line2");
  const t3 = pick("title_line3");
  const k1 = pick("kpi1");
  const k2 = pick("kpi2");
  const k3 = pick("kpi3");
  const k4 = pick("kpi4");
  const heroImage = resolveImageUrl(hero.image_url);

  useEffect(() => {
    const onDocClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onEsc = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const toggle = (name) => setOpenMenu((cur) => (cur === name ? null : name));

  // ── Brand options: ALWAYS show the full static `CAR_BRANDS` list so the
  //    shopper can express interest in any brand — even ones we haven't
  //    sourced yet (lead-capture flow). When the catalog has live counts
  //    (via /api/public/brands), we overlay the count onto the matching
  //    static entry. Brands present in the DB but not in our static list
  //    are appended at the end so we never hide real inventory.
  const brandOptions = useMemo(() => {
    const anyBrand = { name: isRu ? "Все бренды" : "Any Brand", isAnyOption: true, available: true, count: null };
    const countByName = new Map();
    if (brandsData && brandsData.length) {
      brandsData.forEach((b) => {
        if (b && b.name) countByName.set(b.name.toLowerCase(), b);
      });
    }
    const staticEntries = CAR_BRANDS.map((n) => {
      const hit = countByName.get(n.toLowerCase());
      // Always available — the picker drives lead capture, not a live
      // catalog filter, so we never hide / dim brands the admin hasn't
      // sourced yet. The DB count, if any, is shown as a badge.
      return hit
        ? { name: n, available: true, count: hit.count ?? null }
        : { name: n, available: true, count: null };
    });
    // Surface DB-only brands (e.g. niche makes the admin added) at the end.
    const known = new Set(CAR_BRANDS.map((n) => n.toLowerCase()));
    const extras = (brandsData || [])
      .filter((b) => b && b.name && !known.has(b.name.toLowerCase()))
      .map((b) => ({ name: b.name, available: true, count: b.count ?? null }));
    return [anyBrand, ...staticEntries, ...extras];
  }, [brandsData, isRu]);

  // ── Model options: ALWAYS show the full model list for the picked brand
  //    from `MODELS_BY_BRAND`. If no brand is picked, fall back to a
  //    generic list. Live counts (from /api/public/models?brand=…) are
  //    overlaid on matching entries; DB-only models are appended.
  const modelOptions = useMemo(() => {
    const anyModel = { name: isRu ? "Все модели" : "Any Model", isAnyOption: true, available: true, count: null };
    const countByName = new Map();
    if (modelsData && modelsData.length) {
      modelsData.forEach((m) => {
        if (m && m.name) countByName.set(m.name.toLowerCase(), m);
      });
    }
    const staticList = (brand && MODELS_BY_BRAND[brand]) ? MODELS_BY_BRAND[brand] : GENERIC_MODELS;
    const staticEntries = staticList.map((n) => {
      const hit = countByName.get(n.toLowerCase());
      return hit
        ? { name: n, available: true, count: hit.count ?? null }
        : { name: n, available: true, count: null };
    });
    const known = new Set(staticList.map((n) => n.toLowerCase()));
    const extras = (modelsData || [])
      .filter((m) => m && m.name && !known.has(m.name.toLowerCase()))
      .map((m) => ({ name: m.name, available: true, count: m.count ?? null }));
    return [anyModel, ...staticEntries, ...extras];
  }, [modelsData, brand, isRu]);

  // ── Year options: the catalog has no per-year availability endpoint, so
  //    we keep the static list (last 30 years) and treat all as available.
  const yearOptions = useMemo(() => {
    const anyYear = { name: isRu ? "Все годы" : "Any Year", isAnyOption: true, available: true, count: null };
    return [anyYear, ...YEARS.map((y) => ({ name: String(y), available: true, count: null }))];
  }, [isRu]);

  // SELECT A CAR — since the public catalog has been retired, the hero
  // Brand / Model / Year picker now serves as the entry point to the
  // lead-capture flow. We pre-build a human-readable preference string
  // ("Audi · A6 · 2022") and open the GetInTouch modal so the user only
  // has to fill in their contact details — no need to re-type the car.
  // The lead reaches the admin via POST /api/public/lead-requests with
  // source="home_hero_select".
  const onFind = () => {
    const parts = [];
    if (brand) parts.push(brand);
    const modelClean =
      model && model !== "Any Model" && model !== "Все модели" ? model : "";
    if (modelClean) parts.push(modelClean);
    const yearClean =
      year && year !== "Any Year" && year !== "Все годы" && year !== "Любой год"
        ? year
        : "";
    if (yearClean) parts.push(yearClean);
    const carPref = parts.join(" · ");
    const title = isRu
      ? carPref
        ? `Подобрать: ${carPref}`
        : "Подбор автомобиля"
      : carPref
        ? `Sourcing: ${carPref}`
        : "Find me a car";
    const subtitle = isRu
      ? "Оставьте контакты — менеджер свяжется и подтвердит детали по выбранному авто. Перевыбирать ничего не нужно."
      : "Leave your contact — our manager will reach out and confirm the details for the car you picked. No need to re-enter anything.";
    openGetInTouch({
      source: "home_hero_select",
      car_preference: carPref,
      title,
      subtitle,
    });
  };

  return (
    <section
      className={[styles.heroContentWrapper, className].join(" ")}
      data-testid="home-hero"
    >
      <div className={styles.heroContent}>
        {/* Full-bleed photographic backdrop with beige scrim */}
        <div className={styles.heroBackdrop} aria-hidden="true">
          <img
            className={styles.heroBackdropImg}
            alt=""
            src={heroImage}
            onError={(e) => {
              if (e.currentTarget.src !== window.location.origin + ORIGINAL_HERO.image_url) {
                e.currentTarget.src = ORIGINAL_HERO.image_url;
              }
            }}
          />
          <div className={styles.heroBackdropScrim} />
          <div className={styles.heroBackdropVignette} />
        </div>

        {/* Decorative oversized "DM Auto" watermark */}
        <span className={styles.heroWatermark} aria-hidden="true">DM<span className={styles.heroWatermarkAccent}>Auto</span></span>

        {/* Centered foreground stack */}
        <div className={styles.heroForeground}>
          <span className={styles.eyebrowChip} data-testid="home-hero-eyebrow">
            <span className={styles.eyebrowDot} />
            <span className={styles.lineInner}>{eyebrow}</span>
          </span>

          <h1 className={styles.heroHeadline}>
            <SplitText
              as="span"
              className={styles.fromAuction}
              text={t1}
              baseDelay={260}
              stepMs={28}
              charClass={styles.charMask}
              innerClass={styles.charInner}
              data-testid="home-hero-headline-line-1"
            />
            <SplitText
              as="span"
              className={styles.toKeys}
              text={t2}
              baseDelay={420}
              stepMs={28}
              charClass={styles.charMask}
              innerClass={styles.charInner}
              data-testid="home-hero-headline-line-2"
            />
            <SplitText
              as="span"
              className={styles.inYourHands}
              text={t3}
              baseDelay={580}
              stepMs={28}
              charClass={styles.charMask}
              innerClass={styles.charInner}
              data-testid="home-hero-headline-line-3"
            />
          </h1>

          <div className={styles.clientStats}>
            <span className={styles.statItem} data-testid="home-hero-kpi-1">
              <span className={styles.statBullet} />
              <span className={styles.lineInner}>{renderKpiWithRolling(k1)}</span>
            </span>
            <span className={styles.statItem} data-testid="home-hero-kpi-2">
              <span className={styles.statBullet} />
              <span className={styles.lineInner}>{k2}</span>
            </span>
            <span className={styles.statItem} data-testid="home-hero-kpi-3">
              <span className={styles.statBullet} />
              <span className={styles.lineInner}>{renderKpiWithRolling(k3)}</span>
            </span>
            <span
              className={`${styles.statItem} ${styles.statItemAccent || ""}`}
              data-testid="home-hero-kpi-4"
            >
              <span className={styles.statBullet} />
              <span className={styles.lineInner}>{renderKpiWithRolling(k4)}</span>
            </span>
          </div>

          {/* Showcase filter card — the focal element */}
          <div className={styles.filterControlsWrapper}>
            <div
              className={styles.filterControls}
              ref={filterRef}
              data-testid="home-hero-filter-bar"
            >
              <Dropdown
                label={isRu ? "Бренд" : "Brand"}
                value={brand}
                options={brandOptions}
                isOpen={openMenu === "brand"}
                onToggle={() => toggle("brand")}
                onSelect={(v) => {
                  setBrand(v === "Any Brand" || v === "Все бренды" ? "" : v);
                  setModel("");
                  setOpenMenu(null);
                }}
              />
              <div className={styles.filterDivider} />
              <Dropdown
                label={isRu ? "Модель" : "Model"}
                value={model}
                options={modelOptions}
                isOpen={openMenu === "model"}
                onToggle={() => toggle("model")}
                onSelect={(v) => {
                  setModel(v === "Any Model" || v === "Все модели" ? "" : v);
                  setOpenMenu(null);
                }}
              />
              <div className={styles.filterDivider} />
              <Dropdown
                label={isRu ? "Год" : "Year"}
                value={year}
                options={yearOptions}
                isOpen={openMenu === "year"}
                onToggle={() => toggle("year")}
                onSelect={(v) => {
                  setYear(v === "Any Year" || v === "Все годы" || v === "Любой год" ? "" : v);
                  setOpenMenu(null);
                }}
              />
              <button
                type="button"
                className={styles.findBtn}
                onClick={onFind}
                data-testid="home-hero-filter-submit"
              >
                {isRu ? "ПОДОБРАТЬ АВТОМОБИЛЬ" : "FIND A CAR"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrameComponent18;
