/**
 * FrameComponent20 — budget filter row (BIBI 2026-06 pivot).
 *
 *   ── ФИЛЬТР ПО БЮДЖЕТУ   [ ВСЕ ] [ <10K ] [ 10-15K ] [ 15-25K ] [ 25-40K ] [ 40-60K ] [ 60K+ ]
 *
 * Bucket values match the backend `/api/public/cars?budget=<bucket>`
 * vocabulary defined in `app/routers/cars.py`.
 */
import { useState } from "react";
import { useLang } from "../../i18n";
import useInView from "../../components/useInView";
import styles from "./frame-component20.module.css";

const PRICE_TIERS = [
  { key: "all",       value: null,        label: "ALL",     labelRu: "ВСЕ" },
  { key: "under_10k", value: "under_10k", label: "<10K €",  labelRu: "ДО 10К" },
  { key: "10_15k",    value: "10_15k",    label: "10-15K €", labelRu: "10–15К" },
  { key: "15_25k",    value: "15_25k",    label: "15-25K €", labelRu: "15–25К" },
  { key: "25_40k",    value: "25_40k",    label: "25-40K €", labelRu: "25–40К" },
  { key: "40_60k",    value: "40_60k",    label: "40-60K €", labelRu: "40–60К" },
  { key: "60k_plus",  value: "60k_plus",  label: "60K+ €",  labelRu: "60К+" },
];

const FrameComponent20 = ({ className = "", onChange }) => {
  const { lang } = useLang();
  const isRu = lang === "ru";
  const [tierValue, setTierValue] = useState(null);
  const [rowRef, rowInView] = useInView();

  const selectTier = (value) => {
    setTierValue(value);
    if (typeof onChange === "function") onChange({ budget: value });
  };

  return (
    <section
      ref={rowRef}
      className={[
        styles.frameWrapper,
        className,
        rowInView ? "is-visible" : "",
      ].join(" ")}
    >
      <div className={styles.row}>
        <div className={styles.filterEyebrow}>
          <span className={styles.eyebrowDash} aria-hidden="true" />
          <span className={styles.eyebrowText}>
            {isRu ? "Фильтр по бюджету" : "Filter by budget"}
          </span>
        </div>

        <div
          className={styles.tiers}
          role="tablist"
          aria-label={isRu ? "Ценовой диапазон" : "Price range"}
        >
          {PRICE_TIERS.map((p) => {
            const display = isRu ? p.labelRu : p.label;
            const isActive = tierValue === p.value;
            return (
              <button
                key={p.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`top-deals-tier-${p.key}`}
                className={`${styles.tierBtn} ${isActive ? styles.tierBtnActive : ""}`}
                onClick={() => selectTier(p.value)}
              >
                {display}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FrameComponent20;
