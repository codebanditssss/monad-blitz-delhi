// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MonadFighters {
    enum FightStatus { Waiting, Fighting, Resolved }

    struct Fighter {
        string name;
        uint wins;
        uint losses;
    }

    struct Fight {
        address player1;
        address player2;
        uint8 fighter1Id;
        uint8 fighter2Id;
        uint stake;
        uint crowdPot;
        address winner;
        FightStatus status;
        uint16 p1HP;
        uint16 p2HP;
        address nextTurn;
        bool p1Blocking;
        bool p2Blocking;
    }

    struct CrowdBet {
        address bettor;
        uint amount;
        uint8 side; // 1 = p1, 2 = p2
    }

    mapping(uint => Fight) public fights;
    mapping(uint => CrowdBet[]) public crowdBets;
    mapping(address => uint) public walletWins;
    mapping(address => uint) public walletEarnings;
    mapping(address => address) public sessionWallets; // New: Session delegation

    uint public fightCount;
    uint public constant MIN_STAKE = 0.01 ether;
    uint public constant MAX_HP = 100;

    Fighter[6] public fighters;

    event FightCreated(uint fightId, address player1, uint8 fighterId);
    event FightJoined(uint fightId, address player2, uint8 fighterId);
    event MoveExecuted(uint fightId, address player, uint8 moveType, uint16 damage, bool wasHit, uint16 p1HP, uint16 p2HP);
    event FightResolved(uint fightId, address winner, uint payout);
    event BetPlaced(uint fightId, address bettor, uint8 side, uint amount);

    constructor() {
        fighters[0] = Fighter("CHAIN BREAKER", 0, 0);
        fighters[1] = Fighter("GAS GHOST", 0, 0);
        fighters[2] = Fighter("BLOCK BEAST", 0, 0);
        fighters[3] = Fighter("NODE NINJA", 0, 0);
        fighters[4] = Fighter("FORK FURY", 0, 0);
        fighters[5] = Fighter("HASH HUNTER", 0, 0);
    }

    function enterArena(uint8 fighterId) external payable returns (uint) {
        require(msg.value >= MIN_STAKE, "Stake too low");
        require(fighterId < 6, "Invalid fighter");
        uint fightId = fightCount++;
        fights[fightId].player1 = msg.sender;
        fights[fightId].fighter1Id = fighterId;
        fights[fightId].stake = msg.value;
        fights[fightId].status = FightStatus.Waiting;
        fights[fightId].p1HP = uint16(MAX_HP);
        fights[fightId].p2HP = uint16(MAX_HP);
        emit FightCreated(fightId, msg.sender, fighterId);
        return fightId;
    }

    function startTraining(uint8 fighterId) external payable returns (uint) {
        require(msg.value >= MIN_STAKE, "Stake too low");
        uint fightId = fightCount++;
        Fight storage f = fights[fightId];
        f.player1 = msg.sender;
        f.player2 = address(0); 
        f.fighter1Id = fighterId;
        f.fighter2Id = uint8(uint(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 6);
        f.stake = msg.value;
        f.status = FightStatus.Fighting;
        f.p1HP = uint16(MAX_HP);
        f.p2HP = uint16(MAX_HP);
        f.nextTurn = msg.sender;
        emit FightCreated(fightId, msg.sender, fighterId);
        emit FightJoined(fightId, address(0), f.fighter2Id);
        return fightId;
    }

    function joinFight(uint fightId, uint8 fighterId) external payable {
        Fight storage f = fights[fightId];
        require(f.status == FightStatus.Waiting, "Not joinable");
        require(msg.value == f.stake, "Match stake");
        f.player2 = msg.sender;
        f.fighter2Id = fighterId;
        f.status = FightStatus.Fighting;
        f.nextTurn = f.player1;
        emit FightJoined(fightId, msg.sender, fighterId);
    }

    function authorizeSession(address burner) external payable {
        sessionWallets[msg.sender] = burner;
        if (msg.value > 0) {
            (bool sent,) = burner.call{value: msg.value}("");
            require(sent, "Fuel transfer failed");
        }
    }

    function playMove(uint fightId, uint8 moveType) external {
        Fight storage f = fights[fightId];
        require(f.status == FightStatus.Fighting, "Not fighting");
        
        address expectedPlayer = f.nextTurn;
        require(msg.sender == expectedPlayer || msg.sender == sessionWallets[expectedPlayer], "Not your turn or unauthorized");
        
        _executeMove(fightId, expectedPlayer, moveType);
        if (f.player2 == address(0) && f.status == FightStatus.Fighting) {
            uint8 botMove = uint8(1 + (uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 3));
            _executeMove(fightId, address(0), botMove);
        }
    }

    struct MoveResult { uint16 damage; bool wasHit; }

    function _executeMove(uint fightId, address player, uint8 moveType) internal {
        Fight storage f = fights[fightId];
        if (f.status != FightStatus.Fighting) return;
        
        MoveResult memory result;
        {
            uint rand = uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, player, fightId)));
            if (moveType == 1) { 
                if (rand % 100 < 90) { result.wasHit = true; result.damage = uint16(10 + (rand % 6)); }
            } else if (moveType == 2) { 
                if (rand % 100 < 50) { result.wasHit = true; result.damage = uint16(25 + (rand % 11)); }
            } else if (moveType == 3) { 
                if (player == f.player1) f.p1Blocking = true; else f.p2Blocking = true;
            }
        }

        if (result.wasHit) {
            if (player == f.player1) {
                if (f.p2Blocking) { result.damage /= 2; f.p2Blocking = false; }
                if (result.damage >= f.p2HP) { f.p2HP = 0; _resolve(fightId, f.player1); } else f.p2HP -= result.damage;
            } else {
                if (f.p1Blocking) { result.damage /= 2; f.p1Blocking = false; }
                if (result.damage >= f.p1HP) { f.p1HP = 0; _resolve(fightId, f.player2); } else f.p1HP -= result.damage;
            }
        }
        f.nextTurn = (player == f.player1) ? f.player2 : f.player1;
        emit MoveExecuted(fightId, player, moveType, result.damage, result.wasHit, f.p1HP, f.p2HP);
    }

    function _resolve(uint fightId, address winner) internal {
        fights[fightId].status = FightStatus.Resolved;
        fights[fightId].winner = winner;
        uint payout = fights[fightId].stake * 2;
        if (winner != address(0)) {
            (bool sent,) = winner.call{value: payout}("");
            require(sent, "Payout failed");
            walletWins[winner]++;
            walletEarnings[winner] += payout;
        }
        _payoutCrowd(fightId, winner == fights[fightId].player1 ? 1 : 2);
        emit FightResolved(fightId, winner, payout);
    }

    function _payoutCrowd(uint fightId, uint8 winningSide) internal {
        uint totalPot = fights[fightId].crowdPot;
        if (totalPot == 0) return;
        uint winningSidePot = 0;
        for (uint i = 0; i < crowdBets[fightId].length; i++) {
            if (crowdBets[fightId][i].side == winningSide) winningSidePot += crowdBets[fightId][i].amount;
        }
        if (winningSidePot > 0) {
            for (uint i = 0; i < crowdBets[fightId].length; i++) {
                CrowdBet memory bet = crowdBets[fightId][i];
                if (bet.side == winningSide && bet.bettor != address(0)) {
                    uint payout = (bet.amount * totalPot) / winningSidePot;
                    (bool sent,) = bet.bettor.call{value: payout}("");
                    if (sent) walletEarnings[bet.bettor] += payout;
                }
            }
        }
    }

    function betOnFighter(uint fightId, uint8 side) external payable { 
        require(fights[fightId].status == FightStatus.Fighting, "Not open");
        crowdBets[fightId].push(CrowdBet(msg.sender, msg.value, side));
        fights[fightId].crowdPot += msg.value;
        emit BetPlaced(fightId, msg.sender, side, msg.value);
    }
    function getFight(uint fightId) external view returns (Fight memory) { return fights[fightId]; }
    function getFighter(uint8 id) external view returns (Fighter memory) { return fighters[id]; }
    function getActiveFights() external view returns (uint[] memory) {
        uint count = 0;
        uint start = fightCount > 50 ? fightCount - 50 : 0;
        for (uint i = start; i < fightCount; i++) { 
            if (fights[i].status == FightStatus.Waiting) count++; 
        }
        uint[] memory active = new uint[](count);
        uint idx = 0;
        for (uint i = start; i < fightCount; i++) { 
            if (fights[i].status == FightStatus.Waiting) active[idx++] = i; 
        }
        return active;
    }
}
