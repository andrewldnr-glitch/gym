// js/api.js (без ES modules)
(function () {
  const BASE = "https://jgjzonrxjiadwilbmkbk.supabase.co/functions/v1";
  const DEFAULT_TIMEOUT_MS = 15000;

  function getInitData() {
    // В Telegram WebView объект часто есть, но лучше всегда через window.Telegram
    return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData)
      ? window.Telegram.WebApp.initData
      : "";
  }

  async function postJson(path, body, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${BASE}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok || data.ok === false) {
        const errText = data.error || `Request failed: ${res.status}`;
        console.warn(`[api] ${path} error:`, errText, { status: res.status, data });
        throw new Error(errText);
      }

      return data;
    } catch (e) {
      // При CORS/сетевых проблемах часто будет TypeError: Failed to fetch
      console.warn(`[api] ${path} fetch failed:`, e);
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  window.apiBootstrap = async function () {
    const initData = getInitData();
    if (!initData) throw new Error("Telegram initData пустой (страница открыта не внутри Telegram?)");
    return postJson("bootstrap", { initData });
  };

  window.apiSyncWorkout = async function (payload) {
    const initData = getInitData();
    if (!initData) throw new Error("Telegram initData пустой");
    return postJson("sync", { initData, event: Object.assign({ type: "workout_finished" }, payload || {}) });
  };

  window.apiSyncWeight = async function (measured_at, weight) {
    const initData = getInitData();
    if (!initData) throw new Error("Telegram initData пустой");
    return postJson("sync", { initData, event: { type: "weight_upsert", measured_at, weight } });
  };
})();
