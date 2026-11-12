// Loading screen: a simple progress bar shown before the game bundle runs.
// A file (not inline) so a strict CSP works. The game reports progress through
// window.__bootLoader.set(progress 0..1, text?) and tears it down with stop();
// window.__bootStart() shows it again before a map change reloads the page.
(() => {
  const boot = document.getElementById("boot");

  function build() {
    const card = document.createElement("div");
    card.id = "boot-bar";
    card.className = "boot-card";
    card.setAttribute("role", "progressbar");
    card.setAttribute("aria-label", "Loading Living Room GP");
    card.setAttribute("aria-valuemin", "0");
    card.setAttribute("aria-valuemax", "100");
    card.innerHTML =
      '<div class="boot-name">Living Room GP</div>' +
      '<div class="boot-track"><div class="boot-fill"></div></div>' +
      '<div class="boot-meta"><span class="boot-text">Loading&hellip;</span><span class="boot-pct">0%</span></div>';
    boot.appendChild(card);
    return card;
  }

  function start() {
    const card = document.getElementById("boot-bar") || build();
    const fill = card.querySelector(".boot-fill");
    const pct = card.querySelector(".boot-pct");
    const label = card.querySelector(".boot-text");
    let shown = 0;
    window.__bootLoader = {
      threaded: false, // the game yields a frame per step so this bar can repaint
      set(p, text) {
        const v = Math.max(shown, Math.min(1, Number(p) || 0)); // never runs backwards
        shown = v;
        fill.style.transform = "scaleX(" + v + ")";
        pct.textContent = Math.round(v * 100) + "%";
        card.setAttribute("aria-valuenow", String(Math.round(v * 100)));
        if (text) label.textContent = text;
      },
      stop() {},
    };
    window.__bootLoader.set(0.04);
  }

  window.__bootStart = start;
  start();
})();
