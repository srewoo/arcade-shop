// Code-drawn art palette. Gameplay objects (ball, outline) keep >= 3:1 against every backdrop band.
export const PAL = {
  skyTop: '#4aa8e8', skyMid: '#8ed0f5', skyLow: '#dff3fb', sun: '#fff3b8', sunCore: '#ffffff',
  hillFar: '#8fc4b4', hillNear: '#5fa384', trees: '#3f8466',
  standBack: '#3b4a63', standRow: ['#56688a', '#4a5b7c', '#3f4f6e'] as const, standLip: '#7d8fb0',
  wall: '#1f6f8f', wallHi: '#4ca3c2', wallStripe: '#f2f7fa',
  apron: '#3f9a5a', apronDark: '#357f4b', court: '#2a76bf', courtDark: '#1f5f9e', courtLight: '#3f8fd0', line: '#f4f8fb',
  hedge: '#2a6b45', hedgeHi: '#3f8e5e', post: '#d9e4ec',
  ball: '#d9e83a', ballLight: '#f3fa8a', ballDark: '#9fb21a', ballRim: '#1b2608', seam: '#fbfdf0', seamShade: 'rgba(60,70,10,0.45)',
  shadow: 'rgba(8,24,40,', ripple: '#ffffff', sweet: '#fff1a0', sweetInk: '#8a6a00',
  crowd: ['#f0c6a0', '#c98e62', '#8a5a3c', '#f6d9bd', '#b07448'] as const,
  shirts: ['#e8574c', '#f4c542', '#ffffff', '#3e8bd4', '#6cc07a', '#f08a3c', '#b56fd0'] as const,
  cloud: '#ffffff', cloudShade: '#cfe6f3', sock: '#ff7a2a', sockBand: '#ffffff', pole: '#e6edf2',
  reticle: '#ffffff', reticleInk: '#0e1b2a', callout: '#fff7c2', calloutInk: '#1a2a08',
} as const;
