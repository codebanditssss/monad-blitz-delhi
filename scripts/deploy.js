const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("----------------------------------------------------------------");
  console.log("🚀 Deploying MonadFighters with the account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log("----------------------------------------------------------------");

  const Factory = await hre.ethers.getContractFactory("MonadFighters");
  const contract = await Factory.deploy();

  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ MonadFighters deployed to:", addr);
  console.log("----------------------------------------------------------------");
  console.log("⚠️  SAVE THIS ADDRESS! You will need it for the frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
