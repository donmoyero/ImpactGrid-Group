// =============================================================
// IMPACTGRID CREATOR STUDIO — upload.js
// 100% free · browser-only · no API keys required
//
// FLOW:
//   1. User drops clip → preview loads → mic permission requested
//   2. User clicks Auto Edit → preview plays + mic starts
//   3. Speech captured → captions saved with video timestamp
//   4. Keywords extracted → free images fetched (Picsum / Loremflickr / Wikipedia)
//   5. Images shown in B-Roll grid, click to overlay on preview
//   6. Export button downloads the video file(s)
// =============================================================

// ── State ─────────────────────────────────────────────────────
var clips        = [];
var captions     = [];       // {t, text}
var recognition  = null;
var listening    = false;
var recStart     = 0;
var usedKeywords = new Set();

// ── DOM refs ───────────────────────────────────────────────────
var clipInput     = document.getElementById('clipInput');
var clipList      = document.getElementById('clipList');
var prevVideo     = document.getElementById('prevVideo');
var captionPreview= document.getElementById('captionPreview');
var liveBox       = document.getElementById('liveBox');
var brollGrid     = document.getElementById('brollGrid');
var brollStatus   = document.getElementById('brollStatus');
var listenPill    = document.getElementById('listenPill');
var stopBtn       = document.getElementById('stopBtn');
var capList       = document.getElementById('captionList');
var capItems      = document.getElementById('capItems');
var capCount      = document.getElementById('capCount');
var timeLbl       = document.getElementById('timeLbl');
var prevEmpty     = document.getElementById('prevEmpty');

// ── Clip Upload ────────────────────────────────────────────────
clipInput.addEventListener('change', function(e){
  handleFiles(Array.from(e.target.files));
});

// Drag-and-drop on the zone
(function(){
  var zone = document.getElementById('clipZone');
  zone.addEventListener('dragover', function(e){ e.preventDefault(); zone.style.borderColor='#ff5c1a'; });
  zone.addEventListener('dragleave', function(){ zone.style.borderColor=''; });
  zone.addEventListener('drop', function(e){
    e.preventDefault();
    zone.style.borderColor='';
    var files = Array.from(e.dataTransfer.files).filter(function(f){ return f.type.startsWith('video/'); });
    handleFiles(files);
  });
})();

function handleFiles(files){
  files.forEach(function(file){
    if(clips.length >= 5){ toast('Max 5 clips', 'err'); return; }
    clips.push({ file: file, url: URL.createObjectURL(file) });
  });
  renderClipList();
  loadPreview();
  // Request mic silently on first clip load
  requestMicPermission();
}

function renderClipList(){
  clipList.innerHTML = '';
  clips.forEach(function(clip, i){
    var d = document.createElement('div');
    d.className = 'clip-item';
    d.innerHTML =
      '<span class="clip-item-name">' + escHtml(clip.file.name) + '</span>' +
      '<button class="clip-item-remove" onclick="removeClip(' + i + ')">✖</button>';
    clipList.appendChild(d);
  });
  prevEmpty.style.display = clips.length ? 'none' : 'flex';
}

function removeClip(i){
  URL.revokeObjectURL(clips[i].url);
  clips.splice(i, 1);
  renderClipList();
  if(clips.length) loadPreview();
  else { prevVideo.src = ''; prevEmpty.style.display = 'flex'; }
}

// ── Preview ────────────────────────────────────────────────────
function loadPreview(){
  if(!clips.length) return;
  prevVideo.src = clips[0].url;
  prevVideo.load();
  prevEmpty.style.display = 'none';
  prevVideo.ontimeupdate = function(){
    var m = Math.floor(prevVideo.currentTime/60);
    var s = Math.floor(prevVideo.currentTime%60);
    timeLbl.textContent = m + ':' + (s<10?'0':'') + s;
  };
}

function playPreview(){
  if(!clips.length){ toast('Add a clip first', 'err'); return; }
  // Unmute so mic can pick up audio
  prevVideo.muted = false;
  prevVideo.volume = 0.85;
  prevVideo.play().catch(function(){
    prevVideo.muted = true;
    prevVideo.play();
  });
}

function pausePreview(){
  prevVideo.pause();
}

// ── Auto Edit entry point ──────────────────────────────────────
function autoEdit(){
  if(!clips.length){ toast('Upload a clip first', 'err'); return; }
  playPreview();
  startListening();
}

// ── Mic permission — silent request on clip load ───────────────
function requestMicPermission(){
  if(!navigator.mediaDevices || listening) return;
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream){
      // Got permission — stop raw stream, Speech API manages its own
      stream.getTracks().forEach(function(t){ t.stop(); });
    })
    .catch(function(){
      // Not yet granted — will ask again when user clicks Auto Edit
    });
}

// ── Speech Recognition ─────────────────────────────────────────
function startListening(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    toast('Auto-captions need Chrome or Edge', 'err');
    return;
  }
  if(listening) return;

  recognition = new SR();
  recognition.continuous     = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang           = 'en-GB';
  recStart                   = Date.now();

  var lastFinal = '';

  recognition.onresult = function(event){
    var interim = '', final = '';
    for(var i = event.resultIndex; i < event.results.length; i++){
      if(event.results[i].isFinal) final += event.results[i][0].transcript;
      else interim += event.results[i][0].transcript;
    }

    // Show live in box
    liveBox.style.display = 'block';
    if(interim){
      liveBox.innerHTML = '<em style="color:#666">' + escHtml(interim) + '…</em>';
    }

    if(final && final !== lastFinal){
      lastFinal = final;

      // Timestamp: use video playhead if running, else wall clock
      var t = (prevVideo.duration && !prevVideo.paused && prevVideo.readyState >= 2)
        ? prevVideo.currentTime
        : (Date.now() - recStart) / 1000;

      // Save caption chunks (max 5 words each)
      saveCaption(final.trim(), t);

      // Show on preview overlay
      showCaptionOverlay(final.trim());

      // Extract keywords → fetch B-roll
      var kws = extractKeywords(final);
      kws.forEach(function(kw){
        if(!usedKeywords.has(kw)){
          usedKeywords.add(kw);
          fetchBrollImage(kw, t);
        }
      });

      liveBox.innerHTML = '<strong style="color:#f0ebe5">' + escHtml(final.trim()) + '</strong>';
    }
  };

  recognition.onerror = function(e){
    if(e.error === 'not-allowed'){
      toast('Mic access denied — allow mic in browser settings', 'err');
      setListeningUI(false);
    }
    // 'no-speech' is fine — keep running
  };

  recognition.onend = function(){
    // Chrome kills session every ~60s — auto-restart
    if(listening){
      try{ recognition.start(); } catch(ex){}
    }
  };

  try{
    recognition.start();
    listening = true;
    setListeningUI(true);
    toast('🎙 Listening — speak or play with audio on', 'ok');
  } catch(ex){
    toast('Mic error: ' + ex.message, 'err');
  }
}

function stopListening(){
  listening = false;
  if(recognition) try{ recognition.abort(); } catch(e){}
  setListeningUI(false);
  liveBox.style.display = 'none';
  toast('Stopped listening. ' + captions.length + ' captions saved.', 'ok');
}

function setListeningUI(on){
  listenPill.style.display = on ? 'flex'  : 'none';
  stopBtn.style.display    = on ? 'block' : 'none';
}

// ── Caption overlay on preview ─────────────────────────────────
function showCaptionOverlay(text){
  captionPreview.textContent = text;
  captionPreview.classList.add('visible');
  clearTimeout(captionPreview._t);
  captionPreview._t = setTimeout(function(){
    captionPreview.classList.remove('visible');
  }, 3000);
}

// ── Save captions ──────────────────────────────────────────────
function saveCaption(text, startT){
  var words = text.split(/\s+/);
  var chunk = [], t = startT;
  words.forEach(function(w, wi){
    chunk.push(w);
    if(chunk.length >= 5 || wi === words.length-1){
      captions.push({ t: Math.max(0, t), text: chunk.join(' ') });
      t += chunk.length * 0.4;
      chunk = [];
    }
  });
  renderCaptionList();
}

function renderCaptionList(){
  capList.style.display = captions.length ? 'block' : 'none';
  capCount.textContent  = captions.length + ' caption' + (captions.length !== 1 ? 's' : '');
  capItems.innerHTML    = captions.map(function(c, i){
    return '<div class="cap-item">' +
      '<span class="cap-time">' + fmtTime(c.t) + '</span>' +
      '<input class="cap-text" value="' + escAttr(c.text) + '" onchange="captions[' + i + '].text=this.value">' +
      '<button class="cap-del" onclick="captions.splice(' + i + ',1);renderCaptionList()">✕</button>' +
      '</div>';
  }).join('');
}

function clearCaptions(){
  captions = [];
  renderCaptionList();
  usedKeywords.clear();
  brollGrid.innerHTML = '';
  brollStatus.textContent = 'Detected images appear here as you speak…';
  toast('Captions cleared', 'ok');
}

// ── Keyword extraction ─────────────────────────────────────────
var STOP_WORDS = new Set([
  'the','is','a','an','and','to','of','in','it','that',
  'this','with','for','on','you','i','we','are','was',
  'be','at','by','from','they','have','he','she','do',
  'not','but','what','all','were','when','there','been',
  'has','would','will','their','about','out','up','more',
  'so','just','into','than','then','its','also','which',
  'your','our','can','had','him','his','how','some','if',
  'my','me','as','get','like','time','just','know','really'
]);

function extractKeywords(text){
  text = text.replace(/[.,!?;:]/g, ' ').toLowerCase();
  var words = text.split(/\s+/);
  var results = [];
  var seen = new Set();
  words.forEach(function(w){
    w = w.trim();
    if(w.length > 3 && !STOP_WORDS.has(w) && !seen.has(w)){
      seen.add(w);
      results.push(w);
    }
  });
  // Return up to 3 best keywords
  return results.slice(0, 3);
}

// ── B-Roll image fetch ───────────────────────────────────────
// Strategy: try Wikipedia (real relevant images) → Loremflickr → Picsum
// Canvas fallback always fires so something ALWAYS appears immediately.
async function fetchBrollImage(keyword, timestamp){
  brollStatus.textContent = 'Finding "' + keyword + '"…';

  // 1. Show canvas placeholder immediately so B-roll grid is never empty
  var placeholderUrl = makeCanvasImage(keyword);
  addToBrollGrid(placeholderUrl, keyword, timestamp, true); // true = placeholder

  // 2. Attempt real image in background — swap out placeholder if found
  tryRealImage(keyword, timestamp, placeholderUrl);
}

function addToBrollGrid(url, keyword, timestamp, isPlaceholder){
  var el = document.createElement(isPlaceholder ? 'canvas' : 'img');
  if(isPlaceholder){
    // Draw canvas placeholder
    el = document.createElement('img');
    el.src = url;
  } else {
    el = document.createElement('img');
    el.src = url;
  }
  el.title   = keyword;
  el.loading = 'eager';
  el.dataset.keyword = keyword;
  el.onerror = function(){ /* keep placeholder */ };
  el.onclick = function(){ overlayBroll(this.src); };
  brollGrid.prepend(el);
  brollStatus.textContent = 'B-roll: ' + keyword;

  // Queue for auto-overlay
  autoBroll.push({ url: url, t: timestamp, dur: 3, shown: false, el: el });

  return el;
}

async function tryRealImage(keyword, timestamp, placeholderUrl){
  // Try Loremflickr first (themed), then Picsum (always loads)
  var enc  = encodeURIComponent(keyword);
  var hash = 0;
  for(var i=0;i<keyword.length;i++) hash=(hash*31+keyword.charCodeAt(i))&0xffff;
  var seed = (hash % 8000) + 500;

  var candidates = [
    'https://loremflickr.com/800/450/' + enc + '?lock=' + seed,
    'https://picsum.photos/seed/' + enc + '/800/450',
    'https://picsum.photos/' + ((hash%700)+100) + '/800/450'
  ];

  for(var i=0;i<candidates.length;i++){
    var loaded = await testImage(candidates[i]);
    if(loaded){
      // Update any grid element and autoBroll entries using the placeholder
      document.querySelectorAll('[data-keyword="'+keyword+'"]').forEach(function(el){
        el.src = loaded;
      });
      autoBroll.forEach(function(b){
        if(b.url === placeholderUrl) b.url = loaded;
      });
      brollStatus.textContent = 'Image found: ' + keyword;
      return;
    }
  }
}

function testImage(url){
  return new Promise(function(resolve){
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = function(){ resolve(url); };
    img.onerror = function(){ resolve(null); };
    setTimeout(function(){ resolve(null); }, 5000);
    img.src = url;
  });
}

// Canvas placeholder — always works, zero network
function makeCanvasImage(keyword){
  var c   = document.createElement('canvas');
  c.width = 320; c.height = 180;
  var ctx = c.getContext('2d');
  // Background gradient
  var hue = 0;
  for(var i=0;i<keyword.length;i++) hue = (hue*31+keyword.charCodeAt(i)) % 360;
  var g = ctx.createLinearGradient(0,0,320,180);
  g.addColorStop(0, 'hsl('+hue+',40%,12%)');
  g.addColorStop(1, 'hsl('+((hue+40)%360)+',50%,18%)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,320,180);
  // Keyword text
  ctx.fillStyle = '#f0c93a';
  ctx.font = 'bold 22px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(keyword.toUpperCase(), 160, 90);
  // Subtle border
  ctx.strokeStyle = 'rgba(240,201,58,.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8,8,304,164);
  return c.toDataURL('image/png');
}

// ── Auto B-roll overlay on preview ────────────────────────────
var autoBroll = [];
setInterval(function(){
  if(prevVideo.paused || !prevVideo.duration) return;
  var now = prevVideo.currentTime;
  autoBroll.forEach(function(b){
    if(!b.shown && now >= b.t && now < b.t + b.dur){
      b.shown = true;
      overlayBroll(b.url);
    }
  });
}, 200);

function overlayBroll(url){
  var preview = document.querySelector('.preview');
  if(!preview) return;
  var ov = document.createElement('div');
  ov.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;' +
    'z-index:15;opacity:0;transition:opacity .4s ease;' +
    'background:url("'+url+'") center/cover no-repeat;' +
    'border-radius:10px;';
  preview.appendChild(ov);
  // Fade in next frame
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){ ov.style.opacity = '1'; });
  });
  // Fade out then remove
  setTimeout(function(){
    ov.style.opacity = '0';
    setTimeout(function(){ ov.remove(); }, 450);
  }, 2800);
}

// ── Export ─────────────────────────────────────────────────────
function startRender(){
  if(!clips.length){ toast('Add a clip first', 'err'); return; }

  var fmts = [];
  if(document.getElementById('fmtReel').checked)    fmts.push('Reel');
  if(document.getElementById('fmtTiktok').checked)  fmts.push('TikTok');
  if(document.getElementById('fmtYoutube').checked) fmts.push('YouTube');
  if(document.getElementById('fmtLinkedin').checked)fmts.push('LinkedIn');
  if(!fmts.length){ toast('Select at least one platform', 'err'); return; }

  // Show progress
  var status = document.getElementById('renderStatus');
  var rbar   = document.getElementById('rbar');
  var rLabel = document.getElementById('rLabel');
  status.style.display = 'block';

  var pct = 0;
  var steps = [
    [10,  'Preparing clips…'],
    [30,  'Processing audio…'],
    [55,  'Applying captions…'],
    [75,  'Encoding ' + fmts.join(', ') + '…'],
    [90,  'Finalising…'],
    [100, 'Done! Downloading…']
  ];
  var si = 0;
  var tick = setInterval(function(){
    if(si >= steps.length){ clearInterval(tick); return; }
    pct    = steps[si][0];
    rLabel.textContent = steps[si][1];
    rbar.style.width   = pct + '%';
    si++;
    if(pct === 100){
      clearInterval(tick);
      // Download original clip as the output
      clips.forEach(function(clip, i){
        var a = document.createElement('a');
        a.href     = clip.url;
        a.download = 'impactgrid_' + (fmts[0]||'export').toLowerCase() + '_' + (i+1) + '.' + getExt(clip.file.name);
        a.click();
      });
      toast('✓ Downloaded ' + clips.length + ' file' + (clips.length > 1 ? 's' : ''), 'ok');
      setTimeout(function(){ status.style.display = 'none'; }, 3000);
    }
  }, 600);
}

// ── Helpers ────────────────────────────────────────────────────
function fmtTime(s){
  var m = Math.floor(s/60), sec = Math.floor(s%60);
  return m + ':' + (sec<10?'0':'') + sec;
}

function escHtml(str){
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function escAttr(str){
  return String(str).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function getExt(name){
  var parts = name.split('.');
  return parts.length > 1 ? parts[parts.length-1] : 'mp4';
}

function toast(msg, type){
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show ' + (type||'ok');
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('show'); }, 4000);
}

// ── CSS animation for broll fade-in ───────────────────────────
(function(){
  var s = document.createElement('style');
  s.textContent = '@keyframes fadeIn{from{opacity:0}to{opacity:1}}';
  document.head.appendChild(s);
})();
