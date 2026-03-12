/* ═══════════════════════════════════════════════
   ImpactGrid Group — Supabase Configuration
   Replace the values below with your project credentials
   from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
═══════════════════════════════════════════════ */

var SUPABASE_URL  = 'https://YOUR_PROJECT_REF.supabase.co';
var SUPABASE_ANON = 'YOUR_ANON_PUBLIC_KEY';

var _supabaseClient = null;

function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _supabaseClient;
}

window.supabaseClient = getSupabase();
