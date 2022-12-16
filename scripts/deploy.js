const { ethers, upgrades } = require('hardhat');

async function main() {
	const [deployer, user] = await ethers.getSigners();

	console.log('Deploying contracts with the account:', deployer.address);

	console.log('Account balance:', (await deployer.getBalance()).toString());

    // Deploy Rsnack token contract.
    const Rsnack = await ethers.getContractFactory("Rsnacks");
    const RsnackContract = await Rsnack.deploy();
    await RsnackContract.deployed();
    const RsnackContractAddress = RsnackContract.address;
    console.log("Rsanck contract deployed address", RsnackContractAddress);

    // Deploy VRT token contract.
    const VRT = await ethers.getContractFactory("VRT");
    const VRTContract = await VRT.deploy();
    await VRTContract.deployed();
    const VRTContractAddress = VRTContract.address;
    console.log("VRT contract deployed address", VRTContractAddress);

    // Deploy StakeVRT contract.
    const StakeVRT = await ethers.getContractFactory("StakeVRT");
    const StakeVRTContract = await StakeVRT.deploy(
        VRTContractAddress,
        RsnackContractAddress
    );
    await StakeVRTContract.deployed();
    const StakeVRTContractAddress = StakeVRTContract.address;
    console.log("StakeVRT contract deployed address", StakeVRTContractAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
