# Roulette Game Smart Contract Design

## Core Functions

### 1. `start_new_round`
**Purpose**: Starts a new roulette round, resetting the game state and opening the betting window.

**Why Needed**: Each round needs a fresh state to track new bets and ensure no old data interferes.

**Variables**:
- `round_id`: A unique number (e.g., 1, 2, 3) to identify the current round
- `betting_open`: A boolean (true/false) to show if players can place bets (set to true here)
- `game_state`: An object storing the round's data, like bets and the winning number

**Objects**:
- `GameState`: A Sui object that holds the game's current status (round ID, bets, etc.)
- `BetList`: A collection (list) of all bets placed in the round, stored as objects

**How It Works**:
1. Resets GameState for a new round_id
2. Clears BetList to remove old bets
3. Sets betting_open to true, allowing players to bet
4. Initializes a commit_secret (explained later) to prepare for random number generation

### 2. `place_bet`
**Purpose**: Lets a player place a bet (e.g., on a number, color) with SUI tokens during the betting window.

**Why Needed**: This is how players interact with the game, wagering on outcomes.

**Variables**:
- `player_address`: The player's Sui wallet address
- `bet_type`: The type of bet (e.g., Straight for a single number, RedBlack for color)
- `bet_number`: The specific number(s) or value bet on (e.g., 17 for Straight, "red" for RedBlack)
- `bet_amount`: The amount of SUI tokens wagered (e.g., 1 SUI)
- `bet_id`: A unique ID for each bet to track it

**Objects**:
- `Bet`: A Sui object representing a single bet, storing player_address, bet_type, bet_number, bet_amount, and bet_id

**How It Works**:
1. Checks if betting_open is true (in GameState); if not, rejects the bet
2. Verifies the player sent enough SUI tokens for bet_amount
3. Creates a new Bet object with the bet details
4. Adds the Bet to BetList in GameState
5. Locks the bet_amount in the contract until the round ends

### 3. `close_betting`
**Purpose**: Closes the betting window to stop new bets and prepare for the wheel spin.

**Why Needed**: Ensures no one bets after the random number generation starts, preventing cheating.

**Variables**:
- `betting_open`: Set to false to lock betting
- `commit_secret`: A hashed value (e.g., a secret number) committed by the game operator to ensure fair randomness

**Objects**:
- Uses GameState to update the round's status

**How It Works**:
1. Checks if the game operator (you or an admin) is calling this function
2. Sets betting_open to false in GameState
3. Stores commit_secret in GameState to use later for randomness (explained in spin_wheel)

### 4. `spin_wheel`
**Purpose**: Generates a random number (0-36) to simulate the roulette wheel's result.

**Why Needed**: This determines the winning number, mimicking the ball landing on the wheel.

**Variables**:
- `winning_number`: The random number (0-36) for the round
- `reveal_secret`: The original secret (before hashing) provided by the operator to verify commit_secret
- `block_timestamp`: The current Sui blockchain timestamp, used to add unpredictability

**Objects**:
- Updates GameState with winning_number

**How It Works**:
1. Verifies reveal_secret matches commit_secret (proving the operator didn't cheat)
2. Combines reveal_secret and block_timestamp to generate a random winning_number
3. Stores winning_number in GameState
4. Makes commit_secret and reveal_secret public so players can verify fairness

### 5. `distribute_payouts`
**Purpose**: Calculates and sends winnings to players based on the winning_number and their bets.

**Why Needed**: Automatically pays winners and clears the round, ensuring trust and efficiency.

**Variables**:
- `winning_number`: Used to check which bets won
- `payout_amount`: The SUI tokens to send to each winning player (e.g., 35x for a Straight bet)
- `house_pool`: A reserve of SUI tokens in the contract to pay winners

**Objects**:
- Reads BetList to process each Bet
- Updates GameState to mark the round as complete

**How It Works**:
1. Loops through each Bet in BetList
2. Checks if the bet_type and bet_number match the winning_number's properties
3. Calculates payout_amount based on the bet type:
   - Straight (e.g., bet on 17): 35:1 (pays 35x bet_amount + returns bet_amount)
   - RedBlack (e.g., bet on red): 1:1 (pays 1x bet_amount + returns bet_amount)
   - And so on for other bet types (Dozens, OddEven, etc.)
4. Sends payout_amount in SUI to the player_address from house_pool
5. Returns bet_amount to players for losing bets
6. Clears BetList and prepares for the next round

### 6. `fund_house`
**Purpose**: Allows the game operator to add SUI tokens to the contract to cover payouts.

**Why Needed**: Ensures the contract has enough funds to pay winners, especially after big wins.

**Variables**:
- `fund_amount`: The amount of SUI tokens deposited
- `house_pool`: The contract's balance of SUI for payouts

**Objects**:
- Updates house_pool in GameState

**How It Works**:
1. Checks if the caller is the game operator
2. Adds fund_amount to house_pool
3. Ensures house_pool is sufficient before starting new rounds

### 7. `verify_fairness`
**Purpose**: Lets players check that the random number was generated fairly.

**Why Needed**: Builds trust by proving the winning_number wasn't manipulated.

**Variables**:
- `commit_secret`: The hash committed before the spin
- `reveal_secret`: The secret revealed after the spin
- `block_timestamp`: The timestamp used in randomness
- `winning_number`: The result to verify

**Objects**:
- Reads GameState for verification data

**How It Works**:
1. Players call this function to see commit_secret, reveal_secret, block_timestamp, and winning_number
2. They can recompute the random number to confirm it matches winning_number
3. Ensures transparency without requiring trust in the operator

## Program Flow

1. **Setup**: Deploy the smart contract with an initial house_pool (via fund_house) and create a GameState object
2. **New Round**: Call start_new_round to set a new round_id, clear BetList, and open betting
3. **Players Bet**: Players call place_bet multiple times to submit bets
4. **Close Betting**: The operator calls close_betting, setting betting_open = false and committing commit_secret
5. **Spin Wheel**: The operator calls spin_wheel, revealing reveal_secret to generate winning_number
6. **Payouts**: The contract calls distribute_payouts, checking each Bet against winning_number
7. **Verification**: Players use verify_fairness to confirm the winning_number was fair
8. **Repeat**: Return to step 2 for the next round

## Frontend Flow

1. Show a roulette table where players pick bets
2. Display a "Betting Open" timer, then a "Spinning" animation
3. Show the winning_number and update player balances after payouts
4. Offer a "Verify Fairness" button to check randomness

## Key Objects and Their Purpose

### GameState
- Stores round_id, betting_open, winning_number, commit_secret, reveal_secret, house_pool, and BetList
- Acts as the central hub of the game

### Bet
- Represents one player's bet with player_address, bet_type, bet_number, bet_amount, and bet_id
- Stored in BetList

### BetList
- A list of Bet objects for the current round
- Cleared each round

### HousePool
- Tracks SUI tokens available for payouts
- Updated by fund_house and distribute_payouts

## Types of Bets and Payouts

Roulette offers a variety of betting options, each with different odds and payouts. Below are the most common bet types:

### Inside Bets (Higher Risk, Higher Reward)

| Bet Type      | Description                                              | Example                | Payout  |
|---------------|----------------------------------------------------------|------------------------|---------|
| **Straight**  | Bet on a single number                                  | 17                     | 35:1    |
| **Split**     | Bet on two adjacent numbers                             | 17 and 18              | 17:1    |
| **Street**    | Bet on three numbers in a row                           | 16, 17, 18             | 11:1    |
| **Corner**    | Bet on four numbers that form a square                  | 16, 17, 19, 20         | 8:1     |

### Outside Bets (Lower Risk, Lower Reward)

| Bet Type      | Description                                              | Example                | Payout  |
|---------------|----------------------------------------------------------|------------------------|---------|
| **Red/Black** | Bet on the color of the winning number                  | "red"                  | 1:1     |
| **Odd/Even**  | Bet on whether the number is odd or even                | "odd"                  | 1:1     |
| **High/Low**  | Bet on 1-18 (low) or 19-36 (high)                       | "low"                  | 1:1     |
| **Dozens**    | Bet on one of three groups of 12 numbers                | 1-12                   | 2:1     |

#### Example Payouts

- If you bet $1 on "17" (straight bet) and win, you receive $35 plus your $1 back, totaling **$36**.
- If you bet $1 on "red" and win, you receive $1 plus your $1 back, totaling **$2**.

> **Note:** The green 0 is the house’s edge—if the ball lands there, most bets lose unless you specifically bet on 0.