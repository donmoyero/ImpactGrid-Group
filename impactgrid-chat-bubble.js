/* ================================================================
   ImpactGrid Group Chat Bubble  v3.0
   ─────────────────────────────────────────────────────────────────
   Smart, page-aware bubble. Dijo knows where the visitor is and
   responds accordingly — content creation, events, pricing, careers,
   general enquiries. No config needed on each page.
================================================================ */

(function () {
  var AI_URL  = (typeof IMPACTGRID_AI_URL  !== 'undefined' ? IMPACTGRID_AI_URL  : 'https://impactgrid-dijo.onrender.com');
  var HISTORY = [];
  var TYPING  = false;

  /* ── Detect current page ── */
  var _path = window.location.pathname.toLowerCase();
  function _on(slug) { return _path.indexOf(slug) !== -1; }

  var PAGE_CTX =
    _on('creator')    ? 'creator'    :
    _on('carousel')   ? 'carousel'   :
    _on('pricing')    ? 'pricing'    :
    _on('events')     ? 'events'     :
    _on('jobs')       ? 'jobs'       :
    _on('network')    ? 'network'    :
    _on('dashboard')  ? 'dashboard'  :
    _on('consulting') ? 'consulting' :
    _on('about')      ? 'about'      :
    _on('contact')    ? 'contact'    :
    'home';

  /* ── Welcome messages per page ── */
  var WELCOMES = {
    home:       'Hey! 👋 I\'m Dijo — ImpactGrid\'s AI. Ask me anything about what we do, how to get started, or which plan suits you.',
    creator:    'Hey! 👋 I\'m Dijo. I can help you build carousels, find trending topics, write hooks, or plan your content strategy. What are you working on?',
    carousel:   'Hey! 👋 Tell me your topic and I\'ll help you build a carousel that actually stops the scroll.',
    pricing:    'Hey! 👋 Not sure which plan is right for you? Tell me about your business and I\'ll point you to the best fit.',
    events:     'Hey! 👋 Ask me about ImpactGrid Events — how it works, what\'s included, or how to book.',
    jobs:       'Hey! 👋 Questions about a role, the team, or life at ImpactGrid? Happy to help.',
    network:    'Hey! 👋 Ask me how the ImpactGrid Network works, who it\'s for, or how to join.',
    dashboard:  'Hey! 👋 I\'m Dijo, your financial co-pilot. Need help reading your numbers or understanding a metric?',
    consulting: 'Hey! 👋 Want to know more about ImpactGrid\'s consulting services or how to book a session?',
    about:      'Hey! 👋 Want to know more about ImpactGrid, our story, or what we stand for?',
    contact:    'Hey! 👋 Need to reach the team? I might be able to help right now.'
  };

  /* ── Suggestion chips per page ── */
  var CHIPS = {
    home: [
      ['What is ImpactGrid?',   'What does ImpactGrid actually do?'],
      ['See pricing',           'What are the pricing plans?'],
      ['How do I start?',       'How do I get started with ImpactGrid?'],
      ['Talk to the team',      'I want to speak to someone on the team']
    ],
    creator: [
      ['Build a carousel',      'Help me build a carousel'],
      ['Trending topics',       'What topics are trending right now in my niche?'],
      ['Write a hook',          'Write me a scroll-stopping hook for my content'],
      ['Best time to post',     'When is the best time to post on Instagram?']
    ],
    carousel: [
      ['Suggest a topic',       'Suggest a carousel topic that would perform well right now'],
      ['Write my hook',         'Write a hook slide for my carousel'],
      ['Review my idea',        'I have a carousel idea — tell me if it will work'],
      ['Caption + hashtags',    'Write a caption and hashtags for my carousel']
    ],
    pricing: [
      ['Which plan suits me?',  'Help me choose the right plan for my business'],
      ['What\'s in Pro?',       'What do I get with the Pro plan?'],
      ['Free vs paid',          'What\'s the difference between free and paid?'],
      ['Book a demo',           'How do I book a demo?']
    ],
    events: [
      ['How does it work?',     'How does ImpactGrid Events work?'],
      ['Book an event',         'How do I book an event?'],
      ['What\'s included?',     'What\'s included in an events package?'],
      ['Event pricing',         'What does an event cost?']
    ],
    jobs: [
      ['Open roles',            'What roles are currently open at ImpactGrid?'],
      ['Company culture',       'What\'s it like working at ImpactGrid?'],
      ['How to apply',          'How do I apply for a role?'],
      ['Remote work',           'Does ImpactGrid offer remote positions?']
    ],
    network: [
      ['What is the Network?',  'What is the ImpactGrid Network?'],
      ['Who is it for?',        'Who is the ImpactGrid Network for?'],
      ['How to join',           'How do I join the ImpactGrid Network?'],
      ['Network benefits',      'What are the benefits of joining the Network?']
    ],
    dashboard: [
      ['Add my data',           'How do I add my monthly revenue and expenses?'],
      ['Risk score',            'What does my risk score mean?'],
      ['Improve margins',       'How can I improve my profit margins?'],
      ['Upgrade plan',          'What do I get if I upgrade my plan?']
    ],
    consulting: [
      ['What\'s included?',     'What does the consulting service include?'],
      ['Book a session',        'How do I book a consulting session?'],
      ['Consulting pricing',    'How much does consulting cost?'],
      ['Is it right for me?',   'Is consulting right for my business?']
    ],
    about: [
      ['Our story',             'Tell me about ImpactGrid\'s story'],
      ['The team',              'Who is behind ImpactGrid?'],
      ['Our mission',           'What is ImpactGrid\'s mission?'],
      ['Get in touch',          'How do I contact the ImpactGrid team?']
    ],
    contact: [
      ['Response time',         'How quickly will I hear back?'],
      ['Support',               'I need help with my account'],
      ['Partnership',           'I\'d like to discuss a partnership with ImpactGrid'],
      ['General enquiry',       'I have a general question about ImpactGrid']
    ]
  };

  var PAGE_LABELS = {
    home: 'Home', creator: 'Creator Studio', carousel: 'Carousel Studio',
    pricing: 'Pricing', events: 'Events', jobs: 'Jobs', network: 'Network',
    dashboard: 'Dashboard', consulting: 'Consulting', about: 'About', contact: 'Contact'
  };

  /* ── Inject fonts ── */
  var font = document.createElement('link');
  font.rel  = 'stylesheet';
  font.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:wght@700&display=swap';
  document.head.appendChild(font);

  /* ── Inject CSS ── */
  var style = document.createElement('style');
  style.textContent = `
    #ig-bubble-btn {
      position:fixed;bottom:28px;right:28px;z-index:99999;
      width:60px;height:60px;border-radius:50%;
      background:linear-gradient(135deg,#1a3a6a,#2563eb);
      border:none;cursor:pointer;
      box-shadow:0 8px 32px rgba(37,99,235,0.4),0 2px 8px rgba(0,0,0,0.15);
      display:flex;align-items:center;justify-content:center;
      transition:transform 0.2s,box-shadow 0.2s;
      animation:ig-bubble-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes ig-bubble-in{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
    #ig-bubble-btn:hover{transform:scale(1.08);box-shadow:0 12px 40px rgba(37,99,235,0.5);}
    #ig-bubble-btn svg{transition:transform 0.3s;}
    #ig-bubble-btn.open svg.chat-icon{display:none;}
    #ig-bubble-btn.open svg.close-icon{display:block!important;}
    #ig-unread{
      position:absolute;top:-2px;right:-2px;
      width:18px;height:18px;border-radius:50%;
      background:#ef4444;border:2px solid #fff;
      font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;color:#fff;
      display:flex;align-items:center;justify-content:center;
      animation:ig-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes ig-badge-pop{from{transform:scale(0)}to{transform:scale(1)}}
    #ig-chat-panel{
      position:fixed;bottom:100px;right:28px;z-index:99998;width:360px;
      background:#fff;border-radius:20px;
      box-shadow:0 24px 80px rgba(0,0,0,0.18),0 4px 16px rgba(0,0,0,0.08);
      display:flex;flex-direction:column;overflow:hidden;
      transform-origin:bottom right;
      animation:ig-panel-in 0.35s cubic-bezier(0.34,1.56,0.64,1);
      max-height:560px;font-family:'DM Sans',sans-serif;
    }
    @keyframes ig-panel-in{from{transform:scale(0.7) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
    #ig-chat-panel.closing{animation:ig-panel-out 0.2s ease-in forwards;}
    @keyframes ig-panel-out{to{transform:scale(0.7) translateY(20px);opacity:0}}
    .ig-panel-header{
      background:linear-gradient(135deg,#1a3a6a 0%,#2563eb 100%);
      padding:18px 20px 16px;display:flex;align-items:center;gap:12px;flex-shrink:0;
    }
    .ig-header-avatar{
      width:40px;height:40px;border-radius:50%;
      background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      flex-shrink:0;position:relative;
    }
    .ig-header-avatar::after{
      content:'';position:absolute;bottom:1px;right:1px;
      width:10px;height:10px;border-radius:50%;
      background:#4ade80;border:2px solid #1a3a6a;
    }
    .ig-header-text{flex:1;min-width:0;}
    .ig-header-name{font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:700;color:#fff;line-height:1.2;}
    .ig-header-sub{font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;}
    .ig-page-tag{
      font-size:9px;letter-spacing:.1em;text-transform:uppercase;
      background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7);
      border:1px solid rgba(255,255,255,0.18);
      padding:2px 7px;border-radius:20px;margin-top:3px;display:inline-block;
    }
    .ig-header-close{
      background:rgba(255,255,255,0.12);border:none;border-radius:8px;
      width:30px;height:30px;color:rgba(255,255,255,0.8);
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:background 0.2s;flex-shrink:0;
    }
    .ig-header-close:hover{background:rgba(255,255,255,0.22);}
    .ig-messages{
      flex:1;overflow-y:auto;padding:20px 16px 12px;
      display:flex;flex-direction:column;gap:12px;
      min-height:240px;max-height:320px;
      scroll-behavior:smooth;background:#f8faff;
    }
    .ig-messages::-webkit-scrollbar{width:3px;}
    .ig-messages::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:2px;}
    .ig-msg{display:flex;gap:8px;align-items:flex-end;animation:ig-msg-in 0.25s ease;max-width:100%;}
    @keyframes ig-msg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .ig-msg.user{flex-direction:row-reverse;}
    .ig-msg-av{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;}
    .ig-msg.ai   .ig-msg-av{background:linear-gradient(135deg,#1a3a6a,#2563eb);color:#fff;}
    .ig-msg.user .ig-msg-av{background:#e2e8f0;color:#64748b;}
    .ig-msg-text{padding:10px 14px;border-radius:14px;font-size:13.5px;line-height:1.65;max-width:78%;word-break:break-word;}
    .ig-msg.ai   .ig-msg-text{background:#fff;border:1px solid #e8edf5;color:#1e293b;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.04);}
    .ig-msg.user .ig-msg-text{background:linear-gradient(135deg,#1a3a6a,#2563eb);color:#fff;border-bottom-right-radius:4px;}
    .ig-msg-text strong{font-weight:600;}
    .ig-msg-text a{color:#2563eb;text-decoration:underline;}
    .ig-typing{display:flex;gap:8px;align-items:flex-end;padding:0 16px 8px;}
    .ig-typing-av{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1a3a6a,#2563eb);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0;}
    .ig-typing-dots{display:flex;gap:4px;align-items:center;padding:10px 14px;background:#fff;border:1px solid #e8edf5;border-radius:14px;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.04);}
    .ig-typing-dots span{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:ig-dot 1.4s ease-in-out infinite;}
    .ig-typing-dots span:nth-child(2){animation-delay:0.2s;}
    .ig-typing-dots span:nth-child(3){animation-delay:0.4s;}
    @keyframes ig-dot{0%,80%,100%{transform:translateY(0);opacity:0.4}40%{transform:translateY(-5px);opacity:1}}
    .ig-suggestions{display:flex;gap:6px;flex-wrap:wrap;padding:6px 16px 10px;background:#f8faff;border-top:1px solid #f1f5f9;}
    .ig-chip{padding:5px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:11.5px;color:#475569;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
    .ig-chip:hover{background:#eff6ff;border-color:#bfdbfe;color:#1d4ed8;}
    .ig-input-row{display:flex;align-items:center;gap:8px;padding:12px 16px 16px;background:#fff;border-top:1px solid #f1f5f9;flex-shrink:0;}
    .ig-input{flex:1;padding:10px 14px;background:#f8faff;border:1.5px solid #e2e8f0;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:13px;color:#1e293b;outline:none;transition:border-color 0.2s;}
    .ig-input:focus{border-color:#93c5fd;}
    .ig-input::placeholder{color:#94a3b8;}
    .ig-send{width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,#1a3a6a,#2563eb);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity 0.2s,transform 0.1s;box-shadow:0 2px 8px rgba(37,99,235,0.3);}
    .ig-send:hover{opacity:0.85;transform:scale(1.05);}
    .ig-send:disabled{opacity:0.4;cursor:not-allowed;transform:none;}
    .ig-powered{text-align:center;font-size:10px;color:#94a3b8;padding:6px 0 10px;background:#fff;font-family:'DM Sans',sans-serif;}
    .ig-powered a{color:#2563eb;text-decoration:none;font-weight:600;}
    #ig-hide-btn{display:none;}
    @media(max-width:900px){
      #ig-bubble-btn{right:16px;bottom:74px;}
      #ig-chat-panel{width:calc(100vw - 24px);right:12px;bottom:136px;max-height:60vh;}
      #ig-hide-btn{display:flex;align-items:center;justify-content:center;position:absolute;top:10px;left:10px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-size:14px;cursor:pointer;transition:background 0.2s;}
      #ig-hide-btn:hover{background:rgba(255,77,109,0.2);color:#ff4d6d;}
    }
  `;
  document.head.appendChild(style);

  /* ── Build HTML ── */
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<button id="ig-bubble-btn" onclick="igToggleChat()" aria-label="Chat with Dijo">' +
      '<svg class="chat-icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg class="close-icon" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '<div id="ig-unread">1</div>' +
    '</button>' +
    '<div id="ig-chat-panel" style="display:none;">' +
      '<button id="ig-hide-btn" onclick="igHideChat()">&#x2715;</button>' +
      '<div class="ig-panel-header">' +
        '<div class="ig-header-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>' +
        '<div class="ig-header-text">' +
          '<div class="ig-header-name">Dijo by ImpactGrid</div>' +
          '<div class="ig-header-sub">AI assistant &middot; Online now</div>' +
          '<div class="ig-page-tag">' + (PAGE_LABELS[PAGE_CTX] || 'ImpactGrid') + '</div>' +
        '</div>' +
        '<button class="ig-header-close" onclick="igToggleChat()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>' +
      '<div class="ig-messages" id="ig-messages"></div>' +
      '<div class="ig-typing" id="ig-typing" style="display:none;"><div class="ig-typing-av">AI</div><div class="ig-typing-dots"><span></span><span></span><span></span></div></div>' +
      '<div class="ig-suggestions" id="ig-suggestions"></div>' +
      '<div class="ig-input-row">' +
        '<input id="ig-input" class="ig-input" placeholder="Ask me anything&hellip;" onkeydown="if(event.key===\'Enter\'){event.preventDefault();igSend();}">' +
        '<button class="ig-send" id="ig-send-btn" onclick="igSend()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
      '</div>' +
      '<div class="ig-powered">Powered by <a href="https://impactgridgroup.com" target="_blank">ImpactGrid</a></div>' +
    '</div>';
  document.body.appendChild(wrap);

  /* ── Welcome ── */
  setTimeout(function () {
    igAppendMsg('ai', WELCOMES[PAGE_CTX] || WELCOMES.home);
  }, 600);

  /* ── Chips ── */
  (function () {
    var chips = CHIPS[PAGE_CTX] || CHIPS.home;
    var el = document.getElementById('ig-suggestions');
    if (!el) return;
    el.innerHTML = chips.map(function (c) {
      return '<button class="ig-chip" onclick="igAsk(' + JSON.stringify(c[1]) + ')">' + c[0] + '</button>';
    }).join('');
  })();

  /* ── Toggle ── */
  window.igToggleChat = function () {
    var panel  = document.getElementById('ig-chat-panel');
    var btn    = document.getElementById('ig-bubble-btn');
    var unread = document.getElementById('ig-unread');
    var isOpen = panel.style.display !== 'none';
    if (isOpen) {
      panel.classList.add('closing');
      setTimeout(function () { panel.style.display = 'none'; panel.classList.remove('closing'); }, 200);
      btn.classList.remove('open');
    } else {
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      btn.classList.add('open');
      if (unread) unread.remove();
      document.getElementById('ig-input').focus();
      igScrollBottom();
    }
  };

  /* ── Auto-open once per session ── */
  setTimeout(function () {
    try { if (sessionStorage.getItem('ig_chat_opened')) return; } catch (e) {}
    var panel = document.getElementById('ig-chat-panel');
    var btn   = document.getElementById('ig-bubble-btn');
    if (panel && panel.style.display === 'none') {
      panel.style.display = 'flex';
      panel.style.flexDirection = 'column';
      if (btn) btn.classList.add('open');
      var unread = document.getElementById('ig-unread');
      if (unread) unread.remove();
      igScrollBottom();
      try { sessionStorage.setItem('ig_chat_opened', '1'); } catch (e) {}
    }
  }, 2500);

  /* ── Hide on mobile ── */
  window.igHideChat = function () {
    var panel = document.getElementById('ig-chat-panel');
    var btn   = document.getElementById('ig-bubble-btn');
    if (panel) { panel.style.display = 'none'; panel.classList.remove('open'); }
    if (btn)   { btn.classList.remove('open'); btn.style.display = 'none'; }
    setTimeout(function () { if (btn) btn.style.display = 'flex'; }, 60000);
  };

  window.igSend = function () {
    var input = document.getElementById('ig-input');
    var msg   = (input ? input.value : '').trim();
    if (!msg || TYPING) return;
    input.value = '';
    igAsk(msg);
  };

  window.igAsk = async function (message) {
    if (!message || TYPING) return;
    var chips = document.getElementById('ig-suggestions');
    if (chips) chips.style.display = 'none';
    igAppendMsg('user', igEsc(message));
    HISTORY.push({ role: 'user', content: message });
    TYPING = true;
    var typingEl = document.getElementById('ig-typing');
    var sendBtn  = document.getElementById('ig-send-btn');
    if (typingEl) typingEl.style.display = 'flex';
    if (sendBtn)  sendBtn.disabled = true;
    igScrollBottom();

    /* Include page context so the server prompt knows where the visitor is */
    var prompt = '[Page: ' + PAGE_CTX + ']\n';
    if (HISTORY.length > 1) {
      prompt += 'Conversation so far:\n';
      HISTORY.slice(-8, -1).forEach(function (m) {
        prompt += (m.role === 'user' ? 'Visitor: ' : 'Dijo: ') + m.content + '\n';
      });
      prompt += '\n';
    }
    prompt += 'Visitor: ' + message;

    try {
      var res = await fetch(AI_URL + '/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body:    JSON.stringify({ message: prompt, mode: 'site' })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data  = await res.json();
      var reply = data.reply || 'Sorry, something went wrong. Try again in a moment.';
      HISTORY.push({ role: 'assistant', content: reply });
      igAppendMsg('ai', igFormat(reply));
    } catch (e) {
      console.error('[ImpactGrid Chat]', e);
      igAppendMsg('ai', 'Having trouble connecting right now. Reach us at <a href="https://impactgridgroup.com/contact.html">impactgridgroup.com/contact</a>.');
    } finally {
      TYPING = false;
      if (typingEl) typingEl.style.display = 'none';
      if (sendBtn)  sendBtn.disabled = false;
      igScrollBottom();
    }
  };

  function igAppendMsg(role, html) {
    var msgs = document.getElementById('ig-messages');
    if (!msgs) return;
    var div = document.createElement('div');
    div.className = 'ig-msg ' + role;
    div.innerHTML = '<div class="ig-msg-av">' + (role === 'ai' ? 'AI' : 'You') + '</div><div class="ig-msg-text">' + html + '</div>';
    msgs.appendChild(div);
    igScrollBottom();
  }

  function igScrollBottom() {
    var msgs = document.getElementById('ig-messages');
    if (msgs) setTimeout(function () { msgs.scrollTop = msgs.scrollHeight; }, 50);
  }

  function igEsc(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function igFormat(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[-*] (.+)$/gm, '<li style="margin-bottom:3px;">$1</li>')
      .replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, '<ul style="padding-left:16px;margin:6px 0;">$&</ul>')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

})();
