// Status line, shot meters and control buttons. Reads the game, writes the DOM.
import { perfectZoneU } from './meterMap';
import type { Game } from './game';
import { isSpare, matchScore, status } from './match';
import { aimReadout, powerReadout, spinReadout } from './readouts';
import { byId } from './dom';
import { S } from './strings';

const HINT: Record<string, string> = {
  position: 'Slide to a pocket tick (arrows or drag the ball), then lock.',
  aim: 'Lock the aim when the arrow is in the tinted sweet spot.',
  power: 'Lock the power. Stronger scatters pins more.',
  spin: 'Lock the hook (left or right curve) to throw.',
};

export interface HudRefs {
  status: HTMLElement;
  lock: HTMLButtonElement;
  left: HTMLButtonElement;
  right: HTMLButtonElement;
  back: HTMLButtonElement;
  turn: HTMLElement;
  meters: Record<'aim' | 'power' | 'spin', HTMLElement>;
  reads: Record<'aim' | 'power' | 'spin', HTMLElement>;
  rows: Record<'aim' | 'power' | 'spin', HTMLElement>;
}

export function hudRefs(): HudRefs {
  return {
    status: byId('status'), lock: byId('lock'), left: byId('left'), right: byId('right'), back: byId('back'), turn: byId('turn'),
    meters: { aim: byId('m-aim'), power: byId('m-power'), spin: byId('m-spin') },
    reads: { aim: byId('o-aim'), power: byId('o-power'), spin: byId('o-spin') },
    rows: { aim: byId('r-aim'), power: byId('r-power'), spin: byId('r-spin') },
  };
}

export function statusText(game: Game): string {
  const st = status(game.match);
  const who = game.match.players[st.player]?.name ?? '';
  const where = isSpare(game.match) ? `Leave ${st.frame} of 10, one ball` : `${who}, frame ${st.frame}, ball ${st.ball}`;
  switch (game.stage) {
    case 'ready': return `${where}. ${HINT[game.input.phase] ?? ''}`;
    case 'cpu': return `${who} is lining up…`;
    case 'rolling': return `${where}: rolling…`;
    case 'settle': case 'sweep': return 'Pins settling…';
    case 'over': return S.gameOver;
    default: return `${where}.`;
  }
}

/** Turn chip text: player, frame, ball and the running total, spelled out. */
export function turnLabel(game: Game): string {
  const st = status(game.match);
  const total = matchScore(game.match, st.player);
  if (isSpare(game.match)) return S.turnLineSpare(st.frame, total);
  return S.turnLine(game.match.players[st.player]?.name ?? '', st.frame, st.ball, total);
}

function lockLabel(game: Game): string {
  if (game.humanTurn) return S.lockLabels[game.input.phase as keyof typeof S.lockLabels] ?? 'Lock';
  if (game.canSkipNow) return S.skip;
  if (game.stage === 'over') return S.gameOverShort;
  if (game.stage === 'cpu') return S.cpuTurn;
  return game.stage === 'rolling' ? S.lockLabels.rolling : S.pinsFalling;
}

export function updateHudText(r: HudRefs, game: Game): void {
  const text = statusText(game);
  if (r.status.textContent !== text) r.status.textContent = text;
  const label = turnLabel(game);
  if (r.turn.textContent !== label) r.turn.textContent = label;
  const human = game.humanTurn;
  const phase = game.input.phase;
  const lock = lockLabel(game);
  if (r.lock.textContent !== lock) r.lock.textContent = lock;
  r.lock.disabled = !(human || game.canSkipNow) || game.paused;
  r.left.disabled = !human || phase !== 'position';
  r.right.disabled = !human || phase !== 'position';
  r.back.disabled = !human || phase === 'position';
}

function setMeter(r: HudRefs, key: 'aim' | 'power' | 'spin', value: number, pct: number, text: string, active: boolean, done: boolean): void {
  const node = r.meters[key];
  node.classList.toggle('active', active);
  node.classList.toggle('done', done);
  r.rows[key].classList.toggle('active', active);
  r.rows[key].classList.toggle('done', done);
  node.style.setProperty('--pos', `${pct.toFixed(1)}%`);
  node.setAttribute('aria-valuenow', value.toFixed(2));
  const shown = done ? `${text} ${S.locked}` : text;
  node.setAttribute('aria-valuetext', shown);
  const read = r.reads[key];
  const out = done ? `✓ ${text}` : text;
  if (read.textContent !== out) read.textContent = out;
}

/** Per-frame meter sync. */
export function updateMeters(r: HudRefs, game: Game): void {
  const { phase, aimU, power, spinU } = game.input;
  const at = ['position', 'aim', 'power', 'spin', 'rolling'].indexOf(phase);
  const live = game.stage === 'ready' || game.stage === 'cpu';
  setMeter(r, 'aim', aimU, ((aimU + 1) / 2) * 100, aimReadout(aimU), live && phase === 'aim', at > 1);
  setMeter(r, 'power', power, power * 100, powerReadout(power), live && phase === 'power', at > 2);
  setMeter(r, 'spin', spinU, ((spinU + 1) / 2) * 100, spinReadout(spinU), live && phase === 'spin', at > 3);
  r.meters.aim.style.setProperty('--zone', `${(perfectZoneU(game.input.assist) * 100).toFixed(1)}%`);
}
