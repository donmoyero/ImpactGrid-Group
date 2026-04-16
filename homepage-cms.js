/* ═══════════════════════════════════════════════
   ImpactGrid — Homepage CMS Loader
   Pulls dynamic content from Supabase and injects
   it into elements tagged with data-content="key".
   Tables used: site_content, updates, testimonials, ticker
═══════════════════════════════════════════════ */

async function loadCMS() {
  await Promise.all([
    loadContent(),
    loadUpdates(),
    loadTestimonials(),
    loadTicker()
  ]);
}

/* ── Waits for Supabase client to be ready ── */
function getClient() {
  return new Promise((resolve, reject) => {
    if (window.getSupabase) { try { return resolve(window.getSupabase()); } catch(e) {} }
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (window.getSupabase) {
        try {
          clearInterval(t);
          return resolve(window.getSupabase());
        } catch(e) {}
      }
      if (tries >= 30) { clearInterval(t); reject(new Error('Supabase unavailable')); }
    }, 100);
  });
}

/* ── STEP 2: Text content from site_content table ──
   Tag any element:  data-content="hero_headline"
   Row in DB:        key="hero_headline", value="Your headline here"
*/
async function loadContent() {
  try {
    const c = await getClient();
    const { data, error } = await c.from('site_content').select('key, value');
    if (error || !data) return;

    const map = {};
    data.forEach(item => { map[item.key] = item.value; });

    document.querySelectorAll('[data-content]').forEach(el => {
      const key = el.dataset.content;
      if (map[key] !== undefined) el.textContent = map[key];
    });
  } catch (err) {
    console.warn('[CMS] loadContent failed:', err.message);
  }
}

/* ── STEP 3: Updates section ──
   Renders into:  <div id="updates-container"></div>
   DB table:      updates (title, body, created_at)
*/
async function loadUpdates() {
  const container = document.getElementById('updates-container');
  if (!container) return;

  try {
    const c = await getClient();
    const { data, error } = await c
      .from('updates')
      .select('title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error || !data || !data.length) return;

    container.innerHTML = data.map(item => `
      <div class="update-card card card-sm">
        <div class="update-title" style="font-size:14px;font-weight:700;margin-bottom:6px;">${escCMS(item.title)}</div>
        <div class="update-body text-sm">${escCMS(item.body)}</div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('[CMS] loadUpdates failed:', err.message);
  }
}

/* ── STEP 4: Testimonials ──
   Renders into:  <div id="testimonials-container"></div>
   DB table:      testimonials (name, role, text)
*/
async function loadTestimonials() {
  const container = document.getElementById('testimonials-container');
  if (!container) return;

  try {
    const c = await getClient();
    const { data, error } = await c
      .from('testimonials')
      .select('name, role, text')
      .limit(6);

    if (error || !data || !data.length) return;

    container.innerHTML = data.map(t => `
      <div class="testimonial card card-sm">
        <p class="test-text text-sm" style="margin-bottom:14px;">"${escCMS(t.text)}"</p>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--gold),var(--gold2));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#fff;font-family:var(--fd);">${escCMS(t.name.charAt(0))}</div>
          <div>
            <div class="test-name" style="font-size:13px;font-weight:700;">${escCMS(t.name)}</div>
            <div class="test-role" style="font-size:11px;color:var(--text3);font-family:var(--fm);">${escCMS(t.role)}</div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('[CMS] loadTestimonials failed:', err.message);
  }
}

/* ── STEP 5: Ticker / announcement bar ──
   Renders into:  <div id="ticker-text"></div>
   DB table:      ticker (text, sort_order)
*/
async function loadTicker() {
  const ticker = document.getElementById('ticker-text');
  if (!ticker) return;

  try {
    const c = await getClient();
    const { data, error } = await c
      .from('ticker')
      .select('text')
      .order('sort_order', { ascending: true });

    if (error || !data || !data.length) return;

    ticker.textContent = data.map(t => t.text).join('  •  ');
    ticker.closest('#ticker-bar')?.removeAttribute('hidden');
  } catch (err) {
    console.warn('[CMS] loadTicker failed:', err.message);
  }
}

/* ── XSS-safe escape for CMS-injected strings ── */
function escCMS(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
