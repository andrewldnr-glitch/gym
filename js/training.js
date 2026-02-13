// js/training.js
const EXERCISE_TIME = 30;
const REST_TIME = 20;
const GET_READY_TIME = 5;

let currentTrainingData = null;
let exercisesList = [];
let currentExerciseIndex = 0;
let timerInterval = null;
let currentMode = 'intro';

const screens = {
    intro: document.getElementById('screen-intro'),
    workout: document.getElementById('screen-workout'),
    finish: document.getElementById('screen-finish')
};

document.addEventListener('DOMContentLoaded', async () => {
  initApp();
  const params = new URLSearchParams(window.location.search);
  const trainingId = parseInt(params.get('id'));
  if (!trainingId) { window.location.href = 'index.html'; return; }
  const data = await loadTrainingsData();
  if (!data) return;
  
  for (let lvl in data.levels) {
    const found = data.levels[lvl].find(t => t.id === trainingId);
    if (found) { currentTrainingData = found; break; }
  }
  if (!currentTrainingData) { document.getElementById('training-name-intro').innerText = "Ошибка"; return; }

  document.getElementById('training-name-intro').innerText = currentTrainingData.name;
  document.getElementById('training-desc-intro').innerText = currentTrainingData.group + " • " + currentTrainingData.description;
  exercisesList = currentTrainingData.exercises;
  
  const introList = document.getElementById('intro-list');
  exercisesList.forEach((ex, index) => {
    const item = document.createElement('div');
    item.className = 'intro-exercise-item';
    item.innerHTML = '<div class="intro-number">'+(index+1)+'</div><div class="intro-name">'+ex.name+'</div><div class="intro-meta">'+ex.sets+' × '+ex.reps+'</div>';
    introList.appendChild(item);
  });
  document.getElementById('btn-back-main').style.display = 'inline-flex';
});

function startWorkout() {
  currentExerciseIndex = 0;
  switchScreen('workout');
  document.getElementById('btn-back-main').style.display = 'none';
  startGetReady();
}

// --- Новый этап: Приготовьтесь ---
function startGetReady() {
  currentMode = 'getready';
  
  const ex = exercisesList[currentExerciseIndex];
  document.getElementById('progress-text').innerText = `Приготовьтесь: ${currentExerciseIndex + 1} из ${exercisesList.length}`;
  document.getElementById('current-exercise-name').innerText = ex.name;
  document.getElementById('current-exercise-meta').innerText = `${ex.sets} × ${ex.reps}`;
  
  document.getElementById('timer-container').classList.remove('rest-mode');
  document.getElementById('timer-container').classList.add('ready-mode'); // Синий цвет
  document.getElementById('timer-label').innerText = "Приготовьтесь";
  
  const actionBtn = document.getElementById('btn-action');
  actionBtn.innerText = "Пропустить";
  actionBtn.onclick = () => { clearInterval(timerInterval); startExercise(); };

  startTimer(GET_READY_TIME, startExercise, true);
}

function startExercise() {
  currentMode = 'exercise';
  playSound('start'); // Звук старта
  
  const ex = exercisesList[currentExerciseIndex];
  document.getElementById('progress-text').innerText = `Упражнение: ${currentExerciseIndex + 1} из ${exercisesList.length}`;
  document.getElementById('current-exercise-name').innerText = ex.name;
  document.getElementById('current-exercise-meta').innerText = `${ex.sets} × ${ex.reps}`;
  
  document.getElementById('timer-container').classList.remove('rest-mode');
  document.getElementById('timer-container').classList.remove('ready-mode');
  document.getElementById('timer-label').innerText = "Осталось";
  
  const actionBtn = document.getElementById('btn-action');
  actionBtn.innerText = "Готово";
  actionBtn.onclick = completeStep;

  startTimer(EXERCISE_TIME, onExerciseEnd);
}

function startRest() {
  currentMode = 'rest';
  playSound('rest'); // Звук отдыха
  
  document.getElementById('progress-text').innerText = `Отдых`;
  document.getElementById('current-exercise-name').innerText = "Перерыв";
  
  // Показываем следующее упражнение
  const nextEx = exercisesList[currentExerciseIndex + 1];
  document.getElementById('current-exercise-meta').innerText = `Далее: ${nextEx.name}`;
  
  document.getElementById('timer-container').classList.add('rest-mode'); // Зеленый цвет
  document.getElementById('timer-label').innerText = "Отдых";
  
  const actionBtn = document.getElementById('btn-action');
  actionBtn.innerText = "Пропустить";
  actionBtn.onclick = skipStep;

  startTimer(REST_TIME, onRestEnd);
}

function startTimer(seconds, callback, isGetReady = false) {
  clearInterval(timerInterval);
  
  const circle = document.getElementById('timer-circle');
  const secondsEl = document.getElementById('timer-seconds');
  
  let timeLeft = seconds;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = 0;
  secondsEl.innerText = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    secondsEl.innerText = timeLeft;
    
    // Тикающий звук для подготовки и отдыха (каждую секунду)
    if (currentMode === 'getready' || currentMode === 'rest') {
        playSound('tick');
    }

    const progress = timeLeft / seconds;
    const offset = circumference * (1 - progress);
    circle.style.strokeDashoffset = offset;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      callback();
    }
  }, 1000);
}

function onExerciseEnd() {
  if (currentExerciseIndex < exercisesList.length - 1) {
    startRest();
  } else {
    finishWorkout();
  }
}

function onRestEnd() {
  currentExerciseIndex++;
  startGetReady(); // Вместо startExercise идем к подготовке
}

function completeStep() {
  clearInterval(timerInterval);
  if (currentMode === 'exercise') {
    if (currentExerciseIndex === exercisesList.length - 1) {
        finishWorkout();
    } else {
        startRest();
    }
  }
}

function skipStep() {
  clearInterval(timerInterval);
  if (currentMode === 'rest') {
    currentExerciseIndex++;
    startGetReady();
  } else if (currentMode === 'getready') {
    startExercise();
  }
}

function finishWorkout() {
  clearInterval(timerInterval);
  saveToHistory(currentTrainingData.id, currentTrainingData.name);
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }
  switchScreen('finish');
  document.getElementById('btn-back-main').style.display = 'inline-flex';
}

function goHome() { window.location.href = 'index.html'; }

function switchScreen(screenName) {
  Object.keys(screens).forEach(key => {
    screens[key].style.display = (key === screenName) ? 'block' : 'none';
  });
}
