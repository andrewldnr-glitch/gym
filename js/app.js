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
