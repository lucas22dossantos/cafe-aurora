/* ================================================================
   AURORA CAFÉ — script.js
   1. Navbar: scroll shrink + active link
   2. Animaciones entre secciones (js-reveal / js-reveal-img)
   3. Parallax solo en el hero (imagen de fondo)
   4. Abierto / Cerrado dinámico
   5. Día de hoy resaltado en horario
   6. Barras de horario animadas
   ================================================================ */

const qs  = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

/* ================================================================
   1. NAVBAR
   ================================================================ */
const nav      = qs('#nav');
const navLinks = qsa('.nav-links a');
const SECTIONS = ['inicio','historia','especialidades','granos','reposteria','visita'];

let navTick = false;
function onNavScroll() {
  if (navTick) return;
  navTick = true;
  requestAnimationFrame(() => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    const mid = window.scrollY + window.innerHeight * 0.38;
    let cur = '';
    SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= mid) cur = id;
    });
    navLinks.forEach(a =>
      a.classList.toggle('active', a.getAttribute('href').replace('#','') === cur)
    );
    navTick = false;
  });
}
window.addEventListener('scroll', onNavScroll, { passive: true });
onNavScroll();

/* ================================================================
   2. ANIMACIONES ENTRE SECCIONES

   [js-reveal]      → fade + slide (arriba / izquierda / derecha
                       según data-dir)
   [js-reveal-img]  → solo fade — imágenes no se mueven
   [data-delay]     → retraso en ms para escalonar elementos

   Cuando el elemento entra al 12% del viewport se añade
   la clase .is-visible que dispara la transición CSS.
   ================================================================ */
const REVEAL_OPTS = { threshold: 0.12, rootMargin: '0px 0px -48px 0px' };

const revealIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el    = entry.target;
    const delay = parseInt(el.dataset.delay || 0, 10);
    setTimeout(() => el.classList.add('is-visible'), delay);
    revealIO.unobserve(el);
  });
}, REVEAL_OPTS);

const imgIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    imgIO.unobserve(entry.target);
  });
}, { threshold: 0.06 });

qsa('[js-reveal]').forEach(el => revealIO.observe(el));
qsa('[js-reveal-img]').forEach(el => imgIO.observe(el));

/* Compatibilidad con clases antiguas .reveal en caso de que queden */
const legacyIO = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); legacyIO.unobserve(e.target); } });
}, REVEAL_OPTS);
qsa('.reveal, .reveal-left, .reveal-right').forEach(el => legacyIO.observe(el));

/* ================================================================
   3. PARALLAX — solo la imagen de fondo del hero
   ================================================================ */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop      = window.matchMedia('(min-width: 768px)').matches;

if (!prefersReduced && isDesktop) {
  const heroImg   = qs('.hero-img-wrap img');
  const heroQuote = qs('.hero-quote');
  const vh = window.innerHeight;

  if (heroImg) heroImg.style.transform = 'translateY(0px) scale(1.08)';

  let sy = 0, rafId = null;
  function applyParallax() {
    if (heroImg && sy < vh * 1.5)
      heroImg.style.transform = `translateY(${sy * 0.28}px) scale(1.08)`;
    if (heroQuote && sy < vh * 1.2)
      heroQuote.style.transform = `translateY(${-sy * 0.1}px)`;
    rafId = null;
  }
  window.addEventListener('scroll', () => {
    sy = window.scrollY;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  }, { passive: true });
  applyParallax();
}

/* ================================================================
   4. ABIERTO / CERRADO
   ================================================================ */
(function() {
  const badge = qs('#open-badge');
  const pulse = qs('#open-pulse');
  const text  = qs('#open-text');
  if (!badge) return;

  const now = new Date(), day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const weekend = day === 0 || day === 6;
  const open = hour >= (weekend ? 8 : 7) && hour < (weekend ? 21 : 20);

  if (open) {
    pulse.style.background = '#4caf6a';
    text.textContent = `Abierto ahora · Hasta las ${weekend ? 21 : 20}:00 hs`;
  } else {
    pulse.style.background = '#e05252';
    pulse.style.animation  = 'none';
    const next = day >= 1 && day <= 4 ? 'mañana a las 7:00'
               : day === 5 ? 'el sábado a las 8:00'
               : day === 6 ? 'el domingo a las 8:00'
               : 'el lunes a las 7:00';
    text.textContent = `Cerrado · Abrimos ${next} hs`;
  }
})();

/* ================================================================
   5. DÍA DE HOY en horario
   ================================================================ */
(function() {
  const today = new Date().getDay();
  qsa('.schedule-day[data-days]').forEach(el => {
    if (el.dataset.days.split(',').map(Number).includes(today))
      el.classList.add('today');
  });
})();

/* ================================================================
   6. BARRAS DE HORARIO
   ================================================================ */
const barIO = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('.schedule-bar-fill')
      .forEach((b, i) => setTimeout(() => b.classList.add('animated'), 280 + i * 140));
    barIO.unobserve(e.target);
  });
}, { threshold: 0.3 });

const sg = qs('.schedule-grid');
if (sg) barIO.observe(sg);

/* ================================================================
   HERO: CONTADOR (al entrar en viewport) + TYPING (solo 1 vez)
   ================================================================ */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------- Contador: se dispara cuando el bloque stats entra al viewport
  const statsBlock = qs('.hero-stats');
  const countEls = qsa('.hero-stats [data-stat="count"]');

  if (statsBlock && countEls.length) {
    if (prefersReduced) {
      // Render inmediato en modo reduced
      countEls.forEach(el => {
        const target = parseFloat(el.dataset.target || '0');
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';

        const value = Number.isFinite(target)
          ? (decimals > 0 ? target.toFixed(decimals) : String(Math.round(target)))
          : '0';

        el.textContent = `${prefix}${value}${suffix}`;
      });
    } else {
      let started = false;

      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting || started) return;
          started = true;

          const duration = 980; // UX corto, sin estar de más
          const start = performance.now();

          const raf = (now) => {
            const t = Math.min(1, (now - start) / duration);
            // easing suave
            const eased = 1 - Math.pow(1 - t, 3);

            countEls.forEach(el => {
              const target = parseFloat(el.dataset.target || '0');
              const decimals = parseInt(el.dataset.decimals || '0', 10);
              const prefix = el.dataset.prefix || '';
              const suffix = el.dataset.suffix || '';

              const cur = target * eased;
              const value = decimals > 0
                ? cur.toFixed(decimals)
                : String(Math.round(cur));

              el.textContent = `${prefix}${value}${suffix}`;
            });

            if (t < 1) requestAnimationFrame(raf);
          };

          requestAnimationFrame(raf);
          io.unobserve(statsBlock);
        });
      }, { threshold: 0.35 });

      io.observe(statsBlock);
    }
  }

  // -------- Typing en hero title: solo 1 vez
  const typingEl = qs('.typing[data-typing="hero"]');
  if (typingEl) {
    const KEY = 'auroraHeroTypingDone';
    const already = sessionStorage.getItem(KEY) === '1';

    const fullText = typingEl.getAttribute('aria-label') || 'El café que despierta historias.';

    if (prefersReduced || already) {
      typingEl.textContent = fullText;
      return;
    }

    sessionStorage.setItem(KEY, '1');

    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';

    typingEl.textContent = '';
    typingEl.appendChild(cursor);

    let i = 0;
    const step = () => {
      // Si ya acabamos
      if (i >= fullText.length) {
        cursor.remove();
        typingEl.textContent = fullText;
        return;
      }

      // Ponemos el texto sin el cursor (cursor queda al final)
      typingEl.childNodes.forEach(n => {
        if (n !== cursor) n.remove();
      });

      // reconstruimos texto incremental eficientemente
      // (en este caso el texto es corto, ok)
      cursor.style.marginLeft = '2px';
      typingEl.insertBefore(document.createTextNode(fullText.slice(0, i + 1)), cursor);

      i++;
      const delay = 24 + Math.random() * 22;
      setTimeout(step, delay);
    };

    // arrancar al cargar, sin esperar scroll
    setTimeout(step, 420);
  }
})();

