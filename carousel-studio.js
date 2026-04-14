/* ═══════════════════════════════════════════════════════════════════
   CAROUSEL STUDIO — COPY & EDIT PATCH
   Drop these functions into carousel-studio.js, replacing the originals.

   Changes:
   1. trimHeadline()  — no longer caps at 6 words. Strips hashtags only.
   2. limitBody()     — no longer caps at 2 sentences. Returns full copy up to ~280 chars.
   3. fallbackSlides() — full storytelling narrative arcs, not placeholder filler.
   4. parseServerSlides() — stops butchering server copy; trusts the AI output.
   5. makeEditable()  — new function: tap/click any text on the slide to edit it inline.
   6. renderSlide()   patch — calls makeEditable() after render so every slide is editable.
   ═══════════════════════════════════════════════════════════════════ */


/* ─── 1. COPY HELPERS ──────────────────────────────────────────────
   Old trimHeadline() cut to 6 words. That's why your headlines read
   like "Nobody talks about this —". Now we just strip hashtags and
   clean whitespace — the full headline renders as written.
   ─────────────────────────────────────────────────────────────────── */
function trimHeadline(text){
  // Strip hashtags, collapse whitespace. No word limit.
  return stripHashtags(text).replace(/\s{2,}/g,' ').trim();
}

function limitBody(text){
  // Strip hashtags, return up to ~280 chars without cutting mid-sentence.
  var clean = stripHashtags(text).replace(/\s{2,}/g,' ').trim();
  if(clean.length <= 280) return clean;
  // Try to cut at a sentence boundary within 280 chars
  var cutAt = clean.lastIndexOf('.', 280);
  if(cutAt > 80) return clean.slice(0, cutAt + 1);
  return clean.slice(0, 280).trim() + '…';
}

function headlineSize(text){
  var l = (text||'').length;
  if(l < 20) return 38;
  if(l < 35) return 32;
  if(l < 50) return 27;
  if(l < 70) return 23;
  if(l < 90) return 20;
  return 17;
}


/* ─── 2. FALLBACK SLIDES ───────────────────────────────────────────
   These fire when the server is unavailable. Previously they were
   generic placeholder filler. Now they tell a real story arc with
   tension, insight, proof, and a specific CTA.
   ─────────────────────────────────────────────────────────────────── */
function fallbackSlides(topic, platform, tone, count){

  var topicClean = topic || 'this topic';
  var topicTitle = topicClean.charAt(0).toUpperCase() + topicClean.slice(1);

  /* Narrative arc — 7 acts that work for almost any creator topic */
  var arc = [

    /* 1 — HOOK: bold contrarian statement */
    {
      type:'hook', layout:'FULL_BLEED',
      headline: 'Everything You\'ve Been Told About ' + topicTitle + ' Is Backwards',
      body: 'I spent three years getting this wrong before I found the thing that actually works. Swipe through — this one\'s going to sting a little.'
    },

    /* 2 — PROBLEM: name the real pain */
    {
      type:'problem', layout:'OVERLAP_BAND',
      headline: 'Here\'s Why Most People Fail at ' + topicTitle,
      body: 'It\'s not effort. It\'s not talent. It\'s not even strategy. The real reason is something far more uncomfortable — and nobody talks about it because admitting it means looking at your own habits honestly.'
    },

    /* 3 — INSIGHT: the shift */
    {
      type:'insight', layout:'BOTTOM_STRIP',
      headline: 'The Shift That Changes Everything',
      body: 'Once you stop focusing on the output and start obsessing over the inputs, the whole game changes. The result isn\'t the goal — the system is. Here\'s what that looks like in practice.'
    },

    /* 4 — STAT: proof with a number */
    {
      type:'stat', layout:'STAT_HERO',
      stat: '3×',
      headline: 'People Who Do This Consistently Outperform Everyone Else',
      body: 'That\'s not a motivational claim. That\'s the data. Three times the result, in the same time window, with less stress. The difference is one repeatable behaviour.'
    },

    /* 5 — QUOTE: emotional anchor */
    {
      type:'quote', layout:'QUOTE_PULL',
      quote: 'You don\'t rise to the level of your goals. You fall to the level of your systems.',
      headline: '',
      body: ''
    },

    /* 6 — LESSON: the thing they wished they knew earlier */
    {
      type:'lesson', layout:'EDITORIAL_COLLAGE',
      headline: 'What I Wish I Had Known Three Years Ago',
      body: 'Nobody tells you this at the start. You have to earn it through trial and error, or you have to find someone who\'s already been through it. Here\'s the shortcut they never gave me.'
    },

    /* 7 — PROOF: real result */
    {
      type:'proof', layout:'DUAL_IMAGE',
      headline: 'This Is What the Results Actually Looked Like',
      body: 'Not overnight. Not magic. A slow build that suddenly becomes undeniable. The compound effect is real — but only if you start the right system, not just any system.'
    },

    /* 8 — VALUE: the actionable framework */
    {
      type:'value', layout:'TOP_STRIP',
      headline: 'The Three-Part Framework That Runs Everything',
      body: 'Step one: identify the one lever that moves everything else. Step two: protect that lever at all costs. Step three: ignore everything that isn\'t that lever. That\'s it. That\'s the whole system.'
    },

    /* 9 — INSIGHT: counterintuitive truth */
    {
      type:'insight', layout:'OVERLAP_BAND',
      headline: 'The Counterintuitive Truth Nobody Wants to Hear',
      body: 'Doing less, more consistently, beats doing everything sporadically. Your brain resists this because it feels like giving up. It isn\'t. It\'s the most aggressive thing you can do.'
    },

    /* 10 — CTA: clear and specific */
    {
      type:'cta', layout:'FULL_BLEED',
      headline: 'Save This. Come Back to It When You\'re Stuck.',
      body: 'The people who actually apply this will be in a completely different position six months from now. Which slide hit closest to home? Drop the number in the comments.',
      cta: 'Follow for more →'
    }
  ];

  /* Slice arc to requested count, always use slide 0 as hook and last as CTA */
  var selected = [arc[0]];
  var middle = arc.slice(1, arc.length - 1);
  var need = count - 2;
  for(var i = 0; i < need; i++){
    selected.push(middle[i % middle.length]);
  }
  selected.push(arc[arc.length - 1]);
  selected = selected.slice(0, count);

  var built = selected.map(function(sl, i){
    return {
      type:      sl.type || (i === 0 ? 'hook' : i === count - 1 ? 'cta' : 'insight'),
      layout:    normalizeLayoutSafe(sl.layout, sl.type, i, count),
      mediaType: 'image',
      tag:       String(i + 1).padStart(2, '0'),
      headline:  trimHeadline(sl.headline || ''),
      body:      limitBody(sl.body || ''),
      stat:      sl.stat || null,
      quote:     sl.quote || null,
      cta:       sl.cta || (i === count - 1 ? 'Follow for more →' : ''),
      caption:   i === 0
        ? topicTitle + ' — here\'s the honest version nobody tells you.\n\nSave this if it hits. Share it if someone needs it.'
        : i === count - 1
        ? 'Which slide hit hardest? Drop a number 👇\n\nFollow for more like this.'
        : '',
      hashtags:  [],
      primaryImage: null,
      secondImage:  null
    };
  });

  return normalizeSlidesDeck(built);
}


/* ─── 3. SERVER SLIDE PARSER ───────────────────────────────────────
   The original version called trimHeadline() (6 words) and limitBody()
   (2 sentences) on server output — butchering the AI's work.
   This version trusts the server copy fully, only stripping hashtags.
   ─────────────────────────────────────────────────────────────────── */
function parseServerSlides(data, topic, platform, tone, count){
  try{
    if(!data.slides || !Array.isArray(data.slides)) throw new Error('no slides array');
    var total = data.slides.length;

    var parsed = data.slides.map(function(sl, i){
      var primaryImage = null;
      if(sl.image) primaryImage = {url:sl.image, tone:sl.imageMood||'neutral', brightness:'medium'};
      else if(sl.primaryImage) primaryImage = sl.primaryImage;

      var secondImage = null;
      if(sl.image2) secondImage = {url:sl.image2, tone:'neutral', brightness:'medium'};
      else if(sl.secondImage) secondImage = sl.secondImage;

      var layout = normalizeLayoutSafe(sl.layout, sl.type||'value', i, total);

      /* ── Trust the server headline fully — just strip hashtags ── */
      var headline = stripHashtags(sl.headline || sl.title || '');
      if(!headline || headline.length < 3){
        headline = i === 0
          ? 'The Truth About ' + topic
          : i === total - 1
          ? 'Here\'s Your Next Step'
          : 'Slide ' + (i + 1) + ': ' + topic;
      }
      /* Only trim if absurdly long (>120 chars) */
      if(headline.length > 120){
        headline = headline.slice(0, 117) + '…';
      }

      /* ── Trust server body — strip hashtags, allow full copy ── */
      var rawBody = sl.body || sl.subline || sl.description || '';
      var body = limitBody(rawBody); // limitBody now allows up to 280 chars

      var caption = sl.caption || buildCaption(sl, i, data.trendHashtags || []);

      return {
        type:       sl.type || (i === 0 ? 'hook' : i === total - 1 ? 'cta' : 'value'),
        layout:     layout,
        mediaType:  sl.mediaType || 'image',
        tag:        sl.tag || String(i + 1).padStart(2, '0'),
        headline:   headline,
        subline:    sl.subline || '',
        body:       body,
        stat:       sl.stat || null,
        quote:      sl.quote || null,
        points:     sl.points || null,
        gridPoints: sl.gridPoints || (sl.points ? sl.points.map(function(p, pi){
          var glyphs = ['→','★','◆','✦','●','▲'];
          return {glyph: glyphs[pi % glyphs.length], text: p};
        }) : null),
        cta:        sl.cta || '',
        caption:    caption,
        hashtags:   [],
        primaryImage: primaryImage,
        secondImage:  secondImage,
        video:      sl.video || null,
        useVideo:   sl.mediaType === 'video' && !!(sl.video && sl.video.url)
      };
    });

    return normalizeSlidesDeck(parsed);
  } catch(e){
    console.warn('[parseServerSlides] Error:', e.message);
    return fallbackSlides(topic, platform, tone, count);
  }
}


/* ─── 4. INLINE EDITING ON SLIDE CANVAS ───────────────────────────
   After renderSlide() fires, this function finds all text elements
   inside the slide canvas and makes them click/tap-to-edit.

   HOW TO INTEGRATE:
   At the very end of your renderSlide() function (after the switch block),
   add this line:
       makeEditable();
   ─────────────────────────────────────────────────────────────────── */
function makeEditable(){
  var canvas = document.getElementById('slideCanvas');
  if(!canvas) return;

  /* Select elements that carry headline or body text */
  var targets = canvas.querySelectorAll(
    '.s-headline, .s-body, .s-cta, [class*="s-stat-num"]'
  );

  targets.forEach(function(el){
    /* Don't double-bind */
    if(el.dataset.editable === '1') return;
    el.dataset.editable = '1';
    el.style.cursor = 'text';
    el.title = 'Click to edit';

    el.addEventListener('click', function(e){
      e.stopPropagation();
      startInlineEdit(el);
    });
  });

  /* Also make dynamically-built text spans editable via delegation */
  canvas.addEventListener('click', function(e){
    var t = e.target;
    /* Walk up to find an editable text node */
    while(t && t !== canvas){
      if(
        t.dataset.editKey ||
        t.classList.contains('s-headline') ||
        t.classList.contains('s-body')
      ){
        startInlineEdit(t);
        return;
      }
      t = t.parentElement;
    }
  });
}

function startInlineEdit(el){
  if(el.dataset.editing === '1') return;
  el.dataset.editing = '1';

  var original = el.textContent;
  var savedStyle = el.style.cssText;

  /* Turn into a contenteditable */
  el.setAttribute('contenteditable', 'true');
  el.style.outline = '2px solid rgba(255,255,255,0.6)';
  el.style.outlineOffset = '4px';
  el.style.borderRadius = '3px';
  el.style.minWidth = '40px';
  el.style.cursor = 'text';
  el.focus();

  /* Select all text */
  var range = document.createRange();
  range.selectNodeContents(el);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  function commit(){
    el.removeAttribute('contenteditable');
    el.dataset.editing = '0';
    el.style.outline = '';
    el.style.outlineOffset = '';
    el.style.borderRadius = '';

    var newText = el.textContent.trim();
    if(!newText) el.textContent = original;

    /* Push back into ST.slides so edits persist */
    if(ST.slides && ST.slides[ST.cur]){
      var s = ST.slides[ST.cur];
      if(el.classList.contains('s-headline') || el.classList.contains('s-title')){
        s.headline = el.textContent;
        document.getElementById('eHead') && (document.getElementById('eHead').value = s.headline);
      } else if(el.classList.contains('s-body')){
        s.body = el.textContent;
        document.getElementById('eBody') && (document.getElementById('eBody').value = s.body);
      }
    }
  }

  el.addEventListener('blur', commit, {once: true});
  el.addEventListener('keydown', function(e){
    if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); el.blur(); }
    if(e.key === 'Escape'){ el.textContent = original; el.blur(); }
  });
}


/* ─── 5. NORMALISE SLIDES — updated to not clobber good copy ───────
   The original normalizeSlidesDeck() called trimHeadline() and
   limitBody() on every slide. Now it uses our updated versions
   which respect full copy.
   ─────────────────────────────────────────────────────────────────── */
function normalizeSlidesDeck(slides){
  if(!Array.isArray(slides)) return [];
  return slides.map(function(slide, i){
    var out = Object.assign({}, slide || {});
    var total = slides.length;
    out.type = i === 0 ? 'hook' : (i === total - 1 ? 'cta' : (out.type || 'insight'));
    out.layout = normalizeLayoutSafe(out.layout, out.type, i, total);

    /* Headline: trust what's there; only fill if blank */
    if(!out.headline || out.headline.length < 3){
      out.headline = out.type === 'hook'
        ? 'This Changes Everything'
        : out.type === 'cta'
        ? 'Ready to Apply This?'
        : 'Key Insight';
    }
    out.headline = trimHeadline(out.headline);

    /* Body: trust what's there; only fill if blank */
    if(!out.body) out.body = limitBody(out.body || '');
    else out.body = limitBody(out.body);

    out.quote    = stripHashtags(out.quote || '');
    out.cta      = stripHashtags(out.cta || '');
    out.hashtags = [];

    if(out.type === 'cta' && !out.cta) out.cta = 'Follow for more →';
    if(out.type !== 'hook' && !out.body){
      out.body = 'Apply this consistently and the results compound faster than you expect.';
    }

    return out;
  });
}


/* ─────────────────────────────────────────────────────────────────
   HOW TO INTEGRATE THIS PATCH INTO carousel-studio.js
   ─────────────────────────────────────────────────────────────────
   
   1. REPLACE these functions entirely:
      - trimHeadline()
      - limitBody()
      - headlineSize()
      - fallbackSlides()
      - parseServerSlides()
      - normalizeSlidesDeck()

   2. ADD these new functions:
      - makeEditable()
      - startInlineEdit()

   3. In renderSlide(), at the very end of the function — just before
      the closing brace — add:
      
          makeEditable();

      It should sit after the line:
          document.querySelectorAll('.layout-btn').forEach(...)

   4. In buildFullBleedHTML() and buildSplitTextHTML(), the .s-headline
      and .s-body classes already exist so inline editing will pick them
      up automatically.

   5. OPTIONAL: Add this CSS to carousel-studio.css for a nicer edit ring:
   
      [contenteditable="true"] {
        outline: 2px solid rgba(255,255,255,0.55) !important;
        outline-offset: 4px !important;
        border-radius: 3px !important;
        background: rgba(255,255,255,0.04) !important;
      }
   ───────────────────────────────────────────────────────────────── */
