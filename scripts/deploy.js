const hre = require("hardhat")
const ethers = require("ethers")

async function main() {
  console.log("Deploying SPSN Coin...")

  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Wallet addresses - REPLACE THESE WITH YOUR ACTUAL ADDRESSES
  const MARKETING_WALLET = process.env.MARKETING_WALLET || deployer.address
  const LIQUIDITY_WALLET = process.env.LIQUIDITY_WALLET || deployer.address
  const TEAM_WALLET = process.env.TEAM_WALLET || deployer.address

  console.log("\nWallet Configuration:")
  console.log("Marketing Wallet:", MARKETING_WALLET)
  console.log("Liquidity Wallet:", LIQUIDITY_WALLET)
  console.log("Team Wallet:", TEAM_WALLET)

  // Deploy the contract
  const SPSN = await ethers.getContractFactory("SPSN")
  const spsn = await SPSN.deploy(MARKETING_WALLET, LIQUIDITY_WALLET, TEAM_WALLET)

  await spsn.deployed()

  console.log("\n✅ SPSN Coin deployed to:", spsn.address)
  console.log("\nToken Details:")
  console.log("Name:", await spsn.name())
  console.log("Symbol:", await spsn.symbol())
  console.log("Total Supply:", ethers.utils.formatEther(await spsn.totalSupply()), "SPSN")
  console.log("Decimals:", await spsn.decimals())

  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...")
  await spsn.deployTransaction.wait(5)

  console.log("\n📝 Verify contract with:")
  console.log(
    `npx hardhat verify --network ${hre.network.name} ${spsn.address} "${MARKETING_WALLET}" "${LIQUIDITY_WALLET}" "${TEAM_WALLET}"`,
  )

  // Save deployment info
  const fs = require("fs")
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: spsn.address,
    deployer: deployer.address,
    marketingWallet: MARKETING_WALLET,
    liquidityWallet: LIQUIDITY_WALLET,
    teamWallet: TEAM_WALLET,
    timestamp: new Date().toISOString(),
  }

  fs.writeFileSync(`deployment-${hre.network.name}.json`, JSON.stringify(deploymentInfo, null, 2))

  console.log("\n✅ Deployment info saved to deployment-" + hre.network.name + ".json")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
