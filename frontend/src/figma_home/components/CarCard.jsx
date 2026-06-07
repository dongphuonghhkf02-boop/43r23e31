/**
 * CarCard — homepage curated catalog card (BIBI 2026-06 pivot).
 *
 * Consumes the new admin-curated data shape from /api/public/cars:
 *   {
 *     id, slug, make, model, year, title_ru, title_en,
 *     body_type, mileage_km, engine_type, engine_volume_l, transmission,
 *     drive, price_eur, currency, price_is_approximate,
 *     admin_badge, admin_note_ru, admin_note_en,
 *     main_image_url, gallery [str], budget_bucket, options [str], ...
 *   }
 *
 * Differences vs. the retired DealCard:
 *   • No countdown timer (no auctions).
 *   • No "Лот №" pill.
 *   • Single all-inclusive price, always marked "~" approximate.
 *   • Optional expert-recommendation badge in the top-left corner.
 *   • Detail link uses /cars/<slug> (or id fallback).
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Heart,
  Scales,
  ShareNetwork,
  ArrowRight,
  Speedometer,
  Engine,
  SteeringWheel,
  Sparkle,
  Trophy,
  Tag,
  Sparkle as SparkleIcon,
} from "@phosphor-icons/react";
import { useLang } from "../../i18n";
import { userEngagementApi, getCustomerToken } from "../../lib/api";
import ShareModal from "../../components/public/ShareModal";
import { optimizeImage, ImageSize } from "../../lib/optimizeImage";
import styles from "./DealCard.module.css";

const FALLBACK_IMG = "/figma/image-15@2x.webp";

const T = {
  en: {
    onRequest: "On request",
    approxPrefix: "from",
    moreDetails: "More details",
    shareCar: "Share car",
    addToCompare: "Add to compare",
    removeFromCompare: "Remove from compare",
    addToFavorites: "Add to favorites",
    removeFromFavorites: "Remove from favorites",
    pleaseLogin: "Please log in to save favorites",
    compareFull: "Compare list is full (max 3). Remove one first.",
    added: "Added",
    removed: "Removed",
    couldNotUpdate: "Could not update",
    drive: "Drive",
    engine: "Engine",
    mileage: "Mileage",
    badge: {
      top_pick: "Top pick",
      best_price: "Best price",
      underpriced: "Underpriced",
      recommended: "Recommended",
      rare_find: "Rare find",
      low_mileage: "Low mileage",
      neutral: "",
    },
  },
  ru: {
    onRequest: "По запросу",
    approxPrefix: "от",
    moreDetails: "Подробнее",
    shareCar: "Поделиться",
    addToCompare: "Добавить к сравнению",
    removeFromCompare: "Убрать из сравнения",
    addToFavorites: "В избранное",
    removeFromFavorites: "Из избранного",
    pleaseLogin: "Войдите, чтобы сохранять в избранное",
    compareFull: "В сравнении максимум 3 авто.",
    added: "Добавлено",
    removed: "Удалено",
    couldNotUpdate: "Не удалось обновить",
    drive: "Привод",
    engine: "Двигатель",
    mileage: "Пробег",
    badge: {
      top_pick: "Топ выбор",
      best_price: "Лучшая цена",
      underpriced: "Недооценён",
      recommended: "Рекомендуем",
      rare_find: "Редкий экземпляр",
      low_mileage: "Малый пробег",
      neutral: "",
    },
  },
};

const ENGINE_LABEL = {
  petrol: { ru: "Бензин", en: "Petrol" },
  diesel: { ru: "Дизель", en: "Diesel" },
  hybrid: { ru: "Гибрид", en: "Hybrid" },
  electric: { ru: "Электро", en: "Electric" },
  gas: { ru: "Газ", en: "Gas" },
  plugin_hybrid: { ru: "Plug-in", en: "Plug-in" },
};

const TRANSMISSION_LABEL = {
  manual: { ru: "МКПП", en: "MT" },
  automatic: { ru: "АКПП", en: "AT" },
  dct: { ru: "DCT", en: "DCT" },
  cvt: { ru: "CVT", en: "CVT" },
  robot: { ru: "Робот", en: "AMT" },
};

const DRIVE_LABEL = {
  fwd: "FWD",
  rwd: "RWD",
  awd: "AWD",
  "4wd": "4WD",
};

const fmtKm = (n) => {
  if (n == null || n === "") return null;
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return null;
  return `${Math.round(num).toLocaleString("ru-RU")} км`;
};

const fmtEur = (v) => {
  if (v == null) return null;
  const num = Number(v);
  if (!Number.isFinite(num) || num <= 0) return null;
  return `${Math.round(num).toLocaleString("ru-RU")} €`;
};

const buildEngineLabel = (car, lang) => {
  const parts = [];
  if (car.engine_volume_l) parts.push(`${Number(car.engine_volume_l).toFixed(1)}L`);
  const et = car.engine_type && ENGINE_LABEL[car.engine_type]?.[lang === "ru" ? "ru" : "en"];
  if (et) parts.push(et);
  if (car.power_hp) parts.push(`${car.power_hp} л.с.`);
  return parts.join(" · ");
};

const buildTransmissionDriveLabel = (car, lang) => {
  const parts = [];
  if (car.transmission && TRANSMISSION_LABEL[car.transmission])
    parts.push(TRANSMISSION_LABEL[car.transmission][lang === "ru" ? "ru" : "en"]);
  if (car.drive && DRIVE_LABEL[car.drive]) parts.push(DRIVE_LABEL[car.drive]);
  return parts.join(" · ");
};

const BadgeIcon = ({ badge }) => {
  if (badge === "top_pick" || badge === "recommended") return <Trophy size={12} weight="fill" />;
  if (badge === "best_price" || badge === "underpriced") return <Tag size={12} weight="fill" />;
  if (badge === "rare_find") return <SparkleIcon size={12} weight="fill" />;
  return <Sparkle size={12} weight="fill" />;
};

const CarCard = ({
  data,
  className = "",
  favoriteSet,
  compareSet,
  compareCount = 0,
  onToggleFavoriteLocal,
  onToggleCompareLocal,
}) => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = lang === "ru" ? T.ru : T.en;
  const [busyFav, setBusyFav] = useState(false);
  const [busyCmp, setBusyCmp] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!data) return null;

  const id = data.id || data.slug || "";
  const carKey = (data.slug || data.id || "").toUpperCase();
  const title =
    (lang === "ru" ? data.title_ru : data.title_en) ||
    [data.year, data.make, data.model].filter(Boolean).join(" ");
  const image = data.main_image_url || (data.gallery && data.gallery[0]) || FALLBACK_IMG;
  const priceEur = fmtEur(data.price_eur);
  const approx = priceEur && data.price_is_approximate;
  const adminNote = (lang === "ru" ? data.admin_note_ru : data.admin_note_en) || data.admin_note_ru || data.admin_note_en;
  const badgeKey = data.admin_badge && data.admin_badge !== "neutral" ? data.admin_badge : null;
  const badgeLabel = badgeKey ? t.badge[badgeKey] : null;

  const mileage = fmtKm(data.mileage_km);
  const engineLabel = buildEngineLabel(data, lang);
  const driveLabel = buildTransmissionDriveLabel(data, lang);

  const detailHref = data.slug
    ? `/cars/${encodeURIComponent(data.slug)}`
    : data.id
    ? `/cars/${encodeURIComponent(data.id)}`
    : null;

  const isFav = carKey && favoriteSet ? favoriteSet.has(carKey) : false;
  const isCmp = carKey && compareSet ? compareSet.has(carKey) : false;
  const cmpFull = compareCount >= 3 && !isCmp;

  const requireAuth = () => {
    if (getCustomerToken()) return true;
    toast.info(t.pleaseLogin, { duration: 2400 });
    setTimeout(() => {
      const redirect = encodeURIComponent(window.location.pathname);
      navigate(`/cabinet/login?redirect=${redirect}`);
    }, 700);
    return false;
  };

  const handleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!carKey || busyFav) return;
    if (!requireAuth()) return;
    const next = !isFav;
    onToggleFavoriteLocal?.(carKey, next);
    setBusyFav(true);
    try {
      const snapshot = {
        title,
        vin: carKey,
        vehicleId: id,
        year: data.year,
        make: data.make,
        model: data.model,
        image,
      };
      if (next) {
        await userEngagementApi.favorites.add({
          vin: carKey,
          vehicleId: id,
          sourcePage: window.location.pathname,
          ...snapshot,
        });
        toast.success(`${t.added}: ${t.addToFavorites}`, { description: title, duration: 2200 });
      } else {
        await userEngagementApi.favorites.remove(carKey);
        toast(`${t.removed}: ${t.removeFromFavorites}`, { description: title, duration: 1800 });
      }
    } catch (err) {
      onToggleFavoriteLocal?.(carKey, !next);
      if (err?.status === 401) requireAuth();
      else toast.error(err?.message || t.couldNotUpdate);
    } finally {
      setBusyFav(false);
    }
  };

  const handleCmp = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!carKey || busyCmp) return;
    if (!requireAuth()) return;
    if (cmpFull) {
      toast.info(t.compareFull, { duration: 2200 });
      return;
    }
    const next = !isCmp;
    onToggleCompareLocal?.(carKey, next);
    setBusyCmp(true);
    try {
      if (next) {
        await userEngagementApi.compare.add({
          vehicleId: id,
          vin: carKey,
          snapshot: {
            title,
            image,
            year: data.year,
            make: data.make,
            model: data.model,
          },
        });
        toast.success(`${t.added}: ${t.addToCompare}`, { description: title, duration: 2400 });
      } else {
        await userEngagementApi.compare.remove(carKey);
        toast(`${t.removed}: ${t.removeFromCompare}`, { description: title, duration: 1600 });
      }
    } catch (err) {
      onToggleCompareLocal?.(carKey, !next);
      if (err?.status === 401 || err?.status === 403) requireAuth();
      else if (err?.status === 409) toast.info(t.compareFull, { duration: 2400 });
      else toast.error(err?.message || t.couldNotUpdate);
    } finally {
      setBusyCmp(false);
    }
  };

  return (
    <article
      className={[styles.card, className].join(" ")}
      data-testid={carKey ? `car-card-${carKey.toLowerCase()}` : "car-card"}
    >
      <div className={styles.photoWrap}>
        {detailHref && (
          <Link to={detailHref} aria-label={title} className={styles.photoLink} />
        )}
        <img
          className={styles.photo}
          src={optimizeImage(image, ImageSize.cardDesktop)}
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMG;
          }}
        />

        {badgeLabel && (
          <span
            className={styles.lotPill}
            data-badge={badgeKey}
            data-testid={`car-badge-${badgeKey}`}
          >
            <BadgeIcon badge={badgeKey} />
            {badgeLabel}
          </span>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShareOpen(true);
            }}
            className={styles.iconBtn}
            aria-label={t.shareCar}
          >
            <ShareNetwork size={18} weight="regular" />
          </button>
          <button
            type="button"
            onClick={handleCmp}
            disabled={busyCmp}
            className={`${styles.iconBtn} ${isCmp ? styles.iconBtnActive : ""}`}
            aria-label={isCmp ? t.removeFromCompare : t.addToCompare}
            aria-pressed={isCmp}
          >
            <Scales size={18} weight={isCmp ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            onClick={handleFav}
            disabled={busyFav}
            className={`${styles.iconBtn} ${isFav ? styles.iconBtnActive : ""}`}
            aria-label={isFav ? t.removeFromFavorites : t.addToFavorites}
            aria-pressed={isFav}
          >
            <Heart size={18} weight={isFav ? "fill" : "regular"} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>
            {detailHref ? (
              <Link to={detailHref} className={styles.titleLink}>
                {title}
              </Link>
            ) : (
              title
            )}
          </h3>
          <div className={priceEur ? styles.price : `${styles.price} ${styles.priceOnRequest}`}>
            {priceEur ? (
              <>
                {approx && <span style={{ opacity: 0.65, marginRight: 4, fontSize: "0.7em" }}>~</span>}
                {priceEur}
              </>
            ) : (
              t.onRequest
            )}
          </div>
        </div>

        <div className={styles.specs}>
          {mileage && (
            <span className={styles.specItem}>
              <Speedometer size={14} weight="regular" />
              <strong>{mileage}</strong>
            </span>
          )}
          {mileage && (engineLabel || driveLabel) && <span className={styles.specDot} />}
          {engineLabel && (
            <span className={styles.specItem}>
              <Engine size={14} weight="regular" />
              <strong>{engineLabel}</strong>
            </span>
          )}
          {engineLabel && driveLabel && <span className={styles.specDot} />}
          {driveLabel && (
            <span className={styles.specItem}>
              <SteeringWheel size={14} weight="regular" />
              <strong>{driveLabel}</strong>
            </span>
          )}
          {!mileage && !engineLabel && !driveLabel && (
            <span style={{ color: "#6E7C88", fontSize: 12 }}>—</span>
          )}
        </div>

        {adminNote && (
          <div className={styles.note}>
            <Sparkle size={14} weight="fill" />
            <span>{adminNote}</span>
          </div>
        )}

        {detailHref ? (
          <Link to={detailHref} className={styles.cta}>
            {t.moreDetails}
            <ArrowRight size={16} weight="bold" />
          </Link>
        ) : (
          <button type="button" className={styles.cta}>
            {t.moreDetails}
            <ArrowRight size={16} weight="bold" />
          </button>
        )}
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        vin={carKey}
        snapshot={{
          title,
          image,
          price: priceEur || undefined,
        }}
      />
    </article>
  );
};

export default CarCard;
