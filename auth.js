// 🔥 GLOBAL AUTH SYSTEM (ONE SOURCE OF TRUTH)

// ── Supabase client init ──────────────────────────────────────────────────
// window.supabase is the Supabase JS SDK (loaded via <script> tag).
// We create the named client once here and expose it as window.supabaseClient
// so every module (creator-studio.js, etc.) can reach it via getSupabase().
(function () {
  if (window.supabaseClient) return; // already initialised — skip

  var url = window.SUPABASE_URL;
  var key = window.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[Auth] SUPABASE_URL / SUPABASE_ANON_KEY not set on window — client not created");
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error("[Auth] Supabase SDK not loaded — check your <script> tag order");
    return;
  }

  window.supabaseClient = window.supabase.createClient(url, key);
  console.log("[Auth] Supabase client ready");
})();

var IG_USER = null;
var IG_PLAN = "free";
var IG_IS_ADMIN = false;
var IG_USES = 0;

// ── Public accessors ─────────────────────────────────────────────────────
// These are the one source of truth used by every other module.
// creator-studio.js and any other script must call these — never read
// the IG_ vars directly.

function getSupabase() {
  return window.supabaseClient || null;
}

function getUser() {
  return IG_USER;
}

function setUser(user) {
  IG_USER = user || null;
}

function getPlan() {
  return IG_PLAN;
}

function getUses() {
  try { return parseInt(localStorage.getItem('ig_uses') || '0'); } catch(e) { return IG_USES; }
}

function incrementUses() {
  const next = getUses() + 1;
  IG_USES = next;
  try { localStorage.setItem('ig_uses', next); } catch(e) {}
}

async function initAuth() {
  const sb = window.supabaseClient;
  if (!sb) {
    console.warn("[Auth] supabaseClient not ready — skipping initAuth");
    return;
  }

  let data;
  try {
    ({ data } = await sb.auth.getUser());
  } catch (e) {
    console.warn("[Auth] getUser failed:", e.message);
    return;
  }
  IG_USER = data?.user || null;

  if (!IG_USER) return;

  // 👑 ADMIN
  if (
    IG_USER.email === "admin@impactgridgroup.com" ||
    IG_USER.user_metadata?.role === "admin"
  ) {
    IG_IS_ADMIN = true;
    IG_PLAN = "enterprise";
  }

  // 💳 PLAN (REAL SOURCE)
  if (IG_USER.user_metadata?.plan) {
    IG_PLAN = IG_USER.user_metadata.plan;
  }

  console.log("AUTH READY:", {
    user: IG_USER?.email,
    plan: IG_PLAN,
    admin: IG_IS_ADMIN
  });

  // Notify creator-studio.js that auth is settled — it updates UI
  if (typeof loadUser === 'function') loadUser();
}

function isAdmin() {
  return IG_IS_ADMIN;
}

function canUse(feature) {
  if (isAdmin()) return true;

  const limits = {
    generator: 3,
    portfolio: 1,
    carousel: 2
  };

  const key = "ig_usage_" + feature;
  const used = parseInt(localStorage.getItem(key) || "0");

  if (IG_PLAN === "free" && used >= limits[feature]) {
    return false;
  }

  localStorage.setItem(key, used + 1);
  return true;
}
