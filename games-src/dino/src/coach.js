// First-run coaching (pure).  Each hint is shown once; the ids live in settings.seenHints.
import { COACH } from './tuning.js';
import { S } from './strings.js';

export const HINT_IDS = Object.freeze(['duck', 'jump', 'shield', 'doublejump', 'slowmo', 'score2']);
export const isHintId = (v) => typeof v === 'string' && HINT_IDS.includes(v);

/** Obstacle kinds that need a duck: a mid-height pterodactyl and the hanging log. */
export const needsDuck = (o) => o.kind === 'log' || (o.kind === 'ptero' && o.type === 'pteroMid');

/**
 * Which contextual hint (if any) should fire now.  `nearest` is the next obstacle ahead (or null), `distanceAhead`
 * its distance in metres.  Returns a hint id not in `seen`, else null.
 */
export function pendingHint({ seen, nearest, distanceAhead }) {
  if (!seen.includes('duck') && nearest && needsDuck(nearest) && distanceAhead <= COACH.duckWithinM && distanceAhead > 0) return 'duck';
  return null;
}

/** Text for a hint id (touch-aware), or '' for unknown ids. */
export const hintText = (id, touch) => (isHintId(id) ? (S.coach[id]?.[touch ? 'touch' : 'keys'] ?? S.coach[id]?.all ?? '') : '');

/** Toast text for a first pickup of a kind: name plus what it does; later pickups only show the name. */
export function pickupToast(kind, label, seen, touch) {
  const hint = isHintId(kind) && !seen.includes(kind) ? hintText(kind, touch) : '';
  return hint ? `${label.toUpperCase()}: ${hint}` : label.toUpperCase();
}
