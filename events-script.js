/* ════════════════════════════════════════════════════
   EVENTS MANAGEMENT
════════════════════════════════════════════════════ */

var evWatermark  = true;
var evRequireCode = true;
var selectedEventId = null;

/* Set default expiry to 30 days from today */
function setDefaultExpiry(){
  var el = document.getElementById('ev-expiry');
  if(!el) return;
  var d = new Date();
  d.setDate(d.getDate() + 30);
  el.value = d.toISOString().split('T')[0];
}

/* Generate random 6-char access code */
function generateCode(){
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var code = '';
  for(var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  var el = document.getElementById('ev-code');
  if(el) el.value = code;
}

/* Generate URL-safe slug from event name */
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

/* CREATE EVENT */
async function createEvent(){
  var name    = document.getElementById('ev-name').value.trim();
  var type    = document.getElementById('ev-type').value;
  var owner   = document.getElementById('ev-owner').value.trim();
  var expiry  = document.getElementById('ev-expiry').value;
  var code    = document.getElementById('ev-code').value.trim().toUpperCase();
  var template= document.getElementById('ev-template').value;
  var alertEl = document.getElementById('createEventAlert');

  function showAlert(msg, ok){
    alertEl.textContent = msg;
    alertEl.style.cssText = 'display:block;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;'
      + (ok
        ? 'background:var(--green-dim);border:1px solid rgba(45,212,160,.25);color:var(--green);'
        : 'background:var(--red-dim);border:1px solid var(--red-glo);color:#fca5a5;');
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
      type        : type,
      owner_id    : sess.session ? sess.session.user.id : null,
      event_code  : code,
      event_slug  : slug,
      expiry_date : new Date(expiry).toISOString(),
      is_active   : true
    }).select().single();

    if(evErr) throw evErr;

    /* Create event settings */
    await c.from('event_settings').insert({
      event_id         : ev.id,
      require_code     : evRequireCode,
      template         : template,
      watermark_enabled: evWatermark
    });

    showAlert('✅ Event created! Code: ' + code, true);
    toast('✅', 'Event created!', name + ' · Code: ' + code);

    /* Reset form */
    document.getElementById('ev-name').value  = '';
    document.getElementById('ev-owner').value = '';
    document.getElementById('ev-code').value  = '';
    setDefaultExpiry();
    evWatermark   = true;
    evRequireCode = true;
    document.getElementById('ev-watermark-toggle').classList.add('on');
    document.getElementById('ev-code-toggle').classList.add('on');

    setTimeout(function(){ nav('events', null); }, 1500);

  }catch(err){
    showAlert('Error: ' + err.message, false);
  }
}

/* LOAD EVENTS LIST */
async function loadEvents(){
  var el = document.getElementById('eventsList');
  if(!el) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div><div class="empty-txt">Loading…</div></div>';
  try{
    var { data } = await getSupabase().from('events').select('*, event_settings(*)').order('created_at', {ascending:false});
    if(!data || !data.length){
      el.innerHTML = '<div class="empty"><div class="empty-ico">📅</div><div class="empty-txt">No events yet — create your first one.</div></div>';
      return;
    }
    el.innerHTML = '<table><thead><tr><th>Event</th><th>Type</th><th>Code</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>'
      + data.map(function(ev){
          var expDate  = new Date(ev.expiry_date);
          var daysLeft = Math.ceil((expDate - new Date()) / (1000*60*60*24));
          var expStr   = expDate.toLocaleDateString('en-GB') + (daysLeft > 0 ? ' (' + daysLeft + 'd)' : ' ⚠️ Expired');
          var statusPill = ev.is_active
            ? '<span class="pill pill-active">Active</span>'
            : '<span class="pill pill-paused">Inactive</span>';
          return '<tr>'
            + '<td style="font-weight:700;">' + esc(ev.name) + '<br><span style="font-size:10px;color:var(--text3);font-family:var(--fm);">' + esc(ev.event_slug||'') + '</span></td>'
            + '<td><span class="pill ' + (ev.type==='kids'?'pill-applied':'pill-booked') + '">' + esc(ev.type) + '</span></td>'
            + '<td style="font-family:var(--fm);letter-spacing:.1em;font-size:12px;color:var(--gold);">' + esc(ev.event_code||'—') + '</td>'
            + '<td style="font-size:12px;color:' + (daysLeft < 5 ? 'var(--red)' : 'var(--text2)') + ';">' + expStr + '</td>'
            + '<td>' + statusPill + '</td>'
            + '<td><div class="td-actions">'
            + '<button class="btn btn-ghost btn-sm" onclick="goUploadForEvent(\'' + ev.id + '\')">📤 Upload</button>'
            + '<button class="btn ' + (ev.is_active?'btn-red':'btn-green') + ' btn-sm" onclick="toggleEvent(\'' + ev.id + '\',' + ev.is_active + ')">'
            + (ev.is_active ? 'Deactivate' : 'Activate') + '</button>'
            + '<button class="btn btn-red btn-icon btn-sm" onclick="deleteEvent(\'' + ev.id + '\',\'' + esc(ev.event_slug||'') + '\')">✕</button>'
            + '</div></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: ' + esc(e.message) + '</div></div>';
  }
}

async function toggleEvent(id, cur){
  await getSupabase().from('events').update({ is_active: !cur }).eq('id', id);
  loadEvents();
  toast(cur ? '⏸' : '▶️', cur ? 'Event deactivated' : 'Event activated', '');
}

async function deleteEvent(id, slug){
  if(!confirm('Delete this event and ALL its photos? This cannot be undone.')) return;
  var c = getSupabase();
  /* Delete storage folder */
  try{
    var { data: files } = await c.storage.from('events').list(id + '/preview');
    if(files && files.length) await c.storage.from('events').remove(files.map(function(f){ return id+'/preview/'+f.name; }));
    var { data: origFiles } = await c.storage.from('events').list(id + '/original');
    if(origFiles && origFiles.length) await c.storage.from('events').remove(origFiles.map(function(f){ return id+'/original/'+f.name; }));
  }catch(e){}
  await c.from('events').delete().eq('id', id);
  toast('🗑️', 'Event deleted', '');
  loadEvents();
}

/* UPLOAD PHOTOS */
function goUploadForEvent(eventId){
  selectedEventId = eventId;
  nav('uploadphotos', null);
  setTimeout(function(){
    var sel = document.getElementById('upload-event-select');
    if(sel) sel.value = eventId;
    onUploadEventChange();
  }, 300);
}

async function loadUploadPhotos(){
  var sel = document.getElementById('upload-event-select');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Select an event —</option>';
  try{
    var { data } = await getSupabase().from('events').select('id,name,event_code,expiry_date').eq('is_active', true).order('created_at', {ascending:false});
    (data||[]).forEach(function(ev){
      var opt = document.createElement('option');
      opt.value = ev.id;
      opt.textContent = ev.name + ' (' + (ev.event_code||'no code') + ')';
      sel.appendChild(opt);
    });
    if(selectedEventId){ sel.value = selectedEventId; onUploadEventChange(); }
  }catch(e){}
}

function onUploadEventChange(){
  var sel = document.getElementById('upload-event-select');
  var id  = sel ? sel.value : '';
  selectedEventId = id || null;
  document.getElementById('upload-dropcard').style.display        = id ? 'block' : 'none';
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

function handlePhotoFiles(file){ uploadPhotos([file]); }

async function uploadPhotos(files){
  if(!selectedEventId){ toast('⚠️','No event selected','Pick an event first'); return; }
  var prog = document.getElementById('photoUploadProgress');
  prog.innerHTML = '';

  for(var i = 0; i < files.length; i++){
    var file = files[i];
    var allowed = ['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type)){ toast('⚠️','Skipped '+file.name,'Not a supported image type'); continue; }

    var ext   = file.name.split('.').pop();
    var fname = Date.now() + '-' + Math.random().toString(36).substring(2,8) + '.' + ext;
    var path  = selectedEventId + '/original/' + fname;
    var prevPath = selectedEventId + '/preview/' + fname;

    /* Progress row */
    var rowId = 'prog-' + i;
    prog.innerHTML += '<div id="'+rowId+'" style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:10px 12px;margin-bottom:6px;">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">'
      + '<span style="font-size:12px;font-weight:600;">'+esc(file.name)+'</span>'
      + '<span id="'+rowId+'-pct" style="font-size:11px;color:var(--text3);">Uploading…</span>'
      + '</div>'
      + '<div class="prog-track"><div class="prog-fill" id="'+rowId+'-bar" style="width:0%;"></div></div>'
      + '</div>';

    try{
      var c = getSupabase();
      /* Upload original */
      var { error: upErr } = await c.storage.from('events').upload(path, file, { contentType: file.type, upsert: false });
      if(upErr) throw upErr;

      /* For preview — upload same file to preview path (watermarking done client-side later) */
      await c.storage.from('events').upload(prevPath, file, { contentType: file.type, upsert: false });

      var { data: urlData } = c.storage.from('events').getPublicUrl(prevPath);
      var { data: origUrl } = c.storage.from('events').getPublicUrl(path);

      /* Save to photos table */
      await c.from('photos').insert({
        event_id   : selectedEventId,
        preview_url: urlData.publicUrl,
        original_url: origUrl.publicUrl
      });

      document.getElementById(rowId+'-pct').textContent = '✅ Done';
      document.getElementById(rowId+'-bar').style.width = '100%';
      document.getElementById(rowId+'-bar').style.background = 'var(--green)';

    }catch(err){
      document.getElementById(rowId+'-pct').textContent = '⚠️ Failed';
      document.getElementById(rowId+'-bar').style.background = 'var(--red)';
    }
  }

  toast('✅', 'Upload complete!', files.length + ' photo' + (files.length>1?'s':'') + ' added');
  loadEventPhotos();
}

async function loadEventPhotos(){
  var el = document.getElementById('eventPhotosList');
  if(!el || !selectedEventId) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div></div>';
  try{
    var { data } = await getSupabase().from('photos').select('*').eq('event_id', selectedEventId).order('created_at', {ascending:false});
    if(!data || !data.length){
      el.innerHTML = '<div class="empty"><div class="empty-ico">📸</div><div class="empty-txt">No photos yet.</div></div>';
      return;
    }
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;">'
      + data.map(function(p){
          return '<div style="position:relative;border-radius:var(--r);overflow:hidden;background:rgba(255,255,255,.04);border:1px solid var(--border);">'
            + '<img src="'+esc(p.preview_url)+'" style="width:100%;height:90px;object-fit:cover;" onerror="this.style.background=\'rgba(255,255,255,0.05)\'"/>'
            + '<button onclick="deletePhoto(\''+p.id+'\',\''+esc(p.preview_url)+'\',\''+esc(p.original_url)+'\')" '
            + 'style="position:absolute;top:4px;right:4px;width:20px;height:20px;border-radius:50%;background:rgba(239,68,68,.85);border:none;color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>'
            + '</div>';
        }).join('')
      + '</div>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: '+esc(e.message)+'</div></div>';
  }
}

async function deletePhoto(id, previewUrl, originalUrl){
  if(!confirm('Delete this photo?')) return;
  var c = getSupabase();
  /* Extract storage paths and delete */
  try{
    var base = 'https://wedjsnizcvtgptobwugc.supabase.co/storage/v1/object/public/events/';
    if(previewUrl)  await c.storage.from('events').remove([previewUrl.replace(base,'')]);
    if(originalUrl) await c.storage.from('events').remove([originalUrl.replace(base,'')]);
  }catch(e){}
  await getSupabase().from('photos').delete().eq('id', id);
  toast('🗑️','Photo deleted','');
  loadEventPhotos();
}

/* DOWNLOAD REQUESTS */
async function loadDownloadRequests(){
  var el = document.getElementById('downloadRequestsList');
  if(!el) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">⏳</div><div class="empty-txt">Loading…</div></div>';
  try{
    var { data } = await getSupabase()
      .from('download_requests')
      .select('*, events(name)')
      .order('created_at', {ascending:false});

    /* Update badge */
    var pending = (data||[]).filter(function(r){ return r.status==='pending'; }).length;
    var badge = document.getElementById('requestsBadge');
    if(badge){ badge.textContent = pending; badge.style.display = pending > 0 ? 'inline-flex' : 'none'; }

    if(!data || !data.length){
      el.innerHTML = '<div class="empty"><div class="empty-ico">📥</div><div class="empty-txt">No download requests yet.</div></div>';
      return;
    }

    el.innerHTML = '<table><thead><tr><th>Guest Email</th><th>Event</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>'
      + data.map(function(r){
          var pc = {pending:'pill-pending', approved:'pill-active', rejected:'pill-rejected'}[r.status]||'pill-pending';
          return '<tr>'
            + '<td style="font-weight:600;">' + esc(r.user_email) + '</td>'
            + '<td>' + esc((r.events && r.events.name)||'—') + '</td>'
            + '<td><span class="pill '+pc+'">' + esc(r.status) + '</span></td>'
            + '<td style="color:var(--text3);">' + new Date(r.created_at).toLocaleDateString('en-GB') + '</td>'
            + '<td><div class="td-actions">'
            + (r.status !== 'approved' ? '<button class="btn btn-green btn-sm" onclick="approveRequest(\''+r.id+'\',\''+esc(r.user_email)+'\',\''+r.event_id+'\')">✓ Approve</button>' : '')
            + (r.status !== 'rejected' ? '<button class="btn btn-red btn-sm" onclick="rejectRequest(\''+r.id+'\')">✕ Reject</button>' : '')
            + '</div></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table>';
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="empty-txt">Error: '+esc(e.message)+'</div></div>';
  }
}

async function approveRequest(id, email, eventId){
  if(!confirm('Approve download request for ' + email + '?')) return;
  await getSupabase().from('download_requests').update({ status:'approved' }).eq('id', id);
  toast('✅', 'Request approved', 'Email notification coming in Phase 4');
  loadDownloadRequests();
}

async function rejectRequest(id){
  if(!confirm('Reject this request?')) return;
  await getSupabase().from('download_requests').update({ status:'rejected' }).eq('id', id);
  toast('🗑️', 'Request rejected', '');
  loadDownloadRequests();
}
