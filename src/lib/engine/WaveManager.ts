import type { WaveDef } from '$lib/types';
import { WAVES, GRID_SIZE } from '$lib/types';
import { Enemy } from './Enemy';

export class WaveManager {
  private currentWaveIndex = 0;
  private spawnQueue: { defId: string; count: number; interval: number; timer: number; spawned: number }[] = [];
  waveComplete = false;
  allWavesComplete = false;
  private spawnTiles: [number, number][] = [];

  constructor() {
    // Edge spawn points: top, bottom, left, right midpoints
    this.spawnTiles = [
      [Math.floor(GRID_SIZE / 2), 0],           // top center
      [Math.floor(GRID_SIZE / 2), GRID_SIZE - 1], // bottom center
      [0, Math.floor(GRID_SIZE / 2)],            // left center
      [GRID_SIZE - 1, Math.floor(GRID_SIZE / 2)], // right center
    ];
  }

  reset(): void {
    this.currentWaveIndex = 0;
    this.spawnQueue = [];
    this.waveComplete = false;
    this.allWavesComplete = false;
  }

  startNextWave(): WaveDef | null {
    if (this.currentWaveIndex >= WAVES.length) {
      this.allWavesComplete = true;
      return null;
    }
    const wave = WAVES[this.currentWaveIndex];
    this.spawnQueue = wave.enemies.map(e => ({
      defId: e.defId,
      count: e.count,
      interval: e.interval,
      timer: 0.5,
      spawned: 0,
    }));
    this.waveComplete = false;
    return wave;
  }

  update(dt: number, activeEnemies: Enemy[]): Enemy[] {
    if (this.waveComplete || this.allWavesComplete) return [];

    const toSpawn: Enemy[] = [];

    for (const entry of this.spawnQueue) {
      if (entry.spawned >= entry.count) continue;
      entry.timer -= dt;
      if (entry.timer <= 0) {
        // Random spawn point
        const [sx, sy] = this.spawnTiles[Math.floor(Math.random() * this.spawnTiles.length)];
        const enemy = new Enemy(entry.defId, sx, sy, Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2));
        toSpawn.push(enemy);
        entry.spawned++;
        entry.timer = entry.interval;
      }
    }

    const allSpawned = this.spawnQueue.every(e => e.spawned >= e.count);
    const noActive = activeEnemies.length === 0;
    if (allSpawned && noActive) {
      this.waveComplete = true;
      this.currentWaveIndex++;
    }

    return toSpawn;
  }

  getCurrentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  getTotalWaves(): number {
    return WAVES.length;
  }
}
