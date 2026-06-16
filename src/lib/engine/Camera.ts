import * as THREE from 'three';

export class OrbitCamera {
  camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3;
  private spherical: THREE.Spherical;
  private isDragging = false;
  private prevMouse = { x: 0, y: 0 };
  private domElement: HTMLElement;
  private cachedPosition = new THREE.Vector3();

  minDistance = 7;
  maxDistance = 25;
  minPolar = 0.1;
  maxPolar = Math.PI - 0.1;
  rotateSpeed = 0.005;
  zoomSpeed = 0.1;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);

    const offset = camera.position.clone().sub(this.target);
    this.spherical = new THREE.Spherical();
    this.spherical.setFromVector3(offset);

    domElement.addEventListener('pointerdown', this.onPointerDown);
    domElement.addEventListener('pointermove', this.onPointerMove);
    domElement.addEventListener('pointerup', this.onPointerUp);
    domElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  update(): void {
    this.spherical.radius = THREE.MathUtils.clamp(
      this.spherical.radius, this.minDistance, this.maxDistance
    );
    this.spherical.phi = THREE.MathUtils.clamp(
      this.spherical.phi, this.minPolar, this.maxPolar
    );

    const pos = this.cachedPosition.setFromSpherical(this.spherical).add(this.target);
    this.camera.position.copy(pos);
    this.camera.lookAt(this.target);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.prevMouse.x = e.clientX;
    this.prevMouse.y = e.clientY;
    this.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.prevMouse.x;
    const dy = e.clientY - this.prevMouse.y;

    this.spherical.theta -= dx * this.rotateSpeed;
    this.spherical.phi -= dy * this.rotateSpeed;

    this.prevMouse.x = e.clientX;
    this.prevMouse.y = e.clientY;
  };

  private onPointerUp = (e: PointerEvent): void => {
    this.isDragging = false;
    this.domElement.releasePointerCapture(e.pointerId);
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.spherical.radius += e.deltaY * 0.01 * this.zoomSpeed;
  };

  dispose(): void {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}
