const SicleRouter = artifacts.require("SicleRouter02");

module.exports = async function (deployer) {
    const factoryAddress = "0x3BCa0B7431f46050a99Ec3B1B7BB710B3eFd30DD" //to be changed with the factory address
    const finalWrappedAddress = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
    await deployer.deploy(SicleRouter, factoryAddress, finalWrappedAddress);
};