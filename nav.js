/* nav.js — ImpactGrid Creator Engine
   Works for BOTH id="sidebar" (new pages)
   and id="sb" (legacy pages)              */

function buildSidebar(activePage) {
  var icons = {
    grid:    '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    upload:  '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    clock:   '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    trend:   '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    users:   '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    locate:  '<circle cx="12" cy="12" r="3"/><path d="M22 12h-4M6 12H2M12 2v4M12 18v4"/>',
    star:    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    camera:  '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    mail:    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'
  };

  function ic(k) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icons[k] + '</svg>';
  }

  function lnk(href, icon, label, badge) {
    var isActive = activePage === href;
    /* Output BOTH class sets so it works regardless of which CSS is loaded:
       - .nitem / .active  (style.css pages)
       - .ni / .on         (inline-CSS legacy pages) */
    var cls = 'nitem ni' + (isActive ? ' active on' : '');
    var bdg = badge ? '<span class="nbadge nbdg">' + badge + '</span>' : '';
    return '<a href="' + href + '" class="' + cls + '">' + ic(icon) + label + bdg + '</a>';
  }

  return '' +
    '<div class="sbar-logo sb-logo">' +
      '<div class="sbar-brand sb-brand">ImpactGrid <em>Creator Engine</em></div>' +
      '<div class="sbar-sub sb-sub">AI Content Platform</div>' +
    '</div>' +
    '<nav class="sbar-nav sb-nav">' +
      '<div class="nlabel nlb">Platform</div>' +
      lnk('index.html',    'grid',     'Dashboard') +
      lnk('upload.html',   'upload',   'Upload Video', 'NEW') +
      lnk('calendar.html', 'calendar', 'Content Calendar') +
      lnk('schedule.html', 'clock',    'Posting Schedule') +
      lnk('trending.html', 'trend',    'Trending Topics') +
      '<div class="nlabel nlb">Services</div>' +
      lnk('creators.html',    'users',  'Book a Creator') +
      lnk('tracker.html',     'locate', 'Live Tracker') +
      lnk('services.html',    'star',   'All Services') +
      lnk('photography.html', 'camera', 'Photography') +
      '<div class="nlabel nlb">Company</div>' +
      lnk('about.html',   'info', 'About Us') +
      lnk('contact.html', 'mail', 'Contact') +
    '</nav>' +
    '<div class="sbar-foot sb-foot">' +
      '<a href="https://impactgridanalytics.com/" target="_blank" rel="noopener" class="sbar-analytics sb-ap">' +
        '<div class="sbar-a-icon sb-ai">&#128202;</div>' +
        '<div class="sbar-a-text sb-at"><strong>ImpactGrid Analytics</strong><span>Track your growth</span></div>' +
        '<span class="sbar-a-arrow sb-aa">&#8599;</span>' +
      '</a>' +
      '<div class="sbar-cta sb-cta">' +
        '<strong>&#127916; Start creating</strong>' +
        '<p>Upload a video, get 30 days of content instantly.</p>' +
        '<a href="upload.html">Upload Now &rarr;</a>' +
      '</div>' +
    '</div>';
}

function initNav(activePage) {
  /* Find sidebar — supports BOTH id="sidebar" (new) and id="sb" (legacy) */
  var sb = document.getElementById('sidebar') || document.getElementById('sb');
  if (sb) sb.innerHTML = buildSidebar(activePage);

  /* Overlay — reuse existing #ov or create one */
  var ov = document.getElementById('ov') || document.getElementById('navOverlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'ov';
    document.body.insertBefore(ov, document.body.firstChild);
  }
  ov.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:199;backdrop-filter:blur(2px)';
  ov.onclick = closeNav;

  /* Fade-up — supports both .fade-up (new) and .fu (legacy) */
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.07 });
  document.querySelectorAll('.fade-up, .fu').forEach(function(el) { obs.observe(el); });
}

function openNav() {
  var sb = document.getElementById('sidebar') || document.getElementById('sb');
  var ov = document.getElementById('ov') || document.getElementById('navOverlay');
  if (sb) sb.classList.add('open');
  if (ov) ov.style.display = 'block';
}

function closeNav() {
  var sb = document.getElementById('sidebar') || document.getElementById('sb');
  var ov = document.getElementById('ov') || document.getElementById('navOverlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.style.display = 'none';
}
