import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, MessageSquare, Search, Ship, Car } from 'lucide-react';

// Partner brands per region (textual chips for a cleaner variant look)
const PARTNERS = {
  germany: ['Mobile.de', 'Autobid.de', 'BCA Europe', 'AutoScout24'],
  benelux: ['Openlane', 'BCA Benelux', 'CarNext'],
  alpine:  ['Mobile.ch', 'AutoScout24', 'BCA Italy'],
};

const STEPS = [
  {
    n: 1,
    icon: FileText,
    title: 'Send an application',
    text: 'Drop a VIN, a lot link or just the model you want. We pick it up instantly in the dashboard.',
  },
  {
    n: 2,
    icon: MessageSquare,
    title: 'Discuss the details',
    text: 'Budget, timing, shipping lane and spec preferences. You get a locked turnkey quote.',
  },
  {
    n: 3,
    icon: Search,
    title: 'We source & buy',
    text: 'Real-time bidding on our side, inspection reports in yours. We win the lot and pay it out.',
  },
  {
    n: 4,
    icon: Ship,
    title: 'Customs + keys (BY / RU)',
    text: 'Sea freight to a European port, customs clearance, adaptation, registration — you just drive.',
  },
];

const RegionBlock = ({ label, partners, accent = false }) => (
  <div
    className={`rounded-md border ${
      accent ? 'border-[var(--accent-brand)]' : 'border-[var(--border-default)]'
    } p-6 bg-[var(--bg-elevated)] relative overflow-hidden`}
  >
    {accent && (
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(22, 46, 81, 0.18) 0%, transparent 65%)',
        }}
      />
    )}
    <div className="flex items-center gap-3 mb-5">
      <span className="w-2 h-2 rounded-full bg-[var(--accent-brand)]" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">from</span>
    </div>
    <div className="text-[26px] md:text-[32px] font-bold text-[var(--text-primary)] uppercase leading-none mb-5">
      {label}
    </div>
    <div className="flex flex-wrap gap-2">
      {partners.map((p) => (
        <span
          key={p}
          className="text-[11px] px-3 py-1.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-default)] text-[var(--text-secondary)] uppercase tracking-wider"
        >
          {p}
        </span>
      ))}
    </div>
  </div>
);

export default function HowToBuyTurnkeyBlock() {
  return (
    <section
      className="relative bg-[var(--bg-base)] py-24 overflow-hidden"
      data-testid="how-to-buy-turnkey-section"
    >
      {/* Decorative dashed road line (centered, vertical) */}
      <div
        className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none"
        aria-hidden="true"
        style={{
          width: 2,
          backgroundImage:
            'repeating-linear-gradient(to bottom, #FEAE00 0, #FEAE00 12px, transparent 12px, transparent 28px)',
          opacity: 0.25,
        }}
      />

      <div className="max-w-[1920px] mx-auto px-6 lg:px-[100px] relative">
        {/* Heading */}
        <div className="relative flex flex-col items-center mb-16">
          <h2
            className="font-bold uppercase text-center leading-[1.02]"
            style={{ fontSize: 'clamp(34px, 4.2vw, 64px)' }}
          >
            <span className="block text-[var(--accent-brand)]">How to buy</span>
            <span className="block text-[var(--text-primary)]">A turnkey car</span>
          </h2>
          <div className="lg:absolute lg:right-0 lg:top-3 flex items-stretch gap-3 mt-6 lg:mt-0 max-w-[380px]">
            <span className="text-[var(--accent-brand)] text-[28px] leading-none font-light select-none">[</span>
            <p className="text-[12px] md:text-[13px] uppercase tracking-[0.06em] leading-snug">
              <span className="text-[var(--accent-brand)]">Three origins.</span>
              <br />
              <span className="text-[var(--text-primary)]">One turnkey price to Belarus / Russia.</span>
            </p>
            <span className="text-[var(--accent-brand)] text-[28px] leading-none font-light select-none">]</span>
          </div>
        </div>

        {/* ===== REGIONS ROW ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          <RegionBlock label="Germany" partners={PARTNERS.germany} accent />
          <RegionBlock label="Benelux"  partners={PARTNERS.benelux} />
          <RegionBlock label="Alpine"   partners={PARTNERS.alpine} />
        </div>

        {/* Centered decorative small car icon */}
        <div className="flex justify-center mb-10">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-brand)] flex items-center justify-center">
            <Car size={22} className="text-black" />
          </div>
        </div>

        {/* ===== STEPS TIMELINE — horizontal, 4 items ===== */}
        <div className="relative">
          {/* Connector line */}
          <div
            className="hidden lg:block absolute top-6 left-[8%] right-[8%] h-[2px]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, #FEAE00 0, #FEAE00 10px, transparent 10px, transparent 22px)',
              opacity: 0.4,
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="text-center px-2">
                  {/* Step node */}
                  <div className="relative mx-auto w-12 h-12 rounded-full border-2 border-[var(--accent-brand)] bg-[var(--bg-base)] flex items-center justify-center mb-5">
                    <Icon size={18} className="text-[var(--accent-brand)]" />
                  </div>
                  <div className="text-[13px] uppercase tracking-[0.18em] text-[var(--accent-brand)] mb-3">
                    {s.n}/ Step
                  </div>
                  <h4 className="text-[18px] md:text-[20px] font-bold text-[var(--text-primary)] uppercase leading-tight mb-3">
                    {s.title}
                  </h4>
                  <p className="text-[13px] md:text-[14px] text-[var(--text-muted)] leading-relaxed max-w-[260px] mx-auto">
                    {s.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== CTA ROW ===== */}
        <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-6">
          <Link
            to="/contacts"
            className="btn-amber h-[56px] px-14 text-[15px]"
            data-testid="turnkey-pick-up-cta"
          >
            Pick up a car
            <ArrowRight size={16} />
          </Link>

          <a
            href="https://t.me/dmauto_official"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-4 px-6 h-[56px] rounded-md border border-[var(--border-default)] bg-[var(--bg-elevated)] hover:border-[var(--accent-brand)]/60 transition-colors"
            data-testid="turnkey-telegram-join"
          >
            <span className="text-left leading-tight">
              <span className="block text-[13px] text-[var(--text-primary)] uppercase tracking-wider">
                Join our Telegram channel
              </span>
              <span className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                fresh deals & direct chat with the team
              </span>
            </span>
            <span className="w-10 h-10 rounded-full bg-[var(--accent-brand)] flex items-center justify-center">
              <img
                src="/figma/ic-round-telegram.svg"
                alt=""
                aria-hidden="true"
                className="w-5 h-5 brightness-0 invert"
              />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
