// Tiny synchronous event emitter.  Gameplay code emits ('score', 'milestone', 'pickup', 'shieldBreak', 'gameover', ...),
// and feedback.js subscribes the HUD, audio and particles, so run.js / crash.js stay free of DOM and audio calls.
export function createEmitter() {
  const handlers = new Map();
  return {
    on(name, fn) {
      if (!handlers.has(name)) handlers.set(name, new Set());
      handlers.get(name).add(fn);
      return () => handlers.get(name)?.delete(fn);
    },
    emit(name, payload) {
      const set = handlers.get(name);
      if (!set) return;
      for (const fn of set) fn(payload);
    },
    clear() {
      handlers.clear();
    },
  };
}

export const events = createEmitter();
