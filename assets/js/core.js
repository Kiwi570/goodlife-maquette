/* Good Life — noyau commun : mouvement, son, mode calme, horaires, feuilles, curseur, transitions. */
(function () {
  const D = window.GL_DATA;
  const html = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    sdel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  const qs = new URLSearchParams(location.search);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pref = store.get('gl-calm');
  const calm = pref === '1' || (pref === null && reduce) || qs.get('calme') === '1';
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = !!window.gsap;
  html.classList.add('js');
  html.classList.toggle('is-calm', calm);
  html.classList.toggle('motion', !calm && hasGSAP);
  if (qs.get('nogl') === '1') html.classList.add('no-gl');

  const GL = window.GL = { data: D, calm, store, heroProgress: 0, finePointer, events: new EventTarget() };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  GL.$ = $; GL.$$ = $$;

  /* ---------- Images (srcset) ---------- */
  const SIZES = { '16x9': [960, 1920], '9x16': [540, 1080], '4x5': [600, 1200], '1x1': [600, 1200] };
  GL.img = function (name, alt, sizes = '(min-width: 900px) 33vw, 80vw', cls = '') {
    const fmt = name.match(/(\d+x\d+)$/)[1], [s, b] = SIZES[fmt];
    return `<img class="${cls}" src="assets/img/${name}-${s}.webp" srcset="assets/img/${name}-${s}.webp ${s}w, assets/img/${name}-${b}.webp ${b}w" sizes="${sizes}" alt="${alt}" loading="lazy" decoding="async">`;
  };

  /* ---------- Heure au Gosier et statut d'ouverture ---------- */
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  GL.now = function () {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: D.club.fuseau, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const p = {}; f.formatToParts(new Date()).forEach(x => (p[x.type] = x.value));
    const h = parseInt(p.hour, 10) % 24, m = parseInt(p.minute, 10);
    return { day: WD[p.weekday], h, m, min: h * 60 + m, dec: h + m / 60 };
  };
  const toMin = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  GL.toMin = toMin;
  GL.fmtH = s => { const [h, m] = s.split(':').map(Number); return `${h}h${m ? String(m).padStart(2, '0') : ''}`; };
  GL.fmtMin = mm => GL.fmtH(`${Math.floor(mm / 60)}:${mm % 60}`);
  GL.status = function () {
    const n = GL.now(), H = D.horaires;
    for (const [a, b] of H[n.day].plages) {
      const s = toMin(a), e = toMin(b);
      if (n.min >= s && n.min < e) return { open: true, soon: e - n.min <= 30, text: e - n.min <= 30 ? `Ferme bientôt · ${GL.fmtH(b)}` : `Ouvert · jusqu'à ${GL.fmtH(b)}`, short: 'Ouvert maintenant' };
    }
    for (let k = 0; k < 8; k++) {
      const d = (n.day + k) % 7;
      for (const [a] of H[d].plages) {
        const s = toMin(a);
        if (k === 0 && s <= n.min) continue;
        const when = k === 0 ? `à ${GL.fmtH(a)}` : k === 1 ? `demain à ${GL.fmtH(a)}` : `${H[d].jour.toLowerCase()} à ${GL.fmtH(a)}`;
        return { open: false, text: `Fermé · ouvre ${when}`, short: 'Fermé' };
      }
    }
    return { open: false, text: 'Fermé', short: 'Fermé' };
  };
  function paintStatus() {
    const st = GL.status(), n = GL.now();
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-open', st.open); el.classList.toggle('is-closed', !st.open);
      const t = el.querySelector('span'); if (t) t.textContent = st.text;
    });
    $$('[data-gosier-time]').forEach(el => (el.textContent = `${n.h}h${String(n.m).padStart(2, '0')} au Gosier`));
    $$('[data-today-row]').forEach(tr => tr.classList.toggle('is-today', +tr.dataset.todayRow === n.day));
  }
  GL.paintStatus = paintStatus;

  /* ---------- Feuilles dessinées en code (canvas) ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  GL.rng = rng;
  function frond(ctx, r, x, y, ang, len, w, colors) {
    const a = ang * Math.PI / 180, bend = (r() - .5) * .9;
    const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
    const cx = x + Math.cos(a + bend) * len * .55, cy = y + Math.sin(a + bend) * len * .55;
    const pt = t => [(1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * ey];
    const tan = t => Math.atan2(2 * (1 - t) * (cy - y) + 2 * t * (ey - cy), 2 * (1 - t) * (cx - x) + 2 * t * (ex - cx));
    ctx.strokeStyle = colors[0]; ctx.lineWidth = Math.max(1.5, w * .05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    const n = 26;
    for (let i = 2; i < n; i++) {
      const t = i / n, [px, py] = pt(t), th = tan(t);
      const L = w * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (.75 + r() * .35);
      for (const side of [-1, 1]) {
        const la = th + side * (.75 + r() * .25);
        const tx = px + Math.cos(la) * L, ty = py + Math.sin(la) * L;
        const nx = Math.cos(la + Math.PI / 2) * L * .075, ny = Math.sin(la + Math.PI / 2) * L * .075;
        const mx = (px + tx) / 2, my = (py + ty) / 2;
        ctx.fillStyle = colors[(i + (side > 0 ? 1 : 0)) % colors.length];
        ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(mx + nx, my + ny, tx, ty); ctx.quadraticCurveTo(mx - nx, my - ny, px, py); ctx.fill();
      }
    }
  }
  function broad(ctx, x, y, ang, len, fill, rib) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang * Math.PI / 180);
    ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(len * .25, -len * .32, len * .75, -len * .3, len, 0); ctx.bezierCurveTo(len * .75, len * .3, len * .25, len * .32, 0, 0); ctx.fill();
    ctx.strokeStyle = rib; ctx.lineWidth = Math.max(1, len * .012); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .95, 0); ctx.stroke();
    for (let i = 1; i < 9; i++) { const t = i / 9; ctx.beginPath(); ctx.moveTo(len * t * .95, 0); ctx.lineTo(len * (t * .95 + .08), -len * .2 * Math.sin(Math.PI * t)); ctx.moveTo(len * t * .95, 0); ctx.lineTo(len * (t * .95 + .08), len * .2 * Math.sin(Math.PI * t)); ctx.stroke(); }
    ctx.restore();
  }
  /* region : left | right | top | bottom | all ; mono : couleur unique (ombres) */
  GL.drawLeaves = function (canvas, o = {}) {
    const W = canvas.width, H = canvas.height, m = Math.max(W, H), ctx = canvas.getContext('2d');
    const r = rng(o.seed || 3), region = o.region || 'all';
    const pal = o.mono ? [o.mono] : ['#0B231C', '#12352B', '#1E4D3E', '#2F6B4F', '#163F32'];
    ctx.clearRect(0, 0, W, H);
    if (o.blur && 'filter' in ctx) ctx.filter = `blur(${o.blur}px)`;
    const n = o.count || 9;
    const anchor = () => {
      if (region === 'left') return [-m * .04, r() * H, -50 + r() * 100];
      if (region === 'right') return [W + m * .04, r() * H, 130 + r() * 100];
      if (region === 'top') return [r() * W, -m * .05, 40 + r() * 100];
      if (region === 'bottom') return [r() * W, H + m * .05, 220 + r() * 100];
      return [r() * W, r() * H, r() * 360];
    };
    const reach = o.reach || .5;
    for (let i = 0; i < n; i++) {
      const [x, y, a] = anchor();
      const len = m * reach * (.6 + r() * .5);
      if (!o.mono && r() < .32) broad(ctx, x, y, a + (r() - .5) * 30, len * .7, pal[(i + 2) % pal.length], 'rgba(0,0,0,.25)');
      const cols = o.mono ? pal : [pal[i % pal.length], pal[(i + 1) % pal.length], pal[(i + 3) % pal.length]];
      frond(ctx, r, x, y, a, len, m * (o.width || .075), cols);
    }
    if (!o.mono && o.light) {
      ctx.globalCompositeOperation = 'source-atop';
      const g = ctx.createRadialGradient(W * .75, H * .15, 0, W * .75, H * .15, m * .8);
      g.addColorStop(0, 'rgba(255,200,120,.35)'); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.filter = 'none';
    return canvas;
  };
  GL.sizeCanvas = function (c, scale = 1) {
    const r = c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2) * scale;
    c.width = Math.max(2, Math.round((r.width || innerWidth) * dpr)); c.height = Math.max(2, Math.round((r.height || innerHeight) * dpr));
    return c;
  };

  /* ---------- Son (uniquement après un clic) ---------- */
  const Sound = GL.sound = {
    on: false, ctx: null,
    init() {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = .9; this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.2; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = .55;
      this.amb = ctx.createGain(); this.amb.gain.value = 0;
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .07; lg.gain.value = .018; lfo.connect(lg); lg.connect(this.amb.gain);
      src.connect(bp); bp.connect(this.amb); this.amb.connect(this.master); src.start(); lfo.start();
      return true;
    },
    toggle() {
      if (!this.ctx && !this.init()) return;
      this.on = !this.on;
      const t = this.ctx.currentTime;
      if (this.on) { this.ctx.resume(); this.amb.gain.cancelScheduledValues(t); this.amb.gain.setTargetAtTime(.032, t, .8); this.beep(660, .08, .05); }
      else { this.amb.gain.setTargetAtTime(0, t, .25); }
      $$('[data-sound]').forEach(b => b.setAttribute('aria-pressed', String(this.on)));
    },
    beep(f = 880, d = .12, g = .07, type = 'sine') {
      if (!this.on || !this.ctx) return;
      const t = this.ctx.currentTime, o = this.ctx.createOscillator(), a = this.ctx.createGain();
      o.type = type; o.frequency.value = f; a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + .01); a.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(a); a.connect(this.master); o.start(t); o.stop(t + d + .05);
    }
  };

  /* ---------- Mode calme ---------- */
  function setCalm(v) {
    store.set('gl-calm', v ? '1' : '0');
    store.sset('gl-scroll', String(window.scrollY)); store.sset('gl-intro', '1');
    location.reload();
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener('DOMContentLoaded', init);
  function init() {
    paintStatus(); setInterval(paintStatus, 30000);
    $$('[data-calm]').forEach(b => { b.setAttribute('aria-pressed', String(calm)); b.addEventListener('click', () => setCalm(!calm)); });
    $$('[data-sound]').forEach(b => b.addEventListener('click', () => Sound.toggle()));
    $$('[data-year]').forEach(e => (e.textContent = new Date().getFullYear()));
    menu(); modals(); lightbox();
    if (hasGSAP) { gsap.registerPlugin(ScrollTrigger); if (window.SplitText) gsap.registerPlugin(SplitText); if (window.Flip) gsap.registerPlugin(Flip); }
    if (calm || !hasGSAP) {
      html.classList.add('no-intro'); $('.intro')?.remove(); $('.sweep')?.remove();
      $$('[data-split]').forEach(e => e.classList.add('split-ready'));
      restoreScroll(); nav(); phero(true); setTimeout(() => { GL.events.dispatchEvent(new Event('ready')); toHash(); }, 0); return;
    }
    smooth(); nav(); shadows(); cursor(); magnets(); transitions(); phero(false);
    const introEl = $('.intro');
    const showIntro = introEl && !store.sget('gl-intro') && !store.sget('gl-sweep');
    if (!showIntro) { introEl?.remove(); html.classList.add('no-intro'); }
    document.fonts && document.fonts.ready.then(() => { splits(); reveals(); if (showIntro) intro(); else afterIntro(); });
  }
  function afterIntro() { restoreScroll(); GL.introDone = true; GL.events.dispatchEvent(new Event('ready')); ScrollTrigger.refresh(); toHash(); }
  function toHash() {
    const h = location.hash; if (!h || h === '#reserver' || GL.restored) return;
    let t = null; try { t = document.querySelector(h); } catch (e) {}
    if (!t) return;
    setTimeout(() => { const y = t.getBoundingClientRect().top + window.scrollY - 70; GL.lenis ? GL.lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y); }, 80);
  }
  function restoreScroll() {
    const y = store.sget('gl-scroll'); if (y === null) return; store.sdel('gl-scroll'); GL.restored = true;
    requestAnimationFrame(() => { if (GL.lenis) GL.lenis.scrollTo(+y, { immediate: true }); else window.scrollTo(0, +y); });
  }

  /* Ouverture orchestrée (< 3 s) */
  function intro() {
    const el = $('.intro'), word = $('.intro__word', el), sun = $('.intro__sun', el), count = $('.intro__count', el);
    const letters = $$('span', word);
    store.sset('gl-intro', '1');
    GL.lenis && GL.lenis.stop();
    const c = $('canvas', el); if (c) { GL.sizeCanvas(c, .6); GL.drawLeaves(c, { region: 'bottom', count: 7, reach: .4, seed: 11 }); gsap.set(c, { yPercent: 60 }); }
    const prox = letters.map(() => ({ w: 75 }));
    const o = { v: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: () => { el.remove(); GL.lenis && GL.lenis.start(); afterIntro(); } });
    tl.fromTo(sun, { y: '55vh', scale: .35 }, { y: 0, scale: 1, duration: 1.1 }, 0)
      .fromTo(letters, { yPercent: 115 }, { yPercent: 0, duration: .8, stagger: .045 }, .2)
      .to(prox, { w: 100, duration: .9, stagger: .045, ease: 'power2.inOut', onUpdate() { letters.forEach((l, i) => (l.style.fontVariationSettings = `"wdth" ${prox[i].w.toFixed(1)}, "opsz" 96`)); } }, .35)
      .to(o, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate() { if (count) count.textContent = `${Math.round(o.v)} %`; } }, 0)
      .to(c, { yPercent: 0, duration: .9, ease: 'power3.out' }, .5)
      .add(() => GL.events.dispatchEvent(new Event('intro-out')), 1.45)
      .to(el, { yPercent: -100, duration: .85, ease: 'power4.inOut' }, 1.45)
      .to(word, { yPercent: 40, duration: .85, ease: 'power4.inOut' }, 1.45)
      .to(sun, { yPercent: -30, duration: .85, ease: 'power4.inOut' }, 1.45);
  }

  /* Défilement fluide */
  function smooth() {
    if (!window.Lenis) return;
    ScrollTrigger.config({ ignoreMobileResize: true });
    const lenis = GL.lenis = new Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* Navigation */
  function nav() {
    const n = $('.nav'); if (!n) return;
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      n.classList.toggle('is-scrolled', y > 40);
      if (!document.body.classList.contains('menu-open')) n.classList.toggle('is-hidden', y > lastY && y > 400 && !calm);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (hasGSAP) $$('[data-dark]').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top top+=40', end: 'bottom top+=40', toggleClass: { targets: n, className: 'on-dark' } }));
    const path = location.pathname.split('/').pop().replace('.html', '') || 'index';
    $$('.nav__links a, .menu nav a').forEach(a => { const p = (a.getAttribute('href') || '').split('#')[0].replace('.html', ''); if (p === path && !a.getAttribute('href').includes('#')) a.setAttribute('aria-current', 'page'); });
  }
  function menu() {
    const b = $('[data-burger]'), m = $('#menu'); if (!b || !m) return;
    const set = open => {
      b.setAttribute('aria-expanded', String(open)); m.classList.toggle('is-open', open); m.toggleAttribute('inert', !open);
      document.body.classList.toggle('menu-open', open); b.querySelector('.lbl').textContent = open ? 'Fermer' : 'Menu';
      if (GL.lenis) open ? GL.lenis.stop() : GL.lenis.start();
      if (open) { const c = $('canvas', m); if (c && !c.dataset.done) { GL.sizeCanvas(c, .7); GL.drawLeaves(c, { region: 'right', count: 6, mono: '#2F6B4F', seed: 5 }); c.dataset.done = 1; } m.querySelector('a')?.focus(); if (hasGSAP && !calm) gsap.from($$('nav a', m), { yPercent: 60, opacity: 0, stagger: .05, duration: .7, ease: 'power3.out', delay: .15 }); }
    };
    m.setAttribute('inert', '');
    b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
    m.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && m.classList.contains('is-open')) { set(false); b.focus(); } });
  }

  /* Ombres de palmes qui suivent l'heure du Gosier */
  function shadows() {
    const wrap = document.createElement('div'); wrap.className = 'palm-shadows'; wrap.setAttribute('aria-hidden', 'true');
    const sway = document.createElement('div'); sway.style.cssText = 'width:100%;height:100%;will-change:transform';
    const c = document.createElement('canvas'); sway.appendChild(c); wrap.appendChild(sway); document.body.appendChild(wrap);
    const draw = () => {
      const scale = innerWidth < 700 ? .35 : .5;
      c.width = Math.round(wrap.offsetWidth * scale); c.height = Math.round(wrap.offsetHeight * scale);
      const blur = Math.max(2, Math.round(9 * scale));
      GL.drawLeaves(c, { region: 'all', count: innerWidth < 700 ? 8 : 13, mono: '#0B231C', blur: 'filter' in c.getContext('2d') ? blur : 0, reach: .3, width: .06, seed: 21 });
      if (!('filter' in c.getContext('2d'))) c.style.filter = `blur(${blur}px)`;
    };
    draw();
    const apply = () => {
      const t = GL.now().dec;
      const day = t >= 6 && t <= 18.6;
      const k = Math.max(-1, Math.min(1, (t - 12.3) / 6.3));
      const rot = day ? k * 28 : 0, len = day ? 1 + Math.abs(k) * .5 : 1.1;
      const op = !day ? .04 : t >= 15.5 ? .15 : t < 8 ? .12 : .1;
      wrap.style.opacity = op;
      wrap.style.transform = `rotate(${rot}deg) scaleY(${len})`;
      html.dataset.sun = !day ? 'nuit' : t >= 15.5 ? 'dore' : t < 9 ? 'matin' : 'jour';
    };
    apply(); setInterval(apply, 60000);
    gsap.to(sway, { rotation: 1.6, x: 18, y: 8, duration: 4.5, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(sway, { scale: 1.02, duration: 2.7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    let to; window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(draw, 300); });
  }

  /* Curseur « disque de fonte » */
  function cursor() {
    if (!finePointer) return;
    const el = document.createElement('div'); el.className = 'cursor'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#1A1410" fill-opacity=".9"/><circle cx="50" cy="50" r="40" fill="none" stroke="#F3EBDD" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="3 5"/><circle cx="50" cy="50" r="13" fill="#FF6B3D"/><circle cx="50" cy="50" r="7" fill="#1A1410"/><rect x="47" y="8" width="6" height="12" rx="3" fill="#F4C27A"/></svg><span class="cursor__label"></span>`;
    document.body.appendChild(el); html.classList.add('has-cursor');
    const xTo = gsap.quickTo(el, 'x', { duration: .35, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .35, ease: 'power3' });
    const svg = el.querySelector('svg'), lab = el.querySelector('.cursor__label');
    let lx = 0, rot = 0;
    window.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      el.classList.add('is-on'); xTo(e.clientX); yTo(e.clientY);
      rot += (e.clientX - lx) * .9; lx = e.clientX; gsap.to(svg, { rotation: rot, duration: .6, ease: 'power2.out', overwrite: true });
    }, { passive: true });
    document.addEventListener('pointerleave', () => el.classList.remove('is-on'));
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, [role="button"], label, select');
      el.classList.toggle('is-big', !!(t && t.dataset.cursor)); el.classList.toggle('is-hover', !!t && !(t && t.dataset.cursor));
      lab.textContent = t && t.dataset.cursor ? t.dataset.cursor : '';
    });
    const st = document.createElement('style'); st.textContent = '.cursor.is-hover{width:58px;height:58px;margin:-29px 0 0 -29px}'; document.head.appendChild(st);
  }

  /* Boutons magnétiques */
  function magnets() {
    if (!finePointer) return;
    $$('.magnet').forEach(b => {
      const xTo = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .28); yTo((e.clientY - r.top - r.height / 2) * .4); });
      b.addEventListener('pointerleave', () => { gsap.to(b, { x: 0, y: 0, duration: .9, ease: 'elastic.out(1, .4)' }); });
    });
  }

  /* Titres découpés */
  function splits() {
    $$('[data-split]').forEach(el => {
      if (!window.SplitText) { el.classList.add('split-ready'); return; }
      const s = SplitText.create(el, { type: 'words,chars', mask: 'words', wordsClass: 'w', charsClass: 'c' });
      el.classList.add('split-ready');
      if (el.dataset.split === 'manual') { el._split = s; return; }
      gsap.from(s.chars, { yPercent: 110, rotate: 6, duration: .9, ease: 'power4.out', stagger: .018, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
  }
  function reveals() {
    $$('[data-reveal]').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: +(el.dataset.reveal || 0), scrollTrigger: { trigger: el, start: 'top 90%' } }));
    $$('.reveal-img').forEach(f => {
      const img = f.querySelector('img');
      gsap.fromTo(f, { clipPath: 'inset(18% 10% 18% 10% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 95%', end: 'top 35%', scrub: true } });
      if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    const fw = $('.foot__word');
    if (fw) { const p = { w: 75 }; gsap.to(p, { w: 100, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true }, onUpdate() { fw.style.fontVariationSettings = `"wdth" ${p.w.toFixed(1)}, "opsz" 96`; } }); }
    $$('.u').forEach(u => gsap.fromTo(u, { '--u': 0 }, { '--u': 1, duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: u, start: 'top 85%' } }));
  }

  /* Transition de page : balayage de feuilles */
  function transitions() {
    const sw = $('.sweep'); if (!sw) return;
    const c = $('canvas', sw);
    const paint = () => { GL.sizeCanvas(c, .5); GL.drawLeaves(c, { region: 'all', count: 16, reach: .3, seed: 8, light: true }); };
    if (store.sget('gl-sweep')) {
      store.sdel('gl-sweep'); paint();
      gsap.set(sw, { xPercent: 0 });
      gsap.to(sw, { xPercent: -115, duration: 1, ease: 'power4.inOut', delay: .1 });
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || /^(mailto|tel):/.test(a.getAttribute('href'))) return;
      const same = url.pathname.replace(/\/$/, '/index.html') === location.pathname.replace(/\/$/, '/index.html') || url.pathname.replace('.html', '') === location.pathname.replace('.html', '');
      if (same) { if (url.hash) { e.preventDefault(); const t = $(url.hash); if (t) GL.lenis ? GL.lenis.scrollTo(t, { offset: -70 }) : t.scrollIntoView(); history.replaceState(null, '', url.hash); } return; }
      e.preventDefault(); paint(); store.sset('gl-sweep', '1');
      gsap.fromTo(sw, { xPercent: 115 }, { xPercent: 0, duration: .75, ease: 'power4.inOut', onComplete: () => (location.href = a.href) });
    });
    window.addEventListener('pageshow', e => { if (e.persisted) gsap.set(sw, { xPercent: 115 }); });
  }

  /* Modales (mentions légales) */
  function modals() {
    $$('[data-open-modal]').forEach(b => b.addEventListener('click', () => openModal($('#' + b.dataset.openModal), b)));
  }
  function openModal(m, from) {
    if (!m) return;
    m.classList.add('is-open'); m.removeAttribute('inert'); GL.lenis && GL.lenis.stop();
    const close = () => { m.classList.remove('is-open'); m.setAttribute('inert', ''); GL.lenis && GL.lenis.start(); from && from.focus(); document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); };
    $$('[data-close]', m).forEach(x => (x.onclick = close)); document.addEventListener('keydown', esc);
    setTimeout(() => $('.x', m)?.focus(), 50);
  }
  GL.openModal = openModal;

  /* Visionneuse */
  function lightbox() {
    const lb = $('.lightbox'); if (!lb) return;
    const img = $('img', lb); let list = [], i = 0, from;
    const show = k => { i = (k + list.length) % list.length; const s = list[i]; img.src = s.dataset.full || s.querySelector('img').currentSrc; img.alt = s.querySelector('img').alt; };
    const close = () => { lb.classList.remove('is-open'); lb.setAttribute('inert', ''); GL.lenis && GL.lenis.start(); from && from.focus(); };
    lb.setAttribute('inert', '');
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-lightbox]'); if (!t) return;
      list = $$('[data-lightbox]'); from = t; show(list.indexOf(t));
      lb.classList.add('is-open'); lb.removeAttribute('inert'); GL.lenis && GL.lenis.stop(); $('.x', lb).focus();
    });
    $('.x', lb).addEventListener('click', close);
    $('[data-prev]', lb).addEventListener('click', () => show(i - 1));
    $('[data-next]', lb).addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => { if (!lb.classList.contains('is-open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(i + 1); if (e.key === 'ArrowLeft') show(i - 1); });
  }

  /* Ouverture des pages secondaires : feuilles sur les bords, image qui recule */
  function phero(still) {
    const box = $('[data-phero-leaves]'); if (!box) return;
    const L = document.createElement('canvas'), R = document.createElement('canvas'); box.append(L, R);
    const draw = () => { [L, R].forEach(c => GL.sizeCanvas(c, innerWidth < 700 ? .8 : .6)); GL.drawLeaves(L, { region: 'left', count: 7, reach: .36, seed: 31, light: true }); GL.drawLeaves(R, { region: 'right', count: 7, reach: .36, seed: 37, light: true }); };
    draw(); let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 300); });
    if (still || !hasGSAP) return;
    const img = $('.phero__img img');
    gsap.from(L, { xPercent: -40, duration: 1.6, ease: 'power3.out', delay: .2 });
    gsap.from(R, { xPercent: 40, duration: 1.6, ease: 'power3.out', delay: .2 });
    gsap.to(L, { rotation: 1.2, transformOrigin: '0% 50%', duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to(R, { rotation: -1.2, transformOrigin: '100% 50%', duration: 4.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    const st = { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(L, { xPercent: -45, ease: 'none', scrollTrigger: st });
    gsap.to(R, { xPercent: 45, ease: 'none', scrollTrigger: st });
    if (img) gsap.fromTo(img, { scale: 1.12 }, { scale: 1, yPercent: 8, ease: 'none', scrollTrigger: st });
  }

  /* Petit message éphémère */
  GL.toast = function (msg) {
    let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); const st = document.createElement('style'); st.textContent = '.toast{position:fixed;left:50%;bottom:76px;transform:translate(-50%,20px);z-index:90;background:#1A1410;color:#F3EBDD;padding:14px 20px;border-radius:16px;font-weight:600;font-size:.92rem;max-width:min(520px,90vw);opacity:0;transition:opacity .35s,transform .5s cubic-bezier(.22,1,.36,1);box-shadow:0 20px 40px rgba(0,0,0,.25)}.toast.is-on{opacity:1;transform:translate(-50%,0)}'; document.head.appendChild(st); }
    t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 4200);
  };

  /* Chiffres qui défilent */
  GL.roll = function (el, to, opt = {}) {
    if (!el) return;
    if (calm || !hasGSAP) { el.textContent = opt.fmt ? opt.fmt(to) : to; return; }
    const o = { v: +(el.dataset.v || 0) };
    gsap.to(o, { v: to, duration: opt.d || 1.2, ease: 'power3.out', onUpdate() { el.textContent = opt.fmt ? opt.fmt(Math.round(o.v)) : Math.round(o.v); }, onComplete() { el.dataset.v = to; } });
  };
})();
