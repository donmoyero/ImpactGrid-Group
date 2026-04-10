/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — calendar.js
   Content Calendar: week grid, add/edit posts,
   Dijo AI auto-fill, platform tags, ideas bank
═══════════════════════════════════════════════ */

var calState = {
  weekOffset: 0,
  posts: {},       // key: "YYYY-MM-DD", value: [{id, label, platform, status}]
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

var CAL_IDEAS = [
  { icon:'🔥', text:'Viking history myths' },
  { icon:'🇬🇧', text:'UK Street Style lookbook' },
  { icon:'🤖', text:'AI tools for creators' },
  { icon:'💰', text:'Side hustle breakdown' },
  { icon:'🎯', text:'Productivity hacks 2026' },
  { icon:'📱', text:'TikTok algorithm update' },
  { icon:'🌿', text:'Sustainable living tips' },
  { icon:'💪', text:'Morning routine transformation' },
  { icon:'📚', text:'Book review thread' },
  { icon:'🍕', text:'Budget meal prep week' },
  { icon:'✈️', text:'UK budget travel guide' },
  { icon:'🎵', text:'Song reaction video' }
];

var DIJO_FILL_TEMPLATES = [
  { platform: 'yt', labels: ['Viking myths hook', 'Bible verse short', 'Week wrap-up vlog', 'Shorts reaction', 'Channel update'] },
  { platform: 'tt', labels: ['AI tools short', 'Trending audio', 'Day in my life', 'POV challenge', 'Stitch trend'] },
  { platform: 'ig', labels: ['Lifestyle carousel', 'UK Style ootd', 'Quote post', 'Reel — life tips', 'Behind the scenes'] },
  { platform: 'li', labels: ['Creator lesson', 'Growth insight', 'Industry take', 'Career tip', 'Tool recommendation'] }
];

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
      return '<div class="cal-post-chip ' + plat.cls + '" onclick="openEditPost(\'' + key + '\',\'' + p.id + '\')" title="' + calEsc(p.label) + '">' +
        '<span>' + plat.icon + '</span>' +
        '<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + calEsc(p.label) + statusDot + '</span>' +
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
  showModal(post.label, post.platform, post.status, 'Edit Post');
}

function showModal(label, platform, status, title) {
  var overlay = document.getElementById('calModalOverlay');
  var titleEl = document.getElementById('calModalTitle');
  var input   = document.getElementById('calModalInput');
  var statusSel = document.getElementById('calModalStatus');

  if (titleEl) titleEl.textContent = title;
  if (input)   input.value = label;
  if (statusSel) statusSel.value = status || 'draft';
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
  var label  = (input ? input.value.trim() : '') || 'Untitled post';
  var sts    = status ? status.value : 'draft';
  var key    = calState.editingDate;

  if (!calState.posts[key]) calState.posts[key] = [];

  if (calState.editingPostId) {
    // Edit existing
    var posts = calState.posts[key];
    var idx = posts.findIndex(function(p){ return p.id === calState.editingPostId; });
    if (idx !== -1) {
      posts[idx].label    = label;
      posts[idx].platform = _modalPlatSel;
      posts[idx].status   = sts;
    }
  } else {
    // Add new
    calState.posts[key].push({
      id:       'p' + (calState.nextId++),
      label:    label,
      platform: _modalPlatSel,
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

/* ── Dijo AI Auto-fill ── */
async function calAutoFill() {
  var btn = document.getElementById('calAutoBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✨ Filling…'; }

  var weekStart = getWeekStart(calState.weekOffset);

  try {
    var prompt = 'You are Dijo, a creator assistant. Generate a 7-day content plan.\n\nReturn ONLY a JSON array of 7 objects, one per day. Each object:\n{"day":0,"platform":"tt","label":"Short post idea"}\n\nday is 0-6 (Mon-Sun). platform is one of: tt, yt, ig, li.\nMake each idea specific, trending, and under 30 chars.\nToday\'s hot topics: Viking history, UK Street Style, AI tools, side hustles.\n\nReturn only the JSON array. No extra text.';

    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    var data = await res.json();
    var text = data.content.map(function(i){ return i.text||''; }).join('');
    var clean = text.replace(/```json|```/g, '').trim();
    var plan = JSON.parse(clean);

    plan.forEach(function(item) {
      var day = new Date(weekStart);
      day.setDate(weekStart.getDate() + (item.day || 0));
      var key = formatDateKey(day);
      if (!calState.posts[key]) calState.posts[key] = [];
      calState.posts[key].push({
        id:       'p' + (calState.nextId++),
        label:    item.label || 'Content idea',
        platform: item.platform || 'tt',
        status:   'draft'
      });
    });

  } catch(e) {
    // Fallback fill
    var fallbackPlatforms = ['yt','tt','ig','tt','yt','ig','yt'];
    for (var i = 0; i < 7; i++) {
      var day2 = new Date(weekStart);
      day2.setDate(weekStart.getDate() + i);
      var key2 = formatDateKey(day2);
      var plat = fallbackPlatforms[i];
      var templates = DIJO_FILL_TEMPLATES.find(function(t){ return t.platform === plat; });
      var ideas = templates ? templates.labels : ['Content idea'];
      if (!calState.posts[key2]) calState.posts[key2] = [];
      calState.posts[key2].push({
        id:       'p' + (calState.nextId++),
        label:    ideas[i % ideas.length],
        platform: plat,
        status:   'draft'
      });
    }
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
    var prompt = 'Suggest ONE specific short-form content idea for ' + platName + '. Based on trending topics: Viking history, UK Street Style, AI tools. Reply with ONLY the idea title, under 40 characters. No quotes, no explanation.';
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

/* ── Ideas bank ── */
function renderIdeasBank() {
  var container = document.getElementById('calIdeasBank');
  if (!container) return;
  container.innerHTML = CAL_IDEAS.map(function(idea) {
    return '<span class="cal-idea-chip" onclick="loadIdeaToModal(' + JSON.stringify(idea.text) + ')">' +
      '<span>' + idea.icon + '</span>' + calEsc(idea.text) +
    '</span>';
  }).join('');
}

function loadIdeaToModal(text) {
  // Find today's date key and open add modal with pre-filled text
  var today = formatDateKey(new Date());
  calState.editingDate   = today;
  calState.editingPostId = null;
  _modalPlatSel = 'tt';
  _modalStatus  = 'draft';
  showModal(text, 'tt', 'draft', 'Add Post');
}

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

/* ── Init ── */
function initCalendar() {
  loadCalFromStorage();
  renderIdeasBank();
  renderCalendar();
}

// Auto-init on DOMContentLoaded if panel exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calWeekGrid')) initCalendar();
  });
} else {
  if (document.getElementById('calWeekGrid')) initCalendar();
}
