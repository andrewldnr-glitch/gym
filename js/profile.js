// js/profile.js
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  updateStats();
});

function updateStats() {
  const history = getHistory();
  document.getElementById('total-count').innerText = history.length;
  const listEl = document.getElementById('history-list');
  if (history.length > 0) {
    listEl.innerHTML = '';
    const lastFive = history.slice(-5).reverse();
    lastFive.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card'; 
      card.style.cursor = 'default';
      card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center;"><div class="card-title">'+item.name+'</div><div style="font-size:0.8rem; color:var(--text-secondary);">'+formatDate(item.date)+'</div></div>';
      listEl.appendChild(card);
    });
  }
}

function formatDate(dateStr) {
  const options = { day: 'numeric', month: 'short' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options);
}

function resetStats() {
  if (confirm('Сбросить статистику?')) { 
    clearHistory(); 
    updateStats(); 
  }
}
