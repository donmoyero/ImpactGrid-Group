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

/* ── Helper: flatten calState.posts into Supabase-ready rows ── */
calState.postsArrayForSupabase = function(userId) {
  var arr = [];
  Object.keys(calState.posts).forEach(function(date) {
    calState.posts[date].forEach(function(post) {
      arr.push({
        user_id:   userId || getCalUserId(),
        date:      date,
        topic:     post.topic,
        platform:  post.platform,
        score:     post.score || 0,
        best_time: post.bestTime || '18:00',
        note:      post.note || '',
        status:    post.status || 'draft'
      });
    });
  });
  return arr;
};

/* Platform config */
var CAL_PLATS = {
  yt: { icon: '▶️', label: 'YouTube',  cls: 'cal-chip-yt',  modalCls: 'sel-yt' },
  tt: { icon: '🎵', label: 'TikTok',   cls: 'cal-chip-tt',  modalCls: 'sel-tt' },
  ig: { icon: '📸', label: 'Instagram',cls: 'cal-chip-ig',  modalCls: 'sel-ig' },
  li: { icon: '💼', label: 'LinkedIn', cls: 'cal-chip-li',  modalCls: 'sel-li' }
};

/* CAL_IDEAS and DIJO_FILL_TEMPLATES removed — replaced by real fetchTrends() engine */

/* ── Supabase client (uses content project — same as supabase-config.js) ── */
var _calSupabase = null;
function getCalDb() {
  if (!_calSupabase) {
    var url  = 'https://exeiojgldxqaakkybdij.supabase.co';
    var anon = 'sb_publishable_ZuzIHR43W_7OpCejLpFyTQ_r5HQYHSq';
    _calSupabase = window.supabase ? window.supabase.createClient(url, anon) : null;
  }
  return _calSupabase;
}

/* ── Get current user ID — nav.js owns auth, read window.igUser only ── */
function getCalUserId() {
  return window.igUser?.id || 'guest-user';
}

/* ── Async alias — now sync underneath; kept so call sites need no changes ── */
async function getCalUserIdAsync() {
  return getCalUserId();
}

/* ── Niche personalisation ── */
var USER_NICHE = 'all'; // updated by setUserNiche() from the UI select

function setUserNiche(niche) {
  USER_NICHE = niche;
  renderCalendar();
}

function matchesNiche(topic) {
  if (USER_NICHE === 'all') return true;
  var t = topic.toLowerCase();
  if (USER_NICHE === 'creator')   return t.includes('ai') || t.includes('content') || t.includes('social') || t.includes('creator') || t.includes('tool');
  if (USER_NICHE === 'fitness')   return t.includes('workout') || t.includes('health') || t.includes('fitness') || t.includes('routine') || t.includes('gym');
  if (USER_NICHE === 'finance')   return t.includes('money') || t.includes('finance') || t.includes('hustle') || t.includes('invest') || t.includes('budget');
  if (USER_NICHE === 'lifestyle') return t.includes('style') || t.includes('life') || t.includes('food') || t.includes('travel') || t.includes('meal');
  return true;
}

/* ── Trend momentum indicator ── */
function getTrendMomentum(score) {
  if (score > 85) return '📈';
  if (score > 60) return '➖';
  return '📉';
}


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
      var momentum = getTrendMomentum(p.score || 0);
      var scoreLabel = p.score ? ' 🔥' + p.score : '';
      return '<div class="cal-post-chip ' + plat.cls + '" onclick="openEditPost(\'' + key + '\',\'' + p.id + '\')" title="' + calEsc(p.topic) + ' — Score: ' + (p.score||0) + '">' +
        '<span>' + plat.icon + '</span>' +
        '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + calEsc(p.topic) + statusDot + '</span>' +
        '<span class="cal-momentum">' + momentum + '</span>' +
        '<span class="cal-score">' + (p.score || 0) + '</span>' +
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
  var total = 0, published = 0;
  var platCount = { yt: 0, tt: 0, ig: 0, li: 0 };
  var weekStart = getWeekStart(calState.weekOffset);

  for (var i = 0; i < 7; i++) {
    var day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    var key = formatDateKey(day);
    var posts = calState.posts[key] || [];
    total += posts.length;
    posts.forEach(function(p) {
      if (platCount[p.platform] !== undefined) platCount[p.platform]++;
      if (p.status === 'published') published++;
    });
  }

  var el = document.getElementById('calStatTotal'); if (el) el.textContent = total;
  var elYt = document.getElementById('calStatYt'); if (elYt) elYt.textContent = platCount.yt;
  var elTt = document.getElementById('calStatTt'); if (elTt) elTt.textContent = platCount.tt;
  var elIg = document.getElementById('calStatIg'); if (elIg) elIg.textContent = platCount.ig;
  var elDone = document.getElementById('calStatDone'); if (elDone) elDone.textContent = published;
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

async function savePost() {
  var input  = document.getElementById('calModalInput');
  var status = document.getElementById('calModalStatus');
  var notesEl = document.getElementById('calModalNotes');
  var label  = (input ? input.value.trim() : '') || 'Untitled post';
  var sts    = status ? status.value : 'draft';
  var notes  = notesEl ? notesEl.value.trim() : '';
  var key    = calState.editingDate;

  if (!calState.posts[key]) calState.posts[key] = [];

  if (calState.editingPostId) {
    // Edit existing (local only — DB update via upsert)
    var posts = calState.posts[key];
    var idx = posts.findIndex(function(p){ return p.id === calState.editingPostId; });
    if (idx !== -1) {
      posts[idx].topic    = label;
      posts[idx].platform = _modalPlatSel;
      posts[idx].status   = sts;
      posts[idx].note     = notes;

      // Upsert to Supabase
      var db = getCalDb();
      if (db) {
        await db.from('calendar_posts').update({
          topic:     label,
          platform:  _modalPlatSel,
          status:    sts,
          note:      notes
        }).eq('id', calState.editingPostId);
      }
    }
  } else {
    // Add new — insert to Supabase and use returned ID
    var newPost = {
      id:       'p' + (calState.nextId++),
      topic:    label,
      platform: _modalPlatSel,
      score:    Math.floor(Math.random() * 100),
      bestTime: '18:00',
      note:     notes,
      status:   sts
    };

    var db = getCalDb();
    if (db) {
      console.log("Saving post with user:", getCalUserId());
      var res = await db.from('calendar_posts').insert([{
        user_id:   getCalUserId(),
        date:      key,
        topic:     label,
        platform:  _modalPlatSel,
        score:     newPost.score,
        best_time: newPost.bestTime,
        note:      notes,
        status:    sts
      }]).select().single();
      if (res.data) newPost.id = res.data.id; // use real DB id
    }

    calState.posts[key].push(newPost);
  }

  closeModal();
  renderCalendar();
}

async function deletePost(dateKey, postId) {
  if (!calState.posts[dateKey]) return;
  calState.posts[dateKey] = calState.posts[dateKey].filter(function(p){ return p.id !== postId; });
  renderCalendar();

  var db = getCalDb();
  if (db) { await db.from('calendar_posts').delete().eq('id', postId); }
}

/* ── Save note to first post of the day ── */
async function saveNote(dateKey, text) {
  if (!calState.posts[dateKey] || !calState.posts[dateKey].length) return;
  calState.posts[dateKey][0].note = text;

  var db = getCalDb();
  if (db) { await db.from('calendar_posts').update({ note: text }).eq('id', calState.posts[dateKey][0].id); }
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

  const allTrends = await fetchTrends();
  // Filter by niche, fall back to all if filter removes everything
  var trends = allTrends.filter(function(t){ return matchesNiche(t.topic); });
  if (!trends.length) trends = allTrends;

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
  if (btn) { btn.disabled = false; btn.textContent = '✨ Auto-Fill with Dijo'; }

  // Save all filled posts to Supabase
  var db = getCalDb();
  if (db) {
    var userId = await getCalUserIdAsync();
    // Delete existing posts for this week then re-insert
    var weekStart2 = getWeekStart(calState.weekOffset);
    var datesToClear = [];
    for (var j = 0; j < 7; j++) {
      var d2 = new Date(weekStart2);
      d2.setDate(weekStart2.getDate() + j);
      datesToClear.push(formatDateKey(d2));
    }
    await db.from('calendar_posts').delete().eq('user_id', userId).in('date', datesToClear);
    await db.from('calendar_posts').insert(calState.postsArrayForSupabase(userId));
  }
}

/* ── Dijo suggest for modal ── */
async function calSuggestIdea() {
  var btn = document.getElementById('calDijoSuggestBtn');
  if (btn) { btn.disabled = true; btn.textContent = '✨ Thinking…'; }

  try {
    var platName = (CAL_PLATS[_modalPlatSel]||{}).label || 'TikTok';
    var prompt = 'Suggest ONE specific short-form content idea for ' + platName + '. Use current viral topics (TikTok, YouTube, UK trends). Reply with ONLY the idea title, under 40 characters. No quotes, no explanation.';
    var res = await fetch('https://impactgrid-dijo.onrender.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, mode: 'creator' })
    });
    var data = await res.json();
    var idea = (data.reply || '').trim().replace(/^["']|["']$/g, '');
    var input = document.getElementById('calModalInput');
    if (input && idea) { input.value = idea; input.focus(); }
    else throw new Error('empty reply');
  } catch(e) {
    // Fallback ideas if backend is unavailable
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

/* ── Load from Supabase (replaces localStorage load) ── */
async function loadFromSupabase() {
  var db = getCalDb();
  if (!db) { console.warn('calendar: Supabase not ready, skipping cloud load'); return; }

  try {
    var userId = await getCalUserIdAsync();
    var res = await db.from('calendar_posts').select('*').eq('user_id', userId);
    if (res.error) { console.error('calendar load error:', res.error); return; }

    calState.posts = {}; // clear before repopulating
    (res.data || []).forEach(function(item) {
      var key = item.date;
      if (!calState.posts[key]) calState.posts[key] = [];
      calState.posts[key].push({
        id:       item.id,
        topic:    item.topic,
        platform: item.platform,
        score:    item.score || 0,
        bestTime: item.best_time || '18:00',
        source:   item.source || 'AI',
        note:     item.note || '',
        status:   item.status || 'draft'
      });
    });

    renderCalendar();

    // Auto-fill if nothing in DB yet
    if (Object.keys(calState.posts).length === 0) {
      setTimeout(function() { calAutoFill(); }, 600);
    }
  } catch(e) {
    console.error('calendar: loadFromSupabase failed', e);
  }
}

/* ── localStorage removed — Supabase is the source of truth ──
   saveCalToStorage() and loadCalFromStorage() are no longer used.
   All reads go through loadFromSupabase(), all writes go direct to DB. ── */

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

/* ── Missed trend hook ── */
function checkMissedTrends() {
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var key = formatDateKey(yesterday);
  var posts = calState.posts[key] || [];
  posts.forEach(function(p) {
    if (p.status !== 'published' && p.score > 85) {
      sendNotification(
        '⚠️ Missed Viral Opportunity',
        '"' + p.topic + '" was trending yesterday — still worth posting'
      );
    }
  });
}


function startAIReminders() {
  // Smart reminders — fires when hour matches bestTime; uses notified flag to avoid repeat
  setInterval(function() {
    var now = new Date();
    var todayKey = formatDateKey(now);
    var posts = calState.posts[todayKey] || [];

    posts.forEach(function(post) {
      if (!post.bestTime) return;
      var hour = parseInt(post.bestTime.split(':')[0], 10);
      if (hour === now.getHours() && !post.notified) {
        sendNotification(
          '🔥 Post Now — ' + (post.source === 'AI' ? 'Trending' : 'Your content'),
          '"' + post.topic + '" — best time is right now (' + post.bestTime + ')'
        );
        post.notified = true;
      }
    });
  }, 60000);
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

/* ── Minute-precise reminders ── */
function checkReminders() {
  var now = new Date();
  var currentTime =
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');

  Object.keys(calState.posts).forEach(function(date) {
    calState.posts[date].forEach(function(post) {
      if (post.bestTime === currentTime) {
        sendNotification(
          '📅 Time to post',
          post.topic + ' (' + (post.platform || '') + ')'
        );
      }
    });
  });
}

/* ── Init ── */
function initCalendar() {
  loadFromSupabase(); // loads from DB, auto-fills if empty, then renders

  requestNotificationPermission();
  startAIReminders();
  startDijoNudges();
  checkMissedTrends();
  setInterval(checkReminders, 60000);
}

// Auto-init on DOMContentLoaded if panel exists
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calWeekGrid')) initCalendar();
  });
} else {
  if (document.getElementById('calWeekGrid')) initCalendar();
}

/* ── Nav sync — re-render calendar once user is confirmed ── */
document.addEventListener('ig-user-ready', function(e) {
  var user = e.detail;
  console.log('User ready:', user);
  if (document.getElementById('calWeekGrid')) renderCalendar();
}, { once: true });
