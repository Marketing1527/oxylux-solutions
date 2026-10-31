// OxyLux admin dashboard: sign in, view appointments and consent forms, update status.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var records = [], tab = 'upcoming', openId = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function api(url, opts) {
    return fetch(url, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opts || {}))
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); });
  }
  function clinicToday() {
    var p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    return p;
  }
  function addDays(d, n) { var x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); }
  function fmtTime(t) { var p = t.split(':'), h = +p[0]; return (h % 12 || 12) + ':' + p[1] + (h < 12 ? ' AM' : ' PM'); }
  function fmtDay(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function fmtDate(d) { return d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
  function fmtStamp(iso) { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  function key(r) { return r.slot ? r.slot.date + ' ' + r.slot.time : r.createdAt; }

  // ---------- Auth ----------
  function showLogin() { $('app-view').hidden = true; $('login-view').hidden = false; $('login-form').email.focus(); }
  function showApp(me) {
    $('login-view').hidden = true; $('app-view').hidden = false; $('user').textContent = me.email;
    var b = $('storage-banner');
    if (me.storage === 'blob') { b.hidden = false; b.textContent = 'Demo mode: bookings are saved to temporary test storage. Use test data only until Google Drive is connected.'; }
    else if (me.storage === 'local') { b.hidden = false; b.textContent = 'Local development mode.'; }
    load();
  }
  api('/api/admin/me').then(function (r) { r.status === 200 ? showApp(r.body) : showLogin(); }).catch(showLogin);

  $('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = $('login-error'), btn = f.querySelector('button');
    if (!f.email.value || !f.password.value) { err.hidden = false; err.textContent = 'Enter your email and password.'; return; }
    btn.disabled = true; btn.textContent = 'Signing in…'; err.hidden = true;
    api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email: f.email.value, password: f.password.value }) }).then(function (r) {
      btn.disabled = false; btn.textContent = 'Sign in';
      if (r.status !== 200) { err.hidden = false; err.textContent = r.body.error || 'Sign in failed. Try again.'; f.password.select(); return; }
      f.password.value = '';
      api('/api/admin/me').then(function (m) { showApp(m.body); });
    }).catch(function () { btn.disabled = false; btn.textContent = 'Sign in'; err.hidden = false; err.textContent = 'Could not reach the server. Check your connection.'; });
  });
  $('logout').addEventListener('click', function () { api('/api/admin/logout', { method: 'POST' }).then(function () { records = []; closeDrawer(); showLogin(); }); });

  // ---------- Data ----------
  function load() {
    $('list').innerHTML = '<p class="a-empty">Loading appointments…</p>';
    api('/api/admin/bookings').then(function (r) {
      if (r.status === 401) return showLogin();
      if (r.status !== 200) { $('list').innerHTML = '<p class="a-empty">' + esc(r.body.error || 'Could not load appointments.') + '</p>'; return; }
      records = r.body.records.sort(function (a, b) { return key(a) < key(b) ? -1 : 1; });
      render();
      if (openId) openDrawer(openId);
    });
  }
  $('refresh').addEventListener('click', load);
  $('search').addEventListener('input', render);
  $('service-filter').addEventListener('change', render);
  document.querySelectorAll('.a-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      tab = b.dataset.tab;
      document.querySelectorAll('.a-tabs button').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      render();
    });
  });

  function filtered() {
    var today = clinicToday(), q = $('search').value.trim().toLowerCase(), svc = $('service-filter').value;
    return records.filter(function (r) {
      var isBooking = r.type === 'booking';
      if (svc && (r.service || 'hbot') !== svc) return false;
      if (tab === 'consent' && isBooking) return false;
      if (tab !== 'consent' && !isBooking) return false;
      if (tab === 'cancelled' && r.status !== 'cancelled') return false;
      if (tab === 'upcoming' && (r.status === 'cancelled' || r.slot.date < today)) return false;
      if (tab === 'past' && (r.status === 'cancelled' || r.slot.date >= today)) return false;
      if (!q) return true;
      var p = r.patient, digits = q.replace(/\D/g, '');
      return (p.name + ' ' + p.email + ' ' + p.phone).toLowerCase().indexOf(q) !== -1 || (digits.length >= 3 && p.phone.replace(/\D/g, '').indexOf(digits) !== -1);
    }).sort(function (a, b) { return tab === 'past' || tab === 'consent' ? (key(a) < key(b) ? 1 : -1) : (key(a) < key(b) ? -1 : 1); });
  }

  function render() {
    var today = clinicToday(), week = addDays(today, 7);
    var active = records.filter(function (r) { return r.type === 'booking' && r.status !== 'cancelled'; });
    var stats = [
      [active.filter(function (r) { return r.slot.date === today; }).length, 'Today'],
      [active.filter(function (r) { return r.slot.date >= today && r.slot.date < week; }).length, 'Next 7 days'],
      [active.filter(function (r) { return r.slot.date >= today && r.flags && r.flags.length; }).length, 'Upcoming with health flags'],
      [records.filter(function (r) { return r.type === 'consent'; }).length, 'Consent forms only']
    ];
    $('stats').innerHTML = stats.map(function (s) { return '<div class="a-stat"><strong>' + s[0] + '</strong><span>' + s[1] + '</span></div>'; }).join('');
    $('summary').textContent = active.filter(function (r) { return r.slot.date >= today; }).length + ' upcoming appointments';

    var list = filtered();
    if (!list.length) {
      var empty = { upcoming: 'No upcoming appointments. New bookings from the website will appear here.', past: 'No past appointments yet.', cancelled: 'No cancelled appointments.', consent: 'No consent forms submitted without a booking.' }[tab];
      $('list').innerHTML = '<p class="a-empty">' + ($('search').value ? 'No matches for that search.' : empty) + '</p>';
      return;
    }
    var html = '', lastDay = '';
    list.forEach(function (r) {
      var day = r.slot ? r.slot.date : r.createdAt.slice(0, 10);
      if (day !== lastDay) { html += '<h2 class="a-day">' + esc(day === today ? 'Today · ' + fmtDay(day) : fmtDay(day)) + '</h2>'; lastDay = day; }
      var pending = r.consent === 'pending' ? '<span class="a-badge warn">Consent needed</span>' : '';
      var badges = pending + ((r.flags || []).length ? '<span class="a-badge warn">' + r.flags.length + ' health flag' + (r.flags.length > 1 ? 's' : '') + '</span>' : '');
      badges += '<span class="a-status ' + esc(r.status) + '">' + esc(r.status.replace('-', ' ')) + '</span>';
      html += '<button class="a-row" type="button" data-id="' + esc(r.id) + '">' +
        '<span class="a-time">' + (r.slot ? esc(fmtTime(r.slot.time)) : esc(fmtStamp(r.createdAt).split(', ').pop())) + '</span>' +
        '<span class="a-who"><strong>' + esc(r.patient.name) + '</strong><span>' + esc(r.serviceName || 'Hyperbaric Oxygen Therapy') + (r.form && r.form.drip ? ' (' + esc(r.form.drip) + ')' : '') + (r.patient.dob ? ', DOB ' + esc(fmtDate(r.patient.dob)) : '') + '</span></span>' +
        '<span class="a-contact">' + esc(r.patient.phone) + '<br>' + esc(r.patient.email) + '</span>' +
        '<span class="a-badges">' + badges + '</span></button>';
    });
    $('list').innerHTML = html;
    $('list').querySelectorAll('.a-row').forEach(function (b) { b.addEventListener('click', function () { openDrawer(b.dataset.id); }); });
  }

  // ---------- Detail drawer ----------
  function dl(rows) { return '<dl class="a-dl">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>'; }
  function screenRows(r) {
    if (r.screening && r.screening.length) return r.screening.map(function (g) { return [g.title.replace(/<[^>]+>/g, ''), g.selected.join(', ')]; });
    var f = r.form || {};
    return [['Bleomycin / Disulfiram / Mafenide', (f.rx || []).join(', ')], ['Spherocytosis / sickle cell / COPD', (f.dx || []).join(', ')], ['Contraindications', (f.contra || []).join(', ')]];
  }
  function printPdf(id) {
    var old = document.getElementById('print-frame');
    if (old) old.remove();
    var fr = document.createElement('iframe');
    fr.id = 'print-frame'; fr.hidden = true; fr.src = '/api/admin/file?inline=1&id=' + encodeURIComponent(id);
    fr.onload = function () { try { fr.hidden = false; fr.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0'; fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { window.open(fr.src, '_blank'); } };
    document.body.appendChild(fr);
  }
  var lastFocus;
  function openDrawer(id) {
    var r = records.filter(function (x) { return x.id === id; })[0];
    if (!r) return closeDrawer();
    openId = id; lastFocus = document.activeElement;
    var f = r.form || {};
    $('d-when').textContent = (r.serviceName || 'Hyperbaric Oxygen Therapy') + (f.drip ? ' (' + f.drip + ')' : '') + ', ' + (r.slot ? fmtDay(r.slot.date) + ' at ' + fmtTime(r.slot.time) : 'consent form submitted ' + fmtStamp(r.createdAt));
    $('d-name').textContent = r.patient.name;
    $('d-status').className = 'a-status ' + r.status; $('d-status').textContent = r.status.replace('-', ' ');
    var body = '';
    if (r.consent === 'pending') body += '<p class="a-alert"><strong>Consent needed:</strong> booked through the help chat. The patient must sign before treatment. Consent link: ' + esc(location.origin + '/consent.html?service=' + r.service + '&booking=' + r.id) + '</p>';
    if ((r.flags || []).length) body += '<p class="a-alert"><strong>Review before session:</strong> ' + esc(r.flags.join(', ')) + '</p>';
    body += '<h3>Contact</h3>' + dl([['Phone', f.phone], ['Email', f.email], ['Address', [f.address, f.city, f.state, f.zip].filter(Boolean).join(', ')], ['Emergency contact', [f.ec_name, f.ec_phone].filter(Boolean).join(', ')]]);
    body += '<h3>Patient</h3>' + dl([['Date of birth', f.dob ? fmtDate(f.dob) + (f.age ? ' (age ' + f.age + ')' : '') : ''], ['Height / weight', [f.height, f.weight].filter(Boolean).join(' / ')], ['Referred by', f.referral], ['Heard about us', f.heard]]);
    if (r.consent !== 'pending') body += '<h3>Health history</h3>' + dl([['Medications', f.medications], ['Allergies', f.allergies], ['Under medical care', f.care ? f.care + (f.care === 'Yes' && f.care_detail ? ': ' + f.care_detail : '') : '']].concat(screenRows(r)));
    if (r.pdf) body += '<h3>Consent</h3>' + dl([['Signed by', f.sig_name], ['Signed on', fmtDate(f.sig_date)], ['E-signature agreement', f.esign === 'true' || f.esign === true ? 'Accepted' : '']]);
    body += '<p class="a-note">Practice Fusion: download the PDF, then upload it to the patient’s chart.</p>';
    body += '<h3>History</h3><ul class="a-history">' + (r.history || []).map(function (h) { return '<li>' + esc(fmtStamp(h.at)) + ' · ' + esc(h.action) + (h.by ? ' by ' + esc(h.by) : '') + '</li>'; }).join('') + '</ul>';
    $('d-body').innerHTML = body;

    var acts = !r.pdf ? '' : '<a class="btn" href="/api/admin/file?id=' + encodeURIComponent(r.id) + '">Download consent PDF</a>' +
      '<a class="btn btn-ghost" target="_blank" rel="noopener" href="/api/admin/file?inline=1&id=' + encodeURIComponent(r.id) + '">View PDF</a><button class="btn btn-ghost" data-print="1">Print</button>';
    if (r.type === 'booking') {
      if (r.status === 'confirmed') acts += '<button class="btn btn-ghost" data-act="complete">Mark completed</button><button class="btn btn-ghost" data-act="noshow">No-show</button><button class="btn btn-danger" data-act="cancel">Cancel appointment</button>';
      else if (r.status === 'cancelled') acts += '<button class="btn btn-ghost" data-act="confirm">Restore appointment</button>';
      else acts += '<button class="btn btn-ghost" data-act="confirm">Mark as confirmed</button>';
    }
    $('d-actions').innerHTML = acts;
    if (r.pdf) $('d-actions').querySelector('[data-print]').addEventListener('click', function () { printPdf(r.id); });
    $('d-actions').querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.act;
        if (act === 'cancel' && !confirm('Cancel ' + r.patient.name + '’s appointment? The time will open up for other bookings.')) return;
        b.disabled = true;
        api('/api/admin/bookings', { method: 'POST', body: JSON.stringify({ id: r.id, action: act }) }).then(function (res) {
          b.disabled = false;
          if (res.status !== 200) { alert(res.body.error || 'That change could not be saved.'); return; }
          records = records.map(function (x) { return x.id === r.id ? res.body.record : x; });
          render(); openDrawer(r.id);
        });
      });
    });
    $('scrim').hidden = false; $('drawer').hidden = false; $('d-close').focus();
  }
  function closeDrawer() {
    openId = null; $('scrim').hidden = true; $('drawer').hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $('d-close').addEventListener('click', closeDrawer);
  $('scrim').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('drawer').hidden) closeDrawer(); });
})();
