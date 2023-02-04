const { ethers, network } = require('hardhat');
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

async function recordStakeWallets() {
  let StakeVRTContract = await ethers.getContractFactory("StakeVRT");
  StakeVRTContract = await StakeVRTContract.attach(process.env.CONTRACT_ADDRESS)
  let depositEventFilter = StakeVRTContract.filters.ClaimRewards()
  let { data, error } = await supabase.from('users').select('key')
  let deposits = await StakeVRTContract.queryFilter(depositEventFilter)
  let usersWhoStaked = data.map((user) => { return user['key'] });
  for (let deposit of deposits) {
    stakeUserAddress = deposit.args['user']
    if (!usersWhoStaked.includes(stakeUserAddress)) {
      usersWhoStaked.push(stakeUserAddress)
      const { data, error } = await supabase
        .from('users')
        .insert({ key: stakeUserAddress })
    }
  }
}
const ClaimRewards = async () => {
  const { data, error } = await supabase.from('users').select('key')
  const maxDailyRewardClaims = process.env.autoClaimsPerDay
  let StakeVRTContract = await ethers.getContractFactory("StakeVRT");
  StakeVRTContract = await StakeVRTContract.attach(process.env.CONTRACT_ADDRESS)
  let lastClaimInfo = []
  let currentBlockTime = (await ethers.provider.getBlock("latest")).timestamp
  // loops through deposit data from database to find
  // the amount of blocks since a stake got its rewards claimed
  // If it has never been claimed it gets the amount of blocks since
  // the first deposit
  for (let { key } of data) {
    stake = await StakeVRTContract.getStake(key)
    if(stake[0].toNumber() > 0){
      lastClaimTime = stake[3].toNumber()
      timeSinceLastClaim = currentBlockTime - lastClaimTime;
      lastClaimInfo.push({ key, timeSinceLastClaim })
    }
  }
  let sortedLastClaimInfo = lastClaimInfo.sort((a, b)=> {return a.timeSinceLastClaim - b.timeSinceLastClaim}).reverse()
  let usersToClaim = sortedLastClaimInfo.slice(0, maxDailyRewardClaims)
  const [user] = await ethers.getSigners();
  for(const userToClaimIndex in usersToClaim){
    let userToClaim = usersToClaim[userToClaimIndex].key
    result = await StakeVRTContract.connect(user).claimRewards(userToClaim)
  }
}
const main = async () => {
  await recordStakeWallets()
  await ClaimRewards()
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});  