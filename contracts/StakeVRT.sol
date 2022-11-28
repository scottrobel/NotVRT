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

    address public snacks;
    IRsnacks iSnacks;

    address public vrt;
    IERC20 iVrt;

    mapping(address => Stake) private stakes;

    constructor(address _vrt, address _rSnacks) {
        snacks = _rSnacks;
        iSnacks = IRsnacks(snacks);

        vrt = _vrt;
        iVrt = IERC20(vrt);
    }

    function deposit(uint256 _amount) external {}

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
