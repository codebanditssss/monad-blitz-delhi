import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useMonadFighters } from '../hooks/useMonadFighters';

export const FIGHTERS = [
  { id: 0, name: 'CHAIN BREAKER', color: '#3B82F6', desc: 'Unstoppable force wrapped in glowing energy.' },
  { id: 1, name: 'GAS GHOST',     color: '#8B5CF6', desc: 'Spectral phantom made of neon purple smoke.' },
  { id: 2, name: 'BLOCK BEAST',   color: '#F97316', desc: 'Armored stone golem with glowing circuit lines.' },
  { id: 3, name: 'NODE NINJA',    color: '#22C55E', desc: 'Silent killer with green data stream flows.' },
  { id: 4, name: 'FORK FURY',     color: '#EAB308', desc: 'Electric yellow-fisted fighter of pure chaos.' },
  { id: 5, name: 'HASH HUNTER',   color: '#06B6D4', desc: 'Bounty hunter with high-precision teal visor.' },
];

export default function CharacterSelect({ onEnterArena, onJoinFight, activeFightId }) {
  const { isConnected } = useAccount();
  const { enterArena, joinFight, isPending } = useMonadFighters();
  
  const [selected, setSelected] = useState(null);
  const [stake, setStake] = useState('0.05');
  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [joinId, setJoinId] = useState('');

  const handleAction = async () => {
    if (selected === null) return alert('Pick a fighter first!');
    
    try {
      if (mode === 'create') {
        const tx = await enterArena(selected, stake);
        onEnterArena(selected, stake);
      } else {
        if (!joinId) return alert('Enter a Fight ID to join!');
        // Note: Joining requires the EXACT stake already in the fight
        // For the hackathon, we fetch the stake or use the user's input
        await joinFight(joinId, selected, stake);
        onJoinFight(joinId, selected);
      }
    } catch (e) {
      console.error(e);
      alert('Transaction failed: Check your balance or if the Fight ID exists!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-20 px-6 bg-slate-950"
         style={{ background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0a0f 70%)' }}>
      
      {/* GLOWING LOGO --- T-38 */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-black tracking-tighter mb-2 animate-glow italic"
            style={{ color: '#a855f7' }}>
          MONAD FIGHTERS
        </h1>
        <p className="text-purple-400 font-mono tracking-widest text-sm uppercase">
          On-chain PvP Arena // High Speed Battle
        </p>
      </div>

      {!isConnected ? (
        <div className="flex flex-col items-center gap-4 bg-white/5 p-12 rounded-2xl border border-white/10 backdrop-blur-xl">
           <p className="text-slate-400 text-center text-sm font-mono max-w-xs">
              INITIALIZE YOUR WALLET PROTOCOL TO ENTER THE BATTLE ARENA.
           </p>
        </div>
      ) : (
        <div className="w-full max-w-5xl flex flex-col items-center">
          
          {/* CREATE/JOIN TOGGLE --- T-33 */}
          <div className="flex gap-4 p-1 bg-white/5 rounded-lg border border-white/10 mb-10 w-full max-w-md">
            <button 
              onClick={() => setMode('create')}
              className={`flex-1 py-3 rounded-md text-xs font-bold tracking-widest transition-all ${
                mode === 'create' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              CREATE ARENA
            </button>
            <button 
              onClick={() => setMode('join')}
              className={`flex-1 py-3 rounded-md text-xs font-bold tracking-widest transition-all ${
                mode === 'join' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              JOIN BATTLE
            </button>
          </div>

          {/* FIGHTER GRID --- T-34 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 w-full">
            {FIGHTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f.id)}
                className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 transform text-left hover:scale-[1.03] active:scale-100 ${
                  selected === f.id ? 'bg-white/10' : 'bg-white/5 border-white/5 hover:border-white/20'
                }`}
                style={{ 
                  borderColor: selected === f.id ? f.color : undefined,
                  boxShadow: selected === f.id ? `0 0 30px ${f.color}33` : 'none'
                }}
              >
                {/* Fighter Preview --- Portals Fix */}
                <div 
                  className={`aspect-square w-full mb-6 rounded-full overflow-hidden border-4 transition-all duration-500 flex items-center justify-center bg-slate-900 ${
                    selected === f.id ? 'scale-110 rotate-3' : 'group-hover:scale-105'
                  }`}
                  style={{ 
                    borderColor: f.color + '44',
                    boxShadow: `inset 0 0 40px ${f.color}66, 0 0 20px ${f.color}33`
                  }}
                >
                  <img 
                    src={`/fighters/f${f.id}.png`} 
                    alt={f.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  />
                  <div className="hidden text-5xl">⚔️</div>
                </div>

                {/* Info */}
                <h3 className="font-black text-xl italic tracking-tighter mb-1" style={{ color: f.color }}>{f.name}</h3>
                <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-2 uppercase">{f.desc}</p>
                
                {selected === f.id && (
                  <div className="absolute top-4 right-4 h-3 w-3 rounded-full animate-ping" style={{ background: f.color }}></div>
                )}
              </button>
            ))}
          </div>

          {/* INPUT BAR --- T-35 & T-36 */}
          <div className="sticky bottom-10 w-full max-w-2xl bg-black/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center gap-2">
            
            <div className="flex-1 flex flex-col justify-center px-4">
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1">Stake (MON)</span>
               <input 
                 type="number" 
                 value={stake}
                 onChange={(e) => setStake(e.target.value)}
                 step="0.01"
                 className="bg-transparent text-xl font-black text-white outline-none w-full"
               />
            </div>

            {mode === 'join' && (
              <div className="flex-1 border-l border-white/10 flex flex-col justify-center px-4">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-1 mb-1">Fight ID</span>
                 <input 
                   type="number" 
                   placeholder="Enter ID"
                   value={joinId}
                   onChange={(e) => setJoinId(e.target.value)}
                   className="bg-transparent text-xl font-black text-white outline-none w-full"
                 />
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={isPending || selected === null}
              className="px-10 py-5 rounded-xl font-black italic tracking-tighter text-xl transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: selected !== null ? FIGHTERS[selected].color : '#333',
                color: '#000',
                boxShadow: selected !== null ? `0 0 40px ${FIGHTERS[selected].color}88` : 'none'
              }}
            >
              {isPending ? 'STAKING...' : mode === 'create' ? 'ENTER ARENA' : 'BATTLE NOW'}
            </button>
          </div>

        </div>
      )}

      {/* FOOTER STATS */}
      <div className="mt-20 flex gap-12 border-t border-white/5 pt-12 opacity-50 max-md:flex-col max-md:gap-6 text-center">
        <div><p className="text-2xl font-black italic text-white leading-none">0.8 SEC</p><p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">Settlement Speed</p></div>
        <div><p className="text-2xl font-black italic text-white leading-none">10143</p><p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">Network Protocol</p></div>
        <div><p className="text-2xl font-black italic text-white leading-none">ZERO</p><p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mt-1">Latency Lag</p></div>
      </div>

    </div>
  );
}
