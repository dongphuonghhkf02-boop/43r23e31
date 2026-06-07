/**
 * BrandLogos1 — "Most popular brands" with progressive disclosure.
 *
 *   • DEFAULT row 1 (6 logos): Mercedes-Benz · Jeep · Toyota · BMW ·
 *     Hyundai · Volkswagen
 *   • Click "OTHER BRANDS +" → reveals row 2 (Audi · Ford · Honda · Kia ·
 *     Lexus · Mazda) with a smooth height + opacity transition.
 *   • Click again → reveals row 3 (Nissan · Porsche · Tesla · Chevrolet ·
 *     Dodge · Cadillac).
 *   • A small "← collapse" link appears after the first expand so the
 *     user can fold rows back. When all 18 are visible the toggle
 *     becomes "ALL BRANDS →" and links to `/catalog` for the full filter.
 *   • Each card links to /catalog?make=<Make> with proper-case so the
 *     CatalogPage filter chip pre-selects on first render.
 *
 *   Design tweak vs. previous build: rows separated by a thin amber
 *   gradient hairline + brand name fades in under the logo on hover.
 */
import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../i18n";
import useInView from "../../components/useInView";
import styles from "./brand-logos1.module.css";

/* Brand metadata. `name` matches the API canonical casing so
   /catalog?make=<name> pre-selects the chip on CatalogPage. */
const BRAND_TIERS = [
  // Tier 1 — default visible
  [
    { slug: "mercedes",   name: "Mercedes-Benz", label: "Mercedes" },
    { slug: "jeep",       name: "Jeep" },
    { slug: "toyota",     name: "Toyota" },
    { slug: "bmw",        name: "BMW" },
    { slug: "hyundai",    name: "Hyundai" },
    { slug: "volkswagen", name: "Volkswagen", label: "VW" },
  ],
  // Tier 2 — revealed after first expand
  [
    { slug: "audi",   name: "Audi" },
    { slug: "ford",   name: "Ford" },
    { slug: "honda",  name: "Honda" },
    { slug: "kia",    name: "Kia" },
    { slug: "lexus",  name: "Lexus" },
    { slug: "mazda",  name: "Mazda" },
  ],
  // Tier 3 — revealed after second expand
  [
    { slug: "nissan",    name: "Nissan" },
    { slug: "porsche",   name: "Porsche" },
    { slug: "tesla",     name: "Tesla" },
    { slug: "chevrolet", name: "Chevrolet" },
    { slug: "dodge",     name: "Dodge" },
    { slug: "cadillac",  name: "Cadillac" },
  ],
].map((tier) => tier.map((b) => ({ ...b, src: `/figma/brands/${b.slug}.webp` })));

const BrandLogos1 = ({ className = "" }) => {
  const { lang } = useLang();
  const isRu = lang === "ru";
  const T = isRu
    ? {
        title: "Популярные бренды",
        more: "другие бренды +",
        collapse: "свернуть",
        allBrands: "все бренды →",
        browse: (n) => `Перейти к ${n}`,
      }
    : {
        title: "popular brands",
        more: "other brands +",
        collapse: "collapse",
        allBrands: "all brands →",
        browse: (n) => `Browse ${n}`,
      };

  // Tier expansion: 1 → only default row, 2 → +tier 2, 3 → all 3 tiers.
  const [tier, setTier] = useState(1);
  const visibleTiers = useMemo(() => BRAND_TIERS.slice(0, tier), [tier]);

  // Reveal-on-scroll cascade
  const [sectionRef, inView] = useInView();

  // After the user expands, scroll the newly-revealed row into view smoothly.
  const containerRef = useRef(null);
  const prevTier = useRef(tier);
  useEffect(() => {
    if (tier > prevTier.current && containerRef.current) {
      // Defer to next frame so the new row is in the DOM before scrolling.
      requestAnimationFrame(() => {
        const rows = containerRef.current.querySelectorAll(`.${styles.brandsGrid}`);
        const last = rows[rows.length - 1];
        if (last) last.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    prevTier.current = tier;
  }, [tier]);

  const handleToggleClick = (e) => {
    if (tier < BRAND_TIERS.length) {
      e.preventDefault();
      setTier((v) => Math.min(v + 1, BRAND_TIERS.length));
    }
    // When all tiers visible — fall through to <Link> default and navigate to /catalog.
  };

  return (
    <section
      ref={sectionRef}
      className={[styles.brandLogos, className, inView ? "is-visible" : ""].join(" ")}
    >
      <div className={styles.popularBrands}>
        <div className={styles.rectangleParent} ref={containerRef}>
          <div className={styles.brandsHeader}>
            <h2 className={styles.mostPopularBrands}>{T.title}</h2>
            <span className={styles.titleAccent} aria-hidden="true" />
          </div>

          {visibleTiers.map((tierBrands, tierIdx) => (
            <div
              key={`tier-${tierIdx}`}
              className={[
                styles.brandsGrid,
                tierIdx > 0 ? styles.brandsGridExtra : "",
              ].join(" ")}
              data-tier={tierIdx}
            >
              {tierBrands.map((b, i) => (
                <Link
                  to={`/catalog?make=${encodeURIComponent(b.name)}`}
                  key={b.slug}
                  className={`${styles.brandItem} ${styles.brandReveal}`}
                  aria-label={T.browse(b.label || b.name)}
                  data-testid={`brand-logo-${b.slug}`}
                  data-row={tierIdx}
                  style={{ animationDelay: `${(tierIdx === 0 ? 300 : 60) + i * 110}ms` }}
                >
                  <img
                    className={styles.brandLogo}
                    src={b.src}
                    alt={b.name}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = "inline";
                      }
                    }}
                  />
                  <span className={styles.brandFallback}>{b.label || b.name}</span>
                  <span className={styles.brandHoverLabel} aria-hidden="true">
                    {b.label || b.name}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Toggle row — expand further OR (when all visible) jump to full catalog */}
        <div className={styles.otherBrands}>
          {tier > 1 && (
            <button
              type="button"
              className={styles.collapseBtn}
              onClick={() => setTier(1)}
              data-testid="brands-collapse"
            >
              ← {T.collapse}
            </button>
          )}
          {tier < BRAND_TIERS.length ? (
            <button
              type="button"
              className={styles.otherBrands2}
              onClick={handleToggleClick}
              data-testid="brands-show-more"
            >
              {T.more}
            </button>
          ) : (
            <Link
              to="/catalog"
              className={styles.otherBrands2}
              data-testid="brands-all"
            >
              {T.allBrands}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default BrandLogos1;
