/* ═══════════════════════════════════════════════════════════
   IMPACTGRID CONTENT CALENDAR — calendar.js
   ─────────────────────────────────────────────────────────
   BEHAVIOUR:
   • 7-day book — flip between pages like a diary
   • Each "page" = one day (Mon → Sun)
   • Dijo auto-fills ALL 7 days from live trends on load
   • 3 time slots per day: Morning · Afternoon · Evening
   • Posts saved per-user to localStorage (keyed by week start)
   • After day 7 (Sunday) the book auto-resets for the next week
   • Push notifications via service worker (phone + laptop)
   • Page-flip animation when turning pages
   • Cookie/terms banner on first visit
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── WEEK KEY ───────────────────────────────────────────────
     We key the whole 7-day book by the Monday of the current week.
     After Sunday the key changes → fresh book next week.           */
  function getMondayKey() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var day = d.getDay(); // 0=Sun … 6=Sat
    var diff = (day === 0) ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return 'ig_week_' + d.getFullYear()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');
  }

  function getWeekDates() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    var day = d.getDay();
    var diff = (day === 0) ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    var week = [];
    for (var i = 0; i < 7; i++) {
      var clone = new Date(d);
      clone.setDate(d.getDate() + i);
      week.push(clone);
    }
    return week;
  }

  function todayIndex() {
    var dates = getWeekDates();
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    for (var i = 0; i < dates.length; i++) {
      if (dates[i].getTime() === now.getTime()) return i;
    }
    return 0;
  }

  /* ─── SLOTS ──────────────────────────────────────────────────── */
  var SLOTS = [
    { id: 'morning',   label: 'Morning',   icon: '🌅', defaultTime: '9:00 AM'  },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️',  defaultTime: '12:30 PM' },
    { id: 'evening',   label: 'Evening',   icon: '🌙', defaultTime: '7:00 PM'  }
  ];

  /* ─── PLATFORM META ──────────────────────────────────────────── */
  var PLAT = {
    tt: { icon: '🎵', label: 'TikTok',    color: '#ff2d55' },
    yt: { icon: '▶️',  label: 'YouTube',   color: '#FFD700' },
    ig: { icon: '📸', label: 'Instagram', color: '#a855f7' },
    li: { icon: '💼', label: 'LinkedIn',  color: '#0a66c2' },
    gt: { icon: '🔍', label: 'Google',    color: '#78b4ff' }
  };

  var STATUS = {
    draft:     { label: 'Draft',     color: 'var(--text3)', dot: '○' },
    scheduled: { label: 'Scheduled', color: 'var(--gold)',  dot: '⏰' },
    published: { label: 'Published', color: 'var(--green)', dot: '✓' }
  };

  var DAYS_LONG  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MONTHS     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  /* ─── STATE ──────────────────────────────────────────────────── */
  var _pageIndex   = 0;
  var _weekData    = {};
  var _weekKey     = '';
  var _autoFilled  = false;
  var _notifTimers = {};
  var _editSlot    = null;
  var _modalPlat   = 'tt';
  var _modalSlotId = 'morning';
  var _predictedTimes = {
    morning:   '9:00 AM',
    afternoon: '12:30 PM',
    evening:   '7:00 PM'
  };

  /* ─── LOAD / SAVE ────────────────────────────────────────────── */
  function loadWeek() {
    _weekKey = getMondayKey();
    try {
      var raw = localStorage.getItem(_weekKey);
      _weekData = raw ? JSON.parse(raw) : {};
    } catch (e) { _weekData = {}; }
    for (var i = 0; i < 7; i++) {
      if (!_weekData[i]) _weekData[i] = {};
    }
  }

  function saveWeek() {
    try { localStorage.setItem(_weekKey, JSON.stringify(_weekData)); } catch (e) {}
  }

  function pruneOldWeeks() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (!k.startsWith('ig_week_')) return;
        var ws = k.replace('ig_week_', '');
        var wd = new Date(+ws.slice(0,4), +ws.slice(4,6)-1, +ws.slice(6,8));
        if (Date.now() - wd.getTime() > 28 * 864e5) localStorage.removeItem(k);
      });
    } catch (e) {}
  }

  /* ─── CURRENT PAGE HELPERS ───────────────────────────────────── */
  function dayPosts()            { return _weekData[_pageIndex] || {}; }
  function setDayPost(sid, p)    { if (!_weekData[_pageIndex]) _weekData[_pageIndex] = {}; _weekData[_pageIndex][sid] = p; }
  function deleteDayPost(sid)    { if (_weekData[_pageIndex]) delete _weekData[_pageIndex][sid]; }

  /* ─── TREND DATA ─────────────────────────────────────────────── */
  function getTrends() {
    return (window._allTrends && window._allTrends.length) ? window._allTrends : [];
  }

  function bestTrendForPlat(platCode, exclude) {
    var trends = getTrends();
    if (!trends.length) return null;
    var pool = trends.filter(function (t) {
      return (t.plat === platCode || t.plat === 'cross') && (!exclude || exclude.indexOf(t.topic) === -1);
    });
    if (!pool.length) pool = trends.filter(function (t) { return !exclude || exclude.indexOf(t.topic) === -1; });
    if (!pool.length) pool = trends.slice();
    return pool.sort(function (a, b) { return b.score - a.score; })[0] || null;
  }

  /* ─── PREDICT BEST TIMES ─────────────────────────────────────── */
  function predictBestTimes() {
    var trends = getTrends();
    if (!trends.length) return;
    var top = trends.slice().sort(function (a, b) { return b.score - a.score; });
    var ts  = top[0] ? top[0].score : 5;
    var ct  = { tt: 0, yt: 0, gt: 0, cross: 0 };
    top.slice(0, 5).forEach(function (t) { if (ct[t.plat] !== undefined) ct[t.plat]++; });
    if (ts >= 8.5) {
      _predictedTimes.morning   = ct.gt >= ct.yt  ? '9:00 AM'  : '10:00 AM';
      _predictedTimes.afternoon = ct.yt >= ct.tt  ? '12:00 PM' : '1:00 PM';
      _predictedTimes.evening   = ct.tt >= ct.gt  ? '7:00 PM'  : '6:30 PM';
    } else if (ts >= 7) {
      _predictedTimes.morning = '8:30 AM'; _predictedTimes.afternoon = '12:00 PM'; _predictedTimes.evening = '6:00 PM';
    } else {
      _predictedTimes.morning = '9:00 AM'; _predictedTimes.afternoon = '1:00 PM'; _predictedTimes.evening = '7:00 PM';
    }
  }

  /* ─── SCORE LABEL ────────────────────────────────────────────── */
  function scoreLabel(score) {
    if (score >= 8.5) return { text: '🔥 Peak',   color: 'var(--green)' };
    if (score >= 7)   return { text: '⚡ Rising', color: 'var(--gold)' };
    if (score >= 5)   return { text: '🟢 Early',  color: '#4FB3A5' };
    return               { text: '📊 Stable', color: 'var(--text3)' };
  }

  /* ─── AUTO-FILL ALL 7 DAYS ───────────────────────────────────── */
  function autoFillAllDays(force) {
    var trends = getTrends();
    if (!trends.length) return false;
    predictBestTimes();

    var dayConfig = [
      { sa: ['li','yt','tt'], tp: ['gt','yt','tt'] },
      { sa: ['yt','tt','ig'], tp: ['yt','tt','cross'] },
      { sa: ['tt','ig','li'], tp: ['tt','cross','gt'] },
      { sa: ['ig','yt','tt'], tp: ['cross','yt','tt'] },
      { sa: ['yt','tt','li'], tp: ['yt','tt','gt'] },
      { sa: ['tt','ig','yt'], tp: ['tt','cross','yt'] },
      { sa: ['ig','li','tt'], tp: ['cross','gt','tt'] }
    ];

    var used = [];
    var total = 0;

    for (var di = 0; di < 7; di++) {
      var dc = dayConfig[di];
      SLOTS.forEach(function (slot, si) {
        if (!force && _weekData[di] && _weekData[di][slot.id]) return;
        var trend = bestTrendForPlat(dc.tp[si], used);
        if (!trend) return;
        used.push(trend.topic);
        if (!_weekData[di]) _weekData[di] = {};
        _weekData[di][slot.id] = {
          topic: trend.topic, plat: dc.sa[si], status: 'scheduled',
          notes: '', score: trend.score, postTime: _predictedTimes[slot.id],
          autoFilled: true, createdAt: new Date().toISOString()
        };
        total++;
      });
    }
    saveWeek();
    return total > 0;
  }

  /* ─── ESCAPE ─────────────────────────────────────────────────── */
  function escH(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escJ(s) {
    return String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  }

  /* ─── STACKED BOOK-FLIP ANIMATION ──────────────────────────────
     Layout inside #calWeekGrid:
       .cal-book-stage
         .cal-book          (7 stacked .cal-fp-page elements)
           .cal-fp-page#calFpPage0..6  (z-index: 7,6,5…1)
             .cal-fp-front  (current day content — visible)
             .cal-fp-back   (next day content — hidden until flip)
     Forward flip: calFpPage[i].classList.add('flipped')   → rotateY(-180deg)
     Back flip:    calFpPage[i].classList.remove('flipped') → rotates back
     Flipped pages stack up on the left — you can always flip back.
  ─────────────────────────────────────────────────────────────── */
  var _flipping = false;

  /* Build or rebuild the full 7-page stacked book */
  function ensureBookDOM() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return null;
    var existing = grid.querySelector('.cal-book-stage');
    if (existing) return existing;

    var stage = document.createElement('div');
    stage.className = 'cal-book-stage';

    var book = document.createElement('div');
    book.className = 'cal-book';
    book.id = 'calBook';

    /* 7 pages — page 0 is on top (highest z-index) */
    for (var i = 0; i < 7; i++) {
      var page = document.createElement('div');
      page.className = 'cal-fp-page';
      page.id = 'calFpPage' + i;
      page.style.zIndex = String(7 - i);

      var front = document.createElement('div');
      front.className = 'cal-fp-front';
      front.id = 'calFpFront' + i;

      var back = document.createElement('div');
      back.className = 'cal-fp-back';
      back.id = 'calFpBack' + i;

      page.appendChild(front);
      page.appendChild(back);
      book.appendChild(page);

      /* Tap zones: right 40% of any page = next, left 40% = prev */
      (function(idx) {
        page.addEventListener('click', function (e) {
          if (_flipping) return;
          /* Only respond to the topmost visible page */
          var r = page.getBoundingClientRect();
          var x = e.clientX - r.left;
          if (x > r.width * 0.60 && _pageIndex < 6) { window.calNextDay(); }
          else if (x < r.width * 0.40 && _pageIndex > 0) { window.calPrevDay(); }
        });
      }(i));
    }

    stage.appendChild(book);
    grid.appendChild(stage);

    /* Touch swipe support for mobile */
    var _touchX = 0;
    book.addEventListener('touchstart', function (e) {
      _touchX = e.touches[0].clientX;
    }, { passive: true });
    book.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - _touchX;
      if (Math.abs(dx) > 40) {
        if (dx < 0 && _pageIndex < 6) window.calNextDay();
        else if (dx > 0 && _pageIndex > 0) window.calPrevDay();
      }
    }, { passive: true });

    return stage;
  }

  /* Populate all 7 page fronts + backs with rendered content */
  function populateAllPages() {
    for (var i = 0; i < 7; i++) {
      var front = document.getElementById('calFpFront' + i);
      var back  = document.getElementById('calFpBack'  + i);
      if (front) front.innerHTML = buildPageHTML(i);
      /* Back face shows the NEXT page (what you'll see after flipping) */
      if (back)  back.innerHTML  = (i + 1 < 7) ? buildPageHTML(i + 1) : '<div class="cal-fp-end"><span>📅</span><div>End of week</div></div>';
    }
  }

  /* Sync flipped state to match _pageIndex without animation */
  function syncFlippedState() {
    for (var i = 0; i < 7; i++) {
      var page = document.getElementById('calFpPage' + i);
      if (!page) continue;
      if (i < _pageIndex) {
        page.classList.add('flipped');
        page.style.zIndex = String(7 - i);
      } else {
        page.classList.remove('flipped');
        page.style.zIndex = String(7 - i);
      }
    }
  }

  /* Render page content into a DOM node (not innerHTML on grid) */
  function buildPageHTML(dayIndex) {
    var dates     = getWeekDates();
    var dateObj   = dates[dayIndex];
    var ti        = todayIndex();
    var isT       = dayIndex === ti;
    var isP       = (function(){ var n=new Date(); n.setHours(0,0,0,0); return dates[dayIndex] < n; })();
    var isF       = (function(){ var n=new Date(); n.setHours(0,0,0,0); return dates[dayIndex] > n; })();
    var trends    = getTrends();
    var hasTrends = trends.length > 0;
    if (hasTrends && isT) predictBestTimes();

    var savedPosts = _weekData[dayIndex] || {};

    var usedSug = [];
    var slotSuggestions = SLOTS.map(function (slot, idx) {
      if (!hasTrends) return null;
      var tp = ['gt','yt','tt'];
      var t = bestTrendForPlat(tp[idx], usedSug);
      if (t) usedSug.push(t.topic);
      return t;
    });
    var slotDefPlat = ['li','yt','tt'];

    var h = '';

    /* ── Page tab (red header like a calendar pad) ── */
    h += '<div class="cal-page-tab">'
      + '<span class="cal-page-tab-month">' + MONTHS[dateObj.getMonth()].toUpperCase() + '</span>'
      + (isT ? '<span class="cal-today-pill" style="margin-left:auto">Today</span>' : '')
      + '</div>';

    /* ── Big date number ── */
    h += '<div class="cal-page-bigdate">'
      + '<span class="cal-page-dayname">' + DAYS_LONG[dateObj.getDay()] + '</span>'
      + '<span class="cal-page-daynum">' + dateObj.getDate() + '</span>'
      + '<div class="cal-page-curl"></div>'
      + '</div>';

    /* ── Day banner ── */
    h += '<div class="cal-page-inner">';

    if (isP) {
      h += '<div class="cal-day-banner cal-day-past">📖 Past day — review or edit your entries</div>';
    } else if (isF) {
      h += '<div class="cal-day-banner cal-day-future">📅 Planned — Dijo has auto-filled ideas. Tap any slot to customise.</div>';
    } else if (hasTrends) {
      var topT = trends.slice().sort(function(a,b){return b.score-a.score;})[0];
      var sl   = scoreLabel(topT.score);
      h += '<div class="cal-day-banner cal-day-today">'
        + '<span style="color:var(--text3);font-size:11px">Top trend: </span>'
        + '<span style="color:' + sl.color + ';font-weight:800">' + sl.text + '</span> '
        + '<span style="color:var(--text2)">' + escH(topT.topic.length > 38 ? topT.topic.slice(0,38)+'…' : topT.topic) + '</span>'
        + '</div>';
    } else {
      h += '<div class="cal-day-banner cal-day-today" style="color:var(--text3)">⏳ Scanning trends…</div>';
    }

    /* ── 3 Slot cards ── */
    SLOTS.forEach(function (slot, idx) {
      var post     = savedPosts[slot.id];
      var sug      = slotSuggestions[idx];
      var predTime = _predictedTimes[slot.id];

      h += '<div class="cal-slot-card' + (isP ? ' cal-slot-past' : '') + '">';
      h += '<div class="cal-slot-hdr">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-size:18px">' + slot.icon + '</span>'
        + '<div>'
        + '<div class="cal-slot-name">' + slot.label + '</div>'
        + '<div class="cal-slot-time">';
      if (hasTrends && isT) {
        h += '⏰ Best: <strong style="color:var(--gold)">' + escH(predTime) + '</strong>'
          + ' <span class="cal-time-source">· trend data</span>';
      } else {
        h += '<span style="color:var(--text3)">' + escH(slot.defaultTime) + '</span>';
      }
      h += '</div></div></div>';
      if (hasTrends && sug) {
        var pm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
        h += '<span class="cal-slot-plat-badge" style="color:' + pm.color + ';border-color:' + pm.color + '50">' + pm.icon + ' ' + pm.label + '</span>';
      }
      h += '</div>';

      if (post) {
        var pm2 = PLAT[post.plat] || PLAT.tt;
        var sm  = STATUS[post.status] || STATUS.draft;
        var sl2 = post.score ? scoreLabel(post.score) : null;
        h += '<div class="cal-post-body" style="border-left:3px solid ' + pm2.color + '">';
        h += '<div class="cal-post-meta-row">'
          + '<span class="cal-post-plat" style="color:' + pm2.color + ';background:' + pm2.color + '18">' + pm2.icon + ' ' + pm2.label + '</span>'
          + '<span class="cal-post-status" style="color:' + sm.color + '">' + sm.dot + ' ' + sm.label + '</span>';
        if (sl2) h += '<span class="cal-post-score" style="color:' + sl2.color + ';margin-left:auto">' + sl2.text + ' · ' + post.score.toFixed(1) + '</span>';
        if (post.autoFilled) h += '<span style="font-size:9px;color:var(--text3);font-family:\'DM Mono\',monospace;margin-left:4px">✨ Dijo</span>';
        h += '</div>';
        h += '<div class="cal-post-topic">' + escH(post.topic) + '</div>';
        if (post.notes) h += '<div class="cal-post-notes">' + escH(post.notes.slice(0,100)) + (post.notes.length > 100 ? '…' : '') + '</div>';
        if (post.postTime) h += '<div class="cal-post-posttime">⏰ <strong>' + escH(post.postTime) + '</strong></div>';
        h += '<div class="cal-post-btns">'
          + '<button class="cal-btn cal-btn-edit" onclick="window.calEditPost(\'' + slot.id + '\')">✏️ Edit</button>'
          + '<button class="cal-btn cal-btn-gen"  onclick="window.calGeneratePost(\'' + escJ(post.topic) + '\')">⚡ Generate</button>';
        var notifOn = isT && hasActiveNotif(slot.id);
        if (isT) {
          h += '<button class="cal-btn cal-btn-notif' + (notifOn ? ' notif-on' : '') + '" onclick="window.calEnableSlotNotif(\'' + slot.id + '\')" title="' + (notifOn ? 'Reminder set' : 'Set reminder') + '">' + (notifOn ? '🔔' : '🔕') + '</button>';
        }
        h += '<button class="cal-btn cal-btn-del" onclick="window.calDeletePost(\'' + slot.id + '\')">✕</button>';
        h += '</div>';
        h += '</div>';
      } else {
        if (sug) {
          var sugPm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
          var sugSl = scoreLabel(sug.score);
          h += '<div class="cal-sug-card" onclick="window.calAcceptSuggestion(\'' + slot.id + '\')">'
            + '<div class="cal-sug-row"><span class="cal-sug-label">✨ Dijo suggests</span>'
            + '<span style="font-size:10px;font-weight:800;font-family:\'DM Mono\',monospace;color:' + sugSl.color + '">' + sugSl.text + ' · ' + sug.score.toFixed(1) + '/10</span></div>'
            + '<div class="cal-sug-topic">' + escH(sug.topic) + '</div>'
            + '<div class="cal-sug-meta" style="color:' + sugPm.color + '">' + sugPm.icon + ' ' + sugPm.label + ' · Tap to schedule</div>'
            + '</div>';
        }
        h += '<button class="cal-add-btn" onclick="window.openModal(\'' + slot.id + '\')">＋ Add your own</button>';
        if (isT && 'Notification' in window && Notification.permission === 'default') {
          h += '<button class="cal-notif-nudge" onclick="window.calRequestNotifFromUI()">🔔 Enable posting reminders</button>';
        }
      }
      h += '</div>';
    });

    /* ── Page footer ── */
    h += '<div class="cal-page-footer">';
    h += '<span class="cal-page-num">' + (dayIndex + 1) + ' <span style="opacity:.4">/ 7</span></span>';
    if (_pageIndex < 6) {
      h += '<button class="cal-page-turn-btn" onclick="window.calNextDay()">Next ›</button>';
    } else {
      h += '<button class="cal-page-turn-btn" onclick="window.calGoToday()">↩ Today</button>';
    }
    h += '</div>';

    h += '</div>'; /* .cal-page-inner */

    return h;
  }

  function animateFlip(dir, cb) {
    if (_flipping) return;
    ensureBookDOM();
    _flipping = true;

    if (dir > 0) {
      /* Flip forward: flip page at current index */
      var pg = document.getElementById('calFpPage' + _pageIndex);
      if (pg) pg.classList.add('flipped');
    } else {
      /* Flip back: un-flip the previous page */
      var pgBack = document.getElementById('calFpPage' + (_pageIndex - 1));
      if (pgBack) pgBack.classList.remove('flipped');
    }

    setTimeout(function () {
      cb(); /* caller updates _pageIndex */
      populateAllPages();
      renderNavHeader();
      _flipping = false;
    }, 720);
  }

  /* ─── DATE HELPERS ───────────────────────────────────────────── */
  function dayLabel(dateObj) {
    return DAYS_LONG[dateObj.getDay()] + ', ' + dateObj.getDate() + ' ' + MONTHS[dateObj.getMonth()] + ' ' + dateObj.getFullYear();
  }
  function isPageToday()  { return _pageIndex === todayIndex(); }
  function isPagePast()   { var d=getWeekDates(); var n=new Date(); n.setHours(0,0,0,0); return d[_pageIndex]<n; }
  function isPageFuture() { var d=getWeekDates(); var n=new Date(); n.setHours(0,0,0,0); return d[_pageIndex]>n; }

  /* ─── RENDER SPINE ───────────────────────────────────────────── */
  function renderSpine() {
    /* Legacy — kept so nothing breaks; actual spine is renderSpineEl() */
    var dates = getWeekDates();
    var ti    = todayIndex();
    var h = '<div class="cal-spine">';
    for (var i = 0; i < 7; i++) {
      var cls = 'cal-spine-dot';
      if (i === _pageIndex) cls += ' active';
      if (i === ti)         cls += ' is-today';
      h += '<button class="' + cls + '" onclick="window.calGoToPage(' + i + ')" title="' + DAYS_LONG[dates[i].getDay()] + '">'
        + '<span class="cal-spine-day">' + DAYS_SHORT[dates[i].getDay()] + '</span>'
        + '<span class="cal-spine-num">' + dates[i].getDate() + '</span>'
        + '</button>';
    }
    return h + '</div>';
  }

  /* ─── RENDER GRID (stacked book) ────────────────────────────── */
  function renderGrid() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return;
    ensureBookDOM();
    populateAllPages();
    syncFlippedState();
    renderNavHeader();
  }

  /* ─── NAV HEADER (week label + prev/next arrows, replaces spine) ── */
  function renderNavHeader() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return;
    var existing = grid.querySelector('.cal-nav-header');
    var dates = getWeekDates();
    var ti    = todayIndex();
    var cur   = dates[_pageIndex];
    var weekStart = dates[0];
    var weekEnd   = dates[6];

    var weekLabel = MONTHS[weekStart.getMonth()] + ' ' + weekStart.getDate()
      + ' – ' + (weekStart.getMonth() !== weekEnd.getMonth() ? MONTHS[weekEnd.getMonth()] + ' ' : '')
      + weekEnd.getDate() + ', ' + weekEnd.getFullYear();

    /* Progress dots — 7 small dots, active = current page */
    var dots = '';
    for (var i = 0; i < 7; i++) {
      var isActive  = i === _pageIndex;
      var isToday   = i === ti;
      var isPast    = i < _pageIndex;
      dots += '<button class="cal-dot' + (isActive ? ' cal-dot-active' : '') + (isToday ? ' cal-dot-today' : '') + (isPast ? ' cal-dot-past' : '') + '" onclick="window.calGoToPage(' + i + ')" title="' + DAYS_LONG[dates[i].getDay()] + ' ' + dates[i].getDate() + '"></button>';
    }

    var h = '<div class="cal-nav-header">'
      + '<button class="cal-nav-btn" onclick="window.calPrevDay()" ' + (_pageIndex === 0 ? 'disabled' : '') + ' aria-label="Previous day">‹</button>'
      + '<div class="cal-nav-center">'
      + '<div class="cal-nav-week">' + weekLabel + '</div>'
      + '<div class="cal-dots">' + dots + '</div>'
      + '</div>'
      + '<button class="cal-nav-btn" onclick="window.calNextDay()" ' + (_pageIndex === 6 ? 'disabled' : '') + ' aria-label="Next day">›</button>'
      + '</div>';

    var tmp = document.createElement('div');
    tmp.innerHTML = h;
    var newNav = tmp.firstChild;
    if (existing) { existing.parentNode.replaceChild(newNav, existing); }
    else { grid.insertBefore(newNav, grid.firstChild); }
  }

  /* ─── OLD renderGrid body (unused, kept for reference) ────────── */
  function _renderGrid_old() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return;
    var dates     = getWeekDates();
    var dateObj   = dates[_pageIndex];
    var isT       = isPageToday();
    var isP       = isPagePast();
    var isF       = isPageFuture();
    var trends    = getTrends();
    var hasTrends = trends.length > 0;
    if (hasTrends && isT) predictBestTimes();

    /* Per-slot suggestions (avoid repeating topics) */
    var usedSug = [];
    var slotSuggestions = SLOTS.map(function (slot, idx) {
      if (!hasTrends) return null;
      var tp = ['gt','yt','tt'];
      var t = bestTrendForPlat(tp[idx], usedSug);
      if (t) usedSug.push(t.topic);
      return t;
    });
    var slotDefPlat = ['li','yt','tt'];

    var posts = dayPosts();
    var h = '';

    /* Spine */
    h += renderSpine();

    /* Page */
    h += '<div class="cal-page">';

    /* Day nav */
    h += '<div class="cal-day-nav">';
    h += '<button class="cal-nav-arrow" onclick="window.calPrevDay()"'
       + (_pageIndex === 0 ? ' disabled style="opacity:.3;cursor:default"' : '') + '>‹</button>';
    h += '<div class="cal-day-nav-center">';
    h += '<span class="cal-page-label">'
       + (isT ? '<span class="cal-today-pill">Today</span> ' : '')
       + escH(dayLabel(dateObj)) + '</span>';
    if (!isT) h += '<button class="cal-today-jump-btn" onclick="window.calGoToday()">Jump to today</button>';
    h += '</div>';
    h += '<button class="cal-nav-arrow" onclick="window.calNextDay()"'
       + (_pageIndex === 6 ? ' disabled style="opacity:.3;cursor:default"' : '') + '>›</button>';
    h += '</div>';

    /* Banner */
    if (isP) {
      h += '<div class="cal-day-banner cal-day-past">📖 Past day — review or edit your entries</div>';
    } else if (isF) {
      h += '<div class="cal-day-banner cal-day-future">📅 Planned — Dijo has auto-filled ideas. Tap any slot to customise.</div>';
    } else if (hasTrends) {
      var topT = trends.slice().sort(function(a,b){return b.score-a.score;})[0];
      var sl   = scoreLabel(topT.score);
      h += '<div class="cal-day-banner cal-day-today">'
        + '<span style="color:var(--text3);font-size:11px">Today\'s top trend: </span>'
        + '<span style="color:' + sl.color + ';font-weight:800">' + sl.text + '</span> '
        + '<span style="color:var(--text2)">' + escH(topT.topic.length > 42 ? topT.topic.slice(0,42)+'…' : topT.topic) + '</span>'
        + '<span style="color:var(--text3);margin-left:6px;font-family:\'DM Mono\',monospace;font-size:10px">' + topT.score.toFixed(1) + '/10</span>'
        + '</div>';
    } else {
      h += '<div class="cal-day-banner cal-day-today" style="color:var(--text3)">⏳ Scanning trends for you…</div>';
    }

    /* 3 Slot cards */
    SLOTS.forEach(function (slot, idx) {
      var post     = posts[slot.id];
      var sug      = slotSuggestions[idx];
      var predTime = _predictedTimes[slot.id];

      h += '<div class="cal-slot-card' + (isP ? ' cal-slot-past' : '') + '">';

      /* Header */
      h += '<div class="cal-slot-hdr">'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span style="font-size:18px">' + slot.icon + '</span>'
        + '<div>'
        + '<div class="cal-slot-name">' + slot.label + '</div>'
        + '<div class="cal-slot-time">';
      if (hasTrends && isT) {
        h += '⏰ Best: <strong style="color:var(--gold)">' + escH(predTime) + '</strong>'
          + ' <span class="cal-time-source">· trend data</span>';
      } else {
        h += '<span style="color:var(--text3)">' + escH(slot.defaultTime) + '</span>';
      }
      h += '</div></div></div>';
      if (hasTrends && sug) {
        var pm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
        h += '<span class="cal-slot-plat-badge" style="color:' + pm.color + ';border-color:' + pm.color + '50">' + pm.icon + ' ' + pm.label + '</span>';
      }
      h += '</div>'; /* .cal-slot-hdr */

      /* Post body or empty state */
      if (post) {
        var pm2 = PLAT[post.plat] || PLAT.tt;
        var sm  = STATUS[post.status] || STATUS.draft;
        var sl2 = post.score ? scoreLabel(post.score) : null;

        h += '<div class="cal-post-body" style="border-left:3px solid ' + pm2.color + '">';
        h += '<div class="cal-post-meta-row">'
          + '<span class="cal-post-plat" style="color:' + pm2.color + ';background:' + pm2.color + '18">' + pm2.icon + ' ' + pm2.label + '</span>'
          + '<span class="cal-post-status" style="color:' + sm.color + '">' + sm.dot + ' ' + sm.label + '</span>';
        if (sl2) h += '<span class="cal-post-score" style="color:' + sl2.color + ';margin-left:auto">' + sl2.text + ' · ' + post.score.toFixed(1) + '</span>';
        if (post.autoFilled) h += '<span style="font-size:9px;color:var(--text3);font-family:\'DM Mono\',monospace;margin-left:4px">✨ Dijo</span>';
        h += '</div>';
        h += '<div class="cal-post-topic">' + escH(post.topic) + '</div>';
        if (post.notes) h += '<div class="cal-post-notes">' + escH(post.notes.slice(0,100)) + (post.notes.length > 100 ? '…' : '') + '</div>';
        if (post.postTime) h += '<div class="cal-post-posttime">⏰ Scheduled: <strong>' + escH(post.postTime) + '</strong></div>';

        h += '<div class="cal-post-btns">'
          + '<button class="cal-btn cal-btn-edit" onclick="window.calEditPost(\'' + slot.id + '\')">✏️ Edit</button>'
          + '<button class="cal-btn cal-btn-gen"  onclick="window.calGeneratePost(\'' + escJ(post.topic) + '\')">⚡ Generate</button>';
        var notifOn = isT && hasActiveNotif(slot.id);
        if (isT) {
          h += '<button class="cal-btn cal-btn-notif' + (notifOn ? ' notif-on' : '') + '" onclick="window.calEnableSlotNotif(\'' + slot.id + '\')" title="' + (notifOn ? 'Reminder set' : 'Set reminder') + '">' + (notifOn ? '🔔' : '🔕') + '</button>';
        }
        h += '<button class="cal-btn cal-btn-del" onclick="window.calDeletePost(\'' + slot.id + '\')">✕</button>';
        h += '</div>';
        h += '</div>'; /* .cal-post-body */

      } else {
        if (sug) {
          var sugPm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
          var sugSl = scoreLabel(sug.score);
          h += '<div class="cal-sug-card" onclick="window.calAcceptSuggestion(\'' + slot.id + '\')">'
            + '<div class="cal-sug-row"><span class="cal-sug-label">✨ Dijo suggests</span>'
            + '<span style="font-size:10px;font-weight:800;font-family:\'DM Mono\',monospace;color:' + sugSl.color + '">' + sugSl.text + ' · ' + sug.score.toFixed(1) + '/10</span></div>'
            + '<div class="cal-sug-topic">' + escH(sug.topic) + '</div>'
            + '<div class="cal-sug-meta" style="color:' + sugPm.color + '">' + sugPm.icon + ' ' + sugPm.label + ' · Tap to schedule</div>'
            + '</div>';
        }
        h += '<button class="cal-add-btn" onclick="window.openModal(\'' + slot.id + '\')">＋ Add your own</button>';
        if (isT && 'Notification' in window && Notification.permission === 'default') {
          h += '<button class="cal-notif-nudge" onclick="window.calRequestNotifFromUI()">🔔 Enable posting reminders</button>';
        }
      }

      h += '</div>'; /* .cal-slot-card */
    });

    /* Page footer */
    h += '<div class="cal-page-footer">'
      + '<span class="cal-page-num">Page ' + (_pageIndex + 1) + ' of 7</span>';
    if (_pageIndex < 6) {
      h += '<button class="cal-page-turn-btn" onclick="window.calNextDay()">Next day ›</button>';
    } else {
      h += '<button class="cal-page-turn-btn" onclick="window.calGoToday()">Back to today</button>';
    }
    h += '</div>';
    h += '</div>'; /* .cal-page */

    grid.innerHTML = h;
  }

  /* ─── NAVIGATION ─────────────────────────────────────────────── */
  window.calPrevDay = function () {
    if (_pageIndex <= 0 || _flipping) return;
    animateFlip(-1, function () { _pageIndex--; });
  };
  window.calNextDay = function () {
    if (_pageIndex >= 6 || _flipping) return;
    animateFlip(1, function () { _pageIndex++; });
  };
  window.calGoToday = function () {
    var ti = todayIndex();
    if (_pageIndex === ti) return;
    window.calGoToPage(ti);
  };
  /* Jump multiple pages — flip one at a time with 120ms between each */
  window.calGoToPage = function (idx) {
    if (idx === _pageIndex || _flipping) return;
    var dir = idx > _pageIndex ? 1 : -1;
    function flipOne() {
      if (_pageIndex === idx) { renderNavHeader(); return; }
      animateFlip(dir, function () {
        _pageIndex += dir;
        if (_pageIndex !== idx) setTimeout(flipOne, 130);
        else renderNavHeader();
      });
    }
    flipOne();
  };
  window.calPrevWeek = window.calPrevDay;
  window.calNextWeek = window.calNextDay;

  /* ─── PUBLIC AUTO-FILL ───────────────────────────────────────── */
  window.calAutoFill = function () {
    var btn = document.getElementById('calAutoBtn');
    if (!getTrends().length) {
      if (typeof toast === 'function') toast('⏳ Trends still loading — try in a moment');
      return;
    }
    autoFillAllDays(true);
    scheduleAllNotifications();
    renderGrid();
    if (typeof toast === 'function') toast('✨ All 7 days filled by Dijo!' + (Notification.permission === 'granted' ? ' 🔔 Reminders set.' : ''));
    if (btn) {
      btn.textContent = '✅ Done!'; btn.style.background = 'var(--green)';
      setTimeout(function () { btn.textContent = '✨ Auto-Fill'; btn.style.background = ''; }, 2000);
    }
  };

  /* ─── ACCEPT SUGGESTION ──────────────────────────────────────── */
  window.calAcceptSuggestion = function (slotId) {
    var idx = SLOTS.findIndex(function (s) { return s.id === slotId; });
    if (idx === -1) return;
    var tp = ['gt','yt','tt'], pd = ['li','yt','tt'];
    var trend = bestTrendForPlat(tp[idx]);
    if (!trend) return;
    predictBestTimes();
    setDayPost(slotId, {
      topic: trend.topic, plat: pd[idx], status: 'scheduled', notes: '',
      score: trend.score, postTime: _predictedTimes[slotId],
      autoFilled: true, createdAt: new Date().toISOString()
    });
    saveWeek();
    if (isPageToday()) schedulePostNotification(slotId, dayPosts()[slotId]);
    renderGrid();
    if (typeof toast === 'function') toast('✅ Scheduled: ' + trend.topic);
  };

  /* ─── MODAL — OPEN / EDIT / CLOSE ───────────────────────────── */
  window.openModal = function (slotId) {
    _editSlot = null; _modalSlotId = slotId || 'morning';
    var idx = Math.max(SLOTS.findIndex(function(s){return s.id===_modalSlotId;}), 0);
    var pd = ['li','yt','tt'], tp = ['gt','yt','tt'];
    _modalPlat = pd[idx];
    var trend = getTrends().length ? bestTrendForPlat(tp[idx]) : null;
    _showModal({ title: 'Add Post — ' + SLOTS[idx].label, topic: trend ? trend.topic : '', notes: '', status: 'scheduled', plat: _modalPlat });
  };

  window.calEditPost = function (slotId) {
    var post = dayPosts()[slotId]; if (!post) return;
    _editSlot = slotId; _modalSlotId = slotId; _modalPlat = post.plat || 'tt';
    var idx = Math.max(SLOTS.findIndex(function(s){return s.id===slotId;}), 0);
    _showModal({ title: 'Edit Post — ' + (SLOTS[idx]||SLOTS[0]).label, topic: post.topic, notes: post.notes||'', status: post.status||'draft', plat: post.plat||'tt' });
  };

  function _showModal(opts) {
    var ov = document.getElementById('calModalOverlay'); if (!ov) return;
    var set = function(id,v){var e=document.getElementById(id);if(e)e.value=v;};
    var txt = function(id,v){var e=document.getElementById(id);if(e)e.textContent=v;};
    txt('calModalTitle', opts.title); set('calModalInput', opts.topic); set('calModalNotes', opts.notes); set('calModalStatus', opts.status);
    document.querySelectorAll('.cal-modal-plat').forEach(function(b){b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');});
    var a = document.querySelector('.cal-modal-plat[data-plat="' + opts.plat + '"]');
    if (a) a.classList.add('sel-' + opts.plat);
    _modalPlat = opts.plat;
    ov.classList.add('open');
    var inp = document.getElementById('calModalInput');
    if (inp) setTimeout(function(){inp.focus();inp.select();}, 80);
  }

  window.closeModal = function () {
    var ov = document.getElementById('calModalOverlay'); if (ov) ov.classList.remove('open'); _editSlot = null;
  };
  window.calModalSelectPlat = function (btn, plat) {
    document.querySelectorAll('.cal-modal-plat').forEach(function(b){b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');});
    if (btn) btn.classList.add('sel-' + plat); _modalPlat = plat;
  };

  /* ─── SAVE / DELETE POST ─────────────────────────────────────── */
  window.savePost = function () {
    var inp = document.getElementById('calModalInput');
    var notes = document.getElementById('calModalNotes');
    var status = document.getElementById('calModalStatus');
    var topic = inp ? inp.value.trim() : '';
    if (!topic) { if (inp){inp.focus();inp.style.outline='2px solid var(--gold)';} if(typeof toast==='function')toast('⚠️ Enter a topic first'); return; }
    if (inp) inp.style.outline = '';
    var trends = getTrends();
    var matched = trends.find(function(t){return t.topic.toLowerCase()===topic.toLowerCase();});
    var slotId = _editSlot || _modalSlotId || 'morning';
    if (isPageToday()) predictBestTimes();
    var existing = dayPosts()[slotId] || {};
    setDayPost(slotId, {
      topic: topic, plat: _modalPlat, status: status ? status.value : 'draft',
      notes: notes ? notes.value.trim() : '',
      score: matched ? matched.score : (existing.score || null),
      postTime: _predictedTimes[slotId], autoFilled: false,
      createdAt: existing.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    saveWeek();
    if (isPageToday()) schedulePostNotification(slotId, dayPosts()[slotId]);
    closeModal(); renderGrid();
    if (typeof toast === 'function') toast('✅ Post saved!' + (isPageToday() && Notification.permission === 'granted' ? ' 🔔 Reminder set.' : ''));
  };

  window.calDeletePost = function (slotId) {
    if (!dayPosts()[slotId]) return;
    deleteDayPost(slotId); cancelNotification(slotId); saveWeek(); renderGrid();
    if (typeof toast === 'function') toast('🗑 Removed');
  };

  /* ─── GENERATE ───────────────────────────────────────────────── */
  window.generateFromCalendar = function () {
    var topic = ''; var posts = dayPosts();
    SLOTS.forEach(function(s){if(!topic&&posts[s.id]&&posts[s.id].topic)topic=posts[s.id].topic;});
    if (!topic) { var t=getTrends(); if(t.length)topic=t[0].topic; }
    if (topic && typeof loadTopic === 'function') { loadTopic(topic); }
    else if (typeof switchTab === 'function') { switchTab('generator', null); }
  };
  window.calGeneratePost = function (topic) { if (topic && typeof loadTopic === 'function') loadTopic(topic); };

  /* ─── DIJO SUGGEST ───────────────────────────────────────────── */
  window.calSuggestIdea = function () {
    var btn = document.getElementById('calDijoSuggestBtn');
    var inp = document.getElementById('calModalInput'); if (!inp) return;
    var DIJO = window.DIJO || 'https://impactgrid-dijo.onrender.com';
    var idx  = Math.max(SLOTS.findIndex(function(s){return s.id===_modalSlotId;}), 0);
    var slot = SLOTS[idx];
    var trends = getTrends();
    var topT = trends.length ? trends[0].topic : 'trending topics';
    var platNm = (PLAT[_modalPlat]||{label:'social'}).label;
    var pred   = _predictedTimes[_modalSlotId] || slot.defaultTime;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Asking Dijo…'; }
    fetch(DIJO + '/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Suggest ONE content topic for ' + platNm + ' at ' + pred + '. Top trend: "' + topT + '". Reply with ONLY the topic — max 8 words.', mode: 'creator' })
    })
    .then(function(r){return r.json();})
    .then(function(d){if(inp&&d.reply)inp.value=d.reply.trim().replace(/^["'`]|["'`]$/g,'');if(inp)inp.focus();})
    .catch(function(){if(inp&&trends.length)inp.value=trends[0].topic;})
    .finally(function(){if(btn){btn.disabled=false;btn.textContent='✨ Suggest with Dijo';}});
  };

  /* ─── NOTIFICATIONS ──────────────────────────────────────────── */
  function initPushSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then(function (reg) {
      return reg.pushManager.getSubscription();
    }).then(function (existing) {
      if (existing) return; // already subscribed
      if (Notification.permission !== 'granted') return;
      var vapidKey = localStorage.getItem('ig_vapid_pub') || '';
      if (!vapidKey) return;
      function urlB64ToUint8(b64) {
        var pad = '='.repeat((4 - b64.length % 4) % 4);
        var b64s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
        var raw = atob(b64s); var arr = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
      }
      navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(vapidKey) });
      }).then(function (sub) {
        if (!sub) return;
        fetch('/api/push-subscribe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(sub) }).catch(function(){});
      }).catch(function(){});
    }).catch(function(){});
  }

  function requestNotifPermission(cb) {
    if (!('Notification' in window)) { if (cb) cb(false); return; }
    if (Notification.permission === 'granted') { if (cb) cb(true); return; }
    if (Notification.permission === 'denied')  { if (cb) cb(false); return; }
    Notification.requestPermission().then(function (p) {
      var g = p === 'granted';
      if (g) initPushSubscription();
      if (cb) cb(g);
    });
  }

  function parseTimeToDate(ts) {
    var m = String(ts).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i); if (!m) return null;
    var h = parseInt(m[1],10), min = parseInt(m[2],10), mer = m[3].toUpperCase();
    if (mer==='PM'&&h!==12) h+=12; if (mer==='AM'&&h===12) h=0;
    var t = new Date(); t.setHours(h,min,0,0);
    return t > new Date() ? t : null;
  }

  function schedulePostNotification(slotId, post) {
    if (!post || !post.postTime) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (_notifTimers[slotId]) { clearTimeout(_notifTimers[slotId]); delete _notifTimers[slotId]; }
    var fireAt = parseTimeToDate(post.postTime); if (!fireAt) return;
    var delay = fireAt.getTime() - Date.now();
    var pm = PLAT[post.plat] || PLAT.tt;
    var slotMeta = SLOTS.find(function(s){return s.id===slotId;}) || SLOTS[0];
    _notifTimers[slotId] = setTimeout(function () {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: '⏰ Time to post on ' + pm.label + '!',
          body: pm.icon + ' ' + (post.topic || 'Your post') + '\n' + slotMeta.label + ' · ' + post.postTime,
          url: '/creator-studio.html#calendar', tag: 'ig-cal-' + slotId
        });
      } else {
        try {
          new Notification('⏰ Time to post on ' + pm.label + '!', {
            body: pm.icon + ' ' + (post.topic || 'Your post'),
            icon: '/logo.png', badge: '/logo.png', tag: 'ig-cal-' + slotId, renotify: true
          });
        } catch (e) {}
      }
      delete _notifTimers[slotId];
    }, delay);
  }

  function scheduleAllNotifications() {
    if (Notification.permission !== 'granted') return;
    var ti = todayIndex();
    var todayData = _weekData[ti] || {};
    Object.keys(todayData).forEach(function (slotId) {
      schedulePostNotification(slotId, todayData[slotId]);
    });
  }

  function cancelNotification(slotId) {
    if (_notifTimers[slotId]) { clearTimeout(_notifTimers[slotId]); delete _notifTimers[slotId]; }
  }
  function hasActiveNotif(slotId) { return !!_notifTimers[slotId]; }

  window.calEnableSlotNotif = function (slotId) {
    requestNotifPermission(function (granted) {
      if (!granted) { if(typeof toast==='function')toast('🔕 Notifications blocked — enable in browser settings'); return; }
      var post = dayPosts()[slotId];
      if (!post) { if(typeof toast==='function')toast('⚠️ Add a post to this slot first'); return; }
      schedulePostNotification(slotId, post);
      var fireAt = parseTimeToDate(post.postTime);
      if (typeof toast === 'function') toast(fireAt ? '🔔 Reminder set for ' + post.postTime + '!' : '⚠️ That time has already passed today');
      renderGrid();
    });
  };

  window.calRequestNotifFromUI = function () {
    requestNotifPermission(function (granted) {
      if (granted) { scheduleAllNotifications(); if(typeof toast==='function')toast('🔔 Posting reminders enabled!'); }
      else { if(typeof toast==='function')toast('🔕 Notifications blocked — check browser settings'); }
      renderGrid();
    });
  };

  /* ─── COOKIE / TERMS BANNER ──────────────────────────────────── */
  function initCookieBanner() {
    if (localStorage.getItem('ig_cookies_accepted') === '1') return;
    if (document.getElementById('igCookieBanner')) return;

    var style = document.createElement('style');
    style.textContent = `
      #igCookieBanner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
        background: var(--card, #fff); border-top: 1px solid var(--border, #e0e0e0);
        box-shadow: 0 -4px 24px rgba(0,0,0,.14); padding: 14px 20px;
        font-family: 'DM Sans', sans-serif; animation: cookieUp .3s ease-out;
      }
      @keyframes cookieUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
      .ig-ck-inner { max-width: 900px; margin: 0 auto; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      .ig-ck-icon  { font-size: 22px; flex-shrink: 0; }
      .ig-ck-text  { flex: 1; font-size: 13px; color: var(--text2, #555); line-height: 1.5; min-width: 180px; }
      .ig-ck-text strong { color: var(--text, #111); }
      .ig-ck-text a { color: var(--gold, #c97e08); font-weight: 600; text-decoration: none; }
      .ig-ck-text a:hover { text-decoration: underline; }
      .ig-ck-btns { display: flex; gap: 8px; flex-shrink: 0; }
      .ig-ck-accept {
        padding: 8px 22px; border-radius: 8px;
        background: linear-gradient(135deg, var(--gold, #c97e08), #e07b08);
        color: #fff; font-size: 13px; font-weight: 700;
        border: none; cursor: pointer; font-family: inherit;
      }
      .ig-ck-accept:hover { opacity: .88; }
      .ig-ck-decline {
        padding: 8px 16px; border-radius: 8px;
        border: 1px solid var(--border, #ddd); background: transparent;
        color: var(--text3, #999); font-size: 13px; cursor: pointer; font-family: inherit;
      }
      .ig-ck-decline:hover { background: var(--bg2, #f5f5f5); }
      @media(max-width:540px){ .ig-ck-inner{flex-direction:column;align-items:flex-start;} .ig-ck-btns{width:100%;} .ig-ck-accept,.ig-ck-decline{flex:1;text-align:center;} }
    `;
    document.head.appendChild(style);

    var banner = document.createElement('div');
    banner.id  = 'igCookieBanner';
    banner.innerHTML = '<div class="ig-ck-inner">'
      + '<span class="ig-ck-icon">🍪</span>'
      + '<div class="ig-ck-text"><strong>ImpactGrid uses cookies</strong> to save your calendar and preferences. By continuing you agree to our '
      + '<a href="/terms.html" target="_blank" rel="noopener">Terms</a> and '
      + '<a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</div>'
      + '<div class="ig-ck-btns">'
      + '<button id="igCkAccept" class="ig-ck-accept">Accept &amp; continue</button>'
      + '<button id="igCkDecline" class="ig-ck-decline">Decline</button>'
      + '</div></div>';
    document.body.appendChild(banner);

    function dismiss() {
      banner.style.transition = 'transform .28s ease-in, opacity .28s';
      banner.style.transform  = 'translateY(100%)';
      banner.style.opacity    = '0';
      setTimeout(function(){ banner.remove(); }, 300);
    }
    document.getElementById('igCkAccept').onclick  = function () { localStorage.setItem('ig_cookies_accepted', '1'); dismiss(); };
    document.getElementById('igCkDecline').onclick = function () { dismiss(); };
  }

  /* ─── CSS ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('_calStyles')) return;
    var s = document.createElement('style');
    s.id = '_calStyles';
    s.textContent = `
      #calWeekGrid { display: block !important; overflow: visible; }

      /* ── Stacked book flip (p.html gallery mechanic) ── */
      .cal-book-stage {
        padding: 4px 0 8px;
      }
      .cal-book {
        position: relative;
        width: 100%;
        perspective: 1400px;
        cursor: pointer;
      }
      /* The first (unflipped) page drives the height; all others sit on top of it */
      .cal-fp-page {
        position: absolute;
        top: 0; left: 0; right: 0;
        transform-origin: left center;
        transform-style: preserve-3d;
        transition: transform 0.7s cubic-bezier(0.645, 0.045, 0.355, 1);
        border-radius: 4px 12px 12px 4px;
        box-shadow: 6px 0 32px rgba(0,0,0,.35), -2px 0 6px rgba(0,0,0,.15);
      }
      /* Page 0 is position:relative so it sets the container height */
      .cal-fp-page:first-child {
        position: relative;
      }
      .cal-fp-page.flipped {
        transform: rotateY(-180deg);
      }
      /* Front and back faces */
      .cal-fp-front, .cal-fp-back {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        border-radius: 4px 12px 12px 4px;
        background: var(--card);
        border: 1px solid var(--border);
      }
      .cal-fp-front {
        position: relative; /* drives the page height — grows with content */
        width: 100%;
        overflow: visible;
      }
      .cal-fp-back {
        position: absolute;
        inset: 0;
        transform: rotateY(180deg);
        border-radius: 12px 4px 4px 12px;
        overflow: visible;
      }
      /* Spine shadow crease on each page */
      .cal-fp-front::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 22px;
        background: linear-gradient(to right, rgba(0,0,0,.2), rgba(0,0,0,.04) 60%, transparent);
        pointer-events: none;
        z-index: 2;
        border-radius: 4px 0 0 4px;
      }
      .cal-fp-back::before {
        content: '';
        position: absolute;
        right: 0; top: 0; bottom: 0;
        width: 22px;
        background: linear-gradient(to left, rgba(0,0,0,.2), rgba(0,0,0,.04) 60%, transparent);
        pointer-events: none;
        z-index: 2;
        border-radius: 0 4px 4px 0;
      }
      /* End-of-week placeholder */
      .cal-fp-end {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--text3);
        font-family: 'Syne', sans-serif;
        font-size: 14px;
      }
      .cal-fp-end span { font-size: 36px; }

      /* ── Page tab (red top strip like a calendar pad) ── */
      .cal-page-tab {
        background: #c0392b;
        border-radius: 3px 12px 0 0;
        padding: 9px 16px 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 0;
      }
      .cal-page-tab-month {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        font-weight: 800;
        color: rgba(255,255,255,.9);
        letter-spacing: .14em;
      }

      /* ── Big date number with page-curl ── */
      .cal-page-bigdate {
        background: var(--card);
        border-bottom: 1px solid var(--border);
        padding: 14px 20px 10px;
        display: flex;
        align-items: baseline;
        gap: 14px;
        position: relative;
        overflow: hidden;
      }
      .cal-page-dayname {
        font-family: 'Syne', sans-serif;
        font-size: 13px;
        font-weight: 700;
        color: var(--text3);
        text-transform: uppercase;
        letter-spacing: .1em;
      }
      .cal-page-daynum {
        font-family: 'Syne', sans-serif;
        font-size: 72px;
        font-weight: 900;
        color: var(--text);
        line-height: 1;
      }
      .cal-page-curl {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, transparent 50%, var(--bg2) 50%, var(--border) 70%, var(--card) 100%);
        border-radius: 48px 0 0 0;
        opacity: .7;
      }

      /* ── Week nav header ── */
      .cal-nav-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 0 16px;
      }
      .cal-nav-btn {
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--text2);
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        transition: all .15s;
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-family: inherit;
      }
      .cal-nav-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); background: var(--gold-dim, rgba(201,126,8,.06)); }
      .cal-nav-btn:disabled { opacity: .25; cursor: default; }
      .cal-nav-center {
        flex: 1;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
      }
      .cal-nav-week {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        font-weight: 700;
        color: var(--text3);
        letter-spacing: .05em;
        text-transform: uppercase;
      }
      .cal-dots {
        display: flex; gap: 6px; align-items: center;
      }
      .cal-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        border: none;
        background: var(--border);
        cursor: pointer;
        transition: all .2s;
        padding: 0;
      }
      .cal-dot-past { background: var(--text3); opacity: .35; }
      .cal-dot-active { background: var(--gold); transform: scale(1.5); box-shadow: 0 0 6px var(--gold-glo, rgba(201,126,8,.4)); }
      .cal-dot-today { outline: 2px solid var(--gold); outline-offset: 2px; }
      .cal-dot:hover { background: var(--gold); opacity: .7; }

      .cal-page-inner { display:flex; flex-direction:column; gap:10px; padding:14px 16px 20px; }
      .cal-today-pill { display:inline-block; padding:2px 10px; border-radius:99px; background:var(--gold); color:#fff; font-size:10px; font-weight:800; margin-left:auto; vertical-align:middle; font-family:'DM Mono',monospace; letter-spacing:.04em; }
      [data-theme="dark"] .cal-today-pill { color:#07090f; }
      .cal-today-jump-btn { padding:3px 12px; border-radius:99px; border:1px solid var(--gold-glo,rgba(201,126,8,.4)); background:var(--gold-dim,rgba(201,126,8,.08)); color:var(--gold); font-size:11px; font-weight:700; cursor:pointer; font-family:'DM Mono',monospace; transition:background .15s; }
      .cal-today-jump-btn:hover { background:rgba(201,126,8,.16); }
      .cal-day-banner { padding:10px 14px; border-radius:10px; font-size:12px; font-weight:600; font-family:'DM Mono',monospace; line-height:1.5; display:flex; align-items:flex-start; flex-wrap:wrap; gap:4px; }
      .cal-day-today  { background:var(--card); border:1px solid var(--border); }
      .cal-day-past   { background:transparent; border:1px dashed var(--border); color:var(--text3); }
      .cal-day-future { background:var(--gold-dim,rgba(201,126,8,.05)); border:1px dashed var(--gold-glo,rgba(201,126,8,.25)); color:var(--gold); }

      .cal-slot-card { background:var(--card); border:1px solid var(--border); border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:10px; transition:border-color .2s, box-shadow .2s; }
      .cal-slot-card:hover { border-color:var(--gold-glo,rgba(201,126,8,.3)); box-shadow: 0 2px 12px rgba(0,0,0,.06); }
      .cal-slot-past { opacity:.75; }
      .cal-slot-hdr  { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .cal-slot-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:800; color:var(--text); }
      .cal-slot-time { font-family:'DM Mono',monospace; font-size:11px; color:var(--text3); margin-top:1px; }
      .cal-time-source { font-size:10px; color:var(--text3); opacity:.6; }
      .cal-slot-plat-badge { font-size:10px; font-weight:800; font-family:'DM Mono',monospace; padding:3px 10px; border-radius:99px; border:1px solid; opacity:.85; white-space:nowrap; flex-shrink:0; }

      .cal-sug-card { background:var(--gold-dim,rgba(201,126,8,.04)); border:1px dashed var(--gold-glo,rgba(201,126,8,.25)); border-radius:10px; padding:11px 13px; cursor:pointer; display:flex; flex-direction:column; gap:5px; transition:background .15s, border-color .15s; }
      .cal-sug-card:hover { background:rgba(201,126,8,.09); border-color:var(--gold); border-style:solid; }
      .cal-sug-row   { display:flex; align-items:center; justify-content:space-between; gap:8px; }
      .cal-sug-label { font-size:10px; font-weight:800; color:var(--gold); font-family:'DM Mono',monospace; text-transform:uppercase; letter-spacing:.07em; }
      .cal-sug-topic { font-size:13px; font-weight:700; color:var(--text); line-height:1.35; }
      .cal-sug-meta  { font-size:10px; font-weight:700; font-family:'DM Mono',monospace; }

      .cal-add-btn { padding:10px; border-radius:10px; border:1px dashed var(--border); background:transparent; color:var(--text3); font-size:12px; cursor:pointer; text-align:center; transition:all .15s; width:100%; font-family:inherit; letter-spacing:.02em; }
      .cal-add-btn:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-dim,rgba(201,126,8,.05)); }

      .cal-post-body { background:var(--bg2); border-radius:10px; border:1px solid var(--border); padding:11px 13px; display:flex; flex-direction:column; gap:6px; }
      .cal-post-meta-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
      .cal-post-plat { font-size:10px; font-weight:800; font-family:'DM Mono',monospace; padding:2px 9px; border-radius:99px; letter-spacing:.04em; }
      .cal-post-status { font-size:10px; font-weight:700; font-family:'DM Mono',monospace; }
      .cal-post-score  { font-size:10px; font-weight:800; font-family:'DM Mono',monospace; }
      .cal-post-topic  { font-size:14px; font-weight:700; color:var(--text); line-height:1.35; word-break:break-word; }
      .cal-post-notes  { font-size:11px; color:var(--text3); font-style:italic; line-height:1.5; }
      .cal-post-posttime { font-size:11px; color:var(--text3); font-family:'DM Mono',monospace; }
      .cal-post-posttime strong { color:var(--gold); }
      .cal-post-btns { display:flex; gap:6px; flex-wrap:wrap; margin-top:2px; }
      .cal-btn { padding:6px 13px; border-radius:8px; font-size:11px; font-weight:700; border:1px solid var(--border); background:transparent; cursor:pointer; transition:background .12s; font-family:inherit; color:var(--text2); }
      .cal-btn-edit:hover { background:var(--bg2); }
      .cal-btn-gen  { color:var(--gold); border-color:var(--gold-glo,rgba(201,126,8,.3)); }
      .cal-btn-gen:hover { background:var(--gold-dim,rgba(201,126,8,.12)); }
      .cal-btn-notif { color:var(--text3); }
      .cal-btn-notif:hover { background:rgba(255,200,0,.1); color:var(--gold); border-color:var(--gold-glo,rgba(201,126,8,.3)); }
      .cal-btn-notif.notif-on { color:var(--gold); border-color:var(--gold-glo,rgba(201,126,8,.4)); background:var(--gold-dim,rgba(201,126,8,.08)); }
      .cal-btn-del  { color:var(--text3); margin-left:auto; }
      .cal-btn-del:hover { background:rgba(255,60,60,.08); color:#ff4444; border-color:rgba(255,60,60,.25); }

      .cal-notif-nudge { width:100%; padding:8px; border-radius:9px; border:1px dashed rgba(201,126,8,.3); background:transparent; color:var(--gold); font-size:11px; font-weight:700; font-family:'DM Mono',monospace; cursor:pointer; text-align:center; transition:all .15s; }
      .cal-notif-nudge:hover { background:var(--gold-dim,rgba(201,126,8,.08)); border-style:solid; }

      .cal-page-footer { display:flex; align-items:center; justify-content:space-between; padding:12px 0 2px; border-top:1px solid var(--border); margin-top:2px; }
      .cal-page-num { font-family:'DM Mono',monospace; font-size:12px; font-weight:700; color:var(--text3); }
      .cal-page-turn-btn { padding:7px 16px; border-radius:99px; font-size:12px; font-weight:700; border:1px solid var(--border); background:transparent; color:var(--text2); cursor:pointer; transition:all .15s; font-family:inherit; }
      .cal-page-turn-btn:hover { border-color:var(--gold); color:var(--gold); background:var(--gold-dim,rgba(201,126,8,.06)); }

      .cal-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:9000; display:none; align-items:center; justify-content:center; padding:20px; }
      .cal-modal-overlay.open { display:flex; }
      .cal-modal { background:var(--card); border:1px solid var(--border); border-radius:16px; width:100%; max-width:420px; box-shadow:0 20px 60px rgba(0,0,0,.4); }
      .cal-modal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border); }
      .cal-modal-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; }
      .cal-modal-close { width:28px; height:28px; border-radius:50%; border:1px solid var(--border); background:transparent; cursor:pointer; font-size:13px; color:var(--text3); display:flex; align-items:center; justify-content:center; transition:background .15s; }
      .cal-modal-close:hover { background:var(--bg2); }
      .cal-modal-body { padding:16px 18px; display:flex; flex-direction:column; gap:6px; }
      .cal-modal-label { font-size:11px; font-weight:700; color:var(--text3); text-transform:uppercase; letter-spacing:.06em; font-family:'DM Mono',monospace; margin-bottom:2px; }
      .cal-modal-input { width:100%; padding:10px 12px; border-radius:9px; border:1px solid var(--border); background:var(--bg2); color:var(--text); font-size:13px; font-family:inherit; box-sizing:border-box; outline:none; transition:border-color .15s; }
      .cal-modal-input:focus { border-color:var(--gold); }
      .cal-dijo-suggest-btn { padding:7px 14px; border-radius:8px; border:1px solid var(--gold-glo,rgba(201,126,8,.35)); background:var(--gold-dim,rgba(201,126,8,.08)); color:var(--gold); font-size:12px; font-weight:700; cursor:pointer; transition:background .15s; align-self:flex-start; font-family:inherit; }
      .cal-dijo-suggest-btn:hover { background:rgba(201,126,8,.16); }
      .cal-modal-plats { display:flex; gap:6px; flex-wrap:wrap; }
      .cal-modal-plat { padding:6px 12px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--text2); font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; font-family:inherit; }
      .cal-modal-plat.sel-tt { border-color:#ff2d55; background:rgba(255,45,85,.1); color:#ff2d55; }
      .cal-modal-plat.sel-yt { border-color:#FFD700; background:rgba(255,215,0,.1); color:#FFD700; }
      .cal-modal-plat.sel-ig { border-color:#a855f7; background:rgba(168,85,247,.1); color:#a855f7; }
      .cal-modal-plat.sel-li { border-color:#0a66c2; background:rgba(10,102,194,.1); color:#0a66c2; }
      .cal-modal-status { width:100%; padding:9px 12px; border-radius:9px; border:1px solid var(--border); background:var(--bg2); color:var(--text); font-size:13px; font-family:inherit; outline:none; cursor:pointer; }
      .cal-modal-notes { width:100%; padding:10px 12px; border-radius:9px; border:1px solid var(--border); background:var(--bg2); color:var(--text); font-size:13px; font-family:inherit; resize:vertical; min-height:70px; box-sizing:border-box; outline:none; transition:border-color .15s; }
      .cal-modal-notes:focus { border-color:var(--gold); }
      .cal-modal-footer { padding:12px 18px; border-top:1px solid var(--border); display:flex; gap:8px; justify-content:flex-end; }
      .cal-modal-save { padding:9px 20px; border-radius:9px; background:linear-gradient(135deg,var(--gold),var(--gold2,#e07b08)); color:#fff; font-size:13px; font-weight:700; border:none; cursor:pointer; font-family:'Syne',sans-serif; transition:opacity .15s; }
      .cal-modal-save:hover { opacity:.9; }
      .cal-modal-cancel { padding:9px 16px; border-radius:9px; border:1px solid var(--border); background:transparent; color:var(--text2); font-size:13px; cursor:pointer; transition:background .15s; font-family:inherit; }
      .cal-modal-cancel:hover { background:var(--bg2); }

      @media(max-width:480px) {
        .cal-nav-week { font-size:10px; }
        .cal-nav-btn { width:32px; height:32px; font-size:18px; }
        .cal-page-daynum { font-size:52px; }
        .cal-page-inner { padding:10px 12px 14px; gap:10px; }
        .cal-slot-card { padding:12px 13px; }
        .cal-book-stage { padding:0; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ─── PUBLIC ENTRY POINT ─────────────────────────────────────── */
  window.loadCalendar = function () {
    injectStyles();
    initCookieBanner();
    loadWeek();
    pruneOldWeeks();
    _pageIndex  = todayIndex();
    _autoFilled = false;

    requestNotifPermission(function (granted) {
      if (granted) { initPushSubscription(); scheduleAllNotifications(); }
    });

    renderGrid();

    /* Poll for trends, then auto-fill all 7 days */
    var attempts = 0;
    var poll = setInterval(function () {
      attempts++;
      var trends = getTrends();
      if (trends.length || attempts > 40) {
        clearInterval(poll);
        if (trends.length && !_autoFilled) {
          _autoFilled = true;
          var filled = autoFillAllDays(false);
          if (filled) scheduleAllNotifications();
          renderGrid();
        }
      }
    }, 300);
  };

  /* ─── KEYBOARD ───────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var ov = document.getElementById('calModalOverlay');
    if (!ov || !ov.classList.contains('open')) {
      if (e.key === 'ArrowLeft')  { window.calPrevDay(); return; }
      if (e.key === 'ArrowRight') { window.calNextDay(); return; }
    }
    if (ov && ov.classList.contains('open')) {
      if (e.key === 'Escape') window.closeModal();
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); window.savePost(); }
    }
  });

  /* ─── AUTO-INIT ──────────────────────────────────────────────── */
  function maybeInit() {
    injectStyles();
    initCookieBanner();
    var panel = document.getElementById('panel-calendar');
    if (panel && panel.classList.contains('active')) window.loadCalendar();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeInit);
  } else {
    maybeInit();
  }

})();
