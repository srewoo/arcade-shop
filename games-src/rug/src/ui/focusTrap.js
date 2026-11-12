// Keep Tab / Shift+Tab inside a dialog, and give focus back to whatever opened it.

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/** Visible focusable elements of `root` in DOM order. */
export function focusables(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
}

/** Next index when moving `step` (+1/-1) through `count` items, wrapping. `current` -1 = nothing focused. */
export function wrapIndex(current, step, count) {
  if (count <= 0) return -1;
  if (current < 0) return step > 0 ? 0 : count - 1;
  return (current + step + count) % count;
}

/** keydown handler: wraps Tab inside `root`. Returns true when it handled the event. */
export function trapTab(root, event) {
  if (event.key !== "Tab") return false;
  const items = focusables(root);
  if (!items.length) return false;
  event.preventDefault();
  items[wrapIndex(items.indexOf(document.activeElement), event.shiftKey ? -1 : 1, items.length)].focus();
  return true;
}

/** Where focus should go when a dialog closes: the opener if still usable, else the fallback, else null. */
export function pickReturnTarget(opener, fallback, body = document.body) {
  const usable = (el) => !!el && el !== body && el.isConnected && typeof el.focus === "function";
  if (usable(opener)) return opener;
  return usable(fallback) ? fallback : null;
}

/**
 * Open/close a modal panel: Tab trap (wired once), focus moves onto the panel itself (tabindex -1, so game keys
 * still reach the window), and on close focus returns to whatever opened it (or `fallback()`).
 * `owner[key]` remembers the opener.
 */
export function setDialogOpen(owner, key, panel, show, fallback = () => null) {
  if (!panel.dataset.trap) {
    panel.dataset.trap = "1";
    panel.tabIndex = -1;
    panel.addEventListener("keydown", (e) => trapTab(panel, e));
  }
  const was = panel.classList.contains("show");
  panel.classList.toggle("show", show);
  if (show && !was) {
    owner[key] = document.activeElement;
    panel.focus({ preventScroll: true });
  } else if (!show && was) {
    const target = pickReturnTarget(owner[key], fallback());
    owner[key] = null;
    if (panel.contains(document.activeElement)) document.activeElement.blur();
    target?.focus({ preventScroll: true });
  }
}
