// === БАЗА ДАННЫХ УПРАЖНЕНИЙ ===
// Добавляем прямо в код, чтобы данные всегда были доступны
const EXERCISE_DATABASE = [
    // --- ГРУДЬ ---
    {
        id: 'pushups',
        name: 'Отжимания (классические)',
        muscle: 'chest',
        image: 'https://img.icons8.com/fluency/96/push-ups.png', // Заглушка, замените на свои картинки
        description: 'Базовое упражнение для развития грудных мышц и трицепса.',
        levels: {
            beginner: { weight: 'Собственный вес', reps: '10-12 раз', advice: 'Упор на колени, если тяжело. Спина прямая.' },
            intermediate: { weight: 'Собственный вес', reps: '15-20 раз', advice: 'Опускайтесь медленно (3 сек), поднимайтесь быстро.' },
            pro: { weight: 'С рюкзаком 10-15 кг', reps: '15-20 раз', advice: 'Максимальная амплитуда, грудь касается пола.' }
        }
    },
    {
        id: 'bench_press',
        name: 'Жим штанги лежа',
        muscle: 'chest',
        image: 'https://img.icons8.com/fluency/96/bench-press.png',
        description: 'Главное упражнение для массы грудных мышц.',
        levels: {
            beginner: { weight: 'Только гриф (20 кг)', reps: '12-15 раз', advice: 'Изучите траекторию движения, не прогибайте спину.' },
            intermediate: { weight: '40-50 кг', reps: '10-12 раз', advice: 'Лопатки сведены, ноги плотно на полу.' },
            pro: { weight: '70-90% от 1ПМ', reps: '6-8 раз', advice: 'Контролируемый негатив, страховка обязательна.' }
        }
    },
    {
        id: 'dumbbell_flyes',
        name: 'Разводка гантелей',
        muscle: 'chest',
        image: 'https://img.icons8.com/fluency/96/dumbbell.png',
        description: 'Изоляция для растяжения грудных мышц.',
        levels: {
            beginner: { weight: '4-6 кг', reps: '12 раз', advice: 'Легкий вес, фокус на чувстве растяжения.' },
            intermediate: { weight: '8-12 кг', reps: '12 раз', advice: 'Локти чуть согнуты, не ударяйте гантели друг о друга.' },
            pro: { weight: '14-18 кг', reps: '10-12 раз', advice: 'Работайте до жжения в середине груди.' }
        }
    },

    // --- СПИНА ---
    {
        id: 'pull_ups',
        name: 'Подтягивания',
        muscle: 'back',
        image: 'https://img.icons8.com/fluency/96/pull-up.png',
        description: 'Лучшее упражнение для ширины спины.',
        levels: {
            beginner: { weight: 'Гравитрон (помощь)', reps: '8-10 раз', advice: 'Если нет гравитрона, используйте стул под ноги.' },
            intermediate: { weight: 'Собственный вес', reps: '10-12 раз', advice: 'Подбородок выше перекладины, сводите лопатки.' },
            pro: { weight: 'Пояс с весом 10-20 кг', reps: '8-10 раз', advice: 'Без рывков, чистая техника.' }
        }
    },
    {
        id: 'deadlift',
        name: 'Становая тяга',
        muscle: 'back',
        image: 'https://img.icons8.com/fluency/96/deadlift.png',
        description: 'Базовое упражнение для всей задней цепи мышц.',
        levels: {
            beginner: { weight: 'Гриф (20 кг)', reps: '10-12 раз', advice: 'Спина идеально прямая! Отводите таз назад.' },
            intermediate: { weight: '40-60 кг', reps: '8-10 раз', advice: 'Гриф скользит по ногам, не округляйте поясницу.' },
            pro: { weight: '100+ кг', reps: '5-6 раз', advice: 'Используйте пояс и магнезию.' }
        }
    },

    // --- НОГИ ---
    {
        id: 'squats',
        name: 'Приседания',
        muscle: 'legs',
        image: 'https://img.icons8.com/fluency/96/squats.png',
        description: 'Король упражнений для ног.',
        levels: {
            beginner: { weight: 'Собственный вес', reps: '15-20 раз', advice: 'Пятки не отрывать, колени за носки не выходят.' },
            intermediate: { weight: 'Гантели 10-15 кг', reps: '15 раз', advice: 'Глубокий присед, бедро параллельно полу.' },
            pro: { weight: 'Штанга 60-100 кг', reps: '8-10 раз', advice: 'Взгляд прямо, спина напряжена, мощный подъем.' }
        }
    },
    {
        id: 'lunges',
        name: 'Выпады',
        muscle: 'legs',
        image: 'https://img.icons8.com/fluency/96/lunges.png',
        description: 'Развитие баланса и формы ног.',
        levels: {
            beginner: { weight: 'Собственный вес', reps: '10-12 на ногу', advice: 'Широкий шаг, колено не касается пола.' },
            intermediate: { weight: 'Гантели 8-12 кг', reps: '12 на ногу', advice: 'Держите корпус вертикально.' },
            pro: { weight: 'Штанга 40-50 кг', reps: '10 на ногу', advice: 'Сложная координация, следите за равновесием.' }
        }
    }
];

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
