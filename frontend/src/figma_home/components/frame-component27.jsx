import { useNavigate } from "react-router-dom";
import { useLang } from "../../i18n";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import { useGetInTouch } from "../../components/public/GetInTouchModal";
import styles from "./frame-component27.module.css";

/**
 * "Want to drive your dream car?" CTA section.
 *
 * Redesigned June 2026 (V3 — full-bleed editorial poster):
 *   • Full-width cinematic banner. No "card-inside-card" framing.
 *   • Background photo on the right, deep navy panel on the left,
 *     bridged by a soft gradient. Matches the same left padding as the
 *     rest of the homepage so the heading aligns with neighbours.
 *   • No DM Auto / BIBI logo overlay (removed per design feedback).
 *   • Copy uses neutral "European auctions" wording — no US / Korea
 *     references (only EU → Belarus / Russia route).
 */

const T = {
  en: {
    eyebrow: "// Let's get started",
    headPart1: "Want to drive",
    headPart2: "your dream car?",
    body:
      "Tell us what you're looking for — trim, color, budget. Our team will source the best match across European auctions and deliver it straight to your customs.",
    feature1: "No prepayment",
    feature2: "Free consultation",
    feature3: "Reply within 24h",
    contactUs: "Contact us",
    secondaryNote: "Or call us — we're online 24/7, Mon–Sun",
  },
  ru: {
    eyebrow: "// Начнём",
    headPart1: "Хотите водить",
    headPart2: "авто своей мечты?",
    body:
      "Расскажите, что вы ищете — комплектация, цвет, бюджет. Мы подберём лучший вариант на европейских аукционах и привезём прямо на вашу таможню.",
    feature1: "Без предоплат",
    feature2: "Бесплатная консультация",
    feature3: "Ответ в течение 24ч",
    contactUs: "Связаться с нами",
    secondaryNote: "Или позвоните — мы на связи 24/7, Пн–Вс",
  },
};

const FrameComponent27 = ({ className = "" }) => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const { open: openGetInTouch } = useGetInTouch();

  const handleContactClick = () => {
    if (typeof openGetInTouch === "function") {
      openGetInTouch();
      return;
    }
    navigate("/contacts#reach-out");
  };

  const [copyRef, copyIn] = useInView();

  return (
    <section
      className={[styles.section, className].join(" ")}
      aria-labelledby="dream-car-heading"
      style={{ backgroundImage: "url(/figma/young-woman-with-salesman-carshowroom-1@2x.webp)" }}
    >
      {/* Navy + amber wash that grounds the copy column over the photo */}
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.dotted} aria-hidden="true" />

      <div
        ref={copyRef}
        className={`${styles.inner} ${copyIn ? "is-visible" : ""}`}
      >
        <span className={`${styles.eyebrow} reveal reveal--fade-up`} style={{ animationDelay: "0ms" }}>
          {t.eyebrow}
        </span>

        <h2 id="dream-car-heading" className={styles.heading}>
          <AnimatedHeading as="span" className={styles.headingLine1} text={t.headPart1} />
          <AnimatedHeading
            as="span"
            className={styles.headingLine2}
            text={t.headPart2}
            baseDelay={t.headPart1.replace(/\s/g, "").length * 28}
          />
        </h2>

        <p className={`${styles.body} reveal reveal--fade-up`} style={{ animationDelay: "260ms" }}>
          {t.body}
        </p>

        <ul className={`${styles.features} reveal reveal--fade-up`} style={{ animationDelay: "360ms" }} role="list">
          {[t.feature1, t.feature2, t.feature3].map((label) => (
            <li key={label} className={styles.feature}>
              <span className={styles.featureCheck} aria-hidden="true">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.5l3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <div className={`${styles.ctaRow} reveal reveal--fade-up`} style={{ animationDelay: "480ms" }}>
          <button
            type="button"
            className={styles.ctaButton}
            onClick={handleContactClick}
            data-testid="dream-car-contact-us"
          >
            <span>{t.contactUs}</span>
            <svg className={styles.ctaArrow} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className={styles.secondaryNote}>{t.secondaryNote}</span>
        </div>
      </div>
    </section>
  );
};

export default FrameComponent27;
