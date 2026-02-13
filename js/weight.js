// js/weight.js

const WEIGHT_KEY = 'weightHistory';

// Получить историю веса
function getWeightHistory() {
    const data = localStorage.getItem(WEIGHT_KEY);
    return data ? JSON.parse(data) : [];
}

// Сохранить новый вес
function saveWeightToHistory(weight) {
    const history = getWeightHistory();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Проверяем, есть ли уже запись за сегодня
    const existingIndex = history.findIndex(e => e.date === today);
    
    if (existingIndex > -1) {
        // Обновляем вес за сегодня
        history[existingIndex].weight = weight;
    } else {
        // Добавляем новую запись
        history.push({ date: today, weight: weight });
    }
    
    // Сортируем по дате (старые -> новые)
    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(history));
}

// Инициализация раздела веса
function initWeightSection() {
    const history = getWeightHistory();
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    
    // Отображение текущего веса
    if (lastEntry) {
        document.getElementById('current-weight-display').innerHTML = `${lastEntry.weight} <small>кг</small>`;
    } else {
        document.getElementById('current-weight-display').innerHTML = '-- <small>кг</small>`;
    }
    
    // Отрисовка графика
    renderChart(history);
    
    // Отрисовка истории (последние 5)
    renderWeightList(history.slice(-5).reverse());
}

// Добавление веса (вызывается кнопкой)
function addNewWeight() {
    const input = document.getElementById('weight-input');
    const weight = parseFloat(input.value);
    
    if (!weight || weight < 30 || weight > 300) {
        // Можно использовать Telegram Alert
        alert('Введите корректный вес (30-300 кг)');
        return;
    }
    
    saveWeightToHistory(weight);
    input.value = ''; // Очистка поля
    
    // Обновляем UI
    initWeightSection();
    
    // Вибрация
    if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
}

// Отрисовка списка
function renderWeightList(data) {
    const list = document.getElementById('weight-history-list');
    if (!list) return;
    
    if (data.length === 0) {
        list.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">Нет записей</p>';
        return;
    }
    
    list.innerHTML = '';
    
    // Для расчета разницы берем полный массив истории (реверс)
    // Но нам нужны только переданные data
    
    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'weight-history-item';
        
        // Форматирование даты
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        
        // Разница с предыдущим (так как массив перевернут, предыдущий - это index+1 в исходном)
        // Проще взять diff из логики: data[index] vs data[index+1] (в этом реверснутом массиве это "сегодня" vs "вчера")
        let diffHtml = '';
        // Нам нужно сравнить с *предыдущим днем*, в реверсном массиве это следующий элемент
        // Но мы передали slice(-5).reverse(), так что порядок: [сегодня, вчера, позавчера...]
        // Значит сравниваем текущий (index) со следующим (index+1) в этом массиве
        if (index < data.length - 1) {
            const prevWeight = data[index + 1].weight;
            const diff = item.weight - prevWeight;
            if (diff > 0) diffHtml = `<span class="diff-val diff-plus">+${diff.toFixed(1)}</span>`;
            if (diff < 0) diffHtml = `<span class="diff-val diff-minus">${diff.toFixed(1)}</span>`;
        }
        
        div.innerHTML = `
            <span class="date-val">${dateStr}</span>
            <span class="weight-val">${item.weight} кг ${diffHtml}</span>
        `;
        list.appendChild(div);
    });
}

// Отрисовка графика
function renderChart(history) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;
    
    // Если история пуста, прячем график
    if (history.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    ctx.style.display = 'block';

    // Подготовка данных для Chart.js
    const labels = history.map(e => {
        const d = new Date(e.date);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const data = history.map(e => e.weight);

    // Уничтожаем старый график, если он есть (чтобы не дублировался)
    const chartInstance = Chart.getChart('weightChart');
    if (chartInstance) {
        chartInstance.destroy();
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Вес (кг)',
                data: data,
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 2,
                tension: 0.3, // Закругление линий
                fill: true,
                pointBackgroundColor: '#FF6B35',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8E8E93' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8E8E93' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
