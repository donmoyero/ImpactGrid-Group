// ================================================================
// VELO STUDIO — Pro Video Caption Engine v2
// AssemblyAI · 12 caption styles · 8 word animations · Pro tools
// ================================================================

var ASSEMBLY_KEY    = '80e3b7c067bf4d68a16ad9e32efc9887';
var ASSEMBLY_UPLOAD = 'https://api.assemblyai.com/v2/upload';
var ASSEMBLY_SUBMIT = 'https://api.assemblyai.com/v2/transcript';

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
var clip          = null;
var fileType      = 'video';   // 'video' | 'image'
var activeStyle   = null;
var allWords      = [];
var sentences     = [];
var isPlaying     = false;
var rafId         = null;
var exportFmt     = 'reel';
var transcriptId  = null;
var pollTimer     = null;
var captionPos    = 'bot';
var capSize       = 22;
var activeWordAnim = null;
var activeFX      = null;
var activeTransition = null;
var activeMotion  = 'none';
var activeGrade   = null;
var customFilter  = '';
var overlayTextVal = '';
var overlayPos    = 'mid';
var overlayFontId = 'bold';
var overlayColor  = '#ffffff';
var overlayAnim   = 'none';
var musicAudio    = null;
var musicVolume   = 0.4;
var activeMusicUrl = null;
var voiceVolume   = 1.0;
var vignetteVal   = 0.4;
var motionPhase   = 0;

var vid    = document.getElementById('masterVid');
var cv     = document.getElementById('cv');
var cvCtx  = cv.getContext('2d');
var gradeC = document.createElement('canvas');
var gradeX = gradeC.getContext('2d');

// ─────────────────────────────────────────────────────────────────
// CAPTION STYLES  (12 total)
// ─────────────────────────────────────────────────────────────────
var STYLES = [
  {
    id: 'fire', name: '🔥 Fire Pill',
    desc: 'Active word glows inside an orange pill with slam-in animation.',
    tags: ['TikTok','Viral'],
    bg: 'linear-gradient(150deg,#1a0400,#0d0200)',
    render: renderFire
  },
  {
    id: 'colourflip', name: '🎨 Colour Flip',
    desc: 'Words alternate white and gold. All caps, bold.',
    tags: ['Modern','Clean'],
    bg: 'linear-gradient(150deg,#0a0a0a,#141414)',
    render: renderColourFlip
  },
  {
    id: 'cinematic', name: '🎬 Cinematic',
    desc: 'Elegant fade. Cool blue tones. Letterbox bars.',
    tags: ['Film','Premium'],
    bg: 'linear-gradient(150deg,#000814,#001233)',
    render: renderCinematic
  },
  {
    id: 'hype', name: '⚡ One-Word Hype',
    desc: 'One massive word centre-screen. Impact every word.',
    tags: ['Sports','Launch'],
    bg: 'linear-gradient(150deg,#1a1000,#080400)',
    render: renderHype
  },
  {
    id: 'neonkaraoke', name: '💜 Neon Karaoke',
    desc: 'Dark bar at bottom. Each word lights up gold when spoken.',
    tags: ['Podcast','Night'],
    bg: 'linear-gradient(150deg,#05000f,#0f0020)',
    render: renderKaraoke
  },
  {
    id: 'split', name: '✂ Bold Split',
    desc: 'Current word huge at top. Full sentence small below.',
    tags: ['Drama','Impact'],
    bg: 'linear-gradient(150deg,#080808,#040404)',
    render: renderSplit
  },
  {
    id: 'typewriter', name: '⌨ Typewriter',
    desc: 'Words type in with cursor. Satisfying & clean.',
    tags: ['Clean','Satisfying'],
    bg: 'linear-gradient(150deg,#081a10,#040f06)',
    render: renderTypewriter
  },
  {
    id: 'bounce', name: '🎵 Bounce & Shake',
    desc: 'Words bounce, hue-shift and pop with energy.',
    tags: ['Music','Fun'],
    bg: 'linear-gradient(150deg,#0d0020,#1a0030)',
    render: renderBounce
  },
  {
    id: 'minimal', name: '◽ Clean Minimal',
    desc: 'Thin white text. Understated. Luxury feel.',
    tags: ['Luxury','Brand'],
    bg: 'linear-gradient(150deg,#0a0a0a,#111)',
    render: renderMinimal
  },
  {
    id: 'glitch', name: '⚡ Glitch RGB',
    desc: 'Active word splits into RGB channels with noise.',
    tags: ['Edgy','Tech'],
    bg: 'linear-gradient(150deg,#000a00,#050505)',
    render: renderGlitch
  },
  {
    id: 'outline', name: '◻ Outline Impact',
    desc: 'Words appear as outline then fill on active.',
    tags: ['Bold','Urban'],
    bg: 'linear-gradient(150deg,#080808,#0f0f0f)',
    render: renderOutline
  },
  {
    id: 'stack', name: '📚 Word Stack',
    desc: 'Words stack vertically, each popping with colour.',
    tags: ['Unique','Vertical'],
    bg: 'linear-gradient(150deg,#0a0018,#100028)',
    render: renderStack
  }
];
activeStyle = STYLES[0];
activeWordAnim = null; // uses style default

// ─────────────────────────────────────────────────────────────────
// WORD ANIMATION OVERLAYS  (8 total)
// ─────────────────────────────────────────────────────────────────
var WORD_ANIMS = [
  {
    id: 'default', name: 'Default',
    desc: 'Style default'
  },
  {
    id: 'slam', name: '💥 Slam',
    desc: 'Word crashes in from above'
  },
  {
    id: 'pop', name: '⭕ Pop',
    desc: 'Word pops out with scale burst'
  },
  {
    id: 'glow', name: '✨ Glow',
    desc: 'Word pulses with soft neon glow'
  },
  {
    id: 'shake', name: '📳 Shake',
    desc: 'Word vibrates with intensity'
  },
  {
    id: 'spin3d', name: '🌀 Flip In',
    desc: 'Word flips in from 3D angle'
  },
  {
    id: 'wave', name: '〰 Wave',
    desc: 'Characters wave like ocean'
  },
  {
    id: 'stamp', name: '🖨 Stamp',
    desc: 'Smashes down on white rect'
  }
];

// FX presets (canvas CSS filter simulation)
var FX_PRESETS = [
  { id:'none',     name:'Original',  filter:'none',                                               bg:'#2a2a2a' },
  { id:'warm',     name:'Warm',      filter:'brightness(1.05) saturate(1.3) sepia(0.2)',           bg:'linear-gradient(135deg,#3d1a00,#8b4500)' },
  { id:'cold',     name:'Cold',      filter:'brightness(0.95) saturate(0.7) hue-rotate(185deg)',   bg:'linear-gradient(135deg,#001233,#0a3d6e)' },
  { id:'vivid',    name:'Vivid',     filter:'brightness(1.07) saturate(1.9) contrast(1.1)',        bg:'linear-gradient(135deg,#1a0030,#003030)' },
  { id:'noir',     name:'Noir',      filter:'grayscale(1) contrast(1.35) brightness(0.88)',        bg:'linear-gradient(135deg,#000,#2a2a2a)' },
  { id:'golden',   name:'Golden',    filter:'brightness(1.08) saturate(1.2) sepia(0.4)',           bg:'linear-gradient(135deg,#2a1a00,#6b4a00)' },
  { id:'moody',    name:'Moody',     filter:'brightness(0.8) saturate(0.7) contrast(1.18)',        bg:'linear-gradient(135deg,#0a0014,#140028)' },
  { id:'sunset',   name:'Sunset',    filter:'brightness(1.06) saturate(1.5) hue-rotate(-18deg)',   bg:'linear-gradient(135deg,#3d0a00,#8b2000)' },
  { id:'fresh',    name:'Fresh',     filter:'brightness(1.06) saturate(1.1) hue-rotate(12deg)',    bg:'linear-gradient(135deg,#002200,#004400)' },
  { id:'dreamy',   name:'Dreamy',    filter:'brightness(1.1) saturate(0.85) blur(0.4px)',          bg:'linear-gradient(135deg,#1a0030,#2a0050)' },
  { id:'hard',     name:'Hard',      filter:'contrast(1.5) brightness(0.92)',                      bg:'linear-gradient(135deg,#111,#333)' },
  { id:'teal',     name:'Teal',      filter:'brightness(0.9) saturate(1.1) hue-rotate(150deg)',    bg:'linear-gradient(135deg,#002a2a,#004444)' }
];

var TRANSITIONS = [
  { id:'cut',    name:'Cut',     icon:'✂' },
  { id:'fade',   name:'Fade',    icon:'🌫' },
  { id:'slide',  name:'Slide',   icon:'→' },
  { id:'zoom',   name:'Zoom',    icon:'🔍' },
  { id:'wipe',   name:'Wipe',    icon:'◀' },
  { id:'burn',   name:'Burn',    icon:'🔥' }
];

var MOTION_OPTS = [
  { id:'none',    name:'None' },
  { id:'slowzoom',name:'Ken Burns' },
  { id:'shake',   name:'Handheld' },
  { id:'drift',   name:'Drift' },
  { id:'pulse',   name:'Pulse' }
];

var GRADES = [
  { id:'none',   name:'Original', bg:'#2a2a2a' },
  { id:'warm',   name:'Warm',     bg:'linear-gradient(135deg,#3d1a00,#8b4500)', filter:'brightness(1.05) saturate(1.3) sepia(0.18)' },
  { id:'cold',   name:'Cold',     bg:'linear-gradient(135deg,#001233,#0a3d6e)', filter:'brightness(0.95) saturate(0.75) hue-rotate(185deg)' },
  { id:'vivid',  name:'Vivid',    bg:'linear-gradient(135deg,#1a0030,#003030)', filter:'brightness(1.07) saturate(1.9) contrast(1.1)' },
  { id:'noir',   name:'Noir',     bg:'linear-gradient(135deg,#000,#2a2a2a)',    filter:'grayscale(1) contrast(1.35)' },
  { id:'golden', name:'Golden',   bg:'linear-gradient(135deg,#2a1a00,#6b4a00)',filter:'brightness(1.1) saturate(1.2) sepia(0.4)' },
  { id:'moody',  name:'Moody',    bg:'linear-gradient(135deg,#0a0014,#140028)',filter:'brightness(0.8) saturate(0.72) contrast(1.18)' },
  { id:'sunset', name:'Sunset',   bg:'linear-gradient(135deg,#3d0a00,#8b2000)',filter:'brightness(1.06) saturate(1.5) hue-rotate(-18deg)' },
  { id:'fresh',  name:'Fresh',    bg:'linear-gradient(135deg,#002200,#004400)',filter:'brightness(1.06) saturate(1.1) hue-rotate(12deg)' }
];

var FONTS = [
  { id:'bold',    label:'Bold',     family:'"DM Sans",sans-serif',     weight:'700' },
  { id:'black',   label:'Black',    family:'"DM Sans",sans-serif',     weight:'900' },
  { id:'playfair',label:'Elegant',  family:'"Playfair Display",serif', weight:'900' },
  { id:'bebas',   label:'Display',  family:'"Bebas Neue","Oswald",sans-serif', weight:'400' },
  { id:'mono',    label:'Mono',     family:'"Courier New",monospace',  weight:'700' },
  { id:'oswald',  label:'Oswald',   family:'"Oswald",sans-serif',      weight:'600' }
];

var COLORS = ['#ffffff','#f5c842','#7c5cfc','#ff4d6d','#22d3ee','#4ade80','#f97316','#e879f9','#000000'];

var TEXT_ANIMS = [
  { id:'none',    label:'None' },
  { id:'fade',    label:'Fade in' },
  { id:'rise',    label:'Rise up' },
  { id:'pop',     label:'Pop' },
  { id:'typewrite',label:'Type' }
];

var FREE_TRACKS = [
  { name:'Lo-Fi Chill',       vibe:'Calm · 88 BPM',      icon:'🎧', url:'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { name:'Epic Cinematic',    vibe:'Intense · 120 BPM',  icon:'🎬', url:'https://cdn.pixabay.com/audio/2022/03/15/audio_d75ef65dbc.mp3' },
  { name:'Upbeat Corporate',  vibe:'Positive · 115 BPM', icon:'💼', url:'https://cdn.pixabay.com/audio/2022/10/25/audio_946c1c7a09.mp3' },
  { name:'Acoustic Vibe',     vibe:'Warm · 85 BPM',      icon:'🎸', url:'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3' }
];

// ─────────────────────────────────────────────────────────────────
// BUILD STYLE PICKER  (S2)
// ─────────────────────────────────────────────────────────────────
(function buildStylePicker(){
  var grid = document.getElementById('styleGrid');
  var DEMOS = {
    fire:        '<div style="display:flex;gap:4px;align-items:center"><span style="background:#f97316;color:#fff;padding:3px 10px;border-radius:5px;font-size:11px;font-weight:800;box-shadow:0 0 12px rgba(249,115,22,0.7)">FIRE</span><span style="color:rgba(255,255,255,0.18);font-size:10px;font-weight:700">WORD</span></div>',
    colourflip:  '<span style="color:#fff;font-size:13px;font-weight:800;letter-spacing:1px">YOUR </span><span style="color:#f5c842;font-size:13px;font-weight:800;letter-spacing:1px">WORDS </span><span style="color:rgba(255,255,255,0.2);font-size:12px;font-weight:800">HERE</span>',
    cinematic:   '<span style="color:#93c5fd;font-size:13px;font-weight:400;letter-spacing:2px;text-shadow:0 0 12px #93c5fd">YOUR WORDS HERE</span>',
    hype:        '<span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:44px;color:#f5c842;-webkit-text-stroke:2px #000;text-shadow:0 0 20px rgba(245,200,66,0.5);line-height:1">HYPE</span>',
    neonkaraoke: '<div style="background:rgba(5,0,15,0.97);padding:7px 14px;border-top:2px solid #a855f7;border-radius:4px;display:flex;gap:6px"><span style="color:rgba(192,132,252,0.3);font-size:12px;font-weight:700">YOUR </span><span style="color:#f5c842;font-size:12px;font-weight:700;text-shadow:0 0 10px #f5c842">WORDS </span><span style="color:rgba(192,132,252,0.2);font-size:12px;font-weight:700">HERE</span></div>',
    split:       '<div style="text-align:center"><div style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:36px;color:#fff;letter-spacing:2px;-webkit-text-stroke:1px rgba(0,0,0,0.5);line-height:1">BOLD</div><div style="font-size:9px;color:rgba(255,255,255,0.25);margin-top:3px;letter-spacing:1px">sentence appears here</div></div>',
    typewriter:  '<span style="color:#4ade80;font-size:13px;font-weight:700;font-family:monospace;text-shadow:0 0 8px #4ade80">YOUR WORDS▌</span>',
    bounce:      '<span style="color:hsl(280,100%,72%);font-size:13px;font-weight:800;text-shadow:0 0 10px hsl(280,100%,60%)">SH</span><span style="color:hsl(330,100%,68%);font-size:18px;font-weight:800;text-shadow:0 0 12px hsl(330,100%,60%);display:inline-block;transform:translateY(-4px)">AK</span><span style="color:hsl(15,100%,65%);font-size:13px;font-weight:800;text-shadow:0 0 10px hsl(15,100%,55%)">E</span>',
    minimal:     '<span style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:300;letter-spacing:4px;text-transform:uppercase">your words</span>',
    glitch:      '<div style="position:relative;display:inline-block"><span style="color:#ff0044;font-size:13px;font-weight:800;position:absolute;transform:translate(-2px,1px);opacity:0.7">GLITCH</span><span style="color:#00ffcc;font-size:13px;font-weight:800;position:absolute;transform:translate(2px,-1px);opacity:0.7">GLITCH</span><span style="color:#fff;font-size:13px;font-weight:800;position:relative">GLITCH</span></div>',
    outline:     '<span style="color:transparent;font-size:16px;font-weight:900;-webkit-text-stroke:1.5px #fff;letter-spacing:3px">OUTLINE</span>',
    stack:       '<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><span style="color:#7c5cfc;font-size:10px;font-weight:800;letter-spacing:2px">WORD</span><span style="color:#f5c842;font-size:13px;font-weight:800;letter-spacing:2px">STACK</span><span style="color:#e879f9;font-size:10px;font-weight:800;letter-spacing:2px">STYLE</span></div>'
  };

  STYLES.forEach(function(s, si){
    var card = document.createElement('div');
    card.className = 'sc' + (si === 0 ? ' sel' : '');
    card.innerHTML =
      '<div class="sc-demo" style="background:' + s.bg + '">' + (DEMOS[s.id]||'') + '<div class="sc-tick">✓</div></div>'
      + '<div class="sc-body"><div class="sc-name">' + s.name + '</div>'
      + '<div class="sc-desc">' + s.desc + '</div>'
      + '<div class="sc-tags">' + s.tags.map(function(t){ return '<span class="sc-tag">'+t+'</span>'; }).join('') + '</div>'
      + '</div>';
    card.onclick = function(){
      document.querySelectorAll('.sc').forEach(function(c){ c.classList.remove('sel'); });
      card.classList.add('sel');
      activeStyle = s;
      setTimeout(function(){
        if(allWords.length) launchPreview();
        else processWithAssemblyAI();
      }, 180);
    };
    grid.appendChild(card);
  });
})();

// ─────────────────────────────────────────────────────────────────
// BUILD CAPTION LIST  (right panel)
// ─────────────────────────────────────────────────────────────────
function buildCaptionList(){
  var list = document.getElementById('miniStyles');
  if(!list) return;
  list.innerHTML = '';
  var MINI = {
    fire:       '<div style="background:linear-gradient(135deg,#1a0400,#0d0200);width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:3px"><span style="background:#f97316;color:#fff;padding:2px 7px;border-radius:4px;font-size:8px;font-weight:800">FIRE</span><span style="color:rgba(255,255,255,0.2);font-size:7px;font-weight:700">WORD</span></div>',
    colourflip: '<div style="background:#0a0a0a;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#fff;font-size:9px;font-weight:800">YOUR </span><span style="color:#f5c842;font-size:9px;font-weight:800">WORD</span></div>',
    cinematic:  '<div style="background:linear-gradient(135deg,#000814,#001233);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#93c5fd;font-size:9px;letter-spacing:1px">your words</span></div>',
    hype:       '<div style="background:linear-gradient(135deg,#1a1000,#080400);width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:22px;color:#f5c842;-webkit-text-stroke:1px #000">HYPE</span></div>',
    neonkaraoke:'<div style="background:linear-gradient(135deg,#05000f,#0f0020);width:100%;height:100%;display:flex;align-items:flex-end;justify-content:center;padding-bottom:3px"><div style="background:rgba(5,0,15,0.95);padding:2px 8px;border-top:1px solid #a855f7;font-size:7px;color:#f5c842;font-weight:700;text-shadow:0 0 6px #f5c842">NEO KARA</div></div>',
    split:      '<div style="background:#080808;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-family:\'Bebas Neue\',\'Oswald\',sans-serif;font-size:18px;color:#fff;letter-spacing:1px">BIG</span><span style="font-size:6px;color:rgba(255,255,255,0.2);margin-top:2px">small below</span></div>',
    typewriter: '<div style="background:#081a10;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:#4ade80;font-size:9px;font-weight:700;font-family:monospace;text-shadow:0 0 6px #4ade80">TYPE▌</span></div>',
    bounce:     '<div style="background:linear-gradient(135deg,#0d0020,#1a0030);width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:1px"><span style="color:hsl(280,100%,70%);font-size:10px;font-weight:800">S</span><span style="color:hsl(330,100%,65%);font-size:13px;font-weight:800">H</span><span style="color:hsl(15,100%,65%);font-size:10px;font-weight:800">K</span></div>',
    minimal:    '<div style="background:#0a0a0a;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:rgba(255,255,255,0.75);font-size:8px;font-weight:300;letter-spacing:3px">MINIMAL</span></div>',
    glitch:     '<div style="background:#000a00;width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative"><span style="color:#ff0044;font-size:10px;font-weight:800;position:absolute;transform:translate(-2px,1px);opacity:0.7">GLTCH</span><span style="color:#00ffcc;font-size:10px;font-weight:800;position:absolute;transform:translate(2px,-1px);opacity:0.7">GLTCH</span><span style="color:#fff;font-size:10px;font-weight:800;position:relative">GLTCH</span></div>',
    outline:    '<div style="background:#080808;width:100%;height:100%;display:flex;align-items:center;justify-content:center"><span style="color:transparent;font-size:11px;font-weight:900;-webkit-text-stroke:1px #fff;letter-spacing:2px">OUTLINE</span></div>',
    stack:      '<div style="background:linear-gradient(135deg,#0a0018,#100028);width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px"><span style="color:#7c5cfc;font-size:7px;font-weight:800">WORD</span><span style="color:#f5c842;font-size:9px;font-weight:800">STACK</span></div>'
  };

  STYLES.forEach(function(s, si){
    var btn = document.createElement('button');
    btn.className = 'cap-style-btn' + (si === 0 ? ' active-style' : '');
    btn.innerHTML =
      '<div class="csb-preview">' + (MINI[s.id]||'') + '</div>'
      + '<div class="csb-info"><div class="csb-name">' + s.name + '</div><div class="csb-tag">' + s.tags.join(' · ') + '</div></div>';
    btn.onclick = function(){
      activeStyle = s;
      document.querySelectorAll('.cap-style-btn').forEach(function(x){ x.classList.remove('active-style'); });
      btn.classList.add('active-style');
      document.getElementById('styleBadge').textContent = s.name;
      document.getElementById('expStyle').textContent   = s.name;
      if(!isPlaying) drawFrame();
      toast(s.name + ' style applied');
    };
    list.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD WORD ANIM GRID
// ─────────────────────────────────────────────────────────────────
function buildWordAnimGrid(){
  var grid = document.getElementById('wordAnimGrid');
  if(!grid) return;
  grid.innerHTML = '';
  WORD_ANIMS.forEach(function(wa, i){
    var btn = document.createElement('button');
    btn.className = 'wa-btn' + (i === 0 ? ' active-wa' : '');
    btn.innerHTML = '<div class="wa-name">' + wa.name + '</div><div class="wa-desc">' + wa.desc + '</div>';
    btn.onclick = function(){
      activeWordAnim = i === 0 ? null : wa;
      document.querySelectorAll('.wa-btn').forEach(function(b){ b.classList.remove('active-wa'); });
      btn.classList.add('active-wa');
      toast('Word effect: ' + wa.name);
      if(!isPlaying) drawFrame();
    };
    grid.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD FX GRID
// ─────────────────────────────────────────────────────────────────
function buildFXGrid(){
  var grid = document.getElementById('fxGrid');
  if(!grid) return;
  grid.innerHTML = '';
  FX_PRESETS.forEach(function(fx, i){
    var btn = document.createElement('div');
    btn.className = 'fx-btn' + (i === 0 ? ' active-fx' : '');
    btn.style.background = fx.bg;
    btn.textContent = fx.name;
    btn.onclick = function(){
      activeFX = i === 0 ? null : fx;
      customFilter = '';
      document.querySelectorAll('.fx-btn').forEach(function(b){ b.classList.remove('active-fx'); });
      btn.classList.add('active-fx');
      if(!isPlaying) drawFrame();
      toast('Filter: ' + fx.name);
    };
    grid.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD TRANSITION GRID
// ─────────────────────────────────────────────────────────────────
function buildTransitionGrid(){
  var grid = document.getElementById('transGrid');
  if(!grid) return;
  grid.innerHTML = '';
  TRANSITIONS.forEach(function(tr, i){
    var btn = document.createElement('div');
    btn.className = 'tr-btn' + (i === 0 ? ' active-tr' : '');
    btn.innerHTML = '<div class="tr-icon">' + tr.icon + '</div><div>' + tr.name + '</div>';
    btn.onclick = function(){
      activeTransition = tr.id;
      document.querySelectorAll('.tr-btn').forEach(function(b){ b.classList.remove('active-tr'); });
      btn.classList.add('active-tr');
      toast('Transition: ' + tr.name);
    };
    grid.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD MOTION BTNS
// ─────────────────────────────────────────────────────────────────
function buildMotionBtns(){
  var wrap = document.getElementById('motionBtns');
  if(!wrap) return;
  wrap.innerHTML = '';
  MOTION_OPTS.forEach(function(m, i){
    var btn = document.createElement('button');
    btn.className = 'mot-btn' + (i === 0 ? ' active-mot' : '');
    btn.textContent = m.name;
    btn.onclick = function(){
      activeMotion = m.id;
      document.querySelectorAll('.mot-btn').forEach(function(b){ b.classList.remove('active-mot'); });
      btn.classList.add('active-mot');
      toast('Motion: ' + m.name);
    };
    wrap.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD GRADE GRID
// ─────────────────────────────────────────────────────────────────
function buildGradeGrid(){
  var grid = document.getElementById('gradeGrid');
  if(!grid) return;
  grid.innerHTML = '';
  GRADES.forEach(function(g, gi){
    var btn = document.createElement('div');
    btn.className = 'grade-btn' + (gi === 0 ? ' active-grade' : '');
    btn.style.background = g.bg;
    btn.textContent = g.name;
    btn.onclick = function(){
      activeGrade = g; customFilter = '';
      resetGradeSliders();
      document.querySelectorAll('.grade-btn').forEach(function(b){ b.classList.remove('active-grade'); });
      btn.classList.add('active-grade');
      if(!isPlaying) drawFrame();
      toast('Grade: ' + g.name);
    };
    grid.appendChild(btn);
  });
}

function resetGradeSliders(){
  ['slBright','slContrast','slSat'].forEach(function(id){
    var el = document.getElementById(id); if(el) el.value = 100;
  });
  var sw = document.getElementById('slWarm'); if(sw) sw.value = 0;
  var ss = document.getElementById('slSharp'); if(ss) ss.value = 100;
  document.getElementById('slBrightVal').textContent = '100';
  document.getElementById('slContrastVal').textContent = '100';
  document.getElementById('slSatVal').textContent = '100';
  document.getElementById('slWarmVal').textContent = '0';
  if(document.getElementById('slSharpVal')) document.getElementById('slSharpVal').textContent = '100';
}

// ─────────────────────────────────────────────────────────────────
// BUILD FONT / COLOR / TEXT ANIM
// ─────────────────────────────────────────────────────────────────
function buildFontGrid(){
  var grid = document.getElementById('fontGrid');
  if(!grid) return;
  grid.innerHTML = '';
  FONTS.forEach(function(f, i){
    var btn = document.createElement('div');
    btn.className = 'font-btn' + (i === 0 ? ' active-font' : '');
    btn.style.fontFamily = f.family;
    btn.style.fontWeight = f.weight;
    btn.textContent = f.label;
    btn.onclick = function(){
      overlayFontId = f.id;
      document.querySelectorAll('.font-btn').forEach(function(b){ b.classList.remove('active-font'); });
      btn.classList.add('active-font');
      if(!isPlaying) drawFrame();
    };
    grid.appendChild(btn);
  });
}

function buildColorStrip(){
  var strip = document.getElementById('colorStrip');
  if(!strip) return;
  strip.innerHTML = '';
  COLORS.forEach(function(c, i){
    var dot = document.createElement('div');
    dot.className = 'col-dot' + (i === 0 ? ' active-col' : '');
    dot.style.background = c;
    if(c === '#000000') dot.style.border = '2px solid rgba(255,255,255,0.2)';
    dot.onclick = function(){
      overlayColor = c;
      document.querySelectorAll('.col-dot').forEach(function(d){ d.classList.remove('active-col'); });
      dot.classList.add('active-col');
      if(!isPlaying) drawFrame();
    };
    strip.appendChild(dot);
  });
}

function buildTxtAnims(){
  var row = document.getElementById('txtAnimRow');
  if(!row) return;
  row.innerHTML = '';
  TEXT_ANIMS.forEach(function(ta, i){
    var btn = document.createElement('button');
    btn.className = 'ta-btn' + (i === 0 ? ' active-ta' : '');
    btn.textContent = ta.label;
    btn.onclick = function(){
      overlayAnim = ta.id;
      document.querySelectorAll('.ta-btn').forEach(function(b){ b.classList.remove('active-ta'); });
      btn.classList.add('active-ta');
    };
    row.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD MUSIC LIST
// ─────────────────────────────────────────────────────────────────
function buildMusicList(){
  var list = document.getElementById('musicList');
  if(!list) return;
  list.innerHTML = '';
  FREE_TRACKS.forEach(function(t){
    var item = document.createElement('div');
    item.className = 'music-item';
    item.innerHTML =
      '<div class="mi-icon">' + t.icon + '</div>'
      + '<div class="mi-info"><div class="mi-name">' + t.name + '</div><div class="mi-meta">' + t.vibe + '</div></div>'
      + '<div class="mi-bars"><div class="mi-bar" style="height:4px"></div><div class="mi-bar" style="height:9px"></div><div class="mi-bar" style="height:5px"></div></div>';
    item.onclick = function(){
      if(activeMusicUrl === t.url){ stopMusic(); item.classList.remove('playing'); }
      else { playMusic(t.url, item); }
    };
    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────────────
// FILE HANDLING
// ─────────────────────────────────────────────────────────────────
document.getElementById('fileIn').onchange = function(e){ loadFile(e.target.files[0]); };
(function(){
  var dz = document.getElementById('dropZone'), inner = document.getElementById('dzInner');
  ['dragover','dragenter'].forEach(function(ev){ dz.addEventListener(ev, function(e){ e.preventDefault(); inner.classList.add('drag'); }); });
  ['dragleave','dragend'].forEach(function(ev){ dz.addEventListener(ev, function(){ inner.classList.remove('drag'); }); });
  dz.addEventListener('drop', function(e){
    e.preventDefault(); inner.classList.remove('drag');
    var f = Array.from(e.dataTransfer.files).find(function(x){ return x.type.startsWith('video/') || x.type.startsWith('image/'); });
    if(f) loadFile(f);
  });
})();

function loadFile(f){
  if(!f) return;
  if(clip) URL.revokeObjectURL(clip.url);
  fileType = f.type.startsWith('image/') ? 'image' : 'video';
  clip = { file: f, url: URL.createObjectURL(f) };
  var fc = document.getElementById('fileChip');
  fc.innerHTML = '<span class="fc-icon">' + (fileType==='image'?'🖼':'🎬') + '</span><span class="fc-name">' + f.name + '</span>';
  if(fileType === 'video'){
    vid.src = clip.url;
    vid.onloadedmetadata = function(){
      fc.innerHTML = '<span class="fc-icon">🎬</span><span class="fc-name">' + f.name + ' · ' + ft(vid.duration) + '</span>';
    };
  }
  goTo('sStyle');
}

// ─────────────────────────────────────────────────────────────────
// ASSEMBLYAI PIPELINE
// ─────────────────────────────────────────────────────────────────
function processWithAssemblyAI(){
  if(!clip){ toast('No file loaded'); return; }
  if(fileType === 'image'){
    // Images don't need transcription — go straight to preview
    buildCaptions([]);
    setTimeout(launchPreview, 400);
    return;
  }
  goTo('sProcess');
  stepProgress(2);
  setStatus('🎙','Uploading…','Sending your video to AI…', 10);
  var reader = new FileReader();
  reader.onload = function(e){
    fetch(ASSEMBLY_UPLOAD, {
      method: 'POST',
      headers: { 'authorization': ASSEMBLY_KEY, 'content-type': 'application/octet-stream' },
      body: e.target.result
    })
    .then(function(r){ if(!r.ok) throw new Error('Upload failed: '+r.status); return r.json(); })
    .then(function(data){
      var uploadUrl = data.upload_url || data.uploadUrl;
      if(!uploadUrl) throw new Error('No upload URL');
      stepProgress(3);
      setStatus('🔬','Transcribing speech…','AI is reading every word…', 30);
      submitTranscript(uploadUrl);
    })
    .catch(function(err){ setStatus('❌','Upload failed', err.message, 0); toast('Error: '+err.message); });
  };
  reader.readAsArrayBuffer(clip.file);
}

function submitTranscript(audioUrl){
  fetch(ASSEMBLY_SUBMIT, {
    method: 'POST',
    headers: { 'authorization': ASSEMBLY_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ audio_url: audioUrl, speech_models: ['universal-2'] })
  })
  .then(function(r){ if(!r.ok) return r.json().then(function(e){ throw new Error('Transcript failed: '+(e.error||r.status)); }); return r.json(); })
  .then(function(data){
    if(!data.id) throw new Error('No transcript ID');
    transcriptId = data.id;
    stepProgress(4);
    setStatus('🎙','Processing speech…','Word-perfect sync in progress…', 45);
    pollTranscript();
  })
  .catch(function(err){ setStatus('❌','Error', err.message, 0); toast('Error: '+err.message); });
}

function pollTranscript(){
  if(pollTimer) clearTimeout(pollTimer);
  fetch(ASSEMBLY_SUBMIT + '/' + transcriptId, { headers: { 'authorization': ASSEMBLY_KEY } })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(data.status === 'completed'){
      stepProgress(5);
      setStatus('✅','Done!', '"' + (data.text||'').substring(0,60) + (data.text&&data.text.length>60?'…':'"'), 100);
      buildCaptions(data.words || []);
      setTimeout(launchPreview, 600);
    } else if(data.status === 'error'){
      setStatus('❌','Error', data.error||'Unknown error', 0);
    } else {
      document.getElementById('progFill').style.width = (data.status==='processing' ? 68 : 50) + '%';
      document.getElementById('procDesc').textContent = 'Status: ' + data.status + '…';
      pollTimer = setTimeout(pollTranscript, 2500);
    }
  })
  .catch(function(){ pollTimer = setTimeout(pollTranscript, 3000); });
}

function stepProgress(step){
  for(var i=1; i<=5; i++){
    var el = document.getElementById('ps'+i);
    if(!el) continue;
    el.classList.remove('ps-active','ps-done');
    if(i < step) el.classList.add('ps-done');
    else if(i === step) el.classList.add('ps-active');
  }
}

// ─────────────────────────────────────────────────────────────────
// BUILD CAPTIONS
// ─────────────────────────────────────────────────────────────────
function buildCaptions(wordData){
  allWords = []; sentences = [];
  if(!wordData || !wordData.length) return;
  allWords = wordData.map(function(w){
    return { w: w.text, t: w.start/1000, end: w.end/1000 };
  });
  var cur = [];
  var STOP_WORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','was','are','were','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','what','which','who','when','where','how','why','if','then','so','just','also','not','no']);
  allWords.forEach(function(word, wi){
    cur.push(word);
    var next   = allWords[wi+1];
    var isGap  = next && (next.t - word.end) > 0.45;
    var isLong = cur.length >= 6;
    var isLast = wi === allWords.length - 1;
    if(isGap || isLong || isLast){
      sentences.push({ t: cur[0].t, end: cur[cur.length-1].end, words: cur.slice() });
      cur = [];
    }
  });
}

// ─────────────────────────────────────────────────────────────────
// LAUNCH PREVIEW
// ─────────────────────────────────────────────────────────────────
function launchPreview(){
  goTo('sPreview');
  cv.width = 540; cv.height = 960;

  buildCaptionList();
  buildWordAnimGrid();
  buildFXGrid();
  buildTransitionGrid();
  buildMotionBtns();
  buildGradeGrid();
  buildFontGrid();
  buildColorStrip();
  buildTxtAnims();
  buildMusicList();

  document.getElementById('expStyle').textContent  = activeStyle.name;
  document.getElementById('styleBadge').textContent = activeStyle.name;
  document.getElementById('expStats').innerHTML =
    allWords.length + ' words &nbsp;·&nbsp; ' + sentences.length + ' captions';

  if(fileType === 'video'){
    if(!vid.src) vid.src = clip.url;
    vid.pause(); vid.currentTime = 0;
    vid.ontimeupdate = syncTimeline;
    vid.onended = function(){
      isPlaying = false;
      updatePlayIcons(false);
      cancelAnimationFrame(rafId);
    };
  }
  drawFrame();
}

function syncTimeline(){
  var t = vid.currentTime, d = vid.duration || 1;
  var pct = t/d*100;
  document.getElementById('vbFill').style.width = pct + '%';
  document.getElementById('tlThumb').style.left = pct + '%';
  document.getElementById('vbTime').textContent = ft(t) + ' / ' + ft(d);
}

// ─────────────────────────────────────────────────────────────────
// DRAW FRAME  — the render engine
// ─────────────────────────────────────────────────────────────────
function drawFrame(){
  var W = cv.width, H = cv.height;
  if(gradeC.width!==W||gradeC.height!==H){ gradeC.width=W; gradeC.height=H; }
  cvCtx.clearRect(0,0,W,H);
  motionPhase += 0.004;

  if(fileType === 'video'){
    if(!vid.videoWidth){ if(isPlaying) rafId = requestAnimationFrame(drawFrame); return; }
    drawVideoFrame(W, H);
  } else {
    drawBlackFrame(W, H);
  }

  var now = fileType === 'video' ? vid.currentTime : 0;

  // Vignette
  var vigPct = vignetteVal;
  if(vigPct > 0){
    var vg = cvCtx.createRadialGradient(W/2,H*0.4,H*0.05, W/2,H/2,H*0.85);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,'+(vigPct/100*0.8)+')');
    cvCtx.fillStyle = vg; cvCtx.fillRect(0,0,W,H);
  }

  // Text overlay
  drawTextOverlay(cvCtx, W, H, now);

  // Captions
  if(sentences.length){
    var curSent = null;
    for(var i=0; i<sentences.length; i++){
      if(now >= sentences[i].t && now <= sentences[i].end + 0.4){ curSent=sentences[i]; break; }
    }
    if(curSent){
      activeStyle.render(cvCtx, W, H, { words: curSent.words, curTime: now });
    }
  } else if(fileType === 'image' && activeStyle){
    // Show demo text for images
    var demoWords = [
      {w:'Your', t:0, end:99},{w:'caption', t:0, end:99},{w:'here', t:0, end:99}
    ];
    activeStyle.render(cvCtx, W, H, { words: demoWords, curTime: 1.0 });
  }

  // Watermark
  cvCtx.save();
  cvCtx.font = '11px "DM Sans",sans-serif';
  cvCtx.fillStyle = 'rgba(255,255,255,0.1)';
  cvCtx.textAlign = 'right'; cvCtx.textBaseline = 'bottom';
  cvCtx.fillText('ImpactGrid', W-10, H-8);
  cvCtx.restore();

  if(isPlaying) rafId = requestAnimationFrame(drawFrame);
}

function drawVideoFrame(W, H){
  var vw=vid.videoWidth, vh=vid.videoHeight;
  var sc=Math.max(W/vw, H/vh), dw=vw*sc, dh=vh*sc;
  var ox=(W-dw)/2, oy=(H-dh)/2;

  // Motion effect
  if(activeMotion !== 'none'){
    var zoom = 1, dx=0, dy=0;
    if(activeMotion === 'slowzoom'){ zoom = 1 + 0.04*Math.sin(motionPhase*0.5); }
    if(activeMotion === 'shake'){   dx = Math.sin(motionPhase*7)*3; dy = Math.cos(motionPhase*5)*2; }
    if(activeMotion === 'drift'){   dx = Math.sin(motionPhase*0.3)*12; dy = Math.cos(motionPhase*0.2)*6; }
    if(activeMotion === 'pulse'){   zoom = 1 + 0.02*Math.sin(motionPhase*3); }
    dw*=zoom; dh*=zoom;
    ox = (W-dw)/2 + dx; oy = (H-dh)/2 + dy;
  }

  gradeX.clearRect(0,0,W,H);
  gradeX.filter = getCurrentFilter();
  gradeX.drawImage(vid, ox, oy, dw, dh);
  gradeX.filter = 'none';
  cvCtx.drawImage(gradeC, 0, 0);
}

function drawBlackFrame(W, H){
  cvCtx.fillStyle = '#000';
  cvCtx.fillRect(0, 0, W, H);
}

// ─────────────────────────────────────────────────────────────────
// COLOUR GRADE
// ─────────────────────────────────────────────────────────────────
function getCurrentFilter(){
  if(customFilter) return customFilter;
  if(activeFX && activeFX.filter !== 'none') return activeFX.filter;
  if(activeGrade && activeGrade.filter) return activeGrade.filter;
  return 'none';
}

function updateGrade(){
  var br = document.getElementById('slBright').value;
  var co = document.getElementById('slContrast').value;
  var sa = document.getElementById('slSat').value;
  var wa = parseInt(document.getElementById('slWarm').value);
  document.getElementById('slBrightVal').textContent  = br;
  document.getElementById('slContrastVal').textContent = co;
  document.getElementById('slSatVal').textContent     = sa;
  document.getElementById('slWarmVal').textContent    = wa;
  var vEl = document.getElementById('slVig');
  if(vEl){ vignetteVal = parseInt(vEl.value); document.getElementById('slVigVal').textContent = vEl.value; }
  customFilter = 'brightness('+br/100+') contrast('+co/100+') saturate('+sa/100+')' + (wa?(' hue-rotate('+wa+'deg)'):'');
  document.querySelectorAll('.grade-btn').forEach(function(b){ b.classList.remove('active-grade'); });
  if(!isPlaying) drawFrame();
}

// ─────────────────────────────────────────────────────────────────
// TEXT OVERLAY
// ─────────────────────────────────────────────────────────────────
function updateOverlayText(){
  var inp = document.getElementById('overlayText');
  overlayTextVal = inp ? inp.value.trim() : '';
  var sl = document.getElementById('slTxtSize');
  if(sl) document.getElementById('slTxtSizeVal').textContent = sl.value;
  if(!isPlaying) drawFrame();
}
function setTextPos(btn, which){
  var pos = btn.dataset.pos;
  if(which === 'overlay') overlayPos = pos;
  btn.closest('.pos-strip').querySelectorAll('.pos-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  if(!isPlaying) drawFrame();
}
function clearOverlayText(){
  overlayTextVal = '';
  var inp = document.getElementById('overlayText'); if(inp) inp.value = '';
  if(!isPlaying) drawFrame();
}

var overlayAnimStart = 0;
function drawTextOverlay(ctx, W, H, now){
  if(!overlayTextVal) return;
  var size    = parseInt(document.getElementById('slTxtSize').value) || 42;
  var font    = FONTS.find(function(f){ return f.id === overlayFontId; }) || FONTS[0];
  var y       = overlayPos==='top' ? H*0.1 : overlayPos==='bot' ? H*0.9 : H*0.5;
  var age     = now - overlayAnimStart;
  var alpha   = 1;

  // Animation
  var tx = W/2, ty = y, sc = 1;
  if(overlayAnim === 'fade'){   alpha = Math.min(age/0.5, 1); }
  if(overlayAnim === 'rise'){   ty = y + Math.max(0, (0.4-age)/0.4*40); alpha = Math.min(age/0.3,1); }
  if(overlayAnim === 'pop'){    sc = age<0.2 ? 1+(0.2-age)/0.2*0.5 : 1; }
  if(overlayAnim === 'typewrite'){
    var chars = Math.floor(age*22);
    overlayTextVal = (document.getElementById('overlayText').value||'').substring(0, chars);
  }

  ctx.save();
  ctx.globalAlpha = Math.min(alpha, 1);
  ctx.translate(tx, ty); ctx.scale(sc, sc); ctx.translate(-tx, -ty);
  ctx.font = font.weight + ' ' + size + 'px ' + font.family;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 12;
  ctx.fillStyle = overlayColor;
  ctx.fillText(overlayTextVal, W/2, ty);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────
// CAPTION POSITION & SIZE
// ─────────────────────────────────────────────────────────────────
function setCaptionPos(btn){
  captionPos = btn.dataset.pos;
  btn.closest('.pos-strip').querySelectorAll('.pos-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');
  if(!isPlaying) drawFrame();
}
function updateCapSize(){
  capSize = parseInt(document.getElementById('slCapSize').value);
  document.getElementById('slCapSizeVal').textContent = capSize;
  if(!isPlaying) drawFrame();
}
function getCapY(H, lines){
  var lineH = capSize + 12;
  var totalH = lines * lineH;
  if(captionPos === 'top')  return H * 0.12 + totalH/2;
  if(captionPos === 'mid')  return H * 0.5;
  return H * 0.82 - totalH/2;
}

// ─────────────────────────────────────────────────────────────────
// WORD ANIMATION RENDERER
// ─────────────────────────────────────────────────────────────────
function applyWordAnim(ctx, W, H, word, age, baseX, baseY, baseSize, isNow){
  if(!activeWordAnim || !isNow) return false;
  var size = baseSize * 1.2;
  switch(activeWordAnim.id){
    case 'slam':
      var slamY = age<0.15 ? baseY - (1-age/0.15)*40 : baseY;
      ctx.save(); ctx.translate(baseX, slamY);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      ctx.fillStyle='#fff'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=10;
      ctx.fillText(word, 0, 0);
      ctx.restore(); return true;
    case 'pop':
      var sc = age<0.15 ? 1+(0.15-age)/0.15*1.2 : 1;
      ctx.save(); ctx.translate(baseX, baseY); ctx.scale(sc, sc);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      ctx.fillStyle='#fff'; ctx.fillText(word, 0, 0);
      ctx.restore(); return true;
    case 'glow':
      ctx.save(); ctx.translate(baseX, baseY);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      var gl = 8+Math.sin(age*10)*8;
      ctx.shadowColor='#7c5cfc'; ctx.shadowBlur=gl;
      ctx.fillStyle='#fff'; ctx.fillText(word, 0, 0);
      ctx.restore(); return true;
    case 'shake':
      var shx=(Math.random()-0.5)*8, shy=(Math.random()-0.5)*4;
      ctx.save(); ctx.translate(baseX+shx, baseY+shy);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      ctx.fillStyle='#fff'; ctx.fillText(word, 0, 0);
      ctx.restore(); return true;
    case 'stamp':
      ctx.save(); ctx.translate(baseX, baseY);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      var tw=ctx.measureText(word).width;
      ctx.fillStyle='#fff'; ctx.fillRect(-tw/2-14,-size/2-8,tw+28,size+16);
      ctx.fillStyle='#000'; ctx.fillText(word, 0, 2);
      ctx.fillStyle='#f97316'; ctx.fillRect(-tw/2-14,size/2+4,tw+28,4);
      ctx.restore(); return true;
    default: return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// 12 CAPTION RENDERERS
// ─────────────────────────────────────────────────────────────────

function renderFire(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=capSize, padX=12, padY=7;
  var lines=groupLines(d.words,4), lineH=size+padY*2+8;
  var startY = getCapY(H, lines.length) - (lines.length*lineH)/2;
  lines.forEach(function(line, li){
    ctx.font='700 '+size+'px "DM Sans",sans-serif';
    var totalW=line.reduce(function(a,w){ return a+ctx.measureText(w.w).width+padX*2+8; },0);
    var x=W/2-totalW/2, y=startY+li*lineH+lineH/2;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width, bW=ww+padX*2, bH=size+padY*2;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var isPast=now>wObj.end+0.2;
      var age=now-wObj.t;
      var slam=isNow&&age<0.15 ? 2-(age/0.15) : 1;
      if(isNow && applyWordAnim(ctx,W,H,wObj.w,age,x+bW/2,y,size,true)){x+=bW+8;return;}
      ctx.save(); ctx.translate(x+bW/2,y); ctx.scale(slam,slam);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(isNow){
        ctx.shadowColor='#f97316'; ctx.shadowBlur=22;
        ctx.fillStyle='#f97316'; rRect(ctx,-bW/2,-bH/2,bW,bH,7); ctx.fill();
        ctx.shadowBlur=0; ctx.fillStyle='#fff';
        ctx.font='800 '+size+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,0,1);
      } else if(isPast){
        ctx.globalAlpha=0.45; ctx.fillStyle='rgba(255,255,255,0.08)';
        rRect(ctx,-bW/2,-bH/2,bW,bH,7); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.7)'; ctx.font='700 '+size+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,0,1);
      } else {
        ctx.globalAlpha=0.18; ctx.fillStyle='#fff';
        ctx.font='700 '+size+'px "DM Sans",sans-serif'; ctx.fillText(wObj.w,0,1);
      }
      ctx.restore(); x+=bW+8;
    });
  });
}

function renderColourFlip(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=capSize;
  var lines=groupLines(d.words,4), lineH=size+14;
  var startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var isPast=now>wObj.end+0.2;
      var age=now-wObj.t;
      var base=wi%2===0?'#ffffff':'#f5c842';
      if(isNow && applyWordAnim(ctx,W,H,wObj.w,age,x+ww/2,lY,size,true)){x+=ww+10;return;}
      ctx.save();
      var fadeIn=age<0?0:Math.min(age/0.1,1);
      ctx.globalAlpha=fadeIn*(isPast?0.88:isNow?1:0.2);
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='800 '+size+'px "DM Sans",sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.95)'; ctx.shadowBlur=8;
      if(isNow){ ctx.shadowColor=base; ctx.shadowBlur=16; ctx.scale=1; }
      ctx.fillStyle=base; ctx.fillText(wObj.w.toUpperCase(),x,lY);
      ctx.restore(); x+=ww+10;
    });
  });
}

function renderCinematic(ctx, W, H, d){
  if(!d.words.length) return;
  // Letterbox
  var bh=Math.round(H*0.08);
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,bh); ctx.fillRect(0,H-bh,W,bh);
  var now=d.curTime, size=Math.max(14,capSize-4);
  var lines=groupLines(d.words,6), lineH=size+10;
  var startY=H*0.84;
  lines.forEach(function(line,li){
    ctx.font='400 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var age=now-wObj.t, alpha=age<0?0:Math.min(age/0.18,1);
      ctx.save(); ctx.globalAlpha=alpha*0.9;
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='400 '+size+'px "DM Sans",sans-serif';
      if(isNow){ ctx.shadowColor='#93c5fd'; ctx.shadowBlur=14; ctx.fillStyle='#93c5fd'; ctx.font='600 '+size+'px "DM Sans",sans-serif'; }
      else { ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6; ctx.fillStyle='rgba(255,255,255,0.9)'; }
      ctx.fillText(wObj.w,x,lY); ctx.restore(); x+=ww+8;
    });
  });
}

function renderHype(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime;
  var cur=d.words.find(function(w){ return now>=w.t&&now<=w.end+0.15; });
  if(!cur) return;
  var age=now-cur.t;
  if(age<0.06){ ctx.fillStyle='rgba(245,200,66,'+(0.5*(1-age/0.06))+')'; ctx.fillRect(0,0,W,H); }
  var size=Math.min(W*0.2,capSize*4);
  var sc=age<0.12?1+(0.12-age)/0.12*0.8:1;
  ctx.save();
  ctx.globalAlpha=Math.min(age/0.04,1);
  ctx.translate(W/2,H*0.46); ctx.scale(sc,sc);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+size+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
  ctx.lineWidth=Math.max(8,size*0.12); ctx.strokeStyle='rgba(0,0,0,0.95)'; ctx.lineJoin='round';
  ctx.strokeText(cur.w.toUpperCase(),0,0);
  ctx.fillStyle='#f5c842'; ctx.fillText(cur.w.toUpperCase(),0,0);
  ctx.restore();
  // Rest smaller
  var rest=d.words.filter(function(w){return w!==cur;}).map(function(w){return w.w;}).join(' ');
  if(rest && age>0.12){
    ctx.save(); ctx.globalAlpha=Math.min((age-0.12)/0.15,0.6);
    ctx.font='500 15px "DM Sans",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6; ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.fillText(rest,W/2,H*0.6); ctx.restore();
  }
}

function renderKaraoke(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=Math.max(16,capSize-2), barH=Math.max(56,capSize*3+16), barY=H-barH-8;
  var bg=ctx.createLinearGradient(0,barY,0,barY+barH);
  bg.addColorStop(0,'rgba(5,0,15,0.97)'); bg.addColorStop(1,'rgba(8,0,20,0.7)');
  ctx.fillStyle=bg; ctx.fillRect(0,barY,W,barH);
  var pulse=0.5+0.5*Math.sin(now*5);
  ctx.fillStyle='hsl('+(260+pulse*60)+',90%,65%)'; ctx.fillRect(0,barY,W,2);
  var lines=groupLines(d.words,5), lineH=barH/Math.max(lines.length,1);
  lines.forEach(function(line,li){
    ctx.font='700 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=barY+lineH*(li+0.5)+4;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.15, isPast=now>wObj.end+0.15;
      ctx.save(); ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='700 '+size+'px "DM Sans",sans-serif';
      if(isNow){ ctx.shadowColor='#f5c842'; ctx.shadowBlur=22; ctx.fillStyle='#f5c842'; ctx.fillText(wObj.w,x,lY); ctx.shadowBlur=9; ctx.fillText(wObj.w,x,lY); }
      else { ctx.globalAlpha=isPast?0.42:0.18; ctx.fillStyle='#c084fc'; ctx.fillText(wObj.w,x,lY); }
      ctx.restore(); x+=ww+10;
    });
  });
}

function renderSplit(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime;
  var cur=d.words.find(function(w){ return now>=w.t&&now<=w.end+0.12; });
  if(!cur) return;
  var age=now-cur.t, sc=age<0.14?1+(0.14-age)/0.14*0.5:1;
  var bigSize=Math.min(W*0.17,capSize*3.5);
  ctx.save(); ctx.translate(W/2,H*0.42); ctx.scale(sc,sc);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+bigSize+'px "Bebas Neue","Oswald","DM Sans",sans-serif';
  ctx.lineWidth=Math.max(6,bigSize*0.1); ctx.strokeStyle='rgba(0,0,0,0.9)'; ctx.lineJoin='round';
  ctx.strokeText(cur.w.toUpperCase(),0,0);
  var g=ctx.createLinearGradient(0,-bigSize/2,0,bigSize/2);
  g.addColorStop(0,'#fff'); g.addColorStop(1,'rgba(255,255,255,0.7)');
  ctx.fillStyle=g; ctx.fillText(cur.w.toUpperCase(),0,0); ctx.restore();
  var sentSize=Math.max(12,capSize-8);
  var sLines=groupLines(d.words,6);
  ctx.font='600 '+sentSize+'px "DM Sans",sans-serif';
  sLines.forEach(function(line,li){
    var x=W/2-measLineW(ctx,line)/2, lY=H*0.58+li*(sentSize+8);
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width, isCur=wObj===cur, isPast=now>wObj.end+0.1;
      ctx.save(); ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
      ctx.globalAlpha=isCur?1:isPast?0.4:0.2; ctx.fillStyle=isCur?'#fff':'#aaa';
      ctx.fillText(wObj.w,x,lY); ctx.restore(); x+=ww+7;
    });
  });
}

function renderTypewriter(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=capSize;
  var lines=groupLines(d.words,5), lineH=size+16;
  var startY=getCapY(H,lines.length), lastShown=null;
  lines.forEach(function(line,li){
    var visWords=line.filter(function(w){ return now>=w.t; });
    if(!visWords.length) return;
    ctx.font='700 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,visWords), x=W/2-lW/2, lY=startY+li*lineH;
    visWords.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width, isNow=now>=wObj.t&&now<=wObj.end+0.15;
      ctx.save(); ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='700 '+size+'px "DM Sans",sans-serif';
      ctx.shadowColor=isNow?'#4ade80':'rgba(0,0,0,0.9)'; ctx.shadowBlur=isNow?14:6;
      ctx.fillStyle=isNow?'#4ade80':'rgba(255,255,255,0.9)'; ctx.fillText(wObj.w,x,lY);
      ctx.restore();
      if(wi===visWords.length-1) lastShown={x:x+ww+5,y:lY};
      x+=ww+10;
    });
  });
  if(lastShown && Math.sin(now*8)>0){
    ctx.fillStyle='#4ade80'; ctx.fillRect(lastShown.x,lastShown.y-size/2,2.5,size);
  }
}

function renderBounce(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=capSize;
  var lines=groupLines(d.words,3), lineH=size+14;
  var startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+size+'px "DM Sans",sans-serif';
    var totalW=measLineW(ctx,line), x=W/2-totalW/2, y=startY+li*lineH;
    line.forEach(function(wObj,wi){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.18, isPast=now>wObj.end+0.18;
      var age=now-wObj.t;
      var bounce=isNow?Math.sin(age*20)*6:0;
      ctx.save(); ctx.translate(x+ww/2,y+bounce); ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font='800 '+size+'px "DM Sans",sans-serif';
      if(isNow){
        var hue=(now*100+wi*50)%360, col='hsl('+hue+',100%,68%)';
        ctx.shadowColor=col; ctx.shadowBlur=22; ctx.fillStyle=col; ctx.scale(1.12,1.12);
      } else { ctx.globalAlpha=isPast?0.52:0.2; ctx.fillStyle='#fff'; ctx.shadowBlur=5; ctx.shadowColor='rgba(0,0,0,0.9)'; }
      ctx.fillText(wObj.w.toUpperCase(),0,0); ctx.restore(); x+=ww+10;
    });
  });
}

function renderMinimal(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=Math.max(13,capSize-4);
  var lines=groupLines(d.words,6), lineH=size+12;
  var startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='300 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2, isPast=now>wObj.end+0.2;
      var age=now-wObj.t, alpha=age<0?0:Math.min(age/0.15,1);
      ctx.save(); ctx.globalAlpha=alpha*(isPast?0.7:isNow?1:0.15);
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font=(isNow?'500':'300')+' '+size+'px "DM Sans",sans-serif';
      ctx.fillStyle=isNow?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.75)';
      ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6;
      ctx.fillText(wObj.w.toUpperCase(),x,lY);
      if(isNow){
        ctx.fillStyle='rgba(255,255,255,0.5)';
        ctx.fillRect(x,lY+size*0.55,ww,1);
      }
      ctx.restore(); x+=ww+12;
    });
  });
}

function renderGlitch(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=capSize;
  var lines=groupLines(d.words,4), lineH=size+12;
  var startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='800 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var isPast=now>wObj.end+0.2;
      var age=now-wObj.t;
      var glitch=isNow&&age<0.3?Math.random()*10*(1-age/0.3):0;
      ctx.save(); ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='800 '+size+'px "DM Sans",sans-serif';
      if(isNow){
        ctx.save(); ctx.globalAlpha=0.65;
        ctx.fillStyle='#ff0044'; ctx.fillText(wObj.w.toUpperCase(),x-glitch,lY+glitch*0.4);
        ctx.fillStyle='#00e5ff'; ctx.fillText(wObj.w.toUpperCase(),x+glitch,lY-glitch*0.4);
        ctx.restore();
        ctx.fillStyle='#fff'; ctx.fillText(wObj.w.toUpperCase(),x,lY);
      } else {
        ctx.globalAlpha=isPast?0.6:0.18; ctx.fillStyle='#fff';
        ctx.fillText(wObj.w.toUpperCase(),x,lY);
      }
      ctx.restore(); x+=ww+10;
    });
  });
}

function renderOutline(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=capSize;
  var lines=groupLines(d.words,4), lineH=size+12;
  var startY=getCapY(H,lines.length);
  lines.forEach(function(line,li){
    ctx.font='900 '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line), x=W/2-lW/2, lY=startY+li*lineH;
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2, isPast=now>wObj.end+0.2;
      var age=now-wObj.t, alpha=age<0?0:Math.min(age/0.1,1);
      ctx.save(); ctx.globalAlpha=alpha*(isPast?0.7:1);
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='900 '+size+'px "DM Sans",sans-serif';
      ctx.lineWidth=2.5; ctx.lineJoin='round';
      if(isNow){
        ctx.strokeStyle='rgba(0,0,0,0.8)'; ctx.strokeText(wObj.w.toUpperCase(),x,lY);
        ctx.fillStyle='#fff'; ctx.fillText(wObj.w.toUpperCase(),x,lY);
      } else {
        ctx.strokeStyle=isPast?'rgba(255,255,255,0.4)':'rgba(255,255,255,0.15)';
        ctx.strokeText(wObj.w.toUpperCase(),x,lY);
      }
      ctx.restore(); x+=ww+10;
    });
  });
}

function renderStack(ctx, W, H, d){
  if(!d.words.length) return;
  var now=d.curTime, size=Math.max(14,capSize+2);
  var COLS=['#7c5cfc','#f5c842','#e879f9','#22d3ee','#f97316','#4ade80'];
  var shown=d.words.filter(function(w){ return now>=w.t-0.05 && now<=w.end+0.6; });
  if(!shown.length) return;
  var max=Math.min(shown.length,4), startY=getCapY(H,max), lineH=size+8;
  shown.slice(-max).forEach(function(wObj,i){
    var age=now-wObj.t, alpha=Math.min(age/0.1,1), col=COLS[i%COLS.length];
    var isNow=now>=wObj.t&&now<=wObj.end+0.1;
    ctx.save(); ctx.globalAlpha=alpha*(isNow?1:0.55);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='900 '+(isNow?size*1.2:size)+'px "DM Sans",sans-serif';
    ctx.shadowColor=col; ctx.shadowBlur=isNow?20:0;
    ctx.fillStyle=col; ctx.fillText(wObj.w.toUpperCase(),W/2,startY+i*lineH);
    ctx.restore();
  });
}

// ─────────────────────────────────────────────────────────────────
// AUDIO
// ─────────────────────────────────────────────────────────────────
function playMusic(url, itemEl){
  stopMusic(); activeMusicUrl = url;
  musicAudio = new Audio(url); musicAudio.volume = musicVolume; musicAudio.loop = true;
  musicAudio.play().catch(function(){});
  document.querySelectorAll('.music-item').forEach(function(m){ m.classList.remove('playing'); });
  if(itemEl) itemEl.classList.add('playing');
  toast('🎵 Playing music');
}
function stopMusic(){
  if(musicAudio){ musicAudio.pause(); musicAudio.src=''; musicAudio=null; }
  activeMusicUrl = null;
  document.querySelectorAll('.music-item').forEach(function(m){ m.classList.remove('playing'); });
}
function loadUserMusic(input){
  var f = input.files[0]; if(!f) return;
  var url = URL.createObjectURL(f);
  var ne = document.getElementById('userMusicName'); if(ne) ne.textContent = '♪ '+f.name;
  playMusic(url, null); toast('🎵 Loaded: '+f.name);
}
function updateMusicVol(){
  musicVolume = parseInt(document.getElementById('slMusicVol').value)/100;
  document.getElementById('slMusicVolVal').textContent = Math.round(musicVolume*100)+'%';
  if(musicAudio) musicAudio.volume = musicVolume;
}
function updateVoiceVol(){
  voiceVolume = parseInt(document.getElementById('slVoiceVol').value)/100;
  document.getElementById('slVoiceVolVal').textContent = Math.round(voiceVolume*100)+'%';
  vid.volume = voiceVolume;
}
function updateSpeed(){
  var v = parseInt(document.getElementById('slSpeed').value)/100;
  document.getElementById('slSpeedVal').textContent = v.toFixed(2).replace('.00','')+'×';
  vid.playbackRate = v;
}

// ─────────────────────────────────────────────────────────────────
// PLAYBACK
// ─────────────────────────────────────────────────────────────────
function togglePlay(){
  if(fileType !== 'video'){ toast('Image mode — no playback'); return; }
  if(!vid.src){ toast('Load a video first'); return; }
  if(vid.paused){
    vid.play(); isPlaying = true;
    updatePlayIcons(true);
    rafId = requestAnimationFrame(drawFrame);
  } else {
    vid.pause(); isPlaying = false;
    updatePlayIcons(false);
    cancelAnimationFrame(rafId); drawFrame();
  }
}
function updatePlayIcons(playing){
  var tl = document.getElementById('tlPlayIcon');
  var big = document.getElementById('bigPlay');
  var tap = document.getElementById('playTap');
  if(playing){
    if(tl) tl.innerHTML='<rect x="1" y="1" width="4" height="12" rx="1" fill="currentColor"/><rect x="7" y="1" width="4" height="12" rx="1" fill="currentColor"/>';
    if(big) big.innerHTML='<svg width="16" height="18" viewBox="0 0 16 18" fill="none"><rect x="1" y="1" width="5" height="16" rx="1.5" fill="white"/><rect x="10" y="1" width="5" height="16" rx="1.5" fill="white"/></svg>';
    if(tap) tap.classList.add('on');
  } else {
    if(tl) tl.innerHTML='<path d="M1 1L11 7L1 13V1Z" fill="currentColor"/>';
    if(big) big.innerHTML='<svg width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M2 1.5L18 11L2 20.5V1.5Z" fill="white"/></svg>';
    if(tap) tap.classList.remove('on');
  }
}
function seekClick(e){
  var r = e.currentTarget.getBoundingClientRect();
  var pct = (e.clientX - r.left) / r.width;
  vid.currentTime = pct * (vid.duration||0);
  if(!isPlaying) setTimeout(drawFrame, 40);
}

// ─────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────
function setFmt(btn){
  document.querySelectorAll('.fmt-card').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active'); exportFmt = btn.dataset.f;
  var rb = document.getElementById('resBadge');
  if(rb) rb.textContent = exportFmt==='reel'?'9:16':exportFmt==='youtube'?'16:9':'1:1';
}
function doExport(){
  if(!clip){ toast('No file loaded'); return; }
  if(exportFmt==='reel'){ cv.width=540; cv.height=960; }
  else if(exportFmt==='youtube'){ cv.width=1280; cv.height=720; }
  else { cv.width=720; cv.height=720; }
  var ep=document.getElementById('expProg'), bar=document.getElementById('epFill'), lbl=document.getElementById('epLbl');
  ep.style.display='block'; document.getElementById('dlBtn').disabled=true;
  if(fileType === 'image'){
    drawFrame();
    setTimeout(function(){
      cv.toBlob(function(blob){
        var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
        a.download='impactgrid_'+activeStyle.id+'_'+exportFmt+'.png';
        document.body.appendChild(a); a.click(); a.remove();
        bar.style.width='100%'; lbl.textContent='✓ Image saved!';
        document.getElementById('dlBtn').disabled=false; toast('✓ Image exported!');
        setTimeout(function(){ep.style.display='none';},3000);
      },'image/png');
    },200);
    return;
  }
  var stream = cv.captureStream(30);
  try{
    var ac=new(window.AudioContext||window.webkitAudioContext)();
    var src=ac.createMediaElementSource(vid), dest=ac.createMediaStreamDestination();
    src.connect(dest); src.connect(ac.destination);
    dest.stream.getAudioTracks().forEach(function(t){stream.addTrack(t);});
  } catch(e){}
  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm']
    .find(function(m){return MediaRecorder.isTypeSupported(m);})||'video/webm';
  var chunks=[], rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:6000000});
  rec.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
  rec.onstop=function(){
    var blob=new Blob(chunks,{type:mime}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='impactgrid_'+activeStyle.id+'_'+exportFmt+'.webm';
    document.body.appendChild(a); a.click(); a.remove();
    bar.style.width='100%'; lbl.textContent='✓ Download started!';
    document.getElementById('dlBtn').disabled=false; toast('✓ Video exported!');
    setTimeout(function(){ep.style.display='none';},4000);
  };
  vid.currentTime=0; isPlaying=true; vid.play(); rec.start(100);
  rafId=requestAnimationFrame(drawFrame);
  var dur=vid.duration*1000, t0=Date.now();
  var pi=setInterval(function(){
    var p=Math.min((Date.now()-t0)/dur*93,93);
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
function groupLines(wordArr, n){
  var lines=[], cur=[];
  wordArr.forEach(function(w){ cur.push(w); if(cur.length>=n){lines.push(cur.slice());cur=[];} });
  if(cur.length) lines.push(cur);
  return lines;
}
function measLineW(ctx, wordArr){
  return wordArr.reduce(function(a,w){ return a+ctx.measureText(w.w||w).width+10; }, 0);
}
function rRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  if(ctx.roundRect){ ctx.roundRect(x,y,w,h,r); }
  else {
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }
}
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); });
  var el = document.getElementById(id); if(el){ el.classList.add('active'); window.scrollTo(0,0); }
}
function ft(s){
  if(!s||isNaN(s)) return '0:00';
  var m=Math.floor(s/60), sec=Math.floor(s%60);
  return m+':'+(sec<10?'0':'')+sec;
}
function setStatus(icon, title, desc, pct){
  document.getElementById('procAnim').textContent = icon;
  document.getElementById('procTitle').textContent = title;
  document.getElementById('procDesc').textContent = desc;
  if(pct>=0) document.getElementById('progFill').style.width = pct+'%';
}
var _tt;
function toast(msg){
  var el=document.getElementById('toast');
  el.textContent=msg; el.className='toast show';
  clearTimeout(_tt); _tt=setTimeout(function(){ el.className='toast'; }, 4000);
}
