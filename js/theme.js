// js/theme.js
(function () {
  const STORAGE_KEY = "fitgym_theme";
  const THEMES = ["light", "dark"];

  function getSavedTheme() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return THEMES.includes(v) ? v : null;
    } catch (_) {
      return null;
    }
  }

  function getSystemTheme() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch (_) {
      return "dark";
    }
  }

  function setThemeAttr(theme) {
    // ставим и на <html>, и на <body> — чтобы CSS точно сработал при любой схеме селекторов
    document.documentElement.setAttribute("data-theme", theme);
    if (document.body) document.body.setAttribute("data-theme", theme);
  }

  function persistTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  function markActiveButtons(theme) {
    // 1) Рекомендуемый формат: data-theme-btn="light|dark"
    document.querySelectorAll("[data-theme-btn]").forEach(btn => {
      const t = btn.getAttribute("data-theme-btn");
      btn.classList.toggle("active", t === theme);
      btn.setAttribute("aria-pressed", t === theme ? "true" : "false");
    });

    // 2) Поддержка альтернативных/старых вариантов разметки (если у тебя уже так)
    const lightBtn = document.getElementById("theme-light");
    const darkBtn = document.getElementById("theme-dark");
    if (lightBtn && darkBtn) {
      lightBtn.classList.toggle("active", theme === "light");
      darkBtn.classList.toggle("active", theme === "dark");
      lightBtn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      darkBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function applyTheme(theme, { save = true } = {}) {
    const t = THEMES.includes(theme) ? theme : "dark";
    setThemeAttr(t);
    markActiveButtons(t);
    if (save) persistTheme(t);

    // приятная микро-анимация (можно убрать)
    try {
      document.documentElement.classList.add("theme-transition");
      window.setTimeout(() => document.documentElement.classList.remove("theme-transition"), 200);
    } catch (_) {}
  }

  function attachClickHandlers() {
    // Универсально: слушаем клики по кнопкам
    document.addEventListener("click", (e) => {
      const target = e.target && e.target.closest ? e.target.closest("[data-theme-btn]") : null;
      if (target) {
        const t = target.getAttribute("data-theme-btn");
        if (THEMES.includes(t)) applyTheme(t, { save: true });
      }

      // поддержка id theme-light/theme-dark, если они у тебя есть
      const t2 = e.target && e.target.closest ? e.target.closest("#theme-light, #theme-dark") : null;
      if (t2) {
        applyTheme(t2.id === "theme-light" ? "light" : "dark", { save: true });
      }
    });
  }

  function init() {
    const saved = getSavedTheme();
    const initial = saved || getSystemTheme();
    applyTheme(initial, { save: !!saved }); // если темы не было — не записываем сразу, чтобы можно было “системную”
    attachClickHandlers();

    // если пользователь НЕ выбирал тему вручную — реагируем на системную
    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", () => {
        const savedNow = getSavedTheme();
        if (!savedNow) applyTheme(getSystemTheme(), { save: false });
      });
    } catch (_) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // экспорт для отладки (не обязателен)
  window.__fitgymTheme = { applyTheme };
})();
