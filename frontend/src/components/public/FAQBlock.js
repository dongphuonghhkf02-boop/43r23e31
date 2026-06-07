import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const FAQS = [
  {
    q: 'How to choose and buy a car from Germany?',
    a:
      'Send us a VIN, a Mobile.de / BCA Europe lot link or simply the model you want. Our agents pull inspection photos, AutoDNA history and dealer documentation, give you a turnkey quote and bid live on auction day — you approve the final bid before we pay.',
  },
  {
    q: 'Where do you ship to?',
    a:
      'By default we deliver turnkey to Belarus and Russia (Minsk / Moscow / regions, registration included). We also organize delivery across the EU and to Ukraine / Kazakhstan / Georgia on request.',
  },
  {
    q: 'How long will it take for my order to arrive?',
    a:
      'From Germany: 1–3 weeks (auction win → MILD hub consolidation → road transport across Europe → customs → keys in Belarus or Russia). From neighbouring EU countries: 5–10 days. From the Alpine region: 1–2 weeks. You see every checkpoint live in your personal dashboard.',
  },
  {
    q: 'How do I change or cancel my order?',
    a:
      'Before the auction bid is placed — cancellation is free. After the car is won, cancellation depends on the auction rules (usually a 10–15% relist fee). Our manager will always present the exact numbers before you confirm anything.',
  },
  {
    q: 'How can I track my order?',
    a:
      'Every DM Auto client gets a personal dashboard with a milestone timeline, photos from the inspection point, road tracking ETA, customs status and registration progress — plus Telegram and WhatsApp notifications at every step.',
  },
];

export default function FAQBlock() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-[var(--bg-base)] py-24" data-testid="faq-section">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-[100px]">
        <h2
          className="font-bold uppercase text-[var(--accent-brand)] text-center mb-16 leading-none"
          style={{ fontSize: 'clamp(34px, 4.2vw, 64px)' }}
        >
          FAQ
        </h2>

        <div className="max-w-[1100px] mx-auto">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`border-b border-[var(--border-subtle)] ${i === 0 ? 'border-t' : ''}`}
                data-testid={`faq-item-${i}`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-6 py-6 md:py-7 text-left group"
                  data-testid={`faq-toggle-${i}`}
                >
                  <span className="text-[14px] md:text-[15px] text-[var(--accent-brand)] font-medium min-w-[36px]">
                    {i + 1}/
                  </span>
                  <span
                    className={`flex-1 text-[16px] md:text-[20px] font-medium transition-colors ${
                      isOpen ? 'text-[var(--accent-brand)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent-brand)]'
                    }`}
                  >
                    {f.q}
                  </span>
                  <span
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isOpen
                        ? 'bg-[var(--accent-brand)] border-[var(--accent-brand)] text-black rotate-180'
                        : 'border-[var(--accent-brand)]/50 text-[var(--accent-brand)]'
                    }`}
                  >
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-7' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-[14px] md:text-[15px] text-[var(--text-secondary)] leading-relaxed pl-[52px] pr-[60px] max-w-[900px]">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
