<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { STARTING_HP } from '$lib/types';

  function restart() {
    window.location.reload();
  }
</script>

{#if gameState.isGameOver}
  <div class="overlay" class:victory={gameState.isVictory}>
    <div class="card">
      <h1>{gameState.isVictory ? '🏆 Sector Cleared!' : '💀 Core Lost'}</h1>
      <p class="sub">{gameState.isVictory ? 'The Blight has been pushed back.' : 'The nanites overwhelmed the Core.'}</p>
      <div class="stats">
        <div>🌊 Waves survived: <strong>{gameState.wave}/5</strong></div>
        <div>⭐ Score: <strong>{gameState.score}</strong></div>
      </div>
      <button class="btn-restart" onclick={restart}>🔄 Play Again</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }
  .card {
    text-align: center;
    padding: 32px 48px;
    border-radius: 16px;
    background: rgba(20, 20, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
  .victory .card { border-color: rgba(0, 255, 136, 0.4); }
  h1 { margin: 0 0 8px; font-size: 1.5rem; }
  .victory h1 { color: #00ff88; }
  .sub { color: #aaa; margin-bottom: 16px; }
  .stats { color: #ccc; margin-bottom: 20px; line-height: 1.8; }
  .stats strong { color: #fff; }
  .btn-restart {
    padding: 12px 32px;
    border: none;
    border-radius: 10px;
    background: #00ff88;
    color: #000;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    min-height: 48px;
    min-width: 150px;
  }
  .btn-restart:hover { background: #44ffaa; }
</style>
