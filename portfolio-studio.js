/* ═══════════════════════════════════════════════════════════
   IMPACTGRID — Portfolio Studio
   portfolio-studio.js
   ═══════════════════════════════════════════════════════════ */

/* ── CONFIG — swap in your own values ── */
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
const AI_MODEL     = 'claude-sonnet-4-20250514';

/* ── SESSION ID (anonymous, persisted) ── */
let SESSION_ID = localStorage.getItem('ig_session');
if (!SESSION_ID) {
  SESSION_ID = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('ig_session', SESSION_ID);
}

/* ── STATE ── */
let psState = {
  currentStep: 1,
  selectedTheme: 'dark',
  portfolios: [],         // loaded from Supabase
  activePortfolio: null,  // the portfolio being edited
  heroMedia: [],          // [{type,url,credit}]
  services: [],
  projects: [],
  testimonials: [],
  generating: false,
};

const THEMES = {
  dark:     { bg:'#1a1814', accent:'#c97e08', text:'#f0ede8', sub:'rgba(240,237,232,0.55)', surface:'#23201a', border:'rgba(255,255,255,0.07)', gradient:'linear-gradient(160deg,#1a1814 0%,#2a2318 100%)' },
  navy:     { bg:'#0f172a', accent:'#4f8ef7', text:'#f0ede8', sub:'rgba(240,237,232,0.55)', surface:'#162035', border:'rgba(255,255,255,0.07)', gradient:'linear-gradient(160deg,#0f172a 0%,#1e3a5f 100%)' },
  clean:    { bg:'#f8fafc', accent:'#2d6edb', text:'#0d1017', sub:'#4a5068',                surface:'#ffffff', border:'rgba(0,0,0,0.07)',          gradient:'linear-gradient(160deg,#f8fafc 0%,#e2e8f0 100%)' },
  midnight: { bg:'#080810', accent:'#818cf8', text:'#e2e8f0', sub:'rgba(226,232,240,0.5)',  surface:'#10101e', border:'rgba(255,255,255,0.06)',     gradient:'linear-gradient(160deg,#080810 0%,#0d0d22 100%)' },
  rose:     { bg:'#1a0d12', accent:'#f43f80', text:'#fce7ef', sub:'rgba(252,231,239,0.55)', surface:'#260d16', border:'rgba(255,255,255,0.07)',     gradient:'linear-gradient(160deg,#1a0d12 0%,#2d0f1e 100%)' },
  forest:   { bg:'#14532d', accent:'#4ade80', text:'#f0fdf4', sub:'rgba(240,253,244,0.6)',  surface:'#1a6635', border:'rgba(255,255,255,0.08)',     gradient:'linear-gradient(160deg,#14532d 0%,#166534 100%)' },
};

/* ══════════════════════════════════════════
   SCREEN NAVIGATION
══════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll('.ps-screen').forEach(s => {
    s.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function confirmBackToDash() {
  if (confirm('Go back to portfolios? Unsaved changes will be lost.')) {
    showScreen('screenDash');
  }
}

/* ══════════════════════════════════════════
   SUPABASE HELPERS
══════════════════════════════════════════ */
async function sbFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'x-session-id': SESSION_ID,
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(SUPABASE_URL + '/rest/v1' + path, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadPortfolios() {
  try {
    const data = await sbFetch(
      `/portfolios?user_session=eq.${SESSION_ID}&order=created_at.desc&select=*`
    );
    psState.portfolios = data || [];
    renderDashGrid();
  } catch (e) {
    console.warn('Could not load portfolios:', e.message);
    psState.portfolios = [];
    renderDashGrid();
  }
}

async function savePortfolioToDB(pf) {
  const exists = pf.id;
  try {
    if (exists) {
      await sbFetch(
        `/portfolios?id=eq.${pf.id}`,
        'PATCH',
        pf
      );
    } else {
      const created = await sbFetch('/portfolios', 'POST', pf);
      if (created && created[0]) pf.id = created[0].id;
    }
    showToast('✓ Saved');
    return true;
  } catch (e) {
    showToast('Save failed — check Supabase config');
    console.error(e);
    return false;
  }
}

/* ══════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════ */
function renderDashGrid() {
  const grid   = document.getElementById('dashGrid');
  const empty  = document.getElementById('dashEmpty');
  const count  = document.getElementById('dashCount');
  if (!grid) return;

  const pfs = psState.portfolios;
  count.textContent = pfs.length + ' portfolio' + (pfs.length !== 1 ? 's' : '');

  // Remove old cards (keep empty placeholder)
  grid.querySelectorAll('.pf-card').forEach(c => c.remove());

  if (pfs.length === 0) {
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  pfs.forEach(pf => {
    const card = document.createElement('div');
    card.className = 'pf-card';
    const thumb = pf.hero_media && pf.hero_media[0] ? pf.hero_media[0].url : '';
    card.innerHTML = `
      <div class="pf-card-thumb">
        ${thumb ? `<img src="${thumb}" alt="${pf.name}"/>` : '<div class="pf-card-thumb-placeholder">✦</div>'}
        <div class="pf-card-pub-badge ${pf.published ? 'live' : 'draft'}">${pf.published ? '● LIVE' : 'DRAFT'}</div>
      </div>
      <div class="pf-card-body">
        <div class="pf-card-name">${esc(pf.name)}</div>
        <div class="pf-card-niche">${esc(pf.niche)}</div>
      </div>
      <div class="pf-card-foot">
        <button class="pf-card-action" onclick="openPortfolio('${pf.id}','edit')">Edit</button>
        <button class="pf-card-action" onclick="openPortfolio('${pf.id}','preview')">Preview</button>
        ${pf.published
          ? `<button class="pf-card-action primary" onclick="copyLink('${pf.slug}')">Copy Link</button>`
          : `<button class="pf-card-action primary" onclick="openPortfolio('${pf.id}','publish')">Publish</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function openPortfolio(id, action) {
  const pf = psState.portfolios.find(p => p.id === id);
  if (!pf) return;
  psState.activePortfolio = JSON.parse(JSON.stringify(pf)); // deep clone
  populateBuilder(pf);
  showScreen('screenBuilder');
  if (action === 'publish') publishPortfolio();
  if (action === 'preview') setPreviewDevice('desktop');
}

function copyLink(slug) {
  const url = `https://impactgrid.app/p/${slug}`;
  navigator.clipboard.writeText(url).catch(() => {});
  showToast('✓ Link copied!');
}

/* ══════════════════════════════════════════
   ONBOARDING STEPS
══════════════════════════════════════════ */
function obValidate() {
  const name  = (document.getElementById('obName')  || {}).value || '';
  const niche = (document.getElementById('obNiche') || {}).value || '';
  const btn   = document.getElementById('obNextBtn');
  if (!btn) return;
  if (psState.currentStep === 1) btn.disabled = !(name.trim() && niche.trim());
  else btn.disabled = false;
}

function obNext() {
  const max = 4;
  if (psState.currentStep >= max) {
    startGeneration();
    return;
  }
  goToStep(psState.currentStep + 1);
}

function obBack() {
  if (psState.currentStep <= 1) return;
  goToStep(psState.currentStep - 1);
}

function goToStep(n) {
  const prev = psState.currentStep;
  psState.currentStep = n;

  // Content panels
  document.querySelectorAll('.ob-step-content').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === n);
  });

  // Step indicators
  document.querySelectorAll('.ob-step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i + 1 < n)  el.classList.add('done');
    if (i + 1 === n) el.classList.add('active');
  });

  // Step lines
  document.querySelectorAll('.ob-step-line').forEach((el, i) => {
    el.classList.toggle('done', i + 1 < n);
  });

  // Back button
  const backBtn = document.getElementById('obBackBtn');
  if (backBtn) backBtn.style.display = n > 1 ? '' : 'none';

  // Next button label
  const nextBtn = document.getElementById('obNextBtn');
  if (nextBtn) {
    nextBtn.textContent = n === 4 ? '✦ Build My Portfolio' : 'Continue →';
    nextBtn.disabled = false;
    if (n === 1) obValidate();
  }

  // Titles
  const titles = [
    'Tell Dijo about yourself',
    'Connect your platforms',
    'Add your services & work',
    'Choose your style',
  ];
  const subs = [
    'The more detail you give, the better Dijo builds.',
    'Connect the platforms you\'re active on.',
    'What do you offer? Add at least one service.',
    'Pick a visual style and let Dijo do the rest.',
  ];
  const titleEl = document.getElementById('obTitle');
  const subEl   = document.getElementById('obSub');
  if (titleEl) titleEl.textContent = titles[n - 1] || '';
  if (subEl)   subEl.textContent   = subs[n - 1]   || '';
}

/* ── Services / Projects / Testimonials rows ── */
function addServiceRow() {
  const list = document.getElementById('obServicesList');
  if (!list) return;
  const idx = list.children.length;
  const row = document.createElement('div');
  row.className = 'ob-service-row';
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">Service ${idx + 1}</span>
      <button class="ob-row-del" onclick="this.closest('.ob-service-row').remove()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Service title (e.g. Sponsored YouTube Video)"/>
    <input class="ob-input sm" placeholder="Brief description" style="margin-top:6px"/>
    <div class="ob-two-inline" style="margin-top:6px">
      <input class="ob-input sm" placeholder="Price (e.g. £800)"/>
      <input class="ob-input sm" placeholder="Icon emoji (e.g. 🎬)"/>
    </div>
  `;
  list.appendChild(row);
}

function addProjectRow() {
  const list = document.getElementById('obProjectsList');
  if (!list) return;
  const idx = list.children.length;
  const row = document.createElement('div');
  row.className = 'ob-project-row';
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">Project / Collab ${idx + 1}</span>
      <button class="ob-row-del" onclick="this.closest('.ob-project-row').remove()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Brand / project name"/>
    <input class="ob-input sm" placeholder="What you did" style="margin-top:6px"/>
    <input class="ob-input sm" placeholder="Project / case study URL (optional)" style="margin-top:6px"/>
  `;
  list.appendChild(row);
}

function addTestimonialRow() {
  const list = document.getElementById('obTestimonialsList');
  if (!list) return;
  const idx = list.children.length;
  const row = document.createElement('div');
  row.className = 'ob-testimonial-row';
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">Testimonial ${idx + 1}</span>
      <button class="ob-row-del" onclick="this.closest('.ob-testimonial-row').remove()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Their name & role (e.g. Jane Smith, Marketing Director at Gymshark)"/>
    <textarea class="ob-input sm" placeholder="What they said…" style="margin-top:6px;min-height:64px;resize:vertical"></textarea>
  `;
  list.appendChild(row);
}

/* ── Theme & colour ── */
function selectTheme(el, themeId) {
  document.querySelectorAll('#obContent4 .ob-theme-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  psState.selectedTheme = themeId;
}

function selectEditTheme(el, themeId) {
  document.querySelectorAll('#tabDesign .ob-theme-opt').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  if (psState.activePortfolio) psState.activePortfolio.theme = themeId;
  updatePreviewLive();
}

/* ══════════════════════════════════════════
   COLLECT ONBOARDING DATA
══════════════════════════════════════════ */
function collectOnboardData() {
  const g = id => (document.getElementById(id) || {}).value || '';

  // Services from rows
  const services = [];
  document.querySelectorAll('.ob-service-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0] && inputs[0].value.trim()) {
      services.push({
        title: inputs[0].value,
        description: inputs[1] ? inputs[1].value : '',
        price: inputs[2] ? inputs[2].value : '',
        icon: inputs[3] ? inputs[3].value : '✦',
      });
    }
  });

  // Projects
  const projects = [];
  document.querySelectorAll('.ob-project-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0] && inputs[0].value.trim()) {
      projects.push({
        title: inputs[0].value,
        description: inputs[1] ? inputs[1].value : '',
        url: inputs[2] ? inputs[2].value : '',
      });
    }
  });

  // Testimonials
  const testimonials = [];
  document.querySelectorAll('.ob-testimonial-row').forEach(row => {
    const inp = row.querySelector('input');
    const ta  = row.querySelector('textarea');
    if (inp && inp.value.trim()) {
      testimonials.push({ author: inp.value, quote: ta ? ta.value : '' });
    }
  });

  return {
    user_session:    SESSION_ID,
    name:            g('obName'),
    niche:           g('obNiche'),
    bio:             g('obAbout'),
    location:        g('obLocation'),
    email:           g('obEmail'),
    youtube_url:     g('obYTUrl'),
    youtube_handle:  g('obYTUrl').replace(/.*@/,'@') || '',
    tiktok_url:      g('obTTUrl'),
    tiktok_handle:   g('obTTUrl').replace(/.*@/,'@') || '',
    instagram_url:   g('obIGUrl'),
    linkedin_url:    g('obLIUrl'),
    twitter_url:     g('obTWUrl'),
    pinterest_url:   g('obPINUrl'),
    total_followers: g('obTotalFollowers'),
    engagement_rate: g('obEngagement'),
    monthly_views:   g('obMonthlyViews'),
    theme:           psState.selectedTheme,
    accent_color:    g('obAccentColor') || '#c97e08',
    services,
    projects,
    testimonials,
    rates:           [],
    custom_links:    [],
    hero_media:      [],
    published:       false,
    slug:            generateSlug(g('obName')),
  };
}

function generateSlug(name) {
  const base = (name || 'creator').toLowerCase().replace(/[^a-z0-9]/g,'');
  return base + Math.floor(Math.random() * 900 + 100);
}

/* ══════════════════════════════════════════
   AI GENERATION
══════════════════════════════════════════ */
async function startGeneration() {
  const pf = collectOnboardData();
  psState.activePortfolio = pf;
  psState.generating = true;

  showScreen('screenBuilder');
  const overlay = document.getElementById('genOverlay');
  if (overlay) overlay.classList.remove('hidden');

  const steps  = ['gs1','gs2','gs3','gs4','gs5'];
  let stepIdx  = 0;

  function advanceStep() {
    if (stepIdx > 0) {
      const prev = document.getElementById(steps[stepIdx - 1]);
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    }
    const cur = document.getElementById(steps[stepIdx]);
    if (cur) cur.classList.add('active');
    stepIdx++;
  }

  advanceStep(); // Step 1: Analysing niche

  try {
    // ── AI CALL 1: Headline, Bio, Tagline ──
    const copy = await aiGenerateCopy(pf);
    pf.ai_headline = copy.headline || '';
    pf.ai_bio      = copy.bio      || pf.bio;
    pf.ai_tagline  = copy.tagline  || '';

    advanceStep(); // Step 2: visuals

    // ── AI CALL 2: Hero media search queries ──
    const mediaQueries = await aiGetMediaQueries(pf);
    pf.hero_media = mediaQueries; // [{type,url,credit}] – Unsplash by default

    advanceStep(); // Step 3: writing

    // ── AI CALL 3: Terms & Privacy ──
    const legal = await aiGenerateLegal(pf);
    pf.ai_terms   = legal.terms   || '';
    pf.ai_privacy = legal.privacy || '';

    advanceStep(); // Step 4: legal done

    // ── Save to Supabase ──
    await savePortfolioToDB(pf);
    psState.portfolios.unshift(pf);

    advanceStep(); // Step 5: building

    // ── Populate builder fields ──
    populateBuilder(pf);
    renderPreview(pf);

    await sleep(800);

    // Hide overlay
    if (overlay) overlay.classList.add('hidden');
    psState.generating = false;
    showToast('✦ Portfolio built by Dijo!');

  } catch (err) {
    console.error('Generation error:', err);
    if (overlay) overlay.classList.add('hidden');
    psState.generating = false;
    showToast('Generation error — check console');
    // Still populate with what we have
    populateBuilder(pf);
    renderPreview(pf);
  }
}

/* ── AI: Generate copy ── */
async function aiGenerateCopy(pf) {
  const prompt = `You are Dijo, an expert portfolio copywriter for content creators.

Creator details:
- Name: ${pf.name}
- Niche: ${pf.niche}
- About: ${pf.bio}
- Location: ${pf.location}
- Platforms: YouTube ${pf.youtube_url ? '✓' : ''}, TikTok ${pf.tiktok_url ? '✓' : ''}
- Total followers: ${pf.total_followers || 'not specified'}
- Engagement: ${pf.engagement_rate || 'not specified'}
- Services: ${pf.services.map(s => s.title).join(', ') || 'not specified'}

Write a world-class portfolio page copy. Respond ONLY with valid JSON (no markdown, no backticks):
{
  "headline": "A bold 5-10 word hero headline. No clichés. Make it specific to their niche.",
  "bio": "A punchy 2-3 sentence about section in first person. SEO-rich with their niche keywords.",
  "tagline": "A single short tagline under the name. Max 6 words. Impact-first."
}`;

  const data = await callAI(prompt, 400);
  return safeParseJSON(data);
}

/* ── AI: Get media queries → fetch from Unsplash ── */
async function aiGetMediaQueries(pf) {
  const prompt = `You are Dijo, an AI visual director for creator portfolios.

Creator niche: ${pf.niche}
About: ${pf.bio}
Theme: ${pf.theme}

Choose 5 hero background images that would look stunning behind a ${pf.niche} creator portfolio.
Use the Unsplash Source API format: https://source.unsplash.com/1600x900/?[keywords]

Respond ONLY with valid JSON array (no markdown):
[
  {"type":"image","url":"https://source.unsplash.com/1600x900/?[keyword1,keyword2]","credit":"Unsplash"},
  ...5 total
]

Make keywords vivid and niche-specific. Think like a creative director.`;

  const data = await callAI(prompt, 600);
  try {
    const arr = safeParseJSON(data);
    return Array.isArray(arr) ? arr.slice(0, 5) : defaultMedia(pf.niche);
  } catch {
    return defaultMedia(pf.niche);
  }
}

function defaultMedia(niche) {
  const kw = encodeURIComponent(niche || 'creator lifestyle');
  return [
    { type:'image', url:`https://source.unsplash.com/1600x900/?${kw}`, credit:'Unsplash' },
    { type:'image', url:`https://source.unsplash.com/1600x900/?${kw},professional`, credit:'Unsplash' },
    { type:'image', url:`https://source.unsplash.com/1600x900/?${kw},studio`, credit:'Unsplash' },
  ];
}

/* ── AI: Generate Terms & Privacy ── */
async function aiGenerateLegal(pf) {
  const services = pf.services.map(s => s.title).join(', ') || 'content creation services';
  const prompt = `You are a legal copywriter specialising in creator economy contracts.

Creator: ${pf.name}
Niche: ${pf.niche}
Location: ${pf.location || 'United Kingdom'}
Services offered: ${services}
Email: ${pf.email || 'contact@creator.com'}
Website: impactgrid.app/p/${pf.slug}

Write professional, legally-sound Terms & Conditions and a Privacy Policy for their portfolio website.
Tailor the T&Cs to their specific services (sponsorships, brand deals, content deliverables, payment terms etc).

Respond ONLY with valid JSON (no markdown, no backticks):
{
  "terms": "Full T&Cs text here. Use plain readable English. Include: services scope, payment terms, cancellation policy, IP ownership, content usage rights, limitation of liability. Minimum 400 words.",
  "privacy": "Full Privacy Policy here. Cover: data collected, how it's used, third parties, cookies, contact methods, GDPR compliance. Minimum 300 words."
}`;

  const data = await callAI(prompt, 2000);
  return safeParseJSON(data);
}

/* ── Core AI caller ── */
async function callAI(prompt, maxTokens = 1000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await res.json();
  return data.content.map(i => i.text || '').join('').trim();
}

/* ── Regen individual section ── */
async function regenSection(section) {
  const pf = psState.activePortfolio;
  if (!pf) return;
  showToast('✦ Dijo is rewriting…');
  try {
    if (section === 'headline') {
      const copy = await aiGenerateCopy(pf);
      pf.ai_headline = copy.headline;
      const el = document.getElementById('ePortHeadline');
      if (el) el.value = copy.headline;
    }
    if (section === 'bio') {
      const copy = await aiGenerateCopy(pf);
      pf.ai_bio = copy.bio;
      const el = document.getElementById('ePortBio');
      if (el) el.value = copy.bio;
    }
    if (section === 'tagline') {
      const copy = await aiGenerateCopy(pf);
      pf.ai_tagline = copy.tagline;
      const el = document.getElementById('ePortTagline');
      if (el) el.value = copy.tagline;
    }
    if (section === 'media') {
      const media = await aiGetMediaQueries(pf);
      pf.hero_media = media;
      renderHeroMediaStrip(media);
    }
    if (section === 'terms' || section === 'privacy') {
      const legal = await aiGenerateLegal(pf);
      pf.ai_terms   = legal.terms;
      pf.ai_privacy = legal.privacy;
      const te = document.getElementById('eLegalTerms');
      const pe = document.getElementById('eLegalPrivacy');
      if (te) te.value = legal.terms;
      if (pe) pe.value = legal.privacy;
    }
    updatePreviewLive();
    showToast('✦ Done!');
  } catch (e) {
    showToast('Could not connect to Dijo');
  }
}

/* ══════════════════════════════════════════
   POPULATE BUILDER FROM PORTFOLIO DATA
══════════════════════════════════════════ */
function populateBuilder(pf) {
  setValue('ePortHeadline', pf.ai_headline || pf.name);
  setValue('ePortBio',      pf.ai_bio      || pf.bio);
  setValue('ePortTagline',  pf.ai_tagline  || pf.niche);
  setValue('eSocYT',        pf.youtube_url);
  setValue('eSocYTSubs',    '');
  setValue('eSocTT',        pf.tiktok_url);
  setValue('eSocIG',        pf.instagram_url || '');
  setValue('eSocLI',        pf.linkedin_url  || '');
  setValue('eSocTW',        pf.twitter_url   || '');
  setValue('eSocPIN',       pf.pinterest_url || '');
  setValue('eSocFollowers', pf.total_followers || '');
  setValue('eSocEngagement',pf.engagement_rate || '');
  setValue('eSocViews',     pf.monthly_views  || '');
  setValue('eLegalTerms',   pf.ai_terms   || '');
  setValue('eLegalPrivacy', pf.ai_privacy || '');

  if (pf.accent_color) {
    setValue('eAccentColor', pf.accent_color);
    const cv = document.getElementById('eColorVal');
    if (cv) cv.textContent = pf.accent_color;
  }

  renderHeroMediaStrip(pf.hero_media || []);

  // Services edit
  const seEdit = document.getElementById('eServicesEdit');
  if (seEdit) {
    seEdit.innerHTML = '';
    (pf.services || []).forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'ob-service-row';
      row.innerHTML = `
        <div class="ob-row-header">
          <span class="ob-row-title">${esc(s.title)}</span>
          <button class="ob-row-del" onclick="this.closest('.ob-service-row').remove();updatePreviewLive()">✕</button>
        </div>
        <input class="ob-input sm" value="${esc(s.title)}" placeholder="Title" oninput="updatePreviewLive()"/>
        <input class="ob-input sm" value="${esc(s.description)}" placeholder="Description" style="margin-top:6px" oninput="updatePreviewLive()"/>
        <div class="ob-two-inline" style="margin-top:6px">
          <input class="ob-input sm" value="${esc(s.price)}" placeholder="Price" oninput="updatePreviewLive()"/>
          <input class="ob-input sm" value="${esc(s.icon||'✦')}" placeholder="Icon" oninput="updatePreviewLive()"/>
        </div>
      `;
      seEdit.appendChild(row);
    });
  }

  // URL pill
  const pill = document.getElementById('previewUrlPill');
  if (pill) pill.textContent = `impactgrid.app/p/${pf.slug}`;

  // Theme
  selectEditThemeById(pf.theme || 'dark');

  updatePreviewLive();
}

function addEditServiceRow() {
  const seEdit = document.getElementById('eServicesEdit');
  if (!seEdit) return;
  const row = document.createElement('div');
  row.className = 'ob-service-row';
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">New Service</span>
      <button class="ob-row-del" onclick="this.closest('.ob-service-row').remove();updatePreviewLive()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Title" oninput="updatePreviewLive()"/>
    <input class="ob-input sm" placeholder="Description" style="margin-top:6px" oninput="updatePreviewLive()"/>
    <div class="ob-two-inline" style="margin-top:6px">
      <input class="ob-input sm" placeholder="Price" oninput="updatePreviewLive()"/>
      <input class="ob-input sm" placeholder="Icon emoji" oninput="updatePreviewLive()"/>
    </div>
  `;
  seEdit.appendChild(row);
}

function selectEditThemeById(themeId) {
  document.querySelectorAll('#tabDesign .ob-theme-opt').forEach(o => {
    o.classList.toggle('active', o.dataset.theme === themeId);
  });
}

function renderHeroMediaStrip(media) {
  const strip = document.getElementById('heroMediaStrip');
  if (!strip) return;
  strip.innerHTML = '';
  (media || []).forEach((m, i) => {
    const thumb = document.createElement('div');
    thumb.className = 'hm-thumb';
    thumb.innerHTML = `
      <img src="${m.url}" alt="Hero visual ${i+1}" loading="lazy"/>
      <div class="hm-del" onclick="removeHeroMedia(${i})">✕</div>
    `;
    strip.appendChild(thumb);
  });
}

function removeHeroMedia(idx) {
  if (!psState.activePortfolio) return;
  psState.activePortfolio.hero_media.splice(idx, 1);
  renderHeroMediaStrip(psState.activePortfolio.hero_media);
  updatePreviewLive();
}

/* ══════════════════════════════════════════
   LIVE PREVIEW
══════════════════════════════════════════ */
function updatePreviewLive() {
  if (!psState.activePortfolio) return;
  // Collect current edit state
  const pf = psState.activePortfolio;
  pf.ai_headline = val('ePortHeadline') || pf.ai_headline;
  pf.ai_bio      = val('ePortBio')      || pf.ai_bio;
  pf.ai_tagline  = val('ePortTagline')  || pf.ai_tagline;
  pf.accent_color = val('eAccentColor') || pf.accent_color;

  // Colour val display
  const cv = document.getElementById('eColorVal');
  if (cv) cv.textContent = pf.accent_color || '#c97e08';

  // Social
  pf.youtube_url    = val('eSocYT')       || pf.youtube_url;
  pf.tiktok_url     = val('eSocTT')       || pf.tiktok_url;
  pf.total_followers = val('eSocFollowers') || pf.total_followers;
  pf.engagement_rate = val('eSocEngagement') || pf.engagement_rate;
  pf.monthly_views   = val('eSocViews')    || pf.monthly_views;

  // Services from edit rows
  const services = [];
  document.querySelectorAll('#eServicesEdit .ob-service-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs[0] && inputs[0].value.trim()) {
      services.push({
        title: inputs[0].value,
        description: inputs[1] ? inputs[1].value : '',
        price: inputs[2] ? inputs[2].value : '',
        icon: inputs[3] ? inputs[3].value : '✦',
      });
    }
  });
  pf.services = services.length ? services : pf.services;

  renderPreview(pf);
}

function renderPreview(pf) {
  const iframe = document.getElementById('previewIframe');
  if (!iframe) return;
  const html = buildPortfolioHTML(pf);
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  iframe.src = url;
}

/* ══════════════════════════════════════════
   BUILD PORTFOLIO HTML (the actual mini-site)
══════════════════════════════════════════ */
function buildPortfolioHTML(pf) {
  const t = THEMES[pf.theme] || THEMES.dark;
  const accent = pf.accent_color || t.accent;
  const heroImgs = (pf.hero_media || []).map(m => m.url).filter(Boolean);
  const heroImg0 = heroImgs[0] || `https://source.unsplash.com/1600x900/?${encodeURIComponent(pf.niche || 'creator')}`;
  const fontFace = pf.font_style === 'playfair' ? "'Playfair Display', serif" :
                   pf.font_style === 'mono'     ? "'Space Mono', monospace" :
                   pf.font_style === 'dm'       ? "'DM Sans', sans-serif" :
                                                   "'Syne', sans-serif";
  const initials = (pf.name || 'CR').split(' ').map(w => w[0]||'').join('').toUpperCase().slice(0,2);

  // Slideshow images script
  const slideshowScript = heroImgs.length > 1 ? `
    const slides = ${JSON.stringify(heroImgs)};
    let si = 0;
    const heroBg = document.getElementById('heroBg');
    setInterval(() => {
      si = (si + 1) % slides.length;
      heroBg.style.opacity = '0';
      setTimeout(() => { heroBg.style.backgroundImage = 'url(' + slides[si] + ')'; heroBg.style.opacity = '1'; }, 600);
    }, 5000);
  ` : '';

  // Services HTML
  const servicesHTML = (pf.services || []).map(s => `
    <div class="service-card">
      <div class="service-icon">${esc(s.icon || '✦')}</div>
      <div class="service-title">${esc(s.title)}</div>
      <div class="service-desc">${esc(s.description)}</div>
      ${s.price ? `<div class="service-price">${esc(s.price)}</div>` : ''}
    </div>
  `).join('');

  // Projects HTML
  const projectsHTML = (pf.projects || []).map(p => `
    <div class="project-card">
      <div class="project-title">${esc(p.title)}</div>
      <div class="project-desc">${esc(p.description)}</div>
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" class="project-link">View →</a>` : ''}
    </div>
  `).join('');

  // Testimonials
  const testimonialsHTML = (pf.testimonials || []).map(t => `
    <div class="testimonial-card">
      <div class="testimonial-quote">"${esc(t.quote)}"</div>
      <div class="testimonial-author">— ${esc(t.author)}</div>
    </div>
  `).join('');

  // Social links
  const socialLinks = [];
  if (pf.youtube_url)  socialLinks.push({ icon:'▶', label:'YouTube',   url: pf.youtube_url,  color:'#ff0000' });
  if (pf.tiktok_url)   socialLinks.push({ icon:'♪', label:'TikTok',    url: pf.tiktok_url,   color:'#69c9d0' });
  if (pf.instagram_url)socialLinks.push({ icon:'◉', label:'Instagram', url: pf.instagram_url,color:'#e1306c' });
  if (pf.linkedin_url) socialLinks.push({ icon:'in', label:'LinkedIn', url: pf.linkedin_url, color:'#0077b5' });
  if (pf.twitter_url)  socialLinks.push({ icon:'𝕏', label:'Twitter/X', url: pf.twitter_url,  color:'#1d9bf0' });

  const socialHTML = socialLinks.map(s => `
    <a href="${esc(s.url)}" target="_blank" class="social-link" style="--link-color:${s.color}">
      <span class="social-icon">${s.icon}</span>
      <span class="social-label">${s.label}</span>
      <span class="social-arrow">→</span>
    </a>
  `).join('');

  // Stats
  const statsHTML = (pf.total_followers || pf.engagement_rate || pf.monthly_views) ? `
    <div class="stats-row">
      ${pf.total_followers ? `<div class="stat"><div class="stat-val">${esc(pf.total_followers)}</div><div class="stat-lbl">FOLLOWERS</div></div>` : ''}
      ${pf.engagement_rate ? `<div class="stat"><div class="stat-val">${esc(pf.engagement_rate)}</div><div class="stat-lbl">ENGAGEMENT</div></div>` : ''}
      ${pf.monthly_views   ? `<div class="stat"><div class="stat-val">${esc(pf.monthly_views)}</div><div class="stat-lbl">MONTHLY VIEWS</div></div>` : ''}
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(pf.name)} — ${esc(pf.niche)} | ImpactGrid</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:${t.bg};--surface:${t.surface};--text:${t.text};--sub:${t.sub};
  --border:${t.border};--accent:${accent};--gradient:${t.gradient};
  --fh:${fontFace};
}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);line-height:1.6;min-height:100vh}
a{color:inherit;text-decoration:none}

/* NAV */
.site-nav{
  position:fixed;top:0;left:0;right:0;z-index:100;
  padding:14px 24px;display:flex;align-items:center;justify-content:space-between;
  background:rgba(0,0,0,0.4);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--border);
}
.nav-brand{font-family:var(--fh);font-size:16px;font-weight:800;letter-spacing:-.3px}
.nav-links{display:flex;gap:24px;font-size:13px;color:var(--sub)}
.nav-links a:hover{color:var(--text)}
.nav-cta{
  padding:8px 18px;background:var(--accent);color:#fff;
  border-radius:8px;font-size:12px;font-weight:700;font-family:var(--fh);
  transition:.15s;
}
.nav-cta:hover{opacity:.85}

/* HERO */
.hero{
  min-height:100vh;position:relative;display:flex;align-items:center;
  overflow:hidden;
}
#heroBg{
  position:absolute;inset:0;
  background-image:url(${heroImg0});
  background-size:cover;background-position:center;
  transition:opacity .6s ease;
}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom, rgba(0,0,0,.5) 0%, rgba(0,0,0,.7) 60%, var(--bg) 100%)}
.hero-content{position:relative;z-index:2;padding:120px 60px 80px;max-width:800px}
.hero-eyebrow{font-size:11px;font-family:monospace;letter-spacing:3px;color:var(--accent);text-transform:uppercase;margin-bottom:16px}
.hero-tagline{font-size:13px;color:var(--sub);margin-bottom:8px;font-family:monospace;letter-spacing:1px}
.hero-headline{
  font-family:var(--fh);font-size:clamp(40px,6vw,80px);font-weight:800;
  line-height:1.05;letter-spacing:-2px;margin-bottom:20px;
}
.hero-headline em{color:var(--accent);font-style:italic}
.hero-bio{font-size:16px;color:var(--sub);max-width:560px;line-height:1.7;margin-bottom:32px}
.hero-actions{display:flex;gap:14px;flex-wrap:wrap}
.btn-primary{
  display:inline-flex;align-items:center;gap:8px;
  padding:14px 28px;background:var(--accent);color:#fff;
  border-radius:10px;font-family:var(--fh);font-size:14px;font-weight:700;
  transition:.2s;box-shadow:0 4px 24px rgba(0,0,0,.3);
}
.btn-primary:hover{opacity:.85;transform:translateY(-1px)}
.btn-secondary{
  display:inline-flex;align-items:center;gap:8px;
  padding:14px 24px;border:1.5px solid rgba(255,255,255,.25);
  border-radius:10px;font-size:14px;color:var(--text);transition:.2s;
}
.btn-secondary:hover{border-color:var(--accent);color:var(--accent)}

/* SECTIONS */
.section{padding:80px 60px;max-width:1100px;margin:0 auto}
.section-label{font-size:10px;font-weight:700;font-family:monospace;letter-spacing:3px;color:var(--accent);text-transform:uppercase;margin-bottom:12px}
.section-title{font-family:var(--fh);font-size:clamp(28px,4vw,48px);font-weight:800;letter-spacing:-1px;margin-bottom:40px;line-height:1.1}

/* STATS */
.stats-row{display:flex;gap:2px;margin:40px 0;flex-wrap:wrap}
.stat{flex:1;min-width:120px;padding:20px 24px;background:var(--surface);border:1px solid var(--border);text-align:center}
.stat:first-child{border-radius:10px 0 0 10px}
.stat:last-child{border-radius:0 10px 10px 0}
.stat-val{font-family:var(--fh);font-size:32px;font-weight:800;color:var(--accent);line-height:1}
.stat-lbl{font-size:9px;letter-spacing:2px;color:var(--sub);margin-top:6px;font-family:monospace}

/* SERVICES */
.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:8px}
.service-card{
  background:var(--surface);border:1.5px solid var(--border);border-radius:14px;
  padding:24px;transition:.2s;position:relative;overflow:hidden;
}
.service-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.02),transparent);pointer-events:none}
.service-card:hover{border-color:var(--accent);transform:translateY(-2px)}
.service-icon{font-size:28px;margin-bottom:12px}
.service-title{font-family:var(--fh);font-size:16px;font-weight:700;margin-bottom:8px}
.service-desc{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:12px}
.service-price{font-family:monospace;font-size:18px;font-weight:700;color:var(--accent)}

/* WORK */
.projects-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.project-card{
  background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:24px;transition:.2s;
}
.project-card:hover{border-color:var(--accent)}
.project-title{font-family:var(--fh);font-size:15px;font-weight:700;margin-bottom:8px}
.project-desc{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:12px}
.project-link{font-size:12px;font-weight:700;color:var(--accent);font-family:monospace;letter-spacing:.5px}

/* TESTIMONIALS */
.testimonials-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.testimonial-card{
  background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:28px;
}
.testimonial-quote{font-size:15px;line-height:1.7;color:var(--text);margin-bottom:16px;font-style:italic}
.testimonial-author{font-size:12px;color:var(--accent);font-family:monospace;font-weight:700;letter-spacing:.5px}

/* SOCIAL LINKS */
.social-links{display:flex;flex-direction:column;gap:10px;max-width:480px}
.social-link{
  display:flex;align-items:center;gap:14px;padding:16px 20px;
  background:var(--surface);border:1.5px solid var(--border);border-radius:12px;
  transition:.2s;cursor:pointer;
}
.social-link:hover{border-color:var(--link-color,var(--accent));transform:translateX(4px)}
.social-icon{width:36px;height:36px;border-radius:9px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;font-style:normal}
.social-label{font-size:14px;font-weight:600;flex:1}
.social-arrow{color:var(--sub);transition:.2s}
.social-link:hover .social-arrow{color:var(--link-color,var(--accent));transform:translateX(3px)}

/* CONTACT */
.contact-section{
  background:linear-gradient(135deg,rgba(255,255,255,.03),transparent);
  border:1.5px solid var(--border);border-radius:20px;padding:60px;text-align:center;
  margin:0 60px 80px;
}
.contact-headline{font-family:var(--fh);font-size:clamp(28px,4vw,48px);font-weight:800;letter-spacing:-1px;margin-bottom:12px}
.contact-sub{font-size:15px;color:var(--sub);margin-bottom:32px;max-width:480px;margin-left:auto;margin-right:auto}

/* FOOTER */
footer{
  border-top:1px solid var(--border);padding:32px 60px;
  display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;
}
.footer-brand{font-family:var(--fh);font-size:14px;font-weight:700}
.footer-links{display:flex;gap:20px;font-size:12px;color:var(--sub)}
.footer-links a:hover{color:var(--accent)}
.footer-ig{font-size:11px;color:var(--sub)}
.footer-ig a{color:var(--accent)}

/* LEGAL MODALS */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:200;display:none;align-items:center;justify-content:center;padding:24px}
.modal-overlay.show{display:flex}
.modal-box{background:var(--surface);border:1px solid var(--border);border-radius:16px;max-width:680px;width:100%;max-height:80vh;overflow-y:auto;padding:36px}
.modal-box h2{font-family:var(--fh);font-size:22px;font-weight:800;margin-bottom:20px}
.modal-box p{font-size:13px;color:var(--sub);line-height:1.8;white-space:pre-line}
.modal-close{position:sticky;top:0;float:right;width:28px;height:28px;border-radius:8px;background:var(--surface);border:1px solid var(--border);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--sub)}

/* ANIMATIONS */
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.fade-up{animation:fadeUp .6s ease both}
.delay-1{animation-delay:.1s}.delay-2{animation-delay:.2s}.delay-3{animation-delay:.3s}.delay-4{animation-delay:.4s}

@media(max-width:768px){
  .hero-content,.section,.contact-section{padding:80px 24px 60px}
  .footer{padding:24px}
  .nav-links{display:none}
  .contact-section{margin:0 24px 60px}
}
</style>
</head>
<body>

<nav class="site-nav">
  <div class="nav-brand">${esc(pf.name)}</div>
  <div class="nav-links">
    <a href="#about">About</a>
    <a href="#services">Services</a>
    ${pf.projects && pf.projects.length ? '<a href="#work">Work</a>' : ''}
    <a href="#connect">Connect</a>
  </div>
  <a class="nav-cta" href="#contact">Work With Me</a>
</nav>

<!-- HERO -->
<section class="hero" id="home">
  <div id="heroBg"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-eyebrow fade-up">${esc(pf.niche)}</div>
    <div class="hero-tagline fade-up delay-1">${esc(pf.ai_tagline || '')}</div>
    <h1 class="hero-headline fade-up delay-2">${esc(pf.ai_headline || pf.name)}</h1>
    <p class="hero-bio fade-up delay-3">${esc(pf.ai_bio || pf.bio || '')}</p>
    <div class="hero-actions fade-up delay-4">
      <a class="btn-primary" href="#contact">Work With Me →</a>
      <a class="btn-secondary" href="#services">See My Services</a>
    </div>
  </div>
</section>

<!-- ABOUT / STATS -->
<section class="section" id="about">
  ${statsHTML}
  <div class="section-label">About</div>
  <div class="section-title">${esc(pf.name)}</div>
  <p style="font-size:16px;color:var(--sub);max-width:680px;line-height:1.8">${esc(pf.ai_bio || pf.bio || '')}</p>
</section>

<!-- SERVICES -->
${pf.services && pf.services.length ? `
<section class="section" id="services">
  <div class="section-label">What I Offer</div>
  <div class="section-title">Services &amp; Rates</div>
  <div class="services-grid">${servicesHTML}</div>
</section>
` : ''}

<!-- WORK / PROJECTS -->
${pf.projects && pf.projects.length ? `
<section class="section" id="work">
  <div class="section-label">Portfolio</div>
  <div class="section-title">Selected Work</div>
  <div class="projects-grid">${projectsHTML}</div>
</section>
` : ''}

<!-- TESTIMONIALS -->
${pf.testimonials && pf.testimonials.length ? `
<section class="section" id="testimonials">
  <div class="section-label">Social Proof</div>
  <div class="section-title">What Brands Say</div>
  <div class="testimonials-grid">${testimonialsHTML}</div>
</section>
` : ''}

<!-- CONNECT / SOCIAL -->
<section class="section" id="connect">
  <div class="section-label">Find Me</div>
  <div class="section-title">Follow My Journey</div>
  <div class="social-links">${socialHTML}</div>
</section>

<!-- CONTACT CTA -->
<div class="contact-section" id="contact">
  <div class="section-label">Let's Collaborate</div>
  <div class="contact-headline">Ready to work together?</div>
  <p class="contact-sub">I partner with brands that align with my audience's values. Let's create something remarkable.</p>
  ${pf.email ? `<a class="btn-primary" href="mailto:${esc(pf.email)}" style="display:inline-flex;margin:0 auto">Get In Touch →</a>` : '<a class="btn-primary" href="#" style="display:inline-flex;margin:0 auto">Get In Touch →</a>'}
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">${esc(pf.name)} <span style="color:var(--sub);font-weight:400;font-size:12px">· ${esc(pf.niche)}</span></div>
  <div class="footer-links">
    <a onclick="document.getElementById('termsModal').classList.add('show')" style="cursor:pointer">Terms &amp; Conditions</a>
    <a onclick="document.getElementById('privacyModal').classList.add('show')" style="cursor:pointer">Privacy Policy</a>
    ${pf.email ? `<a href="mailto:${esc(pf.email)}">Contact</a>` : ''}
  </div>
  <div class="footer-ig">Made with <a href="https://impactgrid.app" target="_blank">ImpactGrid ✦</a></div>
</footer>

<!-- TERMS MODAL -->
<div class="modal-overlay" id="termsModal" onclick="if(event.target===this)this.classList.remove('show')">
  <div class="modal-box">
    <button class="modal-close" onclick="document.getElementById('termsModal').classList.remove('show')">✕</button>
    <h2>Terms &amp; Conditions</h2>
    <p>${esc(pf.ai_terms || 'Terms and conditions have not been set for this portfolio.')}</p>
  </div>
</div>

<!-- PRIVACY MODAL -->
<div class="modal-overlay" id="privacyModal" onclick="if(event.target===this)this.classList.remove('show')">
  <div class="modal-box">
    <button class="modal-close" onclick="document.getElementById('privacyModal').classList.remove('show')">✕</button>
    <h2>Privacy Policy</h2>
    <p>${esc(pf.ai_privacy || 'Privacy policy has not been set for this portfolio.')}</p>
  </div>
</div>

<script>
// Hero background set
document.getElementById('heroBg').style.backgroundImage = 'url(${heroImg0})';
${slideshowScript}

// Scroll animations
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('fade-up'); });
}, { threshold: 0.1 });
document.querySelectorAll('.section,.service-card,.project-card,.testimonial-card,.social-link').forEach(el => obs.observe(el));
<\/script>
</body>
</html>`;
}

/* ══════════════════════════════════════════
   SAVE & PUBLISH
══════════════════════════════════════════ */
async function savePortfolio() {
  const pf = psState.activePortfolio;
  if (!pf) return;
  // Collect latest from builder
  updatePreviewLive();
  // Collect legal
  pf.ai_terms   = val('eLegalTerms')   || pf.ai_terms;
  pf.ai_privacy = val('eLegalPrivacy') || pf.ai_privacy;
  await savePortfolioToDB(pf);
  loadPortfolios();
}

async function publishPortfolio() {
  const pf = psState.activePortfolio;
  if (!pf) return;
  updatePreviewLive();
  pf.published    = true;
  pf.published_at = new Date().toISOString();
  const ok = await savePortfolioToDB(pf);
  if (!ok) return;

  // Show published screen
  const linkEl = document.getElementById('pubLinkText');
  if (linkEl) linkEl.textContent = `impactgrid.app/p/${pf.slug}`;

  // Stats
  setValue('pubViewCount', '0');
  setValue('pubEnqCount',  '0');
  const days = pf.published_at
    ? Math.floor((Date.now() - new Date(pf.published_at)) / 86400000)
    : 0;
  setValue('pubDaysLive', String(days));

  showScreen('screenPublished');
  spawnConfetti();
  navigator.clipboard.writeText(`https://impactgrid.app/p/${pf.slug}`).catch(() => {});
  showToast('🚀 Published! Link copied.');
  loadPortfolios();
}

/* ══════════════════════════════════════════
   SHARE
══════════════════════════════════════════ */
function copyPublishedLink() {
  const el = document.getElementById('pubLinkText');
  const url = el ? 'https://' + el.textContent : '';
  navigator.clipboard.writeText(url).catch(() => {});
  showToast('✓ Link copied!');
}

function shareToYouTube() {
  showToast('📋 Copy your link from above and paste it in your YouTube description!');
}
function shareToTikTok() {
  showToast('📋 Copy your link and paste it in your TikTok bio!');
}
function shareToInstagram() {
  const el = document.getElementById('pubLinkText');
  const url = el ? 'https://' + el.textContent : '';
  navigator.clipboard.writeText(url).catch(() => {});
  showToast('📸 Link copied — paste it in your Instagram bio!');
}
function shareToLinkedIn() {
  const el = document.getElementById('pubLinkText');
  const url = el ? 'https://' + el.textContent : '';
  window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'width=600,height=500');
}

/* ══════════════════════════════════════════
   DEVICE PREVIEW
══════════════════════════════════════════ */
function setPreviewDevice(device) {
  const frame = document.getElementById('previewFrame');
  const dBtn  = document.getElementById('pdbDesktop');
  const mBtn  = document.getElementById('pdbMobile');
  if (!frame) return;
  if (device === 'mobile') {
    frame.classList.remove('desktop'); frame.classList.add('mobile');
    mBtn.classList.add('active'); dBtn.classList.remove('active');
  } else {
    frame.classList.remove('mobile'); frame.classList.add('desktop');
    dBtn.classList.add('active'); mBtn.classList.remove('active');
  }
}

function openPreviewTab() {
  const pf = psState.activePortfolio;
  if (!pf) return;
  const html = buildPortfolioHTML(pf);
  const blob = new Blob([html], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}

/* ══════════════════════════════════════════
   UPLOAD
══════════════════════════════════════════ */
function handleHeroUpload(event) {
  const files = event.target.files;
  if (!files || !files.length) return;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      if (!psState.activePortfolio) return;
      psState.activePortfolio.hero_media = psState.activePortfolio.hero_media || [];
      psState.activePortfolio.hero_media.unshift({ type: file.type.startsWith('video') ? 'video' : 'image', url: e.target.result, credit: 'Uploaded' });
      renderHeroMediaStrip(psState.activePortfolio.hero_media);
      updatePreviewLive();
    };
    reader.readAsDataURL(file);
  });
}

function dzOver(e, el) { e.preventDefault(); el.classList.add('over'); }
function dzLeave(el)   { el.classList.remove('over'); }
function dzDrop(e, type) {
  e.preventDefault();
  const el = e.currentTarget;
  el.classList.remove('over');
  if (e.dataTransfer.files.length) {
    const fakeEvt = { target: { files: e.dataTransfer.files } };
    if (type === 'hero') handleHeroUpload(fakeEvt);
  }
}

/* ══════════════════════════════════════════
   BUILDER TABS
══════════════════════════════════════════ */
function setEditTab(btn, tabId) {
  document.querySelectorAll('.bl-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.bl-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
}

/* ══════════════════════════════════════════
   CONFETTI
══════════════════════════════════════════ */
function spawnConfetti() {
  const container = document.getElementById('pubConfetti');
  if (!container) return;
  container.innerHTML = '';
  const colors = ['#c97e08','#e8a020','#f0ede8','#22c55e','#2563eb','#e91e8c'];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 10 + 4;
    p.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:${Math.random()>0.5?'50%':'2px'};
      left:${Math.random()*100}%;top:-20px;
      animation:confettiFall ${Math.random()*2+1.5}s linear ${Math.random()*0.5}s forwards;
      opacity:${Math.random()*0.7+0.3};
    `;
    container.appendChild(p);
  }

  // Add keyframes
  if (!document.getElementById('confettiKF')) {
    const style = document.createElement('style');
    style.id = 'confettiKF';
    style.textContent = `@keyframes confettiFall{to{transform:translateY(500px) rotate(${Math.random()*720}deg);opacity:0}}`;
    document.head.appendChild(style);
  }
}

/* ══════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════ */
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'light' ? 'dark' : 'light';
}

/* ══════════════════════════════════════════
   TOAST
══════════════════════════════════════════ */
function showToast(msg) {
  const shelf = document.getElementById('psToastShelf');
  if (!shelf) return;
  const t = document.createElement('div');
  t.className = 'ps-toast';
  t.textContent = msg;
  shelf.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ══════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════ */
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function val(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function setValue(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function safeParseJSON(text) {
  try {
    const clean = text.replace(/```json|```/g,'').trim();
    return JSON.parse(clean);
  } catch {
    return {};
  }
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Seed first service row
  addServiceRow();
  loadPortfolios();

  // Colour picker sync
  const cp = document.getElementById('obAccentColor');
  if (cp) cp.addEventListener('input', e => {
    const cv = document.getElementById('obColorVal');
    if (cv) cv.textContent = e.target.value;
  });

  const ecp = document.getElementById('eAccentColor');
  if (ecp) ecp.addEventListener('input', e => {
    const ecv = document.getElementById('eColorVal');
    if (ecv) ecv.textContent = e.target.value;
    if (psState.activePortfolio) psState.activePortfolio.accent_color = e.target.value;
    updatePreviewLive();
  });

  obValidate();
});
