/* ═══════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — portfolio.js
   Portfolio builder: preview, publish, copy link
   Social: Instagram + LinkedIn manual input only
═══════════════════════════════════════════════ */

var pfState = {
  theme: 'dark',
  platforms: [],
  published: false,
  publishedSlug: '',
  themeConfigs: {
    dark: {
      bg: 'linear-gradient(160deg,#1a1814 0%,#2a2318 100%)',
      heroBg: '#1a1814',
      accent: '#c97e08',
      accentGlow: 'rgba(201,126,8,0.3)',
      text: '#fff',
      sub: 'rgba(255,255,255,0.55)',
      border: 'rgba(255,255,255,0.08)',
      linkBg: 'rgba(255,255,255,0.06)',
      linkBorder: 'rgba(255,255,255,0.1)',
      avatarBg: 'linear-gradient(135deg,#c97e08,#a86505)',
      statBorder: 'rgba(255,255,255,0.06)',
      rateBg: 'rgba(255,255,255,0.04)',
      ctaBg: 'linear-gradient(135deg,#c97e08,#a86505)',
      ctaText: '#fff'
    },
    navy: {
      bg: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 100%)',
      heroBg: '#0f172a',
      accent: '#4f8ef7',
      accentGlow: 'rgba(79,142,247,0.3)',
      text: '#fff',
      sub: 'rgba(255,255,255,0.55)',
      border: 'rgba(255,255,255,0.08)',
      linkBg: 'rgba(255,255,255,0.05)',
      linkBorder: 'rgba(255,255,255,0.1)',
      avatarBg: 'linear-gradient(135deg,#2d6edb,#4f8ef7)',
      statBorder: 'rgba(255,255,255,0.06)',
      rateBg: 'rgba(255,255,255,0.04)',
      ctaBg: 'linear-gradient(135deg,#2d6edb,#4f8ef7)',
      ctaText: '#fff'
    },
    clean: {
      bg: 'linear-gradient(160deg,#f8fafc 0%,#e2e8f0 100%)',
      heroBg: '#f8fafc',
      accent: '#2d6edb',
      accentGlow: 'rgba(45,110,219,0.2)',
      text: '#0d1017',
      sub: '#4a5068',
      border: 'rgba(0,0,0,0.07)',
      linkBg: '#ffffff',
      linkBorder: 'rgba(0,0,0,0.08)',
      avatarBg: 'linear-gradient(135deg,#2d6edb,#4f8ef7)',
      statBorder: 'rgba(0,0,0,0.07)',
      rateBg: 'rgba(0,0,0,0.03)',
      ctaBg: 'linear-gradient(135deg,#2d6edb,#4f8ef7)',
      ctaText: '#fff'
    },
    forest: {
      bg: 'linear-gradient(160deg,#14532d 0%,#166534 50%,#15803d 100%)',
      heroBg: '#14532d',
      accent: '#4ade80',
      accentGlow: 'rgba(74,222,128,0.3)',
      text: '#fff',
      sub: 'rgba(255,255,255,0.6)',
      border: 'rgba(255,255,255,0.1)',
      linkBg: 'rgba(255,255,255,0.07)',
      linkBorder: 'rgba(255,255,255,0.12)',
      avatarBg: 'linear-gradient(135deg,#0fa876,#4ade80)',
      statBorder: 'rgba(255,255,255,0.08)',
      rateBg: 'rgba(255,255,255,0.05)',
      ctaBg: 'linear-gradient(135deg,#0fa876,#4ade80)',
      ctaText: '#fff'
    }
  }
};

function startPortfolioBuilder() {
  var setup = document.getElementById('pfSetup');
  var builder = document.getElementById('pfBuilder');
  if (setup) setup.classList.remove('show');
  if (builder) builder.classList.add('show');
  var t = document.getElementById('topbarTitle'); if (t) t.textContent = 'Portfolio Builder';
  updatePreview();
}

function resetPortfolio() {
  var setup = document.getElementById('pfSetup');
  var builder = document.getElementById('pfBuilder');
  var published = document.getElementById('pfPublished');
  if (setup) setup.classList.add('show');
  if (builder) builder.classList.remove('show');
  if (published) published.classList.remove('show');
  var t = document.getElementById('topbarTitle'); if (t) t.textContent = 'Portfolio';
}

function togglePlat(btn, id, icon, label) {
  btn.classList.toggle('on');
  if (btn.classList.contains('on')) {
    if (!pfState.platforms.find(function(p){ return p.id === id; }))
      pfState.platforms.push({ id: id, icon: icon, label: label });
  } else {
    pfState.platforms = pfState.platforms.filter(function(p){ return p.id !== id; });
  }
  updatePreview();
}

function setTheme(el, themeId) {
  pfState.theme = themeId;
  document.querySelectorAll('.pf-theme-opt').forEach(function(o){ o.classList.remove('active'); });
  el.classList.add('active');
  updatePreview();
}

function addCustomLink() {
  var container = document.getElementById('pfLinksContainer');
  var row = document.createElement('div');
  row.className = 'pf-link-row';
  row.innerHTML = '<span class="pf-link-prefix">🔗</span><input class="form-input" placeholder="https://…" style="flex:1" oninput="updatePreview()"/>';
  container.appendChild(row);
}

function updateSEOPreview(name, niche, slug) {
  name = name || 'Your Name';
  niche = niche || 'Content Creator';
  slug = slug || 'yourcreatorname';
  var urlEl = document.getElementById('pfSeoUrl');
  var titleEl = document.getElementById('pfSeoTitle');
  var descEl = document.getElementById('pfSeoDesc');
  var platforms = pfState.platforms.map(function(p){ return p.label; }).join(' · ') || 'TikTok · YouTube · Instagram';
  if (urlEl) urlEl.textContent = 'impactgrid.app/p/' + slug;
  if (titleEl) titleEl.textContent = name + ' — ' + niche + ' | ImpactGrid';
  if (descEl) descEl.textContent = niche + ' creator. ' + platforms + '. View stats, media kit, and contact for brand deals. Based in UK.';
  var pfUrlEl = document.getElementById('pfUrl');
  if (pfUrlEl) pfUrlEl.textContent = 'impactgrid.app/p/' + slug;
}

function pfEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function updatePreview() {
  var phone = document.getElementById('pfPhone');
  if (!phone) return;

  var name       = (document.getElementById('pfName') || {}).value || 'Your Name';
  var niche      = (document.getElementById('pfNiche') || {}).value || 'Content Creator';
  var bio        = (document.getElementById('pfBio') || {}).value || 'Creating content that connects and converts.';
  var followers  = (document.getElementById('pfFollowers') || {}).value || '';
  var engagement = (document.getElementById('pfEngagement') || {}).value || '';
  var views      = (document.getElementById('pfViews') || {}).value || '';
  var rateStory  = (document.getElementById('pfRateStory') || {}).value || '';
  var ratePost   = (document.getElementById('pfRatePost') || {}).value || '';
  var rateVideo  = (document.getElementById('pfRateVideo') || {}).value || '';
  var ratePkg    = (document.getElementById('pfRatePackage') || {}).value || '';

  var slug = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'creator';
  updateSEOPreview(name, niche, slug);

  var cfg = pfState.themeConfigs[pfState.theme] || pfState.themeConfigs.dark;
  var initials = name.split(' ').map(function(w){ return w[0]||''; }).join('').toUpperCase().slice(0,2) || 'YN';

  // Platforms
  var platHtml = (pfState.platforms.length ? pfState.platforms : [{icon:'🎵'},{icon:'▶️'},{icon:'📸'}])
    .map(function(p){
      return '<div class="pfp-plat" style="background:'+cfg.linkBg+';border:1px solid '+cfg.linkBorder+';">'+p.icon+'</div>';
    }).join('');

  // Stats
  var hasStats = followers || engagement || views;
  var statsHtml = hasStats
    ? '<div class="pfp-stats" style="border-color:'+cfg.statBorder+';">' +
        '<div class="pfp-stat" style="border-color:'+cfg.statBorder+';"><div class="pfp-stat-val" style="color:'+cfg.accent+'">'+(pfEsc(followers||'—'))+'</div><div class="pfp-stat-lbl" style="color:'+cfg.sub+'">FOLLOWERS</div></div>' +
        '<div class="pfp-stat" style="border-color:'+cfg.statBorder+';"><div class="pfp-stat-val" style="color:'+cfg.accent+'">'+(pfEsc(engagement||'—'))+'</div><div class="pfp-stat-lbl" style="color:'+cfg.sub+'">ENGAGEMENT</div></div>' +
        '<div class="pfp-stat" style="border-color:'+cfg.statBorder+';"><div class="pfp-stat-val" style="color:'+cfg.accent+'">'+(pfEsc(views||'—'))+'</div><div class="pfp-stat-lbl" style="color:'+cfg.sub+'">VIEWS/MO</div></div>' +
      '</div>'
    : '';

  // Links (from link inputs)
  var linkInputs = document.querySelectorAll('#pfLinksContainer input');
  var defaultLinks = [
    {icon:'🎵',label:'TikTok'},
    {icon:'▶️',label:'YouTube'},
    {icon:'📸',label:'Instagram'},
    {icon:'💼',label:'LinkedIn'},
    {icon:'📧',label:'Contact'}
  ];
  var linksHtml = '';
  linkInputs.forEach(function(inp, i) {
    var val = inp.value.trim();
    var def = defaultLinks[i] || {icon:'🔗', label:'Link'};
    if (val || i < 3) {
      linksHtml += '<div class="pfp-link-item" style="background:'+cfg.linkBg+';border-color:'+cfg.linkBorder+';color:'+cfg.text+';">' +
        '<span class="pfp-link-icon">'+def.icon+'</span>' +
        pfEsc(def.label) +
        '<span class="pfp-link-arrow" style="color:'+cfg.sub+'">→</span></div>';
    }
  });

  // Rate card
  var hasRates = rateStory || ratePost || rateVideo || ratePkg;
  var ratesHtml = '';
  if (hasRates) {
    ratesHtml = '<div class="pfp-rates"><div class="pfp-rates-title" style="color:'+cfg.sub+'">RATE CARD</div>';
    if (rateStory) ratesHtml += '<div class="pfp-rate-row" style="background:'+cfg.rateBg+';"><span class="pfp-rate-type" style="color:'+cfg.sub+'">Story / Short</span><span class="pfp-rate-price" style="color:'+cfg.accent+'">'+pfEsc(rateStory)+'</span></div>';
    if (ratePost)  ratesHtml += '<div class="pfp-rate-row" style="background:'+cfg.rateBg+';"><span class="pfp-rate-type" style="color:'+cfg.sub+'">Dedicated Post</span><span class="pfp-rate-price" style="color:'+cfg.accent+'">'+pfEsc(ratePost)+'</span></div>';
    if (rateVideo) ratesHtml += '<div class="pfp-rate-row" style="background:'+cfg.rateBg+';"><span class="pfp-rate-type" style="color:'+cfg.sub+'">Long-form Video</span><span class="pfp-rate-price" style="color:'+cfg.accent+'">'+pfEsc(rateVideo)+'</span></div>';
    if (ratePkg)   ratesHtml += '<div class="pfp-rate-row" style="background:'+cfg.rateBg+';"><span class="pfp-rate-type" style="color:'+cfg.sub+'">Monthly Package</span><span class="pfp-rate-price" style="color:'+cfg.accent+'">'+pfEsc(ratePkg)+'</span></div>';
    ratesHtml += '</div>';
  }

  phone.innerHTML =
    '<div style="background:'+cfg.bg+';min-height:560px;border-radius:24px;">' +
      '<div class="pfp-hero" style="background:'+cfg.heroBg+';border-radius:24px 24px 0 0;">' +
        '<div class="pfp-avatar-ring" style="background:'+cfg.accentGlow+';padding:3px;">' +
          '<div class="pfp-avatar" style="background:'+cfg.avatarBg+';">'+pfEsc(initials)+'</div>' +
        '</div>' +
        '<div class="pfp-name" style="color:'+cfg.text+';">'+pfEsc(name)+'</div>' +
        '<div class="pfp-niche-badge" style="background:'+cfg.linkBg+';color:'+cfg.accent+';border:1px solid '+cfg.linkBorder+';">'+pfEsc(niche)+'</div>' +
        '<div class="pfp-bio" style="color:'+cfg.sub+';">'+pfEsc(bio)+'</div>' +
        '<div class="pfp-plats">'+platHtml+'</div>' +
      '</div>' +
      statsHtml +
      '<div class="pfp-links" style="background:'+cfg.heroBg+';">'+linksHtml+'</div>' +
      ratesHtml +
      '<div class="pfp-cta" style="background:'+cfg.heroBg+';">' +
        '<div class="pfp-cta-btn" style="background:'+cfg.ctaBg+';color:'+cfg.ctaText+';">Work With Me →</div>' +
      '</div>' +
      '<div class="pfp-footer" style="background:'+cfg.heroBg+';border-color:'+cfg.statBorder+';color:'+cfg.sub+';">Made with ImpactGrid ✦</div>' +
    '</div>';
}

/* ── AI Bio Generator ── */
async function generateAIBio() {
  var name      = (document.getElementById('pfName')||{}).value || '';
  var niche     = (document.getElementById('pfNiche')||{}).value || '';
  var followers = (document.getElementById('pfFollowers')||{}).value || '';
  var platforms = pfState.platforms.map(function(p){ return p.label; }).join(', ') || 'TikTok, YouTube, Instagram';

  if (!name && !niche) {
    showToastPF('Fill in your name and niche first.');
    return;
  }

  var btn = document.getElementById('pfAiBioBtn');
  btn.disabled = true; btn.textContent = '✨ Writing…';

  try {
    var prompt = 'Write a short, punchy creator bio for a link-in-bio portfolio page. It should be 1-2 sentences, SEO-friendly, and written in first person. Make it sound human, not corporate.\n\nName: ' + (name||'Creator') + '\nNiche: ' + (niche||'Content Creator') + '\nPlatforms: ' + platforms + (followers ? '\nFollowers: ' + followers : '') + '\n\nRespond with ONLY the bio text. No quotes. No extra text.';
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
    });
    var data = await res.json();
    var bio = data.content.map(function(i){ return i.text||''; }).join('').trim();
    var bioEl = document.getElementById('pfBio');
    if (bioEl) { bioEl.value = bio; updatePreview(); }
    showToastPF('✨ Bio written by Dijo!');
  } catch(e) {
    showToastPF('Could not connect. Try again.');
  }

  btn.disabled = false; btn.textContent = '✨ Write with Dijo';
}

/* ── PUBLISH — working publish with success state ── */
function publishPortfolio() {
  var name = (document.getElementById('pfName')||{}).value || 'creator';
  var niche = (document.getElementById('pfNiche')||{}).value || 'Creator';
  var bio   = (document.getElementById('pfBio')||{}).value || '';
  var slug  = name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'creator';
  var url   = 'https://impactgrid.app/p/' + slug;

  pfState.published = true;
  pfState.publishedSlug = slug;

  // Switch to published state
  var builder   = document.getElementById('pfBuilder');
  var published = document.getElementById('pfPublished');
  if (builder)   builder.classList.remove('show');
  if (published) published.classList.add('show');

  // Populate the published card
  var pubName  = document.getElementById('pfPubName');
  var pubNiche = document.getElementById('pfPubNiche');
  var pubLink  = document.getElementById('pfPubLink');
  if (pubName)  pubName.textContent  = name;
  if (pubNiche) pubNiche.textContent = niche;
  if (pubLink)  pubLink.textContent  = url;

  // Update title
  var t = document.getElementById('topbarTitle'); if (t) t.textContent = 'Portfolio — Published ✓';

  // Auto-copy
  try { navigator.clipboard.writeText(url); } catch(e) {}
  showToastPF('🚀 Published! Link copied to clipboard.');
}

function copyPublishedLink() {
  var el = document.getElementById('pfPubLink');
  var url = el ? el.textContent : ('https://impactgrid.app/p/' + pfState.publishedSlug);
  try { navigator.clipboard.writeText(url); showToastPF('✓ Link copied!'); } catch(e) {}
}

function copyPortfolioUrl() {
  var url = (document.getElementById('pfUrl')||{}).textContent || '';
  var full = url.startsWith('http') ? url : 'https://' + url;
  try { navigator.clipboard.writeText(full); showToastPF('✓ Link copied!'); } catch(e) {}
}

function editPortfolio() {
  var published = document.getElementById('pfPublished');
  var builder   = document.getElementById('pfBuilder');
  if (published) published.classList.remove('show');
  if (builder)   builder.classList.add('show');
  var t = document.getElementById('topbarTitle'); if (t) t.textContent = 'Portfolio Builder';
}

function showToastPF(msg) {
  if (window.showToast) { showToast(msg); return; }
  var old = document.getElementById('igToast'); if (old) old.remove();
  var t = document.createElement('div');
  t.id = 'igToast';
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:var(--text);color:var(--bg);padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:fadeIn .3s ease;pointer-events:none;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ if (t.parentNode) t.remove(); }, 3000);
}

/* Share to platform helpers */
function shareToInstagram() {
  var url = (document.getElementById('pfPubLink')||{}).textContent || '';
  try { navigator.clipboard.writeText(url); showToastPF('📸 Link copied — paste it in your Instagram bio!'); } catch(e) {}
}
function shareToLinkedIn() {
  var url = (document.getElementById('pfPubLink')||{}).textContent || '';
  var shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  window.open(shareUrl, '_blank', 'width=600,height=500');
}
