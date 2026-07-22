import { useEffect, useRef } from 'react';

// Progressively-enhanced Three.js hero: a noise-displaced "liquid droplet" blob
// with drifting droplets, ported from the legacy static site. Three is loaded
// via dynamic import() so it code-splits into its own chunk and only downloads
// on capable, motion-OK devices. Everything degrades to the CSS .hero__aura.
export default function Hero3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    try {
      const test = document.createElement('canvas');
      if (!(test.getContext('webgl2') || test.getContext('webgl'))) return undefined;
    } catch {
      return undefined;
    }

    let cancelled = false;
    let cleanup = (): void => {};

    void (async () => {
      let THREE: typeof import('three');
      try {
        THREE = await import('three');
      } catch {
        return; // CSS aura fallback
      }
      if (cancelled) return;

      const hero = canvas.parentElement as HTMLElement;
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      const nav = navigator as Navigator & { deviceMemory?: number };
      const lowPower =
        window.innerWidth < 720 ||
        (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4);
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
          uTime: { value: 0 },
          uColorA: { value: COLOR_A },
          uColorB: { value: COLOR_B },
          uColorDeep: { value: COLOR_DEEP },
          uAmp: { value: 0.32 },
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

      const makeRadialTexture = (stops: [number, string][]): THREE.CanvasTexture => {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const g = c.getContext('2d')!;
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        stops.forEach(([o, col]) => grd.addColorStop(o, col));
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
      };

      const haloTex = makeRadialTexture([
        [0, 'rgba(70,170,255,0.55)'],
        [0.5, 'rgba(60,159,246,0.18)'],
        [1, 'rgba(60,159,246,0)'],
      ]);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: haloTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      );
      halo.scale.set(6.5, 6.5, 1);
      halo.position.z = -1;
      scene.add(halo);

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

      const dropTex = makeRadialTexture([
        [0, 'rgba(200,240,255,0.95)'],
        [0.4, 'rgba(95,192,255,0.5)'],
        [1, 'rgba(60,159,246,0)'],
      ]);
      const drops = new THREE.Points(
        dropGeo,
        new THREE.PointsMaterial({
          size: 0.13,
          map: dropTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
          opacity: 0.9,
        }),
      );
      scene.add(drops);

      const onResize = (): void => {
        const w = hero.clientWidth;
        const h = hero.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      onResize();
      window.addEventListener('resize', onResize);

      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      const onMouseMove = (e: MouseEvent): void => {
        mouse.tx = e.clientX / window.innerWidth - 0.5;
        mouse.ty = e.clientY / window.innerHeight - 0.5;
      };
      if (finePointer) window.addEventListener('mousemove', onMouseMove);

      const clock = new THREE.Clock();
      let visible = true;
      let hidden = false;
      let raf = 0;

      const render = (): void => {
        const t = clock.getElapsedTime();
        blobMat.uniforms.uTime.value = t;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        blob.rotation.y = t * 0.12 + mouse.x * 0.6;
        blob.rotation.x = mouse.y * 0.5;
        camera.position.x = mouse.x * 0.8;
        camera.position.y = -mouse.y * 0.6;
        camera.lookAt(0, 0, 0);
        const pos = dropGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < COUNT; i++) {
          pos[i * 3 + 1] += speeds[i] * 0.012;
          if (pos[i * 3 + 1] > 3.6) pos[i * 3 + 1] = -3.6;
        }
        dropGeo.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
      };
      const start = (): void => {
        if (!raf && visible && !hidden) {
          clock.start();
          raf = requestAnimationFrame(render);
        }
      };
      const stop = (): void => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };

      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0].isIntersecting;
          if (visible) start();
          else stop();
        },
        { threshold: 0.01 },
      );
      io.observe(hero);

      const onVisibility = (): void => {
        hidden = document.hidden;
        if (hidden) stop();
        else start();
      };
      document.addEventListener('visibilitychange', onVisibility);
      start();

      cleanup = (): void => {
        stop();
        io.disconnect();
        window.removeEventListener('resize', onResize);
        window.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('visibilitychange', onVisibility);
        blob.geometry.dispose();
        blobMat.dispose();
        dropGeo.dispose();
        (drops.material as THREE.Material).dispose();
        (halo.material as THREE.Material).dispose();
        haloTex.dispose();
        dropTex.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <canvas className="hero__canvas" aria-hidden="true" ref={canvasRef} />;
}
