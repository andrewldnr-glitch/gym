<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Профиль</title>
  <link rel="stylesheet" href="css/style.css">
  <!-- Подключаем Chart.js для графиков -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body class="has-tab-bar">
  <div class="container">
    
    <!-- Блок: Тренировки -->
    <h2>📊 Статистика</h2>
    <div class="stat-item" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div class="stat-label">Всего тренировок</div>
        <div class="stat-value" id="total-count">0</div>
      </div>
      <div style="text-align:right;">
         <div class="stat-label">Последняя</div>
         <div id="last-training-date" style="color:var(--text-secondary); font-size:0.9rem;">-</div>
      </div>
    </div>

    <!-- Блок: Вес -->
    <div class="weight-section">
      <div class="weight-header">
        <h2>⚖️ Мой вес</h2>
        <div class="weight-current" id="current-weight-display">-- <small>кг</small></div>
      </div>

      <!-- График -->
      <div class="chart-container">
        <canvas id="weightChart"></canvas>
      </div>

      <!-- Ввод веса -->
      <div class="input-weight-group">
        <input type="number" id="weight-input" class="input-weight" placeholder="Вес, кг" step="0.1">
        <button class="btn-add-weight" onclick="addNewWeight()">OK</button>
      </div>

      <!-- История веса -->
      <h3 style="margin-bottom: 10px; font-size: 1rem; color: var(--text-secondary);">История (последние 5)</h3>
      <div id="weight-history-list"></div>
    </div>

  </div>
  
  <!-- Навигация -->
  <nav class="tab-bar">
    <a href="index.html" class="tab-item">
      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Home</span>
    </a>
    <a href="profile.html" class="tab-item active">
      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
      <span>Stats</span>
    </a>
    <a href="info.html" class="tab-item">
      <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <span>Tools</span>
    </a>
  </nav>

  <script src="js/app.js"></script>
  <script src="js/profile.js"></script>
  <script src="js/weight.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      updateStats();
      initWeightSection(); // Инициализация графика веса
    });
  </script>
</body>
</html>
