import { useState } from 'react';
import { useAccount, useReadContract, useBalance } from 'wagmi';
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
  const { playMove, forfeitFight, authorizeSession, sessionAddress, isPending } = useMonadFighters();
  const { data: fightData } = useFight(fightId);
  const [setupStep, setSetupStep] = useState(0);
  const [lastMoveMsg, setLastMoveMsg] = useState('');

  const { data: remoteSession } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'sessionWallets',
    args: [address],
    query: { refetchInterval: 3000 }
  });
  const isSessionReady = remoteSession?.toLowerCase() === sessionAddress?.toLowerCase();

  // Check burner wallet balance
  const { data: burnerBalance } = useBalance({
    address: sessionAddress,
    query: { refetchInterval: 5000 }
  });
  const burnerHasGas = burnerBalance && burnerBalance.value > BigInt(500000000000000); // > 0.0005 MON

  // Fund burner using raw window.ethereum — always works, no wagmi needed
  const fundBurner = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const amountHex = '0x' + BigInt('10000000000000000').toString(16); // 0.01 MON
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: accounts[0], to: sessionAddress, value: amountHex }],
      });
    } catch (e) {
      alert('Fund failed: ' + (e.message || e));
    }
  };

  useWatchFightMoves(fightId, (log) => {
    const isP1 = log.player?.toLowerCase() === fightData?.player1?.toLowerCase();
    const t = Number(log.moveType);
    if (t === 3) setLastMoveMsg((isP1 ? 'P1' : 'P2') + ' BLOCKS!');
    else setLastMoveMsg((isP1 ? 'P1' : 'P2') + (log.wasHit ? ' HIT ' + Number(log.damage) + ' dmg!' : ' MISSED!'));
  });

  if (!fightData) return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', fontFamily: 'monospace' }}>
      LOADING ARENA...
    </div>
  );

  const f1 = FIGHTERS[fightData.fighter1Id];
  const f2 = FIGHTERS[fightData.fighter2Id];
  const amIP1 = address?.toLowerCase() === fightData.player1?.toLowerCase();
  const amIP2 = address?.toLowerCase() === fightData.player2?.toLowerCase();
  const isPlayer = amIP1 || amIP2;
  const status = Number(fightData.status);
  const myTurn = fightData.nextTurn?.toLowerCase() === address?.toLowerCase();
  const p1hp = Number(fightData.p1HP);
  const p2hp = Number(fightData.p2HP);
  const amIWinner = fightData.winner?.toLowerCase() === address?.toLowerCase();
  const myFighterId = amIP1 ? fightData.fighter1Id : fightData.fighter2Id;
  const myStats = STATS[myFighterId];

  const handleMove = async (t) => {
    try { await playMove(fightId, t); } catch (e) { console.error(e.shortMessage || e.message); }
  };

  const handleForfeit = async () => {
    if (!confirm('Forfeit? You lose your stake.')) return;
    try { await forfeitFight(fightId); } catch (e) { alert(e.shortMessage || e.message); }
  };

  const handleAuthorize = async () => {
    try {
      setSetupStep(1);
      await authorizeSession();
      setSetupStep(2);
    } catch (e) {
      setSetupStep(0);
      alert('Authorize failed: ' + (e.shortMessage || e.message));
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(sessionAddress);
    alert('Copied! In MetaMask: Send -> paste address -> type 0.01 -> Send. Then click AUTHORIZE here.');
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundImage: 'url(/arena.png)', backgroundSize: 'cover', backgroundPosition: 'center top', backgroundColor: '#0a0a14' }}>

      {/* TOPBAR */}
      <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.85)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onBackToSelect} style={{ fontSize: 10, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
            &larr; LOBBY
          </button>
          {isPlayer && status === 1 && (
            <button onClick={handleForfeit} disabled={isPending} style={{ fontSize: 10, padding: '5px 12px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, background: 'transparent', color: '#f87171', cursor: 'pointer' }}>
              FORFEIT
            </button>
          )}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>FIGHT #{String(fightId)} &middot; {formatEther(fightData.stake)} MON stake</div>
          <div style={{ fontSize: 12, fontWeight: 900, fontStyle: 'italic', color: status === 1 ? '#4ade80' : status === 0 ? '#facc15' : '#94a3b8' }}>
            {status === 0 ? 'WAITING FOR OPPONENT' : status === 1 ? 'BATTLE ACTIVE' : 'RESOLVED'}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
          POOL: {formatEther(fightData.stake * 2n)} MON
        </div>
      </div>


      {/* SESSION BAR */}
      {isPlayer && status === 1 && (
        <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.88)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '7px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          {!isSessionReady ? (
            /* Not authorized yet */
            <>
              <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>1:</span>
              <button onClick={fundBurner} style={{ fontSize: 9, padding: '3px 12px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
                SEND 0.01 MON (opens MetaMask)
              </button>
              <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>2:</span>
              <button onClick={handleAuthorize} disabled={setupStep > 0} style={{ fontSize: 10, padding: '4px 16px', background: '#facc15', color: '#000', fontWeight: 900, border: 'none', borderRadius: 20, cursor: setupStep > 0 ? 'not-allowed' : 'pointer', opacity: setupStep > 0 ? 0.6 : 1 }}>
                {setupStep === 0 ? 'AUTHORIZE' : 'Confirming in MetaMask...'}
              </button>
            </>
          ) : !burnerHasGas ? (
            /* Authorized but no gas — need to fund */
            <>
              <span style={{ fontSize: 9, color: '#f59e0b', fontFamily: 'monospace', fontWeight: 700 }}>Battle wallet needs gas!</span>
              <button onClick={fundBurner} style={{ fontSize: 10, padding: '4px 18px', background: '#f59e0b', color: '#000', fontWeight: 900, border: 'none', borderRadius: 20, cursor: 'pointer' }}>
                SEND 0.01 MON (1 click)
              </button>
            </>
          ) : (
            /* Fully ready */
            <span style={{ fontSize: 10, fontWeight: 900, color: '#4ade80', fontFamily: 'monospace' }}>
              ONE-CLICK ACTIVE &bull; {Number(burnerBalance.formatted).toFixed(4)} MON gas remaining
            </span>
          )}
        </div>
      )}

      {/* HP BARS */}
      <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.65)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
            <span style={{ fontWeight: 900, fontStyle: 'italic', color: f1 ? f1.color : '#fff' }}>{f1 ? f1.name : ''}  {fightData.p1Blocking ? '[BLOCK]' : ''}</span>
            <span style={{ color: '#fff', fontFamily: 'monospace' }}>{p1hp} HP</span>
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: p1hp + '%', borderRadius: 4, transition: 'width 0.4s', background: p1hp > 50 ? '#22c55e' : p1hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>VS</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
            <span style={{ color: '#fff', fontFamily: 'monospace' }}>{status === 0 ? '--' : p2hp} HP</span>
            <span style={{ fontWeight: 900, fontStyle: 'italic', color: f2 ? f2.color : '#fff' }}>{fightData.p2Blocking ? '[BLOCK]  ' : ''}{status === 0 ? '???' : (f2 ? f2.name : '')}</span>
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ height: '100%', width: (status === 0 ? 0 : p2hp) + '%', borderRadius: 4, transition: 'width 0.4s', background: p2hp > 50 ? '#22c55e' : p2hp > 25 ? '#eab308' : '#ef4444' }} />
          </div>
        </div>
      </div>

      {/* STAGE */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', minHeight: 0 }}>

        {/* P1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '4px solid ' + (status === 1 && myTurn && amIP1 ? '#a855f7' : 'rgba(255,255,255,0.2)'), boxShadow: status === 1 && myTurn && amIP1 ? '0 0 24px rgba(168,85,247,0.7)' : 'none', transition: 'all 0.2s' }}>
            <img src={'/fighters/f' + fightData.fighter1Id + '.png'} alt={f1 ? f1.name : ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>{fightData.player1 ? fightData.player1.slice(0,6) + '...' + fightData.player1.slice(-4) : ''}</span>
        </div>

        {/* CENTER */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', marginLeft: 20, marginRight: 20 }}>

          {status === 1 && isPlayer && (
            <div style={{ width: '100%', maxWidth: 260, background: 'rgba(0,0,0,0.88)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}>
              <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, marginBottom: 12, textAlign: 'center', color: myTurn ? '#4ade80' : '#334155', margin: '0 0 12px' }}>
                {myTurn ? 'YOUR TURN - PICK A MOVE' : "OPPONENT'S TURN..."}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { t: 1, icon: 'LIGHT', emoji: 'S', col: '#3b82f6', stat: myStats ? myStats.light : '', acc: myStats ? myStats.lightAcc : '' },
                  { t: 2, icon: 'HEAVY', emoji: 'H', col: '#ef4444', stat: myStats ? myStats.heavy : '', acc: myStats ? myStats.heavyAcc : '' },
                  { t: 3, icon: 'BLOCK', emoji: 'B', col: '#eab308', stat: myStats ? myStats.block : '', acc: 'reduce' },
                ].map(function(m) { return (
                  <button
                    key={m.t}
                    onClick={() => handleMove(m.t)}
                    disabled={!myTurn || isPending}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px', borderRadius: 12, border: '1px solid ' + m.col + '44', background: m.col + '18', color: m.col, cursor: (myTurn && !isPending) ? 'pointer' : 'not-allowed', opacity: (myTurn && !isPending) ? 1 : 0.2, transition: 'all 0.15s', fontSize: 9, fontWeight: 900 }}
                  >
                    <span style={{ fontSize: 20, marginBottom: 4 }}>
                      {m.t === 1 ? '\u2694\uFE0F' : m.t === 2 ? '\u{1FA93}' : '\u{1F6E1}\uFE0F'}
                    </span>
                    {m.icon}
                    <span style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{m.stat}</span>
                    <span style={{ fontSize: 7, color: '#374151' }}>{m.acc}</span>
                  </button>
                ); })}
              </div>
              {lastMoveMsg && <p style={{ marginTop: 10, fontSize: 9, textAlign: 'center', color: '#c084fc', fontFamily: 'monospace' }}>{lastMoveMsg}</p>}
            </div>
          )}

          {status === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, border: '2px solid #a855f7', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', textAlign: 'center' }}>
                Waiting for opponent...<br />
                <span style={{ color: '#a855f7', fontWeight: 900 }}>Fight ID: #{String(fightId)}</span>
              </p>
            </div>
          )}

          {status === 1 && !isPlayer && (
            <div style={{ background: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>SPECTATING</p>
              {lastMoveMsg && <p style={{ marginTop: 6, fontSize: 9, color: '#c084fc', fontFamily: 'monospace' }}>{lastMoveMsg}</p>}
            </div>
          )}

          {status === 2 && (
            <div style={{ width: '100%', maxWidth: 260, background: 'rgba(0,0,0,0.92)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 28, textAlign: 'center' }}>
              <h3 style={{ fontSize: 36, fontWeight: 900, fontStyle: 'italic', color: amIWinner ? '#facc15' : '#ef4444', margin: '0 0 6px' }}>
                {amIWinner ? 'VICTORY!' : 'DEFEAT'}
              </h3>
              <p style={{ fontSize: 10, color: '#64748b', marginBottom: 16 }}>
                {amIWinner ? '+' + formatEther(fightData.stake * 2n) + ' MON earned' : 'Better luck next round'}
              </p>
              <button onClick={onBackToSelect} style={{ width: '100%', padding: 12, background: '#7c3aed', color: '#fff', fontWeight: 900, fontSize: 13, borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                BACK TO LOBBY
              </button>
            </div>
          )}
        </div>

        {/* P2 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '4px solid ' + (status === 1 && myTurn && amIP2 ? '#a855f7' : 'rgba(255,255,255,0.2)'), boxShadow: status === 1 && myTurn && amIP2 ? '0 0 24px rgba(168,85,247,0.7)' : 'none', transition: 'all 0.2s' }}>
            {status > 0
              ? <img src={'/fighters/f' + fightData.fighter2Id + '.png'} alt={f2 ? f2.name : ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, color: '#1e293b' }}>?</div>
            }
          </div>
          {status > 0 && <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>{fightData.player2 ? fightData.player2.slice(0,6) + '...' + fightData.player2.slice(-4) : ''}</span>}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
