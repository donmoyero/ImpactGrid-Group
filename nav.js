/* ═══════════════════════════════════════════════════════
   ImpactGrid Group — nav.js
   Version: 5.0  (creator-first: no login, no dropdowns,
                  direct CTA to Creator Studio)

   NAV:  Home | About | Consulting | Contact | Pricing  [Try Creator Studio Free →]
   Mobile sidebar mirrors same links.

   HOW TO USE:
   1. <div id="ig-nav"></div>  at top of body
   2. <div id="ig-footer"></div> at bottom of body
   3. Load: nav.js
   4. Call: renderNav('yourpage.html'); renderFooter();
   NOTE: index.html manages its own inline nav — do NOT load nav.js there.
═══════════════════════════════════════════════════════ */

(function() {

  /* ── Top-level nav links ── */
  var NAV_LINKS = [
    { href: 'index.html',    label: 'Home' },
    { href: 'about.html',    label: 'About' },
    { href: 'consulting.html', label: 'Consulting' },
    { href: 'contact.html',  label: 'Contact' },
    { href: 'pricing.html',  label: 'Pricing' },
  ];

  /* ─────────────────────────────────────────
     RENDER NAV
  ───────────────────────────────────────── */
  function renderNav(activePage) {

    var desktopLinks = NAV_LINKS.map(function(l) {
      var cls = l.href === activePage ? ' class="active"' : '';
      return '<li><a href="' + l.href + '"' + cls + '>' + l.label + '</a></li>';
    }).join('');

    var mobileLinks = [
      { href:'index.html',          label:'Home' },
      { href:'about.html',          label:'About' },
      { href:'consulting.html',     label:'Consulting' },
      { href:'contact.html',        label:'Contact' },
      { href:'pricing.html',        label:'Pricing' },
      { href:'creator-studio.html', label:'Try Creator Studio' },
    ].map(function(l) {
      var cls = l.href === activePage ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + cls + ' onclick="closeSidebar()">' + l.label + '</a>';
    }).join('');

    var html =
      /* ── Mega dropdown CSS (injected once) ── */
      '<style>' +
      '.nav-dd-wrap{position:relative;}' +
      '.nav-dd-btn{display:flex;align-items:center;gap:4px;padding:6px 9px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--text2);cursor:pointer;transition:all .2s;background:none;border:none;font-family:var(--fb);white-space:nowrap;}' +
      '.nav-dd-btn:hover,.nav-dd-btn.active{color:var(--text);background:rgba(0,0,0,.05);}' +
      '[data-theme="dark"] .nav-dd-btn:hover,[data-theme="dark"] .nav-dd-btn.active{background:rgba(255,255,255,.06);}' +
      '.nav-dd-chev{font-size:8px;color:var(--text3);transition:transform .2s;}' +
      '.nav-dd-wrap:hover .nav-dd-chev{transform:rotate(180deg);}' +
      '.nav-mega{position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border2);border-radius:var(--r2);padding:8px;min-width:240px;box-shadow:0 16px 48px rgba(0,0,0,.12);z-index:1200;display:none;flex-direction:column;gap:2px;animation:fadeUp .15s ease;}' +
      '[data-theme="dark"] .nav-mega{box-shadow:0 16px 48px rgba(0,0,0,.5);}' +
      '.nav-mega.open{display:flex;}' +
      '.nav-mega-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--r);transition:all .2s;color:var(--text2);}' +
      '.nav-mega-item:hover,.nav-mega-item-active{background:var(--bg2);color:var(--text);}' +
      '.nav-mega-icon{width:30px;height:30px;border-radius:8px;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}' +
      '.nav-mega-item:hover .nav-mega-icon,.nav-mega-item-active .nav-mega-icon{background:var(--gold-dim);}' +
      '.nav-mega-text{display:flex;flex-direction:column;}' +
      '.nav-mega-label{font-size:13px;font-weight:600;color:var(--text);}' +
      '.nav-mega-desc{font-size:11px;color:var(--text3);margin-top:1px;}' +
      '.logo{cursor:pointer;}' +
      '@media(max-width:768px){' +
        '.logo{cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
      '}' +
      '</style>' +

      /* ── Nav ── */
      '<nav class="nav" id="mainNav">' +
        '<div class="nav-in">' +

          '<a href="index.html" class="logo" id="navLogo">' +
            '<img src="logo.png" class="logo-img" alt="ImpactGrid" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
            '<div class="logo-mark" style="display:none;">IG</div>' +
            '<span class="logo-text">ImpactGrid</span>' +
          '</a>' +

          '<ul class="nav-links">' +
            desktopLinks +
          '</ul>' +

          '<div class="nav-right">' +
            '<button class="theme-btn" id="themeBtn" onclick="toggleTheme()" aria-label="Toggle theme">🌙</button>' +

            '<a href="creator-studio.html" class="btn-gold-sm">Try Creator Studio Free →</a>' +

            '<button class="hamburger" id="hamburger" aria-label="Open menu" onclick="openSidebar()">' +
              '<span></span><span></span><span></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</nav>' +

      /* ── Mobile sidebar overlay ── */
      '<div class="mob-overlay" id="mobOverlay" onclick="closeSidebar()"></div>' +
      '<div class="mob-sidebar" id="mobSidebar">' +
        '<div class="mob-head">' +
          '<div class="mob-logo">' +
            '<img src="logo.png" style="width:26px;height:26px;object-fit:contain;border-radius:5px;" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
            '<div style="display:none;width:26px;height:26px;border-radius:6px;background:linear-gradient(135deg,var(--gold),var(--gold2));align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">IG</div>' +
            'ImpactGrid' +
          '</div>' +
          '<button class="mob-close" onclick="closeSidebar()">✕</button>' +
        '</div>' +
        '<div class="mob-nav">' + mobileLinks + '</div>' +
        '<div class="mob-theme-row">' +
          '<span>Theme</span>' +
          '<button class="mob-tbtn" id="mobTBtn" onclick="toggleTheme()">🌙 Dark</button>' +
        '</div>' +
      '</div>';

    var container = document.getElementById('ig-nav');
    if (container) container.innerHTML = html;

    _initNavInteractions();

    var logo = document.getElementById('navLogo');
    if (logo) {
      logo.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          openSidebar();
        }
      });
    }
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-dd-wrap')) {
      document.querySelectorAll('.nav-mega').forEach(function(m) { m.classList.remove('open'); });
    }
  });

  /* ─────────────────────────────────────────
     ESCAPE KEY
  ───────────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      window.closeSidebar();
    }
  });

  /* ─────────────────────────────────────────
     RENDER FOOTER
  ───────────────────────────────────────── */
  function renderFooter() {
    var html =
      '<footer class="footer">' +
        '<div class="footer-in">' +
          '<div class="footer-grid">' +
            '<div class="f-brand">' +
              '<div style="display:flex;align-items:center;gap:8px;font-family:var(--fd);font-weight:900;font-size:15px;letter-spacing:-.03em;">' +
                '<img src="logo.png" style="width:28px;height:28px;object-fit:contain;border-radius:5px;" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
                '<div style="display:none;width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,var(--gold),var(--gold2));align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;">IG</div>' +
                'ImpactGrid' +
              '</div>' +
              '<p>Turning data into strategic advantage with analytics, AI, creator tools, and professional networking.</p>' +
            '</div>' +
            '<div class="fc"><h4>Services</h4><a href="consulting.html">Consulting</a><a href="analytics.html">Analytics</a><a href="creator-studio.html">Creator Studio</a><a href="ai.html">Dijo AI</a></div>' +
            '<div class="fc"><h4>Platform</h4><a href="network.html">Network</a><a href="jobs.html">Jobs</a><a href="pricing.html">Pricing</a><a href="about.html">About</a><a href="mailto:support@impactgridgroup.com">Contact</a></div>' +
            '<div class="fc"><h4>Legal</h4><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a></div>' +
          '</div>' +
          '<div class="footer-bot">' +
            '<span>© 2026 ImpactGrid Group Ltd. All rights reserved.</span>' +
            '<div class="footer-legal"><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></div>' +
            '<button class="footer-tbtn" onclick="toggleTheme()" id="footerTBtn">🌙 Dark Mode</button>' +
          '</div>' +
        '</div>' +
      '</footer>';

    var container = document.getElementById('ig-footer');
    if (container) container.innerHTML = html;
  }

  /* ─────────────────────────────────────────
     THEME
  ───────────────────────────────────────── */
  var _isDark = false;
  function _applyTheme(dark) {
    _isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var ico = dark ? '☀️' : '🌙';
    var tb = document.getElementById('themeBtn');   if(tb) tb.textContent = ico;
    var fb = document.getElementById('footerTBtn'); if(fb) fb.textContent = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
    var mb = document.getElementById('mobTBtn');    if(mb) mb.textContent = dark ? '☀️ Light' : '🌙 Dark';
    try { localStorage.setItem('ig_theme', dark ? 'dark' : 'light'); } catch(e) {}
  }
  window.toggleTheme = function() { _applyTheme(!_isDark); };
  (function() {
    try { if (localStorage.getItem('ig_theme') === 'dark') _applyTheme(true); } catch(e) {}
  })();

  /* ─────────────────────────────────────────
     SIDEBAR
  ───────────────────────────────────────── */
  window.openSidebar = function() {
    var s = document.getElementById('mobSidebar');
    var o = document.getElementById('mobOverlay');
    if (s) s.classList.add('open');
    if (o) o.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeSidebar = function() {
    var s = document.getElementById('mobSidebar');
    var o = document.getElementById('mobOverlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('open');
    document.body.style.overflow = '';
  };

  /* ─────────────────────────────────────────
     PROFILE DROPDOWN
  ───────────────────────────────────────── */
  window.toggleDD = function() {
    var d = document.getElementById('uDrop');
    if (d) d.classList.toggle('open');
  };

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function _initNavInteractions() {
    try { if (localStorage.getItem('ig_theme') === 'dark') _applyTheme(true); } catch(e) {}
  }

  /* ─────────────────────────────────────────
     SCROLL ANIMATIONS
  ───────────────────────────────────────── */
  function _initScrollAnimations() {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.07 });
    document.querySelectorAll('.anim').forEach(function(el) { io.observe(el); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initScrollAnimations);
  } else {
    _initScrollAnimations();
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  window.renderNav    = renderNav;
  window.renderFooter = renderFooter;

})();
