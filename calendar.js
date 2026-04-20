/* ═══════════════════════════════════════════════════════════
   IMPACTGRID CONTENT CALENDAR — calendar.js
   ─────────────────────────────────────────────────────────
   BEHAVIOUR:
   • Multi-day calendar — flip between any day like a book
   • 3 slots per day: Morning · Afternoon · Evening
   • Posting times PREDICTED from live trend data (today only)
   • Auto-Fill drops top trend per platform into today's slots
   • Posts keyed by YYYYMMDD — each day is independent
   • Pruning keeps last 30 days, clears anything older
   • Page-flip animation when navigating days
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── STORAGE ────────────────────────────────────────────────── */
  var STORAGE_PREFIX = 'ig_cal_';

  function dateKey(d) {
    /* Returns YYYYMMDD string for any Date object */
    return STORAGE_PREFIX
      + d.getFullYear()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');
  }

  function dateFromOffset(offset) {
    /* Returns a new Date object offset days from today */
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  }

  /* ─── SLOTS ──────────────────────────────────────────────────── */
  var SLOTS = [
    { id: 'morning',   label: 'Morning',   icon: '🌅', defaultTime: '9:00 AM'  },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️',  defaultTime: '12:30 PM' },
    { id: 'evening',   label: 'Evening',   icon: '🌙', defaultTime: '6:00 PM'  }
  ];

  /* ─── PLATFORM META ──────────────────────────────────────────── */
  var PLAT = {
    tt: { icon: '🎵', label: 'TikTok',    color: '#ff2d55', peakSlot: 2 },
    yt: { icon: '▶️',  label: 'YouTube',   color: '#FFD700', peakSlot: 1 },
    ig: { icon: '📸', label: 'Instagram', color: '#a855f7', peakSlot: 2 },
    li: { icon: '💼', label: 'LinkedIn',  color: '#0a66c2', peakSlot: 0 },
    gt: { icon: '🔍', label: 'Google',    color: '#78b4ff', peakSlot: 0 }
  };

  var STATUS = {
    draft:     { label: 'Draft',     color: 'var(--text3)', dot: '○' },
    scheduled: { label: 'Scheduled', color: 'var(--gold)',  dot: '⏰' },
    published: { label: 'Published', color: 'var(--green)', dot: '✓' }
  };

  /* ─── STATE ──────────────────────────────────────────────────── */
  var _dayOffset       = 0;    // 0 = today, -1 = yesterday, +1 = tomorrow
  var _posts           = {};   // slotId → post for currently viewed day
  var _flipDir         = 0;    // -1 = going back, +1 = going forward
  var _filter          = 'all';
  var _editSlot        = null;
  var _modalPlat       = 'tt';
  var _modalSlotId     = 'morning';
  var _predictedTimes  = {
    morning:   '9:00 AM',
    afternoon: '12:30 PM',
    evening:   '6:00 PM'
  };

  /* ─── LOAD / SAVE for current viewed day ────────────────────── */
  function loadDayPosts() {
    try {
      var key = dateKey(dateFromOffset(_dayOffset));
      var raw = localStorage.getItem(key);
      _posts = raw ? JSON.parse(raw) : {};
    } catch (e) { _posts = {}; }
  }

  function saveDayPosts() {
    try {
      var key = dateKey(dateFromOffset(_dayOffset));
      localStorage.setItem(key, JSON.stringify(_posts));
    } catch (e) {}
  }

  /* Keep 30 days max — prune anything older */
  function pruneOldDays() {
    try {
      var keys = Object.keys(localStorage).filter(function (k) {
        return k.startsWith(STORAGE_PREFIX);
      });
      if (keys.length <= 30) return;
      keys.sort();
      keys.slice(0, keys.length - 30).forEach(function (k) {
        localStorage.removeItem(k);
      });
    } catch (e) {}
  }

  /* ─── TREND DATA ─────────────────────────────────────────────── */
  function getTrends() {
    return (window._allTrends && window._allTrends.length) ? window._allTrends : [];
  }

  function bestTrendForPlat(platCode) {
    var trends = getTrends();
    if (!trends.length) return null;
    var pool = trends.filter(function (t) {
      return t.plat === platCode || t.plat === 'cross';
    });
    if (!pool.length) pool = trends;
    return pool.slice().sort(function (a, b) { return b.score - a.score; })[0] || null;
  }

  /* ─── PREDICT BEST TIMES (only meaningful for today) ────────── */
  function predictBestTimes() {
    var trends = getTrends();
    if (!trends.length) return;

    var top      = trends.slice().sort(function (a, b) { return b.score - a.score; });
    var topScore = top[0] ? top[0].score : 5;
    var counts   = { tt: 0, yt: 0, gt: 0, cross: 0 };
    top.slice(0, 5).forEach(function (t) {
      if (counts[t.plat] !== undefined) counts[t.plat]++;
    });

    if (topScore >= 8.5) {
      _predictedTimes.morning   = counts.gt >= counts.yt  ? '9:00 AM'  : '10:00 AM';
      _predictedTimes.afternoon = counts.yt >= counts.tt  ? '12:00 PM' : '1:00 PM';
      _predictedTimes.evening   = counts.tt >= counts.gt  ? '7:00 PM'  : '6:30 PM';
    } else if (topScore >= 7) {
      _predictedTimes.morning   = '8:30 AM';
      _predictedTimes.afternoon = '12:00 PM';
      _predictedTimes.evening   = '6:00 PM';
    } else {
      _predictedTimes.morning   = '9:00 AM';
      _predictedTimes.afternoon = '1:00 PM';
      _predictedTimes.evening   = '6:00 PM';
    }
  }

  /* ─── SCORE LABEL ────────────────────────────────────────────── */
  function scoreLabel(score) {
    if (score >= 8.5) return { text: '🔥 Peak now', color: 'var(--green)' };
    if (score >= 7)   return { text: '⚡ Rising',   color: 'var(--gold)' };
    if (score >= 5)   return { text: '🟢 Early',    color: '#4FB3A5' };
    return               { text: '📊 Stable',    color: 'var(--text3)' };
  }

  /* ─── DATE HELPERS ───────────────────────────────────────────── */
  var DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function dayLabel(offset) {
    var d = dateFromOffset(offset);
    var prefix = '';
    if (offset === 0)  prefix = 'Today — ';
    if (offset === -1) prefix = 'Yesterday — ';
    if (offset === 1)  prefix = 'Tomorrow — ';
    return prefix + DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function isToday() { return _dayOffset === 0; }
  function isPast()  { return _dayOffset < 0; }
  function isFuture(){ return _dayOffset > 0; }

  /* ─── ESCAPE HELPERS ─────────────────────────────────────────── */
  function escH(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escJ(s) {
    return String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  }

  /* ─── RENDER DATE LABEL ──────────────────────────────────────── */
  function renderDateLabel() {
    var el = document.getElementById('calWeekLabel');
    if (el) el.textContent = dayLabel(_dayOffset);
  }

  /* ─── RENDER STATS for currently viewed day ─────────────────── */
  function renderStats() {
    var posts = Object.values(_posts);
    var yt = 0, tt = 0, ig = 0, done = 0;
    posts.forEach(function (p) {
      if (p.plat === 'yt') yt++;
      if (p.plat === 'tt') tt++;
      if (p.plat === 'ig') ig++;
      if (p.status === 'published') done++;
    });
    function set(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
    set('calStatTotal', posts.length);
    set('calStatYt',    yt);
    set('calStatTt',    tt);
    set('calStatIg',    ig);
    set('calStatDone',  done);
  }

  /* ─── PAGE-FLIP ANIMATION ────────────────────────────────────── */
  function animateFlip(direction, callback) {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) { callback(); return; }

    var exitClass  = direction > 0 ? 'cal-flip-exit-left'  : 'cal-flip-exit-right';
    var enterClass = direction > 0 ? 'cal-flip-enter-right': 'cal-flip-enter-left';

    grid.classList.add(exitClass);
    setTimeout(function () {
      grid.classList.remove(exitClass);
      callback();
      grid.classList.add(enterClass);
      setTimeout(function () {
        grid.classList.remove(enterClass);
      }, 320);
    }, 200);
  }

  /* ─── RENDER GRID ────────────────────────────────────────────── */
  function renderGrid() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return;

    renderDateLabel();
    renderStats();

    var isT      = isToday();
    var isP      = isPast();
    var isF      = isFuture();
    var trends   = getTrends();
    var hasTrends = isT && trends.length > 0;

    if (hasTrends) predictBestTimes();

    /* Trend suggestions — only shown for today */
    var slotSuggestions = [
      hasTrends ? (bestTrendForPlat('gt') || bestTrendForPlat('yt')) : null,
      hasTrends ? (bestTrendForPlat('yt') || bestTrendForPlat('tt')) : null,
      hasTrends ? (bestTrendForPlat('tt') || bestTrendForPlat('ig')) : null
    ];
    var slotDefPlat = ['li', 'yt', 'tt'];

    var html = '<div class="cal-day-wrap">';

    /* ── Day navigation strip ── */
    html += '<div class="cal-day-nav">';
    html += '<button class="cal-nav-arrow" onclick="window.calPrevDay()" title="Previous day">‹</button>';
    html += '<div class="cal-day-nav-center">';
    html += '<span class="cal-day-label">' + escH(dayLabel(_dayOffset)) + '</span>';
    if (!isT) {
      html += '<button class="cal-today-jump-btn" onclick="window.calGoToday()">Go to today</button>';
    }
    html += '</div>';
    html += '<button class="cal-nav-arrow" onclick="window.calNextDay()" title="Next day">›</button>';
    html += '</div>';

    /* ── Day type banner ── */
    if (isP) {
      html += '<div class="cal-day-banner cal-day-past">';
      html += '📖 Past day — you can review or edit posts, but best times won\'t update';
      html += '</div>';
    } else if (isF) {
      html += '<div class="cal-day-banner cal-day-future">';
      html += '📅 Future day — plan ahead! Best posting times will be calculated on the day';
      html += '</div>';
    } else if (hasTrends) {
      /* Today + trends loaded — show top trend pill */
      var topT = trends.slice().sort(function(a,b){return b.score-a.score;})[0];
      var sl   = scoreLabel(topT.score);
      html += '<div class="cal-day-banner cal-day-today">';
      html += '<span style="color:var(--text3);font-size:11px">Today\'s top trend:</span> ';
      html += '<span style="color:' + sl.color + ';font-weight:800">' + sl.text + '</span> ';
      html += '<span style="color:var(--text2)">'
            + escH(topT.topic.length > 40 ? topT.topic.slice(0,40)+'…' : topT.topic)
            + '</span>';
      html += '<span style="color:var(--text3);margin-left:6px;font-family:\'DM Mono\',monospace;font-size:10px">'
            + topT.score.toFixed(1) + '/10</span>';
      html += '</div>';
    } else {
      html += '<div class="cal-day-banner cal-day-today" style="color:var(--text3)">⏳ Loading trends…</div>';
    }

    /* ── 3 slot cards ── */
    SLOTS.forEach(function (slot, idx) {
      var post     = _posts[slot.id];
      var sug      = slotSuggestions[idx];
      var predTime = _predictedTimes[slot.id];
      var postVisible = !post || _filter === 'all' || post.plat === _filter;

      html += '<div class="cal-slot-card' + (isP ? ' cal-slot-past' : '') + '">';

      /* ── Slot header ── */
      html += '<div class="cal-slot-hdr">';
      html += '<div style="display:flex;align-items:center;gap:8px">';
      html += '<span style="font-size:18px">' + slot.icon + '</span>';
      html += '<div>';
      html += '<div class="cal-slot-name">' + slot.label + '</div>';
      html += '<div class="cal-slot-time">';
      if (hasTrends) {
        html += '⏰ Best time: <strong style="color:var(--gold)">' + escH(predTime) + '</strong>';
        html += ' <span class="cal-time-source">· from trend data</span>';
      } else if (isF) {
        html += '<span style="color:var(--text3)">' + escH(slot.defaultTime) + ' (estimated)</span>';
      } else {
        html += escH(slot.defaultTime);
      }
      html += '</div></div></div>';

      /* Platform badge */
      if (hasTrends && sug) {
        var pm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
        html += '<span class="cal-slot-plat-badge" style="color:' + pm.color + ';border-color:' + pm.color + '50">'
              + pm.icon + ' ' + pm.label + '</span>';
      }
      html += '</div>'; /* .cal-slot-hdr */

      /* ── Post body (if exists & passes filter) ── */
      if (post && postVisible) {
        var pm2 = PLAT[post.plat] || PLAT.tt;
        var sm  = STATUS[post.status] || STATUS.draft;
        var sl2 = post.score ? scoreLabel(post.score) : null;

        html += '<div class="cal-post-body" style="border-left:3px solid ' + pm2.color + '">';
        html += '<div class="cal-post-meta-row">';
        html += '<span class="cal-post-plat" style="color:' + pm2.color + ';background:' + pm2.color + '18">'
              + pm2.icon + ' ' + pm2.label + '</span>';
        html += '<span class="cal-post-status" style="color:' + sm.color + '">' + sm.dot + ' ' + sm.label + '</span>';
        if (sl2) {
          html += '<span class="cal-post-score" style="color:' + sl2.color + ';margin-left:auto">'
                + sl2.text + ' · ' + post.score.toFixed(1) + '</span>';
        }
        html += '</div>';
        html += '<div class="cal-post-topic">' + escH(post.topic) + '</div>';
        if (post.notes) {
          html += '<div class="cal-post-notes">' + escH(post.notes.slice(0,90)) + (post.notes.length > 90 ? '…' : '') + '</div>';
        }
        if (post.postTime) {
          html += '<div class="cal-post-posttime">⏰ Scheduled: <strong>' + escH(post.postTime) + '</strong></div>';
        }

        html += '<div class="cal-post-btns">';
        html += '<button class="cal-btn cal-btn-edit" onclick="window.calEditPost(\'' + slot.id + '\')">✏️ Edit</button>';
        html += '<button class="cal-btn cal-btn-gen"  onclick="window.calGeneratePost(\'' + escJ(post.topic) + '\')">⚡ Generate</button>';
        var notifActive = isT && hasActiveNotif(slot.id);
        if (isT) {
          html += '<button class="cal-btn cal-btn-notif' + (notifActive ? ' notif-on' : '') + '" '
                + 'onclick="window.calEnableSlotNotif(\'' + slot.id + '\')" '
                + 'title="' + (notifActive ? 'Reminder set for ' + escH(post.postTime) : 'Set posting reminder') + '">'
                + (notifActive ? '🔔' : '🔕') + '</button>';
        }
        html += '<button class="cal-btn cal-btn-del"  onclick="window.calDeletePost(\'' + slot.id + '\')">✕</button>';
        html += '</div>';
        html += '</div>'; /* .cal-post-body */

      } else if (!post) {
        /* ── Empty slot ── */
        if (hasTrends && sug) {
          var sugPm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
          var sugSl = scoreLabel(sug.score);
          html += '<div class="cal-sug-card" onclick="window.calAcceptSuggestion(\'' + slot.id + '\')">';
          html += '<div class="cal-sug-row">';
          html += '<span class="cal-sug-label">✨ Dijo suggests</span>';
          html += '<span style="font-size:10px;font-weight:800;font-family:\'DM Mono\',monospace;color:' + sugSl.color + '">' + sugSl.text + ' · ' + sug.score.toFixed(1) + '/10</span>';
          html += '</div>';
          html += '<div class="cal-sug-topic">' + escH(sug.topic) + '</div>';
          html += '<div class="cal-sug-meta" style="color:' + sugPm.color + '">'
                + sugPm.icon + ' ' + sugPm.label + ' · Tap to schedule</div>';
          html += '</div>';
        }
        html += '<button class="cal-add-btn" onclick="window.openModal(\'' + slot.id + '\')">＋ Add your own</button>';
        if (isT && 'Notification' in window && Notification.permission === 'default') {
          html += '<button class="cal-notif-nudge" onclick="window.calRequestNotifFromUI()">🔔 Enable posting reminders</button>';
        }
      }

      html += '</div>'; /* .cal-slot-card */
    });

    html += '</div>'; /* .cal-day-wrap */
    grid.innerHTML = html;
    injectStyles();
  }

  /* ─── NAVIGATION ─────────────────────────────────────────────── */
  window.calPrevDay = function () {
    _dayOffset--;
    animateFlip(-1, function () {
      loadDayPosts();
      renderGrid();
    });
  };

  window.calNextDay = function () {
    _dayOffset++;
    animateFlip(1, function () {
      loadDayPosts();
      renderGrid();
    });
  };

  window.calGoToday = function () {
    var dir = _dayOffset > 0 ? -1 : 1;
    _dayOffset = 0;
    animateFlip(dir, function () {
      loadDayPosts();
      renderGrid();
    });
  };

  /* Keep old week-nav aliases working if called from existing HTML buttons */
  window.calPrevWeek = window.calPrevDay;
  window.calNextWeek = window.calNextDay;

  /* ─── FILTER ─────────────────────────────────────────────────── */
  window.calSetFilter = function (plat, btn) {
    _filter = plat;
    document.querySelectorAll('.cal-plat-btn').forEach(function (b) {
      b.classList.remove('active-all','active-filter');
    });
    if (btn) btn.classList.add(plat === 'all' ? 'active-all' : 'active-filter');
    renderGrid();
  };
  window.setUserNiche = function () { renderGrid(); };

  /* ─── AUTO-FILL (today only) ─────────────────────────────────── */
  window.calAutoFill = function () {
    if (!isToday()) {
      if (typeof toast === 'function') toast('⚠️ Auto-Fill only works for today');
      return;
    }
    var btn    = document.getElementById('calAutoBtn');
    var trends = getTrends();
    if (!trends.length) {
      if (typeof toast === 'function') toast('⏳ Trends still loading — try again shortly');
      return;
    }

    predictBestTimes();

    var assignments = [
      { slotId: 'morning',   plat: 'li', trendPlat: 'gt' },
      { slotId: 'afternoon', plat: 'yt', trendPlat: 'yt' },
      { slotId: 'evening',   plat: 'tt', trendPlat: 'tt' }
    ];

    var filled = 0;
    assignments.forEach(function (a) {
      if (_posts[a.slotId]) return;
      var trend = bestTrendForPlat(a.trendPlat);
      if (!trend) return;
      _posts[a.slotId] = {
        topic:      trend.topic,
        plat:       a.plat,
        status:     'scheduled',
        notes:      '',
        score:      trend.score,
        postTime:   _predictedTimes[a.slotId],
        autoFilled: true,
        createdAt:  new Date().toISOString()
      };
      filled++;
    });

    saveDayPosts();
    scheduleAllNotifications();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✨ Auto-filled ' + filled + ' posts for today!' + (Notification.permission === 'granted' ? ' 🔔 Reminders set.' : ''));

    if (btn) {
      btn.textContent = '✅ Done!';
      btn.style.background = 'var(--green)';
      setTimeout(function () {
        btn.textContent = '✨ Auto-Fill';
        btn.style.background = '';
      }, 2000);
    }
  };

  /* ─── ACCEPT DIJO SUGGESTION ─────────────────────────────────── */
  window.calAcceptSuggestion = function (slotId) {
    var idx = SLOTS.findIndex(function (s) { return s.id === slotId; });
    if (idx === -1) return;
    var trendPlats   = ['gt','yt','tt'];
    var platDefaults = ['li','yt','tt'];
    var trend = bestTrendForPlat(trendPlats[idx]);
    if (!trend) return;
    predictBestTimes();
    _posts[slotId] = {
      topic:      trend.topic,
      plat:       platDefaults[idx],
      status:     'scheduled',
      notes:      '',
      score:      trend.score,
      postTime:   _predictedTimes[slotId],
      autoFilled: true,
      createdAt:  new Date().toISOString()
    };
    saveDayPosts();
    if (isToday()) schedulePostNotification(slotId, _posts[slotId]);
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✅ Scheduled: ' + trend.topic);
  };

  /* ─── MODAL — OPEN ───────────────────────────────────────────── */
  window.openModal = function (slotId) {
    _editSlot    = null;
    _modalSlotId = slotId || 'morning';
    var idx = SLOTS.findIndex(function (s) { return s.id === _modalSlotId; });
    idx = Math.max(idx, 0);
    var platDefaults = ['li','yt','tt'];
    var trendPlats   = ['gt','yt','tt'];
    _modalPlat = platDefaults[idx];
    var trend = isToday() ? bestTrendForPlat(trendPlats[idx]) : null;
    _showModal({
      title:  'Add Post — ' + SLOTS[idx].label + (isToday() ? '' : ' · ' + dayLabel(_dayOffset).split('—')[0].trim()),
      topic:  trend ? trend.topic : '',
      notes:  '',
      status: 'scheduled',
      plat:   _modalPlat
    });
  };

  /* ─── MODAL — EDIT ───────────────────────────────────────────── */
  window.calEditPost = function (slotId) {
    var post = _posts[slotId];
    if (!post) return;
    _editSlot    = slotId;
    _modalSlotId = slotId;
    _modalPlat   = post.plat || 'tt';
    var idx = SLOTS.findIndex(function (s) { return s.id === slotId; });
    _showModal({
      title:  'Edit Post — ' + (SLOTS[Math.max(idx,0)] || SLOTS[0]).label,
      topic:  post.topic,
      notes:  post.notes  || '',
      status: post.status || 'draft',
      plat:   post.plat   || 'tt'
    });
  };

  function _showModal(opts) {
    var overlay = document.getElementById('calModalOverlay');
    if (!overlay) return;
    var set = function(id,v){ var e=document.getElementById(id); if(e) e.value=v; };
    var txt = function(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; };
    txt('calModalTitle', opts.title);
    set('calModalInput',  opts.topic);
    set('calModalNotes',  opts.notes);
    set('calModalStatus', opts.status);
    document.querySelectorAll('.cal-modal-plat').forEach(function (b) {
      b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');
    });
    var active = document.querySelector('.cal-modal-plat[data-plat="' + opts.plat + '"]');
    if (active) active.classList.add('sel-' + opts.plat);
    _modalPlat = opts.plat;
    overlay.classList.add('open');
    var inp = document.getElementById('calModalInput');
    if (inp) setTimeout(function () { inp.focus(); inp.select(); }, 80);
  }

  /* ─── MODAL — CLOSE ──────────────────────────────────────────── */
  window.closeModal = function () {
    var ov = document.getElementById('calModalOverlay');
    if (ov) ov.classList.remove('open');
    _editSlot = null;
  };

  /* ─── SELECT PLATFORM ────────────────────────────────────────── */
  window.calModalSelectPlat = function (btn, plat) {
    document.querySelectorAll('.cal-modal-plat').forEach(function (b) {
      b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');
    });
    if (btn) btn.classList.add('sel-' + plat);
    _modalPlat = plat;
  };

  /* ─── SAVE POST ──────────────────────────────────────────────── */
  window.savePost = function () {
    var inp    = document.getElementById('calModalInput');
    var notes  = document.getElementById('calModalNotes');
    var status = document.getElementById('calModalStatus');
    var topic  = inp ? inp.value.trim() : '';
    if (!topic) {
      if (inp) { inp.focus(); inp.style.outline = '2px solid var(--gold)'; }
      if (typeof toast === 'function') toast('⚠️ Enter a topic first');
      return;
    }
    if (inp) inp.style.outline = '';

    var trends  = getTrends();
    var matched = trends.find(function (t) {
      return t.topic.toLowerCase() === topic.toLowerCase();
    });

    var slotId   = _editSlot || _modalSlotId || 'morning';
    if (isToday()) predictBestTimes();
    var existing = _posts[slotId] || {};

    _posts[slotId] = {
      topic:      topic,
      plat:       _modalPlat,
      status:     status ? status.value : 'draft',
      notes:      notes ? notes.value.trim() : '',
      score:      matched ? matched.score : (existing.score || null),
      postTime:   _predictedTimes[slotId],
      autoFilled: false,
      createdAt:  existing.createdAt || new Date().toISOString(),
      updatedAt:  new Date().toISOString()
    };

    saveDayPosts();
    if (isToday()) schedulePostNotification(slotId, _posts[slotId]);
    closeModal();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✅ Post saved!' + (isToday() && Notification.permission === 'granted' ? ' 🔔 Reminder set.' : ''));
  };

  /* ─── DELETE POST ────────────────────────────────────────────── */
  window.calDeletePost = function (slotId) {
    if (!_posts[slotId]) return;
    delete _posts[slotId];
    cancelNotification(slotId);
    saveDayPosts();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('🗑 Removed');
  };

  /* ─── GENERATE FROM CALENDAR ─────────────────────────────────── */
  window.generateFromCalendar = function () {
    var topic = '';
    ['morning','afternoon','evening'].forEach(function (id) {
      if (!topic && _posts[id] && _posts[id].topic) topic = _posts[id].topic;
    });
    if (!topic) {
      var trends = getTrends();
      if (trends.length) topic = trends[0].topic;
    }
    if (topic && typeof loadTopic === 'function') {
      loadTopic(topic);
    } else if (typeof switchTab === 'function') {
      switchTab('generator', null);
    }
  };

  window.calGeneratePost = function (topic) {
    if (topic && typeof loadTopic === 'function') loadTopic(topic);
  };

  /* ─── REQUEST NOTIF FROM UI ──────────────────────────────────── */
  window.calRequestNotifFromUI = function () {
    requestNotifPermission(function (granted) {
      if (granted) {
        scheduleAllNotifications();
        if (typeof toast === 'function') toast('🔔 Posting reminders enabled!');
      } else {
        if (typeof toast === 'function') toast('🔕 Notifications blocked — check browser settings');
      }
      renderGrid();
    });
  };

  /* ─── DIJO SUGGEST ───────────────────────────────────────────── */
  window.calSuggestIdea = function () {
    var btn  = document.getElementById('calDijoSuggestBtn');
    var inp  = document.getElementById('calModalInput');
    if (!inp) return;
    var DIJO   = window.DIJO || 'https://impactgrid-dijo.onrender.com';
    var idx    = SLOTS.findIndex(function (s) { return s.id === _modalSlotId; });
    var slot   = SLOTS[Math.max(idx, 0)];
    var trends = getTrends();
    var topT   = trends.length ? trends[0].topic : 'trending topics';
    var platNm = (PLAT[_modalPlat] || {label:'social'}).label;
    var pred   = _predictedTimes[_modalSlotId] || slot.defaultTime;
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Asking Dijo…'; }
    fetch(DIJO + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Suggest ONE content topic for ' + platNm + ' at ' + pred
          + '. Top trend right now: "' + topT + '". Reply with ONLY the topic — max 8 words.',
        mode: 'creator'
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (inp && d.reply) inp.value = d.reply.trim().replace(/^["'`]|["'`]$/g,'');
      if (inp) inp.focus();
    })
    .catch(function () {
      if (inp && trends.length) inp.value = trends[0].topic;
    })
    .finally(function () {
      if (btn) { btn.disabled = false; btn.textContent = '✨ Suggest with Dijo'; }
    });
  };

  /* ─── NOTIFICATIONS ──────────────────────────────────────────── */
  var _notifTimers = {};

  function requestNotifPermission(callback) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') { if (callback) callback(true); return; }
    if (Notification.permission === 'denied')  { if (callback) callback(false); return; }
    Notification.requestPermission().then(function (perm) {
      if (callback) callback(perm === 'granted');
    });
  }

  function parseTimeToDate(timeStr) {
    var m = String(timeStr).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    var hrs = parseInt(m[1], 10);
    var min = parseInt(m[2], 10);
    var mer = m[3].toUpperCase();
    if (mer === 'PM' && hrs !== 12) hrs += 12;
    if (mer === 'AM' && hrs === 12) hrs = 0;
    var target = new Date();
    target.setHours(hrs, min, 0, 0);
    if (target <= new Date()) return null;
    return target;
  }

  function schedulePostNotification(slotId, post) {
    if (!post || !post.postTime) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (_notifTimers[slotId]) { clearTimeout(_notifTimers[slotId]); delete _notifTimers[slotId]; }
    var fireAt   = parseTimeToDate(post.postTime);
    if (!fireAt) return;
    var delay    = fireAt.getTime() - Date.now();
    var pm       = PLAT[post.plat] || PLAT.tt;
    var slotMeta = SLOTS.find(function (s) { return s.id === slotId; }) || SLOTS[0];
    _notifTimers[slotId] = setTimeout(function () {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type:  'SHOW_NOTIFICATION',
          title: '⏰ Time to post on ' + pm.label + '!',
          body:  pm.icon + ' ' + (post.topic || 'Your scheduled post') + '\n' + slotMeta.label + ' · ' + post.postTime,
          url:   '/creator-studio.html#calendar',
          tag:   'ig-cal-' + slotId
        });
      } else {
        try {
          new Notification('⏰ Time to post on ' + pm.label + '!', {
            body:    pm.icon + ' ' + (post.topic || 'Your scheduled post') + '\n' + slotMeta.label + ' · ' + post.postTime,
            icon:    '/logo.png',
            badge:   '/logo.png',
            tag:     'ig-cal-' + slotId,
            renotify: true
          });
        } catch (e) {}
      }
      delete _notifTimers[slotId];
    }, delay);
  }

  function scheduleAllNotifications() {
    if (Notification.permission !== 'granted') return;
    Object.keys(_posts).forEach(function (slotId) {
      schedulePostNotification(slotId, _posts[slotId]);
    });
  }

  function cancelNotification(slotId) {
    if (_notifTimers[slotId]) { clearTimeout(_notifTimers[slotId]); delete _notifTimers[slotId]; }
  }

  function hasActiveNotif(slotId) { return !!_notifTimers[slotId]; }

  window.calEnableSlotNotif = function (slotId) {
    requestNotifPermission(function (granted) {
      if (!granted) {
        if (typeof toast === 'function') toast('🔕 Notifications blocked — enable them in browser settings');
        return;
      }
      var post = _posts[slotId];
      if (!post) { if (typeof toast === 'function') toast('⚠️ Add a post to this slot first'); return; }
      schedulePostNotification(slotId, post);
      var fireAt = parseTimeToDate(post.postTime);
      if (fireAt) {
        if (typeof toast === 'function') toast('🔔 Reminder set for ' + post.postTime + '!');
      } else {
        if (typeof toast === 'function') toast('⚠️ That posting time has already passed today');
      }
      renderGrid();
    });
  };

  /* ─── CSS ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('_calStyles')) return;
    var s = document.createElement('style');
    s.id  = '_calStyles';
    s.textContent = `
      #calWeekGrid {
        display: block !important;
        overflow: hidden;
      }

      /* ── Page-flip animations ── */
      @keyframes calFlipExitLeft {
        from { opacity:1; transform: translateX(0) rotateY(0deg); }
        to   { opacity:0; transform: translateX(-40px) rotateY(8deg); }
      }
      @keyframes calFlipExitRight {
        from { opacity:1; transform: translateX(0) rotateY(0deg); }
        to   { opacity:0; transform: translateX(40px) rotateY(-8deg); }
      }
      @keyframes calFlipEnterLeft {
        from { opacity:0; transform: translateX(40px) rotateY(-8deg); }
        to   { opacity:1; transform: translateX(0) rotateY(0deg); }
      }
      @keyframes calFlipEnterRight {
        from { opacity:0; transform: translateX(-40px) rotateY(8deg); }
        to   { opacity:1; transform: translateX(0) rotateY(0deg); }
      }
      .cal-flip-exit-left  { animation: calFlipExitLeft  .2s ease-in  forwards; }
      .cal-flip-exit-right { animation: calFlipExitRight .2s ease-in  forwards; }
      .cal-flip-enter-left { animation: calFlipEnterLeft .32s ease-out forwards; }
      .cal-flip-enter-right{ animation: calFlipEnterRight .32s ease-out forwards; }

      /* ── Day wrapper ── */
      .cal-day-wrap {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 16px;
        perspective: 1000px;
      }

      /* ── Navigation strip ── */
      .cal-day-nav {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 4px;
      }
      .cal-nav-arrow {
        width: 36px; height: 36px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--card);
        color: var(--text);
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        transition: background .15s, border-color .15s, transform .1s;
        font-weight: 300;
        user-select: none;
      }
      .cal-nav-arrow:hover {
        background: var(--bg2);
        border-color: var(--gold-glo, rgba(201,126,8,.4));
        transform: scale(1.08);
      }
      .cal-nav-arrow:active { transform: scale(0.95); }
      .cal-day-nav-center {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
      }
      .cal-day-label {
        font-family: 'Syne', sans-serif;
        font-size: 15px;
        font-weight: 800;
        color: var(--text);
        line-height: 1.2;
      }
      .cal-today-jump-btn {
        padding: 3px 12px;
        border-radius: 99px;
        border: 1px solid var(--gold-glo, rgba(201,126,8,.4));
        background: var(--gold-dim, rgba(201,126,8,.08));
        color: var(--gold);
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        font-family: 'DM Mono', monospace;
        transition: background .15s;
      }
      .cal-today-jump-btn:hover { background: rgba(201,126,8,.16); }

      /* ── Day banners ── */
      .cal-day-banner {
        padding: 9px 14px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        font-family: 'DM Mono', monospace;
        line-height: 1.4;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 4px;
      }
      .cal-day-today {
        background: var(--card);
        border: 1px solid var(--border);
      }
      .cal-day-past {
        background: var(--bg2);
        border: 1px dashed var(--border);
        color: var(--text3);
      }
      .cal-day-future {
        background: var(--gold-dim, rgba(201,126,8,.06));
        border: 1px dashed var(--gold-glo, rgba(201,126,8,.3));
        color: var(--gold);
      }

      /* ── Slot cards ── */
      .cal-slot-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        transition: border-color .2s;
      }
      .cal-slot-card:hover { border-color: var(--gold-glo, rgba(201,126,8,.3)); }
      .cal-slot-past { opacity: .85; }
      .cal-slot-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .cal-slot-name {
        font-family: 'Syne', sans-serif;
        font-size: 14px;
        font-weight: 800;
        color: var(--text);
      }
      .cal-slot-time {
        font-family: 'DM Mono', monospace;
        font-size: 11px;
        color: var(--text3);
      }
      .cal-time-source { font-size: 10px; color: var(--text3); opacity: .7; }
      .cal-slot-plat-badge {
        font-size: 10px; font-weight: 800;
        font-family: 'DM Mono', monospace;
        padding: 3px 9px; border-radius: 99px; border: 1px solid;
        opacity: .8; white-space: nowrap; flex-shrink: 0;
      }

      /* ── Dijo suggestion card ── */
      .cal-sug-card {
        background: var(--gold-dim, rgba(201,126,8,.06));
        border: 1px dashed var(--gold-glo, rgba(201,126,8,.3));
        border-radius: 10px; padding: 10px 12px;
        cursor: pointer; display: flex; flex-direction: column; gap: 5px;
        transition: background .15s;
      }
      .cal-sug-card:hover { background: rgba(201,126,8,.12); border-style: solid; }
      .cal-sug-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .cal-sug-label {
        font-size: 10px; font-weight: 800; color: var(--gold);
        font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .06em;
      }
      .cal-sug-topic { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.3; }
      .cal-sug-meta  { font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace; }

      /* ── Add button ── */
      .cal-add-btn {
        padding: 9px; border-radius: 9px; border: 1px dashed var(--border);
        background: transparent; color: var(--text3); font-size: 12px;
        cursor: pointer; text-align: center; transition: all .15s;
        width: 100%; font-family: inherit;
      }
      .cal-add-btn:hover {
        border-color: var(--gold); color: var(--gold);
        background: var(--gold-dim, rgba(201,126,8,.06));
      }

      /* ── Post body ── */
      .cal-post-body {
        background: var(--bg2); border-radius: 10px;
        border: 1px solid var(--border); padding: 10px 12px;
        display: flex; flex-direction: column; gap: 6px;
      }
      .cal-post-meta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .cal-post-plat {
        font-size: 10px; font-weight: 800; font-family: 'DM Mono', monospace;
        padding: 2px 8px; border-radius: 99px; letter-spacing: .04em;
      }
      .cal-post-status { font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace; }
      .cal-post-score  { font-size: 10px; font-weight: 800; font-family: 'DM Mono', monospace; }
      .cal-post-topic  { font-size: 14px; font-weight: 700; color: var(--text); line-height: 1.3; word-break: break-word; }
      .cal-post-notes  { font-size: 11px; color: var(--text3); font-style: italic; line-height: 1.4; }
      .cal-post-posttime { font-size: 11px; color: var(--text3); font-family: 'DM Mono', monospace; }
      .cal-post-posttime strong { color: var(--gold); }
      .cal-post-btns { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
      .cal-btn {
        padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 700;
        border: 1px solid var(--border); background: transparent;
        cursor: pointer; transition: background .12s; font-family: inherit;
      }
      .cal-btn-edit  { color: var(--text2); }
      .cal-btn-edit:hover  { background: var(--bg2); }
      .cal-btn-gen   { color: var(--gold); border-color: var(--gold-glo, rgba(201,126,8,.3)); }
      .cal-btn-gen:hover   { background: var(--gold-dim, rgba(201,126,8,.12)); }
      .cal-btn-notif { color: var(--text3); }
      .cal-btn-notif:hover { background: rgba(255,200,0,.1); color: var(--gold); border-color: var(--gold-glo, rgba(201,126,8,.3)); }
      .cal-btn-notif.notif-on { color: var(--gold); border-color: var(--gold-glo, rgba(201,126,8,.4)); background: var(--gold-dim, rgba(201,126,8,.08)); }
      .cal-btn-del   { color: var(--text3); margin-left: auto; }
      .cal-btn-del:hover   { background: rgba(255,60,60,.1); color:#ff4444; border-color:rgba(255,60,60,.3); }

      /* ── Notif nudge ── */
      .cal-notif-nudge {
        width: 100%; padding: 7px; border-radius: 9px;
        border: 1px dashed rgba(201,126,8,.35);
        background: transparent; color: var(--gold);
        font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace;
        cursor: pointer; text-align: center; transition: all .15s;
      }
      .cal-notif-nudge:hover { background: var(--gold-dim, rgba(201,126,8,.08)); border-style: solid; }

      /* ── Modal ── */
      .cal-modal-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.55);
        z-index: 9000; display: none; align-items: center;
        justify-content: center; padding: 20px;
      }
      .cal-modal-overlay.open { display: flex; }
      .cal-modal {
        background: var(--card); border: 1px solid var(--border);
        border-radius: 16px; width: 100%; max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,.4);
      }
      .cal-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 18px; border-bottom: 1px solid var(--border);
      }
      .cal-modal-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; }
      .cal-modal-close {
        width: 28px; height: 28px; border-radius: 50%;
        border: 1px solid var(--border); background: transparent;
        cursor: pointer; font-size: 13px; color: var(--text3);
        display: flex; align-items: center; justify-content: center; transition: background .15s;
      }
      .cal-modal-close:hover { background: var(--bg2); }
      .cal-modal-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
      .cal-modal-label {
        font-size: 11px; font-weight: 700; color: var(--text3);
        text-transform: uppercase; letter-spacing: .06em;
        font-family: 'DM Mono', monospace; margin-bottom: 2px;
      }
      .cal-modal-input {
        width: 100%; padding: 10px 12px; border-radius: 9px;
        border: 1px solid var(--border); background: var(--bg2);
        color: var(--text); font-size: 13px; font-family: inherit;
        box-sizing: border-box; outline: none; transition: border-color .15s;
      }
      .cal-modal-input:focus { border-color: var(--gold); }
      .cal-dijo-suggest-btn {
        padding: 7px 14px; border-radius: 8px;
        border: 1px solid var(--gold-glo, rgba(201,126,8,.35));
        background: var(--gold-dim, rgba(201,126,8,.08)); color: var(--gold);
        font-size: 12px; font-weight: 700; cursor: pointer; transition: background .15s;
        align-self: flex-start; font-family: inherit;
      }
      .cal-dijo-suggest-btn:hover { background: rgba(201,126,8,.16); }
      .cal-modal-plats { display: flex; gap: 6px; flex-wrap: wrap; }
      .cal-modal-plat {
        padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
        background: transparent; color: var(--text2);
        font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; font-family: inherit;
      }
      .cal-modal-plat.sel-tt { border-color:#ff2d55; background:rgba(255,45,85,.1);  color:#ff2d55; }
      .cal-modal-plat.sel-yt { border-color:#FFD700; background:rgba(255,215,0,.1);  color:#FFD700; }
      .cal-modal-plat.sel-ig { border-color:#a855f7; background:rgba(168,85,247,.1); color:#a855f7; }
      .cal-modal-plat.sel-li { border-color:#0a66c2; background:rgba(10,102,194,.1); color:#0a66c2; }
      .cal-modal-status {
        width: 100%; padding: 9px 12px; border-radius: 9px;
        border: 1px solid var(--border); background: var(--bg2);
        color: var(--text); font-size: 13px; font-family: inherit; outline: none; cursor: pointer;
      }
      .cal-modal-notes {
        width: 100%; padding: 10px 12px; border-radius: 9px;
        border: 1px solid var(--border); background: var(--bg2);
        color: var(--text); font-size: 13px; font-family: inherit;
        resize: vertical; min-height: 70px; box-sizing: border-box; outline: none; transition: border-color .15s;
      }
      .cal-modal-notes:focus { border-color: var(--gold); }
      .cal-modal-footer {
        padding: 12px 18px; border-top: 1px solid var(--border);
        display: flex; gap: 8px; justify-content: flex-end;
      }
      .cal-modal-save {
        padding: 9px 20px; border-radius: 9px;
        background: linear-gradient(135deg, var(--gold), var(--gold2, #e07b08));
        color: #fff; font-size: 13px; font-weight: 700;
        border: none; cursor: pointer; font-family: 'Syne', sans-serif; transition: opacity .15s;
      }
      .cal-modal-save:hover { opacity: .9; }
      .cal-modal-cancel {
        padding: 9px 16px; border-radius: 9px;
        border: 1px solid var(--border); background: transparent;
        color: var(--text2); font-size: 13px; cursor: pointer; transition: background .15s; font-family: inherit;
      }
      .cal-modal-cancel:hover { background: var(--bg2); }

      /* ── Filter active ── */
      .cal-plat-btn.active-all,
      .cal-plat-btn.active-filter {
        background: var(--gold-dim, rgba(201,126,8,.12));
        border-color: var(--gold); color: var(--gold);
      }

      /* ── Create today btn ── */
      .cal-create-today-btn {
        margin-left: auto; padding: 7px 14px; border-radius: 8px;
        background: linear-gradient(135deg, var(--gold), var(--gold2, #e07b08));
        color: #fff; font-size: 12px; font-weight: 700;
        border: none; cursor: pointer; font-family: 'Syne', sans-serif; white-space: nowrap;
      }
      .cal-create-today-btn:hover { opacity: .9; }
    `;
    document.head.appendChild(s);
  }

  /* ─── PUBLIC ENTRY POINT ─────────────────────────────────────── */
  window.loadCalendar = function () {
    _dayOffset = 0;
    loadDayPosts();
    pruneOldDays();

    requestNotifPermission(function (granted) {
      if (granted) scheduleAllNotifications();
    });

    renderGrid();

    if (!getTrends().length) {
      var attempts = 0;
      var poll = setInterval(function () {
        attempts++;
        if (getTrends().length || attempts > 30) {
          clearInterval(poll);
          if (getTrends().length && isToday()) renderGrid();
        }
      }, 400);
    }
  };

  /* ─── KEYBOARD ───────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var ov = document.getElementById('calModalOverlay');
    /* Arrow keys for day navigation when modal is closed */
    if (!ov || !ov.classList.contains('open')) {
      if (e.key === 'ArrowLeft')  { window.calPrevDay(); return; }
      if (e.key === 'ArrowRight') { window.calNextDay(); return; }
    }
    if (!ov || !ov.classList.contains('open')) return;
    if (e.key === 'Escape') window.closeModal();
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      window.savePost();
    }
  });

  /* ─── AUTO-INIT ──────────────────────────────────────────────── */
  function maybeInit() {
    var panel = document.getElementById('panel-calendar');
    if (panel && panel.classList.contains('active')) window.loadCalendar();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', maybeInit);
  } else {
    maybeInit();
  }

})();
