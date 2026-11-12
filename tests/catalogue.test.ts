import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAMES, GENRES, findGame, gamePath, parseCatalogue, thumbPath } from '../src/catalogue';
import raw from '../src/games.json';

const shop = resolve(__dirname, '..', 'games-src');

describe('catalogue', () => {
  it('lists all 24 games with unique ids', () => {
    expect(GAMES).toHaveLength(24);
    expect(new Set(GAMES.map((g) => g.id)).size).toBe(24);
  });

  it('every entry points at a real game project with an index.html', () => {
    for (const g of GAMES) {
      expect(existsSync(resolve(shop, g.dir, 'package.json')), g.id).toBe(true);
      expect(existsSync(resolve(shop, g.dir, 'index.html')), g.id).toBe(true);
    }
  });

  it('every game has its own vite/vitest config (else Vitest walks up and runs the launcher suite instead)', () => {
    const configs = ['vite.config.ts', 'vite.config.js', 'vitest.config.ts'];
    for (const g of GAMES) expect(configs.some((c) => existsSync(resolve(shop, g.dir, c))), g.id).toBe(true);
  });

  it('every game has a thumbnail and a known genre', () => {
    for (const g of GAMES) {
      expect(existsSync(resolve(__dirname, '..', 'public', thumbPath(g.id))), g.id).toBe(true);
      expect(GENRES).toContain(g.genre);
    }
  });

  it('every genre shelf has at least one game', () => {
    for (const genre of GENRES) expect(GAMES.some((g) => g.genre === genre)).toBe(true);
  });

  it('rejects duplicate ids, unknown fields and bad values', () => {
    const first = raw[0];
    expect(() => parseCatalogue([first, first])).toThrow(/Duplicate/);
    expect(() => parseCatalogue([{ ...first, extra: 1 }])).toThrow();
    expect(() => parseCatalogue([{ ...first, genre: 'rpg' }])).toThrow();
    expect(() => parseCatalogue([{ ...first, dir: '../etc' }])).toThrow();
    expect(() => parseCatalogue([])).toThrow();
  });

  it('builds relative paths inside the extension', () => {
    expect(gamePath('dino')).toBe('games/dino/index.html');
    expect(thumbPath('rug')).toBe('thumbs/rug.webp');
    expect(findGame('rug')?.title).toBe('Living Room GP');
    expect(findGame('nope')).toBeUndefined();
  });

  it('the catalogue is frozen', () => {
    expect(Object.isFrozen(GAMES)).toBe(true);
    expect(Object.isFrozen(GAMES[0])).toBe(true);
  });
});

describe('manifest', () => {
  const manifest = JSON.parse(readFileSync(resolve(__dirname, '..', 'public', 'manifest.json'), 'utf8'));

  it('is MV3, named arcadeShop, and asks for no permissions', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('arcadeShop');
    expect(manifest.permissions).toBeUndefined();
    expect(manifest.host_permissions).toBeUndefined();
  });

  it('CSP allows only bundled scripts (+ WASM for the physics engine)', () => {
    const csp: string = manifest.content_security_policy.extension_pages;
    expect(csp).toContain("script-src 'self' 'wasm-unsafe-eval';");
    expect(csp).not.toMatch(/'unsafe-inline'|'unsafe-eval'|https?:/);
    expect(csp).toContain("object-src 'none'");
  });

  it('every icon file exists', () => {
    for (const p of Object.values<string>(manifest.icons)) expect(existsSync(resolve(__dirname, '..', 'public', p))).toBe(true);
  });
});
