(function(){
  const COURSES_URL = 'data/nutrition_courses.json';
  const PROGRESS_KEY = 'nutrition_progress_v1';

  function loadProgress(){
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function saveProgress(p){
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  function percent(done, total){
    if (!total) return 0;
    return Math.max(0, Math.min(100, Math.round((done/total)*100)));
  }

  async function loadCourses(){
    const res = await fetch(COURSES_URL, { cache: 'no-store' });
    if(!res.ok) throw new Error('Failed to load courses');
    return await res.json();
  }

  function getWalletBalance(){
    try{
      const w = JSON.parse(localStorage.getItem('user_gems_wallet') || '{"balance":0}');
      return w && typeof w.balance === 'number' ? w.balance : 0;
    }catch(e){ return 0; }
  }

  function renderWalletChip(){
    const el = document.getElementById('gemsChip');
    if(!el) return;
    el.textContent = `💎 ${getWalletBalance()}`;
  }

  function courseProgress(progress, course){
    const c = progress[course.id] || {};
    const completed = c.completedLessons || {};
    const doneCount = Object.keys(completed).length;
    return { doneCount, total: course.lessons.length, pct: percent(doneCount, course.lessons.length) };
  }

  function courseHref(course){
    return `nutrition-course.html?course=${encodeURIComponent(course.id)}&lesson=0`;
  }

  function setInner(el, html){ el.innerHTML = html; }

  function createCourseCard(course, prog){
    const div = document.createElement('div');
    div.className = 'card';
    const reward = course.rewards || { perLessonGems: 0, courseCompleteGems: 0 };
    setInner(div, `
      <h3>${course.title}</h3>
      <div class="muted">${course.description || ''}</div>
      <div class="row">
        <div style="flex:1;">
          <div class="progress"><div style="width:${prog.pct}%;"></div></div>
          <div class="small" style="margin-top:6px;">Прогресс: ${prog.doneCount}/${prog.total}</div>
        </div>
        <div class="pill">🎁 ${reward.perLessonGems || 0} / урок • ${reward.courseCompleteGems || 0} / курс</div>
      </div>
      <div class="row">
        <a class="btn primary" href="${courseHref(course)}">Открыть</a>
        <span class="small">~ ${course.estimated_days || prog.total} дней</span>
      </div>
    `);
    return div;
  }

  async function init(){
    renderWalletChip();
    const list = document.getElementById('coursesList');
    if(!list) return;
    setInner(list, `<div class="card"><div class="muted">Загружаю курсы…</div></div>`);
    let courses = [];
    try{
      courses = await loadCourses();
    }catch(e){
      setInner(list, `<div class="card"><div class="muted">Не удалось загрузить курсы. Проверь, что файл ${COURSES_URL} доступен.</div></div>`);
      return;
    }

    const progress = loadProgress();
    list.innerHTML = '';
    courses.forEach(course=>{
      const prog = courseProgress(progress, course);
      list.appendChild(createCourseCard(course, prog));
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
