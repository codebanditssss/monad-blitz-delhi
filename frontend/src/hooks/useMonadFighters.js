import { useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, ABI } from '../constants';

export function useMonadFighters() {
  const { writeContractAsync, isPending } = useWriteContract();

  const enterArena = (fighterId, stakeEth) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'enterArena',
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

  const betOnFighter = (fightId, side, betEth) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'betOnFighter',
      args: [BigInt(fightId), side],
      value: parseEther(betEth),
    });

  const resolveFight = (fightId) =>
    writeContractAsync({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'resolveFight',
      args: [BigInt(fightId)],
    });

  return { enterArena, joinFight, betOnFighter, resolveFight, isPending };
}

export function useFight(fightId) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'getFight',
    args: [BigInt(fightId ?? 0)],
    query: { 
      enabled: fightId !== null && fightId !== undefined, 
      refetchInterval: 2000 
    }
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
