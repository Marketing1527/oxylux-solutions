// OxyLux consent form: validation, signature pad, progress and signed PDF.
// Nothing is stored in the browser or sent anywhere; the signed copy is a downloaded PDF.
(function () {
  var form = document.getElementById('consent');
  var $ = function (id) { return document.getElementById(id); };
  var groups = ['rx', 'dx', 'contra'];

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
    $('waiver-name').textContent = v || '[your name]';
    if (!sigTouched) $('f-signame').value = v;
  });

  // Initials are always uppercase
  form.querySelectorAll('.c-initial input').forEach(function (i) {
    i.addEventListener('input', function () { var p = i.selectionStart; i.value = i.value.toUpperCase().replace(/[^A-Z.\- ]/g, ''); i.setSelectionRange(p, p); });
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
  groups.forEach(function (g) {
    var boxes = form.querySelectorAll('input[name="' + g + '"]');
    boxes.forEach(function (b) {
      b.addEventListener('change', function () {
        var isNone = b.closest('.c-none');
        if (!b.checked) return;
        boxes.forEach(function (o) {
          if (o === b) return;
          if (isNone ? true : o.closest('.c-none')) o.checked = false;
        });
      });
    });
  });
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

  // ---------- Validation and submit ----------
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

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate(), err = $('form-error');
    if (bad.length) {
      err.hidden = false;
      err.textContent = bad.length === 1 ? 'One item still needs your attention. It is highlighted above.' : bad.length + ' items still need your attention. They are highlighted above.';
      bad[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      var focusable = bad[0].matches('input, textarea') ? bad[0] : bad[0].querySelector('input, textarea');
      if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 400);
      return;
    }
    err.hidden = true;
    buildRecord();
    form.hidden = true;
    document.querySelector('.c-steps').hidden = true;
    $('done-name').textContent = form.name.value.trim().split(/\s+/)[0];
    $('done').hidden = false;
    $('done').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ---------- Signed record (PDF + print) ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtDate(v) { if (!v) return ''; var d = new Date(v + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  var signedAt;
  function buildRecord() {
    var f = form, v = function (n) { return esc(f[n].value.trim()); };
    signedAt = new Date();
    var rows = [
      ['Full legal name', v('name')], ['Date', fmtDate(f.date.value)],
      ['Address', v('address') + ', ' + v('city') + ', ' + v('state') + ' ' + v('zip')],
      ['Phone', v('phone')], ['Email', v('email')],
      ['Date of birth / age', fmtDate(f.dob.value) + ' / ' + v('age')],
      ['Height / weight', v('height') + ' / ' + v('weight')],
      ['Referred by', v('referral') || '—'], ['How they heard about us', v('heard') || '—'],
      ['Emergency contact', v('ec_name') + ', ' + v('ec_phone')]
    ];
    var health = [
      ['Current medications', v('medications')], ['Allergies', v('allergies')],
      ['Under medical care', esc(f.care.value) + (f.care.value === 'Yes' ? ': ' + v('care_detail') : '')],
      ['Bleomycin / Disulfiram / Mafenide acetate', esc(checked('rx').join(', '))],
      ['Spherocytosis / sickle cell / COPD', esc(checked('dx').join(', '))],
      ['Contraindications', esc(checked('contra').join(', '))]
    ];
    var acks = Array.prototype.map.call(form.querySelectorAll('.c-ack'), function (a) {
      var h = a.querySelector('h3'), i = a.querySelector('.c-initial input');
      var text = Array.prototype.map.call(a.querySelectorAll('p'), function (p) { return esc(p.textContent.replace(/\s+/g, ' ').trim()); }).join(' ');
      if (!h) text = 'I understand I should not undergo treatment if I have any of the listed contraindications. Selected: ' + esc(checked('contra').join(', ')) + '.';
      return '<div class="ack"><div><strong>' + esc(h ? h.textContent : 'Contraindications') + '</strong><p>' + text + '</p></div><b>' + esc(i.value) + '</b></div>';
    }).join('');
    var legal = Array.prototype.map.call(document.querySelectorAll('.c-legal p'), function (p) { return '<p>' + esc(p.textContent.replace(/\s+/g, ' ').trim()) + '</p>'; }).join('');
    var table = function (r) { return '<table>' + r.map(function (x) { return '<tr><td class="k">' + x[0] + '</td><td>' + x[1] + '</td></tr>'; }).join('') + '</table>'; };
    $('record').innerHTML =
      '<div class="rec">' +
      '<div class="rec-head"><img src="/assets/logo-clear.png" alt="OxyLux Solutions"><div><h1>Hyperbaric Oxygen Therapy Consent Form</h1><p>OxyLux Solutions · Signed electronically</p></div></div>' +
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
    return 'OxyLux-Consent-' + last + '-' + today() + '.pdf';
  }

  $('dl-pdf').addEventListener('click', function () {
    var status = $('pdf-status'), btn = this;
    if (!window.html2pdf) { status.textContent = 'The PDF tool did not load. Use Print and choose “Save as PDF” instead.'; return; }
    btn.disabled = true; status.textContent = 'Preparing your PDF…';
    var el = $('record').firstElementChild;
    window.html2pdf().set({
      margin: [12, 12, 14, 12], filename: fileName(),
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(el).save().then(function () {
      status.textContent = 'Downloaded ' + fileName() + '.'; btn.disabled = false;
    }).catch(function () {
      status.textContent = 'The PDF could not be created. Use Print and choose “Save as PDF” instead.'; btn.disabled = false;
    });
  });
  $('print').addEventListener('click', function () { window.print(); });

  // Clears everything so the next client starts fresh on a shared iPad
  $('new-form').addEventListener('click', function () {
    form.reset(); strokes = []; sigTouched = false; $('record').innerHTML = '';
    $('waiver-name').textContent = '[your name]'; $('care-explain').hidden = true; $('contra-warn').hidden = true;
    form.care_detail.required = false; setDates();
    $('done').hidden = true; form.hidden = false; document.querySelector('.c-steps').hidden = false; $('pdf-status').textContent = '';
    resize(); update(); window.scrollTo({ top: 0 });
  });
})();
