<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { TOWER_DEFS } from '$lib/types';

  function startBuild(defId: string) {
    if (gameState.gold >= TOWER_DEFS[defId].cost) {
      gameState.startPlacing(defId);
    }
  }
</script>

{#if gameState.isPlaying || gameState.isPlacing}
  <div class="tower-menu">
    {#if gameState.isPlacing}
      <div class="placement-hint">
        🎯 Click on the planet to place <strong>{TOWER_DEFS[gameState.selectedTowerDefId!]?.name}</strong>
        <button class="btn btn-cancel" onclick={() => gameState.cancelPlacing()}>✕ Cancel</button>
      </div>
    {:else}
      <div class="tower-buttons">
        {#each Object.values(TOWER_DEFS) as tower}
          <button
            class="btn btn-tower"
            class:disabled={gameState.gold < tower.cost}
            disabled={gameState.gold < tower.cost}
            onclick={() => startBuild(tower.id)}
          >
            <span class="tower-name">🚀 {tower.name}</span>
            <span class="tower-cost">🪙{tower.cost}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .tower-menu {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    display: flex;
    justify-content: center;
    z-index: 10;
  }
  .tower-buttons { display: flex; gap: 12px; }
  .btn {
    padding: 10px 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
    color: #ffffff;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-cancel { background: rgba(255, 50, 50, 0.3); border-color: rgba(255, 50, 50, 0.5); }
  .tower-cost { color: #ffd700; font-size: 0.85rem; }
  .placement-hint {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 20px;
    background: rgba(0, 100, 200, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.5);
    border-radius: 12px;
    color: #cceeff;
    backdrop-filter: blur(8px);
  }
</style>
