/* ============================================================
   main.js : ブート / ゲームループ / シーンルータ / PWA
   ============================================================ */
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------- リサイズ（レターボックス） ---------- */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  const scale = Math.min(w / CV.W, h / CV.H);
  const vw = Math.floor(CV.W * scale), vh = Math.floor(CV.H * scale);
  const wrap = document.getElementById('wrap');
  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  wrap.style.width = vw + 'px';
  wrap.style.height = vh + 'px';
}
window.addEventListener('resize', resize);
resize();

/* ---------- PWA インストールプロンプト ---------- */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  if (btn) btn.style.display = 'inline-block';
});
function doInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => { deferredPrompt = null; const b=document.getElementById('installBtn'); if (b) b.style.display='none'; });
}
window.doInstall = doInstall;

/* ---------- Service Worker 登録 ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}

/* ---------- オーディオ解錠（初回操作） ---------- */
function unlockAudio() {
  AudioSys.resume();
  if (G.state === 'title' && !Title._bgm) { Title._bgm = true; AudioSys.bgmPlay('title'); }
}
window.addEventListener('keydown', unlockAudio, { once:false });
window.addEventListener('pointerdown', unlockAudio, { once:false });
window.addEventListener('touchstart', unlockAudio, { once:false });

/* ---------- メインループ ---------- */
let lastTs = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
  lastTs = ts;

  update(dt);
  render();

  Input.endFrame();
  requestAnimationFrame(frame);
}

function update(dt) {
  if (['field','story','battle'].includes(G.state)) G.playSec += dt;
  switch (G.state) {
    case 'title': Title.update(dt); break;
    case 'field': Field.update(dt); break;
    case 'story': Story.update(dt); break;
    case 'battle': Battle.update(dt); break;
    case 'menu': Menu.update(dt); break;
    case 'gameover': GameOver.update(dt); break;
  }
}

function render() {
  ctx.clearRect(0,0,CV.W,CV.H);
  switch (G.state) {
    case 'boot': {
      ctx.fillStyle = '#06081f'; ctx.fillRect(0,0,CV.W,CV.H);
      CV.ctext(ctx, 'LOADING...', CV.W/2, CV.H/2-10, {size:18, color:'#8fa8ff'});
      G.state = 'title';
      break;
    }
    case 'title': Title.render(ctx); break;
    case 'field':
      Field.render(ctx);
      drawObjective(ctx);
      break;
    case 'story':
      Field.render(ctx);
      Story.render(ctx);
      break;
    case 'battle':
      Battle.render(ctx);
      break;
    case 'menu':
      Field.render(ctx);
      ctx.fillStyle = 'rgba(0,0,20,0.55)'; ctx.fillRect(0,0,CV.W,CV.H);
      Menu.render(ctx);
      break;
    case 'gameover': GameOver.render(ctx); break;
  }
}

/* ---------- 目標表示 ---------- */
function drawObjective(ctx) {
  let task = null;
  for (let i = G.chapter; i >= 0; i--) {
    if (G.flags['ch'+i+'_task']) { task = G.flags['ch'+i+'_task']; break; }
    if (G.flags['ch2_task'] && i===2) break;
  }
  if (!task && G.flags.ch1_task) task = G.flags.ch1_task;
  if (!task && G.flags.ch2_task) task = G.flags.ch2_task;
  if (!task && G.flags.ch3_task) task = G.flags.ch3_task;
  if (!task && G.flags.ch4_task) task = G.flags.ch4_task;
  if (!task && G.flags.ch5_task) task = G.flags.ch5_task;
  if (!task && G.flags.fin_task) task = G.flags.fin_task;
  if (!task) return;
  const label = '目標：' + task;
  ctx.font = '13px "Yu Gothic UI","Noto Sans JP",sans-serif';
  const w = ctx.measureText(label).width + 28;
  ctx.globalAlpha = 0.85;
  CV.window(ctx, CV.W/2 - w/2, 10, w, 32);
  CV.ctext(ctx, label, CV.W/2, 18, {size:13, color:'#cfe0ff'});
  ctx.globalAlpha = 1;
}

/* ---------- 開始 ---------- */
loadOpts();
AudioSys.setBgmVol(G.bgmVol); AudioSys.setSeVol(G.seVol);
Input.bindPad();
G.state = 'boot';

/* PWAショートカット (?new=1 / ?continue=1) */
setTimeout(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('new') === '1') {
    newGame(); Story.startSegment('pro_intro'); Title._bgm = true;
  } else if (q.get('continue') === '1' && loadGame()) {
    G.state = 'field'; Field.enter(G.map, G.px, G.py, G.dir); Title._bgm = true;
  }
}, 300);

requestAnimationFrame(frame);
