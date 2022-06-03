require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
//require("hardhat-gas-reporter");

const {
  METAMASK_PRIVATE_KEY_ACCT1,
  ROPSTEN_URL,
  RINKEBY_URL,
  ETH_URL,
  BSC_URL,
  POLY_URL,
  BSC_API_KEY,
  BSC_URL_TESTNET,
  MM_SS_DEPLOYER,
  AVALANCHE_API_KEY
} = process.env;
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    eth: {
      url: ETH_URL,
      accounts: [`0x${METAMASK_PRIVATE_KEY_ACCT1}`],
    },
    bsc: {
      url: BSC_URL,
      accounts: [`0x${METAMASK_PRIVATE_KEY_ACCT1}`],
    },
    poly: {
      url: POLY_URL,
      accounts: [`0x${METAMASK_PRIVATE_KEY_ACCT1}`],
      gasPrice: 50000000000,
    },
    ropsten: {
      url: ROPSTEN_URL,
      accounts: [`0x${METAMASK_PRIVATE_KEY_ACCT1}`],
    },
    rinkeby: {
      url: RINKEBY_URL,
      accounts: [`0x${METAMASK_PRIVATE_KEY_ACCT1}`],
    },
    bscTestnet: {
      url: BSC_URL_TESTNET,
      accounts: [`0x${METAMASK_PRIVATE_KEY_ACCT1}`],
    },
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      accounts: [MM_SS_DEPLOYER],
    },     
  },
  etherscan: {
    apiKey: {
      //eth: ETH_API_KEY,
      //bsc: BSC_API_KEY,
      //poly: POLY_API_KEY,
      //apiKey: ETH_API_KEY, //eth
      //rinkeby: ETH_API_KEY
      //bscTestnet: BSC_API_KEY,
      avalanche: AVALANCHE_API_KEY
    }
  }  
};
