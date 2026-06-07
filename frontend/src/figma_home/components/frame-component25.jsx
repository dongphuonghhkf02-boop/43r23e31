import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Search,
  Truck,
  FileBadge,
  Wallet,
  RouteIcon,
  Wrench,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useLang } from "../../i18n";
import BUTTON1 from "./b-u-t-t-o-n1";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import styles from "./frame-component25.module.css";

/* ──────────────────────────────────────────────────────────────────────
 * "OUR SERVICES" — V2 (2026-06-07)
 *
 * Full redesign per product brief (06-2026):
 *   • Replaces the legacy 4×2 cream-card grid that no longer reflected
 *     the brand's actual value props (the old block claimed "Auto
 *     Service" and "Detailing & Cleaning" as core offers — we do not
 *     run those; cars arrive clean and inspected so retail detailing
 *     isn't part of our pipeline).
 *   • Surfaces the *signature* differentiator first: an honest, hands-on
 *     inspection + hand-pick that catches hidden defects BEFORE we ship.
 *   • Reframes the rest as a 6-card grid of supporting capabilities:
 *     home delivery, customs+standards, low-deposit financing, optimal
 *     logistics, parts sourcing, fast 24/7 response.
 *   • New iconography: lucide-react line icons replace the old
 *     mismatched Figma SVG fragments.
 *   • Layout is intentionally asymmetric (1 featured + 3×2 supporting)
 *     so visually it reads as a *different* block from any other
 *     section on the site while keeping the same navy / cream / amber
 *     palette as the rest of the homepage.
 * ──────────────────────────────────────────────────────────────────── */

const T = {
  en: {
    eyebrow: "Full-cycle service",
    ourServices: "our services",
    intro:
      "Everything between the auction lot and the keys in your hand — covered by one team.",
    signatureBadge: "Signature service",
    featured: {
      tag: "/ 01",
      title: "Real inspection & hand-picked selection",
      desc:
        "Our team physically inspects every car before it leaves — paint thickness, frame geometry, hidden corrosion, electronics, fluids, VIN-match — so you receive exactly what you saw, with no surprises.",
      points: [
        "On-site walk-around + diagnostic scan",
        "Hidden-defect & repaint detection",
        "Full history & VIN cross-check",
        "Match against your budget & spec",
      ],
    },
    cards: [
      {
        tag: "/ 02",
        title: "Door-to-door delivery",
        desc:
          "We deliver the car to any city in Russia or Belarus. You collect the keys at your address — no extra trips, no border runs.",
      },
      {
        tag: "/ 03",
        title: "Customs & standards",
        desc:
          "Full customs clearance with documents that meet both EU export and RU / BY import standards. We handle every paper, every stamp.",
      },
      {
        tag: "/ 04",
        title: "Minimum deposit",
        desc:
          "Start with a small reservation fee instead of full pre-payment. The rest is settled on delivery — flexible terms for every budget.",
      },
      {
        tag: "/ 05",
        title: "Optimal logistics route",
        desc:
          "We build the cheapest viable route from the auction yard to your driveway, balancing transport mode, transit times and customs windows.",
      },
      {
        tag: "/ 06",
        title: "Parts sourcing",
        desc:
          "Need a missing element, OEM replacement or upgrade? We source genuine and quality-grade parts straight from EU suppliers.",
      },
      {
        tag: "/ 07",
        title: "Fast 24/7 response",
        desc:
          "An auto-quote in minutes, a manager on the line within the hour. Every request gets an answer the same day, weekends included.",
      },
    ],
    findACar: "find a car",
  },
  ru: {
    eyebrow: "Полный цикл",
    ourServices: "наши услуги",
    intro:
      "От аукциона до ключей в ваших руках — всё закрывает одна команда.",
    signatureBadge: "Ключевой сервис",
    featured: {
      tag: "/ 01",
      title: "Реальный осмотр и ручной подбор",
      desc:
        "Каждое авто проходит живой осмотр до отправки: толщина ЛКП, геометрия кузова, скрытая коррозия, электроника, жидкости, сверка VIN. Вы получаете именно то, что видели — без сюрпризов и подводных камней.",
      points: [
        "Очный осмотр + диагностический скан",
        "Поиск скрытых дефектов и перекрасов",
        "Полная история и сверка VIN",
        "Подбор под бюджет и ваш запрос",
      ],
    },
    cards: [
      {
        tag: "/ 02",
        title: "Доставка к дому",
        desc:
          "Привозим автомобиль в любой город России или Беларуси. Ключи получаете по своему адресу — без лишних поездок и таможенных очередей.",
      },
      {
        tag: "/ 03",
        title: "Таможня и стандарты",
        desc:
          "Полное таможенное оформление с документами под стандарты ЕС и ввоз в РФ или РБ. Все бумаги и отметки берём на себя.",
      },
      {
        tag: "/ 04",
        title: "Минимальный задаток",
        desc:
          "Старт по небольшому брони-платежу вместо полной предоплаты. Остаток — при получении. Гибкие условия под любой бюджет.",
      },
      {
        tag: "/ 05",
        title: "Оптимальный маршрут",
        desc:
          "Строим самый выгодный маршрут от аукционной площадки до вашей подъездной дорожки — баланс цены, сроков и таможенных окон.",
      },
      {
        tag: "/ 06",
        title: "Подбор запчастей",
        desc:
          "Нужна недостающая деталь, оригинал или апгрейд? Привозим качественные запчасти напрямую от европейских поставщиков.",
      },
      {
        tag: "/ 07",
        title: "Быстрый отклик 24/7",
        desc:
          "Авто-расчёт за минуты, менеджер на связи в течение часа. Каждая заявка получает ответ в тот же день — включая выходные.",
      },
    ],
    findACar: "найти машину",
  },
};

/* Map of lucide-react icon components, indexed by card position so the
 * data above stays icon-agnostic (easier to translate / re-order). */
const ICONS = [
  Truck,        // 02 — door-to-door delivery
  FileBadge,    // 03 — customs & standards
  Wallet,       // 04 — minimum deposit
  RouteIcon,    // 05 — optimal route
  Wrench,       // 06 — parts sourcing
  Zap,          // 07 — fast 24/7 response
];

const FrameComponent25 = ({ className = "" }) => {
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const navigate = useNavigate();
  const [gridRef, gridInView] = useInView();
  const [featuredRef, featuredInView] = useInView();

  return (
    <section
      className={[styles.servicesTitleWrapper, className].join(" ")}
      data-testid="our-services-section"
    >
      <div className={styles.servicesTitle}>
        {/* ── Heading block ──────────────────────────────────────── */}
        <div className={styles.headingBlock}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {t.eyebrow}
          </span>
          <AnimatedHeading
            as="h2"
            className={styles.ourServices}
            text={t.ourServices}
          />
          <p className={styles.intro}>{t.intro}</p>
        </div>

        {/* ── Featured card (signature service) ──────────────────── */}
        <article
          ref={featuredRef}
          className={`${styles.featuredCard} ${
            featuredInView ? styles.isVisible : ""
          }`}
          data-testid="services-featured-card"
        >
          <div className={styles.featuredBadge}>
            <Sparkles size={14} strokeWidth={2.2} />
            <span>{t.signatureBadge}</span>
          </div>

          <div className={styles.featuredInner}>
            <div className={styles.featuredContent}>
              <span className={styles.featuredTag}>{t.featured.tag}</span>
              <h3 className={styles.featuredTitle}>{t.featured.title}</h3>
              <p className={styles.featuredDesc}>{t.featured.desc}</p>

              <ul className={styles.featuredPoints}>
                {t.featured.points.map((p, i) => (
                  <li key={i} className={styles.featuredPoint}>
                    <span className={styles.featuredPointIcon}>
                      <CheckCircle2 size={18} strokeWidth={2.2} />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.featuredVisual} aria-hidden="true">
              <div className={styles.featuredVisualRing} />
              <div className={styles.featuredVisualRing2} />
              <div className={styles.featuredVisualGlow} />
              <ShieldCheck
                className={styles.featuredVisualIconMain}
                size={170}
                strokeWidth={1.4}
              />
              <Search
                className={styles.featuredVisualIconMini}
                size={42}
                strokeWidth={1.8}
              />
            </div>
          </div>
        </article>

        {/* ── 3×2 supporting services grid ───────────────────────── */}
        <div
          ref={gridRef}
          className={`${styles.servicesGrid} ${
            gridInView ? styles.isVisible : ""
          }`}
        >
          {t.cards.map((c, idx) => {
            const Icon = ICONS[idx] || Truck;
            return (
              <article
                key={c.tag}
                className={styles.serviceTile}
                style={{ "--enter-delay": `${idx * 80}ms` }}
                data-testid={`service-tile-${idx + 2}`}
              >
                <div className={styles.serviceTileTopRow}>
                  <span className={styles.serviceTileIcon}>
                    <Icon size={26} strokeWidth={1.7} />
                  </span>
                  <span className={styles.serviceTileTag}>{c.tag}</span>
                </div>

                <h3 className={styles.serviceTileTitle}>{c.title}</h3>
                <p className={styles.serviceTileDesc}>{c.desc}</p>

                <span className={styles.serviceTileArrow} aria-hidden="true">
                  <ArrowUpRight size={20} strokeWidth={2.2} />
                </span>
              </article>
            );
          })}
        </div>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <div className={styles.contactButtonService}>
          <BUTTON1
            property1="Default"
            cONTACTUS={t.findACar}
            showBUTTON
            bUTTONBackgroundColor="#F5F0E8"
            bUTTONWidth="459px"
            bUTTONBorder="none"
            bUTTONAlignSelf="unset"
            cONTACTUSColor="#feae00"
            cONTACTUSTextTransform="uppercase"
            onClick={() => navigate("/catalog")}
          />
        </div>
      </div>
    </section>
  );
};

export default FrameComponent25;
