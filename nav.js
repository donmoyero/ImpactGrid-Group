/* ═══════════════════════════════════════════════
   ImpactGrid Group — Shared Nav + Footer
═══════════════════════════════════════════════ */

(function() {

  /* ── Inject Nav ── */
  function renderNav(activePage) {
    var links = [
      { href: 'index.html',          label: 'Home' },
      { href: 'about.html',          label: 'About' },
      { href: 'consulting.html',     label: 'Consulting' },
      { href: 'analytics.html',      label: 'Analytics' },
      { href: 'creator-studio.html', label: 'Creator Studio' },
      { href: 'network.html',        label: 'Network' },
      { href: 'ai.html',             label: 'Dija AI' },
      { href: 'pricing.html',        label: 'Pricing' },
    ];

    var linksHTML = links.map(function(l) {
      var active = l.href === activePage ? ' class="active"' : '';
      return '<li><a href="' + l.href + '"' + active + '>' + l.label + '</a></li>';
    }).join('');

    var html = '<nav class="nav" id="mainNav">' +
      '<div class="nav-inner">' +
        '<a href="index.html" class="nav-logo">' +
          '<div class="nav-logo-mark">IG</div>' +
          'ImpactGrid' +
        '</a>' +
        '<ul class="nav-links">' + linksHTML + '</ul>' +
        '<div class="nav-actions">' +
          '<a href="login.html" class="nav-login">Login</a>' +
          '<a href="join.html" class="btn btn-gold nav-cta">Join ImpactGrid</a>' +
        '</div>' +
        '<button class="nav-hamburger" id="hamburger" aria-label="Menu">' +
          '<span></span><span></span><span></span>' +
        '</button>' +
      '</div>' +
    '</nav>' +
    '<div class="mobile-nav" id="mobileNav">' +
      links.map(function(l) { return '<a href="' + l.href + '">' + l.label + '</a>'; }).join('') +
      '<a href="login.html">Login</a>' +
      '<a href="join.html" class="mobile-nav-cta">Join ImpactGrid</a>' +
    '</div>';

    var container = document.getElementById('nav-container');
    if (container) container.innerHTML = html;

    /* Hamburger toggle */
    setTimeout(function() {
      var btn = document.getElementById('hamburger');
      var mob = document.getElementById('mobileNav');
      if (btn && mob) {
        btn.addEventListener('click', function() {
          mob.classList.toggle('open');
        });
      }
    }, 0);
  }

  /* ── Inject Footer ── */
  function renderFooter() {
    var html = '<footer class="footer">' +
      '<div class="footer-inner">' +
        '<div class="footer-grid">' +
          '<div class="footer-brand">' +
            '<div class="nav-logo" style="margin-bottom:0;">' +
              '<div class="nav-logo-mark">IG</div>' +
              '<span style="font-family:var(--font-display);font-weight:900;font-size:18px;">ImpactGrid</span>' +
            '</div>' +
            '<p>Combining analytics, consulting, creator tools, and a professional network to help businesses and creators grow with intelligence.</p>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>Platform</h4>' +
            '<a href="analytics.html">Analytics</a>' +
            '<a href="creator-studio.html">Creator Studio</a>' +
            '<a href="network.html">Network</a>' +
            '<a href="ai.html">Dija AI</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>Company</h4>' +
            '<a href="about.html">About</a>' +
            '<a href="consulting.html">Consulting</a>' +
            '<a href="pricing.html">Pricing</a>' +
            '<a href="mailto:hello@impactgridgroup.com">Contact</a>' +
          '</div>' +
          '<div class="footer-col">' +
            '<h4>Legal</h4>' +
            '<a href="privacy.html">Privacy Policy</a>' +
            '<a href="terms.html">Terms of Service</a>' +
          '</div>' +
        '</div>' +
        '<div class="footer-bottom">' +
          '<span>© 2026 ImpactGrid Group Ltd. All rights reserved.</span>' +
          '<span>Turning Data Into Strategic Advantage</span>' +
        '</div>' +
      '</div>' +
    '</footer>';

    var container = document.getElementById('footer-container');
    if (container) container.innerHTML = html;
  }

  /* ── Auth state awareness ── */
  function updateNavAuth() {
    var session = null;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('supabase') !== -1) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && v.access_token) { session = v; break; }
        }
      }
    } catch(e) {}

    if (session) {
      /* Swap join/login for dashboard link */
      var actions = document.querySelector('.nav-actions');
      if (actions) {
        actions.innerHTML =
          '<a href="dashboard.html" class="btn btn-ghost" style="font-size:13.5px;">Dashboard</a>' +
          '<button onclick="igLogout()" class="nav-login" style="border:1px solid var(--border2);">Logout</button>';
      }
    }
  }

  window.igLogout = async function() {
    if (window.supabaseClient) await window.supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  };

  /* ── Expose ── */
  window.renderNav    = renderNav;
  window.renderFooter = renderFooter;
  window.updateNavAuth = updateNavAuth;

})();
