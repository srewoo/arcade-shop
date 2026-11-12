// Game flow controller: ties the pure game state to the canvas, HUD and overlays.
import { configureAudio, emit, type Sfx } from './audio';
import { discCount, type Pt } from './board';
import { CONFIG, type ModeId } from './config';
import { dailySeed, dateKey } from './rng';
import { groupAt, isWin, newGame, play, undo, type GameState } from './game';
import { announceClear, endDetail, endTitle, preview, S } from './strings';
import { bestFor, recordResult, saveStats, type Stats } from './stats';
import { saveSettings, type SettingKey, type Settings } from './settings';
import { groupPoints } from './scoring';
import { readFlag, writeFlag } from './storage';
import { applyAppearance } from './ui/appearance';
import { BoardView } from './ui/boardView';
import { el } from './ui/dom';
import { installBoardFit } from './ui/fit';
import { buildHero } from './ui/hero';
import { bumpScore, renderHud, renderMenu, showScreen } from './ui/hud';
import { attachBoardInput } from './ui/input';
import { closeOverlay, isOverlayOpen, openOverlay } from './ui/overlay';
import { syncSettingsPanel } from './ui/panels';
import { PauseDialog } from './ui/pause';

export class App {
  state: GameState | null = null;
  readonly view: BoardView;
  private bestAtStart = 0;
  private endTimer = 0;
  private hintTimer = 0;
  private readonly fit: () => void;
  readonly pause = new PauseDialog({ restart: () => this.restart(), quit: () => this.toMenu() });
  readonly today = dateKey(new Date());
  private readonly reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(public settings: Settings, public stats: Stats, private readonly seedOverride?: number) {
    this.view = new BoardView(el<HTMLCanvasElement>('board'));
    attachBoardInput(el<HTMLCanvasElement>('board'), this.view, {
      board: () => this.state?.board ?? null,
      enabled: () => this.state?.status === 'playing' && !isOverlayOpen(),
      onHover: (p) => this.hover(p),
      onPick: (p) => this.pick(p),
      onCursor: (p) => this.view.setCursor(p),
    });
    this.fit = installBoardFit(el('board-slot'), el('board-wrap'), CONFIG.board.cols, CONFIG.board.rows);
    el('hero').replaceChildren(buildHero());
    this.reducedQuery.addEventListener('change', () => this.applySettings());
    this.applySettings();
    this.toMenu();
  }

  get playing(): boolean {
    return this.state?.status === 'playing';
  }

  sfx(name: Sfx): void {
    emit(name);
  }

  applySettings(): void {
    applyAppearance(this.settings, this.reducedQuery.matches);
    configureAudio({ enabled: this.settings.sound, volume: this.settings.volume });
    this.view.setReduced(document.documentElement.dataset.motion === 'reduce');
    this.view.setAssist(this.settings.colorAssist);
    syncSettingsPanel(this.settings);
  }

  change<K extends SettingKey>(key: K, value: Settings[K]): void {
    this.settings = { ...this.settings, [key]: value, ...(key === 'colorAssist' ? { assistChosen: true } : {}) };
    saveSettings(this.settings);
    this.applySettings();
    if (key === 'volume' || key === 'sound') this.sfx('ui');
  }

  toMenu(): void {
    window.clearTimeout(this.endTimer);
    window.clearTimeout(this.hintTimer);
    this.state = null;
    showScreen('menu');
    renderMenu(this.stats, this.today, (m) => this.start(m));
    el('tagline').textContent = S.tagline;
    el('menu-hint').textContent = S.hintKeys;
  }

  start(mode: ModeId, seed?: number): void {
    window.clearTimeout(this.endTimer);
    const chosen = seed ?? this.seedOverride ?? (mode === 'daily' ? dailySeed(this.today) : (Math.random() * 2 ** 32) >>> 0);
    this.state = newGame(mode, chosen);
    this.bestAtStart = bestFor(this.stats, mode, this.today);
    this.settings = { ...this.settings, lastMode: mode };
    saveSettings(this.settings);
    showScreen('game');
    this.fit();
    this.view.resize();
    this.view.reset(this.state.board);
    this.refresh();
    this.showOnboarding();
    this.setPreview(S.previewIdle);
    el('keys').textContent = S.hintKeys;
    el('live').textContent = `${S.modes[mode].name} started.`;
    this.sfx('ui');
    el<HTMLCanvasElement>('board').focus({ preventScroll: true });
  }

  restart(): void {
    if (this.state) this.start(this.state.mode, this.state.mode === 'daily' ? this.state.seed : undefined);
  }

  private showOnboarding(): void {
    const seen = readFlag(CONFIG.ui.onboardKey);
    el('onboard').classList.toggle('off', seen);
    el('onboard-text').textContent = S.onboard;
    window.clearTimeout(this.hintTimer);
    if (!seen) this.hintTimer = window.setTimeout(() => this.dismissOnboarding(), CONFIG.ui.hintMs);
  }

  /** The hint's slot stays reserved (visibility, not display), so dismissing never reflows the page. */
  dismissOnboarding(): void {
    window.clearTimeout(this.hintTimer);
    writeFlag(CONFIG.ui.onboardKey);
    el('onboard').classList.add('off');
  }

  private setPreview(msg: string, tone: 'info' | 'warn' = 'info'): void {
    const node = el('preview');
    node.textContent = msg;
    node.dataset.tone = tone;
  }

  private hover(p: Pt | null): void {
    if (!this.state || !p) {
      this.view.setHover([]);
      if (this.state) this.setPreview(S.previewIdle);
      return;
    }
    const g = groupAt(this.state, p.x, p.y);
    this.view.setHover(g);
    const points = groupPoints(g.length);
    this.setPreview(g.length ? preview(g.length, points) : S.previewSingle, points > 0 ? 'info' : 'warn');
  }

  pick(p: Pt): void {
    if (!this.state || this.state.status !== 'playing' || isOverlayOpen()) return;
    const res = play(this.state, p.x, p.y);
    if (!res) {
      this.sfx('invalid');
      this.shake();
      this.view.nudge(p);
      this.setPreview(S.previewSingle, 'warn');
      return;
    }
    this.state = res.state;
    if (res.points === 0) this.setPreview(S.pairWarn, 'warn');
    if (!el('onboard').classList.contains('off')) this.dismissOnboarding();
    this.view.applyClear(res.clear, res.points);
    for (const r of res.rises) this.view.applyRise(r.x, r.colours);
    this.sfx(res.group.length >= 5 ? 'bigClear' : 'clear');
    if (res.rises.length) emit('rise', 0.25);
    if (res.bonus) emit('bonus', 0.3);
    this.refresh();
    bumpScore();
    el('live').textContent = announceClear(res.group.length, res.points + res.bonus, res.state.score);
    if (res.state.status === 'finished') this.scheduleEnd();
  }

  private shake(): void {
    const wrap = el('board-wrap');
    wrap.classList.remove('shake');
    void wrap.offsetWidth;
    wrap.classList.add('shake');
  }

  undo(): void {
    const prev = this.state && undo(this.state);
    if (!prev || isOverlayOpen()) return;
    this.state = prev;
    this.view.reset(prev.board, true);
    this.sfx('undo');
    this.refresh();
    el('live').textContent = `Move undone. Score ${prev.score}.`;
  }

  refresh(): void {
    const s = this.state;
    if (!s) return;
    renderHud(s, this.bestAtStart);
    const undoBtn = el<HTMLButtonElement>('undo');
    undoBtn.disabled = !s.undo || s.status !== 'playing';
  }

  private scheduleEnd(): void {
    if (this.state?.end === 'stuck') this.setPreview(S.noMoves, 'warn');
    const delay = document.documentElement.dataset.motion === 'reduce' ? 150 : 650;
    this.endTimer = window.setTimeout(() => this.showResult(), delay);
  }

  showResult(): void {
    const s = this.state;
    if (!s?.end) return;
    const { stats, newBest } = recordResult(this.stats, s.mode, s.score, this.today);
    this.stats = stats;
    saveStats(stats);
    el('result-title').textContent = endTitle(s.end);
    el('result-score').textContent = String(s.score);
    el('result-detail').textContent = `${endDetail(s.end, s.score, CONFIG.scoring.clearBonus, discCount(s.board))}${newBest ? ` ${S.newBest}` : ''}`;
    el('live').textContent = `${endTitle(s.end)} Final score ${s.score}.`;
    this.sfx(isWin(s) ? 'win' : 'lose');
    openOverlay(el('result-overlay'), el('board'), () => this.toMenu(), el('result-again'));
  }

  closeResult(): void {
    closeOverlay(el('result-overlay'));
  }

  openPause(confirm: 'restart' | 'quit' | null = null): void {
    if (this.playing) this.pause.open(confirm);
  }

  request(kind: 'restart' | 'quit'): void {
    const s = this.state;
    if (!s) return;
    if (s.status === 'playing' && s.moves > 0) this.pause.open(kind);
    else if (kind === 'restart') this.restart();
    else this.toMenu();
  }

  openSettings(opener: HTMLElement): void {
    syncSettingsPanel(this.settings);
    openOverlay(el('settings-overlay'), opener, () => void 0, el('settings-close'));
  }
}
