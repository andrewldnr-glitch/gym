(function(){
  const hostId = 'toast-host';
  function ensureHost(){
    let host = document.getElementById(hostId);
    if (!host){
      host = document.createElement('div');
      host.id = hostId;
      host.className = 'toast-host';
      document.body.appendChild(host);
    }
    return host;
  }

  function showToast(message, opts={}){
    const host = ensureHost();
    const el = document.createElement('div');
    el.className = 'toast';
    const title = opts.title ? `<div class="toast__title"></div>` : '';
    el.innerHTML = title + `<div class="toast__msg"></div>`;
    if (opts.title){
      el.querySelector('.toast__title').textContent = String(opts.title);
    }
    el.querySelector('.toast__msg').textContent = String(message ?? '');
    host.appendChild(el);

    // animate in
    requestAnimationFrame(()=> el.classList.add('is-show'));

    const ttl = Number.isFinite(opts.ttl) ? opts.ttl : 2200;
    const close = () => {
      el.classList.remove('is-show');
      setTimeout(()=> el.remove(), 220);
    };

    const t = setTimeout(close, ttl);
    el.addEventListener('click', ()=>{
      clearTimeout(t);
      close();
    }, { once: true });

    return close;
  }

  window.uiToast = showToast;
})();