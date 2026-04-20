/* ═══════════════════════════════════════════════════════════
   IMPACTGRID CONTENT CALENDAR — calendar.js
   ─────────────────────────────────────────────────────────
   BEHAVIOUR:
   • Shows TODAY only — 3 slots: Morning · Afternoon · Evening
   • Posting times are PREDICTED from live trend data:
       High score + TikTok  → Evening 7:00 PM
       High score + YouTube → Afternoon 12:00 PM
       High score + Google  → Morning 9:00 AM
   • Auto-Fill puts the top trend per platform into the right
     slot for TODAY ONLY — other days stay empty
   • Posts keyed by calendar-date so old days NEVER pile up
   • nav prev/next just shows the date label — no stale content
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── STORAGE — keyed by YYYYMMDD so days never pile up ─── */
  var STORAGE_PREFIX = 'ig_cal_';

  function todayStorageKey() {
    var d = new Date();
    return STORAGE_PREFIX + d.getFullYear()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');
  }

  /* ─── SLOTS — 3 per day, times overridden by trend prediction ── */
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
  var _posts           = {};   // slotId → post, for today only
  var _filter          = 'all';
  var _editSlot        = null;
  var _modalPlat       = 'tt';
  var _modalSlotId     = 'morning';
  var _predictedTimes  = {
    morning:   '9:00 AM',
    afternoon: '12:30 PM',
    evening:   '6:00 PM'
  };

  /* ─── LOAD / SAVE ────────────────────────────────────────────── */
  function loadTodayPosts() {
    try {
      var raw = localStorage.getItem(todayStorageKey());
      _posts = raw ? JSON.parse(raw) : {};
    } catch (e) { _posts = {}; }
  }

  function saveTodayPosts() {
    try { localStorage.setItem(todayStorageKey(), JSON.stringify(_posts)); } catch (e) {}
  }

  /* Remove any storage keys older than 7 days to prevent pileup */
  function pruneOldDays() {
    try {
      var keys = Object.keys(localStorage).filter(function (k) {
        return k.startsWith(STORAGE_PREFIX);
      });
      if (keys.length <= 7) return;
      keys.sort();
      keys.slice(0, keys.length - 7).forEach(function (k) {
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

  /* ─── PREDICT BEST POST TIMES from live trend data ───────────── */
  /*
   * Rules derived from real platform peak engagement windows:
   *   Morning   → Google/LinkedIn  (research & professional mindset)
   *   Afternoon → YouTube          (lunch break viewing 12–2 PM)
   *   Evening   → TikTok/Instagram (leisure scroll 6–9 PM)
   *
   * Score modifies exact time:
   *   ≥ 8.5 (Peak)   → post AT peak window
   *   7–8.4 (Rising) → post JUST BEFORE peak (get ahead of algo)
   *   < 7   (Early)  → post at standard time
   */
  function predictBestTimes() {
    var trends = getTrends();
    if (!trends.length) return;

    var top = trends.slice().sort(function (a, b) { return b.score - a.score; });
    var topScore = top[0] ? top[0].score : 5;

    // Count how many top-5 trends are per platform
    var counts = { tt: 0, yt: 0, gt: 0, cross: 0 };
    top.slice(0, 5).forEach(function (t) {
      if (counts[t.plat] !== undefined) counts[t.plat]++;
    });

    if (topScore >= 8.5) {
      // Peak: post exactly at highest engagement moment
      _predictedTimes.morning   = counts.gt >= counts.yt  ? '9:00 AM'  : '10:00 AM';
      _predictedTimes.afternoon = counts.yt >= counts.tt  ? '12:00 PM' : '1:00 PM';
      _predictedTimes.evening   = counts.tt >= counts.gt  ? '7:00 PM'  : '6:30 PM';
    } else if (topScore >= 7) {
      // Rising: post before peak to ride the wave
      _predictedTimes.morning   = '8:30 AM';
      _predictedTimes.afternoon = '12:00 PM';
      _predictedTimes.evening   = '6:00 PM';
    } else {
      // Standard
      _predictedTimes.morning   = '9:00 AM';
      _predictedTimes.afternoon = '1:00 PM';
      _predictedTimes.evening   = '6:00 PM';
    }
  }

  /* ─── SCORE LABEL HELPER ─────────────────────────────────────── */
  function scoreLabel(score) {
    if (score >= 8.5) return { text: '🔥 Peak now', color: 'var(--green)' };
    if (score >= 7)   return { text: '⚡ Rising',   color: 'var(--gold)' };
    if (score >= 5)   return { text: '🟢 Early',    color: '#4FB3A5' };
    return               { text: '📊 Stable',    color: 'var(--text3)' };
  }

  /* ─── DATE HELPERS ───────────────────────────────────────────── */
  var DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function todayLabel() {
    var d = new Date();
    return DAYS[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

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
    if (el) el.textContent = todayLabel();
  }

  /* ─── RENDER STATS ───────────────────────────────────────────── */
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

  /* ─── RENDER GRID — today's 3 slots only ────────────────────── */
  function renderGrid() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return;

    renderDateLabel();
    renderStats();
    predictBestTimes();

    var trends    = getTrends();
    var hasTrends = trends.length > 0;

    // Best trend suggestion per slot based on platform peak
    var slotSuggestions = [
      bestTrendForPlat('gt') || bestTrendForPlat('yt'),  // morning  → Google/YT
      bestTrendForPlat('yt') || bestTrendForPlat('tt'),  // afternoon → YouTube
      bestTrendForPlat('tt') || bestTrendForPlat('ig')   // evening  → TikTok
    ];
    var slotDefPlat = ['li', 'yt', 'tt']; // default platform to use per slot

    var html = '<div class="cal-today-wrap">';

    /* ── Today header ── */
    html += '<div class="cal-today-hdr">';
    html += '<span class="cal-today-title">📅 ' + escH(todayLabel()) + '</span>';
    if (hasTrends) {
      var top = trends.slice().sort(function(a,b){return b.score-a.score;})[0];
      var sl  = scoreLabel(top.score);
      html += '<span class="cal-top-trend-pill" style="color:' + sl.color + '">'
            + sl.text + ' · '
            + escH(top.topic.length > 32 ? top.topic.slice(0,32)+'…' : top.topic)
            + ' <b>' + top.score.toFixed(1) + '</b></span>';
    } else {
      html += '<span class="cal-top-trend-pill" style="color:var(--text3)">⏳ Loading trends…</span>';
    }
    html += '</div>';

    /* ── 3 slot cards ── */
    SLOTS.forEach(function (slot, idx) {
      var post      = _posts[slot.id];
      var sug       = slotSuggestions[idx];
      var predTime  = _predictedTimes[slot.id];

      // If filter is active and post doesn't match, skip rendering the post
      // (but still show the slot shell so user can add)
      var postVisible = !post || _filter === 'all' || post.plat === _filter;

      html += '<div class="cal-slot-card">';

      /* ── Slot header with predicted time ── */
      html += '<div class="cal-slot-hdr">';
      html += '<div style="display:flex;align-items:center;gap:8px">';
      html += '<span style="font-size:18px">' + slot.icon + '</span>';
      html += '<div>';
      html += '<div class="cal-slot-name">' + slot.label + '</div>';
      html += '<div class="cal-slot-time">';
      if (hasTrends) {
        html += '⏰ Best time: <strong style="color:var(--gold)">' + escH(predTime) + '</strong>';
        html += ' <span class="cal-time-source">· from trend data</span>';
      } else {
        html += escH(slot.defaultTime);
      }
      html += '</div>';
      html += '</div>';
      html += '</div>';

      // Platform badge for this slot
      if (hasTrends && sug) {
        var pm = PLAT[sug.plat === 'gt' ? slotDefPlat[idx] : sug.plat] || PLAT.tt;
        html += '<span class="cal-slot-plat-badge" style="color:' + pm.color + ';border-color:' + pm.color + '50">'
              + pm.icon + ' ' + pm.label + '</span>';
      }
      html += '</div>'; // .cal-slot-hdr

      /* ── Post (if exists and passes filter) ── */
      if (post && postVisible) {
        var pm2  = PLAT[post.plat] || PLAT.tt;
        var sm   = STATUS[post.status] || STATUS.draft;
        var sl2  = post.score ? scoreLabel(post.score) : null;

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
        html += '<button class="cal-btn cal-btn-del"  onclick="window.calDeletePost(\'' + slot.id + '\')">✕</button>';
        html += '</div>';
        html += '</div>'; // .cal-post-body

      } else if (!post) {
        /* ── Empty slot: show AI suggestion + add button ── */
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
      }

      html += '</div>'; // .cal-slot-card
    });

    html += '</div>'; // .cal-today-wrap
    grid.innerHTML = html;
    injectStyles();
  }

  /* ─── AUTO-FILL (today only, trend-predicted) ────────────────── */
  window.calAutoFill = function () {
    var btn    = document.getElementById('calAutoBtn');
    var trends = getTrends();
    if (!trends.length) {
      if (typeof toast === 'function') toast('⏳ Trends still loading — try again shortly');
      return;
    }

    predictBestTimes();

    // Each slot gets its platform's best trend — don't overwrite existing posts
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

    saveTodayPosts();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✨ Auto-filled ' + filled + ' posts for today!');

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
    var trendPlats  = ['gt','yt','tt'];
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
    saveTodayPosts();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✅ Scheduled: ' + trend.topic);
  };

  /* ─── NAV (today-only — nav just refreshes label) ───────────── */
  window.calPrevWeek = function () { renderDateLabel(); };
  window.calNextWeek = function () { renderDateLabel(); };
  window.calGoToday  = function () { renderGrid(); };

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

  /* ─── MODAL — OPEN ───────────────────────────────────────────── */
  window.openModal = function (slotId) {
    _editSlot    = null;
    _modalSlotId = slotId || 'morning';
    var idx = SLOTS.findIndex(function (s) { return s.id === _modalSlotId; });
    idx = Math.max(idx, 0);
    var platDefaults = ['li','yt','tt'];
    var trendPlats   = ['gt','yt','tt'];
    _modalPlat = platDefaults[idx];
    var trend = bestTrendForPlat(trendPlats[idx]);
    _showModal({
      title:  'Add Post — ' + SLOTS[idx].label,
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

    // Match trend score if topic matches a live trend
    var trends  = getTrends();
    var matched = trends.find(function (t) {
      return t.topic.toLowerCase() === topic.toLowerCase();
    });

    var slotId   = _editSlot || _modalSlotId || 'morning';
    predictBestTimes();
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

    saveTodayPosts();
    closeModal();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✅ Post saved!');
  };

  /* ─── DELETE POST ────────────────────────────────────────────── */
  window.calDeletePost = function (slotId) {
    if (!_posts[slotId]) return;
    delete _posts[slotId];
    saveTodayPosts();
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

  /* ─── CSS ────────────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('_calStyles')) return;
    var s = document.createElement('style');
    s.id  = '_calStyles';
    s.textContent = `
      #calWeekGrid { display: block !important; }

      .cal-today-wrap {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 16px;
      }

      /* Today header strip */
      .cal-today-hdr {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        padding: 11px 16px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
      }
      .cal-today-title {
        font-family: 'Syne', sans-serif;
        font-size: 15px;
        font-weight: 800;
        color: var(--text);
      }
      .cal-top-trend-pill {
        font-size: 11px;
        font-weight: 700;
        font-family: 'DM Mono', monospace;
        padding: 4px 12px;
        border-radius: 99px;
        background: var(--bg2);
        border: 1px solid var(--border);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 280px;
      }

      /* Slot card */
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

      /* Slot header */
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
      .cal-time-source {
        font-size: 10px;
        color: var(--text3);
        opacity: .7;
      }
      .cal-slot-plat-badge {
        font-size: 10px;
        font-weight: 800;
        font-family: 'DM Mono', monospace;
        padding: 3px 9px;
        border-radius: 99px;
        border: 1px solid;
        opacity: .8;
        white-space: nowrap;
        flex-shrink: 0;
      }

      /* Dijo suggestion card */
      .cal-sug-card {
        background: var(--gold-dim, rgba(201,126,8,.06));
        border: 1px dashed var(--gold-glo, rgba(201,126,8,.3));
        border-radius: 10px;
        padding: 10px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 5px;
        transition: background .15s;
      }
      .cal-sug-card:hover {
        background: rgba(201,126,8,.12);
        border-style: solid;
      }
      .cal-sug-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .cal-sug-label {
        font-size: 10px;
        font-weight: 800;
        color: var(--gold);
        font-family: 'DM Mono', monospace;
        text-transform: uppercase;
        letter-spacing: .06em;
      }
      .cal-sug-topic {
        font-size: 13px;
        font-weight: 700;
        color: var(--text);
        line-height: 1.3;
      }
      .cal-sug-meta {
        font-size: 10px;
        font-weight: 700;
        font-family: 'DM Mono', monospace;
      }

      /* Add button */
      .cal-add-btn {
        padding: 9px;
        border-radius: 9px;
        border: 1px dashed var(--border);
        background: transparent;
        color: var(--text3);
        font-size: 12px;
        cursor: pointer;
        text-align: center;
        transition: all .15s;
        width: 100%;
        font-family: inherit;
      }
      .cal-add-btn:hover {
        border-color: var(--gold);
        color: var(--gold);
        background: var(--gold-dim, rgba(201,126,8,.06));
      }

      /* Post body */
      .cal-post-body {
        background: var(--bg2);
        border-radius: 10px;
        border: 1px solid var(--border);
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cal-post-meta-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .cal-post-plat {
        font-size: 10px;
        font-weight: 800;
        font-family: 'DM Mono', monospace;
        padding: 2px 8px;
        border-radius: 99px;
        letter-spacing: .04em;
      }
      .cal-post-status {
        font-size: 10px;
        font-weight: 700;
        font-family: 'DM Mono', monospace;
      }
      .cal-post-score {
        font-size: 10px;
        font-weight: 800;
        font-family: 'DM Mono', monospace;
      }
      .cal-post-topic {
        font-size: 14px;
        font-weight: 700;
        color: var(--text);
        line-height: 1.3;
        word-break: break-word;
      }
      .cal-post-notes {
        font-size: 11px;
        color: var(--text3);
        font-style: italic;
        line-height: 1.4;
      }
      .cal-post-posttime {
        font-size: 11px;
        color: var(--text3);
        font-family: 'DM Mono', monospace;
      }
      .cal-post-posttime strong { color: var(--gold); }
      .cal-post-btns {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 2px;
      }
      .cal-btn {
        padding: 5px 12px;
        border-radius: 7px;
        font-size: 11px;
        font-weight: 700;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        transition: background .12s;
        font-family: inherit;
      }
      .cal-btn-edit { color: var(--text2); }
      .cal-btn-edit:hover { background: var(--bg2); }
      .cal-btn-gen  { color: var(--gold); border-color: var(--gold-glo, rgba(201,126,8,.3)); }
      .cal-btn-gen:hover  { background: var(--gold-dim, rgba(201,126,8,.12)); }
      .cal-btn-del  { color: var(--text3); margin-left: auto; }
      .cal-btn-del:hover  { background: rgba(255,60,60,.1); color:#ff4444; border-color:rgba(255,60,60,.3); }

      /* Modal */
      .cal-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,.55);
        z-index: 9000;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .cal-modal-overlay.open { display: flex; }
      .cal-modal {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 16px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0,0,0,.4);
      }
      .cal-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border);
      }
      .cal-modal-title {
        font-family: 'Syne', sans-serif;
        font-size: 15px;
        font-weight: 800;
      }
      .cal-modal-close {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: var(--text3);
        display: flex; align-items: center; justify-content: center;
        transition: background .15s;
      }
      .cal-modal-close:hover { background: var(--bg2); }
      .cal-modal-body {
        padding: 16px 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .cal-modal-label {
        font-size: 11px;
        font-weight: 700;
        color: var(--text3);
        text-transform: uppercase;
        letter-spacing: .06em;
        font-family: 'DM Mono', monospace;
        margin-bottom: 2px;
      }
      .cal-modal-input {
        width: 100%; padding: 10px 12px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: var(--bg2);
        color: var(--text);
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;
        transition: border-color .15s;
      }
      .cal-modal-input:focus { border-color: var(--gold); }
      .cal-dijo-suggest-btn {
        padding: 7px 14px;
        border-radius: 8px;
        border: 1px solid var(--gold-glo, rgba(201,126,8,.35));
        background: var(--gold-dim, rgba(201,126,8,.08));
        color: var(--gold);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background .15s;
        align-self: flex-start;
        font-family: inherit;
      }
      .cal-dijo-suggest-btn:hover { background: rgba(201,126,8,.16); }
      .cal-modal-plats { display: flex; gap: 6px; flex-wrap: wrap; }
      .cal-modal-plat {
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text2);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all .15s;
        font-family: inherit;
      }
      .cal-modal-plat.sel-tt { border-color:#ff2d55; background:rgba(255,45,85,.1);  color:#ff2d55; }
      .cal-modal-plat.sel-yt { border-color:#FFD700; background:rgba(255,215,0,.1);  color:#FFD700; }
      .cal-modal-plat.sel-ig { border-color:#a855f7; background:rgba(168,85,247,.1); color:#a855f7; }
      .cal-modal-plat.sel-li { border-color:#0a66c2; background:rgba(10,102,194,.1); color:#0a66c2; }
      .cal-modal-status {
        width: 100%; padding: 9px 12px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: var(--bg2);
        color: var(--text);
        font-size: 13px;
        font-family: inherit;
        outline: none;
        cursor: pointer;
      }
      .cal-modal-notes {
        width: 100%; padding: 10px 12px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: var(--bg2);
        color: var(--text);
        font-size: 13px;
        font-family: inherit;
        resize: vertical;
        min-height: 70px;
        box-sizing: border-box;
        outline: none;
        transition: border-color .15s;
      }
      .cal-modal-notes:focus { border-color: var(--gold); }
      .cal-modal-footer {
        padding: 12px 18px;
        border-top: 1px solid var(--border);
        display: flex; gap: 8px; justify-content: flex-end;
      }
      .cal-modal-save {
        padding: 9px 20px;
        border-radius: 9px;
        background: linear-gradient(135deg, var(--gold), var(--gold2, #e07b08));
        color: #fff;
        font-size: 13px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        font-family: 'Syne', sans-serif;
        transition: opacity .15s;
      }
      .cal-modal-save:hover { opacity: .9; }
      .cal-modal-cancel {
        padding: 9px 16px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text2);
        font-size: 13px;
        cursor: pointer;
        transition: background .15s;
        font-family: inherit;
      }
      .cal-modal-cancel:hover { background: var(--bg2); }

      /* Filter active */
      .cal-plat-btn.active-all,
      .cal-plat-btn.active-filter {
        background: var(--gold-dim, rgba(201,126,8,.12));
        border-color: var(--gold);
        color: var(--gold);
      }

      /* Create today btn */
      .cal-create-today-btn {
        margin-left: auto;
        padding: 7px 14px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--gold), var(--gold2, #e07b08));
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        font-family: 'Syne', sans-serif;
        white-space: nowrap;
      }
      .cal-create-today-btn:hover { opacity: .9; }
    `;
    document.head.appendChild(s);
  }

  /* ─── PUBLIC ENTRY POINT ─────────────────────────────────────── */
  window.loadCalendar = function () {
    loadTodayPosts();
    pruneOldDays();
    renderGrid();

    // If trends aren't ready yet, wait and re-render once they arrive
    if (!getTrends().length) {
      var attempts = 0;
      var poll = setInterval(function () {
        attempts++;
        if (getTrends().length || attempts > 30) {
          clearInterval(poll);
          if (getTrends().length) renderGrid();
        }
      }, 400);
    }
  };

  /* ─── KEYBOARD ───────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    var ov = document.getElementById('calModalOverlay');
    if (!ov || !ov.classList.contains('open')) return;
    if (e.key === 'Escape') window.closeModal();
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      window.savePost();
    }
  });

  /* ─── AUTO-INIT if calendar tab already active ───────────────── */
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
