import { Layers, Cpu, Compass, CheckCircle2, ShieldAlert, FileCode2, ArrowRight } from 'lucide-react';

export function ArchitectureDoc() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 text-slate-200">
      {/* Hero Header */}
      <div className="border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-2 text-blue-400 font-mono text-xs uppercase tracking-wider mb-1">
          <Compass className="w-4 h-4" />
          Senior Game Architect & Engineering Blueprint
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mb-2">
          Arsitektur Game 2D: Knight vs Dragon Slayer
        </h2>
        <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
          Dokumen teknis komprehensif rancangan game aksi 2D ksatria menyelamatkan putri dari para naga.
          Mencakup rekomendasi perspektif, evaluasi tech stack, struktur direktori modular, dan pola desain (design patterns).
        </p>
      </div>

      {/* 1. Rekomendasi Perspektif & Format Permainan */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 mb-8">
        <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-mono">1</span>
          Rekomendasi Perspektif: 2D Side-Scrolling Platformer vs Top-Down
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Berdasarkan kebutuhan mekanik pertarungan ksatria melawan naga raksasa dan penyelamatan putri, saya <strong className="text-blue-400">sangat merekomendasikan 2D Side-Scrolling Action Platformer</strong> (seperti gaya <em>Hollow Knight</em>, <em>Castlevania</em>, atau <em>Ghosts 'n Goblins</em>), dengan pertimbangan arsitektural berikut:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/60 p-4 rounded-lg border border-blue-500/20">
            <h4 className="font-bold text-blue-300 text-sm mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Keunggulan Side-Scrolling (Direkomendasikan)
            </h4>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Skala Vertikal & Kedahsyatan Naga:</strong> Bos Naga di Stage 3 dapat digambarkan menjulang tinggi di atas kepala ksatria, membentangkan sayap raksasa, dan menyemburkan api dari langit ke bumi. Skala ini terasa jauh lebih epik dibanding sudut pandang top-down.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Mekanik Bertahan & Menghindar yang Dinamis:</strong> Pemain dapat melompat melewati kobaran api di tanah, melakukan <em>dodge roll</em> di bawah sabetan cakar naga, atau mengangkat perisai untuk menahan bola api yang menukik.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">•</span>
                <span><strong>Rintangan Lingkungan (Hazards):</strong> Jurang lahar dan stalaktit di Stage 2 memanfaatkan gravitasi alami, memberikan variasi platforming yang menegangkan.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            <h4 className="font-bold text-slate-300 text-sm mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Perbandingan dengan Top-Down
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-bold">•</span>
                <span>Top-down (gaya Zelda 2D) unggul dalam eksplorasi labirin/peta bebas 8 arah, namun kurang memberikan sensasi bobot gravitasi ksatria berbaju zirah dan kedalaman sayap naga yang terbang di angkasa.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-bold">•</span>
                <span>Pertarungan melawan musuh terbang di top-down seringkali membingungkan pemain terkait ketinggian hit-box (apakah naga sedang terbang tinggi atau di darat).</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Rekomendasi Tech Stack */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 mb-8">
        <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-mono">2</span>
          Rekomendasi Tech Stack & Perbandingan
        </h3>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          Pemilihan teknologi bergantung pada target rilis utama produk:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Option 1 */}
          <div className="bg-slate-950/80 p-4 rounded-lg border border-blue-500/40 relative flex flex-col justify-between">
            <div className="absolute -top-2.5 right-3 bg-blue-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
              KAMI IMPLEMENTASIKAN DISINI
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm mb-1">HTML5 Canvas 2D + TypeScript</div>
              <div className="text-[11px] text-blue-400 font-mono mb-2">Web / Browser Native</div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Menggunakan <strong>Game Loop 60 FPS murni</strong> dengan <code className="text-amber-300">requestAnimationFrame</code>, arsitektur State Machine, dan Web Audio API.
              </p>
            </div>
            <div className="border-t border-slate-800/80 pt-2 text-slate-400">
              <strong className="text-slate-200">Alasan Teknis:</strong> Bobot ultra-ringan, tidak membutuhkan dependency berat pihak ketiga, instant-play di browser desktop dan mobile, deterministik dan mudah didebug.
            </div>
          </div>

          {/* Option 2 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-100 text-sm mb-1">Phaser.js 3 + TypeScript</div>
              <div className="text-[11px] text-emerald-400 font-mono mb-2">Web Game Framework</div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Engine web open-source paling matang untuk game 2D berbasis HTML5/WebGL.
              </p>
            </div>
            <div className="border-t border-slate-800/80 pt-2 text-slate-400">
              <strong className="text-slate-200">Alasan Teknis:</strong> Memiliki Arcade Physics bawaan, integrasi Tilemap Tiled yang matang, Particle Emitters bawaan, dan Scene Lifecycle yang terstandarisasi. Sangat cocok jika ingin merilis ke platform seperti Poki, CrazyGames, atau web portal.
            </div>
          </div>

          {/* Option 3 */}
          <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-100 text-sm mb-1">Godot Engine 4 (2D)</div>
              <div className="text-[11px] text-purple-400 font-mono mb-2">Standalone PC / Mobile Engine</div>
              <p className="text-slate-300 leading-relaxed mb-3">
                Game Engine native dengan sistem node berbasis pohon (Scene Tree) menggunakan GDScript atau C#.
              </p>
            </div>
            <div className="border-t border-slate-800/80 pt-2 text-slate-400">
              <strong className="text-slate-200">Alasan Teknis:</strong> Pilihan nomor satu jika game direncanakan untuk dirilis ke Steam (PC) atau Google Play / App Store (Mobile). Animasi State Machine visual sangat intuitif dan physics 2D-nya sangat akurat.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Struktur Folder & Game Architecture */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 mb-8">
        <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-mono">3</span>
          Struktur Folder & Modul Proyek (Clean Architecture)
        </h3>
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          Struktur arsitektur ini memisahkan logika matematika/fisika entitas dari representasi visual, memudahkan pengujian (unit testing) dan penambahan konten baru:
        </p>

        <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
          <pre>{`src/
├── types/
│   └── index.ts                 # Type definitions (Stage, Entity, Input, Vector2D, Rect)
├── game/
│   ├── core/
│   │   ├── GameEngine.ts        # Main 60 FPS update-render loop & camera scrolling
│   │   ├── InputManager.ts      # Keyboard & touch input event listeners
│   │   ├── CollisionSystem.ts   # AABB Bounding box & raycast collision detection
│   │   └── StageManager.ts      # Stage progression state, stage loading, & objective check
│   ├── entities/
│   │   ├── Player.ts            # Knight physics, combo attack, shield block, dodge roll i-frames
│   │   ├── DragonEnemy.ts       # AI Dragon class (Hatchling, Flying Wyvern, Elder Boss)
│   │   └── Projectile.ts        # Fireballs & dragon breath attack hitboxes
│   ├── stages/
│   │   ├── StageData.ts         # Platform layouts, hazard coordinates, enemy spawn definitions
│   │   ├── Stage1Outskirts.ts   # Stage 1 specific triggers
│   │   ├── Stage2Cavern.ts      # Stage 2 lava hazards
│   │   └── Stage3Throne.ts      # Stage 3 Boss Arena & Princess Cage logic
│   ├── audio/
│   │   └── SoundManager.ts      # Web Audio API synthesizers (slashes, fireballs, roars, fanfare)
│   └── fx/
│       └── ParticleManager.ts   # Blood sparks, flame particles, floating damage numbers
└── components/
    ├── GameCanvas.tsx           # React UI container with HUD (Knight HP/Stamina, Boss bar)
    └── VirtualControls.tsx      # Mobile on-screen touch controller`}</pre>
        </div>
      </div>

      {/* 4. Design Patterns yang Diterapkan */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-mono">4</span>
          Pola Desain (Design Patterns) yang Digunakan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <strong className="text-amber-400 block mb-1">Finite State Machine (FSM)</strong>
            <p className="text-slate-300">
              Digunakan pada Ksatria (<code className="text-blue-300">IDLE, RUN, ATTACK, BLOCK, DODGE, HURT, DEAD</code>) dan AI Naga (<code className="text-red-300">PATROL, CHASE, TELEGRAPH, ATTACK, COOLDOWN</code>) untuk memastikan tidak terjadi anomali transisi state (misal: menyerang saat sedang terjatuh atau berguling).
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <strong className="text-blue-400 block mb-1">Fixed Timestep Game Loop</strong>
            <p className="text-slate-300">
              Memisahkan interval fisika dan rendering agar kecepatan gerak ksatria, gravitasi, dan laju proyektil api konsisten di monitor 60Hz, 120Hz, maupun 144Hz.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <strong className="text-emerald-400 block mb-1">Object Pooling (Partikel & Proyektil)</strong>
            <p className="text-slate-300">
              Mencegah Garbage Collection stuttering saat naga menyemburkan puluhan partikel api dan proyektil dengan mendaur ulang memori entitas.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <strong className="text-purple-400 block mb-1">Observer / Event Bus</strong>
            <p className="text-slate-300">
              Memisahkan sistem audio dan HUD dari logika inti gameplay; saat bos naga memasuki Fase 2 atau putri diselamatkan, sistem mengirimkan sinyal event tanpa tight coupling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
