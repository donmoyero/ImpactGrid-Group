// ================================================================
// ImpactGrid Creator Studio v3 — Master Editor
// ================================================================

// ── PROXY CONFIG ─────────────────────────────────────────────────
// Set this to your deployed Cloudflare Worker URL.
// Never put the AssemblyAI key here — it lives in the Worker secret.
// Example: 'https://impactgrid-proxy.YOUR-SUBDOMAIN.workers.dev'
var ASSEMBLY_KEY   = '80e3b7c067bf4d68a16ad9e32efc9887'; // direct key
var PROXY_BASE_URL = 'https://jolly-waterfall-49b7.ogtinzplayandearn.workers.dev'; // unused

// ─── STATE ───────────────────────────────────────────────────────
var clip         = null;
var fileType     = 'video';
var activeStyle  = null;
var allWords     = [];
var sentences    = [];
var isPlaying    = false;
var rafId        = null;
var transcriptId = null;
var pollTimer    = null;
var pollRetries  = 0;          // FIX: track poll attempts
var MAX_POLL_RETRIES = 240;    // ~600 seconds max (240 × 2.5s) — universal-2 can be slow
var isCancelled  = false;      // FIX: cancellation flag
var isMuted      = false;

// Caption
var captionPos   = 'bot';
var capSize      = 22;
var activeWordAnim = null;
var captionColor = '#ffffff';
var captionBg    = 'none';
var letterSpacing = 0;

// Text overlay
var overlayTextVal = '';
var overlayPos   = 'mid';
var overlayFontId = 'bold';
var overlayColor = '#ffffff';
var overlayStyle = 'normal';
var overlayAnim  = 'none';
var overlayOpacity = 1;
var overlayOutline = 0;
var overlayShadow = 8;

// Stickers
var stickers = [];
var activeSticker = -1;

// Grade / FX
var activeGrade  = null;
var activeFX     = null;
var customFilter = '';
var vignetteVal  = 30;
var noiseVal     = 0;
var activeTint   = null;
var activeMotion = 'none';
var motionPhase  = 0;
var flipH = false, flipV = false;
var bgBlur = 0;

// Crop / layout
var exportFmt    = 'reel';
var aspectRatio  = '9:16';
var bgMode       = 'blur';
var bgColorH = 240, bgColorS = 20, bgColorL = 5;
var videoScale = 1;
var offsetX = 0, offsetY = 0;

// Audio
var musicAudio    = null;
var musicVolume   = 0.4;
var activeMusicUrl = null;
var _userMusicObjectURL = null;   // FIX: track for cleanup
var activeMusicCat = 'All';
var musicFade     = 1;

// ─── REAL AUDIO PROCESSING (Web Audio API) ────────────────────────
var audioCtx      = null;
var audioSource   = null;
var gainNode      = null;
var noiseGate     = null;
var hiPassFilter  = null;
var loPassFilter  = null;
var eqBass        = null;
var eqMid         = null;
var eqTreble      = null;
var reverbNode    = null;
var reverbGain    = null;
var dryGain       = null;
var audioReady    = false;

var audioSettings = {
  noiseCancelOn : false,
  noiseCancelAmt: 30,
  bgNoiseGateOn : false,
  reverbOn      : false,
  reverbMix     : 0.3,
  eqBass        : 0,
  eqMid         : 0,
  eqTreble      : 0,
  voiceBoostOn  : false,
  bassBoostOn   : false
};

// ─── DOM REFS — grabbed after DOMContentLoaded ───────────────────
// FIX: never grab DOM at parse time — creator-editor.html has no canvas
var vid, cv, ctx, grC, grX;

function initDOMRefs(){
  vid = document.getElementById('masterVid');
  cv  = document.getElementById('cv');
  if(cv){
    ctx = cv.getContext('2d');
    grC = document.createElement('canvas');
    grX = grC.getContext('2d');
  }
}

// ─── AUDIO GRAPH ─────────────────────────────────────────────────
// FIX: one AudioContext owns vid for its entire lifetime.
// Export taps gainNode → exportStreamDest instead of creating a new AudioContext.
var exportStreamDest = null;   // MediaStreamAudioDestinationNode, created once on first export

function initAudioGraph(){
  if(audioReady || !vid) return;
  try{
    audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
    audioSource = audioCtx.createMediaElementSource(vid);

    hiPassFilter = audioCtx.createBiquadFilter();
    hiPassFilter.type = 'highpass';
    hiPassFilter.frequency.value = 80;

    loPassFilter = audioCtx.createBiquadFilter();
    loPassFilter.type = 'lowpass';
    loPassFilter.frequency.value = 18000;

    noiseGate = audioCtx.createDynamicsCompressor();
    noiseGate.threshold.value = -100;
    noiseGate.knee.value      = 10;
    noiseGate.ratio.value     = 20;
    noiseGate.attack.value    = 0.003;
    noiseGate.release.value   = 0.15;

    eqBass   = audioCtx.createBiquadFilter();
    eqBass.type = 'lowshelf';
    eqBass.frequency.value = 120;
    eqBass.gain.value = 0;

    eqMid    = audioCtx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 2500;
    eqMid.Q.value = 1.2;
    eqMid.gain.value = 0;

    eqTreble = audioCtx.createBiquadFilter();
    eqTreble.type = 'highshelf';
    eqTreble.frequency.value = 8000;
    eqTreble.gain.value = 0;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 1;

    dryGain   = audioCtx.createGain(); dryGain.gain.value = 1;
    reverbGain= audioCtx.createGain(); reverbGain.gain.value = 0;
    reverbNode= audioCtx.createConvolver();
    generateReverb(audioCtx, reverbNode, 2.5);

    audioSource.connect(hiPassFilter);
    hiPassFilter.connect(loPassFilter);
    loPassFilter.connect(noiseGate);
    noiseGate.connect(eqBass);
    eqBass.connect(eqMid);
    eqMid.connect(eqTreble);
    eqTreble.connect(dryGain);
    eqTreble.connect(reverbNode);
    reverbNode.connect(reverbGain);
    dryGain.connect(gainNode);
    reverbGain.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // FIX: pre-wire a stream destination from the same graph so export can tap it
    exportStreamDest = audioCtx.createMediaStreamDestination();
    gainNode.connect(exportStreamDest);

    audioReady = true;
  } catch(e){ console.warn('Audio graph failed:', e); }
}

// FIX: ensure audio graph exists and return the export stream destination.
// Called by doExport() — safe to call multiple times.
function getExportAudioStream(){
  if(!audioReady){ initAudioGraph(); }
  if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return exportStreamDest ? exportStreamDest.stream : null;
}

function generateReverb(ac, convolver, duration){
  var sr   = ac.sampleRate;
  var len  = Math.floor(sr * duration);
  var buf  = ac.createBuffer(2, len, sr);
  for(var ch=0; ch<2; ch++){
    var d = buf.getChannelData(ch);
    for(var i=0; i<len; i++){
      d[i] = (Math.random()*2-1) * Math.pow(1-i/len, 2.5);
    }
  }
  convolver.buffer = buf;
}

function applyAudioSettings(){
  if(!audioReady) return;

  if(audioSettings.noiseCancelOn){
    noiseGate.threshold.value = -(audioSettings.noiseCancelAmt * 1.5 + 10);
    noiseGate.ratio.value = 20;
    hiPassFilter.frequency.value = 100;
    loPassFilter.frequency.value = 16000;
    // FIX: toast removed — applyAudioSettings fires on every play press, toast was spamming
  } else {
    noiseGate.threshold.value = -100;
    hiPassFilter.frequency.value = 80;
    loPassFilter.frequency.value = 18000;
  }

  if(audioSettings.voiceBoostOn){
    eqMid.frequency.value = 2000;
    eqMid.Q.value = 0.8;
    eqMid.gain.value = 6;
  } else {
    eqMid.gain.value = audioSettings.eqMid;
  }

  eqBass.gain.value = audioSettings.bassBoostOn ? 8 : audioSettings.eqBass;
  eqTreble.gain.value = audioSettings.eqTreble;

  if(audioSettings.reverbOn){
    dryGain.gain.value    = 1 - audioSettings.reverbMix;
    reverbGain.gain.value = audioSettings.reverbMix;
  } else {
    dryGain.gain.value    = 1;
    reverbGain.gain.value = 0;
  }
}

// ─── CAPTION STYLES ──────────────────────────────────────────────
var STYLES = [
  { id:'fire',       name:'🔥 Fire Pill',     desc:'Active word glows in orange pill.',  tags:['TikTok','Viral'],   bg:'linear-gradient(150deg,#1a0400,#0d0200)',  render:renderFire },
  { id:'colourflip', name:'🎨 Colour Flip',   desc:'Words alternate white and gold.',    tags:['Modern','Bold'],    bg:'linear-gradient(150deg,#0a0a0a,#141414)',  render:renderColourFlip },
  { id:'cinematic',  name:'🎬 Cinematic',     desc:'Elegant fade. Blue tones. Film bars.',tags:['Film','Premium'], bg:'linear-gradient(150deg,#000814,#001233)',  render:renderCinematic },
  { id:'hype',       name:'⚡ Hype Centre',   desc:'One huge word. Pure impact.',        tags:['Sports','Launch'],  bg:'linear-gradient(150deg,#1a1000,#080400)',  render:renderHype },
  { id:'karaoke',    name:'💜 Neon Karaoke',  desc:'Dark bar, gold highlight word.',     tags:['Podcast','Night'],  bg:'linear-gradient(150deg,#05000f,#0f0020)',  render:renderKaraoke },
  { id:'split',      name:'✂ Bold Split',    desc:'Big word top, sentence below.',      tags:['Drama','Impact'],   bg:'linear-gradient(150deg,#080808,#040404)',  render:renderSplit },
  { id:'typewriter', name:'⌨ Typewriter',   desc:'Words type in with cursor.',          tags:['Clean','Satisfy'],  bg:'linear-gradient(150deg,#081a10,#040f06)',  render:renderTypewriter },
  { id:'bounce',     name:'🎵 Bounce',        desc:'Words bounce, hue-shift with beat.', tags:['Music','Fun'],      bg:'linear-gradient(150deg,#0d0020,#1a0030)',  render:renderBounce },
  { id:'minimal',    name:'◽ Minimal',       desc:'Thin clean text, luxury feel.',      tags:['Luxury','Brand'],   bg:'linear-gradient(150deg,#0a0a0a,#111)',     render:renderMinimal },
  { id:'glitch',     name:'⚡ Glitch RGB',   desc:'RGB split with digital noise.',      tags:['Edgy','Tech'],      bg:'linear-gradient(150deg,#000a00,#050505)',  render:renderGlitch },
  { id:'outline',    name:'◻ Outline',       desc:'Word outline fills on active.',      tags:['Bold','Urban'],     bg:'linear-gradient(150deg,#080808,#0f0f0f)',  render:renderOutline },
  { id:'stack',      name:'📚 Word Stack',   desc:'Words stack vertically coloured.',   tags:['Unique','Vertical'],bg:'linear-gradient(150deg,#0a0018,#100028)',  render:renderStack },
  { id:'chromarpt',  name:'💥 Chroma Repeat', desc:'Active word explodes with RGB repeat everywhere.',  tags:['Viral','TikTok'],   bg:'linear-gradient(150deg,#000814,#0a0000)',  render:renderChromaRepeat },
  { id:'scanline',   name:'⚡ Giant Scanline',  desc:'Active word goes huge with scanlines, rest stays clean.',tags:['Impact','Drama'],   bg:'linear-gradient(150deg,#080808,#141414)',  render:renderScanline }
];
activeStyle = STYLES[0];

var WORD_ANIMS = [
  { id:'default', name:'Default',   desc:'Style default' },
  { id:'slam',    name:'💥 Slam',    desc:'Crashes in from above' },
  { id:'pop',     name:'⭕ Pop',     desc:'Scale burst entrance' },
  { id:'glow',    name:'✨ Glow',    desc:'Neon pulse on active' },
  { id:'shake',   name:'📳 Shake',   desc:'Vibrates with energy' },
  { id:'stamp',   name:'🖨 Stamp',   desc:'Smashes on white rect' },
  { id:'rise',    name:'⬆ Rise',    desc:'Slides up from below' },
  { id:'zoom',    name:'🔍 Zoom',    desc:'Zooms in from nothing' }
];

var GRADES = [
  { id:'none',   name:'Original', bg:'#2a2a2a',                                          filter:'none' },
  { id:'warm',   name:'Warm',     bg:'linear-gradient(135deg,#3d1a00,#8b4500)',           filter:'brightness(1.05) saturate(1.3) sepia(0.18)' },
  { id:'cold',   name:'Cold',     bg:'linear-gradient(135deg,#001233,#0a3d6e)',           filter:'brightness(0.95) saturate(0.75) hue-rotate(185deg)' },
  { id:'vivid',  name:'Vivid',    bg:'linear-gradient(135deg,#1a0030,#003030)',           filter:'brightness(1.07) saturate(1.9) contrast(1.1)' },
  { id:'noir',   name:'Noir',     bg:'linear-gradient(135deg,#000,#2a2a2a)',             filter:'grayscale(1) contrast(1.35) brightness(0.88)' },
  { id:'golden', name:'Golden',   bg:'linear-gradient(135deg,#2a1a00,#6b4a00)',          filter:'brightness(1.08) saturate(1.2) sepia(0.4)' },
  { id:'moody',  name:'Moody',    bg:'linear-gradient(135deg,#0a0014,#140028)',          filter:'brightness(0.8) saturate(0.72) contrast(1.18)' },
  { id:'sunset', name:'Sunset',   bg:'linear-gradient(135deg,#3d0a00,#8b2000)',          filter:'brightness(1.06) saturate(1.5) hue-rotate(-18deg)' },
  { id:'fresh',  name:'Fresh',    bg:'linear-gradient(135deg,#002200,#004400)',          filter:'brightness(1.06) saturate(1.1) hue-rotate(12deg)' },
  { id:'cyber',  name:'Cyber',    bg:'linear-gradient(135deg,#001a2a,#002a3a)',          filter:'brightness(1.02) saturate(1.4) hue-rotate(160deg) contrast(1.1)' },
  { id:'dreamy', name:'Dreamy',   bg:'linear-gradient(135deg,#1a0030,#2a0050)',          filter:'brightness(1.08) saturate(0.9)' },
  { id:'hard',   name:'Hard',     bg:'linear-gradient(135deg,#111,#333)',               filter:'contrast(1.5) brightness(0.92)' }
];

var FX_PRESETS = [
  { id:'none',    name:'None',     filter:'none',                                        bg:'#2a2a2a' },
  { id:'glitch2', name:'Glitch',   filter:'none',  special:'glitch',                    bg:'linear-gradient(135deg,#000a00,#0a0a00)' },
  { id:'vhs',     name:'VHS',      filter:'saturate(1.4) contrast(1.15) brightness(0.95)', bg:'linear-gradient(135deg,#1a0000,#000)' },
  { id:'film',    name:'Film',     filter:'sepia(0.3) contrast(1.1) brightness(0.92)',   bg:'linear-gradient(135deg,#2a1a00,#1a1000)' },
  { id:'neon',    name:'Neon',     filter:'saturate(2) brightness(1.1) contrast(1.2)',   bg:'linear-gradient(135deg,#000020,#000040)' },
  { id:'matte',   name:'Matte',    filter:'contrast(0.85) brightness(1.05) saturate(0.9)',bg:'linear-gradient(135deg,#1a1a2a,#2a2a3a)' },
  { id:'pop',     name:'Pop Art',  filter:'saturate(2.5) contrast(1.3)',                 bg:'linear-gradient(135deg,#2a0030,#003030)' },
  { id:'cine',    name:'Cine',     filter:'brightness(0.9) contrast(1.1) saturate(0.8) sepia(0.15)', bg:'linear-gradient(135deg,#0a0a14,#141428)' },
  { id:'fade',    name:'Fade',     filter:'brightness(1.1) contrast(0.82) saturate(0.75)', bg:'linear-gradient(135deg,#2a2a3a,#3a3a4a)' }
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
  { label:'0.5×',  val:0.5 },
  { label:'1×',    val:1 },
  { label:'1.5×',  val:1.5 },
  { label:'2×',    val:2 }
];

var RATIOS = [
  { id:'9:16',  name:'Reel',    icon:'📱', w:540, h:960 },
  { id:'16:9',  name:'YouTube', icon:'▶',  w:1280,h:720 },
  { id:'1:1',   name:'Square',  icon:'⬛', w:720, h:720 },
  { id:'4:5',   name:'Portrait',icon:'📷', w:720, h:900 },
  { id:'2.35:1',name:'Cinema',  icon:'🎬', w:1280,h:544 }
];

var EXPORT_PLATFORMS = [
  { id:'tiktok',    name:'TikTok / Reels',   desc:'9:16 vertical · 1080×1920', ratio:'9:16',  icon:'📱' },
  { id:'youtube',   name:'YouTube',           desc:'16:9 landscape · 1920×1080',ratio:'16:9', icon:'▶' },
  { id:'shorts',    name:'YouTube Shorts',    desc:'9:16 vertical · 1080×1920', ratio:'9:16',  icon:'🩳' },
  { id:'instagram', name:'Instagram Post',    desc:'1:1 square · 1080×1080',    ratio:'1:1',   icon:'📸' },
  { id:'linkedin',  name:'LinkedIn',          desc:'1:1 or 16:9 · Professional', ratio:'16:9', icon:'💼' }
];

var FONTS = [
  { id:'bold',     label:'Bold',    family:'"DM Sans",sans-serif',          weight:'700' },
  { id:'black',    label:'Black',   family:'"DM Sans",sans-serif',          weight:'900' },
  { id:'playfair', label:'Elegant', family:'"Playfair Display",serif',      weight:'900' },
  { id:'bebas',    label:'Display', family:'"Bebas Neue","Oswald",sans-serif',weight:'400' },
  { id:'mono',     label:'Mono',    family:'"Courier New",monospace',       weight:'700' },
  { id:'oswald',   label:'Oswald',  family:'"Oswald",sans-serif',           weight:'600' }
];

var TEXT_STYLES = [
  { id:'normal',  label:'Normal' },
  { id:'italic',  label:'Italic' },
  { id:'upper',   label:'CAPS' },
  { id:'lower',   label:'lower' }
];

var TEXT_ANIMS = [
  { id:'none',   label:'None' },
  { id:'fade',   label:'Fade' },
  { id:'rise',   label:'Rise' },
  { id:'pop',    label:'Pop' },
  { id:'type',   label:'Type' }
];

var COLORS = ['#ffffff','#f5c842','#7c5cfc','#ff4d6d','#22d3ee','#4ade80','#f97316','#e879f9','#ff5c1a','#000000'];
var CAP_COLORS = ['#ffffff','#f5c842','#ff5c1a','#22d3ee','#4ade80','#ff4d6d','#c084fc'];
var TINTS = [
  { color:'transparent', label:'None' },
  { color:'rgba(255,100,0,0.15)', label:'Warm' },
  { color:'rgba(0,100,255,0.15)', label:'Cool' },
  { color:'rgba(100,0,200,0.15)', label:'Purple' },
  { color:'rgba(0,200,100,0.15)', label:'Green' },
  { color:'rgba(255,200,0,0.12)', label:'Gold' },
  { color:'rgba(255,0,80,0.12)',  label:'Red' }
];

var BG_OPTS = ['blur','black','white','gradient','custom'];

var MUSIC_LIBRARY = [
  { name:'Lo-Fi Chill',         vibe:'Calm · 88 BPM',      icon:'🎧', cat:'Chill',    url:'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { name:'Acoustic Vibe',       vibe:'Warm · 85 BPM',      icon:'🎸', cat:'Chill',    url:'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3' },
  { name:'Coffee Shop Jazz',    vibe:'Relax · 75 BPM',     icon:'☕', cat:'Chill',    url:'https://cdn.pixabay.com/audio/2022/10/18/audio_ec97b8f1e1.mp3' },
  { name:'Soft Piano',          vibe:'Gentle · 68 BPM',    icon:'🎹', cat:'Chill',    url:'https://cdn.pixabay.com/audio/2022/01/18/audio_d1718ab2c0.mp3' },
  { name:'Epic Cinematic',      vibe:'Intense · 120 BPM',  icon:'🎬', cat:'Cinematic',url:'https://cdn.pixabay.com/audio/2022/03/15/audio_d75ef65dbc.mp3' },
  { name:'Inspiring Ambient',   vibe:'Calm · 70 BPM',      icon:'🌊', cat:'Cinematic',url:'https://cdn.pixabay.com/audio/2023/03/09/audio_5b576b7e2b.mp3' },
  { name:'Dramatic Orchestra',  vibe:'Epic · 130 BPM',     icon:'🎻', cat:'Cinematic',url:'https://cdn.pixabay.com/audio/2022/03/10/audio_270f49c6d5.mp3' },
  { name:'Dark Suspense',       vibe:'Tense · 90 BPM',     icon:'🌑', cat:'Cinematic',url:'https://cdn.pixabay.com/audio/2022/11/22/audio_2c04d0b9f3.mp3' },
  { name:'Upbeat Corporate',    vibe:'Positive · 115 BPM', icon:'💼', cat:'Upbeat',   url:'https://cdn.pixabay.com/audio/2022/10/25/audio_946c1c7a09.mp3' },
  { name:'Energetic Pop',       vibe:'Fun · 128 BPM',      icon:'🎉', cat:'Upbeat',   url:'https://cdn.pixabay.com/audio/2022/11/17/audio_febc508520.mp3' },
  { name:'Summer Vibes',        vibe:'Happy · 118 BPM',    icon:'☀️', cat:'Upbeat',   url:'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3' },
  { name:'Feel Good',           vibe:'Bright · 110 BPM',   icon:'😊', cat:'Upbeat',   url:'https://cdn.pixabay.com/audio/2022/10/11/audio_6c8eff8a38.mp3' },
  { name:'Hip Hop Beat',        vibe:'Cool · 95 BPM',      icon:'🔥', cat:'Hip-Hop',  url:'https://cdn.pixabay.com/audio/2022/10/16/audio_31e3b04264.mp3' },
  { name:'Deep Bass',           vibe:'Dark · 100 BPM',     icon:'🎵', cat:'Hip-Hop',  url:'https://cdn.pixabay.com/audio/2022/09/13/audio_d1718ab2c0.mp3' },
  { name:'Trap Anthem',         vibe:'Hard · 140 BPM',     icon:'👑', cat:'Hip-Hop',  url:'https://cdn.pixabay.com/audio/2022/09/02/audio_2dde668d05.mp3' },
  { name:'Street Flow',         vibe:'Smooth · 92 BPM',    icon:'🏙', cat:'Hip-Hop',  url:'https://cdn.pixabay.com/audio/2022/11/09/audio_914e1c1a03.mp3' },
  { name:'Synthwave Drive',     vibe:'Retro · 105 BPM',    icon:'🌆', cat:'Electronic',url:'https://cdn.pixabay.com/audio/2022/06/08/audio_6c8eff8a38.mp3' },
  { name:'EDM Drop',            vibe:'Hype · 135 BPM',     icon:'⚡', cat:'Electronic',url:'https://cdn.pixabay.com/audio/2022/10/30/audio_1808fbf07a.mp3' },
  { name:'Chill Beats',         vibe:'Flow · 98 BPM',      icon:'🎛', cat:'Electronic',url:'https://cdn.pixabay.com/audio/2023/01/25/audio_5b576b7e2b.mp3' },
  { name:'Future Bass',         vibe:'Modern · 150 BPM',   icon:'🚀', cat:'Electronic',url:'https://cdn.pixabay.com/audio/2022/07/25/audio_febc508520.mp3' }
];

var STICKER_CATS = {
  'Popular': ['🔥','⚡','💯','🎯','💪','🙌','👏','❤️','💫','✨','🌟','⭐','🎉','🚀','💥','👑','😍','🤩','💰','🤑'],
  'Faces':   ['😂','😭','🤣','😤','🥶','🥵','😎','🤯','😱','🥹','😡','🤔','😴','🤗','🤫','😬','🫡','🥸','😏','🤪'],
  'Hands':   ['👍','👎','🤙','✌️','🤞','🤟','👊','✊','🤛','🤜','🙏','👋','🫶','🫵','👈','👉','☝️','🤝','💅','🫂'],
  'Objects': ['💎','📱','🎤','🎬','📸','🎶','🎵','🏆','🥇','🎁','💡','🔑','⚡','🌈','🌙','☀️','⚽','🏀','🎮','🚗'],
  'Animals': ['🦁','🐯','🦊','🐺','🦋','🐬','🦅','🦄','🐉','🦈','🐻','🦍','🦊','🐸','🦜','🦩','🐙','🦑','🦞','🦀']
};

// ─── BUILD STYLE PICKER ───────────────────────────────────────────
(function(){
  var grid = document.getElementById('styleGrid');
  if(!grid) return;
  var DEMOS = {
    fire:       '<div style="display:flex;gap:4px;align-items:center"><span style="background:#f97316;color:#fff;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:800;box-shadow:0 0 10px rgba(249,115,22,.7)">FIRE</span><span style="color:rgba(255,255,255,.2);font-size:10px;font-weight:700">WORD</span></div>',
    colourflip: '<span style="color:#fff;font-size:13px;font-weight:800">YOUR </span><span style="color:#f5c842;font-size:13px;font-weight:800">WORDS </span><span style="color:rgba(255,255,255,.2);font-size:12px;font-weight:800">HERE</span>',
    cinematic:  '<span style="color:#93c5fd;font-size:12px;font-weight:400;letter-spacing:2px;text-shadow:0 0 10px #93c5fd">YOUR WORDS HERE</span>',
    hype:       '<span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:42px;color:#f5c842;-webkit-text-stroke:2px #000;line-height:1">HYPE</span>',
    karaoke:    '<div style="background:rgba(5,0,15,.97);padding:6px 14px;border-top:2px solid #a855f7"><span style="color:rgba(192,132,252,.3);font-size:11px;font-weight:700">YOUR </span><span style="color:#f5c842;font-size:11px;font-weight:700;text-shadow:0 0 10px #f5c842">WORDS </span><span style="color:rgba(192,132,252,.2);font-size:11px;font-weight:700">HERE</span></div>',
    split:      '<div style="text-align:center"><div style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:34px;color:#fff;letter-spacing:2px;line-height:1">BOLD</div><div style="font-size:9px;color:rgba(255,255,255,.25);margin-top:3px">sentence below</div></div>',
    typewriter: '<span style="color:#4ade80;font-size:13px;font-weight:700;font-family:monospace;text-shadow:0 0 8px #4ade80">YOUR WORDS▌</span>',
    bounce:     '<span style="color:hsl(280,100%,70%);font-size:13px;font-weight:800;text-shadow:0 0 10px hsl(280,100%,60%)">SH</span><span style="color:hsl(330,100%,65%);font-size:18px;font-weight:800;display:inline-block;transform:translateY(-4px)">AK</span><span style="color:hsl(15,100%,65%);font-size:13px;font-weight:800">E</span>',
    minimal:    '<span style="color:rgba(255,255,255,.8);font-size:11px;font-weight:300;letter-spacing:5px">MINIMAL</span>',
    glitch:     '<div style="position:relative;display:inline-block"><span style="color:#ff0044;font-size:13px;font-weight:800;position:absolute;transform:translate(-2px,1px);opacity:.7">GLTCH</span><span style="color:#00ffcc;font-size:13px;font-weight:800;position:absolute;transform:translate(2px,-1px);opacity:.7">GLTCH</span><span style="color:#fff;font-size:13px;font-weight:800;position:relative">GLTCH</span></div>',
    outline:    '<span style="color:transparent;font-size:15px;font-weight:900;-webkit-text-stroke:1.5px #fff;letter-spacing:3px">OUTLINE</span>',
    stack:      '<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="color:#7c5cfc;font-size:9px;font-weight:800;letter-spacing:2px">WORD</span><span style="color:#f5c842;font-size:13px;font-weight:800;letter-spacing:2px">STACK</span><span style="color:#e879f9;font-size:9px;font-weight:800;letter-spacing:2px">STYLE</span></div>',
    chromarpt:  '<div style="position:relative;text-align:center;line-height:1.1"><div style="color:rgba(255,50,50,.55);font-size:9px;font-weight:800;letter-spacing:2px;transform:translate(-2px,0)">BOOKKEEPING</div><div style="color:rgba(50,255,255,.55);font-size:9px;font-weight:800;letter-spacing:2px;transform:translate(2px,0)">BOOKKEEPING</div><div style="color:#fff;font-size:9px;font-weight:800;letter-spacing:2px">BOOKKEEPING</div></div>',
    scanline:   '<div style="position:relative;display:inline-block"><span style="font-size:34px;font-weight:900;color:#fff;font-family:sans-serif;letter-spacing:-1px;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.35) 3px,rgba(0,0,0,.35) 4px);-webkit-background-clip:text;background-clip:text">DEADLY</span></div>'
  };
  STYLES.forEach(function(s, si){
    var card = document.createElement('div');
    card.className = 'sc' + (si===0?' sel':'');
    card.innerHTML =
      '<div class="sc-demo" style="background:'+s.bg+'">'+(DEMOS[s.id]||'')+'<div class="sc-tick">✓</div></div>'
      +'<div class="sc-body"><div class="sc-name">'+s.name+'</div><div class="sc-desc">'+s.desc+'</div>'
      +'<div class="sc-tags">'+s.tags.map(function(t){return '<span class="sc-tag">'+t+'</span>';}).join('')+'</div></div>';
    card.onclick = function(){
      document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('sel');});
      card.classList.add('sel'); activeStyle = s;
      setTimeout(function(){ allWords.length ? launchPreview() : processWithAssemblyAI(); }, 180);
    };
    grid.appendChild(card);
  });
})();

// ─── BUILD PANEL UI ───────────────────────────────────────────────
function buildAllPanels(){
  buildCaptionList(); buildWordAnimGrid(); buildCapColors(); buildCapBg();
  buildFontGrid(); buildColorStrip(); buildTxtStyleRow(); buildTxtAnims();
  buildStickerGrid();
  buildGradeGrid(); buildTintGrid();
  buildFXGrid(); buildMotionBtns(); buildSpeedGrid();
  buildDuotoneRow();
  buildRatioGrid(); buildBgOpts();
  buildMusicCats(); buildMusicList();
  buildExportPlatforms();
}

function buildCaptionList(){
  var list = document.getElementById('miniStyles'); if(!list) return;
  list.innerHTML = '';
  var MINI = {
    fire:       '<div style="background:linear-gradient(135deg,#1a0400,#0d0200);width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:3px"><span style="background:#f97316;color:#fff;padding:1px 6px;border-radius:3px;font-size:8px;font-weight:800">FIRE</span></div>',
    colourflip: '<div style="background:#0a0a0a;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:9px;font-weight:800">YOUR </span><span style="color:#f5c842;font-size:9px;font-weight:800">WORD</span></div>',
    cinematic:  '<div style="background:linear-gradient(135deg,#000814,#001233);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#93c5fd;font-size:8px;letter-spacing:1px">your words</span></div>',
    hype:       '<div style="background:linear-gradient(135deg,#1a1000,#080400);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:20px;color:#f5c842;-webkit-text-stroke:1px #000">BIG</span></div>',
    karaoke:    '<div style="background:linear-gradient(135deg,#05000f,#0f0020);width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px"><div style="background:rgba(5,0,15,.95);padding:2px 8px;border-top:1px solid #a855f7;font-size:7px;color:#f5c842;font-weight:700">KARAOKE</div></div>',
    split:      '<div style="background:#080808;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:16px;color:#fff">BIG</span><span style="font-size:6px;color:rgba(255,255,255,.2)">small below</span></div>',
    typewriter: '<div style="background:#081a10;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#4ade80;font-size:9px;font-weight:700;font-family:monospace">TYPE▌</span></div>',
    bounce:     '<div style="background:linear-gradient(135deg,#0d0020,#1a0030);width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:1px"><span style="color:hsl(280,100%,70%);font-size:9px;font-weight:800">S</span><span style="color:hsl(330,100%,65%);font-size:12px;font-weight:800">H</span><span style="color:hsl(15,100%,65%);font-size:9px;font-weight:800">K</span></div>',
    minimal:    '<div style="background:#0a0a0a;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:rgba(255,255,255,.75);font-size:7px;font-weight:300;letter-spacing:3px">MINIMAL</span></div>',
    glitch:     '<div style="background:#000a00;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative"><span style="color:#ff0044;font-size:9px;font-weight:800;position:absolute;transform:translate(-2px,1px);opacity:.7">GLT</span><span style="color:#00ffcc;font-size:9px;font-weight:800;position:absolute;transform:translate(2px,-1px);opacity:.7">GLT</span><span style="color:#fff;font-size:9px;font-weight:800;position:relative">GLT</span></div>',
    outline:    '<div style="background:#080808;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:transparent;font-size:10px;font-weight:900;-webkit-text-stroke:1px #fff;letter-spacing:2px">OUT</span></div>',
    stack:      '<div style="background:linear-gradient(135deg,#0a0018,#100028);width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px"><span style="color:#7c5cfc;font-size:6px;font-weight:800">WORD</span><span style="color:#f5c842;font-size:9px;font-weight:800">STACK</span></div>'
  };
  STYLES.forEach(function(s, si){
    var btn = document.createElement('button');
    btn.className = 'csb' + (si===0?' active-style':'');
    btn.innerHTML = '<div class="csb-prev">'+(MINI[s.id]||'')+'</div><div><div class="csb-name">'+s.name+'</div><div class="csb-tag">'+s.tags.join(' · ')+'</div></div>';
    btn.onclick = function(){
      activeStyle = s;
      document.querySelectorAll('.csb').forEach(function(x){x.classList.remove('active-style');});
      btn.classList.add('active-style');
      document.getElementById('styleBadge').textContent = s.name;
      document.getElementById('expStyle').textContent   = s.name;
      if(!isPlaying) drawFrame(); toast(s.name+' applied');
    };
    list.appendChild(btn);
  });
}

function buildWordAnimGrid(){
  var g = document.getElementById('wordAnimGrid'); if(!g) return; g.innerHTML='';
  WORD_ANIMS.forEach(function(wa,i){
    var b = document.createElement('button');
    b.className = 'wa-btn'+(i===0?' active-wa':'');
    b.textContent = wa.name;
    b.onclick = function(){
      activeWordAnim = i===0?null:wa;
      document.querySelectorAll('.wa-btn').forEach(function(x){x.classList.remove('active-wa');}); b.classList.add('active-wa');
      toast('Word: '+wa.name); if(!isPlaying) drawFrame();
    };
    g.appendChild(b);
  });
}

function buildCapColors(){
  var c = document.getElementById('capColors'); if(!c) return; c.innerHTML='';
  CAP_COLORS.forEach(function(col,i){
    var d = document.createElement('div');
    d.className = 'cap-col-dot'+(i===0?' active':'');
    d.style.background=col; if(col==='#000000') d.style.border='2px solid rgba(255,255,255,.2)';
    d.onclick=function(){
      captionColor=col;
      document.querySelectorAll('.cap-col-dot').forEach(function(x){x.classList.remove('active');}); d.classList.add('active');
      if(!isPlaying) drawFrame();
    };
    c.appendChild(d);
  });
}

function buildCapBg(){
  var r = document.getElementById('capBgRow'); if(!r) return; r.innerHTML='';
  ['None','Box','Pill','Underline'].forEach(function(opt,i){
    var b = document.createElement('button');
    b.className='cap-bg-btn'+(i===0?' active':'');
    b.textContent=opt;
    b.onclick=function(){
      captionBg=opt.toLowerCase();
      document.querySelectorAll('.cap-bg-btn').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
      if(!isPlaying) drawFrame();
    };
    r.appendChild(b);
  });
}

function buildFontGrid(){
  var g = document.getElementById('fontGrid'); if(!g) return; g.innerHTML='';
  FONTS.forEach(function(f,i){
    var b = document.createElement('div');
    b.className='font-btn'+(i===0?' active-font':'');
    b.style.fontFamily=f.family; b.style.fontWeight=f.weight; b.textContent=f.label;
    b.onclick=function(){
      overlayFontId=f.id;
      document.querySelectorAll('.font-btn').forEach(function(x){x.classList.remove('active-font');}); b.classList.add('active-font');
      if(!isPlaying) drawFrame();
    };
    g.appendChild(b);
  });
}

function buildColorStrip(){
  var s = document.getElementById('colorStrip'); if(!s) return; s.innerHTML='';
  COLORS.forEach(function(c,i){
    var d = document.createElement('div');
    d.className='col-dot'+(i===0?' active-col':'');
    d.style.background=c; if(c==='#000000') d.style.border='2px solid rgba(255,255,255,.2)';
    d.onclick=function(){
      overlayColor=c;
      document.querySelectorAll('.col-dot').forEach(function(x){x.classList.remove('active-col');}); d.classList.add('active-col');
      if(!isPlaying) drawFrame();
    };
    s.appendChild(d);
  });
}

function buildTxtStyleRow(){
  var r = document.getElementById('txtStyleRow'); if(!r) return; r.innerHTML='';
  TEXT_STYLES.forEach(function(ts,i){
    var b = document.createElement('button');
    b.className='txts-btn'+(i===0?' active':'');
    b.textContent=ts.label;
    b.onclick=function(){
      overlayStyle=ts.id;
      document.querySelectorAll('.txts-btn').forEach(function(x){x.classList.remove('active');}); b.classList.add('active');
      if(!isPlaying) drawFrame();
    };
    r.appendChild(b);
  });
}

function buildTxtAnims(){
  var r = document.getElementById('txtAnimRow'); if(!r) return; r.innerHTML='';
  TEXT_ANIMS.forEach(function(ta,i){
    var b = document.createElement('button');
    b.className='ta-btn'+(i===0?' active-ta':'');
    b.textContent=ta.label;
    b.onclick=function(){
      overlayAnim=ta.id;
      document.querySelectorAll('.ta-btn').forEach(function(x){x.classList.remove('active-ta');}); b.classList.add('active-ta');
    };
    r.appendChild(b);
  });
}

function buildStickerGrid(filter){
  var g = document.getElementById('stickerGrid'); if(!g) return; g.innerHTML='';
  var all = [];
  if(!filter){
    all = STICKER_CATS['Popular'];
  } else {
    filter = filter.toLowerCase();
    Object.values(STICKER_CATS).forEach(function(arr){ all = all.concat(arr); });
    all = all.filter(function(_,i){ return i < 60; });
  }
  all.forEach(function(em){
    var b = document.createElement('button');
    b.className='stk-btn'; b.textContent=em;
    b.onclick=function(){ addSticker(em); };
    g.appendChild(b);
  });
}

function filterStickers(val){
  var g = document.getElementById('stickerGrid'); if(!g) return; g.innerHTML='';
  if(!val){buildStickerGrid();return;}
  var all=[]; Object.values(STICKER_CATS).forEach(function(a){all=all.concat(a);});
  all.forEach(function(em){
    var b=document.createElement('button'); b.className='stk-btn'; b.textContent=em;
    b.onclick=function(){addSticker(em);}; g.appendChild(b);
  });
}

function addSticker(em){
  if(!cv) return;
  var W=cv.width, H=cv.height;
  var stk = {emoji:em, x:W/2, y:H/3, size:64, rot:0};
  stickers.push(stk);
  activeSticker=stickers.length-1;
  refreshPlacedList();
  if(!isPlaying) drawFrame();
  toast('Added '+em);
}

function refreshPlacedList(){
  var list=document.getElementById('placedList'); if(!list) return;
  if(!stickers.length){list.innerHTML='<div class="empty-msg">None placed yet — tap an emoji above</div>';return;}
  list.innerHTML='';
  stickers.forEach(function(stk,i){
    var item=document.createElement('div');
    item.className='placed-item'+(i===activeSticker?' selected':'');
    item.innerHTML='<span class="placed-emoji">'+stk.emoji+'</span><span class="placed-info">x:'+Math.round(stk.x)+' y:'+Math.round(stk.y)+'</span>'
      +'<button class="placed-del" onclick="removeSticker('+i+')">✕</button>';
    item.onclick=function(){activeSticker=i;refreshPlacedList();if(!isPlaying)drawFrame();};
    list.appendChild(item);
  });
}

function removeSticker(i){
  stickers.splice(i,1); activeSticker=Math.min(activeSticker,stickers.length-1);
  refreshPlacedList(); if(!isPlaying) drawFrame(); toast('Sticker removed');
}
function clearAllStickers(){stickers=[];activeSticker=-1;refreshPlacedList();if(!isPlaying)drawFrame();toast('All stickers cleared');}
function updateActiveStickerSize(){
  var v=parseInt(document.getElementById('slStickerSize').value);
  document.getElementById('slStickerSizeVal').textContent=v;
  if(activeSticker>=0&&stickers[activeSticker]){stickers[activeSticker].size=v; if(!isPlaying)drawFrame();}
}
function updateActiveStickerRot(){
  var v=parseInt(document.getElementById('slStickerRot').value);
  document.getElementById('slStickerRotVal').textContent=v+'°';
  if(activeSticker>=0&&stickers[activeSticker]){stickers[activeSticker].rot=v; if(!isPlaying)drawFrame();}
}

function buildGradeGrid(){
  var g=document.getElementById('gradeGrid'); if(!g) return; g.innerHTML='';
  GRADES.forEach(function(gr,i){
    var b=document.createElement('div'); b.className='grade-btn'+(i===0?' active-grade':'');
    b.style.background=gr.bg; b.textContent=gr.name;
    b.onclick=function(){
      activeGrade=i===0?null:gr; customFilter=''; resetGradeSliders();
      document.querySelectorAll('.grade-btn').forEach(function(x){x.classList.remove('active-grade');}); b.classList.add('active-grade');
      if(!isPlaying) drawFrame(); toast('Grade: '+gr.name);
    };
    g.appendChild(b);
  });
}

function buildTintGrid(){
  var g=document.getElementById('tintGrid'); if(!g) return; g.innerHTML='';
  TINTS.forEach(function(t,i){
    var b=document.createElement('div'); b.className='tint-btn'+(i===0?' active-tint':'');
    b.style.background=t.color||'#333'; b.title=t.label;
    if(i===0){b.style.background='#333';b.style.border='2px dashed rgba(255,255,255,.3)';}
    b.onclick=function(){
      activeTint=i===0?null:t;
      document.querySelectorAll('.tint-btn').forEach(function(x){x.classList.remove('active-tint');}); b.classList.add('active-tint');
      if(!isPlaying) drawFrame(); toast('Tint: '+t.label);
    };
    g.appendChild(b);
  });
}

function buildFXGrid(){
  var g=document.getElementById('fxGrid'); if(!g) return; g.innerHTML='';
  FX_PRESETS.forEach(function(fx,i){
    var b=document.createElement('div'); b.className='fx-btn'+(i===0?' active-fx':'');
    b.style.background=fx.bg; b.textContent=fx.name;
    b.onclick=function(){
      activeFX=i===0?null:fx; customFilter='';
      document.querySelectorAll('.fx-btn').forEach(function(x){x.classList.remove('active-fx');}); b.classList.add('active-fx');
      if(!isPlaying) drawFrame(); toast('Filter: '+fx.name);
    };
    g.appendChild(b);
  });
}

function buildMotionBtns(){
  var w=document.getElementById('motionBtns'); if(!w) return; w.innerHTML='';
  MOTIONS.forEach(function(m,i){
    var b=document.createElement('button'); b.className='mot-btn'+(i===0?' active-mot':'');
    b.textContent=m.name;
    b.onclick=function(){
      activeMotion=m.id;
      document.querySelectorAll('.mot-btn').forEach(function(x){x.classList.remove('active-mot');}); b.classList.add('active-mot');
      toast('Motion: '+m.name);
    };
    w.appendChild(b);
  });
}

function buildSpeedGrid(){
  var g=document.getElementById('speedGrid'); if(!g) return; g.innerHTML='';
  SPEEDS.forEach(function(sp,i){
    var b=document.createElement('button'); b.className='spd-btn'+(i===2?' active-spd':'');
    b.textContent=sp.label;
    b.onclick=function(){
      if(vid) vid.playbackRate=sp.val;
      document.querySelectorAll('.spd-btn').forEach(function(x){x.classList.remove('active-spd');}); b.classList.add('active-spd');
      toast('Speed: '+sp.label);
    };
    g.appendChild(b);
  });
}

function buildRatioGrid(){
  var g=document.getElementById('ratioGrid'); if(!g) return; g.innerHTML='';
  RATIOS.forEach(function(r,i){
    var b=document.createElement('div'); b.className='ratio-btn'+(i===0?' active-ratio':'');
    b.innerHTML='<div class="ratio-icon">'+r.icon+'</div><div class="ratio-name">'+r.name+'</div><div class="ratio-val">'+r.id+'</div>';
    b.onclick=function(){
      if(!cv) return;
      aspectRatio=r.id; cv.width=r.w; cv.height=r.h;
      exportFmt=r.id; document.getElementById('resBadge').textContent=r.id;
      document.querySelectorAll('.ratio-btn').forEach(function(x){x.classList.remove('active-ratio');}); b.classList.add('active-ratio');
      if(!isPlaying) drawFrame(); toast('Ratio: '+r.id);
    };
    g.appendChild(b);
  });
}

function buildBgOpts(){
  var c=document.getElementById('bgOpts'); if(!c) return; c.innerHTML='';
  BG_OPTS.forEach(function(opt,i){
    var b=document.createElement('button'); b.className='bg-opt-btn'+(i===0?' active-bg':'');
    b.textContent=opt.charAt(0).toUpperCase()+opt.slice(1);
    b.onclick=function(){
      bgMode=opt;
      document.querySelectorAll('.bg-opt-btn').forEach(function(x){x.classList.remove('active-bg');}); b.classList.add('active-bg');
      if(!isPlaying) drawFrame(); toast('BG: '+opt);
    };
    c.appendChild(b);
  });
}

function buildMusicCats(){
  var c=document.getElementById('musicCats'); if(!c) return; c.innerHTML='';
  ['All','Chill','Cinematic','Upbeat','Hip-Hop'].forEach(function(cat,i){
    var b=document.createElement('button'); b.className='mcat-btn'+(i===0?' active-cat':'');
    b.textContent=cat;
    b.onclick=function(){
      activeMusicCat=cat;
      document.querySelectorAll('.mcat-btn').forEach(function(x){x.classList.remove('active-cat');}); b.classList.add('active-cat');
      buildMusicList();
    };
    c.appendChild(b);
  });
}

function buildMusicList(){
  var list=document.getElementById('musicList'); if(!list) return; list.innerHTML='';
  var filtered=MUSIC_LIBRARY.filter(function(t){return activeMusicCat==='All'||t.cat===activeMusicCat;});
  filtered.forEach(function(t){
    var item=document.createElement('div'); item.className='music-item';
    item.innerHTML='<div class="mi-icon">'+t.icon+'</div><div class="mi-info"><div class="mi-name">'+t.name+'</div><div class="mi-vibe">'+t.vibe+'</div></div><div class="mi-bars"><div class="mi-bar" style="height:4px"></div><div class="mi-bar" style="height:9px"></div><div class="mi-bar" style="height:5px"></div></div>';
    item.onclick=function(){
      if(activeMusicUrl===t.url){stopMusic();item.classList.remove('playing');}
      else{playMusic(t.url,item);}
    };
    list.appendChild(item);
  });
}

function buildExportPlatforms(){
  var c=document.getElementById('exportPlatforms'); if(!c) return; c.innerHTML='';
  EXPORT_PLATFORMS.forEach(function(p,i){
    var b=document.createElement('button'); b.className='exp-plat-btn'+(i===0?' active-plat':'');
    b.innerHTML='<div class="exp-plat-icon">'+p.icon+'</div><div class="exp-plat-info"><div class="exp-plat-name">'+p.name+'</div><div class="exp-plat-desc">'+p.desc+'</div></div>';
    b.onclick=function(){
      if(!cv) return;
      exportFmt=p.ratio;
      var r=RATIOS.find(function(x){return x.id===p.ratio;})||RATIOS[0];
      cv.width=r.w; cv.height=r.h;
      document.getElementById('resBadge').textContent=p.ratio;
      document.querySelectorAll('.exp-plat-btn').forEach(function(x){x.classList.remove('active-plat');}); b.classList.add('active-plat');
      if(!isPlaying) drawFrame(); toast(p.name+' preset');
    };
    c.appendChild(b);
  });
}

// ─── FILE LOAD ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  initDOMRefs();

  var fileIn = document.getElementById('fileIn');
  if(fileIn) fileIn.onchange = function(e){ loadFile(e.target.files[0]); };

  var dz    = document.getElementById('dropZone');
  var inner = document.getElementById('dzInner');
  if(dz && inner){
    ['dragover','dragenter'].forEach(function(ev){
      dz.addEventListener(ev, function(e){ e.preventDefault(); inner.classList.add('drag'); });
    });
    ['dragleave','dragend'].forEach(function(ev){
      dz.addEventListener(ev, function(){ inner.classList.remove('drag'); });
    });
    dz.addEventListener('drop', function(e){
      e.preventDefault(); inner.classList.remove('drag');
      var f = Array.from(e.dataTransfer.files).find(function(x){
        return x.type.startsWith('video/') || x.type.startsWith('image/');
      });
      if(f) loadFile(f);
    });
  }
});

// FIX: max 500 MB, extension whitelist
var ALLOWED_EXTENSIONS = ['mp4','mov','webm','mkv','avi','jpg','jpeg','png','gif','webp'];

function loadFile(f){
  if(!f) return;

  // FIX: size validation
  var MAX_BYTES = 500 * 1024 * 1024;
  if(f.size > MAX_BYTES){
    toast('⚠ File too large — max 500 MB');
    return;
  }

  // FIX: extension whitelist
  var ext = f.name.split('.').pop().toLowerCase();
  if(!ALLOWED_EXTENSIONS.includes(ext)){
    toast('⚠ Unsupported file type: .'+ext);
    return;
  }

  if(clip) URL.revokeObjectURL(clip.url);   // FIX: revoke previous object URL
  fileType = f.type.startsWith('image/') ? 'image' : 'video';
  clip = { file:f, url:URL.createObjectURL(f) };

  var fcIcon = document.getElementById('fcIcon');
  var fcName = document.getElementById('fcName');
  if(fcIcon) fcIcon.textContent = fileType==='image' ? '🖼' : '🎬';
  if(fcName) fcName.textContent = f.name;

  if(fileType==='video' && vid){
    vid.src = clip.url;
    vid.onloadedmetadata = function(){
      if(fcName) fcName.textContent = f.name + ' · ' + ft(vid.duration);
    };
  }
  goTo('sStyle');
  var backBtn = document.getElementById('backBtn');
  if(backBtn) backBtn.style.display = 'flex';
}

// ─── ASSEMBLYAI — via Cloudflare Worker proxy ────────────────────
function processWithAssemblyAI(){
  if(!clip){ toast('No file loaded'); return; }
  if(fileType==='image'){ buildCaptions([]); setTimeout(launchPreview,300); return; }

  isCancelled = false;
  pollRetries = 0;

  goTo('sProcess'); stepProg(2);
  setStatus('🎙️','Uploading…','Sending your video to AI…', 10);

  var cancelBtn = document.getElementById('processCancelBtn');
  if(cancelBtn) cancelBtn.style.display = 'inline-flex';

  var reader = new FileReader();
  reader.onload = function(e){
    fetch('https://api.assemblyai.com/v2/upload', {
      method:  'POST',
      headers: {
        'authorization': ASSEMBLY_KEY,
        'content-type':  'application/octet-stream'
      },
      body: e.target.result
    })
    .then(function(r){
      if(!r.ok) return r.json().then(function(d){ throw new Error(d.error||'Upload failed: '+r.status); });
      return r.json();
    })
    .then(function(data){
      if(isCancelled) return;
      var url = data.upload_url;
      if(!url) throw new Error('No upload URL');
      stepProg(3); setStatus('🔬','Transcribing…','AI is reading every word…', 32);
      submitTranscript(url);
    })
    .catch(function(err){
      if(isCancelled) return;
      setStatus('❌','Upload failed', err.message, 0);
      toast('Error: ' + err.message);
      hideCancelBtn();
    });
  };
  reader.readAsArrayBuffer(clip.file);
}


function submitTranscript(audioUrl){
  // FIX: speech_model (singular) not speech_models (array)
  fetch('https://api.assemblyai.com/v2/transcript', {
    method:  'POST',
    headers: { 'authorization': ASSEMBLY_KEY, 'content-type': 'application/json' },
    body:    JSON.stringify({ audio_url: audioUrl, speech_models: ['universal-2'], language_detection: true })
  })
  .then(function(r){
    if(!r.ok) return r.json().then(function(e){ throw new Error('Transcript failed: '+(e.error||r.status)); });
    return r.json();
  })
  .then(function(data){
    if(isCancelled) return;
    if(!data.id) throw new Error('No transcript ID');
    transcriptId = data.id; stepProg(4); setStatus('🎙','Processing…','Word-perfect sync…',50);
    pollTranscript();
  })
  .catch(function(err){
    if(isCancelled) return;
    setStatus('❌','Error', err.message, 0);
    toast('Error: ' + err.message);
    hideCancelBtn();
  });
}

function pollTranscript(){
  if(isCancelled) return;
  if(pollTimer) clearTimeout(pollTimer);

  // FIX: max retry guard
  pollRetries++;
  if(pollRetries > MAX_POLL_RETRIES){
    setStatus('❌','Timed out','Transcription took too long — please try again.',0);
    toast('Transcription timed out');
    hideCancelBtn();
    return;
  }

  fetch('https://api.assemblyai.com/v2/transcript/' + transcriptId, {
    headers: { 'authorization': ASSEMBLY_KEY }
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(isCancelled) return;
    if(data.status==='completed'){
      stepProg(5); setStatus('✅','Done!','"'+(data.text||'').substring(0,55)+'…"',100);
      buildCaptions(data.words || []);
      hideCancelBtn();
      setTimeout(launchPreview, 600);
    } else if(data.status==='error'){
      setStatus('❌','Error', data.error || 'Unknown', 0);
      hideCancelBtn();
    } else {
      document.getElementById('progFill').style.width=(data.status==='processing'?70:52)+'%';
      document.getElementById('procDesc').textContent='Status: '+data.status+'…';
      pollTimer = setTimeout(pollTranscript, 2500);
    }
  })
  .catch(function(){
    if(!isCancelled) pollTimer = setTimeout(pollTranscript, 3000);
  });
}

// FIX: cancel processing mid-flight
function cancelProcessing(){
  isCancelled = true;
  if(pollTimer) clearTimeout(pollTimer);
  transcriptId = null;
  pollRetries  = 0;
  hideCancelBtn();
  goTo('sStyle');
  toast('Cancelled — pick a style and try again');
}

function hideCancelBtn(){
  var btn = document.getElementById('processCancelBtn');
  if(btn) btn.style.display = 'none';
}

function buildCaptions(wordData){
  allWords=[]; sentences=[];
  if(!wordData||!wordData.length) return;
  allWords=wordData.map(function(w){return{w:w.text,t:w.start/1000,end:w.end/1000};});
  var cur=[];
  allWords.forEach(function(word,wi){
    cur.push(word);
    var next=allWords[wi+1], isGap=next&&(next.t-word.end)>0.45, isLong=cur.length>=6, isLast=wi===allWords.length-1;
    if(isGap||isLong||isLast){sentences.push({t:cur[0].t,end:cur[cur.length-1].end,words:cur.slice()});cur=[];}
  });
}

function launchPreview(){
  if(!cv){ console.warn('Canvas not available'); return; }
  goTo('sPreview');
  cv.width=540; cv.height=960;
  buildAllPanels();
  document.getElementById('expStyle').textContent=activeStyle.name;
  document.getElementById('styleBadge').textContent=activeStyle.name;
  document.getElementById('expStats').innerHTML=allWords.length+' words &nbsp;·&nbsp; '+sentences.length+' captions';
  if(fileType==='video' && vid){
    if(!vid.src) vid.src=clip.url;
    vid.pause(); vid.currentTime=0;
    vid.ontimeupdate=syncTL;
    vid.onended=function(){isPlaying=false;updatePlayIcons(false);cancelAnimationFrame(rafId);};
    if(vid.readyState >= 1){ buildTimeline(); initTimelineDrag(); }
    else { vid.onloadedmetadata=function(){ buildTimeline(); initTimelineDrag(); }; }
  }
  drawFrame();
}

// ─── PRO EFFECTS STATE ────────────────────────────────────────────
var chromaVal    = 0;
var distortVal   = 0;
var scanlinesVal = 0;
var glowVal      = 0;
var pixelateVal  = 1;
var duotoneId    = null;
var aiEffects    = { sharpen:false, smooth:false, deband:false, portraitBlur:false, faceEnhance:false };
var trackVis     = { video:true, captions:true, text:true };
var tlZoomLevel  = 1;

var DUOTONES = [
  { id:'none',    a:'#000000', b:'#ffffff', label:'None' },
  { id:'purple',  a:'#0d0030', b:'#c084fc', label:'Purple' },
  { id:'orange',  a:'#1a0500', b:'#f97316', label:'Fire' },
  { id:'cyan',    a:'#001a1a', b:'#22d3ee', label:'Cyan' },
  { id:'gold',    a:'#0a0800', b:'#f5c842', label:'Gold' },
  { id:'pink',    a:'#1a0010', b:'#e879f9', label:'Pink' },
  { id:'green',   a:'#001a00', b:'#4ade80', label:'Green' },
  { id:'red',     a:'#1a0000', b:'#ff4d6d', label:'Red' }
];

// ─── PRO TIMELINE ─────────────────────────────────────────────────
var tlPx = 80;

function syncTL(){
  if(fileType!=='video'||!vid) return;
  var t   = vid.currentTime;
  var dur = vid.duration || 1;

  var tEl = document.getElementById('vbTime');
  var dEl = document.getElementById('tlDuration');
  if(tEl) tEl.textContent = ft(t);
  if(dEl) dEl.textContent = ft(dur);

  var inner = document.getElementById('tlTracksInner');
  var ph    = document.getElementById('tlPlayhead');
  if(inner && ph){
    var totalW = Math.max(dur * tlPx * tlZoomLevel, inner.parentElement.offsetWidth);
    inner.style.width = totalW + 'px';
    ph.style.left = (t * tlPx * tlZoomLevel) + 'px';

    var scroll = inner.parentElement;
    var phLeft = t * tlPx * tlZoomLevel;
    if(scroll && (phLeft < scroll.scrollLeft || phLeft > scroll.scrollLeft + scroll.offsetWidth - 40)){
      scroll.scrollLeft = phLeft - scroll.offsetWidth * 0.3;
    }
  }

  if(sentences.length){
    document.querySelectorAll('.tl-cap-block').forEach(function(el){
      var st = parseFloat(el.dataset.start), en = parseFloat(el.dataset.end);
      el.classList.toggle('active-cap', t >= st && t <= en);
    });
  }
}

function buildTimeline(){
  if(fileType !== 'video' || !vid || !vid.duration) return;
  var dur = vid.duration;
  var inner = document.getElementById('tlTracksInner');
  if(!inner) return;
  var totalW = Math.max(dur * tlPx * tlZoomLevel, 600);
  inner.style.width = totalW + 'px';

  buildTLRuler(dur, totalW);

  var vc = document.getElementById('tlVideoClip');
  if(vc){ vc.style.width = (dur * tlPx * tlZoomLevel - 2) + 'px'; buildVideoWave(vc); }

  var mc = document.getElementById('tlMusicClip');
  if(mc && activeMusicUrl){ mc.style.display='flex'; mc.style.width = (dur * tlPx * tlZoomLevel - 2) + 'px'; buildMusicWave(mc); }

  buildCaptionBlocks(dur, totalW);

  var tc = document.getElementById('tlTextClip');
  if(tc){ tc.style.display = overlayTextVal ? 'flex' : 'none'; }

  buildVoiceWave(dur, totalW);
}

function buildTLRuler(dur, totalW){
  var ruler = document.getElementById('tlRuler');
  if(!ruler) return;
  ruler.innerHTML = '';
  ruler.style.width = totalW + 'px';
  var step = dur > 60 ? 10 : dur > 20 ? 5 : 1;
  for(var t = 0; t <= dur; t += step){
    var tick = document.createElement('div');
    tick.className = 'tl-ruler-tick' + (t % (step * 5) === 0 ? ' major' : '');
    tick.style.left = (t * tlPx * tlZoomLevel) + 'px';
    tick.textContent = ft(t);
    ruler.appendChild(tick);
  }
}

function buildVideoWave(container){
  var wave = container.querySelector('.tl-waveform');
  if(!wave) return;
  wave.innerHTML = '';
  var count = Math.floor(wave.offsetWidth / 3) || 60;
  for(var i = 0; i < count; i++){
    var b = document.createElement('div');
    b.className = 'tl-wave-bar';
    b.style.height = (4 + Math.random() * 18) + 'px';
    b.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
    wave.appendChild(b);
  }
}

function buildMusicWave(container){
  var wave = container.querySelector('.tl-music-wave');
  if(!wave) return;
  wave.innerHTML = '';
  var count = Math.floor(wave.offsetWidth / 3) || 60;
  for(var i = 0; i < count; i++){
    var b = document.createElement('div');
    b.className = 'tl-wave-bar';
    b.style.height = (3 + Math.random() * 14) + 'px';
    b.style.background = 'rgba(74,222,128,0.6)';
    b.style.opacity = (0.4 + Math.random() * 0.6).toFixed(2);
    wave.appendChild(b);
  }
}

function buildVoiceWave(dur, totalW){
  var canvas = document.getElementById('tlVoiceWave');
  if(!canvas) return;
  canvas.width = totalW;
  canvas.height = 32;
  var c = canvas.getContext('2d');
  c.clearRect(0,0,totalW,32);
  var bars = Math.floor(totalW / 2);
  for(var i = 0; i < bars; i++){
    var h = 2 + Math.random() * 24;
    var a = 0.15 + Math.random() * 0.5;
    c.fillStyle = 'rgba(192,132,252,' + a + ')';
    c.fillRect(i*2, (32 - h)/2, 1.5, h);
  }
}

function buildCaptionBlocks(dur, totalW){
  var container = document.getElementById('tlCapsBlocks');
  if(!container) return;
  container.innerHTML = '';
  container.style.width = totalW + 'px';
  sentences.forEach(function(s){
    var left  = (s.t   / dur) * totalW;
    var width = Math.max(4, ((s.end - s.t) / dur) * totalW - 2);
    var block = document.createElement('div');
    block.className = 'tl-cap-block';
    block.style.left  = left  + 'px';
    block.style.width = width + 'px';
    block.dataset.start = s.t;
    block.dataset.end   = s.end;
    var label = s.words.slice(0,2).map(function(w){return w.w;}).join(' ');
    block.textContent = label;
    block.title = s.words.map(function(w){return w.w;}).join(' ');
    block.onclick = function(e){
      e.stopPropagation();
      if(vid) vid.currentTime = s.t;
      if(!isPlaying) setTimeout(drawFrame, 40);
    };
    container.appendChild(block);
  });
}

function tlSeekClick(e){
  tlSeekFromEvent(e);
}

// Timeline drag state
var _tlDragging = false;

function tlSeekFromEvent(e){
  if(!vid||!vid.duration) return;
  var inner = document.getElementById('tlTracksInner');
  if(!inner) return;
  var rect = inner.getBoundingClientRect();
  var scrollLeft = inner.parentElement ? inner.parentElement.scrollLeft : 0;
  var x = e.clientX - rect.left + scrollLeft;
  var t = Math.max(0, Math.min(x / (tlPx * tlZoomLevel), vid.duration));
  vid.currentTime = t;
  if(!isPlaying) setTimeout(drawFrame, 40);
}

function initTimelineDrag(){
  var scroll = document.getElementById('tlTracksScroll');
  if(!scroll) return;
  scroll.addEventListener('mousedown', function(e){
    _tlDragging = true;
    tlSeekFromEvent(e);
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e){
    if(_tlDragging) tlSeekFromEvent(e);
  });
  document.addEventListener('mouseup', function(){
    _tlDragging = false;
  });
  // Touch support
  scroll.addEventListener('touchstart', function(e){
    _tlDragging = true;
    tlSeekFromEvent(e.touches[0]);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', function(e){
    if(_tlDragging) tlSeekFromEvent(e.touches[0]);
  }, { passive: true });
  document.addEventListener('touchend', function(){
    _tlDragging = false;
  });
}

function tlZoom(delta){
  tlZoomLevel = Math.max(0.5, Math.min(4, tlZoomLevel + delta));
  var el = document.getElementById('tlZoomLbl');
  if(el) el.textContent = tlZoomLevel + '×';
  buildTimeline();
}

function skipTo(t){
  if(!vid) return;
  vid.currentTime = Math.max(0, Math.min(t, vid.duration||0));
  if(!isPlaying) setTimeout(drawFrame, 40);
}

function stepFrame(dir){
  if(!vid) return;
  vid.currentTime = Math.max(0, Math.min((vid.currentTime||0) + dir/30, vid.duration||0));
  if(!isPlaying) setTimeout(drawFrame, 40);
}

function toggleTrackVis(track){
  trackVis[track] = !trackVis[track];
  var btn = document.getElementById('eye'+track.charAt(0).toUpperCase()+track.slice(1));
  if(btn) btn.classList.toggle('hidden', !trackVis[track]);
  if(!isPlaying) drawFrame();
  toast(track + (trackVis[track] ? ' visible' : ' hidden'));
}

function setTrackVol(track, val){
  if(track === 'voice' && vid) { vid.volume = val/100; }
  if(track === 'music' && musicAudio) { musicAudio.volume = val/100; musicVolume = val/100; }
}

// ─── DUOTONE ─────────────────────────────────────────────────────
function buildDuotoneRow(){
  var r = document.getElementById('duotoneRow'); if(!r) return; r.innerHTML='';
  DUOTONES.forEach(function(dt, i){
    var b = document.createElement('div');
    b.className = 'dt-btn' + (i===0?' active-dt':'');
    if(i===0){ b.style.background='#333'; b.style.border='2px dashed rgba(255,255,255,.3)'; b.title='None'; }
    else {
      b.style.background = 'linear-gradient(135deg,'+dt.a+','+dt.b+')'; b.title = dt.label;
    }
    b.onclick = function(){
      duotoneId = i===0 ? null : dt;
      document.querySelectorAll('.dt-btn').forEach(function(x){x.classList.remove('active-dt');}); b.classList.add('active-dt');
      if(!isPlaying) drawFrame(); toast('Duotone: '+(dt.label||'None'));
    };
    r.appendChild(b);
  });
}

// ─── AI EFFECTS ───────────────────────────────────────────────────
function applyAIEffect(id){
  if(['denoise','bgNoise','voiceBoost','bassBoost','reverb'].indexOf(id) !== -1){
    if(id === 'denoise')   { audioSettings.noiseCancelOn  = !audioSettings.noiseCancelOn; }
    if(id === 'bgNoise')   { audioSettings.bgNoiseGateOn  = !audioSettings.bgNoiseGateOn; audioSettings.noiseCancelOn = audioSettings.bgNoiseGateOn; }
    if(id === 'voiceBoost'){ audioSettings.voiceBoostOn   = !audioSettings.voiceBoostOn; }
    if(id === 'bassBoost') { audioSettings.bassBoostOn    = !audioSettings.bassBoostOn; }
    if(id === 'reverb')    { audioSettings.reverbOn       = !audioSettings.reverbOn; }
    if(audioReady) applyAudioSettings();
    else if(audioSettings.noiseCancelOn || audioSettings.voiceBoostOn) toast('▶ Press play to activate audio effects');
  } else {
    aiEffects[id] = !aiEffects[id];
    if(!isPlaying) drawFrame();
  }

  var btn = document.getElementById('aibtn' + id.charAt(0).toUpperCase() + id.slice(1));
  var isOn = aiEffects[id] || (id==='denoise'&&audioSettings.noiseCancelOn) || (id==='bgNoise'&&audioSettings.noiseCancelOn) || (id==='voiceBoost'&&audioSettings.voiceBoostOn) || (id==='bassBoost'&&audioSettings.bassBoostOn) || (id==='reverb'&&audioSettings.reverbOn);
  if(btn) btn.classList.toggle('active-ai', isOn);

  var names = { denoise:'🔇 Noise Cancel', bgNoise:'🎙 BG Noise Gate', sharpen:'🔬 AI Sharpen', smooth:'✨ Skin Smooth', deband:'🌈 Deband', voiceBoost:'🎤 Voice Boost', bassBoost:'🔊 Bass Boost', reverb:'🏛 Reverb', portraitBlur:'🌅 Portrait Blur', faceEnhance:'👤 Face Enhance' };
  toast((isOn?'✓ ON: ':'✗ OFF: ') + (names[id]||id));
}

function updateEQ(){
  var b = parseInt(document.getElementById('slEqBass').value);
  var m = parseInt(document.getElementById('slEqMid').value);
  var t = parseInt(document.getElementById('slEqTreble').value);
  document.getElementById('slEqBassVal').textContent   = (b>=0?'+':'')+b+'dB';
  document.getElementById('slEqMidVal').textContent    = (m>=0?'+':'')+m+'dB';
  document.getElementById('slEqTrebleVal').textContent = (t>=0?'+':'')+t+'dB';
  audioSettings.eqBass = b; audioSettings.eqMid = m; audioSettings.eqTreble = t;
  if(audioReady) applyAudioSettings();
}

function updateNoiseCancelAmt(){
  var v = parseInt(document.getElementById('slNoiseCancelAmt').value);
  document.getElementById('slNoiseCancelAmtVal').textContent = v;
  audioSettings.noiseCancelAmt = v;
  if(audioReady && audioSettings.noiseCancelOn) applyAudioSettings();
}

function updatePixelFX(){
  chromaVal    = parseInt(document.getElementById('slChroma').value)||0;
  distortVal   = parseInt(document.getElementById('slDistort').value)||0;
  scanlinesVal = parseInt(document.getElementById('slScanlines').value)||0;
  glowVal      = parseInt(document.getElementById('slGlow').value)||0;
  pixelateVal  = parseInt(document.getElementById('slPixelate').value)||1;

  document.getElementById('slChromaVal').textContent    = chromaVal;
  document.getElementById('slDistortVal').textContent   = distortVal;
  document.getElementById('slScanlinesVal').textContent = scanlinesVal;
  document.getElementById('slGlowVal').textContent      = glowVal;
  document.getElementById('slPixelateVal').textContent  = pixelateVal<=1?'Off':pixelateVal+'px';
  if(!isPlaying) drawFrame();
}

// ─── POST FX ─────────────────────────────────────────────────────
function applyPostFX(W, H){
  if(!cv) return;

  if(chromaVal > 0){
    // Fast chroma aberration — draw 3 offset copies with blend modes
    var off = chromaVal * 0.8;
    var tmpCh = document.createElement('canvas'); tmpCh.width = W; tmpCh.height = H;
    var tCh = tmpCh.getContext('2d'); tCh.drawImage(cv, 0, 0);
    // Red channel shifted right
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.6;
    ctx.filter = 'saturate(3) hue-rotate(0deg) brightness(0.9)';
    ctx.drawImage(tmpCh, off, 0);
    // Cyan channel shifted left
    ctx.filter = 'saturate(3) hue-rotate(180deg) brightness(0.9)';
    ctx.drawImage(tmpCh, -off, 0);
    ctx.restore();
  }

  if(aiEffects.portraitBlur || bgBlur > 0){
    var blurAmt = Math.max(bgBlur * 2, aiEffects.portraitBlur ? 14 : 0);
    var sharpC = document.createElement('canvas'); sharpC.width=W; sharpC.height=H;
    var sharpX = sharpC.getContext('2d'); sharpX.drawImage(cv,0,0);
    ctx.filter = 'blur('+blurAmt+'px)';
    ctx.drawImage(sharpC,0,0);
    ctx.filter = 'none';
    var rx = W*0.32, ry = H*0.40, cx2 = W/2, cy2 = H*0.42;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx2, cy2, rx, ry, 0, 0, Math.PI*2);
    ctx.clip();
    ctx.drawImage(sharpC,0,0);
    ctx.restore();
    var feather = ctx.createRadialGradient(cx2,cy2,Math.min(rx,ry)*0.7,cx2,cy2,Math.max(rx,ry)*1.05);
    feather.addColorStop(0,'rgba(0,0,0,0)');
    feather.addColorStop(1,'rgba(0,0,0,0.45)');
    ctx.fillStyle=feather; ctx.fillRect(0,0,W,H);
  }

  if(aiEffects.sharpen){
    var id2 = ctx.getImageData(0,0,W,H);
    var d2 = id2.data;
    var tmp2 = new Uint8ClampedArray(d2.length);
    for(var i2=0; i2<d2.length; i2++) tmp2[i2]=d2[i2];
    var kernel = [-1,-1,-1,-1,9,-1,-1,-1,-1];
    for(var y2=1;y2<H-1;y2++){
      for(var x2=1;x2<W-1;x2++){
        var idx=(y2*W+x2)*4;
        for(var ch=0;ch<3;ch++){
          var sum=0;
          for(var ky=-1;ky<=1;ky++) for(var kx=-1;kx<=1;kx++){
            sum+=tmp2[((y2+ky)*W+(x2+kx))*4+ch]*kernel[(ky+1)*3+(kx+1)];
          }
          d2[idx+ch]=Math.max(0,Math.min(255,sum));
        }
      }
    }
    ctx.putImageData(id2,0,0);
  }

  if(aiEffects.smooth || aiEffects.faceEnhance){
    var tmpS=document.createElement('canvas'); tmpS.width=W; tmpS.height=H;
    var tS=tmpS.getContext('2d');
    tS.filter='blur('+(aiEffects.faceEnhance?'2px':'1.5px')+')';
    tS.drawImage(cv,0,0);
    ctx.save();
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=aiEffects.faceEnhance?0.55:0.4;
    ctx.drawImage(tmpS,0,0);
    ctx.restore();
    if(aiEffects.faceEnhance){
      ctx.save();
      ctx.globalCompositeOperation='soft-light';
      ctx.globalAlpha=0.12;
      ctx.fillStyle='rgba(255,235,210,1)';
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }
  }

  if(aiEffects.deband){
    var id3=ctx.getImageData(0,0,W,H); var d3=id3.data;
    for(var p3=0;p3<d3.length;p3+=4){
      var n3=(Math.random()-.5)*6;
      d3[p3]=Math.max(0,Math.min(255,d3[p3]+n3));
      d3[p3+1]=Math.max(0,Math.min(255,d3[p3+1]+n3));
      d3[p3+2]=Math.max(0,Math.min(255,d3[p3+2]+n3));
    }
    ctx.putImageData(id3,0,0);
  }

  if(scanlinesVal > 0){
    var alpha = scanlinesVal / 200;
    ctx.save();
    for(var sy=0;sy<H;sy+=2){
      ctx.fillStyle='rgba(0,0,0,'+alpha+')';
      ctx.fillRect(0,sy,W,1);
    }
    ctx.restore();
  }

  if(duotoneId){
    var id4=ctx.getImageData(0,0,W,H); var d4=id4.data;
    function hx(h,o){return parseInt(h.slice(o,o+2),16);}
    var ar=hx(duotoneId.a,1),ag=hx(duotoneId.a,3),ab=hx(duotoneId.a,5);
    var br2=hx(duotoneId.b,1),bg2=hx(duotoneId.b,3),bb3=hx(duotoneId.b,5);
    for(var p4=0;p4<d4.length;p4+=4){
      var luma2=(d4[p4]*.299+d4[p4+1]*.587+d4[p4+2]*.114)/255;
      d4[p4]  =Math.round(ar+(br2-ar)*luma2);
      d4[p4+1]=Math.round(ag+(bg2-ag)*luma2);
      d4[p4+2]=Math.round(ab+(bb3-ab)*luma2);
    }
    ctx.putImageData(id4,0,0);
  }

  if(pixelateVal > 1){
    var ps = pixelateVal;
    var tmpP=document.createElement('canvas'); tmpP.width=W; tmpP.height=H;
    var tP=tmpP.getContext('2d');
    tP.drawImage(cv,0,0,Math.ceil(W/ps),Math.ceil(H/ps));
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(tmpP,0,0,Math.ceil(W/ps),Math.ceil(H/ps),0,0,W,H);
    ctx.imageSmoothingEnabled=true;
  }

  if(glowVal > 0){
    var tmpG=document.createElement('canvas'); tmpG.width=W; tmpG.height=H;
    var tG=tmpG.getContext('2d');
    tG.filter='blur('+(glowVal*0.8)+'px)';
    tG.drawImage(cv,0,0);
    ctx.save(); ctx.globalCompositeOperation='screen'; ctx.globalAlpha=0.35; ctx.drawImage(tmpG,0,0); ctx.restore();
  }

  if(distortVal > 0){
    // Fast CSS-filter wave distort (no pixel loop)
    var tmpD = document.createElement('canvas'); tmpD.width = W; tmpD.height = H;
    var tD = tmpD.getContext('2d');
    tD.drawImage(cv, 0, 0);
    var phase = performance.now() / 1000;
    var sliceH = Math.max(4, Math.floor(H / 40));
    for(var sy2 = 0; sy2 < H; sy2 += sliceH){
      var shift = Math.sin(sy2 / 20 + phase) * distortVal * 0.6;
      ctx.drawImage(tmpD, 0, sy2, W, sliceH, shift, sy2, W, sliceH);
    }
  }
}

// ─── DRAW FRAME ───────────────────────────────────────────────────
function drawFrame(){
  if(!cv||!ctx) return;
  var W=cv.width,H=cv.height;
  if(grC.width!==W||grC.height!==H){grC.width=W;grC.height=H;}
  ctx.clearRect(0,0,W,H);
  motionPhase+=0.003;

  if(fileType==='video'&&vid&&vid.videoWidth){
    drawVideoToCanvas(W,H);
  } else {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    if(fileType==='image'&&clip){
      if(window._cachedImg&&window._cachedImg.src===clip.url){
        drawImageFit(window._cachedImg,W,H);
      } else {
        var img=new Image();
        img.onload=function(){window._cachedImg=img;if(!isPlaying)drawFrame();};
        img.src=clip.url;
      }
    }
  }

  if(activeTint&&activeTint.color!=='transparent'){
    ctx.globalCompositeOperation='soft-light';
    ctx.fillStyle=activeTint.color; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='source-over';
  }

  if(vignetteVal>0){
    var vg=ctx.createRadialGradient(W/2,H*0.42,H*.04,W/2,H/2,H*.88);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,'+(vignetteVal/100*.85)+')');
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  }

  if(noiseVal>0){
    var iData=ctx.getImageData(0,0,W,H);
    for(var p=0;p<iData.data.length;p+=4){
      var n=(Math.random()-.5)*noiseVal*2;
      iData.data[p]+=n; iData.data[p+1]+=n; iData.data[p+2]+=n;
    }
    ctx.putImageData(iData,0,0);
  }

  applyPostFX(W, H);

  stickers.forEach(function(stk){
    ctx.save();
    ctx.translate(stk.x,stk.y);
    ctx.rotate(stk.rot*Math.PI/180);
    ctx.font=stk.size+'px serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(stk.emoji,0,0);
    ctx.restore();
  });

  var now=fileType==='video'&&vid?vid.currentTime:0;

  if(trackVis.text !== false) drawTextOverlay(W,H,now);

  if(trackVis.captions !== false){
    if(sentences.length){
      var cs=null;
      for(var i=0;i<sentences.length;i++){if(now>=sentences[i].t&&now<=sentences[i].end+0.4){cs=sentences[i];break;}}
      if(cs) activeStyle.render(ctx,W,H,{words:cs.words,curTime:now});
    } else if(fileType==='image'){
      var demo=[{w:'Your',t:0,end:99},{w:'caption',t:0,end:99},{w:'here',t:0,end:99}];
      activeStyle.render(ctx,W,H,{words:demo,curTime:1});
    }
  }

  ctx.save(); ctx.font='10px "DM Sans",sans-serif'; ctx.fillStyle='rgba(255,255,255,.1)';
  ctx.textAlign='right'; ctx.textBaseline='bottom'; ctx.fillText('ImpactGrid',W-8,H-6); ctx.restore();

  if(isPlaying) rafId=requestAnimationFrame(drawFrame);
}

function drawVideoToCanvas(W,H){
  var vw=vid.videoWidth,vh=vid.videoHeight;
  var scM=videoScale,dx=offsetX,dy=offsetY;
  if(activeMotion==='slowzoom')  {scM*=1+0.04*Math.sin(motionPhase*.5);}
  if(activeMotion==='shake')      {dx+=Math.sin(motionPhase*7)*3;dy+=Math.cos(motionPhase*5)*2;}
  if(activeMotion==='drift')      {dx+=Math.sin(motionPhase*.3)*14;dy+=Math.cos(motionPhase*.2)*7;}
  if(activeMotion==='pulse')      {scM*=1+0.02*Math.sin(motionPhase*3);}

  var sc=Math.max(W/vw,H/vh)*scM;
  var dw=vw*sc, dh=vh*sc;
  var ox=(W-dw)/2+dx, oy=(H-dh)/2+dy;

  grX.clearRect(0,0,W,H);
  grX.filter=getCurrentFilter();
  if(flipH||flipV){grX.save();grX.translate(flipH?W:0,flipV?H:0);grX.scale(flipH?-1:1,flipV?-1:1);}
  grX.drawImage(vid,ox,oy,dw,dh);
  if(flipH||flipV) grX.restore();
  grX.filter='none';
  ctx.drawImage(grC,0,0);
}

function drawImageFit(img,W,H){
  var iw=img.naturalWidth,ih=img.naturalHeight;
  if(bgMode==='blur'){
    ctx.save(); ctx.filter='blur(20px)';
    var sc2=Math.max(W/iw,H/ih);
    ctx.drawImage(img,(W-iw*sc2)/2,(H-ih*sc2)/2,iw*sc2,ih*sc2);
    ctx.restore(); ctx.filter='none';
  } else if(bgMode==='white'){
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  } else if(bgMode==='gradient'){
    var g=ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'#0a0014'); g.addColorStop(1,'#140028');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  } else if(bgMode==='custom'){
    ctx.fillStyle='hsl('+bgColorH+','+bgColorS+'%,'+bgColorL+'%)'; ctx.fillRect(0,0,W,H);
  } else {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
  }

  grX.clearRect(0,0,W,H);
  grX.filter=getCurrentFilter();
  var sc=Math.min(W/iw,H/ih)*videoScale;
  var dw=iw*sc,dh=ih*sc;
  if(flipH||flipV){grX.save();grX.translate(flipH?W:0,flipV?H:0);grX.scale(flipH?-1:1,flipV?-1:1);}
  grX.drawImage(img,(W-dw)/2+offsetX,(H-dh)/2+offsetY,dw,dh);
  if(flipH||flipV) grX.restore();
  grX.filter='none';
  ctx.drawImage(grC,0,0);
}

// ─── GRADE / FILTER ───────────────────────────────────────────────
function getCurrentFilter(){
  if(customFilter) return customFilter;
  if(activeFX&&activeFX.filter!=='none') return activeFX.filter;
  if(activeGrade&&activeGrade.filter&&activeGrade.filter!=='none') return activeGrade.filter;
  return 'none';
}
function updateGrade(){
  var br=document.getElementById('slBright').value, co=document.getElementById('slContrast').value;
  var sa=document.getElementById('slSat').value, wa=parseInt(document.getElementById('slWarm').value);
  var vEl=document.getElementById('slVig'); if(vEl) vignetteVal=parseInt(vEl.value);
  var nEl=document.getElementById('slNoise'); if(nEl) noiseVal=parseInt(nEl.value);
  document.getElementById('slBrightVal').textContent=br; document.getElementById('slContrastVal').textContent=co;
  document.getElementById('slSatVal').textContent=sa; document.getElementById('slWarmVal').textContent=wa;
  if(vEl) document.getElementById('slVigVal').textContent=vEl.value;
  if(nEl) document.getElementById('slNoiseVal').textContent=nEl.value;
  customFilter='brightness('+br/100+') contrast('+co/100+') saturate('+sa/100+')'+(wa?' hue-rotate('+wa+'deg)':'');
  document.querySelectorAll('.grade-btn').forEach(function(b){b.classList.remove('active-grade');});
  if(!isPlaying) drawFrame();
}
function resetGradeSliders(){
  var ids=['slBright','slContrast','slSat']; ids.forEach(function(id){var el=document.getElementById(id);if(el)el.value=100;});
  var wEl=document.getElementById('slWarm'); if(wEl) wEl.value=0;
  ['slBrightVal','slContrastVal','slSatVal'].forEach(function(id){var el=document.getElementById(id);if(el)el.textContent='100';});
  var wVEl=document.getElementById('slWarmVal'); if(wVEl) wVEl.textContent='0';
}

// ─── TEXT OVERLAY ─────────────────────────────────────────────────
function updateOverlayText(){
  var inp=document.getElementById('overlayText'); overlayTextVal=inp?inp.value.trim():'';
  var sl=document.getElementById('slTxtSize'); if(sl) document.getElementById('slTxtSizeVal').textContent=sl.value;
  var op=document.getElementById('slTxtOpacity');
  if(op){overlayOpacity=parseInt(op.value)/100;document.getElementById('slTxtOpacityVal').textContent=op.value+'%';}
  var ol=document.getElementById('slTxtOutline');
  if(ol){overlayOutline=parseInt(ol.value);document.getElementById('slTxtOutlineVal').textContent=ol.value;}
  var sh=document.getElementById('slTxtShadow');
  if(sh){overlayShadow=parseInt(sh.value);document.getElementById('slTxtShadowVal').textContent=sh.value;}
  if(!isPlaying) drawFrame();
}
function setTextPos(btn){
  overlayPos=btn.dataset.pos;
  btn.closest('.pos-row').querySelectorAll('.pos-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active'); if(!isPlaying) drawFrame();
}
function clearOverlayText(){overlayTextVal='';var inp=document.getElementById('overlayText');if(inp)inp.value='';if(!isPlaying)drawFrame();}

var _overlayStart=0;
function drawTextOverlay(W,H,now){
  if(!overlayTextVal) return;
  var size=parseInt(document.getElementById('slTxtSize').value)||42;
  var font=FONTS.find(function(f){return f.id===overlayFontId;})||FONTS[0];
  var y=overlayPos==='top'?H*.1:overlayPos==='bot'?H*.9:H*.5;
  var text=overlayStyle==='upper'?overlayTextVal.toUpperCase():overlayStyle==='lower'?overlayTextVal.toLowerCase():overlayTextVal;
  var age=now-_overlayStart;
  var alpha=overlayOpacity;
  var tx=W/2,ty=y,sc=1;
  if(overlayAnim==='fade')  alpha*=Math.min(age/.5,1);
  if(overlayAnim==='rise')  ty+=Math.max(0,(.4-age)/.4*40);
  if(overlayAnim==='pop')   sc=age<.2?1+(.2-age)/.2*.6:1;
  ctx.save();
  ctx.globalAlpha=Math.max(0,Math.min(alpha,1));
  ctx.translate(tx,ty); ctx.scale(sc,sc); ctx.translate(-tx,-ty);
  ctx.font=(overlayStyle==='italic'?'italic ':'')+font.weight+' '+size+'px '+font.family;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if(overlayOutline>0){ctx.strokeStyle='rgba(0,0,0,.9)';ctx.lineWidth=overlayOutline*2;ctx.lineJoin='round';ctx.strokeText(text,W/2,ty);}
  ctx.shadowColor='rgba(0,0,0,.85)'; ctx.shadowBlur=overlayShadow;
  ctx.fillStyle=overlayColor; ctx.fillText(text,W/2,ty);
  ctx.restore();
}

// ─── CAPTION HELPERS ──────────────────────────────────────────────
function getCapY(H,lines){
  var lineH=capSize+14;
  if(captionPos==='top')  return H*.1+lines*lineH/2;
  if(captionPos==='mid')  return H*.5;
  return H*.82-lines*lineH/2;
}
function setCaptionPos(btn){
  captionPos=btn.dataset.pos;
  btn.closest('.pos-row').querySelectorAll('.pos-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active'); if(!isPlaying) drawFrame();
}
function updateCapSize(){capSize=parseInt(document.getElementById('slCapSize').value);document.getElementById('slCapSizeVal').textContent=capSize;if(!isPlaying)drawFrame();}
function updateCapStyle(){
  letterSpacing=parseInt(document.getElementById('slLetterSpacing').value);
  document.getElementById('slLetterSpacingVal').textContent=letterSpacing+'px';
  if(!isPlaying) drawFrame();
}

function drawCapBg(ctx,x,y,w,h,type,col){
  if(type==='none'||type===undefined) return;
  ctx.save();
  var alpha=0.75;
  if(type==='box'){ctx.fillStyle='rgba(0,0,0,'+alpha+')';ctx.fillRect(x-6,y-h*.6,w+12,h+8);}
  if(type==='pill'){ctx.fillStyle='rgba(0,0,0,'+alpha+')';rRect(ctx,x-10,y-h*.62,w+20,h+10,h*.5);ctx.fill();}
  if(type==='underline'){ctx.fillStyle=col||'#f97316';ctx.fillRect(x,y+h*.5,w,3);}
  ctx.restore();
}

function tryWordAnim(ctx,W,H,word,age,bx,by,sz,isNow){
  if(!activeWordAnim||!isNow) return false;
  switch(activeWordAnim.id){
    case 'slam':
      var sy=age<.15?by-(1-age/.15)*50:by;
      ctx.save();ctx.translate(bx,sy);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';ctx.fillStyle='#fff';ctx.fillText(word,0,0);ctx.restore();return true;
    case 'pop':
      var sc2=age<.15?1+(.15-age)/.15*1.5:1;
      ctx.save();ctx.translate(bx,by);ctx.scale(sc2,sc2);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';ctx.fillStyle='#fff';ctx.fillText(word,0,0);ctx.restore();return true;
    case 'glow':
      ctx.save();ctx.translate(bx,by);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';
      var gl=8+Math.sin(age*10)*8;ctx.shadowColor='#7c5cfc';ctx.shadowBlur=gl;ctx.fillStyle='#fff';ctx.fillText(word,0,0);ctx.restore();return true;
    case 'shake':
      ctx.save();ctx.translate(bx+(Math.random()-.5)*8,by+(Math.random()-.5)*4);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';ctx.fillStyle='#fff';ctx.fillText(word,0,0);ctx.restore();return true;
    case 'stamp':
      ctx.save();ctx.translate(bx,by);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';
      var tw2=ctx.measureText(word).width;ctx.fillStyle='#fff';ctx.fillRect(-tw2/2-12,-sz/2-8,tw2+24,sz+16);ctx.fillStyle='#000';ctx.fillText(word,0,2);ctx.fillStyle='#f97316';ctx.fillRect(-tw2/2-12,sz/2+4,tw2+24,4);ctx.restore();return true;
    case 'rise':
      var ry=age<.2?by+(1-age/.2)*40:by;
      ctx.save();ctx.translate(bx,ry);ctx.globalAlpha=Math.min(age/.15,1);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';ctx.fillStyle='#fff';ctx.fillText(word,0,0);ctx.restore();return true;
    case 'zoom':
      var zsc=age<.15?age/.15:1;
      ctx.save();ctx.translate(bx,by);ctx.scale(zsc,zsc);ctx.globalAlpha=Math.min(age/.1,1);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';ctx.fillStyle='#fff';ctx.fillText(word,0,0);ctx.restore();return true;
    default:return false;
  }
}

// ─── 12 CAPTION RENDERERS ─────────────────────────────────────────
function renderFire(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, sz=capSize, pX=12, pY=7;
  var lines=groupLines(d.words,4), lineH=sz+pY*2+8;
  var startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='700 '+sz+'px "DM Sans",sans-serif';
    var tW=line.reduce(function(a,w){return a+ctx.measureText(w.w).width+pX*2+8;},0);
    var x=W/2-tW/2, y=startY+li*lineH+lineH/2;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width, bW=ww+pX*2, bH=sz+pY*2;
      var isNow=now>=wObj.t&&now<=wObj.end+.2, isPast=now>wObj.end+.2, age=now-wObj.t;
      var slam=isNow&&age<.15?2-(age/.15):1;
      if(isNow&&tryWordAnim(ctx,W,H,wObj.w,age,x+bW/2,y,sz,true)){x+=bW+8;return;}
      ctx.save();ctx.translate(x+bW/2,y);ctx.scale(slam,slam);ctx.textAlign='center';ctx.textBaseline='middle';
      if(isNow){
        ctx.shadowColor=captionColor==='#ffffff'?'#f97316':captionColor;ctx.shadowBlur=22;
        ctx.fillStyle=captionColor==='#ffffff'?'#f97316':captionColor;
        if(captionBg!=='none') drawCapBg(ctx,-bW/2,-sz/2-pY,bW,bH,'pill',captionColor);
        else{rRect(ctx,-bW/2,-bH/2,bW,bH,7);ctx.fill();}
        ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.font='800 '+sz+'px "DM Sans",sans-serif';ctx.fillText(wObj.w,0,1);
      } else if(isPast){
        ctx.globalAlpha=.45;ctx.fillStyle='rgba(255,255,255,.08)';rRect(ctx,-bW/2,-bH/2,bW,bH,7);ctx.fill();
        ctx.fillStyle=captionColor;ctx.font='700 '+sz+'px "DM Sans",sans-serif';ctx.fillText(wObj.w,0,1);
      } else {
        ctx.globalAlpha=.18;ctx.fillStyle=captionColor;ctx.font='700 '+sz+'px "DM Sans",sans-serif';ctx.fillText(wObj.w,0,1);
      }
      ctx.restore();x+=bW+8;
    });
  });
}

function renderColourFlip(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t;
      var base=wi%2===0?captionColor:captionColor==='#ffffff'?'#f5c842':'#ffffff';
      if(isNow&&tryWordAnim(ctx,W,H,wObj.w,age,x+ww/2,lY,sz,true)){x+=ww+10;return;}
      ctx.save();var fi=age<0?0:Math.min(age/.1,1);
      ctx.globalAlpha=fi*(isPast?.88:isNow?1:.2);
      ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='800 '+sz+'px "DM Sans",sans-serif';
      if(captionBg!=='none'&&isNow) drawCapBg(ctx,x,lY,ww,sz,captionBg,base);
      ctx.shadowColor='rgba(0,0,0,.95)';ctx.shadowBlur=8;
      if(isNow){ctx.shadowColor=base;ctx.shadowBlur=16;}
      ctx.fillStyle=base;ctx.fillText(wObj.w.toUpperCase(),x,lY);
      ctx.restore();x+=ww+10;
    });
  });
}

function renderCinematic(ctx,W,H,d){
  if(!d.words.length) return;
  var bh=Math.round(H*.08);ctx.fillStyle='#000';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);
  var now=d.curTime,sz=Math.max(13,capSize-4);
  var lines=groupLines(d.words,6),lineH=sz+10,startY=H*.84;
  lines.forEach(function(line,li){
    ctx.font='400 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line),x=W/2-lW/2,lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.2,age=now-wObj.t,alpha=age<0?0:Math.min(age/.18,1);
      ctx.save();ctx.globalAlpha=alpha*.9;ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.font=(isNow?'600':'400')+' '+sz+'px "DM Sans",sans-serif';
      if(isNow){ctx.shadowColor=captionColor==='#ffffff'?'#93c5fd':captionColor;ctx.shadowBlur=14;ctx.fillStyle=captionColor==='#ffffff'?'#93c5fd':captionColor;}
      else{ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=6;ctx.fillStyle=captionColor;}
      ctx.fillText(wObj.w,x,lY);ctx.restore();x+=ww+8;
    });
  });
}

function renderHype(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,cur=d.words.find(function(w){return now>=w.t&&now<=w.end+.15;});if(!cur)return;
  var age=now-cur.t;
  if(age<.06){ctx.fillStyle='rgba(245,200,66,'+(0.5*(1-age/.06))+')';ctx.fillRect(0,0,W,H);}
  var sz=Math.min(W*.2,capSize*4),sc2=age<.12?1+(.12-age)/.12*.8:1;
  ctx.save();ctx.globalAlpha=Math.min(age/.04,1);ctx.translate(W/2,H*.46);ctx.scale(sc2,sc2);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
  ctx.lineWidth=Math.max(8,sz*.12);ctx.strokeStyle='rgba(0,0,0,.95)';ctx.lineJoin='round';ctx.strokeText(cur.w.toUpperCase(),0,0);
  ctx.fillStyle=captionColor==='#ffffff'?'#f5c842':captionColor;ctx.fillText(cur.w.toUpperCase(),0,0);ctx.restore();
}

function renderKaraoke(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=Math.max(16,capSize-2),barH=Math.max(56,capSize*3+16),barY=H-barH-8;
  var bg2=ctx.createLinearGradient(0,barY,0,barY+barH);bg2.addColorStop(0,'rgba(5,0,15,.97)');bg2.addColorStop(1,'rgba(8,0,20,.7)');
  ctx.fillStyle=bg2;ctx.fillRect(0,barY,W,barH);
  var pulse=.5+.5*Math.sin((vid&&vid.currentTime||0)*5);
  ctx.fillStyle='hsl('+(260+pulse*60)+',90%,65%)';ctx.fillRect(0,barY,W,2);
  var lines=groupLines(d.words,5),lineH2=barH/Math.max(lines.length,1);
  lines.forEach(function(line,li){
    ctx.font='700 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line),x=W/2-lW/2,lY=barY+lineH2*(li+.5)+4;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.15,isPast=now>wObj.end+.15;
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='700 '+sz+'px "DM Sans",sans-serif';
      if(isNow){ctx.shadowColor=captionColor==='#ffffff'?'#f5c842':captionColor;ctx.shadowBlur=22;ctx.fillStyle=captionColor==='#ffffff'?'#f5c842':captionColor;ctx.fillText(wObj.w,x,lY);ctx.shadowBlur=9;ctx.fillText(wObj.w,x,lY);}
      else{ctx.globalAlpha=isPast?.42:.18;ctx.fillStyle=captionColor;ctx.fillText(wObj.w,x,lY);}
      ctx.restore();x+=ww+10;
    });
  });
}

function renderSplit(ctx,W,H,d){
  // One caption line. Active word scales up big, rest stays readable at normal size.
  if(!d.words.length) return;
  var now=d.curTime, sz=capSize;
  var lines=groupLines(d.words,4), lineH=sz+14, startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.15, isPast=now>wObj.end+.15, age=now-wObj.t;
      if(isNow){
        // Active word: big, gradient, centred above line, snaps back after
        var bSz=Math.min(W*.22,sz*4.5);
        var sc2=age<.12?1+(.12-age)/.12*.6:1;
        ctx.save();
        ctx.translate(W/2, lY - sz*1.2);
        ctx.scale(sc2,sc2);
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.font='900 '+bSz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
        ctx.lineWidth=Math.max(5,bSz*.08); ctx.strokeStyle='rgba(0,0,0,.95)'; ctx.lineJoin='round';
        ctx.strokeText(wObj.w.toUpperCase(),0,0);
        var g2=ctx.createLinearGradient(0,-bSz/2,0,bSz/2);
        g2.addColorStop(0,captionColor); g2.addColorStop(1,'rgba(255,255,255,.65)');
        ctx.fillStyle=g2; ctx.fillText(wObj.w.toUpperCase(),0,0);
        ctx.restore();
        // Still draw it dim at its normal position so line width stays stable
        ctx.save(); ctx.globalAlpha=0; ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
        ctx.fillText(wObj.w.toUpperCase(),x,lY); ctx.restore();
      } else {
        ctx.save(); ctx.textAlign='left'; ctx.textBaseline='middle';
        ctx.font='900 '+sz+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
        ctx.globalAlpha=isPast?.7:.25;
        ctx.shadowColor='rgba(0,0,0,.9)'; ctx.shadowBlur=5;
        ctx.fillStyle=captionColor; ctx.fillText(wObj.w.toUpperCase(),x,lY);
        ctx.restore();
      }
      x+=ww+10;
    });
  });
}

function renderTypewriter(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,5),lineH2=sz+16,startY=getCapY(H,lines.length),last=null;
  lines.forEach(function(line,li){
    var vis=line.filter(function(w){return now>=w.t;});if(!vis.length) return;
    ctx.font='700 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,vis),x=W/2-lW/2,lY=startY+li*lineH2;
    vis.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width,isNow=now>=wObj.t&&now<=wObj.end+.15;
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';
      if(captionBg!=='none'&&isNow) drawCapBg(ctx,x,lY,ww,sz,captionBg,captionColor==='#ffffff'?'#4ade80':captionColor);
      ctx.shadowColor=isNow?(captionColor==='#ffffff'?'#4ade80':captionColor):'rgba(0,0,0,.9)';ctx.shadowBlur=isNow?14:6;
      ctx.fillStyle=isNow?(captionColor==='#ffffff'?'#4ade80':captionColor):captionColor;
      ctx.fillText(wObj.w,x,lY);ctx.restore();
      if(wi===vis.length-1) last={x:x+ww+5,y:lY};x+=ww+10;
    });
  });
  if(last&&Math.sin((vid&&vid.currentTime||0)*8)>0){ctx.fillStyle=captionColor==='#ffffff'?'#4ade80':captionColor;ctx.fillRect(last.x,last.y-sz/2,2.5,sz);}
}

function renderBounce(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,3),lineH2=sz+14,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var tW=measLineW(ctx,line),x=W/2-tW/2,y=startY+li*lineH2;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.18,isPast=now>wObj.end+.18,age=now-wObj.t;
      var bounce=isNow?Math.sin(age*20)*6:0;
      if(isNow&&tryWordAnim(ctx,W,H,wObj.w,age,x+ww/2,y+bounce,sz,true)){x+=ww+10;return;}
      ctx.save();ctx.translate(x+ww/2,y+bounce);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 '+sz+'px "DM Sans",sans-serif';
      if(isNow){var hue=(now*100+wi*50)%360,col='hsl('+hue+',100%,68%)';ctx.shadowColor=col;ctx.shadowBlur=22;ctx.fillStyle=col;ctx.scale(1.12,1.12);}
      else{ctx.globalAlpha=isPast?.52:.2;ctx.fillStyle=captionColor;ctx.shadowBlur=5;ctx.shadowColor='rgba(0,0,0,.9)';}
      ctx.fillText(wObj.w.toUpperCase(),0,0);ctx.restore();x+=ww+10;
    });
  });
}

function renderMinimal(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=Math.max(12,capSize-4);
  var lines=groupLines(d.words,6),lineH2=sz+12,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='300 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line),x=W/2-lW/2,lY=startY+li*lineH2;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t,alpha=age<0?0:Math.min(age/.15,1);
      ctx.save();ctx.globalAlpha=alpha*(isPast?.7:isNow?1:.14);ctx.textAlign='left';ctx.textBaseline='middle';
      ctx.font=(isNow?'500':'300')+' '+sz+'px "DM Sans",sans-serif';
      ctx.fillStyle=captionColor;ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=6;
      ctx.fillText(wObj.w.toUpperCase(),x,lY);
      if(isNow&&captionBg==='underline'){ctx.fillStyle=captionColor;ctx.fillRect(x,lY+sz*.55,ww,1.5);}
      ctx.restore();x+=ww+12;
    });
  });
}

function renderGlitch(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH2=sz+12,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line),x=W/2-lW/2,lY=startY+li*lineH2;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t;
      var glitch=isNow&&age<.3?Math.random()*10*(1-age/.3):0;
      ctx.save();ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='800 '+sz+'px "DM Sans",sans-serif';
      if(isNow){
        ctx.save();ctx.globalAlpha=.65;ctx.fillStyle='#ff0044';ctx.fillText(wObj.w.toUpperCase(),x-glitch,lY+glitch*.4);
        ctx.fillStyle='#00e5ff';ctx.fillText(wObj.w.toUpperCase(),x+glitch,lY-glitch*.4);ctx.restore();
        ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);
      } else{ctx.globalAlpha=isPast?.6:.18;ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);}
      ctx.restore();x+=ww+10;
    });
  });
}

function renderOutline(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=capSize;
  var lines=groupLines(d.words,4),lineH2=sz+12,startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='900 '+sz+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line),x=W/2-lW/2,lY=startY+li*lineH2;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+.2,isPast=now>wObj.end+.2,age=now-wObj.t,alpha=age<0?0:Math.min(age/.1,1);
      ctx.save();ctx.globalAlpha=alpha*(isPast?.7:1);ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='900 '+sz+'px "DM Sans",sans-serif';
      ctx.lineWidth=2.5;ctx.lineJoin='round';
      if(isNow){ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(wObj.w.toUpperCase(),x,lY);ctx.fillStyle=captionColor;ctx.fillText(wObj.w.toUpperCase(),x,lY);}
      else{ctx.strokeStyle=isPast?captionColor+'88':captionColor+'30';ctx.strokeText(wObj.w.toUpperCase(),x,lY);}
      ctx.restore();x+=ww+10;
    });
  });
}

function renderStack(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime,sz=Math.max(14,capSize+2);
  var SCOLS=['#7c5cfc','#f5c842','#e879f9','#22d3ee','#f97316','#4ade80'];
  var shown=d.words.filter(function(w){return now>=w.t-.05&&now<=w.end+.6;});if(!shown.length)return;
  var max=Math.min(shown.length,4),startY=getCapY(H,max),lH=sz+8;
  shown.slice(-max).forEach(function(wObj,i){
    var age=now-wObj.t,alpha=Math.min(age/.1,1),col=captionColor==='#ffffff'?SCOLS[i%SCOLS.length]:captionColor;
    var isNow=now>=wObj.t&&now<=wObj.end+.1;
    ctx.save();ctx.globalAlpha=alpha*(isNow?1:.55);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='900 '+(isNow?sz*1.2:sz)+'px "DM Sans",sans-serif';
    ctx.shadowColor=col;ctx.shadowBlur=isNow?20:0;ctx.fillStyle=col;
    ctx.fillText(wObj.w.toUpperCase(),W/2,startY+i*lH);ctx.restore();
  });
}

// ─── NEW CAPTION RENDERERS ───────────────────────────────────────
// RULE: ONE caption system. Active word explodes on screen, rest shows clean at normal size.
// No double layers. No separate small + big captions simultaneously.

// CHROMA REPEAT: active word tiles across the WHOLE screen with RGB split — other words stay clean at bottom
function renderChromaRepeat(ctx, W, H, d) {
  if (!d.words.length) return;
  var now = d.curTime, sz = capSize;
  var lines = groupLines(d.words, 4), lineH = sz + 14, startY = getCapY(H, lines.length);

  lines.forEach(function(line, li) {
    ctx.font = 'italic 800 ' + sz + 'px "DM Sans",sans-serif';
    var lW = measLineW(ctx, line), x = W / 2 - lW / 2, lY = startY + li * lineH;

    line.forEach(function(wObj) {
      var ww = ctx.measureText(wObj.w).width;
      var isNow = now >= wObj.t && now <= wObj.end + 0.2;
      var isPast = now > wObj.end + 0.2;
      var age = now - wObj.t;

      if (isNow) {
        // Active word: tiles full screen vertically with RGB chroma split
        var bigSz = Math.min(W * 0.14, sz * 3);
        var rowH = bigSz * 1.15;
        var rows = Math.ceil(H / rowH) + 1;
        var sc = age < 0.1 ? 1 + (0.1 - age) / 0.1 * 0.3 : 1;
        var word = wObj.w.toUpperCase();

        ctx.save();
        ctx.font = '900 ' + bigSz + 'px "Bebas Neue","Oswald","DM Sans",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (var r = 0; r < rows; r++) {
          var ry = r * rowH;
          var fade = 0.55 + 0.45 * (1 - Math.abs(r - rows/2) / (rows/2));
          var off = (r % 2 === 0 ? 1 : -1) * 3;

          // Red shadow left
          ctx.save(); ctx.globalAlpha = fade * 0.55; ctx.fillStyle = '#ff2020';
          ctx.fillText(word, W / 2 - off * 2, ry); ctx.restore();
          // Cyan shadow right
          ctx.save(); ctx.globalAlpha = fade * 0.55; ctx.fillStyle = '#00e5ff';
          ctx.fillText(word, W / 2 + off * 2, ry); ctx.restore();
          // White on top
          ctx.save(); ctx.globalAlpha = fade * (r === Math.floor(rows/2) ? 1 : 0.6);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = bigSz * 0.06; ctx.lineJoin = 'round';
          ctx.strokeText(word, W / 2, ry); ctx.fillText(word, W / 2, ry);
          ctx.restore();
        }
        ctx.restore();

        // Invisible placeholder to keep line width stable
        ctx.save(); ctx.globalAlpha = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = 'italic 800 ' + sz + 'px "DM Sans",sans-serif';
        ctx.fillText(wObj.w, x, lY); ctx.restore();

      } else {
        // Non-active words: clean italic caption
        ctx.save();
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = 'italic 800 ' + sz + 'px "DM Sans",sans-serif';
        ctx.globalAlpha = isPast ? 0.65 : 0.2;
        ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 8;
        ctx.fillStyle = captionColor;
        ctx.fillText(wObj.w, x, lY);
        ctx.restore();
      }
      x += ww + 10;
    });
  });
}

// GIANT SCANLINE: active word fills screen huge with scanline stripes — rest stays clean
function renderScanline(ctx, W, H, d) {
  if (!d.words.length) return;
  var now = d.curTime, sz = capSize;
  var lines = groupLines(d.words, 4), lineH = sz + 14, startY = getCapY(H, lines.length);

  lines.forEach(function(line, li) {
    ctx.font = '800 ' + sz + 'px "DM Sans",sans-serif';
    var lW = measLineW(ctx, line), x = W / 2 - lW / 2, lY = startY + li * lineH;

    line.forEach(function(wObj) {
      var ww = ctx.measureText(wObj.w).width;
      var isNow = now >= wObj.t && now <= wObj.end + 0.15;
      var isPast = now > wObj.end + 0.15;
      var age = now - wObj.t;

      if (isNow) {
        // Active word: huge, centred, full screen, with scanlines
        var word = wObj.w.toUpperCase();
        var bigSz = Math.min(W * 0.32, sz * 6);
        var sc = age < 0.1 ? 1 + (0.1 - age) / 0.1 * 0.4 : 1;
        var wordLines = word.length > 7
          ? [word.slice(0, Math.ceil(word.length / 2)), word.slice(Math.ceil(word.length / 2))]
          : [word];

        ctx.save();
        ctx.font = '900 ' + bigSz + 'px "Bebas Neue","Oswald","DM Sans",sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        wordLines.forEach(function(wl, wi) {
          var wy = H * 0.5 + (wi - (wordLines.length - 1) / 2) * bigSz * 1.05;
          var tw = ctx.measureText(wl).width;

          // Scale pulse on entry
          ctx.save();
          ctx.translate(W / 2, wy); ctx.scale(sc, sc); ctx.translate(-W / 2, -wy);

          // Black backing rect
          ctx.fillStyle = 'rgba(0,0,0,0.82)';
          ctx.fillRect(W / 2 - tw / 2 - 12, wy - bigSz / 2 - 10, tw + 24, bigSz + 20);

          // White text with stroke
          ctx.strokeStyle = 'rgba(0,0,0,0.95)'; ctx.lineWidth = bigSz * 0.05; ctx.lineJoin = 'round';
          ctx.strokeText(wl, W / 2, wy);
          ctx.fillStyle = captionColor; ctx.fillText(wl, W / 2, wy);

          // Scanlines clipped to the rect
          var x0 = W / 2 - tw / 2 - 12, y0 = wy - bigSz / 2 - 10;
          var bw = tw + 24, bh = bigSz + 20;
          ctx.globalAlpha = 0.32; ctx.fillStyle = '#000000';
          for (var sy = 0; sy < bh; sy += 4) { ctx.fillRect(x0, y0 + sy, bw, 2); }
          ctx.globalAlpha = 1;

          ctx.restore();
        });
        ctx.restore();

        // Invisible placeholder
        ctx.save(); ctx.globalAlpha = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '800 ' + sz + 'px "DM Sans",sans-serif';
        ctx.fillText(wObj.w, x, lY); ctx.restore();

      } else {
        // Non-active words: clean bold caption
        ctx.save();
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '800 ' + sz + 'px "DM Sans",sans-serif';
        ctx.globalAlpha = isPast ? 0.65 : 0.2;
        ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 8;
        ctx.fillStyle = captionColor;
        ctx.fillText(wObj.w, x, lY);
        ctx.restore();
      }
      x += ww + 10;
    });
  });
}

// ─── AUDIO ────────────────────────────────────────────────────────
function playMusic(url, itemEl){
  stopMusic();
  activeMusicUrl = url;
  musicAudio = new Audio(url);
  musicAudio.volume = 0;
  musicAudio.loop = true;
  musicAudio.play().catch(function(){});
  var fi=musicFade*1000, step=50, vol=musicVolume, cur=0;
  var interval=setInterval(function(){cur+=step;musicAudio.volume=Math.min(vol*cur/fi,vol);if(cur>=fi)clearInterval(interval);},step);
  document.querySelectorAll('.music-item').forEach(function(m){m.classList.remove('playing');});
  if(itemEl) itemEl.classList.add('playing');
  var mc=document.getElementById('tlMusicClip');
  var ml=document.getElementById('tlMusicLabel');
  if(mc&&vid&&vid.duration){ mc.style.display='flex'; mc.style.width=(vid.duration*tlPx*tlZoomLevel-2)+'px'; buildMusicWave(mc); }
  if(ml){ var t=MUSIC_LIBRARY.find(function(x){return x.url===url;}); if(t) ml.textContent=t.name||'MUSIC'; }
  toast('🎵 Playing');
}

function stopMusic(){
  if(musicAudio){ musicAudio.pause(); musicAudio.src=''; musicAudio=null; }
  activeMusicUrl = null;
  document.querySelectorAll('.music-item').forEach(function(m){m.classList.remove('playing');});
}

function loadUserMusic(input){
  var f = input.files[0]; if(!f) return;
  // FIX: revoke previous user music object URL to avoid leak
  if(_userMusicObjectURL) URL.revokeObjectURL(_userMusicObjectURL);
  _userMusicObjectURL = URL.createObjectURL(f);
  document.getElementById('userMusicName').textContent = '♪ ' + f.name;
  playMusic(_userMusicObjectURL, null);
  toast('🎵 ' + f.name);
}

function updateMusicVol(){musicVolume=parseInt(document.getElementById('slMusicVol').value)/100;document.getElementById('slMusicVolVal').textContent=Math.round(musicVolume*100)+'%';if(musicAudio)musicAudio.volume=musicVolume;}
function updateVoiceVol(){if(vid)vid.volume=parseInt(document.getElementById('slVoiceVol').value)/100;document.getElementById('slVoiceVolVal').textContent=Math.round((vid?vid.volume:1)*100)+'%';}
function updateMusicFade(){musicFade=parseFloat(document.getElementById('slMusicFade').value);document.getElementById('slMusicFadeVal').textContent=musicFade+'s';}

// ─── EFFECTS ─────────────────────────────────────────────────────
function updateFX(){
  var bb=document.getElementById('slBgBlur');
  if(bb){bgBlur=parseInt(bb.value);document.getElementById('slBgBlurVal').textContent=bb.value;}
  if(!isPlaying) drawFrame();
}
function toggleFlip(dir){
  if(dir==='h'){flipH=!flipH;document.getElementById('flipHBtn').classList.toggle('active-flip',flipH);}
  else{flipV=!flipV;document.getElementById('flipVBtn').classList.toggle('active-flip',flipV);}
  if(!isPlaying) drawFrame();
}

// ─── CROP / SCALE ─────────────────────────────────────────────────
function updateVideoScale(){
  videoScale=parseInt(document.getElementById('slVideoScale').value)/100;
  document.getElementById('slVideoScaleVal').textContent=Math.round(videoScale*100)+'%';
  offsetX=parseInt(document.getElementById('slOffsetX').value);
  offsetY=parseInt(document.getElementById('slOffsetY').value);
  document.getElementById('slOffsetXVal').textContent=offsetX;
  document.getElementById('slOffsetYVal').textContent=offsetY;
  if(!isPlaying) drawFrame();
}
function updateBgColor(){
  bgColorH=parseInt(document.getElementById('slBgH').value);
  bgColorS=parseInt(document.getElementById('slBgS').value);
  bgColorL=parseInt(document.getElementById('slBgL').value);
  document.getElementById('slBgHVal').textContent=bgColorH;
  document.getElementById('slBgSVal').textContent=bgColorS;
  document.getElementById('slBgLVal').textContent=bgColorL;
  var sw=document.getElementById('bgPreview');
  if(sw) sw.style.background='hsl('+bgColorH+','+bgColorS+'%,'+bgColorL+'%)';
  if(!isPlaying) drawFrame();
}

// ─── PLAYBACK ─────────────────────────────────────────────────────
function togglePlay(){
  if(fileType!=='video'||!vid){ toast('Image mode — no playback'); return; }
  if(!vid.src){ toast('Load a video first'); return; }
  if(vid.paused){
    initAudioGraph();
    if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    applyAudioSettings();
    vid.play(); isPlaying=true; updatePlayIcons(true); rafId=requestAnimationFrame(drawFrame);
  } else {
    vid.pause(); isPlaying=false; updatePlayIcons(false); cancelAnimationFrame(rafId); drawFrame();
  }
}
function updatePlayIcons(pl){
  var ti=document.getElementById('tlIcon'),bp=document.getElementById('bigPlay'),tap=document.getElementById('playTap');
  if(pl){
    if(ti) ti.innerHTML='<rect x="1" y="1" width="3" height="11" rx="1" fill="currentColor"/><rect x="7" y="1" width="3" height="11" rx="1" fill="currentColor"/>';
    if(bp) bp.innerHTML='<svg width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="1" y="1" width="5" height="16" rx="1.5" fill="white"/><rect x="10" y="1" width="5" height="16" rx="1.5" fill="white"/></svg>';
    if(tap) tap.classList.add('on');
  } else {
    if(ti) ti.innerHTML='<path d="M1 1L10 6.5L1 12V1Z" fill="currentColor"/>';
    if(bp) bp.innerHTML='<svg width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M2 1.5L18 11L2 20.5V1.5Z" fill="white"/></svg>';
    if(tap) tap.classList.remove('on');
  }
}
function toggleMute(){
  isMuted=!isMuted; if(vid) vid.muted=isMuted;
  var btn=document.getElementById('muteBtn'); if(btn) btn.textContent=isMuted?'🔇':'🔊';
}

// ─── EXPORT ───────────────────────────────────────────────────────
var exportFormat = 'mp4';
var exportFPS    = 30;
var _preExportW  = 540;    // FIX: store preview dimensions for restore
var _preExportH  = 960;

function setExportFormat(btn){
  exportFormat = btn.dataset.fmt;
  document.querySelectorAll('.fmt-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  var note = document.getElementById('mp4Note');
  if(note) note.style.display = exportFormat==='mp4' ? 'block' : 'none';
}
function setFPS(btn){
  exportFPS = parseInt(btn.dataset.fps);
  document.querySelectorAll('.fps-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
}

function getExportDims(){
  var q = document.querySelector('input[name="quality"]:checked');
  var qual = q ? q.value : 'high';
  if(exportFmt==='reel'){
    return qual==='ultra'?{w:1080,h:1920}:qual==='high'?{w:540,h:960}:{w:405,h:720};
  } else if(exportFmt==='youtube'){
    return qual==='ultra'?{w:3840,h:2160}:qual==='high'?{w:1920,h:1080}:{w:1280,h:720};
  } else {
    return qual==='ultra'?{w:2160,h:2160}:qual==='high'?{w:1080,h:1080}:{w:720,h:720};
  }
}

// FIX: restore canvas to preview dimensions after export
function restorePreviewCanvas(){
  if(!cv) return;
  cv.width  = _preExportW;
  cv.height = _preExportH;
  drawFrame();
}

function exportThumbnail(){
  if(!clip||!cv){ toast('Load a file first'); return; }
  drawFrame();
  setTimeout(function(){
    cv.toBlob(function(blob){
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='impactgrid_thumbnail.png';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(a.href);   // FIX: revoke after download
      toast('✓ Thumbnail saved!');
    },'image/png');
  },200);
}

function exportGIF(){
  toast('GIF: export as WebM first, then convert at ezgif.com 🎞');
}

function doExport(){
  if(!clip||!cv){ toast('No file loaded'); return; }
  if(exportFormat==='gif'){ exportGIF(); return; }

  // FIX: save current preview dims before resizing canvas
  _preExportW = cv.width;
  _preExportH = cv.height;

  var dims = getExportDims();
  cv.width = dims.w; cv.height = dims.h;

  var ep=document.getElementById('expProg'),bar=document.getElementById('epFill'),lbl=document.getElementById('epLbl');
  if(ep) ep.style.display='block';
  var dlBtn=document.getElementById('dlBtn');
  if(dlBtn) dlBtn.disabled=true;

  if(fileType==='image'){
    drawFrame();
    setTimeout(function(){
      cv.toBlob(function(blob){
        triggerDownload(blob,'impactgrid_'+activeStyle.id+'.png');
        if(bar) bar.style.width='100%';
        if(lbl) lbl.textContent='✓ Image saved!';
        if(dlBtn) dlBtn.disabled=false;
        toast('✓ Image exported!');
        restorePreviewCanvas();   // FIX
        setTimeout(function(){if(ep)ep.style.display='none';},3000);
      },'image/png');
    },250);
    return;
  }

  // FIX: reuse the existing audio graph — never create a second AudioContext on vid.
  // createMediaElementSource() can only be called once per element. A second call throws
  // InvalidStateError which was silently swallowed, producing a silent export every time.
  // Instead we tap gainNode → exportStreamDest (wired once in initAudioGraph).
  var stream = cv.captureStream(exportFPS);
  var audioStream = getExportAudioStream();
  if(audioStream){
    audioStream.getAudioTracks().forEach(function(t){ stream.addTrack(t); });
  } else {
    // Audio graph not ready yet (user never pressed play) — initialise it now
    initAudioGraph();
    applyAudioSettings();
    var audioStream2 = getExportAudioStream();
    if(audioStream2){
      audioStream2.getAudioTracks().forEach(function(t){ stream.addTrack(t); });
    }
  }

  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .find(function(m){return MediaRecorder.isTypeSupported(m);})||'video/webm';

  var q = document.querySelector('input[name="quality"]:checked');
  var bitrate = q&&q.value==='ultra'?12000000:q&&q.value==='web'?2500000:6000000;

  var chunks=[],rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:bitrate});
  rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};

  rec.onstop=function(){
    var webmBlob=new Blob(chunks,{type:'video/webm'});
    if(exportFormat==='webm'){
      triggerDownload(webmBlob,'impactgrid_'+activeStyle.id+'.webm');
      if(bar) bar.style.width='100%';
      if(lbl) lbl.textContent='✓ Downloaded as WebM!';
      if(dlBtn) dlBtn.disabled=false;
      toast('✓ WebM exported!');
      restorePreviewCanvas();
      setTimeout(function(){if(ep)ep.style.display='none';},4000);
    } else {
      if(lbl) lbl.textContent='Converting to MP4…';
      if(bar) bar.style.width='95%';
      convertToMP4(webmBlob, function(mp4Blob){
        triggerDownload(mp4Blob,'impactgrid_'+activeStyle.id+'.mp4');
        if(bar) bar.style.width='100%';
        if(lbl) lbl.textContent='✓ MP4 Downloaded!';
        if(dlBtn) dlBtn.disabled=false;
        toast('✓ MP4 exported! Perfect for TikTok & Instagram 🎉');
        restorePreviewCanvas();
        setTimeout(function(){if(ep)ep.style.display='none';},5000);
      }, function(err){
        console.warn('FFmpeg failed, falling back to WebM', err);
        triggerDownload(webmBlob,'impactgrid_'+activeStyle.id+'_NOTE-rename-to-mp4.webm');
        if(bar) bar.style.width='100%';
        if(lbl) lbl.textContent='⚠ Saved as WebM — rename to .mp4 on Windows';
        if(dlBtn) dlBtn.disabled=false;
        toast('Saved! Rename file to .mp4 if needed');
        restorePreviewCanvas();
        setTimeout(function(){if(ep)ep.style.display='none';},6000);
      });
    }
  };

  if(vid) vid.currentTime=0;
  isPlaying=true;
  if(vid) vid.play();
  rec.start(100);
  rafId=requestAnimationFrame(drawFrame);
  var dur=(vid?vid.duration:10)*1000, t0=Date.now();
  var pi=setInterval(function(){
    var p=Math.min((Date.now()-t0)/dur*90,90);
    if(bar) bar.style.width=p+'%';
    if(lbl) lbl.textContent='Recording… '+Math.round(p)+'%';
  },300);
  // FIX: cancel the RAF loop on ended, not just stop the recorder.
  // Previously rafId kept running forever after export finished.
  if(vid) vid.onended=function(){
    clearInterval(pi);
    isPlaying=false;
    cancelAnimationFrame(rafId);
    rec.stop();
  };
}

function triggerDownload(blob, filename){
  var a=document.createElement('a');
  var url=URL.createObjectURL(blob);
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); },5000);  // FIX: revoke after download
}

async function convertToMP4(webmBlob, onSuccess, onError){
  try{
    var ffmpeg = FFmpeg.createFFmpeg({
      log: false,
      corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
    });
    var lbl=document.getElementById('epLbl');
    if(lbl) lbl.textContent='Loading converter…';
    await ffmpeg.load();
    if(lbl) lbl.textContent='Converting to MP4…';
    var data = new Uint8Array(await webmBlob.arrayBuffer());
    ffmpeg.FS('writeFile','input.webm',data);
    await ffmpeg.run('-i','input.webm','-c:v','libx264','-preset','fast','-crf','22','-c:a','aac','-movflags','+faststart','output.mp4');
    var out = ffmpeg.FS('readFile','output.mp4');
    var mp4Blob = new Blob([out.buffer],{type:'video/mp4'});
    onSuccess(mp4Blob);
  }catch(e){
    onError(e);
  }
}

// ─── TABS ─────────────────────────────────────────────────────────
function switchTab(btn){
  var tid=btn.dataset.tab;
  document.querySelectorAll('.isb').forEach(function(b){b.classList.remove('active');});
  document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
  btn.classList.add('active');
  var el=document.getElementById(tid); if(el) el.classList.add('active');
  var lblMap={tabCaptions:'CAPTIONS',tabText:'TEXT',tabStickers:'STICKERS',tabGrade:'GRADE',tabEffects:'EFFECTS',tabCrop:'CROP & RATIO',tabAudio:'AUDIO',tabExport:'EXPORT'};
  var lbl=document.getElementById('rpLabel'); if(lbl) lbl.textContent=lblMap[tid]||tid;
}

// ─── NAVIGATION ───────────────────────────────────────────────────
function goBack(){
  var cur=document.querySelector('.screen.active');
  if(!cur) return;
  var id=cur.id;
  if(id==='sPreview'||id==='sProcess') goTo('sStyle');
  else if(id==='sStyle') goTo('sDrop');
}
function resetAll(){
  activeGrade=null;activeFX=null;customFilter='';vignetteVal=30;noiseVal=0;activeTint=null;
  activeMotion='none';flipH=false;flipV=false;videoScale=1;offsetX=0;offsetY=0;
  stickers=[];activeSticker=-1;overlayTextVal='';
  resetGradeSliders();
  var el=document.getElementById('overlayText'); if(el) el.value='';
  buildAllPanels(); if(!isPlaying) drawFrame(); toast('All settings reset');
}

// ─── HELPERS ─────────────────────────────────────────────────────
function groupLines(arr,n){var lines=[],cur=[];arr.forEach(function(w){cur.push(w);if(cur.length>=n){lines.push(cur.slice());cur=[];}});if(cur.length)lines.push(cur);return lines;}
function measLineW(ctx,arr){return arr.reduce(function(a,w){return a+ctx.measureText(w.w||w).width+10;},0);}
function rRect(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);}else{ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}}
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el=document.getElementById(id);
  if(el){el.classList.add('active');window.scrollTo(0,0);}
  var bb=document.getElementById('backBtn');
  if(bb){
    bb.style.display=id==='sDrop'?'none':'flex';
    bb.textContent = id==='sStyle'?'← Home': id==='sProcess'?'← Styles':'← New file';
  }
}
function ft(s){if(!s||isNaN(s))return'0:00';var m=Math.floor(s/60),sec=Math.floor(s%60);return m+':'+(sec<10?'0':'')+sec;}
function setStatus(icon,title,desc,pct){
  var a=document.getElementById('procAnim'),t=document.getElementById('procTitle'),d=document.getElementById('procDesc'),p=document.getElementById('progFill');
  if(a)a.textContent=icon; if(t)t.textContent=title; if(d)d.textContent=desc; if(p&&pct>=0)p.style.width=pct+'%';
}
function stepProg(step){for(var i=1;i<=5;i++){var el=document.getElementById('ps'+i);if(!el)continue;el.classList.remove('ps-active','ps-done');if(i<step)el.classList.add('ps-done');else if(i===step)el.classList.add('ps-active');}}
var _tt;
function toast(msg){var el=document.getElementById('toast');if(!el)return;el.textContent=msg;el.className='toast show';clearTimeout(_tt);_tt=setTimeout(function(){el.className='toast';},3800);}
