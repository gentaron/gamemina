/* ============================================================
   battle.js : FF風コマンドバトル（ボス戦・フェーズ・必殺技）
   ============================================================ */
'use strict';
window.GD = window.GD || {};

/* ---------- ボス専用技 ---------- */
const BOSS_ACTS = {
  venomshot:   {name:'ヴェノムショット', kind:'atk', elem:'dark', pow:14, tgt:'one', msg:'毒針を突き刺した！'},
  venomslash:  {name:'ヴェノムスラッシュ', kind:'atk', elem:'dark', pow:12, tgt:'rand3', msg:'毒刃の乱れ斬り！'},
  poisonburst: {name:'ポイズンバースト', kind:'mag', elem:'dark', pow:20, tgt:'all', msg:'猛毒の胞子が舞う！'},
  earthquake:  {name:'アースクエイク', kind:'atk', elem:'none', pow:22, tgt:'all', msg:'地下が揺れ、大地が割れる！'},
  swallow:     {name:'のみこむ', kind:'atk', elem:'none', pow:34, tgt:'one', msg:'巨大な顎が獲物を呑む！'},
  underburst:  {name:'アンダーバースト', kind:'mag', elem:'dark', pow:26, tgt:'all', msg:'地底の瘴気が爆ぜる！'},
  missile:     {name:'ミサイル乱射', kind:'atk', elem:'fire', pow:16, tgt:'rand3', msg:'微型ミサイルが雨と降る！'},
  commander_call:{name:'総員突撃', kind:'buff', elem:'none', tgt:'self', buff:{atk:1.3}, turns:3, msg:'「全機、目標を撃てぇ！」'},
  overrun:     {name:'オーバーラン', kind:'atk', elem:'none', pow:30, tgt:'one', msg:'装甲が獲物を踏み砕く！'},
  grandmissile:{name:'グランドミサイル', kind:'mag', elem:'fire', pow:30, tgt:'all', msg:'塔の主砲が火柱を上げる！'},
  goldenshot:  {name:'ゴールデンショット', kind:'atk', elem:'light', pow:26, tgt:'one', msg:'黄金の毒針が輝く！'},
  honeyguard:  {name:'ハニーガード', kind:'buff', elem:'none', tgt:'self', buff:{def:1.6,res:1.4}, turns:3, msg:'琥珀の蜜が装甲になる…'},
  venomstorm:  {name:'ヴェノムストーム', kind:'mag', elem:'dark', pow:26, tgt:'all', msg:'毒の嵐が戦場を覆う！'},
  royal_pheromone:{name:'王家の費洛蒙', kind:'heal', elem:'none', pow:180, tgt:'self', msg:'費洛蒙が傷を癒していく…'},
  sigmabeam:   {name:'シグマビーム', kind:'mag', elem:'light', pow:34, tgt:'one', msg:'Σの演算光が直撃する！'},
  mindshock:   {name:'マインドショック', kind:'mag', elem:'dark', pow:18, tgt:'all', msg:'精神に演算ノイズが走る！'},
  phase_shift: {name:'フェーズシフト', kind:'buff', elem:'none', tgt:'self', buff:{agi:1.6,def:1.2}, turns:3, msg:'位相がずれ、輪郭が滲む…'},
  sigma_rage:  {name:'シグマレイジ', kind:'mag', elem:'light', pow:36, tgt:'all', msg:'演算炉が暴走し、光が牙となる！'},
  apocalypse:  {name:'アポカリプス・ノスタルジア', kind:'mag', elem:'dark', pow:44, tgt:'all', msg:'——《ノスタルジア》の夜が、再び降る！'},
  nostalgia:   {name:'ノスタルジア', kind:'mag', elem:'dark', pow:32, tgt:'all', msg:'45年前の「夜」が影となって迫る！'},
  voidstorm:   {name:'ヴォイドストーム', kind:'mag', elem:'dark', pow:28, tgt:'all', msg:'虚無の渦が渦巻く！'},
  jen_slash:   {name:'ヴァロリア斬月', kind:'atk', elem:'none', pow:24, tgt:'rand3', msg:'月光の如き連撃！'},
  valoria_grace:{name:'ヴァロリアの加護', kind:'heal', elem:'none', pow:500, tgt:'self', msg:'覇者の威光が傷を癒す…'},
  jen_wave:    {name:'ジェン・ウェーブ', kind:'mag', elem:'none', pow:30, tgt:'all', msg:'覇気の波動が全体を薙ぐ！'},
  jen_judgement:{name:'覇王審判', kind:'mag', elem:'light', pow:46, tgt:'one', msg:'——「審判」が下される！'}
};

const Battle = {
  active: false, phase: '', timer: 0,
  party: [], enemies: [], cmds: [], order: [],
  turnIdx: 0, round: 1,
  sel: 0, subSel: 0, selTarget: 0, listMode: null,
  onWin: null, onLose: null, isBoss: false, bossDef: null,
  popups: [], banner: null, shakeT: 0, flash: null, msgLog: [], msgT: 0,
  awaitPhaseChange: false,

  /* ---------- 開始 ---------- */
  start(opt) {
    this.active = true; G.state = 'battle';
    this.onWin = opt.onWin; this.onLose = opt.onLose;
    this.isBoss = !!opt.boss; this.round = 1;
    this.popups = []; this.msgLog = []; this.banner = null; this.shakeT = 0; this.flash = null;
    // パーティ（最大4名・生存優先）
    this.party = G.party.slice(0,4).map(id => { const m = G.members[id]; m.guard=false; return m; });
    // 敵編成
    this.enemies = [];
    if (opt.boss) {
      this.bossDef = GD.bosses[opt.boss];
      const e = this.makeEnemy(this.bossDef, this.bossDef.name);
      e.isBoss = true; e.phases = this.bossDef.phases || []; e.phaseIdx = 0;
      this.enemies.push(e);
      AudioSys.se('boss');
      this.banner = { name: this.bossDef.name, t: 0 };
    } else {
      (opt.group||['slime_a']).forEach(id => this.enemies.push(this.makeEnemy(GD.enemies[id], GD.enemies[id].name)));
    }
    AudioSys.bgmPlay(opt.bgm || (this.isBoss?'boss':'battle'));
    this.phase = 'intro'; this.timer = 0.9;
    this.msgLog = [];
  },
  makeEnemy(def, name) {
    const e = {
      name: name || def.name, def, shape: def.shape, color: def.color,
      hp: def.hp, maxhp: def.hp, atk: def.atk, defn: def.def, mag: def.mag, res: def.res, agi: def.agi,
      acts: def.acts || null, elem: def.elem || {}, guard:false, buffs:{}, buffT:{},
      isBoss:false, phases:null, phaseIdx:0, alive:true
    };
    return e;
  },

  /* ---------- ダメージ計算 ---------- */
  elemMult(elem, target) {
    if (!elem || elem==='none' || !target.elem) return 1;
    const m = target.elem[elem];
    if (m === undefined) return 1;
    return m; // 1.5=弱点 0.5=耐性 0.3=激耐性
  },
  physDamage(actor, target, pow=0, elem='none', defcut=false) {
    const atk = this.stat(actor,'atk') * (this.buffOf(actor,'atk'));
    const dfn = this.stat(target,'defn') * (this.buffOf(target,'def')) * (defcut?0.4:1) * (target.guard?0.5:1);
    let d = (atk * (1 + pow/28) * 2.1 - dfn * 1.35);
    d *= U.rand(0.9, 1.12);
    d *= this.elemMult(elem, target.def || target);
    return Math.max(1, Math.round(d));
  },
  magDamage(actor, target, pow, elem='none', defcut=false) {
    const mg = this.stat(actor,'mag') * (this.buffOf(actor,'mag'));
    const rs = (this.stat(target,'res')||4) * (this.buffOf(target,'res')) * (defcut?0.4:1) * (target.guard?0.6:1);
    let d = (mg * (1 + pow/26) * 1.55 - rs * 1.15);
    d *= U.rand(0.92, 1.1);
    d *= this.elemMult(elem, target.def || target);
    return Math.max(1, Math.round(d));
  },
  stat(u, k) {
    if (u.id) return statOf(u, k === 'defn' ? 'def' : k); // member（defn→def変換）
    return u[k] || 0; // enemy
  },
  buffOf(u, k) {
    if (u.buffs && u.buffs[k] && (u.buffT[k]||0) > 0) return u.buffs[k];
    return 1;
  },
  applyBuff(u, buff, turns) {
    u.buffs = u.buffs || {}; u.buffT = u.buffT || {};
    Object.entries(buff).forEach(([k,v]) => { u.buffs[k] = v; u.buffT[k] = turns; });
  },
  tickBuffs(u){ if (u.buffT) Object.keys(u.buffT).forEach(k=>{ if (u.buffT[k]>0) u.buffT[k]--; }); },

  popup(x, y, text, color='#fff') { this.popups.push({x,y,text,color,t:0}); },
  log(msg) { this.msgLog.push(msg); if (this.msgLog.length>3) this.msgLog.shift(); this.msgT = 2.2; },

  /* ---------- 更新 ---------- */
  update(dt) {
    dt /= (G.battleSpeed || 1);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 1.6) { this.banner = null; this.beginRound(); } return; }
    if (this.popups.length) this.popups.forEach(p => p.t += dt);
    this.popups = this.popups.filter(p => p.t < 0.9);
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.msgT > 0) this.msgT -= dt;
    if (this.flash) { this.flash.t -= dt; if (this.flash.t<=0) this.flash = null; }

    switch (this.phase) {
      case 'intro': this.timer -= dt; if (this.timer<=0) this.beginRound(); break;
      case 'command': this.updateCommand(); break;
      case 'target': this.updateTarget(); break;
      case 'list': this.updateList(); break;
      case 'exec': this.updateExec(dt); break;
      case 'victory': case 'defeat': case 'fled': {
        this.timer -= dt;
        if (this.timer<=0) {
          this.active = false;
          if (this.phase==='victory') { AudioSys.bgmStop(); if (this.onWin) this.onWin(); else { G.state='field'; AudioSys.bgmPlay(Field.mapDef?Field.mapDef.bgm:'field'); } }
          else if (this.phase==='fled') { G.state='field'; AudioSys.bgmPlay(Field.mapDef?Field.mapDef.bgm:'field'); }
          else { if (this.onLose) this.onLose(); else GameOver.show(); }
        }
        break;
      }
    }
  },

  /* ---------- ラウンド開始 ---------- */
  beginRound() {
    this.cmds = []; this.order = [];
    this.party.filter(m=>m.hp>0).forEach(m => { m.guard=false; });
    this.commandQueue = this.party.filter(m=>m.hp>0);
    this.cmdIdx = 0;
    this.nextCommand();
  },
  nextCommand() {
    if (this.cmdIdx >= this.commandQueue.length) {
      // 全員のコマンド確定 → 実行順決定
      this.order = [];
      this.cmds.forEach(c => this.order.push({unit:c.actor, action:c}));
      this.enemies.forEach(e => { if (e.hp>0) this.order.push({unit:e, action:this.aiAction(e)}); });
      this.order.sort((a,b) => (this.stat(b.unit,'agi')*this.buffOf(b.unit,'agi')*U.rand(0.92,1.08)) - (this.stat(a.unit,'agi')*this.buffOf(a.unit,'agi')*U.rand(0.92,1.08)));
      this.turnIdx = 0;
      this.phase = 'exec'; this.timer = 0.25;
      return;
    }
    this.phase = 'command'; this.sel = 0; this.subSel = 0;
  },
  curActor() { return this.commandQueue[this.cmdIdx]; },

  /* ---------- コマンド入力 ---------- */
  updateCommand() {
    const P = Input.wasPressed.bind(Input);
    if (P('up')) { this.sel=(this.sel+4)%5; AudioSys.se('cursor'); }
    if (P('down')){ this.sel=(this.sel+1)%5; AudioSys.se('cursor'); }
    if (P('cancel') && this.cmdIdx>0) { this.cmdIdx--; this.cmds.pop(); AudioSys.se('cancel'); }
    if (P('ok')) {
      AudioSys.se('ok');
      const actor = this.curActor();
      if (this.sel===0) { this.pending={type:'attack'}; this.enterTarget(); }
      else if (this.sel===1) { this.listMode='skill'; this.subSel=0; this.phase='list'; }
      else if (this.sel===2) { this.listMode='item'; this.subSel=0; this.phase='list'; }
      else if (this.sel===3) { this.cmds.push({actor, type:'guard'}); this.cmdIdx++; this.nextCommand(); }
      else { // 逃げる
        if (this.isBoss) { this.log('逃げられない！'); AudioSys.se('buzzer'); }
        else {
          if (Math.random() < 0.65) { this.phase='fled'; this.timer=0.8; AudioSys.se('cancel'); }
          else { this.log('逃げられなかった…！'); this.cmdIdx++; this.nextCommand(); }
        }
      }
    }
  },
  enterTarget() {
    const alive = this.enemies.filter(e=>e.hp>0);
    if (!alive.length) { this.phase='exec'; return; }
    this.targets = alive;
    this.selTarget = 0;
    this.phase = 'target';
  },
  updateTarget() {
    const P = Input.wasPressed.bind(Input);
    if (P('up')||P('left')) { this.selTarget=(this.selTarget+this.targets.length-1)%this.targets.length; AudioSys.se('cursor'); }
    if (P('down')||P('right')){ this.selTarget=(this.selTarget+1)%this.targets.length; AudioSys.se('cursor'); }
    if (P('cancel')) { this.phase='command'; AudioSys.se('cancel'); }
    if (P('ok')) {
      AudioSys.se('ok');
      const actor = this.curActor();
      this.cmds.push({actor, ...this.pending, target:this.targets[this.selTarget]});
      this.cmdIdx++; this.nextCommand();
    }
  },
  updateList() {
    const P = Input.wasPressed.bind(Input);
    const actor = this.curActor();
    let list;
    if (this.listMode==='skill') list = actor.skills.map(id=>GD.skills[id]).filter(Boolean);
    else list = Object.keys(G.inv).filter(id=>{ const d=GD.items[id]; return d && d.kind==='use'; }).map(id=>({__item:id, ...GD.items[id]}));
    this._list = list;
    if (P('up') && list.length) { this.subSel=(this.subSel+list.length-1)%list.length; AudioSys.se('cursor'); }
    if (P('down') && list.length){ this.subSel=(this.subSel+1)%list.length; AudioSys.se('cursor'); }
    if (P('cancel')) { this.phase='command'; AudioSys.se('cancel'); }
    if (P('ok') && list.length) {
      const item = list[this.subSel];
      if (this.listMode==='skill') {
        const sid = actor.skills[this.subSel];
        const sk = GD.skills[sid];
        if (actor.mp < sk.mp) { AudioSys.se('buzzer'); this.log('MPが足りない！'); return; }
        this.pending = {type:'skill', id:sid};
        if (sk.tgt==='one' && (sk.kind==='atk'||sk.kind==='mag'||sk.kind==='drain'||sk.kind==='debuff')) this.enterTarget();
        else if (sk.tgt==='one') { this._healMode=true; this.partyTargets = this.party.filter(m=>true); this.selTarget=0; this.phase='ptarget'; }
        else { const a=this.curActor(); this.cmds.push({actor:a, ...this.pending}); this.cmdIdx++; this.nextCommand(); }
      } else {
        const iid = item.__item;
        const it = GD.items[iid];
        this.pending = {type:'item', id:iid};
        if (it.tgtAll) { const a=this.curActor(); this.cmds.push({actor:a, ...this.pending}); this.cmdIdx++; this.nextCommand(); }
        else { this._healMode=true; this.partyTargets = this.party.filter(m=>true); this.selTarget=0; this.phase='ptarget'; }
      }
    }
  },
  updatePTarget() {
    const P = Input.wasPressed.bind(Input);
    if (P('up')||P('left')) { this.selTarget=(this.selTarget+this.partyTargets.length-1)%this.partyTargets.length; AudioSys.se('cursor'); }
    if (P('down')||P('right')){ this.selTarget=(this.selTarget+1)%this.partyTargets.length; AudioSys.se('cursor'); }
    if (P('cancel')) { this.phase='list'; AudioSys.se('cancel'); }
    if (P('ok')) {
      AudioSys.se('ok');
      const actor = this.curActor();
      this.cmds.push({actor, ...this.pending, target:this.partyTargets[this.selTarget]});
      this.cmdIdx++; this.nextCommand();
    }
  },

  /* ---------- 敵AI ---------- */
  aiAction(e) {
    if (e.isBoss) {
      const acts = (e.phases && e.phases[e.phaseIdx] ? e.phases[e.phaseIdx].acts : e.acts) || ['attack'];
      const id = U.pick(acts);
      const act = BOSS_ACTS[id] || {name:'攻撃', kind:'atk', tgt:'one', pow:10, msg:null};
      let target = null;
      if (act.tgt==='one') {
        const alive = this.party.filter(m=>m.hp>0);
        target = U.pick(alive);
      }
      return {type:'boss_act', id, act, target, actor:e};
    }
    // 通常敵：単攻撃（たまに強攻撃）
    const alive = this.party.filter(m=>m.hp>0);
    return {type:'enemy_attack', target:U.pick(alive), actor:e};
  },

  /* ---------- 実行 ---------- */
  updateExec(dt) {
    this.timer -= dt;
    if (this.timer > 0) return;
    if (this.turnIdx >= this.order.length) { this.endRound(); return; }
    const o = this.order[this.turnIdx++];
    const u = o.unit;
    if (u.hp <= 0) { this.timer = 0.15; return; } // 死亡者スキップ
    this.execAction(u, o.action);
    this.timer = 0.72;
    // 勝敗チェック
    if (this.enemies.every(e=>e.hp<=0)) { this.win(); return; }
    if (this.party.every(m=>m.hp<=0)) { this.lose(); return; }
  },
  endRound() {
    // バフターン減
    [...this.party, ...this.enemies].forEach(u => { if (u.hp>0) this.tickBuffs(u); });
    this.round++;
    this.beginRound();
  },

  execAction(u, a) {
    const atkName = u.id ? GD.chars[u.id].name : u.name;
    if (a.type==='guard') { u.guard = true; this.log(atkName+' は身を守っている。'); return; }
    if (a.type==='attack') {
      const t = a.target;
      const crit = Math.random() < 0.06 + (this.stat(u,'luck')||0)*0.002;
      let d = this.physDamage(u, t);
      if (crit) d = Math.round(d*1.7);
      t.hp = Math.max(0, t.hp - d);
      AudioSys.se(crit?'crit':'attack');
      this.addPopup(t, d, crit?'#ffd166':'#fff');
      this.log(atkName+' の攻撃！'+(crit?' 会心の一撃！':''));
      if (t.hp<=0) this.onDeath(t);
      return;
    }
    if (a.type==='skill') {
      const sk = GD.skills[a.id];
      u.mp -= sk.mp;
      this.log(atkName+' の '+sk.name+'！');
      AudioSys.se(sk.kind==='heal'?'heal':(sk.kind==='summon'?'summon':'magic'));
      this.applySkill(u, sk, a.target);
      return;
    }
    if (a.type==='item') {
      const it = GD.items[a.id];
      removeItem(a.id, 1);
      this.log(atkName+' の '+it.name+'！');
      AudioSys.se('item');
      if (it.dmg) {
        const t = a.target;
        let d = Math.round(it.dmg * this.elemMult(it.elem, t.def||t));
        t.hp = Math.max(0, t.hp - d);
        this.addPopup(t, d, '#ff9f6f');
        if (t.hp<=0) this.onDeath(t);
      } else {
        const targets = it.tgtAll ? this.party : [a.target];
        targets.forEach(t => {
          if (it.revive && t.hp<=0) { t.hp = Math.max(t.hp, it.heal||50); this.addPopup(t,'復活!','#5fd8ff'); }
          else if (t.hp>0) {
            if (it.heal) { t.hp = Math.min(maxHpOf(t), t.hp+it.heal); this.addPopup(t, '+'+it.heal, '#5fd878'); }
            if (it.mp) { t.mp = Math.min(maxMpOf(t), t.mp+it.mp); }
          }
        });
      }
      return;
    }
    if (a.type==='enemy_attack') {
      const t = a.target;
      const d = this.physDamage(u, t);
      t.hp = Math.max(0, t.hp - d);
      AudioSys.se('damage');
      this.addPopup(t, d, '#ff8f8f');
      this.log(u.name+' の攻撃！');
      if (t.hp<=0) this.onDeath(t);
      return;
    }
    if (a.type==='boss_act') {
      const act = a.act;
      this.log(u.name+' の '+act.name+'！'+(act.msg? ' '+act.msg : ''));
      AudioSys.se(act.kind==='heal'?'heal':'boss');
      this.shakeT = 0.4;
      if (act.kind==='buff') { this.applyBuff(u, act.buff, act.turns||3); return; }
      if (act.kind==='heal') {
        u.hp = Math.min(u.maxhp, u.hp + act.pow);
        this.addPopup(u, '+'+act.pow, '#5fd878');
        return;
      }
      const dmgFn = act.kind==='mag' ? (t)=>this.magDamage(u,t,act.pow,act.elem) : (t)=>this.physDamage(u,t,act.pow,act.elem);
      const targets = act.tgt==='all' ? this.party.filter(m=>m.hp>0)
        : act.tgt==='rand3' ? [U.pick(this.party.filter(m=>m.hp>0)),U.pick(this.party.filter(m=>m.hp>0)),U.pick(this.party.filter(m=>m.hp>0))]
        : act.tgt==='rand4' ? [...Array(4)].map(()=>U.pick(this.party.filter(m=>m.hp>0)))
        : [a.target || U.pick(this.party.filter(m=>m.hp>0))];
      targets.forEach(t => { if (t.hp<=0) return;
        const d = dmgFn(t);
        t.hp = Math.max(0, t.hp - d);
        this.addPopup(t, d, '#ff8f8f');
        if (t.hp<=0) this.onDeath(t);
      });
      // ボスフェーズ遷移チェック
      if (u.isBoss && u.phases) {
        const ratio = u.hp / u.maxhp;
        const next = u.phaseIdx + 1;
        if (next < u.phases.length && ratio <= u.phases[next].hp) {
          u.phaseIdx = next;
          this.flash = {color:'rgba(255,80,80,0.5)', t:0.8};
          this.shakeT = 0.8;
          this.log(u.name+' の様子が変わった…！');
          AudioSys.se('boss');
        }
      }
      return;
    }
  },
  applySkill(u, sk, target) {
    const uname = u.id ? GD.chars[u.id].name : u.name;
    if (sk.kind==='heal') {
      const targets = sk.tgt==='all' ? this.party : [target];
      targets.forEach(t => {
        if (sk.revive && t.hp<=0) { t.hp = Math.min(maxHpOf(t), sk.pow); this.addPopup(t, '復活!', '#5fd8ff'); }
        else if (t.hp>0) {
          const amt = Math.round(sk.pow + this.stat(u,'mag')*1.4);
          t.hp = Math.min(maxHpOf(t), t.hp+amt);
          this.addPopup(t, '+'+amt, '#5fd878');
        }
      });
      return;
    }
    if (sk.kind==='buff') {
      const targets = sk.tgt==='all' ? this.party.filter(m=>m.hp>0) : [target||u];
      targets.forEach(t => this.applyBuff(t, sk.buff, sk.turns||3));
      this.log('　→ 力がみなぎる！');
      return;
    }
    if (sk.kind==='debuff') {
      const targets = sk.tgt==='all' ? this.enemies.filter(e=>e.hp>0) : [target];
      targets.forEach(t => this.applyBuff(t, sk.debuff, sk.turns||3));
      this.log('　→ 敵の力が弱まった！');
      return;
    }
    // 攻撃系
    const dmgFn = sk.kind==='mag'||sk.kind==='summon' ? (t)=>this.magDamage(u,t,sk.pow,sk.elem)
      : sk.kind==='drain' ? (t)=>this.magDamage(u,t,sk.pow,sk.elem)
      : (t)=>this.physDamage(u,t,sk.pow,sk.elem,sk.defcut);
    let targets;
    if (sk.tgt==='all') targets = this.enemies.filter(e=>e.hp>0);
    else if (sk.tgt==='rand3') targets = [...Array(3)].map(()=>U.pick(this.enemies.filter(e=>e.hp>0))).filter(Boolean);
    else if (sk.tgt==='rand4') targets = [...Array(4)].map(()=>U.pick(this.enemies.filter(e=>e.hp>0))).filter(Boolean);
    else if (sk.tgt==='rand5') targets = [...Array(5)].map(()=>U.pick(this.enemies.filter(e=>e.hp>0))).filter(Boolean);
    else targets = [target];
    let totalDrain = 0;
    targets.forEach(t => { if (!t || t.hp<=0) return;
      const crit = sk.crit || (Math.random() < 0.05);
      let d = dmgFn(t);
      if (crit) d = Math.round(d*1.6);
      t.hp = Math.max(0, t.hp - d);
      if (sk.kind==='drain') totalDrain += Math.round(d*0.5);
      this.addPopup(t, d, crit?'#ffd166':(sk.kind==='mag'||sk.kind==='summon')?'#9fb8ff':'#fff');
      // 弱点表示
      const em = this.elemMult(sk.elem, t.def||t);
      if (em >= 1.4) this.popup(t._x||600, (t._y||200)-40, '弱点！', '#ffd166');
      if (t.hp<=0) this.onDeath(t);
    });
    if (sk.kind==='drain' && totalDrain>0 && u.hp>0) {
      u.hp = Math.min(maxHpOf(u), u.hp + totalDrain);
      this.addPopup(u, '+'+totalDrain, '#5fd878');
    }
    this.shakeT = 0.2;
  },
  onDeath(u) {
    if (u.id) { this.log(GD.chars[u.id].name+' は倒れた…！'); AudioSys.se('damage'); }
    else {
      this.log(u.name+' をたおした！');
      G.bestiary[u.def && u.def.shape ? (u.def.name||u.name) : u.name] = true;
    }
  },
  addPopup(target, text, color) {
    const pos = this.unitPos(target);
    this.popups.push({x:pos.x, y:pos.y, text:String(text), color, t:0});
  },
  unitPos(u) {
    if (u.id) {
      const i = this.party.indexOf(u);
      return { x: 120 + (i%2)*80, y: 66 + i*72 };
    }
    const i = this.enemies.indexOf(u);
    const row = i % 3, col = Math.floor(i/3);
    return { x: CV.W - 240 - col*90 + row*24, y: 80 + row*104 + col*40 };
  },

  win() {
    this.phase = 'victory'; this.timer = 2.2;
    AudioSys.fanfare();
    // 経験値/報酬
    let exp = 0, tok = 0;
    this.enemies.forEach(e => { exp += e.def.exp||0; tok += e.def.tok||0; });
    G.gold += tok; G.battleCount++;
    const ups = gainExp(exp);
    // ドロップ
    const drops = [];
    this.enemies.forEach(e => {
      if (e.def.drop && e.def.drop.length) e.def.drop.forEach(d => { if (Math.random()<0.65){ addItem(d,1); drops.push(GD.items[d]?GD.items[d].name:GD.equips[d]?GD.equips[d].name:d); } });
      if (e.def.final) { G.flags.fin_won = true; }
      if (e.def.super) { G.flags.jen_won = true; }
    });
    this.victoryData = { exp, tok, ups, drops };
  },
  lose() { this.phase = 'defeat'; this.timer = 1.6; },

  /* ---------- 描画 ---------- */
  render(ctx) {
    const bgMap = { colony:'#3f2f3f', field:'#2f5f3f', city:'#3f4f6f', library:'#3f3f5f', under:'#242438',
      desert:'#6f5f3f', tower:'#3f4f5f', eros:'#4f2f5f', tartarus:'#26263a', summit:'#2f3f6f' };
    const bg = bgMap[Field.mapDef ? Field.mapDef.battleBg : 'field'] || '#2f3f4f';
    const g = ctx.createLinearGradient(0,0,0,CV.H);
    g.addColorStop(0, bg); g.addColorStop(1, '#101020');
    ctx.fillStyle = g; ctx.fillRect(0,0,CV.W,CV.H);
    // 地面
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(CV.W/2, CV.H-170, CV.W/2, 130, 0, Math.PI, Math.PI*2); ctx.fill();

    ctx.save();
    if (this.shakeT > 0) ctx.translate(U.rand(-6,6), U.rand(-4,4));

    // 敵
    this.enemies.forEach(e => {
      if (e.hp<=0) return;
      const pos = this.unitPos(e);
      this.drawEnemy(ctx, e, pos.x, pos.y);
      // ターゲットカーソル
      if (this.phase==='target' && this.targets[this.selTarget]===e) {
        const bob = Math.sin(Date.now()/120)*4;
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.moveTo(pos.x+10, pos.y-58+bob); ctx.lineTo(pos.x+22, pos.y-70+bob); ctx.lineTo(pos.x+22, pos.y-46+bob);
        ctx.closePath(); ctx.fill();
      }
      // 敵HP（ボスのみバーで上部表示、それ以外は小さく）
      if (!e.isBoss) {
        const r = e.hp/e.maxhp;
        ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(pos.x-22, pos.y-46, 44, 5);
        ctx.fillStyle = r>0.5?'#5fd878':r>0.25?'#ffd166':'#ff6f6f';
        ctx.fillRect(pos.x-22, pos.y-46, 44*r, 5);
      }
    });
    // パーティ
    this.party.forEach((m,i) => {
      const pos = this.unitPos(m);
      const alive = m.hp>0;
      ctx.globalAlpha = alive?1:0.35;
      drawCharSprite(ctx, m.id, pos.x, pos.y, 'right', Math.floor(Date.now()/400)%2, 2.2);
      ctx.globalAlpha = 1;
      if (m.guard && alive) { CV.text(ctx, '防御', pos.x+6, pos.y-30, {size:12, color:'#8fd8ff'}); }
      // ターゲットカーソル（味方選択）
      if (this.phase==='ptarget' && this.partyTargets[this.selTarget]===m) {
        const bob = Math.sin(Date.now()/120)*4;
        ctx.fillStyle = '#5fd8ff';
        ctx.beginPath();
        ctx.moveTo(pos.x+16, pos.y-40+bob); ctx.lineTo(pos.x+28, pos.y-52+bob); ctx.lineTo(pos.x+28, pos.y-28+bob);
        ctx.closePath(); ctx.fill();
      }
    });

    // ダメージポップ
    this.popups.forEach(p => {
      const a = 1 - p.t/0.9;
      ctx.globalAlpha = Math.max(0,a);
      CV.ctext(ctx, p.text, p.x, p.y - p.t*46, {size:22, bold:true, color:p.color});
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    // ボスHPバー
    const boss = this.enemies.find(e=>e.isBoss);
    if (boss && boss.hp>0) {
      const w = 420, x = CV.W/2-w/2, y = 18;
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(x-4,y-4,w+8,26);
      ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x,y+14,w,8);
      const r = boss.hp/boss.maxhp;
      ctx.fillStyle = r>0.5?'#ff9f9f':r>0.25?'#ffd166':'#ff5f5f';
      ctx.fillRect(x,y+14,w*r,8);
      CV.text(ctx, boss.name, x+4, y, {size:13, bold:true, color:'#ffd8d8'});
    }

    // メッセージ窓
    if (this.msgT > 0 && this.msgLog.length) {
      ctx.globalAlpha = Math.min(1, this.msgT*2);
      CV.window(ctx, 20, 20, 560, 40);
      CV.text(ctx, this.msgLog[this.msgLog.length-1], 36, 30, {size:15});
      ctx.globalAlpha = 1;
    }

    // バトルコマンドUI
    if (this.phase==='command' || this.phase==='target' || this.phase==='list' || this.phase==='ptarget') {
      const cmds = ['たたかう','スキル','どうぐ','ぼうぎょ','にげる'];
      const names = ['たたかう','スキル','どうぐ','ぼうぎょ','にげる'];
      CV.window(ctx, 20, CV.H-190, 200, 176);
      cmds.forEach((c,i)=>{
        CV.text(ctx, (this.sel===i&&this.phase==='command'?'▶ ':'　 ')+c, 40, CV.H-172+i*32, {size:16, bold:this.sel===i&&this.phase==='command', color:this.sel===i&&this.phase==='command'?'#ffd166':'#fff'});
      });
      // アクター表示
      if (this.phase==='command') {
        const a = this.curActor();
        CV.window(ctx, 20, CV.H-238, 200, 42);
        CV.text(ctx, GD.chars[a.id].name, 40, CV.H-227, {size:15, bold:true, color:GD.chars[a.id].color});
      }
      // ステータス窓
      const sw = 560;
      CV.window(ctx, CV.W-sw-20, CV.H-190, sw, 176);
      this.party.forEach((m,i)=>{
        const x = CV.W-sw+ (i%2)*(sw/2-10), y = CV.H-172 + Math.floor(i/2)*84;
        const def = GD.chars[m.id];
        CV.text(ctx, def.name, x+14, y, {size:14, bold:true, color: m.hp>0?def.color:'#6f6f7f'});
        const hr = maxHpOf(m), r = m.hp/hr;
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x+14, y+20, 120, 7);
        ctx.fillStyle = r>0.5?'#5fd878':r>0.25?'#ffd166':'#ff6f6f';
        if (m.hp>0) ctx.fillRect(x+14, y+20, 120*r, 7);
        CV.text(ctx, `${m.hp}/${hr}`, x+140, y+14, {size:12, color:'#c8d8f8'});
        const mr = m.mp/maxMpOf(m);
        ctx.fillStyle='rgba(255,255,255,0.12)'; ctx.fillRect(x+14, y+32, 90, 5);
        ctx.fillStyle='#5fa8ff';
        ctx.fillRect(x+14, y+32, 90*U.clamp(mr,0,1), 5);
        CV.text(ctx, `${m.mp}`, x+110, y+28, {size:11, color:'#8fd8ff'});
        // コマンド確定マーク
        const idx = this.cmds.findIndex(c=>c.actor===m);
        if (idx>=0) CV.text(ctx, '✔', x+226, y, {size:13, color:'#5fd878'});
      });
      // スキル/アイテム一覧
      if ((this.phase==='list') && this._list) {
        const list = this._list;
        CV.window(ctx, 240, CV.H-420, 480, 320);
        CV.text(ctx, this.listMode==='skill'?'スキル':'どうぐ', 260, CV.H-404, {size:15, bold:true, color:'#ffd166'});
        const shown = list.slice(Math.max(0,this.subSel-6), Math.max(0,this.subSel-6)+9);
        list.slice(Math.max(0,this.subSel-6), Math.max(0,this.subSel-6)+9).forEach((it,i)=>{
          const realIdx = Math.max(0,this.subSel-6)+i;
          const nm = this.listMode==='skill'?it.name:GD.items[it.__item].name;
          const mp = this.listMode==='skill'?it.mp:null;
          CV.text(ctx, (this.subSel===realIdx?'▶ ':'　 ')+nm, 260, CV.H-376+i*30, {size:14, color:this.subSel===realIdx?'#ffd166':'#fff'});
          if (mp!==null) CV.text(ctx, 'MP'+mp, 640, CV.H-376+i*30, {size:12, color: it.mp>this.curActor().mp?'#ff6f6f':'#8fd8ff'});
        });
        const it2 = list[this.subSel];
        if (it2) CV.text(ctx, (it2.desc||'').slice(0,34), 260, CV.H-124, {size:12, color:'#9fb8d8'});
      }
    }

    // 勝利画面
    if (this.phase==='victory' && this.victoryData) {
      const v = this.victoryData;
      CV.window(ctx, CV.W/2-240, 90, 480, 220);
      CV.ctext(ctx, '— VICTORY! —', CV.W/2, 110, {size:26, bold:true, color:'#ffd166'});
      CV.text(ctx, `経験値 ${v.exp}　n-トークン ${v.tok}`, 300, 160, {size:16});
      v.ups.forEach((u,i)=>{
        CV.text(ctx, `${GD.chars[u.id].name} はレベル ${u.m.lv} になった！`, 300, 195+i*26, {size:15, color:'#5fd8ff'});
      });
      if (v.drops.length) CV.text(ctx, v.drops.join(', ')+' を手に入れた！', 300, 195+v.ups.length*26+8, {size:14, color:'#c8f8d8'});
    }
    if (this.phase==='fled') {
      CV.window(ctx, CV.W/2-180, CV.H/2-30, 360, 60);
      CV.ctext(ctx, 'うまくにげきれた！', CV.W/2, CV.H/2-18, {size:18});
    }
    if (this.phase==='defeat') {
      ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,CV.W,CV.H);
      CV.ctext(ctx, '—— 敗北 ——', CV.W/2, CV.H/2-40, {size:30, bold:true, color:'#ff6f6f'});
    }
    // ボス登場バナー
    if (this.banner) {
      const t = this.banner.t;
      const a = t<0.3 ? t/0.3 : t>1.2 ? Math.max(0,(1.6-t)/0.4) : 1;
      ctx.fillStyle = `rgba(0,0,0,${0.55*a})`; ctx.fillRect(0, 0, CV.W, CV.H);
      ctx.globalAlpha = a;
      CV.ctext(ctx, this.banner.name, CV.W/2, CV.H/2-50, {size:34, bold:true, color:'#ff8f8f'});
      CV.ctext(ctx, '—— BOSS BATTLE ——', CV.W/2, CV.H/2+4, {size:16, color:'#ffd166'});
      ctx.globalAlpha = 1;
    }
    if (this.flash) {
      ctx.fillStyle = this.flash.color; ctx.fillRect(0,0,CV.W,CV.H);
    }
  },

  /* ---------- 敵プロシージャル描画 ---------- */
  drawEnemy(ctx, e, x, y) {
    const c = e.color || '#7f9f7f';
    const t = Date.now()/400;
    const bob = Math.sin(t + x*0.05)*3;
    ctx.save();
    ctx.translate(x, y+bob);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(0, 36, 34, 8, 0, 0, Math.PI*2); ctx.fill();
    const S = e.isBoss ? 1.9 : 1.35;
    ctx.scale(S,S);
    switch (e.shape) {
      case 'drone': {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffd166'; ctx.fillRect(-7,-4,14,5);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-26,-14,10,4); ctx.fillRect(16,-14,10,4);
        ctx.fillStyle = '#ff6f6f'; ctx.beginPath(); ctx.arc(0,-2,4,0,Math.PI*2); ctx.fill();
        break;
      }
      case 'slime': {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0,8,22,16+Math.sin(t*2)*2,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#2a2a3f'; ctx.fillRect(-9,2,4,6); ctx.fillRect(5,2,4,6);
        ctx.strokeStyle='#2a2a3f'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(0,10,5,0.1,Math.PI-0.1); ctx.stroke();
        break;
      }
      case 'hound': {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0,6,20,12,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(16,-6,9,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3f4f3f'; ctx.fillRect(-14,14,5,10); ctx.fillRect(8,14,5,10);
        ctx.fillStyle='#ffd166'; ctx.fillRect(18,-8,4,3);
        break;
      }
      case 'worm': {
        for (let i=4;i>=0;i--) {
          ctx.fillStyle = i===0 ? c : (i%2? c : '#6f5f7f');
          ctx.beginPath(); ctx.ellipse(-i*14, Math.sin(t+i)*4, 14-i, 11-i, 0, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle='#ff6f6f'; ctx.beginPath(); ctx.arc(2,-3,3.5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(2,-3,1.5,0,Math.PI*2); ctx.fill();
        break;
      }
      case 'wasp': {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0,0,16,11,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14,2); ctx.lineTo(26,6); ctx.lineTo(14,8); ctx.closePath(); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.55)';
        const wf = Math.sin(t*6)*6;
        ctx.beginPath(); ctx.ellipse(-4,-14,10,5+wf*0.3,-0.4,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6,-13,9,4+wf*0.3,0.4,0,Math.PI*2); ctx.fill();
        break;
      }
      case 'golem': {
        ctx.fillStyle = c;
        ctx.fillRect(-16,-14,32,26);
        ctx.fillRect(-22,8,12,16); ctx.fillRect(10,8,12,16);
        ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.fillRect(-16,-14,32,6);
        ctx.fillStyle='#ff6f6f'; ctx.fillRect(-9,-6,6,4); ctx.fillRect(3,-6,6,4);
        break;
      }
      case 'phantom': {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0,-6,17,Math.PI,Math.PI*2);
        for (let i=0;i<4;i++) ctx.arc(17-17*2*i/3, 6+Math.sin(t*2+i)*3, 5.5, 0, Math.PI, true);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle='#ffd166'; ctx.fillRect(-8,-10,4,4); ctx.fillRect(4,-10,4,4);
        break;
      }
      case 'soldier': {
        ctx.fillStyle = c;
        ctx.fillRect(-9,-16,18,22);
        ctx.beginPath(); ctx.arc(0,-22,8,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3f4f5f'; ctx.fillRect(-6,6,5,14); ctx.fillRect(1,6,5,14);
        ctx.fillStyle='#ffd166'; ctx.fillRect(-5,-24,10,3);
        ctx.fillStyle='#2a2a3f'; ctx.fillRect(-4,-22,3,3); ctx.fillRect(1,-22,3,3);
        break;
      }
      case 'queen': {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.ellipse(0,4,15,22,0,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(0,-24,9,0,Math.PI*2); ctx.fill();
        // 王冠
        ctx.fillStyle='#ffd166';
        ctx.beginPath(); ctx.moveTo(-10,-30); ctx.lineTo(-6,-40); ctx.lineTo(-2,-31); ctx.lineTo(2,-41); ctx.lineTo(6,-31); ctx.lineTo(10,-40); ctx.lineTo(10,-30); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#2a2a3f'; ctx.fillRect(-4,-26,3,4); ctx.fillRect(2,-26,3,4);
        // 翼
        ctx.fillStyle='rgba(255,255,255,0.4)';
        const wf = Math.sin(t*5)*5;
        ctx.beginPath(); ctx.ellipse(-20,-8,12,6+wf*0.3,-0.5,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(20,-8,12,6+wf*0.3,0.5,0,Math.PI*2); ctx.fill();
        break;
      }
      case 'sigma': {
        ctx.fillStyle = c;
        ctx.fillRect(-11,-18,22,26);
        ctx.beginPath(); ctx.moveTo(-11,-18); ctx.lineTo(0,-30); ctx.lineTo(11,-18); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#3f4f3f'; ctx.fillRect(-8,8,6,16); ctx.fillRect(2,8,6,16);
        ctx.fillStyle='#ff5f5f'; ctx.fillRect(-6,-14,5,3); ctx.fillRect(2,-14,5,3);
        ctx.fillStyle='rgba(120,255,150,0.5)'; ctx.fillRect(-3,-4,6,8);
        break;
      }
      case 'titan': {
        ctx.fillStyle = c;
        ctx.fillRect(-20,-20,40,32);
        ctx.fillRect(-26,10,14,16); ctx.fillRect(12,10,14,16);
        ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(-14,-12,10,8); ctx.fillRect(4,-12,10,8);
        ctx.fillStyle='#8fd8ff'; ctx.fillRect(-12,-10,6,4); ctx.fillRect(6,-10,6,4);
        break;
      }
      default: {
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();
  }
};
window.Battle = Battle;
