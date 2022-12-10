// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

interface IRsnacks {
    function mint(address to, uint256 amount) external;
}

contract StakeVRT is Ownable, ReentrancyGuard {
    struct Stake {
        uint256 amount;
        uint256 time;
        uint256 score;
        uint256 lastClaim;
        uint256 unlockTimestamp;
    }

    uint256 public scoreFactor;
    uint256 public rewardFactor;

    uint256 public constant MONTH = 30 days;
    uint256 public constant YEAR = 365 days;

    uint256 userScoreDivisor = 1e15;
    uint256 perSecondDivisor = 1e5;

    address public immutable snacks;
    IRsnacks immutable iSnacks;

    address public immutable vrt;
    IERC20 immutable iVrt;

    mapping(address => Stake) private stakes;

    event Deposit(address user, uint256 amount, uint256 period, uint256 startTime);
    event Withdraw(address user, uint256 amount, uint256 timestamp);
    event ClaimRewards(address user, uint256 amount, uint256 timestamp);
    event SetUserScoreDivisor(uint256 userScoreDivisor, uint256 timestamp);
    event SetPerSecondDivisor(uint256 perSecondDivisor, uint256 timestamp);

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
    */
    function deposit(uint256 depositAmount, uint256 depositTime) external nonReentrant {
        require(depositTime <= YEAR, "1");
        
        if(depositAmount > 0) {
            iVrt.transferFrom(msg.sender, address(this), depositAmount);
        }

        Stake storage userStake = stakes[msg.sender];

        uint256 maxExtension = block.timestamp + YEAR - userStake.unlockTimestamp;
        uint256 time = depositTime > maxExtension ? maxExtension : depositTime;

        if(userStake.lastClaim == 0) { //Initial stake logic
            require(time >= MONTH, "1"); // Minimum stake time is 1 month.
            stakes[msg.sender].lastClaim = block.timestamp;
            stakes[msg.sender].unlockTimestamp = block.timestamp + time; // Initializes stake to now, increases it 
            stakes[msg.sender].amount = depositAmount;
            stakes[msg.sender].time == time;
        } else{
            stakes[msg.sender].unlockTimestamp += time;
            stakes[msg.sender].amount = (userStake.amount + depositAmount);
            stakes[msg.sender].time += time;
        }
        // Recalculate user's score after their stake has been modified
        stakes[msg.sender].score = stakes[msg.sender].amount * stakes[msg.sender].time / userScoreDivisor;

        emit Deposit(msg.sender, depositAmount, depositTime, block.timestamp);
    }

    function withdraw() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "2");
        require(userStake.unlockTimestamp < block.timestamp, "5");
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        iVrt.transfer(msg.sender, userStake.amount);
        iSnacks.mint(msg.sender, rewardAmount);
        emit Withdraw(msg.sender, stakes[msg.sender].amount, block.timestamp);
        delete(stakes[msg.sender]);
    }

    function claimRewards(address user) external nonReentrant {
        Stake storage userStake = stakes[user];
        require(userStake.amount > 0, "2");
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        stakes[user].lastClaim = block.timestamp;
        iSnacks.mint(user, rewardAmount);
        emit ClaimRewards(user, rewardAmount, block.timestamp);
    }

    // Emergency Functions
    function withdrawETH() external onlyOwner {
        address payable to = payable(msg.sender);
        to.transfer(address(this).balance);
    }

    function withdrawToken(address token) external onlyOwner {
        IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
    }

    function viewRewards(address user) external view returns (uint256) {
        Stake storage userStake = stakes[user];
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        return rewardAmount;
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
