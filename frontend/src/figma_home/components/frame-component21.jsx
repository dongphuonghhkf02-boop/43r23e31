/**
 * FrameComponent21 — curated catalog grid (BIBI 2026-06 pivot).
 *
 * Replaces the legacy wishlist-deals fetch with the new admin-curated
 * /api/public/cars endpoint. The page is now a flat list of cars chosen
 * by the admin — no weekly rotation, no auction logic, no VIN dependency.
 *
 *   • Data source : GET /api/public/cars?budget=<bucket>
 *   • Card        : new <CarCard /> (consumes the curated data shape)
 *   • Empty state : CTA "Не нашли свой автомобиль?" → opens GetInTouch
 *   • Pagination  : "Show more" button (9 → all) and "Show less" toggle
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import CarCard from "./CarCard";
import { userEngagementApi } from "../../lib/api";
import useInView from "../../components/useInView";
import { useLang } from "../../i18n";
import { useGetInTouch } from "../../components/public/GetInTouchModal";
import styles from "./frame-component21.module.css";

const API = process.env.REACT_APP_BACKEND_URL || "";

const DEFAULT_VISIBLE = 9;

const FrameComponent21 = ({ className = "", budget, onCount }) => {
  const { lang } = useLang();
  const isRu = lang === "ru";
  const { open: openGetInTouch } = useGetInTouch();

  // Engagement state (favorites + compare)
  const [favSet, setFavSet] = useState(new Set());
  const [cmpSet, setCmpSet] = useState(new Set());
  const [cmpCount, setCmpCount] = useState(0);

  // Show only DEFAULT_VISIBLE cards by default; user can expand.
  const [showAll, setShowAll] = useState(false);

  // Reset to 9 visible whenever the budget filter changes.
  useEffect(() => {
    setShowAll(false);
  }, [budget]);

  const carsQ = useQuery({
    queryKey: ["public/cars", { budget }],
    queryFn: async ({ signal }) => {
      const params = { page_size: 60 };
      if (budget) params.budget = budget;
      const { data } = await axios.get(`${API}/api/public/cars`, {
        params,
        signal,
        timeout: 15000,
      });
      return Array.isArray(data?.items) ? data.items : [];
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const items = carsQ.data || [];
  const total = items.length;
  const visibleItems = showAll ? items : items.slice(0, DEFAULT_VISIBLE);
  const hasMore = total > DEFAULT_VISIBLE;

  useEffect(() => {
    if (typeof onCount === "function") onCount(total);
  }, [total, onCount]);

  /* ── Engagement bootstrap ─────────────────────────────────────── */
  const loadEngagement = useCallback(async () => {
    try {
      const favs = await userEngagementApi.favorites.getMine();
      if (Array.isArray(favs)) {
        setFavSet(
          new Set(
            favs
              .map((f) => (f.vin || f.vehicleId || "").toUpperCase())
              .filter(Boolean),
          ),
        );
      }
    } catch {
      /* unauth or API down */
    }
    try {
      const cmp = await userEngagementApi.compare.getMine();
      const list = Array.isArray(cmp) ? cmp : cmp?.items || [];
      const ids = list
        .map((c) => (c.vin || c.vehicleId || "").toUpperCase())
        .filter(Boolean);
      setCmpSet(new Set(ids));
      setCmpCount(ids.length);
    } catch {
      /* leave empty */
    }
  }, []);

  useEffect(() => {
    loadEngagement();
  }, [loadEngagement]);

  const handleToggleFavorite = useCallback((carKey, next) => {
    if (!carKey) return;
    const v = carKey.toUpperCase();
    setFavSet((prev) => {
      const ns = new Set(prev);
      if (next) ns.add(v);
      else ns.delete(v);
      return ns;
    });
  }, []);

  const handleToggleCompare = useCallback((carKey, next) => {
    if (!carKey) return;
    const v = carKey.toUpperCase();
    setCmpSet((prev) => {
      const ns = new Set(prev);
      if (next) ns.add(v);
      else ns.delete(v);
      return ns;
    });
    setCmpCount((c) => Math.max(0, c + (next ? 1 : -1)));
  }, []);

  /* ── Loading / empty states ───────────────────────────────────── */
  const isInitialLoading =
    carsQ.isLoading || (carsQ.isFetching && !carsQ.data);
  const showPlaceholders = items.length === 0 && isInitialLoading;
  const placeholderCount = Math.min(DEFAULT_VISIBLE, 9);
  const isEmpty = !isInitialLoading && items.length === 0;

  const [sectionRef, inView] = useInView();

  const handleLeadOpen = () => {
    openGetInTouch?.({
      source: "homepage_no_match",
      car_preference: "",
    });
  };

  return (
    <div
      ref={sectionRef}
      className={[
        styles.cardsBlockWrapper,
        className,
        inView ? "is-visible" : "",
      ].join(" ")}
    >
      <div className={styles.cardsGrid}>
        {showPlaceholders &&
          Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`ph-${i}`}
              className={styles.placeholderCard}
              aria-hidden="true"
            />
          ))}

        {!showPlaceholders &&
          visibleItems.map((v, i) => (
            <div
              key={v.id || v.slug || `car-${i}`}
              className={`${styles.cardCell} reveal reveal--fade-up`}
              style={{ animationDelay: `${(i % 9) * 60}ms` }}
            >
              <CarCard
                data={v}
                favoriteSet={favSet}
                compareSet={cmpSet}
                compareCount={cmpCount}
                onToggleFavoriteLocal={handleToggleFavorite}
                onToggleCompareLocal={handleToggleCompare}
              />
            </div>
          ))}
      </div>

      {isEmpty && (
        <div
          data-testid="top-deals-empty"
          className={styles.emptyState}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className={styles.emptyTitle}>
            {isRu
              ? "Под выбранный бюджет пока нет предложений"
              : "No curated picks for this budget yet"}
          </div>
          <div className={styles.emptyDesc}>
            {isRu
              ? "Подберём индивидуально — оставьте заявку, менеджер свяжется с вами."
              : "We'll source one personally — leave a request and our manager will be in touch."}
          </div>
          <button
            type="button"
            className={styles.moreBtn}
            onClick={handleLeadOpen}
            data-testid="lead-cta-from-empty"
            style={{ marginTop: 6 }}
          >
            {isRu ? "Получить индивидуальный расчёт" : "Get a personal quote"}
          </button>
        </div>
      )}

      <div className={styles.moreRow}>
        {hasMore && !showAll && (
          <button
            type="button"
            className={styles.moreBtn}
            onClick={() => setShowAll(true)}
            data-testid="top-deals-show-more"
          >
            {isRu
              ? `Больше машин (+${total - DEFAULT_VISIBLE})`
              : `More vehicles (+${total - DEFAULT_VISIBLE})`}
          </button>
        )}
        {showAll && hasMore && (
          <button
            type="button"
            className={styles.moreBtnGhost}
            onClick={() => setShowAll(false)}
            data-testid="top-deals-show-less"
          >
            {isRu ? "Свернуть" : "Show less"}
          </button>
        )}
      </div>

      {/* "Не нашли свой автомобиль?" CTA — always present below the grid */}
      {!isEmpty && (
        <div
          className={styles.notFoundCta}
          data-testid="not-found-cta"
        >
          <div className={styles.notFoundCtaInner}>
            <div className={styles.notFoundCopy}>
              <div className={styles.notFoundEyebrow}>
                <span className={styles.notFoundEyebrowDash} aria-hidden="true" />
                <span className={styles.notFoundEyebrowText}>
                  {isRu ? "Индивидуальный подбор" : "Personal sourcing"}
                </span>
              </div>
              <h3 className={styles.notFoundTitle}>
                {isRu
                  ? "Не нашли свой автомобиль?"
                  : "Couldn't find your car?"}
              </h3>
              <p className={styles.notFoundText}>
                {isRu
                  ? "Менеджер подберёт авто под ваш запрос — бренд, бюджет, комплектацию — и пришлёт варианты с расчётом под ключ."
                  : "Our manager will source a car matching your brief — brand, budget, options — and send you turnkey calculations."}
              </p>
            </div>
            <button
              type="button"
              className={styles.notFoundBtn}
              onClick={handleLeadOpen}
              data-testid="lead-cta-not-found"
            >
              {isRu ? "Связаться с менеджером" : "Contact a manager"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FrameComponent21;
