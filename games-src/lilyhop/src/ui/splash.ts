// Landing splash: two expanding rings and a ring of droplets, removed after the animation.
const DROPS = 7;

export function splash(root: HTMLElement, left: string, top: string, big: boolean): void {
  const el = document.createElement('div');
  el.className = 'splash';
  el.style.left = left;
  el.style.top = top;
  const count = big ? DROPS : 4;
  let html = '<i class="ring"></i><i class="ring r2"></i>';
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + (big ? 0.3 : 0.6);
    const d = big ? 46 : 32;
    html += `<i class="drop" style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d - 14).toFixed(0)}px"></i>`;
  }
  el.innerHTML = html;
  root.append(el);
  window.setTimeout(() => el.remove(), 900);
}
