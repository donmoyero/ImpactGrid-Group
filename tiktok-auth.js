/* ================================================================
   IMPACTGRID — TikTok OAuth Auth Initiator  v2.1
   Fixes: browser-only OAuth (no app redirect), clean disconnect
================================================================ */

var TikTokAuth = (function() {

  var CLIENT_KEY   = 'awi4w15huo5zrxd5';
  var REDIRECT_URI = 'https://impactgridgroup.com/tiktok-callback.html';
  var DIJO_URL     = 'https://impactgrid-dijo.onrender.com';

  var SCOPES = [
    'user.info.basic',
    'user.info.profile',
    'user.info.stats',
    'video.list',
    'video.upload'
  ].join(',');

  function generateCodeVerifier() {
    var array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }

  async function generateCodeChallenge(verifier) {
    var encoder = new TextEncoder();
    var data    = encoder.encode(verifier);
    var digest  = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
      .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }

  function generateState() {
    var array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  }

  async function connect(buttonEl) {
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = 'Connecting…';
    }
    try {
      var verifier  = generateCodeVerifier();
      var challenge = await generateCodeChallenge(verifier);
      var state     = generateState();

      sessionStorage.setItem('tt_code_verifier', verifier);
      sessionStorage.setItem('tt_state', state);

      var params = new URLSearchParams({
        client_key:            CLIENT_KEY,
        response_type:         'code',
        scope:                 SCOPES,
        redirect_uri:          REDIRECT_URI,
        state:                 state,
        code_challenge:        challenge,
        code_challenge_method: 'S256',
        /* FIX: force web browser OAuth — prevents redirect to TikTok app */
        disable_auto_auth:     '1'
      });

      /* Open in same window — TikTok web OAuth page */
      window.location.href = 'https://www.tiktok.com/v2/auth/authorize/?' + params.toString();

    } catch(e) {
      console.error('[TikTokAuth] OAuth init failed:', e);
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = 'Connect with TikTok';
      }
      showError('Failed to start TikTok connection. Please try again.');
    }
  }

  async function exchangeCode(code, codeVerifier) {
    var res = await fetch(DIJO_URL + '/tiktok/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier })
    });
    if (!res.ok) throw new Error('Token exchange failed: HTTP ' + res.status);
    return await res.json();
  }

  async function fetchProfile(accessToken) {
    var res = await fetch(DIJO_URL + '/tiktok/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });
    if (!res.ok) throw new Error('Profile fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  async function fetchVideos(accessToken, maxCount) {
    var res = await fetch(DIJO_URL + '/tiktok/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, max_count: maxCount || 10 })
    });
    if (!res.ok) throw new Error('Videos fetch failed: HTTP ' + res.status);
    return await res.json();
  }

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

  function saveSession(tokenData, profile) {
    try {
      localStorage.setItem('tt_access_token',  tokenData.access_token);
      localStorage.setItem('tt_open_id',        tokenData.open_id);
      localStorage.setItem('tt_expires_at',     String(Date.now() + (tokenData.expires_in * 1000)));
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
        accessToken: token,
        openId:      localStorage.getItem('tt_open_id'),
        profile:     JSON.parse(localStorage.getItem('tt_profile') || 'null'),
        expiresAt:   exp
      };
    } catch(e) { return null; }
  }

  /* FIX: clears ALL TikTok keys so a new user can log in fresh */
  function clearSession() {
    var keys = [
      'tt_access_token','tt_open_id','tt_expires_at',
      'tt_refresh_token','tt_profile',
      'tt_code_verifier','tt_state'
    ];
    keys.forEach(function(k){
      try { localStorage.removeItem(k); } catch(e) {}
      try { sessionStorage.removeItem(k); } catch(e) {}
    });
  }

  function showError(msg) {
    var el = document.getElementById('tt-error-msg');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
    else console.error('[TikTokAuth]', msg);
  }

  return {
    connect:      connect,
    exchangeCode: exchangeCode,
    fetchProfile: fetchProfile,
    fetchVideos:  fetchVideos,
    publishVideo: publishVideo,
    saveSession:  saveSession,
    getSession:   getSession,
    clearSession: clearSession,
    showError:    showError,
    REDIRECT_URI: REDIRECT_URI,
    DIJO_URL:     DIJO_URL
  };

})();
