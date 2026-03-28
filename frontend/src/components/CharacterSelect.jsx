import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { useMonadFighters, useFightCount, useActiveFights } from '../hooks/useMonadFighters';
import { CONTRACT_ADDRESS, ABI } from '../constants';

export const FIGHTERS = [
  { id: 0, name: 'CHAIN BREAKER', color: '#3B82F6', desc: 'Unstoppable force wrapped in glowing energy.' },
  { id: 1, name: 'GAS GHOST',     color: '#8B5CF6', desc: 'Spectral phantom made of neon purple smoke.' },
  { id: 2, name: 'BLOCK BEAST',   color: '#F97316', desc: 'Armored stone golem with glowing circuit lines.' },
  { id: 3, name: 'NODE NINJA',    color: '#22C55E', desc: 'Silent killer with green data stream flows.' },
  { id: 4, name: 'FORK FURY',     color: '#EAB308', desc: 'Electric yellow-fisted fighter of pure chaos.' },
  { id: 5, name: 'HASH HUNTER',   color: '#06B6D4', desc: 'Bounty hunter with high-precision teal visor.' },
];

export default function CharacterSelect({ onEnterArena, onJoinFight }) {
  const { isConnected } = useAccount();
  const { enterArena, startTraining, joinFight, isPending } = useMonadFighters();
  const { data: currentFightCount, refetch: refetchCount } = useFightCount();
  const { data: activeFights } = useActiveFights();
  
  const [selected, setSelected] = useState(null);
  const [stake, setStake] = useState('0.01'); 
  const [mode, setMode] = useState('create'); 

  const handleAction = async () => {
    if (selected === null) return alert('Pick a fighter first!');
    
    try {
      const predictedId = currentFightCount ? currentFightCount.toString() : "0";

      if (mode === 'create') {
        await enterArena(selected, stake);
        await refetchCount();
        onEnterArena(predictedId, selected);
      } else if (mode === 'train') {
        await startTraining(selected, stake);
        await refetchCount();
        onEnterArena(predictedId, selected);
      }
    } catch (e) {
        const shortMsg = e.shortMessage || e.message || "Unknown Error";
        alert(`BATTLE ERROR: ${shortMsg}`);
    }
  };

  const handleJoinLobby = async (fightId, lobbyStake) => {
    if (selected === null) return alert('PICK A FIGHTER BEFORE JOINING THE LOBBY!');
    try {
        await joinFight(fightId, selected, formatEther(lobbyStake));
        onJoinFight(fightId, selected);
    } catch (e) {
        alert("JOIN FAILED: Check your balance or if the fight is still open.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-6 bg-slate-950"
         style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #050508 70%)' }}>
      
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter mb-2 animate-glow italic text-purple-500">FIGHT CLUB</h1>
        <p className="text-purple-400 font-mono tracking-widest text-sm uppercase">On-chain PvP Arena // High Speed Battle</p>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center gap-4 bg-white/5 p-12 rounded-2xl border border-white/10 backdrop-blur-xl">
           <p className="text-slate-400 text-center text-sm font-mono max-w-xs trackers">INITIALIZE YOUR WALLET PROTOCOL TO ENTER THE BATTLE ARENA.</p>
        </div>
      ) : (
        <div className="w-full max-w-6xl flex flex-col items-center">
          
          <div className="flex gap-4 p-1 bg-white/5 rounded-lg border border-white/10 mb-10 w-full max-w-lg">
            {['create', 'join', 'train'].map((m) => (
              <button 
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-md text-[10px] font-black tracking-widest transition-all uppercase ${
                  mode === m ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                {m === 'create' ? 'PvP ARENA' : m === 'join' ? 'BATTLE LOBBY' : 'SHADOW TRAIN'}
              </button>
            ))}
          </div>

          {mode === 'join' ? (
            <div className="w-full max-w-3xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
                <h2 className="text-2xl font-black italic text-white tracking-widest mb-4">ACTIVE CHALLENGES</h2>
                {activeFights && activeFights.length > 0 ? (
                    activeFights.map(id => (
                        <LobbyItem key={id} fightId={id} onJoin={handleJoinLobby} selectedFighter={selected} />
                    ))
                ) : (
                    <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl text-center">
                        <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">No active brawlers waiting. Create your own arena above!</p>
                    </div>
                )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 w-full">
                {FIGHTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f.id)}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform text-left hover:scale-[1.03] active:scale-100 ${
                      selected === f.id ? 'bg-white/10' : 'bg-white/5 border-white/5'
                    }`}
                    style={{ borderColor: selected === f.id ? f.color : undefined, boxShadow: selected === f.id ? `0 0 30px ${f.color}33` : 'none' }}
                  >
                    <div className="aspect-square w-full mb-6 rounded-full overflow-hidden border-4 transition-all duration-500 flex items-center justify-center bg-slate-900" style={{ borderColor: f.color + '44' }}>
                      <img src={`/fighters/f${f.id}.png`} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-black text-xl italic tracking-tighter mb-1" style={{ color: f.color }}>{f.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono leading-relaxed line-clamp-2 uppercase">{f.desc}</p>
                  </button>
                ))}
              </div>

              <div className="sticky bottom-10 w-full max-w-2xl bg-black/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
                <div className="flex-1 flex flex-col justify-center px-4">
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1">STAKE (MON)</span>
                   <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} step="0.01" className="bg-transparent text-xl font-black text-white outline-none w-full" />
                </div>

                <button
                  onClick={handleAction}
                  disabled={isPending || selected === null}
                  className="px-10 py-5 rounded-xl font-black italic tracking-tighter text-xl transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: selected !== null ? FIGHTERS[selected].color : '#333', color: '#000', boxShadow: selected !== null ? `0 0 40px ${FIGHTERS[selected].color}88` : 'none' }}
                >
                  {isPending ? 'STAKING...' : mode === 'train' ? 'SHADOW FIGHT' : 'ENTER ARENA'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LobbyItem({ fightId, onJoin, selectedFighter }) {
    const { data: fight } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'fights',
        args: [fightId]
    });

    if (!fight) return null;
    const fighter = FIGHTERS[fight[2]]; // fighter1Id

    return (
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                    <img src={`/fighters/f${fight[2]}.png`} alt="Opponent" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h4 className="text-xl font-black italic text-white tracking-widest uppercase">{fighter.name}</h4>
                    <p className="text-[10px] text-purple-400 font-mono font-black italic">{fight[0].slice(0,6)}...{fight[0].slice(-4)}</p>
                </div>
            </div>
            <div className="flex items-center gap-10">
                <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">STAKE REQUIRED</p>
                    <p className="text-xl font-black italic text-yellow-500">{formatEther(fight[4])} MON</p>
                </div>
                <button 
                  onClick={() => onJoin(fightId, fight[4])}
                  className={`px-8 py-3 rounded-xl font-black italic tracking-tighter text-sm transition-all hover:scale-105 active:scale-95 ${selectedFighter === null ? 'bg-slate-800 text-slate-500' : 'bg-green-500 text-black'}`}
                >
                    JOIN BATTLE
                </button>
            </div>
        </div>
    );
}
