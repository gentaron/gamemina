/* ============================================================
   audio.js : WebAudio チップチューン BGM / SE エンジン
   外部音源ファイル不要（すべて生成）
   ============================================================ */
'use strict';
window.GD = window.GD || {};

const AudioSys = (() => {
  let ctx = null, master = null, bgmGain = null, seGain = null;
  let bgm = { id:null, timer:null, step:0, playing:false };
  let bgmVol = 0.55, seVol = 0.8;
  const NOTE = {}; // note name -> freq
  (() => {
    const names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    for (let oct=1; oct<=7; oct++) names.forEach((n,i) => {
      NOTE[n+oct] = 440 * Math.pow(2,(oct-4) + (i-9)/12);
    });
  })();

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      bgmGain = ctx.createGain(); bgmGain.gain.value = bgmVol; bgmGain.connect(master);
      seGain = ctx.createGain(); seGain.gain.value = seVol; seGain.connect(master);
      return true;
    } catch(e){ return false; }
  }
  function resume(){ if (ensure() && ctx.state === 'suspended') ctx.resume(); }

  /* --- 基本音色 --- */
  function tone(freq, t0, dur, type='square', vol=0.2, dest=null, slide=0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide), t0+dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(g); g.connect(dest || seGain);
    o.start(t0); o.stop(t0+dur+0.02);
  }
  function noise(t0, dur, vol=0.2, dest=null, filterFreq=0) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    let node = src;
    if (filterFreq) {
      const f = ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value = filterFreq;
      src.connect(f); node = f;
    }
    node.connect(g); g.connect(dest || seGain);
    src.start(t0); src.stop(t0+dur+0.02);
  }

  /* --- SE --- */
  const SE = {
    cursor(){ const t=ctx.currentTime; tone(880,t,0.06,'square',0.15); },
    ok(){ const t=ctx.currentTime; tone(660,t,0.07,'square',0.18); tone(990,t+0.07,0.09,'square',0.18); },
    cancel(){ const t=ctx.currentTime; tone(440,t,0.08,'square',0.15); tone(330,t+0.06,0.1,'square',0.13); },
    buzzer(){ const t=ctx.currentTime; tone(180,t,0.15,'sawtooth',0.2); },
    attack(){ const t=ctx.currentTime; noise(t,0.12,0.25,null,900); tone(220,t,0.1,'sawtooth',0.15,null,-120); },
    magic(){ const t=ctx.currentTime; [523,659,784,1047].forEach((f,i)=>tone(f,t+i*0.05,0.14,'triangle',0.16)); },
    heal(){ const t=ctx.currentTime; [392,523,659,784].forEach((f,i)=>tone(f,t+i*0.07,0.2,'sine',0.2)); },
    damage(){ const t=ctx.currentTime; noise(t,0.15,0.3,null,400); tone(160,t,0.12,'square',0.18,null,-60); },
    crit(){ const t=ctx.currentTime; noise(t,0.2,0.35,null,1200); tone(880,t,0.18,'sawtooth',0.2,null,-500); },
    levelup(){ const t=ctx.currentTime; [523,659,784,1047,1319].forEach((f,i)=>tone(f,t+i*0.08,0.16,'square',0.18)); },
    save(){ const t=ctx.currentTime; [784,784,1175].forEach((f,i)=>tone(f,t+i*0.1,0.14,'triangle',0.2)); },
    item(){ const t=ctx.currentTime; tone(1047,t,0.08,'triangle',0.18); tone(1319,t+0.08,0.12,'triangle',0.18); },
    encounter(){ const t=ctx.currentTime; noise(t,0.3,0.3,null,300); tone(110,t,0.3,'sawtooth',0.2,null,-40); },
    boss(){ const t=ctx.currentTime; tone(80,t,0.6,'sawtooth',0.3); noise(t,0.5,0.25,null,200); },
    footstep(){ const t=ctx.currentTime; tone(150,t,0.04,'triangle',0.06); },
    open(){ const t=ctx.currentTime; tone(523,t,0.08,'square',0.15); tone(784,t+0.08,0.12,'square',0.15); },
    summon(){ const t=ctx.currentTime; for(let i=0;i<8;i++) tone(200+i*100,t+i*0.04,0.3,'sine',0.12,null,80); },
    victory(){}
  };
  function se(id){ if (!ensure()) return; resume(); if (SE[id]) SE[id](); }

  /* --- BGM トラック定義（16分音符ステップ・シーケンサ） --- */
  /* pat: [bass, lead, drum] ループ配列。null=休符, 'C4' 等の音名, drum: k/s/h */
  const TRACKS = {
    title: { bpm: 88, pat: [
      ['C2',null,'k'],['G2',null,'h'],['C2',null,null],['G2','E4','h'],
      ['A#2',null,'k'],['F2',null,'h'],['A#2','D4',null],['F2',null,'h'],
      ['A#2',null,'k'],['F2','F4','h'],['A#2',null,null],['F2',null,'h'],
      ['G#2',null,'k'],['D#2','D#4','h'],['G#2',null,null],['D#2',null,'h']
    ], leadType:'triangle', vol:0.16 },
    field: { bpm: 116, pat: [
      ['C3','E4','k'],['C3',null,'h'],['G3','G4',null],['C3',null,'h'],
      ['A2','A4','k'],['A2',null,'h'],['E3','C5',null],['A2',null,'h'],
      ['F3','A4','k'],['F3',null,'h'],['C4','G4',null],['F3',null,'h'],
      ['G3','B4','k'],['G3',null,'h'],['B3','D5',null],['G3',null,'h']
    ], leadType:'square', vol:0.13 },
    field2: { bpm: 108, pat: [
      ['D3','D4','k'],['D3','F#4','h'],['A3','A4',null],['D3',null,'h'],
      ['B2','B4','k'],['B2','A4','h'],['F#3','D5',null],['B2',null,'h'],
      ['G3','G4','k'],['G3','B4','h'],['D4','D5',null],['G3',null,'h'],
      ['A3','A4','k'],['A3','C#5','h'],['E4','E5',null],['A3',null,'h']
    ], leadType:'square', vol:0.13 },
    city:  { bpm: 100, pat: [
      ['C3','C4','k'],['E3',null,'h'],['G3','E4',null],['E3',null,'h'],
      ['A2','A3','k'],['C3',null,'h'],['E3','G4',null],['C3',null,'h'],
      ['F3','F4','k'],['A3',null,'h'],['C4','A4',null],['A3',null,'h'],
      ['G3','G4','k'],['B3',null,'h'],['D4','B4',null],['B3',null,'h']
    ], leadType:'triangle', vol:0.15 },
    city2: { bpm: 112, pat: [
      ['E3','B4','k'],['E3',null,'h'],['B3','G#4',null],['E3',null,'h'],
      ['C#3','A4','k'],['C#3',null,'h'],['G#3','E5',null],['C#3',null,'h'],
      ['A2','A4','k'],['A2',null,'h'],['E3','C#5',null],['A2',null,'h'],
      ['B2','B4','k'],['B2',null,'h'],['F#3','D#5',null],['B2',null,'h']
    ], leadType:'square', vol:0.12 },
    battle:{ bpm: 150, pat: [
      ['A2','A4','k'],['A2','E4','h'],['A2','A4',null],['G2','E4','h'],
      ['F2','F4','k'],['F2','C4','h'],['F2','F4',null],['E2','C4','h'],
      ['A2','A4','k'],['A2','E4','h'],['A2','A4',null],['B2','E4','h'],
      ['C3','C5','k'],['B2','B4','h'],['A2','A4',null],['G2','E4','h']
    ], leadType:'square', vol:0.14 },
    boss:  { bpm: 160, pat: [
      ['D2','D4','k'],['D2',null,'ks'],['F2','F4','k'],['D2',null,'ks'],
      ['C2','C4','k'],['C2',null,'ks'],['D2','D4','k'],['A2',null,'ks'],
      ['D2','D4','k'],['D2',null,'ks'],['G2','G4','k'],['D2',null,'ks'],
      ['A#2','A#4','k'],['A2','A4','ks'],['G2','G4','k'],['F2','F4','ks']
    ], leadType:'sawtooth', vol:0.13 },
    boss2: { bpm: 168, pat: [
      ['C2','C4','k'],['C#2',null,'ks'],['D2','D4','k'],['D#2',null,'ks'],
      ['E2','E4','k'],['F2',null,'ks'],['F#2','F#4','k'],['G2',null,'ks'],
      ['G#2','G#4','k'],['A2',null,'ks'],['A#2','A#4','k'],['B2',null,'ks'],
      ['C3','C5','k'],['B2','B4','ks'],['A#2','A#4','k'],['A2','A4','ks']
    ], leadType:'sawtooth', vol:0.14 },
    dungeon: { bpm: 96, pat: [
      ['C2',null,'k'],['C2','D#4',null],['C2',null,'h'],['A#1',null,null],
      ['C2',null,'k'],['C2','F#4',null],['C2',null,'h'],['A#1',null,null],
      ['D2',null,'k'],['D2','A4',null],['D2',null,'h'],['C2',null,null],
      ['A#1',null,'k'],['B1','F#4',null],['B1',null,'h'],['C2',null,null]
    ], leadType:'triangle', vol:0.14 },
    dungeon2: { bpm: 84, pat: [
      ['A2','E4','k'],['A2',null,null],['A2','C5',null],['A2',null,'h'],
      ['F2','D5','k'],['F2',null,null],['F2','A4',null],['F2',null,'h'],
      ['G2','B4','k'],['G2',null,null],['G2','D5',null],['G2',null,'h'],
      ['E2','C5','k'],['E2',null,null],['E2','B4',null],['E2',null,'h']
    ], leadType:'triangle', vol:0.14 },
    sad: { bpm: 72, pat: [
      ['A2',null,null],['E3','E4',null],['A2','C5',null],['E3',null,null],
      ['F2',null,null],['C3','A4',null],['F2','C5',null],['C3',null,null],
      ['D2',null,null],['A2','F4',null],['D2','A4',null],['A2',null,null],
      ['E2',null,null],['B2','G#4',null],['E2','B4',null],['B2',null,null]
    ], leadType:'triangle', vol:0.14 },
    auralis:{ bpm: 96, pat: [
      ['C3','G4','k'],['C3','E5',null],['G3','C5',null],['C3',null,'h'],
      ['A2','A4','k'],['A2','E5',null],['E3','C5',null],['A2',null,'h'],
      ['F3','F4','k'],['F3','A4',null],['C4','F4',null],['F3',null,'h'],
      ['G3','G4','k'],['G3','D5',null],['B3','G4',null],['G3',null,'h']
    ], leadType:'triangle', vol:0.15 },
    eros: { bpm: 104, pat: [
      ['F#3','A#4','k'],['F#3',null,'h'],['C#4','F#4',null],['F#3',null,'h'],
      ['D#3','G4','k'],['D#3',null,'h'],['A#3','D#4',null],['D#3',null,'h'],
      ['B2','D#4','k'],['B2',null,'h'],['F#3','B4',null],['B2',null,'h'],
      ['C#3','F#4','k'],['C#3',null,'h'],['G#3','C#5',null],['C#3',null,'h']
    ], leadType:'triangle', vol:0.15 },
    summit:{ bpm: 100, pat: [
      ['C3','E4','k'],['C3','G4','h'],['E3','C5',null],['C3','G4','h'],
      ['F3','A4','k'],['F3','C5','h'],['A3','F4',null],['F3','C5','h'],
      ['G3','B4','k'],['G3','D5','h'],['B3','G4',null],['G3','D5','h'],
      ['C3','E4','k'],['G3','G4','h'],['E3','C5',null],['G3','G4','h']
    ], leadType:'triangle', vol:0.15 },
    ending:{ bpm: 80, pat: [
      ['C3','E4',null],['G3','G4',null],['C3','C5',null],['G3',null,null],
      ['F3','A4',null],['C4','C5',null],['F3','F4',null],['C4',null,null],
      ['G3','B4',null],['D4','D5',null],['G3','G4',null],['D4',null,null],
      ['C3','E4',null],['G3','G4',null],['E3','C5',null],['C3',null,null]
    ], leadType:'triangle', vol:0.15 }
  };

  let curTrack = null;
  function drum(kind, t) {
    if (kind.includes('k')) { tone(55, t, 0.11, 'sine', 0.35, bgmGain, -30); }
    if (kind.includes('s')) { noise(t, 0.09, 0.22, bgmGain, 2500); }
    if (kind.includes('h')) { noise(t, 0.03, 0.08, bgmGain, 7000); }
  }
  function playStep() {
    if (!bgm.playing || !TRACKS[curTrack]) return;
    const tr = TRACKS[curTrack];
    const stepDur = 60 / tr.bpm / 4;
    const st = bgm.step % tr.pat.length;
    const [bass, lead, drums] = tr.pat[st];
    const t = ctx.currentTime + 0.02;
    if (bass) tone(NOTE[bass], t, stepDur*1.8, 'triangle', 0.22, bgmGain);
    if (lead) tone(NOTE[lead], t, stepDur*1.6, tr.leadType, tr.vol, bgmGain);
    if (drums) drum(drums, t);
    bgm.step++;
  }
  function loopTrack() {
    if (!bgm.playing) return;
    playStep();
    const tr = TRACKS[curTrack];
    bgm.timer = setTimeout(loopTrack, 60000 / tr.bpm / 4 * 1000);
  }
  function bgmPlay(id) {
    if (!ensure()) return; resume();
    if (bgm.id === id && bgm.playing) return;
    bgmStop();
    if (!TRACKS[id]) return;
    bgm.id = id; bgm.step = 0; bgm.playing = true; curTrack = id;
    loopTrack();
  }
  function bgmStop() {
    bgm.playing = false; bgm.id = null;
    if (bgm.timer) { clearTimeout(bgm.timer); bgm.timer = null; }
  }
  function setBgmVol(v){ bgmVol = v; if (bgmGain) bgmGain.gain.value = v; }
  function setSeVol(v){ seVol = v; if (seGain) seGain.gain.value = v; }
  function fanfare(){ // 勝利ファンファーレ（SE的に鳴らす）
    if (!ensure()) return; resume();
    bgmStop();
    const t = ctx.currentTime;
    [[523,0],[523,0.12],[523,0.24],[659,0.4],[784,0.62],[1047,0.86],[784,1.1],[1047,1.32]].forEach(([f,d]) => {
      tone(f, t+d, 0.22, 'square', 0.2, seGain);
      tone(f/2, t+d, 0.22, 'triangle', 0.16, seGain);
    });
  }
  return { se, bgmPlay, bgmStop, fanfare, setBgmVol, setSeVol, resume, get bgmVol(){return bgmVol;}, get seVol(){return seVol;} };
})();
window.AudioSys = AudioSys;
