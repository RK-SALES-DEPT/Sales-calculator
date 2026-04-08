/**
 * auth-guard.js — Robokassa Sales Dept
 * Подключи ПЕРВОЙ строкой в <head> каждого инструмента
 *
 * Что отслеживает:
 *  - Каждое открытие инструмента (кто, когда, откуда)
 *  - Время проведённое на странице
 */
(function () {
  var TOKEN_KEY = 'tlm_hub_token';
  var HUB_URL   = 'https://rk-sales-dept.github.io/lk-sales/';

  /* Название инструмента по URL */
  function getToolName() {
    var path = location.href.toLowerCase();
    if (path.includes('navigator'))                       return 'Навигатор ТЛМ';
    if (path.includes('calculator') || path.includes('bnpl') || path.includes('conv')) return 'Калькулятор продаж';
    if (path.includes('competitor'))                      return 'Анализ конкурентов';
    return 'Инструмент';
  }

  /* Редирект на хаб */
  function redirect() {
    try { sessionStorage.setItem('tlm_redirect_after_login', location.href); } catch(e) {}
    location.replace(HUB_URL);
  }

  /* Загрузить скрипт динамически */
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function() { console.warn('auth-guard: не удалось загрузить', src); };
    document.head.appendChild(s);
  }

  /* Инициализация Firebase и логирование */
  function initFirebaseAndLog(token) {
    function doLog() {
      try {
        if (!firebase.apps.length) {
          firebase.initializeApp({
            apiKey:            "AIzaSyAzewvuLhDNvFoJeh8VZQAaKpWFjuuVniY",
            authDomain:        "rk-sales-2026.firebaseapp.com",
            projectId:         "rk-sales-2026",
            storageBucket:     "rk-sales-2026.firebasestorage.app",
            messagingSenderId: "247955813209",
            appId:             "1:247955813209:web:71db1b103222091c759248"
          });
        }

        var db       = firebase.firestore();
        var toolName = getToolName();
        var pageOpenTs = Date.now();

        /* 1. Логируем открытие */
        db.collection('activity_logs').add({
          user:      token.user,
          name:      token.name || token.user,
          action:    'open_tool',
          details:   toolName,
          source:    document.referrer.includes('lk-sales') ? 'hub' : 'direct',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        /* 2. Обновляем присутствие */
        db.collection('presence').doc(token.user).set({
          name:     token.name || token.user,
          role:     token.role || 'manager',
          lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
          online:   true,
          tool:     toolName
        });

        /* 3. Логируем время на странице при уходе */
        window.addEventListener('beforeunload', function() {
          var spent = Math.round((Date.now() - pageOpenTs) / 1000);
          if (spent < 5) return; /* меньше 5 сек — не считаем */
          db.collection('activity_logs').add({
            user:      token.user,
            name:      token.name || token.user,
            action:    'time_spent',
            details:   toolName + ' — ' + spent + ' сек',
            seconds:   spent,
            tool:      toolName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          /* Отмечаем офлайн */
          db.collection('presence').doc(token.user).set({
            name:     token.name || token.user,
            role:     token.role || 'manager',
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            online:   false,
            tool:     ''
          });
        });

      } catch(e) {
        console.warn('auth-guard Firebase error:', e);
      }
    }

    /* Загружаем Firebase SDK если ещё не загружен */
    if (typeof firebase !== 'undefined') {
      doLog();
    } else {
      loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', function() {
        loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js', doLog);
      });
    }
  }

  /* ══ ОСНОВНАЯ ЛОГИКА ══ */
  try {
    var raw = localStorage.getItem(TOKEN_KEY);

    if (!raw) { redirect(); return; }

    var token = JSON.parse(raw);

    if (!token || !token.expires || Date.now() > token.expires) {
      localStorage.removeItem(TOKEN_KEY);
      redirect();
      return;
    }

    /* Токен валиден — логируем */
    initFirebaseAndLog(token);

    /* Яндекс.Метрика */
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
