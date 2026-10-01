/* GameMina - WebAudio 効果音エンジン（外部ファイル不要） */
(function () {
  'use strict';
  var ctx = null;
  var muted = false;
  try { muted = localStorage.getItem('gm_muted') === '1'; } catch (e) {}

  function ac() {
    if (typeof window === 'undefined') return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, delay) {
    if (muted) return;
    var c = ac();
    if (!c) return;
    var t = c.currentTime + (delay || 0);
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol || 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  window.SFX = {
    isMuted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      try { localStorage.setItem('gm_muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    click:  function () { tone(660, 0.06, 'square', 0.07); },
    flip:   function () { tone(520, 0.07, 'square', 0.08); },
    match:  function () { tone(660, 0.09, 'square', 0.09); tone(880, 0.12, 'square', 0.09, 0.08); },
    miss:   function () { tone(170, 0.15, 'sawtooth', 0.09); },
    eat:    function () { tone(880, 0.07, 'square', 0.1); },
    bounce: function () { tone(440, 0.04, 'square', 0.06); },
    brick:  function () { tone(720, 0.05, 'square', 0.08); },
    die:    function () { tone(300, 0.2, 'sawtooth', 0.1); tone(150, 0.35, 'sawtooth', 0.1, 0.18); },
    over:   function () { tone(300, 0.2, 'sawtooth', 0.1); tone(220, 0.2, 'sawtooth', 0.1, 0.16); tone(140, 0.4, 'sawtooth', 0.1, 0.32); },
    clear:  function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.14, 'square', 0.1, i * 0.11); }); },
    move:   function () { tone(340, 0.04, 'square', 0.05); },
    go:     function () { tone(980, 0.18, 'square', 0.1); }
  };

  /* ミュートボタンがあれば自動バインド */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('muteBtn');
    if (!btn) return;
    var label = function () { btn.textContent = SFX.isMuted() ? 'SOUND OFF' : 'SOUND ON'; };
    label();
    btn.addEventListener('click', function () { SFX.toggle(); label(); });
  });
})();
