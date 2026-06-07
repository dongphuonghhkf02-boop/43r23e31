/**
 * DM Auto — Coming Soon placeholder page.
 * Used as a stand-in for /catalog and /calculator.
 * Header/footer come from DmAutoPublicLayout. EN/RU.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../../i18n';
import './ComingSoonPage.css';

const T = {
  en: {
    home: 'HOME /',
    badge: 'Coming Soon',
    titlePrefix: "We're building ",
    titleAccent: 'something great',
    body1Prefix: 'The new ',
    body1Suffix: ' experience is on its way.',
    body2: 'Stay tuned — it will launch shortly.',
    learn: 'Learn About Us',
    contact: 'Contact Us',
    catalog: 'Catalog',
    calculator: 'Calculator',
    page: 'Coming Soon',
  },
  ru: {
    home: 'ГЛАВНАЯ /',
    badge: 'Скоро запуск',
    titlePrefix: 'Мы создаём ',
    titleAccent: 'нечто впечатляющее',
    body1Prefix: 'Новый раздел ',
    body1Suffix: ' уже в пути.',
    body2: 'Оставайтесь с нами — мы скоро запустим.',
    learn: 'Узнать о нас',
    contact: 'Связаться с нами',
    catalog: 'Каталог',
    calculator: 'Калькулятор',
    page: 'Скоро запуск',
  },
};

export default function ComingSoonPage({ title, breadcrumbKey }) {
  const { lang } = useLang();
  const t = lang === 'ru' ? T.ru : T.en;
  const { pathname } = useLocation();

  const inferredKey = (() => {
    if (breadcrumbKey) return breadcrumbKey;
    if (pathname.startsWith('/catalog')) return 'catalog';
    if (pathname.startsWith('/calculator')) return 'calculator';
    return 'page';
  })();

  const heading = (
    title
    || (inferredKey === 'catalog' ? t.catalog
        : inferredKey === 'calculator' ? t.calculator
        : t.page)
  );

  return (
    <div className="bibi-coming-soon" data-testid={`${inferredKey}-coming-soon`}>
      <section className="bibi-hero">
        <div className="bibi-container">
          <nav className="bibi-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">{t.home}</Link>
            <span>{heading}</span>
          </nav>
          <h1 className="bibi-hero__title">{heading}</h1>
        </div>
      </section>

      <section className="bibi-coming-soon__body">
        <div className="bibi-container">
          <div className="bibi-coming-soon__card">
            <span className="bibi-coming-soon__badge">{t.badge}</span>
            <h2 className="bibi-coming-soon__title">
              {t.titlePrefix}<span className="bibi-accent">{t.titleAccent}</span>.
            </h2>
            <p className="bibi-coming-soon__text">
              {t.body1Prefix}{heading.toLowerCase()}{t.body1Suffix}<br />
              {t.body2}
            </p>
            <div className="bibi-coming-soon__actions">
              <Link to="/about" className="bibi-btn bibi-btn--primary">
                {t.learn}
              </Link>
              <Link to="/contacts" className="bibi-btn bibi-btn--ghost">
                {t.contact}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
