/* ============================================================
   GAMEMINA CHRONICLE ─ Save System
   キャラ生成 / ステータス再計算 / 3スロット + オートセーブ / 書き出し
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const U = GM.U;

  GM.makeChar = function (id) {
    const def = GM.CHARACTERS[id];
    const lv = 1;
    const m = {
      id, name: def.name, full: def.full, title: def.title, job: def.job,
      look: def.look, accent: def.accent, lv, exp: 0, hp: 0, mp: 0,
      equip: { weapon: def.weapon[0], armor: 'a1', acc: null },
      skills: []
    };
    GM.recalc(m, true);
    m.hp = m.maxhp; m.mp = m.maxmp;
    GM.learnAt(m);
    return m;
  };

  GM.recalc = function (m, full) {
    const def = GM.CHARACTERS[m.id];
    const base = def.base, g = def.growth;
    m.maxhp = GM.statAt(base.hp, g.hp, m.lv);
    m.maxmp = GM.statAt(base.mp, g.mp, m.lv);
    m.atk = GM.statAt(base.atk, g.atk, m.lv);
    m.def = GM.statAt(base.def, g.def, m.lv);
    m.mag = GM.statAt(base.mag, g.mag, m.lv);
    m.mdf = GM.statAt(base.mdf, g.mdf, m.lv);
    m.spd = GM.statAt(base.spd, g.spd, m.lv);
    m.luk = GM.statAt(base.luk, g.luk, m.lv);
    // equipment
    const w = m.equip.weapon && GM.WEAPONS[m.equip.weapon];
    const a = m.equip.armor && GM.ARMORS[m.equip.armor];
    const c = m.equip.acc && GM.ACCS[m.equip.acc];
    [w, a, c].forEach((eq) => {
      if (!eq) return;
      m.atk += eq.atk || 0; m.def += eq.def || 0; m.mag += eq.mag || 0;
      m.mdf += eq.mdf || 0; m.spd += eq.spd || 0;
      if (eq.hp) m.maxhp += eq.hp;
      if (eq.mp) m.maxmp += eq.mp;
    });
    m.hp = full ? m.maxhp : Math.min(m.hp || m.maxhp, m.maxhp);
    m.mp = full ? m.maxmp : Math.min(m.mp || m.maxmp, m.maxmp);
  };

  GM.learnAt = function (m) {
    const table = GM.LEARN[m.id] || [];
    m.skills = table.filter(([lv]) => lv <= m.lv).map(([, ab]) => ab);
  };

  GM.expNeeded = (lv) => GM.expToNext(lv);
  GM.expTotal = function (lv) {
    let t = 0;
    for (let i = 1; i < lv; i++) t += GM.expToNext(i);
    return t;
  };

  GM.gainExp = function (member, amount) {
    member.exp += amount;
    let leveled = false;
    while (member.lv < 50 && member.exp >= GM.expTotal(member.lv + 1)) {
      member.lv++;
      const before = member.maxhp;
      GM.recalc(member);
      member.hp += (member.maxhp - before);
      GM.learnAt(member);
      leveled = true;
    }
    return leveled;
  };

  /* ---------------- serialization ---------------- */
  function snapshot() {
    const s = GM.state;
    return {
      v: 1,
      chapter: s.chapter,
      party: s.party.map((m) => ({
        id: m.id, lv: m.lv, exp: m.exp, hp: m.hp, mp: m.mp,
        equip: { ...m.equip }, skills: [...m.skills]
      })),
      battleParty: s.battleParty.map((m) => m.id),
      items: { ...s.items },
      tg: s.tg,
      flags: { ...s.flags },
      gates: { ...s.gates },
      archive: [...s.archive],
      opened: { ...s.opened },
      killed: { ...s.killed },
      loc: { map: s.mapId, x: s.player.x, y: s.player.y, dir: s.player.dir }
    };
  }
  function restore(data) {
    const s = GM.state;
    s.chapter = data.chapter || 0;
    s.party = data.party.map((p) => {
      const m = GM.makeChar(p.id);
      m.lv = p.lv; m.exp = p.exp;
      m.equip = { ...p.equip };
      GM.recalc(m);
      m.hp = Math.min(p.hp, m.maxhp); m.mp = Math.min(p.mp, m.maxmp);
      m.skills = [...p.skills];
      return m;
    });
    s.battleParty = data.battleParty.map((id) => s.party.find((m) => m.id === id)).filter(Boolean);
    if (!s.battleParty.length) s.battleParty = s.party.slice(0, Math.min(4, s.party.length));
    s.items = { ...data.items };
    s.tg = data.tg;
    s.flags = { ...data.flags };
    s.gates = { ...data.gates };
    s.archive = [...data.archive];
    s.opened = { ...data.opened };
    s.killed = { ...data.killed };
    s.loc = { ...data.loc };
  }

  const SAVE_KEY = 'gm_save_';
  GM.saveTo = function (slot) {
    const data = snapshot();
    const meta = {
      ts: Date.now(),
      chapter: data.chapter,
      lv: data.party[0] ? data.party[0].lv : 1,
      map: data.loc.map,
      tg: data.tg
    };
    try {
      localStorage.setItem(SAVE_KEY + slot, JSON.stringify({ meta, data }));
      return true;
    } catch (e) { return false; }
  };
  GM.loadFrom = function (slot) {
    try {
      const raw = localStorage.getItem(SAVE_KEY + slot);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj;
    } catch (e) { return null; }
  };
  GM.saveMeta = function (slot) {
    const obj = GM.loadFrom(slot);
    return obj ? obj.meta : null;
  };

  GM.saveGame = function (slot) {
    const ok = GM.saveTo(slot);
    if (ok) { GM.AUDIO.sfx('save'); GM.toast(slot === 'auto' ? 'オートセーブ完了！' : `セーブしました（スロット${slot}）`); }
    else GM.toast('セーブに失敗しました', true);
    return ok;
  };
  GM.loadGame = function (slot) {
    const obj = GM.loadFrom(slot);
    if (!obj) return false;
    restore(obj.data);
    return true;
  };

  GM.exportSave = function () {
    const json = JSON.stringify(snapshot());
    return btoa(unescape(encodeURIComponent(json)));
  };
  GM.importSave = function (code) {
    try {
      const json = decodeURIComponent(escape(atob(code.trim())));
      restore(JSON.parse(json));
      return true;
    } catch (e) { return false; }
  };

})(window.GM);
