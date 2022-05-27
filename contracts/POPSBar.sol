// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// POPSBar is the coolest bar in town. You come in with some POPS, and leave with more! The longer you stay, the more POPS you get.
//
// This contract handles swapping to and from sPOPS, POPSSwap's staking token.

//SushiBar
contract POPSBar is ERC20("sPOPS", "sPOPS"){
    using SafeMath for uint256;
    IERC20 public pops;

    // Define the POPS token contract
    constructor(IERC20 _pops) public {
        pops = _pops;
    }

    // Enter the bar. Pay some POPSs. Earn some shares.
    // Locks POPS and mints sPOPS
    function enter(uint256 _amount) external {
        // Gets the amount of POPS locked in the contract
        uint256 totalPOPS = pops.balanceOf(address(this));
        // Gets the amount of sPOPS in existence
        uint256 totalShares = totalSupply();
        // If no sPOPS exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalPOPS == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of sPOPS the POPS is worth. The ratio will change overtime, as sPOPS is burned/minted and POPS deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalPOPS);
            _mint(msg.sender, what);
        }
        // Lock the POPS in the contract
        pops.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the bar. Claim back your POPSs.
    // Unlocks the staked + gained POPS and burns sPOPS
    function leave(uint256 _share) external {
        // Gets the amount of sPOPS in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of POPS the sPOPS is worth
        uint256 what = _share.mul(pops.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        pops.transfer(msg.sender, what);
    }
}
