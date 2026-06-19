import { TileState, GRID_SIZE, TILE_PX, TOWER_DEFS, GOLD_PER_SEC, STARTING_HP } from '$lib/types';
import { TileMap } from './TileMap';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { WaveManager } from './WaveManager';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tileMap: TileMap;
  towers: Tower[] = [];
  enemies: Enemy[] = [];
  waveManager: WaveManager;
  private animId = 0;
  private gameTime = 0;
  private goldTimer = 0;

  // Callbacks to UI
  onGoldEarned?: (amount: number) => void;
  onDamageTaken?: (amount: number) => void;
  onEnemyKilled?: (reward: number) => void;
  onWaveChange?: (wave: number) => void;
  onGameEnd?: (victory: boolean) => void;

  // Tower placement state
  isPlacing = false;
  selectedTowerId: string | null = null;
  private highlightTile: [number, number] | null = null;

  coreHp = STARTING_HP;
  gold = 120;
  waveNumber = 0;
  isPlaying = false;
  isPaused = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tileMap = new TileMap();
    this.waveManager = new WaveManager();

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Tower placement via click
    canvas.addEventListener('click', (e: MouseEvent) => this.onClick(e));
    canvas.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start(): void {
    this.reset();
    this.isPlaying = true;
    // Short prep before first wave
    this.waveNumber = 1;
    this.onWaveChange?.(1);
    // Start first wave after 3s prep
    setTimeout(() => {
      this.waveManager.startNextWave();
    }, 3000);

    this.loop();
  }

  private reset(): void {
    this.tileMap.reset();
    this.towers = [];
    this.enemies = [];
    this.waveManager.reset();
    this.gameTime = 0;
    this.goldTimer = 0;
    this.coreHp = STARTING_HP;
    this.gold = 120;
    this.waveNumber = 0;
    this.isPlacing = false;
    this.selectedTowerId = null;
  }

  private loop = (): void => {
    if (!this.isPlaying) return;
    this.animId = requestAnimationFrame(this.loop);

    const dt = Math.min(1 / 30, 1 / 60); // fixed timestep approx
    this.gameTime += dt;

    this.update(dt);
    this.render();
  };

  private update(dt: number): void {
    // Gold income
    this.goldTimer += dt;
    if (this.goldTimer >= 1.0) {
      this.goldTimer -= 1.0;
      this.gold += GOLD_PER_SEC;
    }

    // Corruption spread
    this.tileMap.update(dt);

    // Enemies
    const towerBlocks = this.towers.map(t => ({
      tx: t.tx, ty: t.ty, alive: t.alive,
      blocks: t.def.blocks,
    }));

    for (const enemy of this.enemies) {
      enemy.update(dt, this.tileMap, towerBlocks);
    }

    // Check if enemies reached Core
    const newDead: Enemy[] = [];
    for (const e of this.enemies) {
      if (e.reached) {
        this.coreHp -= e.def.damage;
        this.onDamageTaken?.(e.def.damage);
        newDead.push(e);
        if (this.coreHp <= 0) {
          this.endGame(false);
          return;
        }
      }
    }
    this.enemies = this.enemies.filter(e => !e.reached && e.alive);

    // Towers targeting + firing
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      if (tower.def.cleanses) {
        // Purifier: cleanse tiles in range
        for (let dy = -tower.def.range; dy <= tower.def.range; dy++) {
          for (let dx = -tower.def.range; dx <= tower.def.range; dx++) {
            const tx = tower.tx + dx;
            const ty = tower.ty + dy;
            if (Math.abs(dx) + Math.abs(dy) <= tower.def.range + 1) {
              this.tileMap.cleanse(tx, ty);
            }
          }
        }
      } else if (tower.def.damage > 0) {
        const target = tower.findTarget(this.enemies);
        if (target && tower.canFire(this.gameTime)) {
          tower.fire(this.gameTime);
          const killed = target.takeDamage(tower.def.damage);
          if (killed) {
            this.gold += target.def.reward;
            this.onEnemyKilled?.(target.def.reward);
            // Cleanse tile where enemy died
            const [ex, ey] = target.getTilePos();
            this.tileMap.cleanse(ex, ey);
            // Carrier explodes: corrupt adjacent
            if (target.def.corruptsAdjacent) {
              this.tileMap.corruptArea(ex, ey, 2);
            }
          }
        }
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter(e => e.alive);

    // Remove destroyed towers
    this.towers = this.towers.filter(t => t.alive);

    // Wave manager
    const newEnemies = this.waveManager.update(dt, this.enemies);
    for (const e of newEnemies) {
      this.enemies.push(e);
    }

    if (this.waveManager.waveComplete && !this.waveManager.allWavesComplete) {
      this.waveNumber = this.waveManager.getCurrentWaveNumber();
      this.onWaveChange?.(this.waveNumber);
      // Start next wave after short prep
      setTimeout(() => {
        this.waveManager.startNextWave();
      }, 4000);
    }

    if (this.waveManager.allWavesComplete && this.enemies.length === 0) {
      this.endGame(true);
    }
  }

  private endGame(victory: boolean): void {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.onGameEnd?.(victory);
  }

  // ─── Tower Placement ───────────────────────────

  startPlacing(towerId: string): void {
    this.isPlacing = true;
    this.selectedTowerId = towerId;
  }

  cancelPlacing(): void {
    this.isPlacing = false;
    this.selectedTowerId = null;
    this.highlightTile = null;
  }

  private onClick(e: MouseEvent): void {
    if (!this.isPlaying || !this.isPlacing || !this.selectedTowerId) return;
    const [tx, ty] = this.mouseToTile(e);
    if (!this.tileMap.isInBounds(tx, ty)) return;
    if (!this.tileMap.canBuild(tx, ty)) return;

    const def = TOWER_DEFS[this.selectedTowerId];
    if (this.gold < def.cost) return;

    // Check tile not already occupied
    for (const t of this.towers) {
      if (t.tx === tx && t.ty === ty && t.alive) return;
    }

    this.gold -= def.cost;
    const tower = new Tower(this.selectedTowerId, tx, ty);
    this.towers.push(tower);

    this.isPlacing = false;
    this.selectedTowerId = null;
    this.highlightTile = null;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isPlacing) {
      this.highlightTile = null;
      return;
    }
    this.highlightTile = this.mouseToTile(e);
  }

  private mouseToTile(e: MouseEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / (window.devicePixelRatio || 1) / rect.width;
    const scaleY = this.canvas.height / (window.devicePixelRatio || 1) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const tileSize = Math.min(rect.width, rect.height) / GRID_SIZE;
    const offsetX = (rect.width - tileSize * GRID_SIZE) / 2;
    const offsetY = (rect.height - tileSize * GRID_SIZE) / 2;
    return [
      Math.floor((mx - offsetX) / tileSize),
      Math.floor((my - offsetY) / tileSize),
    ];
  }

  // ─── Rendering ─────────────────────────────────

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const tileSize = Math.min(w, h) / GRID_SIZE;
    const ox = (w - tileSize * GRID_SIZE) / 2;
    const oy = (h - tileSize * GRID_SIZE) / 2;

    // Background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, w, h);

    // Tiles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tileMap.tiles[y][x];
        const px = ox + x * tileSize;
        const py = oy + y * tileSize;

        switch (tile.state) {
          case TileState.CLEAN:
            ctx.fillStyle = '#0f2f1f';
            break;
          case TileState.CORRUPTED:
            ctx.fillStyle = '#2a0f2f';
            break;
          case TileState.PURIFIED:
            ctx.fillStyle = '#2f2f0f';
            break;
        }
        ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, tileSize, tileSize);

        // Purified border
        if (tile.state === TileState.PURIFIED) {
          ctx.strokeStyle = '#ffdd44';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        }

        // Corrupted veins
        if (tile.state === TileState.CORRUPTED) {
          ctx.strokeStyle = 'rgba(255,0,80,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + tileSize * 0.3, py + tileSize * 0.5);
          ctx.lineTo(px + tileSize * 0.7, py + tileSize * 0.3);
          ctx.moveTo(px + tileSize * 0.5, py + tileSize * 0.7);
          ctx.lineTo(px + tileSize * 0.2, py + tileSize * 0.8);
          ctx.stroke();
        }
      }
    }

    // Core at center
    const coreSize = tileSize * 1.2;
    const cx = ox + (GRID_SIZE / 2) * tileSize;
    const cy = oy + (GRID_SIZE / 2) * tileSize;
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, coreSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Core HP indicator
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.floor(tileSize * 0.4)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`🛡️${this.coreHp}`, cx, cy - coreSize / 2 - 6);

    // Towers
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      const tx = ox + (tower.tx + 0.5) * tileSize;
      const ty = oy + (tower.ty + 0.5) * tileSize;
      const ts = tileSize * 0.7;

      ctx.fillStyle = tower.def.color;
      if (tower.def.blocks) {
        // Bulwark: square
        ctx.fillRect(tx - ts / 2, ty - ts / 2, ts, ts);
        // HP bar
        const hpRatio = tower.hp / tower.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? '#4f4' : hpRatio > 0.25 ? '#fa0' : '#f22';
        ctx.fillRect(tx - ts / 2, ty - ts / 2 - 4, ts * hpRatio, 3);
      } else if (tower.def.cleanses) {
        // Purifier: diamond
        ctx.beginPath();
        ctx.moveTo(tx, ty - ts / 2);
        ctx.lineTo(tx + ts / 2, ty);
        ctx.lineTo(tx, ty + ts / 2);
        ctx.lineTo(tx - ts / 2, ty);
        ctx.closePath();
        ctx.fill();
        // Pulse ring
        const pulse = Math.sin(this.gameTime * 3) * 0.3 + 0.7;
        ctx.strokeStyle = tower.def.color;
        ctx.globalAlpha = pulse * 0.5;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, ts * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // Lancer: triangle pointing toward nearest edge
        ctx.beginPath();
        ctx.moveTo(tx, ty - ts / 2);
        ctx.lineTo(tx - ts / 2, ty + ts / 2);
        ctx.lineTo(tx + ts / 2, ty + ts / 2);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Enemies
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const ex = ox + (enemy.x + 0.5) * tileSize;
      const ey = oy + (enemy.y + 0.5) * tileSize;
      const es = tileSize * 0.4;

      ctx.fillStyle = '#dd44ff';
      ctx.beginPath();
      ctx.arc(ex, ey, es, 0, Math.PI * 2);
      ctx.fill();

      // HP bar
      const hpRatio = enemy.hp / enemy.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#4f4' : '#f22';
      ctx.fillRect(ex - es, ey - es - 5, es * 2 * hpRatio, 2);
    }

    // Placement highlight
    if (this.highlightTile) {
      const [hx, hy] = this.highlightTile;
      const px = ox + hx * tileSize;
      const py = oy + hy * tileSize;
      const canPlace = this.tileMap.canBuild(hx, hy) && this.selectedTowerId && this.gold >= (TOWER_DEFS[this.selectedTowerId]?.cost ?? Infinity);
      ctx.strokeStyle = canPlace ? '#44ff44' : '#ff4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
      ctx.fillStyle = canPlace ? 'rgba(68,255,68,0.2)' : 'rgba(255,68,68,0.2)';
      ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
    }
  }

  stop(): void {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
