import type { EnemyDef } from '$lib/types';
import { ENEMY_DEFS, GRID_SIZE } from '$lib/types';
import type { TileMap } from './TileMap';
import { TileState } from '$lib/types';

let nextId = 1;

export class Enemy {
  id: string;
  def: EnemyDef;
  x: number;         // tile-space position (float)
  y: number;
  hp: number;
  maxHp: number;
  alive = true;
  reached = false;
  progress: number;  // distance traveled

  private tx: number; // target tile (Core center)
  private ty: number;

  constructor(defId: string, startX: number, startY: number, targetX: number, targetY: number) {
    this.def = ENEMY_DEFS[defId];
    this.id = `enemy_${nextId++}`;
    this.x = startX;
    this.y = startY;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.tx = targetX;
    this.ty = targetY;
    this.progress = 0;
  }

  /** Update. Returns false when dead or reached Core. */
  update(dt: number, tileMap: TileMap, towers: { tx: number; ty: number; alive: boolean; blocks: boolean }[]): boolean {
    if (!this.alive) return false;

    // Move toward target
    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.3) {
      this.reached = true;
      this.alive = false;
      return false;
    }

    const moveX = (dx / dist) * this.def.speed * dt;
    const moveY = (dy / dist) * this.def.speed * dt;

    // Check for blocking towers (Bulwark) in the path
    let blocked = false;
    const nextX = this.x + moveX;
    const nextY = this.y + moveY;

    for (const t of towers) {
      if (!t.alive || !t.blocks) continue;
      const tdx = t.tx + 0.5 - nextX;
      const tdy = t.ty + 0.5 - nextY;
      if (Math.abs(tdx) < 0.5 && Math.abs(tdy) < 0.5) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      this.x = nextX;
      this.y = nextY;
      this.progress += this.def.speed * dt;

      // Corrupt the tile under the enemy
      const tileX = Math.floor(this.x);
      const tileY = Math.floor(this.y);
      tileMap.corrupt(tileX, tileY);
    }

    return true;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      // Carrier explodes on death
      if (this.def.corruptsAdjacent) {
        return true; // signal to corrupt area
      }
      // Kill on corrupted tile → cleanse it
      return false;
    }
    return false;
  }

  getTilePos(): [number, number] {
    return [Math.floor(this.x), Math.floor(this.y)];
  }

  getPixelPos(tilePx: number): [number, number] {
    return [(this.x + 0.5) * tilePx, (this.y + 0.5) * tilePx];
  }
}
