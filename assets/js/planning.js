/* Good Life — planning (démonstration) et réservation simulée */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const GL = window.GL, D = GL.data, $ = GL.$, $$ = GL.$$, G = window.gsap, motion = !GL.calm && !!G;
    const C = Object.fromEntries(D.cours.map(c => [c.id, c]));
    const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const dur = m => m >= 60 ? (m === 90 ? '1 h 30' : `${m / 60} h`) : `${m} min`;

    /* Date du jour au Gosier */
    const parts = {}; new Intl.DateTimeFormat('en-CA', { timeZone: D.club.fuseau, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).forEach(p => (parts[p.type] = p.value));
    const today = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
    const now = GL.now();

    /* Fenêtre glissante : les 6 prochains jours d'ouverture (lundi → samedi), à partir d'aujourd'hui */
    const days = [];
    for (let k = 0; days.length < 6 && k < 8; k++) {
      const d = new Date(today.getTime() + k * 864e5), wd = d.getUTCDay();
      if (wd === 0) continue;
      days.push({ k, wd, date: d, label: D.horaires[wd].jour, court: D.horaires[wd].court, num: `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`, today: k === 0 });
    }
    const slots = [];
    days.forEach((d, di) => D.planning.filter(s => s.jour === d.wd).forEach(s => {
      const c = C[s.cours], start = GL.toMin(s.h);
      slots.push({ id: `${di}-${s.h}-${s.cours}`, di, d, h: s.h, start, end: start + c.duree, c, abs: d.k * 1440 + start, past: d.today && start <= now.min });
    }));

    /* Jours et filtres */
    const dayBox = $('[data-days]'), fBox = $('[data-pfilters]'), week = $('[data-week]');
    const isWide = () => matchMedia('(min-width: 1000px)').matches;
    let selDay = isWide() ? 'all' : 0, selCat = 'tous';
    dayBox.innerHTML = `<button type="button" data-day="all">Semaine<small>6 jours</small></button>` + days.map((d, i) => `<button type="button" data-day="${i}" class="${d.today ? 'is-today' : ''}">${d.court}<small>${d.today ? "aujourd'hui" : d.num}</small></button>`).join('');
    fBox.innerHTML = D.categories.filter(c => c.id !== 'libre').map(c => `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === 'tous'}">${c.nom}</button>`).join('');

    week.innerHTML = days.map((d, i) => `
      <div class="col${d.today ? ' is-today' : ''}" data-col="${i}">
        <div class="col__head"><span>${d.label}</span><small>${d.num}</small></div>
        ${slots.filter(s => s.di === i).map(s => `
          <button type="button" class="slot${s.past ? ' is-past' : ''}" data-slot="${s.id}" data-cat="${s.c.cat}" ${s.past ? 'disabled aria-disabled="true"' : ''} aria-label="${s.c.nom}, ${d.label} ${GL.fmtH(s.h)}, ${dur(s.c.duree)}, ${s.c.prix} euros${s.past ? ', passé' : ''}">
            <span class="slot__time">${GL.fmtH(s.h)}</span>
            <span class="slot__name">${s.c.nom}</span>
            <span class="slot__meta"><span>${dur(s.c.duree)} · fin ${GL.fmtMin(s.end)}</span><b>${s.c.prix} €</b></span>
          </button>`).join('')}
        <p class="empty" hidden>Aucun cours de ce type ce jour-là.</p>
      </div>`).join('');

    const apply = () => {
      const st = motion && window.Flip ? Flip.getState('.slot, .col') : null;
      $$('button', dayBox).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.day === String(selDay))));
      $$('button', fBox).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === selCat)));
      week.classList.toggle('is-day', selDay !== 'all');
      $$('.col', week).forEach(col => {
        col.classList.toggle('is-hidden', selDay !== 'all' && col.dataset.col !== String(selDay));
        let n = 0; $$('.slot', col).forEach(s => { const hide = selCat !== 'tous' && s.dataset.cat !== selCat; s.classList.toggle('is-hidden', hide); if (!hide) n++; });
        $('.empty', col).hidden = n > 0;
      });
      if (st) Flip.from(st, { duration: .6, ease: 'power3.inOut', absolute: true, nested: true, onEnter: e => G.fromTo(e, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .45 }), onLeave: e => G.to(e, { opacity: 0, duration: .25 }), onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
    };
    dayBox.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; selDay = b.dataset.day === 'all' ? 'all' : +b.dataset.day; apply(); });
    fBox.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; selCat = b.dataset.cat; apply(); });
    apply();
    let wide = isWide(); addEventListener('resize', () => { if (isWide() !== wide) { wide = isWide(); if (!wide && selDay === 'all') { selDay = 0; apply(); } } });

    /* Prochain cours et compte à rebours */
    const nextBox = $('[data-next]');
    const paintNext = () => {
      const n = GL.now(), nowAbs = n.min;
      const nx = slots.find(s => s.abs > nowAbs);
      if (!nx) { nextBox.textContent = ''; return; }
      const diff = nx.abs - nowAbs, h = Math.floor(diff / 60), m = diff % 60;
      const when = nx.d.today ? "aujourd'hui" : nx.d.k === 1 ? 'demain' : nx.d.label.toLowerCase();
      nextBox.innerHTML = `<span>Prochain cours</span><strong>${nx.c.nom} · ${when} ${GL.fmtH(nx.h)}</strong><b>dans ${h ? h + ' h ' : ''}${String(m).padStart(2, '0')} min</b>`;
    };
    paintNext(); setInterval(paintNext, 30000);

    /* Catalogue */
    $('[data-catalog]').innerHTML = D.cours.map(c => `
      <article class="citem" data-reveal>
        <figure class="frame">${GL.img(c.img, c.nom, '110px')}</figure>
        <div>
          <h3>${c.nom}</h3>
          <p>${c.desc}</p>
          <div class="card__meta"><span class="chip">${dur(c.duree)}</span><span class="chip price">${c.prix} €</span>${c.site ? '<span class="chip">texte du club</span>' : ''}</div>
          <p style="margin-top:10px"><button class="link" type="button" data-book="${c.id}" style="background-color:transparent;border:0;cursor:pointer;padding:21px 0 3px">Réserver</button></p>
        </div>
      </article>`).join('');
    GL.reveals($('[data-catalog]'));

    /* ---------- Réservation simulée ---------- */
    const dr = $('#reserver'), body = $('[data-bk-body]'), next = $('[data-bk-next]'), back = $('[data-bk-back]'), stepName = $('[data-bk-stepname]'), bars = $$('.steps i', dr);
    const S = { step: 1, cours: null, slot: null, nom: '', tel: '', premiere: false };
    let opener = null;
    const libreSlots = () => {
      const out = [];
      days.forEach((d, di) => D.horaires[d.wd].plages.forEach(([a, b]) => {
        for (let t = GL.toMin(a); t + 90 <= GL.toMin(b); t += 60) if (!(d.today && t <= now.min)) out.push({ id: `L${di}-${t}`, di, d, h: `${Math.floor(t / 60)}:${t % 60}`, start: t, end: t + 90, c: C.libre });
      }));
      return out.slice(0, 10);
    };
    const slotsFor = id => id === 'libre' ? libreSlots() : slots.filter(s => s.c.id === id && !s.past);
    const when = s => `${s.d.today ? "Aujourd'hui" : s.d.label} ${s.d.num} · ${GL.fmtH(s.h)}`;

    function render() {
      bars.forEach((b, i) => b.classList.toggle('is-done', i < S.step));
      back.style.visibility = S.step === 1 || S.step === 3 ? 'hidden' : 'visible';
      if (S.step === 1) {
        stepName.textContent = 'Étape 1 sur 3 · le cours et le créneau';
        const list = S.cours ? slotsFor(S.cours) : [];
        body.innerHTML = `
          <div class="field"><label for="bk-cours">Cours</label>
            <select id="bk-cours">${['<option value="">Choisir un cours</option>'].concat(D.cours.map(c => `<option value="${c.id}" ${S.cours === c.id ? 'selected' : ''}>${c.nom} · ${dur(c.duree)} · ${c.prix} €</option>`)).join('')}</select></div>
          ${S.cours ? `<p style="font-weight:650;margin:18px 0 10px">Créneaux disponibles <span class="demo-flag" style="margin-left:6px;font-size:.66rem">démo</span></p>
          <div class="opt-grid">${list.length ? list.map(s => `<button type="button" class="opt" data-pick="${s.id}" aria-pressed="${S.slot && S.slot.id === s.id}"><span><strong>${when(s)}</strong><br><small>${dur(s.c.duree)}, fin ${GL.fmtMin(s.end)}</small></span><b>${s.c.prix} €</b></button>`).join('') : '<p class="empty">Pas de créneau dans les 6 prochains jours.</p>'}</div>` : '<p class="muted">Choisissez un cours pour voir ses prochains créneaux.</p>'}`;
        $('#bk-cours').addEventListener('change', e => { S.cours = e.target.value || null; S.slot = null; render(); });
        $$('[data-pick]', body).forEach(b => b.addEventListener('click', () => { S.slot = list.find(s => s.id === b.dataset.pick); $$('[data-pick]', body).forEach(x => x.setAttribute('aria-pressed', String(x === b))); next.disabled = false; GL.sound.beep(740, .05, .04); }));
        next.textContent = 'Continuer'; next.disabled = !S.slot;
      }
      if (S.step === 2) {
        stepName.textContent = 'Étape 2 sur 3 · vos coordonnées';
        body.innerHTML = `
          <div class="ticket" style="margin-bottom:22px"><b>${S.slot.c.prix} €</b><span>${S.slot.c.nom}</span><small>${when(S.slot)} · ${dur(S.slot.c.duree)}</small></div>
          <div class="field"><label for="bk-nom">Prénom et nom</label><input id="bk-nom" autocomplete="name" value="${S.nom}" required></div>
          <div class="field"><label for="bk-tel">Téléphone</label><input id="bk-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="06 90 00 00 00" value="${S.tel}" required></div>
          <label style="display:flex;gap:10px;align-items:center;font-weight:600"><input type="checkbox" id="bk-first" ${S.premiere ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--green)"> C'est ma première séance au club</label>
          <p class="muted" style="font-size:.85rem;margin-top:18px">Simulation : rien n'est envoyé ni enregistré.</p>`;
        const v = () => { S.nom = $('#bk-nom').value.trim(); S.tel = $('#bk-tel').value.trim(); S.premiere = $('#bk-first').checked; next.disabled = !(S.nom.length > 1 && S.tel.replace(/\D/g, '').length >= 10); };
        $$('input', body).forEach(i => i.addEventListener('input', v)); v();
        next.textContent = 'Confirmer (simulation)';
        setTimeout(() => $('#bk-nom').focus(), 60);
      }
      if (S.step === 3) {
        stepName.textContent = 'Étape 3 sur 3 · confirmation simulée';
        const code = 'GL-' + Math.random().toString(36).slice(2, 7).toUpperCase();
        body.innerHTML = `
          <div class="printer"><div class="receipt" data-receipt>
            <strong style="font-family:var(--font-d);font-size:1.4rem;letter-spacing:-.02em">Good Life Sport's Club</strong>
            <div class="muted" style="font-size:.82rem">104 route de Montauban · Le Gosier</div>
            <dl><dt>Cours</dt><dd>${S.slot.c.nom}</dd><dt>Quand</dt><dd>${when(S.slot)}</dd><dt>Durée</dt><dd>${dur(S.slot.c.duree)}</dd><dt>Nom</dt><dd>${S.nom.replace(/</g, '&lt;')}</dd>${S.premiere ? '<dt>Note</dt><dd>Première séance</dd>' : ''}<dt>Prix</dt><dd>${S.slot.c.prix} €</dd></dl>
            <div class="code">${code} · SIMULATION</div>
          </div></div>
          <p style="margin-top:26px;font-weight:600">Réservation simulée : aucune demande n'a été envoyée au club.</p>
          <p class="muted">Pour réserver vraiment : <a href="${D.club.reservationReelle}" target="_blank" rel="noopener">site actuel du club</a> ou ${D.club.mobile}.</p>
          <p><button type="button" class="link" data-again style="background-color:transparent;border:0;cursor:pointer;padding:0 0 3px">Réserver une autre séance</button></p>`;
        const rc = $('[data-receipt]');
        if (motion) G.to(rc, { y: 0, yPercent: 0, duration: 2, ease: 'steps(14)' }); else rc.style.transform = 'none';
        if (GL.sound.on) { let k = 0; const iv = setInterval(() => { GL.sound.beep(1800 + (k % 2) * 200, .02, .03, 'square'); if (++k > 13) clearInterval(iv); }, 140); }
        $('[data-again]').addEventListener('click', () => { Object.assign(S, { step: 1, cours: null, slot: null }); render(); });
        next.textContent = 'Fermer'; next.disabled = false;
      }
    }
    next.addEventListener('click', () => { if (S.step === 3) return close(); S.step++; render(); });
    back.addEventListener('click', () => { S.step = Math.max(1, S.step - 1); render(); });

    const focusables = () => $$('button:not([disabled]), select, input, a[href]', dr).filter(e => e.offsetParent !== null);
    const trap = e => {
      if (e.key === 'Escape') return close();
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    function open(coursId, slotId, from) {
      opener = from || document.activeElement;
      Object.assign(S, { step: 1, cours: coursId || null, slot: null });
      if (slotId) { const s = slots.find(x => x.id === slotId); if (s) { S.cours = s.c.id; S.slot = s; } }
      render();
      dr.classList.add('is-open'); dr.removeAttribute('inert'); GL.lenis && GL.lenis.stop();
      document.addEventListener('keydown', trap);
      setTimeout(() => (S.slot ? next : $('#bk-cours')).focus(), 80);
      if (motion) G.from($$('.drawer__body > *', dr), { y: 24, opacity: 0, stagger: .05, duration: .6, ease: 'power3.out', delay: .2 });
    }
    function close() {
      dr.classList.remove('is-open'); dr.setAttribute('inert', ''); GL.lenis && GL.lenis.start();
      document.removeEventListener('keydown', trap);
      if (location.hash === '#reserver') history.replaceState(null, '', location.pathname + location.search);
      opener && opener.focus && opener.focus();
    }
    $$('[data-bk-close]', dr).forEach(b => b.addEventListener('click', close));
    document.addEventListener('click', e => {
      const sl = e.target.closest('[data-slot]'); if (sl && !sl.disabled) { open(null, sl.dataset.slot, sl); return; }
      const bk = e.target.closest('[data-book]'); if (bk) { open(bk.dataset.book, null, bk); return; }
      const a = e.target.closest('a[href="#reserver"], [data-open-booking]');
      if (a) { e.preventDefault(); e.stopPropagation(); open(null, null, a); }
    }, true);
    const q = new URLSearchParams(location.search).get('cours');
    if (location.hash === '#reserver' || q) setTimeout(() => open(C[q] ? q : null), GL.calm ? 50 : 900);

    /* Entrées animées */
    if (motion) GL.events.addEventListener('ready', () => {
      G.from('.banner', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', delay: .2 });
      $$('.col', week).forEach((c, i) => G.from($$('.col__head, .slot', c), { y: 50, opacity: 0, stagger: .06, duration: .8, ease: 'power3.out', delay: i * .06, scrollTrigger: { trigger: week, start: 'top 85%' } }));
      ScrollTrigger.sort(); ScrollTrigger.refresh();
    }, { once: true });
  });
})();
