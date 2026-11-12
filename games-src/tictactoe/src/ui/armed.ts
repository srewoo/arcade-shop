// "Press again to confirm" state for destructive buttons: arms for a few
// seconds, then disarms itself. No dialogs (window.confirm is never used).

export interface Armed {
  readonly armed: boolean;
  arm(): void;
  disarm(): void;
}

export function createArmed(ms: number, onChange: () => void): Armed {
  let on = false;
  let timer: number | undefined;
  const set = (value: boolean): void => {
    window.clearTimeout(timer);
    const changed = on !== value;
    on = value;
    if (value) timer = window.setTimeout(() => set(false), ms);
    if (changed) onChange();
  };
  return {
    get armed() {
      return on;
    },
    arm: () => set(true),
    disarm: () => set(false),
  };
}
