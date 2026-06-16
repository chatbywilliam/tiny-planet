import * as THREE from 'three';
import type { EnemyDef } from '$lib/types';
import { ENEMY_DEFS, PLANET_RADIUS } from '$lib/types';

let nextId = 1;

export class Enemy {
  id: string;
  mesh: THREE.Mesh;
  def: EnemyDef;
  hp: number;
  maxHp: number;

  private startPoint: THREE.Vector3;
  private endPoint: THREE.Vector3;
  private progress: number = 0;
  private speed: number;
  alive = true;
  reached = false;

  private hpBar: THREE.Mesh;

  constructor(defId: string, startTheta: number, endTheta: number) {
    this.def = ENEMY_DEFS[defId];
    this.id = `enemy_${nextId++}`;
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;

    this.startPoint = new THREE.Vector3(
      PLANET_RADIUS * Math.cos(startTheta),
      0,
      PLANET_RADIUS * Math.sin(startTheta)
    );

    this.endPoint = new THREE.Vector3(
      PLANET_RADIUS * Math.cos(endTheta),
      0,
      PLANET_RADIUS * Math.sin(endTheta)
    );

    this.speed = this.def.speed / Math.PI;

    const geo = new THREE.ConeGeometry(0.25, 0.6, 8, 8);
    const mat = new THREE.MeshLambertMaterial({
      color: this.def.color,
      emissive: this.def.color,
      emissiveIntensity: 0.4,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.startPoint);
    this.mesh.lookAt(new THREE.Vector3(0, 0, 0));

    const barGeo = new THREE.PlaneGeometry(0.5, 0.08);
    const barMat = new THREE.MeshBasicMaterial({ color: 0x44ff44, side: THREE.DoubleSide });
    this.hpBar = new THREE.Mesh(barGeo, barMat);
    this.mesh.add(this.hpBar);
    this.hpBar.position.y = 0.5;
  }

  update(dt: number): boolean {
    if (!this.alive) return false;

    this.progress += this.speed * dt;

    if (this.progress >= 1.0) {
      this.progress = 1.0;
      this.reached = true;
      this.mesh.position.copy(this.endPoint);
      return false;
    }

    const t = this.progress;
    const interp = new THREE.Vector3().lerpVectors(this.startPoint, this.endPoint, t);
    interp.normalize().multiplyScalar(PLANET_RADIUS);

    this.mesh.position.copy(interp);

    const normal = interp.clone().normalize();
    const nextInterp = new THREE.Vector3().lerpVectors(
      this.startPoint, this.endPoint, Math.min(t + 0.01, 1)
    ).normalize().multiplyScalar(PLANET_RADIUS);

    const m4 = new THREE.Matrix4().lookAt(interp, nextInterp, normal);
    const quat = new THREE.Quaternion().setFromRotationMatrix(m4);
    this.mesh.quaternion.copy(quat);

    const hpRatio = this.hp / this.maxHp;
    this.hpBar.scale.x = hpRatio;
    (this.hpBar.material as THREE.MeshBasicMaterial).color.setHex(
      hpRatio > 0.5 ? 0x44ff44 : hpRatio > 0.25 ? 0xffaa00 : 0xff2222
    );

    return true;
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  getProgress(): number {
    return this.progress;
  }
}
