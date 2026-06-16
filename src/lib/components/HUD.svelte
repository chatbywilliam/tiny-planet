<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';

  let healthPct = $derived((gameState.health / gameState.maxHealth) * 100);
  let healthColor = $derived(
    healthPct > 50 ? '#44ff44' : healthPct > 25 ? '#ffaa00' : '#ff2222'
  );
</script>

<div class="hud">
  <div class="hud-row">
    <div class="hud-item">
      <span class="label">❤️ HP</span>
      <div class="bar-bg">
        <div class="bar-fill" style="width: {healthPct}%; background: {healthColor};"></div>
      </div>
      <span class="value">{gameState.health}/{gameState.maxHealth}</span>
    </div>
    <div class="hud-item">
      <span class="label">🪙 Gold</span>
      <span class="value gold">{gameState.gold}</span>
    </div>
  </div>
  <div class="hud-row">
    <div class="hud-item">
      <span class="label">🌊 Wave</span>
      <span class="value">{gameState.wave}</span>
    </div>
    <div class="hud-item">
      <span class="label">⭐ Score</span>
      <span class="value">{gameState.score}</span>
    </div>
  </div>
  <div class="fps-display">
    ⚡ {gameState.fps || '...'} FPS
  </div>
</div>

<style>
  .hud {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
    z-index: 10;
  }
  .hud-row { display: flex; gap: 20px; }
  .hud-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 6px 12px;
  }
  .label { font-size: 0.85rem; color: #aaaaaa; }
  .value {
    font-size: 1rem;
    font-weight: bold;
    color: #ffffff;
    font-variant-numeric: tabular-nums;
  }
  .value.gold { color: #ffd700; }
  .fps-display {
    text-align: center;
    font-size: 1.6rem;
    font-weight: bold;
    color: #44ff44;
    padding: 4px 0 0 0;
  }
  .bar-bg {
    width: 120px;
    height: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s ease;
  }
  .version-tag {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font-size: 0.65rem;
    color: #666666;
    pointer-events: auto;
  }
</style>
