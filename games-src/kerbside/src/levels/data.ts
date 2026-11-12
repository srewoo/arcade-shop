// The 24 levels: straight-in, reverse bays, parallel, angled, garages, then trailers.
import type { Draft } from './build';
import { finish, rotate180 } from './build';
import { angledBay, garageBay, parallelBay, rigBay, rowBay, trailerPitch } from './layouts';
import type { Level } from './types';

const row = (o: Parameters<typeof rowBay>[0]): Draft => rowBay(o);
const par = (o: Parameters<typeof parallelBay>[0]): Draft => parallelBay(o);

const drafts: readonly Draft[] = [
  row({ name: 'First Bay', W: 3.6, aisle: 9, each: 0, across: [], kind: 'pull-in', start: { x: 8, y: 14.5, a: -Math.PI / 2 }, timeLimit: 60, parTime: 18, tip: 'Hold Up to roll forward, then let go and tap Down to stop. Ease in, ease out.' }),
  row({ name: 'Turn In', W: 3.4, aisle: 8, each: 0, across: [], kind: 'pull-in', lead: 6, timeLimit: 70, parTime: 24, tip: 'Steer early: the car pivots around its rear wheels.' }),
  row({ name: 'Neighbours', W: 3.0, aisle: 7.5, each: 1, across: [], kind: 'pull-in', timeLimit: 75, parTime: 28, tip: 'Swing wide, then aim at the middle of the gap.' }),
  row({ name: 'Back Into It', W: 3.0, aisle: 6.5, each: 2, across: [], timeLimit: 80, parTime: 32, tip: 'Hold Down to reverse. The rear swings the way you steer.' }),
  row({ name: 'Opposite Number', W: 2.9, aisle: 6, each: 2, across: [2], shift: 2, timeLimit: 85, parTime: 36, tip: 'One car across the aisle: a tighter turn, a gentler reverse.' }),
  row({ name: 'Tight Row', W: 2.8, aisle: 5.6, each: 2, across: [1, 2, 3], shift: 4, timeLimit: 90, parTime: 40, tip: 'Use the brake pedal (Space) for small, exact stops.' }),
  row({ name: 'Full Car Park', W: 2.7, aisle: 5.4, each: 3, across: [0, 1, 2, 3, 4, 5, 6], shift: 1, timeLimit: 95, parTime: 46, tip: 'Pull up past the bay, then reverse in on a curve.' }),
  row({ name: 'Cone Alley', W: 2.6, aisle: 5.4, each: 2, across: [1, 2, 3], shift: 5, cones: [[11, 9.4], [17, 9.2]], timeLimit: 100, parTime: 50, tip: 'Small cones count as damage too. Look at the corners.' }),
  par({ name: 'Kerb Crawl', gap: 8.4, lane: 7, opposite: false, extra: false, timeLimit: 80, parTime: 30, tip: 'Line up beside the front car, reverse with full lock, then straighten.' }),
  par({ name: 'Between Two', gap: 7.6, lane: 7, opposite: false, extra: true, shift: 2, timeLimit: 85, parTime: 34, tip: 'Stop level with the front car, wheel hard right, reverse.' }),
  par({ name: 'Squeeze', gap: 6.9, lane: 6.4, opposite: true, extra: false, shift: 3, timeLimit: 90, parTime: 40, tip: 'Opposite kerb limits your swing: shuffle forward and back.' }),
  rotate180(par({ name: 'Wrong Side', gap: 6.4, lane: 6, opposite: true, extra: true, shift: 1, timeLimit: 95, parTime: 44, tip: 'Same trick, other direction. Mirror your steering.' })),
  par({ name: 'Snug Fit', gap: 6.3, lane: 5.8, opposite: true, extra: true, shift: 4, timeLimit: 100, parTime: 50, tip: 'Under one and a half car lengths. Expect a couple of shuffles.' }),
  rotate180(par({ name: 'Last Space', gap: 6.0, lane: 5.6, opposite: true, extra: true, shift: 5, timeLimit: 110, parTime: 58, tip: 'The tightest kerb space in town. Patience beats speed.' })),
  angledBay({ name: 'Slant', tiltDeg: 20, W: 3.0, aisle: 6.5, each: 2, timeLimit: 90, parTime: 34, tip: 'Angled bays lean: enter on the lean, not straight on.' }),
  angledBay({ name: 'Herringbone', tiltDeg: 30, W: 2.9, aisle: 6, each: 2, shift: 2, timeLimit: 95, parTime: 38, tip: 'Pass the bay, then back in following its lean.' }),
  angledBay({ name: 'Lean To', tiltDeg: 38, W: 2.8, aisle: 5.8, each: 3, shift: 3, timeLimit: 100, parTime: 44, tip: 'The steeper the lean, the sharper the entry.' }),
  angledBay({ name: 'Sharp Angle', tiltDeg: 45, W: 2.6, aisle: 5.6, each: 3, shift: 5, timeLimit: 110, parTime: 50, tip: 'Tight and steep. Take it slowly and straighten in the bay.' }),
  garageBay({ name: 'Garage Door', W: 2.9, aisle: 7, pillars: false, timeLimit: 100, parTime: 44, tip: 'Walls on both sides. Line up straight before you commit.' }),
  garageBay({ name: 'Pillar Garage', W: 2.6, aisle: 6, pillars: true, timeLimit: 115, parTime: 56, tip: 'Pillars in the aisle and a narrow door.' }),
  rigBay({ name: 'First Tow', length: 11.5, width: 3.6, offset: 3.2, kerbed: true, timeLimit: 150, parTime: 60, tip: 'Trailer on! It follows the car; reversing makes it bend.' }),
  rigBay({ name: 'Long Haul', length: 11, width: 3.4, offset: 4.2, kerbed: false, timeLimit: 160, parTime: 80, tip: 'Park the whole rig. Steer the opposite way when reversing.' }),
  trailerPitch({ name: 'Caravan Pitch', W: 3.8, aisle: 9, neighbours: false, timeLimit: 170, parTime: 90, tip: 'Only the trailer must fit. Reverse it in and straighten.' }),
  trailerPitch({ name: 'Tight Pitch', W: 3.2, aisle: 8.4, neighbours: true, timeLimit: 190, parTime: 110, tip: 'Caravans either side. Small corrections, then pull forward to straighten.' }),
];

export const LEVELS: readonly Level[] = drafts.map((d, i) => finish(i + 1, d));
