// ================================================================
// ImpactGrid Creator Studio — upload.js
// CAPTION STYLES: word-pop, full-screen keyword, bounce, typewriter,
//                 neon glow, cinematic subtitle, split-colour
// VIDEO STYLES: Viral, Cinematic, Corporate, Hype, Podcast, Documentary
// ================================================================

// ─────────────────────────────────────────────────────────────────
// EDIT STYLES  (visual identity for each preset)
// ─────────────────────────────────────────────────────────────────
var STYLES = [
  {
    id:'viral', name:'Viral TikTok',
    desc:'Big keyword pops, orange pills, warm saturated grade.',
    tags:['TikTok','Reels','Trending'],
    capStyle:'wordPop',          // caption animation style
    gradient:'linear-gradient(160deg,#2a0800,#0d0400)',
    previewCap:{bg:'#ff5c1a',color:'#fff',text:'STOP scrolling!'},
    gradeFilter:'brightness(1.1) saturate(1.35) contrast(1.06)',
    overlay:'rgba(255,60,0,0.10)', overlayMode:'soft-light',
    vignette:0.55, letterbox:false, grain:false, lowerThird:false,
    accentColor:'#ff5c1a'
  },
  {
    id:'cinematic', name:'Cinematic',
    desc:'Letterbox bars, cool grade, elegant subtitle captions.',
    tags:['Film','YouTube','Story'],
    capStyle:'subtitle',
    gradient:'linear-gradient(160deg,#000814,#001233)',
    previewCap:{bg:'transparent',color:'#fff',text:'A story unfolds…',shadow:true},
    gradeFilter:'brightness(0.88) saturate(0.78) contrast(1.04)',
    overlay:'rgba(0,30,100,0.18)', overlayMode:'soft-light',
    vignette:0.80, letterbox:true, grain:false, lowerThird:false,
    accentColor:'#90caf9'
  },
  {
    id:'corporate', name:'Corporate Pro',
    desc:'Lower-thirds, sharp grade, built for LinkedIn.',
    tags:['LinkedIn','B2B','Pro'],
    capStyle:'lowerThirdCap',
    gradient:'linear-gradient(160deg,#040a14,#0a1628)',
    previewCap:{bg:'rgba(4,10,20,0.9)',color:'#4fc3f7',text:'Key insight here'},
    gradeFilter:'brightness(1.0) saturate(0.85) contrast(1.03)',
    overlay:'rgba(0,60,140,0.12)', overlayMode:'soft-light',
    vignette:0.28, letterbox:false, grain:false, lowerThird:true,
    accentColor:'#4fc3f7'
  },
  {
    id:'hype', name:'Hype Reel',
    desc:'Full-screen keyword explosions, gold grade, max energy.',
    tags:['Sports','Launch','Energy'],
    capStyle:'fullscreenPop',
    gradient:'linear-gradient(160deg,#1a1000,#0a0800)',
    previewCap:{bg:'#f0c93a',color:'#000',text:'MASSIVE!'},
    gradeFilter:'brightness(1.12) saturate(1.45) contrast(1.1)',
    overlay:'rgba(240,180,0,0.15)', overlayMode:'soft-light',
    vignette:0.40, letterbox:false, grain:false, lowerThird:false,
    accentColor:'#f0c93a'
  },
  {
    id:'podcast', name:'Podcast / Talk',
    desc:'Typewriter word-by-word, each spoken word highlights live.',
    tags:['Podcast','Interview','Talk'],
    capStyle:'typewriter',
    gradient:'linear-gradient(160deg,#0d0d1a,#16102a)',
    previewCap:{bg:'#a78bfa',color:'#fff',text:'Word by word'},
    gradeFilter:'brightness(0.97) saturate(0.90) contrast(1.01)',
    overlay:'rgba(80,40,180,0.14)', overlayMode:'soft-light',
    vignette:0.42, letterbox:false, grain:false, lowerThird:false,
    accentColor:'#a78bfa'
  },
  {
    id:'documentary', name:'Documentary',
    desc:'Warm sepia, film grain, bold title-card captions.',
    tags:['Doc','Warm','Story'],
    capStyle:'titleCard',
    gradient:'linear-gradient(160deg,#1a0e00,#120900)',
    previewCap:{bg:'rgba(0,0,0,0.8)',color:'#ffb74d',text:'Chapter I'},
    gradeFilter:'brightness(1.02) saturate(0.65) sepia(0.3)',
    overlay:'rgba(160,80,0,0.18)', overlayMode:'soft-light',
    vignette:0.65, letterbox:false, grain:true, lowerThird:false,
    accentColor:'#ffb74d'
  }
];

// ─────────────────────────────────────────────────────────────────
// CAPTION RENDERERS  (the creative part)
// ─────────────────────────────────────────────────────────────────
// Each gets: ctx, W, H, capObj {text,dramatic,t}, elapsed (seconds since cap started), style

var CAPTION_RENDERERS = {

  // ── Word-pop: each word bounces in one at a time ──────────────
  wordPop: function(ctx, W, H, cap, elapsed, st){
    var words   = cap.text.split(' ');
    var perWord = 0.32;
    var visible = Math.min(Math.floor(elapsed / perWord) + 1, words.length);
    var size    = cap.dramatic ? 30 : 24;
    var y       = H * 0.80;
    var lineMax = 3;

    // Layout words in lines
    ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
    var lines  = [], cur = [];
    words.slice(0, visible).forEach(function(w){
      cur.push(w);
      if(cur.length >= lineMax){ lines.push(cur.slice()); cur=[]; }
    });
    if(cur.length) lines.push(cur);

    lines.forEach(function(line, li){
      var lineY = y + li*(size+10) - (lines.length-1)*(size+10)/2;
      var lineW = line.reduce(function(a,w){ return a+ctx.measureText(w).width+14; },0);
      var startX = W/2 - lineW/2;

      line.forEach(function(word, wi){
        var ww    = ctx.measureText(word).width;
        var globalWi = li*lineMax + wi;
        var wordAge  = elapsed - globalWi*perWord;
        var scale    = wordAge < 0.12 ? 1 + (1-wordAge/0.12)*0.35 : 1; // pop in
        var alpha    = Math.min(wordAge/0.08, 1);

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(startX + ww/2 + 7, lineY);
        ctx.scale(scale, scale);
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';

        var bg    = cap.dramatic ? '#fff'          : st.accentColor;
        var color = cap.dramatic ? st.accentColor  : '#fff';
        var pad   = 9;
        ctx.fillStyle = bg;
        if(ctx.roundRect) ctx.roundRect(-ww/2-pad, -size/2-pad*0.6, ww+pad*2, size+pad*1.2, 6);
        else ctx.rect(-ww/2-pad, -size/2-pad*0.6, ww+pad*2, size+pad*1.2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
        ctx.fillText(word, 0, 1);
        ctx.restore();
        startX += ww + 14;
      });
    });
  },

  // ── Full-screen keyword pop (Hype style) ─────────────────────
  fullscreenPop: function(ctx, W, H, cap, elapsed, st){
    var words    = cap.text.split(' ');
    // Show biggest/most dramatic word HUGE in centre
    var keyword  = pickBigWord(words);
    var rest     = cap.text;

    // Background flash on pop-in
    var flashAge = elapsed;
    if(flashAge < 0.15){
      ctx.fillStyle = 'rgba(240,201,58,'+(0.25*(1-flashAge/0.15))+')';
      ctx.fillRect(0,0,W,H);
    }

    // Keyword ENORMOUS in centre
    var scale = flashAge < 0.18 ? 1+(1-flashAge/0.18)*0.5 : 1;
    var size  = cap.dramatic ? 72 : 54;
    ctx.save();
    ctx.translate(W/2, H*0.45);
    ctx.scale(scale, scale);
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 '+size+'px Oswald,"DM Sans",sans-serif';

    // Outline / shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth   = 8;
    ctx.strokeText(keyword.toUpperCase(), 0, 0);

    ctx.fillStyle = st.accentColor;
    ctx.fillText(keyword.toUpperCase(), 0, 0);
    ctx.restore();

    // Rest of text smaller below
    if(rest !== keyword && elapsed > 0.2){
      var small = rest.replace(keyword,'').trim();
      if(small){
        ctx.font      = 'bold 19px "DM Sans",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=6;
        ctx.fillText(small, W/2, H*0.60);
        ctx.shadowBlur=0;
      }
    }
  },

  // ── Subtitle: elegant bottom subtitle (cinematic) ────────────
  subtitle: function(ctx, W, H, cap, elapsed, st){
    var fadeIn  = Math.min(elapsed/0.25, 1);
    var text    = cap.text;
    var size    = cap.dramatic ? 21 : 18;
    var y       = H * 0.89;

    ctx.save();
    ctx.globalAlpha = fadeIn;
    ctx.font        = (cap.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';

    // Soft background bar
    var tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, y-size-8, W, size*2+16);

    // Text
    if(cap.dramatic){
      ctx.fillStyle = st.accentColor;
    } else {
      ctx.fillStyle = '#fff';
      ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=5;
    }
    ctx.fillText(text, W/2, y);
    ctx.shadowBlur=0;

    // Accent line under dramatic
    if(cap.dramatic){
      ctx.fillStyle = st.accentColor;
      ctx.fillRect(W/2-tw/2, y+size*0.7, tw, 2);
    }
    ctx.restore();
  },

  // ── Lower-third caption (corporate) ──────────────────────────
  lowerThirdCap: function(ctx, W, H, cap, elapsed, st){
    var slideIn = Math.min(elapsed/0.3, 1);
    var barH    = H*0.11;
    var barY    = H*0.80;
    var tx      = 22 * slideIn;   // slide from left

    ctx.save();
    ctx.globalAlpha = Math.min(elapsed/0.2, 1);

    // Bar
    ctx.fillStyle = 'rgba(4,10,20,0.92)';
    ctx.fillRect(-W*(1-slideIn), barY, W, barH);

    // Accent left stripe
    ctx.fillStyle = st.accentColor;
    ctx.fillRect(tx, barY+8, 4, barH-16);

    // Text
    ctx.font         = 'bold 16px "DM Sans",sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = cap.dramatic ? st.accentColor : '#fff';
    ctx.fillText(cap.text, tx+16, barY + barH/2);

    ctx.restore();
  },

  // ── Typewriter word-by-word highlight (podcast) ──────────────
  typewriter: function(ctx, W, H, cap, elapsed, st){
    var words    = cap.text.split(' ');
    var perWord  = 3.0 / Math.max(words.length,1);
    var activeWi = Math.min(Math.floor(elapsed/perWord), words.length-1);
    var size     = 20;
    var y        = H * 0.83;

    ctx.font = 'bold '+size+'px "DM Sans",sans-serif';

    // Measure and centre
    var totalW = words.reduce(function(a,w){return a+ctx.measureText(w).width+10;},0);
    // Wrap into 2 lines if too wide
    var maxW = W - 40;
    var lines = [], cur=[], curW=0;
    words.forEach(function(w){
      var ww = ctx.measureText(w).width+10;
      if(curW+ww > maxW && cur.length){ lines.push(cur.slice()); cur=[]; curW=0; }
      cur.push(w); curW+=ww;
    });
    if(cur.length) lines.push(cur);

    var wi = 0;
    lines.forEach(function(line, li){
      var lineW = line.reduce(function(a,w){return a+ctx.measureText(w).width+10;},0);
      var x = W/2 - lineW/2;
      var lineY = y + li*(size+14) - (lines.length-1)*(size+14)/2;

      line.forEach(function(word){
        var ww     = ctx.measureText(word).width;
        var isAct  = (wi === activeWi);
        var isPast = (wi < activeWi);
        ctx.save();
        // Background
        ctx.fillStyle = isAct ? st.accentColor : (isPast ? 'rgba(255,255,255,0.08)' : 'transparent');
        if(isAct || isPast){
          if(ctx.roundRect) ctx.roundRect(x-4, lineY-size/2-5, ww+8, size+10, 5);
          else ctx.rect(x-4, lineY-size/2-5, ww+8, size+10);
          ctx.fill();
        }
        // Glow on active
        if(isAct){
          ctx.shadowColor = st.accentColor; ctx.shadowBlur=14;
        }
        ctx.font         = 'bold '+size+'px "DM Sans",sans-serif';
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = isAct ? '#fff' : (isPast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)');
        ctx.fillText(word, x, lineY);
        ctx.shadowBlur=0;
        ctx.restore();
        x += ww+10; wi++;
      });
    });
  },

  // ── Title card (documentary) ──────────────────────────────────
  titleCard: function(ctx, W, H, cap, elapsed, st){
    var fadeIn  = Math.min(elapsed/0.4, 1);
    var size    = cap.dramatic ? 26 : 19;
    var y       = H * 0.87;

    ctx.save();
    ctx.globalAlpha = fadeIn;

    // Full-width dark bar for dramatic
    if(cap.dramatic){
      ctx.fillStyle='rgba(0,0,0,0.82)';
      ctx.fillRect(0, y-size-14, W, size+28);
      ctx.fillStyle = st.accentColor;
      ctx.fillRect(0, y-size-14, 5, size+28);
    }

    ctx.font         = (cap.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor  = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur   = cap.dramatic ? 0 : 8;
    ctx.fillStyle    = cap.dramatic ? st.accentColor : '#fff';
    ctx.fillText(cap.text, W/2, y);
    ctx.shadowBlur=0;
    ctx.restore();
  }
};

// Helper: pick the most impactful word from an array
function pickBigWord(words){
  var POWER = new Set(['amazing','incredible','huge','massive','love','hate','never',
    'always','best','worst','epic','shocking','first','secret','free','truth','only',
    'biggest','powerful','change','money','success','stop','watch','insane','crazy',
    'launch','new','live','now','today','yes','no','wow','real','game','winner']);
  var longest = words.reduce(function(a,b){return b.length>a.length?b:a;}, words[0]||'');
  var power   = words.find(function(w){return POWER.has(w.toLowerCase());});
  return power || longest || (words[0]||'');
}

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
var clip        = null;
var activeStyle = STYLES[0];
var captions    = [];
var brollItems  = [];
var recog       = null;
var isListening = false;
var listenStart = 0;
var isPlaying   = false;
var rafId       = null;
var exportFmt   = 'reel';

var vid    = document.getElementById('masterVid');
var canvas = document.getElementById('cv');
var ctx    = canvas.getContext('2d');
var gradeC = document.createElement('canvas');
var gradeX = gradeC.getContext('2d');

// ─────────────────────────────────────────────────────────────────
// BUILD STYLE CARDS
// ─────────────────────────────────────────────────────────────────
(function(){
  var grid = document.getElementById('styleGrid');
  var mini = document.getElementById('miniStyles');

  STYLES.forEach(function(s){
    // Main card
    var card = document.createElement('div');
    card.className = 'sc';
    var pc = s.previewCap;
    card.innerHTML =
      '<div class="sc-demo" style="background:'+s.gradient+'">'
        +'<span style="font-family:'+(s.id==='hype'?'Oswald,':'')
          +'"DM Sans",sans-serif;font-weight:700;font-size:'
          +(s.id==='hype'?'22':'14')+'px;padding:5px 12px;border-radius:6px;'
          +'background:'+(pc.bg||'transparent')+';color:'+(pc.color||'#fff')+';'
          +(pc.shadow?'text-shadow:0 1px 6px rgba(0,0,0,0.8)':'')
          +'">'+pc.text+'</span>'
        +'<div class="sc-tick">✓</div>'
      +'</div>'
      +'<div class="sc-body">'
        +'<div class="sc-name">'+s.name+'</div>'
        +'<div class="sc-desc">'+s.desc+'</div>'
        +'<div class="sc-tags">'+s.tags.map(function(t){
          return '<span class="sc-tag">'+t+'</span>';
        }).join('')+'</div>'
      +'</div>';
    card.onclick = function(){
      document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('sel');});
      card.classList.add('sel');
      activeStyle = s;
      setTimeout(startProcessing, 250);
    };
    grid.appendChild(card);

    // Mini re-style button
    var b = document.createElement('button');
    b.className   = 'mini-btn';
    b.textContent = s.name;
    b.onclick = function(){
      activeStyle = s;
      document.getElementById('expStyle').textContent   = s.name;
      document.getElementById('styleBadge').textContent = s.name+' ✓';
      if(!isPlaying) drawFrame();
      toast('Style: '+s.name);
    };
    mini.appendChild(b);
  });
})();

// ─────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────
document.getElementById('fileIn').onchange = function(e){
  var f = e.target.files[0];
  if(!f) return;
  if(clip) URL.revokeObjectURL(clip.url);
  clip = {file:f, url:URL.createObjectURL(f)};
  vid.src = clip.url;
  vid.onloadedmetadata = function(){
    document.getElementById('fileChip').textContent =
      '🎬 '+f.name+' · '+ft(vid.duration);
  };
  goTo('sStyle');
};

(function(){
  var dz = document.getElementById('dropZone');
  ['dragover','dragenter'].forEach(function(ev){
    dz.addEventListener(ev,function(e){
      e.preventDefault();
      dz.querySelector('.dz-inner').style.borderColor='#ff5c1a';
    });
  });
  ['dragleave','dragend'].forEach(function(ev){
    dz.addEventListener(ev,function(){
      dz.querySelector('.dz-inner').style.borderColor='';
    });
  });
  dz.addEventListener('drop',function(e){
    e.preventDefault();
    dz.querySelector('.dz-inner').style.borderColor='';
    var f = Array.from(e.dataTransfer.files).find(function(x){
      return x.type.startsWith('video/');
    });
    if(!f) return;
    if(clip) URL.revokeObjectURL(clip.url);
    clip = {file:f, url:URL.createObjectURL(f)};
    vid.src = clip.url;
    vid.onloadedmetadata = function(){
      document.getElementById('fileChip').textContent =
        '🎬 '+f.name+' · '+ft(vid.duration);
    };
    goTo('sStyle');
  });
})();

// ─────────────────────────────────────────────────────────────────
// PROCESSING  (listens to FULL video length)
// ─────────────────────────────────────────────────────────────────
function startProcessing(){
  captions    = [];
  brollItems  = [];
  isListening = false;
  if(recog) try{recog.abort();}catch(e){}

  var st = activeStyle;
  goTo('sProcess');
  document.getElementById('procAnim').textContent  = '⚡';
  document.getElementById('procTitle').textContent = 'Applying '+st.name+'…';
  document.getElementById('procDesc').textContent  = 'Getting ready…';
  document.getElementById('procLog').innerHTML     = '';
  document.getElementById('procLive').textContent  = '';
  document.getElementById('progFill').style.width  = '2%';

  var log  = document.getElementById('procLog');
  var live = document.getElementById('procLive');

  function addLog(msg){ log.innerHTML += '<div>✓ '+msg+'</div>'; }
  addLog('Video loaded');

  // ── Start speech recognition ────────────────────────────────
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    addLog('⚠ Auto-captions need Chrome or Edge');
  } else {
    recog = new SR();
    recog.continuous     = true;
    recog.interimResults = true;
    recog.lang           = 'en-GB';
    listenStart          = Date.now();
    var lastFinal        = '';
    var usedKws          = new Set();

    recog.onresult = function(ev){
      var final='', interim='';
      for(var i=ev.resultIndex;i<ev.results.length;i++){
        if(ev.results[i].isFinal) final   += ev.results[i][0].transcript;
        else                       interim += ev.results[i][0].transcript;
      }
      var shown = (final||interim).trim();
      if(shown) live.textContent = '"'+shown+'"';

      if(final.trim() && final.trim() !== lastFinal){
        lastFinal = final.trim();
        var t   = (vid.readyState>=2 && vid.duration) ? vid.currentTime : (Date.now()-listenStart)/1000;
        var drm = isDramatic(final);
        chunkSave(final.trim(), t, drm);

        var kws = getKeywords(final);
        kws.forEach(function(kw){
          if(!usedKws.has(kw)){
            usedKws.add(kw);
            var item={t:t,url:null,imgEl:null,kw:kw};
            brollItems.push(item);
            fetchImg(kw, function(url){
              if(url){
                item.url=url;
                var img=new Image(); img.crossOrigin='anonymous';
                img.onload=function(){item.imgEl=img;};
                img.src=url;
              }
            });
          }
        });
      }
    };

    recog.onerror = function(e){
      if(e.error==='not-allowed'){
        live.textContent='⚠ Mic blocked — allow mic in browser address bar, then re-upload';
      }
    };
    recog.onend = function(){ if(isListening) try{recog.start();}catch(e){} };

    try{ recog.start(); isListening=true; addLog('Listening…'); }
    catch(e){ addLog('Could not start mic: '+e.message); }
  }

  // ── Play video with audio so mic hears it ──────────────────
  vid.currentTime = 0;
  vid.muted       = false;
  vid.volume      = 1.0;
  vid.play().catch(function(){ vid.muted=true; vid.play(); });

  addLog('Playing video for transcription');
  document.getElementById('procTitle').textContent = 'Listening to your video…';
  document.getElementById('procDesc').textContent  =
    'Turn your volume up — the mic listens to the audio in real time';

  // Progress bar tracks video playback
  vid.ontimeupdate = function(){
    if(!vid.duration) return;
    var pct = (vid.currentTime/vid.duration)*100;
    document.getElementById('progFill').style.width = pct+'%';
    document.getElementById('procTitle').textContent =
      ft(vid.currentTime)+' / '+ft(vid.duration)+'  —  '+captions.length+' captions';
  };

  // When video finishes → done
  vid.onended = function(){
    isListening=false;
    if(recog) try{recog.abort();}catch(e){}
    vid.onended=null; vid.ontimeupdate=null;

    document.getElementById('progFill').style.width='100%';
    document.getElementById('procAnim').textContent='✅';
    document.getElementById('procTitle').textContent='Edit complete!';
    document.getElementById('procDesc').textContent=
      captions.length+' captions · '+brollItems.length+' B-roll images';
    addLog('Caption sync done');
    addLog(st.name+' colour grade applied');
    addLog('Ready for preview');
    live.textContent='';

    setTimeout(launchPreview, 900);
  };
}

// ─────────────────────────────────────────────────────────────────
// LAUNCH PREVIEW
// ─────────────────────────────────────────────────────────────────
function launchPreview(){
  goTo('sPreview');
  canvas.width=540; canvas.height=960;
  var st=activeStyle;
  document.getElementById('expStyle').textContent   = st.name;
  document.getElementById('styleBadge').textContent = st.name+' ✓';
  document.getElementById('expStats').innerHTML =
    captions.length+' captions &nbsp;·&nbsp; '
    +brollItems.length+' B-roll images &nbsp;·&nbsp; '
    +st.name+' grade';

  vid.pause(); vid.currentTime=0;
  vid.ontimeupdate = function(){
    var t=vid.currentTime, d=vid.duration||1;
    var pct=(t/d*100).toFixed(1)+'%';
    document.getElementById('vbFill').style.width    = pct;
    document.getElementById('vbThumb').style.left    = pct;
    document.getElementById('vbTime').textContent    = ft(t)+' / '+ft(d);
  };
  vid.onended=function(){
    isPlaying=false;
    document.getElementById('vbPlay').textContent='▶';
    document.getElementById('bigPlay').textContent='▶';
    document.getElementById('playTap').classList.remove('on');
    cancelAnimationFrame(rafId);
  };
  setTimeout(drawFrame,80);
}

// ─────────────────────────────────────────────────────────────────
// CANVAS DRAW LOOP
// ─────────────────────────────────────────────────────────────────
function drawFrame(){
  if(!vid.videoWidth){ rafId=requestAnimationFrame(drawFrame); return; }
  var W=canvas.width, H=canvas.height, st=activeStyle;

  // Sync offscreen
  if(gradeC.width!==W||gradeC.height!==H){ gradeC.width=W; gradeC.height=H; }

  ctx.clearRect(0,0,W,H);

  // 1. Draw video WITH CSS filter applied via offscreen canvas
  var vw=vid.videoWidth, vh=vid.videoHeight;
  var sc=Math.max(W/vw,H/vh);
  var dw=vw*sc, dh=vh*sc;
  gradeX.clearRect(0,0,W,H);
  gradeX.filter = st.gradeFilter||'none';
  gradeX.drawImage(vid,(W-dw)/2,(H-dh)/2,dw,dh);
  gradeX.filter = 'none';
  ctx.drawImage(gradeC,0,0);

  // 2. Colour tint overlay
  ctx.globalCompositeOperation = st.overlayMode||'source-over';
  ctx.fillStyle = st.overlay||'transparent';
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation = 'source-over';

  // 3. Vignette
  if(st.vignette>0){
    var vg=ctx.createRadialGradient(W/2,H/2,H*0.15,W/2,H/2,H*0.85);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,'+st.vignette+')');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  }

  // 4. Letterbox
  if(st.letterbox){
    var bh=Math.round(H*0.082);
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,W,bh);
    ctx.fillRect(0,H-bh,W,bh);
  }

  // 5. Lower-third bar background (corporate)
  if(st.lowerThird){
    var ltGrad=ctx.createLinearGradient(0,H*0.78,0,H*0.94);
    ltGrad.addColorStop(0,'rgba(4,10,20,0.95)');
    ltGrad.addColorStop(1,'rgba(4,10,20,0.6)');
    ctx.fillStyle=ltGrad;
    ctx.fillRect(0,H*0.78,W,H*0.16);
    ctx.fillStyle=st.accentColor;
    ctx.fillRect(0,H*0.78,W,3);
  }

  // 6. Film grain (documentary)
  if(st.grain) doGrain(W,H);

  // 7. B-roll image (fades in/out at timestamp)
  var now=vid.currentTime;
  brollItems.forEach(function(b){
    if(!b.imgEl) return;
    if(now < b.t || now >= b.t+2.8) return;
    var age=now-b.t;
    var alpha = age<0.35 ? age/0.35 : age>2.2 ? (2.8-age)/0.6 : 1;
    ctx.save();
    ctx.globalAlpha=Math.max(0,Math.min(1,alpha))*0.7;
    var iw=b.imgEl.naturalWidth||540, ih=b.imgEl.naturalHeight||960;
    var isc=Math.max(W/iw,H/ih);
    ctx.drawImage(b.imgEl,(W-iw*isc)/2,(H-ih*isc)/2,iw*isc,ih*isc);
    ctx.restore();
    // Keyword label
    ctx.save();
    ctx.font='bold 12px "DM Sans",sans-serif';
    var lw=ctx.measureText(b.kw||'').width+20;
    ctx.fillStyle='rgba(0,0,0,0.65)';
    ctx.fillRect(14,H*0.08-18,lw,26);
    ctx.fillStyle=st.accentColor;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText((b.kw||'').toUpperCase(),24,H*0.08);
    ctx.restore();
  });

  // 8. Captions
  var cap=null;
  for(var i=0;i<captions.length;i++){
    if(captions[i].t<=now && now<captions[i].t+3.4){ cap=captions[i]; break; }
  }
  if(cap){
    var elapsed=now-cap.t;
    var renderer=CAPTION_RENDERERS[st.capStyle]||CAPTION_RENDERERS.subtitle;
    renderer(ctx,W,H,cap,elapsed,st);
  }

  // 9. Tiny watermark
  ctx.save();
  ctx.font='10px "DM Sans",sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.18)';
  ctx.textAlign='right'; ctx.textBaseline='top';
  ctx.fillText('ImpactGrid',W-10,10);
  ctx.restore();

  if(isPlaying) rafId=requestAnimationFrame(drawFrame);
}

function doGrain(W,H){
  var id=ctx.getImageData(0,0,W,H),d=id.data;
  for(var i=0;i<d.length;i+=12){
    var n=(Math.random()-.5)*22;
    d[i]+=n; d[i+1]+=n; d[i+2]+=n;
  }
  ctx.putImageData(id,0,0);
}

// ─────────────────────────────────────────────────────────────────
// PLAYBACK
// ─────────────────────────────────────────────────────────────────
function togglePlay(){
  if(!vid.src){ toast('Load a video first'); return; }
  if(vid.paused){
    vid.play();
    isPlaying=true;
    document.getElementById('vbPlay').textContent='⏸';
    document.getElementById('bigPlay').textContent='⏸';
    document.getElementById('playTap').classList.add('on');
    rafId=requestAnimationFrame(drawFrame);
  } else {
    vid.pause();
    isPlaying=false;
    document.getElementById('vbPlay').textContent='▶';
    document.getElementById('bigPlay').textContent='▶';
    document.getElementById('playTap').classList.remove('on');
    cancelAnimationFrame(rafId);
    drawFrame();
  }
}

function seekClick(e){
  var r=e.currentTarget.getBoundingClientRect();
  vid.currentTime=(e.clientX-r.left)/r.width*(vid.duration||0);
  if(!isPlaying) setTimeout(drawFrame,40);
}

// ─────────────────────────────────────────────────────────────────
// EXPORT (MediaRecorder — canvas + audio → webm)
// ─────────────────────────────────────────────────────────────────
function setFmt(btn){
  document.querySelectorAll('.fmt').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  exportFmt=btn.dataset.f;
}

function doExport(){
  if(!vid.src){ toast('No video loaded'); return; }

  if(exportFmt==='reel')         {canvas.width=540;  canvas.height=960;}
  else if(exportFmt==='youtube') {canvas.width=1280; canvas.height=720;}
  else                           {canvas.width=720;  canvas.height=720;}

  var ep=document.getElementById('expProg');
  var bar=document.getElementById('epFill');
  var lbl=document.getElementById('epLbl');
  ep.style.display='block';
  document.getElementById('dlBtn').disabled=true;

  var stream=canvas.captureStream(30);
  try{
    var ac=new (window.AudioContext||window.webkitAudioContext)();
    var src=ac.createMediaElementSource(vid);
    var dest=ac.createMediaStreamDestination();
    src.connect(dest); src.connect(ac.destination);
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
    document.body.appendChild(a); a.click(); a.remove();
    bar.style.width='100%'; lbl.textContent='✓ Downloading!';
    document.getElementById('dlBtn').disabled=false;
    toast('✓ Exported: '+activeStyle.name+' · '+exportFmt);
    setTimeout(function(){ep.style.display='none';},4000);
    vid.onended=defaultEnded;
  };

  vid.currentTime=0; isPlaying=true;
  vid.play(); rec.start(100);
  rafId=requestAnimationFrame(drawFrame);

  var dur=vid.duration*1000, t0=Date.now();
  var pi=setInterval(function(){
    var p=Math.min((Date.now()-t0)/dur*95,95);
    bar.style.width=p+'%'; lbl.textContent='Recording… '+Math.round(p)+'%';
  },400);

  vid.onended=function(){
    clearInterval(pi); isPlaying=false; rec.stop();
  };
}

function defaultEnded(){
  isPlaying=false;
  document.getElementById('vbPlay').textContent='▶';
  document.getElementById('playTap').classList.remove('on');
  cancelAnimationFrame(rafId);
}

// ─────────────────────────────────────────────────────────────────
// SPEECH / CAPTION HELPERS
// ─────────────────────────────────────────────────────────────────
var DRAMATIC_WORDS=new Set(['amazing','incredible','huge','massive','love','hate','never',
  'always','breaking','best','worst','epic','shocking','first','secret','free','truth','only',
  'biggest','powerful','change','money','success','stop','watch','insane','crazy','unbelievable',
  'launch','new','live','now','today','wow','omg','seriously','literally','game','winner','real']);

function isDramatic(text){
  if(/[!?]/.test(text)) return true;
  var l=text.toLowerCase();
  return Array.from(DRAMATIC_WORDS).some(function(w){return l.indexOf(w)!==-1;});
}

function chunkSave(text,t,drm){
  // Split into 4-word chunks, each at a slightly later timestamp
  var words=text.split(/\s+/), chunk=[], time=t;
  words.forEach(function(w,wi){
    chunk.push(w);
    if(chunk.length>=4||wi===words.length-1){
      captions.push({t:Math.max(0,time), text:chunk.join(' '), dramatic:drm});
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
    seen.add(w); return true;
  }).slice(0,2);
}

// ─────────────────────────────────────────────────────────────────
// IMAGE FETCH
// ─────────────────────────────────────────────────────────────────
function fetchImg(kw,cb){
  var enc=encodeURIComponent(kw);
  var h=0; for(var i=0;i<kw.length;i++) h=(h*31+kw.charCodeAt(i))&0xffff;
  var sources=[
    'https://loremflickr.com/540/960/'+enc+'?random='+((h%8000)+100),
    'https://picsum.photos/540/960?random='+((h%400)+50)
  ];
  var idx=0;
  function next(){
    if(idx>=sources.length){cb(null);return;}
    var url=sources[idx++],img=new Image(),done=false;
    img.crossOrigin='anonymous';
    var timer=setTimeout(function(){if(!done){done=true;next();}},6000);
    img.onload=function(){if(!done){done=true;clearTimeout(timer);cb(url);}};
    img.onerror=function(){if(!done){done=true;clearTimeout(timer);next();}};
    img.src=url;
  }
  next();
}

// ─────────────────────────────────────────────────────────────────
// NAVIGATION + UTILS
// ─────────────────────────────────────────────────────────────────
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el=document.getElementById(id);
  if(el){el.classList.add('active'); window.scrollTo(0,0);}
}

function ft(s){
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
