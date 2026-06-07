import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../App';
import { motion } from 'framer-motion';
import {
  ChartPie,
  Wallet,
  Pulse,
  Lightning,
  CurrencyCircleDollar,
} from '@phosphor-icons/react';

/**
 * Admin Dashboard — упрощён по требованию:
 *   • Убраны все блоки про менеджеров / лидов (Workload, Lead Flow,
 *     My Operational Queue, Callback Control, Overloaded managers).
 *   • Убран блок Документы — в системе нет бизнес-логики документов.
 *   • Остались: Депозиты, Очередь, Ошибки, Состояние системы.
 */
const Dashboard = () => {
  const [masterData, setMasterData] = useState(null);
  const [period, setPeriod] = useState('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/dashboard/master?period=${period}`);
        if (!cancelled) setMasterData(res.data);
      } catch (err) {
        if (!cancelled) setMasterData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-[#18181B] border-t-transparent rounded-full" />
      </div>
    );
  }

  const deposits = masterData?.deposits || { pendingDeposits: 0, depositsWithoutProof: 0, verifiedToday: 0 };
  const system   = masterData?.system   || { systemStatus: 'healthy', queueBacklog: 0, failedJobs: 0 };

  const periodLabels = { day: 'Сегодня', week: 'Неделя', month: 'Месяц' };
  const generatedAt = masterData?.generatedAt || new Date().toISOString();

  return (
    <motion.div
      data-testid="master-dashboard-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#18181B] text-white flex items-center justify-center shrink-0">
            <ChartPie size={20} weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold tracking-tight text-[#18181B] break-words leading-tight"
              style={{ fontFamily: 'Mazzard, Mazzard H, Mazzard M, system-ui, sans-serif' }}
            >
              Панель управления
            </h1>
            <p className="text-[12px] text-[#71717A] mt-0.5 break-words">
              Обновлено: {new Date(generatedAt).toLocaleString('ru-RU')}
            </p>
          </div>
        </div>

        <div className="period-tabs overflow-x-auto shrink-0 self-start" data-testid="period-selector">
          {['day', 'week', 'month'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`period-tab whitespace-nowrap ${period === p ? 'active' : ''}`}
              data-testid={`period-${p}`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Row */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 mb-6 lg:mb-8"
        data-testid="kpi-summary-row"
      >
        <KpiCard
          icon={CurrencyCircleDollar}
          label="Депозиты в ожидании"
          value={deposits.pendingDeposits}
          color="#18181B"
        />
        <KpiCard
          icon={Pulse}
          label="Очередь задач"
          value={system.queueBacklog}
          color="#18181B"
        />
        <KpiCard
          icon={Lightning}
          label="Ошибки"
          value={system.failedJobs}
          color={system.failedJobs > 0 ? '#DC2626' : '#18181B'}
          alert={system.failedJobs > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        {/* Deposits */}
        <div className="section-card" data-testid="deposits-card">
          <div className="section-title-clean">
            <Wallet size={22} weight="duotone" className="text-[#059669]" />
            <span>Депозиты</span>
          </div>
          <div className="space-y-1">
            <MetricRow label="В ожидании" value={deposits.pendingDeposits} />
            <MetricRow
              label="Без подтверждения"
              value={deposits.depositsWithoutProof}
              alert={deposits.depositsWithoutProof > 0}
            />
            <MetricRow label="Подтверждены" value={deposits.verifiedToday} color="#059669" />
          </div>
        </div>

        {/* System Health */}
        <div className="section-card" data-testid="system-health">
          <div className="section-title-clean">
            <Pulse size={22} weight="duotone" className="text-[#059669]" />
            <span>Состояние системы</span>
          </div>
          <div className="space-y-1">
            <div className="metric-row">
              <span className="metric-label">Статус</span>
              <SystemStatusBadge status={system.systemStatus} />
            </div>
            <MetricRow label="Очередь" value={system.queueBacklog} />
            <MetricRow
              label="Ошибки"
              value={system.failedJobs}
              alert={system.failedJobs > 0}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const KpiCard = ({ icon: Icon, label, value, color, alert }) => (
  <div
    className={`kpi-card p-4 sm:p-5 ${alert ? 'border-[#DC2626]' : ''}`}
    data-testid={`kpi-${String(label).toLowerCase().replace(/\s/g, '-')}`}
  >
    <div className="mb-3 sm:mb-4">
      <Icon size={24} className="sm:hidden" weight="duotone" style={{ color }} />
      <Icon size={28} className="hidden sm:block" weight="duotone" style={{ color }} />
    </div>
    <div
      className={`text-xl sm:text-2xl lg:text-[2.25rem] font-bold tracking-tight leading-none ${
        alert ? 'text-[#DC2626]' : 'text-[#18181B]'
      }`}
      style={{ fontFamily: 'Mazzard, Mazzard H, Mazzard M, system-ui, sans-serif' }}
    >
      {value}
    </div>
    <div className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[#71717A] mt-1.5 sm:mt-2">
      {label}
    </div>
  </div>
);

const MetricRow = ({ label, value, color, alert }) => (
  <div className="metric-row">
    <span className="metric-label">{label}</span>
    <span
      className={`metric-value ${alert ? 'alert' : ''}`}
      style={{ color: !alert && color ? color : undefined }}
    >
      {value}
    </span>
  </div>
);

const SystemStatusBadge = ({ status }) => {
  const configs = {
    healthy:  { bg: '#D1FAE5', color: '#059669', label: 'РАБОТАЕТ' },
    warning:  { bg: '#FEF3C7', color: '#D97706', label: 'ПРЕДУПРЕЖДЕНИЕ' },
    critical: { bg: '#FEE2E2', color: '#DC2626', label: 'КРИТИЧЕСКИЙ' },
  };
  const config = configs[status] || configs.healthy;
  return (
    <span className="badge" style={{ background: config.bg, color: config.color }}>
      {config.label}
    </span>
  );
};

export default Dashboard;
