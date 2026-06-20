import type { EnemyDef } from '$lib/types';
import { ENEMY_DEFS, GRID_SIZE } from '$lib/types';
import type { TileMap } from './TileMap';

let nextId = 1;

export class Enemy {
  id: string;
  def: EnemyDef;
  x = 0;
  y = 0;
  hp: number;
  maxHp: number;
  alive = true;
  reached = false;
  progress = 0;

  private tx: number;
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
  }

  update(dt: number, tileMap: TileMap, towers: { tx: number; ty: number; alive: boolean; blocks: boolean }[], speedMult = 1): boolean {
    if (!this.alive) return false;

    const dx = this.tx - this.x;
    const dy = this.ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.3) { this.reached = true; this.alive = false; return false; }

    const speed = this.def.speed * speedMult;
    const moveX = (dx / dist) * speed * dt;
    const moveY = (dy / dist) * speed * dt;

    let blocked = false;
    const nextX = this.x + moveX;
    const nextY = this.y + moveY;
    for (const t of towers) {
      if (!t.alive || !t.blocks) continue;
      if (Math.abs(t.tx + 0.5 - nextX) < 0.45 && Math.abs(t.ty + 0.5 - nextY) < 0.45) {
        blocked = true; break;
      }
    }

    if (!blocked) {
      this.x = nextX;
      this.y = nextY;
      this.progress += speed * dt;
      tileMap.corrupt(Math.floor(this.x), Math.floor(this.y));
    }
    return true;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; this.alive = false; return true; }
    return false;
  }

  getTilePos(): [number, number] { return [Math.floor(this.x), Math.floor(this.y)]; }
  getPixelPos(tilePx: number, ox: number, oy: number): [number, number] {
    return [ox + (this.x + 0.5) * tilePx, oy + (this.y + 0.5) * tilePx];
  }
}
