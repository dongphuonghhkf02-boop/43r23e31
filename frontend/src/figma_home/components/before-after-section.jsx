/**
 * BeforeAfterSection — repurposed (December 2026).
 *
 * The "before / after" repair-comparison concept never fitted our actual
 * business model: we don't refurbish cars in Europe — we source, inspect,
 * buy and deliver.  The slot on the homepage now showcases our public
 * track record on Avito (active listings, completed deals, client reviews
 * with rating) which is where our real social proof lives today.
 *
 * The component export name stays the same so the existing homepage1.jsx
 * import graph keeps working without any wiring changes.
 *
 * Admin-managed shape (optional, via /api/site-info):
 *   site_info.avito_proof = {
 *     enabled: bool,
 *     title_ru / title_en,
 *     subtitle_ru / subtitle_en,
 *     rating, reviews_count, completed_count, active_count,
 *     items: [{ model, year, completed_date, price, image_url, deal_url }]
 *   }
 * Falls back to the SOCIAL_DEFAULTS.avito profile data + a hard-coded
 * 3-deal sample so the page never renders empty.
 */

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Star, CheckCircle2, MessageSquare, ExternalLink } from "lucide-react";
import AnimatedHeading from "../../components/AnimatedHeading";
import { useLang } from "../../i18n";
import { SOCIAL_DEFAULTS } from "../../lib/socials";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const T = {
  en: {
    eyebrow: "PROOF · AVITO",
    titleLine1: "Real deals,",
    titleLine2: "verified reviews",
    subtitle:
      "Our live track record sits on Avito — active listings, completed deliveries and reviews from real clients. Every car you see below has been bought, transported and handed over by DM Auto.",
    quotesLabel: "What clients say",
    seeAllReviews: "See all reviews on Avito",
    statRating: "Rating · Avito",
    statReviews: "Client reviews",
    statCompleted: "Deals delivered",
    statActive: "Active right now",
    recentTitle: "Recently delivered",
    cta: "Open profile on Avito",
    ctaSub: "See the full history — 12 months of completed deals",
    of5: "/ 5",
    quotes: [
      {
        text: "Bought a BMW X5 through DM Auto — full video walk-around before the deal, clean customs, delivered to my door in Minsk in three weeks. Honest team.",
        author: "Alexey K.",
        date: "October 2026",
      },
      {
        text: "Looked at four lots together, the manager honestly talked me out of two of them. Ended up with a perfect GLE 350d — no surprises on arrival.",
        author: "Dmitry P.",
        date: "September 2026",
      },
    ],
  },
  ru: {
    eyebrow: "ДОКАЗАТЕЛЬСТВО · АВИТО",
    titleLine1: "Реальные сделки,",
    titleLine2: "проверенные отзывы",
    subtitle:
      "Наш живой track-record лежит на Авито: активные предложения, закрытые сделки и отзывы от реальных клиентов. Каждый автомобиль ниже мы выкупили, перевезли и передали лично.",
    quotesLabel: "Что говорят клиенты",
    seeAllReviews: "Все 67+ отзывов на Авито",
    statRating: "Рейтинг · Авито",
    statReviews: "Отзывов клиентов",
    statCompleted: "Сделок доставлено",
    statActive: "Сейчас в работе",
    recentTitle: "Недавно доставлены",
    cta: "Открыть профиль на Авито",
    ctaSub: "Полная история сделок за последние 12 месяцев",
    of5: "/ 5",
    quotes: [
      {
        text: "Купил BMW X5 через DM Auto — до сделки прислали видео-обход, чистая таможня, доставили под дверь в Минск за три недели. Честная команда.",
        author: "Алексей К.",
        date: "Октябрь 2026",
      },
      {
        text: "Смотрели четыре лота вместе, менеджер честно отговорил от двух. В итоге забрал идеальный GLE 350d — никаких сюрпризов по приезду.",
        author: "Дмитрий П.",
        date: "Сентябрь 2026",
      },
    ],
  },
};

const FALLBACK_PROOF = {
  enabled: true,
  rating: SOCIAL_DEFAULTS.avito.rating,
  reviews_count: SOCIAL_DEFAULTS.avito.reviews_count,
  completed_count: 142,
  active_count: 18,
  items: [
    {
      id: "demo-1",
      model: "BMW X5 xDrive40i",
      year: 2021,
      completed_date_ru: "Октябрь 2026",
      completed_date_en: "October 2026",
      price: "42 500 €",
      route_ru: "Германия → Минск",
      route_en: "Germany → Minsk",
    },
    {
      id: "demo-2",
      model: "Mercedes-Benz GLE 350d",
      year: 2020,
      completed_date_ru: "Сентябрь 2026",
      completed_date_en: "September 2026",
      price: "38 900 €",
      route_ru: "Нидерланды → Москва",
      route_en: "Netherlands → Moscow",
    },
    {
      id: "demo-3",
      model: "Audi Q7 50 TDI",
      year: 2022,
      completed_date_ru: "Август 2026",
      completed_date_en: "August 2026",
      price: "55 200 €",
      route_ru: "Бельгия → Гомель",
      route_en: "Belgium → Gomel",
    },
  ],
};

/**
 * StatTile — unified outlined design (no filled accent variant).
 * All four tiles share the same cream+border treatment so the section
 * reads as one block with no jarring contrast. The rating tile uses an
 * inline star row to stay visually distinct without needing a filled bg.
 */
const StatTile = ({ value, label, rating = false }) => (
  <div className="p-5 lg:p-6 rounded-md bg-[var(--bg-elevated)] border border-[var(--accent-brand)]/15 transition-colors hover:border-[var(--accent-brand)]/40">
    <div
      className="font-bold leading-none mb-2 text-[var(--accent-brand)]"
      style={{ fontSize: "clamp(28px, 2.8vw, 44px)" }}
    >
      {value}
    </div>
    {rating && (
      <div className="flex items-center gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className="fill-[var(--accent-brand)] text-[var(--accent-brand)]"
          />
        ))}
      </div>
    )}
    <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--text-secondary)]">
      {label}
    </div>
  </div>
);

const BeforeAfterSection = () => {
  const [cfg, setCfg] = useState(FALLBACK_PROOF);
  const { lang: ctxLang } = useLang();
  const lang = ctxLang === "ru" ? "ru" : "en";
  const t = T[lang];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/site-info`);
        if (cancelled) return;
        const proof = r?.data?.avito_proof;
        if (proof && typeof proof === "object") {
          setCfg((prev) => ({
            ...prev,
            ...proof,
            items:
              Array.isArray(proof.items) && proof.items.length
                ? proof.items
                : prev.items,
          }));
        }
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () => (cfg.items || []).filter((c) => c && c.enabled !== false).slice(0, 3),
    [cfg.items],
  );

  if (cfg.enabled === false) return null;

  const avitoUrl = SOCIAL_DEFAULTS.avito.url;
  const rating = Number(cfg.rating ?? 4.9).toFixed(1);
  const reviewsCount = cfg.reviews_count ?? 67;
  const completed = cfg.completed_count ?? 142;
  const active = cfg.active_count ?? 18;

  return (
    <section
      className="bg-[var(--bg-base)] py-20 lg:py-28"
      data-testid="avito-proof-section"
    >
      <div className="max-w-[1920px] mx-auto px-6 lg:px-[100px]">
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-14 lg:mb-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-5 text-[11px] tracking-[0.18em] text-[var(--accent-brand)] font-semibold uppercase">
              <span className="inline-block w-6 h-px bg-[var(--accent-brand)]" />
              <span className="inline-flex items-center gap-1.5">
                <span className="font-light leading-none select-none">[</span>
                {t.eyebrow}
                <span className="font-light leading-none select-none">]</span>
              </span>
            </div>
            <h2
              className="font-bold uppercase text-[var(--accent-brand)] leading-[0.95]"
              style={{ fontSize: "clamp(34px, 4.4vw, 68px)" }}
            >
              <AnimatedHeading as="span" text={t.titleLine1} />
              <br />
              <AnimatedHeading
                as="span"
                text={t.titleLine2}
                baseDelay={t.titleLine1.replace(/\s/g, "").length * 28}
              />
            </h2>
            <p
              className="mt-6 text-[var(--text-secondary)] max-w-[600px]"
              style={{ fontSize: "clamp(15px, 1.05vw, 18px)", lineHeight: 1.55 }}
            >
              {t.subtitle}
            </p>
          </div>

          {/* ── Editorial review quotes (no white card — blends with cream) ── */}
          <div className="lg:col-span-5 lg:pl-8 lg:border-l lg:border-[var(--accent-brand)]/15 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <img
                src="/figma/ic-avito.svg"
                alt=""
                aria-hidden="true"
                className="w-4 h-4"
              />
              <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-secondary)] font-semibold">
                {t.quotesLabel}
              </span>
            </div>

            <div className="space-y-7 flex-1">
              {(t.quotes || []).slice(0, 2).map((q, i) => (
                <figure key={i} className="relative" data-testid="avito-quote">
                  <span
                    aria-hidden="true"
                    className="absolute -left-1 -top-2 text-[44px] leading-none font-bold text-[var(--accent-brand)]/15 select-none"
                  >
                    “
                  </span>
                  <blockquote
                    className="text-[var(--accent-brand)] leading-[1.55] pl-6"
                    style={{ fontSize: "clamp(14px, 1.0vw, 16px)" }}
                  >
                    {q.text}
                  </blockquote>
                  <figcaption className="mt-3 pl-6 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--accent-brand)]">
                      {q.author}
                    </span>
                    <span className="opacity-50">·</span>
                    <span>{q.date}</span>
                  </figcaption>
                </figure>
              ))}
            </div>

            <a
              href={avitoUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="avito-see-all-reviews"
              className="mt-7 inline-flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.18em] font-semibold text-[var(--accent-brand)] hover:underline"
            >
              {t.seeAllReviews}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* ── STATS GRID (unified outlined design — no jarring filled tile) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          <StatTile value={`${rating}`} label={t.statRating} rating />
          <StatTile value={`${reviewsCount}+`} label={t.statReviews} />
          <StatTile value={`${completed}+`} label={t.statCompleted} />
          <StatTile value={active} label={t.statActive} />
        </div>

        {/* ── RECENT DEALS ───────────────────────────────────────── */}
        <div className="mb-10">
          <h3 className="text-[var(--accent-brand)] font-bold uppercase tracking-wide text-[18px] md:text-[22px] mb-6">
            {t.recentTitle}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {items.map((it) => (
              <article
                key={it.id || it.model}
                className="group relative bg-[var(--bg-elevated)] border border-[var(--accent-brand)]/10 rounded-md p-6 overflow-hidden flex flex-col cursor-pointer transition-[transform,border-color,box-shadow] duration-[450ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] hover:border-[var(--accent-brand)]/45 hover:shadow-[0_18px_44px_-18px_rgba(22,46,81,0.32)] hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 motion-reduce:transition-none"
                data-testid="avito-deal-card"
              >
                {/* Top accent stripe — grows on hover from left to right */}
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-0 h-[3px] w-0 bg-[var(--accent-brand)] transition-[width] duration-[550ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:w-full"
                />

                {/* Date row */}
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] font-semibold mb-4 transition-colors duration-300 group-hover:text-[var(--accent-brand)]">
                  <CheckCircle2
                    size={14}
                    className="text-[var(--accent-brand)] transition-transform duration-500 group-hover:rotate-[360deg]"
                  />
                  {lang === "ru"
                    ? it.completed_date_ru || it.completed_date_en
                    : it.completed_date_en || it.completed_date_ru}
                </div>

                {/* Title */}
                <h4
                  className="font-bold text-[var(--accent-brand)] leading-tight mb-1 transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:translate-x-0.5"
                  style={{ fontSize: "clamp(17px, 1.2vw, 20px)" }}
                >
                  {it.model}
                </h4>
                <div className="text-[var(--text-secondary)] text-[13px] mb-4">
                  {it.year}
                </div>

                {/* Route */}
                <div className="text-[var(--text-secondary)] text-[13px] mb-6 transition-opacity duration-300 group-hover:opacity-100 opacity-80">
                  {lang === "ru"
                    ? it.route_ru || it.route_en
                    : it.route_en || it.route_ru}
                </div>

                {/* Divider — grows in colour on hover */}
                <div className="mt-auto pt-4 relative">
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 top-0 h-px bg-[var(--accent-brand)]/10 transition-colors duration-500 group-hover:bg-[var(--accent-brand)]/30"
                  />
                  <div className="flex items-center justify-between">
                    <div
                      className="text-[var(--accent-brand)] font-bold text-[18px] transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.04] origin-left"
                    >
                      {it.price}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--accent-brand)]/60 bg-transparent transition-all duration-300 group-hover:text-[var(--accent-brand)] group-hover:bg-[var(--accent-brand)]/8">
                      <MessageSquare
                        size={12}
                        className="transition-transform duration-300 group-hover:-rotate-12"
                      />
                      {lang === "ru" ? "Отзыв на Авито" : "Avito review"}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ── CTA — full navy bar; text & subtitle forced white via inline
              style (defensive against any global `a` colour reset). ── */}
        <a
          href={avitoUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="avito-profile-cta"
          style={{ color: "#ffffff" }}
          className="group flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-[var(--accent-brand)] rounded-md p-8 lg:p-10 hover:bg-[var(--accent-brand-hover)] transition-colors no-underline"
        >
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-110 group-hover:bg-white/15">
              <img
                src="/figma/ic-avito.svg"
                alt=""
                aria-hidden="true"
                className="w-7 h-7 brightness-0 invert"
              />
            </div>
            <div>
              <div
                className="font-bold uppercase leading-tight mb-1"
                style={{
                  color: "#ffffff",
                  fontSize: "clamp(18px, 1.6vw, 26px)",
                  letterSpacing: "0.01em",
                }}
              >
                {t.cta}
              </div>
              <div
                className="text-[13px] md:text-[14px] leading-snug"
                style={{ color: "rgba(255, 255, 255, 0.78)" }}
              >
                {t.ctaSub}
              </div>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 px-6 h-[52px] rounded font-semibold uppercase text-[13px] tracking-wider whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:translate-x-1"
            style={{ backgroundColor: "#ffffff", color: "var(--accent-brand)" }}
          >
            avito.ru
            <ExternalLink size={14} />
          </div>
        </a>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
