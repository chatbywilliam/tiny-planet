<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { STARTING_HP, WAVES } from '$lib/types';
</script>

<div class="hud">
  <div class="stat">
    <span class="label">🛡️ Core</span>
    <div class="bar-wrap">
      <div class="bar hp-bar" style="width: {(gameState.health / STARTING_HP) * 100}%"></div>
    </div>
    <span class="value">{gameState.health}/{STARTING_HP}</span>
  </div>

  <div class="stat">
    <span class="label">🪙 Gold</span>
    <span class="value gold">{gameState.gold}</span>
  </div>

  <div class="stat">
    <span class="label">🌊 Wave</span>
    <span class="value">{gameState.wave}/{WAVES.length}</span>
  </div>

  <div class="stat">
    <span class="label">⭐ Score</span>
    <span class="value">{gameState.score}</span>
  </div>
</div>

<style>
  .hud {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    display: flex;
    gap: 12px;
    z-index: 10;
    pointer-events: none;
  }
  .stat {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 4px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #ccc;
  }
  .label { color: #aaa; }
  .value { color: #fff; font-weight: bold; }
  .value.gold { color: #ffd700; }
  .bar-wrap {
    width: 60px;
    height: 8px;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s;
  }
  .hp-bar { background: #00ff88; }
</style>
