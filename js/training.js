// js/training.js
const EXERCISE_TIME = 30;
const REST_TIME = 20;
const GET_READY_TIME = 5;

let currentTrainingData = null;
let exercisesList = [];
let currentExerciseIndex = 0;
let timerInterval = null;
let timerTimeout = null;
let timerSeq = 0;
let currentMode = 'intro';

let __playlistContextKey = '';

// Course mode (таймер по этапам/подходам)
let __isCourseMode = false;
let __coursePayload = null;
let __courseExercises = []; // [{name, id, setsPlan: [...] }]
let __courseExerciseIndex = 0;
let __courseSetIndex = 0;

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

// Останавливаем активный таймер и (опционально) инвалидируем отложенные callbacks
function stopTimer(invalidate = false) {
  if (invalidate) timerSeq++;
  try {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  } catch (_) {}

  try {
    if (timerTimeout) {
      clearTimeout(timerTimeout);
      timerTimeout = null;
    }
  } catch (_) {}
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
function saveToHistory(trainingId, trainingName, extra = null) {
  const finishedAtIso = new Date().toISOString();

  // 1) История тренировок
  try {
    const key = 'trainingHistory';
    const hist = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = {
      date: finishedAtIso,
      source: (extra && extra.source) ? extra.source : 'training',
      training_id: trainingId,
      title: trainingName || 'Тренировка'
    };
    if (extra && extra.course_id) entry.course_id = extra.course_id;
    if (extra && (typeof extra.day_index === 'number')) entry.day_index = extra.day_index;
    hist.push(entry);
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

// ------------------------------
// Course payload + normalization
// ------------------------------

function __safeJsonParse(raw, fallback) {
  try { return JSON.parse(raw); } catch (_) { return fallback; }
}

function readCoursePayload() {
  let raw = null;
  try { raw = sessionStorage.getItem('courseWorkoutPayload'); } catch (_) {}
  if (!raw) {
    try { raw = localStorage.getItem('courseWorkoutPayload'); } catch (_) {}
  }
  if (!raw) return null;
  const payload = __safeJsonParse(raw, null);
  if (!payload || payload.source !== 'course') return null;
  return payload;
}

function parseSetPlanFromItem(item, exercise) {
  const scheme = Array.isArray(item?.scheme_ru) ? item.scheme_ru.map(s => String(s)) : [];
  const notes = String(item?.notes_ru || '').toLowerCase();
  const restDefault = Number(item?.rest_sec || exercise?.meta?.restTime || 60) || 60;

  const hasFailure = notes.includes('отказ') || scheme.some(s => s.toLowerCase().includes('отказ'));

  // Вытаскиваем разминку
  let warmupCount = 0;
  for (const line of scheme) {
    const m = line.toLowerCase().match(/(\d+)\s*размин/);
    if (m) { warmupCount = Math.max(warmupCount, Number(m[1]) || 0); }
  }

  // Вытаскиваем подходы "по 40 секунд"
  let timedCount = 0;
  let timedSec = 0;
  for (const line of scheme) {
    const m = line.toLowerCase().match(/(\d+)\s*подход\w*[^\d]{0,20}по\s*(\d+)\s*сек/);
    if (m) {
      timedCount = Math.max(timedCount, Number(m[1]) || 0);
      timedSec = Math.max(timedSec, Number(m[2]) || 0);
    }
  }

  // Вытаскиваем паттерн "2 тяжёлых 5–8" + "1 полегче 10–12"
  let heavyCount = 0, heavyReps = '';
  let lightCount = 0, lightReps = '';
  for (const line of scheme) {
    const low = line.toLowerCase().replace(/–/g, '-');
    const mh = low.match(/(\d+)\s*тяж\w*[^\d]{0,20}(\d+)\s*[-]\s*(\d+)/);
    if (mh) {
      heavyCount = Math.max(heavyCount, Number(mh[1]) || 0);
      heavyReps = `${mh[2]}–${mh[3]}`;
    }
    const ml = low.match(/(\d+)\s*подход\w*[^\d]{0,30}(\d+)\s*[-]\s*(\d+)/);
    // light берём только если есть слова "полегче"/"меньш"/"легче"
    if (ml && (low.includes('полег') || low.includes('меньш') || low.includes('легче'))) {
      lightCount = Math.max(lightCount, Number(ml[1]) || 0);
      lightReps = `${ml[2]}–${ml[3]}`;
    }
  }

  // Базовые reps
  const repsMin = (typeof item?.reps_min === 'number') ? item.reps_min : null;
  const repsMax = (typeof item?.reps_max === 'number') ? item.reps_max : null;
  const repsStr = (repsMin || repsMax)
    ? `${repsMin || ''}${(repsMin && repsMax) ? '–' : ''}${repsMax || ''}`.trim()
    : '';

  const totalWorkSets = Number(item?.sets || exercise?.sets || 3) || 3;

  const plan = [];

  // 1) Разминочные подходы
  for (let i = 0; i < warmupCount; i++) {
    plan.push({ kind: 'warmup', reps: 'разминка', rest_sec: restDefault });
  }

  // 2) Спец. схема heavy/light
  if (heavyCount || lightCount) {
    for (let i = 0; i < heavyCount; i++) plan.push({ kind: hasFailure ? 'failure' : 'work', reps: heavyReps || repsStr || '—', rest_sec: restDefault, note: 'тяжёлый' });
    for (let i = 0; i < lightCount; i++) plan.push({ kind: hasFailure ? 'failure' : 'work', reps: lightReps || repsStr || '—', rest_sec: restDefault, note: 'полегче' });
  }

  // 3) Временные подходы
  if (timedCount && timedSec) {
    // если до этого ничего не добавили и есть строка "1 подход на 8–10", добавим один обычный
    if (plan.length === 0 && scheme.some(s => s.toLowerCase().match(/1\s*подход/))) {
      plan.push({ kind: hasFailure ? 'failure' : 'work', reps: repsStr || '—', rest_sec: restDefault });
    }
    for (let i = 0; i < timedCount; i++) {
      plan.push({ kind: 'time', duration_sec: timedSec, rest_sec: restDefault });
    }
  }

  // 4) Фоллбек: просто sets
  if (plan.length === 0) {
    for (let i = 0; i < totalWorkSets; i++) {
      plan.push({ kind: hasFailure ? 'failure' : 'work', reps: repsStr || '—', rest_sec: restDefault });
    }
  }

  // 5) Вариант: если сказано "дропсет" — пометим последний
  if (scheme.some(s => s.toLowerCase().includes('дроп'))) {
    const last = plan[plan.length - 1];
    if (last && !last.note) last.note = 'дропсет';
  }

  return plan;
}

function normalizeCourseExercises(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const out = [];
  for (const it of items) {
    const id = (typeof it === 'string') ? it : (it?.exercise_id || it?.id);
    if (!id) continue;
    const ex = (typeof EXERCISE_DATABASE !== 'undefined')
      ? EXERCISE_DATABASE.find(e => e.id === id)
      : null;
    if (!ex) continue;
    out.push({
      id,
      name: ex.name,
      setsPlan: parseSetPlanFromItem((typeof it === 'object' ? it : {}), ex)
    });
  }
  return out;
}

function setManualTimerDisplay(labelText) {
  stopTimer(true);
  const secondsEl = document.getElementById('timer-seconds');
  const labelEl = document.getElementById('timer-label');
  const circle = document.getElementById('timer-circle');
  if (labelEl) labelEl.innerText = labelText || '';
  if (secondsEl) secondsEl.innerText = '—';
  if (circle) {
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = 0;
  }
}

function courseHasNextAfterCurrentSet() {
  const ex = __courseExercises[__courseExerciseIndex];
  const sets = ex?.setsPlan || [];
  if (__courseSetIndex < sets.length - 1) return true;
  if (__courseExerciseIndex < __courseExercises.length - 1) return true;
  return false;
}

function courseAdvanceAfterSet() {
  const ex = __courseExercises[__courseExerciseIndex];
  const sets = ex?.setsPlan || [];
  if (__courseSetIndex < sets.length - 1) {
    __courseSetIndex++;
    startCourseSet();
    return;
  }
  // следующий exercise
  if (__courseExerciseIndex < __courseExercises.length - 1) {
    __courseExerciseIndex++;
    __courseSetIndex = 0;
    startCourseGetReady();
    return;
  }
  finishWorkout();
}

function startCourseGetReady() {
  currentMode = 'getready';
  const ex = __courseExercises[__courseExerciseIndex];
  if (!ex) { finishWorkout(); return; }

  const container = document.getElementById('timer-container');
  container.classList.remove('rest-mode');
  container.classList.add('ready-mode');

  document.getElementById('progress-text').innerText = `Упражнение ${__courseExerciseIndex + 1} из ${__courseExercises.length}`;
  document.getElementById('current-exercise-name').innerText = ex.name;
  document.getElementById('current-exercise-meta').innerText = `Подход 1 из ${ex.setsPlan.length}`;

  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');
  if (actionBtn) {
    actionBtn.innerText = 'Начать';
    actionBtn.style.display = 'block';
    actionBtn.onclick = function() {
      stopTimer(true);
      startCourseSet();
    };
  }
  if (skipBtn) {
    skipBtn.onclick = function() {
      stopTimer(true);
      // пропустить упражнение целиком
      if (__courseExerciseIndex < __courseExercises.length - 1) {
        __courseExerciseIndex++;
        __courseSetIndex = 0;
        startCourseGetReady();
      } else {
        finishWorkout();
      }
    };
  }

  document.getElementById('timer-label').innerText = 'Приготовьтесь';
  startTimer(GET_READY_TIME, startCourseSet);
}

function startCourseSet() {
  const ex = __courseExercises[__courseExerciseIndex];
  const set = ex?.setsPlan?.[__courseSetIndex];
  if (!ex || !set) { finishWorkout(); return; }

  const setsTotal = ex.setsPlan.length;
  const setNo = __courseSetIndex + 1;
  const progress = `Упражнение ${__courseExerciseIndex + 1} из ${__courseExercises.length} • Подход ${setNo} из ${setsTotal}`;

  document.getElementById('progress-text').innerText = progress;
  document.getElementById('current-exercise-name').innerText = ex.name;

  const container = document.getElementById('timer-container');
  container.classList.remove('rest-mode');
  container.classList.remove('ready-mode');

  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');

  const restSec = Number(set.rest_sec || 0) || 0;

  const finishSet = () => {
    stopTimer(true);
    if (courseHasNextAfterCurrentSet() && restSec > 0) {
      startCourseRest(restSec);
      return;
    }
    courseAdvanceAfterSet();
  };

  if (skipBtn) {
    skipBtn.onclick = finishSet;
  }

  if (set.kind === 'time') {
    currentMode = 'exercise';
    const sec = Number(set.duration_sec || 0) || 0;
    document.getElementById('current-exercise-meta').innerText = `Работа • ${sec} сек`;
    document.getElementById('timer-label').innerText = 'Работа';
    if (actionBtn) {
      actionBtn.innerText = 'Готово';
      actionBtn.onclick = finishSet;
    }
    startTimer(sec, finishSet);
    return;
  }

  // manual sets
  currentMode = 'exercise';
  if (set.kind === 'warmup') {
    document.getElementById('current-exercise-meta').innerText = 'Разминка';
    setManualTimerDisplay('Разминка');
  } else if (set.kind === 'failure') {
    document.getElementById('current-exercise-meta').innerText = 'До отказа';
    setManualTimerDisplay('До отказа');
  } else {
    const reps = set.reps ? String(set.reps) : '—';
    const note = set.note ? ` • ${set.note}` : '';
    document.getElementById('current-exercise-meta').innerText = `Подход • ${reps}${note}`;
    setManualTimerDisplay('Подход');
  }

  if (actionBtn) {
    actionBtn.innerText = 'Готово';
    actionBtn.onclick = finishSet;
  }
}

function startCourseRest(seconds) {
  currentMode = 'rest';
  playSound('rest');

  document.getElementById('progress-text').innerText = 'Отдых';
  document.getElementById('current-exercise-name').innerText = 'Перерыв';

  // подсказка, что далее
  const ex = __courseExercises[__courseExerciseIndex];
  const sets = ex?.setsPlan || [];
  let nextText = '';
  if (__courseSetIndex < sets.length - 1) {
    nextText = `Далее: ${ex.name} • подход ${__courseSetIndex + 2} из ${sets.length}`;
  } else if (__courseExerciseIndex < __courseExercises.length - 1) {
    nextText = `Далее: ${__courseExercises[__courseExerciseIndex + 1].name}`;
  }
  document.getElementById('current-exercise-meta').innerText = nextText;

  const container = document.getElementById('timer-container');
  container.classList.remove('ready-mode');
  container.classList.add('rest-mode');
  document.getElementById('timer-label').innerText = 'Отдых';

  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');
  const onEnd = () => {
    stopTimer(true);
    courseAdvanceAfterSet();
  };
  if (actionBtn) {
    actionBtn.innerText = 'Пропустить отдых';
    actionBtn.onclick = onEnd;
  }
  if (skipBtn) {
    skipBtn.onclick = onEnd;
  }

  startTimer(Number(seconds) || 0, onEnd);
}



document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.initApp === 'function') window.initApp();

  const params = new URLSearchParams(window.location.search);
  const mode = String(params.get('mode') || '').toLowerCase();

  if (mode === 'course') {
    __isCourseMode = true;
    __coursePayload = readCoursePayload();
    if (!__coursePayload) {
      const title = document.getElementById('training-name-intro');
      const desc = document.getElementById('training-desc-intro');
      if (title) title.innerText = 'Не удалось открыть тренировку курса';
      if (desc) desc.innerText = 'Вернитесь в «Курсы» и попробуйте ещё раз.';
      document.getElementById('btn-back-main').style.display = 'inline-flex';
      return;
    }

    __playlistContextKey = `course:${__coursePayload.course_id}:${__coursePayload.day_index}`;

    // Музыка: плейлисты (Яндекс Музыка)
    try {
      if (window.Playlists && typeof window.Playlists.mountWidget === 'function') {
        window.Playlists.mountWidget('playlist-widget', { contextKey: __playlistContextKey, compact: false });
      }
    } catch (e) {
      console.warn('[training] playlists mount failed:', e);
    }

    // Нормализуем упражнения
    __courseExercises = normalizeCourseExercises(__coursePayload);
    if (!__courseExercises.length) {
      const title = document.getElementById('training-name-intro');
      const desc = document.getElementById('training-desc-intro');
      if (title) title.innerText = 'В этой тренировке нет упражнений';
      if (desc) desc.innerText = 'Проверьте данные курса.';
      document.getElementById('btn-back-main').style.display = 'inline-flex';
      return;
    }

    currentTrainingData = {
      id: `course:${__coursePayload.course_id}:${__coursePayload.day_index}`,
      name: __coursePayload.title || 'Тренировка курса'
    };
    exercisesList = __courseExercises; // для совместимости (startWorkout)

    document.getElementById('training-name-intro').innerText = currentTrainingData.name;
    document.getElementById('training-desc-intro').innerText = `Курс • ${__coursePayload.course_title || 'Программа'} • ${__coursePayload.day_title || ''}`.trim();

    const introList = document.getElementById('intro-list');
    introList.innerHTML = '';
    __courseExercises.forEach((ex, idx) => {
      const item = document.createElement('div');
      item.className = 'intro-exercise-item';
      const num = document.createElement('div');
      num.className = 'intro-number';
      num.textContent = String(idx + 1);
      const name = document.createElement('div');
      name.className = 'intro-name';
      name.textContent = String(ex?.name || 'Упражнение');
      const meta = document.createElement('div');
      meta.className = 'intro-meta';
      meta.textContent = `Подходов: ${ex?.setsPlan?.length || 0}`;
      item.appendChild(num);
      item.appendChild(name);
      item.appendChild(meta);
      introList.appendChild(item);
    });

    document.getElementById('btn-back-main').style.display = 'inline-flex';
    return;
  }

  // ----- default (old) training mode by id -----
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

    const num = document.createElement('div');
    num.className = 'intro-number';
    num.textContent = String(index + 1);

    const name = document.createElement('div');
    name.className = 'intro-name';
    name.textContent = String(ex?.name || 'Упражнение');

    const meta = document.createElement('div');
    meta.className = 'intro-meta';
    const sets = Number(ex?.sets || 0) || 0;
    const reps = ex?.reps ?? '';
    meta.textContent = `${sets} × ${reps}`.trim();

    item.appendChild(num);
    item.appendChild(name);
    item.appendChild(meta);

    introList.appendChild(item);
  });
  document.getElementById('btn-back-main').style.display = 'inline-flex';
});

function startWorkout() {
  if (__isCourseMode) {
    // course state init
    __courseExerciseIndex = 0;
    __courseSetIndex = 0;
    switchScreen('workout');
    document.getElementById('btn-back-main').style.display = 'none';
    startCourseGetReady();
    return;
  }
  if (!Array.isArray(exercisesList) || exercisesList.length === 0) {
    alert('В этой тренировке нет упражнений.');
    return;
  }
  currentExerciseIndex = 0;
  switchScreen('workout');
  document.getElementById('btn-back-main').style.display = 'none';
  startGetReady();
}

function startGetReady() {
  if (__isCourseMode) return startCourseGetReady();
  currentMode = 'getready';
  
  const ex = exercisesList[currentExerciseIndex];
  if (!ex) { finishWorkout(); return; }
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
      stopTimer(true);
      startExercise();
  };

  skipBtn.onclick = function() {
      skipStep();
  };

  startTimer(GET_READY_TIME, startExercise);
}

function startExercise() {
  if (__isCourseMode) return startCourseSet();
  currentMode = 'exercise';
  playSound('start');
  
  const ex = exercisesList[currentExerciseIndex];
  if (!ex) { finishWorkout(); return; }
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
  if (__isCourseMode) return startCourseRest(REST_TIME);
  currentMode = 'rest';
  playSound('rest');
  
  document.getElementById('progress-text').innerText = `Отдых`;
  document.getElementById('current-exercise-name').innerText = "Перерыв";
  
  const nextEx = exercisesList[currentExerciseIndex + 1];
  document.getElementById('current-exercise-meta').innerText = nextEx ? `Далее: ${nextEx.name}` : '';
  
  const container = document.getElementById('timer-container');
  container.classList.remove('ready-mode');
  container.classList.add('rest-mode');
  document.getElementById('timer-label').innerText = "Отдых";
  
  const actionBtn = document.getElementById('btn-action');
  const skipBtn = document.querySelector('.btn-skip');
  
  actionBtn.innerText = "Пропустить отдых";
  actionBtn.onclick = function() { 
      stopTimer(true);
      onRestEnd(); 
  };
  
  skipBtn.onclick = function() {
      stopTimer(true);
      onRestEnd();
  };

  startTimer(REST_TIME, onRestEnd);
}

function startTimer(seconds, callback) {
  // invalidate any pending callback from previous timer
  stopTimer(true);
  const mySeq = timerSeq;

  const circle = document.getElementById('timer-circle');
  const secondsEl = document.getElementById('timer-seconds');

  if (!circle || !secondsEl) return;

  let timeLeft = Number(seconds) || 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = circumference;
  secondsEl.innerText = timeLeft;

  function updateVisual() {
    const total = Number(seconds) || 1;
    const progress = timeLeft / total;
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
      stopTimer(false);
      return;
    }

    secondsEl.innerText = timeLeft;
    updateVisual();

    if (timeLeft === 0) {
      // Stop the interval but keep seq so the scheduled callback can validate.
      try {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      } catch (_) {}

      // Small delay for smoother UX; guarded by timerSeq.
      timerTimeout = setTimeout(() => {
        if (timerSeq !== mySeq) return;
        if (currentMode === 'finish') return;
        try { callback(); } catch (e) { console.error('[training] timer callback failed:', e); }
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
  if (__isCourseMode) {
    courseAdvanceAfterSet();
    return;
  }
  currentExerciseIndex++;
  startGetReady();
}

function completeStep() {
  if (__isCourseMode) {
    // В курсе "Готово" обрабатывается внутри startCourseSet()
    return;
  }
  if (currentMode !== 'exercise') return;
  stopTimer(true);
  if (currentExerciseIndex === exercisesList.length - 1) {
      finishWorkout();
  } else {
      startRest();
  }
}

function skipStep() {
  if (__isCourseMode) {
    // По смыслу: пропускаем текущую фазу (подход/отдых) как "готово"
    stopTimer(true);
    if (currentMode === 'rest') {
      courseAdvanceAfterSet();
    } else {
      // Пропустить текущий подход без дополнительного отдыха
      if (courseHasNextAfterCurrentSet()) courseAdvanceAfterSet();
      else finishWorkout();
    }
    return;
  }
  stopTimer(true);
  
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
  stopTimer(true);
  currentMode = 'finish';
  
  // Сохраняем тренировку
  if (__isCourseMode) {
    saveToHistory(currentTrainingData.id, currentTrainingData.name, {
      source: 'course',
      course_id: __coursePayload?.course_id,
      day_index: (typeof __coursePayload?.day_index === 'number') ? __coursePayload.day_index : undefined
    });
  } else {
    saveToHistory(currentTrainingData.id, currentTrainingData.name);
  }
  
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
