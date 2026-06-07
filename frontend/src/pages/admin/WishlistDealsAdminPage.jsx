/**
 * WishlistDealsAdminPage — «Подборка недели» (RU-only).
 *
 * Управление публичным блоком «Лучшие предложения автомобилей недели»
 * на главной странице сайта. Админ добавляет автомобили по VIN, видит
 * текущую подборку и может её редактировать или удалять. Все карточки
 * проходят авто-одобрение (admin = team_lead в ADMIN_ROLES), поэтому
 * сразу появляются на публичной главной.
 *
 * API:
 *   GET    /api/admin/wishlist-deals?week=current
 *   GET    /api/admin/wishlist-deals/vin-search?q=…
 *   POST   /api/admin/wishlist-deals       body {vin, budget, week?, note?}
 *   PATCH  /api/admin/wishlist-deals/{id}  body {budget?, note?, status?}
 *   DELETE /api/admin/wishlist-deals/{id}
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  MagnifyingGlass,
  Plus,
  Trash,
  PencilSimple,
  CheckCircle,
  XCircle,
  Calendar,
  CurrencyEur,
  Car,
  ArrowsClockwise,
  Note,
  Sparkle,
  DotsSixVertical,
  Crown,
  ArrowUp,
  ArrowDown,
} from '@phosphor-icons/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const API = process.env.REACT_APP_BACKEND_URL || '';

const BUDGETS = [
  { value: '10-15K', label: '10–15 тыс. €' },
  { value: '15-25K', label: '15–25 тыс. €' },
  { value: '30-50K', label: '30–50 тыс. €' },
];

const STATUS_LABELS = {
  approved: { label: 'Опубликовано', color: 'emerald' },
  pending:  { label: 'На модерации', color: 'amber' },
  rejected: { label: 'Отклонено',    color: 'rose' },
};

const authHeader = () => {
  try {
    const tok = localStorage.getItem('token') || sessionStorage.getItem('token');
    return tok ? { Authorization: `Bearer ${tok}` } : {};
  } catch {
    return {};
  }
};

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${Math.round(n).toLocaleString('ru-RU')} €`;
}

function formatOdometer(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '—';
  const u = (unit || 'mi').toLowerCase().startsWith('km') ? 'км' : 'мили';
  return `${Math.round(n).toLocaleString('ru-RU')} ${u}`;
}

function formatDateRu(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

function weekRangeLabel(weekStart) {
  if (!weekStart) return '—';
  try {
    const start = new Date(`${weekStart}T00:00:00Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    return `${fmt(start)} – ${fmt(end)} ${end.getUTCFullYear()}`;
  } catch {
    return weekStart;
  }
}

/* ───────────────────────────────────────────────────────── VinSearch */
function VinSearchPicker({ onPick }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const needle = (query || '').trim();
    if (needle.length < 2) {
      setResults([]); setLoading(false); return () => ctrl.abort();
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${API}/api/admin/wishlist-deals/vin-search`, {
          params: { q: needle, limit: 12 },
          headers: authHeader(),
          signal: ctrl.signal,
          timeout: 12000,
        });
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (e) {
        if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  const pick = (r) => {
    onPick && onPick(r);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => results.length && setOpen(true)}
          placeholder="VIN, лот или название модели"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-[15px] text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition"
        />
      </div>
      {open && (loading || results.length > 0) && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-zinc-200 rounded-xl shadow-xl max-h-80 overflow-auto">
          {loading && (
            <div className="px-4 py-3 text-sm text-zinc-500 flex items-center gap-2">
              <ArrowsClockwise size={14} className="animate-spin" /> Поиск…
            </div>
          )}
          {!loading && results.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Ничего не найдено</div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.vin}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 border-b last:border-b-0 border-zinc-100 flex items-center gap-3"
            >
              <div className="w-14 h-10 rounded-md bg-zinc-100 overflow-hidden flex-shrink-0">
                {r.image ? (
                  <img src={r.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Car size={18} className="m-3 text-zinc-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-900 truncate">
                  {r.title || `${r.year || ''} ${r.make || ''} ${r.model || ''}`.trim() || r.vin}
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-2">
                  <span className="font-mono">{r.vin}</span>
                  {r.lot_number && <span>· лот {r.lot_number}</span>}
                  {r.auction_name && <span>· {r.auction_name}</span>}
                </div>
              </div>
              <div className="text-sm font-semibold text-amber-600 flex-shrink-0">
                {formatPrice(r.current_bid)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── AddForm */
function AddCarForm({ onAdded, currentWeek }) {
  const [picked, setPicked] = useState(null);
  const [budget, setBudget] = useState('10-15K');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [manualVin, setManualVin] = useState('');

  const submit = async () => {
    const vin = (picked?.vin || manualVin || '').trim().toUpperCase();
    if (!vin) {
      toast.error('Укажите VIN автомобиля');
      return;
    }
    if (!budget) {
      toast.error('Выберите бюджет');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${API}/api/admin/wishlist-deals`, {
        vin, budget, week: currentWeek || 'current', note: note || undefined,
      }, { headers: { ...authHeader(), 'Content-Type': 'application/json' } });
      toast.success('Автомобиль добавлен в подборку недели');
      setPicked(null); setManualVin(''); setNote('');
      onAdded && onAdded();
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Не удалось добавить';
      if (e?.response?.status === 409) {
        toast.error('Этот VIN уже есть в подборке на эту неделю');
      } else {
        toast.error(detail);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkle size={20} weight="fill" className="text-amber-500" />
          <h2 className="text-lg font-bold text-zinc-900">Добавить автомобиль в подборку</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Поиск автомобиля по VIN или модели
          </label>
          <VinSearchPicker onPick={(r) => { setPicked(r); setManualVin(''); }} />
          <div className="mt-2 text-xs text-zinc-500">
            Введите VIN, номер лота или название (например, «Toyota Camry 2020»). Выберите авто из подсказок.
          </div>
        </div>

        {picked && (
          <div className="flex items-start gap-4 p-3 rounded-xl border border-amber-200 bg-amber-50">
            <div className="w-20 h-16 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0">
              {picked.image
                ? <img src={picked.image} alt="" className="w-full h-full object-cover" />
                : <Car size={28} className="m-4 text-zinc-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {picked.title || `${picked.year || ''} ${picked.make || ''} ${picked.model || ''}`.trim()}
              </div>
              <div className="text-xs text-zinc-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono">{picked.vin}</span>
                {picked.lot_number && <span>лот {picked.lot_number}</span>}
                {picked.auction_name && <span>{picked.auction_name}</span>}
                <span className="font-semibold text-amber-700">{formatPrice(picked.current_bid)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="text-zinc-400 hover:text-zinc-700 transition p-1"
              aria-label="Очистить выбор"
            >
              <XCircle size={20} />
            </button>
          </div>
        )}

        {!picked && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              …или вставьте VIN вручную
            </label>
            <input
              type="text"
              value={manualVin}
              onChange={(e) => setManualVin(e.target.value.toUpperCase())}
              placeholder="Например, 1HGBH41JXMN109186"
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-[15px] font-mono text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition"
            />
            <div className="mt-1 text-xs text-zinc-500">
              Если VIN ещё нет в нашей базе — карточка будет создана с минимальным набором данных.
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Ценовой сегмент <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b.value}
                type="button"
                onClick={() => setBudget(b.value)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition
                  ${budget === b.value
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-300 hover:bg-amber-50'}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Заметка (необязательно)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Например, «выгодный пробег», «горячее предложение»"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-[15px] text-zinc-900 placeholder-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving || (!picked && !manualVin)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition"
          >
            {saving ? <ArrowsClockwise size={16} className="animate-spin" /> : <Plus size={16} weight="bold" />}
            Добавить в подборку
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── EditModal */
function EditModal({ item, onClose, onSaved }) {
  const [budget, setBudget] = useState(item.budget);
  const [note, setNote] = useState(item.note || '');
  const [status, setStatus] = useState(item.status || 'approved');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/api/admin/wishlist-deals/${item.id}`, {
        budget, note, status,
      }, { headers: { ...authHeader(), 'Content-Type': 'application/json' } });
      toast.success('Карточка обновлена');
      onSaved && onSaved();
      onClose && onClose();
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Не удалось сохранить';
      toast.error(detail);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4 text-zinc-900">Редактировать карточку</h3>

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="text-sm font-semibold text-zinc-900 truncate">
              {item.snapshot?.title || `${item.snapshot?.year || ''} ${item.snapshot?.make || ''} ${item.snapshot?.model || ''}`.trim()}
            </div>
            <div className="text-xs text-zinc-500 mt-0.5 font-mono">{item.vin}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Ценовой сегмент</label>
            <div className="grid grid-cols-3 gap-2">
              {BUDGETS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setBudget(b.value)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition
                    ${budget === b.value
                      ? 'border-amber-500 bg-amber-500 text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-amber-300'}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Статус</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setStatus(k)}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition
                    ${status === k
                      ? `border-${v.color}-500 bg-${v.color}-500 text-white`
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Заметка</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-[15px] text-zinc-900 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-none transition resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-sm font-semibold transition"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white text-sm font-semibold transition"
            >
              {saving ? <ArrowsClockwise size={16} className="animate-spin" /> : <CheckCircle size={16} weight="bold" />}
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── DealCard */
const PUBLIC_TOP_N = 9;

function DealCard({ item, onDelete, onEdit, dragHandleProps, isDragging, position, isTop }) {
  const s = item.snapshot || {};
  const title = s.title || `${s.year || ''} ${s.make || ''} ${s.model || ''}`.trim() || item.vin;
  const status = STATUS_LABELS[item.status] || STATUS_LABELS.pending;
  const budgetLabel = BUDGETS.find((b) => b.value === item.budget)?.label || item.budget;
  const priceLabel = formatPrice(s.current_bid);

  return (
    <div className={`group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all
      ${isDragging ? 'shadow-2xl ring-2 ring-amber-400 scale-[1.02]' : ''}
      ${isTop ? 'border-amber-300' : 'border-zinc-200 hover:border-amber-300'}
    `}>
      <div className="relative aspect-[16/10] bg-zinc-100">
        {s.image ? (
          <img src={s.image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <Car size={48} />
          </div>
        )}

        {/* Position badge */}
        {position && (
          <div className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold
            ${isTop
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-zinc-900/85 text-white'}`}>
            {isTop && <Crown size={12} weight="fill" />}#{position}
          </div>
        )}

        {/* Status + budget pills top-right */}
        <div className="absolute top-3 right-3 flex gap-1.5 flex-wrap justify-end">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold bg-${status.color}-100 text-${status.color}-800 border border-${status.color}-200`}>
            {status.label}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-zinc-800 border border-zinc-200">
            {budgetLabel}
          </span>
        </div>

        {/* Drag handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute bottom-3 left-3 w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-700 hover:text-amber-600 transition"
            title="Перетащите, чтобы изменить порядок"
            aria-label="Drag to reorder"
          >
            <DotsSixVertical size={18} weight="bold" />
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="text-[15px] font-bold text-zinc-900 line-clamp-1">{title}</div>
        <div className="mt-1 text-xs text-zinc-500 font-mono">{item.vin}</div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-zinc-50 rounded-lg px-2.5 py-1.5">
            <div className="text-zinc-500">Цена</div>
            <div className="font-semibold text-zinc-900">{priceLabel}</div>
          </div>
          <div className="bg-zinc-50 rounded-lg px-2.5 py-1.5">
            <div className="text-zinc-500">Пробег</div>
            <div className="font-semibold text-zinc-900">{formatOdometer(s.odometer, s.odometer_unit)}</div>
          </div>
        </div>

        {item.note && (
          <div className="mt-3 flex items-start gap-1.5 text-xs text-zinc-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
            <Note size={14} className="mt-0.5 text-amber-600 flex-shrink-0" />
            <span className="line-clamp-2">{item.note}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
          <span>Добавил: {item.created_by_name || '—'}</span>
          <span>{formatDateRu(item.created_at)}</span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition"
          >
            <PencilSimple size={14} weight="bold" /> Изменить
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold transition"
            aria-label="Удалить"
          >
            <Trash size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── Main page */
export default function WishlistDealsAdminPage() {
  const [week, setWeek] = useState('current'); // current | next | prev
  const [data, setData] = useState({ data: [], week_start: null, counts: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all | approved | pending | rejected
  const [filterBudget, setFilterBudget] = useState('all'); // all | 10-15K | 15-25K | 30-50K
  const [editing, setEditing] = useState(null);
  // Local override of order while user is dragging. Empty array means "use server order".
  const [orderOverride, setOrderOverride] = useState([]); // list of ids
  const [savingOrder, setSavingOrder] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = { week };
      const { data: resp } = await axios.get(`${API}/api/admin/wishlist-deals`, {
        params, headers: authHeader(), timeout: 15000,
      });
      setData({
        data: Array.isArray(resp?.data) ? resp.data : [],
        week_start: resp?.week_start || null,
        counts: resp?.counts || {},
        total: resp?.total || 0,
      });
      // Drop any local reorder buffer when fresh data lands.
      setOrderOverride([]);
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || 'Не удалось загрузить подборку';
      toast.error(detail);
      setData({ data: [], week_start: null, counts: {}, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [week]);

  useEffect(() => { reload(); }, [reload]);

  const handleDelete = async (item) => {
    if (!window.confirm(`Удалить «${item.snapshot?.title || item.vin}» из подборки?`)) return;
    try {
      await axios.delete(`${API}/api/admin/wishlist-deals/${item.id}`, { headers: authHeader() });
      toast.success('Удалено из подборки');
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Не удалось удалить');
    }
  };

  const filtered = useMemo(() => {
    let list = (data.data || []).filter((it) => {
      if (filterStatus !== 'all' && it.status !== filterStatus) return false;
      if (filterBudget !== 'all' && it.budget !== filterBudget) return false;
      return true;
    });
    // If user has reordered locally (and no filters narrowed it), use that order.
    if (orderOverride.length === list.length && orderOverride.length > 0) {
      const m = new Map(list.map((x) => [x.id, x]));
      list = orderOverride.map((id) => m.get(id)).filter(Boolean);
    }
    return list;
  }, [data.data, filterStatus, filterBudget, orderOverride]);

  // Reorder is only meaningful when the list is the full week's curation
  // (no narrowing filter), because the public site uses position 1..N from the
  // unfiltered list. Otherwise we lock the drag handles to avoid surprises.
  const canReorder = filterStatus === 'all' && filterBudget === 'all';
  const reorderDirty = orderOverride.length > 0;

  const onDragEnd = useCallback((result) => {
    if (!result?.destination) return;
    const srcIdx = result.source.index;
    const dstIdx = result.destination.index;
    if (srcIdx === dstIdx) return;
    const current = filtered.map((it) => it.id);
    const [moved] = current.splice(srcIdx, 1);
    current.splice(dstIdx, 0, moved);
    setOrderOverride(current);
  }, [filtered]);

  const saveReorder = useCallback(async () => {
    if (orderOverride.length === 0) return;
    setSavingOrder(true);
    try {
      await axios.post(`${API}/api/admin/wishlist-deals/reorder`,
        { order: orderOverride },
        { headers: { ...authHeader(), 'Content-Type': 'application/json' } }
      );
      toast.success('Порядок сохранён. Первые 9 теперь отображаются на главной.');
      setOrderOverride([]);
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Не удалось сохранить порядок');
    } finally {
      setSavingOrder(false);
    }
  }, [orderOverride, reload]);

  const totalApproved = useMemo(
    () => (data.data || []).filter((x) => x.status === 'approved').length,
    [data.data]
  );
  const totalPending = useMemo(
    () => (data.data || []).filter((x) => x.status === 'pending').length,
    [data.data]
  );

  return (
    <div className="p-4 md:p-8 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 mb-1">Подборка недели</h1>
        <p className="text-sm text-zinc-500">
          Карточки, которые отображаются в блоке «Лучшие предложения автомобилей недели» на главной странице сайта.
          Добавляйте автомобили по VIN — они сразу появятся на сайте.
        </p>
      </div>

      {/* Week selector + stats */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
          {[
            { v: 'prev',    label: 'Прошлая' },
            { v: 'current', label: 'Текущая' },
            { v: 'next',    label: 'Следующая' },
          ].map((b) => (
            <button
              key={b.v}
              type="button"
              onClick={() => setWeek(b.v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition
                ${week === b.v
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-700 hover:bg-zinc-50'}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700">
          <Calendar size={16} className="text-zinc-400" />
          <span className="font-semibold">{weekRangeLabel(data.week_start)}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-sm font-semibold transition"
          >
            <ArrowsClockwise size={14} className={loading ? 'animate-spin' : ''} />
            Обновить
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Всего в подборке</div>
          <div className="mt-1 text-2xl font-extrabold text-zinc-900">{data.total || 0}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">Опубликовано</div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-900">{totalApproved}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">На модерации</div>
          <div className="mt-1 text-2xl font-extrabold text-amber-900">{totalPending}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">По сегментам</div>
          <div className="mt-1 flex items-baseline gap-2 text-sm font-semibold text-zinc-900">
            <span>10–15K: <span className="text-amber-600">{data.counts?.['10-15K'] || 0}</span></span>
            <span>·</span>
            <span>15–25K: <span className="text-amber-600">{data.counts?.['15-25K'] || 0}</span></span>
            <span>·</span>
            <span>30–50K: <span className="text-amber-600">{data.counts?.['30-50K'] || 0}</span></span>
          </div>
        </div>
      </div>

      {/* Add form */}
      <div className="mb-8">
        <AddCarForm onAdded={reload} currentWeek={week} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-zinc-700 mr-2">Фильтр:</span>

        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
          {[
            { v: 'all',      label: 'Все' },
            { v: 'approved', label: 'Опубликованы' },
            { v: 'pending',  label: 'На модерации' },
            { v: 'rejected', label: 'Отклонены' },
          ].map((b) => (
            <button
              key={b.v}
              type="button"
              onClick={() => setFilterStatus(b.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${filterStatus === b.v
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
          {[
            { v: 'all',     label: 'Все бюджеты' },
            { v: '10-15K',  label: '10–15K' },
            { v: '15-25K',  label: '15–25K' },
            { v: '30-50K',  label: '30–50K' },
          ].map((b) => (
            <button
              key={b.v}
              type="button"
              onClick={() => setFilterBudget(b.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition
                ${filterBudget === b.v
                  ? 'bg-amber-500 text-white'
                  : 'text-zinc-700 hover:bg-zinc-50'}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="ml-auto text-sm text-zinc-500">
          Показано: <span className="font-semibold text-zinc-900">{filtered.length}</span> из {data.total || 0}
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
              <div className="aspect-[16/10] bg-zinc-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-zinc-100 rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-12 text-center">
          <Car size={48} className="mx-auto text-zinc-300 mb-3" />
          <div className="text-base font-semibold text-zinc-900 mb-1">В подборке пока пусто</div>
          <div className="text-sm text-zinc-500 max-w-md mx-auto">
            Используйте форму выше, чтобы добавить первый автомобиль в подборку недели по VIN-коду.
          </div>
        </div>
      ) : (
        <>
          {/* Reorder hint banner — only when filters are NOT applied, so positions are meaningful */}
          {canReorder && (
            <div className="mb-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200 px-4 py-3 flex items-start gap-3">
              <Crown size={18} weight="fill" className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900 flex-1">
                <span className="font-semibold">ТОП-{PUBLIC_TOP_N} на главной:</span>{' '}
                Перетащите карточки за <DotsSixVertical size={14} weight="bold" className="inline -mt-0.5" /> чтобы изменить порядок. Первые {PUBLIC_TOP_N} карточек отображаются на главной странице сайта по умолчанию.
              </div>
              {reorderDirty && (
                <button
                  type="button"
                  onClick={saveReorder}
                  disabled={savingOrder}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white text-sm font-semibold shadow-sm transition"
                >
                  {savingOrder ? <ArrowsClockwise size={14} className="animate-spin" /> : <CheckCircle size={14} weight="bold" />}
                  Сохранить порядок
                </button>
              )}
            </div>
          )}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="wishlist" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {filtered.map((item, idx) => {
                    const position = idx + 1;
                    const isTop = canReorder && position <= PUBLIC_TOP_N;
                    return (
                      <Draggable
                        key={item.id}
                        draggableId={item.id}
                        index={idx}
                        isDragDisabled={!canReorder}
                      >
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            style={{ ...prov.draggableProps.style }}
                          >
                            <DealCard
                              item={item}
                              onDelete={handleDelete}
                              onEdit={(it) => setEditing(it)}
                              dragHandleProps={canReorder ? prov.dragHandleProps : null}
                              isDragging={snap.isDragging}
                              position={canReorder ? position : null}
                              isTop={isTop}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}

      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
