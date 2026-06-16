import * as THREE from 'three';
import { OrbitCamera } from './Camera';

export class Game {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  orbitCamera: OrbitCamera;
  private clock: THREE.Clock;
  private animationId: number = 0;
  private updateCallbacks: Array<(dt: number) => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050518);
    this.scene.fog = new THREE.Fog(0x050518, 20, 60);

    this.camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(8, 5, 12);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambient = new THREE.AmbientLight(0x445577, 2.0);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffeedd, 2.5);
    sun.position.set(15, 20, 10);
    this.scene.add(sun);

    this.createStarfield();

    this.orbitCamera = new OrbitCamera(this.camera, canvas);
    this.onUpdate(() => this.orbitCamera.update());

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onResize);
  }

  private createStarfield(): void {
    const stars = new THREE.BufferGeometry();
    const count = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    stars.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 });
    this.scene.add(new THREE.Points(stars, mat));
  }

  private onResize = (): void => {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  };

  onUpdate(fn: (dt: number) => void): void {
    this.updateCallbacks.push(fn);
  }

  start(): void {
    this.clock.start();
    const loop = (): void => {
      this.animationId = requestAnimationFrame(loop);
      const dt = Math.min(this.clock.getDelta(), 0.1);
      for (const cb of this.updateCallbacks) {
        cb(dt);
      }
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
    this.clock.stop();
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.orbitCamera.dispose();
    this.renderer.dispose();
  }
}
