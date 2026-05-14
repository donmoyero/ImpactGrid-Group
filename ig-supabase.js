/* ═══════════════════════════════════════════════════════
   ImpactGrid — ig-supabase.js  (SHIM — safe to remove later)

   Auth has moved to supabase-config.js.
   This file is kept only so pages that still load ig-supabase.js
   don't break. It does nothing: getSupabase / getAuthClient are
   already defined on window by supabase-config.js.

   Load order:  supabase-config.js  →  ig-supabase.js  (if kept)

   TODO: Once you've confirmed all pages load supabase-config.js
         directly, remove the <script> tag for ig-supabase.js and
         delete this file.
═══════════════════════════════════════════════════════ */

(function () {
  if (typeof window.getSupabase !== 'function') {
    console.error(
      '[ig-supabase] supabase-config.js must load before ig-supabase.js. ' +
      'Check your <script> tag order.'
    );
  }
  /* getSupabase, getAuthClient, getContentClient are all on window
     courtesy of supabase-config.js — nothing else to do here. */
})();
