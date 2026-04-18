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
async function loadUser() {
  const supabase = getSupabase();
  if (!supabase || !supabase.auth) {
    console.warn("[Auth] No auth — continuing as guest");
    return;
  }

  try {
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      setUser(data.user);
      console.log("USER SYNCED ✅", getUser());
      setWelcome();
      updateUserUI();
    } else {
      console.log("[Auth] Guest mode");
    }
  } catch(e) {
    console.warn("[Auth] Auth failed:", e.message);
  }
}

// loadUser is called by initAuth() in auth.js after Supabase auth settles.
// Do not call it here — auth.js is the single trigger to avoid race conditions.

/* ─────────────────────────────────────────────
   UPDATE USER UI — fills name + avatar elements
   Uses data-user-name / data-user-avatar attrs,
   with fallback to profileName / profileAvatar IDs.
───────────────────────────────────────────── */
function updateUserUI() {
  if (!getUser()) return;

  var name =
    (getUser().user_metadata && getUser().user_metadata.full_name) ||
    (getUser().email && getUser().email.split('@')[0]) ||
    'Creator';

  var avatar =
    (getUser().user_metadata && getUser().user_metadata.avatar_url) || null;

  // data-user-name elements
  var nameEls = document.querySelectorAll('[data-user-name]');
  nameEls.forEach(function(el) { el.textContent = name; });

  // data-user-avatar elements
  var avatarEls = document.querySelectorAll('[data-user-avatar]');
  avatarEls.forEach(function(el) {
    if (avatar) {
      el.innerHTML = '<img src="' + avatar + '" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">';
    } else {
      el.textContent = name.charAt(0).toUpperCase();
    }
  });

  // Fallback: also update profileName / profileAvatar by ID
  var cardName = document.getElementById('profileName');
  var cardAv   = document.getElementById('profileAvatar');
  if (cardName) cardName.textContent = name;
  if (cardAv) {
    if (avatar) {
      cardAv.innerHTML = '<img src="' + avatar + '" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">';
    } else {
      cardAv.textContent = name.charAt(0).toUpperCase();
    }
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

async function loadProfile() {
  const supabase = getSupabase();
  if (!supabase) { console.warn("[Auth] loadProfile: Supabase not ready"); return; }
  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch (e) {
    console.warn("[Auth] loadProfile getUser failed:", e.message);
    return;
  }
  if (!user) return;

  const { data } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  if (!data) return;

  const name = data.full_name || (user.email && user.email.split('@')[0]) || 'Creator';

  // NAME
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = name;

  // AVATAR
  const avEl = document.getElementById('userAv');
  if (avEl) {
    if (data.avatar_url) {
      avEl.innerHTML =
        `<img src="${data.avatar_url}?t=${Date.now()}" 
        style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`;
    } else {
      avEl.textContent = name.charAt(0).toUpperCase();
    }
  }

  // PROFILE CARD (if exists)
  const cardName = document.getElementById('profileName');
  const cardAv   = document.getElementById('profileAvatar');

  if (cardName) cardName.textContent = name;

  if (cardAv) {
    if (data.avatar_url) {
      cardAv.innerHTML =
        `<img src="${data.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
    } else {
      cardAv.textContent = name.charAt(0).toUpperCase();
    }
  }
}

function setWelcome() {
  if (!getUser()) return;

  const name =
    getUser().user_metadata?.full_name ||
    (getUser().email && getUser().email.split('@')[0]) ||
    'Creator';

  const hour = new Date().getHours();

  let greeting = "Good morning";
  if (hour >= 12 && hour < 18) greeting = "Good afternoon";
  if (hour >= 18) greeting = "Good evening";

  const greetEl = document.getElementById('dijoGreeting');
  const briefEl = document.getElementById('dijoBrief');

  if (greetEl) greetEl.textContent = greeting + ", " + name;

  // use real trend count
  updateBriefing();
}

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
  if (!getUser()) {
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
  var isLoggedIn = !!getUser();

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

async function checkCarouselAccess() {
  if (isAdmin()) return true;

  if (!getUser()) {
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
  var res = await fetch(DIJO + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: shortPrefix + message, mode: mode || 'creator' })
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
  const velocity   = t.score;          // 0-10 scale
  const confidence = t.confidence || 60;

  if (velocity >= 8.5 && confidence >= 80) return 'blowup';    // equiv. >=85/100
  if (velocity >= 7.0)                     return 'rising_fast'; // equiv. >=70/100
  if (velocity >= 5.0)                     return 'early';      // equiv. >=50/100
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
  runTrendPrediction();
  renderDashTrends();
  renderDashOpps();
  renderWhatToPost();
  updateTopTrends();
}

async function fetchTrends() {
  // ── PRIMARY: cross-platform endpoint ─────────────────────────────────────
  try {
    var ts = Date.now();
    var res = await fetch(DIJO + '/trends/cross?ts=' + ts);
    var data = await res.json();
    if (data && data.length) {
      _allTrends = data.map(function(t, i) {
        var plat = t.platform_source === 'youtube' ? 'yt'
          : t.platform_source === 'tiktok' ? 'tt'
          : t.platform_source === 'cross' ? 'cross' : 'gt';
        var platLbl = t.platform_source === 'youtube' ? 'YouTube'
          : t.platform_source === 'tiktok' ? 'TikTok'
          : t.platform_source === 'cross' ? 'Cross' : 'Google';
        return {
          topic: t.topic,
          score: runTrendScoring(t.trend_score || 50, ['tiktok', 'youtube', 'google']),
          plat: plat, platLabel: platLbl,
          rank: i + 1, hashtags: t.hashtags || [], videoCount: t.video_count || 0,
          totalViews: t.total_views || 0, status: t.status || 'rising', igPrediction: t.instagram_prediction || 0,
          confidence: t.confidence_score || 90
        };
      });
      renderAll();
      return;
    }
  } catch(e) {}

  // ── SECONDARY: live endpoint (all platforms) ──────────────────────────────
  try {
    var res2 = await fetch(DIJO + '/trends/live?limit=20&ts=' + Date.now());
    var data2 = await res2.json();
    if (data2.trends && data2.trends.length) {
      _allTrends = data2.trends.map(function(t, i) {
        var plat = t.platform_source === 'youtube' ? 'yt'
          : t.platform_source === 'tiktok' ? 'tt'
          : t.platform_source === 'cross' ? 'cross' : 'gt';
        var platLbl = t.platform_source === 'youtube' ? 'YouTube'
          : t.platform_source === 'tiktok' ? 'TikTok'
          : t.platform_source === 'cross' ? 'Cross' : 'Google';
        return {
          topic: t.topic,
          score: runTrendScoring(t.trend_score, [t.platform_source === 'cross' ? 'tiktok' : (t.platform_source || 'google'), t.platform_source === 'cross' ? 'youtube' : '', t.platform_source === 'cross' ? 'google' : ''].filter(Boolean)),
          plat: plat, platLabel: platLbl,
          rank: i + 1, hashtags: t.hashtags || [], videoCount: t.video_count || 0,
          totalViews: t.total_views || 0, status: t.status || 'rising', igPrediction: t.instagram_prediction || 0,
          confidence: t.confidence_score || (t.platform_source === 'cross' ? 90 : t.platform_source === 'tiktok' ? 75 : t.platform_source === 'youtube' ? 70 : 60)
        };
      });
      renderAll();
      return;
    }
  } catch(e) {}

  // ── FALLBACK: Google RSS ──────────────────────────────────────────────────
  try {
    var rss = await fetch(DIJO + '/trends/google?geo=GB');
    var rd = await rss.json();
    _allTrends = (rd.trends || []).slice(0, 20).map(function(topic, i) {
      return { topic: topic, score: 5.5, plat: 'gt', platLabel: 'Google', rank: i + 1, hashtags: [], videoCount: 0, totalViews: 0, status: 'rising', igPrediction: 0 };
    });
    renderAll();
  } catch(e) {}
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
    google:  top('gt'),
    youtube: top('yt'),
    tiktok:  top('tt')
  };
}

function renderDashTrends() {
  var el = document.getElementById('dashTrendList');
  if (!el) return;

  if (!_allTrends.length) {
    el.innerHTML = '<div style="padding:16px;color:var(--text3);font-size:13px">Loading trends…</div>';
    return;
  }

  var best = getBest3(_allTrends);
  var picks = [best.tiktok, best.youtube, best.google].filter(Boolean);

  // If one or more platforms have no data, pad with next-best overall
  if (picks.length < 3) {
    var usedTopics = new Set(picks.map(function(t) { return t.topic; }));
    var extras = _allTrends.filter(function(t) { return !usedTopics.has(t.topic); });
    while (picks.length < 3 && extras.length) {
      picks.push(extras.shift());
    }
  }

  el.innerHTML = picks.map(trendItemHTML).join('');
}

function renderFullTrends() {
  // fullTrendList removed — trends panel now shows the decision dashboard
  renderWhatToPost();
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

function renderTrendChart() {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  if (window.trendChartInstance) {
    window.trendChartInstance.destroy();
    window.trendChartInstance = null;
  }

  var top7 = _allTrends.slice(0, 7);
  var topics = top7.map(function(t) { return t.topic.slice(0, 18); });
  var scores = top7.map(function(t) { return t.score; });

  window.trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: topics,
      datasets: [{
        label: 'Trend Score',
        data: scores,
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(201,126,8,0.10)',
        borderColor: '#c97e08',
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: top7.map(function(t) {
          return t.plat === 'tt'     ? '#ff6464'
               : t.plat === 'yt'    ? '#FFD700'
               : t.plat === 'cross' ? '#4FB3A5'
               :                      '#78b4ff';
        }),
        pointBorderColor: '#fff',
        pointBorderWidth: 1.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111',
          borderColor: '#c97e08',
          borderWidth: 1,
          callbacks: {
            title: function(items) { return top7[items[0].dataIndex].topic; },
            label: function(ctx) {
              var t = top7[ctx.dataIndex];
              if (!t) return '';
              return [
                '📊 Score: ' + t.score.toFixed(1),
                '📌 ' + (t.platLabel || t.plat),
                '🎬 Videos: ' + (t.videoCount || 0),
                '👁 Views: ' + fmtN(t.totalViews)
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { color: '#888', font: { size: 10 }, maxRotation: 30 }
        },
        y: {
          beginAtZero: false,
          min: 0, max: 10,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            color: '#888',
            font: { size: 10 },
            callback: function(v) { return v + ''; }
          }
        }
      }
    }
  });
}

function runTrendPrediction() {
  const el = document.getElementById("weeklyPrediction");
  if (!el || !_allTrends || !_allTrends.length) return;

  // pick strongest trend
  const top = _allTrends.sort((a,b)=>b.score-a.score)[0];

  el.innerHTML = `
    <div class="h3">${top.topic}</div>
    <div class="text-sm">Predicted to peak this week</div>
    <div class="text-sm">Best platform: ${top.platLabel || "TikTok"}</div>
  `;

  // Build insights and expose for dashboards / future panels
  window._trendInsights = buildTrendInsights();
  console.log('[TrendInsights] 🔥 Blowup:', window._trendInsights.blowup.length,
    '| ⚡ Rising fast:', window._trendInsights.rising_fast.length,
    '| 💡 Early:', window._trendInsights.early.length);
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

  el.innerHTML = data.slice(0, 3).map(function(t) {
    var platLabel = t.platform_source === 'youtube' ? 'YouTube'
      : t.platform_source === 'tiktok'   ? 'TikTok'
      : t.platform_source === 'cross'    ? 'Cross-platform'
      : 'Google';
    var platIcon = t.platform_source === 'tiktok'  ? '🎵'
      : t.platform_source === 'youtube' ? '▶️'
      : t.platform_source === 'cross'   ? '🚀' : '🔍';
    var displayScore = t.dijoScore != null
      ? Math.min(9.9, parseFloat((t.dijoScore / 10).toFixed(1)))
      : Math.min(9.9, parseFloat(((t.trend_score || 0) / 10).toFixed(1)));
    var status = t.status || 'rising';
    var videoMeta = t.video_count ? ' · ' + t.video_count + ' videos' : '';

    return '<div class="opp-card" onclick="loadTopic(\'' + escJ(t.topic) + '\')">'
      + '<div class="opp-header">'
      +   '<span class="opp-topic">' + platIcon + ' ' + escH(t.topic) + '</span>'
      +   '<span class="opp-score">' + displayScore.toFixed(1) + '</span>'
      + '</div>'
      + '<div class="opp-meta">' + escH(platLabel) + ' · ' + status + videoMeta + '</div>'
      + '</div>';
  }).join('');
}

async function loadOpportunities() {
  try {
    var res = await fetch(DIJO + '/trends/dijo');
    var data = await res.json();
    renderOpportunities(data);
  } catch(e) {
    // Dijo unavailable — fall back to local trend data
    renderDashOpps();
  }
}

// Fast in-memory re-render — used by 60s/20s refresh intervals
function renderDashOpps() {
  if (!_allTrends.length) return;
  renderOpportunities(_allTrends.slice(0, 3).map(function(t) {
    return {
      topic:           t.topic,
      platform_source: t.plat === 'yt' ? 'youtube' : t.plat === 'tt' ? 'tiktok' : t.plat === 'cross' ? 'cross' : 'google',
      trend_score:     (t.score || 0) * 10,
      dijoScore:       (t.score || 0) * 10,
      status:          t.status,
      video_count:     t.videoCount
    };
  }));
}

/* ─────────────────────────────────────────────
   WHAT TO POST THIS WEEK 📅
   Real score + confidence — not random text
───────────────────────────────────────────── */
function renderWhatToPost() {
  var el = document.getElementById('whatToPostBox');
  if (!el) return;

  var data = buildTrendInsights();

  function top(arr) {
    return arr.slice().sort(function(a, b) { return b.score - a.score; }).slice(0, 2);
  }

  var blow  = top(data.blowup);
  var fast  = top(data.rising_fast);
  var early = top(data.early);

  function itemHTML(t) {
    var platIcon = t.plat === 'tt' ? '🎵' : t.plat === 'yt' ? '▶️' : t.plat === 'cross' ? '🚀' : '🔍';
    return '<div class="wtp-item" onclick="loadTopic(\'' + escJ(t.topic) + '\')" title="Click to generate content">'
      + '<strong>' + escH(t.topic) + '</strong>'
      + '<span class="wtp-meta">' + platIcon + ' ' + escH(t.platLabel) + ' · ' + t.score.toFixed(1) + '/10</span>'
      + '</div>';
  }

  function section(icon, label, items, emptyMsg) {
    return '<div class="wtp-section">'
      + '<h4>' + icon + ' ' + label + '</h4>'
      + (items.length
          ? items.map(itemHTML).join('')
          : '<div class="wtp-empty">' + emptyMsg + '</div>')
      + '</div>';
  }

  el.innerHTML =
    section('🔥', 'Most likely to blow up',  blow,  'No blowup trends right now — check back soon')
    + section('⚡', 'Getting popular fast',   fast,  'Nothing surging yet')
    + section('🟢', 'Still early — get in now', early, 'No early-stage trends detected');
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
  try {
    var res = await fetch(DIJO + '/ai/daily-briefing');
    var data = await res.json();
    if (data.briefing) {
      el.textContent = data.briefing;
      if (dateEl) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateEl.textContent = `📡 ${time} · live`;
      }
      if (tagsEl && data.top_trends) {
        tagsEl.innerHTML = data.top_trends.map(function(t) {
          return '<span class="b-tag">' + escH(t.topic) + ' ' + Math.round(t.score) + '</span>';
        }).join('');
      }
      if (forceRefresh) toast('🧠 Briefing refreshed!');
    }
  } catch(e) {
    if (el) el.textContent = 'Dijo briefing unavailable — check back shortly.';
  }
}

/* ─────────────────────────────────────────────
   QUICK GENERATE (dashboard widget)
───────────────────────────────────────────── */
async function quickGenerate() {
  if (!checkAccess()) return;
  var topic = document.getElementById('quickTopic').value.trim();
  if (!topic) { toast('⚠️ Enter a topic first'); return; }
  var outEl = document.getElementById('quickOutput');
  outEl.style.display = 'flex';
  document.getElementById('quickHook').textContent = 'Generating…';
  document.getElementById('quickCaption').textContent = '';
  document.getElementById('quickTags').innerHTML = '';
  try {
    var reply = await callDijo(
      'Write a hook, caption, and 6 hashtags for: "' + topic + '". Format:\nHOOK: ...\nCAPTION: ...\nHASHTAGS: #tag1 #tag2 #tag3 #tag4 #tag5 #tag6',
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

async function evalAsk(question) {
  addEvalMsg('user', escH(question));
  var ctx = '';
  if (_evalScoreData && _evalChannelData) {
    var st = (_evalChannelData.statistics) || {}; var nm = (_evalChannelData.snippet && _evalChannelData.snippet.title) || 'channel';
    ctx = '[' + nm + ': ' + fmtN(st.subscriberCount) + ' subs/followers, ' + fmtN(st.viewCount) + ' views, ' + (st.videoCount || 0) + ' videos, Score: ' + _evalScoreData.total + '/100 (' + _evalScoreData.tier + ')] ';
  }
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

/* ─────────────────────────────────────────────
   TOP 3 TRENDS — replaced by renderWhatToPost
   Kept as alias so existing call sites don't break
───────────────────────────────────────────── */
function updateTopTrends() {
  renderWhatToPost();
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
  updateTopTrends();
  renderDashTrends();
  loadOpportunities();
  renderWhatToPost();
  loadBriefing();
  setInterval(function() { fetch(DIJO + '/ping').catch(function() {}); }, 600000);

  // Auto-refresh trends every 60 seconds
  setInterval(async function() {
    try {
      var scrollY = window.scrollY;
      await fetchTrends();
      renderDashTrends();
      renderDashOpps();
      renderWhatToPost();
      updateTopTrends();
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
