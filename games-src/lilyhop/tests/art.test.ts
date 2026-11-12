import { describe, expect, it } from 'vitest';
import { padSvg } from '../src/ui/padArt';
import { pieceSvg } from '../src/ui/pieceArt';
import { sceneSvg } from '../src/ui/sceneArt';

const ids = (s: string): string[] => [...s.matchAll(/id="([\w-]+)"/g)].map((m) => m[1] as string);
const refs = (s: string): string[] => [...s.matchAll(/url\(#([\w-]+)\)/g)].map((m) => m[1] as string);

describe('art markup', () => {
  it('every sprite resolves its own gradients', () => {
    for (const svg of [padSvg(3), padSvg(1), pieceSvg('A'), pieceSvg('B'), sceneSvg()]) for (const r of refs(svg)) expect(ids(svg)).toContain(r);
  });
  it('sprite ids are unique across calls', () => {
    expect(ids(padSvg(1))[0]).not.toBe(ids(padSvg(1))[0]);
    expect(ids(pieceSvg('A'))[0]).not.toBe(ids(pieceSvg('A'))[0]);
  });
  it('scene is deterministic', () => {
    expect(sceneSvg()).toBe(sceneSvg());
  });
});
