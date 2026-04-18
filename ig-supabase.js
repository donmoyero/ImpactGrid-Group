/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Client (Singleton)
   Single project — all reads/writes use one instance.
   getContentClient() is an alias for getSupabase() so
   admin.html works without any code changes.
═══════════════════════════════════════════════════════ */

/* ── Expose on window so auth.js (and any other module) can read them ── */
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

/* Alias — admin.html uses getContentClient() for content
   tables and storage. Points to the same single project. */
function getContentClient() {
  return getSupabase();
}

/* ── Expose on window so nav.js, auth.js, and any inline script can reach them ── */
window.getSupabase      = getSupabase;
window.getContentClient = getContentClient;
