import * as THREE from 'three';
import { sound } from './audio';

export class KnifeViewModel {
  public group: THREE.Group;
  public isSwinging: boolean = false;
  private swingProgress: number = 0;
  private restPos = new THREE.Vector3(0.35, -0.32, -0.55);
  private restRot = new THREE.Euler(0.2, -0.4, 0.1);

  constructor() {
    this.group = new THREE.Group();
    this.buildKnifeModel();
    this.group.position.copy(this.restPos);
    this.group.rotation.copy(this.restRot);
    this.group.visible = false;
  }

  private buildKnifeModel() {
    // 1. Blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.06, 0.45);
    bladeShape.lineTo(0.0, 0.58);
    bladeShape.lineTo(-0.04, 0.42);
    bladeShape.lineTo(-0.04, 0);
    bladeShape.closePath();

    const extrudeSettings = {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
    };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.95,
      roughness: 0.1,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 0, 0);
    blade.rotation.z = -Math.PI / 8;
    this.group.add(blade);

    // 2. Bolster / Guard
    const bolsterGeo = new THREE.BoxGeometry(0.1, 0.03, 0.02);
    const bolsterMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2,
    });
    const bolster = new THREE.Mesh(bolsterGeo, bolsterMat);
    bolster.position.set(0, -0.015, 0.003);
    this.group.add(bolster);

    // 3. Ergonomic Wood/Composite Handle
    const handleGeo = new THREE.CylinderGeometry(0.028, 0.032, 0.26, 8);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.7,
      metalness: 0.1,
    });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(0, -0.15, 0.003);
    this.group.add(handle);

    // Brass rivets in handle
    const rivetGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.032, 6);
    const rivetMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 });
    const r1 = new THREE.Mesh(rivetGeo, rivetMat);
    r1.rotation.x = Math.PI / 2;
    r1.position.set(0, -0.1, 0.003);
    this.group.add(r1);

    const r2 = new THREE.Mesh(rivetGeo, rivetMat);
    r2.rotation.x = Math.PI / 2;
    r2.position.set(0, -0.2, 0.003);
    this.group.add(r2);
  }

  public swing(): boolean {
    if (this.isSwinging || !this.group.visible) return false;
    this.isSwinging = true;
    this.swingProgress = 0;
    sound.playKnifeSwing();
    return true;
  }

  public update(delta: number, isMoving: boolean) {
    if (!this.group.visible) return;

    if (this.isSwinging) {
      this.swingProgress += delta * 4.8; // Fast snappy slash
      const p = this.swingProgress;

      if (p <= 1.0) {
        // Slash curve: pull back then slash across
        const slashPhase = Math.sin(p * Math.PI);
        this.group.position.x = this.restPos.x - slashPhase * 0.25;
        this.group.position.y = this.restPos.y + slashPhase * 0.18;
        this.group.position.z = this.restPos.z - slashPhase * 0.2;

        this.group.rotation.x = this.restRot.x - slashPhase * 0.8;
        this.group.rotation.y = this.restRot.y - slashPhase * 1.2;
        this.group.rotation.z = this.restRot.z + slashPhase * 1.5;
      } else {
        this.isSwinging = false;
        this.group.position.copy(this.restPos);
        this.group.rotation.copy(this.restRot);
      }
    } else {
      // Idle breathing & movement bobbing
      const time = Date.now() * 0.004;
      const bobFreq = isMoving ? 8.0 : 2.0;
      const bobAmp = isMoving ? 0.025 : 0.008;

      this.group.position.x = this.restPos.x + Math.sin(time * (bobFreq * 0.5)) * bobAmp;
      this.group.position.y = this.restPos.y + Math.abs(Math.sin(time * bobFreq)) * bobAmp;
      this.group.position.z = this.restPos.z;
    }
  }
}
