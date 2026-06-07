/**
 * DealCard — homepage "Подборка недели" card (Wave 2026-06 redesign).
 *
 * Drop-in replacement for the legacy `Card1` used by `FrameComponent21`.
 * Differences vs. Card1 (per product spec):
 *   • Calm layout — NO tilt-parallax, NO async-driven scale flicker.
 *   • Currency normalised to EUR. "0 €" → "По запросу".
 *   • Lot pill says «Лот №…» (Card1 had "Много" — old mistranslation).
 *   • Clock icon stays white-on-amber (was black-on-navy in Card1).
 *   • "Ориентировочная итоговая цена (BY / RU)" block REMOVED entirely.
 *   • Spec strip (mileage · engine · drive) is a single horizontal row.
 *   • One bold "Подробнее" CTA — title + photo also navigate to the
 *     same `/cars/<vin>` detail page.
 *
 * Photos come from the BidMotors snapshot stored in `wishlist_deals`
 * (the manager-curated weekly pick; see backend `wishlist_deals.py`),
 * fed through `optimizeImage` for cdn-served webp.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart, Scales, ShareNetwork, Tag, Clock, Note, ArrowRight, Speedometer, Engine, SteeringWheel } from "@phosphor-icons/react";
import { useLang } from "../../i18n";
import { userEngagementApi, getCustomerToken } from "../../lib/api";
import ShareModal from "../../components/public/ShareModal";
import { optimizeImage, ImageSize } from "../../lib/optimizeImage";
import styles from "./DealCard.module.css";

const FALLBACK_IMG = "/figma/image-15@2x.webp";

const T = {
  en: {
    onRequest: "On request",
    moreDetails: "More details",
    lotShort: "Lot",
    auctionTba: "Auction TBA",
    closed: "Closed",
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
  },
  ru: {
    onRequest: "По запросу",
    moreDetails: "Подробнее",
    lotShort: "Лот",
    auctionTba: "Скоро аукцион",
    closed: "Завершён",
    shareCar: "Поделиться",
    addToCompare: "Добавить к сравнению",
    removeFromCompare: "Убрать из сравнения",
    addToFavorites: "В избранное",
    removeFromFavorites: "Из избранного",
    pleaseLogin: "Войдите, чтобы сохранять в избранное",
    compareFull: "В сравнении максимум 3 авто. Удалите одно, чтобы добавить ещё.",
    added: "Добавлено",
    removed: "Удалено",
    couldNotUpdate: "Не удалось обновить",
    drive: "Привод",
    engine: "Двигатель",
    mileage: "Пробег",
  },
};

/* ── helpers ─────────────────────────────────────────────────────── */
const fmtKm = (n, unit) => {
  if (n == null || n === "") return null;
  const num = typeof n === "number" ? n : parseInt(String(n).replace(/[^\d]/g, ""), 10);
  if (!num || isNaN(num)) return null;
  const u = (unit || "km").toLowerCase().startsWith("mi") ? "миль" : "км";
  return `${num.toLocaleString("ru-RU")} ${u}`;
};

/**
 * Format a numeric value (or object {amount, currency}) as a EUR price.
 * Returns null if no usable price (so caller can render "По запросу").
 * Source data on BIBI is stored in EUR (BidMotors lots), so we keep
 * the value as-is when currency missing — no FX is applied here.
 */
const fmtEur = (raw) => {
  let amount = null;
  if (raw == null) return null;
  if (typeof raw === "object") {
    amount = Number(raw.amount ?? raw.value ?? raw.eur ?? raw.usd);
  } else {
    amount = Number(String(raw).replace(/[^\d.,-]/g, "").replace(",", "."));
  }
  if (!Number.isFinite(amount) || amount <= 0) return null;
  try {
    return `${Math.round(amount).toLocaleString("ru-RU")} €`;
  } catch {
    return `${Math.round(amount)} €`;
  }
};

function parseSaleDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const str = String(s).trim();
  const iso = Date.parse(str);
  if (!isNaN(iso) && /\d{4}-\d{2}-\d{2}/.test(str)) return new Date(iso);
  const m = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, d, mo, y, hh, mm] = m;
    const utcMs = Date.UTC(
      parseInt(y, 10),
      parseInt(mo, 10) - 1,
      parseInt(d, 10),
      hh ? parseInt(hh, 10) - 2 : 21,
      mm ? parseInt(mm, 10) : 59,
      0
    );
    return new Date(utcMs);
  }
  return null;
}

function formatRemaining(ms, closedLabel) {
  if (ms <= 0) return closedLabel || "—";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}д ${hours}ч ${mins}м`;
  return `${hours}ч ${mins}м ${totalSec % 60}с`;
}

/* ── component ───────────────────────────────────────────────────── */
const DealCard = ({
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

  /* ── resolved display values ── */
  const vin = data?.vin || null;
  const title = data?.title || `${data?.year || ""} ${data?.make || ""} ${data?.model || ""}`.trim() || vin || "";
  const imagesArr = Array.isArray(data?.images) ? data.images.filter(Boolean) : [];
  const image = imagesArr[0] || data?.image || FALLBACK_IMG;
  const lotNumber = data?.lot_number || null;
  const auctionName = data?.auction_name || data?.auction || null;
  const lotLabel = lotNumber
    ? `${t.lotShort} ${lotNumber}`
    : (auctionName ? auctionName : null);

  /* Price → EUR only. Wishlist note from manager (snapshot.note) is shown if set. */
  const priceEur = fmtEur(data?.current_bid ?? data?.price ?? null);
  const note = data?.wishlist?.note || data?.note || null;

  /* Specs */
  const mileage = fmtKm(data?.odometer, data?.odometer_unit);
  const engine = (data?.engine || "").trim() || null;
  const drive = (data?.drivetrain || data?.drive || "").trim() || null;

  /* Countdown */
  const saleAt = useMemo(() => parseSaleDate(data?.sale_date), [data?.sale_date]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!saleAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [saleAt]);
  const remainingMs = saleAt ? saleAt.getTime() - now : null;
  const timerLabel = saleAt ? formatRemaining(remainingMs, t.closed) : t.auctionTba;
  const isClosed = saleAt && remainingMs <= 0;

  const detailHref = vin ? `/cars/${encodeURIComponent(vin)}` : null;
  const isFav = vin && favoriteSet ? favoriteSet.has(vin) : false;
  const isCmp = vin && compareSet ? compareSet.has(vin) : false;
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
    if (!vin || busyFav) return;
    if (!requireAuth()) return;
    const next = !isFav;
    onToggleFavoriteLocal?.(vin, next);
    setBusyFav(true);
    try {
      const snapshot = {
        title, vin, vehicleId: vin, year: data?.year, make: data?.make,
        model: data?.model, image, lot_number: lotNumber, auction_name: auctionName,
        odometer: data?.odometer, odometer_unit: data?.odometer_unit,
      };
      if (next) {
        await userEngagementApi.favorites.add({ vin, vehicleId: vin, sourcePage: window.location.pathname, ...snapshot });
        toast.success(`${t.added}: ${t.addToFavorites}`, { description: title, duration: 2200 });
      } else {
        await userEngagementApi.favorites.remove(vin);
        toast(`${t.removed}: ${t.removeFromFavorites}`, { description: title, duration: 1800 });
      }
    } catch (err) {
      onToggleFavoriteLocal?.(vin, !next);
      if (err?.status === 401) requireAuth();
      else toast.error(err?.message || t.couldNotUpdate);
    } finally {
      setBusyFav(false);
    }
  };

  const handleCmp = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!vin || busyCmp) return;
    if (!requireAuth()) return;
    if (cmpFull) {
      toast.info(t.compareFull, { duration: 2200 });
      return;
    }
    const next = !isCmp;
    onToggleCompareLocal?.(vin, next);
    setBusyCmp(true);
    try {
      if (next) {
        await userEngagementApi.compare.add({
          vehicleId: vin, vin, snapshot: {
            title, image, year: data?.year, make: data?.make, model: data?.model,
            lot_number: lotNumber, auction_name: auctionName,
            odometer: data?.odometer, odometer_unit: data?.odometer_unit,
          },
        });
        toast.success(`${t.added}: ${t.addToCompare}`, { description: title, duration: 2400 });
      } else {
        await userEngagementApi.compare.remove(vin);
        toast(`${t.removed}: ${t.removeFromCompare}`, { description: title, duration: 1600 });
      }
    } catch (err) {
      onToggleCompareLocal?.(vin, !next);
      if (err?.status === 401 || err?.status === 403) requireAuth();
      else if (err?.status === 409) toast.info(t.compareFull, { duration: 2400 });
      else toast.error(err?.message || t.couldNotUpdate);
    } finally {
      setBusyCmp(false);
    }
  };

  return (
    <article className={[styles.card, className].join(" ")} data-testid={vin ? `deal-card-${vin}` : "deal-card"}>
      <div className={styles.photoWrap}>
        {detailHref && (
          <Link to={detailHref} aria-label={title} className={styles.photoLink} />
        )}
        <img
          className={styles.photo}
          src={optimizeImage(image, ImageSize.cardDesktop)}
          alt={title}
          loading="lazy"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />

        {/* lotLabel pill hidden per business decision (legacy field kept in data) */}
        {false && lotLabel && (
          <span className={styles.lotPill}>
            <Tag size={12} weight="fill" />
            {lotLabel}
          </span>
        )}

        <span className={`${styles.timerChip} ${isClosed ? styles.timerChipClosed : ""}`} title={saleAt ? saleAt.toLocaleString() : ""}>
          <Clock size={14} weight="bold" />
          {timerLabel}
        </span>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShareOpen(true); }}
            className={styles.iconBtn}
            aria-label={t.shareCar}
            data-testid={`share-btn-${vin || "card"}`}
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
            data-testid={`compare-btn-${vin || "card"}`}
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
            data-testid={`fav-btn-${vin || "card"}`}
          >
            <Heart size={18} weight={isFav ? "fill" : "regular"} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>
            {detailHref ? (
              <Link to={detailHref} className={styles.titleLink}>{title}</Link>
            ) : title}
          </h3>
          <div className={priceEur ? styles.price : `${styles.price} ${styles.priceOnRequest}`}>
            {priceEur || t.onRequest}
          </div>
        </div>

        <div className={styles.specs}>
          {mileage && (
            <span className={styles.specItem}>
              <Speedometer size={14} weight="regular" />
              <strong>{mileage}</strong>
            </span>
          )}
          {mileage && (engine || drive) && <span className={styles.specDot} />}
          {engine && (
            <span className={styles.specItem}>
              <Engine size={14} weight="regular" />
              <strong>{engine}</strong>
            </span>
          )}
          {engine && drive && <span className={styles.specDot} />}
          {drive && (
            <span className={styles.specItem}>
              <SteeringWheel size={14} weight="regular" />
              <strong>{drive}</strong>
            </span>
          )}
          {!mileage && !engine && !drive && (
            <span style={{ color: "#6E7C88", fontSize: 12 }}>—</span>
          )}
        </div>

        {note && (
          <div className={styles.note}>
            <Note size={14} weight="fill" />
            <span>{note}</span>
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
        vin={vin}
        snapshot={{
          title,
          image,
          price: priceEur || undefined,
          lot_number: lotNumber,
          auction_name: auctionName,
        }}
      />
    </article>
  );
};

export default DealCard;
