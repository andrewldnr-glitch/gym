// js/achievements.js

const ACHIEVEMENTS_KEY = 'user_achievements';

const BADGES_LIST = [
    { id: 'first_workout', name: 'Первый шаг', icon: '👟', check: (stats) => stats.totalWorkouts >= 1 },
    { id: 'five_workouts', name: 'Разгон', icon: '🔥', check: (stats) => stats.totalWorkouts >= 5 },
    { id: 'ten_workouts', name: 'Сила воли', icon: '💪', check: (stats) => stats.totalWorkouts >= 10 },
    { id: 'first_weight', name: 'Контроль', icon: '⚖️', check: (stats) => stats.weightEntries >= 1 },
    { id: 'five_weights', name: 'Тенденция', icon: '📉', check: (stats) => stats.weightEntries >= 5 },
    { id: 'night_owl', name: 'Сова', icon: '🦉', check: (stats) => stats.nightWorkouts >= 1 }
];

function getAchievements() {
    const data = localStorage.getItem(ACHIEVEMENTS_KEY);
    return data ? JSON.parse(data) : [];
}

function saveAchievement(id) {
    const current = getAchievements();
    if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(current));
        
        if (window.Telegram && window.Telegram.WebApp) {
            const badge = BADGES_LIST.find(b => b.id === id);
            // Используем alert если showPopup не сработает
            if (window.Telegram.WebApp.showPopup) {
                window.Telegram.WebApp.showPopup({
                    title: 'Достижение разблокировано! 🏆',
                    message: `Вы получили: "${badge.name}"`,
                    buttons: [{type: 'ok'}]
                });
            } else {
                alert(`🏆 Достижение: "${badge.name}"`);
            }
        }
    }
}

function checkAllAchievements() {
    // Безопасное получение истории
    const history = (typeof getHistory === 'function') ? getHistory() : [];
    
    // Безопасное получение веса
    const weightHist = (typeof getWeightHistory === 'function') ? getWeightHistory() : [];
    
    const stats = {
        totalWorkouts: history.length,
        weightEntries: weightHist.length,
        nightWorkouts: 0
    };

    // Проверка ночной тренировки (23:00 - 06:00)
    const hourNow = new Date().getHours();
    if (hourNow >= 23 || hourNow < 6) {
        stats.nightWorkouts = 1; 
    }

    BADGES_LIST.forEach(badge => {
        if (badge.check(stats)) {
            saveAchievement(badge.id);
        }
    });
}

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
