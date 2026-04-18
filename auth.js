// 🔥 GLOBAL AUTH SYSTEM (ONE SOURCE OF TRUTH)

var IG_USER = null;
var IG_PLAN = "free";
var IG_IS_ADMIN = false;

async function initAuth() {
  const sb = window.supabase;
  if (!sb) {
    console.warn("[Auth] Supabase not loaded — skipping initAuth");
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
