<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';

  function restart() {
    gameState.reset();
  }
</script>

{#if gameState.isGameOver}
  <div class="overlay">
    <div class="panel">
      <h2>{gameState.isVictory ? '🎉 Victory!' : '💀 Defeat'}</h2>
      <p>
        {gameState.isVictory
          ? `You defended the Tiny Planet across ${gameState.wave} waves!`
          : `The planet was overrun on wave ${gameState.wave}.`}
      </p>
      <div class="stats">
        <div class="stat">
          <span class="stat-label">Score</span>
          <span class="stat-value">{gameState.score}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Waves Survived</span>
          <span class="stat-value">{gameState.wave}</span>
        </div>
      </div>
      <button class="btn-restart" onclick={restart}>🔄 Play Again</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    z-index: 20;
  }
  .panel {
    background: rgba(20, 20, 50, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
  }
  h2 { font-size: 2rem; margin-bottom: 12px; }
  p { color: #aaaacc; margin-bottom: 24px; }
  .stats { display: flex; gap: 24px; justify-content: center; margin-bottom: 24px; }
  .stat { display: flex; flex-direction: column; }
  .stat-label { font-size: 0.8rem; color: #8888aa; }
  .stat-value { font-size: 1.5rem; font-weight: bold; }
  .btn-restart {
    padding: 12px 32px;
    font-size: 1.1rem;
    background: rgba(68, 170, 68, 0.3);
    border: 1px solid rgba(68, 170, 68, 0.5);
    border-radius: 12px;
    color: #88ff88;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-restart:hover { background: rgba(68, 170, 68, 0.5); }
</style>
