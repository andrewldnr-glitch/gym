// ==========================================
// === 0. БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ APP (TG) ===
// ==========================================
//
// Некоторые страницы (например, info.html / training.html) вызывают initApp().
// Ранее этой функции не было, что ломало JS.
// Здесь делаем её идемпотентной и безопасной для запуска вне Telegram.
//

if (typeof window.initApp !== 'function') {
  window.initApp = function initApp() {
    // Telegram WebApp (если открыто внутри Telegram)
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
      }
    } catch (e) {
      console.warn('[initApp] Telegram init failed:', e);
    }

    // Lucide icons (если библиотека подключена на странице)
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (_) {}
  };
}

// ==========================================
// === 1. БАЗА ДАННЫХ УПРАЖНЕНИЙ ===
// ==========================================

const EXERCISE_DATABASE = [
  // --- ГРУДЬ ---
  {
    id: 'pushups',
    name: 'Отжимания',
    muscle: 'chest',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h12"/></svg>`,
    description: 'Базовое упражнение для грудных мышц и трицепса.',
    sets: 3,
    levels: {
      beginner: { weight: 'Вес тела', reps: '10-12 раз', restTime: 60, advice: 'Упор на колени, если тяжело.' },
      intermediate: { weight: 'Вес тела', reps: '15-20 раз', restTime: 45, advice: 'Медленное опускание.' },
      pro: { weight: 'Рюкзак 10 кг', reps: '20 раз', restTime: 30, advice: 'Взрывной подъем.' }
    }
  },
  {
    id: 'bench_press',
    name: 'Жим штанги лежа',
    muscle: 'chest',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h12M6 18h12M4 10v4M20 10v4M6 12h12"/></svg>`,
    description: 'Главное упражнение на массу груди.',
    sets: 4,
    levels: {
      beginner: { weight: 'Гриф (20кг)', reps: '12-15 раз', restTime: 90, advice: 'Освоить технику.' },
      intermediate: { weight: '40-50кг', reps: '10-12 раз', restTime: 75, advice: 'Лопатки сведены.' },
      pro: { weight: '80кг+', reps: '6-8 раз', restTime: 120, advice: 'Со страховкой.' }
    }
  },
  {
    id: 'dumbbell_flyes',
    name: 'Разводка гантелей',
    muscle: 'chest',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M6 9l6 3l6 -3"/></svg>`,
    description: 'Растяжение грудных мышц.',
    sets: 3,
    levels: {
      beginner: { weight: '4-6 кг', reps: '12 раз', restTime: 60, advice: 'Локти чуть согнуты.' },
      intermediate: { weight: '10 кг', reps: '12 раз', restTime: 60, advice: 'Чувство растяжения.' },
      pro: { weight: '16 кг', reps: '12 раз', restTime: 45, advice: 'До жжения.' }
    }
  },

  // --- СПИНА ---
  {
    id: 'pull_ups',
    name: 'Подтягивания',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 0l-3-3m3 3l3-3M7 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/></svg>`,
    description: 'Ширина спины.',
    sets: 3,
    levels: {
      beginner: { weight: 'Гравитрон', reps: '8-10 раз', restTime: 90, advice: 'Сведение лопаток.' },
      intermediate: { weight: 'Вес тела', reps: '10-12 раз', restTime: 60, advice: 'Без рывков.' },
      pro: { weight: 'Пояс 15кг', reps: '10 раз', restTime: 60, advice: 'Чистая техника.' }
    }
  },
  {
    id: 'deadlift',
    name: 'Становая тяга',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4"/></svg>`,
    description: 'Мощь всей задней цепи.',
    sets: 4,
    levels: {
      beginner: { weight: 'Гриф (20кг)', reps: '10 раз', restTime: 120, advice: 'Прямая спина.' },
      intermediate: { weight: '50кг', reps: '8-10 раз', restTime: 90, advice: 'Гриф близко к ногам.' },
      pro: { weight: '100кг+', reps: '5-6 раз', restTime: 180, advice: 'Пояс обязателен.' }
    }
  },

  // --- НОГИ ---
  {
    id: 'squats',
    name: 'Приседания',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M7 21l3-9-2-3m7 12l-3-9 2-3"/></svg>`,
    description: 'Король упражнений для ног.',
    sets: 4,
    levels: {
      beginner: { weight: 'Вес тела', reps: '20 раз', restTime: 60, advice: 'Пятки на полу.' },
      intermediate: { weight: 'Гантели 15кг', reps: '15 раз', restTime: 60, advice: 'Глубокий присед.' },
      pro: { weight: 'Штанга 80кг', reps: '10 раз', restTime: 90, advice: 'Взгляд прямо.' }
    }
  },
  {
    id: 'lunges',
    name: 'Выпады',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4l-4 16M8 8l4 4 4-4"/></svg>`,
    description: 'Форма ног и баланс.',
    sets: 3,
    levels: {
      beginner: { weight: 'Вес тела', reps: '10 на ногу', restTime: 60, advice: 'Колено не касается пола.' },
      intermediate: { weight: 'Гантели 10кг', reps: '12 на ногу', restTime: 60, advice: 'Корпус вертикально.' },
      pro: { weight: 'Штанга 40кг', reps: '10 на ногу', restTime: 60, advice: 'Равновесие.' }
    }
  },

  // --- ДОПОЛНИТЕЛЬНЫЕ УПРАЖНЕНИЯ (ДЛЯ КУРСОВ) ---
  {
    id: 'leg_press',
    name: 'Жим ногами',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4"/></svg>`,
    description: 'Безопасная альтернатива приседаниям.',
    sets: 3,
    levels: { beginner: { weight: '10-20 кг', reps: '12-15 раз', restTime: 60, advice: 'Не выпрямляйте колени полностью.' } }
  },
  {
    id: 'overhead_press',
    name: 'Жим гантелей сидя',
    muscle: 'shoulders',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M12 8v8"/></svg>`,
    description: 'Базовое упражнение для плеч.',
    sets: 3,
    levels: { beginner: { weight: '5-8 кг', reps: '12-15 раз', restTime: 60, advice: 'Держите спину прямо.' } }
  },
  {
    id: 'crunches',
    name: 'Скручивания на пресс',
    muscle: 'abs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
    description: 'Упражнение на мышцы живота.',
    sets: 3,
    levels: { beginner: { weight: 'Вес тела', reps: '15-20 раз', restTime: 45, advice: 'Поднимайте лопатки, поясница прижата.' } }
  },
  {
    id: 'romanian_deadlift',
    name: 'Румынская тяга',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4"/></svg>`,
    description: 'Проработка задней поверхности бедра.',
    sets: 3,
    levels: { beginner: { weight: 'Гриф (20кг)', reps: '10-12 раз', restTime: 60, advice: 'Ноги чуть согнуты, наклон за счет отведения таза.' } }
  },
  {
    id: 'leg_extension',
    name: 'Разгибания ног',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"/></svg>`,
    description: 'Изоляция квадрицепса.',
    sets: 3,
    levels: { beginner: { weight: '10-15 кг', reps: '12-15 раз', restTime: 45, advice: 'Движение плавное.' } }
  },
  {
    id: 'lat_pulldown',
    name: 'Тяга блока к груди',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 0l-3-3m3 3l3-3"/></svg>`,
    description: 'Альтернатива подтягиваниям.',
    sets: 3,
    levels: { beginner: { weight: '20-30 кг', reps: '12-15 раз', restTime: 60, advice: 'Тяните локти вниз.' } }
  },
  {
    id: 'triceps_extension',
    name: 'Разгибания на трицепс',
    muscle: 'arms',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/></svg>`,
    description: 'Изоляция трицепса.',
    sets: 3,
    levels: { beginner: { weight: '10-15 кг', reps: '12-15 раз', restTime: 45, advice: 'Локти прижаты к телу.' } }
  },
  {
    id: 'hyperextension',
    name: 'Гиперэкстензия',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16"/></svg>`,
    description: 'Укрепление поясницы.',
    sets: 3,
    levels: { beginner: { weight: 'Вес тела', reps: '12-15 раз', restTime: 60, advice: 'Не прогибайтесь чрезмерно.' } }
  },
  {
    id: 'one_arm_row',
    name: 'Тяга гантели одной рукой',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
    description: 'Толщина спины.',
    sets: 3,
    levels: { beginner: { weight: '8-10 кг', reps: '10 раз', restTime: 60, advice: 'Тяните локоть назад.' } }
  },
  {
    id: 'leg_raises',
    name: 'Подъем ног',
    muscle: 'abs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/></svg>`,
    description: 'Нижний пресс.',
    sets: 3,
    levels: { beginner: { weight: 'Вес тела', reps: '12-15 раз', restTime: 45, advice: 'Не раскачивайтесь.' } }
  }
];

// ==========================================
// === 2. БАЗА КУРСОВ ===
// ==========================================

const COURSES_DATABASE = [
  {
    id: 'beginner_gym',
    title: 'Программа для начинающих',
    subtitle: 'Тренажерный зал',
    description: 'Полная программа 3 раза в неделю. Идеально для старта.',
    duration: '12 недель',
    goal: 'base',
    level: 'beginner',
    schedule: [
      { name: 'Понедельник', exercises: ['pull_ups', 'deadlift', 'leg_press', 'overhead_press', 'crunches'] },
      { name: 'Среда', exercises: ['bench_press', 'dumbbell_flyes', 'romanian_deadlift', 'leg_extension', 'lat_pulldown', 'triceps_extension'] },
      { name: 'Пятница', exercises: ['hyperextension', 'squats', 'lunges', 'lat_pulldown', 'one_arm_row', 'leg_raises'] }
    ]
  }
];

// ==========================================
// === 3. СОСТОЯНИЕ ТРЕНИРОВКИ ===
// ==========================================

let workoutState = {
  currentSet: 1,
  totalSets: 3,
  restTime: 60,
  timerInterval: null,

  // ✅ для пропуска отдыха
  restButtonRef: null,
  restTimerBlockRef: null,
};

// ==========================================
// === 4. UI HELPERS (states via classes) ===
// ==========================================

function setActionButtonState(btn, state /* 'primary' | 'warning' | 'neutral' */) {
  if (!btn) return;
  btn.classList.remove('btn-state-primary', 'btn-state-warning', 'btn-state-neutral');
  if (state === 'primary') btn.classList.add('btn-state-primary');
  if (state === 'warning') btn.classList.add('btn-state-warning');
  if (state === 'neutral') btn.classList.add('btn-state-neutral');
}

function setTimerCircleState(circle, state /* 'ok' | 'danger' | 'none' */) {
  if (!circle) return;
  circle.classList.remove('is-ok', 'is-danger');
  if (state === 'ok') circle.classList.add('is-ok');
  if (state === 'danger') circle.classList.add('is-danger');
}

/** ✅ Re-render lucide icons if available */
function refreshLucideIcons() {
  try {
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  } catch (_) {}
}

// ==========================================
// === 5. ФУНКЦИИ ИНТЕРФЕЙСА (ОТРИСОВКА) ===
// ==========================================

// 5.1 Отрисовка списка разовых тренировок (trainings.html)
function renderWorkoutList(containerId, muscleGroup, level = 'beginner') {
  const container = document.getElementById(containerId);
  if (!container) return;

  let filtered = EXERCISE_DATABASE;
  if (muscleGroup !== 'all') filtered = EXERCISE_DATABASE.filter(ex => ex.muscle === muscleGroup);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state loading-state"><p>Тренировок нет.</p></div>`;
    return;
  }

  let html = '';
  filtered.forEach(exercise => {
    const levelData = exercise.levels[level] || exercise.levels['beginner'];

    html += `
      <div class="workout-card" onclick="showExerciseDetail('${exercise.id}', '${level}')">
        <div class="workout-icon">${exercise.icon}</div>
        <div class="workout-details">
          <h3>${exercise.name}</h3>
          <div class="workout-tags">
            <span class="tag weight">${levelData.weight}</span>
            <span class="tag reps">${exercise.sets || 3}x${levelData.reps}</span>
          </div>
          <p class="workout-advice">${levelData.advice}</p>
        </div>
        <div class="workout-action"><span>▶</span></div>
      </div>`;
  });

  container.innerHTML = html;
}

// 5.2 Отрисовка списка курсов (courses.html)
function renderCoursesList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  COURSES_DATABASE.forEach(course => {
    html += `
      <div class="course-card card" onclick="window.location.href='course-detail.html?id=${course.id}'">
        <div class="course-header">
          <h2>${course.title}</h2>
          <span class="course-badge">${course.level === 'beginner' ? 'Новичок' : 'Продвинутый'}</span>
        </div>

        <p class="course-desc">${course.description}</p>

        <div class="course-meta">
          <span class="course-meta__item">
            <span class="icon"><i data-lucide="calendar"></i></span>
            ${course.duration}
          </span>
          <span class="course-meta__item">
            <span class="icon"><i data-lucide="dumbbell"></i></span>
            ${course.schedule.length} дня в неделю
          </span>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  refreshLucideIcons(); // ✅ чтобы иконки появились после вставки HTML
}

// 5.3 Отрисовка списка по ID (для workout-process.html)
function renderWorkoutListByIds(containerId, exerciseIds, level = 'beginner') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!exerciseIds || exerciseIds.length === 0) {
    container.innerHTML = `<div class="empty-state loading-state"><p>Список пуст.</p></div>`;
    return;
  }

  let html = '';
  exerciseIds.forEach(id => {
    const exercise = EXERCISE_DATABASE.find(ex => ex.id === id);
    if (!exercise) return;

    const levelData = exercise.levels[level] || exercise.levels['beginner'];

    html += `
      <div class="workout-card" onclick="showExerciseDetail('${exercise.id}', '${level}')">
        <div class="workout-icon">${exercise.icon}</div>
        <div class="workout-details">
          <h3>${exercise.name}</h3>
          <div class="workout-tags">
            <span class="tag weight">${levelData.weight}</span>
            <span class="tag reps">${exercise.sets || 3}x${levelData.reps}</span>
          </div>
          <p class="workout-advice">${levelData.advice}</p>
        </div>
        <div class="workout-action"><span>▶</span></div>
      </div>`;
  });

  container.innerHTML = html;
}

// ==========================================
// === 6. ЛОГИКА КУРСОВ ===
// ==========================================

function openCourseDetail(courseId) {
  window.location.href = `course-detail.html?id=${courseId}`;
}

function initCourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  let courseId = urlParams.get('id');

  if (!courseId) {
    try { courseId = localStorage.getItem('selectedCourseId'); }
    catch (e) { console.warn("LocalStorage недоступен"); }
  }

  if (!courseId) {
    console.error("ID курса не найден");
    window.location.href = 'courses.html';
    return;
  }

  const course = COURSES_DATABASE.find(c => c.id === courseId);
  if (!course) {
    const cc = document.getElementById('course-content');
    if (cc) cc.innerHTML = '<p>Курс не найден</p>';
    return;
  }

  const container = document.getElementById('course-content');
  if (!container) return;

  let daysHtml = '';
  course.schedule.forEach((day, index) => {
    daysHtml += `
      <div class="day-card" onclick="startCourseDay('${course.id}', ${index})">
        <div class="day-info">
          <h3>День ${index + 1}: ${day.name}</h3>
          <p>${day.exercises.length} упражнений</p>
        </div>
        <span class="day-arrow"><i data-lucide="chevron-right"></i></span>
      </div>`;
  });

  container.innerHTML = `
    <div class="course-detail-header">
      <h1>${course.title}</h1>
      <p>${course.description}</p>

      <div class="course-stats">
        <span><b>Сложность:</b> ${course.level === 'beginner' ? 'Начальный' : 'Продвинутый'}</span>
        <span><b>Длительность:</b> ${course.duration}</span>
      </div>
    </div>

    <div class="course-rules">
      <div class="rule-item">
        <h4><i data-lucide="calendar-check"></i> Как тренироваться</h4>
        <p>Тренируйтесь 3 раза в неделю. Отдых между тренировками — 1-2 дня.</p>
      </div>
    </div>

    <h2 style="margin-top: 30px; margin-bottom: 15px;">Расписание</h2>
    <div class="days-list">
      ${daysHtml}
    </div>
  `;

  refreshLucideIcons(); // ✅ оживляем иконки в сгенерированном HTML
}

function startCourseDay(courseId, dayIndex) {
  try {
    localStorage.setItem('currentWorkoutSource', 'course');
    localStorage.setItem('currentWorkoutDayIndex', dayIndex);
    localStorage.setItem('currentCourseId', courseId);
  } catch (e) {
    console.warn("Не удалось сохранить прогресс в память");
  }
  window.location.href = 'workout-process.html';
}

// ==========================================
// === 7. ЛОГИКА МОДАЛКИ И ТАЙМЕРА ===
// ==========================================

function showExerciseDetail(exerciseId, level) {
  const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
  if (!exercise) return;

  const levelData = exercise.levels[level] || exercise.levels['beginner'];
  const modal = document.getElementById('exercise-modal');
  if (!modal) return;

  if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
  workoutState.timerInterval = null;

  workoutState.currentSet = 1;
  workoutState.totalSets = exercise.sets || 3;
  workoutState.restTime = levelData.restTime || 60;

  modal.querySelector('.modal-title').innerText = exercise.name;
  modal.querySelector('.modal-desc').innerText = exercise.description;
  modal.querySelector('.modal-weight').innerText = levelData.weight;
  modal.querySelector('.modal-reps').innerText = levelData.reps;
  modal.querySelector('.modal-advice').innerText = levelData.advice;

  updateSetsCounter();

  const startBtn = document.getElementById('action-btn');
  const timerBlock = document.getElementById('timer-block');
  const timerCircle = document.querySelector('.timer-circle');

  if (startBtn) {
    startBtn.style.display = 'block';
    startBtn.innerText = 'Начать подход 1';
    setActionButtonState(startBtn, 'primary');
    startBtn.onclick = () => handleWorkoutAction(startBtn);
  }

  if (timerBlock) {
    timerBlock.style.display = 'none';
    removeRestSkipButton();
  }

  setTimerCircleState(timerCircle, 'none');

  modal.classList.add('active');
  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
}

function updateSetsCounter() {
  const counter = document.getElementById('sets-counter');
  if (counter) counter.innerText = `Подход ${workoutState.currentSet} / ${workoutState.totalSets}`;
}

function handleWorkoutAction(button) {
  const currentText = button.innerText;

  if (currentText.includes('Начать подход')) {
    button.innerText = `Завершить подход ${workoutState.currentSet}`;
    setActionButtonState(button, 'warning');
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
    return;
  }

  if (currentText.includes('Завершить подход')) {
    startRestTimer(button);
    return;
  }

  if (currentText.includes('Закрыть')) {
    closeExerciseModal();
  }
}

function ensureRestSkipButton() {
  const container = document.querySelector('.timer-container');
  if (!container) return;

  let btn = document.getElementById('rest-skip-btn');
  if (btn) return;

  btn = document.createElement('button');
  btn.id = 'rest-skip-btn';
  btn.className = 'rest-skip-btn';
  btn.type = 'button';
  btn.textContent = 'Пропустить отдых';
  btn.onclick = () => skipRest();

  container.appendChild(btn);
}

function removeRestSkipButton() {
  const btn = document.getElementById('rest-skip-btn');
  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
}

function startRestTimer(button) {
  button.style.display = 'none';

  const timerBlock = document.getElementById('timer-block');
  const timerText = document.getElementById('timer-text');
  const timerCircle = document.querySelector('.timer-circle');

  if (!timerBlock || !timerText || !timerCircle) {
    console.error('Ошибка: Не найдены элементы таймера!');
    return;
  }

  // ✅ сохраняем ссылки для "пропустить отдых"
  workoutState.restButtonRef = button;
  workoutState.restTimerBlockRef = timerBlock;

  timerBlock.style.display = 'flex';
  ensureRestSkipButton();

  let timeLeft = workoutState.restTime;
  timerText.innerText = timeLeft;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  timerCircle.style.strokeDasharray = String(circumference);
  timerCircle.style.strokeDashoffset = '0';

  setTimerCircleState(timerCircle, 'ok');

  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');

  if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
  workoutState.timerInterval = setInterval(() => {
    timeLeft--;
    timerText.innerText = timeLeft;

    const offset = circumference - (timeLeft / workoutState.restTime) * circumference;
    timerCircle.style.strokeDashoffset = String(offset);

    if (timeLeft <= 3) {
      setTimerCircleState(timerCircle, 'danger');
      if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    if (timeLeft <= 0) {
      clearInterval(workoutState.timerInterval);
      workoutState.timerInterval = null;
      removeRestSkipButton();
      nextSet(button, timerBlock);
    }
  }, 1000);
}

// ✅ Новая функция: пропустить отдых
function skipRest() {
  if (workoutState.timerInterval) {
    clearInterval(workoutState.timerInterval);
    workoutState.timerInterval = null;
  }

  const button = workoutState.restButtonRef;
  const timerBlock = workoutState.restTimerBlockRef;

  removeRestSkipButton();

  if (timerBlock) timerBlock.style.display = 'none';

  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('medium');

  if (button && timerBlock) {
    nextSet(button, timerBlock);
  }
}

function nextSet(button, timerBlock) {
  workoutState.currentSet++;
  updateSetsCounter();

  if (workoutState.currentSet > workoutState.totalSets) {
    finishExercise(button, timerBlock);
  } else {
    timerBlock.style.display = 'none';
    button.style.display = 'block';
    button.innerText = `Начать подход ${workoutState.currentSet}`;
    setActionButtonState(button, 'primary');
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
  }
}

function finishExercise(button, timerBlock) {
  const counter = document.getElementById('sets-counter');
  const modal = document.getElementById('exercise-modal');

  if (timerBlock) timerBlock.style.display = 'none';
  removeRestSkipButton();

  button.style.display = 'block';
  button.innerText = 'Закрыть';
  setActionButtonState(button, 'neutral');

  const timerCircle = document.querySelector('.timer-circle');
  setTimerCircleState(timerCircle, 'none');

  if (modal) {
    modal.querySelector('.modal-title').innerText = "Отлично!";
    modal.querySelector('.modal-desc').innerText = "Упражнение выполнено.";
  }
  if (counter) counter.innerText = "Готово 🎉";

  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function closeExerciseModal() {
  const modal = document.getElementById('exercise-modal');
  if (modal) modal.classList.remove('active');

  if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
  workoutState.timerInterval = null;

  removeRestSkipButton();

  workoutState.restButtonRef = null;
  workoutState.restTimerBlockRef = null;

  const timerCircle = document.querySelector('.timer-circle');
  setTimerCircleState(timerCircle, 'none');
}

// ==========================================
// === 8. ЛОГИКА ВЕСА (совместимость)
// ==========================================

function initWeightModule() {
  if (typeof initWeightSection === 'function') initWeightSection();
}

function addWeight() {
  if (typeof addNewWeight === 'function') {
    addNewWeight();
    return;
  }
  alert('Функция добавления веса недоступна: подключи js/weight.js');
}

function getHistory() {
  const keys = ['trainingHistory', 'workoutHistory', 'workoutSessions', 'trainingSessions', 'history'];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch (_) {}
  }
  return [];
}

function getWeightHistory() {
  // ⚠️ Раньше тут была рекурсия (функция вызывала сама себя через window.getWeightHistory),
  // что приводило к переполнению стека на страницах без js/weight.js.
  try { return JSON.parse(localStorage.getItem('weightHistory') || '[]'); }
  catch (e) { return []; }
}

// ==========================================
// === 9. ЗАПУСК ПРИЛОЖЕНИЯ ===
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Инициализации по страницам пусть делают сами страницы.
});
