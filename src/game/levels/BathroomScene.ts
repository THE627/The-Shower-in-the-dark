import * as THREE from 'three';
import { createTileTexture, createWallTileTexture, createResumeTexture } from '../textures';

export interface CollidableObject {
  box: THREE.Box3;
  type: 'floor' | 'wall' | 'furniture';
  height: number;
}

export class BathroomScene {
  public group: THREE.Group;
  public collidables: CollidableObject[] = [];
  public showerValveMesh: THREE.Mesh;
  public knifeMesh: THREE.Group | null = null;
  public grassGroup: THREE.Group;
  public showerParticles: THREE.Points;
  public laserLine: THREE.Line;
  public jobApplicationMesh: THREE.Mesh;
  public exitDoorGroup: THREE.Group;
  public ceilingLight: THREE.PointLight;

  constructor() {
    this.group = new THREE.Group();

    // 1. Room Shell (10m x 10m x 4m)
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createTileTexture(),
      roughness: 0.25,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(10, 10);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x1f2429,
      roughness: 0.9,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.position.y = 4.0;
    ceiling.rotation.x = Math.PI / 2;
    this.group.add(ceiling);

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: createWallTileTexture(),
      roughness: 0.4,
      metalness: 0.05,
    });

    const createWall = (w: number, h: number, x: number, y: number, z: number, ry: number) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, y, z);
      mesh.rotation.y = ry;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    };

    createWall(10, 4, 0, 2, -5, 0); // North
    createWall(10, 4, 0, 2, 5, Math.PI); // South
    createWall(10, 4, -5, 2, 0, Math.PI / 2); // West
    createWall(10, 4, 5, 2, 0, -Math.PI / 2); // East

    // 2. Lighting
    this.ceilingLight = new THREE.PointLight(0xffeedd, 1.2, 12);
    this.ceilingLight.position.set(0, 3.8, 0);
    this.ceilingLight.castShadow = true;
    this.group.add(this.ceilingLight);

    const fixtureGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(0, 3.96, 0);
    this.group.add(fixture);

    // 3. Shower Stall (Corner: x: 2.2 to 4.8, z: -4.8 to -2.2)
    // Shower Base / Curb
    const curbGeo = new THREE.BoxGeometry(2.6, 0.15, 2.6);
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.2 });
    const curb = new THREE.Mesh(curbGeo, curbMat);
    curb.position.set(3.6, 0.075, -3.6);
    this.group.add(curb);

    // Frosted Glass Panels
    const glassGeo = new THREE.BoxGeometry(0.04, 2.8, 2.6);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      transparent: true,
      opacity: 0.38,
      roughness: 0.45,
      metalness: 0.1,
      transmission: 0.85,
    });
    const glassPanel = new THREE.Mesh(glassGeo, glassMat);
    glassPanel.position.set(2.3, 1.4, -3.6);
    this.group.add(glassPanel);

    // Shower Head & Pipe
    const pipeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.6);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.95, roughness: 0.15 });
    const pipe = new THREE.Mesh(pipeGeo, chromeMat);
    pipe.position.set(3.6, 3.2, -4.7);
    pipe.rotation.x = Math.PI / 3;
    this.group.add(pipe);

    const headGeo = new THREE.ConeGeometry(0.12, 0.08, 16);
    const head = new THREE.Mesh(headGeo, chromeMat);
    head.position.set(3.6, 3.0, -4.4);
    head.rotation.x = Math.PI / 4;
    this.group.add(head);

    // Shower Valve (Interactive)
    const valveBaseGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16);
    const valveBase = new THREE.Mesh(valveBaseGeo, chromeMat);
    valveBase.rotation.x = Math.PI / 2;
    valveBase.position.set(3.6, 1.4, -4.95);
    this.group.add(valveBase);

    const valveHandleGeo = new THREE.BoxGeometry(0.18, 0.04, 0.04);
    this.showerValveMesh = new THREE.Mesh(valveHandleGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.7 }));
    this.showerValveMesh.position.set(3.6, 1.4, -4.9);
    this.group.add(this.showerValveMesh);

    // 4. Porcelain Toilet (vanity & toilet serve as platforms to escape grass!)
    const toiletGroup = new THREE.Group();
    toiletGroup.position.set(-3.6, 0, -4.2);

    // Base
    const tBaseGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.45, 16);
    const porcelainMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.1, metalness: 0.05 });
    const tBase = new THREE.Mesh(tBaseGeo, porcelainMat);
    tBase.position.y = 0.225;
    toiletGroup.add(tBase);

    // Bowl / Seat
    const bowlGeo = new THREE.BoxGeometry(0.65, 0.12, 0.85);
    const bowl = new THREE.Mesh(bowlGeo, porcelainMat);
    bowl.position.set(0, 0.45, 0.1);
    toiletGroup.add(bowl);

    // Tank
    const tankGeo = new THREE.BoxGeometry(0.7, 0.55, 0.35);
    const tank = new THREE.Mesh(tankGeo, porcelainMat);
    tank.position.set(0, 0.725, -0.2);
    toiletGroup.add(tank);

    this.group.add(toiletGroup);

    // Add toilet collision (safe height ~ 0.55)
    this.collidables.push({
      box: new THREE.Box3(new THREE.Vector3(-4.1, 0, -4.7), new THREE.Vector3(-3.1, 0.9, -3.6)),
      type: 'furniture',
      height: 0.55,
    });

    // 5. Vanity Counter & Sink
    const vanityGroup = new THREE.Group();
    vanityGroup.position.set(-3.5, 0, 1.5);

    // Cabinet
    const cabinetGeo = new THREE.BoxGeometry(1.4, 0.9, 2.4);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x2b1d16, roughness: 0.7 });
    const cabinet = new THREE.Mesh(cabinetGeo, woodMat);
    cabinet.position.y = 0.45;
    cabinet.castShadow = true;
    vanityGroup.add(cabinet);

    // Marble Top
    const marbleGeo = new THREE.BoxGeometry(1.5, 0.08, 2.5);
    const marbleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.15 });
    const marble = new THREE.Mesh(marbleGeo, marbleMat);
    marble.position.y = 0.94;
    vanityGroup.add(marble);

    // Mirror on the wall
    const mirrorGeo = new THREE.BoxGeometry(0.04, 1.5, 2.2);
    const mirrorMat = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      roughness: 0.05,
      metalness: 0.9,
    });
    const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
    mirror.position.set(-1.42, 2.2, 0);
    vanityGroup.add(mirror);

    this.group.add(vanityGroup);

    // Vanity collision (safe height ~ 0.98)
    this.collidables.push({
      box: new THREE.Box3(new THREE.Vector3(-4.3, 0, 0.2), new THREE.Vector3(-2.7, 1.0, 2.8)),
      type: 'furniture',
      height: 0.98,
    });

    // 6. Chef's Knife on Floor
    this.knifeMesh = this.buildWorldKnife();
    this.knifeMesh.position.set(0.5, 0.05, -1.0);
    this.knifeMesh.rotation.y = 0.6;
    this.group.add(this.knifeMesh);

    // 7. Grass Hazard Group (Initially scaled to 0.01)
    this.grassGroup = new THREE.Group();
    this.buildGrassPatches();
    this.grassGroup.scale.set(1, 0.01, 1);
    this.group.add(this.grassGroup);

    // 8. Shower Water Mist Particles
    this.showerParticles = this.buildShowerParticles();
    this.group.add(this.showerParticles);

    // 9. Laser Indicator Line (Pulsing Red)
    const laserMat = new THREE.LineBasicMaterial({ color: 0xff0044, linewidth: 3 });
    const laserPoints = [new THREE.Vector3(0, 1.2, -4.9), new THREE.Vector3(0, 1.2, 4.9)];
    const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPoints);
    this.laserLine = new THREE.Line(laserGeo, laserMat);
    this.laserLine.visible = false;
    this.group.add(this.laserLine);

    // 10. J*b Application Threat Mesh (Big floating resume)
    const resumeGeo = new THREE.PlaneGeometry(1.2, 1.6);
    const resumeMat = new THREE.MeshStandardMaterial({
      map: createResumeTexture(),
      side: THREE.DoubleSide,
      roughness: 0.3,
    });
    this.jobApplicationMesh = new THREE.Mesh(resumeGeo, resumeMat);
    this.jobApplicationMesh.visible = false;
    this.group.add(this.jobApplicationMesh);

    // 11. Exit Door to Level 2
    this.exitDoorGroup = this.buildExitDoor();
    this.exitDoorGroup.position.set(0, 0, 4.95);
    this.group.add(this.exitDoorGroup);
  }

  private buildWorldKnife(): THREE.Group {
    const knife = new THREE.Group();

    // Blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.04, 0.5);
    bladeShape.lineTo(0.0, 0.6);
    bladeShape.lineTo(-0.03, 0.45);
    bladeShape.lineTo(-0.03, 0);
    bladeShape.closePath();

    const extrudeSettings = { depth: 0.008, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003 };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.98,
      roughness: 0.15,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.rotation.z = Math.PI / 2;
    blade.position.set(0.1, 0, 0);
    knife.add(blade);

    // Handle
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.28, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1e1e24, roughness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.14, 0, 0);
    knife.add(handle);

    // Subtle golden glow beacon
    const glowGeo = new THREE.RingGeometry(0.15, 0.3, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(glowGeo, glowMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    knife.add(ring);

    return knife;
  }

  private buildGrassPatches() {
    const bladeGeo = new THREE.ConeGeometry(0.06, 0.8, 4);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.6,
      emissive: 0x052e16,
      emissiveIntensity: 0.3,
    });

    // Spread clusters across open bathroom floor
    for (let x = -4.2; x <= 4.2; x += 0.45) {
      for (let z = -4.2; z <= 4.2; z += 0.45) {
        // Skip shower curb and vanity counter footprint
        if (x > 1.8 && z < -1.8) continue;
        if (x < -2.2 && z > -0.2) continue;
        if (x < -2.8 && z < -3.2) continue;

        const blade = new THREE.Mesh(bladeGeo, grassMat);
        blade.position.set(
          x + (Math.random() - 0.5) * 0.2,
          0.4,
          z + (Math.random() - 0.5) * 0.2
        );
        blade.rotation.x = (Math.random() - 0.5) * 0.3;
        blade.rotation.z = (Math.random() - 0.5) * 0.3;
        blade.rotation.y = Math.random() * Math.PI;
        this.grassGroup.add(blade);
      }
    }
  }

  private buildShowerParticles(): THREE.Points {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 3.6 + (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = Math.random() * 3.0;
      positions[i * 3 + 2] = -4.0 + (Math.random() - 0.5) * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.06,
      transparent: true,
      opacity: 0, // initially off
    });

    const particles = new THREE.Points(geometry, material);
    return particles;
  }

  private buildExitDoor(): THREE.Group {
    const doorGroup = new THREE.Group();

    // Door Frame
    const frameGeo = new THREE.BoxGeometry(1.6, 2.8, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 1.4;
    doorGroup.add(frame);

    // Door Panel
    const panelGeo = new THREE.BoxGeometry(1.4, 2.6, 0.06);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.set(0, 1.4, 0.02);
    doorGroup.add(panel);

    // Eviction / Warning sign on door
    const signGeo = new THREE.PlaneGeometry(0.6, 0.8);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, 128, 160);
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('WARNING', 20, 30);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('OUTSIDE LIES', 16, 60);
    ctx.fillText('EMPLOYMENT', 16, 80);
    ctx.fillText('1500 EXP REQ', 16, 120);
    const signTex = new THREE.CanvasTexture(canvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 1.6, 0.06);
    doorGroup.add(sign);

    return doorGroup;
  }

  public update(delta: number, isShowerRunning: boolean) {
    // Water particle animation
    if (this.showerParticles) {
      const mat = this.showerParticles.material as THREE.PointsMaterial;
      if (isShowerRunning) {
        mat.opacity = 0.7;
        const pos = this.showerParticles.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < pos.count; i++) {
          let y = pos.getY(i) - delta * 4.5;
          if (y < 0.1) {
            y = 2.9 + Math.random() * 0.2;
          }
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      } else {
        mat.opacity = 0;
      }
    }

    // Knife gentle hover
    if (this.knifeMesh && this.knifeMesh.visible) {
      this.knifeMesh.rotation.y += delta * 1.5;
      this.knifeMesh.position.y = 0.08 + Math.sin(Date.now() * 0.004) * 0.04;
    }

    // Flickering light effect
    if (Math.random() < 0.02) {
      this.ceilingLight.intensity = 0.4 + Math.random() * 0.9;
    } else {
      this.ceilingLight.intensity = 1.2;
    }
  }

  public resetGrass() {
    this.grassGroup.scale.set(1, 0.01, 1);
  }
}
