/**
 * DM Auto — Generic Policy Page (Privacy / Terms / Cookies / Conditions).
 * Content comes from /api/site-info?lang=en|ru. EN/RU UI.
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
// Header / Footer come from <PublicLayout /> at the route level — do not import here.
import { useLang } from '../../i18n';
import './PolicyPage.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const T = {
  en: { home: 'Home /', loading: 'Loading…', empty: 'No content yet.', back: '← Back to home', unavailable: '<p>Content unavailable.</p>' },
  ru: { home: 'Главная /', loading: 'Загрузка…', empty: 'Содержимого пока нет.', back: '← Назад на главную', unavailable: '<p>Содержимое недоступно.</p>' },
};

export default function PolicyPage({ policyKey }) {
  const { lang } = useLang();
  const t = lang === 'ru' ? T.ru : T.en;
  const { pathname } = useLocation();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiLang = lang === 'ru' ? 'ru' : 'en';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const r = await axios.get(`${API_URL}/api/site-info/policy/${policyKey}`, { params: { lang: apiLang } });
        if (!cancelled) setPolicy(r.data);
      } catch {
        if (!cancelled) setPolicy({ title: policyKey, content: t.unavailable });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [policyKey, apiLang, t.unavailable]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="bibi-policy-page bg-[var(--bg-base)] text-[var(--text-primary)]">
      <section className="bibi-policy-hero">
        <div className="bibi-container">
          <nav className="bibi-policy-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">{t.home}</Link>
            <span>{policy?.title || '...'}</span>
          </nav>
          <h1 className="bibi-policy-title">{policy?.title || (loading ? t.loading : '')}</h1>
        </div>
      </section>

      <section className="bibi-policy-body">
        <div className="bibi-container">
          <article
            className="bibi-policy-prose"
            dangerouslySetInnerHTML={{ __html: policy?.content || (loading ? `<p>${t.loading}</p>` : `<p>${t.empty}</p>`) }}
          />
          <p className="bibi-policy-back">
            <Link to="/">{t.back}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
