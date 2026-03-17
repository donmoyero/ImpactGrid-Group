/* ================================================================
   IMPACTGRID — YouTube OAuth Auth Initiator
   youtube-auth.js

   Handles:
   - YouTube Data API v3 (channel stats, video performance)
   - YouTube Analytics API (demographics, traffic sources)
   - YouTube upload (publish videos)

   SETUP:
   Replace YOUTUBE_CLIENT_ID with your Google OAuth Client ID from
   console.cloud.google.com → Credentials
================================================================ */

var YouTubeAuth = (function() {

  /* ── CONFIG ── */
  var CLIENT_ID    = 'YOUR_YOUTUBE_CLIENT_ID'; // e.g. '123456789-abc.apps.googleusercontent.com'
  var REDIRECT_URI = 'https://impactgridgroup.com/youtube-callback.html';
  var DIJO_URL     = 'https://impactgrid-dijo.onrender.com';

  /* ── Scopes ── */
  var SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',        // read channel + videos
    'https://www.googleapis.com/auth/yt-analytics.readonly',   // analytics data
    'https://www.googleapis.com/auth/youtube.upload',          // publish videos
    'https://www.googleapis.com/auth/userinfo.profile',        // basic profile
    'https://www.googleapis.com/auth/userinfo.email'           // email
  ].join(' ');

  /* ── State generator ── */
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
      buttonEl.innerHTML = '<span class="yt-spinner"></span> Connecting…';
    }

    try {
      var state = generateState();
      sessionStorage.setItem('yt_state', state);

      var params = new URLSearchParams({
        client_id:     CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        response_type: 'code',
        scope:         SCOPES,
        state:         state,
        access_type:   'offline',   // get refresh token
        prompt:        'consent'    // always show consent to get refresh token
      });

      var authURL = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
      window.location.href = authURL;

    } catch(e) {
      console.error('[YouTubeAuth] Failed to initiate OAuth:', e);
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.innerHTML = '⚠ Error — Try Again';
      }
      showError('Failed to initiate YouTube connection. Please try again.');
    }
  }

  /* ── Exchange code for token (via Dijo server) ── */
  async function exchangeCode(code) {
    var res = await fetch(DIJO_URL + '/youtube/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
    });
    if (!res.ok) throw new Error('Token exchange failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch channel profile ── */
  async function fetchChannel(accessToken) {
    var res = await fetch(DIJO_URL + '/youtube/channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });
    if (!res.ok) throw new Error('Channel fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch recent videos ── */
  async function fetchVideos(accessToken, maxResults) {
    var res = await fetch(DIJO_URL + '/youtube/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, max_results: maxResults || 10 })
    });
    if (!res.ok) throw new Error('Videos fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch analytics ── */
  async function fetchAnalytics(accessToken) {
    var res = await fetch(DIJO_URL + '/youtube/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });
    if (!res.ok) throw new Error('Analytics fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Token storage ── */
  function saveSession(tokenData, channel) {
    try {
      localStorage.setItem('yt_access_token',  tokenData.access_token);
      localStorage.setItem('yt_refresh_token', tokenData.refresh_token || '');
      localStorage.setItem('yt_expires_at',    Date.now() + ((tokenData.expires_in || 3600) * 1000));
      if (channel) localStorage.setItem('yt_channel', JSON.stringify(channel));
    } catch(e) {}
  }

  function getSession() {
    try {
      var token = localStorage.getItem('yt_access_token');
      var exp   = parseInt(localStorage.getItem('yt_expires_at') || '0');
      if (!token || Date.now() > exp) return null;
      return {
        accessToken:  token,
        refreshToken: localStorage.getItem('yt_refresh_token'),
        channel:      JSON.parse(localStorage.getItem('yt_channel') || 'null'),
        expiresAt:    exp
      };
    } catch(e) { return null; }
  }

  function clearSession() {
    ['yt_access_token','yt_refresh_token','yt_expires_at','yt_channel'].forEach(function(k) {
      try { localStorage.removeItem(k); } catch(e) {}
    });
  }

  function showError(msg) {
    var el = document.getElementById('yt-error-msg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    else console.error('[YouTubeAuth]', msg);
  }

  /* ── Public API ── */
  return {
    connect:       connect,
    exchangeCode:  exchangeCode,
    fetchChannel:  fetchChannel,
    fetchVideos:   fetchVideos,
    fetchAnalytics:fetchAnalytics,
    saveSession:   saveSession,
    getSession:    getSession,
    clearSession:  clearSession,
    showError:     showError,
    REDIRECT_URI:  REDIRECT_URI,
    DIJO_URL:      DIJO_URL
  };

})();
