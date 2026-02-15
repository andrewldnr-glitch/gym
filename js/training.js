// js/training.js
const EXERCISE_TIME = 30;
const REST_TIME = 20;
const GET_READY_TIME = 5;

let currentTrainingData = null;
let exercisesList = [];
let currentExerciseIndex = 0;
let timerInterval = null;
let currentMode = 'intro';

let __playlistContextKey = '';

const screens = {
    intro: document.getElementById('screen-intro'),
    workout: document.getElementById('screen-workout'),
    finish: document.getElementById('screen-finish')
};

// ------------------------------
// Helpers (data / history / sound)
// ------------------------------

// Не критично для логики — но чтобы приложение не падало, даже если звука нет.
function playSound(_type) {
  // Можно позже подключить реальные звуки через WebAudio / <audio>.
}

// Загрузка базы тренировок для training.html (data/trainings.json)
async function loadTrainingsData() {
  try {
    const res = await fetch('data/trainings.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('[training] loadTrainingsData failed:', e);
    const title = document.getElementById('training-name-intro');
    const desc = document.getElementById('training-desc-intro');
    if (title) title.innerText = 'Не удалось загрузить тренировку';
    if (desc) desc.innerText = 'Проверьте подключение и наличие файла data/trainings.json';
    return null;
  }
}

// Сохраняем завершение тренировки в общий ключ истории (его читает index.html / profile.html)
function saveToHistory(trainingId, trainingName) {
  const finishedAtIso = new Date().toISOString();

  // 1) История тренировок
  try {
    const key = 'trainingHistory';
    const hist = JSON.parse(localStorage.getItem(key) || '[]');
    hist.push({
      date: finishedAtIso,
      source: 'training',
      training_id: trainingId,
      title: trainingName || 'Тренировка'
    });
    localStorage.setItem(key, JSON.stringify(hist));
  } catch (e) {
    console.warn('[training] saveToHistory failed:', e);
  }

  // 2) userStats (не обязательно, но полезно для статистики/достижений)
  try {
    const statsKey = 'userStats';
    const stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
    const total = Number(stats.totalWorkouts || 0) || 0;
    stats.totalWorkouts = total + 1;
    stats.lastTrainingDate = finishedAtIso;
    localStorage.setItem(statsKey, JSON.stringify(stats));
  } catch (_) {}
}



document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.initApp === 'function') window.initApp();
  const params = new URLSearchParams(window.location.search);
  const trainingId = parseInt(params.get('id'));
  if (!trainingId) { window.location.href = 'index.html'; return; }

  __playlistContextKey = `training:${trainingId}`;

  // Музыка: плейлисты (Яндекс Музыка)
  try {
    if (window.Playlists && typeof window.Playlists.mountWidget === 'function') {
      window.Playlists.mountWidget('playlist-widget', { contextKey: __playlistContextKey, compact: false });
    }
  } catch (e) {
    console.warn('[training] playlists mount failed:', e);
  }

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

function startGetReady() {
  currentMode = 'getready';
  
  const ex = exercisesList[currentExerciseIndex];
  document.getElementById('progress-text').innerText = `Приготовьтесь: ${currentExerciseIndex + 1} из ${exercisesList.length}`;
  document.getElementById('current-exercise-name').innerText = ex.name;
  document.getElementById('current-exercise-meta').innerText = `${ex.sets} × ${ex.reps}`;
  
  const container = document.getElementById('timer-container');
  container.classList.remove('rest-mode');
  container.classList.add('ready-mode');
  document.getElementById('timer-label').innerText = "Приготовьтесь";
  
  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');
  
  actionBtn.innerText = "Начать";
  actionBtn.style.display = 'block';
  actionBtn.onclick = function() {
      clearInterval(timerInterval);
      startExercise();
  };

  skipBtn.onclick = function() {
      skipStep();
  };

  startTimer(GET_READY_TIME, startExercise);
}

function startExercise() {
  currentMode = 'exercise';
  playSound('start');
  
  const ex = exercisesList[currentExerciseIndex];
  document.getElementById('progress-text').innerText = `Упражнение: ${currentExerciseIndex + 1} из ${exercisesList.length}`;
  document.getElementById('current-exercise-name').innerText = ex.name;
  document.getElementById('current-exercise-meta').innerText = `${ex.sets} × ${ex.reps}`;
  
  const container = document.getElementById('timer-container');
  container.classList.remove('rest-mode');
  container.classList.remove('ready-mode');
  document.getElementById('timer-label').innerText = "Осталось";
  
  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');
  
  actionBtn.innerText = "Готово";
  actionBtn.onclick = completeStep;

  skipBtn.onclick = skipStep;

  startTimer(EXERCISE_TIME, onExerciseEnd);
}

function startRest() {
  currentMode = 'rest';
  playSound('rest');
  
  document.getElementById('progress-text').innerText = `Отдых`;
  document.getElementById('current-exercise-name').innerText = "Перерыв";
  
  const nextEx = exercisesList[currentExerciseIndex + 1];
  document.getElementById('current-exercise-meta').innerText = `Далее: ${nextEx.name}`;
  
  const container = document.getElementById('timer-container');
  container.classList.remove('ready-mode');
  container.classList.add('rest-mode');
  document.getElementById('timer-label').innerText = "Отдых";
  
  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');
  
  actionBtn.innerText = "Пропустить отдых";
  actionBtn.onclick = function() { 
      clearInterval(timerInterval); 
      onRestEnd(); 
  };
  
  skipBtn.onclick = function() {
      clearInterval(timerInterval); 
      onRestEnd();
  };

  startTimer(REST_TIME, onRestEnd);
}

function startTimer(seconds, callback) {
  clearInterval(timerInterval);
  
  const circle = document.getElementById('timer-circle');
  const secondsEl = document.getElementById('timer-seconds');
  
  let timeLeft = seconds;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  
  circle.style.strokeDasharray = circumference;
  secondsEl.innerText = timeLeft;
  
  function updateVisual() {
      const progress = timeLeft / seconds;
      const offset = circumference * (1 - progress);
      circle.style.strokeDashoffset = offset;
  }
  
  updateVisual();

  timerInterval = setInterval(() => {
    timeLeft--;
    
    if (currentMode === 'getready' || currentMode === 'rest') {
        playSound('tick');
    }
    if (timeLeft <= 3 && currentMode === 'exercise') {
        playSound('tick');
    }

    if (timeLeft < 0) {
        clearInterval(timerInterval);
        return;
    }

    secondsEl.innerText = timeLeft;
    updateVisual();

    if (timeLeft === 0) {
      clearInterval(timerInterval);
      setTimeout(() => {
          if (currentMode !== 'finish') callback();
      }, 300);
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
  startGetReady();
}

function completeStep() {
  if (currentMode !== 'exercise') return;
  clearInterval(timerInterval);
  if (currentExerciseIndex === exercisesList.length - 1) {
      finishWorkout();
  } else {
      startRest();
  }
}

function skipStep() {
  clearInterval(timerInterval);
  
  if (currentMode === 'rest') {
    currentExerciseIndex++;
    startGetReady();
  } else if (currentMode === 'exercise' || currentMode === 'getready') {
    if (currentExerciseIndex < exercisesList.length - 1) {
        currentExerciseIndex++;
        startGetReady();
    } else {
        finishWorkout();
    }
  }
}

function finishWorkout() {
  clearInterval(timerInterval);
  currentMode = 'finish';
  
  // Сохраняем тренировку
  saveToHistory(currentTrainingData.id, currentTrainingData.name);
  
  // ПРОВЕРЯЕМ ДОСТИЖЕНИЯ
  // Функция checkAllAchievements находится в js/achievements.js
  if (typeof checkAllAchievements === 'function') {
      checkAllAchievements();
  }

  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  }
  switchScreen('finish');
  document.getElementById('btn-back-main').style.display = 'inline-flex';
}

function goHome() { window.location.href = 'index.html'; }



// Открыть текущий плейлист (кнопка 🎵)
function openTrainingPlaylist() {
  try {
    if (!__playlistContextKey) return;
    if (window.Playlists && typeof window.Playlists.openForContext === 'function') {
      const ok = window.Playlists.openForContext(__playlistContextKey);
      if (!ok) alert('Выберите плейлист в блоке «Музыка» перед началом тренировки.');
    }
  } catch (e) {
    console.warn('openTrainingPlaylist failed:', e);
  }
}
function switchScreen(screenName) {
  Object.keys(screens).forEach(key => {
    if (screens[key]) {
        screens[key].style.display = (key === screenName) ? 'block' : 'none';
    }
  });
}
