<script lang="ts">
  import GameCanvas from '$lib/components/GameCanvas.svelte';
  import HUD from '$lib/components/HUD.svelte';
  import TowerMenu from '$lib/components/TowerMenu.svelte';
  import GameOver from '$lib/components/GameOver.svelte';
  import ThreatArrows from '$lib/components/ThreatArrows.svelte';
  import WaveAnnouncement from '$lib/components/WaveAnnouncement.svelte';
</script>

<div class="game-shell">
  <GameCanvas />
  <HUD />
  <ThreatArrows />
  <TowerMenu />
  <GameOver />
  <WaveAnnouncement />
</div>

<style>
  .game-shell {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
