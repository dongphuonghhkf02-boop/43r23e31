import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLang } from "../../i18n";
import { useTiltParallax } from "../../components/useTiltParallax";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import styles from "./frame-component23.module.css";

/**
 * "Three ways we work" — recomposed June 2026.
 *
 * What changed vs. the previous Figma frame:
 *   • Title moved from "How we work" to "Three formats of partnership"
 *     (clearer signal: it's a service-tier picker, not a process flow).
 *   • Sub-tag with `[ … ]` brackets replaced by an L-shaped corner-tick
 *     plate, matching the calculator block's design language.
 *   • Card numbering [1] [2] [3] → big outlined "01 / 02 / 03" chapter
 *     numerals with a thin amber underline.
 *   • Each card now ships a 3-bullet feature list (clearer scope) and a
 *     pointed one-liner CTA tagline at the bottom.
 *   • Copy redone around real EU→BG car-import value: who picks the car,
 *     who inspects, who handles customs / registration, who supports
 *     after delivery.
 *   • Bottom "Contact us" card rewritten to a stronger primary action
 *     "Get a free consultation" + phones.
 */

const T = {
  en: {
    title: "Three ways we work",
    tagLine1: "FROM PURE LOGISTICS TO FULL TURNKEY",
    tagLine2: "PICK THE LEVEL OF SERVICE THAT FITS",

    // ── Card 1 — Partner / self-serve
    card1Tag: "Partner",
    card1Title: "You pick. We bring.",
    card1Desc:
      "You've already found the car on an EU auction or dealer. We take it from there — transport, customs, paperwork, doorstep delivery.",
    card1Features: [
      "EU road transport",
      "Customs & VAT paperwork",
      "Door-to-door drop-off",
    ],
    card1Cta: "Just hand us the lot link.",

    // ── Card 2 — Expert match (popular)
    card2Tag: "Expert match",
    popular: "most chosen",
    card2Title: "Tell budget. Get the car.",
    card2Desc:
      "We hunt across European auctions and trusted dealers. Pre-purchase inspection on every short-list car — no hidden damage, no rolled-back odometer.",
    card2Features: [
      "Budget-based hand-pick",
      "Pre-purchase inspection",
      "Negotiation + delivery",
    ],
    card2Cta: "Arrives transparent — top to bottom.",

    // ── Card 3 — Turnkey
    card3Tag: "Turnkey",
    card3Title: "Keys in hand. Plate on.",
    card3Desc:
      "Hands-off, end-to-end. Everything from card 2 plus customs clearance, registration in Belarus or Russia, technical inspection and 30-day post-delivery support.",
    card3Features: [
      "Everything in Expert",
      "Registration + local plates",
      "30-day after-care",
    ],
    card3Cta: "Walk up. Drive away.",

    // ── Bottom contact box
    bottomTitle: "Not sure which one is yours?",
    bottomSubtitle: "Tell us your budget. We'll match the right format in 5 minutes — no commitment.",
    bottomCta: "Get a free consultation →",
  },
  ru: {
    title: "Три формата сотрудничества",
    tagLine1: "ОТ ПРОСТОЙ ДОСТАВКИ ДО ПОЛНОГО «ПОД КЛЮЧ»",
    tagLine2: "ВЫБЕРИТЕ ГЛУБИНУ СЕРВИСА ПОД ВАШ РИТМ",

    // ── Card 1 — Партнёр / Самостоятельный
    card1Tag: "Партнёр",
    card1Title: "Вы выбрали — мы привезли.",
    card1Desc:
      "Машину вы уже нашли — на аукционе или у европейского дилера. Мы берём на себя транспорт, таможню, оформление и доставку прямо к вам.",
    card1Features: [
      "Транспорт по ЕС",
      "Таможенное оформление",
      "Доставка к двери",
    ],
    card1Cta: "Просто пришлите ссылку на лот.",

    // ── Card 2 — Эксперт (популярный)
    card2Tag: "Эксперт",
    popular: "выбирают чаще",
    card2Title: "Назовите бюджет — получите машину.",
    card2Desc:
      "Подбираем по Европе: аукционы и проверенные дилеры. Pre-purchase осмотр каждого кандидата — никаких скрытых ДТП и смотанного пробега.",
    card2Features: [
      "Подбор по бюджету и вкусу",
      "Осмотр перед покупкой",
      "Торг, выкуп и доставка",
    ],
    card2Cta: "Приезжает машина — и вы знаете о ней всё.",

    // ── Card 3 — Под ключ
    card3Tag: "Под ключ",
    card3Title: "Ключи в руке. Номера на бампере.",
    card3Desc:
      "Полностью без вашего участия. Всё из «Эксперта» плюс таможенная очистка, регистрация в Беларуси или России, техосмотр и поддержка 30 дней после передачи.",
    card3Features: [
      "Всё из «Эксперта»",
      "Регистрация и местные номера",
      "Поддержка 30 дней",
    ],
    card3Cta: "Подходите — и сразу за руль.",

    // ── Bottom contact box
    bottomTitle: "Не знаете, какой формат ваш?",
    bottomSubtitle: "Назовите бюджет — за 5 минут подскажем подходящий формат. Без обязательств.",
    bottomCta: "Получить бесплатную консультацию →",
  },
};

const FrameComponent23 = ({ className = "" }) => {
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const cardsRef = useRef(null);
  useTiltParallax(cardsRef, {
    cardsSelector: ":scope > article",
    skipEntry: true,
  });
  useEffect(() => {
    const node = cardsRef.current;
    if (!node) return undefined;
    const cards = node.querySelectorAll(":scope > article");
    const onEnd = (e) => {
      if (e.animationName && e.animationName.toLowerCase().includes("reveal")) {
        e.currentTarget.style.animation = "none";
      }
    };
    cards.forEach((c) => c.addEventListener("animationend", onEnd));
    return () => cards.forEach((c) => c.removeEventListener("animationend", onEnd));
  }, []);
  const [rowObsRef, rowInView] = useInView();
  const setRowRef = (node) => {
    cardsRef.current = node;
    rowObsRef.current = node;
  };

  const cards = [
    {
      key: "partner",
      tag: t.card1Tag,
      title: t.card1Title,
      desc: t.card1Desc,
      features: t.card1Features,
      cta: t.card1Cta,
      popular: false,
      variant: "light",
    },
    {
      key: "expert",
      tag: t.card2Tag,
      title: t.card2Title,
      desc: t.card2Desc,
      features: t.card2Features,
      cta: t.card2Cta,
      popular: true,
      variant: "dark",
    },
    {
      key: "turnkey",
      tag: t.card3Tag,
      title: t.card3Title,
      desc: t.card3Desc,
      features: t.card3Features,
      cta: t.card3Cta,
      popular: false,
      variant: "light",
    },
  ];

  return (
    <section className={[styles.howWeWorkSection, className].join(" ")} data-testid="three-ways-block">
      <div className={styles.inner}>
        {/* ── Top: title + sub-tag with corner ticks ───────────────── */}
        <header className={styles.topRow}>
          <AnimatedHeading as="h2" className={styles.howWeWork} text={t.title} />

          <div className={styles.subTagPlate} data-testid="three-ways-subtag">
            <span className={styles.subTagAccent} aria-hidden="true" />
            <span className={styles.subTagStack}>
              <span className={styles.subTagLine1}>{t.tagLine1}</span>
              <span className={styles.subTagLine2}>{t.tagLine2}</span>
            </span>
          </div>
        </header>

        {/* ── Cards row ────────────────────────────────────────────── */}
        <div
          ref={setRowRef}
          className={`${styles.cardsRow} tilt-scope ${rowInView ? "is-visible" : ""}`}
          data-stagger="80"
          style={{ "--stagger-step": "140ms" }}
        >
          {cards.map((c, i) => (
            <article
              key={c.key}
              data-tilt-card
              data-testid={`tier-card-${c.key}`}
              className={[
                styles.card,
                c.variant === "dark" ? styles.cardDark : styles.cardLight,
                c.popular ? styles.cardPopular : "",
              ].filter(Boolean).join(" ")}
            >
              {/* Corner ticks (amber on dark, navy on light) */}
              <span className={`${styles.cornerTick} ${styles.cornerTL}`} aria-hidden="true" />
              <span className={`${styles.cornerTick} ${styles.cornerBR}`} aria-hidden="true" />

              <div className={styles.cardTop}>
                <div className={styles.stepBlock}>
                  <span className={styles.stepNum}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.stepSlash}>/ 03</span>
                  <span className={styles.stepUnderline} aria-hidden="true" />
                </div>
                {c.popular && (
                  <span className={styles.popularPill}>
                    <span className={styles.popularDot} aria-hidden="true" />
                    {t.popular}
                  </span>
                )}
              </div>

              <span className={styles.cardTag}>{c.tag}</span>

              <h3 className={styles.cardTitle}>{c.title}</h3>

              <p className={styles.cardDesc}>{c.desc}</p>

              <ul className={styles.featureList}>
                {c.features.map((f) => (
                  <li key={f} className={styles.featureItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="m5 12 5 5L20 7"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <p className={styles.cardCta}>{c.cta}</p>
            </article>
          ))}
        </div>

        {/* ── Bottom CTA panel ─────────────────────────────────────── */}
        <div className={styles.questionWrap}>
          <div className={styles.questionCard}>
            <span className={`${styles.cornerTick} ${styles.cornerTL} ${styles.cornerOnQuestion}`} aria-hidden="true" />
            <span className={`${styles.cornerTick} ${styles.cornerBR} ${styles.cornerOnQuestion}`} aria-hidden="true" />

            <div className={styles.questionContent}>
              <h3 className={styles.questionTitle}>{t.bottomTitle}</h3>
              <p className={styles.questionSubtitle}>{t.bottomSubtitle}</p>

              <div className={styles.questionRow}>
                <Link to="/contacts#reach-out" className={styles.questionCta} data-testid="three-ways-consult">
                  {t.bottomCta}
                </Link>
                <div className={styles.questionPhones}>
                  <a href="tel:+359875313158" className={styles.questionPhone}>+359 875 313 158</a>
                  <span className={styles.questionPhoneSep} aria-hidden="true">·</span>
                  <a href="tel:+359897884804" className={styles.questionPhone}>+359 897 884 804</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FrameComponent23;
