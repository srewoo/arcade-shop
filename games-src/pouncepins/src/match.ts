// Match state: players, shot phases (aim -> power -> roll -> result) and turn flow.
import { CONFIG, type Difficulty } from './config';
import { makeSetup, pickFishFrames } from './layout';
import { createWorld, launch, pinsDown, prepareNextBall } from './physics';
import { between, hashSeed, mulberry32 } from './rng';
import { frameState, labelFor, scoreFrames, totalScore, type RollLabel } from './scoring';
import { at, clamp } from './util';
import type { World } from './worldTypes';

export type Phase = 'aim' | 'power' | 'rolling' | 'result' | 'over';
export type Players = 1 | 2;

export interface MatchOptions { readonly players: Players; readonly difficulty: Difficulty; readonly seed: number }

export interface PlayerState { readonly name: string; readonly rolls: number[]; fish: number }

export interface RollResult { readonly pins: number; readonly label: RollLabel; readonly player: number; readonly fishGot: boolean }

export type GameEvent =
  | { readonly type: 'aimLock' } | { readonly type: 'throw'; readonly power: number }
  | { readonly type: 'hit'; readonly id: number; readonly power: number }
  | { readonly type: 'wobble'; readonly id: number } | { readonly type: 'scare'; readonly id: number }
  | { readonly type: 'land'; readonly id: number } | { readonly type: 'cushion'; readonly id: number }
  | { readonly type: 'fish' } | { readonly type: 'gutter' }
  | { readonly type: 'result'; readonly result: RollResult }
  | { readonly type: 'frameStart'; readonly player: number; readonly frame: number }
  | { readonly type: 'over' };

export interface Match {
  readonly opts: MatchOptions;
  readonly players: PlayerState[];
  readonly fishFrames: readonly number[];
  current: number;
  phase: Phase;
  /** Seconds spent in the current phase. */
  phaseT: number;
  throwNo: number;
  aim: { phase: number; speed: number; angle: number; prev: number };
  power: { phase: number; value: number; prev: number };
  curve: number;
  world: World;
  fishThisBall: boolean;
  result: RollResult | null;
  events: GameEvent[];
}

export const playerRolls = (m: Match, i = m.current): number[] => at(m.players, i).rolls;
export const currentFrame = (m: Match): number => frameState(playerRolls(m)).frame;

function rackFor(m: Match): World {
  const rolls = playerRolls(m);
  const { frame } = frameState(rolls);
  const setup = makeSetup(hashSeed(m.opts.seed, m.current, frame, rolls.length), m.fishFrames.includes(frame));
  return createWorld(setup);
}

/** Pick this throw's arrow sweep speed and start phase (new each throw). */
export function beginAim(m: Match): void {
  const rng = mulberry32(hashSeed(m.opts.seed, 7919, m.throwNo));
  const { sweepMin, sweepMax, diff } = CONFIG.aim;
  m.aim.speed = between(rng, sweepMin, sweepMax) * diff[m.opts.difficulty];
  m.aim.phase = between(rng, 0, Math.PI * 2);
  m.aim.angle = m.aim.prev = Math.sin(m.aim.phase) * CONFIG.ball.maxAim;
  m.power = { phase: 0, value: 0, prev: 0 };
  m.phase = 'aim';
  m.phaseT = 0;
  m.throwNo++;
}

export function createMatch(opts: MatchOptions): Match {
  const fishFrames = pickFishFrames(mulberry32(hashSeed(opts.seed, 31337)));
  const names = opts.players === 1 ? ['You'] : ['Player 1', 'Player 2'];
  const players = names.map((name) => ({ name, rolls: [] as number[], fish: 0 }));
  const m: Match = {
    opts, players, fishFrames, current: 0, phase: 'aim', phaseT: 0, throwNo: 0,
    aim: { phase: 0, speed: 1, angle: 0, prev: 0 }, power: { phase: 0, value: 0, prev: 0 }, curve: 0,
    world: createWorld({ kinds: [], coats: [], fish: null }), fishThisBall: false, result: null, events: [],
  };
  m.world = rackFor(m);
  beginAim(m);
  m.events.push({ type: 'frameStart', player: 0, frame: 1 });
  return m;
}

export function setCurve(m: Match, delta: number): void {
  if (m.phase !== 'aim' && m.phase !== 'power') return;
  m.curve = clamp(m.curve + delta, -CONFIG.ball.maxCurve, CONFIG.ball.maxCurve);
}

/** The single player action: lock aim, then lock power and throw. */
export function act(m: Match): void {
  if (m.phase === 'aim') {
    m.phase = 'power';
    m.phaseT = 0;
    m.events.push({ type: 'aimLock' });
  } else if (m.phase === 'power') {
    launch(m.world, m.aim.angle, m.power.value, m.curve);
    m.phase = 'rolling';
    m.phaseT = 0;
    m.fishThisBall = false;
    m.events.push({ type: 'throw', power: m.power.value });
  }
}

/** Throw straight away with explicit numbers (debug hook / tests). */
export function throwNow(m: Match, angle: number, power: number, curve: number): void {
  if (m.phase !== 'aim' && m.phase !== 'power') return;
  m.aim.angle = m.aim.prev = angle;
  m.power.value = m.power.prev = power;
  m.curve = clamp(curve, -CONFIG.ball.maxCurve, CONFIG.ball.maxCurve);
  m.phase = 'power';
  act(m);
}

/** Record the finished roll and enter the result phase. */
export function finishRoll(m: Match): void {
  const player = at(m.players, m.current);
  const before = frameState(player.rolls);
  const pins = pinsDown(m.world);
  const label = labelFor(pins, before.standing, before.fresh);
  player.rolls.push(pins);
  const result: RollResult = { pins, label, player: m.current, fishGot: m.fishThisBall };
  m.result = result;
  m.phase = 'result';
  m.phaseT = 0;
  m.events.push({ type: 'result', result });
}

export const resultDuration = (m: Match): number =>
  m.result?.label === 'strike' ? CONFIG.flow.strikeSecs : CONFIG.flow.resultSecs;

/** Leave the result phase: next ball, next frame, next player, or game over. */
export function advanceTurn(m: Match): void {
  const mine = frameState(playerRolls(m));
  const everyoneDone = m.players.every((p) => frameState(p.rolls).complete);
  if (everyoneDone) {
    m.phase = 'over';
    m.events.push({ type: 'over' });
    return;
  }
  if (!mine.fresh && !mine.complete) prepareNextBall(m.world);
  else {
    const frameOver = mine.complete || (mine.fresh && !(mine.frame === CONFIG.frames.count && mine.ball > 1));
    if (m.players.length > 1 && frameOver) m.current = nextPlayer(m);
    m.world = rackFor(m);
    m.events.push({ type: 'frameStart', player: m.current, frame: currentFrame(m) });
  }
  m.result = null;
  beginAim(m);
}

function nextPlayer(m: Match): number {
  for (let step = 1; step <= m.players.length; step++) {
    const idx = (m.current + step) % m.players.length;
    if (!frameState(playerRolls(m, idx)).complete) return idx;
  }
  return m.current;
}

export const totals = (m: Match): { bowling: number; fish: number; score: number }[] =>
  m.players.map((p) => {
    const bowling = totalScore(p.rolls);
    const fish = p.fish * CONFIG.frames.fishPoints;
    return { bowling, fish, score: bowling + fish };
  });

export const frameBoxes = (m: Match, i: number): ReturnType<typeof scoreFrames> => scoreFrames(playerRolls(m, i));
