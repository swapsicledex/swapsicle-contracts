const { deployments, ethers } = require("hardhat");

//npx hardhat run scripts\deployPools.js --network avalanche

async function main() {
  const masterChefAddress = "0xcbd879DAA863f3D9F6520CA8d00343b901EE725c";
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

  const [deployer] = await ethers.getSigners();
  console.log("deploy by acct: " + deployer.address);

  const bal = await deployer.getBalance();
  console.log("bal: " + bal);

  const MasterChef = await ethers.getContractFactory("MasterChef");
  const masterChef = await MasterChef.attach(masterChefAddress);
  await masterChef.deployed();
  console.log("MasterChef:", masterChef.address);

  console.log("Adding POPS/AVAX pool. pid 0");
  //await(await masterChef.add(popsAvaxBP, popsAvax, true)).wait();
  console.log("Adding POPS/MIM pool. pid 1");
  //await(await masterChef.add(popsMimBP, popsMim, true)).wait();
  console.log("Adding WAVAX/USDC pool. pid 2");
  //await(await masterChef.add(wavaxUsdcBP, wavaxUsdc, true)).wait();
  console.log("Adding WAVAX/MIM pool. pid 3");
  await(await masterChef.add(wavaxMimBP, wavaxMim, true)).wait();
/*   console.log("Adding WBTC.e/WAVAX pool. pid 4");
  await(await masterChef.add(wbtceWavaxBP, wbtceWavax, true)).wait();
  console.log("Adding GRAPE/MIM pool. pid 5");
  await(await masterChef.add(grapeMimBP, grapeMim, true)).wait();
  console.log("Adding PEFI/MIM pool. pid 6");
  await(await masterChef.add(pefiMimBP, pefiMim, true)).wait();
 */  console.log("All pools added");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
