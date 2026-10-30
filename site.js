// OxyLux Solutions — shared behavior
(function () {
  document.querySelectorAll('.yr').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  function store(key, val) { try { return val === undefined ? sessionStorage.getItem(key) : sessionStorage.setItem(key, val); } catch (e) { return null; } }

  // Logo intro: plays on every arrival or refresh, not when moving between pages; click or tap skips it. The fade-out itself is CSS, so it can never get stuck.
  var intro = document.getElementById('intro');
  var introPlaying = intro && !document.documentElement.classList.contains('no-intro');
  if (introPlaying) {
    intro.addEventListener('click', function () { intro.classList.add('is-done'); });
    intro.addEventListener('animationend', function (e) { if (e.target === intro) intro.classList.add('is-done'); });
  }

  // Opening announcement: once per visit, ends after opening day (Nov 2, Eastern).
  if (new Date() < new Date('2026-11-03T05:00:00Z') && !store('oxl-opening')) {
    setTimeout(function () {
      if (typeof HTMLDialogElement === 'undefined') return;
      var d = document.createElement('dialog');
      d.className = 'opening'; d.setAttribute('aria-labelledby', 'opening-title');
      d.innerHTML = '<button class="opening-close" type="button" aria-label="Close">×</button><div class="opening-body">' +
        '<img src="/assets/emblem.webp" alt="" width="256" height="198"><h2 id="opening-title">Opening November 2</h2>' +
        '<p>OxyLux Solutions opens its doors in Hialeah on Monday, November 2. Reserve your first visit today.</p>' +
        '<a class="btn" href="/reserve">Reserve now</a></div>';
      document.body.appendChild(d);
      var close = function () { d.close(); };
      d.querySelector('.opening-close').addEventListener('click', close);
      d.addEventListener('click', function (e) { if (e.target === d) close(); });
      d.tabIndex = -1;
      d.showModal();
      d.focus();
      store('oxl-opening', '1');
    }, introPlaying ? 3300 : 900);
  }

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // Contact form: composes an email to the front desk (no health details).
  var form = document.getElementById('booking');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('booking-msg');
      var missing = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (f) { return !f.value || !f.checkValidity(); });
      if (missing.length) {
        msg.textContent = 'Fill in your name, phone and a valid email so we can reach you.';
        missing[0].focus();
        return;
      }
      var d = new FormData(form);
      var body = 'Name: ' + d.get('name') + '\nPhone: ' + d.get('phone') + '\nEmail: ' + d.get('email') +
        '\nTopic: ' + d.get('interest') + '\nMessage: ' + d.get('message');
      window.location.href = 'mailto:frontdesk@oxyluxsolutions.com?subject=' + encodeURIComponent('Website message from ' + d.get('name')) + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Your email app is opening with your message. Send it and we’ll reply within one business day.';
    });
  }
})();
