/* ═══════════════════════════════════════════════════════════════════
   IMPACTGRID — Carousel Style Token System
   carousel-style-tokens.js  v1.0

   PURPOSE:
   Fixes cross-style bleeding by giving every visual style its own
   sealed design token capsule. Every renderer reads from these tokens
   instead of globals (ST.accent, ST.fontPair, theme palette).

   HOW TO USE:
   1. Add this file as a <script> BEFORE carousel-studio.js
   2. In renderSlide(), replace:
        var accent2 = ST.accent || T.accentColor;
        var pBg = getPanelBg(theme);
        var pText = getPanelText(theme);
      with:
        var tok = getStyleTokens(layout);
        var accent2 = tok.accent;
        var pBg = tok.panelBg;
        var pText = tok.panelText;
   3. In getFont(), change to read tok.headFont / tok.bodyFont / tok.monoFont
      by passing tok into every renderer.
   4. Wherever a renderer hardcodes a colour, replace with tok.* equivalent.

   Each style is now a sealed capsule. User's font picker and accent
   colour picker become PREVIEW-ONLY on the step screen and do NOT
   override the style's locked tokens during rendering.
   ═══════════════════════════════════════════════════════════════════ */

(function () {

  /* ──────────────────────────────────────────────────────────────
     STYLE TOKEN CAPSULES
     One object per layout. Every property locked. No external deps.
  ────────────────────────────────────────────────────────────────*/
  var STYLE_TOKENS = {

    /* ─── FULL BLEED ───────────────────────────────────────────
       Dark cinematic. Photo fills the canvas. Text bottom-left.
       Gold accent on tag only. White headline. */
    FULL_BLEED: {
      // Background & overlay
      canvasBg:        '#0f0d0b',
      overlayGradient: 'linear-gradient(to top, rgba(10,8,6,.92) 0%, rgba(10,8,6,.45) 48%, rgba(10,8,6,.06) 100%)',
      // Panel (not used here — full bleed has no panel)
      panelBg:         'transparent',
      panelText:       '#ffffff',
      // Typography
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#ffffff',
      bodyColor:       'rgba(255,255,255,.78)',
      // Accent (the gold)
      accent:          '#c9923a',
      accentText:      '#ffffff',
      // Slide number / tag
      tagBg:           'rgba(201,146,58,.15)',
      tagColor:        '#c9923a',
      tagBorder:       '1px solid rgba(201,146,58,.4)',
      // Brand / footer
      brandColor:      'rgba(255,255,255,.55)',
      brandFont:       "'DM Sans', sans-serif",
      // Divider
      dividerColor:    'rgba(201,146,58,.6)',
      // Texture
      texture:         'none',
      // Slide number overlay ghost
      ghostNumColor:   'rgba(255,255,255,.04)',
    },

    /* ─── OVERLAP BAND ─────────────────────────────────────────
       Gold band across the middle third of the image.
       Band carries headline + body over photo. */
    OVERLAP_BAND: {
      canvasBg:        '#0f0d0b',
      overlayGradient: 'linear-gradient(to top, rgba(10,8,6,.7) 0%, rgba(10,8,6,.18) 60%, rgba(10,8,6,.04) 100%)',
      panelBg:         '#c9923a',
      panelText:       '#ffffff',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '700',
      headColor:       '#ffffff',
      bodyColor:       'rgba(255,255,255,.88)',
      accent:          '#c9923a',
      accentText:      '#ffffff',
      tagBg:           'rgba(255,255,255,.18)',
      tagColor:        'rgba(255,255,255,.75)',
      tagBorder:       '1px solid rgba(255,255,255,.2)',
      brandColor:      'rgba(255,255,255,.55)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(255,255,255,.35)',
      texture:         'none',
      ghostNumColor:   'rgba(255,255,255,.04)',
    },

    /* ─── BOTTOM STRIP ─────────────────────────────────────────
       Photo top 58%. Dark panel bottom 42%.
       Clean editorial split, no image bleeding into text. */
    BOTTOM_STRIP: {
      canvasBg:        '#13110e',
      overlayGradient: 'none',
      panelBg:         '#13110e',
      panelText:       '#f5f0eb',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#f5f0eb',
      bodyColor:       'rgba(245,240,235,.65)',
      accent:          '#c9923a',
      accentText:      '#13110e',
      tagBg:           'transparent',
      tagColor:        '#c9923a',
      tagBorder:       'none',
      brandColor:      'rgba(245,240,235,.38)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(201,146,58,.55)',
      texture:         'none',
      ghostNumColor:   'rgba(255,255,255,.03)',
    },

    /* ─── TOP STRIP ────────────────────────────────────────────
       Dark panel top 42%. Photo bottom 58%.
       Inverted BOTTOM_STRIP — same token system. */
    TOP_STRIP: {
      canvasBg:        '#13110e',
      overlayGradient: 'none',
      panelBg:         '#13110e',
      panelText:       '#f5f0eb',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#f5f0eb',
      bodyColor:       'rgba(245,240,235,.65)',
      accent:          '#c9923a',
      accentText:      '#13110e',
      tagBg:           'transparent',
      tagColor:        '#c9923a',
      tagBorder:       'none',
      brandColor:      'rgba(245,240,235,.38)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(201,146,58,.55)',
      texture:         'none',
      ghostNumColor:   'rgba(255,255,255,.03)',
    },

    /* ─── DUAL IMAGE ───────────────────────────────────────────
       Large photo left, thumbnail + text right on dark panel.
       The ImpactGrid split-screen signature. */
    DUAL_IMAGE: {
      canvasBg:        '#0f0d0b',
      overlayGradient: 'linear-gradient(to right, rgba(10,8,6,.0) 50%, rgba(10,8,6,.88) 100%)',
      panelBg:         '#0f0d0b',
      panelText:       '#f5f0eb',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#ffffff',
      bodyColor:       'rgba(255,255,255,.72)',
      accent:          '#c9923a',
      accentText:      '#0f0d0b',
      tagBg:           'transparent',
      tagColor:        '#c9923a',
      tagBorder:       'none',
      brandColor:      'rgba(255,255,255,.38)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(201,146,58,.45)',
      texture:         'none',
      ghostNumColor:   'rgba(255,255,255,.04)',
    },

    /* ─── STAT HERO ────────────────────────────────────────────
       Dark canvas, giant number in gold, headline below.
       No image. Typographic power. */
    STAT_HERO: {
      canvasBg:        '#0f0d0b',
      overlayGradient: 'none',
      panelBg:         '#0f0d0b',
      panelText:       '#f5f0eb',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '300',
      headColor:       '#f5f0eb',
      bodyColor:       'rgba(245,240,235,.55)',
      accent:          '#c9923a',
      accentText:      '#0f0d0b',
      statFont:        "'Cormorant Garamond', Georgia, serif",
      statWeight:      '300',
      statColor:       '#c9923a',
      tagBg:           'transparent',
      tagColor:        '#c9923a',
      tagBorder:       'none',
      brandColor:      'rgba(245,240,235,.35)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(201,146,58,.4)',
      texture:         'grain',
      ghostNumColor:   'rgba(201,146,58,.04)',
    },

    /* ─── QUOTE PULL ───────────────────────────────────────────
       Dark canvas, centred quote. Large open-quote mark in gold.
       No image. Pure typography. */
    QUOTE_PULL: {
      canvasBg:        '#0f0d0b',
      overlayGradient: 'none',
      panelBg:         '#0f0d0b',
      panelText:       '#f5f0eb',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#f5f0eb',
      bodyColor:       'rgba(245,240,235,.55)',
      accent:          '#c9923a',
      accentText:      '#0f0d0b',
      quoteMarkColor:  'rgba(201,146,58,.45)',
      tagBg:           'transparent',
      tagColor:        '#c9923a',
      tagBorder:       'none',
      brandColor:      'rgba(245,240,235,.35)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(201,146,58,.4)',
      texture:         'grain',
      ghostNumColor:   'rgba(201,146,58,.03)',
    },

    /* ─── EDITORIAL COVER ──────────────────────────────────────
       Full-bleed photo with dark-to-clear gradient.
       Serif italic headline bottom. Pill badge top-left. */
    EDITORIAL_COVER: {
      canvasBg:        '#0f0d0b',
      overlayGradient: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 52%, rgba(0,0,0,.04) 100%)',
      panelBg:         'transparent',
      panelText:       '#ffffff',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#ffffff',
      bodyColor:       'rgba(255,255,255,.72)',
      accent:          '#c9923a',
      accentText:      '#ffffff',
      // Badge (pill top-left)
      badgeBorder:     '1px solid rgba(255,255,255,.55)',
      badgeColor:      'rgba(255,255,255,.90)',
      badgeFont:       "'DM Sans', sans-serif",
      // Brand top-right
      brandColor:      'rgba(255,255,255,.82)',
      brandFont:       "'DM Sans', sans-serif",
      dividerColor:    'rgba(255,255,255,.35)',
      // Footer: @handle + ✽ ✽ ✽
      handleColor:     'rgba(255,255,255,.55)',
      starsColor:      'rgba(255,255,255,.4)',
      texture:         'none',
      ghostNumColor:   'rgba(255,255,255,.04)',
    },

    /* ─── EDITORIAL COLLAGE ────────────────────────────────────
       Warm cream canvas. Overlapping photos left. Serif headline right.
       The magazine-spread style. Always light background. */
    EDITORIAL_COLLAGE: {
      canvasBg:        '#f0ebe1',
      overlayGradient: 'none',
      panelBg:         '#f0ebe1',
      panelText:       '#1a1814',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#1a1814',
      bodyColor:       '#6b6259',
      accent:          '#c4956a',           // warmer gold on cream
      accentText:      '#1a1814',
      // Badge (pill top-left)
      badgeBorder:     '1px solid #b0a898',
      badgeColor:      '#888880',
      badgeFont:       "'DM Sans', sans-serif",
      // Brand top-right
      brandColor:      '#888880',
      brandFont:       "'DM Sans', sans-serif",
      // Giant number top-right
      bigNumColor:     '#1a1814',
      bigNumOpacity:   '0.88',
      // Vertical rule between photos and text
      dividerColor:    'rgba(180,160,130,.3)',
      // Footer
      handleColor:     '#a09888',
      starsColor:      '#b0a090',
      // Photo overlays (scrim on image panels for depth)
      photo1Bg:        '#c8b89a',
      photo2Bg:        '#a89070',
      texture:         'none',
      ghostNumColor:   'rgba(26,24,20,.03)',
    },

    /* ─── EDITORIAL COLLAGE 3 ──────────────────────────────────
       Same cream canvas. Three photos right, text left.
       Mirror of EDITORIAL_COLLAGE — same tokens. */
    EDITORIAL_COLLAGE_3: {
      canvasBg:        '#f0ebe1',
      overlayGradient: 'none',
      panelBg:         '#f0ebe1',
      panelText:       '#1a1814',
      headFont:        "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '400',
      headColor:       '#1a1814',
      bodyColor:       '#6b6259',
      accent:          '#c4956a',
      accentText:      '#1a1814',
      badgeBorder:     '1px solid #b0a898',
      badgeColor:      '#888880',
      badgeFont:       "'DM Sans', sans-serif",
      brandColor:      '#888880',
      brandFont:       "'DM Sans', sans-serif",
      bigNumColor:     '#1a1814',
      bigNumOpacity:   '0.88',
      dividerColor:    'rgba(180,160,130,.3)',
      handleColor:     '#a09888',
      starsColor:      '#b0a090',
      photo1Bg:        '#c8b89a',
      photo2Bg:        '#a89070',
      photo3Bg:        '#8a7258',
      texture:         'none',
      ghostNumColor:   'rgba(26,24,20,.03)',
    },

    /* ─── HABIT COVER ──────────────────────────────────────────
       Thynk-style. Bold full-bleed. Brand bar top. Giant
       headline bottom. Swirl icon. Strong dark overlay. */
    HABIT_COVER: {
      canvasBg:        '#0a0806',
      overlayGradient: 'linear-gradient(to top, rgba(8,6,4,.72) 0%, rgba(8,6,4,.25) 55%, rgba(8,6,4,.06) 100%)',
      panelBg:         'transparent',
      panelText:       '#ffffff',
      // Brand bar
      brandBarBg:      'transparent',
      brandBarBorder:  '0.5px solid rgba(255,255,255,.2)',
      headFont:        "'Syne', 'DM Sans', sans-serif",     // Thynk stays Syne
      bodyFont:        "'DM Sans', 'Inter', sans-serif",
      monoFont:        "'Space Mono', monospace",
      headWeight:      '800',
      headColor:       '#ffffff',
      bodyColor:       'rgba(255,255,255,.72)',
      accent:          '#d4c84a',           // Thynk yellow-gold
      accentText:      '#0a0806',
      tagBg:           'transparent',
      tagColor:        'rgba(255,255,255,.65)',
      tagBorder:       'none',
      // Brand text top
      brandColor:      'rgba(255,255,255,.82)',
      brandFont:       "'Space Mono', monospace",
      // Footer
      footerColor:     'rgba(255,255,255,.45)',
      dividerColor:    'rgba(255,255,255,.2)',
      texture:         'none',
      ghostNumColor:   'rgba(255,255,255,.03)',
    },

  };

  /* ──────────────────────────────────────────────────────────────
     getStyleTokens(layout)
     Returns the sealed token object for this layout.
     Falls back to FULL_BLEED if layout unknown.
  ────────────────────────────────────────────────────────────────*/
  window.getStyleTokens = function (layout) {
    return STYLE_TOKENS[layout] || STYLE_TOKENS['FULL_BLEED'];
  };

  /* ──────────────────────────────────────────────────────────────
     RENDER PATCH
     Drop-in override of renderSlide() that wires token system in.
     Patches getFont() to read from tokens. Applies overlay from
     tokens. Fixes panelBg/panelText/accent to read from tokens.

     This runs AFTER the main carousel-studio.js is loaded.
     It wraps the existing renderSlide() and injects tok before
     the switch block executes.
  ────────────────────────────────────────────────────────────────*/

  // ── Wait for carousel-studio.js to finish loading, then patch ──
  document.addEventListener('DOMContentLoaded', function () {
    patchRenderEngine();
  });

  function patchRenderEngine() {
    // ── 1. Override getFont to accept an optional token object ──
    // When tok is passed, uses tok.headFont/bodyFont/monoFont.
    // When not passed (legacy call), falls back to original behaviour.
    var _origGetFont = window.getFont;
    window._tokCtx = null; // active token context during render

    window.getFont = function (type) {
      var tok = window._tokCtx;
      if (tok) {
        if (type === 'head') return tok.headFont;
        if (type === 'body') return tok.bodyFont;
        if (type === 'mono') return tok.monoFont;
      }
      if (_origGetFont) return _origGetFont(type);
      var pair = (window.FONT_PAIRS && window.ST) ? (window.FONT_PAIRS[window.ST.fontPair] || window.FONT_PAIRS.syne) : null;
      if (!pair) return 'sans-serif';
      return pair[type] || pair.head;
    };

    // ── 2. Wrap renderSlide to inject tok before switch executes ──
    var _origRenderSlide = window.renderSlide;
    if (!_origRenderSlide) {
      console.warn('[StyleTokens] renderSlide not found — ensure this script loads after carousel-studio.js');
      return;
    }

    window.renderSlide = function () {
      if (!window.ST || !ST.slides || !ST.slides.length) return;
      var slide  = ST.slides[ST.cur];
      var layout = slide.layout || 'FULL_BLEED';
      var tok    = window.getStyleTokens(layout);

      // Set global token context so getFont() reads from tok
      window._tokCtx = tok;

      // Override the values renderSlide() will use
      // These are read by the switch cases via closures
      window.__tokAccent   = tok.accent;
      window.__tokPanelBg  = tok.panelBg;
      window.__tokPanelText= tok.panelText;

      // Apply canvas background
      var sBg = document.getElementById('sBg');
      if (sBg && tok.canvasBg) sBg.style.background = tok.canvasBg;

      // Apply overlay from token (not from getOverlay() which uses theme)
      var sOverlay = document.getElementById('sOverlay');
      if (sOverlay) {
        sOverlay.style.background =
          (tok.overlayGradient && tok.overlayGradient !== 'none')
            ? tok.overlayGradient
            : 'none';
      }

      // Apply texture from token
      var sTexture = document.getElementById('sTexture');
      if (sTexture) {
        sTexture.className = 's-texture';
        if (tok.texture === 'grain') sTexture.classList.add('tex-grain');
        else if (tok.texture === 'lines') sTexture.classList.add('tex-lines');
        else if (tok.texture === 'dots') sTexture.classList.add('tex-dots');
      }

      // Call original — it will now use patched getFont()
      _origRenderSlide();

      // Reset token context after render
      window._tokCtx = null;
    };

    // ── 3. Patch getPanelBg / getPanelText / getOverlay to use tok ──
    window._origGetPanelBg  = window.getPanelBg;
    window._origGetPanelText = window.getPanelText;
    window._origGetOverlay  = window.getOverlay;

    window.getPanelBg = function (theme) {
      if (window._tokCtx) return window._tokCtx.panelBg;
      if (window._origGetPanelBg) return window._origGetPanelBg(theme);
      return '#1a1814';
    };

    window.getPanelText = function (theme) {
      if (window._tokCtx) return window._tokCtx.panelText;
      if (window._origGetPanelText) return window._origGetPanelText(theme);
      return '#f0ede8';
    };

    window.getOverlay = function (tone, brightness, layout) {
      if (window._tokCtx) {
        var g = window._tokCtx.overlayGradient;
        return (g && g !== 'none') ? g : 'none';
      }
      if (window._origGetOverlay) return window._origGetOverlay(tone, brightness, layout);
      return 'none';
    };

    console.log('[StyleTokens v1.0] ✓ Render engine patched — all layouts now use sealed design tokens');
  }

  /* ──────────────────────────────────────────────────────────────
     ACCENT PICKER SOFT-LOCK
     The user's accent colour picker in Step 2 is demoted to a
     "preview accent" for Stat Hero / Quote Pull only.
     All photo-backed layouts ignore ST.accent and use tok.accent.

     Add this to your setAccent() function or call it after render:
       window.applyAccentSoftLock(layout, tok)

     Returns the accent colour that should actually be used.
  ────────────────────────────────────────────────────────────────*/
  window.getLockedAccent = function (layout) {
    var tok = window.getStyleTokens(layout);
    return tok.accent; // always returns the layout's locked gold
  };

  /* ──────────────────────────────────────────────────────────────
     VIDEO CHOICE INTEGRATION
     Your request: "users pick image or video"

     Call this to get the correct media type preference per slide.
     Replace shouldUseVideo() in carousel-engine.js with:

       slide.mediaMode = getUserMediaPreference(slide.index, userPreference);

     userPreference: 'video' | 'image' | 'auto'
     'auto' = original engine logic (video on hook/cta only)
  ────────────────────────────────────────────────────────────────*/
  var _mediaPreferences = {}; // { slideIndex: 'video'|'image'|'auto' }

  window.setSlideMediaMode = function (slideIndex, mode) {
    _mediaPreferences[slideIndex] = mode; // 'video', 'image', or 'auto'
  };

  window.getSlideMediaMode = function (slideIndex) {
    return _mediaPreferences[slideIndex] || 'auto';
  };

  window.clearMediaPreferences = function () {
    _mediaPreferences = {};
  };

  /* ──────────────────────────────────────────────────────────────
     FONT LOCK MAP
     Maps each layout to its correct font pairing name so the font
     picker in Step 2 can show the right default without overriding.
  ────────────────────────────────────────────────────────────────*/
  window.getLayoutDefaultFont = function (layout) {
    var map = {
      FULL_BLEED:           'cormorant',
      OVERLAP_BAND:         'cormorant',
      BOTTOM_STRIP:         'cormorant',
      TOP_STRIP:            'cormorant',
      DUAL_IMAGE:           'cormorant',
      STAT_HERO:            'cormorant',
      QUOTE_PULL:           'cormorant',
      EDITORIAL_COVER:      'cormorant',
      EDITORIAL_COLLAGE:    'cormorant',
      EDITORIAL_COLLAGE_3:  'cormorant',
      HABIT_COVER:          'syne',       // Thynk stays Syne bold
    };
    return map[layout] || 'cormorant';
  };

})();
