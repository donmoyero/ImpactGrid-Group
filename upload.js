// ================================================================
// ImpactGrid Creator Studio — AssemblyAI powered captions
// Word-perfect transcription with exact per-word timestamps
// ================================================================

// ─── PASTE YOUR ASSEMBLYAI KEY HERE ──────────────────────────────
var ASSEMBLY_KEY = '80e3b7c067bf4d68a16ad9e32efc9887';
// ─────────────────────────────────────────────────────────────────

var ASSEMBLY_UPLOAD = 'https://api.assemblyai.com/v2/upload';
var ASSEMBLY_SUBMIT = 'https://api.assemblyai.com/v2/transcript';

// ─────────────────────────────────────────────────────────────────
// CAPTION STYLES (same 6 as before — word-level render)
// ─────────────────────────────────────────────────────────────────
var STYLES = [
  {
    id:'viral', name:'Viral TikTok',
    desc:'Each word pops in with a bounce. Orange pills. Stops the scroll.',
    tags:['TikTok','Reels','Viral'],
    gradient:'linear-gradient(150deg,#2a0800,#0d0300)',
    grade:'brightness(1.1) saturate(1.4) contrast(1.06)',
    tint:'rgba(255,50,0,0.10)', tintMode:'soft-light',
    vignette:0.55, letterbox:false, grain:false, accent:'#ff5c1a',
    render: function(ctx,W,H,d){ renderWordPop(ctx,W,H,d,'#ff5c1a','#fff'); }
  },
  {
    id:'cinematic', name:'Cinematic',
    desc:'Words fade in one by one. Cool grade, letterbox bars.',
    tags:['Film','YouTube','Story'],
    gradient:'linear-gradient(150deg,#000814,#001233)',
    grade:'brightness(0.86) saturate(0.72) contrast(1.05)',
    tint:'rgba(0,30,120,0.20)', tintMode:'soft-light',
    vignette:0.82, letterbox:true, grain:false, accent:'#90caf9',
    render: function(ctx,W,H,d){ renderFadeWords(ctx,W,H,d,'#90caf9'); }
  },
  {
    id:'hype', name:'Hype / Sports',
    desc:'One massive word dead centre. Slams in with a flash.',
    tags:['Sports','Hype','Launch'],
    gradient:'linear-gradient(150deg,#1a1000,#080600)',
    grade:'brightness(1.14) saturate(1.5) contrast(1.12)',
    tint:'rgba(240,180,0,0.12)', tintMode:'soft-light',
    vignette:0.42, letterbox:false, grain:false, accent:'#f0c93a',
    render: function(ctx,W,H,d){ renderHuge(ctx,W,H,d,'#f0c93a'); }
  },
  {
    id:'podcast', name:'Podcast / Talk',
    desc:'Karaoke bar — each word lights up gold as it\'s spoken.',
    tags:['Podcast','Talk','Interview'],
    gradient:'linear-gradient(150deg,#0d0d1a,#16102a)',
    grade:'brightness(0.96) saturate(0.88)',
    tint:'rgba(80,40,200,0.13)', tintMode:'soft-light',
    vignette:0.44, letterbox:false, grain:false, accent:'#f0c93a',
    render: function(ctx,W,H,d){ renderKaraoke(ctx,W,H,d,'#f0c93a'); }
  },
  {
    id:'neon', name:'Neon Glow',
    desc:'Words glow purple/pink. Dramatic words explode in cyan.',
    tags:['Night','Club','Energy'],
    gradient:'linear-gradient(150deg,#050010,#100020)',
    grade:'brightness(0.82) saturate(0.60) contrast(1.1)',
    tint:'rgba(120,0,200,0.18)', tintMode:'soft-light',
    vignette:0.72, letterbox:false, grain:false, accent:'#e040fb',
    render: function(ctx,W,H,d){ renderNeon(ctx,W,H,d); }
  },
  {
    id:'split', name:'Bold Split',
    desc:'Current word HUGE centre. Full sentence small below.',
    tags:['Drama','Impact','Story'],
    gradient:'linear-gradient(150deg,#0a0a0a,#050505)',
    grade:'brightness(0.92) saturate(1.1) contrast(1.08)',
    tint:'rgba(255,255,255,0.04)', tintMode:'soft-light',
    vignette:0.65, letterbox:false, grain:false, accent:'#ffffff',
    render: function(ctx,W,H,d){ renderSplit(ctx,W,H,d); }
  }
];

// ─────────────────────────────────────────────────────────────────
// 6 CAPTION RENDERERS
// All receive: ctx, W, H, d={words, curTime, dramatic}
// words = [{w, t (ms→s), end (ms→s)}]
// ─────────────────────────────────────────────────────────────────

// 1. VIRAL — orange pill bounce
function renderWordPop(ctx,W,H,d,activeColor,textColor){
  if(!d.words.length) return;
  var now=d.curTime, size=d.dramatic?28:22, padX=12, padY=7;
  var lineH=size+padY*2+6;
  var lines=groupLines(d.words,3);
  var startY=H*0.82-(lines.length*lineH)/2;

  lines.forEach(function(line,li){
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var totalW=line.reduce(function(a,wObj){return a+ctx.measureText(wObj.w).width+padX*2+6;},0);
    var x=W/2-totalW/2;
    var y=startY+li*lineH+lineH/2;

    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var bW=ww+padX*2, bH=size+padY*2;
      var isNow=now>=wObj.t&&now<=wObj.end+0.18;
      var isPast=now>wObj.end+0.18;
      var age=now-wObj.t;
      var scale=isNow&&age<0.12?1+(0.12-age)/0.12*0.45:1;

      ctx.save();
      ctx.translate(x+bW/2,y);
      ctx.scale(scale,scale);
      ctx.textAlign='center'; ctx.textBaseline='middle';

      if(isNow){
        ctx.fillStyle=activeColor;
        rRect(ctx,-bW/2,-bH/2,bW,bH,7); ctx.fill();
        ctx.fillStyle=textColor;
        ctx.font='bold '+size+'px "DM Sans",sans-serif';
        ctx.fillText(wObj.w,0,1);
      } else if(isPast){
        ctx.globalAlpha=0.5;
        ctx.fillStyle='rgba(255,255,255,0.12)';
        rRect(ctx,-bW/2,-bH/2,bW,bH,7); ctx.fill();
        ctx.fillStyle='#fff';
        ctx.font='bold '+size+'px "DM Sans",sans-serif';
        ctx.fillText(wObj.w,0,1);
      } else {
        ctx.globalAlpha=0.25;
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        rRect(ctx,-bW/2,-bH/2,bW,bH,7); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,0.3)';
        ctx.font='bold '+size+'px "DM Sans",sans-serif';
        ctx.fillText(wObj.w,0,1);
      }
      ctx.restore();
      x+=bW+6;
    });
  });
}

// 2. CINEMATIC — fade-in per word
function renderFadeWords(ctx,W,H,d,accentColor){
  if(!d.words.length) return;
  var now=d.curTime, size=d.dramatic?20:17;
  var lines=groupLines(d.words,6);
  var lineH=size+10;
  var startY=H*0.87-(lines.length-1)*lineH/2;

  lines.forEach(function(line,li){
    ctx.font=(d.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line);
    var x=W/2-lW/2;
    var lY=startY+li*lineH;

    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.2;
      var age=now-wObj.t;
      var alpha=age<0?0:Math.min(age/0.2,1);

      ctx.save();
      ctx.globalAlpha=alpha;
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font=(d.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
      if(isNow){
        ctx.shadowColor=accentColor; ctx.shadowBlur=14;
        ctx.fillStyle=accentColor;
      } else {
        ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=7;
        ctx.fillStyle='#fff';
      }
      ctx.fillText(wObj.w,x,lY);
      ctx.restore();
      x+=ww+8;
    });
  });
}

// 3. HYPE — huge single word centre
function renderHuge(ctx,W,H,d,accentColor){
  if(!d.words.length) return;
  var now=d.curTime;
  var cur=d.words.find(function(w){return now>=w.t&&now<=w.end+0.12;});
  if(!cur) return;

  var age=now-cur.t;
  var scale=age<0.15?1+(0.15-age)/0.15*0.6:1;
  var alpha=Math.min(age/0.06,1);

  if(age<0.08){
    ctx.fillStyle='rgba(240,201,58,'+(0.35*(1-age/0.08))+')';
    ctx.fillRect(0,0,W,H);
  }

  var size=Math.min(W*0.17,80);
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.translate(W/2,H*0.46);
  ctx.scale(scale,scale);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+size+'px Anton,"DM Sans",sans-serif';
  ctx.lineWidth=14; ctx.strokeStyle='rgba(0,0,0,0.95)'; ctx.lineJoin='round';
  ctx.strokeText(cur.w.toUpperCase(),0,0);
  ctx.fillStyle=accentColor;
  ctx.fillText(cur.w.toUpperCase(),0,0);
  ctx.restore();

  // Rest of sentence small below
  var rest=d.words.filter(function(w){return w!==cur;}).map(function(w){return w.w;}).join(' ');
  if(rest&&age>0.1){
    ctx.save();
    ctx.globalAlpha=Math.min((age-0.1)/0.15,0.72);
    ctx.font='500 15px "DM Sans",sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=6;
    ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText(rest,W/2,H*0.58);
    ctx.restore();
  }
}

// 4. KARAOKE — glowing bar bottom
function renderKaraoke(ctx,W,H,d,accentColor){
  if(!d.words.length) return;
  var now=d.curTime, size=19, barH=60, barY=H*0.82;

  ctx.fillStyle='rgba(8,6,20,0.90)';
  ctx.fillRect(0,barY,W,barH);
  ctx.fillStyle=accentColor;
  ctx.fillRect(0,barY,W,2);

  var lines=groupLines(d.words,5);
  var lineH=barH/Math.max(lines.length,1);

  lines.forEach(function(line,li){
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line);
    var x=W/2-lW/2;
    var lY=barY+lineH*(li+0.5)+4;

    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.15;
      var isPast=now>wObj.end+0.15;

      ctx.save();
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='bold '+size+'px "DM Sans",sans-serif';
      if(isNow){
        ctx.shadowColor=accentColor; ctx.shadowBlur=18;
        ctx.fillStyle=accentColor;
        ctx.fillText(wObj.w,x,lY);
        ctx.shadowBlur=6;
        ctx.fillText(wObj.w,x,lY); // double for glow
      } else {
        ctx.globalAlpha=isPast?0.42:0.20;
        ctx.fillStyle='#fff';
        ctx.fillText(wObj.w,x,lY);
      }
      ctx.restore();
      x+=ww+10;
    });
  });
}

// 5. NEON GLOW
function renderNeon(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime, size=d.dramatic?25:20;
  var lines=groupLines(d.words,4);
  var lineH=size+14;
  var startY=H*0.81-(lines.length-1)*lineH/2;

  lines.forEach(function(line,li){
    ctx.font='bold '+size+'px "DM Sans",sans-serif';
    var lW=measLineW(ctx,line);
    var x=W/2-lW/2;
    var lY=startY+li*lineH;

    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isNow=now>=wObj.t&&now<=wObj.end+0.15;
      var isPast=now>wObj.end+0.15;
      var age=now-wObj.t;
      var alpha=age<0?0:Math.min(age/0.1,1);

      ctx.save();
      ctx.globalAlpha=Math.max(0,alpha);
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='bold '+size+'px "DM Sans",sans-serif';

      if(isNow){
        var col=d.dramatic?'#00e5ff':'#e040fb';
        ctx.shadowColor=col; ctx.shadowBlur=24;
        ctx.fillStyle=col; ctx.fillText(wObj.w,x,lY);
        ctx.shadowBlur=8;  ctx.fillText(wObj.w,x,lY);
      } else {
        ctx.globalAlpha*=(isPast?0.45:0.18);
        ctx.fillStyle='#c084fc';
        ctx.fillText(wObj.w,x,lY);
      }
      ctx.restore();
      x+=ww+10;
    });
  });
}

// 6. BOLD SPLIT — huge word + small sentence
function renderSplit(ctx,W,H,d){
  if(!d.words.length) return;
  var now=d.curTime;
  var cur=d.words.find(function(w){return now>=w.t&&now<=w.end+0.12;});
  if(!cur) return;

  var age=now-cur.t;
  var scale=age<0.14?1+(0.14-age)/0.14*0.5:1;
  var bigSize=Math.min(W*0.15,72);

  ctx.save();
  ctx.translate(W/2,H*0.43);
  ctx.scale(scale,scale);
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='900 '+bigSize+'px Syne,"DM Sans",sans-serif';
  ctx.lineWidth=10; ctx.strokeStyle='#000'; ctx.lineJoin='round';
  ctx.strokeText(cur.w.toUpperCase(),0,0);
  var g=ctx.createLinearGradient(0,-bigSize/2,0,bigSize/2);
  g.addColorStop(0,'#fff'); g.addColorStop(1,'rgba(255,255,255,0.7)');
  ctx.fillStyle=g;
  ctx.fillText(cur.w.toUpperCase(),0,0);
  ctx.restore();

  // Small sentence below
  var sentSize=13;
  ctx.font='600 '+sentSize+'px "DM Sans",sans-serif';
  var sLines=groupLines(d.words,6);
  sLines.forEach(function(line,li){
    var x=W/2-measLineW(ctx,line)/2;
    var lY=H*0.59+li*(sentSize+7);
    line.forEach(function(wObj){
      var ww=ctx.measureText(wObj.w).width;
      var isCur=wObj===cur, isPast=now>wObj.end+0.1;
      ctx.save();
      ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.font='600 '+sentSize+'px "DM Sans",sans-serif';
      ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=5;
      ctx.globalAlpha=isCur?1:isPast?0.42:0.22;
      ctx.fillStyle=isCur?'#fff':'#aaa';
      ctx.fillText(wObj.w,x,lY);
      ctx.restore();
      x+=ww+7;
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
var clip        = null;
var activeStyle = STYLES[0];
var allWords    = [];   // [{w, t (seconds), end (seconds), dramatic}]
var sentences   = [];   // [{t, end, words, dramatic}] — grouped for rendering
var isPlaying   = false;
var rafId       = null;
var exportFmt   = 'reel';
var transcriptId= null;
var pollTimer   = null;

var vid    = document.getElementById('masterVid');
var cv     = document.getElementById('cv');
var cvCtx  = cv.getContext('2d');
var gradeC = document.createElement('canvas');
var gradeX = gradeC.getContext('2d');

// ─────────────────────────────────────────────────────────────────
// BUILD STYLE CARDS
// ─────────────────────────────────────────────────────────────────
(function(){
  var grid=document.getElementById('styleGrid');
  var mini=document.getElementById('miniStyles');

  STYLES.forEach(function(s,si){
    var card=document.createElement('div');
    card.className='sc'+(si===0?' sel':'');

    // Demo preview per style
    var demos={
      viral:'<span style="background:#ff5c1a;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;margin:2px">YOUR</span><span style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;margin:2px">WORDS</span><span style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.4);padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;margin:2px">HERE</span>',
      cinematic:'<span style="color:#90caf9;font-size:13px;text-shadow:0 0 10px rgba(144,202,249,0.8)">YOUR</span> <span style="color:#fff;font-size:13px">WORDS</span> <span style="color:rgba(255,255,255,0.3);font-size:13px">HERE</span>',
      hype:'<span style="font-family:Anton,sans-serif;font-size:36px;color:#f0c93a;-webkit-text-stroke:2px #000;letter-spacing:3px">WORDS</span>',
      podcast:'<div style="background:rgba(8,6,20,0.9);padding:8px 16px;border-radius:6px;border-top:2px solid #f0c93a"><span style="color:rgba(255,255,255,0.3);font-size:12px;font-weight:700">YOUR </span><span style="color:#f0c93a;font-size:12px;font-weight:700;text-shadow:0 0 10px #f0c93a">WORDS </span><span style="color:rgba(255,255,255,0.18);font-size:12px;font-weight:700">HERE</span></div>',
      neon:'<span style="color:rgba(192,132,252,0.4);font-size:13px;font-weight:700">YOUR </span><span style="color:#e040fb;font-size:13px;font-weight:700;text-shadow:0 0 14px #e040fb,0 0 6px #e040fb">WORDS </span><span style="color:rgba(192,132,252,0.18);font-size:13px;font-weight:700">HERE</span>',
      split:'<div style="text-align:center"><div style="font-family:Syne,sans-serif;font-size:30px;font-weight:900;color:#fff;-webkit-text-stroke:1px #000">WORDS</div><div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:3px">your complete sentence here</div></div>'
    };

    card.innerHTML=
      '<div class="sc-demo" style="background:'+s.gradient+'">'+demos[s.id]+'<div class="sc-tick">✓</div></div>'
      +'<div class="sc-body"><div class="sc-name">'+s.name+'</div>'
      +'<div class="sc-desc">'+s.desc+'</div>'
      +'<div class="sc-tags">'+s.tags.map(function(t){return '<span class="sc-tag">'+t+'</span>';}).join('')+'</div>'
      +'</div>';

    card.onclick=function(){
      document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('sel');});
      card.classList.add('sel');
      activeStyle=s;
      setTimeout(function(){
        if(allWords.length) launchPreview(); // re-apply style instantly if already transcribed
        else processWithAssemblyAI();
      },200);
    };
    grid.appendChild(card);

    var b=document.createElement('button');
    b.className='mini-btn'+(si===0?' active-style':'');
    b.textContent=s.name;
    b.onclick=function(){
      activeStyle=s;
      document.querySelectorAll('.mini-btn').forEach(function(x){x.classList.remove('active-style');});
      b.classList.add('active-style');
      document.getElementById('expStyle').textContent=s.name;
      document.getElementById('styleBadge').textContent=s.name+' ✓';
      if(!isPlaying) drawFrame();
      toast('Style: '+s.name);
    };
    mini.appendChild(b);
  });
})();

// ─────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────
document.getElementById('fileIn').onchange=function(e){ loadFile(e.target.files[0]); };
(function(){
  var dz=document.getElementById('dropZone');
  var inner=dz.querySelector('.dz-inner');
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
  clip={file:f, url:URL.createObjectURL(f)};
  vid.src=clip.url;
  vid.onloadedmetadata=function(){
    document.getElementById('fileChip').textContent='🎬 '+f.name+' · '+ft(vid.duration);
  };
  goTo('sStyle');
}

// ─────────────────────────────────────────────────────────────────
// KEY CHECK + PROCESS
// ─────────────────────────────────────────────────────────────────
function checkKeyAndProcess(){
  var key = ASSEMBLY_KEY.trim();
  if(!key){
    // Show key input modal
    showKeyModal(function(k){
      ASSEMBLY_KEY = k;
      processWithAssemblyAI();
    });
  } else {
    processWithAssemblyAI();
  }
}

function showKeyModal(cb){
  var overlay=document.createElement('div');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML=
    '<div style="background:#141414;border:1px solid #2a2a2a;border-radius:16px;padding:32px;max-width:420px;width:90%;font-family:DM Sans,sans-serif">'
    +'<div style="font-family:Syne,sans-serif;font-weight:800;font-size:18px;margin-bottom:8px">Enter your AssemblyAI key</div>'
    +'<p style="font-size:13px;color:#888;margin-bottom:20px;line-height:1.6">'
    +'Get a free key at <a href="https://assemblyai.com" target="_blank" style="color:#ff5c1a">assemblyai.com</a> — 100 free hours/month, no credit card needed.</p>'
    +'<input id="keyInput" type="text" placeholder="Paste your API key here…" '
    +'style="width:100%;background:#0a0a0a;border:1px solid #2a2a2a;color:#f0ebe5;padding:12px 14px;border-radius:8px;font-size:13px;font-family:monospace;outline:none;margin-bottom:12px">'
    +'<button id="keySubmit" style="width:100%;background:#ff5c1a;color:#fff;border:none;padding:13px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;font-family:DM Sans,sans-serif">'
    +'Start Transcription →</button>'
    +'<div id="keyErr" style="color:#e03030;font-size:12px;margin-top:8px"></div>'
    +'</div>';
  document.body.appendChild(overlay);
  document.getElementById('keyInput').focus();
  document.getElementById('keySubmit').onclick=function(){
    var v=document.getElementById('keyInput').value.trim();
    if(!v){ document.getElementById('keyErr').textContent='Please paste your API key'; return; }
    document.body.removeChild(overlay);
    cb(v);
  };
}

// ─────────────────────────────────────────────────────────────────
// ASSEMBLYAI TRANSCRIPTION PIPELINE
// Step 1: Upload audio file → get upload_url
// Step 2: Submit transcript request → get transcript id
// Step 3: Poll until complete → get word-level timestamps
// ─────────────────────────────────────────────────────────────────
function processWithAssemblyAI(){
  if(!clip){ toast('No video loaded'); return; }
  goTo('sProcess');
  setStatus('⬆','Uploading audio…','Sending your video to AssemblyAI…', 8);

  // Read file as ArrayBuffer and upload
  var reader=new FileReader();
  reader.onload=function(e){
    fetch(ASSEMBLY_UPLOAD, {
      method:'POST',
      headers:{
        'authorization': ASSEMBLY_KEY,
        'content-type':  'application/octet-stream'
      },
      body: e.target.result
    })
    .then(function(r){
      if(!r.ok) throw new Error('Upload failed: '+r.status+' — check your API key');
      return r.json();
    })
    .then(function(data){
      log('✓ Uploaded successfully');
      setStatus('🔬','Transcribing…','AssemblyAI is analysing your audio…', 25);
      var uploadUrl = data.upload_url || data.uploadUrl;
      if(!uploadUrl) throw new Error('No upload URL returned — check API key');
      submitTranscript(uploadUrl);
    })
    .catch(function(err){
      setStatus('❌','Upload failed',err.message, 0);
      toast('Error: '+err.message);
    });
  };
  reader.readAsArrayBuffer(clip.file);
}

function submitTranscript(audioUrl){
  fetch(ASSEMBLY_SUBMIT, {
    method:'POST',
    headers:{
      'authorization':  ASSEMBLY_KEY,
      'content-type':   'application/json'
    },
    body: JSON.stringify({
      audio_url:     audioUrl,
      speech_model:  'universal-2'
    })
  })
  .then(function(r){
    if(!r.ok) return r.json().then(function(e){
      throw new Error('Transcript submit failed: '+r.status+' — '+(e.error||e.message||JSON.stringify(e)));
    });
    return r.json();
  })
  .then(function(data){
    if(!data.id) throw new Error('No transcript ID returned: '+JSON.stringify(data));
    transcriptId=data.id;
    log('✓ Transcription queued (ID: '+data.id+')');
    setStatus('🎙','Transcribing speech…','This takes 30–90 seconds — word-perfect accuracy…', 35);
    pollTranscript();
  })
  .catch(function(err){
    setStatus('❌','Submission failed',err.message,0);
    toast('Error: '+err.message);
  });
}

function pollTranscript(){
  if(pollTimer) clearTimeout(pollTimer);
  fetch(ASSEMBLY_SUBMIT+'/'+transcriptId, {
    headers:{'authorization': ASSEMBLY_KEY}
  })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(data.status==='completed'){
      log('✓ Transcription complete');
      log('✓ '+data.words.length+' words with timestamps');
      setStatus('✅','Done!','"'+data.text.substring(0,60)+(data.text.length>60?'…':'')+'"',100);
      buildCaptions(data.words, data.text);
      setTimeout(launchPreview, 800);

    } else if(data.status==='error'){
      setStatus('❌','Transcription error', data.error||'Unknown error',0);
      toast('AssemblyAI error: '+data.error);

    } else {
      // Still processing — update progress
      var pct = data.status==='processing' ? 65 : 45;
      document.getElementById('progFill').style.width=pct+'%';
      document.getElementById('procDesc').textContent=
        'Status: '+data.status+' — hang tight…';
      pollTimer=setTimeout(pollTranscript, 2500);
    }
  })
  .catch(function(err){
    // Network blip — retry
    pollTimer=setTimeout(pollTranscript, 3000);
  });
}

// ─────────────────────────────────────────────────────────────────
// BUILD WORD + SENTENCE DATA FROM ASSEMBLYAI RESPONSE
// AssemblyAI returns: [{text, start (ms), end (ms), confidence}]
// ─────────────────────────────────────────────────────────────────
function buildCaptions(wordData, fullText){
  allWords=[];
  sentences=[];

  if(!wordData||!wordData.length){
    toast('No speech detected in video');
    return;
  }

  // Convert ms → seconds, build word objects
  allWords=wordData.map(function(w){
    return {
      w:       w.text,
      t:       w.start/1000,
      end:     w.end/1000,
      dramatic:isDramatic(w.text)
    };
  });

  // Group into sentences of ~5–8 words with pauses as breaks
  var cur=[], curStart=0;
  allWords.forEach(function(word, wi){
    cur.push(word);
    var nextWord=allWords[wi+1];
    var isGap   = nextWord && (nextWord.t - word.end) > 0.5; // 500ms pause = sentence break
    var isLong  = cur.length >= 7;
    var isLast  = wi===allWords.length-1;

    if(isGap || isLong || isLast){
      sentences.push({
        t:        cur[0].t,
        end:      cur[cur.length-1].end,
        words:    cur.slice(),
        dramatic: cur.some(function(w){return isDramatic(w.w);})
      });
      cur=[];
    }
  });

  log('✓ '+sentences.length+' caption blocks built');
}

// ─────────────────────────────────────────────────────────────────
// LAUNCH PREVIEW
// ─────────────────────────────────────────────────────────────────
function launchPreview(){
  goTo('sPreview');
  cv.width=540; cv.height=960;
  document.getElementById('expStyle').textContent   =activeStyle.name;
  document.getElementById('styleBadge').textContent =activeStyle.name+' ✓';
  document.getElementById('expStats').innerHTML     =
    allWords.length+' words timed &nbsp;·&nbsp; '
    +sentences.length+' captions &nbsp;·&nbsp; '+activeStyle.name;

  vid.pause(); vid.currentTime=0;
  vid.ontimeupdate=function(){
    var t=vid.currentTime,d=vid.duration||1;
    document.getElementById('vbFill').style.width=(t/d*100)+'%';
    document.getElementById('vbTime').textContent=ft(t)+' / '+ft(d);
  };
  vid.onended=function(){
    isPlaying=false;
    document.getElementById('vbPlay').textContent='▶';
    document.getElementById('bigPlay').textContent='▶';
    document.getElementById('playTap').classList.remove('on');
    cancelAnimationFrame(rafId);
  };
  drawFrame();
}

// ─────────────────────────────────────────────────────────────────
// CANVAS DRAW
// ─────────────────────────────────────────────────────────────────
function drawFrame(){
  if(!vid.videoWidth){ rafId=requestAnimationFrame(drawFrame); return; }
  var W=cv.width, H=cv.height, st=activeStyle;
  if(gradeC.width!==W||gradeC.height!==H){gradeC.width=W;gradeC.height=H;}

  cvCtx.clearRect(0,0,W,H);

  // 1. Video + grade
  var vw=vid.videoWidth,vh=vid.videoHeight;
  var sc=Math.max(W/vw,H/vh);
  var dw=vw*sc,dh=vh*sc;
  gradeX.clearRect(0,0,W,H);
  gradeX.filter=st.grade||'none';
  gradeX.drawImage(vid,(W-dw)/2,(H-dh)/2,dw,dh);
  gradeX.filter='none';
  cvCtx.drawImage(gradeC,0,0);

  // 2. Tint
  cvCtx.globalCompositeOperation=st.tintMode||'source-over';
  cvCtx.fillStyle=st.tint||'transparent';
  cvCtx.fillRect(0,0,W,H);
  cvCtx.globalCompositeOperation='source-over';

  // 3. Vignette
  if(st.vignette>0){
    var vg=cvCtx.createRadialGradient(W/2,H/2,H*0.12,W/2,H/2,H*0.88);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,'rgba(0,0,0,'+st.vignette+')');
    cvCtx.fillStyle=vg; cvCtx.fillRect(0,0,W,H);
  }

  // 4. Letterbox
  if(st.letterbox){
    var bh=Math.round(H*0.082);
    cvCtx.fillStyle='#000';
    cvCtx.fillRect(0,0,W,bh);
    cvCtx.fillRect(0,H-bh,W,bh);
  }

  // 5. Find + render current caption sentence
  var now=vid.currentTime;
  var curSent=null;
  for(var i=0;i<sentences.length;i++){
    if(now>=sentences[i].t&&now<=sentences[i].end+0.4){curSent=sentences[i];break;}
  }
  if(curSent){
    st.render(cvCtx,W,H,{
      words:    curSent.words,
      curTime:  now,
      dramatic: curSent.dramatic
    });
  }

  // 6. Watermark
  cvCtx.save();
  cvCtx.font='10px "DM Sans",sans-serif';
  cvCtx.fillStyle='rgba(255,255,255,0.15)';
  cvCtx.textAlign='right'; cvCtx.textBaseline='top';
  cvCtx.fillText('ImpactGrid',W-10,10);
  cvCtx.restore();

  if(isPlaying) rafId=requestAnimationFrame(drawFrame);
}

// ─────────────────────────────────────────────────────────────────
// PLAYBACK
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
// EXPORT
// ─────────────────────────────────────────────────────────────────
function setFmt(btn){
  document.querySelectorAll('.fmt').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active'); exportFmt=btn.dataset.f;
}

function doExport(){
  if(!vid.src){toast('No video loaded');return;}
  if(exportFmt==='reel')        {cv.width=540;  cv.height=960;}
  else if(exportFmt==='youtube'){cv.width=1280; cv.height=720;}
  else                          {cv.width=720;  cv.height=720;}

  var ep=document.getElementById('expProg');
  var bar=document.getElementById('epFill');
  var lbl=document.getElementById('epLbl');
  ep.style.display='block';
  document.getElementById('dlBtn').disabled=true;

  var stream=cv.captureStream(30);
  try{
    var ac=new(window.AudioContext||window.webkitAudioContext)();
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
    bar.style.width='100%'; lbl.textContent='✓ Download started!';
    document.getElementById('dlBtn').disabled=false;
    toast('✓ Exported successfully!');
    setTimeout(function(){ep.style.display='none';},4000);
    vid.onended=function(){
      isPlaying=false;
      document.getElementById('vbPlay').textContent='▶';
      document.getElementById('playTap').classList.remove('on');
      cancelAnimationFrame(rafId);
    };
  };

  vid.currentTime=0; isPlaying=true;
  vid.play(); rec.start(100);
  rafId=requestAnimationFrame(drawFrame);
  var dur=vid.duration*1000,t0=Date.now();
  var pi=setInterval(function(){
    var p=Math.min((Date.now()-t0)/dur*95,95);
    bar.style.width=p+'%'; lbl.textContent='Recording… '+Math.round(p)+'%';
  },300);
  vid.onended=function(){clearInterval(pi);isPlaying=false;rec.stop();};
}

// ─────────────────────────────────────────────────────────────────
// PROCESS SCREEN HELPERS
// ─────────────────────────────────────────────────────────────────
function setStatus(icon,title,desc,pct){
  document.getElementById('procAnim').textContent =icon;
  document.getElementById('procTitle').textContent=title;
  document.getElementById('procDesc').textContent =desc;
  if(pct>=0) document.getElementById('progFill').style.width=pct+'%';
}
function log(msg){
  var el=document.getElementById('procLog');
  if(el) el.innerHTML+='<div>'+msg+'</div>';
}

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
var DRAMATIC_WORDS=new Set(['amazing','incredible','huge','massive','love','hate','never','always',
  'breaking','best','worst','epic','shocking','first','secret','free','truth','only','biggest',
  'powerful','change','money','success','stop','watch','insane','crazy','unbelievable','launch',
  'new','live','now','today','wow','omg','seriously','literally','game','winner','real','fire']);

function isDramatic(text){
  if(!text) return false;
  if(/[!?]/.test(text)) return true;
  var l=text.toLowerCase();
  return Array.from(DRAMATIC_WORDS).some(function(w){return l===w;});
}

function groupLines(wordArr,n){
  var lines=[],cur=[];
  wordArr.forEach(function(w){ cur.push(w); if(cur.length>=n){lines.push(cur.slice());cur=[];} });
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
  var el=document.getElementById(id);
  if(el){el.classList.add('active');window.scrollTo(0,0);}
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
  clearTimeout(_tt); _tt=setTimeout(function(){el.className='toast';},5000);
}
