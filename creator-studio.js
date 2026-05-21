/* 
 IMPACTGRID CREATOR STUDIO — creator-studio.js
 Merged & deduplicated — aligned to HTML IDs
 v2.1 — Mobile fixes: hamburger X animation,
 mobile nav via nav.js
 */

var DIJO = 'https://impactgrid-dijo.onrender.com';
var _allTrends = [];

/* GEO DETECTION 
 Detects the user's country via a free IP lookup (no API key needed).
 Result is cached in _userCountry and passed to all trend endpoints so each
 user gets trends relevant to their country, not just the UK.
 Falls back to 'GB' if the lookup fails or times out.
 */
var _userCountry = 'GB'; // default — overwritten on load
var _userCountryName = 'United Kingdom';
var _geoDetected = false;

async function detectUserCountry() {
 if (_geoDetected) return _userCountry;
 _showGeoStatus(' Detecting your location…');

 var COUNTRY_NAMES = {
  GB:'United Kingdom', US:'United States', NG:'Nigeria', GH:'Ghana',
  KE:'Kenya', ZA:'South Africa', DE:'Germany', FR:'France', CA:'Canada',
  AU:'Australia', IN:'India', BR:'Brazil', AE:'United Arab Emirates',
  NL:'Netherlands', SE:'Sweden', NO:'Norway', DK:'Denmark', IT:'Italy',
  ES:'Spain', PL:'Poland', MX:'Mexico', SG:'Singapore', JP:'Japan'
 };
 function resolveCountryName(code) {
  return COUNTRY_NAMES[code] || code;
 }

 var GEO_PROVIDERS = [
  {
   url: 'https://cloudflare.com/cdn-cgi/trace',
   parse: function(text) {
    var match = text.match(/loc=([A-Z]{2})/);
    if (!match) return null;
    var code = match[1];
    return { country_code: code, country_name: resolveCountryName(code) };
   },
   isJson: false
  },
  {
   url: 'https://get.geojs.io/v1/ip/country.json',
   parse: function(data) {
    if (!data || !data.country) return null;
    return { country_code: data.country, country_name: data.name || resolveCountryName(data.country) };
   },
   isJson: true
  },
  {
   url: 'https://freeipapi.com/api/json',
   parse: function(data) {
    if (!data || !data.countryCode) return null;
    return { country_code: data.countryCode, country_name: data.countryName || resolveCountryName(data.countryCode) };
   },
   isJson: true
  },
  {
   url: 'https://ipapi.co/json/',
   parse: function(data) {
    if (!data || !data.country_code) return null;
    return { country_code: data.country_code, country_name: data.country_name || resolveCountryName(data.country_code) };
   },
   isJson: true
  }
 ];

 var detected = false;
 for (var i = 0; i < GEO_PROVIDERS.length; i++) {
  var provider = GEO_PROVIDERS[i];
  try {
   var controller = new AbortController();
   var timer = setTimeout(function() { controller.abort(); }, 4000);
   var res = await fetch(provider.url, { signal: controller.signal });
   clearTimeout(timer);
   if (!res.ok) throw new Error('HTTP ' + res.status);
   var result = provider.isJson ? await res.json() : await res.text();
   var geo = provider.parse(result);
   if (geo && geo.country_code) {
    _userCountry = geo.country_code;
    _userCountryName = geo.country_name;
    console.log('[Geo] Detected via provider ' + i + ':', _userCountry, '(' + _userCountryName + ')');
    detected = true;
    break;
   }
  } catch(e) {
   console.warn('[Geo] Provider ' + i + ' failed (' + provider.url + '):', e.message);
  }
 }

 if (!detected) {
  console.warn('[Geo] All providers failed — defaulting to GB');
 }

 _geoDetected = true;
 _showGeoStatus(' ' + _userCountryName);
 return _userCountry;
}

function _showGeoStatus(text) {
 // Updates any element with id="geoStatus" in the HTML.
 // If the element doesn't exist yet, this is a silent no-op.
 var el = document.getElementById('geoStatus');
 if (el) el.textContent = text;

 // Also update the auto-location pill in the Live Trends panel
 var autoText = document.getElementById('geoAutoText');
 var autoLabel = document.getElementById('geoAutoLabel');
 if (autoText) {
  autoText.textContent = _geoDetected ? _userCountryName : text.trim();
  // Hide the spinner once detection is complete
  var spinner = autoLabel ? autoLabel.querySelector('.spinner') : null;
  if (spinner) spinner.style.display = _geoDetected ? 'none' : '';
 }

 // Also update ticker geo labels when country is confirmed (not "Detecting…")
 if (_geoDetected || text.indexOf('Detecting') === -1) {
 var countryName = _userCountryName || text.replace(' ', '');
 var tickerLabel = document.getElementById('tickerGeoLabel');
 if (tickerLabel) tickerLabel.textContent = countryName;
 document.querySelectorAll('.tickerGeoLabel2').forEach(function(el2) {
 el2.textContent = countryName;
 });
 }
}

/* AI CALL THROTTLE 
 Prevents the auto-refresh loop from hammering /chat and /ai/*
 Each AI function caches its result for 30 minutes.
 forceRefresh=true bypasses the cache (manual Refresh buttons).
 */
var _aiCache = {};
var AI_CACHE_MS = 30 * 60 * 1000;

function _aiCacheGet(key) {
 var entry = _aiCache[key];
 if (!entry) return null;
 if (Date.now() - entry.ts > AI_CACHE_MS) { delete _aiCache[key]; return null; }
 return entry.value;
}
function _aiCacheSet(key, value) {
 _aiCache[key] = { value: value, ts: Date.now() };
}
// Expose on window so calendar.js can read real trend data without
// duplicating the fetch. calendar.js checks window._allTrends first.
// Simple assignment — avoids defineProperty redefine errors on reload.
window._allTrends = _allTrends;
var _selectedStyle = 'Educational';
var trendChartInstance = null;
var _evalChannelData = null, _evalScoreData = null, _evalVideosData = null, _evalChatHistory = [];

/* 
 LOAD USER — called on DOMContentLoaded
 Syncs user from Supabase session, then
 updates greeting + avatar/name UI.
 */
/* 
 GET CURRENT USER — single source of truth.
 nav.js sets window.igUser via _loadProfile()
 and fires 'ig-user-ready'. Pages MUST NOT call
 supabase.auth.getUser() themselves — that causes
 double-auth and race conditions.
 */
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
 console.log('USER SYNCED ', user.email);

 // data-ig-greeting (set by nav.js too — this is belt-and-braces)
 var hour = new Date().getHours();
 var greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
 document.querySelectorAll('[data-ig-greeting]').forEach(function(el) {
 el.textContent = greeting + ', ' + user.firstName;
 });

 updateUserUI();
 if (typeof setWelcome === 'function') setWelcome();
}

/* 
 UPDATE USER UI — fills name + avatar elements.
 Reads ONLY from window.igUser (set by nav.js).
 No auth calls — nav.js is the single source.
 */
function updateUserUI() {
 var user = getCurrentUser();
 if (!user) return;

 var name = user.name || 'Creator';
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
 var cardAv = document.getElementById('profileAvatar');
 if (cardName) cardName.textContent = name;
 if (cardAv) {
 cardAv.innerHTML = avatar
 ? '<img src="' + avatar + '" style="width:100%;height:100%;border-radius:8px;object-fit:cover;">'
 : name.charAt(0).toUpperCase();
 }
}

/* 
 BRIEFING
 */


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
 briefEl.textContent = ` ${safeTopic(best.tiktok)} · ${safeTopic(best.youtube)} · ${safeTopic(best.google)}`;
}

/* 
 THEME — owned by nav.js (window.toggleTheme).
 Do NOT redefine toggleTheme here — nav.js runs
 without defer and sets window.toggleTheme before
 this file loads. Redefining it here would break
 the footer and mobile theme buttons.
 */

/* 
 TABS
 */
function switchTab(name) {
 document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
 document.querySelectorAll('.tab-btn:not(.tab-soon)').forEach(function(b) { b.classList.remove('active'); });

 var panel = document.getElementById('panel-' + name);
 if (panel) panel.classList.add('active');
 var tb = document.getElementById('tab-' + name);
 if (tb) tb.classList.add('active');

 var ca = document.getElementById('contentArea');
 if (ca) ca.scrollTop = 0;

 if (name === 'trends' && _allTrends.length) renderFullTrends();
 if (name === 'evaluator') initEvaluator();
 if (name === 'calendar') {
 if (typeof loadCalendar === 'function') loadCalendar();
 }
}



/* 
 USER MENU
 Nav dropdown is owned by nav.js (toggleDD / #uDrop).
 This click-outside listener is a safety net only.
 */
document.addEventListener('click', function(e) {
 var d = document.getElementById('uDrop');
 if (d && !e.target.closest('.user-btn')) d.classList.remove('open');
});

/* 
 AUTH
 Nav UI (setNavUser, igSignOut, checkAuth) is
 fully owned by nav.js — do not duplicate here.
 Studio-specific auth work lives in loadUser()
 which is called by auth.js after initAuth().
 */

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
 } else if (typeof getUser === 'function' && getUser()) {
 name = (getUser().user_metadata && getUser().user_metadata.full_name)
 ? getUser().user_metadata.full_name.split(' ')[0]
 : (getUser().email && getUser().email.split('@')[0])
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

/* 
 ig-user-ready listener
 nav.js dispatches this after _loadProfile()
 completes — meaning window.igUser has real
 full_name + avatar_url from the profiles table.
 Re-run our UI updates so the greeting/avatar
 reflect the profiles data, not just auth metadata.
 */
document.addEventListener('ig-user-ready', function() {
 setWelcome();
 updateUserUI();
});

/* 
 PAYWALL
 checkAccess() is ONLY called for generative
 actions (generate, save, export) — never
 for passive browsing panels.
 */

// Panels that are always free to view — no gate
var IG_FREE_PANELS = ['dashboard', 'trends', 'calendar'];

function checkAccess() {
 // Never block passive browsing panels
 var activePanel = document.querySelector('.panel.active');
 if (activePanel) {
 var panelName = activePanel.id.replace('panel-', '');
 if (IG_FREE_PANELS.indexOf(panelName) !== -1) return true;
 }

 // Admin bypass
 if (isAdmin()) return true;

 // Not logged in
 if (!getUser()) {
 if (typeof window.showUpgradeBar_gate === 'function') {
 window.showUpgradeBar_gate('Create an account to save and unlock more', false);
 } else {
 showUpgrade('Create an account to save and unlock more');
 }
 return false;
 }

 // AI use limit — uses canUse() from auth.js (covers all plans, not just free)
 if (!canUse('ai_uses')) {
 var _plan = getPlan();
 // Use igPlanLabel() from plan-config.js as single source of truth for display labels
 var _planLabel = (typeof igPlanLabel === 'function') ? igPlanLabel(_plan) : (_plan.charAt(0).toUpperCase() + _plan.slice(1));
 var _limit = (window.IG_PLAN_CONFIG && window.IG_PLAN_CONFIG[_plan]) ? window.IG_PLAN_CONFIG[_plan].ai_uses : 3;
 if (typeof window.showPlanGate === 'function') {
 window.showPlanGate({
 icon: '',
 title: 'Monthly AI limit reached',
 subtitle: "You've used all " + _limit + " AI generations on the " + _planLabel + " plan. Upgrade to keep creating."
 });
 } else if (typeof window.showUpgradeBar_gate === 'function') {
 window.showUpgradeBar_gate(_planLabel + ' plan: ' + _limit + ' AI uses/mo reached — upgrade for more', true);
 } else {
 showUpgrade("You've hit your plan limit — upgrade to continue");
 }
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
 ' position: fixed;',
 ' top: 80px;',
 ' left: 50%;',
 ' transform: translateX(-50%) translateY(-20px);',
 ' background: var(--card);',
 ' border: 1px solid var(--border);',
 ' border-radius: 999px;',
 ' padding: 10px 16px;',
 ' box-shadow: var(--sh2);',
 ' opacity: 0;',
 ' transition: all .3s ease;',
 ' z-index: 9999;',
 '}',
 '#upgradeBar.show {',
 ' opacity: 1;',
 ' transform: translateX(-50%) translateY(0);',
 '}',
 '.upgrade-inner {',
 ' display: flex;',
 ' gap: 12px;',
 ' align-items: center;',
 ' font-size: 12px;',
 '}'
 ].join('\n');
 document.head.appendChild(style);
})();

async function checkCarouselAccess() {
 // Admin always bypasses all limits
 if (isAdmin()) return true;

 if (!getUser()) {
 showUpgrade('Login required to create carousels');
 return false;
 }

 // Read carousel limit directly from plan-config.js (single source of truth).
 // canUse('carousel') used a broken key — correct key is 'carousels'.
 var _cPlan = getPlan();
 var _carouselLimit = (window.IG_PLAN_CONFIG && window.IG_PLAN_CONFIG[_cPlan])
 ? window.IG_PLAN_CONFIG[_cPlan].carousels
 : 3; // safe free-plan default if config not loaded
 var _carouselUsed = parseInt(localStorage.getItem('ig_carousel_count') || '0') || 0;

 if (isFinite(_carouselLimit) && _carouselUsed >= _carouselLimit) {
 var _cLabel = (typeof igPlanLabel === 'function') ? igPlanLabel(_cPlan) : _cPlan;
 if (typeof window.showPlanGate === 'function') {
 window.showPlanGate({
 icon: '🎠',
 title: 'Carousel limit reached',
 subtitle: _cLabel + ' plan includes ' + _carouselLimit + ' carousel' + (_carouselLimit !== 1 ? 's' : '') + '. Upgrade to create more.'
 });
 } else {
 showUpgrade('Upgrade for more carousels');
 }
 return false;
 }

 return true;
}

/* 
 DIJO API — 3-sentence max enforced
 */
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

/* 
 UTILITIES
 */
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

/* 
 VIRAL INTELLIGENCE SCORING 
 TikTok = velocity engine 
 YouTube = validation engine 
 Google = demand engine 
 */
function runTrendScoring(rawScore, platforms) {
 // Derive sub-scores from raw score (0-100 scale internally)
 var base = rawScore; // already 0-100
 var velocityScore = base * 0.9;
 var engagementScore = base * 0.8;
 var commentsScore = base * 0.7;
 var recencyScore = base * 0.85;

 var platformWeight = 1;

 // PLATFORM INTELLIGENCE
 if (platforms.includes('tiktok')) platformWeight += 0.3; // velocity king 
 if (platforms.includes('youtube')) platformWeight += 0.2; // validation 
 if (platforms.includes('google')) platformWeight += 0.1; // demand 

 var finalScore = Math.min(100,
 (
 velocityScore * 0.45 +
 engagementScore * 0.25 +
 commentsScore * 0.15 +
 recencyScore * 0.15
 ) * platformWeight
 );

 return Math.min(9.9, parseFloat((finalScore / 10).toFixed(1)));
}

/* 
 TREND CLASSIFICATION 
 Turns scores into actionable decision groups
 */
function classifyTrend(t) {
 const velocity = t.score;
 const confidence = t.confidence || 60;

 // Confidence gate lowered to 60: Google-only fallback data defaults to 60,
 // so without this change everything falls through to 'stable' and all three
 // "What to post" sections show empty. TikTok/YouTube data with real
 // confidence scores (75-90) still benefit from the higher tier naturally.
 if (velocity >= 8.5 && confidence >= 60) return 'blowup';
 if (velocity >= 7.0) return 'rising_fast';
 if (velocity >= 5.0) return 'early';
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

/* 
 TREND DATA
 */

/* 
 COMBINED CHART + WINNER BOX
 updateChart() — renders a single line chart
 with one dataset per platform (TikTok/YouTube/
 Google), each showing their top 5 scored topics.
 Uses t.plat ('tt','yt','gt') — NOT t.platform.
 updateWinnerBox() — highlights the single best
 topic across all platforms with a score badge.
 getWinner() — pure helper, does NOT mutate
 the source array (uses spread copy).
 */
var _trendChartInstance = null;

function getWinner(trends) {
 if (!trends || !trends.length) return null;
 return trends.slice().sort(function(a, b) { return b.score - a.score; })[0];
}

function updateWinnerBox() {
 var el = document.getElementById('trendWinner');
 if (!el) return;

 var winner = getWinner(_allTrends);
 if (!winner) {
 el.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">No trend data yet</div>';
 return;
 }

 var level = winner.score > 8 ? 'HIGH ' : winner.score > 5 ? 'MEDIUM ' : 'LOW ';
 var clsColor = winner.score > 8 ? 'var(--green)' : winner.score > 5 ? 'var(--gold)' : 'var(--text3)';
 var platIcon = winner.plat === 'tt' ? '' : winner.plat === 'tt_proxy' ? '' : winner.plat === 'yt' ? '' : winner.plat === 'cross' ? '' : '';
 var platColor = winner.plat === 'tt' ? '#ff6464' : winner.plat === 'tt_proxy' ? '#ff9090' : winner.plat === 'yt' ? '#FFD700' : winner.plat === 'cross' ? '#4FB3A5' : '#78b4ff';
 var cls = classifyTrend(winner);
 var clsLbl = cls === 'blowup' ? ' Likely to blow up' : cls === 'rising_fast' ? ' Rising fast' : cls === 'early' ? ' Early signal' : ' Stable';

 el.innerHTML =
 '<div class="card" style="height:100%;display:flex;flex-direction:column;justify-content:center;gap:10px;padding:18px 16px">'
 + '<div style="font-family:\'DM Mono\',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)"> Winning Trend</div>'
 + '<div style="font-family:\'Syne\',sans-serif;font-size:17px;font-weight:900;line-height:1.25;color:var(--text)">' + escH(winner.topic) + '</div>'
 + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
 + '<span style="font-family:\'DM Mono\',monospace;font-size:22px;font-weight:900;color:' + clsColor + '">' + winner.score.toFixed(1) + '</span>'
 + '<span style="font-size:10px;font-weight:700;color:' + clsColor + '">' + level + '</span>'
 + '</div>'
 + '<div style="font-size:11px;color:' + platColor + ';font-weight:700">' + platIcon + ' ' + escH(winner.platLabel) + '</div>'
 + '<div style="font-size:11px;color:var(--text3)">' + clsLbl + '</div>'
 + '<button onclick="loadTopic(\'' + escJ(winner.topic) + '\')" style="margin-top:4px;padding:8px 14px;border-radius:8px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;font-size:12px;font-weight:700;border:none;cursor:pointer;font-family:\'Syne\',sans-serif;align-self:flex-start"> Generate</button>'
 + '</div>';
}

function updateChart() {
 var canvas = document.getElementById('trendChart');
 if (!canvas || !_allTrends.length) return;

 // Top 5 per platform by score — uses t.plat ('tt','tt_proxy','yt','gt'), NOT t.platform
 function topN(plat, n) {
 return _allTrends
 .filter(function(t) {
 // tt_proxy counts as TikTok data for chart purposes (it's the best signal we have)
 return t.plat === plat || (plat === 'tt' && t.plat === 'tt_proxy');
 })
 .slice().sort(function(a, b) { return b.score - a.score; })
 .slice(0, n);
 }

 var tt = topN('tt', 5);
 var yt = topN('yt', 5);
 var gt = topN('gt', 5);

 // Build a unified label set — topic names from whichever platform has most data
 var primary = tt.length >= yt.length && tt.length >= gt.length ? tt
 : yt.length >= gt.length ? yt : gt;
 var labels = primary.map(function(t) {
 return t.topic.length > 16 ? t.topic.slice(0, 16) + '…' : t.topic;
 });
 if (!labels.length) { labels = ['1','2','3','4','5']; }

 // Align scores to label count — pad with null if platform has fewer topics
 function alignScores(arr) {
 return labels.map(function(_, i) { return arr[i] ? arr[i].score : null; });
 }

 var datasets = [];
 if (tt.length) datasets.push({
 label: ' TikTok',
 data: alignScores(tt),
 borderColor: '#ff6464',
 backgroundColor: 'rgba(255,100,100,0.08)',
 tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
 pointBackgroundColor: '#ff6464', pointBorderColor: '#fff', pointBorderWidth: 1.5,
 borderWidth: 2, fill: false, spanGaps: true
 });
 if (yt.length) datasets.push({
 label: ' YouTube',
 data: alignScores(yt),
 borderColor: '#FFD700',
 backgroundColor: 'rgba(255,215,0,0.08)',
 tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
 pointBackgroundColor: '#FFD700', pointBorderColor: '#fff', pointBorderWidth: 1.5,
 borderWidth: 2, fill: false, spanGaps: true
 });
 if (gt.length) datasets.push({
 label: ' Google',
 data: alignScores(gt),
 borderColor: '#78b4ff',
 backgroundColor: 'rgba(120,180,255,0.08)',
 tension: 0.4, pointRadius: 4, pointHoverRadius: 7,
 pointBackgroundColor: '#78b4ff', pointBorderColor: '#fff', pointBorderWidth: 1.5,
 borderWidth: 2, fill: false, spanGaps: true
 });

 if (!datasets.length) return;

 // Destroy previous instance before creating new
 if (_trendChartInstance) { _trendChartInstance.destroy(); _trendChartInstance = null; }

 var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
 var gridCol = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
 var tickCol = isDark ? '#666' : '#999';

 _trendChartInstance = new Chart(canvas.getContext('2d'), {
 type: 'line',
 data: { labels: labels, datasets: datasets },
 options: {
 responsive: true,
 maintainAspectRatio: false,
 animation: { duration: 600, easing: 'easeInOutQuart' },
 interaction: { mode: 'index', intersect: false },
 plugins: {
 legend: {
 display: true,
 position: 'top',
 labels: { color: tickCol, font: { size: 11 }, boxWidth: 12, padding: 14 }
 },
 tooltip: {
 backgroundColor: '#111',
 callbacks: {
 label: function(ctx) {
 if (ctx.raw === null) return ctx.dataset.label + ': no data';
 // Map back to original topic name from the correct platform array
 var src = ctx.dataset.label.includes('TikTok') ? tt
 : ctx.dataset.label.includes('YouTube') ? yt : gt;
 var t = src[ctx.dataIndex];
 return t ? t.topic + ' · ' + ctx.raw.toFixed(1) + '/10' : ctx.raw.toFixed(1) + '/10';
 }
 }
 }
 },
 scales: {
 x: { grid: { color: gridCol }, ticks: { color: tickCol, font: { size: 10 }, maxRotation: 30 } },
 y: { min: 0, max: 10, grid: { color: gridCol }, ticks: { color: tickCol, font: { size: 10 }, callback: function(v) { return v + '/10'; }, stepSize: 2 } }
 }
 }
 });

 // Also update winner box every time chart updates
 updateWinnerBox();
}

/* renderAll — unified re-render called after any trend fetch */
function renderAll() {
 updateBriefing();
 loadBriefing(); // refresh pulse strip now that _allTrends is populated
 runTrendPrediction();
 renderDashTrends();
 renderDashOpps();
 updateTopTrends();
 // Chart + radar gauges + Dijo pick: always update so data is ready when user switches tab
 renderTrendChart();
 renderRadarGauges();
 renderDijoTopPick();
 // Combined cross-platform chart + winner box (trends panel summary row)
 updateChart();
 // Trust signals — prediction accuracy badge
 loadPredictionAccuracy();
}

async function fetchTrends() {
 // Shared mapper — normalises any trend row from any endpoint 
 function mapTrend(t, i) {
 // /trends/cross (v_cross_platform_trends view) may use 'source' instead of 'platform_source'
 var src = t.platform_source || t.source || 'google';
 var plat = src === 'youtube' ? 'yt'
 : src === 'tiktok' ? 'tt'
 : src === 'tiktok_signal' ? 'tt_proxy' // YouTube-proxied TikTok estimate
 : src === 'cross' ? 'cross' : 'gt';
 var platLbl = src === 'youtube' ? 'YouTube'
 : src === 'tiktok' ? 'TikTok'
 : src === 'tiktok_signal' ? 'TikTok Buzz'  // Reddit-sourced TikTok culture signal
 : src === 'cross' ? 'Cross' : 'Google';
 var platforms = src === 'cross'
 ? ['tiktok', 'youtube', 'google']
 : src === 'youtube' ? ['youtube']
 : src === 'tiktok' ? ['tiktok']
 : src === 'tiktok_signal' ? ['tiktok'] // still counts for scoring weight
 : ['google'];
 return {
 topic: t.topic,
 score: runTrendScoring(t.trend_score || t.avg_score || 50, platforms),
 plat: plat,
 platLabel: platLbl,
 rank: i + 1,
 hashtags: t.hashtags || [],
 videoCount: t.video_count || t.total_videos || 0,
 totalViews: t.total_views || 0,
 status: t.status || 'rising',
 igPrediction: t.instagram_prediction || 0,
 igReason: t.instagram_reason || '',
 dataSource: t.data_source || null,
 velocityScore: t.velocity_score || 0,
 detectedAt: t.detected_at || null,
 confidence: t.confidence_score || t.velocity_score ||
 (src === 'cross' ? 90 : src === 'tiktok' ? 75 : src === 'tiktok_signal' ? 55 : src === 'youtube' ? 70 : 60)
 };
 }

 // Ensure geo is detected before fetching — if already done this is instant
 var geo = await detectUserCountry();
 console.log('[fetchTrends] Using geo:', geo);

 // PRIMARY: cross-platform endpoint 
 // NOTE: /trends/cross returns { trends: [...] } NOT a bare array
 try {
 var ts = Date.now();
 var res = await fetch(DIJO + '/trends/cross?geo=' + geo + '&ts=' + ts);
 var data = await res.json();
 // Unwrap either shape: bare array OR { trends: [...] }
 var crossList = Array.isArray(data) ? data : (data && Array.isArray(data.trends) ? data.trends : null);
 if (crossList && crossList.length) {
 _allTrends = crossList.map(mapTrend); window._allTrends = _allTrends;
 console.log('[fetchTrends] /trends/cross loaded', _allTrends.length, 'trends —',
 _allTrends.filter(function(t){return t.plat==='tt';}).length, 'TikTok,',
 _allTrends.filter(function(t){return t.plat==='yt';}).length, 'YouTube,',
 _allTrends.filter(function(t){return t.plat==='gt';}).length, 'Google,',
 _allTrends.filter(function(t){return t.plat==='cross';}).length, 'Cross');
 renderAll();
 return;
 }
 console.warn('[fetchTrends] /trends/cross returned empty list');
 } catch(e) { console.warn('[fetchTrends] /trends/cross failed:', e.message); }

 // SECONDARY: live endpoint (all platforms) 
 try {
 var res2 = await fetch(DIJO + '/trends/live?limit=20&geo=' + geo + '&ts=' + Date.now());
 var data2 = await res2.json();
 var liveList = Array.isArray(data2) ? data2 : (data2 && Array.isArray(data2.trends) ? data2.trends : null);
 if (liveList && liveList.length) {
 _allTrends = liveList.map(mapTrend); window._allTrends = _allTrends;
 console.log('[fetchTrends] /trends/live loaded', _allTrends.length, 'trends');
 renderAll();
 return;
 }
 console.warn('[fetchTrends] /trends/live returned empty list');
 } catch(e) { console.warn('[fetchTrends] /trends/live failed:', e.message); }

 // TERTIARY: trends_cache endpoint 
 // Richer than RSS (has platform diversity + video stats); use when cross/live
 // both return empty (e.g. Supabase ingestion lag or cold start).
 try {
 var res3 = await fetch(DIJO + '/trends/cache?geo=' + geo + '&ts=' + Date.now());
 var data3 = await res3.json();
 var cacheList = Array.isArray(data3) ? data3 : (data3 && Array.isArray(data3.trends) ? data3.trends : null);
 if (cacheList && cacheList.length) {
 _allTrends = cacheList.map(mapTrend); window._allTrends = _allTrends;
 console.warn('[fetchTrends] /trends/cache loaded', _allTrends.length, 'trends (cross/live empty)');
 renderAll();
 return;
 }
 console.warn('[fetchTrends] /trends/cache returned empty list');
 } catch(e) { console.warn('[fetchTrends] /trends/cache failed:', e.message); }

 // LAST RESORT: Google RSS 
 // No platform diversity or video stats — only reached if all above fail.
 // This endpoint is already fully geo-aware on the backend — just pass the
 // detected country code instead of the old hardcoded 'GB'.
 try {
 console.warn('[fetchTrends] Falling back to Google RSS — all endpoints returned no data');
 var rss = await fetch(DIJO + '/trends/google?geo=' + geo);
 var rd = await rss.json();
 _allTrends = (rd.trends || []).slice(0, 20).map(function(topic, i) {
 return { topic: topic, score: 5.5, plat: 'gt', platLabel: 'Google', rank: i + 1, hashtags: [], videoCount: 0, totalViews: 0, status: 'rising', igPrediction: 0, confidence: 60 };
 }); window._allTrends = _allTrends;
 if (_allTrends.length) {
 console.log('[fetchTrends] Google RSS loaded', _allTrends.length, 'topics for', geo);
 renderAll();
 }
 } catch(e) { console.error('[fetchTrends] All endpoints failed:', e.message); }

 // If every endpoint failed or returned empty, show an error state with retry
 if (!_allTrends.length) {
  var errMsg = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;line-height:1.6">'
   + ' Could not load trends right now — the server may be waking up (this can take ~30s on first load).<br><br>'
   + '<a href="#" onclick="fetchTrends();return false" style="color:var(--gold);font-weight:600;text-decoration:none"> Tap to retry</a>'
   + '</div>';
  var dashList = document.getElementById('dashTrendList');
  if (dashList) dashList.innerHTML = errMsg;
  var trendsList = document.getElementById('trendList');
  if (trendsList) trendsList.innerHTML = errMsg;
  var radarBox = document.getElementById('radarGaugesBox');
  if (radarBox) radarBox.innerHTML = errMsg;
  var topPickBox = document.getElementById('dijoTopPickBox');
  if (topPickBox) topPickBox.innerHTML = errMsg;
  var loadingIndicator = document.getElementById('geoLoadingIndicator');
  if (loadingIndicator) loadingIndicator.style.display = 'none';
 }
}

function _dataSourceLabel(t) {
 // Returns a small inline label showing data origin + quality tier.
 // Higher-trust sources get green; proxy/fallback get amber.
 switch (t.dataSource || '') {
 case 'rapidapi_tiktok': return { text: ' Live TikTok Data', color: '#4caf50' };
 case 'google_trends': return { text: ' Google Trends', color: '#4caf50' };
 case 'news_rss': return { text: ' News RSS', color: '#f5a623' };
 case 'reddit': return { text: ' Reddit Signal', color: '#f5a623' };
 case 'youtube_proxy': return { text: ' YouTube Proxy', color: '#e67e22' };
 case 'gb_fallback': return { text: ' Fallback Data', color: '#e74c3c' };
 default:
 // Infer from platform type when data_source field is absent
 if (t.plat === 'tt') return { text: ' Live TikTok Data', color: '#4caf50' };
 if (t.plat === 'tt_proxy') return { text: ' TikTok Buzz', color: '#ff6464' };
 if (t.plat === 'cross') return { text: ' Cross-Platform', color: '#4caf50' };
 if (t.plat === 'yt') return { text: ' YouTube Trending', color: '#4caf50' };
 return { text: ' Search Demand', color: '#78b4ff' };
 }
}

function _freshness(detectedAt) {
 // Returns human-readable "X min ago" / "Xh ago" from a detected_at ISO string
 if (!detectedAt) return '';
 var diff = Date.now() - new Date(detectedAt).getTime();
 var mins = Math.round(diff / 60000);
 if (mins < 2) return 'just now';
 if (mins < 60) return mins + 'm ago';
 var hrs = Math.round(mins / 60);
 if (hrs < 24) return hrs + 'h ago';
 return Math.round(hrs / 24) + 'd ago';
}

function _velocityBar(velocityScore) {
 // Returns a mini velocity indicator string for display
 if (!velocityScore || velocityScore < 5) return '';
 var rounded = Math.round(velocityScore);
 var arrow = velocityScore >= 70 ? '' : velocityScore >= 40 ? '' : '';
 return arrow + ' ' + rounded + '% velocity';
}

function trendItemHTML(t) {
 var pct = Math.round((t.score / 10) * 100);
 var platCls = t.plat === 'yt' ? 'plat-yt' : (t.plat === 'tt' || t.plat === 'tt_proxy') ? 'plat-tt' : 'plat-gt';
 var meta = t.videoCount > 0
 ? t.videoCount + ' videos · ' + fmtN(t.totalViews) + ' views'
 : t.platLabel + ' · click to generate';

 var badge =
 t.plat === 'tt' ? ' TikTok Viral'
 : t.plat === 'tt_proxy' ? ' TikTok Buzz'
 : t.plat === 'yt' ? ' YouTube Validated'
 : t.plat === 'cross' ? ' Cross-Platform'
 : ' Search Demand';

 // Trust signals 
 var srcInfo = _dataSourceLabel(t);
 var freshness = _freshness(t.detectedAt);
 var velTxt = _velocityBar(t.velocityScore);

 // Data source badge — colour-coded by quality tier
 var srcHtml = '<div style="display:flex;align-items:center;gap:6px;margin-top:3px;flex-wrap:wrap">'
 + '<span style="font-size:9px;font-family:\'DM Mono\',monospace;letter-spacing:.04em;color:' + srcInfo.color + '">' + srcInfo.text + '</span>'
 + (freshness ? '<span style="font-size:9px;color:var(--text3);font-family:\'DM Mono\',monospace">· ' + freshness + '</span>' : '')
 + (velTxt ? '<span style="font-size:9px;color:var(--gold);font-family:\'DM Mono\',monospace">· ' + velTxt + '</span>' : '')
 + '</div>';

 return '<div class="trend-item" onclick="loadTopic(\'' + escJ(t.topic) + '\')">'
 + '<div class="ti-rank">#' + t.rank + '</div>'
 + '<div class="ti-info">'
 + '<div class="ti-topic">' + escH(t.topic) + '</div>'
 + '<div class="ti-meta">' + escH(meta) + '</div>'
 + '<div class="ti-badge">' + badge + '</div>'
 + srcHtml
 + '</div>'
 + '<div class="ti-bar-wrap"><div class="ti-bar"><div class="ti-bar-fill" style="width:' + pct + '%"></div></div><div class="ti-score">' + t.score.toFixed(1) + '/10</div></div>'
 + '<div class="ti-plat ' + platCls + '">' + escH(t.platLabel) + '</div>'
 + '</div>';
}


function getBest3(trends) {
 // Cross-platform trends count as candidates for all three platforms.
 // Without this, plat==='cross' rows are invisible to per-platform filters
 // and the extras fill-in loop ends up grabbing duplicates (e.g. 3 YouTube).
 function top(plat) {
 return trends
 .filter(function(t) {
 // tt_proxy counts as tiktok for the TikTok slot; cross counts for all
 var isMatch = t.plat === plat || t.plat === 'cross';
 if (plat === 'tt') isMatch = isMatch || t.plat === 'tt_proxy';
 return isMatch;
 })
 .sort(function(a, b) { return b.score - a.score; })[0] || null;
 }
 var tt = top('tt');
 var yt = top('yt');
 var gt = top('gt');

 // De-duplicate: if the same cross topic won multiple slots, replace lower-
 // priority slots with the next best non-duplicate.
 var used = new Set();
 if (tt) used.add(tt.topic);

 function nextUnused(plat, current) {
 if (!current || !used.has(current.topic)) return current;
 var candidate = trends
 .filter(function(t) {
 return (t.plat === plat || t.plat === 'cross') && !used.has(t.topic);
 })
 .sort(function(a, b) { return b.score - a.score; })[0] || null;
 if (candidate) used.add(candidate.topic);
 return candidate;
 }

 yt = nextUnused('yt', yt); if (yt) used.add(yt.topic);
 gt = nextUnused('gt', gt); if (gt) used.add(gt.topic);

 // Graceful fallback: if TikTok or Google slot is still empty,
 // fill it with the next unused high-score trend from any platform
 // and re-label it so the UI always shows 3 distinct cards.
 // This keeps the dashboard useful while ingestion data catches up.
 function nextAny(overridePlat, overrideLabel) {
 var candidate = trends
 .filter(function(t) { return !used.has(t.topic); })
 .sort(function(a, b) { return b.score - a.score; })[0] || null;
 if (!candidate) return null;
 used.add(candidate.topic);
 // Clone so we don't mutate _allTrends
 return Object.assign({}, candidate, { plat: overridePlat, platLabel: overrideLabel });
 }

 if (!tt) tt = nextAny('tt', 'TikTok');
 if (!gt) gt = nextAny('gt', 'Google');

 return { tiktok: tt, youtube: yt, google: gt };
}

function renderDashTrends() {
 var el = document.getElementById('dashTrendList');
 if (!el) return;

 if (!_allTrends.length) {
 el.innerHTML = '<div style="padding:16px;color:var(--text3);font-size:13px">Loading trends…</div>';
 return;
 }

 // Show analytical insight cards — the "why" behind Top Opportunities 
 // One best pick per platform with velocity classification + action hint.
 var best = getBest3(_allTrends);
 // Use top3 — best 3 by score regardless of platform (no forced TikTok slot)
 var picks = best.top3 || [best.tiktok, best.youtube, best.google].filter(Boolean);

 var platColors = { tt: '#ff6464', tt_proxy: '#ff9090', yt: '#FFD700', gt: '#78b4ff', cross: '#4FB3A5' };
 var insightLabels = [' Top Signal', ' Strong Pick', ' Worth Watching'];

 el.innerHTML = picks.map(function(t, idx) {
 var color = platColors[t.plat] || 'var(--gold)';
 var pct = Math.round((t.score / 10) * 100);
 var cls = classifyTrend(t);
 var clsLabel = cls === 'blowup' ? ' Likely to blow up'
 : cls === 'rising_fast' ? ' Getting popular fast'
 : cls === 'early' ? ' Early — get in now'
 : ' Stable trend';
 var clsColor = cls === 'blowup' ? 'var(--green)'
 : cls === 'rising_fast' ? 'var(--gold)'
 : cls === 'early' ? '#4FB3A5'
 : 'var(--text3)';
 var actionHint = t.plat === 'tt' ? 'Post a 30–60s hook video today'
 : t.plat === 'yt' ? 'Best for a 5–10 min explainer'
 : t.plat === 'cross' ? 'Works across multiple platforms'
 : 'High search demand — great for SEO content';
 var vidMeta = t.videoCount > 0
 ? fmtN(t.videoCount) + ' videos · ' + fmtN(t.totalViews) + ' views'
 : t.platLabel + ' trend data';
 var srcInfo = _dataSourceLabel(t);
 var freshness = _freshness(t.detectedAt);
 var velTxt = _velocityBar(t.velocityScore);
 var srcHtml = '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap">'
 + '<span style="font-size:9px;font-family:\'DM Mono\',monospace;letter-spacing:.04em;color:' + srcInfo.color + '">' + srcInfo.text + '</span>'
 + (freshness ? '<span style="font-size:9px;color:var(--text3);font-family:\'DM Mono\',monospace">· ' + freshness + '</span>' : '')
 + (velTxt ? '<span style="font-size:9px;color:var(--gold);font-family:\'DM Mono\',monospace">· ' + velTxt + '</span>' : '')
 + '</div>';

 return '<div class="trend-item" style="cursor:pointer;position:relative;overflow:hidden" onclick="loadTopic(\'' + escJ(t.topic) + '\')">'
 // animated progress stripe behind the card
 + '<div style="position:absolute;top:0;left:0;height:3px;width:' + pct + '%;background:' + color + ';border-radius:3px 3px 0 0;transition:width 1s ease"></div>'
 + '<div class="ti-rank" style="color:' + color + '">' + escH(insightLabels[idx] || ('#' + (idx + 1))) + '</div>'
 + '<div class="ti-info">'
 + '<div class="ti-topic">' + escH(t.topic) + '</div>'
 + '<div class="ti-meta">' + escH(vidMeta) + '</div>'
 + '<div class="ti-badge" style="color:' + clsColor + '">' + clsLabel + '</div>'
 + '<div style="font-size:10px;color:var(--text3);margin-top:2px;font-style:italic">' + escH(actionHint) + '</div>'
 + srcHtml
 + '</div>'
 + '<div class="ti-bar-wrap">'
 + '<div class="ti-bar"><div class="ti-bar-fill" style="width:' + pct + '%;background:' + color + '"></div></div>'
 + '<div class="ti-score" style="color:' + color + '">' + t.score.toFixed(1) + '</div>'
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

/* 
 LIVE PLATFORM METERS
 Three animated meter cards — TikTok, YouTube,
 Google — each showing the #1 trend for that
 platform with a live animated fill bar and
 pulse dot. Updates every 60s via renderAll().
 */
function renderPlatformMeters() {
 var el = document.getElementById('radarGaugesBox'); // legacy — superseded by renderRadarGauges()
 if (!el) return;
 if (!_allTrends.length) { el.innerHTML = ''; return; }

 // platBest with cross-platform support + fallback relabelling
 var _pmUsed = new Set();
 function platBest(plat) {
 var arr = _allTrends
 .filter(function(t){ return (t.plat === plat || t.plat === 'cross') && !_pmUsed.has(t.topic); })
 .sort(function(a,b){ return b.score - a.score; });
 if (arr.length) { _pmUsed.add(arr[0].topic); return arr[0]; }
 // Fallback: re-label next unused trend
 var fb = _allTrends
 .filter(function(t){ return !_pmUsed.has(t.topic); })
 .sort(function(a,b){ return b.score - a.score; })[0] || null;
 if (fb) { _pmUsed.add(fb.topic); return Object.assign({}, fb, { plat: plat }); }
 return null;
 }

 var tt = platBest('tt');
 var yt = platBest('yt');
 var gt = platBest('gt');

 var platConfigs = [
 { key: 'tt', icon: '', label: 'TikTok', color: '#ff6464', trend: tt, emptyMsg: 'No TikTok data yet' },
 { key: 'yt', icon: '', label: 'YouTube', color: '#FFD700', trend: yt, emptyMsg: 'No YouTube data yet' },
 { key: 'gt', icon: '', label: 'Google', color: '#78b4ff', trend: gt, emptyMsg: 'No Google data yet' }
 ];

 // Inject keyframes once
 if (!document.getElementById('_meterKeyframes')) {
 var style = document.createElement('style');
 style.id = '_meterKeyframes';
 style.textContent = [
 '@keyframes meterPulse {',
 ' 0%,100% { opacity:1; transform:scale(1); }',
 ' 50% { opacity:.4; transform:scale(1.5); }',
 '}',
 '@keyframes meterFillIn {',
 ' from { width:0; }',
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

 var t = cfg.trend;
 var pct = Math.round((t.score / 10) * 100);
 var cls = classifyTrend(t);
 var clsLbl = cls === 'blowup' ? ' Blowup' : cls === 'rising_fast' ? ' Rising' : cls === 'early' ? ' Early' : ' Stable';
 var clsClr = cls === 'blowup' ? 'var(--green)' : cls === 'rising_fast' ? 'var(--gold)' : cls === 'early' ? '#4FB3A5' : 'var(--text3)';
 var vidMeta = t.videoCount > 0
 ? fmtN(t.videoCount) + ' videos'
 : (t.confidence ? t.confidence + '% confidence' : 'live data');

 return '<div class="live-meter-card">'
 + '<div class="lm-stripe" style="background:' + cfg.color + '"></div>'
 + '<div class="lm-head">'
 + '<div style="display:flex;align-items:center;gap:8px">'
 + '<span class="lm-icon">' + cfg.icon + '</span>'
 + '<span class="lm-label">' + cfg.label + '</span>'
 + '<span class="lm-dot" style="background:' + cfg.color + '"></span>'
 + '</div>'
 + '<span class="lm-score" style="color:' + cfg.color + '">' + t.score.toFixed(1) + '</span>'
 + '</div>'
 + '<div class="lm-topic" onclick="loadTopic(\'' + escJ(t.topic) + '\')">' + escH(t.topic) + '</div>'
 + '<div class="lm-bar-wrap">'
 + '<div class="lm-bar-fill" style="width:' + pct + '%;background:' + cfg.color + '"></div>'
 + '</div>'
 + '<div class="lm-meta">'
 + '<span class="lm-cls" style="color:' + clsClr + ';border-color:' + clsClr + '40">' + clsLbl + '</span>'
 + '<span>·</span>'
 + '<span>' + escH(vidMeta) + '</span>'
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

 // AUTO POSITION (key fix)
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

/* 
 LIVE TREND CHART
 Three lines — TikTok (red), YouTube (gold),
 Google (blue). X-axis = top trend per platform.
 Chart re-draws every 60s via renderAll().
 A subtle pulse animation makes it feel live.
 */
/* 
 THREE PLATFORM CHARTS
 One line chart per platform — TikTok, YouTube,
 Google — each showing their top 3 trending topics
 with scores on Y axis. Lines rise and fall as
 scores update every 60s. Clicking a topic label
 opens the generator pre-filled with that topic.
 */
var _chartTT = null, _chartYT = null, _chartGT = null;
// Store historical score snapshots so lines actually move
var _chartHistory = { tt: {}, yt: {}, gt: {} };
var _chartHistoryMax = 8; // keep last 8 snapshots per topic

function _recordSnapshot(plat, trends) {
 var hist = _chartHistory[plat];
 var now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

 // Include cross-platform trends as eligible for any platform chart
 var trends = _allTrends
 .filter(function(t){ return t.plat === plat || t.plat === 'cross'; })
 .slice().sort(function(a,b){ return b.score - a.score; })
 .slice(0, 3);

 // Fallback: borrow top unused trends from any platform and re-label them
 // so TikTok and Google charts are never blank while ingestion catches up.
 if (!trends.length) {
 var alreadyUsed = new Set(
 _allTrends
 .filter(function(t){ return t.plat !== plat; })
 .slice(0, 3)
 .map(function(t){ return t.topic; })
 );
 trends = _allTrends
 .slice().sort(function(a,b){ return b.score - a.score; })
 .filter(function(t){ return !alreadyUsed.has(t.topic); })
 .slice(0, 3)
 .map(function(t){ return Object.assign({}, t, { plat: plat }); });
 }

 // Show empty state only when truly no trend data at all
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
 var clsIcon = cls === 'blowup' ? '' : cls === 'rising_fast' ? '' : cls === 'early' ? '' : '';
 var dashes = ['solid', 'dashed', 'dotted'];
 return '<div onclick="loadTopic(\'' + escJ(t.topic) + '\')" style="cursor:pointer;display:flex;align-items:center;gap:7px;padding:5px 0;border-bottom:1px solid var(--border)">'
 + '<div style="width:14px;height:3px;background:' + color + ';border-radius:2px;flex-shrink:0;opacity:' + (idx===0?1:idx===1?0.7:0.45) + ';border-style:' + dashes[idx] + '"></div>'
 + '<div style="flex:1;min-width:0">'
 + '<div style="font-size:12px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escH(t.topic) + '</div>'
 + '<div style="height:3px;background:var(--bg2);border-radius:99px;margin-top:3px;overflow:hidden">'
 + '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:99px;transition:width .6s ease"></div>'
 + '</div>'
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
 window._trendInsights = buildTrendInsights();
 var cached = _aiCacheGet('weekly_prediction');
 if (cached) { el.innerHTML = cached; return; }
 var top = _allTrends.slice().sort(function(a,b){ return b.score - a.score; })[0];
 if (!top) return;
 var cap = top.topic.charAt(0).toUpperCase() + top.topic.slice(1);
 var html = '<div style="font-family:\'Syne\',sans-serif;font-size:20px;font-weight:900;line-height:1.2;color:var(--text1)">' + escH(cap) + '</div>';
 el.innerHTML = html;
 _aiCacheSet('weekly_prediction', html);
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

/* 
 OPPORTUNITIES — powered by /trends/dijo
 renderOpportunities(data) accepts the raw
 Dijo API shape (trend_score, platform_source,
 dijoScore, etc.) and maps it to opp-cards.
 renderDashOpps() is a fast synchronous fallback
 used by the 60s/20s refresh intervals — it
 re-renders from the already-loaded _allTrends
 so we don't fire an extra network request on
 every tick.
 */
function renderOpportunities(data) {
 var el = document.getElementById('topOppBox');
 if (!el) return;

 if (!data || !data.length) {
 el.innerHTML = '<div class="opp-empty">No opportunities yet — check back soon</div>';
 return;
 }

 // Ensure one card per platform (YouTube → TikTok → Google priority) 
 var platOrder = ['youtube', 'tiktok', 'google', 'cross'];
 var seen = {};
 var ordered = [];
 platOrder.forEach(function(p) {
 var match = data.find(function(t) { return (t.platform_source || 'google') === p && !seen[p]; });
 if (match) { seen[p] = true; ordered.push(match); }
 });
 // Fill remaining slots with any unseen items
 data.forEach(function(t) {
 if (ordered.length < 3 && !ordered.includes(t)) ordered.push(t);
 });
 var items = ordered.slice(0, 3);

 var platMeta = {
 youtube: { icon: '', color: '#FFD700', hint: '5–10 min explainer' },
 tiktok: { icon: '', color: '#ff6464', hint: '30–60s hook video' },
 google: { icon: '', color: '#78b4ff', hint: 'SEO article or Short' },
 cross: { icon: '', color: '#4FB3A5', hint: 'Post on TikTok + YouTube' }
 };

 var rankLabels = ['#1 Best Pick', '#2 Strong Play', '#3 Worth Watching'];
 var rankColors = ['var(--gold)', 'var(--green)', 'var(--blue2)'];

 el.innerHTML = items.map(function(t, idx) {
 var src = t.platform_source || 'google';
 var pm = platMeta[src] || platMeta.google;
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
 var rankColor = rankColors[idx] || 'var(--text2)';
 var rankLabel = rankLabels[idx] || '';

 return '<div class="opp-card" onclick="loadTopic(\'' + escJ(t.topic) + '\')" title="Click to generate content">'
 + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px">'
 + '<span style="font-family:\'DM Mono\',monospace;font-size:9px;font-weight:700;color:' + rankColor + ';letter-spacing:.08em;text-transform:uppercase">' + rankLabel + '</span>'
 + '<span style="font-family:\'DM Mono\',monospace;font-size:16px;font-weight:900;color:' + rankColor + '">' + displayScore.toFixed(1) + '</span>'
 + '</div>'
 + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
 + '<span style="font-size:13px">' + pm.icon + '</span>'
 + '<span style="font-family:\'DM Mono\',monospace;font-size:9px;font-weight:700;color:' + pm.color + ';letter-spacing:.06em">' + src.toUpperCase() + '</span>'
 + '</div>'
 + '<div style="font-size:13px;font-weight:700;color:var(--text1);margin-bottom:5px;line-height:1.3">' + escH(t.topic) + '</div>'
 + '<div style="height:3px;background:var(--bg2);border-radius:99px;margin-bottom:5px;overflow:hidden">'
 + '<div style="height:100%;width:' + pct + '%;background:' + rankColor + ';border-radius:99px;transition:width .5s ease"></div>'
 + '</div>'
 + '<div style="font-size:10px;color:var(--text3);font-style:italic">' + escH(pm.hint) + '</div>'
 + '</div>';
 }).join('');
}


/* 
 PREDICTION ACCURACY BADGE
 Fetches /trends/predictions and injects a
 live accuracy % badge wherever the element
 id="predAccuracyBadge" exists in the HTML.
 This is the single biggest trust signal —
 showing users that predictions are verified.
 */
async function loadPredictionAccuracy() {
 var badge = document.getElementById('predAccuracyBadge');
 if (!badge) return;

 try {
 var geo = _userCountry || 'GB';
 var res = await fetch(DIJO + '/trends/predictions?geo=' + geo);
 var data = await res.json();

 var accuracy = data.accuracy_30d;
 var total = data.total_verified || 0;
 var active = (data.active || []).length;

 if (accuracy == null || total < 3) {
 // Not enough data yet — show a neutral building state
 badge.innerHTML = '<span style="font-size:10px;color:var(--text3);font-family:\'DM Mono\',monospace"> Building accuracy record…</span>';
 return;
 }

 var color = accuracy >= 70 ? '#4caf50' : accuracy >= 50 ? '#f5a623' : '#e74c3c';
 var label = accuracy >= 70 ? 'High accuracy' : accuracy >= 50 ? 'Good accuracy' : 'Developing';

 badge.innerHTML =
 '<div style="display:inline-flex;align-items:center;gap:8px;background:' + color + '18;border:1px solid ' + color + '40;border-radius:8px;padding:6px 12px">'
 + '<span style="font-size:18px;font-weight:900;color:' + color + ';font-family:\'DM Mono\',monospace">' + accuracy + '%</span>'
 + '<div style="line-height:1.3">'
 + '<div style="font-size:10px;font-weight:700;color:' + color + '">' + label + '</div>'
 + '<div style="font-size:9px;color:var(--text3)">from ' + total + ' verified predictions · ' + active + ' active now</div>'
 + '</div>'
 + '</div>';

 // Also populate active predictions list if element exists
 var listEl = document.getElementById('activePredictionsList');
 if (listEl && data.active && data.active.length) {
 listEl.innerHTML = data.active.slice(0, 5).map(function(p) {
 var confColor = p.confidence >= 70 ? '#4caf50' : p.confidence >= 50 ? '#f5a623' : 'var(--text3)';
 var platIcon = p.predicted_platform === 'instagram' ? '' : p.predicted_platform === 'tiktok' ? '' : '';
 return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">'
 + '<span style="font-size:14px">' + platIcon + '</span>'
 + '<div style="flex:1;min-width:0">'
 + '<div style="font-size:12px;font-weight:600;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escH(p.topic) + '</div>'
 + '<div style="font-size:10px;color:var(--text3)">Peak in ' + escH(p.predicted_peak_window || '24-48h') + '</div>'
 + '</div>'
 + '<div style="font-family:\'DM Mono\',monospace;font-size:11px;font-weight:700;color:' + confColor + '">' + p.confidence + '%</div>'
 + '</div>';
 }).join('');
 }

 } catch(e) {
 console.warn('[PredAccuracy] Failed:', e.message);
 }
}

async function loadOpportunities() {
 try {
 var geo = _userCountry || 'GB';
 var res = await fetch(DIJO + '/trends/dijo?geo=' + geo);
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

// Fast in-memory re-render — used by 60s refresh intervals and as fallback.
// Explicit order: YouTube first, then TikTok, then Google — one per platform.
function renderDashOpps() {
 if (!_allTrends.length) return;
 var best = getBest3(_allTrends);
 // Use top3 — no forced TikTok slot, just the 3 highest scoring trends
 var top3 = best.top3 || [best.youtube, best.tiktok, best.google].filter(Boolean);
 renderOpportunities(top3.map(function(t) {
 var src = t.plat === 'yt' ? 'youtube' : t.plat === 'tt' || t.plat === 'tt_proxy' ? 'tiktok' : t.plat === 'cross' ? 'cross' : 'google';
 return {
 topic: t.topic,
 platform_source: src,
 _score: t.score,
 status: t.status,
 video_count: t.videoCount
 };
 }));
}

/* 
 WHAT TO POST THIS WEEK 
 Uses buildTrendInsights() classifications first.
 If any section is empty (common when data has
 low confidence), fills from best-per-platform
 so cards never show "No trends" when we have data.
 */
/* 
 RADAR GAUGES — three animated fuel-gauge style
 dials, one per platform (TikTok, YouTube, Google).
 Each shows the #1 trending topic + live score.
 The needle animates like a fuel gauge rising and
 falling as scores change on each 60s refresh.
 */
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
 .rg-label { font-size:11px; font-weight:700; color:var(--text2); letter-spacing:.06em; text-transform:uppercase; font-family:\'DM Mono\',monospace; }
 .rg-svg-wrap { width:140px; height:80px; position:relative; }
 .rg-score-overlay { position:absolute; bottom:0; left:50%; transform:translateX(-50%); text-align:center; line-height:1; }
 .rg-score-num { font-family:'Syne',sans-serif; font-size:22px; font-weight:900; }
 .rg-score-unit { font-family:\'DM Mono\',monospace; font-size:9px; color:var(--text3); }
 .rg-topic { font-size:13px; font-weight:700; text-align:center; line-height:1.3; cursor:pointer; max-width:160px; }
 .rg-topic:hover { text-decoration:underline; }
 .rg-status { font-size:10px; font-weight:700; padding:2px 9px; border-radius:99px; border:1px solid; font-family:\'DM Mono\',monospace; }
 .rg-meta { font-size:10px; color:var(--text3); text-align:center; }
 .rg-dot { width:6px; height:6px; border-radius:50%; display:inline-block; animation:meterPulse 1.8s ease-in-out infinite; margin-right:4px; }
 .rg-empty { font-size:12px; color:var(--text3); text-align:center; padding:16px 0; }
 `;
 document.head.appendChild(s);
 }

 // platBest with cross-platform support + fallback relabelling
 var _rgUsed = new Set();
 function platBest(plat) {
 var arr = _allTrends
 .filter(function(t){ return (t.plat === plat || t.plat === 'cross') && !_rgUsed.has(t.topic); })
 .sort(function(a,b){ return b.score - a.score; });
 if (arr.length) { _rgUsed.add(arr[0].topic); return arr[0]; }
 // Fallback: re-label next unused trend so gauge is never empty
 var fb = _allTrends
 .filter(function(t){ return !_rgUsed.has(t.topic); })
 .sort(function(a,b){ return b.score - a.score; })[0] || null;
 if (fb) { _rgUsed.add(fb.topic); return Object.assign({}, fb, { plat: plat }); }
 return null;
 }

 var cfgs = [
 { plat:'tt', icon:'', label:'TikTok', color:'#ff6464', trend: platBest('tt') },
 { plat:'yt', icon:'', label:'YouTube', color:'#FFD700', trend: platBest('yt') },
 { plat:'gt', icon:'', label:'Google', color:'#78b4ff', trend: platBest('gt') }
 ];

 function gaugeArc(pct, color) {
 // Half-circle gauge: sweep from 180deg to 0deg
 // r=54, cx=70, cy=70 (bottom half only shown via viewBox clip)
 var r = 54, cx = 70, cy = 68;
 var startAngle = Math.PI; // left = 0
 var endAngle = 0; // right = 100%
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
 var t = cfg.trend;
 var pct = Math.round((t.score / 10) * 100);
 var cls = classifyTrend(t);
 var clsLbl = cls === 'blowup' ? ' Peak' : cls === 'rising_fast' ? ' Rising' : cls === 'early' ? ' Early' : ' Stable';
 var clsColor = cls === 'blowup' ? 'var(--green)' : cls === 'rising_fast' ? 'var(--gold)' : cls === 'early' ? '#4FB3A5' : 'var(--text3)';
 var meta = t.videoCount > 0
 ? t.videoCount + ' videos · ' + fmtN(t.totalViews) + ' views'
 : (t.confidence ? t.confidence + '% confidence' : 'live data');

 return '<div class="rg-card">'
 + '<div class="rg-stripe" style="background:' + cfg.color + '"></div>'
 + '<div class="rg-label"><span class="rg-dot" style="background:' + cfg.color + '"></span>' + cfg.icon + ' ' + cfg.label + '</div>'
 + '<div class="rg-svg-wrap">'
 + gaugeArc(pct, cfg.color)
 + '<div class="rg-score-overlay">'
 + '<div class="rg-score-num" style="color:' + cfg.color + '">' + t.score.toFixed(1) + '</div>'
 + '<div class="rg-score-unit">/10</div>'
 + '</div>'
 + '</div>'
 + '<div class="rg-topic" onclick="loadTopic(\'' + escJ(t.topic) + '\')" style="color:var(--text)">' + escH(t.topic) + '</div>'
 + '<div class="rg-status" style="color:' + clsColor + ';border-color:' + clsColor + '40">' + clsLbl + '</div>'
 + '<div class="rg-meta">' + escH(meta) + '</div>'
 + '</div>';
 }

 el.innerHTML = '<div class="rg-grid">' + cfgs.map(card).join('') + '</div>';
}

/* 
 DIJO TOP PICK — replaces "What to post" section.
 Picks the single best topic across ALL platforms
 using dijoScore, then asks Dijo AI why it's the
 best opportunity right now in one short sentence.
 */
async function renderDijoTopPick() {
 var el = document.getElementById('dijoTopPickBox');
 if (!el) return;

 if (!_allTrends.length) {
 el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:8px">Loading trend data…</div>';
 return;
 }

 // Pick best trend by score
 var best = _allTrends.slice().sort(function(a,b){ return b.score - a.score; })[0];
 var platIcon = best.plat === 'tt' ? '' : best.plat === 'yt' ? '' : best.plat === 'cross' ? '' : '';
 var platColor = best.plat === 'tt' ? '#ff6464' : best.plat === 'yt' ? '#FFD700' : best.plat === 'cross' ? '#4FB3A5' : '#78b4ff';
 var cls = classifyTrend(best);
 var clsLbl = cls === 'blowup' ? ' Peak now — post immediately' : cls === 'rising_fast' ? ' Rising fast — get ahead of it' : cls === 'early' ? ' Early stage — first mover advantage' : ' Stable trend';

 // Show skeleton immediately
 var _topicSafe = escJ(best.topic);
 el.innerHTML =
 '<div style="display:flex;flex-direction:column;gap:10px">'
 + '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'
 + '<div style="font-family:Syne,sans-serif;font-size:20px;font-weight:900;line-height:1.2;color:var(--text)">' + escH(best.topic) + '</div>'
 + '<div style="font-family:DM Mono,monospace;font-size:24px;font-weight:900;color:' + platColor + ';flex-shrink:0">' + best.score.toFixed(1) + '</div>'
 + '</div>'
 + '<div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">'
 + '<span style="font-size:11px;background:var(--gold-dim);border:1px solid var(--gold-glo);color:var(--gold);border-radius:6px;padding:3px 10px;font-family:DM Mono,monospace">' + platIcon + ' ' + escH(best.platLabel) + '</span>'
 + '<span style="font-size:11px;font-weight:700;color:' + platColor + '">' + clsLbl + '</span>'
 + '</div>'
 + '<div id="dijoPickReason" style="font-size:13px;color:var(--text2);line-height:1.6;border-left:2px solid var(--gold);padding-left:10px;min-height:20px">'
 + '<span class="spinner spinner-gold" style="width:12px;height:12px;border-width:2px;margin-right:6px;vertical-align:middle"></span>'
 + '<span style="color:var(--text3);font-size:12px">Dijo is analysing why this is the best opportunity…</span>'
 + '</div>'
 + '<div style="display:flex;gap:8px;margin-top:4px">'
 + '<button onclick="loadTopic(\'' + _topicSafe + '\')" style="padding:9px 18px;border-radius:9px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:Syne,sans-serif"> Generate content for this</button>'
 + '<div style="font-size:10px;color:var(--text3);font-family:DM Mono,monospace;align-self:center">Dijo top pick · updated every 30 min</div>'
 + '</div>'
 + '</div>';

 // Fetch AI reason — cached per topic for 30 min to protect token budget
 var _pickKey = 'pick_' + best.topic;
 var _cached = _aiCacheGet(_pickKey);
 if (_cached) {
 var reasonEl = document.getElementById('dijoPickReason');
 if (reasonEl) reasonEl.textContent = _cached;
 return;
 }
 try {
 var locationCtx = _userCountryName ? ' in ' + _userCountryName : '';
 var prompt = 'In ONE sentence (max 25 words), explain why "' + best.topic
 + '" is the best content opportunity right now on ' + best.platLabel
 + locationCtx + ' with a score of ' + best.score.toFixed(1) + '/10. Be specific and direct.';
 var res = await fetch(DIJO + '/chat', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ message: prompt, mode: 'creator' })
 });
 var data = await res.json();
 var reasonEl = document.getElementById('dijoPickReason');
 if (reasonEl && data.reply) {
 var reason = data.reply.trim().split(/[.!?]/)[0] + '.';
 reasonEl.textContent = reason;
 _aiCacheSet(_pickKey, reason);
 }
 } catch(e) {
 var reasonEl = document.getElementById('dijoPickReason');
 if (reasonEl) reasonEl.textContent = 'Highest scored trend across all platforms right now — strong opportunity for ' + best.platLabel + ' content.';
 }
}

function loadTopic(topic) {
 // Gate at the point of action — not mid-generation
 if (!checkAccess()) return;

 var i1 = document.getElementById('quickTopic'); if (i1) i1.value = topic;
 var i2 = document.getElementById('genTopic'); if (i2) i2.value = topic;
 switchTab('generator', null);

 // FIX 4: AUTO GENERATE with trend-aware context 
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
 toast(' Generating for: ' + topic);
}

/* Dynamic AI hint above generator input */
function updateHint(score) {
 var el = document.getElementById('aiHint');
 if (!el) return;
 if (score >= 9) el.textContent = ' High viral potential topic';
 else if (score >= 8) el.textContent = ' Strong trending opportunity';
 else el.textContent = ' Emerging topic — needs strong hook';
}

/* 
 PLATFORM STATUS — FIX 5
 Reads /ingestion/status and lights up platform indicators
 TikTok = velocity engine YouTube = validation 
 */
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

/* 
 DAILY BRIEFING
 */
async function loadBriefing(forceRefresh) {
 if (!forceRefresh && _aiCacheGet('briefing_done')) return;

 var el = document.getElementById('briefingText');
 var tagsEl = document.getElementById('briefingTags');
 var dateEl = document.getElementById('briefingDate');
 if (!el) return;

 var PLAT_COLOR = { tt:'#ff6464', yt:'#FFD700', gt:'#78b4ff', cross:'#4FB3A5' };
 var PLAT_ICON = { tt:'', yt:'', gt:'', cross:'' };
 var PLAT_NAME = { tt:'TikTok', yt:'YouTube', gt:'Google', cross:'Trending' };

 function setTimestamp() {
 if (dateEl) {
 var now = new Date();
 dateEl.innerHTML = '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#0fa876;margin-right:4px;vertical-align:middle"></span>'
 + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '\n· live';
 }
 }

 function getTopTrend() {
 if (!_allTrends || !_allTrends.length) return null;
 return _allTrends.slice().sort(function(a, b) { return b.score - a.score; })[0];
 }

 function renderShell(top) {
 var cap = (top.topic || '').charAt(0).toUpperCase() + (top.topic || '').slice(1);
 var platColor = PLAT_COLOR[top.plat] || '#4FB3A5';
 var platIcon = PLAT_ICON[top.plat] || '';
 var platName = PLAT_NAME[top.plat] || 'Trending';
 var cls = classifyTrend(top);
 var heat = cls === 'blowup' ? ' Blowing up'
 : cls === 'rising_fast' ? ' Rising fast'
 : cls === 'early' ? ' Early signal'
 : ' Trending';
 el.innerHTML =
 '<div style="font-family:\'DM Mono\',monospace;font-size:9px;font-weight:700;color:' + platColor + ';letter-spacing:.08em;margin-bottom:6px;text-transform:uppercase">'
 + platIcon + ' ' + platName + ' &nbsp;·&nbsp; ' + heat
 + '</div>'
 + '<div style="font-family:\'Syne\',sans-serif;font-size:19px;font-weight:900;line-height:1.2;color:var(--text1);margin-bottom:10px">'
 + escH(cap)
 + '</div>'
 + '<div id="dijoInsightText" style="font-size:12px;color:var(--text2);line-height:1.6">'
 + '<span class="spinner spinner-gold"></span>'
 + '</div>';
 setTimestamp();
 return { cap: cap, platName: platName, heat: heat };
 }

 async function fetchInsight(topicName, platName, heat) {
 var insightEl = document.getElementById('dijoInsightText');
 if (!insightEl) return;
 try {
 var locationLabel = _userCountryName || 'your country';
 var prompt = '"' + topicName + '" is ' + heat + ' on ' + platName + ' right now in ' + locationLabel + '. '
 + 'Why is it blowing up and what should a content creator in ' + locationLabel + ' do about it today?';
 var text = await callDijo(prompt, 'creator');
 if (text && insightEl) insightEl.textContent = text;
 } catch(e) {
 if (insightEl) insightEl.textContent = '';
 }
 }

 var top = getTopTrend();
 if (top) {
 var info = renderShell(top);
 _aiCacheSet('briefing_done', true);
 if (forceRefresh) toast(' Briefing refreshed!');
 fetchInsight(info.cap, info.platName, info.heat);
 return;
 }

 el.innerHTML = '<span class="spinner spinner-gold"></span>';
 try {
 var res = await fetch(DIJO + '/ai/daily-briefing');
 var data = await res.json();
 top = getTopTrend();
 if (top) {
 var info2 = renderShell(top);
 _aiCacheSet('briefing_done', true);
 fetchInsight(info2.cap, info2.platName, info2.heat);
 return;
 }
 var apiTop = (data.top_trends && data.top_trends[0]) || null;
 if (apiTop) {
 var fakeTrend = { topic: apiTop.topic, plat: 'cross', score: apiTop.score || 7 };
 var info3 = renderShell(fakeTrend);
 _aiCacheSet('briefing_done', true);
 fetchInsight(info3.cap, info3.platName, info3.heat);
 } else if (data.briefing) {
 el.textContent = data.briefing;
 setTimestamp();
 }
 } catch(e) {
 if (el) el.textContent = 'Trends unavailable — check back shortly.';
 }
}

async function quickGenerate() {
 if (!checkAccess()) return;
 var topicEl = document.getElementById('quickTopic');
 if (!topicEl) return;
 var topic = topicEl.value.trim();
 if (!topic) { toast(' Enter a topic first'); return; }
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
 toast(' Generated!');
 } catch(e) {
 document.getElementById('quickHook').textContent = 'Dijo unavailable — try again.';
 }
}

/* 
 FULL GENERATE
 */
function selectStyle(el) {
 document.querySelectorAll('.style-chip').forEach(function(c) { c.classList.remove('active'); });
 el.classList.add('active');
 _selectedStyle = el.textContent.trim();
}

/* 
 TREND SCORE LOOKUP
 Replaces the old keyword-heuristic calcScore().
 Searches _allTrends for any trend whose topic
 overlaps with the user's input topic, then uses
 its real ingested score. Falls back to 6.0
 (neutral/unknown) so the UI is honest rather
 than faking confidence it doesn't have.
 */
function lookupTrendScore(topic) {
 if (!topic) return { score: 6.0, trend: null };
 var tl = topic.toLowerCase().trim();

 // 1. Exact match first
 var exact = _allTrends.find(function(t) {
 return t.topic.toLowerCase() === tl;
 });
 if (exact) return { score: exact.score, trend: exact };

 // 2. Substring match — topic contains a known trend or vice versa
 var partial = _allTrends.find(function(t) {
 var ttl = t.topic.toLowerCase();
 return tl.includes(ttl) || ttl.includes(tl);
 });
 if (partial) return { score: partial.score, trend: partial };

 // 3. Word overlap — at least 2 content words in common
 var inputWords = tl.split(/\s+/).filter(function(w) { return w.length > 3; });
 if (inputWords.length >= 2) {
 var best = null, bestOverlap = 0;
 _allTrends.forEach(function(t) {
 var tWords = t.topic.toLowerCase().split(/\s+/);
 var overlap = inputWords.filter(function(w) { return tWords.includes(w); }).length;
 if (overlap >= 2 && overlap > bestOverlap) { best = t; bestOverlap = overlap; }
 });
 if (best) return { score: best.score, trend: best };
 }

 // 4. No match — return neutral score (honest: we don't know)
 return { score: 6.0, trend: null };
}

async function generateIdea() {
 if (!checkAccess()) return;
 await fullGenerate();
}

async function fullGenerate() {
 if (!checkAccess()) return;
 if (!(await checkCarouselAccess())) return;
 var topic = document.getElementById('genTopic').value.trim();
 if (!topic) { toast(' Enter a topic first'); return; }
 var platform = document.getElementById('genPlatform').value;
 var niche = document.getElementById('genNiche').value.trim();
 var btn = document.getElementById('fullGenBtn');
 var loadEl = document.getElementById('genLoading');
 var errEl = document.getElementById('genError');

 btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating…';
 loadEl.classList.add('visible');
 errEl.classList.remove('visible');
 document.getElementById('genLoadingMsg').textContent = 'Dijo is building your content package for "' + topic + '"…';

 // Look up real trend score — falls back to 6.0 (neutral) if topic not in current trends
 var lookup = lookupTrendScore(topic);
 var score = lookup.score;
 var trend = lookup.trend; // the matched trend object, or null if no match
 var scoreIsReal = !!trend; // true = backed by live ingested data

 updateHint(score);
 var scColor = score >= 9 ? 'var(--green)' : score >= 8 ? 'var(--gold)' : score >= 7 ? 'var(--blue2)' : 'var(--text2)';
 var verdict = score >= 9 ? ' Exceptional'
 : score >= 8 ? ' Strong opportunity'
 : score >= 7 ? ' Good momentum'
 : scoreIsReal ? ' Emerging' : ' Not in current trends';

 document.getElementById('previewScore').textContent = score.toFixed(1);
 document.getElementById('previewScore').style.color = scColor;
 document.getElementById('previewVerdict').textContent = verdict;
 document.getElementById('previewVerdict').style.color = scColor;

 // Show a small "score source" footnote so user knows if it's real or neutral
 var scoreNote = document.getElementById('previewScoreNote');
 if (scoreNote) {
 scoreNote.textContent = scoreIsReal
 ? ' Live score — matched "' + trend.topic + '" (' + trend.platLabel + ')'
 : ' No trend match — score is neutral (6.0)';
 scoreNote.style.color = scoreIsReal ? 'var(--text3)' : 'rgba(var(--text3-rgb, 120,120,120),.7)';
 }

 ['outHook', 'outCaption', 'outOutline'].forEach(function(id) {
 var el = document.getElementById(id);
 el.classList.remove('ob-placeholder'); el.textContent = 'Generating…';
 });
 document.getElementById('outHashtags').innerHTML = '<span style="color:var(--text3);font-style:italic;font-size:12px">Generating…</span>';

 try {
 var nicheCtx = niche ? '\nNiche: ' + niche + '.' : '';

 // Use the trend already found by lookupTrendScore above — no second lookup needed.
 // If it matched a related topic (not exact), note that in context so Dijo is accurate.
 var trendExtra = '';
 if (trend) {
 var matchNote = trend.topic.toLowerCase() !== topic.toLowerCase()
 ? ' (matched related trend: "' + trend.topic + '")'
 : '';
 trendExtra = '\n\nReal live trend data' + matchNote + ':'
 + '\n- Platform: ' + trend.platLabel
 + (trend.dataSource ? ' · Source: ' + _dataSourceLabel(trend) : '')
 + '\n- Trend score: ' + trend.score + '/10 (live ingested)'
 + '\n- Views: ' + fmtN(trend.totalViews)
 + '\n- Video count: ' + trend.videoCount
 + '\n- Status: ' + (trend.status || 'rising')
 + (trend.hashtags && trend.hashtags.length ? '\n- Trending hashtags: ' + trend.hashtags.join(', ') : '');
 } else {
 trendExtra = '\n\nTrend data: Topic not found in current trend database — write evergreen content.';
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
 el.onclick = function() { navigator.clipboard.writeText(tag).then(function() { toast(' ' + tag + ' copied!'); }); };
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
 toast(' Package generated!');
 } catch(e) {
 errEl.classList.add('visible');
 errEl.textContent = ' ' + (e.message || 'Request failed');
 toast(' Dijo unavailable — try again');
 }

 loadEl.classList.remove('visible');
 btn.disabled = false; btn.innerHTML = ' Generate Full Package';
}

/* 
 AUDIENCE
 */
async function loadAudience() {
 var audTopicEl = document.getElementById('audTopic');
 var topic = audTopicEl ? audTopicEl.value.trim() : '';
 if (!topic) { toast(' Enter a topic'); return; }
 var btn = document.getElementById('audBtn');
 if (btn) { btn.disabled = true; btn.textContent = 'Analysing…'; }
 document.getElementById('audOutput').innerHTML = '<div style="text-align:center;padding:28px;color:var(--text3)"><span class="spinner spinner-gold"></span> Analysing…</div>';
 try {
 var prompt = 'Audience breakdown for topic: "' + topic + '"\n\nProvide:\n1. Age groups with % (e.g. 18-24: 35%)\n2. Gender split\n3. Top 5 interests\n4. Platform affinity: YouTube %, TikTok %, Instagram %, Google %\n5. Best hook angle\n\nBe specific and data-informed.';
 var reply = await callDijo(prompt, 'creator');
 var ages = extractAges(reply) || [{ label: '18–24', pct: 30 }, { label: '25–34', pct: 40 }, { label: '35–44', pct: 20 }, { label: '45+', pct: 10 }];
 var pa = extractPA(reply) || { YouTube: 72, TikTok: 65, Instagram: 58, Google: 78 };
 var html = '<div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;margin-bottom:14px">'
 + '<h3 style="font-size:15px;font-weight:800;margin-bottom:8px"> ' + escH(topic) + ' — Audience</h3>'
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
 toast(' Analysis done!');
 } catch(e) {
 document.getElementById('audOutput').innerHTML = '<div style="padding:20px;color:var(--text3)">Dijo unavailable — try again.</div>';
 toast(' Error — try again');
 }
 if (btn) { btn.disabled = false; btn.textContent = 'Analyse'; }
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

/* 
 YOUTUBE
 */
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
 + (thumb ? '<img src="' + thumb + '" style="width:100%;height:110px;object-fit:cover" alt=""/>' : '<div style="width:100%;height:110px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:28px"></div>')
 + '<div style="padding:10px"><div style="font-size:12px;font-weight:600;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escH(sn.title || 'Untitled') + '</div>'
 + '<div style="font-family:\'DM Mono\',monospace;font-size:10px;color:var(--text3)"> ' + fmtN(st.viewCount) + ' · ' + fmtN(st.likeCount) + ' · ' + fmtN(st.commentCount) + '</div></div></div>';
 }).join('') + '</div>';
 // Also attempt to load 28-day analytics now that we have a token
 loadYtAnalytics(token);
 } catch(e) {
 el.innerHTML = '<div style="padding:20px;color:var(--text3)">Could not load videos.</div>';
 }
}

/* YouTube Analytics (28-day) 
 Calls /youtube/analytics. If the token was granted without the
 yt-analytics.readonly scope (old connection), shows a one-click
 reconnect prompt instead of silently showing nothing.
 */
async function loadYtAnalytics(token) {
 var el = document.getElementById('ytAnalyticsArea'); // optional element — safe no-op if absent
 try {
 var res = await fetch(DIJO + '/youtube/analytics', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ access_token: token })
 });
 var data = await res.json();

 // Scope missing — token was issued before analytics permission was added
 if (res.status === 403 && data.error === 'scope_missing') {
 console.warn('[YouTube Analytics] Missing yt-analytics.readonly scope — showing reconnect prompt');
 // Show reconnect banner in the YouTube panel if the element exists
 var banner = document.getElementById('ytScopeBanner');
 if (!banner) {
 banner = document.createElement('div');
 banner.id = 'ytScopeBanner';
 banner.style.cssText = 'margin:12px 0;padding:12px 16px;background:rgba(201,126,8,.1);border:1px solid rgba(201,126,8,.35);border-radius:10px;font-size:13px;color:var(--text2);display:flex;align-items:center;gap:12px;flex-wrap:wrap';
 banner.innerHTML = '<span> <strong>Analytics upgrade needed.</strong> Reconnect to unlock 28-day views, watch time &amp; subscriber data.</span>'
 + '<button onclick="reconnectYouTubeWithAnalytics()" style="padding:7px 14px;border-radius:8px;background:linear-gradient(135deg,var(--gold),var(--gold2));color:#07090f;font-size:12px;font-weight:800;border:none;cursor:pointer;white-space:nowrap">Reconnect →</button>';
 var ytConnected = document.getElementById('ytConnected');
 if (ytConnected) ytConnected.insertBefore(banner, ytConnected.firstChild);
 }
 return;
 }

 if (!res.ok || data.error) {
 console.warn('[YouTube Analytics] Error:', data.error || res.status);
 return;
 }

 // Render into #ytAnalyticsArea if it exists
 if (el && data.rows && data.rows.length) {
 var totalViews = data.rows.reduce(function(s, r) { return s + (r[1] || 0); }, 0);
 var totalMins = data.rows.reduce(function(s, r) { return s + (r[2] || 0); }, 0);
 var totalSubs = data.rows.reduce(function(s, r) { return s + (r[4] || 0) - (r[5] || 0); }, 0);
 el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px">'
 + _ytStatCard(' Views (28d)', fmtN(totalViews))
 + _ytStatCard(' Watch time', Math.round(totalMins / 60).toLocaleString() + 'h')
 + _ytStatCard(' Net subs', (totalSubs >= 0 ? '+' : '') + fmtN(totalSubs))
 + '</div>';
 }
 } catch(e) {
 console.warn('[YouTube Analytics] Fetch failed:', e.message);
 }
}

function _ytStatCard(label, value) {
 return '<div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">'
 + '<div style="font-family:\'Syne\',sans-serif;font-size:18px;font-weight:900;color:var(--text)">' + value + '</div>'
 + '<div style="font-family:\'DM Mono\',monospace;font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.08em;margin-top:4px">' + label + '</div>'
 + '</div>';
}

/* Reconnect flow — fetches the server-built OAuth URL (which includes both
 youtube.readonly AND yt-analytics.readonly) then redirects the user. */
async function reconnectYouTubeWithAnalytics() {
 try {
 var res = await fetch(DIJO + '/youtube/auth-url');
 var data = await res.json();
 if (data.url) {
 window.location.href = data.url;
 } else {
 toast(' Could not generate reconnect link — contact support');
 }
 } catch(e) {
 toast(' Reconnect failed — try again');
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
 toast(' YouTube disconnected');
}

/* 
 TIKTOK
 */
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
 return '<div class="video-card"><div class="video-thumb">' + (v.cover_image_url ? '<img src="' + escH(v.cover_image_url) + '" alt=""/>' : '') + '</div>'
 + '<div class="video-info"><div class="video-title">' + escH(v.title || v.video_description || 'Untitled') + '</div>'
 + '<div class="video-stats"> ' + fmtN(v.view_count) + ' · ' + fmtN(v.like_count) + ' · ' + fmtN(v.comment_count) + '</div></div></div>';
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
 toast(' TikTok disconnected — connect a new account');
}

/* 
 EVALUATOR
 */
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
 verdict: total >= 80 ? ' Top Tier' : total >= 65 ? ' Established' : total >= 50 ? ' Growing' : total >= 35 ? ' Early Stage' : ' Just Starting',
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
 toast(' Evaluation complete!');
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
 toast(' TikTok evaluation complete!');
 } else {
 document.getElementById('evalLoading').style.display = 'none';
 document.getElementById('evalNoAccount').style.display = 'block';
 toast(' Connect YouTube or TikTok first');
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

/* 
 COPY HELPERS
 */
function copyEl(id) {
 var el = document.getElementById(id); if (!el) return;
 navigator.clipboard.writeText(el.innerText || el.textContent).then(function() { toast(' Copied!'); }).catch(function() {});
}
function copyTags(id) {
 var el = document.getElementById(id); if (!el) return;
 var text = Array.from(el.querySelectorAll('.ob-tag')).map(function(s) { return s.textContent; }).join(' ');
 navigator.clipboard.writeText(text).then(function() { toast(' Hashtags copied!'); }).catch(function() {});
}

/* 
 TOAST
 */
function toast(msg) {
 var shelf = document.getElementById('toastShelf');
 var el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
 shelf.appendChild(el);
 setTimeout(function() { el.remove(); }, 3400);
}

/* 
 KEYBOARD SHORTCUTS
 */
document.addEventListener('keydown', function(e) {
});

/* 
 TAB NAVIGATION — data-tab event listeners
 NOTE: creator-studio.js loads with defer, so
 DOMContentLoaded may have already fired — the
 wrapper below handles both cases safely.
 */
(function() {
 function attachTabListeners() {
 document.querySelectorAll('[data-tab]').forEach(function(btn) {
 btn.addEventListener('click', function() {
 switchTab(this.dataset.tab, this);
 });
 });
 }
 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', attachTabListeners);
 } else {
 attachTabListeners(); // DOM already ready — run immediately
 }
})();



/* 
 CONTENT CALENDAR
 Rendering is fully owned by calendar.js.
 loadCalendar() is a no-op shim so any legacy
 call sites don't throw — calendar.js handles
 the real work after it initialises.
 */
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

/* 
 SKELETON SCREENS
 Renders instant placeholder UI into the three
 above-the-fold sections (Briefing, Top Trends,
 Top Opportunities) so users see structured
 content immediately on load — before any network
 request completes. Real data replaces these
 automatically when the normal render functions
 (renderDashTrends, renderOpportunities,
 loadBriefing) run and overwrite innerHTML.
 */
(function injectSkeletonStyles() {
 if (document.getElementById('_skeletonStyles')) return;
 var s = document.createElement('style');
 s.id = '_skeletonStyles';
 s.textContent = [
 '@keyframes skShimmer {',
 ' 0% { background-position: -400px 0; }',
 ' 100% { background-position: 400px 0; }',
 '}',
 '.sk {',
 ' background: linear-gradient(90deg, var(--bg2,#1a1d26) 25%, var(--bg3,#22263a) 50%, var(--bg2,#1a1d26) 75%);',
 ' background-size: 800px 100%;',
 ' animation: skShimmer 1.4s ease-in-out infinite;',
 ' border-radius: 6px;',
 '}',
 '[data-theme="light"] .sk {',
 ' background: linear-gradient(90deg, #e8eaf0 25%, #f4f5f8 50%, #e8eaf0 75%);',
 ' background-size: 800px 100%;',
 ' animation: skShimmer 1.4s ease-in-out infinite;',
 '}',
 '.sk-line { height:12px; margin-bottom:8px; border-radius:4px; }',
 '.sk-title { height:18px; width:60%; margin-bottom:10px; border-radius:4px; }',
 '.sk-badge { height:10px; width:40%; border-radius:10px; margin-bottom:6px; }',
 '.sk-trend-item { display:flex; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid var(--border,rgba(255,255,255,.06)); }',
 '.sk-rank { width:32px; height:32px; border-radius:8px; flex-shrink:0; }',
 '.sk-info { flex:1; }',
 '.sk-bar { height:4px; border-radius:99px; margin-top:8px; }',
 '.sk-pill { width:52px; height:20px; border-radius:10px; flex-shrink:0; }',
 '.sk-opp-card { background:var(--card,#12151f); border:1px solid var(--border,rgba(255,255,255,.07)); border-radius:12px; padding:14px; margin-bottom:10px; }'
 ].join("\n");
 document.head.appendChild(s);
})();

function renderSkeletons() {
 // 1. Top Trends list
 var trendsEl = document.getElementById('dashTrendList');
 if (trendsEl && !trendsEl.dataset.realData) {
 var trendSkel = '';
 var tColors = ['#ff6464','#FFD700','#78b4ff'];
 var tWidths = [[70,45,80],[55,38,60],[65,50,72]];
 tWidths.forEach(function(w, i) {
 trendSkel +=
 '<div class="sk-trend-item">'
 + '<div class="sk sk-rank"></div>'
 + '<div class="sk-info">'
 + '<div class="sk sk-title" style="width:' + w[0] + '%"></div>'
 + '<div class="sk sk-badge" style="width:' + w[1] + '%"></div>'
 + '<div class="sk sk-bar" style="width:' + w[2] + '%;background:' + tColors[i] + '30"></div>'
 + '</div>'
 + '<div class="sk sk-pill"></div>'
 + '</div>';
 });
 trendsEl.innerHTML = trendSkel;
 }

 // 2. Top Opportunities removed — replaced by Creator Chat widget

 // 3. Dijo Briefing
 var briefEl = document.getElementById('briefingText');
 if (briefEl && !briefEl.dataset.realData) {
 briefEl.innerHTML =
 '<div class="sk sk-badge" style="width:55%;margin-bottom:10px"></div>'
 + '<div class="sk sk-title" style="width:80%;height:20px;margin-bottom:10px"></div>'
 + '<div class="sk sk-line" style="width:95%"></div>'
 + '<div class="sk sk-line" style="width:80%"></div>'
 + '<div class="sk sk-line" style="width:60%"></div>';
 }
}

// Track page load start for GA timing
window._pageLoadStart = Date.now();

/* 
 INIT
 */
window.addEventListener('load', async function() {
 // Auth is handled by auth.js → initAuth() → loadUser().
 // nav.js runs its own checkAuth() for the nav bar.
 // Do NOT call checkAuth() here — it was a duplicate that raced both of them.
 renderSkeletons(); // show instant skeleton UI before any network requests
 initYouTube();
 initTikTok();
 loadCalendar();
 loadPlatformStatus();
 // Detect country first so fetchTrends() has geo ready — detectUserCountry()
 // is fast (cached after first call) and shows a "Detecting…" status in the UI.
 await detectUserCountry();
 await fetchTrends();
 // GA: track time-to-content so we can measure skeleton improvement
 if (typeof gtag === 'function') {
 gtag('event', 'trends_loaded', {
 ms_to_load: Date.now() - (window._pageLoadStart || Date.now()),
 country: _userCountryName || 'unknown'
 });
 }
 renderDashTrends();
 renderRadarGauges();
 renderDijoTopPick();
 loadBriefing();
 // Wake Render immediately on load — prevents cold-start spinners
 fetch(DIJO + '/ping').catch(function() {});
 setInterval(function() { fetch(DIJO + '/ping').catch(function() {}); }, 600000);

 // Auto-refresh trends every 60 seconds
 // fetchTrends() → renderAll() already updates everything on success.
 // renderRadarGauges + renderDijoTopPick are included so gauges and
 // the winner box don't go stale between full page loads.
 setInterval(async function() {
 try {
 var scrollY = window.scrollY;
 await fetchTrends(); // calls renderAll() internally on success
 window.scrollTo(0, scrollY);
 } catch(e) {
 console.warn('[Trends] Auto-refresh failed:', e.message);
 }
 }, 5 * 60 * 1000); // 5 min — ingestion runs every 30 min, no need to poll faster
});

/* ═══════════════════════════════════════════════
   APP SIDEBAR — mobile slide-in
═══════════════════════════════════════════════ */
function openAppSidebar() {
  document.getElementById('appSidebar').classList.add('open');
  document.getElementById('appSidebarOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAppSidebar() {
  document.getElementById('appSidebar').classList.remove('open');
  document.getElementById('appSidebarOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// Hijack hamburger — opens app sidebar on this page instead of nav.js sidebar
window.addEventListener('load', function() {
  var hamburger = document.getElementById('hamburger');
  if (hamburger) {
    var newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    newHamburger.addEventListener('click', function(e) {
      e.stopPropagation();
      openAppSidebar();
    });
  }
});

// Close when a sidebar tab item is tapped on mobile
document.addEventListener('click', function(e) {
  var item = e.target.closest('.sb-item[data-tab]');
  if (item && window.innerWidth <= 1000) closeAppSidebar();
});

// Close on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeAppSidebar();
});
