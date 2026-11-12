// The game screen's views: board, pad, HUD, hint sheet, tool states and the pause overlay.
import type { Session } from '../session';
import { BoardView } from '../ui/board';
import { $ } from '../ui/dom';
import { renderHint } from '../ui/hintPanel';
import { renderHud, resetHud } from '../ui/hud';
import { PadView } from '../ui/pad';
import { STR, hintLabel } from '../strings';
import { renderPause } from '../ui/pauseOverlay';

const TOOL_IDS = ['tool-notes', 'tool-erase', 'tool-hint', 'tool-solver', 'tool-step', 'tool-all'] as const;

export class GameScreen {
  readonly board: BoardView;
  readonly pad: PadView;
  visible = false;

  constructor(onSelect: (cell: number) => void, onDigit: (d: number) => void) {
    this.board = new BoardView($('board'), onSelect);
    this.pad = new PadView($('pad'), onDigit);
  }

  /** Switches between the title and the game; the body class drives the landscape layout. */
  show(visible: boolean): void {
    this.visible = visible;
    $('screen-title').hidden = visible;
    $('screen-game').hidden = !visible;
    document.body.classList.toggle('in-game', visible);
    $('btn-pause-top').hidden = !visible;
  }

  newSession(): void {
    resetHud();
  }

  render(s: Session | null): void {
    renderPause(s, this.visible);
    if (!s) return;
    this.board.render(s);
    this.pad.render(s);
    renderHud(s);
    renderHint(s);
    $('tool-notes').setAttribute('aria-pressed', String(s.notesMode));
    const off = !s.playing;
    $<HTMLButtonElement>('tool-undo').disabled = off || s.history.past.length === 0;
    $<HTMLButtonElement>('tool-redo').disabled = off || s.history.future.length === 0;
    for (const id of TOOL_IDS) $<HTMLButtonElement>(id).disabled = off;
    if (off) $('solver-pop').hidden = true;
    const pauseLabel = s.status === 'paused' ? 'Resume' : 'Pause';
    $('tool-pause').textContent = pauseLabel;
    const top = $('btn-pause-top');
    const topLabel = s.status === 'paused' ? STR.resumeTop : STR.pauseTop;
    top.setAttribute('aria-label', topLabel);
    top.title = topLabel;
    top.dataset.state = s.status === 'paused' ? 'play' : 'pause';
    $('tool-hint').textContent = hintLabel(s.dash !== null);
    const over = s.status === 'won' || s.status === 'lost';
    $<HTMLButtonElement>('tool-pause').disabled = over;
    $<HTMLButtonElement>('btn-pause-top').disabled = over;
  }

  /** Per-frame HUD paint (clock and bars only). */
  frame(s: Session, extraMs: number): void {
    renderHud(s, extraMs);
  }
}
