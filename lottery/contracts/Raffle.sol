// Raffle

// Enter the lottery (paying some amount)
// Pick a ransdom winner (verifiably random)
// Winner to be selected every X minutes -> completely automate

// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Automation)

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

error Raffle_NotEnoughETHEntered();
error Raffle_TransferFailed();
error Raffle_NotOpen();

contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
    /**Type declarations */
    enum RaffleState {
        OPEN,
        CALCULATING
    }
    /*State Variable */
    uint private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Lottery Variables
    address private s_recentWinner;
    RaffleState private s_raffleState;
    uint private s_lastTimeStamp;
    uint private immutable i_interval;

    /* Even */
    event RafflEnter(address indexed player);
    event RequestedRaffleWinner(uint indexed requestId);
    event WinnerPicked(address indexed winner);

    constructor(
        uint entranceFee,
        address vrfCoordinatorV2, // contract
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGaslimit,
        uint interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGaslimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle_NotEnoughETHEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle_NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RafflEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink Automation nodes call
     * they look for `upkeepNeeded` to return true.
     * The following should be true in order to return true;
     *
     * 1. Our time interval should have passed
     * 2. The Lottery should have at leat 1 player and have some Eth
     * 3. Our subscription is funded with LINK
     * 4. Lottery should be in "open" state.
     */
    function checkUpkeep(
        bytes memory /*checkData*/
    ) public override returns (bool upkeepNeeded, bytes memory /**performData */) {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        bool upkeepNeed = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    function performUpkeep(bytes calldata /**performData */) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        s_raffleState = RaffleState.CALCULATING;
        uint requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint requestId, uint[] memory randomWords) internal override {
        uint indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_recentWinner = recentWinner;
        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        (bool success, ) = recentWinner.call{value: address(this).balance}("");

        if (!success) {
            revert Raffle_TransferFailed();
        }
        emit WinnerPicked(recentWinner);
    }

    /** View / Pure Functions **/

    function getEntranceFee() public view returns (uint) {
        return i_entranceFee;
    }

    function getPlayer(uint index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint) {
        return s_lastTimeStamp;
    }

    function getRequestConfiramtions() public pure returns (uint) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
