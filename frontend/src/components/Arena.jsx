import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { useMonadFighters, useFight } from '../hooks/useMonadFighters';
import { FIGHTERS } from './CharacterSelect';

export default function Arena({ fightId, onBackToSelect }) {
  const { address } = useAccount();
  const { betOnFighter, resolveFight, isPending } = useMonadFighters();
  const { data: fightData, refetch } = useFight(fightId);

  // local game phases
  const [phase, setPhase] = useState('idle'); // idle | animating | resolved
  const [winner, setWinner] = useState(null);
  
  // betting state
  const [betSide, setBetSide] = useState(null);
  const [betAmount, setBetAmount] = useState('0.01');
  
  // animations and health
  const [p1hp, setP1hp] = useState(100);
  const [p2hp, setP2hp] = useState(100);
  const [anim1, setAnim1] = useState('');
  const [anim2, setAnim2] = useState('');
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    // If we're already resolved on chain, jump to final view
    if (fightData && fightData.status === 3 && phase === 'idle') {
      setPhase('resolved');
      setWinner(fightData.winner);
    }
  }, [fightData]);

  const handleFight = async () => {
    setPhase('animating');
    setFlash(true);
    setTimeout(() => setFlash(false), 300);

    // 🏆 Start the theatrical sequence
    runFightSequence();

    // ⛓️ Resolve on-chain simultaneously
    try {
      await resolveFight(fightId);
      // Wait for the animation to catch up or for the tx to complete
    } catch (e) {
      console.error('Resolve failed:', e);
    }
  };

  const runFightSequence = async () => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // ROUND 1: P1 Attacks
    await sleep(600);
    setAnim1('animate-attack-right');
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    setAnim2('animate-take-hit');
    setP2hp(65);
    await sleep(800);
    setAnim1(''); setAnim2('');

    // ROUND 2: P2 Retaliates
    await sleep(400);
    setAnim2('animate-attack-left');
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    setAnim1('animate-take-hit');
    setP1hp(70);
    await sleep(800);
    setAnim1(''); setAnim2('');

    // ROUND 3: CLASH!
    await sleep(400);
    setAnim1('animate-attack-right');
    setAnim2('animate-attack-left');
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    await sleep(600);
    setAnim1(''); setAnim2('');

    // FINAL BLOW: 
    // Wait for contract result if we haven't seen it yet
    let freshData = await refetch();
    while (freshData.data.status !== 3) {
      await sleep(1000);
      freshData = await refetch();
    }

    const onChainWinner = freshData.data.winner;
    setWinner(onChainWinner);
    setPhase('resolved');

    // Winner finishing move
    if (onChainWinner === fightData.player1) {
      setP2hp(0);
      setAnim2('animate-knockout');
      setAnim1('animate-victory');
    } else {
      setP1hp(0);
      setAnim1('animate-knockout');
      setAnim2('animate-victory');
    }
  };

  const handleBet = async () => {
    if (!betSide) return alert('Select a side to bet on!');
    try {
      await betOnFighter(fightId, betSide, betAmount);
    } catch (e) {
      alert('Bet failed: ' + e.message);
    }
  };

  if (!fightData) return <div className="min-h-screen bg-black flex items-center justify-center text-slate-500 font-mono tracking-widest uppercase">INITIALIZING ARENA DATA...</div>;

  const f1 = FIGHTERS[fightData.fighter1Id];
  const f2 = FIGHTERS[fightData.fighter2Id];
  const isP1 = address === fightData.player1;
  const isP2 = address === fightData.player2;
  const isPlayer = isP1 || isP2;
  
  // ⚡ FIX: BigInt or raw status check
  const rawStatus = Number(fightData.status); 
  const isWaiting = rawStatus === 0;
  const isBettingOpen = rawStatus === 1;
  const isResolved = phase === 'resolved' || rawStatus === 3;
  const currentWinner = winner || fightData.winner;
  const amIWinner = currentWinner === address;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" 
         style={{ backgroundImage: 'url(/arena.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#0a0a0f' }}>
      
      {/* FLASH OVERLAY --- T-49 */}
      {flash && <div className="absolute inset-0 bg-red-500/20 pointer-events-none z-50"></div>}

      {/* HEADER --- T-40 */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-40">
        <button onClick={onBackToSelect} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">← ABANDON</button>
        <div className="text-center">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ARENA // FIGHT #{fightId.toString()}</p>
            <p className={`text-sm font-black italic tracking-tighter uppercase ${isBettingOpen ? 'text-green-400' : 'text-purple-400 animate-pulse'}`}>
                {isWaiting ? 'WAITING FOR OPPONENT' : isBettingOpen ? 'BETTING OPEN' : phase === 'animating' ? 'BATTLE IN PROGRESS' : 'FIGHT ENDED'}
            </p>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">TOTAL POT</p>
            <p className="text-yellow-400 font-black italic">{formatEther(fightData.stake * 2n + fightData.crowdPot)} MON</p>
        </div>
      </div>

      {/* HEALTH BARS --- T-41 */}
      <div className="bg-black/60 backdrop-blur-md px-12 py-6 flex items-center gap-10 z-30">
        {/* P1 HP */}
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-black italic tracking-tighter" style={{ color: f1.color }}>{f1.name}</span>
            <span className="text-xs text-slate-400 font-mono uppercase">{p1hp}% HP</span>
          </div>
          <div className="h-6 bg-slate-900 border border-white/5 rounded-full overflow-hidden p-1 shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${p1hp}%`, background: p1hp > 50 ? '#22c55e' : p1hp > 25 ? '#eab308' : '#ef4444' }}
            />
          </div>
        </div>

        <div className="text-3xl font-black italic text-white/20 tracking-tighter pointer-events-none">VS</div>

        {/* P2 HP */}
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-slate-400 font-mono uppercase">{p2hp}% HP</span>
            <span className="text-xs font-black italic tracking-tighter text-right" style={{ color: isWaiting ? '#333' : f2?.color }}>
              {isWaiting ? '???' : f2?.name}
            </span>
          </div>
          <div className="h-6 bg-slate-900 border border-white/5 rounded-full overflow-hidden p-1 shadow-inner">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out ml-auto"
              style={{ width: `${p2hp}%`, background: p2hp > 50 ? '#22c55e' : p2hp > 25 ? '#eab308' : '#ef4444' }}
            />
          </div>
        </div>
      </div>

      {/* STAGE AREA --- T-42 */}
      <div className="flex-1 flex items-center justify-between px-20">
        
        {/* PLAYER 1 */}
        <div className={`flex flex-col items-center transition-all duration-300 ${anim1}`} style={{ filter: isResolved && currentWinner !== fightData.player1 ? 'grayscale(1) opacity(0.3)' : 'none' }}>
           <div className="w-64 h-64 rounded-full overflow-hidden border-8 shadow-[0_0_80px_rgba(168,85,247,0.4)] bg-slate-900 transform hover:scale-105 transition-transform" style={{ borderColor: f1.color + '66' }}>
              <img src={`/fighters/f${fightData.fighter1Id}.png`} alt={f1.name} className="w-full h-full object-cover" />
           </div>
           <div className="mt-8 bg-black/80 px-6 py-3 rounded-2xl border border-white/10 text-center backdrop-blur-3xl shadow-2xl">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">{fightData.player1.slice(0,6)}...{fightData.player1.slice(-4)}</p>
              {isResolved && currentWinner === fightData.player1 && <p className="text-yellow-400 font-black italic text-md mt-1 tracking-tighter animate-bounce px-2">VICTORIOUS</p>}
           </div>
        </div>

        {/* FIGHT CTRL --- T-43 & T-44 */}
        <div className="text-center z-40">
           {isWaiting && (
             <div className="bg-black/95 p-10 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6 shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
                <p className="text-sm text-slate-400 font-black tracking-widest uppercase italic">SCANNING CHAIN...<br/><span className="text-purple-500 text-xs mt-2 block animate-pulse">Waiting for Challenger</span></p>
                <p className="text-[10px] text-slate-600 font-mono mt-6 border-t border-white/5 pt-4">BATTLE ID: #{fightId.toString()}</p>
             </div>
           )}
           
           {isBettingOpen && phase === 'idle' && isPlayer && (
             <button 
                onClick={handleFight}
                disabled={isPending}
                className="px-16 py-8 bg-red-600 rounded-[2rem] font-black italic text-5xl tracking-tighter text-white shadow-[0_0_80px_rgba(220,38,38,0.6)] hover:shadow-[0_0_120px_rgba(220,38,38,0.9)] transition-all active:scale-95 hover:-translate-y-2"
             >
                {isPending ? 'DEPLOYING...' : 'FINISH THEM'}
             </button>
           )}

           {phase === 'animating' && <p className="text-8xl font-black italic text-red-500 animate-pulse tracking-tighter drop-shadow-[0_0_40px_rgba(239,68,68,0.5)]">FIGHT!</p>}
        </div>

        {/* PLAYER 2 */}
        <div className={`flex flex-col items-center transition-all duration-300 ${anim2}`} style={{ filter: isResolved && currentWinner !== fightData.player2 ? 'grayscale(1) opacity(0.3)' : 'none' }}>
           <div className="w-64 h-64 rounded-full overflow-hidden border-8 shadow-[0_0_80px_rgba(6,182,212,0.4)] bg-slate-900 transform scale-x-[-1] hover:scale-x-[-1.05] transition-transform" style={{ borderColor: isWaiting ? '#1e1e1e' : (FIGHTERS[fightData.fighter2Id]?.color + '66') }}>
              {isWaiting ? (
                <div className="w-full h-full flex items-center justify-center text-8xl grayscale opacity-20">?</div>
              ) : (
                <img src={`/fighters/f${fightData.fighter2Id}.png`} alt={FIGHTERS[fightData.fighter2Id]?.name} className="w-full h-full object-cover" />
              )}
           </div>
           <div className="mt-8 bg-black/80 px-6 py-3 rounded-2xl border border-white/10 text-center backdrop-blur-3xl shadow-2xl">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                {isWaiting ? 'GHOST SIGNATURE' : `${fightData.player2.slice(0,6)}...${fightData.player2.slice(-4)}`}
              </p>
              {isResolved && currentWinner === fightData.player2 && <p className="text-yellow-400 font-black italic text-md mt-1 tracking-tighter animate-bounce px-2">VICTORIOUS</p>}
           </div>
        </div>
      </div>

      {/* CROWD BETTING --- T-51 to T-53 */}
      {isBettingOpen && phase === 'idle' && !isPlayer && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 p-4 rounded-3xl backdrop-blur-3xl w-full max-w-xl shadow-2xl z-40">
           <p className="text-center text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">Live Spectator Betting Open</p>
           <div className="flex gap-4">
              <button onClick={() => setBetSide(1)} className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-black italic text-sm ${betSide === 1 ? 'border-purple-600 bg-purple-600/10 text-purple-400' : 'border-white/5 bg-white/5 text-slate-500'}`}>
                BET {f1.name}
              </button>
              <div className="bg-slate-900 rounded-2xl border border-white/5 flex flex-col justify-center px-6">
                <input type="number" step="0.001" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} className="bg-transparent text-xl font-black text-white text-center outline-none w-20" />
                <span className="text-[10px] text-slate-600 font-bold uppercase text-center">MON</span>
              </div>
              <button onClick={() => setBetSide(2)} className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-black italic text-sm ${betSide === 2 ? 'border-cyan-600 bg-cyan-600/10 text-cyan-400' : 'border-white/5 bg-white/5 text-slate-500'}`}>
                BET {f2.name}
              </button>
           </div>
           <button onClick={handleBet} disabled={isPending} className="w-full mt-4 py-4 bg-yellow-500 text-black font-black uppercase rounded-2xl hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/20 active:scale-95">
              PLACE BET
           </button>
        </div>
      )}

      {/* RESULT MODAL --- T-50 */}
      {isResolved && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
           <div className={`p-16 rounded-[4rem] text-center border-4 ${amIWinner ? 'border-yellow-500 bg-yellow-500/5' : 'border-white/10 bg-white/5'}`}>
              <p className="text-8xl mb-8 animate-bounce">{amIWinner ? '🏆' : '💀'}</p>
              <h2 className={`text-7xl font-black italic tracking-tighter mb-4 ${amIWinner ? 'text-yellow-500' : 'text-slate-400'}`}>
                {amIWinner ? 'VICTORY ACQUIRED' : 'ARENA DEFEAT'}
              </h2>
              <p className="text-purple-400 font-mono text-sm uppercase tracking-widest mb-10">
                Winner: {currentWinner.slice(0, 10)}...{currentWinner.slice(-6)}
              </p>
              <div className="bg-white/5 p-6 rounded-3xl mb-12">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-1">Estimated Payout</p>
                <p className="text-4xl font-black italic text-white flex items-center justify-center gap-2">
                   {formatEther(fightData.stake * 2n)} <span className="text-xs text-yellow-500 not-italic">MON</span>
                </p>
              </div>
              <button 
                onClick={onBackToSelect}
                className="px-16 py-6 bg-purple-600 text-white font-black italic text-2xl rounded-2xl shadow-2xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all hover:scale-105"
              >
                FIGHT AGAIN
              </button>
           </div>
        </div>
      )}

    </div>
  );
}
