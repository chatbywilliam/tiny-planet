import type { WaveDef } from '$lib/types';
import { WAVES } from '$lib/types';
import { Enemy } from './Enemy';
import type { Enemy as EnemyType } from './Enemy';

export class WaveManager {
  private currentWaveIndex: number = 0;
  private spawnQueue: { defId: string; count: number; interval: number; spawnTimer: number; spawned: number }[] = [];
  waveComplete: boolean = false;
  allWavesComplete: boolean = false;

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
      spawnTimer: 1.5,
      spawned: 0,
    }));
    this.waveComplete = false;
    return wave;
  }

  update(dt: number, activeEnemies: EnemyType[]): EnemyType[] {
    if (this.waveComplete || this.allWavesComplete) return [];

    const toSpawn: EnemyType[] = [];

    for (const entry of this.spawnQueue) {
      if (entry.spawned >= entry.count) continue;
      entry.spawnTimer -= dt;
      if (entry.spawnTimer <= 0) {
        const theta = Math.random() * Math.PI * 2;
        const endTheta = theta + Math.PI;
        const enemy = new Enemy(entry.defId, theta, endTheta);
        toSpawn.push(enemy);
        entry.spawned++;
        entry.spawnTimer = entry.interval;
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
