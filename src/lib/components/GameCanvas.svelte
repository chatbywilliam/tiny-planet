<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { Game } from '$lib/engine/Game';
  import { Planet } from '$lib/engine/Planet';
  import { Tower } from '$lib/engine/Tower';
  import { Projectile } from '$lib/engine/Projectile';
  import { WaveManager } from '$lib/engine/WaveManager';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { ENEMY_DEFS, TOWER_DEFS } from '$lib/types';
  import type { Enemy } from '$lib/engine/Enemy';

  let canvasEl: HTMLCanvasElement;
  let game: Game;
  let planet: Planet;
  let towers: Tower[] = [];
  let enemies: Enemy[] = [];
  let projectiles: Projectile[] = [];
  let waveManager: WaveManager;
  let gameTime: number = 0;
  let raycaster = new THREE.Raycaster();

  onMount(() => {
    game = new Game(canvasEl);
    planet = new Planet();
    game.scene.add(planet.group);
    waveManager = new WaveManager();

    const wave = waveManager.startNextWave();
    if (wave) gameState.setWave(wave.waveNumber);

    game.onUpdate((dt: number) => {
      if (!gameState.isPlaying) return;
      gameTime += dt;
      gameState.fps = game.fps;

      // Update enemies
      for (const enemy of enemies) {
        enemy.update(dt);
        if (enemy.reached) {
          gameState.takeDamage(enemy.def.damage);
          if (gameState.health <= 0) {
            gameState.endGame(false);
          }
        }
      }

      enemies = enemies.filter(e => e.alive && !e.reached);

      // Tower targeting + firing
      for (const tower of towers) {
        const target = tower.findTarget(enemies);
        if (target && tower.canFire(gameTime)) {
          tower.aimAt(target.getPosition());
          tower.fire(gameTime);

          const proj = new Projectile(
            tower.getFirePosition(),
            target,
            3.0,
            tower.def.damage,
            tower.def.color
          );
          projectiles.push(proj);
          game.scene.add(proj.mesh);
        }
      }

      // Update projectiles
      for (const proj of projectiles) {
        proj.update(dt);
      }

      // Clean up dead projectiles, award gold for kills
      const deadProjs = projectiles.filter(p => !p.alive);
      for (const proj of deadProjs) {
        game.scene.remove(proj.mesh);
        if (!proj.target.alive && proj.target.hp <= 0) {
          gameState.addGold(proj.target.def.reward);
          gameState.addScore(10);
        }
      }
      projectiles = projectiles.filter(p => p.alive);

      // Remove killed enemies from scene
      for (const enemy of enemies) {
        if (!enemy.alive) game.scene.remove(enemy.mesh);
      }
      enemies = enemies.filter(e => e.alive);

      // Wave manager
      const newEnemies = waveManager.update(dt, enemies);
      for (const enemy of newEnemies) {
        enemies.push(enemy);
        game.scene.add(enemy.mesh);
      }

      if (waveManager.waveComplete && !waveManager.allWavesComplete) {
        const nextWave = waveManager.startNextWave();
        if (nextWave) gameState.setWave(nextWave.waveNumber);
      }

      if (waveManager.allWavesComplete && enemies.length === 0) {
        gameState.endGame(true);
      }
    });

    // Tower placement via click
    canvasEl.addEventListener('click', (e: MouseEvent) => {
      if (!gameState.isPlacing || !gameState.selectedTowerDefId) return;

      const rect = canvasEl.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, game.camera);
      const intersects = raycaster.intersectObject(planet.mesh);

      if (intersects.length > 0) {
        const surfacePoint = planet.projectToSurface(intersects[0].point);

        if (gameState.spendGold(TOWER_DEFS[gameState.selectedTowerDefId].cost)) {
          const tower = new Tower(gameState.selectedTowerDefId, surfacePoint);
          towers.push(tower);
          game.scene.add(tower.mesh);
          game.scene.add(tower.rangeRing);
        }
        gameState.cancelPlacing();
      }
    });

    game.start();
    gameState.startGame();
  });
</script>

<canvas bind:this={canvasEl} class="game-canvas"></canvas>

<style>
  .game-canvas {
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
  }
</style>
