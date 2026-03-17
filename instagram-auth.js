/* ================================================================
   IMPACTGRID — Instagram OAuth Auth Initiator
   instagram-auth.js

   Handles:
   - Instagram Login (OAuth 2.0)
   - Display API (profile + media)
   - Insights API (engagement + reach)
   - Content Publishing API (post photos/videos/reels)

   SETUP:
   Replace INSTAGRAM_APP_ID with your Meta App ID from
   developers.facebook.com → Your App → App Settings → Basic
================================================================ */

var InstagramAuth = (function() {

  /* ── CONFIG — replace with your real values ── */
  var APP_ID       = '1626447435061148'; // e.g. '1234567890'
  var REDIRECT_URI = 'https://impactgridgroup.com/instagram-callback.html';
  var DIJO_URL     = 'https://impactgrid-dijo.onrender.com';

  /* ── Scopes ── */
  var SCOPES = [
    'instagram_business_basic',
    'instagram_business_content_publish',
    'instagram_business_manage_insights',
    'instagram_basic',
    'pages_show_list',
    'pages_read_engagement'
  ].join(',');

  /* ── State generator for CSRF protection ── */
  function generateState() {
    var array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  /* ── Initiate OAuth flow ── */
  function connect(buttonEl) {
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.innerHTML = '<span class="ig-spinner"></span> Connecting…';
    }

    try {
      var state = generateState();
      sessionStorage.setItem('ig_state', state);

      var params = new URLSearchParams({
        client_id:     APP_ID,
        redirect_uri:  REDIRECT_URI,
        scope:         SCOPES,
        response_type: 'code',
        state:         state
      });

      var authURL = 'https://www.facebook.com/v19.0/dialog/oauth?' + params.toString();
      window.location.href = authURL;

    } catch(e) {
      console.error('[InstagramAuth] Failed to initiate OAuth:', e);
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.innerHTML = '⚠ Error — Try Again';
      }
      showError('Failed to initiate Instagram connection. Please try again.');
    }
  }

  /* ── Exchange code for token (via Dijo server) ── */
  async function exchangeCode(code) {
    var res = await fetch(DIJO_URL + '/instagram/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code:         code,
        redirect_uri: REDIRECT_URI
      })
    });
    if (!res.ok) throw new Error('Token exchange failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch user profile ── */
  async function fetchProfile(accessToken, userId) {
    var res = await fetch(DIJO_URL + '/instagram/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId })
    });
    if (!res.ok) throw new Error('Profile fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch media list ── */
  async function fetchMedia(accessToken, userId) {
    var res = await fetch(DIJO_URL + '/instagram/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId })
    });
    if (!res.ok) throw new Error('Media fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch insights ── */
  async function fetchInsights(accessToken, userId) {
    var res = await fetch(DIJO_URL + '/instagram/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId })
    });
    if (!res.ok) throw new Error('Insights fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Publish content ── */
  async function publishContent(accessToken, userId, imageUrl, caption) {
    var res = await fetch(DIJO_URL + '/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: accessToken,
        user_id:      userId,
        image_url:    imageUrl,
        caption:      caption || ''
      })
    });
    if (!res.ok) throw new Error('Publish failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Token storage ── */
  function saveSession(tokenData, profile) {
    try {
      localStorage.setItem('ig_access_token', tokenData.access_token);
      localStorage.setItem('ig_user_id',      tokenData.user_id || '');
      localStorage.setItem('ig_expires_at',   Date.now() + (tokenData.expires_in * 1000 || 3600000));
      if (profile) localStorage.setItem('ig_profile', JSON.stringify(profile));
    } catch(e) {}
  }

  function getSession() {
    try {
      var token = localStorage.getItem('ig_access_token');
      var exp   = parseInt(localStorage.getItem('ig_expires_at') || '0');
      if (!token || Date.now() > exp) return null;
      return {
        accessToken: token,
        userId:      localStorage.getItem('ig_user_id'),
        profile:     JSON.parse(localStorage.getItem('ig_profile') || 'null'),
        expiresAt:   exp
      };
    } catch(e) { return null; }
  }

  function clearSession() {
    ['ig_access_token','ig_user_id','ig_expires_at','ig_profile'].forEach(function(k) {
      try { localStorage.removeItem(k); } catch(e) {}
    });
  }

  function showError(msg) {
    var el = document.getElementById('ig-error-msg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    else console.error('[InstagramAuth]', msg);
  }

  /* ── Public API ── */
  return {
    connect:        connect,
    exchangeCode:   exchangeCode,
    fetchProfile:   fetchProfile,
    fetchMedia:     fetchMedia,
    fetchInsights:  fetchInsights,
    publishContent: publishContent,
    saveSession:    saveSession,
    getSession:     getSession,
    clearSession:   clearSession,
    showError:      showError,
    REDIRECT_URI:   REDIRECT_URI,
    DIJO_URL:       DIJO_URL
  };

})();
