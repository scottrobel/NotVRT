const { ethers, network } = require('hardhat');
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function recordStakeWallets() {
  let StakeVRTContract = await ethers.getContractFactory("StakeVRT");
  StakeVRTContract = await StakeVRTContract.attach(process.env.CONTRACT_ADDRESS)
  let depositEventFilter = StakeVRTContract.filters.Deposit()
  let { data, error } = await supabase.from('users').select('key')
  let deposits = await StakeVRTContract.queryFilter(depositEventFilter)
  let usersWhoStaked = data.map((user) => { return user['key'] });
  //loops though the deposits
  let usersToInsert = deposits.filter((deposit) => {
    stakeUserAddress = deposit.args['user']
    if (!usersWhoStaked.includes(stakeUserAddress)) {
      usersWhoStaked.push(stakeUserAddress)
      return true;
    }
  }).map((deposit) => {
    stakeUserAddress = deposit.args['user']
    return { key: stakeUserAddress };
  })
  await supabase.from('users').insert(usersToInsert)
}
const ClaimRewards = async () => {
  const { data, error } = await supabase.from('users').select('key')
  let StakeVRTContract = await ethers.getContractFactory("StakeVRT");
  StakeVRTContract = await StakeVRTContract.attach(process.env.CONTRACT_ADDRESS)
  let lastClaimInfo = []
  let currentBlockTime = (await ethers.provider.getBlock("latest")).timestamp
  //loops through depositers
  for (let { key } of data) {
    stake = await StakeVRTContract.getStake(key)//gets the current stake data from the contract
    if (stake[0].gt(0)) {//checks if there is still money staked
      lastClaimTime = stake[3].toNumber()
      timeSinceLastClaim = currentBlockTime - lastClaimTime;
      lastClaimInfo.push({ key, timeSinceLastClaim })//stores the key and the time since last claim in an array
    }
  }
  //sorts stakes by the amount of time since last claim
  let sortedLastClaimInfo = lastClaimInfo.sort((a, b) => { return a.timeSinceLastClaim - b.timeSinceLastClaim }).reverse()
  console.log(sortedLastClaimInfo)
  //selects the stakes that have not been claimed the longest
  let userToClaim = sortedLastClaimInfo[0];
  const [user] = await ethers.getSigners();
  //gets the key of the user to claim
  let userToClaimKey = userToClaim.key
  //claims the rewards for that user
  console.log(userToClaimKey)
  result = await StakeVRTContract.connect(user).claimRewards(userToClaimKey)
  result.wait(1)
}
const main = async () => {
  await recordStakeWallets()
  await ClaimRewards()
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});  