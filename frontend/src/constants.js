export const CONTRACT_ADDRESS = "0x03a1692E4Ad8C98d5A0903ee6f29075Ab581543b";

export const ABI = [
  "function enterArena(uint8 fighterId) external payable returns (uint256)",
  "function joinFight(uint256 fightId, uint8 fighterId) external payable",
  "function betOnFighter(uint256 fightId, uint8 side) external payable",
  "function resolveFight(uint256 fightId) external",
  "function getFight(uint256 id) external view returns (tuple(address player1, address player2, uint8 fighter1Id, uint8 fighter2Id, uint256 stake, uint256 crowdPot, address winner, uint8 status, uint256 createdAt))",
  "function getCrowdBets(uint256 id) external view returns (tuple(address bettor, uint256 amount, uint8 side)[])",
  "function getFighter(uint8 id) external view returns (tuple(string name, uint256 wins, uint256 losses))",
  "function getActiveFights() external view returns (uint256[])",
  "function walletWins(address) external view returns (uint256)",
  "function walletEarnings(address) external view returns (uint256)",
  "function fightCount() external view returns (uint256)",
  "function fighters(uint256) external view returns (string name, uint256 wins, uint256 losses)",
  "event FightCreated(uint256 indexed fightId, address indexed player1, uint8 fighter1Id)",
  "event FightJoined(uint256 indexed fightId, address indexed player2, uint8 fighter2Id)",
  "event BetPlaced(uint256 indexed fightId, address indexed bettor, uint8 side, uint256 amount)",
  "event FightResolved(uint256 indexed fightId, address indexed winner, uint256 payout)"
];
