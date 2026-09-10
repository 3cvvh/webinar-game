import { Rect } from '../../types';

export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public damage: number;
  public isEnemy: boolean;
  public isAlive: boolean = true;
  public maxLife: number = 240;
  public life: number = 0;
  public trailTimer: number = 0;

  constructor(x: number, y: number, vx: number, vy: number, damage = 15, isEnemy = true, radius = 9) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isEnemy = isEnemy;
    this.radius = radius;
  }

  public update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    this.trailTimer++;

    if (this.life >= this.maxLife) {
      this.isAlive = false;
    }
  }

  public getBounds(): Rect {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;
    
    ctx.save();
    // Outer glow
    const grad = ctx.createRadialGradient(screenX, this.y, 1, screenX, this.y, this.radius * 1.8);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#fef08a');
    grad.addColorStop(0.6, '#f97316');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(screenX, this.y, this.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.arc(screenX, this.y, this.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
