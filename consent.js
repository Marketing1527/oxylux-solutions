// OxyLux consent form: validation, signature pad, progress and signed PDF.
// Nothing is stored in the browser. Consent text for each service comes from consent-forms.js.
(function () {
  var form = document.getElementById('consent');
  var $ = function (id) { return document.getElementById(id); };
  var groups = ['contra'];
  var service = null, SERVICES = window.OXY_SERVICES;
  var wantService = (/[?&]service=([a-z]+)/.exec(location.search) || [])[1];
  if (!SERVICES.some(function (s) { return s.id === wantService; })) wantService = null;
  var drip = wantService === 'iv' ? window.OXY_DRIPS[(/[?&]drip=([a-z]+)/.exec(location.search) || [])[1]] || '' : '';
  var bookingId = (/[?&]booking=([a-f0-9]{12})/.exec(location.search) || [])[1] || null;
  function serviceLabel() { return service.id === 'iv' && drip ? service.name + ' (' + drip + ')' : service.name; }

  document.querySelectorAll('.yr').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function setDates() { $('f-date').value = today(); $('f-sigdate').value = today(); $('f-dob').max = today(); }
  setDates();

  // Age from date of birth
  $('f-dob').addEventListener('change', function () {
    if (!this.value) return;
    var b = new Date(this.value + 'T00:00:00'), n = new Date();
    var age = n.getFullYear() - b.getFullYear() - ((n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) ? 1 : 0);
    if (age >= 0 && age < 130) $('f-age').value = age;
    update();
  });

  // Name flows into the waiver and the typed signature
  var sigTouched = false;
  $('f-signame').addEventListener('input', function () { sigTouched = true; });
  $('f-name').addEventListener('input', function () {
    var v = this.value.trim();
    if ($('waiver-name')) $('waiver-name').textContent = v || '[your name]';
    if (!sigTouched) $('f-signame').value = v;
  });

  // Initials are always uppercase
  form.addEventListener('input', function (e) {
    var i = e.target;
    if (!i.closest('.c-initial')) return;
    var p = i.selectionStart; i.value = i.value.toUpperCase().replace(/[^A-Z.\- ]/g, ''); i.setSelectionRange(p, p);
  });

  // "Under medical care" reveals an explanation box
  form.querySelectorAll('input[name="care"]').forEach(function (r) {
    r.addEventListener('change', function () {
      var yes = form.care.value === 'Yes';
      $('care-explain').hidden = !yes;
      form.care_detail.required = yes;
      if (yes) form.care_detail.focus();
    });
  });

  // "None" options are exclusive within their group
  form.addEventListener('change', function (e) {
    var b = e.target;
    if (b.type !== 'checkbox' || !b.checked || groups.indexOf(b.name) === -1) return;
    var isNone = b.closest('.c-none');
    form.querySelectorAll('input[name="' + b.name + '"]').forEach(function (o) {
      if (o !== b && (isNone || o.closest('.c-none'))) o.checked = false;
    });
  });

  // ---------- Service-specific consent ----------
  function choice(name, o) {
    return '<label class="c-choice' + (o.none ? ' c-none c-full' : '') + '"><input type="checkbox" name="' + name + '" value="' + esc(o.value) + '"><span>' + o.label + '</span></label>';
  }
  function renderService(s) {
    service = s;
    groups = s.screens.map(function (g) { return g.name; }).concat('contra');
    $('svc-screens').innerHTML = s.screens.map(function (g) {
      return '<div class="c-q" data-group="' + g.name + '" data-title="' + esc(g.title) + '"><p class="c-q-title">' + g.title + ' <span class="c-opt">Select all that apply.</span></p><div class="c-choices">' +
        g.options.map(function (o) { return choice(g.name, o); }).join('') + '</div></div>';
    }).join('');
    $('svc-acks').innerHTML = s.acks.map(function (a) {
      return '<div class="c-ack"><h3>' + a.title + '</h3>' + a.paras.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
        '<label class="c-initial">Initials<input name="' + a.id + '" maxlength="4" autocapitalize="characters" required></label></div>';
    }).join('');
    $('contra-title').innerHTML = s.contra.title;
    $('contra-options').innerHTML = s.contra.options.map(function (o) { return choice('contra', o); }).join('');
    $('contra-warn').hidden = true;
    $('svc-legal').innerHTML = s.legal.map(function (p) {
      return '<p>' + p.replace('{{NAME}}', '<strong class="c-fill" id="waiver-name"></strong>') + '</p>';
    }).join('');
    $('waiver-name').textContent = form.name.value.trim() || '[your name]';
    $('c-title').textContent = s.formTitle;
    update();
  }

  function checked(g) { return Array.prototype.filter.call(form.querySelectorAll('input[name="' + g + '"]'), function (b) { return b.checked; }).map(function (b) { return b.value; }); }
  function contraFlag() {
    var c = checked('contra');
    $('contra-warn').hidden = !(c.length && c.indexOf('None of the above apply to me') === -1);
  }

  // ---------- Signature pad ----------
  var canvas = $('sig'), wrap = $('sig-wrap'), ctx = canvas.getContext('2d');
  var strokes = [], current = null;
  function resize() {
    var r = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }
  function redraw() {
    var r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.strokeStyle = '#17225e'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes.forEach(function (s) {
      ctx.beginPath();
      s.forEach(function (p, i) { var x = p[0] * r.width, y = p[1] * r.height; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      if (s.length === 1) { ctx.lineTo(s[0][0] * r.width + .1, s[0][1] * r.height); }
      ctx.stroke();
    });
    wrap.classList.toggle('is-empty', strokes.length === 0);
  }
  function pt(e) { var r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; }
  canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); canvas.setPointerCapture(e.pointerId); current = [pt(e)]; strokes.push(current); redraw(); });
  canvas.addEventListener('pointermove', function (e) { if (!current) return; e.preventDefault(); current.push(pt(e)); redraw(); });
  function end() { if (current) { current = null; wrap.classList.remove('is-invalid'); update(); } }
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  $('sig-clear').addEventListener('click', function () { strokes = []; redraw(); update(); });
  window.addEventListener('resize', resize);
  resize();

  function signatureImage() {
    // Crisp, white-background PNG for the PDF
    var w = 900, h = 300, c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#17225e'; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round';
    strokes.forEach(function (s) { x.beginPath(); s.forEach(function (p, i) { i ? x.lineTo(p[0] * w, p[1] * h) : x.moveTo(p[0] * w, p[1] * h); }); x.stroke(); });
    return c.toDataURL('image/png');
  }

  // ---------- Progress ----------
  function requiredFields() { return Array.prototype.filter.call(form.querySelectorAll('input[required], textarea[required]'), function (f) { return f.type !== 'radio'; }); }
  function update() {
    var items = requiredFields(), done = 0, total = items.length + 2 + groups.length + 1;
    items.forEach(function (f) { if (f.type === 'checkbox' ? f.checked : f.value.trim() && f.checkValidity()) done++; });
    if (form.care.value) done++;
    if (strokes.length) done++;
    groups.forEach(function (g) { if (checked(g).length) done++; });
    if (form.care.value !== 'Yes' || form.care_detail.value.trim()) done++;
    var pct = Math.round(done / total * 100);
    $('progress-bar').style.width = pct + '%';
    $('progress-label').textContent = pct + '% complete';
  }
  form.addEventListener('input', function (e) { e.target.classList.remove('is-invalid'); var q = e.target.closest('.c-q, .c-initial'); if (q) q.classList.remove('is-invalid'); update(); });
  form.addEventListener('change', function () { contraFlag(); update(); });
  update();

  function validate() {
    var bad = [];
    form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    requiredFields().forEach(function (f) {
      var ok = f.type === 'checkbox' ? f.checked : (f.value.trim() && f.checkValidity());
      if (!ok) { var t = f.closest('.c-initial') || (f.type === 'checkbox' ? f.closest('.c-choice') : f); t.classList.add('is-invalid'); bad.push(t); }
    });
    if (!form.care.value) { var q = form.querySelector('[data-group="care"]'); q.classList.add('is-invalid'); bad.push(q); }
    groups.forEach(function (g) { if (!checked(g).length) { var q = form.querySelector('[data-group="' + g + '"]'); q.classList.add('is-invalid'); bad.push(q); } });
    if (!strokes.length) { wrap.classList.add('is-invalid'); bad.push(wrap); }
    bad.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    return bad;
  }

  // ---------- Booking step (/reserve) ----------
  var bookingMode = /^\/reserve/.test(location.pathname) || /[?&]book=1/.test(location.search);
  var slot = null, dayData = [], dayStart = 0, DAYS_SHOWN = 7;
  function fmtTime(t) { var p = t.split(':'), h = +p[0]; return (h % 12 || 12) + ':' + p[1] + (h < 12 ? ' AM' : ' PM'); }
  function fmtLong(d) { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
  function slotText() { return slot ? fmtLong(slot.date) + ' at ' + fmtTime(slot.time) : ''; }

  function timeOpen(t) { return wantService ? t.services.indexOf(wantService) !== -1 : t.open; }
  function renderDays() {
    var box = $('days'); box.innerHTML = '';
    var view = dayData.slice(dayStart, dayStart + DAYS_SHOWN);
    view.forEach(function (d) {
      var open = d.times.some(timeOpen);
      var dt = new Date(d.date + 'T12:00:00');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'c-day'; b.setAttribute('role', 'option');
      b.disabled = !open; b.dataset.date = d.date;
      b.setAttribute('aria-selected', slot && slot.date === d.date ? 'true' : 'false');
      b.innerHTML = '<span>' + dt.toLocaleDateString('en-US', { weekday: 'short' }) + '</span><strong>' + dt.getDate() + '</strong><span>' + (open ? dt.toLocaleDateString('en-US', { month: 'short' }) : 'Full') + '</span>';
      b.addEventListener('click', function () { selectDay(d.date); });
      box.appendChild(b);
    });
    var first = view[0], last = view[view.length - 1];
    $('days-month').textContent = first ? new Date(first.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) + (last && last.date.slice(5, 7) !== first.date.slice(5, 7) ? ' – ' + new Date(last.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long' }) : '') : '';
    $('days-prev').disabled = dayStart === 0;
    $('days-next').disabled = dayStart + DAYS_SHOWN >= dayData.length;
  }
  function selectDay(date) {
    var d = dayData.filter(function (x) { return x.date === date; })[0];
    if (!d) return;
    if (!slot || slot.date !== date) slot = { date: date, time: null };
    renderDays();
    var box = $('times'); box.innerHTML = '';
    d.times.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'c-time'; b.setAttribute('role', 'option');
      b.disabled = !timeOpen(t); b.textContent = fmtTime(t.time);
      b.setAttribute('aria-selected', slot.time === t.time ? 'true' : 'false');
      if (!timeOpen(t)) b.title = 'Booked';
      b.addEventListener('click', function () { slot = { date: date, time: t.time }; selectDay(date); });
      box.appendChild(b);
    });
    var ready = slot && slot.time;
    $('picked').textContent = ready ? slotText() : 'Now choose a time on ' + fmtLong(date) + '.';
    $('to-consent').disabled = !ready;
  }
  function loadSlots(keepSlot) {
    $('slots-msg').textContent = 'Loading available times…';
    return fetch('/api/availability?days=42').then(function (r) { if (!r.ok) throw r; return r.json(); }).then(function (data) {
      // Hide today once its remaining times have passed
      dayData = data.days.filter(function (d, i) { return i > 0 || d.times.some(timeOpen); });
      $('slots-msg').textContent = dayData.some(function (d) { return d.times.some(timeOpen); }) ? '' : 'No times are open right now. Please call (305) 205-2738.';
      if (!keepSlot) slot = null;
      var firstOpen = dayData.findIndex(function (d) { return d.times.some(timeOpen); });
      dayStart = Math.max(0, Math.floor(Math.max(firstOpen, 0) / DAYS_SHOWN) * DAYS_SHOWN);
      renderDays();
      if (slot) selectDay(slot.date);
      else if (firstOpen >= 0) selectDay(dayData[firstOpen].date);
    }).catch(function () {
      $('slots-msg').textContent = 'Online booking is not available right now. Please call (305) 205-2738 to book.';
    });
  }
  function openServices() {
    if (!bookingMode || !slot) return SERVICES.map(function (s) { return s.id; });
    var day = dayData.filter(function (d) { return d.date === slot.date; })[0];
    var t = day && day.times.filter(function (x) { return x.time === slot.time; })[0];
    return t ? t.services : [];
  }
  function renderServiceList() {
    var open = openServices(), box = $('svc-list');
    if (service && open.indexOf(service.id) === -1) service = null;
    box.innerHTML = '';
    SERVICES.forEach(function (s) {
      var free = open.indexOf(s.id) !== -1;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'c-service'; b.setAttribute('role', 'radio');
      b.disabled = !free; b.setAttribute('aria-checked', service && service.id === s.id ? 'true' : 'false');
      b.innerHTML = '<strong>' + s.name + '</strong><span>' + (free ? s.blurb + '. ' + s.time + '.' : 'Booked at this time') + '</span>';
      b.addEventListener('click', function () { service = s; renderServiceList(); });
      box.appendChild(b);
    });
    $('to-form').disabled = !service;
  }
  function hideAllSteps() { $('s-time').hidden = true; $('s-service').hidden = true; form.hidden = true; $('apptbar').hidden = true; document.querySelector('.c-steps').hidden = true; }
  function showTimeStep() {
    hideAllSteps(); $('s-time').hidden = false;
    $('s-time').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function showServiceStep() {
    hideAllSteps(); $('s-service').hidden = false;
    $('c-title').textContent = bookingMode ? 'Reserve your session' : 'Consent form';
    $('service-help').textContent = bookingMode ? slotText() + '. Each service has its own consent form.' : 'Each service has its own consent form.';
    $('service-stepper').hidden = !bookingMode; $('back-time').hidden = !bookingMode;
    renderServiceList();
    $('s-service').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function showFormStep() {
    if (!form.dataset.service || form.dataset.service !== service.id) { renderService(service); form.dataset.service = service.id; }
    hideAllSteps(); form.hidden = false; $('apptbar').hidden = false;
    document.querySelector('.c-steps').hidden = false;
    $('apptbar-label').textContent = bookingMode ? serviceLabel() + ', ' + slotText() : 'Consent form for ' + serviceLabel();
    $('change-time').hidden = !bookingMode;
    resize();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('to-form').addEventListener('click', showFormStep);
  $('back-time').addEventListener('click', showTimeStep);
  $('change-service').addEventListener('click', showServiceStep);
  $('change-time').addEventListener('click', showTimeStep);
  if (bookingMode) {
    document.title = 'Reserve a Session | OxyLux Solutions';
    $('c-title').textContent = 'Reserve your session';
    $('c-lede').textContent = 'Choose a day, time and service, then complete the consent form for that service. It takes about 10 minutes, and your appointment is confirmed as soon as you sign.';
    $('days-prev').addEventListener('click', function () { dayStart = Math.max(0, dayStart - DAYS_SHOWN); renderDays(); });
    $('days-next').addEventListener('click', function () { dayStart += DAYS_SHOWN; renderDays(); });
    $('to-consent').addEventListener('click', function () {
      if (wantService && openServices().indexOf(wantService) !== -1) {
        service = SERVICES.filter(function (s) { return s.id === wantService; })[0];
        showFormStep();
      } else showServiceStep();
    });
    hideAllSteps(); $('s-time').hidden = false;
    loadSlots();
  } else if (wantService) {
    service = SERVICES.filter(function (s) { return s.id === wantService; })[0];
    showFormStep();
  } else showServiceStep();

  // ---------- Validation and submit ----------
  var submitting = false;
  function formData() {
    var out = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.name === 'website' || el.type === 'button' || el.type === 'submit') return;
      if (el.type === 'checkbox') { if (el.name === 'esign') out.esign = el.checked; else if (el.checked) (out[el.name] = out[el.name] || []).push(el.value); }
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else out[el.name] = el.value;
    });
    groups.forEach(function (g) { out[g] = out[g] || []; });
    if (service.id === 'iv' && drip) out.drip = drip;
    return out;
  }
  function screening() {
    return service.screens.map(function (g) { return { title: g.title, selected: checked(g.name) }; })
      .concat({ title: service.contra.title, selected: checked('contra') });
  }
  function pdfOptions() {
    return {
      margin: [12, 12, 14, 12], filename: fileName(),
      image: { type: 'jpeg', quality: 0.9 },
      html2canvas: { scale: 1.8, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
  }
  function showDone(sent) {
    form.hidden = true; $('apptbar').hidden = true;
    document.querySelector('.c-steps').hidden = true;
    $('done-name').textContent = form.name.value.trim().split(/\s+/)[0];
    if (bookingMode) {
      $('done-title').textContent = 'You’re booked';
      $('done-text').innerHTML = 'Thank you, ' + esc(form.name.value.trim().split(/\s+/)[0]) + '. Your appointment is confirmed and your signed consent form is on file with OxyLux.';
      $('done-when').textContent = slotText();
      $('done-appt').hidden = false; $('ics').hidden = false;
    } else if (!sent) {
      $('done-text').innerHTML = 'Thank you, ' + esc(form.name.value.trim().split(/\s+/)[0]) + '. We could not send your form online, so please download it and bring it to your visit, or email it to <a href="mailto:frontdesk@oxyluxsolutions.com">frontdesk@oxyluxsolutions.com</a>.';
    }
    $('done').hidden = false; $('done').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return;
    var bad = validate(), err = $('form-error');
    if (bad.length) {
      err.hidden = false;
      err.textContent = bad.length === 1 ? 'One item still needs your attention. It is highlighted above.' : bad.length + ' items still need your attention. They are highlighted above.';
      bad[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      var focusable = bad[0].matches('input, textarea') ? bad[0] : bad[0].querySelector('input, textarea');
      if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 400);
      return;
    }
    if (bookingMode && !(slot && slot.time)) { showTimeStep(); return; }
    err.hidden = true;
    buildRecord();
    var btn = $('submit-btn'), label = btn.textContent;
    submitting = true; btn.disabled = true; btn.textContent = 'Submitting your signed form…';
    var finish = function () { submitting = false; btn.disabled = false; btn.textContent = label; };
    if (!window.html2pdf) { finish(); err.hidden = false; err.textContent = 'The page did not finish loading. Check your connection and try again.'; return; }
    window.html2pdf().set(pdfOptions()).from($('record').firstElementChild).outputPdf('datauristring').then(function (pdf) {
      return fetch('/api/book', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: bookingId, slot: bookingMode ? slot : null, service: service.id, screening: screening(), form: formData(), pdf: pdf, website: form.website.value })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); });
    }).then(function (res) {
      finish();
      if (res.status === 201) return showDone(true);
      if (res.status === 409 && bookingMode) {
        err.hidden = false; err.textContent = res.body.error;
        loadSlots(false).then(showTimeStep);
        return;
      }
      if (!bookingMode) return showDone(false);
      err.hidden = false;
      err.textContent = (res.body && res.body.error) || 'We could not complete your booking. Please try again or call (305) 205-2738.';
    }).catch(function () {
      finish();
      if (!bookingMode) return showDone(false);
      err.hidden = false; err.textContent = 'We could not reach OxyLux. Check your connection and try again, or call (305) 205-2738.';
    });
  });

  // ---------- Signed record (PDF + print) ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(v) { if (!v) return ''; var d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  var signedAt;
  function buildRecord() {
    var f = form, v = function (n) { return esc(f[n].value.trim()); };
    signedAt = new Date();
    var rows = [
      ['Service', esc(serviceLabel())], ['Full legal name', v('name')], ['Date', fmtDate(f.date.value)],
    ].concat(bookingMode && slot ? [['Appointment', esc(slotText())]] : []).concat([
      ['Address', v('address') + ', ' + v('city') + ', ' + v('state') + ' ' + v('zip')],
      ['Phone', v('phone')], ['Email', v('email')],
      ['Date of birth / age', fmtDate(f.dob.value) + ' / ' + v('age')],
      ['Height / weight', v('height') + ' / ' + v('weight')],
      ['Referred by', v('referral') || '—'], ['How they heard about us', v('heard') || '—'],
      ['Emergency contact', v('ec_name') + ', ' + v('ec_phone')]
    ]);
    var health = [
      ['Current medications', v('medications')], ['Allergies', v('allergies')],
      ['Under medical care', esc(f.care.value) + (f.care.value === 'Yes' ? ': ' + v('care_detail') : '')],
    ].concat(service.screens.map(function (g) { return [g.title, esc(checked(g.name).join(', '))]; })).concat([
      ['Contraindications', esc(checked('contra').join(', '))]
    ]);
    var acks = Array.prototype.map.call(form.querySelectorAll('.c-ack'), function (a) {
      var h = a.querySelector('h3'), i = a.querySelector('.c-initial input');
      var text = Array.prototype.map.call(a.querySelectorAll('p'), function (p) { return esc(p.textContent.replace(/\s+/g, ' ').trim()); }).join(' ');
      if (!h) text = 'I reviewed the conditions listed for this treatment. Selected: ' + esc(checked('contra').join(', ')) + '.';
      return '<div class="ack"><div><strong>' + esc(h ? h.textContent : 'Contraindications') + '</strong><p>' + text + '</p></div><b>' + esc(i.value) + '</b></div>';
    }).join('');
    var legal = Array.prototype.map.call(document.querySelectorAll('.c-legal p'), function (p) { return '<p>' + esc(p.textContent.replace(/\s+/g, ' ').trim()) + '</p>'; }).join('');
    var table = function (r) { return '<table>' + r.map(function (x) { return '<tr><td class="k">' + x[0] + '</td><td>' + x[1] + '</td></tr>'; }).join('') + '</table>'; };
    $('record').innerHTML =
      '<div class="rec">' +
      '<div class="rec-head"><img src="/assets/logo-clear.png" alt="OxyLux Solutions"><div><h1>' + esc(service.formTitle) + '</h1><p>OxyLux Solutions · Signed electronically</p></div></div>' +
      '<h2>Client information</h2>' + table(rows) +
      '<h2>Health history</h2>' + table(health) +
      '<h2>Acknowledgments (initialed)</h2>' + acks +
      '<h2>Waiver and consent to treatment</h2><div class="legal">' + legal + '</div>' +
      '<div class="sig"><div><img src="' + signatureImage() + '" alt="Signature"><div>Signature</div></div>' +
      '<div><div><b>' + v('sig_name') + '</b></div><div>Printed name</div></div>' +
      '<div><div><b>' + fmtDate(f.sig_date.value) + '</b></div><div>Date</div></div></div>' +
      '<p class="meta">Electronic signature recorded ' + esc(signedAt.toLocaleString('en-US')) + '. The signer agreed that their electronic signature is the legal equivalent of their handwritten signature.</p>' +
      '</div>';
  }

  function fileName() {
    var last = form.name.value.trim().split(/\s+/).pop().replace(/[^A-Za-z-]/g, '') || 'Client';
    return 'OxyLux-' + service.id + '-Consent-' + last + '-' + today() + '.pdf';
  }

  $('dl-pdf').addEventListener('click', function () {
    var status = $('pdf-status'), btn = this;
    if (!window.html2pdf) { status.textContent = 'The PDF tool did not load. Use Print and choose “Save as PDF” instead.'; return; }
    btn.disabled = true; status.textContent = 'Preparing your PDF…';
    var el = $('record').firstElementChild;
    window.html2pdf().set(pdfOptions()).from(el).save().then(function () {
      status.textContent = 'Downloaded ' + fileName() + '.'; btn.disabled = false;
    }).catch(function () {
      status.textContent = 'The PDF could not be created. Use Print and choose “Save as PDF” instead.'; btn.disabled = false;
    });
  });
  $('print').addEventListener('click', function () { window.print(); });
  $('ics').addEventListener('click', function () {
    if (!slot) return;
    var start = slot.date.replace(/-/g, '') + 'T' + slot.time.replace(':', '') + '00';
    var endMin = (+slot.time.slice(0, 2)) * 60 + (+slot.time.slice(3)) + 90;
    var end = slot.date.replace(/-/g, '') + 'T' + String(Math.floor(endMin / 60)).padStart(2, '0') + String(endMin % 60).padStart(2, '0') + '00';
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//OxyLux Solutions//Booking//EN', 'BEGIN:VEVENT',
      'UID:' + start + '-' + Math.random().toString(36).slice(2) + '@oxyluxsolutions.com',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;TZID=America/New_York:' + start, 'DTEND;TZID=America/New_York:' + end,
      'SUMMARY:' + serviceLabel() + ' at OxyLux Solutions', 'LOCATION:14361 Commerce Way\\, Suite 201\\, Hialeah\\, FL 33016',
      'DESCRIPTION:Please arrive 15 minutes early. Questions? Call (305) 205-2738.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = 'OxyLux-appointment.ics'; document.body.appendChild(a); a.click(); a.remove();
  });

  // Clears everything so the next client starts fresh on a shared iPad
  $('new-form').addEventListener('click', function () {
    form.reset(); strokes = []; sigTouched = false; $('record').innerHTML = '';
    service = null; delete form.dataset.service; $('care-explain').hidden = true; $('contra-warn').hidden = true;
    form.care_detail.required = false; setDates();
    $('done').hidden = true; $('done-appt').hidden = true; $('ics').hidden = true; $('pdf-status').textContent = '';
    if (bookingMode) { slot = null; loadSlots(); showTimeStep(); } else showServiceStep();
    update(); window.scrollTo({ top: 0 });
  });
})();
