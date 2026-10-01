/* ============================================================
   story.js : カットシーンランナー / タイトル / ゲームオーバー
   ============================================================ */
'use strict';
window.GD = window.GD || {};

/* イベント再マップ（同一タイルで二段階イベント） */
GD.eventRemap = {
  ch1_prof: () => G.flags.ch1_prof_done ? 'ch1_boss' : 'ch1_prof',
  fin_forge_core: () => 'fin_forge_core'
};

const Story = {
  active: false,
  steps: null, idx: 0,
  dialogue: null,   // {who,color,face,text,shown,t,done,narr}
  waitT: 0,
  afterBattleStep: null,
  chapterCard: null, cardT: 0,

  /* ---------- 開始 ---------- */
  startSegment(name) {
    const seg = GD.segments[name];
    if (!seg) { console.warn('no segment', name); return; }
    this.active = true; this.steps = seg.slice(); this.idx = 0;
    G.state = 'story';
    this.next();
  },
  trigger(ev) {
    let name = ev.ev;
    if (GD.eventRemap[name]) name = GD.eventRemap[name]();
    if (!GD.segments[name]) { return; }
    G.flags['ev_done_' + ev.ev] = true;
    if (name === 'ch1_prof') G.flags.ch1_prof_done = true;
    if (name === 'ch1_boss') G.flags.ch1_boss_done = true;
    this.startSegment(name);
  },

  /* ---------- ステップ実行 ---------- */
  next() {
    if (!this.active) return;
    if (this.idx >= this.steps.length) { this.finishSegment(); return; }
    const st = this.steps[this.idx++];
    switch (st.t) {
      case 'say': case 'narr': {
        this.dialogue = { who: st.t==='say'?st.who:'', color: st.color||'#fff', face: st.face||null,
          text: st.text, shown:0, t:0, done:false, narr: st.t==='narr', center: !!st.center };
        break;
      }
      case 'card': {
        this.chapterCard = { title: st.title, sub: st.sub, t: 0 };
        AudioSys.bgmPlay('title');
        break;
      }
      case 'bgm': AudioSys.bgmPlay(st.id); this.next(); break;
      case 'map': Field.enter(st.map, st.x, st.y, st.dir||'down'); this.next(); break;
      case 'wait': this.waitT = st.ms/1000; break;
      case 'fade': this.waitT = st.mode==='out' ? 0.7 : 0.5; this.fadeMode = st.mode; break;
      case 'flash': this.flashColor = st.color; this.waitT = 0.4; break;
      case 'shake': Field.shakeT = 0.5; this.waitT = 0.5; break;
      case 'battle': {
        const onWin = () => { this.resumeFromBattle(); };
        if (st.group) Battle.start({ group: st.group, bgm: st.bgm||'battle', onWin, onLose:()=>{ this.onBattleLose(); } });
        else Battle.start({ boss: st.boss, bgm: st.bgm||'boss', onWin, onLose:()=>{ this.onBattleLose(); } });
        break;
      }
      case 'join': {
        if (!G.party.includes(st.char)) {
          const lv = Math.max(avgPartyLv(), 3);
          G.members[st.char] = makeChar(st.char, lv);
          G.party.push(st.char);
        }
        AudioSys.se('levelup');
        this.next();
        break;
      }
      case 'flag': G.flags[st.key] = st.val; this.next(); break;
      case 'give': addItem(st.item, st.n||1); AudioSys.se('item'); this.next(); break;
      case 'tok': G.gold += st.n; AudioSys.se('item'); this.next(); break;
      case 'heal': healPartyAll(); this.next(); break;
      case 'chapter': {
        G.chapter = st.n;
        G._chapterChanged = st.n;
        this.next();
        break;
      }
      case 'ending': {
        // エンディングセグメントへ連結
        this.startSegment('ending');
        return;
      }
      case 'credits': {
        // クレジットセグメントへ連結
        this.startSegment('credits');
        return;
      }
      case 'postgame': {
        G.clear = true; G.postgame = true;
        G.chapter = GD.chapterNames.length - 1;
        saveGame();
        Field.enter('under', 11, 3, 'up');
        this.active = false; G.state = 'field';
        Story.startDialogue('', '《裏ボス「ジェン」が地下都市の最奥（玉座）に現れた！》');
        break;
      }
      case 'control': {
        this.active = false; G.state = 'field';
        Field.fadeIn = true; Field.fade = 0;
        break;
      }
      default: this.next();
    }
  },

  finishSegment() {
    // 章変更があった場合は次章のイントロへ連結
    if (G._chapterChanged) {
      const n = G._chapterChanged;
      G._chapterChanged = 0;
      G.flags['intro_done_' + n] = true;
      const introName = (n === GD.chapterNames.length - 1) ? 'fin_intro' : `ch${n}_intro`;
      this.startSegment(introName);
      return;
    }
    this.active = false;
    if (G.state === 'story') G.state = 'field';
    saveGame(); // オートセーブ
  },

  resumeFromBattle() {
    // 戦闘勝利後に続きを実行
    this.active = true;
    G.state = 'story';
    AudioSys.fanfare();
    setTimeout(() => this.next(), 1400);
  },
  onBattleLose() {
    // 敗北 → ゲームオーバー（セグメント破棄）
    this.active = false;
    GameOver.show();
  },

  /* ---------- 簡易会話（NPC用） ---------- */
  startDialogue(who, text) {
    this.active = true; G.state = 'story';
    this.steps = []; this.idx = 0;
    this.dialogue = { who, color:'#fff', face:null, text, shown:0, t:0, done:false, narr:false };
    this._npcTalk = true;
  },

  update(dt) {
    if (this.chapterCard) {
      this.chapterCard.t += dt;
      if (this.chapterCard.t > 2.6) { this.chapterCard = null; this.next(); }
      return;
    }
    if (this.waitT > 0) {
      this.waitT -= dt;
      if (this.waitT <= 0) { this.fadeMode = null; this.flashColor = null; this.next(); }
      return;
    }
    const d = this.dialogue;
    if (d) {
      const spd = [18, 34, 60][G.textSpeed-1] || 34;
      if (!d.done) {
        d.t += dt * spd;
        d.shown = Math.min(d.text.length, d.t);
        if (d.shown >= d.text.length) { d.done = true; d.t = d.text.length; }
        if (Input.wasPressed('ok')) { d.shown = d.text.length; d.done = true; }
      } else if (Input.wasPressed('ok')) {
        AudioSys.se('cursor');
        this.dialogue = null;
        if (this._npcTalk) {
          this._npcTalk = false; this.active = false; G.state='field';
        } else this.next();
      }
    }
  },

  render(ctx) {
    if (this.chapterCard) {
      const t = this.chapterCard.t;
      const a = t<0.5 ? t*2 : t>2.1 ? Math.max(0,(2.6-t)/0.5) : 1;
      ctx.fillStyle = '#06081f'; ctx.fillRect(0,0,CV.W,CV.H);
      // 星
      ctx.fillStyle = `rgba(255,255,255,${0.5*a})`;
      for (let i=0;i<60;i++){ const x=(i*173)%CV.W, y=(i*97)%CV.H; ctx.fillRect(x,y,2,2); }
      ctx.globalAlpha = a;
      CV.ctext(ctx, this.chapterCard.title, CV.W/2, 210, {size:40, bold:true, color:'#ffd166'});
      CV.ctext(ctx, this.chapterCard.sub, CV.W/2, 280, {size:22, color:'#8fa8ff'});
      ctx.globalAlpha = 1;
      return;
    }
    // 状態表示（fade）
    if (this.fadeMode === 'out') {
      ctx.fillStyle = 'rgba(0,0,0,0.92)'; ctx.fillRect(0,0,CV.W,CV.H);
    }
    if (this.flashColor) {
      ctx.fillStyle = this.flashColor; ctx.globalAlpha = 0.45; ctx.fillRect(0,0,CV.W,CV.H); ctx.globalAlpha = 1;
    }
    const d = this.dialogue;
    if (!d) return;
    if (d.narr) {
      const lines = CV.wrap(ctx, d.text, CV.W-260, {size:17});
      const h = 60 + lines.length*30;
      CV.window(ctx, 100, CV.H-h-40, CV.W-200, h);
      const shownText = d.text.slice(0, d.shown|0);
      const sLines = CV.wrap(ctx, shownText, CV.W-260, {size:17});
      sLines.forEach((ln,i)=> CV.ctext(ctx, ln, CV.W/2, CV.H-h-16+i*30, {size:17, color:'#e8f0ff'}));
      if (d.done && Math.floor(Date.now()/350)%2===0)
        CV.text(ctx, '▼', CV.W/2+ (CV.W-200)/2 - 40, CV.H-66, {size:14, color:'#ffd166'});
    } else {
      const lines = CV.wrap(ctx, d.text, CV.W-340, {size:17});
      const h = 74 + lines.length*28;
      CV.window(ctx, 40, CV.H-h-24, CV.W-80, h);
      if (d.who) {
        // 名前タグ
        const nw = 30 + d.who.length * 17;
        CV.window(ctx, 64, CV.H-h-52, nw, 40, {top:'rgba(30,40,110,0.97)', bot:'rgba(16,20,70,0.97)'});
        CV.text(ctx, d.who, 84, CV.H-h-42, {size:16, bold:true, color: d.color});
      }
      if (d.face) CV.portrait(ctx, d.face, CV.W-190, CV.H-h+8, 84);
      const shownText = d.text.slice(0, d.shown|0);
      const sLines = CV.wrap(ctx, shownText, CV.W-340, {size:17});
      sLines.forEach((ln,i)=> CV.text(ctx, ln, 70, CV.H-h-4+i*28, {size:17}));
      if (d.done && Math.floor(Date.now()/350)%2===0)
        CV.text(ctx, '▼', CV.W-110, CV.H-56, {size:14, color:'#ffd166'});
    }
  }
};
window.Story = Story;

/* ---------- タイトル ---------- */
const Title = {
  sel: 0, t: 0,
  hasSave(){ try { return !!localStorage.getItem(SAVE_KEY); } catch(e){ return false; } },
  update(dt) {
    this.t += dt;
    if (Input.wasPressed('up')) { this.sel=(this.sel+1)%2; AudioSys.se('cursor'); }
    if (Input.wasPressed('down')) { this.sel=(this.sel+1)%2; AudioSys.se('cursor'); }
    if (Input.wasPressed('ok')) {
      AudioSys.se('ok');
      if (this.sel===0) { // はじめから
        if (this.hasSave()) { this.sel = 1; return; } // セーブがあるなら上は「つづきから」
        newGame(); Story.startSegment('pro_intro');
      } else {
        if (loadGame()) {
          G.state = 'field';
          Field.enter(G.map, G.px, G.py, G.dir);
        } else AudioSys.se('buzzer');
      }
    }
  },
  render(ctx) {
    // 背景：星と二重星
    const g = ctx.createLinearGradient(0,0,0,CV.H);
    g.addColorStop(0,'#050617'); g.addColorStop(0.6,'#0a0f33'); g.addColorStop(1,'#1a0f33');
    ctx.fillStyle = g; ctx.fillRect(0,0,CV.W,CV.H);
    for (let i=0;i<130;i++){
      const x=(i*173.3)%CV.W, y=(i*97.7 + this.t*6*(i%3+1)*0.2)%CV.H;
      const a = 0.3+0.7*Math.abs(Math.sin(i+this.t*0.5));
      ctx.fillStyle = `rgba(255,255,255,${a*0.7})`;
      ctx.fillRect(x,y, i%7===0?2:1, i%7===0?2:1);
    }
    // Ea16/Eb16 二重星
    ctx.fillStyle = 'rgba(255,190,120,0.9)';
    ctx.beginPath(); ctx.arc(790, 120, 26, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,160,0.8)';
    ctx.beginPath(); ctx.arc(850, 150, 12, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,190,120,0.15)';
    ctx.beginPath(); ctx.arc(790, 120, 44+6*Math.sin(this.t), 0, Math.PI*2); ctx.fill();
    // ロゴ
    const ly = 130 + Math.sin(this.t*1.2)*4;
    ctx.save();
    ctx.shadowColor = 'rgba(255,120,180,0.8)'; ctx.shadowBlur = 24;
    CV.ctext(ctx, 'MINA CHRONICLE', CV.W/2, ly, {size:56, bold:true, color:'#ffd8e8'});
    ctx.restore();
    CV.ctext(ctx, '〜光と音を永遠に〜', CV.W/2, ly+72, {size:22, color:'#8fd8ff'});
    CV.ctext(ctx, 'E16 star system RPG — AURALIS 2nd Generation', CV.W/2, ly+110, {size:14, color:'#6f8fbf'});
    // メニュー
    const hasSave = this.hasSave();
    const opts = hasSave ? ['つづきから','はじめから'] : ['はじめから','（記録なし）'];
    opts.forEach((o,i)=>{
      const sel = this.sel===i;
      CV.ctext(ctx, (sel?'▶ ':'　 ')+o, CV.W/2, 330+i*48, {size:22, bold:sel, color:sel?'#ffd166':(i===1&&!hasSave?'#5f6f8f':'#fff')});
    });
    CV.ctext(ctx, 'Z/Enter:きめる　X/Esc:もどる　M:メニュー　矢印/WASD:移動', CV.W/2, 470, {size:13, color:'#6f7f9f'});
    CV.ctext(ctx, 'Based on EDU canon (E16 star system) — GameMina Project', CV.W/2, CV.H-24, {size:12, color:'#4f5f7f'});
  }
};
window.Title = Title;

/* ---------- ゲームオーバー ---------- */
const GameOver = {
  t: 0, active: false,
  show(){ this.active = true; this.t = 0; G.state = 'gameover'; AudioSys.bgmStop(); AudioSys.se('boss'); },
  update(dt) {
    this.t += dt;
    if (this.t > 1.5 && (Input.wasPressed('ok')||Input.wasPressed('cancel'))) {
      this.active = false;
      saveGame(); // 敗北時も直近セーブは保持（オートセーブの位置から）
      G.state = 'title';
      Title.sel = 0;
    }
  },
  render(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,CV.W,CV.H);
    const a = Math.min(1, this.t/1.2);
    ctx.globalAlpha = a;
    CV.ctext(ctx, '—— みんな倒れた ——', CV.W/2, 220, {size:32, bold:true, color:'#ff6f6f'});
    CV.ctext(ctx, 'しかし、歴史は記録されている。', CV.W/2, 280, {size:16, color:'#c8d8f8'});
    if (this.t>1.5) CV.ctext(ctx, 'Zキー：タイトルへ', CV.W/2, 340, {size:14, color:'#8fa8ff'});
    ctx.globalAlpha = 1;
  }
};
window.GameOver = GameOver;
