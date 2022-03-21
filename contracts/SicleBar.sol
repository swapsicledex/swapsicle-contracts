// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// SicleBar is the coolest bar in town. You come in with some Sicle, and leave with more! The longer you stay, the more Sicle you get.
//
// This contract handles swapping to and from xSicle, SicleSwap's staking token.
contract SicleBar is ERC20("SicleBar", "xSICLE"){
    using SafeMath for uint256;
    IERC20 public sicle;

    // Define the Sicle token contract
    constructor(IERC20 _sicle) public {
        sicle = _sicle;
    }

    // Enter the bar. Pay some SICLEs. Earn some shares.
    // Locks Sicle and mints xSicle
    function enter(uint256 _amount) public {
        // Gets the amount of Sicle locked in the contract
        uint256 totalSicle = sicle.balanceOf(address(this));
        // Gets the amount of xSicle in existence
        uint256 totalShares = totalSupply();
        // If no xSicle exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalSicle == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of xSicle the Sicle is worth. The ratio will change overtime, as xSicle is burned/minted and Sicle deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalSicle);
            _mint(msg.sender, what);
        }
        // Lock the Sicle in the contract
        sicle.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your SICLEs.
    // Unlocks the staked + gained Sicle and burns xSicle
    function leave(uint256 _share) public {
        // Gets the amount of xSicle in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Sicle the xSicle is worth
        uint256 what = _share.mul(sicle.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        sicle.transfer(msg.sender, what);
    }
}
