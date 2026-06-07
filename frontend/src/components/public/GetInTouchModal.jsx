/**
 * GetInTouchModal — DM Auto "Связаться с нами / Get in touch" modal.
 *
 * Полностью переписана (2026-06-07):
 *   • Светлая cream-карточка в стиле Welcome (#F5F0E8 фон, navy #0F1729 текст,
 *     amber #FEAE00 акценты). Полный контраст, всё читается.
 *   • Двуязычная (RU/EN) через useLang().
 *   • Выбор страны телефона: 🇧🇾 Беларусь (+375) / 🇷🇺 Россия (+7) — БЕЗ Болгарии.
 *   • Поле "Бюджет" (число, EUR/USD).
 *   • Сквозная кнопка-модалка через GetInTouchProvider.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useLang } from "../../i18n";
import { usePolicyModal } from "./PolicyModal";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// ── i18n strings ────────────────────────────────────────────────────────────
const T_ALL = {
  ru: {
    title: "Связаться с нами",
    subtitle:
      "Расскажите, какой автомобиль вас интересует — менеджер свяжется с вами в ближайшее время.",
    name: "Имя",
    namePh: "Ваше имя",
    phone: "Телефон / Telegram / WhatsApp",
    email: "Email",
    emailPh: "your@email.com",
    budget: "Бюджет",
    budgetPh: "Например, 25000",
    car: "Желаемый автомобиль",
    carPh: "BMW X5, Audi A6, Tesla Model 3…",
    message: "Дополнительные пожелания",
    messagePh: "Опишите ваши предпочтения…",
    countryBy: "Беларусь",
    countryRu: "Россия",
    countryByShort: "BY",
    countryRuShort: "RU",
    send: "Отправить заявку",
    sending: "Отправляем…",
    successTitle: "Заявка успешно отправлена",
    successText: "Менеджер свяжется с вами в ближайшее время.",
    successClose: "Закрыть",
    errName: "Введите имя (минимум 2 символа).",
    errPhone:
      "Введите корректный номер телефона. Беларусь: +375 XX XXX-XX-XX, Россия: +7 XXX XXX-XX-XX.",
    errEmail: "Введите корректный Email.",
    errSubmit:
      "Не удалось отправить заявку. Попробуйте ещё раз или позвоните напрямую.",
    disclaimer: "Отправляя заявку, вы соглашаетесь с",
    policyName: "Политикой конфиденциальности",
    req: "обязательно",
  },
  en: {
    title: "Get in touch",
    subtitle:
      "Tell us what car you are looking for and our manager will contact you shortly.",
    name: "Name",
    namePh: "Your name",
    phone: "Phone / Telegram / WhatsApp",
    email: "Email",
    emailPh: "your@email.com",
    budget: "Budget",
    budgetPh: "e.g. 25000",
    car: "Car preference",
    carPh: "BMW X5, Audi A6, Tesla Model 3…",
    message: "Additional wishes",
    messagePh: "Describe your preferences…",
    countryBy: "Belarus",
    countryRu: "Russia",
    countryByShort: "BY",
    countryRuShort: "RU",
    send: "Send request",
    sending: "Sending…",
    successTitle: "Request sent successfully",
    successText: "Our manager will contact you shortly.",
    successClose: "Close",
    errName: "Please enter your name (at least 2 characters).",
    errPhone:
      "Please enter a valid phone. Belarus: +375 XX XXX-XX-XX, Russia: +7 XXX XXX-XX-XX.",
    errEmail: "Please enter a valid email address.",
    errSubmit:
      "Could not send your request. Please try again or call us directly.",
    disclaimer: "By sending this request you agree to our",
    policyName: "Privacy Policy",
    req: "required",
  },
};

// ── Phone validation per country ────────────────────────────────────────────
// Belarus: +375 + 9 digits (12 total). Russia: +7 + 10 digits (11 total).
const PHONE_RULES = {
  by: {
    prefix: "+375",
    digitsAfter: 9,
    flag: "🇧🇾",
    placeholder: "+375 29 123 45 67",
    regex: /^\+375\d{9}$/,
  },
  ru: {
    prefix: "+7",
    digitsAfter: 10,
    flag: "🇷🇺",
    placeholder: "+7 912 345 67 89",
    regex: /^\+7\d{10}$/,
  },
};

// ── Context ─────────────────────────────────────────────────────────────────
const GetInTouchContext = createContext({
  open: () => {},
  close: () => {},
  isOpen: false,
});

export const useGetInTouch = () => useContext(GetInTouchContext);

export function GetInTouchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaults, setDefaults] = useState(null);

  const open = useCallback((preset) => {
    setDefaults(preset || null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const ctx = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <GetInTouchContext.Provider value={ctx}>
      {children}
      {isOpen && <GetInTouchModal onClose={close} initial={defaults} />}
    </GetInTouchContext.Provider>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function captureUtm() {
  try {
    const sp = new URLSearchParams(window.location.search);
    const out = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach(
      (k) => {
        const v = sp.get(k);
        if (v) out[k] = v;
      },
    );
    return out;
  } catch {
    return {};
  }
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const initialForm = (country = "by") => ({
  name: "",
  country, // 'by' | 'ru'
  phone: PHONE_RULES[country].prefix,
  email: "",
  budget: "",
  currency: "EUR",
  car_preference: "",
  message: "",
});

// ── Modal component ─────────────────────────────────────────────────────────
function GetInTouchModal({ onClose, initial }) {
  const { lang } = useLang();
  const T = lang === "ru" ? T_ALL.ru : T_ALL.en;
  const { open: openPolicy } = usePolicyModal();

  const [form, setForm] = useState(() => ({ ...initialForm("by"), ...(initial || {}) }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const titleOverride = initial?.title;
  const subtitleOverride = initial?.subtitle;

  // When user switches country tab → reset phone to that prefix
  const setCountry = (c) => {
    setForm((s) => ({ ...s, country: c, phone: PHONE_RULES[c].prefix }));
    if (error) setError("");
  };

  const set = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target?.value ?? e }));

  const onPhoneChange = (e) => {
    const rule = PHONE_RULES[form.country];
    let v = e.target.value;
    // Keep prefix locked; allow only digits after prefix, up to digitsAfter.
    if (!v.startsWith(rule.prefix)) {
      // user tried to delete prefix — restore it but keep any digits they had after.
      const trailingDigits = v.replace(/\D/g, "").slice(rule.prefix.replace(/\D/g, "").length);
      v = rule.prefix + trailingDigits.slice(0, rule.digitsAfter);
    } else {
      const after = v.slice(rule.prefix.length).replace(/\D/g, "").slice(0, rule.digitsAfter);
      v = rule.prefix + after;
    }
    setForm((s) => ({ ...s, phone: v }));
    if (error) setError("");
  };

  // Lock page scroll + ESC to close
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const validate = () => {
    if (!form.name.trim() || form.name.trim().length < 2) return T.errName;
    const phone = (form.phone || "").replace(/\s/g, "");
    const rule = PHONE_RULES[form.country];
    if (!rule.regex.test(phone)) return T.errPhone;
    if (form.email && !EMAIL_RE.test(form.email.trim())) return T.errEmail;
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const budgetNum = (() => {
        const raw = String(form.budget || "").replace(/\s/g, "").replace(",", ".");
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : null;
      })();
      const payload = {
        source: initial?.source || "website_get_in_touch",
        channel: "website",
        name: form.name.trim(),
        phone: form.phone.replace(/\s/g, ""),
        email: form.email.trim() || null,
        budget: budgetNum,
        currency: form.currency || "EUR",
        car_preference: form.car_preference.trim() || null,
        message: form.message.trim() || null,
        landing_page: typeof window !== "undefined" ? window.location.href : null,
        utm: captureUtm(),
      };
      await axios.post(`${API_URL}/api/public/lead-requests`, payload);
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || T.errSubmit;
      setError(typeof msg === "string" ? msg : T.errSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  const phoneRule = PHONE_RULES[form.country];

  return (
    <div
      className="git2-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="git2-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="get-in-touch-modal"
    >
      <div className="git2-card">
        <button
          type="button"
          className="git2-close"
          aria-label="Close"
          onClick={onClose}
          data-testid="get-in-touch-close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>

        {!success ? (
          <>
            <header className="git2-head">
              <div className="git2-kicker">// {lang === "ru" ? "Заявка" : "Request"}</div>
              <h2 id="git2-title" className="git2-title">
                {titleOverride || T.title}
              </h2>
              <p className="git2-subtitle">{subtitleOverride || T.subtitle}</p>
            </header>

            <form className="git2-form" onSubmit={submit} noValidate>
              {/* Name */}
              <div className="git2-field">
                <label htmlFor="git2-name" className="git2-label">
                  {T.name} <span className="git2-req">*</span>
                </label>
                <input
                  id="git2-name"
                  type="text"
                  className="git2-input"
                  placeholder={T.namePh}
                  value={form.name}
                  onChange={set("name")}
                  autoComplete="name"
                  required
                  data-testid="git-input-name"
                />
              </div>

              {/* Country tabs */}
              <div className="git2-field">
                <label className="git2-label">
                  {T.phone} <span className="git2-req">*</span>
                </label>
                <div className="git2-country-tabs" role="tablist" aria-label="country">
                  {["by", "ru"].map((c) => {
                    const active = form.country === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setCountry(c)}
                        className={`git2-country-tab ${active ? "is-active" : ""}`}
                        data-testid={`git-country-${c}`}
                      >
                        <span className="git2-country-flag" aria-hidden="true">{PHONE_RULES[c].flag}</span>
                        <span>{c === "by" ? T.countryBy : T.countryRu}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  id="git2-phone"
                  type="tel"
                  inputMode="tel"
                  className="git2-input git2-input--phone"
                  placeholder={phoneRule.placeholder}
                  value={form.phone}
                  onChange={onPhoneChange}
                  autoComplete="tel"
                  required
                  data-testid="git-input-phone"
                />
              </div>

              {/* Email */}
              <div className="git2-field">
                <label htmlFor="git2-email" className="git2-label">
                  {T.email}
                </label>
                <input
                  id="git2-email"
                  type="email"
                  className="git2-input"
                  placeholder={T.emailPh}
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  data-testid="git-input-email"
                />
              </div>

              {/* Budget row: number + currency */}
              <div className="git2-field">
                <label htmlFor="git2-budget" className="git2-label">
                  {T.budget}
                </label>
                <div className="git2-budget-row">
                  <input
                    id="git2-budget"
                    type="text"
                    inputMode="numeric"
                    className="git2-input git2-input--budget"
                    placeholder={T.budgetPh}
                    value={form.budget}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        budget: e.target.value.replace(/[^\d\s.,]/g, ""),
                      }))
                    }
                    data-testid="git-input-budget"
                  />
                  <div className="git2-currency" role="tablist" aria-label="currency">
                    {["EUR", "USD"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={form.currency === c}
                        onClick={() => setForm((s) => ({ ...s, currency: c }))}
                        className={`git2-currency-btn ${form.currency === c ? "is-active" : ""}`}
                        data-testid={`git-currency-${c.toLowerCase()}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Car preference */}
              <div className="git2-field">
                <label htmlFor="git2-car" className="git2-label">
                  {T.car}
                </label>
                <input
                  id="git2-car"
                  type="text"
                  className="git2-input"
                  placeholder={T.carPh}
                  value={form.car_preference}
                  onChange={set("car_preference")}
                  data-testid="git-input-car"
                />
              </div>

              {/* Message */}
              <div className="git2-field">
                <label htmlFor="git2-msg" className="git2-label">
                  {T.message}
                </label>
                <textarea
                  id="git2-msg"
                  rows={3}
                  className="git2-input git2-textarea"
                  placeholder={T.messagePh}
                  value={form.message}
                  onChange={set("message")}
                  data-testid="git-input-message"
                />
              </div>

              {error && (
                <div className="git2-error" role="alert" data-testid="git-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="git2-submit"
                disabled={submitting}
                data-testid="git-submit"
              >
                {submitting ? T.sending : T.send}
              </button>

              <p className="git2-disclaimer">
                {T.disclaimer}{" "}
                <button
                  type="button"
                  className="git2-policy-link"
                  onClick={() => openPolicy("privacy")}
                  data-testid="git-privacy-link"
                >
                  {T.policyName}
                </button>
                .
              </p>
            </form>
          </>
        ) : (
          <div className="git2-success" data-testid="git-success">
            <div className="git2-success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="git2-success-title">{T.successTitle}</h3>
            <p className="git2-success-text">{T.successText}</p>
            <button
              type="button"
              className="git2-success-btn"
              onClick={onClose}
              data-testid="git-success-close"
            >
              {T.successClose}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GetInTouchModal;
