// Overlay screens: title, how-to, pause (with in-page confirmation), settings, result.
import type { Settings } from '../settings';
import { S } from '../strings';
import { byId } from './dom';
import { bindFieldsets, syncFieldsets } from './fieldsets';
import { closeOverlay, openOverlay } from './overlay';
import { playCountUp, renderStars, stopPayoff } from './resultFx';

export interface Handlers {
  resume(): void;
  restart(): void;
  quit(): void;
  start(): void;
  next(): void;
  toTitle(): void;
  change(key: string, value: string): void;
  settingsClosed(): void;
}

export interface ResultView {
  readonly title: string;
  readonly rating: string;
  readonly big: string;
  readonly rows: readonly (readonly [string, string])[];
  readonly note: string;
  readonly nextLabel: string;
  readonly hits: number;
  readonly total: number;
  readonly stars: number;
  readonly tier: 'gold' | 'silver' | 'bronze' | 'plain';
}

type Pending = 'restart' | 'quit' | null;

export class Screens {
  private readonly title = byId('title-overlay');
  private readonly howto = byId('howto-overlay');
  private readonly pause = byId('pause-overlay');
  private readonly settings = byId('settings-overlay');
  private readonly result = byId('result-overlay');
  private readonly confirm = byId('pause-confirm');
  private pending: Pending = null;

  constructor(private readonly h: Handlers) {
    bindFieldsets(document, (k, v) => h.change(k, v));
    const volume = byId<HTMLInputElement>('volume');
    volume.addEventListener('input', () => h.change('volume', volume.value));
    this.wire();
  }

  private wire(): void {
    const click = (id: string, fn: () => void): void => byId(id).addEventListener('click', fn);
    click('title-start', () => this.h.start());
    click('title-howto', () => this.openHowTo(byId('title-howto')));
    click('title-settings', () => this.openSettings(byId('title-settings')));
    click('howto-close', () => closeOverlay(this.howto));
    click('pause-resume', () => this.h.resume());
    click('pause-settings', () => this.openSettings(byId('pause-settings')));
    click('pause-restart', () => this.ask('restart', S.confirmRestart));
    click('pause-quit', () => this.ask('quit', S.confirmQuit));
    click('pause-confirm-no', () => this.clearConfirm(true));
    click('pause-confirm-yes', () => this.accept());
    click('settings-close', () => this.closeSettings());
    click('result-next', () => this.h.next());
    click('result-title-btn', () => this.h.toTitle());
  }

  private ask(kind: Exclude<Pending, null>, text: string): void {
    this.pending = kind;
    byId('pause-confirm-text').textContent = text;
    this.confirm.hidden = false;
    byId('pause-confirm-no').focus();
  }

  private clearConfirm(refocus: boolean): void {
    this.pending = null;
    this.confirm.hidden = true;
    if (refocus) byId('pause-resume').focus();
  }

  private accept(): void {
    const p = this.pending;
    this.clearConfirm(false);
    if (p === 'restart') this.h.restart();
    else if (p === 'quit') this.h.quit();
  }

  openTitle(): void {
    openOverlay(this.title, null, () => undefined, byId('title-start'));
  }
  closeTitle(): void {
    closeOverlay(this.title);
  }

  openHowTo(opener: HTMLElement): void {
    openOverlay(this.howto, opener, () => undefined, byId('howto-close'));
  }

  openPause(opener: HTMLElement | null): void {
    this.clearConfirm(false);
    openOverlay(this.pause, opener, () => this.h.resume(), byId('pause-resume'));
  }
  closePause(): void {
    this.clearConfirm(false);
    closeOverlay(this.pause);
  }

  openSettings(opener: HTMLElement): void {
    openOverlay(this.settings, opener, () => this.h.settingsClosed(), byId('settings-close'));
  }
  private closeSettings(): void {
    closeOverlay(this.settings);
    this.h.settingsClosed();
  }

  openResult(v: ResultView): void {
    byId('result-title').textContent = v.title;
    byId('result-rating').textContent = v.rating;
    byId('result-big').textContent = v.big;
    byId('result-sheet').dataset.tier = v.tier;
    renderStars(byId('result-stars'), v.stars);
    playCountUp(byId('result-big'), v.hits, v.total, document.documentElement.dataset.motion === 'reduce');
    byId('result-note').textContent = v.note;
    byId('result-next').textContent = v.nextLabel;
    byId('result-stats').replaceChildren(
      ...v.rows.flatMap(([k, val]) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = k;
        dd.textContent = val;
        return [dt, dd];
      }),
    );
    openOverlay(this.result, null, () => undefined, byId('result-next'));
  }
  closeResult(): void {
    stopPayoff();
    closeOverlay(this.result);
  }

  /** Reflect settings in every control and the title copy. */
  sync(s: Settings, bestLine: string): void {
    syncFieldsets(document, (k) => String(s[k as keyof Settings]));
    const vol = byId<HTMLInputElement>('volume');
    vol.value = String(s.volume);
    byId('volume-out').textContent = String(s.volume);
    byId('practice-field').hidden = s.mode !== 'practice';
    byId('mode-desc').textContent = S.modeDesc[s.mode];
    byId('best-line').textContent = bestLine;
    const snd = byId('sound');
    snd.setAttribute('aria-pressed', String(s.sound));
    snd.setAttribute('aria-label', s.sound ? 'Sound on' : 'Sound off');
  }
}
