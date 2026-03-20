/* ================================================================
   IMPACTGRID — TikTok OAuth Auth Initiator
   tiktok-auth.js
================================================================ */

var TikTokAuth = (function() {

  var CLIENT_KEY   = 'awi4w15huo5zrxd5';
  var REDIRECT_URI = 'https://impactgridgroup.com/tiktok-callback.html';
  var DIJO_URL     = 'https://impactgrid-dijo.onrender.com';

  /* ── Scopes — exactly matching your approved TikTok app ── */
  var SCOPES = [
    'user.info.basic',    // Login Kit  — display name, avatar, open_id
    'user.info.profile',  // Login Kit  — profile_web_link, bio, is_verified
    'user.info.stats',    // Display API — likes, follower, following, video count
    'video.list',         // Display API — user's video list
    'video.upload'        // Content Posting API — upload as draft
  ].join(',');

  /* ── PKCE helpers ── */
  function generateCodeVerifier() {
    var array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  async function generateCodeChallenge(verifier) {
    var encoder = new TextEncoder();
    var data    = encoder.encode(verifier);
    var digest  = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function generateState() {
    var array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, function(b) { return b.toString(16).padStart(2,'0'); }).join('');
  }

  /* ── Initiate OAuth flow ── */
  async function connect(buttonEl) {
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.innerHTML = '<span class="tt-spinner"></span> Connecting…';
    }
    try {
      var verifier  = generateCodeVerifier();
      var challenge = await generateCodeChallenge(verifier);
      var state     = generateState();

      sessionStorage.setItem('tt_code_verifier', verifier);
      sessionStorage.setItem('tt_state',         state);

      var params = new URLSearchParams({
        client_key:            CLIENT_KEY,
        response_type:         'code',
        scope:                 SCOPES,
        redirect_uri:          REDIRECT_URI,
        state:                 state,
        code_challenge:        challenge,
        code_challenge_method: 'S256'
      });

      window.location.href = 'https://www.tiktok.com/v2/auth/authorize/?' + params.toString();

    } catch(e) {
      console.error('[TikTokAuth] Failed to initiate OAuth:', e);
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.innerHTML = '⚠ Error — Try Again';
      }
      TikTokAuth.showError('Failed to initiate TikTok connection. Please try again.');
    }
  }

  /* ── Exchange code for token (via Dijo server) ── */
  async function exchangeCode(code, codeVerifier) {
    var res = await fetch(DIJO_URL + '/tiktok/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier })
    });
    if (!res.ok) throw new Error('Token exchange failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch user profile ── */
  async function fetchProfile(accessToken) {
    var res = await fetch(DIJO_URL + '/tiktok/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });
    if (!res.ok) throw new Error('Profile fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Fetch user videos ── */
  async function fetchVideos(accessToken, maxCount) {
    var res = await fetch(DIJO_URL + '/tiktok/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, max_count: maxCount || 10 })
    });
    if (!res.ok) throw new Error('Videos fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Publish video (upload as draft) ── */
  async function publishVideo(accessToken, videoUrl, caption, privacyLevel) {
    var res = await fetch(DIJO_URL + '/tiktok/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token:  accessToken,
        video_url:     videoUrl,
        caption:       caption || '',
        privacy_level: privacyLevel || 'PUBLIC_TO_EVERYONE'
      })
    });
    if (!res.ok) throw new Error('Publish failed: HTTP ' + res.status);
    return await res.json();
  }

  /* ── Token storage ── */
  function saveSession(tokenData, profile) {
    try {
      localStorage.setItem('tt_access_token',  tokenData.access_token);
      localStorage.setItem('tt_open_id',        tokenData.open_id);
      localStorage.setItem('tt_expires_at',     Date.now() + (tokenData.expires_in * 1000));
      localStorage.setItem('tt_refresh_token',  tokenData.refresh_token || '');
      if (profile) localStorage.setItem('tt_profile', JSON.stringify(profile));
    } catch(e) {}
  }

  function getSession() {
    try {
      var token = localStorage.getItem('tt_access_token');
      var exp   = parseInt(localStorage.getItem('tt_expires_at') || '0');
      if (!token || Date.now() > exp) return null;
      return {
        accessToken:  token,
        openId:       localStorage.getItem('tt_open_id'),
        profile:      JSON.parse(localStorage.getItem('tt_profile') || 'null'),
        expiresAt:    exp
      };
    } catch(e) { return null; }
  }

  function clearSession() {
    ['tt_access_token','tt_open_id','tt_expires_at','tt_refresh_token','tt_profile'].forEach(function(k){
      try { localStorage.removeItem(k); } catch(e) {}
    });
  }

  function showError(msg) {
    var el = document.getElementById('tt-error-msg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    else console.error('[TikTokAuth]', msg);
  }

  return {
    connect:       connect,
    exchangeCode:  exchangeCode,
    fetchProfile:  fetchProfile,
    fetchVideos:   fetchVideos,
    publishVideo:  publishVideo,
    saveSession:   saveSession,
    getSession:    getSession,
    clearSession:  clearSession,
    showError:     showError,
    REDIRECT_URI:  REDIRECT_URI,
    DIJO_URL:      DIJO_URL
  };

})();
