// OxyLux Solutions — shared behavior
(function () {
  document.querySelectorAll('.yr').forEach(function (el) { el.textContent = new Date().getFullYear(); });

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
