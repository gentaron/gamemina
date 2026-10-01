/* ============================================================
   GAMEMINA CHRONICLE ─ 内蔵 QA コンソール (ブラウザ)
   ============================================================
   - index.html から常にロード（小容量・DOM 非構築は開くまでゼロ）
   - 開き方:
       * URL に ?test=1      → 起動直後に自動オープン
       * main.js からの呼び出し GM.QA.openConsole()
       * コンソール: GM.QA.openConsole()
   - 全スイート（UI 結合テスト含む）を実行し results を描画
   ============================================================ */
'use strict';
(function (GM) {
  if (!GM || !GM.QA) return;

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  let built = null;

  function build() {
    if (built) return built;
    const wrap = el('div', 'qa-console');
    wrap.id = 'qa-console';
    wrap.innerHTML = `
      <div class="qa-head">
        <div class="qa-title">GAMEMINA QA CONSOLE <span class="qa-ver"></span></div>
        <div class="qa-actions">
          <button class="qa-btn" data-act="run">▶ 全テスト実行</button>
          <button class="qa-btn" data-act="close">✕ 閉じる</button>
        </div>
      </div>
      <div class="qa-summary"></div>
      <div class="qa-body"></div>
      <div class="qa-foot">実行環境: <span class="qa-env"></span> ─ 内蔵テスト環境 v1 (boot ?test=1 / test.html)</div>`;
    wrap.querySelector('[data-act="run"]').addEventListener('click', () => open(true));
    wrap.querySelector('[data-act="close"]').addEventListener('click', close);
    document.body.appendChild(wrap);
    built = wrap;
    return wrap;
  }

  function open(autoRun) {
    const wrap = build();
    wrap.classList.add('open');
    wrap.querySelector('.qa-ver').textContent = 'v' + (GM.QA.VERSION || '1');
    wrap.querySelector('.qa-env').textContent = navigator.userAgent.slice(0, 80);
    if (autoRun) run();
  }
  function close() { if (built) built.classList.remove('open'); }

  async function run() {
    const wrap = build();
    const body = wrap.querySelector('.qa-body');
    const summary = wrap.querySelector('.qa-summary');
    body.innerHTML = '<div class="qa-running">⏳ テスト実行中……（ネットワーク検証を含むため数秒かかることがあります）</div>';
    summary.innerHTML = '';
    const report = await GM.QA.runAll({});
    // summary
    const s = report.summary;
    const cls = s.fail ? 'red' : 'green';
    summary.innerHTML = `
      <div class="qa-badge ${cls}">${s.fail ? '⛔ FAILURES DETECTED' : '✨ ALL TESTS PASSED'}</div>
      <div class="qa-counts">${s.pass} pass / <b class="red">${s.fail} fail</b> / ${s.warn} warn / ${s.skipped} skip ─ ${report.totalMs.toFixed(0)}ms</div>`;
    // suites
    body.innerHTML = '';
    report.suites.forEach((su) => {
      const icon = su.fail ? '✗' : (su.warn ? '△' : '✓');
      const box = el('div', 'qa-suite' + (su.fail ? ' bad' : ''));
      box.appendChild(el('div', 'qa-suite-head',
        `<span class="qa-ic ${su.fail ? 'red' : (su.warn ? 'amber' : 'green')}">${icon}</span> ${GM.esc(su.name)}` +
        `<span class="qa-suite-meta">${su.pass}✓ ${su.fail}✗ ${su.warn}△ ${su.ms.toFixed(0)}ms</span>`));
      const list = el('div', 'qa-list');
      su.results.forEach((r) => {
        const row = el('div', 'qa-row ' + r.status);
        if (r.status === 'pass') row.innerHTML = `<span class="qa-ic green">✓</span><span>${GM.esc(r.name)}</span>`;
        else if (r.status === 'skip') row.innerHTML = `<span class="qa-ic dim">┄</span><span>${GM.esc(r.name)} <i class="dim">(skip)</i></span>`;
        else if (r.status === 'warn') row.innerHTML = `<span class="qa-ic amber">△</span><span>${GM.esc(r.name)}<em class="qa-msg">${GM.esc(r.msg || '')}</em></span>`;
        else row.innerHTML = `<span class="qa-ic red">✗</span><span>${GM.esc(r.name)}<em class="qa-msg red">${GM.esc(r.msg || '')}</em></span>`;
        list.appendChild(row);
      });
      box.appendChild(list);
      body.appendChild(box);
    });
    // コンソールにもサマリを出力（CI的チェック用）
    console.log(`[QA] ${s.pass} pass / ${s.fail} fail / ${s.warn} warn ─ ${report.totalMs.toFixed(0)}ms`);
    if (s.fail) console.error('[QA] 失敗スイートあり ─ 上記コンソールを確認');
    return report;
  }

  GM.QA.openConsole = open;
  GM.QA.closeConsole = close;
  GM.QA.runAndRender = run;
})(window.GM);
