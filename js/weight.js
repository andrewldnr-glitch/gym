// js/weight.js

const WEIGHT_KEY = 'weightHistory';

// Храним инстанс графика (надёжнее, чем Chart.getChart)
let __weightChartInstance = null;

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
    const val = String(input.value || '').replace(',', '.');
    const weight = parseFloat(val);

    if (isNaN(weight) || weight < 30 || weight > 300) {
        alert('Введите корректный вес (30-300 кг)');
        return;
    }

    if (saveWeightToHistory(weight)) {
        input.value = '';
        initWeightSection();

        // ✅ Синхронизация в Supabase (не блокируем UI)
        try {
            const today = new Date().toISOString().split('T')[0];
            if (typeof window.apiSyncWeight === 'function') {
                window.apiSyncWeight(today, weight)
                    .then(() => console.log('[sync] weight ok', today, weight))
                    .catch(err => console.warn('[sync] weight failed', err));
            } else {
                console.warn('[sync] apiSyncWeight is not a function (js/api.js not loaded?)');
            }
        } catch (e) {
            console.warn('[sync] weight sync exception', e);
        }

        // Проверяем достижения
        if (typeof checkAllAchievements === 'function') {
            checkAllAchievements();
        }

        // Вибрация
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
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
    const canvas = document.getElementById('weightChart');
    if (!canvas) return;

    // Если Chart.js не загрузился
    if (typeof Chart === 'undefined') {
        console.error('Chart.js library is missing');
        return;
    }

    if (!history || history.length === 0) {
        canvas.style.display = 'none';
        if (__weightChartInstance) {
            __weightChartInstance.destroy();
            __weightChartInstance = null;
        }
        return;
    }

    canvas.style.display = 'block';

    const labels = history.map(e => {
        const d = new Date(e.date);
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    });

    const data = history.map(e => e.weight);

    // ✅ Надёжно пересоздаём график
    if (__weightChartInstance) {
        __weightChartInstance.destroy();
        __weightChartInstance = null;
    }

    __weightChartInstance = new Chart(canvas, {
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
