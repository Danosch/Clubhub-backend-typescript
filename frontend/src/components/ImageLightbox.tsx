import React, { useEffect, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

export default function ImageLightbox({ src, alt, onClose }: Props) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(3, s + 0.1));
      if (e.key === '-' || e.key === '_') setScale(s => Math.max(0.5, s - 0.1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onWheel: React.WheelEventHandler = (e) => {
    // Do not call preventDefault() to avoid passive listener warnings.
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(3, Math.max(0.5, s + delta)));
  };

  // Prevent background page from scrolling while the lightbox is open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center overscroll-contain touch-none"
      onClick={onClose}
      aria-modal
      role="dialog"
    >
      <button
        aria-label="Close image"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded text-white/90 hover:text-white hover:bg-white/10"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 text-white/90">
        <button
          aria-label="Zoom out"
          className="p-2 rounded bg-white/10 hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(0.5, s - 0.1)); }}
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          aria-label="Zoom in"
          className="p-2 rounded bg-white/10 hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(3, s + 0.1)); }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="relative z-0 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()} onWheel={onWheel}>
        <img
          src={src}
          alt={alt}
          className="block max-w-full max-h-[90vh] object-contain select-none"
          style={{ transform: `scale(${scale})`, transition: 'transform 120ms ease' }}
          draggable={false}
        />
      </div>
    </div>
  );
}
