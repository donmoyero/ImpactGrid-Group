/* ═══════════════════════════════════════════════════════
   ImpactGrid — Content Supabase Client
   Project: impactgrid-group (content / admin project)
   Dashboard: https://supabase.com/dashboard/project/exeiojgldxqaakkybdij

   PURPOSE:
   This client is for PUBLIC CONTENT ONLY:
   - site_slides      (hero slideshow)
   - site_content     (ecosystem text, CTA copy)
   - site_testimonials
   - admin posting (jobs, slides)

   DO NOT use this for user auth, profiles, or sessions.
   For auth → use ig-supabase.js / getSupabase()

   NAMING: All variables are prefixed IG_CONTENT_ / _content
   so this file can safely load alongside ig-supabase.js
   on pages that need both (e.g. index.html).
═══════════════════════════════════════════════════════ */

var IG_CONTENT_URL  = 'https://exeiojgldxqaakkybdij.supabase.co';
var IG_CONTENT_ANON = 'sb_publishable_ZuzIHR43W_7OpCejLpFyTQ_r5HQYHSq';
// ↑ This is a publishable (anon) key — safe to include in browser code.
//   It only grants access to tables with public RLS policies (site_slides, site_content etc.)

var _contentClient = null;

function getContentClient() {
  if (_contentClient) return _contentClient;

  // Guard: Supabase SDK must be loaded via <script> before this file runs.
  // The UMD build exposes window.supabase — if it's missing, log clearly and return null.
  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    console.error(
      '[supabase-config] Supabase SDK not loaded. ' +
      'Ensure <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"> ' +
      'appears before supabase-config.js in your <script> tags.'
    );
    return null;
  }

  try {
    // ✅ FIX: persistSession:false stops the content client from ever storing
    //         or reading an auth session. Without this, the Supabase SDK was
    //         automatically calling auth/v1/user on the CONTENT project
    //         (exeiojgldxqaakkybdij) to validate the token it found in default
    //         localStorage — causing a 403 because that project has no auth users.
    //         storageKey isolates this client from ig-auth-token used by auth.js.
    _contentClient = supabase.createClient(IG_CONTENT_URL, IG_CONTENT_ANON, {
      auth: {
        persistSession:     false, // content client never stores a session
        autoRefreshToken:   false, // no token to refresh
        detectSessionInUrl: false, // never intercept OAuth redirects
        storageKey:         'ig-content-token' // isolated — never clashes with ig-auth-token
      }
    });
  } catch (e) {
    console.error('[supabase-config] Failed to create content client:', e.message);
    return null;
  }

  return _contentClient;
}

/* Expose on window for inline scripts (index.html etc.)
   Lazy: called on first use, not at parse time, so SDK load order doesn't matter. */
window.getContentClient = getContentClient;

/* Also attempt an eager init — succeeds silently if SDK is already loaded,
   skips silently if not (caller will retry via getContentClient() on demand). */
(function() {
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    getContentClient();
  }
})();
