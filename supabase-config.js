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

var _contentClient = null;

function getContentClient() {
  if (!_contentClient) {
    _contentClient = supabase.createClient(IG_CONTENT_URL, IG_CONTENT_ANON);
  }
  return _contentClient;
}

/* Expose on window for inline scripts (index.html etc.) */
window.contentClient = getContentClient();
