/* js/theme-preload.js
   Tiny preloader to avoid flash of wrong theme.
   Runs BEFORE CSS loads.
*/
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
      // Helps native form controls match theme.
      document.documentElement.style.colorScheme = t;
    }
  } catch (_) {}
})();
