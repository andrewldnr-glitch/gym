// js/training.js

let currentTrainingData = null;

document.addEventListener('DOMContentLoaded', async () => {
  initApp();

  const params = new URLSearchParams(window.location.search);
  const trainingId = parseInt(params.get('id'));
  const level = params.get('level'); // Нужно для потенциальной навигации назад, но берем по ID

  if (!trainingId) {
    window.location.href = 'index.html';
    return;
  }

  const data = await loadTrainingsData();
  if (!data) return;

  // Ищем тренировку по ID во всех уровнях (для надежности)
  let foundTraining = null;
  for (let lvl in data.levels) {
    const found = data.levels[lvl].find(t => t.id === trainingId);
    if (found) {
      foundTraining = found;
      break;
    }
  }

  if (!foundTraining) {
    document.getElementById('training-name').innerText = "Ошибка";
    return;
  }

  currentTrainingData = foundTraining;
  document.getElementById('training-name').innerText = foundTraining.name;
  document.getElementById('training-desc').innerText = foundTraining.description;

  renderExercises(foundTraining.exercises);
});

function renderExercises(exercises) {
  const container = document.getElementById('exercise-list');
  container.innerHTML = '';

  exercises.forEach((ex, index) => {
    const item = document.createElement('div');
    item.className = 'exercise-item';
    item.innerHTML = `
      <div class="exercise-info">
        <div class="exercise-name">${index + 1}. ${ex.name}</div>
        <div class="exercise-stats">${ex.sets} × ${ex.reps}</div>
      </div>
      <label class="custom-checkbox">
        <input type="checkbox" onchange="checkProgress()">
        <span class="checkmark"></span>
      </label>
    `;
    container.appendChild(item);
  });
}

function checkProgress() {
  const checkboxes = document.querySelectorAll('.custom-checkbox input');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  
  const btn = document.getElementById('complete-btn');
  btn.disabled = !allChecked;
  
  // Если все выполнены, можно включить MainButton в Telegram
  if (allChecked && window.Telegram && window.Telegram.WebApp.MainButton) {
     // Можно использовать Telegram MainButton для завершения
  }
}

function completeTraining() {
  if (!currentTrainingData) return;

  saveToHistory(currentTrainingData.id, currentTrainingData.name);

  // Уведомление
  if (window.Telegram && window.Telegram.WebApp.showPopup) {
    window.Telegram.WebApp.showPopup({
      title: 'Отлично!',
      message: 'Тренировка успешно завершена и сохранена в статистику.',
      buttons: [{type: 'ok'}]
    }, () => {
      window.location.href = 'index.html';
    });
  } else {
    alert('Тренировка завершена!');
    window.location.href = 'index.html';
  }
}
