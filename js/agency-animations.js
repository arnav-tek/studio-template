/**
 * K3 Studios — Agency Animations
 * Lenis smooth scroll, GSAP reveals, work gallery animations, scramble text
 */
(function () {
  'use strict';
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  var IS_ARABIC = document.documentElement.lang && document.documentElement.lang.toLowerCase().indexOf('ar') === 0;
  var IS_RTL = document.documentElement.dir === 'rtl';
  var SHOULD_SPLIT_CHARS = !IS_ARABIC && !IS_RTL;
  var CHARS = '*&@#%$-_:/;!?+=<>';

  // ── TEXT REVEAL ────────────────────────────────────
  function prepareRevealText(el) {
    el.classList.add('is-split');
    return el;
  }

  function splitChars(el) {
    var text = el.textContent;
    el.setAttribute('data-original', text);
    el.innerHTML = '';
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'ag-char';
      s.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      el.appendChild(s);
    }
    el.classList.add('is-split');
    return el.querySelectorAll('.ag-char');
  }

  function blurReveal(target, vars, position) {
    var defaults = {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      duration: 1,
      ease: 'power3.out'
    };
    return {
      from: { opacity: 0, filter: 'blur(18px)', y: 18 },
      to: Object.assign(defaults, vars || {}),
      position: position
    };
  }

  // ── SOFT HOVER (SCRAMBLE EFFECT) ────────────────────
  function initScramble() {
    document.querySelectorAll('[data-scramble]').forEach(function (el) {
      if (el.dataset.softHoverReady) return;
      el.dataset.softHoverReady = '1';
      if (SHOULD_SPLIT_CHARS) {
        var orig = el.textContent, iv = null;
        el.addEventListener('mouseenter', function () {
          var iter = 0; clearInterval(iv);
          iv = setInterval(function () {
            el.textContent = orig.split('').map(function (c, i) {
              if (c === ' ') return ' ';
              return i < iter ? orig[i] : CHARS[Math.floor(Math.random() * CHARS.length)];
            }).join('');
            iter += 0.5;
            if (iter >= orig.length) { clearInterval(iv); el.textContent = orig; }
          }, 35);
        });
        el.addEventListener('mouseleave', function () { clearInterval(iv); el.textContent = orig; });
        return;
      }
      el.addEventListener('mouseenter', function () {
        gsap.to(el, { filter: 'blur(1.5px)', opacity: .75, duration: .16, ease: 'power2.out' });
        gsap.to(el, { filter: 'blur(0px)', opacity: 1, duration: .32, ease: 'power2.out', delay: .16 });
      });
    });
  }

  // ── LENIS SMOOTH SCROLL ─────────────────────────────
  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    var lenis = new Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smooth: true, smoothTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // ── PRELOADER ──────────────────────────────────────
  function initPreloader(cb) {
    var pre = document.getElementById('preloader');
    var fill = document.getElementById('preloaderFill');
    var pct = document.getElementById('preloaderPct');
    // Skip preloader if arriving via page transition
    if (!pre || sessionStorage.getItem('ptr_skip_preloader')) {
      sessionStorage.removeItem('ptr_skip_preloader');
      if (pre) pre.style.display = 'none';
      cb(); return;
    }
    var p = { v: 0 };
    gsap.to(p, {
      v: 100, duration: 2, ease: 'power2.inOut',
      onUpdate: function () { var n = Math.round(p.v); fill.style.width = n + '%'; pct.textContent = n; },
      onComplete: function () {
        gsap.to(pre, { opacity: 0, duration: .4, onComplete: function () { pre.style.display = 'none'; cb(); } });
      }
    });
  }

  // ── HERO ───────────────────────────────────────────
  function initHero() {
    var tl = gsap.timeline();
    var isPostHero = !!document.querySelector('.ag-post-hero');

    // Badge
    tl.fromTo('.ag-hero__badge', { opacity: 0, y: -10, scale: .95 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'power2.out' }, .1);

    // Title rows
    document.querySelectorAll('.ag-hero__row > span[data-split]').forEach(function (el, i) {
      if (SHOULD_SPLIT_CHARS && !isPostHero) {
        var chars = splitChars(el);
        tl.fromTo(
          chars,
          { y: '120%', opacity: 0 },
          { y: '0%', opacity: 1, stagger: .02, duration: 1, ease: 'expo.out' },
          .15 + i * .12
        );
        return;
      }
      prepareRevealText(el);
      var reveal = blurReveal(el, { duration: isPostHero ? 1.25 : 1.05 }, .15 + i * .12);
      tl.fromTo(el, reveal.from, reveal.to, reveal.position);
    });

    // Sub, CTAs
    tl.fromTo('.ag-hero__sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, .7);
    tl.fromTo('.ag-hero__ctas', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, .85);

    // Scroll indicator
    tl.fromTo('.ag-hero__scroll', { opacity: 0 }, { opacity: 1, duration: .5 }, 1.2);

    // Decos, corners, grid
    tl.fromTo('.ag-hero__deco', { scale: 1.4, opacity: 0 }, { scale: 1, opacity: .12, duration: 1.2, ease: 'expo.out', stagger: .15 }, .3);
    tl.fromTo('.ag-hero__corner', { opacity: 0 }, { opacity: .4, duration: .4, stagger: .05 }, .5);
    tl.fromTo('.ag-hero__grid-line', { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: 'expo.out', stagger: .08 }, .2);

    // Ticker, nav, loader
    tl.fromTo('.ag-hero__ticker', { opacity: 0 }, { opacity: 1, duration: .5 }, 1);
    tl.fromTo('.ag-nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, 1);
    tl.fromTo('#heroLoader', { width: '0%' }, { width: '100%', duration: 2.5, ease: 'power2.inOut' }, 0);

    // Orb
    tl.fromTo('.ag-hero__orb', { scale: .5, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.5, ease: 'power2.out' }, .3);

    // Hero ticker
    var ticker = document.getElementById('heroTicker');
    if (ticker) {
      var firstSpan = ticker.querySelector('span');
      var oneSetWidth = firstSpan ? firstSpan.offsetWidth : ticker.scrollWidth / 4;
      if (IS_RTL) {
        gsap.set(ticker, { x: -oneSetWidth });
        gsap.to(ticker, { x: 0, duration: 16, ease: 'none', repeat: -1 });
      } else {
        gsap.set(ticker, { x: 0 });
        gsap.to(ticker, { x: -oneSetWidth, duration: 16, ease: 'none', repeat: -1 });
      }
    }
  }

  // ── ORB MOUSE FOLLOW ──────────────────────────────
  function initOrbFollow() {
    var orb = document.getElementById('heroOrb');
    if (!orb) return;
    var hero = document.querySelector('.ag-hero');
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      gsap.to(orb, { left: x, top: y, duration: 1.2, ease: 'power2.out' });
    });
  }

  function initHeroParallax() {
    document.querySelectorAll('.ag-hero__row').forEach(function (row) {
      var speed = parseFloat(row.getAttribute('data-speed')) || 1;
      gsap.to(row, { yPercent: -50 * speed, scrollTrigger: { trigger: '.ag-hero', start: 'top top', end: 'bottom top', scrub: .5 } });
    });
  }

  // ── STATS COUNT UP ─────────────────────────────────
  function initStats() {
    document.querySelectorAll('.ag-stat__num').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var c = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          gsap.to(c, { v: target, duration: 2, ease: 'power2.out', onUpdate: function () { el.textContent = Math.floor(c.v); } });
        }
      });
    });
    gsap.fromTo('.ag-stat', { opacity: 0.7, y: 20 }, { opacity: 1, y: 0, stagger: .1, duration: .5, ease: 'power2.out', scrollTrigger: { trigger: '.ag-stats', start: 'top 90%', once: true } });
  }

  // ── SELECTED WORK REVEAL ───────────────────────────
  function initWork() {
    revealTextOnScroll('.ag-work .ag-section-head__row > span[data-split]', '.ag-work .ag-section-head', 'top 85%');

    var items = document.querySelectorAll('.ag-work__item');
    items.forEach(function (item, i) {
      var img = item.querySelector('.ag-work__item-img img');
      var info = item.querySelector('.ag-work__item-info');
      var num = item.querySelector('.ag-work__item-num');
      var title = item.querySelector('.ag-work__item-title');
      var tag = item.querySelector('.ag-work__item-tag');
      var desc = item.querySelector('.ag-work__item-desc');

      // Image clip-path reveal
      gsap.fromTo(item.querySelector('.ag-work__item-img'),
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'expo.inOut',
          scrollTrigger: { trigger: item, start: 'top 80%', once: true }
        }
      );

      // Image parallax
      if (img) {
        gsap.fromTo(img,
          { scale: 1.15 },
          {
            scale: 1, duration: 1.4, ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 80%', once: true }
          }
        );
        gsap.to(img, {
          yPercent: -10,
          scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: .3 }
        });
      }

      // Info staggering
      var infoEls = [num, title, tag, desc].filter(Boolean);
      gsap.fromTo(infoEls,
        { opacity: 0, y: 25 },
        {
          opacity: 1, y: 0, stagger: .08, duration: .6, ease: 'power2.out',
          scrollTrigger: { trigger: item, start: 'top 70%', once: true }
        }
      );
    });
  }

  // ── SCROLL TEXT REVEAL UTILITIES ─────────────────────
  function revealTextOnScroll(selector, triggerEl, startPos) {
    var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
    if (SHOULD_SPLIT_CHARS) {
      targets.forEach(function (el) {
        var chars = splitChars(el);
        gsap.set(chars, { y: '50%', opacity: 0.3 });
        gsap.to(chars, {
          y: '0%',
          opacity: 1,
          stagger: .015,
          duration: .7,
          ease: 'expo.out',
          scrollTrigger: { trigger: triggerEl, start: startPos || 'top 80%', once: true }
        });
      });
      return;
    }
    targets.forEach(prepareRevealText);
    gsap.fromTo(targets,
      { opacity: 0, filter: 'blur(18px)', y: 18 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        stagger: .08,
        duration: .9,
        ease: 'power3.out',
        scrollTrigger: { trigger: triggerEl, start: startPos || 'top 80%', once: true }
      }
    );
  }

  function revealTextInTimeline(tl, elements, position) {
    elements.forEach(function (el, i) {
      if (SHOULD_SPLIT_CHARS) {
        var chars = splitChars(el);
        tl.fromTo(
          chars,
          { y: '120%', opacity: 0 },
          { y: '0%', opacity: 1, stagger: .02, duration: 1, ease: 'expo.out' },
          position + i * .12
        );
        return;
      }
      prepareRevealText(el);
      tl.fromTo(
        el,
        { opacity: 0, filter: 'blur(18px)', y: 18 },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: .95, ease: 'power3.out' },
        position + i * .1
      );
    });
  }

  // ── WHO WE WORK WITH REVEAL ─────────────────────────
  function initWho() {
    revealTextOnScroll('.ag-who .ag-section-head__row > span[data-split]', '.ag-who .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-who__card',
      { opacity: 0.7, y: 30 },
      { opacity: 1, y: 0, stagger: .1, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '.ag-who__grid', start: 'top 85%', once: true } }
    );
  }

  // ── SERVICES LIST REVEAL ────────────────────────────
  function initServices() {
    revealTextOnScroll('.ag-services .ag-section-head__row > span[data-split]', '.ag-services .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-services__item',
      { opacity: 0.7, x: -12 },
      { opacity: 1, x: 0, stagger: .04, duration: .4, ease: 'power2.out', scrollTrigger: { trigger: '.ag-services__list', start: 'top 90%', once: true } }
    );
  }

  // ── PRICING CARDS REVEAL ────────────────────────────
  function initPricing() {
    revealTextOnScroll('.ag-pricing .ag-section-head__row > span[data-split]', '.ag-pricing .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-pricing__card',
      { opacity: 0.7, y: 30 },
      { opacity: 1, y: 0, stagger: .1, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '.ag-pricing__grid', start: 'top 85%', once: true } }
    );
  }

  // ── MARQUEE ANIMATION ───────────────────────────────
  function initMarquee() {
    var track = document.getElementById('marqueeTrack');
    if (!track) return;
    var firstSpan = track.querySelector('span');
    var oneSetWidth = firstSpan ? firstSpan.offsetWidth : track.scrollWidth / 4;
    gsap.set(track, { x: 0 });
    gsap.to(track, { x: -oneSetWidth, duration: 14, ease: 'none', repeat: -1 });
  }

  // ── CONTACT SECTION REVEAL ──────────────────────────
  function initContact() {
    revealTextOnScroll('.ag-contact__title > span[data-split]', '.ag-contact', 'top 75%');
  }

  // ── ABOUT PAGE HANDLERS ─────────────────────────────
  function initAboutHero() {
    var hero = document.querySelector('.ag-about-hero');
    if (!hero) return;

    var tl = gsap.timeline();
    tl.fromTo('.ag-about-hero__content .ag-hero__badge', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, .1);
    revealTextInTimeline(tl, Array.prototype.slice.call(hero.querySelectorAll('.ag-hero__row > span[data-split]')), .15);
    tl.fromTo('.ag-about-hero__content .ag-hero__sub', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, .7);
    tl.fromTo('.ag-about-hero__grid .ag-hero__grid-line', { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: 'expo.out', stagger: .08 }, .2);
    tl.fromTo('.ag-nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, .6);
  }

  function initAboutSections() {
    // Story
    revealTextOnScroll('.ag-story .ag-section-head__row > span[data-split]', '.ag-story .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-story__text', { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: .12, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '.ag-story__right', start: 'top 85%', once: true } });

    // AI
    revealTextOnScroll('.ag-ai .ag-section-head__row > span[data-split]', '.ag-ai .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-ai__card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: .1, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '.ag-ai__grid', start: 'top 85%', once: true } });

    // Values
    revealTextOnScroll('.ag-values .ag-section-head__row > span[data-split]', '.ag-values .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-values__item', { opacity: 0.7, x: -12 }, { opacity: 1, x: 0, stagger: .06, duration: .4, ease: 'power2.out', scrollTrigger: { trigger: '.ag-values__list', start: 'top 90%', once: true } });

    // Process
    revealTextOnScroll('.ag-process .ag-section-head__row > span[data-split]', '.ag-process .ag-section-head', 'top 80%');
    gsap.fromTo('.ag-process__step', { opacity: 0, y: 30 }, { opacity: 1, y: 0, stagger: .1, duration: .6, ease: 'power2.out', scrollTrigger: { trigger: '.ag-process__grid', start: 'top 85%', once: true } });
  }

  // ── MAIN DISPATCHER ──────────────────────────────────
  var isAboutPage = !!document.querySelector('.ag-about-hero') && !document.querySelector('.ag-ctc-hero') && !document.querySelector('.svc-hero');
  var isSvcPage = !!document.querySelector('.svc-hero');
  var isCtcPage = !!document.querySelector('.ag-ctc-hero');

  document.addEventListener('DOMContentLoaded', function () {
    initLenis();
    initScramble();

    if (isAboutPage) {
      initAboutHero();
      initAboutSections();
      initMarquee();
      initContact();
      ScrollTrigger.refresh(true);
    } else if (isSvcPage) {
      // Services Page Setup
      var sHero = document.querySelector('.svc-hero');
      var tl = gsap.timeline();
      tl.fromTo(sHero.querySelector('.ag-hero__badge'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, .1);
      revealTextInTimeline(tl, Array.prototype.slice.call(sHero.querySelectorAll('.ag-hero__row > span[data-split]')), .15);
      tl.fromTo(sHero.querySelector('.ag-hero__sub'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, .7);
      tl.fromTo(sHero.querySelectorAll('.ag-hero__grid-line'), { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: 'expo.out', stagger: .08 }, .2);
      tl.fromTo('.ag-nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, .6);

      initServices();
      initWho();
      initAboutSections(); // Use values and process animations
      initMarquee();
      initContact();
      ScrollTrigger.refresh(true);
    } else if (isCtcPage) {
      // Contact Page Setup
      var cHero = document.querySelector('.ag-ctc-hero');
      var tl = gsap.timeline();
      tl.fromTo(cHero.querySelector('.ag-hero__badge'), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: .6, ease: 'power2.out' }, .1);
      revealTextInTimeline(tl, Array.prototype.slice.call(cHero.querySelectorAll('.ag-hero__row > span[data-split]')), .15);
      tl.fromTo(cHero.querySelector('.ag-hero__sub'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .7, ease: 'power2.out' }, .7);
      tl.fromTo(cHero.querySelectorAll('.ag-hero__grid-line'), { scaleY: 0 }, { scaleY: 1, duration: 1.5, ease: 'expo.out', stagger: .08 }, .2);
      tl.fromTo('.ag-nav', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }, .6);

      revealTextOnScroll('#contactForm .ag-section-head__row > span[data-split]', '#contactForm', 'top 80%');
      initContact();
      ScrollTrigger.refresh(true);
    } else {
      // Homepage Setup
      initPreloader(function () {
        initHero();
        initOrbFollow();
        initHeroParallax();
        initStats();
        initWork();
        initWho();
        initServices();
        initPricing();
        initMarquee();
        initContact();
        ScrollTrigger.refresh(true);
      });
    }
  });

  window.addEventListener('resize', function () { ScrollTrigger.refresh(); });
})();
