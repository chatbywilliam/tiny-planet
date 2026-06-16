import * as THREE from 'three';
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
    this.startPos = startPos.clone();

    const geo = new THREE.SphereGeometry(0.1, 6, 6);
    const mat = new THREE.MeshLambertMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.9,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.startPos);
  }

  /** Fly straight toward target in 3D space. Returns false when dead. */
  update(dt: number): boolean {
    if (!this.alive || !this.target.alive) {
      this.alive = false;
      return false;
    }

    const targetPos = this.target.getPosition();
    const dist = this.mesh.position.distanceTo(targetPos);
    const moveStep = this.speed * dt;

    if (moveStep >= dist) {
      // Hit!
      this.target.takeDamage(this.damage);
      this.alive = false;
      return false;
    }

    // Move toward target in straight line
    const dir = targetPos.clone().sub(this.mesh.position).normalize();
    this.mesh.position.add(dir.multiplyScalar(moveStep));

    return true;
  }
}
