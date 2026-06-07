/**
 *  CalculatorPage — DM Auto under-key customs/clearance calculator.
 *
 *  Design language matches the Welcome page (figma_home):
 *    • Editorial section header with amber `//` kicker (no brackets)
 *    • White card with soft shadow, inset card for the cost-estimate
 *    • Custom dropdown (NOT native <select>) styled with our caret
 *    • Inline SVG vehicle icons (line-art, currentColor) — no PNG
 *    • Navy `#162E51` primary, amber `#F5A524` CTA / accent
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  GasPump as PhGasPump,
  Drop as PhDrop,
  BatteryCharging as PhBattery,
  Lightning as PhLightning,
} from '@phosphor-icons/react';
import { useLang } from '../../i18n';
import styles from './CalculatorPage.module.css';
import PageHero from '../../components/public/PageHero';
import { trackCalculatorUse, trackLeadSubmit } from '../../lib/tracker';

const API = process.env.REACT_APP_BACKEND_URL || '';

const fmtEUR = (v) => `€${Math.round(Number(v) || 0).toLocaleString('en-US')}`;
const MAX_PRICE_DIGITS = 7;
const formatThousands = (digits) =>
  digits ? String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '';

/* ── Bilingual labels ───────────────────────────────────────────── */
const T_ALL = {
  en: {
    crumbHome: 'home',
    crumbCalc: 'calculator',
    pageTitle: 'calculator',
    kicker: '// Online calculation',
    headline: 'Calculate your car under-key.',
    subline:
      'Customs duty, logistics and registration — all in one number. Editable rates per country, automatic route selection.',
    calcForm: 'Calculation form',
    destinationLabel: 'Country of registration',
    vehicleLabel: 'Vehicle type',
    yearLabel: 'Year of manufacture',
    fuelLabel: 'Engine type',
    volumeLabel: 'Engine displacement',
    priceLabel: 'Vehicle purchase price',
    pricePh: 'Enter the amount',
    yearPh: 'Select year',
    fuelPetrol: 'Petrol',
    fuelDiesel: 'Diesel',
    fuelHybrid: 'Hybrid',
    fuelElectric: 'Electric',
    volPh: 'Select volume',
    costEstimate: 'Cost estimate',
    purchasePrice: 'Vehicle purchase price',
    carAuctionTot: 'Car',
    inlineEU: 'EU inland transport',
    crossBorder: 'Cross-border delivery',
    insurance: 'Transport insurance',
    localDelivery: 'Local delivery',
    logisticsTot: 'Logistics',
    customsDuty: 'Customs duty',
    clearanceFee: 'Customs clearance fee',
    recyclingFee: 'Recycling fee',
    guaranteeFee: 'Customs guarantee',
    customsTot: 'Customs duties',
    brokerFee: 'Customs broker',
    warehouseFee: 'Temporary storage (СВХ)',
    sbktsFee: 'SBKTS certificate',
    eptsFee: 'EPTS (electronic passport)',
    registrationFee: 'Registration with traffic police',
    serviceFeeDm: 'DM Auto service fee',
    servicesTot: 'Services & paperwork',
    routeLabel: 'Route',
    grandTotal: 'Total under-key price',
    approxEm: 'Approximate estimate.',
    approxRest:
      ' Final number depends on the EUR/RUB rate on the customs day, the actual freight rate, and customs valuation. Contact DM Auto for a precise binding quote.',
    submitting: 'Submitting…',
    cta: 'Get a precise calculation',
    sedan: 'Sedan',
    suv: 'SUV',
    pickup: 'Pickup',
    van: 'Van',
    destBY: 'Belarus',
    destRU: 'Russia',
    toastPriceRequired: 'Please enter all required fields first.',
    toastSuccessPrecise:
      'Got it! Our team will reach out with a precise binding quote.',
    toastSuccessShort: 'Request received. We will be in touch shortly.',
    toastSubmitError:
      'Could not submit your request. Please try again or contact us directly.',
  },
  ru: {
    crumbHome: 'главная',
    crumbCalc: 'калькулятор',
    pageTitle: 'калькулятор',
    kicker: '// Онлайн-расчёт',
    headline: 'Рассчитайте свой автомобиль под ключ.',
    subline:
      'Растаможка, логистика и постановка на учёт — одной суммой. Ставки настраиваются по странам, маршрут подбирается автоматически.',
    calcForm: 'Форма расчёта',
    destinationLabel: 'Страна оформления',
    vehicleLabel: 'Тип кузова',
    yearLabel: 'Год выпуска',
    fuelLabel: 'Тип двигателя',
    volumeLabel: 'Объём двигателя',
    priceLabel: 'Стоимость автомобиля',
    pricePh: 'Укажите сумму',
    yearPh: 'Выберите год',
    fuelPetrol: 'Бензин',
    fuelDiesel: 'Дизель',
    fuelHybrid: 'Гибрид',
    fuelElectric: 'Электро',
    volPh: 'Выберите объём',
    costEstimate: 'Смета расходов',
    purchasePrice: 'Стоимость авто',
    carAuctionTot: 'Автомобиль',
    inlineEU: 'Доставка по ЕС',
    crossBorder: 'Доставка через границу',
    insurance: 'Страхование перевозки',
    localDelivery: 'Доставка по стране',
    logisticsTot: 'Логистика',
    customsDuty: 'Таможенная пошлина',
    clearanceFee: 'Таможенный сбор',
    recyclingFee: 'Утилизационный сбор',
    guaranteeFee: 'Обеспечение на таможне',
    customsTot: 'Таможенные платежи',
    brokerFee: 'Таможенный брокер',
    warehouseFee: 'СВХ (склад временного хранения)',
    sbktsFee: 'СБКТС',
    eptsFee: 'ЭПТС',
    registrationFee: 'Постановка на учёт',
    serviceFeeDm: 'Сервисный сбор DM Auto',
    servicesTot: 'Услуги и оформление',
    routeLabel: 'Маршрут',
    grandTotal: 'Итого под ключ',
    approxEm: 'Предварительный расчёт.',
    approxRest:
      ' Точная сумма зависит от курса EUR/RUB на день растаможки, фактической ставки фрахта и таможенной оценки. Свяжитесь с DM Auto для точного коммерческого предложения.',
    submitting: 'Отправляем…',
    cta: 'Получить точный расчёт',
    sedan: 'Седан',
    suv: 'Внедорожник',
    pickup: 'Пикап',
    van: 'Van',
    destBY: 'Беларусь',
    destRU: 'Россия',
    toastPriceRequired: 'Пожалуйста, заполните все обязательные поля.',
    toastSuccessPrecise:
      'Спасибо! Менеджер свяжется с вами с точным расчётом.',
    toastSuccessShort: 'Заявка принята. Мы скоро свяжемся с вами.',
    toastSubmitError:
      'Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь напрямую.',
  },
};

const DESTINATIONS = [
  { code: 'by', flag: '/figma/flag-by.svg' },
  { code: 'ru', flag: '/figma/flag-ru.svg' },
];

/* ── Vehicle icons (silhouettes from the original Figma kit at
 *   /figma/calc/veh-*.png). Rendered via CSS mask-image so the colour
 *   follows `currentColor` — automatically white on the active navy card,
 *   grey on inactive cards, navy on hover. */
const VEHICLE_TYPES = [
  { code: 'sedan',  icon: '/figma/calc/veh-sedan.png'  },
  { code: 'suv',    icon: '/figma/calc/veh-suv.png'    },
  { code: 'pickup', icon: '/figma/calc/veh-pickup.png' },
  { code: 'van',    icon: '/figma/calc/veh-van.png'    },
];

const FUEL_TYPES = [
  { code: 'petrol',   Icon: PhGasPump   },
  { code: 'diesel',   Icon: PhDrop      },
  { code: 'hybrid',   Icon: PhBattery   },
  { code: 'electric', Icon: PhLightning },
];

const VOLUMES_L = [
  '1.0', '1.2', '1.4', '1.6', '1.8',
  '2.0', '2.2', '2.5', '3.0', '3.5',
  '4.0', '4.5', '5.0',
];

const buildYearList = () => {
  const cur = new Date().getFullYear();
  const out = [];
  for (let y = cur; y >= cur - 25; y -= 1) out.push(String(y));
  return out;
};

const EMPTY_BREAKDOWN = {
  car: { price: 0 },
  logistics: { eu_inland: 0, cross_border: 0, insurance: 0, local_delivery: 0, total: 0 },
  customs: { duty: 0, customs_clearance_fee: 0, recycling_fee: 0, guarantee_fee: 0, total: 0 },
  services: { broker_fee: 0, warehouse_fee: 0, sbkts_fee: 0, epts_fee: 0, registration_fee: 0, service_fee_dm: 0, total: 0 },
};

/* ────────────────────── Custom dropdown ─────────────────────────── */
function Dropdown({ value, onChange, options, placeholder, testId }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selectedOpt = options.find((o) => o.value === value);
  const display = selectedOpt ? selectedOpt.label : placeholder;
  const isPlaceholder = !selectedOpt;

  return (
    <div className={styles.dropdown} ref={wrapRef}>
      <button
        type="button"
        className={[
          styles.dropdownTrigger,
          open ? styles.isOpen : '',
          isPlaceholder ? styles.isPlaceholder : '',
        ].join(' ').trim()}
        onClick={() => setOpen((v) => !v)}
        data-testid={testId}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{display}</span>
        <svg
          className={styles.dropdownCaret}
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2.5 4.5 L6 8 L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className={styles.dropdownPanel} role="listbox">
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={[
                  styles.dropdownOption,
                  selected ? styles.isSelected : '',
                ].join(' ').trim()}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                data-testid={`${testId}-opt-${opt.value}`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ────────────────────── Cost-row primitives ─────────────────────── */
const Row = ({ label, value }) => (
  <div className={styles.estRow}>
    <div className={styles.lbl}>{label}</div>
    <div className={styles.val}>{value}</div>
  </div>
);
const GroupTotal = ({ label, value }) => (
  <div className={styles.estGroupTotal}>
    <div className={styles.gtLbl}>{label}</div>
    <div className={styles.gtVal}>{value}</div>
  </div>
);

/* ====================================================================== */

export default function CalculatorPage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const { lang } = useLang();
  const T = lang === 'ru' ? T_ALL.ru : T_ALL.en;

  const initialPrice = (() => {
    const q = params.get('price');
    if (q == null || q === '') return '';
    const n = Number(q);
    if (!Number.isFinite(n) || n <= 0) return '';
    return String(Math.round(n)).slice(0, MAX_PRICE_DIGITS);
  })();
  const initialVin = (params.get('vin') || '').toUpperCase();

  const [destination, setDestination] = useState('by');
  const [vehicle, setVehicle] = useState('sedan');
  const [year, setYear] = useState('');
  const [fuel, setFuel] = useState('petrol');
  const [volumeL, setVolumeL] = useState('');
  const [priceStr, setPriceStr] = useState(initialPrice);
  const [vin] = useState(initialVin);

  const [breakdown, setBreakdown] = useState(EMPTY_BREAKDOWN);
  const [routeLabel, setRouteLabel] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const yearOptions = useMemo(
    () => buildYearList().map((y) => ({ value: y, label: y })),
    [],
  );
  const volumeOptions = useMemo(
    () => VOLUMES_L.map((v) => ({ value: v, label: `${v} L` })),
    [],
  );

  /* ── Live recompute (debounced) ───────────────────────────────────── */
  const debounceRef = useRef(null);
  const recompute = useCallback(async () => {
    const price = Number(priceStr) || 0;
    const yr = Number(year) || 0;
    const isElectric = fuel === 'electric';
    const vol = isElectric ? 0 : Math.round(Number(volumeL) * 1000);

    if (price <= 0 || !yr || (!vol && !isElectric)) {
      setBreakdown(EMPTY_BREAKDOWN);
      setRouteLabel('');
      setGrandTotal(0);
      return;
    }
    trackCalculatorUse({ vin: vin || undefined });
    try {
      const r = await axios.post(`${API}/api/customs/compute`, {
        country: destination,
        vehicle_type: vehicle,
        year: yr,
        fuel_type: fuel,
        engine_cc: vol,
        price_eur: price,
      });
      const d = r?.data || {};
      setBreakdown(d.breakdown || EMPTY_BREAKDOWN);
      setRouteLabel(d?.route?.label || '');
      setGrandTotal(d.grand_total || 0);
    } catch (e) {
      setBreakdown(EMPTY_BREAKDOWN);
      setRouteLabel('');
      setGrandTotal(0);
    }
  }, [destination, vehicle, year, fuel, volumeL, priceStr, vin]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(recompute, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [recompute]);

  /* ── CTA submit ─────────────────────────────────────────────────────── */
  const handleCta = async () => {
    const price = Number(priceStr) || 0;
    const yr = Number(year) || 0;
    const isElectric = fuel === 'electric';
    const vol = isElectric ? 0 : Math.round(Number(volumeL) * 1000);

    if (!price || !yr || (!vol && !isElectric)) {
      toast.error(T.toastPriceRequired);
      return;
    }
    setSubmitting(true);
    const destLabel = destination === 'ru' ? T.destRU : T.destBY;

    try {
      await axios.post(`${API}/api/public/leads/from-quote`, {
        origin: 'europe',
        destination,
        vehicleType: vehicle,
        year: yr,
        fuel_type: fuel,
        engine_cc: vol,
        price,
        total: grandTotal,
        currency: 'EUR',
        source: 'calculator',
        message: `Customs calculator — ${destLabel} / ${vehicle} / ${yr} / ${fuel}${vol ? ' / ' + (vol / 1000).toFixed(1) + 'L' : ''} / €${price.toLocaleString()} → under-key €${Math.round(grandTotal).toLocaleString()}`,
      });
      toast.success(T.toastSuccessPrecise);
      trackLeadSubmit({ vin: vin || undefined });
    } catch (_) {
      try {
        await axios.post(`${API}/api/quick-leads`, {
          name: 'Calculator request',
          phone: '',
          message: `Customs calculator — ${destLabel} / ${vehicle} / ${yr} / ${fuel} / €${price} / under-key €${Math.round(grandTotal)}`,
          source: 'calculator',
        });
        toast.success(T.toastSuccessShort);
      } catch {
        toast.error(T.toastSubmitError);
        setSubmitting(false);
        return;
      }
    }
    navigate('/contacts', { state: { source: 'calculator' } });
    setSubmitting(false);
  };

  const b = breakdown;
  const isElectric = fuel === 'electric';

  return (
    <div className={styles.calcPage} data-testid="calculator-page">
      <PageHero
        home={T.crumbHome}
        crumbs={[{ label: T.crumbCalc }]}
        title={T.pageTitle}
        testId="calculator-hero"
      />
      <div className={styles.container}>
        {/* ── Editorial section header (no brackets) ───────────────── */}
        <header className={styles.editorialHead} data-testid="calc-editorial-head">
          <div className={styles.kicker}>{T.kicker}</div>
          <h2 className={styles.headline}>{T.headline}</h2>
          <p className={styles.subline}>{T.subline}</p>
        </header>

        <div className={styles.calcBlock} data-testid="calc-block">

          {/* ─────────────────── LEFT — Calculation form ─────────────── */}
          <section className={`${styles.col} ${styles.colLeft}`} data-testid="calc-left">
            <div className={styles.sectionHead}><h2>{T.calcForm}</h2></div>

            <div className={styles.formStack}>
              {/* Country */}
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  {T.destinationLabel} <span className={styles.req}>*</span>
                </div>
                <div className={styles.ctryRow} role="tablist" aria-label={T.destinationLabel}>
                  {DESTINATIONS.map((d) => {
                    const active = destination === d.code;
                    const label = d.code === 'by' ? T.destBY : T.destRU;
                    return (
                      <button
                        key={d.code}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-testid={`destination-${d.code}`}
                        onClick={() => setDestination(d.code)}
                        className={`${styles.ctryBtn} ${active ? styles.ctryActive : ''}`}
                      >
                        <img className={styles.flag} src={d.flag} alt="" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle type */}
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  {T.vehicleLabel} <span className={styles.req}>*</span>
                </div>
                <div className={styles.vehRow} role="radiogroup" aria-label={T.vehicleLabel}>
                  {VEHICLE_TYPES.map((v) => {
                    const active = vehicle === v.code;
                    return (
                      <button
                        key={v.code}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        data-testid={`vehicle-${v.code}`}
                        onClick={() => setVehicle(v.code)}
                        className={`${styles.vehCard} ${active ? styles.vehCardActive : ''}`}
                      >
                        <span
                          className={styles.vehIcon}
                          style={{
                            WebkitMaskImage: `url(${v.icon})`,
                            maskImage: `url(${v.icon})`,
                          }}
                          aria-hidden="true"
                        />
                        <span>{T[v.code] || v.code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year */}
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  {T.yearLabel} <span className={styles.req}>*</span>
                </div>
                <Dropdown
                  value={year}
                  onChange={setYear}
                  options={yearOptions}
                  placeholder={T.yearPh}
                  testId="calc-year"
                />
              </div>

              {/* Fuel type */}
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  {T.fuelLabel} <span className={styles.req}>*</span>
                </div>
                <div className={styles.fuelRow} role="tablist" aria-label={T.fuelLabel}>
                  {FUEL_TYPES.map((f) => {
                    const labels = {
                      petrol: T.fuelPetrol,
                      diesel: T.fuelDiesel,
                      hybrid: T.fuelHybrid,
                      electric: T.fuelElectric,
                    };
                    const active = fuel === f.code;
                    const Icon = f.Icon;
                    return (
                      <button
                        key={f.code}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        data-testid={`fuel-${f.code}`}
                        onClick={() => setFuel(f.code)}
                        className={`${styles.fuelBtn} ${active ? styles.fuelActive : ''}`}
                      >
                        <Icon className={styles.fuelIcon} size={18} weight="duotone" aria-hidden="true" />
                        <span>{labels[f.code]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Engine volume — hidden when electric */}
              {!isElectric && (
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>
                    {T.volumeLabel} <span className={styles.req}>*</span>
                  </div>
                  <Dropdown
                    value={volumeL}
                    onChange={setVolumeL}
                    options={volumeOptions}
                    placeholder={T.volPh}
                    testId="calc-volume"
                  />
                </div>
              )}

              {/* Price */}
              <div className={styles.field}>
                <div className={styles.fieldLabel}>
                  {T.priceLabel} <span className={styles.req}>*</span>
                </div>
                <div className={styles.inputShell}>
                  <span className={styles.prefix}>€</span>
                  <input
                    className={styles.txtInput}
                    type="text"
                    inputMode="numeric"
                    placeholder={T.pricePh}
                    value={formatThousands(priceStr)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, MAX_PRICE_DIGITS);
                      setPriceStr(digits);
                    }}
                    maxLength={MAX_PRICE_DIGITS + Math.floor((MAX_PRICE_DIGITS - 1) / 3)}
                    data-testid="calc-price-input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────── RIGHT — Cost estimate ───────────────── */}
          <section className={`${styles.col} ${styles.colRight}`} data-testid="calc-right">
            <div className={styles.sectionHead}><h2>{T.costEstimate}</h2></div>

            <div className={styles.estStack}>
              {/* Car */}
              <div className={styles.estGroup}>
                <Row label={T.purchasePrice} value={fmtEUR(b?.car?.price)} />
                <GroupTotal label={T.carAuctionTot} value={fmtEUR(b?.car?.price)} />
              </div>

              {/* Logistics */}
              <div className={styles.estGroup}>
                {routeLabel ? (
                  <div className={styles.routeChip}>
                    <span>{T.routeLabel}:</span>
                    <strong style={{ fontWeight: 700 }}>{routeLabel}</strong>
                  </div>
                ) : null}
                <Row label={T.inlineEU} value={fmtEUR(b?.logistics?.eu_inland)} />
                <Row label={T.crossBorder} value={fmtEUR(b?.logistics?.cross_border)} />
                <Row label={T.insurance} value={fmtEUR(b?.logistics?.insurance)} />
                <Row label={T.localDelivery} value={fmtEUR(b?.logistics?.local_delivery)} />
                <GroupTotal label={T.logisticsTot} value={fmtEUR(b?.logistics?.total)} />
              </div>

              {/* Customs */}
              <div className={styles.estGroup}>
                <Row label={T.customsDuty} value={fmtEUR(b?.customs?.duty)} />
                <Row label={T.clearanceFee} value={fmtEUR(b?.customs?.customs_clearance_fee)} />
                <Row label={T.recyclingFee} value={fmtEUR(b?.customs?.recycling_fee)} />
                <Row label={T.guaranteeFee} value={fmtEUR(b?.customs?.guarantee_fee)} />
                <GroupTotal label={T.customsTot} value={fmtEUR(b?.customs?.total)} />
              </div>

              {/* Services */}
              <div className={styles.estGroup}>
                <Row label={T.brokerFee} value={fmtEUR(b?.services?.broker_fee)} />
                <Row label={T.warehouseFee} value={fmtEUR(b?.services?.warehouse_fee)} />
                <Row label={T.sbktsFee} value={fmtEUR(b?.services?.sbkts_fee)} />
                <Row label={T.eptsFee} value={fmtEUR(b?.services?.epts_fee)} />
                <Row label={T.registrationFee} value={fmtEUR(b?.services?.registration_fee)} />
                <Row label={T.serviceFeeDm} value={fmtEUR(b?.services?.service_fee_dm)} />
                <GroupTotal label={T.servicesTot} value={fmtEUR(b?.services?.total)} />
              </div>

              {/* Grand total */}
              <div className={styles.grandTotal} data-testid="calc-grand-total">
                <h3>{T.grandTotal}</h3>
                <h3 className={styles.totalVal}>{fmtEUR(grandTotal)}</h3>
              </div>

              {/* Disclaimer */}
              <div className={styles.disclaimer}>
                <span className={styles.em}>{T.approxEm}</span>
                {T.approxRest}
              </div>

              {/* CTA */}
              <button
                type="button"
                className={styles.ctaBtn}
                onClick={handleCta}
                disabled={submitting}
                data-testid="calc-cta-submit"
              >
                {submitting ? T.submitting : T.cta}
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
