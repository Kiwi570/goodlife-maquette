/* Good Life — tarifs, calculateur et Espace Performance */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const GL = window.GL, D = GL.data, $ = GL.$, $$ = GL.$$, G = window.gsap, motion = !GL.calm && !!G;
    const by = f => D.cours.filter(f).map(c => c.nom);
    const cards = [
      { prix: 10, nom: 'Cours collectif', duree: '1 h', liste: by(c => c.prix === 10 && c.duree === 60) },
      { prix: 15, nom: 'Pilates · Yoga', duree: '1 h', liste: by(c => c.prix === 15) },
      { prix: 10, nom: 'Le challenge du coach', duree: '45 min', liste: ['Cross training façon boot camp'] },
      { prix: 10, nom: 'Séance libre', duree: '1 h 30', liste: ['Accès cardio et musculation', "À l'heure de votre choix pendant les horaires"] }
    ];
    $('[data-prices]').innerHTML = cards.map((c, i) => `
      <article class="pcard" data-pcard>
        <div class="pcard__face">
          <button class="flip" type="button" aria-label="Voir les cours : ${c.nom}" data-flip>↻</button>
          <b class="num">${c.prix} €</b>
          <div><h3>${c.nom}</h3><p class="muted">${c.duree} · la séance</p></div>
        </div>
        <div class="pcard__face pcard__back">
          <button class="flip" type="button" aria-label="Revenir au prix" data-flip>↻</button>
          <div><p style="font-weight:700;margin-bottom:10px">Cours concernés</p><ul style="margin:0;padding-left:18px;display:grid;gap:4px">${c.liste.map(x => `<li>${x}</li>`).join('')}</ul></div>
          <a class="btn btn--sand" href="planning.html#reserver">Réserver</a>
        </div>
      </article>`).join('');
    if (!motion) document.documentElement.classList.add('no-flip');
    $$('[data-pcard]').forEach(card => {
      let back = false;
      const faceBack = $('.pcard__back', card), faceFront = $('.pcard__face:not(.pcard__back)', card);
      const setA11y = () => { faceBack.toggleAttribute('inert', !back && motion); faceFront.toggleAttribute('inert', back && motion); };
      setA11y();
      card.addEventListener('click', e => { if (!e.target.closest('[data-flip]') || !motion) return; back = !back; setA11y(); G.to(card, { rotationY: back ? 180 : 0, duration: .9, ease: 'power3.inOut' }); GL.sound.beep(back ? 620 : 520, .05, .04); setTimeout(() => $('[data-flip]', back ? faceBack : faceFront).focus(), 450); });
    });

    $('[data-abos]').innerHTML = D.abonnements.map(a => `<div class="opt" style="cursor:default"><span><strong>${a.nom}</strong><br><small>${a.detail}</small></span>${a.prix ? `<b>${a.prix} €</b>` : '<span class="todo">À compléter</span>'}</div>`).join('');
    $('[data-coach]').innerHTML = D.coaching.map(c => `<div class="opt" style="cursor:default"><span><strong>${c.nom}</strong><br><small>Good Life Coaching</small></span>${c.prix ? `<b>${c.prix} €</b>` : '<span class="todo">À compléter</span>'}</div>`).join('') + `<p style="margin-top:12px"><a class="btn magnet" href="tel:+590690674047">Demander les tarifs du coaching</a></p>`;

    /* Calculateur (prix réels du site, estimation sur 4 semaines) */
    const P = { col: 10, zen: 15, lib: 10 }, N = { col: 2, zen: 1, lib: 0 };
    const tot = $('[data-total]'), cnt = $('[data-count]');
    const paint = () => {
      Object.keys(N).forEach(k => ($(`[data-out="${k}"]`).textContent = N[k]));
      const s = (N.col + N.zen + N.lib) * 4, t = (N.col * P.col + N.zen * P.zen + N.lib * P.lib) * 4;
      GL.roll(tot, t, { d: .8 }); cnt.textContent = `${s} séance${s > 1 ? 's' : ''}`;
    };
    $('[data-calc]').addEventListener('click', e => {
      const b = e.target.closest('[data-inc],[data-dec]'); if (!b) return;
      const k = b.dataset.inc || b.dataset.dec; N[k] = Math.max(0, Math.min(7, N[k] + (b.dataset.inc ? 1 : -1)));
      GL.sound.beep(b.dataset.inc ? 700 : 500, .04, .04); paint();
      if (motion) G.fromTo(b.parentElement.querySelector('output'), { scale: 1.5 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
    });
    tot.dataset.v = 0; paint();

    /* Espace Performance : jauge et demande simulée */
    const h = $('[data-h]'), out = $('[data-h-out]'), gauge = $('[data-gauge]'), pt = $('[data-perf-total]');
    const ph = () => { const v = +h.value; out.textContent = `${v} h`; gauge.style.width = `${(v / 6) * 100}%`; GL.roll(pt, v * D.espacePerformance.prixDes, { d: .6 }); };
    h.addEventListener('input', ph); pt.dataset.v = 0; ph();
    $('[data-perf-form]').addEventListener('submit', e => { e.preventDefault(); GL.toast(`Demande simulée pour ${h.value} h : rien n'a été envoyé. Pour réserver : ${D.club.mobile}.`); GL.sound.beep(880, .1, .06); });

    const si = $('[data-status-inline]'); if (si) si.textContent = GL.status().text;

    if (motion) GL.events.addEventListener('ready', () => {
      G.from('[data-pcard]', { rotationY: -180, opacity: 0, duration: 1.2, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '[data-prices]', start: 'top 80%' } });
      G.from('[data-abos] .opt, [data-coach] .opt', { x: -30, opacity: 0, stagger: .07, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '#formules', start: 'top 80%' } });
      G.fromTo('[data-beam]', { xPercent: -60 }, { xPercent: 60, ease: 'none', scrollTrigger: { trigger: '#espace-performance', start: 'top bottom', end: 'bottom top', scrub: true } });
      G.from('[data-calc]', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '[data-calc]', start: 'top 85%' } });
      ScrollTrigger.sort(); ScrollTrigger.refresh();
    }, { once: true });
  });
})();
