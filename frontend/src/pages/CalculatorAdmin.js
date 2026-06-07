/**
 * CalculatorAdmin — DM Auto customs tariff editor.
 *
 * Replaces the legacy USA/Korea/Europe calculator admin. This page lets
 * managers edit the customs tariff configuration that drives the public
 * /calculator under-key estimate, for both Russia and Belarus.
 *
 * What can be edited:
 *   • Service fees (broker / СВХ / СБКТС / ЭПТС / registration / DM fee)
 *   • Logistics (north & south route rates)
 *   • Recycling fee (утильсбор)
 *   • Duty ladders (read-only summary + JSON editor for advanced users)
 *
 * API: see backend/app/routers/customs_calculator.py
 */

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

const FIELD = {
  customs_clearance_fee:  { label: 'Таможенный сбор (€)' },
  broker_fee:             { label: 'Таможенный брокер (€)' },
  warehouse_fee:          { label: 'СВХ — склад временного хранения (€)' },
  guarantee_fee:          { label: 'Обеспечение на таможне (€)' },
  sbkts_fee:              { label: 'СБКТС (€)' },
  epts_fee:               { label: 'ЭПТС (€)' },
  registration_fee:       { label: 'Постановка на учёт (€)' },
  service_fee_dm:         { label: 'Сервисный сбор DM Auto (€)' },
};

const LOGISTICS_FIELDS = {
  eu_inland:        { label: 'Доставка по ЕС (€)' },
  cross_border:     { label: 'Доставка через границу (€)' },
  insurance_pct:    { label: 'Страхование, % от стоимости' },
  insurance_min:    { label: 'Минимум страхования (€)' },
  local_delivery:   { label: 'Доставка по стране (€)' },
  label:            { label: 'Описание маршрута', type: 'text' },
};

const RECYCLING_FIELDS = {
  under_3y_under_3000cc: { label: '< 3 лет, < 3000 см³ (€)' },
  under_3y_over_3000cc:  { label: '< 3 лет, > 3000 см³ (€)' },
  over_3y_under_3000cc:  { label: '> 3 лет, < 3000 см³ (€)' },
  over_3y_over_3000cc:   { label: '> 3 лет, > 3000 см³ (€)' },
};

const COUNTRY_LABELS = { ru: '🇷🇺 Россия', by: '🇧🇾 Беларусь' };

/* ─────────────────────────── helpers ─────────────────────────── */
const numInput = (val, onChange, key) => (
  <input
    type="number"
    value={val ?? ''}
    onChange={(e) => onChange(key, e.target.value === '' ? '' : Number(e.target.value))}
    style={{
      width: '100%',
      padding: '8px 10px',
      background: '#f8f9fa',
      border: '1px solid #d0d5dd',
      borderRadius: 6,
      fontSize: 14,
    }}
    data-testid={`tariff-${key}`}
  />
);
const txtInput = (val, onChange, key) => (
  <input
    type="text"
    value={val ?? ''}
    onChange={(e) => onChange(key, e.target.value)}
    style={{
      width: '100%',
      padding: '8px 10px',
      background: '#f8f9fa',
      border: '1px solid #d0d5dd',
      borderRadius: 6,
      fontSize: 14,
    }}
    data-testid={`tariff-${key}`}
  />
);

/* ─────────────────────────── component ─────────────────────────── */
export default function CalculatorAdmin() {
  const [tariffs, setTariffs] = useState({}); // { ru: {...}, by: {...} }
  const [activeCountry, setActiveCountry] = useState('ru');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('services'); // services | logistics | recycling | duties

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/api/customs/admin/tariffs`);
      const map = {};
      (r?.data?.tariffs || []).forEach((t) => { map[t.country] = t; });
      setTariffs(map);
    } catch (e) {
      toast.error('Не удалось загрузить тарифы');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const current = tariffs[activeCountry];

  const updateField = (path, value) => {
    setTariffs((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const t = next[activeCountry];
      if (!t) return prev;
      // path is array
      let cur = t;
      for (let i = 0; i < path.length - 1; i += 1) {
        if (cur[path[i]] === undefined) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
      await axios.put(`${API}/api/customs/admin/tariffs/${activeCountry}`, current);
      toast.success(`Тарифы для ${COUNTRY_LABELS[activeCountry]} сохранены`);
      await load();
    } catch (e) {
      toast.error('Не удалось сохранить тарифы');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Сбросить тарифы к значениям по умолчанию? Все правки будут потеряны.')) return;
    setSaving(true);
    try {
      await axios.post(`${API}/api/customs/admin/tariffs/reset`);
      toast.success('Тарифы сброшены к значениям по умолчанию');
      await load();
    } catch (e) {
      toast.error('Не удалось сбросить тарифы');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 32 }}>Загрузка тарифов…</div>;
  }
  if (!current) {
    return <div style={{ padding: 32 }}>Тарифы не найдены. <button onClick={load}>Обновить</button></div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', color: '#111' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Калькулятор растаможки — Тарифы
      </h1>
      <p style={{ color: '#475467', marginBottom: 24, fontSize: 14 }}>
        Настройка ставок для калькулятора «под ключ» на сайте.
        Изменения применяются мгновенно — публичный калькулятор всегда читает
        актуальную версию из базы.
      </p>

      {/* Country switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.keys(COUNTRY_LABELS).map((c) => (
          <button
            key={c}
            onClick={() => setActiveCountry(c)}
            data-testid={`country-tab-${c}`}
            style={{
              padding: '10px 20px',
              border: '1px solid #d0d5dd',
              background: activeCountry === c ? '#162E51' : '#fff',
              color: activeCountry === c ? '#fff' : '#111',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {COUNTRY_LABELS[c]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={handleReset}
          disabled={saving}
          style={{
            padding: '10px 16px',
            border: '1px solid #d92d20',
            background: '#fff',
            color: '#d92d20',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          Сбросить к значениям по умолчанию
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="save-tariffs"
          style={{
            padding: '10px 22px',
            border: 'none',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {saving ? 'Сохраняем…' : '💾 Сохранить'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e4e7ec', marginBottom: 20 }}>
        {[
          { id: 'services', label: 'Услуги и сборы' },
          { id: 'logistics', label: 'Логистика' },
          { id: 'recycling', label: 'Утильсбор' },
          { id: 'duties', label: 'Пошлины (advanced)' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`tab-${t.id}`}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? '#162E51' : '#475467',
              borderBottom: tab === t.id ? '2px solid #162E51' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Services ── */}
      {tab === 'services' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {Object.entries(FIELD).map(([k, meta]) => (
            <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, color: '#344054', fontWeight: 500 }}>{meta.label}</span>
              {numInput(current?.services?.[k], (key, val) => updateField(['services', key], val), k)}
            </label>
          ))}
        </div>
      )}

      {/* ── Tab: Logistics ── */}
      {tab === 'logistics' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {['north_route', 'south_route'].map((routeKey) => (
            <div key={routeKey} style={{ border: '1px solid #e4e7ec', borderRadius: 12, padding: 20, background: '#fafbfc' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                {routeKey === 'north_route' ? '🚛 Северный маршрут (≤ 1.9 L)' : '🚢 Южный маршрут (> 1.9 L)'}
              </h3>
              <p style={{ fontSize: 12, color: '#667085', marginBottom: 16 }}>
                {routeKey === 'north_route'
                  ? 'Используется для авто с малым объёмом (Германия → Польша → Беларусь).'
                  : 'Используется для авто с большим объёмом (Германия → Турция → Грузия).'}
              </p>
              {Object.entries(LOGISTICS_FIELDS).map(([k, meta]) => (
                <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: '#344054', fontWeight: 500 }}>{meta.label}</span>
                  {meta.type === 'text'
                    ? txtInput(current?.logistics?.[routeKey]?.[k], (key, val) => updateField(['logistics', routeKey, key], val), `${routeKey}-${k}`)
                    : numInput(current?.logistics?.[routeKey]?.[k], (key, val) => updateField(['logistics', routeKey, key], val), `${routeKey}-${k}`)
                  }
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Recycling fee ── */}
      {tab === 'recycling' && (
        <div style={{ maxWidth: 600 }}>
          <p style={{ fontSize: 13, color: '#475467', marginBottom: 16 }}>
            Базовый утилизационный сбор для физических лиц. Указывайте сумму в EUR.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {Object.entries(RECYCLING_FIELDS).map(([k, meta]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#344054', fontWeight: 500 }}>{meta.label}</span>
                {numInput(current?.recycling_fee?.[k], (key, val) => updateField(['recycling_fee', key], val), k)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Duties (read-only summary + advanced JSON) ── */}
      {tab === 'duties' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Авто моложе 3 лет — адвалор + минимум €/см³</h3>
          <BracketTable
            cols={['Цена до, €', 'Ставка %', 'Минимум €/см³']}
            rows={(current?.young_under_3y?.price_brackets || []).map((b) => [
              b.price_max == null ? '∞' : b.price_max.toLocaleString(),
              `${b.rate_pct}%`,
              b.min_per_cc,
            ])}
          />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 10px' }}>Авто 3–5 лет — €/см³</h3>
          <BracketTable
            cols={['Объём до, см³', '€ за см³']}
            rows={(current?.mid_3_to_5y?.volume_brackets || []).map((b) => [
              b.cc_max == null ? '∞' : b.cc_max.toLocaleString(),
              b.eur_per_cc,
            ])}
          />
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 10px' }}>Авто старше 5 лет — €/см³</h3>
          <BracketTable
            cols={['Объём до, см³', '€ за см³']}
            rows={(current?.old_over_5y?.volume_brackets || []).map((b) => [
              b.cc_max == null ? '∞' : b.cc_max.toLocaleString(),
              b.eur_per_cc,
            ])}
          />
          <details style={{ marginTop: 28 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#475467', fontSize: 13 }}>
              Редактировать как JSON (для опытных пользователей)
            </summary>
            <JsonEditor
              value={current}
              onSave={async (parsed) => {
                setSaving(true);
                try {
                  await axios.put(`${API}/api/customs/admin/tariffs/${activeCountry}`, parsed);
                  toast.success('JSON применён и сохранён');
                  await load();
                } catch (e) {
                  toast.error('Ошибка применения JSON: ' + (e?.response?.data?.detail || e.message));
                } finally {
                  setSaving(false);
                }
              }}
            />
          </details>
        </div>
      )}

      <div style={{ marginTop: 40, padding: 16, background: '#f0f9ff', border: '1px solid #b9e6fe', borderRadius: 8, fontSize: 13, color: '#0e74a8' }}>
        💡 <strong>Подсказка.</strong> Калькулятор автоматически выбирает северный маршрут
        (через Беларусь) для авто с объёмом до 1.9 L и южный (через Турцию/Грузию) для
        авто с большим объёмом. Это правило заложено в коде; ставки маршрутов
        редактируются на вкладке «Логистика».
      </div>
    </div>
  );
}

/* ─────────────────────────── small components ─────────────────────────── */
function BracketTable({ cols, rows }) {
  return (
    <div style={{ overflow: 'auto', border: '1px solid #e4e7ec', borderRadius: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            {cols.map((c) => (
              <th key={c} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#344054', borderBottom: '1px solid #e4e7ec' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', borderBottom: '1px solid #f2f4f7', color: '#475467' }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonEditor({ value, onSave }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState(null);
  useEffect(() => { setText(JSON.stringify(value, null, 2)); }, [value]);
  return (
    <div style={{ marginTop: 12 }}>
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setError(null); }}
        style={{
          width: '100%',
          minHeight: 320,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          fontSize: 12,
          padding: 12,
          border: '1px solid #d0d5dd',
          borderRadius: 6,
          background: '#0F172A',
          color: '#e2e8f0',
        }}
      />
      {error && <div style={{ color: '#d92d20', fontSize: 12, marginTop: 6 }}>{error}</div>}
      <button
        onClick={() => {
          try {
            const parsed = JSON.parse(text);
            onSave(parsed);
          } catch (e) {
            setError('Невалидный JSON: ' + e.message);
          }
        }}
        style={{
          marginTop: 10, padding: '8px 16px', background: '#162E51', color: '#fff',
          border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}
      >
        Применить JSON
      </button>
    </div>
  );
}
