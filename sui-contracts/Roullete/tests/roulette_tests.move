/*
#[test_only]
module roullete::roullete_tests;
// uncomment this line to import the module
// use roullete::roullete;

const ENotImplemented: u64 = 0;

#[test]
fun test_roullete() {
    // pass
}

#[test, expected_failure(abort_code = ::roullete::roullete_tests::ENotImplemented)]
fun test_roullete_fail() {
    abort ENotImplemented
}
*/

#[test_only]
#[allow(unused_use)]
module roulette::game_tests {
    
    use 0x0::roulette::{Self};
    use sui::test_scenario::{Self as ts};
   

    const INITIAL_BALANCE: u64 = 10000;
    const BET_AMOUNT: u64 = 100;

    // Test straight bet validation
    #[test]
    fun test_straight_bet() {
        let scenario = ts::begin(@0x0);
        
        // Test valid straight bet (number <= 36)
        assert!(roulette::validate_straight_bet(17), 0);
        
        // Test invalid straight bet (number > 36)
        assert!(!roulette::validate_straight_bet(37), 0);
        
        // Test edge cases
        assert!(roulette::validate_straight_bet(1), 0);  // Minimum valid number
        assert!(roulette::validate_straight_bet(36), 0); // Maximum valid number
        assert!(!roulette::validate_straight_bet(0), 0); // Invalid number
        
        ts::end(scenario);
    }
}
