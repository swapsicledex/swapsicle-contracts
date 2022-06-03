const { BigNumber } = require("@ethersproject/bignumber");

const SicleMasterChef = artifacts.require("MasterChef");
const POPSToken = artifacts.require("POPSToken");
const IceCreamVan = artifacts.require("IceCreamVan");
const SicleBar = artifacts.require("SicleBar");

const INITIAL_MINT = '10000000';
const TOKENS_PER_BLOCK = '10';
const finalWrappedAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7";
const sicleFactory = "0x3BCa0B7431f46050a99Ec3B1B7BB710B3eFd30DD";
const feeAddress = "0xe14972e38d81791085C0651aabc201D654E723b6";
const START_BLOCK = 100000
const END_BLOCK = 110000

module.exports = async function(deployer, network, accounts) {

    let POPSTokenInstance;
    let SicleBarInstance;
    let IceCreamVanInstance;
    let SicleMasterChefInstance;

    deployer.deploy(POPSToken).then((instance)=> {
        POPSTokenInstance = instance;
        /**
         * Mint intial tokens for liquidity pool
         */
        return POPSTokenInstance.mint(BigNumber.from(INITIAL_MINT).mul(BigNumber.from(String(10**18))));
    }).then((tx) => {
        logTx(tx);
        /**
         * Deploy SicleBar
         */
        return deployer.deploy(SicleBar, POPSToken.address);
    }).then((instance)=> {
        SicleBarInstance = instance;
        /**
         * Deploy IceCreamVan
         */
        return deployer.deploy(IceCreamVan, sicleFactory, SicleBarInstance, POPSTokenInstance, finalWrappedAddress);
    }).then((instance)=> {
        IceCreamVanInstance = instance;
        /**
         * Deploy MasterChef
         * parameters =>
         * POPSToken _sicle,
         * address _devaddr,
         * uint256 _siclePerBlock,
         * uint256 _startBlock,
         * uint256 _bonusEndBlock
         */       
        return deployer.deploy(SicleMasterChef, POPSTokenInstance.address, feeAddress, TOKENS_PER_BLOCK, START_BLOCK, END_BLOCK);
    }).then((instance)=> {
        SicleMasterChefInstance = instance;
        /**
         * Transfer Ownership of POPSToken to MasterChef
         */
        return POPSTokenInstance.transferOwnership(SicleMasterChefInstance.address);
    }).then(()=>{
        console.table({
            SicleMasterChef:SicleMasterChefInstance.address,
            POPSToken:POPSTokenInstance.address,
            IceCreamVan:IceCreamVanInstance.address,
            SicleBar:SicleBarInstance.address
        })
    });
};
