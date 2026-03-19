/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Client (Singleton)
   Used by all pages. Returns one shared instance
   to avoid multiple GoTrueClient warnings.
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
