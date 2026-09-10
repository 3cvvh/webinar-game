import { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ArchitectureDoc } from './components/ArchitectureDoc';
import { CodeExplorer } from './components/CodeExplorer';
import { Gamepad2, Compass, Code2, Sparkles, Shield, Flame } from 'lucide-react';

type AppTab = 'GAME' | 'ARCHITECTURE' | 'CODE';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('GAME');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Main Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo & Role Badge */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-2">
                <span>Knight vs Dragons</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Game Dev Architecture
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('GAME')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'GAME'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Play Game</span>
            </button>

            <button
              onClick={() => setActiveTab('ARCHITECTURE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ARCHITECTURE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tech Stack & Arsitektur</span>
            </button>

            <button
              onClick={() => setActiveTab('CODE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'CODE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Core Logic Boilerplate</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-4">
        {activeTab === 'GAME' && (
          <GameCanvas onOpenArchitecture={() => setActiveTab('ARCHITECTURE')} />
        )}
        {activeTab === 'ARCHITECTURE' && <ArchitectureDoc />}
        {activeTab === 'CODE' && <CodeExplorer />}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 text-center text-xs text-slate-500">
        <p>
          Knight's Quest: Dragon Rescue • Dirancang oleh Senior Game Developer & Software Architect
        </p>
      </footer>
    </div>
  );
}
