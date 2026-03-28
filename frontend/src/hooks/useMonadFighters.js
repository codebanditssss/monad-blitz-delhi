import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { parseEther, createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { CONTRACT_ADDRESS, ABI } from '../constants';
import { monadTestnet } from '../wagmi.config';

// Simple Session Key management locally
const getSessionAccount = () => {
  let key = localStorage.getItem('monad_brawler_session');
  if (!key) {
    key = generatePrivateKey();
    localStorage.setItem('monad_brawler_session', key);
  }
  return privateKeyToAccount(key);
};

export function useMonadFighters() {
  const { writeContractAsync, isPending } = useWriteContract();
  const sessionAccount = getSessionAccount();

  const authorizeSession = () => 
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'authorizeSession',
      args: [sessionAccount.address],
    });

  const enterArena = (fighterId, stakeEth) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'enterArena',
      args: [fighterId],
      value: parseEther(stakeEth),
    });

  const startTraining = (fighterId, stakeEth) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'startTraining',
      args: [fighterId],
      value: parseEther(stakeEth),
    });

  const joinFight = (fightId, fighterId, stakeEth) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'joinFight',
      args: [BigInt(fightId), fighterId],
      value: parseEther(stakeEth),
    });

  // THE MAGIC: Play move using the session wallet (no popup)
  const playMove = async (fightId, moveType) => {
    // We use a separate local wallet client for the burner to avoid triggering the connected wallet (MetaMask)
    const client = createWalletClient({
      account: sessionAccount,
      chain: monadTestnet,
      transport: http()
    }).extend(publicActions);

    try {
        const { request } = await client.simulateContract({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'playMove',
            args: [BigInt(fightId), moveType],
            account: sessionAccount,
        });
        return await client.writeContract(request);
    } catch (e) {
        console.warn("Session move failed, falling back to main wallet:", e);
        // Fallback to main wallet if session is not funded or authorized
        return writeContractAsync({
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'playMove',
            args: [BigInt(fightId), moveType],
        });
    }
  };

  const betOnFighter = (fightId, side, betEth) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'betOnFighter',
      args: [BigInt(fightId), side],
      value: parseEther(betEth),
    });

  return { enterArena, startTraining, joinFight, playMove, betOnFighter, authorizeSession, sessionAddress: sessionAccount.address, isPending };
}

export function useFight(fightId) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getFight',
    args: [BigInt(fightId ?? 0)],
    query: { enabled: fightId !== null && fightId !== undefined, refetchInterval: 1000 }
  });
}

export function useWatchFightMoves(fightId, onMove) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    eventName: 'MoveExecuted',
    onLogs(logs) {
      logs.forEach(log => {
        if (log.args.fightId?.toString() === fightId?.toString()) {
          onMove(log.args);
        }
      });
    },
  });
}

export function useFighter(id) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getFighter',
    args: [id],
    query: { refetchInterval: 5000 }
  });
}

export function useFightCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'fightCount',
    query: { refetchInterval: 4000 }
  });
}

export function useActiveFights() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getActiveFights',
    query: { refetchInterval: 5000 }
  });
}
