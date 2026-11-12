// DOM roots created by the game: <div id="stage"> containing <canvas id="gl">.
// Original: `Sn` (stage) and `nf` (canvas).
export const stage = document.createElement("div");
stage.id = "stage";
document.body.appendChild(stage);

export const glCanvas = document.createElement("canvas");
glCanvas.id = "gl";
stage.appendChild(glCanvas);
glCanvas.setAttribute("role", "img");
glCanvas.setAttribute("aria-label", "Living Room GP game view. Race status is announced in the status line.");
