/* ============================================================
   GAMEMINA CHRONICLE ─ Battle Engine
   クラシックターン制 / 属性 / ステータス異常 / ボスフェーズ /
   Canvas演出（ダメージポップ・フラッシュ・シェイク）
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const U = GM.U, S = GM.state, $ = GM.$;
  const VW = 480, VH = 304;

  const B = {
    active: false, party: [], enemies: [], order: [], turnIdx: 0,
    round: 1, log: '', popups: [], shake: 0, flash: 0, bg: null,
    canFlee: true, onEnd: null, acting: null, targetSel: null,
    guardFlags: new Set(), animT: 0, waitResolve: null, result: null
  };
  GM.Battle = B;

  /* ---------------- unit factory ---------------- */
  function makeEnemy(key) {
    const def = GM.ENEMIES[key];
    if (!def) { console.warn('enemy missing', key); return null; }
    return {
      key, def, name: def.name, spr: def.spr, isEnemy: true, boss: !!def.boss,
      lv: def.lv, hp: def.hp, maxhp: def.hp,
      atk: def.atk, def: def.def, mag: def.mag, mdf: def.mdf, spd: def.spd,
      exp: def.exp, tg: def.tg, weak: def.weak || [], ai: def.ai,
      skills: def.skills || [], phases: def.phases || [], phaseIdx: 0,
      statuses: [], guarding: false, alive: true, flashT: 0, dx: 0, dy: 0
    };
  }

  /* ---------------- boss cut-in (URL索引ポートレート) ---------------- */
  function bossIntroImage(key) {
    // 1) イラストリポジトリのポートレート
    if (GM.Portraits && GM.Portraits.ENEMIES[key]) {
      const im = GM.Portraits.get(key);
      if (im) return { src: im.src, art: true };
      // 未ロードなら非同期で後から差し替え（pixelを一旦出す）
    }
    // 2) フォールバック: ドット絵を拡大
    const def = GM.ENEMIES[key];
    if (def && GM.ENEMY_ART[def.spr]) {
      const size = GM.SPRITES.enemySize(def.spr, 1);
      const cv = document.createElement('canvas');
      cv.width = size.w; cv.height = size.h;
      const c = cv.getContext('2d');
      GM.SPRITES.drawEnemy(c, def.spr, size.w / 2, size.h, 1, {});
      return { src: cv.toDataURL(), art: false };
    }
    return null;
  }
  function showBossIntro(enemies) {
    const boss = enemies.find((e) => e.boss);
    if (!boss) return;
    const box = $('boss-intro'), img = $('boss-intro-img'), nm = $('boss-intro-name'), sub = $('boss-intro-sub');
    if (!box) return;
    nm.textContent = boss.name;
    sub.textContent = boss.def.final ? '── FINAL BATTLE ──' : '── BOSS BATTLE ──';
    box.classList.remove('art');
    const info = bossIntroImage(boss.key);
    if (info) {
      img.src = info.src;
      box.classList.toggle('art', !!info.art);
      box.classList.remove('hidden');
      box.classList.remove('run');
      void box.offsetWidth;
      box.classList.add('run');
      // イラストが後から届いたら差し替え
      if (GM.Portraits && GM.Portraits.ENEMIES[boss.key]) {
        GM.Portraits.fetch(boss.key, (im) => {
          if (im && !box.classList.contains('hidden')) {
            img.src = im.src;
            box.classList.add('art');
            box.classList.remove('run'); void box.offsetWidth; box.classList.add('run');
          }
        });
      }
      clearTimeout(showBossIntro._t);
      showBossIntro._t = setTimeout(() => box.classList.add('hidden'), 1700);
    }
  }

  /* ---------------- run (public) ---------------- */
  B.run = function (enemyKeys, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const sceneBefore = S.scene;
      S.scene = 'battle';
      GM.uiOwner = 'battle';
      $('battle-ui').classList.remove('hidden');

      B.active = true;
      B.canFlee = !opts.noEscape && !opts.boss;
      B.resolve = resolve;
      B.result = null;
      B.round = 1;
      B.popups = []; B.shake = 0;
      B.guardFlags = new Set();
      B.bg = S.map ? (S.map.floorTile || 'stone') : 'stone';

      // party snapshot (battleParty), revive dead members at 1hp? no: must be alive
      B.party = S.battleParty.slice(0, 4);
      if (!B.party.length) B.party = S.party.slice(0, 4);
      B.party.forEach((m) => { m.statuses = []; m.guarding = false; if (m.hp <= 0) m.hp = 1; });

      B.enemies = enemyKeys.map(makeEnemy).filter(Boolean);
      B.enemies.forEach((e, i) => {
        e.slot = i;
        e.statuses = [];
      });

      GM.AUDIO.playBGM(opts.boss ? (B.enemies[0].def.final ? 'final' : 'boss') : 'battle');
      GM.BatUI.buildParty();
      GM.BatUI.log('');
      if (opts.boss || B.enemies.some((e) => e.boss)) showBossIntro(B.enemies);
      B.round = 0;
      nextRound();
    });
  };

  /* ---------------- turn order ---------------- */
  function nextRound() {
    B.round++;
    B.order = [...B.party.filter((m) => m.hp > 0), ...B.enemies.filter((e) => e.hp > 0)];
    B.order.sort((a, b) => (effSpd(b) + U.rand(0, 4)) - (effSpd(a) + U.rand(0, 4)));
    B.turnIdx = -1;
    tickRoundStatuses();
    nextTurn();
  }

  function effSpd(u) {
    let spd = u.spd;
    const h = u.statuses.find((s) => s.id === 'haste');
    if (h) spd = Math.floor(spd * 1.6);
    return spd;
  }

  function alive() {
    return {
      party: B.party.some((m) => m.hp > 0),
      enemies: B.enemies.some((e) => e.hp > 0)
    };
  }

  function nextTurn() {
    const st = alive();
    if (!st.party) { endBattle('lose'); return; }
    if (!st.enemies) { endBattle('win'); return; }

    B.turnIdx++;
    if (B.turnIdx >= B.order.length) { nextRound(); return; }
    const unit = B.order[B.turnIdx];
    if (!unit || unit.hp <= 0) { nextTurn(); return; }

    // 眠り / 麻痺
    const slp = unit.statuses.find((s) => s.id === 'sleep');
    if (slp) {
      GM.BatUI.log(`${unit.name} は眠っている……`);
      if (U.chance(0.35)) { unit.statuses = unit.statuses.filter((s) => s !== slp); GM.BatUI.log(`${unit.name} は目を覚ました！`); }
      setTimeout(nextTurn, 650);
      return;
    }
    const par = unit.statuses.find((s) => s.id === 'paralysis');
    if (par && U.chance(0.5)) {
      GM.BatUI.log(`${unit.name} は体がしびれて動けない！`);
      setTimeout(nextTurn, 650);
      return;
    }

    if (unit.isEnemy) { setTimeout(() => enemyAct(unit), 520); }
    else { playerAct(unit); }
  }

  function tickRoundStatuses() {
    [...B.party, ...B.enemies].forEach((u) => {
      if (u.hp <= 0) return;
      u.statuses.forEach((s) => { s.turns--; });
      // poison
      const po = u.statuses.find((s) => s.id === 'poison');
      if (po) {
        const dmg = Math.max(1, Math.floor(u.maxhp * 0.06));
        damageUnit(u, dmg, { silent: true });
        B.popups.push(makePopup(u, dmg, '#7ce38b', '毒'));
        if (u.hp <= 0) killUnit(u);
      }
      u.statuses = u.statuses.filter((s) => s.turns > 0);
    });
    GM.BatUI.updateParty();
  }

  /* ---------------- player command ---------------- */
  function playerAct(member) {
    B.acting = member;
    GM.BatUI.setActive(B.party.indexOf(member));
    GM.BatUI.log(`${member.name} の行動──`);
    const cmds = {
      click: (i) => {
        switch (i) {
          case 0: pickTarget(member, (t) => doAttack(member, t)); break;
          case 1: showAbilities(member); break;
          case 2: showItems(member); break;
          case 3: doGuard(member); break;
          case 4: doFlee(member); break;
        }
      }
    };
    GM.BatUI.fillCmd(cmds);
  }

  function showAbilities(member) {
    const rows = member.skills.map((id) => {
      const ab = GM.ABILITIES[id];
      if (!ab) return null;
      return { label: ab.name, right: `MP${ab.mp}`, dis: member.mp < ab.mp, id, ab };
    }).filter(Boolean);
    if (!rows.length) { GM.AUDIO.sfx('cancel'); playerAct(member); return; }
    GM.BatUI.fillList(rows, {
      box: 'bat-abil',
      click: (i) => {
        const ab = rows[i].ab;
        if (ab.tgt === 'enemy') pickTarget(member, (t) => useAbility(member, ab, t));
        else useAbility(member, ab, null);
      },
      cancel: () => playerAct(member)
    });
  }

  function showItems(member) {
    const rows = Object.keys(S.items).filter((id) => GM.ITEMS[id]).map((id) => {
      const it = GM.ITEMS[id];
      const usable = ['heal', 'mp', 'revive', 'cure', 'battle'].includes(it.type);
      return { label: it.name, right: `×${S.items[id]}`, dis: !usable, id, it };
    });
    if (!rows.length) { GM.AUDIO.sfx('cancel'); playerAct(member); return; }
    GM.BatUI.fillList(rows, {
      box: 'bat-item',
      click: (i) => {
        const { id, it } = rows[i];
        if (it.type === 'battle') pickTarget(member, (t) => useItemBattle(member, id, it, t));
        else if (it.type === 'revive') pickDeadAlly(member, (t) => useItemRevive(member, id, it, t));
        else pickAlly(member, (t) => useItemSupport(member, id, it, t));
      },
      cancel: () => playerAct(member)
    });
  }

  /* ---------------- target selection ---------------- */
  function pickTarget(member, cb) {
    const rows = B.enemies.filter((e) => e.hp > 0).map((e, i) => ({
      label: `${e.name}  ${e.hp}/${e.maxhp}`, right: '', dis: false, e
    }));
    if (rows.length === 1) { cb(rows[0].e); return; }
    GM.BatUI.fillList(rows, {
      box: 'bat-target',
      click: (i) => cb(rows[i].e),
      cancel: () => playerAct(member)
    });
  }
  function pickAlly(member, cb) {
    const rows = B.party.map((m) => ({ label: `${m.name}  ${m.hp}/${m.maxhp}`, right: '', dis: m.hp <= 0, m }));
    if (rows.length === 1) { cb(rows[0].m); return; }
    GM.BatUI.fillList(rows, {
      box: 'bat-target',
      click: (i) => { if (rows[i].dis) { GM.AUDIO.sfx('cancel'); return; } cb(rows[i].m); },
      cancel: () => playerAct(member)
    });
  }
  function pickDeadAlly(member, cb) {
    const rows = B.party.map((m) => ({ label: `${m.name}`, right: m.hp <= 0 ? '戦闘不能' : '', dis: m.hp > 0, m }));
    GM.BatUI.fillList(rows, {
      box: 'bat-target',
      click: (i) => { if (rows[i].dis) { GM.AUDIO.sfx('cancel'); return; } cb(rows[i].m); },
      cancel: () => playerAct(member)
    });
  }

  /* ---------------- actions ---------------- */
  function doAttack(actor, target) {
    execAttack(actor, target, { name: 'たたかう', kind: 'phys', el: 'phys', pow: 1.0 });
  }

  function useAbility(actor, ab, target) {
    actor.mp -= ab.mp;
    GM.BatUI.updateParty();
    if (ab.kind === 'heal') {
      const amt = ab.pow + Math.floor(actor.mag * 1.6);
      healUnit(target, amt);
      GM.AUDIO.sfx('heal');
      B.popups.push(makePopup(target, amt, '#7ce38b'));
      GM.BatUI.log(`${actor.name} の ${ab.name}！ ${target.name} のHPが回復！`);
      finishPlayer(ab);
      return;
    }
    if (ab.kind === 'revive') {
      target.hp = Math.floor(target.maxhp / 2);
      GM.AUDIO.sfx('revive');
      B.popups.push(makePopup(target, 'REVIVE', '#ffe066'));
      GM.BatUI.log(`${actor.name} の ${ab.name}！ ${target.name} が復帰した！`);
      finishPlayer(ab);
      return;
    }
    if (ab.kind === 'buff' || ab.kind === 'debuff') {
      applyStatus(ab.tgt === 'self' ? actor : (ab.tgt === 'allies' ? null : target), ab);
      GM.AUDIO.sfx(ab.kind === 'buff' ? 'buff' : 'debuff');
      GM.BatUI.log(`${actor.name} の ${ab.name}！`);
      finishPlayer(ab);
      return;
    }
    // offensive
    GM.AUDIO.sfx(ab.sfx || 'hit');
    if (ab.tgt === 'enemies') {
      GM.BatUI.log(`${actor.name} の ${ab.name}！`);
      B.enemies.filter((e) => e.hp > 0).forEach((e) => dealAbilityDamage(actor, e, ab));
      finishPlayer(ab);
    } else {
      GM.BatUI.log(`${actor.name} の ${ab.name}！`);
      dealAbilityDamage(actor, target, ab);
      finishPlayer(ab);
    }
  }

  function dealAbilityDamage(actor, target, ab) {
    const hits = ab.hits || 1;
    let total = 0;
    for (let i = 0; i < hits; i++) {
      const dmg = calcDamage(actor, target, ab);
      damageUnit(target, dmg);
      total += dmg;
      B.popups.push(makePopup(target, dmg, elColor(ab.el), hits > 1 ? `${i + 1}` : null));
    }
    if (ab.kind === 'drain') {
      healUnit(actor, Math.floor(total / 2));
      B.popups.push(makePopup(actor, Math.floor(total / 2), '#7ce38b'));
    }
    if (ab.status && U.chance(ab.status.rate || 1)) applyStatus(target, ab);
    if (target.hp <= 0) killUnit(target);
  }

  function finishPlayer(ab) {
    GM.BatUI.hideAll();
    GM.BatUI.setActive(-1);
    setTimeout(nextTurn, ab && (ab.tgt === 'enemies') ? 800 : 620);
  }

  function doGuard(member) {
    member.guarding = true;
    GM.BatUI.log(`${member.name} は身を守っている`);
    GM.AUDIO.sfx('confirm');
    finishPlayer(null);
  }

  async function doFlee(member) {
    if (!B.canFlee) {
      GM.BatUI.log(`逃げられない！`);
      GM.AUDIO.sfx('cancel');
      finishPlayer(null);
      return;
    }
    const avgSpd = B.party.reduce((a, m) => a + (m.hp > 0 ? m.spd : 0), 0) / Math.max(1, B.party.filter((m) => m.hp > 0).length);
    const enemySpd = B.enemies.reduce((a, e) => a + (e.hp > 0 ? e.spd : 0), 0) / Math.max(1, B.enemies.filter((e) => e.hp > 0).length);
    if (U.chance(0.55 + (avgSpd - enemySpd) * 0.03)) {
      GM.AUDIO.sfx('cancel');
      GM.BatUI.log(`うまく逃げ切った！`);
      endBattle('flee');
    } else {
      GM.BatUI.log(`逃げられなかった！`);
      finishPlayer(null);
    }
  }

  function useItemBattle(actor, id, it, target) {
    GM.addItem(id, -1);
    GM.AUDIO.sfx(it.abil.sfx || 'hit');
    GM.BatUI.log(`${actor.name} は ${it.name} を使った！`);
    const targets = it.abil.tgt === 'enemies' ? B.enemies.filter((e) => e.hp > 0) : [target];
    targets.forEach((e) => {
      const dmg = Math.floor(calcDamage(actor, e, it.abil));
      damageUnit(e, dmg);
      B.popups.push(makePopup(e, dmg, elColor(it.abil.el)));
      if (e.hp <= 0) killUnit(e);
    });
    finishPlayer(null);
  }
  function useItemRevive(actor, id, it, target) {
    GM.addItem(id, -1);
    target.hp = Math.floor(target.maxhp * (it.val || 0.5));
    GM.AUDIO.sfx('revive');
    B.popups.push(makePopup(target, 'REVIVE', '#ffe066'));
    GM.BatUI.log(`${actor.name} は ${it.name} を使った！ ${target.name} が復帰！`);
    GM.BatUI.updateParty();
    finishPlayer(null);
  }
  function useItemSupport(actor, id, it, target) {
    GM.addItem(id, -1);
    GM.AUDIO.sfx('heal');
    GM.BatUI.log(`${actor.name} は ${it.name} を使った！`);
    if (it.type === 'heal') {
      const amt = it.val >= 9999 ? target.maxhp : it.val;
      healUnit(target, amt);
      if (it.mp) target.mp = Math.min(target.maxmp, target.mp + it.mp);
      B.popups.push(makePopup(target, amt, '#7ce38b'));
    } else if (it.type === 'mp') {
      target.mp = Math.min(target.maxmp, target.mp + it.val);
      B.popups.push(makePopup(target, it.val, '#62d6ff'));
    } else if (it.type === 'cure') {
      target.statuses = target.statuses.filter((s) => !(it.cures || []).includes(s.id));
      B.popups.push(makePopup(target, 'OK', '#7ce38b'));
    }
    GM.BatUI.updateParty();
    finishPlayer(null);
  }

  /* ---------------- enemy AI ---------------- */
  function enemyAct(enemy) {
    if (enemy.hp <= 0) { nextTurn(); return; }
    // phase check
    const ph = enemy.phases[enemy.phaseIdx];
    if (ph && enemy.hp / enemy.maxhp <= ph.hp) {
      enemy.phaseIdx++;
      enemy.skills = [...enemy.def.skills, ...(ph.add || [])];
      if (ph.status) applyStatus(enemy, { status: ph.status, tgt: 'self', name: '' });
      GM.BatUI.log(ph.msg || `${enemy.name} の様子が変わった！`);
      GM.AUDIO.sfx('bossroar');
      B.shake = 12;
      setTimeout(() => enemyChoose(enemy), 900);
      return;
    }
    enemyChoose(enemy);
  }

  function enemyChoose(enemy) {
    const skills = enemy.skills.filter((s) => GM.ESKILLS[s]);
    const useSkill = skills.length && (enemy.ai === 'caster' ? U.chance(0.7) : U.chance(0.3));
    if (useSkill) {
      const sk = GM.ESKILLS[U.pick(skills)];
      enemySkill(enemy, sk);
    } else {
      // basic attack
      const target = pickPartyTarget();
      execAttack(enemy, target, { name: 'たたかう', kind: 'phys', el: 'phys', pow: 1.0 });
    }
  }

  function enemySkill(enemy, sk) {
    const name = sk.name || 'スキル';
    GM.AUDIO.sfx(sk.kind === 'mag' ? 'magic' : sk.kind === 'heal' ? 'heal' : sk.kind === 'buff' || sk.kind === 'debuff' ? 'debuff' : 'hit');
    if (sk.kind === 'heal') {
      healUnit(enemy, sk.pow);
      B.popups.push(makePopup(enemy, sk.pow, '#7ce38b'));
      GM.BatUI.log(`${enemy.name} の ${name}！ HPが回復した`);
      setTimeout(nextTurn, 700);
      return;
    }
    if (sk.kind === 'buff' || sk.kind === 'debuff') {
      const targets = sk.tgt === 'allies' ? (enemy.isEnemy ? B.enemies.filter((e) => e.hp > 0) : B.party.filter((m) => m.hp > 0))
        : sk.tgt === 'self' ? [enemy]
          : (enemy.isEnemy ? B.party.filter((m) => m.hp > 0) : B.enemies.filter((e) => e.hp > 0));
      targets.forEach((t) => { if (sk.status && U.chance(sk.status.rate || 1)) applyStatus(t, sk); });
      GM.BatUI.log(`${enemy.name} の ${name}！`);
      setTimeout(nextTurn, 700);
      return;
    }
    if (sk.tgt === 'allies') {
      // 敵視点のallies = パーティ全体
      const targets = enemy.isEnemy ? B.party.filter((m) => m.hp > 0) : B.enemies.filter((e) => e.hp > 0);
      GM.BatUI.log(`${enemy.name} の ${name}！`);
      targets.forEach((t) => {
        const dmg = calcDamage(enemy, t, sk);
        damageUnit(t, dmg);
        B.popups.push(makePopup(t, dmg, elColor(sk.el)));
        if (t.hp <= 0) killUnit(t);
      });
      setTimeout(nextTurn, 850);
      return;
    }
    const target = sk.tgt === 'enemy' ? pickPartyTarget() : pickPartyTarget();
    execAttack(enemy, target, sk);
  }

  function pickPartyTarget() {
    const aliveM = B.party.filter((m) => m.hp > 0);
    // 30%でHP最低を狙う
    if (U.chance(0.3)) {
      let low = aliveM[0];
      aliveM.forEach((m) => { if (m.hp < low.hp) low = m; });
      return low;
    }
    return U.pick(aliveM);
  }

  /* ---------------- shared combat math ---------------- */
  function execAttack(actor, target, sk) {
    GM.AUDIO.sfx(sk.kind === 'mag' ? 'magic' : U.chance(0.15) ? 'crit' : 'hit');
    GM.BatUI.log(`${actor.name} の ${sk.name || '攻撃'}！`);
    const dmg = calcDamage(actor, target, sk);
    damageUnit(target, dmg);
    B.popups.push(makePopup(target, dmg, sk.el === 'phys' ? '#ffffff' : elColor(sk.el)));
    if (actor.isEnemy) { actor.dx = 6; }
    else { actor.dx = -6; }
    if (target.hp <= 0) killUnit(target);
    if (actor.isEnemy) setTimeout(nextTurn, 700);
    else finishPlayer(null);
  }

  function calcDamage(actor, target, sk) {
    const isMag = sk.kind === 'mag';
    let base;
    if (isMag) {
      base = Math.max(1, actor.mag * 2 - (target.mdf || 0) * 0.9);
    } else if (sk.pierce) {
      base = actor.atk * 2 * 1.15;
    } else {
      base = Math.max(1, actor.atk * 2 - (target.def || 0));
    }
    let dmg = base * (sk.pow || 1);
    // element
    if (target.weak && target.weak.includes(sk.el)) dmg *= 1.5;
    // guard
    if (target.guarding) dmg *= 0.4;
    // shell
    const sh = target.statuses && target.statuses.find((s) => s.id === 'shell');
    if (sh && isMag) dmg *= 0.45;
    // prot
    const pr = target.statuses && target.statuses.find((s) => s.id === 'prot');
    if (pr) dmg *= 0.72;
    // atkdown / atkup
    const ad = actor.statuses && actor.statuses.find((s) => s.id === 'atkdown');
    if (ad) dmg *= 0.65;
    const au = actor.statuses && actor.statuses.find((s) => s.id === 'atkup');
    if (au) dmg *= 1.4;
    // crit (phys only)
    if (!isMag && sk.kind !== 'mag' && U.chance(0.06 + (actor.luk || 10) * 0.002)) {
      dmg *= 1.7;
      B.popups.push(makePopup(target, 'CRITICAL', '#ffe066'));
    }
    // variance
    dmg *= 0.9 + Math.random() * 0.2;
    return Math.max(1, Math.floor(dmg));
  }

  function damageUnit(u, dmg, opts) {
    u.hp = Math.max(0, u.hp - dmg);
    if (!u.isEnemy) GM.BatUI.updateParty();
    u.flashT = 240;
    if (!opts || !opts.silent) B.shake = Math.max(B.shake, Math.min(10, dmg / 60));
  }
  function healUnit(u, amt) {
    u.hp = Math.min(u.maxhp, u.hp + amt);
    if (!u.isEnemy) GM.BatUI.updateParty();
  }
  function applyStatus(target, ab) {
    const st = ab.status;
    if (!st || !target) return;
    if (target.isEnemy && st.id === 'prot') target.def = Math.floor(target.def * 1.15);
    const existing = target.statuses.find((s) => s.id === st.id);
    if (existing) existing.turns = Math.max(existing.turns, st.turns || 3);
    else target.statuses.push({ id: st.id, turns: st.turns || 3 });
    if (!target.isEnemy) GM.BatUI.updateParty();
  }
  const STATUS_NAMES = { poison: '毒', paralysis: '麻痺', sleep: '睡眠', haste: '加速', prot: '防御UP', shell: '魔法障壁', focus: '集中', atkup: '攻撃UP', atkdown: '攻撃DOWN' };

  function killUnit(u) {
    u.hp = 0;
    if (!u.isEnemy) {
      GM.BatUI.log(`${u.name} は倒れた……`);
      GM.BatUI.updateParty();
    } else {
      GM.BatUI.log(`${u.name} を倒した！`);
    }
  }

  function elColor(el) {
    switch (el) {
      case 'thunder': return '#ffe066';
      case 'water': return '#62d6ff';
      case 'holy': return '#fff3c4';
      case 'void': return '#c39bff';
      default: return '#ffffff';
    }
  }

  function makePopup(unit, text, color, sub) {
    const pos = unitPos(unit);
    return { x: pos.x, y: pos.y, text: String(text), color, sub, t: 0, vy: -0.045 };
  }
  function unitPos(unit) {
    if (unit.isEnemy) {
      const idx = B.enemies.indexOf(unit);
      const n = B.enemies.length;
      const cx = 110 + (idx - (n - 1) / 2) * 70;
      const cy = 190 - (unit.boss ? 0 : 10);
      return { x: cx, y: cy - 40 };
    }
    const idx = B.party.indexOf(unit);
    return { x: 400, y: 140 + idx * 22 };
  }

  /* ---------------- end ---------------- */
  function endBattle(result) {
    B.active = false;
    $('battle-ui').classList.add('hidden');
    GM.uiOwner = null;
    S.scene = 'field';
    if (result === 'win') {
      let exp = 0, tg = 0;
      B.enemies.forEach((e) => { exp += e.exp; tg += e.tg; });
      const sharers = B.party.filter((m) => m.hp > 0).length || 1;
      GM.AUDIO.playBGM('victory');
      GM.BatUI.log(`勝利！ EXP ${exp} / ${U.fmt(tg)} nTG を獲得！`);
      B.party.forEach((m) => {
        if (m.hp > 0) {
          const leveled = GM.gainExp(m, Math.ceil(exp / sharers));
          if (leveled) { GM.AUDIO.sfx('levelup'); GM.toast(`${m.name} はレベル${m.lv}になった！`); }
        }
      });
      GM.addTG(tg);
      // drop
      B.enemies.forEach((e) => {
        if (e.def.drop && U.chance(0.35)) {
          GM.addItem(e.def.drop, 1);
          GM.toast(`${GM.itemName(e.def.drop)} を手に入れた！`);
        }
      });
      GM.updateHUD();
      B.result = 'win';
      setTimeout(() => {
        GM.AUDIO.playBGM(S.map && S.map.bgm ? S.map.bgm : 'field');
        resolveRun('win');
      }, 1300);
      return;
    }
    if (result === 'flee') {
      B.result = 'flee';
      resolveRun('flee');
      return;
    }
    B.result = 'lose';
    GM.gameOver();
    resolveRun('lose');
  }
  function resolveRun(r) {
    const res = B.resolve;
    B.resolve = null;
    if (res) res(r === 'win');
  }

  /* ---------------- render & update ---------------- */
  B.update = function (dt) {
    B.popups.forEach((p) => { p.t += dt; p.y += p.vy * dt; });
    B.popups = B.popups.filter((p) => p.t < 1100);
    if (B.shake > 0) B.shake = Math.max(0, B.shake - dt * 0.02);
    [...B.party, ...B.enemies].forEach((u) => { if (u.dx) u.dx *= 0.85; if (u.flashT) u.flashT = Math.max(0, u.flashT - dt); });
    B.animT += dt;
  };

  B.render = function (ctx) {
    const shx = B.shake > 0 ? U.rand(-B.shake, B.shake) : 0;
    const shy = B.shake > 0 ? U.rand(-B.shake / 2, B.shake / 2) : 0;
    ctx.save();
    ctx.translate(shx, shy);
    // background
    const grad = ctx.createLinearGradient(0, 0, 0, VH);
    const themes = {
      stone: ['#1a2238', '#0d1224'], metal: ['#141c30', '#0a0e1c'],
      sand: ['#3a3020', '#1a150c'], snow: ['#26344a', '#0e1420'],
      ice: ['#1e3040', '#0a1420'], voidf: ['#12081f', '#05020c'],
      grass: ['#14261a', '#080f0a'], carpet: ['#2a1020', '#12060c']
    };
    const th = themes[B.bg] || themes.stone;
    grad.addColorStop(0, th[0]); grad.addColorStop(1, th[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VW, VH);
    // 遠景の光（地平線グロー）
    const glow = ctx.createRadialGradient(VW / 2, 118, 20, VW / 2, 118, 240);
    glow.addColorStop(0, 'rgba(120,160,255,.14)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, VW, 150);
    // 地平線
    ctx.fillStyle = 'rgba(160,190,255,.10)';
    ctx.fillRect(0, 118, VW, 1);
    // ground grid
    ctx.strokeStyle = 'rgba(120,150,255,.08)';
    for (let x = 0; x < VW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x, VH); ctx.stroke(); }
    for (let y = 120; y < VH; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }
    // プラットフォーム（敵陣・味方陣）
    const plat = (cx, cy, rx, ry, a) => {
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(160,190,255,.14)';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    };
    plat(110 + (B.enemies.length > 1 ? (B.enemies.length - 1) * 30 : 0), 202, 34 + (B.enemies.length > 1 ? (B.enemies.length - 1) * 22 : 0), 12, 0.30);
    plat(408, 226, 62, 14, 0.30);
    // 大気パーティクル
    for (let i = 0; i < 14; i++) {
      const px = ((i * 97 + B.animT * 0.012 * (1 + (i % 3))) % (VW + 20)) - 10;
      const py = 40 + ((i * 53) % 200) + Math.sin(B.animT / 700 + i) * 6;
      ctx.fillStyle = `rgba(180,210,255,${0.05 + (i % 4) * 0.03})`;
      ctx.fillRect(px, py, 2, 2);
    }
    // party (right, back view)
    B.party.forEach((m, i) => {
      if (m.hp <= 0) { ctx.globalAlpha = 0.25; }
      GM.SPRITES.drawShadow(ctx, 408, 176 + i * 30, 11);
      GM.SPRITES.drawChibi(ctx, 402, 148 + i * 30, m.look, 'up', Math.floor(B.animT / 400) % 2 === 0 ? 0 : 1, 1.4);
      ctx.globalAlpha = 1;
    });
    // enemies
    B.enemies.forEach((e) => {
      if (e.hp <= 0) {
        ctx.globalAlpha = Math.max(0, 0.35 - B.animT % 400 / 2000);
      }
      const scale = e.boss ? (e.def.final ? 2.4 : 2.2) : 1.8;
      GM.SPRITES.drawEnemy(ctx, e.spr, 110 + e.slot * 60 + (B.enemies.length > 1 ? (e.slot - (B.enemies.length - 1) / 2) * 10 : 0), 200, scale,
        { flash: e.flashT > 120, dx: (e.dx || 0) });
      ctx.globalAlpha = 1;
    });
    // enemy HP mini bar (bosses)
    B.enemies.forEach((e, i) => {
      if (!e.boss || e.hp <= 0) return;
      const w = 160;
      const x = VW / 2 - w / 2, y = 12;
      ctx.fillStyle = 'rgba(6,10,34,.8)';
      ctx.fillRect(x - 2, y - 2, w + 4, 10);
      ctx.fillStyle = '#1a2140';
      ctx.fillRect(x, y, w, 6);
      ctx.fillStyle = e.def.final ? '#ff7eb6' : '#ff5a5a';
      ctx.fillRect(x, y, w * U.pct(e.hp, e.maxhp), 6);
      ctx.fillStyle = '#cfe0ff';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${e.name}`, VW / 2, y + 16);
    });
    // popups
    B.popups.forEach((p) => {
      ctx.globalAlpha = Math.max(0, 1 - p.t / 1100);
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(p.text, p.x + 1, p.y + 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    });
    ctx.restore();
    // fade
    if (S.fade.a > 0) {
      ctx.fillStyle = `rgba(0,0,0,${S.fade.a})`;
      ctx.fillRect(0, 0, VW, VH);
    }
  };

})(window.GM);
