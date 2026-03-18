/* ================================================================
   IMPACTGRID — Instagram OAuth Auth Initiator
   instagram-auth.js

   NOTE: Instagram integration is pending Meta app approval.
         COMING_SOON = true blocks the OAuth flow entirely.
         Set to false once Meta approves the app.
================================================================ */

var InstagramAuth = (function() {

  /* ── CONFIG ── */
  var APP_ID       = '1600405687856906';
  var REDIRECT_URI = 'https://impactgridgroup.com/instagram-callback.html';
  var DIJO_URL     = 'https://impactgrid-dijo.onrender.com';

  /* ── Set to false once Meta approves the app ── */
  var COMING_SOON = true;

  var SCOPES = 'instagram_business_basic';

  function generateState() {
    var array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  /* ── Show Coming Soon modal ── */
  function showComingSoonModal() {
    var existing = document.getElementById('ig-coming-soon-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'ig-coming-soon-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(7,9,15,0.75);backdrop-filter:blur(8px);padding:24px;';

    modal.innerHTML =
      '<div style="background:var(--card,#151a28);border:1px solid rgba(255,255,255,0.10);border-radius:20px;padding:40px 36px;max-width:420px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.55);">' +
        '<div style="font-size:52px;margin-bottom:18px;">📸</div>' +
        '<div style="font-family:\'Syne\',sans-serif;font-size:22px;font-weight:900;letter-spacing:-0.02em;margin-bottom:10px;color:var(--text,#eef0f6);">Instagram — Coming Soon</div>' +
        '<div style="font-size:14px;color:var(--text2,#8a91a8);line-height:1.75;margin-bottom:24px;">Our Instagram integration is pending approval from Meta. Once approved, you\'ll be able to connect your Business or Creator account for real-time analytics, post performance, and audience insights.</div>' +
        '<div style="display:inline-flex;align-items:center;gap:6px;font-family:\'DM Mono\',monospace;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;padding:5px 14px;border-radius:6px;background:rgba(79,142,247,0.10);color:#7eb3ff;border:1px solid rgba(79,142,247,0.25);margin-bottom:28px;">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:#7eb3ff;display:inline-block;"></span>Pending Meta App Review</div>' +
        '<button onclick="document.getElementById(\'ig-coming-soon-modal\').remove()" style="width:100%;padding:12px;border-radius:12px;border:none;cursor:pointer;font-family:\'Syne\',sans-serif;font-size:14px;font-weight:700;background:linear-gradient(135deg,#f0b429,#ffd166);color:#07090f;" onmouseover="this.style.transform=\'translateY(-1px)\'" onmouseout="this.style.transform=\'\'">Got it</button>' +
      '</div>';

    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
  }

  /* ── Initiate OAuth flow (blocked while COMING_SOON) ── */
  function connect(buttonEl) {
    if (COMING_SOON) {
      showComingSoonModal();
      return;
    }

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

      window.location.href = 'https://api.instagram.com/oauth/authorize?' + params.toString();

    } catch(e) {
      console.error('[InstagramAuth] Failed to initiate OAuth:', e);
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.innerHTML = '⚠ Error — Try Again';
      }
      showError('Failed to initiate Instagram connection. Please try again.');
    }
  }

  async function exchangeCode(code) {
    var res = await fetch(DIJO_URL + '/instagram/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, redirect_uri: REDIRECT_URI })
    });
    if (!res.ok) throw new Error('Token exchange failed: HTTP ' + res.status);
    return await res.json();
  }

  async function fetchProfile(accessToken, userId) {
    var res = await fetch(DIJO_URL + '/instagram/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId })
    });
    if (!res.ok) throw new Error('Profile fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  async function fetchMedia(accessToken, userId) {
    var res = await fetch(DIJO_URL + '/instagram/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId })
    });
    if (!res.ok) throw new Error('Media fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  async function fetchInsights(accessToken, userId) {
    var res = await fetch(DIJO_URL + '/instagram/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId })
    });
    if (!res.ok) throw new Error('Insights fetch failed: HTTP ' + res.status);
    return await res.json();
  }

  async function publishContent(accessToken, userId, imageUrl, caption) {
    var res = await fetch(DIJO_URL + '/instagram/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken, user_id: userId, image_url: imageUrl, caption: caption || '' })
    });
    if (!res.ok) throw new Error('Publish failed: HTTP ' + res.status);
    return await res.json();
  }

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
    COMING_SOON:    COMING_SOON,
    REDIRECT_URI:   REDIRECT_URI,
    DIJO_URL:       DIJO_URL
  };

})();
