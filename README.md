# SPSN - South Park Sucks Now 🎭

A deflationary memecoin built on Ethereum with automatic burns and liquidity generation.

![SPSN Logo](./assets/logo.png)

## Token Information

- **Name:** South Park Sucks Now
- **Symbol:** SPSN
- **Decimals:** 18
- **Total Supply:** 1,000,000,000 SPSN (1 Billion)
- **Target Price:** $9.95 per token
- **Network:** Ethereum (can be deployed to any EVM-compatible chain)

## Tokenomics

### Supply Distribution
- **Total Supply:** 1,000,000,000 SPSN
- **Liquidity Pool:** 40% (400,000,000 SPSN)
- **Community Rewards:** 30% (300,000,000 SPSN)
- **Team & Development:** 15% (150,000,000 SPSN) - 12 month vesting
- **Marketing:** 10% (100,000,000 SPSN)
- **Burn Wallet:** 5% (50,000,000 SPSN) - Initial burn

### Transaction Fees
- **Buy Tax:** 3%
  - 1% Burn
  - 1% Liquidity
  - 1% Marketing
- **Sell Tax:** 5%
  - 2% Burn
  - 2% Liquidity
  - 1% Marketing

### Deflationary Mechanism
- Automatic burn on every transaction
- Manual burn function for community events
- Max transaction limit: 1% of total supply (anti-whale)

## Features

✅ ERC-20 Standard Compliant
✅ Deflationary tokenomics with automatic burns
✅ Anti-whale protection (max transaction limits)
✅ Liquidity generation on every trade
✅ Marketing wallet for community growth
✅ Ownership renouncement capability
✅ Blacklist functionality for security
✅ Pausable in emergency situations

## Installation

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- MetaMask or similar Web3 wallet

### Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/spsn-token.git
cd spsn-token

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your private key and other configs to .env
\`\`\`

### Environment Variables

Create a `.env` file with the following:

\`\`\`
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
INFURA_API_KEY=your_infura_api_key

# Wallet Addresses
MARKETING_WALLET=0x...
LIQUIDITY_WALLET=0x...
TEAM_WALLET=0x...
\`\`\`

## Deployment

### Compile Contracts

\`\`\`bash
npm run compile
\`\`\`

### Run Tests

\`\`\`bash
npx hardhat test
\`\`\`

This will run the comprehensive test suite in `test/SPSNCoin.test.js`.

### Deploy to Testnet (Sepolia)

\`\`\`bash
npm run deploy:testnet
\`\`\`

### Deploy to Mainnet

\`\`\`bash
npm run deploy:mainnet
\`\`\`

### Verify Contract

\`\`\`bash
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS
\`\`\`

## Usage

### Interacting with the Contract

\`\`\`javascript
const SPSN = await ethers.getContractAt("SPSN", contractAddress);

// Check balance
const balance = await SPSN.balanceOf(address);

// Transfer tokens
await SPSN.transfer(recipientAddress, amount);

// Approve spending
await SPSN.approve(spenderAddress, amount);

// Burn tokens
await SPSN.burn(amount);
\`\`\`

## Security

- Contract audited by [Audit Firm Name] - [Link to audit report]
- Liquidity locked for 12 months
- Ownership can be renounced after launch
- Emergency pause functionality
- Anti-bot measures implemented

## Roadmap

### Phase 1: Launch (Q1 2025)
- ✅ Smart contract development
- ✅ Security audit
- 🔄 Token launch on Uniswap
- 🔄 CoinGecko listing
- 🔄 CoinMarketCap listing

### Phase 2: Growth (Q2 2025)
- Community building
- Marketing campaigns
- CEX listings
- Partnership announcements

### Phase 3: Expansion (Q3 2025)
- NFT collection launch
- Staking platform
- DAO governance implementation
- Cross-chain bridge

### Phase 4: Ecosystem (Q4 2025)
- DeFi integrations
- Mobile app
- Merchandise store
- Community events

## Community

- **Website:** https://spsn.token
- **Twitter:** @SPSN
- **Telegram:** t.me/SPSN
- **Discord:** discord.gg/SPSN

## Legal Disclaimer

SPSN is a memecoin created for entertainment purposes. Cryptocurrency investments carry risk. Do your own research (DYOR) before investing. The team is not responsible for any financial losses.

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

---

**Remember:** This is a memecoin. Invest responsibly and never invest more than you can afford to lose! 🚀
\`\`\`

\`\`\`solidity file="contracts/SPSN.sol"
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
    // Token configuration
    uint256 private constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant MAX_TRANSACTION_AMOUNT = INITIAL_SUPPLY / 100; // 1% max transaction
    
    // Fee structure
    uint256 public buyBurnFee = 100; // 1%
    uint256 public buyLiquidityFee = 100; // 1%
    uint256 public buyMarketingFee = 100; // 1%
    
    uint256 public sellBurnFee = 200; // 2%
    uint256 public sellLiquidityFee = 200; // 2%
    uint256 public sellMarketingFee = 100; // 1%
    
    uint256 private constant FEE_DENOMINATOR = 10000; // 100% = 10000
    
    // Wallets
    address public marketingWallet;
    address public liquidityWallet;
    address public teamWallet;
    
    // Trading control
    bool public tradingEnabled = false;
    uint256 public tradingEnabledTimestamp;
    
    // Mappings
    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public isBlacklisted;
    mapping(address => bool) public automatedMarketMakerPairs;
    
    // Events
    event TradingEnabled(uint256 timestamp);
    event FeesUpdated(uint256 buyBurn, uint256 buyLiquidity, uint256 buyMarketing, uint256 sellBurn, uint256 sellLiquidity, uint256 sellMarketing);
    event MarketingWalletUpdated(address indexed newWallet);
    event LiquidityWalletUpdated(address indexed newWallet);
    event ExcludedFromFees(address indexed account, bool isExcluded);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    event AutomatedMarketMakerPairUpdated(address indexed pair, bool indexed value);
    
    constructor(
        address _marketingWallet,
        address _liquidityWallet,
        address _teamWallet
    ) ERC20("South Park Sucks Now", "SPSN") {
        require(_marketingWallet != address(0), "Marketing wallet cannot be zero address");
        require(_liquidityWallet != address(0), "Liquidity wallet cannot be zero address");
        require(_teamWallet != address(0), "Team wallet cannot be zero address");
        
        marketingWallet = _marketingWallet;
        liquidityWallet = _liquidityWallet;
        teamWallet = _teamWallet;
        
        // Exclude from fees
        isExcludedFromFees[owner()] = true;
        isExcludedFromFees[address(this)] = true;
        isExcludedFromFees[marketingWallet] = true;
        isExcludedFromFees[liquidityWallet] = true;
        isExcludedFromFees[teamWallet] = true;
        
        // Mint initial supply
        _mint(owner(), INITIAL_SUPPLY);
    }
    
    receive() external payable {}
    
    // Trading control
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        tradingEnabledTimestamp = block.timestamp;
        emit TradingEnabled(block.timestamp);
    }
    
    // Fee management
    function updateBuyFees(uint256 _burnFee, uint256 _liquidityFee, uint256 _marketingFee) external onlyOwner {
        require(_burnFee + _liquidityFee + _marketingFee <= 1000, "Total buy fees cannot exceed 10%");
        buyBurnFee = _burnFee;
        buyLiquidityFee = _liquidityFee;
        buyMarketingFee = _marketingFee;
        emit FeesUpdated(buyBurnFee, buyLiquidityFee, buyMarketingFee, sellBurnFee, sellLiquidityFee, sellMarketingFee);
    }
    
    function updateSellFees(uint256 _burnFee, uint256 _liquidityFee, uint256 _marketingFee) external onlyOwner {
        require(_burnFee + _liquidityFee + _marketingFee <= 1500, "Total sell fees cannot exceed 15%");
        sellBurnFee = _burnFee;
        sellLiquidityFee = _liquidityFee;
        sellMarketingFee = _marketingFee;
        emit FeesUpdated(buyBurnFee, buyLiquidityFee, buyMarketingFee, sellBurnFee, sellLiquidityFee, sellMarketingFee);
    }
    
    // Wallet management
    function updateMarketingWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Cannot be zero address");
        marketingWallet = _newWallet;
        emit MarketingWalletUpdated(_newWallet);
    }
    
    function updateLiquidityWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Cannot be zero address");
        liquidityWallet = _newWallet;
        emit LiquidityWalletUpdated(_newWallet);
    }
    
    // Exclusion management
    function excludeFromFees(address account, bool excluded) external onlyOwner {
        isExcludedFromFees[account] = excluded;
        emit ExcludedFromFees(account, excluded);
    }
    
    function updateBlacklist(address account, bool blacklisted) external onlyOwner {
        isBlacklisted[account] = blacklisted;
        emit BlacklistUpdated(account, blacklisted);
    }
    
    function setAutomatedMarketMakerPair(address pair, bool value) external onlyOwner {
        require(pair != address(0), "Cannot be zero address");
        automatedMarketMakerPairs[pair] = value;
        emit AutomatedMarketMakerPairUpdated(pair, value);
    }
    
    // Pause functionality
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override transfer function
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(!isBlacklisted[from] && !isBlacklisted[to], "Blacklisted address");
        require(amount > 0, "Transfer amount must be greater than zero");
        
        // Check if trading is enabled
        if (!tradingEnabled) {
            require(isExcludedFromFees[from] || isExcludedFromFees[to], "Trading not yet enabled");
        }
        
        // Anti-whale: Check max transaction amount
        if (
            from != owner() &&
            to != owner() &&
            !isExcludedFromFees[from] &&
            !isExcludedFromFees[to]
        ) {
            require(amount <= MAX_TRANSACTION_AMOUNT, "Transfer amount exceeds maximum");
        }
        
        bool takeFee = true;
        
        // Check if fees should be applied
        if (isExcludedFromFees[from] || isExcludedFromFees[to]) {
            takeFee = false;
        }
        
        if (takeFee) {
            uint256 fees = 0;
            uint256 burnAmount = 0;
            uint256 liquidityAmount = 0;
            uint256 marketingAmount = 0;
            
            // Buy transaction
            if (automatedMarketMakerPairs[from]) {
                burnAmount = (amount * buyBurnFee) / FEE_DENOMINATOR;
                liquidityAmount = (amount * buyLiquidityFee) / FEE_DENOMINATOR;
                marketingAmount = (amount * buyMarketingFee) / FEE_DENOMINATOR;
                fees = burnAmount + liquidityAmount + marketingAmount;
            }
            // Sell transaction
            else if (automatedMarketMakerPairs[to]) {
                burnAmount = (amount * sellBurnFee) / FEE_DENOMINATOR;
                liquidityAmount = (amount * sellLiquidityFee) / FEE_DENOMINATOR;
                marketingAmount = (amount * sellMarketingFee) / FEE_DENOMINATOR;
                fees = burnAmount + liquidityAmount + marketingAmount;
            }
            
            if (fees > 0) {
                amount -= fees;
                
                // Burn tokens
                if (burnAmount > 0) {
                    super._transfer(from, address(0xdead), burnAmount);
                }
                
                // Send to liquidity wallet
                if (liquidityAmount > 0) {
                    super._transfer(from, liquidityWallet, liquidityAmount);
                }
                
                // Send to marketing wallet
                if (marketingAmount > 0) {
                    super._transfer(from, marketingWallet, marketingAmount);
                }
            }
        }
        
        super._transfer(from, to, amount);
    }
    
    // Utility functions
    function withdrawStuckETH() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function withdrawStuckTokens(address token) external onlyOwner {
        require(token != address(this), "Cannot withdraw SPSN tokens");
        IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
    }
}
