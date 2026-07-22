import { useEffect, useRef, useState } from 'react';

// A stat that counts up from 0 to `value` (easeOutCubic) the first time it
// scrolls into view — preserving decimals + suffix, in gradient tabular figures.
export default function CountUpStat({
  value,
  suffix = '',
  decimals = 0,
  label,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fmt = (v: number): string => v.toFixed(decimals) + suffix;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      setDisplay(fmt(value));
      return undefined;
    }
    let raf = 0;
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          obs.unobserve(e.target);
          const start = performance.now();
          const tick = (now: number): void => {
            const p = Math.min((now - start) / 1400, 1);
            setDisplay(fmt(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, suffix, decimals]);

  return (
    <div className="stat reveal">
      <span ref={ref} className="stat__value grad-text">
        {display}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
