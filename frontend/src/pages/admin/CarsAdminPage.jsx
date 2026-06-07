/**
 * Admin > Cars (BIBI 2026-06 pivot)
 * ================================================================
 * Single-source admin UI for the curated car catalogue that powers
 * the home-page "Подборка недели" block and the public single-car
 * detail page.  No VIN lookups, no parser dependency — every field
 * is typed in by the admin and every photo is uploaded by hand.
 *
 * Layout
 * ------
 *   ┌─ AdminPageHeader (title + "+ Создать") ──────────────────────┐
 *   ├─ Filter bar (budget / status) ───────────────────────────────┤
 *   ├─ Grid of CarRow items, sortable via @hello-pangea/dnd ───────┤
 *   └─ Floating "Save bar" when reorder dirty ─────────────────────┘
 *
 *   Click "Edit" → CarEditor Dialog (8 sections, photo grid with
 *   drag-reorder, publish toggle).
 *
 * API contract
 * ------------
 *   GET    /api/admin/cars                       list
 *   POST   /api/admin/cars                       create
 *   PATCH  /api/admin/cars/:id                   update
 *   DELETE /api/admin/cars/:id                   delete
 *   POST   /api/admin/cars/:id/images            multipart upload
 *   DELETE /api/admin/cars/:id/images            body {url}
 *   POST   /api/admin/cars/:id/images/reorder    body {gallery:[…]}
 *   POST   /api/admin/cars/reorder               body {order:[id…]}
 *
 * Conventions
 * -----------
 *   • Uses AdminPageHeader/AdminCard primitives from /components/ui.
 *   • Auth token injected by global axios default header (see App.js).
 *   • Mazzard typography + slate/amber palette to match the rest of
 *     the admin area.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import {
  Car,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  CheckCircle2,
  EyeOff,
  Save,
  X,
  Upload,
  Sparkles,
  Star,
  Loader2,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminCard,
} from '../../components/ui/AdminPagePrimitives';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ── Enumerations ─────────────────────────────────────────────────── */
const BODY_TYPES = [
  { value: 'sedan',      label: 'Седан' },
  { value: 'suv',        label: 'Внедорожник' },
  { value: 'crossover',  label: 'Кроссовер' },
  { value: 'wagon',      label: 'Универсал' },
  { value: 'hatchback',  label: 'Хэтчбек' },
  { value: 'liftback',   label: 'Лифтбэк' },
  { value: 'coupe',      label: 'Купе' },
  { value: 'cabrio',     label: 'Кабриолет' },
  { value: 'pickup',     label: 'Пикап' },
  { value: 'minivan',    label: 'Минивэн' },
  { value: 'van',        label: 'Фургон' },
  { value: 'motorbike',  label: 'Мотоцикл' },
];

const ENGINE_TYPES = [
  { value: 'petrol',         label: 'Бензин' },
  { value: 'diesel',         label: 'Дизель' },
  { value: 'hybrid',         label: 'Гибрид' },
  { value: 'plugin_hybrid',  label: 'Plug-in гибрид' },
  { value: 'electric',       label: 'Электро' },
  { value: 'gas',            label: 'Газ / LPG' },
];

const TRANSMISSIONS = [
  { value: 'manual',     label: 'Механика' },
  { value: 'automatic',  label: 'Автомат' },
  { value: 'dct',        label: 'Робот DCT' },
  { value: 'cvt',        label: 'Вариатор CVT' },
  { value: 'robot',      label: 'Робот' },
];

const DRIVES = [
  { value: 'fwd',  label: 'Передний' },
  { value: 'rwd',  label: 'Задний' },
  { value: 'awd',  label: 'AWD' },
  { value: '4wd',  label: '4WD' },
];

const CONDITIONS = [
  { value: 'excellent',  label: 'Отличное' },
  { value: 'very_good',  label: 'Очень хорошее' },
  { value: 'good',       label: 'Хорошее' },
  { value: 'fair',       label: 'Удовлетворительное' },
];

const DAMAGES = [
  { value: 'none',       label: 'Без повреждений' },
  { value: 'light',      label: 'Лёгкие косметические' },
  { value: 'moderate',   label: 'Средние' },
  { value: 'repaired',   label: 'Восстановлено' },
];

const ADMIN_BADGES = [
  { value: 'neutral',      label: 'Без бейджа' },
  { value: 'top_pick',     label: '⭐ Топ выбор',         tone: 'amber' },
  { value: 'best_price',   label: '💰 Лучшая цена',      tone: 'green' },
  { value: 'underpriced',  label: '🎯 Недооценен',        tone: 'rose' },
  { value: 'recommended',  label: '✅ Рекомендуем',       tone: 'sky' },
  { value: 'rare_find',    label: '🔥 Редкая находка',    tone: 'violet' },
  { value: 'low_mileage',  label: '🛣️ Малый пробег',     tone: 'teal' },
];

const BUDGET_BUCKETS = [
  { value: 'all',        label: 'Все цены' },
  { value: 'under_10k',  label: 'до 10 000 €' },
  { value: '10_15k',     label: '10–15 тыс. €' },
  { value: '15_25k',     label: '15–25 тыс. €' },
  { value: '25_40k',     label: '25–40 тыс. €' },
  { value: '40_60k',     label: '40–60 тыс. €' },
  { value: '60k_plus',   label: '60 000 € +' },
];

const PLACEHOLDER_IMG = (
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'>
       <rect width='200' height='140' fill='#F1F1ED'/>
       <path d='M40 90 L70 65 L100 80 L130 55 L160 90' stroke='#C8C2B6' stroke-width='3' fill='none'/>
       <circle cx='62' cy='52' r='10' fill='#E6DFD0'/>
     </svg>`
  )
);

/* ── Small UI helpers ─────────────────────────────────────────────── */
const fieldCls =
  'w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400';
const taCls =
  'w-full min-h-[88px] px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-800 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-y';
const labelCls =
  'block text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-500 mb-1.5';
const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-amber-500 text-slate-900 ' +
  'text-sm font-semibold hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition';
const btnSecondary =
  'inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-white text-slate-700 border border-slate-200 ' +
  'text-sm font-medium hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition';
const btnDanger =
  'inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg bg-white text-rose-600 border border-rose-200 ' +
  'text-sm font-medium hover:bg-rose-50 transition';

const formatEUR = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
};

const formatKm = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isNaN(n) ? '—' : `${n.toLocaleString('ru-RU')} км`;
};

const imgUrl = (rel) => {
  if (!rel) return PLACEHOLDER_IMG;
  if (rel.startsWith('http://') || rel.startsWith('https://') || rel.startsWith('data:')) return rel;
  return `${API_URL}${rel}`;
};

const budgetLabel = (b) =>
  BUDGET_BUCKETS.find((x) => x.value === b)?.label || '—';

const badgeInfo = (key) =>
  ADMIN_BADGES.find((b) => b.value === key) ||
  { value: 'neutral', label: '—', tone: 'slate' };

/* ──────────────────────────────────────────────────────────────────
 * Photo grid (drag-reorder + delete) — used inside the editor
 * ────────────────────────────────────────────────────────────────── */
function PhotoGrid({ gallery, onReorder, onDelete }) {
  if (!Array.isArray(gallery) || gallery.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 bg-slate-50/40">
        Загруженных фотографий нет. Используйте поле выше, чтобы добавить.
      </div>
    );
  }

  return (
    <DragDropContext
      onDragEnd={(result) => {
        if (!result.destination) return;
        const next = [...gallery];
        const [moved] = next.splice(result.source.index, 1);
        next.splice(result.destination.index, 0, moved);
        onReorder(next);
      }}
    >
      <Droppable droppableId="gallery" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          >
            {gallery.map((url, idx) => (
              <Draggable draggableId={url} index={idx} key={url}>
                {(p) => (
                  <div
                    ref={p.innerRef}
                    {...p.draggableProps}
                    {...p.dragHandleProps}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3]"
                  >
                    <img
                      src={imgUrl(url)}
                      alt={`car-${idx}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                    {idx === 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-900 text-[10px] font-bold uppercase tracking-wide">
                        Главное
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(url); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 text-rose-600 grid place-items-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-rose-50"
                      title="Удалить фото"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Editor dialog
 * ────────────────────────────────────────────────────────────────── */
function CarEditor({ open, initial, onClose, onSaved }) {
  const isCreate = !initial;
  const [form, setForm] = useState(() => ({
    make: '',
    model: '',
    generation: '',
    year: new Date().getFullYear() - 2,
    title_ru: '',
    title_en: '',
    body_type: 'sedan',
    color_name: '',
    color_hex: '#111827',
    seats: 5,
    doors: 5,
    engine_type: 'petrol',
    engine_volume_l: 2.0,
    power_hp: 180,
    power_kw: '',
    transmission: 'automatic',
    drive: 'awd',
    mileage_km: 50000,
    condition: 'very_good',
    damage: 'none',
    accident_history: false,
    service_history: '',
    price_eur: '',
    currency: 'EUR',
    price_is_approximate: true,
    admin_badge: 'neutral',
    admin_note_ru: '',
    admin_note_en: '',
    recommended: true,
    options: [],
    main_image_url: null,
    gallery: [],
    video_url: '',
    published: false,
    ...(initial || {}),
  }));
  const [optionsText, setOptionsText] = useState(
    Array.isArray(initial?.options) ? initial.options.join(', ') : ''
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  // Local copy of the current car (with id, gallery) — needed for uploads
  const [carId, setCarId] = useState(initial?.id || null);

  // Re-sync if `initial` changes (parent re-opens with different car)
  useEffect(() => {
    if (open) {
      setForm({
        make: '', model: '', generation: '', year: new Date().getFullYear() - 2,
        title_ru: '', title_en: '',
        body_type: 'sedan', color_name: '', color_hex: '#111827',
        seats: 5, doors: 5,
        engine_type: 'petrol', engine_volume_l: 2.0, power_hp: 180, power_kw: '',
        transmission: 'automatic', drive: 'awd',
        mileage_km: 50000, condition: 'very_good', damage: 'none',
        accident_history: false, service_history: '',
        price_eur: '', currency: 'EUR', price_is_approximate: true,
        admin_badge: 'neutral', admin_note_ru: '', admin_note_en: '', recommended: true,
        options: [], main_image_url: null, gallery: [], video_url: '',
        published: false,
        ...(initial || {}),
      });
      setOptionsText(Array.isArray(initial?.options) ? initial.options.join(', ') : '');
      setCarId(initial?.id || null);
      setError(null);
    }
  }, [open, initial]);

  const setField = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setForm((p) => ({ ...p, [k]: v }));
  };

  const buildPayload = () => {
    const opts = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ...form,
      options: opts,
      // Coerce numeric strings to numbers (backend tolerates either)
      year: form.year === '' || form.year === null ? null : Number(form.year),
      seats: form.seats === '' ? null : Number(form.seats),
      doors: form.doors === '' ? null : Number(form.doors),
      engine_volume_l: form.engine_volume_l === '' ? null : Number(form.engine_volume_l),
      power_hp: form.power_hp === '' ? null : Number(form.power_hp),
      power_kw: form.power_kw === '' ? null : Number(form.power_kw),
      mileage_km: form.mileage_km === '' ? null : Number(form.mileage_km),
      price_eur: form.price_eur === '' ? null : Number(form.price_eur),
    };
  };

  const save = async (closeAfter = true) => {
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      let car;
      if (carId) {
        const r = await axios.patch(`${API_URL}/api/admin/cars/${carId}`, payload);
        car = r.data;
      } else {
        const r = await axios.post(`${API_URL}/api/admin/cars`, payload);
        car = r.data;
        setCarId(car.id);
      }
      onSaved(car);
      if (closeAfter) onClose();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Не удалось сохранить';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    // Need a saved car to attach images to — auto-save if creating
    let id = carId;
    if (!id) {
      try {
        const payload = buildPayload();
        const r = await axios.post(`${API_URL}/api/admin/cars`, payload);
        id = r.data.id;
        setCarId(id);
        setForm((p) => ({ ...p, id }));
      } catch (e) {
        setError(e?.response?.data?.detail || 'Сначала заполните Make/Model — карточка сохранится автоматически');
        return;
      }
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const f of filesList) fd.append('files', f);
      const r = await axios.post(`${API_URL}/api/admin/cars/${id}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const car = r.data?.car;
      if (car) {
        setForm((p) => ({
          ...p,
          gallery: car.gallery || [],
          main_image_url: car.main_image_url || null,
        }));
        onSaved(car);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || 'Не удалось загрузить файлы');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = async (url) => {
    if (!carId) {
      setForm((p) => ({
        ...p,
        gallery: (p.gallery || []).filter((u) => u !== url),
        main_image_url: p.main_image_url === url ? null : p.main_image_url,
      }));
      return;
    }
    try {
      const r = await axios.delete(`${API_URL}/api/admin/cars/${carId}/images`, { data: { url } });
      const car = r.data;
      setForm((p) => ({
        ...p,
        gallery: car.gallery || [],
        main_image_url: car.main_image_url || null,
      }));
      onSaved(car);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Не удалось удалить фото');
    }
  };

  const reorderImages = async (newGallery) => {
    setForm((p) => ({ ...p, gallery: newGallery, main_image_url: newGallery[0] || null }));
    if (!carId) return;
    try {
      await axios.post(`${API_URL}/api/admin/cars/${carId}/images/reorder`, { gallery: newGallery });
    } catch (e) {
      setError(e?.response?.data?.detail || 'Не удалось сохранить порядок');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-900/55 backdrop-blur-sm flex items-stretch justify-end">
      <div
        className="bg-[#FAFAFA] w-full max-w-[920px] h-full overflow-y-auto shadow-2xl"
        style={{ fontFamily: "'Mazzard H', 'Mazzard', system-ui, sans-serif" }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 grid place-items-center">
              <Car size={20} />
            </span>
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 truncate">
                {isCreate ? 'Новая карточка автомобиля' : `${form.make || '—'} ${form.model || ''}`.trim()}
              </div>
              <div className="text-xs text-slate-500">
                {isCreate ? 'Заполните данные и опубликуйте подборку' : `slug: ${initial?.slug || '—'}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 select-none mr-2">
              <input
                type="checkbox"
                checked={!!form.published}
                onChange={setField('published')}
                className="w-4 h-4 accent-amber-500"
              />
              Опубликован
            </label>
            <button type="button" onClick={onClose} className={btnSecondary}>
              <X size={16} /> Закрыть
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={saving || !form.make || !form.model}
              className={btnPrimary}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* ─ Section: Identity ─ */}
          <Section title="Идентификация" icon={Car}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Марка *">
                <input className={fieldCls} value={form.make} onChange={setField('make')} placeholder="BMW" />
              </Field>
              <Field label="Модель *">
                <input className={fieldCls} value={form.model} onChange={setField('model')} placeholder="X5 xDrive40d" />
              </Field>
              <Field label="Поколение">
                <input className={fieldCls} value={form.generation || ''} onChange={setField('generation')} placeholder="G05" />
              </Field>
              <Field label="Год">
                <input type="number" min={1950} max={2100} className={fieldCls} value={form.year ?? ''} onChange={setField('year')} />
              </Field>
              <Field label="Заголовок RU" col={2}>
                <input className={fieldCls} value={form.title_ru || ''} onChange={setField('title_ru')} placeholder="Если пусто — соберётся автоматически из Марка + Модель + Год" />
              </Field>
              <Field label="Заголовок EN" col={2}>
                <input className={fieldCls} value={form.title_en || ''} onChange={setField('title_en')} placeholder="Optional EN title" />
              </Field>
            </div>
          </Section>

          {/* ─ Section: Body & Color ─ */}
          <Section title="Кузов и цвет">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Тип кузова">
                <Select value={form.body_type} onChange={setField('body_type')} options={BODY_TYPES} />
              </Field>
              <Field label="Цвет (название)">
                <input className={fieldCls} value={form.color_name || ''} onChange={setField('color_name')} placeholder="Carbon Black" />
              </Field>
              <Field label="Цвет (HEX)">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color_hex || '#111827'}
                    onChange={setField('color_hex')}
                    className="w-10 h-10 rounded-lg border border-slate-200 bg-white cursor-pointer"
                  />
                  <input className={fieldCls} value={form.color_hex || ''} onChange={setField('color_hex')} placeholder="#111827" />
                </div>
              </Field>
              <Field label="Мест / Дверей">
                <div className="flex gap-2">
                  <input type="number" min={1} max={12} className={fieldCls} value={form.seats ?? ''} onChange={setField('seats')} placeholder="5" />
                  <input type="number" min={2} max={6} className={fieldCls} value={form.doors ?? ''} onChange={setField('doors')} placeholder="5" />
                </div>
              </Field>
            </div>
          </Section>

          {/* ─ Section: Engine & drive ─ */}
          <Section title="Двигатель и трансмиссия">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Тип двигателя">
                <Select value={form.engine_type} onChange={setField('engine_type')} options={ENGINE_TYPES} />
              </Field>
              <Field label="Объём, л">
                <input type="number" min={0} max={12} step={0.1} className={fieldCls} value={form.engine_volume_l ?? ''} onChange={setField('engine_volume_l')} placeholder="3.0" />
              </Field>
              <Field label="Мощность, л.с.">
                <input type="number" min={0} max={2500} className={fieldCls} value={form.power_hp ?? ''} onChange={setField('power_hp')} placeholder="340" />
              </Field>
              <Field label="Мощность, kW (опц.)">
                <input type="number" min={0} max={2000} className={fieldCls} value={form.power_kw ?? ''} onChange={setField('power_kw')} placeholder="250" />
              </Field>
              <Field label="Коробка">
                <Select value={form.transmission} onChange={setField('transmission')} options={TRANSMISSIONS} />
              </Field>
              <Field label="Привод">
                <Select value={form.drive} onChange={setField('drive')} options={DRIVES} />
              </Field>
            </div>
          </Section>

          {/* ─ Section: Mileage & Condition ─ */}
          <Section title="Пробег и состояние">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="Пробег, км">
                <input type="number" min={0} max={2000000} className={fieldCls} value={form.mileage_km ?? ''} onChange={setField('mileage_km')} placeholder="78 000" />
              </Field>
              <Field label="Состояние">
                <Select value={form.condition} onChange={setField('condition')} options={CONDITIONS} />
              </Field>
              <Field label="Повреждения">
                <Select value={form.damage} onChange={setField('damage')} options={DAMAGES} />
              </Field>
              <Field label="ДТП в истории">
                <label className="flex items-center h-10 gap-2 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
                  <input type="checkbox" checked={!!form.accident_history} onChange={setField('accident_history')} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-slate-700">{form.accident_history ? 'Да' : 'Нет'}</span>
                </label>
              </Field>
              <Field label="Сервисная история" col={4}>
                <textarea className={taCls} value={form.service_history || ''} onChange={setField('service_history')} placeholder="ТО у официального дилера, последняя замена ремня в 2024 году, и т.д." />
              </Field>
            </div>
          </Section>

          {/* ─ Section: Price ─ */}
          <Section title="Цена под ключ">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Цена, EUR *">
                <input type="number" min={0} className={fieldCls} value={form.price_eur ?? ''} onChange={setField('price_eur')} placeholder="54 900" />
              </Field>
              <Field label="Валюта">
                <input className={fieldCls} value={form.currency || 'EUR'} onChange={setField('currency')} disabled />
              </Field>
              <Field label="Цена примерная">
                <label className="flex items-center h-10 gap-2 px-3 rounded-lg border border-slate-200 bg-amber-50/40 cursor-not-allowed">
                  <input type="checkbox" checked disabled className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-slate-700">Всегда отображается с пометкой «примерная»</span>
                </label>
              </Field>
            </div>
          </Section>

          {/* ─ Section: Options / Features ─ */}
          <Section title="Оснащение и опции">
            <Field label="Список опций (через запятую)">
              <textarea
                className={taCls}
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="Panorama roof, Adaptive cruise, Heated steering, Harman Kardon, HUD"
              />
              <p className="text-[12px] text-slate-500 mt-1">
                Введите через запятую. Будет показано на карточке в виде тегов.
              </p>
            </Field>
          </Section>

          {/* ─ Section: Admin recommendation ─ */}
          <Section title="Рекомендация эксперта" icon={Sparkles}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Бейдж">
                <Select value={form.admin_badge} onChange={setField('admin_badge')} options={ADMIN_BADGES} />
              </Field>
              <Field label="Рекомендуем к покупке">
                <label className="flex items-center h-10 gap-2 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer">
                  <input type="checkbox" checked={!!form.recommended} onChange={setField('recommended')} className="w-4 h-4 accent-amber-500" />
                  <span className="text-sm text-slate-700">{form.recommended ? 'Да, рекомендуем' : 'Без рекомендации'}</span>
                </label>
              </Field>
              <Field label="Видео-обзор (URL, опц.)">
                <input className={fieldCls} value={form.video_url || ''} onChange={setField('video_url')} placeholder="https://youtube.com/…" />
              </Field>
              <Field label="Заметка для покупателей, RU" col={3}>
                <textarea
                  className={taCls}
                  value={form.admin_note_ru || ''}
                  onChange={setField('admin_note_ru')}
                  placeholder="Например: Один из самых ухоженных экземпляров на рынке. Полная история обслуживания, пакет M Sport, низкий пробег для своего года."
                />
              </Field>
              <Field label="Note for buyers, EN" col={3}>
                <textarea
                  className={taCls}
                  value={form.admin_note_en || ''}
                  onChange={setField('admin_note_en')}
                  placeholder="One of the cleanest examples on the market…"
                />
              </Field>
            </div>
          </Section>

          {/* ─ Section: Photos ─ */}
          <Section title="Фотографии" icon={ImageIcon}>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => uploadImages(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || (form.gallery?.length || 0) >= 20}
                className="w-full h-28 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-50 transition flex flex-col items-center justify-center gap-1 text-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><Loader2 size={20} className="animate-spin" /><span className="text-sm">Загружаем…</span></>
                ) : (
                  <>
                    <Upload size={22} />
                    <span className="text-sm font-medium">
                      Перетащите или нажмите, чтобы загрузить ({form.gallery?.length || 0}/20)
                    </span>
                    <span className="text-[11px] text-amber-600/80">JPG / PNG / WebP, до 8 МБ каждое</span>
                  </>
                )}
              </button>

              <PhotoGrid
                gallery={form.gallery || []}
                onReorder={reorderImages}
                onDelete={removeImage}
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ── Small form helpers ──────────────────────────────────────────── */
function Section({ title, icon: Icon, children }) {
  return (
    <AdminCard padding="md">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        {Icon ? <Icon size={16} className="text-amber-500" /> : <span className="w-1.5 h-4 rounded-sm bg-amber-500" />}
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </AdminCard>
  );
}

function Field({ label, children, col }) {
  const span = col ? `md:col-span-${col}` : '';
  return (
    <div className={span}>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value || ''}
      onChange={onChange}
      className={fieldCls + ' appearance-none bg-white pr-8'}
      style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path fill='%23667085' d='M5.5 7.5l4.5 4.5 4.5-4.5'/></svg>\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/* ──────────────────────────────────────────────────────────────────
 * Main page
 * ────────────────────────────────────────────────────────────────── */
export default function CarsAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ budget: 'all', status: 'all' });
  const [editing, setEditing] = useState({ open: false, car: null });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [reorderDirty, setReorderDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(`${API_URL}/api/admin/cars`);
      setItems(Array.isArray(r.data?.items) ? r.data.items : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Не удалось загрузить список');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      if (filter.budget !== 'all' && c.budget_bucket !== filter.budget) return false;
      if (filter.status === 'published' && !c.published) return false;
      if (filter.status === 'draft' && c.published) return false;
      return true;
    });
  }, [items, filter]);

  const onSavedFromEditor = (car) => {
    setItems((prev) => {
      const idx = prev.findIndex((c) => c.id === car.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...car };
        return copy;
      }
      return [...prev, car];
    });
  };

  const startCreate = () => setEditing({ open: true, car: null });
  const startEdit = (car) => setEditing({ open: true, car });

  const doDelete = async (car) => {
    try {
      await axios.delete(`${API_URL}/api/admin/cars/${car.id}`);
      setItems((prev) => prev.filter((c) => c.id !== car.id));
    } catch (e) {
      setError(e?.response?.data?.detail || 'Не удалось удалить карточку');
    } finally {
      setConfirmDelete(null);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const next = [...filtered];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    // Rebuild full items list with the new order applied to the filtered slice
    const filteredIds = new Set(next.map((c) => c.id));
    const otherItems = items.filter((c) => !filteredIds.has(c.id));
    setItems([...next, ...otherItems]);
    setReorderDirty(true);
  };

  const saveOrder = async () => {
    try {
      const order = items.map((c) => c.id);
      await axios.post(`${API_URL}/api/admin/cars/reorder`, { order });
      setReorderDirty(false);
      await load();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Не удалось сохранить порядок');
    }
  };

  const togglePublished = async (car) => {
    try {
      const r = await axios.patch(`${API_URL}/api/admin/cars/${car.id}`, { published: !car.published });
      onSavedFromEditor(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Не удалось изменить статус');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: "'Mazzard H', 'Mazzard', system-ui, sans-serif" }}>
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <AdminPageHeader
          icon={Car}
          title="Каталог авто"
          subtitle="Подборка автомобилей, отображаемая на главной странице сайта."
          actions={(
            <button onClick={startCreate} className={btnPrimary} data-testid="cars-create-btn">
              <Plus size={16} /> Создать карточку
            </button>
          )}
        />

        {/* Filters */}
        <AdminCard padding="sm" className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Бюджет:</span>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_BUCKETS.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setFilter((f) => ({ ...f, budget: b.value }))}
                  className={
                    'px-3 h-8 rounded-md text-xs font-medium transition ' +
                    (filter.budget === b.value
                      ? 'bg-amber-500 text-slate-900'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')
                  }
                >{b.label}</button>
              ))}
            </div>

            <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block" />

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-2">Статус:</span>
            {[
              { v: 'all',       l: 'Все' },
              { v: 'published', l: 'Опубликованы' },
              { v: 'draft',     l: 'Черновики' },
            ].map((s) => (
              <button
                key={s.v}
                onClick={() => setFilter((f) => ({ ...f, status: s.v }))}
                className={
                  'px-3 h-8 rounded-md text-xs font-medium transition ' +
                  (filter.status === s.v
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50')
                }
              >{s.l}</button>
            ))}

            <div className="ml-auto text-xs text-slate-500">
              Показано <strong>{filtered.length}</strong> из {items.length}
            </div>
          </div>
        </AdminCard>

        {/* Reorder dirty bar */}
        {reorderDirty && (
          <div className="mt-3 flex items-center justify-between px-4 py-3 rounded-lg bg-amber-100 border border-amber-300 text-sm text-amber-900">
            <span>Порядок изменён — сохранить?</span>
            <div className="flex gap-2">
              <button onClick={() => { setReorderDirty(false); load(); }} className={btnSecondary}>Отмена</button>
              <button onClick={saveOrder} className={btnPrimary}><Save size={14} /> Сохранить порядок</button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="mt-4">
          {loading && (
            <AdminCard padding="lg">
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" /> Загружаем карточки…
              </div>
            </AdminCard>
          )}

          {error && (
            <AdminCard padding="md">
              <div className="text-rose-700 text-sm">{error}</div>
            </AdminCard>
          )}

          {!loading && !error && filtered.length === 0 && (
            <AdminCard padding="lg">
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 grid place-items-center mb-4">
                  <Car size={28} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Пока нет ни одной карточки</h3>
                <p className="text-sm text-slate-500 mb-5">Создайте первую карточку — она появится на главной странице.</p>
                <button onClick={startCreate} className={btnPrimary}><Plus size={16} /> Создать первую карточку</button>
              </div>
            </AdminCard>
          )}

          {!loading && !error && filtered.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="cars-list">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 gap-3"
                  >
                    {filtered.map((car, idx) => (
                      <Draggable draggableId={car.id} index={idx} key={car.id}>
                        {(p, snapshot) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            className={
                              'group flex items-center gap-4 p-3 rounded-xl bg-white border border-slate-200 ' +
                              (snapshot.isDragging ? 'shadow-xl border-amber-300' : 'hover:border-slate-300')
                            }
                            data-testid={`cars-row-${car.id}`}
                          >
                            <span
                              {...p.dragHandleProps}
                              className="w-7 h-12 grid place-items-center text-slate-300 hover:text-slate-500 cursor-grab"
                              title="Перетащите, чтобы изменить порядок"
                            >
                              <GripVertical size={18} />
                            </span>

                            <img
                              src={imgUrl(car.main_image_url || (car.gallery || [])[0])}
                              alt={car.title_ru || `${car.make} ${car.model}`}
                              className="w-24 h-16 object-cover rounded-lg bg-slate-100 flex-shrink-0"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-[15px] font-semibold text-slate-900 truncate">
                                  {car.make} {car.model} {car.year ? `· ${car.year}` : ''}
                                </h4>
                                {car.admin_badge && car.admin_badge !== 'neutral' && (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-800">
                                    {badgeInfo(car.admin_badge).label}
                                  </span>
                                )}
                                {!car.published && (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 inline-flex items-center gap-1">
                                    <EyeOff size={11} /> Черновик
                                  </span>
                                )}
                                {car.published && (
                                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                    <CheckCircle2 size={11} /> Опубликован
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                                <span>{formatEUR(car.price_eur)}</span>
                                <span className="text-slate-300">·</span>
                                <span>{formatKm(car.mileage_km)}</span>
                                <span className="text-slate-300">·</span>
                                <span>{budgetLabel(car.budget_bucket)}</span>
                                {car.body_type && (
                                  <>
                                    <span className="text-slate-300">·</span>
                                    <span>{BODY_TYPES.find((b) => b.value === car.body_type)?.label || car.body_type}</span>
                                  </>
                                )}
                                <span className="text-slate-300">·</span>
                                <span>{(car.gallery || []).length} фото</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => togglePublished(car)}
                                className={btnSecondary}
                                title={car.published ? 'Снять с публикации' : 'Опубликовать'}
                              >
                                {car.published ? <EyeOff size={14} /> : <Star size={14} />}
                                <span className="hidden md:inline">{car.published ? 'Скрыть' : 'Публиковать'}</span>
                              </button>
                              <button onClick={() => startEdit(car)} className={btnSecondary}>
                                <Pencil size={14} /> Редактировать
                              </button>
                              <button onClick={() => setConfirmDelete(car)} className={btnDanger} title="Удалить">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      <CarEditor
        open={editing.open}
        initial={editing.car}
        onClose={() => setEditing({ open: false, car: null })}
        onSaved={onSavedFromEditor}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-[1300] bg-slate-900/55 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Удалить карточку?</h3>
            <p className="text-sm text-slate-600 mb-5">
              <strong>{confirmDelete.make} {confirmDelete.model}</strong> и все её фотографии будут удалены безвозвратно.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className={btnSecondary}>Отмена</button>
              <button onClick={() => doDelete(confirmDelete)} className={btnDanger}>
                <Trash2 size={14} /> Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
