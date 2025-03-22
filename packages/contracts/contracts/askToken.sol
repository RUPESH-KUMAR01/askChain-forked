// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AskPlatform is ERC20, Ownable {
    // TOKEN_PRICE = 0.0001 ETH per token
    // For example, sending 0.01 ETH mints 100 ASK tokens.
    uint256 public constant TOKEN_PRICE = 0.0001 ether;

    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokensReceived);
    event TokensWithdrawn(address indexed seller, uint256 tokenAmount, uint256 ethReceived);

    constructor() ERC20("AskChain Token", "ASK") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**18); // Mint an initial supply
    }

    /// @notice Buy ASK tokens by sending ETH.
    /// For example, sending 0.01 ETH will mint 100 ASK tokens.
    function buyTokens() external payable {
        require(msg.value > 0, "Must send ETH");
        uint256 tokensToMint = (msg.value * 10**18) / TOKEN_PRICE;
        _mint(msg.sender, tokensToMint);
        emit TokensPurchased(msg.sender, msg.value, tokensToMint);
    }

    /// @notice Withdraw ETH by burning ASK tokens at the fixed conversion rate.
    function withdrawEth(uint256 tokenAmount) external {
        require(tokenAmount > 0, "Must withdraw positive amount");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");

        uint256 ethToReturn = (tokenAmount * TOKEN_PRICE) / 10**18;
        require(address(this).balance >= ethToReturn, "Insufficient ETH in contract");

        _burn(msg.sender, tokenAmount);
        (bool success, ) = msg.sender.call{value: ethToReturn}("");
        require(success, "ETH transfer failed");

        emit TokensWithdrawn(msg.sender, tokenAmount, ethToReturn);
    }

    receive() external payable {}
}   