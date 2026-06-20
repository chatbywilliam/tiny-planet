import type { TowerDef } from '$lib/types';
import { TOWER_DEFS } from '$lib/types';
import type { Enemy } from './Enemy';

let nextId = 1;

export class Tower {
  id: string;
  def: TowerDef;
  tx: number;
  ty: number;
  lastFireTime = 0;
  hp = 200;
  maxHp = 200;
  alive = true;
  upgrades = 0;

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
    const range = this.def.range + this.upgrades;

    for (const e of enemies) {
      if (!e.alive) continue;
      const dist = Math.sqrt((e.x - this.tx - 0.5) ** 2 + (e.y - this.ty - 0.5) ** 2);
      if (dist <= range && dist < closestDist) {
        closestDist = dist;
        closest = e;
      }
    }
    return closest;
  }

  canFire(now: number): boolean {
    if (this.def.fireRate <= 0) return false;
    return (now - this.lastFireTime) >= (1.0 / (this.def.fireRate + this.upgrades * 0.2));
  }

  fire(now: number): void { this.lastFireTime = now; }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; return true; }
    return false;
  }

  getCenterPixel(tilePx: number, ox: number, oy: number): [number, number] {
    return [ox + (this.tx + 0.5) * tilePx, oy + (this.ty + 0.5) * tilePx];
  }
}
