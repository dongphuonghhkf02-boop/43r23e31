/**
 * VehicleDeals1 — header for the "Подборка недели" homepage block.
 *
 * Wave 2026-06 redesign: the bracketed tagline (`[ THOUSANDS OF…  ]`)
 * was retired in favour of the editorial header pattern used by
 * FrameComponent24/27/28 (eyebrow dash + uppercase kicker, bicolor
 * title, meta-row underneath). This keeps the section consistent
 * with the rest of the redesigned site (no more "Figma brackets").
 *
 *   ── ПОДБОРКА НЕДЕЛИ                              ОБНОВЛЕНО: WK 23
 *
 *   ЛУЧШИЕ ПРЕДЛОЖЕНИЯ
 *   АВТОМОБИЛЕЙ НЕДЕЛИ
 *   ─── ТОЛЬКО ЛУЧШИЕ. ОБНОВЛЯЕТСЯ ЕЖЕНЕДЕЛЬНО
 *
 *      18                   9                  Каждый понедельник
 *      ПРЕДЛОЖЕНИЙ          В ТОПЕ             ОБНОВЛЕНИЕ
 *
 * The "В ТОПЕ" meta value mirrors how many cards the homepage shows
 * by default (9) — feeds visual continuity between this header and
 * the 3×3 grid that follows it.
 */
import { useLang } from "../../i18n";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import styles from "./vehicle-deals1.module.css";

const T = {
  en: {
    eyebrow: "Weekly Pick",
    titleA: "Top vehicle deals",
    titleB: "of the week",
    sub: "Only the best lots — refreshed every Monday.",
    metaA: "in selection",
    metaB: "on the front page",
    metaC: "update",
    metaCVal: "Every Monday",
  },
  ru: {
    eyebrow: "Подборка недели",
    titleA: "Лучшие предложения",
    titleB: "автомобилей недели",
    sub: "Только лучшие лоты — обновление каждый понедельник.",
    metaA: "в подборке",
    metaB: "в топе на сайте",
    metaC: "обновление",
    metaCVal: "по понедельникам",
  },
};

const VehicleDeals1 = ({ className = "", count = null, topN = 9 }) => {
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const [ref, inView] = useInView();
  const titleACharCount = (t.titleA || "").replace(/\s/g, "").length;

  return (
    <section
      ref={ref}
      className={[styles.vehicleDeals, className, inView ? "is-visible" : ""].join(" ")}
      data-testid="weekly-deals-header"
    >
      {/* ── Editorial top row: eyebrow on the left ── */}
      <div className={styles.eyebrowRow}>
        <div className={styles.eyebrow}>
          <span className={styles.eyebrowDash} aria-hidden="true" />
          <span className={styles.eyebrowText}>{t.eyebrow}</span>
        </div>
      </div>

      {/* ── Title : navy line + amber accent line ── */}
      <div className={styles.titleBlock}>
        <AnimatedHeading
          as="h2"
          className={`${styles.titleLine} ${styles.titleNavy}`}
          text={t.titleA}
        />
        <AnimatedHeading
          as="h2"
          className={`${styles.titleLine} ${styles.titleAmber}`}
          text={t.titleB}
          baseDelay={titleACharCount * 28}
        />
        <p className={styles.subline}>
          <span className={styles.sublineRule} aria-hidden="true" />
          {t.sub}
        </p>
      </div>

      {/* ── Meta row: live counts + cadence ── */}
      <div className={styles.metaRow}>
        <div className={styles.metaItem} data-testid="weekly-deals-meta-count">
          <span className={styles.metaVal}>{count == null ? "—" : count}</span>
          <span className={styles.metaLabel}>{t.metaA}</span>
        </div>
        <span className={styles.metaDivider} aria-hidden="true" />
        <div className={styles.metaItem}>
          <span className={styles.metaVal}>{topN}</span>
          <span className={styles.metaLabel}>{t.metaB}</span>
        </div>
        <span className={styles.metaDivider} aria-hidden="true" />
        <div className={styles.metaItem}>
          <span className={`${styles.metaVal} ${styles.metaValSmall}`}>{t.metaCVal}</span>
          <span className={styles.metaLabel}>{t.metaC}</span>
        </div>
      </div>
    </section>
  );
};

export default VehicleDeals1;
