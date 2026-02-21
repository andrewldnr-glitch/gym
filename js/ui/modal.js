/* ui/modal.js — единая модалка (overlay + scroll lock + ESC) */
(function () {
  function isEl(x) { return x && x.nodeType === 1; }
  function getEl(target) {
    if (!target) return null;
    if (isEl(target)) return target;
    if (typeof target === 'string') {
      return document.getElementById(target) || document.querySelector(target);
    }
    return null;
  }

  function setBodyLock(locked) {
    document.documentElement.classList.toggle('modal-open', !!locked);
    document.body.classList.toggle('modal-open', !!locked);
  }

  function anyModalOpen() {
    return !!document.querySelector('.modal-overlay.active, .modal-backdrop.active, .modal-overlay[aria-hidden="false"], .modal-backdrop[aria-hidden="false"]');
  }

  function open(target, opts) {
    const el = getEl(target);
    if (!el) return;
    el.classList.add('active');
    el.setAttribute('aria-hidden', 'false');

    // focus
    const focusSel = (opts && opts.focus) ? opts.focus : '[autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    setTimeout(() => {
      try {
        const focusEl = el.querySelector(focusSel);
        if (focusEl) focusEl.focus();
      } catch (_) {}
    }, 50);

    setBodyLock(true);
  }

  function close(target) {
    const el = getEl(target);
    if (!el) return;
    el.classList.remove('active');
    el.setAttribute('aria-hidden', 'true');
    // unlock only if nothing else is open
    if (!anyModalOpen()) setBodyLock(false);
  }

  function closeTopMost() {
    const opened = Array.from(document.querySelectorAll('.modal-overlay.active, .modal-backdrop.active, .modal-overlay[aria-hidden="false"], .modal-backdrop[aria-hidden="false"]'));
    if (!opened.length) return;
    close(opened[opened.length - 1]);
  }

  // click on backdrop closes (only if click exactly on overlay/backdrop)
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;
    if (t.classList && (t.classList.contains('modal-overlay') || t.classList.contains('modal-backdrop'))) {
      close(t);
    }
  });

  // ESC closes
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!anyModalOpen()) return;
    e.preventDefault();
    closeTopMost();
  });

  // expose
  window.UIModal = { open, close, anyModalOpen };
})();
