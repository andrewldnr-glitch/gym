
// js/training-calendar.js
(function () {
  'use strict';

  const HISTORY_KEY = 'trainingHistory';
  const PROFILE_KEY = 'profile';
  const CLAIMS_KEY = 'training_calendar_claims_v1';

  function safeParse(str, fallback) { try { return JSON.parse(str); } catch (_) { return fallback; } }

  function pad(n) { return String(n).padStart(2, '0'); }

  function toDayKey(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  }

  function fmtDayRu(dayKey) {
    const d = new Date(dayKey + 'T00:00:00');
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function readHistory() {
    const arr = safeParse(localStorage.getItem(HISTORY_KEY) || '[]', []);
    if (!Array.isArray(arr)) return [];
    return arr
      .map(x => ({
        date: x?.date || x?.finished_at || null,
        title: x?.title || x?.name || (x?.source === 'course' ? 'Тренировка (курс)' : 'Тренировка'),
        source: x?.source || 'training',
        training_id: x?.training_id ?? null,
        course_id: x?.course_id ?? null,
        day_index: x?.day_index ?? null,
      }))
      .filter(x => x.date);
  }

  function readClaims() {
    const obj = safeParse(localStorage.getItem(CLAIMS_KEY) || '{}', {});
    return (obj && typeof obj === 'object') ? obj : {};
  }

  function writeClaims(obj) {
    try { localStorage.setItem(CLAIMS_KEY, JSON.stringify(obj || {})); } catch (_) {}
  }

  // ISO week helpers
  function getIsoWeekInfo(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return { year: date.getUTCFullYear(), week: weekNo };
  }

  function getWeekKey(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return null;
    const w = getIsoWeekInfo(d);
    return `${w.year}-W${pad(w.week)}`;
  }

  function getWeekRangeLabel(dateLike) {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '';
    // Monday start
    const day = (d.getDay() + 6) % 7; // 0..6
    const mon = new Date(d);
    mon.setDate(d.getDate() - day);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const a = mon.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const b = sun.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    return `${a} — ${b}`;
  }

  function getWeeklyGoal() {
    const p = safeParse(localStorage.getItem(PROFILE_KEY) || 'null', null);
    const v = Number(p?.days_per_week ?? p?.daysPerWeek ?? 3);
    return Number.isFinite(v) ? Math.max(1, Math.min(7, Math.floor(v))) : 3;
  }

  // UI state
  let viewDate = new Date();
  viewDate.setDate(1);
  let selectedDayKey = null;

  // Map dateKey -> workouts[]
  function buildDayMap(history) {
    const map = new Map();
    history.forEach(w => {
      const dk = toDayKey(w.date);
      if (!dk) return;
      if (!map.has(dk)) map.set(dk, []);
      map.get(dk).push(w);
    });
    // sort within day by time
    for (const [k, list] of map.entries()) {
      list.sort((a,b) => new Date(a.date) - new Date(b.date));
    }
    return map;
  }

  function renderMonthLabel() {
    const el = document.getElementById('tc-month-label');
    const d = new Date(viewDate);
    const label = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    el.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  }

  function renderCalendar(dayMap) {
    const grid = document.getElementById('tc-grid');
    grid.innerHTML = '';

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const first = new Date(year, month, 1);
    const firstDow = (first.getDay() + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month+1, 0).getDate();

    // previous month days to fill
    const prevDays = firstDow;
    const prevMonthDays = new Date(year, month, 0).getDate();

    const todayKey = toDayKey(new Date());

    const cells = [];
    for (let i=0;i<prevDays;i++){
      const day = prevMonthDays - prevDays + 1 + i;
      const d = new Date(year, month-1, day);
      cells.push({ date: d, isOut: true });
    }
    for (let day=1; day<=daysInMonth; day++){
      cells.push({ date: new Date(year, month, day), isOut: false });
    }
    while (cells.length % 7 !== 0) {
      const nextDay = cells.length - (prevDays + daysInMonth) + 1;
      cells.push({ date: new Date(year, month+1, nextDay), isOut: true });
    }

    cells.forEach(c => {
      const dk = toDayKey(c.date);
      const list = dk ? (dayMap.get(dk) || []) : [];
      const count = list.length;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tc-cell' + (c.isOut ? ' is-out' : '');
      btn.textContent = String(c.date.getDate());

      if (dk && dk === todayKey) btn.classList.add('is-today');
      if (dk && dk === selectedDayKey) btn.classList.add('is-selected');

      if (count > 0) {
        const dot = document.createElement('div');
        dot.className = 'tc-dot';
        btn.appendChild(dot);

        if (count > 1) {
          const badge = document.createElement('div');
          badge.className = 'tc-count';
          badge.textContent = String(count);
          btn.appendChild(badge);
        }
      }

      btn.addEventListener('click', () => {
        selectedDayKey = dk;
        renderCalendar(dayMap);
        renderDayDetails(dayMap);
      });

      grid.appendChild(btn);
    });
  }

  function renderWeek(dayMap) {
    const meta = document.getElementById('tc-week-meta');
    const progress = document.getElementById('tc-week-progress');
    const claimBtn = document.getElementById('tc-claim-week');

    const baseDate = selectedDayKey ? new Date(selectedDayKey+'T00:00:00') : new Date();
    const weekKey = getWeekKey(baseDate);
    const rangeLabel = getWeekRangeLabel(baseDate);

    const goal = getWeeklyGoal();

    // count workouts in that ISO week
    let count = 0;
    for (const [dk, list] of dayMap.entries()) {
      const wk = getWeekKey(dk+'T00:00:00');
      if (wk === weekKey) count += list.length ? 1 : 0; // count days trained
    }

    meta.textContent = `${rangeLabel} • цель: ${goal} дн.`;
    progress.textContent = `${Math.min(count, goal)}/${goal}`;

    const claims = readClaims();
    const claimed = Boolean(claims[`week:${weekKey}`]);

    const canClaim = count >= goal && !claimed;
    claimBtn.style.display = canClaim ? 'inline-flex' : 'none';

    claimBtn.onclick = () => {
      try {
        if (typeof window.addGems === 'function') {
          window.addGems(5, {
            title: 'Бонус за неделю',
            reason: 'workout_weekly_bonus',
            idempotencyKey: `workout_week:${weekKey}`,
            meta: { week: weekKey, goalDays: goal }
          });
        }
        const next = readClaims();
        next[`week:${weekKey}`] = { ts: new Date().toISOString() };
        writeClaims(next);

        try { if (typeof window.renderGemsBalance === 'function') window.renderGemsBalance('tc-gems-balance'); } catch (_) {}
        renderWeek(dayMap);
      } catch (_) {}
    };
  }

  function renderDayDetails(dayMap) {
    const title = document.getElementById('tc-day-title');
    const sub = document.getElementById('tc-day-sub');
    const listEl = document.getElementById('tc-day-list');
    const claimBtn = document.getElementById('tc-claim-day');

    if (!selectedDayKey) {
      title.textContent = 'Выберите день';
      sub.textContent = 'Нажмите на дату в календаре.';
      listEl.innerHTML = '<div class="tc-empty">Пока нет тренировок за выбранный день.</div>';
      claimBtn.style.display = 'none';
      renderWeek(dayMap);
      return;
    }

    title.textContent = fmtDayRu(selectedDayKey);
    const workouts = dayMap.get(selectedDayKey) || [];
    sub.textContent = workouts.length ? `Тренировок: ${workouts.length}` : 'Нет тренировок';

    if (!workouts.length) {
      listEl.innerHTML = '<div class="tc-empty">Пока нет тренировок за выбранный день.</div>';
      claimBtn.style.display = 'none';
      renderWeek(dayMap);
      return;
    }

    // day bonus claim via our own claims OR via gems idempotency (both ok)
    const claims = readClaims();
    const claimed = Boolean(claims[`day:${selectedDayKey}`]);

    claimBtn.style.display = claimed ? 'none' : 'inline-flex';

    claimBtn.onclick = () => {
      try {
        if (typeof window.addGems === 'function') {
          window.addGems(2, {
            title: 'Бонус за тренировку',
            reason: 'workout_daily_bonus',
            idempotencyKey: `workout_day:${selectedDayKey}`,
            meta: { day: selectedDayKey }
          });
        }
        const next = readClaims();
        next[`day:${selectedDayKey}`] = { ts: new Date().toISOString() };
        writeClaims(next);

        try { if (typeof window.renderGemsBalance === 'function') window.renderGemsBalance('tc-gems-balance'); } catch (_) {}
        renderDayDetails(dayMap);
      } catch (_) {}
    };

    listEl.innerHTML = workouts.map(w => {
      const ts = new Date(w.date);
      const time = Number.isNaN(ts.getTime()) ? '' : ts.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const meta = w.source === 'course'
        ? `Курс • день ${Number(w.day_index ?? 0) + 1}`
        : 'Тренировка';
      return `
        <div class="tc-item">
          <div>
            <div class="tc-item__title">${escapeHtml(w.title || 'Тренировка')}</div>
            <div class="tc-item__meta">${escapeHtml(meta)}</div>
          </div>
          <div class="tc-item__meta">${escapeHtml(time)}</div>
        </div>
      `;
    }).join('');

    renderWeek(dayMap);
  }

  function escapeHtml(s) {
    const str = String(s ?? '');
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function rerender() {
    const history = readHistory();
    const dayMap = buildDayMap(history);

    // default selection: today if visible, else first day of month
    if (!selectedDayKey) selectedDayKey = toDayKey(new Date());

    renderMonthLabel();
    renderCalendar(dayMap);
    renderDayDetails(dayMap);
  }

  function shiftMonth(delta) {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + delta);
    d.setDate(1);
    viewDate = d;
    rerender();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('tc-prev')?.addEventListener('click', () => shiftMonth(-1));
    document.getElementById('tc-next')?.addEventListener('click', () => shiftMonth(1));
    rerender();
  });

})();
