// js/profile.js

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  updateStats();
});

function updateStats() {
  const history = getHistory();
  const totalEl = document.getElementById('total-count');
  const listEl = document.getElementById('history-list');

  totalEl.innerText = history.length;

  if (history.length > 0) {
    listEl.innerHTML = '';
    // Показываем последние 5
    const lastFive = history.slice(-5).reverse();
    
    lastFive.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card'; // используем стиль карточки
      card.style.cursor = 'default';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="card-title">${item.name}</div>
          <div style="font-size:0.8rem; color:var(--hint-color);">${formatDate(item.date)}</div>
        </div>
      `;
      listEl.appendChild(card);
    });
  }
}

function formatDate(dateStr) {
  const options = { day: 'numeric', month: 'short' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options);
}

function resetStats() {
  if (confirm('Вы уверены, что хотите сбросить всю статистику?')) {
    clearHistory();
    updateStats();
  }
}
