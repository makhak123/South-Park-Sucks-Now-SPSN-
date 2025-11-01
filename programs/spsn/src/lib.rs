use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer};

declare_id!("SPSNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");

#[program]
pub mod spsn {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        total_supply: u64,
        buy_fee_percent: u16,
        sell_fee_percent: u16,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        token_config.authority = ctx.accounts.authority.key();
        token_config.mint = ctx.accounts.mint.key();
        token_config.total_supply = total_supply;
        token_config.buy_fee_percent = buy_fee_percent;
        token_config.sell_fee_percent = sell_fee_percent;
        token_config.paused = false;
        token_config.marketing_wallet = ctx.accounts.marketing_wallet.key();
        token_config.liquidity_wallet = ctx.accounts.liquidity_wallet.key();
        token_config.max_transaction_amount = total_supply / 100; // 1% max transaction
        
        // Mint initial supply to authority
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.authority_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, total_supply)?;

        msg!("SPSN Token initialized with {} tokens", total_supply);
        Ok(())
    }

    pub fn transfer_with_fee(
        ctx: Context<TransferWithFee>,
        amount: u64,
        is_buy: bool,
    ) -> Result<()> {
        let token_config = &ctx.accounts.token_config;
        
        require!(!token_config.paused, ErrorCode::TokenPaused);
        require!(amount <= token_config.max_transaction_amount, ErrorCode::ExceedsMaxTransaction);

        let fee_percent = if is_buy {
            token_config.buy_fee_percent
        } else {
            token_config.sell_fee_percent
        };

        // Calculate fees
        let total_fee = (amount as u128)
            .checked_mul(fee_percent as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;
        
        let burn_amount = total_fee / 3; // 1/3 of fee burned
        let liquidity_amount = total_fee / 3; // 1/3 to liquidity
        let marketing_amount = total_fee - burn_amount - liquidity_amount; // Remaining to marketing
        let transfer_amount = amount - total_fee;

        // Transfer main amount
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, transfer_amount)?;

        // Burn tokens
        if burn_amount > 0 {
            let cpi_accounts = Burn {
                mint: ctx.accounts.mint.to_account_info(),
                from: ctx.accounts.from.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::burn(cpi_ctx, burn_amount)?;
        }

        // Transfer to liquidity wallet
        if liquidity_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.liquidity_wallet.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, liquidity_amount)?;
        }

        // Transfer to marketing wallet
        if marketing_amount > 0 {
            let cpi_accounts = Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.marketing_wallet.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
            token::transfer(cpi_ctx, marketing_amount)?;
        }

        msg!("Transfer completed: {} tokens (fee: {})", transfer_amount, total_fee);
        Ok(())
    }

    pub fn pause(ctx: Context<UpdateConfig>) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        token_config.paused = true;
        msg!("Token paused");
        Ok(())
    }

    pub fn unpause(ctx: Context<UpdateConfig>) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        token_config.paused = false;
        msg!("Token unpaused");
        Ok(())
    }

    pub fn update_fees(
        ctx: Context<UpdateConfig>,
        buy_fee_percent: u16,
        sell_fee_percent: u16,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        token_config.buy_fee_percent = buy_fee_percent;
        token_config.sell_fee_percent = sell_fee_percent;
        msg!("Fees updated: buy {}%, sell {}%", buy_fee_percent, sell_fee_percent);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + TokenConfig::LEN,
        seeds = [b"config"],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Marketing wallet address
    pub marketing_wallet: AccountInfo<'info>,
    
    /// CHECK: Liquidity wallet address
    pub liquidity_wallet: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferWithFee<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        seeds = [b"config"],
        bump,
        has_one = marketing_wallet,
        has_one = liquidity_wallet,
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub marketing_wallet: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub liquidity_wallet: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump,
        has_one = authority,
    )]
    pub token_config: Account<'info, TokenConfig>,
}

#[account]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_supply: u64,
    pub buy_fee_percent: u16,
    pub sell_fee_percent: u16,
    pub paused: bool,
    pub marketing_wallet: Pubkey,
    pub liquidity_wallet: Pubkey,
    pub max_transaction_amount: u64,
}

impl TokenConfig {
    pub const LEN: usize = 32 + 32 + 8 + 2 + 2 + 1 + 32 + 32 + 8;
}

#[error_code]
pub enum ErrorCode {
    #[msg("Token transfers are currently paused")]
    TokenPaused,
    #[msg("Transfer amount exceeds maximum transaction limit")]
    ExceedsMaxTransaction,
}
