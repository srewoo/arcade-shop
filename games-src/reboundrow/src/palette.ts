// Canvas colours. The field stays dark in every theme so contrast never depends on the page theme.
// Verified in tests/contrast.test.ts.
export const PALETTE = {
  field: '#0e1530',
  fieldTop: '#16204a',
  grid: '#1b2650',
  edge: '#7d90d6',
  ball: '#ffffff',
  paddle: '#eef1fb',
  paddleLaser: '#ff9a55',
  ink: '#0e1530',
  text: '#eef1fb',
  brick: ['#3ec1f2', '#f4c542', '#ff7a9c'],
  // Row hues for the brick wall (hit points are shown by frame + dots, never by hue alone).
  rows: ['#ff6b8b', '#ff9a55', '#f4c542', '#47e08a', '#3ec1f2', '#8a9cff', '#c995ff'],
  accent: '#8a6cf0',
  heart: '#ff6b8b',
  steel: '#a3aecb',
  steelDark: '#5d6a8f',
  power: { wide: '#47e08a', multi: '#c995ff', slow: '#6fd0ff', laser: '#ff9a55' },
  confetti: ['#3ec1f2', '#f4c542', '#ff7a9c', '#47e08a', '#c995ff'],
} as const;
