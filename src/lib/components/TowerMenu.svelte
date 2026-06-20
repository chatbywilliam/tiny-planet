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

  function upgrade() {
    if (gameRef.current?.upgradeSelected()) {
      gameState.syncFromEngine(gameRef.current.gold, gameRef.current.coreHp);
    }
  }

  function sell() {
    gameRef.current?.sellSelected();
    if (gameRef.current) gameState.syncFromEngine(gameRef.current.gold, gameRef.current.coreHp);
  }

  let selectedTower = $derived(gameRef.current?.selectedTower ?? null);
  let upgCost = $derived(selectedTower ? Math.floor(selectedTower.def.upgradeCost * (1 + selectedTower.upgrades * 0.5)) : 0);
</script>

{#if !gameState.isGameOver}
  <div class="tower-menu">
    {#if selectedTower}
      <div class="tower-info">
        <span class="info-name">{selectedTower.def.name} Lv.{selectedTower.upgrades + 1}</span>
        <button class="btn btn-upgrade" disabled={gameState.gold < upgCost} onclick={upgrade}>
          ⬆ Upgrade 🪙{upgCost}
        </button>
        <button class="btn btn-sell" onclick={sell}>
          ↩ Sell 🪙{Math.floor(selectedTower.def.cost * 0.5)}
        </button>
        <button class="btn btn-cancel" onclick={() => { if (gameRef.current) gameRef.current.selectedTower = null; }}>✕</button>
      </div>
    {:else if gameState.isPlacing}
      <div class="placement-hint">
        🎯 Click a clean tile
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
    position: fixed;
    bottom: 8px;
    left: 8px;
    right: 8px;
    display: flex;
    justify-content: center;
    z-index: 10;
  }
  .tower-buttons, .tower-info { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; align-items: center; }
  .btn {
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(10, 10, 30, 0.85);
    backdrop-filter: blur(12px);
    color: #fff;
    font-size: 0.75rem;
    cursor: pointer;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.15s;
  }
  .btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); border-color: rgba(255, 255, 255, 0.4); }
  .btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-cancel { background: rgba(255, 50, 50, 0.25); border-color: rgba(255, 50, 50, 0.4); }
  .btn-upgrade { background: rgba(68, 200, 100, 0.2); border-color: rgba(68, 200, 100, 0.4); }
  .btn-sell { background: rgba(255, 170, 50, 0.2); border-color: rgba(255, 170, 50, 0.4); }
  .tower-cost { color: #ffd700; }
  .info-name { color: #ffdd44; font-weight: bold; font-size: 0.85rem; min-width: 80px; }
  .placement-hint {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: rgba(0, 100, 200, 0.4);
    border: 1px solid rgba(100, 180, 255, 0.5);
    border-radius: 10px;
    color: #cceeff;
    backdrop-filter: blur(12px);
  }
</style>
