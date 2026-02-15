// ==========================================
// === 0. БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ APP (TG) ===
// ==========================================
//
// Некоторые страницы (например, info.html / training.html) вызывают initApp().
// Ранее этой функции не было, что ломало JS.
// Здесь делаем её идемпотентной и безопасной для запуска вне Telegram.
//

import type {
  Exercise,
  Course,
  CourseScheduleItem,
  ExerciseLevel,
  ContentPackExercise,
  ContentPackCourse,
  CourseSession,
  Prescription,
  ModalState,
  WorkoutListItem
} from './types/index';
// ==========================================
// === 0. БЕЗОПАСНАЯ ИНИЦИАЛИЗАЦИЯ APP (TG) ===
// ==========================================
//
// Некоторые страницы (например, info.html / training.html) вызывают initApp().
// Ранее этой функции не было, что ломало JS.
// Здесь делаем её идемпотентной и безопасной для запуска вне Telegram.
//

if (typeof window.initApp !== 'function') {
  window.initApp = function initApp() {
    // Telegram WebApp (если открыто внутри Telegram)
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
      }
    } catch (e) {
      console.warn('[initApp] Telegram init failed:', e);
    }

    // Lucide icons (если библиотека подключена на странице)
    try {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    } catch (_) {}
  };
}

// ==========================================
// === 0.1 CONTENT PACK (Exercises & Programs) ===
// ==========================================
//
// Поддерживаем внешний контентный пакет данных (упражнения + программы) в JSON.
// Если файлов нет (404) — приложение продолжает работать на встроенной базе.
//
// Ожидаемые файлы:
//   data/content_pack/exercises.json
//   data/content_pack/courses.json
//   data/content_pack/course_sessions.json   (optional)
//   data/content_pack/prescriptions.json     (optional)
//
// Форматы поддерживаемые в courses.json:
//   1) массив courses[] (как в схеме content pack)
//   2) bundle объект { course, sessions, prescriptions, ... }

const __CONTENT_PACK_BASE = 'data/content_pack';
let __contentPackState = {
  loaded: false,
  used: false,
  loading: null as Promise<boolean> | null,
};

async function __fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${__CONTENT_PACK_BASE}/${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = new Error(`Failed to load ${path}: ${res.status}`);
    // @ts-ignore
    err.__status = res.status;
    throw err;
  }
  return await res.json() as T;
}

async function __fetchText(path: string): Promise<string> {
  const res = await fetch(`${__CONTENT_PACK_BASE}/${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = new Error(`Failed to load ${path}: ${res.status}`);
    // @ts-ignore
    err.__status = res.status;
    throw err;
  }
  return await res.text();
}

// Небольшой CSV-парсер (подходит для наших экспортов; поддерживает кавычки)
function __parseCsv(text: string): string[][] {
  const lines = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const out: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const row: string[] = [];
    let cur = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (inQ) {
        if (ch === '"') {
          if (line[j + 1] === '"') { cur += '"'; j++; }
          else inQ = false;
        } else {
          cur += ch;
        }
      } else {
        if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '"') { inQ = true; }
        else { cur += ch; }
      }
    }
    row.push(cur);
    out.push(row);
  }
  return out;
}

function __csvToObjects(text: string): Record<string, string>[] {
  const rows = __parseCsv(text);
  if (!rows.length) return [];
  const header = rows[0].map(h => String(h || '').trim());
  const objs: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').toString().trim();
    });
    objs.push(obj);
  }
  return objs;
}

function __equipmentToRuShort(equipmentArr: string[]): string {
  const map: Record<string, string> = {
    barbell: 'Штанга',
    dumbbell: 'Гантели',
    kettlebell: 'Гиря',
    cable: 'Блок',
    machine_selectorized: 'Тренажёр',
    machine_plate_loaded: 'Тренажёр',
    smith_machine: 'Смит',
    bodyweight: 'Вес тела',
    band: 'Резинка',
    bench: 'Скамья',
    rack: 'Рама',
    pullup_bar: 'Турник',
    dip_bars: 'Брусья',
    trap_bar: 'Трэп-гриф',
    landmine: 'Лэндмайн',
    sled: 'Санки',
    other: 'Другое',
  };

  const arr = Array.isArray(equipmentArr) ? equipmentArr : [];
  const ru = arr.map(k => map[k] || k).filter(Boolean) as string[];
  if (ru.length === 0) return 'Оборудование';
  if (ru.length <= 2) return ru.join(' + ');
  return `${ru[0]} + ${ru[1]}…`;
}

function __inferMuscleGroupFromExercise(ex: ContentPackExercise): string {
  const pattern = String(ex?.movement_pattern || '').toLowerCase();
  const primary = (ex?.primary_muscles || []).join(' ').toLowerCase();

  if (pattern === 'push_horizontal') return 'chest';
  if (pattern === 'pull_vertical' || pattern === 'pull_horizontal') return 'back';
  if (pattern === 'push_vertical') return 'shoulders';
  if (pattern === 'squat' || pattern === 'hinge' || pattern === 'lunge' || pattern === 'calf' || pattern === 'carry') return 'legs';
  if (pattern.startsWith('core_')) return 'abs';
  if (pattern === 'cardio') return 'cardio';
  if (pattern === 'mobility') return 'mobility';

  // isolation/other — пробуем угадать по мышцам
  if (primary.includes('pector')) return 'chest';
  if (primary.includes('lat') || primary.includes('rhombo') || primary.includes('trap')) return 'back';
  if (primary.includes('quad') || primary.includes('glute') || primary.includes('hamstring') || primary.includes('calf')) return 'legs';
  if (primary.includes('deltoid') || primary.includes('shoulder')) return 'shoulders';
  if (primary.includes('biceps') || primary.includes('triceps') || primary.includes('forearm')) return 'arms';
  if (primary.includes('abdom')) return 'abs';

  return 'other';
}

function __defaultRepsForExercise(ex: ContentPackExercise): string {
  const pattern = String(ex?.movement_pattern || '').toLowerCase();
  if (pattern.startsWith('core_')) return '30–45 сек';
  if (pattern === 'cardio') return '10–20 мин';
  if (pattern === 'mobility') return '6–10 мин';
  if (pattern === 'isolation' || pattern === 'calf') return '10–15';
  if (pattern === 'squat' || pattern === 'hinge') return '6–10';
  return '8–12';
}

function __firstOrDash(arr: any[]): string {
  return Array.isArray(arr) && arr.length ? String(arr[0]) : '-';
}

function __iconForGroup(group: string): string {
  const map: Record<string, string> = {
    chest: '💪',
    back: '🏋️',
    legs: '🦵',
    shoulders: '🏋️',
    arms: '💪',
    abs: '🧱',
    cardio: '🏃',
    mobility: '🤸',
    other: '🏋️',
  };
  return map[group] || '🏋️';
}

function __toInternalExercise(ex: ContentPackExercise): Exercise {
  const muscle = __inferMuscleGroupFromExercise(ex);
  const reps = __defaultRepsForExercise(ex);
  const rest = Number(ex?.recommended_rest_sec || 60);
  const equip = __equipmentToRuShort(ex?.equipment);
  const tempo = ex?.tempo_recommendation ? `Темп ${ex.tempo_recommendation}` : '';
  const cue = __firstOrDash(ex?.execution_cues);

  const mkLevel = (rirText: string): ExerciseLevel => ({
    weight: equip,
    reps,
    restTime: rest,
    advice: [rirText, tempo, cue].filter(Boolean).join(' • '),
  });

  return {
    id: ex.id,
    name: ex.name_ru || ex.name_en || ex.id,
    muscle,
    icon: __iconForGroup(muscle),
    description: (ex.primary_muscles?.length ? `Основные: ${ex.primary_muscles.join(', ')}` : ex.movement_pattern || 'Упражнение'),
    sets: 3,
    levels: {
      beginner: mkLevel('RIR 3–4'),
      intermediate: mkLevel('RIR 2–3'),
      pro: mkLevel('RIR 1–2'),
    },
    __pack: ex,
  };
}

function __buildCourseVm(course: ContentPackCourse, sessions: CourseSession[], prescriptions: Prescription[]): Course {
  const courseId = course.course_id || course.id;
  const title = course.title_ru || course.title || courseId;
  const level = course.level || 'beginner';
  const duration = course.duration_weeks ? `${course.duration_weeks} недель` : (course.duration || '');
  const desc = course.substitution_policy?.ru || course.description || course.goal || '';

  const sess = (Array.isArray(sessions) ? sessions : []).filter(s => s.course_id === courseId);
  const presc = Array.isArray(prescriptions) ? prescriptions : [];

  // если sessions не дали — пытаемся использовать уже "schedule" в курсе
  let schedule: CourseScheduleItem[] = [];
  if (sess.length) {
    schedule = sess.map(s => {
      const items: (string | Prescription)[] = presc
        .filter(p => p.template_id === s.template_id)
        .sort((a, b) => (a.order_in_session || 0) - (b.order_in_session || 0))
        .map(p => ({
          prescription_id: p.prescription_id,
          template_id: p.template_id,
          exercise_id: p.exercise_id,
          order_in_session: p.order_in_session,
          sets: p.sets,
          reps_min: p.reps_min,
          reps_max: p.reps_max,
          target_rir: p.target_rir,
          rest_sec: p.rest_sec,
          tempo: p.tempo,
          notes_ru: p.notes_ru,
          progression_rule_id: p.progression_rule_id,
        }));
      return {
        name: s.title_ru || `Тренировка ${s.week_rotation_code || ''}`.trim(),
        exercises: items,
        template_id: s.template_id,
        focus: s.focus,
      };
    });
  } else if (Array.isArray(course.schedule)) {
    schedule = course.schedule;
  }

  return {
    id: courseId,
    title,
    subtitle: course.split_type || '',
    description: String(desc || '').slice(0, 180),
    duration,
    goal: course.goal || '',
    level,
    schedule,
    __pack: course,
  };
}

async function ensureContentPackLoaded(): Promise<boolean> {
  if (__contentPackState.loaded) return __contentPackState.used;
  if (__contentPackState.loading) return __contentPackState.loading;

  __contentPackState.loading = (async (): Promise<boolean> => {
    try {
      const exercises = await __fetchJson('exercises.json');

      // courses.json может быть массивом или bundle-объектом
      let coursesRaw: any = null;
      try {
        coursesRaw = await __fetchJson('courses.json');
      } catch (e) {
        console.warn('[content-pack] courses.json not found:', e);
      }

      let courses: ContentPackCourse[] = [];
      let sessions: CourseSession[] = [];
      let prescriptions: Prescription[] = [];

      if (coursesRaw && !Array.isArray(coursesRaw) && typeof coursesRaw === 'object' && coursesRaw.course) {
        // bundle
        courses = [coursesRaw.course];
        sessions = coursesRaw.sessions || [];
        prescriptions = coursesRaw.prescriptions || [];
      } else if (Array.isArray(coursesRaw)) {
        courses = coursesRaw;
        // пытаемся подхватить нормализованные файлы
        try {
          sessions = await __fetchJson('course_sessions.json');
        } catch (e) {
          // fallback: sessions.csv
          try {
            const csv = await __fetchText('sessions.csv');
            const rows = __csvToObjects(csv);
            const toNum = (v: any): number | null => {
              if (v === null || v === undefined || v === '') return null;
              const n = Number(String(v).replace(',', '.'));
              return Number.isFinite(n) ? n : null;
            };
            sessions = rows.map(r => ({
              template_id: r.template_id || r.id || '',
              course_id: r.course_id || '',
              title_ru: r.title_ru || r.title || '',
              week_rotation_code: r.week_rotation_code || r.rotation || '',
              estimated_duration_min: toNum(r.estimated_duration_min) || 0,
              focus: r.focus || '',
            }));
          } catch (e) {
            console.warn('[content-pack] sessions.csv parse failed:', e);
            sessions = [];
          }
        }
        try {
          prescriptions = await __fetchJson('prescriptions.json');
        } catch (e) {
          // fallback: prescriptions.csv (есть в экспорте content pack)
          try {
            const csv = await __fetchText('prescriptions.csv');
            const rows = __csvToObjects(csv);
            const toNum = (v: any): number | null => {
              if (v === null || v === undefined || v === '') return null;
              const n = Number(String(v).replace(',', '.'));
              return Number.isFinite(n) ? n : null;
            };
            prescriptions = rows.map(r => ({
              prescription_id: r.prescription_id || r.id || '',
              template_id: r.template_id || '',
              exercise_id: r.exercise_id || '',
              order_in_session: toNum(r.order_in_session) || 0,
              sets: toNum(r.sets) || 0,
              reps_min: toNum(r.reps_min),
              reps_max: toNum(r.reps_max),
              target_rir: toNum(r.target_rir),
              rest_sec: toNum(r.rest_sec) || 0,
              tempo: r.tempo || '',
              progression_rule_id: r.progression_rule_id || '',
              notes_ru: r.notes_ru || r.notes || '',
            }));
          } catch (e) {
            console.warn('[content-pack] prescriptions.csv parse failed:', e);
            prescriptions = [];
          }
        }
      }

      // Если курсы не загрузились — всё равно можем использовать базу упражнений
      const packExercises = Array.isArray(exercises) ? exercises : [];
      const internalExercises = packExercises.map(__toInternalExercise);

      // Индекс для удобства (замены, отображение)
      window.__exercisePackIndex = new Map(packExercises.map(e => [e.id, e]));

      EXERCISE_DATABASE = internalExercises;

      if (Array.isArray(courses) && courses.length && Array.isArray(sessions) && Array.isArray(prescriptions) && sessions.length && prescriptions.length) {
        COURSES_DATABASE = courses.map(c => __buildCourseVm(c, sessions, prescriptions));
      }

      __contentPackState.used = true;
      console.log('[content-pack] loaded', { exercises: internalExercises.length, courses: (COURSES_DATABASE || []).length });
      return __contentPackState.used;
    } catch (e) {
      // Типичный сценарий: нет файлов (404) — игнорируем
      const status = (e as any)?.__status;
      if (status !== 404) console.warn('[content-pack] load failed:', e);
      __contentPackState.used = false;
      return false;
    } finally {
      __contentPackState.loaded = true;
    }
  })();

  return __contentPackState.loading;
}

// Экспортируем, чтобы страницы могли await перед рендером.
window.ensureContentPackLoaded = ensureContentPackLoaded;

// ==========================================
// === 1. БАЗА ДАННЫХ УПРАЖНЕНИЙ ===
// ==========================================

let EXERCISE_DATABASE = [
  // --- ГРУДЬ ---
  {
    id: 'pushups',
    name: 'Отжимания',
    muscle: 'chest',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h12"/></svg>`,
    description: 'Базовое упражнение для грудных мышц и трицепса.',
    sets: 3,
    levels: {
      beginner: { weight: 'Вес тела', reps: '10-12 раз', restTime: 60, advice: 'Упор на колени, если тяжело.' },
      intermediate: { weight: 'Вес тела', reps: '15-20 раз', restTime: 45, advice: 'Медленное опускание.' },
      pro: { weight: 'Рюкзак 10 кг', reps: '20 раз', restTime: 30, advice: 'Взрывной подъем.' }
    }
  },
  {
    id: 'bench_press',
    name: 'Жим штанги лежа',
    muscle: 'chest',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6h12M6 18h12M4 10v4M20 10v4M6 12h12"/></svg>`,
    description: 'Главное упражнение на массу груди.',
    sets: 4,
    levels: {
      beginner: { weight: 'Гриф (20кг)', reps: '12-15 раз', restTime: 90, advice: 'Освоить технику.' },
      intermediate: { weight: '40-50кг', reps: '10-12 раз', restTime: 75, advice: 'Лопатки сведены.' },
      pro: { weight: '80кг+', reps: '6-8 раз', restTime: 120, advice: 'Со страховкой.' }
    }
  },
  {
    id: 'dumbbell_flyes',
    name: 'Разводка гантелей',
    muscle: 'chest',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/><path d="M6 9l6 3l6 -3"/></svg>`,
    description: 'Растяжение грудных мышц.',
    sets: 3,
    levels: {
      beginner: { weight: '4-6 кг', reps: '12 раз', restTime: 60, advice: 'Локти чуть согнуты.' },
      intermediate: { weight: '10 кг', reps: '12 раз', restTime: 60, advice: 'Чувство растяжения.' },
      pro: { weight: '16 кг', reps: '12 раз', restTime: 45, advice: 'До жжения.' }
    }
  },

  // --- СПИНА ---
  {
    id: 'pull_ups',
    name: 'Подтягивания',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 0l-3-3m3 3l3-3M7 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"/></svg>`,
    description: 'Ширина спины.',
    sets: 3,
    levels: {
      beginner: { weight: 'Гравитрон', reps: '8-10 раз', restTime: 90, advice: 'Сведение лопаток.' },
      intermediate: { weight: 'Вес тела', reps: '10-12 раз', restTime: 60, advice: 'Без рывков.' },
      pro: { weight: 'Пояс 15кг', reps: '10 раз', restTime: 60, advice: 'Чистая техника.' }
    }
  },
  {
    id: 'deadlift',
    name: 'Становая тяга',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4"/></svg>`,
    description: 'Мощь всей задней цепи.',
    sets: 4,
    levels: {
      beginner: { weight: 'Гриф (20кг)', reps: '10 раз', restTime: 120, advice: 'Прямая спина.' },
      intermediate: { weight: '50кг', reps: '8-10 раз', restTime: 90, advice: 'Гриф близко к ногам.' },
      pro: { weight: '100кг+', reps: '5-6 раз', restTime: 180, advice: 'Пояс обязателен.' }
    }
  },

  // --- НОГИ ---
  {
    id: 'squats',
    name: 'Приседания',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M7 21l3-9-2-3m7 12l-3-9 2-3"/></svg>`,
    description: 'Король упражнений для ног.',
    sets: 4,
    levels: {
      beginner: { weight: 'Вес тела', reps: '20 раз', restTime: 60, advice: 'Пятки на полу.' },
      intermediate: { weight: 'Гантели 15кг', reps: '15 раз', restTime: 60, advice: 'Глубокий присед.' },
      pro: { weight: 'Штанга 80кг', reps: '10 раз', restTime: 90, advice: 'Взгляд прямо.' }
    }
  },
  {
    id: 'lunges',
    name: 'Выпады',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 4l-4 16M8 8l4 4 4-4"/></svg>`,
    description: 'Форма ног и баланс.',
    sets: 3,
    levels: {
      beginner: { weight: 'Вес тела', reps: '10 на ногу', restTime: 60, advice: 'Колено не касается пола.' },
      intermediate: { weight: 'Гантели 10кг', reps: '12 на ногу', restTime: 60, advice: 'Корпус вертикально.' },
      pro: { weight: 'Штанга 40кг', reps: '10 на ногу', restTime: 60, advice: 'Равновесие.' }
    }
  },

  // --- ДОПОЛНИТЕЛЬНЫЕ УПРАЖНЕНИЯ (ДЛЯ КУРСОВ) ---
  {
    id: 'leg_press',
    name: 'Жим ногами',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4"/></svg>`,
    description: 'Безопасная альтернатива приседаниям.',
    sets: 3,
    levels: { beginner: { weight: '10-20 кг', reps: '12-15 раз', restTime: 60, advice: 'Не выпрямляйте колени полностью.' } }
  },
  {
    id: 'overhead_press',
    name: 'Жим гантелей сидя',
    muscle: 'shoulders',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="2"/><path d="M12 8v8"/></svg>`,
    description: 'Базовое упражнение для плеч.',
    sets: 3,
    levels: { beginner: { weight: '5-8 кг', reps: '12-15 раз', restTime: 60, advice: 'Держите спину прямо.' } }
  },
  {
    id: 'crunches',
    name: 'Скручивания на пресс',
    muscle: 'abs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>`,
    description: 'Упражнение на мышцы живота.',
    sets: 3,
    levels: { beginner: { weight: 'Вес тела', reps: '15-20 раз', restTime: 45, advice: 'Поднимайте лопатки, поясница прижата.' } }
  },
  {
    id: 'romanian_deadlift',
    name: 'Румынская тяга',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16M6 8l6 4l6 -4"/></svg>`,
    description: 'Проработка задней поверхности бедра.',
    sets: 3,
    levels: { beginner: { weight: 'Гриф (20кг)', reps: '10-12 раз', restTime: 60, advice: 'Ноги чуть согнуты, наклон за счет отведения таза.' } }
  },
  {
    id: 'leg_extension',
    name: 'Разгибания ног',
    muscle: 'legs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"/></svg>`,
    description: 'Изоляция квадрицепса.',
    sets: 3,
    levels: { beginner: { weight: '10-15 кг', reps: '12-15 раз', restTime: 45, advice: 'Движение плавное.' } }
  },
  {
    id: 'lat_pulldown',
    name: 'Тяга блока к груди',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3m0 0l-3-3m3 3l3-3"/></svg>`,
    description: 'Альтернатива подтягиваниям.',
    sets: 3,
    levels: { beginner: { weight: '20-30 кг', reps: '12-15 раз', restTime: 60, advice: 'Тяните локти вниз.' } }
  },
  {
    id: 'triceps_extension',
    name: 'Разгибания на трицепс',
    muscle: 'arms',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/></svg>`,
    description: 'Изоляция трицепса.',
    sets: 3,
    levels: { beginner: { weight: '10-15 кг', reps: '12-15 раз', restTime: 45, advice: 'Локти прижаты к телу.' } }
  },
  {
    id: 'hyperextension',
    name: 'Гиперэкстензия',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16"/></svg>`,
    description: 'Укрепление поясницы.',
    sets: 3,
    levels: { beginner: { weight: 'Вес тела', reps: '12-15 раз', restTime: 60, advice: 'Не прогибайтесь чрезмерно.' } }
  },
  {
    id: 'one_arm_row',
    name: 'Тяга гантели одной рукой',
    muscle: 'back',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`,
    description: 'Толщина спины.',
    sets: 3,
    levels: { beginner: { weight: '8-10 кг', reps: '10 раз', restTime: 60, advice: 'Тяните локоть назад.' } }
  },
  {
    id: 'leg_raises',
    name: 'Подъем ног',
    muscle: 'abs',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v16"/></svg>`,
    description: 'Нижний пресс.',
    sets: 3,
    levels: { beginner: { weight: 'Вес тела', reps: '12-15 раз', restTime: 45, advice: 'Не раскачивайтесь.' } }
  }
];

// ==========================================
// === 2. БАЗА КУРСОВ ===
// ==========================================

let COURSES_DATABASE = [
  {
    id: 'beginner_gym',
    title: 'Программа для начинающих',
    subtitle: 'Тренажерный зал',
    description: 'Полная программа 3 раза в неделю. Идеально для старта.',
    duration: '12 недель',
    goal: 'base',
    level: 'beginner',
    schedule: [
      { name: 'Понедельник', exercises: ['pull_ups', 'deadlift', 'leg_press', 'overhead_press', 'crunches'] },
      { name: 'Среда', exercises: ['bench_press', 'dumbbell_flyes', 'romanian_deadlift', 'leg_extension', 'lat_pulldown', 'triceps_extension'] },
      { name: 'Пятница', exercises: ['hyperextension', 'squats', 'lunges', 'lat_pulldown', 'one_arm_row', 'leg_raises'] }
    ]
  }
];

// ==========================================
// === 3. СОСТОЯНИЕ ТРЕНИРОВКИ ===
// ==========================================

let workoutState = {
  currentSet: 1,
  totalSets: 3,
  restTime: 60,
  timerInterval: null,

  // ✅ для пропуска отдыха
  restButtonRef: null,
  restTimerBlockRef: null,
};

// ==========================================
// === 4. UI HELPERS (states via classes) ===
// ==========================================

function setActionButtonState(btn, state /* 'primary' | 'warning' | 'neutral' */) {
  if (!btn) return;
  btn.classList.remove('btn-state-primary', 'btn-state-warning', 'btn-state-neutral');
  if (state === 'primary') btn.classList.add('btn-state-primary');
  if (state === 'warning') btn.classList.add('btn-state-warning');
  if (state === 'neutral') btn.classList.add('btn-state-neutral');
}

function setTimerCircleState(circle, state /* 'ok' | 'danger' | 'none' */) {
  if (!circle) return;
  circle.classList.remove('is-ok', 'is-danger');
  if (state === 'ok') circle.classList.add('is-ok');
  if (state === 'danger') circle.classList.add('is-danger');
}

/** ✅ Re-render lucide icons if available */
function refreshLucideIcons() {
  try {
    if (window.lucide && typeof lucide.createIcons === 'function') {
      lucide.createIcons();
    }
  } catch (_) {}
}

// ==========================================
// === 5. ФУНКЦИИ ИНТЕРФЕЙСА (ОТРИСОВКА) ===
// ==========================================

// 5.1 Отрисовка списка разовых тренировок (trainings.html)
function renderWorkoutList(containerId, muscleGroup, level = 'beginner', searchTerm = '') {
  const container = document.getElementById(containerId);
  if (!container) return;

  let filtered = EXERCISE_DATABASE;
  if (muscleGroup !== 'all') {
    filtered = EXERCISE_DATABASE.filter(ex => ex.muscle === muscleGroup);
  }

  const q = String(searchTerm || '').trim().toLowerCase();
  if (q) {
    filtered = filtered.filter(ex => String(ex.name || '').toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state loading-state"><p>Тренировок нет.</p></div>`;
    return;
  }

  let html = '';
  filtered.forEach(exercise => {
    const levelData = exercise.levels[level] || exercise.levels['beginner'];

    html += `
      <div class="workout-card" data-exercise-id="${exercise.id}" data-level="${level}">
        <div class="workout-icon">${exercise.icon}</div>
        <div class="workout-details">
          <h3>${exercise.name}</h3>
          <div class="workout-tags">
            <span class="tag weight">${levelData.weight}</span>
            <span class="tag reps">${exercise.sets || 3}x${levelData.reps}</span>
          </div>
          <p class="workout-advice">${levelData.advice}</p>
        </div>
        <div class="workout-action"><span>▶</span></div>
      </div>`;
  });

  container.innerHTML = html;

  // Делегируем клик (чтобы не держать onclick строки)
  if (!container.__clickBound) {
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.workout-card');
      if (!card) return;
      const exId = card.dataset.exerciseId;
      const lvl = card.dataset.level || (localStorage.getItem('userLevel') || 'beginner');
      showExerciseDetail(exId, lvl);
    });
    container.__clickBound = true;
  }
}

// 5.2 Отрисовка списка курсов (courses.html)
function renderCoursesList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let html = '';
  COURSES_DATABASE.forEach(course => {
    html += `
      <div class="course-card card" onclick="window.location.href='course-detail.html?id=${course.id}'">
        <div class="course-header">
          <h2>${course.title}</h2>
          <span class="course-badge">${course.level === 'beginner' ? 'Новичок' : 'Продвинутый'}</span>
        </div>

        <p class="course-desc">${course.description}</p>

        <div class="course-meta">
          <span class="course-meta__item">
            <span class="icon"><i data-lucide="calendar"></i></span>
            ${course.duration}
          </span>
          <span class="course-meta__item">
            <span class="icon"><i data-lucide="dumbbell"></i></span>
            ${course.schedule.length} дня в неделю
          </span>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  refreshLucideIcons(); // ✅ чтобы иконки появились после вставки HTML
}

// 5.3 Отрисовка списка по ID / назначениям (для workout-process.html)
function renderWorkoutListByIds(containerId, exerciseItems, level = 'beginner') {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!exerciseItems || exerciseItems.length === 0) {
    container.innerHTML = `<div class="empty-state loading-state"><p>Список пуст.</p></div>`;
    return;
  }

  let html = '';
  exerciseItems.forEach((it, idx) => {
    const id = (typeof it === 'string') ? it : (it.exercise_id || it.id);
    const override = (typeof it === 'object' && it) ? it : null;
    const exercise = EXERCISE_DATABASE.find(ex => ex.id === id);
    if (!exercise) return;

    const levelData = exercise.levels[level] || exercise.levels['beginner'];

    const sets = override?.sets || exercise.sets || 3;
    const reps = (override && (override.reps_min || override.reps_max))
      ? `${override.reps_min || ''}${override.reps_min && override.reps_max ? '–' : ''}${override.reps_max || ''}`
      : levelData.reps;

    const adviceParts = [
      levelData.advice,
      override?.tempo ? `Темп ${override.tempo}` : '',
      typeof override?.target_rir === 'number' ? `RIR ${override.target_rir}` : '',
      override?.notes_ru || ''
    ].filter(Boolean);

    html += `
      <div class="workout-card" data-exercise-id="${exercise.id}" data-level="${level}" data-override-index="${idx}">
        <div class="workout-icon">${exercise.icon}</div>
        <div class="workout-details">
          <h3>${exercise.name}</h3>
          <div class="workout-tags">
            <span class="tag weight">${levelData.weight}</span>
            <span class="tag reps">${sets}x${reps}</span>
          </div>
          <p class="workout-advice">${adviceParts.join(' • ')}</p>
        </div>
        <div class="workout-action"><span>▶</span></div>
      </div>`;
  });

  container.innerHTML = html;

  // Сохраняем текущие назначения (для детального окна)
  window.__lastRenderedWorkoutItems = Array.isArray(exerciseItems) ? exerciseItems : [];

  // Делегируем клик
  if (!container.__clickBound) {
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.workout-card');
      if (!card) return;
      const exId = card.dataset.exerciseId;
      const lvl = card.dataset.level || (localStorage.getItem('userLevel') || 'beginner');
      const overrideIndex = Number(card.dataset.overrideIndex);
      const override = Array.isArray(window.__lastRenderedWorkoutItems)
        ? window.__lastRenderedWorkoutItems[overrideIndex]
        : null;
      showExerciseDetail(exId, lvl, (typeof override === 'object' ? override : null));
    });
    container.__clickBound = true;
  }
}

// ==========================================
// === 6. ЛОГИКА КУРСОВ ===
// ==========================================

function openCourseDetail(courseId) {
  window.location.href = `course-detail.html?id=${courseId}`;
}

function initCourseDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  let courseId = urlParams.get('id');

  if (!courseId) {
    try { courseId = localStorage.getItem('selectedCourseId'); }
    catch (e) { console.warn("LocalStorage недоступен"); }
  }

  if (!courseId) {
    console.error("ID курса не найден");
    window.location.href = 'courses.html';
    return;
  }

  const course = COURSES_DATABASE.find(c => c.id === courseId);
  if (!course) {
    const cc = document.getElementById('course-content');
    if (cc) cc.innerHTML = '<p>Курс не найден</p>';
    return;
  }

  const container = document.getElementById('course-content');
  if (!container) return;

  let daysHtml = '';
  course.schedule.forEach((day, index) => {
    daysHtml += `
      <div class="day-card" onclick="startCourseDay('${course.id}', ${index})">
        <div class="day-info">
          <h3>День ${index + 1}: ${day.name}</h3>
          <p>${day.exercises.length} упражнений</p>
        </div>
        <span class="day-arrow"><i data-lucide="chevron-right"></i></span>
      </div>`;
  });

  container.innerHTML = `
    <div class="course-detail-header">
      <h1>${course.title}</h1>
      <p>${course.description}</p>

      <div class="course-stats">
        <span><b>Сложность:</b> ${course.level === 'beginner' ? 'Начальный' : 'Продвинутый'}</span>
        <span><b>Длительность:</b> ${course.duration}</span>
      </div>
    </div>

    <div class="course-rules">
      <div class="rule-item">
        <h4><i data-lucide="calendar-check"></i> Как тренироваться</h4>
        <p>Тренируйтесь 3 раза в неделю. Отдых между тренировками — 1-2 дня.</p>
      </div>
    </div>

    <h2 style="margin-top: 30px; margin-bottom: 15px;">Расписание</h2>
    <div class="days-list">
      ${daysHtml}
    </div>
  `;

  refreshLucideIcons(); // ✅ оживляем иконки в сгенерированном HTML
}

function startCourseDay(courseId, dayIndex) {
  try {
    localStorage.setItem('currentWorkoutSource', 'course');
    localStorage.setItem('currentWorkoutDayIndex', dayIndex);
    localStorage.setItem('currentCourseId', courseId);

    // ✅ Сохраняем конкретные назначения (если есть) — это нужно для content pack,
    // чтобы на workout-process.html показать сеты/повторы/отдых/темп из prescriptions.
    const course = COURSES_DATABASE.find(c => c.id === courseId);
    const dayData = course?.schedule?.[dayIndex];
    if (dayData) {
      localStorage.setItem('currentWorkoutTitle', dayData.name || 'Тренировка');
      localStorage.setItem('currentWorkoutItems', JSON.stringify(dayData.exercises || []));
    }
  } catch (e) {
    console.warn("Не удалось сохранить прогресс в память");
  }
  window.location.href = 'workout-process.html';
}

function __escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function __renderList(items, limit = 6) {
  const arr = Array.isArray(items) ? items.slice(0, limit) : [];
  if (!arr.length) return '<p class="muted">—</p>';
  return `<ul class="modal-list">${arr.map(s => `<li>${__escapeHtml(s)}</li>`).join('')}</ul>`;
}

function renderExercisePackDetails(modal, exercise, override) {
  const pack = exercise?.__pack;
  let root = modal.querySelector('.exercise-pack-details');

  if (!pack) {
    if (root) root.remove();
    return;
  }

  if (!root) {
    root = document.createElement('div');
    root.className = 'exercise-pack-details';
    // вставляем после блока "Совет" и до таймера
    const advice = modal.querySelector('.modal-advice-box');
    const timer = modal.querySelector('.timer-container');
    if (timer) {
      (advice ? advice.parentNode : modal).insertBefore(root, timer);
    } else {
      modal.querySelector('.modal-content')?.appendChild(root);
    }
  }

  // Замены: пытаемся показать названия (если у нас есть индекс)
  const subs = Array.isArray(pack.substitutions) ? pack.substitutions : [];
  const subNames = subs
    .map(s => {
      const exId = s?.exercise_id;
      if (!exId) return null;
      const internal = EXERCISE_DATABASE.find(e => e.id === exId);
      return internal?.name || window.__exercisePackIndex?.get(exId)?.name_ru || window.__exercisePackIndex?.get(exId)?.name_en || exId;
    })
    .filter(Boolean);

  const equip = __equipmentToRuShort(pack.equipment);
  const pattern = pack.movement_pattern ? String(pack.movement_pattern) : '';

  const prescriptionHtml = override ? `
    <div class="modal-block">
      <div class="modal-block__title">Назначение</div>
      <div class="modal-block__body">
        <div class="kv"><span class="k">Сеты</span><span class="v">${__escapeHtml(override.sets ?? exercise.sets ?? 3)}</span></div>
        <div class="kv"><span class="k">Повторы</span><span class="v">${__escapeHtml((override.reps_min || override.reps_max) ? `${override.reps_min || ''}${override.reps_min && override.reps_max ? '–' : ''}${override.reps_max || ''}` : '')}</span></div>
        <div class="kv"><span class="k">Отдых</span><span class="v">${__escapeHtml(override.rest_sec ? `${override.rest_sec} сек` : '')}</span></div>
        <div class="kv"><span class="k">Темп</span><span class="v">${__escapeHtml(override.tempo || '')}</span></div>
        <div class="kv"><span class="k">RIR</span><span class="v">${__escapeHtml(typeof override.target_rir === 'number' ? override.target_rir : '')}</span></div>
      </div>
    </div>
  ` : '';

  root.innerHTML = `
    <div class="modal-block">
      <div class="modal-block__title">Параметры</div>
      <div class="modal-block__body">
        <div class="kv"><span class="k">Паттерн</span><span class="v">${__escapeHtml(pattern || '—')}</span></div>
        <div class="kv"><span class="k">Оборудование</span><span class="v">${__escapeHtml(equip)}</span></div>
        <div class="kv"><span class="k">Темп</span><span class="v">${__escapeHtml(pack.tempo_recommendation || '—')}</span></div>
      </div>
    </div>
    ${prescriptionHtml}
    <details class="modal-details" open>
      <summary>Техника</summary>
      ${__renderList(pack.execution_cues, 6)}
    </details>
    <details class="modal-details">
      <summary>Настройка</summary>
      ${__renderList(pack.setup_steps, 5)}
    </details>
    <details class="modal-details">
      <summary>Частые ошибки</summary>
      ${__renderList(pack.common_mistakes, 5)}
    </details>
    <details class="modal-details">
      <summary>Безопасность</summary>
      ${__renderList(pack.safety_notes, 4)}
    </details>
    <details class="modal-details">
      <summary>Замены</summary>
      ${__renderList(subNames, 6)}
    </details>
  `;
}

// ==========================================
// === 7. ЛОГИКА МОДАЛКИ И ТАЙМЕРА ===
// ==========================================

function showExerciseDetail(exerciseId, level, override = null) {
  const exercise = EXERCISE_DATABASE.find(ex => ex.id === exerciseId);
  if (!exercise) return;

  const levelData = exercise.levels[level] || exercise.levels['beginner'];
  const modal = document.getElementById('exercise-modal');
  if (!modal) return;

  if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
  workoutState.timerInterval = null;

  workoutState.currentSet = 1;
  workoutState.totalSets = (override && override.sets) ? override.sets : (exercise.sets || 3);
  workoutState.restTime = (override && (override.rest_sec || override.restTime))
    ? Number(override.rest_sec || override.restTime)
    : (levelData.restTime || 60);

  modal.querySelector('.modal-title').innerText = exercise.name;
  modal.querySelector('.modal-desc').innerText = exercise.description;
  const repsText = (override && (override.reps_min || override.reps_max))
    ? `${override.reps_min || ''}${override.reps_min && override.reps_max ? '–' : ''}${override.reps_max || ''}`
    : levelData.reps;

  const adviceParts = [
    levelData.advice,
    override?.tempo ? `Темп ${override.tempo}` : '',
    typeof override?.target_rir === 'number' ? `RIR ${override.target_rir}` : '',
    override?.notes_ru || ''
  ].filter(Boolean);

  modal.querySelector('.modal-weight').innerText = levelData.weight;
  modal.querySelector('.modal-reps').innerText = repsText;
  modal.querySelector('.modal-advice').innerText = adviceParts.join(' • ');

  // ✅ Доп. контент из content pack (техника/ошибки/безопасность/замены)
  try { renderExercisePackDetails(modal, exercise, override); } catch (_) { /* no-op */ }

  updateSetsCounter();

  const startBtn = document.getElementById('action-btn');
  const timerBlock = document.getElementById('timer-block');
  const timerCircle = document.querySelector('.timer-circle');

  if (startBtn) {
    startBtn.style.display = 'block';
    startBtn.innerText = 'Начать подход 1';
    setActionButtonState(startBtn, 'primary');
    startBtn.onclick = () => handleWorkoutAction(startBtn);
  }

  if (timerBlock) {
    timerBlock.style.display = 'none';
    removeRestSkipButton();
  }

  setTimerCircleState(timerCircle, 'none');

  modal.classList.add('active');
  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
}

function updateSetsCounter() {
  const counter = document.getElementById('sets-counter');
  if (counter) counter.innerText = `Подход ${workoutState.currentSet} / ${workoutState.totalSets}`;
}

function handleWorkoutAction(button) {
  const currentText = button.innerText;

  if (currentText.includes('Начать подход')) {
    button.innerText = `Завершить подход ${workoutState.currentSet}`;
    setActionButtonState(button, 'warning');
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
    return;
  }

  if (currentText.includes('Завершить подход')) {
    startRestTimer(button);
    return;
  }

  if (currentText.includes('Закрыть')) {
    closeExerciseModal();
  }
}

function ensureRestSkipButton() {
  const container = document.querySelector('.timer-container');
  if (!container) return;

  let btn = document.getElementById('rest-skip-btn');
  if (btn) return;

  btn = document.createElement('button');
  btn.id = 'rest-skip-btn';
  btn.className = 'rest-skip-btn';
  btn.type = 'button';
  btn.textContent = 'Пропустить отдых';
  btn.onclick = () => skipRest();

  container.appendChild(btn);
}

function removeRestSkipButton() {
  const btn = document.getElementById('rest-skip-btn');
  if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
}

function startRestTimer(button) {
  button.style.display = 'none';

  const timerBlock = document.getElementById('timer-block');
  const timerText = document.getElementById('timer-text');
  const timerCircle = document.querySelector('.timer-circle');

  if (!timerBlock || !timerText || !timerCircle) {
    console.error('Ошибка: Не найдены элементы таймера!');
    return;
  }

  // ✅ сохраняем ссылки для "пропустить отдых"
  workoutState.restButtonRef = button;
  workoutState.restTimerBlockRef = timerBlock;

  timerBlock.style.display = 'flex';
  ensureRestSkipButton();

  let timeLeft = workoutState.restTime;
  timerText.innerText = timeLeft;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  timerCircle.style.strokeDasharray = String(circumference);
  timerCircle.style.strokeDashoffset = '0';

  setTimerCircleState(timerCircle, 'ok');

  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');

  if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
  workoutState.timerInterval = setInterval(() => {
    timeLeft--;
    timerText.innerText = timeLeft;

    const offset = circumference - (timeLeft / workoutState.restTime) * circumference;
    timerCircle.style.strokeDashoffset = String(offset);

    if (timeLeft <= 3) {
      setTimerCircleState(timerCircle, 'danger');
      if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }

    if (timeLeft <= 0) {
      clearInterval(workoutState.timerInterval);
      workoutState.timerInterval = null;
      removeRestSkipButton();
      nextSet(button, timerBlock);
    }
  }, 1000);
}

// ✅ Новая функция: пропустить отдых
function skipRest() {
  if (workoutState.timerInterval) {
    clearInterval(workoutState.timerInterval);
    workoutState.timerInterval = null;
  }

  const button = workoutState.restButtonRef;
  const timerBlock = workoutState.restTimerBlockRef;

  removeRestSkipButton();

  if (timerBlock) timerBlock.style.display = 'none';

  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.impactOccurred('medium');

  if (button && timerBlock) {
    nextSet(button, timerBlock);
  }
}

function nextSet(button, timerBlock) {
  workoutState.currentSet++;
  updateSetsCounter();

  if (workoutState.currentSet > workoutState.totalSets) {
    finishExercise(button, timerBlock);
  } else {
    timerBlock.style.display = 'none';
    button.style.display = 'block';
    button.innerText = `Начать подход ${workoutState.currentSet}`;
    setActionButtonState(button, 'primary');
    if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
  }
}

function finishExercise(button, timerBlock) {
  const counter = document.getElementById('sets-counter');
  const modal = document.getElementById('exercise-modal');

  if (timerBlock) timerBlock.style.display = 'none';
  removeRestSkipButton();

  button.style.display = 'block';
  button.innerText = 'Закрыть';
  setActionButtonState(button, 'neutral');

  const timerCircle = document.querySelector('.timer-circle');
  setTimerCircleState(timerCircle, 'none');

  if (modal) {
    modal.querySelector('.modal-title').innerText = "Отлично!";
    modal.querySelector('.modal-desc').innerText = "Упражнение выполнено.";
  }
  if (counter) counter.innerText = "Готово 🎉";

  if (window.Telegram?.WebApp) Telegram.WebApp.HapticFeedback.notificationOccurred('success');
}

function closeExerciseModal() {
  const modal = document.getElementById('exercise-modal');
  if (modal) modal.classList.remove('active');

  if (workoutState.timerInterval) clearInterval(workoutState.timerInterval);
  workoutState.timerInterval = null;

  removeRestSkipButton();

  workoutState.restButtonRef = null;
  workoutState.restTimerBlockRef = null;

  const timerCircle = document.querySelector('.timer-circle');
  setTimerCircleState(timerCircle, 'none');
}

// ==========================================
// === 8. ЛОГИКА ВЕСА (совместимость)
// ==========================================

function initWeightModule() {
  if (typeof initWeightSection === 'function') initWeightSection();
}

function addWeight() {
  if (typeof addNewWeight === 'function') {
    addNewWeight();
    return;
  }
  alert('Функция добавления веса недоступна: подключи js/weight.js');
}

function getHistory() {
  const keys = ['trainingHistory', 'workoutHistory', 'workoutSessions', 'trainingSessions', 'history'];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    } catch (_) {}
  }
  return [];
}

function getWeightHistory() {
  // ⚠️ Раньше тут была рекурсия (функция вызывала сама себя через window.getWeightHistory),
  // что приводило к переполнению стека на страницах без js/weight.js.
  try { return JSON.parse(localStorage.getItem('weightHistory') || '[]'); }
  catch (e) { return []; }
}

// ==========================================
// === 9. ЗАПУСК ПРИЛОЖЕНИЯ ===
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Инициализации по страницам пусть делают сами страницы.
});
