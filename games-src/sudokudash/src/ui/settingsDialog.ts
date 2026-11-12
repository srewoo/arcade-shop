// Settings dialog: volume, mute, reduce motion, text size, theme, colour-blind assist.
import type { Settings } from '../storage';
import { $ } from './dom';

export interface SettingsHost {
  readonly get: () => Settings;
  readonly set: (patch: Partial<Settings>) => void;
  /** Called when the dialog is about to open (pause the game). */
  readonly onOpen: () => void;
  readonly onVolumeCommit: () => void;
}

function radios(name: string): HTMLInputElement[] {
  return [...document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)];
}

export function bindSettingsDialog(host: SettingsHost): { open: () => void; sync: () => void } {
  const dlg = $<HTMLDialogElement>('dlg-settings');
  const volume = $<HTMLInputElement>('set-volume');
  const out = $<HTMLOutputElement>('set-volume-out');
  const sync = (): void => {
    const s = host.get();
    volume.value = String(s.volume);
    out.textContent = String(s.volume);
    $<HTMLInputElement>('set-sound').checked = s.sound;
    $<HTMLInputElement>('set-cb').checked = s.colorBlind;
    radios('motion').forEach((r) => (r.checked = r.value === s.reduceMotion));
    radios('textsize').forEach((r) => (r.checked = Number(r.value) === s.textSize));
    radios('theme').forEach((r) => (r.checked = r.value === s.theme));
  };
  volume.addEventListener('input', () => {
    out.textContent = volume.value;
    host.set({ volume: Number(volume.value) });
  });
  volume.addEventListener('change', host.onVolumeCommit);
  $('set-sound').addEventListener('change', (e) => host.set({ sound: (e.target as HTMLInputElement).checked }));
  $('set-cb').addEventListener('change', (e) => host.set({ colorBlind: (e.target as HTMLInputElement).checked }));
  for (const r of radios('motion')) r.addEventListener('change', () => host.set({ reduceMotion: r.value as Settings['reduceMotion'] }));
  for (const r of radios('theme')) r.addEventListener('change', () => host.set({ theme: r.value as Settings['theme'] }));
  for (const r of radios('textsize')) {
    r.addEventListener('change', () => host.set({ textSize: Number(r.value) as Settings['textSize'] }));
  }
  $('settings-close').addEventListener('click', () => dlg.close());
  return {
    open: () => {
      host.onOpen();
      sync();
      dlg.showModal();
      volume.focus();
    },
    sync,
  };
}

