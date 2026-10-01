/* ============================================================
   menu.js : メニュー / ショップ / 宿屋 / セーブUI / タイトル
   ============================================================ */
'use strict';
window.GD = window.GD || {};

/* ---------- メニュー ---------- */
const Menu = {
  active: false, mode: 'main', sel: 0, subSel: 0, memberSel: 0,
  shopId: null, shopTab: 0, innPrice: 0, msg: '', msgT: 0,

  open(){ this.active = true; this.mode='main'; this.sel=0; G.state='menu'; AudioSys.se('ok'); },
  close(){ this.active = false; G.state='field'; AudioSys.se('cancel'); },
  openSave(){ this.open(); this.mode='save'; this.sel=0; },
  openShop(id){ this.open(); this.mode='shop'; this.shopId=id; this.shopTab=0; this.sel=0; },
  openInn(price){ this.open(); this.mode='inn'; this.innPrice=price; this.sel=0; },
  toast(msg){ this.msg = msg; this.msgT = 2.2; },

  update(dt) {
    if (this.msgT > 0) this.msgT -= dt;
    const P = Input.wasPressed.bind(Input);
    switch (this.mode) {
      case 'main': {
        const items = ['item','skill','equip','status','save','system'];
        if (P('up')) { this.sel=(this.sel+items.length-1)%items.length; AudioSys.se('cursor'); }
        if (P('down')){ this.sel=(this.sel+1)%items.length; AudioSys.se('cursor'); }
        if (P('cancel')) this.close();
        if (P('ok')) { AudioSys.se('ok');
          this.mode = items[this.sel]; this.subSel=0; this.memberSel=0;
          if (this.mode==='system') this.sel=0;
          if (this.mode==='save') this.saveNow();
        }
        break;
      }
      case 'item': {
        const keys = Object.keys(G.inv);
        if (P('up') && keys.length) { this.subSel=(this.subSel+keys.length-1)%keys.length; AudioSys.se('cursor'); }
        if (P('down') && keys.length){ this.subSel=(this.subSel+1)%keys.length; AudioSys.se('cursor'); }
        if (P('cancel')) { this.mode='main'; AudioSys.se('cancel'); }
        if (P('ok') && keys.length) {
          const id = keys[this.subSel], def = GD.items[id];
          if (def && def.kind==='use') {
            if (def.revive) { this.toast('フィールドでは戦闘不能者はいない…'); AudioSys.se('buzzer'); }
            else if (def.dmg) { this.toast('戦闘中のみ使える。'); AudioSys.se('buzzer'); }
            else {
              // 対象選択（頭番）
              const m = G.members[G.party[this.memberSel % G.party.length]];
              if (def.heal) { m.hp = Math.min(maxHpOf(m), m.hp + def.heal); }
              if (def.mp) m.mp = Math.min(maxMpOf(m), m.mp + def.mp);
              if (def.cure) { /* 状態異常は未実装（バトル内のみ） */ }
              removeItem(id,1); AudioSys.se('heal');
              this.toast(`${def.name} を使った！（${m.hp}/${maxHpOf(m)}）`);
            }
          } else { this.toast(GD.items[id]?GD.items[id].desc:'使用できない。'); AudioSys.se('buzzer'); }
        }
        break;
      }
      case 'skill': {
        const m = G.members[G.party[this.memberSel % G.party.length]];
        if (P('left')) { this.memberSel=(this.memberSel+G.party.length-1)%G.party.length; AudioSys.se('cursor'); }
        if (P('right')){ this.memberSel=(this.memberSel+1)%G.party.length; AudioSys.se('cursor'); }
        if (P('up') && m.skills.length) { this.subSel=(this.subSel+m.skills.length-1)%m.skills.length; AudioSys.se('cursor'); }
        if (P('down') && m.skills.length){ this.subSel=(this.subSel+1)%m.skills.length; AudioSys.se('cursor'); }
        if (P('cancel')) { this.mode='main'; AudioSys.se('cancel'); }
        break;
      }
      case 'equip': {
        const m = G.members[G.party[this.memberSel % G.party.length]];
        const slots = ['weapon','armor','acc'];
        if (P('left')) { this.memberSel=(this.memberSel+G.party.length-1)%G.party.length; AudioSys.se('cursor'); }
        if (P('right')){ this.memberSel=(this.memberSel+1)%G.party.length; AudioSys.se('cursor'); }
        if (P('up')) { this.subSel=(this.subSel+2)%3; AudioSys.se('cursor'); }
        if (P('down')){ this.subSel=(this.subSel+1)%3; AudioSys.se('cursor'); }
        if (P('cancel')) { this.mode='main'; AudioSys.se('cancel'); }
        if (P('ok')) {
          const slot = slots[this.subSel];
          // インベントリから装備可能なもの一覧
          const cands = Object.keys(G.inv).filter(k => GD.equips[k] && GD.equips[k].slot===slot && this.canEquip(m.id, GD.equips[k]));
          if (!cands.length) { this.toast('装備できるものがない。'); AudioSys.se('buzzer'); break; }
          this.equipList = cands; this.mode='equip_pick'; this.subSel2=0;
        }
        break;
      }
      case 'equip_pick': {
        const cands = this.equipList || [];
        if (P('up') && cands.length) { this.subSel2=(this.subSel2+cands.length-1)%cands.length; AudioSys.se('cursor'); }
        if (P('down') && cands.length){ this.subSel2=(this.subSel2+1)%cands.length; AudioSys.se('cursor'); }
        if (P('cancel')) { this.mode='equip'; AudioSys.se('cancel'); }
        if (P('ok') && cands.length) {
          const m = G.members[G.party[this.memberSel % G.party.length]];
          const slot = ['weapon','armor','acc'][this.subSel];
          const newId = cands[this.subSel2];
          const oldId = m.eq[slot];
          removeItem(newId,1);
          if (oldId) addItem(oldId,1);
          m.eq[slot] = newId;
          m.hp = Math.min(m.hp, maxHpOf(m)); m.mp = Math.min(m.mp, maxMpOf(m));
          AudioSys.se('item'); this.toast(`${GD.equips[newId].name} を装備した。`);
          this.mode='equip';
        }
        break;
      }
      case 'status': {
        if (P('left')) { this.memberSel=(this.memberSel+G.party.length-1)%G.party.length; AudioSys.se('cursor'); }
        if (P('right')){ this.memberSel=(this.memberSel+1)%G.party.length; AudioSys.se('cursor'); }
        if (P('cancel')||P('ok')) { this.mode='main'; AudioSys.se('cancel'); }
        break;
      }
      case 'system': {
        const rows = 4;
        if (P('up')) { this.sel=(this.sel+rows)%(rows); AudioSys.se('cursor'); }
        if (P('down')){ this.sel=(this.sel+1)%rows; AudioSys.se('cursor'); }
        if (P('left')||P('right')) {
          const d = P('left')?-0.1:0.1;
          if (this.sel===0) { G.bgmVol=U.clamp(G.bgmVol+d,0,1); AudioSys.setBgmVol(G.bgmVol); }
          if (this.sel===1) { G.seVol=U.clamp(G.seVol+d,0,1); AudioSys.setSeVol(G.seVol); }
          saveOpts(); AudioSys.se('cursor');
        }
        if (P('ok')) {
          if (this.sel===2) { G.textSpeed=(G.textSpeed%3)+1; saveOpts(); AudioSys.se('ok'); }
          if (this.sel===3) { G.battleSpeed=G.battleSpeed===1?2:G.battleSpeed===2?0.5:1; saveOpts(); AudioSys.se('ok'); }
        }
        if (P('cancel')) { this.mode='main'; AudioSys.se('cancel'); }
        break;
      }
      case 'save': break;
      case 'shop': {
        const shop = GD.shops[this.shopId];
        const tabN = 2;
        if (P('left')) { this.shopTab=(this.shopTab+tabN-1)%tabN; this.sel=0; AudioSys.se('cursor'); }
        if (P('right')){ this.shopTab=(this.shopTab+1)%tabN; this.sel=0; AudioSys.se('cursor'); }
        const list = this.shopTab===0 ? shop.items : shop.equips;
        if (P('up') && list.length) { this.sel=(this.sel+list.length-1)%list.length; AudioSys.se('cursor'); }
        if (P('down') && list.length){ this.sel=(this.sel+1)%list.length; AudioSys.se('cursor'); }
        if (P('cancel')) { this.close(); }
        if (P('ok') && list.length) {
          const id = list[this.sel];
          const def = this.shopTab===0 ? GD.items[id] : GD.equips[id];
          if (G.gold >= def.price) {
            G.gold -= def.price; addItem(id,1); AudioSys.se('item');
            this.toast(`${def.name} を購入した。（残り ${G.gold} n）`);
          } else { this.toast('n-トークンが足りない…'); AudioSys.se('buzzer'); }
        }
        break;
      }
      case 'inn': {
        if (P('cancel')) this.close();
        if (P('ok')) {
          if (G.gold >= this.innPrice) {
            G.gold -= this.innPrice; healPartyAll(); saveGame();
            AudioSys.se('heal'); this.toast('ふかふかのベッドで全回復！（記録も保存）');
            setTimeout(()=>{ if (this.mode==='inn') this.close(); }, 900);
          } else { this.toast('n-トークンが足りない…'); AudioSys.se('buzzer'); }
        }
        break;
      }
    }
  },

  canEquip(charId, eq) {
    if (eq.for_ === 'all') return true;
    if (Array.isArray(eq.for_)) return eq.for_.includes(charId);
    return false;
  },
  saveNow() {
    if (saveGame()) { AudioSys.se('save'); this.toast('記録を保存した！'); }
    else this.toast('保存に失敗した…');
  },

  render(ctx) {
    const m = this;
    // メイン左窓
    if (['main','item','skill','equip','equip_pick','status','system'].includes(m.mode)) {
      // ステータス右窓
      CV.window(ctx, CV.W-250, 16, 234, 150);
      CV.text(ctx, 'n-トークン', CV.W-234, 28, {size:14, color:'#8fa8ff'});
      CV.text(ctx, String(G.gold), CV.W-234, 48, {size:18, bold:true});
      CV.text(ctx, 'チャプター ' + G.chapter, CV.W-234, 80, {size:14, color:'#8fa8ff'});
      const cn = GD.chapterNames[G.chapter] || (G.clear?'クリア後':'');
      CV.text(ctx, cn.slice(0,12), CV.W-234, 100, {size:13});
      CV.text(ctx, `プレイ ${Math.floor(G.playSec/60)}分`, CV.W-234, 126, {size:13, color:'#9fb8d8'});
      // パーティ窓
      CV.window(ctx, CV.W-250, 180, 234, 16+G.party.length*58);
      G.party.forEach((id,i) => {
        const inst = G.members[id], def = GD.chars[id];
        const y = 192 + i*58;
        CV.portrait(ctx, id, CV.W-246, y-6, 44);
        CV.text(ctx, def.name, CV.W-192, y, {size:15, bold:true, color:def.color});
        CV.text(ctx, `Lv${inst.lv}`, CV.W-192, y+20, {size:13});
        // HPバー
        const hw=90, hr=maxHpOf(inst), r=U.clamp(inst.hp/hr,0,1);
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fillRect(CV.W-140, y+22, hw, 8);
        ctx.fillStyle = r>0.5?'#5fd878':r>0.25?'#ffd166':'#ff6f6f';
        ctx.fillRect(CV.W-140, y+22, hw*r, 8);
        CV.text(ctx, `${inst.hp}/${hr}`, CV.W-140, y+32, {size:11, color:'#c8d8f8'});
      });
    }
    switch (m.mode) {
      case 'main': {
        CV.window(ctx, 16, 16, 220, 260);
        ['アイテム','スキル','装備','ステータス','セーブ','システム'].forEach((s,i)=>{
          CV.text(ctx, (m.sel===i?'▶ ':'　 ')+s, 40, 36+i*36, {size:17, bold:m.sel===i, color:m.sel===i?'#ffd166':'#fff'});
        });
        break;
      }
      case 'item': {
        CV.window(ctx, 16, 16, 460, 380);
        CV.text(ctx, 'アイテム', 36, 28, {size:18, bold:true, color:'#ffd166'});
        const keys = Object.keys(G.inv);
        if (!keys.length) CV.text(ctx, '何も持っていない。', 36, 70, {size:15});
        keys.forEach((id,i)=>{
          const def = GD.items[id];
          if (!def) return;
          CV.text(ctx, (m.subSel===i?'▶ ':'　 ')+def.name, 36, 66+i*30, {size:15, color:m.subSel===i?'#ffd166':'#fff'});
          CV.text(ctx, '×'+G.inv[id], 380, 66+i*30, {size:14, color:'#9fb8d8'});
        });
        break;
      }
      case 'skill': {
        const inst = G.members[G.party[m.memberSel%G.party.length]];
        const def = GD.chars[inst.id];
        CV.window(ctx, 16, 16, 520, 400);
        CV.text(ctx, `スキル - ${def.name}（◀▶で切替）`, 36, 28, {size:17, bold:true, color:def.color});
        inst.skills.forEach((sid,i)=>{
          const sk = GD.skills[sid];
          if (!sk) return;
          CV.text(ctx, (m.subSel===i?'▶ ':'　 ')+sk.name, 36, 64+i*28, {size:14, color:m.subSel===i?'#ffd166':'#fff'});
          CV.text(ctx, 'MP'+sk.mp, 430, 64+i*28, {size:12, color:'#8fb2ff'});
        });
        const sk = GD.skills[inst.skills[m.subSel]];
        if (sk) CV.text(ctx, sk.desc, 36, 366, {size:13, color:'#c8d8f8'});
        break;
      }
      case 'equip': case 'equip_pick': {
        const inst = G.members[G.party[m.memberSel%G.party.length]];
        const def = GD.chars[inst.id];
        CV.window(ctx, 16, 16, 480, 300);
        CV.text(ctx, `装備 - ${def.name}（◀▶で切替）`, 36, 28, {size:17, bold:true, color:def.color});
        ['weapon','armor','acc'].forEach((slot,i)=>{
          const eid = inst.eq[slot];
          const eq = eid ? GD.equips[eid] : null;
          CV.text(ctx, (m.subSel===i?'▶ ':'　 ')+['武器','防具','装飾'][i]+'：', 36, 72+i*40, {size:15});
          CV.text(ctx, eq?eq.name:'—', 140, 72+i*40, {size:15, color: m.subSel===i?'#ffd166':'#c8d8f8'});
        });
        CV.text(ctx, `攻撃 ${statOf(inst,'atk')}　防御 ${statOf(inst,'def')}　魔法 ${statOf(inst,'mag')}　速さ ${statOf(inst,'agi')}`, 36, 210, {size:13, color:'#9fb8d8'});
        if (m.mode==='equip_pick' && m.equipList) {
          CV.window(ctx, 520, 16, 420, 60+m.equipList.length*30+20);
          m.equipList.forEach((id,i)=>{
            CV.text(ctx, (m.subSel2===i?'▶ ':'　 ')+GD.equips[id].name, 540, 34+i*30, {size:14, color:m.subSel2===i?'#ffd166':'#fff'});
          });
        }
        break;
      }
      case 'status': {
        const inst = G.members[G.party[m.memberSel%G.party.length]];
        const def = GD.chars[inst.id];
        CV.window(ctx, 16, 16, 480, 420);
        CV.portrait(ctx, inst.id, 36, 32, 72);
        CV.text(ctx, def.full, 130, 44, {size:18, bold:true, color:def.color});
        CV.text(ctx, def.role, 130, 72, {size:14, color:'#8fa8ff'});
        const S = k => statOf(inst,k);
        const rows = [['レベル',inst.lv],['経験値',inst.exp],['HP',`${inst.hp}/${maxHpOf(inst)}`],['MP',`${inst.mp}/${maxMpOf(inst)}`],
          ['攻撃',S('atk')],['防御',S('def')],['魔法',S('mag')],['耐性',S('res')],['素早さ',S('agi')],['幸運',S('luck')]];
        rows.forEach((r,i)=>{
          CV.text(ctx, r[0], 40, 130+i*28, {size:14, color:'#9fb8d8'});
          CV.text(ctx, String(r[1]), 180, 130+i*28, {size:14, bold:true});
        });
        CV.text(ctx, def.desc, 240, 130, {size:12, color:'#c8d8f8'});
        break;
      }
      case 'system': {
        CV.window(ctx, 16, 16, 420, 300);
        CV.text(ctx, 'システム', 36, 28, {size:18, bold:true, color:'#ffd166'});
        const spdTxt = {1:'ふつう',2:'はやい',0.5:'ゆっくり'}[G.battleSpeed]||'ふつう';
        [['BGM音量', Math.round(G.bgmVol*10)],['SE音量', Math.round(G.seVol*10)],
         ['文字速度',['おそい','ふつう','はやい'][G.textSpeed-1]],['戦闘速度',spdTxt]].forEach((r,i)=>{
          CV.text(ctx, (m.sel===i?'▶ ':'　 ')+r[0], 40, 70+i*40, {size:15, color:m.sel===i?'#ffd166':'#fff'});
          CV.text(ctx, String(r[1]), 260, 70+i*40, {size:15, color:'#8fa8ff'});
        });
        CV.text(ctx, '◀▶ で調整', 40, 240, {size:12, color:'#6f7f9f'});
        break;
      }
      case 'save': {
        // セーブ画面は即保存→メインへ
        m.mode = 'main';
        break;
      }
      case 'shop': {
        const shop = GD.shops[m.shopId];
        CV.window(ctx, 16, 16, 560, 400);
        CV.text(ctx, shop.name, 36, 28, {size:18, bold:true, color:'#ffd166'});
        CV.text(ctx, m.shopTab===0?'▶買う　　売る':'　買う　▶売る', 380, 32, {size:14, color:'#8fa8ff'});
        CV.text(ctx, `${G.gold} n`, 460, 32, {size:14, color:'#ffd166'});
        const list = m.shopTab===0 ? shop.items : shop.equips;
        list.forEach((id,i)=>{
          const def = m.shopTab===0?GD.items[id]:GD.equips[id];
          const afford = G.gold >= def.price;
          CV.text(ctx, (m.sel===i?'▶ ':'　 ')+def.name, 36, 72+i*28, {size:15, color:afford?(m.sel===i?'#ffd166':'#fff'):'#6f7f9f'});
          CV.text(ctx, def.price+' n', 430, 72+i*28, {size:13, color:'#8fa8ff'});
        });
        const id = list[m.sel];
        if (id) {
          const def = m.shopTab===0?GD.items[id]:GD.equips[id];
          CV.text(ctx, def.desc||'', 36, 360, {size:13, color:'#c8d8f8'});
        }
        break;
      }
      case 'inn': {
        CV.window(ctx, 260, 200, 440, 120);
        CV.text(ctx, `${this.innPrice} n で一晩泊まりますか？`, 290, 226, {size:16});
        CV.text(ctx, '▶泊まる（Z）　　やめる（X）', 290, 264, {size:15, color:'#8fa8ff'});
        break;
      }
    }
    // トースト
    if (m.msgT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, m.msgT);
      const w = 24 + m.msg.length*15;
      CV.window(ctx, CV.W/2-w/2, CV.H-120, w, 44);
      CV.text(ctx, m.msg, CV.W/2-w/2+12, CV.H-108, {size:14});
      ctx.restore();
    }
  }
};
window.Menu = Menu;
