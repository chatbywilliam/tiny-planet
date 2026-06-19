<script lang="ts">
  import { gameState } from '$lib/stores/gameState.svelte';
  import { TOWER_DEFS } from '$lib/types';
  import { gameRef } from '$lib/stores/gameRef';

  function startBuild(defId: string) {
    if (gameState.gold >= TOWER_DEFS[defId].cost) {
      gameState.startPlacing(defId);
      gameRef.current?.startPlacing(defId);
    }
  }
</script>

{#if !gameState.isGameOver}
  <div class="tower-menu">
    {#if gameState.isPlacing}
      <div class="placement-hint">
        🎯 Click a clean tile to place <strong>{TOWER_DEFS[gameState.selectedTowerDefId!]?.name}</strong>
        <button class="btn btn-cancel" onclick={() => { gameState.cancelPlacing(); gameRef.current?.cancelPlacing(); }}>✕</button>
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
            <span class="tower-name">{tower.name}</span>
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
    padding: 8px 12px;
    display: flex;
    justify-content: center;
    z-index: 10;
  }
  .tower-buttons { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .btn {
    padding: 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    color: #fff;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    min-width: 44px;
  }
  .btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.4);
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-cancel { background: rgba(255, 50, 50, 0.3); border-color: rgba(255, 50, 50, 0.5); }
  .tower-cost { color: #ffd700; font-size: 0.75rem; }
  .placement-hint {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: rgba(0, 100, 200, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.5);
    border-radius: 8px;
    color: #cceeff;
    backdrop-filter: blur(8px);
    font-size: 0.85rem;
  }
</style>
