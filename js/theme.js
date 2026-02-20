// js/theme.js
(function () {
  'use strict';

  // ✅ Единый ключ (новый стандарт)
  const STORAGE_KEY = 'uiTheme'; // 'light' | 'dark'

  // ✅ Поддержка легаси ключей, которые уже встречаются в проекте
  const LEGACY_KEYS = ['theme', 'ui_theme', 'uiTheme'];

  function normalizeTheme(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function readStoredTheme() {
    try {
      // 1) сначала новый ключ
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark') return v;

      // 2) затем легаси
      for (const k of LEGACY_KEYS) {
        const vv = localStorage.getItem(k);
        if (vv === 'light' || vv === 'dark') return vv;
      }
    } catch (_) {}
    return null;
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);

      // ✅ чтобы старые страницы/код тоже не ломались
      localStorage.setItem('theme', theme);
      localStorage.setItem('ui_theme', theme);
    } catch (_) {}
  }

  function applyThemeToDom(theme) {
    const t = normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', t);

    // Telegram WebApp colors (приятно, но не критично)
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        if (t === 'light') {
          tg.setHeaderColor('#F7F7FB');
          tg.setBackgroundColor('#F7F7FB');
        } else {
          tg.setHeaderColor('#0A0A0C');
          tg.setBackgroundColor('#0A0A0C');
        }
      }
    } catch (_) {}
  }

  function setActiveButtons(theme) {
    const t = normalizeTheme(theme);
    const lightBtn = document.getElementById('theme-btn-light');
    const darkBtn = document.getElementById('theme-btn-dark');
    if (!lightBtn || !darkBtn) return;

    lightBtn.classList.toggle('active', t === 'light');
    darkBtn.classList.toggle('active', t === 'dark');

    // удобнее для a11y / css
    lightBtn.setAttribute('aria-selected', t === 'light' ? 'true' : 'false');
    darkBtn.setAttribute('aria-selected', t === 'dark' ? 'true' : 'false');
  }

  // ✅ Публичное API
  window.setAppTheme = function (theme) {
    const t = normalizeTheme(theme);
    writeStoredTheme(t);
    applyThemeToDom(t);
    setActiveButtons(t);

    // haptic
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch (_) {}
  };

  // ✅ Удобный toggle для UI (иконка/кнопка на страницах)
  window.toggleTheme = function () {
    const current = readStoredTheme() || document.documentElement.getAttribute('data-theme') || 'dark';
    const next = normalizeTheme(current) === 'dark' ? 'light' : 'dark';
    window.setAppTheme(next);
  };

  // ✅ 1) Применяем тему максимально рано (без вспышки)
  const initial = readStoredTheme() || 'dark';
  applyThemeToDom(initial);

  // ✅ 2) На DOM ready — активируем кнопки и обработчики (если они есть)
  document.addEventListener('DOMContentLoaded', function () {
    const current = readStoredTheme() || initial || 'dark';
    applyThemeToDom(current);
    setActiveButtons(current);

    const lightBtn = document.getElementById('theme-btn-light');
    const darkBtn = document.getElementById('theme-btn-dark');

    if (lightBtn) lightBtn.addEventListener('click', () => window.setAppTheme('light'));
    if (darkBtn) darkBtn.addEventListener('click', () => window.setAppTheme('dark'));
  });

  // ✅ 3) Синхронизация между вкладками/страницами
  window.addEventListener('storage', function (e) {
    if (!e) return;
    if (e.key !== STORAGE_KEY && !LEGACY_KEYS.includes(e.key)) return;

    const t = (e.newValue === 'light' || e.newValue === 'dark')
      ? e.newValue
      : (readStoredTheme() || 'dark');

    applyThemeToDom(t);
    setActiveButtons(t);
  });
})();
