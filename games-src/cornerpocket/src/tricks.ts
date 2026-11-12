// 15 hand-made trick-shot puzzles. Coordinates are table px (800x400, ball radius 10).
import { type Ball, makeBall } from './physics';

export interface TrickLayout {
  readonly name: string;
  readonly hint: string;
  readonly cue: readonly [number, number];
  readonly balls: readonly (readonly [number, number])[];
  readonly par: number; // shots for 3 stars (par + 1 = 2 stars)
  readonly limit: number; // shot limit (1 star if cleared within it)
}

export const TRICKS: readonly TrickLayout[] = [
  { name: 'Warm Up', hint: 'One ball, one pocket.', cue: [160, 200], balls: [[620, 130]], par: 1, limit: 3 },
  { name: 'Side Door', hint: 'Straight up the middle into the side pocket.', cue: [260, 310], balls: [[400, 150]], par: 1, limit: 3 },
  { name: 'Two Step', hint: 'Plan the cue ball for the second ball.', cue: [150, 200], balls: [[480, 110], [640, 300]], par: 2, limit: 4 },
  { name: 'Rail Rider', hint: 'Cut it along the rail into the corner.', cue: [300, 300], balls: [[690, 24]], par: 1, limit: 3 },
  { name: 'Twins', hint: 'Two side by side. Can one shot take both?', cue: [160, 200], balls: [[560, 180], [560, 220]], par: 2, limit: 4 },
  { name: 'Bridge Builder', hint: 'A blocker sits in the way.', cue: [150, 200], balls: [[400, 200], [650, 200]], par: 2, limit: 4 },
  { name: 'Tight Triangle', hint: 'Break the little cluster apart.', cue: [160, 200], balls: [[540, 200], [557.5, 189.9], [557.5, 210.1]], par: 4, limit: 6 },
  { name: 'Rail Run', hint: 'Three balls hugging the top cushion.', cue: [400, 300], balls: [[250, 22], [520, 22], [700, 22]], par: 3, limit: 5 },
  { name: 'Corner Guards', hint: 'One in front of every corner pocket.', cue: [400, 200], balls: [[60, 60], [740, 60], [60, 340], [740, 340]], par: 5, limit: 7 },
  { name: 'Diamond Cut', hint: 'Four balls, diamond formation.', cue: [200, 200], balls: [[560, 200], [590, 170], [590, 230], [620, 200]], par: 4, limit: 6 },
  { name: 'Snooker Me', hint: 'Blockers between you and the target.', cue: [120, 100], balls: [[620, 300], [380, 200], [250, 150]], par: 3, limit: 5 },
  { name: 'Pins', hint: 'A six-ball triangle. Break it open.', cue: [160, 200], balls: [[540, 200], [557.5, 189.9], [557.5, 210.1], [575, 179.8], [575, 200], [575, 220.2]], par: 7, limit: 9 },
  { name: 'Scatter', hint: 'Five loose balls, think two shots ahead.', cue: [120, 200], balls: [[220, 90], [330, 310], [470, 120], [600, 260], [700, 110]], par: 5, limit: 7 },
  { name: 'Side Pocket Party', hint: 'Plenty of room, plenty of ways to scratch.', cue: [400, 250], balls: [[340, 60], [460, 60], [340, 340], [460, 340], [400, 150]], par: 5, limit: 7 },
  { name: 'Finale', hint: 'Seven balls. Clear the lot.', cue: [100, 200], balls: [[200, 110], [200, 290], [400, 110], [400, 290], [600, 110], [600, 290], [700, 200]], par: 7, limit: 9 },
];

export function trickBalls(layout: TrickLayout): Ball[] {
  const balls: Ball[] = [makeBall(0, layout.cue[0], layout.cue[1])];
  const ids = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11];
  layout.balls.forEach(([x, y], i) => balls.push(makeBall(ids[i]!, x, y)));
  return balls;
}

/** 3 stars at par, 2 at par + 1, 1 within the shot limit, 0 when it was not cleared. */
export function trickStars(layout: TrickLayout, shotsUsed: number, cleared: boolean): 0 | 1 | 2 | 3 {
  if (!cleared || shotsUsed > layout.limit) return 0;
  if (shotsUsed <= layout.par) return 3;
  return shotsUsed <= layout.par + 1 ? 2 : 1;
}
