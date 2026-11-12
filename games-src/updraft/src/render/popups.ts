// Floating "+N" score popups. Cosmetic only. Reduced motion keeps the text but stops it drifting.
interface Popup { x: number; y: number; age: number; text: string }

const LIFE = 0.8;

export class Popups {
  private items: Popup[] = [];
  get count(): number { return this.items.length; }
  clear(): void { this.items = []; }
  add(x: number, y: number, text: string): void {
    if (this.items.length < 8) this.items.push({ x, y, age: 0, text });
  }
  update(dt: number): void {
    for (const p of this.items) p.age += dt;
    this.items = this.items.filter((p) => p.age < LIFE);
  }
  draw(ctx: CanvasRenderingContext2D, camX: number, reduced: boolean): void {
    ctx.font = '800 18px ui-rounded, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    for (const p of this.items) {
      const t = p.age / LIFE;
      ctx.globalAlpha = 1 - t * t;
      const y = p.y - 18 - (reduced ? 0 : t * 34);
      ctx.strokeStyle = 'rgba(10, 21, 33, 0.85)';
      ctx.strokeText(p.text, p.x - camX, y);
      ctx.fillStyle = '#ffd24a';
      ctx.fillText(p.text, p.x - camX, y);
    }
    ctx.globalAlpha = 1;
  }
}
