(function(){
  function safeJsonParse(str, fallback){
    try{ return JSON.parse(str); }catch(_){ return fallback; }
  }
  function loadHistory(){
    return safeJsonParse(localStorage.getItem('trainingHistory')||'[]', []);
  }
  function loadWeight(){
    return safeJsonParse(localStorage.getItem('weightHistory')||'[]', []);
  }
  function startOfWeek(d){
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Mon=0
    x.setHours(0,0,0,0);
    x.setDate(x.getDate() - day);
    return x;
  }
  function formatRuDate(d){
    return d.toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' });
  }
  function cap(s){ return (s||'').charAt(0).toUpperCase() + (s||'').slice(1); }

  function getName(){
    // Telegram first (if available), else fallback from localStorage, else generic.
    try{
      const tg = window.Telegram && window.Telegram.WebApp;
      const u = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (u && (u.first_name || u.username)) return u.first_name || u.username;
    }catch(_){}
    const stored = (localStorage.getItem('profileName') || '').trim();
    if (stored) return stored;
    return 'друг';
  }

  function computeWeekStats(history){
    const ws = startOfWeek(new Date());
    const we = new Date(ws); we.setDate(we.getDate()+7);
    const items = history.filter(h=>{
      const d = new Date(h.date || h.finishedAt || h.timestamp || 0);
      return d >= ws && d < we;
    });
    const workouts = items.length;
    // Best effort minutes: prefer duration if present else 45 min per workout.
    const minutes = items.reduce((sum, it)=>{
      const m = Number(it.durationMinutes || it.minutes || 0);
      return sum + (m>0 ? m : 45);
    }, 0);
    // kcal: if recorded, sum; else estimate 350/workout
    const kcal = items.reduce((sum, it)=>{
      const k = Number(it.kcal || it.calories || 0);
      return sum + (k>0 ? k : 0);
    }, 0) || (workouts * 350);

    // streak by consecutive days with workouts (rough)
    const daysSet = new Set(items.map(it=>{
      const d = new Date(it.date || it.finishedAt || it.timestamp || 0);
      d.setHours(0,0,0,0);
      return d.getTime();
    }));
    // build from today backwards
    let streak = 0;
    const cur = new Date(); cur.setHours(0,0,0,0);
    for(let i=0;i<365;i++){
      const t = cur.getTime() - i*86400000;
      if (daysSet.has(t)) streak++;
      else break;
    }
    return {workouts, minutes, kcal, streak};
  }

  function setText(id, txt){
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function init(){
    // date
    const now = new Date();
    setText('mono-date', cap(formatRuDate(now)));

    // greeting
    setText('mono-name', getName());

    const hist = loadHistory();
    const st = computeWeekStats(hist);

    setText('kpi-min', String(st.minutes));
    setText('tile-workouts', String(st.workouts));
    setText('tile-kcal', st.kcal.toLocaleString('ru-RU'));
    setText('tile-streak', String(st.streak));

    const weights = loadWeight();
    const last = weights.length ? weights[weights.length-1] : null;
    const w = last ? (Number(last.weight)||0) : 0;
    setText('tile-weight', w ? (w.toFixed(1).replace('.',',')) : '—');

    // a11y: mark missing data
    if (!weights.length) {
      const el = document.getElementById('tile-weight');
      if (el) el.setAttribute('aria-label','Нет данных веса');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
