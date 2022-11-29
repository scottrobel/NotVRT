// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRsnacks {
    function mint(address to, uint256 amount) external;
}

contract StakeVRT is Ownable {
    struct Stake {
        uint256 startTime;
        uint256 endTime;
        uint256 amount;
        uint256 score;
    }

    uint256 public scoreFactor;
    uint256 public rewardFactor;

    uint256 public minimumPeriod = 30 days;
    uint256 public maximumPeriod = 365 days;

    address public snacks;
    IRsnacks iSnacks;

    address public vrt;
    IERC20 iVrt;

    mapping(address => Stake) private stakes;

    event Deposit(address user, uint256 amount, uint256 period, uint256 startTime);

    constructor(address _vrt, address _rSnacks) {
        snacks = _rSnacks;
        iSnacks = IRsnacks(snacks);

        vrt = _vrt;
        iVrt = IERC20(vrt);
    }

    function setScoreFactor(uint256 _scoreFactor) public onlyOwner {
        scoreFactor = _scoreFactor;
    }
    
    function setRewardFactor(uint256 _rewardFactor) public onlyOwner {
        rewardFactor = _rewardFactor;
    }

    function deposit(uint256 _amount, uint256 _period) external {
        require(_amount > 0, "Should be not zero");
        require(_amount <= iVrt.balanceOf(msg.sender), "Balance is not enough");
        require(_period >= minimumPeriod && _period <= maximumPeriod, "Invalid period");
        iVrt.transferFrom(msg.sender, address(this), _amount);

        Stake memory newStake = Stake(block.timestamp, block.timestamp + _period, _amount,_amount * _period / scoreFactor);

        stakes[msg.sender] = newStake;
        emit Deposit(msg.sender, _amount, _period, block.timestamp);
    }

    function withdraw() external {}

    function viewRewards(address _user) external returns (uint256) {}

    function claimRewards() external {}

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
