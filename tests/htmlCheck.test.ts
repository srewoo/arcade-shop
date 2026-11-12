import { describe, expect, it } from 'vitest';
import { findCspProblems } from '../scripts/lib/htmlCheck.mjs';

describe('findCspProblems', () => {
  it('passes pages that only load bundled scripts', () => {
    const html = '<script type="module" crossorigin src="./assets/a.js"></script><script src="./boot.js"></script><link rel="stylesheet" href="./a.css">';
    expect(findCspProblems(html)).toEqual([]);
  });

  it('flags inline scripts but not JSON data blocks or empty tags', () => {
    expect(findCspProblems('<script>alert(1)</script>')).toEqual(['inline <script>']);
    expect(findCspProblems('<script type="application/json">{"a":1}</script><script></script>')).toEqual([]);
  });

  it('flags inline handlers, javascript: URLs and remote scripts', () => {
    expect(findCspProblems('<button onclick="go()">x</button>')).toEqual(['inline handler onclick=']);
    expect(findCspProblems('<a href="javascript:void 0">x</a>')).toEqual(['javascript: URL']);
    expect(findCspProblems('<script src="https://cdn.example.com/x.js"></script>')).toEqual(['remote script or stylesheet']);
    expect(findCspProblems('<link rel="stylesheet" href="//fonts.example.com/a.css">')).toEqual(['remote script or stylesheet']);
  });

  it('does not mistake data-on attributes or text for handlers', () => {
    expect(findCspProblems('<div data-online="1">turn on the light</div>')).toEqual([]);
  });
});
