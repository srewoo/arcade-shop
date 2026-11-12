// Level 3: X-wing (row-based and column-based).
import { COLS, ROWS, cellName, houseName, type House } from './grid';
import { bit, type SolverState } from './candidates';
import { TECHNIQUE_LEVEL, type Elimination, type Step } from './steps';

type Lines = readonly House[];

function scan(state: SolverState, base: Lines, cross: Lines): Step | null {
  for (let d = 1; d <= 9; d++) {
    const spots = base.map((h) => h.cells.filter((c) => (state.cands[c] ?? 0) & bit(d)));
    for (let i = 0; i < 9; i++) {
      const a = spots[i] as number[];
      if (a.length !== 2) continue;
      for (let j = i + 1; j < 9; j++) {
        const b = spots[j] as number[];
        if (b.length !== 2) continue;
        const posA = a.map((c) => cross.findIndex((h) => h.cells.includes(c)));
        const posB = b.map((c) => cross.findIndex((h) => h.cells.includes(c)));
        if (posA[0] !== posB[0] || posA[1] !== posB[1]) continue;
        const elims: Elimination[] = [];
        for (const p of posA) {
          for (const c of (cross[p as number] as House).cells) {
            if (a.includes(c) || b.includes(c)) continue;
            if ((state.cands[c] ?? 0) & bit(d)) elims.push({ cell: c, digit: d });
          }
        }
        if (elims.length === 0) continue;
        const h1 = base[i] as House;
        const h2 = base[j] as House;
        const c1 = cross[posA[0] as number] as House;
        const c2 = cross[posA[1] as number] as House;
        return {
          technique: 'x-wing',
          level: TECHNIQUE_LEVEL['x-wing'],
          placement: null,
          eliminations: elims,
          focus: [...a, ...b],
          region: [...h1.cells, ...h2.cells, ...c1.cells, ...c2.cells],
          sources: [],
          targets: elims.map((e) => e.cell),
          message:
            `X-wing on ${d}: in ${houseName(h1)} and ${houseName(h2)}, ${d} can only go in ${houseName(c1)} or ${houseName(c2)} ` +
            `(corners ${[...a, ...b].map(cellName).join(', ')}). Whichever way they fall, those two ${c1.kind === 'col' ? 'columns' : 'rows'} ` +
            `get their ${d} from the corners, so ${d} can be removed from ${elims.map((e) => cellName(e.cell)).join(', ')}.`,
        };
      }
    }
  }
  return null;
}

export const findXWing = (state: SolverState): Step | null => scan(state, ROWS, COLS) ?? scan(state, COLS, ROWS);
