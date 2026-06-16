<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';

  // Arrow data is computed from screen positions
  // x,y: position on screen edge (0-1 clamped), angle: rotation of arrow
  interface Arrow {
    x: number;      // 0=left, 1=right edge
    y: number;      // 0=top, 1=bottom edge
    angle: number;  // radians, points toward enemy
    distance: number; // 0=far, 1=close
    side: 'top' | 'bottom' | 'left' | 'right';
  }

  let arrows = $derived.by(() => {
    const result: Arrow[] = [];
    const positions = gameState.enemyScreenPositions;

    for (const pos of positions) {
      // Screen-space: x in [-1, 1], y in [-1, 1]
      // Check if off-screen
      const margin = 0.85; // trigger when enemy is near edge (even if still visible)
      if (Math.abs(pos.x) < margin && Math.abs(pos.y) < margin) continue;

      // Which edge is closest?
      const distLeft = Math.abs(pos.x + 1);
      const distRight = Math.abs(pos.x - 1);
      const distTop = Math.abs(pos.y + 1);
      const distBottom = Math.abs(pos.y - 1);
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      let x: number, y: number, side: Arrow['side'], angle: number;

      if (minDist === distLeft) {
        side = 'left';
        x = 0.02;
        y = (pos.y + 1) / 2; // normalize to 0-1
        y = Math.max(0.08, Math.min(0.92, y));
        angle = Math.PI / 2; // arrow points right
      } else if (minDist === distRight) {
        side = 'right';
        x = 0.98;
        y = (pos.y + 1) / 2;
        y = Math.max(0.08, Math.min(0.92, y));
        angle = -Math.PI / 2; // arrow points left
      } else if (minDist === distTop) {
        side = 'top';
        x = (pos.x + 1) / 2;
        x = Math.max(0.08, Math.min(0.92, x));
        y = 0.02;
        angle = Math.PI; // arrow points down
      } else {
        side = 'bottom';
        x = (pos.x + 1) / 2;
        x = Math.max(0.08, Math.min(0.92, x));
        y = 0.98;
        angle = 0; // arrow points up
      }

      result.push({
        x, y,
        angle,
        distance: pos.distance,
        side,
      });
    }
    return result;
  });
</script>

{#each arrows as arrow (arrow.x + arrow.y + arrow.side)}
  <div
    class="arrow"
    class:top={arrow.side === 'top'}
    class:bottom={arrow.side === 'bottom'}
    class:left={arrow.side === 'left'}
    class:right={arrow.side === 'right'}
    style="
      left: {arrow.x * 100}%;
      top: {arrow.y * 100}%;
      transform: rotate({arrow.angle}rad);
      opacity: {Math.min(1, 0.3 + arrow.distance * 0.7)};
      scale: {0.6 + arrow.distance * 0.8};
    "
  >
    <div class="arrow-body"></div>
    <div class="arrow-head"></div>
    <div class="pulse"></div>
  </div>
{/each}

<style>
  .arrow {
    position: absolute;
    width: 32px;
    height: 32px;
    transform-origin: center center;
    pointer-events: none;
    z-index: 15;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: left 0.15s ease-out, top 0.15s ease-out, opacity 0.2s;
  }

  .arrow-body {
    width: 20px;
    height: 3px;
    background: linear-gradient(90deg, rgba(255,60,60,0.3), rgba(255,60,60,1));
    border-radius: 2px;
    position: absolute;
  }

  .arrow-head {
    width: 0;
    height: 0;
    border-left: 6px solid #ff3333;
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    position: absolute;
    right: -2px;
  }

  .pulse {
    position: absolute;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 50, 50, 0.6);
    animation: pulse 1.5s ease-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(0.6); opacity: 0.8; }
    100% { transform: scale(2); opacity: 0; }
  }

  /* Show a glow on the edge */
  .arrow::before {
    content: '';
    position: absolute;
    width: 40px;
    height: 10px;
    background: radial-gradient(ellipse, rgba(255,40,40,0.4) 0%, transparent 70%);
    border-radius: 50%;
  }
</style>
