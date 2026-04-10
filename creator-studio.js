/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — creator-studio.js
   Core: theme, panels, auth, dashboard, create, dijo, plan
═══════════════════════════════════════════════ */

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
  // Pre-fill portfolio name if empty
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

/* ── DASHBOARD ── */
function setDashDate() {
  var d = new Date();
  var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var str = days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  var el = document.getElementById('dashDate'); if (el) el.textContent = str + ' · Live data';
  var bd = document.getElementById('briefingDate'); if (bd) bd.textContent = str + ' · cached';
  var hour = d.getHours();
  var greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  var g = document.getElementById('dashGreeting'); if (g) g.textContent = greet + ', Creator 👋';
}

function loadTopic(topic) {
  var input = document.getElementById('createTopic'); if (input) input.value = topic;
  showPanel('create', document.querySelector('.sb-item[onclick*="create"]'));
}

/* ── GENERATE CONTENT ── */
async function generateContent() {
  var topic = document.getElementById('createTopic').value.trim();
  if (!topic) { alert('Please enter a topic first.'); return; }
  var btn = document.getElementById('generateBtn');
  var out = document.getElementById('createOutput');
  btn.disabled = true; btn.textContent = 'Generating…';
  out.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:20px;"><div class="spinner"></div><span style="font-size:13px;color:var(--text2);">Dijo is writing your content…</span></div>';
  try {
    var platform = document.getElementById('createPlatform').value;
    var type = document.getElementById('createType').value;
    var tone = document.getElementById('createTone').value;
    var prompt = 'You are Dijo, an AI creator assistant. Generate a complete content package.\n\nTopic: ' + topic + '\nPlatform: ' + platform + '\nContent type: ' + type + '\nTone: ' + tone + '\n\nRespond ONLY with JSON:\n{"hook":"","caption":"","hashtags":["tag1","tag2","tag3","tag4","tag5"],"post_time":"","tip":""}';
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    var data = await res.json();
    var text = data.content.map(function(i) { return i.text || ''; }).join('');
    var clean = text.replace(/```json|```/g, '').trim();
    var parsed = JSON.parse(clean);
    out.innerHTML =
      '<div class="output-card"><div class="output-label">Hook</div><div class="output-text">' + esc(parsed.hook||'') + '</div><button class="output-copy" onclick="copyText(this.previousElementSibling.textContent)">Copy Hook</button></div>' +
      '<div class="output-card"><div class="output-label">Caption</div><div class="output-text">' + esc(parsed.caption||'') + '</div><button class="output-copy" onclick="copyText(this.previousElementSibling.textContent)">Copy Caption</button></div>' +
      '<div class="output-card"><div class="output-label">Hashtags</div><div class="output-tags">' + (parsed.hashtags||[]).map(function(h){return '<span class="output-tag">#'+esc(h.replace('#',''))+'</span>';}).join('') + '</div></div>' +
      '<div class="output-card" style="display:flex;gap:14px;"><div style="flex:1;"><div class="output-label">Best Post Time</div><div class="output-text" style="font-weight:700;color:var(--gold);">'+esc(parsed.post_time||'')+'</div></div><div style="flex:1;"><div class="output-label">Dijo\'s Tip</div><div class="output-text">'+esc(parsed.tip||'')+'</div></div></div>';
  } catch(e) {
    out.innerHTML = '<div class="output-card" style="border-color:var(--red-dim);"><div class="output-label" style="color:var(--red);">Error</div><div class="output-text" style="color:var(--text2);">Could not generate. Check connection and try again.</div></div>';
  }
  btn.disabled = false; btn.textContent = '✨ Generate with Dijo';
}

/* ── DIJO CHAT ── */
async function sendDijo() {
  var input = document.getElementById('dijoInput');
  var val = input.value.trim(); if (!val) return;
  var msgs = document.getElementById('dijoMsgs');
  msgs.innerHTML += '<div class="chat-msg user"><div class="chat-av-sm you">Y</div><div class="chat-bubble you">' + esc(val) + '</div></div>';
  input.value = ''; msgs.scrollTop = msgs.scrollHeight;
  msgs.innerHTML += '<div class="chat-msg" id="dijotyping"><div class="chat-av-sm dijo">D</div><div class="chat-bubble dijo" style="color:var(--text3);">Thinking…</div></div>';
  msgs.scrollTop = msgs.scrollHeight;
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 1000,
        messages: [{ role: 'user', content: "You are Dijo, expert AI creator assistant for ImpactGrid. Give short, direct, actionable advice. Today's top trends: vikingtom (5.8), shorts (5.9), UK Street Style (5.5). User asks: " + val }]
      })
    });
    var data = await res.json();
    var reply = data.content.map(function(i){return i.text||'';}).join('');
    var typing = document.getElementById('dijotyping'); if (typing) typing.remove();
    msgs.innerHTML += '<div class="chat-msg"><div class="chat-av-sm dijo">D</div><div class="chat-bubble dijo">' + esc(reply) + '</div></div>';
    msgs.scrollTop = msgs.scrollHeight;
  } catch(e) {
    var typing2 = document.getElementById('dijotyping'); if (typing2) typing2.remove();
    msgs.innerHTML += '<div class="chat-msg"><div class="chat-av-sm dijo">D</div><div class="chat-bubble dijo">Sorry, could not connect right now. Try again in a moment.</div></div>';
    msgs.scrollTop = msgs.scrollHeight;
  }
}
function quickDijo(prompt) { document.getElementById('dijoInput').value = prompt; sendDijo(); }

/* ── REFRESH BRIEFING ── */
function refreshBriefing() {
  var el = document.getElementById('briefingText');
  if (el) { el.style.opacity = '.4'; setTimeout(function(){ el.style.opacity = '1'; }, 600); }
}

/* ── COPY / ESC ── */
function copyText(t) { try { navigator.clipboard.writeText(t); } catch(e) {} }
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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
        var name = (s.channel&&s.channel.snippet&&s.channel.snippet.title) ? s.channel.snippet.title : 'YouTube';
        if (stxt) stxt.textContent = 'Connected · ' + name;
        if (btn) { btn.className = 'cc-app-btn auto'; btn.textContent = 'Open Trends →'; btn.onclick = function(){ showPanel('trendfeed',null); }; }
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
        var name2 = (s2.user&&s2.user.display_name) ? s2.user.display_name : 'TikTok';
        if (stxt2) stxt2.textContent = 'Connected · ' + name2;
        if (btn2) { btn2.className = 'cc-app-btn auto'; btn2.textContent = 'Connected ✓'; }
      }
    }
  } catch(e) {}
}

/* ── TOAST ── */
function showToast(msg) {
  var old = document.getElementById('igToast'); if (old) old.remove();
  var t = document.createElement('div');
  t.id = 'igToast';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:var(--text);color:var(--bg);padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:fadeIn .3s ease;pointer-events:none;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ if (t.parentNode) t.remove(); }, 3000);
}

/* ── INIT ── */
window.addEventListener('load', function() {
  checkAuth();
  setDashDate();
  checkPlatformSessions();
  setInterval(function() { fetch('https://impactgrid-dijo.onrender.com/ping').catch(function(){}); }, 600000);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}
