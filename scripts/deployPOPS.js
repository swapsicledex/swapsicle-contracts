const { deployments, ethers } = require("hardhat");

//npx hardhat run scripts\deployPOPS.js --network avalanche

async function main() {
  const INITIAL_MINT = ethers.utils.parseEther("79501600");
  const tokenName = "POPSToken"; //POPSToken
  const tokenSymbol = "POPS"; //POPS

  //verification
  const verify = true;
  const popsTokenAddress = "0x240248628B7B6850352764C5dFa50D1592A033A8";

  const [deployer] = await ethers.getSigners();
  console.log("deploy by acct: " + deployer.address);

  const bal = await deployer.getBalance();
  console.log("bal: " + bal);

  //POPSToken
  const POPSToken = await ethers.getContractFactory("POPSToken");
  const popsToken = verify
    ? await POPSToken.attach(popsTokenAddress)
    : await POPSToken.deploy(tokenName, tokenSymbol, INITIAL_MINT);
  await popsToken.deployed();
  console.log("POPSToken:", popsToken.address);

  if (!verify) return;

  console.log("verifying POPSToken");
  await run("verify:verify", {
    address: popsToken.address,
    contract: "contracts/POPSToken.sol:POPSToken",
    constructorArguments: [tokenName, tokenSymbol, INITIAL_MINT]
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
