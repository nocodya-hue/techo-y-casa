// Techo & Casa · interacción: cabecera, menú, parallax de la portada y de las fotos, manifiesto que se enciende,
// obra del tejado fotograma a fotograma con el scroll, cifras, antes/después, vídeos al verse y apariciones.
(() => {
  const d = document, reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  // menú del móvil
  const btn = d.querySelector('[data-menu]'), panel = d.querySelector('[data-menu-panel]');
  if (btn && panel) {
    const poner = (abrir) => { btn.setAttribute('aria-expanded', abrir); btn.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú'); panel.hidden = !abrir; d.body.classList.toggle('menu-abierto', abrir); };
    btn.addEventListener('click', () => poner(btn.getAttribute('aria-expanded') !== 'true'));
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) poner(false); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') poner(false); });
  }

  // ---------- la obra del tejado: 90 fotogramas que avanzan con el scroll ----------
  const sec = d.querySelector('[data-scrub]');
  const scrub = sec && (() => {
    const lienzo = sec.querySelector('canvas'), ctx = lienzo.getContext('2d'), casa = lienzo.parentElement;
    const n = +sec.dataset.n, dur = +sec.dataset.dur, fases = [...sec.querySelectorAll('.fases li')], ts = fases.map((li) => +li.dataset.t);
    const num = sec.querySelector('[data-fase-n]');
    const fotos = new Array(n); let pedido = false, actual = -1, ancho = 0;
    const pedir = () => {
      if (pedido) return; pedido = true;
      const w = casa.clientWidth * Math.min(devicePixelRatio || 1, 2) > 520 ? 720 : 480;
      // primero uno de cada ocho, luego se rellenan los huecos: el scroll funciona desde el primer momento
      const orden = []; for (const paso of [8, 4, 2, 1]) for (let i = 0; i < n; i += paso) if (!orden.includes(i)) orden.push(i);
      let k = 0;
      const sig = () => {
        if (k >= orden.length) return;
        const i = orden[k++], im = new Image();
        im.decoding = 'async';
        im.onload = () => { fotos[i] = im; if (actual < 0 || Math.abs(i - objetivo) < Math.abs(actual - objetivo)) pintar(objetivo, true); sig(); };
        im.onerror = sig;
        im.src = `${sec.dataset.base}${w}/${String(i + 1).padStart(3, '0')}.webp`;
      };
      for (let c = 0; c < 4; c++) sig();
    };
    let objetivo = 0;
    const cercano = (i) => { for (let r = 0; r < n; r++) { if (fotos[i - r]) return i - r; if (fotos[i + r]) return i + r; } return -1; };
    const pintar = (i, forzar) => {
      const j = cercano(i); if (j < 0 || (j === actual && !forzar)) return;
      const dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(casa.clientWidth * dpr), H = Math.round(casa.clientHeight * dpr);
      if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
      const im = fotos[j], e = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * e, h = im.naturalHeight * e;
      ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); actual = j; casa.classList.add('pinta');
    };
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && pedir(), { rootMargin: '150% 0px' }).observe(sec);
    else pedir();
    addEventListener('resize', () => { if (casa.clientWidth !== ancho) { ancho = casa.clientWidth; pintar(objetivo, true); } });
    return (vh) => {
      const r = sec.getBoundingClientRect(); if (r.bottom < -vh || r.top > vh * 2) return;
      const p = lim(-r.top / Math.max(1, r.height - vh)), t = p * dur;
      objetivo = Math.round(p * (n - 1)); pintar(objetivo);
      let activa = 0;
      fases.forEach((li, i) => {
        const ini = ts[i], fin = i < ts.length - 1 ? ts[i + 1] : dur, dentro = t >= ini && (t < fin || i === ts.length - 1);
        if (dentro) activa = i;
        li.classList.toggle('activa', dentro); li.classList.toggle('hecha', t >= fin && i < ts.length - 1);
        li.querySelector('i').style.setProperty('--p', dentro ? lim((t - ini) / (fin - ini)).toFixed(3) : 0);
      });
      if (num) num.textContent = String(activa + 1).padStart(2, '0');
    };
  })();

  // ---------- todo lo que depende del scroll, en un solo fotograma ----------
  const cab = d.querySelector('[data-cab]'), flot = d.querySelector('.flotante');
  const marco = d.querySelector('.portada__marco');
  const leer = d.querySelector('[data-leer]'), ws = leer ? [...leer.querySelectorAll('.w')] : [];
  const teja = d.querySelector('[data-teja]'), fachada = d.querySelector('.fachada__casa');
  const pxs = [...d.querySelectorAll('[data-px]')].map((el) => ({ el, v: parseFloat(el.dataset.px), desde: +(el.dataset.pxDesde || 0), ref: el.parentElement }));
  // cuánto ha entrado un elemento en pantalla: 0 cuando asoma por abajo, 1 cuando llega a «hasta» (fracción de alto de pantalla)
  const entrada = (el, vh, hasta = .45) => { const r = el.getBoundingClientRect(); return lim((vh - r.top) / (vh * (1 - hasta))); };

  let pendiente = false;
  const fotograma = () => {
    pendiente = false;
    const y = scrollY, vh = innerHeight, vw = innerWidth;
    cab && cab.classList.toggle('fija', y > 24);
    flot && flot.classList.toggle('ver', y > vh * .7);
    if (scrub) scrub(vh);
    if (reducir) return;
    if (marco) marco.style.setProperty('--p', lim(y / marco.offsetHeight).toFixed(4));
    if (ws.length) { const r = leer.getBoundingClientRect(), p = lim((vh * .82 - r.top) / (r.height + vh * .3)), k = Math.round(p * ws.length); ws.forEach((w, i) => w.classList.toggle('on', i < k)); }
    if (teja) teja.style.setProperty('--e', entrada(teja, vh, .3).toFixed(4));
    if (fachada) fachada.style.setProperty('--e', entrada(fachada, vh, .15).toFixed(4));
    for (const o of pxs) {
      if (vw < o.desde) { if (o.el.style.transform) o.el.style.transform = ''; continue; }
      const r = o.ref.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      o.el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - vh / 2) * o.v).toFixed(1)}px, 0)`;
    }
  };
  const pedirFotograma = () => { if (!pendiente) { pendiente = true; requestAnimationFrame(fotograma); } };
  addEventListener('scroll', pedirFotograma, { passive: true });
  addEventListener('resize', pedirFotograma);
  fotograma();

  // cifras que cuentan hasta su valor al verse (el año no)
  const cuentas = [...d.querySelectorAll('[data-cuenta]:not([data-fijo])')];
  const miles = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (!reducir && 'IntersectionObserver' in window && cuentas.length) {
    const ioC = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; ioC.unobserve(e.target);
      const el = e.target, fin = +el.dataset.cuenta, t0 = performance.now(), T = 1500;
      const paso = (t) => { const p = lim((t - t0) / T), v = Math.round(fin * (1 - Math.pow(1 - p, 3))); el.textContent = miles(v); if (p < 1) requestAnimationFrame(paso); };
      el.textContent = '0'; requestAnimationFrame(paso);
    }), { threshold: .6 });
    cuentas.forEach((el) => ioC.observe(el));
  }

  // antes / después
  d.querySelectorAll('[data-ad]').forEach((ad) => {
    const r = ad.querySelector('.ad__rango');
    const fijar = () => ad.style.setProperty('--x', r.value + '%');
    r.addEventListener('input', fijar); fijar();
  });

  // vídeos de la galería y del oficio: solo se reproducen mientras se ven
  const vids = [...d.querySelectorAll('video[data-auto="vista"]')];
  if (!reducir && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    }), { rootMargin: '120px 0px', threshold: .25 });
    vids.forEach((v) => io.observe(v));
  }

  // apariciones al hacer scroll
  const revs = [...d.querySelectorAll('[data-rev]')];
  if (reducir || !('IntersectionObserver' in window)) revs.forEach((el) => el.classList.add('visto'));
  else {
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); io2.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    revs.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 70 + 'ms'; io2.observe(el); });
  }
})();
