# Contract Implementation

## Global values
- scoreFactor public (need an admin only setter)
- reward factor public (need an admin setter)

## Deposit
<br>
- deposits will happen on a *rolling* basis. What this means is that every new deposit will increase the ``endTime`` field for the user's stake by the specified amount of time.
- deposit time will be for a minimum of 1 month and a maximum of 1 year
- The score field will be calculated as follows

```js
amount to deposit * timestamp / scoreFactor
```
- a user should be able to update their score by increasing the time they are staked for, increasing the amount of stake, or both. **this means that the amount parameter may be zero, so we should check for that before transfering funds**
<br>
- If a user already has a score, the score will be recalculated with the total amount deposited (amounts are added)
- VRT will then be transferred to the contract via ``transferFrom``

## Withdraw
- withdraw should be standard, if the required time has passed, allow the user to withdraw and zero out their stake struct.

## Contract Errors Explanation
1 => Staking time should be between a month to a year.
2 => User is not stakeholder.
3 => User score divisor can't be 0.
4 => Per second divisor can't be 0.
5 => You can't withdraw before unlock time.
6 => Deposit amount should be bigger than 0.
7 => VRT transfer has been failed.