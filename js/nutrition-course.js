(function(){
  const COURSES_URL = 'data/nutrition_courses.json';
  const PROGRESS_KEY = 'nutrition_progress_v1';

  function qs(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }
  function toInt(v, d=0){
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : d;
  }
  function loadProgress(){
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function saveProgress(p){
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  async function loadCourses(){
    const res = await fetch(COURSES_URL, { cache: 'no-store' });
    if(!res.ok) throw new Error('Failed to load courses');
    return await res.json();
  }

  // --- Gems integration (if gems.js exists)
  function safeAddGems(amount, reason, key){
    if(!amount) return false;
    try{
      if(typeof window.Gems !== 'undefined' && typeof window.Gems.add === 'function'){
        return window.Gems.add(amount, reason, key);
      }
      // fallback minimal wallet
      const w = JSON.parse(localStorage.getItem('user_gems_wallet') || '{"balance":0}');
      const idem = JSON.parse(localStorage.getItem('user_gems_idempotency') || '{}');
      if(idem[key]) return false;
      idem[key] = true;
      w.balance = (w.balance || 0) + amount;
      localStorage.setItem('user_gems_wallet', JSON.stringify(w));
      localStorage.setItem('user_gems_idempotency', JSON.stringify(idem));
      return true;
    }catch(e){ return false; }
  }

  function getWalletBalance(){
    try{
      const w = JSON.parse(localStorage.getItem('user_gems_wallet') || '{"balance":0}');
      return w && typeof w.balance === 'number' ? w.balance : 0;
    }catch(e){ return 0; }
  }
  function renderWalletChip(){
    const el = document.getElementById('gemsChip');
    if(el) el.textContent = `💎 ${getWalletBalance()}`;
  }

  function setInner(el, html){ el.innerHTML = html; }

  function ensureProgressShape(p, courseId){
    if(!p[courseId]) p[courseId] = {};
    if(!p[courseId].completedLessons) p[courseId].completedLessons = {};
    if(!p[courseId].courseCompletedAt) p[courseId].courseCompletedAt = null;
    return p;
  }

  function computeCounts(progress, course){
    const c = progress[course.id] || { completedLessons: {} };
    const doneCount = Object.keys(c.completedLessons || {}).length;
    const total = course.lessons.length;
    return { doneCount, total };
  }

  function telegramToast(msg){
    try{
      if(window.Telegram && Telegram.WebApp && Telegram.WebApp.showPopup){
        Telegram.WebApp.showPopup({ title: 'Готово', message: msg, buttons:[{type:'ok'}] });
        return;
      }
    }catch(e){}
    alert(msg);
  }

  function navigate(courseId, lessonIndex){
    const u = new URL(window.location.href);
    u.searchParams.set('course', courseId);
    u.searchParams.set('lesson', String(lessonIndex));
    window.location.href = u.toString();
  }

  function renderLessonList(course, progress){
    const list = document.getElementById('lessonList');
    if(!list) return;
    const c = progress[course.id] || { completedLessons: {} };
    list.innerHTML = '';
    course.lessons.forEach((ls, idx)=>{
      const a = document.createElement('a');
      const done = !!(c.completedLessons && c.completedLessons[ls.id]);
      a.className = 'btn' + (done ? ' primary' : '');
      a.style.justifyContent = 'space-between';
      a.href = `nutrition-course.html?course=${encodeURIComponent(course.id)}&lesson=${idx}`;
      a.innerHTML = `<span>${idx+1}. ${ls.title}</span><span>${done ? '✅' : ''}</span>`;
      list.appendChild(a);
    });
  }

  async function init(){
    renderWalletChip();
    const courseId = qs('course');
    const lessonIndex = toInt(qs('lesson'), 0);

    const root = document.getElementById('courseRoot');
    if(!root){
      return;
    }
    setInner(root, `<div class="card"><div class="muted">Загружаю урок…</div></div>`);

    let courses = [];
    try{
      courses = await loadCourses();
    }catch(e){
      setInner(root, `<div class="card"><div class="muted">Не удалось загрузить курсы. Проверь файл ${COURSES_URL}.</div></div>`);
      return;
    }

    const course = courses.find(c=>c.id === courseId) || courses[0];
    if(!course){
      setInner(root, `<div class="card"><div class="muted">Курсы не найдены.</div></div>`);
      return;
    }

    const idx = Math.max(0, Math.min(course.lessons.length-1, lessonIndex));
    const lesson = course.lessons[idx];

    const progress = loadProgress();
    ensureProgressShape(progress, course.id);
    const cprog = progress[course.id];
    const rewards = course.rewards || { perLessonGems: 0, courseCompleteGems: 0 };

    const done = !!cprog.completedLessons[lesson.id];
    const counts = computeCounts(progress, course);

    setInner(root, `
      <div class="header-row">
        <div>
          <div class="small"><a class="btn" href="nutrition.html">← Назад</a></div>
        </div>
        <div class="pill" id="gemsChip">💎 ${getWalletBalance()}</div>
      </div>

      <div class="card lesson-card">
        <div class="small">${course.title}</div>
        <h2 class="lesson-title">${idx+1}. ${lesson.title}</h2>
        <div class="lesson-content">
          ${(lesson.content || []).map(p=>`<p>${p}</p>`).join('')}
        </div>

        <div class="row">
          <div class="pill">🎁 ${rewards.perLessonGems || 0} / урок • ${rewards.courseCompleteGems || 0} / курс</div>
          <button class="btn primary" id="completeBtn">${done ? 'Урок выполнен ✅' : 'Отметить урок'}</button>
        </div>

        <div class="nav-row">
          <button class="btn" id="prevBtn">← Предыдущий</button>
          <div class="small">Прогресс: ${counts.doneCount}/${counts.total}</div>
          <button class="btn" id="nextBtn">Следующий →</button>
        </div>
      </div>

      <div class="card">
        <div class="row" style="margin-top:0;">
          <div><strong>Содержание</strong></div>
          <div class="small">Нажми урок, чтобы открыть</div>
        </div>
        <div class="list" id="lessonList" style="margin-top:10px;"></div>
      </div>
    `);

    renderLessonList(course, progress);

    const completeBtn = document.getElementById('completeBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === course.lessons.length - 1;

    prevBtn.addEventListener('click', ()=> navigate(course.id, idx-1));
    nextBtn.addEventListener('click', ()=> navigate(course.id, idx+1));

    completeBtn.addEventListener('click', ()=>{
      const p = loadProgress();
      ensureProgressShape(p, course.id);
      const cp = p[course.id];

      if(!cp.completedLessons[lesson.id]){
        cp.completedLessons[lesson.id] = new Date().toISOString();

        // Per-lesson gems once
        const key = `nutrition:lesson:${course.id}:${lesson.id}`;
        safeAddGems(rewards.perLessonGems || 0, `nutrition_lesson:${course.id}:${lesson.id}`, key);

        // Course completion gems once
        const total = course.lessons.length;
        const doneCount = Object.keys(cp.completedLessons).length;
        if(doneCount >= total && !cp.courseCompletedAt){
          cp.courseCompletedAt = new Date().toISOString();
          const ckey = `nutrition:course:${course.id}`;
          safeAddGems(rewards.courseCompleteGems || 0, `nutrition_course:${course.id}`, ckey);
        }

        saveProgress(p);
        renderWalletChip();
        telegramToast('Урок отмечен! 🎉');
        // re-render list / counts by reload
        setTimeout(()=> window.location.reload(), 200);
      }else{
        telegramToast('Этот урок уже отмечен ✅');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
