// === ОБНОВЛЕННАЯ БАЗА ДАННЫХ С ИКОНКАМИ (SVG) ===
const EXERCISE_DATABASE = [
    // --- ГРУДЬ ---
    {
        id: 'pushups',
        name: 'Отжимания (классические)',
        muscle: 'chest',
        // SVG иконка (гантель/силушка) прямо в коде
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.5 6.5h11M6.5 17.5h11M4 10v4M20 10v4M6 12h12M4 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm20 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>`,
        description: 'Базовое упражнение для развития грудных мышц и трицепса без инвентаря.',
        levels: {
            beginner: { weight: 'Собственный вес', reps: '10-12 раз', time: 45, advice: 'Упор на колени, если тяжело. Спина прямая.' },
            intermediate: { weight: 'Собственный вес', reps: '15-20 раз', time: 60, advice: 'Опускайтесь медленно (3 сек), поднимайтесь быстро.' },
            pro: { weight: 'С рюкзаком 10-15 кг', reps: '15-20 раз', time: 90, advice: 'Максимальная амплитуда, грудь касается пола.' }
        }
    },
    {
        id: 'bench_press',
        name: 'Жим штанги лежа',
        muscle: 'chest',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 6v12M6 10v4M18 10v4"/></svg>`,
        description: 'Главное упражнение для массы грудных мышц.',
        levels: {
            beginner: { weight: 'Только гриф (20 кг)', reps: '12-15 раз', time: 60, advice: 'Изучите траекторию движения.' },
            intermediate: { weight: '40-50 кг', reps: '10-12 раз', time: 75, advice: 'Лопатки сведены, ноги плотно на полу.' },
            pro: { weight: '70-90% от 1ПМ', reps: '6-8 раз', time: 90, advice: 'Контролируемый негатив, страховка обязательна.' }
        }
    },
    {
        id: 'dumbbell_flyes',
        name: 'Разводка гантелей',
        muscle: 'chest',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M6 9l6 3l6 -3M6 15l6 -3l6 3"/></svg>`, // Условная иконка
        description: 'Изоляция для растяжения грудных мышц.',
        levels: {
            beginner: { weight: '4-6 кг', reps: '12 раз', time: 45, advice: 'Легкий вес, фокус на чувстве растяжения.' },
            intermediate: { weight: '8-12 кг', reps: '12 раз', time: 60, advice: 'Локти чуть согнуты.' },
            pro: { weight: '14-18 кг', reps: '10-12 раз', time: 60, advice: 'Работайте до жжения.' }
        }
    },

    // --- СПИНА ---
    {
        id: 'pull_ups',
        name: 'Подтягивания',
        muscle: 'back',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 0l-3-3m3 3l3-3M7 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/></svg>`,
        description: 'Лучшее упражнение для ширины спины.',
        levels: {
            beginner: { weight: 'Гравитрон (помощь)', reps: '8-10 раз', time: 60, advice: 'Фокус на сведении лопаток.' },
            intermediate: { weight: 'Собственный вес', reps: '10-12 раз', time: 75, advice: 'Подбородок выше перекладины.' },
            pro: { weight: 'Пояс с весом 10-20 кг', reps: '8-10 раз', time: 90, advice: 'Без рывков, чистая техника.' }
        }
    },
    {
        id: 'deadlift',
        name: 'Становая тяга',
        muscle: 'back',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4M6 16l6 -4l6 4"/></svg>`,
        description: 'Базовое упражнение для всей задней цепи мышц.',
        levels: {
            beginner: { weight: 'Гриф (20 кг)', reps: '10-12 раз', time: 60, advice: 'Спина идеально прямая!' },
            intermediate: { weight: '40-60 кг', reps: '8-10 раз', time: 75, advice: 'Гриф скользит по ногам.' },
            pro: { weight: '100+ кг', reps: '5-6 раз', time: 120, advice: 'Используйте пояс.' }
        }
    },

    // --- НОГИ ---
    {
        id: 'squats',
        name: 'Приседания',
        muscle: 'legs',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M7 21l3-9-2-3m7 12l-3-9 2-3"/></svg>`,
        description: 'Король упражнений для ног.',
        levels: {
            beginner: { weight: 'Собственный вес', reps: '15-20 раз', time: 60, advice: 'Пятки не отрывать.' },
            intermediate: { weight: 'Гантели 10-15 кг', reps: '15 раз', time: 75, advice: 'Глубокий присед.' },
            pro: { weight: 'Штанга 60-100 кг', reps: '8-10 раз', time: 90, advice: 'Взгляд прямо, спина напряжена.' }
        }
    },
    {
        id: 'lunges',
        name: 'Выпады',
        muscle: 'legs',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4l-4 16M8 8l4 4 4-4"/></svg>`,
        description: 'Развитие баланса и формы ног.',
        levels: {
            beginner: { weight: 'Собственный вес', reps: '10-12 на ногу', time: 60, advice: 'Колено не касается пола.' },
            intermediate: { weight: 'Гантели 8-12 кг', reps: '12 на ногу', time: 75, advice: 'Держите корпус вертикально.' },
            pro: { weight: 'Штанга 40-50 кг', reps: '10 на ногу', time: 90, advice: 'Сложная координация.' }
        }
    }
];

// === ОБНОВЛЕННАЯ ФУНКЦИЯ ОТРИСОВКИ (Исправляем вывод иконки) ===
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
            <div class="workout-icon">
                ${exercise.icon} <!-- Вставляем SVG код -->
            </div>
            <div class="workout-details">
                <h3>${exercise.name}</h3>
                <div class="workout-tags">
                    <span class="tag weight">${levelData.weight}</span>
                    <span class="tag reps">${levelData.reps}</span>
                </div>
                <p class="workout-advice">${levelData.advice}</p>
            </div>
            <div class="workout-action">
                <span>▶</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

// === ФУНКЦИЯ ОТКРЫТИЯ УПРАЖНЕНИЯ С ТАЙМЕРОМ ===
function showExerciseDetail(exerciseId, level) {
    const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    const levelData = exercise.levels[level];
    
    // Находим контейнер модалки (предполагаем, что он есть в HTML)
    const modal = document.getElementById('exercise-modal');
    if (!modal) {
        console.error('Modal not found! Add HTML for #exercise-modal');
        return;
    }

    // Заполняем данные
    modal.querySelector('.modal-title').innerText = exercise.name;
    modal.querySelector('.modal-desc').innerText = exercise.description;
    modal.querySelector('.modal-weight').innerText = levelData.weight;
    modal.querySelector('.modal-reps').innerText = levelData.reps;
    modal.querySelector('.modal-advice').innerText = levelData.advice;
    
    // Сохраняем время в кнопку
    const startBtn = modal.querySelector('.start-btn');
    startBtn.dataset.time = levelData.time || 60; // Время по умолчанию или из базы
    startBtn.dataset.name = exercise.name;

    // Показываем модалку
    modal.classList.add('active');
    
    // Вибрация при открытии
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
}

// === ФУНКЦИЯ СТАРТА ТАЙМЕРА ===
function startExerciseTimer(button) {
    const time = parseInt(button.dataset.time) || 60;
    const name = button.dataset.name;
    
    // Скрываем кнопку старта, показываем таймер
    const modal = document.getElementById('exercise-modal');
    const timerDisplay = modal.querySelector('.timer-display');
    const timerCircle = modal.querySelector('.timer-circle');
    
    button.style.display = 'none';
    timerDisplay.style.display = 'block';
    
    let timeLeft = time;
    timerDisplay.innerText = timeLeft;
    
    // Вибрация при старте
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');

    const interval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft;
        
        // Визуальный отсчет (опционально: изменение цвета)
        if (timeLeft <= 3) {
             timerCircle.style.stroke = '#FF4444'; // Краснеет в конце
             if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }

        if (timeLeft <= 0) {
            clearInterval(interval);
            
            // Фанфары или сигнал
            timerDisplay.innerText = "Готово!";
            timerCircle.style.stroke = '#00E676';
            
            // Сильная вибрация
            if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            
            // Вернуть кнопку через 2 секунды
            setTimeout(() => {
                button.style.display = 'block';
                timerDisplay.style.display = 'none';
                timerCircle.style.stroke = '#00E676'; // Сброс цвета
            }, 2000);
        }
    }, 1000);
}

// === ФУНКЦИЯ РЕНДЕРИНГА (Отрисовки) ===
// Она принимает ID контейнера, группу мышц и уровень
function renderWorkoutList(containerId, muscleGroup, level = 'beginner') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. Фильтруем базу данных
    let filtered = EXERCISE_DATABASE;
    if (muscleGroup !== 'all') {
        filtered = EXERCISE_DATABASE.filter(ex => ex.muscle === muscleGroup);
    }

    // 2. Проверка на пустоту (страховка)
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align:center; padding: 40px; color: #888;">
                <img src="https://img.icons8.com/fluency/96/000000/no-entries.png" alt="Empty">
                <p>Тренировки для этого раздела скоро появятся!</p>
            </div>`;
        return;
    }

    // 3. Генерируем HTML
    let html = '';
    filtered.forEach(exercise => {
        // Получаем данные для нужного уровня
        const levelData = exercise.levels[level] || exercise.levels['beginner'];
        
        html += `
        <div class="workout-card" onclick="showExerciseDetail('${exercise.id}', '${level}')">
            <div class="workout-icon">
                <img src="${exercise.image}" alt="${exercise.name}">
            </div>
            <div class="workout-details">
                <h3>${exercise.name}</h3>
                <div class="workout-tags">
                    <span class="tag weight">${levelData.weight}</span>
                    <span class="tag reps">${levelData.reps}</span>
                </div>
                <p class="workout-advice">${levelData.advice}</p>
            </div>
            <div class="workout-action">
                <span>➜</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

// === ФУНКЦИЯ ПОКАЗА ДЕТАЛЕЙ (вместо alert) ===
function showExerciseDetail(exerciseId, level) {
    const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
    if (!exercise) return;
    
    const levelData = exercise.levels[level];
    
    // Создаем простую модалку или используем вашу
    // Пример с системным alert для быстрой проверки, потом заменим на вашу модалку
    alert(`Упражнение: ${exercise.name}\nВес: ${levelData.weight}\nПовторы: ${levelData.reps}\nСовет: ${levelData.advice}`);
    
    // ВИБРАЦИЯ
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
}

// --- ПОЛНАЯ ЛОГИКА ВЕСА И ГРАФИКА ---

// 1. Ключ для хранения
const WEIGHT_KEY = 'weightHistory';

// 2. Получить данные из памяти
function getWeightHistory() {
    const data = localStorage.getItem(WEIGHT_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    return [];
}

// 3. Сохранить данные
function saveWeightHistory(history) {
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(history));
}

// 4. Функция обновления цифры в заголовке (Её не хватало в вашем куске)
function updateDashboardStats(history) {
    const weightDisplayEl = document.getElementById('current-weight-display');
    
    // Если элемент найден на странице (в профиле)
    if (weightDisplayEl) {
        if (history && history.length > 0) {
            // Берем последний вес
            const lastWeight = history[history.length - 1].weight;
            weightDisplayEl.textContent = lastWeight;
        } else {
            weightDisplayEl.textContent = '--';
        }
    }
}

// 5. Инициализация при старте
function initWeightModule() {
    const history = getWeightHistory();
    
    // Если есть данные, обновляем график и цифру
    if (history.length > 0) {
        updateWeightChart(history);
        updateDashboardStats(history); // Вызываем обновление цифры
    }
}

// 6. Добавление нового веса
function addWeight() {
    const input = document.getElementById('weight-input');
    const value = parseFloat(input.value);

    if (!value || isNaN(value)) {
        alert('Введите корректное значение веса');
        return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
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
    updateDashboardStats(history); // И здесь тоже обновляем цифру

    closeModal('weight-modal');
    
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

// 7. Функция отрисовки графика
function updateWeightChart(history) {
    const ctx = document.getElementById('weightChart');
    // Если элемента нет (мы не на странице профиля), просто выходим
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
                    y: { 
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#aaa' }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#aaa' }
                    }
                }
            }
        });
    }
}

// 8. Запуск при загрузке страницы
// ВАЖНО: Если у вас УЖЕ есть document.addEventListener('DOMContentLoaded') в файле,
// то НЕ копируйте эти строки целиком, а просто добавьте вызов initWeightModule(); ВНУТРЬ существующего блока.
document.addEventListener('DOMContentLoaded', () => {
    // ... возможный другой ваш код ...
    initWeightModule(); 
});
