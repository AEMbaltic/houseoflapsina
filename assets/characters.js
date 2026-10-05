(function () {
  'use strict';

  const ids = ['girl', 'guy', 'fox'];
  const key = 'lapsina:character';
  let chosen = 'girl';
  try {
    const saved = localStorage.getItem(key);
    if (ids.includes(saved)) chosen = saved;
  } catch (_) { /* Storage may be unavailable in private browsing. */ }
  window.galleryCharacter = chosen;

  const overlay = document.getElementById('characterSelect');
  const options = Array.from(overlay.querySelectorAll('[data-character]'));
  const confirm = document.getElementById('confirmCharacter');
  const cancel = document.getElementById('cancelCharacter');
  const toggle = document.getElementById('characterBtn');
  let pending = chosen;
  let entering = false;
  let previousFocus = null;

  function update(focus) {
    options.forEach(function (button) {
      const active = button.dataset.character === pending;
      button.setAttribute('aria-pressed', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
  }

  function icon() {
    const canvas = document.getElementById('characterIcon');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.drawCharacter(ctx, 12, 25, 'down', 0, false);
    toggle.setAttribute('aria-label', 'Choose character. Current: ' + chosen);
  }

  window.openCharacterSelect = function (firstVisit) {
    entering = !!firstVisit;
    pending = chosen;
    previousFocus = document.activeElement;
    window.__choosingCharacter = true;
    window.dispatchEvent(new Event('blur'));
    overlay.hidden = false;
    document.getElementById('app').inert = true;
    confirm.textContent = entering ? 'Enter gallery' : 'Continue exploring';
    cancel.hidden = entering;
    update(true);
  };

  function close(save) {
    if (save) {
      chosen = pending;
      window.galleryCharacter = chosen;
      try { localStorage.setItem(key, chosen); } catch (_) { /* private browsing */ }
      icon();
    }
    overlay.hidden = true;
    document.getElementById('app').inert = false;
    window.__choosingCharacter = false;
    if (entering) {
      window.__boot = false;
      window.dispatchEvent(new CustomEvent('lapsina:start'));
    } else if (previousFocus) previousFocus.focus();
  }

  options.forEach(function (button) {
    button.addEventListener('click', function () { pending = button.dataset.character; update(true); });
  });
  confirm.addEventListener('click', function () { close(true); });
  cancel.addEventListener('click', function () { close(false); });
  toggle.addEventListener('click', function () { window.openCharacterSelect(false); });

  overlay.addEventListener('keydown', function (event) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      pending = ids[(ids.indexOf(pending) + delta + ids.length) % ids.length];
      update(true);
    } else if (event.key === 'Enter' || event.key === ' ') {
      // Consume the event before revealing the game underneath.
      event.preventDefault();
      event.stopPropagation();
      if (event.target === cancel) close(false);
      else close(true);
    } else if (event.key === 'Escape' && !entering) {
      event.preventDefault();
      event.stopPropagation();
      close(false);
    } else if (event.key === 'Tab') {
      const focusable = [options[ids.indexOf(pending)], confirm];
      if (!entering) focusable.push(cancel);
      const current = focusable.indexOf(document.activeElement);
      event.preventDefault();
      focusable[(current + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
    }
  });
  icon();
})();
