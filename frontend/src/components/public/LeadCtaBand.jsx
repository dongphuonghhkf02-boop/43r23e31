/**
 * LeadCtaBand — re-usable bottom CTA section.
 *
 * Visual & behavioural twin of the bottom block on SingleCarPage:
 *   • Navy → deep-navy gradient card, cream copy, amber pill CTA.
 *   • Amber radial glow in the top-right corner for warmth.
 *   • Clicking the CTA opens the global GetInTouchModal so the
 *     manager receives a real lead via /api/public/lead-requests.
 *
 * Used by:
 *   • CalculatorPage  (source="calculator_page")
 *   • ContactsPage    (source="contacts_page")
 *   • SingleCarPage   (kept inline for now — same look/feel)
 */
import React from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useLang } from "../../i18n";
import { useGetInTouch } from "./GetInTouchModal";
import styles from "./LeadCtaBand.module.css";

const COPY = {
  ru: {
    eyebrow: "Индивидуальный расчёт",
    title: "Готовы начать поиск?",
    text: "Оставьте контакты — менеджер свяжется в течение 15 минут, уточнит детали и пришлёт расчёт под ключ.",
    cta: "Связаться с менеджером",
  },
  en: {
    eyebrow: "Personal quote",
    title: "Ready to start?",
    text: "Leave your contact — our manager will reach out within 15 minutes, confirm the details and send a turnkey quote.",
    cta: "Contact the manager",
  },
};

export default function LeadCtaBand({
  source = "page_cta",
  carPreference = "",
  titleRu,
  titleEn,
  textRu,
  textEn,
  ctaRu,
  ctaEn,
  className = "",
  testId = "lead-cta-band",
}) {
  const { lang } = useLang();
  const isRu = lang === "ru";
  const t = isRu ? COPY.ru : COPY.en;

  const title = (isRu ? titleRu : titleEn) || t.title;
  const text = (isRu ? textRu : textEn) || t.text;
  const cta = (isRu ? ctaRu : ctaEn) || t.cta;

  const { open: openGetInTouch } = useGetInTouch();

  const onOpen = () => {
    openGetInTouch?.({
      source,
      car_preference: carPreference || "",
      title,
      subtitle: text,
    });
  };

  return (
    <section className={`${styles.leadSection} ${className}`} data-testid={testId}>
      <div className={styles.leadCard}>
        <div className={styles.leadCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDash} aria-hidden="true" />
            <span className={styles.eyebrowText}>{t.eyebrow}</span>
          </div>
          <h2 className={styles.leadTitle}>{title}</h2>
          <p className={styles.leadText}>{text}</p>
        </div>
        <button
          type="button"
          className={styles.leadBtn}
          onClick={onOpen}
          data-testid={`${testId}-cta`}
        >
          {cta}
          <ArrowRight size={18} weight="bold" />
        </button>
      </div>
    </section>
  );
}
