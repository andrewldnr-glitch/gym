// js/gems.js
// ----------------------------------------------------------
// Гемы (локальный кошелёк): баланс + журнал транзакций.
//
// MVP для пункта #2:
// - начисление гемов за достижения
// - отображение баланса и последних транзакций
//
// Важно:
// - хранение в localStorage
// - idempotencyKey (чтобы не начислять дважды)
// ----------------------------------------------------------

(function () {
  'use strict';

  const WALLET_KEY = 'user_gems_wallet';
  const TX_KEY = 'user_gems_transactions';
  const IDEMPOTENCY_KEY = 'user_gems_idempotency';

  const MAX_TX = 200;
  const MAX_IDEMP = 400;

  function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch (_) { return fallback; }
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function makeId(prefix) {
    const p = String(prefix || 'tx');
    const rnd = (typeof crypto !== 'undefined' && crypto.getRandomValues)
      ? Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('')
      : Math.random().toString(16).slice(2);
    return `${p}_${Date.now()}_${rnd}`;
  }

  function readWallet() {
    try {
      const raw = localStorage.getItem(WALLET_KEY);
      const w = raw ? safeJsonParse(raw, null) : null;
      const balance = Number(w?.balance ?? 0);
      return {
        balance: Number.isFinite(balance) ? balance : 0,
        updatedAt: w?.updatedAt ? String(w.updatedAt) : null,
      };
    } catch (_) {
      return { balance: 0, updatedAt: null };
    }
  }

  function writeWallet(wallet) {
    try {
      const w = {
        balance: Number(wallet?.balance ?? 0) || 0,
        updatedAt: String(wallet?.updatedAt || nowIso()),
      };
      localStorage.setItem(WALLET_KEY, JSON.stringify(w));
    } catch (_) {}
  }

  function readTransactions() {
    try {
      const raw = localStorage.getItem(TX_KEY);
      const arr = raw ? safeJsonParse(raw, []) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x) => ({
          id: String(x?.id || ''),
          ts: String(x?.ts || ''),
          type: String(x?.type || ''),
          amount: Number(x?.amount ?? 0),
          reason: String(x?.reason || ''),
          title: String(x?.title || ''),
          meta: x?.meta ?? null,
        }))
        .filter((x) => x.id && x.ts && Number.isFinite(x.amount));
    } catch (_) {
      return [];
    }
  }

  function writeTransactions(list) {
    try {
      const arr = Array.isArray(list) ? list : [];
      // новые сверху
      arr.sort((a, b) => new Date(b.ts) - new Date(a.ts));
      localStorage.setItem(TX_KEY, JSON.stringify(arr.slice(0, MAX_TX)));
    } catch (_) {}
  }

  function readIdempotencyKeys() {
    try {
      const raw = localStorage.getItem(IDEMPOTENCY_KEY);
      const arr = raw ? safeJsonParse(raw, []) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter((x) => typeof x === 'string' && x.trim()).slice(0, MAX_IDEMP);
    } catch (_) {
      return [];
    }
  }

  function writeIdempotencyKeys(list) {
    try {
      const arr = Array.isArray(list) ? list : [];
      localStorage.setItem(IDEMPOTENCY_KEY, JSON.stringify(arr.slice(0, MAX_IDEMP)));
    } catch (_) {}
  }

  function hasIdempotencyKey(key) {
    const k = String(key || '').trim();
    if (!k) return false;
    return readIdempotencyKeys().includes(k);
  }

  function markIdempotencyKey(key) {
    const k = String(key || '').trim();
    if (!k) return;
    const list = readIdempotencyKeys();
    if (list.includes(k)) return;
    list.unshift(k);
    writeIdempotencyKeys(list);
  }

  function pushTransaction(tx) {
    const list = readTransactions();
    list.unshift(tx);
    writeTransactions(list);
  }

  function changeBalance(delta) {
    const w = readWallet();
    const next = clamp((Number(w.balance) || 0) + (Number(delta) || 0), 0, 1_000_000_000);
    w.balance = next;
    w.updatedAt = nowIso();
    writeWallet(w);
    return next;
  }

  function addGems(amount, opts) {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return { ok: false, error: 'amount_invalid', balance: readWallet().balance };
    }

    const idempotencyKey = opts?.idempotencyKey ? String(opts.idempotencyKey) : '';
    if (idempotencyKey && hasIdempotencyKey(idempotencyKey)) {
      return { ok: true, skipped: true, balance: readWallet().balance };
    }

    const tx = {
      id: makeId('earn'),
      ts: nowIso(),
      type: 'earn',
      amount: amt,
      reason: String(opts?.reason || ''),
      title: String(opts?.title || 'Начисление гемов'),
      meta: opts?.meta ?? null,
    };

    const balance = changeBalance(amt);
    pushTransaction(tx);
    if (idempotencyKey) markIdempotencyKey(idempotencyKey);

    // Haptic (если есть)
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch (_) {}

    return { ok: true, balance, tx };
  }

  function spendGems(amount, opts) {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return { ok: false, error: 'amount_invalid', balance: readWallet().balance };
    }

    const w = readWallet();
    if (w.balance < amt) {
      return { ok: false, error: 'insufficient_funds', balance: w.balance };
    }

    const tx = {
      id: makeId('spend'),
      ts: nowIso(),
      type: 'spend',
      amount: amt,
      reason: String(opts?.reason || ''),
      title: String(opts?.title || 'Списание гемов'),
      meta: opts?.meta ?? null,
    };

    const balance = changeBalance(-amt);
    pushTransaction(tx);

    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light'); } catch (_) {}

    return { ok: true, balance, tx };
  }

  function getGemsBalance() {
    return readWallet().balance;
  }

  function getGemsTransactions(opts) {
    const limit = Number(opts?.limit ?? 20);
    const list = readTransactions();
    return list.slice(0, Number.isFinite(limit) ? Math.max(0, limit) : 20);
  }

  function fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
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

  function renderGemsBalance(target) {
    try {
      const el = typeof target === 'string' ? document.getElementById(target) : target;
      if (!el) return;
      el.textContent = String(getGemsBalance());
    } catch (_) {}
  }

  function renderGemsHistory(target, opts) {
    try {
      const el = typeof target === 'string' ? document.getElementById(target) : target;
      if (!el) return;

      const tx = getGemsTransactions({ limit: opts?.limit ?? 6 });
      if (!tx.length) {
        el.innerHTML = '<div class="wallet-empty">Пока нет начислений. Открывайте достижения — и получайте гемы.</div>';
        return;
      }

      el.innerHTML = tx
        .map((t) => {
          const sign = t.type === 'spend' ? '-' : '+';
          const title = t.title || t.reason || 'Транзакция';
          const date = fmtDate(t.ts);
          return `
            <div class="wallet-tx">
              <div class="wallet-tx__left">
                <div class="wallet-tx__title">${escapeHtml(title)}</div>
                <div class="wallet-tx__meta">${escapeHtml(date)}</div>
              </div>
              <div class="wallet-tx__amount">${sign}${Number(t.amount).toFixed(0)}</div>
            </div>
          `;
        })
        .join('');
    } catch (_) {}
  }

  // Экспорт в global
  window.getGemsBalance = getGemsBalance;
  window.getGemsTransactions = getGemsTransactions;
  window.addGems = addGems;
  window.spendGems = spendGems;
  window.renderGemsBalance = renderGemsBalance;
  window.renderGemsHistory = renderGemsHistory;
})();
