/**
 * BlogPage — "THE IMPORT INSIDER"
 *
 * Pixel-precise replica of the Figma reference (May 2026, 1920 px design).
 * Backend now provides real data, so all fallback placeholder articles have
 * been removed (per user requirement — production data only).
 *
 * Geometry highlights (1920):
 *   • Outer L/R padding ........... 100 px
 *   • Card fixed height ........... 476 px (featured + sides + latest grid)
 *   • Date / Read-time row ........ anchored to image-bottom (NOT card bottom)
 *   • Tag pill .................... H Regular 12 #FEAE00
 *   • Latest grid ................. 3 cols, gap 20/24, ALL cards 476 px tall
 */
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLang } from '../../i18n';
import Breadcrumbs from '../../components/public/Breadcrumbs';
import CatalogConsultationBlock from '../../components/public/catalog/CatalogConsultationBlock';
import styles from './BlogPage.module.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/* ------------------------------------------------------------------ data */
const CATEGORIES = [
  { id: 'all',      label: { en: 'ALL',             ru: 'ВСЕ' } },
  { id: 'analysis', label: { en: 'MARKET ANALYSIS', ru: 'АНАЛИЗ РЫНКА' } },
  { id: 'guides',   label: { en: 'IMPORT GUIDES',   ru: 'ИНСТРУКЦИИ' } },
  { id: 'news',     label: { en: 'NEWS',            ru: 'НОВОСТИ' } },
  { id: 'reviews',  label: { en: 'CAR REVIEWS',     ru: 'ОБЗОРЫ' } },
  { id: 'tips',     label: { en: 'AUCTION TIPS',    ru: 'СОВЕТЫ' } },
  { id: 'costs',    label: { en: 'COSTS',           ru: 'РАСХОДЫ' } },
];

const CATEGORY_TAG = {
  en: {
    analysis: 'MARKET ANALYSIS',
    guides:   'IMPORT GUIDES',
    news:     'NEWS',
    reviews:  'CAR REVIEWS',
    tips:     'AUCTION TIPS',
    costs:    'COSTS',
  },
  ru: {
    analysis: 'АНАЛИЗ РЫНКА',
    guides:   'ИНСТРУКЦИИ',
    news:     'НОВОСТИ',
    reviews:  'ОБЗОРЫ',
    tips:     'СОВЕТЫ',
    costs:    'РАСХОДЫ',
  },
};
const fallbackTag = (locale) => (locale === 'ru' ? 'НОВОСТИ' : 'NEWS');

/* Locale-aware date formatter — uses Russian month names when locale=ru. */
function formatDate(iso, locale) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const lc = locale === 'ru' ? 'ru-RU' : 'en-US';
    return d.toLocaleDateString(lc, { month: 'short', day: '2-digit', year: 'numeric' });
  } catch { return ''; }
}

/* Resolve backend image URL — prepend API_URL for /api/static/… paths. */
function resolveImage(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/')) return `${API_URL}${url}`;
  return url;
}

/* ------------------------------------------------------ tiny atoms ---- */
const ArrowRight = () => (
  <svg className={styles.readBtnArrow} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const BracketLeft  = () => <div className={styles.bracket} aria-hidden="true" />;
const BracketRight = () => <div className={`${styles.bracket} ${styles.bracketRight}`} aria-hidden="true" />;

/* ============================================================== page == */
export default function BlogPage() {
  const { lang } = useLang();
  const tLocale = lang === 'ru' ? 'ru' : 'en';
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  /* Initial slice of latest grid — 3 cards visible, "+3" per Show more click.
   * Mirrors the catalog "load more" pattern + matches the Figma reference
   * which shows the button immediately on first paint. */
  const [showCount, setShowCount] = useState(3);

  /* Scroll to top whenever the user lands on /blog. */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  /* Fetch published articles (server-side category filter avoids re-render
   * thrash). Limit 100 lets us paginate purely client-side. */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    axios
      .get(`${API_URL}/api/public/blog/articles`, {
        params: { lang: tLocale, category: activeCategory, limit: 100 },
      })
      .then((r) => {
        if (!alive) return;
        setArticles(r.data?.items || []);
        setShowCount(3);
      })
      .catch(() => { if (alive) setArticles([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tLocale, activeCategory]);

  /* Featured main + side stack + latest grid — all from the same response. */
  const featuredMain = articles[0] || null;
  const featuredSide = articles.slice(1, 3);
  const latestSource = articles.slice(3);
  const filteredLatest = useMemo(() => latestSource, [latestSource]);
  const visibleLatest = filteredLatest.slice(0, showCount);

  const breadcrumbT = {
    home: tLocale === 'ru' ? 'ГЛАВНАЯ' : 'HOME',
    blog: tLocale === 'ru' ? 'БЛОГ'    : 'BLOG',
  };

  const goSingle = (a) => navigate(`/blog/${a.slug || a.id}`);

  return (
    <div data-testid="blog-page" className={styles.page}>
      <div className={styles.container}>
        {/* ---------------------------------------------- HOME / BLOG -- */}
        <div className={styles.breadcrumb}>
          <Breadcrumbs items={[{ label: breadcrumbT.home, to: '/' }, { label: breadcrumbT.blog }]} />
        </div>

        {/* ---------------------------------------------- HERO TITLE -- */}
        <section className={styles.hero}>
          <div className={styles.heroTitleCol}>
            <div className={styles.heroTitleRow}>
              <span className={styles.titleWord}>{tLocale === 'ru' ? 'ИМПОРТ' : 'THE'}</span>
              <span className={`${styles.titleWord} ${styles.titleAccent}`}>
                {tLocale === 'ru' ? 'ИЗНУТРИ' : 'IMPORT'}
              </span>
            </div>
            <span className={styles.titleWord}>{tLocale === 'ru' ? 'INSIDER' : 'INSIDER'}</span>
          </div>

          <div className={styles.heroDescCol}>
            <div className={styles.bracketWrap}>
              <BracketLeft />
              {tLocale === 'ru' ? (
                <p className={styles.descText}>
                  <span className={styles.descFirst}>Экспертные обзоры покупки авто с аукционов Европы.</span><br />
                  Рыночная аналитика, пошаговые руководства и реальные<br />
                  истории импорта — всё, что нужно знать перед стартом.
                </p>
              ) : (
                <p className={styles.descText}>
                  <span className={styles.descFirst}>Expert insights on buying cars from German &amp; European auctions.</span><br />
                  Market analytics, step-by-step guides and real import<br />
                  stories – everything you need before making your move.
                </p>
              )}
              <BracketRight />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- FILTER PILLS -- */}
        <div className={styles.filters} role="tablist">
          {CATEGORIES.map((c) => {
            const isActive = activeCategory === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={isActive}
                className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
                onClick={() => setActiveCategory(c.id)}
                data-testid={`blog-filter-${c.id}`}
              >
                {c.label[tLocale]}
              </button>
            );
          })}
        </div>

        {/* ------------------------- FEATURED THIS WEEK header + divider */}
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>
            {tLocale === 'ru' ? 'ИЗБРАННОЕ НА ЭТОЙ НЕДЕЛЕ' : 'FEATURED THIS WEEK'}
          </div>
          <div className={styles.divider} aria-hidden="true" />
        </div>

        {/* ------------------------- FEATURED row (main + side stack) -- */}
        {loading ? (
          <div className={styles.loadingRow}>
            {tLocale === 'ru' ? 'Загрузка статей…' : 'Loading articles…'}
          </div>
        ) : !featuredMain ? (
          <div className={styles.emptyRow}>
            {tLocale === 'ru'
              ? 'Все още няма публикувани статии в тази категория.'
              : 'No published articles in this category yet.'}
          </div>
        ) : (
          <>
            <div className={styles.featuredRow}>
              {/* MAIN featured card */}
              <article
                className={styles.featuredCard}
                onClick={() => goSingle(featuredMain)}
                data-testid="blog-featured-main"
              >
                <img
                  className={styles.featuredImage}
                  src={resolveImage(featuredMain.cover_image_url) || '/figma/blog/image-15@2x.png'}
                  alt={featuredMain.title}
                  onError={(e) => { e.target.src = '/figma/blog/image-15@2x.png'; }}
                />
                <div className={styles.featuredInfo}>
                  <div className={styles.featuredTop}>
                    <span className={styles.tagPill}>{(CATEGORY_TAG[tLocale] || CATEGORY_TAG.en)[featuredMain.category] || fallbackTag(tLocale)}</span>
                    <h2 className={styles.featuredTitle}>{featuredMain.title}</h2>
                    <p className={styles.featuredExcerpt}>{featuredMain.excerpt}</p>
                  </div>
                  <div className={styles.featuredBottom}>
                    <div className={styles.dateRow}>
                      <span>{formatDate(featuredMain.published_at, tLocale)}</span>
                      <span className={styles.dot}>•</span>
                      <span className={styles.minRead}>
                        {featuredMain.read_time_minutes} {tLocale === 'ru' ? 'мин. чтения' : 'min read'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.readBtn}
                      onClick={(e) => { e.stopPropagation(); goSingle(featuredMain); }}
                    >
                      {tLocale === 'ru' ? 'ЧИТАТЬ' : 'READ ARTICLE'}
                      <ArrowRight />
                    </button>
                  </div>
                </div>
              </article>

              {/* SIDE 2 stacked cards */}
              <aside className={styles.featuredSide}>
                {featuredSide.map((card) => (
                  <article
                    key={card.id}
                    className={styles.sideCard}
                    onClick={() => goSingle(card)}
                    data-testid={`blog-featured-side-${card.id}`}
                  >
                    <div className={styles.sideCardHead}>
                      <span className={styles.tagPill}>{(CATEGORY_TAG[tLocale] || CATEGORY_TAG.en)[card.category] || fallbackTag(tLocale)}</span>
                      <div className={styles.dateRow}>
                        <span>{formatDate(card.published_at, tLocale)}</span>
                        <span className={styles.dot}>•</span>
                        <span className={styles.minRead}>
                          {card.read_time_minutes} {tLocale === 'ru' ? 'мин.' : 'min read'}
                        </span>
                      </div>
                    </div>
                    <h3 className={styles.sideCardTitle}>{card.title}</h3>
                    <p className={styles.sideCardExcerpt}>{card.excerpt}</p>
                  </article>
                ))}
              </aside>
            </div>

            {/* ---------------------------------------------- LATEST ARTICLES */}
            {filteredLatest.length > 0 && (
              <div className={styles.latestRow}>
                <div className={styles.sectionHeader} style={{ paddingTop: 0 }}>
                  <div className={styles.sectionLabel}>
                    {tLocale === 'ru' ? 'ПОСЛЕДНИЕ СТАТЬИ' : 'LATEST ARTICLES'}
                  </div>
                  <div className={styles.divider} aria-hidden="true" />
                </div>

                <div className={styles.latestGrid}>
                  {visibleLatest.map((a) => (
                    <article
                      key={a.id}
                      className={styles.gridCard}
                      onClick={() => goSingle(a)}
                      data-testid={`blog-card-${a.id}`}
                    >
                      <img
                        className={styles.gridImg}
                        src={resolveImage(a.cover_image_url) || '/figma/blog/image-151@2x.png'}
                        alt={a.title}
                        onError={(e) => { e.target.src = '/figma/blog/image-151@2x.png'; }}
                      />
                      <div className={styles.gridMeta}>
                        <span className={styles.tagPill}>{(CATEGORY_TAG[tLocale] || CATEGORY_TAG.en)[a.category] || fallbackTag(tLocale)}</span>
                        <div className={styles.dateRow}>
                          <span>{formatDate(a.published_at, tLocale)}</span>
                          <span className={styles.dot}>•</span>
                          <span className={styles.minRead}>
                            {a.read_time_minutes} {tLocale === 'ru' ? 'мин.' : 'min read'}
                          </span>
                        </div>
                      </div>
                      <h3 className={styles.gridTitle}>{a.title}</h3>
                      <p className={styles.gridExcerpt}>{a.excerpt}</p>
                    </article>
                  ))}
                </div>

                {/* SHOW MORE button:
                 * Always render when there is at least one card in the latest
                 * grid — this keeps the layout/spacing consistent with the
                 * Figma reference even on small datasets.  When everything is
                 * already visible the button becomes a no-op visual element
                 * (still navigates to the consultation block when clicked). */}
                {filteredLatest.length > 0 && (
                  <div className={styles.showMoreWrap}>
                    <button
                      className={styles.showMore}
                      type="button"
                      onClick={() => {
                        if (visibleLatest.length < filteredLatest.length) {
                          setShowCount((n) => n + 3);
                        }
                      }}
                      disabled={visibleLatest.length >= filteredLatest.length}
                      data-testid="blog-show-more"
                    >
                      {tLocale === 'ru' ? 'ПОКАЗАТЬ ЕЩЁ +' : 'SHOW MORE +'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------
       *   Free consultation block — re-uses the exact same component the
       *   catalog page uses (single source of truth for the lead form).
       *   Wrapper enforces the spacing spec from the user:
       *     • SHOW MORE button bottom  → block top = 274 px
       *     • Block bottom             → footer top = 161 px (baked into
       *       CatalogConsultationBlock's own bottom padding)
       *   Submits to POST /api/public/leads/quick → lands in admin manager
       *   pipeline (same as catalog / single-car / contacts).
       * -----------------------------------------------------------------*/}
      <div className={styles.consultWrap} data-testid="blog-consult-wrap">
        <CatalogConsultationBlock />
      </div>
    </div>
  );
}
