/**
 * NotificationsHubPage — тотально упрощённый хаб по требованию:
 *   «Отправить уведомление клиенту — и всё.»
 *
 * Одна форма:
 *   1) выбрать клиента
 *   2) выбрать канал: в кабинет (in-app) / Email / Оба
 *   3) ввести заголовок и текст
 *   4) Отправить
 *
 * Под ниже — компактный лог последних отправок.
 *
 * Backend: POST /api/admin/notifications/send-to-customer
 *          GET  /api/admin/notifications/customers
 *          GET  /api/admin/notifications/log
 */
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Bell, MagnifyingGlass, PaperPlaneTilt, EnvelopeSimple, ChatCenteredDots, CheckCircle, XCircle, Clock } from '@phosphor-icons/react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const CHANNELS = [
  { id: 'in_app', label: 'В кабинет клиента', icon: ChatCenteredDots, hint: 'Пуш-уведомление в персональном кабинете' },
  { id: 'email',  label: 'Email (Resend)',     icon: EnvelopeSimple,    hint: 'Письмо на email клиента через Resend' },
  { id: 'both',   label: 'Кабинет + Email',   icon: PaperPlaneTilt,     hint: 'Оба канала одновременно' },
];

export default function NotificationsHubPage() {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [channel, setChannel] = useState('in_app');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [log, setLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);

  const fetchCustomers = async (q = '') => {
    setLoadingCustomers(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/notifications/customers`, {
        params: q ? { search: q, limit: 200 } : { limit: 200 },
      });
      setCustomers(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      console.error(e);
      toast.error('Не удалось загрузить список клиентов');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchLog = async () => {
    setLoadingLog(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/notifications/log`, { params: { limit: 30 } });
      setLog(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      // лог — неблокирующий
    } finally {
      setLoadingLog(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchLog();
  }, []);

  // Легкий поиск по уже загруженным клиентам (плюс серверный search по Enter).
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.id].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [customers, search]);

  const selected = customers.find((c) => c.id === selectedCustomerId) || null;

  const canSend = selectedCustomerId && title.trim() && message.trim() && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await axios.post(`${API_URL}/api/admin/notifications/send-to-customer`, {
        customerId: selectedCustomerId,
        channel,
        title: title.trim(),
        message: message.trim(),
      });
      const channels = res.data?.channels || {};
      const allOk = Object.values(channels).every((c) => c?.ok);
      if (allOk) {
        toast.success('Уведомление отправлено');
      } else {
        const errors = Object.entries(channels)
          .filter(([, v]) => !v?.ok)
          .map(([k, v]) => `${k}: ${v?.error || 'failed'}`)
          .join(' · ');
        toast.warning(`Отправлено частично. ${errors}`);
      }
      setTitle('');
      setMessage('');
      fetchLog();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Не удалось отправить уведомление');
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="notifications-hub"
      style={{ fontFamily: 'Mazzard, Mazzard H, Mazzard M, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-[#18181B] text-white flex items-center justify-center shrink-0">
          <Bell size={20} weight="bold" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[#18181B] leading-tight">Уведомления</h1>
          <p className="text-[12px] text-[#71717A] mt-0.5">
            Отправьте уведомление клиенту — в кабинет или на email через Resend.
          </p>
        </div>
      </div>

      {/* Grid: форма + список клиентов */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* === LEFT: форма === */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[#18181B]">Отправка уведомления</h2>
          <p className="text-[12px] text-[#71717A] mt-1 mb-5">
            Выберите клиента, канал и введите текст сообщения.
          </p>

          {/* Селект клиента — видимость состояния */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5">
              Клиент
            </label>
            <div
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${
                selected ? 'border-[#18181B] bg-[#F7F7F8]' : 'border-[#E4E4E7] bg-white'
              }`}
            >
              {selected ? (
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#18181B] truncate">
                    {selected.name || selected.email || selected.id}
                  </div>
                  <div className="text-[11px] text-[#71717A] truncate">
                    {[selected.email, selected.phone].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#A1A1AA]">Выберите клиента справа из списка</div>
              )}
              {selected && (
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('')}
                  className="text-[12px] text-[#71717A] hover:text-[#18181B] px-2 py-1 rounded-md hover:bg-white shrink-0"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Канал */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5">
              Канал доставки
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                const active = channel === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setChannel(c.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                      active
                        ? 'border-[#18181B] bg-[#18181B] text-white'
                        : 'border-[#E4E4E7] bg-white text-[#18181B] hover:border-[#A1A1AA]'
                    }`}
                    data-testid={`channel-${c.id}`}
                  >
                    <Icon size={18} weight="duotone" className={active ? 'text-white' : 'text-[#52525B]'} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{c.label}</div>
                      <div className={`text-[11px] mt-0.5 ${active ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                        {c.hint}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Заголовок */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5">
              Заголовок
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Короткий заголовок сообщения"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] bg-white text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10"
              data-testid="notif-title"
            />
          </div>

          {/* Сообщение */}
          <div className="mb-5">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#71717A] mb-1.5">
              Текст сообщения
            </label>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              placeholder="Напишите текст уведомления…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4E4E7] bg-white text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] focus:ring-2 focus:ring-[#18181B]/10 resize-y"
              data-testid="notif-message"
            />
            <div className="text-[11px] text-[#A1A1AA] mt-1 text-right">{message.length} / 4000</div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              type="button"
              onClick={() => { setTitle(''); setMessage(''); }}
              className="px-4 py-2.5 rounded-xl border border-[#E4E4E7] text-sm font-medium text-[#52525B] hover:bg-[#F4F4F5]"
            >
              Очистить
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                canSend
                  ? 'bg-[#18181B] text-white hover:bg-black'
                  : 'bg-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed'
              }`}
              data-testid="notif-send"
            >
              <PaperPlaneTilt size={16} weight="bold" />
              {sending ? 'Отправка…' : 'Отправить'}
            </button>
          </div>
        </div>

        {/* === RIGHT: список клиентов === */}
        <aside className="bg-white border border-[#E4E4E7] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#18181B]">Клиенты</h3>
            <span className="text-[11px] text-[#A1A1AA]">{filtered.length}</span>
          </div>
          <div className="relative mb-3">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') fetchCustomers(search.trim()); }}
              placeholder="Поиск по имени / email / телефону"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E4E4E7] bg-white text-[13px] text-[#18181B] focus:outline-none focus:border-[#18181B]"
              data-testid="customer-search"
            />
          </div>
          <div className="max-h-[520px] overflow-y-auto -mx-2 px-2 space-y-1">
            {loadingCustomers && (
              <div className="text-[12px] text-[#A1A1AA] py-6 text-center">Загрузка…</div>
            )}
            {!loadingCustomers && filtered.length === 0 && (
              <div className="text-[12px] text-[#A1A1AA] py-6 text-center">Клиенты не найдены</div>
            )}
            {filtered.map((c) => {
              const active = c.id === selectedCustomerId;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${
                    active
                      ? 'border-[#18181B] bg-[#F7F7F8]'
                      : 'border-transparent hover:bg-[#F4F4F5]'
                  }`}
                  data-testid={`customer-row-${c.id}`}
                >
                  <div className="text-[13px] font-semibold text-[#18181B] truncate">
                    {c.name || c.email || c.id}
                  </div>
                  <div className="text-[11.5px] text-[#71717A] truncate">
                    {[c.email, c.phone].filter(Boolean).join(' · ') || '—'}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {/* === LOG === */}
      <div className="mt-6 bg-white border border-[#E4E4E7] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#18181B]">Последние отправки</h3>
            <p className="text-[12px] text-[#71717A] mt-0.5">Лог ручных уведомлений клиентам</p>
          </div>
          <button
            type="button"
            onClick={fetchLog}
            className="px-3 py-1.5 rounded-lg border border-[#E4E4E7] text-[12px] font-medium text-[#52525B] hover:bg-[#F4F4F5]"
          >
            Обновить
          </button>
        </div>
        {loadingLog && (
          <div className="text-[12px] text-[#A1A1AA] py-6 text-center">Загрузка…</div>
        )}
        {!loadingLog && log.length === 0 && (
          <div className="text-[12px] text-[#A1A1AA] py-6 text-center">Пока нет отправок</div>
        )}
        {!loadingLog && log.length > 0 && (
          <ul className="divide-y divide-[#F4F4F5]">
            {log.map((row) => {
              const channels = row.results || {};
              const allOk = Object.values(channels).every((c) => c?.ok);
              const StatusIcon = allOk ? CheckCircle : Object.keys(channels).length === 0 ? Clock : XCircle;
              const statusColor = allOk ? '#059669' : Object.keys(channels).length === 0 ? '#D97706' : '#DC2626';
              return (
                <li key={row.id} className="py-3 flex items-start gap-3">
                  <StatusIcon size={18} weight="duotone" style={{ color: statusColor }} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-semibold text-[#18181B] truncate">{row.title}</span>
                      <span className="text-[11px] text-[#A1A1AA]">
                        {new Date(row.createdAt).toLocaleString('ru-RU')}
                      </span>
                    </div>
                    <div className="text-[12px] text-[#52525B] mt-0.5 line-clamp-2 whitespace-pre-wrap">
                      {row.message}
                    </div>
                    <div className="text-[11px] text-[#71717A] mt-1">
                      Клиент: <span className="font-mono">{row.customerId}</span> · Канал: {row.channel}
                      {Object.entries(channels).map(([k, v]) => (
                        <span key={k} className={`ml-2 ${v?.ok ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                          · {k}: {v?.ok ? 'ok' : (v?.error || 'failed')}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
