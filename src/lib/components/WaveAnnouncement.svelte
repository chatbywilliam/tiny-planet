<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';

  let countdown = $derived(Math.ceil(gameState.wavePrepTime));
</script>

{#if gameState.wavePrep}
  <div class="overlay">
    <div class="panel">
      <div class="wave-label">🌊 Wave {gameState.wave}</div>
      <div class="incoming">Incoming meteors detected!</div>
      <div class="countdown">{countdown}</div>
      <div class="hint">🏰 Place towers to defend the planet</div>
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
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 25;
    animation: fadeIn 0.3s ease-out;
  }

  .panel {
    text-align: center;
    animation: scaleIn 0.3s ease-out;
  }

  .wave-label {
    font-size: 1.2rem;
    color: #ffaa44;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .incoming {
    font-size: 1rem;
    color: #ff6666;
    margin-bottom: 16px;
  }

  .countdown {
    font-size: 4rem;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 0 30px rgba(255, 100, 100, 0.6);
    animation: pulse 1s ease-in-out infinite;
  }

  .hint {
    font-size: 0.85rem;
    color: #8888aa;
    margin-top: 12px;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
