/* ═══════════════════════════════════════════════════════
   ImpactGrid Group — nav.js
   Shared nav + footer + auth + theme toggle
   Version: 4.1 — Settings added to user dropdown + mobile sidebar

   HOW TO USE ON ANY PAGE (except index.html which is inline):
   ─────────────────────────────────────────────────────────
   1. In <head>:
      <link rel="stylesheet" href="shared.css">

   2. In <body>, first element after opening tag:
      <div id="ig-nav"></div>

   3. At the very end of <body>, before </body>:
      <div id="ig-footer"></div>

   4. Load scripts (order matters):
      <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
      <script defer src="supabase-config.js"></script>
      <script defer src="nav.js"></script>

   5. After nav.js, call:
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          renderNav('yourpage.html');   // pass current page filename
          renderFooter();
        });
      </script>

   NOTE: index.html manages its own nav inline — do NOT load nav.js there.
═══════════════════════════════════════════════════════ */

(function() {

  /* ────────────────────────────────────────────────────
     NAV LINKS — single source of truth for all pages
  ──────────────────────────────────────────────────── */
  var NAV_LINKS = [
    { href: 'index.html',          label: 'Home' },
    { href: 'about.html',          label: 'About' },
    { href: 'consulting.html',     label: 'Consulting' },
    { href: 'analytics.html',      label: 'Analytics' },
    { href: 'creator-studio.html', label: 'Creator Studio' },
    { href: 'network.html',        label: 'Network' },
    { href: 'ai.html',             label: 'Dijo AI' },
    { href: 'dashboard.html',      label: 'Jobs' },
  ];

  /* ────────────────────────────────────────────────────
     RENDER NAV
     activePage: filename string e.g. 'about.html'
  ──────────────────────────────────────────────────── */
  function renderNav(activePage) {
    var desktopLinks = NAV_LINKS.map(function(l) {
      var cls = l.href === activePage ? ' class="active"' : '';
      return '<li><a href="' + l.href + '"' + cls + '>' + l.label + '</a></li>';
    }).join('');

    var mobileLinks = NAV_LINKS.map(function(l) {
      var cls = l.href === activePage ? ' class="active"' : '';
      return '<a href="' + l.href + '"' + cls + ' onclick="closeSidebar()">' + l.label + '</a>';
    }).join('');

    var html =
      /* ── Desktop nav ── */
      '<nav class="nav" id="mainNav">' +
        '<div class="nav-in">' +
          '<a href="index.html" class="logo" id="navLogo">' +
            '<img src="logo.png" class="logo-img" alt="ImpactGrid"' +
              ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
            '<div class="logo-mark" style="display:none;">IG</div>' +
            '<span class="logo-text">ImpactGrid</span>' +
          '</a>' +
          '<ul class="nav-links">' + desktopLinks + '</ul>' +
          '<div class="nav-right">' +
            '<button class="theme-btn" id="themeBtn" onclick="toggleTheme()" aria-label="Toggle theme">🌙</button>' +
            /* Logged-out buttons */
            '<div id="navOut" style="display:flex;align-items:center;gap:7px;">' +
              '<a href="login.html" class="btn-ghost-sm">Login</a>' +
              '<a href="join.html" class="btn-gold-sm">Join ImpactGrid</a>' +
            '</div>' +
            /* Logged-in user button + dropdown */
            '<div id="navIn" style="display:none;position:relative;">' +
              '<button class="user-btn" id="uBtn" onclick="toggleDD()">' +
                '<div class="u-av" id="uAv">?</div>' +
                '<span class="u-name" id="uName">Account</span>' +
                '<span class="u-chev">▾</span>' +
              '</button>' +
              '<div class="u-drop" id="uDrop">' +
                '<div class="dd-email" id="uEmail"></div>' +
                '<div class="dd-div"></div>' +
                '<a href="dashboard.html">⚡ My Dashboard</a>' +
                '<a href="settings.html">⚙️ Settings</a>' +
                '<div class="dd-div"></div>' +
                '<button onclick="igOut()">↩ Sign Out</button>' +
              '</div>' +
            '</div>' +
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
            '<img src="logo.png" style="width:26px;height:26px;object-fit:contain;border-radius:5px;" alt=""' +
              ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
            '<div style="display:none;width:26px;height:26px;border-radius:6px;background:linear-gradient(135deg,var(--gold),var(--gold2));align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">IG</div>' +
            'ImpactGrid' +
          '</div>' +
          '<button class="mob-close" onclick="closeSidebar()">✕</button>' +
        '</div>' +
        /* Mobile user info card — shown when logged in */
        '<div class="mob-user" id="mobUser">' +
          '<div class="u-av" id="mobAv" style="width:34px;height:34px;border-radius:8px;font-size:14px;">?</div>' +
          '<div class="mob-u-info">' +
            '<div class="mob-u-name" id="mobName">My Account</div>' +
            '<div class="mob-u-email" id="mobEmail"></div>' +
          '</div>' +
        '</div>' +
        /* Main nav links */
        '<div class="mob-nav">' + mobileLinks + '</div>' +
        '<div class="mob-div"></div>' +
        /* Auth section */
        '<div class="mob-auth">' +
          /* Logged-out state */
          '<div class="mob-out" id="mobOut">' +
            '<a href="login.html" class="mob-alink" onclick="closeSidebar()">Login</a>' +
            '<a href="join.html" class="mob-acta" onclick="closeSidebar()">Join ImpactGrid →</a>' +
          '</div>' +
          /* Logged-in state — Dashboard + Settings + Sign Out */
          '<div class="mob-in" id="mobIn">' +
            '<a href="dashboard.html" class="mob-adash" onclick="closeSidebar()">⚡ My Dashboard →</a>' +
            '<a href="settings.html" class="mob-alink" onclick="closeSidebar()" style="text-align:center;font-weight:600;">⚙️ Settings</a>' +
            '<button class="mob-asignout" onclick="igOut()">Sign Out</button>' +
          '</div>' +
        '</div>' +
        '<div class="mob-theme-row">' +
          '<span>Theme</span>' +
          '<button class="mob-tbtn" id="mobTBtn" onclick="toggleTheme()">🌙 Dark</button>' +
        '</div>' +
      '</div>';

    var container = document.getElementById('ig-nav');
    if (container) {
      container.innerHTML = html;
    } else {
      /* Fallback: try old container name */
      var legacy = document.getElementById('nav-container');
      if (legacy) legacy.innerHTML = html;
    }

    /* Wire up interactions after DOM is ready */
    _initNavInteractions();
  }

  /* ────────────────────────────────────────────────────
     RENDER FOOTER
  ──────────────────────────────────────────────────── */
  function renderFooter() {
    var html =
      '<footer class="footer">' +
        '<div class="footer-in">' +
          '<div class="footer-grid">' +
            '<div class="f-brand">' +
              '<div style="display:flex;align-items:center;gap:8px;font-family:var(--fd);font-weight:900;font-size:15px;letter-spacing:-.03em;">' +
                '<img src="logo.png" style="width:28px;height:28px;object-fit:contain;border-radius:5px;" alt=""' +
                  ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
                '<div style="display:none;width:28px;height:28px;border-radius:7px;background:linear-gradient(135deg,var(--gold),var(--gold2));align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;">IG</div>' +
                'ImpactGrid' +
              '</div>' +
              '<p>Turning data into strategic advantage with analytics, AI, creator tools, and professional networking.</p>' +
            '</div>' +
            '<div class="fc">' +
              '<h4>Platform</h4>' +
              '<a href="analytics.html">Analytics</a>' +
              '<a href="creator-studio.html">Creator Studio</a>' +
              '<a href="network.html">Network</a>' +
              '<a href="ai.html">Dijo AI</a>' +
            '</div>' +
            '<div class="fc">' +
              '<h4>Company</h4>' +
              '<a href="about.html">About</a>' +
              '<a href="consulting.html">Consulting</a>' +
              '<a href="pricing.html">Pricing</a>' +
              '<a href="dashboard.html">Jobs</a>' +
              '<a href="mailto:support@impactgridgroup.com">Contact</a>' +
            '</div>' +
            '<div class="fc">' +
              '<h4>Legal</h4>' +
              '<a href="privacy.html">Privacy Policy</a>' +
              '<a href="terms.html">Terms of Service</a>' +
            '</div>' +
          '</div>' +
          '<div class="footer-bot">' +
            '<span>© 2026 ImpactGrid Group Ltd. All rights reserved.</span>' +
            '<div class="footer-legal">' +
              '<a href="privacy.html">Privacy</a>' +
              '<a href="terms.html">Terms</a>' +
            '</div>' +
            '<button class="footer-tbtn" onclick="toggleTheme()" id="footerTBtn">🌙 Dark Mode</button>' +
          '</div>' +
        '</div>' +
      '</footer>';

    var container = document.getElementById('ig-footer');
    if (container) {
      container.innerHTML = html;
    } else {
      /* Fallback: try old container name */
      var legacy = document.getElementById('footer-container');
      if (legacy) legacy.innerHTML = html;
    }
  }

  /* ────────────────────────────────────────────────────
     THEME TOGGLE
     Light is default. Dark is opt-in. Persisted in localStorage.
  ──────────────────────────────────────────────────── */
  var _isDark = false;

  function _applyTheme(dark) {
    _isDark = dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var ico    = dark ? '☀️' : '🌙';
    var fLabel = dark ? '☀️ Light Mode' : '🌙 Dark Mode';
    var mLabel = dark ? '☀️ Light' : '🌙 Dark';
    var tb = document.getElementById('themeBtn');   if (tb) tb.textContent = ico;
    var fb = document.getElementById('footerTBtn'); if (fb) fb.textContent = fLabel;
    var mb = document.getElementById('mobTBtn');    if (mb) mb.textContent = mLabel;
    try { localStorage.setItem('ig_theme', dark ? 'dark' : 'light'); } catch(e) {}
  }

  /* Expose globally so onclick="toggleTheme()" works from any page */
  window.toggleTheme = function() { _applyTheme(!_isDark); };

  /* Apply saved preference immediately on load */
  (function() {
    try {
      if (localStorage.getItem('ig_theme') === 'dark') _applyTheme(true);
    } catch(e) {}
  })();

  /* ────────────────────────────────────────────────────
     SIDEBAR
  ──────────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────────────
     DROPDOWN
  ──────────────────────────────────────────────────── */
  window.toggleDD = function() {
    var d = document.getElementById('uDrop');
    if (d) d.classList.toggle('open');
  };

  /* ────────────────────────────────────────────────────
     AUTH
  ──────────────────────────────────────────────────── */
  function _setUser(user) {
    if (!user) return;
    var email = user.email || '';
    var name  = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name))
                || email.split('@')[0] || 'Account';
    var init  = (name.charAt(0) || '?').toUpperCase();

    /* Desktop nav */
    var navOut = document.getElementById('navOut');
    var navIn  = document.getElementById('navIn');
    if (navOut) navOut.style.display = 'none';
    if (navIn)  navIn.style.display  = 'block';

    var uAv    = document.getElementById('uAv');
    var uName  = document.getElementById('uName');
    var uEmail = document.getElementById('uEmail');
    if (uAv)    uAv.textContent    = init;
    if (uName)  uName.textContent  = name.split(' ')[0];
    if (uEmail) uEmail.textContent = email;

    /* Mobile sidebar */
    var mobUser  = document.getElementById('mobUser');
    var mobAv    = document.getElementById('mobAv');
    var mobName  = document.getElementById('mobName');
    var mobEmail = document.getElementById('mobEmail');
    var mobOut   = document.getElementById('mobOut');
    var mobIn    = document.getElementById('mobIn');
    if (mobUser)  mobUser.classList.add('show');
    if (mobAv)    mobAv.textContent    = init;
    if (mobName)  mobName.textContent  = name;
    if (mobEmail) mobEmail.textContent = email;
    if (mobOut)   mobOut.classList.add('hide');
    if (mobIn)    mobIn.classList.add('show');
  }

  function _clearUser() {
    var navOut = document.getElementById('navOut');
    var navIn  = document.getElementById('navIn');
    if (navOut) navOut.style.display = 'flex';
    if (navIn)  navIn.style.display  = 'none';

    var mobUser = document.getElementById('mobUser');
    var mobOut  = document.getElementById('mobOut');
    var mobIn   = document.getElementById('mobIn');
    if (mobUser) mobUser.classList.remove('show');
    if (mobOut)  mobOut.classList.remove('hide');
    if (mobIn)   mobIn.classList.remove('show');
  }

  function _checkAuth() {
    var c = null;
    try { if (window.getSupabase) c = getSupabase(); } catch(e) {}
    try { if (!c && window.supabaseClient) c = window.supabaseClient; } catch(e) {}

    if (!c) {
      /* Fallback: read user from localStorage directly */
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf('supabase') !== -1) {
            var v = JSON.parse(localStorage.getItem(k) || '{}');
            if (v && v.user) { _setUser(v.user); return; }
          }
        }
      } catch(e) {}
      return;
    }

    c.auth.getUser()
      .then(function(r) { if (r && r.data && r.data.user) _setUser(r.data.user); })
      .catch(function() {});

    c.auth.onAuthStateChange(function(ev, s) {
      if (s && s.user) _setUser(s.user);
      else if (ev === 'SIGNED_OUT') _clearUser();
    });
  }

  /* igOut — single sign-out function used everywhere (index.html uses igOut too) */
  window.igOut = async function() {
    try {
      var c = (window.getSupabase && getSupabase()) || window.supabaseClient;
      if (c) await c.auth.signOut();
    } catch(e) {}
    window.location.href = 'index.html';
  };

  /* igLogout — alias for backwards compatibility with any old pages */
  window.igLogout = window.igOut;

  /* ────────────────────────────────────────────────────
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ──────────────────────────────────────────────────── */
  document.addEventListener('click', function(e) {
    var btn  = document.getElementById('uBtn');
    var drop = document.getElementById('uDrop');
    if (btn && drop && !btn.contains(e.target) && !drop.contains(e.target)) {
      drop.classList.remove('open');
    }
  });

  /* Close sidebar on Escape */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') window.closeSidebar();
  });

  /* ────────────────────────────────────────────────────
     INIT NAV INTERACTIONS (called after renderNav injects HTML)
  ──────────────────────────────────────────────────── */
  function _initNavInteractions() {
    /* Re-apply theme to newly injected buttons */
    try {
      var saved = localStorage.getItem('ig_theme');
      if (saved === 'dark') _applyTheme(true);
    } catch(e) {}

    /* Check auth after a short delay to allow Supabase to init */
    setTimeout(_checkAuth, 350);
  }

  /* ────────────────────────────────────────────────────
     SCROLL ANIMATIONS
     Shared across all pages. Add class="anim" to elements.
  ──────────────────────────────────────────────────── */
  function _initScrollAnimations() {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.07 });

    document.querySelectorAll('.anim').forEach(function(el) { io.observe(el); });
  }

  /* Run scroll animations on DOMContentLoaded */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _initScrollAnimations);
  } else {
    _initScrollAnimations();
  }

  /* ────────────────────────────────────────────────────
     EXPOSE PUBLIC API
  ──────────────────────────────────────────────────── */
  window.renderNav    = renderNav;
  window.renderFooter = renderFooter;

})();
