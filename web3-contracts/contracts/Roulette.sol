// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Roulette is ReentrancyGuard, Ownable {
    IERC20 public token;
    uint256 public minBet;
    uint256 public maxBet;
    address public constant TREASURY = 0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6;
    uint256 public constant TREASURY_FEE_RATE = 5; // 0.5% = 5/1000
    uint256 public constant MIN_WAIT_BLOCK = 1; // Minimum blocks to wait between bets
    
    uint256 public lastBetBlock; // Last block when a bet was placed
    uint256 public nonce; // Nonce for additional randomness
    uint256 public randomResult;

    enum BetType { 
        Number,     // Single number (35:1)
        Color,      // Red/Black (1:1)
        OddEven,    // Odd/Even (1:1)
        HighLow,    // 1-18/19-36 (1:1)
        Dozen,      // 1-12, 13-24, 25-36 (2:1)
        Column,     // First, Second, Third column (2:1)
        Split,      // Two adjacent numbers (17:1)
        Street,     // Three numbers horizontal (11:1)
        Corner,     // Four numbers (8:1)
        Line        // Six numbers (5:1)
    }

    struct Bet {
        address player;
        uint256 amount;
        BetType betType;
        uint8 betValue;
        uint256[] numbers;
    }

    Bet[] public bets;
    mapping(address => uint256) public playerBets;
    mapping(address => uint256) public lastBetTime;

    event BetPlaced(address indexed player, uint256 amount, BetType betType, uint8 betValue);
    event BetResult(address indexed player, uint256 amount, bool won, uint256 winnings);
    event RandomGenerated(uint256 randomNumber);

    constructor(
        IERC20 _token
    ) Ownable(msg.sender) {
        token = _token;
        minBet = 1 * 10**18; // 1 token (assuming 18 decimals)
        maxBet = type(uint256).max; // No maximum bet limit
        nonce = 0;
        lastBetBlock = 0;
    }

    function generateRandomNumber() internal returns (uint256) {
        require(block.number > lastBetBlock + MIN_WAIT_BLOCK, "Must wait for next block");
        
        // Combine multiple sources of entropy
        uint256 randomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    blockhash(block.number - 1),  // Previous block hash
                    block.timestamp,              // Current block timestamp
                    msg.sender,                   // Player's address
                    nonce,                        // Nonce that increases with each bet
                    block.prevrandao              // Previous block's randomness
                )
            )
        );
        
        // Update state
        nonce++;
        lastBetBlock = block.number;
        
        // Generate number between 0 and 36
        randomResult = randomNumber % 37;
        emit RandomGenerated(randomResult);
        
        return randomResult;
    }

    function placeBet(BetType betType, uint8 betValue, uint256 amount, uint256[] calldata numbers) external nonReentrant {
        require(amount >= minBet, "Bet amount below minimum");
        require(block.timestamp >= lastBetTime[msg.sender] + 3 seconds, "Wait between bets");
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");

        validateBet(betType, betValue, numbers);

        bets.push(Bet({
            player: msg.sender,
            amount: amount,
            betType: betType,
            betValue: betValue,
            numbers: numbers
        }));

        playerBets[msg.sender] += amount;
        lastBetTime[msg.sender] = block.timestamp;

        emit BetPlaced(msg.sender, amount, betType, betValue);

        // Generate random number and process bet immediately
        generateRandomNumber();
        processBets();
    }

    function validateBet(BetType betType, uint8 betValue, uint256[] calldata numbers) internal pure {
        if (betType == BetType.Number) {
            require(betValue <= 36, "Invalid number");
            require(numbers.length == 0, "No additional numbers needed");
        } else if (betType == BetType.Color) {
            require(betValue <= 1, "Invalid color value");
            require(numbers.length == 0, "No additional numbers needed");
        } else if (betType == BetType.OddEven) {
            require(betValue <= 1, "Invalid odd/even value");
            require(numbers.length == 0, "No additional numbers needed");
        } else if (betType == BetType.HighLow) {
            require(betValue <= 1, "Invalid high/low value");
            require(numbers.length == 0, "No additional numbers needed");
        } else if (betType == BetType.Dozen) {
            require(betValue <= 2, "Invalid dozen value");
            require(numbers.length == 0, "No additional numbers needed");
        } else if (betType == BetType.Column) {
            require(betValue <= 2, "Invalid column value");
            require(numbers.length == 0, "No additional numbers needed");
        } else if (betType == BetType.Split) {
            require(numbers.length == 2, "Split bet requires 2 numbers");
            validateNumbers(numbers, 2);
        } else if (betType == BetType.Street) {
            require(numbers.length == 3, "Street bet requires 3 numbers");
            validateNumbers(numbers, 3);
        } else if (betType == BetType.Corner) {
            require(numbers.length == 4, "Corner bet requires 4 numbers");
            validateNumbers(numbers, 4);
        } else if (betType == BetType.Line) {
            require(numbers.length == 6, "Line bet requires 6 numbers");
            validateNumbers(numbers, 6);
        }
    }

    function validateNumbers(uint256[] calldata numbers, uint256 count) internal pure {
        for (uint256 i = 0; i < count; i++) {
            require(numbers[i] <= 36, "Invalid number in bet");
        }
    }

    function processBets() internal {
        for (uint256 i = 0; i < bets.length; i++) {
            Bet memory bet = bets[i];
            (bool won, uint256 winnings) = calculateWinnings(bet);

            if (won) {
                // Calculate treasury fee
                uint256 treasuryFee = (winnings * TREASURY_FEE_RATE) / 1000;
                uint256 finalWinnings = winnings - treasuryFee;
                
                // Transfer winnings to player
                require(token.transfer(bet.player, finalWinnings), "Player transfer failed");
                // Transfer fee to treasury
                require(token.transfer(TREASURY, treasuryFee), "Treasury fee transfer failed");
                
                emit BetResult(bet.player, bet.amount, true, finalWinnings);
            } else {
                // Transfer lost bet amount to treasury
                require(token.transfer(TREASURY, bet.amount), "Treasury transfer failed");
                emit BetResult(bet.player, bet.amount, false, 0);
            }

            playerBets[bet.player] -= bet.amount;
        }

        delete bets;
    }

    function calculateWinnings(Bet memory bet) internal view returns (bool won, uint256 winnings) {
        if (bet.betType == BetType.Number && bet.betValue == randomResult) {
            return (true, bet.amount * 36);
        } else if (bet.betType == BetType.Color) {
            bool isRed = isRedNumber(randomResult);
            if ((bet.betValue == 0 && isRed) || (bet.betValue == 1 && !isRed)) {
                return (true, bet.amount * 2);
            }
        } else if (bet.betType == BetType.OddEven) {
            if (randomResult != 0) {
                bool isEven = randomResult % 2 == 0;
                if ((bet.betValue == 0 && !isEven) || (bet.betValue == 1 && isEven)) {
                    return (true, bet.amount * 2);
                }
            }
        } else if (bet.betType == BetType.HighLow) {
            if (randomResult != 0) {
                bool isHigh = randomResult >= 19;
                if ((bet.betValue == 0 && !isHigh) || (bet.betValue == 1 && isHigh)) {
                    return (true, bet.amount * 2);
                }
            }
        } else if (bet.betType == BetType.Dozen) {
            uint8 dozen = uint8((randomResult - 1) / 12);
            if (randomResult != 0 && bet.betValue == dozen) {
                return (true, bet.amount * 3);
            }
        } else if (bet.betType == BetType.Column) {
            if (randomResult != 0) {
                uint8 column = uint8((randomResult - 1) % 3);
                if (bet.betValue == column) {
                    return (true, bet.amount * 3);
                }
            }
        } else if (bet.betType == BetType.Split) {
            if (containsNumber(bet.numbers, randomResult)) {
                return (true, bet.amount * 18);
            }
        } else if (bet.betType == BetType.Street) {
            if (containsNumber(bet.numbers, randomResult)) {
                return (true, bet.amount * 12);
            }
        } else if (bet.betType == BetType.Corner) {
            if (containsNumber(bet.numbers, randomResult)) {
                return (true, bet.amount * 9);
            }
        } else if (bet.betType == BetType.Line) {
            if (containsNumber(bet.numbers, randomResult)) {
                return (true, bet.amount * 6);
            }
        }
        
        return (false, 0);
    }

    function containsNumber(uint256[] memory numbers, uint256 target) internal pure returns (bool) {
        for (uint256 i = 0; i < numbers.length; i++) {
            if (numbers[i] == target) {
                return true;
            }
        }
        return false;
    }

    function isRedNumber(uint256 number) internal pure returns (bool) {
        // Using a more gas-efficient way to check red numbers
        uint256[18] memory redNumbers = [
            uint256(1), uint256(3), uint256(5), uint256(7), uint256(9), uint256(12), 
            uint256(14), uint256(16), uint256(18), uint256(19), uint256(21), uint256(23), 
            uint256(25), uint256(27), uint256(30), uint256(32), uint256(34), uint256(36)
        ];
        
        for (uint256 i = 0; i < redNumbers.length; i++) {
            if (redNumbers[i] == number) {
                return true;
            }
        }
        return false;
    }

    // Owner functions
    function setMinBet(uint256 _minBet) external onlyOwner {
        require(_minBet > 0, "Minimum bet must be greater than 0");
        minBet = _minBet;
    }

    function withdrawTokens(uint256 amount) external onlyOwner {
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }
}
