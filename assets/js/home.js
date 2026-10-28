/* Good Life — page d'accueil */
(function () {
  const ICONS = {
    kettlebell: '<path d="M-8,-13 C-8,-22 8,-22 8,-13" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M-11,-6 C-14,-15 14,-15 11,-6 C15,1 12,8 9,10 L-9,10 C-12,8 -15,1 -11,-6Z" fill="currentColor"/>',
    balance: '<circle cx="0" cy="-12" r="3" fill="currentColor"/><path d="M0,-8 L0,3 M-11,-6 L11,-6 M0,3 L0,13 M0,3 L7,-1" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>',
    step: '<path d="M-14,8 L14,8 L10,1 L-10,1Z" fill="currentColor"/><path d="M-6,-3 c2,-7 9,-8 14,-4 l1,4Z" fill="currentColor"/>',
    chrono: '<circle cx="0" cy="2" r="11" fill="none" stroke="currentColor" stroke-width="3"/><path d="M0,2 L0,-4 M-3,-13 L3,-13 M0,-13 L0,-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    plank: '<circle cx="-11" cy="-3" r="3" fill="currentColor"/><path d="M-7,-1 L12,4 M-8,0 L-8,8 M12,4 L14,8" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>',
    dumbbell: '<rect x="-7" y="-2" width="14" height="4" rx="2" fill="currentColor"/><rect x="-14" y="-8" width="6" height="16" rx="2" fill="currentColor"/><rect x="8" y="-8" width="6" height="16" rx="2" fill="currentColor"/>',
    ring: '<circle cx="0" cy="0" r="11" fill="none" stroke="currentColor" stroke-width="3.2"/><rect x="-14" y="-3" width="5" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="-3" width="5" height="6" rx="1.5" fill="currentColor"/>',
    sun: '<circle cx="0" cy="0" r="6" fill="currentColor"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M0,-14 v4 M0,10 v4 M-14,0 h4 M10,0 h4 M-10,-10 l3,3 M7,7 l3,3 M10,-10 l-3,3 M-7,7 l-3,3"/></g>',
    rope: '<path d="M-14,4 C-8,-10 -2,12 4,-2 S12,-8 14,-4" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'
  };
  const icon = k => `<svg viewBox="-28 -24 56 70" aria-hidden="true"><line x1="0" y1="-24" x2="0" y2="2" stroke="#F3EBDD" stroke-width="2"/><circle cx="0" cy="22" r="20" fill="#F3EBDD"/><g transform="translate(0,22)" style="color:#1A1410">${ICONS[k] || ICONS.kettlebell}</g></svg>`;

  document.addEventListener('DOMContentLoaded', () => {
    const GL = window.GL, D = GL.data, $ = GL.$, $$ = GL.$$, calm = GL.calm, G = window.gsap;
    const motion = !calm && !!G;

    /* ---- Feuilles du rideau (textures WebGL ou version sans WebGL) ---- */
    const fb = $('[data-leaves-fallback]');
    const mk = () => { const c = document.createElement('canvas'); fb.appendChild(c); return c; };
    const L = mk(), R = mk(), T = mk();
    const drawHero = () => {
      const r = $('[data-hero]').getBoundingClientRect(), s = innerWidth < 700 ? .9 : .75, dpr = Math.min(devicePixelRatio || 1, 2) * s;
      [L, R, T].forEach(c => { c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr); });
      const small = innerWidth < 700;
      GL.drawLeaves(L, { region: 'left', count: small ? 7 : 9, reach: small ? .62 : .5, width: .085, seed: 4, light: true });
      GL.drawLeaves(R, { region: 'right', count: small ? 7 : 9, reach: small ? .62 : .5, width: .085, seed: 9, light: true });
      GL.drawLeaves(T, { region: 'top', count: small ? 5 : 8, reach: .42, width: .07, seed: 15, light: true });
      GL.events.dispatchEvent(new Event('leaves-redrawn'));
    };
    drawHero();
    GL.heroLeaves = { L, R, T };
    GL.heroIntro = { v: calm ? 1 : 0 };
    const glOk = (() => { if (calm || document.documentElement.classList.contains('no-gl')) return false; try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
    if (!glOk) document.documentElement.classList.add('no-gl');
    GL.events.dispatchEvent(new Event('hero-leaves'));
    let rto; addEventListener('resize', () => { clearTimeout(rto); rto = setTimeout(drawHero, 350); });

    const setFallback = p => {
      if (!G) return;
      const o = p * p * (3 - 2 * p), c = 1 - GL.heroIntro.v;
      G.set(L, { xPercent: -64 * o + 20 * c, scale: 1 + .5 * o, transformOrigin: '0% 50%' });
      G.set(R, { xPercent: 64 * o - 20 * c, scale: 1 + .5 * o, transformOrigin: '100% 50%' });
      G.set(T, { yPercent: -62 * o + 14 * c, scale: 1 + .5 * o, transformOrigin: '50% 0%' });
    };

    /* ---- Disciplines : filtres et cartes ---- */
    const track = $('[data-htrack]'), filters = $('[data-filters]');
    D.categories.forEach((c, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c.nom; b.dataset.cat = c.id; b.setAttribute('aria-pressed', String(i === 0)); filters.appendChild(b); });
    track.innerHTML = D.cours.map(c => `
      <article class="card" data-cat="${c.cat}">
        <div class="card__icon" data-pendulum>${icon(c.icone)}</div>
        <div class="card__in">
          <figure class="frame">${GL.img(c.img, c.nom, '(min-width: 900px) 26vw, 80vw')}</figure>
          <div class="card__body">
            <div class="card__meta"><span class="chip">${c.duree >= 60 ? (c.duree / 60 === 1.5 ? '1 h 30' : `${c.duree / 60} h`) : `${c.duree} min`}</span><span class="chip price">${c.prix} €</span></div>
            <h3>${c.nom}</h3>
            <p>${c.desc}</p>
            <div class="card__cta"><a class="btn" href="planning.html?cours=${c.id}#reserver" data-cursor="Réserver">Réserver</a></div>
          </div>
        </div>
      </article>`).join('');
    const cards = $$('.card', track);
    filters.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('button', filters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const cat = b.dataset.cat;
      const state = motion && window.Flip ? Flip.getState(cards) : null;
      cards.forEach(c => c.classList.toggle('is-hidden', cat !== 'tous' && c.dataset.cat !== cat));
      if (state) Flip.from(state, { duration: .7, ease: 'power3.inOut', scale: true, absolute: false, onEnter: els => G.fromTo(els, { opacity: 0, scale: .8 }, { opacity: 1, scale: 1, duration: .5 }), onLeave: els => G.to(els, { opacity: 0, scale: .8, duration: .3 }), onComplete: () => ScrollTrigger.refresh() });
      else if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    if (motion && GL.finePointer) cards.forEach(card => {
      const inner = $('.card__in', card), ic = $('[data-pendulum]', card);
      card.addEventListener('pointermove', e => { const r = card.getBoundingClientRect(); inner.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 12}deg`); inner.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - .5) * 10}deg`); });
      card.addEventListener('pointerleave', () => { inner.style.setProperty('--rx', '0deg'); inner.style.setProperty('--ry', '0deg'); });
      card.addEventListener('pointerenter', e => { const r = card.getBoundingClientRect(); const dir = e.clientX < r.left + r.width / 2 ? 1 : -1; G.fromTo(ic, { rotation: 32 * dir }, { rotation: 0, duration: 2.4, ease: 'elastic.out(1.1, .16)', overwrite: true }); });
    });

    /* ---- Coaching : piles de disques ---- */
    $('[data-plans]').innerHTML = D.coaching.map(p => `
      <article class="plan" data-plan>
        <div class="stack" aria-hidden="true">${'<i class="plate"></i>'.repeat(p.seances)}</div>
        <h3 class="h3">${p.nom}</h3>
        <p>${p.prix ? p.prix + ' €' : '<span class="todo">Tarif à compléter</span>'}</p>
        <a class="btn ${p.seances === 1 ? '' : 'btn--sand'}" href="tel:+590690674047">Demander le tarif</a>
      </article>`).join('');

    /* ---- Horaires ---- */
    const order = [1, 2, 3, 4, 5, 6, 0];
    $('[data-hours] tbody').innerHTML = order.map(d => { const h = D.horaires[d]; return `<tr data-today-row="${d}"><th scope="row">${h.jour}</th><td>${h.plages.length ? h.plages.map(([a, b]) => `${GL.fmtH(a)} – ${GL.fmtH(b)}`).join(' · ') : 'Fermé'}</td></tr>`; }).join('');
    $('[data-confirm]').outerHTML = D.aConfirmer.map(x => `<span class="todo">${x}</span>`).join('');
    GL.paintStatus();

    /* ---- Zen : respiration ---- */
    const bc = $('[data-breath-circle]'), bl = $('[data-breath-label]');
    if (motion) {
      const tl = G.timeline({ repeat: -1 });
      tl.call(() => (bl.textContent = 'Inspirez')).to(bc, { scale: 1, duration: 4, ease: 'sine.inOut' })
        .call(() => (bl.textContent = 'Expirez')).to(bc, { scale: .6, duration: 4, ease: 'sine.inOut' });
    } else if (bc) { bc.style.transform = 'scale(.85)'; bl.textContent = 'Respirez'; }

    /* Tout ce qui suit : uniquement avec le mouvement actif */
    if (!motion) { setFallback(.32); return; }
    GL.events.addEventListener('ready', run, { once: true });
    GL.events.addEventListener('intro-out', heroIn, { once: true });
    let heroDone = false;

    function heroIn() {
      if (heroDone) return; heroDone = true;
      const title = $('[data-hero-title]');
      const split = window.SplitText ? SplitText.create(title, { type: 'chars', mask: 'chars' }) : null;
      const tl = G.timeline({ defaults: { ease: 'power4.out' } });
      tl.to(GL.heroIntro, { v: 1, duration: 1.8, ease: 'power3.out', onUpdate: () => setFallback(GL.heroProgress) }, 0);
      if (split) tl.from(split.chars, { yPercent: 115, duration: 1.1, stagger: .035 }, .15);
      tl.from($$('[data-hero-fade]'), { y: 30, opacity: 0, duration: .9, stagger: .1 }, .55)
        .from('.hero__top', { opacity: 0, y: -10, duration: .6 }, .6)
        .from('[data-bar]', { scaleX: 0, duration: .7, ease: 'power3.inOut' }, .5)
        .from('[data-disc]', { y: () => -innerHeight, rotation: -200, duration: 1.3, ease: 'bounce.out' }, .75)
        .add(() => GL.sound.beep(220, .18, .08, 'triangle'), 1.4);
    }

    function run() {
      if (!GL.introDone || !$('.intro')) heroIn();
      /* Ouverture : rideau qui s'écarte, titre qui se comprime */
      const titleLine = $('.hero__title .line'), tw = { w: 100 };
      document.documentElement.classList.add('hero-pinned'); /* l'espace réservé en CSS est repris par l'épinglage, sans saut */
      G.timeline({ scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: '+=110%', pin: true, scrub: true, onUpdate: s => { GL.heroProgress = s.progress; setFallback(s.progress); } } })
        .to(tw, { w: 75, ease: 'none', onUpdate: () => (titleLine.style.fontVariationSettings = `"wdth" ${tw.w.toFixed(1)}, "opsz" 96`) }, 0)
        .to('.hero__content', { yPercent: -18, ease: 'none' }, 0)
        .to('[data-hero-fade]', { opacity: 0, ease: 'none', duration: .5 }, .2)
        .to('[data-disc]', { x: () => -innerWidth * .9, rotation: -540, ease: 'none' }, 0)
        .to('[data-bar]', { scaleX: 0, ease: 'none', duration: .6 }, .4)
        .to('.hero__shade', { opacity: .5, ease: 'none' }, 0);

      /* Bandeau qui suit la vitesse du défilement */
      const mt = $('[data-marquee]'); mt.innerHTML += mt.innerHTML;
      const loop = G.to(mt, { xPercent: -50, ease: 'none', duration: 28, repeat: -1 });
      let dir = 1;
      ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onUpdate: s => { const v = s.getVelocity(); if (v) dir = v > 0 ? 1 : -1; G.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 260, 6)), duration: .25, overwrite: true }); G.to(loop, { timeScale: dir, duration: 1.2, delay: .25 }); } });

      /* À la séance : compteur et tickets */
      ScrollTrigger.create({ trigger: '[data-roll-price]', start: 'top 85%', once: true, onEnter: () => GL.roll($('[data-roll-price]'), 10, { d: 1.6, fmt: v => String(v).padStart(2, '0') }) });
      G.from('[data-tickets] .ticket', { rotateX: -80, y: 40, opacity: 0, stagger: .14, duration: 1.1, ease: 'back.out(1.6)', scrollTrigger: { trigger: '[data-tickets]', start: 'top 85%' } });
      $$('[data-tickets] .ticket').forEach((t, i) => G.to(t, { rotation: [-2.5, 1.5, -1][i], y: [-6, 4, -2][i], ease: 'none', scrollTrigger: { trigger: t, start: 'top 60%', end: 'bottom 10%', scrub: true } }));

      /* Disciplines : galerie horizontale épinglée */
      const mm = G.matchMedia();
      mm.add('(min-width: 900px)', () => {
        document.documentElement.classList.add('pinned-h');
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tw2 = G.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.disciplines', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .6, invalidateOnRefresh: true, onUpdate: s => G.set('[data-hbar]', { scaleX: s.progress }) } });
        return () => { document.documentElement.classList.remove('pinned-h'); tw2.scrollTrigger && tw2.scrollTrigger.kill(); G.set(track, { x: 0 }); };
      });
      mm.add('(max-width: 899px)', () => {
        const w = $('[data-hwrap]'); const f = () => G.set('[data-hbar]', { scaleX: w.scrollLeft / Math.max(1, w.scrollWidth - w.clientWidth) }); w.addEventListener('scroll', f, { passive: true });
        return () => w.removeEventListener('scroll', f);
      });
      G.from(cards, { y: 80, opacity: 0, stagger: .06, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: track, start: 'top 85%' } });

      /* H.I.I.T : chrono piloté par le défilement (3 rounds de 20 s / 10 s) */
      const sec = $('[data-hiit]'), num = $('[data-chrono-num]'), ph = $('[data-chrono-phase]'), rd = $('[data-chrono-round]'), ring = $('[data-ring]');
      let lastPhase = 'work', lastSwitch = 0, lastNum = 20;
      G.to('.hiit__bg img', { scale: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      ScrollTrigger.create({
        trigger: sec, start: 'top top', end: '+=160%', pin: true, scrub: true,
        onUpdate: s => {
          const t = Math.min(89.999, s.progress * 90), round = Math.floor(t / 30), r = t % 30;
          const work = r < 20, left = Math.ceil(work ? 20 - r : 30 - r), frac = work ? r / 20 : (r - 20) / 10;
          ring.style.strokeDashoffset = String(frac * 100);
          if (left !== lastNum) { num.textContent = left; if (left <= 3) GL.sound.beep(work ? 660 : 440, .06, .04); lastNum = left; }
          rd.textContent = `Round ${round + 1} / 3`;
          const phase = work ? 'work' : 'rest', now = performance.now();
          if (phase !== lastPhase && now - lastSwitch > 500) {
            lastPhase = phase; lastSwitch = now;
            sec.classList.toggle('is-work', work); sec.classList.toggle('is-rest', !work);
            ph.textContent = work ? 'Effort' : 'Récup';
            work ? (GL.sound.beep(988, .12, .09), setTimeout(() => GL.sound.beep(988, .12, .09), 160)) : GL.sound.beep(392, .3, .08, 'triangle');
          }
        }
      });

      /* Zen : défilement ralenti et image qui ondule */
      if (GL.lenis) ScrollTrigger.create({ trigger: '[data-zen]', start: 'top 60%', end: 'bottom 40%', onToggle: s => (GL.lenis.options.lerp = s.isActive ? .05 : .1) });
      const wi = $('[data-wave-img]'), wm = $('[data-wave-map]'), wt = $('[data-wave-turb]');
      if (wi && wm) {
        const w = { s: 0, f: .012 };
        const paint = () => { wm.setAttribute('scale', w.s.toFixed(2)); wt.setAttribute('baseFrequency', `${w.f.toFixed(4)} ${(w.f * 2.4).toFixed(4)}`); };
        wi.addEventListener('pointerenter', () => G.to(w, { s: 22, f: .02, duration: 1.2, ease: 'sine.out', onUpdate: paint }));
        wi.addEventListener('pointerleave', () => G.to(w, { s: 0, f: .012, duration: 1.4, ease: 'sine.inOut', onUpdate: paint }));
        G.fromTo(w, { s: 26 }, { s: 0, duration: 2.4, ease: 'sine.out', onUpdate: paint, scrollTrigger: { trigger: wi, start: 'top 75%' } });
      }

      G.fromTo('.zen__float', { yPercent: 25, rotation: 6 }, { yPercent: -25, rotation: -2, ease: 'none', scrollTrigger: { trigger: '[data-zen]', start: 'top bottom', end: 'bottom top', scrub: true } });

      /* Coaching : disques qui tombent sur la pile */
      $$('[data-plan]').forEach((p, i) => G.from($$('.plate', p), { y: -260, opacity: 0, duration: 1.1, ease: 'bounce.out', stagger: .18, delay: i * .15, scrollTrigger: { trigger: p, start: 'top 80%' } }));

      /* Espace Performance : balayage de lumière */
      G.fromTo('[data-beam]', { xPercent: -60 }, { xPercent: 60, ease: 'none', scrollTrigger: { trigger: '.perf__media', start: 'top bottom', end: 'bottom top', scrub: true } });
      G.from('.perf__media img', { filter: 'brightness(.25)', duration: 1.6, ease: 'power2.out', scrollTrigger: { trigger: '.perf__media', start: 'top 75%' } });
      ScrollTrigger.create({ trigger: '[data-roll-perf]', start: 'top 85%', once: true, onEnter: () => { const e = $('[data-roll-perf]'); e.dataset.v = 0; GL.roll(e, 5, { d: 1.4 }); } });

      /* La salle : parallaxe de la mosaïque */
      $$('[data-mosaic] .frame').forEach((f, i) => {
        G.from(f, { y: 60 + (i % 3) * 30, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 92%' } });
        G.fromTo($('img', f), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* Kids moov & Power dance : cartes qui rebondissent */
      $$('[data-bounce]').forEach((c, i) => G.from(c, { y: 120, rotation: i ? 4 : -4, opacity: 0, duration: 1.3, ease: 'back.out(2.2)', scrollTrigger: { trigger: c, start: 'top 88%' } }));

      /* Accès : la route se dessine jusqu'au 104 */
      const route = $('[data-route]');
      G.fromTo(route, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '[data-map]', start: 'top 80%', end: 'center 45%', scrub: true } });
      G.from('[data-pin]', { y: -120, opacity: 0, duration: 1, ease: 'bounce.out', scrollTrigger: { trigger: '[data-map]', start: 'center 60%' } });
      G.from('[data-clinic]', { scale: 0, transformOrigin: '50% 50%', duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: '[data-map]', start: 'top 60%' } });
      G.from('[data-hours] tr', { x: -30, opacity: 0, stagger: .06, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: '[data-hours]', start: 'top 85%' } });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    }
  });
})();
