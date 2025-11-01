import * as anchor from "@coral-xyz/anchor"
import type { Program } from "@coral-xyz/anchor"
import type { Spsn } from "../target/types/spsn"
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccount } from "@solana/spl-token"
import { assert } from "chai"
import { describe, before, it } from "mocha"

describe("SPSN Coin", () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Spsn as Program<Spsn>
  const authority = provider.wallet as anchor.Wallet

  let mint: Keypair
  let tokenConfig: PublicKey
  let authorityTokenAccount: PublicKey
  let marketingWallet: Keypair
  let liquidityWallet: Keypair
  let marketingTokenAccount: PublicKey
  let liquidityTokenAccount: PublicKey
  let userWallet: Keypair
  let userTokenAccount: PublicKey

  const TOTAL_SUPPLY = new anchor.BN(1_000_000_000_000_000_000) // 1 billion tokens with 9 decimals
  const BUY_FEE = 300 // 3%
  const SELL_FEE = 500 // 5%

  before(async () => {
    mint = Keypair.generate()
    marketingWallet = Keypair.generate()
    liquidityWallet = Keypair.generate()
    userWallet = Keypair.generate()
    ;[tokenConfig] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)

    // Airdrop SOL to test wallets
    await provider.connection.requestAirdrop(marketingWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    await provider.connection.requestAirdrop(liquidityWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
    await provider.connection.requestAirdrop(userWallet.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)

    // Wait for airdrops to confirm
    await new Promise((resolve) => setTimeout(resolve, 1000))
  })

  it("Initializes the SPSN token", async () => {
    authorityTokenAccount = await getAssociatedTokenAddress(mint.publicKey, authority.publicKey)

    marketingTokenAccount = await getAssociatedTokenAddress(mint.publicKey, marketingWallet.publicKey)

    liquidityTokenAccount = await getAssociatedTokenAddress(mint.publicKey, liquidityWallet.publicKey)

    await program.methods
      .initialize(TOTAL_SUPPLY, BUY_FEE, SELL_FEE)
      .accounts({
        authority: authority.publicKey,
        tokenConfig,
        mint: mint.publicKey,
        authorityTokenAccount,
        marketingWallet: marketingWallet.publicKey,
        liquidityWallet: liquidityWallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([mint])
      .rpc()

    const config = await program.account.tokenConfig.fetch(tokenConfig)
    assert.equal(config.totalSupply.toString(), TOTAL_SUPPLY.toString())
    assert.equal(config.buyFeePercent, BUY_FEE)
    assert.equal(config.sellFeePercent, SELL_FEE)
    assert.equal(config.paused, false)
  })

  it("Transfers tokens with buy fee", async () => {
    userTokenAccount = await getAssociatedTokenAddress(mint.publicKey, userWallet.publicKey)

    // Create user token account
    await createAssociatedTokenAccount(provider.connection, authority.payer, mint.publicKey, userWallet.publicKey)

    // Create marketing and liquidity token accounts
    await createAssociatedTokenAccount(provider.connection, authority.payer, mint.publicKey, marketingWallet.publicKey)

    await createAssociatedTokenAccount(provider.connection, authority.payer, mint.publicKey, liquidityWallet.publicKey)

    const transferAmount = new anchor.BN(1_000_000_000_000) // 1000 tokens

    await program.methods
      .transferWithFee(transferAmount, true)
      .accounts({
        authority: authority.publicKey,
        tokenConfig,
        mint: mint.publicKey,
        from: authorityTokenAccount,
        to: userTokenAccount,
        marketingWallet: marketingTokenAccount,
        liquidityWallet: liquidityTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()

    const userBalance = await provider.connection.getTokenAccountBalance(userTokenAccount)
    const expectedAmount = transferAmount.mul(new anchor.BN(10000 - BUY_FEE)).div(new anchor.BN(10000))

    assert.equal(userBalance.value.amount, expectedAmount.toString())
  })

  it("Pauses and unpauses the token", async () => {
    await program.methods
      .pause()
      .accounts({
        authority: authority.publicKey,
        tokenConfig,
      })
      .rpc()

    let config = await program.account.tokenConfig.fetch(tokenConfig)
    assert.equal(config.paused, true)

    await program.methods
      .unpause()
      .accounts({
        authority: authority.publicKey,
        tokenConfig,
      })
      .rpc()

    config = await program.account.tokenConfig.fetch(tokenConfig)
    assert.equal(config.paused, false)
  })

  it("Updates fee percentages", async () => {
    const newBuyFee = 200 // 2%
    const newSellFee = 400 // 4%

    await program.methods
      .updateFees(newBuyFee, newSellFee)
      .accounts({
        authority: authority.publicKey,
        tokenConfig,
      })
      .rpc()

    const config = await program.account.tokenConfig.fetch(tokenConfig)
    assert.equal(config.buyFeePercent, newBuyFee)
    assert.equal(config.sellFeePercent, newSellFee)
  })
})
