import { useEffect, useRef, useState } from "react";
import styles from "./frame-component24.module.css";
import { useLang } from "../../i18n";

/**
 * FrameComponent24 — "Perfect Service / Идеальный сервис" v3 (compact row).
 *
 * v3 changes (per product owner):
 *   • Cards aligned in a single HORIZONTAL ROW (no more staircase).
 *   • Cards enter with a "displacement" animation: each card animates
 *     its `max-width` from 0 → 100% inside a flex row, which forces
 *     siblings to redistribute width as each card arrives. The cascade
 *     reads as "each card pushes the others into place" — exactly what
 *     the user asked for.
 *   • Section is materially shorter (header is horizontal instead of
 *     a sticky left column; cards row replaces 4 stacked rows).
 *   • Copy for steps 2 & 4 fixed:
 *       - Step 2  = "Place a small deposit" (advance is a SMALL deposit
 *         to lock the order, NOT the bulk payment at customs).
 *       - Step 4  = "Settle the balance & take the keys" (the full
 *         amount is paid only when the car physically arrives).
 */

/* ── inline SVG icons — custom set, intentionally NOT pins or maps ── */
const IconChoose = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 19l3-8a3 3 0 0 1 2.8-2h10.4A3 3 0 0 1 24 11l3 8" />
    <path d="M4 19h24v6a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-1H9v1a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1z" />
    <circle cx="9" cy="22.5" r="1.4" />
    <circle cx="23" cy="22.5" r="1.4" />
    <path d="M13 14h6" />
  </svg>
);

const IconDeposit = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* small coin slot / piggy-style deposit icon */}
    <rect x="5" y="11" width="22" height="14" rx="3" />
    <path d="M5 15h22" />
    <circle cx="22" cy="20" r="1.6" />
    <path d="M11 7l4-2 4 2" />
    <path d="M15 7v4" />
  </svg>
);

const IconSupport = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 20v-4a10 10 0 0 1 20 0v4" />
    <rect x="4" y="20" width="6" height="8" rx="2" />
    <rect x="22" y="20" width="6" height="8" rx="2" />
    <path d="M22 26h-2a4 4 0 0 1-4-4" />
    <circle cx="16" cy="22.5" r="1.2" />
  </svg>
);

const IconKeys = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="16" r="6" />
    <path d="M17 16h11" />
    <path d="M22 16v5" />
    <path d="M26 16v3" />
    <circle cx="11" cy="16" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

const ICONS = [IconChoose, IconDeposit, IconSupport, IconKeys];

const FrameComponent24 = ({ className = "" }) => {
  const { lang } = useLang();
  const isRu = lang === "ru";

  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }

    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.top < vh && rect.bottom > 0) {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setInView(true))
      );
      return () => cancelAnimationFrame(id);
    }

    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setInView(true));
      return () => cancelAnimationFrame(id);
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const T = isRu
    ? {
        eyebrow: "Наш процесс",
        rangeLabel: "01 — 04",
        title1: "Идеальный",
        title2: "сервис",
        title3: "от выбора до ключей",
        intro:
          "Прозрачный маршрут к вашему автомобилю — без авансов вслепую и без догадок.",
        metaA: "ШАГА",
        metaAVal: "4",
        metaB: "ПОДДЕРЖКА",
        metaBVal: "24 / 7",
        metaC: "РИСКИ",
        metaCVal: "0",
        metaD: "ГОРОДОВ РФ + РБ",
        metaDVal: "50+",
        steps: [
          {
            tag: "01 — Выбор",
            title: "Выберите автомобиль",
            desc: "Подбираем варианты под ваш стиль, бюджет и задачи. Никакого давления — только машина, которая подходит вам.",
          },
          {
            tag: "02 — Аванс",
            title: "Внесите небольшой аванс",
            desc: "Чтобы зафиксировать сделку, вы платите только аванс — а не полную сумму. Никаких рисков на старте.",
          },
          {
            tag: "03 — Связь",
            title: "Поддержка 24 / 7",
            desc: "Личный менеджер на связи в любое время. Сроки, документы, состояние авто — ответ за минуты.",
          },
          {
            tag: "04 — Финал",
            title: "Оплата и ключи",
            desc: "Остаток вносите только когда автомобиль уже у вас. Передаём машину в руки и закрываем все документы.",
          },
        ],
      }
    : {
        eyebrow: "Our process",
        rangeLabel: "01 — 04",
        title1: "Perfect",
        title2: "service",
        title3: "from pick to keys",
        intro:
          "A transparent route to your car — no blind deposits, no guessing.",
        metaA: "STEPS",
        metaAVal: "4",
        metaB: "SUPPORT",
        metaBVal: "24 / 7",
        metaC: "RISK",
        metaCVal: "0",
        metaD: "RU + BY CITIES",
        metaDVal: "50+",
        steps: [
          {
            tag: "01 — Pick",
            title: "Choose your car",
            desc: "We curate options that match your style, budget and goals. No pressure — only the car that genuinely fits you.",
          },
          {
            tag: "02 — Deposit",
            title: "Place a small deposit",
            desc: "We secure your order with just a small advance — not the full price. Zero risk at the start.",
          },
          {
            tag: "03 — Contact",
            title: "24 / 7 support",
            desc: "Your personal manager is always one tap away. Timing, docs, condition — answered within minutes.",
          },
          {
            tag: "04 — Final",
            title: "Settle & take the keys",
            desc: "You only pay the balance once the car is physically with you. We hand over the keys and close every detail.",
          },
        ],
      };

  const isVisibleClass = inView ? styles.isVisible : "";

  return (
    <section
      ref={sectionRef}
      className={[styles.wrap, isVisibleClass, className].join(" ")}
      data-testid="perfect-service-section"
    >
      {/* Decorative atmosphere — diagonal beam + grain */}
      <div className={styles.atmosphere} aria-hidden="true">
        <div className={styles.beam} />
        <div className={styles.grain} />
        <div className={styles.gridLines} />
      </div>

      <div className={styles.inner}>
        {/* ── Editorial header (horizontal, compact) ── */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDash} />
              <span className={styles.eyebrowText}>{T.eyebrow}</span>
            </div>
            <span className={styles.eyebrowRange}>{T.rangeLabel}</span>
          </div>

          <div className={styles.headerMain}>
            <h2 className={styles.title}>
              <span className={styles.titleLine}>{T.title1}</span>
              <span className={`${styles.titleLine} ${styles.titleAmber}`}>
                {T.title2}
              </span>
              <span className={styles.titleSmall}>{T.title3}</span>
            </h2>

            <div className={styles.headerSide}>
              <p className={styles.intro}>{T.intro}</p>
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{T.metaAVal}</span>
                  <span className={styles.metaLabel}>{T.metaA}</span>
                </div>
                <div className={styles.metaDivider} aria-hidden="true" />
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{T.metaBVal}</span>
                  <span className={styles.metaLabel}>{T.metaB}</span>
                </div>
                <div className={styles.metaDivider} aria-hidden="true" />
                <div className={styles.metaItem}>
                  <span className={styles.metaVal}>{T.metaCVal}</span>
                  <span className={styles.metaLabel}>{T.metaC}</span>
                </div>
                <div className={styles.metaDivider} aria-hidden="true" />
                <div className={styles.metaItem} data-testid="perfect-service-meta-cities">
                  <span className={styles.metaVal}>{T.metaDVal}</span>
                  <span className={styles.metaLabel}>{T.metaD}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Process cards: HORIZONTAL ROW with displacement entry ── */}
        <ol className={styles.steps}>
          {T.steps.map((step, i) => {
            const Icon = ICONS[i] || IconChoose;
            return (
              <li
                key={i}
                className={`${styles.step} ${styles[`stepIdx${i + 1}`]}`}
                data-testid={`perfect-service-step-${i + 1}`}
              >
                <div className={styles.stepInner}>
                  <span className={styles.stepNumeral} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className={styles.stepTop}>
                    <span className={styles.stepTag}>
                      <Icon className={styles.stepIcon} />
                      <span className={styles.stepTagText}>{step.tag}</span>
                    </span>
                  </div>

                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>

                  <span className={styles.stepFootRule} aria-hidden="true" />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default FrameComponent24;
