#[allow(unused_const)]
module 0x0::roulette {

    use sui::sui::SUI;
    use sui::table::{ Table};
    use sui::balance::Balance;
    use sui::coin;
    use sui::table;
    use sui::balance;


    // Constants for bet types
    #[allow(unused_const)]
    const BET_TYPE_STRAIGHT: u8 = 0;
    const BET_TYPE_SPLIT: u8 = 1;
    const BET_TYPE_STREET: u8 = 2;
    const BET_TYPE_CORNER: u8 = 3;
    const BET_TYPE_RED_BLACK: u8 = 4;
    const BET_TYPE_ODD_EVEN: u8 = 5;
    const BET_TYPE_HIGH_LOW: u8 = 6;
    const BET_TYPE_DOZENS: u8 = 7;

    // Constants for bet values
    const BET_VALUE_RED: u8 = 0;
    const BET_VALUE_BLACK: u8 = 1;
    const BET_VALUE_ODD: u8 = 0;
    const BET_VALUE_EVEN: u8 = 1;
    const BET_VALUE_LOW: u8 = 0;  // 1-18
    const BET_VALUE_HIGH: u8 = 1; // 19-36
    const BET_VALUE_DOZEN_1: u8 = 0; // 1-12
    const BET_VALUE_DOZEN_2: u8 = 1; // 13-24
    const BET_VALUE_DOZEN_3: u8 = 2; // 25-36

    // Constants for payouts
    const PAYOUT_STRAIGHT: u64 = 35;
    const PAYOUT_SPLIT: u64 = 17;
    const PAYOUT_STREET: u64 = 11;
    const PAYOUT_CORNER: u64 = 8;
    const PAYOUT_RED_BLACK: u64 = 1;
    const PAYOUT_ODD_EVEN: u64 = 1;
    const PAYOUT_HIGH_LOW: u64 = 1;
    const PAYOUT_DOZENS: u64 = 2;

    // Error codes
    const EInvalidBetType: u64 = 0;
    const EInvalidBetValue: u64 = 1;
    const EInvalidBetAmount: u64 = 2;
    const EBettingClosed: u64 = 3;
    const EInsufficientFunds: u64 = 4;
    const EUnauthorizedCaller: u64 = 5;
    const ENoCommitSecret: u64 = 6;
    const EInvalidRevealSecret: u64 = 7;
    const EBettingOpen: u64 = 8;

    public struct Bet has store {
        player_address: address,
        bet_type: u8,
        bet_values: vector<u8>, // For straight: single number, split: two numbers, etc.
        bet_amount: u64,
        bet_id: u64
    }

      public struct GameState has key {
        id: UID,
        round_id: u64,
        betting_open: bool,
        winning_number: u8,
        commit_secret: vector<u8>,
        reveal_secret: vector<u8>,
        house_pool:Balance<SUI>(),
        bets: Table<u64, Bet>,
        next_bet_id: u64
    }

    public fun validate_straight_bet(number:u8):bool{
        number <=36
    }

    fun validate_split_bet(numbers:vector<u8>):bool{
       if(vector::length(&numbers)!=2) return false;
        let num1= *vector::borrow(&numbers,0);
        let num2=*vector::borrow(&numbers,1);

        // Check if numbers are valid (1-36)
        if (num1 == 0 || num1 > 36 || num2 == 0 || num2 > 36) return false;

        // Check if numbers are adjacent
        // Numbers are adjacent if:
        // 1. They are in the same row (difference of 1)
        // 2. They are in the same column (difference of 3)
        let diff = if (num1 > num2) num1 - num2 else num2 - num1;
        diff == 1 || diff == 3


    }

    fun validate_street_bet(numbers: vector<u8>): bool {
        if (vector::length(&numbers) != 3) return false;
      
        let num1 = *vector::borrow(&numbers, 0);
        let num2 = *vector::borrow(&numbers, 1);
        let num3 = *vector::borrow(&numbers, 2);
        
        // Check if numbers are valid (1-36)
        if (num1 == 0 || num1 > 36 || num2 == 0 || num2 > 36 || num3 == 0 || num3 > 36) return false;

        // Find min and max
        let min = if (num1 <= num2 && num1 <= num3) { num1 } else if (num2 <= num1 && num2 <= num3) { num2 } else { num3 };
        let max = if (num1 >= num2 && num1 >= num3) { num1 } else if (num2 >= num1 && num2 >= num3) { num2 } else { num3 };
        
        // Numbers should be consecutive
        max - min == 2
    }

    fun validate_corner_bet(numbers: vector<u8>): bool {
        if (vector::length(&numbers) != 4) return false;
        // Check if numbers form a corner (implement corner logic)
        true // Placeholder

        let num1 = *vector::borrow(&numbers, 0);
        let num2 = *vector::borrow(&numbers, 1);
        let num3 = *vector::borrow(&numbers, 2);
        let num4 = *vector::borrow(&numbers, 3);
        
        // Check if numbers are valid (1-36)
        if (num1 == 0 || num1 > 36 || num2 == 0 || num2 > 36 || 
            num3 == 0 || num3 > 36 || num4 == 0 || num4 > 36) return false;


              // Check if numbers form a corner (2x2 square)
        // Sort numbers to make comparison easier
        let min = if (num1 <= num2 && num1 <= num3 && num1 <= num4) num1 
                 else if (num2 <= num1 && num2 <= num3 && num2 <= num4) num2
                 else if (num3 <= num1 && num3 <= num2 && num3 <= num4) num3
                 else num4;
        
        // Check if the other numbers form a 2x2 square with the minimum number
        let has_right = false;
        let has_below = false;
        let has_diagonal = false;
        
        let i = 0;
        while (i < vector::length(&numbers)) {
            let num = *vector::borrow(&numbers, i);
            if (num == min + 1) has_right = true;
            if (num == min + 3) has_below = true;
            if (num == min + 4) has_diagonal = true;
            i = i + 1;
        };
        
        has_right && has_below && has_diagonal
    }

   fun validate_red_black_bet(value: u8): bool {
        value == BET_VALUE_RED || value == BET_VALUE_BLACK
    }

    fun validate_odd_even_bet(value: u8): bool {
        value == BET_VALUE_ODD || value == BET_VALUE_EVEN
    }

    fun validate_high_low_bet(value: u8): bool {
        value == BET_VALUE_LOW || value == BET_VALUE_HIGH
    }

    fun validate_dozens_bet(value: u8): bool {
        value == BET_VALUE_DOZEN_1 || value == BET_VALUE_DOZEN_2 || value == BET_VALUE_DOZEN_3
    }


    public fun place_bet(
        game_state:&mut GameState,
        bet_type:u8,
        bet_values:vector<u8>,
        bet_amount:u64,
        ctx:&mut TxContext
    ) {
        assert!(game_state.betting_open,EBettingClosed);
        assert!(bet_amount>0,EInvalidBetAmount);


        // Validate bet type and values
 let valid = if (bet_type == BET_TYPE_STRAIGHT) {
    validate_straight_bet(*vector::borrow(&bet_values, 0))
} else if (bet_type == BET_TYPE_SPLIT) {
    validate_split_bet(bet_values)
} else if (bet_type == BET_TYPE_STREET) {
    validate_street_bet(bet_values)
} else if (bet_type == BET_TYPE_CORNER) {
    validate_corner_bet(bet_values)
} else {
    false
};
        assert!(valid, EInvalidBetType);

        //create new bet
        let bet = Bet{
          player_address: tx_context::sender(ctx),
            bet_type,
            bet_values,
            bet_amount,
            bet_id: game_state.next_bet_id
        };

        //Add bet to the game state
        table::add(&mut game_state.bets,game_state.next_bet_id,bet);
        game_state.next_bet_id=game_state.next_bet_id+1;

    }
      // Function to calculate payout for a bet
    fun calculate_payout(bet: &Bet, winning_number: u8): u64 {
        let payout_multiplier = 
            if (bet.bet_type == BET_TYPE_STRAIGHT) {
                PAYOUT_STRAIGHT
            } else if (bet.bet_type == BET_TYPE_SPLIT) {
                PAYOUT_SPLIT
            } else if (bet.bet_type == BET_TYPE_STREET) {
                PAYOUT_STREET
            } else if (bet.bet_type == BET_TYPE_CORNER) {
                PAYOUT_CORNER
            } else if (bet.bet_type == BET_TYPE_RED_BLACK) {
                PAYOUT_RED_BLACK
            } else if (bet.bet_type == BET_TYPE_ODD_EVEN) {
                PAYOUT_ODD_EVEN
            } else if (bet.bet_type == BET_TYPE_HIGH_LOW) {
                PAYOUT_HIGH_LOW
            } else if (bet.bet_type == BET_TYPE_DOZENS) {
                PAYOUT_DOZENS
            } else {
                0
            };

        // Check if bet wins
        let wins = 
            if (bet.bet_type == BET_TYPE_STRAIGHT) {
            *vector::borrow(&bet.bet_values, 0) == winning_number
            } else if (bet.bet_type == BET_TYPE_SPLIT) {
            is_winning_split(&bet.bet_values, winning_number)
            } else if (bet.bet_type == BET_TYPE_STREET) {
            is_winning_street(&bet.bet_values, winning_number)
            } else if (bet.bet_type == BET_TYPE_CORNER) {
            is_winning_corner(&bet.bet_values, winning_number)
            } else if (bet.bet_type == BET_TYPE_RED_BLACK) {
            is_winning_red_black(*vector::borrow(&bet.bet_values, 0), winning_number)
            } else if (bet.bet_type == BET_TYPE_ODD_EVEN) {
            is_winning_odd_even(*vector::borrow(&bet.bet_values, 0), winning_number)
            } else if (bet.bet_type == BET_TYPE_HIGH_LOW) {
            is_winning_high_low(*vector::borrow(&bet.bet_values, 0), winning_number)
            } else if (bet.bet_type == BET_TYPE_DOZENS) {
            is_winning_dozens(*vector::borrow(&bet.bet_values, 0), winning_number)
            } else {
            false
            };

        if wins {
            bet.bet_amount * payout_multiplier
        } else {
           0
        }
    }



        // Helper functions to check if bets win
    fun is_winning_split(numbers: &vector<u8>, winning_number: u8): bool {
        // Implement split win logic
        false // Placeholder
    }

    fun is_winning_street(numbers: &vector<u8>, winning_number: u8): bool {
        // Implement street win logic
        false // Placeholder
    }

    fun is_winning_corner(numbers: &vector<u8>, winning_number: u8): bool {
        // Implement corner win logic
        false // Placeholder
    }

    fun is_winning_red_black(bet_value: u8, winning_number: u8): bool {
        // Implement red/black win logic
        false // Placeholder
    }

    #[allow(unused_variable)]
    fun is_winning_odd_even(bet_value: u8, winning_number: u8): bool {
        // Implement odd/even win logic
        false // Placeholder
    }

    fun is_winning_high_low(bet_value: u8, winning_number: u8): bool {
        // Implement high/low win logic
        false // Placeholder
    }

    fun is_winning_dozens(bet_value: u8, winning_number: u8): bool {
        // Implement dozens win logic
        false // Placeholder
    }





fun start_new_round(
    game_state:&mut GameState,
    ctx:&mut TxContext
 ){
    assert!(!game_state.betting_open,0);

    game_state.round_id=game_state.round_id+1;
    game_state.betting_open=true;
    game_state.winning_number=0;
    // game_state.commit_secret=vector::empty();
    // game_state.reveal_secret=vector::empty(); 

    while(table::length(&game_state.bets)>0){
        let(_,bet)=table::remove(&mut game_state.bets,0);

        //drop the table
        let Bet {player_address:_,bet_type:_,bet_values:_,bet_amount:_,bet_id:_}=bet;
    };

    game_state.next_bet_id=0;
 }

 public fun close_betting(
    game_state:&mut GameState,
    commit_secret:vector<u8>,
    ctx:&mut TxContext
 ){
    assert!(game_state.betting_open,o);//can we pass EBETtIng CLODED instead of zero
    assert!(tx_context::epoch(ctx)==@roulette_admin,0);

    
        game_state.betting_open = false;
        game_state.commit_secret = commit_secret;

 }

public fun spin_wheel(
    game_state:&mut GameState,
    reveal_secret:vector<u8>,
    ctx:&mut TxContext
){
    assert!(!game_state.betting_open,EBettingOpen);
    // assert!(vector::length(&reveal_secret)==32,EInvalidSecretLength);
    assert!(tx_context::sender(ctx) == @roulette_admin, EUnauthorizedCaller); // Only admin can spin wheel
    assert!(vector::length(&game_state.commit_secret) > 0, 0); // Must have commit secret
    

    // Verify reveal secret matches commit secret
        // This is a simplified version - in production, you'd want to use proper cryptographic verification
        assert!(vector::length(&reveal_secret) == vector::length(&game_state.commit_secret), 0);

    
        game_state.reveal_secret = reveal_secret;
        
        // Generate winning number using reveal secret and block timestamp
        let timestamp = tx_context::epoch(ctx);
        let seed = (timestamp as u64) + (vector::length(&reveal_secret) as u64);
        game_state.winning_number = (seed % 37) as u8; // 0-36

}

public fun distribute_payouts(
    game_state:&mut GameState,
    ctx:&mut TxContext
){

    
    assert!(!game_state.betting_open,EBettingOpen);//Betting must be closed
     assert!(game_state.winning_number > 0 || game_state.winning_number == 0, 0); // Must have winning number
        
        let total_payouts = 0;
        
        // Process all bets
        while (table::length(&game_state.bets) > 0) {
            let (bet_id, bet) = table::remove(&mut game_state.bets, 0);
            let payout = calculate_payout(&bet, game_state.winning_number);
            
            if (payout > 0) {
                // Transfer winnings to player
                let payout_coin = coin::split<SUI>(&mut game_state.house_pool, payout, ctx);
                    transfer::public_transfer(payout_coin, bet.player_address);
                total_payouts = total_payouts + payout;
            };
            
            // Drop the bet
            let Bet { player_address: _, bet_type: _, bet_values: _, bet_amount: _, bet_id: _ } = bet;
        };
        
        // Emit event for the round
        event::emit(RoundComplete {
            round_id: game_state.round_id,
            winning_number: game_state.winning_number,
            total_payouts
        });
}

    // Event for round completion
    struct RoundComplete has copy, drop {
        round_id: u64,
        winning_number: u8,
        total_payouts: u64
    }


 // Function to fund the house
    public fun fund_house(
        game_state: &mut GameState,
        payment:  Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == @roulette_admin, EUnauthorizedCaller); // Only admin can fund house
        coin::join(&mut game_state.house_pool, payment);
    }

    // Function to verify fairness
    public fun verify_fairness(
        game_state: &GameState
    ): (vector<u8>, vector<u8>, u8) {
        (game_state.commit_secret, game_state.reveal_secret, game_state.winning_number)
    }

    // Module initialization
    fun init(ctx: &mut TxContext) {
        let game_state = GameState {
            id: object::new(ctx),
            round_id: 0,
            betting_open: false,
            winning_number: 0,
            commit_secret: vector::empty(),
            reveal_secret: vector::empty(),
            house_pool: balance::zero<SUI>(),
            bets: table::new(ctx),
            next_bet_id: 0
        };
    }

}