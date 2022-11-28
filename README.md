# Contract Implementation

## Global values
- scoreFactor public (need an admin only setter)
- reward factor public (need an admin setter)

## Deposit
<br>
- deposits will happen on a *rolling* basis. What this means is that every new deposit will increase the ``endTime`` field for the user's stake by the specified amount of time.
- deposit time will be for a minimum of 1 month and a maximum of 1 year **pending review**
- The score field will be calculated as follows **pending review**

```js
amount to deposit * timestamp / scoreFactor
```
<br>
- If a user already has a score, the score will be recalculated with the total amount deposited (amounts are added)
- VRT will then be transferred to the contract via ``transferFrom``

## Withdraw
- withdraw should be standard, if the required time has passed, allow the user to withdraw and zero out their stake struct.

