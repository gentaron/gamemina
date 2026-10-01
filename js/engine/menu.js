/* ============================================================
   GAMEMINA CHRONICLE ─ Menu System
   パーティ / ステータス / 装備 / アイテム / アルカイブ / セーブ / 設定
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const U = GM.U, $ = GM.$, el = GM.el, esc = GM.esc;
  const S = GM.state;

  const TABS = ['アイテム', 'スキル', '装備', 'ステータス', 'パーティ', 'アルカイブ', 'キャラ図鑑', 'セーブ', '設定'];
  let tabIdx = 0, memberIdx = 0, mode = 'tabs'; // tabs | member | list
  let listRows = [], listIdx = 0;
  let onSaveDone = null;

  function open() {
    if (S.scene !== 'field') return;
    GM.uiOwner = 'menu';
    mode = 'tabs'; tabIdx = 0; memberIdx = 0;
    GM.AUDIO.sfx('open');
    render();
    navLoop();
  }
  function close() {
    GM.AUDIO.sfx('cancel');
    $('menu').classList.add('hidden');
    GM.uiOwner = null;
  }
  GM.Menu = { open, close };

  /* ---------------- render ---------------- */
  function render() {
    const box = $('menu');
    box.innerHTML = '';
    box.classList.remove('hidden');

    /* tab list */
    const colL = el('div', 'menu-col');
    const winTabs = el('div', 'win');
    winTabs.id = 'menu-list';
    winTabs.appendChild(el('div', 'menu-title', 'MENU'));
    TABS.forEach((t, i) => {
      const row = el('div', 'mrow' + (i === tabIdx ? ' sel' : ''), esc(t));
      row.addEventListener('click', () => { tabIdx = i; mode = 'tabs'; render(); activateTab(); });
      winTabs.appendChild(row);
    });
    colL.appendChild(winTabs);
    const winGold = el('div', 'win');
    winGold.innerHTML = `<div class="menu-title">所持金</div><div style="font-size:12px">${U.fmt(S.tg)} <span style="font-size:9px;color:var(--ink-dim)">nTG</span></div>`;
    colL.appendChild(winGold);
    box.appendChild(colL);

    /* party strip */
    const colM = el('div', 'menu-col');
    const winP = el('div', 'win');
    winP.id = 'menu-party';
    winP.appendChild(el('div', 'menu-title', 'PARTY'));
    const order = S.battleParty.length ? S.battleParty : S.party.slice(0, 4);
    order.forEach((m, i) => {
      const row = el('div', 'pmrow' + (i === memberIdx ? ' sel' : ''));
      const purl = GM.Portraits ? GM.Portraits.url(m.id) : null;
      const thumb = purl ? `<img class="pthumb" src="${purl}" alt="" loading="lazy" onerror="this.style.display='none'">` : '';
      row.innerHTML = `${thumb}<span class="pcol"><span class="pline"><span>${esc(m.name)}</span><span>Lv${m.lv}</span></span>
        <div class="hpmini"><i style="width:${U.pct(m.hp, m.maxhp) * 100}%"></i></div>
        <div class="mpmini"><i style="width:${U.pct(m.mp, m.maxmp) * 100}%"></i></div></span>`;
      winP.appendChild(row);
    });
    winP.innerHTML += `<div class="sys-note">C: メニューを閉じる</div>`;
    colM.appendChild(winP);
    box.appendChild(colM);

    /* detail */
    const detail = el('div', 'win');
    detail.id = 'menu-detail';
    renderTab(detail);
    box.appendChild(detail);
  }

  function renderTab(detail) {
    const order = S.battleParty.length ? S.battleParty : S.party.slice(0, 4);
    const m = order[memberIdx] || order[0];
    listRows = [];
    switch (TABS[tabIdx]) {
      case 'アイテム': {
        detail.appendChild(el('div', 'menu-title', 'ITEMS'));
        const ids = Object.keys(S.items).filter((id) => GM.ITEMS[id]);
        if (!ids.length) detail.appendChild(el('div', 'sys-note', '持ち物がない。ショップで買おう。'));
        ids.forEach((id) => {
          const it = GM.ITEMS[id];
          const row = el('div', 'mrow', `<span>${esc(it.name)} ×${S.items[id]}</span><span style="color:var(--ink-dim);font-size:8px">${esc(it.desc || '')}</span>`);
          row.addEventListener('click', () => useItemField(id));
          detail.appendChild(row);
        });
        break;
      }
      case 'スキル': {
        detail.appendChild(el('div', 'menu-title', `SKILLS ─ ${m.name}`));
        (m.skills || []).forEach((id) => {
          const ab = GM.ABILITIES[id];
          if (!ab) return;
          detail.appendChild(el('div', 'skill-row',
            `${esc(ab.name)} <span style="color:var(--cyan)">MP${ab.mp}</span> ─ ${esc(ab.desc || '')}`));
        });
        break;
      }
      case '装備': {
        detail.appendChild(el('div', 'menu-title', `EQUIP ─ ${m.name}`));
        ['weapon', 'armor', 'acc'].forEach((slot) => {
          const label = { weapon: '武器', armor: '防具', acc: '装飾' }[slot];
          const cur = m.equip[slot];
          const curName = cur ? GM.itemName(cur) : '─';
          const row = el('div', 'equip-row', `<span style="color:var(--gold);width:34px">${label}</span><b>${esc(curName)}</b>`);
          detail.appendChild(row);
        });
        detail.appendChild(el('div', 'sys-note', '▼ 所持装備（タップで装替）'));
        ['weapon', 'armor', 'acc'].forEach((slot) => {
          Object.keys(S.items).forEach((id) => {
            const isW = slot === 'weapon' && GM.WEAPONS[id] && GM.WEAPONS[id].char === m.id;
            const isA = slot === 'armor' && GM.ARMORS[id];
            const isC = slot === 'acc' && GM.ACCS[id];
            if (!(isW || isA || isC)) return;
            const row = el('div', 'mrow', `<span>→ ${esc(GM.itemName(id))}</span>`);
            row.addEventListener('click', () => {
              const prev = m.equip[slot];
              if (prev) GM.addItem(prev, 1);
              m.equip[slot] = id;
              GM.addItem(id, -1);
              GM.recalc(m);
              GM.AUDIO.sfx('confirm');
              GM.toast(`${m.name} は ${GM.itemName(id)} を装備した`);
              render();
            });
            detail.appendChild(row);
          });
        });
        break;
      }
      case 'ステータス': {
        const purl = GM.Portraits ? GM.Portraits.url(m.id) : null;
        const head = el('div', 'stat-head');
        head.innerHTML = `
          <div class="stat-port">${purl ? `<img src="${purl}" alt="" onerror="this.parentNode.classList.add('noimg')">` : ''}</div>
          <div class="stat-id">
            <div class="mname">${esc(m.name)}</div>
            <div class="mjob">${esc(m.title)} ─ ${esc(m.job)}</div>
            <div class="mlv">Lv ${m.lv}</div>
          </div>`;
        detail.appendChild(head);
        detail.appendChild(el('div', 'sys-note', `${esc(m.full)}　EXP ${U.fmt(m.exp)} / 次 ${U.fmt(Math.max(0, GM.expTotal(m.lv + 1) - m.exp))}`));
        const grid = el('div', 'mstat-grid');
        [['HP', `${m.hp}/${m.maxhp}`], ['MP', `${m.mp}/${m.maxmp}`],
          ['攻撃', m.atk], ['防御', m.def], ['魔力', m.mag], ['魔防', m.mdf],
          ['素早さ', m.spd], ['運', m.luk]].forEach(([k, v]) => {
          grid.appendChild(el('div', 'k', k));
          grid.appendChild(el('div', 'v', String(v)));
        });
        detail.appendChild(grid);
        detail.appendChild(el('div', 'sys-note', '※ E16世界の戦力測定上限はLv1000。冒険者ギルド規格ではこの数値で計測される。'));
        break;
      }
      case 'パーティ': {
        detail.appendChild(el('div', 'menu-title', 'PARTY ORDER'));
        S.party.forEach((p, i) => {
          const inBattle = S.battleParty.includes(p);
          const row = el('div', 'mrow' + (inBattle ? '' : ' dis'),
            `<span>${esc(p.name)} Lv${p.lv}</span><span style="font-size:8px">${inBattle ? '出撃中' : '控え'}</span>`);
          row.addEventListener('click', () => {
            if (S.battleParty.includes(p)) {
              if (S.battleParty.length <= 1) return;
              S.battleParty = S.battleParty.filter((x) => x !== p);
            } else if (S.battleParty.length < 4) {
              S.battleParty.push(p);
            }
            GM.AUDIO.sfx('confirm');
            render();
          });
          detail.appendChild(row);
        });
        detail.appendChild(el('div', 'sys-note', '最大4人まで出撃。タップで出撃/控えを切替。'));
        break;
      }
      case 'アルカイブ': {
        renderArchive(detail);
        break;
      }
      case 'キャラ図鑑': {
        renderCast(detail);
        break;
      }
      case 'セーブ': {
        detail.appendChild(el('div', 'menu-title', 'SAVE / LOAD'));
        GM.SaveDialog.renderInto(detail, null);
        break;
      }
      case '設定': {
        detail.appendChild(el('div', 'menu-title', 'OPTIONS'));
        const mk = (label, kind) => {
          const row = el('div', 'range-row');
          row.innerHTML = `<span style="width:44px">${label}</span><input type="range" min="0" max="100" value="${Math.round(GM.AUDIO.settings[kind] * 100)}">`;
          row.querySelector('input').addEventListener('input', (e) => {
            GM.AUDIO.setVolume(kind, Number(e.target.value) / 100);
          });
          detail.appendChild(row);
        };
        mk('BGM', 'bgm'); mk('SFX', 'sfx');
        const chk = el('div', 'mrow', `<span>サウンド</span><span>${GM.AUDIO.settings.enabled ? 'ON' : 'OFF'}</span>`);
        chk.addEventListener('click', () => {
          GM.AUDIO.setEnabled(!GM.AUDIO.settings.enabled);
          render();
        });
        detail.appendChild(chk);
        const exp = el('div', 'sys-note',
          'GAMEMINA CHRONICLE ─ Eternal Dominion Universe をなぞるRPG。\nセーブデータは端末内（localStorage）に保存されます。\n「書き出し」でコード化してバックアップできます。');
        detail.appendChild(exp);
        const exrow = el('div', 'mrow', '<span>セーブデータ書き出し</span>');
        exrow.addEventListener('click', () => {
          const code = GM.exportSave();
          navigator.clipboard && navigator.clipboard.writeText(code).then(
            () => GM.toast('セーブコードをコピーした！'),
            () => GM.toast('コピー失敗', true));
          console.log('[GAMEMINA save code]', code);
        });
        detail.appendChild(exrow);
        const imrow = el('div', 'mrow', '<span>セーブデータ読み込み（コード）</span>');
        imrow.addEventListener('click', async () => {
          const code = prompt('セーブコードを貼り付けてください:');
          if (!code) return;
          if (GM.importSave(code)) { GM.toast('セーブデータを復元した！'); render(); }
          else GM.toast('コードが不正です', true);
        });
        detail.appendChild(imrow);
        break;
      }
    }
  }

  function renderArchive(detail) {
    detail.appendChild(el('div', 'menu-title', 'ARCHIVE ─ 歴史の記録'));
    GM.ARCHIVE.forEach((a) => {
      const unlocked = S.archive.includes(a.id);
      if (!unlocked) {
        detail.appendChild(el('div', 'arch-row locked', `🔒 ── 未記録 ──`));
      } else {
        const row = el('div', 'arch-row');
        row.innerHTML = `<b style="color:var(--gold)">${esc(a.title)}</b>`;
        const body = el('div', 'arch-body', esc(a.text));
        row.addEventListener('click', () => {
          if (body.style.display === 'none') body.style.display = 'block';
          else body.style.display = 'none';
        });
        detail.appendChild(row);
        detail.appendChild(body);
      }
    });
    const got = S.archive.length;
    detail.appendChild(el('div', 'sys-note', `記録 ${got}/${GM.ARCHIVE.length} ─ 歴史をなぞるほど、世界の記憶が集まる。`));
  }

  /* ---- キャラ図鑑: gentaron/image リポジトリのURL索引ギャラリー ---- */
  function renderCast(detail) {
    const P = GM.Portraits;
    detail.appendChild(el('div', 'menu-title', 'CAST ─ キャラ図鑑'));
    detail.appendChild(el('div', 'sys-note', `Eternal Dominion Universe の登場人物 ${P.INDEX.length}人 ─ イラストは gentaron/image からURL索引`));
    const grid = el('div', 'cast-grid');
    // パーティメンバーを先頭に
    const files = [];
    Object.keys(P.CHARS).forEach((k) => { if (!files.includes(P.CHARS[k])) files.push(P.CHARS[k]); });
    P.INDEX.forEach((f) => { if (!files.includes(f)) files.push(f); });
    files.forEach((f) => {
      const card = el('div', 'cast-card');
      const label = P.labelOf(f);
      const known = Object.keys(P.LABELS).some((k) => P.LABELS[k] === label);
      card.innerHTML = `
        <img src="${P.BASE}${f}.png" alt="${esc(label)}" loading="lazy"
             onerror="this.parentNode.classList.add('err')">
        <span class="cast-name${known ? ' known' : ''}">${esc(label)}</span>`;
      grid.appendChild(card);
    });
    detail.appendChild(grid);
  }

  GM.Menu.showArchiveOnly = function () {
    return new Promise((res) => {
      const box = $('menu');
      box.innerHTML = '';
      box.classList.remove('hidden');
      const detail = el('div', 'win');
      detail.id = 'menu-detail';
      detail.style.margin = '0 auto';
      renderArchive(detail);
      box.appendChild(detail);
      const closeRow = el('div', 'sys-btn', '閉じる');
      closeRow.style.marginTop = '8px';
      closeRow.addEventListener('click', () => { box.classList.add('hidden'); res(); });
      detail.appendChild(closeRow);
    });
  };

  function useItemField(id) {
    const it = GM.ITEMS[id];
    if (!it) return;
    const order = S.battleParty.length ? S.battleParty : S.party;
    const m = order[memberIdx] || order[0];
    if (it.type === 'heal') {
      if (m.hp >= m.maxhp) { GM.toast('HPは満タンだ'); return; }
      GM.addItem(id, -1);
      m.hp = Math.min(m.maxhp, m.hp + (it.val >= 9999 ? m.maxhp : it.val));
      if (it.mp) m.mp = Math.min(m.maxmp, m.mp + it.mp);
      GM.AUDIO.sfx('heal');
      GM.toast(`${m.name} のHPが回復した！`);
    } else if (it.type === 'mp') {
      if (m.mp >= m.maxmp) { GM.toast('MPは満タンだ'); return; }
      GM.addItem(id, -1);
      m.mp = Math.min(m.maxmp, m.mp + it.val);
      GM.AUDIO.sfx('heal');
      GM.toast(`${m.name} のMPが回復した！`);
    } else if (it.type === 'cure') {
      GM.addItem(id, -1);
      m.statuses = [];
      GM.AUDIO.sfx('heal');
      GM.toast(`${m.name} の状態を洗浄した！`);
    } else if (it.type === 'revive') {
      if (m.hp > 0) { GM.toast('戦闘可能な相手には使えない'); return; }
      GM.addItem(id, -1);
      m.hp = Math.floor(m.maxhp * (it.val || 0.5));
      GM.AUDIO.sfx('revive');
      GM.toast(`${m.name} は復帰した！`);
    } else {
      GM.toast('ここでは使えない');
      return;
    }
    render();
  }

  /* ---------------- keyboard nav ---------------- */
  function activateTab() { render(); }
  function navLoop() {
    if (GM.uiOwner !== 'menu') return;
    const b = GM.Input.consume();
    if (b) {
      if (b === 'b' || b === 'menu') { close(); return; }
      if (mode === 'tabs') {
        if (b === 'up') { tabIdx = (tabIdx + TABS.length - 1) % TABS.length; GM.AUDIO.sfx('cursor'); render(); }
        else if (b === 'down') { tabIdx = (tabIdx + 1) % TABS.length; GM.AUDIO.sfx('cursor'); render(); }
        else if (b === 'a') { GM.AUDIO.sfx('confirm'); }
        else if (b === 'left') { memberIdx = (memberIdx + 3) % 4; GM.AUDIO.sfx('cursor'); render(); }
        else if (b === 'right') { memberIdx = (memberIdx + 1) % 4; GM.AUDIO.sfx('cursor'); render(); }
      }
    }
    requestAnimationFrame(navLoop);
  }

  /* ---------------- save dialog ---------------- */
  GM.SaveDialog = {
    show(mode) {
      return new Promise((res) => {
        const box = $('system-ui');
        box.innerHTML = '';
        box.classList.remove('hidden');
        const win = el('div', 'win');
        this.renderInto(win, (slot) => {
          box.classList.add('hidden');
          res(slot);
        }, mode);
        box.appendChild(win);
      });
    },
    renderInto(container, cb, mode) {
      container.innerHTML = '';
      container.appendChild(el('div', 'menu-title', mode === 'load' ? 'LOAD ─ ロード' : 'SAVE ─ セーブ先を選ぶ'));
      const slots = ['auto', '1', '2', '3'];
      slots.forEach((slot) => {
        const meta = GM.saveMeta(slot);
        const label = slot === 'auto' ? 'AUTO' : `SLOT ${slot}`;
        const info = meta
          ? `${label} ─ 第${meta.chapter}章 / Lv${meta.lv} / ${U.fmt(meta.tg)}nTG / ${new Date(meta.ts).toLocaleString('ja-JP')}`
          : `${label} ─ ─ 空 ─`;
        const row = el('div', 'slot-row', `<span>${esc(info)}</span>`);
        row.addEventListener('click', () => { if (cb) cb(slot); });
        container.appendChild(row);
      });
      if (mode === 'load') {
        const note = el('div', 'sys-note', 'AUTO は章クリア時の自動セーブです。');
        container.appendChild(note);
      }
      if (cb) {
        const actions = el('div', 'sys-actions');
        const cancel = el('div', 'sys-btn', 'キャンセル');
        cancel.addEventListener('click', () => cb(null));
        actions.appendChild(cancel);
        container.appendChild(actions);
      }
    }
  };

})(window.GM);
