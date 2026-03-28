export const CONTRACT_ADDRESS = "0x03a1692E4Ad8C98d5A0903ee6f29075Ab581543b";

export const ABI = [
  {
    "type": "function",
    "name": "enterArena",
    "inputs": [{ "name": "fighterId", "type": "uint8" }],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "joinFight",
    "inputs": [
      { "name": "fightId", "type": "uint256" },
      { "name": "fighterId", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "betOnFighter",
    "inputs": [
      { "name": "fightId", "type": "uint256" },
      { "name": "side", "type": "uint8" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "resolveFight",
    "inputs": [{ "name": "fightId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getFight",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      {
        "components": [
          { "name": "player1", "type": "address" },
          { "name": "player2", "type": "address" },
          { "name": "fighter1Id", "type": "uint8" },
          { "name": "fighter2Id", "type": "uint8" },
          { "name": "stake", "type": "uint256" },
          { "name": "crowdPot", "type": "uint256" },
          { "name": "winner", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "createdAt", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCrowdBets",
    "inputs": [{ "name": "id", "type": "uint256" }],
    "outputs": [
      {
        "components": [
          { "name": "bettor", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "side", "type": "uint8" }
        ],
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getFighter",
    "inputs": [{ "name": "id", "type": "uint8" }],
    "outputs": [
      {
        "components": [
          { "name": "name", "type": "string" },
          { "name": "wins", "type": "uint256" },
          { "name": "losses", "type": "uint256" }
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "fightCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
     "type": "function",
     "name": "getActiveFights",
     "inputs": [],
     "outputs": [{ "name": "", "type": "uint256[]" }],
     "stateMutability": "view"
  }
];
