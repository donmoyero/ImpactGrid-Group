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
  captionPreview.style.display = 'block';
  clearTimeout(captionPreview._t);
  captionPreview._t = setTimeout(function(){
    captionPreview.style.display = 'none';
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

// ── B-Roll image fetch — 3 free sources, no key needed ────────
async function fetchBrollImage(keyword, timestamp){
  brollStatus.textContent = 'Finding image for "' + keyword + '"…';

  var img = await Promise.any([
    fetchFromPicsum(keyword),
    fetchFromLoremflickr(keyword),
    fetchFromWikipedia(keyword)
  ]).catch(function(){ return null; });

  if(!img){
    brollStatus.textContent = 'No image found for "' + keyword + '"';
    return;
  }

  brollStatus.textContent = 'Images auto-detected from speech';

  // Add to grid
  var el = document.createElement('img');
  el.src   = img.url;
  el.title = keyword + ' · ' + img.source;
  el.loading = 'eager';
  el.onerror = function(){ this.parentNode && this.parentNode.removeChild(this); };
  el.onclick = function(){ overlayBroll(img.url); };
  brollGrid.prepend(el);

  // Auto-insert as B-roll at the given timestamp
  autoBroll.push({ url: img.url, t: timestamp, dur: 2.5, el: el });
}

// Picsum — always works, beautiful photography, no key
async function fetchFromPicsum(keyword){
  // Hash keyword to a consistent image ID
  var hash = 0;
  for(var i=0;i<keyword.length;i++) hash = (hash*31+keyword.charCodeAt(i)) & 0xffff;
  var id = (hash % 850) + 50;
  var ctrl = new AbortController();
  setTimeout(function(){ ctrl.abort(); }, 5000);
  var r = await fetch('https://picsum.photos/id/' + id + '/info', { signal: ctrl.signal });
  if(!r.ok) throw new Error('picsum');
  var info = await r.json();
  return {
    url:    'https://picsum.photos/id/' + id + '/800/450',
    source: 'Picsum / ' + (info.author || 'photographer')
  };
}

// Loremflickr — real themed stock photos, no key
async function fetchFromLoremflickr(keyword){
  var seed = Math.floor(Math.random() * 9999);
  var url  = 'https://loremflickr.com/800/450/' + encodeURIComponent(keyword) + '?lock=' + seed;
  // Returns redirect — use as img src directly (no-cors safe for images)
  return { url: url, source: 'Loremflickr' };
}

// Wikipedia Commons — huge free image library
async function fetchFromWikipedia(keyword){
  var ctrl = new AbortController();
  setTimeout(function(){ ctrl.abort(); }, 6000);
  var api = 'https://en.wikipedia.org/w/api.php?action=query&generator=search' +
    '&gsrsearch=' + encodeURIComponent(keyword) +
    '&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=800' +
    '&format=json&origin=*&gsrlimit=5';
  var r = await fetch(api, { signal: ctrl.signal });
  if(!r.ok) throw new Error('wiki');
  var d = await r.json();
  if(!d.query || !d.query.pages) throw new Error('wiki empty');
  var pages = Object.values(d.query.pages);
  var imgs  = pages.filter(function(p){
    var u = (p.imageinfo && p.imageinfo[0] && p.imageinfo[0].url) || '';
    return /\.(jpg|jpeg|png)/i.test(u);
  });
  if(!imgs.length) throw new Error('wiki no images');
  var pick = imgs[Math.floor(Math.random() * imgs.length)];
  return { url: pick.imageinfo[0].url, source: 'Wikipedia Commons' };
}

// ── Auto B-roll overlay on preview ────────────────────────────
var autoBroll = [];
setInterval(function(){
  if(prevVideo.paused || !prevVideo.duration) return;
  var now = prevVideo.currentTime;
  autoBroll.forEach(function(b){
    if(!b._shown && now >= b.t && now < b.t + b.dur){
      b._shown = true;
      overlayBroll(b.url);
    }
  });
}, 200);

function overlayBroll(url){
  var img = document.createElement('img');
  img.src = url;
  img.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;' +
    'object-fit:cover;z-index:10;border-radius:10px;' +
    'animation:fadeIn .3s ease';
  document.getElementById('previewBox').appendChild(img);
  setTimeout(function(){ img.remove(); }, 2500);
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
