/* ============================================================
   ImpactGrid — Dynamic Homepage Slides Loader
   Add this <script> block to index.html AFTER supabase-config.js
   It replaces the hardcoded hero slides with admin-managed content
   ============================================================ */

(async function loadDynamicSlides(){

  /* ── Try to load slides from Supabase ── */
  var slides = [];
  try{
    var c = (window.getSupabase && getSupabase()) || window.supabaseClient;
    if(c){
      var { data } = await c
        .from('site_slides')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });
      slides = data || [];
    }
  }catch(e){ console.warn('[Slides] Could not load from Supabase:', e.message); }

  /* Fall back to built-in slides if none found */
  if(!slides.length) return;

  /* ── Build slide HTML ── */
  var track = document.getElementById('slideTrack');
  var dotsEl = document.getElementById('slideDots');
  if(!track) return;

  var tagStyles = {
    new:  'background:rgba(240,180,41,0.14);color:#f0b429;border:1px solid rgba(240,180,41,0.3);',
    live: 'background:rgba(45,212,160,0.12);color:#2dd4a0;border:1px solid rgba(45,212,160,0.3);',
    soon: 'background:rgba(79,142,247,0.10);color:#7eb3ff;border:1px solid rgba(79,142,247,0.2);'
  };

  function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  track.innerHTML = slides.map(function(s, i){
    var accent    = s.overlay_color || '#f0b429';
    var tagStyle  = tagStyles[s.tag_type||'new'] || tagStyles.new;
    var isVideo   = s.type === 'video';

    /* Background: video or image */
    var bgContent = isVideo
      ? '<video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:0;opacity:0.55;" src="'+esc(s.url)+'"></video>'
      : (s.url ? '<div style="position:absolute;inset:0;background:url(\''+esc(s.url)+'\') center/cover no-repeat;border-radius:inherit;z-index:0;opacity:0.45;"></div>' : '');

    /* Overlay gradient */
    var overlay = '<div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,9,15,0.92) 0%,rgba(7,9,15,0.6) 55%,transparent 100%);border-radius:inherit;z-index:1;"></div>';

    return '<div class="slide" style="--slide-accent:'+esc(accent)+';position:relative;overflow:hidden;min-height:140px;">'+
      bgContent+
      overlay+
      '<div style="position:relative;z-index:2;grid-column:1/-1;padding:4px 0;">'+
        '<div style="display:inline-flex;align-items:center;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;padding:3px 9px;border-radius:5px;margin-bottom:9px;font-weight:500;'+tagStyle+'">'+esc(s.tag_text||'New')+'</div>'+
        '<div class="s-title">'+esc(s.title||'ImpactGrid Update')+'</div>'+
        (s.caption ? '<div class="s-desc">'+esc(s.caption)+'</div>' : '')+
        (s.cta_text && s.cta_url ? '<a href="'+esc(s.cta_url)+'" class="s-cta" style="color:'+esc(accent)+';">'+esc(s.cta_text)+' &#8594;</a>' : '')+
      '</div>'+
    '</div>';
  }).join('');

  /* Rebuild dots */
  if(dotsEl){
    dotsEl.innerHTML = slides.map(function(_, i){
      return '<div class="s-dot'+(i===0?' on':'')+'" onclick="goSlide('+i+')"></div>';
    }).join('');
  }

  /* Reinitialise slide counter (the slides JS uses total count) */
  /* The existing slides JS will pick up the new count automatically
     because it reads .slides-track children on next cycle */

})();

/* ── Also load dynamic ticker if available ── */
(async function loadDynamicTicker(){
  try{
    var c = (window.getSupabase && getSupabase()) || window.supabaseClient;
    if(!c) return;
    var { data } = await c
      .from('site_ticker')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if(!data || !data.length) return;

    function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    var tagClasses = { new:'tag-new', live:'tag-live', soon:'tag-soon' };

    var items = data.map(function(t){
      var tagCls = tagClasses[t.type||'new'] || 'tag-new';
      var labels = { new:'New', live:'Live', soon:'Soon' };
      var label  = labels[t.type||'new'] || 'New';
      return '<span class="t-item"><span class="t-tag '+tagCls+'">'+label+'</span>'+esc(t.text)+'</span>';
    });

    /* Duplicate for seamless loop */
    var allItems = items.concat(items);
    var scroll = document.getElementById('tickerScroll');
    if(scroll) scroll.innerHTML = allItems.join('');

  }catch(e){ console.warn('[Ticker] Could not load from Supabase:', e.message); }
})();
