import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useMonadFighters, useFight, useWatchFightMoves } from '../hooks/useMonadFighters';
import { FIGHTERS } from './CharacterSelect';
import { CONTRACT_ADDRESS, ABI } from '../constants';

export default function Arena({ fightId, onBackToSelect }) {
  const { address } = useAccount();
  const { playMove, forfeitFight, fundSession, authorizeSession, sessionAddress, isPending } = useMonadFighters();
  const { data: fightData } = useFight(fightId);

  const { data: remoteSession } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'sessionWallets',
    args: [address],
    query: { refetchInterval: 3000 }
  });

  const isSessionReady = remoteSession?.toLowerCase() === sessionAddress?.toLowerCase();

  const [setupStep, setSetupStep] = useState(0); // 0=idle, 1=funding, 2=authorizing, 3=ready
  const [anim1, setAnim1] = useState('');
  const [anim2, setAnim2] = useState('');
  const [flash, setFlash] = useState(false);
  const [lastMoveMsg, setLastMoveMsg] = useState('');

  useWatchFightMoves(fightId, (log) => {
    const isAttacker = log.player === fightData?.player1;
    const moveType = Number(log.moveType);
    const wasHit = log.wasHit;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    if (moveType === 3) {
      setLastMoveMsg(`${isAttacker ? 'P1' : 'P2'} BLOCKS! 🛡️`);
    } else {
      const dmg = Number(log.damage);
      setLastMoveMsg(`${isAttacker ? 'P1' : 'P2'} ${wasHit ? `HIT for ${dmg} dmg! 💥` : 'MISSED! 😤'}`);
      if (isAttacker) { setAnim1('scale-125'); if (wasHit) setAnim2('opacity-50'); }
      else { setAnim2('scale-125'); if (wasHit) setAnim1('opacity-50'); }
      setTimeout(() => { setAnim1(''); setAnim2(''); }, 400);
    }
  });

  const handleEnableOnClick = async () => {
    try {
      setSetupStep(1);
      await fundSession(); // Send 0.005 MON to burner
      setSetupStep(2);
      await authorizeSession(); // Tell contract burner is authorized
      setSetupStep(3);
    } catch (e) {
      console.error(e);
      setSetupStep(0);
      alert('Setup failed: ' + (e.shortMessage || e.message));
    }
  };

  if (!fightData) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-mono animate-pulse text-sm tracking-widest">
      LOADING ARENA...
    </div>
  );

  const f1 = FIGHTERS[fightData.fighter1Id];
  const f2 = FIGHTERS[fightData.fighter2Id];
  const isP1 = address === fightData.player1;
  const isP2 = address === fightData.player2;
  const isPlayer = isP1 || isP2;

  const rawStatus = Number(fightData.status);
  const isWaiting = rawStatus === 0;
  const isFighting = rawStatus === 1;
  const isResolved = rawStatus === 2;
  const myTurn = fightData.nextTurn?.toLowerCase() === address?.toLowerCase();

  const p1hp = Number(fightData.p1HP);
  const p2hp = Number(fightData.p2HP);
  const currentWinner = fightData.winner;
  const amIWinner = currentWinner?.toLowerCase() === address?.toLowerCase();

  const handleMove = async (type) => {
    try { await playMove(fightId, type); }
    catch (e) { console.error("Move failed", e); }
  };

  const handleForfeit = async () => {
    if (!confirm('Forfeit this fight? You will lose your stake.')) return;
    try { await forfeitFight(fightId); }
    catch (e) { alert('Forfeit failed: ' + (e.shortMessage || e.message)); }
  };

  // Fighter stats for tooltip display
  const STATS = [
    { light: '10-18', heavy: '22-35', acc: '85%/50%', block: '40%' },
    { light: '8-14',  heavy: '16-26', acc: '95%/60%', block: '30%' },
    { light: '12-20', heavy: '30-45', acc: '75%/40%', block: '65%' },
    { light: '14-22', heavy: '28-42', acc: '80%/55%', block: '20%' },
    { light: '5-25',  heavy: '10-50', acc: '70%/45%', block: '35%' },
    { light: '12-16', heavy: '24-32', acc: '90%/55%', block: '45%' },
  ];

  const myFighterId = isP1 ? fightData.fighter1Id : fightData.fighter2Id;
  const myStats = STATS[myFighterId];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden"
         style={{
           background: 'radial-gradient(ellipse at 50% 100%, #2d1b00 0%, #1a0a2e 40%, #050508 100%)',
         }}>

      {/* Animated arena floor glow */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
           style={{ background: 'radial-gradient(ellipse at center bottom, rgba(168,85,247,0.15) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500/20" />

      {flash && <div className="absolute inset-0 bg-white/10 pointer-events-none z-50" />}

      {/* HEADER */}
      <div className="bg-black/70 backdrop-blur-xl border-b border-white/10 px-6 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button onClick={onBackToSelect} className="text-xs font-bold text-slate-500 hover:text-white transition-colors px-3 py-1 border border-white/10 rounded">
            ← LOBBY
          </button>
          {isPlayer && isFighting && (
            <button onClick={handleForfeit} disabled={isPending}
              className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors px-3 py-1 border border-red-500/20 rounded hover:bg-red-500/10">
              🏳 FORFEIT
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-500 font-mono tracking-widest">FIGHT #{fightId.toString()}</p>
          <p className={`text-xs font-black italic tracking-wide uppercase ${isFighting ? 'text-green-400' : isWaiting ? 'text-yellow-400 animate-pulse' : 'text-slate-500'}`}>
            {isWaiting ? 'WAITING FOR OPPONENT' : isFighting ? '⚔️ BATTLE ACTIVE' : '🏆 RESOLVED'}
          </p>
        </div>

        <div className="text-right">
          {!isSessionReady && isPlayer && isFighting ? (
            <button onClick={handleEnableOnClick} disabled={setupStep > 0}
              className="px-4 py-2 bg-yellow-500 text-black font-black text-[10px] rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-60">
              {setupStep === 0 && '⚡ ENABLE NO-POPUP MODE'}
              {setupStep === 1 && '💰 FUNDING WALLET...'}
              {setupStep === 2 && '🔑 AUTHORIZING...'}
            </button>
          ) : isSessionReady ? (
            <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-3 py-2 rounded border border-green-500/20">⚡ ONE-CLICK ACTIVE</span>
          ) : (
            <div className="text-right">
              <p className="text-[10px] text-slate-600 font-mono uppercase">Stake Pool</p>
              <p className="text-sm font-black text-yellow-400">{formatEther(fightData.stake * 2n)} MON</p>
            </div>
          )}
        </div>
      </div>

      {/* HP BARS */}
      <div className="px-8 py-5 flex items-center gap-8 z-30 bg-black/40">
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-xs font-black italic" style={{ color: f1?.color }}>{f1?.name} {fightData.p1Blocking && '🛡️'}</span>
            <span className="text-xs text-white font-mono">{p1hp} HP</span>
          </div>
          <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${p1hp}%`, background: p1hp > 50 ? '#22c55e' : p1hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
        <div className="text-xl font-black italic text-white/20">VS</div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-white font-mono">{isWaiting ? '??' : p2hp} HP</span>
            <span className="text-xs font-black italic" style={{ color: f2?.color }}>{isWaiting ? '???' : f2?.name} {fightData.p2Blocking && '🛡️'}</span>
          </div>
          <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full rounded-full transition-all duration-500 ml-auto"
                 style={{ width: `${isWaiting ? 0 : p2hp}%`, background: p2hp > 50 ? '#22c55e' : p2hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
      </div>

      {/* STAGE */}
      <div className="flex-1 flex items-end justify-between px-16 pb-8 relative">

        {/* P1 FIGHTER */}
        <div className={`flex flex-col items-center transition-all duration-300 ${anim1}`}>
          <div className={`w-56 h-56 rounded-full overflow-hidden border-4 bg-slate-900/80 shadow-[0_0_60px_rgba(168,85,247,0.3)] transition-all ${isFighting && fightData.nextTurn === fightData.player1 ? 'ring-4 ring-purple-500 scale-105' : ''}`}
               style={{ borderColor: f1?.color + '66' }}>
            <img src={`/fighters/f${fightData.fighter1Id}.png`} alt={f1?.name} className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 text-center">
            <p className="text-[10px] text-slate-500 font-mono uppercase">{fightData.player1?.slice(0,6)}...{fightData.player1?.slice(-4)}</p>
          </div>
        </div>

        {/* CENTER COMBAT UI */}
        <div className="flex flex-col items-center gap-4 z-40 flex-1 max-w-sm mx-8">
          {isFighting && isPlayer ? (
            <div className="w-full bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl">
              <p className={`text-[10px] font-black tracking-widest mb-4 text-center ${myTurn ? 'text-green-400 animate-pulse' : 'text-slate-600'}`}>
                {myTurn ? '⚡ YOUR TURN — CHOOSE MOVE' : '⏳ OPPONENT\'S TURN...'}
              </p>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={() => handleMove(1)} disabled={!myTurn || isPending}
                  className="flex flex-col items-center p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600/30 transition-all disabled:opacity-20 group">
                  <span className="text-xl mb-1">🗡️</span>
                  <span className="text-[10px] font-black text-blue-400">LIGHT</span>
                  {myStats && <span className="text-[8px] text-slate-600 mt-0.5">{myStats.light} dmg</span>}
                </button>
                <button onClick={() => handleMove(2)} disabled={!myTurn || isPending}
                  className="flex flex-col items-center p-3 bg-red-600/10 border border-red-500/20 rounded-xl hover:bg-red-600/30 transition-all disabled:opacity-20 group">
                  <span className="text-xl mb-1">🪓</span>
                  <span className="text-[10px] font-black text-red-400">HEAVY</span>
                  {myStats && <span className="text-[8px] text-slate-600 mt-0.5">{myStats.heavy} dmg</span>}
                </button>
                <button onClick={() => handleMove(3)} disabled={!myTurn || isPending}
                  className="flex flex-col items-center p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-600/30 transition-all disabled:opacity-20 group">
                  <span className="text-xl mb-1">🛡️</span>
                  <span className="text-[10px] font-black text-yellow-400">BLOCK</span>
                  {myStats && <span className="text-[8px] text-slate-600 mt-0.5">{myStats.block} reduce</span>}
                </button>
              </div>

              {lastMoveMsg && (
                <p className="text-[10px] text-center font-mono text-purple-300 animate-bounce tracking-wider">{lastMoveMsg}</p>
              )}

              {/* My fighter stats card */}
              {myStats && (
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-[8px] text-slate-600 font-mono">
                  <span>LIGHT ACC: {myStats.acc.split('/')[0]}</span>
                  <span>HEAVY ACC: {myStats.acc.split('/')[1]}</span>
                </div>
              )}
            </div>
          ) : isResolved ? (
            <div className="w-full bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 text-center shadow-2xl">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">FIGHT OVER</p>
              <h3 className={`text-5xl font-black italic tracking-tighter mb-2 ${amIWinner ? 'text-yellow-400' : 'text-red-500'}`}>
                {amIWinner ? 'VICTORY!' : 'DEFEAT'}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {amIWinner ? `+${formatEther(fightData.stake * 2n)} MON earned!` : 'Better luck next time'}
              </p>
              <button onClick={onBackToSelect}
                className="w-full py-4 bg-purple-600 text-white font-black italic rounded-2xl hover:bg-purple-500 transition-all">
                BACK TO LOBBY
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-t-2 border-purple-500 rounded-full animate-spin" />
              <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Waiting for opponent...</p>
              <p className="text-[10px] text-purple-500 font-mono">Share Fight ID: <span className="font-black">#{fightId.toString()}</span></p>
            </div>
          )}
        </div>

        {/* P2 FIGHTER */}
        <div className={`flex flex-col items-center transition-all duration-300 ${anim2}`}>
          <div className={`w-56 h-56 rounded-full overflow-hidden border-4 bg-slate-900/80 shadow-[0_0_60px_rgba(168,85,247,0.3)] transition-all ${isFighting && fightData.nextTurn === fightData.player2 ? 'ring-4 ring-purple-500 scale-105' : ''}`}
               style={{ borderColor: isWaiting ? '#333' : f2?.color + '66' }}>
            {!isWaiting
              ? <img src={`/fighters/f${fightData.fighter2Id}.png`} alt={f2?.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-6xl text-slate-700">?</div>
            }
          </div>
          <div className="mt-3 text-center">
            {!isWaiting && <p className="text-[10px] text-slate-500 font-mono uppercase">{fightData.player2?.slice(0,6)}...{fightData.player2?.slice(-4)}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
