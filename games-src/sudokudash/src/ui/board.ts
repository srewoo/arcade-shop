// Board rendering: 81 accessible buttons, updated in place.
import { CELLS, PEERS, colOf, rowOf } from '../core/grid';
import { bit, digitsOf } from '../core/candidates';
import { conflictCells, isGiven, isWrong } from '../core/game';
import type { Session } from '../session';
import { JUICE } from '../config/juice';
import { motionReduced } from './dom';

interface CellParts {
  readonly btn: HTMLButtonElement;
  readonly value: HTMLSpanElement;
  readonly notes: HTMLSpanElement;
  readonly marks: HTMLElement[];
}

export class BoardView {
  readonly cells: CellParts[] = [];

  constructor(private readonly root: HTMLElement, onSelect: (cell: number) => void) {
    for (let c = 0; c < CELLS; c++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.cell = String(c);
      btn.tabIndex = -1;
      const value = document.createElement('span');
      value.className = 'v';
      const notes = document.createElement('span');
      notes.className = 'notes';
      const marks: HTMLElement[] = [];
      for (let d = 1; d <= 9; d++) {
        const mark = document.createElement('i');
        marks.push(mark);
        notes.append(mark);
      }
      btn.append(value, notes);
      btn.addEventListener('click', () => onSelect(c));
      this.root.append(btn);
      this.cells.push({ btn, value, notes, marks });
    }
  }

  focusSelected(selected: number): void {
    this.cells[selected]?.btn.focus({ preventScroll: true });
  }

  /** Quick sideways shake of the whole board plus a bump on the wrong cell (skipped with Reduce motion). */
  shake(cell: number): void {
    if (motionReduced()) return;
    const dx = 5;
    this.root.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${-dx}px)` }, { transform: `translateX(${dx}px)` }, { transform: `translateX(${-dx / 2}px)` }, { transform: 'translateX(0)' }],
      { duration: JUICE.shakeMs, easing: 'ease-out' },
    );
    this.cells[cell]?.btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: JUICE.shakeMs * 1.4 });
  }

  /** A completed row / column / box sweeps a gold wash across its cells in reading order. */
  flash(cells: readonly number[]): void {
    if (motionReduced()) return;
    const wash = 'inset 0 0 0 60px color-mix(in srgb, var(--gold) 60%, transparent)';
    const none = 'inset 0 0 0 60px color-mix(in srgb, var(--gold) 0%, transparent)';
    [...cells].sort((a, b) => a - b).forEach((c, i) => {
      this.cells[c]?.btn.animate([{ boxShadow: none }, { boxShadow: wash, offset: 0.3 }, { boxShadow: none }], {
        duration: JUICE.houseFlashMs, delay: i * JUICE.houseFlashStaggerMs, easing: 'ease-out',
      });
    });
  }

  render(s: Session): void {
    const g = s.game;
    const sel = s.selected;
    const peers = new Set(PEERS[sel] ?? []);
    const selVal = g.values[sel] ?? 0;
    const conflicts = conflictCells(g);
    const h = hintSets(s);
    for (let c = 0; c < CELLS; c++) {
      const part = this.cells[c] as CellParts;
      const v = g.values[c] ?? 0;
      const cls = ['cell'];
      if (colOf(c) % 3 === 2 && colOf(c) !== 8) cls.push('bR');
      if (rowOf(c) % 3 === 2 && rowOf(c) !== 8) cls.push('bB');
      if (isGiven(g, c)) cls.push('given');
      if ((Math.floor(rowOf(c) / 3) + Math.floor(colOf(c) / 3)) % 2 === 1) cls.push('alt');
      if (v) cls.push('has-val');
      if (c === sel) cls.push('sel');
      else if (selVal && v === selVal) cls.push('same');
      else if (peers.has(c)) cls.push('peer');
      if (isWrong(g, c)) cls.push('wrong');
      else if (conflicts.has(c)) cls.push('conflict');
      if (h.region.has(c)) cls.push('h-region');
      if (h.source.has(c)) cls.push('h-source');
      if (h.target.has(c)) cls.push('h-target');
      if (h.focus.has(c)) cls.push('h-focus');
      const name = cls.join(' ');
      if (part.btn.className !== name) part.btn.className = name;
      part.btn.tabIndex = c === sel ? 0 : -1;
      this.paintValue(part, v, g.notes[c] ?? 0, selVal, c === sel && !isGiven(g, c));
      const label = describe(c, v, g.notes[c] ?? 0, isGiven(g, c), isWrong(g, c));
      if (part.btn.getAttribute('aria-label') !== label) part.btn.setAttribute('aria-label', label);
    }
  }

  private paintValue(part: CellParts, v: number, notes: number, highlight: number, justEntered: boolean): void {
    const text = v ? String(v) : '';
    if (part.value.textContent !== text) {
      const placed = text !== '' && part.value.textContent === '' && justEntered;
      part.value.textContent = text;
      if (placed && !motionReduced()) part.value.animate(JUICE.digitPop, { duration: JUICE.digitPopMs, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    }
    part.notes.hidden = v !== 0 || notes === 0;
    if (part.notes.hidden) return;
    part.marks.forEach((m, i) => {
      const t = notes & bit(i + 1) ? String(i + 1) : '';
      if (m.textContent !== t) m.textContent = t;
      m.classList.toggle('hl', t !== '' && i + 1 === highlight);
    });
  }
}

function describe(cell: number, v: number, notes: number, given: boolean, wrong: boolean): string {
  const pos = `Row ${rowOf(cell) + 1}, column ${colOf(cell) + 1}`;
  if (v) return `${pos}: ${v}${given ? ', given' : wrong ? ', incorrect' : ''}`;
  return notes ? `${pos}: empty, notes ${digitsOf(notes).join(' ')}` : `${pos}: empty`;
}

interface HintSets {
  region: Set<number>;
  source: Set<number>;
  target: Set<number>;
  focus: Set<number>;
}

function hintSets(s: Session): HintSets {
  const out: HintSets = { region: new Set(), source: new Set(), target: new Set(), focus: new Set() };
  const hint = s.hint;
  if (!hint) return out;
  if (hint.kind === 'step') {
    const st = hint.step;
    st.region.forEach((c) => out.region.add(c));
    st.sources.forEach((c) => out.source.add(c));
    st.targets.forEach((c) => out.target.add(c));
    st.focus.forEach((c) => out.focus.add(c));
  } else if (hint.kind === 'mistake' || hint.kind === 'guess') {
    out.focus.add(hint.cell);
  }
  return out;
}
