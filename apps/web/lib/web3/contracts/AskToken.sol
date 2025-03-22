// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AskToken is ERC20, Ownable {
    uint256 public registrationFee = 1 ether;
    uint256 public initialTokenAmount = 100 * 10**18; // 100 ASK tokens with 18 decimals
    
    mapping(address => bool) public registeredUsers;
    
    event UserRegistered(address indexed user, uint256 fee, uint256 tokensReceived);
    
    constructor() ERC20("AskChain Token", "ASK") Ownable(msg.sender) {
        // Mint initial supply for the contract owner
        _mint(msg.sender, 1000000 * 10**18); // 1 million ASK tokens
    }
    
    function register() external payable {
        require(!registeredUsers[msg.sender], "User already registered");
        require(msg.value >= registrationFee, "Insufficient registration fee");
        
        registeredUsers[msg.sender] = true;
        _mint(msg.sender, initialTokenAmount);
        
        emit UserRegistered(msg.sender, msg.value, initialTokenAmount);
    }
    
    function updateRegistrationFee(uint256 newFee) external onlyOwner {
        registrationFee = newFee;
    }
    
    function updateInitialTokenAmount(uint256 newAmount) external onlyOwner {
        initialTokenAmount = newAmount;
    }
    
    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}

