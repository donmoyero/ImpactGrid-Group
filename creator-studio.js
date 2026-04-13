/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — creator-studio.js
   Fixed: real Dijo server calls, live trend data
═══════════════════════════════════════════════ */

var DIJO = 'https://impactgrid-dijo.onrender.com';

/* ── THEME ── */
var isDark = false;
function applyTheme(dark) {
  isDark = dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  var ico = dark ? '☀️' : '🌙';
  var tbt = document.getElementById('topThemeBtn'); if (tbt) tbt.textContent = ico;
  var sbt = document.getElementById('sbThemeBtn');
  if (sbt) sbt.innerHTML = '<span>' + (dark ? '☀️' : '🌙') + '</span><span>' + (dark ? 'Light Mode' : 'Dark Mode') + '</span>';
  var tt = document.getElementById('themeToggle'); if (tt) tt.classList.toggle('on', dark);
  try { localStorage.setItem('ig_theme', dark ? 'dark' : 'light'); } catch(e) {}
}
function toggleTheme() { applyTheme(!isDark); }
(function() { try { if (localStorage.getItem('ig_theme') === 'dark') applyTheme(true); } catch(e) {} })();

/* ── PANELS ── */
function showPanel(name, item) {
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.sb-item').forEach(function(i) { i.classList.remove('active'); });
  var panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
  if (item) item.classList.add('active');
  var titles = {
    dashboard: 'Dashboard', trendfeed: 'Trend Feed', create: 'Create',
    contentcalendar: 'Content Calendar', portfolio: 'Portfolio',
    dijo: 'Dijo AI', opportunities: 'Opportunities',
    connect: 'Connect Platforms', settings: 'Settings'
  };
  var t = document.getElementById('topbarTitle'); if (t) t.textContent = titles[name] || name;
  closeSidebar();
  var ca = document.getElementById('contentArea'); if (ca) ca.scrollTop = 0;

  /* FIX 1: Reload dashboard data every time you switch back to it */
  if (name === 'dashboard') loadDashboardData();

  /* FIX 2: Trend feed — render with the correct element ID (#trendFeedList) */
  if (name === 'trendfeed') {
    if (_allTrends.length) {
      renderFullTrendFeed();
    } else {
      fetchLiveTrends().then(function() { renderFullTrendFeed(); });
    }
  }
}

/* ── SIDEBAR MOBILE ── */
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('mobOverlay').classList.add('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobOverlay').classList.remove('open');
}

/* ── USER DROP ── */
function toggleSbDrop() { document.getElementById('sbDrop').classList.toggle('open'); }
document.addEventListener('click', function(e) {
  var d = document.getElementById('sbDrop');
  if (d && !e.target.closest('.sb-user')) d.classList.remove('open');
});

/* ── AUTH ── */
function setUser(user) {
  if (!user) return;
  var email = user.email || '';
  var name = (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || email.split('@')[0] || 'Creator';
  var init = (name.charAt(0) || '?').toUpperCase();
  var gw = document.getElementById('sbGuestWrap'); if (gw) gw.style.display = 'none';
  var uw = document.getElementById('sbUserWrap'); if (uw) uw.style.display = 'block';
  var av = document.getElementById('sbAv'); if (av) av.textContent = init;
  var sn = document.getElementById('sbName'); if (sn) sn.textContent = name.split(' ')[0];
  var se = document.getElementById('sbEmail'); if (se) se.textContent = email;
  var se2 = document.getElementById('settingsEmail'); if (se2) se2.textContent = email;
  var hour = new Date().getHours();
  var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var g = document.getElementById('dashGreeting'); if (g) g.textContent = greet + ', ' + name.split(' ')[0] + ' 👋';
  var pfNameEl = document.getElementById('pfName');
  if (pfNameEl && !pfNameEl.value) { pfNameEl.value = name; if (window.updatePreview) updatePreview(); }
  var slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  var urlEl = document.getElementById('pfUrl'); if (urlEl) urlEl.textContent = 'impactgrid.app/p/' + slug;
  if (window.updateSEOPreview) updateSEOPreview(name, '', slug);
}
function clearUser() {
  var gw = document.getElementById('sbGuestWrap'); if (gw) gw.style.display = 'block';
  var uw = document.getElementById('sbUserWrap'); if (uw) uw.style.display = 'none';
}
window.igOut = async function() {
  try { var c = getSupabase(); if (c) await c.auth.signOut(); } catch(e) {}
  window.location.href = 'index.html';
};
function attachAuth(c) {
  c.auth.onAuthStateChange(function(ev, session) {
    if (session && session.user) setUser(session.user);
    else if (ev === 'SIGNED_OUT' || ev === 'USER_DELETED') clearUser();
  });
  c.auth.getSession().then(function(r) {
    if (r && r.data && r.data.session && r.data.session.user) setUser(r.data.session.user);
  }).catch(function() {});
}
function checkAuth() {
  var c = null;
  try { if (window.getSupabase) c = getSupabase(); } catch(e) {}
  if (c) { attachAuth(c); return; }
  var tries = 0;
  var t = setInterval(function() {
    tries++;
    try { if (window.getSupabase) c = getSupabase(); } catch(e) {}
    if (c) { clearInterval(t); attachAuth(c); }
    else if (tries >= 30) clearInterval(t);
  }, 100);
}

/* ── CORE DIJO API CALL ── */
async function callDijo(message, mode) {
  var res = await fetch(DIJO + '/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message, mode: mode || 'creator' })
  });
  if (!res.ok) {
    var e = await res.json().catch(function() { return {}; });
    throw new Error(e.error || 'Dijo error ' + res.status);
  }
  var data = await res.json();
  return data.reply || '';
}

/* ── TREND DATA ── */
var _allTrends = [];

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function fmtNum(n) {
  return n ? Number(n).toLocaleString() : '—';
}
function platLabel(src) {
  return src === 'youtube' ? 'YouTube' : src === 'tiktok' ? 'TikTok' : src === 'cross' ? 'Cross' : 'Google';
}
function platCls(src) {
  return src === 'youtube' || src === 'yt' ? 'plat-yt' : src === 'tiktok' || src === 'tt' ? 'plat-tt' : 'plat-gt';
}
function toDisplayScore(s) {
  return Math.min(9.9, parseFloat((s / 10).toFixed(1)));
}

async function fetchLiveTrends() {
  try {
    var res = await fetch(DIJO + '/trends/live?limit=20');
    var data = await res.json();
    var live = data.trends || [];
    if (live.length) {
      _allTrends = live.map(function(t, i) {
        return {
          topic: t.topic,
          score: toDisplayScore(t.trend_score),
          fullScore: t.trend_score,
          plat: t.platform_source === 'youtube' ? 'yt' : t.platform_source === 'tiktok' ? 'tt' : t.platform_source === 'cross' ? 'cross' : 'gt',
          platLabel: platLabel(t.platform_source),
          rank: i + 1,
          hashtags: t.hashtags || [],
          videoCount: t.video_count || 0,
          totalViews: t.total_views || 0,
          status: t.status || 'rising',
          igPrediction: t.instagram_prediction || 0
        };
      });
      return _allTrends;
    }
    /* Fallback to Google RSS */
    var rss = await fetch(DIJO + '/trends/google?geo=GB');
    var rssData = await rss.json();
    _allTrends = (rssData.trends || []).slice(0, 20).map(function(topic, i) {
      return { topic: topic, score: 5.5, plat: 'gt', platLabel: 'Google', rank: i + 1, hashtags: [], videoCount: 0, totalViews: 0, status: 'rising', igPrediction: 0 };
    });
    return _allTrends;
  } catch(e) {
    return [];
  }
}

function renderTrendCard(t, isTop) {
  var pct = Math.round((t.score / 10) * 100);
  var cls = platCls(t.plat);
  var meta = t.videoCount > 0
    ? t.videoCount + ' videos · ' + fmtNum(t.totalViews) + ' views · ' + t.platLabel
    : t.platLabel + ' · Trend Score™ · click to generate';
  return '<div class="trend-card' + (isTop ? ' top' : '') + '" onclick="loadTopic(\'' + esc(t.topic) + '\')">'
    + '<span class="t-rank">#' + t.rank + '</span>'
    + '<div class="t-info"><div class="t-name">' + escHtml(t.topic) + '</div><div class="t-meta">' + escHtml(meta) + '</div></div>'
    + '<div class="t-right">'
    + '<span class="t-score' + (t.score < 7 ? ' mid' : '') + '">' + t.score.toFixed(1) + '</span>'
    + '<span class="t-plat">' + escHtml(t.platLabel) + '</span>'
    + '<button class="t-gen">Generate →</button>'
    + '</div></div>';
}

/* FIX 3: Dashboard trend preview — renders into #trendFeedList (the dashboard's preview list) */
function renderDashTrends() {
  var el = document.getElementById('trendFeedList');
  if (!el) return;
  if (!_allTrends.length) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:13px;">Loading live trends…</div>';
    return;
  }
  el.innerHTML = _allTrends.slice(0, 6).map(function(t, i) {
    return renderTrendCard(t, i < 2);
  }).join('');
}

/* FIX 2: Full trend feed — was targeting #fullTrendFeedList which doesn't exist.
   The Trend Feed panel in creator-studio.html uses #trendFeedList — same ID as dashboard.
   So we need to check which panel is active and render accordingly. */
function renderFullTrendFeed() {
  /* When on the trendfeed panel, #trendFeedList is inside panel-trendfeed (visible),
     so we just render all trends into it */
  var el = document.getElementById('trendFeedList');
  if (!el) return;
  if (!_allTrends.length) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:13px;">Loading live trends…</div>';
    return;
  }
  /* If we're on the dashboard, only show 6. If on trendfeed panel, show all. */
  var dashPanel = document.getElementById('panel-dashboard');
  var isDashActive = dashPanel && dashPanel.classList.contains('active');
  var list = isDashActive ? _allTrends.slice(0, 6) : _allTrends;
  el.innerHTML = list.map(function(t, i) {
    return renderTrendCard(t, i < (isDashActive ? 2 : 3));
  }).join('');
}

function renderDashOpps() {
  var el = document.getElementById('dashOpps');
  if (!el || !_allTrends.length) return;
  el.innerHTML = _allTrends.slice(0, 2).map(function(t) {
    var icons = { yt: '▶️', tt: '🎵', gt: '📈', cross: '✕' };
    return '<div class="opp-card" onclick="loadTopic(\'' + esc(t.topic) + '\')">'
      + '<span class="opp-icon">' + (icons[t.plat] || '📡') + '</span>'
      + '<div><div class="opp-name">' + escHtml(t.topic) + '</div>'
      + '<div class="opp-meta">' + escHtml(t.platLabel) + ' · ' + t.status + (t.videoCount ? ' · ' + t.videoCount + ' videos' : '') + '</div></div>'
      + '<div class="opp-score"><div class="opp-score-n">' + t.score.toFixed(1) + '</div><div class="opp-score-l">Score</div></div>'
      + '</div>';
  }).join('');
}

/* FIX 4: Dashboard stat IDs — HTML uses dashStatScore/dashStatScoreSub/dashStatCount/dashStatPlatform */
function renderDashStats() {
  if (!_allTrends.length) return;
  var top = _allTrends[0];

  /* These match the actual IDs in creator-studio.html */
  var scoreEl   = document.getElementById('dashStatScore');
  var scoreSubEl= document.getElementById('dashStatScoreSub');
  var countEl   = document.getElementById('dashStatCount');
  var platEl    = document.getElementById('dashStatPlatform');

  if (scoreEl)    { scoreEl.textContent = top.score.toFixed(1); scoreEl.style.color = 'var(--green)'; }
  if (scoreSubEl) scoreSubEl.textContent = top.topic + ' · ' + top.platLabel;
  if (countEl)    countEl.textContent = _allTrends.length;
  if (platEl)     platEl.textContent = top.platLabel;
}

/* ── DAILY BRIEFING ── */
async function loadDailyBriefing() {
  var el = document.getElementById('briefingText');
  var scoresEl = document.getElementById('briefingScores');
  var dateEl = document.getElementById('briefingDate');
  if (!el) return;
  try {
    var res = await fetch(DIJO + '/ai/daily-briefing');
    var data = await res.json();
    if (data.briefing) {
      el.textContent = data.briefing;
      if (dateEl && data.date) dateEl.textContent = data.date + (data.cached ? ' · cached' : ' · live');
      if (scoresEl && data.top_trends && data.top_trends.length) {
        scoresEl.innerHTML = data.top_trends.map(function(t) {
          return '<div class="b-score"><span class="b-score-n">' + (t.score / 10).toFixed(1) + '</span><span>' + escHtml(t.topic) + '</span></div>';
        }).join('');
      }
    }
  } catch(e) {
    if (el) el.textContent = 'Dijo briefing unavailable — trend data loading in background.';
  }
}

/* ── LOAD DASHBOARD DATA — called every time dashboard panel is shown ── */
async function loadDashboardData() {
  var trends = await fetchLiveTrends();
  renderDashTrends();
  renderDashOpps();
  renderDashStats();
  await loadDailyBriefing();
}

/* ── LOAD TREND FEED — called when Trend Feed panel is shown ── */
async function loadTrendFeed() {
  var el = document.getElementById('trendFeedList');
  if (el) el.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:13px;">Loading live trends…</div>';
  await fetchLiveTrends();
  renderFullTrendFeed();
}

/* ── DASHBOARD DATE & GREETING ── */
function setDashDate() {
  var d = new Date();
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var str = days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  var el = document.getElementById('dashDate'); if (el) el.textContent = str + ' · Live data';
  var bd = document.getElementById('briefingDate'); if (bd) bd.textContent = str;
  var hour = d.getHours();
  var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var g = document.getElementById('dashGreeting'); if (g) g.textContent = greet + ', Creator 👋';
}

function loadTopic(topic) {
  var input = document.getElementById('createTopic'); if (input) input.value = topic;
  var dijoInput = document.getElementById('genTopic'); if (dijoInput) dijoInput.value = topic;
  showPanel('create', null);
  document.querySelectorAll('.sb-item').forEach(function(i) {
    if (i.textContent.indexOf('Create') !== -1) i.classList.add('active');
  });
  showToast('💡 Topic loaded — hit Generate!');
}

/* ── GENERATE CONTENT — uses real Dijo server ── */
async function generateContent() {
  var topic = document.getElementById('createTopic').value.trim();
  if (!topic) { showToast('⚠️ Please enter a topic first.'); return; }
  var btn = document.getElementById('generateBtn');
  var out = document.getElementById('createOutput');
  btn.disabled = true; btn.textContent = 'Generating…';
  out.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:20px 0;">'
    + '<div class="spinner"></div>'
    + '<span style="font-size:13px;color:var(--text2);">Dijo is writing your content…</span></div>';

  try {
    var platform = document.getElementById('createPlatform').value;
    var type = document.getElementById('createType').value;
    var tone = document.getElementById('createTone').value;

    var trendTags = [];
    if (_allTrends.length) {
      var matched = _allTrends.filter(function(t) {
        return t.topic.toLowerCase().split(' ').some(function(w) {
          return topic.toLowerCase().includes(w) || w.length > 4 && topic.toLowerCase().includes(w.slice(0, 4));
        });
      });
      matched.slice(0, 3).forEach(function(t) {
        (t.hashtags || []).forEach(function(h) { if (trendTags.indexOf(h) === -1) trendTags.push(h); });
      });
    }
    var trendCtx = trendTags.length ? '\nCurrently trending hashtags to include: ' + trendTags.slice(0, 6).join(', ') : '';

    var prompt = 'Generate a complete content package.\n\nTopic: ' + topic
      + '\nPlatform: ' + platform
      + '\nContent type: ' + type
      + '\nTone: ' + tone
      + trendCtx
      + '\n\nRespond ONLY with valid JSON, no markdown:\n{"hook":"","caption":"","hashtags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8"],"post_time":"","tip":""}';

    var reply = await callDijo(prompt, 'creator');

    var clean = reply.replace(/```json/g, '').replace(/```/g, '').trim();
    var start = clean.indexOf('{'); var end = clean.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in response');
    var parsed = JSON.parse(clean.slice(start, end + 1));

    out.innerHTML =
      '<div class="output-card">'
      + '<div class="output-label">Hook</div>'
      + '<div class="output-text" id="outHook">' + esc(parsed.hook || '') + '</div>'
      + '<button class="output-copy" onclick="copyText(document.getElementById(\'outHook\').textContent)">Copy Hook</button>'
      + '</div>'
      + '<div class="output-card">'
      + '<div class="output-label">Caption</div>'
      + '<div class="output-text" id="outCaption">' + esc(parsed.caption || '').replace(/\n/g, '<br>') + '</div>'
      + '<button class="output-copy" onclick="copyText(document.getElementById(\'outCaption\').innerText)">Copy Caption</button>'
      + '</div>'
      + '<div class="output-card">'
      + '<div class="output-label">Hashtags</div>'
      + '<div class="output-tags">'
      + (parsed.hashtags || []).map(function(h) {
          return '<span class="output-tag">' + esc(h.startsWith('#') ? h : '#' + h.replace('#', '')) + '</span>';
        }).join('')
      + '</div>'
      + '</div>'
      + '<div class="output-card" style="display:flex;gap:14px;">'
      + '<div style="flex:1;"><div class="output-label">Best Post Time</div>'
      + '<div class="output-text" style="font-weight:700;color:var(--gold);">' + esc(parsed.post_time || '') + '</div></div>'
      + '<div style="flex:1;"><div class="output-label">Dijo\'s Tip</div>'
      + '<div class="output-text">' + esc(parsed.tip || '') + '</div></div>'
      + '</div>';

    showToast('✅ Content generated!');
  } catch(e) {
    out.innerHTML = '<div class="output-card" style="border-color:var(--red-dim);">'
      + '<div class="output-label" style="color:var(--red);">Error</div>'
      + '<div class="output-text" style="color:var(--text2);">Could not generate. Check connection and try again. (' + esc(e.message) + ')</div>'
      + '</div>';
    showToast('⚠️ Generation failed — try again');
  }
  btn.disabled = false; btn.textContent = '✨ Generate with Dijo';
}

/* ── DIJO CHAT — uses real Dijo server ── */
var _dijoHistory = [];

async function sendDijo() {
  var input = document.getElementById('dijoInput');
  var val = input.value.trim(); if (!val) return;
  var msgs = document.getElementById('dijoMsgs');

  msgs.innerHTML += '<div class="chat-msg user"><div class="chat-av-sm you">Y</div><div class="chat-bubble you">' + esc(val) + '</div></div>';
  input.value = '';
  msgs.scrollTop = msgs.scrollHeight;

  var typingId = 'typing-' + Date.now();
  msgs.innerHTML += '<div class="chat-msg" id="' + typingId + '"><div class="chat-av-sm dijo">D</div><div class="chat-bubble dijo" style="color:var(--text3);">Thinking…</div></div>';
  msgs.scrollTop = msgs.scrollHeight;

  var trendCtx = '';
  if (_allTrends.length) {
    trendCtx = 'Current top trends: ' + _allTrends.slice(0, 5).map(function(t) {
      return t.topic + ' (' + t.score.toFixed(1) + ')';
    }).join(', ') + '. ';
  }

  try {
    var reply = await callDijo(trendCtx + val, 'creator');
    var el = document.getElementById(typingId); if (el) el.remove();
    msgs.innerHTML += '<div class="chat-msg"><div class="chat-av-sm dijo">D</div><div class="chat-bubble dijo">'
      + esc(reply).replace(/\n/g, '<br>')
      + '</div></div>';
    msgs.scrollTop = msgs.scrollHeight;
    _dijoHistory.push({ role: 'user', content: val }, { role: 'assistant', content: reply });
  } catch(e) {
    var el2 = document.getElementById(typingId); if (el2) el2.remove();
    msgs.innerHTML += '<div class="chat-msg"><div class="chat-av-sm dijo">D</div><div class="chat-bubble dijo">Sorry — couldn\'t connect right now. Try again in a moment.</div></div>';
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function quickDijo(prompt) {
  document.getElementById('dijoInput').value = prompt;
  sendDijo();
}

/* ── REFRESH BRIEFING ── */
async function refreshBriefing() {
  var el = document.getElementById('briefingText');
  if (el) { el.style.opacity = '.4'; el.textContent = 'Refreshing…'; }
  await loadDailyBriefing();
  if (el) el.style.opacity = '1';
  showToast('🧠 Briefing refreshed!');
}

/* ── PLATFORM SESSION CHECKS ── */
function checkPlatformSessions() {
  try {
    if (typeof YouTubeAuth !== 'undefined') {
      var s = YouTubeAuth.getSession();
      if (s) {
        var card = document.getElementById('yt-card');
        var btn = document.getElementById('yt-btn-app');
        var stxt = document.getElementById('yt-status-txt');
        if (card) card.classList.add('connected');
        var name = (s.channel && s.channel.snippet && s.channel.snippet.title) ? s.channel.snippet.title : 'YouTube';
        if (stxt) stxt.textContent = 'Connected · ' + name;
        if (btn) {
          btn.className = 'cc-app-btn auto';
          btn.textContent = 'Open Trends →';
          btn.onclick = function() { showPanel('trendfeed', null); };
        }
      }
    }
  } catch(e) {}

  try {
    if (typeof TikTokAuth !== 'undefined') {
      var s2 = TikTokAuth.getSession();
      if (s2) {
        var card2 = document.getElementById('tt-card');
        var btn2 = document.getElementById('tt-btn-app');
        var stxt2 = document.getElementById('tt-status-txt');
        if (card2) card2.classList.add('connected');
        var profile = s2.profile || {};
        var name2 = profile.display_name || profile.username || 'TikTok';
        if (stxt2) stxt2.textContent = 'Connected · ' + name2;
        if (btn2) {
          btn2.className = 'cc-app-btn auto';
          btn2.textContent = 'Connected ✓';
        }
      }
    }
  } catch(e) {}
}

/* ── COPY ── */
function copyText(t) {
  navigator.clipboard.writeText(t).then(function() { showToast('📋 Copied!'); }).catch(function() {
    try { var el = document.createElement('textarea'); el.value = t; document.body.appendChild(el); el.select(); document.execCommand('copy'); el.remove(); showToast('📋 Copied!'); } catch(e) {}
  });
}

/* ── TOAST ── */
function showToast(msg) {
  var old = document.getElementById('igToast'); if (old) old.remove();
  var t = document.createElement('div');
  t.id = 'igToast';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:var(--text);color:var(--bg);padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:fadeIn .3s ease;pointer-events:none;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.remove(); }, 3200);
}

/* ── INIT ── */
window.addEventListener('load', function() {
  checkAuth();
  setDashDate();
  loadDashboardData();
  checkPlatformSessions();
  setInterval(function() { fetch(DIJO + '/ping').catch(function() {}); }, 600000);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function() {});
}
