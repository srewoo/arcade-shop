// Leaderboard / name-entry methods mixed into UI.prototype.
import { formatTime } from "./format.js";

export const boardsPanelMethods = {
  /** Show the "Save your time?" form; onSubmit(name) is called on submit, onSkip on Skip/Escape. */
  askName(defaultName, onSubmit, onSkip) {
    const q = (sel) => this.root.querySelector(sel);
    const input = q(".res-name");
    const form = q(".res-save");
    this.results.classList.add("asking");
    // keep focus in the input when tapping buttons
    for (const button of form.querySelectorAll("button")) button.onmousedown = (e) => e.preventDefault();
    input.value = defaultName;
    this.saveMessage("");
    form.onsubmit = (e) => {
      e.preventDefault();
      input.blur();
      onSubmit(input.value);
    };
    q(".res-skip").onclick = () => {
      input.blur();
      this.endAsk();
      onSkip?.();
    };
    input.onkeydown = (e) => {
      if (e.key === "Escape") {
        input.blur();
        this.endAsk();
        onSkip?.();
      }
    };
    if (!this.stage.classList.contains("touch")) input.focus();
  },

  /** Offline: no name form, no error. A calm line says the local best is what counts. */
  showOfflineBoard() {
    this.endAsk();
    this.results.classList.add("offline");
  },

  saveBusy(busy) {
    this.root.querySelector(".res-send").disabled = busy;
  },

  saveMessage(text) {
    this.root.querySelector(".res-msg").textContent = text;
  },

  endAsk() {
    this.results.classList.remove("asking");
  },

  /** Results leaderboard table; `me` = {name, rank, best} (own row appended when ranked below the shown rows). */
  showBoard(rows, me) {
    this.endAsk();
    const table = this.root.querySelector(".res-board");
    const makeRow = (place, name, ms, isMe) => {
      const tr = document.createElement("tr");
      if (isMe) tr.className = "me";
      for (const [text, cls] of [
        [place, "p"],
        [name, ""],
        [formatTime(ms / 1e3), "t"],
      ]) {
        const td = document.createElement("td");
        td.textContent = text;
        if (cls) td.className = cls;
        tr.appendChild(td);
      }
      return tr;
    };
    table.replaceChildren(...rows.map((r, i) => makeRow(i + 1, r.name, r.ms, r.name === me.name)));
    if (me.rank > rows.length) table.appendChild(makeRow(me.rank, me.name, me.best, true));
    this.results.classList.add("board");
  },

  /** Fills a .rec-board element with a heading and top-N rows. */
  fillBoard(el, heading, rows) {
    const head = document.createElement("div");
    head.className = "rec-head";
    head.textContent = heading;
    const children = [head];
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "rec-empty";
      empty.textContent = "No records yet - be first!";
      children.push(empty);
    }
    rows.forEach((r, i) => {
      const row = document.createElement("div");
      row.className = "rec-row";
      for (const [text, cls] of [
        [i + 1, "rec-p"],
        [r.name, "rec-n"],
        [formatTime(r.ms / 1e3), "rec-t"],
      ]) {
        const span = document.createElement("span");
        span.className = cls;
        span.textContent = text;
        row.appendChild(span);
      }
      children.push(row);
    });
    el.replaceChildren(...children);
  },

  setTitleRecord(name, top) {
    this.titleRecord = { name, top };
    this.layoutTitleRecord();
  },

  /** Shows the title-screen board if it fits beside the menu, else folds the best time into the tagline. */
  layoutTitleRecord() {
    if (!this.titleRecord) return;
    const { name, top } = this.titleRecord;
    const q = (sel) => this.root.querySelector(sel);
    const board = q(".title-board");
    const tagline = q(".tagline");
    this.taglineText ??= tagline.textContent;
    if (!top) {
      board.classList.remove("show");
      tagline.textContent = this.taglineText;
      return;
    }
    this.fillBoard(board, name, top);
    const stageRect = this.stage.getBoundingClientRect();
    const buttonRect = q(".key-btn").getBoundingClientRect();
    const gap = stageRect.height * 0.03;
    const fits =
      !this.stage.classList.contains("touch") &&
      !this.stage.classList.contains("vertical") &&
      stageRect.right - buttonRect.right >= board.offsetWidth + gap * 2;
    board.classList.toggle("show", fits);
    const best = top[0];
    tagline.textContent = fits
      ? this.taglineText
      : best
        ? `${name} · Best ${formatTime(best.ms / 1e3)} - ${best.name}`
        : `${name} · No records yet - be first!`;
  },

  mapBoardWidth() {
    return this.root.querySelector(".maps-board").offsetWidth;
  },

  showMapBoard(info) {
    const board = this.root.querySelector(".maps-board");
    if (info) this.fillBoard(board, info.name, info.top);
    board.classList.toggle("show", !!info);
    this.root.querySelector(".maps").classList.toggle("has-board", !!info);
  },

  setMapBest(text) {
    this.root.querySelector(".maps-best").textContent = text;
  },
};
