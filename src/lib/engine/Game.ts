import { TileState, GRID_SIZE, TILE_PX, TOWER_DEFS, GOLD_PER_SEC, STARTING_HP, WAVE_PREP_TIME, ENEMY_DEFS, TileTerrain } from '$lib/types';
import { TileMap } from './TileMap';
import { Tower } from './Tower';
import { Enemy } from './Enemy';
import { WaveManager } from './WaveManager';

// ─── Particle ─────────────────────────────────
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}

// ─── FloatingText ─────────────────────────────
interface FloatText {
  x: number; y: number; text: string; life: number; color: string;
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tileMap: TileMap;
  towers: Tower[] = [];
  enemies: Enemy[] = [];
  waveManager: WaveManager;
  private animId = 0;
  gameTime = 0;
  private goldTimer = 0;
  private wavePrepTimer = 0;
  private betweenWaves = false;

  // Particles & effects
  private particles: Particle[] = [];
  private floatTexts: FloatText[] = [];
  private screenShake = 0;

  // Callbacks
  onEnemyKilled?: (reward: number) => void;
  onDamageTaken?: () => void;
  onWaveChange?: (wave: number) => void;
  onGameEnd?: (victory: boolean) => void;

  // State
  isPlacing = false;
  selectedTowerId: string | null = null;
  private highlightTile: [number, number] | null = null;
  private selectedTower: Tower | null = null;
  coreHp = STARTING_HP;
  gold = 150;
  waveNumber = 0;
  isPlaying = false;
  private tileSize = TILE_PX;
  private ox = 0;
  private oy = 0;

  // Terrain
  private terrain: TileTerrain[][] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.tileMap = new TileMap();
    this.waveManager = new WaveManager();
    this.generateTerrain();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    canvas.addEventListener('click', (e: MouseEvent) => this.onClick(e));
    canvas.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private generateTerrain(): void {
    this.terrain = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.terrain[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const r = Math.random();
        if (r < 0.08) this.terrain[y][x] = TileTerrain.CRYSTAL;
        else if (r < 0.2) this.terrain[y][x] = TileTerrain.ROUGH;
        else this.terrain[y][x] = TileTerrain.NORMAL;
      }
    }
    // Keep center area clean
    for (let y = GRID_SIZE/2-2; y <= GRID_SIZE/2+2; y++)
      for (let x = GRID_SIZE/2-2; x <= GRID_SIZE/2+2; x++)
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE)
          this.terrain[y][x] = TileTerrain.NORMAL;
  }

  private resizeCanvas(): void {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.tileSize = Math.min(w, h) / (GRID_SIZE + 2);
    this.ox = (w - this.tileSize * GRID_SIZE) / 2;
    this.oy = (h - this.tileSize * GRID_SIZE) / 2;
  }

  start(): void {
    this.reset();
    this.isPlaying = true;
    this.waveNumber = 1;
    this.onWaveChange?.(1);
    this.betweenWaves = true;
    this.wavePrepTimer = 3;
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
    this.gold = 150;
    this.waveNumber = 0;
    this.particles = [];
    this.floatTexts = [];
    this.screenShake = 0;
    this.selectedTower = null;
  }

  private loop = (): void => {
    if (!this.isPlaying) return;
    this.animId = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, 1 / 60);
    this.gameTime += dt;
    this.update(dt);
    this.render();
  };

  private update(dt: number): void {
    // Screen shake decay
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 8);

    // Gold income
    this.goldTimer += dt;
    if (this.goldTimer >= 1.0) { this.goldTimer -= 1.0; this.gold += GOLD_PER_SEC; }

    // Wave prep
    if (this.betweenWaves) {
      this.wavePrepTimer -= dt;
      if (this.wavePrepTimer <= 0) {
        this.betweenWaves = false;
        this.waveManager.startNextWave();
      }
    }

    // Corruption spread
    this.tileMap.update(dt);

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Update float texts
    for (const ft of this.floatTexts) { ft.y -= 30 * dt; ft.life -= dt; }
    this.floatTexts = this.floatTexts.filter(ft => ft.life > 0);

    if (this.betweenWaves) return;

    // Tower blocking info
    const towerBlocks = this.towers.map(t => ({
      tx: t.tx, ty: t.ty, alive: t.alive, blocks: t.def.blocks,
    }));

    // Update enemies
    for (const enemy of this.enemies) {
      const terrain = this.terrain[Math.floor(enemy.y)]?.[Math.floor(enemy.x)] ?? TileTerrain.NORMAL;
      const speedMult = terrain === TileTerrain.ROUGH ? 0.5 : 1.0;
      enemy.update(dt, this.tileMap, towerBlocks, speedMult);
    }

    // Check Core hits
    for (const e of this.enemies) {
      if (e.reached) {
        this.coreHp -= e.def.damage;
        this.onDamageTaken?.();
        this.screenShake = 0.3;
        this.spawnParticles(
          (GRID_SIZE/2) * this.tileSize + this.ox,
          (GRID_SIZE/2) * this.tileSize + this.oy,
          '#ff0044', 12, 80
        );
        if (this.coreHp <= 0) { this.endGame(false); return; }
      }
    }
    this.enemies = this.enemies.filter(e => !e.reached && e.alive);

    // Towers act
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      if (tower.def.cleanses) {
        const r = tower.def.range + tower.upgrades;
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++)
            if (Math.abs(dx) + Math.abs(dy) <= r + 1)
              this.tileMap.cleanse(tower.tx + dx, tower.ty + dy);
      } else if (tower.def.damage > 0) {
        const target = tower.findTarget(this.enemies);
        if (target && tower.canFire(this.gameTime)) {
          tower.fire(this.gameTime);
          const dmg = tower.def.damage * (1 + tower.upgrades * (tower.def.upgradeMult - 1));
          const killed = target.takeDamage(dmg);
          // Muzzle flash
          const [px, py] = tower.getCenterPixel(this.tileSize, this.ox, this.oy);
          this.spawnParticles(px, py, tower.def.color, 3, 30);
          // Damage float
          if (killed) {
            this.gold += target.def.reward;
            this.onEnemyKilled?.(target.def.reward);
            const [ex, ey] = target.getPixelPos(this.tileSize, this.ox, this.oy);
            this.floatTexts.push({ x: ex, y: ey, text: `+${target.def.reward}🪙`, life: 1.5, color: '#ffd700' });
            // Death particles
            this.spawnParticles(ex, ey, target.def.color, 6, 60);
            const [tx, ty] = target.getTilePos();
            this.tileMap.cleanse(tx, ty);
            if (target.def.corruptsAdjacent) {
              this.tileMap.corruptArea(tx, ty, 2);
              this.spawnParticles(ex, ey, '#ff0044', 15, 100);
            }
          }
        }
      }
    }
    this.enemies = this.enemies.filter(e => e.alive);
    this.towers = this.towers.filter(t => t.alive);

    // Wave manager
    const newEnemies = this.waveManager.update(dt, this.enemies);
    for (const e of newEnemies) this.enemies.push(e);

    if (this.waveManager.waveComplete && !this.waveManager.allWavesComplete) {
      this.waveNumber = this.waveManager.getCurrentWaveNumber();
      this.onWaveChange?.(this.waveNumber);
      this.betweenWaves = true;
      this.wavePrepTimer = WAVE_PREP_TIME;
    }

    if (this.waveManager.allWavesComplete && this.enemies.length === 0) {
      // Short delay then victory
      setTimeout(() => this.endGame(true), 1000);
    }
  }

  private endGame(victory: boolean): void {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.onGameEnd?.(victory);
  }

  // ─── Particles ──────────────────────────────
  private spawnParticles(x: number, y: number, color: string, count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        life: 0.4 + Math.random() * 0.6, maxLife: 1.0,
        color, size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  // ─── Input ──────────────────────────────────
  startPlacing(towerId: string): void { this.isPlacing = true; this.selectedTowerId = towerId; this.selectedTower = null; }
  cancelPlacing(): void { this.isPlacing = false; this.selectedTowerId = null; this.highlightTile = null; }

  private onClick(e: MouseEvent): void {
    const [tx, ty] = this.mouseToTile(e);
    if (!this.tileMap.isInBounds(tx, ty)) { this.cancelPlacing(); return; }

    // Check if clicking existing tower → select it (for upgrade)
    const clickedTower = this.towers.find(t => t.tx === tx && t.ty === ty && t.alive);
    if (clickedTower && !this.isPlacing) {
      this.selectedTower = clickedTower;
      this.isPlacing = false;
      return;
    }

    // Placing new tower
    if (this.isPlacing && this.selectedTowerId) {
      if (!this.tileMap.canBuild(tx, ty)) return;
      const def = TOWER_DEFS[this.selectedTowerId];
      if (this.gold < def.cost) return;
      if (this.towers.some(t => t.tx === tx && t.ty === ty && t.alive)) return;
      this.gold -= def.cost;
      const tower = new Tower(this.selectedTowerId, tx, ty);
      this.towers.push(tower);
      // Stay in placement mode — player can keep placing same tower type
      return;
    }

    // Right-click or click away to deselect
    this.selectedTower = null;
  }

  /** Upgrade or sell selected tower */
  upgradeSelected(): boolean {
    if (!this.selectedTower || !this.selectedTower.alive) return false;
    const cost = Math.floor(this.selectedTower.def.upgradeCost * (1 + this.selectedTower.upgrades * 0.5));
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.selectedTower.upgrades++;
    return true;
  }

  sellSelected(): void {
    if (!this.selectedTower || !this.selectedTower.alive) return;
    const refund = Math.floor(this.selectedTower.def.cost * 0.5);
    this.gold += refund;
    this.selectedTower.alive = false;
    this.selectedTower = null;
  }

  private onMouseMove(e: MouseEvent): void {
    this.highlightTile = this.isPlacing ? this.mouseToTile(e) : null;
  }

  private mouseToTile(e: MouseEvent): [number, number] {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    return [
      Math.floor((mx - this.ox) / this.tileSize),
      Math.floor((my - this.oy) / this.tileSize),
    ];
  }

  // ═══════════════════════════════════════════════
  //  RENDERING — Commercial Grade
  // ═══════════════════════════════════════════════

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    const ts = this.tileSize;
    const ox = this.ox;
    const oy = this.oy;

    // Screen shake offset
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 12 : 0;
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake * 12 : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // ── Background ──────────────────────────
    const bgGrad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.7);
    bgGrad.addColorStop(0, '#0a1a2a');
    bgGrad.addColorStop(0.5, '#050d18');
    bgGrad.addColorStop(1, '#020508');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 173 + 47) % 1000) / 1000 * w;
      const sy = ((i * 281 + 91) % 1000) / 1000 * h;
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(this.gameTime * 1.5 + i));
      ctx.globalAlpha = twinkle * 0.6;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // ── Tiles ───────────────────────────────
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tileMap.tiles[y][x];
        const terrain = this.terrain[y][x];
        const px = ox + x * ts;
        const py = oy + y * ts;
        const pad = 1.5;

        // Base color
        let fillColor: string;
        switch (tile.state) {
          case TileState.CLEAN:
            fillColor = terrain === TileTerrain.CRYSTAL ? '#0f3f2f' : terrain === TileTerrain.ROUGH ? '#1f1f1a' : '#0f2a1f';
            break;
          case TileState.CORRUPTED:
            fillColor = '#2a0a2f';
            break;
          case TileState.PURIFIED:
            fillColor = '#2f2f0f';
            break;
        }
        ctx.fillStyle = fillColor;
        ctx.fillRect(px + pad, py + pad, ts - pad*2, ts - pad*2);

        // Grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, ts, ts);

        // Purified border glow
        if (tile.state === TileState.PURIFIED) {
          const pulse = 0.5 + 0.5 * Math.sin(this.gameTime * 2 + x + y);
          ctx.strokeStyle = `rgba(255,220,80,${0.3 + pulse * 0.3})`;
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
        }

        // Corruption veins
        if (tile.state === TileState.CORRUPTED) {
          const veinAlpha = 0.2 + 0.1 * Math.sin(this.gameTime * 3 + x * y);
          ctx.strokeStyle = `rgba(255,0,80,${veinAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + ts*0.25, py + ts*0.5);
          ctx.lineTo(px + ts*0.7, py + ts*0.3);
          ctx.moveTo(px + ts*0.5, py + ts*0.65);
          ctx.lineTo(px + ts*0.2, py + ts*0.75);
          ctx.moveTo(px + ts*0.6, py + ts*0.8);
          ctx.lineTo(px + ts*0.8, py + ts*0.6);
          ctx.stroke();
        }

        // Crystal terrain
        if (terrain === TileTerrain.CRYSTAL && tile.state === TileState.CLEAN) {
          ctx.fillStyle = 'rgba(68,200,255,0.25)';
          ctx.beginPath();
          const cx = px + ts/2, cy = py + ts/3;
          ctx.moveTo(cx, cy - ts*0.2);
          ctx.lineTo(cx + ts*0.15, cy + ts*0.05);
          ctx.lineTo(cx - ts*0.15, cy + ts*0.05);
          ctx.fill();
          ctx.fillStyle = 'rgba(68,200,255,0.15)';
          ctx.fillRect(cx - ts*0.08, cy + ts*0.08, ts*0.16, ts*0.12);
        }

        // Rough terrain
        if (terrain === TileTerrain.ROUGH && tile.state === TileState.CLEAN) {
          ctx.fillStyle = 'rgba(120,100,80,0.3)';
          for (let r = 0; r < 3; r++) {
            ctx.fillRect(
              px + ts*(0.2 + r*0.25), py + ts*0.3,
              ts*0.12, ts*0.1
            );
          }
        }
      }
    }

    // ── Core ─────────────────────────────────
    const coreSize = ts * 1.3;
    const cpx = ox + (GRID_SIZE/2) * ts;
    const cpy = oy + (GRID_SIZE/2) * ts;

    // Core glow layers
    for (let i = 3; i >= 0; i--) {
      const r = coreSize * (0.5 + i * 0.3);
      const alpha = 0.08 - i * 0.015;
      const grad = ctx.createRadialGradient(cpx, cpy, 0, cpx, cpy, r);
      grad.addColorStop(0, `rgba(0,255,136,${alpha * 2})`);
      grad.addColorStop(1, 'rgba(0,255,136,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cpx, cpy, r, 0, Math.PI*2); ctx.fill();
    }

    // Core body
    const corePulse = 1 + Math.sin(this.gameTime * 2) * 0.08;
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20 * corePulse;
    ctx.beginPath();
    ctx.arc(cpx, cpy, coreSize/2 * corePulse, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Core HP
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(ts * 0.35)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${this.coreHp}`, cpx, cpy - coreSize/2 - 4);

    // ── Towers ───────────────────────────────
    for (const tower of this.towers) {
      if (!tower.alive) continue;
      const tpx = ox + (tower.tx + 0.5) * ts;
      const tpy = oy + (tower.ty + 0.5) * ts;
      const size = ts * 0.65;

      if (tower.def.blocks) {
        // Bulwark
        const hpRatio = tower.hp / tower.maxHp;
        ctx.fillStyle = tower.def.color;
        ctx.fillRect(tpx - size*0.55, tpy - size*0.5, size*1.1, size);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(tpx - size*0.55, tpy - size*0.5, size*1.1, size);
        // Shield glow when fresh
        if (hpRatio > 0.5) {
          ctx.strokeStyle = 'rgba(150,200,255,0.5)';
          ctx.lineWidth = 3;
          ctx.strokeRect(tpx - size*0.6, tpy - size*0.55, size*1.2, size*1.1);
        }
        // HP bar
        ctx.fillStyle = hpRatio > 0.5 ? '#4f4' : hpRatio > 0.25 ? '#fa0' : '#f22';
        ctx.fillRect(tpx - size*0.55, tpy - size*0.5 - 5, size*1.1 * hpRatio, 3);
        // Upgrade stars
        this.drawUpgradeStars(ctx, tpx, tpy + size*0.5 + 10, tower.upgrades, size * 0.15);
      } else if (tower.def.cleanses) {
        // Purifier — energy spire
        const pulse = Math.sin(this.gameTime * 3) * 0.2 + 0.8;
        // Base
        ctx.fillStyle = '#1a3355';
        ctx.fillRect(tpx - size*0.25, tpy - size*0.1, size*0.5, size*0.7);
        // Spire
        const grad = ctx.createLinearGradient(tpx, tpy - size*0.5, tpx, tpy + size*0.2);
        grad.addColorStop(0, 'rgba(68,200,255,0.9)');
        grad.addColorStop(1, 'rgba(68,200,255,0.3)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(tpx, tpy - size*0.6);
        ctx.lineTo(tpx + size*0.15, tpy);
        ctx.lineTo(tpx - size*0.15, tpy);
        ctx.fill();
        // Ring
        ctx.strokeStyle = `rgba(68,200,255,${pulse * 0.7})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tpx, tpy - size*0.1, size*0.3, 0, Math.PI*2);
        ctx.stroke();
        this.drawUpgradeStars(ctx, tpx, tpy + size*0.2 + 8, tower.upgrades, size * 0.12);
      } else if (tower.def.id === 'nova') {
        // Nova — floating energy orb
        const pulse = Math.sin(this.gameTime * 2.5) * 0.15 + 0.85;
        const orbGrad = ctx.createRadialGradient(tpx, tpy, 0, tpx, tpy, size*0.4*pulse);
        orbGrad.addColorStop(0, 'rgba(255,170,0,0.9)');
        orbGrad.addColorStop(0.6, 'rgba(255,100,0,0.4)');
        orbGrad.addColorStop(1, 'rgba(255,50,0,0)');
        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(tpx, tpy, size*0.4*pulse, 0, Math.PI*2);
        ctx.fill();
        // Outer ring
        ctx.strokeStyle = `rgba(255,170,0,${0.5 + pulse * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tpx, tpy, size*0.5, 0, Math.PI*2);
        ctx.stroke();
        this.drawUpgradeStars(ctx, tpx, tpy + size*0.3 + 6, tower.upgrades, size * 0.12);
      } else {
        // Lancer — cannon
        ctx.fillStyle = tower.def.color;
        ctx.fillRect(tpx - size*0.3, tpy - size*0.15, size*0.6, size*0.7);
        // Barrel
        ctx.fillStyle = '#444455';
        ctx.fillRect(tpx - size*0.08, tpy - size*0.55, size*0.16, size*0.45);
        // Glow tip
        ctx.fillStyle = 'rgba(255,100,50,0.6)';
        ctx.beginPath();
        ctx.arc(tpx, tpy - size*0.55, size*0.1, 0, Math.PI*2);
        ctx.fill();
        this.drawUpgradeStars(ctx, tpx, tpy + size*0.2 + 8, tower.upgrades, size * 0.12);
      }

      // Selection highlight
      if (this.selectedTower === tower) {
        ctx.strokeStyle = '#ffdd44';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(tpx - size*0.65, tpy - size*0.65, size*1.3, size*1.3);
        ctx.setLineDash([]);
      }
    }

    // ── Enemies ──────────────────────────────
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const [ex, ey] = enemy.getPixelPos(ts, ox, oy);
      const es = ts * 0.35 * enemy.def.size;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(ex, ey + es*0.5, es*0.8, es*0.3, 0, 0, Math.PI*2);
      ctx.fill();

      // Body — different shapes per type
      ctx.fillStyle = enemy.def.color;
      ctx.shadowColor = enemy.def.color;
      ctx.shadowBlur = 6;

      if (enemy.def.id === 'swarm') {
        // Multiple small dots
        for (let i = 0; i < 5; i++) {
          const angle = this.gameTime * 5 + i * 1.2;
          ctx.beginPath();
          ctx.arc(ex + Math.cos(angle)*es*0.6, ey + Math.sin(angle)*es*0.6, es*0.25, 0, Math.PI*2);
          ctx.fill();
        }
      } else if (enemy.def.id === 'carrier') {
        ctx.beginPath();
        ctx.arc(ex, ey, es, 0, Math.PI*2);
        ctx.fill();
        // Pulsing veins
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const a = this.gameTime * 2 + i * 2.1;
          ctx.beginPath();
          ctx.arc(ex, ey, es*0.5, a, a + 1.5);
          ctx.stroke();
        }
      } else if (enemy.def.id === 'stalker') {
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(ex, ey - es);
        ctx.lineTo(ex + es*0.7, ey);
        ctx.lineTo(ex, ey + es);
        ctx.lineTo(ex - es*0.7, ey);
        ctx.closePath();
        ctx.fill();
        // Phase effect
        ctx.globalAlpha = 0.3 + 0.2 * Math.sin(this.gameTime * 6);
        ctx.strokeStyle = enemy.def.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        // Default: circle with eye
        ctx.beginPath();
        ctx.arc(ex, ey, es, 0, Math.PI*2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, ey - es*0.2, es*0.3, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // HP bar (only if damaged)
      if (enemy.hp < enemy.maxHp) {
        const hpRatio = enemy.hp / enemy.maxHp;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(ex - es, ey - es - 6, es*2, 3);
        ctx.fillStyle = hpRatio > 0.5 ? '#4f4' : '#f22';
        ctx.fillRect(ex - es, ey - es - 6, es*2 * hpRatio, 3);
      }
    }

    // ── Particles ────────────────────────────
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Float texts ──────────────────────────
    for (const ft of this.floatTexts) {
      const alpha = ft.life / 1.5;
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${Math.floor(ts*0.3)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    // ── Placement highlight ──────────────────
    if (this.highlightTile && this.selectedTowerId) {
      const [hx, hy] = this.highlightTile;
      const hpx = ox + hx * ts;
      const hpy = oy + hy * ts;
      const canPlace = this.tileMap.canBuild(hx, hy) &&
        this.gold >= (TOWER_DEFS[this.selectedTowerId]?.cost ?? Infinity) &&
        !this.towers.some(t => t.tx === hx && t.ty === hy && t.alive);
      const col = canPlace ? 'rgba(68,255,68,0.4)' : 'rgba(255,68,68,0.4)';
      ctx.fillStyle = col;
      ctx.fillRect(hpx + 1, hpy + 1, ts - 2, ts - 2);
      ctx.strokeStyle = canPlace ? '#44ff44' : '#ff4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(hpx + 1, hpy + 1, ts - 2, ts - 2);
      ctx.setLineDash([]);
    }

    // ── Selected tower info ──────────────────
    if (this.selectedTower && this.selectedTower.alive) {
      const t = this.selectedTower;
      const tpx = ox + (t.tx + 0.5) * ts;
      const tpy = oy + (t.ty + 0.5) * ts;
      // Upgrade button overlay
      const upgCost = Math.floor(t.def.upgradeCost * (1 + t.upgrades * 0.5));
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      const infoW = ts * 2.5;
      const infoH = ts * 1.2;
      const infoX = tpx - infoW/2;
      const infoY = tpy - ts * 1.5;
      ctx.fillRect(infoX, infoY, infoW, infoH);
      ctx.strokeStyle = '#ffdd44';
      ctx.lineWidth = 1;
      ctx.strokeRect(infoX, infoY, infoW, infoH);
      ctx.fillStyle = '#fff';
      ctx.font = `${Math.floor(ts*0.25)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`${t.def.name} Lv.${t.upgrades + 1}`, tpx, infoY + ts*0.35);
      ctx.fillText(`⬆ Upgrade 🪙${upgCost}  |  ↩ Sell 🪙${Math.floor(t.def.cost*0.5)}`, tpx, infoY + ts*0.75);
    }

    // ── Wave prep overlay ────────────────────
    if (this.betweenWaves) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.floor(ts*0.6)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`🌊 Wave ${this.waveNumber} incoming`, w/2, h/2 - ts*0.3);
      ctx.fillStyle = '#ffdd44';
      ctx.font = `${Math.floor(ts*0.8)}px monospace`;
      ctx.fillText(`${Math.ceil(this.wavePrepTimer)}`, w/2, h/2 + ts*0.5);
    }

    ctx.restore();
  }

  private drawUpgradeStars(ctx: CanvasRenderingContext2D, x: number, y: number, count: number, size: number): void {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = '#ffdd44';
      ctx.font = `${Math.floor(size)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('★', x + (i - (count-1)/2) * size * 2, y);
    }
  }

  stop(): void {
    this.isPlaying = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
