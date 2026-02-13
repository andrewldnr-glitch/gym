// js/trainings.js

document.addEventListener('DOMContentLoaded', async () => {
  initApp();
  
  // Получаем параметр level из URL
  const params = new URLSearchParams(window.location.search);
  const level = params.get('level');

  if (!level) {
    window.location.href = 'index.html';
    return;
  }

  // Маппинг для заголовков
  const titles = {
    'beginner': 'Новичок',
    'intermediate': 'Средний уровень',
    'advanced': 'Продвинутый'
  };
  document.getElementById('page-title').innerText = titles[level] || 'Тренировки';

  // Загрузка данных
  const data = await loadTrainingsData();
  if (!data || !data.levels[level]) {
    document.getElementById('training-list').innerHTML = '<p>Нет доступных тренировок.</p>';
    return;
  }

  const trainings = data.levels[level];
  const container = document.getElementById('training-list');

  trainings.forEach(training => {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `training.html?id=${training.id}&level=${level}`;
    
    const count = training.exercises.length;
    
    card.innerHTML = `
      <div class="card-title">${training.name}</div>
      <div class="card-desc">${training.description}</div>
      <div class="card-badge">${count} упражнений</div>
    `;
    container.appendChild(card);
  });
});
