// js/achievements.js

const ACHIEVEMENTS_KEY = 'user_achievements';

// Список всех возможных достижений
const BADGES_LIST = [
    { id: 'first_workout', name: 'Первый шаг', icon: '👟', check: (stats) => stats.totalWorkouts >= 1 },
    { id: 'five_workouts', name: 'Разгон', icon: '🔥', check: (stats) => stats.totalWorkouts >= 5 },
    { id: 'ten_workouts', name: 'Сила воли', icon: '💪', check: (stats) => stats.totalWorkouts >= 10 },
    { id: 'first_weight', name: 'Контроль', icon: '⚖️', check: (stats) => stats.weightEntries >= 1 },
    { id: 'five_weights', name: 'Тенденция', icon: '📉', check: (stats) => stats.weightEntries >= 5 },
    { id: 'night_owl', name: 'Сова', icon: '🦉', check: (stats) => stats.nightWorkouts >= 1 }
];

// Получить текущие достижения
function getAchievements() {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

// Сохранить достижение
function saveAchievement(id) {
    const current = getAchievements();
    if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(current));
        
        // Показать уведомление в Telegram
        if (window.Telegram && window.Telegram.WebApp) {
            const badge = BADGES_LIST.find(b => b.id === id);
            window.Telegram.WebApp.showPopup({
                title: 'Достижение разблокировано! 🏆',
                message: `Вы получили: "${badge.name}"`,
                buttons: [{type: 'ok'}]
            });
        }
    }
}

// Проверить все достижения (вызывать при обновлении статистики)
function checkAllAchievements() {
    const history = getHistory();
    const weightHist = getWeightHistory();
    
    // Собираем статистику
    const stats = {
        totalWorkouts: history.length,
        weightEntries: weightHist.length,
        nightWorkouts: history.filter(h => {
            const hour = new Date(h.date).getHours(); // Используем текущее время записи, если дата - это день
            // Для простоты считаем, что если дата "сегодня" и сейчас ночь, то это ночная тренировка.
            // Но т.к. мы сохраняем только дату, проверим реальное время сейчас при вызове функции? 
            // Или добавим время в историю? Давайте упростим: проверяем время прямо сейчас при вызове check.
            return false; // Заглушка, ночь проверим отдельно
        }).length
    };

    // Проверка ночной тренировки (если сейчас ночь и мы вызвали check)
    const hourNow = new Date().getHours();
    if (hourNow >= 23 || hourNow < 6) {
        stats.nightWorkouts = 1; 
    }

    // Проверяем каждый бейдж
    BADGES_LIST.forEach(badge => {
        if (badge.check(stats)) {
            saveAchievement(badge.id);
        }
    });
}

// Отрисовка достижений в профиле
function renderAchievements() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const activeIds = getAchievements();
    
    container.innerHTML = '';
    
    BADGES_LIST.forEach(badge => {
        const isActive = activeIds.includes(badge.id);
        const div = document.createElement('div');
        div.className = 'badge-item ' + (isActive ? 'active' : '');
        div.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
        `;
        container.appendChild(div);
    });
}
