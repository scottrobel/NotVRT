const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("StakeVRT contract test", function () {
  async function deployContracts() {
    const [owner, user] = await ethers.getSigners();

    // Deploy Rsnack token contract.
    const Rsnack = await ethers.getContractFactory("Rsnacks");
    const RsnackContract = await Rsnack.deploy();
    const RsnackContractAddress = RsnackContract.address;

    // Deploy VRT token contract.
    const VRT = await ethers.getContractFactory("VRT");
    const VRTContract = await VRT.deploy();
    const VRTContractAddress = VRTContract.address;

    // Deploy StakeVRT contract.
    const StakeVRT = await ethers.getContractFactory("StakeVRT");
    const StakeVRTContract = await StakeVRT.deploy(
      VRTContractAddress,
      RsnackContractAddress
    );

    // Returns VRT and StakeVRT contracts.
    return { VRTContract, StakeVRTContract };
  }

  it("Staking function test", async function () {
    const [owner, user] = await ethers.getSigners();
    const { VRTContract, StakeVRTContract } = await loadFixture(
      deployContracts
    );

    const StakeVRTContractAddress = StakeVRTContract.address;

    console.log("Transfer 1000 VRTs to user.");
    await VRTContract.connect(owner).transfer(user.address, 10000000000);
    // Check user's VRT balance after transfer.
    expect(await VRTContract.balanceOf(user.address)).to.equal(10000000000);

    // Check VRT balance of staking contract before staking.
    let stakeContractVRTBalance = await VRTContract.balanceOf(
      StakeVRTContractAddress
    );
    console.log(
      "StakeVRT contract's VRT balance before staking: ",
      stakeContractVRTBalance.toString()
      );
      expect(stakeContractVRTBalance).to.be.equal(0);
      
    
    await VRTContract.connect(user).approve(StakeVRTContractAddress, 10000000000);
    console.log("Stake 100 VRT tokens for 1 month.");
    let tx = await StakeVRTContract.connect(user).deposit(10000000000, 86400 * 30 *12);

    // Check VRT balance of staking contract after staking.
    stakeContractVRTBalance = await VRTContract.balanceOf(
      StakeVRTContractAddress
    );
    console.log(
      "StakeVRT contract's VRT balance after staking: ",
      stakeContractVRTBalance.toString()
    );
    expect(stakeContractVRTBalance).to.be.equal(10000000000);

    let rewardAmount = await StakeVRTContract.viewRewards(user.address);
    console.log(rewardAmount);

    await time.increase(86400 * 30 * 6);
    rewardAmount = await StakeVRTContract.viewRewards(user.address);
    console.log((ethers.utils.formatEther(rewardAmount)));

    // Trying to claim rewards after some 15 days.
    // await time.increase(86400 * 15);
    // tx = await StakeVRTContract.connect(user).claimRewards(user.address);
  });
});
