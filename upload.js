// ================================================================
// ImpactGrid Creator Studio — upload.js
// 100% free, zero API keys, works in Chrome/Edge
// ================================================================

// ── State ────────────────────────────────────────────────────────
var clips     = [];
var captions  = [];       // [{t, text, dramatic}]
var recog     = null;
var isOn      = false;
var startedAt = 0;

// ── DOM ──────────────────────────────────────────────────────────
var vid        = document.getElementById('prevVideo');
var capOverlay = document.getElementById('capOverlay');
var brollOv    = document.getElementById('brollOverlay');
var liveBox    = document.getElementById('liveBox');
var pill       = document.getElementById('pill');
var stopBtn    = document.getElementById('stopBtn');
var capList    = document.getElementById('capList');
var capItems   = document.getElementById('capItems');
var capCount   = document.getElementById('capCount');
var brollGrid  = document.getElementById('brollGrid');
var brollSt    = document.getElementById('brollStatus');
var ptime      = document.getElementById('ptime');

// ── Upload ───────────────────────────────────────────────────────
document.getElementById('clipInput').onchange = function(e){
  Array.from(e.target.files).forEach(function(f){
    if(clips.length >= 5){ showToast('Max 5 clips'); return; }
    clips.push({ file:f, url:URL.createObjectURL(f) });
  });
  renderClips();
  loadVideo();
};

function renderClips(){
  var el = document.getElementById('clipList');
  el.innerHTML = clips.map(function(c,i){
    return '<div class="clip-row">'
      + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px">' + esc(c.file.name) + '</span>'
      + '<button onclick="removeClip('+i+')">✖</button>'
      + '</div>';
  }).join('');
  document.getElementById('previewEmpty').style.display = clips.length ? 'none' : 'flex';
}

function removeClip(i){
  URL.revokeObjectURL(clips[i].url);
  clips.splice(i,1);
  renderClips();
  if(clips.length) loadVideo(); else vid.src='';
}

function loadVideo(){
  if(!clips.length) return;
  vid.src = clips[0].url;
  vid.load();
  document.getElementById('previewEmpty').style.display = 'none';
}

// ── Playback ─────────────────────────────────────────────────────
function playPause(){
  if(!clips.length){ showToast('Add a clip first'); return; }
  if(vid.paused){
    vid.muted  = false;
    vid.volume = 1.0;
    vid.play().catch(function(){
      vid.muted = true;
      vid.play();
    });
  } else {
    vid.pause();
  }
}

vid.ontimeupdate = function(){
  var m = Math.floor(vid.currentTime/60);
  var s = Math.floor(vid.currentTime%60);
  ptime.textContent = m+':'+(s<10?'0':'')+s;
  // Show correct caption for this timestamp
  renderTimedCaption(vid.currentTime);
};

// Show the right caption at the current video position
var lastCapIdx = -1;
function renderTimedCaption(t){
  // Find the caption that should be showing right now
  var active = null;
  for(var i=0;i<captions.length;i++){
    if(captions[i].t <= t && t < captions[i].t + 3.5){
      active = captions[i];
      break;
    }
  }
  if(active){
    showCaption(active.text, active.dramatic);
  }
}

// ── Start / Stop AI ──────────────────────────────────────────────
function startAI(){
  if(!clips.length){ showToast('Add a clip first'); return; }
  // Play the video with audio so mic picks it up
  vid.muted  = false;
  vid.volume = 1.0;
  vid.play().catch(function(){ vid.muted=true; vid.play(); });
  startSpeech();
}

function stopAI(){
  isOn = false;
  if(recog) try{ recog.abort(); }catch(e){}
  pill.style.display       = 'none';
  stopBtn.style.display    = 'none';
  liveBox.style.display    = 'none';
  showToast('Stopped. '+captions.length+' captions saved.');
}

// ── Speech Recognition ───────────────────────────────────────────
function startSpeech(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    showToast('Speech recognition needs Chrome or Edge — not this browser');
    return;
  }
  if(isOn) return;

  recog = new SR();
  recog.continuous      = true;
  recog.interimResults  = true;
  recog.maxAlternatives = 1;
  recog.lang            = 'en-GB';
  startedAt             = Date.now();

  var lastFinal = '';

  recog.onresult = function(event){
    var interim = '';
    var final   = '';
    for(var i=event.resultIndex; i<event.results.length; i++){
      var t = event.results[i][0].transcript;
      if(event.results[i].isFinal) final += t;
      else interim += t;
    }

    // Always show live box
    liveBox.style.display = 'block';
    if(interim){
      liveBox.innerHTML = '<span class="interim">'+esc(interim)+'…</span>';
    }

    if(final && final.trim() !== lastFinal.trim()){
      lastFinal = final;
      var text  = final.trim();

      // Timestamp from video playhead
      var t = (vid.duration && !vid.paused && vid.readyState>=2)
        ? vid.currentTime
        : (Date.now()-startedAt)/1000;

      // Is this dramatic? (question, exclamation, power words)
      var dramatic = isDramatic(text);

      // Show on screen immediately
      showCaption(text, dramatic);

      // Save in chunks of 5 words
      chunkAndSave(text, t, dramatic);

      // Extract keywords → get B-roll image
      var kws = getKeywords(text);
      if(kws.length){
        addBroll(kws[0], t);
      }

      liveBox.innerHTML = '<span class="final-text">'+esc(text)+'</span>';
    }
  };

  recog.onerror = function(e){
    if(e.error==='not-allowed'){
      showToast('Mic blocked — click the mic icon in the browser address bar to allow');
      stopAI();
    }
    // no-speech = silence, fine
  };

  // Chrome stops after ~60s silence — restart automatically
  recog.onend = function(){
    if(isOn) setTimeout(function(){
      try{ recog.start(); }catch(ex){ startSpeech(); }
    }, 300);
  };

  try{
    recog.start();
    isOn = true;
    pill.style.display    = 'flex';
    stopBtn.style.display = 'block';
    showToast('🎙 Listening — make sure volume is up!');
  }catch(ex){
    showToast('Could not start mic: '+ex.message);
  }
}

// ── Caption display on video ─────────────────────────────────────
var capTimer = null;
function showCaption(text, dramatic){
  // Split into word spans for TikTok style
  capOverlay.innerHTML = text.split(' ').map(function(w){
    var cls = 'cap-word' + (dramatic ? ' dramatic' : '');
    return '<span class="'+cls+'">'+esc(w)+'</span>';
  }).join(' ');
  capOverlay.classList.add('show');
  clearTimeout(capTimer);
  capTimer = setTimeout(function(){
    capOverlay.classList.remove('show');
  }, 3200);
}

// ── Dramatic detection ────────────────────────────────────────────
var DRAMATIC_WORDS = ['amazing','incredible','huge','massive','love','hate','never','always',
  'breaking','urgent','must','top','best','worst','epic','shocking','winner','first',
  'exclusive','secret','free','now','today','real','truth','only','biggest','powerful',
  'transform','change','growth','money','success','fail','dead','alive','wow','yes','no'];

function isDramatic(text){
  var lower = text.toLowerCase();
  if(/[!?]{1,}/.test(text)) return true;
  return DRAMATIC_WORDS.some(function(w){ return lower.indexOf(w) !== -1; });
}

// ── Caption chunking + saving ────────────────────────────────────
function chunkAndSave(text, startT, dramatic){
  var words = text.split(/\s+/);
  var chunk = [], t = startT;
  words.forEach(function(w, wi){
    chunk.push(w);
    if(chunk.length >= 5 || wi === words.length-1){
      captions.push({ t: Math.max(0,t), text: chunk.join(' '), dramatic: dramatic });
      t += chunk.length * 0.38;
      chunk = [];
    }
  });
  renderCapList();
}

function renderCapList(){
  capList.style.display = captions.length ? 'block' : 'none';
  capCount.textContent  = captions.length + ' caption'+(captions.length!==1?'s':'');
  capItems.innerHTML = captions.map(function(c,i){
    return '<div class="cap-item">'
      + '<span class="cap-t">'+fmt(c.t)+'</span>'
      + '<input class="cap-input" value="'+escAttr(c.text)+'" onchange="captions['+i+'].text=this.value">'
      + '<button class="cap-del" onclick="captions.splice('+i+',1);renderCapList()">✕</button>'
      + '</div>';
  }).join('');
}

function clearAll(){
  captions=[];
  renderCapList();
  capOverlay.classList.remove('show');
  brollGrid.innerHTML='';
  brollSt.textContent='Auto-generated as speech is detected';
}

// ── B-Roll ────────────────────────────────────────────────────────
var usedKws   = new Set();
var brollQueue = [];   // [{t, url}]

function addBroll(keyword, timestamp){
  if(usedKws.has(keyword)) return;
  usedKws.add(keyword);

  // 1. Immediately draw a canvas card so SOMETHING appears in the grid
  var canvas = makeCanvas(keyword);
  var dataUrl = canvas.toDataURL();

  // Add clickable canvas to grid
  canvas.onclick = function(){ showBrollOverlay(dataUrl); };
  brollGrid.prepend(canvas);
  brollSt.textContent = 'Detected: '+keyword;

  // Queue canvas version for auto-overlay
  brollQueue.push({ t: timestamp, url: dataUrl, shown: false });

  // 2. In background: try to load a real image and swap it in
  fetchImage(keyword, function(realUrl){
    if(!realUrl) return;
    // Replace the canvas in the grid with real image
    var img = document.createElement('img');
    img.src = realUrl;
    img.title = keyword;
    img.onclick = function(){ showBrollOverlay(realUrl); };
    img.onerror = function(){ /* keep canvas */ };
    if(canvas.parentNode) canvas.parentNode.replaceChild(img, canvas);
    // Update queue entry
    brollQueue.forEach(function(b){ if(b.t===timestamp) b.url=realUrl; });
  });
}

// Auto-overlay B-roll images at their timestamps during video playback
setInterval(function(){
  if(vid.paused || !vid.duration) return;
  var now = vid.currentTime;
  brollQueue.forEach(function(b){
    if(!b.shown && now >= b.t && now < b.t+3){
      b.shown = true;
      showBrollOverlay(b.url);
    }
  });
}, 250);

function showBrollOverlay(url){
  brollOv.style.backgroundImage = 'url("'+url+'")';
  brollOv.classList.add('show');
  setTimeout(function(){ brollOv.classList.remove('show'); }, 2800);
}

// ── Canvas image (instant, zero network) ─────────────────────────
function makeCanvas(keyword){
  var c   = document.createElement('canvas');
  c.width = 240; c.height = 135;
  var ctx = c.getContext('2d');

  // Generate a consistent colour from the keyword
  var h = 0;
  for(var i=0;i<keyword.length;i++) h=(h*31+keyword.charCodeAt(i))%360;

  var g = ctx.createLinearGradient(0,0,240,135);
  g.addColorStop(0,'hsl('+h+',45%,10%)');
  g.addColorStop(1,'hsl('+((h+50)%360)+',55%,16%)');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,240,135);

  // Keyword text
  ctx.font = 'bold 18px "DM Sans",sans-serif';
  ctx.fillStyle = '#f0c93a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  var label = keyword.length>16 ? keyword.substring(0,16)+'…' : keyword;
  ctx.fillText(label.toUpperCase(), 120, 67);

  // Border
  ctx.strokeStyle='rgba(240,201,58,.2)';
  ctx.lineWidth=2;
  ctx.strokeRect(4,4,232,127);

  return c;
}

// ── Real image fetch (background, no crash if fails) ─────────────
function fetchImage(keyword, cb){
  var enc  = encodeURIComponent(keyword);
  var h    = 0;
  for(var i=0;i<keyword.length;i++) h=(h*31+keyword.charCodeAt(i))&0xffff;

  // Try these sources in order
  var sources = [
    'https://loremflickr.com/480/270/'+enc+'?random='+((h%9000)+100),
    'https://picsum.photos/480/270?random='+((h%500)+1),
  ];

  var idx = 0;
  function tryNext(){
    if(idx >= sources.length){ cb(null); return; }
    var url = sources[idx++];
    var img = new Image();
    img.crossOrigin = 'anonymous';
    var done = false;
    var timer = setTimeout(function(){
      if(!done){ done=true; tryNext(); }
    }, 6000);
    img.onload = function(){
      if(!done){ done=true; clearTimeout(timer); cb(url); }
    };
    img.onerror = function(){
      if(!done){ done=true; clearTimeout(timer); tryNext(); }
    };
    img.src = url;
  }
  tryNext();
}

// ── Keyword extraction ────────────────────────────────────────────
var STOP = new Set(['the','is','are','a','an','and','to','of','in','it','that','this',
  'with','for','on','you','i','we','he','she','they','was','be','at','by','from',
  'have','do','not','but','what','when','there','has','will','their','about','just',
  'so','up','more','its','also','which','your','our','can','had','how','some','if',
  'my','me','as','get','like','know','really','very','then','than','into','out',
  'been','were','would','could','should','did','does','your','his','her','their']);

function getKeywords(text){
  var words = text.replace(/[.,!?;:'"]/g,' ').toLowerCase().split(/\s+/);
  var seen  = new Set();
  return words.filter(function(w){
    if(w.length<3 || STOP.has(w) || seen.has(w)) return false;
    seen.add(w);
    return true;
  }).slice(0,2);
}

// ── Export ────────────────────────────────────────────────────────
function doExport(){
  if(!clips.length){ showToast('Add a clip first'); return; }
  var s   = document.getElementById('exportStatus');
  var bar = document.getElementById('expBar');
  var lbl = document.getElementById('expLabel');
  s.style.display='block';
  var steps=[
    [20,'Reading clips…'],
    [50,'Processing…'],
    [80,'Preparing download…'],
    [100,'Done!']
  ];
  var i=0;
  var iv=setInterval(function(){
    if(i>=steps.length){clearInterval(iv);return;}
    bar.style.width=steps[i][0]+'%';
    lbl.textContent=steps[i][1];
    i++;
    if(i===steps.length){
      clips.forEach(function(c,idx){
        var a=document.createElement('a');
        a.href=c.url;
        a.download='impactgrid_'+(idx+1)+'.'+ext(c.file.name);
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
      showToast('Downloaded '+clips.length+' file'+(clips.length>1?'s':''));
      setTimeout(function(){s.style.display='none';},3000);
    }
  },600);
}

// ── Helpers ───────────────────────────────────────────────────────
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s){ return String(s).replace(/"/g,'&quot;'); }
function fmt(s){ var m=Math.floor(s/60),sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; }
function ext(n){ var p=n.split('.'); return p.length>1?p.pop():'mp4'; }

var toastTimer;
function showToast(msg){
  var el=document.getElementById('toast');
  if(!el){
    el=document.createElement('div');
    el.id='toast';
    el.style.cssText='position:fixed;bottom:20px;right:20px;background:#1a1a1a;color:#f0ebe5;'
      +'padding:10px 16px;border-radius:8px;font-size:13px;border-left:3px solid var(--or);'
      +'opacity:0;transition:opacity .3s;z-index:9999;font-family:"DM Sans",sans-serif';
    document.body.appendChild(el);
  }
  el.textContent=msg;
  el.style.opacity='1';
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){el.style.opacity='0';},4000);
}
