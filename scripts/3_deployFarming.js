const { deployments, ethers } = require("hardhat");

//npx hardhat run scripts\deployPools.js --network avalanche

/**** SET POPS TOKEN ADDRESS ****/
async function main() {
  const popsAvax = "0x7E454625e4bD0CFdC27e752B46bF35C6343D9A78";
  const popsAvaxBP = 40;
  const popsMim = "0xE4a519DAfA1E3d57e3a76Bae60Bb978730693066";
  const popsMimBP = 10;
  const wavaxUsdc = "0x7e028006ec8632bf009fa4BdD8F1E5a50124EFec";
  const wavaxUsdcBP = 10;
  const wavaxMim = "0x6d246C0493266596b0aC13cC2FfD6672e2D100Dc";
  const wavaxMimBP = 10;
  const wbtceWavax = "0xE2E7f5e7E6caef75Dff462e775c75A66214bb468";
  const wbtceWavaxBP = 10;
  const grapeMim = "0x9076C15D7b2297723ecEAC17419D506AE320CbF1";
  const grapeMimBP = 10;
  const pefiMim = "0x8502Ac9bfA0402Be3dAC2f5A8CdC955aa3a9808d";
  const pefiMimBP = 10;

  const TOKENS_PER_BLOCK = ethers.utils.parseEther("1.3");
  const START_BLOCK = 15434772;
  const END_BLOCK = START_BLOCK + 15768000;
  const BONUS_END_BLOCK = START_BLOCK;
  const popsTokenAddress = "0x240248628B7B6850352764C5dFa50D1592A033A8";

  //verification
  const verify = false;
  const masterChefAddress = "";

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
  //if (!verify) {
    const POPSToken = await ethers.getContractFactory("POPSToken");
    const popsToken = await POPSToken.attach(popsTokenAddress);
    await popsToken.transferOwnership(masterChef.address);
    console.log("POPSToken ownership transferred to MasterChef"); 

    console.log("Adding POPS/AVAX pool. pid 0");
    await(await masterChef.add(popsAvaxBP, popsAvax, true)).wait();
    console.log("Adding POPS/MIM pool. pid 1");
    await(await masterChef.add(popsMimBP, popsMim, true)).wait();
    console.log("Adding WAVAX/USDC pool. pid 2");
    await(await masterChef.add(wavaxUsdcBP, wavaxUsdc, true)).wait(); 
    console.log("Adding WAVAX/MIM pool. pid 3");
    await(await masterChef.add(wavaxMimBP, wavaxMim, true)).wait();
    console.log("Adding WBTC.e/WAVAX pool. pid 4");
    await(await masterChef.add(wbtceWavaxBP, wbtceWavax, true)).wait();
    console.log("Adding GRAPE/MIM pool. pid 5");
    await(await masterChef.add(grapeMimBP, grapeMim, true)).wait();
    console.log("Adding PEFI/MIM pool. pid 6");
    await(await masterChef.add(pefiMimBP, pefiMim, true)).wait(); 
    console.log("All pools added");
  //}

/*   console.log("verifying MasterChef");
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
  });   */
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
