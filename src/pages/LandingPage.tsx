import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../lib/i18n';
import { LANDING, TIER_PRICE } from '../components/landing/copy';
import Hero3D from '../components/landing/Hero3D';
import TrackingPanel from '../components/landing/TrackingPanel';
import CountUpStat from '../components/landing/CountUpStat';
import '../landing.css';

export default function LandingPage() {
  const { user } = useAuth();
  const { lang, setLang } = useI18n();
  const c = LANDING[lang];
  const bookTo = user ? '/booking' : '/signup';

  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cur, setCur] = useState<'vnd' | 'usd'>(() =>
    localStorage.getItem('washee.currency') === 'usd' ? 'usd' : 'vnd',
  );
  const setCurrency = (v: 'vnd' | 'usd'): void => {
    localStorage.setItem('washee.currency', v);
    setCur(v);
  };

  // Nav glassifies once scrolled past the hero lip.
  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Drive the html[lang] hook the CSS uses to relax Vietnamese line-heights.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'vi' ? 'washee — Xe của bạn, rửa sạch ngay tại chỗ' : 'washee — Your car, washed where it stands';
  }, [lang]);

  // Scroll-reveal — one-shot per element, disabled under reduced motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const targets = root.querySelectorAll('.reveal, .hero__title');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries, obs) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Ambient cursor glow (desktop, fine pointer, motion OK).
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return undefined;
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return undefined;
    let gx = 0;
    let gy = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    glow.classList.add('is-on');
    const move = (): void => {
      cx += (gx - cx) * 0.15;
      cy += (gy - cy) * 0.15;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5 ? requestAnimationFrame(move) : 0;
    };
    const onMove = (e: MouseEvent): void => {
      gx = e.clientX;
      gy = e.clientY;
      if (!raf) raf = requestAnimationFrame(move);
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Close the mobile sheet on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const navLinks: [string, string][] = [
    ['#how', c.nav_how],
    ['#tracking', c.nav_tracking],
    ['#tiers', c.nav_tiers],
    ['#washers', c.nav_washers],
  ];
  const marquee = [c.mq_washes, c.mq_cities, c.mq_rating, c.mq_washers, c.mq_cashless, c.mq_gps];
  const dead = (e: { preventDefault(): void }): void => e.preventDefault();

  return (
    <div ref={rootRef}>
      <div className="cursor-glow" aria-hidden="true" ref={glowRef} />

      {/* ---- NAV ---- */}
      <header className={`nav${scrolled ? ' is-scrolled' : ''}`} id="nav">
        <div className="container nav__inner">
          <a className="nav__brand" href="#top" aria-label="washee home">
            <img className="nav__mark" src="/washee-mark.svg" alt="" width={34} height={34} />
            <span className="nav__wordmark">washee</span>
          </a>

          <nav className="nav__links" aria-label="Primary">
            {navLinks.map(([href, label]) => (
              <a key={href} href={href}>
                {label}
              </a>
            ))}
          </nav>

          <div className="nav__actions">
            <div className="lang" role="group" aria-label="Language / Ngôn ngữ">
              {(['en', 'vi'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`lang-btn${lang === l ? ' is-on' : ''}`}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <Link className="btn btn--ghost nav__signin" to="/login">
              {c.nav_signin}
            </Link>
            <Link className="btn btn--primary btn--sm magnetic" to={bookTo}>
              {c.cta_book}
            </Link>
            <button
              className="nav__burger"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobileMenu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className="mobile-menu" id="mobileMenu" hidden={!mobileOpen}>
        {navLinks.map(([href, label]) => (
          <a key={href} href={href} onClick={() => setMobileOpen(false)}>
            {label}
          </a>
        ))}
        <Link className="btn btn--primary" to={bookTo} onClick={() => setMobileOpen(false)}>
          {c.cta_book}
        </Link>
      </div>

      <main id="top">
        {/* ---- HERO ---- */}
        <section className="hero" id="hero">
          <div className="hero__aura" aria-hidden="true" />
          <Hero3D />

          <div className="container hero__inner">
            <span className="mstripe hero__stripe reveal" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="eyebrow reveal">
              <i className="dot" /> <span>{c.hero_eyebrow}</span>
            </span>

            <h1 className="hero__title">
              <span className="reveal-line">{c.hero_title1}</span>
              <span className="reveal-line">
                <em className="grad-text">{c.hero_title2_em}</em>
                {c.hero_title2_rest}
              </span>
            </h1>

            <p className="hero__subhead reveal">{c.hero_sub}</p>

            <div className="hero__cta reveal">
              <Link className="btn btn--primary btn--lg magnetic" to={bookTo}>
                {c.cta_book}
              </Link>
              <a className="btn btn--secondary btn--lg" href="#how">
                {c.cta_how}
              </a>
            </div>

            <div className="booking reveal" role="group" aria-label="Quick booking">
              <span className="booking__field">
                <span className="lbl">{c.book_location_l}</span>
                <span className="val">{c.book_location_v}</span>
              </span>
              <span className="booking__field">
                <span className="lbl">{c.book_vehicle_l}</span>
                <span className="val">{c.book_vehicle_v}</span>
              </span>
              <span className="booking__field">
                <span className="lbl">{c.book_wash_l}</span>
                <span className="val">{c.book_wash_v}</span>
              </span>
              <Link className="btn btn--primary booking__cta magnetic" to={bookTo}>
                {c.book_find}
              </Link>
            </div>

            <div className="hero__ticker reveal">
              <i className="pulse" aria-hidden="true" />{' '}
              <span>
                {c.hero_ticker_pre}
                <strong>{c.hero_ticker_strong}</strong>
                {c.hero_ticker_post}
              </span>
            </div>
          </div>

          <a className="hero__scroll" href="#how" aria-label="Scroll to how it works">
            <span>{c.hero_scroll}</span>
            <i />
          </a>
        </section>

        {/* ---- MARQUEE ---- */}
        <div className="marquee">
          <ul className="sr-only">
            {marquee.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <div className="marquee__track" aria-hidden="true">
            {[...marquee, ...marquee].map((m, i) => (
              <Fragment key={i}>
                <span>{m}</span>
                <i>✦</i>
              </Fragment>
            ))}
          </div>
        </div>

        {/* ---- HOW IT WORKS ---- */}
        <section className="section how" id="how">
          <div className="container">
            <header className="section__head">
              <span className="eyebrow reveal">
                <i className="dot" /> <span>{c.how_eyebrow}</span>
              </span>
              <h2 className="section__title reveal">{c.how_title}</h2>
              <p className="section__lead reveal">{c.how_lead}</p>
            </header>

            <ol className="steps">
              {[
                ['01', c.step1_title, c.step1_body],
                ['02', c.step2_title, c.step2_body],
                ['03', c.step3_title, c.step3_body],
              ].map(([num, title, body]) => (
                <li className="step reveal" key={num}>
                  <span className="step__num grad-text">{num}</span>
                  <h3 className="step__title">{title}</h3>
                  <p className="step__body">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---- LIVE TRACKING ---- */}
        <section className="section tracking" id="tracking">
          <div className="container tracking__grid">
            <div className="tracking__copy">
              <span className="eyebrow reveal">
                <i className="dot" /> <span>{c.track_eyebrow}</span>
              </span>
              <h2 className="section__title reveal">{c.track_title}</h2>
              <p className="section__lead reveal">{c.track_lead}</p>
              <ul className="tracking__list reveal">
                {[c.track_li1, c.track_li2, c.track_li3].map((li) => (
                  <li key={li}>
                    <i aria-hidden="true" /> <span>{li}</span>
                  </li>
                ))}
              </ul>
              <a className="btn btn--primary magnetic reveal" href="#app">
                {c.track_cta}
              </a>
            </div>
            <TrackingPanel c={c} />
          </div>
        </section>

        {/* ---- WASH TIERS ---- */}
        <section className="section tiers" id="tiers">
          <div className="container">
            <header className="section__head">
              <span className="eyebrow reveal">
                <i className="dot" /> <span>{c.tiers_eyebrow}</span>
              </span>
              <h2 className="section__title reveal">{c.tiers_title}</h2>
              <p className="section__lead reveal">{c.tiers_lead}</p>

              <div className="cur reveal" role="group" aria-label="Currency / Đơn vị tiền tệ">
                {(['vnd', 'usd'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`cur-btn${cur === v ? ' is-on' : ''}`}
                    aria-pressed={cur === v}
                    onClick={() => setCurrency(v)}
                  >
                    {v === 'vnd' ? '₫ VND' : '$ USD'}
                  </button>
                ))}
              </div>
            </header>

            <div className="tier-grid tier-grid--duo">
              <article className="tier reveal">
                <h3 className="tier__name">Glow</h3>
                <p className="tier__desc">{c.glow_desc}</p>
                <p className="tier__price">
                  <span className="price">{TIER_PRICE.glow[cur]}</span>
                  <small>{c.tier_per}</small>
                </p>
                <ul className="tier__feat">
                  {[c.glow_f1, c.glow_f2, c.glow_f3, c.glow_f4, c.glow_f5].map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link className="btn btn--secondary tier__cta" to={bookTo}>
                  {c.glow_cta}
                </Link>
              </article>

              <article className="tier tier--featured reveal">
                <span className="tier__badge">{c.plus_badge}</span>
                <h3 className="tier__name">
                  Glow <em>Plus</em>
                </h3>
                <p className="tier__desc">{c.plus_desc}</p>
                <p className="tier__price">
                  <span className="price">{TIER_PRICE.plus[cur]}</span>
                  <small>{c.tier_per}</small>
                </p>
                <ul className="tier__feat">
                  {[c.plus_f1, c.plus_f2, c.plus_f3, c.plus_f4].map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <Link className="btn btn--primary tier__cta magnetic" to={bookTo}>
                  {c.plus_cta}
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* ---- STATS ---- */}
        <section className="section stats">
          <div className="container stats__grid">
            <CountUpStat value={1.2} suffix="M+" decimals={1} label={c.stat1_label} />
            <CountUpStat value={4.9} suffix="★" decimals={1} label={c.stat2_label} />
            <CountUpStat value={38} decimals={0} label={c.stat3_label} />
            <CountUpStat value={12} suffix="k" decimals={0} label={c.stat4_label} />
          </div>
        </section>

        {/* ---- TESTIMONIALS ---- */}
        <section className="section quotes">
          <div className="container">
            <header className="section__head">
              <span className="eyebrow reveal">
                <i className="dot" /> <span>{c.quotes_eyebrow}</span>
              </span>
              <h2 className="section__title reveal">{c.quotes_title}</h2>
            </header>
            <div className="quotes__grid">
              {[
                [c.quote1, 'A', 'Alex R.', c.quote1_loc],
                [c.quote2, 'P', 'Priya N.', c.quote2_loc],
                [c.quote3, 'D', 'Daniel K.', c.quote3_loc],
              ].map(([text, initial, name, loc]) => (
                <figure className="quote reveal" key={name}>
                  <p>{text}</p>
                  <figcaption className="quote__by">
                    <span className="quote__avatar" aria-hidden="true">
                      {initial}
                    </span>
                    <span>
                      <strong>{name}</strong>
                      <span>{loc}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ---- APP ---- */}
        <section className="section app" id="app">
          <div className="container app__grid">
            <div className="app__phone reveal" aria-hidden="true">
              <div className="phone">
                <div className="phone__notch" />
                <div className="phone__screen">
                  <div className="phone__map" />
                  <div className="phone__card">
                    <div className="phone__eta">
                      <em>6</em> <span>{c.app_phone_eta}</span>
                    </div>
                    <p>{c.app_phone_note}</p>
                    <span className="phone__bar" />
                  </div>
                </div>
              </div>
            </div>

            <div className="app__copy">
              <span className="eyebrow reveal">
                <i className="dot" /> <span>{c.app_eyebrow}</span>
              </span>
              <h2 className="section__title reveal">{c.app_title}</h2>
              <p className="section__lead reveal">{c.app_lead}</p>

              <div className="app__badges reveal">
                <a className="store-badge" href="#" onClick={dead} aria-label="Download on the App Store">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M16.4 12.9c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7-.6 0-1.6-.7-2.6-.7-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2 2.5 2 1 0 1.4-.6 2.6-.6 1.2 0 1.5.6 2.6.6 1.1 0 1.8-1 2.4-2 .8-1.1 1.1-2.2 1.1-2.3-.1 0-2.1-.8-2.1-3.1zM14.5 6.8c.5-.7.9-1.6.8-2.6-.8 0-1.8.5-2.4 1.2-.5.6-1 1.6-.8 2.5.9.1 1.8-.4 2.4-1.1z" />
                  </svg>
                  <span>
                    <small>{c.store_small1}</small>App Store
                  </span>
                </a>
                <a className="store-badge" href="#" onClick={dead} aria-label="Get it on Google Play">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 3.2v17.6c0 .4.4.6.7.4l9.5-9.2-9.5-9.2c-.3-.2-.7 0-.7.4zM15.6 12.8l2.9 2.8 2.9-1.7c.5-.3.5-1 0-1.3l-2.9-1.7-2.9 2.8.1-.1zM5.6 21.6l8.4-8.1 2.4 2.3-8.9 5.2c-.6.4-1.3.4-1.9.6zM5.6 2.4c.6.2 1.3.2 1.9.6l8.9 5.2-2.4 2.3-8.4-8.1z" />
                  </svg>
                  <span>
                    <small>{c.store_small2}</small>Google Play
                  </span>
                </a>
              </div>

              <form className="app__sms reveal" onSubmit={(e) => e.preventDefault()}>
                <input type="tel" inputMode="tel" placeholder={c.sms_ph} aria-label="Phone number for app link" />
                <button className="btn btn--primary" type="submit">
                  {c.sms_btn}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* ---- BECOME A WASHER ---- */}
        <section className="section washers" id="washers">
          <div className="container washers__inner reveal">
            <div>
              <span className="eyebrow">
                <i className="dot" /> <span>{c.washers_eyebrow}</span>
              </span>
              <h2 className="section__title">{c.washers_title}</h2>
              <p className="section__lead">{c.washers_lead}</p>
            </div>
            <div className="washers__aside">
              <p className="washers__stat">
                <span className="grad-text">$1,400</span>
                <small>{c.washers_stat_label}</small>
              </p>
              <a className="btn btn--primary btn--lg magnetic" href="#" onClick={dead}>
                {c.washers_cta}
              </a>
            </div>
          </div>
        </section>

        {/* ---- FINAL CTA ---- */}
        <section className="section final">
          <div className="final__aura" aria-hidden="true" />
          <div className="container final__inner">
            <span className="mstripe mstripe--sm reveal" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <h2 className="final__title reveal">{c.final_title}</h2>
            <Link className="btn btn--primary btn--lg magnetic reveal" to={bookTo}>
              {c.cta_book}
            </Link>
            <div className="final__badges reveal">
              <a className="store-badge store-badge--min" href="#" onClick={dead}>
                App Store
              </a>
              <a className="store-badge store-badge--min" href="#" onClick={dead}>
                Google Play
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ---- FOOTER ---- */}
      <footer className="footer">
        <div className="footer__watermark" aria-hidden="true">
          <img src="/washee-mark.svg" alt="" />
        </div>
        <div className="container footer__grid">
          <div className="footer__brand">
            <a className="nav__brand" href="#top">
              <img className="nav__mark" src="/washee-mark.svg" alt="" width={30} height={30} />
              <span className="nav__wordmark">washee</span>
            </a>
            <p>{c.foot_tagline}</p>
          </div>
          <nav className="footer__col" aria-label="Product">
            <h4>{c.foot_product}</h4>
            <a href="#how">{c.nav_how}</a>
            <a href="#tiers">{c.nav_tiers}</a>
            <a href="#tracking">{c.nav_tracking}</a>
            <a href="#app">{c.track_cta}</a>
          </nav>
          <nav className="footer__col" aria-label="Company">
            <h4>{c.foot_company}</h4>
            <a href="#" onClick={dead}>
              {c.foot_about}
            </a>
            <a href="#washers">{c.foot_become}</a>
            <a href="#" onClick={dead}>
              {c.foot_careers}
            </a>
            <a href="#" onClick={dead}>
              {c.foot_support}
            </a>
          </nav>
          <nav className="footer__col" aria-label="Legal">
            <h4>{c.foot_legal}</h4>
            <a href="#" onClick={dead}>
              {c.foot_privacy}
            </a>
            <a href="#" onClick={dead}>
              {c.foot_terms}
            </a>
            <a href="#" onClick={dead}>
              {c.foot_cookies}
            </a>
          </nav>
        </div>
        <div className="container footer__legal">
          <span>{c.foot_rights}</span>
          <div className="footer__social">
            <a href="#" onClick={dead} aria-label="Instagram">
              <span aria-hidden="true">◎</span>
            </a>
            <a href="#" onClick={dead} aria-label="X">
              <span aria-hidden="true">✕</span>
            </a>
            <a href="#" onClick={dead} aria-label="TikTok">
              <span aria-hidden="true">♪</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
