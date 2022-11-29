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
    
    /**
     * @notice We usually require to know who are all the stakeholders.
     */
    address[] internal stakeholders;

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
    * @notice The score factor can be set by only owner.
    * @param _scoreFactor The score factor variable to set.
    */
    function setScoreFactor(uint256 _scoreFactor) public onlyOwner {
        scoreFactor = _scoreFactor;
    }
    
    /**
    * @notice The reward factor can be set by only owner.
    * @param _rewardFactor The reward factor variable to set.
    */
    function setRewardFactor(uint256 _rewardFactor) public onlyOwner {
        rewardFactor = _rewardFactor;
    }

    /**
    * @notice A method to check if an address is a stakeholder.
    * @param _address The address to verify.
    * @return bool, uint256 Whether the address is a stakeholder,
    * and if so its position in the stakeholders array.
    */
   function isStakeholder(address _address)
       public
       view
       returns(bool, uint256)
   {
       for (uint256 s = 0; s < stakeholders.length; s += 1){
           if (_address == stakeholders[s]) return (true, s);
       }
       return (false, 0);
   }

   /**
    * @notice A method to add a stakeholder.
    * @param _stakeholder The stakeholder to add.
    */
   function addStakeholder(address _stakeholder)
       public
   {
       (bool _isStakeholder, ) = isStakeholder(_stakeholder);
       if(!_isStakeholder) stakeholders.push(_stakeholder);
   }

   /**
    * @notice A method to remove a stakeholder.
    * @param _stakeholder The stakeholder to remove.
    */
   function removeStakeholder(address _stakeholder)
       public
   {
       (bool _isStakeholder, uint256 s) = isStakeholder(_stakeholder);
       if(_isStakeholder){
           stakeholders[s] = stakeholders[stakeholders.length - 1];
           stakeholders.pop();
       }
   }

    /**
    * @notice The main staking function.
    * @param _amount The amount to stake.
    * @param _period The period to stake.
    */
    function deposit(uint256 _amount, uint256 _period) external {
        require(_amount > 0, "Should be not zero");
        require(_amount <= iVrt.balanceOf(msg.sender), "Balance is not enough");
        require(_period >= minimumPeriod && _period <= maximumPeriod, "Invalid period");
        iVrt.transferFrom(msg.sender, address(this), _amount);

        Stake memory newStake = Stake(block.timestamp, block.timestamp + _period, _amount,_amount * _period / scoreFactor);

        stakes[msg.sender] = newStake;
        addStakeholder(msg.sender);
        emit Deposit(msg.sender, _amount, _period, block.timestamp);
    }

    function withdraw() external {
        (bool _isStakeholder, uint256 s) = isStakeholder(msg.sender);
        require(_isStakeholder, "Should be stakeholder to try withdraw");
        require(block.timestamp >= stakes[msg.sender].endTime, "You can't withdraw before end time");
        iVrt.transfer(msg.sender, stakes[msg.sender].amount);

        emit Withdraw(msg.sender, stakes[msg.sender].amount, block.timestamp);
        removeStakeholder(msg.sender);
        delete(stakes[msg.sender]);
    }

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
