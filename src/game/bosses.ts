import * as THREE from 'three';
import { createResumeTexture } from './textures';
import { sound } from './audio';
import { BossEntity } from './types';

export interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
  radius: number;
}

export class BossManager {
  public scene: THREE.Scene;
  public currentBoss: BossEntity | null = null;
  public bossGroup: THREE.Group | null = null;
  public projectiles: Projectile[] = [];
  public pursuer: THREE.Group | null = null;
  public pursuerTimer: number = 0;
  public pursuerTarget: THREE.Vector3 = new THREE.Vector3();
  public onBossDefeated?: (boss: BossEntity, expEarned: number) => void;
  public onPlayerDamaged?: (amount: number, reason: string) => void;

  private attackTimer: number = 0;
  private voiceCooldown: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Spawn Hygiene Monster (Level 1 Boss)
   */
  public spawnHygieneMonster(pos: THREE.Vector3) {
    this.clearBoss();

    const group = new THREE.Group();
    group.position.copy(pos);

    // Giant translucent soap bar
    const soapGeo = new THREE.BoxGeometry(1.4, 0.9, 0.7);
    const soapMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      transmission: 0.8,
      thickness: 0.8,
      clearcoat: 1.0,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    const soap = new THREE.Mesh(soapGeo, soapMat);
    soap.position.y = 1.6;
    group.add(soap);

    // Scrub brush head on top
    const brushGeo = new THREE.BoxGeometry(1.2, 0.25, 0.6);
    const brushMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 });
    const brush = new THREE.Mesh(brushGeo, brushMat);
    brush.position.y = 2.15;
    group.add(brush);

    // Bristles
    const bristleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 4);
    const bristleMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let i = 0; i < 20; i++) {
      const b = new THREE.Mesh(bristleGeo, bristleMat);
      b.position.set((Math.random() - 0.5) * 1.0, 2.38, (Math.random() - 0.5) * 0.45);
      group.add(b);
    }

    // Floating soap bubbles orbiting
    const bubbleGeo = new THREE.SphereGeometry(0.18, 12, 12);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xa5f3fc,
      transmission: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.7,
    });
    for (let b = 0; b < 4; b++) {
      const orb = new THREE.Mesh(bubbleGeo, bubbleMat);
      orb.name = `bubble_${b}`;
      group.add(orb);
    }

    this.scene.add(group);
    this.bossGroup = group;

    this.currentBoss = {
      id: 'hygiene_monster',
      name: 'THE HYGIENE MONSTER',
      title: 'Scrub-Daddy of Dread',
      hp: 35,
      maxHp: 35,
      phase: 1,
      active: true,
      type: 'hygiene',
    };

    sound.playHorrorStinger();
    sound.speakCorporate("Hygiene is mandatory! Clean up your resume!");
  }

  /**
   * Spawn Verity (Level 1 Recruiter Boss)
   */
  public spawnVerity(pos: THREE.Vector3) {
    this.clearBoss();

    const group = new THREE.Group();
    group.position.copy(pos);

    // Floating suit body
    const bodyGeo = new THREE.CylinderGeometry(0.45, 0.6, 1.8, 8);
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, suitMat);
    body.position.y = 1.8;
    group.add(body);

    // Menacing head with glowing red recruiter spectacles
    const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.9;
    group.add(head);

    // Glasses
    const glassGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const glasses = new THREE.Mesh(glassGeo, glassMat);
    glasses.position.set(0, 2.92, 0.32);
    group.add(glasses);

    // Orbiting Resume Shields
    const resumeTex = createResumeTexture();
    for (let i = 0; i < 4; i++) {
      const resGeo = new THREE.PlaneGeometry(0.7, 0.9);
      const resMat = new THREE.MeshStandardMaterial({ map: resumeTex, side: THREE.DoubleSide });
      const res = new THREE.Mesh(resGeo, resMat);
      res.name = `shield_${i}`;
      group.add(res);
    }

    this.scene.add(group);
    this.bossGroup = group;

    this.currentBoss = {
      id: 'verity',
      name: 'VERITY, RECRUITER SUPREME',
      title: 'Harbinger of Unpaid Overtime',
      hp: 75,
      maxHp: 75,
      phase: 1,
      active: true,
      type: 'verity',
    };

    sound.playHorrorStinger();
    sound.speakCorporate("Your application has been received. There are 4,000 other candidates. Prepare to be judged.");
  }

  /**
   * Spawn J*b J*b Sahur (Level 2 Boss)
   */
  public spawnSahur(pos: THREE.Vector3) {
    this.clearBoss();

    const group = new THREE.Group();
    group.position.copy(pos);

    // Giant clock bell head
    const bellGeo = new THREE.CylinderGeometry(0.9, 1.2, 1.4, 16);
    const bellMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.8, roughness: 0.2 });
    const bell = new THREE.Mesh(bellGeo, bellMat);
    bell.position.y = 2.0;
    group.add(bell);

    // Clock face
    const faceGeo = new THREE.CircleGeometry(0.85, 16);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('03:00 AM', 12, 70);
    const faceTex = new THREE.CanvasTexture(canvas);
    const faceMat = new THREE.MeshBasicMaterial({ map: faceTex });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 2.0, 1.05);
    group.add(face);

    // Twin ringing bells on top
    const topBellGeo = new THREE.SphereGeometry(0.4, 12, 12);
    const tBellL = new THREE.Mesh(topBellGeo, bellMat);
    tBellL.position.set(-0.8, 2.9, 0);
    group.add(tBellL);

    const tBellR = new THREE.Mesh(topBellGeo, bellMat);
    tBellR.position.set(0.8, 2.9, 0);
    group.add(tBellR);

    this.scene.add(group);
    this.bossGroup = group;

    this.currentBoss = {
      id: 'sahur',
      name: 'J*B J*B SAHUR',
      title: 'The 3:00 AM Work Alarm Demon',
      hp: 60,
      maxHp: 60,
      phase: 1,
      active: true,
      type: 'sahur',
    };

    sound.playHorrorStinger();
    sound.speakCorporate("SAHUUUUR! Wake up! Your daily standup starts right now!");
  }

  /**
   * Spawn Jobity (Level 2 Final Boss)
   */
  public spawnJobity(pos: THREE.Vector3) {
    this.clearBoss();

    const group = new THREE.Group();
    group.position.copy(pos);

    // Colossal Obsidian Suit
    const bodyGeo = new THREE.BoxGeometry(1.6, 2.6, 1.0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.9,
      roughness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 2.5;
    group.add(body);

    // Glowing Purple tie & core
    const tieGeo = new THREE.BoxGeometry(0.3, 1.6, 0.1);
    const tieMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.position.set(0, 2.3, 0.52);
    group.add(tie);

    // Giant spreadsheet wings
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0x22c55e,
      wireframe: true,
      transparent: true,
      opacity: 0.7,
    });

    const wingLGeo = new THREE.PlaneGeometry(3.0, 2.2);
    const wingL = new THREE.Mesh(wingLGeo, wingMat);
    wingL.position.set(-2.2, 3.2, -0.2);
    wingL.rotation.y = 0.4;
    group.add(wingL);

    const wingRGeo = new THREE.PlaneGeometry(3.0, 2.2);
    const wingR = new THREE.Mesh(wingRGeo, wingMat);
    wingR.position.set(2.2, 3.2, -0.2);
    wingR.rotation.y = -0.4;
    group.add(wingR);

    this.scene.add(group);
    this.bossGroup = group;

    this.currentBoss = {
      id: 'jobity',
      name: 'JOBITY: THE PERPETUAL OVERLORD',
      title: 'Devourer of Free Time and Weekends',
      hp: 90,
      maxHp: 90,
      phase: 1,
      active: true,
      type: 'jobity',
    };

    sound.playHorrorStinger();
    sound.speakCorporate("I am Jobity. You cannot escape the infinite sprint cycle!");
  }

  /**
   * Homeowner Recruiter Chase Sequence (10s duration)
   */
  public startHomeownerChase(spawnPos: THREE.Vector3) {
    if (this.pursuer) {
      this.scene.remove(this.pursuer);
    }

    const pursuer = new THREE.Group();
    pursuer.position.copy(spawnPos);

    // Businessman runner
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.4, 1.5, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    pursuer.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 12, 12);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfecdd3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    pursuer.add(head);

    // Briefcase in hand
    const caseGeo = new THREE.BoxGeometry(0.15, 0.4, 0.5);
    const caseMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const briefcase = new THREE.Mesh(caseGeo, caseMat);
    briefcase.position.set(0.5, 0.8, 0);
    pursuer.add(briefcase);

    this.scene.add(pursuer);
    this.pursuer = pursuer;
    this.pursuerTimer = 10.0; // 10 seconds chase!

    sound.playHorrorStinger();
    sound.speakCorporate("WAIT! I have an incredible network marketing opportunity for you!");
  }

  /**
   * Hit boss with knife
   */
  public damageBoss(amount: number) {
    if (!this.currentBoss || !this.currentBoss.active) return false;

    this.currentBoss.hp -= amount;
    sound.playKnifeHit();

    // Damage flash
    if (this.bossGroup) {
      this.bossGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const original = child.material;
          child.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          setTimeout(() => {
            child.material = original;
          }, 100);
        }
      });
    }

    if (this.currentBoss.hp <= 0) {
      this.currentBoss.active = false;
      let expAward = 350;
      if (this.currentBoss.type === 'verity') expAward = 1000;
      if (this.currentBoss.type === 'sahur') expAward = 600;
      if (this.currentBoss.type === 'jobity') expAward = 1200;

      sound.playTreatChime();
      sound.speakCorporate("Nooo! My quarterly synergy KPI!");

      if (this.onBossDefeated) {
        this.onBossDefeated(this.currentBoss, expAward);
      }
      this.clearBoss();
      return true;
    }

    return false;
  }

  public update(delta: number, playerPos: THREE.Vector3) {
    this.voiceCooldown = Math.max(0, this.voiceCooldown - delta);
    this.attackTimer += delta;

    // 1. Boss AI & Attacks
    if (this.currentBoss && this.currentBoss.active && this.bossGroup) {
      // Hover & look at player
      this.bossGroup.position.y += Math.sin(Date.now() * 0.003) * 0.008;
      this.bossGroup.lookAt(playerPos.x, this.bossGroup.position.y, playerPos.z);

      // Boss specific animations
      if (this.currentBoss.type === 'hygiene') {
        for (let b = 0; b < 4; b++) {
          const orb = this.bossGroup.getObjectByName(`bubble_${b}`);
          if (orb) {
            const angle = (Date.now() * 0.002) + (b * Math.PI / 2);
            orb.position.set(Math.cos(angle) * 1.5, 1.6 + Math.sin(angle * 2) * 0.3, Math.sin(angle) * 1.5);
          }
        }

        // Shoot foam bubble projectile every 2.5s
        if (this.attackTimer > 2.5) {
          this.attackTimer = 0;
          this.fireProjectile(
            this.bossGroup.position,
            playerPos,
            0x38bdf8,
            12,
            0.25,
            6.0
          );
        }
      } else if (this.currentBoss.type === 'verity') {
        // Spin shields
        for (let s = 0; s < 4; s++) {
          const shield = this.bossGroup.getObjectByName(`shield_${s}`);
          if (shield) {
            const a = (Date.now() * 0.003) + (s * Math.PI / 2);
            shield.position.set(Math.cos(a) * 1.8, 2.0, Math.sin(a) * 1.8);
            shield.rotation.y = a;
          }
        }

        // Shoot resume chakrams
        if (this.attackTimer > 2.0) {
          this.attackTimer = 0;
          this.fireProjectile(
            this.bossGroup.position,
            playerPos,
            0xffffff,
            18,
            0.4,
            8.5
          );

          if (this.voiceCooldown <= 0 && Math.random() < 0.35) {
            this.voiceCooldown = 7;
            const lines = [
              "We decided to pursue candidates with more synergy!",
              "Are you ready for the final 7-round interview?",
              "What is your greatest weakness?!",
              "You lack culture fit!"
            ];
            sound.speakCorporate(lines[Math.floor(Math.random() * lines.length)]);
          }
        }
      } else if (this.currentBoss.type === 'sahur') {
        if (this.attackTimer > 2.2) {
          this.attackTimer = 0;
          this.fireProjectile(
            this.bossGroup.position,
            playerPos,
            0xef4444,
            20,
            0.45,
            7.0
          );
        }
      } else if (this.currentBoss.type === 'jobity') {
        if (this.attackTimer > 1.8) {
          this.attackTimer = 0;
          // Dual split projectiles
          this.fireProjectile(
            this.bossGroup.position,
            playerPos,
            0xa855f7,
            25,
            0.5,
            9.0
          );
        }
      }
    }

    // 2. Projectiles Update
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.rotation.x += delta * 5;
      p.mesh.rotation.y += delta * 6;
      p.life -= delta;

      // Check collision with player
      if (p.mesh.position.distanceTo(playerPos) < p.radius + 0.6) {
        sound.playHurt();
        if (this.onPlayerDamaged) {
          this.onPlayerDamaged(p.damage, "Hit by corporate projectile!");
        }
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 3. Homeowner Pursuer Update
    if (this.pursuer && this.pursuerTimer > 0) {
      this.pursuerTimer -= delta;

      // Sprint towards player
      const dir = new THREE.Vector3().subVectors(playerPos, this.pursuer.position).normalize();
      dir.y = 0;
      this.pursuer.position.addScaledVector(dir, delta * 6.5);
      this.pursuer.lookAt(playerPos.x, this.pursuer.position.y, playerPos.z);

      // Running animation bob
      this.pursuer.position.y = Math.abs(Math.sin(Date.now() * 0.012)) * 0.2;

      // Check caught player
      if (this.pursuer.position.distanceTo(playerPos) < 1.4) {
        sound.playHurt();
        if (this.onPlayerDamaged) {
          this.onPlayerDamaged(25, "Caught by eager corporate recruiter!");
        }
        this.pursuerTimer = 0; // End chase
      }

      if (this.pursuerTimer <= 0) {
        this.scene.remove(this.pursuer);
        this.pursuer = null;
      }
    }
  }

  private fireProjectile(
    from: THREE.Vector3,
    to: THREE.Vector3,
    color: number,
    damage: number,
    radius: number,
    speed: number
  ) {
    const geo = new THREE.SphereGeometry(radius, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(from);
    mesh.position.y = Math.max(1.0, from.y);

    const dir = new THREE.Vector3().subVectors(to, mesh.position).normalize();

    this.scene.add(mesh);
    this.projectiles.push({
      mesh,
      velocity: dir.multiplyScalar(speed),
      life: 5.0,
      damage,
      radius,
    });
  }

  public clearBoss() {
    if (this.bossGroup) {
      this.scene.remove(this.bossGroup);
      this.bossGroup = null;
    }
    this.currentBoss = null;
    this.projectiles.forEach((p) => this.scene.remove(p.mesh));
    this.projectiles = [];
  }

  public dispose() {
    this.clearBoss();
    if (this.pursuer) {
      this.scene.remove(this.pursuer);
      this.pursuer = null;
    }
  }
}
