import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useMonadFighters, useFight, useWatchFightMoves } from '../hooks/useMonadFighters';
import { FIGHTERS } from './CharacterSelect';
import { CONTRACT_ADDRESS, ABI } from '../constants';

export default function Arena({ fightId, onBackToSelect }) {
  const { address } = useAccount();
  const { playMove, betOnFighter, authorizeSession, sessionAddress, isPending } = useMonadFighters();
  const { data: fightData } = useFight(fightId);

  // Check if session is authorized
  const { data: remoteSession } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'sessionWallets',
    args: [address],
  });

  const isSessionReady = remoteSession?.toLowerCase() === sessionAddress?.toLowerCase();

  // local visuals
  const [anim1, setAnim1] = useState('');
  const [anim2, setAnim2] = useState('');
  const [flash, setFlash] = useState(false);
  const [lastMoveMsg, setLastMoveMsg] = useState('');

  useWatchFightMoves(fightId, (log) => {
    const isP1 = log.player === fightData?.player1;
    const moveType = Number(log.moveType);
    const wasHit = log.wasHit;

    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    if (moveType === 3) {
      setLastMoveMsg(`${isP1 ? 'P1' : 'P2'} IS BLOCKING! 🛡️`);
    } else {
      setLastMoveMsg(`${isP1 ? 'P1' : 'P2'} ${wasHit ? 'POUNDED' : 'WHIFFED'} A ${moveType === 1 ? 'LIGHT' : 'HEAVY'} ATTACK!`);
      if (isP1) {
        setAnim1('animate-attack-right');
        if (wasHit) setAnim2('animate-take-hit');
      } else {
        setAnim2('animate-attack-left');
        if (wasHit) setAnim1('animate-take-hit');
      }
      setTimeout(() => { setAnim1(''); setAnim2(''); }, 600);
    }
  });

  if (!fightData) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-mono animate-pulse">RECONSTRUCTING ARENA...</div>;

  const f1 = FIGHTERS[fightData.fighter1Id];
  const f2 = FIGHTERS[fightData.fighter2Id];
  const isP1 = address === fightData.player1;
  const isP2 = address === fightData.player2;
  const isPlayer = isP1 || isP2;
  
  const rawStatus = Number(fightData.status); 
  const isWaiting = rawStatus === 0;
  const isFighting = rawStatus === 1;
  const isResolved = rawStatus === 2;
  const myTurn = fightData.nextTurn === address;
  
  const p1hp = Number(fightData.p1HP);
  const p2hp = Number(fightData.p2HP);
  const currentWinner = fightData.winner;

  const handleMove = async (type) => {
     try {
       await playMove(fightId, type);
     } catch (e) {
       console.error("Move failed", e);
     }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#050508]" 
         style={{ backgroundImage: 'radial-gradient(circle at center, #1a0a2e 0%, #050508 80%)' }}>
      
      {flash && <div className="absolute inset-0 bg-white/20 pointer-events-none z-50 animate-pulse"></div>}

      {/* HEADER BAR */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-40">
        <button onClick={onBackToSelect} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">← RETREAT</button>
        <div className="text-center">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">MONAD ARENA // ID:{fightId.toString()}</p>
            <p className={`text-sm font-black italic tracking-tighter uppercase ${isFighting ? 'text-green-400' : 'text-purple-500 animate-pulse'}`}>
                {isWaiting ? 'PENDING OPPONENT...' : isFighting ? 'BATTLE ENGAGED' : 'BATTLE OVER'}
            </p>
        </div>
        {!isSessionReady && isPlayer && isFighting && (
          <button 
            onClick={() => authorizeSession()}
            className="px-4 py-2 bg-yellow-500 text-black font-black italic text-[10px] rounded hover:scale-105 transition-transform animate-bounce"
          >
            ENABLE ONE-CLICK COMBAT ⚡
          </button>
        )}
        {isSessionReady && isFighting && (
           <span className="text-[10px] font-black italic text-green-500 bg-green-500/10 px-3 py-2 rounded border border-green-500/20">ONE-CLICK ACTIVE 🛡️</span>
        )}
      </div>

      {/* TOP STATUS (HP) */}
      <div className="bg-black/60 backdrop-blur-md px-12 py-10 flex items-center gap-12 z-30">
        {/* P1 STATUS */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-1">CHALLENGER</p>
              <span className="text-lg font-black italic tracking-tighter" style={{ color: f1.color }}>{f1.name} {fightData.p1Blocking && '🛡️'}</span>
            </div>
            <span className="text-2xl font-black italic text-white">{p1hp}<span className="text-xs text-slate-500 ml-1">HP</span></span>
          </div>
          <div className="h-4 bg-slate-900 border border-white/5 rounded-full overflow-hidden p-0.5">
            <div className="h-full rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                 style={{ width: `${p1hp}%`, background: p1hp > 50 ? '#22c55e' : p1hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>

        <div className="text-5xl font-black italic text-white/5 tracking-tighter pointer-events-none">VS</div>

        {/* P2 STATUS */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-3">
            <span className="text-2xl font-black italic text-right text-white"><span className="text-xs text-slate-500 mr-1">HP</span>{isWaiting ? '??' : p2hp}</span>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em] mb-1">OPPONENT</p>
              <span className="text-lg font-black italic tracking-tighter" style={{ color: isWaiting ? '#222' : f2?.color }}>{isWaiting ? 'SENSING...' : f2?.name} {fightData.p2Blocking && '🛡️'}</span>
            </div>
          </div>
          <div className="h-4 bg-slate-900 border border-white/5 rounded-full overflow-hidden p-0.5">
            <div className="h-full rounded-full transition-all duration-500 ml-auto shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                 style={{ width: `${isWaiting ? 0 : p2hp}%`, background: p2hp > 50 ? '#22c55e' : p2hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
      </div>

      {/* STAGE */}
      <div className="flex-1 flex items-center justify-between px-20">
        <div className={`flex flex-col items-center transition-all duration-300 ${anim1}`}>
           <div className={`w-80 h-80 rounded-full overflow-hidden border-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] bg-slate-900 transition-all ${isFighting && fightData.nextTurn === fightData.player1 ? 'scale-110 border-white ring-8 ring-purple-500/20' : ''}`} style={{ borderColor: f1.color + '44' }}>
              <img src={`/fighters/f${fightData.fighter1Id}.png`} alt={f1.name} className="w-full h-full object-cover" />
           </div>
        </div>

        {/* DASHBOARD */}
        <div className="text-center z-40 w-full max-w-sm">
           {isFighting && isPlayer ? (
             <div className="flex flex-col gap-4">
                <div className="bg-black/95 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-[0_-20px_100px_rgba(168,85,247,0.1)]">
                   <p className={`text-xs font-black italic mb-6 tracking-widest ${myTurn ? 'text-green-400 animate-pulse' : 'text-slate-600'}`}>
                      {myTurn ? 'COMMAND AUTHORIZED: EXECUTE MOVE' : 'READYING DEFENSES: WAIT FOR PROTOCOL...'}
                   </p>
                   
                   <div className="grid grid-cols-1 gap-4">
                      <button 
                         onClick={() => handleMove(1)}
                         disabled={!myTurn || isPending}
                         className="group relative overflow-hidden px-8 py-5 bg-blue-600/10 border-2 border-blue-500/30 rounded-2xl font-black italic text-xl text-blue-400 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-20"
                      >
                         🗡️ LIGHT ATTACK
                      </button>
                      <button 
                         onClick={() => handleMove(2)}
                         disabled={!myTurn || isPending}
                         className="group relative overflow-hidden px-8 py-5 bg-red-600/10 border-2 border-red-500/30 rounded-2xl font-black italic text-xl text-red-500 hover:bg-red-600 hover:text-white transition-all disabled:opacity-20"
                      >
                         🪓 HEAVY ATTACK
                      </button>
                      <button 
                         onClick={() => handleMove(3)}
                         disabled={!myTurn || isPending}
                         className="group relative overflow-hidden px-8 py-4 bg-yellow-600/10 border-2 border-yellow-500/30 rounded-2xl font-black italic text-sm text-yellow-500 hover:bg-yellow-600 hover:text-slate-900 transition-all disabled:opacity-20"
                      >
                         🛡️ DEPLOY BLOCK
                      </button>
                   </div>
                </div>
                {lastMoveMsg && <p className="text-[10px] font-mono text-purple-400 animate-bounce tracking-widest uppercase">{lastMoveMsg}</p>}
             </div>
           ) : isResolved ? (
             <div className="bg-white/5 backdrop-blur-xl p-12 rounded-[3rem] border border-white/10 text-center animate-in zoom-in-95 duration-500">
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-2">BATTLE RESOLVED</p>
                <h3 className="text-6xl font-black italic text-yellow-500 tracking-tighter mb-8 leading-tight">VICTORY<br/>PROTOCOLS</h3>
                <button onClick={onBackToSelect} className="w-full py-5 bg-purple-600 text-white font-black italic rounded-2xl hover:bg-purple-500 transition-all">RETURN TO LOBBY</button>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-6 animate-pulse">
                <div className="w-20 h-20 border-t-2 border-purple-500 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-mono tracking-widest uppercase italic">SCANNING MONAD BLOCKS FOR OPPONENT...</p>
             </div>
           )}
        </div>

        <div className={`flex flex-col items-center transition-all duration-300 ${anim2}`}>
           <div className={`w-80 h-80 rounded-full overflow-hidden border-8 shadow-[0_0_80px_rgba(168,85,247,0.3)] bg-slate-900 transition-all ${isFighting && fightData.nextTurn === fightData.player2 ? 'scale-110 border-white ring-8 ring-purple-500/20' : ''}`} style={{ borderColor: isWaiting ? '#222' : f2?.color + '44' }}>
              {!isWaiting ? <img src={`/fighters/f${fightData.fighter2Id}.png`} alt={f2?.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">?</div>}
           </div>
        </div>
      </div>

      <div className="px-12 py-10 flex items-center justify-between z-30">
        <div className="flex gap-10">
            <div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Stake Pool</p>
                <p className="text-2xl font-black italic text-white">{formatEther(fightData.stake * 2n)} <span className="text-xs text-purple-400">MON</span></p>
            </div>
            <div>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Crowd Pot</p>
                <p className="text-2xl font-black italic text-yellow-500">{formatEther(fightData.crowdPot)} <span className="text-xs">MON</span></p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Combat Protocol Security</p>
            <div className="flex gap-2">
                <div className="w-1 h-3 bg-purple-500/40"></div>
                <div className="w-1 h-3 bg-purple-500/60"></div>
                <div className="w-1 h-3 bg-purple-500/80"></div>
                <div className="w-1 h-3 bg-purple-500"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
