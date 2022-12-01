// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

import "./Rsnacks.sol";

interface IRsnacks {
    function mint(address to, uint256 amount) external;
}

contract StakeVRT is Ownable {
    struct Stake {
        uint256 amount;
        uint256 time;
        uint256 score;
        uint256 lastClaim;
    }

    uint256 public scoreFactor;
    uint256 public rewardFactor;

    uint256 public month = 30 days;
    uint256 public year = 365 days;

    uint256 userScoreDivisor = 1e15;
    uint256 perSecondDivisor = 1e5;

    address public snacks;
    IRsnacks iSnacks;

    address public vrt;
    IERC20 iVrt;

    mapping(address => Stake) private stakes;

    event Deposit(address user, uint256 amount, uint256 period, uint256 startTime);

    event Withdraw(address user, uint256 amount, uint256 withdrawTime);

    constructor(address _vrt, address _rSnacks) {
        snacks = _rSnacks;
        iSnacks = IRsnacks(snacks);

        vrt = _vrt;
        iVrt = IERC20(vrt);
    }

    /**
    * @notice The userScoreDivisor can be set by only owner.
    * @param _userScoreDivisor The score factor variable to set.
    */
    function setUserScoreDivisor(uint256 _userScoreDivisor) public onlyOwner {
        userScoreDivisor = _userScoreDivisor;
    }
    
    /**
    * @notice The perSecondDivisor can be set by only owner.
    * @param _perSecondDivisor The perSecondDivisor variable to set.
    */
    function setPerSecondDivisor(uint256 _perSecondDivisor) public onlyOwner {
        perSecondDivisor = _perSecondDivisor;
    }

    /**
    * @notice The main staking function.
    * @param _amount The amount to stake.
    * @param _time The period to stake.
    */
    function deposit(uint256 _amount, uint256 _time) external {
        require(_time >= month && _time <= year, "Staking time should be between a month to a year.");
        require(_amount > 0, "Staking amount can't be 0.");
        
        iVrt.transferFrom(msg.sender, address(this), _amount);

        Stake storage userStake = stakes[msg.sender];

        uint256 amount;
        uint256 time;
        if(userStake.amount != 0) {
            amount = userStake.amount + _amount;
            time = userStake.time + _time; 
        }

        uint256 stakingScore = amount * time / userScoreDivisor;

        stakes[msg.sender] = Stake(amount, time, stakingScore, userStake.lastClaim);

        emit Deposit(msg.sender, _amount, _time, block.timestamp);
    }

    function withdraw() external {
    }

    function viewRewards(address _user) external returns (uint256) {}

    function claimRewards(address _user) public {
        Stake storage userStake = stakes[_user];
        uint256 elapsedSeconds = block.timestamp - userStake.lastClaim;
        uint256 rewardAmount = userStake.score * elapsedSeconds / perSecondDivisor;
        stakes[_user].lastClaim = block.timestamp;
        iSnacks.mint(_user, rewardAmount);
    }

    // Emergency Functions
    function withdrawETH() external onlyOwner {
        address payable to = payable(msg.sender);
        to.transfer(address(this).balance);
    }

    function withdrawToken(address token) external onlyOwner {
        IERC20(token).transfer(
            msg.sender,
            IERC20(token).balanceOf(address(this))
        );
    }
}
