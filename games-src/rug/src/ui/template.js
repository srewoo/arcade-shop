import { STR, HINT_HTML } from "./strings.js";
// Static DOM template for the whole UI overlay (HUD, title, garage, maps, results, hint).
export const TITLE_TEXT = "LIVING ROOM GP";
// per-letter colours of the title logo
export const TITLE_LETTER_COLORS = [
  "#e5322b",
  "#f2bd1d",
  "#2f6fd0",
  "#1fa45a",
  "#f08a24",
  "#e5322b",
  "#2f6fd0",
  "#f2bd1d",
  "#1fa45a",
  "#e5322b",
];

/** Logo letters as <b> elements with CSS vars: colour, rotation ((i*37 % 9) - 4 deg) and index. */
function logoHtml() {
  return [...TITLE_TEXT]
    .map((ch, i) =>
      ch === " "
        ? '<i class="gap"></i>'
        : `<b style="--c:${TITLE_LETTER_COLORS[i % TITLE_LETTER_COLORS.length]};--r:${((i * 37) % 9) - 4}deg;--i:${i}">${ch}</b>`,
    )
    .join("");
}

const hudHtml = () => `
      <div class="hud" id="hud">
        <div class="badge pos"><span class="pos-num">4</span><span class="pos-suf">th</span><span class="pos-of">/4</span></div>
        <div class="badge lap"><span class="lap-lbl">LAP</span><span class="lap-num">1</span><span class="lap-of">/3</span></div>
        <div class="badge timer"><span class="clock"></span><span class="time">0:00.00</span></div>
        <div class="gaps" aria-label="Gap to the cars ahead and behind">
          <div class="gap gap-ahead"><i aria-hidden="true">&#9650;</i><em class="gl">${STR.hud.ahead}</em><b>--</b><span></span></div>
          <div class="gap gap-behind"><i aria-hidden="true">&#9660;</i><em class="gl">${STR.hud.behind}</em><b>--</b><span></span></div>
        </div>
        <div class="stats" aria-label="Lap statistics">
          <div class="stat stat-delta empty"><span class="k">VS BEST</span><b class="v">--</b></div>
          <div class="stat stat-best empty"><span class="k">BEST LAP</span><b class="v">--</b></div>
          <div class="stat stat-last empty"><span class="k">LAST LAP</span><b class="v">--</b></div>
          <div class="stat stat-drift empty"><span class="k">DRIFT</span><b class="v">0</b></div>
        </div>
        <div class="split-pop" aria-live="polite"></div>
        <div class="drift-pop" aria-live="off"><div class="dp-live"></div><div class="dp-event"></div></div>
        <div class="boost" role="meter" aria-label="Nitro boost" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
          <div class="boost-lbl"><span class="bl-name">NITRO</span><b class="boost-pct">100%</b><kbd class="bl-key">Shift</kbd></div>
          <div class="boost-tube"><div class="boost-fill"></div><div class="boost-ticks"></div><div class="boost-shine"></div></div>
        </div>
        <div class="minimap"><canvas width="480" height="336" role="img" aria-label="Track map with every car"></canvas></div>
        <div class="wrongway" aria-hidden="true">${STR.hud.wrongWay}</div>
      </div>
`;

const overlaysHtml = () => `
      <div class="sr-status" role="status" aria-live="polite"></div>
      <div class="busy" role="status" aria-live="polite">Repainting the rug&hellip;</div>
      <div class="countdown"><span></span></div>
      <div class="banner"><span></span></div>
      <div class="touch-tip" role="status" aria-live="polite"></div>
`;

const titleHtml = () => `
      <div class="title-screen">
        <div class="logo">${logoHtml()}</div>
        <div class="title-card">
          <div class="tagline">A toy car race on the play rug</div>
          <div class="menu">
            <button type="button" class="key-btn"><kbd>ENTER</kbd> <span class="race-lbl">Race 3 laps</span></button>
            <button type="button" class="key-btn alt trial-btn" data-key="KeyT"><kbd>T</kbd> Time trial</button>
          </div>
          <div class="menu menu-skins"><button type="button" class="key-btn car" data-key="KeyL"><kbd>L</kbd> Skins</button><button type="button" class="key-btn maps-btn" data-key="KeyK"><kbd>K</kbd> Maps</button><button type="button" class="key-btn set-btn" data-key="KeyO"><kbd>O</kbd> Settings</button><button type="button" class="key-btn help-btn" data-key="Slash" aria-label="How to play"><kbd>?</kbd> <span class="help-lbl">How to play</span></button></div>
          <div class="title-best" aria-live="polite"></div>
        </div>
        <div class="rec-board title-board"></div>
        <button type="button" class="sound-btn" data-key="KeyM" aria-label="Sound on or off"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path class="waves" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="cross" d="M16 9l5 6M21 9l-5 6"/></svg></button>
      </div>
`;

const garageHtml = () => `
      <div class="garage">
        <div class="gar-title">GARAGE</div>
        <div class="gar-panel">
          <div class="gar-row gar-kinds"></div>
          <div class="gar-row gar-models"></div>
          <div class="gar-row gar-colors"></div>
          <div class="gar-stats" aria-label="Car stats"></div>
          <div class="gar-foot">
            <span class="gar-help"><kbd>&larr;</kbd><kbd>&rarr;</kbd> colour &nbsp; <kbd>&uarr;</kbd><kbd>&darr;</kbd> model &nbsp; <kbd>Space</kbd> type</span>
            <button type="button" class="gar-done" data-key="Enter">Done</button>
          </div>
        </div>
      </div>
`;

const mapsHtml = () => `
      <div class="maps">
        <div class="rec-board maps-board"></div>
        <div class="gar-panel">
          <div class="maps-head" id="maps-head">MAPS</div>
          <div class="gar-row maps-list" role="group" aria-labelledby="maps-head"></div>
          <div class="maps-style" aria-label="Rug look"></div>
          <div class="gar-foot">
            <span class="gar-help"><kbd>&larr;</kbd><kbd>&rarr;</kbd> browse &nbsp; <kbd>Enter</kbd> use</span>
            <span class="maps-best"></span>
            <button type="button" class="gar-done maps-back" data-key="Escape">Back</button>
            <button type="button" class="gar-done maps-use" data-key="Enter">Use</button>
          </div>
        </div>
      </div>
`;

const pauseHtml = () => `
      <div class="pause" role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <div class="pause-card">
          <div class="pause-title" id="pause-title">${STR.pause.title}</div>
          <div class="pause-view pause-menu">
            <button type="button" class="pause-btn pause-resume" data-act="resume">${STR.pause.resume}</button>
            <button type="button" class="pause-btn" data-act="restart">${STR.pause.restart}</button>
            <button type="button" class="pause-btn" data-act="settings">${STR.pause.settings}</button>
            <button type="button" class="pause-btn pause-quit" data-act="quit">${STR.pause.quit}</button>
          </div>
          <div class="pause-view pause-confirm">
            <div class="pause-q"></div>
            <div class="pause-note"></div>
            <button type="button" class="pause-btn pause-keep" data-act="cancel">${STR.pause.cancel}</button>
            <button type="button" class="pause-btn pause-yes" data-act="confirm"></button>
          </div>
        </div>
      </div>
`;

const tipsHtml = () => `
      <div class="tips" role="dialog" aria-modal="true" aria-labelledby="tips-title">
        <div class="tips-card">
          <div class="tips-title" id="tips-title">${STR.tips.title}</div>
          <div class="tips-goal"></div>
          <ol class="tips-steps"></ol>
          <div class="tips-note">${STR.tips.pauseNote}</div>
          <button type="button" class="pause-btn tips-ok">${STR.tips.dismiss}</button>
          <div class="tips-hint">${STR.tips.dismissHint}</div>
        </div>
      </div>
`;

const settingsHtml = () => `
      <div class="settings" role="dialog" aria-modal="true" aria-label="Settings">
        <div class="gar-panel set-panel">
          <div class="maps-head set-head">SETTINGS</div>
          <div class="set-list"></div>
          <div class="gar-foot">
            <span class="gar-help"><kbd>Tab</kbd> move &nbsp; <kbd>Space</kbd> pick &nbsp; <kbd>Esc</kbd> close &nbsp; ${STR.settings.footKeys}</span>
            <button type="button" class="gar-done set-close" data-key="Escape">Done</button>
          </div>
        </div>
      </div>
`;

const resultsHtml = () => `
      <div class="results">
        <div class="res-title">FINISH!</div>
        <div class="res-place"></div>
        <div class="res-extra"></div>
        <table class="res-table"></table>
        <table class="res-table res-board"></table>
        <div class="res-offline" role="status">${STR.results.offlineBoard}</div>
        <form class="res-save">
          <div class="res-ask">Save your time?</div>
          <div class="res-row">
            <input class="res-name" maxlength="16" placeholder="Your name" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" />
            <button type="submit" class="res-send">Save</button>
            <button type="button" class="res-skip">Skip</button>
          </div>
          <div class="res-msg"></div>
        </form>
        <div class="res-keys"><button type="button" class="res-key" data-key="Enter"><kbd>ENTER</kbd> race again</button><button type="button" class="res-key" data-key="Escape"><kbd>Esc</kbd> menu</button></div>
      </div>
      <div class="hint">${HINT_HTML}</div>
    
`;

/** The whole UI overlay, one builder per panel. */
export function buildUiHtml() {
  return [hudHtml(), overlaysHtml(), titleHtml(), garageHtml(), mapsHtml(), pauseHtml(), tipsHtml(), settingsHtml(), resultsHtml()].join("\n");
}
