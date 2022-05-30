const { deployments, ethers } = require("hardhat");

//npx hardhat run scripts\2_deploy.js --network avalanche

//**** DEPLOY FACTORY AND UPDATE INIT CODE HASH ****// 
//**** IN /sicle/libraries/SicleLibrary.sol LN26. ****//
//**** HASH IS RETRIEVED FROM DEPLOYED FACTORY IN ****//
//**** VALUE pairCodeHash ON SNOWTRACE ****/

//**** SET sicleFactoryAddress BEFORE RUNNING ****/

async function main() {
  const weth = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"; //WAVAX
  const INITIAL_MINT = ethers.utils.parseEther("79501600");
  const tokenName = "PToken"; //POPSToken
  const tokenSymbol = "PT"; //POPS
  const feeTo = "0x58334Ad2C84619bC1F9C61372FcA6D5EB787De64";
  // SET FACTORY ADDRESS
  const sicleFactoryAddress = "0xA22FFF80baEF689976C55dabb193becdf023B6B9";

  //verification
  const verify = true;
  const sicleRouterAddress = "0xb7fee4Ed4D9dfe60EFd7ea164315d89FcF0Cd9a8";
  const popsTokenAddress = "0x5F05bB272624bcD1b89A2B3Ae9A01645D1369aE9";
  const popsBarAddress = "0xE061D30E6Bb4F074309a644a4a00453F062e7CD3";
  const iceCreamVanAddress = "0x837BD84F122EB1A1De6a9c424FDC8A23Bb38e59A";

  const [deployer] = await ethers.getSigners();
  console.log("deploy by acct: " + deployer.address);

  const bal = await deployer.getBalance();
  console.log("bal: " + bal);

  const SicleFactory = await ethers.getContractFactory("SicleFactory");
  const sicleFactory = await SicleFactory.attach(sicleFactoryAddress);
  console.log("SicleFactory:", sicleFactory.address);

  const SicleRouter = await ethers.getContractFactory("SicleRouter02");
  const sicleRouter = verify
    ? await SicleRouter.attach(sicleRouterAddress)
    : await SicleRouter.deploy(sicleFactory.address, weth);
  await sicleRouter.deployed();
  console.log("SicleRouter:", sicleRouter.address);

  //POPSToken
  const POPSToken = await ethers.getContractFactory("POPSToken");
  const popsToken = verify
    ? await POPSToken.attach(popsTokenAddress)
    : await POPSToken.deploy(tokenName, tokenSymbol, INITIAL_MINT);
  await popsToken.deployed();
  console.log("POPSToken:", popsToken.address);

  //POPSBar
  const POPSBar = await ethers.getContractFactory("POPSBar");
  const popsBar = verify
    ? await POPSBar.attach(popsBarAddress)
    : await POPSBar.deploy(popsToken.address);
  await popsBar.deployed();
  console.log("POPSBar:", popsBar.address);

  //IceCreamVan
  const IceCreamVan = await ethers.getContractFactory("IceCreamVan");
  const iceCreamVan = verify
    ? await IceCreamVan.attach(iceCreamVanAddress)
    : await IceCreamVan.deploy(
      sicleFactory.address,
      popsBar.address,
      popsToken.address,
      weth
    );
  await iceCreamVan.deployed();
  console.log("IceCreamVan:", iceCreamVan.address);

  if (!verify) {
    await sicleFactory.setFeeTo(feeTo);
    console.log("Set feeTo:", feeTo);
  }
  if (!verify) {
    await sicleFactory.setFeeToStake(iceCreamVan.address);
    console.log("Set feeToStake:", iceCreamVan.address);
  }

  if (!verify) return;

/*   console.log("verifying SicleRouter02");
  await run("verify:verify", {
    address: sicleRouter.address,
    contract: "contracts/sicle/SicleRouter02.sol:SicleRouter02",
    constructorArguments: [sicleFactory.address, weth]
  });

  console.log("verifying POPSToken");
  await run("verify:verify", {
    address: popsToken.address,
    contract: "contracts/POPSToken.sol:POPSToken",
    constructorArguments: [tokenName, tokenSymbol, INITIAL_MINT]
  }); */

/*   console.log("verifying POPSBar");
  await run("verify:verify", {
    address: popsBar.address,
    contract: "contracts/POPSBar.sol:POPSBar",
    constructorArguments: [popsToken.address]
  });  */

  console.log("verifying IceCreamVan");
  await run("verify:verify", {
    address: iceCreamVan.address,
    contract: "contracts/IceCreamVan.sol:IceCreamVan",
    constructorArguments: [
      sicleFactory.address,
      popsBar.address,
      popsToken.address,
      weth
    ]
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
