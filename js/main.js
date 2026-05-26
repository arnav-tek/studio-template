/**
 * K3 Studios — Main Interactions
 * Hamburger menus, Calendly events, contact form toasts, page transition sweepings
 */
(function(){
  'use strict';

  // ── HELPER: SCRAMBLE LOADER ───────────────────────
  var CHARS = '*&@#%$-_:/;!?+=<>';
  function scrambleTextOnce(el, targetText, duration, cb) {
    var orig = targetText;
    var iter = 0;
    var iv = setInterval(function () {
      el.textContent = orig.split('').map(function (c, i) {
        if (c === ' ') return ' ';
        return i < iter ? orig[i] : CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      iter += 0.6;
      if (iter >= orig.length) {
        clearInterval(iv);
        el.textContent = orig;
        if(cb) cb();
      }
    }, 30);
  }

  // ── MOBILE MENU ───────────────────────────────────
  function initMobileMenu() {
    var burger = document.getElementById('agBurger');
    var menu = document.getElementById('agMobileMenu');
    if(!burger || !menu) return;

    function close(){
      menu.classList.remove('is-open');
      burger.classList.remove('is-active');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    burger.addEventListener('click', function(){
      var open = menu.classList.toggle('is-open');
      burger.classList.toggle('is-active');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', close);
    });
  }

  // ── PAGE TRANSITION OVERLAY ────────────────────────
  function initPageTransition() {
    var ptr = document.getElementById('pageTransition');
    if(!ptr) return;

    var navigated = sessionStorage.getItem('ptr_navigating');
    sessionStorage.removeItem('ptr_navigating');

    if(navigated){
      var panels = ptr.querySelectorAll('.ptr__panel');
      panels.forEach(function(p){ p.style.transform = 'translateY(0)'; });
      ptr.querySelector('.ptr__logo').style.opacity = '1';

      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          panels.forEach(function(p){ p.style.transform = ''; });
          ptr.querySelector('.ptr__logo').style.opacity = '';
          ptr.classList.add('is-revealing');

          ptr.addEventListener('animationend', function handler(e){
            if(e.target.classList.contains('ptr__panel') && e.animationName === 'ptrReveal'){
              ptr.classList.remove('is-revealing');
              ptr.removeEventListener('animationend', handler);
            }
          });
        });
      });
    }

    var transitioning = false;
    document.addEventListener('click', function(e){
      if(transitioning) return;
      var link = e.target.closest('a');
      if(!link) return;

      var href = link.getAttribute('href');
      if(!href) return;
      if(href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if(link.target === '_blank' || link.hasAttribute('download')) return;
      
      // Navigate locally
      var targetPath = href.split('#')[0];
      var currentPath = window.location.pathname.split('#')[0];
      if (targetPath === '' || targetPath === 'index.html' && currentPath.endsWith('index.html')) {
        // Just standard anchor on home
        return;
      }

      e.preventDefault();
      transitioning = true;

      ptr.style.pointerEvents = 'all';
      ptr.classList.add('is-covering');

      sessionStorage.setItem('ptr_navigating', '1');
      sessionStorage.setItem('ptr_skip_preloader', '1');
      setTimeout(function(){
        window.location.href = href;
      }, 550);
    });

    window.addEventListener('pageshow', function(e){
      if(e.persisted){
        transitioning = false;
        ptr.classList.remove('is-covering');
        ptr.style.pointerEvents = '';
      }
    });
  }

  // ── CALENDLY INTEGRATION ──────────────────────────
  function initCalendly() {
    var calendlyUrl = 'https://calendly.com/ali-buildwali/30min?primary_color=ed5724';

    function openCalendly(url) {
      if (!window.Calendly || typeof window.Calendly.initPopupWidget !== 'function') {
        window.open(url || calendlyUrl, '_blank');
        return true;
      }
      window.Calendly.initPopupWidget({ url: url || calendlyUrl });
      return true;
    }

    window.k3OpenCalendly = openCalendly;

    window.addEventListener('load', function() {
      if (window.Calendly && typeof window.Calendly.initBadgeWidget === 'function') {
        try {
          window.Calendly.initBadgeWidget({
            url: calendlyUrl,
            text: 'Get Consultation',
            color: '#ED5724',
            textColor: '#ffffff',
            branding: true
          });
        } catch(e){}
      }
    });

    document.addEventListener('click', function(event) {
      var trigger = event.target.closest('[data-calendly-popup]');
      if (!trigger) return;
      if (openCalendly(trigger.getAttribute('data-calendly-url'))) {
        event.preventDefault();
      }
    });
  }

  // ── CONTACT FORM NOTIFICATION TOASTS ──────────────
  function showNotification(type, message) {
    var oldPopup = document.querySelector('.ag-ctc__notification');
    if(oldPopup) oldPopup.remove();

    var popup = document.createElement('div');
    popup.className = 'ag-ctc__notification ag-ctc__notification--' + type;
    popup.innerHTML = `
      <div class="ag-ctc__notification-content">
        <span class="ag-ctc__notification-icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="ag-ctc__notification-text">${message}</span>
      </div>
      <button class="ag-ctc__notification-close">×</button>
    `;

    document.body.appendChild(popup);

    var closeBtn = popup.querySelector('.ag-ctc__notification-close');
    closeBtn.addEventListener('click', function(){
      popup.remove();
    });

    setTimeout(function() {
      popup.classList.add('ag-ctc__notification--hide');
      setTimeout(function() { popup.remove(); }, 500);
    }, 5000);
  }

  function initContactForm() {
    var form = document.getElementById('agContactForm');
    if(!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var submitBtn = form.querySelector('button[type="submit"]');
      var submitTextEl = submitBtn.querySelector('[data-scramble]') || submitBtn;
      var originalText = submitTextEl.textContent;

      submitBtn.disabled = true;
      scrambleTextOnce(submitTextEl, 'Sending...', 1, function() {
        // Mock server latency
        setTimeout(function() {
          showNotification('success', "Thank you! We've received your request and will follow up in 24 hours.");
          form.reset();
          submitBtn.disabled = false;
          submitTextEl.textContent = originalText;
          if(typeof submitTextEl.dataset.softHoverReady !== 'undefined') {
            delete submitTextEl.dataset.softHoverReady;
          }
        }, 1500);
      });
    });
  }

  // ── LAUNCH CORES ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', function(){
    initMobileMenu();
    initPageTransition();
    initCalendly();
    initContactForm();
  });

})();
