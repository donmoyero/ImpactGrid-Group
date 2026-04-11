/* ═══════════════════════════════════════════════════════════
   IMPACTGRID — Carousel Studio
   carousel-studio.js

   Sections:
   1.  Asset library (DA)
   2.  Theme detection
   3.  Asset picking & overlay helpers
   4.  Layout assignment
   5.  State
   6.  Topic input → intel detection
   7.  AI generation (callAI → server, fallback)
   8.  Slide parsing
   9.  Render engine (all 10 layouts)
   10. Strip builder
   11. Navigation
   12. Edit panel
   13. Image upload
   14. Accent / brand / theme
   15. Copy & Export
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
  var chosen=scored[idx].a;
  return {url:chosen.url,id:chosen.id,tone:chosen.tone,brightness:chosen.brightness,layout_hints:chosen.layout_hints};
}

/* Pick a secondary asset (different from primary) */
function pickSecondAsset(theme, excludeId, slideIndex){
  var T=DA[theme]; if(!T) return null;
  var pool=T.assets.filter(function(a){ return a.id!==excludeId && a.layout_hints.indexOf('thumbnail')!==-1; });
  if(!pool.length) pool=T.assets.filter(function(a){ return a.id!==excludeId; });
  if(!pool.length) return null;
  return pool[slideIndex%pool.length];
}

function getOverlay(tone,brightness,layout){
  if(layout==='SPLIT_LEFT'||layout==='SPLIT_RIGHT'||layout==='split-left'||layout==='split-right') return 'none';
  if(brightness==='low') return 'linear-gradient(to top,rgba(0,0,0,.9) 0%,rgba(0,0,0,.45) 50%,rgba(0,0,0,.1) 100%)';
  if(tone==='neutral'&&brightness==='high') return 'linear-gradient(to top,rgba(0,0,0,.82) 0%,rgba(0,0,0,.2) 55%,transparent 100%)';
  if(tone==='warm') return 'linear-gradient(to top,rgba(12,7,3,.88) 0%,rgba(12,7,3,.35) 55%,rgba(12,7,3,.05) 100%)';
  if(tone==='cool') return 'linear-gradient(to top,rgba(8,12,22,.9) 0%,rgba(8,12,22,.35) 55%,transparent 100%)';
  return 'linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.3) 55%,transparent 100%)';
}

function textColors(tone,brightness,themeKey){
  if(themeKey==='minimal'&&brightness==='high') return {head:'#1a1814',body:'rgba(26,24,20,.75)',tagBg:'rgba(26,24,20,.1)',tagColor:'#1a1814'};
  if(themeKey==='cozy-home'&&brightness==='high') return {head:'#2c1810',body:'rgba(44,24,16,.75)',tagBg:'rgba(44,24,16,.15)',tagColor:'#2c1810'};
  return {head:'#ffffff',body:'rgba(255,255,255,.85)',tagBg:'rgba(0,0,0,.45)',tagColor:'#ffffff'};
}

/* ─────────────────────────────────────────────────────────
   4. LAYOUT ASSIGNMENT (fallback when AI doesn't specify)
   ───────────────────────────────────────────────────────── */
function assignLayout(slideType,idx,total){
  var sets={
    hook:['FULL_BLEED','CORNER_FLOAT'],
    cta:['FULL_BLEED','SPLIT_RIGHT'],
    stat:['STAT_HERO','SPLIT_RIGHT','SPLIT_LEFT'],
    value:['SPLIT_LEFT','FULL_BLEED','CORNER_FLOAT','SPLIT_RIGHT','OVERLAP_BAND'],
    insight:['OVERLAP_BAND','SPLIT_RIGHT','EDITORIAL_NUM','FULL_BLEED'],
    lesson:['SPLIT_LEFT','EDITORIAL_NUM','FULL_BLEED'],
    proof:['SPLIT_RIGHT','DUAL_IMAGE'],
    quote:['QUOTE_PULL','FULL_BLEED'],
    story:['FULL_BLEED','CORNER_FLOAT'],
    problem:['FULL_BLEED','OVERLAP_BAND'],
    list:['GRID_POINTS','SPLIT_LEFT']
  };
  var set=sets[slideType]||['FULL_BLEED','SPLIT_RIGHT','SPLIT_LEFT','OVERLAP_BAND','CORNER_FLOAT'];
  var layout=set[idx%set.length];
  if((layout==='SPLIT_RIGHT'||layout==='SPLIT_LEFT')&&(idx===0||idx===total-1)) layout='FULL_BLEED';
  return layout;
}

function headlineSize(text){
  var l=(text||'').length;
  if(l<28) return 36; if(l<45) return 30; if(l<60) return 26; return 22;
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
  var theme=detectTheme(topic);
  ST.theme=theme;
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
var DIJO_SERVER = 'https://impactgrid-dijo.onrender.com';

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
  var hints=['Detecting theme from your topic…','Scoring images with AI vision…','Writing SEO copy & hashtags…','Designing each layout…','Polishing your carousel…'];
  var hi=0,hTimer=setInterval(function(){hi=(hi+1)%hints.length;document.getElementById('loadingHint').textContent=hints[hi];},1600);
  try{
    var data=await callAI(topic,platform,tone,count);
    ST.slides=parseServerSlides(data,topic,platform,tone,count);
    // Update theme from server response if provided
    if(data.theme && DA[data.theme]) ST.theme=data.theme;
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
  toast('✦ '+ST.slides.length+'-slide carousel · '+DA[ST.theme].label+' theme · '+DA[ST.theme].mood);
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

/* Parse rich response from /carousel/generate (carousel-engine.js format) */
function parseServerSlides(data, topic, platform, tone, count){
  try{
    if(!data.slides||!Array.isArray(data.slides)) throw new Error('no slides');
    return data.slides.map(function(sl,i){
      return {
        type:       sl.type||(i===0?'hook':i===data.slides.length-1?'cta':'value'),
        layout:     sl.layout||assignLayout(sl.type||'value',i,data.slides.length),
        tag:        sl.tag||'',
        headline:   sl.headline||'Slide '+(i+1),
        body:       sl.body||'',
        stat:       sl.stat||null,
        quote:      sl.quote||null,
        gridPoints: sl.gridPoints||null,
        cta:        sl.cta||'',
        caption:    buildCaption(sl,i),
        hashtags:   sl.hashtags||[],
        // Image data from vision-scored server response
        primaryImage: sl.primaryImage||null,
        secondImage:  sl.secondImage||null,
        video:        sl.video||null,
        useVideo:     sl.useVideo||false
      };
    });
  }catch(e){
    return fallbackSlides(topic,platform,tone,count);
  }
}

/* Build a clean caption from slide data */
function buildCaption(sl, idx){
  if(sl.caption) return sl.caption;
  if(idx!==0) return ''; // only slide 1 gets full caption
  var tags=(sl.hashtags||[]).join(' ');
  return (sl.headline||'')+'\n\n'+(sl.body||'')+'\n\n'+tags;
}

function fallbackSlides(topic,platform,tone,count){
  var h=['Nobody talks about this — but it changed everything.','I spent years doing it wrong. Here\'s the truth.','Most people skip this. That\'s why they fail.','This one shift made everything click.'];
  var hook=h[Math.floor(Math.random()*h.length)];
  var tags=['01','02','03','04','05','06','07','08','09','10'];
  var vals=[
    {type:'value',headline:'The problem nobody admits',body:'Most people focus on the wrong thing entirely. Here\'s what actually moves the needle.',layout:'SPLIT_LEFT'},
    {type:'insight',headline:'The shift that changes everything',body:'Once you understand this, you can\'t unsee it.',layout:'OVERLAP_BAND'},
    {type:'stat',headline:'The numbers don\'t lie',body:'Creators who do this consistently outperform those who don\'t.',layout:'STAT_HERO',stat:'87%'},
    {type:'quote',headline:'',body:'',quote:'The secret was never the strategy. It was the consistency.',layout:'QUOTE_PULL'},
    {type:'lesson',headline:'What I wish I\'d known sooner',body:'Three years in, I finally understood this.',layout:'EDITORIAL_NUM'},
    {type:'proof',headline:'Here\'s what happened next',body:'The results weren\'t overnight. But they were real.',layout:'DUAL_IMAGE'},
    {type:'list',headline:'Four things to do today',body:'',layout:'GRID_POINTS',gridPoints:[{glyph:'→',text:'Start before ready'},{glyph:'★',text:'Ship consistently'},{glyph:'◆',text:'Study what works'},{glyph:'✦',text:'Double down'}]},
    {type:'value',headline:'The counterintuitive truth',body:'Everything you\'ve been told is backwards.',layout:'CORNER_FLOAT'},
    {type:'insight',headline:'Nobody will tell you this',body:'It\'s not about working harder. Right order matters.',layout:'SPLIT_RIGHT'},
    {type:'value',headline:'Start here, not there',body:'This single action creates the most momentum.',layout:'FULL_BLEED'}
  ];
  var slides=[{type:'hook',tag:'READ THIS',headline:hook,body:'Swipe through — breaking it all down. →',cta:'',layout:'FULL_BLEED',caption:hook+'\n\nSave this — you\'ll want to come back to it.\n\n#contentcreator #growthmindset #creatoreconomy #digitalmarketing #socialmediatips',hashtags:['#contentcreator','#growthmindset','#creatoreconomy','#digitalmarketing','#socialmediatips']}];
  for(var i=1;i<count-1;i++){
    var v=vals[(i-1)%vals.length];
    slides.push({type:v.type,tag:tags[i-1],headline:v.headline,body:v.body,cta:'',layout:v.layout,stat:v.stat||null,quote:v.quote||null,gridPoints:v.gridPoints||null,caption:'',hashtags:[]});
  }
  slides.push({type:'cta',tag:'ACTION',headline:'Ready to make this real?',body:'Follow for more strategies. Save this post.',cta:'Follow for more →',layout:'SPLIT_RIGHT',caption:'Which slide hit hardest? Drop a number below 👇\n\n#contentcreator #growthmindset #creatoreconomy',hashtags:['#contentcreator','#growthmindset','#creatoreconomy']});
  return slides.slice(0,count);
}

/* ─────────────────────────────────────────────────────────
   9. RENDER ENGINE — all 10 layouts
   ───────────────────────────────────────────────────────── */
function renderSlide(){
  if(!ST.slides.length) return;
  var slide=ST.slides[ST.cur];
  var theme=ST.theme||'lifestyle';
  var T=DA[theme];
  var layout=slide.layout||assignLayout(slide.type,ST.cur,ST.slides.length);

  /* Resolve image URLs — prefer server vision-picked, fall back to local pick */
  var primaryUrl=ST.userImages[ST.cur]||(slide.primaryImage?slide.primaryImage.url:null)||(function(){var a=pickAsset(theme,slide.type,ST.cur,ST.assetOffset);return a?a.url:null;})();
  var secondUrl=(slide.secondImage?slide.secondImage.url:null)||(function(){var a=primaryUrl?pickSecondAsset(theme,slide.primaryImage?slide.primaryImage.id:'',ST.cur):null;return a?a.url:null;})();
  var videoData=slide.video||null;

  /* Tone/brightness for overlay logic */
  var assetMeta=slide.primaryImage||pickAsset(theme,slide.type,ST.cur,ST.assetOffset)||{tone:'neutral',brightness:'medium'};
  var tone2=assetMeta.tone||'neutral';
  var bri=assetMeta.brightness||'medium';
  var tc=textColors(tone2,bri,theme);
  var accent2=T.accentColor||ST.accent;

  /* Clear ALL layout containers */
  var sBg=document.getElementById('sBg');
  var sBgImg=document.getElementById('sBgImg');
  var sVideo=document.getElementById('sBgVideo');
  var sOverlay=document.getElementById('sOverlay');
  var sTexture=document.getElementById('sTexture');
  var sContent=document.getElementById('sContent');
  var sSplit=document.getElementById('sSplit');
  var sCorner=document.getElementById('sCorner');
  var sDual=document.getElementById('sDual');
  var sBand=document.getElementById('sBand');
  var sEditorial=document.getElementById('sEditorial');
  var sQuote=document.getElementById('sQuote');
  var sStat=document.getElementById('sStat');
  var sGrid=document.getElementById('sGrid');

  [sContent,sSplit,sCorner,sDual,sBand,sEditorial,sQuote,sStat,sGrid].forEach(function(el){if(el){el.className=el.className.replace(/\bhidden\b/g,'').trim()+' hidden';el.innerHTML='';}});

  /* Background: video takes priority over image */
  if(videoData&&videoData.url&&(layout==='FULL_BLEED'||layout==='OVERLAP_BAND')){
    sBgImg.style.opacity='0';
    if(sVideo){
      sVideo.innerHTML='<video autoplay muted loop playsinline><source src="'+videoData.url+'" type="video/mp4"></video>';
      sVideo.style.display='block';
    }
    sBg.style.background='#111';
  } else {
    if(sVideo) sVideo.innerHTML='';
    if(primaryUrl){
      sBgImg.style.backgroundImage='url('+primaryUrl+')';
      sBgImg.style.opacity='1';
      sBg.style.background='#111';
    } else {
      sBgImg.style.opacity='0';
      sBg.style.background=T.palette[0];
    }
  }

  /* Overlay */
  sOverlay.style.background=getOverlay(tone2,bri,layout)==='none'?'none':getOverlay(tone2,bri,layout);

  /* Texture */
  sTexture.className='s-texture';
  if(theme==='luxury') sTexture.classList.add('tex-grain');
  else if(theme==='workspace') sTexture.classList.add('tex-lines');
  else if(theme==='minimal') sTexture.classList.add('tex-dots');

  /* ── Render the correct layout ── */
  switch(layout){

    case 'SPLIT_LEFT':
    case 'SPLIT_RIGHT': {
      sSplit.className='s-split-wrap';
      var isRight=(layout==='SPLIT_RIGHT');
      var splitImg=document.getElementById('sSplitImg');
      var splitText=document.getElementById('sSplitText');
      if(primaryUrl) splitImg.style.backgroundImage='url('+primaryUrl+')';
      splitImg.style.background=primaryUrl?'':T.palette[0];
      sSplit.style.gridTemplateColumns='1fr 1fr';
      splitImg.style.order=isRight?'2':'1';
      splitText.style.order=isRight?'1':'2';
      var pBg={workspace:'#0f172a',luxury:'#1a1209',minimal:'#f7f7f5','cozy-home':'#f5e6d3',lifestyle:'#1e3a5f'}[theme]||'#1a1814';
      var pText=(['minimal','cozy-home'].indexOf(theme)!==-1)?'#1a1814':'#f0ede8';
      splitText.style.cssText='display:flex;flex-direction:column;justify-content:center;padding:30px 26px;gap:10px;background:'+pBg+';color:'+pText;
      var h='';
      if(slide.tag) h+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2px;text-transform:uppercase;color:'+accent2+';margin-bottom:6px">'+slide.tag+'</div>';
      h+='<div style="font-family:var(--fh);font-size:'+Math.min(24,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.2;color:'+pText+'">'+slide.headline+'</div>';
      if(slide.body) h+='<div style="font-size:12px;line-height:1.6;color:'+pText+';opacity:.72;margin-top:4px">'+slide.body+'</div>';
      if(slide.hashtags&&slide.hashtags.length) h+='<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px">'+slide.hashtags.slice(0,4).map(function(t){return '<span style="font-size:9px;font-family:var(--fm);color:'+accent2+';opacity:.8">'+t+'</span>';}).join('')+'</div>';
      if(slide.cta) h+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:var(--fh);background:'+accent2+';color:'+pBg+';margin-top:12px;width:fit-content">'+slide.cta+' →</div>';
      splitText.innerHTML=h;
      break;
    }

    case 'CORNER_FLOAT': {
      sCorner.className='s-corner-float';
      var cornerImg=document.getElementById('sCornerImg');
      var cornerText=document.getElementById('sCornerText');
      if(cornerImg&&primaryUrl) cornerImg.innerHTML='<img src="'+primaryUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>';
      if(cornerText){
        var ch='';
        if(slide.tag) ch+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2px;text-transform:uppercase;color:'+accent2+';margin-bottom:10px">'+slide.tag+'</div>';
        ch+='<div style="font-family:var(--fh);font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:'+tc.head+';text-shadow:0 2px 16px rgba(0,0,0,.5)">'+slide.headline+'</div>';
        if(slide.body) ch+='<div style="font-size:13px;line-height:1.6;color:'+tc.body+';margin-top:10px">'+slide.body+'</div>';
        if(slide.cta) ch+='<div style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:11px;font-weight:700;font-family:var(--fh);background:'+accent2+';color:#fff;margin-top:16px;width:fit-content">'+slide.cta+' →</div>';
        cornerText.innerHTML=ch;
      }
      break;
    }

    case 'DUAL_IMAGE': {
      sDual.className='s-dual-wrap';
      var dMain=document.getElementById('sDualMain');
      var dThumb=document.getElementById('sDualThumb');
      var dText=document.getElementById('sDualText');
      if(dMain&&primaryUrl) dMain.style.backgroundImage='url('+primaryUrl+')';
      if(dThumb&&secondUrl) dThumb.innerHTML='<img src="'+secondUrl+'" alt="" style="width:100%;height:100%;object-fit:cover;display:block;"/>';
      if(dText){
        var dh='';
        if(slide.tag) dh+='<div class="s-tag" style="background:'+tc.tagBg+';color:'+tc.tagColor+'">'+slide.tag+'</div>';
        dh+='<div class="s-headline" style="font-size:'+headlineSize(slide.headline)+'px;color:'+tc.head+'">'+slide.headline+'</div>';
        if(slide.body) dh+='<div class="s-body" style="color:'+tc.body+'">'+slide.body+'</div>';
        dText.innerHTML=dh;
      }
      break;
    }

    case 'OVERLAP_BAND': {
      sBand.className='s-band-wrap';
      var band=document.getElementById('sBandInner');
      if(band){
        var bandPct=34;
        band.style.cssText='position:absolute;left:0;right:0;top:'+bandPct+'%;padding:18px 32px;background:'+accent2+';display:flex;flex-direction:column;gap:6px;';
        var bh='';
        if(slide.tag) bh+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,.65);margin-bottom:4px">'+slide.tag+'</div>';
        bh+='<div style="font-family:var(--fh);font-size:'+Math.min(26,headlineSize(slide.headline))+'px;font-weight:800;line-height:1.15;color:#fff">'+slide.headline+'</div>';
        if(slide.body) bh+='<div style="font-size:12px;line-height:1.5;color:rgba(255,255,255,.8);margin-top:2px">'+slide.body+'</div>';
        band.innerHTML=bh;
      }
      break;
    }

    case 'EDITORIAL_NUM': {
      sEditorial.className='s-editorial';
      sEditorial.style.background=T.palette[0];
      var bgNum=document.getElementById('sEditorialBgNum');
      if(bgNum) bgNum.textContent=String(ST.cur+1).padStart(2,'0');
      var eh='';
      if(slide.tag) eh+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:10px">'+slide.tag+'</div>';
      eh+='<div style="font-family:var(--fh);font-size:'+headlineSize(slide.headline)+'px;font-weight:800;line-height:1.15;color:'+T.textColors.primary+'">'+slide.headline+'</div>';
      if(slide.body) eh+='<div style="font-size:13px;line-height:1.6;color:'+T.textColors.primary+';opacity:.7;margin-top:8px">'+slide.body+'</div>';
      sEditorial.insertAdjacentHTML('beforeend',eh);
      break;
    }

    case 'QUOTE_PULL': {
      sQuote.className='s-quote-wrap';
      sQuote.style.background=T.palette[0];
      var qColor=(['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var qh='<div class="s-quote-marks" style="color:'+accent2+'">"</div>';
      qh+='<div class="s-quote-text" style="color:'+qColor+'">'+(slide.quote||slide.headline)+'</div>';
      if(slide.tag) qh+='<div class="s-quote-attr" style="color:'+accent2+'">'+slide.tag+'</div>';
      if(slide.body&&!slide.quote) qh+='<div style="font-size:12px;color:'+qColor+';opacity:.65;margin-top:4px">'+slide.body+'</div>';
      sQuote.innerHTML=qh;
      break;
    }

    case 'STAT_HERO': {
      sStat.className='s-stat-wrap';
      sStat.style.background=T.palette[0];
      var statStrip=document.getElementById('sStatStrip');
      if(statStrip&&primaryUrl){statStrip.style.backgroundImage='url('+primaryUrl+')';statStrip.style.display='block';}
      var sh2='';
      if(slide.tag) sh2+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:8px">'+slide.tag+'</div>';
      sh2+='<div class="s-stat-num" style="color:'+accent2+'">'+(slide.stat||'1×')+'</div>';
      sh2+='<div style="font-family:var(--fh);font-size:'+Math.min(24,headlineSize(slide.headline))+'px;font-weight:700;line-height:1.2;color:'+((['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8')+'">'+slide.headline+'</div>';
      if(slide.body) sh2+='<div style="font-size:12px;line-height:1.5;opacity:.7;margin-top:6px;color:'+((['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8')+'">'+slide.body+'</div>';
      sStat.insertAdjacentHTML('beforeend',sh2);
      break;
    }

    case 'GRID_POINTS': {
      sGrid.className='s-grid-wrap';
      sGrid.style.background=T.palette[0];
      var gColor=(['minimal','cozy-home'].indexOf(theme)!==-1)?T.textColors.primary:'#f0ede8';
      var gh='';
      if(slide.tag) gh+='<div style="font-size:9px;font-weight:700;font-family:var(--fm);letter-spacing:2.5px;text-transform:uppercase;color:'+accent2+';margin-bottom:4px">'+slide.tag+'</div>';
      gh+='<div class="s-grid-header" style="color:'+gColor+'">'+slide.headline+'</div>';
      var pts=slide.gridPoints||[{glyph:'→',text:'First point'},{glyph:'★',text:'Second point'},{glyph:'◆',text:'Third point'},{glyph:'✦',text:'Fourth point'}];
      gh+='<div class="s-grid-points">';
      pts.forEach(function(p){
        gh+='<div class="s-grid-point" style="background:rgba(128,128,128,.1)">';
        gh+='<div class="s-grid-glyph" style="color:'+accent2+'">'+p.glyph+'</div>';
        gh+='<div class="s-grid-ptxt" style="color:'+gColor+'">'+p.text+'</div>';
        gh+='</div>';
      });
      gh+='</div>';
      sGrid.innerHTML=gh;
      break;
    }

    /* FULL_BLEED (default) */
    default: {
      sContent.className='s-content layout-bottom';
      if(slide.type==='hook'||slide.type==='quote') sContent.className='s-content layout-center';
      var fc='';
      if(slide.tag) fc+='<div class="s-tag" style="background:'+tc.tagBg+';color:'+tc.tagColor+';border:1px solid rgba(255,255,255,.12)">'+slide.tag+'</div>';
      fc+='<div class="s-headline" style="font-size:'+headlineSize(slide.headline)+'px;color:'+tc.head+'">'+slide.headline+'</div>';
      if(slide.body) fc+='<div class="s-body" style="color:'+tc.body+'">'+slide.body+'</div>';
      if(slide.cta) fc+='<div class="s-cta" style="background:'+accent2+';color:#fff">'+slide.cta+' <span>→</span></div>';
      if(slide.hashtags&&slide.hashtags.length) fc+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px">'+slide.hashtags.slice(0,5).map(function(t){return '<span style="font-size:10px;font-family:var(--fm);color:rgba(255,255,255,.55)">'+t+'</span>';}).join('')+'</div>';
      /* Decorative background number */
      var n=String(ST.cur+1).padStart(2,'0');
      fc+='<div class="s-giant-num" style="color:'+(tc.head==='#ffffff'?'rgba(255,255,255,.07)':'rgba(0,0,0,.06)')+'">'+n+'</div>';
      sContent.innerHTML=fc;
      break;
    }
  }

  document.getElementById('sNum').textContent=(ST.cur+1)+' / '+ST.slides.length;
  document.getElementById('sBrand').textContent=ST.brand;
  document.getElementById('sBrand').style.color=tc.head;

  /* Update layout badge in edit panel */
  var badge=document.getElementById('layoutBadge');
  if(badge) badge.textContent=layout.replace(/_/g,' ');

  /* Update hashtag chips */
  var chips=document.getElementById('hashtagChips');
  if(chips&&slide.hashtags&&slide.hashtags.length){
    chips.innerHTML=slide.hashtags.map(function(t){return '<span class="hashtag-chip">'+t+'</span>';}).join('');
    chips.parentElement.style.display='block';
  } else if(chips) chips.parentElement.style.display='none';

  updateThumbActive();
}

/* ─────────────────────────────────────────────────────────
   10. STRIP BUILDER
   ───────────────────────────────────────────────────────── */
function buildStrip(){
  var strip=document.getElementById('strip');
  strip.innerHTML=ST.slides.map(function(s,i){
    var theme=ST.theme||'lifestyle';
    var T=DA[theme];
    var imgUrl=ST.userImages[i]||(s.primaryImage?s.primaryImage.url.replace('w=1080&h=1080','w=120&h=120'):null);
    if(!imgUrl){var a=pickAsset(theme,s.type,i,ST.assetOffset);if(a) imgUrl=a.url.replace('w=1080&h=1080','w=120&h=120');}
    var col=T.palette[0];
    var html='<div class="sthumb '+(i===ST.cur?'active':'')+'" onclick="goTo('+i+')" title="Slide '+(i+1)+'">';
    if(imgUrl) html+='<img class="sthumb-img" src="'+imgUrl+'" alt="" loading="lazy"/>';
    else html+='<div style="width:100%;height:100%;background:'+col+'"></div>';
    html+='<div class="sthumb-num" style="color:#fff;text-shadow:0 1px 5px rgba(0,0,0,.7)">'+(i+1)+'</div>';
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
   12. EDIT PANEL
   ───────────────────────────────────────────────────────── */
function fillEdit(){
  if(!ST.slides.length) return;
  var s=ST.slides[ST.cur];
  document.getElementById('eHead').value=s.headline||'';
  document.getElementById('eBody').value=s.body||'';
  document.getElementById('eCap').value=s.caption||'';
  document.getElementById('editNum').textContent='Slide '+(ST.cur+1);
}
function liveEdit(){
  if(!ST.slides.length) return;
  ST.slides[ST.cur].headline=document.getElementById('eHead').value;
  ST.slides[ST.cur].body=document.getElementById('eBody').value;
  renderSlide();
}
function updateCap(){if(!ST.slides.length) return;ST.slides[ST.cur].caption=document.getElementById('eCap').value;}
function updateBrand(){ST.brand=document.getElementById('brandInput').value;if(ST.slides.length) renderSlide();}

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
   15. COPY & EXPORT
   ───────────────────────────────────────────────────────── */
function copyCaption(){var c=document.getElementById('eCap').value;if(!c){toast('No caption on this slide');return;}navigator.clipboard.writeText(c).then(function(){toast('✓ Caption copied');});}
function copyAll(){
  if(!ST.slides.length){toast('Generate a carousel first');return;}
  var all=ST.slides.map(function(s,i){
    var tags=(s.hashtags&&s.hashtags.length)?' '+s.hashtags.join(' '):'';
    return '── SLIDE '+(i+1)+' ──\n'+(s.headline||'')+'\n\n'+(s.caption||tags);
  }).join('\n\n');
  navigator.clipboard.writeText(all).then(function(){toast('✓ All captions copied');});
}
function openExport(){document.getElementById('exportModal').classList.add('show');}
function closeExport(){document.getElementById('exportModal').classList.remove('show');}
function selExport(t){ST.exportType=t;['png','copy','json'].forEach(function(x){document.getElementById('eo'+x.charAt(0).toUpperCase()+x.slice(1)).classList.toggle('sel',x===t);});}
function doExport(){
  closeExport();
  if(ST.exportType==='copy'){copyAll();}
  else if(ST.exportType==='json'){
    var j=JSON.stringify({slides:ST.slides,theme:ST.theme,platform:document.getElementById('platSelect').value},null,2);
    var b=new Blob([j],{type:'application/json'});
    var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='carousel-data.json';a.click();
    toast('✓ JSON exported');
  } else {
    toast('PNG: screenshot each slide. Full export coming soon.');
  }
}

/* ─────────────────────────────────────────────────────────
   16. TOAST
   ───────────────────────────────────────────────────────── */
function toast(msg){
  var shelf=document.getElementById('toastShelf');
  var el=document.createElement('div');el.className='toast';el.textContent=msg;
  shelf.appendChild(el);
  setTimeout(function(){el.remove();},3200);
}

/* ─────────────────────────────────────────────────────────
   17. KEYBOARD
   ───────────────────────────────────────────────────────── */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown') nextSlide();
  if(e.key==='ArrowLeft'||e.key==='ArrowUp') prevSlide();
});

/* ─────────────────────────────────────────────────────────
   18. INIT
   ───────────────────────────────────────────────────────── */
(function(){
  updateCounter();
  // Keep server warm
  setInterval(function(){fetch(DIJO_SERVER+'/ping').catch(function(){});},600000);
})();
