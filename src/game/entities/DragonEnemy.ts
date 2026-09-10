import { Rect, DragonType } from '../../types';
import { Player } from './Player';
import { Projectile } from './Projectile';
import { ParticleManager } from '../particles';
import { soundManager } from '../audio';

export type DragonAIState = 'PATROL' | 'CHASE' | 'TELEGRAPH' | 'ATTACK' | 'COOLDOWN' | 'HURT' | 'DEAD';

export class DragonEnemy {
  public type: DragonType;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number;
  public height: number;

  // Health
  public hp: number;
  public maxHp: number;
  public isDead: boolean = false;
  
  // AI State Machine
  public state: DragonAIState = 'PATROL';
  public facingRight: boolean = false;
  public stateTimer: number = 0;
  public attackCooldown: number = 0;
  
  // Patrol limits
  public patrolStartX: number;
  public patrolRange: number;

  // Boss specific
  public bossPhase: 1 | 2 = 1;
  public bossAttackPattern: 'MELEE' | 'FIRE_BREATH' | 'METEOR_RAIN' | 'FLY_SLAM' = 'MELEE';

  // Animation frame
  public animFrame: number = 0;
  private animTimer: number = 0;

  constructor(type: DragonType, x: number, y: number, patrolRange = 120) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.patrolStartX = x;
    this.patrolRange = patrolRange;

    if (type === 'HATCHLING') {
      this.width = 44;
      this.height = 36;
      this.maxHp = 60;
      this.hp = 60;
    } else if (type === 'FLYING_WYVERN') {
      this.width = 54;
      this.height = 42;
      this.maxHp = 90;
      this.hp = 90;
    } else {
      // BOSS_ELDER
      this.width = 110;
      this.height = 85;
      this.maxHp = 420;
      this.hp = 420;
    }
  }

  public update(
    player: Player,
    platforms: Rect[],
    projectiles: Projectile[],
    particles: ParticleManager
  ): void {
    if (this.isDead) return;

    this.animTimer++;
    if (this.animTimer % 7 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    // Route to specific dragon AI logic
    if (this.type === 'HATCHLING') {
      this.updateHatchlingAI(player, platforms, particles);
    } else if (this.type === 'FLYING_WYVERN') {
      this.updateFlyingWyvernAI(player, projectiles, particles);
    } else {
      this.updateElderBossAI(player, platforms, projectiles, particles);
    }
  }

  // ==========================================
  // STAGE 1: HATCHLING DRAGON AI
  // ==========================================
  private updateHatchlingAI(player: Player, platforms: Rect[], particles: ParticleManager) {
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const speed = 1.6;

    // Apply gravity
    this.vy += 0.55;
    this.y += this.vy;
    this.resolveVerticalCollisions(platforms);

    // AI State Transitions
    switch (this.state) {
      case 'PATROL': {
        // Move back and forth in patrol bounds
        this.vx = this.facingRight ? speed : -speed;
        if (this.x > this.patrolStartX + this.patrolRange) {
          this.facingRight = false;
        } else if (this.x < this.patrolStartX - this.patrolRange) {
          this.facingRight = true;
        }

        // Detection check: if player comes within 180px, switch to CHASE
        if (distToPlayer < 190 && Math.abs(player.y - this.y) < 70) {
          this.state = 'CHASE';
        }
        break;
      }

      case 'CHASE': {
        // Run towards player
        this.facingRight = player.x > this.x;
        this.vx = this.facingRight ? speed * 1.3 : -speed * 1.3;

        // If player is within melee attack reach (50px), prepare attack
        if (distToPlayer < 52 && this.attackCooldown <= 0) {
          this.state = 'TELEGRAPH';
          this.stateTimer = 16; // telegraph windup
          this.vx = 0;
        }

        // If player runs too far away, return to patrol
        if (distToPlayer > 260) {
          this.state = 'PATROL';
        }
        break;
      }

      case 'TELEGRAPH': {
        this.vx = 0;
        this.stateTimer--;
        // Sparks/smoke cue
        if (this.stateTimer % 5 === 0) {
          particles.emitFire(this.facingRight ? this.x + this.width : this.x, this.y + 10, 1, this.facingRight ? 1 : -1);
        }
        if (this.stateTimer <= 0) {
          this.state = 'ATTACK';
          this.stateTimer = 14;
          // Quick bite lunge
          this.vx = (this.facingRight ? 1 : -1) * 3.5;
        }
        break;
      }

      case 'ATTACK': {
        this.stateTimer--;
        // Check collision with player
        const biteBox = {
          x: this.facingRight ? this.x + this.width - 5 : this.x - 20,
          y: this.y + 5,
          width: 25,
          height: 25
        };

        if (this.checkOverlap(biteBox, player.getBounds())) {
          player.takeDamage(16, this.x, particles);
        }

        if (this.stateTimer <= 0) {
          this.state = 'COOLDOWN';
          this.stateTimer = 40;
          this.attackCooldown = 50;
        }
        break;
      }

      case 'COOLDOWN': {
        this.vx = 0;
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'CHASE';
        }
        break;
      }

      case 'HURT': {
        this.stateTimer--;
        this.vx *= 0.85;
        if (this.stateTimer <= 0) {
          this.state = 'CHASE';
        }
        break;
      }
    }

    this.x += this.vx;
    this.resolveHorizontalCollisions(platforms);
  }

  // ==========================================
  // STAGE 2: FLYING WYVERN AI
  // ==========================================
  private updateFlyingWyvernAI(player: Player, projectiles: Projectile[], particles: ParticleManager) {
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    this.facingRight = player.x > this.x;

    // Smooth hover bobbing
    const hoverY = this.patrolStartX + Math.sin(this.animTimer * 0.05) * 20;

    switch (this.state) {
      case 'PATROL':
      case 'CHASE': {
        // Fly towards player hover position (maintain altitude above player)
        const targetX = player.x + (this.facingRight ? -140 : 140);
        const targetY = player.y - 75;

        this.vx += (targetX - this.x) * 0.03;
        this.vy += (targetY - this.y) * 0.03;
        this.vx *= 0.92;
        this.vy *= 0.92;

        // Shoot fireballs when in range
        if (distToPlayer < 350 && this.attackCooldown <= 0) {
          this.state = 'TELEGRAPH';
          this.stateTimer = 22; // Charge fireball
        }
        break;
      }

      case 'TELEGRAPH': {
        this.vx *= 0.8;
        this.vy *= 0.8;
        this.stateTimer--;
        // Charging fire particles at mouth
        const mouthX = this.facingRight ? this.x + this.width : this.x;
        particles.emitFire(mouthX, this.y + 12, 2, this.facingRight ? 1 : -1);

        if (this.stateTimer <= 0) {
          this.state = 'ATTACK';
          this.stateTimer = 10;
          // Shoot fireball towards player
          const angle = Math.atan2(player.y - this.y, player.x - this.x);
          const speed = 5.2;
          projectiles.push(
            new Projectile(
              mouthX,
              this.y + 12,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              18,
              true,
              9
            )
          );
          soundManager.playFireball();
        }
        break;
      }

      case 'ATTACK': {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'COOLDOWN';
          this.stateTimer = 55;
          this.attackCooldown = 70;
        }
        break;
      }

      case 'COOLDOWN': {
        this.stateTimer--;
        // Reposition backward away from player while recovering
        const retreatDir = this.facingRight ? -1 : 1;
        this.vx = retreatDir * 1.8;
        this.vy = -1.2;
        if (this.stateTimer <= 0) {
          this.state = 'CHASE';
        }
        break;
      }

      case 'HURT': {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'CHASE';
        }
        break;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  // ==========================================
  // STAGE 3: ELDER DRAGON BOSS (2 PHASES)
  // ==========================================
  private updateElderBossAI(
    player: Player,
    platforms: Rect[],
    projectiles: Projectile[],
    particles: ParticleManager
  ) {
    // Check phase transition: under 50% HP triggers Phase 2
    if (this.hp <= this.maxHp * 0.5 && this.bossPhase === 1) {
      this.bossPhase = 2;
      soundManager.playDragonRoar();
      particles.emitFire(this.x + this.width / 2, this.y + this.height / 2, 35);
    }

    this.facingRight = player.x > this.x;
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // Boss gravity
    this.vy += 0.5;
    this.y += this.vy;
    this.resolveVerticalCollisions(platforms);

    switch (this.state) {
      case 'PATROL':
      case 'CHASE': {
        const speed = this.bossPhase === 2 ? 2.4 : 1.5;
        this.vx = this.facingRight ? speed : -speed;

        if (this.attackCooldown <= 0) {
          // Select attack pattern based on distance & phase
          const rand = Math.random();
          if (distToPlayer < 90) {
            this.bossAttackPattern = 'MELEE';
          } else if (this.bossPhase === 2 && rand > 0.45) {
            this.bossAttackPattern = 'METEOR_RAIN';
          } else {
            this.bossAttackPattern = 'FIRE_BREATH';
          }

          this.state = 'TELEGRAPH';
          this.stateTimer = this.bossPhase === 2 ? 22 : 32;
          this.vx = 0;
        }
        break;
      }

      case 'TELEGRAPH': {
        this.vx = 0;
        this.stateTimer--;
        const mouthX = this.facingRight ? this.x + this.width : this.x;
        // Boss eye flash & mouth sparks
        particles.emitFire(mouthX, this.y + 20, this.bossPhase === 2 ? 4 : 2, this.facingRight ? 1 : -1);

        if (this.stateTimer <= 0) {
          this.state = 'ATTACK';
          this.stateTimer = this.bossAttackPattern === 'FIRE_BREATH' ? 30 : 20;

          if (this.bossAttackPattern === 'FIRE_BREATH') {
            soundManager.playDragonRoar();
            // Shoot multiple spread fireballs
            const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
            const spreadCount = this.bossPhase === 2 ? 3 : 2;
            for (let i = 0; i < spreadCount; i++) {
              const spread = (i - (spreadCount - 1) / 2) * 0.22;
              const angle = baseAngle + spread;
              projectiles.push(
                new Projectile(
                  mouthX,
                  this.y + 20,
                  Math.cos(angle) * 5.8,
                  Math.sin(angle) * 5.8,
                  24,
                  true,
                  12
                )
              );
            }
          } else if (this.bossAttackPattern === 'METEOR_RAIN') {
            soundManager.playDragonRoar();
            // Phase 2 special: Fire rain from above
            for (let i = 0; i < 5; i++) {
              setTimeout(() => {
                projectiles.push(
                  new Projectile(
                    player.x + (Math.random() - 0.5) * 260,
                    this.y - 180,
                    (Math.random() - 0.5) * 1.5,
                    5.5,
                    20,
                    true,
                    10
                  )
                );
              }, i * 140);
            }
          } else if (this.bossAttackPattern === 'MELEE') {
            // Heavy ground claw sweep
            this.vx = (this.facingRight ? 1 : -1) * (this.bossPhase === 2 ? 6.5 : 4.5);
            soundManager.playSlash();
          }
        }
        break;
      }

      case 'ATTACK': {
        this.stateTimer--;
        if (this.bossAttackPattern === 'MELEE') {
          const clawBox = {
            x: this.facingRight ? this.x + this.width - 10 : this.x - 35,
            y: this.y + 15,
            width: 45,
            height: 55
          };
          if (this.checkOverlap(clawBox, player.getBounds())) {
            player.takeDamage(this.bossPhase === 2 ? 30 : 22, this.x, particles);
          }
        }

        if (this.stateTimer <= 0) {
          this.state = 'COOLDOWN';
          this.stateTimer = this.bossPhase === 2 ? 35 : 55;
          this.attackCooldown = this.bossPhase === 2 ? 45 : 70;
        }
        break;
      }

      case 'COOLDOWN': {
        this.vx = 0;
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'CHASE';
        }
        break;
      }

      case 'HURT': {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'CHASE';
        }
        break;
      }
    }

    this.x += this.vx;
    this.resolveHorizontalCollisions(platforms);
  }

  private resolveHorizontalCollisions(platforms: Rect[]) {
    for (const plat of platforms) {
      if (this.checkOverlap(this.getBounds(), plat)) {
        if (this.vx > 0) {
          this.x = plat.x - this.width;
          this.facingRight = false;
        } else if (this.vx < 0) {
          this.x = plat.x + plat.width;
          this.facingRight = true;
        }
        this.vx = 0;
      }
    }
  }

  private resolveVerticalCollisions(platforms: Rect[]) {
    for (const plat of platforms) {
      if (this.checkOverlap(this.getBounds(), plat)) {
        if (this.vy > 0) {
          this.y = plat.y - this.height;
          this.vy = 0;
        } else if (this.vy < 0) {
          this.y = plat.y + plat.height;
          this.vy = 0;
        }
      }
    }
  }

  private checkOverlap(r1: Rect, r2: Rect): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  public takeDamage(amount: number, particles: ParticleManager): void {
    if (this.isDead) return;

    this.hp -= amount;
    this.state = 'HURT';
    this.stateTimer = 14;

    particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 8, '#f59e0b');
    particles.addDamageText(this.x + this.width / 2, this.y, amount, '#fbbf24');

    if (this.hp <= 0) {
      this.isDead = true;
      this.state = 'DEAD';
      soundManager.playDragonRoar();
      particles.emitFire(this.x + this.width / 2, this.y + this.height / 2, 20);
    }
  }

  public getBounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    if (this.isDead) return;

    const screenX = this.x - cameraX;
    const screenY = this.y;

    ctx.save();
    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    // White flash when hurt
    if (this.state === 'HURT' && Math.floor(this.stateTimer / 2) % 2 === 0) {
      ctx.filter = 'brightness(2.5)';
    }

    if (this.type === 'HATCHLING') {
      this.renderHatchling(ctx);
    } else if (this.type === 'FLYING_WYVERN') {
      this.renderFlyingWyvern(ctx);
    } else {
      this.renderElderBoss(ctx);
    }

    ctx.restore();

    // Render Mini HP bar over non-boss enemies
    if (this.type !== 'BOSS_ELDER') {
      const barW = this.width + 10;
      const barH = 5;
      const barX = screenX - 5;
      const barY = screenY - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(barX, barY, Math.max(0, (this.hp / this.maxHp) * barW), barH);
    }
  }

  private renderHatchling(ctx: CanvasRenderingContext2D) {
    // Small green dragon
    ctx.fillStyle = '#15803d'; // Forest green body
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(12, -6, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.lineTo(6, -18);
    ctx.lineTo(13, -13);
    ctx.closePath();
    ctx.fill();

    // Glowing yellow eye
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(15, -7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-14, 2);
    ctx.quadraticCurveTo(-24, 0, -22, -8);
    ctx.stroke();

    // Feet
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-8, 8, 6, 8);
    ctx.fillRect(4, 8, 6, 8);
  }

  private renderFlyingWyvern(ctx: CanvasRenderingContext2D) {
    // Crimson flying drake with wings flapping
    const wingFlap = Math.sin(this.animTimer * 0.25) * 16;

    // Wings
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(-4, -6);
    ctx.lineTo(6, -26 + wingFlap);
    ctx.lineTo(-18, -18 + wingFlap * 0.5);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head & Snout
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(16, -4, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crimson horns
    ctx.fillStyle = '#450a0a';
    ctx.beginPath();
    ctx.moveTo(14, -10);
    ctx.lineTo(9, -20);
    ctx.lineTo(17, -12);
    ctx.closePath();
    ctx.fill();

    // Fiery eye
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(20, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Long spiky tail
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.quadraticCurveTo(-32, -4, -36, 8);
    ctx.stroke();
  }

  private renderElderBoss(ctx: CanvasRenderingContext2D) {
    const isP2 = this.bossPhase === 2;

    // Enraged fire aura in Phase 2
    if (isP2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 60, 45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Wings flapping
    const wingAngle = Math.sin(this.animTimer * 0.15) * 14;
    ctx.fillStyle = isP2 ? '#7f1d1d' : '#312e81'; // Phase 2 turns burning obsidian crimson
    ctx.beginPath();
    ctx.moveTo(-10, -20);
    ctx.lineTo(-5, -60 + wingAngle);
    ctx.lineTo(35, -55 + wingAngle);
    ctx.lineTo(15, -15);
    ctx.closePath();
    ctx.fill();

    // Massive torso
    ctx.fillStyle = isP2 ? '#991b1b' : '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(0, 5, 45, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chest scales / underbelly (golden glowing)
    ctx.fillStyle = isP2 ? '#f97316' : '#d97706';
    ctx.beginPath();
    ctx.ellipse(10, 8, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Massive dragon head & neck
    ctx.fillStyle = isP2 ? '#b91c1c' : '#312e81';
    ctx.beginPath();
    ctx.ellipse(36, -14, 25, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout & jaw
    ctx.fillStyle = isP2 ? '#7f1d1d' : '#1e1b4b';
    ctx.fillRect(45, -14, 18, 14);

    // Sharp white teeth
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(48 + i * 4, -4);
      ctx.lineTo(50 + i * 4, 1);
      ctx.lineTo(52 + i * 4, -4);
      ctx.closePath();
      ctx.fill();
    }

    // Large menacing horns
    ctx.fillStyle = isP2 ? '#f59e0b' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(30, -26);
    ctx.lineTo(24, -48);
    ctx.lineTo(36, -30);
    ctx.closePath();
    ctx.fill();

    // Glowing Dragon eye
    ctx.fillStyle = isP2 ? '#fef08a' : '#ef4444';
    ctx.beginPath();
    ctx.arc(44, -17, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Claws / Legs
    ctx.fillStyle = isP2 ? '#7f1d1d' : '#1e1b4b';
    ctx.fillRect(-24, 25, 16, 20);
    ctx.fillRect(14, 25, 18, 20);

    // Talon spikes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-28, 41, 6, 5);
    ctx.fillRect(28, 41, 6, 5);

    // Spiked tail
    ctx.strokeStyle = isP2 ? '#991b1b' : '#1e1b4b';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-40, 10);
    ctx.quadraticCurveTo(-65, 0, -60, -20);
    ctx.stroke();
  }
}
