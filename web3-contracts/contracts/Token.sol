// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Token is ERC20, Ownable, Pausable {
    address public treasury;
    address public rouletteContract;
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event RouletteContractUpdated(address indexed oldContract, address indexed newContract);
    event TokensBurned(address indexed burner, uint256 amount);
    event TokensMinted(address indexed to, uint256 amount);

    constructor() ERC20("APT-Casino", "APTC") Ownable(msg.sender) {
        treasury = 0xF7249B507F1f89Eaea5d694cEf5cb96F245Bc5b6;
        // 1 billion tokens with 18 decimals = 1_000_000_000 * 10^18
        _mint(msg.sender, 1_000_000_000 * 10**decimals()); // Initial supply to deployer
    }

    // Only owner can mint new tokens
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    // Update treasury address
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    // Set roulette contract address
    function setRouletteContract(address _rouletteContract) external onlyOwner {
        require(_rouletteContract != address(0), "Invalid contract address");
        address oldContract = rouletteContract;
        rouletteContract = _rouletteContract;
        emit RouletteContractUpdated(oldContract, _rouletteContract);
    }

    // Pause token transfers in emergency
    function pause() external onlyOwner {
        _pause();
    }

    // Unpause token transfers
    function unpause() external onlyOwner {
        _unpause();
    }

    // Override transfer function to add pausable functionality
    function transfer(address to, uint256 value) public override whenNotPaused returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        return super.transfer(to, value);
    }

    // Override transferFrom function to add pausable functionality
    function transferFrom(address from, address to, uint256 value) public override whenNotPaused returns (bool) {
        require(to != address(0), "Cannot transfer to zero address");
        require(from != address(0), "Cannot transfer from zero address");
        return super.transferFrom(from, to, value);
    }

    // Burn tokens
    function burn(uint256 amount) external {
        require(msg.sender == treasury || msg.sender == rouletteContract, "Only treasury or roulette can burn");
        require(amount > 0, "Cannot burn zero tokens");
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
}