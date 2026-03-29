/* ═══════════════════════════════════════════════════════
   ImpactGrid Group — nav.js
   Version: 4.3

   BEFORE LOGIN:  Home | About | Services ▼ | Platform ▼  [Login] [Join]
   AFTER LOGIN:   Home | About | Services ▼ | Platform ▼  [Profile ▼]
                  Profile dropdown → Dashboard / Settings / Logout

   HOW TO USE:
   1. <div id="ig-nav"></div>  at top of body
   2. <div id="ig-footer"></div> at bottom of body
   3. Load: supabase CDN → ig-supabase.js → nav.js
   4. Call: renderNav('yourpage.html'); renderFooter();
   NOTE: index.html manages its own inline nav — do NOT load nav.js there.
═══════════════════════════════════════════════════════ */

(function() {

  /* ── Dropdown menus ── */
  var SERVICES_LINKS = [
    { href: 'consulting.html',     label: 'Consulting',      icon: '📊', desc: 'Data-driven business advisory' },
    { href: 'analytics.html',      label: 'Analytics',       icon: '📈', desc: 'AI-powered decision intelligence' },
    { href: 'creator-studio.html', label: 'Creator Studio',  icon: '🎬', desc: 'Trend signals and content tools' },
    { href: 'ai.html',             label: 'Dijo AI',         icon: '🤖', desc: 'Your always-on AI assistant' },
  ];

  var PLATFORM_LINKS = [
    { href: 'network.html',    label: 'Network',    icon: '🌐', desc: 'Professional talent ecosystem' },
    { href: 'dashboard.html',  label: 'Jobs',       icon: '💼', desc: 'Browse open opportunities' },
    { href: 'pricing.html',    label: 'Pricing',    icon: '💳', desc: 'Plans for every stage' },
    { href: 'about.html',      label: 'About',      icon: 'ℹ️',  desc: 'Our story and mission' },
  ];

  /* ── Top-level nav links ── */
  var NAV_LINKS = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
  ];

  /* ─────────────────────────────────────────
     BUILD MEGA DROPDOWN
  ───────────────────────────────────────── */
  function buildMegaDrop(id, links, activePage) {
    return '<div class="nav-mega" id="' + id + '">' +
      links.map(function(l) {
        var active = l.href === activePage ? ' nav-mega-item-active' : '';
        return '<a href="' + l.href + '" class="nav-mega-item' + active + '">' +
          '<span class="nav-mega-icon">' + l.icon + '</span>' +
          '<span class="nav-mega-text">' +
            '<span class="nav-mega-label">' + l.label + '</span>' +
            '<span class="nav-mega-desc">' + l.desc + '</span>' +
          '</span>' +
        '</a>';
      }).join('') +
    '</div>';
  }

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
      { href:'analytics.html',      label:'Analytics' },
      { href:'creator-studio.html', label:'Creator Studio' },
      { href:'ai.html',             label:'Dijo AI' },
      { href:'network.html',        label:'Network' },
      { href:'dashboard.html',      label:'Jobs' },
      { href:'pricing.html',        label:'Pricing' },
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
      /* Logo: desktop = link, mobile = sidebar trigger */
      '.logo{cursor:pointer;}' +
      '@media(max-width:768px){' +
        '.logo{cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
      '}' +
      '</style>' +

      /* ── Nav ── */
      '<nav class="nav" id="mainNav">' +
        '<div class="nav-in">' +

          /* Logo: on mobile taps open sidebar; on desktop navigates home */
          '<a href="index.html" class="logo" id="navLogo">' +
            '<img src="logo.png" class="logo-img" alt="ImpactGrid" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
            '<div class="logo-mark" style="display:none;">IG</div>' +
            '<span class="logo-text">ImpactGrid</span>' +
          '</a>' +

          '<ul class="nav-links">' +
            desktopLinks +
            /* Services dropdown */
            '<li class="nav-dd-wrap" id="dd-services">' +
              '<button class="nav-dd-btn" onclick="toggleNavDrop(\'nav-mega-services\')">' +
                'Services <span class="nav-dd-chev">▾</span>' +
              '</button>' +
              buildMegaDrop('nav-mega-services', SERVICES_LINKS, activePage) +
            '</li>' +
            /* Platform dropdown */
            '<li class="nav-dd-wrap" id="dd-platform">' +
              '<button class="nav-dd-btn" onclick="toggleNavDrop(\'nav-mega-platform\')">' +
                'Platform <span class="nav-dd-chev">▾</span>' +
              '</button>' +
              buildMegaDrop('nav-mega-platform', PLATFORM_LINKS, activePage) +
            '</li>' +
          '</ul>' +

          '<div class="nav-right">' +
            '<button class="theme-btn" id="themeBtn" onclick="toggleTheme()" aria-label="Toggle theme">🌙</button>' +

            /* ── Logged OUT ── */
            '<div id="navOut" style="display:flex;align-items:center;gap:7px;">' +
              '<a href="login.html" class="btn-ghost-sm">Login</a>' +
              '<a href="join.html" class="btn-gold-sm">Join ImpactGrid</a>' +
            '</div>' +

            /* ── Logged IN — Profile dropdown ── */
            '<div id="navIn" style="display:none;position:relative;">' +
              '<button class="user-btn" id="uBtn" onclick="toggleDD()">' +
                '<div class="u-av" id="uAv">?</div>' +
                '<span class="u-name" id="uName">Profile</span>' +
                '<span class="u-chev">▾</span>' +
              '</button>' +
              '<div class="u-drop" id="uDrop">' +
                '<div class="dd-email" id="uEmail"></div>' +
                '<div class="dd-div"></div>' +
                '<a href="dashboard.html">⚡ Dashboard</a>' +
                '<a href="settings.html">⚙️ Settings</a>' +
                '<div class="dd-div"></div>' +
                '<a href="index.html">← Back to Site</a>' +
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
            '<img src="logo.png" style="width:26px;height:26px;object-fit:contain;border-radius:5px;" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>' +
            '<div style="display:none;width:26px;height:26px;border-radius:6px;background:linear-gradient(135deg,var(--gold),var(--gold2));align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;">IG</div>' +
            'ImpactGrid' +
          '</div>' +
          '<button class="mob-close" onclick="closeSidebar()">✕</button>' +
        '</div>' +
        '<div class="mob-user" id="mobUser">' +
          '<div class="u-av" id="mobAv" style="width:34px;height:34px;border-radius:8px;font-size:14px;">?</div>' +
          '<div class="mob-u-info">' +
            '<div class="mob-u-name" id="mobName">My Account</div>' +
            '<div class="mob-u-email" id="mobEmail"></div>' +
          '</div>' +
        '</div>' +
        '<div class="mob-nav">' + mobileLinks + '</div>' +
        '<div class="mob-div"></div>' +
        /* Back to site — always visible in sidebar */
        '<a href="index.html" onclick="closeSidebar()" style="display:flex;align-items:center;gap:6px;padding:10px 16px;font-size:13px;font-weight:600;color:var(--text2);border-radius:var(--r);transition:background .2s;" onmouseover="this.style.background=\'var(--bg2)\'" onmouseout="this.style.background=\'\'">← Back to Site</a>' +
        '<div class="mob-div"></div>' +
        '<div class="mob-auth">' +
          '<div class="mob-out" id="mobOut">' +
            '<a href="login.html" class="mob-alink" onclick="closeSidebar()">Login</a>' +
            '<a href="join.html" class="mob-acta" onclick="closeSidebar()">Join ImpactGrid →</a>' +
          '</div>' +
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
    if (container) container.innerHTML = html;

    _initNavInteractions();

    /* ── Logo: mobile tap opens sidebar, desktop navigates home ── */
    var logo = document.getElementById('navLogo');
    if (logo) {
      logo.addEventListener('click', function(e) {
        /* Only intercept on mobile breakpoint */
        if (window.innerWidth <= 768) {
          e.preventDefault();
          openSidebar();
        }
        /* Desktop: let the <a href> navigate normally */
      });
    }
  }

  /* ─────────────────────────────────────────
     MEGA DROPDOWN TOGGLE
  ───────────────────────────────────────── */
  window.toggleNavDrop = function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var isOpen = el.classList.contains('open');
    /* Close all first */
    document.querySelectorAll('.nav-mega').forEach(function(m) { m.classList.remove('open'); });
    if (!isOpen) el.classList.add('open');
  };

  /* Close mega dropdowns on outside click */
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-dd-wrap')) {
      document.querySelectorAll('.nav-mega').forEach(function(m) { m.classList.remove('open'); });
    }
    /* Also close profile dropdown */
    var btn  = document.getElementById('uBtn');
    var drop = document.getElementById('uDrop');
    if (btn && drop && !btn.contains(e.target) && !drop.contains(e.target)) {
      drop.classList.remove('open');
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
            '<div class="fc"><h4>Platform</h4><a href="network.html">Network</a><a href="dashboard.html">Jobs</a><a href="pricing.html">Pricing</a><a href="about.html">About</a><a href="mailto:support@impactgridgroup.com">Contact</a></div>' +
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
     AUTH
  ───────────────────────────────────────── */
  function _setUser(user) {
    if (!user) return;
    var email = user.email || '';
    var name  = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name))
                || email.split('@')[0] || 'Account';
    var init  = (name.charAt(0) || '?').toUpperCase();

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

  window.igOut = async function() {
    try {
      var c = (window.getSupabase && getSupabase()) || window.supabaseClient;
      if (c) await c.auth.signOut();
    } catch(e) {}
    window.location.href = 'index.html';
  };
  window.igLogout = window.igOut;

  /* ─────────────────────────────────────────
     ESCAPE KEY
  ───────────────────────────────────────── */
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      window.closeSidebar();
      document.querySelectorAll('.nav-mega').forEach(function(m) { m.classList.remove('open'); });
      var d = document.getElementById('uDrop'); if (d) d.classList.remove('open');
    }
  });

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function _initNavInteractions() {
    try { if (localStorage.getItem('ig_theme') === 'dark') _applyTheme(true); } catch(e) {}
    setTimeout(_checkAuth, 350);
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
