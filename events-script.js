/* ════════════════════════════════════════════════════
   EVENTS MANAGEMENT — FIXED
   Changes vs original:
   - uploadPhotos: generates web-resized preview + keeps original separately
   - resizeImageToWebVersion: client-side canvas resize helper
   - indexPhotoFaces: called after each upload, with rate-limit retry
   - loadFacesPanel / loadFacesForEvent: full face group viewer
   - reindexEventFaces: wipe + rebuild index for an event
   - approveRequest: now calls backend email route
   - deletePhoto: cleans up both preview + original from storage
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
            + '<a class="btn btn-ghost btn-sm" href="event.html?event=' + ev.event_slug + '&code=' + ev.event_code + '" target="_blank">👁 View</a>'
            + '<button class="btn btn-ghost btn-sm" onclick="copyEventLink(\'' + ev.event_slug + '\',\'' + ev.event_code + '\')">🔗 Link</button>'
            + '<button class="btn btn-ghost btn-sm" onclick="printQR(\'' + ev.event_slug + '\',\'' + ev.event_code + '\',\'' + esc(ev.name) + '\')">🖨 QR</button>'
            + '<button class="btn btn-ghost btn-sm" onclick="goUploadForEvent(\'' + ev.id + '\')">📤 Upload</button>'
            + (ev.owner_email ? '<button class="btn btn-ghost btn-sm" onclick="resendOwnerEmail(\'' + esc(ev.owner_email) + '\',\'' + esc(ev.name) + '\')">📧</button>' : '')
            + '<button class="btn ' + (ev.is_active?'btn-red':'btn-green') + ' btn-sm" onclick="toggleEvent(\'' + ev.id + '\',' + ev.is_active + ')">'
            + (ev.is_active ? 'Deactivate' : 'Activate') + '</button>'
            + '<button class="btn btn-red btn-icon btn-sm" onclick="deleteEvent(\'' + ev.id + '\')">✕</button>'
            + '</div></td></tr>';
        }).join('')
      + '</tbody></table>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

function printQR(slug, code, name){
  window.open('qr-print.html?event=' + slug + '&code=' + code + '&name=' + encodeURIComponent(name) + '&base=' + encodeURIComponent(window.location.origin), '_blank', 'width=740,height=620');
}

function copyEventLink(slug, code){
  var url = window.location.origin + '/event.html?event=' + slug + '&code=' + code;
  navigator.clipboard.writeText(url)
    .then(function(){ toast('🔗', 'Link copied!', ''); })
    .catch(function(){ prompt('Copy this link:', url); });
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
    /* Delete original, preview, web and face crop subfolders */
    for(var folder of ['original','web','faces','selfies']){
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
   FIX: generates a separate web-resized preview (1400px max)
   and keeps the original at full resolution.
   Both URLs saved to photos table.
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

/* ── Resize a File/Blob to maxWidth px wide, returns a JPEG Blob ── */
function resizeImageToWebVersion(file, maxWidth){
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
      canvas.toBlob(function(blob){ resolve(blob); }, 'image/jpeg', 0.82);
    };
    img.onerror = function(){ URL.revokeObjectURL(url); resolve(file); }; /* fallback to original */
    img.src = url;
  });
}

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

    var ts       = Date.now() + '-' + Math.random().toString(36).substring(2,8);
    var origPath = selectedEventId + '/original/' + ts + '.jpg';
    var webPath  = selectedEventId + '/web/'      + ts + '.jpg';
    var rowId    = 'prog-' + i;

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
        if(el)  el.textContent      = msg;
        if(bar){ bar.style.width    = pct + '%'; if(color) bar.style.background = color; }
      };
    })(rowId);

    try{
      var c = getSupabase();

      /* 1 — Upload original at full resolution */
      setStatus('Uploading original…', 20, '');
      var { error: origErr } = await c.storage.from('events').upload(origPath, file, {
        contentType: 'image/jpeg', upsert: false
      });
      if(origErr) throw origErr;

      /* 2 — Generate + upload web-sized preview (max 1400px wide, 82% quality) */
      setStatus('Creating web preview…', 45, '');
      var webBlob = await resizeImageToWebVersion(file, 1400);
      var { error: webErr } = await c.storage.from('events').upload(webPath, webBlob, {
        contentType: 'image/jpeg', upsert: false
      });

      /* If web upload fails, fall back to using original URL for both */
      var { data: origUrlData } = c.storage.from('events').getPublicUrl(origPath);
      var webUrl = origUrlData.publicUrl;
      if(!webErr){
        var { data: webUrlData } = c.storage.from('events').getPublicUrl(webPath);
        webUrl = webUrlData.publicUrl;
      }

      /* 3 — Save to photos table — preview_url = web, original_url = full res */
      setStatus('Saving record…', 65, '');
      var { data: photoRow, error: dbErr } = await c.from('photos').insert({
        event_id    : selectedEventId,
        preview_url : webUrl,                  /* shown in gallery grid — fast to load */
        original_url: origUrlData.publicUrl    /* sent to guest on download approval */
      }).select().single();
      if(dbErr) throw dbErr;

      /* 4 — Kick off face indexing in background (non-blocking) */
      setStatus('Indexing face…', 80, '');
      indexPhotoFaces(photoRow.id, origUrlData.publicUrl, selectedEventId)
        .then(function(){ setStatus('✅ Done', 100, 'var(--green)'); })
        .catch(function(){ setStatus('✅ Done (no face)', 100, 'var(--green)'); });

    }catch(err){
      setStatus('⚠️ ' + err.message, 100, 'var(--red)');
    }
  }

  toast('✅', 'Upload complete!', files.length + ' photo' + (files.length > 1 ? 's' : '') + ' added');
  loadEventPhotos();
}

/* ════════════════════════════════════════════════════
   FACE INDEXING
   Calls backend /api/facepp-embed which:
   - Detects face in the photo
   - Crops and uploads the face thumbnail
   - Searches existing FaceSet for a match (dedup)
   - Returns: { faceFound, face_token, face_crop_url, group_id }
   Frontend saves result to face_embeddings table.
════════════════════════════════════════════════════ */
async function indexPhotoFaces(photoId, photoUrl, eventId){
  try{
    /* Cache-bust so the backend always fetches fresh */
    var urlCb = photoUrl + (photoUrl.includes('?') ? '&' : '?') + 'cb=' + Date.now();

    var res = await fetch(EVENTS_API + '/api/facepp-embed', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ imageUrl: urlCb, eventId: eventId })
    });

    /* Retry once on rate-limit (Face++ free tier: ~1 req/3s) */
    if(res.status === 429){
      await new Promise(function(r){ setTimeout(r, 4000); });
      res = await fetch(EVENTS_API + '/api/facepp-embed', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ imageUrl: urlCb, eventId: eventId })
      });
      if(res.status === 429) return; /* Give up silently */
    }

    if(!res.ok) return;
    var data = await res.json();
    if(!data.faceFound || !data.face_token) return;

    await getSupabase().from('face_embeddings').insert({
      event_id     : eventId,
      photo_id     : photoId,
      face_index   : 0,
      face_token   : data.face_token,
      embedding    : null,
      face_crop_url: data.face_crop_url || null,
      group_id     : (data.group_id !== undefined && data.group_id !== null) ? data.group_id : -1
    });

    console.log('[indexPhotoFaces] saved — photo:', photoId, '| group:', data.group_id, '| crop:', data.face_crop_url ? 'yes' : 'no');
  }catch(e){
    console.warn('[indexPhotoFaces] error:', e.message);
  }
}

/* ════════════════════════════════════════════════════
   FACE INDEX PANEL
════════════════════════════════════════════════════ */
async function loadFacesPanel(){
  var sel = document.getElementById('faces-event-select');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Select an event —</option>';
  try{
    var { data: events } = await getSupabase()
      .from('events')
      .select('id,name,event_code')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    (events||[]).forEach(function(ev){
      var opt = document.createElement('option');
      opt.value       = ev.id;
      opt.textContent = ev.name + ' (' + ev.event_code + ')';
      sel.appendChild(opt);
    });
  }catch(e){}
}

async function loadFacesForEvent(){
  var sel      = document.getElementById('faces-event-select');
  var eventId  = sel ? sel.value : '';
  var grid     = document.getElementById('facesGroupGrid');
  var statsBar = document.getElementById('facesStatsBar');
  var reindexBtn = document.getElementById('reindexBtn');

  if(!eventId){
    grid.innerHTML = '<div class="empty"><div class="empty-ico">👥</div><div class="empty-txt">Select an event</div></div>';
    if(statsBar)   statsBar.style.display   = 'none';
    if(reindexBtn) reindexBtn.style.display = 'none';
    return;
  }

  if(reindexBtn) reindexBtn.style.display = 'inline-flex';
  grid.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div><div class="empty-txt">Loading…</div></div>';

  try{
    var { data: embeddings } = await getSupabase()
      .from('face_embeddings')
      .select('*')
      .eq('event_id', eventId)
      .order('group_id', { ascending: true });

    if(!embeddings || !embeddings.length){
      grid.innerHTML = '<div class="empty"><div class="empty-ico">📷</div><div class="empty-txt">No faces indexed yet. Upload photos first.</div></div>';
      if(statsBar) statsBar.style.display = 'none';
      return;
    }

    /* Group embeddings by group_id */
    var groups    = {};
    var ungrouped = 0;
    embeddings.forEach(function(e){
      if(e.group_id < 0){ ungrouped++; return; }
      if(!groups[e.group_id]) groups[e.group_id] = [];
      groups[e.group_id].push(e);
    });

    var groupKeys  = Object.keys(groups);
    var totalPhotos = new Set(embeddings.map(function(e){ return e.photo_id; })).size;

    /* Stats bar */
    if(statsBar) statsBar.style.display = 'block';
    var stf = document.getElementById('stat-total-faces');
    var sfg = document.getElementById('stat-face-groups');
    var sip = document.getElementById('stat-indexed-photos');
    if(stf) stf.textContent = embeddings.length;
    if(sfg) sfg.textContent = groupKeys.length;
    if(sip) sip.textContent = totalPhotos;

    if(!groupKeys.length){
      grid.innerHTML = '<div class="empty"><div class="empty-ico">🔄</div><div class="empty-txt">Faces found but not yet grouped. Click Re-index All.</div></div>';
      return;
    }

    /* Sort groups by size descending */
    groupKeys.sort(function(a, b){ return groups[b].length - groups[a].length; });

    var html = ungrouped > 0
      ? '<div style="font-size:11px;color:var(--text3);margin-bottom:14px;padding:8px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);">⚠️ '
        + ungrouped + ' face' + (ungrouped > 1 ? 's' : '') + ' skipped (no face detected in photo)</div>'
      : '';

    groupKeys.forEach(function(gid){
      var members = groups[gid];
      var shown   = members.slice(0, 8);
      var extra   = members.length - shown.length;

      html += '<div class="face-group-card">'
        + '<div class="face-group-header">'
        + '<div style="display:flex;align-items:center;gap:8px;">'
        + '<div style="font-size:13px;font-weight:700;">Person ' + (parseInt(gid) + 1) + '</div>'
        + '<div class="face-group-count">' + members.length + ' photo' + (members.length > 1 ? 's' : '') + '</div>'
        + '</div>'
        + '<div class="face-group-id">Group #' + gid + '</div>'
        + '</div>'
        + '<div class="face-thumbs">';

      shown.forEach(function(emb){
        if(emb.face_crop_url){
          html += '<div class="face-thumb"><img src="' + esc(emb.face_crop_url) + '" alt="" onerror="this.parentElement.style.background=\'var(--bg3)\'"/></div>';
        }
      });

      if(extra > 0) html += '<div class="face-thumb-more">+' + extra + '</div>';
      html += '</div></div>';
    });

    grid.innerHTML = html;

  }catch(e){
    grid.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

async function reindexEventFaces(){
  var sel     = document.getElementById('faces-event-select');
  var eventId = sel ? sel.value : '';
  if(!eventId){ toast('⚠️', 'No event selected', ''); return; }

  if(!confirm('Re-index all faces for this event?\n\nThis deletes existing face data and rebuilds from scratch.\nNote: Face++ free tier = ~1 photo every 3 seconds — large events take a while.')) return;

  var btn = document.getElementById('reindexBtn');
  btn.disabled    = true;
  btn.textContent = '⏳ Indexing…';
  toast('🔄', 'Re-indexing…', 'This will take a while for large events', true);

  try{
    var c = getSupabase();

    /* Wipe existing face data for this event */
    await c.from('face_embeddings').delete().eq('event_id', eventId);
    try{
      var { data: crops } = await c.storage.from('events').list(eventId + '/faces');
      if(crops && crops.length)
        await c.storage.from('events').remove(crops.map(function(f){ return eventId + '/faces/' + f.name; }));
    }catch(e){}

    var { data: photos } = await c.from('photos').select('id,preview_url,original_url').eq('event_id', eventId);
    if(!photos || !photos.length){
      toast('⚠️', 'No photos found', 'Upload photos first');
      btn.disabled    = false;
      btn.textContent = '🔄 Re-index All';
      return;
    }

    for(var i = 0; i < photos.length; i++){
      btn.textContent = '⏳ ' + (i + 1) + ' / ' + photos.length;
      await indexPhotoFaces(photos[i].id, photos[i].original_url || photos[i].preview_url, eventId);
      if(i < photos.length - 1) await new Promise(function(r){ setTimeout(r, 3200); }); /* Rate-limit buffer */
    }

    toast('✅', 'Re-indexing complete!', photos.length + ' photos processed');
    btn.disabled    = false;
    btn.textContent = '🔄 Re-index All';
    loadFacesForEvent();

  }catch(e){
    toast('⚠️', 'Re-index failed', e.message);
    btn.disabled    = false;
    btn.textContent = '🔄 Re-index All';
  }
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
          return '<div style="position:relative;border-radius:var(--r);overflow:hidden;background:var(--bg2);border:1px solid var(--border);">'
            + '<img src="' + esc(p.preview_url) + '" style="width:100%;height:90px;object-fit:cover;" onerror="this.style.background=\'var(--bg3)\'"/>'
            + '<button onclick="deletePhoto(\'' + p.id + '\',\'' + esc(p.preview_url) + '\',\'' + esc(p.original_url||'') + '\')" '
            + 'style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:var(--red);border:none;color:#fff;font-size:11px;cursor:pointer;">✕</button>'
            + '</div>';
        }).join('')
      + '</div>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

async function deletePhoto(id, previewUrl, originalUrl){
  if(!confirm('Delete this photo and its face data?')) return;
  var c    = getSupabase();
  var base = 'https://wedjsnizcvtgptobwugc.supabase.co/storage/v1/object/public/events/';
  try{
    if(previewUrl  && previewUrl.includes(base))  await c.storage.from('events').remove([previewUrl.replace(base, '')]);
    if(originalUrl && originalUrl.includes(base)) await c.storage.from('events').remove([originalUrl.replace(base, '')]);
  }catch(e){}
  await c.from('photos').delete().eq('id', id);
  await c.from('face_embeddings').delete().eq('photo_id', id);
  toast('🗑️', 'Photo deleted', '');
  loadEventPhotos();
}

/* ════════════════════════════════════════════════════
   DOWNLOAD REQUESTS
   FIX: approveRequest now calls backend email route
   so the guest actually receives their download links.
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
          + (r.status !== 'rejected' ? '<button class="btn btn-red btn-sm" onclick="rejectRequest(\'' + r.id + '\')">✕ Reject</button>' : '')
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
