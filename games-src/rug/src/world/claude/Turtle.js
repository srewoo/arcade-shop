// Turtle-style path builder used to lay out the Grid City race track and roads.

/** Builds a polyline by driving forward and turning on arcs. Records `turns` as [startIdx, endIdx, degrees]. */
export class Turtle {
  /**
   * @param {number} x start x
   * @param {number} y start y
   * @param {number} heading heading in radians
   * @param {number} step sample spacing
   */
  constructor(x, y, heading, step = 0.5) {
    this.x = x;
    this.y = y;
    this.a = heading;
    this.step = step;
    this.pts = [[x, y]];
    this.turns = [];
  }

  /** Drive straight for `length`. */
  forward(length) {
    const n = Math.max(1, Math.round(length / this.step));
    const dx = (Math.cos(this.a) * length) / n;
    const dy = (Math.sin(this.a) * length) / n;
    for (let i = 0; i < n; i++) {
      this.x += dx;
      this.y += dy;
      this.pts.push([this.x, this.y]);
    }
    return this;
  }

  /** Turn along an arc of `radius`; positive degrees = turn that decreases heading. */
  turn(radius, degrees) {
    const positive = degrees > 0;
    const angle = (Math.abs(degrees) * Math.PI) / 180;
    const nx = positive ? Math.sin(this.a) : -Math.sin(this.a);
    const ny = positive ? -Math.cos(this.a) : Math.cos(this.a);
    const cx = this.x + nx * radius;
    const cy = this.y + ny * radius;
    let theta = Math.atan2(this.y - cy, this.x - cx);
    const n = Math.max(2, Math.round((radius * angle) / this.step));
    const dTheta = ((positive ? -1 : 1) * angle) / n;
    const startIndex = this.pts.length - 1;
    for (let i = 0; i < n; i++) {
      theta += dTheta;
      this.x = cx + Math.cos(theta) * radius;
      this.y = cy + Math.sin(theta) * radius;
      this.pts.push([this.x, this.y]);
    }
    this.a += positive ? -angle : angle;
    this.turns.push([startIndex, this.pts.length - 1, degrees]);
    return this;
  }

  /** Drive straight until reaching coordinate (x, y) along the current axis. */
  to(x, y) {
    const length = Math.abs(Math.cos(this.a)) > 0.5 ? (x - this.x) / Math.cos(this.a) : (y - this.y) / Math.sin(this.a);
    return this.forward(length);
  }
}
