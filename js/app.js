// ==========================================
// === 1. БАЗА ДАННЫХ УПРАЖНЕНИЙ (С ПОДХОДАМИ) ===
// ==========================================

const EXERCISE_DATABASE = [
    // --- ГРУДЬ ---
    {
        id: 'pushups',
        name: 'Отжимания',
        muscle: 'chest',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h12"/></svg>`,
        description: 'Базовое упражнение для грудных мышц и трицепса.',
        sets: 3, // Количество подходов
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
    }
];

// ==========================================
// === 2. СОСТОЯНИЕ ТРЕНИРОВКИ ===
// ==========================================

let workoutState = {
    currentSet: 1,
    totalSets: 3,
    restTime: 60,
    timerInterval: null
};

// ==========================================
// === 3. ФУНКЦИИ ИНТЕРФЕЙСА (ОТРИСОВКА) ===
// ==========================================

function renderWorkoutList(containerId, muscleGroup, level = 'beginner') {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtered = EXERCISE_DATABASE;
    if (muscleGroup !== 'all') {
        filtered = EXERCISE_DATABASE.filter(ex => ex.muscle === muscleGroup);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state" style="text-align:center; padding: 40px; color: #888;"><p>Тренировок нет.</p></div>`;
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

// ==========================================
// === 4. ЛОГИКА МОДАЛКИ И ТАЙМЕРА ===
// ==========================================

function showExerciseDetail(exerciseId, level) {
    const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    const levelData = exercise.levels[level];
    const modal = document.getElementById('exercise-modal');
    
    if (!modal) {
        console.error('Modal not found');
        return;
    }

    // Сброс состояния
    if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
    workoutState.currentSet = 1;
    workoutState.totalSets = exercise.sets || 3;
    workoutState.restTime = levelData.restTime || 60;

    // Заполнение данных
    modal.querySelector('.modal-title').innerText = exercise.name;
    modal.querySelector('.modal-desc').innerText = exercise.description;
    modal.querySelector('.modal-weight').innerText = levelData.weight;
    modal.querySelector('.modal-reps').innerText = levelData.reps;
    modal.querySelector('.modal-advice').innerText = levelData.advice;
    
    // Сброс интерфейса
    updateSetsCounter();
    const startBtn = modal.querySelector('.start-btn');
    const timerBlock = modal.querySelector('.timer-block'); // Исправлено на timer-block согласно HTML из пред. ответа
    
    if (startBtn) {
        startBtn.style.display = 'block';
        startBtn.innerText = 'Начать подход 1';
        startBtn.onclick = () => handleWorkoutAction(startBtn); // Привязываем обработчик
    }
    if (timerBlock) {
        timerBlock.style.display = 'none';
    }
    
    modal.classList.add('active');
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
}

function updateSetsCounter() {
    const counter = document.getElementById('sets-counter');
    if (counter) {
        counter.innerText = `Подход ${workoutState.currentSet} / ${workoutState.totalSets}`;
    }
}

function handleWorkoutAction(button) {
    // Если тренировка завершена
    if (workoutState.currentSet > workoutState.totalSets) {
        finishExercise(button);
        return;
    }
    // Иначе начинаем отдых
    startRestTimer(button);
}

function startRestTimer(button) {
    button.style.display = 'none';
    
    // Ищем элементы динамически или используем сохраненные ссылки
    const modal = document.getElementById('exercise-modal');
    const timerBlock = document.getElementById('timer-block') || modal.querySelector('.timer-block');
    const timerText = document.getElementById('timer-text') || modal.querySelector('.timer-text');
    const timerCircle = modal.querySelector('.timer-circle');

    if (!timerBlock || !timerText || !timerCircle) {
        console.error('Timer elements missing in HTML!');
        return;
    }

    timerBlock.style.display = 'flex';
    
    let timeLeft = workoutState.restTime;
    timerText.innerText = timeLeft;
    
    // Анимация круга
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    timerCircle.style.strokeDasharray = circumference;
    timerCircle.style.strokeDashoffset = 0;
    timerCircle.style.stroke = '#00E676';

    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');

    workoutState.timerInterval = setInterval(() => {
        timeLeft--;
        timerText.innerText = timeLeft;
        
        const offset = circumference - (timeLeft / workoutState.restTime) * circumference;
        timerCircle.style.strokeDashoffset = offset;

        if (timeLeft <= 3) {
            timerCircle.style.stroke = '#FF4444';
            if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        if (timeLeft <= 0) {
            clearInterval(workoutState.timerInterval);
            nextSet(button, timerBlock);
        }
    }, 1000);
}

function nextSet(button, timerBlock) {
    workoutState.currentSet++;
    updateSetsCounter();

    if (workoutState.currentSet > workoutState.totalSets) {
        finishExercise(button);
    } else {
        timerBlock.style.display = 'none';
        button.style.display = 'block';
        button.innerText = `Начать подход ${workoutState.currentSet}`;
        if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    }
}

function finishExercise(button) {
    const modal = document.getElementById('exercise-modal');
    const timerBlock = document.getElementById('timer-block') || modal.querySelector('.timer-block');
    const counter = document.getElementById('sets-counter');
    
    if(timerBlock) timerBlock.style.display = 'none';
    button.style.display = 'block';
    button.innerText = 'Закрыть';
    button.onclick = () => {
        closeExerciseModal();
        // Сбрасываем onclick обратно на стандартный
        button.onclick = () => handleWorkoutAction(button);
    };
    
    modal.querySelector('.modal-title').innerText = "Отлично!";
    modal.querySelector('.modal-desc').innerText = "Упражнение выполнено.";
    if(counter) counter.innerText = "Готово 🎉";
    
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function closeExerciseModal() {
    const modal = document.getElementById('exercise-modal');
    if (modal) modal.classList.remove('active');
    if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
}

// ==========================================
// === 5. ЛОГИКА ВЕСА И ГРАФИКА ===
// ==========================================

const WEIGHT_KEY = 'weightHistory';

function getWeightHistory() {
    const data = localStorage.getItem(WEIGHT_KEY);
    if (data) {
        try { return JSON.parse(data); } 
        catch (e) { return []; }
    }
    return [];
}

function saveWeightHistory(history) {
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(history));
}

function updateDashboardStats(history) {
    const weightDisplayEl = document.getElementById('current-weight-display');
    if (weightDisplayEl) {
        if (history && history.length > 0) {
            const lastWeight = history[history.length - 1].weight;
            weightDisplayEl.textContent = lastWeight;
        } else {
            weightDisplayEl.textContent = '--';
        }
    }
}

function initWeightModule() {
    const history = getWeightHistory();
    if (history.length > 0) {
        updateWeightChart(history);
        updateDashboardStats(history);
    }
}

function addWeight() {
    const input = document.getElementById('weight-input');
    const value = parseFloat(input.value);
    if (!value || isNaN(value)) {
        alert('Введите корректное значение веса');
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    let history = getWeightHistory();
    const existingIndex = history.findIndex(item => item.date === today);
    if (existingIndex >= 0) {
        history[existingIndex].weight = value;
    } else {
        history.push({ date: today, weight: value });
    }
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveWeightHistory(history);
    updateWeightChart(history);
    updateDashboardStats(history);
    closeModal('weight-modal');
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

function updateWeightChart(history) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return; 
    const labels = history.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    const data = history.map(item => item.weight);
    if (window.myWeightChart) {
        window.myWeightChart.data.labels = labels;
        window.myWeightChart.data.datasets[0].data = data;
        window.myWeightChart.update();
    } else {
        window.myWeightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Вес (кг)',
                    data: data,
                    borderColor: '#00E676',
                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
                    x: { grid: { display: false }, ticks: { color: '#aaa' } }
                }
            }
        });
    }
}

// ==========================================
// === 6. ЗАПУСК ПРИЛОЖЕНИЯ ===
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initWeightModule(); 
});
