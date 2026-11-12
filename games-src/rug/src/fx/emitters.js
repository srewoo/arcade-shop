// Emitters mixed into Particles.prototype: one-shot bursts built on Particles.emit().
export const emitterMethods = {
  /** Expected-value scaling of a small emitter count by `density` (Reduce motion keeps <= 40 %). */
  scaled(count) {
    return this.density >= 1 ? count : Math.floor(count * this.density + Math.random());
  },

  /** Radial dust puff (landings, impacts, sofa landing). intensity scales count and speed. */
  puff(x, z, intensity = 1) {
    const n = Math.round((18 + 22 * intensity) * this.density);
    for (let k = 0; k < n; k++) {
      const angle = this.rnd() * Math.PI * 2;
      const speed = (2 + this.rnd() * 5) * (0.6 + intensity * 0.6);
      const ox = Math.cos(angle) * (1.4 + this.rnd() * 1.6);
      const oz = Math.sin(angle) * (1.4 + this.rnd() * 1.6);
      const color = this.rugColor(x + ox, z + oz, 0.25);
      this.emit(
        0,
        x + ox,
        0.25 + this.rnd() * 0.4,
        z + oz,
        Math.cos(angle) * speed,
        1.5 + this.rnd() * 3.5 * intensity,
        Math.sin(angle) * speed,
        0.5 + this.rnd() * 0.9,
        0.7 + this.rnd() * 0.6,
        color,
      );
    }
  },

  /** Flick up rug fibres behind a moving car (vx,vz = car velocity; `lift` = upward speed scale). */
  fibers(x, z, vx, vz, count = 2, lift = 3) {
    const n = this.scaled(count);
    for (let k = 0; k < n; k++) {
      const color = this.rugColor(x, z, 0.05);
      this.emit(
        1,
        x + (this.rnd() - 0.5) * 2,
        0.2,
        z + (this.rnd() - 0.5) * 2,
        -vx * (0.15 + this.rnd() * 0.2) + (this.rnd() - 0.5) * 3,
        lift * (0.5 + this.rnd()),
        -vz * (0.15 + this.rnd() * 0.2) + (this.rnd() - 0.5) * 3,
        0.1 + this.rnd() * 0.12,
        0.5 + this.rnd() * 0.5,
        color,
      );
    }
  },

  /** Drift sparks: short bright flecks thrown sideways off a wheel. `rgb` = [r,g,b] 0..1 (display colour). */
  sparks(x, z, vx, vz, rgb, count = 2) {
    const color = rgb.map((c) => Math.pow(c, 2.2) * 2.4);
    const n = this.scaled(count);
    for (let k = 0; k < n; k++) {
      const r = this.sparkRnd;
      this.emit(
        1,
        x + (r() - 0.5) * 0.6,
        0.3 + r() * 0.4,
        z + (r() - 0.5) * 0.6,
        -vx * 0.12 + (r() - 0.5) * 9,
        2 + r() * 4,
        -vz * 0.12 + (r() - 0.5) * 9,
        0.16 + r() * 0.14,
        0.25 + r() * 0.3,
        color,
      );
    }
  }
};
