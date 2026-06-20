<script lang="ts">
  import { onMount } from 'svelte';
  import { Game } from '$lib/engine/Game';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { gameRef } from '$lib/stores/gameRef';

  let canvasEl: HTMLCanvasElement;

  onMount(() => {
    const game = new Game(canvasEl);
    gameRef.current = game;

    game.onEnemyKilled = (reward: number) => {
      gameState.addGold(reward);
      gameState.addScore(10);
    };
    game.onDamageTaken = () => {
      gameState.syncFromEngine(game.gold, game.coreHp);
      if (game.coreHp <= 0) gameState.endGame(false);
    };
    game.onWaveChange = (wave: number) => gameState.setWave(wave);
    game.onGameEnd = (victory: boolean) => gameState.endGame(victory);

    const sync = setInterval(() => {
      if (!game.isPlaying) { clearInterval(sync); return; }
      gameState.syncFromEngine(game.gold, game.coreHp);
    }, 200);

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (!game.isPlaying) return;
      if (e.key === 'Escape') { game.cancelPlacing(); game.selectedTower = null; }
    });

    game.start();
  });
</script>

<canvas bind:this={canvasEl} class="game-canvas"></canvas>

<style>
  .game-canvas {
    width: 100%;
    height: 100%;
    display: block;
    cursor: crosshair;
  }
</style>
