import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { useLang } from '../i18n';
import {
  ChartPieSlice,
  UserCircle,
  MagnifyingGlass,
  Database,
  SignOut,
  CaretDown,
  CaretUp,
  Percent,
  Sliders,
  Wrench,
  List,
  X,
  Bell,
  LockKey,
  FileText,
  Star,
} from '@phosphor-icons/react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    settings: false,
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const searchItems = [
    { path: '/admin', label: 'Панель', keywords: ['dashboard', 'панель'] },
    { path: '/admin/customers', label: 'Клиенты', keywords: ['customers', 'клиенты'] },
    { path: '/admin/calculator', label: 'Калькулятор', keywords: ['calculator', 'калькулятор'] },
    { path: '/admin/cars', label: 'Каталог авто', keywords: ['cars', 'каталог', 'авто', 'подборка'] },
    { path: '/admin/notifications', label: 'Уведомления', keywords: ['notifications', 'уведомления'] },
    { path: '/admin/settings', label: 'Система', keywords: ['settings', 'настройки'] },
  ];

  const filteredSearchItems = searchQuery.trim()
    ? searchItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.keywords || []).some((k) => (k || '').toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setIsMobileSearchOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/cabinet/login');
  };

  const toggleSection = (id) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const isItemActive = (path) => {
    const [base] = path.split('?');
    return location.pathname === base;
  };

  const isSectionActive = (items) =>
    Array.isArray(items) && items.some((it) => isItemActive(it.path));

  const navGroups = [
    {
      id: 'dashboard',
      type: 'single',
      item: { path: '/admin', icon: ChartPieSlice, label: 'Панель' },
    },
    {
      id: 'customers',
      type: 'single',
      item: { path: '/admin/customers', icon: UserCircle, label: 'Клиенты' },
    },
    {
      id: 'calculator',
      type: 'single',
      item: { path: '/admin/calculator', icon: Percent, label: 'Калькулятор' },
    },
    {
      id: 'cars',
      type: 'single',
      item: { path: '/admin/cars', icon: Star, label: 'Каталог авто' },
    },
    {
      id: 'notifications',
      type: 'single',
      item: { path: '/admin/notifications', icon: Bell, label: 'Уведомления' },
    },
    {
      id: 'settings',
      type: 'group',
      label: 'Настройки',
      icon: Sliders,
      items: [
        { path: '/admin/settings', icon: Wrench, label: 'Система' },
        { path: '/admin/info', icon: FileText, label: 'Info' },
      ],
    },
  ];

  const roleLabels = {
    master_admin: 'Мастер-админ',
    admin: 'Админ',
    moderator: 'Модератор',
  };

  return (
    <div className="admin-layout flex h-screen bg-[#F7F7F8]">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="mobile-overlay"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E4E4E7]
          transform transition-transform duration-300 ease-out
          flex flex-col
          md:static md:translate-x-0 md:w-[260px] md:flex
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 md:p-5 border-b border-[#E4E4E7] flex items-center justify-between">
          <img src="/images/logo.svg" alt="Logo" className="h-8 md:h-10 w-auto" />
          <button
            className="md:hidden p-2 -mr-2 text-[#71717A] hover:text-[#18181B]"
            onClick={() => setIsMobileMenuOpen(false)}
            data-testid="mobile-menu-close"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        <nav className="flex-1 py-3 md:py-4 overflow-y-auto" data-testid="sidebar-nav">
          {navGroups.map((group) => {
            if (group.type === 'single') {
              const { path, icon: Icon, label } = group.item;
              return (
                <NavLink
                  key={group.id}
                  to={path}
                  end
                  className={() =>
                    `sidebar-item min-h-[44px] ${isItemActive(path) ? 'active' : ''}`
                  }
                  data-testid={`nav-${group.id}`}
                >
                  <Icon size={20} weight="duotone" />
                  <span style={{ flex: 1 }}>{label}</span>
                </NavLink>
              );
            }

            const isExpanded = expandedSections[group.id];
            const isActive = isSectionActive(group.items);
            const GroupIcon = group.icon;

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleSection(group.id)}
                  className={`sidebar-group-header min-h-[44px] ${isActive ? 'active' : ''}`}
                  data-testid={`nav-group-${group.id}`}
                >
                  <div className="flex items-center gap-3">
                    <GroupIcon size={20} weight="duotone" />
                    <span>{group.label}</span>
                  </div>
                  {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                </button>

                {isExpanded && (
                  <div className="sidebar-group-items">
                    {group.items.map(({ path, icon: Icon, label }) => (
                      <NavLink
                        key={path}
                        to={path}
                        className={() =>
                          `sidebar-subitem min-h-[44px] ${isItemActive(path) ? 'active' : ''}`
                        }
                        data-testid={`nav-${path.replace(/\//g, '-')}`}
                      >
                        <Icon size={16} weight="duotone" />
                        <span style={{ flex: 1 }}>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 md:p-4 border-t border-[#E4E4E7]">
          <div className="text-xs text-[#A1A1AA] px-3 mb-2">
            {roleLabels[user?.role] || user?.role}
          </div>
          <NavLink
            to="/admin/profile/password"
            className="w-full flex items-center gap-2 px-3 py-2.5 mb-1 text-sm font-medium text-[#52525B] hover:text-[#18181B] rounded-xl hover:bg-[#F4F4F5] transition-all"
            data-testid="change-password-link"
          >
            <LockKey size={18} weight="duotone" />
            <span>Сменить пароль</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#71717A] hover:text-[#DC2626] rounded-xl hover:bg-[#FEE2E2] transition-all"
            data-testid="logout-btn"
          >
            <SignOut size={18} weight="duotone" />
            <span>Выход</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="relative z-30 h-14 md:h-16 bg-white border-b border-[#E4E4E7] flex items-center justify-between px-3 sm:px-4 md:px-8 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              className="md:hidden p-2 -ml-1 text-[#18181B] hover:bg-[#F4F4F5] rounded-lg"
              onClick={() => setIsMobileMenuOpen(true)}
              data-testid="mobile-menu-toggle"
            >
              <List size={22} weight="bold" />
            </button>
            <div className="hidden md:block w-80 relative">
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full"
                data-testid="search-input"
              />
              {searchQuery && filteredSearchItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-50 py-2 max-h-64 overflow-auto">
                  {filteredSearchItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleSearchSelect(item.path)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#F4F4F5]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
            <button
              className="md:hidden p-2 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              data-testid="mobile-search-btn"
            >
              <MagnifyingGlass size={20} weight="bold" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 py-5 md:px-6 md:py-6 lg:px-[50px] lg:py-8">
          {isMobileSearchOpen && (
            <div className="md:hidden mb-4 relative">
              <input
                type="text"
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="input w-full"
                data-testid="mobile-search-input"
              />
              {searchQuery && filteredSearchItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E4E4E7] rounded-xl shadow-lg z-50 py-2 max-h-64 overflow-auto">
                  {filteredSearchItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleSearchSelect(item.path)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F4F5]"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
