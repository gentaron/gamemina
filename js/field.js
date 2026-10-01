/* ============================================================
   field.js : フィールド描画 / 移動 / イベント / メニュー
   ============================================================ */
'use strict';
window.GD = window.GD || {};

const TILE = 32;

/* ---------- タイルアトラス（プロシージャル生成） ---------- */
const Tiles = (() => {
  const cache = {};
  function make(key, painter) {
    const c = document.createElement('canvas'); c.width = TILE; c.height = TILE;
    const x = c.getContext('2d'); painter(x);
    cache[key] = c; return c;
  }
  function noiseRect(x, base, dots, n=18) {
    x.fillStyle = base; x.fillRect(0,0,TILE,TILE);
    x.fillStyle = dots;
    for (let i=0;i<n;i++) x.fillRect(Math.random()*TILE|0, Math.random()*TILE|0, 2, 2);
  }
  const defs = {
    '.': x=>noiseRect(x,'#3f7f4f','#4f9f5f',10),
    ',': x=>{ noiseRect(x,'#2f6f3f','#3f8f4f',12); x.fillStyle='#5fcf6f';
         for(let i=0;i<5;i++){const px=4+(Math.random()*24|0),py=4+(Math.random()*24|0);x.fillRect(px,py,2,6);x.fillRect(px-2,py+2,2,4);x.fillRect(px+2,py+2,2,4);} },
    r:  x=>noiseRect(x,'#8f8f88','#a0a098',14),
    t:  x=>{ noiseRect(x,'#3f7f4f','#356f45',6); x.fillStyle='#6f4f2f'; x.fillRect(12,18,8,12);
         x.fillStyle='#2f6f3f'; x.beginPath(); x.arc(16,12,11,0,Math.PI*2); x.fill();
         x.fillStyle='#3f8f4f'; x.beginPath(); x.arc(12,10,6,0,Math.PI*2); x.fill(); },
    w:  x=>{ x.fillStyle='#2f5f9f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='rgba(255,255,255,0.25)';
         x.fillRect(4,8,10,2); x.fillRect(18,20,10,2); x.fillRect(8,28,8,2); },
    m:  x=>{ noiseRect(x,'#6f6f6f','#7f7f7f',8); x.fillStyle='#9f9f9f';
         x.beginPath(); x.moveTo(2,30); x.lineTo(14,8); x.lineTo(26,30); x.closePath(); x.fill();
         x.fillStyle='#c8c8c8'; x.beginPath(); x.moveTo(14,8); x.lineTo(20,18); x.lineTo(8,18); x.closePath(); x.fill(); },
    '~': x=>noiseRect(x,'#d8c088','#c8b078',12),
    o:  x=>{ noiseRect(x,'#3f7f4f','#356f45',6); x.fillStyle='#7f7f7f'; x.fillRect(6,16,20,10);
         x.fillStyle='#9f9f9f'; x.fillRect(10,12,12,6); x.fillStyle='#5f5f5f'; x.fillRect(14,20,4,4); },
    '#': x=>{ x.fillStyle='#4f5f7f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#3f4f6f';
         for(let yy=0;yy<TILE;yy+=8){x.fillRect(0,yy,TILE,1);} x.fillStyle='#5f6f8f'; x.fillRect(0,0,TILE,3); },
    f:  x=>{ x.fillStyle='#5f6f8f'; x.fillRect(0,0,TILE,TILE); x.strokeStyle='rgba(0,0,0,0.15)';
         x.strokeRect(0.5,0.5,TILE,TILE); x.fillStyle='rgba(255,255,255,0.04)'; x.fillRect(2,2,10,10); },
    W:  x=>{ x.fillStyle='#3f4f6f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#4f5f7f'; x.fillRect(2,2,28,28); x.fillStyle='#5f6f8f'; x.fillRect(2,2,28,4); },
    g:  x=>{ x.fillStyle='rgba(140,200,255,0.35)'; x.fillRect(0,0,TILE,TILE); x.strokeStyle='rgba(255,255,255,0.4)'; x.strokeRect(0.5,0.5,TILE,TILE); },
    n:  x=>{ noiseRect(x,'#3f2f5f','#5f3f8f',12); x.fillStyle='rgba(255,100,220,0.35)';
         x.fillRect(2,2,12,3); x.fillRect(18,26,12,3); x.fillStyle='rgba(100,220,255,0.3)'; x.fillRect(18,2,12,3); },
    k:  x=>{ noiseRect(x,'#242432','#2e2e42',10); },
    p:  x=>{ x.fillStyle='#4f5f7f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#2f3f5f'; x.fillRect(6,6,20,20);
         x.fillStyle='#6fff9f'; x.fillRect(9,10,14,3); x.fillStyle='#ffd166'; x.fillRect(9,16,10,3); },
    b:  x=>{ x.fillStyle='#8f6f4f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#7f5f3f'; for(let yy=0;yy<TILE;yy+=8) x.fillRect(0,yy,TILE,2); },
    L:  x=>{ x.fillStyle='#1f1030'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#8f5fff';
         x.beginPath(); x.moveTo(0,32); x.lineTo(16,6); x.lineTo(32,32); x.closePath(); x.fill();
         x.fillStyle='#d8b8ff'; x.fillRect(14,10,4,18); },
    D:  x=>{ x.fillStyle='#4f5f7f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#8f6f3f'; x.fillRect(4,2,24,30);
         x.fillStyle='#ffd166'; x.beginPath(); x.arc(23,18,3,0,Math.PI*2); x.fill(); },
    s:  x=>{ x.fillStyle='#2f3f5f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#5fd8ff';
         x.fillRect(8,6,16,12); x.fillStyle='#b8f4ff'; x.fillRect(11,9,10,6); x.fillStyle='#8fa8b8'; x.fillRect(6,22,20,6); },
    C:  x=>{ x.fillStyle='#3f7f4f'; x.fillRect(0,0,TILE,TILE); x.fillStyle='#c88f3f'; x.fillRect(6,10,20,14);
         x.fillStyle='#ffd166'; x.fillRect(6,10,20,4); x.fillRect(14,14,4,6); }
  };
  return { get(ch){ if (!cache[ch]) { const d = defs[ch]; if (d) make(ch,d); else return null; } return cache[ch]; } };
})();

/* ---------- キャラスプライト描画 ---------- */
function drawCharSprite(ctx, id, px, py, dir, frame, scale=1) {
  const def = GD.chars[id] || { color:'#9fb8ff', hair:'#c8d8ff', outfit:'#5a7bff', skin:'#ffe0cc' };
  const pal = { echo:{hair:'#7fd8ff',skin:'#b8e8ff',outfit:'#3f6f8f'}, npc:{hair:'#6f6f7f',skin:'#ffe0cc',outfit:'#4f5f9f'},
    npc2:{hair:'#b86f4f',skin:'#ffe0cc',outfit:'#c88f5f'}, enemy:{hair:'#4f6f4f',skin:'#b8c8b8',outfit:'#3f5f3f'},
    tina:{hair:'#b8c8d8',skin:'#d8e0e8',outfit:'#5f6f7f'}, ayaka:{hair:'#8f4f6f',skin:'#ffe0cc',outfit:'#ff9fb8'},
    queen:{hair:'#ffd8f8',skin:'#ffe0cc',outfit:'#ff8fc8'} }[id] || null;
  const p = pal || def;
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(scale, scale);
  const bob = frame === 1 ? 1 : 0;
  // 影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(8, 25, 7, 3, 0, 0, Math.PI*2); ctx.fill();
  // 脚
  ctx.fillStyle = '#3f4f6f';
  ctx.fillRect(4, 18 + (frame===1?1:0), 3, 7 - (frame===1?1:0));
  ctx.fillRect(9, 18 - (frame===1?1:0), 3, 7 + (frame===1?1:0));
  // 体
  ctx.fillStyle = p.outfit;
  ctx.beginPath(); ctx.roundRect(2, 9+bob, 12, 10, 3); ctx.fill();
  // 腕
  ctx.fillStyle = p.skin;
  ctx.fillRect(0, 10+bob, 2, 6); ctx.fillRect(14, 10+bob, 2, 6);
  // 頭
  ctx.fillStyle = p.skin;
  ctx.beginPath(); ctx.arc(8, 5+bob, 5.5, 0, Math.PI*2); ctx.fill();
  // 髪
  ctx.fillStyle = p.hair;
  ctx.beginPath(); ctx.arc(8, 3.5+bob, 5.5, Math.PI*0.95, Math.PI*2.05); ctx.fill();
  if (dir === 'down') { ctx.fillRect(2.5, 3+bob, 11, 3); }
  else if (dir === 'up') { ctx.fillRect(2.5, 1+bob, 11, 7); }
  else { ctx.fillRect(2.5, 1+bob, 11, 4); if (dir==='left') ctx.fillRect(2.5,1+bob,4,8); else ctx.fillRect(9.5,1+bob,4,8); }
  // 目
  ctx.fillStyle = '#2a2a3f';
  if (dir === 'down') { ctx.fillRect(5.5, 5+bob, 1.6, 2.2); ctx.fillRect(9, 5+bob, 1.6, 2.2); }
  else if (dir === 'left') ctx.fillRect(3.5, 5+bob, 1.8, 2.2);
  else if (dir === 'right') ctx.fillRect(10.5, 5+bob, 1.8, 2.2);
  ctx.restore();
}

/* ---------- マップ判定ヘルパ ---------- */
function tileAt(mapDef, x, y) {
  const row = mapDef.tiles[y];
  if (!row) return 'x';
  if (x < 0 || x >= row.length) return 'x';
  return row[x];
}
const WALKABLE = new Set(['.',',','r','~','o','f','g','n','k','b','w'.length?'':'']);
const BLOCK = new Set(['t','w','m','#','W','p','L','x']);
function isWalkable(ch) { return !BLOCK.has(ch); }
const ENC_TILE = new Set([',','~','n','k']);

/* ---------- フィールド ---------- */
const Field = {
  mapDef: null, mapId: null,
  camX: 0, camY: 0,
  moving: false, mvFrom: null, mvTo: null, mvT: 0,
  walkFrame: 0, walkT: 0,
  encCd: 0,
  fade: 0, fadeIn: true,
  eventBusy: false,

  enter(mapId, x, y, dir='down') {
    this.mapId = mapId; this.mapDef = GD.maps[mapId];
    if (!this.mapDef) { console.error('no map', mapId); return; }
    G.map = mapId; G.px = x; G.py = y; G.dir = dir;
    this.moving = false; this.mvT = 0; this.encCd = 60;
    // タイル幅の正規化
    const w = Math.max(...this.mapDef.tiles.map(r=>r.length));
    this.mapDef.tiles = this.mapDef.tiles.map(r => r.padEnd(w, '#'));
    // クリア後：裏ボスイベント注入
    if (mapId === 'under' && G.postgame && !G.flags.jen_won) {
      if (!this.mapDef.events.some(e => e.ev === 'post_jen')) {
        this.mapDef.events.push({x:11, y:1, type:'story', ev:'post_jen', mark:'throne'});
      }
    }
    AudioSys.bgmPlay(this.mapDef.bgm || 'field');
    this.fade = 1; this.fadeIn = true;
    saveGame(); // マップ遷移時にオートセーブ
  },

  update(dt) {
    if (this.fade > 0 && this.fadeIn) { this.fade = Math.max(0, this.fade - dt/0.4); return; }
    if (Story.active || this.eventBusy) return;
    this.encCd = Math.max(0, this.encCd - 1);

    // 移動補間
    if (this.moving) {
      this.mvT += dt / 0.14;
      this.walkT += dt;
      if (this.walkT > 0.12) { this.walkT = 0; this.walkFrame = (this.walkFrame+1)%2; }
      if (this.mvT >= 1) {
        G.px = this.mvTo.x; G.py = this.mvTo.y;
        this.moving = false; this.mvT = 0;
        // 到着タイルでイベントチェック（story等）
        const ev = this.eventAt(G.px, G.py);
        if (ev && ev.type === 'story') { Story.trigger(ev); return; }
        // エンカウント
        if (ENC_TILE.has(tileAt(this.mapDef, G.px, G.py)) && this.mapDef.enc && this.encCd <= 0) {
          if (Math.random() < this.mapDef.enc.rate) { this.startEncounter(); return; }
        }
      }
      return;
    }

    // 方向入力
    let dx = 0, dy = 0;
    if (Input.isDown('up')) { dy = -1; G.dir='up'; }
    else if (Input.isDown('down')) { dy = 1; G.dir='down'; }
    else if (Input.isDown('left')) { dx = -1; G.dir='left'; }
    else if (Input.isDown('right')) { dx = 1; G.dir='right'; }

    if (dx || dy) {
      const nx = G.px + dx, ny = G.py + dy;
      const ch = tileAt(this.mapDef, nx, ny);
      const blocked = !isWalkable(ch) || this.eventAt(nx, ny, true);
      if (!blocked) {
        this.moving = true; this.mvT = 0;
        this.mvFrom = {x:G.px, y:G.py}; this.mvTo = {x:nx, y:ny};
      } else if (Input.isDown('up')||Input.isDown('down')||Input.isDown('left')||Input.isDown('right')) {
        // 向きだけ変更（タップの場合は1回で）
        this.walkT += dt; if (this.walkT > 0.18) { this.walkT = 0; this.walkFrame = (this.walkFrame+1)%2; }
      }
    } else { this.walkFrame = 0; }

    // 調べる
    if (Input.wasPressed('ok')) {
      const fx = G.px + (G.dir==='left'?-1:G.dir==='right'?1:0);
      const fy = G.py + (G.dir==='up'?-1:G.dir==='down'?1:0);
      let ev = this.eventAt(fx, fy);
      if (!ev) ev = this.eventAt(G.px, G.py);
      if (ev) this.doEvent(ev);
    }
    // メニュー
    if (Input.wasPressed('menu')) { Menu.open(); }
  },

  eventAt(x, y, solidOnly=false) {
    if (!this.mapDef || !this.mapDef.events) return null;
    for (const ev of this.mapDef.events) {
      if (ev.x !== x || ev.y !== y) continue;
      if (ev.type === 'story') {
        if (this.storyDone(ev)) continue; // 消化済みは無視
        return ev;
      }
      if (solidOnly) {
        if (['chest','save','sign','npc','door'].includes(ev.type)) return ev;
        continue;
      }
      return ev;
    }
    return null;
  },
  storyDone(ev) {
    if (ev.ev === 'ch1_prof') return !!G.flags.ch1_boss_done; // 二段階イベント
    return !!G.flags['ev_done_' + ev.ev];
  },

  startEncounter() {
    this.encCd = 120;
    const group = U.pick(GD.encounters[this.mapDef.enc.table]);
    AudioSys.se('encounter');
    Battle.start({ group, onWin:null, onLose:null });
  },

  doEvent(ev) {
    switch (ev.type) {
      case 'npc': {
        Story.startDialogue(ev.name, U.pick(ev.lines));
        break;
      }
      case 'sign': Story.startDialogue('看板', ev.lines.join('\n')); break;
      case 'chest': {
        const key = 'chest_' + this.mapId + '_' + ev.id;
        if (G.flags[key]) { Story.startDialogue('', 'からっぽの宝箱だ。'); break; }
        G.flags[key] = true;
        addItem(ev.item, ev.n || 1);
        AudioSys.se('open');
        const nm = ev.kind === 'equips' ? (GD.equips[ev.item]||{}).name : (GD.items[ev.item]||{}).name;
        Story.startDialogue('', (nm || ev.item) + (ev.n>1 ? ` ×${ev.n}` : '') + ' を手に入れた！');
        break;
      }
      case 'save': Menu.openSave(); break;
      case 'inn': Menu.openInn(ev.price); break;
      case 'shop': Menu.openShop(ev.id); break;
      case 'heal': healPartyAll(); AudioSys.se('heal'); Story.startDialogue('', '治療ポッドで全回復した！'); break;
      case 'door': {
        if (ev.flag && !G.flags[ev.flag]) { Story.startDialogue('', 'まだ入れない…鍵がかかっている。'); break; }
        AudioSys.se('ok');
        this.enter(ev.to.map, ev.to.x, ev.to.y, ev.to.dir || 'down');
        break;
      }
      case 'story': Story.trigger(ev); break;
    }
  },

  /* ---------- 描画 ---------- */
  render(ctx) {
    if (!this.mapDef) return;
    const px = G.px*TILE + (this.moving ? (this.mvTo.x - this.mvFrom.x)*(this.mvT*TILE - TILE) : 0);
    const py = G.py*TILE + (this.moving ? (this.mvTo.y - this.mvFrom.y)*(this.mvT*TILE - TILE) : 0);
    this.camX = U.clamp(px + TILE/2 - CV.W/2, 0, Math.max(0, this.mapDef.tiles[0].length*TILE - CV.W));
    this.camY = U.clamp(py + TILE/2 - CV.H/2, 0, Math.max(0, this.mapDef.tiles.length*TILE - CV.H));

    // 背景
    ctx.fillStyle = '#101020'; ctx.fillRect(0,0,CV.W,CV.H);
    const x0 = Math.floor(this.camX/TILE), y0 = Math.floor(this.camY/TILE);
    const x1 = Math.ceil((this.camX+CV.W)/TILE), y1 = Math.ceil((this.camY+CV.H)/TILE);
    for (let y=y0; y<=y1; y++) for (let x=x0; x<=x1; x++) {
      const ch = tileAt(this.mapDef, x, y);
      const t = Tiles.get(ch);
      const sx = x*TILE - this.camX, sy = y*TILE - this.camY;
      if (t) ctx.drawImage(t, sx, sy);
      else { ctx.fillStyle='#101020'; ctx.fillRect(sx,sy,TILE,TILE); }
    }
    // イベントオブジェクト
    for (const ev of (this.mapDef.events||[])) {
      const sx = ev.x*TILE - this.camX, sy = ev.y*TILE - this.camY;
      if (sx < -TILE || sy < -TILE || sx > CV.W || sy > CV.H) continue;
      if (ev.type === 'npc' || ev.type === 'story' && ev.mark && ev.mark !== 'gate' && ev.mark !== 'tower' && ev.mark !== 'core' && ev.mark !== 'summit') {
        // NPCのいるイベントはスプライト表示
      }
      if (ev.type === 'chest') {
        const done = G.flags['chest_'+this.mapId+'_'+ev.id];
        const t = Tiles.get('C');
        ctx.globalAlpha = done ? 0.35 : 1;
        ctx.drawImage(t, sx, sy); ctx.globalAlpha = 1;
      } else if (ev.type === 'save') {
        const t = Tiles.get('s'); ctx.drawImage(t, sx, sy);
        const glow = 0.5 + 0.5*Math.sin(Date.now()/300);
        ctx.fillStyle = `rgba(95,216,255,${0.25*glow})`; ctx.fillRect(sx,sy,TILE,TILE);
      } else if (ev.type === 'door') {
        const t = Tiles.get('D'); ctx.drawImage(t, sx, sy);
      } else if (ev.type === 'story' && !this.storyDone(ev)) {
        // 目的地マーカー
        const glow = 0.5 + 0.5*Math.sin(Date.now()/250);
        ctx.fillStyle = `rgba(255,220,100,${0.5*glow})`;
        ctx.beginPath(); ctx.moveTo(sx+16, sy+8); ctx.lineTo(sx+26, sy+20); ctx.lineTo(sx+6, sy+20); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,220,100,${0.8*glow})`;
        ctx.fillRect(sx+12, sy+24, 8, 6);
      } else if (ev.type === 'npc') {
        drawCharSprite(ctx, ev.face || 'npc', sx+8, sy+2, 'down', Math.floor(Date.now()/500)%2);
      }
    }
    // プレイヤー
    const sxp = px - this.camX, syp = py - this.camY;
    if (!Story.active || true) {
      drawCharSprite(ctx, G.party[0] || 'mina', sxp+8, syp+2, G.dir, this.moving ? this.walkFrame : 0);
    }
    // 暗がり
    if (this.mapDef.battleBg === 'under' || this.mapDef.battleBg === 'tartarus') {
      const g = ctx.createRadialGradient(sxp+16, syp+16, 60, sxp+16, syp+16, 320);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g; ctx.fillRect(0,0,CV.W,CV.H);
    }
    // マップ名表示（入場直後）
    if (this.fadeIn && this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0,0,CV.W,CV.H);
    }
  }
};
window.Field = Field;
