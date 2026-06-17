// === Tiny Planet shared types ===

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TowerDef {
  id: string;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  color: number;
}

export interface TowerState {
  id: string;
  defId: string;
  position: Vec3;
  lastFireTime: number;
  level: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  color: number;
  reward: number;
}

export interface EnemyState {
  id: string;
  defId: string;
  position: Vec3;
  hp: number;
  maxHp: number;
  progress: number;
  path: Vec3[];
  pathIndex: number;
}

export interface ProjectileState {
  id: string;
  position: Vec3;
  targetId: string;
  speed: number;
  damage: number;
}

export interface WaveDef {
  waveNumber: number;
  enemies: { defId: string; count: number; interval: number }[];
}

export interface GameUIState {
  health: number;
  maxHealth: number;
  gold: number;
  wave: number;
  score: number;
  isPlaying: boolean;
  isPlacing: boolean;
  selectedTowerDefId: string | null;
}

export const TOWER_DEFS: Record<string, TowerDef> = {
  archer: {
    id: 'archer',
    name: 'Archer',
    cost: 50,
    damage: 10,
    range: 12,          // 3D world units — covers a good zone in space
    fireRate: 1.5,
    color: 0x44aa44,
  },
};

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  meteor: {
    id: 'meteor',
    name: 'Meteor',
    hp: 80,
    speed: 1.5,         // units/sec — ~20s from spawn to impact (35→5=30 units)
    damage: 10,
    color: 0xff4444,
    reward: 25,
  },
};

export const WAVES: WaveDef[] = [
  { waveNumber: 1, enemies: [{ defId: 'meteor', count: 5, interval: 2.0 }] },
  { waveNumber: 2, enemies: [{ defId: 'meteor', count: 8, interval: 1.8 }] },
  { waveNumber: 3, enemies: [{ defId: 'meteor', count: 12, interval: 1.5 }] },
  { waveNumber: 4, enemies: [{ defId: 'meteor', count: 15, interval: 1.2 }] },
  { waveNumber: 5, enemies: [{ defId: 'meteor', count: 20, interval: 1.0 }] },
];

export const PLANET_RADIUS = 5;
export const CORE_RADIUS = 0.3;
export const SPACE_SPAWN_RADIUS = 35;   // enemies spawn this far from planet center
