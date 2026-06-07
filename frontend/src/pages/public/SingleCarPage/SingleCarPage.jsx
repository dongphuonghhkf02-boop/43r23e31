/**
 * SingleCarPage — admin-curated car detail (BIBI 2026-06 pivot).
 *
 * Welcome-style redesign: navy (#162E51) / cream (#F5F0E8) / amber (#FEAE00)
 * palette, RU + EN, mobile responsive. No VIN, no auction — every field
 * comes from the /api/public/cars/{slug_or_id} endpoint.
 *
 * Sections (top → bottom):
 *   1. Breadcrumb / back link
 *   2. HERO — main image + title + admin badge + approximate price + CTA
 *   3. Quick-specs grid (year, mileage, transmission, drive, engine, body)
 *   4. Gallery (lightbox)
 *   5. Expert recommendation block (admin badge + note RU/EN)
 *   6. Full specs (Identity / Engine / Mileage&Condition / Options)
 *   7. Lead-capture CTA (opens GetInTouchModal with car_preference pre-filled)
 *   8. Similar cars (same budget_bucket, up to 4)
 */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  CaretLeft, CaretRight, X, ArrowRight, Sparkle, Trophy, Tag, Star,
  Phone as PhoneIcon, EnvelopeSimple, Calendar, Speedometer,
  Engine as EngineIcon, GearSix, SteeringWheel, Car as CarIcon,
  Lightning, Drop, GasPump, Users, Door, PaintBucket, Heart, Scales,
  ShareNetwork, CheckCircle,
} from "@phosphor-icons/react";
import { useLang } from "../../../i18n";
import useCarBySlugOrId from "./useCarBySlugOrId";
import { useGetInTouch } from "../../../components/public/GetInTouchModal";
import { optimizeImage, ImageSize } from "../../../lib/optimizeImage";
import styles from "./SingleCarWelcome.module.css";

const FALLBACK_IMG = "/figma/image-15@2x.webp";

const T = {
  ru: {
    back: "← Назад к подборке",
    home: "Главная",
    catalog: "Каталог",
    priceApprox: "Цена примерная — итог уточнит менеджер",
    onRequest: "По запросу",
    cta: "Оставить заявку",
    ctaSub: "Менеджер свяжется в течение часа",
    callUs: "Позвонить",
    contactManager: "Связаться с менеджером",
    quickSpecsTitle: "Ключевые характеристики",
    gallerySectionTitle: "Фотогалерея",
    expertTitle: "Рекомендация эксперта",
    expertEmpty: "Менеджер ещё не оставил комментарий по этому авто.",
    fullSpecsTitle: "Полные характеристики",
    optionsTitle: "Опции и комплектация",
    similarTitle: "Похожие автомобили",
    leadTitle: "Хотите этот автомобиль?",
    leadText:
      "Оставьте контакты — менеджер пришлёт детали, рассчитает цену под ключ и расскажет о ближайших шагах.",
    notFound: "Автомобиль не найден",
    notFoundDesc: "Возможно, его уже забронировали или он снят с продажи.",
    backHome: "Вернуться к подборке",
    sectionIdentity: "Идентификация",
    sectionEngine: "Двигатель и трансмиссия",
    sectionBody: "Кузов",
    sectionCondition: "Пробег и состояние",
    badge: {
      top_pick: "Топ выбор",
      best_price: "Лучшая цена",
      underpriced: "Недооценён",
      recommended: "Рекомендуем",
      rare_find: "Редкий экземпляр",
      low_mileage: "Малый пробег",
      neutral: "",
    },
    field: {
      year: "Год выпуска",
      mileage: "Пробег",
      transmission: "Трансмиссия",
      drive: "Привод",
      engine_type: "Тип двигателя",
      engine_volume_l: "Объём двигателя",
      power_hp: "Мощность",
      body_type: "Тип кузова",
      seats: "Количество мест",
      doors: "Количество дверей",
      color_name: "Цвет",
      condition: "Состояние",
      damage: "Повреждения",
      accident_history: "ДТП",
      service_history: "История обслуживания",
      make: "Марка",
      model: "Модель",
      generation: "Поколение",
    },
    bool: { yes: "Есть", no: "Нет" },
    body: {
      sedan: "Седан", suv: "Внедорожник", wagon: "Универсал", hatchback: "Хэтчбек",
      coupe: "Купе", cabrio: "Кабриолет", pickup: "Пикап", minivan: "Минивэн",
      van: "Фургон", motorbike: "Мотоцикл", crossover: "Кроссовер", liftback: "Лифтбэк",
    },
    engine: { petrol: "Бензин", diesel: "Дизель", hybrid: "Гибрид", electric: "Электро", gas: "Газ", plugin_hybrid: "Plug-in гибрид" },
    transmission: { manual: "МКПП", automatic: "АКПП", dct: "DCT", cvt: "CVT", robot: "Робот" },
    drive: { fwd: "Передний", rwd: "Задний", awd: "Полный (AWD)", "4wd": "Полный (4WD)" },
    condition: { excellent: "Отличное", very_good: "Очень хорошее", good: "Хорошее", fair: "Удовлетворительное" },
    damage: { none: "Без повреждений", light: "Лёгкие", moderate: "Средние", repaired: "Восстановлено" },
  },
  en: {
    back: "← Back to picks",
    home: "Home",
    catalog: "Catalog",
    priceApprox: "Approximate price — manager will confirm the final figure",
    onRequest: "On request",
    cta: "Request a quote",
    ctaSub: "Manager replies within the hour",
    callUs: "Call us",
    contactManager: "Contact a manager",
    quickSpecsTitle: "Key specifications",
    gallerySectionTitle: "Photo gallery",
    expertTitle: "Expert recommendation",
    expertEmpty: "No manager note for this car yet.",
    fullSpecsTitle: "Full specifications",
    optionsTitle: "Options & equipment",
    similarTitle: "Similar vehicles",
    leadTitle: "Want this car?",
    leadText:
      "Leave your contact — our manager will share details, quote a turnkey price and walk you through the next steps.",
    notFound: "Vehicle not found",
    notFoundDesc: "It may already be reserved or taken off the listing.",
    backHome: "Back to the picks",
    sectionIdentity: "Identity",
    sectionEngine: "Engine & transmission",
    sectionBody: "Body",
    sectionCondition: "Mileage & condition",
    badge: {
      top_pick: "Top pick",
      best_price: "Best price",
      underpriced: "Underpriced",
      recommended: "Recommended",
      rare_find: "Rare find",
      low_mileage: "Low mileage",
      neutral: "",
    },
    field: {
      year: "Year",
      mileage: "Mileage",
      transmission: "Transmission",
      drive: "Drive",
      engine_type: "Engine type",
      engine_volume_l: "Engine volume",
      power_hp: "Power",
      body_type: "Body",
      seats: "Seats",
      doors: "Doors",
      color_name: "Color",
      condition: "Condition",
      damage: "Damage",
      accident_history: "Accidents",
      service_history: "Service history",
      make: "Make",
      model: "Model",
      generation: "Generation",
    },
    bool: { yes: "Yes", no: "No" },
    body: {
      sedan: "Sedan", suv: "SUV", wagon: "Wagon", hatchback: "Hatchback",
      coupe: "Coupe", cabrio: "Cabriolet", pickup: "Pickup", minivan: "Minivan",
      van: "Van", motorbike: "Motorbike", crossover: "Crossover", liftback: "Liftback",
    },
    engine: { petrol: "Petrol", diesel: "Diesel", hybrid: "Hybrid", electric: "Electric", gas: "Gas", plugin_hybrid: "Plug-in hybrid" },
    transmission: { manual: "MT", automatic: "AT", dct: "DCT", cvt: "CVT", robot: "AMT" },
    drive: { fwd: "FWD", rwd: "RWD", awd: "AWD", "4wd": "4WD" },
    condition: { excellent: "Excellent", very_good: "Very good", good: "Good", fair: "Fair" },
    damage: { none: "None", light: "Light", moderate: "Moderate", repaired: "Repaired" },
  },
};

const fmtKm = (n) => {
  if (n == null || n === "") return null;
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return `${Math.round(v).toLocaleString("ru-RU")} км`;
};

const fmtEur = (n) => {
  if (n == null) return null;
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  return `${Math.round(v).toLocaleString("ru-RU")} €`;
};

const fmtPower = (hp) => {
  if (!hp) return null;
  const v = Number(hp);
  if (!Number.isFinite(v) || v <= 0) return null;
  return `${v} л.с.`;
};

const fmtVolume = (v) => {
  if (!v) return null;
  const num = Number(v);
  if (!Number.isFinite(num) || num <= 0) return null;
  return `${num.toFixed(1)} L`;
};

const BadgeIcon = ({ badge, size = 14 }) => {
  if (!badge) return null;
  if (badge === "top_pick" || badge === "recommended") return <Trophy size={size} weight="fill" />;
  if (badge === "best_price" || badge === "underpriced") return <Tag size={size} weight="fill" />;
  if (badge === "rare_find") return <Sparkle size={size} weight="fill" />;
  if (badge === "low_mileage") return <Speedometer size={size} weight="fill" />;
  return <Star size={size} weight="fill" />;
};

const SpecRow = ({ icon: Icon, label, value }) => {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div className={styles.specRow} data-testid={`spec-${label}`}>
      <div className={styles.specRowIcon}>
        {Icon ? <Icon size={20} weight="duotone" /> : null}
      </div>
      <div className={styles.specRowBody}>
        <span className={styles.specRowLabel}>{label}</span>
        <span className={styles.specRowValue}>{value}</span>
      </div>
    </div>
  );
};

const SingleCarPage = () => {
  const params = useParams();
  const slug = params.slug || params.query || params.vin || params.slugOrId;
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const navigate = useNavigate();
  const { loading, error, car, similar } = useCarBySlugOrId(slug);
  const { open: openGetInTouch } = useGetInTouch();

  const [lightboxIdx, setLightboxIdx] = useState(-1);
  const [heroImgIdx, setHeroImgIdx] = useState(0);

  const gallery = useMemo(() => {
    if (!car) return [];
    const arr = [];
    if (car.main_image_url) arr.push(car.main_image_url);
    if (Array.isArray(car.gallery)) {
      car.gallery.forEach((img) => {
        if (img && !arr.includes(img)) arr.push(img);
      });
    }
    return arr.length ? arr : [FALLBACK_IMG];
  }, [car]);

  const title = useMemo(() => {
    if (!car) return "";
    return (lang === "ru" ? car.title_ru : car.title_en) || `${car.year || ""} ${car.make || ""} ${car.model || ""}`.trim();
  }, [car, lang]);

  const adminNote = useMemo(() => {
    if (!car) return null;
    return (lang === "ru" ? car.admin_note_ru : car.admin_note_en) || car.admin_note_ru || car.admin_note_en || null;
  }, [car, lang]);

  const priceEur = car ? fmtEur(car.price_eur) : null;
  const badgeKey = car?.admin_badge && car.admin_badge !== "neutral" ? car.admin_badge : null;
  const badgeLabel = badgeKey ? t.badge[badgeKey] : null;

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIdx < 0) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxIdx(-1);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i + 1) % gallery.length);
      if (e.key === "ArrowLeft") setLightboxIdx((i) => (i - 1 + gallery.length) % gallery.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, gallery.length]);

  const handleLeadOpen = useCallback(() => {
    openGetInTouch?.({
      source: "single_car_page",
      car_preference: title || (car?.make ? `${car.make} ${car.model || ""}`.trim() : ""),
    });
  }, [openGetInTouch, title, car]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.skeletonHero} />
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonItem} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Not found ── */
  if (error || !car) {
    return (
      <div className={styles.page}>
        <div className={styles.notFoundWrap}>
          <div className={styles.notFoundCard}>
            <h1 className={styles.notFoundTitle}>{t.notFound}</h1>
            <p className={styles.notFoundDesc}>{t.notFoundDesc}</p>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => navigate("/")}
            >
              {t.backHome}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const labelFor = (key, raw) => {
    if (key === "body_type") return t.body[raw] || raw;
    if (key === "engine_type") return t.engine[raw] || raw;
    if (key === "transmission") return t.transmission[raw] || raw;
    if (key === "drive") return t.drive[raw] || raw;
    if (key === "condition") return t.condition[raw] || raw;
    if (key === "damage") return t.damage[raw] || raw;
    if (key === "mileage_km") return fmtKm(raw);
    if (key === "engine_volume_l") return fmtVolume(raw);
    if (key === "power_hp") return fmtPower(raw);
    if (key === "accident_history") return raw ? t.bool.yes : t.bool.no;
    if (raw == null || raw === "") return null;
    return String(raw);
  };

  return (
    <div className={styles.page} data-testid="single-car-page">
      <div className={styles.shell}>
        {/* ── Breadcrumb ── */}
        <div className={styles.breadcrumb}>
          <Link to="/" className={styles.crumbLink}>{t.home}</Link>
          <span className={styles.crumbSep}>·</span>
          <span className={styles.crumbCurrent}>{title}</span>
        </div>

        {/* ════════ HERO ════════ */}
        <section className={styles.hero}>
          <div className={styles.heroLeft}>
            <div
              className={styles.heroImageWrap}
              onClick={() => setLightboxIdx(heroImgIdx)}
              role="button"
              tabIndex={0}
              data-testid="hero-image"
            >
              <img
                className={styles.heroImage}
                src={optimizeImage(gallery[heroImgIdx], ImageSize.hero)}
                alt={title}
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              />
              {badgeLabel && (
                <div className={styles.heroBadge} data-badge={badgeKey} data-testid={`hero-badge-${badgeKey}`}>
                  <BadgeIcon badge={badgeKey} />
                  {badgeLabel}
                </div>
              )}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className={`${styles.heroNav} ${styles.heroNavLeft}`}
                    onClick={(e) => { e.stopPropagation(); setHeroImgIdx((i) => (i - 1 + gallery.length) % gallery.length); }}
                    aria-label="Previous photo"
                  >
                    <CaretLeft size={20} weight="bold" />
                  </button>
                  <button
                    type="button"
                    className={`${styles.heroNav} ${styles.heroNavRight}`}
                    onClick={(e) => { e.stopPropagation(); setHeroImgIdx((i) => (i + 1) % gallery.length); }}
                    aria-label="Next photo"
                  >
                    <CaretRight size={20} weight="bold" />
                  </button>
                  <div className={styles.heroDots}>
                    {gallery.slice(0, 8).map((_, i) => (
                      <span
                        key={i}
                        className={`${styles.heroDot} ${i === heroImgIdx ? styles.heroDotActive : ""}`}
                      />
                    ))}
                    {gallery.length > 8 && (
                      <span className={styles.heroDotMore}>+{gallery.length - 8}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className={styles.heroRight}>
            <div className={styles.heroEyebrow}>
              <span className={styles.heroEyebrowDash} aria-hidden="true" />
              <span className={styles.heroEyebrowText}>
                {car.year ? `${car.year} · ` : ""}
                {car.body_type ? t.body[car.body_type] : ""}
              </span>
            </div>
            <h1 className={styles.heroTitle}>{title}</h1>

            <div className={styles.heroPriceBlock}>
              <div className={styles.heroPriceRow}>
                <span className={styles.heroPriceApprox}>~</span>
                <span className={styles.heroPrice}>
                  {priceEur || t.onRequest}
                </span>
              </div>
              <div className={styles.heroPriceCaption}>{t.priceApprox}</div>
            </div>

            <div className={styles.heroQuickSpecs}>
              {car.mileage_km != null && (
                <div className={styles.heroQuick} data-testid="quick-mileage">
                  <Speedometer size={18} weight="duotone" />
                  <span>{fmtKm(car.mileage_km)}</span>
                </div>
              )}
              {car.transmission && (
                <div className={styles.heroQuick} data-testid="quick-transmission">
                  <GearSix size={18} weight="duotone" />
                  <span>{t.transmission[car.transmission] || car.transmission}</span>
                </div>
              )}
              {car.drive && (
                <div className={styles.heroQuick} data-testid="quick-drive">
                  <SteeringWheel size={18} weight="duotone" />
                  <span>{t.drive[car.drive] || car.drive}</span>
                </div>
              )}
              {car.engine_type && (
                <div className={styles.heroQuick} data-testid="quick-engine">
                  {car.engine_type === "electric" ? <Lightning size={18} weight="duotone" /> :
                    car.engine_type === "diesel" ? <Drop size={18} weight="duotone" /> :
                    <GasPump size={18} weight="duotone" />}
                  <span>{t.engine[car.engine_type] || car.engine_type}{car.engine_volume_l ? ` · ${fmtVolume(car.engine_volume_l)}` : ""}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className={styles.heroCta}
              onClick={handleLeadOpen}
              data-testid="hero-lead-cta"
            >
              {t.cta}
              <ArrowRight size={18} weight="bold" />
            </button>
            <div className={styles.heroCtaSub}>{t.ctaSub}</div>
          </aside>
        </section>

        {/* ════════ EXPERT RECOMMENDATION ════════ */}
        {(adminNote || badgeLabel) && (
          <section className={styles.expertSection} data-testid="expert-section">
            <div className={styles.sectionEyebrow}>
              <span className={styles.sectionEyebrowDash} aria-hidden="true" />
              <span className={styles.sectionEyebrowText}>{t.expertTitle}</span>
            </div>
            <div className={styles.expertCard}>
              {badgeLabel && (
                <div className={styles.expertBadge} data-badge={badgeKey}>
                  <BadgeIcon badge={badgeKey} size={16} />
                  {badgeLabel}
                </div>
              )}
              {adminNote ? (
                <p className={styles.expertNote}>{adminNote}</p>
              ) : (
                <p className={styles.expertNoteEmpty}>{t.expertEmpty}</p>
              )}
            </div>
          </section>
        )}

        {/* ════════ GALLERY ════════ */}
        {gallery.length > 1 && (
          <section className={styles.gallerySection} data-testid="gallery-section">
            <div className={styles.sectionEyebrow}>
              <span className={styles.sectionEyebrowDash} aria-hidden="true" />
              <span className={styles.sectionEyebrowText}>{t.gallerySectionTitle}</span>
            </div>
            <div className={styles.galleryGrid}>
              {gallery.map((img, i) => (
                <button
                  type="button"
                  key={`g-${i}`}
                  className={styles.galleryItem}
                  onClick={() => setLightboxIdx(i)}
                  data-testid={`gallery-img-${i}`}
                >
                  <img
                    src={optimizeImage(img, ImageSize.cardDesktop)}
                    alt={`${title} ${i + 1}`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ════════ FULL SPECS ════════ */}
        <section className={styles.specsSection} data-testid="specs-section">
          <div className={styles.sectionEyebrow}>
            <span className={styles.sectionEyebrowDash} aria-hidden="true" />
            <span className={styles.sectionEyebrowText}>{t.fullSpecsTitle}</span>
          </div>

          <div className={styles.specGroupGrid}>
            {/* Identity */}
            <div className={styles.specGroup}>
              <div className={styles.specGroupTitle}>{t.sectionIdentity}</div>
              <SpecRow icon={CarIcon} label={t.field.make} value={car.make} />
              <SpecRow icon={CarIcon} label={t.field.model} value={car.model} />
              {car.generation && <SpecRow icon={CarIcon} label={t.field.generation} value={car.generation} />}
              <SpecRow icon={Calendar} label={t.field.year} value={car.year} />
            </div>

            {/* Engine & transmission */}
            <div className={styles.specGroup}>
              <div className={styles.specGroupTitle}>{t.sectionEngine}</div>
              <SpecRow icon={EngineIcon} label={t.field.engine_type} value={labelFor("engine_type", car.engine_type)} />
              <SpecRow icon={EngineIcon} label={t.field.engine_volume_l} value={labelFor("engine_volume_l", car.engine_volume_l)} />
              <SpecRow icon={Lightning} label={t.field.power_hp} value={labelFor("power_hp", car.power_hp)} />
              <SpecRow icon={GearSix} label={t.field.transmission} value={labelFor("transmission", car.transmission)} />
              <SpecRow icon={SteeringWheel} label={t.field.drive} value={labelFor("drive", car.drive)} />
            </div>

            {/* Body */}
            <div className={styles.specGroup}>
              <div className={styles.specGroupTitle}>{t.sectionBody}</div>
              <SpecRow icon={CarIcon} label={t.field.body_type} value={labelFor("body_type", car.body_type)} />
              <SpecRow icon={PaintBucket} label={t.field.color_name} value={car.color_name} />
              <SpecRow icon={Users} label={t.field.seats} value={car.seats} />
              <SpecRow icon={Door} label={t.field.doors} value={car.doors} />
            </div>

            {/* Mileage & condition */}
            <div className={styles.specGroup}>
              <div className={styles.specGroupTitle}>{t.sectionCondition}</div>
              <SpecRow icon={Speedometer} label={t.field.mileage} value={labelFor("mileage_km", car.mileage_km)} />
              <SpecRow icon={CheckCircle} label={t.field.condition} value={labelFor("condition", car.condition)} />
              <SpecRow icon={CheckCircle} label={t.field.damage} value={labelFor("damage", car.damage)} />
              <SpecRow icon={CheckCircle} label={t.field.accident_history} value={labelFor("accident_history", car.accident_history)} />
              {car.service_history && (
                <SpecRow icon={CheckCircle} label={t.field.service_history} value={car.service_history} />
              )}
            </div>
          </div>
        </section>

        {/* ════════ OPTIONS ════════ */}
        {Array.isArray(car.options) && car.options.length > 0 && (
          <section className={styles.optionsSection} data-testid="options-section">
            <div className={styles.sectionEyebrow}>
              <span className={styles.sectionEyebrowDash} aria-hidden="true" />
              <span className={styles.sectionEyebrowText}>{t.optionsTitle}</span>
            </div>
            <div className={styles.optionsGrid}>
              {car.options.map((opt, i) => (
                <span key={`opt-${i}`} className={styles.optionChip} data-testid={`option-${i}`}>
                  <CheckCircle size={14} weight="fill" /> {opt}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ════════ LEAD CTA ════════ */}
        <section className={styles.leadSection} data-testid="lead-section">
          <div className={styles.leadCard}>
            <div className={styles.leadCopy}>
              <div className={styles.sectionEyebrow}>
                <span className={styles.sectionEyebrowDash} aria-hidden="true" />
                <span className={styles.sectionEyebrowText} style={{ color: "#FEAE00" }}>
                  {lang === "ru" ? "Индивидуальный расчёт" : "Personal quote"}
                </span>
              </div>
              <h2 className={styles.leadTitle}>{t.leadTitle}</h2>
              <p className={styles.leadText}>{t.leadText}</p>
            </div>
            <button
              type="button"
              className={styles.leadBtn}
              onClick={handleLeadOpen}
              data-testid="lead-cta-bottom"
            >
              {t.contactManager}
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </section>

        {/* ════════ SIMILAR CARS ════════ */}
        {similar.length > 0 && (
          <section className={styles.similarSection} data-testid="similar-section">
            <div className={styles.sectionEyebrow}>
              <span className={styles.sectionEyebrowDash} aria-hidden="true" />
              <span className={styles.sectionEyebrowText}>{t.similarTitle}</span>
            </div>
            <div className={styles.similarGrid}>
              {similar.map((s) => {
                const tt = (lang === "ru" ? s.title_ru : s.title_en) || `${s.year || ""} ${s.make || ""} ${s.model || ""}`.trim();
                const img = s.main_image_url || (s.gallery && s.gallery[0]) || FALLBACK_IMG;
                const href = s.slug ? `/cars/${encodeURIComponent(s.slug)}` : (s.id ? `/cars/${encodeURIComponent(s.id)}` : null);
                const p = fmtEur(s.price_eur);
                return (
                  <Link
                    key={s.id || s.slug}
                    to={href || "#"}
                    className={styles.similarCard}
                    data-testid={`similar-${s.id || s.slug}`}
                  >
                    <div className={styles.similarPhoto}>
                      <img src={optimizeImage(img, ImageSize.cardDesktop)} alt={tt} loading="lazy" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
                    </div>
                    <div className={styles.similarBody}>
                      <div className={styles.similarTitle}>{tt}</div>
                      <div className={styles.similarPrice}>{p ? <><span style={{ opacity: 0.6, fontSize: "0.75em" }}>~</span> {p}</> : t.onRequest}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* ════════ LIGHTBOX ════════ */}
      {lightboxIdx >= 0 && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIdx(-1)}
          data-testid="lightbox"
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxIdx(-1)}
            aria-label="Close"
          >
            <X size={28} weight="bold" />
          </button>
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxLeft}`}
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + gallery.length) % gallery.length); }}
            aria-label="Previous"
          >
            <CaretLeft size={32} weight="bold" />
          </button>
          <img
            className={styles.lightboxImage}
            src={gallery[lightboxIdx]}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className={`${styles.lightboxNav} ${styles.lightboxRight}`}
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % gallery.length); }}
            aria-label="Next"
          >
            <CaretRight size={32} weight="bold" />
          </button>
          <div className={styles.lightboxCounter}>{lightboxIdx + 1} / {gallery.length}</div>
        </div>
      )}
    </div>
  );
};

export default SingleCarPage;
