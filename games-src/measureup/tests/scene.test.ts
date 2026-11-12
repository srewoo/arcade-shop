import { describe, expect, it } from 'vitest';
import { SCENE_MARKUP } from '../src/ui/scene';

describe('scene markup', () => {
  const ids = [...SCENE_MARKUP.matchAll(/id="([\w-]+)"/g)].map((m) => m[1]);
  it('keeps the hooks the game and CSS rely on', () => {
    for (const hook of ['class="gate-bars"', 'class="handle"', 'class="mouth-sad"', 'class="mouth-happy"', 'class="flame"', 'id="plate-num"', 'id="plate-top"']) {
      expect(SCENE_MARKUP).toContain(hook);
    }
  });
  it('has unique ids and every url(#ref) resolves', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of SCENE_MARKUP.matchAll(/url\(#([\w-]+)\)/g)) expect(ids).toContain(m[1]);
  });
});
