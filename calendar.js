/* ═══════════════════════════════════════════════════════════
   IMPACTGRID CONTENT CALENDAR — calendar.js
   Reads window._allTrends (set by creator-studio.js)
   Builds a 7-day week view with 3 slots per day:
     Morning  9:00 AM  |  Afternoon 12:30 PM  |  Evening 6:00 PM
   Posts saved to localStorage so they persist between sessions.
   Functions wired to HTML:
     calPrevWeek()  calNextWeek()  calGoToday()  calAutoFill()
     calSetFilter(plat, btn)  setUserNiche(val)
     openModal(dayIdx, slotIdx)  closeModal()  savePost()
     calModalSelectPlat(btn, plat)  calSuggestIdea()
     generateFromCalendar()
═══════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  /* ─── CONSTANTS ────────────────────────────────────────── */
  var STORAGE_KEY = 'ig_calendar_posts_v3';
  var SLOTS = [
    { label: 'Morning',   time: '9:00 AM',   icon: '🌅', id: 'morning'   },
    { label: 'Afternoon', time: '12:30 PM',  icon: '☀️',  id: 'afternoon' },
    { label: 'Evening',   time: '6:00 PM',   icon: '🌙', id: 'evening'   }
  ];
  var DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var DAY_SHORT  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var PLAT_META  = {
    tt: { icon: '🎵', label: 'TikTok',    color: '#ff2d55' },
    yt: { icon: '▶️',  label: 'YouTube',   color: '#FFD700' },
    ig: { icon: '📸', label: 'Instagram', color: '#a855f7' },
    li: { icon: '💼', label: 'LinkedIn',  color: '#0a66c2' },
    gt: { icon: '🔍', label: 'Google',    color: '#78b4ff' }
  };
  var STATUS_META = {
    draft:     { label: 'Draft',     color: 'var(--text3)',  dot: '○' },
    scheduled: { label: 'Scheduled', color: 'var(--gold)',   dot: '⏰' },
    published: { label: 'Published', color: 'var(--green)',  dot: '✓' }
  };

  /* ─── STATE ────────────────────────────────────────────── */
  var _weekOffset   = 0;   // 0 = current week, -1 = prev, +1 = next
  var _filter       = 'all';
  var _niche        = 'all';
  var _posts        = {};  // key: "dayIdx-slotIdx", value: post object
  var _editKey      = null; // key of post being edited in modal
  var _modalPlat    = 'tt';
  var _modalDayIdx  = 0;
  var _modalSlotIdx = 0;

  /* ─── STORAGE ───────────────────────────────────────────── */
  function loadPosts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      _posts = raw ? JSON.parse(raw) : {};
    } catch(e) { _posts = {}; }
  }

  function savePosts() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_posts)); } catch(e) {}
  }

  /* Post key = "weekOffset_dayIdx_slotIdx" so different weeks are separate */
  function postKey(weekOffset, dayIdx, slotIdx) {
    return weekOffset + '_' + dayIdx + '_' + slotIdx;
  }

  /* ─── DATE HELPERS ─────────────────────────────────────── */
  function getWeekStart(offset) {
    var now  = new Date();
    var day  = now.getDay(); // 0=Sun
    var diff = now.getDate() - day;
    var start = new Date(now.getFullYear(), now.getMonth(), diff + (offset * 7));
    return start;
  }

  function formatDate(d) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  function isToday(d) {
    var t = new Date();
    return d.getDate()  === t.getDate()  &&
           d.getMonth() === t.getMonth() &&
           d.getFullYear() === t.getFullYear();
  }

  /* ─── TREND DATA ACCESS ─────────────────────────────────── */
  function getTrends() {
    return (window._allTrends && window._allTrends.length)
      ? window._allTrends
      : [];
  }

  /* Pick the best trend for a given platform + slot index combination.
     Rotates through the trend list using dayIdx to give variety across days. */
  function pickTrend(platKey, dayIdx, slotIdx) {
    var trends = getTrends();
    if (!trends.length) return null;

    // Prefer platform-specific, then cross-platform, then any
    var platTrends = trends.filter(function(t) {
      return t.plat === platKey || t.plat === 'cross';
    });
    if (!platTrends.length) platTrends = trends;

    // Sort by score descending
    platTrends = platTrends.slice().sort(function(a, b) { return b.score - a.score; });

    // Rotate: use (dayIdx * 3 + slotIdx) as offset so each cell gets a different topic
    var idx = (dayIdx * SLOTS.length + slotIdx) % platTrends.length;
    return platTrends[idx] || platTrends[0];
  }

  /* Map trend plat code to modal platform code */
  function trendPlatToModal(platCode) {
    if (platCode === 'yt') return 'yt';
    if (platCode === 'tt') return 'tt';
    if (platCode === 'gt') return 'li'; // Google trends → suggest LinkedIn/SEO angle
    return 'tt';
  }

  /* ─── RENDER WEEK LABEL ────────────────────────────────── */
  function renderWeekLabel() {
    var el = document.getElementById('calWeekLabel');
    if (!el) return;
    var start = getWeekStart(_weekOffset);
    var end   = new Date(start); end.setDate(end.getDate() + 6);
    el.textContent = formatDate(start) + ' – ' + formatDate(end);
  }

  /* ─── RENDER STATS BAR ──────────────────────────────────── */
  function renderStats() {
    var keys = Object.keys(_posts).filter(function(k) {
      return k.startsWith(_weekOffset + '_');
    });
    var total = keys.length;
    var yt = 0, tt = 0, ig = 0, done = 0;
    keys.forEach(function(k) {
      var p = _posts[k];
      if (p.plat === 'yt') yt++;
      if (p.plat === 'tt') tt++;
      if (p.plat === 'ig') ig++;
      if (p.status === 'published') done++;
    });
    var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('calStatTotal', total);
    set('calStatYt',    yt);
    set('calStatTt',    tt);
    set('calStatIg',    ig);
    set('calStatDone',  done);
  }

  /* ─── ESC HELPERS ───────────────────────────────────────── */
  function escH(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escJ(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  /* ─── RENDER GRID ───────────────────────────────────────── */
  function renderGrid() {
    var grid = document.getElementById('calWeekGrid');
    if (!grid) return;

    renderWeekLabel();
    renderStats();

    var weekStart = getWeekStart(_weekOffset);
    var hasTrends = getTrends().length > 0;

    var html = '';

    for (var d = 0; d < 7; d++) {
      var dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + d);
      var isCurrentDay = isToday(dayDate);
      var dayKey = d;

      html += '<div class="cal-day' + (isCurrentDay ? ' cal-day-today' : '') + '">';
      html += '<div class="cal-day-header">';
      html += '<span class="cal-day-name">' + DAY_SHORT[dayDate.getDay()] + '</span>';
      html += '<span class="cal-day-date' + (isCurrentDay ? ' cal-today-badge' : '') + '">' + formatDate(dayDate) + '</span>';
      html += '</div>';

      // 3 slots: Morning, Afternoon, Evening
      for (var s = 0; s < SLOTS.length; s++) {
        var slot    = SLOTS[s];
        var key     = postKey(_weekOffset, d, s);
        var post    = _posts[key];
        var dIdx    = d;
        var sIdx    = s;

        // Filter: hide if filter is active and post doesn't match (or no post)
        var show = true;
        if (_filter !== 'all') {
          if (post && post.plat !== _filter) show = false;
          if (!post && _filter !== 'all') show = false; // hide empty slots when filtering
        }

        html += '<div class="cal-slot' + (!show ? ' cal-slot-hidden' : '') + '" data-day="' + dIdx + '" data-slot="' + sIdx + '">';
        html += '<div class="cal-slot-time">' + slot.icon + ' ' + slot.time + '</div>';

        if (post) {
          var pm   = PLAT_META[post.plat] || PLAT_META.tt;
          var sm   = STATUS_META[post.status] || STATUS_META.draft;
          var score = post.score ? post.score.toFixed(1) : '';

          html += '<div class="cal-post" onclick="window.calEditPost(\'' + escJ(key) + '\')" style="border-left:3px solid ' + pm.color + '">';
          html += '<div class="cal-post-header">';
          html += '<span class="cal-post-plat" style="color:' + pm.color + '">' + pm.icon + ' ' + pm.label + '</span>';
          html += '<span class="cal-post-status" style="color:' + sm.color + '">' + sm.dot + ' ' + sm.label + '</span>';
          html += '</div>';
          html += '<div class="cal-post-topic">' + escH(post.topic) + '</div>';
          if (post.notes) {
            html += '<div class="cal-post-notes">' + escH(post.notes.slice(0, 60)) + (post.notes.length > 60 ? '…' : '') + '</div>';
          }
          if (score) {
            html += '<div class="cal-post-score" style="color:' + pm.color + '">📊 ' + score + '/10</div>';
          }
          html += '<div class="cal-post-actions">';
          html += '<button class="cal-post-btn cal-post-generate" onclick="event.stopPropagation();window.calGeneratePost(\'' + escJ(key) + '\')" title="Generate content">⚡</button>';
          html += '<button class="cal-post-btn cal-post-delete"   onclick="event.stopPropagation();window.calDeletePost(\'' + escJ(key) + '\')" title="Delete">✕</button>';
          html += '</div>';
          html += '</div>';

        } else if (hasTrends) {
          // Show AI suggestion (greyed-out) — click to accept
          var suggestion = pickTrend('tt', d, s);
          if (suggestion) {
            var sugPlat  = PLAT_META[suggestion.plat === 'gt' ? 'yt' : suggestion.plat] || PLAT_META.tt;
            html += '<div class="cal-slot-suggestion" onclick="window.calAcceptSuggestion(' + dIdx + ',' + sIdx + ')">';
            html += '<span class="cal-slot-suggest-icon">✨</span>';
            html += '<span class="cal-slot-suggest-topic">' + escH(suggestion.topic.length > 40 ? suggestion.topic.slice(0,40)+'…' : suggestion.topic) + '</span>';
            html += '<span class="cal-slot-suggest-score" style="color:' + sugPlat.color + '">' + suggestion.score.toFixed(1) + '</span>';
            html += '</div>';
          }
          html += '<button class="cal-add-btn" onclick="window.openModal(' + dIdx + ',' + sIdx + ')">+ Add</button>';
        } else {
          html += '<button class="cal-add-btn cal-add-btn-loading" onclick="window.openModal(' + dIdx + ',' + sIdx + ')">+ Add</button>';
        }

        html += '</div>'; // .cal-slot
      }

      html += '</div>'; // .cal-day
    }

    grid.innerHTML = html;
    injectStyles();
  }

  /* ─── AUTO-FILL ─────────────────────────────────────────── */
  window.calAutoFill = function() {
    var btn = document.getElementById('calAutoBtn');
    var trends = getTrends();
    if (!trends.length) {
      if (typeof toast === 'function') toast('⏳ Trends still loading — try again in a moment');
      return;
    }

    // Build platform rotation: TikTok Mon/Wed/Fri, YouTube Tue/Thu, Instagram Sat/Sun
    var platByDay = ['ig','tt','yt','tt','yt','tt','ig'];

    var filled = 0;
    for (var d = 0; d < 7; d++) {
      for (var s = 0; s < SLOTS.length; s++) {
        var key = postKey(_weekOffset, d, s);
        if (_posts[key]) continue; // don't overwrite existing posts

        var plat = platByDay[d];
        var trend = pickTrend(plat === 'ig' ? 'tt' : plat, d, s); // IG uses TikTok trends
        if (!trend) continue;

        _posts[key] = {
          topic:  trend.topic,
          plat:   plat,
          status: 'scheduled',
          notes:  '',
          score:  trend.score,
          autoFilled: true,
          createdAt: new Date().toISOString()
        };
        filled++;
      }
    }

    savePosts();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✨ Auto-filled ' + filled + ' posts from live trends!');

    // Animate button
    if (btn) {
      btn.textContent = '✅ Filled!';
      btn.style.background = 'var(--green)';
      setTimeout(function() {
        btn.textContent = '✨ Auto-Fill';
        btn.style.background = '';
      }, 2000);
    }
  };

  /* ─── ACCEPT SUGGESTION ─────────────────────────────────── */
  window.calAcceptSuggestion = function(dayIdx, slotIdx) {
    var trends = getTrends();
    if (!trends.length) return;
    var trend = pickTrend('tt', dayIdx, slotIdx);
    if (!trend) return;

    var key = postKey(_weekOffset, dayIdx, slotIdx);
    _posts[key] = {
      topic:  trend.topic,
      plat:   trendPlatToModal(trend.plat),
      status: 'scheduled',
      notes:  '',
      score:  trend.score,
      autoFilled: true,
      createdAt: new Date().toISOString()
    };
    savePosts();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✅ Added: ' + trend.topic);
  };

  /* ─── NAV ───────────────────────────────────────────────── */
  window.calPrevWeek = function() { _weekOffset--; renderGrid(); };
  window.calNextWeek = function() { _weekOffset++; renderGrid(); };
  window.calGoToday  = function() { _weekOffset = 0; renderGrid(); };

  /* ─── FILTER ────────────────────────────────────────────── */
  window.calSetFilter = function(plat, btn) {
    _filter = plat;
    // Update active button styles
    document.querySelectorAll('.cal-plat-btn').forEach(function(b) {
      b.classList.remove('active-all', 'active-filter');
    });
    if (btn) btn.classList.add(plat === 'all' ? 'active-all' : 'active-filter');
    renderGrid();
  };

  window.setUserNiche = function(val) {
    _niche = val;
    // Re-render with niche preference (future: filter suggestions by niche)
    renderGrid();
  };

  /* ─── MODAL — OPEN ──────────────────────────────────────── */
  window.openModal = function(dayIdx, slotIdx) {
    _editKey      = null;
    _modalDayIdx  = dayIdx;
    _modalSlotIdx = slotIdx;
    _modalPlat    = 'tt';

    var overlay = document.getElementById('calModalOverlay');
    var title   = document.getElementById('calModalTitle');
    var input   = document.getElementById('calModalInput');
    var notes   = document.getElementById('calModalNotes');
    var status  = document.getElementById('calModalStatus');

    if (!overlay) return;

    // Pre-fill with best trend suggestion
    var trends = getTrends();
    var suggestion = trends.length ? pickTrend('tt', dayIdx, slotIdx) : null;

    if (title)  title.textContent  = 'Add Post — ' + SLOTS[slotIdx].time;
    if (input)  input.value        = suggestion ? suggestion.topic : '';
    if (notes)  notes.value        = '';
    if (status) status.value       = 'scheduled';

    // Reset platform buttons
    document.querySelectorAll('.cal-modal-plat').forEach(function(b) {
      b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');
    });
    var ttBtn = document.querySelector('.cal-modal-plat[data-plat="tt"]');
    if (ttBtn) ttBtn.classList.add('sel-tt');

    overlay.classList.add('open');
    if (input) setTimeout(function() { input.focus(); }, 100);
  };

  /* ─── MODAL — EDIT ──────────────────────────────────────── */
  window.calEditPost = function(key) {
    var post = _posts[key];
    if (!post) return;

    _editKey = key;
    _modalPlat = post.plat || 'tt';

    // Parse key to get dayIdx / slotIdx for modal title
    var parts = key.split('_');
    _modalDayIdx  = parseInt(parts[1]) || 0;
    _modalSlotIdx = parseInt(parts[2]) || 0;

    var overlay = document.getElementById('calModalOverlay');
    var title   = document.getElementById('calModalTitle');
    var input   = document.getElementById('calModalInput');
    var notes   = document.getElementById('calModalNotes');
    var status  = document.getElementById('calModalStatus');

    if (!overlay) return;

    if (title)  title.textContent  = 'Edit Post — ' + SLOTS[_modalSlotIdx].time;
    if (input)  input.value        = post.topic || '';
    if (notes)  notes.value        = post.notes || '';
    if (status) status.value       = post.status || 'draft';

    // Set active platform button
    document.querySelectorAll('.cal-modal-plat').forEach(function(b) {
      b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');
    });
    var platBtn = document.querySelector('.cal-modal-plat[data-plat="' + post.plat + '"]');
    if (platBtn) platBtn.classList.add('sel-' + post.plat);

    overlay.classList.add('open');
    if (input) setTimeout(function() { input.focus(); }, 100);
  };

  /* ─── MODAL — CLOSE ─────────────────────────────────────── */
  window.closeModal = function() {
    var overlay = document.getElementById('calModalOverlay');
    if (overlay) overlay.classList.remove('open');
    _editKey = null;
  };

  /* ─── MODAL — SELECT PLATFORM ───────────────────────────── */
  window.calModalSelectPlat = function(btn, plat) {
    document.querySelectorAll('.cal-modal-plat').forEach(function(b) {
      b.classList.remove('sel-tt','sel-yt','sel-ig','sel-li');
    });
    btn.classList.add('sel-' + plat);
    _modalPlat = plat;
  };

  /* ─── SAVE POST ─────────────────────────────────────────── */
  window.savePost = function() {
    var input  = document.getElementById('calModalInput');
    var notes  = document.getElementById('calModalNotes');
    var status = document.getElementById('calModalStatus');

    var topic = input ? input.value.trim() : '';
    if (!topic) {
      if (input) { input.focus(); input.style.outline = '2px solid var(--gold)'; }
      if (typeof toast === 'function') toast('⚠️ Enter a topic first');
      return;
    }
    if (input) input.style.outline = '';

    // Find matching trend score if available
    var trends   = getTrends();
    var matched  = trends.find(function(t) {
      return t.topic.toLowerCase() === topic.toLowerCase();
    });
    var score = matched ? matched.score : null;

    var key = _editKey || postKey(_weekOffset, _modalDayIdx, _modalSlotIdx);

    _posts[key] = {
      topic:  topic,
      plat:   _modalPlat,
      status: status ? status.value : 'draft',
      notes:  notes ? notes.value.trim() : '',
      score:  score,
      autoFilled: false,
      createdAt: _posts[key] ? _posts[key].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savePosts();
    closeModal();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('✅ Post saved!');
  };

  /* ─── DELETE POST ───────────────────────────────────────── */
  window.calDeletePost = function(key) {
    if (!_posts[key]) return;
    delete _posts[key];
    savePosts();
    renderGrid();
    renderStats();
    if (typeof toast === 'function') toast('🗑 Post removed');
  };

  /* ─── GENERATE FROM CALENDAR ────────────────────────────── */
  window.generateFromCalendar = function() {
    // Find today's first post or use top trend
    var today = new Date().getDay();
    var topicToGenerate = '';

    for (var s = 0; s < SLOTS.length; s++) {
      var key = postKey(_weekOffset, today, s);
      if (_posts[key] && _posts[key].topic) {
        topicToGenerate = _posts[key].topic;
        break;
      }
    }

    // Fall back to best trend
    if (!topicToGenerate) {
      var trends = getTrends();
      if (trends.length) topicToGenerate = trends[0].topic;
    }

    if (topicToGenerate && typeof loadTopic === 'function') {
      loadTopic(topicToGenerate);
      if (typeof toast === 'function') toast('⚡ Generating: ' + topicToGenerate);
    } else if (typeof switchTab === 'function') {
      switchTab('generator', null);
    }
  };

  /* ─── DIJO SUGGEST ──────────────────────────────────────── */
  window.calSuggestIdea = function() {
    var btn   = document.getElementById('calDijoSuggestBtn');
    var input = document.getElementById('calModalInput');
    if (!input) return;

    var DIJO = window.DIJO || 'https://impactgrid-dijo.onrender.com';
    var slot = SLOTS[_modalSlotIdx];
    var trends = getTrends();
    var topTrend = trends.length ? trends[0].topic : 'trending topics';

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Asking Dijo…'; }

    var prompt = 'Suggest ONE specific content topic idea for a creator to post at ' + slot.time + ' on ' + DAY_NAMES[_modalDayIdx] + '. '
      + 'Current top trend: "' + topTrend + '". Platform: ' + (PLAT_META[_modalPlat] || {label:'social'}).label + '. '
      + 'Reply with ONLY the topic — no explanation, no punctuation at the end. Max 8 words.';

    fetch(DIJO + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, mode: 'creator' })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (input && data.reply) {
        input.value = data.reply.trim().replace(/^["']|["']$/g, '');
        input.focus();
      }
    })
    .catch(function() {
      // Use top trend as fallback
      if (input && trends.length) input.value = trends[0].topic;
    })
    .finally(function() {
      if (btn) { btn.disabled = false; btn.textContent = '✨ Suggest with Dijo'; }
    });
  };

  /* ─── STYLES ─────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('_calStyles')) return;
    var s = document.createElement('style');
    s.id = '_calStyles';
    s.textContent = `
      /* ── Week Grid ── */
      #calWeekGrid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 8px;
        margin-top: 12px;
        overflow-x: auto;
        min-height: 400px;
      }
      @media (max-width: 900px) {
        #calWeekGrid { grid-template-columns: repeat(4, 1fr); }
      }
      @media (max-width: 600px) {
        #calWeekGrid { grid-template-columns: repeat(2, 1fr); }
      }

      /* ── Day Column ── */
      .cal-day {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 8px 6px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 120px;
        transition: border-color 0.2s;
      }
      .cal-day-today {
        border-color: var(--gold);
        box-shadow: 0 0 0 1px var(--gold-glo, rgba(201,126,8,0.3));
      }
      .cal-day-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--border);
        margin-bottom: 2px;
      }
      .cal-day-name {
        font-family: 'DM Mono', monospace;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .08em;
        color: var(--text3);
      }
      .cal-day-date {
        font-size: 11px;
        color: var(--text2);
        font-weight: 600;
      }
      .cal-today-badge {
        color: var(--gold);
        font-weight: 900;
      }

      /* ── Slot ── */
      .cal-slot {
        background: var(--bg2, rgba(255,255,255,0.03));
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 6px;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: border-color 0.15s;
      }
      .cal-slot:hover { border-color: var(--gold-glo, rgba(201,126,8,0.4)); }
      .cal-slot-hidden { display: none; }
      .cal-slot-time {
        font-size: 10px;
        color: var(--text3);
        font-family: 'DM Mono', monospace;
        font-weight: 700;
        letter-spacing: .04em;
      }

      /* ── AI Suggestion (greyed placeholder) ── */
      .cal-slot-suggestion {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        padding: 5px 6px;
        background: var(--gold-dim, rgba(201,126,8,0.06));
        border: 1px dashed var(--gold-glo, rgba(201,126,8,0.25));
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .cal-slot-suggestion:hover { background: var(--gold-dim2, rgba(201,126,8,0.12)); }
      .cal-slot-suggest-icon { font-size: 10px; flex-shrink: 0; margin-top: 1px; }
      .cal-slot-suggest-topic {
        font-size: 10px;
        color: var(--text2);
        line-height: 1.3;
        flex: 1;
        font-style: italic;
      }
      .cal-slot-suggest-score {
        font-family: 'DM Mono', monospace;
        font-size: 9px;
        font-weight: 900;
        flex-shrink: 0;
      }

      /* ── Add Button ── */
      .cal-add-btn {
        margin-top: auto;
        padding: 5px 8px;
        border-radius: 6px;
        border: 1px dashed var(--border);
        background: transparent;
        color: var(--text3);
        font-size: 11px;
        cursor: pointer;
        text-align: center;
        transition: all 0.15s;
        width: 100%;
      }
      .cal-add-btn:hover {
        border-color: var(--gold);
        color: var(--gold);
        background: var(--gold-dim, rgba(201,126,8,0.06));
      }

      /* ── Post Card ── */
      .cal-post {
        padding: 7px 8px;
        background: var(--card);
        border-radius: 7px;
        border: 1px solid var(--border);
        cursor: pointer;
        position: relative;
        transition: border-color 0.15s, transform 0.1s;
        flex: 1;
      }
      .cal-post:hover { transform: translateY(-1px); border-color: var(--gold-glo, rgba(201,126,8,0.4)); }
      .cal-post-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 4px;
        margin-bottom: 4px;
      }
      .cal-post-plat {
        font-size: 9px;
        font-weight: 800;
        font-family: 'DM Mono', monospace;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .cal-post-status {
        font-size: 9px;
        font-weight: 700;
      }
      .cal-post-topic {
        font-size: 11px;
        font-weight: 700;
        color: var(--text);
        line-height: 1.3;
        margin-bottom: 3px;
        word-break: break-word;
      }
      .cal-post-notes {
        font-size: 10px;
        color: var(--text3);
        font-style: italic;
        line-height: 1.3;
        margin-bottom: 3px;
      }
      .cal-post-score {
        font-size: 9px;
        font-family: 'DM Mono', monospace;
        font-weight: 800;
        margin-bottom: 4px;
      }
      .cal-post-actions {
        display: flex;
        gap: 4px;
        justify-content: flex-end;
      }
      .cal-post-btn {
        padding: 2px 7px;
        border-radius: 5px;
        font-size: 11px;
        border: 1px solid var(--border);
        background: transparent;
        cursor: pointer;
        transition: background 0.1s;
      }
      .cal-post-generate { color: var(--gold); }
      .cal-post-generate:hover { background: var(--gold-dim, rgba(201,126,8,0.15)); }
      .cal-post-delete   { color: var(--text3); }
      .cal-post-delete:hover { background: rgba(255,80,80,0.12); color: #ff5050; }

      /* ── Modal ── */
      .cal-modal-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.55);
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
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        overflow: hidden;
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
        transition: background 0.15s;
      }
      .cal-modal-close:hover { background: var(--bg2); }
      .cal-modal-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 6px; }
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
        width: 100%;
        padding: 10px 12px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: var(--bg2);
        color: var(--text);
        font-size: 13px;
        font-family: inherit;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.15s;
      }
      .cal-modal-input:focus { border-color: var(--gold); }
      .cal-dijo-suggest-btn {
        margin-top: 4px;
        padding: 7px 14px;
        border-radius: 8px;
        border: 1px solid var(--gold-glo, rgba(201,126,8,0.35));
        background: var(--gold-dim, rgba(201,126,8,0.08));
        color: var(--gold);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.15s;
        align-self: flex-start;
      }
      .cal-dijo-suggest-btn:hover { background: var(--gold-dim2, rgba(201,126,8,0.16)); }
      .cal-modal-plats {
        display: flex; gap: 6px; flex-wrap: wrap;
      }
      .cal-modal-plat {
        padding: 6px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text2);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
      }
      .cal-modal-plat.sel-tt { border-color: #ff2d55; background: rgba(255,45,85,0.1);  color: #ff2d55; }
      .cal-modal-plat.sel-yt { border-color: #FFD700; background: rgba(255,215,0,0.1);  color: #FFD700; }
      .cal-modal-plat.sel-ig { border-color: #a855f7; background: rgba(168,85,247,0.1); color: #a855f7; }
      .cal-modal-plat.sel-li { border-color: #0a66c2; background: rgba(10,102,194,0.1); color: #0a66c2; }
      .cal-modal-status {
        width: 100%;
        padding: 9px 12px;
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
        width: 100%;
        padding: 10px 12px;
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
        transition: border-color 0.15s;
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
        transition: opacity 0.15s;
      }
      .cal-modal-save:hover { opacity: 0.9; }
      .cal-modal-cancel {
        padding: 9px 16px;
        border-radius: 9px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text2);
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .cal-modal-cancel:hover { background: var(--bg2); }

      /* ── Filter buttons ── */
      .cal-plat-btn.active-all,
      .cal-plat-btn.active-filter {
        background: var(--gold-dim, rgba(201,126,8,0.12));
        border-color: var(--gold);
        color: var(--gold);
      }

      /* ── Create today button ── */
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
      .cal-create-today-btn:hover { opacity: 0.9; }

      /* ── Loading state ── */
      .cal-loading {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 48px;
        color: var(--text3);
        font-size: 13px;
      }
    `;
    document.head.appendChild(s);
  }

  /* ─── PUBLIC ENTRY POINT (called by switchTab) ──────────── */
  window.loadCalendar = function() {
    loadPosts();
    renderGrid();

    // If trends aren't loaded yet, wait for them and re-render
    if (!getTrends().length) {
      var attempts = 0;
      var poll = setInterval(function() {
        attempts++;
        if (getTrends().length || attempts > 20) {
          clearInterval(poll);
          if (getTrends().length) renderGrid();
        }
      }, 500);
    }
  };

  /* ─── KEYBOARD: Enter saves, Escape closes ───────────────── */
  document.addEventListener('keydown', function(e) {
    var overlay = document.getElementById('calModalOverlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      savePost();
    }
  });

  /* ─── AUTO INIT: if calendar tab is already active ──────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      var panel = document.getElementById('panel-calendar');
      if (panel && panel.classList.contains('active')) window.loadCalendar();
    });
  } else {
    var panel = document.getElementById('panel-calendar');
    if (panel && panel.classList.contains('active')) window.loadCalendar();
  }

})();
