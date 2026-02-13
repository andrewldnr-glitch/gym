// js/weight.js

const WEIGHT_KEY = 'weightHistory';

function getWeightHistory() {
    try {
        const data = localStorage.getItem(WEIGHT_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveWeightToHistory(weight) {
    try {
        const history = getWeightHistory();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        const existingIndex = history.findIndex(e => e.date === today);
        
        if (existingIndex > -1) {
            history[existingIndex].weight = weight;
        } else {
            history.push({ date: today, weight: weight });
        }
        
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        localStorage.setItem(WEIGHT_KEY, JSON.stringify(history));
        return true;
    } catch (e) {
        console.error("Error saving weight", e);
        return false;
    }
}

function initWeightSection() {
    const history = getWeightHistory();
    const lastEntry = history.length > 0 ? history[history.length - 1] : null;
    
    const displayEl = document.getElementById('current-weight-display');
    if (displayEl) {
        if (lastEntry) {
            displayEl.innerHTML = `${lastEntry.weight} <small>кг</small>`;
        } else {
            displayEl.innerHTML = '-- <small>кг</small>';
        }
    }
    
    renderChart(history);
    renderWeightList(history.slice(-5).reverse());
}

function addNewWeight() {
    const input = document.getElementById('weight-input');
    if (!input) return;
    
    // Заменяем запятую на точку для корректного парсинга
    let val = input.value.replace(',', '.');
    const weight = parseFloat(val);
    
    if (isNaN(weight) || weight < 30 || weight > 300) {
        alert('Введите корректный вес (30-300 кг)');
        return;
    }
    
    if (saveWeightToHistory(weight)) {
        input.value = ''; // Очищаем поле только если сохранение прошло успешно
        initWeightSection();
        
        // Проверяем достижения
        if (typeof checkAllAchievements === 'function') {
            checkAllAchievements();
        }
        
        // Вибрация
        if (window.Telegram && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    }
}

function renderWeightList(data) {
    const list = document.getElementById('weight-history-list');
    if (!list) return;
    
    if (!data || data.length === 0) {
        list.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem;">Нет записей</p>';
        return;
    }
    
    list.innerHTML = '';
    
    data.forEach((item, index, arr) => {
        const div = document.createElement('div');
        div.className = 'weight-history-item';
        
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
        
        let diffHtml = '';
        // Сравниваем текущую запись с предыдущей (в массиве они идут от новых к старым)
        if (index < arr.length - 1) {
            const prevItem = arr[index + 1];
            const diff = item.weight - prevItem.weight;
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

function renderChart(history) {
    const ctx = document.getElementById('weightChart');
    if (!ctx) return;

    // Если библиотека Chart.js не загрузилась
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is missing');
        // Можно показать текст на канвасе или скрыть его
        return; 
    }

    if (history.length === 0) {
        ctx.style.display = 'none';
        return;
    }
    ctx.style.display = 'block';

    const labels = history.map(e => {
        const d = new Date(e.date);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });
    
    const data = history.map(e => e.weight);

    // Уничтожаем старый график перед созданием нового
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
                tension: 0.3,
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
