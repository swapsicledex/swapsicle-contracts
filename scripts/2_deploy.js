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
  const sicleFactoryAddress = "0x9C60C867cE07a3c403E2598388673C10259EC768";
  // SET POPSToken ADDRESS
  const popsTokenAddress = "0x240248628B7B6850352764C5dFa50D1592A033A8";

  //verification
  const verify = true;
  const sicleRouterAddress = "0xC7f372c62238f6a5b79136A9e5D16A2FD7A3f0F5";
  const popsBarAddress = "0x5108176bC1B7e72440e6B48862c51d7eB0AEd5c4";
  const iceCreamVanAddress = "0x8F0d1e091aC53A2C4143C1ecC1067F7E337680D3";

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
  const popsToken = await POPSToken.attach(popsTokenAddress);
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

  console.log("verifying POPSBar");
  await run("verify:verify", {
    address: popsBar.address,
    contract: "contracts/POPSBar.sol:POPSBar",
    constructorArguments: [popsToken.address]
  });   */

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
