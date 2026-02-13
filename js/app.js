// js/app.js

// Инициализация Telegram WebApp
function initApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем, что приложение загружено
    tg.expand(); // Разворачиваем на всю высоту
    
    // Установка цветов (опционально, обычно CSS переменные справляются сами)
    // tg.setHeaderColor(tg.themeParams.bg_color);
  }
}

// Загрузка данных из JSON
async function loadTrainingsData() {
  try {
    // Путь относительно корня проекта
    const response = await fetch('data/trainings.json');
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error loading trainings:', error);
    return null;
  }
}

// Работа с LocalStorage
const STORAGE_KEY = 'trainingsHistory';

function getHistory() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveToHistory(trainingId, trainingName) {
  const history = getHistory();
  history.push({
    id: trainingId,
    name: trainingName,
    date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
