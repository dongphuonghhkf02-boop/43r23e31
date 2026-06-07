import { useLang } from "../../i18n";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import styles from "./frame-component26.module.css";

/**
 * "Why You Pay Less — And Get More" / Advantages section.
 *
 * Redesigned June 2026 (V3 — editorial layout):
 *   • Full-bleed cream section, matches the same left padding as the rest
 *     of the homepage (Reviews, Before-After, How we deliver).
 *   • Magazine-style composition: huge headline, oversized rotated
 *     watermark wordmark, and a hero UVP centerpiece that carries the
 *     wow-factor (we pay first, you pay on customs arrival).
 *   • 4 editorial pull-quote advantages around the centerpiece (the 5-step
 *     inspection lives in the "How we deliver" section above so we don't
 *     duplicate it here).
 */

const T = {
  en: {
    advantagesWordmark: "advantages",
    carWordmark: "promise",
    headPart1: "Why You Pay Less",
    headPart2: "— And Get More",
    promiseLabel: "// Our promise",
    promiseTitle1: "Minimal prepayment —",
    promiseTitle2: "the rest when the car is at customs.",
    promiseBody:
      "Every buyout and every shipment is financed by DM Auto from our own capital. Only a small advance up front to lock in your order — the balance is settled after the vehicle physically arrives at your customs office.",
    badge1: "Minimal prepayment",
    badge2: "Pay after arrival",
    advantages: [
      {
        no: "01",
        title: "Wide selection",
        body:
          "Thousands of configurations, colors and rare trims that simply don't exist on the local market.",
      },
      {
        no: "02",
        title: "Best trim levels",
        body:
          "More options, premium multimedia and a higher level of comfort across every vehicle we source.",
      },
      {
        no: "03",
        title: "Transparent history",
        body:
          "Full VIN reports (AutoDNA, Mobile.de) attached to every car — you see the past before you commit.",
      },
      {
        no: "04",
        title: "Significantly cheaper",
        body:
          "Even with shipping and customs, the final price stays 20–50% below the local market.",
      },
    ],
  },
  ru: {
    advantagesWordmark: "преимущества",
    carWordmark: "обещание",
    headPart1: "Плати меньше",
    headPart2: "— получай больше",
    promiseLabel: "// Наше обещание",
    promiseTitle1: "Минимальная предоплата —",
    promiseTitle2: "остальное, когда авто на таможне.",
    promiseBody:
      "Каждый выкуп и каждый пригон DM Auto финансирует из собственных средств. Только небольшой аванс на старте, чтобы зафиксировать заказ — основная сумма после того, как автомобиль физически прибыл на вашу таможню.",
    badge1: "Минимальная предоплата",
    badge2: "Оплата после прибытия",
    advantages: [
      {
        no: "01",
        title: "Большой выбор",
        body:
          "Тысячи комплектаций, цветов и редких моделей, которых просто нет на местном рынке.",
      },
      {
        no: "02",
        title: "Лучшие комплектации",
        body:
          "Больше опций, премиум-мультимедиа и более высокий уровень комфорта.",
      },
      {
        no: "03",
        title: "Прозрачная история",
        body:
          "Полные отчёты по VIN (AutoDNA, Mobile.de) на каждом авто — вы видите историю до покупки.",
      },
      {
        no: "04",
        title: "Значительно дешевле",
        body:
          "Даже с доставкой и таможней итоговая цена остаётся на 20–50% ниже местного рынка.",
      },
    ],
  },
};

const FrameComponent26 = ({ className = "" }) => {
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const [headRef, headIn] = useInView();
  const [centerRef, centerIn] = useInView();
  const [listRef, listIn] = useInView();

  return (
    <section className={[styles.section, className].join(" ")} aria-labelledby="adv-heading">
      {/* DM Auto brandmark, subtly placed top-right of the block */}
      <img
        src="/figma/dm-auto-logo.png"
        alt="DM Auto"
        className={styles.brandMark}
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget;
          if (el && !el.dataset.fb) {
            el.dataset.fb = "1";
            el.src = "/figma/BiBi-logo-02-1.svg";
          } else {
            el.style.display = "none";
          }
        }}
      />

      <div className={styles.inner}>
        {/* ── Section header ────────────────────────────────────────────── */}
        <header
          ref={headRef}
          className={`${styles.header} ${headIn ? "is-visible" : ""}`}
        >
          <span className={`${styles.advantagesLabel} reveal reveal--fade-up`} style={{ animationDelay: "0ms" }}>
            / {t.advantagesWordmark}
          </span>
          <h2 id="adv-heading" className={styles.heading}>
            <AnimatedHeading as="span" className={styles.headingLine1} text={t.headPart1} />
            <AnimatedHeading
              as="span"
              className={styles.headingLine2}
              text={t.headPart2}
              baseDelay={t.headPart1.replace(/\s/g, "").length * 28}
            />
          </h2>
        </header>

        {/* ── UVP editorial centerpiece ─────────────────────────────────────── */}
        <article
          ref={centerRef}
          className={`${styles.promise} ${centerIn ? "is-visible" : ""}`}
        >
          <div className={styles.promiseFrame}>
            <span className={`${styles.promiseLabel} reveal reveal--fade-up`} style={{ animationDelay: "120ms" }}>
              {t.promiseLabel}
            </span>

            <h3 className={styles.promiseTitle}>
              <AnimatedHeading
                as="span"
                className={styles.promiseTitleLine1}
                text={t.promiseTitle1}
                baseDelay={120}
              />
              <AnimatedHeading
                as="span"
                className={styles.promiseTitleLine2}
                text={t.promiseTitle2}
                baseDelay={120 + t.promiseTitle1.replace(/\s/g, "").length * 28}
              />
            </h3>

            <p className={`${styles.promiseBody} reveal reveal--fade-up`} style={{ animationDelay: "360ms" }}>
              {t.promiseBody}
            </p>

            <ul className={`${styles.promiseBadges} reveal reveal--fade-up`} style={{ animationDelay: "460ms" }} role="list">
              <li className={styles.promiseBadge}>
                <span className={styles.promiseBadgeDot} aria-hidden="true" />
                {t.badge1}
              </li>
              <li className={styles.promiseBadge}>
                <span className={styles.promiseBadgeDot} aria-hidden="true" />
                {t.badge2}
              </li>
            </ul>
          </div>

          {/* Decorative seal / promise emblem (right side on desktop) */}
          <div className={styles.promiseSeal} aria-hidden="true">
            <div className={styles.sealRing}>
              <svg viewBox="0 0 220 220" className={styles.sealRingSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <path id="sealPath26" d="M 110 110 m -86 0 a 86 86 0 1 1 172 0 a 86 86 0 1 1 -172 0" />
                </defs>
                <text className={styles.sealText} fontSize="15" letterSpacing="5">
                  <textPath href="#sealPath26" startOffset="0">
                    {"• PAY AFTER ARRIVAL • FINANCED BY DM AUTO • MINIMAL PREPAYMENT "}
                  </textPath>
                </text>
              </svg>
            </div>
            <div className={styles.sealCore}>
              <svg viewBox="0 0 96 96" className={styles.sealIcon} fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 8 12 22v22c0 18 14 36 36 44 22-8 36-26 36-44V22L48 8Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                <path d="M34 48l10 10 18-22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </article>

        {/* ── 4 editorial pull-quote advantages ───────────────────────────────── */}
        <ul
          ref={listRef}
          className={`${styles.pullquotes} ${listIn ? "is-visible" : ""}`}
          role="list"
        >
          {t.advantages.map((it, i) => (
            <li
              key={it.no}
              className={`${styles.pullquote} reveal reveal--fade-up`}
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <div className={styles.pullquoteHeader}>
                <span className={styles.pullquoteNo}>{it.no}</span>
                <span className={styles.pullquoteSlash} aria-hidden="true">/</span>
              </div>
              <h4 className={styles.pullquoteTitle}>{it.title}</h4>
              <p className={styles.pullquoteBody}>{it.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FrameComponent26;
