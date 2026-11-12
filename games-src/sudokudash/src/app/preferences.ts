// The player's settings: load, update, persist and apply (appearance, mute chip).
import { loadSettings, saveSettings, type Settings } from '../storage';
import { applyAppearance, watchSystemMotion } from '../ui/appearance';
import { $ } from '../ui/dom';
import { STR } from '../strings';

export class Preferences {
  value: Settings = loadSettings();

  constructor(private readonly onChange: (next: Settings) => void) {}

  start(): void {
    applyAppearance(this.value);
    watchSystemMotion(() => this.value);
    this.renderSound();
  }

  set(patch: Partial<Settings>): void {
    this.value = { ...this.value, ...patch };
    saveSettings(this.value);
    applyAppearance(this.value);
    this.renderSound();
    this.onChange(this.value);
  }

  /** Master volume as 0-1 for the audio module. */
  get volume(): number {
    return this.value.volume / 100;
  }

  private renderSound(): void {
    const b = $('btn-sound');
    const label = this.value.sound ? STR.soundOn : STR.soundOff;
    b.setAttribute('aria-label', label);
    b.title = label;
    b.setAttribute('aria-pressed', String(this.value.sound));
  }
}
