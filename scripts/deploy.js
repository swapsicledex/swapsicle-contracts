const { deployments, ethers } = require("hardhat");

//npx hardhat run scripts\deploy.js --network avalanche

async function main() {
  const weth = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
  const INITIAL_MINT = ethers.utils.parseEther("10000000");
  const TOKENS_PER_BLOCK = ethers.utils.parseEther("1.3");
  const feeAddress = "0xe14972e38d81791085C0651aabc201D654E723b6";
  const START_BLOCK = 100000;
  const END_BLOCK = START_BLOCK + 15768000;
  const tokenName = "PToken";
  const tokenSymbol = "PT";
  var verify = false;
  var sicleFactoryAddress = "";
  var sicleRouterAddress = "";
  var popTokenAddress = "";
  var popsBarAddress = "";
  var iceCreamVanAddress = "";
  var masterChefAddress = "";

  const [deployer] = await ethers.getSigners();
  console.log("deploy by acct: " + deployer.address);

  const bal = await deployer.getBalance();
  console.log("bal: " + bal);

  const SicleFactory = await ethers.getContractFactory("SicleFactory");
  const sicleFactory = verify
    ? await SicleFactory.attach(sicleFactoryAddress)
    : await SicleFactory.deploy(deployer.address);
  await sicleFactory.deployed();
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
    ? await POPSToken.attach(popTokenAddress)
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

  //MasterChef
  const MasterChef = await ethers.getContractFactory("MasterChef");
  const masterChef = verify
    ? await MasterChef.attach(masterChefAddress)
    : await MasterChef.deploy(
      popsToken.address,
      feeAddress,
      TOKENS_PER_BLOCK,
      START_BLOCK,
      END_BLOCK
    );
  await masterChef.deployed();
  console.log("MasterChef:", masterChef.address);

  //Transfer ownership of POPSToken to MasterChef
  if (!verify) {
    await popsToken.transferOwnership(masterChef.address);
    console.log("POPSToken ownership transferred to MasterChef");
  }

  if (!verify) return;

  console.log("verifying SicleFactory");
  await run("verify:verify", {
    address: sicleFactory.address,
    contract: "contracts/sicle/SicleFactory.sol:SicleFactory",
    constructorArguments: [deployer.address]
  });

  console.log("verifying SicleRouter02");
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
  });

  console.log("verifying POPSBar");
  await run("verify:verify", {
    address: popsBar.address,
    contract: "contracts/POPSBar.sol:POPSBar",
    constructorArguments: [popsToken.address]
  });

  console.log("verifying IceCreamVan");
  await run("verify:verify", {
    address: popsBar.address,
    contract: "contracts/IceCreamVan.sol:IceCreamVan",
    constructorArguments: [
      sicleFactory.address,
      popsBar.address,
      popsToken.address,
      weth
    ]
  });

  console.log("verifying MasterChef");
  await run("verify:verify", {
    address: masterChef.address,
    contract: "contracts/MasterChef.sol:MasterChef",
    constructorArguments: [
      popsToken.address,
      feeAddress,
      TOKENS_PER_BLOCK,
      START_BLOCK,
      END_BLOCK
    ]
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
