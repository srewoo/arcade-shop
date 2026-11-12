// Explicit game state machine (pure table + guard).  'paused' remembers the state to return to in game.pausedFrom.
//
//   loading -> title -> running <-> paused -> title (quit)
//   running -> crashed -> gameover -> running (retry) | title
//   running -> stumble (Zen) -> running            paused -> running (resume, restart) | stumble
export const STATE_TRANSITIONS = Object.freeze({
  loading: ['title'],
  title: ['running'],
  running: ['crashed', 'stumble', 'gameover', 'paused'],
  stumble: ['running', 'paused'],
  crashed: ['gameover'],
  gameover: ['running', 'title'],
  paused: ['running', 'stumble', 'title'],
});

export const canTransition = (from, to) => STATE_TRANSITIONS[from]?.includes(to) ?? false;

/** States in which the simulation is live and a pause makes sense. */
export const PAUSABLE_STATES = Object.freeze(['running', 'stumble']);
export const canPause = (state) => PAUSABLE_STATES.includes(state);

/**
 * Move `game` to `to` when the table allows it.  Returns whether it moved; an illegal request is reported
 * loudly (console.error) and ignored rather than corrupting the state.
 */
export function transitionState(game, to, onChange) {
  const from = game.state;
  if (from === to) return false;
  if (!canTransition(from, to)) {
    console.error(`Illegal game state transition: ${from} -> ${to}`);
    return false;
  }
  game.state = to;
  onChange?.(from, to);
  return true;
}
