/**
 * CarSearchDropdown — header autocomplete for the BIBI curated catalog.
 *
 * Replaces the legacy VinSearchDropdown (which queried live BidMotors
 * via /api/public/search/suggest). The platform pivoted away from
 * scraping/VIN in 2026-06, so the header search now consults the
 * admin-curated /api/public/cars/search endpoint:
 *
 *   • Min 2 chars to fire, 250ms debounce
 *   • Returns up to 8 mini-card matches (image / title / year / price)
 *   • Empty result → CTA "Не нашли свой автомобиль? Свяжитесь с менеджером"
 *     which opens the GetInTouch modal with the typed query pre-filled
 *
 * Visual: dark navy dropdown matching the DM Auto header tier.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLang } from "../../i18n";
import { useGetInTouch } from "./GetInTouchModal";
import "./VinSearchDropdown.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";
const DEBOUNCE_MS = 250;
const MIN_LEN = 2;
const MAX_ITEMS = 8;

const fmtEur = (v) => {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${Math.round(n).toLocaleString("ru-RU")} €`;
};

const fmtTitle = (it, lang) => {
  const ti = (lang === "ru" ? it.title_ru : it.title_en) || it.title_ru || it.title_en;
  if (ti) return ti;
  return [it.year, it.make, it.model].filter(Boolean).join(" ");
};

const CarSearchDropdown = ({
  query,
  open,
  onClose,
  align = "left",
  width = "100%",
  variant = "dark", // 'dark' | 'light'
}) => {
  const navigate = useNavigate();
  const { lang } = useLang();
  const isRu = lang === "ru";
  const { open: openGetInTouch } = useGetInTouch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(-1);
  const lastReqRef = useRef(0);
  const wrapperRef = useRef(null);

  /* ── Debounced fetch ─────────────────────────────────────────── */
  useEffect(() => {
    const q = (query || "").trim();
    if (!open || q.length < MIN_LEN) {
      setItems([]);
      setError(null);
      setLoading(false);
      return undefined;
    }
    const reqId = ++lastReqRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${API_URL}/api/public/cars/search`,
          { params: { q, limit: MAX_ITEMS }, timeout: 8000 },
        );
        if (lastReqRef.current !== reqId) return;
        const arr = Array.isArray(data?.items) ? data.items : [];
        setItems(arr.slice(0, MAX_ITEMS));
      } catch (e) {
        if (lastReqRef.current !== reqId) return;
        setError(isRu ? "Поиск временно недоступен" : "Search temporarily unavailable");
        setItems([]);
      } finally {
        if (lastReqRef.current === reqId) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, open, isRu]);

  useEffect(() => {
    setHoverIdx(-1);
  }, [items]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        onClose?.();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHoverIdx((i) =>
          Math.min(items.length - 1, i < 0 ? 0 : i + 1),
        );
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHoverIdx((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        const target = items[hoverIdx >= 0 ? hoverIdx : 0];
        if (target?.slug || target?.id) {
          e.preventDefault();
          navigate(`/cars/${encodeURIComponent(target.slug || target.id)}`);
          onClose?.();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, items, hoverIdx, navigate, onClose]);

  const q = (query || "").trim();
  const visible = open && q.length >= MIN_LEN;
  const panelClass = useMemo(
    () =>
      ["vinsd-panel", `vinsd-${variant}`, `vinsd-align-${align}`].join(" "),
    [variant, align],
  );

  if (!visible) return null;

  const handleLeadOpen = () => {
    openGetInTouch?.({
      source: "header_search_no_match",
      car_preference: q,
    });
    onClose?.();
  };

  return (
    <div
      ref={wrapperRef}
      className={panelClass}
      style={{ width }}
      role="listbox"
      aria-label={isRu ? "Подсказки поиска авто" : "Car search suggestions"}
      data-testid="car-search-dropdown"
    >
      {loading && (
        <div className="vinsd-state">
          <span className="vinsd-spinner" />{" "}
          {isRu ? "Ищем в каталоге…" : "Searching catalog…"}
        </div>
      )}
      {!loading && error && (
        <div className="vinsd-state vinsd-state--error">{error}</div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="vinsd-state" style={{ textAlign: "center", padding: "20px 16px" }}>
          <div style={{ fontSize: 14, marginBottom: 6, fontWeight: 600 }}>
            {isRu ? "Нет доступных предложений по запросу" : "No available matches for"}{" "}
            <span className="vinsd-q">{q}</span>.
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(245,240,232,0.72)", marginBottom: 12 }}>
            {isRu
              ? "Обратитесь к менеджеру для индивидуального подсчёта."
              : "Contact a manager for a personal calculation."}
          </div>
        </div>
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="vinsd-list">
          {items.map((it, idx) => {
            const subtitleBits = [
              it.year,
              fmtEur(it.price_eur),
            ].filter(Boolean);
            return (
              <li
                key={it.slug || it.id || idx}
                role="option"
                aria-selected={hoverIdx === idx}
                className={`vinsd-item${hoverIdx === idx ? " is-hover" : ""}`}
                onMouseEnter={() => setHoverIdx(idx)}
                onClick={() => {
                  if (!(it.slug || it.id)) return;
                  navigate(`/cars/${encodeURIComponent(it.slug || it.id)}`);
                  onClose?.();
                }}
                data-testid={`car-suggestion-${it.slug || it.id || idx}`}
              >
                <div className="vinsd-thumb">
                  {it.main_image_url ? (
                    <img
                      src={it.main_image_url}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.visibility = "hidden";
                      }}
                    />
                  ) : (
                    <span className="vinsd-thumb-fallback">CAR</span>
                  )}
                </div>
                <div className="vinsd-body">
                  <div className="vinsd-title">{fmtTitle(it, lang)}</div>
                  <div className="vinsd-sub">{subtitleBits.join(" · ")}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="vinsd-footer">
        <button
          type="button"
          className="vinsd-cta"
          onClick={handleLeadOpen}
          data-testid="car-search-lead-cta"
        >
          {isRu ? (
            <>
              Связаться с менеджером для подбора{" "}
              <strong>{q}</strong>
            </>
          ) : (
            <>
              Contact a manager about <strong>{q}</strong>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CarSearchDropdown;
