/**
 * auth-guard.js
 * Robokassa Sales Dept — защита инструментов + Яндекс.Метрика
 *
 * Подключи в каждом инструменте ПЕРВОЙ строкой в <head>:
 *   <script src="auth-guard.js"></script>
 */
(function () {
  var TOKEN_KEY = 'tlm_hub_token';
  var HUB_URL   = 'https://rk-sales-dept.github.io/lk-sales/';

  /* ── Яндекс.Метрика ── */
  (function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
  })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=108288413','ym');
  ym(108288413,'init',{
    webvisor:true,
    clickmap:true,
    accurateTrackBounce:true,
    trackLinks:true,
    referrer:document.referrer,
    url:location.href
  });

  /* ── Проверка токена ── */
  function redirect() {
    try { sessionStorage.setItem('tlm_redirect_after_login', location.href); } catch(e){}
    location.replace(HUB_URL);
  }

  try {
    var raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) { redirect(); return; }

    var token = JSON.parse(raw);
    if (!token || !token.expires || Date.now() > token.expires) {
      localStorage.removeItem(TOKEN_KEY);
      redirect();
      return;
    }
    // Токен валиден — передаём в метрику имя пользователя
    ym(108288413, 'setUserID', token.user);
  } catch(e) {
    redirect();
  }
})();
