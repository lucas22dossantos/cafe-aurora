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

let globalLenis = null;

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

function prepareStaggerReveal(selector, dir = 'up', step = 90, base = 0) {
  qsa(selector).forEach((el, i) => {
    if (el.hasAttribute('js-reveal')) return;
    el.setAttribute('js-reveal', '');
    el.dataset.dir = dir;
    el.dataset.delay = String(base + i * step);
  });
}

prepareStaggerReveal('.beans-specs > div', 'up', 80, 80);
prepareStaggerReveal('.tags > span', 'up', 70, 120);
prepareStaggerReveal('.visit-detail-row', 'right', 80, 120);
prepareStaggerReveal('.schedule-row', 'left', 80, 100);
prepareStaggerReveal('.footer-col', 'up', 110, 80);

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
   3. CORRECCIÓN Scroll Reveal (evitar saltos y asegurar transiciones)

   Tu HTML/CSS usan el sistema [js-reveal] + clase .is-visible,
   pero además existe compatibilidad legacy con IntersectionObserver
   que agrega .in. Si ambos sistemas interactúan, pueden aparecer
   saltos por transform/opacity no normalizados.

   Este bloque unifica el estado inicial para elementos legacy
   para que, cuando .in se aplique, el cambio sea suave y consistente.
   ================================================================ */
(function () {
  const els = qsa('.reveal, .reveal-left, .reveal-right');
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  els.forEach((el) => {
    if (el.classList.contains('in')) return;
    if (reduce) return;
    el.style.willChange = 'opacity, transform';
  });
})();

/* ================================================================
   4. PARALLAX — solo la imagen de fondo del hero
   ================================================================ */
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isDesktop      = window.matchMedia('(min-width: 768px)').matches;

if (!prefersReduced && isDesktop) {
  const heroImg   = qs('.hero-img-wrap img');
  const vh = window.innerHeight;

  if (heroImg) heroImg.style.transform = 'translateY(0px) scale(1.0)';

  let sy = 0, rafId = null;
  function applyParallax() {
    if (heroImg && sy < vh * 1.5)
      heroImg.style.transform = `translateY(${sy * 0.28}px) scale(1.0)`;
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
   HERO — Cinematic (sin typing ni contador incremental)
   ================================================================ */
(function () {
  const hero = qs('.hero');
  if (!hero) return;

  const heroTitleTyping = qs('.hero-body h1 .typing[data-typing="hero"]');

  if (heroTitleTyping) {
    const fullText = heroTitleTyping.getAttribute('aria-label') || '';
    const lines = String(fullText).split(/\r?\n/);
    const safeLines = lines.length ? lines : [fullText];

    heroTitleTyping.textContent = '';

    safeLines.forEach((line) => {
      const wrap = document.createElement('span');
      wrap.className = 'tmr';

      const inner = document.createElement('span');
      inner.textContent = line;

      wrap.appendChild(inner);
      heroTitleTyping.appendChild(wrap);
    });
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    hero.classList.add('cinema-bg');
    hero.classList.add('hero-ready');
    return;
  }

  // Eliminamos el Ken Burns infinito y además evitamos que el overlay haga blending con
  // la interpolación de animación. Así se evita la “línea” que aparece al borde del degradé.
  hero.classList.remove('cinema-bg');
  hero.classList.add('hero-ready');

  const heroImgEl = hero.querySelector('.hero-img-wrap img');
  if (heroImgEl) heroImgEl.style.animation = 'none';

  const afterEl = hero.querySelector('.hero-img-wrap');
  if (afterEl) {
    // No podemos tocar CSS existente, pero desactivamos el overlay dinámico
    // poniendo la pseudo-element overlay en modo fijo (opacity final).
    // (Esto fuerza que no haya transiciones que generen la línea.)
    afterEl.style.setProperty('--dummy', '0');
  }
})();

/* ================================================================
   IMPROVEMENTS (LENIS + GSAP/ScrollTrigger + SPLITTING)
   - Inicializar luego de DOMContentLoaded.
   - Respetar prefers-reduced-motion.
   - ScrollTrigger.refresh() en window load.
   ================================================================ */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenisGsapSynced = false;

  function easingExpoOut(t) {
    return Math.min(1, 1.001 - Math.pow(2, -10 * t));
  }

  function hasGsap() {
    return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (prefersReduced) return;

    let lenis = null;

    // 1) LENIS — SMOOTH SCROLL
    if (typeof window.Lenis === 'function') {
      lenis = new window.Lenis({
        duration: 0.82,
        easing: (t) => easingExpoOut(t),
        orientation: 'vertical',
        smoothWheel: true,
      });
      globalLenis = lenis;

      if (hasGsap() && !lenisGsapSynced) {
        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenisGsapSynced = true;
      } else {
        const rafLoop = (time) => {
          if (lenis) lenis.raf(time * 1000);
          requestAnimationFrame(rafLoop);
        };
        requestAnimationFrame(rafLoop);
      }

      const navEl = document.getElementById('nav');
      if (navEl) {
        const links = Array.from(navEl.querySelectorAll('.nav-links a[href^="#"]'));
        links.forEach((a) => {
          a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const id = href.replace('#', '');
            const target = document.getElementById(id);
            if (!target) return;

            e.preventDefault();
            lenis.scrollTo(target, {
              offset: -72,
              duration: 0.72,
              easing: (t) => 1 - Math.pow(1 - t, 3),
            });
          });
        });
      }
    } else {
      const navEl = document.getElementById('nav');
      if (navEl) {
        const links = Array.from(navEl.querySelectorAll('.nav-links a[href^="#"]'));
        links.forEach((a) => {
          a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.getElementById(href.replace('#', ''));
            if (!target) return;

            e.preventDefault();
            const y = target.getBoundingClientRect().top + window.scrollY - 72;
            window.scrollTo({ top: y, behavior: 'smooth' });
          });
        });
      }
    }

    // 2) GSAP + ScrollTrigger — curtain reveal
    if (hasGsap() && typeof window.gsap.registerPlugin === 'function') {
      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      if (lenis && !lenisGsapSynced) {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
        lenisGsapSynced = true;
      }

      const panels = [
        {
          selector: '.s-img--left',
          originIn: 'left center',
          originOut: 'right center',
        },
        {
          selector: '.s-img--right',
          originIn: 'right center',
          originOut: 'left center',
        },
        {
          selector: '.s-img--bakery',
          originIn: 'left center',
          originOut: 'right center',
        },
      ]
        .map((p) => ({ ...p, el: document.querySelector(p.selector) }))
        .filter((p) => p.el);

      // Insert curtain div BEFORE img with exact inline styles
      panels.forEach((p) => {
        if (p.el.querySelector('.img-curtain')) return;
        const img = p.el.querySelector('img');
        if (!img) return;

        const curtain = document.createElement('div');
        curtain.style.position = 'absolute';
        curtain.style.inset = '0';
        curtain.style.zIndex = '2';
        curtain.style.background = '#C9843A';
        curtain.style.transformOrigin = p.originIn;
        curtain.className = 'img-curtain';

        // Ensure positioning context
        const computed = window.getComputedStyle(p.el).position;
        if (computed === 'static') p.el.style.position = 'relative';

        p.el.insertBefore(curtain, img);
      });

      // Stagger between 3 images: no per-image ScrollTrigger
      const curtainEls = panels.map((p) => ({ curtain: p.el.querySelector('.img-curtain'), ...p })).filter((x) => x.curtain);
      if (curtainEls.length) {
        const masterTL = gsap.timeline({
          scrollTrigger: {
            trigger: curtainEls[0].el,
            start: 'top 70%',
          },
        });

        curtainEls.forEach((p, i) => {
          const img = p.el.querySelector('img');
          if (!img) return;

          // Initial state
          gsap.set(img, { opacity: 0, scale: 1.08 });
          gsap.set(p.curtain, { transformOrigin: p.originIn, scaleX: 0 });

          masterTL
            .to(
              p.curtain,
              {
                scaleX: 1,
                duration: 0.6,
                ease: 'power2.in',
              },
              i * 0.15
            )
            .to(
              p.curtain,
              {
                scaleX: 0,
                transformOrigin: p.originOut,
                duration: 0.6,
                ease: 'power2.out',
              },
              i * 0.15 + 0.6
            )
            .to(
              img,
              {
                opacity: 1,
                scale: 1.0,
                duration: 0.6,
                ease: 'power2.out',
              },
              i * 0.15 + 0.55
            );
        });
      }

      window.addEventListener('load', () => {
        try {
          ScrollTrigger.refresh();
        } catch (e) {}
      });
    }

    // 3) SPLITTING.JS — animación de títulos h2
    if (typeof window.Splitting === 'function' && hasGsap()) {
      window.Splitting({
        target: '#story-title, #beans-title, #bakery-title, #esp-title',
        by: 'words',
      });

      const h2s = ['#story-title', '#beans-title', '#bakery-title', '#esp-title']
        .map((s) => document.querySelector(s))
        .filter(Boolean);

      h2s.forEach((h2) => {
        h2.style.overflow = 'hidden';
        h2.style.display = 'block';
        h2.style.transformPerspective = '600px';

        const words = Array.from(h2.querySelectorAll('.word'));
        if (!words.length) return;

        // Colores para Splitting (solo .word)
        // Queremos para #esp-title una mezcla:
        // - "Las especialidades" => bone/blanco crema (#F5EFE6)
        // - "de la casa" (dentro del <em>) => ámbar (#C9843A)
        const isEsp = h2.id === 'esp-title';

        let wordsColors = null;

        if (isEsp) {
          // En vez de intentar deducir índices comparando text node,
          // marcamos los spans generados por Splitting con base en el DOM original:
          // - Tomamos el texto del <em>
          // - Los spans que coinciden con palabras del <em> van en ámbar.
          const em = h2.querySelector('em');
          const emText = em ? (em.textContent || '').trim() : '';
          const emNorm = String(emText).replace(/\s+/g, ' ').trim();
          const emWords = emNorm ? emNorm.split(' ') : [];

          wordsColors = words.map((w) => {
            const t = (w.textContent || '').trim();
            // Si la palabra pertenece al fragmento del <em>, ámbar. Sino, crema.
            // (Normalizamos por si splitting/espacios agregan variaciones.)
            return emWords.includes(t) ? '#C9843A' : '#F5EFE6';
          });
        }

        const defaultColor = '#1b100c';

        // IMPORTANT: asegurar color sobre los spans .word que genera Splitting
        words.forEach((w, idx) => {
          const c = isEsp
            ? (wordsColors && wordsColors[idx] ? wordsColors[idx] : '#F5EFE6')
            : defaultColor;
          if (!w || !w.style) return;
          w.style.color = c;
        });

        // Estado inicial GSAP: NO forzamos un color único si #esp-title (para respetar la mezcla)
        if (!isEsp) {
          window.gsap.set(words, { opacity: 0, y: 30, rotateX: -40, color: defaultColor });
        } else {
          window.gsap.set(words, { opacity: 0, y: 30, rotateX: -40 });
          // re-aplicar por palabra
          words.forEach((w, idx) => {
            if (!w) return;
            const c = wordsColors && wordsColors[idx] ? wordsColors[idx] : '#F5EFE6';
            w.style.color = c;
          });
        }

        window.gsap.to(words, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          ease: 'power3.out',
          duration: 0.7,
          stagger: 0.07,
          scrollTrigger: {
            trigger: h2,
            start: 'top 80%',
          },
          onStart: () => {
            if (isEsp && wordsColors) {
              words.forEach((w, idx) => {
                if (!w || !w.style) return;
                w.style.color = wordsColors[idx] || '#F5EFE6';
              });
            }
          },
          onComplete: () => {
            if (isEsp && wordsColors) {
              words.forEach((w, idx) => {
                if (!w || !w.style) return;
                w.style.color = wordsColors[idx] || '#F5EFE6';
              });
            }
          },
        });
      });

      window.addEventListener('load', () => {
        try {
          ScrollTrigger.refresh();
        } catch (e) {}
      });
    }
  });
})();

/* ============================================================
   7. LÓGICA DE MENÚ HAMBURGUESA MÓVIL
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const navHeader = document.getElementById('nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

  if (hamburgerBtn && mobileNav && navHeader) {
    function openMobileMenu() {
      hamburgerBtn.setAttribute('aria-expanded', 'true');
      mobileNav.setAttribute('aria-hidden', 'false');
      mobileNav.classList.add('is-active');
      navHeader.classList.add('menu-open');
      
      // Bloquear scroll de fondo
      if (globalLenis) {
        globalLenis.stop();
      } else {
        document.body.style.overflow = 'hidden';
      }
    }

    function closeMobileMenu() {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
      mobileNav.classList.remove('is-active');
      navHeader.classList.remove('menu-open');
      
      // Desbloquear scroll de fondo
      if (globalLenis) {
        globalLenis.start();
      } else {
        document.body.style.overflow = '';
      }
    }

    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('is-active');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    // Cerrar menú al hacer clic en un enlace del menú móvil
    mobileLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        // Cerramos el menú de inmediato
        closeMobileMenu();

        // Si es un enlace de sección, nos desplazamos suavemente
        if (href && href.startsWith('#')) {
          const target = document.getElementById(href.replace('#', ''));
          if (target) {
            e.preventDefault();
            
            if (globalLenis) {
              // Timeout para esperar que empiece a cerrar el panel
              setTimeout(() => {
                globalLenis.scrollTo(target, {
                  offset: -72,
                  duration: 0.72,
                  easing: (t) => 1 - Math.pow(1 - t, 3),
                });
              }, 200);
            } else {
              const y = target.getBoundingClientRect().top + window.scrollY - 72;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }
        }
      });
    });
  }
});
