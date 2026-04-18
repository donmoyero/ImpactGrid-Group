/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Client (Singleton)
   Single project — all reads/writes use one instance.
   getContentClient() is an alias for getSupabase() so
   admin.html works without any code changes.
═══════════════════════════════════════════════════════ */

/* ── Expose on window so auth.js (and any other module) can read them ── */
window.SUPABASE_URL      = 'https://wedjsnizcvtgptobwugc.supabase.co';
window.SUPABASE_ANON_KEY = 'sb_publishable_7pp0dEBXmrEpiqsfF9SI-A_X0EWrmrW';

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
