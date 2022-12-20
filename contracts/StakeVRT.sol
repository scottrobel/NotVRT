// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IRsnacks {
    function mint(address to, uint256 amount) external;
    function burnFrom(address account, uint256 amount) external;
}

contract StakeVRT is Ownable, ReentrancyGuard {
    struct Stake {
        uint256 amount;
        uint256 totalStakeTime;
        uint256 score;
        uint256 lastClaim;
        uint256 unlockTimestamp;
    }

    uint256 public constant MONTH = 30 days;
    uint256 public constant YEAR = 365 days;

    uint256 userScoreDivisor = 1e15;
    uint256 perSecondDivisor = 1e5;

    address public immutable snacks;
    address public immutable vrt;
    IRsnacks immutable iSnacks;
    IERC20 immutable iVrt;

    mapping(address => Stake) private stakes;

    event Deposit(address user, uint256 amount, uint256 period, uint256 rewardAmount, uint256 startTime);
    event Withdraw(address user, uint256 amount, uint256 rewardAmount, uint256 timestamp);
    event ClaimRewards(address user, uint256 amount, uint256 timestamp);
    event WithdrawToken(address user, address token, uint256 timestamp);
    event SetUserScoreDivisor(uint256 userScoreDivisor, uint256 timestamp);
    event SetPerSecondDivisor(uint256 perSecondDivisor, uint256 timestamp);
    event Redeem(address user, uint256 amount, uint256 rewardId, uint256 timestamp);

    constructor(address _vrt, address _rSnacks) {
        snacks = _rSnacks;
        iSnacks = IRsnacks(snacks);
        vrt = _vrt;
        iVrt = IERC20(vrt);
    }

    /**
    * @notice The main staking function.
    * @param depositAmount The amount to stake.
    * @param depositTime The period to stake.
    * Users may stake repeatedly, adding more tokens and/or more time to their stake.
    * (Up to a max of 1 year from block.timestamp)

    * Note: Reward calculation logic is replicated inline for gas optimization
    */
    function deposit(uint256 depositAmount, uint256 depositTime) external nonReentrant {
        require(depositTime <= YEAR, "1");
        Stake storage userStake = stakes[msg.sender];
        uint256 maxExtension = block.timestamp + YEAR - userStake.unlockTimestamp;
        uint256 stakeTimeIncrease = depositTime > maxExtension ? maxExtension : depositTime;
        // Reward calculation logic
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 pendingReward = userStake.score * elapsedSeconds / perSecondDivisor;
        // End Reward calculation logic
        if(userStake.lastClaim == 0) { //Initial stake logic
            require(stakeTimeIncrease >= MONTH, "1"); // Minimum stake time is 1 month.
            userStake.lastClaim = block.timestamp;
            userStake.unlockTimestamp = block.timestamp + stakeTimeIncrease; // Initializes stake to now, increases it 
            userStake.amount = depositAmount;
            userStake.totalStakeTime = stakeTimeIncrease;
        } else{
            userStake.unlockTimestamp += stakeTimeIncrease;
            userStake.amount += depositAmount;
            userStake.totalStakeTime += stakeTimeIncrease;
            userStake.lastClaim = block.timestamp;
            iSnacks.mint(msg.sender, pendingReward);
        }
        userStake.score = userStake.amount * userStake.totalStakeTime / userScoreDivisor;
        if(depositAmount > 0){
            iVrt.transferFrom(msg.sender, address(this), depositAmount);
        }
        emit Deposit(msg.sender, userStake.amount, userStake.totalStakeTime, pendingReward, block.timestamp);
    }

    function withdraw() external nonReentrant {
        // Reward calculation logic
        Stake storage userStake = stakes[msg.sender];
        require(userStake.unlockTimestamp < block.timestamp, "5");
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        iVrt.transfer(msg.sender, userStake.amount);
        iSnacks.mint(msg.sender, rewardAmount);
        // End Reward calculation logic
        emit Withdraw(msg.sender, userStake.amount, rewardAmount, block.timestamp);
        delete(stakes[msg.sender]);
    }

    function claimRewards(address user) external nonReentrant {
        // Reward calculation logic
        Stake storage userStake = stakes[user];
        require(userStake.amount > 0, "2");
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        // End Reward calculation logic
        userStake.lastClaim = block.timestamp;
        iSnacks.mint(user, rewardAmount);
        emit ClaimRewards(user, rewardAmount, block.timestamp);
    }

    function withdrawETH() external onlyOwner {
        address payable to = payable(msg.sender);
        to.transfer(address(this).balance);
    }

    function withdrawToken(address token) external onlyOwner {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

    function redeemReward(uint256 rewardId, uint256 amount) external {
        iSnacks.burnFrom(msg.sender, amount);
        emit Redeem(msg.sender, amount, rewardId, block.timestamp);
    }

    function viewRewards(address user) external view returns (uint256) {
        // Reward calculation logic
        Stake storage userStake = stakes[user];
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        // End Reward calculation logic
        return rewardAmount;
    }

    function getStake(address user) 
        external 
        view 
        returns (
            uint256, 
            uint256, 
            uint256, 
            uint256, 
            uint256
        ) 
    {
        Stake storage userStake = stakes[user];
        return (
            userStake.amount, 
            userStake.totalStakeTime, 
            userStake.score, 
            userStake.lastClaim, 
            userStake.unlockTimestamp
        );
    }
    
    /**
    * @notice The userScoreDivisor can be set by only owner.
    * @param newUserScoreDivisor The score factor variable to set.
    */
    function setUserScoreDivisor(uint256 newUserScoreDivisor) public onlyOwner {
        require(newUserScoreDivisor > 0, "3");
        userScoreDivisor = newUserScoreDivisor;
        emit SetUserScoreDivisor(newUserScoreDivisor, block.timestamp);
    }
    
    /**
    * @notice The perSecondDivisor can be set by only owner.
    * @param newPerSecondDivisor The perSecondDivisor variable to set.
    */
    function setPerSecondDivisor(uint256 newPerSecondDivisor) public onlyOwner {
        require(newPerSecondDivisor > 0, "4");
        perSecondDivisor = newPerSecondDivisor;
        emit SetPerSecondDivisor(newPerSecondDivisor, block.timestamp);
    }
}
