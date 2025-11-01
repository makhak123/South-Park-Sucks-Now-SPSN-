const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("SPSN", () => {
  let SPSN
  let spsnToken
  let owner
  let marketing
  let liquidity
  let team
  let addr1
  let addr2

  const INITIAL_SUPPLY = ethers.utils.parseEther("1000000000") // 1 billion

  beforeEach(async () => {
    ;[owner, marketing, liquidity, team, addr1, addr2] = await ethers.getSigners()

    SPSN = await ethers.getContractFactory("SPSN")
    spsnToken = await SPSN.deploy(marketing.address, liquidity.address, team.address)
    await spsnToken.deployed()
  })

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await spsnToken.owner()).to.equal(owner.address)
    })

    it("Should assign the total supply to the owner", async () => {
      const ownerBalance = await spsnToken.balanceOf(owner.address)
      expect(await spsnToken.totalSupply()).to.equal(ownerBalance)
    })

    it("Should have correct name and symbol", async () => {
      expect(await spsnToken.name()).to.equal("South Park Sucks Now")
      expect(await spsnToken.symbol()).to.equal("SPSN")
    })

    it("Should have correct initial supply", async () => {
      expect(await spsnToken.totalSupply()).to.equal(INITIAL_SUPPLY)
    })

    it("Should set correct wallet addresses", async () => {
      expect(await spsnToken.marketingWallet()).to.equal(marketing.address)
      expect(await spsnToken.liquidityWallet()).to.equal(liquidity.address)
      expect(await spsnToken.teamWallet()).to.equal(team.address)
    })
  })

  describe("Trading Control", () => {
    it("Should not allow trading before enabled", async () => {
      await expect(spsnToken.connect(addr1).transfer(addr2.address, 100)).to.be.revertedWith("Trading not yet enabled")
    })

    it("Should allow owner to enable trading", async () => {
      await spsnToken.enableTrading()
      expect(await spsnToken.tradingEnabled()).to.equal(true)
    })

    it("Should not allow enabling trading twice", async () => {
      await spsnToken.enableTrading()
      await expect(spsnToken.enableTrading()).to.be.revertedWith("Trading already enabled")
    })
  })

  describe("Transfers", () => {
    beforeEach(async () => {
      await spsnToken.enableTrading()
      await spsnToken.transfer(addr1.address, ethers.utils.parseEther("10000"))
    })

    it("Should transfer tokens between accounts", async () => {
      const amount = ethers.utils.parseEther("100")
      await spsnToken.connect(addr1).transfer(addr2.address, amount)
      expect(await spsnToken.balanceOf(addr2.address)).to.be.gt(0)
    })

    it("Should fail if sender doesn't have enough tokens", async () => {
      const initialBalance = await spsnToken.balanceOf(addr1.address)
      await expect(spsnToken.connect(addr1).transfer(addr2.address, initialBalance.add(1))).to.be.reverted
    })

    it("Should respect max transaction limit", async () => {
      const maxTx = await spsnToken.MAX_TRANSACTION_AMOUNT()
      await expect(spsnToken.connect(addr1).transfer(addr2.address, maxTx.add(1))).to.be.revertedWith(
        "Transfer amount exceeds maximum",
      )
    })
  })

  describe("Fees", () => {
    it("Should allow owner to update buy fees", async () => {
      await spsnToken.updateBuyFees(50, 50, 50) // 0.5% each
      expect(await spsnToken.buyBurnFee()).to.equal(50)
      expect(await spsnToken.buyLiquidityFee()).to.equal(50)
      expect(await spsnToken.buyMarketingFee()).to.equal(50)
    })

    it("Should allow owner to update sell fees", async () => {
      await spsnToken.updateSellFees(100, 100, 100) // 1% each
      expect(await spsnToken.sellBurnFee()).to.equal(100)
      expect(await spsnToken.sellLiquidityFee()).to.equal(100)
      expect(await spsnToken.sellMarketingFee()).to.equal(100)
    })

    it("Should not allow buy fees over 10%", async () => {
      await expect(spsnToken.updateBuyFees(500, 500, 100)).to.be.revertedWith("Total buy fees cannot exceed 10%")
    })

    it("Should not allow sell fees over 15%", async () => {
      await expect(spsnToken.updateSellFees(600, 600, 400)).to.be.revertedWith("Total sell fees cannot exceed 15%")
    })
  })

  describe("Blacklist", () => {
    beforeEach(async () => {
      await spsnToken.enableTrading()
      await spsnToken.transfer(addr1.address, ethers.utils.parseEther("1000"))
    })

    it("Should allow owner to blacklist addresses", async () => {
      await spsnToken.updateBlacklist(addr1.address, true)
      expect(await spsnToken.isBlacklisted(addr1.address)).to.equal(true)
    })

    it("Should prevent blacklisted addresses from transferring", async () => {
      await spsnToken.updateBlacklist(addr1.address, true)
      await expect(spsnToken.connect(addr1).transfer(addr2.address, 100)).to.be.revertedWith("Blacklisted address")
    })
  })

  describe("Burn", () => {
    it("Should allow token burning", async () => {
      const burnAmount = ethers.utils.parseEther("1000")
      const initialSupply = await spsnToken.totalSupply()

      await spsnToken.burn(burnAmount)

      expect(await spsnToken.totalSupply()).to.equal(initialSupply.sub(burnAmount))
    })
  })

  describe("Pause", () => {
    it("Should allow owner to pause", async () => {
      await spsnToken.pause()
      expect(await spsnToken.paused()).to.equal(true)
    })

    it("Should prevent transfers when paused", async () => {
      await spsnToken.enableTrading()
      await spsnToken.pause()
      await expect(spsnToken.transfer(addr1.address, 100)).to.be.revertedWith("Pausable: paused")
    })

    it("Should allow owner to unpause", async () => {
      await spsnToken.pause()
      await spsnToken.unpause()
      expect(await spsnToken.paused()).to.equal(false)
    })
  })

  describe("Exclusions", () => {
    it("Should exclude owner from fees by default", async () => {
      expect(await spsnToken.isExcludedFromFees(owner.address)).to.equal(true)
    })

    it("Should allow owner to exclude addresses from fees", async () => {
      await spsnToken.excludeFromFees(addr1.address, true)
      expect(await spsnToken.isExcludedFromFees(addr1.address)).to.equal(true)
    })
  })
})
