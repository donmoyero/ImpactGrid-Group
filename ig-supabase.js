/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Client
   Used by: admin.html, dashboard.html, network.html,
            employer-dashboard.html, join.html, login.html
            and all other pages that need Supabase access.
   Do NOT commit service_role key here — anon key only.
═══════════════════════════════════════════════════════ */

var SUPABASE_URL  = 'https://wedjsnizcvtgptobwugc.supabase.co';
var SUPABASE_ANON = 'sb_publishable_7pp0dEBXmrEpiqsfF9SI-A_X0EWrmrW';

/* Returns a fresh Supabase client instance */
function getSupabase() {
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
}
