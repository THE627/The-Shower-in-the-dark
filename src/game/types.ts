export type GameLevel = 1 | 2;

export type GameStatus = 'intro' | 'playing' | 'paused' | 'gameover' | 'victory';

export interface PlayerStats {
  hp: number;
  maxHp: number;
  exp: number;
  level: GameLevel;
  hasKnife: boolean;
  score: number;
  threatsDodged: number;
  bossesDefeated: number;
  candyCount: number;
  doorsKnocked: number;
  timeSurvived: number;
}

export type ThreatType = 'none' | 'job_laser' | 'touch_grass' | 'shower_flood';

export interface ActiveThreat {
  type: ThreatType;
  timer: number;
  duration: number;
  state: 'warning' | 'active' | 'cleared';
  laserStartX?: number;
  laserStartZ?: number;
  laserEndX?: number;
  laserEndZ?: number;
  laserProgress?: number;
}

export interface BossEntity {
  id: string;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  phase: number;
  active: boolean;
  type: 'hygiene' | 'verity' | 'sahur' | 'jobity';
}

export interface DoorInteraction {
  houseIndex: number;
  houseName: string;
  knockProgress: number; // 0 to 1
  isKnocking: boolean;
  hasBeenVisited: boolean;
  cooldown: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'treat' | 'job' | 'dodge' | 'warning' | 'info';
  duration: number;
}
