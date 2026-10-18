import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import { HUD } from './components/HUD';
import { PlayerStats, ActiveThreat, ToastMessage, GameStatus } from './game/types';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [status, setStatus] = useState<GameStatus>('intro');
  const [stats, setStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    exp: 0,
    level: 1,
    hasKnife: false,
    score: 0,
    threatsDodged: 0,
    bossesDefeated: 0,
    candyCount: 0,
    doorsKnocked: 0,
    timeSurvived: 0,
  });

  const [threat, setThreat] = useState<ActiveThreat>({
    type: 'none',
    timer: 0,
    duration: 0,
    state: 'cleared',
  });

  const [bossHp, setBossHp] = useState<{ current: number; max: number; name: string } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);
  const [targetedObject, setTargetedObject] = useState<'none' | 'knife' | 'valve' | 'door' | 'exit_door'>('none');
  const [targetedHouseName, setTargetedHouseName] = useState<string | undefined>(undefined);
  const [interactionProgress, setInteractionProgress] = useState<number>(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Game Engine
    const engine = new GameEngine(mountRef.current);
    engineRef.current = engine;

    // State Synchronization
    engine.onStateUpdate = (newStats, newThreat, currentBossHp) => {
      setStats({ ...newStats });
      setThreat({ ...newThreat });
      setBossHp(currentBossHp);
      setTargetedObject(engine.targetedObject);
      setTargetedHouseName(engine.targetedHouse?.name);
      setInteractionProgress(engine.interactionProgress);
    };

    engine.onStatusChange = (newStatus) => {
      setStatus(newStatus);
    };

    engine.onDamageFlash = () => {
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 350);
    };

    engine.onToast = (toast) => {
      setToasts((prev) => [...prev.slice(-4), toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    };

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    engineRef.current?.startGame();
  };

  const handleRestart = () => {
    engineRef.current?.startGame();
  };

  const handleResume = () => {
    engineRef.current?.resume();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Interactive HUD Overlay */}
      <HUD
        stats={stats}
        threat={threat}
        bossHp={bossHp}
        toasts={toasts}
        targetedObject={targetedObject}
        houseName={targetedHouseName}
        interactionProgress={interactionProgress}
        damageFlash={damageFlash}
        onRestart={handleRestart}
        status={status}
        onStartGame={handleStartGame}
        onResume={handleResume}
      />
    </main>
  );
}
