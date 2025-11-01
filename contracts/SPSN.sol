// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SPSN
 * @dev South Park Sucks Now - A memecoin with deflationary tokenomics
 */
contract SPSN is ERC20, ERC20Burnable, Pausable, Ownable {
    constructor(
        address _marketingWallet,
        address _liquidityWallet,
        address _teamWallet
    ) ERC20("South Park Sucks Now", "SPSN") {
        // Constructor code here
    }
    
    // Additional functions and code can be added here
}
