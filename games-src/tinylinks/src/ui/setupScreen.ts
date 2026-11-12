// Title/setup overlay: course, player count, names and ball colours.
import { COURSE_IDS, type CourseId } from '../course';
import { BALL_COLORS, MARKER_GLYPH, MAX_NAME, cleanName, colorHex, dedupeColors, defaultPlayers, markerFor, type ColorId, type Player } from '../game/players';
import { saveSetup, type Best, type Setup } from '../setupStore';
import { COURSE_DESC, S } from '../strings';
import { markInk } from '../render/ball';
import { must } from './dom';
import { paintMark } from './mark';

export interface SetupApi { read: () => Setup; refresh: (best: Best) => void }

export function createSetupScreen(initial: Setup, onPlay: (s: Setup) => void): SetupApi {
  const root = must('title-overlay');
  const rows = must('player-rows');
  let course: CourseId = initial.course;
  let players: Player[] = initial.players.map((p) => ({ ...p }));
  let best: Best = {};

  const read = (): Setup => ({ course, players: players.map((p, i) => ({ name: cleanName(p.name, i), color: p.color })) });

  function renderRows(): void {
    const focused = document.activeElement instanceof HTMLInputElement ? document.activeElement.dataset.seat : null;
    rows.replaceChildren(...players.map((p, i) => row(p, i)));
    if (focused !== null && focused !== undefined) rows.querySelector<HTMLInputElement>(`input[data-seat="${focused}"]`)?.focus();
  }

  function row(p: Player, seat: number): HTMLElement {
    const el = document.createElement('div');
    el.className = 'prow';
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `Player ${seat + 1}`);
    const top = document.createElement('div');
    top.className = 'top';
    const mark = document.createElement('span');
    mark.className = 'pmark';
    mark.setAttribute('aria-hidden', 'true');
    paintMark(mark, p.color, seat);
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = MAX_NAME;
    input.value = p.name;
    input.dataset.seat = String(seat);
    input.autocomplete = 'off';
    input.setAttribute('aria-label', `Player ${seat + 1} name`);
    input.addEventListener('input', () => { (players[seat] as Player).name = input.value; });
    input.addEventListener('blur', () => { (players[seat] as Player).name = cleanName(input.value, seat); input.value = (players[seat] as Player).name; });
    top.append(mark, input);
    const sw = document.createElement('div');
    sw.className = 'swatches';
    sw.setAttribute('role', 'group');
    sw.setAttribute('aria-label', `Player ${seat + 1} ball colour`);
    for (const c of BALL_COLORS) sw.append(swatch(c.id, c.name, seat, p.color === c.id));
    el.append(top, sw);
    return el;
  }

  function swatch(id: ColorId, name: string, seat: number, on: boolean): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', `${name}, marker ${MARKER_GLYPH[markerFor(seat)]}`);
    b.title = name;
    const inner = document.createElement('span');
    inner.style.background = colorHex(id);
    inner.textContent = MARKER_GLYPH[markerFor(seat)];
    inner.style.color = markInk(id);
    b.append(inner);
    const takenBy = players.findIndex((q, i) => i !== seat && q.color === id);
    b.dataset.color = id;
    b.dataset.seat = String(seat);
    b.dataset.taken = takenBy >= 0 ? '1' : '0';
    return b;
  }

  function refresh(b?: Best): void {
    if (b) best = b;
    for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-course]')) btn.setAttribute('aria-pressed', String(btn.dataset.course === course));
    for (const btn of root.querySelectorAll<HTMLButtonElement>('[data-count]')) btn.setAttribute('aria-pressed', String(Number(btn.dataset.count) === players.length));
    must('course-desc').textContent = COURSE_DESC[course];
    const bt = best[course];
    must('title-best').textContent = bt ? `${S.best(bt)} (${course === 'all18' ? 'Full 18' : course === 'front9' ? 'Front 9' : 'Back 9'})` : S.noBest;
    renderRows();
  }

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const c = t.closest<HTMLElement>('[data-course]')?.dataset.course;
    if (c && (COURSE_IDS as readonly string[]).includes(c)) { course = c as CourseId; refresh(); return; }
    const n = Number(t.closest<HTMLElement>('[data-count]')?.dataset.count);
    if (n >= 1 && n <= 4) {
      players = dedupeColors(defaultPlayers(n).map((d, i) => players[i] ?? d));
      refresh();
      return;
    }
    const sw = t.closest<HTMLButtonElement>('.swatch');
    if (sw?.dataset.color) {
      const seat = Number(sw.dataset.seat);
      const color = sw.dataset.color as ColorId;
      const other = players.findIndex((q, i) => i !== seat && q.color === color);
      const mine = (players[seat] as Player).color;
      if (other >= 0) (players[other] as Player).color = mine;
      (players[seat] as Player).color = color;
      refresh();
      must('player-rows').querySelector<HTMLButtonElement>(`.swatch[data-seat="${seat}"][data-color="${color}"]`)?.focus();
    }
  });
  must('title-play').addEventListener('click', () => { const s = read(); saveSetup(s); onPlay(s); });
  refresh();
  return { read, refresh };
}
