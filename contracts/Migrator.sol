// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./sicle/interfaces/ISiclePair.sol";
import "./sicle/interfaces/ISicleFactory.sol";


contract Migrator {
    address public chef;
    address public oldFactory;
    ISicleFactory public factory;
    uint256 public notBeforeBlock;
    uint256 public desiredLiquidity = uint256(-1);

    event Migrate(ISiclePair orig);

    constructor(
        address _chef,
        address _oldFactory,
        ISicleFactory _factory,
        uint256 _notBeforeBlock
    ) public {
        require(_chef != address(0) && _oldFactory != address(0) && address(_factory) != address(0), "Migrator: zero address");
        chef = _chef;
        oldFactory = _oldFactory;
        factory = _factory;
        notBeforeBlock = _notBeforeBlock;
    }

    function migrate(ISiclePair orig) external returns (ISiclePair) {
        require(msg.sender == chef, "not from master chef");
        require(block.number >= notBeforeBlock, "too early to migrate");
        require(orig.factory() == oldFactory, "not from old factory");
        address token0 = orig.token0();
        address token1 = orig.token1();
        ISiclePair pair = ISiclePair(factory.getPair(token0, token1));
        if (pair == ISiclePair(address(0))) {
            pair = ISiclePair(factory.createPair(token0, token1));
        }
        uint256 lp = orig.balanceOf(msg.sender);
        if (lp == 0) return pair;
        desiredLiquidity = lp;
        orig.transferFrom(msg.sender, address(orig), lp);
        orig.burn(address(pair));
        pair.mint(msg.sender);
        desiredLiquidity = uint256(-1);
        emit Migrate(orig);
        return pair;
    }
}