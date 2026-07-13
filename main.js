/* ==========================================================================
   washee — landing page interactions
   Vanilla JS + a progressively-enhanced Three.js hero (CDN, no build step).
   Everything degrades gracefully: no WebGL / reduced-motion → CSS aura only,
   content always works. Mobile/low-power devices get a lighter 3D scene.
   ========================================================================== */

const reduceMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduceMotion = reduceMotionMQ.matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// If the OS reduced-motion preference changes mid-session, reload so every
// CSS + JS motion path re-initialises consistently (CSS stops instantly,
// so we cannot leave JS loops running against the new preference).
reduceMotionMQ.addEventListener?.('change', () => window.location.reload());

/* ----------------------------------------------------------------------- */
/* Nav: glassify on scroll                                                  */
/* ----------------------------------------------------------------------- */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

/* ----------------------------------------------------------------------- */
/* Mobile menu (with focus management)                                      */
/* ----------------------------------------------------------------------- */
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

function openMenu() {
  burger.setAttribute('aria-expanded', 'true');
  mobileMenu.hidden = false;
  mobileMenu.querySelector('a')?.focus();
}
function closeMenu(returnFocus = true) {
  burger.setAttribute('aria-expanded', 'false');
  mobileMenu.hidden = true;
  if (returnFocus) burger.focus();
}
burger.addEventListener('click', () => {
  burger.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
});
mobileMenu.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => closeMenu(false))
);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') closeMenu();
});
// Reset the sheet if the viewport grows into the desktop nav.
window.matchMedia('(min-width: 640px)').addEventListener?.('change', (e) => {
  if (e.matches && !mobileMenu.hidden) closeMenu(false);
});

/* ----------------------------------------------------------------------- */
/* Scroll reveals                                                           */
/* ----------------------------------------------------------------------- */
const revealTargets = document.querySelectorAll('.reveal, .hero__title');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );
  revealTargets.forEach((el) => revealIO.observe(el));
}

/* ----------------------------------------------------------------------- */
/* Count-up stats                                                           */
/* ----------------------------------------------------------------------- */
const countEls = document.querySelectorAll('[data-count]');

/** Format an element's numeric value, preserving its source decimals + suffix. */
function formatCount(el, value) {
  const decimals = (el.dataset.count.split('.')[1] || '').length;
  return value.toFixed(decimals) + (el.dataset.suffix || '');
}

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const duration = 1400;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    el.textContent = formatCount(el, target * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

if (reduceMotion || !('IntersectionObserver' in window)) {
  countEls.forEach((el) => { el.textContent = formatCount(el, parseFloat(el.dataset.count)); });
} else {
  const countIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { countUp(entry.target); obs.unobserve(entry.target); }
      });
    },
    { threshold: 0.6 }
  );
  countEls.forEach((el) => countIO.observe(el));
}

/* ----------------------------------------------------------------------- */
/* Live tracking panel: route travel + ETA countdown + status feed          */
/* ----------------------------------------------------------------------- */
function initTracking() {
  const panel = document.getElementById('trackPanel');
  if (!panel) return;
  const path = document.getElementById('routePath');
  const dot = document.getElementById('washerDot');
  const etaEl = document.getElementById('etaValue');
  const feed = document.querySelectorAll('#trackFeed p');
  if (!path || !dot) return;

  const len = path.getTotalLength();
  const placeDot = (t) => {
    const pt = path.getPointAtLength(t * len);
    dot.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
  };

  // Reduced motion: composed static state, no loop.
  if (reduceMotion) {
    placeDot(0.62);
    if (etaEl) etaEl.textContent = '4';
    feed.forEach((p) => p.classList.add('is-done'));
    return;
  }

  let raf = null, startTs = null, running = false;
  const loopMs = 9000;

  const frame = (ts) => {
    if (startTs === null) startTs = ts;
    const t = ((ts - startTs) % loopMs) / loopMs;
    placeDot(t);
    if (etaEl) etaEl.textContent = String(Math.max(1, 7 - Math.floor(t * 7)));
    feed.forEach((p, i) => p.classList.toggle('is-done', t > (i + 1) / (feed.length + 1)));
    raf = requestAnimationFrame(frame);
  };

  // Run only while the panel is on screen (saves battery).
  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !running) {
          running = true; startTs = null; raf = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false; if (raf) cancelAnimationFrame(raf);
        }
      });
    },
    { threshold: 0.2 }
  ).observe(panel);
}
initTracking();

/* ----------------------------------------------------------------------- */
/* Magnetic buttons (desktop, fine pointer) — rect cached, rAF-coalesced    */
/* ----------------------------------------------------------------------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    let rect = null, raf = null, mx = 0, my = 0;
    const apply = () => { el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`; raf = null; };
    el.addEventListener('mouseenter', () => { rect = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', (e) => {
      if (!rect) rect = el.getBoundingClientRect();
      mx = e.clientX - rect.left - rect.width / 2;
      my = e.clientY - rect.top - rect.height / 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = ''; rect = null;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    });
  });
}

/* ----------------------------------------------------------------------- */
/* Cursor glow (desktop, fine pointer)                                      */
/* ----------------------------------------------------------------------- */
if (finePointer && !reduceMotion) {
  const glow = document.querySelector('.cursor-glow');
  let gx = 0, gy = 0, cx = 0, cy = 0, glowRaf = null;
  glow.classList.add('is-on');

  window.addEventListener('mousemove', (e) => {
    gx = e.clientX; gy = e.clientY;
    if (!glowRaf) glowRaf = requestAnimationFrame(moveGlow);
  });
  function moveGlow() {
    cx += (gx - cx) * 0.15;
    cy += (gy - cy) * 0.15;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    glowRaf = Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5 ? requestAnimationFrame(moveGlow) : null;
  }
}

/* ======================================================================= */
/* Three.js hero — liquid droplet blob + drifting droplets                  */
/* Progressive: skipped on reduced-motion or when WebGL/import fails.       */
/* The CSS .hero__aura always provides a fallback backdrop.                 */
/* ======================================================================= */
async function initHero() {
  if (reduceMotion) return;

  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  try {
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) return;
  } catch (_) { return; }

  let THREE;
  try {
    THREE = await import('three');
  } catch (err) {
    console.warn('[washee] Three.js unavailable, using CSS fallback.', err);
    return;
  }

  const hero = document.getElementById('hero');

  // Capability-based downgrade (DESIGN.md: 3D simplifies on mobile/low-power).
  const lowPower =
    window.innerWidth < 720 ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const DETAIL = lowPower ? 4 : 8;
  const COUNT = lowPower ? 70 : 180;
  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lowPower });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 5.2);

  const COLOR_A = new THREE.Color('#9FE5F9');
  const COLOR_B = new THREE.Color('#3C9FF6');
  const COLOR_DEEP = new THREE.Color('#05080d');

  // --- GLSL: classic 3D simplex noise (Ashima / Stefan Gustavson) ---------
  const NOISE = `
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod(i,289.0);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  const blobMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      uTime: { value: 0 }, uColorA: { value: COLOR_A }, uColorB: { value: COLOR_B },
      uColorDeep: { value: COLOR_DEEP }, uAmp: { value: 0.32 },
    },
    vertexShader: `
      ${NOISE}
      uniform float uTime; uniform float uAmp;
      varying vec3 vNormal; varying vec3 vView; varying float vN;
      void main(){
        float n = snoise(normal*1.3 + uTime*0.28);
        vN = n;
        vec3 displaced = position + normal * n * uAmp;
        vec4 mv = modelViewMatrix * vec4(displaced,1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColorA; uniform vec3 uColorB; uniform vec3 uColorDeep; uniform float uTime;
      varying vec3 vNormal; varying vec3 vView; varying float vN;
      void main(){
        float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.4);
        vec3 grad = mix(uColorB, uColorA, fres);
        float caustic = smoothstep(0.55, 0.95, 0.5 + 0.5*sin(vN*7.0 + uTime*1.2));
        vec3 col = mix(uColorDeep, grad, clamp(fres*1.05 + caustic*0.25, 0.0, 1.0));
        col += grad * pow(fres, 3.0) * 0.8;
        float alpha = clamp(fres*1.25 + caustic*0.35 + 0.06, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }`,
  });

  const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, DETAIL), blobMat);
  scene.add(blob);

  // Soft additive halo behind the blob (fakes bloom, transparent-safe).
  const haloTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(70,170,255,0.55)');
    grd.addColorStop(0.5, 'rgba(60,159,246,0.18)');
    grd.addColorStop(1, 'rgba(60,159,246,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  halo.scale.set(6.5, 6.5, 1);
  halo.position.z = -1;
  scene.add(halo);

  // Drifting droplets.
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
    speeds[i] = 0.12 + Math.random() * 0.5;
  }
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const dropTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(200,240,255,0.95)');
    grd.addColorStop(0.4, 'rgba(95,192,255,0.5)');
    grd.addColorStop(1, 'rgba(60,159,246,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 32, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(c);
  })();
  const drops = new THREE.Points(dropGeo, new THREE.PointsMaterial({
    size: 0.13, map: dropTex, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, sizeAttenuation: true, opacity: 0.9,
  }));
  scene.add(drops);

  const resize = () => {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (finePointer) {
    window.addEventListener('mousemove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5);
      mouse.ty = (e.clientY / window.innerHeight - 0.5);
    });
  }

  const clock = new THREE.Clock();
  let visible = true, hidden = false, raf = null;

  const render = () => {
    const t = clock.getElapsedTime();
    blobMat.uniforms.uTime.value = t;

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    blob.rotation.y = t * 0.12 + mouse.x * 0.6;
    blob.rotation.x = mouse.y * 0.5;
    camera.position.x = mouse.x * 0.8;
    camera.position.y = -mouse.y * 0.6;
    camera.lookAt(0, 0, 0);

    const pos = dropGeo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3 + 1] += speeds[i] * 0.012;
      if (pos[i * 3 + 1] > 3.6) pos[i * 3 + 1] = -3.6;
    }
    dropGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(render);
  };

  const start = () => { if (!raf && visible && !hidden) { clock.start(); raf = requestAnimationFrame(render); } };
  const stop = () => { if (raf) { cancelAnimationFrame(raf); raf = null; } };

  new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; visible ? start() : stop(); },
    { threshold: 0.01 }
  ).observe(hero);

  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    hidden ? stop() : start();
  });

  start();
}

initHero();
