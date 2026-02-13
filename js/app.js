// js/app.js
function initApp() {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
  }
}

async function loadTrainingsData() {
  try {
    const response = await fetch('data/trainings.json');
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error loading trainings:', error);
    return null;
  }
}

const STORAGE_KEY = 'trainingsHistory';
function getHistory() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}
function saveToHistory(trainingId, trainingName) {
  const history = getHistory();
  history.push({ id: trainingId, name: trainingName, date: new Date().toISOString().split('T')[0] });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}
function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

// --- Безопасный звуковой движок ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function unlockAudio() {
    if (!audioCtx && AudioContext) {
        audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Разблокируем аудио при первом клике на странице
document.addEventListener('click', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });

function playSound(type) {
  // Если аудио не поддерживается или контекст не создан - просто выходим
  if (!AudioContext) return;
  if (!audioCtx) {
      // Пытаемся создать контекст, если его нет (например, клик был раньше)
      try { audioCtx = new AudioContext(); } catch(e) { return; }
  }
  
  // Если контекст "спит", будим. Если не выходит - уходим.
  if (audioCtx.state === 'suspended') {
      audioCtx.resume();
  }

  try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      
      if (type === 'tick') { 
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.05, now); // Тише
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } 
      else if (type === 'start') { 
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.1);
        osc.frequency.setValueAtTime(1000, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
      else if (type === 'rest') { 
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(500, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
  } catch (e) {
      console.log("Sound error ignored");
  }
}
