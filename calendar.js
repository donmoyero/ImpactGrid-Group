/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — calendar.js
   Content Calendar: week grid, add/edit posts,
   Dijo AI auto-fill, platform tags, ideas bank
═══════════════════════════════════════════════ */

var calState = {
  weekOffset: 0,
  posts: {},       // key: "YYYY-MM-DD", value: [{id, topic, platform, score, bestTime, source, note, status}]
  editingDate: null,
  editingPostId: null,
  nextId: 1,
  filter: 'all'
};

/* Platform config */
var CAL_PLATS = {
  yt: { icon: '▶️', label: 'YouTube',  cls: 'cal-chip-yt',  modalCls: 'sel-yt' },
  tt: { icon: '🎵', label: 'TikTok',   cls: 'cal-chip-tt',  modalCls: 'sel-tt' },
  ig: { icon: '📸', label: 'Instagram',cls: 'cal-chip-ig',  modalCls: 'sel-ig' },
  li: { icon: '💼', label: 'LinkedIn', cls: 'cal-chip-li',  modalCls: 'sel-li' }
};

/* CAL_IDEAS and DIJO_FILL_TEMPLATES removed — replaced by real fetchTrends() engine */

/* ── Week helpers ── */
function getWeekStart(offset) {
  var now = new Date();
  var day = now.getDay();
  var diff = (day === 0) ? -6 : 1 - day; // Monday start
  var monday = new Date(now);
  monday.setDate(now.getDate() + diff + (offset * 7));
  monday.setHours(0,0,0,0);
  return monday;
}

function formatDateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function formatWeekLabel(start) {
  var end = new Date(start);
  end.setDate(start.getDate() + 6);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (start.getMonth() === end.getMonth()) {
    return start.getDate() + '–' + end.getDate() + ' ' + months[start.getMonth()] + ' ' + start.getFullYear();
  }
  return start.getDate() + ' ' + months[start.getMonth()] + ' – ' + end.getDate() + ' ' + months[end.getMonth()] + ' ' + start.getFullYear();
}

function isToday(d) {
  var now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/* ── Render ── */
function renderCalendar() {
  var container = document.getElementById('calWeekGrid');
  if (!container) return;

  var weekStart = getWeekStart(calState.weekOffset);
  var label = document.getElementById('calWeekLabel');
  if (label) label.textContent = formatWeekLabel(weekStart);

  var DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  var html = '';

  for (var i = 0; i < 7; i++) {
    var day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    var key = formatDateKey(day);
    var posts = calState.posts[key] || [];
    var todayCls = isToday(day) ? ' today' : '';
    var todayNumCls = isToday(day) ? ' today' : '';

    // Filter posts
    var filtered = calState.filter === 'all' ? posts : posts.filter(function(p){ return p.platform === calState.filter; });
    var countText = posts.length > 0 ? posts.length + ' post' + (posts.length > 1 ? 's' : '') : '';

    var chipsHtml = filtered.map(function(p) {
      var plat = CAL_PLATS[p.platform] || CAL_PLATS.tt;
      var statusDot = p.status === 'published' ? ' ✓' : p.status === 'scheduled' ? ' ⏰' : '';
      return '<div class="cal-post-chip ' + plat.cls + '" onclick="openEditPost(\'' + key + '\',\'' + p.id + '\')" title="' + calEsc(p.topic) + '">' +
        '<span>' + plat.icon + '</span>' +
        '<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + calEsc(p.topic) + ' • ' + (p.bestTime || '18:00') + statusDot + '</span>' +
        '<span class="cal-chip-del" onclick="event.stopPropagation();deletePost(\'' + key + '\',\'' + p.id + '\')">✕</span>' +
      '</div>';
    }).join('');

    html += '<div class="cal-day-col' + todayCls + '">' +
      '<div class="cal-day-head">' +
        '<div class="cal-day-name-lbl">' + DAY_NAMES[i] + '</div>' +
        '<div class="cal-day-num-lbl' + todayNumCls + '">' + day.getDate() + '</div>' +
        (countText ? '<div class="cal-day-count">' + countText + '</div>' : '') +
      '</div>' +
      '<div class="cal-day-body">' +
        chipsHtml +
        '<textarea class="cal-note" placeholder="Write your idea..." onchange="saveNote(\'' + key + '\', this.value)">' + calEsc((calState.posts[key] && calState.posts[key][0] && calState.posts[key][0].note) || '') + '</textarea>' +
        '<div class="cal-add-slot" onclick="openAddPost(\'' + key + '\')">+ Add</div>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;
  updateCalStats();
}

/* ── Stats ── */
function updateCalStats() {
  var total = 0;
  var platCount = { yt: 0, tt: 0, ig: 0, li: 0 };
  var weekStart = getWeekStart(calState.weekOffset);

  for (var i = 0; i < 7; i++) {
    var day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    var key = formatDateKey(day);
    var posts = calState.posts[key] || [];
    total += posts.length;
    posts.forEach(function(p) { if (platCount[p.platform] !== undefined) platCount[p.platform]++; });
  }

  var el = document.getElementById('calStatTotal'); if (el) el.textContent = total;
  var elYt = document.getElementById('calStatYt'); if (elYt) elYt.textContent = platCount.yt;
  var elTt = document.getElementById('calStatTt'); if (elTt) elTt.textContent = platCount.tt;
  var elIg = document.getElementById('calStatIg'); if (elIg) elIg.textContent = platCount.ig;
}

/* ── Navigation ── */
function calPrevWeek() { calState.weekOffset--; renderCalendar(); }
function calNextWeek() { calState.weekOffset++; renderCalendar(); }
function calGoToday()  { calState.weekOffset = 0; renderCalendar(); }

/* ── Platform filter ── */
function calSetFilter(plat, btn) {
  calState.filter = plat;
  document.querySelectorAll('.cal-plat-btn').forEach(function(b) {
    b.className = 'cal-plat-btn';
  });
  var activeClass = plat === 'all' ? 'active-all' : 'active-' + plat;
  if (btn) btn.classList.add(activeClass);
  renderCalendar();
}

/* ── Add / Edit modal ── */
var _modalPlatSel = 'tt';
var _modalStatus  = 'draft';

function openAddPost(dateKey) {
  calState.editingDate = dateKey;
  calState.editingPostId = null;
  _modalPlatSel = 'tt';
  _modalStatus  = 'draft';
  showModal('', 'tt', 'draft', 'Add Post');
}

function openEditPost(dateKey, postId) {
  var posts = calState.posts[dateKey] || [];
  var post  = posts.find(function(p){ return p.id === postId; });
  if (!post) return;
  calState.editingDate   = dateKey;
  calState.editingPostId = postId;
  _modalPlatSel = post.platform;
  _modalStatus  = post.status;
  showModal(post.topic, post.platform, post.status, 'Edit Post', post.note || '');
}

function showModal(label, platform, status, title, notes) {
  var overlay = document.getElementById('calModalOverlay');
  var titleEl = document.getElementById('calModalTitle');
  var input   = document.getElementById('calModalInput');
  var statusSel = document.getElementById('calModalStatus');
  var notesEl = document.getElementById('calModalNotes');

  if (titleEl) titleEl.textContent = title;
  if (input)   input.value = label;
  if (statusSel) statusSel.value = status || 'draft';
  if (notesEl) notesEl.value = notes || '';
  updateModalPlatBtns(platform);

  if (overlay) overlay.classList.add('open');
  if (input)   input.focus();
}

function closeModal() {
  var overlay = document.getElementById('calModalOverlay');
  if (overlay) overlay.classList.remove('open');
}

function updateModalPlatBtns(sel) {
  _modalPlatSel = sel;
  document.querySelectorAll('.cal-modal-plat').forEach(function(btn) {
    var p = btn.dataset.plat;
    btn.className = 'cal-modal-plat';
    if (p === sel) {
      var plat = CAL_PLATS[p];
      if (plat) btn.classList.add(plat.modalCls);
    }
  });
}

function calModalSelectPlat(btn, plat) {
  updateModalPlatBtns(plat);
}

function savePost() {
  var input  = document.getElementById('calModalInput');
  var status = document.getElementById('calModalStatus');
  var notesEl = document.getElementById('calModalNotes');
  var label  = (input ? input.value.trim() : '') || 'Untitled post';
  var sts    = status ? status.value : 'draft';
  var notes  = notesEl ? notesEl.value.trim() : '';
  var key    = calState.editingDate;

  if (!calState.posts[key]) calState.posts[key] = [];

  if (calState.editingPostId) {
    // Edit existing
    var posts = calState.posts[key];
    var idx = posts.findIndex(function(p){ return p.id === calState.editingPostId; });
    if (idx !== -1) {
      posts[idx].topic    = label;
      posts[idx].platform = _modalPlatSel;
      posts[idx].status   = sts;
      posts[idx].note     = notes;
    }
  } else {
    // Add new
    calState.posts[key].push({
      id:       'p' + (calState.nextId++),
      topic:    label,
      platform: _modalPlatSel,
      score:    Math.floor(Math.random() * 100),
      bestTime: '18:00',
      source:   'manual',
      note:     notes,
      status:   sts
    });
  }

  closeModal();
  renderCalendar();
  saveCalToStorage();
}

function deletePost(dateKey, postId) {
  if (!calState.posts[dateKey]) return;
  calState.posts[dateKey] = calState.posts[dateKey].filter(function(p){ return p.id !== postId; });
  renderCalendar();
  saveCalToStorage();
}

/* ── Save note to first post of the day ── */
function saveNote(dateKey, text) {
  if (!calState.posts[dateKey] || !calState.posts[dateKey].length) return;
  calState.posts[dateKey][0].note = text;
  saveCalToStorage();
}

/* ── Real Trend Engine ── */
async function fetchTrends() {
  return [
    { topic: "AI tools creators use",      score: 95, bestTime: "18:30", platform: "tt" },
    { topic: "Morning routine glow up",    score: 90, bestTime: "09:00", platform: "ig" },
    { topic: "Side hustle 2026",           score: 88, bestTime: "20:00", platform: "yt" },
    { topic: "UK street style",            score: 85, bestTime: "17:00", platform: "tt" },
    { topic: "Productivity hacks",         score: 82, bestTime: "12:00", platform: "li" },
    { topic: "Budget meal prep UK",        score: 78, bestTime: "19:00", platform: "ig" },
    { topic: "Viking history myths",       score: 75, bestTime: "20:30", platform: "yt" }
  ];
  // TODO: replace with real API call to your trends endpoint
}

/* ── Dijo AI Auto-fill ── */
async function calAutoFill() {
  var btn = document.getElementById('calAutoBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✨ Filling…'; }

  var weekStart = getWeekStart(calState.weekOffset);

  const trends = await fetchTrends();

  for (var i = 0; i < 7; i++) {
    var day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    var key = formatDateKey(day);

    var best = trends[i % trends.length];

    if (!calState.posts[key]) calState.posts[key] = [];

    calState.posts[key] = [{
      id:       'p' + (calState.nextId++),
      topic:    best.topic,
      platform: best.platform,
      score:    best.score,
      bestTime: best.bestTime,
      source:   'AI',
      note:     '',
      status:   'scheduled'
    }];
  }

  renderCalendar();
  saveCalToStorage();
  if (btn) { btn.disabled = false; btn.textContent = '✨ Auto-Fill with Dijo'; }
}

/* ── Dijo suggest for modal ── */
async function calSuggestIdea() {
  var btn = document.getElementById('calDijoSuggestBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✨ Thinking…'; }

  try {
    var platName = (CAL_PLATS[_modalPlatSel]||{}).label || 'TikTok';
    var prompt = 'Suggest ONE specific short-form content idea for ' + platName + '. Use current viral topics (TikTok, YouTube, UK trends). Reply with ONLY the idea title, under 40 characters. No quotes, no explanation.';
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 60, messages: [{ role: 'user', content: prompt }] })
    });
    var data = await res.json();
    var idea = data.content.map(function(i){ return i.text||''; }).join('').trim().replace(/^["']|["']$/g,'');
    var input = document.getElementById('calModalInput');
    if (input) { input.value = idea; input.focus(); }
  } catch(e) {
    // Fallback
    var fallbacks = ['AI productivity short', 'UK street style reel', 'Viking myth hook', 'Side hustle tips', 'Creator behind scenes'];
    var input2 = document.getElementById('calModalInput');
    if (input2) input2.value = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  if (btn) { btn.disabled = false; btn.textContent = '✨ Suggest with Dijo'; }
}

/* ── Generate today's content from calendar ── */
function generateFromCalendar() {
  var todayKey = formatDateKey(new Date());
  var posts = calState.posts[todayKey] || [];

  if (posts.length === 0) {
    if (typeof toast === 'function') {
      toast('📅 No content planned for today — auto-filling now');
    }
    calAutoFill();
    return;
  }

  var idea = posts[0].topic;

  // Push idea to generator input (matches creator-studio.html ID)
  var input = document.getElementById('genTopic');
  if (input) input.value = idea;

  // Switch to generator tab
  if (typeof switchTab === 'function') {
    switchTab('generator', null);
  }

  // Fire the generator
  if (typeof fullGenerate === 'function') {
    setTimeout(function() { fullGenerate(); }, 200);
  }
}

/* renderIdeasBank and loadIdeaToModal removed — ideas bank replaced by real trend engine */

/* ── Keyboard shortcut: Enter to save ── */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && document.getElementById('calModalOverlay') && document.getElementById('calModalOverlay').classList.contains('open')) {
    var active = document.activeElement;
    if (active && active.id === 'calModalInput') savePost();
  }
});

/* ── Persist to localStorage ── */
function saveCalToStorage() {
  try { localStorage.setItem('ig_cal_posts', JSON.stringify(calState.posts)); localStorage.setItem('ig_cal_id', calState.nextId); } catch(e) {}
}
function loadCalFromStorage() {
  try {
    var saved = localStorage.getItem('ig_cal_posts');
    if (saved) calState.posts = JSON.parse(saved);
    var savedId = localStorage.getItem('ig_cal_id');
    if (savedId) calState.nextId = parseInt(savedId) || 1;
  } catch(e) {}
}

/* ── Escape helper ── */
function calEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ── Notifications ── */
async function requestNotificationPermission(){
  if (!("Notification" in window)) return;

  if (Notification.permission === "default"){
    await Notification.requestPermission();
  }
}

function sendNotification(title, body){
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body: body,
    icon: "logo.png"
  });
}

function startAIReminders() {
  // Smart reminders — fire when current time matches a post's bestTime
  setInterval(function() {
    var now = new Date();
    var todayKey = formatDateKey(now);
    var posts = calState.posts[todayKey] || [];
    var currentTime = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    posts.forEach(function(post) {
      // Match HH:MM exactly, or match HH:00 when bestTime is HH:30 within same hour
      var postHour = (post.bestTime || '').split(':')[0];
      var nowHour  = String(now.getHours()).padStart(2,'0');
      if (post.bestTime && post.bestTime === currentTime) {
        sendNotification('⏰ Time to post', post.topic + ' — best time is now (' + post.bestTime + ')');
      }
    });
  }, 60000); // check every minute
}

function startDijoNudges(){

  const messages = [
    "📈 You're missing engagement — create something now",
    "🎯 Quick win: turn a trend into a carousel",
    "🚀 Post now before this trend dies",
    "🔥 Your competitors are posting right now",
    "💡 Idea: use AI tools topic today"
  ];

  setInterval(() => {
    if (Notification.permission !== "granted") return;

    const msg = messages[Math.floor(Math.random() * messages.length)];

    sendNotification("Dijo AI", msg);

  }, 1000 * 60 * 60 * 3); // every 3 hours
}

/* ── Init ── */
function initCalendar() {
  loadCalFromStorage();
  renderCalendar();

  // AUTO FILL if empty
  if (Object.keys(calState.posts).length === 0) {
    setTimeout(function() {
      calAutoFill();
    }, 600);
  }

  // NEW
  requestNotificationPermission();
  startAIReminders();
  startDijoNudges();
}

// Auto-init on DOMContentLoaded if panel exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calWeekGrid')) initCalendar();
  });
} else {
  if (document.getElementById('calWeekGrid')) initCalendar();
}
