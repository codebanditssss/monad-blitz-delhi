# Fight Club

An on-chain, turn-based PvP brawler built on the Monad Testnet. Two players stake MON, pick fighters, and trade blows in real time — every move is a signed blockchain transaction, every result is settled on-chain, and every payout is instant.

---

## Overview

Fight Club was built to demonstrate what becomes possible when a blockchain runs fast enough to support interactive gaming. On Monad, block times are approximately one second, which makes turn-based combat feel fluid rather than painful. The game requires no centralised server — all fight state, HP tracking, move resolution, and prize distribution live entirely in a single smart contract.

---

## How It Works

### Combat

Each fight is a 1v1 duel. Both players stake an equal amount of MON to enter. The fighter with the last HP standing wins the full pot.

On each turn a player selects one of three moves:

| Move  | Effect |
|-------|--------|
| Light | Fast attack. High accuracy, moderate damage. |
| Heavy | Slow attack. Lower accuracy, high damage if it connects. |
| Block | Reduces incoming damage on the next hit by a percentage that depends on the fighter. |

Damage is resolved on-chain using `block.prevrandao` as a seed, so no move outcome is predictable or manipulable ahead of time.

### Fighters

There are six playable fighters, each with distinct base stats. Choosing your fighter is a strategic decision, not a cosmetic one.

| Fighter       | Play Style                                     |
|---------------|------------------------------------------------|
| Chain Breaker | Balanced — solid across all three moves        |
| Gas Ghost     | Speedy — very high accuracy, trades low damage |
| Block Beast   | Tank — massive block reduction, hits hard      |
| Node Ninja    | Glass Cannon — high damage both ways, low defence |
| Fork Fury     | Chaos — wildly variable damage swings          |
| Hash Hunter   | Consistent — tight damage ranges, high light accuracy |

### Session Wallets (One-Click Combat)

By default every move would require a MetaMask approval. Fight Club solves this with a session wallet pattern: a temporary keypair is generated in the browser and stored in `localStorage`. The player funds it with a small amount of MON for gas, then authorises it once via the contract. From that point forward all moves are signed locally with no popups, for the lifetime of the session.

### Training Mode

If no opponent is available, Shadow Training mode starts a fight against an on-chain bot. The bot picks a random move automatically after each player action. Useful for testing the session wallet flow end to end with a single wallet.

### Crowd Betting

Spectators can place bets on either fighter while a fight is in progress. Winnings are distributed proportionally from the crowd pot after the fight resolves.

---

## Tech Stack

| Layer      | Technology                           |
|------------|--------------------------------------|
| Blockchain | Monad Testnet                        |
| Contract   | Solidity 0.8.20, Hardhat             |
| Frontend   | React, Vite                          |
| Web3       | Wagmi v2, Viem, RainbowKit           |
| Styling    | Tailwind CSS                         |

---

## Contract

- **Network:** Monad Testnet  
- **Address:** `0xA9e2f1211Bc52D60C4FD5cAb63197d6F858F78B6`  
- **Minimum Stake:** 0.01 MON  

Key contract functions:

```
enterArena(fighterId)       -- create a new PvP fight with a stake
joinFight(fightId, fighterId) -- join an existing open fight
startTraining(fighterId)    -- fight the on-chain bot
playMove(fightId, moveType) -- submit a move (1=Light, 2=Heavy, 3=Block)
forfeitFight(fightId)       -- concede the fight, opponent wins
authorizeSession(burner)    -- register a session wallet for gas-free moves
betOnFighter(fightId, side) -- place a crowd bet during an active fight
```

---

## Local Development

### Prerequisites

- Node.js 18+
- A Monad Testnet wallet with some MON for gas

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/monad_fighters
cd monad_fighters

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### Run the Frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

### Deploy the Contract

```bash
# From the project root
npx hardhat run scripts/deploy.js --network monadTestnet
```

After deploying, paste the new address into `frontend/src/constants.js`.

### Environment

Create a `.env` file in the project root:

```
PRIVATE_KEY=your_deployer_private_key_here
```

The Monad Testnet RPC and chain ID are already configured in `hardhat.config.js` and `frontend/src/wagmi.config.js`.

---

## Playing the Game

1. Connect your wallet on Monad Testnet.
2. Select a fighter and set your stake.
3. Choose a mode:
   - **PvP Arena** — creates an open fight. Share your fight ID with an opponent.
   - **Battle Lobby** — join an existing open fight.
   - **Shadow Train** — solo practice against the bot.
4. Once in a fight, enable one-click combat to eliminate per-move MetaMask approvals:
   - The session bar shows your browser wallet address. Send 0.01 MON to it from MetaMask.
   - Click Authorize — one approval, done.
5. Use Light, Heavy, and Block to reduce the opponent to zero HP.
6. The winner receives both stakes instantly. No withdrawal step needed.

---

## Project Structure

```
monad_fighters/
  contracts/
    MonadFighters.sol       -- core game contract
  scripts/
    deploy.js               -- deployment script
  frontend/
    src/
      components/
        Arena.jsx           -- in-fight UI
        CharacterSelect.jsx -- lobby, fighter select, matchmaking
      hooks/
        useMonadFighters.js -- wagmi hooks and session wallet logic
      constants.js          -- contract address and ABI
      wagmi.config.js       -- chain and wallet configuration
      App.jsx               -- routing and leaderboard
```

---

## License

MIT
