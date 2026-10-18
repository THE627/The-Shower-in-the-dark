import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sword,
  Candy,
  DoorClosed,
  Skull,
  Trophy,
} from 'lucide-react';
import { PlayerStats, ActiveThreat, ToastMessage } from '../game/types';
import { sound } from '../game/audio';

interface HUDProps {
  stats: PlayerStats;
  threat: ActiveThreat;
  bossHp: { current: number; max: number; name: string } | null;
  toasts: ToastMessage[];
  targetedObject: 'none' | 'knife' | 'valve' | 'door' | 'exit_door';
  houseName?: string;
  interactionProgress: number;
  damageFlash: boolean;
  onRestart: () => void;
  status: 'intro' | 'playing' | 'paused' | 'gameover' | 'victory';
  onStartGame: () => void;
  onResume: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  threat,
  bossHp,
  toasts,
  targetedObject,
  houseName,
  interactionProgress,
  damageFlash,
  onRestart,
  status,
  onStartGame,
  onResume,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  const targetExp = stats.level === 1 ? 1500 : 3500;
  const expProgress = Math.min(100, (stats.exp / targetExp) * 100);
  const hpProgress = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-sans">
      {/* Damage Flash Red Tint Overlay */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/40 pointer-events-none animate-damage" />
      )}

      {/* Horror CRT scanline & vignette */}
      <div className="absolute inset-0 crt-overlay pointer-events-none" />

      {/* TOP HEADER: Player Health & Level Progress */}
      {status === 'playing' && (
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          {/* Health Bar (Left) */}
          <div className="bg-[#12161f]/90 border border-slate-700/60 rounded-lg p-3 w-64 shadow-xl backdrop-blur-none">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5 text-red-400">
                <ShieldAlert className="w-4 h-4" /> SANITY / HP
              </span>
              <span className="font-mono text-white">{Math.ceil(stats.hp)} / {stats.maxHp}</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  hpProgress < 30 ? 'bg-red-500' : hpProgress < 60 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${hpProgress}%` }}
              />
            </div>
          </div>

          {/* Center: Boss Bar OR Threat Banner */}
          <div className="flex-1 max-w-xl mx-4">
            {bossHp ? (
              <div className="bg-[#1a0f1e]/95 border border-purple-500/50 rounded-lg p-3 shadow-2xl">
                <div className="flex items-center justify-between text-xs font-black uppercase text-purple-300 mb-1.5">
                  <span className="flex items-center gap-2 text-purple-400">
                    <Skull className="w-4 h-4 text-purple-400" /> {bossHp.name}
                  </span>
                  <span className="font-mono text-purple-200">{bossHp.current} / {bossHp.max} HP</span>
                </div>
                <div className="w-full bg-purple-950/80 rounded-full h-3.5 p-0.5 border border-purple-800">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-150"
                    style={{ width: `${Math.max(0, (bossHp.current / bossHp.max) * 100)}%` }}
                  />
                </div>
              </div>
            ) : threat.type !== 'none' ? (
              <div className="bg-[#241315]/95 border border-red-500/70 rounded-lg p-2.5 shadow-2xl text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-red-400">
                  {threat.type === 'job_laser' && '⚠ INCOMING J*B APPLICATION! STEP OFF RED TRAJECTORY!'}
                  {threat.type === 'touch_grass' && '☣ TOXIC GRASS SURGE! CLIMB THE TOILET OR VANITY!'}
                  {threat.type === 'shower_flood' && '🌊 SCALDING SHOWER FLOOD! HOLD [E] AT VALVE!'}
                </p>
              </div>
            ) : null}
          </div>

          {/* Level & EXP Progress (Right) */}
          <div className="bg-[#12161f]/90 border border-slate-700/60 rounded-lg p-3 w-72 shadow-xl">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              <span className="text-amber-400 font-extrabold">
                {stats.level === 1 ? 'L1: SHOWER IN THE DARK' : 'L2: JOB OR TREAT'}
              </span>
              <span className="font-mono text-amber-200">{stats.exp} / {targetExp} EXP</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-200"
                style={{ width: `${expProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sword className={`w-3.5 h-3.5 ${stats.hasKnife ? 'text-emerald-400' : 'text-slate-500'}`} />
                {stats.hasKnife ? 'Knife Armed' : 'Unarmed'}
              </span>
              {stats.level === 2 && (
                <span className="flex items-center gap-1 text-pink-400">
                  <Candy className="w-3.5 h-3.5" /> {stats.candyCount} Candies
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CENTER RETICLE & INTERACTION PROMPTS */}
      {status === 'playing' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex flex-col items-center">
            {/* Crosshair */}
            <div className="relative w-7 h-7 flex items-center justify-center">
              {targetedObject !== 'none' ? (
                // Interactive Reticle with Radial Progress Ring
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray="75.4"
                      strokeDashoffset={75.4 * (1 - interactionProgress)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute w-2 h-2 bg-amber-400 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 bg-white/80 rounded-full shadow-sm" />
                  <div className="absolute w-5 h-0.5 bg-white/30" />
                  <div className="absolute h-5 w-0.5 bg-white/30" />
                </>
              )}
            </div>

            {/* Contextual Interaction Text Banner */}
            {targetedObject !== 'none' && (
              <div className="mt-4 bg-[#0d1117]/95 border border-amber-400/80 px-3.5 py-1.5 rounded shadow-2xl text-center">
                <span className="font-mono text-xs font-bold text-amber-300 tracking-wide uppercase">
                  {targetedObject === 'knife' && '[E] OR [L-CLICK] TO PICK UP CHEF KNIFE'}
                  {targetedObject === 'valve' && (threat.type === 'shower_flood' ? 'HOLD [E] TO SHUT OFF VALVE' : 'VALVE SECURE')}
                  {targetedObject === 'door' && `HOLD [E] TO KNOCK ON ${houseName?.toUpperCase() || 'DOOR'}`}
                  {targetedObject === 'exit_door' && (stats.exp >= 1500 ? '[E] ESCAPE TO DALLAS SUBURBIA!' : `NEED 1500 EXP TO UNLOCK (${1500 - stats.exp} LEFT)`)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION STREAM (Right side) */}
      <div className="absolute bottom-24 right-5 flex flex-col-reverse gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold shadow-2xl border transition-all duration-200 ${
              toast.type === 'treat'
                ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200'
                : toast.type === 'job'
                ? 'bg-red-950/90 border-red-500/70 text-red-200'
                : toast.type === 'dodge'
                ? 'bg-amber-950/90 border-amber-500/70 text-amber-200'
                : toast.type === 'warning'
                ? 'bg-orange-950/90 border-orange-500/70 text-orange-200'
                : 'bg-slate-900/90 border-slate-700/70 text-slate-200'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>

      {/* THREE.JS MANDATORY COLLAPSIBLE BOTTOM DOCK (Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto transition-transform duration-300 z-20 ${
          isDockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
        }`}
      >
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsDockCollapsed(!isDockCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#12161f]/95 hover:bg-[#1a202c] border-t border-x border-slate-700/80 rounded-t-lg text-[11px] font-bold text-slate-300 cursor-pointer shadow-lg transition-colors"
        >
          {isDockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {isDockCollapsed ? 'Show Controls' : 'Hide Controls'}
        </button>

        {/* Unified Horizontal Glassmorphic Control Dock */}
        <div className="bg-[#12161f]/95 border border-slate-700/80 rounded-b-lg rounded-t-none px-4 py-2.5 shadow-2xl flex items-center gap-3 text-xs text-slate-200">
          <button
            onClick={toggleMute}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors ${
              isMuted ? 'text-red-400' : 'text-slate-200'
            }`}
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer text-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer text-amber-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restart</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>[WASD] Move</span>
            <span>[Space] Jump</span>
            <span>[Shift] Sprint</span>
            <span>[E] Interact</span>
            <span>[L-Click] Knife</span>
          </div>
        </div>
      </div>

      {/* START SCREEN MODAL */}
      {status === 'intro' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center pointer-events-auto p-4 z-30">
          <div className="bg-[#0f131a] border border-slate-700 rounded-xl p-8 max-w-lg w-full text-center shadow-2xl">
            <h1 className="text-3xl font-extrabold text-amber-400 tracking-tight mb-2">
              THE SHOWER IN THE DARK
            </h1>
            <h2 className="text-lg font-creepster text-purple-400 tracking-wider mb-4">
              &amp; JOB OR TREAT
            </h2>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              You are a peaceful soul enjoying a shower in the dark. But the terrifying realities of modern adulthood are hunting you down! Dodge unpaid internships, avoid touching toxic grass, defeat corporate recruiters, and escape to Dallas Suburbia!
            </p>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-left mb-6 text-xs text-slate-300 space-y-2 font-mono">
              <p className="font-bold text-amber-300 font-sans">CONTROLS:</p>
              <p>• <span className="text-white">WASD:</span> Move | <span className="text-white">Mouse:</span> Look</p>
              <p>• <span className="text-white">SPACE:</span> Jump (Climb vanity/toilet when grass grows!)</p>
              <p>• <span className="text-white">SHIFT:</span> Sprint</p>
              <p>• <span className="text-white">E:</span> Universal Interact (Pick up knife, shut valve, knock doors)</p>
              <p>• <span className="text-white">LEFT-CLICK:</span> Slash with Kitchen Knife</p>
            </div>

            <button
              onClick={onStartGame}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg cursor-pointer shadow-lg text-sm uppercase tracking-wider transition-all"
            >
              Enter the Shower (Start Game)
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {status === 'paused' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto p-4 z-30">
          <div className="bg-[#0f131a] border border-slate-700 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-100 mb-4">GAME PAUSED</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={onResume}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded cursor-pointer"
              >
                Resume
              </button>
              <button
                onClick={onRestart}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded cursor-pointer"
              >
                Restart Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL: Corporate Rejection Letter */}
      {status === 'gameover' && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center pointer-events-auto p-4 z-30">
          <div className="bg-[#181113] border border-red-900 rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="inline-flex p-3 bg-red-950/80 rounded-full border border-red-800 mb-3 text-red-400">
              <Skull className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-red-400 mb-1">CANDIDATE REJECTED</h2>
            <p className="text-xs font-mono text-red-300 uppercase tracking-widest mb-4">Status: Overwhelmed by Responsibilities</p>

            <div className="bg-black/60 border border-slate-800 rounded p-4 text-xs text-slate-300 text-left font-mono mb-6 leading-relaxed">
              <p>Dear Candidate,</p>
              <p className="mt-2">Thank you for your interest in survival. Unfortunately, our committee has decided to move forward with candidates possessing 10+ years of shower immunity and higher corporate synergy.</p>
              <p className="mt-3 text-amber-300 font-bold">Survived: {Math.floor(stats.timeSurvived)}s | EXP: {stats.exp}</p>
            </div>

            <button
              onClick={onRestart}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer shadow-lg uppercase tracking-wider text-sm transition-all"
            >
              Re-Apply (Try Again)
            </button>
          </div>
        </div>
      )}

      {/* VICTORY MODAL: Officially Unemployable */}
      {status === 'victory' && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center pointer-events-auto p-4 z-30">
          <div className="bg-[#0f1712] border border-emerald-800 rounded-xl p-8 max-w-lg w-full shadow-2xl text-center">
            <div className="inline-flex p-3 bg-emerald-950/80 rounded-full border border-emerald-700 mb-3 text-emerald-400">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 mb-1">OFFICIALLY UNEMPLOYABLE!</h2>
            <p className="text-xs font-mono text-emerald-300 uppercase tracking-widest mb-4">
              Perpetual Vacation Unlocked
            </p>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              You avoided touching grass, evaded all unpaid internship lasers, silenced the scalding shower flood, juked the door-to-door recruiters, and collected maximum Halloween candy!
            </p>

            <div className="grid grid-cols-2 gap-2 text-left bg-black/60 border border-slate-800 rounded p-4 text-xs font-mono text-slate-300 mb-6">
              <div>• Time Survived: <span className="text-white font-bold">{Math.floor(stats.timeSurvived)}s</span></div>
              <div>• Total EXP: <span className="text-amber-400 font-bold">{stats.exp}</span></div>
              <div>• Threats Dodged: <span className="text-emerald-400 font-bold">{stats.threatsDodged}</span></div>
              <div>• Bosses Slain: <span className="text-purple-400 font-bold">{stats.bossesDefeated}</span></div>
              <div>• Treats Collected: <span className="text-pink-400 font-bold">{stats.candyCount}</span></div>
              <div>• Doors Knocked: <span className="text-blue-400 font-bold">{stats.doorsKnocked}</span></div>
            </div>

            <button
              onClick={onRestart}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg cursor-pointer shadow-lg uppercase tracking-wider text-sm transition-all"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* HELP / GUIDE MODAL */}
      {showHelp && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto p-4 z-30">
          <div className="bg-[#0f131a] border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-amber-400">SURVIVAL GUIDE</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
              <p><strong className="text-red-400">J*b Application Laser:</strong> A red laser projects from the bathroom wall. Step out of its trajectory before the resume shoots across the room (+80 EXP).</p>
              <p><strong className="text-emerald-400">Touch Grass:</strong> Toxic grass sprouts across the floor. Jump atop the vanity or toilet platform to remain safe (+80 EXP).</p>
              <p><strong className="text-blue-400">Deodorant Shower Flood:</strong> Look at the shower valve and hold [E] for 1.8s to shut off the water (+100 EXP).</p>
              <p><strong className="text-amber-400">Chef Knife:</strong> Pick it up off the floor using [E]. Left-click slashes enemies and bosses!</p>
              <p><strong className="text-purple-400">Job or Treat (Level 2):</strong> Walk up to suburban houses and hold [E] to knock. 80% give sweet candy, 20% summon recruiters or bosses!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
