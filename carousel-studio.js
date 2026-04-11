/* ═══════════════════════════════════════════════════════════
   IMPACTGRID — Carousel Studio
   carousel-studio.js  v3.0

   Sections:
   1.  Asset library (DA)
   2.  Theme detection
   3.  Asset picking & overlay helpers
   4.  Layout assignment
   5.  State
   6.  Topic input → intel detection
   7.  AI generation (callAI → server, fallback)
   8.  Slide parsing
   9.  Render engine — ALL layouts guaranteed text + creative image placement
   10. Strip builder
   11. Navigation
   12. Edit panel — full inline editing
   13. Image upload
   14. Accent / brand / theme
   15. Copy & Export — cross-device download (blob + iOS share)
   16. Toast
   17. Keyboard
   18. Init
   ═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   1. ASSET LIBRARY
   ───────────────────────────────────────────────────────── */
var DA = {
  "cozy-home":{
    label:"Cozy Home",mood:"warm",accentColor:"#c4956a",
    palette:["#f5e6d3","#c4956a","#8b6f47","#e8d5b7"],
    textColors:{onDark:"#f5e6d3",primary:"#2c1810"},
    assets:[
      {id:"ch-001",url:"https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","split-right"],text_safe_zones:["bottom-left","bottom"]},
      {id:"ch-002",url:"https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"ch-004",url:"https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ch-005",url:"https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"ch-006",url:"https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"ch-009",url:"https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"ch-011",url:"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","split-right"],text_safe_zones:["left","bottom"]},
      {id:"ch-015",url:"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","bottom"]}
    ]
  },
  "workspace":{
    label:"Workspace",mood:"focused",accentColor:"#38bdf8",
    palette:["#0f172a","#1e293b","#334155","#e2e8f0"],
    textColors:{onDark:"#e2e8f0",primary:"#0f172a"},
    assets:[
      {id:"ws-001",url:"https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","split-right","full-bleed"],text_safe_zones:["left","bottom-left"]},
      {id:"ws-004",url:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","thumbnail","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ws-005",url:"https://images.unsplash.com/photo-1487014679447-9f8336841d58?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["center","top"]},
      {id:"ws-010",url:"https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed"],text_safe_zones:["center","bottom"]},
      {id:"ws-011",url:"https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"ws-013",url:"https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=1080&h=1080&fit=crop",tone:"cool",brightness:"low",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","center"]},
      {id:"ws-017",url:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["left","bottom-left"]},
      {id:"ws-019",url:"https://images.unsplash.com/photo-1589561253898-768105ca91a8?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text"],text_safe_zones:["center","bottom"]}
    ]
  },
  "minimal":{
    label:"Minimal",mood:"clean",accentColor:"#404040",
    palette:["#fafafa","#e5e5e5","#a3a3a3","#171717"],
    textColors:{onDark:"#fafafa",primary:"#171717"},
    assets:[
      {id:"mn-001",url:"https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"mn-002",url:"https://images.unsplash.com/photo-1494526585095-c41746248156?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["center","bottom"]},
      {id:"mn-004",url:"https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","center"]},
      {id:"mn-005",url:"https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1080&h=1080&fit=crop",tone:"cool",brightness:"high",layout_hints:["background","split-left"],text_safe_zones:["right","center"]},
      {id:"mn-009",url:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left"],text_safe_zones:["right","bottom-right"]},
      {id:"mn-011",url:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"medium",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","left"]},
      {id:"mn-014",url:"https://images.unsplash.com/photo-1519461593925-9af3e6d20e6b?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom-left","center"]},
      {id:"mn-017",url:"https://images.unsplash.com/photo-1565183928294-7063f23ce0f8?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom","right"]}
    ]
  },
  "luxury":{
    label:"Luxury",mood:"dramatic",accentColor:"#c9a227",
    palette:["#1a1209","#3d2b0a","#8b6914","#f0e6d3"],
    textColors:{onDark:"#f0e6d3",primary:"#1a1209"},
    assets:[
      {id:"lx-001",url:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"lx-002",url:"https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"lx-004",url:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","overlay-text","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"lx-006",url:"https://images.unsplash.com/photo-1567538096621-38d2284b23ff?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","split-left"],text_safe_zones:["right","center"]},
      {id:"lx-007",url:"https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=1080&h=1080&fit=crop",tone:"warm",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"lx-010",url:"https://images.unsplash.com/photo-1619292560554-3c3462a59c95?w=1080&h=1080&fit=crop",tone:"warm",brightness:"low",layout_hints:["background","overlay-text"],text_safe_zones:["center","bottom"]},
      {id:"lx-012",url:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"lx-018",url:"https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=1080&h=1080&fit=crop",tone:"neutral",brightness:"high",layout_hints:["background","full-bleed","thumbnail"],text_safe_zones:["bottom","left"]}
    ]
  },
  "lifestyle":{
    label:"Lifestyle",mood:"vibrant",accentColor:"#e8a45a",
    palette:["#1e3a5f","#e8a45a","#2d6a4f","#f5f0eb"],
    textColors:{onDark:"#f5f0eb",primary:"#1a1a1a"},
    assets:[
      {id:"ls-002",url:"https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"ls-003",url:"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-left","thumbnail"],text_safe_zones:["right","bottom-right"]},
      {id:"ls-005",url:"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","full-bleed","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ls-007",url:"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","full-bleed","overlay-text"],text_safe_zones:["bottom","center"]},
      {id:"ls-008",url:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","split-right"],text_safe_zones:["left","bottom-left"]},
      {id:"ls-009",url:"https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=1080&h=1080&fit=crop",tone:"warm",brightness:"high",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","bottom"]},
      {id:"ls-015",url:"https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1080&h=1080&fit=crop",tone:"cool",brightness:"medium",layout_hints:["background","overlay-text","full-bleed"],text_safe_zones:["top","center"]},
      {id:"ls-016",url:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1080&fit=crop",tone:"cool",brightness:"high",layout_hints:["background","full-bleed"],text_safe_zones:["bottom","center"]}
    ]
  }
};

/* ─────────────────────────────────────────────────────────
   2. THEME DETECTION
   ───────────────────────────────────────────────────────── */
var SIGNALS = {
  workspace:["produc","habit","routine","income","money","business","sales","revenue","market","strategy","content creator","social media","creator","brand","client","freelance","hustle","grow","audience","follower","engagement","post","reel","youtube","tiktok","linkedin","coach","consult","email","newsletter","launch","offer","scale","lead","funnel","analytics","workflow","system","tool","app","automat","schedule","outsource","team","agency","niche","platform","algorithm","viral","six figure","seven figure","passive income"],
  luxury:["luxury","premium","high-end","wealthy","rich","millionaire","billionaire","elite","exclusive","five-star","penthouse","yacht","villa","mansion","ferrari","rolex","designer","couture","champagne","caviar","bespoke","curated","aspirational","status","wealth","invest","portfolio","asset","financial freedom","retire early"],
  "cozy-home":["home","interior","cozy","cosy","decor","room","kitchen","bedroom","living room","candle","blanket","fireplace","warm","comfort","hygge","nest","sanctuary","organis","clean","tidy","minimalist home","aesthetic home","apartment","garden","plant","slow living","self care","morning at home"],
  minimal:["minimal","simple","clean","white","neutral","scandinavian","nordic","declutter","essentialism","less is more","capsule","wardrobe","fashion","style","aesthetic","photography","art","design","branding","logo","font","typography","architecture","layout","flat lay"],
  lifestyle:["lifestyle","travel","food","fitness","health","wellness","workout","gym","run","yoga","mindfulness","meditation","adventure","explore","wander","beach","mountain","cafe","restaurant","friend","family","social","joy","happy","energy","motivation","inspire","morning","personal","authentic","real","story","journey","transform","glow up","before after","vlog"]
};

function detectTheme(text){
  if(!text||text.trim().length<3) return 'lifestyle';
  var t=text.toLowerCase(),scores={};
  Object.keys(SIGNALS).forEach(function(th){
    scores[th]=0;
    SIGNALS[th].forEach(function(kw){ if(t.indexOf(kw)!==-1) scores[th]+=(kw.split(' ').length>1?4:2); });
  });
  var best='lifestyle',bestScore=0;
  Object.keys(scores).forEach(function(th){ if(scores[th]>bestScore){bestScore=scores[th];best=th;} });
  return best;
}

/* ─────────────────────────────────────────────────────────
   3. ASSET PICKING & OVERLAY HELPERS
   ───────────────────────────────────────────────────────── */
function pickAsset(theme, slideType, slideIndex, offset){
  var T=DA[theme]; if(!T||!T.assets.length) return null;
  var prefer={hook:'overlay-text',cta:'overlay-text',stat:'split-right',quote:'full-bleed',value:'full-bleed',list:'split-left',insight:'full-bleed',lesson:'full-bleed',problem:'overlay-text',proof:'split-right',story:'overlay-text'}[slideType]||'full-bleed';
  var scored=T.assets.map(function(a,i){
    var s=a.layout_hints.indexOf(prefer)!==-1?10:0;
    s+=a.layout_hints.indexOf('background')!==-1?2:0;
    return {a:a,s:s,i:i};
  }).sort(function(x,y){return y.s-x.s||x.i-y.i;});
  var idx=(slideIndex+(offset||0))%scored.length;
  return scored[idx].a;
}

function pickSecondAsset(theme, excludeId, slideIndex){
  var T=DA[theme]; if(!T) return null;
  var pool=T.assets.filter(function(a){ return a.id!==excludeId && a.layout_hints.indexOf('thumbnail')!==-1; });
  if(!pool.length) pool=T.assets.filter(function(a){ return a.id!==excludeId; });
  if(!pool.length) return null;
  return pool[slideIndex%pool.length];
}

function getOverlay(tone,brightness,layout){
  if(layout==='SPLIT_LEFT'||layout==='SPLIT_RIGHT'||layout==='MAGAZINE_SPLIT') return 'none';
  if(brightness==='low') return 'linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.15) 100%)';
  if(tone==='neutral'&&brightness==='high') return 'linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.25) 55%,transparent 100%)';
  if(tone==='warm') return 'linear-gradient(to top,rgba(12,7,3,.9) 0%,rgba(12,7,3,.4) 55%,rgba(12,7,3,.08) 100%)';
  if(tone==='cool') return 'linear-gradient(to top,rgba(8,12,22,.92) 0%,rgba(8,12,22,.4) 55%,transparent 100%)';
  return 'linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.35) 55%,transparent 100%)';
}

function getTextColors(tone,brightness,themeKey){
  if((themeKey==='minimal'||themeKey==='cozy-home')&&brightness==='high'){
    return {head:'#1a1814',body:'rgba(26,24,20,.75)',tagBg:'rgba(26,24,20,.1)',tagColor:'#1a1814'};
  }
  return {head:'#ffffff',body:'rgba(255,255,255,.85)',tagBg:'rgba(0,0,0,.5)',tagColor:'#ffffff'};
}

function getPanelBg(theme){
  return {workspace:'#0f172a',luxury:'#1a1209',minimal:'#f7f7f5','cozy-home':'#f5e6d3',lifestyle:'#1e3a5f'}[theme]||'#1a1814';
}

function getPanelText(theme){
  return (['minimal','cozy-home'].indexOf(theme)!==-1)?'#1a1814':'#f0ede8';
}

/* ─────────────────────────────────────────────────────────
   4. LAYOUT ASSIGNMENT
   ───────────────────────────────────────────────────────── */
var LAYOUT_SEQUENCE = [
  'FULL_BLEED','SPLIT_LEFT','CORNER_FLOAT','OVERLAP_BAND','SPLIT_RIGHT',
  'BOTTOM_STRIP','STAT_HERO','QUOTE_PULL','DUAL_IMAGE','GRID_POINTS',
  'TOP_STRIP','MAGAZINE_SPLIT'
];

function assignLayout(slideType,idx,total){
  var sets={
    hook:['FULL_BLEED','CORNER_FLOAT','OVERLAP_BAND'],
    cta:['SPLIT_RIGHT','CORNER_FLOAT','FULL_BLEED'],
    stat:['STAT_HERO','SPLIT_RIGHT','SPLIT_LEFT'],
    value:['SPLIT_LEFT','FULL_BLEED','CORNER_FLOAT','SPLIT_RIGHT','OVERLAP_BAND','BOTTOM_STRIP'],
    insight:['OVERLAP_BAND','SPLIT_RIGHT','FULL_BLEED','TOP_STRIP'],
    lesson:['SPLIT_LEFT','BOTTOM_STRIP','FULL_BLEED','MAGAZINE_SPLIT'],
    proof:['SPLIT_RIGHT','DUAL_IMAGE','CORNER_FLOAT'],
    quote:['QUOTE_PULL','FULL_BLEED'],
    story:['FULL_BLEED','CORNER_FLOAT','TOP_STRIP'],
    problem:['FULL_BLEED','OVERLAP_BAND','SPLIT_LEFT'],
    list:['GRID_POINTS','SPLIT_LEFT','BOTTOM_STRIP'],
    tip:['SPLIT_LEFT','CORNER_FLOAT','OVERLAP_BAND','BOTTOM_STRIP']
  };
  var set=sets[slideType]||LAYOUT_SEQUENCE;
  return set[idx%set.length];
}

function headlineSize(text){
  var l=(text||'').length;
  if(l<20) return 38; if(l<30) return 33; if(l<45) return 28; if(l<60) return 24; return 20;
}

/* ─────────────────────────────────────────────────────────
   5. STATE
   ───────────────────────────────────────────────────────── */
var ST={slides:[],cur:0,count:7,theme:null,zoom:100,format:'square',accent:'#2563eb',brand:'',userImages:{},assetOffset:0,exportType:'png'};

/* ─────────────────────────────────────────────────────────
   6. TOPIC INPUT → INTEL DETECTION
   ───────────────────────────────────────────────────────── */
var dTimer;
function onTopicInput(){
  clearTimeout(dTimer);
  var v=document.getElementById('topicInput').value.trim();
  document.getElementById('genBtn').disabled=v.length<4;
  if(v.length<4){resetIntel();return;}
  dTimer=setTimeout(function(){runDetect(v);},350);
}

function resetIntel(){
  document.getElementById('intelCard').classList.remove('active');
  document.getElementById('intelVal').textContent='Waiting for topic…';
  document.getElementById('intelLbl').textContent='DIJO INTELLIGENCE';
  for(var i=0;i<5;i++) document.getElementById('iseg'+i).classList.remove('on');
  document.getElementById('assetPreviewField').style.display='none';
}

function runDetect(topic){
  var theme=detectTheme(topic); ST.theme=theme;
  var T=DA[theme]; if(!T) return;
  var card=document.getElementById('intelCard');
  card.classList.add('active');
  document.getElementById('intelLbl').textContent='THEME DETECTED';
  document.getElementById('intelVal').textContent=T.label+' · '+T.mood;
  var t2=topic.toLowerCase(),score=0;
  (SIGNALS[theme]||[]).forEach(function(kw){if(t2.indexOf(kw)!==-1) score++;});
  var segs=Math.min(5,Math.max(1,Math.round(score/1.5)));
  for(var i=0;i<5;i++) document.getElementById('iseg'+i).classList.toggle('on',i<segs);
  showAssetPreview(theme);
}

function showAssetPreview(theme){
  var T=DA[theme],row=document.getElementById('assetRow');
  row.innerHTML='';
  T.assets.slice(0,6).forEach(function(a){
    var d=document.createElement('div'); d.className='ath';
    var img=document.createElement('img');
    img.src=a.url.replace('w=1080&h=1080','w=120&h=120');
    img.onload=function(){d.classList.add('loaded');};
    d.appendChild(img); row.appendChild(d);
  });
  document.getElementById('assetPreviewField').style.display='block';
}

/* ─────────────────────────────────────────────────────────
   7. AI GENERATION
   ───────────────────────────────────────────────────────── */
var DIJO_SERVER='https://impactgrid-dijo.onrender.com';

async function generate(){
  var topic=document.getElementById('topicInput').value.trim();
  if(!topic){toast('⚠️ Add a topic first');document.getElementById('topicInput').focus();return;}
  if(!ST.theme) ST.theme=detectTheme(topic);
  var platform=document.getElementById('platSelect').value;
  var tone=document.getElementById('toneSelect').value;
  var count=ST.count;
  var btn=document.getElementById('genBtn');
  btn.innerHTML='<div class="spin"></div> Generating…';btn.disabled=true;
  document.getElementById('emptyState').style.display='none';
  document.getElementById('slideWrap').style.display='block';
  document.getElementById('loadingOv').classList.add('show');
  var hints=['Detecting theme…','Scoring images with AI vision…','Writing SEO copy & hashtags…','Designing layouts…','Adding video where needed…','Polishing your carousel…'];
  var hi=0,hTimer=setInterval(function(){hi=(hi+1)%hints.length;document.getElementById('loadingHint').textContent=hints[hi];},1800);
  try{
    var data=await callAI(topic,platform,tone,count);
    ST.slides=parseServerSlides(data,topic,platform,tone,count);
    if(data.theme&&DA[data.theme]) ST.theme=data.theme;
    if(data.accentColor) ST.accent=data.accentColor;
    // Update accent dot UI
    document.querySelectorAll('.cdot').forEach(function(d){d.classList.remove('on');});
  }catch(e){
    console.warn('[Carousel] Server error, using fallback:',e);
    ST.slides=fallbackSlides(topic,platform,tone,count);
    toast('⚡ Generated offline — server busy');
  }
  clearInterval(hTimer);
  document.getElementById('loadingOv').classList.remove('show');
  ST.cur=0;
  buildStrip();renderSlide();updateCounter();fillEdit();
  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Regenerate';
  btn.disabled=false;
  toast('✦ '+ST.slides.length+'-slide carousel · '+DA[ST.theme].label+' · tap any slide to edit');
}

async function callAI(topic,platform,tone,count){
  var res=await fetch(DIJO_SERVER+'/carousel/generate',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({topic:topic,platform:platform,tone:tone,count:count,themeOverride:ST.theme||null})
  });
  if(!res.ok) throw new Error('Server responded '+res.status);
  return await res.json();
}

/* ─────────────────────────────────────────────────────────
   8. SLIDE PARSING
   ───────────────────────────────────────────────────────── */
function parseServerSlides(data,topic,platform,tone,count){
  try{
    if(!data.slides||!Array.isArray(data.slides)) throw new Error('no slides');
    var total=data.slides.length;
    return data.slides.map(function(sl,i){
      var primaryImage=null;
      if(sl.image) primaryImage={url:sl.image,tone:sl.imageMood||'neutral',brightness:'medium'};
      else if(sl.primaryImage) primaryImage=sl.primaryImage;

      var secondImage=null;
      if(sl.image2) secondImage={url:sl.image2,tone:'neutral',brightness:'medium'};
      else if(sl.secondImage) secondImage=sl.secondImage;

      // Determine layout — prefer AI suggestion, fall back to assignment
      var rawLayout=sl.aiLayout||sl.layout||'';
      var layout=LAYOUT_SEQUENCE.indexOf(rawLayout)!==-1?rawLayout:assignLayout(sl.type||'value',i,total);

      // Guarantee text — never allow empty headline
      var headline=sl.headline||sl.title||'';
      if(!headline||headline.length<3){
        headline=i===0?'Everything changes when you know this':
                 i===total-1?'Ready to take action?':
                 'Slide '+(i+1)+': '+topic;
      }

      var body=sl.body||sl.subline||sl.description||'';
      var caption=sl.caption||buildCaption(sl,i,data.trendHashtags||[]);
      var hashtags=sl.hashtags||data.trendHashtags||[];

      return {
        type:      sl.type||(i===0?'hook':i===total-1?'cta':'value'),
        layout:    layout,
        tag:       sl.tag||String(i+1).padStart(2,'0'),
        headline:  headline,
        subline:   sl.subline||'',
        body:      body,
        stat:      sl.stat||null,
        quote:     sl.quote||null,
        points:    sl.points||null,
        gridPoints:sl.gridPoints||(sl.points?sl.points.map(function(p,pi){
          var glyphs=['→','★','◆','✦','●','▲'];
          return {glyph:glyphs[pi%glyphs.length],text:p};
        }):null),
        cta:       sl.cta||'',
        caption:   caption,
        hashtags:  Array.isArray(hashtags)?hashtags.slice(0,8):[],
        primaryImage:primaryImage,
        secondImage: secondImage,
        video:     sl.video||null,
        useVideo:  !!(sl.video&&sl.video.url)
      };
    });
  }catch(e){
    console.warn('[parseServerSlides] Error:',e.message);
    return fallbackSlides(topic,platform,tone,count);
  }
}

function buildCaption(sl,idx,trendTags){
  if(sl.caption) return sl.caption;
  var tags=(sl.hashtags&&sl.hashtags.length?sl.hashtags:trendTags||[]).join(' ');
  var base=(sl.headline||'')+(sl.body?'\n\n'+sl.body:'')+'\n\n'+tags;
  return base.trim();
}

function fallbackSlides(topic,platform,tone,count){
  var hooks=['Nobody talks about this — but it changed everything.','I spent years getting this wrong. Here\'s the truth.','Most people skip this. That\'s why they struggle.','One shift. Everything clicks.'];
  var hook=hooks[Math.floor(Math.random()*hooks.length)];
  var vals=[
    {type:'value',headline:'The problem nobody admits',body:'Most people focus on the wrong thing entirely. Here\'s what actually moves the needle.',layout:'SPLIT_LEFT'},
    {type:'insight',headline:'The shift that changes everything',body:'Once you understand this, you can\'t go back.',layout:'OVERLAP_BAND'},
    {type:'stat',headline:'The numbers don\'t lie',body:'Creators who do this consistently outperform those who don\'t.',layout:'STAT_HERO',stat:'87%'},
    {type:'quote',headline:'',body:'',quote:'The secret was never the strategy. It was the consistency.',layout:'QUOTE_PULL'},
    {type:'lesson',headline:'What I wish I\'d known sooner',body:'Three years in, I finally understood this.',layout:'BOTTOM_STRIP'},
    {type:'proof',headline:'Here\'s what happened next',body:'The results weren\'t overnight. But they were real.',layout:'DUAL_IMAGE'},
    {type:'list',headline:'Four things to do today',body:'',layout:'GRID_POINTS',gridPoints:[{glyph:'→',text:'Start before you\'re ready'},{glyph:'★',text:'Ship consistently'},{glyph:'◆',text:'Study what works'},{glyph:'✦',text:'Double down fast'}]},
    {type:'value',headline:'The counterintuitive truth',body:'Everything you\'ve been told is backwards.',layout:'CORNER_FLOAT'},
    {type:'insight',headline:'Nobody will tell you this',body:'It\'s not about working harder. Order matters.',layout:'SPLIT_RIGHT'},
    {type:'tip',headline:'Start here, not there',body:'This single action creates the most momentum.',layout:'TOP_STRIP'}
  ];
  var slides=[{type:'hook',tag:'01',headline:hook,body:'Swipe through — breaking it all down. →',cta:'',layout:'FULL_BLEED',caption:hook+'\n\nSave this — you\'ll want it.\n\n#contentcreator #growthmindset #creatoreconomy',hashtags:['#contentcreator','#growthmindset','#creatoreconomy','#digitalmarketing','#socialmediatips']}];
  for(var i=1;i<count-1;i++){
    var v=vals[(i-1)%vals.length];
    slides.push({type:v.type,tag:String(i+1).padStart(2,'0'),headline:v.headline,body:v.body,cta:'',layout:v.layout,stat:v.stat||null,quote:v.quote||null,gridPoints:v.gridPoints||null,caption:'',hashtags:[]});
  }
  slides.push({type:'cta',tag:String(count).padStart(2,'0'),headline:'Ready to make this real?',body:'Follow for more. Save this post.',cta:'Follow for more →',layout:'SPLIT_RIGHT',caption:'Which slide hit hardest? Drop a number 👇\n\n#contentcreator #growthmindset #creatoreconomy',hashtags:['#contentcreator','#growthmindset','#creatoreconomy']});
  return slides.slice(0,count);
}

/* ─────────────────────────────────────────────────────────
   9. RENDER ENGINE — every layout guaranteed text + image
   ───────────────────────────────────────────────────────── */

/* Helper: clear all layout containers */
function clearLayouts(){
  ['sContent','sSplit','sCorner','sDual','sBand','sEditorial','sQuote','sStat','sGrid','sTopStrip','sBottomStrip'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.innerHTML='';el.className=el.className.replace(/\bhidden\b/g,'').trim()+' hidden';}
  });
}

/* Helper: show a layout container */
function showLayout(id){
  var el=document.getElementById(id);
  if(el) el.className=el.className.replace(/\bhidden\b/g,'').trim();
}

function renderSlide(){
  if(!ST.slides.length) return;
  var slide=ST.slides[ST.cur];
  var theme=ST.theme||'lifestyle';
  var T=DA[theme];
  var layout=slide.layout||assignLayout(slide.type,ST.cur,ST.slides.length);

  /* ── Resolve images ── */
  var primaryUrl=ST.userImages[ST.cur]||
    (slide.primaryImage?slide.primaryImage.url:null)||
    (function(){var a=pickAsset(theme,slide.type,ST.cur,ST.assetOffset);return a?a.url:null;})();

  var secondUrl=(slide.secondImage?slide.secondImage.url:null)||
    (function(){
      var excludeId=slide.primaryImage?slide.primaryImage.id:'';
      var a=pickSecondAsset(theme,excludeId,ST.cur);
      return a?a.url:null;
    })();

  var videoData=slide.video||null;

  /* ── Tone / colours ── */
  var assetMeta=slide.primaryImage||{tone:'neutral',brightness:'medium'};
  var tone2=assetMeta.tone||'neutral';
  var bri=assetMeta.brightness||'medium';
  var tc=getTextColors(tone2,bri,theme);
  var accent2=ST.accent||T.accentColor;
  var pBg=getPanelBg(theme);
  var pText=getPanelText(theme);

  /* ── DOM refs ── */
  var sBgImg=document.getElementById('sBgImg');
  var sVideo=document.getElementById('sBgVideo');
  var sOverlay=document.getElementById('sOverlay');
  var sTexture=document.getElementById('sTexture');
  var sBg=document.getElementById('sBg');

  clearLayouts();

  /* ── Background: video takes priority on full-bleed layouts ── */
  var useVideo=videoData&&videoData.url&&(layout==='FULL_BLEED'||layout==='OVERLAP_BAND');
  if(useVideo){
    sBgImg.style.opacity='0';
    sVideo.innerHTML='<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;opacity:.85"><source src="'+videoData.url+'" type="video/mp4"></video>';
    sVideo.style.display='block';
    sBg.style.background='#111';
  } else {
    sVideo.innerHTML='';sVideo.style.display='none';
    var needsBg=['FULL_BLEED','CORNER_FLOAT','DUAL_IMAGE','OVERLAP_BAND','TOP_STRIP','BOTTOM_STRIP'].indexOf(layout)!==-1;
    if(primaryUrl&&needsBg){
      sBgImg.style.backgroundImage='url('+primaryUrl+')';
      sBgImg.style.opacity='1';
      sBg.style.background='#111';
    } else if(!needsBg){
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
    } else {
      sBgImg.style.backgroundImage=primaryUrl?'url('+primaryUrl+')':'none';
      sBgImg.style.opacity=primaryUrl?'1':'0';
      sBg.style.background=primaryUrl?'#111':T.palette[0];
    }
  }

  /* ── Overlay ── */
  var ov=getOverlay(tone2,bri,layout);
  sOverlay.style.background=ov==='none'?'none':ov;

  /* ── Texture ── */
  sTexture.className='s-texture';
  if(theme==='luxury') sTexture.classList.add('tex-grain');
  else if(theme==='workspace') sTexture.classList.add('tex-lines');
  else if(theme==='minimal') sTexture.classList.add('tex-dots');

  /* ─── RENDER EACH LAYOUT ─── */
  switch(layout){

    /* ── FULL_BLEED: image fills bg, text overlay bottom/center ── */
    case 'FULL_BLEED':
    default:{
      var sContent=document.getElementById('sContent');
      showLayout('sContent');
      sContent.className='s-content '+(slide.type==='hook'||slide.type==='quote'?'layout-center':'layout-bottom');
      sContent.innerHTML=buildFullBleedHTML(slide,tc,accent2);
      break;
    }

    /* ── SPLIT_LEFT: image right 50%, text left 50% on solid bg ── */
    case 'SPLIT_LEFT':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      showLayout('sSplit');
      var sSplit=document.getElementById('sSplit');
      sSplit.className='s-split-wrap';
      sSplit.style.gridTemplateColumns='1fr 1fr';
      var si=document.getElementById('sSplitImg');
      var st=document.getElementById('sSplitText');
      if(primaryUrl){si.style.backgroundImage='url('+primaryUrl+')';si.style.backgroundSize='cover';si.style.backgroundPosition='center';}
      else{si.style.background=T.palette[1];}
      si.style.order='2';
      st.style.order='1';
      st.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:32px 28px;gap:10px;background:'+pBg+';color:'+pText;
      st.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      break;
    }

    /* ── SPLIT_RIGHT: image left 50%, text right 50% ── */
    case 'SPLIT_RIGHT':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      showLayout('sSplit');
      var sSplit2=document.getElementById('sSplit');
      sSplit2.className='s-split-wrap';
      sSplit2.style.gridTemplateColumns='1fr 1fr';
      var si2=document.getElementById('sSplitImg');
      var st2=document.getElementById('sSplitText');
      if(primaryUrl){si2.style.backgroundImage='url('+primaryUrl+')';si2.style.backgroundSize='cover';si2.style.backgroundPosition='center';}
      else{si2.style.background=T.palette[1];}
      si2.style.order='1';
      st2.style.order='2';
      st2.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:32px 28px;gap:10px;background:'+pBg+';color:'+pText;
      st2.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      break;
    }

    /* ── CORNER_FLOAT: image top-right corner ~38%, text bottom-left ── */
    case 'CORNER_FLOAT':{
      showLayout('sCorner');
      var sCorner=document.getElementById('sCorner');
      sCorner.className='s-corner-float';
      var cImg=document.getElementById('sCornerImg');
      var cText=document.getElementById('sCornerText');
      if(cImg&&primaryUrl) cImg.innerHTML='<img src="'+primaryUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>';
      if(cText){
        var ch='';
        if(slide.tag) ch+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:10px">'+esc(slide.tag)+'</div>';
        ch+='<div style="font-family:var(--fh);font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:'+tc.head+';text-shadow:0 2px 16px rgba(0,0,0,.5);margin-bottom:10px">'+esc(slide.headline)+'</div>';
        if(slide.body) ch+='<div style="font-size:13px;line-height:1.6;color:'+tc.body+';margin-bottom:10px">'+esc(slide.body)+'</div>';
        if(slide.hashtags&&slide.hashtags.length) ch+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+';opacity:.85">'+esc(t)+'</span>';}).join('')+'</div>';
        if(slide.cta) ch+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:var(--fh);background:'+accent2+';color:#fff;width:fit-content">'+esc(slide.cta)+' →</div>';
        cText.innerHTML=ch;
      }
      break;
    }

    /* ── DUAL_IMAGE: full-bleed faded bg + sharp thumbnail top-right + text ── */
    case 'DUAL_IMAGE':{
      showLayout('sDual');
      var sDual=document.getElementById('sDual');
      sDual.className='s-dual-wrap';
      var dMain=document.getElementById('sDualMain');
      var dThumb=document.getElementById('sDualThumb');
      var dText=document.getElementById('sDualText');
      if(dMain&&primaryUrl) dMain.style.backgroundImage='url('+primaryUrl+')';
      if(dThumb&&secondUrl) dThumb.innerHTML='<img src="'+secondUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>';
      if(dText){
        var dh='';
        if(slide.tag) dh+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:10px">'+esc(slide.tag)+'</div>';
        dh+='<div style="font-family:var(--fh);font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:#fff;text-shadow:0 2px 16px rgba(0,0,0,.6);margin-bottom:8px">'+esc(slide.headline)+'</div>';
        if(slide.body) dh+='<div style="font-size:13px;line-height:1.6;color:rgba(255,255,255,.85);margin-bottom:10px">'+esc(slide.body)+'</div>';
        if(slide.cta) dh+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:var(--fh);background:'+accent2+';color:#fff;width:fit-content">'+esc(slide.cta)+' →</div>';
        dText.innerHTML=dh;
      }
      break;
    }

    /* ── OVERLAP_BAND: full bg + bold colour band across middle ── */
    case 'OVERLAP_BAND':{
      showLayout('sBand');
      var sBandEl=document.getElementById('sBand');
      sBandEl.className='s-band-wrap';
      sBandEl.innerHTML='<div style="position:absolute;left:0;right:0;top:32%;padding:20px 32px 22px;background:'+accent2+';display:flex;flex-direction:column;gap:7px;">'
        +(slide.tag?'<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.65)">'+esc(slide.tag)+'</div>':'')
        +'<div style="font-family:var(--fh);font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.15;color:#fff">'+esc(slide.headline)+'</div>'
        +(slide.body?'<div style="font-size:12px;line-height:1.5;color:rgba(255,255,255,.85);margin-top:2px">'+esc(slide.body)+'</div>':'')
        +(slide.hashtags&&slide.hashtags.length?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:rgba(255,255,255,.65)">'+esc(t)+'</span>';}).join('')+'</div>':'')
        +'</div>';
      break;
    }

    /* ── BOTTOM_STRIP: image top 60%, text panel bottom 40% ── */
    case 'BOTTOM_STRIP':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      var bsEl=document.getElementById('sBottomStrip');
      if(!bsEl){
        // Create dynamically if not in HTML
        bsEl=document.createElement('div');
        bsEl.id='sBottomStrip';
        document.getElementById('slideCanvas').appendChild(bsEl);
      }
      showLayout('sBottomStrip');
      bsEl.innerHTML='';
      bsEl.style.cssText='position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;';
      var imgDiv=document.createElement('div');
      imgDiv.style.cssText='flex:0 0 58%;background-size:cover;background-position:center;'+(primaryUrl?'background-image:url('+primaryUrl+')':'background:'+T.palette[1]);
      var textDiv=document.createElement('div');
      textDiv.style.cssText='flex:1;background:'+pBg+';padding:20px 28px;display:flex;flex-direction:column;justify-content:center;gap:8px;color:'+pText;
      textDiv.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      bsEl.appendChild(imgDiv);
      bsEl.appendChild(textDiv);
      break;
    }

    /* ── TOP_STRIP: text top 40%, image bottom 60% ── */
    case 'TOP_STRIP':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      var tsEl=document.getElementById('sTopStrip');
      if(!tsEl){
        tsEl=document.createElement('div');
        tsEl.id='sTopStrip';
        document.getElementById('slideCanvas').appendChild(tsEl);
      }
      showLayout('sTopStrip');
      tsEl.innerHTML='';
      tsEl.style.cssText='position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;';
      var textDivT=document.createElement('div');
      textDivT.style.cssText='flex:0 0 42%;background:'+pBg+';padding:22px 28px;display:flex;flex-direction:column;justify-content:center;gap:8px;color:'+pText;
      textDivT.innerHTML=buildSplitTextHTML(slide,accent2,pText,pBg);
      var imgDivT=document.createElement('div');
      imgDivT.style.cssText='flex:1;background-size:cover;background-position:center;'+(primaryUrl?'background-image:url('+primaryUrl+')':'background:'+T.palette[1]);
      tsEl.appendChild(textDivT);
      tsEl.appendChild(imgDivT);
      break;
    }

    /* ── MAGAZINE_SPLIT: editorial — image right 55%, ruled text left 45% ── */
    case 'MAGAZINE_SPLIT':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      showLayout('sSplit');
      var msSplit=document.getElementById('sSplit');
      msSplit.className='s-split-wrap';
      msSplit.style.gridTemplateColumns='45% 55%';
      var msImg=document.getElementById('sSplitImg');
      var msText=document.getElementById('sSplitText');
      if(primaryUrl){msImg.style.backgroundImage='url('+primaryUrl+')';msImg.style.backgroundSize='cover';msImg.style.backgroundPosition='center';}
      else{msImg.style.background=T.palette[1];}
      msImg.style.order='2';
      msText.style.order='1';
      msText.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:28px 22px;gap:8px;background:'+pBg+';color:'+pText+';border-right:3px solid '+accent2;
      var mgh='';
      if(slide.tag) mgh+='<div style="font-size:8px;font-weight:700;font-family:var(--fm);letter-spacing:3px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
      mgh+='<div style="font-family:var(--fh);font-size:'+Math.min(22,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+';margin-bottom:6px">'+esc(slide.headline)+'</div>';
      if(slide.body) mgh+='<div style="font-size:11px;line-height:1.65;color:'+pText+';opacity:.75;margin-bottom:8px">'+esc(slide.body)+'</div>';
      if(slide.hashtags&&slide.hashtags.length) mgh+='<div style="display:flex;flex-wrap:wrap;gap:3px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+'">'+esc(t)+'</span>';}).join('')+'</div>';
      msText.innerHTML=mgh;
      break;
    }

    /* ── STAT_HERO: giant stat center, flat colour bg, optional strip image ── */
    case 'STAT_HERO':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      showLayout('sStat');
      var sStat=document.getElementById('sStat');
      sStat.className='s-stat-wrap';
      sStat.style.background=T.palette[0];
      var statStrip=document.getElementById('sStatStrip');
      if(statStrip&&primaryUrl){statStrip.style.backgroundImage='url('+primaryUrl+')';statStrip.style.display='block';}
      var sColor=(['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var sh='';
      if(slide.tag) sh+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:8px">'+esc(slide.tag)+'</div>';
      sh+='<div class="s-stat-num" style="color:'+accent2+'">'+esc(slide.stat||'1×')+'</div>';
      sh+='<div style="font-family:var(--fh);font-size:'+Math.min(24,headlineSize(slide.headline))+'px;font-weight:700;line-height:1.2;color:'+sColor+';margin-top:6px">'+esc(slide.headline)+'</div>';
      if(slide.body) sh+='<div style="font-size:12px;line-height:1.55;opacity:.72;margin-top:8px;color:'+sColor+'">'+esc(slide.body)+'</div>';
      if(slide.hashtags&&slide.hashtags.length) sh+='<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:10px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+';opacity:.8">'+esc(t)+'</span>';}).join('')+'</div>';
      sStat.insertAdjacentHTML('beforeend',sh);
      break;
    }

    /* ── QUOTE_PULL: large decorative quote, centred, flat bg ── */
    case 'QUOTE_PULL':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      showLayout('sQuote');
      var sQuote=document.getElementById('sQuote');
      sQuote.className='s-quote-wrap';
      sQuote.style.background=T.palette[0];
      var qColor=(['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var qText=slide.quote||slide.headline||'';
      var qh='<div class="s-quote-marks" style="color:'+accent2+'">"</div>';
      qh+='<div class="s-quote-text" style="color:'+qColor+';font-size:'+Math.min(22,headlineSize(qText))+'px">'+esc(qText)+'</div>';
      if(slide.tag) qh+='<div class="s-quote-attr" style="color:'+accent2+'">'+esc(slide.tag)+'</div>';
      if(slide.body&&!slide.quote) qh+='<div style="font-size:12px;color:'+qColor+';opacity:.65;margin-top:6px">'+esc(slide.body)+'</div>';
      if(slide.hashtags&&slide.hashtags.length) qh+='<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-top:12px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+';opacity:.8">'+esc(t)+'</span>';}).join('')+'</div>';
      sQuote.innerHTML=qh;
      break;
    }

    /* ── GRID_POINTS: 2×2 icon grid, flat colour ── */
    case 'GRID_POINTS':{
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
      showLayout('sGrid');
      var sGrid=document.getElementById('sGrid');
      sGrid.className='s-grid-wrap';
      sGrid.style.background=T.palette[0];
      var gColor=(['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var pts=slide.gridPoints||slide.points&&slide.points.map(function(p,pi){
        var glyphs=['→','★','◆','✦','●','▲'];
        return {glyph:glyphs[pi%glyphs.length],text:p};
      })||[{glyph:'→',text:'First point'},{glyph:'★',text:'Second point'},{glyph:'◆',text:'Third point'},{glyph:'✦',text:'Fourth point'}];
      var gh='';
      if(slide.tag) gh+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
      gh+='<div class="s-grid-header" style="color:'+gColor+'">'+esc(slide.headline)+'</div>';
      if(slide.body) gh+='<div style="font-size:11px;color:'+gColor+';opacity:.65;margin-top:-6px;margin-bottom:4px">'+esc(slide.body)+'</div>';
      gh+='<div class="s-grid-points">';
      pts.forEach(function(p){
        gh+='<div class="s-grid-point" style="background:rgba(128,128,128,.1)">';
        gh+='<div class="s-grid-glyph" style="color:'+accent2+'">'+esc(p.glyph||'→')+'</div>';
        gh+='<div class="s-grid-ptxt" style="color:'+gColor+'">'+esc(p.text||p)+'</div>';
        gh+='</div>';
      });
      gh+='</div>';
      if(slide.hashtags&&slide.hashtags.length) gh+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+';opacity:.8">'+esc(t)+'</span>';}).join('')+'</div>';
      sGrid.innerHTML=gh;
      break;
    }

  } /* end switch */

  /* ── Always-on chrome ── */
  document.getElementById('sNum').textContent=(ST.cur+1)+' / '+ST.slides.length;
  var brandEl=document.getElementById('sBrand');
  brandEl.textContent=ST.brand;
  brandEl.style.color=tc.head;

  var badge=document.getElementById('layoutBadge');
  if(badge) badge.textContent=layout.replace(/_/g,' ');

  /* ── Hashtag chips in right panel ── */
  var chips=document.getElementById('hashtagChips');
  var hashSec=document.getElementById('hashtagSection');
  if(chips&&slide.hashtags&&slide.hashtags.length){
    chips.innerHTML=slide.hashtags.map(function(t){return '<span class="hashtag-chip">'+esc(t)+'</span>';}).join('');
    if(hashSec) hashSec.style.display='flex';
  } else {
    if(hashSec) hashSec.style.display='none';
  }

  updateThumbActive();
}

/* ── Build HTML for full-bleed content layer ── */
function buildFullBleedHTML(slide,tc,accent2){
  var fc='';
  if(slide.tag) fc+='<div class="s-tag" style="background:'+tc.tagBg+';color:'+tc.tagColor+';border:1px solid rgba(255,255,255,.12)">'+esc(slide.tag)+'</div>';
  fc+='<div class="s-headline" style="font-size:'+headlineSize(slide.headline)+'px;color:'+tc.head+'">'+esc(slide.headline)+'</div>';
  if(slide.body) fc+='<div class="s-body" style="color:'+tc.body+'">'+esc(slide.body)+'</div>';
  if(slide.hashtags&&slide.hashtags.length) fc+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px">'+slide.hashtags.slice(0,5).map(function(t){return '<span style="font-size:10px;font-family:var(--fm);color:rgba(255,255,255,.55)">'+esc(t)+'</span>';}).join('')+'</div>';
  if(slide.cta) fc+='<div class="s-cta" style="background:'+accent2+';color:#fff">'+esc(slide.cta)+' <span>→</span></div>';
  var n=String(ST.cur+1).padStart(2,'0');
  fc+='<div class="s-giant-num" style="color:'+(tc.head==='#ffffff'?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)')+'">'+n+'</div>';
  return fc;
}

/* ── Build HTML for split/strip text panels ── */
function buildSplitTextHTML(slide,accent2,pText,pBg){
  var h='';
  if(slide.tag) h+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+esc(slide.tag)+'</div>';
  h+='<div style="font-family:var(--fh);font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+';margin-bottom:6px">'+esc(slide.headline)+'</div>';
  if(slide.body) h+='<div style="font-size:12px;line-height:1.65;color:'+pText+';opacity:.75;margin-bottom:8px">'+esc(slide.body)+'</div>';
  if(slide.hashtags&&slide.hashtags.length) h+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+';opacity:.85">'+esc(t)+'</span>';}).join('')+'</div>';
  if(slide.cta) h+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:var(--fh);background:'+accent2+';color:'+pBg+';width:fit-content">'+esc(slide.cta)+' →</div>';
  return h;
}

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ─────────────────────────────────────────────────────────
   10. STRIP BUILDER
   ───────────────────────────────────────────────────────── */
function buildStrip(){
  var strip=document.getElementById('strip');
  strip.innerHTML=ST.slides.map(function(s,i){
    var theme=ST.theme||'lifestyle';
    var T=DA[theme];
    var imgUrl=ST.userImages[i]||
      (s.primaryImage?s.primaryImage.url.replace('w=1080&h=1080','w=120&h=120'):null);
    if(!imgUrl){var a=pickAsset(theme,s.type,i,ST.assetOffset);if(a) imgUrl=a.url.replace('w=1080&h=1080','w=120&h=120');}
    var col=T.palette[0];
    var html='<div class="sthumb '+(i===ST.cur?'active':'')+'" onclick="goTo('+i+')" title="Slide '+(i+1)+'">';
    if(imgUrl) html+='<img class="sthumb-img" src="'+imgUrl+'" alt="" loading="lazy"/>';
    else html+='<div style="width:100%;height:100%;background:'+col+'"></div>';
    html+='<div class="sthumb-num" style="color:#fff;text-shadow:0 1px 5px rgba(0,0,0,.7);font-size:11px">'+(i+1)+'</div>';
    html+='</div>';
    return html;
  }).join('');
}

function updateThumbActive(){
  document.querySelectorAll('.sthumb').forEach(function(el,i){el.classList.toggle('active',i===ST.cur);});
}

/* ─────────────────────────────────────────────────────────
   11. NAVIGATION
   ───────────────────────────────────────────────────────── */
function goTo(idx){ST.cur=idx;renderSlide();updateCounter();fillEdit();}
function prevSlide(){if(ST.cur>0) goTo(ST.cur-1);}
function nextSlide(){if(ST.cur<ST.slides.length-1) goTo(ST.cur+1);}
function updateCounter(){document.getElementById('slideCtr').textContent=ST.slides.length?(ST.cur+1)+' / '+ST.slides.length:'0 / 0';}
function chgCount(d){ST.count=Math.max(3,Math.min(12,ST.count+d));document.getElementById('cntVal').textContent=ST.count;}
function prefill(t){document.getElementById('topicInput').value=t;onTopicInput();}
function zoom(d){ST.zoom=Math.max(40,Math.min(150,ST.zoom+d));document.getElementById('zoomLbl').textContent=ST.zoom+'%';document.getElementById('slideCanvas').style.transform='scale('+ST.zoom/100+')';}
function setFmt(f){ST.format=f;['square','portrait','landscape'].forEach(function(x){document.getElementById('fmt'+x.charAt(0).toUpperCase()+x.slice(1)).classList.toggle('on',x===f);});var c=document.getElementById('slideCanvas');c.className='slide-canvas'+(f!=='square'?' '+f:'');}
function shuffleAssets(){ST.assetOffset=(ST.assetOffset+1)%8;buildStrip();renderSlide();toast('🔀 New assets selected');}

/* ─────────────────────────────────────────────────────────
   12. EDIT PANEL — full inline editing, live re-render
   ───────────────────────────────────────────────────────── */
function fillEdit(){
  if(!ST.slides.length) return;
  var s=ST.slides[ST.cur];
  document.getElementById('eHead').value=s.headline||'';
  document.getElementById('eBody').value=s.body||s.subline||'';
  document.getElementById('eCap').value=s.caption||'';
  document.getElementById('editNum').textContent='Slide '+(ST.cur+1);

  // Show layout picker
  var badge=document.getElementById('layoutBadge');
  if(badge) badge.textContent=(s.layout||'').replace(/_/g,' ');

  // Show stat / quote fields if relevant
  var statSec=document.getElementById('eStatSection');
  var quoteSec=document.getElementById('eQuoteSection');
  if(statSec) statSec.style.display=(s.layout==='STAT_HERO')?'flex':'none';
  if(quoteSec) quoteSec.style.display=(s.layout==='QUOTE_PULL')?'flex':'none';

  var statInput=document.getElementById('eStat');
  if(statInput) statInput.value=s.stat||'';
  var quoteInput=document.getElementById('eQuote');
  if(quoteInput) quoteInput.value=s.quote||'';
}

function liveEdit(){
  if(!ST.slides.length) return;
  ST.slides[ST.cur].headline=document.getElementById('eHead').value;
  ST.slides[ST.cur].body=document.getElementById('eBody').value;
  renderSlide();
  // Also update strip thumb title
  var thumb=document.querySelectorAll('.sthumb')[ST.cur];
  if(thumb) thumb.title='Slide '+(ST.cur+1)+': '+ST.slides[ST.cur].headline.slice(0,30);
}

function liveEditStat(){
  if(!ST.slides.length) return;
  var statInput=document.getElementById('eStat');
  if(statInput) ST.slides[ST.cur].stat=statInput.value;
  renderSlide();
}

function liveEditQuote(){
  if(!ST.slides.length) return;
  var quoteInput=document.getElementById('eQuote');
  if(quoteInput) ST.slides[ST.cur].quote=quoteInput.value;
  renderSlide();
}

function updateCap(){if(!ST.slides.length) return;ST.slides[ST.cur].caption=document.getElementById('eCap').value;}
function updateBrand(){ST.brand=document.getElementById('brandInput').value;if(ST.slides.length) renderSlide();}

/* Layout switcher — lets user manually change slide layout */
function changeLayout(newLayout){
  if(!ST.slides.length) return;
  ST.slides[ST.cur].layout=newLayout;
  renderSlide();
  fillEdit();
  toast('Layout → '+newLayout.replace(/_/g,' '));
}

/* ─────────────────────────────────────────────────────────
   13. IMAGE UPLOAD
   ───────────────────────────────────────────────────────── */
function handleUpload(e){var f=e.target.files[0];if(!f) return;var r=new FileReader();r.onload=function(ev){ST.userImages[ST.cur]=ev.target.result;renderSlide();buildStrip();toast('🖼️ Image added to slide '+(ST.cur+1));};r.readAsDataURL(f);}
function dzOver(e){e.preventDefault();document.getElementById('dzone').classList.add('over');}
function dzLeave(){document.getElementById('dzone').classList.remove('over');}
function dzDrop(e){e.preventDefault();document.getElementById('dzone').classList.remove('over');var f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/')) return;var r=new FileReader();r.onload=function(ev){ST.userImages[ST.cur]=ev.target.result;renderSlide();buildStrip();toast('🖼️ Image dropped on slide '+(ST.cur+1));};r.readAsDataURL(f);}

/* ─────────────────────────────────────────────────────────
   14. ACCENT / THEME / BRAND
   ───────────────────────────────────────────────────────── */
function setAccent(c,el){ST.accent=c;document.querySelectorAll('.cdot').forEach(function(d){d.classList.remove('on');});el.classList.add('on');if(ST.slides.length) renderSlide();}
function toggleTheme(){var isDark=document.documentElement.getAttribute('data-theme')==='dark';document.documentElement.setAttribute('data-theme',isDark?'light':'dark');document.querySelector('[onclick="toggleTheme()"]').textContent=isDark?'🌙':'☀️';}

/* ─────────────────────────────────────────────────────────
   15. COPY & EXPORT — cross-device download
       Desktop/Android: blob → <a download>
       Safari iOS: navigator.share({files}) with fallback
   ───────────────────────────────────────────────────────── */
function isSafariIOS(){
  var ua=navigator.userAgent;
  var isiOS=/iPad|iPhone|iPod/.test(ua)&&!window.MSStream;
  var isSafari=/AppleWebKit/.test(ua)&&!/CriOS/.test(ua)&&!/FxiOS/.test(ua)&&!/EdgiOS/.test(ua);
  return isiOS&&isSafari;
}

function copyCaption(){
  var c=document.getElementById('eCap').value;
  if(!c){toast('No caption on this slide');return;}
  navigator.clipboard.writeText(c).then(function(){toast('✓ Caption copied');});
}

function copyAll(){
  if(!ST.slides.length){toast('Generate a carousel first');return;}
  var all=ST.slides.map(function(s,i){
    var tags=(s.hashtags&&s.hashtags.length)?'\n\n'+s.hashtags.join(' '):'';
    return '── SLIDE '+(i+1)+' ──\nHeadline: '+(s.headline||'')+'\nBody: '+(s.body||'')+'\n\nCaption:\n'+(s.caption||'')+tags;
  }).join('\n\n');
  navigator.clipboard.writeText(all).then(function(){toast('✓ All copy + captions copied to clipboard');});
}

function openExport(){document.getElementById('exportModal').classList.add('show');}
function closeExport(){document.getElementById('exportModal').classList.remove('show');}
function selExport(t){ST.exportType=t;['png','copy','json','video'].forEach(function(x){var el=document.getElementById('eo'+x.charAt(0).toUpperCase()+x.slice(1));if(el)el.classList.toggle('sel',x===t);});}

function doExport(){
  closeExport();
  if(ST.exportType==='copy'){
    copyAll();
  } else if(ST.exportType==='json'){
    var j=JSON.stringify({
      slides:ST.slides.map(function(s){return {headline:s.headline,body:s.body,caption:s.caption,hashtags:s.hashtags,layout:s.layout,type:s.type};}),
      theme:ST.theme,
      accentColor:ST.accent,
      platform:document.getElementById('platSelect').value,
      generatedAt:new Date().toISOString()
    },null,2);
    var b=new Blob([j],{type:'application/json'});
    triggerBlobDownload(b,'carousel-data.json');
    toast('✓ JSON exported');
  } else if(ST.exportType==='png'){
    exportSlidesAsPNG();
  } else if(ST.exportType==='video'){
    toast('📹 Video export: screenshot each animated slide. Full MP4 export coming soon.');
  }
}

/* Export current slide as PNG using html2canvas if available, else screenshot tip */
function exportSlidesAsPNG(){
  if(typeof html2canvas==='undefined'){
    toast('💡 Screenshot each slide using your device screenshot, or use the JSON export for editing.');
    return;
  }
  var canvas=document.getElementById('slideCanvas');
  toast('📸 Capturing slide '+(ST.cur+1)+'…');
  html2canvas(canvas,{useCORS:true,scale:2}).then(function(c){
    c.toBlob(function(blob){
      triggerBlobDownload(blob,'ImpactGrid-slide-'+(ST.cur+1)+'.png');
      toast('✓ Slide '+(ST.cur+1)+' saved as PNG');
    },'image/png');
  }).catch(function(){
    toast('💡 Screenshot this slide — PNG capture needs HTTPS & CORS images');
  });
}

/* Cross-device blob download */
function triggerBlobDownload(blob,filename){
  try{
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=filename;
    a.style.cssText='position:fixed;top:-100px;left:-100px;opacity:0;pointer-events:none;';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},2500);
  }catch(e){
    console.error('Download failed:',e);
    toast('⚠️ Download failed — try the Copy or JSON option');
  }
}

/* iOS Share for downloading images */
async function shareSlideOnIOS(url,filename){
  try{
    var res=await fetch(url,{mode:'cors',cache:'no-store'});
    if(!res.ok) throw new Error('fetch failed');
    var blob=await res.blob();
    var file=new File([blob],filename||'ImpactGrid-slide.jpg',{type:blob.type||'image/jpeg'});
    if(navigator.share&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:'ImpactGrid Slide',text:'Download your carousel slide'});
    } else {
      triggerBlobDownload(blob,filename);
    }
  }catch(e){
    toast('💡 Long-press the slide image and tap Save to Photos');
  }
}

/* ─────────────────────────────────────────────────────────
   16. TOAST
   ───────────────────────────────────────────────────────── */
function toast(msg){
  var shelf=document.getElementById('toastShelf');
  var el=document.createElement('div');el.className='toast';el.textContent=msg;
  shelf.appendChild(el);
  setTimeout(function(){el.remove();},3400);
}

/* ─────────────────────────────────────────────────────────
   17. KEYBOARD
   ───────────────────────────────────────────────────────── */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown') nextSlide();
  if(e.key==='ArrowLeft'||e.key==='ArrowUp') prevSlide();
  if(e.key==='Escape') closeExport();
});

/* ─────────────────────────────────────────────────────────
   18. INIT
   ───────────────────────────────────────────────────────── */
(function(){
  updateCounter();
  // Keep server warm
  setInterval(function(){fetch(DIJO_SERVER+'/ping').catch(function(){});},600000);
})();
