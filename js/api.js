// js/api.js (без ES modules)
(function () {
  const BASE = "https://jgjzonrxjiadwilbmkbk.supabase.co/functions/v1";

  function getInitData() {
    return (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) ? window.Telegram.WebApp.initData : "";
  }

  async function postJson(path, body) {
    const res = await fetch(`${BASE}/${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    let data = {};
    try { data = await res.json(); } catch (_) {}

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Request failed: ${res.status}`);
    }
    return data;
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
