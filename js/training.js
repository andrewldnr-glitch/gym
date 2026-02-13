// js/training.js

// Конфигурация
const EXERCISE_TIME = 30; // Время на упражнение (сек)
const REST_TIME = 20;     // Время отдыха (сек)

let currentTrainingData = null;
let exercisesList = [];
let currentExerciseIndex = 0;
let timerInterval = null;
let currentMode = 'intro'; // intro, exercise, rest, finish

// Элементы DOM
const screens = {
    intro: document.getElementById('screen-intro'),
    workout: document.getElementById('screen-workout'),
    finish: document.getElementById('screen-finish')
};

document.addEventListener('DOMContentLoaded', async () => {
  initApp();

  // 1. Загрузка данных
  const params = new URLSearchParams(window.location.search);
  const trainingId = parseInt(params.get('id'));
  
  if (!trainingId) { window.location.href = 'index.html'; return; }

  const data = await loadTrainingsData();
  if (!data) return;

  // Поиск тренировки
  for (let lvl in data.levels) {
    const found = data.levels[lvl].find(t => t.id === trainingId);
    if (found) { currentTrainingData = found; break; }
  }

  if (!currentTrainingData) { 
    document.getElementById('training-name-intro').innerText = "Ошибка"; 
    return; 
  }

  // 2. Рендер Интро-экрана
  document.getElementById('training-name-intro').innerText = currentTrainingData.name;
  document.getElementById('training-desc-intro').innerText = currentTrainingData.description;
  
  exercisesList = currentTrainingData.exercises;
  const introList = document.getElementById('intro-list');
  
  exercisesList.forEach((ex, index) => {
    const item = document.createElement('div');
    item.className = 'intro-exercise-item';
    item.innerHTML = `
      <div class="intro-number">${index + 1}</div>
      <div class="intro-name">${ex.name}</div>
      <div class="intro-meta">${ex.sets} × ${ex.reps}</div>
    `;
    introList.appendChild(item);
  });

  // Показываем кнопку "Назад"
  document.getElementById('btn-back-main').style.display = 'inline-flex';
});

// 3. Старт тренировки
function startWorkout() {
  currentExerciseIndex = 0;
  switchScreen('workout');
  document.getElementById('btn-back-main').style.display = 'none'; // Скрываем кнопку назад во время тренировки
  startExercise();
}

// 4. Логика упражнения
function startExercise() {
  currentMode = 'exercise';
  
  // Обновляем UI под упражнение
  const ex = exercisesList[currentExerciseIndex];
  document.getElementById('progress-text').innerText = `Упражнение ${currentExerciseIndex + 1} из ${exercisesList.length}`;
  document.getElementById('current-exercise-name').innerText = ex.name;
  document.getElementById('current-exercise-meta').innerText = `${ex.sets} × ${ex.reps}`;
  
  // Меняем цвет таймера на оранжевый
  document.getElementById('timer-container').classList.remove('rest-mode');
  document.getElementById('timer-label').innerText = "Секунд";
  
  // Меняем кнопку на "Готово"
  const actionBtn = document.getElementById('btn-action');
  actionBtn.innerText = "Готово";
  actionBtn.onclick = completeStep; // Сбрасываем привязку

  startTimer(EXERCISE_TIME, onExerciseEnd);
}

// 5. Логика отдыха
function startRest() {
  currentMode = 'rest';
  
  document.getElementById('current-exercise-name').innerText = "Отдых";
  document.getElementById('current-exercise-meta').innerText = "Приготовьтесь к следующему";
  
  // Меняем цвет таймера на зеленый
  document.getElementById('timer-container').classList.add('rest-mode');
  document.getElementById('timer-label').innerText = "Отдых";
  
  // Меняем кнопку на "Пропустить отдых"
  const actionBtn = document.getElementById('btn-action');
  actionBtn.innerText = "Пропустить";
  actionBtn.onclick = skipStep;

  startTimer(REST_TIME, onRestEnd);
}

// 6. Таймер (Круговой)
function startTimer(seconds, callback) {
  clearInterval(timerInterval);
  
  const circle = document.getElementById('timer-circle');
  const secondsEl = document.getElementById('timer-seconds');
  
  let timeLeft = seconds;
  const radius = 90; // Радиус круга из SVG (r=90)
  const circumference = 2 * Math.PI * radius;
  
  // Инициализация
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = 0;
  secondsEl.innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    secondsEl.innerText = timeLeft;

    // Анимация круга
    const progress = timeLeft / seconds;
    const offset = circumference * (1 - progress);
    circle.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      callback();
    }
  }, 1000);
}

// 7. Переходы
function onExerciseEnd() {
  // Упражнение закончилось по таймеру -> идем в отдых
  if (currentExerciseIndex < exercisesList.length - 1) {
    startRest();
  } else {
    finishWorkout();
  }
}

function onRestEnd() {
  // Отдых закончился -> следующее упражнение
  currentExerciseIndex++;
  startExercise();
}

function completeStep() {
  // Нажали "Готово" вручную
  clearInterval(timerInterval);
  if (currentMode === 'exercise') {
    // Если это было последнее упражнение
    if (currentExerciseIndex === exercisesList.length - 1) {
        finishWorkout();
    } else {
        startRest();
    }
  }
}

function skipStep() {
  // Нажали "Пропустить"
  clearInterval(timerInterval);
  if (currentMode === 'rest') {
    currentExerciseIndex++;
    startExercise();
  } else if (currentMode === 'exercise') {
    // Если пропускаем упражнение, переходим к отдыху (или концу)
    if (currentExerciseIndex < exercisesList.length - 1) {
        startRest();
    } else {
        finishWorkout();
    }
  }
}

function finishWorkout() {
  clearInterval(timerInterval);
  saveToHistory(currentTrainingData.id, currentTrainingData.name);
  
  // Показываем уведомление в Telegram
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }
  
  switchScreen('finish');
  document.getElementById('btn-back-main').style.display = 'inline-flex';
}

function goHome() {
  window.location.href = 'index.html';
}

function switchScreen(screenName) {
  Object.keys(screens).forEach(key => {
    screens[key].style.display = (key === screenName) ? 'block' : 'none';
  });
}
