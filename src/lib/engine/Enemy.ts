import * as THREE from 'three';
import type { EnemyDef } from '$lib/types';
import { ENEMY_DEFS, PLANET_RADIUS, SPACE_SPAWN_RADIUS } from '$lib/types';

let nextId = 1;

export class Enemy {
  id: string;
  mesh: THREE.Group;
  def: EnemyDef;
  hp: number;
  maxHp: number;

  private startPoint: THREE.Vector3;
  private progress: number = 0;
  private speed: number;
  private totalDistance: number;
  alive = true;
  reached = false;

  private hpBar: THREE.Mesh;
  private _animTime = 0;

  constructor(defId: string) {
    this.def = ENEMY_DEFS[defId];
    this.id = `enemy_${nextId++}`;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;

    // Spawn at random direction, SPEHRE_SPAWN_RADIUS away from planet center
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    ).normalize();
    this.startPoint = dir.multiplyScalar(SPACE_SPAWN_RADIUS);

    // Total distance from spawn to planet surface
    this.totalDistance = SPACE_SPAWN_RADIUS - PLANET_RADIUS;
    this.speed = this.def.speed;

    // Visual: alien fighter spaceship
    this.mesh = new THREE.Group();

    const shipColor = this.def.color;
    const accentColor = 0x222244;

    // --- Fuselage (main body) ---
    const bodyGeo = new THREE.BoxGeometry(0.18, 0.12, 0.55);
    const bodyMat = new THREE.MeshLambertMaterial({ color: accentColor });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    this.mesh.add(body);

    // --- Cockpit (glowing dome on top-front) ---
    const cockpitGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const cockpitMat = new THREE.MeshLambertMaterial({
      color: shipColor,
      emissive: shipColor,
      emissiveIntensity: 0.8,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.09, 0.14);
    this.mesh.add(cockpit);

    // --- Wings (swept back) ---
    const wingGeo = new THREE.BoxGeometry(0.04, 0.03, 0.28);
    const wingMat = new THREE.MeshLambertMaterial({ color: accentColor });
    // Left wing
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.13, -0.02, -0.06);
    leftWing.rotation.z = -0.3;
    leftWing.rotation.y = -0.2;
    this.mesh.add(leftWing);
    // Right wing
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.13, -0.02, -0.06);
    rightWing.rotation.z = 0.3;
    rightWing.rotation.y = 0.2;
    this.mesh.add(rightWing);

    // --- Engine exhaust glow (rear) ---
    const engineGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const engineMat = new THREE.MeshBasicMaterial({ color: shipColor });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(0, 0, -0.32);
    engine.scale.set(1, 1, 0.4);
    this.mesh.add(engine);

    // --- Wingtip lights (small emissive dots) ---
    for (const sign of [-1, 1]) {
      const tipGeo = new THREE.SphereGeometry(0.03, 4, 4);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(sign * 0.35, -0.02, -0.12);
      this.mesh.add(tip);
    }

    this.mesh.position.copy(this.startPoint);
    // Point nose toward planet center (enemy flies toward origin)
    this.mesh.lookAt(new THREE.Vector3(0, 0, 0));

    // HP bar above fighter
    const barGeo = new THREE.PlaneGeometry(0.5, 0.06);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    this.hpBar = new THREE.Mesh(barGeo, barMat);
    this.mesh.add(this.hpBar);
    this.hpBar.position.y = 0.22;
  }

  /** Update enemy. Returns false when dead or reached planet. */
  update(dt: number): boolean {
    if (!this.alive) return false;

    this.progress += (this.speed / this.totalDistance) * dt;

    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.reached = true;
      this.alive = false;
      return false;
    }

    // Linear interpolation from spawn to planet center
    const pos = new THREE.Vector3().lerpVectors(
      this.startPoint,
      new THREE.Vector3(0, 0, 0),
      this.progress
    );
    this.mesh.position.copy(pos);

    // Face toward planet center
    this.mesh.lookAt(new THREE.Vector3(0, 0, 0));

    // Update HP bar
    const hpRatio = this.hp / this.maxHp;
    this.hpBar.scale.x = Math.max(0.01, hpRatio);
    (this.hpBar.material as THREE.MeshBasicMaterial).color.setHex(
      hpRatio > 0.5 ? 0x44ff44 : hpRatio > 0.25 ? 0xffaa00 : 0xff2222
    );

    // Animate engine pulse + wingtip blink
    this._animTime += dt;
    const engine = this.mesh.children[4];
    if (engine) {
      const pulse = 0.6 + Math.sin(this._animTime * 8) * 0.4;
      engine.scale.set(1, 1, 0.3 + pulse * 0.3);
    }
    // Wingtip lights blink
    for (let i = 5; i <= 6; i++) {
      const tip = this.mesh.children[i] as THREE.Mesh;
      if (tip?.material) {
        (tip.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(this._animTime * 12 + i) * 0.6;
      }
    }

    return true;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true; // killed
    }
    return false;
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }
}
