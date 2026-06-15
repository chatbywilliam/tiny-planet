import * as THREE from 'three';
import type { TowerDef } from '$lib/types';
import { TOWER_DEFS, PLANET_RADIUS } from '$lib/types';
import type { Enemy } from './Enemy';

let nextId = 1;

export class Tower {
  id: string;
  mesh: THREE.Group;
  rangeRing: THREE.Mesh;
  def: TowerDef;
  position: THREE.Vector3;
  level: number;
  private lastFireTime: number = 0;

  constructor(defId: string, surfacePoint: THREE.Vector3) {
    this.def = TOWER_DEFS[defId];
    this.id = `tower_${nextId++}`;
    this.position = surfacePoint.clone();
    this.level = 1;

    this.mesh = new THREE.Group();

    const baseGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: this.def.color,
      roughness: 0.4,
      metalness: 0.6,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.25;
    this.mesh.add(base);

    const topGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const topMat = new THREE.MeshStandardMaterial({
      color: this.def.color,
      emissive: this.def.color,
      emissiveIntensity: 0.3,
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.55;
    this.mesh.add(top);

    const normal = surfacePoint.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
    this.mesh.setRotationFromQuaternion(quat);
    this.mesh.position.copy(surfacePoint.clone().normalize().multiplyScalar(PLANET_RADIUS));

    const ringGeo = new THREE.TorusGeometry(this.def.range * PLANET_RADIUS, 0.03, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: this.def.color,
      transparent: true,
      opacity: 0.5,
    });
    this.rangeRing = new THREE.Mesh(ringGeo, ringMat);
    this.rangeRing.position.copy(this.mesh.position);
    this.rangeRing.setRotationFromQuaternion(quat);
    this.rangeRing.visible = false;
  }

  findTarget(enemies: Enemy[]): Enemy | null {
    let closest: Enemy | null = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = this.greatCircleDistance(enemy.getPosition());
      const maxRange = this.def.range * PLANET_RADIUS;
      if (dist <= maxRange && dist < closestDist) {
        closestDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  private greatCircleDistance(other: THREE.Vector3): number {
    const a = this.mesh.position.clone().normalize();
    const b = other.clone().normalize();
    const dot = THREE.MathUtils.clamp(a.dot(b), -1, 1);
    return Math.acos(dot) * PLANET_RADIUS;
  }

  canFire(now: number): boolean {
    return (now - this.lastFireTime) >= (1.0 / this.def.fireRate);
  }

  fire(now: number): void {
    this.lastFireTime = now;
  }

  aimAt(target: THREE.Vector3): void {
    const top = this.mesh.children[1];
    if (top) top.lookAt(target);
  }

  showRange(): void {
    this.rangeRing.visible = true;
  }

  hideRange(): void {
    this.rangeRing.visible = false;
  }

  getFirePosition(): THREE.Vector3 {
    return this.mesh.position.clone()
      .add(this.position.clone().normalize().multiplyScalar(0.7));
  }
}
