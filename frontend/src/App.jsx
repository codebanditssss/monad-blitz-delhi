import { useState, useEffect } from 'react';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import CharacterSelect from './components/CharacterSelect';
import Arena from './components/Arena';
import { useFightCount, useActiveFights } from './hooks/useMonadFighters';
import { CONTRACT_ADDRESS, ABI } from './constants';

export default function App() {
  const [screen, setScreen] = useState('select'); 
  const [currentFightId, setCurrentFightId] = useState(null);
  const [activeBattleId, setActiveBattleId] = useState(null);
  
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const { data: rawFightCount } = useFightCount();
  const fightCount = rawFightCount ? Number(rawFightCount) : 0;

  const handleEnterArena = (fightId) => {
    setCurrentFightId(Number(fightId));
    setActiveBattleId(Number(fightId));
    setScreen('arena');
  };

  const handleJoinFight = (fightId) => {
    setCurrentFightId(Number(fightId));
    setActiveBattleId(Number(fightId));
    setScreen('arena');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      
      <nav className={`fixed top-8 right-8 z-[300] flex items-center gap-4 bg-black/80 backdrop-blur-3xl p-3 rounded-2xl border border-white/10 shadow-2xl ${screen === 'arena' ? 'hidden' : ''}`}>
        <div className="flex items-center gap-2 pr-3 border-r border-white/10 mr-1">
            <button 
              onClick={() => setScreen('select')}
              className={`px-4 py-2 text-[10px] font-black tracking-widest border transition-all rounded-md ${
                screen === 'select' ? 'border-purple-600 bg-purple-600/10 text-purple-400' : 'border-white/10 bg-black/50 text-slate-500 hover:text-white'
              }`}
            >
              ARENA
            </button>
            <button 
              onClick={() => setScreen('leaderboard')}
              className={`px-4 py-2 text-[10px] font-black tracking-widest border transition-all rounded-md ${
                screen === 'leaderboard' ? 'border-purple-600 bg-purple-600/10 text-purple-400' : 'border-white/10 bg-black/50 text-slate-500 hover:text-white'
              }`}
            >
              RANKINGS
            </button>
        </div>
        
        {isConnected ? (
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] text-white/50 font-mono uppercase tracking-widest leading-none">Connected</p>
                <p className="text-[11px] font-black italic text-purple-400 mt-1">{address.slice(0,6)}...{address.slice(-4)}</p>
             </div>
             <button 
                onClick={() => disconnect()}
                className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black rounded hover:bg-red-500/20 transition-all uppercase"
             >
                Logout
             </button>
          </div>
        ) : (
          <ConnectButton />
        )}

        {activeBattleId !== null && (
          <button 
            onClick={() => setScreen('arena')}
            className={`px-4 py-2 text-[10px] font-black tracking-widest border border-yellow-600 bg-yellow-600/10 text-yellow-500 rounded-md animate-pulse ml-2`}
          >
            LIVE #{activeBattleId}
          </button>
        )}
      </nav>

      <main>
        {screen === 'select' && (
          <CharacterSelect 
            onEnterArena={handleEnterArena} 
            onJoinFight={handleJoinFight} 
          />
        )}

        {screen === 'arena' && currentFightId !== null && (
          <Arena 
            fightId={currentFightId} 
            onBackToSelect={() => setScreen('select')} 
          />
        )}

        {screen === 'leaderboard' && (
          <Leaderboard fightCount={fightCount} />
        )}
      </main>

      <div className="fixed bottom-6 right-8 text-[10px] font-mono text-slate-700 tracking-[0.3em] uppercase pointer-events-none z-50">
        Monad_Fighters // Speed Combat Protocol
      </div>

    </div>
  );
}

function Leaderboard({ fightCount }) {
  // We'll scan the last 10 fights to find real recent winners
  const start = fightCount > 10 ? fightCount - 10 : 0;
  const ids = Array.from({ length: Math.min(fightCount, 10) }, (_, i) => start + i).reverse();

  return (
    <div className="min-h-screen pt-32 px-6 flex flex-col items-center"
         style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #050508 60%)' }}>
      
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black italic tracking-tighter text-purple-500 mb-2 animate-glow">ARENA CHAMPIONS</h2>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Live Conquest Log // Total Battles Recorded: {fightCount}</p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {ids.map((id, index) => (
          <RecentWinnerItem key={id} fightId={id} rank={index + 1} />
        ))}
      </div>

      <div className="mt-20 p-8 glass-panel rounded-3xl border border-white/5 border-dashed max-w-xl text-center">
         <p className="text-xs text-slate-600 font-mono leading-relaxed uppercase tracking-tighter">
            Rankings are indexed directly from the Monad Testnet blocks. High speed settlement ensures zero-latency competitive integrity for all warriors.
         </p>
      </div>

    </div>
  );
}

function RecentWinnerItem({ fightId, rank }) {
    const { data: fight } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'fights',
        args: [fightId]
    });

    if (!fight || Number(fight[7]) !== 2) return null; // Status enum 2 = Resolved

    const winner = fight[6];
    const payout = formatEther(fight[4] * 2n);

    return (
        <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-yellow-500/30 animate-in slide-in-from-left duration-300">
            <div className="flex items-center gap-6">
              <span className="text-2xl font-black italic text-slate-800" style={{ WebkitTextStroke: `1px ${rank === 1 ? '#eab308' : '#666'}` }}>
                {rank < 10 ? `0${rank}` : rank}
              </span>
              <div>
                <p className="text-lg font-black italic text-white tracking-tight">{winner.slice(0,10)}...{winner.slice(-8)}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Battle #{fightId.toString()} // Final Victory</p>
              </div>
            </div>
            <div className="text-right">
                <p className="text-xl font-black italic text-yellow-500">+{payout} MON</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Earnings</p>
            </div>
        </div>
    );
}
