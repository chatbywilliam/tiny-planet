import type { TowerDef } from '$lib/types';
import { TOWER_DEFS, GRID_SIZE } from '$lib/types';
import type { Enemy } from './Enemy';

let nextId = 1;

export class Tower {
  id: string;
  def: TowerDef;
  tx: number;
  ty: number;
  lastFireTime = 0;
  hp = 150; // bulwark HP
  maxHp = 150;
  alive = true;

  constructor(defId: string, tx: number, ty: number) {
    this.def = TOWER_DEFS[defId];
    this.id = `tower_${nextId++}`;
    this.tx = tx;
    this.ty = ty;
  }

  findTarget(enemies: Enemy[]): Enemy | null {
    if (this.def.damage <= 0 || !this.alive) return null;
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Math.abs(e.x - this.tx) + Math.abs(e.y - this.ty);
      if (dist <= this.def.range && e.progress > closestDist === false) {
        if (dist < closestDist) {
          closestDist = dist;
          closest = e;
        }
      }
    }
    return closest;
  }

  canFire(now: number): boolean {
    if (this.def.fireRate <= 0) return false;
    return (now - this.lastFireTime) >= (1.0 / this.def.fireRate);
  }

  fire(now: number): void {
    this.lastFireTime = now;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  getCenterPixel(tilePx: number): [number, number] {
    return [
      (this.tx + 0.5) * tilePx,
      (this.ty + 0.5) * tilePx,
    ];
  }
}
