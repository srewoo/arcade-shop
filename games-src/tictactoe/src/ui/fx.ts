// Win/lose juice: strike line, confetti, board shake. All of it is skipped (or
// shown statically) under reduced motion; none of it blocks input.

const SVG_NS = 'http://www.w3.org/2000/svg';

function centre(btn: HTMLElement): { x: number; y: number; r: number } {
  return { x: btn.offsetLeft + btn.offsetWidth / 2, y: btn.offsetTop + btn.offsetHeight / 2, r: btn.offsetWidth / 2 };
}

/** Draw a line through the winning cells. `animate` false shows it fully drawn. */
export function drawStrike(
  svg: SVGSVGElement, board: HTMLElement, cells: readonly HTMLElement[], line: readonly number[], animate: boolean,
): void {
  const first = cells[line[0] ?? 0];
  const last = cells[line[line.length - 1] ?? 0];
  if (!first || !last) return;
  const a = centre(first);
  const b = centre(last);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const ux = ((b.x - a.x) / len) * a.r * 0.55;
  const uy = ((b.y - a.y) / len) * a.r * 0.55;
  svg.setAttribute('viewBox', `0 0 ${board.offsetWidth} ${board.offsetHeight}`);
  svg.replaceChildren();
  const path = document.createElementNS(SVG_NS, 'line');
  path.setAttribute('x1', String(a.x - ux));
  path.setAttribute('y1', String(a.y - uy));
  path.setAttribute('x2', String(b.x + ux));
  path.setAttribute('y2', String(b.y + uy));
  path.setAttribute('pathLength', '1');
  path.setAttribute('class', animate ? 'strike-line draw' : 'strike-line');
  svg.append(path);
  svg.dataset.line = line.join(',');
}

export function clearStrike(svg: SVGSVGElement): void {
  svg.replaceChildren();
  delete svg.dataset.line;
}

const COLOURS = ['var(--x)', 'var(--o)', 'var(--win-ring)', 'var(--ink)'];

export function burstConfetti(container: HTMLElement, count: number, ms: number): void {
  container.replaceChildren();
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 45 + Math.random() * 40;
    dot.className = 'dot';
    dot.style.setProperty('--dx', `${Math.cos(angle) * dist}%`);
    dot.style.setProperty('--dy', `${Math.sin(angle) * dist - 15}%`);
    dot.style.setProperty('--c', COLOURS[i % COLOURS.length] ?? 'var(--ink)');
    dot.style.setProperty('--delay', `${Math.random() * 120}ms`);
    container.append(dot);
  }
  window.setTimeout(() => container.replaceChildren(), ms + 300);
}

export function shake(target: HTMLElement, ms: number): void {
  target.classList.remove('shake');
  void target.offsetWidth;
  target.classList.add('shake');
  window.setTimeout(() => target.classList.remove('shake'), ms + 50);
}
