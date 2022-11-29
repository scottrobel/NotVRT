const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("RsnacksToken contract", function () {
  async function deployContracts() {
    const [owner, user] = await ethers.getSigners();
    console.log(owner.address, user.address);

    const Rsnack = await ethers.getContractFactory("Rsnacks");
    const RsnackContract = await Rsnack.deploy();
    const RsnackContractAddress = RsnackContract.address;

    const VRT = await ethers.getContractFactory("VRT");
    const VRTContract = await VRT.deploy();
    const VRTContractAddress = VRTContract.address;

    await VRTContract.connect(owner).mint(owner.address, 15000000);

    const StakeVRT = await ethers.getContractFactory("StakeVRT");
    const StakeVRTContract = await StakeVRT.deploy(
      VRTContractAddress,
      RsnackContractAddress
    );

    await VRTContract.connect(owner).transfer(user.address, 100000);
    const StakeVRTContractAddress = StakeVRTContract.address;
    console.log(StakeVRTContractAddress, "staking contract address");

    await StakeVRTContract.connect(owner).setScoreFactor(100);

    await VRTContract.connect(user).approve(StakeVRTContractAddress, 100);
    let tx = await StakeVRTContract.connect(user).deposit(100, 86400 * 30);
    console.log(tx.hash, "user deposit token");

    return { VRTContract, StakeVRTContract };
  }

  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner, user] = await ethers.getSigners();
    const { VRTContract, StakeVRTContract } = await loadFixture(
      deployContracts
    );

    const StakeVRTContractAddress = StakeVRTContract.address;

    await VRTContract.connect(owner).transfer(user.address, 100000);
    const userBalance = await VRTContract.balanceOf(user.address);
    console.log(userBalance, "User balance after transfer");

    await StakeVRTContract.connect(owner).setScoreFactor(100);

    console.log(StakeVRTContractAddress, "staking contract address");
    await VRTContract.connect(user).approve(StakeVRTContractAddress, 100);
    let tx = await StakeVRTContract.connect(user).deposit(100, 86400 * 30);
    console.log(tx.hash, "user deposit token");

    const stakeContractBalance = await VRTContract.balanceOf(
      StakeVRTContractAddress
    );
    console.log(stakeContractBalance, "deposited token balance");
  });

  it("Withdraw should be available after period", async function () {
    const [owner, user] = await ethers.getSigners();
    const { VRTContract, StakeVRTContract } = await loadFixture(
      deployContracts
    );

    await time.increase(86400 * 30);

    await StakeVRTContract.connect(user).withdraw();
    console.log(await VRTContract.balanceOf(user.address));
  });
});
