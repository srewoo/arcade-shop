import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('portrait HUD keeps Cross reachable', () => {
  const css = readFileSync('src/style/scene.css', 'utf8');
  const hud = readFileSync('src/ui/hud.ts', 'utf8');
  it('dock wraps the Cross button and is sticky to the viewport bottom', () => {
    expect(hud).toMatch(/class: 'dock' \}, cross, /);
    expect(css).toMatch(/\.dock \{[^}]*position: sticky;[^}]*bottom: 0/);
  });
  it('HUD is display:contents in portrait so the dock sticks within the page grid', () => {
    expect(css).toMatch(/orientation: portrait[^{]*\{[^]*\.hud \{ display: contents; \}/);
  });
});
