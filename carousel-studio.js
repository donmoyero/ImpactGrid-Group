/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — creator-studio.js
   Merged & deduplicated — aligned to HTML IDs
   v2.1 — Mobile fixes: hamburger X animation,
           sidebar close button, swipe-to-close
═══════════════════════════════════════════════ */

var DIJO = 'https://impactgrid-dijo.onrender.com';
var _allTrends = [];
var _selectedStyle = 'Educational';
var trendChartInstance = null;
var _evalChannelData = null, _evalScoreData = null, _evalVideosData = null, _evalChatHistory = [];

/* ─────────────────────────────────────────────
   LOAD USER — called on DOMContentLoaded
   Syncs user from Supabase session, then
   updates greeting + avatar/name UI.
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   GET CURRENT USER — single source of truth.
   nav.js sets window.igUser via _loadProfile()
   and fires 'ig-user-ready'. Pages MUST NOT call
   supabase.auth.getUser() themselves — that causes
   double-auth and race conditions.
───────────────────────────────────────────── */
function getCurrentUser() {
  return window.igUser || null;
}

function loadUser() {
  // nav.js owns auth. We just read window.igUser.
  // If it's already set, render immediately.
  if (window.igUser) {
    _applyUserUI(window.igUser);
    return;
  }
  // Otherwise wait for nav.js to fire ig-user-ready
  document.addEventListener('ig-user-ready', function(e) {
    _applyUserUI(e.detail);
  }, { once: true });
}

function _applyUserUI(user) {
  if (!user) return;
  console.log('USER SYNCED ✅', user.email);

  // data-ig-greeting (set by nav.js too — this is belt-and-braces)
  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.querySelectorAll('[data-ig-greeting]').forEach(function(el) {
    el.textContent = greeting + ', ' + user.firstName;
  });

  updateUserUI();
  if (typeof setWelcome === 'function') setWelcome();
}

/* ─────────────────────────────────────────────
   UPDATE USER UI — fills name + avatar elements.
   Reads ONLY from window.igUser (set by nav.js).
   No auth calls — nav.js is the single source.
───────────────────────────────────────────── */
function updateUserUI() {
  var user = getCurrentUser();
  if (!user) return;

  var name   = user.name   || 'Creator';
  var avatar = user.avatarUrl || null;

  // data-user-avatar (legacy attr)
  document.querySelectorAll('[data-user-avatar]').forEach(function(el) {
    el.innerHTML = avatar
      ? '<img src="' + avatar + '" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">'
      : name.charAt(0).toUpperCase();
  });

  // data-ig-avatar (nav.js standard attr — belt-and-braces if nav beat us)
  document.querySelectorAll('[data-ig-avatar]').forEach(function(el) {
    if (!el.querySelector('img')) {
      el.innerHTML = avatar
        ? '<img src="' + avatar + '" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" alt="' + name + '">'
        : name.charAt(0).toUpperCase();
    }
  });

  // Fallback: named IDs used by some older panels
  var cardName = document.getElementById('profileName');
  var cardAv   = document.getElementById('profileAvatar');
  if (cardName) cardName.textContent = name;
  if (cardAv) {
    cardAv.innerHTML = avatar
      ? '<img src="' + avatar + '" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">'
      : name.charAt(0).toUpperCase();
  }
}

/* ─────────────────────────────────────────────
   BRIEFING
───────────────────────────────────────────── */


function safeTopic(t) {
  return t?.topic || 'No data';
}

function updateBriefing(trends) {
  const briefEl = document.getElementById('dijoBrief');
  if (!briefEl) return;

  const src = trends || _allTrends;
  if (!src || !src.length) {
    briefEl.textContent = 'No trends yet · Check back later';
    return;
  }

  const best = getBest3(src);
  briefEl.textContent = `📡 ${safeTopic(best.tiktok)} · ${safeTopic(best.youtube)} · ${safeTopic(best.google)}`;
}

/* ─────────────────────────────────────────────
   THEME
───────────────────────────────────────────── */
function toggleTheme() {
  var dark = document.documentElement.getAttribute('data-theme') !== 'dark';
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.getElementById('themeBtn').textContent = dark ? '☀️' : '🌙';
  try { localStorage.setItem('ig_theme', dark ? 'dark' : 'light'); } catch(e) {}
}
(function() {
  try {
    if (localStorage.getItem('ig_theme') === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      var btn = document.getElementById('themeBtn');
      if (btn) btn.textContent = '☀️';
    }
  } catch(e) {}
})();

/* ─────────────────────────────────────────────
   TABS — matches HTML's switchTab(name, sidebarItem)
───────────────────────────────────────────── */
function switchTab(name, sidebarItem) {
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn:not(.tab-soon)').forEach(function(b) { b.classList.remove('active'); });
  document.querySelectorAll('.sb-item').forEach(function(i) { i.classList.remove('active'); });

  var panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
  var tb = document.getElementById('tab-' + name);
  if (tb) tb.classList.add('active');
  if (sidebarItem) sidebarItem.classList.add('active');

  var ca = document.getElementById('contentArea');
  if (ca) ca.scrollTop = 0;

  closeSidebar();

  if (name === 'trends' && _allTrends.length) renderFullTrends();
  if (name === 'evaluator') initEvaluator();
  if (name === 'calendar') {
    if (typeof loadCalendar === 'function') loadCalendar();
  }
}

/* ─────────────────────────────────────────────
   SIDEBAR (mobile drawer)
   openSidebar / closeSidebar are also called
   from HTML onclick attributes.
───────────────────────────────────────────── */
function openSidebar() {
  var sb  = document.getElementById('sidebar');
  var ov  = document.getElementById('mobOverlay');
  var ham = document.querySelector('.hamburger');
  if (sb)  sb.classList.add('open');
  if (ov)  ov.classList.add('open');
  if (ham) ham.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  var sb  = document.getElementById('sidebar');
  var ov  = document.getElementById('mobOverlay');
  var ham = document.querySelector('.hamburger');
  if (sb)  sb.classList.remove('open');
  if (ov)  ov.classList.remove('open');
  if (ham) ham.classList.remove('is-open');
  document.body.style.overflow = '';
}

/* ─────────────────────────────────────────────
   USER MENU
   Nav dropdown is owned by nav.js (toggleDD / #uDrop).
   This click-outside listener is a safety net only.
───────────────────────────────────────────── */
document.addEventListener('click', function(e) {
  var d = document.getElementById('uDrop');
  if (d && !e.target.closest('.user-btn')) d.classList.remove('open');
});

/* ─────────────────────────────────────────────
   AUTH
   Nav UI (setNavUser, igSignOut, checkAuth) is
   fully owned by nav.js — do not duplicate here.
   Studio-specific auth work lives in loadUser()
   which is called by auth.js after initAuth().
───────────────────────────────────────────── */

// loadProfile() removed — nav.js handles profiles table lookup
// and exposes window.igUser with name + avatarUrl from the data Supabase.
// creator-studio.js reads window.igUser via setWelcome() and updateUserUI().

function setWelcome() {
  // nav.js _loadProfile() already set window.igUser from the PROFILES Supabase
  // and wrote the greeting into [data-ig-greeting] elements automatically.
  // We still update #dijoGreeting here as a belt-and-braces fallback
  // (handles the case where ig-user-ready fires before this function runs).

  var name;
  if (window.igUser && window.igUser.name) {
    name = window.igUser.firstName || window.igUser.name.split(' ')[0];
  } else if (getCurrentUser()) {
    var _u = getCurrentUser();
    name = (_u.user_metadata && _u.user_metadata.full_name)
           ? _u.user_metadata.full_name.split(' ')[0]
           : (_u.email && _u.email.split('@')[0])
           || 'Creator';
  } else {
    name = 'Creator';
  }

  var hour = new Date().getHours();
  var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  var greetEl = document.getElementById('dijoGreeting');
  if (greetEl) greetEl.textContent = greeting + ', ' + name;

  updateBriefing();
}

/* ─────────────────────────────────────────────
   ig-user-ready listener
   nav.js dispatches this after _loadProfile()
   completes — meaning window.igUser has real
   full_name + avatar_url from the profiles table.
   Re-run our UI updates so the greeting/avatar
   reflect the profiles data, not just auth metadata.
───────────────────────────────────────────── */
document.addEventListener('ig-user-ready', function() {
  setWelcome();
  updateUserUI();
});

/* ─────────────────────────────────────────────
   PAYWALL
   checkAccess() is ONLY called for generative
   actions (generate, save, export) — never
   for passive browsing panels.
───────────────────────────────────────────── */

// Panels that are always free to view — no gate
var IG_FREE_PANELS = ['dashboard', 'trends', 'calendar'];

function checkAccess() {
  // ✅ Never block passive browsing panels
  var activePanel = document.querySelector('.panel.active');
  if (activePanel) {
    var panelName = activePanel.id.replace('panel-', '');
    if (IG_FREE_PANELS.indexOf(panelName) !== -1) return true;
  }

  // 👑 Admin bypass
  if (isAdmin()) return true;

  // Not logged in
  if (!getCurrentUser()) {
    showUpgrade("Create an account to save and unlock more");
    return false;
  }

  // Free plan limit
  if (getPlan() === 'free' && getUses() >= 3) {
    showUpgrade("You've hit your free limit — upgrade to continue");
    return false;
  }

  return true;
}

function showUpgrade(message) {
  var existing = document.getElementById('upgradeBar');
  if (existing) existing.remove();

  var bar = document.createElement('div');
  bar.id = 'upgradeBar';
  var isLoggedIn = !!getCurrentUser();

  bar.innerHTML =
    '<div class="upgrade-inner">'
    + '<span>' + message + '</span>'
    + '<div style="display:flex;gap:8px;">'
    + '<a href="pricing.html" class="btn btn-primary">Upgrade</a>'
    + (!isLoggedIn
        ? '<a href="login.html" class="btn btn-secondary">Login</a>'
        : '')
    + '</div></div>';

  document.body.appendChild(bar);
  setTimeout(function() { bar.classList.add('show'); }, 50);
  setTimeout(function() { bar.remove(); }, 4000);
}

(function() {
  var style = document.createElement('style');
  style.innerHTML = [
    '#upgradeBar {',
    '  position: fixed;',
    '  top: 80px;',
    '  left: 50%;',
    '  transform: translateX(-50%) translateY(-20px);',
    '  background: var(--card);',
    '  border: 1px solid var(--border);',
    '  border-radius: 999px;',
    '  padding: 10px 16px;',
    '  box-shadow: var(--sh2);',
    '  opacity: 0;',
    '  transition: all .3s ease;',
    '  z-index: 9999;',
    '}',
    '#upgradeBar.show {',
    '  opacity: 1;',
    '  transform: translateX(-50%) translateY(0);',
    '}',
    '.upgrade-inner {',
    '  display: flex;',
    '  gap: 12px;',
    '  align-items: center;',
    '  font-size: 12px;',
    '}'
  ].join('\n');
  document.head.appendChild(style);
})();

function checkCarouselAccess() {
  if (isAdmin()) return true;

  if (!getCurrentUser()) {
    showUpgrade('Login required to create carousels');
    return false;
  }

  if (!canUse('carousel')) {
    showUpgrade('Upgrade for unlimited carousels');
    return false;
  }

  return true;
}

/* ─────────────────────────────────────────────
   DIJO API — 3-sentence max enforced
───────────────────────────────────────────── */
async function callDijo(message, mode) {
  var shortPrefix = 'Reply in 3 sentences max. Be direct and specific. No filler words. ';
  // If no trend context has been injected yet, add a note so Dijo doesn't fabricate data
  var trendNote = (!_allTrends.length && !message.includes('[LIVE TRENDS') && !message.includes('[No live trend'))
    ? '[No live trend data yet — ingestion running. Answer based on general creator knowledge.] '
    : '';
  var res = await fetch(DIJO + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: shortPrefix + trendNote + message, mode: mode || 'creator' })
  });
  if (!res.ok) {
    var e = await res.json().catch(function() { return {}; });
    throw new Error(e.error || 'Dijo error ' + res.status);
  }
  var data = await res.json();
  return data.reply || '';
}

/* ─────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────── */
function escH(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escJ(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
function fmtN(n) { return n ? Number(n).toLocaleString() : '—'; }
function toScore(s) { return Math.min(9.9, parseFloat((s / 10).toFixed(1))); }

/* ─────────────────────────────────────────────
   VIRAL INTELLIGENCE SCORING 🧠🔥
   TikTok = velocity engine ⚡
   YouTube = validation engine 🎯
   Google  = demand engine 🔍
───────────────────────────────────────────── */
function runTrendScoring(rawScore, platforms) {
  // Derive sub-scores from raw score (0-100 scale internally)
  var base = rawScore; // already 0-100
  var velocityScore   = base * 0.9;
  var engagementScore = base * 0.8;
  var commentsScore   = base * 0.7;
  var recencyScore    = base * 0.85;

  var platformWeight = 1;

  // 🔥 PLATFORM INTELLIGENCE
  if (platforms.includes('tiktok'))  platformWeight += 0.3;  // velocity king ⚡
  if (platforms.includes('youtube')) platformWeight += 0.2;  // validation 🎯
  if (platforms.includes('google'))  platformWeight += 0.1;  // demand 🔍

  var finalScore = Math.min(100,
    (
      velocityScore   * 0.45 +
      engagementScore * 0.25 +
      commentsScore   * 0.15 +
      recencyScore    * 0.15
    ) * platformWeight
  );

  return Math.min(9.9, parseFloat((finalScore / 10).toFixed(1)));
}

/* ─────────────────────────────────────────────
   TREND CLASSIFICATION 🧠
   Turns scores into actionable decision groups
───────────────────────────────────────────── */
function classifyTrend(t) {
  const velocity   = t.score;
  const confidence = t.confidence || 60;

  // Confidence gate lowered to 60: Google-only fallback data defaults to 60,
  // so without this change everything falls through to 'stable' and all three
  // "What to post" sections show empty. TikTok/YouTube data with real
  // confidence scores (75-90) still benefit from the higher tier naturally.
  if (velocity >= 8.5 && confidence >= 60) return 'blowup';
  if (velocity >= 7.0)                     return 'rising_fast';
  if (velocity >= 5.0)                     return 'early';
  return 'stable';
}

function buildTrendInsights() {
  const insights = { blowup: [], rising_fast: [], early: [] };

  _allTrends.forEach(function(t) {
    const type = classifyTrend(t);
    if (insights[type]) insights[type].push(t);
  });

  return insights;
}

/* ─────────────────────────────────────────────
   TREND DATA
───────────────────────────────────────────── */
/* renderAll — unified re-render called after any trend fetch */
function renderAll() {
  updateBriefing();
  loadBriefing();        // refresh pulse strip now that _allTrends is populated
  runTrendPrediction();
  renderDashTrends();
  renderDashOpps();
  updateTopTrends();
  // Chart + radar gauges + Dijo pick: always update so data is ready when user switches tab
  renderTrendChart();
  renderRadarGauges();
  renderDijoTopPick();
}

async function fetchTrends() {
  // ── Shared mapper — normalises any trend row from any endpoint ────────────
  function mapTrend(t, i) {
    // Prefer explicit `source` field (set by /trends/cross), fall back to platform_source
    var src = t.source || t.platform_source || 'google';
    var plat = src === 'youtube' ? 'yt'
      : src === 'tiktok'  ? 'tt'
      : src === 'cross'   ? 'cross' : 'gt';
    var platLbl = src === 'youtube' ? 'YouTube'
      : src === 'tiktok'  ? 'TikTok'
      : src === 'cross'   ? 'Cross' : 'Google';
    var platforms = src === 'cross'
      ? ['tiktok', 'youtube', 'google']
      : src === 'youtube' ? ['youtube']
      : src === 'tiktok'  ? ['tiktok']
      : ['google'];
    return {
      topic:        t.topic,
      score:        runTrendScoring(t.trend_score || t.avg_score || 50, platforms),
      plat:         plat,
      platLabel:    platLbl,
      rank:         i + 1,
      hashtags:     t.hashtags || [],
      videoCount:   t.video_count  || t.total_videos || 0,
      totalViews:   t.total_views  || 0,
      status:       t.status       || 'rising',
      igPrediction: t.instagram_prediction || 0,
      confidence:   t.confidence_score || t.velocity_score ||
                    (src === 'cross' ? 90 : src === 'tiktok' ? 75 : src === 'youtube' ? 70 : 60)
    };
  }

  // ── PRIMARY: cross-platform endpoint ─────────────────────────────────────
  // NOTE: /trends/cross returns { trends: [...] } NOT a bare array
  try {
    var ts = Date.now();
    var res = await fetch(DIJO + '/trends/cross?ts=' + ts);
    var data = await res.json();
    // Unwrap either shape: bare array OR { trends: [...] }
    var crossList = Array.isArray(data) ? data : (data && Array.isArray(data.trends) ? data.trends : null);
    if (crossList && crossList.length) {
      _allTrends = crossList.map(mapTrend);
      renderAll();
      return;
    }
  } catch(e) { console.warn('[fetchTrends] /trends/cross failed:', e.message); }

  // ── SECONDARY: live endpoint (all platforms) ──────────────────────────────
  try {
    var res2 = await fetch(DIJO + '/trends/live?limit=20&ts=' + Date.now());
    var data2 = await res2.json();
    var liveList = Array.isArray(data2) ? data2 : (data2 && Array.isArray(data2.trends) ? data2.trends : null);
    if (liveList && liveList.length) {
      _allTrends = liveList.map(mapTrend);
      renderAll();
      return;
    }
  } catch(e) { console.warn('[fetchTrends] /trends/live failed:', e.message); }

  // ── FALLBACK: Google RSS ──────────────────────────────────────────────────
  // This is last-resort only — data has no platform diversity or video stats.
  // If you see this in console regularly, check that /trends/cross and /trends/live
  // are returning data from Supabase (run /ingestion/debug to inspect).
  try {
    console.warn('[fetchTrends] Falling back to Google RSS — cross/live endpoints returned no data');
    var rss = await fetch(DIJO + '/trends/google?geo=GB');
    var rd = await rss.json();
    _allTrends = (rd.trends || []).slice(0, 20).map(function(topic, i) {
      return { topic: topic, score: 5.5, plat: 'gt', platLabel: 'Google', rank: i + 1, hashtags: [], videoCount: 0, totalViews: 0, status: 'rising', igPrediction: 0, confidence: 60 };
    });
    renderAll();
  } catch(e) { console.error('[fetchTrends] All endpoints failed:', e.message); }
}

function trendItemHTML(t) {
  var pct = Math.round((t.score / 10) * 100);
  var platCls = t.plat === 'yt' ? 'plat-yt' : t.plat === 'tt' ? 'plat-tt' : 'plat-gt';
  var meta = t.videoCount > 0
    ? t.videoCount + ' videos · ' + fmtN(t.totalViews) + ' views'
    : t.platLabel + ' · click to generate';

  // 🔥 FIX 2: Platform power badge — VIRAL INTELLIGENCE SYSTEM 🧠
  var badge =
    t.plat === 'tt'    ? '⚡ TikTok Viral'
    : t.plat === 'yt'  ? '🎯 YouTube Validated'
    : t.plat === 'cross' ? '🚀 Cross-Platform'
    : '🔍 Search Demand';

  // Confidence indicator
  var conf = t.confidence ? ' · ' + t.confidence + '% confidence' : '';

  return '<div class="trend-item" onclick="loadTopic(\'' + escJ(t.topic) + '\')">'
    + '<div class="ti-rank">#' + t.rank + '</div>'
    + '<div class="ti-info">'
    +   '<div class="ti-topic">' + escH(t.topic) + '</div>'
    +   '<div class="ti-meta">' + escH(meta) + '</div>'
    +   '<div class="ti-badge">' + badge + escH(conf) + '</div>'
    + '</div>'
    + '<div class="ti-bar-wrap"><div class="ti-bar"><div class="ti-bar-fill" style="width:' + pct + '%"></div></div><div class="ti-score">' + t.score.toFixed(1) + '/10</div></div>'
    + '<div class="ti-plat ' + platCls + '">' + escH(t.platLabel) + '</div>'
    + '</div>';
}

/* ─────────────────────────────────────────────
   BEST-PER-PLATFORM PICKER
   Returns the single highest-scoring trend for
   each platform from the current _allTrends set.
   Used by renderDashTrends so the dashboard
   always shows one meaningful pick per source
   rather than an arbitrary top-5 slice.
───────────────────────────────────────────── */
function getBest3(trends) {
  function top(plat) {
    return trends
      .filter(function(t) { return t.plat === plat; })
      .sort(function(a, b) { return b.score - a.score; })[0] || null;
  }
  return {
    tiktok:  top('tt'),
    youtube: top('yt'),
    google:  top('gt')
  };
}

function renderDashTrends() {
  var el = document.getElementById('dashTrendList');
  if (!el) return;

  if (!_allTrends.length) {
    el.innerHTML = '<div style="padding:16px;color:var(--text3);font-size:13px">Loading trends…</div>';
    return;
  }

  // ── Show analytical insight cards — the "why" behind Top Opportunities ──
  // One best pick per platform with velocity classification + action hint.
  var best  = getBest3(_allTrends);
  var picks = [best.tiktok, best.youtube, best.google].filter(Boolean);

  if (picks.length < 3) {
    var usedTopics = new Set(picks.map(function(t) { return t.topic; }));
    var extras     = _allTrends.filter(function(t) { return !usedTopics.has(t.topic); });
    while (picks.length < 3 && extras.length) picks.push(extras.shift());
  }

  var platColors = { tt: '#ff6464', yt: '#FFD700', gt: '#78b4ff', cross: '#4FB3A5' };
  var insightLabels = ['🥇 Top Signal', '🥈 Strong Pick', '🥉 Worth Watching'];

  el.innerHTML = picks.map(function(t, idx) {
    var color     = platColors[t.plat] || 'var(--gold)';
    var pct       = Math.round((t.score / 10) * 100);
    var cls       = classifyTrend(t);
    var clsLabel  = cls === 'blowup'      ? '🔥 Likely to blow up'
                  : cls === 'rising_fast' ? '⚡ Getting popular fast'
                  : cls === 'early'       ? '🟢 Early — get in now'
                  : '📊 Stable trend';
    var clsColor  = cls === 'blowup'      ? 'var(--green)'
                  : cls === 'rising_fast' ? 'var(--gold)'
                  : cls === 'early'       ? '#4FB3A5'
                  : 'var(--text3)';
    var actionHint = t.plat === 'tt'    ? 'Post a 30–60s hook video today'
                   : t.plat === 'yt'    ? 'Best for a 5–10 min explainer'
                   : t.plat === 'cross' ? 'Works across TikTok + YouTube'
                   : 'High search demand — SEO content wins';
    var vidMeta   = t.videoCount > 0
      ? fmtN(t.videoCount) + ' videos · ' + fmtN(t.totalViews) + ' views'
      : t.platLabel + ' trend data';

    return '<div class="trend-item" style="cursor:pointer;position:relative;overflow:hidden" onclick="loadTopic(\'' + escJ(t.topic) + '\')">'
      // animated progress stripe behind the card
      + '<div style="position:absolute;top:0;left:0;height:3px;width:' + pct + '%;background:' + color + ';border-radius:3px 3px 0 0;transition:width 1s ease"></div>'
      + '<div class="ti-rank" style="color:' + color + '">' + escH(insightLabels[idx] || ('#' + (idx + 1))) + '</div>'
      + '<div class="ti-info">'
      +   '<div class="ti-topic">' + escH(t.topic) + '</div>'
      +   '<div class="ti-meta">' + escH(vidMeta) + '</div>'
      +   '<div class="ti-badge" style="color:' + clsColor + '">' + clsLabel + '</div>'
      +   '<div style="font-size:10px;color:var(--text3);margin-top:2px;font-style:italic">' + escH(actionHint) + '</div>'
      + '</div>'
      + '<div class="ti-bar-wrap">'
      +   '<div class="ti-bar"><div class="ti-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>'
      +   '<div class="ti-score" style="color:' + color + '">' + t.score.toFixed(1) + '</div>'
      + '</div>'
      + '<div class="ti-plat" style="background:' + color + '20;color:' + color + ';border:1px solid ' + color + '40">' + escH(t.platLabel) + '</div>'
      + '</div>';
  }).join('');
}

function renderFullTrends() {
  renderTrendChart();
  renderRadarGauges();
  renderDijoTopPick();
}

/* ─────────────────────────────────────────────
   LIVE PLATFORM METERS
   Three animated meter cards — TikTok, YouTube,
   Google — each showing the #1 trend for that
   platform with a live animated fill bar and
   pulse dot. Updates every 60s via renderAll().
───────────────────────────────────────────── */
function renderPlatformMeters() {
  var el = document.getElementById('radarGaugesBox'); // legacy — superseded by renderRadarGauges()
  if (!el) return;
  if (!_allTrends.length) { el.innerHTML = ''; return; }

  function platBest(plat) {
    var filtered = _allTrends.filter(function(t) { return t.plat === plat; });
    if (!filtered.length) return null;
    return filtered.slice().sort(function(a, b) { return b.score - a.score; })[0];
  }

  var tt = platBest('tt');
  var yt = platBest('yt');
  var gt = platBest('gt');

  var platConfigs = [
    { key: 'tt', icon: '🎵', label: 'TikTok',  color: '#ff6464', trend: tt, emptyMsg: 'No TikTok data yet' },
    { key: 'yt', icon: '▶️',  label: 'YouTube', color: '#FFD700', trend: yt, emptyMsg: 'No YouTube data yet' },
    { key: 'gt', icon: '🔍', label: 'Google',  color: '#78b4ff', trend: gt, emptyMsg: 'No Google data yet'  }
  ];

  // Inject keyframes once
  if (!document.getElementById('_meterKeyframes')) {
    var style = document.createElement('style');
    style.id   = '_meterKeyframes';
    style.textContent = [
      '@keyframes meterPulse {',
      '  0%,100% { opacity:1; transform:scale(1); }',
      '  50%      { opacity:.4; transform:scale(1.5); }',
      '}',
      '@keyframes meterFillIn {',
      '  from { width:0; }',
      '}',
      '.live-meter-card { background:var(--card);border:1px solid var(--border);border-radius:14px;padding:14px 16px;display:flex;flex-direction:column;gap:8px;position:relative;overflow:hidden; }',
      '.live-meter-card:hover { border-color:var(--gold-glo); }',
      '.lm-stripe { position:absolute;top:0;left:0;right:0;height:3px;border-radius:3px 3px 0 0; }',
      '.lm-head { display:flex;align-items:center;gap:8px;justify-content:space-between; }',
      '.lm-icon { font-size:18px; }',
      '.lm-label { font-size:12px;font-weight:700;color:var(--text2); }',
      '.lm-score { font-family:"DM Mono",monospace;font-size:20px;font-weight:900; }',
      '.lm-topic { font-size:13px;font-weight:700;color:var(--text1);line-height:1.3;cursor:pointer; }',
      '.lm-topic:hover { text-decoration:underline; }',
      '.lm-bar-wrap { height:8px;background:var(--bg2);border-radius:99px;overflow:hidden; }',
      '.lm-bar-fill { height:100%;border-radius:99px;animation:meterFillIn .8s ease both; }',
      '.lm-meta { font-size:10px;color:var(--text3);display:flex;align-items:center;gap:6px; }',
      '.lm-dot { width:6px;height:6px;border-radius:50%;display:inline-block;animation:meterPulse 1.8s ease-in-out infinite; }',
      '.lm-cls { font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px;border:1px solid; }',
      '.pm-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;padding:4px 0 8px; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function meterCard(cfg) {
    if (!cfg.trend) {
      return '<div class="live-meter-card">'
        + '<div class="lm-stripe" style="background:' + cfg.color + '30"></div>'
        + '<div class="lm-head"><span class="lm-icon">' + cfg.icon + '</span><span class="lm-label">' + cfg.label + '</span></div>'
        + '<div style="font-size:12px;color:var(--text3);padding:8px 0">' + cfg.emptyMsg + '</div>'
        + '</div>';
    }

    var t      = cfg.trend;
    var pct    = Math.round((t.score / 10) * 100);
    var cls    = classifyTrend(t);
    var clsLbl = cls === 'blowup' ? '🔥 Blowup' : cls === 'rising_fast' ? '⚡ Rising' : cls === 'early' ? '🟢 Early' : '📊 Stable';
    var clsClr = cls === 'blowup' ? 'var(--green)' : cls === 'rising_fast' ? 'var(--gold)' : cls === 'early' ? '#4FB3A5' : 'var(--text3)';
    var vidMeta = t.videoCount > 0
      ? fmtN(t.videoCount) + ' videos'
      : (t.confidence ? t.confidence + '% confidence' : 'live data');

    return '<div class="live-meter-card">'
      + '<div class="lm-stripe" style="background:' + cfg.color + '"></div>'
      + '<div class="lm-head">'
      +   '<div style="display:flex;align-items:center;gap:8px">'
      +     '<span class="lm-icon">' + cfg.icon + '</span>'
      +     '<span class="lm-label">' + cfg.label + '</span>'
      +     '<span class="lm-dot" style="background:' + cfg.color + '"></span>'
      +   '</div>'
      +   '<span class="lm-score" style="color:' + cfg.color + '">' + t.score.toFixed(1) + '</span>'
      + '</div>'
      + '<div class="lm-topic" onclick="loadTopic(\'' + escJ(t.topic) + '\')">' + escH(t.topic) + '</div>'
      + '<div class="lm-bar-wrap">'
      +   '<div class="lm-bar-fill" style="width:' + pct + '%;background:' + cfg.color + '"></div>'
      + '</div>'
      + '<div class="lm-meta">'
      +   '<span class="lm-cls" style="color:' + clsClr + ';border-color:' + clsClr + '40">' + clsLbl + '</span>'
      +   '<span>·</span>'
      +   '<span>' + escH(vidMeta) + '</span>'
      + '</div>'
      + '</div>';
  }

  el.innerHTML = '<div class="pm-grid">'
    + platConfigs.map(meterCard).join('')
    + '</div>';
}

const pointLabelsPlugin = {
  id: 'pointLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);

      meta.data.forEach((point, index) => {
        const label = dataset.labels?.[index];
        if (!label) return;

        const x = point.x;
        const y = point.y;

        ctx.save();
        ctx.font = '11px DM Sans';

        const padding = 6;
        const textWidth = ctx.measureText(label).width;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = 20;

        // 🔥 AUTO POSITION (key fix)
        let offsetY = -28;

        // prevent top clipping
        if (y < 40) offsetY = 20;

        // BOX
        ctx.fillStyle = '#0f1117';
        ctx.strokeStyle = '#c97e08';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(
          x - boxWidth / 2,
          y + offsetY,
          boxWidth,
          boxHeight,
          6
        );
        ctx.fill();
        ctx.stroke();

        // TEXT
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + offsetY + 14);

        ctx.restore();
      });
    });
  }
};

/* ─────────────────────────────────────────────
   LIVE TREND CHART
   Three lines — TikTok (red), YouTube (gold),
   Google (blue). X-axis = top trend per platform.
   Chart re-draws every 60s via renderAll().
   A subtle pulse animation makes it feel live.
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   THREE PLATFORM CHARTS
   One line chart per platform — TikTok, YouTube,
   Google — each showing their top 3 trending topics
   with scores on Y axis. Lines rise and fall as
   scores update every 60s. Clicking a topic label
   opens the generator pre-filled with that topic.
───────────────────────────────────────────── */
var _chartTT = null, _chartYT = null, _chartGT = null;
// Store historical score snapshots so lines actually move
var _chartHistory = { tt: {}, yt: {}, gt: {} };
var _chartHistoryMax = 8; // keep last 8 snapshots per topic

function _recordSnapshot(plat, trends) {
  var hist = _chartHistory[plat];
  var now  = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  trends.forEach(function(t) {
    if (!hist[t.topic]) hist[t.topic] = [];
    hist[t.topic].push({ time: now, score: t.score });
    if (hist[t.topic].length > _chartHistoryMax) hist[t.topic].shift();
  });
}

function _buildPlatChart(canvasId, emptyId, topicsId, plat, color, label) {
  var canvas = document.getElementById(canvasId);
  var emptyEl = document.getElementById(emptyId);
  var topicsEl = document.getElementById(topicsId);
  if (!canvas) return null;

  var trends = _allTrends
    .filter(function(t){ return t.plat === plat; })
    .slice().sort(function(a,b){ return b.score - a.score; })
    .slice(0, 3);

  // Show empty state if no data for this platform
  if (!trends.length) {
    canvas.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    if (topicsEl) topicsEl.innerHTML = '';
    return null;
  }
  canvas.style.display = 'block';
  if (emptyEl) emptyEl.style.display = 'none';

  // Record this snapshot so lines have history to draw
  _recordSnapshot(plat, trends);
  var hist = _chartHistory[plat];

  // Build time labels from history of first topic (all share same timestamps)
  var firstTopic = trends[0].topic;
  var timeLabels = (hist[firstTopic] || []).map(function(h){ return h.time; });
  if (timeLabels.length < 2) {
    // Pad with fake earlier times so there is something to draw
    var base = timeLabels[0] || 'now';
    timeLabels = ['-7m', '-6m', '-5m', '-4m', '-3m', '-2m', '-1m', base].slice(-Math.max(timeLabels.length + 1, 2));
  }

  var datasets = trends.map(function(t, idx) {
    var alphas = ['ff', 'bb', '77'];
    var lineColor = color + (alphas[idx] || 'ff');
    var topicHist = hist[t.topic] || [];
    // Build data array: null for missing early slots, real score for known
    var data = timeLabels.map(function(lbl) {
      var match = topicHist.find(function(h){ return h.time === lbl; });
      return match ? match.score : null;
    });
    // If no history yet, just show current score at last point
    if (data.every(function(d){ return d === null; })) {
      data[data.length - 1] = t.score;
    }
    return {
      label: t.topic.length > 18 ? t.topic.slice(0, 18) + '…' : t.topic,
      _fullTopic: t.topic,
      data: data,
      borderColor: color,
      backgroundColor: color + '18',
      borderWidth: idx === 0 ? 2.5 : 1.5,
      borderDash: idx === 0 ? [] : idx === 1 ? [4,2] : [2,2],
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: color,
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
      tension: 0.4,
      fill: false,
      spanGaps: true
    };
  });

  // Destroy old chart instance
  var oldChart = plat === 'tt' ? _chartTT : plat === 'yt' ? _chartYT : _chartGT;
  if (oldChart) { oldChart.destroy(); }

  var ctx = canvas.getContext('2d');
  var newChart = new Chart(ctx, {
    type: 'line',
    data: { labels: timeLabels, datasets: datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeInOutQuart' },
      interaction: { mode: 'index', intersect: false },
      onClick: function(e, elements) {
        if (elements && elements.length) {
          var ds = datasets[elements[0].datasetIndex];
          if (ds && ds._fullTopic) loadTopic(ds._fullTopic);
        }
      },
      plugins: {
        legend: { display: false }, // we draw our own topic labels below
        tooltip: {
          backgroundColor: '#111',
          borderColor: color,
          borderWidth: 1,
          callbacks: {
            label: function(item) {
              if (item.raw === null) return item.dataset.label + ': no data';
              return item.dataset.label + ': ' + item.raw.toFixed(1) + '/10';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#666', font: { size: 9 }, maxRotation: 0, maxTicksLimit: 4 }
        },
        y: {
          min: 0, max: 10,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#666', font: { size: 9 },
            callback: function(v) { return v + '/10'; },
            stepSize: 2
          }
        }
      }
    }
  });

  if (plat === 'tt') _chartTT = newChart;
  else if (plat === 'yt') _chartYT = newChart;
  else _chartGT = newChart;

  // Render topic labels below chart — rank, topic name, score bar
  if (topicsEl) {
    topicsEl.innerHTML = trends.map(function(t, idx) {
      var pct = Math.round((t.score / 10) * 100);
      var cls = classifyTrend(t);
      var clsIcon = cls === 'blowup' ? '🔥' : cls === 'rising_fast' ? '⚡' : cls === 'early' ? '🟢' : '📊';
      var dashes = ['solid', 'dashed', 'dotted'];
      return '<div onclick="loadTopic(\'' + escJ(t.topic) + '\')" style="cursor:pointer;display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid var(--border)">'
        + '<div style="width:14px;height:3px;background:' + color + ';border-radius:2px;flex-shrink:0;opacity:' + (idx===0?1:idx===1?0.7:0.45) + ';border-style:' + dashes[idx] + '"></div>'
        + '<div style="flex:1;min-width:0">'
        +   '<div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escH(t.topic) + '</div>'
        +   '<div style="height:3px;background:var(--bg2);border-radius:99px;margin-top:3px;overflow:hidden">'
        +     '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:99px;transition:width .6s ease"></div>'
        +   '</div>'
        + '</div>'
        + '<div style="font-family:DM Mono,monospace;font-size:11px;font-weight:900;color:' + color + ';flex-shrink:0">' + t.score.toFixed(1) + ' ' + clsIcon + '</div>'
        + '</div>';
    }).join('');
  }

  return newChart;
}

function renderTrendChart() {
  _buildPlatChart('chartTT', 'chartTTEmpty', 'chartTTTopics', 'tt', '#ff6464', 'TikTok');
  _buildPlatChart('chartYT', 'chartYTEmpty', 'chartYTTopics', 'yt', '#FFD700', 'YouTube');
  _buildPlatChart('chartGT', 'chartGTEmpty', 'chartGTTopics', 'gt', '#78b4ff', 'Google');

  // Pulse live dots
  ['ttLiveDot','ytLiveDot','gtLiveDot','chartLiveDot'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  });
}

async function runTrendPrediction() {
  const el = document.getElementById('weeklyPrediction');
  if (!el || !_allTrends || !_allTrends.length) return;

  // Build insights first — used by other panels too
  window._trendInsights = buildTrendInsights();
  console.log('[TrendInsights] 🔥 Blowup:', window._trendInsights.blowup.length,
    '| ⚡ Rising fast:', window._trendInsights.rising_fast.length,
    '| 💡 Early:', window._trendInsights.early.length);

  // Show loading state immediately — don't leave "Analyzing trends..."
  const topLocal = _allTrends.slice().sort(function(a,b){ return b.score - a.score; })[0];
  el.innerHTML = '<span class="spinner spinner-gold"></span>'
    + '<span style="font-size:12px;color:var(--text3);margin-left:8px">Dijo is picking this week\'s best opportunity…</span>';

  // ── Try Dijo AI briefing first ────────────────────────────────────────────
  try {
    var res = await fetch(DIJO + '/ai/daily-briefing');
    var data = await res.json();

    if (data && data.briefing) {
      // Match the top trend from briefing data to our local scored list
      var aiTop = null;
      if (data.top_trends && data.top_trends.length) {
        var aiTopicName = data.top_trends[0].topic;
        aiTop = _allTrends.find(function(t) {
          return t.topic.toLowerCase() === aiTopicName.toLowerCase();
        }) || null;
      }
      var pick = aiTop || topLocal;

      // Extract a short reason from Dijo's briefing (first sentence only)
      var reason = '';
      if (data.briefing) {
        var firstSentence = data.briefing.split(/[.!?]/)[0];
        reason = firstSentence.length > 10 && firstSentence.length < 160
          ? firstSentence.trim()
          : '';
      }

      var platIcon = pick.plat === 'tt' ? '🎵' : pick.plat === 'yt' ? '▶️' : pick.plat === 'cross' ? '🚀' : '🔍';
      var statusColor = pick.score >= 8.5 ? 'var(--green)' : pick.score >= 7 ? 'var(--gold)' : 'var(--blue2)';
      var statusLabel = pick.score >= 8.5 ? '🔥 Peak now' : pick.score >= 7 ? '⚡ Rising fast' : '💡 Early stage';

      el.innerHTML =
        '<div style="display:flex;flex-direction:column;gap:8px">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
        +   '<div style="font-family:\'Syne\',sans-serif;font-size:17px;font-weight:900;line-height:1.2">'
        +     escH(pick.topic)
        +   '</div>'
        +   '<div style="font-family:\'DM Mono\',monospace;font-size:18px;font-weight:900;color:' + statusColor + ';flex-shrink:0">'
        +     pick.score.toFixed(1)
        +   '</div>'
        + '</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
        +   '<span style="font-size:11px;background:var(--gold-dim);border:1px solid var(--gold-glo);color:var(--gold);border-radius:6px;padding:2px 8px;font-family:\'DM Mono\',monospace">'
        +     platIcon + ' ' + escH(pick.platLabel)
        +   '</span>'
        +   '<span style="font-size:11px;color:' + statusColor + ';font-weight:700">' + statusLabel + '</span>'
        + '</div>'
        + (reason
          ? '<div style="font-size:12px;color:var(--text2);line-height:1.5;border-left:2px solid var(--gold);padding-left:8px">'
            + escH(reason) + '.'
            + '</div>'
          : '')
        + '<div style="font-size:11px;color:var(--text3);font-family:\'DM Mono\',monospace">Dijo\'s pick · ' + escH(data.date || 'This week') + '</div>'
        + '</div>';

      return;
    }
  } catch(e) {
    console.warn('[WeeklyPrediction] AI briefing failed, using local fallback:', e.message);
  }

  // ── Local fallback — use best scored trend without AI text ────────────────
  var pick = topLocal;
  var platIcon = pick.plat === 'tt' ? '🎵' : pick.plat === 'yt' ? '▶️' : pick.plat === 'cross' ? '🚀' : '🔍';
  var statusColor = pick.score >= 8.5 ? 'var(--green)' : pick.score >= 7 ? 'var(--gold)' : 'var(--blue2)';
  var statusLabel = pick.score >= 8.5 ? '🔥 Peak now' : pick.score >= 7 ? '⚡ Rising fast' : '💡 Early stage';

  el.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:8px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
    +   '<div style="font-family:\'Syne\',sans-serif;font-size:17px;font-weight:900;line-height:1.2">'
    +     escH(pick.topic)
    +   '</div>'
    +   '<div style="font-family:\'DM Mono\',monospace;font-size:18px;font-weight:900;color:' + statusColor + ';flex-shrink:0">'
    +     pick.score.toFixed(1)
    +   '</div>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
    +   '<span style="font-size:11px;background:var(--gold-dim);border:1px solid var(--gold-glo);color:var(--gold);border-radius:6px;padding:2px 8px;font-family:\'DM Mono\',monospace">'
    +     platIcon + ' ' + escH(pick.platLabel)
    +   '</span>'
    +   '<span style="font-size:11px;color:' + statusColor + ';font-weight:700">' + statusLabel + '</span>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--text2);line-height:1.5">'
    +   'Highest scored trend across all platforms this week.'
    + '</div>'
    + '<div style="font-size:11px;color:var(--text3);font-family:\'DM Mono\',monospace">Dijo\'s pick · local data</div>'
    + '</div>';
}

function filterTrends(btn, plat) {
  document.querySelectorAll('[data-plat]').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var el = document.getElementById('fullTrendList');
  if (!el) return;
  var list = plat === 'all' ? _allTrends : _allTrends.filter(function(t) { return t.plat === plat; });
  el.innerHTML = list.length
    ? list.map(trendItemHTML).join('')
    : '<div style="padding:16px;color:var(--text3)">No trends for this filter.</div>';
}

/* ─────────────────────────────────────────────
   OPPORTUNITIES — powered by /trends/dijo
   renderOpportunities(data) accepts the raw
   Dijo API shape (trend_score, platform_source,
   dijoScore, etc.) and maps it to opp-cards.
   renderDashOpps() is a fast synchronous fallback
   used by the 60s/20s refresh intervals — it
   re-renders from the already-loaded _allTrends
   so we don't fire an extra network request on
   every tick.
───────────────────────────────────────────── */
function renderOpportunities(data) {
  var el = document.getElementById('topOppBox');
  if (!el) return;

  if (!data || !data.length) {
    el.innerHTML = '<div class="opp-empty">No opportunities yet — check back soon</div>';
    return;
  }

  /* ── Guaranteed 1-per-platform using getBest3 ──────────────────────────
     We always re-derive picks from _allTrends via getBest3 so the cards
     are ALWAYS TikTok / YouTube / Google regardless of what shape the
     incoming `data` array has.  The `data` param is only used when
     _allTrends is empty (e.g. first paint from /trends/dijo API response).
  ──────────────────────────────────────────────────────────────────────── */
  var picks;

  if (_allTrends.length) {
    // Local path — guaranteed 1 per platform
    var best = getBest3(_allTrends);
    picks = [
      best.tiktok  ? { topic: best.tiktok.topic,  platform_source: 'tiktok',  _score: best.tiktok.score,  label: 'Best TikTok Opportunity',  status: best.tiktok.status,  video_count: best.tiktok.videoCount  } : null,
      best.youtube ? { topic: best.youtube.topic, platform_source: 'youtube', _score: best.youtube.score, label: 'Best YouTube Opportunity', status: best.youtube.status, video_count: best.youtube.videoCount } : null,
      best.google  ? { topic: best.google.topic,  platform_source: 'google',  _score: best.google.score,  label: 'Best Google Opportunity',  status: best.google.status,  video_count: best.google.videoCount  } : null
    ].filter(Boolean);
  } else {
    // API path — deduplicate by platform_source, one per platform
    var seenPlat = {};
    picks = [];
    ['tiktok', 'youtube', 'google', 'cross'].forEach(function(p) {
      var match = data.find(function(t) { return (t.platform_source || 'google') === p && !seenPlat[p]; });
      if (match) { seenPlat[p] = true; picks.push(match); }
    });
    // Fill to 3 if needed
    data.forEach(function(t) {
      if (picks.length < 3 && !picks.includes(t)) picks.push(t);
    });
  }

  var items = picks.slice(0, 3);

  var platMeta = {
    youtube: { icon: '▶️', color: '#FFD700', hint: '5–10 min explainer'         },
    tiktok:  { icon: '⚡', color: '#ff6464', hint: '30–60s hook video'           },
    google:  { icon: '🔍', color: '#78b4ff', hint: 'SEO article or Short'        },
    cross:   { icon: '🚀', color: '#4FB3A5', hint: 'Post on TikTok + YouTube'    }
  };

  var platLabels = {
    tiktok:  'Best TikTok Opportunity',
    youtube: 'Best YouTube Opportunity',
    google:  'Best Google Opportunity',
    cross:   'Cross-Platform Pick'
  };

  var rankColors = ['var(--gold)', 'var(--green)', 'var(--blue2)'];

  el.innerHTML = items.map(function(t, idx) {
    var src        = t.platform_source || 'google';
    var pm         = platMeta[src]     || platMeta.google;
    var rankColor  = rankColors[idx]   || 'var(--text2)';
    var rankLabel  = t.label           || platLabels[src] || ('#' + (idx + 1));

    var displayScore;
    if (t._score != null) {
      displayScore = Math.min(9.9, parseFloat(t._score.toFixed(1)));
    } else if (t.dijoScore != null && t.dijoScore > 0) {
      displayScore = Math.min(9.9, parseFloat((t.dijoScore / 10).toFixed(1)));
    } else if (t.trend_score != null && t.trend_score > 0) {
      displayScore = Math.min(9.9, parseFloat((t.trend_score / 10).toFixed(1)));
    } else {
      displayScore = 5.0;
    }
    var pct = Math.round((displayScore / 10) * 100);

    return '<div class="opp-card" onclick="loadTopic('' + escJ(t.topic) + '')" title="Click to generate content">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">'
      +   '<span style="font-family:'DM Mono',monospace;font-size:9px;font-weight:700;color:' + rankColor + ';letter-spacing:.08em;text-transform:uppercase">' + escH(rankLabel) + '</span>'
      +   '<span style="font-family:'DM Mono',monospace;font-size:16px;font-weight:900;color:' + rankColor + '">' + displayScore.toFixed(1) + '</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
      +   '<span style="font-size:13px">' + pm.icon + '</span>'
      +   '<span style="font-family:'DM Mono',monospace;font-size:9px;font-weight:700;color:' + pm.color + ';letter-spacing:.06em">' + src.toUpperCase() + '</span>'
      + '</div>'
      + '<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:5px;line-height:1.3">' + escH(t.topic) + '</div>'
      + '<div style="height:3px;background:var(--bg2);border-radius:99px;margin-bottom:5px;overflow:hidden">'
      +   '<div style="height:100%;width:' + pct + '%;background:' + rankColor + ';border-radius:99px;transition:width .5s ease"></div>'
      + '</div>'
      + '<div style="font-size:10px;color:var(--text3);font-style:italic">' + escH(pm.hint) + '</div>'
      + '</div>';
  }).join('');
}
async function loadOpportunities() {
  try {
    var res = await fetch(DIJO + '/trends/dijo');
    var data = await res.json();
    // If /trends/dijo returns empty array (no velocity_score data in Supabase yet),
    // fall back to local rather than showing "No opportunities"
    if (data && data.length) {
      renderOpportunities(data);
    } else {
      console.warn('[Opportunities] /trends/dijo returned empty — using local fallback');
      renderDashOpps();
    }
  } catch(e) {
    console.warn('[Opportunities] /trends/dijo failed:', e.message);
    renderDashOpps();
  }
}

// Fast in-memory re-render — called by 60s refresh and as fallback.
// renderOpportunities now handles 1-per-platform enforcement via getBest3,
// so we just pass an empty array and let it read _allTrends directly.
function renderDashOpps() {
  if (!_allTrends.length) return;
  renderOpportunities([]);   // renderOpportunities uses _allTrends via getBest3 when array is empty
}
/* ─────────────────────────────────────────────
   WHAT TO POST THIS WEEK 📅
   Uses buildTrendInsights() classifications first.
   If any section is empty (common when data has
   low confidence), fills from best-per-platform
   so cards never show "No trends" when we have data.
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   RADAR GAUGES — three animated fuel-gauge style
   dials, one per platform (TikTok, YouTube, Google).
   Each shows the #1 trending topic + live score.
   The needle animates like a fuel gauge rising and
   falling as scores change on each 60s refresh.
───────────────────────────────────────────── */
function renderRadarGauges() {
  var el = document.getElementById('radarGaugesBox');
  if (!el) return;

  // Inject styles once
  if (!document.getElementById('_radarGaugeStyles')) {
    var s = document.createElement('style');
    s.id = '_radarGaugeStyles';
    s.textContent = `
      .rg-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
      @media(max-width:640px){ .rg-grid { grid-template-columns:1fr; } }
      .rg-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:18px 16px 14px; display:flex; flex-direction:column; align-items:center; gap:10px; position:relative; overflow:hidden; }
      .rg-stripe { position:absolute; top:0; left:0; right:0; height:3px; border-radius:3px 3px 0 0; }
      .rg-label { font-size:11px; font-weight:700; color:var(--text2); letter-spacing:.06em; text-transform:uppercase; font-family:'DM Mono',monospace; }
      .rg-svg-wrap { width:140px; height:80px; position:relative; }
      .rg-score-overlay { position:absolute; bottom:0; left:50%; transform:translateX(-50%); text-align:center; line-height:1; }
      .rg-score-num { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; }
      .rg-score-unit { font-family:'DM Mono',monospace; font-size:9px; color:var(--text3); }
      .rg-topic { font-size:13px; font-weight:700; text-align:center; line-height:1.3; cursor:pointer; max-width:160px; }
      .rg-topic:hover { text-decoration:underline; }
      .rg-status { font-size:10px; font-weight:700; padding:2px 9px; border-radius:99px; border:1px solid; font-family:'DM Mono',monospace; }
      .rg-meta { font-size:10px; color:var(--text3); text-align:center; }
      .rg-dot { width:6px; height:6px; border-radius:50%; display:inline-block; animation:meterPulse 1.8s ease-in-out infinite; margin-right:4px; }
      .rg-empty { font-size:12px; color:var(--text3); text-align:center; padding:16px 0; }
    `;
    document.head.appendChild(s);
  }

  function platBest(plat) {
    var arr = _allTrends.filter(function(t){ return t.plat === plat; });
    if (!arr.length) return null;
    return arr.slice().sort(function(a,b){ return b.score - a.score; })[0];
  }

  var cfgs = [
    { plat:'tt', icon:'🎵', label:'TikTok',  color:'#ff6464', trend: platBest('tt') },
    { plat:'yt', icon:'▶️',  label:'YouTube', color:'#FFD700', trend: platBest('yt') },
    { plat:'gt', icon:'🔍', label:'Google',  color:'#78b4ff', trend: platBest('gt') }
  ];

  function gaugeArc(pct, color) {
    // Half-circle gauge: sweep from 180deg to 0deg
    // r=54, cx=70, cy=70 (bottom half only shown via viewBox clip)
    var r = 54, cx = 70, cy = 68;
    var startAngle = Math.PI;           // left = 0
    var endAngle   = 0;                 // right = 100%
    var sweepAngle = startAngle - (startAngle - endAngle) * Math.min(pct / 100, 1);
    // Background arc
    var bgX1 = cx + r * Math.cos(Math.PI);
    var bgY1 = cy + r * Math.sin(Math.PI);
    var bgX2 = cx + r * Math.cos(0);
    var bgY2 = cy + r * Math.sin(0);
    // Active arc
    var aX2 = cx + r * Math.cos(Math.PI - (Math.PI * pct / 100));
    var aY2 = cy + r * Math.sin(Math.PI - (Math.PI * pct / 100));
    var largeArc = pct > 50 ? 1 : 0;
    // Needle
    var needleAngle = Math.PI - (Math.PI * pct / 100);
    var nx = cx + (r - 10) * Math.cos(needleAngle);
    var ny = cy + (r - 10) * Math.sin(needleAngle);

    return '<svg viewBox="0 0 140 75" xmlns="http://www.w3.org/2000/svg" style="width:140px;height:75px;">'
      // track
      + '<path d="M16 68 A54 54 0 0 1 124 68" fill="none" stroke="var(--bg2)" stroke-width="10" stroke-linecap="round"/>'
      // active fill
      + (pct > 0
        ? '<path d="M16 68 A54 54 0 ' + largeArc + ' 1 ' + aX2.toFixed(1) + ' ' + aY2.toFixed(1) + '" fill="none" stroke="' + color + '" stroke-width="10" stroke-linecap="round" style="transition:stroke-dasharray 1s ease"/>'
        : '')
      // tick marks
      + [0,25,50,75,100].map(function(v){
          var a = Math.PI - (Math.PI * v / 100);
          var ox = cx + 46 * Math.cos(a); var oy = cy + 46 * Math.sin(a);
          var ix = cx + 40 * Math.cos(a); var iy = cy + 40 * Math.sin(a);
          return '<line x1="'+ox.toFixed(1)+'" y1="'+oy.toFixed(1)+'" x2="'+ix.toFixed(1)+'" y2="'+iy.toFixed(1)+'" stroke="var(--border2)" stroke-width="1.5" stroke-linecap="round"/>';
        }).join('')
      // needle
      + '<line x1="'+cx+'" y1="'+cy+'" x2="'+nx.toFixed(1)+'" y2="'+ny.toFixed(1)+'" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round" style="transition:all 1s ease"/>'
      + '<circle cx="'+cx+'" cy="'+cy+'" r="4" fill="'+color+'"/>'
      // min/max labels
      + '<text x="14" y="76" font-size="8" fill="var(--text3)" font-family="DM Mono,monospace">0</text>'
      + '<text x="118" y="76" font-size="8" fill="var(--text3)" font-family="DM Mono,monospace">10</text>'
      + '</svg>';
  }

  function card(cfg) {
    if (!cfg.trend) {
      return '<div class="rg-card">'
        + '<div class="rg-stripe" style="background:' + cfg.color + '30"></div>'
        + '<div class="rg-label">' + cfg.icon + ' ' + cfg.label + '</div>'
        + '<div class="rg-empty">No data yet · refreshes every 30 min</div>'
        + '</div>';
    }
    var t   = cfg.trend;
    var pct = Math.round((t.score / 10) * 100);
    var cls = classifyTrend(t);
    var clsLbl   = cls === 'blowup' ? '🔥 Peak'     : cls === 'rising_fast' ? '⚡ Rising' : cls === 'early' ? '🟢 Early' : '📊 Stable';
    var clsColor = cls === 'blowup' ? 'var(--green)' : cls === 'rising_fast' ? 'var(--gold)' : cls === 'early' ? '#4FB3A5' : 'var(--text3)';
    var meta = t.videoCount > 0
      ? t.videoCount + ' videos · ' + fmtN(t.totalViews) + ' views'
      : (t.confidence ? t.confidence + '% confidence' : 'live data');

    return '<div class="rg-card">'
      + '<div class="rg-stripe" style="background:' + cfg.color + '"></div>'
      + '<div class="rg-label"><span class="rg-dot" style="background:' + cfg.color + '"></span>' + cfg.icon + ' ' + cfg.label + '</div>'
      + '<div class="rg-svg-wrap">'
      +   gaugeArc(pct, cfg.color)
      +   '<div class="rg-score-overlay">'
      +     '<div class="rg-score-num" style="color:' + cfg.color + '">' + t.score.toFixed(1) + '</div>'
      +     '<div class="rg-score-unit">/10</div>'
      +   '</div>'
      + '</div>'
      + '<div class="rg-topic" onclick="loadTopic(\'' + escJ(t.topic) + '\')" style="color:var(--text)">' + escH(t.topic) + '</div>'
      + '<div class="rg-status" style="color:' + clsColor + ';border-color:' + clsColor + '40">' + clsLbl + '</div>'
      + '<div class="rg-meta">' + escH(meta) + '</div>'
      + '</div>';
  }

  el.innerHTML = '<div class="rg-grid">' + cfgs.map(card).join('') + '</div>';
}

/* ─────────────────────────────────────────────
   DIJO TOP PICK — replaces "What to post" section.
   Picks the single best topic across ALL platforms
   using dijoScore, then asks Dijo AI why it's the
   best opportunity right now in one short sentence.
───────────────────────────────────────────── */
async function renderDijoTopPick() {
  var el = document.getElementById('dijoTopPickBox');
  if (!el) return;

  if (!_allTrends.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px">Loading trend data…</div>';
    return;
  }

  // Pick best trend by score
  var best = _allTrends.slice().sort(function(a,b){ return b.score - a.score; })[0];
  var platIcon  = best.plat === 'tt' ? '🎵' : best.plat === 'yt' ? '▶️' : best.plat === 'cross' ? '🚀' : '🔍';
  var platColor = best.plat === 'tt' ? '#ff6464' : best.plat === 'yt' ? '#FFD700' : best.plat === 'cross' ? '#4FB3A5' : '#78b4ff';
  var cls       = classifyTrend(best);
  var clsLbl    = cls === 'blowup' ? '🔥 Peak now — post immediately' : cls === 'rising_fast' ? '⚡ Rising fast — get ahead of it' : cls === 'early' ? '🟢 Early stage — first mover advantage' : '📊 Stable trend';

  // Show skeleton immediately
  var _topicSafe = escJ(best.topic);
  el.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:10px">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
    +   '<div style="font-family:Syne,sans-serif;font-size:20px;font-weight:900;line-height:1.2;color:var(--text)">' + escH(best.topic) + '</div>'
    +   '<div style="font-family:DM Mono,monospace;font-size:24px;font-weight:900;color:' + platColor + ';flex-shrink:0">' + best.score.toFixed(1) + '</div>'
    + '</div>'
    + '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">'
    +   '<span style="font-size:11px;background:var(--gold-dim);border:1px solid var(--gold-glo);color:var(--gold);border-radius:6px;padding:3px 10px;font-family:DM Mono,monospace">' + platIcon + ' ' + escH(best.platLabel) + '</span>'
    +   '<span style="font-size:11px;font-weight:700;color:' + platColor + '">' + clsLbl + '</span>'
    + '</div>'
    + '<div id="dijoPickReason" style="font-size:13px;color:var(--text2);line-height:1.6;border-left:2px solid var(--gold);padding-left:10px;min-height:20px">'
    +   '<span class="spinner spinner-gold" style="width:12px;height:12px;border-width:2px;margin-right:6px;vertical-align:middle"></span>'
    +   '<span style="color:var(--text3);font-size:12px">Dijo is analysing why this is the best opportunity…</span>'
    + '</div>'
    + '<div style="display:flex;gap:8px;margin-top:4px">'
    +   '<button onclick="loadTopic(\'' + _topicSafe + '\')" style="padding:9px 18px;border-radius:9px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:Syne,sans-serif">⚡ Generate content for this</button>'
    +   '<div style="font-size:10px;color:var(--text3);font-family:DM Mono,monospace;align-self:center">Dijo top pick · updated every 30 min</div>'
    + '</div>'
    + '</div>';

  // Now fetch the AI reason asynchronously
  try {
    var prompt = 'In ONE sentence (max 25 words), explain why "' + best.topic
      + '" is the best content opportunity right now on ' + best.platLabel
      + ' with a score of ' + best.score.toFixed(1) + '/10. Be specific and direct.';
    var res = await fetch(DIJO + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, mode: 'creator' })
    });
    var data = await res.json();
    var reasonEl = document.getElementById('dijoPickReason');
    if (reasonEl && data.reply) {
      var reason = data.reply.trim().split(/[.!?]/)[0];
      reasonEl.textContent = reason + '.';
    }
  } catch(e) {
    var reasonEl = document.getElementById('dijoPickReason');
    if (reasonEl) reasonEl.textContent = 'Highest scored trend across all platforms right now — strong opportunity for ' + best.platLabel + ' content.';
  }
}

function loadTopic(topic) {
  // ✅ Gate at the point of action — not mid-generation
  if (!checkAccess()) return;

  var i1 = document.getElementById('quickTopic'); if (i1) i1.value = topic;
  var i2 = document.getElementById('genTopic'); if (i2) i2.value = topic;
  switchTab('generator', null);

  // FIX 4: AUTO GENERATE with trend-aware context 🧠
  setTimeout(function() {
    var trend = _allTrends.find(function(t) { return t.topic === topic; });
    if (trend) {
      // Inject trend context into the generator niche field so AI knows the data
      var nicheEl = document.getElementById('genNiche');
      if (nicheEl && !nicheEl.value) {
        nicheEl.value = 'Platform: ' + trend.platLabel + ' · Score: ' + trend.score + ' · ' + (trend.videoCount || 0) + ' videos · ' + fmtN(trend.totalViews) + ' views';
      }
    }
    fullGenerate();
  }, 300);
  toast('💡 Generating for: ' + topic);
}

/* Dynamic AI hint above generator input */
function updateHint(score) {
  var el = document.getElementById('aiHint');
  if (!el) return;
  if (score >= 9) el.textContent = '🔥 High viral potential topic';
  else if (score >= 8) el.textContent = '⚡ Strong trending opportunity';
  else el.textContent = '💡 Emerging topic — needs strong hook';
}

/* ─────────────────────────────────────────────
   PLATFORM STATUS — FIX 5
   Reads /ingestion/status and lights up sidebar dots
   TikTok = velocity engine ⚡  YouTube = validation 🎯
───────────────────────────────────────────── */
async function loadPlatformStatus() {
  try {
    var res = await fetch(DIJO + '/ingestion/status');
    if (!res.ok) return;
    var data = await res.json();

    if (data.youtube && data.youtube.status === 'completed') {
      var ytDot = document.getElementById('ytSpDot');
      var ytLbl = document.getElementById('ytSpLabel');
      if (ytDot) ytDot.className = 'sp-dot live';
      if (ytLbl) ytLbl.textContent = 'Live';
    }

    if (data.tiktok && data.tiktok.status === 'completed') {
      var ttDot = document.getElementById('ttSpDot');
      var ttLbl = document.getElementById('ttSpLabel');
      if (ttDot) ttDot.className = 'sp-dot live';
      if (ttLbl) ttLbl.textContent = 'Live';
    }
  } catch(e) {
    console.warn('[PlatformStatus] unavailable:', e);
  }
}

/* ─────────────────────────────────────────────
   DAILY BRIEFING
───────────────────────────────────────────── */
async function loadBriefing(forceRefresh) {
  var el = document.getElementById('briefingText');
  var tagsEl = document.getElementById('briefingTags');
  var dateEl = document.getElementById('briefingDate');
  if (!el) return;

  // ── Build compact pulse strip from local trend data ──────────────────────
  function renderPulseStrip() {
    if (!_allTrends.length) return false;
    var best = getBest3(_allTrends);
    var rows = [
      { icon: '▶️', label: 'YouTube', trend: best.youtube, color: '#FFD700' },
      { icon: '⚡', label: 'TikTok',  trend: best.tiktok,  color: '#ff6464' },
      { icon: '🔍', label: 'Google',  trend: best.google,  color: '#78b4ff' }
    ].filter(function(r) { return r.trend; });
    if (!rows.length) return false;

    el.innerHTML = rows.map(function(r) {
      var t = r.trend;
      var cls = classifyTrend(t);
      var badge = cls === 'blowup'      ? '🔥 Blowing up'
                : cls === 'rising_fast' ? '⚡ Rising fast'
                : cls === 'early'       ? '🟢 Early signal'
                : '📊 Stable';
      return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border2)">'
        + '<span style="font-size:14px">' + r.icon + '</span>'
        + '<span style="font-family:\'DM Mono\',monospace;font-size:9px;font-weight:700;color:' + r.color + ';min-width:46px;letter-spacing:.06em">' + r.label + '</span>'
        + '<span style="font-size:12px;color:var(--text1);font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escH(t.topic) + '</span>'
        + '<span style="font-size:9px;color:var(--text3);white-space:nowrap">' + badge + '</span>'
        + '<span style="font-family:\'DM Mono\',monospace;font-size:11px;font-weight:800;color:' + r.color + ';min-width:24px;text-align:right">' + t.score.toFixed(1) + '</span>'
        + '</div>';
    }).join('') + '<div style="border-bottom:none"></div>';

    if (tagsEl) tagsEl.innerHTML = ''; // hide old tags
    if (dateEl) {
      var now = new Date();
      dateEl.textContent = '📡 ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · live';
    }
    return true;
  }

  // Try local data first (instant), then fall back to API
  if (renderPulseStrip()) {
    if (forceRefresh) toast('🧠 Trends refreshed!');
    return;
  }

  // Still loading — wait for trends then retry
  el.innerHTML = '<span class="spinner spinner-gold"></span>';
  try {
    var res = await fetch(DIJO + '/ai/daily-briefing');
    var data = await res.json();
    // Even if API has data, prefer the compact pulse strip if trends are now loaded
    if (_allTrends.length && renderPulseStrip()) {
      if (forceRefresh) toast('🧠 Trends refreshed!');
      return;
    }
    // Fallback: show just the first sentence of the AI briefing (compact)
    if (data.briefing) {
      var first = data.briefing.split(/[.!?]/)[0].trim();
      el.textContent = first + '.';
      if (dateEl) {
        var now2 = new Date();
        dateEl.textContent = '📡 ' + now2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · live';
      }
      if (tagsEl) tagsEl.innerHTML = '';
      if (forceRefresh) toast('🧠 Briefing refreshed!');
    }
  } catch(e) {
    if (el) el.textContent = 'Trends unavailable — check back shortly.';
  }
}

/* ─────────────────────────────────────────────
   QUICK GENERATE (dashboard widget)
───────────────────────────────────────────── */
async function quickGenerate() {
  if (!checkAccess()) return;
  var topicEl = document.getElementById('quickTopic');
  if (!topicEl) return;
  var topic = topicEl.value.trim();
  if (!topic) { toast('⚠️ Enter a topic first'); return; }
  var outEl = document.getElementById('quickOutput');
  outEl.style.display = 'flex';
  document.getElementById('quickHook').textContent = 'Generating…';
  document.getElementById('quickCaption').textContent = '';
  document.getElementById('quickTags').innerHTML = '';
  try {
    var trendCtxQ = buildTrendContext();
    var reply = await callDijo(
      (trendCtxQ ? trendCtxQ + '\n\n' : '')
      + 'Write a hook, caption, and 6 hashtags for: "' + topic + '". Use the live trend data above to make it timely and relevant.\nFormat:\nHOOK: ...\nCAPTION: ...\nHASHTAGS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6',
      'creator'
    );
    var lines = reply.split('\n');
    var hook = '', caption = '', tags = [];
    lines.forEach(function(l) {
      if (l.toLowerCase().startsWith('hook:')) hook = l.replace(/^hook:\s*/i, '').trim();
      else if (l.toLowerCase().startsWith('caption:')) caption = l.replace(/^caption:\s*/i, '').trim();
      else if (l.toLowerCase().startsWith('hashtags:')) { tags = (l.replace(/^hashtags:\s*/i, '').match(/#[a-zA-Z0-9]+/g) || []); }
    });
    if (!tags.length) tags = (reply.match(/#[a-zA-Z][a-zA-Z0-9]*/g) || []).slice(0, 6);
    document.getElementById('quickHook').textContent = hook || lines[0] || reply.slice(0, 120);
    document.getElementById('quickCaption').textContent = caption || reply.slice(0, 200);
    var te = document.getElementById('quickTags'); te.innerHTML = '';
    tags.forEach(function(t) { var s = document.createElement('span'); s.className = 'ob-tag'; s.textContent = t; te.appendChild(s); });
    toast('✅ Generated!');
  } catch(e) {
    document.getElementById('quickHook').textContent = 'Dijo unavailable — try again.';
  }
}

/* ─────────────────────────────────────────────
   FULL GENERATE
───────────────────────────────────────────── */
function selectStyle(el) {
  document.querySelectorAll('.style-chip').forEach(function(c) { c.classList.remove('active'); });
  el.classList.add('active');
  _selectedStyle = el.textContent.trim();
}

function calcScore(topic) {
  var tl = topic.toLowerCase(); var s = 6.8;
  if (tl.match(/ai|chatgpt|automation|tech|llm/)) s += 1.3;
  if (tl.match(/money|finance|invest|income|business/)) s += 1.0;
  if (tl.match(/viral|trending|2026|growth/)) s += 0.6;
  if (tl.length < 20) s += 0.3;
  return Math.min(9.9, parseFloat(s.toFixed(1)));
}

async function generateIdea() {
  if (!checkAccess()) return;
  await fullGenerate();
}

async function fullGenerate() {
  if (!checkAccess()) return;
  if (!(await checkCarouselAccess())) return;
  var topic = document.getElementById('genTopic').value.trim();
  if (!topic) { toast('⚠️ Enter a topic first'); return; }
  var platform = document.getElementById('genPlatform').value;
  var niche = document.getElementById('genNiche').value.trim();
  var btn = document.getElementById('fullGenBtn');
  var loadEl = document.getElementById('genLoading');
  var errEl = document.getElementById('genError');

  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating…';
  loadEl.classList.add('visible');
  errEl.classList.remove('visible');
  document.getElementById('genLoadingMsg').textContent = 'Dijo is building your content package for "' + topic + '"…';

  var score = calcScore(topic);
  updateHint(score);
  var scColor = score >= 9 ? 'var(--green)' : score >= 8 ? 'var(--gold)' : score >= 7 ? 'var(--blue2)' : 'var(--text2)';
  var verdict = score >= 9 ? '🔥 Exceptional' : score >= 8 ? '⚡ Strong opportunity' : score >= 7 ? '📈 Good momentum' : '💡 Emerging';
  document.getElementById('previewScore').textContent = score.toFixed(1);
  document.getElementById('previewScore').style.color = scColor;
  document.getElementById('previewVerdict').textContent = verdict;
  document.getElementById('previewVerdict').style.color = scColor;

  ['outHook', 'outCaption', 'outOutline'].forEach(function(id) {
    var el = document.getElementById(id);
    el.classList.remove('ob-placeholder'); el.textContent = 'Generating…';
  });
  document.getElementById('outHashtags').innerHTML = '<span style="color:var(--text3);font-style:italic;font-size:12px">Generating…</span>';

  try {
    var nicheCtx = niche ? '\nNiche: ' + niche + '.' : '';

    // Inject real trend data if available for this topic
    var trend = _allTrends.find(function(t) { return t.topic.toLowerCase() === topic.toLowerCase(); });
    var trendExtra = '';
    if (trend) {
      trendExtra = '\n\nReal trend data:'
        + '\n- Platform: ' + trend.platLabel
        + '\n- Views: ' + fmtN(trend.totalViews)
        + '\n- Video count: ' + trend.videoCount
        + '\n- Trend score: ' + trend.score + '/10'
        + (trend.hashtags.length ? '\n- Suggested hashtags: ' + trend.hashtags.join(', ') : '');
    }

    var prompt =
      'You are a top 1% viral content strategist.\n\n'
      + 'Topic: "' + topic + '"\n'
      + 'Platform: ' + platform + '\n'
      + 'Style: ' + _selectedStyle + '\n'
      + 'Trend Score: ' + score + '/10'
      + nicheCtx
      + trendExtra + '\n\n'
      + 'Write HIGH-PERFORMING content.\n\n'
      + 'Rules:\n'
      + '- Hook must create curiosity or controversy\n'
      + '- Caption must be short, punchy, scroll-stopping\n'
      + '- No fluff\n'
      + '- Make it feel like viral content, not advice\n\n'
      + 'Format EXACTLY:\n\n'
      + 'HOOK: ...\n'
      + 'CAPTION: ...\n'
      + 'OUTLINE:\n1. ...\n2. ...\n3. ...\n4. ...\n5. ...\n'
      + 'HASHTAGS: #... #... #...\n'
      + 'BEST TIME: [best day and time for ' + platform + ']';
    var reply = await callDijo(prompt, 'creator');
    var lines = reply.split('\n');

    function extract(label) {
      var idx = lines.findIndex(function(l) { return l.toLowerCase().startsWith(label.toLowerCase()); });
      if (idx === -1) return '';
      return lines[idx].replace(new RegExp('^' + label + '\\s*', 'i'), '').trim();
    }
    function extractBlock(label, nextLabel) {
      var start = lines.findIndex(function(l) { return l.toLowerCase().startsWith(label.toLowerCase()); });
      if (start === -1) return '';
      var out = [];
      for (var i = start + 1; i < lines.length; i++) {
        if (nextLabel && lines[i].toLowerCase().startsWith(nextLabel.toLowerCase())) break;
        if (lines[i].match(/^[A-Z ]+:/)) break;
        out.push(lines[i]);
      }
      return out.join('\n').trim();
    }

    var hook = extract('HOOK:');
    var caption = extract('CAPTION:');
    var outline = extractBlock('OUTLINE:', 'HASHTAGS:');
    var hashLine = extract('HASHTAGS:');
    var bestTime = extract('BEST TIME:');
    var tags = (hashLine.match(/#[a-zA-Z][a-zA-Z0-9]*/g) || []).concat(reply.match(/#[a-zA-Z][a-zA-Z0-9]*/g) || []);
    var uniqueTags = []; var seen = {};
    tags.forEach(function(t) { if (!seen[t]) { seen[t] = 1; uniqueTags.push(t); } });

    document.getElementById('outHook').textContent = hook || lines[0] || '';
    document.getElementById('outCaption').innerHTML = escH(caption || '').replace(/\n/g, '<br>');
    document.getElementById('outOutline').innerHTML = escH(outline || '').replace(/\n/g, '<br>');
    var he = document.getElementById('outHashtags'); he.innerHTML = '';
    uniqueTags.slice(0, 10).forEach(function(t) { var s = document.createElement('span'); s.className = 'ob-tag'; s.textContent = t; he.appendChild(s); });

    // Populate clickable hashtag bar
    var bar = document.getElementById('hashtagBar');
    if (bar) {
      bar.innerHTML = '';
      uniqueTags.slice(0, 10).forEach(function(tag) {
        var el = document.createElement('div');
        el.className = 'hashtag-chip';
        el.textContent = tag;
        el.onclick = function() { navigator.clipboard.writeText(tag).then(function() { toast('📋 ' + tag + ' copied!'); }); };
        bar.appendChild(el);
      });
    }
    var tg = document.getElementById('outTiming'); tg.innerHTML = '';
    ['Today', 'Thursday', 'Saturday'].forEach(function(d) {
      var slot = document.createElement('div'); slot.className = 'timing-slot';
      slot.innerHTML = '<div class="timing-day">' + d + '</div><div class="timing-time">' + (d === 'Today' && bestTime ? bestTime : '7–9pm') + '</div>';
      tg.appendChild(slot);
    });

    var dsc = document.getElementById('dashLastScore'); if (dsc) { dsc.textContent = score.toFixed(1); dsc.style.color = scColor; }
    var dsl = document.getElementById('dashLastLabel'); if (dsl) { dsl.textContent = verdict; dsl.style.color = scColor; }
    if (!isAdmin()) {
      incrementUses();
    }
    toast('✅ Package generated!');
  } catch(e) {
    errEl.classList.add('visible');
    errEl.textContent = '⚠ ' + (e.message || 'Request failed');
    toast('⚠️ Dijo unavailable — try again');
  }

  loadEl.classList.remove('visible');
  btn.disabled = false; btn.innerHTML = '⚡ Generate Full Package';
}

/* ─────────────────────────────────────────────
   AUDIENCE
───────────────────────────────────────────── */
async function loadAudience() {
  var topic = document.getElementById('audTopic').value.trim();
  if (!topic) { toast('⚠️ Enter a topic'); return; }
  var btn = document.getElementById('audBtn');
  btn.disabled = true; btn.textContent = 'Analysing…';
  document.getElementById('audOutput').innerHTML = '<div style="text-align:center;padding:28px;color:var(--text3)"><span class="spinner spinner-gold"></span> Analysing…</div>';
  try {
    var prompt = 'Audience breakdown for topic: "' + topic + '"\n\nProvide:\n1. Age groups with % (e.g. 18-24: 35%)\n2. Gender split\n3. Top 5 interests\n4. Platform affinity: YouTube %, TikTok %, Instagram %, Google %\n5. Best hook angle\n\nBe specific and data-informed.';
    var reply = await callDijo(prompt, 'creator');
    var ages = extractAges(reply) || [{ label: '18–24', pct: 30 }, { label: '25–34', pct: 40 }, { label: '35–44', pct: 20 }, { label: '45+', pct: 10 }];
    var pa = extractPA(reply) || { YouTube: 72, TikTok: 65, Instagram: 58, Google: 78 };
    var html = '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:14px">'
      + '<h3 style="font-size:15px;font-weight:800;margin-bottom:8px">👥 ' + escH(topic) + ' — Audience</h3>'
      + '<div style="font-size:13px;color:var(--text2);line-height:1.75">' + escH(reply.slice(0, 500)) + '</div></div>';
    html += '<div class="aud-grid"><div class="aud-card"><div class="aud-head">Age Breakdown</div><div class="aud-body">';
    ages.forEach(function(ag) {
      html += '<div class="demo-bar"><span class="demo-label">' + ag.label + '</span>'
        + '<div class="demo-track"><div class="demo-fill" style="width:' + ag.pct + '%"></div></div>'
        + '<span class="demo-pct">' + ag.pct + '%</span></div>';
    });
    html += '</div></div><div class="aud-card"><div class="aud-head">Platform Affinity</div><div class="aud-body">';
    [{ k: 'YouTube', cls: 'pa-yt' }, { k: 'TikTok', cls: 'pa-tt' }, { k: 'Instagram', cls: 'pa-ig' }, { k: 'Google', cls: 'pa-gt' }].forEach(function(p) {
      html += '<div class="pa-item"><span class="pa-label">' + p.k + '</span>'
        + '<div class="pa-track"><div class="pa-fill ' + p.cls + '" style="width:' + (pa[p.k] || 0) + '%"></div></div>'
        + '<span class="pa-pct">' + (pa[p.k] || 0) + '%</span></div>';
    });
    html += '</div></div></div>';
    document.getElementById('audOutput').innerHTML = html;
    toast('✅ Analysis done!');
  } catch(e) {
    document.getElementById('audOutput').innerHTML = '<div style="padding:20px;color:var(--text3)">Dijo unavailable — try again.</div>';
    toast('⚠️ Error — try again');
  }
  btn.disabled = false; btn.textContent = 'Analyse';
}

function extractAges(text) {
  var groups = [];
  var m = text.match(/(\d{2}[-–]\d{2,3}\+?)[^\d]{0,8}(\d{1,3})\s*%/g);
  if (m && m.length >= 3) {
    m.forEach(function(x) {
      var p = x.match(/(\d{2}[-–]\d{2,3}\+?).*?(\d{1,3})/);
      if (p) groups.push({ label: p[1], pct: Math.min(99, parseInt(p[2] || 50)) });
    });
    return groups.length >= 3 ? groups : null;
  }
  return null;
}
function extractPA(text) {
  var tl = text.toLowerCase();
  function p(n) { var m = new RegExp(n + '[^0-9]*(\\d{1,3})\\s*%', 'i').exec(tl); return m ? Math.min(100, parseInt(m[1])) : null; }
  var yt = p('youtube'), tt = p('tiktok'), ig = p('instagram'), gt = p('google');
  return (yt || tt || ig || gt) ? { YouTube: yt || 70, TikTok: tt || 65, Instagram: ig || 55, Google: gt || 75 } : null;
}

/* ─────────────────────────────────────────────
   YOUTUBE
───────────────────────────────────────────── */
function initYouTube() {
  try {
    if (typeof YouTubeAuth === 'undefined') return;
    var s = YouTubeAuth.getSession();
    if (s) showYtConnected(s);
    var params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === '1') {
      var s2 = YouTubeAuth.getSession();
      if (s2) showYtConnected(s2);
      history.replaceState({}, '', 'creator-studio.html');
    }
  } catch(e) {}
}

function showYtConnected(session) {
  document.getElementById('ytDisconnected').style.display = 'none';
  document.getElementById('ytConnected').style.display = 'block';
  var dot = document.getElementById('ytSpDot'); if (dot) dot.className = 'sp-dot live';
  var label = document.getElementById('ytSpLabel'); if (label) label.innerHTML = '<span style="color:var(--green)">Connected</span>';
  var badge = document.getElementById('ytSidebarBadge'); if (badge) badge.style.display = 'inline-flex';
  var ch = session.channel;
  var name = (ch && ch.snippet && ch.snippet.title) ? ch.snippet.title : 'YouTube';
  var handle = (ch && ch.snippet && ch.snippet.customUrl) ? ch.snippet.customUrl : '';
  document.getElementById('ytChannelName').textContent = name;
  document.getElementById('ytChannelHandle').textContent = handle;
  var dv = document.getElementById('dashYtVal'); if (dv) { dv.textContent = name; dv.style.color = 'var(--green)'; }
  if (ch && ch.snippet && ch.snippet.thumbnails && ch.snippet.thumbnails.default) {
    var av = document.getElementById('ytAv');
    av.innerHTML = '<img src="' + ch.snippet.thumbnails.default.url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
  }
  if (ch && ch.statistics) {
    document.getElementById('ytSubs').textContent = fmtN(ch.statistics.subscriberCount);
    document.getElementById('ytViews').textContent = fmtN(ch.statistics.viewCount);
    document.getElementById('ytVcount').textContent = fmtN(ch.statistics.videoCount);
    document.getElementById('evalSubs').textContent = fmtN(ch.statistics.subscriberCount);
    document.getElementById('evalViews').textContent = fmtN(ch.statistics.viewCount);
    document.getElementById('evalVcount').textContent = fmtN(ch.statistics.videoCount);
  }
  loadYtVideos(session.accessToken);
}

async function loadYtVideos(token) {
  var el = document.getElementById('ytVideosList'); if (!el) return;
  try {
    var res = await YouTubeAuth.fetchVideos(token, 8);
    var videos = (res && res.items) ? res.items : [];
    if (!videos.length) { el.innerHTML = '<div style="padding:20px;color:var(--text3)">No videos found.</div>'; return; }
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">'
      + videos.map(function(v) {
        var sn = v.snippet || {}; var st = v.statistics || {};
        var thumb = sn.thumbnails && sn.thumbnails.medium ? sn.thumbnails.medium.url : '';
        return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">'
          + (thumb ? '<img src="' + thumb + '" style="width:100%;height:110px;object-fit:cover" alt=""/>' : '<div style="width:100%;height:110px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:28px">▶️</div>')
          + '<div style="padding:10px"><div style="font-size:12px;font-weight:600;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escH(sn.title || 'Untitled') + '</div>'
          + '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text3)">👁 ' + fmtN(st.viewCount) + ' · ❤️ ' + fmtN(st.likeCount) + ' · 💬 ' + fmtN(st.commentCount) + '</div></div></div>';
      }).join('') + '</div>';
  } catch(e) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3)">Could not load videos.</div>';
  }
}

function disconnectYouTube() {
  try { YouTubeAuth.clearSession(); } catch(e) {}
  document.getElementById('ytDisconnected').style.display = 'block';
  document.getElementById('ytConnected').style.display = 'none';
  var dot = document.getElementById('ytSpDot'); if (dot) dot.className = 'sp-dot off';
  var label = document.getElementById('ytSpLabel'); if (label) label.innerHTML = '<span class="connect-link" onclick="switchTab(\'youtube\',null)">Connect</span>';
  var badge = document.getElementById('ytSidebarBadge'); if (badge) badge.style.display = 'none';
  var dv = document.getElementById('dashYtVal'); if (dv) { dv.textContent = 'Not connected'; dv.style.color = ''; }
  _evalChannelData = null; _evalScoreData = null;
  document.getElementById('evalMain').style.display = 'none';
  document.getElementById('evalNoAccount').style.display = 'block';
  toast('👋 YouTube disconnected');
}

/* ─────────────────────────────────────────────
   TIKTOK
───────────────────────────────────────────── */
function initTikTok() {
  try {
    if (typeof TikTokAuth === 'undefined') return;
    var s = TikTokAuth.getSession();
    if (s) showTtConnected(s);
    var params = new URLSearchParams(window.location.search);
    if (params.get('tt_connected') === '1') {
      var s2 = TikTokAuth.getSession();
      if (s2) showTtConnected(s2);
      history.replaceState({}, '', 'creator-studio.html');
    }
  } catch(e) {}
}

function showTtConnected(session) {
  document.getElementById('ttDisconnected').style.display = 'none';
  document.getElementById('ttConnected').style.display = 'block';
  var dot = document.getElementById('ttSpDot'); if (dot) dot.className = 'sp-dot tt';
  var badge = document.getElementById('ttSidebarBadge'); if (badge) badge.style.display = 'inline-flex';
  var pill = document.getElementById('ttTopbarPill'); if (pill) pill.style.display = 'flex';
  var profile = session.profile || {};
  var name = profile.display_name || profile.username || 'TikTok';
  document.getElementById('ttDisplayName').textContent = name;
  var dv = document.getElementById('dashTtVal'); if (dv) { dv.textContent = name; dv.style.color = 'var(--tt)'; }
  var sub = document.getElementById('dashTtSub'); if (sub) sub.innerHTML = '';
  var label = document.getElementById('ttSpLabel'); if (label) label.innerHTML = '<span style="color:var(--tt)">Connected</span>';
  fetchTtProfile(session.accessToken);
  loadTtVideos(session.accessToken);
}

async function fetchTtProfile(token) {
  try {
    var res = await fetch(DIJO + '/tiktok/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: token }) });
    var data = await res.json();
    var user = data && data.data && data.data.user ? data.data.user : null;
    if (!user) return;
    document.getElementById('ttDisplayName').textContent = user.display_name || 'TikTok';
    document.getElementById('ttUsername').textContent = user.bio_description ? user.bio_description.slice(0, 40) : '';
    document.getElementById('ttFollowers').textContent = fmtN(user.follower_count);
    document.getElementById('ttFollowing').textContent = fmtN(user.following_count);
    document.getElementById('ttLikes').textContent = fmtN(user.likes_count);
    document.getElementById('ttVcount').textContent = fmtN(user.video_count);
    var dv = document.getElementById('dashTtVal'); if (dv) { dv.textContent = user.display_name || 'TikTok'; dv.style.color = 'var(--tt)'; }
    if (user.avatar_url) {
      var av = document.getElementById('ttAv');
      av.innerHTML = '<img src="' + user.avatar_url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt=""/>';
    }
    document.getElementById('evalSubs').textContent = fmtN(user.follower_count);
    document.getElementById('evalSubs').style.color = 'var(--tt)';
    document.getElementById('evalViews').textContent = fmtN(user.likes_count);
    document.getElementById('evalVcount').textContent = fmtN(user.video_count);
    _evalChannelData = { _platform: 'tiktok', snippet: { title: user.display_name || 'TikTok' }, statistics: { subscriberCount: user.follower_count || 0, viewCount: user.likes_count || 0, videoCount: user.video_count || 0 } };
    try { localStorage.setItem('tt_profile', JSON.stringify(user)); } catch(e) {}
  } catch(e) { console.warn('[TikTok] Profile fetch failed:', e.message); }
}

async function loadTtVideos(token) {
  var el = document.getElementById('ttVideosList'); if (!el) return;
  try {
    var res = await fetch(DIJO + '/tiktok/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: token, max_count: 12 }) });
    var data = await res.json();
    var videos = (data && data.data && data.data.videos) ? data.data.videos : [];
    if (!videos.length) { el.innerHTML = '<div style="padding:20px;color:var(--text3)">No videos found.</div>'; return; }
    el.innerHTML = '<div class="video-grid">' + videos.map(function(v) {
      return '<div class="video-card"><div class="video-thumb">' + (v.cover_image_url ? '<img src="' + escH(v.cover_image_url) + '" alt=""/>' : '🎵') + '</div>'
        + '<div class="video-info"><div class="video-title">' + escH(v.title || v.video_description || 'Untitled') + '</div>'
        + '<div class="video-stats">👁 ' + fmtN(v.view_count) + ' · ❤️ ' + fmtN(v.like_count) + ' · 💬 ' + fmtN(v.comment_count) + '</div></div></div>';
    }).join('') + '</div>';
  } catch(e) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3)">Could not load videos.</div>';
  }
}

function disconnectTikTok() {
  try { TikTokAuth.clearSession(); } catch(e) {}
  document.getElementById('ttDisconnected').style.display = 'block';
  document.getElementById('ttConnected').style.display = 'none';
  var dot = document.getElementById('ttSpDot'); if (dot) dot.className = 'sp-dot off';
  var badge = document.getElementById('ttSidebarBadge'); if (badge) badge.style.display = 'none';
  var pill = document.getElementById('ttTopbarPill'); if (pill) pill.style.display = 'none';
  var dv = document.getElementById('dashTtVal'); if (dv) { dv.textContent = 'Not connected'; dv.style.color = ''; }
  var sub = document.getElementById('dashTtSub'); if (sub) sub.innerHTML = '<span class="sc-link" onclick="switchTab(\'tiktok\',null)">Connect →</span>';
  var label = document.getElementById('ttSpLabel'); if (label) label.innerHTML = '<span class="connect-link" onclick="switchTab(\'tiktok\',null)">Connect</span>';
  _evalChannelData = null; _evalScoreData = null;
  document.getElementById('evalMain').style.display = 'none';
  document.getElementById('evalNoAccount').style.display = 'block';
  toast('👋 TikTok disconnected — connect a new account');
}

/* ─────────────────────────────────────────────
   EVALUATOR
───────────────────────────────────────────── */
function initEvaluator() {
  try {
    if (typeof YouTubeAuth !== 'undefined') {
      var s = YouTubeAuth.getSession();
      if (s && s.channel) { _evalChannelData = s.channel; showEvalMain(s.channel, 'youtube'); return; }
    }
    if (typeof TikTokAuth !== 'undefined') {
      var s2 = TikTokAuth.getSession();
      if (s2) { showEvalMainTt(s2); return; }
    }
  } catch(e) {}
}

function showEvalMain(channel, platform) {
  document.getElementById('evalNoAccount').style.display = 'none';
  document.getElementById('evalLoading').style.display = 'none';
  document.getElementById('evalMain').style.display = 'block';
  var name = (channel && channel.snippet && channel.snippet.title) || 'Channel';
  var handle = (channel && channel.snippet && channel.snippet.customUrl) || platform;
  document.getElementById('evalChannelName').textContent = name;
  document.getElementById('evalChannelHandle').textContent = handle;
  if (channel && channel.snippet && channel.snippet.thumbnails && channel.snippet.thumbnails.default) {
    document.getElementById('evalAv').innerHTML = '<img src="' + channel.snippet.thumbnails.default.url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
  }
  if (channel && channel.statistics) {
    document.getElementById('evalSubs').textContent = fmtN(channel.statistics.subscriberCount);
    document.getElementById('evalViews').textContent = fmtN(channel.statistics.viewCount);
    document.getElementById('evalVcount').textContent = fmtN(channel.statistics.videoCount);
  }
}

function showEvalMainTt(session) {
  document.getElementById('evalNoAccount').style.display = 'none';
  document.getElementById('evalLoading').style.display = 'none';
  document.getElementById('evalMain').style.display = 'block';
  var profile = session.profile || {};
  var name = profile.display_name || profile.username || 'TikTok';
  document.getElementById('evalChannelName').textContent = name;
  document.getElementById('evalChannelHandle').textContent = 'TikTok';
  if (profile.avatar_url) document.getElementById('evalAv').innerHTML = '<img src="' + profile.avatar_url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>';
  document.getElementById('evalSubs').textContent = fmtN(profile.follower_count);
  document.getElementById('evalSubs').style.color = 'var(--tt)';
  document.getElementById('evalViews').textContent = fmtN(profile.likes_count);
  document.getElementById('evalVcount').textContent = fmtN(profile.video_count);
  _evalChannelData = { _platform: 'tiktok', snippet: { title: name }, statistics: { subscriberCount: profile.follower_count || 0, viewCount: profile.likes_count || 0, videoCount: profile.video_count || 0 } };
}

function computeScore(channel, videos) {
  var st = (channel && channel.statistics) || {};
  var subs = parseInt(st.subscriberCount || 0), views = parseInt(st.viewCount || 0), vcount = parseInt(st.videoCount || 0);
  var aScore = subs >= 1000000 ? 20 : subs >= 100000 ? 16 : subs >= 10000 ? 12 : subs >= 1000 ? 8 : subs >= 100 ? 5 : 2;
  var vpr = subs > 0 ? views / subs : 0;
  var eScore = vpr >= 200 ? 20 : vpr >= 100 ? 16 : vpr >= 50 ? 12 : vpr >= 20 ? 8 : vpr >= 5 ? 5 : 2;
  var cScore = vcount >= 200 ? 20 : vcount >= 100 ? 17 : vcount >= 50 ? 14 : vcount >= 20 ? 10 : vcount >= 5 ? 6 : 2;
  var rScore = 10, lScore = 10;
  if (videos && videos.length) {
    var avg = videos.slice(0, 5).reduce(function(s, v) { return s + parseInt((v.statistics && v.statistics.viewCount) || 0); }, 0) / Math.min(5, videos.length);
    var ratio = subs > 0 ? avg / subs : 0;
    rScore = ratio >= .5 ? 20 : ratio >= .2 ? 17 : ratio >= .1 ? 13 : ratio >= .05 ? 9 : ratio >= .01 ? 5 : 2;
    var tv = 0, tl = 0;
    videos.slice(0, 5).forEach(function(v) { tv += parseInt((v.statistics && v.statistics.viewCount) || 0); tl += parseInt((v.statistics && v.statistics.likeCount) || 0); });
    var lr = tv > 0 ? tl / tv : 0;
    lScore = lr >= .06 ? 20 : lr >= .04 ? 17 : lr >= .02 ? 13 : lr >= .01 ? 9 : lr >= .005 ? 5 : 2;
  }
  var total = aScore + eScore + cScore + rScore + lScore;
  return {
    total: total,
    ring: total >= 80 ? 'var(--green)' : total >= 65 ? 'var(--gold)' : total >= 50 ? 'var(--blue2)' : 'var(--text2)',
    verdict: total >= 80 ? '🔥 Top Tier' : total >= 65 ? '⚡ Established' : total >= 50 ? '📈 Growing' : total >= 35 ? '🌱 Early Stage' : '🚀 Just Starting',
    tier: total >= 80 ? 'Elite' : total >= 65 ? 'Established' : total >= 50 ? 'Growth Stage' : total >= 35 ? 'Emerging' : 'Beginner',
    metrics: [{ l: 'Audience Size', s: aScore, m: 20 }, { l: 'Engagement', s: eScore, m: 20 }, { l: 'Content Volume', s: cScore, m: 20 }, { l: 'Recent Performance', s: rScore, m: 20 }, { l: 'Like Rate', s: lScore, m: 20 }],
    raw: { subs: subs, views: views, vcount: vcount, vpr: vpr.toFixed(1) }
  };
}

function renderScore(sd) {
  var ring = document.getElementById('evalRing');
  var circumference = 314.16;
  ring.style.stroke = sd.ring;
  setTimeout(function() { ring.style.strokeDashoffset = circumference - (sd.total / 100) * circumference; }, 80);
  document.getElementById('evalScoreNum').textContent = sd.total;
  document.getElementById('evalScoreNum').style.color = sd.ring;
  document.getElementById('evalVerdict').textContent = sd.verdict;
  document.getElementById('evalVerdict').style.color = sd.ring;
  document.getElementById('evalTier').textContent = sd.tier + ' · ' + sd.total + '/100';
  var barsEl = document.getElementById('evalBars');
  barsEl.innerHTML = sd.metrics.map(function(m) {
    var pct = Math.round((m.s / m.m) * 100);
    return '<div class="eval-metric-row"><div class="eval-metric-label"><span>' + m.l + '</span><span>' + m.s + '/' + m.m + '</span></div>'
      + '<div class="eval-metric-track"><div class="eval-metric-fill" style="width:0%" data-pct="' + pct + '%"></div></div></div>';
  }).join('');
  setTimeout(function() { barsEl.querySelectorAll('.eval-metric-fill').forEach(function(el) { el.style.width = el.dataset.pct; }); }, 200);
}

async function runEvaluation() {
  document.getElementById('evalMain').style.display = 'none';
  document.getElementById('evalNoAccount').style.display = 'none';
  document.getElementById('evalLoading').style.display = 'block';
  var ytS = null, ttS = null;
  try { ytS = YouTubeAuth.getSession(); } catch(e) {}
  try { ttS = TikTokAuth.getSession(); } catch(e) {}

  if (ytS && ytS.channel) {
    document.getElementById('evalLoadingMsg').textContent = 'Fetching your YouTube data…';
    var videos = null;
    try { var vr = await YouTubeAuth.fetchVideos(ytS.accessToken, 10); videos = vr && vr.items ? vr.items : []; } catch(e) {}
    var sd = computeScore(ytS.channel, videos); _evalScoreData = sd; _evalChannelData = ytS.channel; _evalVideosData = videos;
    document.getElementById('evalLoading').style.display = 'none';
    showEvalMain(ytS.channel, 'youtube'); renderScore(sd);
    await evalGetIntro(ytS.channel, videos, sd, 'YouTube');
    toast('✅ Evaluation complete!');
  } else if (ttS) {
    document.getElementById('evalLoadingMsg').textContent = 'Fetching your TikTok data…';
    var ttProfile = ttS.profile || {};
    try { var pr = await fetch(DIJO + '/tiktok/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: ttS.accessToken }) }); var pd = await pr.json(); if (pd && pd.data && pd.data.user) ttProfile = pd.data.user; } catch(e) {}
    var ttVids = [];
    try { var vr2 = await fetch(DIJO + '/tiktok/videos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ access_token: ttS.accessToken, max_count: 10 }) }); var vd = await vr2.json(); ttVids = (vd && vd.data && vd.data.videos) || []; } catch(e) {}
    var ttCh = { _platform: 'tiktok', snippet: { title: ttProfile.display_name || 'TikTok' }, statistics: { subscriberCount: ttProfile.follower_count || 0, viewCount: ttProfile.likes_count || 0, videoCount: ttProfile.video_count || 0 } };
    var ttVidsForScore = ttVids.map(function(v) { return { statistics: { viewCount: v.view_count || 0, likeCount: v.like_count || 0 } }; });
    var sd2 = computeScore(ttCh, ttVidsForScore); _evalScoreData = sd2; _evalChannelData = ttCh;
    document.getElementById('evalLoading').style.display = 'none';
    showEvalMainTt(ttS); renderScore(sd2);
    await evalGetIntroTt(ttProfile, ttVids, sd2);
    toast('✅ TikTok evaluation complete!');
  } else {
    document.getElementById('evalLoading').style.display = 'none';
    document.getElementById('evalNoAccount').style.display = 'block';
    toast('⚠️ Connect YouTube or TikTok first');
  }
}

async function evalGetIntro(channel, videos, score, platform) {
  if (!checkAccess()) return;
  var st = (channel && channel.statistics) || {};
  var name = (channel && channel.snippet && channel.snippet.title) || 'Channel';
  var topVids = videos ? videos.slice(0, 3).map(function(v, i) {
    var s = v.statistics || {}; var t = (v.snippet && v.snippet.title) || 'Video';
    return (i + 1) + '. "' + t + '" — ' + fmtN(s.viewCount) + ' views, ' + fmtN(s.likeCount) + ' likes';
  }).join('\n') : 'N/A';
  var prompt = 'Evaluate this ' + platform + ' channel in 3 sentences max. Then 3 bullet action points.\n\nChannel: ' + name + '\nSubscribers: ' + fmtN(st.subscriberCount) + '\nViews: ' + fmtN(st.viewCount) + '\nVideos: ' + (st.videoCount || 0) + '\nScore: ' + score.total + '/100 (' + score.tier + ')\nTop videos:\n' + topVids;
  try {
    var reply = await callDijo(prompt, 'creator');
    addEvalMsg('dijo', reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'));
    _evalChatHistory = [{ role: 'dijo', content: reply }];
  } catch(e) {
    addEvalMsg('dijo', 'Score: <strong>' + score.total + '/100</strong> (' + score.tier + '). Ask me anything about your growth strategy.');
  }
}

async function evalGetIntroTt(profile, videos, score) {
  if (!checkAccess()) return;
  var name = profile.display_name || 'TikTok account';
  var topVids = videos.slice(0, 3).map(function(v, i) { return (i + 1) + '. ' + fmtN(v.view_count) + ' views, ' + fmtN(v.like_count) + ' likes'; }).join('\n');
  var prompt = 'Evaluate this TikTok account in 3 sentences max. Then 3 bullet action points.\n\nAccount: ' + name + '\nFollowers: ' + fmtN(profile.follower_count) + '\nLikes: ' + fmtN(profile.likes_count) + '\nVideos: ' + (profile.video_count || 0) + '\nScore: ' + score.total + '/100 (' + score.tier + ')\nTop videos:\n' + (topVids || 'N/A');
  try {
    var reply = await callDijo(prompt, 'creator');
    addEvalMsg('dijo', reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'));
    _evalChatHistory = [{ role: 'dijo', content: reply }];
  } catch(e) {
    addEvalMsg('dijo', 'TikTok score: <strong>' + score.total + '/100</strong> (' + score.tier + '). Ask me anything.');
  }
}

function evalSend() {
  if (!checkAccess()) return;
  var i = document.getElementById('evalInput'); var msg = i.value.trim(); if (!msg) return;
  i.value = ''; evalAsk(msg);
  document.getElementById('evalChips').style.display = 'none';
}

/* ─────────────────────────────────────────────
   BUILD TREND CONTEXT — shared by all chat calls.
   Injects live _allTrends data so Dijo always has
   real signal to work from, not a blank slate.
───────────────────────────────────────────── */
function buildTrendContext() {
  if (!_allTrends.length) return '';
  var best = getBest3(_allTrends);
  var lines = [];
  if (best.tiktok)  lines.push('TikTok #1: "' + best.tiktok.topic  + '" (score ' + best.tiktok.score.toFixed(1)  + ', ' + (best.tiktok.status  || 'rising') + ')');
  if (best.youtube) lines.push('YouTube #1: "' + best.youtube.topic + '" (score ' + best.youtube.score.toFixed(1) + ', ' + (best.youtube.status || 'rising') + ')');
  if (best.google)  lines.push('Google #1: "'  + best.google.topic  + '" (score ' + best.google.score.toFixed(1)  + ', ' + (best.google.status  || 'rising') + ')');
  // Add next 3 highest overall for extra depth
  var top3extra = _allTrends
    .filter(function(t) { return t !== best.tiktok && t !== best.youtube && t !== best.google; })
    .slice(0, 3)
    .map(function(t) { return '"' + t.topic + '" (' + t.platLabel + ', ' + t.score.toFixed(1) + ')'; });
  if (top3extra.length) lines.push('Also trending: ' + top3extra.join(', '));
  return '[LIVE TRENDS — ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) + '] ' + lines.join(' | ') + ' ';
}

async function evalAsk(question) {
  addEvalMsg('user', escH(question));

  // ── Build context: channel data + live trends ──────────────────────────
  var ctx = '';

  if (_evalScoreData && _evalChannelData) {
    var st = (_evalChannelData.statistics) || {};
    var nm = (_evalChannelData.snippet && _evalChannelData.snippet.title) || 'channel';
    ctx += '[CHANNEL: ' + nm + ' — ' + fmtN(st.subscriberCount) + ' subs, '
        + fmtN(st.viewCount) + ' views, ' + (st.videoCount || 0) + ' videos, '
        + 'Score: ' + _evalScoreData.total + '/100 (' + _evalScoreData.tier + ')] ';
  }

  var trendCtx = buildTrendContext();
  if (trendCtx) {
    ctx += trendCtx;
  } else {
    ctx += '[No live trend data yet — ingestion running, answer based on general knowledge] ';
  }

  // ── Show typing indicator ──────────────────────────────────────────────
  var typId = 'typ-' + Date.now();
  var typEl = document.createElement('div'); typEl.className = 'eval-msg'; typEl.id = typId;
  typEl.innerHTML = '<div class="eval-av">DJ</div><div class="eval-bubble dijo" style="color:var(--text3);font-style:italic"><span class="spinner spinner-gold" style="width:10px;height:10px;border-width:1.5px"></span> Thinking…</div>';
  document.getElementById('evalMsgs').appendChild(typEl); scrollEval();

  try {
    var reply = await callDijo(ctx + question, 'creator');
    var te = document.getElementById(typId); if (te) te.remove();
    addEvalMsg('dijo', reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'));
    _evalChatHistory.push({ role: 'user', content: question }, { role: 'dijo', content: reply });
  } catch(e) {
    var te2 = document.getElementById(typId); if (te2) te2.remove();
    addEvalMsg('dijo', 'Dijo unavailable — try again in a moment.');
  }
}

function addEvalMsg(from, html) {
  var msgs = document.getElementById('evalMsgs');
  var div = document.createElement('div'); div.className = 'eval-msg' + (from === 'user' ? ' user' : '');
  var avHtml = from === 'user' ? '<div class="eval-av you">You</div>' : '<div class="eval-av">DJ</div>';
  div.innerHTML = avHtml + '<div class="eval-bubble ' + (from === 'user' ? 'user' : 'dijo') + '">' + html + '</div>';
  msgs.appendChild(div); scrollEval();
}
function scrollEval() { var m = document.getElementById('evalMsgs'); if (m) m.scrollTop = m.scrollHeight; }
function clearEvalChat() {
  document.getElementById('evalMsgs').innerHTML = '<div class="eval-msg"><div class="eval-av">DJ</div><div class="eval-bubble dijo">Chat cleared. What would you like to know?</div></div>';
  _evalChatHistory = []; document.getElementById('evalChips').style.display = 'flex';
}

/* ─────────────────────────────────────────────
   COPY HELPERS
───────────────────────────────────────────── */
function copyEl(id) {
  var el = document.getElementById(id); if (!el) return;
  navigator.clipboard.writeText(el.innerText || el.textContent).then(function() { toast('📋 Copied!'); }).catch(function() {});
}
function copyTags(id) {
  var el = document.getElementById(id); if (!el) return;
  var text = Array.from(el.querySelectorAll('.ob-tag')).map(function(s) { return s.textContent; }).join(' ');
  navigator.clipboard.writeText(text).then(function() { toast('📋 Hashtags copied!'); }).catch(function() {});
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function toast(msg) {
  var shelf = document.getElementById('toastShelf');
  var el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  shelf.appendChild(el);
  setTimeout(function() { el.remove(); }, 3400);
}

/* ─────────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────────── */
document.addEventListener('keydown', function(e) {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('sb-item')) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === 'Escape') closeSidebar();
});

/* ─────────────────────────────────────────────
   TAB NAVIGATION — data-tab event listeners
   Replaces fragile inline onclick="switchTab(...)"
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('[data-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchTab(this.dataset.tab, this);
    });
  });
});

/* ─────────────────────────────────────────────
   SWIPE TO CLOSE SIDEBAR (touch devices)
───────────────────────────────────────────── */
(function() {
  var startX = 0, startY = 0, isDragging = false;

  document.addEventListener('touchstart', function(e) {
    var sb = document.getElementById('sidebar');
    if (!sb || !sb.classList.contains('open')) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    var dx = e.touches[0].clientX - startX;
    var dy = Math.abs(e.touches[0].clientY - startY);
    if (dx < -30 && dy < 60) {
      closeSidebar();
      isDragging = false;
    }
  }, { passive: true });

  document.addEventListener('touchend', function() { isDragging = false; }, { passive: true });
})();

/* ─────────────────────────────────────────────
   CONTENT CALENDAR
   Rendering is fully owned by calendar.js.
   loadCalendar() is a no-op shim so any legacy
   call sites don't throw — calendar.js handles
   the real work after it initialises.
───────────────────────────────────────────── */
function getBestPostTime(i) {
  var times = ['9:00 AM', '12:30 PM', '6:00 PM', '8:30 PM'];
  return times[i % times.length];
}

function loadCalendar() {
  /* Intentional no-op — calendar.js owns all calendar rendering.
     Kept so the window.load init call below doesn't throw. */
}

/* updateTopTrends — alias kept for call sites, now a no-op since
   radar gauges and Dijo pick are rendered separately */
function updateTopTrends() {
  // renderRadarGauges and renderDijoTopPick are called by renderAll / renderFullTrends
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
window.addEventListener('load', async function() {
  // Auth is handled by auth.js → initAuth() → loadUser().
  // nav.js runs its own checkAuth() for the nav bar.
  // Do NOT call checkAuth() here — it was a duplicate that raced both of them.
  initYouTube();
  initTikTok();
  loadCalendar();
  loadPlatformStatus();
  await fetchTrends();
  renderDashTrends();
  loadOpportunities();
  renderRadarGauges();
  renderDijoTopPick();
  loadBriefing();
  setInterval(function() { fetch(DIJO + '/ping').catch(function() {}); }, 600000);

  // Auto-refresh trends every 60 seconds
  setInterval(async function() {
    try {
      var scrollY = window.scrollY;
      await fetchTrends();
      renderDashTrends();
      renderDashOpps();
      if (document.getElementById('panel-trends') && document.getElementById('panel-trends').classList.contains('active')) {
        renderFullTrends();
      }
      console.log('[Trends] Auto refreshed');
      window.scrollTo(0, scrollY);
    } catch(e) {
      console.warn('[Trends] refresh failed');
    }
  }, 60000);
});
