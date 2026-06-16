<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { Game } from '$lib/engine/Game';
  import { Planet } from '$lib/engine/Planet';
  import { Tower } from '$lib/engine/Tower';
  import { Projectile } from '$lib/engine/Projectile';
  import { WaveManager } from '$lib/engine/WaveManager';
  import { gameState } from '$lib/stores/gameState.svelte';
  import { ENEMY_DEFS, TOWER_DEFS, PLANET_RADIUS } from '$lib/types';
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

  // Threat dots on planet surface
  let threatDots: THREE.Mesh[] = [];

  function createThreatDot(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(0.15, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.8,
    });
    const dot = new THREE.Mesh(geo, mat);
    dot.visible = false;
    game.scene.add(dot);
    return dot;
  }

  function updateThreatDots() {
    // Ensure we have enough dots
    while (threatDots.length < enemies.length) {
      threatDots.push(createThreatDot());
    }

    const enemyPositions: { x: number; y: number; distance: number }[] = [];

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.alive) {
        if (i < threatDots.length) threatDots[i].visible = false;
        continue;
      }

      const enemyPos = enemy.getPosition();
      const distToCenter = enemyPos.length();

      // Project enemy position onto planet surface
      const surfacePoint = enemyPos.clone().normalize().multiplyScalar(PLANET_RADIUS + 0.15);

      if (i < threatDots.length) {
        threatDots[i].position.copy(surfacePoint);
        threatDots[i].visible = true;
        // Pulse effect based on proximity
        const proximity = 1 - (distToCenter - PLANET_RADIUS) / 30;
        (threatDots[i].material as THREE.MeshBasicMaterial).opacity = 0.3 + proximity * 0.7;
        const scale = 0.6 + proximity * 1.4;
        threatDots[i].scale.setScalar(scale);
      }

      // Project to screen space for threat arrows
      const screenPos = enemyPos.clone().project(game.camera);
      enemyPositions.push({
        x: screenPos.x,
        y: -screenPos.y, // flip Y for CSS
        distance: Math.max(0, Math.min(1, 1 - (distToCenter - PLANET_RADIUS) / 30)),
      });
    }

    // Hide unused dots
    for (let i = enemies.length; i < threatDots.length; i++) {
      threatDots[i].visible = false;
    }

    gameState.enemyScreenPositions = enemyPositions;
  }

  onMount(() => {
    game = new Game(canvasEl);
    planet = new Planet();
    game.scene.add(planet.group);
    waveManager = new WaveManager();

    game.onUpdate((dt: number) => {
      if (!gameState.isPlaying) return;

      // Wave prep countdown
      if (gameState.wavePrep) {
        gameState.wavePrepTime -= dt;
        if (gameState.wavePrepTime <= 0) {
          gameState.wavePrep = false;
          gameState.wavePrepTime = 0;
          // Start spawning
          const wave = waveManager.startNextWave();
          if (wave) gameState.setWave(wave.waveNumber);
        }
        // Still run visual updates during prep
        updateThreatDots();
        return;
      }

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
            8.0,
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

      // Remove killed enemies
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
        // Start prep for next wave
        gameState.wavePrep = true;
        gameState.wavePrepTime = 4.0;
        gameState.setWave(waveManager.getCurrentWaveNumber());

        // Clear enemy screen positions during prep
        gameState.enemyScreenPositions = [];
      }

      if (waveManager.allWavesComplete && enemies.length === 0 && projectiles.length === 0) {
        gameState.endGame(true);
      }

      // Update threat dots
      updateThreatDots();
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

    // Start first wave prep AFTER startGame() to avoid reset
    game.start();
    gameState.startGame();
    gameState.setWave(waveManager.getCurrentWaveNumber());
    gameState.wavePrep = true;
    gameState.wavePrepTime = 4.0;
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
