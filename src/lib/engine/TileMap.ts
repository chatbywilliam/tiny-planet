import { TileState, GRID_SIZE } from '$lib/types';

export interface Tile {
  state: TileState;
  purifiedTimer: number;  // seconds remaining
}

export class TileMap {
  tiles: Tile[][] = [];
  private spreadTimer = 0;
  private spreadInterval = 8; // seconds between corruption spread checks

  constructor() {
    this.reset();
  }

  reset(): void {
    this.tiles = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.tiles[y][x] = { state: TileState.CLEAN, purifiedTimer: 0 };
      }
    }
    this.spreadTimer = 0;
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
  }

  getTile(x: number, y: number): Tile | null {
    if (!this.isInBounds(x, y)) return null;
    return this.tiles[y][x];
  }

  corrupt(x: number, y: number): void {
    const tile = this.getTile(x, y);
    if (tile && tile.state === TileState.CLEAN) {
      tile.state = TileState.CORRUPTED;
    }
  }

  corruptArea(cx: number, cy: number, radius: number): void {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (this.isInBounds(x, y)) {
          this.corrupt(x, y);
        }
      }
    }
  }

  cleanse(x: number, y: number): void {
    const tile = this.getTile(x, y);
    if (tile && tile.state === TileState.CORRUPTED) {
      tile.state = TileState.PURIFIED;
      tile.purifiedTimer = 30; // 30 seconds immunity
    }
  }

  canBuild(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return tile.state === TileState.CLEAN || tile.state === TileState.PURIFIED;
  }

  /** Spread corruption to random adjacent clean tiles */
  update(dt: number): number {
    // Update purified timers
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = this.tiles[y][x];
        if (tile.state === TileState.PURIFIED) {
          tile.purifiedTimer -= dt;
          if (tile.purifiedTimer <= 0) {
            tile.state = TileState.CLEAN;
          }
        }
      }
    }

    // Corruption spread
    this.spreadTimer += dt;
    if (this.spreadTimer < this.spreadInterval) return 0;
    this.spreadTimer = 0;

    let spreadCount = 0;
    const toCorrupt: [number, number][] = [];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.tiles[y][x].state !== TileState.CORRUPTED) continue;
        // Try to spread to random clean neighbor
        const neighbors = this.getNeighborCoords(x, y).filter(
          ([nx, ny]) => {
            const nt = this.getTile(nx, ny);
            return nt && nt.state === TileState.CLEAN;
          }
        );
        if (neighbors.length > 0 && Math.random() < 0.3) {
          const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
          toCorrupt.push([nx, ny]);
        }
      }
    }

    for (const [x, y] of toCorrupt) {
      this.corrupt(x, y);
      spreadCount++;
    }
    return spreadCount;
  }

  private getNeighborCoords(x: number, y: number): [number, number][] {
    const dirs: [number, number][] = [[0,-1],[1,0],[0,1],[-1,0]];
    return dirs
      .map(([dx, dy]) => [x + dx, y + dy] as [number, number])
      .filter(([nx, ny]) => this.isInBounds(nx, ny));
  }

  getCorruptedCount(): number {
    let count = 0;
    for (let y = 0; y < GRID_SIZE; y++)
      for (let x = 0; x < GRID_SIZE; x++)
        if (this.tiles[y][x].state === TileState.CORRUPTED) count++;
    return count;
  }
}
