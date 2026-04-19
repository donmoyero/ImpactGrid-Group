/* ═══════════════════════════════════════════════════════════
   IMPACTGRID CREATOR STUDIO — portfolio-studio.js  v2.1

   Architecture matches carousel-studio.js exactly:
   ┌─────────────────────────────────────────────────────┐
   │  Browser (this file)                                │
   │    → POST /portfolio/generate  (Render server)      │
   │    → POST /portfolio/regen     (Render server)      │
   │    → Supabase REST API (direct, anon key only)      │
   │                                                     │
   │  Render server (portfolio-engine.js)                │
   │    → Groq llama-3.3-70b  (copy + legal)             │
   │    → Groq Llama Vision   (image scoring)            │
   │    → Supabase service key (trends)                  │
   └─────────────────────────────────────────────────────┘

   NO AI keys in this file. NO direct Anthropic/Groq calls.
   ═══════════════════════════════════════════════════════════ */

/* ── CONFIG ─────────────────────────────────────────────── */
const DIJO_SERVER  = "https://impactgrid-dijo.onrender.com";
// ✅ FIX: portfolios table lives on the CONTENT project (exeiojgldxqaakkybdij),
//         NOT the auth project (wedjsnizcvtgptobwugc).
//         Using IG_CONTENT_URL / IG_CONTENT_ANON set by supabase-config.js.
const SUPABASE_URL = window.IG_CONTENT_URL  || "https://exeiojgldxqaakkybdij.supabase.co";
const SUPABASE_KEY = window.IG_CONTENT_ANON || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZWlvamdsZHhxYWFra3liZGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDc4NTcsImV4cCI6MjA4ODkyMzg1N30.aRXgeHqaOxkidwpWVGEOKBQAeo9_C5Fk3Gu5ZlbmxTQ";

/* ── SESSION ID ─────────────────────────────────────────── */
let SESSION_ID = localStorage.getItem("ig_session");
if (!SESSION_ID) {
  SESSION_ID = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem("ig_session", SESSION_ID);
}

/* ── STATE ──────────────────────────────────────────────── */
let psState = {
  currentStep:      1,
  selectedTheme:    null,
  portfolios:       [],
  activePortfolio:  null,
  generating:       false,
  portfoliosLoaded: false,  // true once the first loadPortfolios() call resolves
};

// Holds the in-flight loadPortfolios() promise so checkPortfolioAccess()
// can await it instead of reading psState.portfolios while it's still empty.
let _portfoliosLoadPromise = null;

/* ── MONETISATION ─────────────────────────────────────────────────────
   All plan limits come from plan-config.js (window.IG_PLAN_CONFIG).
   Do NOT define limits here — edit plan-config.js only.

   Portfolio limits (current):
     free         → 3 portfolios (deleted from DB after 7 days)
     professional → 1 portfolio  (permanent while subscription active)
     enterprise   → 3 portfolios (permanent)

   Generation costs 1 shared AI use (ig_ai_uses, reset monthly).
   AI limits: free=3/mo, professional=100/mo, enterprise=unlimited.
   Both sourced from window.igUser (set by nav.js from profiles DB).
─────────────────────────────────────────────────────────────────────── */
const PS_ADMIN_EMAIL = "admin@impactgridgroup.com";

/* Read limits from plan-config.js — fall back to safe defaults if not loaded yet */
function _getPlanCfg(plan) {
  return (window.IG_PLAN_CONFIG && window.IG_PLAN_CONFIG[plan])
    || { portfolios: 0, ai_uses: 3 };
}

function _getPlan() {
  if (window.igUser && window.igUser.plan) return window.igUser.plan;
  try { return localStorage.getItem('ig_plan') || 'free'; } catch(e) { return 'free'; }
}
function _getAIUses() {
  if (window.igUser && typeof window.igUser.aiUses === 'number') return window.igUser.aiUses;
  try { return parseInt(localStorage.getItem('ig_ai_uses') || '0'); } catch(e) { return 0; }
}
function _isAdmin() {
  var user = window.igUser || getCurrentUser();
  if (!user) return false;
  if (user.email === PS_ADMIN_EMAIL) return true;
  if (_getPlan() === 'enterprise') return true;
  return false;
}

/* Increment shared AI counter: localStorage + window.igUser + Supabase profiles */
async function incrementAIUse() {
  var next = _getAIUses() + 1;
  try { localStorage.setItem('ig_ai_uses', String(next)); } catch(e) {}
  if (window.igUser) window.igUser.aiUses = next;
  try {
    var client = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (client && window.igUser && window.igUser.id) {
      await client.from('profiles')
        .update({ ai_uses_month: next })
        .eq('user_id', window.igUser.id);
    }
  } catch(e) {}
}

/* Safe shims in case auth.js defines these differently */
if (typeof isAdmin === 'undefined')  { window.isAdmin  = _isAdmin; }
if (typeof canUse  === 'undefined')  { window.canUse   = function() { return true; }; }

/* ── THEMES — used ONLY for the published portfolio mini-site (buildPortfolioHTML).
   The app UI theme is controlled entirely by shared.css + nav.js toggleTheme().
   Do NOT use these values to style anything inside portfolio-studio.html. ── */
const THEMES = {
  dark:     { bg:"#1a1814", accent:"#c97e08", text:"#f0ede8", sub:"rgba(240,237,232,0.55)", surface:"#23201a", border:"rgba(255,255,255,0.07)", gradient:"linear-gradient(160deg,#1a1814 0%,#2a2318 100%)" },
  navy:     { bg:"#0f172a", accent:"#4f8ef7", text:"#f0ede8", sub:"rgba(240,237,232,0.55)", surface:"#162035", border:"rgba(255,255,255,0.07)", gradient:"linear-gradient(160deg,#0f172a 0%,#1e3a5f 100%)" },
  clean:    { bg:"#f8fafc", accent:"#2d6edb", text:"#0d1017", sub:"#4a5068",                surface:"#ffffff", border:"rgba(0,0,0,0.07)",         gradient:"linear-gradient(160deg,#f8fafc 0%,#e2e8f0 100%)" },
  midnight: { bg:"#080810", accent:"#818cf8", text:"#e2e8f0", sub:"rgba(226,232,240,0.5)",  surface:"#10101e", border:"rgba(255,255,255,0.06)",    gradient:"linear-gradient(160deg,#080810 0%,#0d0d22 100%)" },
  rose:     { bg:"#1a0d12", accent:"#f43f80", text:"#fce7ef", sub:"rgba(252,231,239,0.55)", surface:"#260d16", border:"rgba(255,255,255,0.07)",    gradient:"linear-gradient(160deg,#1a0d12 0%,#2d0f1e 100%)" },
  forest:   { bg:"#14532d", accent:"#4ade80", text:"#f0fdf4", sub:"rgba(240,253,244,0.6)",  surface:"#1a6635", border:"rgba(255,255,255,0.08)",    gradient:"linear-gradient(160deg,#14532d 0%,#166534 100%)" },
};

/* ══════════════════════════════════════════════════════════
   AUTH + ACCESS CONTROL
   nav.js owns auth — this file reads window.igUser only.
   No direct supabase.auth calls here.
══════════════════════════════════════════════════════════ */
function getCurrentUser() {
  return window.igUser || null;
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD BANNER
   Reads window.igUser populated by nav.js from ig-supabase.
   No extra Supabase call — all data already loaded by nav.js.
══════════════════════════════════════════════════════════ */
function psBannerInit() {
  var banner    = document.getElementById('psUserBanner');
  var welcome   = document.getElementById('psWelcome');
  var badge     = document.getElementById('psPlanBadge');
  var trialInfo = document.getElementById('psTrialInfo');
  var upLink    = document.getElementById('psUpgradeLink');

  if (!banner) return;

  var plan    = _getPlan();           // 'free' | 'professional' | 'enterprise'
  var aiUses  = _getAIUses();         // number used this month
  var aiLimit = _getPlanCfg(plan).ai_uses;
  var user    = window.igUser || {};
  var name    = user.firstName || (user.name ? user.name.split(' ')[0] : '') || '';

  // Welcome greeting
  if (welcome) {
    welcome.textContent = name
      ? 'Welcome back, ' + name + ' \u{1F44B}'
      : 'Welcome back \u{1F44B}';
  }

  // Plan badge
  if (badge) {
    badge.textContent = (typeof igPlanLabel === 'function') ? igPlanLabel(plan) : plan.charAt(0).toUpperCase() + plan.slice(1);
    badge.className   = 'ps-plan-badge plan-' + plan;
  }

  // Trial / usage counter
  if (trialInfo) {
    if (plan === 'free') {
      var remaining = Math.max(0, aiLimit - aiUses);
      if (remaining === 0) {
        trialInfo.textContent = 'No AI uses left this month';
        trialInfo.className   = 'ps-trial-info warn';
      } else {
        trialInfo.textContent = remaining + ' of ' + aiLimit + ' free uses remaining this month';
        trialInfo.className   = 'ps-trial-info ' + (remaining <= 1 ? 'warn' : 'ok');
      }
    } else if (plan === 'professional') {
      var proRemaining = Math.max(0, aiLimit - aiUses);
      trialInfo.textContent = proRemaining + ' of ' + aiLimit + ' AI uses left this month';
      trialInfo.className   = 'ps-trial-info ' + (proRemaining < 10 ? 'warn' : 'ok');
    } else {
      // enterprise — unlimited
      trialInfo.textContent = 'Unlimited AI uses';
      trialInfo.className   = 'ps-trial-info ok';
    }
  }

  // Upgrade link — hide for enterprise
  if (upLink) {
    if (plan === 'enterprise') {
      upLink.style.display = 'none';
    } else {
      upLink.style.display = 'inline-flex';
      upLink.textContent   = plan === 'free' ? 'Upgrade to Pro \u2192' : 'Upgrade to Enterprise \u2192';
    }
  }

  banner.style.display = 'flex';
}

/* Delete free-user portfolios older than 7 days from DB, then re-render */
async function psMarkExpiredPortfolios() {
  var plan = _getPlan();
  if (plan !== 'free') return; // only free users have 7-day limit

  var SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  var now = Date.now();

  // Find expired portfolios in local state
  var expired = (psState.portfolios || []).filter(function(pf) {
    if (!pf.created_at) return false;
    return (now - new Date(pf.created_at).getTime()) > SEVEN_DAYS;
  });

  if (!expired.length) return;

  // Delete each from DB
  for (var i = 0; i < expired.length; i++) {
    var pf = expired[i];
    try {
      await sbFetch('/portfolios?id=eq.' + pf.id, 'DELETE');
      console.log('[Portfolio] Deleted expired portfolio:', pf.id);
    } catch(e) {
      console.warn('[Portfolio] Could not delete expired portfolio:', pf.id, e.message);
    }
  }

  // Reload dashboard to reflect deletions
  await loadPortfolios();
}

/* Gated create button — runs plan/auth check before opening onboard screen */
async function psHandleCreate() {
  var allowed = await checkPortfolioAccess();
  if (allowed) showScreen('screenOnboard');
}

/* ── checkPortfolioAccess ──────────────────────────────────
   Fixed: waits for BOTH ig-user-ready AND ig-plan-ready events
   (whichever fires first), extended timeout to 5s, and falls
   back to a direct getSession() check so a logged-in user is
   never incorrectly treated as a guest even on slow connections.
   showUpgradeBar now receives isLoggedIn flag so the Login
   button is hidden when the user is already authenticated.
─────────────────────────────────────────────────────────── */
async function checkPortfolioAccess() {
  // Wait up to 5s for nav.js to resolve igUser + plan from ig-supabase
  if (!window.igUser) {
    await new Promise(function(resolve) {
      var done = false;
      function finish() { if (!done) { done = true; resolve(); } }
      document.addEventListener('ig-user-ready', finish, { once: true });
      document.addEventListener('ig-plan-ready', finish, { once: true }); // fires earlier
      setTimeout(finish, 5000); // extended from 2s → 5s for slow connections
    });
  }

  // Determine login state — prefer igUser, fall back to direct session check
  var loggedIn = !!window.igUser;
  var plan     = _getPlan(); // reads igUser.plan first, then localStorage

  if (!loggedIn) {
    // Last resort: ask the auth Supabase client directly
    var client = (typeof getSupabase === 'function') ? getSupabase() : null;
    if (client) {
      try {
        var sess = await client.auth.getSession();
        loggedIn = !!(sess.data && sess.data.session);
        // plan was written to localStorage by nav.js already — _getPlan() picks it up
      } catch(e) {}
    }
  }

  // Not logged in at all
  if (!loggedIn) {
    showUpgradeBar('Sign in to create your portfolio', false);
    return false;
  }

  // Admin / enterprise always allowed
  if (_isAdmin()) return true;

  // Issue #13 — Race condition fix: ensure psState.portfolios reflects the real
  // DB count before checking the slot limit. If loadPortfolios() hasn't resolved
  // yet (user tapped Create before the initial fetch finished), await it now.
  // This is a no-op on normal page loads where the fetch completes first.
  if (!psState.portfoliosLoaded && _portfoliosLoadPromise) {
    await _portfoliosLoadPromise;
  }

  // Check portfolio slot limit for this plan (reads from plan-config.js)
  var portfolioLimit = _getPlanCfg(plan).portfolios || 0;
  var existing       = (psState.portfolios || []).length;
  if (existing >= portfolioLimit) {
    var msg = plan === 'free'
      ? 'Free plan includes up to 3 portfolios — upgrade to keep them permanently'
      : plan === 'professional'
        ? 'Professional plan includes 1 portfolio — upgrade to Enterprise for 3'
        : 'Portfolio limit reached for your plan';
    showUpgradeBar(msg, true);
    return false;
  }

  // Check shared AI use limit
  var aiLimit = _getPlanCfg(plan).ai_uses;
  var aiUses  = _getAIUses();
  if (isFinite(aiLimit) && aiUses >= aiLimit) {
    showUpgradeBar('Monthly AI limit reached (' + aiLimit + ' uses) — upgrade for more', true);
    return false;
  }

  return true;
}

/* ══════════════════════════════════════════════════════════
   SCREEN NAVIGATION
══════════════════════════════════════════════════════════ */
function showScreen(id) {
  document.querySelectorAll(".ps-screen").forEach(s => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function confirmBackToDash() {
  if (confirm("Go back? Unsaved changes will be lost.")) showScreen("screenDash");
}

/* ══════════════════════════════════════════════════════════
   SUPABASE HELPERS
══════════════════════════════════════════════════════════ */
async function sbFetch(path, method = "GET", body = null) {
  // The portfolios table is on the CONTENT project (exeiojgldxqaakkybdij).
  // That project has no auth users, so sending a JWT from the auth project
  // causes 401 "No suitable key" errors. We use the anon key only.
  // Row ownership is scoped by user_id or session_id in the query itself.
  const opts = {
    method,
    headers: {
      "Content-Type":  "application/json",
      "apikey":        SUPABASE_KEY,          // content project anon key
      "Authorization": "Bearer " + SUPABASE_KEY, // anon — no JWT cross-project
      "x-session-id":  SESSION_ID,
      "Prefer":        method === "POST" ? "return=representation" : "",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(SUPABASE_URL + "/rest/v1" + path, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : null;
}

async function loadPortfolios() {
  // Capture this call as the in-flight promise so checkPortfolioAccess()
  // can await it if it fires before the fetch resolves (race condition fix).
  _portfoliosLoadPromise = (async function() {
    try {
      const userId = window.igUser && window.igUser.id;
      const filter = userId
        ? `user_id=eq.${userId}`
        : `user_session=eq.${SESSION_ID}`;
      const data = await sbFetch(
        `/portfolios?${filter}&order=created_at.desc&select=*`
      );
      psState.portfolios = data || [];
    } catch (e) {
      console.warn("[Portfolio] Could not load from Supabase:", e.message);
      psState.portfolios = [];
    }
    psState.portfoliosLoaded = true;
    renderDashGrid();
  })();
  return _portfoliosLoadPromise;
}

async function savePortfolioToDB(pf){

  // Require authenticated user — no anonymous saving
  const userId = localStorage.getItem("ig_user_id");

  if (!userId) {
    showUpgradeBar("Login required to save your portfolio");
    return false;
  }

  try{

    const res = await fetch("https://impactgrid-dijo.onrender.com/portfolio/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        session: userId,
        portfolio: pf
      })
    });

    const data = await res.json();

    if(data.success){
      showToast("Portfolio saved 🚀");
      return true;
    }else{
      showToast("Save failed");
      return false;
    }

  }catch(err){
    console.error(err);
    showToast("Server error");
    return false;
  }
}

/* ══════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════ */
function renderDashGrid() {
  const grid  = document.getElementById("dashGrid");
  const empty = document.getElementById("dashEmpty");
  const count = document.getElementById("dashCount");
  if (!grid) return;

  count.textContent = psState.portfolios.length + " portfolio" + (psState.portfolios.length !== 1 ? "s" : "");
  grid.querySelectorAll(".pf-card").forEach(c => c.remove());

  if (!psState.portfolios.length) {
    if (empty) empty.style.display = "";
    return;
  }
  if (empty) empty.style.display = "none";

  psState.portfolios.forEach(pf => {
    const card  = document.createElement("div");
    card.className = "pf-card";
    // data-created used by psMarkExpiredPortfolios() to detect and delete rows older than 7 days for free users
    if (pf.created_at) card.setAttribute("data-created", pf.created_at);
    const thumb = pf.hero_media && pf.hero_media[0] ? pf.hero_media[0].url : "";
    card.innerHTML = `
      <div class="pf-card-thumb">
        ${thumb ? `<img src="${thumb}" alt="${esc(pf.name)}"/>` : `<div class="pf-card-thumb-placeholder">✦</div>`}
        <div class="pf-card-pub-badge ${pf.published ? "live" : "draft"}">${pf.published ? "● LIVE" : "DRAFT"}</div>
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
      </div>`;
    grid.appendChild(card);
  });

  // Mark expired portfolios for free-plan users (7-day limit)
  psMarkExpiredPortfolios();
}

function openPortfolio(id, action) {
  const pf = psState.portfolios.find(p => p.id === id);
  if (!pf) return;

  // Issue #6 — Published portfolios are locked from editing.
  // A published portfolio is live and public; silent edits would change
  // the live page without the user re-publishing. Force them to unpublish first.
  if (action === 'edit' && pf.published) {
    showToast('This portfolio is live — unpublish it first to make changes.');
    // Still show the builder in read-only preview so they can see it,
    // but disable the Save/Publish buttons.
    psState.activePortfolio = JSON.parse(JSON.stringify(pf));
    populateBuilder(pf);
    showScreen('screenBuilder');
    // Disable save/publish controls
    var saveBtn    = document.querySelector('.bl-save-btn');
    var publishBtn = document.getElementById('blPublishBtn');
    if (saveBtn)    { saveBtn.disabled = true;    saveBtn.title    = 'Unpublish to edit'; }
    if (publishBtn) { publishBtn.disabled = true; publishBtn.title = 'Already published'; }
    // Show a persistent banner in the builder
    var footer = document.querySelector('.bl-footer');
    if (footer && !document.getElementById('blLockedNotice')) {
      var notice = document.createElement('div');
      notice.id = 'blLockedNotice';
      notice.style.cssText = 'width:100%;text-align:center;font-size:11px;color:var(--gold);font-family:var(--fm);padding:6px 0 0;letter-spacing:.3px;';
      notice.textContent = '✦ Portfolio is live — unpublish to edit';
      footer.appendChild(notice);
    }
    return;
  }

  // Re-enable controls if they were previously locked (user navigated back from a published portfolio)
  var saveBtn    = document.querySelector('.bl-save-btn');
  var publishBtn = document.getElementById('blPublishBtn');
  if (saveBtn)    { saveBtn.disabled = false;    saveBtn.title    = ''; }
  if (publishBtn) { publishBtn.disabled = false; publishBtn.title = ''; }
  var notice = document.getElementById('blLockedNotice');
  if (notice) notice.remove();

  psState.activePortfolio = JSON.parse(JSON.stringify(pf));
  populateBuilder(pf);
  showScreen('screenBuilder');
  if (action === 'publish') publishPortfolio();
}

function copyLink(slug) {
  navigator.clipboard.writeText(`https://impactgrid.app/p/${slug}`).catch(() => {});
  showToast("✓ Link copied!");
}

/* ══════════════════════════════════════════════════════════
   ONBOARDING STEPS
══════════════════════════════════════════════════════════ */
function obValidate() {
  const name  = (document.getElementById("obName")  || {}).value || "";
  const niche = (document.getElementById("obNiche") || {}).value || "";
  const btn   = document.getElementById("obNextBtn");
  if (btn && psState.currentStep === 1) btn.disabled = !(name.trim() && niche.trim());
}

function obNext() {
  if (psState.currentStep >= 4) { startGeneration(); return; }
  goToStep(psState.currentStep + 1);
}

function obBack() {
  if (psState.currentStep <= 1) return;
  goToStep(psState.currentStep - 1);
}

function goToStep(n) {
  psState.currentStep = n;
  document.querySelectorAll(".ob-step-content").forEach((el, i) => el.classList.toggle("active", i + 1 === n));
  document.querySelectorAll(".ob-step").forEach((el, i) => {
    el.classList.remove("active", "done");
    if (i + 1 < n)  el.classList.add("done");
    if (i + 1 === n) el.classList.add("active");
  });
  document.querySelectorAll(".ob-step-line").forEach((el, i) => el.classList.toggle("done", i + 1 < n));
  const back = document.getElementById("obBackBtn");
  if (back) back.style.display = n > 1 ? "" : "none";
  const next = document.getElementById("obNextBtn");
  if (next) { next.textContent = n === 4 ? "✦ Build My Portfolio" : "Continue →"; next.disabled = false; }
  const titles = ["Tell Dijo about yourself","Connect your platforms","Add your services & work","Choose your style"];
  const subs   = ["The more detail you give, the better Dijo builds.","Connect the platforms you're active on.","What do you offer? Add at least one service.","Pick a visual style and let Dijo do the rest."];
  const te = document.getElementById("obTitle"); if (te) te.textContent = titles[n-1] || "";
  const se = document.getElementById("obSub");   if (se) se.textContent = subs[n-1]   || "";
  if (n === 1) obValidate();
}

/* ── Row builders ── */
function addServiceRow(container) {
  const list = document.getElementById(container || "obServicesList");
  if (!list) return;
  const idx = list.children.length;
  const row = document.createElement("div");
  row.className = "ob-service-row";
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
    </div>`;
  list.appendChild(row);
}

function addProjectRow() {
  const list = document.getElementById("obProjectsList");
  if (!list) return;
  const idx = list.children.length;
  const row = document.createElement("div");
  row.className = "ob-project-row";
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">Project / Collab ${idx + 1}</span>
      <button class="ob-row-del" onclick="this.closest('.ob-project-row').remove()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Brand / project name"/>
    <input class="ob-input sm" placeholder="What you did" style="margin-top:6px"/>
    <input class="ob-input sm" placeholder="Project URL (optional)" style="margin-top:6px"/>`;
  list.appendChild(row);
}

function addTestimonialRow() {
  const list = document.getElementById("obTestimonialsList");
  if (!list) return;
  const row = document.createElement("div");
  row.className = "ob-testimonial-row";
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">Testimonial ${list.children.length + 1}</span>
      <button class="ob-row-del" onclick="this.closest('.ob-testimonial-row').remove()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Name & role (e.g. Jane Smith, Marketing Director at Gymshark)"/>
    <textarea class="ob-input sm" placeholder="What they said…" style="margin-top:6px;min-height:64px;resize:vertical"></textarea>`;
  list.appendChild(row);
}

/* ── Theme selection ── */
function selectTheme(el, themeId) {
  document.querySelectorAll("#obContent4 .ob-theme-opt").forEach(o => o.classList.remove("active"));
  el.classList.add("active");
  psState.selectedTheme = themeId;
}

function selectEditTheme(el, themeId) {
  document.querySelectorAll("#tabDesign .ob-theme-opt").forEach(o => o.classList.remove("active"));
  el.classList.add("active");
  if (psState.activePortfolio) psState.activePortfolio.theme = themeId;
  updatePreviewLive();
}

/* ══════════════════════════════════════════════════════════
   COLLECT ONBOARDING DATA
══════════════════════════════════════════════════════════ */
function collectOnboardData() {
  const g = id => (document.getElementById(id) || {}).value || "";

  const services = [];
  document.querySelectorAll(".ob-service-row").forEach(row => {
    const inputs = row.querySelectorAll("input");
    if (inputs[0]?.value?.trim()) {
      services.push({ title: inputs[0].value, description: inputs[1]?.value || "", price: inputs[2]?.value || "", icon: inputs[3]?.value || "✦" });
    }
  });

  const projects = [];
  document.querySelectorAll(".ob-project-row").forEach(row => {
    const inputs = row.querySelectorAll("input");
    if (inputs[0]?.value?.trim()) {
      projects.push({ title: inputs[0].value, description: inputs[1]?.value || "", url: inputs[2]?.value || "" });
    }
  });

  const testimonials = [];
  document.querySelectorAll(".ob-testimonial-row").forEach(row => {
    const inp = row.querySelector("input");
    const ta  = row.querySelector("textarea");
    if (inp?.value?.trim()) testimonials.push({ author: inp.value, quote: ta?.value || "" });
  });

  return {
    user_session:    SESSION_ID,
    name:            g("obName"),
    niche:           g("obNiche"),
    bio:             g("obAbout"),
    location:        g("obLocation"),
    email:           g("obEmail"),
    youtube_url:     g("obYTUrl"),
    tiktok_url:      g("obTTUrl"),
    instagram_url:   g("obIGUrl"),
    linkedin_url:    g("obLIUrl"),
    twitter_url:     g("obTWUrl"),
    total_followers: g("obTotalFollowers"),
    engagement_rate: g("obEngagement"),
    monthly_views:   g("obMonthlyViews"),
    theme:           psState.selectedTheme,
    accent_color:    g("obAccentColor") || "#c97e08",
    services,
    projects,
    testimonials,
    hero_media:      [],
    published:       false,
    slug:            generateSlug(g("obName")),
  };
}

function generateSlug(name) {
  return (name || "creator").toLowerCase().replace(/[^a-z0-9]/g, "") + Math.floor(Math.random() * 900 + 100);
}

/* ══════════════════════════════════════════════════════════
   AI GENERATION — via Render server
   Matches carousel-studio.js callAI pattern exactly
══════════════════════════════════════════════════════════ */
async function startGeneration() {
  if (!(await checkPortfolioAccess())) return;
  const pf = collectOnboardData();
  psState.activePortfolio = pf;
  psState.generating = true;

  showScreen("screenBuilder");
  const overlay = document.getElementById("genOverlay");
  if (overlay) overlay.classList.remove("hidden");

  /* ── Generation step indicators ── */
  const steps   = ["gs1","gs2","gs3","gs4","gs5"];
  let stepIdx   = 0;
  function advanceStep() {
    if (stepIdx > 0) {
      const prev = document.getElementById(steps[stepIdx - 1]);
      if (prev) { prev.classList.remove("active"); prev.classList.add("done"); }
    }
    const cur = document.getElementById(steps[stepIdx]);
    if (cur) cur.classList.add("active");
    stepIdx++;
  }

  advanceStep(); // Step 1: Analysing niche

  try {
    /* ── Single server call — Render handles all AI ── */
    const result = await callDijoServer("/portfolio/generate", pf);

    advanceStep(); // Step 2: copy done
    advanceStep(); // Step 3: visuals done

    /* Merge AI results into portfolio object */
    pf.ai_headline = result.ai_headline || pf.name;
    pf.ai_tagline  = result.ai_tagline  || pf.niche;
    pf.ai_bio      = result.ai_bio      || pf.bio;
    pf.ai_meta     = result.ai_meta     || "";
    pf.ai_cta      = result.ai_cta      || "Work With Me";
    pf.ai_terms    = result.ai_terms    || "";
    pf.ai_privacy  = result.ai_privacy  || "";
    pf.hero_media  = result.hero_media  || [];
    pf.services    = result.services    || pf.services; // enhanced by AI

    advanceStep(); // Step 4: legal done

    /* Save to Supabase */
    await savePortfolioToDB(pf);
    if (!_isAdmin()) {
      await incrementAIUse();
    }
    psState.portfolios.unshift(pf);

    advanceStep(); // Step 5: building preview

    /* Populate builder + render preview */
    populateBuilder(pf);
    renderPreview(pf);

    await sleep(600);
    if (overlay) overlay.classList.add("hidden");
    psState.generating = false;
    showToast("✦ Portfolio built by Dijo!");

  } catch (err) {
    console.error("[Portfolio] Generation error:", err.message);

    /* Server warm-up fallback — same pattern as carousel-studio.js */
    showToast("⚡ Generated offline — server warming up");
    if (overlay) overlay.classList.add("hidden");
    psState.generating = false;
    populateBuilder(pf);
    renderPreview(pf);
  }
}

/* ── Core server caller — mirrors carousel-studio.js callAI ── */
async function callDijoServer(endpoint, body) {
  const res = await fetch(DIJO_SERVER + endpoint, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Server responded " + res.status);
  return await res.json();
}

/* ── Regenerate a single section ── */
async function regenSection(section) {
  const pf = psState.activePortfolio;
  if (!pf) return;
  showToast("✦ Dijo is rewriting…");
  try {
    const result = await callDijoServer("/portfolio/regen", { section, portfolio: pf });

    if (section === "copy") {
      pf.ai_headline = result.ai_headline; setValue("ePortHeadline", result.ai_headline);
      pf.ai_tagline  = result.ai_tagline;  setValue("ePortTagline",  result.ai_tagline);
      pf.ai_bio      = result.ai_bio;      setValue("ePortBio",      result.ai_bio);
    }
    if (section === "media") {
      pf.hero_media = result.hero_media;
      renderHeroMediaStrip(result.hero_media);
    }
    if (section === "legal") {
      pf.ai_terms   = result.ai_terms;   setValue("eLegalTerms",   result.ai_terms);
      pf.ai_privacy = result.ai_privacy; setValue("eLegalPrivacy", result.ai_privacy);
    }
    if (section === "services") {
      pf.services = result.services;
      rebuildServiceRows(result.services);
    }

    updatePreviewLive();
    showToast("✦ Done!");
  } catch (e) {
    showToast("Could not reach Dijo server");
    console.error("[Portfolio] Regen error:", e.message);
  }
}

/* ══════════════════════════════════════════════════════════
   BUILDER — POPULATE & LIVE EDIT
══════════════════════════════════════════════════════════ */
function populateBuilder(pf) {
  setValue("ePortHeadline", pf.ai_headline || pf.name);
  setValue("ePortTagline",  pf.ai_tagline  || pf.niche);
  setValue("ePortBio",      pf.ai_bio      || pf.bio);
  setValue("eSocYT",        pf.youtube_url     || "");
  setValue("eSocTT",        pf.tiktok_url      || "");
  setValue("eSocIG",        pf.instagram_url   || "");
  setValue("eSocLI",        pf.linkedin_url    || "");
  setValue("eSocTW",        pf.twitter_url     || "");
  setValue("eSocFollowers", pf.total_followers || "");
  setValue("eSocEngagement",pf.engagement_rate || "");
  setValue("eSocViews",     pf.monthly_views   || "");
  setValue("eLegalTerms",   pf.ai_terms    || "");
  setValue("eLegalPrivacy", pf.ai_privacy  || "");
  if (pf.accent_color) {
    setValue("eAccentColor", pf.accent_color);
    const cv = document.getElementById("eColorVal");
    if (cv) cv.textContent = pf.accent_color;
  }
  const pill = document.getElementById("previewUrlPill");
  if (pill) pill.textContent = `impactgrid.app/p/${pf.slug}`;
  renderHeroMediaStrip(pf.hero_media || []);
  rebuildServiceRows(pf.services || []);
  // Set active theme button
  document.querySelectorAll("#tabDesign .ob-theme-opt").forEach(o => {
    o.classList.toggle("active", o.dataset.theme === (pf.theme || "dark"));
  });
  updatePreviewLive();
}

function updatePreviewLive() {
  if (!psState.activePortfolio) return;
  const pf = psState.activePortfolio;
  pf.ai_headline   = val("ePortHeadline") || pf.ai_headline;
  pf.ai_tagline    = val("ePortTagline")  || pf.ai_tagline;
  pf.ai_bio        = val("ePortBio")      || pf.ai_bio;
  pf.accent_color  = val("eAccentColor")  || pf.accent_color;
  pf.youtube_url   = val("eSocYT")        || pf.youtube_url;
  pf.tiktok_url    = val("eSocTT")        || pf.tiktok_url;
  pf.instagram_url = val("eSocIG")        || pf.instagram_url;
  pf.linkedin_url  = val("eSocLI")        || pf.linkedin_url;
  pf.twitter_url   = val("eSocTW")        || pf.twitter_url;
  pf.total_followers = val("eSocFollowers")  || pf.total_followers;
  pf.engagement_rate = val("eSocEngagement") || pf.engagement_rate;
  pf.monthly_views   = val("eSocViews")      || pf.monthly_views;
  const cv = document.getElementById("eColorVal");
  if (cv) cv.textContent = pf.accent_color || "#c97e08";
  // Collect services from live rows
  const services = [];
  document.querySelectorAll("#eServicesEdit .ob-service-row").forEach(row => {
    const inputs = row.querySelectorAll("input");
    if (inputs[0]?.value?.trim()) {
      services.push({ title: inputs[0].value, description: inputs[1]?.value || "", price: inputs[2]?.value || "", icon: inputs[3]?.value || "✦" });
    }
  });
  if (services.length) pf.services = services;
  renderPreview(pf);
}

/* ── Hero media strip ── */
function renderHeroMediaStrip(media) {
  const strip = document.getElementById("heroMediaStrip");
  if (!strip) return;
  strip.innerHTML = "";
  (media || []).forEach((m, i) => {
    const thumb = document.createElement("div");
    thumb.className = "hm-thumb";
    thumb.innerHTML = `
      <img src="${m.url}" alt="Hero ${i+1}" loading="lazy"/>
      <div class="hm-del" onclick="removeHeroMedia(${i})">✕</div>`;
    strip.appendChild(thumb);
  });
}

function removeHeroMedia(idx) {
  if (!psState.activePortfolio) return;
  psState.activePortfolio.hero_media.splice(idx, 1);
  renderHeroMediaStrip(psState.activePortfolio.hero_media);
  updatePreviewLive();
}

/* ── Service rows in builder ── */
function rebuildServiceRows(services) {
  const container = document.getElementById("eServicesEdit");
  if (!container) return;
  container.innerHTML = "";
  services.forEach(s => {
    const row = document.createElement("div");
    row.className = "ob-service-row";
    row.innerHTML = `
      <div class="ob-row-header">
        <span class="ob-row-title">${esc(s.title)}</span>
        <button class="ob-row-del" onclick="this.closest('.ob-service-row').remove();updatePreviewLive()">✕</button>
      </div>
      <input class="ob-input sm" value="${esc(s.title)}"       placeholder="Title"       oninput="updatePreviewLive()"/>
      <input class="ob-input sm" value="${esc(s.description)}" placeholder="Description" style="margin-top:6px" oninput="updatePreviewLive()"/>
      <div class="ob-two-inline" style="margin-top:6px">
        <input class="ob-input sm" value="${esc(s.price)}" placeholder="Price" oninput="updatePreviewLive()"/>
        <input class="ob-input sm" value="${esc(s.icon||'✦')}" placeholder="Icon"  oninput="updatePreviewLive()"/>
      </div>`;
    container.appendChild(row);
  });
}

function addEditServiceRow() {
  const container = document.getElementById("eServicesEdit");
  if (!container) return;
  const row = document.createElement("div");
  row.className = "ob-service-row";
  row.innerHTML = `
    <div class="ob-row-header">
      <span class="ob-row-title">New Service</span>
      <button class="ob-row-del" onclick="this.closest('.ob-service-row').remove();updatePreviewLive()">✕</button>
    </div>
    <input class="ob-input sm" placeholder="Title"       oninput="updatePreviewLive()"/>
    <input class="ob-input sm" placeholder="Description" style="margin-top:6px" oninput="updatePreviewLive()"/>
    <div class="ob-two-inline" style="margin-top:6px">
      <input class="ob-input sm" placeholder="Price" oninput="updatePreviewLive()"/>
      <input class="ob-input sm" placeholder="Icon"  oninput="updatePreviewLive()"/>
    </div>`;
  container.appendChild(row);
}

/* ── Builder tabs ── */
function setEditTab(btn, tabId) {
  document.querySelectorAll(".bl-tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".bl-tab-content").forEach(t => t.classList.remove("active"));
  btn.classList.add("active");
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add("active");
}

/* ══════════════════════════════════════════════════════════
   PREVIEW RENDERER — builds the actual mini-site HTML
══════════════════════════════════════════════════════════ */
function renderPreview(pf) {
  const iframe = document.getElementById("previewIframe");
  if (!iframe) return;
  const html = buildPortfolioHTML(pf);
  const blob = new Blob([html], { type:"text/html" });
  iframe.src = URL.createObjectURL(blob);
}

function buildPortfolioHTML(pf) {
  const t       = THEMES[pf.theme || "dark"];
  const accent  = pf.accent_color || t.accent;
  const heroImgs = (pf.hero_media || []).map(m => m.url).filter(Boolean);
  const heroImg0 = heroImgs[0] || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600`;
  const initials = (pf.name || "CR").split(" ").map(w => w[0] || "").join("").toUpperCase().slice(0,2);

  /* ── Social links ── */
  const socialLinks = [
    pf.youtube_url   ? { icon:"▶", label:"YouTube",    url:pf.youtube_url,   color:"#ff0000" } : null,
    pf.tiktok_url    ? { icon:"♪", label:"TikTok",     url:pf.tiktok_url,    color:"#69c9d0" } : null,
    pf.instagram_url ? { icon:"◉", label:"Instagram",  url:pf.instagram_url, color:"#e1306c" } : null,
    pf.linkedin_url  ? { icon:"in",label:"LinkedIn",   url:pf.linkedin_url,  color:"#0077b5" } : null,
    pf.twitter_url   ? { icon:"𝕏", label:"Twitter/X",  url:pf.twitter_url,   color:"#1d9bf0" } : null,
  ].filter(Boolean);

  /* ── Slideshow script ── */
  const slideshowScript = heroImgs.length > 1 ? `
    const _slides = ${JSON.stringify(heroImgs)};
    let _si = 0;
    const _heroBg = document.getElementById("heroBg");
    setInterval(() => {
      _si = (_si + 1) % _slides.length;
      _heroBg.style.opacity = "0";
      setTimeout(() => { _heroBg.style.backgroundImage = "url(" + _slides[_si] + ")"; _heroBg.style.opacity = "1"; }, 600);
    }, 5000);` : "";

  /* ── HTML sections ── */
  const servicesHTML = (pf.services || []).map(s => `
    <div class="card service-card">
      <div class="service-icon">${esc(s.icon || "✦")}</div>
      <div class="service-title">${esc(s.title)}</div>
      <div class="service-desc">${esc(s.description)}</div>
      ${s.price ? `<div class="service-price">${esc(s.price)}</div>` : ""}
    </div>`).join("");

  const projectsHTML = (pf.projects || []).map(p => `
    <div class="card">
      <div class="project-title">${esc(p.title)}</div>
      <div class="project-desc">${esc(p.description)}</div>
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" class="project-link">View project →</a>` : ""}
    </div>`).join("");

  const testimonialsHTML = (pf.testimonials || []).map(t2 => `
    <div class="card">
      <div class="testimonial-quote">"${esc(t2.quote)}"</div>
      <div class="testimonial-author">— ${esc(t2.author)}</div>
    </div>`).join("");

  const socialHTML = socialLinks.map(s => `
    <a href="${esc(s.url)}" target="_blank" class="social-link" style="--lc:${s.color}">
      <span class="si">${s.icon}</span>
      <span>${esc(s.label)}</span>
      <span class="sa">→</span>
    </a>`).join("");

  const statsHTML = (pf.total_followers || pf.engagement_rate || pf.monthly_views) ? `
    <div class="stats-row">
      ${pf.total_followers ? `<div class="stat"><div class="sv">${esc(pf.total_followers)}</div><div class="sl">FOLLOWERS</div></div>` : ""}
      ${pf.engagement_rate ? `<div class="stat"><div class="sv">${esc(pf.engagement_rate)}</div><div class="sl">ENGAGEMENT</div></div>` : ""}
      ${pf.monthly_views   ? `<div class="stat"><div class="sv">${esc(pf.monthly_views)}</div><div class="sl">MONTHLY VIEWS</div></div>` : ""}
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(pf.name)} — ${esc(pf.niche)}</title>
<meta name="description" content="${esc(pf.ai_meta || pf.niche + ' creator portfolio')}"/>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:${t.bg};--sf:${t.surface};--tx:${t.text};--sub:${t.sub};--bd:${t.border};--ac:${accent};--fh:'Syne',sans-serif}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx);line-height:1.6}
a{color:inherit;text-decoration:none}
/* NAV */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,.4);backdrop-filter:blur(16px);border-bottom:1px solid var(--bd)}
.nav-brand{font-family:var(--fh);font-size:15px;font-weight:800}
.nav-links{display:flex;gap:22px;font-size:13px;color:var(--sub)}
.nav-links a:hover{color:var(--tx)}
.nav-cta{padding:8px 18px;background:var(--ac);color:#fff;border-radius:8px;font-size:12px;font-weight:700;font-family:var(--fh);transition:.15s}
.nav-cta:hover{opacity:.85}
/* HERO */
.hero{min-height:100vh;position:relative;display:flex;align-items:center;overflow:hidden}
#heroBg{position:absolute;inset:0;background-image:url(${heroImg0});background-size:cover;background-position:center;transition:opacity .6s ease}
.hero-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.5) 0%,rgba(0,0,0,.65) 60%,var(--bg) 100%)}
.hero-c{position:relative;z-index:2;padding:120px 60px 80px;max-width:800px}
.eyebrow{font-size:11px;font-family:monospace;letter-spacing:3px;color:var(--ac);text-transform:uppercase;margin-bottom:14px}
.tagline{font-size:13px;color:var(--sub);margin-bottom:6px;font-family:monospace;letter-spacing:1px}
.headline{font-family:var(--fh);font-size:clamp(38px,5.5vw,76px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:18px}
.hero-bio{font-size:16px;color:var(--sub);max-width:540px;line-height:1.75;margin-bottom:30px}
.hero-btns{display:flex;gap:12px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:10px;font-family:var(--fh);font-size:13px;font-weight:700;transition:.2s}
.btn-p{background:var(--ac);color:#fff;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.btn-p:hover{opacity:.85;transform:translateY(-1px)}
.btn-s{border:1.5px solid rgba(255,255,255,.2);color:var(--tx)}
.btn-s:hover{border-color:var(--ac);color:var(--ac)}
/* SECTIONS */
.sec{padding:72px 60px;max-width:1100px;margin:0 auto}
.sec-lbl{font-size:10px;font-weight:700;font-family:monospace;letter-spacing:3px;color:var(--ac);text-transform:uppercase;margin-bottom:10px}
.sec-ttl{font-family:var(--fh);font-size:clamp(26px,3.5vw,44px);font-weight:800;letter-spacing:-1px;margin-bottom:36px;line-height:1.1}
/* STATS */
.stats-row{display:flex;gap:2px;margin:36px 0;flex-wrap:wrap}
.stat{flex:1;min-width:110px;padding:18px 22px;background:var(--sf);border:1px solid var(--bd);text-align:center}
.stat:first-child{border-radius:10px 0 0 10px}
.stat:last-child{border-radius:0 10px 10px 0}
.sv{font-family:var(--fh);font-size:30px;font-weight:800;color:var(--ac);line-height:1}
.sl{font-size:9px;letter-spacing:2px;color:var(--sub);margin-top:5px;font-family:monospace}
/* CARDS */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}
.card{background:var(--sf);border:1.5px solid var(--bd);border-radius:14px;padding:22px;transition:.2s}
.card:hover{border-color:var(--ac);transform:translateY(-2px)}
.service-icon{font-size:26px;margin-bottom:10px}
.service-title{font-family:var(--fh);font-size:15px;font-weight:700;margin-bottom:6px}
.service-desc{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:10px}
.service-price{font-family:monospace;font-size:17px;font-weight:700;color:var(--ac)}
.project-title{font-family:var(--fh);font-size:14px;font-weight:700;margin-bottom:6px}
.project-desc{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:10px}
.project-link{font-size:12px;font-weight:700;color:var(--ac);font-family:monospace}
.testimonial-quote{font-size:14px;line-height:1.75;color:var(--tx);margin-bottom:14px;font-style:italic}
.testimonial-author{font-size:11px;color:var(--ac);font-family:monospace;font-weight:700;letter-spacing:.5px}
/* SOCIAL */
.social-links{display:flex;flex-direction:column;gap:9px;max-width:460px}
.social-link{display:flex;align-items:center;gap:12px;padding:14px 18px;background:var(--sf);border:1.5px solid var(--bd);border-radius:12px;transition:.2s}
.social-link:hover{border-color:var(--lc,var(--ac));transform:translateX(4px)}
.si{width:34px;height:34px;border-radius:8px;background:var(--bd);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.sa{color:var(--sub);margin-left:auto;transition:.2s}
.social-link:hover .sa{color:var(--lc,var(--ac));transform:translateX(3px)}
/* CONTACT */
.contact-wrap{background:linear-gradient(135deg,rgba(255,255,255,.025),transparent);border:1.5px solid var(--bd);border-radius:20px;padding:56px;text-align:center;margin:0 60px 72px}
.contact-ttl{font-family:var(--fh);font-size:clamp(26px,4vw,46px);font-weight:800;letter-spacing:-1px;margin-bottom:10px}
.contact-sub{font-size:14px;color:var(--sub);margin-bottom:28px;max-width:460px;margin-left:auto;margin-right:auto}
/* FOOTER */
footer{border-top:1px solid var(--bd);padding:28px 60px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
.fl{display:flex;gap:18px;font-size:12px;color:var(--sub)}
.fl a:hover{color:var(--ac)}
/* MODALS */
.mo{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:200;display:none;align-items:center;justify-content:center;padding:20px}
.mo.show{display:flex}
.mb{background:var(--sf);border:1px solid var(--bd);border-radius:16px;max-width:660px;width:100%;max-height:80vh;overflow-y:auto;padding:32px}
.mb h2{font-family:var(--fh);font-size:20px;font-weight:800;margin-bottom:16px}
.mb p{font-size:13px;color:var(--sub);line-height:1.8;white-space:pre-line}
.mc{float:right;width:26px;height:26px;border-radius:7px;background:var(--sf);border:1px solid var(--bd);cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;color:var(--sub)}
/* ANIMATIONS */
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .55s ease both}
.d1{animation-delay:.08s}.d2{animation-delay:.16s}.d3{animation-delay:.24s}.d4{animation-delay:.32s}
@media(max-width:768px){
  .hero-c,.sec,.contact-wrap{padding:80px 20px 56px}
  .contact-wrap{margin:0 20px 56px}
  .nav-links{display:none}
  footer{padding:20px}
}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-brand">${esc(pf.name)}</div>
  <div class="nav-links">
    <a href="#about">About</a>
    <a href="#services">Services</a>
    ${pf.projects?.length ? `<a href="#work">Work</a>` : ""}
    <a href="#connect">Connect</a>
  </div>
  <a class="nav-cta" href="#contact">${esc(pf.ai_cta || "Work With Me")}</a>
</nav>

<section class="hero" id="home">
  <div id="heroBg"></div>
  <div class="hero-ov"></div>
  <div class="hero-c">
    <div class="eyebrow fu">${esc(pf.niche)}</div>
    <div class="tagline fu d1">${esc(pf.ai_tagline || "")}</div>
    <h1 class="headline fu d2">${esc(pf.ai_headline || pf.name)}</h1>
    <p class="hero-bio fu d3">${esc(pf.ai_bio || pf.bio || "")}</p>
    <div class="hero-btns fu d4">
      <a class="btn btn-p" href="#contact">${esc(pf.ai_cta || "Work With Me")} →</a>
      <a class="btn btn-s" href="#services">See My Services</a>
    </div>
  </div>
</section>

<section class="sec" id="about">
  ${statsHTML}
  <div class="sec-lbl">About</div>
  <div class="sec-ttl">${esc(pf.name)}</div>
  <p style="font-size:15px;color:var(--sub);max-width:660px;line-height:1.85">${esc(pf.ai_bio || pf.bio || "")}</p>
</section>

${pf.services?.length ? `
<section class="sec" id="services">
  <div class="sec-lbl">What I Offer</div>
  <div class="sec-ttl">Services &amp; Rates</div>
  <div class="grid">${servicesHTML}</div>
</section>` : ""}

${pf.projects?.length ? `
<section class="sec" id="work">
  <div class="sec-lbl">Portfolio</div>
  <div class="sec-ttl">Selected Work</div>
  <div class="grid">${projectsHTML}</div>
</section>` : ""}

${pf.testimonials?.length ? `
<section class="sec" id="testimonials">
  <div class="sec-lbl">Social Proof</div>
  <div class="sec-ttl">What Brands Say</div>
  <div class="grid">${testimonialsHTML}</div>
</section>` : ""}

<section class="sec" id="connect">
  <div class="sec-lbl">Find Me</div>
  <div class="sec-ttl">Follow My Journey</div>
  <div class="social-links">${socialHTML}</div>
</section>

<div class="contact-wrap" id="contact">
  <div class="sec-lbl">Let's Collaborate</div>
  <div class="contact-ttl">Ready to work together?</div>
  <p class="contact-sub">I partner with brands that align with my audience's values. Let's create something remarkable.</p>
  <a class="btn btn-p" href="#" onclick="openContactForm()" style="margin:0 auto">Get In Touch →</a>
</div>

<footer>
  <div style="font-family:var(--fh);font-size:14px;font-weight:700">${esc(pf.name)}</div>
  <div class="fl">
    <a style="cursor:pointer" onclick="document.getElementById('tm').classList.add('show')">Terms &amp; Conditions</a>
    <a style="cursor:pointer" onclick="document.getElementById('pm').classList.add('show')">Privacy Policy</a>
    ${pf.email ? `<a href="mailto:${esc(pf.email)}">Contact</a>` : ""}
  </div>
  <div style="font-size:11px;color:var(--sub)">Made with <a href="https://impactgrid.app" target="_blank" style="color:var(--ac)">ImpactGrid ✦</a></div>
</footer>

<div class="mo" id="tm" onclick="if(event.target===this)this.classList.remove('show')">
  <div class="mb"><button class="mc" onclick="document.getElementById('tm').classList.remove('show')">✕</button><h2>Terms &amp; Conditions</h2><p>${esc(pf.ai_terms || "No terms have been set.")}</p></div>
</div>
<div class="mo" id="pm" onclick="if(event.target===this)this.classList.remove('show')">
  <div class="mb"><button class="mc" onclick="document.getElementById('pm').classList.remove('show')">✕</button><h2>Privacy Policy</h2><p>${esc(pf.ai_privacy || "No privacy policy has been set.")}</p></div>
</div>

<script>
document.getElementById("heroBg").style.backgroundImage = "url(${heroImg0})";
${slideshowScript}
const _obs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting) x.target.classList.add("fu"); }),{threshold:0.1});
document.querySelectorAll(".sec,.card,.social-link").forEach(el => _obs.observe(el));
<\/script>
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════
   SAVE & PUBLISH
══════════════════════════════════════════════════════════ */
async function savePortfolio() {
  if (!psState.activePortfolio) return;
  updatePreviewLive();
  const pf = psState.activePortfolio;
  pf.ai_terms   = val("eLegalTerms")   || pf.ai_terms;
  pf.ai_privacy = val("eLegalPrivacy") || pf.ai_privacy;
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

  const linkEl = document.getElementById("pubLinkText");
  if (linkEl) linkEl.textContent = `impactgrid.app/p/${pf.slug}`;
  setValue("pubViewCount", "0");
  setValue("pubEnqCount",  "0");
  setValue("pubDaysLive",  "0");

  showScreen("screenPublished");
  spawnConfetti();
  navigator.clipboard.writeText(`https://impactgrid.app/p/${pf.slug}`).catch(() => {});
  showToast("🚀 Published! Link copied.");
  loadPortfolios();
}

/* ══════════════════════════════════════════════════════════
   SHARE HANDLERS
══════════════════════════════════════════════════════════ */
function copyPublishedLink() {
  const el  = document.getElementById("pubLinkText");
  const url = el ? "https://" + el.textContent : "";
  navigator.clipboard.writeText(url).catch(() => {});
  showToast("✓ Link copied!");
}

function shareToYouTube()  { showToast("📋 Paste your link in your YouTube description!"); }
function shareToTikTok()   { showToast("📋 Paste your link in your TikTok bio!"); }
function shareToLinkedIn() {
  const el  = document.getElementById("pubLinkText");
  const url = el ? "https://" + el.textContent : "";
  window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url), "_blank", "width=600,height=500");
}
function shareToInstagram() {
  const el = document.getElementById("pubLinkText");
  navigator.clipboard.writeText(el ? "https://" + el.textContent : "").catch(() => {});
  showToast("📸 Link copied — paste it in your Instagram bio!");
}

/* ══════════════════════════════════════════════════════════
   DEVICE PREVIEW
══════════════════════════════════════════════════════════ */
function setPreviewDevice(device) {
  const frame = document.getElementById("previewFrame");
  const dBtn  = document.getElementById("pdbDesktop");
  const mBtn  = document.getElementById("pdbMobile");
  if (!frame) return;
  frame.classList.toggle("mobile",  device === "mobile");
  frame.classList.toggle("desktop", device !== "mobile");
  dBtn?.classList.toggle("active", device !== "mobile");
  mBtn?.classList.toggle("active", device === "mobile");
}

function openPreviewTab() {
  const pf = psState.activePortfolio;
  if (!pf) return;
  const blob = new Blob([buildPortfolioHTML(pf)], { type:"text/html" });
  window.open(URL.createObjectURL(blob), "_blank");
}

/* ══════════════════════════════════════════════════════════
   UPLOAD
══════════════════════════════════════════════════════════ */
function handleHeroUpload(event) {
  Array.from(event.target.files || []).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      if (!psState.activePortfolio) return;
      psState.activePortfolio.hero_media = psState.activePortfolio.hero_media || [];
      psState.activePortfolio.hero_media.unshift({ type: file.type.startsWith("video") ? "video" : "image", url: e.target.result, credit:"Uploaded" });
      renderHeroMediaStrip(psState.activePortfolio.hero_media);
      updatePreviewLive();
    };
    reader.readAsDataURL(file);
  });
}

function dzOver(e, el)   { e.preventDefault(); el.classList.add("over"); }
function dzLeave(el)     { el.classList.remove("over"); }
function dzDrop(e, type) {
  e.preventDefault();
  e.currentTarget.classList.remove("over");
  if (e.dataTransfer.files.length && type === "hero")
    handleHeroUpload({ target: { files: e.dataTransfer.files } });
}

/* ══════════════════════════════════════════════════════════
   CONFETTI
══════════════════════════════════════════════════════════ */
function spawnConfetti() {
  const container = document.getElementById("pubConfetti");
  if (!container) return;
  container.innerHTML = "";
  const colors = ["#c97e08","#e8a020","#f0ede8","#22c55e","#2563eb","#e91e8c"];
  for (let i = 0; i < 80; i++) {
    const p    = document.createElement("div");
    const size = Math.random() * 10 + 4;
    p.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?"50%":"2px"};left:${Math.random()*100}%;top:-20px;animation:cFall ${Math.random()*2+1.5}s linear ${Math.random()*.5}s forwards;opacity:${Math.random()*.7+.3}`;
    container.appendChild(p);
  }
  if (!document.getElementById("cKF")) {
    const s = document.createElement("style");
    s.id = "cKF";
    s.textContent = `@keyframes cFall{to{transform:translateY(500px) rotate(720deg);opacity:0}}`;
    document.head.appendChild(s);
  }
}

/* ══════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════ */
function esc(s)        { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"); }
function val(id)       { const el = document.getElementById(id); return el ? el.value : ""; }
function setValue(id,v){ const el = document.getElementById(id); if (el) el.value = v || ""; }
function sleep(ms)     { return new Promise(r => setTimeout(r, ms)); }
function showToast(msg){ const s = document.getElementById("psToastShelf"); if(!s) return; const t=document.createElement("div"); t.className="ps-toast"; t.textContent=msg; s.appendChild(t); setTimeout(()=>t.remove(),3000); }
// toggleTheme() is defined in nav.js — do not redefine here

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  addServiceRow("obServicesList");
  loadPortfolios();
  psBannerInit(); // populate plan banner from window.igUser (may be null at this point — refreshed on ig-user-ready)

  // Onboard colour picker sync
  const cp = document.getElementById("obAccentColor");
  if (cp) cp.addEventListener("input", e => {
    const cv = document.getElementById("obColorVal");
    if (cv) cv.textContent = e.target.value;
  });

  // Builder colour picker sync
  const ecp = document.getElementById("eAccentColor");
  if (ecp) ecp.addEventListener("input", e => {
    const ecv = document.getElementById("eColorVal");
    if (ecv) ecv.textContent = e.target.value;
    if (psState.activePortfolio) psState.activePortfolio.accent_color = e.target.value;
    updatePreviewLive();
  });

  // Keep Render server warm (same as carousel-studio.js)
  setInterval(() => { fetch(DIJO_SERVER + "/ping").catch(() => {}); }, 600000);

  obValidate();
});

/* ── Nav sync: once igUser is resolved, reload portfolios with real user_id ── */
document.addEventListener('ig-user-ready', function(e) {
  // Re-load portfolios now that we have a real user_id to filter by
  loadPortfolios();
  // Refresh the plan banner with the now-populated igUser data
  psBannerInit();
  // After portfolios reload, mark expired cards for free users
  // Small delay so renderDashGrid() has finished inserting the cards
  setTimeout(psMarkExpiredPortfolios, 300);
});

/* ── Contact Form ── */
function openContactForm(){
  document.getElementById("contactModal").style.display = "flex";
}

function closeContactForm(){
  document.getElementById("contactModal").style.display = "none";
}

async function sendInquiry(){

  const name  = document.getElementById("cName").value;
  const email = document.getElementById("cEmail").value;
  const message = document.getElementById("cMsg").value;

  const creatorEmail = psState.activePortfolio && psState.activePortfolio.email;

  if(!creatorEmail){
    showToast("Creator email not set");
    return;
  }

  try{

    const res = await fetch("https://impactgrid-dijo.onrender.com/contact/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        message,
        creatorEmail
      })
    });

    const data = await res.json();

    if(data.success){
      showToast("Inquiry sent 🚀");
      closeContactForm();
    }else{
      showToast("Failed to send");
    }

  }catch(err){
    console.error(err);
    showToast("Server error");
  }
}

/* ══════════════════════════════════════════════════════════
   UPGRADE BAR
══════════════════════════════════════════════════════════ */
function showUpgradeBar(message, isLoggedIn) {
  let el = document.getElementById("upgradeBar");

  if (!el) {
    el = document.createElement("div");
    el.id = "upgradeBar";
    document.body.appendChild(el);
  }

  // Only show Login button if user is genuinely not authenticated
  var loginBtn = isLoggedIn
    ? ''
    : '<a href="login.html" class="btn btn-secondary">Login</a>';

  el.innerHTML =
    '<div class="upgrade-inner">'
    + '<span>' + message + '</span>'
    + '<div style="display:flex;gap:8px;">'
    + '<a href="pricing.html" class="btn btn-primary">Upgrade</a>'
    + loginBtn
    + '</div></div>';

  el.classList.add("show");

  setTimeout(() => {
    el.classList.remove("show");
  }, 5000); // slightly longer so user can read it
}

(function() {
  const style = document.createElement("style");
  style.innerHTML = [
    "#upgradeBar {",
    "  position: fixed;",
    "  top: 80px;",
    "  left: 50%;",
    "  transform: translateX(-50%) translateY(-20px);",
    "  background: var(--card);",
    "  border: 1px solid var(--border);",
    "  border-radius: 999px;",
    "  padding: 10px 16px;",
    "  box-shadow: var(--sh2);",
    "  opacity: 0;",
    "  transition: all .3s ease;",
    "  z-index: 9999;",
    "}",
    "#upgradeBar.show {",
    "  opacity: 1;",
    "  transform: translateX(-50%) translateY(0);",
    "}",
    ".upgrade-inner {",
    "  display: flex;",
    "  gap: 12px;",
    "  align-items: center;",
    "  font-size: 12px;",
    "}"
  ].join("\n");
  document.head.appendChild(style);
})();
