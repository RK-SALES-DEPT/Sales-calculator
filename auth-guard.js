/**
 * auth-guard.js
 * Robokassa Sales Dept — защита инструментов
 *
 * Подключи в каждом инструменте ПЕРВОЙ строкой в <head>:
 *   <script src="auth-guard.js"></script>
 *
 * Логика:
 *  - Проверяет токен в localStorage ('tlm_hub_token')
 *  - Если токена нет или он истёк — редирект на личный кабинет
 *  - Срок сессии: 48 часов с момента входа
 */
(function () {
  var TOKEN_KEY = 'tlm_hub_token';
  var HUB_URL   = 'https://rk-sales-dept.github.io/lk-sales/';

  function redirect() {
    // Сохраняем текущий URL чтобы вернуться после логина
    try {
      sessionStorage.setItem('tlm_redirect_after_login', location.href);
    } catch(e) {}
    location.replace(HUB_URL);
  }

  try {
    var raw = localStorage.getItem(TOKEN_KEY);

    // Нет токена — на хаб
    if (!raw) { redirect(); return; }

    var token = JSON.parse(raw);

    // Истёк — на хаб
    if (!token || !token.expires || Date.now() > token.expires) {
      localStorage.removeItem(TOKEN_KEY);
      redirect();
      return;
    }

    // Всё ок — пропускаем
  } catch (e) {
    redirect();
  }
})();
