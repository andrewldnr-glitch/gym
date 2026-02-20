/* =========================================================
   FitGym — Dashboard (redesign)
   Safe, standalone, no dependencies.
   ========================================================= */

(function(){
  function clamp(n, a, b){
    n = Number(n);
    if (!Number.isFinite(n)) n = 0;
    return Math.max(a, Math.min(b, n));
  }

  function startOfWeek(d){
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mon=0
    x.setHours(0,0,0,0);
    x.setDate(x.getDate() - day);
    return x;
  }

  function fmtRange(weekStart){
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const opts = { day: 'numeric', month: 'short' };
    return `${weekStart.toLocaleDateString('ru-RU', opts)} – ${end.toLocaleDateString('ru-RU', opts)}`;
  }

  function safeJsonParse(str, fallback){
    try { return JSON.parse(str); } catch (_) { return fallback; }
  }

  function loadTrainingHistory(){
    const raw = localStorage.getItem('trainingHistory');
    const arr = raw ? safeJsonParse(raw, []) : [];
    return Array.isArray(arr) ? arr : [];
  }

  function loadWeightHistory(){
    const raw = localStorage.getItem('weightHistory');
    const arr = raw ? safeJsonParse(raw, []) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .map(x => ({
        date: String(x?.date || ''),
        weight: Number(x?.weight)
      }))
      .filter(x => x.date && Number.isFinite(x.weight))
      .sort((a,b) => new Date(a.date) - new Date(b.date));
  }

  function formatDuration(mins){
    mins = Math.max(0, Math.round(mins));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h <= 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  function buildWeeklyBars(host, weekStart, items){
    if (!host) return;

    // Minutes by day (Mon..Sun)
    const minsByDay = new Array(7).fill(0);
    for (const it of items){
      const dt = new Date(it?.date || it?.finished_at || Date.now());
      const dayIndex = (dt.getDay() + 6) % 7; // Mon=0
      minsByDay[dayIndex] += 45; // heuristic minutes
    }

    const max = Math.max(45, ...minsByDay);
    const labels = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

    const today = new Date();
    const todayIdx = (today.getDay() + 6) % 7;

    host.innerHTML = '';

    for (let i = 0; i < 7; i++){
      const bar = document.createElement('div');
      bar.className = 'hud-bar' + (i === todayIdx ? ' is-today' : '');
      bar.setAttribute('role','listitem');
      bar.setAttribute('aria-label', `${labels[i]}: ${minsByDay[i]} минут`);

      const fill = document.createElement('div');
      fill.className = 'hud-bar__fill';
      const h = clamp((minsByDay[i] / max) * 100, 6, 100);
      fill.style.height = `${h}%`;

      const cap = document.createElement('div');
      cap.className = 'hud-bar__cap';

      const day = document.createElement('div');
      day.className = 'hud-bar__label';
      day.textContent = labels[i];

      bar.appendChild(fill);
      bar.appendChild(cap);
      bar.appendChild(day);
      host.appendChild(bar);
    }
  }

  function buildSparkline(weights){
    const line = document.getElementById('hud-weight-line');
    const area = document.getElementById('hud-weight-area');
    if (!line || !area) return;

    if (!Array.isArray(weights) || weights.length < 2){
      // Draw a placeholder flat line
      line.setAttribute('d', 'M 10 70 L 390 70');
      area.setAttribute('d', 'M 10 70 L 390 70 L 390 105 L 10 105 Z');
      return;
    }

    const pts = weights.slice(-14); // last 14 entries
    const vals = pts.map(p => p.weight);

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.18 || 1;

    const w = 400;
    const h = 110;
    const padX = 14;
    const padY = 12;

    const norm = v => (v - (min - pad)) / ((max + pad) - (min - pad));

    const coords = pts.map((p, i) => {
      const x = padX + (i * (w - padX * 2)) / (pts.length - 1);
      const y = (h - padY) - clamp(norm(p.weight), 0, 1) * (h - padY * 2);
      return { x, y };
    });

    const d = coords.map((p,i) => `${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    line.setAttribute('d', d);

    const dA = `${d} L ${coords[coords.length-1].x.toFixed(1)} ${(h-padY).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(h-padY).toFixed(1)} Z`;
    area.setAttribute('d', dA);
  }

  function init(){
    // Period chip: show local weekday + "Сегодня"
    const period = document.getElementById('hud-period');
    if (period){
      const now = new Date();
      const dow = now.toLocaleDateString('ru-RU', { weekday: 'short' });
      period.textContent = `Сегодня • ${dow}`;
    }

    const now = new Date();
    const ws = startOfWeek(now);

    const rangeEl = document.getElementById('hud-week-range');
    if (rangeEl) rangeEl.textContent = fmtRange(ws);

    const hist = loadTrainingHistory();
    const weekEnd = new Date(ws.getTime() + 7 * 24 * 3600 * 1000);

    const weekItems = hist.filter(x => {
      const dt = new Date(x?.date || x?.finished_at || Date.now());
      return dt >= ws && dt < weekEnd;
    });

    const daysSet = new Set(
      weekItems.map(x => {
        const dt = new Date(x?.date || x?.finished_at || Date.now());
        return dt.toISOString().slice(0,10);
      })
    );

    const workouts = weekItems.length;
    const days = daysSet.size;

    const activeMinutes = workouts * 45; // heuristic

    const WEEK_GOAL = 5;
    const pct = workouts > 0 ? clamp((workouts / WEEK_GOAL) * 100, 0, 999) : 0;

    const activeEl = document.getElementById('hud-active-time');
    const workoutsEl = document.getElementById('hud-workouts');
    const daysEl = document.getElementById('hud-days');
    const goalEl = document.getElementById('hud-goal');

    if (activeEl) activeEl.textContent = formatDuration(activeMinutes);
    if (workoutsEl) workoutsEl.textContent = String(workouts);
    if (daysEl) daysEl.textContent = `${days}/7`;
    if (goalEl) goalEl.textContent = `${Math.round(pct)}%`;

    const barsHost = document.getElementById('hud-bars');
    buildWeeklyBars(barsHost, ws, weekItems);

    const weights = loadWeightHistory();
    const last = weights.length ? weights[weights.length - 1] : null;
    const wLastEl = document.getElementById('hud-weight-last');
    if (wLastEl) wLastEl.textContent = last ? `${last.weight} кг` : 'Нет данных';

    buildSparkline(weights);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
