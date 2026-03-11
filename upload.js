// ================================================================
// ImpactGrid Creator Studio v4
// AssemblyAI captions · Smart keyword detection · Premium panel
// ================================================================

var ASSEMBLY_KEY    = '80e3b7c067bf4d68a16ad9e32efc9887';
var ASSEMBLY_UPLOAD = 'https://api.assemblyai.com/v2/upload';
var ASSEMBLY_SUBMIT = 'https://api.assemblyai.com/v2/transcript';

// ─────────────────────────────────────────────────────────────────
// KEYWORD DETECTION — words that deserve a dramatic moment
// ─────────────────────────────────────────────────────────────────
var KW_LIST = [
  'amazing','incredible','insane','crazy','unbelievable','shocking','mindblowing',
  'huge','massive','biggest','powerful','epic','legendary','iconic',
  'never','always','only','first','last','secret','truth','real',
  'money','rich','wealthy','millionaire','success','winner','champion',
  'love','hate','fire','kill','destroy','crush','dominate',
  'free','now','today','live','breaking','new','launch',
  'stop','watch','listen','look','wait','seriously','literally',
  'best','worst','most','least','every','nothing','everything',
  'change','transform','build','grow','learn','create','make',
  'wow','omg','yes','no','wait','impossible','possible'
];

var STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for',
  'of','with','by','from','is','was','are','were','be','been','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'i','you','he','she','it','we','they','me','him','her','us','them',
  'my','your','his','its','our','their','this','that','these','those',
  'what','which','who','when','where','how','why','if','then','so','just',
  'also','not','no','up','out','about','into','than','like','more','very']);

function isKeyword(word){
  var w = word.toLowerCase().replace(/[^a-z]/g,'');
  if(w.length < 3) return false;
  if(STOP_WORDS.has(w)) return false;
  if(KW_LIST.includes(w)) return true;
  // Also flag words ending in ! or with caps
  if(/[!?]{1,}/.test(word)) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────
// CAPTION STYLES
// ─────────────────────────────────────────────────────────────────
var STYLES = [
  {
    id:'fire', name:'🔥 Fire Word',
    desc:'Each word slams in then snaps to an orange pill.',
    tags:['TikTok','Viral'],
    gradient:'linear-gradient(150deg,#2a0800,#0d0300)',
    grade:'brightness(1.1) saturate(1.4) contrast(1.06)',
    tint:'rgba(255,40,0,0.08)', tintMode:'soft-light', vignette:0.5,
    render: function(ctx,W,H,d){ renderFire(ctx,W,H,d); }
  },
  {
    id:'colourflip', name:'🎨 Colour Flip',
    desc:'Words alternate white and gold. All caps, bold.',
    tags:['Modern','Clean'],
    gradient:'linear-gradient(150deg,#0a0a0a,#141414)',
    grade:'brightness(0.95) contrast(1.06)',
    tint:'rgba(0,0,0,0)', tintMode:'source-over', vignette:0.6,
    render: function(ctx,W,H,d){ renderColourFlip(ctx,W,H,d); }
  },
  {
    id:'cinematic', name:'🎬 Cinematic',
    desc:'Elegant word fade-in. Cool grade with letterbox.',
    tags:['Film','Premium'],
    gradient:'linear-gradient(150deg,#000814,#001233)',
    grade:'brightness(0.86) saturate(0.72) contrast(1.05)',
    tint:'rgba(0,30,120,0.2)', tintMode:'soft-light', vignette:0.82, letterbox:true,
    render: function(ctx,W,H,d){ renderCinematic(ctx,W,H,d); }
  },
  {
    id:'hype', name:'⚡ Hype Centre',
    desc:'One massive word centre screen. Slams in with flash.',
    tags:['Sports','Launch'],
    gradient:'linear-gradient(150deg,#1a1000,#080600)',
    grade:'brightness(1.14) saturate(1.5) contrast(1.12)',
    tint:'rgba(240,180,0,0.12)', tintMode:'soft-light', vignette:0.42,
    render: function(ctx,W,H,d){ renderHype(ctx,W,H,d); }
  },
  {
    id:'neonkaraoke', name:'💜 Neon Karaoke',
    desc:'Dark bar bottom. Each word glows gold when spoken.',
    tags:['Podcast','Night'],
    gradient:'linear-gradient(150deg,#05000f,#0f0020)',
    grade:'brightness(0.85) saturate(0.7) contrast(1.1)',
    tint:'rgba(120,0,200,0.15)', tintMode:'soft-light', vignette:0.7,
    render: function(ctx,W,H,d){ renderKaraoke(ctx,W,H,d); }
  },
  {
    id:'split', name:'✂ Bold Split',
    desc:'Active word huge upper screen. Sentence small below.',
    tags:['Drama','Impact'],
    gradient:'linear-gradient(150deg,#080808,#040404)',
    grade:'brightness(0.9) saturate(1.1) contrast(1.1)',
    tint:'rgba(255,255,255,0.03)', tintMode:'soft-light', vignette:0.68,
    render: function(ctx,W,H,d){ renderSplit(ctx,W,H,d); }
  },
  {
    id:'typewriter', name:'⌨ Typewriter',
    desc:'Words type in left to right with blinking cursor.',
    tags:['Clean','Satisfying'],
    gradient:'linear-gradient(150deg,#0a0a0a,#111111)',
    grade:'brightness(0.94) contrast(1.04)',
    tint:'rgba(0,0,0,0)', tintMode:'source-over', vignette:0.45,
    render: function(ctx,W,H,d){ renderTypewriter(ctx,W,H,d); }
  },
  {
    id:'bounce', name:'🎵 Shake & Bounce',
    desc:'Words physically bounce and cycle hues with energy.',
    tags:['Music','Fun'],
    gradient:'linear-gradient(150deg,#0d0020,#1a0030)',
    grade:'brightness(1.05) saturate(1.3) contrast(1.05)',
    tint:'rgba(160,0,255,0.1)', tintMode:'soft-light', vignette:0.5,
    render: function(ctx,W,H,d){ renderBounce(ctx,W,H,d); }
  }
];

// ─────────────────────────────────────────────────────────────────
// KEYWORD DISPLAY STYLES
// ─────────────────────────────────────────────────────────────────
var KW_RENDER_STYLES = [
  {
    id:'explosion', name:'💥 Explosion',
    desc:'Word SLAMS in huge at 3x then shrinks. Screen flashes.',
    render: function(ctx,W,H,word,age){
      // Flash
      if(age<0.1){ ctx.fillStyle='rgba(255,255,255,'+(0.5*(1-age/0.1))+')'; ctx.fillRect(0,0,W,H); }
      var scale = age<0.18 ? 3-(age/0.18)*2 : 1;
      var size  = Math.min(W*0.22,100);
      ctx.save();
      ctx.translate(W/2,H*0.42);
      ctx.scale(scale,scale);
      ctx.globalAlpha = Math.min(age/0.04,1);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px Anton,"DM Sans",sans-serif';
      ctx.lineWidth=18; ctx.strokeStyle='#000'; ctx.lineJoin='round';
      ctx.strokeText(word.toUpperCase(),0,0);
      // Gradient fill
      var g=ctx.createLinearGradient(0,-size/2,0,size/2);
      g.addColorStop(0,'#fff'); g.addColorStop(0.4,'#ff5c1a'); g.addColorStop(1,'#f0c93a');
      ctx.fillStyle=g; ctx.fillText(word.toUpperCase(),0,0);
      ctx.restore();
    }
  },
  {
    id:'neonburst', name:'🌟 Neon Burst',
    desc:'Word glows with intense neon radiating outward.',
    render: function(ctx,W,H,word,age){
      var size = Math.min(W*0.15,72);
      var scale= age<0.14 ? 1+(0.14-age)/0.14*0.8 : 1;
      var col  = age<0.5 ? '#00e5ff' : '#e040fb';
      ctx.save();
      ctx.translate(W/2,H*0.44);
      ctx.scale(scale,scale);
      ctx.globalAlpha = Math.min(age/0.06,1);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      for(var i=3;i>=1;i--){
        ctx.shadowColor=col; ctx.shadowBlur=30*i;
        ctx.fillStyle=col; ctx.fillText(word.toUpperCase(),0,0);
      }
      ctx.restore();
    }
  },
  {
    id:'stamp', name:'🖨 Stamp',
    desc:'Word stamps down with impact line and shake.',
    render: function(ctx,W,H,word,age){
      var size = Math.min(W*0.17,80);
      var shake= age<0.12 ? (Math.random()-0.5)*8*(1-age/0.12) : 0;
      var scale= age<0.06 ? age/0.06 : 1;
      ctx.save();
      ctx.translate(W/2+shake,H*0.43+shake*0.5);
      ctx.scale(scale,scale);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px Syne,"DM Sans",sans-serif';
      // Bold black bg rect
      ctx.font='900 '+size+'px Syne,sans-serif';
      var tw=ctx.measureText(word.toUpperCase()).width;
      ctx.fillStyle='#fff';
      ctx.fillRect(-tw/2-16,-size/2-12,tw+32,size+24);
      ctx.fillStyle='#000';
      ctx.fillText(word.toUpperCase(),0,4);
      // Red underline
      ctx.fillStyle='#ff5c1a';
      ctx.fillRect(-tw/2-16,size/2+6,tw+32,6);
      ctx.restore();
    }
  },
  {
    id:'glitch', name:'⚡ Glitch',
    desc:'Word glitches in with RGB split and digital noise.',
    render: function(ctx,W,H,word,age){
      var size  = Math.min(W*0.14,66);
      var glitch= age<0.25 ? Math.random()*12*(1-age/0.25) : 0;
      ctx.save();
      ctx.globalAlpha = Math.min(age/0.06,1);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      // RGB channels offset
      ctx.save(); ctx.globalAlpha*=0.7;
      ctx.fillStyle='#ff0044'; ctx.fillText(word.toUpperCase(),W/2-glitch,H*0.43);
      ctx.fillStyle='#00ffcc'; ctx.fillText(word.toUpperCase(),W/2+glitch,H*0.43+glitch*0.5);
      ctx.restore();
      ctx.fillStyle='#fff';   ctx.fillText(word.toUpperCase(),W/2,H*0.43);
      ctx.restore();
    }
  }
];

var activeKWStyle = KW_RENDER_STYLES[0];

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
var clip         = null;
var activeStyle  = STYLES[0];
var allWords     = [];     // {w, t, end, isKW}
var sentences    = [];     // {t, end, words, dramatic}
var keywords     = [];     // {w, t, end, active:true}
var customKWs    = [];
var isPlaying    = false;
var rafId        = null;
var exportFmt    = 'reel';
var transcriptId = null;
var pollTimer    = null;

// Grade / overlay state
var activeGrade  = null;
var customFilter = '';
var overlayTextVal = '';
var overlayPos   = 'mid';
var overlayTxtStyle = 'white';
var musicAudio   = null;
var musicVolume  = 0.4;
var activeMusicUrl = null;

var vid    = document.getElementById('masterVid');
var cv     = document.getElementById('cv');
var cvCtx  = cv.getContext('2d');
var gradeC = document.createElement('canvas');
var gradeX = gradeC.getContext('2d');

// ─────────────────────────────────────────────────────────────────
// BUILD STYLE PICKER (S2)
// ─────────────────────────────────────────────────────────────────
(function(){
  var grid = document.getElementById('styleGrid');
  var DEMOS = {
    fire:'<span style="background:#ff5c1a;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:800;box-shadow:0 0 14px #ff5c1a">FIRE</span> <span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.3);padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700">WORD</span>',
    colourflip:'<span style="color:#fff;font-size:14px;font-weight:800">YOUR </span><span style="color:#f0c93a;font-size:14px;font-weight:800">WORDS </span><span style="color:rgba(255,255,255,0.25);font-size:13px;font-weight:800">HERE</span>',
    cinematic:'<span style="color:#90caf9;font-size:13px;font-weight:500;text-shadow:0 0 12px #90caf9">YOUR WORDS HERE</span>',
    hype:'<span style="font-family:Anton,sans-serif;font-size:42px;color:#f0c93a;-webkit-text-stroke:2px #000;text-shadow:0 0 20px rgba(240,201,58,0.4)">HYPE</span>',
    neonkaraoke:'<div style="background:rgba(5,0,15,0.95);padding:6px 14px;border-top:2px solid #e040fb;border-radius:4px"><span style="color:rgba(192,132,252,0.35);font-size:11px;font-weight:700">YOUR </span><span style="color:#f0c93a;font-size:11px;font-weight:700;text-shadow:0 0 10px #f0c93a">WORDS </span><span style="color:rgba(192,132,252,0.2);font-size:11px;font-weight:700">HERE</span></div>',
    split:'<div style="text-align:center"><div style="font-family:Syne,sans-serif;font-size:34px;font-weight:900;color:#fff;-webkit-text-stroke:1px #000;line-height:1">BOLD</div><div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:3px;letter-spacing:1px">your sentence here</div></div>',
    typewriter:'<span style="color:#00e5ff;font-size:13px;font-weight:700;text-shadow:0 0 10px #00e5ff">YOUR WORDS</span><span style="color:#00e5ff;font-weight:700;font-size:13px">▌</span>',
    bounce:'<span style="color:hsl(280,100%,65%);font-size:13px;font-weight:800;text-shadow:0 0 10px hsl(280,100%,65%)">SH</span><span style="color:hsl(320,100%,65%);font-size:16px;font-weight:800;text-shadow:0 0 12px hsl(320,100%,65%)">AK</span><span style="color:hsl(0,100%,65%);font-size:13px;font-weight:800;text-shadow:0 0 10px hsl(0,100%,65%)">E</span>'
  };

  STYLES.forEach(function(s,si){
    var card = document.createElement('div');
    card.className = 'sc'+(si===0?' sel':'');
    card.innerHTML =
      '<div class="sc-demo" style="background:'+s.gradient+'">'+(DEMOS[s.id]||'')+'<div class="sc-tick">✓</div></div>'
      +'<div class="sc-body"><div class="sc-name">'+s.name+'</div>'
      +'<div class="sc-desc">'+s.desc+'</div>'
      +'<div class="sc-tags">'+s.tags.map(function(t){return '<span class="sc-tag">'+t+'</span>';}).join('')+'</div>'
      +'</div>';
    card.onclick = function(){
      document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('sel');});
      card.classList.add('sel');
      activeStyle = s;
      setTimeout(function(){
        if(allWords.length) launchPreview();
        else processWithAssemblyAI();
      },200);
    };
    grid.appendChild(card);
  });
})();

// ─────────────────────────────────────────────────────────────────
// BUILD CAPTION STYLE LIST (right panel)
// ─────────────────────────────────────────────────────────────────
function buildCaptionList(){
  var list = document.getElementById('miniStyles');
  if(!list) return;
  list.innerHTML = '';
  var MINI_DEMOS = {
    fire:'<div style="background:linear-gradient(135deg,#2a0800,#0d0300);width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:3px"><span style="background:#ff5c1a;color:#fff;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:800;box-shadow:0 0 8px #ff5c1a">FIRE</span><span style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.25);padding:2px 5px;border-radius:4px;font-size:7px;font-weight:700">WORD</span></div>',
    colourflip:'<div style="background:#0a0a0a;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:9px;font-weight:800">YOUR </span><span style="color:#f0c93a;font-size:9px;font-weight:800">WORDS</span></div>',
    cinematic:'<div style="background:linear-gradient(135deg,#000814,#001233);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#90caf9;font-size:9px;text-shadow:0 0 8px #90caf9">YOUR WORDS</span></div>',
    hype:'<div style="background:linear-gradient(135deg,#1a1000,#080600);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-family:Anton,sans-serif;font-size:20px;color:#f0c93a;-webkit-text-stroke:1px #000">HYPE</span></div>',
    neonkaraoke:'<div style="background:linear-gradient(135deg,#05000f,#0f0020);width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px"><div style="background:rgba(5,0,15,0.95);padding:2px 8px;border-top:1px solid #e040fb;font-size:7px"><span style="color:#f0c93a;text-shadow:0 0 6px #f0c93a;font-weight:700">NEO</span><span style="color:rgba(192,132,252,0.35);font-weight:700">N</span></div></div>',
    split:'<div style="background:#080808;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-family:Syne,sans-serif;font-size:16px;font-weight:900;color:#fff;-webkit-text-stroke:0.5px #000">BIG</span><span style="font-size:6px;color:rgba(255,255,255,0.25);margin-top:2px">small below</span></div>',
    typewriter:'<div style="background:#0a0a0a;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#00e5ff;font-size:9px;font-weight:700;text-shadow:0 0 8px #00e5ff">TYPE▌</span></div>',
    bounce:'<div style="background:linear-gradient(135deg,#0d0020,#1a0030);width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:1px"><span style="color:hsl(280,100%,65%);font-size:10px;font-weight:800">S</span><span style="color:hsl(320,100%,65%);font-size:13px;font-weight:800">H</span><span style="color:hsl(0,100%,65%);font-size:10px;font-weight:800">K</span></div>'
  };

  STYLES.forEach(function(s,si){
    var btn = document.createElement('button');
    btn.className = 'cap-style-btn'+(si===0?' active-style':'');
    btn.innerHTML =
      '<div class="csb-preview">'+(MINI_DEMOS[s.id]||'')+'</div>'
      +'<div class="csb-info"><div class="csb-name">'+s.name+'</div><div class="csb-tag">'+s.tags.join(' · ')+'</div></div>';
    btn.onclick = function(){
      activeStyle = s;
      document.querySelectorAll('.cap-style-btn').forEach(function(x){x.classList.remove('active-style');});
      btn.classList.add('active-style');
      document.getElementById('styleBadge').textContent = s.name;
      document.getElementById('expStyle').textContent   = s.name;
      if(!isPlaying) drawFrame();
      toast('Style: '+s.name);
    };
    list.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD KEYWORD STYLE GRID
// ─────────────────────────────────────────────────────────────────
function buildKWStyleGrid(){
  var grid = document.getElementById('kwStyleGrid');
  if(!grid) return;
  grid.innerHTML = '';
  KW_RENDER_STYLES.forEach(function(ks,i){
    var btn = document.createElement('button');
    btn.className = 'kw-style-btn'+(i===0?' active-kws':'');
    btn.innerHTML = '<div>'+ks.name+'</div><div style="font-size:9px;color:var(--dim);margin-top:3px;font-weight:500">'+ks.desc.substring(0,28)+'…</div>';
    btn.onclick = function(){
      activeKWStyle = ks;
      document.querySelectorAll('.kw-style-btn').forEach(function(x){x.classList.remove('active-kws');});
      btn.classList.add('active-kws');
      toast('Keyword style: '+ks.name);
    };
    grid.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD KEYWORD LIST IN PANEL
// ─────────────────────────────────────────────────────────────────
function buildKWList(){
  var list = document.getElementById('kwList');
  if(!list) return;
  list.innerHTML = '';
  if(!keywords.length){
    list.innerHTML = '<div style="font-size:12px;color:var(--dim);padding:10px 0">No keywords detected yet</div>';
    return;
  }
  keywords.forEach(function(kw,i){
    var item = document.createElement('div');
    item.className = 'kw-item kw-on';
    item.innerHTML =
      '<span class="kw-word">'+kw.w+'</span>'
      +'<span class="kw-time">'+ft(kw.t)+'</span>'
      +'<button class="kw-toggle" title="Toggle">✓</button>';
    item.querySelector('.kw-toggle').onclick = function(e){
      e.stopPropagation();
      kw.active = !kw.active;
      item.classList.toggle('kw-on', kw.active);
      item.querySelector('.kw-toggle').textContent = kw.active ? '✓' : '○';
    };
    item.onclick = function(){
      if(vid.duration) vid.currentTime = Math.max(0, kw.t - 0.3);
      if(!isPlaying){ isPlaying=true; vid.play(); rafId=requestAnimationFrame(drawFrame); }
    };
    list.appendChild(item);
  });

  // Update badge + timeline markers
  document.getElementById('kwBadge').textContent = keywords.length+' keywords';
  buildKWMarkers();
}

function buildKWMarkers(){
  var container = document.getElementById('kwMarkers');
  if(!container||!vid.duration) return;
  container.innerHTML = '';
  keywords.forEach(function(kw){
    var dot = document.createElement('div');
    dot.className = 'kw-marker';
    dot.style.left = (kw.t/vid.duration*100)+'%';
    dot.title = kw.w+' @ '+ft(kw.t);
    container.appendChild(dot);
  });
}

function addCustomKeyword(){
  var inp = document.getElementById('kwCustomInput');
  var w   = inp.value.trim();
  if(!w) return;
  inp.value = '';
  customKWs.push(w.toLowerCase());
  // Search through allWords for matches
  allWords.forEach(function(wObj){
    var clean = wObj.w.toLowerCase().replace(/[^a-z]/g,'');
    if(clean === w.toLowerCase() && !keywords.find(function(k){return k.t===wObj.t;})){
      keywords.push({w:wObj.w, t:wObj.t, end:wObj.end, active:true});
    }
  });
  keywords.sort(function(a,b){return a.t-b.t;});
  buildKWList();
  toast('Keyword added: '+w);
}

// ─────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────
document.getElementById('fileIn').onchange = function(e){ loadFile(e.target.files[0]); };
(function(){
  var dz    = document.getElementById('dropZone');
  var inner = dz.querySelector('.dz-inner');
  ['dragover','dragenter'].forEach(function(ev){
    dz.addEventListener(ev,function(e){e.preventDefault();inner.classList.add('drag');});
  });
  ['dragleave','dragend'].forEach(function(ev){
    dz.addEventListener(ev,function(){inner.classList.remove('drag');});
  });
  dz.addEventListener('drop',function(e){
    e.preventDefault(); inner.classList.remove('drag');
    var f=Array.from(e.dataTransfer.files).find(function(x){return x.type.startsWith('video/');});
    if(f) loadFile(f);
  });
})();

function loadFile(f){
  if(!f) return;
  if(clip) URL.revokeObjectURL(clip.url);
  clip = {file:f, url:URL.createObjectURL(f)};
  vid.src = clip.url;
  vid.onloadedmetadata = function(){
    document.getElementById('fileChip').textContent = '🎬 '+f.name+' · '+ft(vid.duration);
  };
  goTo('sStyle');
}

// ─────────────────────────────────────────────────────────────────
// ASSEMBLYAI PIPELINE
// ─────────────────────────────────────────────────────────────────
function processWithAssemblyAI(){
  if(!clip){ toast('No video loaded'); return; }
  goTo('sProcess');
  setStatus('⬆','Uploading…','Sending your video to AssemblyAI…',8);

  var reader = new FileReader();
  reader.onload = function(e){
    fetch(ASSEMBLY_UPLOAD,{
      method:'POST',
      headers:{'authorization':ASSEMBLY_KEY,'content-type':'application/octet-stream'},
      body:e.target.result
    })
    .then(function(r){
      if(!r.ok) throw new Error('Upload failed: '+r.status+' — check your API key');
      return r.json();
    })
    .then(function(data){
      var uploadUrl = data.upload_url||data.uploadUrl;
      if(!uploadUrl) throw new Error('No upload URL returned');
      log('✓ Uploaded');
      setStatus('🔬','Transcribing…','AssemblyAI is reading every word…',25);
      submitTranscript(uploadUrl);
    })
    .catch(function(err){ setStatus('❌','Upload failed',err.message,0); toast('Error: '+err.message); });
  };
  reader.readAsArrayBuffer(clip.file);
}

function submitTranscript(audioUrl){
  fetch(ASSEMBLY_SUBMIT,{
    method:'POST',
    headers:{'authorization':ASSEMBLY_KEY,'content-type':'application/json'},
    body:JSON.stringify({audio_url:audioUrl, speech_models:['universal-2']})
  })
  .then(function(r){
    if(!r.ok) return r.json().then(function(e){ throw new Error('Transcript submit failed: '+r.status+' — '+(e.error||e.message||JSON.stringify(e))); });
    return r.json();
  })
  .then(function(data){
    if(!data.id) throw new Error('No transcript ID returned');
    transcriptId = data.id;
    log('✓ Queued ('+data.id+')');
    setStatus('🎙','Processing speech…','Word-perfect accuracy — 30–90 seconds…',35);
    pollTranscript();
  })
  .catch(function(err){ setStatus('❌','Failed',err.message,0); toast('Error: '+err.message); });
}

function pollTranscript(){
  if(pollTimer) clearTimeout(pollTimer);
  fetch(ASSEMBLY_SUBMIT+'/'+transcriptId,{headers:{'authorization':ASSEMBLY_KEY}})
  .then(function(r){return r.json();})
  .then(function(data){
    if(data.status==='completed'){
      log('✓ '+data.words.length+' words timed');
      setStatus('✅','Done!','"'+data.text.substring(0,55)+(data.text.length>55?'…':'')+'"',100);
      buildCaptions(data.words);
      setTimeout(launchPreview, 700);
    } else if(data.status==='error'){
      setStatus('❌','Error',data.error||'Unknown',0);
    } else {
      document.getElementById('progFill').style.width=(data.status==='processing'?65:45)+'%';
      document.getElementById('procDesc').textContent='Status: '+data.status+'…';
      pollTimer = setTimeout(pollTranscript,2500);
    }
  })
  .catch(function(){ pollTimer=setTimeout(pollTranscript,3000); });
}

// ─────────────────────────────────────────────────────────────────
// BUILD CAPTIONS + DETECT KEYWORDS
// ─────────────────────────────────────────────────────────────────
function buildCaptions(wordData){
  allWords=[]; sentences=[]; keywords=[];

  if(!wordData||!wordData.length){ toast('No speech detected'); return; }

  allWords = wordData.map(function(w){
    var kw = isKeyword(w.text) || customKWs.includes(w.text.toLowerCase().replace(/[^a-z]/g,''));
    return {w:w.text, t:w.start/1000, end:w.end/1000, isKW:kw};
  });

  // Detect keywords
  allWords.forEach(function(w){
    if(w.isKW) keywords.push({w:w.w, t:w.t, end:w.end, active:true});
  });

  // Group into sentences (by pause or length)
  var cur=[];
  allWords.forEach(function(word,wi){
    cur.push(word);
    var next    = allWords[wi+1];
    var isGap   = next && (next.t - word.end) > 0.45;
    var isLong  = cur.length >= 6;
    var isLast  = wi===allWords.length-1;
    if(isGap||isLong||isLast){
      sentences.push({
        t:     cur[0].t,
        end:   cur[cur.length-1].end,
        words: cur.slice(),
        dramatic: cur.some(function(w){return w.isKW;})
      });
      cur=[];
    }
  });

  log('✓ '+sentences.length+' captions, '+keywords.length+' keywords');
}

// ─────────────────────────────────────────────────────────────────
// LAUNCH PREVIEW
// ─────────────────────────────────────────────────────────────────
function launchPreview(){
  goTo('sPreview');
  cv.width=540; cv.height=960;

  // Build all panel content
  buildCaptionList();
  buildKWStyleGrid();
  buildKWList();
  buildGradeGrid();
  buildTxtStyles();
  buildMusicList();

  document.getElementById('expStyle').textContent   = activeStyle.name;
  document.getElementById('styleBadge').textContent  = activeStyle.name;
  document.getElementById('expStats').innerHTML =
    allWords.length+' words &nbsp;·&nbsp; '+sentences.length+' captions &nbsp;·&nbsp; '+keywords.length+' keywords';

  vid.pause(); vid.currentTime=0;
  vid.ontimeupdate = function(){
    var t=vid.currentTime, d=vid.duration||1;
    document.getElementById('vbFill').style.width=(t/d*100)+'%';
    document.getElementById('vbTime').textContent=ft(t)+' / '+ft(d);
    buildKWMarkers();
  };
  vid.onended = function(){
    isPlaying=false;
    document.getElementById('vbPlay').textContent='▶';
    document.getElementById('bigPlay').textContent='▶';
    document.getElementById('playTap').classList.remove('on');
    cancelAnimationFrame(rafId);
  };
  drawFrame();
}

// ─────────────────────────────────────────────────────────────────
// DRAW FRAME
// ─────────────────────────────────────────────────────────────────
function drawFrame(){
  if(!vid.videoWidth){ if(isPlaying) rafId=requestAnimationFrame(drawFrame); return; }
  var W=cv.width, H=cv.height, st=activeStyle;
  if(gradeC.width!==W||gradeC.height!==H){gradeC.width=W;gradeC.height=H;}

  cvCtx.clearRect(0,0,W,H);

  // 1. Video + colour grade
  var vw=vid.videoWidth,vh=vid.videoHeight;
  var sc=Math.max(W/vw,H/vh), dw=vw*sc, dh=vh*sc;
  gradeX.clearRect(0,0,W,H);
  gradeX.filter = getCurrentFilter();
  gradeX.drawImage(vid,(W-dw)/2,(H-dh)/2,dw,dh);
  gradeX.filter = 'none';
  cvCtx.drawImage(gradeC,0,0);

  // 2. Tint
  cvCtx.globalCompositeOperation = st.tintMode||'source-over';
  cvCtx.fillStyle = st.tint||'transparent';
  cvCtx.fillRect(0,0,W,H);
  cvCtx.globalCompositeOperation = 'source-over';

  // 3. Vignette
  if(st.vignette>0){
    var vg=cvCtx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,H*0.9);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,'+st.vignette+')');
    cvCtx.fillStyle=vg; cvCtx.fillRect(0,0,W,H);
  }

  // 4. Letterbox
  if(st.letterbox){
    var bh=Math.round(H*0.082);
    cvCtx.fillStyle='#000';
    cvCtx.fillRect(0,0,W,bh); cvCtx.fillRect(0,H-bh,W,bh);
  }

  var now = vid.currentTime;

  // 5. Text overlay
  drawTextOverlay(cvCtx,W,H);

  // 6. KEYWORD dramatic moment — takes over captions when a KW is active
  var activeKW = null;
  for(var ki=0;ki<keywords.length;ki++){
    var kw=keywords[ki];
    if(kw.active && now>=kw.t && now<=kw.end+0.5){
      activeKW=kw; break;
    }
  }

  if(activeKW){
    var kwAge = now - activeKW.t;
    activeKWStyle.render(cvCtx,W,H,activeKW.w,kwAge);
    // Flash border
    if(kwAge<0.12){
      var flashCanvas = document.getElementById('kwFlash');
      if(flashCanvas){
        flashCanvas.style.boxShadow='inset 0 0 40px rgba(255,92,26,'+(0.6*(1-kwAge/0.12))+')';
        setTimeout(function(){if(flashCanvas)flashCanvas.style.boxShadow='none';},200);
      }
    }
  } else {
    // 7. Regular captions
    var curSent=null;
    for(var i=0;i<sentences.length;i++){
      if(now>=sentences[i].t&&now<=sentences[i].end+0.4){curSent=sentences[i];break;}
    }
    if(curSent){
      st.render(cvCtx,W,H,{words:curSent.words, curTime:now, dramatic:curSent.dramatic});
    }
  }

  // 8. Watermark
  cvCtx.save();
  cvCtx.font='10px "DM Sans",sans-serif';
  cvCtx.fillStyle='rgba(255,255,255,0.12)';
  cvCtx.textAlign='right'; cvCtx.textBaseline='top';
  cvCtx.fillText('ImpactGrid',W-10,10);
  cvCtx.restore();

  if(isPlaying) rafId=requestAnimationFrame(drawFrame);
}

// ─────────────────────────────────────────────────────────────────
// 8 CAPTION RENDERERS
// ─────────────────────────────────────────────────────────────────
function renderFire(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=22, padX=13, padY=8;
  var lines=groupLines(d.words,3), lineH=size+padY*2+8;
  var startY=H*0.80-(lines.length*lineH)/2;
  lines.forEach(function(line,li){
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var totalW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+padX*2+8;},0);
    var x=W/2-totalW/2, y=startY+li*lineH+lineH/2;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width, bW=ww+padX*2, bH=size+padY*2;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var isPast=now>wObj.end+0.2;
      var age=now-wObj.t;
      var slam=isNow&&age<0.15?2-(age/0.15):1;
      ctx.save();
      ctx.translate(x+bW/2,y); ctx.scale(slam,slam);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(isNow){
        ctx.shadowColor='#ff5c1a'; ctx.shadowBlur=20;
        ctx.fillStyle='#ff5c1a'; rRect(ctx,-bW/2,-bH/2,bW,bH,8); ctx.fill();
        ctx.shadowBlur=0; ctx.fillStyle='#fff';
        ctx.font='bold '+size+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,0,1);
      } else if(isPast){
        ctx.globalAlpha=0.5; ctx.fillStyle='rgba(255,255,255,0.1)';
        rRect(ctx,-bW/2,-bH/2,bW,bH,8); ctx.fill();
        ctx.fillStyle='#fff'; ctx.font='bold '+size+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,0,1);
      } else {
        ctx.globalAlpha=0.2; ctx.fillStyle='#fff';
        ctx.font='bold '+size+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,0,1);
      }
      ctx.restore(); x+=bW+8;
    });
  });
}

function renderColourFlip(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=d.dramatic?26:21;
  var lines=groupLines(d.words,4), lineH=size+14;
  var startY=H*0.82-(lines.length-1)*lineH/2;
  lines.forEach(function(line,li){
    ctx.font='800 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2, isPast=now>wObj.end+0.2;
      var age=now-wObj.t, fadeIn=age<0?0:Math.min(age/0.12,1);
      var baseColor=wi%2===0?'#ffffff':'#f0c93a';
      ctx.save();
      ctx.globalAlpha=fadeIn*(isPast?0.9:isNow?1:0.22);
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='800 '+size+'px "DM Sans",sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.95)'; ctx.shadowBlur=10;
      if(isNow){
        ctx.translate(x+ww/2,lY); ctx.scale(1.1,1.1);
        ctx.shadowColor=baseColor; ctx.shadowBlur=18;
        ctx.fillStyle=baseColor; ctx.fillText(wObj.w.toUpperCase(),-ww/2,0);
      } else {
        ctx.fillStyle=baseColor; ctx.fillText(wObj.w.toUpperCase(),x,lY);
      }
      ctx.restore(); x+=ww+10;
    });
  });
}

function renderCinematic(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=d.dramatic?20:17;
  var lines=groupLines(d.words,6), lineH=size+10;
  var startY=H*0.87-(lines.length-1)*lineH/2;
  lines.forEach(function(line,li){
    ctx.font=(d.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var age=now-wObj.t, alpha=age<0?0:Math.min(age/0.2,1);
      ctx.save();
      ctx.globalAlpha=alpha; ctx.textAlign='left'; ctx.textBaseline='middle';
      if(isNow){ctx.shadowColor='#90caf9';ctx.shadowBlur=14;ctx.fillStyle='#90caf9';}
      else{ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=7;ctx.fillStyle='#fff';}
      ctx.font=(d.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
      ctx.fillText(wObj.w,x,lY);
      ctx.restore(); x+=ww+8;
    });
  });
}

function renderHype(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, cur=d.words.find(function(w){return now>=w.t&&now<=w.end+0.15;});
  if(!cur) return;
  var age=now-cur.t, scale=age<0.12?1+(0.12-age)/0.12*0.7:1;
  if(age<0.07){ctx.fillStyle='rgba(240,201,58,'+(0.4*(1-age/0.07))+')';ctx.fillRect(0,0,W,H);}
  var size=Math.min(W*0.18,84);
  ctx.save();
  ctx.globalAlpha=Math.min(age/0.05,1);
  ctx.translate(W/2,H*0.46); ctx.scale(scale,scale);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+size+'px Anton,"DM Sans",sans-serif';
  ctx.lineWidth=16;ctx.strokeStyle='rgba(0,0,0,0.95)';ctx.lineJoin='round';
  ctx.strokeText(cur.w.toUpperCase(),0,0);
  ctx.fillStyle='#f0c93a'; ctx.fillText(cur.w.toUpperCase(),0,0);
  ctx.restore();
  var rest=d.words.filter(function(w){return w!==cur;}).map(function(w){return w.w;}).join(' ');
  if(rest&&age>0.1){
    ctx.save();ctx.globalAlpha=Math.min((age-0.1)/0.15,0.7);
    ctx.font='500 15px "DM Sans",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=6;ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText(rest,W/2,H*0.58);ctx.restore();
  }
}

function renderKaraoke(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=20, barH=62, barY=H*0.81;
  var bg=ctx.createLinearGradient(0,barY,0,barY+barH);
  bg.addColorStop(0,'rgba(5,0,15,0.96)');bg.addColorStop(1,'rgba(5,0,15,0.7)');
  ctx.fillStyle=bg; ctx.fillRect(0,barY,W,barH);
  var pulse=0.5+0.5*Math.sin(now*4);
  ctx.fillStyle='hsl('+(280+pulse*40)+',100%,65%)';ctx.fillRect(0,barY,W,2);
  var lines=groupLines(d.words,5), lineH=barH/Math.max(lines.length,1);
  lines.forEach(function(line,li){
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=barY+lineH*(li+0.5)+4;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.15, isPast=now>wObj.end+0.15;
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='bold '+size+'px "DM Sans",sans-serif';
      if(isNow){ctx.shadowColor='#f0c93a';ctx.shadowBlur=22;ctx.fillStyle='#f0c93a';ctx.fillText(wObj.w,x,lY);ctx.shadowBlur=8;ctx.fillText(wObj.w,x,lY);}
      else{ctx.globalAlpha=isPast?0.45:0.18;ctx.fillStyle='#c084fc';ctx.fillText(wObj.w,x,lY);}
      ctx.restore(); x+=ww+10;
    });
  });
}

function renderSplit(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, cur=d.words.find(function(w){return now>=w.t&&now<=w.end+0.12;});
  if(!cur) return;
  var age=now-cur.t, scale=age<0.14?1+(0.14-age)/0.14*0.5:1;
  var bigSize=Math.min(W*0.16,74);
  ctx.save();ctx.translate(W/2,H*0.43);ctx.scale(scale,scale);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+bigSize+'px Syne,"DM Sans",sans-serif';
  ctx.lineWidth=10;ctx.strokeStyle='#000';ctx.lineJoin='round';ctx.strokeText(cur.w.toUpperCase(),0,0);
  var g=ctx.createLinearGradient(0,-bigSize/2,0,bigSize/2);
  g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0.72)');
  ctx.fillStyle=g;ctx.fillText(cur.w.toUpperCase(),0,0);ctx.restore();
  var sentSize=13;ctx.font='600 '+sentSize+'px "DM Sans",sans-serif';
  var sLines=groupLines(d.words,6);
  sLines.forEach(function(line,li){
    var x=W/2-measLineW(ctx,line)/2, lY=H*0.59+li*(sentSize+7);
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width, isCur=wObj===cur, isPast=now>wObj.end+0.1;
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='600 '+sentSize+'px "DM Sans",sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=5;
      ctx.globalAlpha=isCur?1:isPast?0.42:0.22;ctx.fillStyle=isCur?'#fff':'#aaa';
      ctx.fillText(wObj.w,x,lY);ctx.restore();x+=ww+7;
    });
  });
}

function renderTypewriter(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=20;
  var lines=groupLines(d.words,5), lineH=size+16;
  var startY=H*0.81-(lines.length-1)*lineH/2, lastShown=null;
  lines.forEach(function(line,li){
    var visWords=line.filter(function(w){return now>=w.t;});
    if(!visWords.length) return;
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,visWords), x=W/2-lW/2, lY=startY+li*lineH;
    visWords.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width, isNow=now>=wObj.t&&now<=wObj.end+0.15;
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='bold '+size+'px "DM Sans",sans-serif';
      ctx.shadowColor=isNow?'#00e5ff':'rgba(0,0,0,0.9)';ctx.shadowBlur=isNow?12:6;
      ctx.fillStyle=isNow?'#00e5ff':'#fff';ctx.fillText(wObj.w,x,lY);ctx.restore();
      if(wi===visWords.length-1) lastShown={x:x+ww+4,y:lY};
      x+=ww+10;
    });
  });
  if(lastShown&&Math.sin(now*8)>0){
    ctx.fillStyle='#00e5ff';ctx.fillRect(lastShown.x,lastShown.y-size/2,2,size);
  }
}

function renderBounce(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=d.dramatic?26:21;
  var lines=groupLines(d.words,3), lineH=size+14;
  var startY=H*0.80-(lines.length*lineH)/2;
  lines.forEach(function(line,li){
    ctx.font='800 '+size+'px "DM Sans",sans-serif';
    var totalW=measLineW(ctx,line), x=W/2-totalW/2, y=startY+li*lineH+lineH/2;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.18, isPast=now>wObj.end+0.18;
      var age=now-wObj.t;
      var bounce=isNow?Math.sin(age*22)*5:0;
      var shake=isNow&&d.dramatic?(Math.random()-0.5)*4:0;
      ctx.save();ctx.translate(x+ww/2+shake,y+bounce);ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='800 '+size+'px "DM Sans",sans-serif';
      if(isNow){
        var hue=(now*120+wi*40)%360, col='hsl('+hue+',100%,65%)';
        ctx.shadowColor=col;ctx.shadowBlur=20;ctx.fillStyle=col;ctx.scale(1.12,1.12);
      } else {ctx.globalAlpha=isPast?0.55:0.22;ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,0.9)';ctx.shadowBlur=6;}
      ctx.fillText(wObj.w.toUpperCase(),0,0);ctx.restore();x+=ww+10;
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// COLOUR GRADE
// ─────────────────────────────────────────────────────────────────
var GRADES=[
  {id:'none',   name:'Original', filter:'none',                                              bg:'linear-gradient(135deg,#2a2a2a,#444)'},
  {id:'warm',   name:'Warm',     filter:'brightness(1.05) saturate(1.3) sepia(0.15)',        bg:'linear-gradient(135deg,#3d1a00,#8b4500)'},
  {id:'cold',   name:'Cold',     filter:'brightness(0.95) saturate(0.8) hue-rotate(180deg)', bg:'linear-gradient(135deg,#001233,#0a3d6e)'},
  {id:'vivid',  name:'Vivid',    filter:'brightness(1.08) saturate(1.8) contrast(1.1)',      bg:'linear-gradient(135deg,#1a0030,#003030)'},
  {id:'noir',   name:'Noir',     filter:'grayscale(1) contrast(1.3) brightness(0.9)',        bg:'linear-gradient(135deg,#000,#2a2a2a)'},
  {id:'golden', name:'Golden',   filter:'brightness(1.1) saturate(1.2) sepia(0.35)',         bg:'linear-gradient(135deg,#2a1a00,#6b4a00)'},
  {id:'moody',  name:'Moody',    filter:'brightness(0.82) saturate(0.75) contrast(1.15)',    bg:'linear-gradient(135deg,#0a0014,#140028)'},
  {id:'sunset', name:'Sunset',   filter:'brightness(1.05) saturate(1.4) hue-rotate(-15deg)', bg:'linear-gradient(135deg,#3d0a00,#8b2000)'},
  {id:'fresh',  name:'Fresh',    filter:'brightness(1.06) saturate(1.1) hue-rotate(10deg)',  bg:'linear-gradient(135deg,#002200,#004400)'}
];

function buildGradeGrid(){
  var grid=document.getElementById('gradeGrid');
  if(!grid) return;
  grid.innerHTML='';
  GRADES.forEach(function(g,gi){
    var btn=document.createElement('div');
    btn.className='grade-btn'+(gi===0?' active-grade':'');
    btn.style.background=g.bg;
    btn.textContent=g.name;
    btn.onclick=function(){
      activeGrade=g; customFilter='';
      ['slBright','slContrast','slSat'].forEach(function(id){var el=document.getElementById(id);if(el)el.value=100;});
      var sw=document.getElementById('slWarm'); if(sw) sw.value=0;
      document.getElementById('slBrightVal').textContent='100';
      document.getElementById('slContrastVal').textContent='100';
      document.getElementById('slSatVal').textContent='100';
      document.getElementById('slWarmVal').textContent='0';
      document.querySelectorAll('.grade-btn').forEach(function(b){b.classList.remove('active-grade');});
      btn.classList.add('active-grade');
      if(!isPlaying) drawFrame();
      toast('Grade: '+g.name);
    };
    grid.appendChild(btn);
  });
}

function updateGrade(){
  var br=document.getElementById('slBright').value;
  var co=document.getElementById('slContrast').value;
  var sa=document.getElementById('slSat').value;
  var wa=parseInt(document.getElementById('slWarm').value);
  document.getElementById('slBrightVal').textContent=br;
  document.getElementById('slContrastVal').textContent=co;
  document.getElementById('slSatVal').textContent=sa;
  document.getElementById('slWarmVal').textContent=wa;
  customFilter='brightness('+br/100+') contrast('+co/100+') saturate('+sa/100+')'+(wa?'  hue-rotate('+wa+'deg)':'');
  document.querySelectorAll('.grade-btn').forEach(function(b){b.classList.remove('active-grade');});
  if(!isPlaying) drawFrame();
}

function getCurrentFilter(){
  if(customFilter) return customFilter;
  if(activeGrade && activeGrade.filter!=='none') return activeGrade.filter;
  return activeStyle.grade||'none';
}

// ─────────────────────────────────────────────────────────────────
// TEXT OVERLAY
// ─────────────────────────────────────────────────────────────────
var TXT_STYLES=[
  {id:'white',   color:'#fff',    stroke:null,    font:'bold',  glow:false},
  {id:'orange',  color:'#ff5c1a', stroke:null,    font:'bold',  glow:false},
  {id:'gold',    color:'#f0c93a', stroke:null,    font:'bold',  glow:false},
  {id:'outline', color:'#fff',    stroke:'#000',  font:'900',   glow:false},
  {id:'neon',    color:'#00e5ff', stroke:null,    font:'bold',  glow:true}
];

function buildTxtStyles(){
  var row=document.getElementById('txtStyleRow');
  if(!row) return;
  row.innerHTML='';
  var labels=['White','Orange','Gold','Outline','Neon'];
  TXT_STYLES.forEach(function(ts,i){
    var b=document.createElement('button');
    b.className='txts-btn'+(i===0?' active':'');
    b.textContent=labels[i]; b.style.color=ts.color;
    b.onclick=function(){
      overlayTxtStyle=ts.id;
      document.querySelectorAll('.txts-btn').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      if(!isPlaying) drawFrame();
    };
    row.appendChild(b);
  });
  var inp=document.getElementById('overlayText');
  if(inp) inp.oninput=function(){overlayTextVal=this.value.trim();if(!isPlaying)drawFrame();};
}

function setTextPos(btn){
  overlayPos=btn.dataset.pos;
  document.querySelectorAll('.pos-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  if(!isPlaying) drawFrame();
}
function updateOverlayText(){
  document.getElementById('slTxtSizeVal').textContent=document.getElementById('slTxtSize').value;
  if(!isPlaying) drawFrame();
}
function clearOverlayText(){
  overlayTextVal='';
  var inp=document.getElementById('overlayText'); if(inp) inp.value='';
  if(!isPlaying) drawFrame();
}
function drawTextOverlay(ctx,W,H){
  if(!overlayTextVal) return;
  var size=parseInt(document.getElementById('slTxtSize').value)||36;
  var ts=TXT_STYLES.find(function(t){return t.id===overlayTxtStyle;})||TXT_STYLES[0];
  var y=overlayPos==='top'?H*0.12:overlayPos==='bot'?H*0.88:H*0.50;
  ctx.save();
  ctx.font=ts.font+' '+size+'px "DM Sans",sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.shadowColor=ts.glow?ts.color:'rgba(0,0,0,0.9)';
  ctx.shadowBlur=ts.glow?22:9;
  if(ts.stroke){ctx.strokeStyle=ts.stroke;ctx.lineWidth=size*0.12;ctx.lineJoin='round';ctx.strokeText(overlayTextVal,W/2,y);}
  ctx.fillStyle=ts.color; ctx.fillText(overlayTextVal,W/2,y);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
// MUSIC
// ─────────────────────────────────────────────────────────────────
var FREE_TRACKS=[
  {name:'Lo-Fi Chill',      vibe:'Calm · 90 BPM',     url:'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'},
  {name:'Epic Cinematic',   vibe:'Intense · 120 BPM',  url:'https://cdn.pixabay.com/audio/2022/03/15/audio_d75ef65dbc.mp3'},
  {name:'Upbeat Corporate', vibe:'Positive · 115 BPM', url:'https://cdn.pixabay.com/audio/2022/10/25/audio_946c1c7a09.mp3'},
  {name:'Acoustic Vibe',    vibe:'Warm · 85 BPM',      url:'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3'}
];

function buildMusicList(){
  var list=document.getElementById('musicList');
  if(!list) return;
  list.innerHTML='';
  FREE_TRACKS.forEach(function(t){
    var item=document.createElement('div');
    item.className='music-item';
    item.innerHTML=
      '<div class="mi-icon">♪</div>'
      +'<div class="mi-info"><div class="mi-name">'+t.name+'</div><div class="mi-meta">'+t.vibe+'</div></div>'
      +'<div class="mi-bars"><div class="mi-bar" style="height:4px"></div><div class="mi-bar" style="height:8px"></div><div class="mi-bar" style="height:4px"></div></div>';
    item.onclick=function(){
      if(activeMusicUrl===t.url){stopMusic();item.classList.remove('playing');}
      else{playMusic(t.url,item);}
    };
    list.appendChild(item);
  });
}

function playMusic(url,itemEl){
  stopMusic(); activeMusicUrl=url;
  musicAudio=new Audio(url); musicAudio.volume=musicVolume; musicAudio.loop=true;
  musicAudio.play().catch(function(){});
  document.querySelectorAll('.music-item').forEach(function(m){m.classList.remove('playing');});
  if(itemEl) itemEl.classList.add('playing');
  toast('🎵 Playing music');
}
function stopMusic(){
  if(musicAudio){musicAudio.pause();musicAudio.src='';musicAudio=null;}
  activeMusicUrl=null;
  document.querySelectorAll('.music-item').forEach(function(m){m.classList.remove('playing');});
}
function loadUserMusic(input){
  var f=input.files[0]; if(!f) return;
  var url=URL.createObjectURL(f);
  var ne=document.getElementById('userMusicName'); if(ne) ne.textContent='♪ '+f.name;
  playMusic(url,null); toast('🎵 Loaded: '+f.name);
}
function updateMusicVol(){
  var v=parseInt(document.getElementById('slMusicVol').value)/100;
  musicVolume=v;
  document.getElementById('slMusicVolVal').textContent=Math.round(v*100)+'%';
  if(musicAudio) musicAudio.volume=v;
}

// ─────────────────────────────────────────────────────────────────
// PLAYBACK + SEEK
// ─────────────────────────────────────────────────────────────────
function togglePlay(){
  if(!vid.src){toast('Load a video first');return;}
  if(vid.paused){
    vid.play(); isPlaying=true;
    document.getElementById('vbPlay').textContent='⏸';
    document.getElementById('bigPlay').textContent='⏸';
    document.getElementById('playTap').classList.add('on');
    rafId=requestAnimationFrame(drawFrame);
  } else {
    vid.pause(); isPlaying=false;
    document.getElementById('vbPlay').textContent='▶';
    document.getElementById('bigPlay').textContent='▶';
    document.getElementById('playTap').classList.remove('on');
    cancelAnimationFrame(rafId); drawFrame();
  }
}
function seekClick(e){
  var r=e.currentTarget.getBoundingClientRect();
  vid.currentTime=(e.clientX-r.left)/r.width*(vid.duration||0);
  if(!isPlaying) setTimeout(drawFrame,40);
}

// ─────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────
function setFmt(btn){
  document.querySelectorAll('.fmt').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active'); exportFmt=btn.dataset.f;
}
function doExport(){
  if(!vid.src){toast('No video loaded');return;}
  if(exportFmt==='reel'){cv.width=540;cv.height=960;}
  else if(exportFmt==='youtube'){cv.width=1280;cv.height=720;}
  else{cv.width=720;cv.height=720;}
  var ep=document.getElementById('expProg'), bar=document.getElementById('epFill'), lbl=document.getElementById('epLbl');
  ep.style.display='block'; document.getElementById('dlBtn').disabled=true;
  var stream=cv.captureStream(30);
  try{
    var ac=new(window.AudioContext||window.webkitAudioContext)();
    var src=ac.createMediaElementSource(vid), dest=ac.createMediaStreamDestination();
    src.connect(dest); src.connect(ac.destination);
    dest.stream.getAudioTracks().forEach(function(t){stream.addTrack(t);});
  }catch(e){}
  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .find(function(m){return MediaRecorder.isTypeSupported(m);})||'video/webm';
  var chunks=[], rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
  rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
  rec.onstop=function(){
    var blob=new Blob(chunks,{type:mime}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='impactgrid_'+activeStyle.id+'_'+exportFmt+'.webm';
    document.body.appendChild(a); a.click(); a.remove();
    bar.style.width='100%'; lbl.textContent='✓ Download started!';
    document.getElementById('dlBtn').disabled=false; toast('✓ Exported!');
    setTimeout(function(){ep.style.display='none';},4000);
  };
  vid.currentTime=0; isPlaying=true; vid.play(); rec.start(100);
  rafId=requestAnimationFrame(drawFrame);
  var dur=vid.duration*1000, t0=Date.now();
  var pi=setInterval(function(){
    var p=Math.min((Date.now()-t0)/dur*95,95);
    bar.style.width=p+'%'; lbl.textContent='Recording… '+Math.round(p)+'%';
  },300);
  vid.onended=function(){clearInterval(pi);isPlaying=false;rec.stop();};
}

// ─────────────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────────────
function switchTab(btn){
  var tabId=btn.dataset.tab;
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
  btn.classList.add('active');
  var el=document.getElementById(tabId); if(el) el.classList.add('active');
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
function groupLines(wordArr,n){
  var lines=[],cur=[];
  wordArr.forEach(function(w){cur.push(w);if(cur.length>=n){lines.push(cur.slice());cur=[];}});
  if(cur.length) lines.push(cur);
  return lines;
}
function measLineW(ctx,wordArr){
  return wordArr.reduce(function(a,w){return a+ctx.measureText(w.w||w).width+10;},0);
}
function rRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);}
  else{
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
  }
}
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el=document.getElementById(id); if(el){el.classList.add('active');window.scrollTo(0,0);}
}
function ft(s){
  if(!s||isNaN(s))return'0:00';
  var m=Math.floor(s/60),sec=Math.floor(s%60);
  return m+':'+(sec<10?'0':'')+sec;
}
function setStatus(icon,title,desc,pct){
  document.getElementById('procAnim').textContent=icon;
  document.getElementById('procTitle').textContent=title;
  document.getElementById('procDesc').textContent=desc;
  if(pct>=0)document.getElementById('progFill').style.width=pct+'%';
}
function log(msg){var el=document.getElementById('procLog');if(el)el.innerHTML+='<div>'+msg+'</div>';}
var _tt;
function toast(msg){
  var el=document.getElementById('toast');
  el.textContent=msg;el.className='toast show';
  clearTimeout(_tt);_tt=setTimeout(function(){el.className='toast';},4500);
}
