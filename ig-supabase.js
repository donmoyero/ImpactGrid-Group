/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Client (Singleton)
   Single project — all reads/writes use one instance.
   getContentClient() is an alias for getSupabase() so
   admin.html works without any code changes.
═══════════════════════════════════════════════════════ */

var SUPABASE_URL  = 'https://wedjsnizcvtgptobwugc.supabase.co';
// 🚨 REPLACE THIS with your real anon public key from:
//    Supabase Dashboard → Settings → API → "anon public"
//    It must start with: eyJhbGciOiJIUzI1NiIs...
var SUPABASE_ANON = 'sb_publishable_7pp0dEBXmrEpiqsfF9SI-A_X0EWrmrW';

/* Singleton instance — created once, reused everywhere */
var _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession    : true,
        autoRefreshToken  : true,
        detectSessionInUrl: true,
        storageKey        : 'ig-auth-token'
      }
    });
  }
  return _supabaseClient;
}

/* Alias — admin.html uses getContentClient() for content
   tables and storage. Points to the same single project. */
function getContentClient() {
  return getSupabase();
}
