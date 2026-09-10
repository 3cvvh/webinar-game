import { Particle, DamageNumber } from '../types';

export class ParticleManager {
  private particles: Particle[] = [];
  private damageNumbers: DamageNumber[] = [];

  public emitDust(x: number, y: number, count = 5) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 2,
        radius: Math.random() * 3 + 2,
        color: '#94a3b8',
        alpha: 0.7,
        life: 0,
        maxLife: 20 + Math.random() * 10,
        gravity: 0.05
      });
    }
  }

  public emitDoubleJumpRing(x: number, y: number) {
    // Shimmering cyan & white magic burst under boots
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const speed = Math.random() * 3 + 2.5;
      this.particles.push({
        x: x + Math.cos(angle) * 8,
        y: y + Math.sin(angle) * 3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * 1.5 + 0.5,
        radius: Math.random() * 2.5 + 2,
        color: i % 2 === 0 ? '#38bdf8' : '#ffffff',
        alpha: 0.9,
        life: 0,
        maxLife: 18 + Math.random() * 10,
        gravity: 0.08
      });
    }
  }

  public emitSparks(x: number, y: number, count = 8, color = '#f59e0b') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2.5 + 1.5,
        color,
        alpha: 1,
        life: 0,
        maxLife: 15 + Math.random() * 15,
        gravity: 0.15
      });
    }
  }

  public emitFire(x: number, y: number, count = 6, dirX = 0) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: dirX * (Math.random() * 3 + 2) + (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 3 - 1,
        radius: Math.random() * 5 + 3,
        color: Math.random() > 0.4 ? '#ef4444' : '#f59e0b',
        alpha: 0.8,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        gravity: -0.05
      });
    }
  }

  public addDamageText(x: number, y: number, value: number, color = '#ffffff', isBlocked = false) {
    this.damageNumbers.push({
      id: Math.random().toString(),
      x: x + (Math.random() - 0.5) * 20,
      y: y - 10,
      value,
      color,
      isBlocked,
      life: 0,
      maxLife: 45
    });
  }

  public update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life++;
      d.y -= 0.8;
      if (d.life >= d.maxLife) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, cameraX: number) {
    // Draw particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - cameraX, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw damage numbers
    for (const d of this.damageNumbers) {
      const progress = d.life / d.maxLife;
      const alpha = Math.max(0, 1 - progress);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillStyle = d.color;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      const text = d.isBlocked ? 'BLOCKED!' : `-${Math.round(d.value)}`;
      ctx.strokeText(text, d.x - cameraX, d.y);
      ctx.fillText(text, d.x - cameraX, d.y);
      ctx.restore();
    }
  }

  public clear() {
    this.particles = [];
    this.damageNumbers = [];
  }
}
