/**
 * BeforeAndAfterHeading — banner heading shown above the BeforeAfter slider.
 * Matches Figma: "Before and after" white + "our clients receive" / "the best service"
 * white-and-amber stack, with an amber bracket frame on each side.
 */
import React from 'react';

export default function BeforeAndAfterHeading() {
  return (
    <section className="bg-[var(--bg-base)] text-[var(--text-primary)] pt-16 pb-6" data-testid="before-and-after-heading">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-[100px] grid md:grid-cols-2 items-center gap-10">
        <h2
          className="font-[Mazzard] font-bold tracking-tight"
          style={{ fontSize: 'clamp(34px, 4.4vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.01em' }}
        >
          <span className="text-[var(--accent-brand)] mr-2">[</span>
          Before and after
          <span className="text-[var(--accent-brand)] ml-2">]</span>
        </h2>
        <p
          className="font-[Mazzard] tracking-tight text-[var(--text-primary)]/85"
          style={{ fontSize: 'clamp(22px, 2.4vw, 38px)', lineHeight: 1.15 }}
        >
          our clients receive <br />
          <span className="text-[var(--accent-brand)] font-semibold">the best service</span>
        </p>
      </div>
    </section>
  );
}
