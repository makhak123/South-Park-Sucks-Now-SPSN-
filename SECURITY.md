# Security Policy

## Smart Contract Security

### Audits
- Contract will be audited by [Audit Firm] before mainnet launch
- Audit report will be published in this repository
- Any critical issues will be addressed before deployment

### Security Features

1. **OpenZeppelin Contracts**
   - Using battle-tested, industry-standard contracts
   - ERC20, Ownable, Pausable implementations

2. **Access Control**
   - Owner-only functions for critical operations
   - Ability to renounce ownership after launch

3. **Emergency Controls**
   - Pausable functionality for emergency situations
   - Blacklist capability for malicious actors

4. **Anti-Bot Measures**
   - Max transaction limits
   - Trading enable/disable functionality
   - Blacklist for detected bots

### Known Limitations

- Owner has significant control before ownership renouncement
- Fees can be adjusted by owner (within limits)
- Blacklist functionality could be misused

## Reporting Vulnerabilities

If you discover a security vulnerability, please email: security@spsn.com

**Please do NOT:**
- Open a public GitHub issue
- Discuss the vulnerability publicly
- Exploit the vulnerability

**Please DO:**
- Provide detailed information about the vulnerability
- Include steps to reproduce
- Allow reasonable time for fixes before disclosure

### Bug Bounty

We offer rewards for responsible disclosure:
- Critical: Up to $10,000 in SPSN
- High: Up to $5,000 in SPSN
- Medium: Up to $1,000 in SPSN
- Low: Up to $500 in SPSN

## Best Practices for Users

1. **Verify Contract Address**
   - Always verify you're interacting with the official contract
   - Check multiple sources (website, Twitter, Telegram)

2. **Use Hardware Wallets**
   - Store significant amounts in hardware wallets
   - Never share your private keys

3. **Beware of Scams**
   - No team member will DM you first
   - Never send tokens to "verify" your wallet
   - Be cautious of fake websites and social media accounts

4. **Check Approvals**
   - Regularly review and revoke token approvals
   - Use tools like Revoke.cash

## Liquidity Lock

- Initial liquidity will be locked for 12 months
- Lock will be verified on-chain
- Lock details will be published in documentation

## Team Tokens

- Team tokens subject to 12-month cliff
- 24-month vesting period
- Vesting contract address will be published

## Regular Security Updates

We commit to:
- Monthly security reviews
- Quarterly external audits
- Immediate response to critical issues
- Transparent communication about security matters
