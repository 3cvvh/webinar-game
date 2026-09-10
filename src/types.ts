export type StageId = 1 | 2 | 3;

export type GameStatus = 'MENU' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY';

export type KnightAction = 
  | 'IDLE' 
  | 'RUN' 
  | 'JUMP' 
  | 'FALL' 
  | 'ATTACK' 
  | 'BLOCK' 
  | 'DODGE' 
  | 'HURT' 
  | 'DEAD';

export type DragonType = 'HATCHLING' | 'FLYING_WYVERN' | 'BOSS_ELDER';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  block: boolean;
  dodge: boolean;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  isCrit?: boolean;
  isBlocked?: boolean;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
}

export interface Platform extends Rect {
  type?: 'SOLID' | 'ONE_WAY' | 'LAVA' | 'SPIKES';
}

export interface StageConfig {
  id: StageId;
  name: string;
  subtitle: string;
  worldWidth: number;
  worldHeight: number;
  ambientColor: string;
  skyGradient: [string, string];
  groundColor: string;
  hazards: Platform[];
  platforms: Platform[];
  enemies: {
    type: DragonType;
    x: number;
    y: number;
    patrolRange?: number;
  }[];
  princessPosition?: Vector2D;
  objective: string;
}
