/**
 * BrandLogos1 — "Most popular brands" (admin-curated pivot, June 2026).
 *
 * Behavioural rewrite vs. v1:
 *   • Removed progressive disclosure ("Other brands +" / "Collapse" /
 *     "All brands →") — there is no longer a public catalogue to expand
 *     into, so this UI surface is now a single static row of 6 hero
 *     brands.
 *   • Removed the on-hover brand-name overlay (Toyota text painting
 *     over the Toyota mark felt like a duplicate label — UX feedback).
 *   • Clicking a logo no longer navigates to /catalog. Instead it
 *     smooth-scrolls down to the curated "Top vehicle deals" section on
 *     the home page (anchor: `#curated-deals`). The shopper immediately
 *     sees which of *our* hand-picked cars match the brand they liked.
 *
 * Layout & visuals (cream backdrop, grayscale logos, amber accent line
 * under the title) remain identical to the previous design — only the
 * interaction model changed.
 */
import { useMemo } from "react";
import { useLang } from "../../i18n";
import useInView from "../../components/useInView";
import styles from "./brand-logos1.module.css";

/* Brand metadata. Logos live in /public/figma/brands/<slug>.webp.
   `label` is shown as a text fallback when the logo fails to load. */
const POPULAR_BRANDS = [
  { slug: "mercedes",   name: "Mercedes-Benz", label: "Mercedes" },
  { slug: "jeep",       name: "Jeep" },
  { slug: "toyota",     name: "Toyota" },
  { slug: "bmw",        name: "BMW" },
  { slug: "hyundai",    name: "Hyundai" },
  { slug: "volkswagen", name: "Volkswagen", label: "VW" },
].map((b) => ({ ...b, src: `/figma/brands/${b.slug}.webp` }));

/* Click handler — scroll to the curated picks section.
   We anchor the section via #curated-deals (added in homepage1.jsx). */
const scrollToCurated = (e) => {
  if (e?.preventDefault) e.preventDefault();
  if (typeof window === "undefined") return;
  const target = document.getElementById("curated-deals");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    // Soft fallback — if we're not on the home page, send the user
    // home and rely on the section being there on next paint.
    window.location.href = "/#curated-deals";
  }
};

const BrandLogos1 = ({ className = "" }) => {
  const { lang } = useLang();
  const isRu = lang === "ru";
  const T = useMemo(
    () =>
      isRu
        ? {
            title: "Популярные бренды",
            browse: (n) => `Показать подборку: ${n}`,
          }
        : {
            title: "popular brands",
            browse: (n) => `Show curated picks: ${n}`,
          },
    [isRu],
  );

  // Reveal-on-scroll cascade
  const [sectionRef, inView] = useInView();

  return (
    <section
      ref={sectionRef}
      className={[styles.brandLogos, className, inView ? "is-visible" : ""].join(" ")}
    >
      <div className={styles.popularBrands}>
        <div className={styles.rectangleParent}>
          <div className={styles.brandsHeader}>
            <h2 className={styles.mostPopularBrands}>{T.title}</h2>
            <span className={styles.titleAccent} aria-hidden="true" />
          </div>

          <div className={styles.brandsGrid} data-tier={0}>
            {POPULAR_BRANDS.map((b, i) => (
              <button
                type="button"
                key={b.slug}
                className={`${styles.brandItem} ${styles.brandReveal}`}
                aria-label={T.browse(b.label || b.name)}
                data-testid={`brand-logo-${b.slug}`}
                data-row={0}
                onClick={scrollToCurated}
                style={{ animationDelay: `${300 + i * 110}ms` }}
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
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandLogos1;
