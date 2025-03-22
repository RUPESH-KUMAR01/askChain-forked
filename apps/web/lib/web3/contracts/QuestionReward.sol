// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract QuestionReward is Ownable {
    IERC20 public askToken;
    
    struct Question {
        address author;
        string questionId; // Reference to off-chain storage
        uint256 reward;
        address winner;
        uint256 endTime;
        bool isResolved;
    }
    
    mapping(string => Question) public questions;
    mapping(address => uint256) public pendingRewards;
    
    event QuestionPosted(string indexed questionId, address indexed author, uint256 reward, uint256 endTime);
    event QuestionResolved(string indexed questionId, address indexed winner, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount);
    
    constructor(address _askTokenAddress) Ownable(msg.sender) {
        askToken = IERC20(_askTokenAddress);
    }
    
    function postQuestion(string calldata questionId, uint256 reward, uint256 duration) external {
        require(reward > 0, "Reward must be greater than 0");
        require(askToken.balanceOf(msg.sender) >= reward, "Insufficient ASK token balance");
        require(askToken.allowance(msg.sender, address(this)) >= reward, "Token allowance too low");
        
        // Transfer tokens from user to contract
        askToken.transferFrom(msg.sender, address(this), reward);
        
        // Create question
        questions[questionId] = Question({
            author: msg.sender,
            questionId: questionId,
            reward: reward,
            winner: address(0),
            endTime: block.timestamp + duration,
            isResolved: false
        });
        
        emit QuestionPosted(questionId, msg.sender, reward, block.timestamp + duration);
    }
    
    function resolveQuestion(string calldata questionId, address winner) external {
        Question storage question = questions[questionId];
        
        require(question.reward > 0, "Question does not exist");
        require(!question.isResolved, "Question already resolved");
        require(block.timestamp >= question.endTime, "Question period not ended");
        require(winner != address(0), "Invalid winner address");
        
        // Only the question author or contract owner can resolve
        require(msg.sender == question.author || msg.sender == owner(), "Not authorized");
        
        // Update question state
        question.winner = winner;
        question.isResolved = true;
        
        // Add to winner's pending rewards
        pendingRewards[winner] += question.reward;
        
        emit QuestionResolved(questionId, winner, question.reward);
    }
    
    function claimRewards() external {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        // Reset pending rewards before transfer to prevent reentrancy
        pendingRewards[msg.sender] = 0;
        
        // Transfer tokens to winner
        askToken.transfer(msg.sender, amount);
        
        emit RewardClaimed(msg.sender, amount);
    }
    
    function updateAskTokenAddress(address newTokenAddress) external onlyOwner {
        askToken = IERC20(newTokenAddress);
    }
}

