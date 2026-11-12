// The one place that moves the game state machine (and announces it).  Kept separate from run.js so crash.js and
// pause.js can use it without importing the simulation.
import { game } from './state.js';
import { events } from './events.js';
import { transitionState } from './stateMachine.js';

/** Move to `to` when stateMachine.js allows it; emits 'state' {from, to}.  Returns whether it moved. */
export const go = (to) => transitionState(game, to, (from, next) => events.emit('state', { from, to: next }));
