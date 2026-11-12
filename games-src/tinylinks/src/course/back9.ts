import type { HoleDef } from '../physics/types';
import { P, oval, poly, rect } from './helpers';

export const BACK_NINE: readonly HoleDef[] = [
  {
    id: 10, name: 'Dune Corner', par: 4,
    tee: P(110, 130), cup: P(690, 380),
    walls: [poly(60, 80, 740, 80, 740, 430, 640, 430, 640, 180, 60, 180)],
    sand: [{ shape: oval(640, 130, 52, 40) }],
  },
  {
    id: 11, name: 'Stepping Stones', par: 4,
    tee: P(110, 350), cup: P(690, 150),
    walls: [poly(60, 90, 740, 90, 740, 410, 60, 410)],
    hazards: [{ kind: 'water', shape: rect(250, 90, 90, 200) }, { kind: 'water', shape: rect(460, 210, 90, 200) }],
  },
  {
    id: 12, name: 'Ramp Rally', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 100, 740, 100, 740, 400, 60, 400)],
    slopes: [{ shape: rect(230, 100, 170, 300), ax: 0, ay: -190 }, { shape: rect(440, 100, 170, 300), ax: 0, ay: 190 }],
    hazards: [{ kind: 'void', shape: rect(630, 100, 110, 80) }],
  },
  {
    id: 13, name: 'Pinball Pit', par: 4,
    tee: P(110, 250), cup: P(700, 250),
    walls: [poly(60, 100, 740, 100, 740, 400, 60, 400)],
    posts: [
      { x: 300, y: 170, r: 16 }, { x: 300, y: 330, r: 16 }, { x: 410, y: 250, r: 16 },
      { x: 520, y: 170, r: 16 }, { x: 520, y: 330, r: 16 },
    ],
  },
  {
    id: 14, name: 'Twin Gates', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 120, 740, 120, 740, 380, 60, 380)],
    movers: [
      { kind: 'slide', cx: 310, cy: 250, w: 22, h: 100, axis: 'y', amp: 80, period: 3.0, phase: 0 },
      { kind: 'slide', cx: 520, cy: 250, w: 22, h: 100, axis: 'y', amp: 80, period: 3.0, phase: Math.PI },
    ],
  },
  {
    id: 15, name: 'The Spinner', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 100, 740, 100, 740, 400, 60, 400)],
    movers: [{ kind: 'spin', cx: 400, cy: 250, len: 190, thick: 14, omega: 1.5, phase: 0.5 }],
  },
  {
    id: 16, name: 'Sand and Sea', par: 4,
    tee: P(110, 250), cup: P(700, 250),
    walls: [poly(60, 90, 740, 90, 740, 410, 60, 410)],
    hazards: [{ kind: 'water', shape: oval(290, 250, 58, 112) }],
    sand: [{ shape: oval(520, 250, 72, 92) }],
  },
  {
    id: 17, name: 'Switchback', par: 5,
    tee: P(110, 95), cup: P(690, 375),
    walls: [poly(60, 60, 740, 60, 740, 270, 130, 270, 130, 340, 740, 340, 740, 410, 60, 410, 60, 200, 670, 200, 670, 130, 60, 130)],
    sand: [{ shape: oval(420, 235, 40, 22) }],
  },
  {
    id: 18, name: 'The Gauntlet', par: 5,
    tee: P(100, 250), cup: P(715, 250),
    walls: [poly(60, 90, 740, 90, 740, 410, 60, 410)],
    hazards: [{ kind: 'water', shape: rect(190, 90, 70, 135) }, { kind: 'water', shape: rect(190, 275, 70, 135) }],
    sand: [{ shape: oval(470, 250, 50, 70) }],
    movers: [
      { kind: 'slide', cx: 340, cy: 250, w: 20, h: 110, axis: 'y', amp: 70, period: 3.2, phase: 0 },
      { kind: 'spin', cx: 610, cy: 250, len: 150, thick: 12, omega: -1.7, phase: 0 },
    ],
  },
];
