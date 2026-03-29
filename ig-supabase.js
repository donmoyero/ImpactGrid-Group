/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Client (Singleton)
   Single project — all reads/writes use one instance.
   getContentClient() is an alias for getSupabase() so
   admin.html works without any code changes.
═══════════════════════════════════════════════════════ */

var SUPABASE_URL  = 'https://wedjsnizcvtgptobwugc.supabase.co';
var SUPABASE_ANON = 'sb_publishable_7pp0dEBXmrEpiqsfF9SI-A_X0EWrmrW';

/* Singleton instance — created once, reused everywhere */
var _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
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
