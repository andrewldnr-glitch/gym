// --- ЛОГИКА ВЕСА И ГРАФИКА ---

// 1. Ключ для хранения
const WEIGHT_KEY = 'weightHistory';

// 2. Получить данные из памяти (безопасная функция)
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

// 4. Инициализация при старте (Вставьте это в ваш DOMContentLoaded или в начало файла)
function initWeightModule() {
    // Загружаем сохраненную историю
    const history = getWeightHistory();
    
    // Если есть данные, обновляем график
    if (history.length > 0) {
        updateWeightChart(history);
        updateDashboardStats(history);
    }
}

// 5. Добавление нового веса (вызывается из модального окна)
function addWeight() {
    const input = document.getElementById('weight-input');
    const value = parseFloat(input.value);

    if (!value || isNaN(value)) {
        alert('Введите корректное значение веса');
        return;
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let history = getWeightHistory();

    // Проверяем, есть ли уже запись за сегодня
    const existingIndex = history.findIndex(item => item.date === today);

    if (existingIndex >= 0) {
        // Обновляем вес за сегодня
        history[existingIndex].weight = value;
    } else {
        // Добавляем новую запись
        history.push({ date: today, weight: value });
    }

    // Сортируем по дате (на всякий случай)
    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Сохраняем
    saveWeightHistory(history);

    // Обновляем интерфейс
    updateWeightChart(history);
    updateDashboardStats(history);

    // Закрываем модалку
    closeModal('weight-modal');
    
    // Вибрация
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

// 6. Функция отрисовки графика (Пример, адаптируйте под свою библиотеку Chart.js)
function updateWeightChart(history) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    const labels = history.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    const data = history.map(item => item.weight);

    // Если график уже создан, обновляем данные
    if (window.myWeightChart) {
        window.myWeightChart.data.labels = labels;
        window.myWeightChart.data.datasets[0].data = data;
        window.myWeightChart.update();
    } else {
        // Если нет, создаем новый
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

// ОБЯЗАТЕЛЬНО: Вызовите initWeightModule() при загрузке страницы
// Добавьте это в ваш основной слушатель DOMContentLoaded или просто вызовите в конце файла:
document.addEventListener('DOMContentLoaded', () => {
    // ... ваш другой код ...
    initWeightModule(); // <--- Это важно!
});
