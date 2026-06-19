// === Purifier — Nanite Corruption TD ===

export enum TileState {
  CLEAN = 'clean',
  CORRUPTED = 'corrupted',
  PURIFIED = 'purified',
}

export interface TowerDef {
  id: string;
  name: string;
  cost: number;
  damage: number;
  range: number;       // tiles
  fireRate: number;    // shots per second
  color: string;
  cleanses: boolean;   // purifier?
  blocks: boolean;     // bulwark?
}

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;       // tiles per second
  damage: number;      // damage to Core
  reward: number;
  corruptsAdjacent: boolean;  // explodes on death?
}

export interface WaveDef {
  waveNumber: number;
  enemies: { defId: string; count: number; interval: number }[];
}

// ─── Grid ────────────────────────────────────────
export const GRID_SIZE = 12;
export const TILE_PX = 48;

// ─── Towers ──────────────────────────────────────
export const TOWER_DEFS: Record<string, TowerDef> = {
  purifier: {
    id: 'purifier',
    name: 'Purifier',
    cost: 25,
    damage: 0,
    range: 2,
    fireRate: 0,
    color: '#44aaff',
    cleanses: true,
    blocks: false,
  },
  lancer: {
    id: 'lancer',
    name: 'Lancer',
    cost: 50,
    damage: 15,
    range: 5,
    fireRate: 1.2,
    color: '#ff6644',
    cleanses: false,
    blocks: false,
  },
  bulwark: {
    id: 'bulwark',
    name: 'Bulwark',
    cost: 30,
    damage: 0,
    range: 0,
    fireRate: 0,
    color: '#8899aa',
    cleanses: false,
    blocks: true,
  },
};

// ─── Enemies ─────────────────────────────────────
export const ENEMY_DEFS: Record<string, EnemyDef> = {
  drone: {
    id: 'drone',
    name: 'Nanite Drone',
    hp: 40,
    speed: 1.8,
    damage: 1,
    reward: 15,
    corruptsAdjacent: false,
  },
  carrier: {
    id: 'carrier',
    name: 'Bloated Carrier',
    hp: 120,
    speed: 0.8,
    damage: 2,
    reward: 30,
    corruptsAdjacent: true,
  },
};

// ─── Waves ───────────────────────────────────────
export const WAVES: WaveDef[] = [
  { waveNumber: 1, enemies: [{ defId: 'drone', count: 4, interval: 2.0 }] },
  { waveNumber: 2, enemies: [{ defId: 'drone', count: 6, interval: 1.8 }] },
  { waveNumber: 3, enemies: [{ defId: 'drone', count: 5, interval: 1.5 }, { defId: 'carrier', count: 1, interval: 3.0 }] },
  { waveNumber: 4, enemies: [{ defId: 'drone', count: 8, interval: 1.2 }, { defId: 'carrier', count: 2, interval: 2.5 }] },
  { waveNumber: 5, enemies: [{ defId: 'drone', count: 10, interval: 1.0 }, { defId: 'carrier', count: 3, interval: 2.0 }] },
];

// ─── Game constants ──────────────────────────────
export const STARTING_GOLD = 120;
export const STARTING_HP = 20;
export const GOLD_PER_SEC = 3;
export const CORRUPTION_SPREAD_INTERVAL = 8; // seconds between spread ticks
export const PURIFIED_IMMUNITY = 30; // seconds immunity after purification
