// ================================================================
// ImpactGrid Creator Studio
// 6 dramatic caption styles, no B-roll, word-perfect sync
// ================================================================

// ─────────────────────────────────────────────────────────────────
// CAPTION STYLES
// Each has: id, name, desc, tags, grade, vignette, letterbox, grain
// and a render(ctx, W, H, wordData, style) function
// wordData = {words:[{w,t,end}], curTime, text, dramatic}
// ─────────────────────────────────────────────────────────────────
var STYLES = [

  // 1. VIRAL — orange pills, each word pops in with bounce
  {
    id:'viral', name:'Viral TikTok',
    desc:'Each word pops in with a bounce. Orange pills on black. Stops the scroll.',
    tags:['TikTok','Reels','Viral'],
    gradient:'linear-gradient(150deg,#2a0800,#0d0300)',
    grade:'brightness(1.1) saturate(1.4) contrast(1.06)',
    tint:'rgba(255,50,0,0.10)', tintMode:'soft-light',
    vignette:0.55, letterbox:false, grain:false,
    accent:'#ff5c1a',
    render: function(ctx, W, H, d){
      if(!d.words.length) return;
      var now   = d.curTime;
      var size  = d.dramatic ? 28 : 22;
      var padX  = 12, padY = 7;
      var lineH = size + padY*2 + 6;
      // Group words into lines of max 3
      var lines = groupLines(d.words, 3);
      var totalH = lines.length * lineH;
      var startY = H*0.82 - totalH/2;

      lines.forEach(function(line, li){
        // measure line total width
        ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
        var lineW = line.reduce(function(a,w){ return a + ctx.measureText(w.w).width + padX*2 + 6; }, 0);
        var x = W/2 - lineW/2;
        var y = startY + li*lineH + lineH/2;

        line.forEach(function(wObj){
          var ww   = ctx.measureText(wObj.w).width;
          var boxW = ww + padX*2;
          var boxH = size + padY*2;
          // Is this word currently being spoken?
          var isNow  = (now >= wObj.t && now <= wObj.end + 0.15);
          var isPast = (now > wObj.end + 0.15);
          var isFut  = (!isNow && !isPast);

          // Pop-in scale animation
          var age   = now - wObj.t;
          var scale = (isNow && age < 0.12) ? 1 + (0.12-age)/0.12 * 0.4 : 1;

          ctx.save();
          ctx.translate(x + boxW/2, y);
          ctx.scale(scale, scale);
          ctx.textAlign    = 'center';
          ctx.textBaseline = 'middle';

          if(isNow){
            // Active: bright orange pill
            ctx.fillStyle = '#ff5c1a';
            rRect(ctx, -boxW/2, -boxH/2, boxW, boxH, 7);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
            ctx.fillText(wObj.w, 0, 1);
          } else if(isPast){
            // Past: white pill faded
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            rRect(ctx, -boxW/2, -boxH/2, boxW, boxH, 7);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
            ctx.fillText(wObj.w, 0, 1);
          } else {
            // Future: ghost outline
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth   = 1;
            rRect(ctx, -boxW/2, -boxH/2, boxW, boxH, 7);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
            ctx.fillText(wObj.w, 0, 1);
          }
          ctx.restore();
          x += boxW + 6;
        });
      });
    }
  },

  // 2. CINEMATIC — white subtitle, letterbox, elegant fade
  {
    id:'cinematic', name:'Cinematic',
    desc:'Letterbox bars, cool grade. Each word fades in individually.',
    tags:['Film','YouTube','Story'],
    gradient:'linear-gradient(150deg,#000814,#001233)',
    grade:'brightness(0.86) saturate(0.72) contrast(1.05)',
    tint:'rgba(0,30,120,0.20)', tintMode:'soft-light',
    vignette:0.82, letterbox:true, grain:false,
    accent:'#90caf9',
    render: function(ctx, W, H, d){
      if(!d.words.length) return;
      var now  = d.curTime;
      var size = d.dramatic ? 20 : 17;
      var y    = H*0.87;
      var lines = groupLines(d.words, 6);
      var lineH = size + 10;

      lines.forEach(function(line, li){
        ctx.font = (d.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
        var lY  = y + (li - (lines.length-1)/2)*lineH;
        var x   = W/2 - lineW(ctx, line)/2;

        line.forEach(function(wObj){
          var ww   = ctx.measureText(wObj.w).width;
          var isNow = now >= wObj.t && now <= wObj.end+0.2;
          var age   = now - wObj.t;
          var alpha = Math.min(age/0.18, 1);

          ctx.save();
          ctx.globalAlpha    = Math.max(0, alpha);
          ctx.shadowColor    = 'rgba(0,0,0,0.95)';
          ctx.shadowBlur     = 8;
          ctx.textAlign      = 'left';
          ctx.textBaseline   = 'middle';
          ctx.font = (d.dramatic?'bold ':'500 ')+size+'px "DM Sans",sans-serif';
          ctx.fillStyle = isNow ? '#90caf9' : '#ffffff';
          if(isNow){ ctx.shadowColor='#90caf9'; ctx.shadowBlur=12; }
          ctx.fillText(wObj.w, x, lY);
          ctx.restore();
          x += ww + 8;
        });
      });
    }
  },

  // 3. HYPE — HUGE single word centre screen, explosive
  {
    id:'hype', name:'Hype / Sports',
    desc:'One massive word at a time, dead centre. Flash on impact.',
    tags:['Sports','Hype','Launch'],
    gradient:'linear-gradient(150deg,#1a1000,#080600)',
    grade:'brightness(1.14) saturate(1.5) contrast(1.12)',
    tint:'rgba(240,180,0,0.12)', tintMode:'soft-light',
    vignette:0.42, letterbox:false, grain:false,
    accent:'#f0c93a',
    render: function(ctx, W, H, d){
      if(!d.words.length) return;
      var now = d.curTime;
      // Find current word
      var cur = null;
      for(var i=0;i<d.words.length;i++){
        if(now >= d.words[i].t && now <= d.words[i].end+0.1){ cur=d.words[i]; break; }
      }
      if(!cur) return;

      var age   = now - cur.t;
      var scale = age < 0.15 ? 1 + (0.15-age)/0.15*0.6 : 1;  // slam in
      var alpha = Math.min(age/0.06, 1);

      // Flash effect on new word
      if(age < 0.08){
        ctx.fillStyle = 'rgba(240,201,58,'+(0.3*(1-age/0.08))+')';
        ctx.fillRect(0,0,W,H);
      }

      var text = cur.w.toUpperCase();
      var size = Math.min(W*0.18, 82);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W/2, H*0.46);
      ctx.scale(scale, scale);
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';

      // Thick black outline
      ctx.font      = '900 '+size+'px Anton,"DM Sans",sans-serif';
      ctx.lineWidth = 14;
      ctx.strokeStyle='rgba(0,0,0,0.95)';
      ctx.lineJoin  = 'round';
      ctx.strokeText(text, 0, 0);

      // Gold fill
      ctx.fillStyle = '#f0c93a';
      ctx.fillText(text, 0, 0);
      ctx.restore();

      // Small context line below (rest of sentence)
      var rest = d.words.filter(function(w){ return w !== cur; }).map(function(w){ return w.w; }).join(' ');
      if(rest && age>0.12){
        ctx.save();
        ctx.globalAlpha  = Math.min((age-0.12)/0.15, 0.7);
        ctx.font         = '500 15px "DM Sans",sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur   = 6;
        ctx.fillStyle    = 'rgba(255,255,255,0.8)';
        ctx.fillText(rest, W/2, H*0.58);
        ctx.restore();
      }
    }
  },

  // 4. PODCAST — karaoke word highlight on a dark bar
  {
    id:'podcast', name:'Podcast / Talk',
    desc:'Karaoke-style — each word lights up gold as it\'s spoken.',
    tags:['Podcast','Talk','Interview'],
    gradient:'linear-gradient(150deg,#0d0d1a,#16102a)',
    grade:'brightness(0.96) saturate(0.88)',
    tint:'rgba(80,40,200,0.13)', tintMode:'soft-light',
    vignette:0.44, letterbox:false, grain:false,
    accent:'#f0c93a',
    render: function(ctx, W, H, d){
      if(!d.words.length) return;
      var now  = d.curTime;
      var size = 19;
      var barH = 58;
      var barY = H*0.82;

      // Dark bar background
      ctx.fillStyle = 'rgba(8,6,20,0.88)';
      ctx.fillRect(0, barY, W, barH);
      // Accent top line
      ctx.fillStyle = '#f0c93a';
      ctx.fillRect(0, barY, W, 2);

      var lines = groupLines(d.words, 5);
      var lineH = barH / Math.max(lines.length, 1);

      lines.forEach(function(line, li){
        ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
        var lW  = lineW(ctx, line);
        var x   = W/2 - lW/2;
        var lY  = barY + lineH*(li+0.5) + 4;

        line.forEach(function(wObj){
          var ww    = ctx.measureText(wObj.w).width;
          var isNow = now >= wObj.t && now <= wObj.end+0.15;
          var isPast= now > wObj.end+0.15;

          ctx.save();
          ctx.textAlign    = 'left';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold '+size+'px "DM Sans",sans-serif';

          if(isNow){
            // Gold glow
            ctx.shadowColor = '#f0c93a';
            ctx.shadowBlur  = 16;
            ctx.fillStyle   = '#f0c93a';
          } else if(isPast){
            ctx.globalAlpha = 0.45;
            ctx.fillStyle   = '#fff';
          } else {
            ctx.globalAlpha = 0.22;
            ctx.fillStyle   = '#fff';
          }
          ctx.fillText(wObj.w, x, lY);
          ctx.restore();
          x += ww + 10;
        });
      });
    }
  },

  // 5. NEON — glowing neon text on black, colour-coded by energy
  {
    id:'neon', name:'Neon Glow',
    desc:'Neon-lit words glow purple/pink. Dramatic words explode in cyan.',
    tags:['Night','Club','Energy'],
    gradient:'linear-gradient(150deg,#050010,#100020)',
    grade:'brightness(0.82) saturate(0.60) contrast(1.1)',
    tint:'rgba(120,0,200,0.18)', tintMode:'soft-light',
    vignette:0.72, letterbox:false, grain:false,
    accent:'#e040fb',
    render: function(ctx, W, H, d){
      if(!d.words.length) return;
      var now  = d.curTime;
      var size = d.dramatic ? 26 : 21;
      var lines= groupLines(d.words, 4);
      var lineH= size + 14;
      var startY = H*0.81 - (lines.length-1)*lineH/2;

      lines.forEach(function(line, li){
        ctx.font = 'bold '+size+'px "DM Sans",sans-serif';
        var lW  = lineW(ctx, line);
        var x   = W/2 - lW/2;
        var lY  = startY + li*lineH;

        line.forEach(function(wObj){
          var ww    = ctx.measureText(wObj.w).width;
          var isNow = now >= wObj.t && now <= wObj.end+0.15;
          var isPast= now > wObj.end+0.15;
          var age   = now - wObj.t;
          var alpha = Math.min(age/0.1, 1);

          ctx.save();
          ctx.globalAlpha  = Math.max(0, alpha);
          ctx.textAlign    = 'left';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold '+size+'px "DM Sans",sans-serif';

          if(isNow){
            var col = d.dramatic ? '#00e5ff' : '#e040fb';
            ctx.shadowColor = col;
            ctx.shadowBlur  = 24;
            ctx.fillStyle   = col;
            // Double-draw for extra glow
            ctx.fillText(wObj.w, x, lY);
            ctx.shadowBlur = 8;
            ctx.fillText(wObj.w, x, lY);
          } else if(isPast){
            ctx.globalAlpha *= 0.5;
            ctx.fillStyle   = '#c084fc';
            ctx.fillText(wObj.w, x, lY);
          } else {
            ctx.globalAlpha *= 0.2;
            ctx.fillStyle   = '#c084fc';
            ctx.fillText(wObj.w, x, lY);
          }
          ctx.restore();
          x += ww + 10;
        });
      });
    }
  },

  // 6. BOLD SPLIT — top half word big, bottom half context small
  {
    id:'split', name:'Bold Split',
    desc:'Current word HUGE top-centre. Full sentence small below. Very dramatic.',
    tags:['Drama','Story','Impact'],
    gradient:'linear-gradient(150deg,#0a0a0a,#050505)',
    grade:'brightness(0.92) saturate(1.1) contrast(1.08)',
    tint:'rgba(255,255,255,0.04)', tintMode:'soft-light',
    vignette:0.65, letterbox:false, grain:false,
    accent:'#ffffff',
    render: function(ctx, W, H, d){
      if(!d.words.length) return;
      var now = d.curTime;
      var cur = null;
      for(var i=0;i<d.words.length;i++){
        if(now >= d.words[i].t && now <= d.words[i].end+0.1){ cur=d.words[i]; break; }
      }
      if(!cur) return;

      var age   = now - cur.t;
      var scale = age < 0.14 ? 1 + (0.14-age)/0.14*0.5 : 1;

      // BIG current word
      var bigSize = Math.min(W*0.16, 74);
      ctx.save();
      ctx.translate(W/2, H*0.44);
      ctx.scale(scale, scale);
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.font         = '900 '+bigSize+'px Syne,"DM Sans",sans-serif';

      // Outline
      ctx.lineWidth   = 10;
      ctx.strokeStyle = '#000';
      ctx.lineJoin    = 'round';
      ctx.strokeText(cur.w.toUpperCase(), 0, 0);

      // White fill with subtle gradient
      var grad = ctx.createLinearGradient(0,-bigSize/2,0,bigSize/2);
      grad.addColorStop(0,'#ffffff');
      grad.addColorStop(1,'rgba(255,255,255,0.7)');
      ctx.fillStyle = grad;
      ctx.fillText(cur.w.toUpperCase(), 0, 0);
      ctx.restore();

      // Full sentence context below, each word styled by state
      var sentenceSize = 14;
      ctx.font = '600 '+sentenceSize+'px "DM Sans",sans-serif';
      var sW   = lineW(ctx, d.words);
      var maxW = W-48;
      var sLines = groupLines(d.words, 6);
      var sStartY = H*0.60;

      sLines.forEach(function(line, li){
        var x = W/2 - lineW(ctx, line)/2;
        var lY= sStartY + li*(sentenceSize+8);
        line.forEach(function(wObj){
          var ww    = ctx.measureText(wObj.w).width;
          var isNow = wObj === cur;
          var isPast= now > wObj.end+0.1;
          ctx.save();
          ctx.textAlign    = 'left';
          ctx.textBaseline = 'middle';
          ctx.font         = '600 '+sentenceSize+'px "DM Sans",sans-serif';
          ctx.shadowColor  = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur   = 5;
          ctx.globalAlpha  = isNow ? 1 : isPast ? 0.45 : 0.25;
          ctx.fillStyle    = isNow ? '#fff' : '#aaa';
          ctx.fillText(wObj.w, x, lY);
          ctx.restore();
          x += ww + 7;
        });
      });
    }
  }

];

// ─────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────
var clip        = null;
var activeStyle = STYLES[0];
var words       = [];     // [{w, t, end, dramatic}] — per-word timing
var sentences   = [];     // [{t, end, text, words, dramatic}]
var isListening = false;
var recog       = null;
var listenStart = 0;
var isPlaying   = false;
var rafId       = null;
var liveRafId   = null;
var exportFmt   = 'reel';

var vid      = document.getElementById('masterVid');
var cv       = document.getElementById('cv');
var cvCtx    = cv.getContext('2d');
var liveCV   = document.getElementById('liveCanvas');
var liveCTX  = liveCV ? liveCV.getContext('2d') : null;
var gradeC   = document.createElement('canvas');
var gradeX   = gradeC.getContext('2d');

// set up live canvas size
if(liveCV){ liveCV.width=200; liveCV.height=355; }

// ─────────────────────────────────────────────────────────────────
// BUILD STYLE CARDS
// ─────────────────────────────────────────────────────────────────
(function(){
  var grid = document.getElementById('styleGrid');
  var mini = document.getElementById('miniStyles');

  STYLES.forEach(function(s, si){
    var card = document.createElement('div');
    card.className = 'sc'+(si===0?' sel':'');

    // Build a little caption demo in the card
    var demoWords = ['YOUR','WORDS','HERE'];
    var demoHtml  = '';
    if(s.id==='viral'){
      demoHtml = demoWords.map(function(w,i){
        var bg = i===1?'#ff5c1a':'rgba(255,255,255,0.12)';
        var col= i===1?'#fff':'rgba(255,255,255,0.5)';
        return '<span style="background:'+bg+';color:'+col+';padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;margin:2px">'+w+'</span>';
      }).join('');
    } else if(s.id==='cinematic'){
      demoHtml = demoWords.map(function(w,i){
        var col=i===1?'#90caf9':'rgba(255,255,255,'+(i===0?'0.5':'0.25')+')';
        return '<span style="color:'+col+';font-size:13px;font-weight:500;margin:0 4px;text-shadow:0 0 8px rgba(0,0,0,0.9)">'+w+'</span>';
      }).join('');
    } else if(s.id==='hype'){
      demoHtml = '<span style="font-family:Anton,sans-serif;font-size:32px;color:#f0c93a;-webkit-text-stroke:2px #000;letter-spacing:2px">WORDS</span>';
    } else if(s.id==='podcast'){
      demoHtml = demoWords.map(function(w,i){
        var col=i===1?'#f0c93a':'rgba(255,255,255,'+(i===0?'0.4':'0.18')+')';
        var glow=i===1?'text-shadow:0 0 12px #f0c93a':'';
        return '<span style="color:'+col+';font-size:13px;font-weight:700;margin:0 4px;'+glow+'">'+w+'</span>';
      }).join('');
    } else if(s.id==='neon'){
      demoHtml = demoWords.map(function(w,i){
        var col=i===1?'#e040fb':'rgba(192,132,252,'+(i===0?'0.5':'0.2')+')';
        var glow=i===1?'text-shadow:0 0 14px #e040fb,0 0 6px #e040fb':'';
        return '<span style="color:'+col+';font-size:13px;font-weight:700;margin:0 4px;'+glow+'">'+w+'</span>';
      }).join('');
    } else if(s.id==='split'){
      demoHtml = '<div style="text-align:center"><div style="font-family:Syne,sans-serif;font-size:28px;font-weight:900;color:#fff;-webkit-text-stroke:1px #000">WORDS</div><div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px">your here</div></div>';
    }

    card.innerHTML =
      '<div class="sc-demo" style="background:'+s.gradient+'">'+demoHtml+'<div class="sc-tick">✓</div></div>'
      +'<div class="sc-body">'
        +'<div class="sc-name">'+s.name+'</div>'
        +'<div class="sc-desc">'+s.desc+'</div>'
        +'<div class="sc-tags">'+s.tags.map(function(t){return '<span class="sc-tag">'+t+'</span>';}).join('')+'</div>'
      +'</div>';

    card.onclick = function(){
      document.querySelectorAll('.sc').forEach(function(c){c.classList.remove('sel');});
      card.classList.add('sel');
      activeStyle = s;
      setTimeout(startListening, 250);
    };
    grid.appendChild(card);

    // Mini button
    var b = document.createElement('button');
    b.className   = 'mini-btn'+(si===0?' active-style':'');
    b.textContent = s.name;
    b.dataset.sid = s.id;
    b.onclick = function(){
      activeStyle = s;
      document.querySelectorAll('.mini-btn').forEach(function(x){x.classList.remove('active-style');});
      b.classList.add('active-style');
      document.getElementById('expStyle').textContent   = s.name;
      document.getElementById('styleBadge').textContent = s.name+' ✓';
      if(!isPlaying) drawFrame(cv, cvCtx);
      toast('Style: '+s.name);
    };
    mini.appendChild(b);
  });
})();

// ─────────────────────────────────────────────────────────────────
// UPLOAD
// ─────────────────────────────────────────────────────────────────
document.getElementById('fileIn').onchange = function(e){
  loadFile(e.target.files[0]);
};
(function(){
  var dz = document.getElementById('dropZone');
  var inner = dz.querySelector('.dz-inner');
  ['dragover','dragenter'].forEach(function(ev){
    dz.addEventListener(ev,function(e){ e.preventDefault(); inner.classList.add('drag'); });
  });
  ['dragleave','dragend'].forEach(function(ev){
    dz.addEventListener(ev,function(){ inner.classList.remove('drag'); });
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
  clip = {file:f, url:URL.createObjectURL(f)};
  vid.src = clip.url;
  vid.onloadedmetadata = function(){
    document.getElementById('fileChip').textContent = '🎬 '+f.name+' · '+ft(vid.duration);
  };
  goTo('sStyle');
}

// ─────────────────────────────────────────────────────────────────
// LISTENING PHASE — plays full video, captures word-by-word timing
// ─────────────────────────────────────────────────────────────────
function startListening(){
  words      = [];
  sentences  = [];
  isListening= false;
  if(recog) try{recog.abort();}catch(e){}

  goTo('sListen');
  var st = activeStyle;
  document.getElementById('procAnim').textContent  = '🎙';
  document.getElementById('procTitle').textContent = st.name+' — Listening…';
  document.getElementById('procDesc').textContent  = 'Turn volume UP · mic listens to your video audio';
  document.getElementById('progFill').style.width  = '0%';
  document.getElementById('procLive').textContent  = '';
  document.getElementById('capCount').textContent  = '0 captions captured';

  // ── Speech recognition ─────────────────────────────────────
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){
    document.getElementById('procDesc').textContent = '⚠ Needs Chrome or Edge for auto-captions';
  } else {
    recog = new SR();
    recog.continuous     = true;
    recog.interimResults = true;
    recog.lang           = 'en-GB';
    listenStart          = Date.now();

    recog.onresult = function(ev){
      var final='', interim='';
      for(var i=ev.resultIndex;i<ev.results.length;i++){
        var res = ev.results[i];
        if(res.isFinal) final   += res[0].transcript;
        else             interim += res[0].transcript;
      }

      var shown = (final||interim).trim();
      if(shown) document.getElementById('procLive').textContent = '"'+shown+'"';

      if(final.trim()){
        var vidT   = (vid.readyState>=2&&vid.duration) ? vid.currentTime : (Date.now()-listenStart)/1000;
        var text   = final.trim();
        var drm    = isDramatic(text);

        // Spread words evenly across estimated duration
        // Each word gets ~0.35s, starting from vidT - text.length*0.18 (approximate)
        var ws     = text.split(/\s+/).filter(Boolean);
        var perW   = 0.38;
        var startT = Math.max(0, vidT - ws.length*perW);

        var sentWords = ws.map(function(w, wi){
          var wt  = startT + wi*perW;
          var we  = wt + perW - 0.04;
          var obj = {w:w, t:wt, end:we, dramatic:drm};
          words.push(obj);
          return obj;
        });

        sentences.push({t:startT, end:startT+ws.length*perW, text:text, words:sentWords, dramatic:drm});
        document.getElementById('capCount').textContent = sentences.length+' captions captured';
      }
    };

    recog.onerror = function(e){
      if(e.error==='not-allowed')
        document.getElementById('procDesc').textContent='⚠ Allow mic in browser address bar, then try again';
    };
    recog.onend = function(){ if(isListening) try{recog.start();}catch(e){} };

    try{ recog.start(); isListening=true; }
    catch(e){ document.getElementById('procDesc').textContent='Could not start mic: '+e.message; }
  }

  // ── Play video ─────────────────────────────────────────────
  vid.currentTime=0; vid.muted=false; vid.volume=1.0;
  vid.play().catch(function(){ vid.muted=true; vid.play(); });

  // Progress bar
  vid.ontimeupdate = function(){
    if(!vid.duration) return;
    var pct=(vid.currentTime/vid.duration)*100;
    document.getElementById('progFill').style.width=pct+'%';
    document.getElementById('procTitle').textContent=
      ft(vid.currentTime)+' / '+ft(vid.duration)+'  ·  '+sentences.length+' captions';
  };

  // Live preview canvas during listening
  startLivePreview();

  // When video ends → launch preview
  vid.onended = function(){
    isListening=false;
    if(recog) try{recog.abort();}catch(e){}
    vid.onended=null; vid.ontimeupdate=null;
    cancelAnimationFrame(liveRafId);
    document.getElementById('progFill').style.width='100%';
    document.getElementById('procAnim').textContent='✅';
    document.getElementById('procTitle').textContent='Done! '+sentences.length+' captions';
    setTimeout(launchPreview, 700);
  };
}

// Live preview during processing (small canvas)
function startLivePreview(){
  if(!liveCV||!liveCTX) return;
  liveCV.width=200; liveCV.height=355;
  function drawLive(){
    drawFrameOnCanvas(liveCV, liveCTX, 200, 355);
    liveRafId = requestAnimationFrame(drawLive);
  }
  drawLive();
}

// ─────────────────────────────────────────────────────────────────
// LAUNCH PREVIEW
// ─────────────────────────────────────────────────────────────────
function launchPreview(){
  goTo('sPreview');
  cv.width=540; cv.height=960;
  document.getElementById('expStyle').textContent   = activeStyle.name;
  document.getElementById('styleBadge').textContent = activeStyle.name+' ✓';
  document.getElementById('expStats').innerHTML =
    sentences.length+' captions &nbsp;·&nbsp; '
    +words.length+' words timed &nbsp;·&nbsp; '+activeStyle.name;

  vid.pause(); vid.currentTime=0;
  vid.ontimeupdate=function(){
    var t=vid.currentTime,d=vid.duration||1;
    document.getElementById('vbFill').style.width=(t/d*100)+'%';
    document.getElementById('vbTime').textContent=ft(t)+'/'+ft(d);
  };
  vid.onended=function(){
    isPlaying=false;
    document.getElementById('vbPlay').textContent='▶';
    document.getElementById('bigPlay').textContent='▶';
    document.getElementById('playTap').classList.remove('on');
    cancelAnimationFrame(rafId);
  };
  drawFrame(cv, cvCtx);
}

// ─────────────────────────────────────────────────────────────────
// DRAW — shared between main canvas and live preview
// ─────────────────────────────────────────────────────────────────
function drawFrameOnCanvas(canvas, ctx, W, H){
  if(!vid.videoWidth) return;
  var st = activeStyle;

  if(gradeC.width!==W||gradeC.height!==H){ gradeC.width=W; gradeC.height=H; }
  ctx.clearRect(0,0,W,H);

  // 1. Video + grade
  var vw=vid.videoWidth, vh=vid.videoHeight;
  var sc=Math.max(W/vw,H/vh);
  var dw=vw*sc, dh=vh*sc;
  gradeX.clearRect(0,0,W,H);
  gradeX.filter = st.grade||'none';
  gradeX.drawImage(vid,(W-dw)/2,(H-dh)/2,dw,dh);
  gradeX.filter  = 'none';
  ctx.drawImage(gradeC,0,0);

  // 2. Tint overlay
  ctx.globalCompositeOperation = st.tintMode||'source-over';
  ctx.fillStyle = st.tint||'transparent';
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation = 'source-over';

  // 3. Vignette
  if(st.vignette>0){
    var vg=ctx.createRadialGradient(W/2,H/2,H*0.12,W/2,H/2,H*0.88);
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

  // 5. Grain
  if(st.grain) doGrain(ctx,W,H);

  // 6. Find current sentence
  var now = vid.currentTime;
  var curSentence = null;
  for(var i=0;i<sentences.length;i++){
    if(now >= sentences[i].t && now <= sentences[i].end+0.3){ curSentence=sentences[i]; break; }
  }

  // 7. Render captions
  if(curSentence){
    st.render(ctx, W, H, {
      words:    curSentence.words,
      curTime:  now,
      text:     curSentence.text,
      dramatic: curSentence.dramatic
    });
  }

  // 8. Watermark
  ctx.save();
  ctx.font='10px "DM Sans",sans-serif';
  ctx.fillStyle='rgba(255,255,255,0.15)';
  ctx.textAlign='right'; ctx.textBaseline='top';
  ctx.fillText('ImpactGrid',W-10,10);
  ctx.restore();
}

function drawFrame(){
  drawFrameOnCanvas(cv, cvCtx, cv.width, cv.height);
  if(isPlaying) rafId=requestAnimationFrame(drawFrame);
}

function doGrain(ctx,W,H){
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
// EXPORT
// ─────────────────────────────────────────────────────────────────
function setFmt(btn){
  document.querySelectorAll('.fmt').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  exportFmt=btn.dataset.f;
}

function doExport(){
  if(!vid.src){ toast('No video loaded'); return; }
  if(exportFmt==='reel')         {cv.width=540;  cv.height=960;}
  else if(exportFmt==='youtube') {cv.width=1280; cv.height=720;}
  else                           {cv.width=720;  cv.height=720;}

  var ep=document.getElementById('expProg');
  var bar=document.getElementById('epFill');
  var lbl=document.getElementById('epLbl');
  ep.style.display='block';
  document.getElementById('dlBtn').disabled=true;

  var stream=cv.captureStream(30);
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
    toast('✓ Exported!');
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
  },300);
  vid.onended=function(){ clearInterval(pi); isPlaying=false; rec.stop(); };
}

function defaultEnded(){
  isPlaying=false;
  document.getElementById('vbPlay').textContent='▶';
  document.getElementById('playTap').classList.remove('on');
  cancelAnimationFrame(rafId);
}

// ─────────────────────────────────────────────────────────────────
// CAPTION HELPERS
// ─────────────────────────────────────────────────────────────────
var DRAMATIC_WORDS=new Set(['amazing','incredible','huge','massive','love','hate','never','always',
  'breaking','best','worst','epic','shocking','first','secret','free','truth','only','biggest',
  'powerful','change','money','success','stop','watch','insane','crazy','unbelievable','launch',
  'new','live','now','today','wow','omg','seriously','literally','game','winner','real','fire']);

function isDramatic(text){
  if(/[!?]/.test(text)) return true;
  var l=text.toLowerCase();
  return Array.from(DRAMATIC_WORDS).some(function(w){return l.indexOf(w)!==-1;});
}

// Group word objects into lines of max n words
function groupLines(wordArr, n){
  var lines=[], cur=[];
  wordArr.forEach(function(w){
    cur.push(w);
    if(cur.length>=n){ lines.push(cur.slice()); cur=[]; }
  });
  if(cur.length) lines.push(cur);
  return lines;
}

// Measure total width of a word array with current font
function lineW(ctx, wordArr){
  return wordArr.reduce(function(a,w){ return a+ctx.measureText(w.w||w).width+10; },0);
}

// Rounded rect helper
function rRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  if(ctx.roundRect){ ctx.roundRect(x,y,w,h,r); }
  else{
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
}

// ─────────────────────────────────────────────────────────────────
// NAVIGATION + UTILS
// ─────────────────────────────────────────────────────────────────
function goTo(id){
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var el=document.getElementById(id);
  if(el){ el.classList.add('active'); window.scrollTo(0,0); }
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
