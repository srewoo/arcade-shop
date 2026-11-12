import type { HoleDef } from '../physics/types';
import { P, oval, poly, rect } from './helpers';

export const FRONT_NINE: readonly HoleDef[] = [
  {
    id: 1, name: 'First Tee', par: 2,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 195, 740, 195, 740, 305, 60, 305)],
  },
  {
    id: 2, name: 'Elbow Room', par: 3,
    tee: P(110, 390), cup: P(510, 130),
    walls: [poly(60, 340, 460, 340, 460, 80, 560, 80, 560, 440, 60, 440)],
  },
  {
    id: 3, name: 'Sandbar', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 120, 740, 120, 740, 380, 60, 380)],
    sand: [{ shape: oval(400, 250, 70, 68) }],
  },
  {
    id: 4, name: 'Pinball Alley', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 150, 740, 150, 740, 350, 60, 350)],
    posts: [{ x: 300, y: 215, r: 15 }, { x: 420, y: 288, r: 15 }, { x: 540, y: 212, r: 15 }],
  },
  {
    id: 5, name: 'The Keyhole', par: 3,
    tee: P(110, 310), cup: P(690, 190),
    walls: [poly(60, 120, 385, 120, 385, 235, 415, 235, 415, 120, 740, 120, 740, 380, 415, 380, 415, 305, 385, 305, 385, 380, 60, 380)],
  },
  {
    id: 6, name: 'Cross Slope', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 130, 740, 130, 740, 370, 60, 370)],
    slopes: [{ shape: rect(300, 130, 200, 240), ax: 0, ay: 190 }],
  },
  {
    id: 7, name: 'Pond Bridge', par: 3,
    tee: P(110, 265), cup: P(690, 265),
    walls: [poly(60, 110, 740, 110, 740, 390, 60, 390)],
    hazards: [{ kind: 'water', shape: rect(320, 110, 160, 135) }, { kind: 'water', shape: rect(320, 285, 160, 105) }],
  },
  {
    id: 8, name: 'The Zigzag', par: 4,
    tee: P(110, 130), cup: P(690, 270),
    walls: [poly(60, 80, 440, 80, 440, 220, 740, 220, 740, 320, 340, 320, 340, 180, 60, 180)],
  },
  {
    id: 9, name: 'Sliding Gate', par: 3,
    tee: P(110, 250), cup: P(690, 250),
    walls: [poly(60, 130, 740, 130, 740, 370, 60, 370)],
    movers: [{ kind: 'slide', cx: 400, cy: 250, w: 22, h: 96, axis: 'y', amp: 78, period: 3.4, phase: 0 }],
  },
];
