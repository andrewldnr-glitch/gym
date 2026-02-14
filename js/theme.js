// js/theme.js
(function () {
  const STORAGE_KEY = "uiTheme"; // "light" | "dark"

  function applyTheme(theme) {
    const t = (theme === "light") ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);

    // Если внутри Telegram — подстроим цвета WebApp (не обязательно, но приятно)
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        if (t === "light") {
          tg.setHeaderColor("#F7F7FB");
          tg.setBackgroundColor("#F7F7FB");
        } else {
          tg.setHeaderColor("#0A0A0C");
          tg.setBackgroundColor("#0A0A0C");
        }
      }
    } catch (_) {}
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
  }

  function setActiveButton(theme) {
    const lightBtn = document.getElementById("theme-btn-light");
    const darkBtn = document.getElementById("theme-btn-dark");
    if (!lightBtn || !darkBtn) return;

    const isLight = theme === "light";
    lightBtn.classList.toggle("active", isLight);
    darkBtn.classList.toggle("active", !isLight);
  }

  // Публичное API (если понадобится)
  window.setAppTheme = function (theme) {
    const t = (theme === "light") ? "light" : "dark";
    saveTheme(t);
    applyTheme(t);
    setActiveButton(t);
  };

  // Инициализация
  document.addEventListener("DOMContentLoaded", function () {
    const saved = getSavedTheme();
    const theme = (saved === "light" || saved === "dark") ? saved : "dark";

    applyTheme(theme);
    setActiveButton(theme);

    const lightBtn = document.getElementById("theme-btn-light");
    const darkBtn = document.getElementById("theme-btn-dark");

    if (lightBtn) {
      lightBtn.addEventListener("click", function () {
        window.setAppTheme("light");
      });
    }

    if (darkBtn) {
      darkBtn.addEventListener("click", function () {
        window.setAppTheme("dark");
      });
    }
  });
})();
