// Wires DOM buttons and keys to the App through a small controller interface.
import type { Session } from '../session';
import { ModeSchema, DifficultySchema, type Settings } from '../storage';
import { $ } from '../ui/dom';
import { bindKeys, type KeyContext } from '../ui/keys';
import { cancelPendingConfirm } from '../ui/pauseOverlay';
import { bindSolverMenu } from './solverMenu';

export interface Controller {
  readonly session: () => Session | null;
  readonly keyContext: () => KeyContext;
  readonly setSetting: (patch: Partial<Settings>) => void;
  readonly play: (daily: boolean) => void;
  readonly continueGame: () => void;
  readonly openCustom: () => void;
  readonly openSettings: () => void;
  readonly toggleSound: () => void;
  readonly togglePause: () => void;
  readonly resume: () => void;
  readonly menu: () => void;
  readonly playAgain: () => void;
  readonly select: (cell: number) => void;
}

export function bindTitle(c: Controller): void {
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="mode"]')) {
    r.addEventListener('change', () => c.setSetting({ mode: ModeSchema.parse(r.value) }));
  }
  for (const r of document.querySelectorAll<HTMLInputElement>('input[name="difficulty"]')) {
    r.addEventListener('change', () => c.setSetting({ difficulty: DifficultySchema.parse(r.value) }));
  }
  $('opt-limit').addEventListener('change', (e) => c.setSetting({ mistakeLimit: (e.target as HTMLInputElement).checked }));
  $('opt-autonotes').addEventListener('change', (e) => c.setSetting({ autoRemoveNotes: (e.target as HTMLInputElement).checked }));
  $('btn-play').addEventListener('click', () => c.play(false));
  $('btn-daily').addEventListener('click', () => c.play(true));
  $('btn-custom').addEventListener('click', c.openCustom);
  $('btn-continue').addEventListener('click', c.continueGame);
  $('btn-sound').addEventListener('click', c.toggleSound);
  $('btn-settings').addEventListener('click', c.openSettings);
}

export function bindGame(c: Controller): void {
  const on = (id: string, fn: (s: Session) => void): void => $(id).addEventListener('click', () => {
    const s = c.session();
    if (s) fn(s);
  });
  on('tool-notes', (s) => s.toggleNotesMode());
  on('tool-erase', (s) => s.erase());
  on('tool-undo', (s) => s.undo());
  on('tool-redo', (s) => s.redo());
  on('tool-hint', (s) => s.requestHint());
  on('btn-hint-apply', (s) => s.applyCurrentHint());
  on('btn-hint-close', (s) => s.dismissHint());
  $('tool-pause').addEventListener('click', c.togglePause);
  $('btn-pause-top').addEventListener('click', c.togglePause);
  $('tool-menu').addEventListener('click', c.menu);
  $('end-again').addEventListener('click', c.playAgain);
  $('end-menu').addEventListener('click', c.menu);
  bindSolverMenu(c.session);
  bindKeys({
    context: c.keyContext,
    digit: (d) => c.session()?.input(d),
    erase: () => c.session()?.erase(),
    move: (r, col) => {
      c.session()?.move(r, col);
      const s = c.session();
      if (s) c.select(s.selected);
    },
    notes: () => c.session()?.toggleNotesMode(),
    hint: () => c.session()?.requestHint(),
    undo: () => c.session()?.undo(),
    redo: () => c.session()?.redo(),
    pause: () => c.session()?.pause('manual'),
    resumeFromEsc: () => {
      if (!cancelPendingConfirm()) c.resume();
    },
    mute: c.toggleSound,
  });
}

type Base = Omit<Controller, 'keyContext' | 'toggleSound'> & {
  readonly visible: () => boolean;
  readonly settings: () => Settings;
};

/** Adds the derived members (key context, mute toggle) to the app's callbacks. */
export function makeController(base: Base): Controller {
  return {
    ...base,
    keyContext: () => {
      const s = base.session();
      if (!s || !base.visible() || !$('end').hidden) return 'none';
      return s.status === 'paused' ? 'paused' : s.playing ? 'play' : 'none';
    },
    toggleSound: () => base.setSetting({ sound: !base.settings().sound }),
  };
}
