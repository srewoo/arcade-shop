// First-run hints: shown once, remembered in localStorage. Pure; storage injected.
export const SEEN_KEY = "rug-racers-seen";

export function tipsSeen(storage) {
  try {
    return storage?.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

/** Returns false (never throws) when storage is unavailable. */
export function markTipsSeen(storage) {
  try {
    storage.setItem(SEEN_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export const shouldShowTips = (storage) => !tipsSeen(storage);
