/* ============================================================
   engine.js : コア（状態・入力・セーブ・パーティ・共通描画）
   ============================================================ */
'use strict';
window.GD = window.GD || {};

/* ---------- ユーティリティ ---------- */
const U = {
  rand:(a,b)=>a+Math.random()*(b-a),
  ri:(a,b)=>Math.floor(a+Math.random()*(b-a+1)),
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  pick:arr=>arr[Math.floor(Math.random()*arr.length)]
};
window.U = U;

/* ---------- ゲーム本体状態 ---------- */
const G = {
  ver: 3,
  state: 'boot',      // boot/title/field/story/battle/menu/gameover/ending
  chapter: 0,
  flags: {},          // story flags & opened chests
  party: [],          // char instance ids (join順)
  members: {},        // id -> instance
  gold: 300,
  inv: { potion:3, phoenix:1 },
  bestiary: {},
  battleCount: 0,
  playSec: 0,
  map: null, px: 0, py: 0, dir: 'down',
  steps: 0,
  battleSpeed: 1,
  textSpeed: 2,       // 1:slow 2:normal 3:fast
  bgmVol: 0.55, seVol: 0.8,
  postgame: false,
  clear: false
};
window.G = G;

/* ---------- キャラインスタンス ---------- */
function statOf(inst, key) {
  const def = GD.chars[inst.id];
  let v = def.base[key] + def.grow[key] * (inst.lv - 1);
  ['weapon','armor','acc'].forEach(s => {
    const eqId = inst.eq && inst.eq[s];
    if (eqId && GD.equips[eqId] && GD.equips[eqId][key]) v += GD.equips[eqId][key];
  });
  return Math.floor(v) || 0;
}
function maxHpOf(inst){ return statOf(inst,'hp'); }
function maxMpOf(inst){ return statOf(inst,'mp'); }

function makeChar(id, lv) {
  const inst = { id, lv: 1, exp: 0, hp:0, mp:0, eq:{weapon:null,armor:null,acc:null}, skills:[] };
  if (lv === undefined) lv = 1;
  inst.lv = lv;
  inst.exp = GD.expTable[lv] || 0;
  const def = GD.chars[id];
  def.learn.forEach(l => { if (l.lv <= lv) inst.skills.push(l.id); });
  if (def.eq) { inst.eq.weapon = def.eq.weapon; inst.eq.armor = def.eq.armor; inst.eq.acc = def.eq.acc; }
  inst.hp = maxHpOf(inst); inst.mp = maxMpOf(inst);
  return inst;
}
function learnSkillsUpTo(inst) {
  const def = GD.chars[inst.id];
  def.learn.forEach(l => { if (l.lv <= inst.lv && !inst.skills.includes(l.id)) inst.skills.push(l.id); });
}
function avgPartyLv(){ if (!G.party.length) return 1; return Math.floor(G.party.reduce((a,id)=>a+G.members[id].lv,0)/G.party.length); }
function partyAlive(){ return G.party.filter(id => G.members[id].hp > 0); }
function healPartyAll(){ G.party.forEach(id => { const m=G.members[id]; m.hp=maxHpOf(m); m.mp=maxMpOf(m); }); }

/* ---------- セーブ ---------- */
const SAVE_KEY = 'mina_chronicle_save';
const OPT_KEY = 'mina_chronicle_opt';
function saveGame() {
  const data = {
    ver: G.ver, chapter: G.chapter, flags: G.flags, party: G.party, members: G.members,
    gold: G.gold, inv: G.inv, bestiary: G.bestiary, battleCount: G.battleCount,
    playSec: G.playSec, map: G.map, px: G.px, py: G.py, dir: G.dir,
    postgame: G.postgame, clear: G.clear, savedAt: Date.now()
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch(e){ return false; }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d || d.ver !== G.ver) return false;
    Object.assign(G, {
      chapter: d.chapter, flags: d.flags || {}, party: d.party || [], members: d.members || {},
      gold: d.gold || 0, inv: d.inv || {}, bestiary: d.bestiary || {}, battleCount: d.battleCount || 0,
      playSec: d.playSec || 0, map: d.map, px: d.px, py: d.py, dir: d.dir || 'down',
      postgame: !!d.postgame, clear: !!d.clear
    });
    G.members = d.members || {};
    return G.party.length > 0 && G.map && GD.maps[G.map];
  } catch(e){ return false; }
}
function saveOpts() {
  try { localStorage.setItem(OPT_KEY, JSON.stringify({bgm:G.bgmVol, se:G.seVol, text:G.textSpeed, spd:G.battleSpeed})); } catch(e){}
}
function loadOpts() {
  try {
    const o = JSON.parse(localStorage.getItem(OPT_KEY) || 'null');
    if (o) { G.bgmVol=o.bgm; G.seVol=o.se; G.textSpeed=o.text||2; G.battleSpeed=o.spd||1; }
  } catch(e){}
}

/* ---------- 入力 ---------- */
const Input = (() => {
  const down = {}, pressed = {};
  const KEYMAP = {
    ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
    w:'up', s:'down', a:'left', d:'right', W:'up', S:'down', A:'left', D:'right',
    z:'ok', Z:'ok', Enter:'ok', ' ':'ok',
    x:'cancel', X:'cancel', Escape:'cancel',
    m:'menu', M:'menu', c:'menu', C:'menu'
  };
  function kd(e){
    const k = KEYMAP[e.key];
    if (k) { e.preventDefault();
      if (!down[k]) pressed[k] = true;
      down[k] = true; }
  }
  function ku(e){ const k = KEYMAP[e.key]; if (k) { down[k] = false; } }
  window.addEventListener('keydown', kd, { passive:false });
  window.addEventListener('keyup', ku);
  // 仮想パッド
  const pad = { up:false, down:false, left:false, right:false, ok:false, cancel:false, menu:false };
  function bindPad() {
    document.querySelectorAll('[data-pad]').forEach(el => {
      const key = el.dataset.pad;
      const on = e => { e.preventDefault(); pad[key]=true; if (!down[key]) pressed[key]=true; down[key]=true; el.classList.add('active'); };
      const off = e => { e.preventDefault(); pad[key]=false; down[key]=false; el.classList.remove('active'); };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointerleave', off);
      el.addEventListener('pointercancel', off);
    });
  }
  function isDown(k){ return !!(down[k] || pad[k]); }
  function wasPressed(k){
    if (pressed[k]) { pressed[k]=false; return true; }
    if (pad[k] && !down[k]) { down[k]=true; return true; } // pad press queue
    return false;
  }
  function clearPressed(){ Object.keys(pressed).forEach(k=>pressed[k]=false); }
  function endFrame(){ clearPressed(); }
  return { bindPad, isDown, wasPressed, endFrame, _down:down, _pressed:pressed, clearPressed };
})();
window.Input = Input;

/* ---------- 共通描画 ---------- */
const CV = {
  W: 960, H: 540,
  window(ctx, x, y, w, h, opt={}) {
    const r = 10;
    const grad = ctx.createLinearGradient(0,y,0,y+h);
    grad.addColorStop(0, opt.top || 'rgba(20,30,90,0.94)');
    grad.addColorStop(1, opt.bot || 'rgba(8,12,48,0.94)');
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x+2,y+2,w-4,h-4,r-2); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,160,255,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x+6,y+6,w-12,h-12,r-4); ctx.stroke();
    ctx.restore();
  },
  text(ctx, str, x, y, opt={}) {
    ctx.save();
    ctx.font = `${opt.bold?'bold ':''}${opt.size||16}px ${opt.mono?'"Sarasa Mono SC", monospace':'"Yu Gothic UI","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif'}`;
    ctx.textBaseline = 'top';
    if (opt.shadow !== false) { ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillText(str, x+1.5, y+1.5); }
    ctx.fillStyle = opt.color || '#fff';
    ctx.fillText(str, x, y);
    ctx.restore();
  },
  ctext(ctx, str, cx, y, opt={}) {
    ctx.save();
    ctx.font = `${opt.bold?'bold ':''}${opt.size||16}px ${opt.mono?'monospace':'"Yu Gothic UI","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",sans-serif'}`;
    const w = ctx.measureText(str).width;
    ctx.restore();
    CV.text(ctx, str, cx - w/2, y, opt);
  },
  wrap(ctx, str, maxW, opt={}) {
    ctx.save();
    ctx.font = `${opt.size||16}px "Yu Gothic UI","Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif`;
    const out = [];
    str.split('\n').forEach(line => {
      let cur = '';
      for (const ch of line) {
        if (ctx.measureText(cur + ch).width > maxW) { out.push(cur); cur = ch; }
        else cur += ch;
      }
      out.push(cur);
    });
    ctx.restore();
    return out;
  },
  portrait(ctx, face, x, y, size=52) {
    // シンプル ドット風ポートレイト
    const def = GD.chars[face] || { color:'#9fb8ff', hair:'#c8d8ff', outfit:'#5a7bff', skin:'#ffe0cc' };
    const pal = { echo:{hair:'#7fd8ff',skin:'#b8e8ff',outfit:'#3f6f8f'}, npc:{hair:'#6f6f7f',skin:'#ffe0cc',outfit:'#4f5f9f'},
      npc2:{hair:'#b86f4f',skin:'#ffe0cc',outfit:'#c88f5f'}, enemy:{hair:'#4f6f4f',skin:'#b8c8b8',outfit:'#3f5f3f'},
      tina:{hair:'#b8c8d8',skin:'#d8e0e8',outfit:'#5f6f7f'}, ayaka:{hair:'#8f4f6f',skin:'#ffe0cc',outfit:'#ff9fb8'},
      queen:{hair:'#ffd8f8',skin:'#ffe0cc',outfit:'#ff8fc8'} }[face] || null;
    const p = pal || def;
    ctx.save();
    ctx.translate(x, y);
    const s = size/52;
    ctx.scale(s,s);
    // 背景円
    ctx.fillStyle = 'rgba(10,16,60,0.9)';
    ctx.beginPath(); ctx.arc(26,26,25,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = def.color || '#9fb8ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(26,26,25,0,Math.PI*2); ctx.stroke();
    // 髪
    ctx.fillStyle = p.hair;
    ctx.beginPath(); ctx.ellipse(26,22,16,17,0,0,Math.PI*2); ctx.fill();
    // 顔
    ctx.fillStyle = p.skin;
    ctx.beginPath(); ctx.ellipse(26,28,11.5,12,0,0,Math.PI*2); ctx.fill();
    // 前髪
    ctx.fillStyle = p.hair;
    ctx.beginPath(); ctx.ellipse(26,18,13,8,0,Math.PI,Math.PI*2); ctx.fill();
    ctx.fillRect(15,16,6,10); ctx.fillRect(31,16,6,10);
    // 目
    ctx.fillStyle = '#2a2a3f';
    ctx.fillRect(21,28,3.5,5); ctx.fillRect(28,28,3.5,5);
    // 口
    ctx.strokeStyle = '#c86f7f'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(26,34,3,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
    // 体
    ctx.fillStyle = p.outfit;
    ctx.beginPath(); ctx.roundRect(14,42,24,14,5); ctx.fill();
    ctx.restore();
  }
};

/* ---------- ゲーム全体ステート遷移ヘルパ ---------- */
function newGame() {
  G.chapter = 0; G.flags = {}; G.party = []; G.members = {};
  G.gold = 300; G.inv = { potion:3, phoenix:1 }; G.bestiary = {};
  G.battleCount = 0; G.playSec = 0; G.postgame = false; G.clear = false;
  const mina = makeChar('mina', 5);
  G.members.mina = mina; G.party.push('mina');
}
window.newGame = newGame;

function gainExp(exp) {
  const msgs = [];
  G.party.forEach(id => {
    const m = G.members[id];
    m.exp += exp;
    let leveled = false;
    while (m.lv < 60 && m.exp >= GD.expTable[m.lv+1]) {
      const oldMaxHp = maxHpOf(m), oldMaxMp = maxMpOf(m);
      m.lv++; leveled = true;
      m.hp = Math.min(maxHpOf(m), m.hp + (maxHpOf(m) - oldMaxHp));
      m.mp = Math.min(maxMpOf(m), m.mp + (maxMpOf(m) - oldMaxMp));
    }
    if (leveled) { learnSkillsUpTo(m); msgs.push({id, m}); }
  });
  return msgs;
}
function statAt(id, lv, key){ // lv時点の最大値（レベルアップ差分計算用）
  const def = GD.chars[id];
  return Math.floor(def.base[key] + def.grow[key]*(lv-1));
}
window.gainExp = gainExp;

function addItem(id, n=1){ G.inv[id] = (G.inv[id]||0) + n; }
function removeItem(id, n=1){ G.inv[id] = Math.max(0,(G.inv[id]||0)-n); if (!G.inv[id]) delete G.inv[id]; }
window.addItem = addItem; window.removeItem = removeItem;
