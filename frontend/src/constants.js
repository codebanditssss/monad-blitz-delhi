export const CONTRACT_ADDRESS = "0x775E88485F15950A6EEDDaC8B7A4ba5E5667d614";

export const ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "fightId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "bettor", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "side", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "BetPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "fightId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "player1", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "fighterId", "type": "uint8" }
    ],
    "name": "FightCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "fightId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "player2", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "fighterId", "type": "uint8" }
    ],
    "name": "FightJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "fightId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "winner", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256" }
    ],
    "name": "FightResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "fightId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "moveType", "type": "uint8" },
      { "indexed": false, "internalType": "uint16", "name": "damage", "type": "uint16" },
      { "indexed": false, "internalType": "bool", "name": "wasHit", "type": "bool" },
      { "indexed": false, "internalType": "uint16", "name": "p1HP", "type": "uint16" },
      { "indexed": false, "internalType": "uint16", "name": "p2HP", "type": "uint16" }
    ],
    "name": "MoveExecuted",
    "type": "event"
  },
  { "inputs": [], "name": "MAX_HP", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "MIN_STAKE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "fightId", "type": "uint256" }, { "internalType": "uint8", "name": "side", "type": "uint8" }], "name": "betOnFighter", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "uint8", "name": "fighterId", "type": "uint8" }], "name": "enterArena", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "payable", "type": "function" },
  { "inputs": [], "name": "fightCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "fightCountIndex", "type": "uint256" }], "name": "fighters", "outputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "wins", "type": "uint256" }, { "internalType": "uint256", "name": "losses", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "fights", "outputs": [{ "internalType": "address", "name": "player1", "type": "address" }, { "internalType": "address", "name": "player2", "type": "address" }, { "internalType": "uint8", "name": "fighter1Id", "type": "uint8" }, { "internalType": "uint8", "name": "fighter2Id", "type": "uint8" }, { "internalType": "uint256", "name": "stake", "type": "uint256" }, { "internalType": "uint256", "name": "crowdPot", "type": "uint256" }, { "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "uint8", "name": "status", "type": "uint8" }, { "internalType": "uint16", "name": "p1HP", "type": "uint16" }, { "internalType": "uint16", "name": "p2HP", "type": "uint16" }, { "internalType": "address", "name": "nextTurn", "type": "address" }, { "internalType": "bool", "name": "p1Blocking", "type": "bool" }, { "internalType": "bool", "name": "p2Blocking", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getActiveFights", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "fightId", "type": "uint256" }], "name": "getFight", "outputs": [{ "components": [{ "internalType": "address", "name": "player1", "type": "address" }, { "internalType": "address", "name": "player2", "type": "address" }, { "internalType": "uint8", "name": "fighter1Id", "type": "uint8" }, { "internalType": "uint8", "name": "fighter2Id", "type": "uint8" }, { "internalType": "uint256", "name": "stake", "type": "uint256" }, { "internalType": "uint256", "name": "crowdPot", "type": "uint256" }, { "internalType": "address", "name": "winner", "type": "address" }, { "internalType": "uint8", "name": "status", "type": "uint8" }, { "internalType": "uint16", "name": "p1HP", "type": "uint16" }, { "internalType": "uint16", "name": "p2HP", "type": "uint16" }, { "internalType": "address", "name": "nextTurn", "type": "address" }, { "internalType": "bool", "name": "p1Blocking", "type": "bool" }, { "internalType": "bool", "name": "p2Blocking", "type": "bool" }], "internalType": "struct MonadFighters.Fight", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint8", "name": "id", "type": "uint8" }], "name": "getFighter", "outputs": [{ "components": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "uint256", "name": "wins", "type": "uint256" }, { "internalType": "uint256", "name": "losses", "type": "uint256" }], "internalType": "struct MonadFighters.Fighter", "name": "", "type": "tuple" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "fightId", "type": "uint256" }, { "internalType": "uint8", "name": "fighterId", "type": "uint8" }], "name": "joinFight", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "burner", "type": "address" }], "name": "authorizeSession", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "sessionWallets", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "fightId", "type": "uint256" }, { "internalType": "uint8", "name": "moveType", "type": "uint8" }], "name": "playMove", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint8", "name": "fighterId", "type": "uint8" }], "name": "startTraining", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "payable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "walletEarnings", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "walletWins", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];
