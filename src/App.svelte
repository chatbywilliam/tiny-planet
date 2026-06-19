<script lang="ts">
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import TowerMenu from '$lib/components/TowerMenu.svelte';
  import GameOver from '$lib/components/GameOver.svelte';
</script>

<div class="game-shell">
  <GameCanvas />
  <HUD />
  <TowerMenu />
  <GameOver />
</div>

<style>
  .game-shell {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #050510;
  }
</style>
