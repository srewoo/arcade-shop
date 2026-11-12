// Canvas colours. Gameplay-critical graphics (fire, plane, enemies) stay >= 3:1 against the sky.
export interface Palette {
  skyTop: string;
  skyBottom: string;
  cloud: string;
  /** Warm horizon glow and a lighter cloud tone for the near layer. */
  horizon: string;
  cloudNear: string;
  playerBody: string;
  playerWing: string;
  playerShot: string;
  enemyShot: string;
  enemyShotCore: string;
  enemyShotRing: string;
  shield: string;
  text: string;
  textOutline: string;
  bossBar: string;
  bossBarBack: string;
}

export const NORMAL: Palette = {
  skyTop: '#081c3d',
  skyBottom: '#143f70',
  cloud: 'rgba(255,255,255,0.12)',
  horizon: 'rgba(255,150,90,0.30)',
  cloudNear: 'rgba(255,255,255,0.22)',
  playerBody: '#f4f7fb',
  playerWing: '#35c2ff',
  playerShot: '#b8f1ff',
  enemyShot: '#ff7a4d',
  enemyShotCore: '#fff2b0',
  enemyShotRing: '#2a0a05',
  shield: '#7dffb2',
  text: '#ffffff',
  textOutline: '#06182f',
  bossBar: '#ff7a4d',
  bossBarBack: '#06182f',
};

/** Colour-blind assist: a yellow/blue pairing plus outlines and shapes. */
export const ASSIST: Palette = {
  ...NORMAL,
  playerWing: '#4fa8ff',
  enemyShot: '#ffe14a',
  enemyShotCore: '#ffffff',
  enemyShotRing: '#000000',
  shield: '#ffffff',
  bossBar: '#ffe14a',
};

export const PICKUP_COLOUR = { spread: '#ffb020', shield: '#4de39a', bomb: '#ff6a8a' } as const;
export const PICKUP_LETTER = { spread: 'S', shield: 'H', bomb: 'B' } as const;
