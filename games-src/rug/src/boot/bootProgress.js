/**
 * Boot progress reporting. public/boot.js exposes
 * window.__bootLoader ({set(progress, text), stop(), threaded}) and draws a
 * plain DOM progress bar, so each step yields a frame for it to repaint.
 */

/** [label, ms since previous step] pairs, exposed as window.__bootTimes for profiling. */
export const bootTimes = [];
let lastBootMark = performance.now();
if (typeof window !== "undefined") window.__bootTimes = bootTimes;

/**
 * Report a boot step. With the threaded (worker) loader this resolves
 * immediately; otherwise it yields a frame (max 120 ms) so the bar can repaint.
 * (original: si)
 */
export function bootStep(progress, label, text) {
  const now = performance.now();
  bootTimes.push([label, Math.round(now - lastBootMark)]);
  window.__bootLoader?.set(progress, text);
  if (window.__bootLoader?.threaded) {
    lastBootMark = performance.now();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      lastBootMark = performance.now();
      resolve();
    };
    const timer = setTimeout(done, 120);
    requestAnimationFrame(() => setTimeout(done, 0));
  });
}

/** Show "Ready!", fade the #boot overlay out and tear down the loader. (original: bw) */
export function finishBoot() {
  const overlay = document.getElementById("boot");
  window.__bootLoader?.set(1, "Ready!");
  overlay.style.opacity = "0";
  setTimeout(() => {
    window.__bootLoader?.stop();
    document.getElementById("boot-bar")?.remove();
    overlay.style.display = "none";
    overlay.style.opacity = "1";
  }, 320);
}
