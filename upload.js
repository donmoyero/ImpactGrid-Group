// ================================================================
// ImpactGrid Creator Studio
// Drop video → pick style → listens to FULL video → preview + export
// ================================================================

// ── Styles ───────────────────────────────────────────────────────
var STYLES = [
  {
    id:'viral', name:'Viral TikTok',
    desc:'Punchy orange pills, warm grade. Built to stop the scroll.',
    tags:['TikTok','Reels','Fast'],
    gradient:'linear-gradient(135deg,#2a0800,#1a0500)',
    captionBg:'#ff5c1a', captionColor:'#fff', captionSize:22,
    captionY:0.82, dramaticBg:'#fff', dramaticColor:'#ff5c1a',
    gradeFilter:'brightness(1.08) saturate(1.2) contrast(1.05)',
    vignette:0.55, letterbox:false, wordByWord:false, grain:false
  },
  {
    id:'cinematic', name:'Cinematic',
    desc:'Letterbox bars, cool blue grade, elegant white subtitles.',
    tags:['Film','YouTube','Story'],
    gradient:'linear-gradient(135deg,#000814,#001233)',
    captionBg:'transparent', captionColor:'#fff', captionSize:19,
    captionY:0.87, dramaticBg:'transparent', dramaticColor:'#90caf9',
    gradeFilter:'brightness(0.92) saturate(0.85) hue-rotate(5deg)',
    vignette:0.75, letterbox:true, wordByWord:false, grain:false
  },
  {
    id:'corporate', name:'Corporate Pro',
    desc:'Lower-third bars, clean grade, LinkedIn-ready polish.',
    tags:['LinkedIn','B2B','Clean'],
    gradient:'linear-gradient(135deg,#040a14,#0d1b2a)',
    captionBg:'rgba(10,20,40,0.88)', captionColor:'#4fc3f7', captionSize:17,
    captionY:0.88, dramaticBg:'#4fc3f7', dramaticColor:'#040a14',
    gradeFilter:'brightness(1.0) saturate(0.9) contrast(1.02)',
    vignette:0.3, letterbox:false, wordByWord:false, grain:false, lowerThird:true
  },
  {
    id:'hype', name:'Hype Reel',
    desc:'Yellow bold captions, gold grade. For sports and launches.',
    tags:['Sports','Launch','Energy'],
    gradient:'linear-gradient(135deg,#1a1200,#0a0800)',
    captionBg:'#f0c93a', captionColor:'#000', captionSize:26,
    captionY:0.80, dramaticBg:'#fff', dramaticColor:'#000',
    gradeFilter:'brightness(1.1) saturate(1.3) contrast(1.08)',
    vignette:0.45, letterbox:false, wordByWord:false, grain:false
  },
  {
    id:'podcast', name:'Podcast / Talk',
    desc:'Word-by-word highlight. Each word lights up as it\'s spoken.',
    tags:['Podcast','Interview','Talk'],
    gradient:'linear-gradient(135deg,#0d0d1a,#1a1a2e)',
    captionBg:'rgba(167,139,250,0.2)', captionColor:'#ccc', captionSize:20,
    captionY:0.84, dramaticBg:'#a78bfa', dramaticColor:'#fff',
    gradeFilter:'brightness(0.98) saturate(0.92)',
    vignette:0.4, letterbox:false, wordByWord:true, grain:false
  },
  {
    id:'documentary', name:'Documentary',
    desc:'Warm sepia grade, film grain, chapter-style captions.',
    tags:['Doc','YouTube','Warm'],
    gradient:'linear-gradient(135deg,#1a0e00,#120a00)',
    captionBg:'rgba(0,0,0,0.78)', captionColor:'#ffb74d', captionSize:17,
    captionY:0.88, dramaticBg:'#ffb74d', dramaticColor:'#1a0e00',
    gradeFilter:'brightness(1.02) saturate(0.75) sepia(0.25)',
    vignette:0.65, letterbox:false, wordByWord:false, grain:true
  }
];

// ── State ────────────────────────────────────────────────────────
var clip        = null;
var activeStyle = null;
var captions    = [];
var brollItems  = [];
var recog       = null;
var isListening = false;
var listenStart = 0;
var isPlaying   = false;
var rafId       = null;
var exportFmt   = 'reel';

// ── DOM ──────────────────────────────────────────────────────────
var vid    = document.getElementById('masterVideo');
var canvas = document.getElementById('previewCanvas');
var ctx    = canvas.getContext('2d');
var progBar= document.getElementById('progBar');

// ── Style cards ──────────────────────────────────────────────────
(function buildStyleCards(){
  var grid = document.getElementById('styleGrid');
  var mini = document.getElementById('reeditMini');
  STYLES.forEach(function(s){
    // Main card
    var card = document.createElement('div');
    card.className = 'style-card';
    card.innerHTML =
      '<div class="sc-preview" style="background:'+s.gradient+';position:relative">'
        +'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">'
          +'<span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:5px;'
          +'background:'+s.captionBg+';color:'+s.captionColor+'">Caption goes here</span>'
        +'</div>'
      +'</div>'
      +'<div class="sc-name">'+s.name+'</div>'
      +'<div class="sc-desc">'+s.desc+'</div>'
      +'<div class="sc-tags">'+s.tags.map(function(t){return '<span class="sc-tag">'+t+'</span>';}).join('')+'</div>'
      +'<div class="sc-check">✓</div>';
    card.onclick = function(){
      document.querySelectorAll('.style-card').forEach(function(c){c.classList.remove('selected');});
      card.classList.add('selected');
      activeStyle = s;
      setTimeout(startProcessing, 300);
    };
    grid.appendChild(card);

    // Mini re-edit button
    var b = document.createElement('button');
    b.className = 'reedit-btn';
    b.textContent = s.name;
    b.onclick = function(){
      activeStyle = s;
      document.getElementById('exportStyleName').textContent = s.name+' edit';
      document.getElementById('styleBadge').textContent = s.name;
      applyStyleToCanvas();
      toast('Style changed to '+s.name);
    };
    mini.appendChild(b);
  });
})();

// ── Upload ───────────────────────────────────────────────────────
document.getElementById('clipInput').onchange = function(e){
  var f = e.target.files[0];
  if(!f) return;
  if(clip) URL.revokeObjectURL(clip.url);
  clip = {file:f, url:URL.createObjectURL(f)};
  vid.src = clip.url;
  vid.onloadedmetadata = function(){
    document.getElementById('clipInfo').textContent =
      '🎬 '+f.name+' · '+fmtTime(vid.duration);
  };
  goTo('screenStyle');
};

(function(){
  var dz = document.getElementById('dropZone');
  ['dragover','dragenter'].forEach(function(ev){
    dz.addEventListener(ev,function(e){e.preventDefault();dz.style.borderColor='#ff5c1a';});
  });
  dz.addEventListener('dragleave',function(){dz.style.borderColor='';});
  dz.addEventListener('drop',function(e){
    e.preventDefault(); dz.style.borderColor='';
    var f = Array.from(e.dataTransfer.files).find(function(x){return x.type.startsWith('video/');});
    if(!f) return;
    if(clip) URL.revokeObjectURL(clip.url);
    clip = {file:f, url:URL.createObjectURL(f)};
    vid.src = clip.url;
    vid.onloadedmetadata = function(){
      document.getElementById('clipInfo').textContent = '🎬 '+f.name+' · '+fmtTime(vid.duration);
    };
    goTo('screenStyle');
  });
})();

// ── Processing: listen to FULL video then show preview ────────────
function startProcessing(){
  captions   = [];
  brollItems = [];
  var usedKws = new Set();
  goTo('screenProcess');

  var st = activeStyle;
  document.getElementById('processTitle').textContent = 'Applying '+st.name+' style…';
  document.getElementById('processDesc').textContent  = 'Playing your video and detecting speech — this takes the full video length';

  // Steps shown during listening
  var displaySteps = [
    'Reading video…',
    'Detecting speech & writing captions…',
    'Extracting keywords for B-roll…',
    'Applying '+st.name+' colour grade…',
    'Compositing captions…',
    'Finalising your edit…'
  ];
  var stepLog = document.getElementById('progSteps');
  var si = 0;
  var stepTimer = setInterval(function(){
    if(si < displaySteps.length){
      stepLog.innerHTML += '<div>⚡ '+displaySteps[si]+'</div>';
      si++;
    }
  }, 2000);

  // ── Start speech recognition ──────────────────────────────────
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(SR){
    recog = new SR();
    recog.continuous      = true;
    recog.interimResults  = true;
    recog.maxAlternatives = 1;
    recog.lang            = 'en-GB';
    listenStart           = Date.now();
    var lastFinal         = '';

    recog.onresult = function(event){
      var final = '', interim = '';
      for(var i=event.resultIndex;i<event.results.length;i++){
        if(event.results[i].isFinal) final  += event.results[i][0].transcript;
        else                          interim += event.results[i][0].transcript;
      }
      // Show live in process screen
      if(interim || final){
        document.getElementById('processDesc').textContent =
          '"'+(final||interim).trim()+'"';
      }
      if(final && final.trim() !== lastFinal.trim()){
        lastFinal = final.trim();
        var t   = vid.readyState>=2 ? vid.currentTime : (Date.now()-listenStart)/1000;
        var drm = isDramatic(final);
        chunkSave(final.trim(), t, drm);
        getKeywords(final).forEach(function(kw){
          if(!usedKws.has(kw)){
            usedKws.add(kw);
            var item = {t:t, url:null, imgEl:null, keyword:kw};
            brollItems.push(item);
            fetchImage(kw, function(url){
              if(url){
                item.url = url;
                var img = new Image();
                img.crossOrigin='anonymous';
                img.onload = function(){ item.imgEl=img; };
                img.src = url;
              }
            });
          }
        });
      }
    };

    recog.onerror = function(e){
      if(e.error==='not-allowed'){
        document.getElementById('processDesc').textContent =
          '⚠ Mic blocked — captions need mic permission. Allow in browser address bar.';
      }
    };

    // Chrome stops after ~60s silence — keep restarting
    recog.onend = function(){
      if(isListening) try{recog.start();}catch(e){}
    };

    try{
      recog.start();
      isListening = true;
    }catch(e){}
  } else {
    document.getElementById('processDesc').textContent =
      '⚠ Auto-captions need Chrome or Edge. You can still preview and export.';
  }

  // ── Play video WITH AUDIO so mic picks it up ─────────────────
  vid.muted  = false;
  vid.volume = 1.0;
  vid.currentTime = 0;
  vid.play().catch(function(){
    vid.muted = true;
    vid.play();
  });

  // ── Update progress bar in real time as video plays ──────────
  vid.ontimeupdate = function(){
    if(!vid.duration) return;
    var pct = (vid.currentTime/vid.duration)*100;
    progBar.style.width = pct+'%';
    document.getElementById('processTitle').textContent =
      fmtTime(vid.currentTime)+' / '+fmtTime(vid.duration)+' — listening…';
  };

  // ── When video ends → stop listening → show preview ──────────
  vid.onended = function(){
    clearInterval(stepTimer);
    isListening = false;
    if(recog) try{recog.abort();}catch(e){}
    vid.onended   = null;
    vid.ontimeupdate = null;

    progBar.style.width = '100%';
    document.getElementById('processTitle').textContent = 'Edit complete!';
    document.getElementById('processDesc').textContent  =
      captions.length+' captions captured · '+brollItems.length+' B-roll images';

    // Brief pause then show preview
    setTimeout(launchPreview, 800);
  };
}

// ── Launch preview ────────────────────────────────────────────────
function launchPreview(){
  goTo('screenPreview');
  canvas.width  = 540;
  canvas.height = 960;

  var st = activeStyle;
  document.getElementById('exportStyleName').textContent = st.name+' edit';
  document.getElementById('styleBadge').textContent = st.name;
  document.getElementById('exportStats').innerHTML =
    captions.length+' captions &nbsp;·&nbsp; '+
    brollItems.length+' B-roll images &nbsp;·&nbsp; '+
    st.name+' grade applied';

  vid.pause();
  vid.currentTime = 0;

  // Reset video event handlers for preview mode
  vid.ontimeupdate = function(){
    var t=vid.currentTime, d=vid.duration||1;
    var fill=document.getElementById('vcFill');
    if(fill) fill.style.width=(t/d*100)+'%';
    document.getElementById('vcTime').textContent=fmtTime(t)+' / '+fmtTime(d);
  };
  vid.onended = function(){
    isPlaying=false;
    document.getElementById('vcPlay').textContent='▶';
    document.getElementById('playOverlay').classList.remove('playing');
    cancelAnimationFrame(rafId);
  };

  // Draw first frame
  vid.onseeked = function(){ drawFrame(); };
  setTimeout(drawFrame, 100);
}

// ── Offscreen grade canvas (reused) ──────────────────────────────
var gradeCanvas = document.createElement('canvas');
var gradeCtx    = gradeCanvas.getContext('2d');

// ── Canvas draw ───────────────────────────────────────────────────
function drawFrame(){
  if(!vid.videoWidth){ rafId=requestAnimationFrame(drawFrame); return; }

  var W=canvas.width, H=canvas.height;
  var st=activeStyle;

  // Sync offscreen grade canvas size
  if(gradeCanvas.width!==W||gradeCanvas.height!==H){
    gradeCanvas.width=W; gradeCanvas.height=H;
  }

  ctx.clearRect(0,0,W,H);

  // ── 1. Draw video through CSS filter on offscreen canvas ─────
  var vw=vid.videoWidth, vh=vid.videoHeight;
  var sc=Math.max(W/vw,H/vh);
  var dw=vw*sc, dh=vh*sc;
  var dx=(W-dw)/2, dy=(H-dh)/2;

  // Apply filter on offscreen, then blit to main canvas
  gradeCtx.clearRect(0,0,W,H);
  gradeCtx.filter = st.gradeFilter || 'none';
  gradeCtx.drawImage(vid, dx, dy, dw, dh);
  gradeCtx.filter = 'none';
  ctx.drawImage(gradeCanvas, 0, 0);

  // ── 2. Style-specific colour overlays ────────────────────────
  applyColourOverlay(W, H, st);

  // ── 3. Vignette ───────────────────────────────────────────────
  if(st.vignette>0){
    var g=ctx.createRadialGradient(W/2,H/2,H*0.18,W/2,H/2,H*0.82);
    g.addColorStop(0,'rgba(0,0,0,0)');
    g.addColorStop(1,'rgba(0,0,0,'+st.vignette+')');
    ctx.fillStyle=g;
    ctx.fillRect(0,0,W,H);
  }

  // ── 4. Letterbox ──────────────────────────────────────────────
  if(st.letterbox){
    var bh=Math.round(H*0.08);
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,W,bh);
    ctx.fillRect(0,H-bh,W,bh);
  }

  // ── 5. Film grain ─────────────────────────────────────────────
  if(st.grain) applyGrain(W,H);

  // ── 6. Corporate lower-third bar ─────────────────────────────
  if(st.lowerThird){
    var grad=ctx.createLinearGradient(0,H*0.80,0,H*0.93);
    grad.addColorStop(0,'rgba(4,10,20,0.95)');
    grad.addColorStop(1,'rgba(4,10,20,0.7)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,H*0.80,W,H*0.13);
    ctx.fillStyle='#4fc3f7';
    ctx.fillRect(0,H*0.80,W,3);
  }

  // ── 7. B-roll image at current timestamp ─────────────────────
  var now=vid.currentTime;
  brollItems.forEach(function(b){
    if(b.imgEl && now>=b.t && now<b.t+2.8){
      var fade=1;
      var elapsed=now-b.t;
      if(elapsed<0.4) fade=elapsed/0.4;           // fade in
      if(elapsed>2.2) fade=(2.8-elapsed)/0.6;     // fade out
      ctx.save();
      ctx.globalAlpha=Math.max(0,Math.min(1,fade))*0.72;
      var iw=b.imgEl.naturalWidth||540;
      var ih=b.imgEl.naturalHeight||960;
      var isc=Math.max(W/iw,H/ih);
      ctx.drawImage(b.imgEl,(W-iw*isc)/2,(H-ih*isc)/2,iw*isc,ih*isc);
      ctx.restore();
      // Keyword label on B-roll
      ctx.save();
      ctx.font='bold 13px "DM Sans",sans-serif';
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(12,H-48,ctx.measureText(b.keyword||'').width+20,28);
      ctx.fillStyle='#fff';
      ctx.textAlign='left';
      ctx.textBaseline='middle';
      ctx.fillText(b.keyword||'', 22, H-34);
      ctx.restore();
    }
  });

  // ── 8. Captions ───────────────────────────────────────────────
  drawCaptions(W,H,now,st);

  // ── 9. Watermark ──────────────────────────────────────────────
  ctx.save();
  ctx.font='10px "DM Sans",sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.22)';
  ctx.textAlign='right';
  ctx.textBaseline='top';
  ctx.fillText('ImpactGrid',W-10,10);
  ctx.restore();

  if(isPlaying) rafId=requestAnimationFrame(drawFrame);
}

// ── Per-style colour overlay (makes styles visually distinct) ────
function applyColourOverlay(W,H,st){
  var overlays = {
    viral:       {mode:'soft-light', color:'rgba(255,80,0,0.18)'},
    cinematic:   {mode:'soft-light', color:'rgba(0,40,120,0.22)'},
    corporate:   {mode:'soft-light', color:'rgba(0,80,160,0.14)'},
    hype:        {mode:'soft-light', color:'rgba(255,200,0,0.20)'},
    podcast:     {mode:'soft-light', color:'rgba(100,60,200,0.16)'},
    documentary: {mode:'soft-light', color:'rgba(180,100,0,0.22)'}
  };
  var ov = overlays[st.id];
  if(!ov) return;
  ctx.globalCompositeOperation = ov.mode;
  ctx.fillStyle = ov.color;
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation = 'source-over';
}

function applyGrain(W,H){
  // Sparse grain — only sample every 4th pixel for performance
  var id=ctx.getImageData(0,0,W,H), d=id.data;
  for(var i=0;i<d.length;i+=16){
    var n=(Math.random()-.5)*26;
    d[i]+=n; d[i+1]+=n; d[i+2]+=n;
  }
  ctx.putImageData(id,0,0);
}

// ── Caption drawing ───────────────────────────────────────────────
function drawCaptions(W,H,now,st){
  // Find active caption
  var cap=null;
  for(var i=0;i<captions.length;i++){
    if(captions[i].t<=now && now<captions[i].t+3.5){ cap=captions[i]; break; }
  }
  if(!cap) return;

  var text=cap.text, drm=cap.dramatic;
  var bg   = drm ? st.dramaticBg    : st.captionBg;
  var col  = drm ? st.dramaticColor : st.captionColor;
  var size = st.captionSize * (drm?1.12:1);
  var y    = H*st.captionY;

  ctx.save();
  ctx.textAlign='center';
  ctx.textBaseline='middle';

  if(st.wordByWord){
    drawWordHighlight(W,y,text,now-cap.t,st,drm);
  } else {
    // Single caption block
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var tw = ctx.measureText(text).width;
    var padX=16, padY=10;
    var bw=Math.min(tw+padX*2, W-32);
    var bh=size+padY*2;
    var bx=W/2-bw/2;
    var by=y-bh/2;

    // Background
    if(bg && bg!=='transparent'){
      ctx.fillStyle=bg;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(bx,by,bw,bh,8);
      else ctx.rect(bx,by,bw,bh);
      ctx.fill();
    } else {
      // Shadow only for transparent background
      ctx.shadowColor='rgba(0,0,0,0.9)';
      ctx.shadowBlur=8;
    }

    // Text
    ctx.fillStyle=col;
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    ctx.fillText(text, W/2, y);
    ctx.shadowBlur=0;
  }
  ctx.restore();
}

function drawWordHighlight(W,y,text,elapsed,st,drm){
  var words   = text.split(' ');
  var perWord = 3.2/Math.max(words.length,1);
  var active  = Math.floor(elapsed/perWord);
  var size    = st.captionSize;

  ctx.font='bold '+size+'px "DM Sans",sans-serif';

  // Measure total width
  var totalW = words.reduce(function(a,w){return a+ctx.measureText(w).width+8;},0);
  var x = W/2 - totalW/2;

  words.forEach(function(w,wi){
    var ww  = ctx.measureText(w).width;
    var cx  = x+ww/2;
    var isA = (wi===active);
    var bg2 = isA ? st.dramaticBg    : st.captionBg;
    var c2  = isA ? st.dramaticColor : st.captionColor;

    if(bg2&&bg2!=='transparent'){
      ctx.fillStyle=bg2;
      var ph=size+10;
      if(ctx.roundRect) ctx.roundRect(x-3,y-ph/2,ww+6,ph,5);
      else ctx.rect(x-3,y-ph/2,ww+6,ph);
      ctx.fill();
      ctx.beginPath();
    }
    ctx.fillStyle=c2||'#fff';
    ctx.textAlign='left';
    ctx.fillText(w,x,y+size*0.35);
    x+=ww+8;
  });
  ctx.textAlign='center';
}

// ── Playback ─────────────────────────────────────────────────────
function togglePlay(){
  if(!vid.src){toast('Add a clip first');return;}
  if(vid.paused){
    vid.play();
    isPlaying=true;
    document.getElementById('vcPlay').textContent='⏸';
    document.getElementById('playBtnBig').textContent='⏸';
    document.getElementById('playOverlay').classList.add('playing');
    rafId=requestAnimationFrame(drawFrame);
  } else {
    vid.pause();
    isPlaying=false;
    document.getElementById('vcPlay').textContent='▶';
    document.getElementById('playBtnBig').textContent='▶';
    document.getElementById('playOverlay').classList.remove('playing');
    cancelAnimationFrame(rafId);
    drawFrame();
  }
}

function seekTo(e){
  var rect=e.currentTarget.getBoundingClientRect();
  var pct=(e.clientX-rect.left)/rect.width;
  vid.currentTime=pct*(vid.duration||0);
  if(!isPlaying) setTimeout(drawFrame,50);
}

// ── Apply style change without re-processing ──────────────────────
function applyStyleToCanvas(){
  if(!isPlaying) setTimeout(drawFrame,50);
}

// ── Export via MediaRecorder ─────────────────────────────────────
function setFmt(btn){
  document.querySelectorAll('.fmt-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  exportFmt=btn.dataset.fmt;
}

function startExport(){
  if(!vid.src){toast('No video loaded');return;}

  // Set canvas size for format
  if(exportFmt==='reel')         {canvas.width=540; canvas.height=960;}
  else if(exportFmt==='youtube') {canvas.width=1280;canvas.height=720;}
  else                           {canvas.width=720; canvas.height=720;}

  var ep=document.getElementById('exportProgress');
  var bar=document.getElementById('expBar');
  var lbl=document.getElementById('expLabel');
  ep.style.display='block';
  document.getElementById('exportBtn').disabled=true;

  // Capture canvas stream at 30fps
  var stream=canvas.captureStream(30);

  // Add audio from video element
  try{
    var ac=new AudioContext();
    var src2=ac.createMediaElementSource(vid);
    var dest=ac.createMediaStreamDestination();
    src2.connect(dest);
    src2.connect(ac.destination);
    dest.stream.getAudioTracks().forEach(function(t){stream.addTrack(t);});
  }catch(e){}

  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .find(function(m){return MediaRecorder.isTypeSupported(m);})||'video/webm';

  var chunks=[];
  var rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:5000000});
  rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
  rec.onstop=function(){
    var blob=new Blob(chunks,{type:mime});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='impactgrid_'+activeStyle.id+'_'+exportFmt+'.webm';
    document.body.appendChild(a);
    a.click();
    a.remove();
    bar.style.width='100%';
    lbl.textContent='✓ Download started!';
    document.getElementById('exportBtn').disabled=false;
    toast('✓ Exported as '+activeStyle.name+' · '+exportFmt);
    setTimeout(function(){ep.style.display='none';},4000);
    // restore onended
    vid.onended=function(){
      isPlaying=false;
      document.getElementById('vcPlay').textContent='▶';
      document.getElementById('playOverlay').classList.remove('playing');
      cancelAnimationFrame(rafId);
    };
  };

  // Play from start and record
  vid.currentTime=0;
  isPlaying=true;
  vid.play();
  rec.start(100);
  rafId=requestAnimationFrame(drawFrame);

  var dur=vid.duration*1000;
  var t0=Date.now();
  var pi=setInterval(function(){
    var pct=Math.min((Date.now()-t0)/dur*95,95);
    bar.style.width=pct+'%';
    lbl.textContent='Recording… '+Math.round(pct)+'%';
  },400);

  vid.onended=function(){
    clearInterval(pi);
    isPlaying=false;
    rec.stop();
  };
}

// ── Speech helpers ────────────────────────────────────────────────
var DRAMATIC=new Set(['amazing','incredible','huge','massive','love','hate','never','always',
  'breaking','must','best','worst','epic','shocking','winner','first','exclusive','secret',
  'free','real','truth','only','biggest','powerful','transform','change','money','success',
  'wow','stop','watch','look','game','changer','insane','crazy','unbelievable','launch',
  'new','live','now','today','wait','omg','seriously','literally']);

function isDramatic(text){
  if(/[!?]/.test(text)) return true;
  var l=text.toLowerCase();
  return Array.from(DRAMATIC).some(function(w){return l.indexOf(w)!==-1;});
}

function chunkSave(text,t,drm){
  var words=text.split(/\s+/), chunk=[], time=t;
  words.forEach(function(w,wi){
    chunk.push(w);
    if(chunk.length>=4||wi===words.length-1){
      captions.push({t:Math.max(0,time),text:chunk.join(' '),dramatic:drm});
      time+=chunk.length*0.38;
      chunk=[];
    }
  });
}

var STOP=new Set(['the','is','are','a','an','and','to','of','in','it','that','this','with',
  'for','on','you','i','we','he','she','they','was','be','at','by','from','have','do','not',
  'but','what','when','there','has','will','about','just','so','up','more','its','also',
  'which','your','our','can','had','how','some','if','my','me','as','get','like','know',
  'really','very','then','than','into','out','been','were','would','could','should']);

function getKeywords(text){
  var words=text.replace(/[.,!?;:'"]/g,' ').toLowerCase().split(/\s+/);
  var seen=new Set();
  return words.filter(function(w){
    if(w.length<4||STOP.has(w)||seen.has(w))return false;
    seen.add(w);return true;
  }).slice(0,2);
}

// ── Image fetch ───────────────────────────────────────────────────
function fetchImage(kw,cb){
  var enc=encodeURIComponent(kw);
  var h=0; for(var i=0;i<kw.length;i++) h=(h*31+kw.charCodeAt(i))&0xffff;
  var sources=[
    'https://loremflickr.com/540/960/'+enc+'?random='+((h%8000)+100),
    'https://picsum.photos/540/960?random='+((h%500)+1)
  ];
  var idx=0;
  function next(){
    if(idx>=sources.length){cb(null);return;}
    var url=sources[idx++], img=new Image(), done=false;
    img.crossOrigin='anonymous';
    var timer=setTimeout(function(){if(!done){done=true;next();}},6000);
    img.onload=function(){if(!done){done=true;clearTimeout(timer);cb(url);}};
    img.onerror=function(){if(!done){done=true;clearTimeout(timer);next();}};
    img.src=url;
  }
  next();
}

// ── Navigation ────────────────────────────────────────────────────
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el=document.getElementById(id);
  if(el){el.classList.add('active');window.scrollTo(0,0);}
}

// ── Utilities ─────────────────────────────────────────────────────
function fmtTime(s){
  if(!s||isNaN(s))return'0:00';
  var m=Math.floor(s/60),sec=Math.floor(s%60);
  return m+':'+(sec<10?'0':'')+sec;
}
var _tt;
function toast(msg){
  var el=document.getElementById('toast');
  el.textContent=msg; el.className='toast show';
  clearTimeout(_tt); _tt=setTimeout(function(){el.className='toast';},4000);
}
