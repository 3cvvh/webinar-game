import { Rect, KnightAction, InputState } from '../../types';
import { soundManager } from '../audio';
import { ParticleManager } from '../particles';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 38;
  public height: number = 60;
  
  // Stats
  public hp: number = 100;
  public maxHp: number = 100;
  public stamina: number = 100;
  public maxStamina: number = 100;
  
  // State
  public action: KnightAction = 'IDLE';
  public facingRight: boolean = true;
  public isGrounded: boolean = false;
  
  // Combat timers
  public attackTimer: number = 0;
  public attackDuration: number = 18; // frames
  public attackCooldown: number = 0;
  public attackDamage: number = 35;
  public comboStep: number = 0;
  
  public isBlocking: boolean = false;
  
  public isDodging: boolean = false;
  public dodgeTimer: number = 0;
  public dodgeDuration: number = 20; // frames
  public isInvulnerable: boolean = false;
  
  public hurtTimer: number = 0;
  public hurtDuration: number = 22;

  // Animation cycle
  public animFrame: number = 0;
  private animTimer: number = 0;

  // Constants
  private readonly moveSpeed = 4.2;
  private readonly jumpForce = -11.5;
  private readonly gravity = 0.58;

  // Jump & Double Jump system
  public maxJumps: number = 2;
  public jumpsLeft: number = 2;
  private prevJumpInput: boolean = false;

  // Safe ground checkpoint for void recovery
  public lastSafeGroundedX: number = 80;
  public lastSafeGroundedY: number = 380;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.lastSafeGroundedX = startX;
    this.lastSafeGroundedY = startY;
    this.jumpsLeft = this.maxJumps;
  }

  public reset(x: number, y: number, fullHeal = false) {
    this.x = x;
    this.y = y;
    this.lastSafeGroundedX = x;
    this.lastSafeGroundedY = y;
    this.vx = 0;
    this.vy = 0;
    this.action = 'IDLE';
    this.attackTimer = 0;
    this.isBlocking = false;
    this.isDodging = false;
    this.hurtTimer = 0;
    this.isInvulnerable = false;
    this.jumpsLeft = this.maxJumps;
    this.prevJumpInput = false;
    if (fullHeal) {
      this.hp = this.maxHp;
      this.stamina = this.maxStamina;
    }
  }

  public update(
    input: InputState,
    platforms: Rect[],
    particles: ParticleManager,
    worldWidth = 1600,
    worldHeight = 550
  ): void {
    if (this.hp <= 0) {
      this.action = 'DEAD';
      this.vy += this.gravity;
      this.y += this.vy;
      this.resolveVerticalCollisions(platforms);
      this.clampToBounds(worldWidth, worldHeight, particles);
      return;
    }

    this.animTimer++;
    if (this.animTimer % 6 === 0) {
      this.animFrame = (this.animFrame + 1) % 4;
    }

    // Passive stamina recovery
    if (!this.isBlocking && !this.isDodging && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 0.65);
    }

    // Cooldown decrements
    if (this.attackCooldown > 0) this.attackCooldown--;

    // 1. Hurt state handling
    if (this.hurtTimer > 0) {
      this.hurtTimer--;
      this.action = 'HURT';
      this.applyPhysics(platforms, worldWidth, worldHeight, particles);
      return;
    }

    // 2. Dodge roll handling
    if (this.isDodging) {
      this.dodgeTimer--;
      this.action = 'DODGE';
      this.isInvulnerable = true;
      this.vx = (this.facingRight ? 1 : -1) * (this.moveSpeed * 1.7);
      
      if (this.dodgeTimer % 4 === 0) {
        particles.emitDust(this.x + this.width / 2, this.y + this.height, 2);
      }

      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.isInvulnerable = false;
      }
      this.applyPhysics(platforms, worldWidth, worldHeight, particles);
      return;
    }

    // 3. Attack handling
    if (this.attackTimer > 0) {
      this.attackTimer--;
      this.action = 'ATTACK';
      // Slow down during attack
      this.vx *= 0.75;
      if (this.attackTimer <= 0) {
        this.attackCooldown = 8;
      }
      this.applyPhysics(platforms, worldWidth, worldHeight, particles);
      return;
    }

    // 4. Input handling: Dodge Roll
    if (input.dodge && this.isGrounded && this.stamina >= 25 && !this.isDodging) {
      this.isDodging = true;
      this.dodgeTimer = this.dodgeDuration;
      this.stamina -= 25;
      soundManager.playDodge();
      particles.emitDust(this.x + this.width / 2, this.y + this.height, 6);
      return;
    }

    // 5. Input handling: Shield Block
    if (input.block && this.stamina > 5) {
      this.isBlocking = true;
      this.action = 'BLOCK';
      this.vx = 0;
      this.stamina = Math.max(0, this.stamina - 0.25);
    } else {
      this.isBlocking = false;
    }

    // 6. Input handling: Attack
    if (input.attack && this.attackCooldown <= 0 && this.stamina >= 12 && !this.isBlocking) {
      this.attackTimer = this.attackDuration;
      this.comboStep = (this.comboStep + 1) % 2;
      this.stamina -= 12;
      soundManager.playSlash();
      this.action = 'ATTACK';
      return;
    }

    // 7. Movement & Jump (only if not blocking)
    if (!this.isBlocking) {
      if (input.left && !input.right) {
        this.vx = -this.moveSpeed;
        this.facingRight = false;
      } else if (input.right && !input.left) {
        this.vx = this.moveSpeed;
        this.facingRight = true;
      } else {
        this.vx = 0;
      }

      // Jump & Double Jump
      const jumpPressed = input.jump && !this.prevJumpInput;
      if (jumpPressed) {
        if (this.isGrounded) {
          this.vy = this.jumpForce;
          this.isGrounded = false;
          this.jumpsLeft = 1;
          soundManager.playJump();
          particles.emitDust(this.x + this.width / 2, this.y + this.height, 6);
        } else if (this.jumpsLeft > 0) {
          this.vy = this.jumpForce * 0.95;
          this.jumpsLeft = 0;
          soundManager.playDoubleJump();
          particles.emitDoubleJumpRing(this.x + this.width / 2, this.y + this.height);
        }
      }
    }

    // Determine current basic action
    if (!this.isGrounded) {
      this.action = this.vy < 0 ? 'JUMP' : 'FALL';
    } else if (this.isBlocking) {
      this.action = 'BLOCK';
    } else if (Math.abs(this.vx) > 0.1) {
      this.action = 'RUN';
      if (this.animTimer % 8 === 0) {
        particles.emitDust(this.x + this.width / 2, this.y + this.height, 1);
      }
    } else {
      this.action = 'IDLE';
    }

    this.applyPhysics(platforms, worldWidth, worldHeight, particles);
    this.prevJumpInput = input.jump;
  }

  private applyPhysics(
    platforms: Rect[],
    worldWidth: number,
    worldHeight: number,
    particles: ParticleManager
  ) {
    // Horizontal movement & collision
    this.x += this.vx;
    this.resolveHorizontalCollisions(platforms);

    // Gravity & Vertical movement
    this.vy += this.gravity;
    this.y += this.vy;
    this.resolveVerticalCollisions(platforms);

    // Enforce map boundary clamping & void recovery
    this.clampToBounds(worldWidth, worldHeight, particles);
  }

  private clampToBounds(worldWidth: number, worldHeight: number, particles: ParticleManager) {
    // 1. Left boundary: cannot move past x = 0
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }

    // 2. Right boundary: cannot move past worldWidth - width
    if (this.x + this.width > worldWidth) {
      this.x = worldWidth - this.width;
      this.vx = 0;
    }

    // 3. Top boundary: prevent jumping out of upper sky
    if (this.y < 0) {
      this.y = 0;
      if (this.vy < 0) this.vy = 0;
    }

    // 4. Record safe grounded platform coordinates
    if (this.isGrounded && this.y < worldHeight - 60) {
      this.lastSafeGroundedX = this.x;
      this.lastSafeGroundedY = this.y;
    }

    // 5. Bottom boundary / void recovery: falling beyond map floor
    if (this.y > worldHeight + 40 && this.hp > 0) {
      this.takeDamage(35, this.x, particles);
      this.x = this.lastSafeGroundedX;
      this.y = this.lastSafeGroundedY;
      this.vx = 0;
      this.vy = 0;
      particles.emitSparks(this.x + this.width / 2, this.y + this.height / 2, 12, '#38bdf8');
    }
  }

  private resolveHorizontalCollisions(platforms: Rect[]) {
    for (const plat of platforms) {
      if (this.checkOverlap(this.getBounds(), plat)) {
        if (this.vx > 0) {
          this.x = plat.x - this.width;
        } else if (this.vx < 0) {
          this.x = plat.x + plat.width;
        }
        this.vx = 0;
      }
    }
  }

  private resolveVerticalCollisions(platforms: Rect[]) {
    this.isGrounded = false;
    for (const plat of platforms) {
      if (this.checkOverlap(this.getBounds(), plat)) {
        if (this.vy > 0) {
          // Landing on platform
          this.y = plat.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
          this.jumpsLeft = this.maxJumps;
        } else if (this.vy < 0) {
          // Hitting ceiling
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

  public takeDamage(amount: number, fromX: number, particles: ParticleManager): boolean {
    if (this.hp <= 0 || this.isInvulnerable) return false;

    // Check if successfully blocking attack from front
    const isFacingAttacker = (this.facingRight && fromX > this.x) || (!this.facingRight && fromX < this.x);
    if (this.isBlocking && isFacingAttacker && this.stamina >= 10) {
      this.stamina = Math.max(0, this.stamina - 20);
      const reducedDamage = Math.max(2, Math.round(amount * 0.15));
      this.hp -= reducedDamage;
      soundManager.playBlock();
      particles.emitSparks(this.facingRight ? this.x + this.width + 5 : this.x - 5, this.y + 25, 8, '#38bdf8');
      particles.addDamageText(this.x + this.width / 2, this.y, reducedDamage, '#60a5fa', true);
      return false;
    }

    // Full hit
    this.hp = Math.max(0, this.hp - amount);
    this.hurtTimer = this.hurtDuration;
    this.vy = -4.5;
    this.vx = fromX > this.x ? -4.5 : 4.5;
    soundManager.playHit();
    particles.emitSparks(this.x + this.width / 2, this.y + 25, 10, '#ef4444');
    particles.addDamageText(this.x + this.width / 2, this.y, amount, '#ef4444');

    return true;
  }

  public getAttackHitbox(): Rect | null {
    if (this.action !== 'ATTACK') return null;
    // Active attack frames in the middle of swing
    if (this.attackTimer < 3 || this.attackTimer > 15) return null;

    const reach = 48;
    const hitHeight = 44;
    return {
      x: this.facingRight ? this.x + this.width - 5 : this.x - reach + 5,
      y: this.y + 8,
      width: reach,
      height: hitHeight
    };
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
    const screenX = this.x - cameraX;
    const screenY = this.y;

    ctx.save();

    // Flash white/red if hurt
    if (this.hurtTimer > 0 && Math.floor(this.hurtTimer / 3) % 2 === 0) {
      ctx.filter = 'brightness(2.2) sepia(1) saturate(5) hue-rotate(-50deg)';
    }

    // Ghost transparency during dodge roll
    if (this.isDodging) {
      ctx.globalAlpha = 0.55;
    }

    ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
    if (!this.facingRight) {
      ctx.scale(-1, 1);
    }

    // If dead: rotate on ground
    if (this.hp <= 0) {
      ctx.rotate(Math.PI / 2);
    }

    // Draw Knight Model
    this.drawKnightFigure(ctx);

    ctx.restore();

    // Render sword attack slash arc
    if (this.action === 'ATTACK' && this.attackTimer >= 4 && this.attackTimer <= 14) {
      this.drawSlashFx(ctx, screenX, screenY);
    }
  }

  private drawKnightFigure(ctx: CanvasRenderingContext2D) {
    const isAttacking = this.action === 'ATTACK';
    const isBlocking = this.action === 'BLOCK';
    const isRolling = this.action === 'DODGE';
    const isRunning = this.action === 'RUN';

    // Flowing blue cape (behind armor)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    const capeFlutter = isRunning ? Math.sin(this.animFrame * 1.5) * 6 : 0;
    ctx.moveTo(-8, -12);
    ctx.lineTo(-20 - capeFlutter, 18);
    ctx.lineTo(-6, 22);
    ctx.lineTo(-4, -12);
    ctx.closePath();
    ctx.fill();

    // Legs / Greaves
    const legOffset = isRunning ? Math.sin(this.animFrame * 1.5) * 5 : 0;
    ctx.fillStyle = '#475569';
    // Back leg
    ctx.fillRect(-8 + legOffset, 12, 6, 18);
    // Front leg
    ctx.fillStyle = '#64748b';
    ctx.fillRect(2 - legOffset, 12, 6, 18);
    // Sabatons (feet)
    ctx.fillStyle = '#334155';
    ctx.fillRect(-10 + legOffset, 26, 9, 5);
    ctx.fillRect(1 - legOffset, 26, 9, 5);

    // Torso / Steel Cuirass (Breastplate)
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.roundRect(-11, -12, 22, 24, 4);
    ctx.fill();

    // Breastplate trim & cross
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-1, -10, 2, 20);
    ctx.fillRect(-7, -4, 14, 2);

    // Blue royal tunic belt
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-11, 7, 22, 5);
    ctx.fillStyle = '#fbbf24'; // Gold buckle
    ctx.fillRect(-3, 6, 6, 7);

    // Helmet & Visor
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(-10, -28, 20, 17, 5);
    ctx.fill();

    // Visor eye slit
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(1, -22, 8, 3);

    // Red knight plume/crest
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-5, -28);
    ctx.quadraticCurveTo(-14, -36, -3, -33);
    ctx.lineTo(2, -28);
    ctx.closePath();
    ctx.fill();

    // Arms & Shield / Sword
    if (isBlocking) {
      // Shield raised forward
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      // Kite shield
      ctx.moveTo(6, -18);
      ctx.lineTo(19, -18);
      ctx.lineTo(19, 6);
      ctx.lineTo(12, 18);
      ctx.lineTo(6, 6);
      ctx.closePath();
      ctx.fill();

      // Golden shield crest border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shield emblem
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Normal shield held at side
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-14, -8, 7, 16, 2);
      ctx.fill();
    }

    // Sword in right hand
    if (isAttacking) {
      // Thrusting / slashing forward
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(10, -4, 24, 4); // Blade
      // Blade point
      ctx.beginPath();
      ctx.moveTo(34, -4);
      ctx.lineTo(38, -2);
      ctx.lineTo(34, 0);
      ctx.closePath();
      ctx.fill();
      // Guard & Hilt
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(8, -8, 3, 12);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(3, -3, 6, 2);
    } else if (!isRolling) {
      // Sword sheathed or resting down
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(10, 0, 4, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(7, -2, 10, 3);
    }
  }

  private drawSlashFx(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
    ctx.save();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();

    const cx = this.facingRight ? screenX + this.width + 10 : screenX - 10;
    const cy = screenY + 28;
    const radius = 28;

    if (this.facingRight) {
      ctx.arc(cx, cy, radius, -Math.PI * 0.45, Math.PI * 0.35);
    } else {
      ctx.arc(cx, cy, radius, Math.PI * 0.65, Math.PI * 1.45);
    }
    ctx.stroke();

    // Inner bright white highlight
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
