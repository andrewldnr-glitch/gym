(function(){
  const NAV = [
    { href: 'index.html',      label: 'Главная',     key: 'home', icon: 'home' },
    { href: 'trainings.html',  label: 'Тренировки',  key: 'trainings', icon: 'bolt' },
    { href: 'courses.html',    label: 'Курсы',       key: 'courses', icon: 'layers' },
    { href: 'profile.html',    label: 'Профиль',     key: 'profile', icon: 'user' },
  ];

  const ICONS = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z"/>
    </svg>`,
    bolt: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
      <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/>
    </svg>`,
    layers: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
      <path d="M12 2 2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21a8 8 0 0 1 16 0"/>
    </svg>`
  };

  function normalizePath(p){
    try{
      const url = new URL(p, window.location.origin);
      return url.pathname.split('/').pop() || 'index.html';
    }catch(_){
      return (p || '').split('/').pop();
    }
  }

  function render(){
    const existing = document.querySelector('.bottom-nav');
    if (existing) existing.remove();

    const current = normalizePath(window.location.href);
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', 'Нижняя навигация');

    const inner = document.createElement('div');
    inner.className = 'bottom-nav__inner';

    NAV.forEach(item => {
      const a = document.createElement('a');
      a.className = 'bottom-nav__link';
      a.href = item.href;
      a.innerHTML = `${ICONS[item.icon] || ''}<span>${item.label}</span>`;
      if (normalizePath(item.href) === current) a.setAttribute('aria-current','page');
      inner.appendChild(a);
    });

    nav.appendChild(inner);
    document.body.appendChild(nav);
  }

  document.addEventListener('DOMContentLoaded', render);
})();
