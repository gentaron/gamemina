/* ============================================================
   GAMEMINA CHRONICLE ─ Audio Engine
   WebAudio procedural chiptune (BGM sequencer + SFX synth)
   依存なし / ユーザー操作後に AudioContext を解禁
   ============================================================ */
'use strict';
window.GM = window.GM || {};

(function (GM) {
  let ctx = null;
  let master = null;      // master gain
  let bgmBus = null;      // BGM bus
  let sfxBus = null;      // SFX bus
  let current = null;     // current track name
  let seqTimer = null;
  let seqState = null;
  const settings = { bgm: 0.55, sfx: 0.7, enabled: true };

  /* ---------------- note utils ---------------- */
  const NOTE_RE = /^([A-Ga-g])(#|b)?(-?\d)$/;
  const BASE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  function noteFreq(n) {
    const m = NOTE_RE.exec(n);
    if (!m) return 0;
    let semi = BASE[m[1].toLowerCase()];
    if (m[2] === '#') semi += 1;
    if (m[2] === 'b') semi -= 1;
    const oct = parseInt(m[3], 10);
    const midi = 12 * (oct + 1) + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  // "c4:2 d4:1 e4:4 r:2" → [{f,dur},...]（"|" は小節区切りとして無視）
  function parseSeq(str) {
    const out = [];
    for (const tok of str.trim().split(/\s+/)) {
      if (tok === '|') continue;
      const [n, d] = tok.split(':');
      out.push({ f: n.toLowerCase() === 'r' ? 0 : noteFreq(n), d: d ? parseFloat(d) : 1 });
    }
    return out;
  }

  /* ---------------- init ---------------- */
  function ensureCtx() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    bgmBus = ctx.createGain();
    bgmBus.gain.value = settings.bgm;
    bgmBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = settings.sfx;
    sfxBus.connect(master);
    return true;
  }
  function unlock() {
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  /* ---------------- synth voices ---------------- */
  function pulse(freq, t0, dur, vol, bus, opts) {
    opts = opts || {};
    const o = ctx.createOscillator();
    o.type = opts.type || 'square';
    if (o.type === 'square' && opts.duty != null && o.setPeriodicWave) {
      // duty制御（ナイーブ実装: 倍音合成）
      const n = 16, real = new Float32Array(n), imag = new Float32Array(n);
      const duty = opts.duty;
      for (let i = 1; i < n; i++) {
        imag[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      }
      o.setPeriodicWave(ctx.createPeriodicWave(real, imag));
    }
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.linearRampToValueAtTime(Math.max(20, freq * opts.slide), t0 + dur);
    if (opts.vib) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = freq * 0.008;
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(t0); lfo.stop(t0 + dur);
    }
    const g = ctx.createGain();
    const a = opts.a != null ? opts.a : 0.005;
    const sus = vol * (opts.sus != null ? opts.sus : 0.75);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.setValueAtTime(sus, t0 + Math.max(a, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(t0, dur, vol, bus, opts) {
    opts = opts || {};
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = opts.ftype || 'highpass';
    f.frequency.value = opts.freq || 5000;
    const g = ctx.createGain();
    const a = opts.a != null ? opts.a : 0.002;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t0);
  }

  /* ---------------- SFX recipes ---------------- */
  const SFX = {
    cursor:   () => pulse(880, now(), 0.05, 0.25, sfxBus, { duty: 0.3 }),
    confirm:  () => { pulse(660, now(), 0.07, 0.3, sfxBus); pulse(990, now() + 0.06, 0.1, 0.3, sfxBus); },
    cancel:   () => pulse(330, now(), 0.12, 0.28, sfxBus, { slide: 0.6 }),
    open:     () => { pulse(523, now(), 0.06, 0.22, sfxBus); pulse(784, now() + 0.05, 0.08, 0.22, sfxBus); },
    hit:      () => { noise(now(), 0.12, 0.4, sfxBus, { freq: 2200 }); pulse(180, now(), 0.1, 0.3, sfxBus, { slide: 0.5, type: 'triangle' }); },
    crit:     () => { noise(now(), 0.16, 0.5, sfxBus, { freq: 1600 }); pulse(140, now(), 0.16, 0.4, sfxBus, { slide: 0.4, type: 'sawtooth' }); pulse(1200, now(), 0.06, 0.2, sfxBus); },
    miss:     () => noise(now(), 0.08, 0.15, sfxBus, { freq: 900, ftype: 'bandpass' }),
    magic:    () => { for (let i = 0; i < 5; i++) pulse(700 + i * 160, now() + i * 0.03, 0.12, 0.18, sfxBus, { type: 'triangle' }); },
    fire:     () => { noise(now(), 0.3, 0.3, sfxBus, { freq: 700, ftype: 'lowpass' }); pulse(120, now(), 0.25, 0.3, sfxBus, { slide: 1.8, type: 'sawtooth' }); },
    ice:      () => { for (let i = 0; i < 4; i++) pulse(1400 + i * 260, now() + i * 0.04, 0.1, 0.2, sfxBus, { type: 'triangle' }); noise(now(), 0.2, 0.12, sfxBus, { freq: 6000 }); },
    thunder:  () => { noise(now(), 0.35, 0.5, sfxBus, { freq: 400, ftype: 'lowpass' }); pulse(90, now(), 0.3, 0.4, sfxBus, { slide: 0.5, type: 'square' }); },
    heal:     () => { [523, 659, 784, 1047].forEach((f, i) => pulse(f, now() + i * 0.07, 0.2, 0.22, sfxBus, { type: 'triangle' })); },
    revive:   () => { [392, 523, 659, 784, 1047].forEach((f, i) => pulse(f, now() + i * 0.09, 0.25, 0.24, sfxBus, { type: 'triangle' })); },
    buff:     () => { pulse(440, now(), 0.1, 0.25, sfxBus); pulse(554, now() + 0.08, 0.1, 0.25, sfxBus); pulse(659, now() + 0.16, 0.16, 0.25, sfxBus); },
    debuff:   () => { pulse(440, now(), 0.1, 0.25, sfxBus, { slide: 0.7 }); pulse(330, now() + 0.08, 0.16, 0.25, sfxBus, { slide: 0.6 }); },
    item:     () => { pulse(700, now(), 0.08, 0.25, sfxBus); pulse(1050, now() + 0.07, 0.1, 0.25, sfxBus); },
    coin:     () => { pulse(1319, now(), 0.06, 0.25, sfxBus); pulse(1760, now() + 0.05, 0.12, 0.22, sfxBus); },
    levelup:  () => { [523, 659, 784, 1047, 1319].forEach((f, i) => pulse(f, now() + i * 0.09, 0.22, 0.28, sfxBus, { duty: 0.4 })); },
    save:     () => { [784, 988, 1175].forEach((f, i) => pulse(f, now() + i * 0.08, 0.18, 0.24, sfxBus, { type: 'triangle' })); },
    encounter:(() => { let t = 0; return () => { const s = now(); for (let i = 0; i < 7; i++) pulse(400 + (i % 2) * 700, s + i * 0.06, 0.08, 0.3, sfxBus); }; })(),
    bossroar: () => { pulse(70, now(), 0.7, 0.5, sfxBus, { slide: 1.6, type: 'sawtooth' }); noise(now(), 0.6, 0.35, sfxBus, { freq: 300, ftype: 'lowpass' }); },
    gate:     () => { for (let i = 0; i < 8; i++) pulse(220 * Math.pow(1.25, i), now() + i * 0.07, 0.14, 0.2, sfxBus, { type: 'triangle' }); },
    shake:    () => noise(now(), 0.25, 0.2, sfxBus, { freq: 250, ftype: 'lowpass' })
  };
  function now() { return ctx ? ctx.currentTime : 0; }

  function sfx(name) {
    if (!settings.enabled || !settings.sfx) return;
    if (!ensureCtx()) return;
    if (ctx.state === 'suspended') { ctx.resume(); }
    const fn = SFX[name];
    if (fn) try { fn(); } catch (_) {}
  }

  /* ---------------- BGM sequencer ---------------- */
  // channels: [{wave, duty, vol, vib, notes:"..."}]  notes: "c4:2 d4:1 ..."
  // drums: "k h s ..." k=kick s=snare h=hat
  const TRACKS = {
    title: {
      bpm: 72, loop: true,
      ch: [
        { wave: 'square', duty: 0.5, vol: 0.16, vib: true, notes: parseSeq(
          'a3:2 c4:2 e4:2 a4:2 e4:2 c4:2 | a3:2 c4:2 e4:2 a4:2 e4:2 c4:2 |' +
          'f3:2 a3:2 c4:2 f4:2 c4:2 a3:2 | g3:2 b3:2 d4:2 g4:2 d4:2 b3:2') },
        { wave: 'triangle', vol: 0.3, notes: parseSeq(
          'a2:12 r:2 | f2:12 r:2 | d2:12 r:2 | e2:12 r:2') },
        { wave: 'square', duty: 0.25, vol: 0.09, notes: parseSeq(
          'e5:1 r:1 a5:1 r:1 e5:1 r:1 c5:1 r:1 e5:1 r:1 a5:1 r:1 e5:1 r:1 c5:1 r:1' +
          'c5:1 r:1 f5:1 r:1 c5:1 r:1 a4:1 r:1 b4:1 r:1 d5:1 r:1 g5:1 r:1 d5:1 r:1 b4:1 r:1') }
      ],
      drums: 'h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2'
    },
    hub: {
      bpm: 96, loop: true,
      ch: [
        { wave: 'square', duty: 0.4, vol: 0.14, vib: true, notes: parseSeq(
          'g3:1.5 b3:1.5 d4:3 g4:3 d4:1.5 b3:1.5 | c4:1.5 e4:1.5 g4:3 c5:3 g4:1.5 e4:1.5 |' +
          'a3:1.5 c4:1.5 e4:3 a4:3 e4:1.5 c4:1.5 | b3:1.5 d4:1.5 g4:3 f4:1.5 d4:1.5 b3:1.5') },
        { wave: 'triangle', vol: 0.32, notes: parseSeq(
          'g2:6 g2:3 g2:3 | c3:6 c3:3 c3:3 | a2:6 a2:3 a2:3 | g2:6 f2:3 g2:3') },
        { wave: 'square', duty: 0.2, vol: 0.07, notes: parseSeq(
          'd5:3 r:1 b4:3 r:1 g4:3 r:1 b4:3 r:1 c5:3 r:1 g4:3 r:1 e4:3 r:1 g4:3 r:1' +
          'e5:3 r:1 c5:3 r:1 a4:3 r:1 c5:3 r:1 d5:3 r:1 b4:3 r:1 g4:3 r:1 b4:3 r:1') }
      ],
      drums: 'k:2 h:2 h:2 s:2 h:2 h:2 k:2 h:2 k:2 h:2 h:2 s:2 h:2 h:2 k:2 h:2'
    },
    town: {
      bpm: 104, loop: true,
      ch: [
        { wave: 'square', duty: 0.5, vol: 0.13, notes: parseSeq(
          'c5:2 b4:1 c5:1 e5:2 g4:2 r:2 | a4:2 g4:1 a4:1 c5:2 e4:2 r:2 |' +
          'f4:2 e4:1 f4:1 a4:2 c5:2 r:2 | g4:4 f4:2 e4:2 d4:4') },
        { wave: 'triangle', vol: 0.3, notes: parseSeq(
          'c3:4 g2:4 c3:2 g3:2 | a2:4 e2:4 a2:2 e3:2 | f2:4 c3:4 f2:2 c3:2 | g2:4 d3:4 g2:4') },
        { wave: 'square', duty: 0.3, vol: 0.06, notes: parseSeq(
          'e5:2 r:2 g5:2 r:2 e5:2 r:2 r:4 c5:2 r:2 e5:2 r:2 c5:2 r:2 r:4' +
          'a4:2 r:2 c5:2 r:2 a4:2 r:2 r:4 b4:2 r:2 d5:2 r:2 g4:4 r:4') }
      ],
      drums: 'h:2 h:2 k:2 h:2 h:2 h:2 k:2 h:2'
    },
    field: {
      bpm: 128, loop: true,
      ch: [
        { wave: 'square', duty: 0.35, vol: 0.15, notes: parseSeq(
          'c4:1 e4:1 g4:2 a4:1 g4:1 e4:1 c4:1 | d4:1 f4:1 a4:2 g4:1 f4:1 d4:1 b3:1 |' +
          'c4:1 e4:1 g4:2 c5:2 b4:1 a4:1 g4:1 | g4:1 a4:1 b4:1 c5:3 r:3') },
        { wave: 'triangle', vol: 0.34, notes: parseSeq(
          'c3:2 c3:2 g2:2 g2:2 | f2:2 f2:2 g2:2 g2:2 | a2:2 a2:2 e2:2 e2:2 | f2:2 g2:2 c3:2 g2:2') },
        { wave: 'square', duty: 0.2, vol: 0.07, notes: parseSeq(
          'g5:1 r:1 e5:1 r:1 c5:2 r:2 | a4:1 r:1 f5:1 r:1 d5:2 r:2 |' +
          'e5:1 r:1 c5:1 r:1 g5:2 e5:2 | d5:2 r:2 c5:4 r:4') }
      ],
      drums: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 k:2 s:2 s:2 h:2'
    },
    dungeon: {
      bpm: 84, loop: true,
      ch: [
        { wave: 'square', duty: 0.4, vol: 0.13, notes: parseSeq(
          'd4:2 f4:2 a4:2 g4:2 f4:2 e4:2 d4:2 c#4:2 | d4:2 f4:2 a4:2 c5:2 b4:2 a4:2 g4:2 f4:2') },
        { wave: 'triangle', vol: 0.34, notes: parseSeq(
          'd2:8 r:8 | d2:4 d2:4 c2:4 c#2:4') },
        { wave: 'square', duty: 0.15, vol: 0.05, notes: parseSeq(
          'a5:1 r:3 f5:1 r:3 d5:1 r:3 e5:1 r:3 a5:1 r:3 g5:1 r:3 e5:1 r:3 d5:1 r:3') }
      ],
      drums: 'h:4 h:4 h:4 h:4'
    },
    battle: {
      bpm: 152, loop: true,
      ch: [
        { wave: 'square', duty: 0.3, vol: 0.16, notes: parseSeq(
          'a4:0.5 a4:0.5 c5:1 a4:0.5 g4:0.5 a4:1 e4:1 | a4:0.5 a4:0.5 c5:1 d5:0.5 e5:0.5 f5:1 e5:1 |' +
          'd5:0.5 d5:0.5 f5:1 d5:0.5 c5:0.5 d5:1 a4:1 | g4:0.5 a4:0.5 b4:1 c5:1 e5:1 d5:1 b4:1') },
        { wave: 'triangle', vol: 0.36, notes: parseSeq(
          'a1:1 a1:1 a1:1 a2:1 | f1:1 f1:1 f1:1 f2:1 | g1:1 g1:1 g1:1 g2:1 | e1:1 e1:1 e1:1 e2:1') },
        { wave: 'square', duty: 0.15, vol: 0.08, notes: parseSeq(
          'e5:1 r:0.5 r:0.5 e5:1 r:0.5 r:0.5 e5:1 e5:1 | c5:1 r:0.5 r:0.5 c5:1 r:0.5 r:0.5 c5:1 c5:1' +
          'd5:1 r:0.5 r:0.5 d5:1 r:0.5 r:0.5 d5:1 d5:1 | b4:1 r:0.5 r:0.5 b4:1 r:0.5 r:0.5 b4:1 b4:1') }
      ],
      drums: 'k:1 h:0.5 h:0.5 s:1 h:0.5 h:0.5 k:1 h:0.5 h:0.5 s:1 h:1 k:1 h:0.5 h:0.5 s:1 h:0.5 h:0.5 k:1 h:0.5 h:0.5 s:1 h:0.5 h:0.5 k:1 h:1 s:1 h:1'
    },
    boss: {
      bpm: 160, loop: true,
      ch: [
        { wave: 'square', duty: 0.4, vol: 0.17, notes: parseSeq(
          'd4:0.5 d4:0.5 d4:1 f4:1 d4:1 c#4:1 d4:2 a4:2 | g4:0.5 g4:0.5 g4:1 a#4:1 g4:1 f4:1 g4:2 d5:2 |' +
          'a#4:0.5 a#4:0.5 a#4:1 d5:1 a#4:1 a4:1 a#4:2 f5:2 | e5:0.5 e5:0.5 e5:1 g5:1 e5:1 d5:1 c5:1 a#4:1 a4:1') },
        { wave: 'sawtooth', vol: 0.2, notes: parseSeq(
          'd2:1 d2:1 d2:1 d2:1 d2:1 d2:1 a1:1 a1:1 | a#1:1 a#1:1 a#1:1 a#1:1 f1:1 f1:1 f1:1 f1:1 |' +
          'g1:1 g1:1 g1:1 g1:1 g1:1 g1:1 d2:1 d2:1 | a1:1 a1:1 a1:1 a1:1 c#2:1 c#2:1 e2:1 e2:1') },
        { wave: 'square', duty: 0.2, vol: 0.07, notes: parseSeq(
          'd5:1 d5:0.5 d5:0.5 f5:1 d5:1 c#5:1 d5:2 a4:2 | d5:1 d5:0.5 d5:0.5 g5:1 d5:1 c5:1 d5:2 f5:2' +
          'd5:1 d5:0.5 d5:0.5 a#5:1 d5:1 c5:1 d5:2 f5:2 | e5:2 g5:2 e5:2 d5:2 c5:2 a#4:2') }
      ],
      drums: 'k:0.5 k:0.5 h:1 s:1 k:0.5 k:0.5 h:1 s:1 k:0.5 k:0.5 h:1 s:1 k:1 s:1 k:1 s:1'
    },
    final: {
      bpm: 138, loop: true,
      ch: [
        { wave: 'square', duty: 0.45, vol: 0.17, vib: true, notes: parseSeq(
          'd4:2 a4:2 d5:2 f5:2 a5:2 f5:2 d5:2 a4:2 | c5:2 g5:2 c6:2 b5:2 g5:2 f5:2 d5:2 b4:2 |' +
          'a#4:2 f5:2 a#5:2 a5:2 f5:2 d5:2 a#4:2 f4:2 | a4:2 e5:2 a5:2 g5:2 e5:2 c#5:2 a4:2 e4:2') },
        { wave: 'sawtooth', vol: 0.18, notes: parseSeq(
          'd2:4 d2:4 d2:4 d2:4 | c2:4 c2:4 c2:4 c2:4 | a#1:4 a#1:4 a#1:4 a#1:4 | a1:4 a1:4 e2:4 e2:4') },
        { wave: 'triangle', vol: 0.3, notes: parseSeq(
          'd3:2 f3:2 a3:2 d4:2 a3:2 f3:2 d3:2 r:2 | c3:2 e3:2 g3:2 c4:2 g3:2 e3:2 c3:2 r:2' +
          'a#2:2 d3:2 f3:2 a#3:2 f3:2 d3:2 a#2:2 r:2 | a2:2 c#3:2 e3:2 a3:2 e3:2 c#3:2 a2:2 r:2') }
      ],
      drums: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2'
    },
    victory: {
      bpm: 132, loop: false,
      ch: [
        { wave: 'square', duty: 0.4, vol: 0.2, notes: parseSeq(
          'c5:1 c5:1 c5:1 c5:3 a#4:0.5 c5:0.5 d5:1 c5:1 d5:1 e5:4 r:2' +
          'g5:1 e5:1 c5:1 e5:1 g5:3 f5:1 e5:1 d5:4 c5:6') },
        { wave: 'triangle', vol: 0.34, notes: parseSeq(
          'c3:1 c3:1 c3:1 f2:3 f2:1 f2:1 g2:1 g2:1 g2:1 c3:4 r:2' +
          'c3:1 c3:1 c3:1 c3:1 f3:3 f3:1 g3:3 g3:1 c3:6') },
        { wave: 'square', duty: 0.2, vol: 0.08, notes: parseSeq(
          'e5:1 e5:1 e5:1 e5:3 e5:0.5 e5:0.5 e5:1 e5:1 e5:1 g5:4 r:2' +
          'e5:1 c5:1 g4:1 e5:1 g5:3 a5:1 b5:3 b5:1 c6:6') }
      ],
      drums: 'k:1 s:1 k:1 s:2 s:1 s:1 s:1 s:1 k:2 s:2 k:1 s:1 k:1 s:1 s:2 s:4'
    },
    gameover: {
      bpm: 60, loop: false,
      ch: [
        { wave: 'square', duty: 0.5, vol: 0.16, notes: parseSeq('a4:3 g4:3 f4:3 e4:3 d4:6') },
        { wave: 'triangle', vol: 0.3, notes: parseSeq('d2:6 a1:6 d1:12') },
        { wave: 'square', duty: 0.3, vol: 0.07, notes: parseSeq('f5:2 e5:2 d5:2 c5:2 a4:8') }
      ],
      drums: ''
    },
    ending: {
      bpm: 80, loop: true,
      ch: [
        { wave: 'square', duty: 0.5, vol: 0.14, vib: true, notes: parseSeq(
          'e4:2 g4:2 b4:2 e5:3 d5:1 b4:2 | c5:2 e5:2 g5:2 c6:3 b5:1 g5:2 |' +
          'a4:2 c5:2 e5:2 a5:3 g5:1 e5:2 | b4:2 d5:2 g5:2 f#5:3 e5:1 d5:2') },
        { wave: 'triangle', vol: 0.3, notes: parseSeq(
          'e2:8 e2:8 | c3:8 c3:8 | a2:8 a2:8 | g2:8 b2:8') }
      ],
      drums: 'h:2 h:2 h:2 h:2 h:2 h:2 h:2 h:2'
    }
  };

  function stopSeq() {
    if (seqTimer) { clearTimeout(seqTimer); seqTimer = null; }
    seqState = null;
  }

  function scheduleTrack(track, state) {
    // 1ループ分を先読みスケジュールし、終端で再スケジュール
    const spb = 60 / track.bpm; // quarter note seconds. note unit: 1 = quarter
    const unit = spb / 2;       // 最小音符=八分にしたいので unit=八分? → note:1=四分。unit=spb/1
    // NOTE: "note数:1 = 四分音符" として扱う
    const q = spb;
    let t = state.t0;
    let maxEnd = state.t0;
    for (const ch of track.ch) {
      let ct = state.t0;
      for (const n of ch.parsed) {
        const dur = n.d * q;
        if (n.f > 0) {
          pulse(n.f, ct, Math.min(dur * 0.95, dur), ch.vol || 0.15, bgmBus,
            { type: ch.wave || 'square', duty: ch.duty, vib: ch.vib });
        }
        ct += dur;
        maxEnd = Math.max(maxEnd, ct);
      }
    }
    if (track.drums && track.drumsParsed.length) {
      let ct = state.t0;
      for (const d of track.drumsParsed) {
        const dur = d.d * q;
        if (d.k === 'k') { pulse(70, ct, 0.1, 0.5, bgmBus, { slide: 0.4, type: 'triangle' }); }
        else if (d.k === 's') { noise(ct, 0.09, 0.3, bgmBus, { freq: 1800 }); }
        else if (d.k === 'h') { noise(ct, 0.03, 0.12, bgmBus, { freq: 7000 }); }
        ct += dur;
        maxEnd = Math.max(maxEnd, ct);
      }
    }
    return maxEnd;
  }

  function playBGM(name) {
    if (current === name) return;
    stopSeq();
    current = name;
    if (!name) return;
    if (!settings.enabled || !settings.bgm) return;
    if (!ensureCtx()) { current = name; return; }
    if (ctx.state === 'suspended') ctx.resume();
    const track = TRACKS[name];
    if (!track) return;
    track.ch.forEach((c) => { c.parsed = c.parsed || (Array.isArray(c.notes) ? c.notes : parseSeq(c.notes)); });
    if (track.drums) track.drumsParsed = track.drums.trim().split(/\s+/).map((t) => { const [k, d] = t.split(':'); return { k, d: d ? parseFloat(d) : 1 }; });

    const state = { t0: ctx.currentTime + 0.08 };
    seqState = state;
    const loopLen = trackLength(track);
    const scheduleAhead = () => {
      if (!seqState || current !== name) return;
      const end = scheduleTrack(track, seqState);
      seqState.t0 = end + 0.05;
      const waitMs = Math.max(50, (seqState.t0 - ctx.currentTime - 0.4) * 1000);
      if (track.loop) {
        seqTimer = setTimeout(scheduleAhead, waitMs);
      } else {
        seqTimer = setTimeout(() => { current = null; }, (seqState.t0 - ctx.currentTime) * 1000);
      }
    };
    scheduleAhead();
  }
  function trackLength(track) {
    const q = 60 / track.bpm;
    let len = 0;
    for (const ch of track.ch) {
      let l = 0; ch.parsed.forEach((n) => { l += n.d; });
      len = Math.max(len, l * q);
    }
    return len;
  }
  function stopBGM() { stopSeq(); current = null; }
  function fadeBGM(sec) {
    if (!ctx || !bgmBus) return;
    try {
      bgmBus.gain.cancelScheduledValues(ctx.currentTime);
      bgmBus.gain.setValueAtTime(bgmBus.gain.value, ctx.currentTime);
      bgmBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + sec);
      setTimeout(() => { stopBGM(); bgmBus.gain.value = settings.bgm; }, sec * 1000 + 60);
    } catch (_) { stopBGM(); }
  }

  /* ---------------- settings ---------------- */
  function applyVolumes() {
    if (bgmBus) bgmBus.gain.value = settings.bgm;
    if (sfxBus) sfxBus.gain.value = settings.sfx;
  }
  function setVolume(kind, v) {
    settings[kind] = v;
    applyVolumes();
    try { localStorage.setItem('gm_audio', JSON.stringify(settings)); } catch (_) {}
  }
  function loadSettings() {
    try {
      const raw = localStorage.getItem('gm_audio');
      if (raw) Object.assign(settings, JSON.parse(raw));
    } catch (_) {}
  }
  function setEnabled(on) {
    settings.enabled = on;
    try { localStorage.setItem('gm_audio', JSON.stringify(settings)); } catch (_) {}
    if (!on) stopBGM();
  }

  GM.AUDIO = {
    unlock, sfx, playBGM, stopBGM, fadeBGM,
    setVolume, loadSettings, setEnabled,
    get settings() { return settings; },
    get current() { return current; }
  };
  GM.AUDIO.loadSettings();
})(window.GM);
