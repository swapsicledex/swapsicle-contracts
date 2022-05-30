const { deployments, ethers } = require("hardhat");

//npx hardhat run scripts\deployPools.js --network avalanche

/**** SET POPS TOKEN ADDRESS ****/
async function main() {
  const popsAvax = "0xa3d6be2CEdFA94d1679BEa118625044c16C1fe78";
  const popsAvaxBP = 40;
  const popsMim = "0x69850451A982da3d5E19d06aa992d5d9e8955E9E";
  const popsMimBP = 10;
  const wavaxUsdc = "0x3E76239Ce62637E411EE361122E4e5eDFacE1653";
  const wavaxUsdcBP = 10;
  const wavaxMim = "0xcDB6a8dB3431Fcd608C7Dee0126898c7d4654405";
  const wavaxMimBP = 10;
  const wbtceWavax = "";
  const wbtceWavaxBP = 10;
  const grapeMim = "";
  const grapeMimBP = 10;
  const pefiMim = "";
  const pefiMimBP = 10;

  const TOKENS_PER_BLOCK = ethers.utils.parseEther("1.3");
  const START_BLOCK = 15377232;
  const END_BLOCK = START_BLOCK + 15768000;
  const BONUS_END_BLOCK = START_BLOCK;
  const popsTokenAddress = "0x5F05bB272624bcD1b89A2B3Ae9A01645D1369aE9";

  //verification
  const verify = true;
  const masterChefAddress = "0xa2695f4F6c96f74dB00412D210413C1B94AF0D6f";

  const [deployer] = await ethers.getSigners();
  console.log("deploy by acct: " + deployer.address);

  const bal = await deployer.getBalance();
  console.log("bal: " + bal);

  //MasterChef
  const MasterChef = await ethers.getContractFactory("MasterChef");
  const masterChef = verify
    ? await MasterChef.attach(masterChefAddress)
    : await MasterChef.deploy(
      popsTokenAddress,
      TOKENS_PER_BLOCK,
      START_BLOCK,
      END_BLOCK,
      BONUS_END_BLOCK
    );
  await masterChef.deployed();
  console.log("MasterChef:", masterChef.address);

  //Transfer ownership of POPSToken to MasterChef
  if (!verify) {
    const POPSToken = await ethers.getContractFactory("POPSToken");
    const popsToken = await POPSToken.attach(popsTokenAddress);
    await popsToken.transferOwnership(masterChef.address);
    console.log("POPSToken ownership transferred to MasterChef");

/*     console.log("Adding POPS/AVAX pool. pid 0");
    await(await masterChef.add(popsAvaxBP, popsAvax, true)).wait();
    console.log("Adding POPS/MIM pool. pid 1");
    await(await masterChef.add(popsMimBP, popsMim, true)).wait();
    console.log("Adding WAVAX/USDC pool. pid 2");
    await(await masterChef.add(wavaxUsdcBP, wavaxUsdc, true)).wait(); */
  /*   console.log("Adding WAVAX/MIM pool. pid 3");
    await(await masterChef.add(wavaxMimBP, wavaxMim, true)).wait();
    console.log("Adding WBTC.e/WAVAX pool. pid 4");
    await(await masterChef.add(wbtceWavaxBP, wbtceWavax, true)).wait();
    console.log("Adding GRAPE/MIM pool. pid 5");
    await(await masterChef.add(grapeMimBP, grapeMim, true)).wait();
    console.log("Adding PEFI/MIM pool. pid 6");
    await(await masterChef.add(pefiMimBP, pefiMim, true)).wait(); */
    console.log("All pools added");
  }

  console.log("verifying MasterChef");
  await run("verify:verify", {
    address: masterChef.address,
    contract: "contracts/MasterChef.sol:MasterChef",
    constructorArguments: [
      popsTokenAddress,
      TOKENS_PER_BLOCK,
      START_BLOCK,
      END_BLOCK,
      BONUS_END_BLOCK
    ]
  });  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
