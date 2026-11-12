// Fixed-timestep accumulator. Render code reads `alpha` to interpolate between states.
export class FixedStepper {
  private acc = 0;
  constructor(private readonly dt: number, private readonly maxFrame: number, private readonly maxSteps: number) {}

  get alpha(): number { return this.acc / this.dt; }
  reset(): void { this.acc = 0; }

  advance(frameSec: number, step: () => void): number {
    this.acc += Math.min(Math.max(frameSec, 0), this.maxFrame);
    let n = 0;
    while (this.acc >= this.dt && n < this.maxSteps) {
      n++;
      this.acc -= this.dt;
      step();
    }
    if (this.acc >= this.dt) this.acc = 0;
    return n;
  }
}
