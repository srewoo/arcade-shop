// Settings dialog: volume, reduce motion, colour-blind assist, text size, theme, assists.
import { Dialog } from './dialog';
import { byId, fillSelect } from './dom';
import type { Settings } from './settings';
import { S } from './strings';

const SIZES = [100, 125, 150] as const;

export class SettingsPanel {
  private readonly dialog = new Dialog(byId('settings'), { onEscape: () => this.close() });

  constructor(private readonly get: () => Settings, private readonly set: (patch: Partial<Settings>) => void, private readonly onClosed: () => void) {
    byId('settings-title').textContent = S.settingsTitle;
    byId('settings-close').textContent = S.close;
    byId('set-cb-text').textContent = S.cbAssist;
    byId('set-wide-text').textContent = S.widePocket;
    byId('set-fast-text').textContent = S.fastCpu;
    byId('set-volume').closest('label')?.firstChild?.replaceWith(document.createTextNode(`${S.volume} `));
    fillSelect(byId<HTMLSelectElement>('set-motion'), Object.entries(S.reduceMotionOpts));
    fillSelect(byId<HTMLSelectElement>('set-theme'), Object.entries(S.themeOpts));
    fillSelect(byId<HTMLSelectElement>('set-size'), SIZES.map((n) => [String(n), `${n}%`]));
    this.bind();
  }

  private bind(): void {
    byId<HTMLInputElement>('set-volume').addEventListener('input', (e) => this.set({ volume: Number((e.target as HTMLInputElement).value) }));
    byId<HTMLSelectElement>('set-motion').addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      this.set({ reduceMotion: v === 'on' ? 'on' : v === 'off' ? 'off' : 'system' });
    });
    byId<HTMLSelectElement>('set-theme').addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      this.set({ theme: v === 'light' ? 'light' : v === 'dark' ? 'dark' : 'system' });
    });
    byId<HTMLSelectElement>('set-size').addEventListener('change', (e) => {
      const n = Number((e.target as HTMLSelectElement).value);
      this.set({ textSize: n === 150 ? 150 : n === 125 ? 125 : 100 });
    });
    byId<HTMLInputElement>('set-cb').addEventListener('change', (e) => this.set({ cbAssist: (e.target as HTMLInputElement).checked }));
    byId<HTMLInputElement>('set-wide').addEventListener('change', (e) => this.set({ widePocket: (e.target as HTMLInputElement).checked }));
    byId<HTMLInputElement>('set-fast').addEventListener('change', (e) => this.set({ fastCpu: (e.target as HTMLInputElement).checked }));
    byId('settings-close').addEventListener('click', () => this.close());
  }

  get isOpen(): boolean {
    return this.dialog.isOpen;
  }

  /** Refresh the controls from the current settings. */
  sync(): void {
    const s = this.get();
    byId<HTMLInputElement>('set-volume').value = String(s.volume);
    byId('set-volume-out').textContent = `${s.volume}%`;
    byId<HTMLSelectElement>('set-motion').value = s.reduceMotion;
    byId<HTMLSelectElement>('set-theme').value = s.theme;
    byId<HTMLSelectElement>('set-size').value = String(s.textSize);
    byId<HTMLInputElement>('set-cb').checked = s.cbAssist;
    byId<HTMLInputElement>('set-wide').checked = s.widePocket;
    byId<HTMLInputElement>('set-fast').checked = s.fastCpu;
  }

  open(): void {
    this.sync();
    this.dialog.open(byId('set-volume'));
  }

  close(): void {
    this.dialog.close(true);
    this.onClosed();
  }
}
