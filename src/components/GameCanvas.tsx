import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { StageId, GameStatus } from '../types';
import { soundManager } from '../game/audio';
import {
  Shield,
  Sword,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Heart,
  Zap,
  Flame,
  Crown,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
} from 'lucide-react';

interface GameCanvasProps {
  onOpenArchitecture?: () => void;
}

export function GameCanvas({ onOpenArchitecture }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [stageId, setStageId] = useState<StageId>(1);
  const [status, setStatus] = useState<GameStatus>('PLAYING');
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerStamina, setPlayerStamina] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.isMuted);
  const [bossHp, setBossHp] = useState<{ current: number; max: number; phase: number } | null>(null);
  const [objective, setObjective] = useState<string>('');
  const [isPortalReady, setIsPortalReady] = useState<boolean>(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = 854;
    canvas.height = 480;

    const engine = new GameEngine(canvas, (eng) => {
      setStageId(eng.currentStageId);
      setStatus(eng.status);
      setPlayerHp(Math.max(0, Math.round(eng.player.hp)));
      setPlayerStamina(Math.max(0, Math.round(eng.player.stamina)));
      
      const allDead = eng.allEnemiesDefeated;
      setIsPortalReady(allDead);
      if (allDead && eng.currentStageId < 3) {
        setObjective('✨ SEMUA NAGA KALAH! Pintu Portal Terbuka di Ujung Kanan Panggung! ➔');
      } else if (eng.currentStageId === 3 && allDead) {
        setObjective('✨ NAGA PURBA TUMBANG! Hampiri Sangkar Putri untuk Membebaskannya! ➔');
      } else {
        setObjective(eng.currentStageConfig.objective);
      }

      const boss = eng.enemies.find((e) => e.type === 'BOSS_ELDER');
      if (boss && !boss.isDead) {
        setBossHp({
          current: Math.max(0, boss.hp),
          max: boss.maxHp,
          phase: boss.bossPhase,
        });
      } else {
        setBossHp(null);
      }
    });

    engineRef.current = engine;
    engine.start();

    // Periodic state polling for continuous UI sync
    const interval = setInterval(() => {
      if (engineRef.current) {
        const eng = engineRef.current;
        setPlayerHp(Math.max(0, Math.round(eng.player.hp)));
        setPlayerStamina(Math.max(0, Math.round(eng.player.stamina)));
        setIsPortalReady(eng.allEnemiesDefeated);

        if (eng.allEnemiesDefeated && eng.currentStageId < 3) {
          setObjective('✨ SEMUA NAGA KALAH! Pintu Portal Terbuka di Ujung Kanan Panggung! ➔');
        } else if (eng.currentStageId === 3 && eng.allEnemiesDefeated) {
          setObjective('✨ NAGA PURBA TUMBANG! Hampiri Sangkar Putri untuk Membebaskannya! ➔');
        } else {
          setObjective(eng.currentStageConfig.objective);
        }

        const boss = eng.enemies.find((e) => e.type === 'BOSS_ELDER');
        if (boss && !boss.isDead) {
          setBossHp({
            current: Math.max(0, boss.hp),
            max: boss.maxHp,
            phase: boss.bossPhase,
          });
        } else {
          setBossHp(null);
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
      engine.stop();
    };
  }, []);

  const toggleMute = () => {
    soundManager.isMuted = !soundManager.isMuted;
    setIsMuted(soundManager.isMuted);
  };

  const handleStageSelect = (id: StageId) => {
    if (engineRef.current) {
      engineRef.current.initStage(id, true);
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.restartCurrentStage();
    }
  };

  const handleNextStage = () => {
    if (engineRef.current) {
      engineRef.current.nextStage();
    }
  };

  // Touch Virtual Control Handlers
  const setVirtualInput = (key: keyof typeof engineRef.current.inputs, value: boolean) => {
    if (engineRef.current) {
      engineRef.current.inputs[key] = value;
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-2 py-3 select-none">
      {/* Top Header & Stage Navigation */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-950/70 border border-indigo-500/30 text-indigo-400">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Knight's Quest: Dragon Slayer
              <span className="text-xs px-2 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 font-mono">
                Stage {stageId} of 3
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Aksi 2D Platformer: Selamatkan Sang Putri dari Kawanan Naga
            </p>
          </div>
        </div>

        {/* Action buttons & stage jumps */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Stage:</span>
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => handleStageSelect(s as StageId)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  stageId === s
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s === 3 ? 'Boss (3)' : `S${s}`}
              </button>
            ))}
          </div>

          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            title={isMuted ? 'Nyalakan Suara' : 'Matikan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleRestart}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-medium text-indigo-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dokumentasi Arsitektur</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Game Screen Container */}
      <div className="relative w-full aspect-[854/480] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
        {/* Canvas Element */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          tabIndex={0}
        />

        {/* In-Game HUD: Knight Health & Stamina */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-lg border border-slate-700/80 shadow-lg min-w-[200px]">
          {/* HP Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-0.5">
            <span className="flex items-center gap-1 text-rose-400">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              HP Ksatria
            </span>
            <span className="font-mono text-slate-300">{playerHp}/100</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-150 ${
                playerHp > 50 ? 'bg-emerald-500' : playerHp > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(0, playerHp)}%` }}
            />
          </div>

          {/* Stamina Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-200 mt-0.5">
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              Stamina
            </span>
            <span className="font-mono text-slate-300">{playerStamina}/100</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-amber-400 transition-all duration-100"
              style={{ width: `${Math.max(0, playerStamina)}%` }}
            />
          </div>
        </div>

        {/* Objective Pill */}
        <div
          className={`absolute bottom-3 left-3 right-3 sm:right-auto px-3.5 py-2 rounded-lg text-xs shadow-xl flex items-center gap-2.5 transition-all duration-300 ${
            isPortalReady
              ? 'bg-amber-950/95 border-2 border-amber-400 text-amber-200 shadow-amber-500/20'
              : 'bg-slate-900/90 border border-slate-700 text-slate-300 backdrop-blur-md'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPortalReady ? 'bg-amber-400 animate-ping' : 'bg-blue-400 animate-pulse'
            }`}
          />
          <span className={`font-bold ${isPortalReady ? 'text-amber-300' : 'text-slate-200'}`}>
            {isPortalReady ? 'PETUNJUK:' : 'Misi:'}
          </span>
          <span className="font-medium">{objective}</span>
        </div>

        {/* Stage 3 Boss HP Bar Header */}
        {bossHp && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[70%] max-w-md bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl border border-red-500/40 shadow-xl flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-bold text-red-300">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                Ignis, Sang Raja Naga Purba
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-700 font-mono">
                {bossHp.phase === 2 ? 'FASE 2: ENRAGED 🔥' : 'FASE 1: NORMAL'}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-red-900/60 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  bossHp.phase === 2
                    ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-400'
                    : 'bg-gradient-to-r from-red-600 to-rose-500'
                }`}
                style={{ width: `${(bossHp.current / bossHp.max) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Overlay: Game Over */}
        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-500 mb-3">
              <Heart className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-rose-400 tracking-wide mb-1">
              KSATRIA TELAH GUGUR
            </h2>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              Naga berhasil mengalahkanmu. Perhatikan timing tangkisan perisai (K/X) dan gulingan menghindar (L/Shift) saat musuh menyerang.
            </p>
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Bangkit & Coba Lagi</span>
            </button>
          </div>
        )}

        {/* Overlay: Stage Clear */}
        {status === 'STAGE_CLEAR' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3">
              <Crown className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-wide mb-1">
              STAGE {stageId} BERHASIL DILEWATI!
            </h2>
            <p className="text-sm text-slate-300 max-w-md mb-5">
              {stageId === 1
                ? 'Semua anak naga telah ditundukkan. Bersiaplah menuju sarang naga wyvern terbang di Stage 2!'
                : 'Jurang lahar dan naga wyvern terbang telah kamu taklukkan! Pintu menuju tahta Naga Purba terbuka!'}
            </p>
            <button
              onClick={handleNextStage}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
            >
              <span>Lanjut ke Stage {stageId + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Overlay: Victory / Princess Saved */}
        {status === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 rounded-full bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3 animate-bounce">
              <Crown className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wide mb-1">
              SANG PUTRI BERHASIL DISELAMATKAN!
            </h2>
            <p className="text-sm text-slate-200 max-w-md mb-5 leading-relaxed">
              Selamat! Ignis Sang Raja Naga Purba telah dikalahkan dan sangkar emas telah terlepas. Kerajaan kembali damai berkat keberanianmu!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleStageSelect(1)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Main Dari Awal</span>
              </button>
              {onOpenArchitecture && (
                <button
                  onClick={onOpenArchitecture}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Pelajari Arsitektur Game</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls & Touchpad Bar */}
      <div className="w-full mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Keyboard Instructions Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex flex-col justify-between">
          <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-blue-400" />
            Panduan Tombol Keyboard:
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">
                A / D
              </span>
              <span>atau Panah: Bergerak</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-cyan-300 font-mono">
                W / Space
              </span>
              <span>Lompat (2x: Double Jump ✨)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-300 font-mono">
                J / Z
              </span>
              <span>Tebasan Pedang (Attack)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-blue-300 font-mono">
                K / X
              </span>
              <span>Tangkis Perisai (Block)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-emerald-300 font-mono">
                L / Shift
              </span>
              <span>Guling Menghindar (Dodge Roll)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>*Tangkisan menahan 85% damage</span>
            </div>
          </div>
        </div>

        {/* Virtual Touch Controls (Great for Touchscreens / Mobile / Quick Clicks) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
          {/* Movement buttons */}
          <div className="flex items-center gap-1">
            <button
              onMouseDown={() => setVirtualInput('left', true)}
              onMouseUp={() => setVirtualInput('left', false)}
              onTouchStart={() => setVirtualInput('left', true)}
              onTouchEnd={() => setVirtualInput('left', false)}
              className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 border border-slate-700 text-slate-200 flex items-center justify-center font-bold"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => setVirtualInput('jump', true)}
              onMouseUp={() => setVirtualInput('jump', false)}
              onTouchStart={() => setVirtualInput('jump', true)}
              onTouchEnd={() => setVirtualInput('jump', false)}
              className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 border border-slate-700 text-slate-200 flex items-center justify-center font-bold"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              onMouseDown={() => setVirtualInput('right', true)}
              onMouseUp={() => setVirtualInput('right', false)}
              onTouchStart={() => setVirtualInput('right', true)}
              onTouchEnd={() => setVirtualInput('right', false)}
              className="w-11 h-11 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-blue-600 border border-slate-700 text-slate-200 flex items-center justify-center font-bold"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onMouseDown={() => setVirtualInput('dodge', true)}
              onMouseUp={() => setVirtualInput('dodge', false)}
              onTouchStart={() => setVirtualInput('dodge', true)}
              onTouchEnd={() => setVirtualInput('dodge', false)}
              className="px-3 h-11 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 active:bg-emerald-600 border border-emerald-600/50 text-emerald-200 font-bold text-xs flex flex-col items-center justify-center"
            >
              <span>Dodge</span>
              <span className="text-[9px] text-emerald-400">Roll</span>
            </button>
            <button
              onMouseDown={() => setVirtualInput('block', true)}
              onMouseUp={() => setVirtualInput('block', false)}
              onTouchStart={() => setVirtualInput('block', true)}
              onTouchEnd={() => setVirtualInput('block', false)}
              className="px-3 h-11 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 active:bg-blue-600 border border-blue-600/50 text-blue-200 font-bold text-xs flex flex-col items-center justify-center"
            >
              <Shield className="w-3.5 h-3.5 mb-0.5" />
              <span>Block</span>
            </button>
            <button
              onMouseDown={() => setVirtualInput('attack', true)}
              onMouseUp={() => setVirtualInput('attack', false)}
              onTouchStart={() => setVirtualInput('attack', true)}
              onTouchEnd={() => setVirtualInput('attack', false)}
              className="px-3.5 h-11 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 active:bg-amber-600 border border-amber-600/50 text-amber-200 font-bold text-xs flex flex-col items-center justify-center"
            >
              <Sword className="w-3.5 h-3.5 mb-0.5" />
              <span>Attack</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
