// js/playlists.js
// Local, offline-first playlists for workouts (Yandex Music links)
// - Store user playlists in localStorage
// - Allow choosing a default playlist and per-workout playlist (contextKey)
// - Open playlist via Telegram.WebApp.openLink (fallback window.open)

(function () {
  'use strict';

  const STORAGE_PLAYLISTS = 'user_playlists_v1';
  const STORAGE_DEFAULT_ID = 'user_playlist_default_id_v1';
  const STORAGE_CONTEXT_MAP = 'user_playlist_context_map_v1';
  const STORAGE_SEEDED = 'user_playlists_seeded_v1';

  function safeParse(json, fallback) {
    try {
      const v = JSON.parse(json);
      return v == null ? fallback : v;
    } catch (_) {
      return fallback;
    }
  }

  function safeString(v) {
    return (v == null) ? '' : String(v);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function genId() {
    try {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
      }
    } catch (_) {}
    return 'pl_' + Math.random().toString(16).slice(2) + '_' + Date.now();
  }

  function normalizeUrl(url) {
    let u = safeString(url).trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    return u;
  }

  function isProbablyYandexMusic(url) {
    const u = safeString(url).toLowerCase();
    return u.includes('music.yandex.') || u.includes('yandex.ru/music') || u.includes('music.yandex');
  }

  function readPlaylists() {
    const raw = localStorage.getItem(STORAGE_PLAYLISTS);
    const arr = safeParse(raw, []);
    return Array.isArray(arr) ? arr : [];
  }

  function writePlaylists(list) {
    localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(Array.isArray(list) ? list : []));
  }

  function ensureSeeded() {
    try {
      const seeded = localStorage.getItem(STORAGE_SEEDED);
      const list = readPlaylists();
      if (seeded === '1') return;

      // Seed only if empty
      if (!list.length) {
        const home = {
          id: genId(),
          name: 'Яндекс Музыка (открыть)',
          url: 'https://music.yandex.ru/home',
          createdAt: nowIso(),
        };
        writePlaylists([home]);
        localStorage.setItem(STORAGE_DEFAULT_ID, home.id);
      }
      localStorage.setItem(STORAGE_SEEDED, '1');
    } catch (_) {}
  }

  function getPlaylists() {
    ensureSeeded();
    const list = readPlaylists().map(p => ({
      id: safeString(p.id) || genId(),
      name: safeString(p.name) || 'Плейлист',
      url: normalizeUrl(p.url),
      createdAt: safeString(p.createdAt) || nowIso(),
    }));
    writePlaylists(list);
    return list;
  }

  function findPlaylistById(id) {
    const list = getPlaylists();
    return list.find(p => p.id === id) || null;
  }

  function addPlaylist(name, url) {
    const nm = safeString(name).trim();
    const u = normalizeUrl(url);
    if (!nm) throw new Error('Введите название плейлиста');
    if (!u) throw new Error('Введите ссылку');

    const list = getPlaylists();
    const obj = { id: genId(), name: nm, url: u, createdAt: nowIso() };
    list.unshift(obj);
    writePlaylists(list);

    try {
      const defaultId = localStorage.getItem(STORAGE_DEFAULT_ID);
      if (!defaultId) localStorage.setItem(STORAGE_DEFAULT_ID, obj.id);
    } catch (_) {}

    return obj;
  }

  function updatePlaylist(id, patch) {
    const list = getPlaylists();
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const cur = list[idx];
    const next = Object.assign({}, cur, patch || {});
    next.name = safeString(next.name).trim() || cur.name;
    next.url = normalizeUrl(next.url) || cur.url;

    list[idx] = next;
    writePlaylists(list);
    return next;
  }

  function getContextMap() {
    const raw = localStorage.getItem(STORAGE_CONTEXT_MAP);
    const obj = safeParse(raw, {});
    return (obj && typeof obj === 'object') ? obj : {};
  }

  function writeContextMap(map) {
    localStorage.setItem(STORAGE_CONTEXT_MAP, JSON.stringify(map || {}));
  }

  function removePlaylist(id) {
    const list = getPlaylists();
    const next = list.filter(p => p.id !== id);
    writePlaylists(next);

    try {
      const def = localStorage.getItem(STORAGE_DEFAULT_ID);
      if (def === id) {
        localStorage.removeItem(STORAGE_DEFAULT_ID);
        if (next[0]) localStorage.setItem(STORAGE_DEFAULT_ID, next[0].id);
      }
    } catch (_) {}

    try {
      const map = getContextMap();
      let changed = false;
      Object.keys(map).forEach(k => {
        if (map[k] === id) {
          delete map[k];
          changed = true;
        }
      });
      if (changed) writeContextMap(map);
    } catch (_) {}

    return true;
  }

  function getDefaultPlaylistId() {
    ensureSeeded();
    const id = safeString(localStorage.getItem(STORAGE_DEFAULT_ID));
    if (id && findPlaylistById(id)) return id;
    const list = getPlaylists();
    return list[0] ? list[0].id : '';
  }

  function setDefaultPlaylistId(id) {
    if (!id) {
      localStorage.removeItem(STORAGE_DEFAULT_ID);
      return;
    }
    if (!findPlaylistById(id)) return;
    localStorage.setItem(STORAGE_DEFAULT_ID, id);
  }

  function getContextPlaylistId(contextKey) {
    if (!contextKey) return '';
    const map = getContextMap();
    const val = safeString(map[contextKey]);
    if (!val) return '';
    if (val === '__none__') return '__none__';
    if (!findPlaylistById(val)) return '';
    return val;
  }

  function setContextPlaylistId(contextKey, playlistIdOrNone) {
    if (!contextKey) return;
    const map = getContextMap();

    if (!playlistIdOrNone) {
      delete map[contextKey];
      writeContextMap(map);
      return;
    }

    if (playlistIdOrNone === '__none__') {
      map[contextKey] = '__none__';
      writeContextMap(map);
      return;
    }

    if (!findPlaylistById(playlistIdOrNone)) return;
    map[contextKey] = playlistIdOrNone;
    writeContextMap(map);
  }

  function resolvePlaylistIdForContext(contextKey) {
    const ctx = getContextPlaylistId(contextKey);
    if (ctx === '__none__') return '__none__';
    if (ctx) return ctx;
    return getDefaultPlaylistId();
  }

  function openUrl(url) {
    const u = normalizeUrl(url);
    if (!u) return false;

    try {
      if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.openLink === 'function') {
        window.Telegram.WebApp.openLink(u);
      } else {
        window.open(u, '_blank', 'noopener,noreferrer');
      }

      try {
        if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      } catch (_) {}

      return true;
    } catch (e) {
      console.warn('[playlists] openUrl failed:', e);
      return false;
    }
  }

  function openPlaylistById(id) {
    if (!id || id === '__none__') return false;
    const p = findPlaylistById(id);
    if (!p || !p.url) return false;
    return openUrl(p.url);
  }

  function openForContext(contextKey) {
    const pid = resolvePlaylistIdForContext(contextKey);
    if (pid === '__none__') return false;
    return openPlaylistById(pid);
  }

  function createEl(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  function mountWidget(containerOrId, opts) {
    ensureSeeded();

    const options = opts || {};
    const contextKey = safeString(options.contextKey).trim();
    const compact = !!options.compact;

    const container = (typeof containerOrId === 'string')
      ? document.getElementById(containerOrId)
      : containerOrId;

    if (!container) return;

    container.innerHTML = '';

    const card = createEl('div', 'card music-card' + (compact ? ' music-card--compact' : ''));

    const header = createEl('div', 'music-card__header');
    const title = createEl('div', 'music-card__title');
    const icon = createEl('span', 'music-card__icon', '🎵');
    const textWrap = createEl('div', 'music-card__title-text');
    const t1 = createEl('div', 'music-card__title-main', 'Музыка');
    const t2 = createEl('div', 'music-card__title-sub', compact ? 'Плейлист для этой тренировки' : 'Плейлист по умолчанию или для конкретной тренировки');
    textWrap.appendChild(t1);
    textWrap.appendChild(t2);
    title.appendChild(icon);
    title.appendChild(textWrap);

    header.appendChild(title);
    card.appendChild(header);

    const controls = createEl('div', 'music-card__controls');

    const select = createEl('select', 'music-select');
    select.setAttribute('aria-label', 'Выбор плейлиста');

    function rebuildOptions(selectedId) {
      const playlists = getPlaylists();
      select.innerHTML = '';

      const optNone = document.createElement('option');
      optNone.value = '__none__';
      optNone.textContent = 'Без музыки';
      select.appendChild(optNone);

      playlists.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        select.appendChild(opt);
      });

      const optAdd = document.createElement('option');
      optAdd.value = '__add__';
      optAdd.textContent = '➕ Добавить плейлист…';
      select.appendChild(optAdd);

      const desired = selectedId || resolvePlaylistIdForContext(contextKey) || '__none__';
      select.value = desired;
      if (select.value !== desired) select.value = '__none__';
    }

    const openBtn = createEl('button', 'music-open-btn btn-state-primary');
    openBtn.type = 'button';
    openBtn.textContent = compact ? 'Открыть' : 'Открыть в Я.Музыке';

    const addBtn = createEl('button', 'music-add-btn btn-state-neutral');
    addBtn.type = 'button';
    addBtn.textContent = compact ? '＋' : 'Добавить';
    addBtn.title = 'Добавить плейлист';

    function promptAddFlow() {
      const name = window.prompt('Название плейлиста', 'Мой плейлист');
      if (!name) return;
      const url = window.prompt(
        'Вставьте ссылку на плейлист из Яндекс Музыки\n(Поделиться → Скопировать ссылку)',
        'https://music.yandex.ru/'
      );
      if (!url) return;

      try {
        const obj = addPlaylist(name, url);
        if (contextKey) setContextPlaylistId(contextKey, obj.id);
        else setDefaultPlaylistId(obj.id);
        rebuildOptions(obj.id);
      } catch (e) {
        alert(e && e.message ? e.message : 'Не удалось добавить плейлист');
      }
    }

    select.addEventListener('change', () => {
      const v = select.value;
      if (v === '__add__') {
        select.value = resolvePlaylistIdForContext(contextKey) || '__none__';
        promptAddFlow();
        return;
      }

      if (v === '__none__') {
        if (contextKey) setContextPlaylistId(contextKey, '__none__');
        else setDefaultPlaylistId('');
      } else {
        if (contextKey) setContextPlaylistId(contextKey, v);
        else setDefaultPlaylistId(v);
      }

      rebuildOptions(resolvePlaylistIdForContext(contextKey) || '__none__');
    });

    openBtn.addEventListener('click', () => {
      const v = resolvePlaylistIdForContext(contextKey);
      if (v === '__none__') {
        alert('Музыка выключена для этой тренировки');
        return;
      }
      const p = findPlaylistById(v);
      if (!p || !p.url) {
        alert('Выберите плейлист');
        return;
      }

      if (!isProbablyYandexMusic(p.url)) {
        const ok = confirm('Ссылка не похожа на Яндекс Музыку. Всё равно открыть?');
        if (!ok) return;
      }

      openUrl(p.url);
    });

    addBtn.addEventListener('click', promptAddFlow);

    controls.appendChild(select);
    controls.appendChild(openBtn);
    controls.appendChild(addBtn);
    card.appendChild(controls);

    const hint = createEl('div', 'music-card__hint',
      'Скопируйте ссылку на плейлист в Яндекс Музыке: Поделиться → Скопировать ссылку.');
    card.appendChild(hint);

    container.appendChild(card);

    rebuildOptions(resolvePlaylistIdForContext(contextKey) || '__none__');
  }

  function mountManagement(containerOrId) {
    ensureSeeded();

    const container = (typeof containerOrId === 'string')
      ? document.getElementById(containerOrId)
      : containerOrId;
    if (!container) return;

    container.innerHTML = '';

    const topCard = createEl('div', 'card');
    const title = createEl('h2', '', 'Плейлисты');
    const desc = createEl('p', '', 'Добавляйте ссылки на плейлисты Яндекс Музыки и выбирайте плейлист по умолчанию.');
    topCard.appendChild(title);
    topCard.appendChild(desc);

    const form = createEl('div', 'playlist-form');

    const nameInput = createEl('input', 'input-search');
    nameInput.type = 'text';
    nameInput.placeholder = 'Название (например: Кардио)';

    const urlInput = createEl('input', 'input-search');
    urlInput.type = 'url';
    urlInput.placeholder = 'Ссылка на плейлист (music.yandex.ru/...)';

    const addBtn = createEl('button', 'btn-main');
    addBtn.type = 'button';
    addBtn.textContent = 'Добавить плейлист';

    form.appendChild(nameInput);
    form.appendChild(urlInput);
    form.appendChild(addBtn);
    topCard.appendChild(form);

    const listWrap = createEl('div', 'playlist-list');

    function renderList() {
      listWrap.innerHTML = '';

      const list = getPlaylists();
      const defId = getDefaultPlaylistId();

      if (!list.length) {
        listWrap.appendChild(createEl('p', '', 'Плейлистов пока нет.'));
        return;
      }

      list.forEach(p => {
        const row = createEl('div', 'card playlist-item');

        const head = createEl('div', 'playlist-item__head');
        const name = createEl('div', 'playlist-item__name', p.name);
        const badge = createEl('div', 'playlist-item__badge', p.id === defId ? 'По умолчанию' : '');
        if (!badge.textContent) badge.style.display = 'none';
        head.appendChild(name);
        head.appendChild(badge);

        const url = createEl('div', 'playlist-item__url', p.url);

        const actions = createEl('div', 'playlist-item__actions');

        const open = createEl('button', 'start-course-btn btn-state-primary');
        open.type = 'button';
        open.textContent = 'Открыть';

        const makeDefault = createEl('button', 'start-course-btn btn-state-neutral');
        makeDefault.type = 'button';
        makeDefault.textContent = 'Сделать по умолчанию';

        const del = createEl('button', 'start-course-btn btn-state-warning');
        del.type = 'button';
        del.textContent = 'Удалить';

        open.addEventListener('click', () => openUrl(p.url));

        makeDefault.addEventListener('click', () => {
          setDefaultPlaylistId(p.id);
          renderList();
        });

        del.addEventListener('click', () => {
          const ok = confirm(`Удалить плейлист “${p.name}”?`);
          if (!ok) return;
          removePlaylist(p.id);
          renderList();
        });

        actions.appendChild(open);
        actions.appendChild(makeDefault);
        actions.appendChild(del);

        row.appendChild(head);
        row.appendChild(url);
        row.appendChild(actions);

        listWrap.appendChild(row);
      });
    }

    addBtn.addEventListener('click', () => {
      try {
        addPlaylist(nameInput.value, urlInput.value);
        nameInput.value = '';
        urlInput.value = '';
        renderList();

        try {
          if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
        } catch (_) {}
      } catch (e) {
        alert(e && e.message ? e.message : 'Не удалось добавить');
      }
    });

    container.appendChild(topCard);
    container.appendChild(createEl('div', 'playlist-management-spacer'));
    container.appendChild(listWrap);

    renderList();
  }

  window.Playlists = {
    getPlaylists,
    findById: findPlaylistById,
    addPlaylist,
    updatePlaylist,
    removePlaylist,
    getDefaultPlaylistId,
    setDefaultPlaylistId,
    getContextPlaylistId,
    setContextPlaylistId,
    resolvePlaylistIdForContext,
    openUrl,
    openPlaylistById,
    openForContext,
    mountWidget,
    mountManagement,
  };
})();
