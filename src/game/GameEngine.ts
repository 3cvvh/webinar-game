import {
  StageId,
  GameStatus,
  InputState,
  Rect,
  StageConfig,
} from '../types';
import { STAGES } from './stages/StageData';
import { Player } from './entities/Player';
import { DragonEnemy } from './entities/DragonEnemy';
import { Projectile } from './entities/Projectile';
import { ParticleManager } from './particles';
import { soundManager } from './audio';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;

  // Game flow
  public currentStageId: StageId = 1;
  public currentStageConfig: StageConfig;
  public status: GameStatus = 'PLAYING';
  public isPaused: boolean = false;

  // Entities
  public player: Player;
  public enemies: DragonEnemy[] = [];
  public projectiles: Projectile[] = [];
  public particles: ParticleManager;

  // Camera
  public cameraX: number = 0;

  // Inputs
  public inputs: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    attack: false,
    block: false,
    dodge: false,
  };

  // Princess state
  public isPrincessSaved: boolean = false;
  public allEnemiesDefeated: boolean = false;
  private portalUnlockedNotified: boolean = false;

  // Animation frame loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private onStateChangeCallback?: (engine: GameEngine) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange?: (engine: GameEngine) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChangeCallback = onStateChange;
    this.particles = new ParticleManager();
    this.currentStageConfig = STAGES[this.currentStageId];
    this.player = new Player(80, 380);

    this.initStage(1, true);
    this.setupKeyboardListeners();
  }

  public setOnStateChange(cb: (engine: GameEngine) => void) {
    this.onStateChangeCallback = cb;
  }

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this);
    }
  }

  public initStage(stageId: StageId, isFullReset = false) {
    this.currentStageId = stageId;
    this.currentStageConfig = STAGES[stageId];
    this.status = 'PLAYING';
    this.projectiles = [];
    this.particles.clear();
    this.isPrincessSaved = false;
    this.allEnemiesDefeated = false;
    this.portalUnlockedNotified = false;

    // Reset player position at entrance
    this.player.reset(80, 380, isFullReset);

    // Spawn enemies from config
    this.enemies = this.currentStageConfig.enemies.map(
      (cfg) => new DragonEnemy(cfg.type, cfg.x, cfg.y, cfg.patrolRange)
    );

    this.notify();
  }

  public nextStage() {
    if (this.currentStageId < 3) {
      const nextId = (this.currentStageId + 1) as StageId;
      this.initStage(nextId, false);
      soundManager.playFanfare();
    } else {
      this.status = 'VICTORY';
      this.isPrincessSaved = true;
      soundManager.playFanfare();
      this.notify();
    }
  }

  public restartCurrentStage() {
    this.initStage(this.currentStageId, true);
  }

  public restartEntireGame() {
    this.initStage(1, true);
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.right = true;
          break;
        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
          this.inputs.jump = true;
          e.preventDefault();
          break;
        case 'KeyJ':
        case 'KeyZ':
          this.inputs.attack = true;
          break;
        case 'KeyK':
        case 'KeyX':
          this.inputs.block = true;
          break;
        case 'KeyL':
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.inputs.dodge = true;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyA':
        case 'ArrowLeft':
          this.inputs.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.inputs.right = false;
          break;
        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
          this.inputs.jump = false;
          break;
        case 'KeyJ':
        case 'KeyZ':
          this.inputs.attack = false;
          break;
        case 'KeyK':
        case 'KeyX':
          this.inputs.block = false;
          break;
        case 'KeyL':
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.inputs.dodge = false;
          break;
      }
    });
  }

  public start() {
    if (this.animationFrameId !== null) return;
    this.lastTime = performance.now();
    const loop = (currentTime: number) => {
      this.update();
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public update(): void {
    if (this.isPaused) return;

    if (this.status === 'PLAYING') {
      const allPlatforms = [
        ...this.currentStageConfig.platforms,
        ...this.currentStageConfig.hazards,
      ];

      // 1. Update Player with explicit Map Boundary Clamping
      this.player.update(
        this.inputs,
        this.currentStageConfig.platforms,
        this.particles,
        this.currentStageConfig.worldWidth,
        this.currentStageConfig.worldHeight
      );

      // Check player death
      if (this.player.hp <= 0) {
        this.status = 'GAME_OVER';
        soundManager.playHit();
        this.notify();
      }

      // Check hazards (lava, spikes)
      for (const haz of this.currentStageConfig.hazards) {
        if (this.checkOverlap(this.player.getBounds(), haz)) {
          this.player.takeDamage(40, this.player.x, this.particles);
          // Bounce up
          this.player.vy = -9;
        }
      }

      // 2. Player sword melee hit detection on enemies
      const swordHitbox = this.player.getAttackHitbox();
      if (swordHitbox) {
        for (const enemy of this.enemies) {
          if (!enemy.isDead && this.checkOverlap(swordHitbox, enemy.getBounds())) {
            enemy.takeDamage(this.player.attackDamage, this.particles);
          }
        }
      }

      // 3. Update Enemies (with map boundary enforcement)
      for (const enemy of this.enemies) {
        enemy.update(
          this.player,
          this.currentStageConfig.platforms,
          this.projectiles,
          this.particles
        );

        // Clamp enemies within world limits
        if (enemy.x < 10) {
          enemy.x = 10;
          enemy.facingRight = true;
        } else if (enemy.x + enemy.width > this.currentStageConfig.worldWidth - 10) {
          enemy.x = this.currentStageConfig.worldWidth - enemy.width - 10;
          enemy.facingRight = false;
        }
      }

      // 4. Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update();

        // Projectile hit player
        if (p.isAlive && p.isEnemy && this.checkOverlap(p.getBounds(), this.player.getBounds())) {
          this.player.takeDamage(p.damage, p.x, this.particles);
          p.isAlive = false;
        }

        // Projectile hit platforms
        for (const plat of this.currentStageConfig.platforms) {
          if (p.isAlive && this.checkOverlap(p.getBounds(), plat)) {
            p.isAlive = false;
            this.particles.emitSparks(p.x, p.y, 4, '#f59e0b');
          }
        }

        if (!p.isAlive) {
          this.projectiles.splice(i, 1);
        }
      }

      // 5. Update Particles
      this.particles.update();

      // 6. Camera tracking (Player centered horizontally)
      const targetCamX = this.player.x - this.canvas.width * 0.38;
      const maxCamX = Math.max(0, this.currentStageConfig.worldWidth - this.canvas.width);
      this.cameraX += (Math.max(0, Math.min(maxCamX, targetCamX)) - this.cameraX) * 0.1;

      // 7. Check Stage Completion conditions
      this.allEnemiesDefeated = this.enemies.every((e) => e.isDead);

      // Announce portal unlock once when all enemies are defeated (Stage 1 & 2)
      if (this.allEnemiesDefeated && !this.portalUnlockedNotified && this.currentStageId < 3) {
        this.portalUnlockedNotified = true;
        soundManager.playFanfare();
        this.particles.emitSparks(this.player.x + this.player.width / 2, this.player.y - 20, 25, '#38bdf8');
        this.notify();
      }

      if (this.currentStageId === 3) {
        // Stage 3 Boss fight
        const boss = this.enemies.find((e) => e.type === 'BOSS_ELDER');
        if (boss && boss.isDead && !this.isPrincessSaved) {
          // Check player walks over to the princess cage
          const princessPos = this.currentStageConfig.princessPosition || { x: 1080, y: 360 };
          const distToPrincess = Math.hypot(this.player.x - princessPos.x, this.player.y - princessPos.y);
          if (distToPrincess < 90) {
            this.status = 'VICTORY';
            this.isPrincessSaved = true;
            soundManager.playFanfare();
            this.particles.emitSparks(princessPos.x, princessPos.y, 35, '#ec4899');
            this.notify();
          }
        }
      } else {
        // Stage 1 & 2: Reach exit portal after defeating dragons, or reach the far right
        if (this.allEnemiesDefeated && this.player.x >= this.currentStageConfig.worldWidth - 110) {
          this.status = 'STAGE_CLEAR';
          soundManager.playFanfare();
          this.notify();
        }
      }
    }
  }

  public render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Parallax Sky Background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, this.currentStageConfig.skyGradient[0]);
    grad.addColorStop(1, this.currentStageConfig.skyGradient[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Parallax mountain / cavern backdrop
    this.renderParallaxBackdrop(ctx);

    // 2. Platforms & Hazards
    this.renderEnvironment(ctx);

    // 3. Exit Portal (Always visible in Stage 1 & 2 as dormant arch or active gate)
    if (this.currentStageId < 3) {
      this.renderExitPortal(ctx);
    }

    // 4. Princess & Cage (if Stage 3)
    if (this.currentStageId === 3 && this.currentStageConfig.princessPosition) {
      this.renderPrincess(ctx, this.currentStageConfig.princessPosition);
    }

    // 5. Enemies
    for (const enemy of this.enemies) {
      enemy.render(ctx, this.cameraX);
    }

    // 6. Player
    this.player.render(ctx, this.cameraX);

    // 7. Projectiles
    for (const p of this.projectiles) {
      p.render(ctx, this.cameraX);
    }

    // 8. Particles & Damage Numbers
    this.particles.render(ctx, this.cameraX);

    // 9. Stage Completion Guidance & Portal Waypoint HUD
    this.renderPortalGuidance(ctx);
  }

  private renderParallaxBackdrop(ctx: CanvasRenderingContext2D) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const bgOffset = this.cameraX * 0.2;

    if (this.currentStageId === 1) {
      // Distant forest silhouette
      ctx.fillStyle = 'rgba(22, 101, 52, 0.25)';
      for (let i = -100; i < w + 200; i += 70) {
        const x = i - (bgOffset % 70);
        ctx.beginPath();
        ctx.moveTo(x, h - 80);
        ctx.lineTo(x + 35, h - 220);
        ctx.lineTo(x + 70, h - 80);
        ctx.closePath();
        ctx.fill();
      }
    } else if (this.currentStageId === 2) {
      // Stalactites & cavern jagged rocks
      ctx.fillStyle = 'rgba(120, 53, 15, 0.3)';
      for (let i = -100; i < w + 200; i += 90) {
        const x = i - (bgOffset % 90);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 45, 140);
        ctx.lineTo(x + 90, 0);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Ruined castle pillars and banners
      ctx.fillStyle = 'rgba(88, 28, 135, 0.25)';
      for (let i = 0; i < 15; i++) {
        const x = i * 180 - bgOffset;
        ctx.fillRect(x, 60, 24, h - 140);
      }
    }
  }

  private renderEnvironment(ctx: CanvasRenderingContext2D) {
    // Render platforms
    for (const plat of this.currentStageConfig.platforms) {
      const screenX = plat.x - this.cameraX;

      // Platform body
      ctx.fillStyle = this.currentStageConfig.groundColor;
      ctx.fillRect(screenX, plat.y, plat.width, plat.height);

      // Top grass / stone trim highlight
      ctx.fillStyle =
        this.currentStageId === 1
          ? '#4ade80'
          : this.currentStageId === 2
          ? '#d97706'
          : '#818cf8';
      ctx.fillRect(screenX, plat.y, plat.width, 5);

      // Brick pattern texture
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x < plat.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(screenX + x, plat.y + 5);
        ctx.lineTo(screenX + x, plat.y + plat.height);
        ctx.stroke();
      }
    }

    // Render hazards (Lava pits in Stage 2)
    for (const haz of this.currentStageConfig.hazards) {
      const screenX = haz.x - this.cameraX;

      // Glowing bubbling lava
      const lavaGrad = ctx.createLinearGradient(screenX, haz.y, screenX, haz.y + haz.height);
      lavaGrad.addColorStop(0, '#f97316');
      lavaGrad.addColorStop(0.4, '#ef4444');
      lavaGrad.addColorStop(1, '#7f1d1d');

      ctx.fillStyle = lavaGrad;
      ctx.fillRect(screenX, haz.y, haz.width, haz.height);

      // Lava bubbling surface
      ctx.fillStyle = '#fef08a';
      const time = performance.now() * 0.005;
      for (let bx = 10; bx < haz.width; bx += 25) {
        const bubbleY = haz.y + Math.sin(time + bx) * 3;
        ctx.beginPath();
        ctx.arc(screenX + bx, bubbleY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Render visual boundary barrier cliffs (Left & Right World Edges)
    const leftScreenX = 0 - this.cameraX;
    const rightScreenX = this.currentStageConfig.worldWidth - this.cameraX;

    // Left border wall
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(leftScreenX - 40, 0, 40, this.canvas.height);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(leftScreenX, 0);
    ctx.lineTo(leftScreenX, this.canvas.height);
    ctx.stroke();

    // Right border wall
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(rightScreenX, 0, 50, this.canvas.height);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightScreenX, 0);
    ctx.lineTo(rightScreenX, this.canvas.height);
    ctx.stroke();
  }

  private renderExitPortal(ctx: CanvasRenderingContext2D) {
    const portalWorldX = this.currentStageConfig.worldWidth - 70;
    const portalX = portalWorldX - this.cameraX;
    const portalY = 400;
    const time = performance.now() * 0.003;
    const isUnlocked = this.enemies.every((e) => e.isDead);

    ctx.save();

    if (isUnlocked) {
      // 1. Sky Beam of Light shooting upwards
      const beamGrad = ctx.createLinearGradient(0, portalY, 0, 0);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      beamGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.2)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(portalX - 35, 0, 70, portalY);

      // 2. Swirling Active Portal Vortex
      const grad = ctx.createRadialGradient(portalX, portalY, 5, portalX, portalY, 44);
      grad.addColorStop(0, '#a5f3fc');
      grad.addColorStop(0.45, '#38bdf8');
      grad.addColorStop(0.85, '#6366f1');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(portalX, portalY, 44 + Math.sin(time * 3) * 5, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing concentric ripple rings
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const ringR = 20 + ((time * 20) % 25);
      ctx.arc(portalX, portalY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Golden archway with ancient runes
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 5;
      ctx.strokeRect(portalX - 26, portalY - 48, 52, 86);

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(portalX - 30, portalY - 52, 60, 6);

      // Floating guidance badge right above portal
      const bounce = Math.sin(time * 3.5) * 6;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(portalX - 75, portalY - 88 + bounce, 150, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#38bdf8';
      ctx.textAlign = 'center';
      ctx.fillText('▼ MASUK KE PORTAL ▼', portalX, portalY - 71 + bounce);
    } else {
      // Dormant locked portal
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(portalX - 22, portalY - 42, 44, 78);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(portalX - 22, portalY - 42, 44, 78);

      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText('🔒 TERKUNCI', portalX, portalY - 50);
    }

    ctx.restore();
  }

  private renderPortalGuidance(ctx: CanvasRenderingContext2D) {
    if (this.status !== 'PLAYING') return;

    const time = performance.now() * 0.003;
    const isStage1or2 = this.currentStageId < 3;
    const allDead = this.enemies.every((e) => e.isDead);

    // Determine guidance target
    let targetWorldX = 0;
    let label = '';
    let badgeColor = '#38bdf8';

    if (isStage1or2 && allDead) {
      targetWorldX = this.currentStageConfig.worldWidth - 70;
      label = 'PORTAL TERBUKA';
      badgeColor = '#38bdf8';
    } else if (this.currentStageId === 3) {
      const boss = this.enemies.find((e) => e.type === 'BOSS_ELDER');
      if (boss && boss.isDead && !this.isPrincessSaved) {
        targetWorldX = this.currentStageConfig.princessPosition?.x || 1080;
        label = 'BEBASKAN PUTRI';
        badgeColor = '#ec4899';
      }
    }

    if (targetWorldX === 0) return;

    const targetScreenX = targetWorldX - this.cameraX;
    const distPx = targetWorldX - this.player.x;
    const distMeters = Math.max(1, Math.round(Math.abs(distPx) / 16));

    ctx.save();

    // 1. Floating pointer badge over Player's head
    if (Math.abs(distPx) > 110) {
      const playerScreenX = this.player.x - this.cameraX + this.player.width / 2;
      const playerScreenY = this.player.y - 34 + Math.sin(time * 4) * 3;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(playerScreenX - 65, playerScreenY - 14, 130, 24, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const arrowIcon = distPx > 0 ? '➔' : '⬅';
      ctx.fillText(`${arrowIcon} ${label} (${distMeters}m)`, playerScreenX, playerScreenY + 2);
    }

    // 2. Off-screen pinned HUD beacon (if target is beyond right edge of view)
    if (targetScreenX > this.canvas.width - 70) {
      const hudX = this.canvas.width - 155;
      const hudY = 115 + Math.sin(time * 3) * 4;

      ctx.shadowColor = badgeColor;
      ctx.shadowBlur = 10;

      const grad = ctx.createLinearGradient(hudX, 0, hudX + 145, 0);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
      grad.addColorStop(1, 'rgba(30, 58, 138, 0.92)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, 145, 44, 8);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = badgeColor;
      ctx.textAlign = 'left';
      ctx.fillText(label, hudX + 12, hudY + 18);

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#f8fafc';
      const chevronStep = Math.floor((time * 6) % 3);
      const chevron = chevronStep === 0 ? '❯  ' : chevronStep === 1 ? '❯❯ ' : '❯❯❯';
      ctx.fillText(`${distMeters}m ${chevron}`, hudX + 12, hudY + 34);
    }

    ctx.restore();
  }

  private renderPrincess(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
    const screenX = pos.x - this.cameraX;
    const screenY = pos.y;
    const time = performance.now() * 0.004;

    ctx.save();
    // Magical cage bars if not saved
    if (!this.isPrincessSaved) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.strokeRect(screenX - 25, screenY - 20, 50, 75);
      // Cage bars
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.lineWidth = 2;
      for (let bx = -15; bx <= 15; bx += 10) {
        ctx.beginPath();
        ctx.moveTo(screenX + bx, screenY - 20);
        ctx.lineTo(screenX + bx, screenY + 55);
        ctx.stroke();
      }
    }

    // Princess character
    // Golden hair
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(screenX, screenY + 6, 12, 0, Math.PI * 2);
    ctx.fill();

    // Face
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(screenX, screenY + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Crown
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(screenX - 7, screenY);
    ctx.lineTo(screenX - 7, screenY - 6);
    ctx.lineTo(screenX - 3, screenY - 2);
    ctx.lineTo(screenX, screenY - 7);
    ctx.lineTo(screenX + 3, screenY - 2);
    ctx.lineTo(screenX + 7, screenY - 6);
    ctx.lineTo(screenX + 7, screenY);
    ctx.closePath();
    ctx.fill();

    // Pink royal dress
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(screenX, screenY + 16);
    ctx.lineTo(screenX - 16, screenY + 48);
    ctx.lineTo(screenX + 16, screenY + 48);
    ctx.closePath();
    ctx.fill();

    // Floating heart or praise
    if (this.isPrincessSaved) {
      ctx.fillStyle = '#ec4899';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤ TERIMA KASIH, KSATRIA! ❤', screenX, screenY - 25 + Math.sin(time) * 4);
    }

    ctx.restore();
  }

  private checkOverlap(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }
}
