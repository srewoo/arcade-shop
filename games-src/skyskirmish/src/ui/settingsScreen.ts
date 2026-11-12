import { type Settings, type SettingKey } from '../settings';
import { S } from '../strings';
import { segmented, slider, toggle, button } from './controls';
import { show } from './overlay';

export interface SettingsDeps {
  get(): Settings;
  set<K extends SettingKey>(key: K, value: Settings[K], rerender: boolean): void;
  onBack(): void;
}

const onOff = [{ value: 'on', text: S.set.on }, { value: 'off', text: S.set.off }] as const;

/** Render the settings dialog. `focusKey` keeps keyboard focus on the control just changed. */
export function showSettings(deps: SettingsDeps, focusKey?: string): void {
  const s = deps.get();
  const again = (key: string): void => showSettings(deps, key);
  const body: HTMLElement[] = [
    slider(S.set.volume, 'volume', s.volume, (v) => deps.set('volume', v, false)),
    toggle(S.set.sound, 'sound', s.sound, (v) => (deps.set('sound', v, true), again('sound'))),
    toggle(S.set.autoFire, 'autoFire', s.autoFire, (v) => (deps.set('autoFire', v, true), again('autoFire')), S.set.autoFireHint),
    segmented(S.set.reduceMotion, 'reduceMotion', [{ value: 'system', text: S.set.system }, ...onOff], s.reduceMotion, (v) => {
      deps.set('reduceMotion', v, true);
      again(`reduceMotion-${v}`);
    }),
    toggle(S.set.colorAssist, 'colorAssist', s.colorAssist, (v) => (deps.set('colorAssist', v, true), again('colorAssist')), S.set.colorHint),
    segmented(S.set.textSize, 'textSize', [100, 125, 150].map((n) => ({ value: n as 100 | 125 | 150, text: `${n}%` })), s.textSize, (v) => {
      deps.set('textSize', v, true);
      again(`textSize-${v}`);
    }),
    segmented(S.set.theme, 'theme', [{ value: 'dark', text: S.set.dark }, { value: 'light', text: S.set.light }], s.theme === 'light' ? 'light' : 'dark', (v) => {
      deps.set('theme', v, true);
      again(`theme-${v}`);
    }),
    button(S.back, 'back', deps.onBack, 'primary'),
  ];
  show(S.settings, body, { onBack: deps.onBack, focusKey: focusKey ?? 'back' });
}
