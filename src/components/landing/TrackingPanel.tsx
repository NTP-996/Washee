import { useEffect, useRef } from 'react';
import type { LandingCopy } from './copy';

// The faux live-tracking panel: an abstract map with a washer travelling the
// route, a live ETA countdown, and a progressively-completing status feed. The
// route line draws via CSS once revealed; the dot/ETA/feed run on a rAF loop
// that only ticks while the panel is on screen. Static under reduced motion.
export default function TrackingPanel({ c }: { c: LandingCopy }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const etaRef = useRef<HTMLElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const path = pathRef.current;
    const dot = dotRef.current;
    const etaEl = etaRef.current;
    const feedWrap = feedRef.current;
    if (!panel || !path || !dot || !feedWrap) return undefined;

    const feed = Array.from(feedWrap.querySelectorAll('p'));
    const len = path.getTotalLength();
    const placeDot = (t: number): void => {
      const pt = path.getPointAtLength(t * len);
      dot.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      placeDot(0.62);
      if (etaEl) etaEl.textContent = '4';
      feed.forEach((p) => p.classList.add('is-done'));
      return undefined;
    }

    let raf = 0;
    let startTs: number | null = null;
    let running = false;
    const loopMs = 9000;
    const frame = (ts: number): void => {
      if (startTs === null) startTs = ts;
      const t = ((ts - startTs) % loopMs) / loopMs;
      placeDot(t);
      if (etaEl) etaEl.textContent = String(Math.max(1, 7 - Math.floor(t * 7)));
      feed.forEach((p, i) => p.classList.toggle('is-done', t > (i + 1) / (feed.length + 1)));
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting && !running) {
            running = true;
            startTs = null;
            raf = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        }),
      { threshold: 0.2 },
    );
    io.observe(panel);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={panelRef} className="tracking__panel reveal" role="img" aria-label={c.track_panel_aria}>
      <div className="map" aria-hidden="true">
        <div className="map__grid" />
        <svg className="map__svg" viewBox="0 0 420 320" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9FE5F9" />
              <stop offset="1" stopColor="#3C9FF6" />
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            className="map__route"
            pathLength={1}
            d="M48,272 C120,250 120,150 200,150 C280,150 300,90 372,64"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle className="map__home" cx={372} cy={64} r={7} />
          <g ref={dotRef} className="map__washer" transform="translate(48 272)">
            <circle r={9} />
            <circle r={9} className="map__washer-ping" />
          </g>
        </svg>
      </div>

      <div className="track-card" aria-hidden="true">
        <div className="track-card__row">
          <div className="track-card__avatar">M</div>
          <div>
            <strong>Minh T.</strong>
            <span className="track-card__meta">{c.track_meta}</span>
          </div>
          <div className="track-card__eta">
            <em ref={etaRef}>7</em>
            <span>{c.track_eta_unit}</span>
          </div>
        </div>
        <div className="track-card__feed" ref={feedRef}>
          <p>{c.track_feed1}</p>
          <p>{c.track_feed2}</p>
          <p>{c.track_feed3}</p>
        </div>
      </div>
    </div>
  );
}
