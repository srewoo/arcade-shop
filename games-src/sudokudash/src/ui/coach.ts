// First-run coaching: one short, dismissible hint, shown once (flag kept in localStorage).
import { z } from 'zod';
import { TIMING } from '../config/timing';
import { KEYS, readJson, writeJson } from '../storage';
import { STR } from '../strings';
import { $ } from './dom';

const SeenSchema = z.object({ coach: z.boolean() }).strict();
let timer = 0;

export function coachSeen(): boolean {
  const parsed = SeenSchema.safeParse(readJson(KEYS.seen));
  return parsed.success && parsed.data.coach;
}

export function hideCoach(markSeen = true): void {
  window.clearTimeout(timer);
  $('coach').hidden = true;
  if (markSeen) writeJson(KEYS.seen, { coach: true });
}

/** Shows the hint on the first game only; any digit placed or the button dismisses it for good. */
export function maybeShowCoach(): void {
  if (coachSeen()) return;
  $('coach-text').textContent = STR.coach;
  $('coach').hidden = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => hideCoach(), TIMING.coachAutoHideMs);
}

export function bindCoach(): void {
  $('coach-close').addEventListener('click', () => hideCoach());
}
