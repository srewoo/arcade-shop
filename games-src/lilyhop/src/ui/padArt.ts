// Lily pad: shaded disc with a water notch, veins, dew and an occasional blossom.
import { uid } from './svgId';

const stop = (o: number, css: string): string => `<stop offset="${o}" style="stop-color:${css}"/>`;

export function padSvg(variant: number): string {
  const rot = (variant * 47) % 360;
  const u = uid('pd');
  const flower = variant % 4 === 1
    ? '<g transform="translate(76 24)"><g fill="#ffd0e0" stroke="#c25b86" stroke-width="1"><ellipse rx="3" ry="6.5" transform="rotate(0)"/><ellipse rx="3" ry="6.5" transform="rotate(72)"/><ellipse rx="3" ry="6.5" transform="rotate(144)"/><ellipse rx="3" ry="6.5" transform="rotate(216)"/><ellipse rx="3" ry="6.5" transform="rotate(288)"/></g><circle r="2.4" fill="#ffd25e"/></g>'
    : '';
  return `<svg viewBox="0 0 100 100" class="pad-art" aria-hidden="true"><defs>
<radialGradient id="${u}b" cx="0.38" cy="0.32" r="0.8">${stop(0, 'color-mix(in srgb,var(--pad) 62%,#fff)')}${stop(0.55, 'var(--pad)')}${stop(1, 'color-mix(in srgb,var(--pad) 78%,var(--pad-dk))')}</radialGradient>
<radialGradient id="${u}s" cx="0.5" cy="0.5" r="0.5">${'<stop offset="0.7" stop-color="#000" stop-opacity="0.32"/><stop offset="1" stop-color="#000" stop-opacity="0"/>'}</radialGradient>
</defs>
<circle cx="50" cy="56" r="50" fill="url(#${u}s)"/>
<g transform="rotate(${rot} 50 50)">
<circle cx="50" cy="50" r="44" fill="url(#${u}b)" class="pad-edge"/>
<path d="M50 50L92 36A44 44 0 0 1 90 62Z" class="pad-notch"/>
<path d="M50 50L22 20M50 50L14 58M50 50L40 90M50 50L78 82" class="pad-vein"/>
<path d="M50 50L22 20M50 50L14 58M50 50L40 90M50 50L78 82" class="pad-vein-hi" transform="translate(-1 -1)"/>
<path d="M14 40A38 38 0 0 1 46 12" class="pad-rim"/>
<circle cx="30" cy="68" r="1.8" class="dew"/><circle cx="62" cy="24" r="1.4" class="dew"/><circle cx="26" cy="38" r="1.2" class="dew"/>
<circle cx="64" cy="76" r="2.6" class="speck"/><circle cx="38" cy="30" r="2" class="speck"/>${flower}</g></svg>`;
}
