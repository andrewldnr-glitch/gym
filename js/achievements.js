// js/achievements.js
// ----------------------------------------------------------
// Достижения: хранение (localStorage), проверка условий,
// рендер мини-сетки (profile.html) + "доска достижений" (achievements.html).
// ----------------------------------------------------------

const ACHIEVEMENTS_KEY = 'user_achievements';

/**
 * ✅ Lucide icon names (stroke) — хорошо подходит под OPAL.
 *
 * Схема:
 * - target: порог для открытия
 * - getValue(stats): текущее значение
 * - category: для фильтров на доске
 */
const BADGES_LIST = [
  {
    id: 'first_workout',
    name: 'Первый шаг',
    icon: 'footprints',
    category: 'workouts',
    desc: 'Завершите 1 тренировку.',
    rewardGems: 10,
    target: 1,
    getValue: (stats) => stats.totalWorkouts,
  },
  {
    id: 'five_workouts',
    name: 'Разгон',
    icon: 'flame',
    category: 'workouts',
    desc: 'Завершите 5 тренировок.',
    rewardGems: 25,
    target: 5,
    getValue: (stats) => stats.totalWorkouts,
  },
  {
    id: 'ten_workouts',
    name: 'Сила воли',
    icon: 'dumbbell',
    category: 'workouts',
    desc: 'Завершите 10 тренировок.',
    rewardGems: 50,
    target: 10,
    getValue: (stats) => stats.totalWorkouts,
  },
  {
    id: 'first_weight',
    name: 'Контроль',
    icon: 'scale',
    category: 'weight',
    desc: 'Добавьте 1 запись веса.',
    rewardGems: 10,
    target: 1,
    getValue: (stats) => stats.weightEntries,
  },
  {
    id: 'five_weights',
    name: 'Тенденция',
    icon: 'trending-up',
    category: 'weight',
    desc: 'Добавьте 5 записей веса.',
    rewardGems: 25,
    target: 5,
    getValue: (stats) => stats.weightEntries,
  },
  {
    id: 'night_owl',
    name: 'Сова',
    icon: 'moon',
    category: 'special',
    desc: 'Завершите тренировку ночью (23:00–06:00).',
    rewardGems: 15,
    target: 1,
    getValue: (stats) => stats.nightWorkouts,
  },
];

// -------------------------------
// Storage helpers + миграция
// -------------------------------

function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch (_) { return fallback; }
}

/**
 * Возвращает массив объектов: { id, unlockedAt }
 * Поддерживает легаси-формат: ["id1", "id2"]
 */
function getAchievementEntries() {
  const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
  const data = raw ? safeJsonParse(raw, []) : [];

  // 1) Пусто / не массив
  if (!Array.isArray(data)) return [];

  // 2) Легаси: массив строк
  if (data.length && typeof data[0] === 'string') {
    const migrated = data
      .filter((x) => typeof x === 'string' && x.trim())
      .map((id) => ({ id, unlockedAt: null }));
    try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(migrated)); } catch (_) {}
    return migrated;
  }

  // 3) Новый формат
  return data
    .map((x) => ({
      id: String(x?.id || ''),
      unlockedAt: x?.unlockedAt ? String(x.unlockedAt) : null,
    }))
    .filter((x) => x.id);
}

/**
 * Легаси API: возвращает только список id (как раньше)
 */
function getAchievements() {
  return getAchievementEntries().map((x) => x.id);
}

function isAchievementUnlocked(id) {
  return getAchievements().includes(id);
}

function getAchievementUnlockedAt(id) {
  const entry = getAchievementEntries().find((x) => x.id === id);
  return entry ? entry.unlockedAt : null;
}

// -------------------------------
// Gems rewards (за достижения)
// -------------------------------

function getBadgeById(id) {
  const key = String(id || '').trim();
  if (!key) return null;
  return BADGES_LIST.find((b) => b.id === key) || null;
}

/**
 * Начисляет гемы за достижение, если задан rewardGems.
 * Использует idempotencyKey, чтобы начисление было строго один раз.
 */
function awardGemsForAchievement(achievementId) {
  const badge = getBadgeById(achievementId);
  const amount = Number(badge?.rewardGems ?? 0);

  if (!Number.isFinite(amount) || amount <= 0) return { ok: true, skipped: true };
  if (typeof window.addGems !== 'function') return { ok: false, skipped: true };

  return window.addGems(amount, {
    reason: `achievement:${achievementId}`,
    title: badge ? `Достижение: ${badge.name}` : `Достижение: ${achievementId}`,
    idempotencyKey: `achv:${achievementId}`,
    meta: { achievementId: String(achievementId || '') },
  });
}

/**
 * Миграция: если достижения уже были открыты до внедрения гемов,
 * мы начислим награды один раз (idempotencyKey защитит от дублей).
 */
function ensureAchievementRewardsApplied() {
  try {
    const unlocked = getAchievements();
    unlocked.forEach((id) => {
      try { awardGemsForAchievement(id); } catch (_) {}
    });
  } catch (_) {}
}

function saveAchievement(id) {
  const normalizedId = String(id || '').trim();
  if (!normalizedId) return;

  const entries = getAchievementEntries();
  if (entries.some((x) => x.id === normalizedId)) return;

  entries.push({ id: normalizedId, unlockedAt: new Date().toISOString() });
  try { localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(entries)); } catch (_) {}

  // UI / TG popup + начисление гемов
  const badge = getBadgeById(normalizedId);
  const reward = Number(badge?.rewardGems ?? 0) || 0;

  // начисляем гемы (если подключён gems.js)
  try { awardGemsForAchievement(normalizedId); } catch (_) {}

  // обновим UI кошелька (если он есть на странице)
  try { if (typeof window.renderGemsBalance === 'function') window.renderGemsBalance('gems-balance'); } catch (_) {}
  try { if (typeof window.renderGemsHistory === 'function') window.renderGemsHistory('gems-history', { limit: 6 }); } catch (_) {}

  const title = 'Достижение разблокировано! 🏆';
  const rewardLine = reward > 0 ? `

💎 Награда: +${reward}` : '';
  const message = badge
    ? `Вы получили: "${badge.name}"

${badge.desc || ''}${rewardLine}`
    : `Вы получили достижение: "${normalizedId}"${rewardLine}`;

  try {
    if (window.Telegram && window.Telegram.WebApp) {
      if (window.Telegram.WebApp.showPopup) {
        window.Telegram.WebApp.showPopup({
          title,
          message,
          buttons: [{ type: 'ok' }],
        });
      } else {
        alert(message);
      }
      // haptic
      try { window.Telegram.WebApp.HapticFeedback?.notificationOccurred('success'); } catch (_) {}
    }
  } catch (_) {}
}

// -------------------------------
// Stats + прогресс
// -------------------------------

function readArrayFromStorage(keys) {
  const arrKeys = Array.isArray(keys) ? keys : [keys];
  for (const key of arrKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = safeJsonParse(raw, null);
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  return [];
}

function readTrainingHistory() {
  return readArrayFromStorage([
    'trainingHistory',
    'workoutHistory',
    'workoutSessions',
    'trainingSessions',
    'history',
  ]);
}

function readWeightHistory() {
  return readArrayFromStorage('weightHistory');
}

function parseEntryDate(entry) {
  const v = entry?.date || entry?.finished_at || entry?.finishedAt || entry?.completedAt || entry?.ts || entry?.timestamp || null;
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d;
  // Fallback: YYYY-MM-DD
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const dd = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return Number.isNaN(dd.getTime()) ? null : dd;
}

function isNightHour(h) {
  return h >= 23 || h < 6;
}

function buildAchievementStats() {
  const history = readTrainingHistory();
  const weights = readWeightHistory();

  let nightWorkouts = 0;
  try {
    nightWorkouts = history
      .map(parseEntryDate)
      .filter(Boolean)
      .filter((d) => isNightHour(d.getHours()))
      .length;
  } catch (_) {
    nightWorkouts = 0;
  }

  return {
    totalWorkouts: Array.isArray(history) ? history.length : 0,
    weightEntries: Array.isArray(weights) ? weights.length : 0,
    nightWorkouts: Number(nightWorkouts) || 0,
  };
}

function getBadgeProgress(badge, stats) {
  const target = Number(badge?.target ?? 1) || 1;
  const getValue = typeof badge?.getValue === 'function'
    ? badge.getValue
    : (typeof badge?.check === 'function'
      ? (s) => (badge.check(s) ? target : 0)
      : () => 0);

  const currentRaw = Number(getValue(stats) ?? 0);
  const current = Number.isFinite(currentRaw) ? currentRaw : 0;
  const ratio = Math.max(0, Math.min(1, target ? current / target : 0));
  const text = `${Math.min(current, target)}/${target}`;

  return { current, target, ratio, text };
}

function formatUnlockedAt(unlockedAt) {
  if (!unlockedAt) return '';
  const d = new Date(unlockedAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// -------------------------------
// Проверка условий (unlock)
// -------------------------------

function checkAllAchievements() {
  const stats = buildAchievementStats();

  BADGES_LIST.forEach((badge) => {
    // backwards compatibility: если есть badge.check — используем
    const ok = typeof badge.check === 'function'
      ? !!badge.check(stats)
      : (getBadgeProgress(badge, stats).current >= (badge.target ?? 1));
    if (ok) saveAchievement(badge.id);
  });

  // ✅ начислить награды за достижения (включая миграцию для уже открытых)
  try { ensureAchievementRewardsApplied(); } catch (_) {}
}

// -------------------------------
// Рендер мини-сетки (profile.html)
// -------------------------------

function renderAchievements() {
  const container = document.getElementById('achievements-container');
  if (!container) return;

  const activeIds = getAchievements();
  container.innerHTML = '';

  BADGES_LIST.forEach((badge) => {
    const isActive = activeIds.includes(badge.id);
    const div = document.createElement('div');
    div.className = 'badge-item ' + (isActive ? 'active' : '');
    div.innerHTML = `
      <div class="badge-icon">
        <i data-lucide="${badge.icon}"></i>
      </div>
      <div class="badge-name">${badge.name}</div>
    `;
    container.appendChild(div);
  });

  try { if (window.lucide) lucide.createIcons(); } catch (_) {}
}

// -------------------------------
// Доска достижений (achievements.html)
// -------------------------------

function renderAchievementsSummary() {
  const unlocked = new Set(getAchievements());
  const total = BADGES_LIST.length;
  const unlockedCount = unlocked.size;
  const pct = total ? Math.round((unlockedCount / total) * 100) : 0;

  const elUnlocked = document.getElementById('achievements-unlocked-count');
  const elTotal = document.getElementById('achievements-total-count');
  const elBar = document.getElementById('achievements-summary-bar');
  const elHint = document.getElementById('achievements-summary-hint');

  if (elUnlocked) elUnlocked.textContent = String(unlockedCount);
  if (elTotal) elTotal.textContent = String(total);
  if (elBar) elBar.style.width = `${pct}%`;
  if (elHint) elHint.textContent = pct >= 100
    ? 'Все достижения открыты!'
    : `Ещё ${Math.max(0, total - unlockedCount)} до полного набора`;
}

function renderAchievementsBoard(opts = {}) {
  const containerId = opts.containerId || 'achievements-board';
  const filter = String(opts.filter || 'all');
  const container = document.getElementById(containerId);
  if (!container) return;

  const stats = buildAchievementStats();
  const unlockedIds = new Set(getAchievements());

  const filtered = BADGES_LIST.filter((b) => {
    if (filter === 'all') return true;
    return String(b.category || '') === filter;
  });

  container.innerHTML = '';

  filtered.forEach((badge) => {
    const unlocked = unlockedIds.has(badge.id);
    const progress = getBadgeProgress(badge, stats);
    const unlockedAt = unlocked ? formatUnlockedAt(getAchievementUnlockedAt(badge.id)) : '';

    const card = document.createElement('div');
    card.className = `achievement-card card ${unlocked ? 'is-unlocked' : 'is-locked'}`;
    card.setAttribute('role', 'button');
    card.tabIndex = 0;

    card.innerHTML = `
      <div class="achievement-card__top">
        <div class="achievement-card__icon">
          <i data-lucide="${badge.icon}"></i>
        </div>
        <div class="achievement-card__meta">
          <div class="achievement-card__name">${badge.name}</div>
          <div class="achievement-card__desc">${badge.desc || ''}</div>
        </div>
        <div class="achievement-card__status">
          <span class="achievement-card__status-text">${unlocked ? 'Открыто' : 'Закрыто'}</span>
          ${badge.rewardGems ? `<span class="achievement-card__reward"><i data-lucide="gem"></i>+${badge.rewardGems}</span>` : ''}
        </div>
      </div>

      <div class="achievement-card__progress">
        <div class="progress-track" aria-hidden="true">
          <div class="progress-fill" style="width:${Math.round(progress.ratio * 100)}%"></div>
        </div>
        <div class="achievement-card__progress-row">
          <span class="achievement-card__progress-text">Прогресс: ${progress.text}</span>
          ${unlockedAt ? `<span class=\"achievement-card__date\">${unlockedAt}</span>` : ''}
        </div>
      </div>
    `;

    const openDetails = () => {
      const status = unlocked ? 'Открыто ✅' : 'Пока закрыто 🔒';
      const rewardLine = badge.rewardGems ? `\nНаграда: +${badge.rewardGems} 💎` : '';
      const msg = `${badge.name}\n\n${badge.desc || ''}\n\n${status}\nПрогресс: ${progress.text}${rewardLine}`;
      try {
        if (window.Telegram?.WebApp?.showPopup) {
          window.Telegram.WebApp.showPopup({
            title: 'Достижение',
            message: msg,
            buttons: [{ type: 'ok' }],
          });
        } else {
          alert(msg);
        }
      } catch (_) {
        alert(msg);
      }
    };

    card.addEventListener('click', openDetails);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetails();
      }
    });

    container.appendChild(card);
  });

  try { if (window.lucide) lucide.createIcons(); } catch (_) {}
}

// Экспорт в глобал (страницы вызывают напрямую)
window.checkAllAchievements = checkAllAchievements;
window.renderAchievements = renderAchievements;
window.renderAchievementsBoard = renderAchievementsBoard;
window.renderAchievementsSummary = renderAchievementsSummary;
window.ensureAchievementRewardsApplied = ensureAchievementRewardsApplied;
window.awardGemsForAchievement = awardGemsForAchievement;
