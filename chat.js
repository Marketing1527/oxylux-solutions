// Help button and chat. Conversation stays in this page only; nothing is saved in the browser.
(function () {
  var history = [], busy = false;
  var root = document.createElement('div');
  root.className = 'help';
  root.innerHTML =
    '<button class="help-btn" type="button" aria-expanded="false" aria-controls="help-panel">Help</button>' +
    '<section class="help-panel" id="help-panel" role="dialog" aria-label="OxyLux help chat" hidden>' +
      '<header class="help-head"><div><strong>OxyLux help</strong><span>Ask a question or book a visit</span></div>' +
      '<button class="help-close" type="button" aria-label="Close chat">×</button></header>' +
      '<div class="help-log" id="help-log" role="log" aria-live="polite"></div>' +
      '<form class="help-form"><label class="skip" for="help-input">Your message</label>' +
      '<input class="help-hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<textarea id="help-input" rows="1" maxlength="1000" placeholder="Type your message"></textarea>' +
      '<button class="btn" type="submit">Send</button></form>' +
      '<p class="help-note">This is an AI assistant. Please don’t share medical details here. In an emergency, call 911.</p>' +
    '</section>';
  document.body.appendChild(root);

  var btn = root.querySelector('.help-btn'), panel = root.querySelector('.help-panel'), log = root.querySelector('.help-log');
  var form = root.querySelector('.help-form'), input = root.querySelector('textarea');

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function linkify(s) {
    return esc(s)
      .replace(/https:\/\/www\.oxyluxsolutions\.com[^\s<)]*/g, function (u) { return '<a href="' + u + '">' + (u.indexOf('consent.html') !== -1 ? 'Sign your consent form' : u) + '</a>'; })
      .replace(/\(305\) 205-2738/g, '<a href="tel:+13052052738">(305) 205-2738</a>');
  }
  function add(role, text) {
    var p = document.createElement('p');
    p.className = 'help-msg ' + role;
    p.innerHTML = linkify(text);
    log.appendChild(p); log.scrollTop = log.scrollHeight;
    return p;
  }
  function toggle(open) {
    panel.hidden = !open; btn.hidden = open; btn.setAttribute('aria-expanded', open);
    if (open) {
      if (!log.children.length) add('bot', 'Hi, welcome to OxyLux. I can answer questions about our services or book an appointment for you. How can I help?');
      input.focus();
    } else btn.focus();
  }
  btn.addEventListener('click', function () { toggle(true); });
  root.querySelector('.help-close').addEventListener('click', function () { toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    busy = true; input.value = '';
    add('me', text);
    history.push({ role: 'user', content: text });
    var wait = add('bot typing', 'Typing…');
    fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, website: form.website.value }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        wait.remove();
        var reply = res.ok && res.body.reply ? res.body.reply : 'Chat isn’t available right now. Please call us at (305) 205-2738 or email frontdesk@oxyluxsolutions.com.';
        add('bot', reply);
        if (res.ok) history.push({ role: 'assistant', content: reply }); else history.pop();
      })
      .catch(function () { wait.remove(); history.pop(); add('bot', 'We couldn’t connect. Check your connection, or call us at (305) 205-2738.'); })
      .then(function () { busy = false; input.focus(); });
  });
})();
