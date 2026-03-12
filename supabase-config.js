/* ═══════════════════════════════════════════════
   ImpactGrid Group — Supabase Configuration
   Project: impactgrid-group
   Dashboard: https://supabase.com/dashboard/project/exeiojgldxqaakkybdij
═══════════════════════════════════════════════ */
var SUPABASE_URL  = 'https://exeiojgldxqaakkybdij.supabase.co';
var SUPABASE_ANON = 'sb_publishable_ZuzIHR43W_7OpCejLpFyTQ_r5HQYHSq';

var _supabaseClient = null;
function getSupabase() {
  if (!_supabaseClient) {
    _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _supabaseClient;
}
window.supabaseClient = getSupabase();
