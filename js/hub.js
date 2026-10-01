/* GameMina ハブ：localStorageの最高記録をカードに表示 */
(function () {
  'use strict';

  var FORMATTERS = {
    memory:   function (v) { return 'クリア ' + v.toFixed(1) + ' 秒'; },
    snake:    function (v) { return v + ' 点'; },
    breakout: function (v) { return v + ' 点'; },
    reaction: function (v) { return v + ' ms'; },
    fifteen:  function (v) { return v + ' 手'; }
  };

  function load(key) {
    try {
      var raw = localStorage.getItem('gm_best_' + key);
      return raw === null ? null : parseFloat(raw);
    } catch (e) { return null; }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-best]').forEach(function (el) {
      var key = el.getAttribute('data-best');
      var v = load(key);
      if (v !== null && !isNaN(v) && FORMATTERS[key]) {
        el.textContent = '最高記録 ' + FORMATTERS[key](v);
      }
    });
  });
})();
