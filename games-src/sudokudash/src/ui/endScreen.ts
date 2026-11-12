// Win / game-over overlay with a (Reduce-motion aware) confetti celebration and, for Daily wins,
// a "Copy result" share button.
import { JUICE } from '../config/juice';
import type { Records } from '../bests';
import type { Session } from '../session';
import { STR } from '../strings';
import { $, motionReduced } from './dom';
import { buildEndModel } from './endModel';
import { closeModal, openModal, trapTab } from './modal';

function stat(dl: HTMLElement, label: string, value: string): void {
  const wrap = document.createElement('div');
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  wrap.append(dt, dd);
  dl.append(wrap);
}

function confetti(): void {
  const host = $('confetti');
  host.replaceChildren();
  if (motionReduced()) return;
  const colors = JUICE.confettiColors;
  const shapes = JUICE.confettiShapes;
  for (let i = 0; i < JUICE.confettiCount; i++) {
    const piece = document.createElement('i');
    const size = 0.5 + Math.random() * 0.5;
    piece.className = shapes[i % shapes.length] as string;
    piece.style.setProperty('--x', `${Math.random() * 100}%`);
    piece.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 300)}px`);
    piece.style.setProperty('--r', `${Math.round(Math.random() * 900)}deg`);
    piece.style.setProperty('--d', `${(2.4 + Math.random() * 2).toFixed(2)}s`);
    piece.style.setProperty('--delay', `${(Math.random() * 0.9).toFixed(2)}s`);
    piece.style.setProperty('--s', size.toFixed(2));
    piece.style.setProperty('--c', colors[i % colors.length] as string);
    host.append(piece);
  }
  for (let i = 0; i < JUICE.sparkCount; i++) {
    const spark = document.createElement('b');
    const a = (i / JUICE.sparkCount) * Math.PI * 2 + Math.random() * 0.2;
    const dist = 140 + Math.random() * 160;
    spark.style.setProperty('--sx', `${Math.round(Math.cos(a) * dist)}px`);
    spark.style.setProperty('--sy', `${Math.round(Math.sin(a) * dist)}px`);
    spark.style.setProperty('--c', colors[i % colors.length] as string);
    host.append(spark);
  }
}

function headline(s: Session): string {
  if (s.status === 'won') return s.assisted ? 'Solved by the solver' : 'Solved!';
  return s.lossReason === 'time' ? "Time's up" : 'Too many mistakes';
}

function subline(s: Session, rec: Records): string {
  if (s.status !== 'won') return 'The grid beat you this time. Try again?';
  if (s.assisted) return 'Solver help was used, so this run does not count towards your records and earns no time bonus.';
  return rec.newTime || rec.newScore ? 'New personal best!' : 'Nicely done.';
}

function fillStats(s: Session, rec: Records): void {
  const model = buildEndModel(s, rec);
  $('end-hero-label').textContent = model.hero.label;
  $('end-hero-value').textContent = model.hero.value;
  $('end-badges').replaceChildren(
    ...model.badges.map((text) => {
      const b = document.createElement('li');
      b.textContent = text;
      return b;
    }),
  );
  const dl = $('end-stats');
  dl.replaceChildren();
  for (const [label, value] of model.rows) stat(dl, label, value);
}

export function showEnd(s: Session, rec: Records, canShare: boolean): void {
  const won = s.status === 'won';
  $('end-h').textContent = headline(s);
  $('end-sub').textContent = subline(s, rec);
  fillStats(s, rec);
  $('end').classList.toggle('lost', !won);
  $('end').classList.toggle('won', won);
  $('share').hidden = !canShare;
  $('share-status').textContent = '';
  $('share-text').hidden = true;
  openModal($('end'), $('end-again'));
  if (won && !s.assisted) confetti();
}

export function hideEnd(restoreFocus = false): void {
  closeModal($('end'), restoreFocus);
  $('end').classList.remove('lost', 'won');
  $('confetti').replaceChildren();
}

export function bindEnd(onCopy: () => string, onEsc: () => void): void {
  trapTab($('end'));
  $('end').addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEsc();
    }
  });
  $('end-copy').addEventListener('click', () => {
    const text = onCopy();
    const area = $<HTMLTextAreaElement>('share-text');
    area.value = text;
    const status = $('share-status');
    const nav = navigator.clipboard as Clipboard | undefined;
    if (!nav?.writeText) return fallback(area, status);
    nav.writeText(text).then(
      () => {
        status.textContent = STR.copied;
      },
      () => fallback(area, status),
    );
  });
}

function fallback(area: HTMLTextAreaElement, status: HTMLElement): void {
  status.textContent = STR.copyFailed;
  area.hidden = false;
  area.select();
}
