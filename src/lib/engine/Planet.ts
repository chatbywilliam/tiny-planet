import * as THREE from 'three';
import { PLANET_RADIUS, CORE_RADIUS } from '$lib/types';

export class Planet {
  mesh: THREE.Mesh;
  core: THREE.Mesh;
  group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    const surfaceGeo = new THREE.SphereGeometry(PLANET_RADIUS, 64, 64);
    const texture = this.generateTexture();
    const surfaceMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.mesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group.add(this.mesh);

    const wireGeo = new THREE.SphereGeometry(PLANET_RADIUS + 0.02, 32, 32);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x334455,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    this.group.add(new THREE.Mesh(wireGeo, wireMat));

    const coreGeo = new THREE.SphereGeometry(CORE_RADIUS, 32, 32);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      emissive: 0x2288cc,
      emissiveIntensity: 0.8,
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.group.add(this.core);

    const ringGeo = new THREE.TorusGeometry(CORE_RADIUS * 1.8, 0.05, 16, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    this.group.add(ring);
  }

  private generateTexture(): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#4a8c3f');
    gradient.addColorStop(0.3, '#3d7a35');
    gradient.addColorStop(0.6, '#2d5a28');
    gradient.addColorStop(0.8, '#1a3a6c');
    gradient.addColorStop(1, '#0a1a4a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random() * 3 + 1;
      ctx.fillStyle = Math.random() > 0.5 ? '#5a9a4a' : '#1a3060';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapU = THREE.RepeatWrapping;
    return texture;
  }

  getSurfacePoint(theta: number, phi: number): THREE.Vector3 {
    return new THREE.Vector3(
      PLANET_RADIUS * Math.sin(phi) * Math.cos(theta),
      PLANET_RADIUS * Math.cos(phi),
      PLANET_RADIUS * Math.sin(phi) * Math.sin(theta)
    );
  }

  projectToSurface(point: THREE.Vector3): THREE.Vector3 {
    return point.clone().normalize().multiplyScalar(PLANET_RADIUS);
  }

  getNormal(surfacePoint: THREE.Vector3): THREE.Vector3 {
    return surfacePoint.clone().normalize();
  }
}
