// js/profile.js
// Логика страницы профиля (статистика + история тренировок)
// ВАЖНО: этот файл подключается в profile.html как <script src="js/profile.js"></script>

(() => {
  'use strict';

  const STATS_KEY = 'userStats';

  // Поддержим несколько возможных ключей истории (на будущее)
  const HISTORY_KEYS = [
    'trainingHistory',
    'workoutHistory',
    'workoutSessions',
    'trainingSessions',
    'history'
  ];

  function safeJsonParse(str, fallback) {
    try {
      return JSON.parse(str);
    } catch (_) {
      return fallback;
    }
  }

  function formatDate(dateLike) {
    if (!dateLike) return '-';
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function readHistory() {
    for (const key of HISTORY_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const arr = safeJsonParse(raw, null);
      if (Array.isArray(arr)) return { key, arr };
    }
    return { key: null, arr: [] };
  }

  function pickLastDate(stats, historyArr) {
    const fromStats =
      stats.lastTrainingDate ||
      stats.lastWorkoutDate ||
      stats.lastTraining ||
      stats.lastWorkout ||
      null;

    if (fromStats) return fromStats;

    // Попробуем вывести из истории
    if (historyArr && historyArr.length > 0) {
      const last = historyArr
        .map(x => x?.date || x?.finishedAt || x?.completedAt || x?.ts)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];

      return last || null;
    }

    return null;
  }

  function renderHistoryList(historyArr) {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    if (!historyArr || historyArr.length === 0) {
      listEl.innerHTML = '<p>Вы еще не завершили ни одной тренировки.</p>';
      return;
    }

    // Нормализуем записи и отсортируем по дате (новые сверху)
    const normalized = historyArr
      .map((x) => {
        const date = x?.date || x?.finishedAt || x?.completedAt || x?.ts || null;
        const title =
          x?.title ||
          x?.name ||
          x?.workoutName ||
          (x?.source === 'course' ? 'Тренировка (курс)' : 'Тренировка') ||
          'Тренировка';

        const extra =
          x?.level ? ` • ${x.level}` : '';

        return { date, title: `${title}${extra}` };
      })
      .filter(x => x.date); // оставим только те, где есть дата

    if (normalized.length === 0) {
      listEl.innerHTML = '<p>Вы еще не завершили ни одной тренировки.</p>';
      return;
    }

    normalized.sort((a, b) => new Date(b.date) - new Date(a.date));

    const top = normalized.slice(0, 10);
    listEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${top.map(item => `
          <div class="stat-item" style="display:flex; justify-content:space-between; align-items:center;">
            <div style="color:var(--text-primary); font-weight:600;">${item.title}</div>
            <div style="color:var(--text-secondary); font-size:0.9rem;">${formatDate(item.date)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Эту функцию вызывает profile.html при загрузке :contentReference[oaicite:3]{index=3}
  function updateStats() {
    const stats = safeJsonParse(localStorage.getItem(STATS_KEY) || '{}', {});

    const { arr: historyArr } = readHistory();

    // Считаем “всего тренировок”
    const total =
      Number(stats.totalWorkouts ?? stats.totalCount ?? stats.workouts ?? historyArr.length ?? 0) || 0;

    const totalEl = document.getElementById('total-count');
    if (totalEl) totalEl.textContent = String(total);

    // Последняя тренировка
    const lastDate = pickLastDate(stats, historyArr);
    const lastEl = document.getElementById('last-training-date');
    if (lastEl) lastEl.textContent = formatDate(lastDate);

    // История
    renderHistoryList(historyArr);
  }

  // Экспортируем в глобал, потому что profile.html вызывает updateStats() напрямую
  window.updateStats = updateStats;
})();
