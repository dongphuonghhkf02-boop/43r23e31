/**
 * TurnkeyBanner1 — "Как мы доставляем автомобиль под ключ"
 *
 * Полностью переработанный блок (декабрь 2026):
 *   • Убран фон с аэро-фото дороги — секция следует общему cream-стилю сайта.
 *   • Убран дубль Germany/Europe — Германия и так Европа. Маршрут показан
 *     один раз: «Европа → Беларусь · Россия».
 *   • Пять шагов оформлены как connected timeline: на десктопе горизонтальная
 *     лента с chevron-разделителями, на мобайле — вертикальный stack.
 *   • Каждый шаг получил Lucide-иконку, бракет-нумерацию [01]…[05]
 *     и понятный русский/английский копирайт (без штампов «MILD центр» и пр.).
 *   • Внизу — CTA-ряд: подобрать автомобиль + Telegram-канал
 *     (+ быстрые ссылки на WhatsApp и Avito).  Viber удалён из системы
 *     полностью — основной канал теперь Telegram, второй — WhatsApp,
 *     публичный track-record — Avito.
 *
 * Дизайн-язык повторяет HowWeWorkBlock и остальные секции главной:
 *   cream-paper фон (--bg-base), navy-accent (--accent-brand),
 *   приподнятые карточки на --bg-elevated, скобочная типографика.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Send,
  ClipboardCheck,
  Eye,
  Handshake,
  Truck,
  ChevronRight,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { useLang } from "../../i18n";
import AnimatedHeading from "../../components/AnimatedHeading";
import useInView from "../../components/useInView";
import { SOCIAL_DEFAULTS, getSocial } from "../../lib/socials";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";
const SITE_INFO_CACHE = "__bibi_site_info_promise__";

function fetchSiteInfo() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!window[SITE_INFO_CACHE]) {
    window[SITE_INFO_CACHE] = axios
      .get(`${API_URL}/api/site-info`)
      .then((r) => r.data)
      .catch(() => null);
  }
  return window[SITE_INFO_CACHE];
}

const DEFAULT_TELEGRAM_URL = SOCIAL_DEFAULTS.telegram.url;

/** Copy: 5 steps in EN + RU, written naturally, without redundancy. */
const T = {
  en: {
    eyebrow: "TURNKEY DELIVERY",
    titleLine1: "How we deliver",
    titleLine2: "your car turnkey",
    tagline:
      "Five clear steps, one contract — from sourcing in Europe to handing you the keys at your door.",
    routeFrom: "Europe",
    routeTo: "Russia & Belarus",
    routeLabel: "Route",
    routeSubtitle: "Direct delivery to your door",
    cityMarqueeLabel: "We deliver to",
    cities: [
      "Moscow",
      "Saint Petersburg",
      "Kazan",
      "Yekaterinburg",
      "Novosibirsk",
      "Nizhny Novgorod",
      "Krasnodar",
      "Rostov-on-Don",
      "Sochi",
      "Voronezh",
      "Samara",
      "Ufa",
      "Kaliningrad",
      "Vladivostok",
      "Minsk",
      "Brest",
      "Gomel",
      "Grodno",
      "Mogilev",
      "Vitebsk",
    ],
    steps: [
      {
        title: "Request & brief",
        desc:
          "You tell us the budget, model and key requirements. We agree the brief and propose a shortlist of live lots.",
      },
      {
        title: "Quality assessment",
        desc:
          "We verify mileage, accident history, ownership records and condition — so you never bid blind.",
      },
      {
        title: "Inspection on site",
        desc:
          "Our team drives out to the car, takes detailed photos and a walk-around video, and signs off only if it is genuinely worth your money.",
      },
      {
        title: "Purchase & pickup",
        desc:
          "We close the deal with the seller or auction, pay, collect the documents and pick the car up from the lot.",
      },
      {
        title: "Delivery to your door",
        desc:
          "Road transport across Europe, full customs clearance and door-to-door delivery to any major city in Russia or Belarus.",
      },
    ],
    ctaTitle: "Ready to start?",
    ctaSub: "Pick a car from the live catalogue — we'll handle the rest.",
    ctaButton: "Choose a car",
    chatTitle: "Talk to a manager",
    chatSub: "We answer in Telegram and WhatsApp within minutes during working hours.",
    chatTelegram: "Open Telegram",
    chatWhatsapp: "WhatsApp",
    chatAvito: "View on Avito",
  },
  ru: {
    eyebrow: "ДОСТАВКА ПОД КЛЮЧ",
    titleLine1: "Как мы доставляем",
    titleLine2: "автомобиль под ключ",
    tagline:
      "Пять понятных шагов и один договор — от подбора в Европе до передачи ключей у вашей двери.",
    routeFrom: "Европа",
    routeTo: "Россия и Беларусь",
    routeLabel: "Маршрут",
    routeSubtitle: "Прямая доставка к вашей двери",
    cityMarqueeLabel: "Доставляем в",
    cities: [
      "Москва",
      "Санкт-Петербург",
      "Казань",
      "Екатеринбург",
      "Новосибирск",
      "Нижний Новгород",
      "Краснодар",
      "Ростов-на-Дону",
      "Сочи",
      "Воронеж",
      "Самара",
      "Уфа",
      "Калининград",
      "Владивосток",
      "Минск",
      "Брест",
      "Гомель",
      "Гродно",
      "Могилёв",
      "Витебск",
    ],
    steps: [
      {
        title: "Заявка и бриф",
        desc:
          "Вы оставляете запрос: бюджет, модель, ключевые пожелания. Мы согласуем задачу и предлагаем шорт-лист актуальных лотов.",
      },
      {
        title: "Оценка качества",
        desc:
          "Проверяем пробег, историю ДТП, владельцев и состояние авто. Никаких покупок вслепую — только цифры и факты.",
      },
      {
        title: "Осмотр на месте",
        desc:
          "Наш специалист едет к автомобилю: подробные фото, видео-обход, экспертная оценка вживую. Сделка идёт дальше только если машина действительно того стоит.",
      },
      {
        title: "Покупка и выкуп",
        desc:
          "Закрываем сделку с продавцом или аукционом, оплачиваем, оформляем документы и забираем автомобиль со стоянки.",
      },
      {
        title: "Доставка до двери",
        desc:
          "Автовоз по Европе, полное таможенное оформление и доставка прямо к двери в любом крупном городе России или Беларуси.",
      },
    ],
    ctaTitle: "Готовы начать?",
    ctaSub: "Выберите автомобиль в каталоге — остальное мы возьмём на себя.",
    ctaButton: "Подобрать автомобиль",
    chatTitle: "Связаться с менеджером",
    chatSub: "Отвечаем в Telegram и WhatsApp в течение нескольких минут в рабочее время.",
    chatTelegram: "Открыть Telegram",
    chatWhatsapp: "WhatsApp",
    chatAvito: "Профиль на Авито",
  },
};

const STEP_ICONS = [Send, ClipboardCheck, Eye, Handshake, Truck];

const Bracket = ({ children, className = "" }) => (
  <span className={`inline-flex items-center gap-1.5 ${className}`}>
    <span className="font-light leading-none select-none">[</span>
    <span>{children}</span>
    <span className="font-light leading-none select-none">]</span>
  </span>
);

const TurnkeyBanner1 = ({ className = "" }) => {
  const [siteInfo, setSiteInfo] = useState(null);
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;

  useEffect(() => {
    let cancelled = false;
    fetchSiteInfo().then((info) => {
      if (cancelled || !info) return;
      setSiteInfo(info);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const telegram = getSocial(siteInfo, "telegram");
  const whatsapp = getSocial(siteInfo, "whatsapp");
  const avito = getSocial(siteInfo, "avito");
  const telegramUrl = telegram.url || DEFAULT_TELEGRAM_URL;

  // Staggered reveal trigger for the timeline.
  const [stepsRef, stepsInView] = useInView({ threshold: 0.15 });

  return (
    <section
      className={`bg-[var(--bg-base)] py-20 lg:py-28 ${className}`}
      data-testid="turnkey-banner-section"
    >
      <div className="max-w-[1920px] mx-auto px-6 lg:px-[100px]">
        {/* ── HEADER ROW ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-14 lg:mb-20">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-5 text-[11px] tracking-[0.18em] text-[var(--accent-brand)] font-semibold uppercase">
              <span className="inline-block w-6 h-px bg-[var(--accent-brand)]" />
              <Bracket className="text-[12px]">{t.eyebrow}</Bracket>
            </div>

            <h2
              className="font-bold uppercase text-[var(--accent-brand)] leading-[0.95]"
              style={{ fontSize: "clamp(34px, 4.6vw, 72px)" }}
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
              className="mt-6 text-[var(--text-secondary)] max-w-[640px]"
              style={{ fontSize: "clamp(15px, 1.05vw, 18px)", lineHeight: 1.55 }}
            >
              {t.tagline}
            </p>
          </div>

          {/* Route badge — replaces the old Germany / Europe duplicate */}
          <div className="lg:col-span-4 lg:justify-self-end w-full max-w-[420px]">
            <div className="border border-[var(--accent-brand)]/20 rounded-md bg-[var(--bg-elevated)] p-6 shadow-[0_2px_24px_-12px_rgba(22,46,81,0.25)]">
              <div className="text-[10px] tracking-[0.22em] uppercase text-[var(--text-secondary)] font-semibold mb-4">
                <Bracket>{t.routeLabel}</Bracket>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-1">
                    A
                  </div>
                  <div className="text-[20px] md:text-[22px] font-bold text-[var(--accent-brand)] leading-tight">
                    {t.routeFrom}
                  </div>
                </div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--accent-brand)] flex items-center justify-center">
                  <ArrowRight size={20} className="text-[var(--bg-elevated)]" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] mb-1">
                    B
                  </div>
                  <div className="text-[20px] md:text-[22px] font-bold text-[var(--accent-brand)] leading-tight">
                    {t.routeTo}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CITY MARQUEE ───────────────────────────────────────────
            Light, single-line strip listing the major Russian cities we
            ship to. Sits between the header row and the 5-step timeline
            so the "delivery coverage" UVP is felt without adding a new
            full-blown section. */}
        <div
          data-testid="turnkey-city-marquee"
          className="relative -mt-4 mb-14 lg:mb-16 overflow-hidden rounded-md border border-[var(--accent-brand)]/15 bg-[var(--bg-elevated)]"
          aria-label={t.cityMarqueeLabel}
        >
          <div className="flex items-center gap-4 py-3 px-4 lg:px-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-semibold text-[var(--accent-brand)] whitespace-nowrap flex-shrink-0">
              <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[var(--accent-brand)]" />
              {t.cityMarqueeLabel}
            </div>
            {/* Edge fades */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-[160px] w-12 bg-gradient-to-r from-[var(--bg-elevated)] to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--bg-elevated)] to-transparent z-10"
            />
            <div className="relative flex-1 overflow-hidden">
              <div className="turnkey-city-marquee-track flex gap-2.5 whitespace-nowrap will-change-transform">
                {/* Repeat the city list twice so the loop reads as a
                    continuous strip with no visible seam. */}
                {[...t.cities, ...t.cities].map((city, idx) => (
                  <span
                    key={`${city}-${idx}`}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent-brand)]/85 px-3 py-1.5 rounded-full border border-[var(--accent-brand)]/15 bg-[var(--bg-base)]"
                  >
                    <span className="inline-flex w-1 h-1 rounded-full bg-[var(--accent-brand)]/60" />
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Inline keyframes scoped to this component instance only. */}
          <style>{`
            .turnkey-city-marquee-track {
              animation: turnkeyCityMarquee 38s linear infinite;
            }
            @keyframes turnkeyCityMarquee {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @media (prefers-reduced-motion: reduce) {
              .turnkey-city-marquee-track { animation: none; }
            }
          `}</style>
        </div>

        {/* ── TIMELINE ───────────────────────────────────────────── */}
        <div ref={stepsRef} className="relative">
          {/* Continuous baseline (decorative) — desktop only */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute left-0 right-0 top-[78px] h-px bg-gradient-to-r from-transparent via-[var(--accent-brand)]/25 to-transparent"
          />

          <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-4 relative">
            {t.steps.map((step, i) => {
              const Icon = STEP_ICONS[i];
              const num = String(i + 1).padStart(2, "0");
              const delay = stepsInView ? `${i * 110}ms` : "0ms";
              return (
                <li
                  key={i}
                  className="relative"
                  style={{
                    opacity: stepsInView ? 1 : 0,
                    transform: stepsInView ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 520ms ease ${delay}, transform 620ms cubic-bezier(0.2,0.7,0.2,1) ${delay}`,
                  }}
                >
                  {/* Chevron connector — desktop, between items only */}
                  {i < t.steps.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden lg:flex absolute -right-3 top-[64px] w-6 h-6 items-center justify-center z-10"
                    >
                      <div className="w-6 h-6 rounded-full bg-[var(--bg-base)] border border-[var(--accent-brand)]/30 flex items-center justify-center">
                        <ChevronRight
                          size={12}
                          className="text-[var(--accent-brand)]"
                        />
                      </div>
                    </div>
                  )}

                  <article className="group h-full bg-[var(--bg-elevated)] border border-[var(--accent-brand)]/10 rounded-md p-6 lg:p-7 flex flex-col transition-all duration-300 hover:border-[var(--accent-brand)]/30 hover:shadow-[0_8px_32px_-12px_rgba(22,46,81,0.25)] hover:-translate-y-1">
                    {/* Top row: bracket number + icon */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="text-[var(--accent-brand)] font-bold text-[20px] tracking-tight leading-none">
                        <Bracket>{num}</Bracket>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-brand)]/8 flex items-center justify-center transition-colors group-hover:bg-[var(--accent-brand)] group-hover:text-[var(--bg-elevated)]">
                        <Icon
                          size={18}
                          className="text-[var(--accent-brand)] transition-colors group-hover:text-[var(--bg-elevated)]"
                          strokeWidth={1.8}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="font-bold text-[var(--accent-brand)] leading-tight mb-3 min-h-[3em]"
                      style={{ fontSize: "clamp(17px, 1.25vw, 21px)" }}
                    >
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-[var(--text-secondary)] leading-relaxed"
                      style={{ fontSize: "clamp(13px, 0.95vw, 15px)" }}
                    >
                      {step.desc}
                    </p>

                    {/* Underline accent — appears on hover */}
                    <div className="mt-auto pt-6">
                      <div className="h-px bg-[var(--accent-brand)]/15 group-hover:bg-[var(--accent-brand)] transition-colors" />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── BOTTOM CTA ROW ─────────────────────────────────────── */}
        <div className="mt-14 lg:mt-20 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Primary CTA — choose a car */}
          <div className="lg:col-span-8 bg-[var(--accent-brand)] rounded-md p-8 lg:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="text-[11px] tracking-[0.18em] uppercase text-white/60 font-semibold mb-3">
                <Bracket>NEXT STEP</Bracket>
              </div>
              <h3
                className="font-bold text-white uppercase leading-tight mb-2"
                style={{ fontSize: "clamp(22px, 2vw, 30px)" }}
              >
                {t.ctaTitle}
              </h3>
              <p className="text-white/75 text-[15px] leading-relaxed max-w-[460px]">
                {t.ctaSub}
              </p>
            </div>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 h-[56px] px-8 rounded bg-white text-[var(--accent-brand)] font-semibold uppercase text-[13px] tracking-wider hover:bg-[var(--bg-base)] transition-colors whitespace-nowrap"
              data-testid="turnkey-cta-choose-car"
            >
              {t.ctaButton}
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Messengers / Avito card — Telegram primary, WhatsApp + Avito side-links */}
          <div
            data-testid="turnkey-messengers-card"
            className="lg:col-span-4 bg-[var(--bg-elevated)] border border-[var(--accent-brand)]/15 rounded-md p-7 flex flex-col"
          >
            <div className="text-[11px] tracking-[0.18em] uppercase text-[var(--accent-brand)] font-semibold mb-3">
              <Bracket>CHAT</Bracket>
            </div>
            <h4
              className="font-bold text-[var(--accent-brand)] leading-tight mb-2"
              style={{ fontSize: "clamp(17px, 1.25vw, 21px)" }}
            >
              {t.chatTitle}
            </h4>
            <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed mb-5">
              {t.chatSub}
            </p>

            {/* Primary: Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="turnkey-cta-telegram"
              className="group inline-flex items-center justify-between gap-3 h-[48px] px-4 rounded bg-[var(--accent-brand)] text-white font-semibold uppercase text-[12px] tracking-wider hover:bg-[var(--accent-brand-hover)] transition-colors mb-3"
            >
              <span className="inline-flex items-center gap-2">
                <img
                  src="/figma/ic-round-telegram.svg"
                  alt=""
                  aria-hidden="true"
                  className="w-5 h-5 brightness-0 invert"
                />
                {t.chatTelegram}
              </span>
              <ArrowRight size={14} />
            </a>

            {/* Secondary row: WhatsApp + Avito */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="turnkey-cta-whatsapp"
                className="inline-flex items-center justify-center gap-2 h-[44px] rounded border border-[var(--accent-brand)]/20 text-[var(--accent-brand)] font-semibold uppercase text-[11px] tracking-wider hover:bg-[var(--accent-brand)]/5 transition-colors"
              >
                <MessageCircle size={14} strokeWidth={2} />
                {t.chatWhatsapp}
              </a>
              <a
                href={avito.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="turnkey-cta-avito"
                className="inline-flex items-center justify-center gap-2 h-[44px] rounded border border-[var(--accent-brand)]/20 text-[var(--accent-brand)] font-semibold uppercase text-[11px] tracking-wider hover:bg-[var(--accent-brand)]/5 transition-colors"
              >
                <img
                  src="/figma/ic-avito.svg"
                  alt=""
                  aria-hidden="true"
                  className="w-4 h-4"
                />
                {t.chatAvito}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TurnkeyBanner1;
