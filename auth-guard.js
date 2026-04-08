/**
 * auth-guard.js
 * Robokassa Sales Dept
 *
 * Подключи ПЕРВОЙ строкой в <head> каждого инструмента:
 *   <script src="auth-guard.js"></script>
 *
 * Что делает:
 *  1. Проверяет токен сессии (48 часов)
 *  2. Если нет токена — редирект на хаб
 *  3. Если токен есть — логирует открытие инструмента в Firebase
 */
(function () {
  var TOKEN_KEY = 'tlm_hub_token';
  var HUB_URL   = 'https://rk-sales-dept.github.io/lk-sales/';

  /* Определяем название инструмента по URL */
  function getToolName() {
    var path = location.href.toLowerCase();
    if (path.includes('navigator'))   return 'Навигатор ТЛМ';
    if (path.includes('calculator') ||
        path.includes('sales-calc') ||
        path.includes('bnpl'))        return 'Калькулятор продаж';
    if (path.includes('competitor'))  return 'Анализ конкурентов';
    return 'Инструмент';
  }

  /* Редирект на хаб с сохранением текущего URL */
  function redirect() {
    try { sessionStorage.setItem('tlm_redirect_after_login', location.href); } catch(e) {}
    location.replace(HUB_URL);
  }

  /* Логируем открытие в Firebase */
  function logToFirebase(token) {
    try {
      /* Загружаем Firebase SDK динамически */
      function loadScript(src, cb) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = cb;
        document.head.appendChild(s);
      }

      loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', function() {
        loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js', function() {
          try {
            /* Не инициализируем повторно если уже есть */
            var app;
            if (!firebase.apps.length) {
              app = firebase.initializeApp({
                apiKey:            "AIzaSyAzewvuLhDNvFoJeh8VZQAaKpWFjuuVniY",
                authDomain:        "rk-sales-2026.firebaseapp.com",
                projectId:         "rk-sales-2026",
                storageBucket:     "rk-sales-2026.firebasestorage.app",
                messagingSenderId: "247955813209",
                appId:             "1:247955813209:web:71db1b103222091c759248"
              });
            } else {
              app = firebase.app();
            }

            var db       = firebase.firestore();
            var toolName = getToolName();

            /* Запись в activity_logs */
            db.collection('activity_logs').add({
              user:      token.user,
              name:      token.name || token.user,
              action:    'open_tool',
              details:   toolName,
              source:    'direct',   /* прямой переход, не через хаб */
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            /* Обновляем присутствие */
            db.collection('presence').doc(token.user).set({
              name:     token.name || token.user,
              role:     token.role || 'manager',
              lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
              online:   true,
              tool:     toolName   /* какой инструмент сейчас открыт */
            });

          } catch(e) {
            console.warn('auth-guard Firebase error:', e);
          }
        });
      });
    } catch(e) {
      console.warn('auth-guard loadScript error:', e);
    }
  }

  /* ── Проверка токена ── */
  try {
    var raw = localStorage.getItem(TOKEN_KEY);

    if (!raw) { redirect(); return; }

    var token = JSON.parse(raw);

    if (!token || !token.expires || Date.now() > token.expires) {
      localStorage.removeItem(TOKEN_KEY);
      redirect();
      return;
    }

    /* Токен валиден — логируем открытие */
    logToFirebase(token);

    /* Передаём UserID в Яндекс.Метрику если она есть */
    if (typeof ym !== 'undefined') {
      try {
        ym(108288413, 'setUserID', token.user);
        ym(108288413, 'userParams', { login: token.user, name: token.name });
      } catch(e) {}
    }

  } catch(e) {
    redirect();
  }

})();
