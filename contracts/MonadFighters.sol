// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MonadFighters
 * @dev A high-performance PvP battle arena for the Monad Blitz Hackathon.
 * Features: Staked fights, proportional crowd betting, and on-chain randomness.
 */
contract MonadFighters {

    // --- Types ---

    enum FightStatus { Waiting, BettingOpen, Fighting, Resolved }

    struct Fighter {
        string name;
        uint256 wins;
        uint256 losses;
    }

    struct Fight {
        address player1;
        address player2;
        uint8 fighter1Id;
        uint8 fighter2Id;
        uint256 stake;
        uint256 crowdPot;
        address winner;
        FightStatus status;
        uint256 createdAt;
    }

    struct CrowdBet {
        address bettor;
        uint256 amount;
        uint8 side; // 1 = player1, 2 = player2
    }

    // --- State ---

    mapping(uint256 => Fight) public fights;
    mapping(uint256 => CrowdBet[]) public crowdBets;
    mapping(address => uint256) public walletWins;
    mapping(address => uint256) public walletEarnings;

    uint256 public fightCount;
    uint256 public constant MIN_STAKE = 0.01 ether;
    uint256 public constant MIN_BET   = 0.001 ether;

    Fighter[6] public fighters;

    // --- Events ---

    event FightCreated(uint256 indexed fightId, address indexed player1, uint8 fighter1Id);
    event FightJoined(uint256 indexed fightId, address indexed player2, uint8 fighter2Id);
    event BetPlaced(uint256 indexed fightId, address indexed bettor, uint8 side, uint256 amount);
    event FightResolved(uint256 indexed fightId, address indexed winner, uint256 payout);

    // --- Constructor ---

    constructor() {
        fighters[0] = Fighter("CHAIN BREAKER", 0, 0);
        fighters[1] = Fighter("GAS GHOST",     0, 0);
        fighters[2] = Fighter("BLOCK BEAST",   0, 0);
        fighters[3] = Fighter("NODE NINJA",    0, 0);
        fighters[4] = Fighter("FORK FURY",     0, 0);
        fighters[5] = Fighter("HASH HUNTER",   0, 0);
    }

    // --- Core Functions ---

    /**
     * @notice Create a fight and pick your champion.
     */
    function enterArena(uint8 fighterId) external payable returns (uint256) {
        require(msg.value >= MIN_STAKE, "Stake too low");
        require(fighterId < 6, "Invalid fighter ID");

        uint256 id = fightCount++;
        fights[id] = Fight({
            player1:    msg.sender,
            player2:    address(0),
            fighter1Id: fighterId,
            fighter2Id: 0,
            stake:      msg.value,
            crowdPot:   0,
            winner:     address(0),
            status:     FightStatus.Waiting,
            createdAt:  block.timestamp
        });

        emit FightCreated(id, msg.sender, fighterId);
        return id;
    }

    /**
     * @notice Join an existing fight with a matching stake.
     */
    function joinFight(uint256 fightId, uint8 fighterId) external payable {
        Fight storage f = fights[fightId];
        require(f.status == FightStatus.Waiting, "Fight not open for joining");
        require(msg.sender != f.player1, "Cannot fight yourself");
        require(msg.value == f.stake, "Must match stake exactly");
        require(fighterId < 6, "Invalid fighter ID");

        f.player2    = msg.sender;
        f.fighter2Id = fighterId;
        f.status     = FightStatus.BettingOpen;

        emit FightJoined(fightId, msg.sender, fighterId);
    }

    /**
     * @notice Allow observers to bet on the outcome.
     */
    function betOnFighter(uint256 fightId, uint8 side) external payable {
        Fight storage f = fights[fightId];
        require(f.status == FightStatus.BettingOpen, "Betting is closed");
        require(msg.value >= MIN_BET, "Bet too low");
        require(side == 1 || side == 2, "Invalid side: use 1 or 2");
        require(msg.sender != f.player1 && msg.sender != f.player2, "Players cannot bet");

        crowdBets[fightId].push(CrowdBet(msg.sender, msg.value, side));
        f.crowdPot += msg.value;

        emit BetPlaced(fightId, msg.sender, side, msg.value);
    }

    /**
     * @notice Trigger the fight resolution using on-chain randomness.
     */
    function resolveFight(uint256 fightId) external {
        Fight storage f = fights[fightId];
        require(
            f.status == FightStatus.BettingOpen || f.status == FightStatus.Waiting,
            "Fight already resolved or in progress"
        );
        require(f.player2 != address(0), "Need two players to fight");
        require(msg.sender == f.player1 || msg.sender == f.player2, "Only fighters can resolve");

        f.status = FightStatus.Fighting;

        // On-chain randomness
        uint256 rand = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            f.player1,
            f.player2,
            block.timestamp,
            fightId
        )));

        bool p1wins = (rand % 2 == 0);
        address winner = p1wins ? f.player1 : f.player2;
        uint8 winningSide = p1wins ? 1 : 2;

        f.winner = winner;
        f.status = FightStatus.Resolved;

        // Update stats
        if (p1wins) {
            fighters[f.fighter1Id].wins++;
            fighters[f.fighter2Id].losses++;
        } else {
            fighters[f.fighter2Id].wins++;
            fighters[f.fighter1Id].losses++;
        }
        walletWins[winner]++;

        // Player Payout
        uint256 playerPot = f.stake * 2;
        (bool ok1,) = winner.call{value: playerPot}("");
        require(ok1, "Winner payout failed");
        walletEarnings[winner] += playerPot;

        // Crowd Payout (Proportional)
        uint256 winningSidePot = 0;
        uint256 totalCrowdPot = f.crowdPot;
        
        for (uint256 i = 0; i < crowdBets[fightId].length; i++) {
            if (crowdBets[fightId][i].side == winningSide) {
                winningSidePot += crowdBets[fightId][i].amount;
            }
        }

        if (winningSidePot > 0) {
            for (uint256 i = 0; i < crowdBets[fightId].length; i++) {
                CrowdBet memory b = crowdBets[fightId][i];
                if (b.side == winningSide) {
                    uint256 payout = (b.amount * totalCrowdPot) / winningSidePot;
                    if (payout > 0) {
                        (bool ok2,) = b.bettor.call{value: payout}("");
                        require(ok2, "Crowd payout failed");
                        walletEarnings[b.bettor] += payout;
                    }
                }
            }
        }

        emit FightResolved(fightId, winner, playerPot);
    }

    /**
     * @notice Emergency refund if fight stays stuck for >24 hours.
     */
    function emergencyRefund(uint256 fightId) external {
        Fight storage f = fights[fightId];
        require(block.timestamp > f.createdAt + 24 hours, "Too early for refund");
        require(f.status != FightStatus.Resolved, "Already resolved");
        require(msg.sender == f.player1 || msg.sender == f.player2, "Not a fighter");

        uint256 amount = f.stake;
        f.status = FightStatus.Resolved; // Mark as done to prevent double refund
        
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "Refund failed");
    }

    // --- View Helpers ---

    function getFight(uint256 id) external view returns (Fight memory) {
        return fights[id];
    }

    function getCrowdBets(uint256 id) external view returns (CrowdBet[] memory) {
        return crowdBets[id];
    }

    function getFighter(uint8 id) external view returns (Fighter memory) {
        return fighters[id];
    }

    function getActiveFights() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < fightCount; i++) {
            if (fights[i].status == FightStatus.Waiting || fights[i].status == FightStatus.BettingOpen) {
                count++;
            }
        }
        uint256[] memory active = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < fightCount; i++) {
            if (fights[i].status == FightStatus.Waiting || fights[i].status == FightStatus.BettingOpen) {
                active[idx++] = i;
            }
        }
        return active;
    }
}
