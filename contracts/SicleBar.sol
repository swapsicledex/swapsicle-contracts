// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// SicleBar is the coolest bar in town. You come in with some Sicle, and leave with more! The longer you stay, the more Sicle you get.
//
// This contract handles swapping to and from sPOPS, SicleSwap's staking token.

contract SicleBar is ERC20("sPOPS", "sPOPS"){
    using SafeMath for uint256;
    IERC20 public pops;

    // Define the Sicle token contract
    constructor(IERC20 _pops) public {
        pops = _pops;
    }

    // Enter the bar. Pay some SICLEs. Earn some shares.
    // Locks Sicle and mints sPOPS
    function enter(uint256 _amount) external {
        // Gets the amount of Sicle locked in the contract
        uint256 totalSicle = pops.balanceOf(address(this));
        // Gets the amount of sPOPS in existence
        uint256 totalShares = totalSupply();
        // If no sPOPS exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSicle == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of sPOPS the Sicle is worth. The ratio will change overtime, as sPOPS is burned/minted and Sicle deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSicle);
            _mint(msg.sender, what);
        }
        // Lock the Sicle in the contract
        pops.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SICLEs.
    // Unlocks the staked + gained Sicle and burns sPOPS
    function leave(uint256 _share) external {
        // Gets the amount of sPOPS in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sicle the sPOPS is worth
        uint256 what = _share.mul(pops.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        pops.transfer(msg.sender, what);
    }
}
