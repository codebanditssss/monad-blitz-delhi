import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useMonadFighters, useFight, useWatchFightMoves } from '../hooks/useMonadFighters';
import { FIGHTERS } from './CharacterSelect';
import { CONTRACT_ADDRESS, ABI } from '../constants';

const STATS = [
  { light: '10-18', heavy: '22-35', lightAcc: '85%', heavyAcc: '50%', block: '40%' },
  { light: '8-14',  heavy: '16-26', lightAcc: '95%', heavyAcc: '60%', block: '30%' },
  { light: '12-20', heavy: '30-45', lightAcc: '75%', heavyAcc: '40%', block: '65%' },
  { light: '14-22', heavy: '28-42', lightAcc: '80%', heavyAcc: '55%', block: '20%' },
  { light: '5-25',  heavy: '10-50', lightAcc: '70%', heavyAcc: '45%', block: '35%' },
  { light: '12-16', heavy: '24-32', lightAcc: '90%', heavyAcc: '55%', block: '45%' },
];

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
  const [setupStep, setSetupStep] = useState(0);
  const [anim1, setAnim1] = useState('');
  const [anim2, setAnim2] = useState('');
  const [flash, setFlash] = useState(false);
  const [lastMoveMsg, setLastMoveMsg] = useState('');

  useWatchFightMoves(fightId, (log) => {
    const isP1Move = log.player?.toLowerCase() === fightData?.player1?.toLowerCase();
    const moveType = Number(log.moveType);
    const wasHit = log.wasHit;
    const dmg = Number(log.damage);
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
    if (moveType === 3) {
      setLastMoveMsg(`${isP1Move ? 'P1' : 'P2'} BLOCKS! 🛡️`);
    } else {
      setLastMoveMsg(`${isP1Move ? 'P1' : 'P2'} ${wasHit ? `HITS for ${dmg} dmg 💥` : 'MISSED! 😤'}`);
    }
    if (isP1Move) { setAnim1('scale-110'); setTimeout(() => setAnim1(''), 300); }
    else { setAnim2('scale-110'); setTimeout(() => setAnim2(''), 300); }
  });

  const handleEnableOnClick = async () => {
    try {
      setSetupStep(1);
      await fundSession();
      setSetupStep(2);
      await authorizeSession();
      setSetupStep(3);
    } catch (e) {
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
  const isP1 = address?.toLowerCase() === fightData.player1?.toLowerCase();
  const isP2 = address?.toLowerCase() === fightData.player2?.toLowerCase();
  const isPlayer = isP1 || isP2;

  const rawStatus = Number(fightData.status);
  const isWaiting = rawStatus === 0;
  const isFighting = rawStatus === 1;
  const isResolved = rawStatus === 2;
  const myTurn = fightData.nextTurn?.toLowerCase() === address?.toLowerCase();

  const p1hp = Number(fightData.p1HP);
  const p2hp = Number(fightData.p2HP);
  const amIWinner = fightData.winner?.toLowerCase() === address?.toLowerCase();

  const myFighterId = isP1 ? fightData.fighter1Id : fightData.fighter2Id;
  const myStats = STATS[myFighterId];

  const handleMove = async (type) => {
    try { await playMove(fightId, type); }
    catch (e) { console.error("Move failed", e.shortMessage || e.message); }
  };

  const handleForfeit = async () => {
    if (!confirm('Forfeit? You lose your stake.')) return;
    try { await forfeitFight(fightId); }
    catch (e) { alert('Forfeit failed: ' + (e.shortMessage || e.message)); }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden"
         style={{
           backgroundImage: 'url(/arena.png)',
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundColor: '#0a0a0f'
         }}>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      {flash && <div className="absolute inset-0 bg-white/10 pointer-events-none z-50" />}

      {/* HEADER */}
      <div className="relative z-40 bg-black/70 backdrop-blur-xl border-b border-white/10 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBackToSelect} className="text-[10px] font-bold text-slate-400 hover:text-white px-3 py-1.5 border border-white/10 rounded">
            ← LOBBY
          </button>
          {isPlayer && isFighting && (
            <button onClick={handleForfeit} disabled={isPending}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 px-3 py-1.5 border border-red-500/20 rounded hover:bg-red-500/10">
              🏳 FORFEIT
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest">FIGHT #{fightId.toString()} · STAKE: {formatEther(fightData.stake)} MON</p>
          <p className={`text-xs font-black italic uppercase ${isFighting ? 'text-green-400' : isWaiting ? 'text-yellow-400 animate-pulse' : 'text-slate-400'}`}>
            {isWaiting ? '⏳ WAITING FOR OPPONENT' : isFighting ? '⚔️ BATTLE ACTIVE' : '🏆 FIGHT RESOLVED'}
          </p>
        </div>

        <div className="text-right text-[10px] text-slate-500 font-mono">
          <p>POOL: {formatEther(fightData.stake * 2n)} MON</p>
        </div>
      </div>

      {/* SESSION BUTTON — below header, not overlapping */}
      {isPlayer && isFighting && !isSessionReady && (
        <div className="relative z-40 flex justify-center py-2 bg-black/40">
          <button onClick={handleEnableOnClick} disabled={setupStep > 0}
            className="px-5 py-1.5 bg-yellow-500 text-black font-black text-[10px] rounded-lg hover:bg-yellow-400 transition-all disabled:opacity-60">
            {setupStep === 0 && '⚡ ENABLE ONE-CLICK COMBAT (no more popups)'}
            {setupStep === 1 && '💰 Sending gas to your browser wallet...'}
            {setupStep === 2 && '🔑 Authorizing on-chain...'}
          </button>
        </div>
      )}
      {isPlayer && isFighting && isSessionReady && (
        <div className="relative z-40 flex justify-center py-1 bg-green-500/10 border-b border-green-500/20">
          <span className="text-[10px] font-black text-green-400">⚡ ONE-CLICK MODE ACTIVE — No MetaMask popups</span>
        </div>
      )}

      {/* HP BARS */}
      <div className="relative z-30 flex items-center gap-6 px-8 py-3 bg-black/50 border-b border-white/5">
        <div className="flex-1">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="font-black italic" style={{ color: f1?.color }}>{f1?.name} {fightData.p1Blocking && '🛡'}</span>
            <span className="text-white font-mono">{p1hp} HP</span>
          </div>
          <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width: `${p1hp}%`, background: p1hp > 50 ? '#22c55e' : p1hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
        <span className="text-sm font-black text-white/30 italic">VS</span>
        <div className="flex-1">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-white font-mono">{isWaiting ? '??' : p2hp} HP</span>
            <span className="font-black italic" style={{ color: f2?.color }}>{isWaiting ? '???' : f2?.name} {fightData.p2Blocking && '🛡'}</span>
          </div>
          <div className="h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
            <div className="h-full rounded-full transition-all duration-500 ml-auto"
                 style={{ width: `${isWaiting ? 0 : p2hp}%`, background: p2hp > 50 ? '#22c55e' : p2hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
      </div>

      {/* STAGE — fighters + combat UI */}
      <div className="relative z-20 flex-1 flex items-center justify-between px-12">

        {/* P1 */}
        <div className={`flex flex-col items-center transition-all duration-200 ${anim1}`}>
          <div className={`w-44 h-44 rounded-full overflow-hidden border-4 transition-all
                          ${isFighting && myTurn && isP1 ? 'ring-4 ring-purple-500 border-purple-500 scale-105' : 'border-white/20'}`}>
            <img src={`/fighters/f${fightData.fighter1Id}.png`} alt={f1?.name} className="w-full h-full object-cover" />
          </div>
          <p className="mt-2 text-[9px] text-slate-400 font-mono">{fightData.player1?.slice(0,6)}...{fightData.player1?.slice(-4)}</p>
        </div>

        {/* CENTER */}
        <div className="flex-1 max-w-xs mx-6">
          {isFighting && isPlayer && (
            <div className="bg-black/85 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
              <p className={`text-[9px] font-black tracking-widest mb-3 text-center ${myTurn ? 'text-green-400 animate-pulse' : 'text-slate-600'}`}>
                {myTurn ? '⚡ YOUR TURN' : "⏳ OPPONENT'S TURN"}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleMove(1)} disabled={!myTurn || isPending}
                  className="flex flex-col items-center p-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl hover:bg-blue-600/30 transition-all disabled:opacity-20">
                  <span className="text-lg">🗡️</span>
                  <span className="text-[9px] font-black text-blue-400 mt-0.5">LIGHT</span>
                  <span className="text-[8px] text-slate-500">{myStats?.light}</span>
                  <span className="text-[7px] text-slate-600">{myStats?.lightAcc} hit</span>
                </button>
                <button onClick={() => handleMove(2)} disabled={!myTurn || isPending}
                  className="flex flex-col items-center p-2.5 bg-red-600/10 border border-red-500/20 rounded-xl hover:bg-red-600/30 transition-all disabled:opacity-20">
                  <span className="text-lg">🪓</span>
                  <span className="text-[9px] font-black text-red-400 mt-0.5">HEAVY</span>
                  <span className="text-[8px] text-slate-500">{myStats?.heavy}</span>
                  <span className="text-[7px] text-slate-600">{myStats?.heavyAcc} hit</span>
                </button>
                <button onClick={() => handleMove(3)} disabled={!myTurn || isPending}
                  className="flex flex-col items-center p-2.5 bg-yellow-600/10 border border-yellow-500/20 rounded-xl hover:bg-yellow-600/30 transition-all disabled:opacity-20">
                  <span className="text-lg">🛡️</span>
                  <span className="text-[9px] font-black text-yellow-400 mt-0.5">BLOCK</span>
                  <span className="text-[8px] text-slate-500">{myStats?.block}</span>
                  <span className="text-[7px] text-slate-600">reduce</span>
                </button>
              </div>
              {lastMoveMsg && <p className="mt-3 text-[9px] text-center font-mono text-purple-300">{lastMoveMsg}</p>}
            </div>
          )}

          {isFighting && !isPlayer && (
            <div className="bg-black/70 rounded-2xl border border-white/10 p-4 text-center">
              <p className="text-[10px] text-slate-500 font-mono">SPECTATING</p>
              {lastMoveMsg && <p className="mt-2 text-[9px] text-purple-300 font-mono">{lastMoveMsg}</p>}
            </div>
          )}

          {isWaiting && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-t-2 border-purple-500 rounded-full animate-spin" />
              <p className="text-[9px] text-slate-500 font-mono uppercase">Waiting... share Fight ID: <span className="text-purple-400 font-black">#{fightId.toString()}</span></p>
            </div>
          )}

          {isResolved && (
            <div className="bg-black/90 rounded-2xl border border-white/10 p-6 text-center">
              <h3 className={`text-4xl font-black italic mb-2 ${amIWinner ? 'text-yellow-400' : 'text-red-500'}`}>
                {amIWinner ? 'VICTORY!' : 'DEFEAT'}
              </h3>
              <p className="text-[10px] text-slate-400 mb-4">
                {amIWinner ? `+${formatEther(fightData.stake * 2n)} MON earned` : 'Better luck next round'}
              </p>
              <button onClick={onBackToSelect} className="w-full py-3 bg-purple-600 text-white font-black text-sm rounded-xl hover:bg-purple-500">
                BACK TO LOBBY
              </button>
            </div>
          )}
        </div>

        {/* P2 */}
        <div className={`flex flex-col items-center transition-all duration-200 ${anim2}`}>
          <div className={`w-44 h-44 rounded-full overflow-hidden border-4 transition-all
                          ${isFighting && myTurn && isP2 ? 'ring-4 ring-purple-500 border-purple-500 scale-105' : 'border-white/20'}`}>
            {!isWaiting
              ? <img src={`/fighters/f${fightData.fighter2Id}.png`} alt={f2?.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-4xl text-slate-700">?</div>
            }
          </div>
          {!isWaiting && <p className="mt-2 text-[9px] text-slate-400 font-mono">{fightData.player2?.slice(0,6)}...{fightData.player2?.slice(-4)}</p>}
        </div>
      </div>
    </div>
  );
}
