// ================================================================
// ImpactGrid Creator — upload.js
// Fixed version: every fake replaced with real
// ================================================================
//
var ASSEMBLY_KEY = 'YOUR_KEY_HERE';

// ── SESSION / PERSISTENCE ─────────────────────────────────────────
// TRUTH: IndexedDB stores the actual file blob.
// Survives: browser close, laptop sleep, restart.
// Does NOT survive: clearing browser storage, incognito tabs.
// Session ends when user clicks "End Session".

var IDB_NAME  = 'impactgrid_v1';
var IDB_STORE = 'session';
var idb       = null;

function openDB(cb) {
  if (idb) { cb(idb); return; }
  var req = indexedDB.open(IDB_NAME, 1);
  req.onupgradeneeded = function(e) { e.target.result.createObjectStore(IDB_STORE); };
  req.onsuccess       = function(e) { idb = e.target.result; cb(idb); };
  req.onerror         = function()  { console.warn('IndexedDB unavailable'); cb(null); };
}
function dbSet(key, val, cb) {
  openDB(function(db) {
    if (!db) { if (cb) cb(); return; }
    var tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(val, key);
    tx.oncomplete = function() { if (cb) cb(); };
    tx.onerror    = function() { if (cb) cb(); };
  });
}
function dbGet(key, cb) {
  openDB(function(db) {
    if (!db) { cb(null); return; }
    var tx  = db.transaction(IDB_STORE, 'readonly');
    var req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = function() { cb(req.result || null); };
    req.onerror   = function() { cb(null); };
  });
}
function dbDelete(key, cb) {
  openDB(function(db) {
    if (!db) { if (cb) cb(); return; }
    var tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = function() { if (cb) cb(); };
  });
}

function checkForSavedSession() {
  dbGet('sessionFile', function(blob) {
    if (blob) {
      var el = document.getElementById('restoreNotice');
      if (el) el.style.display = 'block';
      updateSessionStatus('Session saved — restore or upload new file', true);
    }
  });
}

function saveSession(blob, meta) {
  dbSet('sessionFile', blob, function() {
    dbSet('sessionMeta', meta, function() {
      updateSessionStatus('Session active · ' + meta.name, true);
      var btn = document.getElementById('endSessionBtn');
      if (btn) btn.style.display = 'inline-block';
    });
  });
}

function restoreSession() {
  dbGet('sessionFile', function(blob) {
    if (!blob) { toast('No saved session found'); return; }
    dbGet('sessionMeta', function(meta) {
      toast('Restoring session…');
      var file = new File([blob], (meta && meta.name) || 'restored-video.mp4', { type: blob.type });
      loadFile(file, true);
    });
  });
}

function endSession() {
  if (!confirm('End session? This deletes the saved video from this browser. Exported files are unaffected.')) return;
  dbDelete('sessionFile', function() {
    dbDelete('sessionMeta', function() {
      clip = null;
      if (vid) { vid.pause(); vid.src = ''; }
      isPlaying = false;
      cancelAnimationFrame(rafId);
      allWords = []; sentences = []; keywords = {}; stickers = [];
      stopMusic();
      updateSessionStatus('No session', false);
      var btn = document.getElementById('endSessionBtn');
      if (btn) btn.style.display = 'none';
      var notice = document.getElementById('restoreNotice');
      if (notice) notice.style.display = 'none';
      goTo('sDrop');
      toast('Session ended');
    });
  });
}

function updateSessionStatus(msg, active) {
  var el  = document.getElementById('sessionLabel');
  var dot = document.querySelector('.session-dot');
  if (el)  el.textContent = msg;
  if (dot) dot.style.background = active ? 'var(--green)' : 'var(--tx3)';
}

// ── STATE ─────────────────────────────────────────────────────────
var clip         = null;
var fileType     = 'video';
var activeStyle  = null;
var allWords     = [];
var sentences    = [];
var keywords     = {};   // { wordIndex: true }
var isPlaying    = false;
var rafId        = null;
var transcriptId = null;
var pollTimer    = null;
var pollRetries  = 0;
var MAX_POLL     = 240;
var isCancelled  = false;
var isMuted      = false;

var captionPos   = 'bot';
var capSize      = 22;
var captionColor = '#ffffff';
var captionBg    = 'none';
var activeWordAnim = null;

var overlayTextVal  = '';
var overlayPos      = 'mid';
var overlayFontId   = 'bold';
var overlayColor    = '#ffffff';
var overlayStyle    = 'normal';
var overlayOpacity  = 1;
var overlayOutline  = 0;
var overlayShadow   = 8;

var stickers      = [];
var activeSticker = -1;

var activeGrade   = null;
var activeFX      = null;
var customFilter  = '';
var vignetteVal   = 30;
var noiseVal      = 0;
var activeTint    = null;
var duotoneId     = null;
var activeMotion  = 'none';
var motionPhase   = 0;
var flipH = false, flipV = false;
var chromaVal = 0, distortVal = 0, scanlinesVal = 0, glowVal = 0, pixelateVal = 1;

var exportAspect  = '9:16';
var bgMode        = 'blur';
var bgColorH = 240, bgColorS = 20, bgColorL = 5;
var videoScale    = 1;
var offsetX = 0,  offsetY = 0;

var musicAudio          = null;
var musicVolume         = 0.4;
var activeMusicUrl      = null;
var _userMusicObjectURL = null;
var activeMusicCat      = 'All';
var musicFade           = 1;

var audioCtx         = null;
var audioSource      = null;
var gainNode         = null;
var hiPassFilter     = null;
var loPassFilter     = null;
var noiseGate        = null;
var eqBass = null, eqMid = null, eqTreble = null;
var reverbNode       = null;
var reverbGain       = null;
var dryGain          = null;
var exportStreamDest = null;
var audioReady       = false;

var audioSettings = {
  noiseCancelOn: false, noiseCancelAmt: 30,
  voiceBoostOn:  false,
  bassBoostOn:   false,
  reverbOn:      false, reverbMix: 0.3,
  eqBass: 0, eqMid: 0, eqTreble: 0
};
var aiEffects = { sharpen:false, smooth:false, deband:false, portraitBlur:false };

var trackVis    = { video:true, captions:true };
var tlPx        = 80;
var tlZoomLevel = 1;
var _tlDragging = false;
var _preExportW = 540, _preExportH = 960;
var exportFormat = 'mp4';
var exportFPS    = 30;
var _exportFmt   = '9:16';

// DOM refs
var vid, cv, ctx, grC, grX;

// ── DATA ──────────────────────────────────────────────────────────
var STYLES = [
  { id:'fire',       name:'🔥 Fire Pill',      desc:'Active word in orange pill',   tags:['TikTok','Viral'],    bg:'linear-gradient(150deg,#1a0400,#0d0200)',  render:renderFire },
  { id:'colourflip', name:'🎨 Colour Flip',    desc:'Words alternate white & gold', tags:['Modern','Bold'],     bg:'linear-gradient(150deg,#0a0a0a,#141414)',  render:renderColourFlip },
  { id:'cinematic',  name:'🎬 Cinematic',      desc:'Elegant blue-toned fade',      tags:['Film','Premium'],    bg:'linear-gradient(150deg,#000814,#001233)',  render:renderCinematic },
  { id:'hype',       name:'⚡ Hype Centre',    desc:'Keyword explodes full screen', tags:['Sports','Launch'],   bg:'linear-gradient(150deg,#1a1000,#080400)',  render:renderHype },
  { id:'karaoke',    name:'💜 Neon Karaoke',   desc:'Dark bar, gold active word',   tags:['Podcast','Night'],   bg:'linear-gradient(150deg,#05000f,#0f0020)',  render:renderKaraoke },
  { id:'split',      name:'✂ Bold Split',     desc:'Keyword huge, rest minimal',   tags:['Drama','Impact'],    bg:'linear-gradient(150deg,#080808,#040404)',  render:renderSplit },
  { id:'typewriter', name:'⌨ Typewriter',    desc:'Words type in with cursor',    tags:['Clean','Satisfy'],   bg:'linear-gradient(150deg,#081a10,#040f06)',  render:renderTypewriter },
  { id:'bounce',     name:'🎵 Bounce',         desc:'Words bounce with hue-shift',  tags:['Music','Fun'],       bg:'linear-gradient(150deg,#0d0020,#1a0030)',  render:renderBounce },
  { id:'minimal',    name:'◽ Minimal',        desc:'Thin clean luxury text',       tags:['Luxury','Brand'],    bg:'linear-gradient(150deg,#0a0a0a,#111)',     render:renderMinimal },
  { id:'glitch',     name:'⚡ Glitch RGB',    desc:'RGB split on keywords',        tags:['Edgy','Tech'],       bg:'linear-gradient(150deg,#000a00,#050505)',  render:renderGlitch },
  { id:'chromarpt',  name:'💥 Chroma Repeat', desc:'Keyword tiles screen w/ RGB',  tags:['Viral','TikTok'],    bg:'linear-gradient(150deg,#000814,#0a0000)',  render:renderChromaRepeat },
  { id:'scanline',   name:'📺 Giant Scanline', desc:'Keyword huge with scanlines',  tags:['Impact','Drama'],    bg:'linear-gradient(150deg,#080808,#141414)',  render:renderScanline }
];
activeStyle = STYLES[0];

var WORD_ANIMS = [
  { id:'default', name:'Default' },
  { id:'slam',    name:'💥 Slam' },
  { id:'pop',     name:'⭕ Pop' },
  { id:'glow',    name:'✨ Glow' },
  { id:'shake',   name:'📳 Shake' },
  { id:'rise',    name:'⬆ Rise' },
  { id:'zoom',    name:'🔍 Zoom' }
];

var GRADES = [
  { id:'none',   name:'Original', bg:'#2a2a2a',                                      filter:'none' },
  { id:'warm',   name:'Warm',     bg:'linear-gradient(135deg,#3d1a00,#8b4500)',       filter:'brightness(1.05) saturate(1.3) sepia(0.18)' },
  { id:'cold',   name:'Cold',     bg:'linear-gradient(135deg,#001233,#0a3d6e)',       filter:'brightness(0.95) saturate(0.75) hue-rotate(185deg)' },
  { id:'vivid',  name:'Vivid',    bg:'linear-gradient(135deg,#1a0030,#003030)',       filter:'brightness(1.07) saturate(1.9) contrast(1.1)' },
  { id:'noir',   name:'Noir',     bg:'linear-gradient(135deg,#000,#2a2a2a)',         filter:'grayscale(1) contrast(1.35) brightness(0.88)' },
  { id:'golden', name:'Golden',   bg:'linear-gradient(135deg,#2a1a00,#6b4a00)',      filter:'brightness(1.08) saturate(1.2) sepia(0.4)' },
  { id:'moody',  name:'Moody',    bg:'linear-gradient(135deg,#0a0014,#140028)',      filter:'brightness(0.8) saturate(0.72) contrast(1.18)' },
  { id:'sunset', name:'Sunset',   bg:'linear-gradient(135deg,#3d0a00,#8b2000)',      filter:'brightness(1.06) saturate(1.5) hue-rotate(-18deg)' },
  { id:'fresh',  name:'Fresh',    bg:'linear-gradient(135deg,#002200,#004400)',      filter:'brightness(1.06) saturate(1.1) hue-rotate(12deg)' },
  { id:'cyber',  name:'Cyber',    bg:'linear-gradient(135deg,#001a2a,#002a3a)',      filter:'brightness(1.02) saturate(1.4) hue-rotate(160deg) contrast(1.1)' },
  { id:'hard',   name:'Hard',     bg:'linear-gradient(135deg,#111,#333)',           filter:'contrast(1.5) brightness(0.92)' }
];

var FX_PRESETS = [
  { id:'none',  name:'None',    filter:'none',                                                  bg:'#2a2a2a' },
  { id:'vhs',   name:'VHS',     filter:'saturate(1.4) contrast(1.15) brightness(0.95)',          bg:'linear-gradient(135deg,#1a0000,#000)' },
  { id:'film',  name:'Film',    filter:'sepia(0.3) contrast(1.1) brightness(0.92)',              bg:'linear-gradient(135deg,#2a1a00,#1a1000)' },
  { id:'neon',  name:'Neon',    filter:'saturate(2) brightness(1.1) contrast(1.2)',              bg:'linear-gradient(135deg,#000020,#000040)' },
  { id:'matte', name:'Matte',   filter:'contrast(0.85) brightness(1.05) saturate(0.9)',          bg:'linear-gradient(135deg,#1a1a2a,#2a2a3a)' },
  { id:'pop',   name:'Pop Art', filter:'saturate(2.5) contrast(1.3)',                            bg:'linear-gradient(135deg,#2a0030,#003030)' },
  { id:'cine',  name:'Cine',    filter:'brightness(0.9) contrast(1.1) saturate(0.8) sepia(0.15)',bg:'linear-gradient(135deg,#0a0a14,#141428)' },
  { id:'fade',  name:'Fade',    filter:'brightness(1.1) contrast(0.82) saturate(0.75)',          bg:'linear-gradient(135deg,#2a2a3a,#3a3a4a)' }
];

var MOTIONS = [
  { id:'none',     name:'None' },
  { id:'slowzoom', name:'Ken Burns' },
  { id:'shake',    name:'Handheld' },
  { id:'drift',    name:'Drift' },
  { id:'pulse',    name:'Pulse' }
];

var SPEEDS = [
  { label:'0.25×', val:0.25 },
  { label:'0.5×',  val:0.5  },
  { label:'1×',    val:1    },
  { label:'1.5×',  val:1.5  },
  { label:'2×',    val:2    }
];

var RATIOS = [
  { id:'9:16',   name:'Reel',     icon:'📱', w:540,  h:960  },
  { id:'16:9',   name:'YouTube',  icon:'▶',  w:1280, h:720  },
  { id:'1:1',    name:'Square',   icon:'⬛', w:720,  h:720  },
  { id:'4:5',    name:'Portrait', icon:'📷', w:720,  h:900  },
  { id:'2.35:1', name:'Cinema',   icon:'🎬', w:1280, h:544  }
];

var EXPORT_PLATFORMS = [
  { id:'tiktok',    name:'TikTok / Reels',  desc:'9:16 · 1080×1920',    ratio:'9:16',  icon:'📱' },
  { id:'youtube',   name:'YouTube',          desc:'16:9 · 1920×1080',    ratio:'16:9',  icon:'▶'  },
  { id:'instagram', name:'Instagram Post',   desc:'1:1 · 1080×1080',     ratio:'1:1',   icon:'📸' },
  { id:'linkedin',  name:'LinkedIn',         desc:'16:9 · Professional', ratio:'16:9',  icon:'💼' }
];

var FONTS = [
  { id:'bold',     label:'Bold',    family:'"DM Sans",sans-serif',           weight:'700' },
  { id:'black',    label:'Black',   family:'"DM Sans",sans-serif',           weight:'900' },
  { id:'playfair', label:'Elegant', family:'"Playfair Display",serif',       weight:'900' },
  { id:'bebas',    label:'Display', family:'"Bebas Neue","Oswald",sans-serif',weight:'400' },
  { id:'mono',     label:'Mono',    family:'"Courier New",monospace',        weight:'700' },
  { id:'oswald',   label:'Oswald',  family:'"Oswald",sans-serif',            weight:'600' }
];

var TEXT_STYLES = [
  { id:'normal', label:'Normal' },
  { id:'italic', label:'Italic' },
  { id:'upper',  label:'CAPS'   },
  { id:'lower',  label:'lower'  }
];

var COLORS     = ['#ffffff','#f5c842','#7c5cfc','#ff4d6d','#22d3ee','#4ade80','#f97316','#e879f9','#ff5c1a','#000000'];
var CAP_COLORS = ['#ffffff','#f5c842','#ff5c1a','#22d3ee','#4ade80','#ff4d6d','#c084fc'];

var TINTS = [
  { color:'transparent',          label:'None'   },
  { color:'rgba(255,100,0,0.15)', label:'Warm'   },
  { color:'rgba(0,100,255,0.15)', label:'Cool'   },
  { color:'rgba(100,0,200,0.15)', label:'Purple' },
  { color:'rgba(0,200,100,0.15)', label:'Green'  },
  { color:'rgba(255,200,0,0.12)', label:'Gold'   },
  { color:'rgba(255,0,80,0.12)',  label:'Red'    }
];

var DUOTONES = [
  { id:'none',   a:'#000000', b:'#ffffff', label:'None'   },
  { id:'purple', a:'#0d0030', b:'#c084fc', label:'Purple' },
  { id:'orange', a:'#1a0500', b:'#f97316', label:'Fire'   },
  { id:'cyan',   a:'#001a1a', b:'#22d3ee', label:'Cyan'   },
  { id:'gold',   a:'#0a0800', b:'#f5c842', label:'Gold'   },
  { id:'pink',   a:'#1a0010', b:'#e879f9', label:'Pink'   },
  { id:'green',  a:'#001a00', b:'#4ade80', label:'Green'  }
];

var MUSIC_LIBRARY = [
  { name:'Lo-Fi Chill',       vibe:'Calm · 88 BPM',    icon:'🎧', cat:'Chill',      url:'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { name:'Acoustic Vibe',     vibe:'Warm · 85 BPM',    icon:'🎸', cat:'Chill',      url:'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3' },
  { name:'Soft Piano',        vibe:'Gentle · 68 BPM',  icon:'🎹', cat:'Chill',      url:'https://cdn.pixabay.com/audio/2022/01/18/audio_d1718ab2c0.mp3' },
  { name:'Epic Cinematic',    vibe:'Intense · 120 BPM',icon:'🎬', cat:'Cinematic',  url:'https://cdn.pixabay.com/audio/2022/03/15/audio_d75ef65dbc.mp3' },
  { name:'Inspiring Ambient', vibe:'Calm · 70 BPM',    icon:'🌊', cat:'Cinematic',  url:'https://cdn.pixabay.com/audio/2023/03/09/audio_5b576b7e2b.mp3' },
  { name:'Upbeat Corporate',  vibe:'Positive · 115 BPM',icon:'💼',cat:'Upbeat',     url:'https://cdn.pixabay.com/audio/2022/10/25/audio_946c1c7a09.mp3' },
  { name:'Energetic Pop',     vibe:'Fun · 128 BPM',    icon:'🎉', cat:'Upbeat',     url:'https://cdn.pixabay.com/audio/2022/11/17/audio_febc508520.mp3' },
  { name:'Hip Hop Beat',      vibe:'Cool · 95 BPM',    icon:'🔥', cat:'Hip-Hop',    url:'https://cdn.pixabay.com/audio/2022/10/16/audio_31e3b04264.mp3' },
  { name:'Trap Anthem',       vibe:'Hard · 140 BPM',   icon:'👑', cat:'Hip-Hop',    url:'https://cdn.pixabay.com/audio/2022/09/02/audio_2dde668d05.mp3' },
  { name:'Synthwave Drive',   vibe:'Retro · 105 BPM',  icon:'🌆', cat:'Electronic', url:'https://cdn.pixabay.com/audio/2022/06/08/audio_6c8eff8a38.mp3' }
];

var STICKER_CATS = {
  'Popular': ['🔥','⚡','💯','🎯','💪','🙌','👏','❤️','💫','✨','🌟','⭐','🎉','🚀','💥','👑','😍','🤩','💰','🤑'],
  'Faces':   ['😂','😭','🤣','😤','🥶','🥵','😎','🤯','😱','🥹','😡','🤔','😴','🤗','😏','🤪'],
  'Hands':   ['👍','👎','🤙','✌️','🤞','🤟','👊','✊','🙏','👋','🫶','🫵','👈','👉','☝️'],
  'Objects': ['💎','📱','🎤','🎬','📸','🎶','🏆','🥇','💡','🔑','⚡','🌈','🌙','☀️','🎮']
};

var AI_EFFECTS_LIST = [
  { id:'sharpen',      icon:'🔬', name:'AI Sharpen',    desc:'Crisp detail',    audio:false },
  { id:'smooth',       icon:'✨', name:'Skin Smooth',   desc:'Soft skin tone',  audio:false },
  { id:'deband',       icon:'🌈', name:'Deband',        desc:'Remove banding',  audio:false },
  { id:'portraitBlur', icon:'🌅', name:'Portrait Blur', desc:'BG depth blur',   audio:false },
  { id:'denoise',      icon:'🔇', name:'Noise Cancel',  desc:'Clean audio',     audio:true  },
  { id:'voiceBoost',   icon:'🎤', name:'Voice Boost',   desc:'Presence boost',  audio:true  },
  { id:'bassBoost',    icon:'🔊', name:'Bass Boost',    desc:'Low-end punch',   audio:true  },
  { id:'reverb',       icon:'🏛', name:'Reverb',        desc:'Room ambience',   audio:true  }
];

// ── INIT ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  vid = document.getElementById('masterVid');
  cv  = document.getElementById('cv');
  if (cv) {
    ctx = cv.getContext('2d');
    grC = document.createElement('canvas');
    grX = grC.getContext('2d');
  }

  var fileIn = document.getElementById('fileIn');
  if (fileIn) fileIn.onchange = function(e) {
    if (e.target.files && e.target.files[0]) loadFile(e.target.files[0]);
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  // Drag and drop on the dz-inner div
  var inner = document.getElementById('dzInner');
  if (inner) {
    inner.addEventListener('dragover',  function(e) { e.preventDefault(); e.stopPropagation(); inner.classList.add('drag'); });
    inner.addEventListener('dragenter', function(e) { e.preventDefault(); e.stopPropagation(); inner.classList.add('drag'); });
    inner.addEventListener('dragleave', function()  { inner.classList.remove('drag'); });
    inner.addEventListener('dragend',   function()  { inner.classList.remove('drag'); });
    inner.addEventListener('drop', function(e) {
      e.preventDefault(); e.stopPropagation(); inner.classList.remove('drag');
      var files = e.dataTransfer.files;
      var f = Array.from(files).find(function(x) {
        return x.type.startsWith('video/') || x.type.startsWith('image/');
      });
      if (f) loadFile(f);
      else toast('⚠ No supported video or image found');
    });
  }

  buildStyleGrid();
  checkForSavedSession();
  window.addEventListener('resize', fitCanvas);
});

// ── CANVAS FIT ────────────────────────────────────────────────────
function fitCanvas() {
  var outer = document.getElementById('canvasOuter');
  var wrap  = document.getElementById('canvasWrap');
  if (!outer || !wrap || !cv) return;
  var ow = outer.offsetWidth  - 24;
  var oh = outer.offsetHeight - 24;
  var ratio = cv.width / cv.height;
  var w, h;
  if (ow / oh > ratio) { h = oh; w = h * ratio; }
  else                  { w = ow; h = w / ratio; }
  wrap.style.width  = Math.floor(w) + 'px';
  wrap.style.height = Math.floor(h) + 'px';
}

// ── SCREENS ───────────────────────────────────────────────────────
function goTo(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ── FILE LOAD ─────────────────────────────────────────────────────
var ALLOWED_EXT = ['mp4','mov','webm','mkv','avi','jpg','jpeg','png','gif','webp'];

function loadFile(f, isRestore) {
  if (!f) return;
  if (f.size > 500 * 1024 * 1024) { toast('⚠ File too large — max 500 MB'); return; }
  var ext = f.name.split('.').pop().toLowerCase();
  if (!ALLOWED_EXT.includes(ext)) { toast('⚠ Unsupported file type: .' + ext); return; }

  fileType = f.type.startsWith('image/') ? 'image' : 'video';
  if (clip && clip.url) URL.revokeObjectURL(clip.url);
  clip = { file: f, url: URL.createObjectURL(f) };

  var fcIcon = document.getElementById('fcIcon');
  var fcName = document.getElementById('fcName');
  if (fcIcon) fcIcon.textContent = fileType === 'image' ? '🖼' : '🎬';
  if (fcName) fcName.textContent = f.name;

  if (fileType === 'video' && vid) {
    vid.src = clip.url;
    vid.onloadedmetadata = function() {
      if (fcName) fcName.textContent = f.name + ' · ' + ft(vid.duration);
    };
  }

  if (!isRestore) {
    saveSession(f, { name: f.name, type: f.type, size: f.size, savedAt: Date.now() });
  } else {
    updateSessionStatus('Session restored · ' + f.name, true);
    var btn = document.getElementById('endSessionBtn');
    if (btn) btn.style.display = 'inline-block';
  }

  var msg = document.getElementById('noFileMsg');
  if (msg) msg.style.display = 'none';
  goTo('sStyle');
}

// ── STYLE GRID ────────────────────────────────────────────────────
var DEMOS = {
  fire:       '<div style="display:flex;gap:3px;align-items:center"><span style="background:#f97316;color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:800">FIRE</span><span style="color:rgba(255,255,255,.2);font-size:9px;font-weight:700">WORD</span></div>',
  colourflip: '<span style="color:#fff;font-size:11px;font-weight:800">YOUR </span><span style="color:#f5c842;font-size:11px;font-weight:800">WORD </span><span style="color:rgba(255,255,255,.2);font-size:11px;font-weight:800">HERE</span>',
  cinematic:  '<span style="color:#93c5fd;font-size:10px;font-weight:400;letter-spacing:2px">YOUR WORDS</span>',
  hype:       '<span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:34px;color:#f5c842;line-height:1">HYPE</span>',
  karaoke:    '<div style="background:rgba(5,0,15,.97);padding:4px 10px;border-top:2px solid #a855f7"><span style="color:rgba(192,132,252,.3);font-size:10px;font-weight:700">YOUR </span><span style="color:#f5c842;font-size:10px;font-weight:700">WORDS </span><span style="color:rgba(192,132,252,.2);font-size:10px;font-weight:700">HERE</span></div>',
  split:      '<div style="text-align:center"><div style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:28px;color:#fff;letter-spacing:2px;line-height:1">BOLD</div><div style="font-size:8px;color:rgba(255,255,255,.25);margin-top:2px">rest below</div></div>',
  typewriter: '<span style="color:#4ade80;font-size:11px;font-weight:700;font-family:monospace">YOUR WORDS▌</span>',
  bounce:     '<span style="color:hsl(280,100%,70%);font-size:11px;font-weight:800">SH</span><span style="color:hsl(330,100%,65%);font-size:15px;font-weight:800;display:inline-block;transform:translateY(-3px)">AK</span><span style="color:hsl(15,100%,65%);font-size:11px;font-weight:800">E</span>',
  minimal:    '<span style="color:rgba(255,255,255,.8);font-size:9px;font-weight:300;letter-spacing:4px">MINIMAL</span>',
  glitch:     '<div style="position:relative;display:inline-block;height:18px;width:60px"><span style="color:#ff0044;font-size:11px;font-weight:800;position:absolute;transform:translate(-2px,1px);opacity:.7">GLTCH</span><span style="color:#00ffcc;font-size:11px;font-weight:800;position:absolute;transform:translate(2px,-1px);opacity:.7">GLTCH</span><span style="color:#fff;font-size:11px;font-weight:800;position:relative">GLTCH</span></div>',
  chromarpt:  '<div style="text-align:center;line-height:1.2"><div style="color:rgba(255,50,50,.5);font-size:7px;font-weight:800;letter-spacing:1px">BOOKKEEPING</div><div style="color:rgba(50,255,255,.5);font-size:7px;font-weight:800;letter-spacing:1px">BOOKKEEPING</div><div style="color:#fff;font-size:7px;font-weight:800;letter-spacing:1px">BOOKKEEPING</div></div>',
  scanline:   '<span style="font-size:26px;font-weight:900;color:#fff;font-family:sans-serif;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.4) 3px,rgba(0,0,0,.4) 4px);-webkit-background-clip:text;background-clip:text">BIG</span>'
};

function buildStyleGrid() {
  var grid = document.getElementById('styleGrid');
  if (!grid) return;
  grid.innerHTML = '';
  STYLES.forEach(function(s, si) {
    var card = document.createElement('div');
    card.className = 'sc' + (si === 0 ? ' sel' : '');
    card.innerHTML =
      '<div class="sc-demo" style="background:' + s.bg + '">' + (DEMOS[s.id] || '') + '<div class="sc-tick">✓</div></div>' +
      '<div class="sc-body"><div class="sc-name">' + s.name + '</div><div class="sc-desc">' + s.desc + '</div>' +
      '<div class="sc-tags">' + s.tags.map(function(t) { return '<span class="sc-tag">' + t + '</span>'; }).join('') + '</div></div>';
    card.onclick = function() {
      document.querySelectorAll('.sc').forEach(function(c) { c.classList.remove('sel'); });
      card.classList.add('sel');
      activeStyle = s;
      setTimeout(processWithAssemblyAI, 180);
    };
    grid.appendChild(card);
  });
}

// ── BUILD PANELS ──────────────────────────────────────────────────
function buildAllPanels() {
  buildCaptionList(); buildWordAnimGrid(); buildCapColors(); buildCapBg();
  buildFontGrid(); buildColorStrip(); buildTxtStyleRow(); buildStickerGrid();
  buildGradeGrid(); buildTintGrid(); buildDuotoneRow(); buildFXGrid();
  buildMotionBtns(); buildSpeedGrid(); buildRatioGrid(); buildBgOpts();
  buildMusicCats(); buildMusicList(); buildExportPlatforms(); buildAIGrid();
  rebuildKeywordEditor();
}

function buildCaptionList() {
  var list = document.getElementById('miniStyles'); if (!list) return; list.innerHTML = '';
  STYLES.forEach(function(s, si) {
    var btn = document.createElement('button');
    btn.className = 'csb' + (si === 0 ? ' active-style' : '');
    btn.innerHTML = '<div class="csb-prev" style="background:' + s.bg + '"><div style="transform:scale(0.55);pointer-events:none">' + (DEMOS[s.id] || '') + '</div></div><div><div class="csb-name">' + s.name + '</div><div class="csb-tag">' + s.tags.join(' · ') + '</div></div>';
    btn.onclick = function() {
      activeStyle = s;
      document.querySelectorAll('.csb').forEach(function(x) { x.classList.remove('active-style'); });
      btn.classList.add('active-style');
      var sb = document.getElementById('styleBadge'); if (sb) sb.textContent = s.name;
      var rs = document.getElementById('rpStyle');    if (rs) rs.textContent = s.name;
      if (!isPlaying) drawFrame(); toast(s.name + ' applied');
    };
    list.appendChild(btn);
  });
}

function buildWordAnimGrid() {
  var g = document.getElementById('wordAnimGrid'); if (!g) return; g.innerHTML = '';
  WORD_ANIMS.forEach(function(wa, i) {
    var b = document.createElement('button');
    b.className = 'wa-btn' + (i === 0 ? ' active-wa' : '');
    b.textContent = wa.name;
    b.onclick = function() {
      activeWordAnim = i === 0 ? null : wa;
      document.querySelectorAll('.wa-btn').forEach(function(x) { x.classList.remove('active-wa'); });
      b.classList.add('active-wa');
      if (!isPlaying) drawFrame();
    };
    g.appendChild(b);
  });
}

function buildCapColors() {
  var c = document.getElementById('capColors'); if (!c) return; c.innerHTML = '';
  CAP_COLORS.forEach(function(col, i) {
    var d = document.createElement('div');
    d.className = 'col-dot' + (i === 0 ? ' active' : '');
    d.style.background = col;
    d.onclick = function() {
      captionColor = col;
      document.querySelectorAll('#capColors .col-dot').forEach(function(x) { x.classList.remove('active'); });
      d.classList.add('active');
      if (!isPlaying) drawFrame();
    };
    c.appendChild(d);
  });
}

function buildCapBg() {
  var r = document.getElementById('capBgRow'); if (!r) return; r.innerHTML = '';
  ['None','Box','Pill','Underline'].forEach(function(opt, i) {
    var b = document.createElement('button');
    b.className = 'pill-btn' + (i === 0 ? ' active' : '');
    b.textContent = opt;
    b.onclick = function() {
      captionBg = opt.toLowerCase();
      document.querySelectorAll('#capBgRow .pill-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active');
      if (!isPlaying) drawFrame();
    };
    r.appendChild(b);
  });
}

function buildFontGrid() {
  var g = document.getElementById('fontGrid'); if (!g) return; g.innerHTML = '';
  FONTS.forEach(function(f, i) {
    var b = document.createElement('div');
    b.className = 'font-btn' + (i === 0 ? ' active' : '');
    b.style.fontFamily = f.family; b.style.fontWeight = f.weight; b.textContent = f.label;
    b.onclick = function() {
      overlayFontId = f.id;
      document.querySelectorAll('.font-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame();
    };
    g.appendChild(b);
  });
}

function buildColorStrip() {
  var s = document.getElementById('colorStrip'); if (!s) return; s.innerHTML = '';
  COLORS.forEach(function(c, i) {
    var d = document.createElement('div');
    d.className = 'col-dot' + (i === 0 ? ' active' : '');
    d.style.background = c;
    if (c === '#000000') d.style.border = '2px solid rgba(255,255,255,.2)';
    d.onclick = function() {
      overlayColor = c;
      document.querySelectorAll('#colorStrip .col-dot').forEach(function(x) { x.classList.remove('active'); });
      d.classList.add('active'); if (!isPlaying) drawFrame();
    };
    s.appendChild(d);
  });
}

function buildTxtStyleRow() {
  var r = document.getElementById('txtStyleRow'); if (!r) return; r.innerHTML = '';
  TEXT_STYLES.forEach(function(ts, i) {
    var b = document.createElement('button');
    b.className = 'txts-btn' + (i === 0 ? ' active' : '');
    b.textContent = ts.label;
    b.onclick = function() {
      overlayStyle = ts.id;
      document.querySelectorAll('.txts-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame();
    };
    r.appendChild(b);
  });
}

function buildStickerGrid(filter) {
  var g = document.getElementById('stickerGrid'); if (!g) return; g.innerHTML = '';
  var pool = [];
  if (filter) {
    Object.values(STICKER_CATS).forEach(function(arr) { pool = pool.concat(arr); });
    pool = pool.filter(function(em) { return em.includes(filter) || filter === ''; });
  } else {
    pool = STICKER_CATS['Popular'];
  }
  pool.slice(0, 60).forEach(function(em) {
    var b = document.createElement('button');
    b.className = 'stk-btn'; b.textContent = em;
    b.onclick = function() { addSticker(em); };
    g.appendChild(b);
  });
}

function filterStickers(val) { buildStickerGrid(val || null); }

function buildGradeGrid() {
  var g = document.getElementById('gradeGrid'); if (!g) return; g.innerHTML = '';
  GRADES.forEach(function(gr, i) {
    var b = document.createElement('div');
    b.className = 'grade-btn' + (i === 0 ? ' active' : '');
    b.style.background = gr.bg; b.textContent = gr.name;
    b.onclick = function() {
      activeGrade = i === 0 ? null : gr; customFilter = ''; resetGradeSliders();
      document.querySelectorAll('.grade-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame(); toast('Grade: ' + gr.name);
    };
    g.appendChild(b);
  });
}

function buildTintGrid() {
  var g = document.getElementById('tintGrid'); if (!g) return; g.innerHTML = '';
  TINTS.forEach(function(t, i) {
    var b = document.createElement('div');
    b.className = 'dot-item' + (i === 0 ? ' active' : '');
    b.style.background = i === 0 ? '#333' : t.color;
    if (i === 0) b.style.border = '2px dashed rgba(255,255,255,.3)';
    b.title = t.label;
    b.onclick = function() {
      activeTint = i === 0 ? null : t;
      document.querySelectorAll('#tintGrid .dot-item').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame(); toast('Tint: ' + t.label);
    };
    g.appendChild(b);
  });
}

function buildDuotoneRow() {
  var r = document.getElementById('duotoneRow'); if (!r) return; r.innerHTML = '';
  DUOTONES.forEach(function(dt, i) {
    var b = document.createElement('div');
    b.className = 'dt-item' + (i === 0 ? ' active' : '');
    b.style.background = i === 0 ? '#333' : 'linear-gradient(135deg,' + dt.a + ',' + dt.b + ')';
    if (i === 0) b.style.border = '2px dashed rgba(255,255,255,.3)';
    b.title = dt.label;
    b.onclick = function() {
      duotoneId = i === 0 ? null : dt;
      document.querySelectorAll('#duotoneRow .dt-item').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame(); toast('Duotone: ' + dt.label);
    };
    r.appendChild(b);
  });
}

function buildFXGrid() {
  var g = document.getElementById('fxGrid'); if (!g) return; g.innerHTML = '';
  FX_PRESETS.forEach(function(fx, i) {
    var b = document.createElement('div');
    b.className = 'fx-btn' + (i === 0 ? ' active' : '');
    b.style.background = fx.bg; b.textContent = fx.name;
    b.onclick = function() {
      activeFX = i === 0 ? null : fx; customFilter = '';
      document.querySelectorAll('.fx-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame(); toast('Filter: ' + fx.name);
    };
    g.appendChild(b);
  });
}

function buildMotionBtns() {
  var w = document.getElementById('motionBtns'); if (!w) return; w.innerHTML = '';
  MOTIONS.forEach(function(m, i) {
    var b = document.createElement('button');
    b.className = 'pill-btn' + (i === 0 ? ' active' : '');
    b.textContent = m.name;
    b.onclick = function() {
      activeMotion = m.id;
      document.querySelectorAll('#motionBtns .pill-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); toast('Motion: ' + m.name);
    };
    w.appendChild(b);
  });
}

function buildSpeedGrid() {
  var g = document.getElementById('speedGrid'); if (!g) return; g.innerHTML = '';
  SPEEDS.forEach(function(sp, i) {
    var b = document.createElement('button');
    b.className = 'pill-btn' + (i === 2 ? ' active' : '');
    b.textContent = sp.label;
    b.onclick = function() {
      if (vid) vid.playbackRate = sp.val;
      document.querySelectorAll('#speedGrid .pill-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); toast('Speed: ' + sp.label);
    };
    g.appendChild(b);
  });
}

function buildRatioGrid() {
  var g = document.getElementById('ratioGrid'); if (!g) return; g.innerHTML = '';
  RATIOS.forEach(function(r, i) {
    var b = document.createElement('div');
    b.className = 'ratio-btn' + (i === 0 ? ' active' : '');
    b.innerHTML = '<div class="ratio-icon">' + r.icon + '</div><div class="ratio-name">' + r.name + '</div><div class="ratio-val">' + r.id + '</div>';
    b.onclick = function() {
      if (!cv) return;
      exportAspect = r.id; cv.width = r.w; cv.height = r.h;
      var rb = document.getElementById('resBadge'); if (rb) rb.textContent = r.id;
      document.querySelectorAll('.ratio-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); fitCanvas(); if (!isPlaying) drawFrame(); toast('Ratio: ' + r.id);
    };
    g.appendChild(b);
  });
}

function buildBgOpts() {
  var c = document.getElementById('bgOpts'); if (!c) return; c.innerHTML = '';
  ['blur','black','white','gradient','custom'].forEach(function(opt, i) {
    var b = document.createElement('button');
    b.className = 'pill-btn' + (i === 0 ? ' active' : '');
    b.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
    b.onclick = function() {
      bgMode = opt;
      document.querySelectorAll('#bgOpts .pill-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); if (!isPlaying) drawFrame();
    };
    c.appendChild(b);
  });
}

function buildMusicCats() {
  var c = document.getElementById('musicCats'); if (!c) return; c.innerHTML = '';
  ['All','Chill','Cinematic','Upbeat','Hip-Hop','Electronic'].forEach(function(cat, i) {
    var b = document.createElement('button');
    b.className = 'mcat-btn' + (i === 0 ? ' active' : '');
    b.textContent = cat;
    b.onclick = function() {
      activeMusicCat = cat;
      document.querySelectorAll('.mcat-btn').forEach(function(x) { x.classList.remove('active'); });
      b.classList.add('active'); buildMusicList();
    };
    c.appendChild(b);
  });
}

function buildMusicList() {
  var list = document.getElementById('musicList'); if (!list) return; list.innerHTML = '';
  MUSIC_LIBRARY.filter(function(t) {
    return activeMusicCat === 'All' || t.cat === activeMusicCat;
  }).forEach(function(t) {
    var item = document.createElement('div');
    item.className = 'music-item' + (activeMusicUrl === t.url ? ' playing' : '');
    item.innerHTML = '<div class="mi-icon">' + t.icon + '</div><div class="mi-info"><div class="mi-name">' + t.name + '</div><div class="mi-vibe">' + t.vibe + '</div></div><div class="mi-bars"><div class="mi-bar"></div><div class="mi-bar"></div><div class="mi-bar"></div></div>';
    item.onclick = function() {
      if (activeMusicUrl === t.url) { stopMusic(); item.classList.remove('playing'); }
      else { playMusic(t.url, item); }
    };
    list.appendChild(item);
  });
}

function buildExportPlatforms() {
  var c = document.getElementById('exportPlatforms'); if (!c) return; c.innerHTML = '';
  EXPORT_PLATFORMS.forEach(function(p, i) {
    var b = document.createElement('button');
    b.className = 'csb' + (i === 0 ? ' active-style' : '');
    b.style.marginBottom = '4px';
    b.innerHTML = '<div style="font-size:18px;flex-shrink:0">' + p.icon + '</div><div><div class="csb-name">' + p.name + '</div><div class="csb-tag">' + p.desc + '</div></div>';
    b.onclick = function() {
      if (!cv) return;
      _exportFmt = p.ratio;
      var r = RATIOS.find(function(x) { return x.id === p.ratio; }) || RATIOS[0];
      cv.width = r.w; cv.height = r.h;
      var rb = document.getElementById('resBadge'); if (rb) rb.textContent = p.ratio;
      document.querySelectorAll('#exportPlatforms .csb').forEach(function(x) { x.classList.remove('active-style'); });
      b.classList.add('active-style'); fitCanvas(); if (!isPlaying) drawFrame(); toast(p.name + ' preset');
    };
    c.appendChild(b);
  });
}

function buildAIGrid() {
  var g = document.getElementById('aiGrid'); if (!g) return; g.innerHTML = '';
  AI_EFFECTS_LIST.forEach(function(ae) {
    var b = document.createElement('button');
    b.className = 'ai-btn'; b.id = 'aibtn_' + ae.id;
    b.innerHTML = '<span class="ai-icon">' + ae.icon + '</span><span class="ai-name">' + ae.name + '</span><span class="ai-desc">' + ae.desc + '</span>';
    b.onclick = function() { applyAIEffect(ae.id); };
    g.appendChild(b);
  });
}

// ── KEYWORD SYSTEM ────────────────────────────────────────────────
function rebuildKeywordEditor() {
  var container = document.getElementById('kwWords'); if (!container) return;
  if (!allWords.length) {
    container.innerHTML = '<span style="font-size:11px;color:var(--tx3)">Transcribe a video to see words here</span>';
    return;
  }
  container.innerHTML = '';
  allWords.forEach(function(wObj, i) {
    var span = document.createElement('span');
    span.className = 'kw-word' + (keywords[i] ? ' keyword' : '');
    span.textContent = wObj.w;
    span.onclick = function() {
      keywords[i] = !keywords[i];
      span.classList.toggle('keyword', !!keywords[i]);
      if (!isPlaying) drawFrame();
    };
    container.appendChild(span);
  });
}

var STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','up','about','into','through','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','i','you','he','she','it','we','they','what','which','who','this','that','these','those','my','your','his','her','its','our','their','me','him','us','them','so','if','then','than','too','very','just','not','also','more','most']);

function autoDetectKeywords() {
  if (!allWords.length) { toast('No words to analyze'); return; }
  keywords = {};
  allWords.forEach(function(wObj, i) {
    var raw  = wObj.w.replace(/[^a-zA-Z0-9]/g, '');
    var low  = raw.toLowerCase();
    var orig = wObj.w;
    if (orig === orig.toUpperCase() && orig.length > 2)        { keywords[i] = true; return; }
    if (!STOP_WORDS.has(low) && raw.length >= 4)               { keywords[i] = true; return; }
    if (/^\d+/.test(orig))                                     { keywords[i] = true; return; }
  });
  rebuildKeywordEditor();
  if (!isPlaying) drawFrame();
  toast('🤖 Keywords auto-detected');
}

function clearKeywords() {
  keywords = {}; rebuildKeywordEditor(); if (!isPlaying) drawFrame(); toast('Keywords cleared');
}

function isKeyword(wordIndex) { return !!keywords[wordIndex]; }

function getWordGlobalIndex(sentence, wObj) {
  for (var i = 0; i < allWords.length; i++) { if (allWords[i] === wObj) return i; }
  return -1;
}

// ── ASSEMBLYAI ────────────────────────────────────────────────────
function processWithAssemblyAI() {
  if (!clip) { toast('No file loaded'); return; }
  if (fileType === 'image') { buildCaptions([]); setTimeout(launchPreview, 300); return; }

  isCancelled = false; pollRetries = 0; transcriptId = null;
  goTo('sProcess'); stepProg(2);
  setStatus('🎙', 'Uploading…', 'Sending your video to AssemblyAI…', 10);
  var cancelBtn = document.getElementById('processCancelBtn');
  if (cancelBtn) cancelBtn.style.display = 'block';

  var reader = new FileReader();
  reader.onload = function(e) {
    fetch('https://api.assemblyai.com/v2/upload', {
      method:  'POST',
      headers: { 'authorization': ASSEMBLY_KEY, 'content-type': 'application/octet-stream' },
      body:    e.target.result
    })
    .then(function(r) {
      if (!r.ok) return r.json().then(function(d) { throw new Error(d.error || 'Upload failed ' + r.status); });
      return r.json();
    })
    .then(function(data) {
      if (isCancelled) return;
      if (!data.upload_url) throw new Error('No upload URL returned');
      stepProg(3); setStatus('🔬', 'Transcribing…', 'AI is reading every word…', 32);
      submitTranscript(data.upload_url);
    })
    .catch(function(err) {
      if (isCancelled) return;
      setStatus('❌', 'Upload failed', err.message, 0); toast('Error: ' + err.message); hideCancelBtn();
    });
  };
  reader.readAsArrayBuffer(clip.file);
}

function submitTranscript(audioUrl) {
  // FIX: correct field is 'speech_model' (singular), not 'speech_models'
  fetch('https://api.assemblyai.com/v2/transcript', {
    method:  'POST',
    headers: { 'authorization': ASSEMBLY_KEY, 'content-type': 'application/json' },
    body:    JSON.stringify({ audio_url: audioUrl, speech_models: ['universal'], language_detection: true })
  })
  .then(function(r) {
    if (!r.ok) return r.json().then(function(e) { throw new Error('Transcript failed: ' + (e.error || r.status)); });
    return r.json();
  })
  .then(function(data) {
    if (isCancelled) return;
    if (!data.id) throw new Error('No transcript ID returned');
    transcriptId = data.id;
    stepProg(4); setStatus('🎙', 'Processing…', 'Word-perfect sync in progress…', 50);
    pollTranscript();
  })
  .catch(function(err) {
    if (isCancelled) return;
    setStatus('❌', 'Error', err.message, 0); toast('Error: ' + err.message); hideCancelBtn();
  });
}

function pollTranscript() {
  if (isCancelled) return;
  if (pollTimer) clearTimeout(pollTimer);
  pollRetries++;
  if (pollRetries > MAX_POLL) {
    setStatus('❌', 'Timed out', 'Transcription took too long — please try again.', 0);
    toast('Transcription timed out'); hideCancelBtn(); return;
  }
  fetch('https://api.assemblyai.com/v2/transcript/' + transcriptId, {
    headers: { 'authorization': ASSEMBLY_KEY }
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (isCancelled) return;
    if (data.status === 'completed') {
      stepProg(5); setStatus('✅', 'Done!', '"' + (data.text || '').substring(0, 55) + '…"', 100);
      buildCaptions(data.words || []); hideCancelBtn(); setTimeout(launchPreview, 600);
    } else if (data.status === 'error') {
      setStatus('❌', 'Error', data.error || 'Unknown error', 0); hideCancelBtn();
    } else {
      document.getElementById('progFill').style.width = (data.status === 'processing' ? 70 : 52) + '%';
      document.getElementById('procDesc').textContent = 'Status: ' + data.status + '…';
      pollTimer = setTimeout(pollTranscript, 2500);
    }
  })
  .catch(function() { if (!isCancelled) pollTimer = setTimeout(pollTranscript, 3000); });
}

function cancelProcessing() {
  isCancelled = true; if (pollTimer) clearTimeout(pollTimer);
  transcriptId = null; pollRetries = 0; hideCancelBtn(); goTo('sStyle'); toast('Cancelled');
}

function hideCancelBtn() { var b = document.getElementById('processCancelBtn'); if (b) b.style.display = 'none'; }

function setStatus(emoji, title, desc, pct) {
  var an = document.getElementById('procAnim'),   ti = document.getElementById('procTitle');
  var de = document.getElementById('procDesc'),   pf = document.getElementById('progFill');
  if (an) an.textContent = emoji; if (ti) ti.textContent = title;
  if (de) de.textContent = desc;  if (pf) pf.style.width  = pct + '%';
}

function stepProg(step) {
  for (var i = 1; i <= 5; i++) {
    var el = document.getElementById('ps' + i); if (!el) continue;
    el.className = 'ps' + (i < step ? ' ps-done' : i === step ? ' ps-active' : '');
  }
}

function buildCaptions(wordData) {
  allWords = []; sentences = []; keywords = {};
  if (!wordData || !wordData.length) return;
  allWords = wordData.map(function(w) { return { w: w.text, t: w.start / 1000, end: w.end / 1000 }; });
  var cur = [];
  allWords.forEach(function(word, wi) {
    cur.push(word);
    var next  = allWords[wi + 1];
    var isGap  = next && (next.t - word.end) > 0.45;
    var isLong = cur.length >= 6;
    var isLast = wi === allWords.length - 1;
    if (isGap || isLong || isLast) {
      sentences.push({ t: cur[0].t, end: cur[cur.length - 1].end, words: cur.slice() });
      cur = [];
    }
  });
}

// ── LAUNCH PREVIEW ────────────────────────────────────────────────
function launchPreview() {
  if (!cv) return;
  goTo('sPreview');
  cv.width = 540; cv.height = 960;
  buildAllPanels();
  var sb = document.getElementById('styleBadge'); if (sb) sb.textContent = activeStyle.name;
  var rs = document.getElementById('rpStyle');    if (rs) rs.textContent = activeStyle.name;
  var rb = document.getElementById('resBadge');   if (rb) rb.textContent = '9:16';
  var lbl = document.getElementById('epLbl');     if (lbl) lbl.textContent = allWords.length + ' words · ' + sentences.length + ' captions';

  if (fileType === 'video' && vid) {
    if (!vid.src && clip) vid.src = clip.url;
    vid.pause(); vid.currentTime = 0;
    vid.ontimeupdate = syncTimeline;
    vid.onended = function() { isPlaying = false; updatePlayIcons(false); cancelAnimationFrame(rafId); };
    if (vid.readyState >= 1) { buildTimeline(); initTimelineDrag(); drawRealWaveform(); }
    else { vid.onloadedmetadata = function() { buildTimeline(); initTimelineDrag(); drawRealWaveform(); }; }
  }

  var msg = document.getElementById('noFileMsg'); if (msg) msg.style.display = 'none';
  fitCanvas(); drawFrame();
}

// ── REAL WAVEFORM ─────────────────────────────────────────────────
// TRUTH: Decodes actual audio data from the file and plots real amplitude peaks.
// Not random bars. The shape on screen reflects what the audio actually sounds like.
function drawRealWaveform() {
  if (!clip || fileType !== 'video') return;
  var wc = document.getElementById('waveCanvas'); if (!wc) return;
  var acTmp = new (window.AudioContext || window.webkitAudioContext)();
  var reader = new FileReader();
  reader.onload = function(e) {
    acTmp.decodeAudioData(e.target.result, function(buffer) {
      var data = buffer.getChannelData(0);
      var W    = wc.parentElement ? wc.parentElement.offsetWidth : 400;
      var H    = 28;
      wc.width = W; wc.height = H;
      var c    = wc.getContext('2d');
      c.clearRect(0, 0, W, H);
      var step = Math.ceil(data.length / W);
      var grad = c.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'rgba(124,92,252,0.55)');
      grad.addColorStop(1, 'rgba(192,132,252,0.55)');
      c.fillStyle = grad;
      for (var i = 0; i < W; i++) {
        var peak = 0;
        for (var j = 0; j < step; j++) { var v = Math.abs(data[i * step + j] || 0); if (v > peak) peak = v; }
        var h = Math.max(2, peak * H * 1.6);
        c.fillRect(i, (H - h) / 2, 1, h);
      }
      acTmp.close();
    }, function() { acTmp.close(); });
  };
  reader.onerror = function() {};
  reader.readAsArrayBuffer(clip.file);
}

// ── TIMELINE ─────────────────────────────────────────────────────
function syncTimeline() {
  if (!vid || fileType !== 'video') return;
  var t = vid.currentTime, dur = vid.duration || 1;
  var tEl = document.getElementById('vbTime'),     dEl = document.getElementById('tlDuration');
  if (tEl) tEl.textContent = ft(t); if (dEl) dEl.textContent = ft(dur);
  var inner = document.getElementById('tlInner'),  ph  = document.getElementById('tlPlayhead');
  if (!inner || !ph) return;
  var totalW = Math.max(dur * tlPx * tlZoomLevel, (inner.parentElement ? inner.parentElement.offsetWidth : 400));
  inner.style.width = totalW + 'px';
  ph.style.left     = (t * tlPx * tlZoomLevel) + 'px';
  var scroll   = inner.parentElement;
  var phLeft   = t * tlPx * tlZoomLevel;
  if (scroll && (phLeft < scroll.scrollLeft || phLeft > scroll.scrollLeft + scroll.offsetWidth - 40)) {
    scroll.scrollLeft = phLeft - scroll.offsetWidth * 0.3;
  }
  document.querySelectorAll('.tl-cap-block').forEach(function(el) {
    var st = parseFloat(el.dataset.start), en = parseFloat(el.dataset.end);
    el.classList.toggle('active-cap', t >= st && t <= en);
  });
}

function buildTimeline() {
  if (!vid || !vid.duration || fileType !== 'video') return;
  var dur    = vid.duration;
  var inner  = document.getElementById('tlInner'); if (!inner) return;
  var totalW = Math.max(dur * tlPx * tlZoomLevel, 600);
  inner.style.width = totalW + 'px';
  buildTLRuler(dur, totalW);
  var vc = document.getElementById('tlVideoClip');
  if (vc) vc.style.width = (dur * tlPx * tlZoomLevel - 2) + 'px';
  buildCaptionBlocks(dur, totalW);
}

function buildTLRuler(dur, totalW) {
  var ruler = document.getElementById('tlRuler'); if (!ruler) return;
  ruler.innerHTML = ''; ruler.style.width = totalW + 'px';
  var step = dur > 60 ? 10 : dur > 20 ? 5 : 1;
  for (var t = 0; t <= dur; t += step) {
    var tick = document.createElement('div');
    tick.className = 'tl-tick'; tick.style.left = (t * tlPx * tlZoomLevel) + 'px'; tick.textContent = ft(t);
    ruler.appendChild(tick);
  }
}

function buildCaptionBlocks(dur, totalW) {
  var container = document.getElementById('captionRow'); if (!container) return;
  container.innerHTML = '';
  sentences.forEach(function(s) {
    var left  = (s.t  / dur) * totalW;
    var width = Math.max(4, ((s.end - s.t) / dur) * totalW - 2);
    var block = document.createElement('div');
    block.className     = 'tl-cap-block';
    block.style.left    = left  + 'px';
    block.style.width   = width + 'px';
    block.dataset.start = s.t;
    block.dataset.end   = s.end;
    block.textContent   = s.words.slice(0, 2).map(function(w) { return w.w; }).join(' ');
    block.title         = s.words.map(function(w) { return w.w; }).join(' ');
    block.onclick = function(e) {
      e.stopPropagation();
      if (vid) vid.currentTime = s.t;
      if (!isPlaying) setTimeout(drawFrame, 40);
    };
    container.appendChild(block);
  });
}

function tlSeekFromEvent(e) {
  if (!vid || !vid.duration) return;
  var inner  = document.getElementById('tlInner'); if (!inner) return;
  var scroll = inner.parentElement;
  var rect   = inner.getBoundingClientRect();
  var scrollL = scroll ? scroll.scrollLeft : 0;
  var x = e.clientX - rect.left + scrollL;
  vid.currentTime = Math.max(0, Math.min(x / (tlPx * tlZoomLevel), vid.duration));
  if (!isPlaying) setTimeout(drawFrame, 40);
}

function initTimelineDrag() {
  var scroll = document.getElementById('tlScroll'); if (!scroll) return;
  scroll.addEventListener('mousedown', function(e) { _tlDragging = true; tlSeekFromEvent(e); e.preventDefault(); });
  document.addEventListener('mousemove', function(e) { if (_tlDragging) tlSeekFromEvent(e); });
  document.addEventListener('mouseup',   function()  { _tlDragging = false; });
  scroll.addEventListener('touchstart', function(e) { _tlDragging = true; tlSeekFromEvent(e.touches[0]); e.preventDefault(); }, { passive:false });
  document.addEventListener('touchmove', function(e) { if (_tlDragging) tlSeekFromEvent(e.touches[0]); }, { passive:true });
  document.addEventListener('touchend',  function()  { _tlDragging = false; });
}

function tlZoom(delta) {
  tlZoomLevel = Math.max(0.5, Math.min(4, tlZoomLevel + delta));
  var el = document.getElementById('tlZoomLbl'); if (el) el.textContent = tlZoomLevel + '×';
  buildTimeline();
}

function skipTo(t) {
  if (!vid) return;
  vid.currentTime = Math.max(0, Math.min(t, vid.duration || 0));
  if (!isPlaying) setTimeout(drawFrame, 40);
}

function stepFrame(dir) {
  if (!vid) return;
  vid.currentTime = Math.max(0, Math.min((vid.currentTime || 0) + dir / 30, vid.duration || 0));
  if (!isPlaying) setTimeout(drawFrame, 40);
}

function toggleTrackVis(track) {
  trackVis[track] = !trackVis[track]; if (!isPlaying) drawFrame(); toast(track + (trackVis[track] ? ' visible' : ' hidden'));
}

function setTrackVol(track, val) {
  if (track === 'voice' && vid)        vid.volume = val / 100;
  if (track === 'music' && musicAudio) { musicAudio.volume = val / 100; musicVolume = val / 100; }
}

// ── AUDIO GRAPH ───────────────────────────────────────────────────
function initAudioGraph() {
  if (audioReady || !vid) return;
  try {
    audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
    audioSource = audioCtx.createMediaElementSource(vid);
    hiPassFilter = audioCtx.createBiquadFilter(); hiPassFilter.type = 'highpass'; hiPassFilter.frequency.value = 80;
    loPassFilter = audioCtx.createBiquadFilter(); loPassFilter.type = 'lowpass';  loPassFilter.frequency.value = 18000;
    noiseGate    = audioCtx.createDynamicsCompressor();
    noiseGate.threshold.value = -100; noiseGate.knee.value = 10; noiseGate.ratio.value = 20;
    noiseGate.attack.value = 0.003;   noiseGate.release.value = 0.15;
    eqBass   = audioCtx.createBiquadFilter(); eqBass.type   = 'lowshelf';  eqBass.frequency.value   = 120;  eqBass.gain.value   = 0;
    eqMid    = audioCtx.createBiquadFilter(); eqMid.type    = 'peaking';   eqMid.frequency.value    = 2500; eqMid.Q.value = 1.2; eqMid.gain.value = 0;
    eqTreble = audioCtx.createBiquadFilter(); eqTreble.type = 'highshelf'; eqTreble.frequency.value = 8000; eqTreble.gain.value = 0;
    gainNode    = audioCtx.createGain(); gainNode.gain.value = 1;
    dryGain     = audioCtx.createGain(); dryGain.gain.value  = 1;
    reverbGain  = audioCtx.createGain(); reverbGain.gain.value = 0;
    reverbNode  = audioCtx.createConvolver(); generateReverb(audioCtx, reverbNode, 2.5);
    audioSource.connect(hiPassFilter);
    hiPassFilter.connect(loPassFilter);
    loPassFilter.connect(noiseGate);
    noiseGate.connect(eqBass);
    eqBass.connect(eqMid); eqMid.connect(eqTreble);
    eqTreble.connect(dryGain); eqTreble.connect(reverbNode);
    reverbNode.connect(reverbGain);
    dryGain.connect(gainNode); reverbGain.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    exportStreamDest = audioCtx.createMediaStreamDestination();
    gainNode.connect(exportStreamDest);
    audioReady = true;
  } catch(e) { console.warn('Audio graph init failed:', e); }
}

function generateReverb(ac, convolver, duration) {
  var sr  = ac.sampleRate, len = Math.floor(sr * duration);
  var buf = ac.createBuffer(2, len, sr);
  for (var ch = 0; ch < 2; ch++) {
    var d = buf.getChannelData(ch);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  convolver.buffer = buf;
}

function applyAudioSettings() {
  if (!audioReady) return;
  if (audioSettings.noiseCancelOn) {
    noiseGate.threshold.value = -(audioSettings.noiseCancelAmt * 1.5 + 10); noiseGate.ratio.value = 20;
    hiPassFilter.frequency.value = 100; loPassFilter.frequency.value = 16000;
  } else {
    noiseGate.threshold.value = -100; hiPassFilter.frequency.value = 80; loPassFilter.frequency.value = 18000;
  }
  if (audioSettings.voiceBoostOn) { eqMid.frequency.value = 2000; eqMid.Q.value = 0.8; eqMid.gain.value = 6; }
  else { eqMid.gain.value = audioSettings.eqMid; }
  eqBass.gain.value   = audioSettings.bassBoostOn ? 8 : audioSettings.eqBass;
  eqTreble.gain.value = audioSettings.eqTreble;
  if (audioSettings.reverbOn) { dryGain.gain.value = 1 - audioSettings.reverbMix; reverbGain.gain.value = audioSettings.reverbMix; }
  else { dryGain.gain.value = 1; reverbGain.gain.value = 0; }
}

function getExportAudioStream() {
  if (!audioReady) initAudioGraph();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return exportStreamDest ? exportStreamDest.stream : null;
}

// ── DRAW FRAME ────────────────────────────────────────────────────
function drawFrame() {
  if (!cv || !ctx) return;
  var W = cv.width, H = cv.height;
  if (!grC || grC.width !== W || grC.height !== H) {
    grC = document.createElement('canvas'); grC.width = W; grC.height = H; grX = grC.getContext('2d');
  }
  ctx.clearRect(0, 0, W, H);
  motionPhase += 0.003;

  if (fileType === 'video' && vid && vid.videoWidth) {
    drawVideoToCanvas(W, H);
  } else {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (fileType === 'image' && clip) {
      if (window._cachedImg && window._cachedImg.src === clip.url) {
        drawImageFit(window._cachedImg, W, H);
      } else {
        var img = new Image();
        img.onload = function() { window._cachedImg = img; if (!isPlaying) drawFrame(); };
        img.src = clip.url;
      }
    }
  }

  applyLayerEffects(W, H);

  stickers.forEach(function(stk) {
    ctx.save(); ctx.translate(stk.x, stk.y); ctx.rotate(stk.rot * Math.PI / 180);
    ctx.font = stk.size + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(stk.emoji, 0, 0); ctx.restore();
  });

  var now = fileType === 'video' && vid ? vid.currentTime : 0;

  if (trackVis.captions !== false) drawCaptions(W, H, now);
  drawTextOverlay(W, H, now);

  ctx.save(); ctx.font = '10px "DM Sans",sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.07)';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText('ImpactGrid', W - 8, H - 6); ctx.restore();

  if (isPlaying) rafId = requestAnimationFrame(drawFrame);
}

function drawVideoToCanvas(W, H) {
  var vw = vid.videoWidth, vh = vid.videoHeight;
  var scM = videoScale, dx = offsetX, dy = offsetY;
  if (activeMotion === 'slowzoom') scM *= 1 + 0.04 * Math.sin(motionPhase * .5);
  if (activeMotion === 'shake')    { dx += Math.sin(motionPhase * 7) * 3; dy += Math.cos(motionPhase * 5) * 2; }
  if (activeMotion === 'drift')    { dx += Math.sin(motionPhase * .3) * 14; dy += Math.cos(motionPhase * .2) * 7; }
  if (activeMotion === 'pulse')    scM *= 1 + 0.02 * Math.sin(motionPhase * 3);
  var sc = Math.max(W / vw, H / vh) * scM;
  var dw = vw * sc, dh = vh * sc, ox = (W - dw) / 2 + dx, oy = (H - dh) / 2 + dy;
  grX.clearRect(0, 0, W, H);
  grX.filter = getCurrentFilter();
  if (flipH || flipV) { grX.save(); grX.translate(flipH ? W : 0, flipV ? H : 0); grX.scale(flipH ? -1 : 1, flipV ? -1 : 1); }
  grX.drawImage(vid, ox, oy, dw, dh);
  if (flipH || flipV) grX.restore();
  grX.filter = 'none';
  ctx.drawImage(grC, 0, 0);
}

function drawImageFit(img, W, H) {
  var iw = img.naturalWidth, ih = img.naturalHeight;
  if      (bgMode === 'blur')     { ctx.save(); ctx.filter = 'blur(20px)'; var sc2 = Math.max(W/iw,H/ih); ctx.drawImage(img,(W-iw*sc2)/2,(H-ih*sc2)/2,iw*sc2,ih*sc2); ctx.restore(); ctx.filter='none'; }
  else if (bgMode === 'white')    { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H); }
  else if (bgMode === 'gradient') { var g = ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#0a0014'); g.addColorStop(1,'#140028'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
  else if (bgMode === 'custom')   { ctx.fillStyle = 'hsl('+bgColorH+','+bgColorS+'%,'+bgColorL+'%)'; ctx.fillRect(0,0,W,H); }
  else                            { ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H); }
  grX.clearRect(0,0,W,H); grX.filter = getCurrentFilter();
  var sc3 = Math.min(W/iw, H/ih) * videoScale, dw3 = iw*sc3, dh3 = ih*sc3;
  if (flipH || flipV) { grX.save(); grX.translate(flipH?W:0,flipV?H:0); grX.scale(flipH?-1:1,flipV?-1:1); }
  grX.drawImage(img,(W-dw3)/2+offsetX,(H-dh3)/2+offsetY,dw3,dh3);
  if (flipH || flipV) grX.restore();
  grX.filter = 'none'; ctx.drawImage(grC,0,0);
}

function getCurrentFilter() {
  if (customFilter)                                 return customFilter;
  if (activeFX    && activeFX.filter    !== 'none') return activeFX.filter;
  if (activeGrade && activeGrade.filter && activeGrade.filter !== 'none') return activeGrade.filter;
  return 'none';
}

function applyLayerEffects(W, H) {
  if (activeTint && activeTint.color !== 'transparent') {
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = activeTint.color; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation = 'source-over';
  }
  if (vignetteVal > 0) {
    var vg = ctx.createRadialGradient(W/2,H*.42,H*.04,W/2,H/2,H*.88);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,'+(vignetteVal/100*.85)+')');
    ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  }
  if (noiseVal > 0) {
    var iData = ctx.getImageData(0,0,W,H);
    for (var p = 0; p < iData.data.length; p += 4) { var n = (Math.random()-.5)*noiseVal*2; iData.data[p]+=n; iData.data[p+1]+=n; iData.data[p+2]+=n; }
    ctx.putImageData(iData,0,0);
  }
  if (scanlinesVal > 0) { var a = scanlinesVal/200; for (var sy=0;sy<H;sy+=2) { ctx.fillStyle='rgba(0,0,0,'+a+')'; ctx.fillRect(0,sy,W,1); } }
  if (chromaVal > 0) {
    var tmpC = document.createElement('canvas'); tmpC.width=W; tmpC.height=H; tmpC.getContext('2d').drawImage(cv,0,0);
    var off = chromaVal * 0.8;
    ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=0.55;
    ctx.filter='saturate(3) hue-rotate(0deg)';   ctx.drawImage(tmpC, off,0);
    ctx.filter='saturate(3) hue-rotate(180deg)'; ctx.drawImage(tmpC,-off,0);
    ctx.restore();
  }
  if (glowVal > 0) {
    var tmpG = document.createElement('canvas'); tmpG.width=W; tmpG.height=H; var tG=tmpG.getContext('2d'); tG.filter='blur('+(glowVal*.8)+'px)'; tG.drawImage(cv,0,0);
    ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=0.35; ctx.drawImage(tmpG,0,0); ctx.restore();
  }
  if (pixelateVal > 1) {
    var ps=pixelateVal, tmpP=document.createElement('canvas'); tmpP.width=W; tmpP.height=H; var tP=tmpP.getContext('2d'); tP.drawImage(cv,0,0,Math.ceil(W/ps),Math.ceil(H/ps));
    ctx.imageSmoothingEnabled=false; ctx.drawImage(tmpP,0,0,Math.ceil(W/ps),Math.ceil(H/ps),0,0,W,H); ctx.imageSmoothingEnabled=true;
  }
  if (distortVal > 0) {
    var tmpD=document.createElement('canvas'); tmpD.width=W; tmpD.height=H; tmpD.getContext('2d').drawImage(cv,0,0);
    var phase=performance.now()/1000, slH=Math.max(4,Math.floor(H/40));
    for (var sy2=0;sy2<H;sy2+=slH) { var shift=Math.sin(sy2/20+phase)*distortVal*.6; ctx.drawImage(tmpD,0,sy2,W,slH,shift,sy2,W,slH); }
  }
  if (duotoneId) {
    var id4=ctx.getImageData(0,0,W,H), d4=id4.data;
    function hx(h,o){return parseInt(h.slice(o,o+2),16);}
    var ar=hx(duotoneId.a,1),ag2=hx(duotoneId.a,3),ab=hx(duotoneId.a,5);
    var br=hx(duotoneId.b,1),bg2=hx(duotoneId.b,3),bb=hx(duotoneId.b,5);
    for (var pp=0;pp<d4.length;pp+=4) { var luma=(d4[pp]*.299+d4[pp+1]*.587+d4[pp+2]*.114)/255; d4[pp]=Math.round(ar+(br-ar)*luma); d4[pp+1]=Math.round(ag2+(bg2-ag2)*luma); d4[pp+2]=Math.round(ab+(bb-ab)*luma); }
    ctx.putImageData(id4,0,0);
  }
  if (aiEffects.sharpen) {
    var id2=ctx.getImageData(0,0,W,H), d2=id2.data, tmp2=new Uint8ClampedArray(d2.length);
    for(var ix=0;ix<d2.length;ix++) tmp2[ix]=d2[ix];
    var kernel=[-1,-1,-1,-1,9,-1,-1,-1,-1];
    for(var iy=1;iy<H-1;iy++) for(var ixx=1;ixx<W-1;ixx++) { var idx2=(iy*W+ixx)*4; for(var ch=0;ch<3;ch++) { var sum2=0; for(var ky=-1;ky<=1;ky++) for(var kx=-1;kx<=1;kx++) sum2+=tmp2[((iy+ky)*W+(ixx+kx))*4+ch]*kernel[(ky+1)*3+(kx+1)]; d2[idx2+ch]=Math.max(0,Math.min(255,sum2)); } }
    ctx.putImageData(id2,0,0);
  }
  if (aiEffects.smooth) {
    var tmpS=document.createElement('canvas'); tmpS.width=W; tmpS.height=H; var tS=tmpS.getContext('2d'); tS.filter='blur(1.5px)'; tS.drawImage(cv,0,0);
    ctx.save(); ctx.globalAlpha=0.4; ctx.drawImage(tmpS,0,0); ctx.restore();
  }
  if (aiEffects.portraitBlur) {
    var tmpPB=document.createElement('canvas'); tmpPB.width=W; tmpPB.height=H; tmpPB.getContext('2d').drawImage(cv,0,0);
    ctx.filter='blur(14px)'; ctx.drawImage(tmpPB,0,0); ctx.filter='none';
    var rx=W*.32, ry=H*.40, cx2=W/2, cy2=H*.42;
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx2,cy2,rx,ry,0,0,Math.PI*2); ctx.clip(); ctx.drawImage(tmpPB,0,0); ctx.restore();
  }
}

// ── CAPTION HELPERS ───────────────────────────────────────────────
function getCapY(H, lineCount) {
  var lineH = capSize + 14;
  if (captionPos === 'top') return H * .10 + lineCount * lineH / 2;
  if (captionPos === 'mid') return H * .50;
  return H * .82 - lineCount * lineH / 2;
}

function groupLines(arr, n) {
  var lines = [], cur = [];
  arr.forEach(function(w) { cur.push(w); if (cur.length >= n) { lines.push(cur.slice()); cur = []; } });
  if (cur.length) lines.push(cur);
  return lines;
}

function drawCaptions(W, H, now) {
  if (sentences.length) {
    var cs = null;
    for (var i = 0; i < sentences.length; i++) {
      if (now >= sentences[i].t && now <= sentences[i].end + 0.4) { cs = sentences[i]; break; }
    }
    if (cs) activeStyle.render(ctx, W, H, { words: cs.words, curTime: now, sentence: cs });
  } else if (fileType === 'image') {
    var demo = [{ w:'Your', t:0, end:99 }, { w:'CAPTION', t:0, end:99 }, { w:'here', t:0, end:99 }];
    // Mark the keyword for demo purposes
    var demoIdx = allWords.indexOf(demo[1]);
    if (demoIdx === -1) keywords[1] = true;
    activeStyle.render(ctx, W, H, { words: demo, curTime: 1, sentence: { words: demo } });
  }
}

// ── CAPTION RENDERERS ─────────────────────────────────────────────
// CORE IDEA: every renderer checks isKeyword() per word.
// Keywords = big dramatic treatment.
// Non-keywords = clean readable text.

function renderFire(ctx, W, H, d) {
  if (!d.words.length) return;
  var now=d.curTime, sz=capSize, pX=12, pY=7;
  var lines=groupLines(d.words,4), lineH=sz+pY*2+8, startY=getCapY(H,lines.length);
  lines.forEach(function(line,li) {
    ctx.font='700 '+sz+'px "DM Sans",sans-serif';
    var tW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+pX*2+8;},0);
    var x=W/2-tW/2, y=startY+li*lineH+lineH/2;
    line.forEach(function(wObj) {
      var ww=ctx.measureText(wObj.w).width, bW=ww+pX*2, bH=sz+pY*2;
      var isNow=now>=wObj.t&&now<=wObj.end+.2, isPast=now>wObj.end+.2;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj), isKw=isKeyword(kwIdx);
      ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
      if (isNow) {
        if (isKw) {
          ctx.shadowColor='#f97316'; ctx.shadowBlur=22;
          ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(x,y-bH/2,bW,bH,7);else{ctx.rect(x,y-bH/2,bW,bH);}
          ctx.fillStyle=captionColor==='#ffffff'?'#f97316':captionColor; ctx.fill();
          ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font='800 '+sz+'px "DM Sans",sans-serif';
          ctx.fillText(wObj.w,x+bW/2,y);
        } else {
          ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.beginPath(); if(ctx.roundRect)ctx.roundRect(x,y-bH/2,bW,bH,7);else ctx.rect(x,y-bH/2,bW,bH); ctx.fill();
          ctx.fillStyle=captionColor; ctx.font='700 '+sz+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,x+bW/2,y);
        }
      } else { ctx.globalAlpha=isPast?.45:.18; ctx.fillStyle=captionColor; ctx.font='700 '+sz+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,x+bW/2,y); }
      ctx.restore(); x+=bW+8;
    });
  });
}

function renderColourFlip(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      var col=isKw?(captionColor==='#ffffff'?'#f5c842':captionColor):(wi%2===0?captionColor:'rgba(255,255,255,.5)');
      ctx.save();ctx.globalAlpha=age<0?0:Math.min(age/.1,1)*(isPast?.88:isNow?1:.2);
      ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.font=(isKw&&isNow?'900':'800')+' '+(isKw&&isNow?sz*1.1:sz)+'px "DM Sans",sans-serif';
      if(isNow&&isKw){ctx.shadowColor=col;ctx.shadowBlur=16;}
      ctx.fillStyle=col;ctx.fillText(wObj.w.toUpperCase(),x,lY);ctx.restore();x+=ww+10;
    });
  });
}

function renderCinematic(ctx,W,H,d){
  if(!d.words.length)return;
  var bh=Math.round(H*.08);ctx.fillStyle='#000';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);
  var now=d.curTime,sz=Math.max(13,capSize-4);
  var lines=groupLines(d.words,6),lineH=sz+10,startY=H*.84;
  lines.forEach(function(line,li){
    ctx.font='400 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+8;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.2,age=now-wObj.t,alpha=age<0?0:Math.min(age/.18,1);
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      ctx.save();ctx.globalAlpha=alpha*.9;ctx.textAlign='left';ctx.textBaseline='middle';
      if(isNow&&isKw){ctx.font='700 '+(sz*1.15)+'px "DM Sans",sans-serif';ctx.shadowColor='#93c5fd';ctx.shadowBlur=18;ctx.fillStyle=captionColor==='#ffffff'?'#93c5fd':captionColor;}
      else if(isNow){ctx.font='600 '+sz+'px "DM Sans",sans-serif';ctx.shadowColor=captionColor;ctx.shadowBlur=8;ctx.fillStyle=captionColor;}
      else{ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=6;ctx.fillStyle=captionColor;}
      ctx.fillText(wObj.w,x,lY);ctx.restore();x+=ww+8;
    });
  });
}

function renderHype(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,cur=null;
  for(var i=0;i<d.words.length;i++){
    var wO=d.words[i];
    if(now>=wO.t&&now<=wO.end+.15){
      var ki=getWordGlobalIndex(d.sentence,wO);
      if(isKeyword(ki)){cur=wO;break;}
      if(!cur)cur=wO;
    }
  }
  if(!cur)return;
  var age=now-cur.t;
  if(age<.06){ctx.fillStyle='rgba(245,200,66,'+(0.5*(1-age/.06))+')';ctx.fillRect(0,0,W,H);}
  var sz=Math.min(W*.2,capSize*4),sc2=age<.12?1+(.12-age)/.12*.8:1;
  ctx.save();ctx.globalAlpha=Math.min(age/.04,1);ctx.translate(W/2,H*.46);ctx.scale(sc2,sc2);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
  ctx.lineWidth=Math.max(8,sz*.12);ctx.strokeStyle='rgba(0,0,0,.95)';ctx.lineJoin='round';ctx.strokeText(cur.w.toUpperCase(),0,0);
  ctx.fillStyle=captionColor==='#ffffff'?'#f5c842':captionColor;ctx.fillText(cur.w.toUpperCase(),0,0);ctx.restore();
  var others=d.words.filter(function(w){return w!==cur;}).map(function(w){return w.w;}).join(' ');
  if(others){ctx.globalAlpha=0.4;ctx.font='600 '+(capSize-4)+'px "DM Sans",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=captionColor;ctx.fillText(others,W/2,H*.78);ctx.globalAlpha=1;}
}

function renderKaraoke(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=Math.max(16,capSize-2),barH=Math.max(56,capSize*3+16),barY=H-barH-8;
  var bg=ctx.createLinearGradient(0,barY,0,barY+barH);bg.addColorStop(0,'rgba(5,0,15,.97)');bg.addColorStop(1,'rgba(8,0,20,.7)');
  ctx.fillStyle=bg;ctx.fillRect(0,barY,W,barH);
  ctx.fillStyle='hsl('+(260+50*Math.sin(now*5))+',90%,65%)';ctx.fillRect(0,barY,W,2);
  var lines=groupLines(d.words,5),lineH2=barH/Math.max(lines.length,1);
  lines.forEach(function(line,li){
    ctx.font='700 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=barY+lineH2*(li+.5)+4;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.15,isPast=now>wObj.end+.15;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';
      if(isNow){var col=isKw?(captionColor==='#ffffff'?'#f5c842':captionColor):captionColor;ctx.shadowColor=col;ctx.shadowBlur=isKw?28:14;ctx.fillStyle=col;ctx.font=(isKw?'900':'700')+' '+(isKw?sz*1.15:sz)+'px "DM Sans",sans-serif';ctx.fillText(wObj.w,x,lY);}
      else{ctx.globalAlpha=isPast?.42:.18;ctx.fillStyle=captionColor;ctx.fillText(wObj.w,x,lY);}
      ctx.restore();x+=ww+10;
    });
  });
}

function renderSplit(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.15,isPast=now>wObj.end+.15,age=now-wObj.t;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      if(isNow&&isKw){
        var bSz=Math.min(W*.22,sz*4.5),sc2=age<.12?1+(.12-age)/.12*.6:1;
        ctx.save();ctx.translate(W/2,lY-sz*1.2);ctx.scale(sc2,sc2);ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.font='900 '+bSz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
        ctx.lineWidth=Math.max(5,bSz*.08);ctx.strokeStyle='rgba(0,0,0,.95)';ctx.lineJoin='round';ctx.strokeText(wObj.w.toUpperCase(),0,0);
        var grd=ctx.createLinearGradient(0,-bSz/2,0,bSz/2);grd.addColorStop(0,captionColor);grd.addColorStop(1,'rgba(255,255,255,.65)');
        ctx.fillStyle=grd;ctx.fillText(wObj.w.toUpperCase(),0,0);ctx.restore();
      } else {ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';ctx.globalAlpha=isPast?.7:.25;ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);ctx.restore();}
      x+=ww+10;
    });
  });
}

function renderTypewriter(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize,last=null;
  var lines=groupLines(d.words,5),lineH=sz+16,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    var vis=line.filter(function(w){return now>=w.t;});if(!vis.length)return;
    ctx.font='700 '+sz+'px "DM Sans",sans-serif';
    var lW=vis.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=startY+li*lineH;
    vis.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.15;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';
      if(isNow){var col=isKw?'#f5c842':(captionColor==='#ffffff'?'#4ade80':captionColor);ctx.shadowColor=col;ctx.shadowBlur=isKw?20:14;ctx.fillStyle=col;ctx.font=(isKw?'900':'700')+' '+(isKw?sz*1.1:sz)+'px "DM Sans",sans-serif';}
      else{ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=6;ctx.fillStyle=captionColor;}
      ctx.fillText(wObj.w,x,lY);ctx.restore();
      if(wi===vis.length-1)last={x:x+ww+5,y:lY};x+=ww+10;
    });
  });
  if(last&&Math.sin(now*8)>0){ctx.fillStyle=captionColor==='#ffffff'?'#4ade80':captionColor;ctx.fillRect(last.x,last.y-sz/2,2.5,sz);}
}

function renderBounce(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,3),lineH=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var tW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-tW/2,y=startY+li*lineH;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.18,isPast=now>wObj.end+.18,age=now-wObj.t;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      var bounce=isNow?Math.sin(age*20)*(isKw?10:6):0;
      ctx.save();ctx.translate(x+ww/2,y+bounce);ctx.textAlign='center';ctx.textBaseline='middle';
      if(isNow){var hue=isKw?30:(now*100+wi*50)%360;var col='hsl('+hue+',100%,'+(isKw?'65':'68')+'%)';ctx.shadowColor=col;ctx.shadowBlur=22;ctx.fillStyle=col;ctx.scale(isKw?1.25:1.12,isKw?1.25:1.12);}
      else{ctx.globalAlpha=isPast?.52:.2;ctx.fillStyle=captionColor;}
      ctx.font='800 '+sz+'px "DM Sans",sans-serif';ctx.fillText(wObj.w.toUpperCase(),0,0);ctx.restore();x+=ww+10;
    });
  });
}

function renderMinimal(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=Math.max(12,capSize-4);
  var lines=groupLines(d.words,6),lineH=sz+12,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='300 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+12;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      var alpha=age<0?0:Math.min(age/.15,1);
      ctx.save();ctx.globalAlpha=alpha*(isPast?.7:isNow?1:.14);ctx.textAlign='left';ctx.textBaseline='middle';
      if(isNow&&isKw){ctx.font='700 '+(sz*1.2)+'px "DM Sans",sans-serif';ctx.shadowColor=captionColor;ctx.shadowBlur=10;}
      else{ctx.font=(isNow?'500':'300')+' '+sz+'px "DM Sans",sans-serif';}
      ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);ctx.restore();x+=ww+12;
    });
  });
}

function renderGlitch(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH=sz+12,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      var glitch=isNow&&isKw&&age<.3?Math.random()*12*(1-age/.3):(isNow&&age<.15?Math.random()*5:0);
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='800 '+sz+'px "DM Sans",sans-serif';
      if(isNow&&(isKw||glitch>0)){
        ctx.save();ctx.globalAlpha=.65;ctx.fillStyle='#ff0044';ctx.fillText(wObj.w.toUpperCase(),x-glitch,lY+glitch*.4);ctx.fillStyle='#00e5ff';ctx.fillText(wObj.w.toUpperCase(),x+glitch,lY-glitch*.4);ctx.restore();
        if(isKw){ctx.font='900 '+(sz*1.1)+'px "DM Sans",sans-serif';}
        ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);
      }else{ctx.globalAlpha=isPast?.6:.18;ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);}
      ctx.restore();x+=ww+10;
    });
  });
}

function renderChromaRepeat(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='italic 800 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      if(isNow&&isKw){
        var bigSz=Math.min(W*.14,sz*3),rowH=bigSz*1.15,rows=Math.ceil(H/rowH)+1,word=wObj.w.toUpperCase();
        ctx.save();ctx.font='900 '+bigSz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        for(var r=0;r<rows;r++){var ry=r*rowH,fade=0.55+0.45*(1-Math.abs(r-rows/2)/(rows/2)),off=(r%2===0?1:-1)*3;
          ctx.save();ctx.globalAlpha=fade*.55;ctx.fillStyle='#ff2020';ctx.fillText(word,W/2-off*2,ry);ctx.restore();
          ctx.save();ctx.globalAlpha=fade*.55;ctx.fillStyle='#00e5ff';ctx.fillText(word,W/2+off*2,ry);ctx.restore();
          ctx.save();ctx.globalAlpha=fade*(r===Math.floor(rows/2)?1:.6);ctx.fillStyle='#ffffff';ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=bigSz*.06;ctx.lineJoin='round';ctx.strokeText(word,W/2,ry);ctx.fillText(word,W/2,ry);ctx.restore();
        }
        ctx.restore();
      }else{ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='italic 800 '+sz+'px "DM Sans",sans-serif';ctx.globalAlpha=isNow?1:isPast?.65:.2;ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=8;ctx.fillStyle=captionColor;ctx.fillText(wObj.w,x,lY);ctx.restore();}
      x+=ww+10;
    });
  });
}

function renderScanline(ctx,W,H,d){
  if(!d.words.length)return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var lW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+10;},0),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.15,isPast=now>wObj.end+.15,age=now-wObj.t;
      var kwIdx=getWordGlobalIndex(d.sentence,wObj),isKw=isKeyword(kwIdx);
      if(isNow&&isKw){
        var word=wObj.w.toUpperCase(),bigSz=Math.min(W*.32,sz*6);
        var wordLines=word.length>7?[word.slice(0,Math.ceil(word.length/2)),word.slice(Math.ceil(word.length/2))]:[word];
        var sc2=age<.1?1+((.1-age)/.1)*.4:1;
        ctx.save();ctx.font='900 '+bigSz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        wordLines.forEach(function(wl,wi2){
          var wy=H*.5+(wi2-(wordLines.length-1)/2)*bigSz*1.05,tw=ctx.measureText(wl).width;
          ctx.save();ctx.translate(W/2,wy);ctx.scale(sc2,sc2);ctx.translate(-W/2,-wy);
          ctx.fillStyle='rgba(0,0,0,0.82)';ctx.fillRect(W/2-tw/2-12,wy-bigSz/2-10,tw+24,bigSz+20);
          ctx.strokeStyle='rgba(0,0,0,.95)';ctx.lineWidth=bigSz*.05;ctx.lineJoin='round';ctx.strokeText(wl,W/2,wy);
          ctx.fillStyle=captionColor;ctx.fillText(wl,W/2,wy);
          ctx.globalAlpha=.3;ctx.fillStyle='#000';for(var sy=0;sy<bigSz+20;sy+=4)ctx.fillRect(W/2-tw/2-12,wy-bigSz/2-10+sy,tw+24,2);
          ctx.globalAlpha=1;ctx.restore();
        });
        ctx.restore();
      }else{ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='800 '+sz+'px "DM Sans",sans-serif';ctx.globalAlpha=isNow?1:isPast?.65:.2;ctx.fillStyle=captionColor;ctx.fillText(wObj.w,x,lY);ctx.restore();}
      x+=ww+10;
    });
  });
}

// ── TEXT OVERLAY ──────────────────────────────────────────────────
function updateOverlayText(){
  var inp=document.getElementById('overlayText');overlayTextVal=inp?inp.value.trim():'';
  var sl=document.getElementById('slTxtSize');if(sl)document.getElementById('slTxtSizeVal').textContent=sl.value;
  var op=document.getElementById('slTxtOpacity');if(op){overlayOpacity=parseInt(op.value)/100;document.getElementById('slTxtOpacityVal').textContent=op.value+'%';}
  var ol=document.getElementById('slTxtOutline');if(ol){overlayOutline=parseInt(ol.value);document.getElementById('slTxtOutlineVal').textContent=ol.value;}
  var sh=document.getElementById('slTxtShadow');if(sh){overlayShadow=parseInt(sh.value);document.getElementById('slTxtShadowVal').textContent=sh.value;}
  if(!isPlaying)drawFrame();
}
function setTextPos(btn){overlayPos=btn.dataset.pos;btn.closest('.pos-row').querySelectorAll('.pos-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');if(!isPlaying)drawFrame();}
function clearOverlayText(){overlayTextVal='';var inp=document.getElementById('overlayText');if(inp)inp.value='';if(!isPlaying)drawFrame();}
function drawTextOverlay(W,H,now){
  if(!overlayTextVal)return;
  var size=parseInt((document.getElementById('slTxtSize')||{value:42}).value)||42;
  var fontDef=FONTS.find(function(f){return f.id===overlayFontId;})||FONTS[0];
  var y=overlayPos==='top'?H*.1:overlayPos==='bot'?H*.9:H*.5;
  var text=overlayStyle==='upper'?overlayTextVal.toUpperCase():overlayStyle==='lower'?overlayTextVal.toLowerCase():overlayTextVal;
  ctx.save();ctx.globalAlpha=Math.max(0,Math.min(overlayOpacity,1));ctx.translate(W/2,y);
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=(overlayStyle==='italic'?'italic ':'')+fontDef.weight+' '+size+'px '+fontDef.family;
  if(overlayOutline>0){ctx.strokeStyle='rgba(0,0,0,.9)';ctx.lineWidth=overlayOutline*2;ctx.lineJoin='round';ctx.strokeText(text,0,0);}
  ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=overlayShadow;ctx.fillStyle=overlayColor;ctx.fillText(text,0,0);ctx.restore();
}
function setCaptionPos(btn){captionPos=btn.dataset.pos;btn.closest('.pos-row').querySelectorAll('.pos-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');if(!isPlaying)drawFrame();}
function updateCapSize(){capSize=parseInt(document.getElementById('slCapSize').value);document.getElementById('slCapSizeVal').textContent=capSize;if(!isPlaying)drawFrame();}

// ── STICKERS ──────────────────────────────────────────────────────
function addSticker(em){if(!cv)return;stickers.push({emoji:em,x:cv.width/2,y:cv.height/3,size:64,rot:0});activeSticker=stickers.length-1;refreshPlacedList();if(!isPlaying)drawFrame();toast('Added '+em);}
function refreshPlacedList(){
  var list=document.getElementById('placedList');if(!list)return;
  if(!stickers.length){list.innerHTML='<div class="empty-note">None placed yet</div>';return;}
  list.innerHTML='';
  stickers.forEach(function(stk,i){var item=document.createElement('div');item.className='placed-item'+(i===activeSticker?' selected':'');item.innerHTML='<span class="placed-emoji">'+stk.emoji+'</span><span class="placed-info">x:'+Math.round(stk.x)+' y:'+Math.round(stk.y)+'</span><button class="placed-del" onclick="removeSticker('+i+')">✕</button>';item.onclick=function(){activeSticker=i;refreshPlacedList();if(!isPlaying)drawFrame();};list.appendChild(item);});
}
function removeSticker(i){stickers.splice(i,1);activeSticker=Math.min(activeSticker,stickers.length-1);refreshPlacedList();if(!isPlaying)drawFrame();}
function clearAllStickers(){stickers=[];activeSticker=-1;refreshPlacedList();if(!isPlaying)drawFrame();toast('All stickers cleared');}
function updateActiveStickerSize(){var v=parseInt(document.getElementById('slStickerSize').value);document.getElementById('slStickerSizeVal').textContent=v;if(activeSticker>=0&&stickers[activeSticker]){stickers[activeSticker].size=v;if(!isPlaying)drawFrame();}}
function updateActiveStickerRot(){var v=parseInt(document.getElementById('slStickerRot').value);document.getElementById('slStickerRotVal').textContent=v+'°';if(activeSticker>=0&&stickers[activeSticker]){stickers[activeSticker].rot=v;if(!isPlaying)drawFrame();}}

// ── AI EFFECTS ────────────────────────────────────────────────────
function applyAIEffect(id){
  var audioIds=['denoise','voiceBoost','bassBoost','reverb'];
  if(audioIds.indexOf(id)!==-1){
    if(id==='denoise') audioSettings.noiseCancelOn=!audioSettings.noiseCancelOn;
    if(id==='voiceBoost') audioSettings.voiceBoostOn=!audioSettings.voiceBoostOn;
    if(id==='bassBoost')  audioSettings.bassBoostOn=!audioSettings.bassBoostOn;
    if(id==='reverb')     audioSettings.reverbOn=!audioSettings.reverbOn;
    if(audioReady) applyAudioSettings(); else toast('▶ Press play to activate audio effects');
  } else {
    aiEffects[id]=!aiEffects[id]; if(!isPlaying) drawFrame();
  }
  var btn=document.getElementById('aibtn_'+id);
  var isOn=aiEffects[id]||(id==='denoise'&&audioSettings.noiseCancelOn)||(id==='voiceBoost'&&audioSettings.voiceBoostOn)||(id==='bassBoost'&&audioSettings.bassBoostOn)||(id==='reverb'&&audioSettings.reverbOn);
  if(btn)btn.classList.toggle('active',!!isOn);
  toast((isOn?'ON: ':'OFF: ')+(btn?btn.querySelector('.ai-name').textContent:id));
}
function updateEQ(){
  var b=parseInt(document.getElementById('slEqBass').value),m=parseInt(document.getElementById('slEqMid').value),t=parseInt(document.getElementById('slEqTreble').value);
  document.getElementById('slEqBassVal').textContent=(b>=0?'+':'')+b+'dB';document.getElementById('slEqMidVal').textContent=(m>=0?'+':'')+m+'dB';document.getElementById('slEqTrebleVal').textContent=(t>=0?'+':'')+t+'dB';
  audioSettings.eqBass=b;audioSettings.eqMid=m;audioSettings.eqTreble=t;if(audioReady)applyAudioSettings();
}
function updatePixelFX(){
  chromaVal=parseInt(document.getElementById('slChroma').value)||0;distortVal=parseInt(document.getElementById('slDistort').value)||0;
  scanlinesVal=parseInt(document.getElementById('slScanlines').value)||0;glowVal=parseInt(document.getElementById('slGlow').value)||0;pixelateVal=parseInt(document.getElementById('slPixelate').value)||1;
  document.getElementById('slChromaVal').textContent=chromaVal;document.getElementById('slDistortVal').textContent=distortVal;document.getElementById('slScanlinesVal').textContent=scanlinesVal;document.getElementById('slGlowVal').textContent=glowVal;document.getElementById('slPixelateVal').textContent=pixelateVal<=1?'Off':pixelateVal+'px';
  if(!isPlaying)drawFrame();
}

// ── GRADE ─────────────────────────────────────────────────────────
function updateGrade(){
  var br=document.getElementById('slBright').value,co=document.getElementById('slContrast').value,sa=document.getElementById('slSat').value,wa=parseInt(document.getElementById('slWarm').value);
  vignetteVal=parseInt((document.getElementById('slVig')||{value:30}).value);noiseVal=parseInt((document.getElementById('slNoise')||{value:0}).value);
  document.getElementById('slBrightVal').textContent=br;document.getElementById('slContrastVal').textContent=co;document.getElementById('slSatVal').textContent=sa;document.getElementById('slWarmVal').textContent=wa;
  if(document.getElementById('slVigVal'))document.getElementById('slVigVal').textContent=vignetteVal;if(document.getElementById('slNoiseVal'))document.getElementById('slNoiseVal').textContent=noiseVal;
  customFilter='brightness('+br/100+') contrast('+co/100+') saturate('+sa/100+')'+(wa?' hue-rotate('+wa+'deg)':'');
  document.querySelectorAll('.grade-btn').forEach(function(b){b.classList.remove('active');});if(!isPlaying)drawFrame();
}
function resetGradeSliders(){['slBright','slContrast','slSat'].forEach(function(id){var el=document.getElementById(id);if(el)el.value=100;});var wEl=document.getElementById('slWarm');if(wEl)wEl.value=0;['slBrightVal','slContrastVal','slSatVal'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent='100';});var wVEl=document.getElementById('slWarmVal');if(wVEl)wVEl.textContent='0';}

// ── CROP ──────────────────────────────────────────────────────────
function updateVideoScale(){videoScale=parseInt(document.getElementById('slVideoScale').value)/100;document.getElementById('slVideoScaleVal').textContent=Math.round(videoScale*100)+'%';offsetX=parseInt(document.getElementById('slOffsetX').value);offsetY=parseInt(document.getElementById('slOffsetY').value);document.getElementById('slOffsetXVal').textContent=offsetX;document.getElementById('slOffsetYVal').textContent=offsetY;if(!isPlaying)drawFrame();}
function updateBgColor(){bgColorH=parseInt(document.getElementById('slBgH').value);bgColorS=parseInt(document.getElementById('slBgS').value);bgColorL=parseInt(document.getElementById('slBgL').value);document.getElementById('slBgHVal').textContent=bgColorH;document.getElementById('slBgSVal').textContent=bgColorS;document.getElementById('slBgLVal').textContent=bgColorL;var sw=document.getElementById('bgPreview');if(sw)sw.style.background='hsl('+bgColorH+','+bgColorS+'%,'+bgColorL+'%)';if(!isPlaying)drawFrame();}

// ── PLAYBACK ──────────────────────────────────────────────────────
function togglePlay(){
  if(fileType!=='video'||!vid){toast('Image mode — no playback');return;}
  if(!vid.src){toast('Load a video first');return;}
  if(vid.paused){
    initAudioGraph();if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();applyAudioSettings();
    vid.play();isPlaying=true;updatePlayIcons(true);rafId=requestAnimationFrame(drawFrame);
  }else{
    vid.pause();isPlaying=false;updatePlayIcons(false);cancelAnimationFrame(rafId);drawFrame();
  }
}
function updatePlayIcons(pl){
  var ti=document.getElementById('tlIcon'),bp=document.getElementById('bigPlay'),tap=document.getElementById('playTap');
  if(pl){if(ti)ti.innerHTML='<rect x="1" y="1" width="3" height="10" rx="1" fill="currentColor"/><rect x="7" y="1" width="3" height="10" rx="1" fill="currentColor"/>';if(bp)bp.innerHTML='<svg width="14" height="16" viewBox="0 0 14 16" fill="none"><rect x="1" y="1" width="4" height="14" rx="1" fill="white"/><rect x="9" y="1" width="4" height="14" rx="1" fill="white"/></svg>';if(tap)tap.classList.add('on');}
  else{if(ti)ti.innerHTML='<path d="M1 1L9 6L1 11V1Z" fill="currentColor"/>';if(bp)bp.innerHTML='<svg width="18" height="20" viewBox="0 0 18 20" fill="none"><path d="M2 1.5L16 10L2 18.5V1.5Z" fill="white"/></svg>';if(tap)tap.classList.remove('on');}
}
function toggleMute(){isMuted=!isMuted;if(vid)vid.muted=isMuted;var btn=document.getElementById('muteBtn');if(btn)btn.textContent=isMuted?'🔇':'🔊';}
function toggleFlip(dir){if(dir==='h'){flipH=!flipH;document.getElementById('flipHBtn').classList.toggle('active',flipH);}else{flipV=!flipV;document.getElementById('flipVBtn').classList.toggle('active',flipV);}if(!isPlaying)drawFrame();}
function resetAll(){activeGrade=null;activeFX=null;customFilter='';activeTint=null;duotoneId=null;flipH=false;flipV=false;vignetteVal=30;noiseVal=0;chromaVal=0;distortVal=0;scanlinesVal=0;glowVal=0;pixelateVal=1;videoScale=1;offsetX=0;offsetY=0;activeMotion='none';if(!isPlaying)drawFrame();toast('Reset to defaults');}

// ── MUSIC ─────────────────────────────────────────────────────────
function playMusic(url,itemEl){
  stopMusic();activeMusicUrl=url;
  musicAudio=new Audio(url);musicAudio.volume=0;musicAudio.loop=true;
  musicAudio.play().catch(function(){});
  var fi=musicFade*1000,step=50,vol=musicVolume,cur=0;
  var interval=setInterval(function(){cur+=step;musicAudio.volume=Math.min(vol*cur/fi,vol);if(cur>=fi)clearInterval(interval);},step);
  document.querySelectorAll('.music-item').forEach(function(m){m.classList.remove('playing');});
  if(itemEl)itemEl.classList.add('playing');
  toast('🎵 Playing');
}
function stopMusic(){if(musicAudio){musicAudio.pause();musicAudio.src='';musicAudio=null;}activeMusicUrl=null;document.querySelectorAll('.music-item').forEach(function(m){m.classList.remove('playing');});}
function loadUserMusic(input){var f=input.files[0];if(!f)return;if(_userMusicObjectURL)URL.revokeObjectURL(_userMusicObjectURL);_userMusicObjectURL=URL.createObjectURL(f);document.getElementById('userMusicName').textContent='♪ '+f.name;playMusic(_userMusicObjectURL,null);toast('🎵 '+f.name);}
function updateMusicVol(){musicVolume=parseInt(document.getElementById('slMusicVol').value)/100;document.getElementById('slMusicVolVal').textContent=Math.round(musicVolume*100)+'%';if(musicAudio)musicAudio.volume=musicVolume;}
function updateVoiceVol(){if(vid)vid.volume=parseInt(document.getElementById('slVoiceVol').value)/100;document.getElementById('slVoiceVolVal').textContent=Math.round((vid?vid.volume:1)*100)+'%';}
function updateMusicFade(){musicFade=parseFloat(document.getElementById('slMusicFade').value);document.getElementById('slMusicFadeVal').textContent=musicFade+'s';}

// ── PANEL TABS ────────────────────────────────────────────────────
function switchTab(btn){
  var tabId=btn.dataset.tab;
  document.querySelectorAll('.isb').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
  var panel=document.getElementById(tabId);if(panel)panel.classList.add('active');
  var lbl=document.getElementById('rpLabel');if(lbl)lbl.textContent=btn.querySelector('span:last-child').textContent.toUpperCase();
}

// ── EXPORT ────────────────────────────────────────────────────────
function setExportFormat(btn){exportFormat=btn.dataset.fmt;document.querySelectorAll('.fmt-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');var note=document.getElementById('mp4Note');if(note)note.style.display=exportFormat==='mp4'?'block':'none';}
function setFPS(btn){exportFPS=parseInt(btn.dataset.fps);document.querySelectorAll('.fps-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');}

function doExport(){
  if(!clip||!cv){toast('No file loaded');return;}
  if(exportFormat==='gif'){toast('GIF: export as WebM first, then convert at ezgif.com');return;}
  _preExportW=cv.width;_preExportH=cv.height;
  var q=document.querySelector('input[name="quality"]:checked'),qual=q?q.value:'high';
  var r=RATIOS.find(function(x){return x.id===exportAspect;})||RATIOS[0];
  if(qual==='ultra'){cv.width=r.w*2;cv.height=r.h*2;}else if(qual==='web'){cv.width=Math.round(r.w*.75);cv.height=Math.round(r.h*.75);}else{cv.width=r.w;cv.height=r.h;}
  var ep=document.getElementById('expProg'),bar=document.getElementById('epFill'),lbl=document.getElementById('epLbl');
  if(ep)ep.style.display='block';var dlBtn=document.getElementById('dlBtn');if(dlBtn)dlBtn.disabled=true;
  if(fileType==='image'){
    drawFrame();setTimeout(function(){cv.toBlob(function(blob){triggerDownload(blob,'impactgrid_'+activeStyle.id+'.png');if(bar)bar.style.width='100%';if(lbl)lbl.textContent='✓ Image saved!';if(dlBtn)dlBtn.disabled=false;toast('✓ Image exported!');restorePreviewCanvas();setTimeout(function(){if(ep)ep.style.display='none';},3000);},'image/png');},250);return;
  }
  var stream=cv.captureStream(exportFPS);
  // FIX: reuse existing audio graph — never create a second AudioContext on the same <video> element
  var as=getExportAudioStream();if(as)as.getAudioTracks().forEach(function(t){stream.addTrack(t);});
  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(function(m){return MediaRecorder.isTypeSupported(m);})||'video/webm';
  var bitrate=qual==='ultra'?12000000:qual==='web'?2500000:6000000;
  var chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:bitrate});
  rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
  rec.onstop=function(){
    var webmBlob=new Blob(chunks,{type:'video/webm'});
    if(exportFormat==='webm'){
      triggerDownload(webmBlob,'impactgrid_'+activeStyle.id+'.webm');
      if(bar)bar.style.width='100%';if(lbl)lbl.textContent='✓ Downloaded as WebM!';if(dlBtn)dlBtn.disabled=false;
      toast('✓ WebM exported!');restorePreviewCanvas();setTimeout(function(){if(ep)ep.style.display='none';},4000);
    }else{
      if(lbl)lbl.textContent='Converting to MP4…';if(bar)bar.style.width='92%';
      convertToMP4(webmBlob,function(mp4Blob){
        triggerDownload(mp4Blob,'impactgrid_'+activeStyle.id+'.mp4');
        if(bar)bar.style.width='100%';if(lbl)lbl.textContent='✓ MP4 Downloaded!';if(dlBtn)dlBtn.disabled=false;
        toast('✓ MP4 exported!');restorePreviewCanvas();setTimeout(function(){if(ep)ep.style.display='none';},5000);
      },function(err){
        console.warn('FFmpeg fallback:',err);
        triggerDownload(webmBlob,'impactgrid_'+activeStyle.id+'_rename-to-mp4.webm');
        if(bar)bar.style.width='100%';if(lbl)lbl.textContent='⚠ Saved as WebM — rename to .mp4';if(dlBtn)dlBtn.disabled=false;
        toast('Saved — rename to .mp4 if needed');restorePreviewCanvas();setTimeout(function(){if(ep)ep.style.display='none';},6000);
      });
    }
  };
  if(vid)vid.currentTime=0;isPlaying=true;if(vid)vid.play();
  rec.start(100);rafId=requestAnimationFrame(drawFrame);
  var dur=(vid?vid.duration:10)*1000,t0=Date.now();
  var pi=setInterval(function(){var p=Math.min((Date.now()-t0)/dur*88,88);if(bar)bar.style.width=p+'%';if(lbl)lbl.textContent='Recording… '+Math.round(p)+'%';},300);
  // FIX: cancel RAF loop when export recording finishes, not just when video ends
  if(vid)vid.onended=function(){clearInterval(pi);isPlaying=false;cancelAnimationFrame(rafId);rec.stop();};
}

function restorePreviewCanvas(){if(!cv)return;cv.width=_preExportW;cv.height=_preExportH;fitCanvas();drawFrame();}
function triggerDownload(blob,filename){var a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},5000);}

async function convertToMP4(webmBlob,onSuccess,onError){
  try{
    var ffmpeg=FFmpeg.createFFmpeg({log:false,corePath:'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'});
    var lbl=document.getElementById('epLbl');if(lbl)lbl.textContent='Loading FFmpeg converter…';
    await ffmpeg.load();
    if(lbl)lbl.textContent='Converting to MP4…';
    var data=new Uint8Array(await webmBlob.arrayBuffer());
    ffmpeg.FS('writeFile','input.webm',data);
    await ffmpeg.run('-i','input.webm','-c:v','libx264','-preset','fast','-crf','23','-c:a','aac','-movflags','+faststart','output.mp4');
    var out=ffmpeg.FS('readFile','output.mp4');
    ffmpeg.FS('unlink','input.webm');ffmpeg.FS('unlink','output.mp4');
    onSuccess(new Blob([out.buffer],{type:'video/mp4'}));
  }catch(e){onError(e);}
}

function exportThumbnail(){
  if(!clip||!cv){toast('Load a file first');return;}
  drawFrame();setTimeout(function(){cv.toBlob(function(blob){triggerDownload(blob,'impactgrid_thumbnail.png');toast('✓ Thumbnail saved!');},  'image/png');},200);
}

// ── UTILS ─────────────────────────────────────────────────────────
function ft(s){var m=Math.floor(s/60),sec=Math.floor(s%60);return m+':'+(sec<10?'0':'')+sec;}
function toast(msg){var el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(window._toastTimer);window._toastTimer=setTimeout(function(){el.classList.remove('show');},2400);}
