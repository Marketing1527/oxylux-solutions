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

  // Booking form: no backend yet, so compose an email to the business.
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
        '\nInterested in: ' + d.get('interest') + '\nAvailability: ' + d.get('message');
      window.location.href = 'mailto:hello@oxyluxsolutions.com?subject=' + encodeURIComponent('Booking request from ' + d.get('name')) + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Your email app is opening with your request. Send it and we’ll reply within one business day.';
    });
  }
})();
