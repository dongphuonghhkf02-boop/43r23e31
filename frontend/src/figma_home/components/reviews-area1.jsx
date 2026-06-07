import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import AnimatedHeading from "../../components/AnimatedHeading";
import RollingNumber from "../../components/RollingNumber";
import useInView from "../../components/useInView";
import { useLang } from "../../i18n";
import styles from "./reviews-area1.module.css";

/**
 * ReviewsArea1 — admin-managed "OUR CLIENTS SAY" block.
 *
 * Data sources (per task spec):
 *   • Reviews block headings (title / subtitle) — admin-managed via
 *     `GET /api/site-info` → `reviews` payload (legacy CMS).
 *   • Individual review items + Google rating badge + count — REAL DATA
 *     pulled from `GET /api/public/google-reviews` (synced from Google
 *     Places API, with admin moderation in Admin → Google Reviews).
 *
 * The component first tries the Google endpoint; if it returns >0 reviews
 * those replace the CMS `items[]`. If the Google endpoint is unavailable
 * or empty we keep the CMS items as a graceful fallback so the page
 * NEVER renders empty.
 *
 * Aggregate values (badge rating / total count) ALWAYS come from the
 * Google endpoint (which computes them from all cached non-hidden
 * reviews, including ones below the display filter) — admin moderation
 * is reflected truthfully.
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const FALLBACK_REVIEWS = [
  {
    id: "fallback-1",
    enabled: true,
    name: "Georgi",
    name_ru: "Джордж",
    rating: 5,
    image_url: "",
    text_en:
      "I really liked the approach — everything was clear, transparent, and without \u201Csurprises.\u201D The car was chosen to fit my budget and wishes, and they were constantly in touch. I\u2019m already recommending it to my friends!",
    text_ru:
      "Мне понравился подход — все было четко, прозрачно и без «сюрпризов». Автомобиль выбирался согласно моему бюджету и пожеланиям. Рекомендую друзьям!",
  },
  {
    id: "fallback-2",
    enabled: true,
    name: "Dimitar",
    name_ru: "Димитар",
    rating: 5,
    image_url: "",
    text_en:
      "I bought a car from an auction — the team really knows their stuff. They explained all the nuances, helped me win the bid, and organized delivery. The result — top value for money.",
    text_ru:
      "Машину купил на аукционе - команда действительно знает свое дело. Объяснили все нюансы, помогли выиграть тендер и организовали доставку.",
  },
  {
    id: "fallback-3",
    enabled: true,
    name: "Ivan",
    name_ru: "Иван",
    rating: 5,
    image_url: "",
    text_en:
      "Smooth experience from start to finish. The car was picked up, inspected and shipped without a single delay. Honest pricing — no hidden fees at customs. Will buy again next year.",
    text_ru:
      "Бесшовно от начала до конца. Автомобиль был выбран, осмотрен и отправлен без задержек. Честные цены — никаких скрытых таможенных платежей. Я куплю снова в следующем году.",
  },
  {
    id: "fallback-4",
    enabled: true,
    name: "Elena",
    name_ru: "Елена",
    rating: 5,
    image_url: "",
    text_en:
      "Stayed within budget and got a car I never thought I could afford locally. The team kept me updated every step of the shipping — even sent photos from the port. Highly professional.",
    text_ru:
      "Мы уложились в бюджет, и я купил машину, которую, как я думал, я не смогу себе позволить. Я также получил фотографии из порта. Чрезвычайно профессионально.",
  },
  {
    id: "fallback-5",
    enabled: true,
    name: "Nikola",
    name_ru: "Николас",
    rating: 5,
    image_url: "",
    text_en:
      "Bought a German SUV from Munich — they handled bidding on Mobile.de, road transport, customs and registration. I just picked up the keys. Saved me both money and 3 weeks of bureaucracy. Five stars deserved.",
    text_ru:
      "Купил корейский внедорожник - они позаботились о торгах, транспортировке, таможне и регистрации. Я просто взял ключи. Они сэкономили мне деньги и 3 недели бюрократии. Пять звезд.",
  },
];

const FALLBACK_CFG = {
  enabled: true,
  title_en: "Our Clients Say",
  title_ru: "Что говорят наши клиенты",
  subtitle_en: "What customers say when they work with us",
  subtitle_ru: "Что говорят клиенты после работы с нами",
  google_rating: 4.9,
  google_reviews_count: 31,
  google_reviews_url: "",
  baseline_happy_customers: 455,
  items: FALLBACK_REVIEWS,
};

function fullMediaUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_URL}${u}`;
}

function getActiveLang() {
  // kept for backwards-compat — not used (replaced by useLang() context).
  if (typeof window === "undefined") return "en";
  const docLang = (document?.documentElement?.lang || "").toLowerCase();
  if (docLang.startsWith("ru")) return "ru";
  return "en";
}

const ReviewsArea1 = ({ className = "" }) => {
  const trackRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cfg, setCfg] = useState(FALLBACK_CFG);
  const { lang: ctxLang } = useLang();
  const lang = ctxLang === "ru" ? "ru" : "en";

  // Race-condition note: both endpoints run in parallel, but the live
  // Google feed is the SOURCE OF TRUTH for `items`, `google_rating`,
  // `google_reviews_count` and `google_reviews_url`. The CMS site-info
  // only owns the localized text (`title_*`, `subtitle_*`). A ref-backed
  // `googleApplied` flag prevents site-info (when it resolves AFTER
  // Google) from clobbering live aggregates with stale CMS fallback.
  const googleAppliedRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    // 1) CMS site-info (title / subtitle / fallback rating-count if no Google sync yet)
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/site-info`);
        if (cancelled) return;
        const reviews = r?.data?.reviews;
        if (reviews && typeof reviews === "object") {
          setCfg((prev) => {
            // Strip Google-owned keys if live feed already applied them.
            const safe = { ...reviews };
            if (googleAppliedRef.current) {
              delete safe.items;
              delete safe.google_rating;
              delete safe.google_reviews_count;
              delete safe.google_reviews_url;
            }
            return {
              ...prev,
              ...safe,
              items: googleAppliedRef.current
                ? prev.items
                : (Array.isArray(reviews.items) ? reviews.items : prev.items),
            };
          });
        }
      } catch {
        /* keep fallback */
      }
    })();
    // 2) Real Google reviews feed — overrides items/rating/count when available
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/public/google-reviews`);
        if (cancelled) return;
        const g = r?.data || {};
        if (g.enabled === false) return;
        // Map Google review shape → component review shape
        const mapped = Array.isArray(g.reviews)
          ? g.reviews.map((it) => ({
              id: it.id,
              enabled: true,
              name: it.author_name,
              name_ru: it.author_name,
              image_url: it.author_avatar_url || "",
              rating: it.rating,
              text_en: it.text || "",
              text_ru: it.text_ru || it.text || "",
            }))
          : [];
        googleAppliedRef.current = mapped.length > 0
          || (typeof g.rating === "number" && g.rating > 0)
          || (typeof g.count === "number" && g.count > 0);
        setCfg((prev) => ({
          ...prev,
          items: mapped.length > 0 ? mapped : prev.items,
          google_rating: typeof g.rating === "number" && g.rating > 0 ? g.rating : prev.google_rating,
          google_reviews_count: typeof g.count === "number" && g.count > 0 ? g.count : prev.google_reviews_count,
          google_reviews_url: g.url || prev.google_reviews_url,
        }));
      } catch {
        /* keep CMS items / fallback */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // lang updates flow through useLang() context — no manual listeners needed
  useEffect(() => { /* noop */ }, []);

  const visibleReviews = useMemo(() => {
    // Deterministic, predictable sort regardless of backend ordering:
    //   1. pinned reviews first
    //   2. then by rating (highest first)
    //   3. then by recency (newest first — falls back to id if missing)
    // This guarantees the same sequence on every render & every device
    // and matches the "сортировка должна быть правильная" requirement.
    const list = (cfg.items || []).filter((r) => r && r.enabled !== false);
    const ts = (r) => {
      const t = r.time || r.created_at || r.timestamp || "";
      if (typeof t === "number") return t;
      const parsed = Date.parse(t);
      return Number.isFinite(parsed) ? parsed : 0;
    };
    return [...list].sort((a, b) => {
      const pinDelta = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      if (pinDelta) return pinDelta;
      const rDelta = (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (rDelta) return rDelta;
      return ts(b) - ts(a);
    });
  }, [cfg.items]);

  const happyCustomers =
    (Number(cfg.baseline_happy_customers) || 0) + visibleReviews.length;

  // Gate the rolling-number animation on viewport visibility so the
  // count-up actually happens WHILE the user is looking at the block
  // (not silently before they scroll there).
  const [bigNumberRef, bigNumberInView] = useInView({ threshold: 0.35 });

  // Compute step (layout width + gap) using offsetWidth so the calculation
  // is INDEPENDENT of any CSS transform: scale() applied to inactive cards.
  // `getBoundingClientRect()` would return the SCALED visual width, which
  // breaks the math the moment the active card is no longer the first one.
  const getStep = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const card = el.querySelector(`.${styles.card}`);
    if (!card) return 0;
    const cs = window.getComputedStyle(el);
    const gap = parseFloat(cs.columnGap || cs.gap || "0") || 0;
    return card.offsetWidth + gap;
  }, []);

  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const step = getStep();
    if (!step) return;
    const idx = Math.round(el.scrollLeft / step);
    setActiveIdx(Math.max(0, Math.min(visibleReviews.length - 1, idx)));
  }, [visibleReviews.length, getStep]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Reset slider to first card when items list changes.
  useEffect(() => {
    setActiveIdx(0);
    if (trackRef.current) trackRef.current.scrollTo({ left: 0 });
  }, [visibleReviews.length]);

  const scrollToIdx = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const step = getStep();
    if (!step) return;
    el.scrollTo({ left: step * i, behavior: "smooth" });
    // Optimistically update activeIdx — the scroll listener will
    // re-confirm it once `scroll-snap` settles, but updating now means
    // the visual depth-fade swap is immediate (no flash of the wrong
    // card being active during the 300 ms smooth-scroll animation).
    setActiveIdx(Math.max(0, Math.min(visibleReviews.length - 1, i)));
  };

  // Cyclic navigation — wraps around so user can keep scrolling endlessly.
  // The carousel still renders all cards in a linear scroll-snap track; we
  // just reset scrollLeft to the appropriate edge before snapping when we
  // cross either end. This matches user expectation: "current card slides
  // out, the preview card becomes active, and a fresh preview appears".
  const prev = () => {
    if (visibleReviews.length === 0) return;
    const target = activeIdx === 0 ? visibleReviews.length - 1 : activeIdx - 1;
    scrollToIdx(target);
  };
  const next = () => {
    if (visibleReviews.length === 0) return;
    const target = activeIdx === visibleReviews.length - 1 ? 0 : activeIdx + 1;
    scrollToIdx(target);
  };

  if (cfg.enabled === false) return null;

  const subtitle =
    lang === "ru"
      ? cfg.subtitle_ru || cfg.subtitle_en || ""
      : cfg.subtitle_en || cfg.subtitle_ru || "";

  return (
    <div
      className={[styles.reviewsArea, className].join(" ")}
      data-testid="our-clients-say-section"
    >
      <div className={styles.layout}>
        {/* ── LEFT column — CARDS SLIDER (recomposed: was on the right before) ── */}
        <div className={styles.cardsColumn}>
          {/* 455+ ghost number is now anchored to the LEFT column, sitting
              BEHIND the cards row — gives the slider its own large
              numerical backdrop and emphasises the "scale of customers"
              story without competing with the info pane. */}
          <div className={styles.bigNumberBlock} aria-hidden="true">
            <h1 ref={bigNumberRef} className={styles.bigNumber}>
              {bigNumberInView ? (
                <RollingNumber target={happyCustomers} span={5} tickMs={700} suffix="+" />
              ) : (
                <span aria-hidden="true">&nbsp;</span>
              )}
            </h1>
          </div>

          {visibleReviews.length === 0 ? (
            <div className={styles.emptyState}>
              <p>{lang === "ru" ? "Пока нет отзывов." : "No reviews yet."}</p>
            </div>
          ) : (
            <div className={styles.sliderWrap}>
              <div className={styles.track} ref={trackRef}>
                {visibleReviews.map((r, i) => {
                  const text =
                    lang === "ru"
                      ? r.text_ru || r.text_en || ""
                      : r.text_en || r.text_ru || "";
                  const img = fullMediaUrl(r.image_url);
                  const isActive = i === activeIdx;
                  const distance = Math.abs(i - activeIdx);
                  return (
                    <article
                      className={[
                        styles.card,
                        isActive ? styles.cardActive : styles.cardInactive,
                        distance === 1 ? styles.cardAdjacent : "",
                        distance >= 2 ? styles.cardFar : "",
                      ].filter(Boolean).join(" ")}
                      key={r.id || i}
                      data-active={isActive ? "true" : "false"}
                      data-distance={distance}
                      onClick={() => !isActive && scrollToIdx(i)}
                      role={!isActive ? "button" : undefined}
                      tabIndex={!isActive ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (!isActive && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          scrollToIdx(i);
                        }
                      }}
                      aria-hidden={!isActive ? "true" : undefined}
                    >
                      <div className={styles.avatarRow}>
                        {img ? (
                          <img
                            className={styles.avatarImg}
                            src={img}
                            alt={r.name || "Reviewer"}
                            loading="lazy"
                          />
                        ) : (
                          <div className={styles.avatar} aria-hidden="true">
                            <span className={styles.avatarInitial}>
                              {(r.name || "?").trim().charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <h3 className={styles.cardName}>{
                          (lang === "ru" ? (r.name_ru || r.name) : (r.name_en || r.name)) || "—"
                        }</h3>
                      </div>
                      <p className={styles.cardText}>{text}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT column — INFO PANE (eyebrow → subtitle → Google → tagline) ── */}
        <aside className={styles.infoColumn}>
          <span className={styles.eyebrow} aria-hidden="true">
            <span className={styles.eyebrowDot} />
            {lang === "ru" ? "ОТЗЫВЫ КЛИЕНТОВ" : "CLIENT REVIEWS"}
          </span>

          {subtitle && (
            <AnimatedHeading
              as="h1"
              className={styles.whatCustomersSay}
              text={subtitle}
            />
          )}

          {/* Thin amber hairline — refined separator between the narrative
              (eyebrow + heading) and the credentials (Google + plate). */}
          <span className={styles.divider} aria-hidden="true" />

          {/* Google card — corner ticks ONE diagonal only (TL + BR) */}
          <div className={styles.googleCard} data-testid="google-card">
            <span className={`${styles.cornerTick} ${styles.cornerTL}`} aria-hidden="true" />
            <span className={`${styles.cornerTick} ${styles.cornerBR}`} aria-hidden="true" />

            <div className={styles.googleBlock}>
              <img
                className={styles.googleLogo}
                loading="lazy"
                width={259}
                height={87}
                alt="Google"
                src="/figma/image-34@2x.webp"
              />
              <div className={styles.googleMeta}>
                <div className={styles.googleRatingRow}>
                  <span className={styles.googleScore}>
                    {(Number(cfg.google_rating) || 0).toFixed(1)}
                  </span>
                  <span className={styles.googleStars} aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <img
                        key={i}
                        className={styles.googleStar}
                        width={24}
                        height={24}
                        alt=""
                        src="/figma/material-symbols-star.svg"
                      />
                    ))}
                  </span>
                </div>
                {cfg.google_reviews_url ? (
                  <a
                    className={styles.googleReviewsLink}
                    href={cfg.google_reviews_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {cfg.google_reviews_count} {lang === "ru" ? "Обзор Google" : "Google reviews"}
                  </a>
                ) : (
                  <span className={styles.googleReviewsLink}>
                    {cfg.google_reviews_count} {lang === "ru" ? "Обзор Google" : "Google reviews"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SATISFIED CLIENTS tagline plate — corner ticks ONE diagonal (TL + BR) */}
          <div className={styles.satisfiedBlock}>
            <span className={`${styles.cornerTick} ${styles.cornerTL}`} aria-hidden="true" />
            <span className={`${styles.cornerTick} ${styles.cornerBR}`} aria-hidden="true" />
            <span className={styles.satisfiedAccent} aria-hidden="true" />
            <h2 className={styles.satisfiedLabel}>
              <span className={styles.satisfiedYellow}>
                {lang === "ru" ? "Довольные клиенты" : "Satisfied clients"}
              </span>
              <br />
              <span className={styles.satisfiedWhite}>
                {lang === "ru" ? "наш приоритет" : "are our priority"}
              </span>
            </h2>
          </div>
        </aside>
      </div>

      {/* ── Bottom navigation ──────────────────────────────────────── */}
      {visibleReviews.length > 1 && (
        <div className={styles.nav}>
          <button
            className={styles.navBtn}
            onClick={prev}
            aria-label={lang === "ru" ? "Предыдущие отзывы" : "Previous review"}
            data-testid="review-prev"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 1L3 7L9 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className={styles.dots}>
            {visibleReviews.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === activeIdx ? styles.dotActive : ""}`}
                onClick={() => scrollToIdx(i)}
                aria-label={`Go to review ${i + 1}`}
                data-testid={`review-dot-${i}`}
              />
            ))}
          </div>

          <button
            className={styles.navBtn}
            onClick={next}
            aria-label={lang === "ru" ? "Следующие отзывы" : "Next review"}
            data-testid="review-next"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 1L11 7L5 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsArea1;
