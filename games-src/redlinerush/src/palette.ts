// Canvas colours. Contrast against the road is checked in tests/contrast.test.ts.
export const PALETTE = {
  road: '#2b3037',
  roadEdge: '#f2f2f2',
  dash: '#c9ced6',
  grassA: '#1d5c3b',
  grassB: '#18503a',
  tree: '#2f8a4f',
  treeDark: '#226b3d',
  player: '#ff4d3d',
  playerStripe: '#ffffff',
  fuel: '#ffb800',
  boost: '#26d7ff',
  ink: '#10151c',
  glass: '#10151c',
  lights: '#fff1a8',
  hit: '#ff4d3d',
  text: '#ffffff',
  shadow: 'rgba(4,8,12,0.42)',
  rumbleA: '#e8e8e8',
  rumbleB: '#d23a2c',
  asphaltSpeck: 'rgba(255,255,255,0.05)',
  skid: 'rgba(8,10,14,0.22)',
  sky: '#0f2a3a',
  trafficLightness: 62,
  trafficSat: 62,
} as const;

export const trafficColor = (hue: number): string => `hsl(${hue} ${PALETTE.trafficSat}% ${PALETTE.trafficLightness}%)`;
