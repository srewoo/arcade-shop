// Pushes the persisted settings into the live subsystems.
import type { AudioEngine } from '../audio/engine';
import type { Controls } from '../input/controls';
import type { Settings } from '../settings';
import { isReduced, motionProfile } from './motion';
import type { Renderer } from './renderer';

export interface ApplyTargets {
  renderer: Renderer;
  audio: AudioEngine;
  controls: Controls;
  pad: HTMLElement;
  soundButton: HTMLElement;
  systemReduced: boolean;
}

export function applySettings(s: Settings, t: ApplyTargets): void {
  t.renderer.setMotion(motionProfile(s, isReduced(s.reducedMotion, t.systemReduced)));
  t.renderer.setAssist(s.colorAssist);
  t.renderer.setTextScale(s.textSize / 100);
  document.documentElement.style.fontSize = `${s.textSize}%`;
  document.documentElement.dataset.text = String(s.textSize);
  document.documentElement.dataset.assist = s.colorAssist ? 'on' : 'off';
  Object.assign(t.audio, { sfxOn: s.sound, musicOn: s.music, muted: s.muted, master: s.masterVolume, sfx: s.sfxVolume, music: s.musicVolume });
  t.audio.applyLevels();
  t.controls.setKeys(s.keys);
  t.pad.hidden = !s.touchButtons;
  const b = t.soundButton;
  const lbl = b.querySelector('.lbl');
  if (lbl) lbl.textContent = s.muted ? 'Sound off ' : 'Sound on ';
  b.setAttribute('aria-pressed', String(!s.muted));
}
