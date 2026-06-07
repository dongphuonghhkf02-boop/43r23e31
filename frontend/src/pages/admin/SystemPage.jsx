/**
 * SystemPage — резко урезанный хаб настроек CRM по требованию:
 *   • Двухфакторная аутентификация для входа в CRM
 *   • Интеграции — только Google Sign-In (авторизация) и Resend (почтовые рассылки)
 *
 * Всё остальное (Stripe, SMS, Email outbox/SMTP, AI, Workers Health,
 * Domain & CORS, CRM-pipelines и т.п.) из хаба убрано.
 */
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wrench, ShieldCheck, Plugs } from '@phosphor-icons/react';

import AdminSettingsPage from './AdminSettingsPage';
import IntegrationsPage from './IntegrationsPage';

import SectionTabs from '../../components/ui/SectionTabs';

const TABS = [
  { id: '2fa',          icon: ShieldCheck, label: 'Двухфакторная аутентификация',
    tip: 'Настройка входа в CRM через Google Authenticator / TOTP.' },
  { id: 'integrations', icon: Plugs, label: 'Интеграции',
    tip: 'Google Sign-In и рассылка email через Resend.' },
];

export default function SystemPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const search = new URLSearchParams(location.search);
    const tab = search.get('tab') || '2fa';
    return TABS.find((x) => x.id === tab) ? tab : '2fa';
  }, [location.search]);

  const setTab = (id) => {
    const search = new URLSearchParams(location.search);
    search.set('tab', id);
    navigate({ pathname: '/admin/settings', search: search.toString() }, { replace: false });
  };

  return (
    <div
      className="min-h-full bg-[#FAFAFA]"
      style={{ fontFamily: 'Mazzard, Mazzard H, Mazzard M, system-ui, sans-serif' }}
    >
      <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-4 bg-white border-b border-[#E4E4E7]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#18181B] text-white flex items-center justify-center shrink-0">
              <Wrench size={20} weight="bold" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-[#18181B] leading-tight">
                Система
              </h1>
              <p className="text-[12px] text-[#71717A] mt-0.5">
                Двухфакторная аутентификация и подключённые интеграции.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <SectionTabs
              tabs={TABS}
              activeId={activeTab}
              onChange={setTab}
              testIdPrefix="system-tab"
              ariaLabel="Разделы системы"
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === '2fa' && (
            <AdminSettingsPage embedded forceTab="security" hideTabs />
          )}
          {activeTab === 'integrations' && (
            <IntegrationsPage embedded filterProviders={['google_oauth', 'resend']} />
          )}
        </div>
      </div>
    </div>
  );
}
