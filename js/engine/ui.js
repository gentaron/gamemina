/* ============================================================
   GAMEMINA CHRONICLE ─ UI Layer (DOM)
   会話ウィンドウ / 選択肢 / HUD / バトルUIのDOM部分 / ショップ
   ============================================================ */
'use strict';
window.GM = window.GM || {};
(function (GM) {
  const $ = GM.$, el = GM.el, esc = GM.esc, U = GM.U;

  /* ---------------- Dialogue ---------------- */
  const Dlg = {
    el: null, nameEl: null, textEl: null, nextEl: null,
    queue: [], typing: false, full: '', idx: 0, timer: null, resolve: null,
    init() {
      this.el = $('dialogue'); this.nameEl = $('dlg-name');
      this.textEl = $('dlg-text'); this.nextEl = $('dlg-next');
    },
    show(name, text, accent) {
      return new Promise((res) => {
        this.el.classList.remove('hidden');
        if (name) {
          this.nameEl.textContent = name;
          this.nameEl.classList.remove('hidden');
        } else this.nameEl.classList.add('hidden');
        this.full = text;
        this.textEl.innerHTML = '';
        this.nextEl.classList.add('hidden');
        this.typing = true; this.idx = 0;
        this.resolve = res;
        clearInterval(this.timer);
        this.timer = setInterval(() => this._typeStep(accent), 18);
      });
    },
    _typeStep(accent) {
      if (this.idx >= this.full.length) {
        clearInterval(this.timer);
        this.typing = false;
        this.nextEl.classList.remove('hidden');
        return;
      }
      this.idx = Math.min(this.full.length, this.idx + 2);
      const shown = esc(this.full.slice(0, this.idx));
      this.textEl.innerHTML = accent ? `<span class="${accent}">${shown}</span>` : shown;
    },
    tap() {
      if (this.typing) {
        this.idx = this.full.length; // 全表示
        return false;
      }
      return true; // 次へ
    },
    hide() { this.el.classList.add('hidden'); clearInterval(this.timer); }
  };
  GM.Dlg = Dlg;

  /* 会話を進める共通ハンドラ（script runner から呼ばれる） */
  GM.dialogueAdvance = function () {
    if (!Dlg.resolve) return false;
    const done = Dlg.tap();
    if (done) {
      const r = Dlg.resolve;
      Dlg.resolve = null;
      r();
    }
    return true;
  };
  GM.dialogueOpen = () => !!Dlg.resolve;

  /* ---------------- Choice ---------------- */
  const Choice = {
    show(options, defIdx) {
      return new Promise((res) => {
        const box = $('choice');
        box.innerHTML = '';
        let idx = defIdx || 0;
        options.forEach((o, i) => {
          const row = el('div', 'opt' + (i === idx ? ' sel' : ''), esc(o.text));
          row.addEventListener('click', () => { GM.AUDIO.sfx('confirm'); box.classList.add('hidden'); res(i); });
          box.appendChild(row);
        });
        box.classList.remove('hidden');
        const update = () => {
          [...box.children].forEach((c, i) => c.classList.toggle('sel', i === idx));
        };
        const handler = () => {
          const b = GM.Input.consume();
          if (!b) return requestAnimationFrame(handler);
          if (b === 'up' || b === 'left') { idx = (idx + options.length - 1) % options.length; GM.AUDIO.sfx('cursor'); update(); }
          else if (b === 'down' || b === 'right') { idx = (idx + 1) % options.length; GM.AUDIO.sfx('cursor'); update(); }
          else if (b === 'a') { GM.AUDIO.sfx('confirm'); box.classList.add('hidden'); res(idx); }
          else requestAnimationFrame(handler);
        };
        requestAnimationFrame(handler);
      });
    }
  };
  GM.Choice = Choice;

  /* ---------------- HUD ---------------- */
  GM.updateHUD = function () {
    const s = GM.state;
    const ch = s.map ? s.map.name : '';
    $('hud-chapter').textContent = ch;
    $('hud-token').textContent = U.fmt(s.tg) + ' nTG';
  };

  /* ---------------- Battle UI (DOM) ---------------- */
  const BatUI = {
    _navToken: 0,
    buildParty() {
      const box = $('bat-party');
      box.innerHTML = '';
      GM.state.battleParty.forEach((m, i) => {
        const row = el('div', 'bmember');
        row.id = 'bm-' + i;
        row.innerHTML = `
          <span class="nm">${esc(m.name)}</span>
          <span class="bbar bhp"><i></i></span>
          <span class="val hp"></span>
          <span class="val lv">Lv${m.lv}</span>`;
        box.appendChild(row);
      });
      this.updateParty();
    },
    updateParty() {
      GM.state.battleParty.forEach((m, i) => {
        const row = $('bm-' + i);
        if (!row) return;
        row.classList.toggle('dead', m.hp <= 0);
        const hpbar = row.querySelector('.bhp i');
        hpbar.style.width = Math.max(0, U.pct(m.hp, m.maxhp) * 100) + '%';
        hpbar.parentElement.classList.toggle('hp-crit', m.hp / m.maxhp < 0.25);
        row.querySelector('.val.hp').textContent = m.hp + '/' + m.maxhp;
      });
    },
    setActive(idx) {
      GM.state.battleParty.forEach((_, i) => {
        const row = $('bm-' + i);
        if (row) row.classList.toggle('active', i === idx);
      });
    },
    log(text) { $('bat-log').textContent = text; },
    showPanel(id) {
      ['bat-cmd', 'bat-abil', 'bat-item', 'bat-target'].forEach((p) => $(p).classList.add('hidden'));
      if (id) $(id).classList.remove('hidden');
    },
    fillCmd(handlers) {
      const token = ++this._navToken;
      const box = $('bat-cmd');
      box.innerHTML = '';
      const items = ['たたかう', 'アビリティ', 'アイテム', 'ぼうぎょ', 'にげる'];
      items.forEach((label, i) => {
        const row = el('div', 'crow' + (i === 0 ? ' sel' : ''), esc(label));
        row.addEventListener('click', () => { this._navToken++; handlers.click(i); });
        box.appendChild(row);
      });
      this._nav(box, token, handlers);
      this.showPanel('bat-cmd');
    },
    fillList(rows, handlers, defIdx) {
      const token = ++this._navToken;
      const box = typeof handlers.box === 'string' ? $(handlers.box) : handlers.box;
      box.innerHTML = '';
      let idx = defIdx || 0;
      rows.forEach((r, i) => {
        const row = el('div', 'crow' + (r.dis ? ' dis' : '') + (i === idx ? ' sel' : ''),
          `<span>${esc(r.label)}</span><span class="${r.rightCls || 'mp'}">${esc(r.right || '')}</span>`);
        row.addEventListener('click', () => { if (!r.dis) { this._navToken++; handlers.click(i); } });
        box.appendChild(row);
      });
      const update = () => {
        [...box.children].forEach((c, i) => {
          c.classList.toggle('sel', i === idx);
          c.classList.toggle('dis', !!(rows[i] && rows[i].dis));
        });
        const sel = box.children[idx];
        if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
      };
      update();
      const nav = () => {
        if (token !== this._navToken) return; // 無効化済み
        const b = GM.Input.consume();
        if (!b) return requestAnimationFrame(nav);
        if (b === 'up') { idx = (idx + rows.length - 1) % rows.length; GM.AUDIO.sfx('cursor'); update(); }
        else if (b === 'down') { idx = (idx + 1) % rows.length; GM.AUDIO.sfx('cursor'); update(); }
        else if (b === 'a') {
          if (rows[idx] && rows[idx].dis) { GM.AUDIO.sfx('cancel'); }
          else { GM.AUDIO.sfx('confirm'); this._navToken++; handlers.click(idx); return; }
        }
        else if (b === 'b') { GM.AUDIO.sfx('cancel'); this._navToken++; handlers.cancel(); return; }
        requestAnimationFrame(nav);
      };
      requestAnimationFrame(nav);
      this.showPanel(handlers.box);
    },
    _nav(box, token, handlers) {
      let idx = 0;
      const n = box.children.length;
      const update = () => [...box.children].forEach((c, i) => c.classList.toggle('sel', i === idx));
      const nav = () => {
        if (token !== this._navToken) return;
        const b = GM.Input.consume();
        if (!b) return requestAnimationFrame(nav);
        if (b === 'up') { idx = (idx + n - 1) % n; GM.AUDIO.sfx('cursor'); update(); }
        else if (b === 'down') { idx = (idx + 1) % n; GM.AUDIO.sfx('cursor'); update(); }
        else if (b === 'a') { GM.AUDIO.sfx('confirm'); this._navToken++; handlers.click(idx); return; }
        else requestAnimationFrame(nav);
      };
      requestAnimationFrame(nav);
    },
    hideAll() { this.showPanel(null); }
  };
  GM.BatUI = BatUI;

  /* ---------------- Shop ---------------- */
  GM.openShop = function (shopLevel) {
    return new Promise((res) => {
      let closed = false;
      const finish = () => { if (!closed) { closed = true; box.classList.add('hidden'); res(); } };
      const stock = [];
      const maxLvl = shopLevel;
      for (let l = 0; l <= Math.min(9, maxLvl); l++) {
        (GM.SHOPS[l] || []).forEach((id) => { if (!stock.includes(id)) stock.push(id); });
      }
      const box = $('shop');
      const state = GM.state;
      let mode = 'buy';
      let idx = 0;
      let rows = [];
      const render = () => {
        box.innerHTML = '';
        const win = el('div', 'win');
        const head = el('div', 'shop-head',
          `<span>${mode === 'buy' ? 'SHOP ─ 購入' : 'SHOP ─ 売却'}</span><span>${U.fmt(state.tg)} nTG</span>`);
        win.appendChild(head);
        rows = [];
        if (mode === 'buy') {
          stock.forEach((id) => {
            const item = GM.ITEMS[id] || GM.WEAPONS[id] || GM.ARMORS[id] || GM.ACCS[id];
            if (!item || !item.price) return;
            rows.push({ id, label: item.name, price: item.price, type: 'buy' });
          });
        } else {
          Object.keys(state.items).forEach((id) => {
            const item = GM.ITEMS[id];
            if (item && item.price) rows.push({ id, label: `${item.name} ×${state.items[id]}`, price: Math.floor(item.price / 2), type: 'sell' });
          });
          ['weapon', 'armor', 'acc'].forEach((slot) => {
            state.party.forEach((m) => {
              const eq = m.equip[slot];
              if (!eq) return;
              const def = GM.WEAPONS[eq] || GM.ARMORS[eq] || GM.ACCS[eq];
              if (def && def.price) rows.push({ id: eq, label: `${def.name}（${m.name}の装備）`, price: Math.floor(def.price / 2), type: 'sell', equipped: true, member: m });
            });
          });
        }
        rows.forEach((r, i) => {
          const row = el('div', 'crow' + (i === idx ? ' sel' : ''),
            `<span>${esc(r.label)}</span><span class="qty">${U.fmt(r.price)} nTG</span>`);
          row.addEventListener('click', () => { idx = i; act(); });
          win.appendChild(row);
        });
        const hint = el('div', 'sys-note', 'A: 決定 / B: モード切替 / タップ可');
        win.appendChild(hint);
        const closeBtn = el('div', 'sys-btn', '店を出る');
        closeBtn.addEventListener('click', () => { GM.AUDIO.sfx('cancel'); finish(); });
        win.appendChild(closeBtn);
        box.appendChild(win);
        box.classList.remove('hidden');
      };
      const act = () => {
        const r = rows[idx];
        if (!r) return;
        if (r.type === 'buy') {
          if (state.tg >= r.price) {
            state.tg -= r.price;
            GM.addItem(r.id, 1);
            GM.AUDIO.sfx('coin');
            GM.toast(`${GM.itemName(r.id)} を購入した！`);
          } else { GM.AUDIO.sfx('cancel'); GM.toast('nトークンが足りない！', true); }
        } else {
          if (r.equipped) {
            if (r.member.equip.weapon === r.id) r.member.equip.weapon = null;
            if (r.member.equip.armor === r.id) r.member.equip.armor = null;
            if (r.member.equip.acc === r.id) r.member.equip.acc = null;
            GM.recalc(r.member);
          }
          GM.addItem(r.id, -1);
          state.tg += r.price;
          GM.AUDIO.sfx('coin');
          GM.toast(`${GM.itemName(r.id)} を売却した`);
        }
        GM.updateHUD();
        render();
      };
      render();
      const nav = () => {
        if (closed) return;
        const b = GM.Input.consume();
        if (b === 'up') { idx = (idx + rows.length - 1) % Math.max(1, rows.length); GM.AUDIO.sfx('cursor'); render(); }
        else if (b === 'down') { idx = (idx + 1) % Math.max(1, rows.length); GM.AUDIO.sfx('cursor'); render(); }
        else if (b === 'a') { act(); }
        else if (b === 'b') {
          GM.AUDIO.sfx('cancel');
          if (mode === 'buy') { mode = 'sell'; idx = 0; render(); }
          else { finish(); return; }
        }
        requestAnimationFrame(nav);
      };
      requestAnimationFrame(nav);
    });
  };

})(window.GM);
