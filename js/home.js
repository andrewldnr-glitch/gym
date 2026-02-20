/*
  js/home.js — Home dashboard rendering
  - Safe DOM guards
  - No dependencies
  - Works outside Telegram
*/

(function () {
  function startOfWeek(date) {
    const x = new Date(date);
    const day = (x.getDay() + 6) % 7; // Mon=0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
  }

  function fmtRange(weekStart) {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `${weekStart.toLocaleDateString('ru-RU', opts)} – ${end.toLocaleDateString('ru-RU', opts)}`;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function safeJsonParse(str, fallback) {
    try {
      const v = JSON.parse(str);
      return v ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function loadTrainingHistory() {
    return safeJsonParse(localStorage.getItem('trainingHistory') || '[]', []);
  }

  function loadWeightHistory() {
    return safeJsonParse(localStorage.getItem('weightHistory') || '[]', []);
  }

  function formatActiveTime(minutes) {
    const m = Math.max(0, Math.round(minutes || 0));
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h <= 0) return `${mm}m`;
    return `${h}h ${mm}m`;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
  }

  function setProgress(percent) {
    const p = clamp(Number(percent) || 0, 0, 100);
    const fill = document.getElementById('week-progress-fill');
    if (fill) fill.style.width = `${p.toFixed(1)}%`;
    setText('opal-percent', `${Math.round(p)}%`);
  }

  function buildWeightSparkline(points) {
    const line = document.getElementById('opal-weight-line');
    const area = document.getElementById('opal-weight-area');
    if (!line || !area) return;

    if (!Array.isArray(points) || points.length < 2) {
      line.setAttribute('d', '');
      area.setAttribute('d', '');
      return;
    }

    const pts = points.slice(-14).filter(p => p && typeof p.weight === 'number');
    if (pts.length < 2) {
      line.setAttribute('d', '');
      area.setAttribute('d', '');
      return;
    }

    const w = 400;
    const h = 92;
    const padX = 8;
    const padY = 10;

    const ys = pts.map(p => p.weight);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = (maxY - minY) || 1;

    const step = (w - padX * 2) / (pts.length - 1);

    const coords = pts.map((p, i) => {
      const x = padX + step * i;
      const norm = (p.weight - minY) / span;
      const y = (h - padY) - norm * (h - padY * 2);
      return { x, y };
    });

    const d = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    line.setAttribute('d', d);

    const dA = `${d} L ${coords[coords.length - 1].x.toFixed(1)} ${(h - padY).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(h - padY).toFixed(1)} Z`;
    area.setAttribute('d', dA);
  }

  function renderWeekBars(dayCounts) {
    const host = document.getElementById('week-bars');
    if (!host) return;

    host.innerHTML = '';
    const arr = Array.isArray(dayCounts) ? dayCounts : [0, 0, 0, 0, 0, 0, 0];
    const max = Math.max(1, ...arr);

    for (let i = 0; i < 7; i++) {
      const c = Number(arr[i]) || 0;
      const bar = document.createElement('div');
      bar.className = 'week-bar';
      bar.setAttribute('role', 'presentation');

      const fill = document.createElement('i');
      // min height so empty days still visible as a baseline
      const hPct = clamp((c / max) * 100, 8, 100);
      fill.style.height = `${hPct.toFixed(1)}%`;

      // If count is 0 — make it very subtle
      if (c <= 0) {
        fill.style.opacity = '0.20';
        fill.style.boxShadow = 'none';
      }

      bar.appendChild(fill);
      host.appendChild(bar);
    }
  }

  function initHome() {
    const now = new Date();
    const ws = startOfWeek(now);

    setText('opal-week-range', fmtRange(ws));

    const hist = loadTrainingHistory();

    const weekStartMs = ws.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 3600 * 1000;

    const weekItems = (Array.isArray(hist) ? hist : []).filter((x) => {
      const dt = new Date(x?.date || x?.finished_at || Date.now());
      const t = dt.getTime();
      return t >= weekStartMs && t < weekEndMs;
    });

    const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    const daysSet = new Set();

    for (const x of weekItems) {
      const dt = new Date(x?.date || x?.finished_at || Date.now());
      const iso = dt.toISOString().slice(0, 10);
      daysSet.add(iso);

      const day = (dt.getDay() + 6) % 7;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    const workouts = weekItems.length;
    const days = daysSet.size;

    // Simple heuristic (no duration stored): 45 min per workout
    const activeMinutes = workouts * 45;

    setText('opal-active-time', formatActiveTime(activeMinutes));
    setText('opal-workouts', String(workouts));
    setText('opal-days', `${days}/7`);

    // Week goal by count
    const WEEK_GOAL = 5;
    const pct = workouts > 0 ? (workouts / WEEK_GOAL) * 100 : 0;
    setProgress(pct);

    renderWeekBars(dayCounts);

    const weights = loadWeightHistory();
    const last = Array.isArray(weights) && weights.length ? weights[weights.length - 1] : null;
    setText('opal-weight-last', last && typeof last.weight === 'number' ? `${last.weight} кг` : 'Нет данных');
    buildWeightSparkline(weights);
  }

  document.addEventListener('DOMContentLoaded', initHome);
})();
