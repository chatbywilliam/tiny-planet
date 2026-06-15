import * as THREE from 'three';
import { PLANET_RADIUS } from '$lib/types';
import type { Enemy } from './Enemy';

let nextId = 1;

export class Projectile {
  id: string;
  mesh: THREE.Mesh;
  target: Enemy;
  private startPos: THREE.Vector3;
  private speed: number;
  private damage: number;
  private progress: number = 0;
  alive: boolean = true;

  constructor(
    startPos: THREE.Vector3,
    target: Enemy,
    speed: number,
    damage: number,
    color: number
  ) {
    this.id = `proj_${nextId++}`;
    this.target = target;
    this.speed = speed;
    this.damage = damage;

    this.startPos = startPos.clone().normalize().multiplyScalar(PLANET_RADIUS + 0.3);

    const geo = new THREE.SphereGeometry(0.08, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.startPos);
  }

  update(dt: number): boolean {
    if (!this.alive || !this.target.alive) {
      this.alive = false;
      return false;
    }

    this.progress += this.speed * dt;

    const targetPos = this.target.getPosition().clone()
      .normalize().multiplyScalar(PLANET_RADIUS + 0.3);

    const t = Math.min(this.progress, 1.0);
    const interp = new THREE.Vector3().lerpVectors(this.startPos, targetPos, t);
    const arcHeight = Math.sin(t * Math.PI) * 1.5;
    interp.normalize().multiplyScalar(PLANET_RADIUS + 0.3 + arcHeight);

    this.mesh.position.copy(interp);

    if (t >= 1.0 || this.mesh.position.distanceTo(targetPos) < 0.4) {
      this.target.takeDamage(this.damage);
      this.alive = false;
      return false;
    }

    return true;
  }
}
