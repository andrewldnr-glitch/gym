// js/weight.js

const WEIGHT_KEY = 'weightHistory';
const PENDING_WEIGHT_KEY = 'pendingWeightSync';
const WEIGHT_SYNC_STATUS_ID = 'weight-sync-status';

// Храним инстанс графика (надёжнее, чем Chart.getChart)
let __weightChartInstance = null;
let __pendingSyncInFlight = false;

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (_) {
    return fallback;
  }
}

// Нормализуем любые значения дат к виду YYYY-MM-DD
// (Supabase может вернуть measured_at как date или timestamptz)
function normalizeDateToDay(dateLike) {
  if (!dateLike) return '';
  const s = String(dateLike);
  return s.includes('T') ? s.split('T')[0] : s;
}

// ВАЖНО: toISOString() даёт дату в UTC. Для веса обычно нужна локальная дата.
function getLocalISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getPendingWeightSync() {
  try {
    const raw = localStorage.getItem(PENDING_WEIGHT_KEY);
    const arr = raw ? safeJsonParse(raw, []) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

function setPendingWeightSync(list) {
  try {
    localStorage.setItem(PENDING_WEIGHT_KEY, JSON.stringify(Array.isArray(list) ? list : []));
  } catch (_) {}
}

function upsertPendingWeight(date, weight) {
  const d = normalizeDateToDay(date);
  if (!d) return;
  const pending = getPendingWeightSync();
  const idx = pending.findIndex(x => normalizeDateToDay(x?.date) === d);
  const item = { date: d, weight: Number(weight), ts: new Date().toISOString() };
  if (idx >= 0) pending[idx] = item;
  else pending.push(item);
  setPendingWeightSync(pending);
}

function removePendingWeight(date) {
  const d = normalizeDateToDay(date);
  if (!d) return;
  const pending = getPendingWeightSync().filter(x => normalizeDateToDay(x?.date) !== d);
  setPendingWeightSync(pending);
}

function setWeightSyncStatus(text, kind /* 'ok' | 'pending' | 'fail' */) {
  try {
    let el = document.getElementById(WEIGHT_SYNC_STATUS_ID);
    if (!el) {
      const host = document.querySelector('.weight-section') || document.body;
      if (!host) return;
      el = document.createElement('div');
      el.id = WEIGHT_SYNC_STATUS_ID;
      el.style.marginTop = '8px';
      el.style.fontSize = '0.85rem';
      el.style.color = 'var(--text-secondary)';
      host.appendChild(el);
    }

    el.textContent = text || '';
    el.dataset.kind = kind || '';

    // Небольшой визуальный акцент (без CSS правок)
    if (kind === 'ok') el.style.opacity = '0.9';
    if (kind === 'pending') el.style.opacity = '0.9';
    if (kind === 'fail') el.style.opacity = '1';
  } catch (_) {}
}

async function syncWeightToSupabase(measured_at, weight) {
  const dateOnly = normalizeDateToDay(measured_at) || getLocalISODate();

  // Если api.js не подключен — синхронизации не будет.
  if (typeof window.apiSyncWeight !== 'function') {
    console.warn('[sync] apiSyncWeight is not a function (js/api.js not loaded?)');
    return false;
  }

  // Если не внутри Telegram WebApp — initData пустая, Edge Function отвергнет запрос.
  const initData = (window.Telegram && window.Telegram.WebApp) ? (window.Telegram.WebApp.initData || '') : '';
  if (!initData) {
    console.warn('[sync] Telegram initData is empty — skip supabase sync (open inside Telegram to enable sync)');
    return false;
  }

  try {
    // 1) Основная попытка: YYYY-MM-DD
    await window.apiSyncWeight(dateOnly, Number(weight));
    return true;
  } catch (err) {
    console.warn('[sync] weight failed (dateOnly):', err);

    // 2) Fallback: иногда backend ждёт ISO timestamp. Пробуем "день + время".
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        const iso = `${dateOnly}T12:00:00.000Z`;
        await window.apiSyncWeight(iso, Number(weight));
        return true;
      }
    } catch (err2) {
      console.warn('[sync] weight fallback failed:', err2);
    }

    return false;
  }
}

async function flushPendingWeightSync() {
  if (__pendingSyncInFlight) return;
  __pendingSyncInFlight = true;

  try {
    const pending = getPendingWeightSync();
    if (!pending.length) return;

    // Не блокируем UI — но порядок важен
    const still = [];
    for (const item of pending) {
      const ok = await syncWeightToSupabase(item.date, item.weight);
      if (!ok) still.push(item);
      else removePendingWeight(item.date);
    }

    if (still.length) {
      setPendingWeightSync(still);
      setWeightSyncStatus('Есть несинхронизированные записи веса. Попробуем отправить позже.', 'fail');
    } else {
      setWeightSyncStatus('', 'ok');
    }
  } finally {
    __pendingSyncInFlight = false;
  }
}

// Экспортируем — profile.html может дергать это после bootstrap
window.flushPendingWeightSync = flushPendingWeightSync;

function getWeightHistory() {
  try {
    const data = localStorage.getItem(WEIGHT_KEY);
    const arr = data ? safeJsonParse(data, []) : [];
    if (!Array.isArray(arr)) return [];

    // Нормализуем даты (на случай, если прилетело timestamptz)
    return arr
      .map(x => ({
        date: normalizeDateToDay(x?.date),
        weight: Number(x?.weight)
      }))
      .filter(x => x.date && Number.isFinite(x.weight));
  } catch (e) {
    return [];
  }
}

function saveWeightToHistory(weight) {
  try {
    const history = getWeightHistory();
    const today = getLocalISODate(); // YYYY-MM-DD (локальная дата)

    const existingIndex = history.findIndex(e => normalizeDateToDay(e.date) === today);

    if (existingIndex > -1) {
      history[existingIndex].weight = weight;
    } else {
      history.push({ date: today, weight: weight });
    }

    history.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(WEIGHT_KEY, JSON.stringify(history));
    return true;
  } catch (e) {
    console.error('Error saving weight', e);
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

  // Пытаемся дослать всё, что не ушло раньше (не блокируя UI)
  try { flushPendingWeightSync(); } catch (_) {}
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

  const today = getLocalISODate();

  if (saveWeightToHistory(weight)) {
    input.value = '';
    initWeightSection();

    // ✅ Синхронизация в Supabase (не блокируем UI)
    setWeightSyncStatus('Синхронизация…', 'pending');

    // Сначала уберём старый pending на этот день — заменим на актуальный при необходимости
    removePendingWeight(today);

    syncWeightToSupabase(today, weight)
      .then((ok) => {
        if (ok) {
          removePendingWeight(today);
          setWeightSyncStatus('Синхронизировано', 'ok');
          // Можно убрать статус через пару секунд
          setTimeout(() => setWeightSyncStatus('', 'ok'), 2500);
        } else {
          // Если не получилось — сохраняем как "ожидает синхронизации"
          upsertPendingWeight(today, weight);

          // Если мы не в Telegram — прямо скажем
          const initData = (window.Telegram && window.Telegram.WebApp) ? (window.Telegram.WebApp.initData || '') : '';
          if (!initData) {
            setWeightSyncStatus('Сохранено локально. Для синхронизации с Supabase откройте приложение внутри Telegram.', 'fail');
          } else {
            setWeightSyncStatus('Сохранено локально. Не удалось синхронизировать — попробуем позже.', 'fail');
          }

          // Ошибочная вибрация (если доступна)
          try {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
              window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
            }
          } catch (_) {}
        }
      })
      .catch((e) => {
        console.warn('[sync] weight sync exception', e);
        upsertPendingWeight(today, weight);
        setWeightSyncStatus('Сохранено локально. Ошибка синхронизации — попробуем позже.', 'fail');
      });

    // Проверяем достижения
    if (typeof checkAllAchievements === 'function') {
      checkAllAchievements();
    }

    // Вибрация (локальное сохранение прошло)
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
