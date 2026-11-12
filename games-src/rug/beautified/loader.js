// The loading bar shown while the game starts (from loading.html, driven by real progress).
// It runs in a worker on its own thread, so the heavy start-up of the game cannot make it stutter.
let boot;
addEventListener("message", function first(e) {
  removeEventListener("message", first);
  boot = e.data;
  start();
});

function start() {
  (() => {
    "use strict";
    /* ---------- constants & helpers ---------- */
    /* Logic runs in "world" units (138x30). Everything is drawn on a finer pixel grid (242x53), 4 stage px per pixel. */
    const STAGE = 1080,
      W = 138,
      H = 30,
      SCALE = 7,
      Q = 1.75,
      PIX = 4,
      PW = 242,
      PH = 53;
    const GP = 48,
      TF_P = 30,
      WALL_TOP = 13,
      GROUND = GP / Q,
      SEAT = 18 / Q;
    const BAR = { x: (STAGE - W * SCALE) / 2, y: 412, w: W * SCALE, h: H * SCALE, frame: 22 };
    const TAU = Math.PI * 2;
    const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
    const irand = (a, b) => Math.floor(rand(a, b + 1));
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const smooth = (t) => {
      t = clamp(t, 0, 1);
      return t * t * (3 - 2 * t);
    };
    const seeded = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const mk = (w, h) => new OffscreenCanvas(w, h);
    const X = (v) => Math.round(v * Q);

    const cv = boot.canvas;
    const ctx = cv.getContext("2d");
    const nextFrame = self.requestAnimationFrame
      ? (f) => self.requestAnimationFrame(f)
      : (f) => setTimeout(() => f(performance.now()), 16);
    const low = mk(PW, PH),
      g = low.getContext("2d");

    const px = (x, y, c) => {
      g.fillStyle = c;
      g.fillRect(x | 0, y | 0, 1, 1);
    };
    const rect = (x, y, w, h, c) => {
      g.fillStyle = c;
      g.fillRect(x | 0, y | 0, w | 0, h | 0);
    };
    function line(x0, y0, x1, y1, c, G = g) {
      x0 |= 0;
      y0 |= 0;
      x1 |= 0;
      y1 |= 0;
      const dx = Math.abs(x1 - x0),
        dy = -Math.abs(y1 - y0),
        sx = x0 < x1 ? 1 : -1,
        sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      G.fillStyle = c;
      for (let i = 0; i < 400; i++) {
        G.fillRect(x0, y0, 1, 1);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) {
          e += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          e += dx;
          y0 += sy;
        }
      }
    }

    /* palette: clear blue sky against warm terracotta */
    const C = {
      ink: "#23263f",
      sky: ["#3f86dc", "#4c96e4", "#5ca6ea", "#70b6ef", "#88c6f3", "#a2d5f6", "#bfe3f8", "#dcf0f8"],
      sun: "#fffbe6",
      sunRim: "#fff0b8",
      far: "#b4d4ee",
      farD: "#a3c7e6",
      near: "#92b9de",
      nearD: "#7fa8d2",
      win: "#eaf6ff",
      steel: "#3d4468",
      steelL: "#8a93b5",
      crane: "#4c5680",
      craneL: "#8592b8",
      craneD: "#343c60",
      brick: ["#b4553f", "#c2634a", "#a54b3a", "#bc5b40", "#ad5240"],
      brickHi: "#e38d62",
      brickLo: "#7f3a37",
      mortar: "#5c3540",
      dirt: "#5a3c3a",
      dirtL: "#74504a",
      dirtT: "#a37a58",
      gravel: "#8e6a58",
      hut: "#2f7f86",
      hutL: "#46a0a2",
      hutD: "#215c68",
      roof: "#27405e",
      roofL: "#4a6a8c",
      wood: "#c4945a",
      woodD: "#83603f",
      cement: "#a6aab0",
      cementL: "#d2d5d8",
      cementD: "#73777f",
      drum: "#e0603a",
      drumL: "#f4895a",
      drumD: "#a33f33",
      amber: "#ffb020",
      red: "#ff4e45",
      hat: "#ffcb3a",
      hatL: "#ffe98c",
      hatD: "#dc9c28",
      boot: "#2c2838",
      pants: "#39457c",
      pantsD: "#2b3461",
      sign: "#fff6e0",
      signD: "#dcc9a6",
      tape: "#f4ead2",
      tapeLit: "#ffc62e",
      tapeD: "#b98f3a",
      white: "#fffdf4",
      dust: ["#f3e0c4", "#d9bda2", "#b0958a"],
      smoke: ["#ffffff", "#e2e9f2", "#c2cede"],
      confetti: ["#ff5a6e", "#ffc93f", "#2fd6b4", "#5a78ff", "#ff8a3c", "#ffffff", "#c56bff"],
    };

    /* 5x7 digits + a wide percent sign for the foreman's placard */
    const FONT = {
      0: "01110100011001110101110011000101110",
      1: "00100011000010000100001000010001110",
      2: "01110100010000100110010001000011111",
      3: "11110000010000101110000010000111110",
      4: "00010001100101010010111110001000010",
      5: "11111100001111000001000011000101110",
      6: "00110010001000011110100011000101110",
      7: "11111000010001000100010000100001000",
      8: "01110100011000101110100011000101110",
      9: "01110100011000101111000010001001100",
    };
    const PCT = ["1100001", "1100010", "0000100", "0001000", "0010000", "0100011", "1000011"];
    function glyph(ch, x, y, c) {
      g.fillStyle = c;
      if (ch === "%") {
        PCT.forEach((r, j) => {
          for (let i = 0; i < 7; i++) if (r[i] === "1") g.fillRect(x + i, y + j, 1, 1);
        });
        return;
      }
      const b = FONT[ch];
      if (!b) return;
      for (let i = 0; i < 35; i++) if (b[i] === "1") g.fillRect(x + (i % 5), y + ((i / 5) | 0), 1, 1);
    }

    /* ---------- baked pixel layers ---------- */
    const BAYER = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    const layerSky = mk(PW, PH),
      layerRig = mk(PW, PH),
      layerFront = mk(PW, PH);
    const HUT = { x: 208, w: 24, top: 27 };

    (function bake() {
      /* sky: smooth bands, dithered only where they meet */
      let G = layerSky.getContext("2d");
      for (let y = 0; y < PH; y++)
        for (let x = 0; x < PW; x++) {
          const t = clamp(y / GP, 0, 0.999) * (C.sky.length - 1),
            i = t | 0,
            f = clamp((t - i - 0.34) / 0.32, 0, 1);
          G.fillStyle = C.sky[f > (BAYER[y & 3][x & 3] + 0.5) / 16 ? i + 1 : i];
          G.fillRect(x, y, 1, 1);
        }
      /* high sun */
      const sx = 178,
        sy = 10;
      for (let y = 0; y < 30; y++)
        for (let x = sx - 20; x < sx + 20; x++) {
          const d = Math.hypot(x - sx, y - sy);
          if (d < 6.5) G.fillStyle = C.sun;
          else if (d < 8) G.fillStyle = C.sunRim;
          else if (d < 13 && (13 - d) / 5 > ((BAYER[y & 3][x & 3] + 0.5) / 16) * 1.3) G.fillStyle = "#dff1fb";
          else continue;
          G.fillRect(x, y, 1, 1);
        }
      /* hazy skyline, kept pale so the unbuilt part of the bar reads as empty */
      let r = seeded(7),
        x = 0;
      while (x < PW) {
        const w = 7 + ((r() * 12) | 0),
          h = 7 + ((r() * 12) | 0);
        G.fillStyle = C.far;
        G.fillRect(x, GP - h, w, h);
        G.fillStyle = C.farD;
        G.fillRect(x + w - 2, GP - h, 2, h);
        if (r() < 0.25) {
          G.fillStyle = C.far;
          G.fillRect(x + (w >> 1), GP - h - 4, 1, 4);
        }
        x += w;
      }
      r = seeded(41);
      x = -2;
      while (x < PW) {
        const w = 9 + ((r() * 13) | 0),
          h = 3 + ((r() * 9) | 0);
        G.fillStyle = C.near;
        G.fillRect(x, GP - h, w, h);
        G.fillStyle = C.nearD;
        G.fillRect(x + w - 2, GP - h, 2, h);
        for (let wy = GP - h + 2; wy < GP - 2; wy += 3)
          for (let wx = x + 2; wx < x + w - 3; wx += 3)
            if (r() < 0.3) {
              G.fillStyle = C.win;
              G.fillRect(wx, wy, 1, 2);
            }
        x += w;
      }

      /* tower crane and site hut sit BEHIND the wall */
      G = layerRig.getContext("2d");
      const mx = 136;
      /* mast: two rails with X bracing */
      G.fillStyle = C.craneD;
      G.fillRect(mx, 15, 1, GP - 15);
      G.fillRect(mx + 6, 15, 1, GP - 15);
      G.fillStyle = C.crane;
      G.fillRect(mx + 1, 15, 1, GP - 15);
      G.fillRect(mx + 5, 15, 1, GP - 15);
      for (let y = 15; y < GP - 1; y += 8) {
        line(mx + 1, y, mx + 5, y + 7, C.craneD, G);
        line(mx + 5, y, mx + 1, y + 7, C.crane, G);
      }
      /* jib */
      G.fillStyle = C.craneD;
      G.fillRect(42, 5, 192, 1);
      G.fillStyle = C.crane;
      G.fillRect(42, 3, 192, 2);
      G.fillStyle = C.craneL;
      G.fillRect(42, 3, 192, 1);
      G.fillStyle = C.craneD;
      for (let i = 42; i < 234; i += 5) {
        G.fillRect(i, 6, 2, 1);
      }
      /* counterweights */
      G.fillStyle = C.steel;
      G.fillRect(44, 7, 18, 8);
      G.fillStyle = C.steelL;
      G.fillRect(45, 8, 7, 2);
      G.fillRect(53, 8, 7, 2);
      /* tie rods */
      line(mx + 3, 0, 72, 2, C.steel, G);
      line(mx + 3, 0, 216, 2, C.steel, G);
      /* operator cab */
      G.fillStyle = C.crane;
      G.fillRect(126, 7, 16, 9);
      G.fillStyle = C.craneL;
      G.fillRect(126, 7, 16, 1);
      G.fillStyle = C.craneD;
      G.fillRect(126, 15, 16, 1);
      G.fillStyle = "#ffe9a8";
      G.fillRect(128, 9, 12, 5);
      /* hut */
      const hx = HUT.x,
        hw = HUT.w;
      G.fillStyle = C.steel;
      G.fillRect(hx + 3, 19, 4, 9);
      G.fillStyle = C.steelL;
      G.fillRect(hx + 2, 18, 6, 1);
      G.fillStyle = C.hut;
      G.fillRect(hx, 30, hw, GP - 30);
      G.fillStyle = C.hutL;
      for (let i = hx; i < hx + hw; i += 4) G.fillRect(i, 30, 2, GP - 30);
      G.fillStyle = C.hutD;
      G.fillRect(hx, GP - 1, hw, 1);
      G.fillStyle = C.roof;
      G.fillRect(hx - 2, HUT.top, hw + 4, 3);
      G.fillStyle = C.roofL;
      G.fillRect(hx - 2, HUT.top, hw + 4, 1);
      G.fillStyle = C.hutD;
      G.fillRect(hx + 15, 34, 7, GP - 34);
      G.fillStyle = C.hut;
      G.fillRect(hx + 16, 35, 5, GP - 36);
      G.fillStyle = C.amber;
      G.fillRect(hx + 16, 41, 1, 1);
      G.fillStyle = C.roof;
      G.fillRect(hx + 3, 33, 10, 8);

      /* foreground props */
      G = layerFront.getContext("2d");
      /* brick pallet at the start of the wall */
      G.fillStyle = C.woodD;
      G.fillRect(10, GP - 1, 18, 1);
      G.fillStyle = C.wood;
      G.fillRect(10, GP - 2, 18, 1);
      [
        [10, GP - 6],
        [16, GP - 6],
        [22, GP - 6],
        [13, GP - 10],
        [19, GP - 10],
      ].forEach(([x, y], i) => {
        G.fillStyle = C.brick[i % 5];
        G.fillRect(x, y, 5, 3);
        G.fillStyle = C.brickHi;
        G.fillRect(x, y, 4, 1);
        G.fillStyle = C.brickLo;
        G.fillRect(x + 1, y + 2, 4, 1);
      });
      /* parked wheelbarrow with sand */
      const bx = X(94);
      G.fillStyle = C.drumD;
      G.fillRect(bx - 7, GP - 7, 14, 1);
      G.fillStyle = C.drum;
      G.fillRect(bx - 8, GP - 9, 16, 2);
      G.fillStyle = C.drumL;
      G.fillRect(bx - 8, GP - 9, 16, 1);
      G.fillStyle = C.dust[0];
      G.fillRect(bx - 6, GP - 11, 12, 2);
      G.fillStyle = C.dust[1];
      G.fillRect(bx - 4, GP - 12, 8, 1);
      G.fillStyle = C.ink;
      G.fillRect(bx + 8, GP - 4, 4, 4);
      G.fillStyle = C.steelL;
      G.fillRect(bx + 9, GP - 3, 2, 2);
      G.fillStyle = C.steel;
      G.fillRect(bx - 13, GP - 8, 6, 1);
      G.fillRect(bx - 5, GP - 6, 2, 6);
      /* traffic cones */
      [X(127), X(133)].forEach((x) => {
        G.fillStyle = C.drum;
        G.fillRect(x, GP - 9, 2, 2);
        G.fillRect(x - 1, GP - 5, 4, 3);
        G.fillStyle = C.white;
        G.fillRect(x - 1, GP - 7, 4, 2);
        G.fillStyle = C.boot;
        G.fillRect(x - 3, GP - 2, 8, 2);
      });
    })();

    /* ground with a measuring tape that lights up as the wall advances */
    function drawGround() {
      rect(0, GP, PW, PH - GP, C.dirt);
      rect(0, GP, PW, 1, C.dirtT);
      for (let i = 0; i < PW; i += 3) {
        const s = (i * 37) % 13;
        if (s < 3) px(i, PH - 1, C.gravel);
      }
      const lit = clamp(X(visFrontX()), 0, PW);
      rect(0, GP + 1, PW, 3, C.tape);
      rect(0, GP + 3, PW, 1, C.signD);
      if (lit > 0) {
        rect(0, GP + 1, lit, 3, C.tapeLit);
        rect(0, GP + 3, lit, 1, C.tapeD);
        rect(lit - 2, GP + 1, 2, 3, C.white);
      }
      for (let i = 1; i < 20; i++) {
        const x = Math.round((i * PW) / 20);
        rect(x, GP + 1, 1, i % 2 ? 1 : 2, C.ink);
      }
    }

    /* ---------- synthesized sound ---------- */
    const Snd = (() => {
      let ac = null,
        master,
        sfx,
        amb,
        ambSrc,
        ambFilter,
        humOsc,
        noiseBuf,
        rev,
        muted = false,
        lastStep = 0,
        rate = 1;
      const lastByName = {};
      function makeNoise() {
        const n = ac.sampleRate * 2,
          b = ac.createBuffer(1, n, ac.sampleRate),
          d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        return b;
      }
      function makeBrown() {
        const n = ac.sampleRate * 4,
          b = ac.createBuffer(1, n, ac.sampleRate),
          d = b.getChannelData(0);
        let v = 0;
        for (let i = 0; i < n; i++) {
          v = (v + (Math.random() * 2 - 1) * 0.02) / 1.01;
          d[i] = v * 3.2;
        }
        /* seam-free loop */
        const fade = (ac.sampleRate * 0.25) | 0;
        for (let i = 0; i < fade; i++) {
          const t = i / fade;
          d[i] = d[i] * t + d[n - fade + i] * (1 - t);
        }
        return b;
      }
      function start() {
        if (ac) {
          if (ac.state === "suspended") ac.resume();
          return;
        }
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.9;
        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.ratio.value = 4;
        master.connect(comp);
        comp.connect(ac.destination);
        sfx = ac.createGain();
        sfx.connect(master);
        /* tiny room so the clicks feel soft */
        rev = ac.createDelay(0.3);
        rev.delayTime.value = 0.07;
        const fb = ac.createGain();
        fb.gain.value = 0.22;
        const damp = ac.createBiquadFilter();
        damp.type = "lowpass";
        damp.frequency.value = 1800;
        const wet = ac.createGain();
        wet.gain.value = 0.25;
        sfx.connect(rev);
        rev.connect(damp);
        damp.connect(fb);
        fb.connect(rev);
        damp.connect(wet);
        wet.connect(master);
        noiseBuf = makeNoise();
        amb = ac.createGain();
        amb.gain.value = 0;
        amb.connect(master);
        ambSrc = ac.createBufferSource();
        ambSrc.buffer = makeBrown();
        ambSrc.loop = true;
        ambFilter = ac.createBiquadFilter();
        ambFilter.type = "lowpass";
        ambFilter.frequency.value = 320;
        ambSrc.connect(ambFilter);
        ambFilter.connect(amb);
        ambSrc.start();
        humOsc = ac.createOscillator();
        humOsc.type = "triangle";
        humOsc.frequency.value = 58;
        const hg = ac.createGain();
        hg.gain.value = 0.05;
        humOsc.connect(hg);
        hg.connect(amb);
        humOsc.start();
        ambience(ambLevel, 0.6);
      }
      let ambLevel = 0.34;
      function ambience(level, time = 0.25) {
        ambLevel = level;
        if (!ac) return;
        const t = ac.currentTime;
        amb.gain.cancelScheduledValues(t);
        amb.gain.setValueAtTime(amb.gain.value, t);
        amb.gain.linearRampToValueAtTime(level, t + time);
      }
      function setRate(r) {
        rate = r;
        if (!ac) return;
        ambSrc.playbackRate.setTargetAtTime(r, ac.currentTime, 0.05);
        humOsc.frequency.setTargetAtTime(58 * r, ac.currentTime, 0.05);
        ambFilter.frequency.setTargetAtTime(320 * (1 + (r - 1) * 0.9), ac.currentTime, 0.05);
      }
      function setMuted(m) {
        muted = m;
        if (ac) master.gain.setTargetAtTime(m ? 0 : 0.9, ac.currentTime, 0.03);
      }
      const ok = () => ac && ac.state === "running";
      function throttle(name, ms) {
        const n = performance.now();
        if (n - (lastByName[name] || 0) < ms / rate) return false;
        lastByName[name] = n;
        return true;
      }

      function noise(dur, freq, q, vol, type = "bandpass", delay = 0) {
        if (!ok()) return;
        const t = ac.currentTime + delay;
        const s = ac.createBufferSource();
        s.buffer = noiseBuf;
        s.playbackRate.value = rate;
        const f = ac.createBiquadFilter();
        f.type = type;
        f.frequency.value = freq * rate;
        f.Q.value = q;
        const a = ac.createGain();
        a.gain.setValueAtTime(vol, t);
        a.gain.exponentialRampToValueAtTime(0.0008, t + dur / rate);
        s.connect(f);
        f.connect(a);
        a.connect(sfx);
        s.start(t, Math.random() * 1.5, dur / rate + 0.02);
      }
      function tone(freq, dur, vol, type = "sine", delay = 0, to = null, atk = 0.003) {
        if (!ok()) return;
        const t = ac.currentTime + delay,
          d = dur / rate;
        const o = ac.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq * rate, t);
        if (to) o.frequency.exponentialRampToValueAtTime(to * rate, t + d);
        const a = ac.createGain();
        a.gain.setValueAtTime(0.0001, t);
        a.gain.exponentialRampToValueAtTime(vol, t + atk);
        a.gain.exponentialRampToValueAtTime(0.0008, t + d);
        o.connect(a);
        a.connect(sfx);
        o.start(t);
        o.stop(t + d + 0.03);
      }
      return {
        start,
        ambience,
        setRate,
        setMuted,
        get muted() {
          return muted;
        },
        brick() {
          if (!throttle("brick", 28)) return;
          const p = rand(0.86, 1.2);
          noise(0.05, 2300 * p, 2.5, 0.3);
          tone(520 * p, 0.07, 0.2, "triangle", 0, 240 * p);
          tone(170 * p, 0.06, 0.2, "sine");
        },
        step(v = 1) {
          const n = performance.now();
          if (n - lastStep < 55 / rate) return;
          lastStep = n;
          noise(0.03, rand(500, 850), 1.1, 0.075 * v, "lowpass");
        },
        thud() {
          noise(0.11, 240, 0.9, 0.55, "lowpass");
          tone(95, 0.14, 0.32, "sine", 0, 48);
        },
        whistle() {
          tone(1500, 0.42, 0.05, "sine", 0, 330, 0.04);
        },
        scrape() {
          noise(0.2, 900, 0.8, 0.12);
        },
        poke() {
          noise(0.06, 420, 1, 0.6, "lowpass");
          tone(150, 0.13, 0.45, "sine", 0, 70);
          tone(880, 0.08, 0.08, "triangle", 0.01, 1320);
        },
        startle() {
          for (let i = 0; i < 4; i++)
            tone(rand(700, 1100), 0.09, 0.05, "square", i * 0.018, rand(1300, 1700));
        },
        jump() {
          tone(420, 0.15, 0.1, "triangle", 0, 980);
        },
        slip() {
          tone(380, 0.22, 0.1, "sawtooth", 0, 1400);
          noise(0.12, 300, 0.8, 0.3, "lowpass", 0.2);
          tone(90, 0.12, 0.25, "sine", 0.2, 50);
        },
        swing() {
          noise(0.5, 600, 1.8, 0.07);
          tone(120, 0.55, 0.05, "sawtooth", 0, 190, 0.1);
        },
        pop() {
          noise(0.07, 1500, 0.7, 0.5);
          tone(240, 0.09, 0.2, "triangle", 0, 660);
        },
        place() {
          noise(0.05, 1700, 2, 0.4);
          tone(620, 0.09, 0.3, "triangle", 0, 330);
          tone(180, 0.12, 0.3, "sine");
        },
        chime() {
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
            tone(f, 0.75, 0.2, "sine", i * 0.085);
            tone(f * 2, 0.32, 0.05, "triangle", i * 0.085);
          });
        },
        cheer() {
          for (let i = 0; i < 9; i++)
            tone(rand(420, 760), 0.2, 0.04, "square", rand(0.2), rand(800, 1200), 0.02);
        },
        sad() {
          [392, 369.99, 349.23, 311.13].forEach((f, i) => {
            const l = i === 3 ? 1.15 : 0.32;
            tone(f, l, 0.17, "triangle", 0.05 + i * 0.36, i === 3 ? f * 0.82 : f * 0.97, 0.02);
          });
        },
        rumble() {
          noise(2.5, 180, 0.8, 0.26, "lowpass");
        },
        tick() {
          tone(1400, 0.03, 0.06, "sine");
        },
        munchOff() {},
      };
    })();

    /* ---------- world objects ---------- */
    const BP = 12,
      BW = 11,
      BH = 4,
      CH = 5,
      COURSES = 7;
    let bricks = [],
      order = [],
      placed = 0,
      N = 0,
      gapBrick = null;
    function buildWall() {
      bricks = [];
      for (let c = 0; c < COURSES; c++) {
        const py = GP - CH * (c + 1);
        for (let x = c % 2 ? -6 : 0; x < PW; x += BP) {
          const a = Math.max(x, 0),
            b = Math.min(x + BW, PW),
            pw = b - a;
          if (pw < 3) continue;
          bricks.push({
            px: a,
            py,
            pw,
            x: a / Q,
            y: py / Q,
            w: pw / Q,
            c,
            tone: pick(C.brick),
            hi: Math.random() < 0.5,
            lo: Math.random() < 0.4,
            sp: irand(1, Math.max(1, pw - 2)),
            on: false,
            pop: 0,
          });
        }
      }
      N = bricks.length;
      gapBrick = bricks
        .filter((b) => b.c === 2)
        .reduce((a, b) => (Math.abs(b.x - 112) < Math.abs(a.x - 112) ? b : a));
      /* nearly vertical front, so the wall advances like a fill */
      order = bricks.filter((b) => b !== gapBrick).sort((a, b) => a.x + a.c * 0.9 - (b.x + b.c * 0.9));
      order.push(gapBrick);
      placed = 0;
    }
    const nextBrick = () => order[Math.min(placed, N - 1)];
    const frontX = () => (placed >= N ? W : placed === N - 1 ? order[N - 2].x + 6 : nextBrick().x);
    const visFrontX = () =>
      S.crumble
        ? S.crumble.length
          ? S.crumble[0].x + S.crumble[0].w
          : 0
        : placed >= N
          ? W
          : placed
            ? frontX()
            : 0;
    let realP = 0,
      stopped = false;
    const realPct = () => Math.round(realP * 100);

    function drawWall() {
      for (const b of bricks) if (b.on) rect(b.px - (b.px > 0 ? 1 : 0), b.py, b.pw + 1, CH, C.mortar);
      for (const b of bricks)
        if (b.on) {
          const y = b.py + (b.pop > 0 ? -1 : 0);
          rect(b.px, y, b.pw, BH, b.pop > 0.06 ? C.brickHi : b.tone);
          if (b.pop <= 0.06) {
            rect(b.px, y, b.pw, 1, b.hi ? C.brickHi : b.tone);
            if (b.lo) rect(b.px + 1, y + BH - 1, b.pw - 1, 1, C.brickLo);
            px(b.px + b.sp, y + 2, C.brickLo);
          }
        }
    }

    /* the missing brick: dark slot, blinking hazard frame, bouncing arrow, spotlight from the crane hook */
    function drawGapHighlight() {
      const b = gapBrick,
        gx = b.px,
        gy = b.py,
        gw = b.pw;
      rect(gx - 1, gy, gw + 1, CH, C.ink);
      rect(gx, gy, gw, 1, "#10131f");
      if (S.phase === "build") return;
      const blink = (rt * 2.6) % 1 < 0.5;
      /* spotlight */
      const h = hookPos(),
        hx = X(h.x),
        hy = X(h.y) + 3,
        cx = gx + (gw >> 1);
      g.fillStyle = "#fff3b0";
      g.globalAlpha = 0.3;
      for (let y = hy; y < gy - 2; y++) {
        const u = (y - hy) / Math.max(1, gy + CH - hy),
          c = Math.round(lerp(hx, cx, u)),
          half = Math.round(lerp(1, gw / 2 + 3, u));
        g.fillRect(c - half, y, half * 2 + 1, 1);
      }
      g.globalAlpha = 1;
      /* hazard frame */
      const c1 = blink ? C.tapeLit : C.white,
        c2 = blink ? C.white : C.tapeLit;
      for (let i = -2; i < gw + 2; i++) {
        const c = ((i + 2) >> 1) & 1 ? c1 : c2;
        px(gx + i, gy - 2, c);
        px(gx + i, gy + CH, c);
      }
      for (let j = -2; j < CH + 1; j++) {
        const c = ((j + 2) >> 1) & 1 ? c1 : c2;
        px(gx - 2, gy + j, c);
        px(gx + gw + 1, gy + j, c);
      }
      /* ghost of the brick that belongs here */
      if (blink) {
        g.globalAlpha = 0.35;
        rect(gx, gy, gw, BH, C.brickHi);
        g.globalAlpha = 1;
      }
      /* bouncing arrow */
      const ay = gy - 12 + Math.round(Math.abs(Math.sin(rt * 4.4)) * -3),
        ax = gx + (gw >> 1);
      const ARW = [
        [-2, 0, 5, 5],
        [-5, 5, 11, 1],
        [-4, 6, 9, 1],
        [-3, 7, 7, 1],
        [-2, 8, 5, 1],
        [-1, 9, 3, 1],
        [0, 10, 1, 1],
      ];
      g.fillStyle = C.ink;
      for (const a of ARW) g.fillRect(ax + a[0] - 1, ay + a[1] - 1, a[2] + 2, a[3] + 2);
      g.fillStyle = C.tapeLit;
      for (const a of ARW) g.fillRect(ax + a[0], ay + a[1], a[2], a[3]);
      g.fillStyle = C.white;
      g.fillRect(ax - 1, ay + 1, 1, 4);
    }

    /* particles: fixed pool, no per-frame garbage */
    const MAXP = 420,
      parts = [];
    for (let i = 0; i < MAXP; i++) parts.push({ on: false });
    let pNext = 0;
    function spawn(type, x, y, vx, vy, life, col) {
      const p = parts[pNext];
      pNext = (pNext + 1) % MAXP;
      p.on = true;
      p.type = type;
      p.x = x;
      p.y = y;
      p.vx = vx;
      p.vy = vy;
      p.life = p.max = life;
      p.col = col;
      p.s = Math.random() * TAU;
    }
    function puff(x, y, n = 5, sp = 9) {
      for (let i = 0; i < n; i++)
        spawn("dust", x + rand(-1, 1), y + rand(-1, 1), rand(-sp, sp), rand(-sp * 0.9, -1), rand(0.28, 0.6));
    }
    function burstConfetti(cx, n) {
      for (let i = 0; i < n; i++)
        spawn(
          "confetti",
          cx + rand(-4, 4),
          rand(9, 20),
          rand(-34, 34),
          rand(-46, -6),
          rand(1.1, 2.3),
          pick(C.confetti),
        );
    }
    function updateParts(dt) {
      for (const p of parts) {
        if (!p.on) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.on = false;
          continue;
        }
        switch (p.type) {
          case "dust":
            p.vx *= 1 - 3.5 * dt;
            p.vy = p.vy * (1 - 3 * dt) - 4 * dt;
            break;
          case "smoke":
            p.vx += Math.sin(p.s + p.life * 3) * 5 * dt;
            p.vy *= 1 - 0.2 * dt;
            break;
          case "confetti":
            p.vy += 62 * dt;
            p.vx *= 1 - 1.6 * dt;
            p.vy *= 1 - 1.3 * dt;
            p.x += Math.sin(p.s + p.life * 9) * 11 * dt;
            if (p.y > GROUND - 1) {
              p.y = GROUND - 1;
              p.vy *= -0.2;
              p.vx *= 0.4;
            }
            break;
          case "crumb":
          case "sweat":
            p.vy += 70 * dt;
            break;
          case "z":
            p.x += Math.sin(p.life * 3 + p.s) * 4 * dt;
            break;
          case "star":
            p.s += dt * 9;
            break;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    function drawParts() {
      for (const p of parts) {
        if (!p.on) continue;
        const a = p.life / p.max,
          x = X(p.x),
          y = X(p.y);
        switch (p.type) {
          case "dust": {
            const c = C.dust[a > 0.6 ? 0 : a > 0.3 ? 1 : 2],
              s = a > 0.65 ? 3 : a > 0.3 ? 2 : 1;
            rect(x, y, s, s, c);
            if (a > 0.5) px(x + s, y + 1, c);
            break;
          }
          case "smoke": {
            const c = C.smoke[a > 0.66 ? 0 : a > 0.33 ? 1 : 2],
              s = a > 0.7 ? 2 : a > 0.3 ? 3 : 4;
            if (a > 0.18 || (x + y) & 1) rect(x, y - s + 1, s, s, c);
            break;
          }
          case "confetti": {
            const flip = Math.sin(p.s + p.life * 14) > 0;
            rect(x, y, flip ? 3 : 1, flip ? 1 : 3, p.col);
            break;
          }
          case "crumb":
            rect(x, y, 2, 2, p.col || C.brickLo);
            break;
          case "sweat":
            px(x, y, "#ffffff");
            px(x, y + 1, "#9fdcff");
            break;
          case "z": {
            const c = a > 0.3 ? C.ink : C.dust[2];
            rect(x, y, 5, 1, c);
            px(x + 3, y + 1, c);
            px(x + 2, y + 2, c);
            px(x + 1, y + 3, c);
            rect(x, y + 4, 5, 1, c);
            break;
          }
          case "star": {
            const ox = Math.cos(p.s) * 5,
              oy = Math.sin(p.s) * 2;
            rect(x + ox, y + oy, 2, 2, C.hat);
            break;
          }
        }
      }
    }

    /* loose objects with simple bouncing */
    const loose = [];
    function addLoose(x, y, vx, vy, kind = "brick", life = 1.5) {
      loose.push({ x, y, vx, vy, kind, life, b: 0 });
    }
    function updateLoose(dt) {
      for (let i = loose.length - 1; i >= 0; i--) {
        const o = loose[i];
        o.vy += 150 * dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        const floor = GROUND - 2;
        if (o.y >= floor) {
          o.y = floor;
          if (o.vy > 18) {
            puff(o.x + 2, GROUND - 1, o.vy > 60 ? 6 : 3, 10);
            if (o.b < 1) {
              if (o.kind === "brick") Snd.thud();
              else Snd.tick();
            }
          }
          o.vy *= -0.32;
          o.vx *= 0.55;
          o.b++;
          if (Math.abs(o.vy) < 5) {
            o.vy = 0;
            o.vx *= 0.7;
          }
        }
        o.life -= dt;
        if (o.life <= 0) {
          if (o.kind === "brick")
            for (let k = 0; k < 4; k++) spawn("crumb", o.x + rand(4), o.y, rand(-14, 14), rand(-26, -6), 0.5);
          loose.splice(i, 1);
        }
      }
    }
    function drawLoose() {
      for (const o of loose) {
        const x = X(o.x),
          y = X(o.y);
        if (o.kind === "brick") {
          rect(x, y, 7, 4, C.brick[1]);
          rect(x, y, 7, 1, C.brickHi);
          rect(x + 1, y + 3, 6, 1, C.brickLo);
        } else if (o.kind === "tool") {
          rect(x, y + 2, 7, 1, C.woodD);
          rect(x + 6, y, 3, 3, C.steelL);
        } else if (o.kind === "lunch") {
          rect(x, y, 5, 3, C.drum);
        }
      }
    }

    /* ---------- crane, tower, mixer, barrow, living sky ---------- */
    const crane = {
      x: 60,
      v: 0,
      tx: 60,
      L: 9,
      tL: 9,
      th: 0.05,
      om: 0,
      load: false,
      state: "idle",
      t: 0,
      speed: 34,
      override: 0,
    };
    const JIB_Y = 4;
    const hookPos = () => ({
      x: crane.x + Math.sin(crane.th) * crane.L,
      y: JIB_Y + Math.cos(crane.th) * crane.L,
    });
    function updateCrane(dt, calm) {
      const k = crane.override > 0 ? 22 : 7,
        c = crane.override > 0 ? 7 : 5.2;
      const a = clamp((crane.tx - crane.x) * k - crane.v * c, -260, 260);
      crane.v += a * dt;
      crane.x += crane.v * dt;
      crane.x = clamp(crane.x, 36, 128);
      crane.L += (crane.tL - crane.L) * Math.min(1, dt * 3.2);
      const g0 = 120,
        L = Math.max(3, crane.L);
      crane.om +=
        (-(g0 / L) * Math.sin(crane.th) - (a / L) * Math.cos(crane.th) * 0.9 - 0.32 * crane.om) * dt;
      crane.th += crane.om * dt;
      crane.th += Math.sin(simT * 1.3) * 0.0006;
      crane.th = clamp(crane.th, -1.1, 1.1);
      if (crane.override > 0) {
        crane.override -= dt;
        return;
      }
      if (calm) {
        if (S.phase === "stall" || S.phase === "scramble") {
          crane.tx = gapBrick.x + gapBrick.w / 2;
          crane.tL = 7;
        } else if (S.phase !== "freeze") {
          crane.tx = lerp(crane.tx, 56, dt * 0.3);
          crane.tL = 9;
        }
        return;
      }
      crane.t -= dt;
      if (crane.t > 0) return;
      const fx = clamp(frontX() + 4, 40, 126);
      switch (crane.state) {
        case "idle":
          crane.state = "toPick";
          crane.tx = rand(38, 48);
          crane.tL = 7;
          crane.t = 1.5;
          break;
        case "toPick":
          crane.state = "lower";
          crane.tL = 15;
          crane.t = 0.7;
          break;
        case "lower":
          crane.load = true;
          crane.state = "lift";
          crane.tL = 6;
          crane.t = 0.7;
          break;
        case "lift":
          crane.state = "carry";
          crane.tx = fx;
          crane.t = 1.6;
          break;
        case "carry":
          crane.state = "drop";
          crane.tL = 10;
          crane.t = 0.6;
          break;
        case "drop": {
          crane.load = false;
          const h = hookPos();
          puff(h.x, h.y + 3, 3, 5);
          Snd.tick();
          crane.state = "idle";
          crane.tL = 6;
          crane.t = rand(0.3, 1);
          break;
        }
      }
    }
    function drawCraneDynamic() {
      const h = hookPos(),
        tx = X(crane.x),
        hx = X(h.x),
        hy = X(h.y);
      rect(tx - 4, 7, 9, 2, C.steel);
      rect(tx - 3, 7, 7, 1, C.steelL);
      rect(tx - 4, 9, 2, 1, C.ink);
      rect(tx + 3, 9, 2, 1, C.ink);
      line(tx, 9, hx, hy, C.ink);
      rect(hx - 2, hy, 5, 2, C.amber);
      rect(hx - 2, hy, 5, 1, C.hatL);
      px(hx, hy + 2, C.ink);
      px(hx, hy + 3, C.ink);
      px(hx + 1, hy + 4, C.ink);
      px(hx + 2, hy + 3, C.ink);
      if (crane.load) {
        line(hx, hy + 3, hx - 8, hy + 7, C.ink);
        line(hx, hy + 3, hx + 8, hy + 7, C.ink);
        for (let r = 0; r < 2; r++)
          for (let i = 0; i < 3; i++) {
            const bx = hx - 8 + i * 6 - (r ? 0 : 0),
              by = hy + 7 + r * 4;
            rect(bx, by, 5, 3, C.brick[(i + r) % 5]);
            rect(bx, by, 5, 1, C.brickHi);
          }
        rect(hx - 9, hy + 15, 19, 2, C.woodD);
        rect(hx - 9, hy + 15, 19, 1, C.wood);
      }
      rect(138, 0, 3, 2, (simT * 1.6) % 1 < 0.5 ? C.red : C.drumD);
    }

    const tower = { x: 6, tx: 6, wheel: 0 };
    const TOWER_W = 13,
      TOWER_FLOOR = TF_P / Q;
    function updateTower(dt, tgt) {
      tower.tx = tgt;
      const d = tower.tx - tower.x,
        sp = Math.abs(d) > 30 ? 120 : S.phase === "build" ? (S.pct > 70 ? 90 : 44) : 70;
      const mv = clamp(d, -sp * dt, sp * dt);
      tower.x += mv;
      tower.wheel += mv * 0.7;
      if (Math.abs(mv) > 0.1 && Math.random() < dt * 3) Snd.tick();
    }
    function drawTower() {
      const x = X(tower.x),
        tw = X(TOWER_W);
      if (x > PW + 4) return;
      for (const lx of [x, x + tw - 2]) {
        rect(lx, 20, 2, GP - 22, C.steelL);
        rect(lx, 20, 1, GP - 22, C.steel);
      }
      line(x + 1, GP - 3, x + tw - 2, TF_P + 2, C.steel);
      line(x + tw - 2, GP - 3, x + 1, TF_P + 2, C.steelL);
      rect(x - 2, TF_P, tw + 4, 2, C.wood);
      rect(x - 2, TF_P + 1, tw + 4, 1, C.woodD);
      for (let i = x; i < x + tw; i += 6) px(i, TF_P, C.woodD);
      rect(x, 20, tw, 1, C.steelL);
      line(x + 1, 20, x + tw - 2, 24, C.steel);
      for (const wx of [x - 1, x + tw - 3]) {
        rect(wx, GP - 4, 4, 4, C.ink);
        px(wx + 1 + ((tower.wheel | 0) & 1), GP - 3, C.amber);
      }
      if (S.pct < 98)
        for (let i = 0; i < 2; i++) {
          const by = TF_P - 4 - i * 4;
          rect(x + tw - 8, by, 6, 3, C.brick[i]);
          rect(x + tw - 8, by, 6, 1, C.brickHi);
        }
    }

    const MIX = { x: 60 };
    function drawMixer(spin) {
      const x = X(MIX.x),
        jolt = Math.sin(simT * 26) > 0 && spin ? 1 : 0,
        cy = 33 + jolt;
      line(x - 6, GP - 1, x - 1, cy + 7, C.steel);
      line(x + 7, GP - 1, x + 1, cy + 7, C.steel);
      rect(x - 9, GP - 5, 5, 5, C.ink);
      rect(x - 8, GP - 4, 3, 3, C.steelL);
      rect(x - 7, cy - 3, 15, 11, C.drum);
      rect(x - 6, cy - 4, 13, 1, C.drumL);
      rect(x - 6, cy + 8, 13, 1, C.drumD);
      rect(x - 7, cy + 5, 15, 3, C.drumD);
      const st = spin ? (simT * 14) | 0 : 3;
      for (let i = 0; i < 15; i++)
        if ((i + st) % 5 === 0) rect(x - 7 + i, cy - 3, 2, 11, i & 1 ? C.drumD : C.drumL);
      rect(x - 7, cy - 7, 9, 3, C.steel);
      rect(x - 5, cy - 9, 6, 2, C.ink);
      rect(x - 5, cy - 7, 5, 1, C.cementD);
      if (spin && Math.random() < 0.06)
        spawn("crumb", MIX.x - 1, (cy - 9) / Q, rand(-8, 8), rand(-14, -4), 0.4, C.cementL);
    }

    const barrow = { x: 56, tip: 0, full: true, f: 1 };
    function drawBarrow() {
      const x = X(barrow.x),
        t = barrow.tip * 2,
        f = barrow.f,
        R = (dx, y, w, h, c) => rect(f > 0 ? x + dx : x - dx - w + 1, y, w, h, c);
      R(-7, GP - 8 - t, 16, 2, C.drum);
      R(-7, GP - 8 - t, 16, 1, C.drumL);
      R(-5, GP - 6 - t, 12, 1, C.drumD);
      R(-3, GP - 5 - t, 8, 1, C.steel);
      if (barrow.full) {
        R(-6, GP - 10 - t, 14, 2, C.cement);
        R(-3, GP - 11 - t, 8, 1, C.cementL);
        R(-2, GP - 10 - t, 5, 1, C.cementL);
      }
      R(9, GP - 4, 4, 4, C.ink);
      R(10, GP - 3, 2, 2, C.steelL);
      R(-12, GP - 7 - t, 6, 1, C.steelL);
    }

    const puddle = { on: false, x: 0, t: 0 };
    function drawPuddle() {
      if (!puddle.on) return;
      const x = X(puddle.x);
      rect(x - 7, GP - 1, 15, 2, C.cementD);
      rect(x - 5, GP - 2, 11, 2, C.cement);
      rect(x - 2, GP - 2, 4, 1, C.cementL);
    }

    /* living sky: drifting clouds, a flock, the hut's smoke, a cat */
    const clouds = [
      [24, 6, 32],
      [104, 3, 42],
      [196, 9, 26],
    ];
    const birds = { x: -20, y: 10, t: 9 };
    function drawCloud(x, y, w) {
      rect(x + 4, y, w - 10, 1, C.white);
      rect(x + 2, y + 1, w - 4, 2, C.white);
      rect(x, y + 3, w, 2, C.white);
      rect(x + 1, y + 5, w - 3, 1, "#dcebf7");
      rect(x + 6, y + 6, w - 14, 1, "#bfd6ec");
    }
    function drawSkyLife() {
      for (const c of clouds) drawCloud(Math.round(c[0]), c[1], c[2]);
      if (birds.x < PW + 10)
        for (let i = 0; i < 4; i++) {
          const bx = (birds.x - i * 8) | 0,
            by = (birds.y + (i % 2) * 3) | 0,
            up = Math.sin(simT * 9 + i) > 0;
          rect(bx, by, 1, 1, C.ink);
          rect(bx - 2, by + (up ? -1 : 0), 2, 1, C.ink);
          rect(bx + 1, by + (up ? -1 : 0), 2, 1, C.ink);
        }
    }
    function updateSkyLife(dt) {
      for (const c of clouds) {
        c[0] += dt * 1;
        if (c[0] > PW + 2) c[0] = -c[2] - 2;
      }
      birds.x += dt * 16;
      birds.y += Math.sin(simT * 0.8) * dt * 1.3;
      if (birds.x > PW + 40) {
        birds.t -= dt;
        if (birds.t <= 0) {
          birds.x = -24;
          birds.y = rand(5, 11);
          birds.t = rand(6, 14);
        }
      }
    }
    function drawHutLifeBack() {
      const wall = X(visFrontX());
      const covered = wall > HUT.x + 6;
      if (!covered) {
        const flick = Math.sin(simT * 11) + Math.sin(simT * 17.3) > 1.5,
          wx = HUT.x + 4;
        rect(wx, 34, 8, 6, flick ? "#ffb765" : "#ffe29a");
        rect(wx + 3, 34, 2, 6, C.roof);
        rect(wx, 36, 8, 1, C.roof);
        if (Math.sin(simT * 0.35) > 0.7) rect(wx + 5, 37, 3, 3, C.steel);
        if (Math.random() < 0.14)
          spawn("smoke", (HUT.x + 5) / Q, 17 / Q, rand(-0.6, 0.8), rand(-8, -5), rand(1.1, 1.9));
      }
      /* the cat moves up onto the wall once the hut is bricked over */
      const cx = covered ? HUT.x + 8 : HUT.x + 18,
        cy = covered ? WALL_TOP - 1 : HUT.top - 1;
      rect(cx, cy - 3, 6, 4, C.ink);
      rect(cx, cy - 5, 1, 2, C.ink);
      rect(cx + 4, cy - 5, 1, 2, C.ink);
      rect(cx, cy - 4, 5, 2, C.ink);
      px(cx + (hookPos().x * Q > cx + 3 ? 4 : 0), cy - 3, C.amber);
      const tail = Math.sin(simT * 2.2) > 0.4 ? 1 : 0;
      rect(cx + 6, cy - 1 - tail, 2, 1, C.ink);
      rect(cx + 7, cy - 3 - tail, 1, 3, C.ink);
    }
    function drawLamps() {
      const x = X(130);
      rect(x, GP - 13, 2, 3, (simT * 2.1) % 1 < 0.45 ? C.amber : C.drumD);
      rect(x - 2, GP - 10, 6, 1, C.white);
      rect(x, GP - 9, 2, 3, C.steel);
    }

    const hats = [];

    /* ---------- workers: pose & pixels ---------- */
    const sx = [],
      sy = [],
      sc = [];
    let sn = 0;
    const sp = (x, y, c) => {
      sx[sn] = x | 0;
      sy[sn] = y | 0;
      sc[sn] = c;
      sn++;
    };
    const spR = (x, y, w, h, c) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) sp(x + i, y + j, c);
    };
    function spLine(x0, y0, x1, y1, c) {
      x0 |= 0;
      y0 |= 0;
      x1 |= 0;
      y1 |= 0;
      const dx = Math.abs(x1 - x0),
        dy = -Math.abs(y1 - y0),
        s1 = x0 < x1 ? 1 : -1,
        s2 = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (let i = 0; i < 60; i++) {
        sp(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * e;
        if (e2 >= dy) {
          e += dy;
          x0 += s1;
        }
        if (e2 <= dx) {
          e += dx;
          y0 += s2;
        }
      }
    }
    const spFat = (x0, y0, x1, y1, c) => {
      spLine(x0, y0, x1, y1, c);
      spLine(x0 + 1, y0, x1 + 1, y1, c);
    };
    const STAMP = new Uint32Array(PW * PH),
      DONE = new Uint32Array(PW * PH);
    let gen = 0;
    function flushSprite() {
      gen++;
      for (let i = 0; i < sn; i++) {
        const x = sx[i],
          y = sy[i];
        if (x >= 0 && x < PW && y >= 0 && y < PH) STAMP[x + y * PW] = gen;
      }
      g.fillStyle = C.ink;
      g.globalAlpha = 0.72;
      for (let i = 0; i < sn; i++)
        for (let d = 0; d < 4; d++) {
          const x = sx[i] + (d === 0 ? -1 : d === 1 ? 1 : 0),
            y = sy[i] + (d === 2 ? -1 : d === 3 ? 1 : 0);
          if (x < 0 || x >= PW || y < 0 || y >= PH) continue;
          const c = x + y * PW;
          if (STAMP[c] !== gen && DONE[c] !== gen) {
            DONE[c] = gen;
            g.fillRect(x, y, 1, 1);
          }
        }
      g.globalAlpha = 1;
      for (let i = sn - 1; i >= 0; i--) {
        const x = sx[i],
          y = sy[i];
        if (x < 0 || x >= PW || y < 0 || y >= PH) continue;
        const c = x + y * PW;
        if (DONE[c] === gen) continue;
        DONE[c] = gen;
        g.fillStyle = sc[i];
        g.fillRect(x, y, 1, 1);
      }
      sn = 0;
    }
    const U = (v) => Math.round(v * Q);
    function spBrick(x, y, w) {
      spR(x, y, w, 3, C.brick[1]);
      spR(x, y, w, 1, C.brickHi);
      spR(x + 1, y + 2, w - 1, 1, C.brickLo);
    }

    function drawHat(w, x, y, f) {
      if (w.hatOff) return;
      const main = w.isForeman ? "#ffffff" : C.hat,
        dark = w.isForeman ? "#d8ccb4" : C.hatD,
        hi = w.isForeman ? "#ffffff" : C.hatL;
      spR(x - 2, y - 2, 5, 2, main);
      spR(x - 3, y, 7, 1, dark);
      sp(x + f * 4, y, dark);
      sp(x + f, y - 2, hi);
      sp(x, y - 2, hi);
      sp(x, y - 1, dark);
    }

    function drawWorker(w) {
      if (w.hidden) return;
      const cx = X(w.x),
        f = w.f >= 0 ? 1 : -1,
        st = w.stance,
        body = w.color,
        skin = w.skin,
        gy = X(w.gy + w.dy);
      if (st === "lying") {
        drawLying(w, cx, gy, f);
        flushSprite();
        drawExtras(w, cx, gy);
        return;
      }
      let lf = [-1, 0],
        rf = [1, 0],
        by = 0,
        hb = [0, 2],
        hf = [f, 2],
        headDx = 0,
        headDy = 0,
        eye = "side",
        hatDy = 0;
      /* continuous walk cycle, shaped per worker by stride, bob, swing and limp */
      const a = (w.phase * TAU) / 4,
        s0 = Math.sin(a),
        c0 = Math.cos(a),
        stride = w.stride;
      switch (st) {
        case "walk":
        case "run": {
          lf = [s0 * stride, c0 > 0 ? -c0 * 0.9 : 0];
          rf = [-s0 * stride, c0 < 0 ? c0 * 0.9 : 0];
          by = -Math.abs(c0) * w.bob * 0.55;
          if (w.limp && c0 < -0.4) by = 0.7;
          const sw = s0 * w.swing * (st === "run" ? 1.6 : 1);
          if (st === "run") {
            hf = [f * 2 + sw, -1];
            hb = [-f * 2 - sw, 0];
            headDx = f * 0.6;
            lf[0] *= 1.5;
            rf[0] *= 1.5;
          } else {
            hf = [f * 0.5 + sw, 2];
            hb = [-f * 0.5 - sw, 2];
          }
          if (w.carry === "front") {
            hf = [f * 2, 0];
            hb = [f, 0];
          }
          if (w.carry === "shoulder") {
            hf = [f, -2];
            hb = [-f, 2];
          }
          if (w.carry === "overhead") {
            hf = [f, -4];
            hb = [f, -4];
          }
          if (w.carry === "barrow") {
            hf = [f * 3, 1];
            hb = [f * 3, 1];
          }
          break;
        }
        case "stand":
          hf = [f, 2];
          hb = [0, 2];
          if (w.carry === "front") {
            hf = [f * 2, 0];
            hb = [f, 0];
          }
          if (w.carry === "shoulder") {
            hf = [f, -2];
          }
          if (w.carry === "overhead") {
            hf = [f, -4];
            hb = [f, -4];
          }
          if (w.carry === "barrow") {
            hf = [f * 3, 1];
            hb = [f * 3, 1];
          }
          break;
        case "lay": {
          const am = w.aim;
          hf = [am[0], am[1]];
          hb = [f, 1];
          if (am[1] > 2) by = 1;
          if (am[1] < -2) eye = "up";
          break;
        }
        case "mix": {
          const t = w.mixT % 1;
          if (t < 0.5) {
            by = 1;
            hf = [f * 3, 2];
            hb = [f * 2, 2];
            headDy = 0.6;
          } else {
            const u = (t - 0.5) * 2;
            hf = [f * (3 - u * 2), 1 - u * 5];
            hb = [f * (2 - u), 1 - u * 3];
            headDy = u > 0.5 ? -0.5 : 0;
            eye = "up";
          }
          break;
        }
        case "point":
          hf = [f * 3.4, -1 + Math.sin(w.t * 5) * 0.6];
          hb = [-f, -3];
          break;
        case "wave": {
          const u = Math.sin(w.t * 16) > 0;
          hf = [f * 2, u ? -4 : -2];
          hb = [-f * 2, u ? -2 : -4];
          eye = "wide";
          by = u ? -0.6 : 0;
          break;
        }
        case "watch":
          hf = [f * 2, -1];
          hb = [-f, -3];
          headDy = 0.8;
          eye = "down";
          if (((w.t * 2.2) | 0) % 2) rf = [1, -0.7];
          break;
        case "stressed":
          hf = [f * 3, -2];
          hb = [-f, -3];
          eye = "wide";
          break;
        case "look":
          hf = [f, 2];
          eye = "up";
          hatDy = -1;
          break;
        case "duck":
          by = 2;
          lf = [-2, 0];
          rf = [2, 0];
          hf = [f, -3];
          hb = [-f, -3];
          headDy = 1;
          eye = "closed";
          hatDy = 0.6;
          break;
        case "startle":
          hf = [f * 3, -2];
          hb = [-f * 3, -2];
          hatDy = -2;
          eye = "wide";
          lf = [-2, 0];
          rf = [2, 0];
          break;
        case "jump":
          hf = [f * 2, -4];
          hb = [-f * 2, -4];
          hatDy = -1;
          eye = "wide";
          lf = [-1, -1];
          rf = [1, 0];
          break;
        case "cheer": {
          const u = Math.sin(w.t * 18) > 0;
          hf = [f * 2, u ? -5 : -4];
          hb = [-f * 2, u ? -4 : -5];
          eye = "happy";
          lf = [-1, u ? 0 : -1];
          rf = [1, u ? -1 : 0];
          break;
        }
        case "sit":
        case "eat":
        case "sleep": {
          const sw = Math.sin(w.t * 2.2 + w.id);
          lf = [f * (1 + sw * 0.5), 0];
          rf = [f * (1.6 - sw * 0.5), 0];
          hf = [f * 2, 1.4];
          hb = [f, 1.4];
          if (st === "eat") {
            const c = (w.t * 0.9 + w.id * 0.2) % 1;
            if (c < 0.34) {
              hf = [f * 2, -1 - c * 5];
              if (c > 0.2) eye = "happy";
            } else if (c < 0.5 && ((w.t * 12) | 0) & 1) headDy = 0.6;
          }
          if (st === "sleep") {
            headDy = 1;
            eye = "closed";
            hf = [f, 2];
            hb = [-f, 2];
            lf = [f, 0];
            rf = [f * 2, 0];
          }
          break;
        }
        case "pick":
          by = 2;
          headDy = 1.4;
          hf = [f * 3, 3];
          hb = [f * 2, 3];
          lf = [-2, 0];
          rf = [2, 0];
          eye = "down";
          break;
        case "front":
          hf = [f, 2];
          hb = [-f, 2];
          eye = "front";
          lf = [-0.6, 0];
          rf = [0.6, 0];
          break;
        case "dazed":
          by = 2;
          lf = [f * 2, 1];
          rf = [f * 3, 0];
          hf = [f * 2, 2];
          hb = [-f * 2, 2];
          eye = "closed";
          headDx = (((w.t * 5) | 0) & 1) * f * 0.6;
          break;
      }
      if (w.isForeman && !["wave", "cheer", "startle", "duck", "jump", "stressed", "dazed"].includes(st))
        hb = [-f, -3];
      if (w.attn > 0.5 && st !== "sleep") {
        eye = "up";
        hatDy = -1;
      }

      const bottom = gy - 6 + U(by),
        tall = w.tall ? 1 : 0,
        top = bottom - 4 - tall,
        shY = top + 1;
      const hy = top - 4 + U(headDy),
        hx = cx + U(headDx),
        hatY = hy - 1 + U(hatDy);
      /* back arm */
      const bhx = cx + U(hb[0]),
        bhy = shY + U(hb[1]);
      spFat(cx - 1, shY, bhx, bhy, w.shade);
      spR(bhx, bhy, 2, 2, skin);
      /* legs and boots */
      for (let i = 0; i < 2; i++) {
        const l = i ? rf : lf,
          hip = cx + (i ? 1 : -2),
          fx = hip + U(l[0]),
          fy = gy - 1 + U(l[1]);
        spFat(hip, bottom + 1, fx, Math.max(bottom + 1, fy - 1), i ? C.pants : C.pantsD);
        spR(fx, fy, 2, 1, C.boot);
        sp(fx + (f > 0 ? 2 : -1), fy, C.boot);
      }
      /* torso with hi-vis straps, belt and a shaded back */
      spR(cx - 2, top, 5, bottom - top + 1, body);
      for (let y = top; y < bottom; y++) {
        sp(cx - 1, y, w.vest);
        sp(cx + 1, y, w.vest);
      }
      spR(cx - 2, bottom, 5, 1, C.boot);
      sp(cx, bottom, C.amber);
      for (let y = top; y < bottom; y++) sp(cx - 2 * f, y, w.shade);
      /* head */
      if (eye === "front") {
        spR(hx - 3, hy - 1, 7, 5, skin);
        const blink = (simT + w.id * 0.7) % 3.1 < 0.12;
        if (!blink) {
          spR(hx - 2, hy, 2, 2, C.ink);
          spR(hx + 1, hy, 2, 2, C.ink);
          sp(hx - 2, hy, C.white);
          sp(hx + 1, hy, C.white);
        }
        spR(hx - 2, hy + 3, 5, 1, w.shade);
        drawHat(w, hx, hy - 2, 1);
      } else {
        spR(hx - 2, hy, 5, 4, skin);
        for (let y = hy; y < hy + 3; y++) sp(hx - 2 * f, y, w.hair);
        sp(hx + 3 * f, hy + 2, skin);
        if (eye === "closed") {
          sp(hx + f, hy + 1, w.shade);
          sp(hx + 2 * f, hy + 1, w.shade);
        } else if (eye === "happy") {
          sp(hx + f, hy, C.ink);
          sp(hx + 2 * f, hy + 1, C.ink);
          spR(hx + (f > 0 ? 0 : -2), hy + 3, 3, 1, C.white);
        } else if (eye === "wide") {
          sp(hx + f, hy, C.white);
          sp(hx + 2 * f, hy, C.white);
          sp(hx + f, hy + 1, C.white);
          sp(hx + 2 * f, hy + 1, C.ink);
          sp(hx + 2 * f, hy + 3, C.ink);
        } else if (eye === "up") {
          sp(hx + f, hy, C.white);
          sp(hx + 2 * f, hy, C.ink);
          sp(hx + f, hy + 3, w.shade);
        } else if (eye === "down") {
          sp(hx + 2 * f, hy + 2, C.ink);
          sp(hx + f, hy + 3, w.shade);
        } else {
          const blink = (simT + w.id * 0.53) % 2.7 < 0.1;
          if (!blink) {
            sp(hx + f, hy + 1, C.white);
            sp(hx + 2 * f, hy + 1, C.ink);
          }
          sp(hx + f, hy + 3, w.shade);
        }
        if (w.isForeman) {
          sp(hx + 2 * f, hy + 2, "#6b5a4c");
          sp(hx + 3 * f, hy + 3, "#6b5a4c");
          sp(hx + f, hy + 2, "#6b5a4c");
        }
        drawHat(w, hx, hatY, f);
      }
      /* front arm */
      const hX = cx + U(hf[0]),
        hY = shY + U(hf[1]);
      spFat(cx, shY, hX, hY, body);
      spR(hX, hY, 2, 2, skin);
      if (st === "watch") {
        sp(hX, hY + 2, C.amber);
        sp(hX + 1, hY + 2, C.white);
      }
      w.hand[0] = (hX + 1) / Q;
      w.hand[1] = hY / Q;
      w.hand2P = bhx;
      /* what they carry */
      if (w.carry === "front") {
        spBrick(hX + (f > 0 ? 1 : -6), hY - 3, 7);
        spBrick(hX + (f > 0 ? 0 : -5), hY - 6, 7);
      }
      if (w.carry === "shoulder") {
        spBrick(cx - (f > 0 ? 2 : 4), shY - 4, 7);
        spBrick(cx - (f > 0 ? 1 : 5), shY - 7, 7);
      }
      if (w.carry === "overhead") {
        spBrick(hX - 4, hY - 4, 9);
      }
      if (w.carry === "shovel" || st === "mix") {
        const t = (w.mixT || 0) % 1,
          up = st === "mix" && t >= 0.5,
          ex = hX + f * (up ? 2 : 7),
          ey = hY + (up ? -5 : 3);
        spLine(hX, hY, ex, ey, C.woodD);
        spR(ex + (f > 0 ? 0 : -3), ey, 4, 3, C.steelL);
      }
      if (st === "lay") {
        spR(hX + (f > 0 ? 2 : -3), hY, 3, 1, C.steelL);
        spR(hX + (f > 0 ? 4 : -4), hY - 1, 2, 1, C.white);
      }
      if (w.isForeman) spLine(bhx, bhy, bhx, WALL_TOP - 1, C.woodD);
      if (w.lunch && (st === "eat" || st === "sit")) {
        const bx = cx + (f > 0 ? 2 : -6),
          by2 = bottom - 2;
        spR(bx, by2, 5, 3, C.drum);
        spR(bx, by2, 5, 1, C.drumL);
        spR(bx + 1, by2 - 1, 3, 1, C.white);
        sp(bx + 1, by2 - 2, C.hat);
        sp(bx + 2, by2 - 2, C.drumD);
      }
      flushSprite();
      drawExtras(w, cx, gy);
    }
    function drawLying(w, cx, gy, f) {
      const r = gy - 3;
      spR(cx + (f > 0 ? -6 : 2), r - 1, 5, 4, w.color);
      spR(cx + (f > 0 ? -1 : -3), r, 5, 2, C.pants);
      spR(cx + (f > 0 ? 4 : -6), r - 3, 3, 2, C.boot);
      spR(cx + (f > 0 ? 3 : -5), r - 1, 2, 2, C.pants);
      spR(cx + (f > 0 ? -11 : 7), r - 1, 5, 4, w.skin);
      sp(cx + (f > 0 ? -9 : 9), r, C.ink);
      if (!w.hatOff) {
        spR(cx + (f > 0 ? -13 : 12), r - 2, 2, 6, C.hat);
        spR(cx + (f > 0 ? -14 : 14), r - 3, 1, 8, C.hatD);
      }
      spR(cx + (f > 0 ? -3 : 1), r - 5, 2, 5, w.skin);
    }
    function drawExtras(w, cx, gy) {
      if (w.exclaim > 0) {
        const x = cx,
          y = gy - 27;
        g.fillStyle = C.ink;
        g.fillRect(x - 1, y - 1, 4, 10);
        g.fillStyle = C.white;
        g.fillRect(x, y, 2, 5);
        g.fillRect(x, y + 6, 2, 2);
      }
    }
    function drawCraneOp(w) {
      const x = 130 + Math.round(clamp((crane.x - 78) / 30, -1, 1) * 2),
        stare = w.stance === "front";
      rect(x, 10, 6, 4, w.skin);
      rect(x, 8, 6, 2, C.hat);
      rect(x - 1, 9, 8, 1, C.hatD);
      if (stare) {
        rect(x + 1, 11, 1, 2, C.ink);
        rect(x + 4, 11, 1, 2, C.ink);
      } else rect(x + (crane.x > 78 ? 4 : 1), 11, 1, 1, C.ink);
    }
    /* foreman's percent placard */
    function drawSign(w) {
      if (w.hidden) return;
      const txt = String(S.shown) + "%",
        tw = (txt.length - 1) * 6 + 7,
        sw = tw + 6,
        bob = w.bump > 0 ? -1 : 0;
      const left = clamp(
          (w.hand2P || 0) - (sw >> 1) + Math.round(Math.sin(simT * 1.8) * 0.7),
          3,
          PW - sw - 3,
        ),
        top = 1 + bob;
      rect(left - 1, top - 1, sw + 2, 14, C.ink);
      rect(left, top, sw, 12, C.sign);
      rect(left, top + 11, sw, 1, C.signD);
      rect(left, top, sw, 1, C.white);
      let x = left + 3;
      const c = S.shown === 99 ? C.drumD : C.ink;
      for (const ch of txt) {
        glyph(ch, x, top + 3, c);
        x += ch === "%" ? 8 : 6;
      }
    }

    /* ---------- the crew ---------- */
    let simT = 0;
    const S = {
      phase: "build",
      t: 0,
      pct: 0,
      shown: 0,
      pokes: 0,
      update: 1,
      placeT: 1.1,
      ev: 0,
      jumpT: 0,
      swing: null,
      seq: 0,
      crumble: null,
      lastBrick: null,
      status: "",
      starting: true,
    };
    const SKINS = ["#f2c6a0", "#c98c5f", "#8a5a3c", "#e8b48c"];
    const mkW = (id, role, x, color, vest, shade, skin, o = {}) =>
      Object.assign(
        {
          id,
          role,
          x,
          gy: GROUND,
          dy: 0,
          vy: 0,
          air: false,
          f: 1,
          phase: rand(4),
          t: rand(10),
          stance: "stand",
          act: null,
          carry: null,
          attn: 0,
          attnDir: 1,
          hand: [0, 0],
          hand2: [0, 0],
          exclaim: 0,
          lunch: 0,
          hatOff: false,
          state: "",
          timer: 0,
          hidden: false,
          plan: "",
          planT: 0,
          aim: [-3, 0],
          bump: 0,
          looking: false,
          color,
          vest,
          shade,
          skin,
          stride: 1,
          bob: 1,
          swing: 1,
          cadence: 0.55,
          limp: false,
          tall: false,
          isForeman: false,
          layT: 0,
          mixT: rand(1),
          seat: 0,
          sleeper: false,
          zT: 0,
          attnT: 0,
          attnCd: 0,
          hair: "#4a3328",
          hand2P: 0,
        },
        o,
      );
    const crew = [
      mkW(0, "foreman", 36, "#e9e3d3", "#ff7a3c", "#b7ae9b", SKINS[0], {
        isForeman: true,
        tall: true,
        bob: 0,
        cadence: 0.45,
        hair: "#8d8378",
      }),
      mkW(1, "layerLow", 24, "#f07f2e", "#ffe2a0", "#b95a22", SKINS[1], {
        cadence: 0.7,
        stride: 1,
        bob: 1,
        seat: 35,
        hair: "#2a2230",
      }),
      mkW(2, "layerHigh", 25, "#2fa7a0", "#d8fff0", "#1f7a78", SKINS[3], {
        gy: TOWER_FLOOR,
        cadence: 0.6,
        seat: 49,
        bob: 0,
      }),
      mkW(3, "crane", 78, "#d6453d", "#ffe2a0", "#9b312e", SKINS[2]),
      mkW(4, "mixer", 68, "#3f6fd0", "#ffe2a0", "#2c4e98", SKINS[2], { f: -1, seat: 107, hair: "#2a2230" }),
      mkW(5, "carrier", 32, "#d6453d", "#ffd27a", "#9b312e", SKINS[0], {
        carry: "front",
        stride: 2,
        bob: 1,
        cadence: 0.62,
        swing: 1,
        seat: 63,
      }),
      mkW(6, "carrier", 44, "#8a5cc4", "#e8d6ff", "#60408f", SKINS[1], {
        carry: "shoulder",
        stride: 1,
        bob: 0,
        cadence: 0.85,
        swing: 0,
        limp: true,
      }),
      mkW(7, "barrow", 60, "#34a35c", "#e9ffc9", "#217a43", SKINS[3], {
        carry: "barrow",
        stride: 1,
        bob: 1,
        cadence: 0.5,
        seat: 93,
        sleeper: true,
        hair: "#b5683a",
      }),
    ];
    const [FOREMAN, LOW, HIGH, OP, MIXER, CAR1, CAR2, BARROW] = crew;
    const SPOTS = {
      [FOREMAN.id]: 82,
      [BARROW.id]: 88,
      [LOW.id]: 94,
      [HIGH.id]: 100,
      [CAR1.id]: 106,
      [MIXER.id]: 130,
    };

    function resetCrew() {
      const xs = { 0: 40, 1: 10, 2: 11, 3: 78, 4: 68, 5: 20, 6: 28, 7: 74 };
      for (const w of crew) {
        w.x = xs[w.id];
        w.gy = w === HIGH ? TOWER_FLOOR : GROUND;
        w.dy = 0;
        w.vy = 0;
        w.air = false;
        w.act = null;
        w.hidden = false;
        w.plan = "";
        w.lunch = 0;
        w.hatOff = false;
        w.state = "";
        w.exclaim = 0;
        w.attn = 0;
        w.stance = "stand";
        w.layT = 0;
      }
      CAR1.carry = "front";
      CAR2.carry = "shoulder";
      BARROW.carry = "barrow";
      barrow.full = true;
      barrow.f = 1;
      barrow.tip = 0;
      CAR1.state = "toFront";
      CAR2.state = "toFront";
      BARROW.state = "push";
      hats.length = 0;
      loose.length = 0;
      puddle.on = false;
      tower.x = 6;
      tower.tx = 6;
    }

    const setAct = (w, type, dur, o) => {
      w.act = Object.assign({ type, t: 0, dur }, o || {});
    };
    const hop = (w, v) => {
      w.air = true;
      w.vy = -v;
    };
    const FAST = () => S.pct >= 70 && S.phase === "build";
    function stepToward(w, tx, speed, dt) {
      const d = tx - w.x;
      if (Math.abs(d) < 0.8) return true;
      w.f = d > 0 ? 1 : -1;
      const m = Math.min(Math.abs(d), speed * dt);
      w.x += w.f * m;
      const b = w.phase | 0;
      w.phase += m * w.cadence;
      if ((w.phase | 0) !== b && !((w.phase | 0) & 1)) Snd.step(speed > 36 ? 1.3 : 1);
      w.stance = speed > 38 ? "run" : "walk";
      if (speed > 38 && Math.random() < dt * 2.2)
        spawn("sweat", w.x, w.gy - 8, -w.f * rand(4, 14), rand(-14, -6), 0.4);
      if (speed > 50 && Math.random() < dt * 7) puff(w.x - w.f * 2, GROUND - 1, 1, 4);
      return false;
    }
    function dropCarry(w) {
      if (w.carry === "front" || w.carry === "shoulder" || w.carry === "overhead") {
        for (let i = 0; i < 2; i++)
          addLoose(w.x + w.f * 2 + i * 2, w.gy - 8, w.f * rand(10, 26), rand(-46, -22), "brick", 1.4);
        w.carry = null;
        if (w.role === "carrier") w.state = "toPile";
      } else if (w.layT > 0 || w.role === "layerLow" || w.role === "layerHigh") {
        addLoose(w.x + w.f * 3, w.gy - 7, w.f * rand(8, 18), rand(-40, -22), "tool", 1);
      }
    }

    /* ---------- role behaviour while building ---------- */
    function upcoming(lowRange) {
      for (let i = placed; i < N - 1; i++) {
        const b = order[i];
        if (b.c <= 3 === lowRange) return b;
      }
      return order[N - 1];
    }
    function resumeCrew() {
      for (const w of crew) {
        w.act = null;
        w.air = false;
        w.dy = 0;
        w.vy = 0;
        w.plan = "";
        w.lunch = 0;
        w.exclaim = 0;
        w.hidden = false;
        w.stance = "stand";
        w.layT = 0;
        if (w.gy < GROUND && w !== OP) w.gy = GROUND;
      }
      CAR1.state = CAR2.state = "toPile";
      CAR1.carry = CAR2.carry = null;
      BARROW.carry = null;
      BARROW.state = "toBarrow";
      barrow.tip = 0;
      hats.length = 0;
      loose.length = 0;
      puddle.on = false;
      tower.x = 174;
      tower.tx = 6;
    }
    function buildAI(w, dt) {
      const fast = FAST();
      switch (w.role) {
        case "foreman": {
          const tx = clamp(frontX() + 18, 40, 106);
          if (!stepToward(w, tx, fast ? 44 : 13, dt)) break;
          w.f = -1;
          w.stance = S.pct < 30 ? "point" : fast || Math.sin(w.t * 1.2) > 0.1 ? "wave" : "stressed";
          break;
        }
        case "layerLow":
        case "layerHigh": {
          const b = upcoming(w.role === "layerLow");
          if (w.role === "layerHigh" && w.gy > TOWER_FLOOR + 1) {
            tower.tx = 6;
            if (stepToward(w, tower.x + 6, 34, dt) && Math.abs(tower.x - tower.tx) < 2)
              setAct(w, "climb", 0.36, {
                from: GROUND,
                to: TOWER_FLOOR,
                next: (x) => {
                  x.gy = TOWER_FLOOR;
                },
              });
            break;
          }
          if (w.role === "layerHigh") {
            w.x += (tower.x + 6 - w.x) * Math.min(1, dt * 30);
            tower.tx = clamp(b.x + b.w - 2, 6, 122);
            w.f = -1;
            w.gy = TOWER_FLOOR;
          } else {
            const tx = clamp(b.x + b.w + 1, 6, 128);
            if (!stepToward(w, tx, fast ? 60 : 26, dt)) {
              w.layT = Math.max(0, w.layT - dt);
              break;
            }
            w.f = -1;
          }
          w.layT = Math.max(0, w.layT - dt);
          w.stance = w.layT > 0 ? "lay" : "stand";
          break;
        }
        case "mixer": {
          w.f = -1;
          w.stance = "mix";
          w.x += (MIX.x + 8 - w.x) * Math.min(1, dt * 4);
          const before = w.mixT % 1;
          w.mixT += dt / (fast ? 0.75 : 1.5);
          if (before < 0.72 && w.mixT % 1 >= 0.72) {
            Snd.tick();
            for (let i = 0; i < 3; i++)
              spawn("crumb", MIX.x + 2, 17, rand(-16, -4), rand(-24, -8), 0.5, C.cementL);
          }
          break;
        }
        case "carrier": {
          const sp = fast ? 64 : w === CAR1 ? 26 : 21;
          if (puddle.on && puddle.armed && !w.air && Math.abs(w.x - puddle.x) < 1.5) {
            slip(w);
            return;
          }
          switch (w.state) {
            case "toFront": {
              w.carry = w === CAR1 ? "front" : "shoulder";
              if (stepToward(w, clamp(frontX() - (w === CAR1 ? 9 : 16), 10, 122), sp, dt)) {
                w.state = "drop";
                w.timer = fast ? 0.08 : 0.22;
                w.stance = "stand";
                Snd.tick();
                w.carry = null;
              }
              break;
            }
            case "drop":
              w.timer -= dt;
              w.stance = "pick";
              if (w.timer <= 0) w.state = "toPile";
              break;
            case "toPile": {
              w.carry = null;
              if (stepToward(w, w === CAR1 ? 9 : 13, sp, dt)) {
                w.state = "load";
                w.timer = fast ? 0.08 : 0.3;
              }
              break;
            }
            case "load":
              w.timer -= dt;
              w.stance = "pick";
              if (w.timer <= 0) {
                w.state = "toFront";
                Snd.tick();
              }
              break;
            default:
              w.state = "toFront";
          }
          break;
        }
        case "barrow": {
          const sp = fast ? 52 : 20,
            home = 74;
          if (w.state !== "toBarrow") {
            barrow.x = w.x + w.f * 7;
            barrow.f = w.f;
          }
          switch (w.state) {
            case "toBarrow":
              if (stepToward(w, barrow.x - barrow.f * 7, 24, dt)) {
                w.f = barrow.f;
                w.carry = "barrow";
                barrow.full = false;
                w.state = "back";
              }
              break;
            case "push": {
              w.carry = "barrow";
              if (stepToward(w, clamp(frontX() + 8, 42, 120), sp, dt)) {
                w.state = "tip";
                w.timer = fast ? 0.15 : 0.5;
              }
              break;
            }
            case "tip":
              w.timer -= dt;
              w.stance = "stand";
              barrow.tip = w.timer > 0.2 ? 2 : 1;
              if (w.timer < 0.2) barrow.full = false;
              if (w.timer <= 0) {
                barrow.tip = 0;
                w.state = "back";
                puff(barrow.x + w.f * 3, GROUND - 2, 3, 6);
                Snd.tick();
              }
              break;
            case "back": {
              w.carry = "barrow";
              if (stepToward(w, home, sp, dt)) {
                w.state = "fill";
                w.timer = fast ? 0.2 : 0.7;
              }
              break;
            }
            case "fill":
              w.timer -= dt;
              w.stance = "stand";
              if (w.timer < 0.3) barrow.full = true;
              if (w.timer <= 0) w.state = "push";
              break;
            default:
              w.state = "push";
          }
          break;
        }
        case "crane":
          w.stance = "stand";
          break;
      }
    }
    function slip(w) {
      puddle.armed = false;
      dropCarry(w);
      Snd.slip();
      setAct(w, "slip", 0.75, {
        v: w.f * 34,
        next: (x) =>
          setAct(x, "dazed", 0.9, {
            next: (y) => {
              y.state = "toPile";
            },
          }),
      });
    }

    /* ---------- 99%: break time ---------- */
    function stallAI(w, dt) {
      w.planT += dt;
      switch (w.plan) {
        case "toSeat":
          if (stepToward(w, w.seat, 30, dt)) {
            w.plan = "climbing";
            w.f = w.seat < 78 ? 1 : -1;
            setAct(w, "climb", 0.42, {
              from: GROUND,
              to: SEAT,
              next: (x) => {
                x.plan = "seated";
                x.planT = 0;
                x.gy = SEAT;
                Snd.tick();
              },
            });
          }
          break;
        case "seated":
          if (w.lunch < 1 && w.planT > 0.55) {
            w.lunch = 1;
            Snd.tick();
          }
          if (w.sleeper && w.planT > 3.2) {
            w.stance = "sleep";
            w.zT -= dt;
            if (w.zT <= 0) {
              w.zT = 1.15;
              spawn("z", w.x + 2, w.gy - 13, 1.5, -5, 2.1);
            }
          } else w.stance = w.lunch ? "eat" : "sit";
          if (w.stance === "eat" && Math.random() < dt * 0.5)
            spawn("crumb", w.x + w.f * 2, w.gy - 7, rand(-5, 5), rand(-8, 0), 0.4, C.hat);
          break;
        case "toHut":
          if (stepToward(w, -8, 30, dt)) {
            w.hidden = true;
            w.plan = "inHut";
          }
          break;
        case "toSpot":
          if (stepToward(w, 78, 24, dt)) {
            w.plan = "waiting";
            w.planT = 0;
            w.f = 1;
          }
          break;
        case "waiting": {
          const c = w.planT % 4.6;
          w.stance = c > 3.8 ? "front" : "watch";
          break;
        }
        default:
          if (w.role === "crane") w.stance = "stand";
      }
    }
    function enterStallPlans() {
      for (const w of crew) {
        w.planT = 0;
        if (w === OP) {
          continue;
        }
        if (w === FOREMAN) {
          w.plan = "toSpot";
          continue;
        }
        if (w === CAR2) {
          w.carry = null;
          w.plan = "toHut";
          addLoose(w.x, GROUND - 4, 0, 0, "brick", 0.5);
          continue;
        }
        if (w.carry && w.carry !== "barrow") addLoose(w.x + w.f * 2, GROUND - 4, 0, 0, "brick", 0.6);
        if (w === MIXER) addLoose(w.x - 3, GROUND - 3, 0, 0, "tool", 120);
        w.carry = null;
        barrow.tip = 0;
        setAct(w, "putdown", 0.34, {
          next: (x) => {
            x.plan = "toSeat";
          },
        });
        if (w === HIGH) {
          w.act.next = (x) => {
            setAct(x, "climb", 0.36, {
              from: TOWER_FLOOR,
              to: GROUND,
              next: (y) => {
                y.gy = GROUND;
                y.plan = "toSeat";
              },
            });
          };
        }
      }
    }
    function pokeCrew() {
      for (const w of crew) {
        if (w.hidden || w === OP) continue;
        if (w.act && w.act.next) {
          w.exclaim = 0.7;
          continue;
        }
        if (!w.air) hop(w, w.plan === "seated" ? 44 : 56);
        w.exclaim = 0.7;
        setAct(w, "startle", 0.5);
        if (w.plan === "seated") {
          w.planT = Math.min(w.planT, 0.8);
          w.zT = 0.5;
          for (let i = 0; i < 2; i++)
            spawn("crumb", w.x + w.f * 2, w.gy - 6, rand(-16, 16), rand(-34, -14), 0.6, C.hat);
        }
      }
      Snd.startle();
    }

    /* ---------- third poke: scramble ---------- */
    function scrambleAI(w, dt) {
      if (w === OP) {
        w.stance = "stand";
        return;
      }
      switch (w.plan) {
        case "run":
          if (stepToward(w, w.spot, 62, dt)) {
            w.plan = "watching";
            w.f = w.x < gapBrick.x ? 1 : -1;
            w.stance = "stand";
          }
          break;
        case "watching":
          w.stance = "stand";
          w.f = w.x < gapBrick.x + 3 ? 1 : -1;
          break;
        case "runner": {
          if (!S.tripped) {
            if (stepToward(w, gapBrick.x - 16, 74, dt)) {
              S.tripped = true;
              w.carry = null;
              Snd.slip();
              S.lastBrick = { x: w.x + 4, y: w.gy - 10, vx: 30, vy: -42, kind: "brick", life: 999, b: 0 };
              loose.push(S.lastBrick);
              setAct(w, "slip", 0.6, {
                v: 22,
                next: (x) =>
                  setAct(x, "dazed", 0.45, {
                    next: (y) => {
                      y.plan = "fetch";
                    },
                  }),
              });
            }
          }
          break;
        }
        case "fetch": {
          const b = S.lastBrick;
          if (stepToward(w, b.x - 3, 46, dt)) {
            w.f = 1;
            setAct(w, "pickbrick", 0.42, {
              next: (x) => {
                const i = loose.indexOf(S.lastBrick);
                if (i >= 0) loose.splice(i, 1);
                x.carry = "front";
                x.plan = "toGap";
                Snd.tick();
              },
            });
          }
          break;
        }
        case "toGap":
          if (stepToward(w, gapBrick.x + gapBrick.w + 1, 30, dt)) {
            w.f = -1;
            w.carry = null;
            w.plan = "placing";
            w.aim = [-5, -4];
            w.layT = 0.34;
            w.stance = "lay";
            launchBrick(gapBrick, w, 0.26, true);
          }
          break;
        case "placing":
          w.stance = "lay";
          break;
        default:
          w.stance = "stand";
      }
    }
    function startScramble() {
      S.phase = "scramble";
      S.t = 0;
      S.tripped = false;
      S.lastBrick = null;
      setStatus("99%. Any minute now.");
      let i = 0;
      for (const w of crew) {
        if (w === OP) {
          continue;
        }
        if (w === CAR2) {
          continue;
        }
        w.spot = SPOTS[w.id];
        w.lunch = 0;
        const seated = w.gy < GROUND - 2;
        w.act = null;
        w.air = false;
        w.dy = 0;
        w.vy = 0;
        w.exclaim = 0.5;
        if (seated) {
          setAct(w, "climb", 0.3 + i * 0.03, {
            from: w.gy,
            to: GROUND,
            next: (x) => {
              x.gy = GROUND;
              x.plan = "run";
            },
          });
        } else w.plan = "run";
        i++;
      }
    }

    /* ---------- worker tick ---------- */
    function updateWorker(w, dt) {
      w.t += dt;
      if (w.exclaim > 0) w.exclaim -= dt;
      if (w.bump > 0) w.bump -= dt;
      if (w.air) {
        w.vy += 230 * dt;
        w.dy += w.vy * dt;
        if (w.dy >= 0) {
          w.dy = 0;
          w.vy = 0;
          w.air = false;
          if (w.gy >= GROUND - 1) Snd.step(1);
        }
      }
      /* attention: stop and look up at a nearby cursor */
      const c = lookCursor(),
        near = c && !pressHeld && Math.abs(c.x - w.x) < 13 && Math.abs(c.y - (w.gy - 6)) < 17 && !w.hidden;
      if (w.attnCd > 0) w.attnCd -= dt;
      if (near && w.attnCd <= 0) {
        w.attnT += dt;
        if (w.attnT > 1.5) {
          w.attnT = 0;
          w.attnCd = 2.6;
        }
      } else if (!near) w.attnT = 0;
      const curious = near && w.attnCd <= 0;
      w.attn = curious ? 1 : 0;
      if (curious) w.attnDir = c.x >= w.x ? 1 : -1;
      w.looking = curious && S.phase === "build" && !w.act && w !== OP;

      if (w.act) {
        updateAct(w, dt);
        return;
      }
      if (S.phase === "freeze") return;
      if (w.looking) {
        w.stance = "look";
        w.f = w.attnDir;
        return;
      }
      switch (S.phase) {
        case "build":
          buildAI(w, dt);
          break;
        case "stall":
          stallAI(w, dt);
          break;
        case "scramble":
          scrambleAI(w, dt);
          break;
        case "done":
          w.stance = "cheer";
          break;
        case "crumble":
          if (w.role !== "crane" && stepToward(w, w.crSpot, 28, dt)) {
            w.stance = "stand";
            w.f = w.x < 78 ? 1 : -1;
          }
          break;
        case "stare": {
          if (S.t > w.turnAt) w.stance = "front";
          else if (w.role !== "crane") w.stance = "stand";
          break;
        }
      }
    }
    function updateAct(w, dt) {
      const a = w.act;
      a.t += dt;
      const u = clamp(a.t / a.dur, 0, 1);
      switch (a.type) {
        case "jump":
          w.stance = "jump";
          break;
        case "startle":
          w.stance = "startle";
          break;
        case "duck":
          w.stance = "duck";
          break;
        case "slip":
          w.stance = "lying";
          w.x += a.v * (1 - u) * dt;
          if (Math.random() < dt * 14) puff(w.x, GROUND - 1, 1, 4);
          w.x = clamp(w.x, 4, 131);
          break;
        case "dazed":
          w.stance = "dazed";
          if (Math.random() < dt * 2.5) spawn("star", w.x, w.gy - 11, 0, 0, 0.7);
          break;
        case "climb": {
          w.stance = "jump";
          w.gy = lerp(a.from, a.to, smooth(u)) - Math.sin(u * Math.PI) * 3;
          break;
        }
        case "putdown":
          w.stance = "pick";
          break;
        case "pickbrick":
          w.stance = "pick";
          break;
        case "cheer":
          w.stance = "cheer";
          if (!w.air && Math.random() < dt * 2.5) hop(w, rand(46, 70));
          break;
      }
      if (a.t >= a.dur) {
        const n = a.next;
        w.act = null;
        if (n) n(w);
      }
    }

    /* ---------- flying bricks (hand to slot) ---------- */
    const flying = [];
    function launchBrick(b, w, dur, last) {
      const hx = w.hand[0] || w.x,
        hy = w.hand[1] || w.gy - 5;
      flying.push({ b, x0: hx, y0: hy, t: 0, dur, last: !!last });
      if (w.role !== "runner") {
        w.layT = Math.max(w.layT, dur + 0.08);
        w.aim = [clamp(b.x + b.w / 2 - w.x, -6, 6) | 0, clamp(b.y - (w.gy - 6), -6, 5) | 0];
      }
    }
    function updateFlying(dt) {
      for (let i = flying.length - 1; i >= 0; i--) {
        const q = flying[i];
        q.t += dt;
        if (q.t >= q.dur) {
          const b = q.b;
          b.on = true;
          b.pop = 0.1;
          flying.splice(i, 1);
          if (q.last) {
            Snd.place();
            puff(b.x + b.w / 2, b.y, 10, 13);
            shake(5);
            finish();
          } else {
            Snd.brick();
            puff(b.x + b.w / 2, b.y + 1, FAST() ? 4 : 2, FAST() ? 10 : 6);
          }
        }
      }
    }
    function drawFlying() {
      for (const q of flying) {
        const u = q.t / q.dur,
          b = q.b;
        const x = lerp(X(q.x0), b.px, u),
          y = lerp(X(q.y0), b.py, u) - Math.sin(u * Math.PI) * 5;
        rect(x, y, Math.min(b.pw, BW), BH, C.brick[1]);
        rect(x, y, Math.min(b.pw, BW), 1, C.brickHi);
      }
    }
    function drawHats() {
      for (const h of hats) {
        const u = clamp(h.t / h.dur, 0, 1),
          x = X(h.w.x) + Math.round(Math.sin(u * TAU) * 3),
          y = X(h.w.gy + h.w.dy - 10) - Math.sin(u * Math.PI) * h.h * Q;
        const a = h.w.isForeman ? C.white : C.hat,
          b = h.w.isForeman ? C.signD : C.hatD;
        rect(x - 2, y, 5, 2, a);
        rect(x - 3, y + 2, 7, 1, b);
      }
    }
    function updateHats(dt) {
      for (let i = hats.length - 1; i >= 0; i--) {
        const h = hats[i];
        h.t += dt;
        if (h.t >= h.dur) {
          h.w.hatOff = false;
          hats.splice(i, 1);
          Snd.tick();
        }
      }
    }

    /* ---------- story director ---------- */
    const AMBIENT = 0.34;
    const statusUpdate = () => "Loading…";
    function newRun(update, keep) {
      S.update = update;
      S.phase = "build";
      S.t = 0;
      S.pct = 0;
      S.shown = 0;
      S.pokes = 0;
      S.placeT = 0;
      S.ev = 0;
      S.jumpT = 0;
      S.swing = null;
      S.seq++;
      S.crumble = null;
      S.lastBrick = null;
      buildWall();
      flying.length = 0;
      if (keep) {
        resumeCrew();
        S.placeT = 2.2;
      } else {
        resetCrew();
        for (const p of parts) p.on = false;
      }
      crane.override = 0;
      crane.load = false;
      crane.state = "idle";
      crane.t = 0.5;
      crane.tL = 9;
      setStatus(statusUpdate(), true);
      Snd.ambience(AMBIENT, 0.6);
    }
    function interval() {
      if (S.pct < 30) return rand(0.08, 0.165);
      if (S.pct < 70) return rand(0.07, 0.165) + (Math.random() < 0.05 ? rand(0.2, 0.45) : 0);
      return rand(0.045, 0.07);
    }
    function tryPlace() {
      const b = nextBrick(),
        w = b.c <= 3 ? LOW : HIGH;
      if (w.act || w.looking || (w === HIGH && w.gy > TOWER_FLOOR + 1)) return false;
      placed++;
      launchBrick(b, w, S.pct >= 70 ? 0.1 : 0.14);
      return true;
    }
    const EVENTS = [
      { at: 34, fn: () => fallingBrick(CAR1) },
      { at: 44, fn: startCraneSwing },
      { at: 54, fn: spillCement },
      { at: 61, fn: () => fallingBrick(CAR2) },
      { at: 66, fn: startCraneSwing },
    ];
    function fallingBrick(w) {
      if (w.act) w = w === CAR1 ? CAR2 : CAR1;
      addLoose(clamp(w.x + w.f * 3, 8, 128), 4, 0, 0, "brick", 1.6);
      Snd.whistle();
      setTimeoutSim(0.14, () => {
        if (!w.act && S.phase === "build") {
          setAct(w, "duck", 0.95);
          w.exclaim = 0.5;
        }
      });
    }
    function startCraneSwing() {
      S.swing = { t: 0, leg: 0 };
      crane.load = true;
      crane.tL = 13;
      crane.override = 3.6;
      crane.tx = 38;
      crane.state = "idle";
      Snd.swing();
    }
    function spillCement() {
      const w = CAR1.act ? CAR2 : CAR1;
      puddle.on = true;
      puddle.armed = true;
      puddle.t = 6;
      puddle.x = clamp(w.x + w.f * 12, 12, 122);
      Snd.tick();
      for (let i = 0; i < 8; i++)
        spawn("crumb", puddle.x, GROUND - 3, rand(-14, 14), rand(-26, -6), 0.4, C.cementL);
    }
    const timers = [];
    function setTimeoutSim(d, fn) {
      timers.push({ d, fn });
    }
    function updateTimers(dt) {
      for (let i = timers.length - 1; i >= 0; i--) {
        timers[i].d -= dt;
        if (timers[i].d <= 0) {
          const f = timers[i].fn;
          timers.splice(i, 1);
          f();
        }
      }
    }

    function buildStep(dt) {
      if (S.starting) {
        S.starting = false;
      }
      S.placeT -= dt;
      /* the wall follows the game's real loading progress */
      const behind = Math.floor(realP * N) - placed;
      if (behind > 6) {
        for (let i = Math.min(30, Math.ceil(behind / 3)); i > 0 && placed < N; i--) {
          const b = nextBrick();
          placed++;
          b.on = true;
          b.pop = 0.12;
        }
      } else if (behind > 0 && S.placeT <= 0 && tryPlace()) S.placeT = interval();
      S.pct = realPct();
      if (S.ev < EVENTS.length && S.pct >= EVENTS[S.ev].at) {
        EVENTS[S.ev].fn();
        S.ev++;
      }
      S.jumpT -= dt;
      if (S.shown !== S.pct && S.jumpT <= 0) {
        S.shown = S.pct;
        FOREMAN.bump = 0.1;
        S.jumpT = S.pct < 30 ? rand(0.2, 0.85) : S.pct < 70 ? rand(0.15, 0.95) : 0.03;
      }
      if (S.swing) {
        const s = S.swing;
        s.t += dt;
        if (s.t > 1.05 && s.leg === 0) {
          s.leg = 1;
          crane.om += 0.9;
          Snd.swing();
        }
        if (s.leg === 1) crane.tx = Math.min(126, crane.tx + 50 * dt);
        const h = hookPos();
        for (const w of crew) {
          if (w.gy < GROUND - 1 || w === OP || w.act) continue;
          if (Math.abs(h.x - w.x) < 11 && s.leg === 1 && Math.abs(crane.v) > 8) {
            setAct(w, "duck", 0.55);
            w.exclaim = 0.3;
          }
        }
        if (s.t > 3.3) {
          S.swing = null;
          crane.load = false;
          crane.tL = 8;
          crane.override = 0;
          crane.state = "idle";
          crane.t = 0.4;
        }
      }
      if (puddle.on) {
        puddle.t -= dt;
        if (puddle.t <= 0) puddle.on = false;
      }
      if (false) {
        S.pct = S.shown = 99;
        S.phase = "freeze";
        S.t = 0;
        setStatus("99%. Any minute now.");
        Snd.ambience(0, 0.08);
        crane.state = "idle";
        crane.load = false;
        crane.tx = crane.x;
      }
    }
    function poke() {
      if (S.phase !== "freeze" && S.phase !== "stall") return;
      if (S.pokes >= 3) return;
      S.pokes++;
      shake(S.pokes === 3 ? 13 : 10);
      Snd.poke();
      if (S.phase === "freeze") {
        S.phase = "stall";
        S.t = 0;
        enterStallPlans();
      }
      pokeCrew();
      crane.om += 0.8;
      if (S.pokes === 3) {
        FOREMAN.bump = 0.1;
        Snd.ambience(0.18, 0.2);
        setTimeoutSim(0.05, startScramble);
        setTimeoutSim(0.6, () => {
          const r = CAR2;
          r.act = null;
          if (r.hidden) r.x = -8;
          r.hidden = false;
          r.gy = GROUND;
          r.f = 1;
          r.plan = "runner";
          r.carry = "overhead";
          r.stance = "run";
          r.exclaim = 0.4;
          Snd.tick();
        });
      }
    }
    function finish() {
      placed = N;
      S.pct = S.shown = 100;
      S.phase = "done";
      S.t = 0;
      setStatus("Done!");
      Snd.chime();
      setTimeoutSim(0.08, () => Snd.pop());
      setTimeoutSim(0.22, () => Snd.cheer());
      Snd.ambience(0.12, 0.1);
      flash.v = 1;
      flash.ring = 1;
      squashKick(0.14);
      burstConfetti(45, 70);
      setTimeoutSim(0.12, () => burstConfetti(95, 70));
      setTimeoutSim(0.4, () => burstConfetti(70, 50));
      for (const w of crew) {
        if (w === OP) continue;
        w.hidden = false;
        w.carry = null;
        w.lunch = 0;
        w.act = null;
        setAct(w, "cheer", 1.15);
        hop(w, rand(50, 75));
        hats.push({ w, t: -rand(0.05, 0.25), dur: rand(0.72, 1), h: rand(12, 17) });
        w.hatOff = true;
        w.plan = "";
      }
    }
    function enterCrumble() {
      S.phase = "crumble";
      S.t = 0;
      S.crumble = bricks.filter((b) => b.on).sort((a, b) => b.x + rand(4) - (a.x + rand(4)));
      S.total = S.crumble.length;
      setStatus(`Installing update ${S.update + 1} of 47`);
      const line = [28, 44, 60, 96, 112, 126],
        rest = crew.filter((w) => w !== OP && w !== FOREMAN).sort((a, b) => a.x - b.x);
      rest.forEach((w, i) => {
        w.crSpot = line[i];
      });
      FOREMAN.crSpot = 78;
      Snd.sad();
      Snd.rumble();
      Snd.ambience(0.06, 0.3);
    }
    function storyStep(dt) {
      S.t += dt;
      switch (S.phase) {
        case "build":
          buildStep(dt);
          break;
        case "freeze":
          if (S.t > 0.85) {
            S.phase = "stall";
            S.t = 0;
            enterStallPlans();
          }
          break;
        case "stall":
          break;
        case "done":
          if (S.t > 1.2) enterCrumble();
          break;
        case "crumble": {
          const want = Math.floor(smooth(S.t / 2.5) * S.total + Math.min(1, S.t / 0.2) * 2);
          while (S.crumble.length && S.total - S.crumble.length < want) {
            const b = S.crumble.shift();
            b.on = false;
            addLoose(b.x + 1, b.y, rand(-22, 12), rand(-22, 4), "brick", rand(0.5, 1));
            if (Math.random() < 0.35) puff(b.x + 2, b.y, 2, 8);
            if (Math.random() < 0.2) Snd.brick();
          }
          const rem = S.crumble.length / S.total;
          S.shown = S.pct = rem <= 0 ? 0 : Math.ceil(rem * 100);
          if (S.t > 2.75) {
            S.phase = "stare";
            S.t = 0;
            for (const w of crew) w.turnAt = rand(0.15, 0.95);
            Snd.ambience(0, 0.8);
          }
          break;
        }
        case "stare":
          if (S.t > 4.1) newRun(S.update + 1, true);
          break;
      }
    }

    /* ---------- the physical bar: baked at display resolution ---------- */
    let k = 1,
      bgCan,
      frameCan,
      shadowCan,
      overlayCan,
      glowCan;
    const FR = BAR.frame,
      M = 110;
    const OUT = { x: BAR.x - FR, y: BAR.y - FR, w: BAR.w + FR * 2, h: BAR.h + FR * 2 };
    function pill(c, x, y, w, h) {
      const r = h / 2;
      c.beginPath();
      c.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
      c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
      c.closePath();
    }
    function layer() {
      const can = mk(Math.ceil((OUT.w + M * 2) * k), Math.ceil((OUT.h + M * 2) * k)),
        c = can.getContext("2d");
      c.setTransform(k, 0, 0, k, (M - OUT.x) * k, (M - OUT.y) * k);
      return [can, c];
    }
    function bakeAll() {
      /* calm, softly lit paper-like backdrop that melts into the page colour at its edges */
      bgCan = mk(cv.width, cv.height);
      let c = bgCan.getContext("2d");
      c.setTransform(k, 0, 0, k, 0, 0);
      c.fillStyle = "#c9c0b2";
      c.fillRect(0, 0, STAGE, STAGE);
      let gr = c.createRadialGradient(540, 470, 40, 540, 510, 540);
      gr.addColorStop(0, "#f1e9dc");
      gr.addColorStop(0.48, "#e3dacb");
      gr.addColorStop(1, "#c9c0b2");
      c.fillStyle = gr;
      c.fillRect(0, 0, STAGE, STAGE);
      gr = c.createRadialGradient(540, 520, 10, 540, 520, 420);
      gr.addColorStop(0, "rgba(255,190,130,.20)");
      gr.addColorStop(1, "rgba(255,190,130,0)");
      c.fillStyle = gr;
      c.fillRect(0, 0, STAGE, STAGE);
      /* a whisper of grain to stop gradient banding on video */
      const nt = mk(160, 160),
        nc = nt.getContext("2d"),
        id = nc.createImageData(160, 160);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 255;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = 7;
      }
      nc.putImageData(id, 0, 0);
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = c.createPattern(nt, "repeat");
      c.fillRect(0, 0, cv.width, cv.height);

      /* drop shadow */
      let a = layer();
      shadowCan = a[0];
      c = a[1];
      const FAR = 4000;
      c.shadowOffsetX = FAR * k;
      c.fillStyle = "#000";
      c.shadowColor = "rgba(70,45,30,.46)";
      c.shadowBlur = 62 * k;
      c.shadowOffsetY = 36 * k;
      pill(c, OUT.x + 6 - FAR, OUT.y + 8, OUT.w - 12, OUT.h - 12);
      c.fill();
      c.shadowColor = "rgba(60,35,25,.5)";
      c.shadowBlur = 16 * k;
      c.shadowOffsetY = 8 * k;
      pill(c, OUT.x + 2 - FAR, OUT.y + 4, OUT.w - 4, OUT.h - 6);
      c.fill();

      /* chunky glossy frame */
      a = layer();
      frameCan = a[0];
      c = a[1];
      gr = c.createLinearGradient(0, OUT.y, 0, OUT.y + OUT.h);
      gr.addColorStop(0, "#ffffff");
      gr.addColorStop(0.2, "#f7f1e7");
      gr.addColorStop(0.62, "#e4dacb");
      gr.addColorStop(0.86, "#cfc2b0");
      gr.addColorStop(1, "#efe6d9");
      c.fillStyle = gr;
      pill(c, OUT.x, OUT.y, OUT.w, OUT.h);
      c.fill();
      /* outer rim bevel */
      c.lineWidth = 2.5;
      gr = c.createLinearGradient(0, OUT.y, 0, OUT.y + OUT.h);
      gr.addColorStop(0, "rgba(255,255,255,.95)");
      gr.addColorStop(0.5, "rgba(255,255,255,.2)");
      gr.addColorStop(1, "rgba(130,105,85,.55)");
      c.strokeStyle = gr;
      pill(c, OUT.x + 1.5, OUT.y + 1.5, OUT.w - 3, OUT.h - 3);
      c.stroke();
      /* glossy highlight sweeping along the top of the frame */
      c.save();
      pill(c, OUT.x, OUT.y, OUT.w, OUT.h);
      c.clip();
      gr = c.createLinearGradient(0, OUT.y, 0, OUT.y + FR);
      gr.addColorStop(0, "rgba(255,255,255,.95)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gr;
      pill(c, OUT.x + 38, OUT.y + 4, OUT.w - 76, FR - 4);
      c.fill();
      c.restore();
      /* inner lip */
      c.lineWidth = 6;
      gr = c.createLinearGradient(0, BAR.y, 0, BAR.y + BAR.h);
      gr.addColorStop(0, "#a2937f");
      gr.addColorStop(1, "#fff8ee");
      c.strokeStyle = gr;
      pill(c, BAR.x - 3, BAR.y - 3, BAR.w + 6, BAR.h + 6);
      c.stroke();
      c.fillStyle = "#2a1b36";
      pill(c, BAR.x, BAR.y, BAR.w, BAR.h);
      c.fill();

      /* inner shadow and glass on top of the pixel scene */
      a = layer();
      overlayCan = a[0];
      c = a[1];
      c.save();
      pill(c, BAR.x, BAR.y, BAR.w, BAR.h);
      c.clip();
      c.shadowColor = "rgba(20,30,70,.34)";
      c.shadowBlur = 14 * k;
      c.shadowOffsetY = 4 * k;
      c.fillStyle = "#000";
      c.beginPath();
      c.rect(OUT.x - 80, OUT.y - 80, OUT.w + 160, OUT.h + 160);
      const r = BAR.h / 2;
      c.moveTo(BAR.x + r, BAR.y + BAR.h);
      c.arc(BAR.x + BAR.w - r, BAR.y + r, r, Math.PI / 2, -Math.PI / 2, true);
      c.arc(BAR.x + r, BAR.y + r, r, -Math.PI / 2, Math.PI / 2, true);
      c.closePath();
      c.fill("evenodd");
      c.shadowColor = "transparent";
      /* soft glass reflection */
      gr = c.createLinearGradient(0, BAR.y, 0, BAR.y + BAR.h * 0.42);
      gr.addColorStop(0, "rgba(255,255,255,.17)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = gr;
      pill(c, BAR.x + 26, BAR.y + 5, BAR.w - 52, BAR.h * 0.42);
      c.fill();
      c.restore();

      /* celebratory halo */
      a = layer();
      glowCan = a[0];
      c = a[1];
      c.shadowColor = "rgba(255,226,150,1)";
      c.shadowBlur = 70 * k;
      c.fillStyle = "rgba(255,240,190,1)";
      pill(c, OUT.x + 4, OUT.y + 4, OUT.w - 8, OUT.h - 8);
      c.fill();
      c.fill();
    }
    function resize() {
      const s = Math.max(64, Math.round(boot.size));
      cv.width = cv.height = s;
      k = s / STAGE;
      bakeAll();
    }
    addEventListener("resize", resize);

    /* ---------- springs, feedback, status ---------- */
    let rt = 0,
      ff = 1,
      pressed = false,
      pressT = 0,
      pressHeld = false,
      hideUI = false,
      overIcon = false;
    const lift = { v: 0, p: 0 },
      squash = { v: 0, p: 0 },
      flash = { v: 0, ring: 0 };
    let shakeA = 0;
    const shake = (a) => {
      shakeA = Math.max(shakeA, a);
    };
    const squashKick = (a) => {
      squash.v += a * 16;
    };
    const status = { txt: "", prev: "", a: 1 };
    function setStatus(t, instant) {
      if (status.txt === t) return;
      status.prev = status.txt;
      status.txt = t;
      status.a = instant ? 1 : 0;
    }
    const cur = { x: -99, y: -99, lx: -99, ly: -99, inBar: false };
    const looker = { x: 0, y: 0 };
    function lookCursor() {
      if (auto.visible && auto.y < OUT.y + OUT.h + 100) {
        looker.x = (auto.x - BAR.x) / SCALE;
        looker.y = (auto.y - BAR.y) / SCALE;
        return looker;
      }
      if (!cur.inBar) return null;
      looker.x = cur.lx;
      looker.y = cur.ly;
      return looker;
    }
    function inCapsule(x, y, pad = 0) {
      const r = OUT.h / 2 + pad,
        cy = OUT.y + OUT.h / 2,
        ax = OUT.x + OUT.h / 2,
        bx = OUT.x + OUT.w - OUT.h / 2;
      const px0 = clamp(x, ax, bx);
      return Math.hypot(x - px0, y - cy) <= r;
    }
    const ICON = { x: 1012, y: 68, r: 30 };
    const onIcon = () => false;

    /* ---------- hands-free fake cursor ---------- */
    const auto = {
      on: false,
      visible: false,
      x: 1200,
      y: 1180,
      tx: 1200,
      ty: 1180,
      wait: 0,
      press: 0,
      seq: -1,
      clicks: 0,
    };
    function updateAuto(dt) {
      const a = auto,
        stalled = S.phase === "stall" || S.phase === "freeze";
      if (a.on && stalled && S.pokes < 3) {
        if (a.seq !== S.seq) {
          a.seq = S.seq;
          a.clicks = S.pokes;
          a.x = 1200;
          a.y = 1180;
          a.wait = S.phase === "stall" ? 1.2 : 6.2;
          a.visible = true;
        }
        a.visible = true;
        if (a.wait > 0) a.wait -= dt;
        if (a.wait <= 1.1) {
          a.tx = BAR.x + BAR.w * 0.56 + Math.sin(S.pokes * 2.3) * 70;
          a.ty = BAR.y + BAR.h * 0.62 + Math.cos(S.pokes * 1.7) * 14;
        }
        if (a.wait <= 0 && Math.hypot(a.x - a.tx, a.y - a.ty) < 3) {
          a.press = 0.16;
          squash.v += 2.2;
          poke();
          a.wait = S.pokes < 3 ? [1.5, 1.25, 0.9][S.pokes - 1] : 0;
          a.tx += rand(30, 70);
          a.ty += rand(50, 90);
        }
      } else if (a.visible) {
        a.tx = 1220;
        a.ty = 1200;
        if (a.x > 1180 && a.y > 1140) a.visible = false;
      }
      if (a.press > 0) a.press -= dt;
      if (a.visible) {
        const f = 1 - Math.exp(-dt * (S.pokes < 3 ? 6 : 3.6));
        a.x += (a.tx - a.x) * f;
        a.y += (a.ty - a.y) * f;
      }
    }
    function drawFakeCursor() {
      const a = auto;
      if (!a.visible) return;
      const s = a.press > 0 ? 0.82 : 1;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.scale(s * 1.5, s * 1.5);
      ctx.shadowColor = "rgba(0,0,0,.35)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 21);
      ctx.lineTo(5.2, 16.4);
      ctx.lineTo(8.6, 24);
      ctx.lineTo(12, 22.5);
      ctx.lineTo(8.5, 15.2);
      ctx.lineTo(15.4, 15.2);
      ctx.closePath();
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = "#1c1720";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    }

    /* ---------- input ---------- */
    function toStage(e) {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * STAGE, ((e.clientY - r.top) / r.height) * STAGE];
    }
    function move(e) {
      const [x, y] = toStage(e);
      cur.x = x;
      cur.y = y;
      cur.lx = (x - BAR.x) / SCALE;
      cur.ly = (y - BAR.y) / SCALE;
      cur.inBar = inCapsule(x, y, 0);
      overIcon = onIcon(x, y);
      cv.style.cursor = overIcon || cur.inBar ? "pointer" : "default";
    }
    function workerAt(lx, ly) {
      let best = null,
        bd = 99;
      for (const w of crew) {
        if (w.hidden || w === OP) continue;
        const dx = Math.abs(lx - w.x),
          top = w.gy + w.dy - 11,
          bot = w.gy + w.dy + 1;
        if (dx < 5 && ly >= top && ly <= bot && dx < bd) {
          bd = dx;
          best = w;
        }
      }
      return best;
    }
    function clickWorker(w) {
      if (w.act || w.air) return;
      hop(w, 64);
      setAct(w, "jump", 0.55);
      w.exclaim = 0.5;
      dropCarry(w);
      Snd.jump();
    }
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerleave", () => {
      cur.inBar = false;
      cur.lx = cur.ly = -99;
      overIcon = false;
    });
    cv.addEventListener("pointerdown", (e) => {
      move(e);
      if (onIcon(cur.x, cur.y)) {
        Snd.setMuted(!Snd.muted);
        Snd.tick();
        return;
      }
      if (!cur.inBar) return;
      pressed = true;
      pressT = 0;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (S.phase === "freeze" || S.phase === "stall") poke();
      else {
        const w = workerAt(cur.lx, cur.ly);
        if (w) clickWorker(w);
      }
    });
    const release = () => {
      pressed = false;
      pressHeld = false;
    };
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("contextmenu", (e) => e.preventDefault());

    /* ---------- render ---------- */
    function drawScene() {
      g.drawImage(layerSky, 0, 0);
      drawSkyLife();
      g.drawImage(layerRig, 0, 0);
      drawHutLifeBack();
      drawCraneDynamic();
      drawWall();
      drawTower();
      drawGround();
      g.drawImage(layerFront, 0, 0);
      drawLamps();
      drawPuddle();
      drawMixer(S.phase === "build");
      drawBarrow();
      drawLoose();
      for (const w of crew) {
        if (w === OP) drawCraneOp(w);
        else drawWorker(w);
      }
      drawFlying();
      drawHats();
      drawParts();
      drawSign(FOREMAN);
    }
    function pillInterior() {
      pill(ctx, BAR.x, BAR.y, BAR.w, BAR.h);
    }
    const FONTS = '600 34px "Segoe UI Variable Display","Segoe UI","SF Pro Display",system-ui,sans-serif';
    function drawStatus() {
      if (hideUI) return;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = FONTS;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(40,20,5,.85)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      if ("letterSpacing" in ctx) ctx.letterSpacing = ".4px";
      const y = BAR.y + BAR.h + FR + 84,
        a = smooth(status.a);
      if (a < 1 && status.prev) {
        ctx.globalAlpha = 1 - a;
        ctx.fillText(status.prev, 540, y - a * 10);
      }
      ctx.globalAlpha = a;
      ctx.fillText(status.txt, 540, y + (1 - a) * 10);
      ctx.globalAlpha = 1;
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
    function drawIcon() {
      if (hideUI) return;
      const x = ICON.x,
        y = ICON.y;
      ctx.save();
      ctx.globalAlpha = overIcon ? 0.95 : 0.62;
      ctx.translate(x, y);
      ctx.fillStyle = "#6d6256";
      ctx.strokeStyle = "#6d6256";
      ctx.lineWidth = 3.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-15, -5);
      ctx.lineTo(-8, -5);
      ctx.lineTo(1, -13);
      ctx.lineTo(1, 13);
      ctx.lineTo(-8, 5);
      ctx.lineTo(-15, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (Snd.muted) {
        ctx.beginPath();
        ctx.moveTo(8, -7);
        ctx.lineTo(20, 7);
        ctx.moveTo(20, -7);
        ctx.lineTo(8, 7);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(4, 0, 9, -0.7, 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(4, 0, 16, -0.75, 0.75);
        ctx.stroke();
      }
      ctx.restore();
    }
    function render() {
      drawScene();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, cv.width, cv.height); /* the parquet behind the canvas shows through */
      ctx.setTransform(k, 0, 0, k, 0, 0);
      const cx = OUT.x + OUT.w / 2,
        cy = OUT.y + OUT.h / 2;
      const sx0 = Math.sin(rt * 71) * shakeA,
        sy0 = Math.cos(rt * 63) * shakeA * 0.7,
        rot = Math.sin(rt * 53) * shakeA * 0.0011;
      /* shadow stays on the ground: lifting makes it wider and fainter */
      const sa = clamp(1 + lift.p * 0.022, 0.6, 1.12),
        sscale = 1 - lift.p * 0.0012;
      ctx.save();
      ctx.globalAlpha = sa;
      ctx.translate(cx + sx0 * 0.4, cy - lift.p * 0.45);
      ctx.scale(sscale + squash.p * 0.3, sscale);
      ctx.drawImage(shadowCan, -OUT.w / 2 - M, -OUT.h / 2 - M, OUT.w + M * 2, OUT.h + M * 2);
      ctx.restore();
      /* the shadow fades out before the canvas edge, so the edge can't be seen */
      ctx.globalCompositeOperation = "destination-out";
      for (const [a, b] of [
        [0, 34],
        [1080, 1046],
      ]) {
        const gr = ctx.createLinearGradient(a, 0, b, 0);
        gr.addColorStop(0, "rgba(0,0,0,1)");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr;
        ctx.fillRect(Math.min(a, b), 0, 34, 1080);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.save();
      ctx.translate(cx + sx0, cy + lift.p + sy0);
      ctx.rotate(rot);
      ctx.scale(1 + squash.p * 0.42, 1 - squash.p);
      ctx.translate(-cx, -cy);
      if (flash.ring > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, flash.ring) * 0.85;
        ctx.drawImage(glowCan, OUT.x - M, OUT.y - M, OUT.w + M * 2, OUT.h + M * 2);
        ctx.restore();
      }
      ctx.drawImage(frameCan, OUT.x - M, OUT.y - M, OUT.w + M * 2, OUT.h + M * 2);
      ctx.save();
      pillInterior();
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, BAR.x - 1, BAR.y - 1, PW * PIX, PH * PIX);
      ctx.imageSmoothingEnabled = true;
      if (flash.v > 0.01) {
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255,244,214,${Math.min(1, flash.v) * 0.88})`;
        ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.restore();
      ctx.drawImage(overlayCan, OUT.x - M, OUT.y - M, OUT.w + M * 2, OUT.h + M * 2);
      ctx.restore();
      drawStatus();
    }

    /* ---------- main loop ---------- */
    function spring(s, target, kk, c, dt) {
      s.v += ((target - s.p) * kk - s.v * c) * dt;
      s.p += s.v * dt;
    }
    let last = performance.now(),
      lastRate = 1;
    let frames = 0,
      lastFrameAt = performance.now(),
      maxGap = 0;
    function tick(now) {
      if (stopped) return;
      const rdt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      rt += rdt;
      /* press and hover springs */
      if (pressed) {
        pressT += rdt;
        if (pressT > 0.18) pressHeld = true;
      }
      spring(lift, pressed ? 3 : cur.inBar ? -10 : 0, 190, 13, rdt);
      spring(squash, pressed ? 0.07 : 0, 520, 15, rdt);
      shakeA *= Math.exp(-rdt * 7.5);
      if (shakeA < 0.05) shakeA = 0;
      flash.v *= Math.exp(-rdt * 5.5);
      flash.ring *= Math.exp(-rdt * 2.6);
      status.a = Math.min(1, status.a + rdt * 5.5);
      const tgt = pressHeld ? 3.6 : 1;
      ff += (tgt - ff) * Math.min(1, rdt * 12);
      if (Math.abs(ff - tgt) < 0.005) ff = tgt;
      if (Math.abs(ff - lastRate) > 0.008) {
        lastRate = ff;
        Snd.setRate(ff);
      }
      updateAuto(rdt);
      const dt = rdt * ff;
      simT += dt;
      updateTimers(dt);
      storyStep(dt);
      updateFlying(dt);
      for (const w of crew) updateWorker(w, dt);
      for (const b of bricks) if (b.pop > 0) b.pop -= dt;
      updateParts(dt);
      updateLoose(dt);
      updateHats(dt);
      updateCrane(dt, S.phase !== "build");
      updateTower(dt, S.phase === "build" ? tower.tx : 174);
      updateSkyLife(dt);
      render();
      frames++;
      if (now - lastFrameAt > maxGap && frames > 3) maxGap = now - lastFrameAt;
      lastFrameAt = now;
      nextFrame(tick);
    }

    /* start */
    buildWall();
    resetCrew();
    newRun(1);
    resize();
    addEventListener("message", (e) => {
      const m = e.data;
      if (m.p !== undefined) {
        realP = clamp(m.p, 0, 1);
        if (m.text) setStatus(m.text);
      }
      if (m.size) {
        boot.size = m.size;
        resize();
      }
      if (m.stop) {
        stopped = true;
        postMessage({ frames, maxGap: Math.round(maxGap), ms: Math.round(performance.now()) });
      }
    });
    nextFrame((t) => {
      last = t;
      tick(t);
    });
  })();
}
