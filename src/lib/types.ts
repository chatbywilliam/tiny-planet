// ═══════════════════════════════════════════════
//  PURIFIER — Nanite Corruption Defense
//  Commercial-grade tower defense
// ═══════════════════════════════════════════════

export enum TileState { CLEAN = 'clean', CORRUPTED = 'corrupted', PURIFIED = 'purified' }
export enum TileTerrain { NORMAL = 'normal', ROUGH = 'rough', CRYSTAL = 'crystal' }

export interface TowerDef {
  id: string; name: string; cost: number; damage: number;
  range: number; fireRate: number; color: string;
  cleanses: boolean; blocks: boolean;
  upgradeCost: number; upgradeMult: number; // 50% more cost, 40% more power per tier
}

export interface EnemyDef {
  id: string; name: string; hp: number; speed: number;
  damage: number; reward: number; corruptsAdjacent: boolean;
  color: string; size: number;
}

export interface WaveDef {
  waveNumber: number;
  enemies: { defId: string; count: number; interval: number }[];
}

// ─── Grid ────────────────────────────────────
export const GRID_SIZE = 20;
export const TILE_PX = 40; // base, scales to viewport

// ─── Towers (4 types) ────────────────────────
export const TOWER_DEFS: Record<string, TowerDef> = {
  purifier: {
    id: 'purifier', name: 'Purifier', cost: 30, damage: 0,
    range: 2, fireRate: 0, color: '#44ccff',
    cleanses: true, blocks: false, upgradeCost: 40, upgradeMult: 1.4,
  },
  lancer: {
    id: 'lancer', name: 'Lancer', cost: 60, damage: 18,
    range: 5, fireRate: 1.5, color: '#ff6644',
    cleanses: false, blocks: false, upgradeCost: 50, upgradeMult: 1.4,
  },
  bulwark: {
    id: 'bulwark', name: 'Bulwark', cost: 35, damage: 0,
    range: 0, fireRate: 0, color: '#8899bb',
    cleanses: false, blocks: true, upgradeCost: 40, upgradeMult: 1.5,
  },
  nova: {
    id: 'nova', name: 'Nova', cost: 80, damage: 30,
    range: 3, fireRate: 0.5, color: '#ffaa00',
    cleanses: false, blocks: false, upgradeCost: 60, upgradeMult: 1.4,
  },
};

// ─── Enemies (5 types) ───────────────────────
export const ENEMY_DEFS: Record<string, EnemyDef> = {
  drone: {
    id: 'drone', name: 'Nanite Drone', hp: 35, speed: 1.0,
    damage: 1, reward: 12, corruptsAdjacent: false,
    color: '#cc44ff', size: 1,
  },
  carrier: {
    id: 'carrier', name: 'Bloated Carrier', hp: 130, speed: 0.5,
    damage: 2, reward: 30, corruptsAdjacent: true,
    color: '#ff44aa', size: 1.6,
  },
  stalker: {
    id: 'stalker', name: 'Phase Stalker', hp: 50, speed: 1.3,
    damage: 1, reward: 20, corruptsAdjacent: false,
    color: '#44ffcc', size: 0.9,
  },
  swarm: {
    id: 'swarm', name: 'Nanite Swarm', hp: 8, speed: 1.6,
    damage: 1, reward: 3, corruptsAdjacent: false,
    color: '#ff88cc', size: 0.5,
  },
  leviathan: {
    id: 'leviathan', name: 'Leviathan', hp: 500, speed: 0.3,
    damage: 5, reward: 100, corruptsAdjacent: true,
    color: '#ff0044', size: 2.5,
  },
};

// ─── Waves (8 waves) ─────────────────────────
export const WAVES: WaveDef[] = [
  { waveNumber: 1, enemies: [{ defId: 'drone', count: 5, interval: 2.5 }] },
  { waveNumber: 2, enemies: [{ defId: 'drone', count: 8, interval: 2.0 }] },
  { waveNumber: 3, enemies: [{ defId: 'drone', count: 6, interval: 1.8 }, { defId: 'carrier', count: 1, interval: 4.0 }] },
  { waveNumber: 4, enemies: [{ defId: 'drone', count: 6, interval: 1.5 }, { defId: 'stalker', count: 2, interval: 3.0 }] },
  { waveNumber: 5, enemies: [{ defId: 'drone', count: 5, interval: 1.5 }, { defId: 'carrier', count: 2, interval: 3.5 }, { defId: 'swarm', count: 4, interval: 1.0 }] },
  { waveNumber: 6, enemies: [{ defId: 'stalker', count: 4, interval: 2.0 }, { defId: 'carrier', count: 2, interval: 3.0 }, { defId: 'drone', count: 8, interval: 1.2 }] },
  { waveNumber: 7, enemies: [{ defId: 'carrier', count: 3, interval: 2.5 }, { defId: 'stalker', count: 4, interval: 2.0 }, { defId: 'swarm', count: 6, interval: 0.8 }] },
  { waveNumber: 8, enemies: [{ defId: 'leviathan', count: 1, interval: 5.0 }, { defId: 'drone', count: 10, interval: 1.0 }, { defId: 'stalker', count: 3, interval: 2.0 }] },
];

// ─── Game constants ──────────────────────────
export const STARTING_GOLD = 150;
export const STARTING_HP = 25;
export const GOLD_PER_SEC = 2;
export const CORRUPTION_SPREAD_INTERVAL = 12;
export const PURIFIED_IMMUNITY = 35;
export const WAVE_PREP_TIME = 8; // seconds between waves
