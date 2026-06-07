/**
 * DM Auto - Main Application (cleaned)
 *
 * Удалено по требованию:
 *  - Кабинет: Orders, Watchlist (VIN-tracking), Invoices, Contracts, Shipping,
 *             Timeline, Deposits, Payment-Success, Financials
 *  - Админ: Deals/Deal360/DealWorkspace, Legal/Deposits, Finance360, Delivery360,
 *           Operations360, Forecasting360, Contract360, Executive, ActionCenter,
 *           NotificationCenter, CustomerPortal, Staff, Payments (Stripe),
 *           Services, Tracking (VesselFinder, Shipments, Exceptions, ExtClients),
 *           OwnerPaymentDashboard, InvoiceReminders, ContractsAccounting,
 *           Routing/Cadences/ScoreRules, Predictive Leads, KPI, CallBoard,
 *           StaffSessions, Risk, Journey, Escalations, Control hub,
 *           Team/* и Manager/* воркспейсы (роли менеджер/тимлид)
 *
 * Wave 2026-06: удалены все СРМ-представления менеджеров и лидов
 * (Leads, Lead360, Dashboard widgets) и админский блок нотификаций
 * (NotificationsPage/Settings/Hub).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'sonner';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LanguageProvider } from './i18n';
import { CabinetThemeProvider } from './context/CabinetThemeContext';

// Public site
import PublicLayout from './components/public/PublicLayout';
import ScrollToTop from './components/ScrollToTop';
import { initTracker } from './lib/tracker';
import { GetInTouchProvider } from './components/public/GetInTouchModal';
import './components/public/GetInTouchModal.css';
import { PolicyModalProvider } from './components/public/PolicyModal';
import './components/public/PolicyModal.css';
import FigmaHomePage from './figma_home';
import VinCheckPage from './pages/public/VinCheckPage';
import CalculatorPage from './pages/public/CalculatorPage';
// CatalogPage retired 2026-06 in favour of admin-curated home-page picks.
// The /catalog route now Navigate-redirects to "/" — see route block below.
import CustomerLoginPage, { CustomerAuthProvider, AuthCallback } from './pages/public/CustomerAuth';
import SingleCarPage from './pages/public/SingleCarPage/SingleCarPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage from './pages/public/ResetPasswordPage';
import { CollectionsPage, CollectionDetailPage } from './pages/public/CollectionsPage';
import AboutPage from './pages/public/AboutPage';
import ContactsPage from './pages/public/ContactsPage';
import BlogPage from './pages/public/BlogPage';
import BlogArticlePage from './pages/public/BlogArticlePage';
import PolicyPage from './pages/public/PolicyPage';
import QuoteSharePage from './pages/public/QuoteSharePage';
import CookieConsentBanner from './components/public/CookieConsentBanner';

// Admin pages (kept)
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Settings from './pages/Settings'; // noqa — referenced from System hub legacy
import ProxySettings from './pages/ProxySettings';
import ParserControl from './pages/ParserControl';
import ProxyManager from './pages/ProxyManager';
import ParserLogs from './pages/ParserLogs';
import ParserSettings from './pages/ParserSettings';
import ParserTestLab from './pages/ParserTestLab';
import CalculatorAdmin from './pages/CalculatorAdmin';
import Customer360 from './pages/Customer360';
import SourceHealthDashboard from './pages/admin/SourceHealthDashboard';
import VinEngineDashboard from './pages/admin/VinEngineDashboard';
import HistoryReportsAdmin from './pages/admin/HistoryReportsAdmin';
import CarfaxAdminPage from './pages/admin/CarfaxAdminPage';
import SystemPage from './pages/admin/SystemPage';
import AdminInfoPage from './pages/admin/AdminInfoPage';
import RingostatAdminPage from './pages/admin/RingostatAdminPage'; // FROZEN — UI-скрыт, оставлен в коде
import NotificationsHubPage from './pages/admin/NotificationsHubPage';
import WishlistDealsAdminPage from './pages/admin/WishlistDealsAdminPage';
import CarsAdminPage from './pages/admin/CarsAdminPage';

// Cabinet — оставляем только фавориты, сравнение, расшаренное, профиль, уведомления, dashboard
import {
  CabinetLayout,
  CabinetDashboard,
  CabinetProfile,
  CabinetNotifications,
} from './pages/CustomerCabinet';
import Layout from './components/Layout';

import FavoritesPage from './pages/cabinet/FavoritesPage';
import ComparePage from './pages/cabinet/ComparePage';
import SharedCarsPage from './pages/cabinet/SharedCarsPage';

import ChangePasswordPage from './pages/ChangePasswordPage';

import { initAnalytics } from './utils/analytics';
import './App.css';

if (typeof window !== 'undefined') {
  initAnalytics();
}

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        if (status === 401 && error.config?.url?.includes('/api/auth/me')) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`);
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const data = res.data || {};
    if (data.challenge) {
      return { __challenge: true, ...data };
    }
    const { access_token, user } = data;
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(user);
    return user;
  };

  const completeChallenge = async (path, body) => {
    const res = await axios.post(`${API_URL}${path}`, body);
    const { access_token, user } = res.data || {};
    if (!access_token) throw new Error('No access_token in challenge response');
    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    setToken(access_token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {});
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, completeChallenge }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F7F7F8]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#0A0A0B] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-[#71717A]">Загрузка...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/cabinet/login" replace />;
  }
  return children;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function App() {
  useEffect(() => {
    initTracker();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <CabinetThemeProvider>
            <AuthProvider>
              <CustomerAuthProvider>
                <PolicyModalProvider>
                  <GetInTouchProvider>
                    <Toaster
                      position="top-right"
                      theme="dark"
                      closeButton
                      toastOptions={{
                        classNames: {
                          toast:
                            'bibi-toast !bg-[#1D1D1B] !text-white !border !border-[#3a3a38] !rounded-lg !shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
                          title: '!text-white !font-semibold',
                          description: '!text-[#B0B0B0]',
                          success: '!border-[#FEAE00]/40',
                          error: '!border-red-500/50',
                          info: '!border-[#FEAE00]/30',
                          actionButton: '!bg-[#FEAE00] !text-black !font-semibold hover:!bg-[#FFBF2D]',
                          cancelButton: '!bg-transparent !text-[#B0B0B0] hover:!text-white',
                          closeButton:
                            '!bg-[#2a2a28] !border !border-[#3a3a38] !text-[#B0B0B0] hover:!text-[#FEAE00]',
                        },
                      }}
                    />
                    <Routes>
                      {/* ========== PUBLIC ========== */}
                      <Route path="/" element={<PublicLayout />}>
                        <Route index element={<FigmaHomePage />} />
                      </Route>

                      <Route path="/" element={<PublicLayout />}>
                        <Route path="catalog" element={<Navigate to="/" replace />} />
                        <Route path="calculator" element={<CalculatorPage />} />
                        <Route path="cars/:slug" element={<SingleCarPage />} />
                        <Route path="vin-check" element={<VinCheckPage />} />
                        <Route path="vin-check/:vin" element={<VinCheckPage />} />
                        <Route path="vin/:query" element={<SingleCarPage />} />
                        <Route path="search/:query" element={<SingleCarPage />} />
                        <Route path="blog" element={<BlogPage />} />
                        <Route path="blog/:slug" element={<BlogArticlePage />} />
                        <Route path="collections" element={<CollectionsPage />} />
                        <Route path="collections/:slug" element={<CollectionDetailPage />} />
                        <Route path="about" element={<AboutPage />} />
                        <Route path="contacts" element={<ContactsPage />} />
                        <Route path="privacy" element={<PolicyPage policyKey="privacy" />} />
                        <Route path="terms" element={<PolicyPage policyKey="terms" />} />
                        <Route path="cookies" element={<PolicyPage policyKey="cookies" />} />
                        <Route path="conditions" element={<PolicyPage policyKey="conditions" />} />
                      </Route>

                      <Route path="/quote/:shareToken" element={<QuoteSharePage />} />

                      {/* ========== CUSTOMER AUTH ========== */}
                      <Route path="/cabinet/login" element={<CustomerLoginPage />} />
                      <Route path="/cabinet/callback" element={<AuthCallback />} />
                      <Route path="/cabinet/auth/callback" element={<AuthCallback />} />
                      <Route path="/cabinet/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/cabinet/reset-password" element={<ResetPasswordPage />} />

                      {/* ========== CUSTOMER CABINET (only kept blocks) ========== */}
                      <Route path="/cabinet" element={<Navigate to="/cabinet/test_customer_001" replace />} />
                      <Route path="/cabinet/favorites" element={<FavoritesPage />} />
                      <Route path="/cabinet/compare" element={<ComparePage />} />

                      <Route path="/cabinet/:customerId" element={<CabinetLayout />}>
                        <Route index element={<CabinetDashboard />} />
                        <Route path="notifications" element={<CabinetNotifications />} />
                        <Route path="favorites" element={<FavoritesPage />} />
                        <Route path="compare" element={<ComparePage />} />
                        <Route path="shared" element={<SharedCarsPage />} />
                        <Route path="profile" element={<CabinetProfile />} />
                      </Route>

                      {/* ========== ADMIN ========== */}
                      <Route path="/admin/login" element={<Navigate to="/cabinet/login" replace />} />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute>
                            <Layout />
                          </ProtectedRoute>
                        }
                      >
                        <Route index element={<Dashboard />} />
                        {/* Leads / Lead360 — удалены (в системе нет менеджеров/лидов) */}
                        <Route path="leads" element={<Navigate to="/admin" replace />} />
                        <Route path="leads/:id" element={<Navigate to="/admin" replace />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="customers/:id/360" element={<Customer360 />} />

                        {/* Calculator */}
                        <Route path="calculator" element={<CalculatorAdmin />} />

                        {/* Cars (BIBI 2026-06 pivot) — admin-curated catalog */}
                        <Route path="cars" element={<CarsAdminPage />} />

                        {/* Wishlist Deals — Legacy «Подборка недели». Replaced by /admin/cars. */}
                        <Route path="wishlist-deals" element={<Navigate to="/admin/cars" replace />} />

                        {/* VIN parsers — FROZEN (Wave 2026-06): UI hidden, routes redirect to dashboard.
                            Components and backend logic preserved for future unfreezing. */}
                        <Route path="proxy-settings" element={<Navigate to="/admin" replace />} />
                        <Route path="parser" element={<Navigate to="/admin" replace />} />
                        <Route path="parsers" element={<Navigate to="/admin" replace />} />
                        <Route path="parser-control-legacy" element={<Navigate to="/admin" replace />} />
                        <Route path="parser/proxies" element={<Navigate to="/admin" replace />} />
                        <Route path="parser/logs" element={<Navigate to="/admin" replace />} />
                        <Route path="parser/settings" element={<Navigate to="/admin" replace />} />
                        <Route path="parser-mesh/test" element={<Navigate to="/admin" replace />} />
                        <Route path="parser/chrome-extension" element={<Navigate to="/admin" replace />} />
                        <Route path="source-health" element={<Navigate to="/admin" replace />} />
                        <Route path="vin-engine" element={<Navigate to="/admin" replace />} />

                        {/* Moderation — удалена из навигации (была bid.cars/auction moderation,
                            не та логика, что нужна продукту). Маршруты редиректят на дашборд. */}
                        <Route path="moderation" element={<Navigate to="/admin" replace />} />
                        <Route path="listings/moderation" element={<Navigate to="/admin" replace />} />

                        {/* Notifications — единственный admin-хаб (отправка уведомлений клиентам).
                            Старые страницы NotificationSettings / NotificationRules выпилены. */}
                        <Route path="notifications" element={<NotificationsHubPage />} />
                        <Route path="notification-settings" element={<Navigate to="/admin/notifications" replace />} />
                        <Route path="settings/notifications" element={<Navigate to="/admin/notifications" replace />} />

                        {/* Password (2FA setup lives inside /admin/settings) */}
                        <Route path="profile/password" element={<ChangePasswordPage />} />

                        {/* History / Carfax */}
                        <Route path="history-reports" element={<HistoryReportsAdmin />} />
                        <Route path="carfax" element={<CarfaxAdminPage />} />
                        {/* Ringostat — ЗАМОРОЖЕН: UI скрыт, маршрут редиректит на дашборд.
                            Компонент и backend-логика оставлены в коде для будущей разморозки. */}
                        <Route path="ringostat" element={<Navigate to="/admin" replace />} />

                        {/* System / Settings */}
                        <Route path="settings" element={<SystemPage />} />
                        <Route path="settings/auth" element={<Navigate to="/admin/settings?tab=auth" replace />} />
                        <Route path="info" element={<AdminInfoPage />} />
                        <Route path="system-settings" element={<Navigate to="/admin/settings" replace />} />
                        <Route path="workers" element={<Navigate to="/admin/settings" replace />} />

                        {/* Catch-all */}
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                      </Route>

                      <Route path="/login" element={<Navigate to="/cabinet/login" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <CookieConsentBanner />
                  </GetInTouchProvider>
                </PolicyModalProvider>
              </CustomerAuthProvider>
            </AuthProvider>
          </CabinetThemeProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
export { API_URL };
