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

    // Visual: rocky asteroid group
    this.mesh = new THREE.Group();

    // --- Main asteroid body: randomized icosahedron ---
    const baseGeo = new THREE.IcosahedronGeometry(0.45, 1);
    const positions = baseGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const jitter = 0.85 + Math.random() * 0.3;
      positions.setXYZ(i, x * jitter, y * jitter, z * jitter);
    }
    baseGeo.computeVertexNormals();
    const bodyMat = new THREE.MeshLambertMaterial({
      color: this.def.color,
      emissive: this.def.color,
      emissiveIntensity: 0.3,
    });
    const body = new THREE.Mesh(baseGeo, bodyMat);
    this.mesh.add(body);

    // --- Glow ring ---
    const ringGeo = new THREE.TorusGeometry(0.55, 0.06, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.def.color,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    this.mesh.add(ring);

    // --- Small orbiting debris ---
    for (let i = 0; i < 3; i++) {
      const chipGeo = new THREE.IcosahedronGeometry(0.1, 0);
      const chip = new THREE.Mesh(chipGeo, bodyMat);
      chip.position.set(
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.7,
        (Math.random() - 0.5) * 0.7
      );
      chip.userData = {
        orbitOffset: chip.position.clone(),
        orbitSpeed: 1.5 + Math.random() * 3,
        orbitPhase: Math.random() * Math.PI * 2,
      };
      this.mesh.add(chip);
    }

    this.mesh.position.copy(this.startPoint);
    // Point toward planet center
    this.mesh.lookAt(new THREE.Vector3(0, 0, 0));

    // HP bar above enemy
    const barGeo = new THREE.PlaneGeometry(0.6, 0.08);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    this.hpBar = new THREE.Mesh(barGeo, barMat);
    this.mesh.add(this.hpBar);
    this.hpBar.position.y = 0.8;
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

    // Animate orbiting debris + body spin
    this.mesh.children.forEach((child) => {
      if (child.userData?.orbitOffset) {
        child.userData.orbitPhase += child.userData.orbitSpeed * dt;
        const phase = child.userData.orbitPhase;
        const off = child.userData.orbitOffset as THREE.Vector3;
        child.position.set(
          off.x * Math.cos(phase),
          off.y,
          off.z * Math.sin(phase)
        );
      }
    });
    // Slow tumble for main body (first child)
    const body = this.mesh.children[0];
    if (body) {
      body.rotation.x += 0.5 * dt;
      body.rotation.y += 0.7 * dt;
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
