const hre = require("hardhat")
const { ethers } = require("hardhat") // Import ethers

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS

  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS environment variable")
    process.exit(1)
  }

  console.log("Distributing SPSN tokens...")

  const [deployer] = await ethers.getSigners()
  const SPSN = await ethers.getContractAt("SPSN", contractAddress)

  const totalSupply = await SPSN.totalSupply()
  console.log("Total Supply:", ethers.utils.formatEther(totalSupply), "SPSN")

  // Distribution percentages
  const distributions = {
    liquidity: { percent: 40, address: process.env.LIQUIDITY_WALLET },
    community: { percent: 30, address: process.env.COMMUNITY_WALLET },
    team: { percent: 15, address: process.env.TEAM_WALLET },
    marketing: { percent: 10, address: process.env.MARKETING_WALLET },
  }

  console.log("\nDistribution Plan:")

  for (const [key, value] of Object.entries(distributions)) {
    const amount = totalSupply.mul(value.percent).div(100)
    console.log(`${key}: ${value.percent}% (${ethers.utils.formatEther(amount)} SPSN) -> ${value.address}`)

    if (value.address && value.address !== deployer.address) {
      const tx = await SPSN.transfer(value.address, amount)
      await tx.wait()
      console.log(`✅ Transferred to ${key} wallet`)
    }
  }

  // Burn 5% initial supply
  const burnAmount = totalSupply.mul(5).div(100)
  console.log(`\nBurning 5% (${ethers.utils.formatEther(burnAmount)} SPSN)...`)
  const burnTx = await SPSN.burn(burnAmount)
  await burnTx.wait()
  console.log("✅ Tokens burned")

  const remainingBalance = await SPSN.balanceOf(deployer.address)
  console.log("\nRemaining in deployer wallet:", ethers.utils.formatEther(remainingBalance), "SPSN")

  console.log("\n✅ Token distribution complete!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
