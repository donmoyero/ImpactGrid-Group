/* ════════════════════════════════════════════════════
   EVENTS MANAGEMENT
   - No face detection / face indexing
   - No QR print, no copy link
   - loadEvents: 👁 View Event · 📧 Resend Email · 📤 Upload · Activate/Deactivate · ✕ Delete
   - uploadPhotos: web-resized preview (1400px) + original kept separately
   - deletePhoto: cleans preview + original from storage only (no face_embeddings)
   - deleteEvent: cleans original/web/selfies/celebrant folders only
   - approveRequest: calls backend email route
════════════════════════════════════════════════════ */

var EVENTS_API      = 'https://impactgrid-events-api.onrender.com';
var evWatermark     = true;
var evRequireCode   = true;
var selectedEventId = null;

/* ── Set default expiry to 30 days from today ── */
function setDefaultExpiry(){
  var el = document.getElementById('ev-expiry');
  if(!el) return;
  var d = new Date();
  d.setDate(d.getDate() + 30);
  el.value = d.toISOString().split('T')[0];
}

/* ── Generate random 6-char access code ── */
function generateCode(){
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code  = '';
  for(var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  var el = document.getElementById('ev-code');
  if(el) el.value = code;
}

/* ── URL-safe slug ── */
function slugify(text){
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g,'')
    .replace(/\s+/g,'-')
    .replace(/-+/g,'-')
    .trim();
}

function toggleWatermark(){
  evWatermark = !evWatermark;
  var el = document.getElementById('ev-watermark-toggle');
  if(el) el.classList.toggle('on', evWatermark);
}

function toggleRequireCode(){
  evRequireCode = !evRequireCode;
  var el = document.getElementById('ev-code-toggle');
  if(el) el.classList.toggle('on', evRequireCode);
}

/* ════════════════════════════════════════════════════
   CREATE EVENT
════════════════════════════════════════════════════ */
async function igCreateEvent(){
  var name     = document.getElementById('ev-name').value.trim();
  var expiry   = document.getElementById('ev-expiry').value;
  var code     = document.getElementById('ev-code').value.trim().toUpperCase();
  var template = document.getElementById('ev-template').value;
  var alertEl  = document.getElementById('createEventAlert');

  function showAlert(msg, ok){
    alertEl.textContent = msg;
    alertEl.style.cssText = 'display:block;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;'
      + (ok
        ? 'background:var(--green-dim);border:1px solid rgba(15,168,118,.25);color:var(--green);'
        : 'background:var(--red-dim);border:1px solid var(--red-glo);color:var(--red);');
  }

  if(!name){ showAlert('Event name is required.', false); return; }
  if(!code){ generateCode(); code = document.getElementById('ev-code').value; }
  if(!expiry){ setDefaultExpiry(); expiry = document.getElementById('ev-expiry').value; }

  var slug = slugify(name) + '-' + Date.now();

  try{
    var c = getSupabase();
    var { data: sess } = await c.auth.getSession();

    var { data: ev, error: evErr } = await c.from('events').insert({
      name        : name,
      type        : template,
      template    : template,
      owner_id    : sess.session ? sess.session.user.id : null,
      owner_email : document.getElementById('ev-owner') ? document.getElementById('ev-owner').value.trim() || null : null,
      owner_name  : document.getElementById('ev-owner-name') ? document.getElementById('ev-owner-name').value.trim() || null : null,
      event_code  : code,
      event_slug  : slug,
      expiry_date : new Date(expiry).toISOString(),
      is_active   : true
    }).select().single();

    if(evErr) throw evErr;

    await c.from('event_settings').insert({
      event_id          : ev.id,
      require_code      : evRequireCode,
      template          : template,
      watermark_enabled : evWatermark
    });

    showAlert('✅ Event created! Code: ' + code, true);
    toast('✅', 'Event created!', name + ' · Code: ' + code);

    var ownerEmail = document.getElementById('ev-owner') ? document.getElementById('ev-owner').value.trim() : '';
    var ownerName  = document.getElementById('ev-owner-name') ? document.getElementById('ev-owner-name').value.trim() : '';

    /* Reset form */
    ['ev-name','ev-owner','ev-owner-name','ev-code'].forEach(function(id){
      var el = document.getElementById(id); if(el) el.value = '';
    });
    setDefaultExpiry();
    evWatermark = true; evRequireCode = true;
    var wt = document.getElementById('ev-watermark-toggle'); if(wt) wt.classList.add('on');
    var ct = document.getElementById('ev-code-toggle');      if(ct) ct.classList.add('on');

    if(ownerEmail) sendOwnerNotification(ownerEmail, ownerName, name, code, slug);

    setTimeout(function(){ nav('events', null); }, 1500);
    loadStats();

  }catch(err){
    showAlert('Error: ' + err.message, false);
  }
}

async function sendOwnerNotification(ownerEmail, ownerName, eventName, eventCode, eventSlug){
  if(!ownerEmail) return;
  var eventUrl = window.location.origin + '/owner.html?code=' + eventCode;
  try{
    var res  = await fetch(EVENTS_API + '/api/notify-owner', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ ownerEmail, ownerName, eventName, eventCode, eventUrl })
    });
    var data = await res.json();
    if(data.success) toast('📧', 'Owner notified!', 'Email sent to ' + ownerEmail);
  }catch(e){}
}

/* ════════════════════════════════════════════════════
   LOAD EVENTS LIST
   Actions: 👁 View Event · 📧 Resend Email · 📤 Upload · Activate/Deactivate · ✕ Delete
   (No QR print, no copy link)
════════════════════════════════════════════════════ */
async function loadEvents(){
  var el = document.getElementById('eventsList');
  if(!el) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div><div class="empty-txt">Loading…</div></div>';
  try{
    var { data } = await getSupabase()
      .from('events')
      .select('*, event_settings(*)')
      .order('created_at', { ascending: false });

    if(!data || !data.length){
      el.innerHTML = '<div class="empty"><div class="empty-ico">📅</div><div class="empty-txt">No events yet.</div></div>';
      return;
    }

    el.innerHTML = '<table><thead><tr><th>Event</th><th>Template</th><th>Code</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>'
      + data.map(function(ev){
          var expDate  = new Date(ev.expiry_date);
          var daysLeft = Math.ceil((expDate - new Date()) / (1000*60*60*24));
          var expStr   = expDate.toLocaleDateString('en-GB') + (daysLeft > 0 ? ' (' + daysLeft + 'd)' : ' ⚠️ Expired');
          var statusPill = ev.is_active
            ? '<span class="pill pill-active">Active</span>'
            : '<span class="pill pill-paused">Inactive</span>';
          return '<tr>'
            + '<td style="font-weight:700;">' + esc(ev.name)
            + '<br><span style="font-size:10px;color:var(--text3);font-family:var(--fm);">' + esc(ev.event_slug||'') + '</span></td>'
            + '<td><span class="pill pill-applied" style="font-size:9px;">' + esc(ev.template||ev.type||'—') + '</span></td>'
            + '<td style="font-family:var(--fm);letter-spacing:.1em;font-size:12px;color:var(--gold);">' + esc(ev.event_code||'—') + '</td>'
            + '<td style="font-size:12px;color:' + (daysLeft < 5 ? 'var(--red)' : 'var(--text2)') + ';">' + expStr + '</td>'
            + '<td>' + statusPill + '</td>'
            + '<td><div class="td-actions">'
            + '<a class="btn btn-ghost btn-sm" href="event.html?event=' + ev.event_slug + '&code=' + ev.event_code + '" target="_blank">👁 View Event</a>'
            + '<button class="btn btn-ghost btn-sm" onclick="goUploadForEvent(\'' + ev.id + '\')">📤 Upload</button>'
            + (ev.owner_email ? '<button class="btn btn-ghost btn-sm" onclick="resendOwnerEmail(\'' + esc(ev.owner_email) + '\',\'' + esc(ev.name) + '\')">📧 Resend Email</button>' : '')
            + '<button class="btn ' + (ev.is_active ? 'btn-red' : 'btn-green') + ' btn-sm" onclick="toggleEvent(\'' + ev.id + '\',' + ev.is_active + ')">'
            + (ev.is_active ? 'Deactivate' : 'Activate') + '</button>'
            + '<button class="btn btn-red btn-icon btn-sm" onclick="deleteEvent(\'' + ev.id + '\')">✕</button>'
            + '</div></td></tr>';
        }).join('')
      + '</tbody></table>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

async function resendOwnerEmail(ownerEmail, eventName){
  if(!confirm('Resend access email to ' + ownerEmail + '?')) return;
  toast('📧', 'Sending…', 'Resending', true);
  try{
    var res  = await fetch(EVENTS_API + '/api/resend-owner-email', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ ownerEmail })
    });
    var data = await res.json();
    if(data.success) toast('✅', 'Email sent!', '');
    else toast('⚠️', 'Failed', data.error || '');
  }catch(e){ toast('⚠️', 'Error', e.message); }
}

async function toggleEvent(id, cur){
  await getSupabase().from('events').update({ is_active: !cur }).eq('id', id);
  loadEvents(); loadStats();
  toast(cur ? '⏸' : '▶️', cur ? 'Event deactivated' : 'Event activated', '');
}

async function deleteEvent(id){
  if(!confirm('Delete this event and ALL its photos? This cannot be undone.')) return;
  var c = getSupabase();
  try{
    /* Clean up all storage subfolders */
    for(var folder of ['original', 'web', 'thumb', 'selfies', 'celebrant']){
      var { data: files } = await c.storage.from('events').list(id + '/' + folder);
      if(files && files.length)
        await c.storage.from('events').remove(files.map(function(f){ return id + '/' + folder + '/' + f.name; }));
    }
  }catch(e){}
  await c.from('events').delete().eq('id', id);
  toast('🗑️', 'Event deleted', '');
  loadEvents(); loadStats();
}

function goUploadForEvent(eventId){
  selectedEventId = eventId;
  nav('uploadphotos', null);
  setTimeout(function(){
    var sel = document.getElementById('upload-event-select');
    if(sel) sel.value = eventId;
    onUploadEventChange();
  }, 300);
}

/* ════════════════════════════════════════════════════
   UPLOAD PHOTOS
   - Generates a web-resized preview (max 1400px wide, 82% quality)
   - Keeps original at full resolution separately
   - Both URLs saved to photos table
   - No face indexing
════════════════════════════════════════════════════ */
async function loadUploadPhotos(){
  var sel = document.getElementById('upload-event-select');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Select an event —</option>';
  try{
    var { data } = await getSupabase()
      .from('events')
      .select('id,name,event_code')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    (data||[]).forEach(function(ev){
      var opt = document.createElement('option');
      opt.value       = ev.id;
      opt.textContent = ev.name + ' (' + ev.event_code + ')';
      sel.appendChild(opt);
    });
    if(selectedEventId){ sel.value = selectedEventId; onUploadEventChange(); }
  }catch(e){}
}

function onUploadEventChange(){
  var sel = document.getElementById('upload-event-select');
  var id  = sel ? sel.value : '';
  selectedEventId = id || null;
  document.getElementById('upload-dropcard').style.display         = id ? 'block' : 'none';
  document.getElementById('upload-photos-list-card').style.display = id ? 'block' : 'none';
  document.getElementById('upload-event-info').style.display       = id ? 'block' : 'none';
  if(id){
    var opt = sel.options[sel.selectedIndex];
    document.getElementById('upload-event-meta').textContent = '📅 ' + opt.textContent;
    loadEventPhotos();
  }
}

function handlePhotoInputChange(e){
  var files = Array.from(e.target.files||[]);
  if(files.length) uploadPhotos(files);
  e.target.value = '';
}

/* ── Resize a File/Blob to maxWidth px wide, returns a JPEG Blob ──
   quality: 0–1 (e.g. 0.70 for thumbnails, 0.82 for web previews)   ── */
function resizeImage(file, maxWidth, quality){
  return new Promise(function(resolve){
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function(){
      var w = img.width, h = img.height;
      if(w > maxWidth){ h = Math.round(h * maxWidth / w); w = maxWidth; }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(function(blob){ resolve(blob); }, 'image/jpeg', quality);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); resolve(file); }; /* fallback to original */
    img.src = url;
  });
}

/* Thumbnail: max 800px wide, 70% quality → ~80–150 KB, used in gallery grid */
function resizeImageToThumb(file){ return resizeImage(file, 800, 0.70); }

/* Web preview: max 1400px wide, 82% quality → used for full-screen lightbox view */
function resizeImageToWebVersion(file){ return resizeImage(file, 1400, 0.82); }

async function uploadPhotos(files){
  if(!selectedEventId){ toast('⚠️', 'No event selected', 'Pick an event first'); return; }
  var prog = document.getElementById('photoUploadProgress');
  prog.innerHTML = '';

  for(var i = 0; i < files.length; i++){
    var file    = files[i];
    var allowed = ['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type)){
      toast('⚠️', 'Skipped ' + file.name, 'Not a supported image type');
      continue;
    }

    var ts        = Date.now() + '-' + Math.random().toString(36).substring(2,8);
    var origPath  = selectedEventId + '/original/' + ts + '.jpg';
    var webPath   = selectedEventId + '/web/'      + ts + '.jpg';
    var thumbPath = selectedEventId + '/thumb/'    + ts + '.jpg';
    var rowId     = 'prog-' + i;

    prog.innerHTML += '<div id="' + rowId + '" style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;margin-bottom:6px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
      + '<span style="font-size:12px;font-weight:600;">' + esc(file.name) + '</span>'
      + '<span id="' + rowId + '-pct" style="font-size:11px;color:var(--text3);">Uploading…</span>'
      + '</div>'
      + '<div class="prog-track"><div class="prog-fill" id="' + rowId + '-bar" style="width:0%;"></div></div>'
      + '</div>';

    var setStatus = (function(id){
      return function(msg, pct, color){
        var el  = document.getElementById(id + '-pct');
        var bar = document.getElementById(id + '-bar');
        if(el)  el.textContent   = msg;
        if(bar){ bar.style.width = pct + '%'; if(color) bar.style.background = color; }
      };
    })(rowId);

    try{
      var c = getSupabase();

      /* 1 — Upload original at full resolution */
      setStatus('Uploading original…', 15, '');
      var { error: origErr } = await c.storage.from('events').upload(origPath, file, {
        contentType: 'image/jpeg', upsert: false
      });
      if(origErr) throw origErr;
      var { data: origUrlData } = c.storage.from('events').getPublicUrl(origPath);

      /* 2 — Generate + upload web-sized preview (max 1400px, 82% quality) for lightbox */
      setStatus('Creating web preview…', 40, '');
      var webBlob = await resizeImageToWebVersion(file);
      var webUrl  = origUrlData.publicUrl; /* fallback */
      var { error: webErr } = await c.storage.from('events').upload(webPath, webBlob, {
        contentType: 'image/jpeg', upsert: false
      });
      if(!webErr){
        var { data: webUrlData } = c.storage.from('events').getPublicUrl(webPath);
        webUrl = webUrlData.publicUrl;
      }

      /* 3 — Generate + upload thumbnail (max 800px, 70% quality) for gallery grid
             Target: ~80-150 KB vs 6-8 MB original = ~97% egress reduction per grid view */
      setStatus('Creating thumbnail…', 65, '');
      var thumbBlob = await resizeImageToThumb(file);
      var thumbUrl  = webUrl; /* fallback to web preview if thumb upload fails */
      var { error: thumbErr } = await c.storage.from('events').upload(thumbPath, thumbBlob, {
        contentType: 'image/jpeg', upsert: false
      });
      if(!thumbErr){
        var { data: thumbUrlData } = c.storage.from('events').getPublicUrl(thumbPath);
        thumbUrl = thumbUrlData.publicUrl;
      }

      /* 4 — Save to photos table */
      setStatus('Saving record…', 85, '');
      var { error: dbErr } = await c.from('photos').insert({
        event_id    : selectedEventId,
        preview_url : thumbUrl,              /* gallery grid — tiny, fast (~100 KB) */
        web_url     : webUrl,                /* lightbox / full-screen view (~400 KB) */
        original_url: origUrlData.publicUrl  /* download only — full resolution */
      }).select().single();
      if(dbErr) throw dbErr;

      setStatus('✅ Done', 100, 'var(--green)');

    }catch(err){
      setStatus('⚠️ ' + err.message, 100, 'var(--red)');
    }
  }

  toast('✅', 'Upload complete!', files.length + ' photo' + (files.length > 1 ? 's' : '') + ' added');
  loadEventPhotos();
}

/* ════════════════════════════════════════════════════
   UPLOAD CELEBRANT PHOTO
   Uploads to {event_id}/celebrant/ in storage.
   Called from the admin upload page celebrant card.
════════════════════════════════════════════════════ */
async function uploadCelebrantPhoto(file, eventId){
  if(!file || !eventId) return;
  var c    = getSupabase();
  var path = eventId + '/celebrant/hero.jpg';
  /* Remove old celebrant photo first (ignore error if not exists) */
  try{ await c.storage.from('events').remove([path]); }catch(e){}
  var { error } = await c.storage.from('events').upload(path, file, {
    contentType: 'image/jpeg', upsert: true
  });
  if(error) throw error;
  var { data } = c.storage.from('events').getPublicUrl(path);
  return data.publicUrl;
}

/* ════════════════════════════════════════════════════
   LOAD EVENT PHOTOS (thumbnail grid in admin)
════════════════════════════════════════════════════ */
async function loadEventPhotos(){
  var el = document.getElementById('eventPhotosList');
  if(!el || !selectedEventId) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div></div>';
  try{
    var { data } = await getSupabase()
      .from('photos')
      .select('*')
      .eq('event_id', selectedEventId)
      .order('created_at', { ascending: false });

    if(!data || !data.length){
      el.innerHTML = '<div class="empty"><div class="empty-ico">📸</div><div class="empty-txt">No photos yet.</div></div>';
      return;
    }

    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;">'
      + data.map(function(p){
          var viewUrl = p.web_url || p.preview_url;  /* lightbox / full-screen */
          var dlUrl   = p.original_url || viewUrl;   /* full-res download */
          return '<div style="position:relative;border-radius:var(--r);overflow:hidden;background:var(--bg2);border:1px solid var(--border);">'
            + '<img src="' + esc(p.preview_url) + '" style="width:100%;height:90px;object-fit:cover;" onerror="this.style.background=\'var(--bg3)\'"/>'
            /* View button — opens web-sized version, NOT the original */
            + '<a href="' + esc(viewUrl) + '" target="_blank" '
            + 'style="position:absolute;bottom:22px;left:0;right:0;text-align:center;background:rgba(0,0,0,.55);color:#fff;font-size:9px;padding:2px 0;text-decoration:none;">👁 View</a>'
            /* Download button — opens original only on explicit click */
            + '<a href="' + esc(dlUrl) + '" download target="_blank" '
            + 'style="position:absolute;bottom:0;left:0;right:0;text-align:center;background:rgba(0,0,0,.55);color:#fff;font-size:9px;padding:2px 0;text-decoration:none;">⬇ Download</a>'
            + '<button onclick="deletePhoto(\'' + p.id + '\',\'' + esc(p.preview_url) + '\',\'' + esc(p.web_url||'') + '\',\'' + esc(p.original_url||'') + '\')" '
            + 'style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--red);border:none;color:#fff;font-size:11px;cursor:pointer;">✕</button>'
            + '</div>';
        }).join('')
      + '</div>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

async function deletePhoto(id, previewUrl, webUrl, originalUrl){
  if(!confirm('Delete this photo?')) return;
  var c    = getSupabase();
  var base = 'https://wedjsnizcvtgptobwugc.supabase.co/storage/v1/object/public/events/';
  try{
    if(previewUrl  && previewUrl.includes(base))  await c.storage.from('events').remove([previewUrl.replace(base, '')]);
    if(webUrl      && webUrl.includes(base))      await c.storage.from('events').remove([webUrl.replace(base, '')]);
    if(originalUrl && originalUrl.includes(base)) await c.storage.from('events').remove([originalUrl.replace(base, '')]);
  }catch(e){}
  await c.from('photos').delete().eq('id', id);
  toast('🗑️', 'Photo deleted', '');
  loadEventPhotos();
}

/* ════════════════════════════════════════════════════
   DOWNLOAD REQUESTS
   approveRequest calls backend email route so the
   guest receives their download links automatically.
════════════════════════════════════════════════════ */
var allRequests = [];

async function loadDownloadRequests(){
  var el = document.getElementById('downloadRequestsList');
  if(!el) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div><div class="empty-txt">Loading…</div></div>';
  try{
    var { data } = await getSupabase()
      .from('download_requests')
      .select('*, events(name, event_slug, event_code)')
      .order('created_at', { ascending: false });

    allRequests = data || [];
    var pending = allRequests.filter(function(r){ return r.status === 'pending'; }).length;
    var badge   = document.getElementById('requestsBadge');
    if(badge){ badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-flex' : 'none'; }

    if(!allRequests.length){
      el.innerHTML = '<div class="empty"><div class="empty-ico">📥</div><div class="empty-txt">No download requests yet.</div></div>';
      return;
    }

    renderRequestsTable(allRequests);

    /* Auto-switch to pending filter if there are pending ones */
    if(pending > 0) filterRequests('pending', document.getElementById('req-filter-pending'));

  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

function filterRequests(status, btn){
  document.querySelectorAll('[id^="req-filter-"]').forEach(function(b){
    b.classList.remove('active'); b.style.cssText = '';
  });
  if(btn){ btn.classList.add('active'); btn.style.background = 'var(--gold)'; btn.style.color = '#fff'; }
  renderRequestsTable(status === 'all' ? allRequests : allRequests.filter(function(r){ return r.status === status; }));
}

function renderRequestsTable(data){
  var el = document.getElementById('downloadRequestsList');
  if(!data || !data.length){
    el.innerHTML = '<div class="empty"><div class="empty-ico">📭</div><div class="empty-txt">No requests found.</div></div>';
    return;
  }
  el.innerHTML = '<table><thead><tr><th>Guest Email</th><th>Event</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>'
    + data.map(function(r){
        var pc = { pending:'pill-pending', approved:'pill-active', rejected:'pill-rejected' }[r.status] || 'pill-pending';
        return '<tr>'
          + '<td style="font-weight:600;">' + esc(r.user_email) + '</td>'
          + '<td>' + esc((r.events && r.events.name) || '—') + '</td>'
          + '<td><span class="pill ' + pc + '">' + (r.status||'pending') + '</span></td>'
          + '<td style="color:var(--text3);">' + new Date(r.created_at).toLocaleDateString('en-GB') + '</td>'
          + '<td><div class="td-actions">'
          + (r.status !== 'approved' ? '<button class="btn btn-green btn-sm" onclick="approveRequest(\'' + r.id + '\',\'' + esc(r.user_email) + '\',\'' + r.event_id + '\')">✓ Approve</button>' : '')
          + (r.status !== 'rejected' ? '<button class="btn btn-red btn-sm"   onclick="rejectRequest(\'' + r.id + '\')">✕ Reject</button>' : '')
          + '</div></td></tr>';
      }).join('')
    + '</tbody></table>';
}

async function approveRequest(id, email, eventId){
  if(!confirm('Approve download for ' + email + '? This will email them their photos.')) return;
  toast('📤', 'Approving…', '', true);
  try{
    /* Call backend — it marks approved AND emails the guest their download links */
    var res  = await fetch(EVENTS_API + '/api/approve-request', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ requestId: id })
    });
    var data = await res.json();
    if(!res.ok) throw new Error(data.error || 'Server error');
    toast('✅', 'Approved & email sent!', email + ' will receive their photos');
  }catch(e){
    /* Fallback: at least mark approved in DB even if email fails */
    await getSupabase().from('download_requests').update({ status: 'approved' }).eq('id', id);
    toast('✅', 'Approved (email may have failed)', e.message);
  }
  loadDownloadRequests();
}

async function rejectRequest(id){
  if(!confirm('Reject this download request?')) return;
  await getSupabase().from('download_requests').update({ status: 'rejected' }).eq('id', id);
  toast('🗑️', 'Request rejected', '');
  loadDownloadRequests();
}
