/**
 * ContactsPage — DM Auto Contacts, V7 (2026-06-07).
 *
 * Полностью переписан без Болгарии / карты / физического офиса.
 * Дизайн строго в стиле Welcome (figma_home):
 *   • Cream-фон (#F5F0E8), navy текст (#0F1729), amber акценты (#FEAE00).
 *   • Editorial hero с amber-kicker `// ОНЛАЙН-СЕРВИС`.
 *   • 4 канальных карточки (WhatsApp / Telegram / Phone / Email).
 *   • Блок "Почему так удобнее" — 3 преимущества.
 *   • Footer-CTA c кнопкой "Связаться с нами" → GetInTouchModal.
 */

import React from 'react';
import PageHero from '../../components/public/PageHero';
import LeadCtaBand from '../../components/public/LeadCtaBand';
import { useLang } from '../../i18n';
import {
  WhatsappLogo,
  TelegramLogo,
  Phone,
  EnvelopeSimple,
  Clock,
  Lightning,
  ShieldCheck,
  Headset,
  ArrowUpRight,
} from '@phosphor-icons/react';
import './ContactsPage.css';

// ── Конфигурация контактов (правится в одном месте) ───────────────────
const CONTACTS = {
  whatsappPhone: '+375291234567',     // E.164 без пробелов — для wa.me
  whatsappLabel: '+375 29 123 45 67',
  telegram: 'dm_auto_support',         // без @
  phone: '+375291234567',
  phoneLabel: '+375 29 123 45 67',
  email: 'info@dm-auto.online',
};

const T = {
  ru: {
    home: 'ГЛАВНАЯ',
    crumb: 'контакты',
    title: 'контакты',

    kicker: '// Онлайн-сервис',
    headline: 'Свяжитесь с нами\nудобным способом.',
    subline:
      'Мы работаем по Беларуси и России. Команда на связи 24/7 — пишите в любой мессенджер, звоните по телефону или отправляйте email.',

    channelsKicker: '// Каналы связи',
    channelsTitle: 'Выберите, где вам удобнее',
    channelsSubline:
      'Любой из каналов ниже ведёт к одному и тому же менеджеру — ответим в первом, в котором напишете.',

    waTitle: 'WhatsApp',
    waHint: 'Самый быстрый канал — обычно отвечаем за 5–10 минут.',
    waCta: 'Открыть WhatsApp',

    tgTitle: 'Telegram',
    tgHint: 'Удобно скидывать ссылки на машины и обмениваться файлами.',
    tgCta: 'Открыть Telegram',

    phoneTitle: 'Телефон',
    phoneHint: 'Звоните или отправьте SMS — линия доступна круглосуточно.',
    phoneCta: 'Позвонить',

    emailTitle: 'Email',
    emailHint: 'Для развёрнутых вопросов и пересылки документов.',
    emailCta: 'Написать письмо',

    advKicker: '// Почему так удобно',
    advTitle: 'Всё онлайн — быстро,\nпрозрачно и под контролем.',
    advSubline:
      'Подбор автомобиля, расчёт, договор и доставка — каждый шаг ведётся в одной заявке. Вы видите процесс, мы держим сроки.',

    adv1Title: 'Ответ за 15 минут',
    adv1Text: 'SLA по первому ответу — 15 минут в рабочее время, не дольше часа ночью.',

    adv2Title: 'Связь 24/7',
    adv2Text: 'Менеджеры на связи каждый день, без выходных и обеденных перерывов.',

    adv3Title: 'Без скрытых комиссий',
    adv3Text: 'Все расчёты, договоры и платежи — фиксируем в одной заявке. Никаких сюрпризов на финале.',

    hoursLabel: 'Режим работы',
    hoursValue: 'Пн–Вс · 24/7',
    regionsLabel: 'Регионы работы',
    regionsValue: 'Беларусь · Россия',
    responseLabel: 'Скорость ответа',
    responseValue: 'до 15 минут',

    ctaKicker: '// Готовы к следующему шагу?',
    ctaTitle: 'Расскажите, какой автомобиль вы ищете.',
    ctaText:
      'Оставьте заявку — менеджер свяжется в течение 15 минут, подберёт варианты и рассчитает стоимость под ключ.',
    ctaBtn: 'Связаться с нами',
  },
  en: {
    home: 'HOME',
    crumb: 'contacts',
    title: 'contacts',

    kicker: '// Online service',
    headline: 'Reach out — pick\nyour favourite channel.',
    subline:
      'We work across Belarus and Russia. The team is online 24/7 — ping us on any messenger, call by phone, or send an email.',

    channelsKicker: '// Contact channels',
    channelsTitle: 'Choose what works for you',
    channelsSubline:
      'Every channel below goes to the same manager — we will reply on the first one you reach us at.',

    waTitle: 'WhatsApp',
    waHint: 'The fastest channel — usually under 10 minutes.',
    waCta: 'Open WhatsApp',

    tgTitle: 'Telegram',
    tgHint: 'Handy for sharing auction links and files.',
    tgCta: 'Open Telegram',

    phoneTitle: 'Phone',
    phoneHint: 'Call or text — the line is open around the clock.',
    phoneCta: 'Call now',

    emailTitle: 'Email',
    emailHint: 'For detailed questions and paperwork.',
    emailCta: 'Send email',

    advKicker: '// Why it works',
    advTitle: 'Fully online — fast,\ntransparent and on track.',
    advSubline:
      'Car selection, quotes, contract and delivery — every step lives inside one request. You see the progress, we hold the deadlines.',

    adv1Title: 'Reply in 15 min',
    adv1Text: 'First-response SLA is 15 minutes during the day, under an hour at night.',

    adv2Title: 'Available 24/7',
    adv2Text: 'Managers online every day, with no off-hours and no lunch breaks.',

    adv3Title: 'No hidden fees',
    adv3Text: 'All quotes, contracts and payments stay inside one request. No surprises at closing.',

    hoursLabel: 'Working hours',
    hoursValue: 'Mon–Sun · 24/7',
    regionsLabel: 'Regions',
    regionsValue: 'Belarus · Russia',
    responseLabel: 'Response time',
    responseValue: 'within 15 min',

    ctaKicker: '// Ready for the next step?',
    ctaTitle: 'Tell us which car you are looking for.',
    ctaText:
      'Drop a request — our manager will get back within 15 minutes, suggest options and quote the full under-key price.',
    ctaBtn: 'Get in touch',
  },
};

// ── Каналы связи ───────────────────────────────────────────────────────
function buildChannels(t) {
  const phoneClean = CONTACTS.whatsappPhone.replace(/\D/g, '');
  return [
    {
      key: 'whatsapp',
      Icon: WhatsappLogo,
      title: t.waTitle,
      hint: t.waHint,
      value: CONTACTS.whatsappLabel,
      cta: t.waCta,
      href: `https://wa.me/${phoneClean}`,
      external: true,
      accent: 'green',
    },
    {
      key: 'telegram',
      Icon: TelegramLogo,
      title: t.tgTitle,
      hint: t.tgHint,
      value: `@${CONTACTS.telegram}`,
      cta: t.tgCta,
      href: `https://t.me/${CONTACTS.telegram}`,
      external: true,
      accent: 'blue',
    },
    {
      key: 'phone',
      Icon: Phone,
      title: t.phoneTitle,
      hint: t.phoneHint,
      value: CONTACTS.phoneLabel,
      cta: t.phoneCta,
      href: `tel:${CONTACTS.phone}`,
      external: false,
      accent: 'navy',
    },
    {
      key: 'email',
      Icon: EnvelopeSimple,
      title: t.emailTitle,
      hint: t.emailHint,
      value: CONTACTS.email,
      cta: t.emailCta,
      href: `mailto:${CONTACTS.email}`,
      external: false,
      accent: 'amber',
    },
  ];
}

// ── Editorial section header ───────────────────────────────────────────
function SectionHead({ kicker, title, subline }) {
  return (
    <header className="bibi-c2-head">
      <div className="bibi-c2-kicker">{kicker}</div>
      <h2 className="bibi-c2-title" style={{ whiteSpace: 'pre-line' }}>{title}</h2>
      {subline ? <p className="bibi-c2-subline">{subline}</p> : null}
    </header>
  );
}

// ── Channel card ───────────────────────────────────────────────────────
function ChannelCard({ ch }) {
  const Icon = ch.Icon;
  return (
    <a
      href={ch.href}
      target={ch.external ? '_blank' : undefined}
      rel={ch.external ? 'noreferrer noopener' : undefined}
      className={`bibi-c2-channel bibi-c2-channel--${ch.accent}`}
      data-testid={`contacts-channel-${ch.key}`}
    >
      <div className="bibi-c2-channel__top">
        <span className="bibi-c2-channel__icon" aria-hidden="true">
          <Icon size={26} weight="duotone" />
        </span>
        <span className="bibi-c2-channel__ext" aria-hidden="true">
          <ArrowUpRight size={18} weight="bold" />
        </span>
      </div>
      <h3 className="bibi-c2-channel__title">{ch.title}</h3>
      <p className="bibi-c2-channel__hint">{ch.hint}</p>
      <div className="bibi-c2-channel__value">{ch.value}</div>
      <div className="bibi-c2-channel__cta">{ch.cta}</div>
    </a>
  );
}

// ── Advantage card ─────────────────────────────────────────────────────
function AdvCard({ Icon, title, text }) {
  return (
    <div className="bibi-c2-adv">
      <span className="bibi-c2-adv__icon" aria-hidden="true">
        <Icon size={24} weight="duotone" />
      </span>
      <h4 className="bibi-c2-adv__title">{title}</h4>
      <p className="bibi-c2-adv__text">{text}</p>
    </div>
  );
}

// Final CTA is handled by the global footer's hero band ("Привезём авто
// мечты с аукциона до ключей.") — see Footer1 in /figma_home. We do NOT
// render an extra CTA on this page to avoid a duplicate.

// ── Main page ──────────────────────────────────────────────────────────
export default function ContactsPage() {
  const { lang } = useLang();
  const t = lang === 'ru' ? T.ru : T.en;
  const channels = buildChannels(t);

  return (
    <div className="bibi-c2-page" data-testid="contacts-page">
      <PageHero
        home={t.home}
        crumbs={[{ label: t.crumb }]}
        title={t.title}
        testId="contacts-hero"
        className="bibi-contacts-hero"
      />

      <div className="bibi-c2-container">
        {/* HERO BLOCK */}
        <section className="bibi-c2-hero">
          <SectionHead
            kicker={t.kicker}
            title={t.headline}
            subline={t.subline}
          />

          {/* Quick facts strip */}
          <div className="bibi-c2-facts">
            <div className="bibi-c2-fact">
              <Clock size={20} weight="duotone" className="bibi-c2-fact__icon" />
              <div>
                <div className="bibi-c2-fact__label">{t.hoursLabel}</div>
                <div className="bibi-c2-fact__value">{t.hoursValue}</div>
              </div>
            </div>
            <div className="bibi-c2-fact">
              <Lightning size={20} weight="duotone" className="bibi-c2-fact__icon" />
              <div>
                <div className="bibi-c2-fact__label">{t.responseLabel}</div>
                <div className="bibi-c2-fact__value">{t.responseValue}</div>
              </div>
            </div>
            <div className="bibi-c2-fact">
              <Headset size={20} weight="duotone" className="bibi-c2-fact__icon" />
              <div>
                <div className="bibi-c2-fact__label">{t.regionsLabel}</div>
                <div className="bibi-c2-fact__value">{t.regionsValue}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CHANNELS GRID */}
        <section className="bibi-c2-channels-section">
          <SectionHead
            kicker={t.channelsKicker}
            title={t.channelsTitle}
            subline={t.channelsSubline}
          />
          <div className="bibi-c2-channels-grid">
            {channels.map((ch) => (
              <ChannelCard key={ch.key} ch={ch} />
            ))}
          </div>
        </section>

        {/* ADVANTAGES */}
        <section className="bibi-c2-adv-section">
          <SectionHead
            kicker={t.advKicker}
            title={t.advTitle}
            subline={t.advSubline}
          />
          <div className="bibi-c2-adv-grid">
            <AdvCard Icon={Lightning} title={t.adv1Title} text={t.adv1Text} />
            <AdvCard Icon={Clock} title={t.adv2Title} text={t.adv2Text} />
            <AdvCard Icon={ShieldCheck} title={t.adv3Title} text={t.adv3Text} />
          </div>
        </section>

        {/* Final CTA — page-specific lead band (twin of SingleCarPage). */}
      </div>

      <LeadCtaBand
        source="contacts_page"
        titleRu="Не нашли удобный канал?"
        titleEn="Didn't find a convenient channel?"
        textRu="Оставьте заявку прямо здесь — менеджер сам выберет, куда вам написать (WhatsApp / Telegram / email) и свяжется в течение 15 минут."
        textEn="Drop a request right here — the manager will pick the channel for you (WhatsApp / Telegram / email) and reach out within 15 minutes."
        ctaRu="Связаться с менеджером"
        ctaEn="Contact the manager"
        testId="contacts-lead-cta"
      />
    </div>
  );
}
