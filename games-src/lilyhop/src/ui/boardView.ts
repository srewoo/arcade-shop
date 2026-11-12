// Renders the pond: pad buttons (the touch/keyboard targets) with frog and toad sprites on top.
import { type BoardSpec, type Move, type Team, isSolved, isTeam } from '../board';
import { CONFIG } from '../config';
import { chooseLayout, placeLine, type Placement } from '../layout';
import { S } from '../strings';
import { padSvg, pieceSvg, svgNode } from './art';
import { splash } from './splash';

export interface ViewHooks {
  readonly onActivate: (index: number) => void;
  readonly reducedMotion: () => boolean;
}

export class BoardView {
  private spec: BoardSpec | null = null;
  private pads: HTMLButtonElement[] = [];
  private frogs = new Map<number, HTMLElement>();
  private pos: Placement[] = [];
  private gridCols = 1;
  private gridRows = 1;
  private cell = 0;
  private focusIndex = 0;

  constructor(private readonly root: HTMLElement, private readonly box: HTMLElement, private readonly hooks: ViewHooks) {
    root.addEventListener('keydown', (e) => this.onKey(e));
    new ResizeObserver(() => this.fit()).observe(box);
  }

  build(spec: BoardSpec, state: string): void {
    this.spec = spec;
    this.root.replaceChildren();
    this.pads = [];
    this.frogs.clear();
    this.focusIndex = Math.max(0, state.search(/[AB]/));
    for (let i = 0; i < state.length; i++) this.addPad(i);
    this.fit();
    for (let i = 0; i < state.length; i++) {
      const team = state[i];
      if (isTeam(team)) this.addFrog(i, team);
    }
    this.place();
  }

  private addPad(i: number): void {
    const pad = document.createElement('button');
    pad.type = 'button';
    pad.className = 'pad';
    pad.innerHTML = padSvg(i * 7 + 3);
    pad.tabIndex = i === this.focusIndex ? 0 : -1;
    pad.addEventListener('click', () => {
      this.focusIndex = i;
      this.hooks.onActivate(i);
    });
    pad.addEventListener('focus', () => this.setFocusStop(i));
    this.pads.push(pad);
    this.root.append(pad);
  }

  private addFrog(i: number, team: Team): void {
    const frog = document.createElement('div');
    frog.className = 'frog';
    frog.dataset.team = team;
    frog.innerHTML = `<div class="hop">${pieceSvg(team)}</div><span class="badge" aria-hidden="true">${team === 'A' ? 'F' : 'T'}</span>`;
    this.frogs.set(i, frog);
    this.root.append(frog);
  }

  /** Measure the box, choose rows/columns, position every pad and frog. */
  fit(): void {
    const spec = this.spec;
    if (!spec || this.box.clientWidth === 0) return;
    const pad = CONFIG.layout.inset * 2;
    this.box.style.height = '';
    const w = this.box.clientWidth - pad;
    const h = this.box.clientHeight - pad;
    if (spec.kind === 'grid') {
      this.gridCols = spec.cols;
      this.gridRows = spec.rows;
      this.cell = Math.min(w / spec.cols, h / spec.rows, CONFIG.layout.maxCell);
      this.pos = this.pads.map((_, i) => ({ x: i % spec.cols, y: Math.floor(i / spec.cols) }));
    } else {
      const lay = chooseLayout(this.pads.length, w, h);
      this.gridCols = lay.perRow;
      this.gridRows = lay.rows;
      this.cell = lay.cell;
      this.pos = this.pads.map((_, i) => placeLine(i, lay.perRow));
    }
    // A single row of pads would float in a tall pond: shrink the pond to a roomy band instead.
    if (this.gridRows === 1) this.box.style.height = `${Math.min(h + pad, Math.round(this.cell * 2.6 + pad))}px`;
    this.root.style.setProperty('--cell', `${this.cell}px`);
    this.root.style.width = `${this.cell * this.gridCols}px`;
    this.root.style.height = `${this.cell * this.gridRows}px`;
    this.drawTrail();
    this.place();
  }

  /** Dashed stepping-stone path so a folded line still reads as one line. */
  private drawTrail(): void {
    this.root.querySelector('.trail')?.remove();
    if (this.spec?.kind !== 'line') return;
    const pts = this.pos.map((p) => `${(p.x + 0.5) * this.cell},${(p.y + 0.5) * this.cell}`).join(' ');
    const w = this.cell * this.gridCols;
    const h = this.cell * this.gridRows;
    const svg = svgNode(`<svg class="trail" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}"/></svg>`);
    this.root.prepend(svg);
  }

  private spot(i: number): { left: string; top: string } {
    const p = this.pos[i] ?? { x: 0, y: 0 };
    return { left: `${((p.x + 0.5) / this.gridCols) * 100}%`, top: `${((p.y + 0.5) / this.gridRows) * 100}%` };
  }

  private face(index: number, team: Team): number {
    const odd = this.spec?.kind === 'line' && (this.pos[index]?.y ?? 0) % 2 === 1;
    return (team === 'A' ? 1 : -1) * (odd ? -1 : 1);
  }

  private place(): void {
    this.pads.forEach((pad, i) => {
      const s = this.spot(i);
      pad.style.left = s.left;
      pad.style.top = s.top;
    });
    this.frogs.forEach((frog, i) => this.position(frog, i));
  }

  private position(frog: HTMLElement, i: number): void {
    const s = this.spot(i);
    frog.style.left = s.left;
    frog.style.top = s.top;
    frog.style.setProperty('--face', String(this.face(i, frog.dataset.team as Team)));
  }

  /** Move a sprite (hop arc unless reduced motion). */
  move(m: Move, animate: boolean): void {
    const frog = this.frogs.get(m.from);
    if (!frog) return;
    this.frogs.delete(m.from);
    this.frogs.set(m.to, frog);
    const jump = m.over >= 0;
    const doAnim = animate && !this.hooks.reducedMotion();
    frog.classList.toggle('anim', doAnim);
    frog.classList.toggle('jumping', doAnim && jump);
    this.position(frog, m.to);
    if (doAnim) {
      this.arc(frog, jump);
      const s = this.spot(m.to);
      window.setTimeout(() => splash(this.root, s.left, s.top, jump), (jump ? CONFIG.timing.jumpMs : CONFIG.timing.hopMs) * 0.8);
    }
    if (m.over >= 0 && doAnim) this.frogs.get(m.over)?.animate(
      [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.12,0.88)' }, { transform: 'translate(-50%,-50%) scale(1)' }],
      { duration: CONFIG.timing.jumpMs, easing: 'ease-in-out' },
    );
  }

  private arc(frog: HTMLElement, jump: boolean): void {
    const hop = frog.firstElementChild as HTMLElement | null;
    const rise = jump ? 70 : 38;
    hop?.animate(
      [{ transform: 'translateY(0) scale(1,1)' }, { transform: `translateY(-${rise}%) scale(0.94,1.1)`, offset: 0.5 }, { transform: 'translateY(0) scale(1.08,0.92)' }],
      { duration: jump ? CONFIG.timing.jumpMs : CONFIG.timing.hopMs, easing: 'ease-in-out' },
    );
  }

  /** Update labels and highlight attributes from the current game state. */
  refresh(state: string, movable: (i: number) => boolean, selected: number | null, targets: readonly number[], hint: Move | null, hintFull = true): void {
    this.root.dataset.won = String(this.spec !== null && isSolved(this.spec, state));
    this.pads.forEach((pad, i) => {
      const piece = state[i];
      const can = isTeam(piece) && movable(i);
      const what = isTeam(piece) ? `${piece === 'A' ? S.frogWord : S.toadWord}, ${can ? S.canHop : S.blockedWord}` : S.emptyPad;
      pad.setAttribute('aria-label', S.padLabel(i + 1, this.pads.length, what));
      pad.dataset.movable = String(can);
      pad.dataset.sel = String(selected === i);
      pad.dataset.target = String(targets.includes(i));
      pad.dataset.hint = String(hint !== null && (hint.from === i || (hintFull && hint.to === i)));
      pad.setAttribute('aria-pressed', String(selected === i));
    });
    this.frogs.forEach((frog, i) => {
      frog.dataset.sel = String(selected === i);
      frog.dataset.hint = String(hint !== null && hint.from === i);
      frog.dataset.movable = String(movable(i));
    });
  }

  /** Victory payoff: every piece does a staggered hop on the spot before the result card. */
  celebrate(): void {
    if (this.hooks.reducedMotion()) return;
    let n = 0;
    this.frogs.forEach((_, i) => {
      const s = this.spot(i);
      window.setTimeout(() => splash(this.root, s.left, s.top, true), 260 + (i % 7) * 90);
    });
    [...this.frogs.entries()].sort((a, b) => a[0] - b[0]).forEach(([, frog]) => {
      (frog.firstElementChild as HTMLElement | null)?.animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(-34%) scale(0.95,1.08)', offset: 0.45 }, { transform: 'translateY(0) scale(1.06,0.94)' }, { transform: 'translateY(0)' }],
        { duration: 520, delay: n++ * 70, iterations: 2, easing: 'ease-in-out' },
      );
    });
  }

  denyShake(index: number): void {
    const target = this.frogs.get(index) ?? this.pads[index];
    if (!target || this.hooks.reducedMotion()) return;
    target.classList.remove('shake');
    void target.offsetWidth;
    target.classList.add('shake');
    window.setTimeout(() => target.classList.remove('shake'), CONFIG.timing.shakeMs + 50);
  }

  isReduced(): boolean {
    return this.hooks.reducedMotion();
  }

  focusPad(index: number): void {
    this.pads[index]?.focus({ preventScroll: true });
  }

  private setFocusStop(index: number): void {
    this.focusIndex = index;
    this.pads.forEach((p, i) => (p.tabIndex = i === index ? 0 : -1));
  }

  private onKey(e: KeyboardEvent): void {
    const step: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = step[e.key];
    const from = this.pos[this.focusIndex];
    if (!d || !from) return;
    e.preventDefault();
    const to = this.pos.findIndex((p) => p.x === from.x + d[0] && p.y === from.y + d[1]);
    if (to >= 0) this.focusPad(to);
  }
}
