/* js/habits.js — Habit tracker (calendar + check-ins)
   Storage: localStorage (offline-first). */

(function () {
  'use strict';

  const HABITS_KEY = 'habits_definitions_v1';
  const CHECKINS_KEY = 'habits_checkins_v1';

  const WEEKDAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const elTodayDate = document.getElementById('today-date');
  const elTodayHabits = document.getElementById('today-habits');
  const elTodayEmpty = document.getElementById('today-empty');
  const btnMarkAll = document.getElementById('btn-mark-all');

  const elCalendarMonth = document.getElementById('calendar-month');
  const elCalendarGrid = document.getElementById('calendar-grid');
  const btnPrevMonth = document.getElementById('btn-prev-month');
  const btnNextMonth = document.getElementById('btn-next-month');

  const btnAddHabit = document.getElementById('btn-add-habit');
  const elManageList = document.getElementById('habits-manage-list');

  // Day modal
  const dayModal = document.getElementById('day-modal');
  const dayModalDate = document.getElementById('day-modal-date');
  const dayModalList = document.getElementById('day-modal-list');
  const btnCloseDay = document.getElementById('btn-close-day');
  const btnClearDay = document.getElementById('btn-clear-day');

  // Add habit modal
  const habitModal = document.getElementById('habit-modal');
  const btnCloseHabit = document.getElementById('btn-close-habit');
  const btnSaveHabit = document.getElementById('btn-save-habit');
  const inputHabitName = document.getElementById('habit-name');
  const inputHabitEmoji = document.getElementById('habit-emoji');

  // State
  let habits = [];
  let checkins = {};
  let viewMonth = new Date();
  let activeDayKey = null;

  // ---- Helpers
  function safeParse(str, fallback) {
    try {
      const v = JSON.parse(str);
      return v ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function haptic(type) {
    try {
      if (!window.Telegram || !window.Telegram.WebApp) return;
      const hf = window.Telegram.WebApp.HapticFeedback;
      if (!hf) return;
      if (type === 'select' && hf.selectionChanged) hf.selectionChanged();
      else if (type === 'light' && hf.impactOccurred) hf.impactOccurred('light');
    } catch (_) {}
  }

  function toDayKey(dateObj) {
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function fromDayKey(dayKey) {
    // dayKey: YYYY-MM-DD in local time
    const [y, m, d] = String(dayKey).split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function formatHuman(dayKey) {
    const d = fromDayKey(dayKey);
    try {
      return d.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (_) {
      return dayKey;
    }
  }

  function uid() {
    return 'h_' + Math.random().toString(16).slice(2) + '_' + Date.now().toString(16);
  }

  function loadHabits() {
    const raw = localStorage.getItem(HABITS_KEY);
    // Only seed defaults if key is missing completely.
    // If user intentionally удалил все привычки ("[]"), оставляем пустым.
    if (raw === null) {
      const defaults = [
        { id: 'water', name: 'Вода', emoji: '💧' },
        { id: 'sleep', name: 'Сон 8ч', emoji: '😴' },
        { id: 'steps', name: 'Шаги', emoji: '👟' },
        { id: 'protein', name: 'Белок', emoji: '🍗' }
      ];
      localStorage.setItem(HABITS_KEY, JSON.stringify(defaults));
      return defaults;
    }

    const stored = safeParse(raw, []);
    if (!Array.isArray(stored)) return [];

    // normalize
    return stored
      .filter(h => h && (h.id || h.name))
      .map(h => ({
        id: String(h.id || uid()),
        name: String(h.name || 'Привычка'),
        emoji: String(h.emoji || '✅')
      }));
  }

  function saveHabits(next) {
    habits = Array.isArray(next) ? next : [];
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }

  function loadCheckins() {
    const stored = safeParse(localStorage.getItem(CHECKINS_KEY) || '{}', {});
    return stored && typeof stored === 'object' ? stored : {};
  }

  function saveCheckins(next) {
    checkins = next && typeof next === 'object' ? next : {};
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(checkins));
  }

  function getDayMap(dayKey) {
    const m = checkins[dayKey];
    return m && typeof m === 'object' ? m : {};
  }

  function setDone(dayKey, habitId, done) {
    const next = { ...checkins };
    next[dayKey] = { ...(next[dayKey] || {}) };
    next[dayKey][habitId] = !!done;

    // Small cleanup: if all false -> keep empty object? we can remove to reduce storage
    const dayObj = next[dayKey];
    const hasAnyTrue = Object.values(dayObj).some(Boolean);
    if (!hasAnyTrue) {
      // remove empty days to keep storage small
      delete next[dayKey];
    }

    saveCheckins(next);
  }

  function clearDay(dayKey) {
    const next = { ...checkins };
    delete next[dayKey];
    saveCheckins(next);
  }

  function dayProgress(dayKey) {
    const dayObj = getDayMap(dayKey);
    const total = habits.length;
    let done = 0;
    for (const h of habits) {
      if (dayObj[h.id]) done += 1;
    }
    return { done, total, ratio: total ? done / total : 0 };
  }

  function ratioToLevel(ratio) {
    if (ratio <= 0) return 0;
    if (ratio < 0.34) return 1;
    if (ratio < 0.67) return 2;
    if (ratio < 1) return 3;
    return 4;
  }

  // ---- Render
  function renderToday() {
    const todayKey = toDayKey(new Date());
    elTodayDate.textContent = formatHuman(todayKey);

    if (!habits.length) {
      elTodayHabits.innerHTML = '';
      elTodayEmpty.style.display = 'block';
      btnMarkAll.disabled = true;
      btnMarkAll.classList.add('is-loading');
      return;
    }

    btnMarkAll.disabled = false;
    btnMarkAll.classList.remove('is-loading');
    elTodayEmpty.style.display = 'none';

    const dayObj = getDayMap(todayKey);

    elTodayHabits.innerHTML = '';
    for (const h of habits) {
      const isDone = !!dayObj[h.id];

      const row = document.createElement('div');
      row.className = 'habit-row' + (isDone ? ' is-done' : '');
      row.setAttribute('data-habit-id', h.id);

      const left = document.createElement('div');
      left.className = 'habit-left';

      const emoji = document.createElement('div');
      emoji.className = 'habit-emoji';
      emoji.textContent = h.emoji || '✅';

      const name = document.createElement('div');
      name.className = 'habit-name';
      name.textContent = h.name;

      left.appendChild(emoji);
      left.appendChild(name);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'habit-toggle';
      toggle.setAttribute('aria-label', isDone ? 'Снять отметку' : 'Отметить');

      toggle.addEventListener('click', () => {
        const nextVal = !getDayMap(todayKey)[h.id];
        setDone(todayKey, h.id, nextVal);
        haptic('select');
        renderAll();
      });

      // Entire row click toggles too (except toggle button)
      row.addEventListener('click', (e) => {
        if (e && e.target === toggle) return;
        const nextVal = !getDayMap(todayKey)[h.id];
        setDone(todayKey, h.id, nextVal);
        haptic('select');
        renderAll();
      });

      row.appendChild(left);
      row.appendChild(toggle);
      elTodayHabits.appendChild(row);
    }
  }

  function renderCalendar() {
    // Header label
    const monthLabel = viewMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    elCalendarMonth.textContent = monthLabel;

    // Grid
    elCalendarGrid.innerHTML = '';

    // Weekday labels
    for (const wd of WEEKDAYS_RU) {
      const lab = document.createElement('div');
      lab.className = 'cal-label';
      lab.textContent = wd;
      elCalendarGrid.appendChild(lab);
    }

    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    // Monday-based index (Пн=0 ... Вс=6)
    const start = (first.getDay() + 6) % 7;

    // Blank cells before month
    for (let i = 0; i < start; i++) {
      const blank = document.createElement('div');
      blank.className = 'day-cell is-out';
      blank.innerHTML = '<div class="day-num">&nbsp;</div><div class="day-bar"><span></span></div>';
      elCalendarGrid.appendChild(blank);
    }

    const todayKey = toDayKey(new Date());

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const dayKey = toDayKey(d);
      const p = dayProgress(dayKey);
      const level = ratioToLevel(p.ratio);

      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day-cell' + (dayKey === todayKey ? ' is-today' : '');
      cell.setAttribute('data-day', dayKey);
      cell.setAttribute('data-level', String(level));

      const num = document.createElement('div');
      num.className = 'day-num';
      num.textContent = String(day);

      const bar = document.createElement('div');
      bar.className = 'day-bar';
      const fill = document.createElement('span');
      bar.appendChild(fill);

      cell.appendChild(num);
      cell.appendChild(bar);

      cell.addEventListener('click', () => {
        openDayModal(dayKey);
      });

      elCalendarGrid.appendChild(cell);
    }
  }

  function renderManage() {
    elManageList.innerHTML = '';

    if (!habits.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="empty-title">Нет привычек</div><div class="empty-desc">Нажмите «Добавить», чтобы создать привычку.</div>';
      elManageList.appendChild(empty);
      return;
    }

    for (const h of habits) {
      const item = document.createElement('div');
      item.className = 'manage-item';

      const left = document.createElement('div');
      left.className = 'left';

      const emoji = document.createElement('div');
      emoji.className = 'habit-emoji';
      emoji.textContent = h.emoji || '✅';

      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = h.name;

      left.appendChild(emoji);
      left.appendChild(name);

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete-btn btn-state-neutral';
      del.innerHTML = '<span style="font-weight:1000;">Удалить</span>';

      del.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const ok = confirm(`Удалить привычку «${h.name}»?`);
        if (!ok) return;

        // Remove from definitions
        const nextHabits = habits.filter(x => x.id !== h.id);
        saveHabits(nextHabits);

        // Remove from all day maps
        const nextCheckins = { ...checkins };
        for (const dayKey of Object.keys(nextCheckins)) {
          if (!nextCheckins[dayKey] || typeof nextCheckins[dayKey] !== 'object') continue;
          if (h.id in nextCheckins[dayKey]) {
            delete nextCheckins[dayKey][h.id];
            const hasAnyTrue = Object.values(nextCheckins[dayKey]).some(Boolean);
            if (!hasAnyTrue) delete nextCheckins[dayKey];
          }
        }
        saveCheckins(nextCheckins);

        haptic('light');
        renderAll();
      });

      item.appendChild(left);
      item.appendChild(del);
      elManageList.appendChild(item);
    }
  }

  function renderAll() {
    // reload for safety (in case another tab changed data)
    habits = loadHabits();
    checkins = loadCheckins();

    renderToday();
    renderCalendar();
    renderManage();

    // if modal open -> re-render modal
    if (activeDayKey && dayModal && dayModal.style.display !== 'none') {
      renderDayModal(activeDayKey);
    }

    try { if (window.lucide) lucide.createIcons(); } catch (_) {}
  }

  // ---- Day modal
  function openDayModal(dayKey) {
    activeDayKey = dayKey;
    renderDayModal(dayKey);

    dayModal.style.display = 'grid';
    dayModal.setAttribute('aria-hidden', 'false');
    haptic('select');
  }

  function closeDayModal() {
    dayModal.style.display = 'none';
    dayModal.setAttribute('aria-hidden', 'true');
    activeDayKey = null;
  }

  function renderDayModal(dayKey) {
    dayModalDate.textContent = formatHuman(dayKey);

    if (!habits.length) {
      dayModalList.innerHTML = '<div class="empty-state"><div class="empty-title">Нет привычек</div><div class="empty-desc">Добавьте привычку, чтобы отмечать дни.</div></div>';
      return;
    }

    const dayObj = getDayMap(dayKey);
    dayModalList.innerHTML = '';

    for (const h of habits) {
      const isDone = !!dayObj[h.id];

      const row = document.createElement('div');
      row.className = 'habit-row' + (isDone ? ' is-done' : '');

      const left = document.createElement('div');
      left.className = 'habit-left';

      const emoji = document.createElement('div');
      emoji.className = 'habit-emoji';
      emoji.textContent = h.emoji || '✅';

      const name = document.createElement('div');
      name.className = 'habit-name';
      name.textContent = h.name;

      left.appendChild(emoji);
      left.appendChild(name);

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'habit-toggle';

      toggle.addEventListener('click', () => {
        const nextVal = !getDayMap(dayKey)[h.id];
        setDone(dayKey, h.id, nextVal);
        haptic('select');
        renderAll();
      });

      row.addEventListener('click', (e) => {
        if (e && e.target === toggle) return;
        const nextVal = !getDayMap(dayKey)[h.id];
        setDone(dayKey, h.id, nextVal);
        haptic('select');
        renderAll();
      });

      row.appendChild(left);
      row.appendChild(toggle);
      dayModalList.appendChild(row);
    }
  }

  // ---- Add habit modal
  function openHabitModal() {
    inputHabitName.value = '';
    inputHabitEmoji.value = '';

    habitModal.style.display = 'grid';
    habitModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      try { inputHabitName.focus(); } catch (_) {}
    }, 50);

    haptic('select');
  }

  function closeHabitModal() {
    habitModal.style.display = 'none';
    habitModal.setAttribute('aria-hidden', 'true');
  }

  function saveHabitFromModal() {
    const name = String(inputHabitName.value || '').trim();
    const emoji = String(inputHabitEmoji.value || '').trim();

    if (!name) {
      alert('Введите название привычки.');
      return;
    }

    const next = habits.slice();
    next.push({
      id: uid(),
      name,
      emoji: emoji || '✅'
    });

    saveHabits(next);
    closeHabitModal();
    haptic('light');
    renderAll();
  }

  // ---- Listeners
  function bind() {
    btnPrevMonth.addEventListener('click', () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
      haptic('select');
      renderAll();
    });

    btnNextMonth.addEventListener('click', () => {
      viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
      haptic('select');
      renderAll();
    });

    btnMarkAll.addEventListener('click', () => {
      if (!habits.length) return;

      const todayKey = toDayKey(new Date());
      const p = dayProgress(todayKey);
      const shouldMark = p.done !== p.total; // if not all done -> mark all

      for (const h of habits) {
        setDone(todayKey, h.id, shouldMark);
      }
      haptic('light');
      renderAll();
    });

    btnAddHabit.addEventListener('click', () => openHabitModal());
    btnCloseHabit.addEventListener('click', () => closeHabitModal());
    btnSaveHabit.addEventListener('click', () => saveHabitFromModal());

    btnCloseDay.addEventListener('click', () => closeDayModal());
    btnClearDay.addEventListener('click', () => {
      if (!activeDayKey) return;
      const ok = confirm('Очистить все отметки за этот день?');
      if (!ok) return;
      clearDay(activeDayKey);
      haptic('light');
      renderAll();
    });

    // Close modals by clicking on backdrop
    dayModal.addEventListener('click', (e) => {
      if (e.target === dayModal) closeDayModal();
    });
    habitModal.addEventListener('click', (e) => {
      if (e.target === habitModal) closeHabitModal();
    });

    // Save habit with Enter
    inputHabitName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveHabitFromModal();
      }
    });
    inputHabitEmoji.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveHabitFromModal();
      }
    });

    // Keep month label aligned with "today" at first load
    viewMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }

  function init() {
    habits = loadHabits();
    checkins = loadCheckins();
    bind();
    renderAll();

    // Telegram polish
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', init);
})();
