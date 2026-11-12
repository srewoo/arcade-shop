// One "gap to the car ahead / behind" pill. DOM-light on purpose: the row only needs classList, style,
// querySelector and textContent, so it is unit-testable with a small mock.
import { STR } from "./strings.js";

const setText = (el, text) => {
  if (el.textContent !== text) el.textContent = text;
};

/**
 * With a car: show its gap text, name and colour. With no car (leader / last place) the row is emptied and
 * hidden by CSS (visibility), so it never keeps showing the previous rival's name.
 * @param row   .gap element ({classList, style, querySelector("b"|"span")})
 * @param car   neighbouring car or null
 * @param text  formatted gap ("+1.2s")
 * @param lookOf (car) => {name, color}
 */
export function fillGapRow(row, car, text, lookOf) {
  row.classList.toggle("off", !car);
  const label = row.querySelector("b");
  const name = row.querySelector("span");
  if (!car) {
    setText(label, STR.hud.gapNone);
    setText(name, "");
    return;
  }
  const look = lookOf(car);
  setText(label, text);
  setText(name, look.name ?? "");
  row.style.setProperty("--c", look.color ?? "#fff");
}
