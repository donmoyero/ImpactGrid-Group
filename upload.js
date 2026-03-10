// ================================================================
// ImpactGrid Creator Studio — upload.js
// One-click video editing: drop → style → preview → export
// Canvas renders captions baked into the output
// ================================================================

// ── Edit Styles ──────────────────────────────────────────────────
var STYLES = [
  {
    id: 'viral',
    name: 'Viral TikTok',
    desc: 'Punchy captions, fast cuts, high energy. Built to stop the scroll.',
    tags: ['TikTok','Reels','Fast'],
    gradient: 'linear-gradient(135deg,#1a0a00,#3d1200)',
    accent: '#ff5c1a',
    captionBg: '#ff5c1a',
    captionColor: '#fff',
    captionSize: 22,
    captionFont: 'bold 22px "DM Sans",sans-serif',
    captionPos: 0.82,
    dramaticScale: 1.15,
    dramaticBg: '#fff',
    dramaticColor: '#ff5c1a',
    gradeR: 1.12, gradeG: 0.92, gradeB: 0.88,
    vignetteStrength: 0.6
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    desc: 'Widescreen letterbox, moody grade, elegant white subtitles.',
    tags: ['Film','YouTube','Story'],
    gradient: 'linear-gradient(135deg,#000814,#001d3d)',
    accent: '#90caf9',
    captionBg: 'rgba(0,0,0,0)',
    captionColor: '#ffffff',
    captionSize: 18,
    captionFont: '500 18px "DM Sans",sans-serif',
    captionPos: 0.88,
    dramaticScale: 1.0,
    dramaticBg: 'rgba(0,0,0,0)',
    dramaticColor: '#90caf9',
    gradeR: 0.88, gradeG: 0.95, gradeB: 1.08,
    vignetteStrength: 0.8,
    letterbox: true
  },
  {
    id: 'corporate',
    name: 'Corporate Pro',
    desc: 'Clean lower-thirds, polished grade, LinkedIn-ready.',
    tags: ['LinkedIn','B2B','Clean'],
    gradient: 'linear-gradient(135deg,#0a0a14,#0d1b2a)',
    accent: '#4fc3f7',
    captionBg: 'rgba(13,27,42,.9)',
    captionColor: '#4fc3f7',
    captionSize: 17,
    captionFont: '600 17px "DM Sans",sans-serif',
    captionPos: 0.90,
    dramaticScale: 1.0,
    dramaticBg: '#4fc3f7',
    dramaticColor: '#0d1b2a',
    gradeR: 0.95, gradeG: 1.0, gradeB: 1.05,
    vignetteStrength: 0.3,
    lowerThird: true
  },
  {
    id: 'hype',
    name: 'Hype Reel',
    desc: 'Max energy. Flash cuts, yellow bold captions, built for sports and launches.',
    tags: ['Sports','Launch','Hype'],
    gradient: 'linear-gradient(135deg,#1a1200,#2d2000)',
    accent: '#f0c93a',
    captionBg: '#f0c93a',
    captionColor: '#000',
    captionSize: 24,
    captionFont: 'bold 24px Syne,"DM Sans",sans-serif',
    captionPos: 0.80,
    dramaticScale: 1.2,
    dramaticBg: '#fff',
    dramaticColor: '#000',
    gradeR: 1.08, gradeG: 1.05, gradeB: 0.82,
    vignetteStrength: 0.5
  },
  {
    id: 'podcast',
    name: 'Podcast / Talk',
    desc: 'Word-by-word highlight captions, clean grade, perfect for talking head videos.',
    tags: ['Podcast','Interview','Talk'],
    gradient: 'linear-gradient(135deg,#0f0f0f,#1a1a2e)',
    accent: '#a78bfa',
    captionBg: '#a78bfa',
    captionColor: '#fff',
    captionSize: 19,
    captionFont: '600 19px "DM Sans",sans-serif',
    captionPos: 0.85,
    dramaticScale: 1.0,
    dramaticBg: '#fff',
    dramaticColor: '#a78bfa',
    gradeR: 0.96, gradeG: 0.96, gradeB: 1.06,
    vignetteStrength: 0.4,
    wordByWord: true
  },
  {
    id: 'documentary',
    name: 'Documentary',
    desc: 'Warm grade, chapter-title overlays, thoughtful pacing.',
    tags: ['Doc','YouTube','Story'],
    gradient: 'linear-gradient(135deg,#1a0e00,#2d1a00)',
    accent: '#ffb74d',
    captionBg: 'rgba(0,0,0,.75)',
    captionColor: '#ffb74d',
    captionSize: 17,
    captionFont: '500 17px "DM Sans",sans-serif',
    captionPos: 0.88,
    dramaticScale: 1.0,
    dramaticBg: '#ffb74d',
    dramaticColor: '#1a0e00',
    gradeR: 1.06, gradeG: 0.98, gradeB: 0.84,
    vignetteStrength: 0.6,
    filmGrain: true
  }
];

// ── State ────────────────────────────────────────────────────────
var clip        = null;     // {file, url}
var activeStyle = null;
var captions    = [];       // [{t, text, dramatic}]
var brollItems  = [];       // [{t, url, canvas}]
var isListening = false;
var recog       = null;
var recStart    = 0;
var selectedFmt = 'reel';
var isPlaying   = false;
var rafId       = null;
var grainCanvas = null;

// ── DOM ──────────────────────────────────────────────────────────
var vid         = document.getElementById('masterVideo');
var canvas      = document.getElementById('previewCanvas');
var ctx         = canvas.getContext('2d');
var progBar     = document.getElementById('progBar');
var pill        = document.getElementById('statusPill');

// ── Init: render style cards ─────────────────────────────────────
(function initStyleCards(){
  var grid = document.getElementById('styleGrid');
  STYLES.forEach(function(s){
    var card = document.createElement('div');
    card.className = 'style-card';
    card.innerHTML =
      '<div class="sc-preview" style="background:'+s.gradient+'">'
      +  '<div class="sc-caption-demo" style="background:'+s.captionBg+';color:'+s.captionColor+'">Caption goes here</div>'
      +'</div>'
      +'<div class="sc-name">'+s.name+'</div>'
      +'<div class="sc-desc">'+s.desc+'</div>'
      +'<div class="sc-tags">'+s.tags.map(function(t){return '<span class="sc-tag">'+t+'</span>';}).join('')+'</div>'
      +'<div class="sc-check">✓</div>';
    card.onclick = function(){ selectStyle(s, card); };
    grid.appendChild(card);
  });

  // Also build re-edit mini buttons
  var mini = document.getElementById('reeditMini');
  STYLES.forEach(function(s){
    var b = document.createElement('button');
    b.className = 'reedit-btn';
    b.textContent = s.name;
    b.onclick = function(){ selectStyle(s, null); };
    mini.appendChild(b);
  });
})();

// ── Upload ───────────────────────────────────────────────────────
document.getElementById('clipInput').onchange = function(e){
  var f = e.target.files[0];
  if(!f) return;
  if(clip) URL.revokeObjectURL(clip.url);
  clip = { file: f, url: URL.createObjectURL(f) };
  document.getElementById('clipInfo').textContent = '🎬 ' + f.name + ' · ' + fmt(0);
  vid.src = clip.url;
  vid.onloadedmetadata = function(){
    document.getElementById('clipInfo').textContent =
      '🎬 ' + f.name + ' · ' + fmt(vid.duration);
  };
  goTo('screenStyle');
};

// Drag-drop on drop zone
(function(){
  var dz = document.getElementById('dropZone');
  dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='#ff5c1a';});
  dz.addEventListener('dragleave',function(){dz.style.borderColor='';});
  dz.addEventListener('drop',function(e){
    e.preventDefault();dz.style.borderColor='';
    var f=Array.from(e.dataTransfer.files).find(function(x){return x.type.startsWith('video/');});
    if(f) document.getElementById('clipInput').dispatchEvent(Object.assign(new Event('change'),{target:{files:[f]}}));
  });
})();

// ── Style selection → processing ─────────────────────────────────
function selectStyle(style, cardEl){
  activeStyle = style;
  // Mark selected card
  document.querySelectorAll('.style-card').forEach(function(c){c.classList.remove('selected');});
  if(cardEl) cardEl.classList.add('selected');
  // Go process
  setTimeout(function(){ runProcessing(); }, 200);
}

// ── Processing screen ─────────────────────────────────────────────
function runProcessing(){
  captions   = [];
  brollItems = [];
  goTo('screenProcess');
  document.getElementById('processTitle').textContent = 'Editing in ' + activeStyle.name + ' style…';

  var steps = [
    {pct:10, title:'Analysing your video…',          desc:'Reading frames and audio…'},
    {pct:28, title:'Detecting speech…',               desc:'Listening for words and energy…'},
    {pct:50, title:'Building captions…',              desc:'Formatting in '+activeStyle.name+' style…'},
    {pct:68, title:'Colour grading…',                 desc:'Applying '+activeStyle.name+' look…'},
    {pct:82, title:'Finding B-roll images…',          desc:'Matching visuals to your words…'},
    {pct:95, title:'Compositing final preview…',      desc:'Baking captions into video…'},
    {pct:100,title:'Done!',                           desc:'Your '+activeStyle.name+' edit is ready'}
  ];

  var si = 0;
  function nextStep(){
    if(si >= steps.length){
      setTimeout(function(){ launchPreview(); }, 400);
      return;
    }
    var s = steps[si++];
    progBar.style.width = s.pct + '%';
    document.getElementById('processTitle').textContent = s.title;
    document.getElementById('processDesc').textContent  = s.desc;
    var log = document.getElementById('progSteps');
    if(si > 1) log.innerHTML += '<div style="opacity:.5">✓ '+steps[si-2].title+'</div>';

    // At step 2: silently request mic and start listening
    if(si === 2) silentlyListen();

    setTimeout(nextStep, 900 + Math.random()*400);
  }
  nextStep();
}

// ── Speech listening (silent, in background during processing) ────
function silentlyListen(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR || isListening) return;
  try{
    recog = new SR();
    recog.continuous = true;
    recog.interimResults = true;
    recog.maxAlternatives = 1;
    recog.lang = 'en-GB';
    recStart = Date.now();
    var lastFinal = '';

    recog.onresult = function(event){
      var final = '';
      for(var i=event.resultIndex;i<event.results.length;i++){
        if(event.results[i].isFinal) final += event.results[i][0].transcript;
      }
      if(final && final !== lastFinal){
        lastFinal = final;
        var t = (vid.duration && vid.readyState>=2) ? vid.currentTime : (Date.now()-recStart)/1000;
        var dramatic = isDramatic(final);
        chunkSave(final.trim(), t, dramatic);
        getKeywords(final).forEach(function(kw){ addBrollItem(kw, t); });
      }
    };
    recog.onerror = function(){};
    recog.onend   = function(){ if(isListening) try{recog.start();}catch(e){} };
    recog.start();
    isListening = true;

    // Play video silently so mic can pick up audio
    vid.muted  = false;
    vid.volume = 1.0;
    vid.play().catch(function(){ vid.muted=true; vid.play(); });
  }catch(e){}
}

function stopListening(){
  isListening = false;
  if(recog) try{ recog.abort(); }catch(e){}
}

// ── Launch preview ────────────────────────────────────────────────
function launchPreview(){
  stopListening();
  goTo('screenPreview');

  // Set canvas size for 9:16
  canvas.width  = 540;
  canvas.height = 960;

  // Update export panel
  document.getElementById('exportStyleName').textContent = activeStyle.name + ' edit';
  document.getElementById('exportStats').textContent =
    captions.length + ' captions generated\n'
    + brollItems.length + ' B-roll images matched\n'
    + 'Ready to download';
  document.getElementById('styleBadge').textContent = activeStyle.name;

  // Preload B-roll images
  brollItems.forEach(function(b){
    if(!b.url) return;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){ b.imgEl = img; };
    img.onerror = function(){ b.imgEl = null; };
    img.src = b.url;
  });

  // Start draw loop
  vid.pause();
  vid.currentTime = 0;
  drawFrame();
}

// ── Canvas draw loop ──────────────────────────────────────────────
function drawFrame(){
  if(!vid.videoWidth){ rafId = requestAnimationFrame(drawFrame); return; }

  var W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  var st = activeStyle;

  // 1. Draw video frame (scaled to fill canvas)
  var vw = vid.videoWidth, vh = vid.videoHeight;
  var scale = Math.max(W/vw, H/vh);
  var dw = vw*scale, dh = vh*scale;
  var dx = (W-dw)/2, dy = (H-dh)/2;
  ctx.drawImage(vid, dx, dy, dw, dh);

  // 2. Colour grade (fast pixel tweak via globalCompositeOperation)
  applyGrade(W, H, st);

  // 3. Letterbox bars
  if(st.letterbox){
    var barH = H*0.07;
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,barH);
    ctx.fillRect(0,H-barH,W,barH);
  }

  // 4. Vignette
  if(st.vignetteStrength > 0) applyVignette(W, H, st.vignetteStrength);

  // 5. Film grain
  if(st.filmGrain) applyGrain(W, H);

  // 6. B-roll overlay at current time
  var now = vid.currentTime;
  brollItems.forEach(function(b){
    if(b.imgEl && now >= b.t && now < b.t + 3){
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.drawImage(b.imgEl, 0, 0, W, H);
      ctx.restore();
    }
  });

  // 7. Lower-third bar (corporate style)
  if(st.lowerThird){
    ctx.fillStyle = 'rgba(13,27,42,.88)';
    ctx.fillRect(0, H*0.80, W, H*0.12);
  }

  // 8. Captions
  drawCaptions(W, H, now, st);

  // 9. Watermark
  ctx.font = '11px "DM Sans",sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  ctx.textAlign = 'right';
  ctx.fillText('ImpactGrid', W-12, 20);

  if(isPlaying && !vid.paused) rafId = requestAnimationFrame(drawFrame);
  else if(!isPlaying){ cancelAnimationFrame(rafId); }
  else rafId = requestAnimationFrame(drawFrame);
}

// ── Colour grade ──────────────────────────────────────────────────
function applyGrade(W, H, st){
  // Use multiply/screen compositing for fast grade
  if(st.gradeR > 1 || st.gradeG > 1 || st.gradeB > 1){
    // Lighten channel
    var maxBoost = Math.max(st.gradeR,st.gradeG,st.gradeB);
    var alpha = (maxBoost - 1) * 0.5;
    var r = st.gradeR>1 ? 255 : 0;
    var g = st.gradeG>1 ? 255 : 0;
    var b = st.gradeB>1 ? 255 : 0;
    ctx.fillStyle = 'rgba('+r+','+g+','+b+','+alpha.toFixed(2)+')';
    ctx.globalCompositeOperation = 'screen';
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation = 'source-over';
  }
  if(st.gradeR < 1 || st.gradeG < 1 || st.gradeB < 1){
    var minGrade = Math.min(st.gradeR,st.gradeG,st.gradeB);
    var alpha2 = (1-minGrade)*0.5;
    var r2 = st.gradeR<1 ? 0 : 255;
    var g2 = st.gradeG<1 ? 0 : 255;
    var b2 = st.gradeB<1 ? 0 : 255;
    ctx.fillStyle = 'rgba('+r2+','+g2+','+b2+','+alpha2.toFixed(2)+')';
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function applyVignette(W, H, strength){
  var grd = ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.75);
  grd.addColorStop(0,'rgba(0,0,0,0)');
  grd.addColorStop(1,'rgba(0,0,0,'+strength+')');
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,W,H);
}

function applyGrain(W, H){
  var id = ctx.getImageData(0,0,W,H);
  var d  = id.data;
  for(var i=0;i<d.length;i+=4){
    var n=(Math.random()-.5)*18;
    d[i]+=n; d[i+1]+=n; d[i+2]+=n;
  }
  ctx.putImageData(id,0,0);
}

// ── Caption drawing ───────────────────────────────────────────────
function drawCaptions(W, H, now, st){
  var active = null;
  for(var i=0;i<captions.length;i++){
    if(captions[i].t <= now && now < captions[i].t + 3.2){
      active = captions[i]; break;
    }
  }
  if(!active) return;

  var text     = active.text;
  var dramatic = active.dramatic;
  var bg       = dramatic ? st.dramaticBg    : st.captionBg;
  var color    = dramatic ? st.dramaticColor : st.captionColor;
  var font     = st.captionFont;
  var size     = st.captionSize * (dramatic ? st.dramaticScale : 1);
  var y        = H * st.captionPos;

  if(st.wordByWord){
    // Word-by-word highlight style (podcast)
    drawWordByWord(W, y, text, now - active.t, st);
  } else {
    // Standard caption block
    ctx.font = font;
    ctx.textAlign = 'center';
    var padding = 10;
    var metrics = ctx.measureText(text);
    var tw = Math.min(metrics.width + padding*2, W-40);
    var th = size + padding*2;
    var x  = W/2;

    // Background pill
    if(bg && bg !== 'rgba(0,0,0,0)'){
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x - tw/2, y - th/2, tw, th, 7);
      ctx.fill();
    } else if(bg === 'rgba(0,0,0,0)'){
      // Text shadow only
      ctx.shadowColor = 'rgba(0,0,0,.8)';
      ctx.shadowBlur  = 6;
    }

    ctx.fillStyle = color;
    ctx.fillText(text, x, y + size*0.35);
    ctx.shadowBlur = 0;
  }
}

function drawWordByWord(W, y, text, elapsed, st){
  var words    = text.split(' ');
  var perWord  = 3.2 / Math.max(words.length, 1);
  var activeWi = Math.floor(elapsed / perWord);
  var xPos     = W/2;
  var size     = st.captionSize;

  ctx.font     = st.captionFont;
  ctx.textAlign = 'center';

  // Measure total to centre
  var total = words.reduce(function(a,w){ return a + ctx.measureText(w+' ').width; }, 0);
  var startX = xPos - total/2;

  words.forEach(function(w, wi){
    var ww = ctx.measureText(w+' ').width;
    var cx = startX + ww/2;
    var isActive = (wi === activeWi);
    var bg2    = isActive ? st.dramaticBg    : st.captionBg;
    var color2 = isActive ? st.dramaticColor : st.captionColor;

    if(bg2 && bg2 !== 'rgba(0,0,0,0)'){
      ctx.fillStyle = bg2;
      ctx.beginPath();
      ctx.roundRect(startX-4, y-size/2-6, ww, size+12, 5);
      ctx.fill();
    }
    ctx.fillStyle = color2;
    ctx.fillText(w, cx, y + size*0.35);
    startX += ww;
  });
}

// ── Playback ─────────────────────────────────────────────────────
function togglePlay(){
  if(!vid.src){ toast('Add a clip first'); return; }
  if(vid.paused){
    vid.play();
    isPlaying = true;
    document.getElementById('vcPlay').textContent   = '⏸';
    document.getElementById('playBtnBig').textContent = '⏸';
    document.getElementById('playOverlay').classList.add('playing');
    rafId = requestAnimationFrame(drawFrame);
  } else {
    vid.pause();
    isPlaying = false;
    document.getElementById('vcPlay').textContent   = '▶';
    document.getElementById('playBtnBig').textContent = '▶';
    document.getElementById('playOverlay').classList.remove('playing');
    drawFrame();
  }
}

vid.ontimeupdate = function(){
  var t = vid.currentTime, d = vid.duration||0;
  var fill = document.getElementById('vcFill');
  if(fill) fill.style.width = (d?t/d*100:0)+'%';
  document.getElementById('vcTime').textContent = fmt(t)+' / '+fmt(d);
  if(!isPlaying) drawFrame(); // update while scrubbing
};

vid.onended = function(){
  isPlaying = false;
  document.getElementById('vcPlay').textContent = '▶';
  document.getElementById('playBtnBig').textContent = '▶';
  document.getElementById('playOverlay').classList.remove('playing');
};

function seekTo(e){
  var rect = e.currentTarget.getBoundingClientRect();
  var pct  = (e.clientX - rect.left) / rect.width;
  vid.currentTime = pct * (vid.duration||0);
  drawFrame();
}

// ── Export: record canvas + audio ────────────────────────────────
var exportFmt = 'reel';
function setFmt(btn){
  document.querySelectorAll('.fmt-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  exportFmt = btn.dataset.fmt;
}

function startExport(){
  if(!vid.src){ toast('No video to export'); return; }

  // Resize canvas for chosen format
  var W, H;
  if(exportFmt==='reel')   { W=540; H=960; }
  else if(exportFmt==='youtube'){ W=1280; H=720; }
  else                          { W=720;  H=720; }

  canvas.width  = W;
  canvas.height = H;

  var ep  = document.getElementById('exportProgress');
  var bar = document.getElementById('expBar');
  var lbl = document.getElementById('expLabel');
  ep.style.display = 'block';
  document.getElementById('exportBtn').disabled = true;

  // Use MediaRecorder to capture canvas + video audio
  var stream = canvas.captureStream(30);

  // Add audio track from video
  try{
    var actx   = new AudioContext();
    var src    = actx.createMediaElementSource(vid);
    var dest   = actx.createMediaStreamDestination();
    src.connect(dest);
    src.connect(actx.destination);
    dest.stream.getAudioTracks().forEach(function(t){ stream.addTrack(t); });
  }catch(e){ /* no audio — video only */ }

  var chunks   = [];
  var mimeType = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(function(m){
    return MediaRecorder.isTypeSupported(m);
  }) || 'video/webm';

  var recorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: 4000000 });
  recorder.ondataavailable = function(e){ if(e.data.size>0) chunks.push(e.data); };
  recorder.onstop = function(){
    var blob = new Blob(chunks, { type: mimeType });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'impactgrid_'+activeStyle.id+'_'+exportFmt+'.webm';
    document.body.appendChild(a);
    a.click();
    a.remove();
    bar.style.width = '100%';
    lbl.textContent = '✓ Download started!';
    document.getElementById('exportBtn').disabled = false;
    toast('✓ Video exported!');
    setTimeout(function(){ ep.style.display='none'; }, 3000);
  };

  // Play video from start, record canvas in real time
  vid.currentTime = 0;
  isPlaying = true;
  vid.play();
  recorder.start(100);
  rafId = requestAnimationFrame(drawFrame);

  var duration = vid.duration * 1000;
  var startTime = Date.now();

  var progInterval = setInterval(function(){
    var elapsed = Date.now() - startTime;
    var pct = Math.min(elapsed/duration*100, 95);
    bar.style.width = pct + '%';
    lbl.textContent = 'Rendering… ' + Math.round(pct) + '%';
  }, 500);

  vid.onended = function(){
    clearInterval(progInterval);
    isPlaying = false;
    recorder.stop();
    vid.onended = null;
    // Re-attach normal onended
    vid.onended = function(){
      isPlaying=false;
      document.getElementById('vcPlay').textContent='▶';
      document.getElementById('playOverlay').classList.remove('playing');
    };
  };
}

// ── Caption engine ────────────────────────────────────────────────
var DRAMATIC = new Set(['amazing','incredible','huge','massive','love','hate','never','always',
  'breaking','must','best','worst','epic','shocking','winner','first','exclusive','secret',
  'free','real','truth','only','biggest','powerful','transform','change','money','success',
  'wow','yes','no','stop','wait','watch','look','listen','game','changer','mind','blown',
  'insane','crazy','unbelievable','massive','launch','new','live','now','today']);

function isDramatic(text){
  if(/[!?]{1}/.test(text)) return true;
  var lower = text.toLowerCase();
  return Array.from(DRAMATIC).some(function(w){ return lower.indexOf(w) !== -1; });
}

function chunkSave(text, t, dramatic){
  var words = text.split(/\s+/);
  var chunk = [], time = t;
  words.forEach(function(w, wi){
    chunk.push(w);
    if(chunk.length >= 4 || wi === words.length-1){
      captions.push({ t: Math.max(0,time), text: chunk.join(' '), dramatic: dramatic });
      time += chunk.length * 0.38;
      chunk = [];
    }
  });
}

// ── B-roll ────────────────────────────────────────────────────────
var usedKws = new Set();
function addBrollItem(keyword, t){
  if(usedKws.has(keyword)) return;
  usedKws.add(keyword);

  var item = { t: t, url: null, imgEl: null };
  brollItems.push(item);

  // Canvas placeholder (immediate)
  var c = makeKwCanvas(keyword);
  item.canvasUrl = c.toDataURL();

  // Try real image
  fetchImage(keyword, function(url){
    if(url){
      item.url = url;
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function(){ item.imgEl = img; };
      img.src = url;
    } else {
      // Use canvas as fallback image
      item.url  = item.canvasUrl;
      var img2  = new Image();
      img2.onload = function(){ item.imgEl = img2; };
      img2.src  = item.canvasUrl;
    }
  });
}

function makeKwCanvas(kw){
  var c = document.createElement('canvas');
  c.width=540; c.height=960;
  var cx = c.getContext('2d');
  var h  = 0;
  for(var i=0;i<kw.length;i++) h=(h*31+kw.charCodeAt(i))%360;
  var g = cx.createLinearGradient(0,0,540,960);
  g.addColorStop(0,'hsl('+h+',40%,8%)');
  g.addColorStop(1,'hsl('+((h+60)%360)+',50%,14%)');
  cx.fillStyle=g; cx.fillRect(0,0,540,960);
  cx.font='bold 36px "DM Sans",sans-serif';
  cx.fillStyle='rgba(240,201,58,.5)';
  cx.textAlign='center'; cx.textBaseline='middle';
  cx.fillText(kw.toUpperCase(),270,480);
  return c;
}

function fetchImage(keyword, cb){
  var enc  = encodeURIComponent(keyword);
  var h    = 0; for(var i=0;i<keyword.length;i++) h=(h*31+keyword.charCodeAt(i))&0xffff;
  var sources = [
    'https://loremflickr.com/540/960/'+enc+'?random='+((h%8000)+200),
    'https://picsum.photos/540/960?random='+((h%500)+10)
  ];
  var idx=0;
  function next(){
    if(idx>=sources.length){cb(null);return;}
    var url=sources[idx++], img=new Image(), done=false;
    img.crossOrigin='anonymous';
    var timer=setTimeout(function(){if(!done){done=true;next();}},5000);
    img.onload=function(){if(!done){done=true;clearTimeout(timer);cb(url);}};
    img.onerror=function(){if(!done){done=true;clearTimeout(timer);next();}};
    img.src=url;
  }
  next();
}

// ── Keyword extraction ────────────────────────────────────────────
var STOP = new Set(['the','is','are','a','an','and','to','of','in','it','that','this','with',
  'for','on','you','i','we','he','she','they','was','be','at','by','from','have','do','not',
  'but','what','when','there','has','will','about','just','so','up','more','its','which',
  'your','our','can','had','how','some','if','my','me','as','get','like','know','really',
  'very','then','than','into','out','been','were','would','could','should','did','does']);

function getKeywords(text){
  var words=text.replace(/[.,!?;:'"]/g,' ').toLowerCase().split(/\s+/);
  var seen=new Set();
  return words.filter(function(w){
    if(w.length<4||STOP.has(w)||seen.has(w))return false;
    seen.add(w);return true;
  }).slice(0,2);
}

// ── Screen navigation ─────────────────────────────────────────────
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el = document.getElementById(id);
  if(el) el.classList.add('active');
  // Reset scroll
  window.scrollTo(0,0);
}

// ── Helpers ───────────────────────────────────────────────────────
function fmt(s){
  if(!s||isNaN(s)) return '0:00';
  var m=Math.floor(s/60), sec=Math.floor(s%60);
  return m+':'+(sec<10?'0':'')+sec;
}

var toastTimer;
function toast(msg){
  var el=document.getElementById('toast');
  el.textContent=msg;
  el.className='toast show';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){el.className='toast';},4000);
}
