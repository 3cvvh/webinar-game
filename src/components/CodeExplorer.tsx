import { useState } from 'react';
import { Copy, Check, Code2, Shield, Bot, Compass } from 'lucide-react';

export function CodeExplorer() {
  const [activeTab, setActiveTab] = useState<'PLAYER' | 'AI' | 'STAGE'>('PLAYER');
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playerCode = `// =========================================================================
// 1. MEKANIK INPUT & PERGERAKAN KSATRIA (Player.ts)
// Mendukung: Walk, Jump (Physics), Attack Combo, Shield Block, Dodge Roll (i-frames)
// =========================================================================

export type KnightAction = 'IDLE' | 'RUN' | 'JUMP' | 'FALL' | 'ATTACK' | 'BLOCK' | 'DODGE' | 'HURT' | 'DEAD';

export class Player {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 38;
  public height: number = 60;

  // Status Karakter
  public hp: number = 100;
  public stamina: number = 100;
  public action: KnightAction = 'IDLE';
  public facingRight: boolean = true;
  public isGrounded: boolean = false;

  // Invulnerability Frames (i-frames) saat berguling
  public isDodging: boolean = false;
  public isInvulnerable: boolean = false;
  public dodgeTimer: number = 0;
  private readonly dodgeDuration = 20;

  // Pertahanan Perisai (Block)
  public isBlocking: boolean = false;

  // Serangan Pedang (Attack)
  public attackTimer: number = 0;
  public attackCooldown: number = 0;
  public attackDamage: number = 35;

  // Konstanta Fisika
  private readonly moveSpeed = 4.2;
  private readonly jumpForce = -11.5;
  private readonly gravity = 0.58;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  public update(input: InputState, platforms: Rect[]): void {
    if (this.hp <= 0) {
      this.action = 'DEAD';
      return;
    }

    // 1. Regenerasi stamina alami
    if (!this.isBlocking && !this.isDodging && this.stamina < 100) {
      this.stamina = Math.min(100, this.stamina + 0.65);
    }
    if (this.attackCooldown > 0) this.attackCooldown--;

    // 2. State: Guling Menghindar (Dodge Roll dengan I-Frames)
    if (this.isDodging) {
      this.dodgeTimer--;
      this.isInvulnerable = true;
      this.vx = (this.facingRight ? 1 : -1) * (this.moveSpeed * 1.7);
      if (this.dodgeTimer <= 0) {
        this.isDodging = false;
        this.isInvulnerable = false;
      }
      this.applyPhysics(platforms);
      return;
    }

    // Input Guling: Tombol L/Shift + Stamina cukup
    if (input.dodge && this.isGrounded && this.stamina >= 25 && !this.isDodging) {
      this.isDodging = true;
      this.dodgeTimer = this.dodgeDuration;
      this.stamina -= 25;
      return;
    }

    // 3. State: Bertahan dengan Perisai (Shield Block)
    if (input.block && this.stamina > 5) {
      this.isBlocking = true;
      this.action = 'BLOCK';
      this.vx = 0; // Berhenti bergerak saat menahan perisai
      this.stamina = Math.max(0, this.stamina - 0.25);
    } else {
      this.isBlocking = false;
    }

    // 4. State: Serangan Pedang (Attack)
    if (input.attack && this.attackCooldown <= 0 && this.stamina >= 12 && !this.isBlocking) {
      this.action = 'ATTACK';
      this.attackTimer = 18;
      this.attackCooldown = 26;
      this.stamina -= 12;
    }
    if (this.attackTimer > 0) {
      this.attackTimer--;
      this.vx *= 0.7; // Gerakan melambat saat mengayun pedang
    }

    // 5. Pergerakan Horizontal & Lompat (Hanya jika tidak sedang menahan perisai)
    if (!this.isBlocking && this.attackTimer <= 0) {
      if (input.left && !input.right) {
        this.vx = -this.moveSpeed;
        this.facingRight = false;
      } else if (input.right && !input.left) {
        this.vx = this.moveSpeed;
        this.facingRight = true;
      } else {
        this.vx = 0;
      }

      // Lompat
      if (input.jump && this.isGrounded) {
        this.vy = this.jumpForce;
        this.isGrounded = false;
      }
    }

    this.applyPhysics(platforms, worldWidth, worldHeight);
  }

  // =========================================================================
  // SISTEM PENGUNCIAN BATAS PETA (Anti-Out-Of-Bounds) & VOID FALL RECOVERY
  // =========================================================================
  private applyPhysics(platforms: Rect[], worldWidth: number, worldHeight: number): void {
    this.x += this.vx;
    this.resolveHorizontalCollisions(platforms);

    this.vy += this.gravity;
    this.y += this.vy;
    this.resolveVerticalCollisions(platforms);

    // 1. Kunci batas kiri peta (tidak bisa tembus x < 0)
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }

    // 2. Kunci batas kanan peta (tidak bisa tembus x > worldWidth - width)
    if (this.x + this.width > worldWidth) {
      this.x = worldWidth - this.width;
      this.vx = 0;
    }

    // 3. Kunci batas atas langit (mencegah lompat tembus atap)
    if (this.y < 0) {
      this.y = 0;
      if (this.vy < 0) this.vy = 0;
    }

    // 4. Catat posisi aman terakhir di atas pijakan platform
    if (this.isGrounded && this.y < worldHeight - 60) {
      this.lastSafeGroundedX = this.x;
      this.lastSafeGroundedY = this.y;
    }

    // 5. Penanganan jatuh ke jurang/void bawah: Respawn ke pijakan aman terdekat
    if (this.y > worldHeight + 40 && this.hp > 0) {
      this.takeDamage(35, this.x);
      this.x = this.lastSafeGroundedX;
      this.y = this.lastSafeGroundedY;
      this.vx = 0;
      this.vy = 0;
    }
  }

  // Menahan damage: Mengurangi damage 85% jika perisai aktif dan menghadap musuh
  public takeDamage(amount: number, fromX: number): void {
    if (this.isInvulnerable || this.hp <= 0) return;

    const isFacingAttacker = (this.facingRight && fromX > this.x) || (!this.facingRight && fromX < this.x);
    if (this.isBlocking && isFacingAttacker && this.stamina >= 10) {
      this.stamina -= 20;
      this.hp -= Math.max(2, Math.round(amount * 0.15)); // Reduksi 85%
      return;
    }

    this.hp -= amount;
    this.vy = -4.5; // Knockback
    this.vx = fromX > this.x ? -4 : 4;
  }
}`;

  const aiCode = `// =========================================================================
// 2. LOGIKA AI MUSUH ANAK NAGA - STAGE 1 (DragonEnemy.ts)
// Finite State Machine: PATROL -> CHASE -> TELEGRAPH -> ATTACK -> COOLDOWN
// =========================================================================

export type DragonAIState = 'PATROL' | 'CHASE' | 'TELEGRAPH' | 'ATTACK' | 'COOLDOWN' | 'HURT' | 'DEAD';

export class HatchlingDragon {
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 44;
  public height: number = 36;
  public hp: number = 60;
  
  public state: DragonAIState = 'PATROL';
  public facingRight: boolean = false;
  public stateTimer: number = 0;
  public attackCooldown: number = 0;

  // Batas area patroli
  public patrolStartX: number;
  public patrolRange: number = 100;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.patrolStartX = x;
  }

  public update(player: Player, platforms: Rect[]): void {
    if (this.hp <= 0) {
      this.state = 'DEAD';
      return;
    }

    if (this.attackCooldown > 0) this.attackCooldown--;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    const speed = 1.6;

    // Terapkan gravitasi
    this.vy += 0.55;
    this.y += this.vy;
    this.resolveVerticalCollisions(platforms);

    switch (this.state) {
      // 1. PATROLI: Berjalan bolak-balik dalam rentang wilayah
      case 'PATROL': {
        this.vx = this.facingRight ? speed : -speed;
        if (this.x > this.patrolStartX + this.patrolRange) {
          this.facingRight = false;
        } else if (this.x < this.patrolStartX - this.patrolRange) {
          this.facingRight = true;
        }

        // Transisi: Jika pemain masuk dalam radius deteksi 190px
        if (distToPlayer < 190 && Math.abs(player.y - this.y) < 70) {
          this.state = 'CHASE';
        }
        break;
      }

      // 2. KEJAR (CHASE): Mengejar ksatria secara agresif
      case 'CHASE': {
        this.facingRight = player.x > this.x;
        this.vx = this.facingRight ? speed * 1.3 : -speed * 1.3;

        // Transisi ke serangan jika sudah dalam jarak jangkau gigitan (50px)
        if (distToPlayer < 52 && this.attackCooldown <= 0) {
          this.state = 'TELEGRAPH';
          this.stateTimer = 16; // Waktu aba-aba (windup telegraf)
          this.vx = 0;
        }

        // Jika pemain kabur terlalu jauh, kembali berpatroli
        if (distToPlayer > 260) {
          this.state = 'PATROL';
        }
        break;
      }

      // 3. TELEGRAF (Wind-up): Peringatan visual sebelum menerjang
      case 'TELEGRAPH': {
        this.vx = 0;
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          this.state = 'ATTACK';
          this.stateTimer = 14;
          // Terjangan gigitan cepat maju
          this.vx = (this.facingRight ? 1 : -1) * 3.5;
        }
        break;
      }

      // 4. SERANGAN (Melee Bite): Memeriksa hitbox serangan ke pemain
      case 'ATTACK': {
        this.stateTimer--;
        const biteHitbox = {
          x: this.facingRight ? this.x + this.width : this.x - 20,
          y: this.y + 5,
          width: 25,
          height: 25
        };

        if (this.checkOverlap(biteHitbox, player.getBounds())) {
          player.takeDamage(16, this.x);
        }

        if (this.stateTimer <= 0) {
          this.state = 'COOLDOWN';
          this.stateTimer = 40;     // Jeda diam setelah gigitan
          this.attackCooldown = 50; // Waktu jeda sebelum bisa gigit lagi
        }
        break;
      }

      // 5. COOLDOWN: Istirahat sejenak sebelum kembali mengejar
      case 'COOLDOWN': {
        this.vx = 0;
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
}`;

  const stageCode = `// =========================================================================
// 3. SISTEM PERPINDAHAN STAGE (StageManager / GameEngine.ts)
// Mengatur siklus: Stage 1 -> Stage 2 -> Stage 3 (Boss + Save Princess)
// =========================================================================

export type StageId = 1 | 2 | 3;

export class StageManager {
  public currentStageId: StageId = 1;
  public status: 'PLAYING' | 'STAGE_CLEAR' | 'VICTORY' | 'GAME_OVER' = 'PLAYING';
  public enemies: DragonEnemy[] = [];
  public player: Player;
  public isPrincessSaved: boolean = false;

  constructor(player: Player) {
    this.player = player;
    this.loadStage(1);
  }

  // Memuat data stage dan inisialisasi entitas
  public loadStage(stageId: StageId, isFullReset = false): void {
    this.currentStageId = stageId;
    const config = STAGES[stageId];
    this.status = 'PLAYING';
    this.isPrincessSaved = false;

    // 1. Tempatkan ksatria di titik awal stage
    this.player.reset(80, 380, isFullReset);

    // 2. Spawn naga musuh berdasarkan konfigurasi stage
    this.enemies = config.enemies.map(
      (c) => new DragonEnemy(c.type, c.x, c.y, c.patrolRange)
    );
  }

  // Cek kondisi selesai setiap frame
  public updateProgression(): void {
    const allEnemiesDefeated = this.enemies.every((e) => e.isDead);

    // STAGE 1 & 2: Pemain harus mengalahkan naga dan mencapai portal ujung kanan
    if (this.currentStageId < 3) {
      const exitReach = this.player.x >= STAGES[this.currentStageId].worldWidth - 110;
      if (allEnemiesDefeated && exitReach && this.status === 'PLAYING') {
        this.status = 'STAGE_CLEAR';
        // Membuka UI notifikasi transisi ke stage berikutnya
      }
    } 
    // STAGE 3 (FINAL BOSS): Kalahkan Bos Naga Purba lalu dekati sangkar putri
    else if (this.currentStageId === 3) {
      const boss = this.enemies.find((e) => e.type === 'BOSS_ELDER');
      if (boss && boss.isDead && !this.isPrincessSaved) {
        const princessPos = STAGES[3].princessPosition!;
        const dist = Math.hypot(this.player.x - princessPos.x, this.player.y - princessPos.y);

        // Jika pemain menghampiri sangkar putri setelah naga mati
        if (dist < 90) {
          this.isPrincessSaved = true;
          this.status = 'VICTORY';
          // Memicu selebrasi kemenangan
        }
      }
    }
  }

  // Pindah ke stage berikutnya
  public transitionToNextStage(): void {
    if (this.currentStageId < 3) {
      const nextStage = (this.currentStageId + 1) as StageId;
      this.loadStage(nextStage, false); // Pertahankan sisa HP ksatria
    }
  }
}`;

  const currentCode = activeTab === 'PLAYER' ? playerCode : activeTab === 'AI' ? aiCode : stageCode;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Code2 className="w-4 h-4" />
            Core Logic Boilerplate & Implementasi
          </div>
          <h2 className="text-2xl font-black text-slate-100">
            Fondasi Kode Game Aksi 2D
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Contoh kode bersih dan modular yang siap dipindahkan ke engine pilihan Anda (Canvas/TypeScript, Phaser, atau diadaptasi ke GDScript).
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={() => handleCopy(currentCode)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
          <span>{copied ? 'Berhasil Disalin!' : 'Salin Kode Modul Ini'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('PLAYER')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PLAYER'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>1. Input & Gerak Ksatria</span>
        </button>

        <button
          onClick={() => setActiveTab('AI')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'AI'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>2. Logika AI Naga (Stage 1)</span>
        </button>

        <button
          onClick={() => setActiveTab('STAGE')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'STAGE'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>3. Sistem Transisi Stage</span>
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
          <span>
            {activeTab === 'PLAYER'
              ? 'src/game/entities/Player.ts'
              : activeTab === 'AI'
              ? 'src/game/entities/DragonHatchlingAI.ts'
              : 'src/game/core/StageManager.ts'}
          </span>
          <span className="text-slate-500">TypeScript (Strict)</span>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto text-slate-300 leading-relaxed">
          <pre>{currentCode}</pre>
        </div>
      </div>
    </div>
  );
}
