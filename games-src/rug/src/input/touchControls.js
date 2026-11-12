import { clamp } from "../util/math.js";

const STICK_DEADZONE = 0.1; // Zc
const STICK_BRAKE_THRESHOLD = 0.6; // Nw: stick pulled down this far (of radius) presses "KeyS"

const TOUCH_HTML = `
    <div class="t-stick"><div class="t-stick-base"></div><div class="t-knob"></div></div>
    <button type="button" class="t-btn t-boost" data-code="ShiftLeft" aria-label="Boost"><span class="t-lbl">BOOST</span><span class="t-pct">100%</span></button>
    <button type="button" class="t-btn t-jump" data-code="Space">JUMP</button>
    <button type="button" class="t-btn t-reset" data-code="KeyR" aria-label="Back on the road">&#8635;</button>
    <button type="button" class="t-btn t-cam" data-code="KeyC" aria-label="Change camera">CAM</button>
    <button type="button" class="t-btn t-menu" data-code="KeyP" aria-label="Pause">II</button>`;

/** Virtual stick: writes state.steer (-1..1) and presses KeyS when pulled down. Returns {release}. */
function wireStick(root, state, press, release) {
  const stick = root.querySelector(".t-stick");
  const knob = root.querySelector(".t-knob");
  let activePointer = null;
  let braking = false;

  const setBraking = (on) => {
    if (on !== braking) {
      braking = on;
      on ? press("KeyS") : release("KeyS");
    }
  };

  function moveStick(e) {
    const rect = stick.getBoundingClientRect();
    const maxR = rect.width * 0.34;
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx *= maxR / dist;
      dy *= maxR / dist;
    }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const nx = dx / maxR;
    const sign = Math.sign(nx);
    const mag = Math.abs(nx);
    state.steer = mag < STICK_DEADZONE ? 0 : sign * clamp((mag - STICK_DEADZONE) / (1 - STICK_DEADZONE), 0, 1);
    setBraking(dy / maxR > STICK_BRAKE_THRESHOLD);
  }

  const endStick = () => {
    activePointer = null;
    state.steer = 0;
    setBraking(false);
    knob.classList.remove("held");
    knob.style.transform = "";
  };
  stick.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    activePointer = e.pointerId;
    stick.setPointerCapture(activePointer);
    knob.classList.add("held");
    moveStick(e);
  });
  stick.addEventListener("pointermove", (e) => {
    if (e.pointerId === activePointer) moveStick(e);
  });
  for (const type of ["pointerup", "pointercancel"]) {
    stick.addEventListener(type, (e) => e.pointerId === activePointer && endStick());
  }
  return { release: endStick };
}

/** Buttons with data-code press / release the matching synthetic key. */
function wireButtons(root, press, release) {
  for (const button of root.querySelectorAll("[data-code]")) {
    const code = button.dataset.code;
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      button.setPointerCapture(e.pointerId);
      button.classList.add("down");
      press(code);
    });
    const up = () => {
      button.classList.remove("down");
      release(code);
    };
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
  }
}

/**
 * On-screen touch UI: a steering stick plus BOOST / JUMP / reset / camera / pause buttons.
 * Buttons emit synthetic key codes through press/release callbacks; the stick
 * writes `state.steer` (-1..1) and presses KeyS when pulled down.
 * (original: zw) Styles: .touch-ui .t-stick .t-knob .t-btn in touch.css.
 * @param {HTMLElement} parent
 * @param {{press:(code:string)=>void, release:(code:string)=>void}} keys
 * @returns {{steer:number, reset:()=>void}} reset() releases the stick and every held button (used on pause)
 */
export function createTouchControls(parent, { press, release }) {
  const root = document.createElement("div");
  root.className = "touch-ui";
  root.innerHTML = TOUCH_HTML;
  parent.appendChild(root);
  root.addEventListener("contextmenu", (e) => e.preventDefault());

  const state = { steer: 0 };
  const stick = wireStick(root, state, press, release);
  wireButtons(root, press, release);
  /** Release the stick and every button (pause, tab hidden). */
  state.reset = () => {
    stick.release();
    for (const button of root.querySelectorAll("[data-code]")) {
      button.classList.remove("down");
      release(button.dataset.code);
    }
  };
  return state;
}
