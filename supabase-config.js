/* ═══════════════════════════════════════════════════════
   ImpactGrid — Supabase Clients (Auth + Content)

   AUTH CLIENT  →  getSupabase() / getAuthClient()
   Project: wedjsnizcvtgptobwugc  (login / profiles)
   Tables : users, profiles, sessions

   CONTENT CLIENT → getContentClient()
   Project: impactgrid-group / exeiojgldxqaakkybdij
   Tables : site_slides, site_content, site_testimonials

   Load order: Supabase SDK script tag must come before this file.
   Both clients are lazy-initialised on first call.
═══════════════════════════════════════════════════════ */


/* ─────────────────────────────────────────────────────
   AUTH CLIENT
   Credentials kept as module-level vars — NOT on window
   ───────────────────────────────────────────────────── */

var _AUTH_URL      = 'https://wedjsnizcvtgptobwugc.supabase.co';
var _AUTH_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZGpzbml6Y3Z0Z3B0b2J3dWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzU3MzcsImV4cCI6MjA4OTQ1MTczN30._o8QcqElPb1ug3DgTi5uUaILMI40yLcZl1Uk21uWrkc';

var _authClient = null;

function getSupabase() {
  /* Reuse if auth.js or another script already created window.supabaseClient */
  if (window.supabaseClient) return window.supabaseClient;
  if (_authClient) return _authClient;

  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    console.error(
      '[supabase-config] Supabase SDK not loaded. ' +
      'Ensure the SDK <script> tag appears before supabase-config.js.'
    );
    return null;
  }

  try {
    _authClient = supabase.createClient(_AUTH_URL, _AUTH_ANON_KEY, {
      auth: {
        persistSession    : true,
        autoRefreshToken  : true,
        detectSessionInUrl: true,
        storageKey        : 'ig-auth-token'
      }
    });
    /* Expose on window so auth.js / nav.js can reach it */
    window.supabaseClient = _authClient;
  } catch (e) {
    console.error('[supabase-config] Failed to create auth client:', e.message);
    return null;
  }

  return _authClient;
}

/* Self-documenting alias for call-sites that deal with auth */
function getAuthClient() {
  return getSupabase();
}

window.getSupabase   = getSupabase;
window.getAuthClient = getAuthClient;


/* ─────────────────────────────────────────────────────
   CONTENT CLIENT  (public data only — no auth)
   Dashboard: https://supabase.com/dashboard/project/exeiojgldxqaakkybdij
   ───────────────────────────────────────────────────── */

var IG_CONTENT_URL  = 'https://exeiojgldxqaakkybdij.supabase.co';
var IG_CONTENT_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZWlvamdsZHhxYWFra3liZGlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDc4NTcsImV4cCI6MjA4ODkyMzg1N30.aRXgeHqaOxkidwpWVGEOKBQAeo9_C5Fk3Gu5ZlbmxTQ';
// ↑ Publishable (anon) key — safe in browser code.
//   Only grants access to tables with public RLS policies.

var _contentClient = null;

function getContentClient() {
  if (_contentClient) return _contentClient;

  if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
    console.error(
      '[supabase-config] Supabase SDK not loaded. ' +
      'Ensure <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"> ' +
      'appears before supabase-config.js in your <script> tags.'
    );
    return null;
  }

  try {
    _contentClient = supabase.createClient(IG_CONTENT_URL, IG_CONTENT_ANON, {
      auth: {
        persistSession    : false, // content client never stores a session
        autoRefreshToken  : false, // no token to refresh
        detectSessionInUrl: false, // never intercept OAuth redirects
        storageKey        : 'ig-content-token' // isolated — never clashes with ig-auth-token
      }
    });
  } catch (e) {
    console.error('[supabase-config] Failed to create content client:', e.message);
    return null;
  }

  return _contentClient;
}

window.getContentClient = getContentClient;

/* Eager init — succeeds silently if SDK already loaded, skips if not */
(function () {
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    getContentClient();
  }
})();
