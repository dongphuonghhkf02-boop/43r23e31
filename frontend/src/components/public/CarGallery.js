import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

const fallback = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1800&q=80';

export const CarGallery = ({ images = [] }) => {
  const list = (images && images.length > 0) ? images : [fallback, fallback, fallback, fallback, fallback, fallback, fallback];
  const [active, setActive] = useState(0);
  const thumbs = list.slice(0, 7);
  return (
    <div className="grid grid-cols-1 gap-4" data-testid="car-gallery">
      <img src={list[active] || fallback} onError={(e) => { e.currentTarget.src = fallback; }} alt="Vehicle" className="w-full h-[380px] md:h-[540px] object-cover rounded" data-testid="car-gallery-main" />
      <div className="grid grid-cols-4 gap-4">
        {thumbs.map((src, i) => (
          <button key={i} onClick={() => setActive(i)} className={`aspect-[4/3] rounded overflow-hidden border ${active === i ? 'border-[var(--accent-brand)]' : 'border-transparent'}`} data-testid={`car-gallery-thumb-${i}`}>
            <img src={src} onError={(e) => { e.currentTarget.src = fallback; }} alt={`Thumb ${i}`} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
        <button className="aspect-[4/3] rounded bg-[var(--bg-elevated)] border border-[var(--border-default)] flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-brand)] hover:border-[var(--accent-brand)] transition-colors" data-testid="car-gallery-all-images">
          <ImageIcon size={24} />
          <span className="text-[12px] uppercase">All images</span>
        </button>
      </div>
    </div>
  );
};

export default CarGallery;
