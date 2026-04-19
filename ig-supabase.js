/* ═══════════════════════════════════════════════════════
   ImpactGrid — Auth Supabase Client (Singleton)
   Project: wedjsnizcvtgptobwugc  (login / profiles)

   This file handles AUTH only:
     - User login, sessions, profiles table
     - window.supabaseClient  ← the auth client
     - window.getSupabase()   ← returns auth client
     - window.getAuthClient() ← alias for getSupabase()

   DO NOT use for content/data tables (portfolios, slides).
   For content → use supabase-config.js / getContentClient()

   NOTE: getContentClient is intentionally NOT defined here.
   It lives exclusively in supabase-config.js so there is
   only one definition and zero naming conflicts.
═══════════════════════════════════════════════════════ */

/* ── Expose credentials on window so auth.js and nav.js can read them ── */
window.SUPABASE_URL      = 'https://wedjsnizcvtgptobwugc.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGpzbml6Y3Z0Z3B0b2J3dWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzU3MzcsImV4cCI6MjA4OTQ1MTczN30._o8QcqElPb1ug3DgTi5uUaILMI40yLcZl1Uk21uWrkc';

/* Singleton instance — created once, reused everywhere */
var _supabaseClient = null;

function getSupabase() {
  /* If auth.js already created window.supabaseClient, reuse it — one client only */
  if (window.supabaseClient) return window.supabaseClient;
  if (!_supabaseClient) {
    _supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: {
        persistSession    : true,
        autoRefreshToken  : true,
        detectSessionInUrl: true,
        storageKey        : 'ig-auth-token'
      }
    });
    /* Store on window so auth.js / nav.js can also reach it */
    window.supabaseClient = _supabaseClient;
  }
  return _supabaseClient;
}

/* getAuthClient — explicit alias so call sites are self-documenting.
   admin.html and any page that needs the AUTH project uses this.
   Never conflicts with getContentClient() from supabase-config.js. */
function getAuthClient() {
  return getSupabase();
}

/* ── Expose on window ── */
window.getSupabase    = getSupabase;
window.getAuthClient  = getAuthClient;
/* NOTE: window.getContentClient is NOT set here — supabase-config.js owns it */
