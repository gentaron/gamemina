#!/usr/bin/env node
/* ============================================================
   GAMEMINA CHRONICLE ─ Node CLI テストランナー
   ============================================================
   ブラウザ環境をエミュレートしてゲームエンジン一式をロードし、
   内蔵 QA ハーネス (js/tests/harness.js) を実行する。

   - GitHub Actions CI から `node tests/run.mjs` で起動
   - ネットワーク依存テスト (tags: network) は CI では除外
   - 終了コード: 失敗 0 件なら 0、それ以外は 1
   ============================================================ */
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'index.html');

/* ---------- ブラウザ環境シム ---------- */
function makeStubElement(id) {
  const el = {
    id,
    style: {},
    children: [],
    innerHTML: '',
    textContent: '',
    width: 0,
    height: 0,
    classList: {
      _set: new Set(),
      add(...c) { c.forEach((x) => this._set.add(x)); },
      remove(...c) { c.forEach((x) => this._set.delete(x)); },
      toggle(c, force) {
        const on = force == null ? !this._set.has(c) : !!force;
        on ? this._set.add(c) : this._set.delete(c);
        return on;
      },
      contains(c) { return this._set.has(c); }
    },
    dataset: {},
    addEventListener() {},
    removeEventListener() {},
    appendChild(child) { this.children.push(child); return child; },
    removeChild(child) { this.children = this.children.filter((c) => c !== child); },
    remove() {},
    querySelector() { return makeStubElement('q'); },
    querySelectorAll() { return []; },
    scrollIntoView() {},
    blur() {},
    focus() {},
    getContext() {
      return new Proxy({ imageSmoothingEnabled: false }, {
        get(t, p) {
          if (p in t) return t[p];
          return () => ({ addColorStop() {} });
        },
        set(t, p, v) { t[p] = v; return true; }
      });
    },
    get parentElement() { return el; },
    get parentNode() { return el; },
    offsetWidth: 0
  };
  return el;
}

const stubElements = new Map();
function getEl(id) {
  if (!stubElements.has(id)) stubElements.set(id, makeStubElement(id));
  return stubElements.get(id);
}

/* localStorage シム */
const lsStore = new Map();
const localStorageShim = {
  getItem: (k) => (lsStore.has(k) ? lsStore.get(k) : null),
  setItem: (k, v) => { lsStore.set(String(k), String(v)); },
  removeItem: (k) => { lsStore.delete(k); },
  clear: () => lsStore.clear(),
  key: (i) => Array.from(lsStore.keys())[i] ?? null,
  get length() { return lsStore.size; }
};

/* Image シム（ポートレートは読めないまま 'loading' 固定でOK） */
class ImageShim {
  set src(_v) { /* 読み込み不可 */ }
  set crossOrigin(_v) {}
  set decoding(_v) {}
  set onload(_v) {}
  set onerror(_v) {}
}
globalThis.Image = ImageShim;

/* document シム */
const documentShim = {
  readyState: 'complete',
  hidden: false,
  body: undefined, // Node 判定のため意図的に未定義（env().browser === false）
  documentElement: { style: { setProperty() {} } },
  getElementById: getEl,
  createElement: (tag) => makeStubElement(tag),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
  createEvent: () => ({ initEvent() {} }),
  fullscreenElement: null,
  webkitFullscreenElement: null
};
globalThis.document = documentShim;
globalThis.localStorage = localStorageShim;
globalThis.location = { hostname: 'localhost', protocol: 'file:', search: '', href: 'file://test', origin: 'file://' };
  /* navigator / window の保護付き上書き（Node 21+ の getter 対策） */
  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: Object.assign({}, globalThis.navigator, { maxTouchPoints: 0, userAgent: 'GAMEMINA-QA-Node' }),
      configurable: true
    });
  } catch (e) { /* 既存 navigator をそのまま使用 */ }
  globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.visualViewport = null;
if (!globalThis.addEventListener) globalThis.addEventListener = () => {};
if (!globalThis.window) globalThis.window = globalThis;
window.GM = window.GM || {};

/* ---------- ゲームスクリプトを index.html と同一順序でロード ---------- */
function loadOne(rel) {
  const file = path.join(ROOT, rel);
  const code = fs.readFileSync(file, 'utf8');
  try {
    vm.runInThisContext(code, { filename: rel });
  } catch (e) {
    console.error(`\n✗ スクリプトのロードに失敗: ${rel}\n  ${e.stack || e}`);
    process.exit(2);
  }
}
function loadGameScripts() {
  const html = fs.readFileSync(FILE, 'utf8');
  const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1])
    .filter((s) => !s.includes('tests/ui.tests') && !s.includes('tests/console'));
  if (!srcs.length) throw new Error('index.html からスクリプト一覧を取得できませんでした');
  // harness.js は index.html 経由でロードされる（重複登録防止のためここでは明示ロードしない）
  for (const rel of srcs) loadOne(rel);
  return srcs;
}

/* ---------- メイン ---------- */
async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  GAMEMINA CHRONICLE ─ 自動バグチェック (Node CLI)');
  console.log('══════════════════════════════════════════════════');
  const srcs = loadGameScripts();
  console.log(`  ロード済みモジュール: ${srcs.length} ファイル`);
  console.log(`  Node ${process.version}\n`);

  const GM = window.GM;
  if (!GM || !GM.QA) { console.error('✗ GM.QA が初期化されていない'); process.exit(2); }

  // マップ正規化（entry 計算）を明示実行（boot 済みだが冪等）
  GM.normalizeMaps();

  // マップ改ざん検知相当: main.js boot が走っているはず。走っていなければ実行
  if (!GM.state || GM.state.scene === 'boot') {
    // normalizeMaps のみで十分（boot の DOM 初期化はシム上で完結済み）
  }

  const isCI = !!process.env.CI;
  const filter = (s, t) => !(t.tags || []).includes('network') || !isCI; // CI では network テスト除外

  const report = await GM.QA.runAll({ filter });

  let failed = 0;
  for (const s of report.suites) {
    const icon = s.fail ? '✗' : (s.warn ? '△' : '✓');
    console.log(`${icon} ${s.name}  (${s.pass} pass / ${s.fail} fail / ${s.warn} warn / ${s.skipped} skip / ${s.ms.toFixed(0)}ms)`);
    for (const r of s.results) {
      if (r.status === 'pass') { console.log(`   ✓ ${r.name}`); continue; }
      if (r.status === 'skip') { console.log(`   ┄ ${r.name} (skip)`); continue; }
      if (r.status === 'warn') { console.log(`   △ ${r.name}\n       ↳ ${r.msg}`); continue; }
      failed++;
      console.log(`   ✗ ${r.name}\n       ↳ ${r.msg}`);
      if (r.stack && process.env.VERBOSE) console.log(r.stack.split('\n').slice(1, 4).join('\n'));
    }
  }

  const { pass, fail, warn, skipped } = report.summary;
  console.log('──────────────────────────────────────────────────');
  console.log(`  結果: ${pass} pass / ${fail} FAIL / ${warn} warn / ${skipped} skip ─ ${report.totalMs.toFixed(0)}ms`);
  console.log(fail === 0 ? '  ✨ ALL TESTS PASSED ─ リリース判定: GREEN' : '  ⛔ FAILURES DETECTED ─ リリース判定: RED');
  console.log('──────────────────────────────────────────────────');

  // 未処理タイマー（戦闘の setTimeout 等）でプロセスが残留しないよう明示終了
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('✗ ランナー致命的エラー:', e);
  process.exit(2);
});
