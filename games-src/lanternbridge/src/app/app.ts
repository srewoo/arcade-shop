// Shared mutable application context passed to the nav / play / input modules.
import { STORAGE_KEYS } from '../config';
import type { Progress } from '../progress';
import type { Level } from '../puzzle/types';
import type { Session } from '../session';
import type { Settings } from '../settings';
import type { Modal } from '../ui/dialogs';
import type { Hud } from '../ui/hud';
import type { PackChoice } from '../ui/menu';
import type { Scene } from '../ui/scene';
import type { Shell } from '../ui/shell';
import type { createResult, createRoute, createSettings } from '../ui/panels';

export interface Context {
  readonly pack: PackChoice;
  readonly levels: readonly Level[];
  index: number;
}

export interface Dialogs {
  pause: Modal;
  help: Modal;
  route: ReturnType<typeof createRoute>;
  result: ReturnType<typeof createResult>;
  settings: ReturnType<typeof createSettings>;
}

export interface App {
  readonly shell: Shell;
  readonly scene: Scene;
  readonly hud: Hud;
  dlg: Dialogs;
  settings: Settings;
  progress: Progress;
  ctx: Context | null;
  session: Session | null;
  hint: readonly number[];
  resultTimer: number;
  openSettings: () => void;
}

export const say = (app: App, text: string): void => { app.shell.live.textContent = text; };

export const namesOf = (level: Level, ids: readonly number[]): string => ids.map((i) => level.actors[i]?.name ?? '').join(' and ');

export const onboardKey = (app: App): string =>
  app.ctx?.levels[0]?.pack === 'raft' ? STORAGE_KEYS.onboardRaft : STORAGE_KEYS.onboardBridge;

export function refresh(app: App, animate: boolean): void {
  const { session: s, ctx } = app;
  if (!s || !ctx) return;
  const st = s.state();
  const over = s.outcome() !== 'playing';
  app.scene.render({ level: s.level, state: st, selected: s.selected(), hint: app.hint, locked: over }, animate);
  app.scene.root.classList.toggle('won', s.outcome() === 'won');
  app.hud.update({
    level: s.level, index: ctx.index, total: ctx.levels.length, cost: st.cost, moves: st.moves,
    canUndo: s.canUndo(), canCross: s.selected().length > 0, over,
  });
}
