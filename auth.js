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

  // Use the public setter — never write IG_USER directly
  setUser(data?.user || null);

  if (!getUser()) return;

  _applyRoles(getUser());

  console.log("AUTH READY:", {
    user: getUser()?.email,
    plan: IG_PLAN,
    admin: IG_IS_ADMIN
  });

  // Notify creator-studio.js — pass the already-resolved user so
  // loadUser() doesn't need a second getUser() network call
  if (typeof loadUser === 'function') loadUser();

  // Listen for auth state changes (OAuth redirects, sign-out, token refresh)
  // Registered once here so there's a single source of truth
  sb.auth.onAuthStateChange(function(event, session) {
    var u = session ? session.user : null;
    setUser(u);
    if (u) {
      _applyRoles(u);
      if (typeof window.setNavUser === 'function') window.setNavUser(u);
      if (typeof loadUser === 'function') loadUser();
    } else {
      IG_IS_ADMIN = false;
      IG_PLAN = 'free';
      if (typeof window.setNavGuest === 'function') window.setNavGuest();
    }
  });
}

// ── Internal: derive plan + admin from a user object ─────────────────────
function _applyRoles(user) {
  if (!user) return;

  // 👑 ADMIN
  if (
    user.email === "admin@impactgridgroup.com" ||
    user.user_metadata?.role === "admin"
  ) {
    IG_IS_ADMIN = true;
    IG_PLAN = "enterprise";
  }

  // 💳 PLAN (real source: user_metadata.plan)
  if (user.user_metadata?.plan) {
    IG_PLAN = user.user_metadata.plan;
  }
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
