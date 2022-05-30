// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./POPSToken.sol";

// MasterChef is the master of Pops. He can make Pops and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a governance smart contract once POPS is sufficiently
// distributed and the community can show to govern itself.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // Info of each user.
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of POPSs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accPopsPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accPopsPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }
    // Info of each pool.
    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. POPSs to distribute per block.
        uint256 lastRewardBlock; // Last block number that POPSs distribution occurs.
        uint256 accPopsPerShare; // Accumulated POPSs per share, times 1e12. See below.
    }
    // The POPS TOKEN!
    POPSToken public pops;
    // Block number when bonus POPS period ends.
    uint256 public bonusEndBlock;
    // POPS tokens created per block.
    uint256 public popsPerBlock;
    // Bonus muliplier for early pops makers.
    uint256 public constant BONUS_MULTIPLIER = 10;
    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Indicates if a pool was added
    mapping(address => bool) public existingPools;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when POPS mining starts.
    uint256 public startBlock;
    // The block number when POPS mining ends.
    uint256 public endBlock;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event AddPool(uint256 _pid, uint256 _allocPoint, address indexed _lptoken);
    event UpdateAlloc(uint256 _pid, uint256 allocPoint, bool _withUpdate);

    constructor(
        POPSToken _pops,
        uint256 _popsPerBlock,
        uint256 _startBlock,
        uint256 _endBlock,
        uint256 _bonusEndBlock
    ) public {
        require(_bonusEndBlock <= _endBlock, "MasterChef: _bonusEndBlock > _endBlock");
        pops = _pops;
        popsPerBlock = _popsPerBlock;
        bonusEndBlock = _bonusEndBlock;
        startBlock = _startBlock;
        endBlock = _endBlock;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool. Can only be called by the owner.
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) external onlyOwner {
        require(endBlock > block.number, "MasterChef: Mining ended");
        require(existingPools[address(_lpToken)] != true, "MasterChef: LP already added");
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
            block.number > startBlock ? block.number : startBlock;
        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accPopsPerShare: 0
            })
        );
        existingPools[address(_lpToken)] = true;
        emit AddPool(poolInfo.length - 1, _allocPoint, address(_lpToken));
    }

    // Update the given pool's POPS allocation point. Can only be called by the owner.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        require(endBlock > block.number, "MasterChef: Mining ended");
        require(_pid < poolInfo.length, "invalid _pid");
        if (_withUpdate) {
            massUpdatePools();
        }
        totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
            _allocPoint
        );
        poolInfo[_pid].allocPoint = _allocPoint;
        emit UpdateAlloc(_pid, _allocPoint, _withUpdate);
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to)
        public
        view
        returns (uint256)
    {
        // set range to not exceed endBlock
        if (_from > endBlock) return 0;
        _to = _to > endBlock ? endBlock : _to;

        if (_to <= bonusEndBlock) {
            // from and to within bonus period
            return _to.sub(_from).mul(BONUS_MULTIPLIER);
        } else if (_from >= bonusEndBlock) {
            // past bonus period
            return _to.sub(_from);
        } else {
            return
                // from less than bonus period to past end of bonus period
                bonusEndBlock.sub(_from).mul(BONUS_MULTIPLIER).add(
                    _to.sub(bonusEndBlock)
                );
        }
    }

    // View function to see pending POPSs on frontend.
    function pendingPops(uint256 _pid, address _user)
        external
        view
        returns (uint256)
    {
        require(_pid < poolInfo.length, "invalid _pid");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accPopsPerShare = pool.accPopsPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0
            && pool.lastRewardBlock < endBlock) {
            uint256 multiplier = 
                getMultiplier(pool.lastRewardBlock, block.number);
            uint256 popsReward =
                multiplier.mul(popsPerBlock).mul(pool.allocPoint).div(
                    totalAllocPoint
                );
            accPopsPerShare = accPopsPerShare.add(
                popsReward.mul(1e12).div(lpSupply)
            );
        }
        return user.amount.mul(accPopsPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        require(_pid < poolInfo.length, "invalid _pid");
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock || pool.lastRewardBlock >= endBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 popsReward =
            multiplier.mul(popsPerBlock).mul(pool.allocPoint).div(
                totalAllocPoint
            );
        pops.mint(address(this), popsReward);
        pool.accPopsPerShare = pool.accPopsPerShare.add(
            popsReward.mul(1e12).div(lpSupply)
        );
        pool.lastRewardBlock = block.number > endBlock ? endBlock : block.number;
    }

    // Deposit LP tokens to MasterChef for POPS allocation.
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant {
        require(endBlock > block.number, "MasterChef: Mining ended");
        require(_pid < poolInfo.length, "invalid _pid");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending =
                user.amount.mul(pool.accPopsPerShare).div(1e12).sub(
                    user.rewardDebt
                );
            safePopsTransfer(msg.sender, pending);
        }
        if (_amount > 0) {
            // modified to handle fee on transfer tokens
            uint256 before = pool.lpToken.balanceOf(address(this));
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            _amount = pool.lpToken.balanceOf(address(this)).sub(before);
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accPopsPerShare).div(1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        require(_pid < poolInfo.length, "invalid _pid");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        uint256 pending =
            user.amount.mul(pool.accPopsPerShare).div(1e12).sub(
                user.rewardDebt
            );
        safePopsTransfer(msg.sender, pending);
        user.amount = user.amount.sub(_amount);
        user.rewardDebt = user.amount.mul(pool.accPopsPerShare).div(1e12);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw(uint256 _pid) nonReentrant external {
        require(_pid < poolInfo.length, "invalid _pid");
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        uint256 amount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        emit EmergencyWithdraw(msg.sender, _pid, amount);
        pool.lpToken.safeTransfer(address(msg.sender), amount);
    }

    // Safe pops transfer function, just in case if rounding error causes pool to not have enough POPSs.
    function safePopsTransfer(address _to, uint256 _amount) internal {
        uint256 popsBal = pops.balanceOf(address(this));
        if (_amount > popsBal) {
            pops.transfer(_to, popsBal);
        } else {
            pops.transfer(_to, _amount);
        }
    }
}
