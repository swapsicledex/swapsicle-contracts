// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//SushiToken w/o governance
contract POPSToken is ERC20, Ownable {

    constructor(string memory name, string memory symbol, uint256 amount) public ERC20(name, symbol) {
        _mint(_msgSender(), amount);
    }
    /// @notice Creates `_amount` token to `_to`. Must only be called by the owner (MasterChef).
    function mint(address _to, uint256 _amount) external onlyOwner {
        _mint(_to, _amount);
    }
}
