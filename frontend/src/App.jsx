import { useState, useEffect } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import CharacterSelect from './components/CharacterSelect';
import Arena from './components/Arena';
import { useFightCount, useActiveFights } from './hooks/useMonadFighters';

export default function App() {
  const [screen, setScreen] = useState('select'); // select | arena | leaderboard
  const [currentFightId, setCurrentFightId] = useState(null);
  const [activeBattleId, setActiveBattleId] = useState(null);
  
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const { data: rawFightCount } = useFightCount();
  const fightCount = rawFightCount ? Number(rawFightCount) : 0;

  const handleEnterArena = (fighterId, stake) => {
    const newId = fightCount;
    setCurrentFightId(newId);
    setActiveBattleId(newId);
    setScreen('arena');
  };

  const handleJoinFight = (fightId) => {
    setCurrentFightId(Number(fightId));
    setActiveBattleId(Number(fightId));
    setScreen('arena');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      
      {/* GLOBAL NAVIGATION --- T-55 */}
      <nav className="fixed top-8 right-8 z-[300] flex items-center gap-4 bg-black/80 backdrop-blur-3xl p-3 rounded-2xl border border-white/10 shadow-2xl">
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

      {/* SCREEN ROUTER --- T-54 to T-57 */}
      <main>
        {screen === 'select' && (
          <CharacterSelect 
            onEnterArena={handleEnterArena} 
            onJoinFight={handleJoinFight} 
            activeFightId={activeBattleId}
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

      {/* FOOTER BAR */}
      <div className="fixed bottom-6 right-8 text-[10px] font-mono text-slate-700 tracking-[0.3em] uppercase pointer-events-none z-50">
        Monad_Fighters // Built for Monad Blitz Hackathon
      </div>

    </div>
  );
}

function Leaderboard({ fightCount }) {
  // Mocking leaderboard data for demo - pulls recently resolved addresses in production
  const topWallets = [
    { address: '0x5aA40...94be7', wins: 24, earnings: '1.25', rank: 1, color: '#FFD700' },
    { address: '0x1cEd3...2A4b1', wins: 18, earnings: '0.82', rank: 2, color: '#C0C0C0' },
    { address: '0x8f2A9...dD3e4', wins: 15, earnings: '0.54', rank: 3, color: '#CD7F32' },
  ];

  return (
    <div className="min-h-screen pt-32 px-6 flex flex-col items-center"
         style={{ background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0a0a0f 60%)' }}>
      
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black italic tracking-tighter text-purple-400 mb-2 animate-glow">LEADERBOARD</h2>
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Global Wallet Status // Total Battles: {fightCount}</p>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {topWallets.map(w => (
          <div key={w.rank} className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4" style={{ borderColor: w.color }}>
            <div className="flex items-center gap-6">
              <span className="text-2xl font-black italic text-slate-800" style={{ WebkitTextStroke: `1px ${w.color}` }}>#0{w.rank}</span>
              <div>
                <p className="text-lg font-black italic text-white tracking-tight">{w.address}</p>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Wallet Identity</p>
              </div>
            </div>
            <div className="flex gap-10 text-right">
              <div>
                <p className="text-xl font-black italic text-purple-400">{w.wins}</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Wins</p>
              </div>
              <div>
                <p className="text-xl font-black italic text-yellow-500">+{w.earnings} MON</p>
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Earnings</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 p-8 glass-panel rounded-3xl border border-white/5 border-dashed max-w-xl text-center">
         <p className="text-xs text-slate-500 font-mono leading-relaxed uppercase tracking-tighter">
            Leaderboard rankings update instantly upon block confirmation. High-speed settlement on Monad ensures real-time competitive integrity for all active players.
         </p>
      </div>

    </div>
  );
}
