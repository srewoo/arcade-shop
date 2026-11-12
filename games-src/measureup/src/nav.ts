// Navigation and dialogs: title, level list, starting levels, win sheet,
// pause menu. Pure wiring between the controller, screens and overlays.
import { emit } from './audio';
import type { Ctx } from './ctx';
import { generateQuick, randomSeed } from './generator';
import { LEVELS, levelById } from './levels';
import { ONBOARD_KEY } from './progress';
import { starsMarkup, winCopy } from './winCopy';
import { S } from './strings';
import { moveCount } from './game';
import type { PlayController } from './play';
import { readFlag, writeFlag } from './storage';
import { closeDialog, confirmAction, openDialog } from './ui/dialogs';
import { el } from './ui/dom';
import { isOverlayOpen } from './ui/overlay';
import { buildLevelGrid, refreshTitle, showScreen } from './ui/screens';

export interface WinInfo {
  stars: number;
  moves: number;
  par: number;
  hinted: boolean;
  best: number | null;
}

export class Nav {
  constructor(
    private readonly ctx: Ctx,
    private readonly getPlay: () => PlayController,
  ) {}

  private toast = (text: string): void => void (el('toast').textContent = text);

  toTitle = (): void => {
    this.getPlay().cancelPendingWin();
    showScreen(this.ctx, 'title');
    refreshTitle(this.ctx);
    el('go-campaign').focus();
  };

  toLevels = (): void => {
    this.getPlay().cancelPendingWin();
    refreshTitle(this.ctx);
    const target = buildLevelGrid(this.ctx, this.startLevel);
    showScreen(this.ctx, 'levels');
    target?.focus();
  };

  private enterPlay = (): void => {
    showScreen(this.ctx, 'play');
    const onboard = el('onboard');
    onboard.hidden = readFlag(ONBOARD_KEY);
    el('onboard-text').textContent = S.onboard;
    (document.querySelector('#jugs .jug') as HTMLElement | null)?.focus();
  };

  startLevel = (id: number): void => {
    const level = levelById(id);
    if (!level) return;
    this.ctx.quick = null;
    this.getPlay().start(level, String(id));
    this.enterPlay();
  };

  startQuick = (tier: string): void => {
    const seed = randomSeed();
    this.ctx.quick = { seed, tier };
    this.getPlay().start(generateQuick(seed, tier), `#${seed}`);
    this.enterPlay();
  };

  dismissOnboard = (): void => {
    el('onboard').hidden = true;
    writeFlag(ONBOARD_KEY);
  };

  showWin = (info: WinInfo): void => {
    const g = this.ctx.game;
    if (!g) return;
    const copy = winCopy(info.stars, info.moves, info.par, info.hinted);
    const stars = el('win-stars');
    stars.innerHTML = starsMarkup(info.stars);
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', S.starsAria(info.stars));
    el('win-tier').textContent = copy.tier;
    el('win-body').textContent = S.winBody(info.moves, info.par);
    el('win-extra').textContent = info.best !== null ? `${S.winBest(info.best)}. ${copy.note}` : copy.note;
    const next = el<HTMLButtonElement>('win-next');
    const hasNext = this.ctx.quick !== null || g.level.id < LEVELS.length;
    next.hidden = !hasNext;
    next.textContent = this.ctx.quick ? S.newPuzzle : S.next;
    el('win-levels').hidden = this.ctx.quick !== null;
    openDialog('win-overlay', () => undefined, hasNext ? 'win-next' : 'win-replay');
    el('win-stars').classList.remove('pop');
    void el('win-stars').offsetWidth;
    el('win-stars').classList.add('pop');
  };

  winNext = (): void => {
    closeDialog('win-overlay');
    if (this.ctx.quick) this.startQuick(this.ctx.quick.tier);
    else if (this.ctx.game) this.startLevel(this.ctx.game.level.id + 1);
  };

  openPause = (): void => {
    if (this.ctx.screen !== 'play' || isOverlayOpen() || !this.ctx.game || this.ctx.game.solved) return;
    emit('pause');
    this.toast(S.paused);
    openDialog('pause-overlay', () => this.toast(S.resumed), 'pause-resume');
  };

  /** Auto-pause (tab hidden or window blurred) while a level is live. */
  autoPause = (): void => {
    if (this.ctx.game && !this.ctx.game.solved) this.openPause();
  };

  resume = (): void => {
    closeDialog('pause-overlay');
    this.toast(S.resumed);
  };

  askRestart = (): void => {
    if (!this.ctx.game) return;
    const doIt = (): void => {
      closeDialog('pause-overlay');
      this.getPlay().restart();
      (document.querySelector('#jugs .jug') as HTMLElement | null)?.focus();
    };
    if (moveCount(this.ctx.game) === 0 || this.ctx.game.solved) doIt();
    else confirmAction(S.confirmYesRestart, S.confirmRestart, doIt);
  };

  askLeave = (to: 'title' | 'levels'): void => {
    const go = (): void => {
      closeDialog('pause-overlay');
      if (to === 'title') this.toTitle();
      else this.toLevels();
    };
    const live = this.ctx.game && !this.ctx.game.solved && moveCount(this.ctx.game) > 0;
    if (!live) go();
    else confirmAction(S.confirmYesQuit, S.confirmQuit, go);
  };

  back = (): void => {
    if (this.ctx.screen === 'levels') this.toTitle();
    else if (this.ctx.screen === 'play') this.askLeave(this.ctx.quick ? 'title' : 'levels');
  };
}
