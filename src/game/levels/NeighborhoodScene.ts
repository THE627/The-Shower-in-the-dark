import * as THREE from 'three';
import {
  createRoadTexture,
  createSidewalkTexture,
  createDoorTexture,
  createPumpkinFaceTexture,
} from '../textures';

export interface HouseData {
  index: number;
  name: string;
  doorPosition: THREE.Vector3;
  doorMesh: THREE.Mesh;
  porchLight: THREE.PointLight;
  isVisited: boolean;
}

export class NeighborhoodScene {
  public group: THREE.Group;
  public houses: HouseData[] = [];
  public treeColliders: THREE.Box3[] = [];
  public houseColliders: THREE.Box3[] = [];
  private pumpkinLights: THREE.PointLight[] = [];

  constructor() {
    this.group = new THREE.Group();

    // 1. Terrain & Ground (Grass lawns)
    const groundGeo = new THREE.PlaneGeometry(80, 120);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f1d15,
      roughness: 0.9,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    // 2. Asphalt Road (X: -4 to +4, Z: -50 to +50)
    const roadGeo = new THREE.PlaneGeometry(8, 100);
    const roadMat = new THREE.MeshStandardMaterial({
      map: createRoadTexture(),
      roughness: 0.8,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02; // Avoid z-fighting
    road.receiveShadow = true;
    this.group.add(road);

    // 3. Sidewalks (West: X: -6 to -4, East: X: 4 to 6)
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: createSidewalkTexture(),
      roughness: 0.7,
    });

    const createSidewalk = (x: number) => {
      const geo = new THREE.BoxGeometry(2, 0.12, 100);
      const mesh = new THREE.Mesh(geo, sidewalkMat);
      mesh.position.set(x, 0.06, 0);
      mesh.receiveShadow = true;
      this.group.add(mesh);
    };
    createSidewalk(-5);
    createSidewalk(5);

    // 4. Streetlights along both sides
    const streetLightZ = [-35, -12, 12, 35];
    streetLightZ.forEach((z) => {
      this.addStreetLight(-5.8, z);
      this.addStreetLight(5.8, z);
    });

    // 5. Build 6 Suburban Houses
    // Left side (West): x: -16
    const leftHouses = [
      { z: -28, num: '666', name: "The Overtime Manor", color: '#450a0a' },
      { z: 0,   num: '404', name: "LinkedIn Recruiter's Crypt", color: '#1e3a8a' },
      { z: 28,  num: '101', name: "Senior Dev's Cottage", color: '#14532d' },
    ];

    // Right side (East): x: 16
    const rightHouses = [
      { z: -28, num: '888', name: "Unpaid Internship Estate", color: '#581c87' },
      { z: 0,   num: '999', name: "The Scrum Master's Fortress", color: '#7c2d12' },
      { z: 28,  num: '777', name: "Pension Beneficiary Villa", color: '#0f766e' },
    ];

    leftHouses.forEach((h, idx) => {
      this.buildSuburbanHouse(idx, -16, h.z, 0, h.num, h.name, h.color);
    });

    rightHouses.forEach((h, idx) => {
      this.buildSuburbanHouse(idx + 3, 16, h.z, Math.PI, h.num, h.name, h.color);
    });

    // 6. Spooky Bare Trees (Natural Obstacles to juke corporate pursuers!)
    const treePositions = [
      [-9, -38], [-8, -18], [-9, 8], [-8, 22], [-9, 42],
      [9, -38], [8, -18], [9, 8], [8, 22], [9, 42],
      [-2, -45], [2, 45]
    ];
    treePositions.forEach(([x, z]) => {
      this.buildSpookyTree(x, z);
    });

    // 7. Ambient Perimeter Fences & Trees
    this.buildPerimeterFences();
  }

  private addStreetLight(x: number, z: number) {
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, 2.25, z);
    this.group.add(post);

    const lampGeo = new THREE.CylinderGeometry(0.25, 0.15, 0.45, 6);
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(x, 4.4, z);
    this.group.add(lamp);

    const light = new THREE.PointLight(0xfef08a, 0.85, 14);
    light.position.set(x, 4.2, z);
    this.group.add(light);
  }

  private buildSuburbanHouse(
    index: number,
    x: number,
    z: number,
    rotationY: number,
    number: string,
    name: string,
    wallColor: string
  ) {
    const houseGroup = new THREE.Group();
    houseGroup.position.set(x, 0, z);
    houseGroup.rotation.y = rotationY;

    // Main House Box
    const bodyGeo = new THREE.BoxGeometry(10, 5, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 2.5, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    houseGroup.add(body);

    // Pitched Roof
    const roofGeo = new THREE.ConeGeometry(8.5, 3.5, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 6.75, 0);
    roof.rotation.y = Math.PI / 4;
    houseGroup.add(roof);

    // Front Porch (extends towards road: +X relative)
    const porchGeo = new THREE.BoxGeometry(3, 0.2, 5);
    const porchMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const porch = new THREE.Mesh(porchGeo, porchMat);
    porch.position.set(5.5, 0.1, 0);
    houseGroup.add(porch);

    // Porch Pillars
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
    const createPillar = (pz: number) => {
      const pGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
      const pillar = new THREE.Mesh(pGeo, pillarMat);
      pillar.position.set(6.8, 1.5, pz);
      houseGroup.add(pillar);
    };
    createPillar(-2.2);
    createPillar(2.2);

    // Porch Roof
    const pRoofGeo = new THREE.BoxGeometry(3.2, 0.3, 5.2);
    const pRoof = new THREE.Mesh(pRoofGeo, roofMat);
    pRoof.position.set(5.5, 3.1, 0);
    houseGroup.add(pRoof);

    // Front Door (Interactive)
    const doorGeo = new THREE.PlaneGeometry(1.4, 2.6);
    const doorTex = createDoorTexture(wallColor, number);
    const doorMat = new THREE.MeshStandardMaterial({
      map: doorTex,
      roughness: 0.4,
      metalness: 0.1,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(5.02, 1.4, 0);
    doorMesh.rotation.y = Math.PI / 2;
    houseGroup.add(doorMesh);

    // Porch Lantern Light
    const porchLight = new THREE.PointLight(0xfbbf24, 1.4, 8);
    porchLight.position.set(5.8, 2.7, 0);
    houseGroup.add(porchLight);

    // Glowing Jack-o'-Lantern on porch
    const pumpkin = this.buildPumpkin();
    pumpkin.position.set(6.4, 0.3, 1.6);
    houseGroup.add(pumpkin);

    // Windows with spooky silhouettes
    const winGeo = new THREE.PlaneGeometry(1.6, 1.8);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const win1 = new THREE.Mesh(winGeo, winMat);
    win1.position.set(5.02, 2.2, -3.2);
    win1.rotation.y = Math.PI / 2;
    houseGroup.add(win1);

    const win2 = new THREE.Mesh(winGeo, winMat);
    win2.position.set(5.02, 2.2, 3.2);
    win2.rotation.y = Math.PI / 2;
    houseGroup.add(win2);

    this.group.add(houseGroup);

    // Calculate world position of the door
    const doorWorldPos = new THREE.Vector3();
    doorMesh.getWorldPosition(doorWorldPos);

    this.houses.push({
      index,
      name,
      doorPosition: new THREE.Vector3(
        x + (rotationY === 0 ? 5.2 : -5.2),
        1.4,
        z
      ),
      doorMesh,
      porchLight,
      isVisited: false,
    });

    // Add house collider box
    this.houseColliders.push(
      new THREE.Box3(
        new THREE.Vector3(x - 6, 0, z - 7),
        new THREE.Vector3(x + 6, 8, z + 7)
      )
    );
  }

  private buildPumpkin(): THREE.Group {
    const pumpkin = new THREE.Group();

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.28, 12, 10);
    bodyGeo.scale(1, 0.85, 1);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xea580c,
      roughness: 0.6,
      map: createPumpkinFaceTexture(),
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.y = -Math.PI / 2;
    pumpkin.add(body);

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.1, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.26;
    pumpkin.add(stem);

    // Inner Flickering Candle Light
    const candleLight = new THREE.PointLight(0xf59e0b, 0.8, 3);
    candleLight.position.set(0, 0.05, 0);
    pumpkin.add(candleLight);
    this.pumpkinLights.push(candleLight);

    return pumpkin;
  }

  private buildSpookyTree(x: number, z: number) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Gnarled Trunk (3-part procedural group)
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.55, 4.5, 7);
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, barkMat);
    trunk.position.y = 2.25;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    tree.add(trunk);

    // Roots
    const rootGeo = new THREE.ConeGeometry(0.8, 0.6, 6);
    const roots = new THREE.Mesh(rootGeo, barkMat);
    roots.position.y = 0.3;
    tree.add(roots);

    // Twisted Branches
    for (let b = 0; b < 5; b++) {
      const angle = (b / 5) * Math.PI * 2 + Math.random() * 0.4;
      const bGeo = new THREE.CylinderGeometry(0.08, 0.2, 2.6, 5);
      const branch = new THREE.Mesh(bGeo, barkMat);
      branch.position.set(Math.cos(angle) * 0.6, 3.8 + (b % 2) * 0.5, Math.sin(angle) * 0.6);
      branch.rotation.x = Math.sin(angle) * 0.8;
      branch.rotation.z = -Math.cos(angle) * 0.8;
      branch.rotation.y = angle;
      tree.add(branch);
    }

    this.group.add(tree);

    // Collider for tree trunk (juke around these!)
    this.treeColliders.push(
      new THREE.Box3(
        new THREE.Vector3(x - 0.6, 0, z - 0.6),
        new THREE.Vector3(x + 0.6, 5, z + 0.6)
      )
    );
  }

  private buildPerimeterFences() {
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const postGeo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
    const railGeo = new THREE.BoxGeometry(0.06, 0.08, 2.0);

    // Add white picket fences along the sidewalk edge
    for (let z = -45; z <= 45; z += 2.0) {
      if (Math.abs(z - (-28)) < 4 || Math.abs(z) < 4 || Math.abs(z - 28) < 4) continue; // Porch walkway gaps

      // Left side fence
      const postL = new THREE.Mesh(postGeo, fenceMat);
      postL.position.set(-6.2, 0.6, z);
      this.group.add(postL);

      const railL = new THREE.Mesh(railGeo, fenceMat);
      railL.position.set(-6.2, 0.8, z + 1.0);
      this.group.add(railL);

      // Right side fence
      const postR = new THREE.Mesh(postGeo, fenceMat);
      postR.position.set(6.2, 0.6, z);
      this.group.add(postR);

      const railR = new THREE.Mesh(railGeo, fenceMat);
      railR.position.set(6.2, 0.8, z + 1.0);
      this.group.add(railR);
    }
  }

  public update(delta: number) {
    // Flickering candle flame inside pumpkins
    if (Math.random() < 0.1) {
      this.pumpkinLights.forEach((light) => {
        light.intensity = 0.5 + Math.random() * 0.6;
      });
    }
  }
}
