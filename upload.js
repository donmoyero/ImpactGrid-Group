window._PAGE='upload.html';
var SUPA_URL='https://zoenpjjhzdzcodoqsxap.supabase.co';
var SUPA_KEY='sb_publishable_DWdVt8DhlzgritPEsDCEow_N-Wy-V_I';

// ── Theme ─────────────────────────────────────────────────────────
function applyTheme(t){document.documentElement.setAttribute('data-theme',t);document.getElementById('themeBtn').textContent=t==='dark'?'☀️':'🌙';try{localStorage.setItem('ig-theme',t);}catch(e){}}
function toggleTheme(){applyTheme(document.documentElement.getAttribute('data-theme')==='light'?'dark':'light');}
(function(){try{applyTheme(localStorage.getItem('ig-theme')||'light');}catch(e){applyTheme('light');}})();

// ── Sidebar ───────────────────────────────────────────────────────
(function(){
  var pg='upload.html';
  function svg(d){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;flex-shrink:0">'+d+'</svg>';}
  function msvg(d){return '<svg class="main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';}
  var I={db:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',up:'<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',clk:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',tnd:'<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',usr:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>',map:'<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>',star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',cam:'<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',inf:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>',mail:'<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>'};
  function chevSvg(){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chev" style="width:11px;height:11px;margin-left:auto;opacity:.38;transition:transform .22s"><polyline points="9 18 15 12 9 6"/></svg>';}
  function sec(id,icon,label,items){var hasActive=items.some(function(it){return it.href&&it.href===pg;});var h='<div class="sb-sec'+(hasActive?' open':'')+'" id="sec_'+id+'"><div class="sb-sec-hd" onclick="toggleSec(this)">'+msvg(icon)+label+chevSvg()+'</div><div class="sb-items">';items.forEach(function(it){if(it.soon){h+='<div class="si-soon">'+svg(it.ic)+it.label+'<span class="soon-tag">soon</span></div>';}else{h+='<a href="'+it.href+'" class="si'+(pg===it.href?' on':'')+'">'+svg(it.ic)+it.label+(it.isnew?'<span class="new-tag">NEW</span>':'')+'</a>';}});h+='</div></div>';return h;}
  var html='<a href="dashboard.html" class="sb-dash'+(pg==='dashboard.html'?' on':'')+'">'+svg(I.db)+'Dashboard</a>'+
    sec('studio',I.up,'Creator Studio',[{href:'upload.html',ic:I.up,label:'Upload & Edit',isnew:true},{soon:true,ic:I.doc,label:'Projects'},{soon:true,ic:I.cam,label:'Media Library'}])+
    sec('tools',I.cal,'Content Tools',[{href:'calendar.html',ic:I.cal,label:'Content Calendar'},{href:'schedule.html',ic:I.clk,label:'Posting Schedule'},{href:'trending.html',ic:I.tnd,label:'Trending Topics'},{soon:true,ic:I.star,label:'Campaign Planner'}])+
    sec('market',I.usr,'Marketplace',[{href:'creators.html',ic:I.usr,label:'Book a Creator'},{soon:true,ic:I.usr,label:'Creator Profiles'},{soon:true,ic:I.doc,label:'My Jobs'},{href:'tracker.html',ic:I.map,label:'Live Tracker'}])+
    sec('svc',I.star,'Services',[{href:'photography.html',ic:I.cam,label:'Photography'},{soon:true,ic:I.up,label:'Video Production'},{soon:true,ic:I.star,label:'Brand Campaigns'},{href:'services.html',ic:I.star,label:'All Services'}])+
    sec('co',I.inf,'Company',[{href:'about.html',ic:I.inf,label:'About Us'},{href:'contact.html',ic:I.mail,label:'Contact'},{href:'contact.html',ic:I.doc,label:'Support'}]);
  document.getElementById('sbNav').innerHTML=html;
  document.getElementById('ov').onclick=closeNav;
  function resize(){var g=document.getElementById('mainGrid');if(g)g.style.gridTemplateColumns=window.innerWidth<900?'1fr':'1fr 292px';}
  resize();window.addEventListener('resize',resize);
})();
function toggleSec(el){var s=el.closest('.sb-sec');if(s)s.classList.toggle('open');}
function openNav(){document.getElementById('sb').classList.add('open');document.getElementById('ov').style.display='block';}
function closeNav(){document.getElementById('sb').classList.remove('open');document.getElementById('ov').style.display='none';}

// ── Auth ──────────────────────────────────────────────────────────
var _user=null;
try{var _us=localStorage.getItem('ig-user');if(_us)_user=JSON.parse(_us);}catch(e){}
function updateAuthUI(){var nm=document.getElementById('authName'),rl=document.getElementById('authRole');if(!nm)return;if(_user){nm.textContent=_user.name||_user.email||'Account';rl.textContent='Click to sign out';}else{nm.textContent='Sign In';rl.textContent='Access your account';}}
function handleAuth(){if(_user){_user=null;try{localStorage.removeItem('ig-user');}catch(e){}updateAuthUI();toast('Signed out','ok');}else showAuthModal();}
function showAuthModal(){var m=document.createElement('div');m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';m.innerHTML='<div style="background:var(--card);border:1px solid var(--b2);border-radius:14px;padding:28px 24px;width:100%;max-width:330px;margin:14px;box-shadow:0 20px 60px rgba(0,0,0,.3)"><h2 style="font-family:Syne,sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:3px;color:var(--gold)">Sign in</h2><p style="font-size:.72rem;color:var(--dim);margin-bottom:18px">ImpactGrid Content Agency</p><div style="margin-bottom:11px"><label style="font-size:.67rem;color:var(--dim);display:block;margin-bottom:4px">Email</label><input id="aEm" type="email" placeholder="you@example.com" style="width:100%;background:var(--surf);border:1px solid var(--b2);color:var(--tx);padding:8px 10px;border-radius:7px;font-family:DM Sans,sans-serif;font-size:.82rem;outline:none"/></div><div style="margin-bottom:17px"><label style="font-size:.67rem;color:var(--dim);display:block;margin-bottom:4px">Password</label><input id="aPw" type="password" placeholder="••••••••" style="width:100%;background:var(--surf);border:1px solid var(--b2);color:var(--tx);padding:8px 10px;border-radius:7px;font-family:DM Sans,sans-serif;font-size:.82rem;outline:none"/></div><div style="display:flex;gap:7px"><button onclick="doSignIn()" style="flex:1;background:var(--gold);color:#fff;border:none;padding:9px;border-radius:7px;font-family:Syne,sans-serif;font-weight:700;font-size:.75rem;cursor:pointer">Sign In</button><button onclick="this.closest(\'[style*=inset]\').remove()" style="background:var(--surf);color:var(--dim);border:1px solid var(--b2);padding:9px 13px;border-radius:7px;font-size:.75rem;cursor:pointer">Cancel</button></div><p id="aErr" style="font-size:.67rem;color:var(--or);margin-top:8px;display:none"></p></div>';document.body.appendChild(m);setTimeout(function(){var e=document.getElementById('aEm');if(e)e.focus();},100);m.addEventListener('click',function(e){if(e.target===m)m.remove();});}
async function doSignIn(){var email=document.getElementById('aEm').value.trim(),pass=document.getElementById('aPw').value,err=document.getElementById('aErr');if(!email||!pass){err.textContent='Fill in both fields.';err.style.display='block';return;}err.style.display='none';try{var r=await fetch(SUPA_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{'apikey':SUPA_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})});var d=await r.json();if(d.access_token){_user={email,name:email.split('@')[0],token:d.access_token};try{localStorage.setItem('ig-user',JSON.stringify(_user));}catch(e){}document.querySelector('[style*="inset:0"]').remove();updateAuthUI();toast('Welcome back, '+_user.name+'!','ok');}else{err.textContent=d.error_description||'Invalid credentials.';err.style.display='block';}}catch(e){err.textContent='Connection error.';err.style.display='block';}}
updateAuthUI();

function toast(msg,type){var t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'ok');clearTimeout(t._t);t._t=setTimeout(function(){t.classList.remove('show');},4000);}
function wait(ms){return new Promise(function(r){setTimeout(r,ms);});}

// ── State ─────────────────────────────────────────────────────────
var clips=[],_style='professional',_music='none',_capStyle='tiktok';
var _formats={reel:true,tiktok:true,youtube:true,linkedin:true};
var overlays=[],_prevPlatform='reel';

// ── Behaviour learning (localStorage) ────────────────────────────
var _prefs={};
try{var _sp=localStorage.getItem('ig-prefs');if(_sp)_prefs=JSON.parse(_sp);}catch(e){}
function savePref(key,val){_prefs[key]=val;_prefs[key+'_count']=(_prefs[key+'_count']||0)+1;try{localStorage.setItem('ig-prefs',JSON.stringify(_prefs));}catch(e){}}
function getPref(key){return _prefs[key]||null;}
function showSuggestions(){
  var items=[];
  var ps=getPref('style'),pf=getPref('format'),pc=getPref('capStyle');
  if(ps&&ps!==_style)items.push({label:'Style: '+ps,action:"pickStyleByName('"+ps+"')"});
  if(pf)items.push({label:'Export: '+pf,action:"autoSelectFormat('"+pf+"')"});
  if(pc&&pc!==_capStyle)items.push({label:'Captions: '+pc,action:"pickCapStyleByName('"+pc+"')"});
  var panel=document.getElementById('suggPanel');
  if(!items.length){panel.style.display='none';return;}
  panel.style.display='block';
  document.getElementById('suggItems').innerHTML=items.map(function(it){
    return '<div class="sugg-row"><span>Previously used — '+it.label+'</span><button class="sugg-apply" onclick="'+it.action+'">Apply</button></div>';
  }).join('');
}
function pickStyleByName(n){var cards=document.querySelectorAll('.style-card');cards.forEach(function(c){if(c.querySelector('strong').textContent.toLowerCase().includes(n.toLowerCase())){pickStyle(n,c);}});}
function pickCapStyleByName(n){var cards=document.querySelectorAll('.cs-card');cards.forEach(function(c){if(c.querySelector('span').textContent.toLowerCase().includes(n.toLowerCase())){pickCapStyle(n,c);}});}
function autoSelectFormat(fmt){
  var btn=document.getElementById('fbt_'+fmt);
  if(btn&&!_formats[fmt]){toggleFmt(fmt,btn);}
}

// ── STYLES / PLATFORMS / MUSIC defs ──────────────────────────────
var STYLES={professional:{name:'Professional',filter:'contrast(1.12) brightness(1.04) saturate(0.9)',captionBg:'rgba(0,0,0,0.8)',captionColor:'#ffffff',captionFont:'bold 22px Arial',highlightColor:'#4a8ff5',introBg:'#0d1b2e',introColor:'#ffffff',accentColor:'#4a8ff5'},fun:{name:'Fun & Energetic',filter:'contrast(1.06) brightness(1.1) saturate(1.4)',captionBg:'rgba(255,92,26,0.92)',captionColor:'#ffffff',captionFont:'bold 22px Arial',highlightColor:'#f0c93a',introBg:'#1a0800',introColor:'#ff5c1a',accentColor:'#f0c93a'},cinematic:{name:'Cinematic',filter:'contrast(1.3) brightness(0.85) saturate(0.55)',captionBg:'rgba(0,0,0,0.9)',captionColor:'#c9a96e',captionFont:'bold 20px Georgia',highlightColor:'#c9a96e',introBg:'#070710',introColor:'#c9a96e',accentColor:'#8b6f47'},minimal:{name:'Minimal',filter:'contrast(0.94) brightness(1.18) saturate(0.78)',captionBg:'rgba(255,255,255,0.93)',captionColor:'#222',captionFont:'20px Helvetica',highlightColor:'#c4b5a0',introBg:'#f5f0ea',introColor:'#333',accentColor:'#c4b5a0'}};
var PLATFORMS={reel:{name:'Instagram Reel',emoji:'&#127917;',w:540,h:960},tiktok:{name:'TikTok',emoji:'&#127925;',w:540,h:960},youtube:{name:'YouTube',emoji:'&#9654;',w:960,h:540},linkedin:{name:'LinkedIn',emoji:'&#128188;',w:540,h:540}};
var MUSIC_URLS={corporate:'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',upbeat:'https://cdn.pixabay.com/download/audio/2022/10/30/audio_c8c8a73a38.mp3',cinematic:'https://cdn.pixabay.com/download/audio/2022/03/10/audio_2d43e74474.mp3',minimal:'https://cdn.pixabay.com/download/audio/2022/08/23/audio_d16737dc28.mp3'};

// ── Clip management ───────────────────────────────────────────────
document.getElementById('clipInput').addEventListener('change',function(){addClips(Array.from(this.files));this.value='';});
var dz=document.getElementById('dropZone');
dz.addEventListener('dragover',function(e){e.preventDefault();dz.classList.add('drag');});
dz.addEventListener('dragleave',function(){dz.classList.remove('drag');});
dz.addEventListener('drop',function(e){e.preventDefault();dz.classList.remove('drag');var files=Array.from(e.dataTransfer.files).filter(function(f){return f.type.startsWith('video/');});if(files.length)addClips(files);});
function addClips(files){files.forEach(function(f){if(clips.length>=5){toast('Max 5 clips','err');return;}clips.push({file:f,url:URL.createObjectURL(f),trimIn:0,trimOut:null,speed:1,expanded:false,duration:0});});renderClipList();updatePreview();loadClipDurations();}
function removeClip(i){URL.revokeObjectURL(clips[i].url);clips.splice(i,1);renderClipList();if(!clips.length){clearPreview();document.getElementById('assembleBtn').style.display='none';}}
function toggleClipExpand(i){clips[i].expanded=!clips[i].expanded;renderClipList();}
function setClipTrim(i,field,val){var v=parseFloat(val);if(!isNaN(v))clips[i][field]=v;}
function setClipSpeed(i,spd){clips[i].speed=spd;renderClipList();}
function toggleClipMute(i){clips[i].muted=!clips[i].muted;renderClipList();toast(clips[i].muted?'Clip '+(i+1)+' muted':'Clip '+(i+1)+' unmuted','ok');}
function loadClipDurations(){clips.forEach(function(c,i){if(!c.duration){var v=document.createElement('video');v.src=c.url;v.onloadedmetadata=function(){clips[i].duration=v.duration;checkAssembleBtn();};v.load();}});}
function checkAssembleBtn(){var btn=document.getElementById('assembleBtn');if(btn)btn.style.display=clips.length>=2?'flex':'none';}
var _dragIdx=null;
function renderClipList(){
  var ROLES=['Intro','Main','Highlight','Support','Outro'];
  var el=document.getElementById('clipList');
  el.innerHTML=clips.map(function(c,i){
    var speeds=[0.5,0.75,1,1.5,2];
    var sb=speeds.map(function(s){return '<button class="spd-btn'+(c.speed===s?' on':'')+'\" onclick="setClipSpeed('+i+','+s+')">'+s+'x</button>';}).join('');
    var role=c.role||ROLES[i]||'Clip '+(i+1);
    return '<div class="clip-item" draggable="true" id="ci_'+i+'" ondragstart="dragStart('+i+')" ondragover="dragOver(event,'+i+')" ondrop="dropClip(event,'+i+')" ondragleave="dragLeave('+i+')">'
      +'<div class="clip-header"><span style="color:var(--dim);cursor:grab;padding:0 3px;font-size:.72rem">&#8942;&#8942;</span><video src="'+c.url+'" class="clip-thumb" muted preload="metadata"></video>'
      +'<div class="clip-name">'+c.file.name+'<span class="role-badge">'+role+'</span></div>'
      +'<div class="clip-meta"><span>'+(c.file.size/1024/1024).toFixed(1)+'MB</span>'+(c.speed!==1?'<span style="color:var(--or)">'+c.speed+'x</span>':'')+'</div>'
      +'<button class="clip-expand" onclick="toggleClipExpand('+i+')">'+(c.expanded?'&#9650; Less':'&#9660; Edit')+'</button>'
      +'<button class="clip-rm" onclick="removeClip('+i+')">&#10005;</button></div>'
      +'<div class="clip-controls'+(c.expanded?' open':'')+'"><div class="trim-row"><span class="trim-label">Trim in</span><input class="trim-input" type="number" min="0" step="0.5" placeholder="0s" value="'+(c.trimIn||'')+'" onchange="setClipTrim('+i+',\'trimIn\',this.value)"/><span class="trim-label" style="width:auto;margin-left:8px">Trim out</span><input class="trim-input" type="number" min="0" step="0.5" placeholder="end" value="'+(c.trimOut||'')+'" onchange="setClipTrim('+i+',\'trimOut\',this.value)"/></div>'
      +'<div style="display:flex;align-items:center;gap:10px;margin-top:8px;flex-wrap:wrap"><div><span style="font-size:.66rem;color:var(--dim);display:block;margin-bottom:3px">Speed</span><div class="speed-btns">'+sb+'</div></div>'
      +'<div style="margin-left:auto"><span style="font-size:.66rem;color:var(--dim);display:block;margin-bottom:3px">Audio</span><button onclick="toggleClipMute('+i+')" id="muteBtn_'+i+'" class="btn bs sm" style="'+(c.muted?'border-color:var(--or);color:var(--or)':'')+'\">'+(c.muted?'🔇 Muted':'🔊 Audible')+'</button></div></div></div></div>';
  }).join('');
  document.getElementById('dropZone').style.display=clips.length>=5?'none':'block';
  checkAssembleBtn();
}
function dragStart(i){_dragIdx=i;}
function dragOver(e,i){e.preventDefault();document.querySelectorAll('.clip-item').forEach(function(el){el.classList.remove('drag-over');});if(i!==_dragIdx){var el=document.getElementById('ci_'+i);if(el)el.classList.add('drag-over');}}
function dragLeave(i){var el=document.getElementById('ci_'+i);if(el)el.classList.remove('drag-over');}
function dropClip(e,i){e.preventDefault();document.querySelectorAll('.clip-item').forEach(function(el){el.classList.remove('drag-over');});if(_dragIdx===null||_dragIdx===i)return;var moved=clips.splice(_dragIdx,1)[0];clips.splice(i,0,moved);_dragIdx=null;renderClipList();}

// ── SMART ASSEMBLE ────────────────────────────────────────────────
function smartAssemble(){
  if(clips.length<2){toast('Add at least 2 clips to assemble','err');return;}
  var ROLES=['Intro','Main Content','Highlight','Supporting','Outro'];
  // Sort by duration: shortest → intro/outro, longest → main
  var sorted=[...clips].map(function(c,i){return{idx:i,dur:c.duration||10};});
  sorted.sort(function(a,b){return b.dur-a.dur;});
  // Assign roles: longest=Main, 2nd=Highlight, rest fill in
  var roleMap={};
  sorted.forEach(function(s,ri){
    var roleOrder=[1,2,0,3,4]; // main, highlight, intro, support, outro
    var role=ROLES[roleOrder[ri]||ri]||'Clip '+(ri+1);
    roleMap[s.idx]=role;
  });
  // Set trim suggestions: intro short (first 15s), outro short (first 10s)
  clips.forEach(function(c,i){
    c.role=roleMap[i];
    if(c.role==='Intro'&&c.duration>15)c.trimOut=15;
    if(c.role==='Outro'&&c.duration>10)c.trimOut=10;
    if(c.role==='Main Content'&&c.duration>60)c.trimOut=60;
    if(c.role==='Highlight'&&c.duration>30)c.trimOut=30;
    c.speed=c.role==='Highlight'?1.25:1;
  });
  // Reorder: Intro → Main → Highlight → Supporting → Outro
  var ORDER=['Intro','Main Content','Highlight','Supporting','Outro'];
  clips.sort(function(a,b){return ORDER.indexOf(a.role)-ORDER.indexOf(b.role);});
  renderClipList();
  toast('&#9889; Smart Assemble done! Clips ordered & trimmed.','ok');
}

// ── Pickers ───────────────────────────────────────────────────────
function pickStyle(name,el){_style=name;document.querySelectorAll('.style-card').forEach(function(c){c.classList.remove('on');});el.classList.add('on');if(clips.length)prevInit();savePref('style',name);}
function pickCapStyle(name,el){_capStyle=name;document.querySelectorAll('.cs-card').forEach(function(c){c.classList.remove('on');});el.classList.add('on');savePref('capStyle',name);}
function pickMusic(name,el){_music=name;document.querySelectorAll('.mc').forEach(function(c){c.classList.remove('on');});el.classList.add('on');document.getElementById('uploadMusicWrap').style.display=name==='upload'?'block':'none';}
function toggleFmt(name,el){_formats[name]=!_formats[name];el.classList.toggle('on',_formats[name]);if(_formats[name])savePref('format',name);}

// ── Text overlays ─────────────────────────────────────────────────
function addOverlay(){overlays.push({text:'',position:'bottom',timing:'full'});renderOverlays();}
function removeOverlay(i){overlays.splice(i,1);renderOverlays();}
function renderOverlays(){document.getElementById('overlayList').innerHTML=overlays.map(function(o,i){return '<div class="overlay-item"><input class="ov-input" type="text" placeholder="Your text, CTA or #hashtag" value="'+o.text+'" oninput="overlays['+i+'].text=this.value"/><select class="ov-sel" onchange="overlays['+i+'].position=this.value"><option value="top"'+(o.position==='top'?' selected':'')+'>Top</option><option value="middle"'+(o.position==='middle'?' selected':'')+'>Middle</option><option value="bottom"'+(o.position==='bottom'?' selected':'')+'>Bottom</option></select><select class="ov-sel" onchange="overlays['+i+'].timing=this.value"><option value="full">Full video</option><option value="start">First 3s</option><option value="end">Last 3s</option></select><button class="ov-rm" onclick="removeOverlay('+i+')">&#10005;</button></div>';}).join('');}

// Hook into addClips already done in vd section ─────────────────

// ── B-ROLL AUTO ENGINE ────────────────────────────────────────────
// Fully automatic: speech → keyword → fetch all 3 APIs → pick best → auto-insert at timestamp
var brollQueue=[];
var brollLastKeyword='';
var brollDebounceTimer=null;
var brollRecentKeywords=new Set(); // avoid re-inserting same topic

// Stop-words — ignore when scanning for topics
var BROLL_STOPWORDS=new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','shall','can','now','lets','look','into','talk','about','i','we','you','they','he','she','it','this','that','these','those','my','your','our','his','her','its','their','what','when','where','who','how','so','if','then','there','here','like','just','also','more','some','any','all','not','no','up','out','as','by','from','going','get','got','let','said','say','think','know','see','want','need','make','take','come','go','new','old','good','great','very','really','well','much','many','most','only','even','still','back','way','too','than','other','time','people','person','things','thing','world','life','day','year']);

function brollExtractKeywords(text){
  text=text.replace(/[.,!?;:]/g,' ');var words=text.toLowerCase().replace(/[^a-z\s'-]/g,'').split(/\s+/).filter(function(w){return w.length>2;});
  var kws=[];
  // Bigrams (two-word phrases are better search terms)
  for(var i=0;i<words.length-1;i++){
    if(!BROLL_STOPWORDS.has(words[i])&&!BROLL_STOPWORDS.has(words[i+1])){
      kws.push(words[i]+' '+words[i+1]);
    }
  }
  // Single nouns
  words.forEach(function(w){if(!BROLL_STOPWORDS.has(w)&&w.length>3)kws.push(w);});
  // Deduplicate, filter already used
  var seen=new Set();
  return kws.filter(function(k){
    if(seen.has(k)||brollRecentKeywords.has(k))return false;
    seen.add(k);return true;
  }).slice(0,2);
}

// Pexels key persistence
(function(){
  try{var k=localStorage.getItem('ig-pexels-key');if(k){var el=document.getElementById('pexelsKey');if(el)el.value=k;}}catch(e){}
})();
function savePexelsKey(v){}
function getPexelsKey(){return '';}

// Fetch from all 3 APIs in parallel, pick first result
// ── B-ROLL IMAGE FETCHING — 4 sources, all free, no key required ─
// Priority: Pexels (if key) → Loremflickr → Picsum → Wikipedia Commons

async function brollFetchBest(keyword){
  // Try Pexels first if key available (best quality)
  if(getPexelsKey()){
    try{var px=await brollFetchPexels(keyword);if(px&&px.url)return px;}catch(e){}
  }
  // Run free sources in parallel, pick first winner
  var results=await Promise.allSettled([
    brollFetchLoremflickr(keyword),
    brollFetchPicsum(keyword),
    brollFetchWikimedia(keyword)
  ]);
  for(var r of results){
    if(r.status==='fulfilled'&&r.value&&r.value.url)return r.value;
  }
  return null;
}

async function brollFetchPexels(keyword){
  var key=getPexelsKey();
  if(!key) return null;
  var ctrl=new AbortController();
  setTimeout(function(){ctrl.abort();},5000);
  try{
    var r=await fetch('https://api.pexels.com/v1/search?query='+encodeURIComponent(keyword)+'&per_page=3&orientation=landscape',{
      headers:{'Authorization':key},signal:ctrl.signal
    });
    if(!r.ok) return null;
    var d=await r.json();
    if(!d.photos||!d.photos.length) return null;
    var p=d.photos[Math.floor(Math.random()*d.photos.length)];
    return {url:p.src.medium,thumb:p.src.tiny,credit:p.photographer,source:'Pexels'};
  }catch(e){return null;}
}

async function brollFetchLoremflickr(keyword){
  // loremflickr.com — free, no key, returns real themed photos
  // Returns a redirect to a real Flickr image
  try{
    var seed=Math.floor(Math.random()*9999);
    var url='https://loremflickr.com/800/450/'+encodeURIComponent(keyword)+'?lock='+seed;
    var ctrl=new AbortController();
    setTimeout(function(){ctrl.abort();},6000);
    var r=await fetch(url,{signal:ctrl.signal,mode:'no-cors'});
    // no-cors means we can't read the response but the image URL itself works as <img> src
    return {url:url,thumb:'https://loremflickr.com/200/112/'+encodeURIComponent(keyword)+'?lock='+seed,credit:'Flickr',source:'Loremflickr'};
  }catch(e){return null;}
}

async function brollFetchPicsum(keyword){
  // picsum.photos — always works, no key, beautiful random photos
  // Use keyword hash for consistent-ish results per topic
  try{
    var hash=0;
    for(var i=0;i<keyword.length;i++) hash=(hash*31+keyword.charCodeAt(i))&0xffff;
    var id=(hash%900)+100; // IDs 100-999
    var url='https://picsum.photos/id/'+id+'/800/450';
    var thumb='https://picsum.photos/id/'+id+'/200/112';
    // Verify it exists
    var ctrl=new AbortController();
    setTimeout(function(){ctrl.abort();},5000);
    var r=await fetch('https://picsum.photos/id/'+id+'/info',{signal:ctrl.signal});
    if(!r.ok) return null;
    var info=await r.json();
    return {url:url,thumb:thumb,credit:info.author||'Picsum',source:'Picsum'};
  }catch(e){return null;}
}

async function brollFetchWikimedia(keyword){
  // Wikimedia Commons — massive free image database, no key
  try{
    var ctrl=new AbortController();
    setTimeout(function(){ctrl.abort();},6000);
    var apiUrl='https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch='
      +encodeURIComponent(keyword)+'&gsrnamespace=6&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=800&format=json&origin=*&gsrlimit=5';
    var r=await fetch(apiUrl,{signal:ctrl.signal});
    if(!r.ok) return null;
    var d=await r.json();
    if(!d.query||!d.query.pages) return null;
    var pages=Object.values(d.query.pages);
    // Filter to actual images (jpg/png only, skip svg/gif)
    var imgs=pages.filter(function(p){
      var u=(p.imageinfo&&p.imageinfo[0]&&p.imageinfo[0].url)||'';
      return /\.(jpg|jpeg|png)/i.test(u);
    });
    if(!imgs.length) return null;
    var pick=imgs[Math.floor(Math.random()*imgs.length)];
    var info=pick.imageinfo[0];
    return {
      url:info.thumburl||info.url,
      thumb:info.thumburl||info.url,
      credit:'Wikimedia Commons',
      source:'Wikipedia'
    };
  }catch(e){return null;}
}

// Main auto-trigger: called every time final speech comes in
async function brollOnSpeech(text,timestamp){
  var keywords=brollExtractKeywords(text);
  if(!keywords.length) return;

  for(var ki=0;ki<keywords.length;ki++){
    var kw=keywords[ki];
    if(brollRecentKeywords.has(kw)) continue;
    brollRecentKeywords.add(kw);

    // Show "fetching" state in panel
    var _bkw=document.getElementById('brollKeyword');if(_bkw)_bkw.textContent='"'+kw+'" — fetching...';
    var _bsw=document.getElementById('brollSpinWord');if(_bsw)_bsw.textContent=kw;
    var _bsp=document.getElementById('brollSpinner');if(_bsp)_bsp.style.display='flex';

    var img=await brollFetchBest(kw);
    var _bsp2=document.getElementById('brollSpinner');if(_bsp2)_bsp2.style.display='none';

    if(!img){
      var _bnf=document.getElementById('brollKeyword');if(_bnf)_bnf.textContent='"'+kw+'" — no image found, trying next...';
      brollRecentKeywords.delete(kw); // allow retry
      continue;
    }

    // AUTO-INSERT — no click needed
    var vid=_prevVideoRef||document.getElementById('prevVideo');var t=(vid&&vid.duration)?vid.currentTime:(timestamp||0);
    // Stagger multiple B-rolls so they don't overlap
    var existingAtTime=brollQueue.filter(function(b){return b.clipIdx===vdActiveClip&&Math.abs(b.time-t)<4;});
    if(existingAtTime.length) t+=existingAtTime.length*4;

    brollQueue.push({
      time:t,
      clipIdx:vdActiveClip,
      imageUrl:img.url,
      thumbUrl:img.thumb||img.url,
      keyword:kw,
      duration:3,
      source:img.source||'',
      credit:img.credit||''
    });

    // Add green marker on timeline
    vdAddMarker({clipIdx:vdActiveClip,time:t,type:'broll',param:kw,color:'#1a9e5a',label:'🖼 '+kw});
    brollRenderQueued();

    // Update panel
    var _bki=document.getElementById('brollKeyword');if(_bki)_bki.textContent='"'+kw+'" — added ✓';
    toast('🖼 B-Roll auto-added: "'+kw+'" at '+vdFmtTime(t)+' ('+img.source+')','ok');

    // Preload image for renderer
    var preload=new Image();preload.crossOrigin='anonymous';preload.decoding='async';preload.loading='eager';preload.src=img.url;
    brollQueue[brollQueue.length-1]._img=preload;

    // Add thumbnail to grid
    var grid=document.getElementById('brollGrid');
    if(grid){
      var card=document.createElement('div');
      card.className='broll-img queued';
      card.innerHTML='<img src="'+img.thumb+'" loading="lazy" alt="'+kw+'">'
        +'<div class="broll-kw">'+kw+' · '+vdFmtTime(t)+'</div>'
        +'<div class="broll-tick" style="display:flex">✓</div>';
      grid.appendChild(card);
    }
  }
}

function brollRenderQueued(){
  var wrap=document.getElementById('brollQueued');
  if(!brollQueue.length){wrap.innerHTML='';return;}
  var html='<div style="font-size:.52rem;text-transform:uppercase;letter-spacing:2px;color:var(--gr);font-weight:700;margin-bottom:6px">✓ '+brollQueue.length+' B-Roll frame(s) auto-queued</div>';
  html+=brollQueue.map(function(q,i){
    return '<div class="broll-queued-item">'
      +'<img src="'+q.thumbUrl+'" alt="'+q.keyword+'" onerror="this.style.display=\'none\'">'
      +'<span class="broll-queued-time">'+vdFmtTime(q.time)+'</span>'
      +'<span class="broll-queued-kw">'+q.keyword+'<br><span style="font-size:.58rem;color:var(--dim)">'+q.source+(q.credit?' · '+q.credit:'')+'</span></span>'
      +'<input type="number" min="1" max="10" value="'+q.duration+'" title="Duration (sec)" style="width:36px;background:var(--bg);border:1px solid var(--b2);color:var(--tx);padding:2px 4px;border-radius:4px;font-size:.68rem;text-align:center" onchange="brollQueue['+i+'].duration=Math.max(1,parseInt(this.value)||3)"/>'
      +'<button class="broll-queued-rm" onclick="brollRemove('+i+')" title="Remove">✕</button></div>';
  }).join('');
  wrap.innerHTML=html;
}

function brollRemove(i){
  brollRecentKeywords.delete(brollQueue[i].keyword);
  brollQueue.splice(i,1);
  brollRenderQueued();
}

function brollClearAll(){
  brollQueue=[];
  brollLastKeyword='';
  brollRecentKeywords.clear();
  var bg=document.getElementById('brollGrid');if(bg)bg.innerHTML='';
  var bq=document.getElementById('brollQueued');if(bq)bq.innerHTML='';
  var bp=document.getElementById('brollPanel');if(bp)bp.style.display='none';
}

// Manual search entry point — called from the search button in Step 3
async function brollManualSearch(){/* removed — auto only */}

// Patch vdProcessCommand to always trigger B-roll scan alongside edit commands
var _origVdProcessCommand=vdProcessCommand;
vdProcessCommand=function(cmd){
  _origVdProcessCommand(cmd);
  var vid=document.getElementById('prevVideo');
  var t=(vid&&vid.duration)?vid.currentTime:0;
  clearTimeout(brollDebounceTimer);
  brollDebounceTimer=setTimeout(function(){brollOnSpeech(cmd,t);},600);
};

// Trigger B-roll from speech — accepts optional timestamp from caption engine
function triggerBrollFromSpeech(text, ts){
  var vid=_prevVideoRef||document.getElementById('prevVideo');
  var t=(ts!==undefined)?ts:(vid&&vid.duration&&!vid.paused)?vid.currentTime:0;
  clearTimeout(brollDebounceTimer);
  brollDebounceTimer=setTimeout(function(){brollOnSpeech(text,t);},400);
}

// ── VOICE DIRECTOR ENGINE ─────────────────────────────────────────
// Edit markers: {clipIdx, time, type, param, color}
var vdMarkers=[];
var vdActiveClip=0;
var vdMicOn=false;
var vdRec=null;

var VD_COMMANDS={
  'cut here':     {type:'cut',      color:'#e8520f', label:'✂ Cut'},
  'cut':          {type:'cut',      color:'#e8520f', label:'✂ Cut'},
  'slow motion':  {type:'slow',     color:'#2a6dd9', label:'🐢 Slow 0.5×'},
  'slow mo':      {type:'slow',     color:'#2a6dd9', label:'🐢 Slow 0.5×'},
  'speed up':     {type:'fast',     color:'#f0c93a', label:'⚡ Fast 1.5×'},
  'fast forward': {type:'fast',     color:'#f0c93a', label:'⚡ Fast 1.5×'},
  'zoom in':      {type:'zoom',     color:'#1a9e5a', label:'🔍 Zoom In'},
  'zoom out':     {type:'zoomout',  color:'#1a9e5a', label:'🔍 Zoom Out'},
  'fade out':     {type:'fadeout',  color:'#555',    label:'⬛ Fade Out'},
  'fade in':      {type:'fadein',   color:'#888',    label:'⬜ Fade In'},
  'flash':        {type:'flash',    color:'#fff',    label:'⚡ Flash'},
  'white flash':  {type:'flash',    color:'#fff',    label:'⚡ Flash'},
  'cinematic':    {type:'grade',    color:'#c9a030', label:'🎬 Cinematic'},
  'vibrant':      {type:'grade2',   color:'#ff5c1a', label:'🎨 Vibrant'},
  'highlight':    {type:'highlight',color:'#ff5c1a', label:'⭐ Highlight'},
  'best part':    {type:'highlight',color:'#ff5c1a', label:'⭐ Highlight'},
  'beat drop':    {type:'beatdrop', color:'#e8520f', label:'🔥 Beat Drop'},
  'end here':     {type:'endclip',  color:'#cc2222', label:'🛑 End Clip'},
  'trim here':    {type:'endclip',  color:'#cc2222', label:'🛑 End Clip'},
  'stop here':    {type:'endclip',  color:'#cc2222', label:'🛑 End Clip'},
};

function vdInit(){
  // Called when clips are loaded — build clip selector and show player
  if(!clips.length) return;
  var sel=document.getElementById('vdClipSelect');
  if(sel){
    sel.innerHTML=clips.map(function(c,i){
      return '<button class="btn bs sm'+(i===vdActiveClip?' on':'')+'" onclick="vdSwitchClip('+i+')" style="'+(i===vdActiveClip?'border-color:var(--gold);color:var(--gold)':'')+'">'+(c.role||'Clip '+(i+1))+'</button>';
    }).join('');
  }
  var _vdpw=document.getElementById('vdPlayerWrap');if(_vdpw)_vdpw.style.display='block';
  vdLoadClip(vdActiveClip);
  vdRenderMarkerList();
}

function vdLoadClip(idx){
  vdActiveClip=idx;
  var vid=document.getElementById('vdVideo');
  if(!clips[idx]) return;
  vid.src=clips[idx].url;
  vid.onloadedmetadata=function(){
    var _vdd=document.getElementById('vdDur');if(_vdd)_vdd.textContent=vdFmtTime(vid.duration);
    vdRenderTimelineMarkers();
  };
  vid.ontimeupdate=function(){
    var pct=vid.duration?vid.currentTime/vid.duration*100:0;
    document.getElementById('vdProgress').style.width=pct+'%';
    var _vdt=document.getElementById('vdTime');if(_vdt)_vdt.textContent=vdFmtTime(vid.currentTime);
  };
  vid.onended=function(){var _vdpb=document.getElementById('vdPlayBtn');if(_vdpb)_vdpb.textContent='▶ Play';};
}

function vdSwitchClip(idx){
  vdActiveClip=idx;
  vdLoadClip(idx);
  // Update button styles
  var btns=document.getElementById('vdClipSelect').querySelectorAll('button');
  btns.forEach(function(b,i){b.style.borderColor=i===idx?'var(--gold)':'';b.style.color=i===idx?'var(--gold)':'';});
  vdRenderMarkerList();
}

function vdPlayPause(){
  var vid=document.getElementById('vdVideo');
  var btn=document.getElementById('vdPlayBtn');
  if(vid.paused){vid.play();btn.textContent='⏸ Pause';}
  else{vid.pause();btn.textContent='▶ Play';}
}

function vdRewind(){
  var vid=document.getElementById('vdVideo');
  vid.currentTime=0;
  var _vdpb=document.getElementById('vdPlayBtn');if(_vdpb)_vdpb.textContent='▶ Play';
}

function vdSeek(e){
  var bar=document.getElementById('vdTimeline');
  var vid=document.getElementById('vdVideo');
  if(!vid.duration) return;
  var rect=bar.getBoundingClientRect();
  var pct=(e.clientX-rect.left)/rect.width;
  vid.currentTime=Math.max(0,Math.min(vid.duration,pct*vid.duration));
}

function vdFmtTime(s){
  var m=Math.floor(s/60),sec=Math.floor(s%60);
  return m+':'+(sec<10?'0':'')+sec;
}

function vdToggleMic(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast('Voice needs Chrome or Edge','err');return;}
  if(vdMicOn){vdStopMic();return;}
  // Auto-play clip when mic starts
  var vid=document.getElementById('vdVideo');
  if(vid.paused&&vid.src) vid.play();
  var _vdpb=document.getElementById('vdPlayBtn');if(_vdpb)_vdpb.textContent='⏸ Pause';
  vdRec=new SR();
  vdRec.continuous=true;
  vdRec.interimResults=true;
  vdRec.lang='en-GB';
  var lastFinal='';
  vdRec.onresult=function(e){
    var interim='',final='';
    for(var i=e.resultIndex;i<e.results.length;i++){
      if(e.results[i].isFinal) final+=e.results[i][0].transcript.toLowerCase().trim()+' ';
      else interim+=e.results[i][0].transcript.toLowerCase();
    }
    // Show interim
    if(interim){var _vdtr=document.getElementById('vdTranscript');if(_vdtr)_vdtr.innerHTML='<em style="color:var(--dim)">'+interim+'...</em>';}
    // Process final
    if(final&&final!==lastFinal){
      lastFinal=final;
      var _vdtr=document.getElementById('vdTranscript');if(_vdtr)_vdtr.innerHTML='<strong>'+final+'</strong>';
      vdProcessCommand(final.trim());
    }
  };
  vdRec.onerror=function(){vdStopMic();};
  vdRec.onend=function(){if(vdMicOn)try{vdRec.start();}catch(e){vdStopMic();}};
  vdRec.start();
  vdMicOn=true;
  var _vdmb=document.getElementById('vdMicBtn');if(_vdmb)_vdmb.style.background='var(--or)';
  var _vdmi=document.getElementById('vdMicIcon');if(_vdmi)_vdmi.textContent='🔴';
  var _vdml=document.getElementById('vdMicLabel');if(_vdml)_vdml.textContent='Listening...';
  var _vds=document.getElementById('vdStatus');if(_vds)_vds.textContent='LIVE';
  if(_vds)_vds.style.background='rgba(232,82,15,.15)';
  if(_vds)_vds.style.color='var(--or)';
  toast('🎙 Listening — say "cut here", "slow motion", "zoom in"...','ok');
}

function vdStopMic(){
  if(vdRec)try{vdRec.abort();}catch(e){}
  vdMicOn=false;
  var _vdmb=document.getElementById('vdMicBtn');if(_vdmb)_vdmb.style.background='';
  var _vdmi=document.getElementById('vdMicIcon');if(_vdmi)_vdmi.textContent='🎙';
  var _vdml=document.getElementById('vdMicLabel');if(_vdml)_vdml.textContent='Start Listening';
  var _vds=document.getElementById('vdStatus');if(_vds)_vds.textContent='OFF';
  if(_vds)_vds.style.background='var(--b)';
  if(_vds)_vds.style.color='var(--dim)';
}

function vdProcessCommand(cmd){
  var vid=document.getElementById('vdVideo');
  var t=vid.currentTime||0;
  var matched=null;
  // Check text overlay: "text [words]"
  var textMatch=cmd.match(/(?:text|title|label|add text)\s+(.+)/);
  if(textMatch){
    var label='💬 "'+textMatch[1].trim().slice(0,30)+'"';
    vdAddMarker({clipIdx:vdActiveClip,time:t,type:'textpin',param:textMatch[1].trim(),color:'#4a8ff5',label:label});
    vdFlash(label,t);return;
  }
  // Check known commands
  Object.keys(VD_COMMANDS).forEach(function(kw){
    if(!matched&&cmd.includes(kw)) matched=VD_COMMANDS[kw];
  });
  if(matched){
    vdAddMarker({clipIdx:vdActiveClip,time:t,type:matched.type,param:null,color:matched.color,label:matched.label});
    vdFlash(matched.label,t);
    // Apply immediate effect to player for feedback
    vdApplyLiveEffect(matched.type,vid);
  } else {
    var _vdtr=document.getElementById('vdTranscript');if(_vdtr)_vdtr.innerHTML='<span style="color:var(--dim)">Not recognised: "'+cmd+'" — try "cut here", "slow motion", "zoom in"...</span>';
  }
}

function vdApplyLiveEffect(type,vid){
  // Visual feedback on the player
  var overlay=document.getElementById('vdVideo');
  if(type==='slow')      {vid.playbackRate=0.5;}
  else if(type==='fast') {vid.playbackRate=1.5;}
  else if(type==='cut')  {vid.playbackRate=1;}
  else if(type==='zoom') {vid.style.transform='scale(1.18)';setTimeout(function(){vid.style.transform='';},1200);}
  else if(type==='zoomout'){vid.style.transform='scale(0.85)';setTimeout(function(){vid.style.transform='';},1200);}
  else if(type==='flash'){var fl=document.createElement('div');fl.style.cssText='position:absolute;inset:0;background:#fff;border-radius:9px;pointer-events:none;animation:flashFade .4s forwards';document.querySelector('#vdPlayerWrap div').appendChild(fl);setTimeout(function(){fl.remove();},450);}
  else if(type==='fadeout'||type==='fadein'){vid.style.opacity=type==='fadeout'?'0':'1';setTimeout(function(){vid.style.opacity='1';},800);}
  else if(type==='grade'){vid.style.filter='contrast(1.3) brightness(0.85) saturate(0.55) sepia(0.15)';setTimeout(function(){vid.style.filter='';},2000);}
  else if(type==='grade2'){vid.style.filter='contrast(1.06) brightness(1.1) saturate(1.4)';setTimeout(function(){vid.style.filter='';},2000);}
  else if(type==='beatdrop'){vid.style.filter='contrast(1.5) saturate(1.8)';setTimeout(function(){vid.style.filter='';},600);}
  else if(type==='endclip'){vid.pause();var _vdpb=document.getElementById('vdPlayBtn');if(_vdpb)_vdpb.textContent='▶ Play';}
}

function vdFlash(label,t){
  var el=document.getElementById('vdFlash');
  el.textContent=label+' @ '+vdFmtTime(t);
  el.style.opacity='1';
  clearTimeout(el._t);
  el._t=setTimeout(function(){el.style.opacity='0';},1800);
}

function vdAddMarker(m){
  vdMarkers.push(m);
  vdRenderTimelineMarkers();
  vdRenderMarkerList();
  // Apply to clip state too
  var clip=clips[m.clipIdx];
  if(!clip) return;
  if(m.type==='endclip') clip.trimOut=m.time;
  if(m.type==='slow')    clip.speed=0.5;
  if(m.type==='fast')    clip.speed=1.5;
  if(m.type==='textpin'&&m.param){overlays.push({text:m.param,position:'bottom',timing:'full'});renderOverlays();}
  renderClipList();
}

function vdRemoveMarker(i){
  vdMarkers.splice(i,1);
  vdRenderTimelineMarkers();
  vdRenderMarkerList();
}

function vdClearMarkers(){
  vdMarkers=vdMarkers.filter(function(m){return m.clipIdx!==vdActiveClip;});
  vdRenderTimelineMarkers();
  vdRenderMarkerList();
  toast('Markers cleared for this clip','ok');
}

function vdRenderTimelineMarkers(){
  var vid=document.getElementById('vdVideo');
  var dur=vid.duration||0;
  var container=document.getElementById('vdMarkers');
  if(!container||!dur) return;
  var clipMarkers=vdMarkers.filter(function(m){return m.clipIdx===vdActiveClip;});
  container.innerHTML=clipMarkers.map(function(m,i){
    var pct=(m.time/dur*100).toFixed(2);
    return '<div class="vd-marker" style="left:'+pct+'%;background:'+m.color+'" title="'+m.label+' @ '+vdFmtTime(m.time)+'">'
      +'<div class="vd-marker-pill">'+m.label+'</div></div>';
  }).join('');
}

function vdRenderMarkerList(){
  var clipMarkers=vdMarkers.filter(function(m){return m.clipIdx===vdActiveClip;});
  var wrap=document.getElementById('vdMarkerList');
  var list=document.getElementById('vdMarkerItems');
  if(!wrap||!list) return;
  wrap.style.display=clipMarkers.length?'block':'none';
  list.innerHTML=clipMarkers.map(function(m,i){
    var realIdx=vdMarkers.indexOf(m);
    return '<div class="vd-marker-item">'
      +'<div class="vd-marker-dot" style="background:'+m.color+'"></div>'
      +'<span class="vd-marker-time">'+vdFmtTime(m.time)+'</span>'
      +'<span class="vd-marker-cmd">'+m.label+'</span>'
      +'<button class="vd-marker-rm" onclick="vdRemoveMarker('+realIdx+')">✕</button></div>';
  }).join('');
}

var _origAddClips=addClips;
addClips=function(files){
  _origAddClips(files);
  setTimeout(function(){
    prevInit();
    autoCapInit();  // request mic permission + start listening immediately
  },300);
};

// ── Preview ───────────────────────────────────────────────────────
function switchPreview(platform,el){_prevPlatform=platform;document.querySelectorAll('.prev-tab').forEach(function(t){t.classList.remove('on');});el.classList.add('on');prevInit();}
function updatePreview(){prevInit();}
function updatePreviewStyle(){prevInit();}
function clearPreview(){
  if(_prevRAF){cancelAnimationFrame(_prevRAF);_prevRAF=null;}
  var canvas=document.getElementById('prevCanvas');
  if(canvas){var ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);}
  document.getElementById('prevEmpty').style.display='flex';
}
function captureThumbnail(){
  var canvas=document.getElementById('prevCanvas');
  if(!canvas||!clips.length){toast('Add clips first','err');return;}
  canvas.toBlob(function(blob){
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='thumbnail_'+_prevPlatform+'_'+_style+'.jpg';a.click();
    toast('Thumbnail saved!','ok');
  },'image/jpeg',0.92);
}
function setProgress(pct,label,log){document.getElementById('procBar').style.width=pct+'%';document.getElementById('procPct').textContent=Math.round(pct)+'%';if(label)document.getElementById('procLabel').textContent=label;if(log)document.getElementById('procLog').textContent=log;}

// ── FREE CAPTION + B-ROLL ENGINE ────────────────────────────────
// 100% browser-side, zero cost, zero external APIs required.
//
// HOW IT WORKS:
//   Step 1 — User drops a clip. Preview video plays.
//   Step 2 — Mic auto-starts (asks permission once, remembers it).
//   Step 3 — User plays preview and speaks/the video audio plays out loud.
//   Step 4 — Speech API captures every word with real video timestamps.
//   Step 5 — Words are turned into captions AND B-roll keywords simultaneously.
//   Step 6 — B-roll images fetched from free sources, inserted at those timestamps.
//
// IMPORTANT BROWSER RULE: Speech API reads the MIC, not video audio.
// So either: speak your narration while preview plays, OR
//            turn up speakers so the browser mic picks up the video audio.

var _recordedCaptions = [];
var _manualCaptions   = [];
var _autoCapOn        = false;   // mic is currently open
var _capMicGranted    = false;   // mic permission ever granted this session
var _capRec           = null;    // SpeechRecognition instance
var _capRecStart      = 0;       // wall-clock time mic opened
var _prevVideoRef     = null;    // set by prevInit(), used for timestamps

// ── Auto-init: called whenever clips change ───────────────────────
function autoCapInit(){
  if(!clips.length) return;
  if(_autoCapOn) return; // already running
  _startMicSilently();   // always try — handles first-time permission + restarts
}

// Request mic in the background — if granted, start listening
function _startMicSilently(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return; // not Chrome/Edge — user must click button
  // navigator.mediaDevices.getUserMedia triggers the permission prompt
  if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      // Permission granted — stop the raw stream, Speech API manages its own
      stream.getTracks().forEach(function(t){t.stop();});
      _capMicGranted=true;
      autoCapStart();
    }).catch(function(){
      // Denied or unavailable — show button so user can try manually
      autoCapSetUI(false);
    });
  }
}

function autoCapToggle(){
  if(_autoCapOn){autoCapStop();return;}
  autoCapStart();
}

function autoCapStart(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    toast('Auto-captions need Chrome or Edge (not Firefox)','err');
    return;
  }
  if(!clips.length){toast('Add a clip first','err');return;}
  if(_autoCapOn) return; // already running

  _capRec = new SR();
  _capRec.continuous     = true;
  _capRec.interimResults = true;
  _capRec.maxAlternatives = 1;
  _capRec.lang           = 'en-GB';
  _capRecStart           = Date.now();

  var lastFinal = '';

  _capRec.onresult = function(e){
    var interim = '', finalText = '';
    for(var i=e.resultIndex; i<e.results.length; i++){
      if(e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }

    // Show live what's being heard
    var liveEl = document.getElementById('autoCapLive');
    if(liveEl){
      liveEl.style.display = 'block';
      if(interim) liveEl.innerHTML = '<em style="color:var(--dim)">' + interim + '…</em>';
    }

    if(finalText && finalText !== lastFinal){
      lastFinal = finalText;

      // Timestamp: use actual video playhead if video is playing, else wall-clock
      var vid = _prevVideoRef || document.getElementById('prevVideo');
      var t = (vid && vid.duration && vid.readyState >= 2 && !vid.paused)
        ? vid.currentTime
        : (Date.now() - _capRecStart) / 1000;

      // Feed to B-roll engine (keyword detection + image fetch)
      triggerBrollFromSpeech(finalText, t);

      // Split into subtitle-sized chunks (max 5 words each for readability)
      var words = finalText.trim().split(/\s+/);
      var chunk = [], chunkT = t;
      words.forEach(function(w, wi){
        chunk.push(w);
        if(chunk.length >= 5 || wi === words.length - 1){
          _recordedCaptions.push({ text: chunk.join(' '), t: Math.max(0, chunkT) });
          chunkT += chunk.length * 0.38; // ~380ms per word
          chunk = [];
        }
      });

      if(liveEl) liveEl.innerHTML =
        '<span style="color:var(--tx);font-weight:600">' + finalText.trim() + '</span>';
      autoCapRenderList();
    }
  };

  _capRec.onerror = function(e){
    if(e.error === 'not-allowed' || e.error === 'denied'){
      toast('Mic blocked — allow mic permission in browser bar','err');
      _capMicGranted = false;
      autoCapSetUI(false);
    } else if(e.error === 'no-speech'){
      // silence — fine, keep running
    } else {
      // any other error: wait and restart
      if(_autoCapOn) setTimeout(function(){ if(_autoCapOn) _restartMic(); }, 1000);
    }
  };

  _capRec.onend = function(){
    // Chrome kills the session after ~60s of silence — restart automatically
    if(_autoCapOn) setTimeout(_restartMic, 200);
  };

  _startCapRec();
}

function _startCapRec(){
  try{
    _capRec.start();
    _autoCapOn    = true;
    _capMicGranted = true;
    autoCapSetUI(true);
  }catch(ex){
    // Already started or other error — ignore
  }
}

function _restartMic(){
  if(!_autoCapOn) return;
  try{ _capRec.start(); }catch(ex){
    // If can't restart existing instance, create fresh one
    setTimeout(autoCapStart, 300);
  }
}

function autoCapStop(){
  _autoCapOn = false;
  if(_capRec) try{ _capRec.abort(); }catch(e){}
  autoCapSetUI(false);
  var n = _recordedCaptions.length;
  if(n) toast('✓ ' + n + ' caption' + (n > 1 ? 's' : '') + ' ready','ok');
}

function autoCapSetUI(on){
  var btn  = document.getElementById('autoCapBtn');
  var pill = document.getElementById('autoCapPill');
  var live = document.getElementById('autoCapLive');
  if(btn){
    btn.textContent = on ? '⏹ Stop' : '🎙 Start Listening';
    btn.style.background    = on ? 'var(--or)' : '';
    btn.style.color         = on ? '#fff' : '';
    btn.style.borderColor   = on ? 'var(--or)' : '';
  }
  if(pill){
    pill.style.display = on ? 'flex' : 'none';
    var pt = document.getElementById('autoCapPillText');
    if(pt) pt.textContent = on ? 'Listening…' : '';
  }
  if(!on && live) live.style.display = 'none';
}

function capRecClear(){
  _recordedCaptions = [];
  autoCapRenderList();
  var live = document.getElementById('autoCapLive');
  if(live){ live.innerHTML = ''; live.style.display = 'none'; }
}

function autoCapRenderList(){
  var all   = _recordedCaptions.slice();
  var wrap  = document.getElementById('capRecList');
  var items = document.getElementById('capRecItems');
  var count = document.getElementById('capRecCount');
  if(!wrap || !items) return;
  wrap.style.display = all.length ? 'block' : 'none';
  if(count) count.textContent = all.length + ' caption' + (all.length !== 1 ? 's' : '') + ' ready';
  items.innerHTML = all.map(function(c, i){
    return '<div style="display:flex;align-items:center;gap:7px;padding:5px 8px;'
      + 'background:var(--surf);border:1px solid var(--b);border-radius:6px;margin-bottom:4px">'
      + '<span style="font-size:.6rem;font-family:Syne,sans-serif;font-weight:700;'
      + 'color:var(--gold);min-width:30px;flex-shrink:0">' + capFmtTime(c.t) + '</span>'
      + '<input value="' + c.text.replace(/"/g,'&quot;') + '" '
      + 'style="flex:1;background:var(--bg);border:1px solid var(--b2);color:var(--tx);'
      + 'padding:3px 7px;border-radius:5px;font-size:.72rem;font-family:DM Sans,sans-serif;outline:none" '
      + 'onchange="_recordedCaptions[' + i + '].text=this.value"/>'
      + '<button onclick="_recordedCaptions.splice(' + i + ',1);autoCapRenderList()" '
      + 'style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:.8rem;flex-shrink:0">✕</button>'
      + '</div>';
  }).join('');
}

function capRecRenderList(){ autoCapRenderList(); }
function capFmtTime(s){ var m=Math.floor(s/60),sec=Math.floor(s%60); return m+':'+(sec<10?'0':'')+sec; }

function addManualCap(){
  _manualCaptions.push({text:'',t:0});
  renderManualCaps();
}
function renderManualCaps(){
  var el=document.getElementById('manualCapList');
  if(!el) return;
  el.innerHTML=_manualCaptions.map(function(c,i){
    return '<div style="display:flex;gap:6px;align-items:center;margin-bottom:5px;flex-wrap:wrap">'
      +'<input type="number" placeholder="0" min="0" step="0.5" value="'+(c.t||'')+'" style="width:52px;background:var(--bg);border:1px solid var(--b2);color:var(--tx);padding:4px 6px;border-radius:5px;font-size:.72rem" onchange="_manualCaptions['+i+'].t=parseFloat(this.value)||0"/>'
      +'<span style="font-size:.65rem;color:var(--dim)">s</span>'
      +'<input value="'+c.text.replace(/"/g,'&quot;')+'" placeholder="Caption text..." style="flex:1;min-width:120px;background:var(--bg);border:1px solid var(--b2);color:var(--tx);padding:4px 8px;border-radius:5px;font-size:.72rem;font-family:DM Sans,sans-serif;outline:none" onchange="_manualCaptions['+i+'].text=this.value"/>'
      +'<button onclick="_manualCaptions.splice('+i+',1);renderManualCaps()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:.8rem">✕</button></div>';
  }).join('');
}

function getAllCaptions(){
  return _recordedCaptions.concat(_manualCaptions).filter(function(c){return c.text.trim();}).sort(function(a,b){return a.t-b.t;});
}

// ── CANVAS LIVE PREVIEW — shows B-roll, captions, grade ──────────
var _prevRAF=null;
var _prevPlaying=false;

function prevInit(){
  var vid=document.getElementById('prevVideo');
  var canvas=document.getElementById('prevCanvas');
  var empty=document.getElementById('prevEmpty');

  if(!clips.length){
    empty.style.display='flex';
    return;
  }

  empty.style.display='none';
  vid.src=clips[0].url;

  // Make preview video globally available for AI listening
  _prevVideoRef=vid;

  var aspects={reel:'9/16',tiktok:'9/16',youtube:'16/9',linkedin:'1/1'};
  canvas.style.aspectRatio=aspects[_prevPlatform]||'9/16';

  vid.onloadedmetadata=function(){
    var scrub=document.getElementById('prevScrub');
    scrub.max=vid.duration||100;
    document.getElementById('prevTimeLabel').textContent=capFmtTime(vid.duration||0);
    prevStartDrawLoop();
    // Auto-play so mic can pick up audio immediately
    vid.muted=false;
    vid.volume=0.8;
    vid.play().catch(function(){
      // Autoplay blocked by browser — unmute button still works
      vid.muted=true;
    });
    // Start mic if not already running
    if(!_autoCapOn) autoCapStart();
  };

  vid.load();
}

function prevStartDrawLoop(){
  if(_prevRAF) cancelAnimationFrame(_prevRAF);
  var canvas=document.getElementById('prevCanvas');
  var vid=document.getElementById('prevVideo');
  var ctx=canvas.getContext('2d');
  var lastPlatform=_prevPlatform;
  var p=PLATFORMS[_prevPlatform]||PLATFORMS.reel;
  canvas.width=p.w; canvas.height=p.h;

  function drawPrevFrame(){
    p=PLATFORMS[_prevPlatform]||PLATFORMS.reel;
    var s=STYLES[_style];
    if(canvas.width!==p.w||canvas.height!==p.h){canvas.width=p.w;canvas.height=p.h;}
    ctx.clearRect(0,0,p.w,p.h);

    if(vid.readyState>=2&&vid.videoWidth){
      ctx.save();ctx.filter=s.filter;
      var vr=vid.videoWidth/vid.videoHeight,cr=p.w/p.h;
      var sw,sh,sx,sy;
      if(vr>cr){sh=vid.videoHeight;sw=sh*cr;sx=(vid.videoWidth-sw)/2;sy=0;}
      else{sw=vid.videoWidth;sh=sw/cr;sy=(vid.videoHeight-sh)/2;sx=0;}
      ctx.drawImage(vid,sx,sy,sw,sh,0,0,p.w,p.h);
      ctx.restore();

      var ct=vid.currentTime;

      // Preload broll images eagerly
      brollQueue.forEach(function(b){if(!b._img){b._img=new Image();b._img.crossOrigin='anonymous';b._img.src=b.imageUrl;}});
      var activeBroll=brollQueue.find(function(b){return b.clipIdx===0&&ct>=b.time&&ct<b.time+b.duration;});
      if(activeBroll&&activeBroll._img&&activeBroll._img.complete&&activeBroll._img.naturalWidth){
        var bimg=activeBroll._img;
        ctx.save();ctx.filter=s.filter;
        var bir=bimg.naturalWidth/bimg.naturalHeight,bcr=p.w/p.h;
        var bsw,bsh,bsx,bsy;
        if(bir>bcr){bsh=bimg.naturalHeight;bsw=bsh*bcr;bsx=(bimg.naturalWidth-bsw)/2;bsy=0;}
        else{bsw=bimg.naturalWidth;bsh=bsw/bcr;bsy=(bimg.naturalHeight-bsh)/2;bsx=0;}
        ctx.drawImage(bimg,bsx,bsy,bsw,bsh,0,0,p.w,p.h);
        ctx.restore();
        var lh=Math.round(p.h*0.075);
        ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,p.h-lh,p.w,lh);
        ctx.fillStyle='rgba(201,160,48,.95)';
        ctx.font='bold '+Math.round(p.w*0.034)+'px Arial';ctx.textAlign='center';
        ctx.fillText(activeBroll.keyword.toUpperCase(),p.w/2,p.h-Math.round(lh*0.2));
      }

      var caps=getAllCaptions();
      if(caps.length){
        var capIdx=0;
        for(var ci2=0;ci2<caps.length-1;ci2++){if(caps[ci2+1].t<=ct)capIdx=ci2+1;}
        var cap=caps[capIdx];
        if(cap&&ct>=cap.t&&ct-cap.t<4){
          drawCaption(ctx,cap,ct,p.w,p.h,_capStyle,_style,document.getElementById('captionPos').value);
        }
      }

      ctx.save();ctx.globalAlpha=0.4;ctx.fillStyle='#fff';
      ctx.font='bold '+Math.round(p.w*0.022)+'px Arial';ctx.textAlign='right';
      ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=3;
      ctx.fillText('ImpactGrid',p.w-10,Math.round(p.w*0.022)+8);
      ctx.restore();
    } else {
      ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,p.w,p.h);
    }

    if(vid.duration){
      document.getElementById('prevScrub').value=vid.currentTime;
      document.getElementById('prevTimeLabel').textContent=capFmtTime(vid.currentTime)+' / '+capFmtTime(vid.duration);
    }
    _prevRAF=requestAnimationFrame(drawPrevFrame);
  }
  drawPrevFrame();
}

function prevPlayPause(){
  var vid=document.getElementById('prevVideo');
  var btn=document.getElementById('prevPlayBtn');
  if(!vid.src||!clips.length) return;
  if(vid.paused){vid.play();btn.textContent='⏸';_prevPlaying=true;}
  else{vid.pause();btn.textContent='▶';_prevPlaying=false;}
}

function prevScrubTo(val){
  var vid=document.getElementById('prevVideo');
  if(vid.duration) vid.currentTime=parseFloat(val);
}

// getCaptions now returns recorded+manual captions (no more broken hidden video)
function getCaptions(){
  return Promise.resolve(getAllCaptions());
}

// ── Draw caption / overlays ───────────────────────────────────────
function drawCaption(ctx,cap,t,pw,ph,capStyle,style,pos){
  if(!cap||!cap.text)return;
  var s=STYLES[style]||STYLES.professional;
  var fs=Math.round(pw*0.048); // font size relative to canvas width
  // cy = baseline Y for text. Bottom = 88% down, Top = 10% down
  var cy=pos==='top'? Math.round(ph*0.10)+fs : Math.round(ph*0.82);
  ctx.save();
  if(capStyle==='tiktok'){
    // Word-by-word: each word gets its own pill, active word is bigger/orange
    var words=cap.text.split(' ');
    var elapsed=t-cap.t;
    var wordIdx=Math.min(Math.floor(elapsed/0.38),words.length-1);
    // measure total width to center row
    ctx.font='bold '+fs+'px Arial';
    var totalW=0;
    words.forEach(function(w){totalW+=ctx.measureText(w).width+Math.round(pw*0.018);});
    var startX=pw/2-totalW/2;
    var rx=startX;
    words.forEach(function(w,wi){
      var isCurrent=(wi===wordIdx);
      var wfs=isCurrent?Math.round(fs*1.15):fs;
      ctx.font='bold '+wfs+'px Arial';
      var ww=ctx.measureText(w).width;
      var pad=Math.round(pw*0.012);
      var boxH=wfs+Math.round(ph*0.014);
      var boxY=cy-wfs;
      ctx.fillStyle=isCurrent?'#ff5c1a':'rgba(0,0,0,0.72)';
      if(ctx.roundRect)ctx.roundRect(rx-pad,boxY,ww+pad*2,boxH,4);
      else{ctx.beginPath();ctx.rect(rx-pad,boxY,ww+pad*2,boxH);}
      ctx.fill();
      ctx.fillStyle='#ffffff';
      ctx.textAlign='left';
      ctx.fillText(w,rx,cy-Math.round(ph*0.003));
      rx+=ww+pad*2+Math.round(pw*0.006);
    });
  } else if(capStyle==='bar'){
    // Full-width bar behind text
    var barH=fs+Math.round(ph*0.025);
    ctx.fillStyle='rgba(0,0,0,0.78)';
    ctx.fillRect(0,cy-fs-Math.round(ph*0.008),pw,barH);
    ctx.fillStyle='#ffffff';
    ctx.font='bold '+fs+'px Arial';
    ctx.textAlign='center';
    ctx.fillText(cap.text,pw/2,cy);
  } else {
    // Highlight style: yellow pill around full sentence
    ctx.font='bold '+fs+'px Arial';
    var tw=Math.min(ctx.measureText(cap.text).width+Math.round(pw*0.06),pw*0.92);
    var boxH=fs+Math.round(ph*0.024);
    var bx=(pw-tw)/2;
    var by=cy-fs-Math.round(ph*0.006);
    ctx.fillStyle='#f0c93a';
    if(ctx.roundRect)ctx.roundRect(bx,by,tw,boxH,6);
    else{ctx.beginPath();ctx.rect(bx,by,tw,boxH);}
    ctx.fill();
    ctx.fillStyle='#111111';
    ctx.textAlign='center';
    ctx.fillText(cap.text,pw/2,cy);
  }
  ctx.restore();
}
function drawOverlays(ctx,t,duration,pw,ph,style){var s=STYLES[style];overlays.forEach(function(o){if(!o.text)return;var show=(o.timing==='full')||(o.timing==='start'&&t<3)||(o.timing==='end'&&t>duration-3);if(!show)return;ctx.save();var ofs=Math.round(pw*0.046);ctx.font='bold '+ofs+'px Arial';var tw=ctx.measureText(o.text).width+24;var ox=(pw-tw)/2;var oy=o.position==='top'?ph*0.05:o.position==='middle'?ph*0.46:ph*0.88;ctx.fillStyle='rgba(0,0,0,0.75)';if(ctx.roundRect)ctx.roundRect(ox,oy,tw,ofs+18,7);else ctx.rect(ox,oy,tw,ofs+18);ctx.fill();ctx.fillStyle=s.accentColor;ctx.textAlign='center';ctx.fillText(o.text,pw/2,oy+ofs+2);ctx.restore();});}

// ── FIXED music fetch with timeout ────────────────────────────────
async function fetchMusicWithTimeout(url,ms){
  ms=ms||6000;
  return new Promise(async function(resolve){
    var done=false;
    var tid=setTimeout(function(){if(!done){done=true;resolve(null);}},ms);
    try{
      var r=await fetch(url);
      var buf=await r.arrayBuffer();
      if(!done){done=true;clearTimeout(tid);resolve(buf);}
    }catch(e){
      if(!done){done=true;clearTimeout(tid);resolve(null);}
    }
  });
}

// ── Core renderer ─────────────────────────────────────────────────
async function renderVideo(clipDefs,platform,style,captions,musicBuf,musicVol){
  var p=PLATFORMS[platform],s=STYLES[style];
  var canvas=document.getElementById('editCanvas');canvas.width=p.w;canvas.height=p.h;canvas.style.display='block';
  var ctx=canvas.getContext('2d');
  var audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')await audioCtx.resume();
  var dest=audioCtx.createMediaStreamDestination();
  var canvasStream=canvas.captureStream(25);
  dest.stream.getAudioTracks().forEach(function(t){canvasStream.addTrack(t);});
  var mimeType=MediaRecorder.isTypeSupported('video/webm;codecs=vp8')?'video/webm;codecs=vp8':'video/webm';
  var chunks=[];
  var recorder=new MediaRecorder(canvasStream,{mimeType:mimeType,videoBitsPerSecond:2500000});
  recorder.ondataavailable=function(e){if(e.data&&e.data.size>0)chunks.push(e.data);};
  recorder.start(200);
  var musicSrc=null;
  if(musicBuf){try{var decoded=await audioCtx.decodeAudioData(musicBuf.slice(0));musicSrc=audioCtx.createBufferSource();musicSrc.buffer=decoded;musicSrc.loop=true;var mg=audioCtx.createGain();mg.gain.value=musicVol;musicSrc.connect(mg);mg.connect(dest);musicSrc.start();}catch(e){console.warn('Music decode:',e);}}
  // Intro card
  var introText=document.getElementById('introText').value||'ImpactGrid Content Agency';
  await new Promise(function(res){var start=performance.now(),dur=2500;function di(){var prog=Math.min(1,(performance.now()-start)/dur);ctx.fillStyle=s.introBg;ctx.fillRect(0,0,p.w,p.h);ctx.strokeStyle=s.accentColor;ctx.lineWidth=1;ctx.globalAlpha=0.1;for(var l=1;l<8;l++){ctx.beginPath();ctx.moveTo(0,p.h*l/8);ctx.lineTo(p.w,p.h*l/8);ctx.stroke();ctx.beginPath();ctx.moveTo(p.w*l/8,0);ctx.lineTo(p.w*l/8,p.h);ctx.stroke();}ctx.globalAlpha=1;var fs1=Math.round(p.w*0.03);ctx.fillStyle=s.accentColor;ctx.font='bold '+fs1+'px Arial';ctx.textAlign='center';ctx.fillText('IMPACTGRID CONTENT AGENCY',p.w/2,p.h*0.44);ctx.fillStyle=s.accentColor;ctx.globalAlpha=0.4;ctx.fillRect(p.w*0.28,p.h*0.46,p.w*0.44,2);ctx.globalAlpha=1;var fs2=Math.round(p.w*0.05);ctx.fillStyle=s.introColor;ctx.font='bold '+fs2+'px Arial';var words=introText.split(' '),lines=[],line='';words.forEach(function(w){var test=line?line+' '+w:w;if(ctx.measureText(test).width>p.w*0.8&&line){lines.push(line);line=w;}else line=test;});if(line)lines.push(line);lines.forEach(function(ln,i){ctx.fillText(ln,p.w/2,p.h*0.52+(i-(lines.length-1)/2)*fs2*1.3);});if(prog<0.2){ctx.fillStyle='rgba(0,0,0,'+(1-prog/0.2)+')';ctx.fillRect(0,0,p.w,p.h);}if(prog>0.8){ctx.fillStyle='rgba(0,0,0,'+((prog-0.8)/0.2)+')';ctx.fillRect(0,0,p.w,p.h);}if(prog<1)requestAnimationFrame(di);else res();}requestAnimationFrame(di);});
  // Clips
  var pos=document.getElementById('captionPos').value;
  for(var ci=0;ci<clipDefs.length;ci++){var def=clipDefs[ci];var clipUrl=URL.createObjectURL(def.file);await new Promise(function(resolve){var vid=document.createElement('video');vid.src=clipUrl;vid.playsInline=true;vid.preload='auto';vid.playbackRate=def.speed||1;var animFrame=null,done=false,safetyTimer=null,captionIdx=0;function finish(){if(done)return;done=true;if(safetyTimer)clearTimeout(safetyTimer);cancelAnimationFrame(animFrame);vid.pause();URL.revokeObjectURL(clipUrl);resolve();}vid.onloadedmetadata=function(){var trimIn=def.trimIn||0,trimOut=def.trimOut||vid.duration;vid.currentTime=trimIn;var duration=trimOut-trimIn;safetyTimer=setTimeout(finish,(duration*1000/def.speed||20000)+8000);try{var vsrc=audioCtx.createMediaElementSource(vid);var sg=audioCtx.createGain();sg.gain.value=def.muted?0:(musicBuf?0.8:1);vsrc.connect(sg);sg.connect(dest);}catch(e){}function drawFrame(){if(done)return;var t=vid.currentTime-trimIn;if(vid.ended||vid.currentTime>=trimOut){finish();return;}
              // Get active markers for this clip at time t
              var clipMs=vdMarkers.filter(function(m){return m.clipIdx===ci;});
              var activeGrade=null,zoomScale=1,isBeatDrop=false;
              clipMs.forEach(function(m){
                var mt=m.time;
                if(t>=mt&&t<mt+2){
                  if(m.type==='grade'||m.type==='cinematic') activeGrade='contrast(1.3) brightness(0.85) saturate(0.55)';
                  if(m.type==='grade2'||m.type==='vibrant') activeGrade='contrast(1.06) brightness(1.1) saturate(1.4)';
                  if(m.type==='zoom') zoomScale=1+0.18*Math.min(1,(2-(t-mt)));
                  if(m.type==='zoomout') zoomScale=0.85+0.15*Math.min(1,(t-mt));
                  if(m.type==='beatdrop'&&t<mt+0.5) isBeatDrop=true;
                }
              });
              // Check for endclip marker — stop this clip early
              var endMarker=clipMs.find(function(m){return m.type==='endclip'&&m.time>trimIn&&m.time<=vid.currentTime;});
              if(endMarker){finish();return;}
              // Check for B-roll cut — if we're in a B-roll window, draw image instead
              var activeBroll=brollQueue.find(function(b){return b.clipIdx===ci&&vid.currentTime>=b.time&&vid.currentTime<b.time+b.duration;});
              if(activeBroll){
                // Draw B-roll image frame
                var bimg=activeBroll._img;
                if(!bimg){
                  bimg=new Image();bimg.crossOrigin='anonymous';bimg.src=activeBroll.imageUrl;activeBroll._img=bimg;
                }
                ctx.save();ctx.filter=s.filter;
                if(bimg.complete&&bimg.naturalWidth){
                  var bir=bimg.width/bimg.height,bcr=p.w/p.h;var bsw,bsh,bsx,bsy;
                  if(bir>bcr){bsh=bimg.height;bsw=bsh*bcr;bsx=(bimg.width-bsw)/2;bsy=0;}else{bsw=bimg.width;bsh=bsw/bcr;bsy=(bimg.height-bsh)/2;bsx=0;}
                  ctx.drawImage(bimg,bsx,bsy,bsw,bsh,0,0,p.w,p.h);
                }else{ctx.fillStyle='#111';ctx.fillRect(0,0,p.w,p.h);}
                ctx.restore();
                // B-roll keyword label at bottom
                var bkw=activeBroll.keyword;
                ctx.save();ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,p.h-Math.round(p.w*0.06)-12,p.w,Math.round(p.w*0.06)+12);
                ctx.fillStyle='rgba(201,160,48,.9)';ctx.font='bold '+Math.round(p.w*0.028)+'px Arial';ctx.textAlign='center';ctx.fillText(bkw.toUpperCase(),p.w/2,p.h-10);ctx.restore();
                animFrame=requestAnimationFrame(drawFrame);return;
              }
              // Check fade in/out
              var fadeAlpha=1;
              clipMs.forEach(function(m){
                if(m.type==='fadeout'&&t>=m.time&&t<m.time+1) fadeAlpha=Math.max(0,1-(t-m.time));
                if(m.type==='fadein'&&t>=m.time&&t<m.time+1) fadeAlpha=Math.min(1,(t-m.time));
              });
              ctx.save();
              var appliedFilter=activeGrade||s.filter;
              if(isBeatDrop) appliedFilter='contrast(1.5) saturate(1.8) brightness(1.1)';
              ctx.filter=appliedFilter;
              var vr=vid.videoWidth/vid.videoHeight,cr=p.w/p.h;var sw,sh,sx,sy;
              if(vr>cr){sh=vid.videoHeight;sw=sh*cr;sx=(vid.videoWidth-sw)/2;sy=0;}else{sw=vid.videoWidth;sh=sw/cr;sy=(vid.videoHeight-sh)/2;sx=0;}
              if(zoomScale!==1){ctx.translate(p.w/2,p.h/2);ctx.scale(zoomScale,zoomScale);ctx.translate(-p.w/2,-p.h/2);}
              ctx.drawImage(vid,sx,sy,sw,sh,0,0,p.w,p.h);
              ctx.restore();
              // Fade overlay
              if(fadeAlpha<1){ctx.fillStyle='rgba(0,0,0,'+(1-fadeAlpha)+')';ctx.fillRect(0,0,p.w,p.h);}
              // Flash overlay
              var flashMarker=clipMs.find(function(m){return m.type==='flash'&&t>=m.time&&t<m.time+0.25;});
              if(flashMarker){ctx.fillStyle='rgba(255,255,255,'+(1-(t-flashMarker.time)/0.25)+')';ctx.fillRect(0,0,p.w,p.h);}
              ctx.save();ctx.globalAlpha=0.5;ctx.fillStyle='#fff';ctx.font='bold '+Math.round(p.w*0.024)+'px Arial';ctx.textAlign='right';ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=4;ctx.fillText('ImpactGrid',p.w-12,Math.round(p.w*0.024)+10);ctx.restore();if(captions.length){while(captionIdx<captions.length-1&&captions[captionIdx+1].t<=t+0.5)captionIdx++;var cap=captions[captionIdx];if(cap&&t-cap.t<3.5)drawCaption(ctx,cap,t,p.w,p.h,_capStyle,style,pos);}drawOverlays(ctx,t,duration,p.w,p.h,style);if(duration>0){ctx.fillStyle=s.accentColor;ctx.globalAlpha=0.55;ctx.fillRect(0,p.h-4,p.w*(t/duration),4);ctx.globalAlpha=1;}animFrame=requestAnimationFrame(drawFrame);}vid.onended=finish;vid.onerror=finish;audioCtx.resume().then(function(){vid.play().then(function(){animFrame=requestAnimationFrame(drawFrame);}).catch(finish);}).catch(finish);};vid.onerror=finish;vid.load();});}
  await new Promise(function(res){var st=performance.now();function fade(){var pr=Math.min(1,(performance.now()-st)/500);ctx.fillStyle='rgba(0,0,0,'+pr+')';ctx.fillRect(0,0,p.w,p.h);if(pr<1)requestAnimationFrame(fade);else res();}requestAnimationFrame(fade);});
  await wait(300);
  return new Promise(function(resolve){recorder.onstop=function(){if(musicSrc)try{musicSrc.stop();}catch(e){}audioCtx.close();canvas.style.display='none';resolve(new Blob(chunks,{type:mimeType}));};recorder.stop();});
}

// ── MAIN RENDER — fixed 25% hang ─────────────────────────────────
async function startRender(){
  if(!clips.length){toast('Add at least one clip','err');return;}
  var fmts=Object.keys(_formats).filter(function(k){return _formats[k];});
  if(!fmts.length){toast('Select at least one platform','err');return;}
  // Ensure mic is listening during render for live captions
  if(!_autoCapOn) autoCapStart();
  // Save prefs before rendering
  savePref('style',_style);savePref('capStyle',_capStyle);
  document.getElementById('renderSection').style.display='none';
  document.getElementById('stProc').style.display='block';
  document.getElementById('stDone').style.display='none';
  try{
    setProgress(2,'Getting captions...','Reading recorded captions...');
    var captions=await getCaptions();
    setProgress(15,'Captions ready',captions.length+' segments');

    // FIXED: music with 6s timeout — will never hang at 25% again
    var musicBuf=null;
    var musicVol=parseInt(document.getElementById('musicVol').value)/100;
    if(_music!=='none'&&_music!=='upload'){
      setProgress(18,'Loading music...','Trying to fetch track (6s timeout)...');
      var mUrl=MUSIC_URLS[_music];
      if(mUrl){
        musicBuf=await fetchMusicWithTimeout(mUrl,6000);
        if(!musicBuf)toast('Music unavailable — continuing without','err');
      }
      setProgress(26,'Ready to render','');
    } else if(_music==='upload'){
      var mf=document.getElementById('musicFile').files[0];
      if(mf){var fr=new FileReader();musicBuf=await new Promise(function(r){fr.onload=function(e){r(e.target.result);};fr.readAsArrayBuffer(mf);});}
      setProgress(26,'Ready to render','');
    } else {
      setProgress(26,'Ready to render','');
    }

    var clipDefs=clips.map(function(c){return{file:c.file,trimIn:c.trimIn||0,trimOut:c.trimOut||null,speed:c.speed||1,muted:!!c.muted};});
    var results=[];
    for(var fi=0;fi<fmts.length;fi++){
      var fmt=fmts[fi],basePct=26+Math.round(fi/fmts.length*70);
      setProgress(basePct,'Rendering '+PLATFORMS[fmt].name+'...','Applying '+STYLES[_style].name+' style...');
      var blob=await renderVideo(clipDefs,fmt,_style,captions,musicBuf,musicVol);
      results.push({fmt:fmt,blob:blob,url:URL.createObjectURL(blob),platform:PLATFORMS[fmt]});
      setProgress(basePct+Math.round(70/fmts.length),'Done: '+PLATFORMS[fmt].name,'');
      await wait(200);
    }
    setProgress(100,'All done!','');await wait(400);showResults(results);
    showSuggestions();
  }catch(err){
    console.error(err);document.getElementById('stProc').style.display='none';document.getElementById('renderSection').style.display='block';
    toast('Error: '+(err.message||'Something went wrong'),'err');
  }
}

function showResults(results){
  document.getElementById('stProc').style.display='none';document.getElementById('stDone').style.display='block';
  var s=STYLES[_style];
  document.getElementById('resultCards').innerHTML=results.map(function(r){
    var isVert=r.fmt==='reel'||r.fmt==='tiktok';var aspect=isVert?'9/16':r.fmt==='youtube'?'16/9':'1/1';var sizeMB=(r.blob.size/1024/1024).toFixed(1);
    return '<div class="result-card"><div style="position:relative;background:#000"><video src="'+r.url+'" controls preload="metadata" style="width:100%;aspect-ratio:'+aspect+';object-fit:cover;display:block;max-height:360px"></video><div style="position:absolute;top:7px;left:7px;background:rgba(0,0,0,.75);border-radius:4px;padding:3px 7px;font-size:.59rem;font-weight:700;color:#fff">'+r.platform.emoji+' '+r.platform.name+'</div></div><div style="padding:10px 12px"><p style="font-size:.67rem;color:var(--dim);margin-bottom:7px">'+sizeMB+' MB · '+s.name+'</p><a href="'+r.url+'" download="impactgrid_'+r.fmt+'_'+_style+'.webm" class="dl-btn">&#8595; Download '+r.platform.name+'</a><button onclick="captureThumbnailFromResult(\''+r.fmt+'\')" class="dl-btn-sec">&#128247; Save Thumbnail</button></div></div>';
  }).join('');
  toast('Done! '+results.length+' videos ready','ok');
}
function captureThumbnailFromResult(fmt){var a=document.querySelector('[download*="'+fmt+'"]');if(!a)return;var vid=a.closest('.result-card').querySelector('video');if(!vid)return;var p=PLATFORMS[fmt];var tc=document.createElement('canvas');tc.width=p.w;tc.height=p.h;var tctx=tc.getContext('2d');tctx.drawImage(vid,0,0,p.w,p.h);tc.toBlob(function(blob){var a2=document.createElement('a');a2.href=URL.createObjectURL(blob);a2.download='thumb_'+fmt+'_'+_style+'.jpg';a2.click();toast('Thumbnail saved!','ok');},'image/jpeg',0.92);}
function resetAll(){document.getElementById('stDone').style.display='none';document.getElementById('renderSection').style.display='block';document.getElementById('stProc').style.display='none';}

// Show suggestions on load if history exists
showSuggestions();
