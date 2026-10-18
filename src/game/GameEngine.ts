import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BathroomScene } from './levels/BathroomScene';
import { NeighborhoodScene, HouseData } from './levels/NeighborhoodScene';
import { BossManager } from './bosses';
import { KnifeViewModel } from './viewmodel';
import { sound } from './audio';
import {
  GameLevel,
  GameStatus,
  PlayerStats,
  ActiveThreat,
  ToastMessage,
} from './types';

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvasContainer: HTMLElement;

  // Levels
  public bathroomScene: BathroomScene;
  public neighborhoodScene: NeighborhoodScene;
  public bossManager: BossManager;
  public knifeViewModel: KnifeViewModel;

  // Game State
  public status: GameStatus = 'intro';
  public stats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    exp: 0,
    level: 1,
    hasKnife: false,
    score: 0,
    threatsDodged: 0,
    bossesDefeated: 0,
    candyCount: 0,
    doorsKnocked: 0,
    timeSurvived: 0,
  };

  public activeThreat: ActiveThreat = {
    type: 'none',
    timer: 0,
    duration: 0,
    state: 'cleared',
  };

  // Interaction State
  public targetedObject: 'none' | 'knife' | 'valve' | 'door' | 'exit_door' = 'none';
  public targetedHouse: HouseData | null = null;
  public interactionProgress: number = 0; // 0 to 1 for holding E
  public isHoldingInteract: boolean = false;
  private isShowerRunning: boolean = false;
  private showerFloodTimer: number = 0;

  // First-Person Physics & Movement
  public playerPosition = new THREE.Vector3(0, 1.7, 0);
  private playerVelocity = new THREE.Vector3();
  private isGrounded = true;
  private pitch = 0;
  private yaw = 0;
  private keys: { [key: string]: boolean } = {};

  // Timers & Loops
  private threatCooldown = 5.0;
  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private raycaster = new THREE.Raycaster();

  // Callbacks to UI
  public onStateUpdate?: (stats: PlayerStats, threat: ActiveThreat, bossHp: { current: number; max: number; name: string } | null) => void;
  public onToast?: (toast: ToastMessage) => void;
  public onDamageFlash?: () => void;
  public onStatusChange?: (status: GameStatus) => void;

  constructor(container: HTMLElement) {
    this.canvasContainer = container;

    // 1. Scene & Renderer Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080c);
    this.scene.fog = new THREE.FogExp2(0x06080c, 0.035);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 150);
    this.camera.position.copy(this.playerPosition);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Studio Environment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // Ambient Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x1e293b, 0.5);
    this.scene.add(hemiLight);

    // 2. Initialize Scenes
    this.bathroomScene = new BathroomScene();
    this.neighborhoodScene = new NeighborhoodScene();
    this.bossManager = new BossManager(this.scene);

    // Add Level 1 by default
    this.scene.add(this.bathroomScene.group);

    // First person knife model attached to camera
    this.knifeViewModel = new KnifeViewModel();
    this.camera.add(this.knifeViewModel.group);
    this.scene.add(this.camera);

    // Boss Manager Callbacks
    this.bossManager.onBossDefeated = (boss, expEarned) => {
      this.stats.exp += expEarned;
      this.stats.bossesDefeated++;
      this.addToast(`DEFEATED ${boss.name}! +${expEarned} EXP!`, 'treat');
      this.checkLevelProgression();
    };

    this.bossManager.onPlayerDamaged = (amount, reason) => {
      this.takeDamage(amount, reason);
    };

    // 3. Bind Event Listeners
    this.setupInputs();
    window.addEventListener('resize', this.handleResize);

    // Start render loop
    this.animate();
  }

  private setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyE') {
        this.isHoldingInteract = true;
        this.handleInstantInteract();
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.status === 'playing') {
          this.pause();
        } else if (this.status === 'paused') {
          this.resume();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyE') {
        this.isHoldingInteract = false;
        this.interactionProgress = 0;
      }
    });

    // Pointer Lock & Mouse Look
    const canvas = this.renderer.domElement;
    canvas.addEventListener('click', () => {
      if (this.status === 'playing') {
        if (document.pointerLockElement !== canvas) {
          canvas.requestPointerLock();
        } else {
          // Left click: Knife slash
          this.attackWithKnife();
        }
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas && this.status === 'playing') {
        const sens = 0.0022;
        this.yaw -= e.movementX * sens;
        this.pitch -= e.movementY * sens;
        this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
      }
    });
  }

  public startGame() {
    sound.init();
    this.status = 'playing';
    this.stats.hp = 100;
    this.stats.exp = 0;
    this.stats.level = 1;
    this.stats.hasKnife = false;
    this.stats.score = 0;
    this.stats.threatsDodged = 0;
    this.stats.bossesDefeated = 0;
    this.stats.candyCount = 0;
    this.stats.doorsKnocked = 0;
    this.stats.timeSurvived = 0;

    this.knifeViewModel.group.visible = false;
    if (this.bathroomScene.knifeMesh) {
      this.bathroomScene.knifeMesh.visible = true;
    }

    this.playerPosition.set(0, 1.7, 1.5);
    this.yaw = 0;
    this.pitch = 0;

    this.renderer.domElement.requestPointerLock();
    if (this.onStatusChange) this.onStatusChange('playing');
    this.addToast('SURVIVE THE SHOWER! ESCAPE CORPORATE ADULTHOOD!', 'info');
  }

  public pause() {
    this.status = 'paused';
    document.exitPointerLock();
    if (this.onStatusChange) this.onStatusChange('paused');
  }

  public resume() {
    this.status = 'playing';
    this.renderer.domElement.requestPointerLock();
    if (this.onStatusChange) this.onStatusChange('playing');
  }

  /**
   * Universal Instant Interaction on [E]
   */
  private handleInstantInteract() {
    if (this.status !== 'playing') return;

    // 1. Pick up knife on ground
    if (this.targetedObject === 'knife' && !this.stats.hasKnife) {
      this.stats.hasKnife = true;
      this.knifeViewModel.group.visible = true;
      if (this.bathroomScene.knifeMesh) {
        this.bathroomScene.knifeMesh.visible = false;
      }
      sound.playKnifeSwing();
      this.addToast('KITCHEN KNIFE ACQUIRED! [L-CLICK] TO SLASH!', 'treat');
      return;
    }

    // 2. Enter Exit Door to Level 2
    if (this.targetedObject === 'exit_door' && this.stats.exp >= 1500) {
      this.transitionToLevel2();
    }
  }

  /**
   * Knife attack swing
   */
  public attackWithKnife() {
    if (!this.stats.hasKnife) {
      // If clicking near the knife on the ground, allow pickup via click too!
      if (this.targetedObject === 'knife') {
        this.handleInstantInteract();
      }
      return;
    }

    const swung = this.knifeViewModel.swing();
    if (!swung) return;

    // Raycast attack from center of screen
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    // Check hit on boss
    if (this.bossManager.currentBoss && this.bossManager.bossGroup) {
      const hits = this.raycaster.intersectObjects(this.bossManager.bossGroup.children, true);
      if (hits.length > 0 && hits[0].distance < 3.2) {
        this.bossManager.damageBoss(12);
        this.addToast('CRITICAL SLASH! -12 HP', 'dodge');
      }
    }
  }

  /**
   * Transition from Level 1 (Bathroom) to Level 2 (Dallas Neighborhood)
   */
  public transitionToLevel2() {
    sound.playHorrorStinger();
    this.scene.remove(this.bathroomScene.group);
    this.bossManager.clearBoss();

    this.scene.add(this.neighborhoodScene.group);
    this.scene.fog = new THREE.FogExp2(0x06080c, 0.022);

    this.stats.level = 2;
    this.playerPosition.set(0, 1.7, -42); // Start at beginning of the spooky road
    this.yaw = 0;
    this.pitch = 0;

    this.addToast('LEVEL 2: JOB OR TREAT! KNOCK ON DOORS FOR CANDY!', 'info');
    sound.speakCorporate("Welcome to Dallas Suburbia! Happy Halloween. Avoid employment at all costs!");
  }

  private takeDamage(amount: number, reason: string) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    sound.playHurt();
    if (this.onDamageFlash) this.onDamageFlash();
    this.addToast(`-${amount} HP: ${reason}`, 'job');

    if (this.stats.hp <= 0) {
      this.triggerGameOver(reason);
    }
  }

  private triggerGameOver(reason: string) {
    this.status = 'gameover';
    document.exitPointerLock();
    sound.speakCorporate("We regret to inform you that you have perished. Better luck in your next interview.");
    if (this.onStatusChange) this.onStatusChange('gameover');
  }

  private triggerVictory() {
    this.status = 'victory';
    document.exitPointerLock();
    sound.playTreatChime();
    sound.speakCorporate("Incredible! You have survived all corporate recruiters, touched zero grass, and collected maximum candy! You are completely unemployable and free!");
    if (this.onStatusChange) this.onStatusChange('victory');
  }

  private addToast(text: string, type: ToastMessage['type']) {
    if (this.onToast) {
      this.onToast({
        id: Math.random().toString(36).substring(7),
        text,
        type,
        duration: 3500,
      });
    }
  }

  private checkLevelProgression() {
    if (this.stats.level === 1 && this.stats.exp >= 1500) {
      this.addToast('BATHROOM DOOR UNLOCKED! PRESS [E] TO ESCAPE OUTSIDE!', 'treat');
    } else if (this.stats.level === 2 && this.stats.exp >= 3500) {
      this.triggerVictory();
    }
  }

  /**
   * Main Game Loop
   */
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (this.status === 'playing') {
      this.stats.timeSurvived += delta;
      this.updateMovement(delta);
      this.updateInteractions(delta);

      if (this.stats.level === 1) {
        this.updateLevel1Threats(delta);
        this.bathroomScene.update(delta, this.isShowerRunning);
      } else {
        this.neighborhoodScene.update(delta);
      }

      this.bossManager.update(delta, this.playerPosition);
      this.knifeViewModel.update(delta, this.isMoving());
    }

    // Render 3D Frame
    this.renderer.render(this.scene, this.camera);

    // Push State Update to HUD
    if (this.onStateUpdate) {
      const boss = this.bossManager.currentBoss;
      this.onStateUpdate(
        this.stats,
        this.activeThreat,
        boss && boss.active ? { current: boss.hp, max: boss.maxHp, name: boss.name } : null
      );
    }
  };

  private isMoving(): boolean {
    return Boolean(this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD']);
  }

  /**
   * First Person Player Movement with Furniture Platform Collisions
   */
  private updateMovement(delta: number) {
    const speed = this.keys['ShiftLeft'] || this.keys['ShiftRight'] ? 6.5 : 3.8;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW']) moveDir.add(forward);
    if (this.keys['KeyS']) moveDir.sub(forward);
    if (this.keys['KeyD']) moveDir.add(right);
    if (this.keys['KeyA']) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      this.playerVelocity.x = moveDir.x * speed;
      this.playerVelocity.z = moveDir.z * speed;
    } else {
      this.playerVelocity.x *= 0.8;
      this.playerVelocity.z *= 0.8;
    }

    // Jump Physics
    const gravity = 22.0;
    if (this.keys['Space'] && this.isGrounded) {
      this.playerVelocity.y = 7.0;
      this.isGrounded = false;
    }

    this.playerVelocity.y -= gravity * delta;

    // Target position
    const nextPos = this.playerPosition.clone();
    nextPos.x += this.playerVelocity.x * delta;
    nextPos.y += this.playerVelocity.y * delta;
    nextPos.z += this.playerVelocity.z * delta;

    // Boundary & Collisions
    if (this.stats.level === 1) {
      // Bathroom walls: -4.5 to 4.5
      nextPos.x = Math.max(-4.4, Math.min(4.4, nextPos.x));
      nextPos.z = Math.max(-4.4, Math.min(4.4, nextPos.z));

      // Check furniture platforms (vanity, toilet)
      let groundLevel = 1.7; // default standing eye height
      this.bathroomScene.collidables.forEach((col) => {
        if (col.box.containsPoint(new THREE.Vector3(nextPos.x, 0.5, nextPos.z))) {
          groundLevel = 1.7 + col.height;
        }
      });

      if (nextPos.y <= groundLevel) {
        nextPos.y = groundLevel;
        this.playerVelocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      // Level 2 Road & Trees collision
      nextPos.x = Math.max(-28, Math.min(28, nextPos.x));
      nextPos.z = Math.max(-48, Math.min(48, nextPos.z));

      // Tree collisions
      this.neighborhoodScene.treeColliders.forEach((treeBox) => {
        if (treeBox.containsPoint(new THREE.Vector3(nextPos.x, 1.0, nextPos.z))) {
          // Push back
          nextPos.x = this.playerPosition.x;
          nextPos.z = this.playerPosition.z;
        }
      });

      if (nextPos.y <= 1.7) {
        nextPos.y = 1.7;
        this.playerVelocity.y = 0;
        this.isGrounded = true;
      }
    }

    this.playerPosition.copy(nextPos);

    // Apply Camera Rotation & Position with subtle head bob
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);

    const bobOffset = this.isMoving() && this.isGrounded ? Math.sin(Date.now() * 0.012) * 0.04 : 0;
    this.camera.position.set(this.playerPosition.x, this.playerPosition.y + bobOffset, this.playerPosition.z);
  }

  /**
   * Raycast Interactions (Knife pickup, shower valve hold, door knock hold)
   * Fixes Bug #3: Prompt is accurately reset to 'none' when looking away!
   */
  private updateInteractions(delta: number) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    let foundTarget: 'none' | 'knife' | 'valve' | 'door' | 'exit_door' = 'none';
    this.targetedHouse = null;

    if (this.stats.level === 1) {
      // 1. Knife on floor
      if (!this.stats.hasKnife && this.bathroomScene.knifeMesh?.visible) {
        const knifeDist = this.playerPosition.distanceTo(this.bathroomScene.knifeMesh.position);
        if (knifeDist < 2.5) {
          foundTarget = 'knife';
        }
      }

      // 2. Shower Valve
      const valvePos = new THREE.Vector3(3.6, 1.4, -4.9);
      if (this.playerPosition.distanceTo(valvePos) < 2.8) {
        // Check if looking towards valve
        const dirToValve = new THREE.Vector3().subVectors(valvePos, this.camera.position).normalize();
        const lookDir = new THREE.Vector3();
        this.camera.getWorldDirection(lookDir);
        if (lookDir.dot(dirToValve) > 0.7) {
          foundTarget = 'valve';
        }
      }

      // 3. Exit Door
      const doorPos = new THREE.Vector3(0, 1.4, 4.9);
      if (this.playerPosition.distanceTo(doorPos) < 2.5) {
        foundTarget = 'exit_door';
      }
    } else {
      // Level 2 Houses
      for (const house of this.neighborhoodScene.houses) {
        const dist = this.playerPosition.distanceTo(house.doorPosition);
        if (dist < 3.2) {
          const dirToDoor = new THREE.Vector3().subVectors(house.doorPosition, this.camera.position).normalize();
          const lookDir = new THREE.Vector3();
          this.camera.getWorldDirection(lookDir);
          if (lookDir.dot(dirToDoor) > 0.65) {
            foundTarget = 'door';
            this.targetedHouse = house;
            break;
          }
        }
      }
    }

    this.targetedObject = foundTarget;

    // Handle Holding [E] Interaction Progress
    if (this.isHoldingInteract) {
      if (foundTarget === 'valve' && this.isShowerRunning) {
        this.interactionProgress += delta / 1.8; // 1.8s to shut off valve
        if (this.interactionProgress >= 1.0) {
          this.turnOffShower();
          this.interactionProgress = 0;
        }
      } else if (foundTarget === 'door' && this.targetedHouse) {
        this.interactionProgress += delta / 2.0; // 2.0s to knock on door
        if (this.interactionProgress >= 1.0) {
          this.resolveDoorKnock(this.targetedHouse);
          this.interactionProgress = 0;
        }
      }
    } else {
      this.interactionProgress = 0;
    }
  }

  private turnOffShower() {
    this.isShowerRunning = false;
    sound.setShowerSound(false);
    this.stats.exp += 100;
    this.stats.threatsDodged++;
    sound.playTreatChime();
    this.addToast('SHOWER VALVE SHUT OFF! PERSONAL HYGIENE AVERTED! +100 EXP', 'dodge');
    this.activeThreat = { type: 'none', timer: 0, duration: 0, state: 'cleared' };
    this.checkLevelProgression();
  }

  private resolveDoorKnock(house: HouseData) {
    sound.playDoorKnock();
    this.stats.doorsKnocked++;

    // 80% Treat vs 20% J*b
    const isTreat = Math.random() < 0.8;

    if (isTreat) {
      sound.playTreatChime();
      const treatRoll = Math.random();
      let expAward = 30;
      let treatName = 'Candy Corn';

      if (treatRoll > 0.8) {
        expAward = 150;
        treatName = 'King Size KitKat Bar';
      } else if (treatRoll > 0.5) {
        expAward = 100;
        treatName = 'Full-Size Snickers';
      } else if (treatRoll > 0.25) {
        expAward = 50;
        treatName = 'Ghost Marshmallow Peeps';
      }

      this.stats.candyCount++;
      this.stats.exp += expAward;
      this.addToast(`TREAT FROM ${house.name.toUpperCase()}! ${treatName}! +${expAward} EXP!`, 'treat');
      this.checkLevelProgression();
    } else {
      // 20% J*B ENCOUNTER!
      sound.playHorrorStinger();
      const encounterRoll = Math.random();

      if (encounterRoll < 0.45) {
        // Recruiter Chase
        this.addToast(`J*B AMBUSH! HOMEOWNER IS CHASING YOU WITH A BRIEFCASE! SPRINT AWAY!`, 'job');
        this.bossManager.startHomeownerChase(house.doorPosition);
      } else if (encounterRoll < 0.75) {
        // Boss: J*b J*b Sahur
        this.addToast(`BOSS SUMMONED: J*B J*B SAHUR (3:00 AM ALARM DEMON)!`, 'job');
        this.bossManager.spawnSahur(new THREE.Vector3(house.doorPosition.x, 0, house.doorPosition.z + 4));
      } else {
        // Final Boss: Jobity!
        this.addToast(`ANCIENT TITAN AWAKENS: JOBITY! SLAY THE CORPORATE OVERLORD!`, 'job');
        this.bossManager.spawnJobity(new THREE.Vector3(0, 0, house.doorPosition.z));
      }
    }
  }

  /**
   * Level 1 Threat Cycle
   * Fixes Bug #2: Surviving standard threats awards 75-100 EXP!
   * Fixes Bug #5: Grass blades scale resets to 0.01!
   */
  private updateLevel1Threats(delta: number) {
    // Only roll threats if no boss is currently active
    if (this.bossManager.currentBoss?.active) return;

    // Check boss spawn milestone rolls
    if (this.stats.exp >= 400 && this.stats.bossesDefeated === 0 && Math.random() < 0.003) {
      this.bossManager.spawnHygieneMonster(new THREE.Vector3(0, 0, 0));
      return;
    }
    if (this.stats.exp >= 900 && this.stats.bossesDefeated <= 1 && Math.random() < 0.003) {
      this.bossManager.spawnVerity(new THREE.Vector3(0, 0, 0));
      return;
    }

    if (this.activeThreat.type === 'none') {
      this.threatCooldown -= delta;
      if (this.threatCooldown <= 0) {
        this.threatCooldown = 8.0 + Math.random() * 4.0;
        this.rollThreat();
      }
      return;
    }

    this.activeThreat.timer += delta;

    // 1. J*b Laser Threat
    if (this.activeThreat.type === 'job_laser') {
      if (this.activeThreat.state === 'warning') {
        // 2.2s targeting warning
        this.bathroomScene.laserLine.visible = true;
        (this.bathroomScene.laserLine.material as THREE.LineBasicMaterial).color.setHex(
          Math.sin(Date.now() * 0.03) > 0 ? 0xff0000 : 0xffff00
        );

        if (this.activeThreat.timer >= 2.2) {
          this.activeThreat.state = 'active';
          sound.playLaserFire();
          this.bathroomScene.laserLine.visible = false;
          this.bathroomScene.jobApplicationMesh.visible = true;
        }
      } else if (this.activeThreat.state === 'active') {
        // Big spinning resume blasts across Z corridor (x ~ 0)
        const progress = (this.activeThreat.timer - 2.2) / 1.5;
        const z = -4.8 + progress * 9.6;
        this.bathroomScene.jobApplicationMesh.position.set(0, 1.4, z);
        this.bathroomScene.jobApplicationMesh.rotation.y += delta * 12;

        // Check if player is standing in laser corridor
        if (Math.abs(this.playerPosition.x) < 1.0 && Math.abs(this.playerPosition.z - z) < 1.2) {
          this.takeDamage(25, 'Blasted by Mandatory Job Application!');
          this.bathroomScene.jobApplicationMesh.visible = false;
          this.activeThreat = { type: 'none', timer: 0, duration: 0, state: 'cleared' };
          return;
        }

        if (progress >= 1.0) {
          // Dodged successfully!
          this.bathroomScene.jobApplicationMesh.visible = false;
          this.stats.exp += 80; // FIXED EXP PROGRESSION!
          this.stats.threatsDodged++;
          sound.playTreatChime();
          this.addToast('DODGED UNPAID INTERNSHIP APPLICATION! +80 EXP', 'dodge');
          this.activeThreat = { type: 'none', timer: 0, duration: 0, state: 'cleared' };
          this.checkLevelProgression();
        }
      }
    }

    // 2. Touch Grass Threat
    else if (this.activeThreat.type === 'touch_grass') {
      // Grass grows up
      const grassScaleY = Math.min(1.0, this.activeThreat.timer * 1.5);
      this.bathroomScene.grassGroup.scale.set(1, grassScaleY, 1);

      // Check if player is touching the floor (safe on toilet or vanity platforms!)
      if (this.playerPosition.y <= 1.75) {
        this.takeDamage(delta * 14, 'Allergic reaction to touching grass!');
      }

      if (this.activeThreat.timer >= this.activeThreat.duration) {
        // Cleared! Reset grass scale to 0.01 (FIXED BUG #5)
        this.bathroomScene.resetGrass();
        this.stats.exp += 80;
        this.stats.threatsDodged++;
        sound.playTreatChime();
        this.addToast('TOUCH GRASS HAZARD CLEARED! +80 EXP', 'dodge');
        this.activeThreat = { type: 'none', timer: 0, duration: 0, state: 'cleared' };
        this.checkLevelProgression();
      }
    }

    // 3. Deodorant / Shower Flooding
    else if (this.activeThreat.type === 'shower_flood') {
      this.showerFloodTimer += delta;

      // Spin valve wildly
      this.bathroomScene.showerValveMesh.rotation.x += delta * 10;

      if (this.showerFloodTimer >= 8.5) {
        // Flood penalty
        this.takeDamage(25, 'Scalding shower water flooded the bathroom!');
        this.turnOffShower();
      }
    }
  }

  private rollThreat() {
    const roll = Math.random();

    if (roll < 0.4) {
      // J*b Laser
      this.activeThreat = {
        type: 'job_laser',
        timer: 0,
        duration: 3.7,
        state: 'warning',
      };
      sound.playLaserWarning();
      this.addToast('INCOMING J*B APPLICATION! STEP OFF THE RED TRAJECTORY!', 'warning');
    } else if (roll < 0.75) {
      // Touch Grass
      this.activeThreat = {
        type: 'touch_grass',
        timer: 0,
        duration: 5.5,
        state: 'active',
      };
      sound.playGrassRustle();
      this.addToast('TOXIC GRASS ERUPTING! JUMP ON THE VANITY OR TOILET!', 'warning');
    } else {
      // Deodorant / Shower flood
      this.activeThreat = {
        type: 'shower_flood',
        timer: 0,
        duration: 8.5,
        state: 'active',
      };
      this.isShowerRunning = true;
      this.showerFloodTimer = 0;
      sound.setShowerSound(true);
      sound.playHorrorStinger();
      this.addToast('SHOWER VALVE JAMMED! HOLD [E] ON THE VALVE TO SHUT IT OFF!', 'warning');
    }
  }

  private handleResize = () => {
    if (!this.canvasContainer) return;
    const w = this.canvasContainer.clientWidth;
    const h = this.canvasContainer.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);
    sound.dispose();
    this.bossManager.dispose();
    this.renderer.dispose();
  }
}
