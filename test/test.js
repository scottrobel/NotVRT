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
    const MINTER_ROLE = await RsnackContract.MINTER_ROLE();
    await RsnackContract.connect(owner).grantRole(MINTER_ROLE, StakeVRTContract.address);

    // Returns VRT and StakeVRT contracts.
    return { VRTContract, StakeVRTContract, RsnackContract };
  }

  it("Staking function test for Alice Bob", async function () {
    const [owner, user] = await ethers.getSigners();
    const { VRTContract, StakeVRTContract, RsnackContract } = await loadFixture(
      deployContracts
    );

    const StakeVRTContractAddress = StakeVRTContract.address;

    console.log("Transfer 10000000000 VRTs to user.");
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
    
    console.log("User stakes 0 VRT for 0s.");
    await expect(StakeVRTContract.connect(user).deposit(0, 0)).to.be.revertedWith("1");
    console.log("User stakes 0 vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(0, 1000000)).to.be.revertedWith("1");
    console.log("User stakes 1mm vrt for 0s.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 0)).to.be.revertedWith("1");
    console.log("User stakes 1mm vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");
    console.log("User stakes 1mm vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");
    console.log("User attempts withdraw.");
    await expect(StakeVRTContract.connect(user).withdraw()).to.emit(StakeVRTContract, "Withdraw").withArgs(user.address, 0, 0, time.latestBlock);

    await time.increase(1000);
    console.log("User claims rewards after 1000s.");
    await expect(StakeVRTContract.connect(user).claimRewards(user.address)).revertedWith("2");

    console.log("User stakes 0 VRT for 0s.");
    await expect(StakeVRTContract.connect(user).deposit(0, 0)).to.be.revertedWith("1");
    console.log("User stakes 0 vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(0, 1000000)).to.be.revertedWith("1");
    console.log("User stakes 1mm vrt for 0s.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 0)).to.be.revertedWith("1");
    console.log("User stakes 1mm vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");
    console.log("User stakes 1mm vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");

    await time.increase(1000000);
    console.log("User attempts withdraw after 1000000s.");
    await expect(StakeVRTContract.connect(user).withdraw()).to.emit(StakeVRTContract, "Withdraw").withArgs(user.address, 0, 0, time.latestBlock);

    // Check VRT balance of staking contract after staking.
    stakeContractVRTBalance = await VRTContract.balanceOf(
      StakeVRTContractAddress
    );
    console.log(
      "StakeVRT contract's VRT balance after staking: ",
      stakeContractVRTBalance.toString()
    );
    expect(stakeContractVRTBalance).to.be.equal(0);
  });

  it("Staking function test for Charlie", async function () {
    const [owner, user] = await ethers.getSigners();
    const { VRTContract, StakeVRTContract, RsnackContract } = await loadFixture(
      deployContracts
    );

    const StakeVRTContractAddress = StakeVRTContract.address;

    console.log("Transfer 10000000000 VRTs to user.");
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
    
    console.log("User stakes 0 VRT for 1 year + 1s.");
    await expect(StakeVRTContract.connect(user).deposit(0, 86400*365 + 1)).to.be.revertedWith("1");
    console.log("User stakes 0 vrt for 0s.");
    await expect(StakeVRTContract.connect(user).deposit(0, 0)).to.be.revertedWith("1");
    console.log("User attempts withdraw.");
    await expect(StakeVRTContract.connect(user).withdraw()).to.emit(StakeVRTContract, "Withdraw").withArgs(user.address, 0, 0, time.latestBlock);
    console.log("User stakes 1mm vrt for 0s.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 0)).to.be.revertedWith("1");
    console.log("User attempts withdraw.");
    await expect(StakeVRTContract.connect(user).withdraw()).to.emit(StakeVRTContract, "Withdraw").withArgs(user.address, 0, 0, time.latestBlock);
    console.log("User stakes 1mm vrt for 1mms.");
    await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");
    
    await time.increase(1000000);
    console.log("User reward amount should be 0 at this point.");
    let userRewardAmount = await StakeVRTContract.connect(user).viewRewards(user.address);
    expect(userRewardAmount).to.be.equal(0);
    console.log("User claims rewards.");
    await expect(StakeVRTContract.connect(user).claimRewards(user.address)).to.be.revertedWith("2");
    console.log("User stakes 1mm vrt for 1 year");
    await expect(StakeVRTContract.connect(user).deposit(100000000, 86400*365)).to.emit(StakeVRTContract, "Deposit").withArgs(user.address, 100000000, 86400*365, 0, time.latestBlock);
    
    await time.increase(86400*180);
    console.log("User reward amount after 180 days");
    userRewardAmount = await StakeVRTContract.connect(user).viewRewards(user.address);
    console.log((ethers.utils.formatEther(userRewardAmount)));

    // console.log("User attempts withdraw");
    // await expect(StakeVRTContract.connect(user).withdraw()).to.emit(StakeVRTContract, "Withdraw").withArgs(user.address, 0, 0, time.latestBlock);

    // await time.increase(1000);
    // console.log("User claims rewards after 1000s.");
    // await expect(StakeVRTContract.connect(user).claimRewards(user.address)).revertedWith("2");

    // console.log("User stakes 0 VRT for 0s.");
    // await expect(StakeVRTContract.connect(user).deposit(0, 0)).to.be.revertedWith("1");
    // console.log("User stakes 0 vrt for 1mms.");
    // await expect(StakeVRTContract.connect(user).deposit(0, 1000000)).to.be.revertedWith("1");
    // console.log("User stakes 1mm vrt for 0s.");
    // await expect(StakeVRTContract.connect(user).deposit(1000000, 0)).to.be.revertedWith("1");
    // console.log("User stakes 1mm vrt for 1mms.");
    // await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");
    // console.log("User stakes 1mm vrt for 1mms.");
    // await expect(StakeVRTContract.connect(user).deposit(1000000, 1000000)).to.be.revertedWith("1");

    // await time.increase(1000000);
    // console.log("User attempts withdraw after 1000000s");
    // await expect(StakeVRTContract.connect(user).withdraw()).to.emit(StakeVRTContract, "Withdraw").withArgs(user.address, 0, 0, time.latestBlock);

    // // Check VRT balance of staking contract after staking.
    // stakeContractVRTBalance = await VRTContract.balanceOf(
    //   StakeVRTContractAddress
    // );
    // console.log(
    //   "StakeVRT contract's VRT balance after staking: ",
    //   stakeContractVRTBalance.toString()
    // );
    // expect(stakeContractVRTBalance).to.be.equal(0);
  });
});
