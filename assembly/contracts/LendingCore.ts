import { call, Context, createSC, Storage, Address, transferCoins, balance, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, bytesToString, fixedSizeArrayToBytes, serializableObjectsArrayToBytes, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import { onlyOwner, ownerAddress } from '../helpers/ownership';
import { IERC20 } from '../interfaces/IERC20';
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { u256 } from 'as-bignum/assembly';
import { timestamp } from '@massalabs/massa-as-sdk/assembly/std/context';
import { IReserveInterestRateStrategy } from '../interfaces/IReserveInterestStrategy';

const ONE_UNIT = 10 ** 9;
const RESERVE_KEY = 'RESERVE_KEY';
const USER_KEY = 'USER_KEY';
const SECONDS_PER_YEAR = 31536000;

export const ORIGNATION_FEE = 0.0025 * 10 ** 9;
export const MAS = 'EeeEeeEeeeeEeeeeeEeeeeeeEeeeeeeEEeeeeeeEeeeEeeeeeeEee';

export enum InterestRateMode { NONE, STABLE, VARIABLE }

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param providerAddress - Arguments serialized with Args
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return;
  }

  const args = new Args(binaryArgs);
  // const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  // Storage.set(
  //   'ADDRESS_PROVIDER_ADDR',
  //   provider,
  // );

  let mToken_contract_code = args.nextFixedSizeArray<u8>().unwrap();
  Storage.set(stringToBytes('mToken_contract_code'), StaticArray.fromArray(mToken_contract_code));

  generateEvent(`Constructor called with mToken contract code.`);
}

export function initReserve(binaryArgs: StaticArray<u8>): void {

  // onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  let reserve: Reserve = args.nextSerializable<Reserve>().unwrap();

  let mToken_contract_code = Storage.get(stringToBytes('mToken_contract_code'));
  let mToken_addr = createSC(mToken_contract_code);
  call(mToken_addr, 'constructor', new Args().add('mTokenName').add('mTokenSymbol').add(u8(9)).add(new u256(100000000)).add(Context.caller()), 10 * ONE_UNIT);
  // call(mToken_addr, 'constructor', new Args().add(Context.caller().toString()), 10 * ONE_UNIT);

  reserve.mTokenAddress = mToken_addr.toString();

  // let mToken_contract_code = args.nextUint8Array().unwrap();
  // reserve.mTokenAddress = createSC(new Args().add(mToken_contract_code).serialize());

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserve.addr}`;

  // check reserve does not already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(!reserveExists, 'Reserve already exists');

  // save reserve to storage
  Storage.set(stringToBytes(storageKey), reserve.serialize());

  addReserveToList(reserve.addr);

  generateEvent(
    'ReserveCreated : ' +
    ', addr:' +
    reserve.addr.toString() +
    ', name:' +
    reserve.name.toString() +
    ', symbol:' +
    reserve.symbol.toString() +
    ', decimals:' +
    reserve.decimals.toString() +
    ', mTokenAddress:' +
    reserve.mTokenAddress.toString() +
    ', interestCalcAddress:' +
    reserve.interestCalcAddress.toString() +
    ', baseLTV:' +
    reserve.baseLTV.toString() +
    'LiquidationThreshold: ' +
    reserve.LiquidationThreshold.toString() +
    'LiquidationBonus: ' +
    reserve.LiquidationBonus.toString(),
  );

}

export function getReserve(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(reserveExists, 'Reserve does not exist');

  // get the serialized reserve info
  return Storage.get(stringToBytes(storageKey));

  // return new Args(data).nextSerializable<Reserve>().unwrap();
}

export function deleteReserve(binaryArgs: StaticArray<u8>): void {

  onlyOwner();

  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(reserveExists, 'Reserve does not exist');

  // delete the serialized reserve info
  return Storage.del(stringToBytes(storageKey));
}

export function initUser(binaryArgs: StaticArray<u8>): void {

  // onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  let userReserve: UserReserve = args.nextSerializable<UserReserve>().unwrap();
  const reserve = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${USER_KEY}_${userReserve.addr}_${reserve}`;

  // check reserve does not already exist
  const userExists = Storage.has(stringToBytes(storageKey));
  // assert(!userExists, 'User already exists');
  if (!userExists) {
    // save reserve to storage
    Storage.set(stringToBytes(storageKey), userReserve.serialize());

    generateEvent(
      'UserReserveCreated : ' +
      ', addr:' +
      userReserve.addr.toString() +
      ', principalBorrowBalance:' +
      userReserve.principalBorrowBalance.toString() +
      ', lastVariableBorrowCumulativeIndex:' +
      userReserve.lastVariableBorrowCumulativeIndex.toString() +
      ', originationFee:' +
      userReserve.originationFee.toString() +
      ', stableBorrowRate:' +
      userReserve.stableBorrowRate.toString() +
      ', lastUpdateTimestamp:' +
      userReserve.lastUpdateTimestamp.toString() +
      ', useAsCollateral:' +
      userReserve.useAsCollateral.toString(),
    );
  }

}

export function getUserReserve(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const userAddr = args.nextString().unwrap();
  const reserveAddr = args.nextString().unwrap();

  const storageKey = `${USER_KEY}_${userAddr}_${reserveAddr}`;

  // check reserve must already exist
  const userExists = Storage.has(stringToBytes(storageKey));
  assert(userExists, 'User does not exist');

  // get the serialized reserve info
  return Storage.get(stringToBytes(storageKey));

  // return new Args(data).nextSerializable<UserReserve>().unwrap();
}

function addReserveToList(reserve: string): void {

  if (!Storage.has(stringToBytes('ALL_RESERVES'))) {
    Storage.set(stringToBytes('ALL_RESERVES'), new Args().add<Array<string>>([]).serialize());
  }

  // const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  // if (!Storage.has(storageKey)) {
  // let reserveArr = Storage.get('ALL_RESERVES');
  // var array_data: string[] = reserveArr.split(',');
  // array_data.push(reserve.toString());
  // Storage.set('ALL_RESERVES', array_data.toString());

  let reserveArr = new Args(Storage.get(stringToBytes('ALL_RESERVES'))).nextStringArray().unwrap();
  reserveArr.push(reserve);
  Storage.set(stringToBytes('ALL_RESERVES'), new Args().add<Array<string>>(reserveArr).serialize());
  // }

}

export function viewAllReserves(): string[] {
  // let reserveArr = Storage.get('ALL_RESERVES');
  // var array_data: string[] = reserveArr.split(',');

  let reserveArr = new Args(Storage.get(stringToBytes('ALL_RESERVES'))).nextStringArray().unwrap();
  return reserveArr;
}

export function transferToReserve(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= parseFloat(amount.toString()), "Not enough sent coins");
    transferCoins(Context.callee(), parseFloat(amount.toString()));
  } else {
    assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve)).transferFrom(new Address(user), Context.callee(), amount);
  }
}

export function transferFeeToOwner(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const owner = ownerAddress(new Args().serialize());

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= parseFloat(amount.toString()), "Not enough sent coins");
    transferCoins(new Address(bytesToString(owner)), parseFloat(amount.toString()));
  } else {
    assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve)).transferFrom(new Address(user), new Address(bytesToString(owner)), amount);
  }

}

export function transferToUser(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  if (reserve == MAS) {
    // transferCoins(new Address(user), u64(amount));
  } else {
    new IERC20(new Address(reserve)).transfer(new Address(user), amount);
  }

}

export function updateStateOnBorrow(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amountBorrowed = args.nextU256().unwrap();
  const borrowFee = args.nextU64().unwrap();
  const rateMode = args.nextU8().unwrap();

  const data = getUserBorrowBalances(new Args().add(reserve).add(user).serialize());
  const principalBorrowBalance = data[0];
  const balanceIncrease = data[2];

  updateReserveStateOnBorrowInternal(new Address(reserve), new Address(user), principalBorrowBalance, balanceIncrease, amountBorrowed, rateMode);

  updateUserStateOnBorrowInternal(new Address(reserve), new Address(user), amountBorrowed, balanceIncrease, new u256(borrowFee), rateMode);

  updateReserveInterestRatesAndTimestampInternal(reserve, new u256(0), amountBorrowed);
}

export function updateStateOnRepay(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const paybackAmountMinusFees = args.nextU256().unwrap();
  const originationFeeRepaid = args.nextU256().unwrap();
  const balanceIncrease = args.nextU256().unwrap();
  const repaidWholeLoan = args.nextBool().unwrap();

  updateReserveStateOnRepayInternal(new Address(reserve), new Address(user), paybackAmountMinusFees, balanceIncrease);
  updateUserStateOnRepayInternal(new Address(reserve), new Address(user), paybackAmountMinusFees, originationFeeRepaid, balanceIncrease, repaidWholeLoan);

  updateReserveInterestRatesAndTimestampInternal(reserve, paybackAmountMinusFees, new u256(0));

}

export function updateStateOnRedeem(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amountRedeemed = args.nextU256().unwrap();
  const userRedeemedEverything = args.nextBool().unwrap();

  updateCumulativeIndexes(new Address(reserve));
  updateReserveInterestRatesAndTimestampInternal(reserve, new u256(0), amountRedeemed);

  //if user redeemed everything the useReserveAsCollateral flag is reset
  if (userRedeemedEverything) {
    setUserUseReserveAsCollateral(new Address(reserve), new Address(user), false);
  }
}

export function updateStateOnDeposit(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  updateCumulativeIndexes(new Address(reserve));
  updateReserveInterestRatesAndTimestampInternal(reserve, amount, new u256(0));

}

export function getReserveAvailableLiquidity(binaryArgs: StaticArray<u8>): u256 {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();

  let bal = new u256(0);

  if (reserve == MAS) {
    bal = new u256(balance());
  } else {
    bal = new IERC20(new Address(reserve)).balanceOf(Context.callee());
  }

  return bal;
}

export function getUserBasicReserveData(binaryArgs: StaticArray<u8>): StaticArray<u256> {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  const userData = getUserReserve(new Args().add(user).add(reserve).serialize())
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const underlyingBalance = getUserUnderlyingAssetBalance(new Address(reserve), new Address(user));
  if (parseFloat(userArgs.principalBorrowBalance.toString()) == 0) {
    return [underlyingBalance, new u256(0), new u256(0)];
  }

  return [
    underlyingBalance,
    getCompoundedBorrowBalance(new Address(reserve), new Address(user)),
    userArgs.originationFee
  ];

}

function getUserUnderlyingAssetBalance(reserve: Address, user: Address): u256 {
  const args = new Args().add(reserve.toString()).serialize();
  const mTokenData = getReserve(args);
  const mToken = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  const mTokenAddr = new IERC20(new Address(mToken.mTokenAddress));
  return mTokenAddr.balanceOf(user);
}

export function getUserBorrowBalances(binaryArgs: StaticArray<u8>): StaticArray<u256> {
  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  const userData = getUserReserve(new Args().add(user).add(reserve).serialize())
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  let userBorrows = new Array<u256>()

  let principal = userArgs.principalBorrowBalance;
  const compoundBal = getCompoundedBorrowBalance(new Address(reserve), new Address(user));

  userBorrows.push(principal);
  userBorrows.push(compoundBal);
  const balIncrease = new u256(parseFloat(compoundBal.toString()) - parseFloat(principal.toString()));
  userBorrows.push(balIncrease);

  return userBorrows;
}

export function getNormalizedIncome(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const cumulated = calculateLinearInterest(reserveArgs.currentLiquidityRate, reserveArgs.lastUpdateTimestamp)
  return u256ToBytes(cumulated);
}

/**
* This functions retrieves the core address.
*
* @returns The serialized address found.
*
*/
function updateCumulativeIndexes(reserve: Address): void {
  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const totalBorrows = getTotalBorrows(reserveArgs.totalBorrowsStable, reserveArgs.totalBorrowsVariable);

  var updatedLastUpdateTimelastLiquidityCumulativeIndexstamp = new u256(0);
  var updatedLastVariableBorrowCumulativeIndex = new u256(0);
  if (parseFloat(totalBorrows.toString()) > 0) {
    //only cumulating if there is any income being produced
    const cumulatedLiquidityInterest = calculateLinearInterest(reserveArgs.currentLiquidityRate, reserveArgs.lastUpdateTimestamp);
    updatedLastUpdateTimelastLiquidityCumulativeIndexstamp = new u256(parseFloat(cumulatedLiquidityInterest.toString()) * parseFloat(reserveArgs.lastLiquidityCumulativeIndex.toString()));
    const cumulatedVariableBorrowInterest = calculateCompoundedInterest(reserveArgs.currentVariableBorrowRate, reserveArgs.lastUpdateTimestamp);
    updatedLastVariableBorrowCumulativeIndex = new u256(parseFloat(cumulatedVariableBorrowInterest.toString()) * parseFloat(reserveArgs.lastVariableBorrowCumulativeIndex.toString()));
  }

  const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  const updatedReserve = new Reserve(reserve.toString(), reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, reserveArgs.lastUpdateTimestamp, updatedLastUpdateTimelastLiquidityCumulativeIndexstamp, reserveArgs.lastLiquidityCumulativeIndex, reserveArgs.currentLiquidityRate, reserveArgs.totalBorrowsStable, reserveArgs.totalBorrowsVariable, reserveArgs.currentVariableBorrowRate, reserveArgs.currentStableBorrowRate, reserveArgs.currentAverageStableBorrowRate, updatedLastVariableBorrowCumulativeIndex);

  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function updateReserveStateOnRepayInternal(reserve: Address, user: Address, paybackAmountMinusFees: u256, balanceIncrease: u256): void {

  const userData = getUserReserve(new Args().add(user.toString()).add(reserve.toString()).serialize());
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const borrowRateMode: InterestRateMode = getUserCurrentBorrowRateMode(reserve, user);

  //update the indexes
  updateCumulativeIndexes(reserve);

  //compound the cumulated interest to the borrow balance and then subtracting the payback amount
  if (borrowRateMode == InterestRateMode.STABLE) {
    increaseTotalBorrowsStableAndUpdateAverageRate(reserve, balanceIncrease, userArgs.stableBorrowRate);

    decreaseTotalBorrowsStableAndUpdateAverageRate(reserve, paybackAmountMinusFees, userArgs.stableBorrowRate);
  } else {
    increaseTotalBorrowsVariable(reserve, balanceIncrease);
    decreaseTotalBorrowsVariable(reserve, paybackAmountMinusFees);
  }
}

function getUserCurrentBorrowRateMode(reserve: Address, user: Address): InterestRateMode {
  const userData = getUserReserve(new Args().add(user.toString()).add(reserve.toString()).serialize())
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  if (parseFloat(userArgs.principalBorrowBalance.toString()) == 0) {
    return InterestRateMode.NONE;
  }

  return parseFloat(userArgs.stableBorrowRate.toString()) > 0 ? InterestRateMode.STABLE : InterestRateMode.VARIABLE;
}

function updateUserStateOnRepayInternal(reserve: Address, user: Address, paybackAmountMinusFees: u256, originationFeeRepaid: u256, balanceIncrease: u256, repaidWholeLoan: bool): void {

  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const userData = getUserReserve(new Args().add(user).add(reserve).serialize());
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  //update the user principal borrow balance, adding the cumulated interest and then subtracting the payback amount
  const updatedPrincipalBorrowBalance = new u256((parseFloat(userArgs.principalBorrowBalance.toString()) + parseFloat(balanceIncrease.toString())) - parseFloat(paybackAmountMinusFees.toString()));
  let updatedLastVariableBorrowCumulativeIndex = reserveArgs.lastVariableBorrowCumulativeIndex;

  //if the balance decrease is equal to the previous principal (user is repaying the whole loan)
  //and the rate mode is stable, we reset the interest rate mode of the user
  let updatedStableBorrowRate = new u256(0);
  if (repaidWholeLoan) {
    updatedStableBorrowRate = new u256(0);
    updatedLastVariableBorrowCumulativeIndex = new u256(0);
  }
  const updatedOriginationFee = new u256(parseFloat(userArgs.originationFee.toString()) - parseFloat(originationFeeRepaid.toString()));

  //solium-disable-next-line
  const updatedLastUpdateTimestamp = new u256(timestamp());

  const storageKey = `${USER_KEY}_${user.toString()}_${reserve.toString()}`;
  const updatedUserReserve = new UserReserve(user.toString(), updatedPrincipalBorrowBalance, updatedLastVariableBorrowCumulativeIndex, updatedOriginationFee, updatedStableBorrowRate, updatedLastUpdateTimestamp, userArgs.useAsCollateral);

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());

}

function updateUserStateOnBorrowInternal(reserve: Address, user: Address, amountBorrowed: u256, balanceIncrease: u256, fee: u256, rateMode: InterestRateMode): void {

  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const userData = getUserReserve(new Args().add(user).add(reserve).serialize());
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  let updatedStableBorrowRate = new u256(0);
  let updatedLastVariableBorrowCumulativeIndex = new u256(0);

  if (rateMode == InterestRateMode.STABLE) {
      //stable
      //reset the user variable index, and update the stable rate
      updatedStableBorrowRate = reserveArgs.currentStableBorrowRate;
      updatedLastVariableBorrowCumulativeIndex = new u256(0);
  } else if (rateMode == InterestRateMode.VARIABLE) {
      //variable
      //reset the user stable rate, and store the new borrow index
      updatedStableBorrowRate = new u256(0);
      updatedLastVariableBorrowCumulativeIndex = reserveArgs.lastVariableBorrowCumulativeIndex;
  } else {
      abort("Invalid borrow rate mode");
  }
  //increase the principal borrows and the origination fee
  const updatedPrincipalBorrowBalance = new u256(parseFloat(userArgs.principalBorrowBalance.toString()) + parseFloat(amountBorrowed.toString()) + parseFloat(balanceIncrease.toString()));
  const updatedOriginationFee = new u256(parseFloat(userArgs.originationFee.toString()) + parseFloat(fee.toString()));

  //solium-disable-next-line
  const updatedLastUpdateTimestamp = new u256(timestamp());

  const storageKey = `${USER_KEY}_${user.toString()}_${reserve.toString()}`;
  const updatedUserReserve = new UserReserve(user.toString(), updatedPrincipalBorrowBalance, updatedLastVariableBorrowCumulativeIndex, updatedOriginationFee, updatedStableBorrowRate, updatedLastUpdateTimestamp, userArgs.useAsCollateral);

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());

}

// function cumulateToLiquidityIndex(reserve: Address, totalLiquidity: u256, amount: u256): void {
//   const amountToLiquidityRatio = parseFloat(amount.toString()) / parseFloat(totalLiquidity.toString());
//   const cumulatedLiquidity = amountToLiquidityRatio + 1;

//   const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
//   const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

//   const updatedLastLiquidityCumulativeIndex = new u256(cumulatedLiquidity * parseFloat(reserveArgs.lastLiquidityCumulativeIndex.toString()));

//   const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
//   const updatedReserve = new Reserve(reserve.toString(), reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, reserveArgs.lastUpdateTimestamp, reserveArgs.lastUpdateTimelastLiquidityCumulativeIndexstamp, updatedLastLiquidityCumulativeIndex, reserveArgs.currentLiquidityRate, reserveArgs.totalBorrowsStable, reserveArgs.totalBorrowsVariable, reserveArgs.currentVariableBorrowRate, reserveArgs.currentStableBorrowRate, reserveArgs.currentAverageStableBorrowRate, reserveArgs.lastVariableBorrowCumulativeIndex);
//   Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
// }

function updateReserveTotalBorrowsByRateModeInternal(reserve: Address, user: Address, principalBalance: u256, balanceIncrease: u256, amountBorrowed: u256, newBorrowRateMode: InterestRateMode): void {
  const previousRateMode: InterestRateMode = getUserCurrentBorrowRateMode(reserve, user);

  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  if (previousRateMode == InterestRateMode.STABLE) {

    const userData = getUserReserve(new Args().add(user.toString()).add(reserve.toString()).serialize());
    const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

    decreaseTotalBorrowsStableAndUpdateAverageRate(reserve, principalBalance, userArgs.stableBorrowRate);
  } else if (previousRateMode == InterestRateMode.VARIABLE) {
    decreaseTotalBorrowsVariable(reserve, principalBalance);
  }

  const newPrincipalAmount = new u256(parseFloat(principalBalance.toString()) + parseFloat(balanceIncrease.toString()) + parseFloat(amountBorrowed.toString()));
  if (newBorrowRateMode == InterestRateMode.STABLE) {
    increaseTotalBorrowsStableAndUpdateAverageRate(reserve, newPrincipalAmount, reserveArgs.currentStableBorrowRate);
  } else if (newBorrowRateMode == InterestRateMode.VARIABLE) {
    increaseTotalBorrowsVariable(reserve, newPrincipalAmount);
  } else {
    abort("Invalid new borrow rate mode");
  }
}

function updateReserveStateOnBorrowInternal(reserve: Address, user: Address, principalBorrowBalance: u256, balanceIncrease: u256, amountBorrowed: u256, rateMode: InterestRateMode): void {
  updateCumulativeIndexes(reserve);

  //increasing reserve total borrows to account for the new borrow balance of the user
  //NOTE: Depending on the previous borrow mode, the borrows might need to be switched from variable to stable or vice versa

  updateReserveTotalBorrowsByRateModeInternal(reserve, user, principalBorrowBalance, balanceIncrease, amountBorrowed, rateMode);
}

function getCompoundedBorrowBalance(reserve: Address, user: Address): u256 {

  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const userData = getUserReserve(new Args().add(user.toString()).add(reserve.toString()).serialize())
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  if (parseFloat(userArgs.principalBorrowBalance.toString()) == 0) return new u256(0);

  let principalBorrowBalanceRay = userArgs.principalBorrowBalance;
  let compoundedBalance = new u256(0);
  let cumulatedInterest = new u256(0);

  if (parseFloat(userArgs.stableBorrowRate.toString()) > 0) {
    cumulatedInterest = calculateCompoundedInterest(
      userArgs.stableBorrowRate,
      userArgs.lastUpdateTimestamp
    );
  } else {
    //variable interest
    cumulatedInterest = new u256(parseFloat(calculateCompoundedInterest(
      reserveArgs
        .currentVariableBorrowRate,
      reserveArgs
        .lastUpdateTimestamp
    ).toString())
      * parseFloat(reserveArgs.lastVariableBorrowCumulativeIndex.toString())
      / parseFloat(userArgs.lastVariableBorrowCumulativeIndex.toString()));
  }

  compoundedBalance = new u256(parseFloat(principalBorrowBalanceRay.toString()) * parseFloat(cumulatedInterest.toString()));

  if (compoundedBalance == userArgs.principalBorrowBalance) {
    //solium-disable-next-line
    if (parseFloat(userArgs.lastUpdateTimestamp.toString()) != timestamp()) {
      //no interest cumulation because of the rounding - we add 1 wei
      //as symbolic cumulated interest to avoid interest free loans.

      return userArgs.principalBorrowBalance;
    }
  }

  return compoundedBalance;
}

function increaseTotalBorrowsStableAndUpdateAverageRate(reserve: Address, amount: u256, rate: u256): void {
  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const previousTotalBorrowStable = reserveArgs.totalBorrowsStable;
  //updating reserve borrows stable
  const updatedTotalBorrowsStable = new u256(parseFloat(reserveArgs.totalBorrowsStable.toString()) + parseFloat(amount.toString()));

  //update the average stable rate
  //weighted average of all the borrows
  const weightedLastBorrow = parseFloat(amount.toString()) * parseFloat(rate.toString());
  const weightedPreviousTotalBorrows = parseFloat(previousTotalBorrowStable.toString()) * parseFloat(reserveArgs.currentAverageStableBorrowRate.toString());
  const updatedCurrentAverageStableBorrowRate = new u256((weightedLastBorrow + weightedPreviousTotalBorrows) / parseFloat(reserveArgs.totalBorrowsStable.toString()));

  const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  const updatedReserve = new Reserve(reserve.toString(), reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, reserveArgs.lastUpdateTimestamp, reserveArgs.lastUpdateTimelastLiquidityCumulativeIndexstamp, reserveArgs.lastLiquidityCumulativeIndex, reserveArgs.currentLiquidityRate, updatedTotalBorrowsStable, reserveArgs.totalBorrowsVariable, reserveArgs.currentVariableBorrowRate, reserveArgs.currentStableBorrowRate, updatedCurrentAverageStableBorrowRate, reserveArgs.lastVariableBorrowCumulativeIndex);
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function decreaseTotalBorrowsStableAndUpdateAverageRate(reserve: Address, amount: u256, rate: u256): void {
  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  assert(reserveArgs.totalBorrowsStable >= amount, "Invalid amount to decrease");

  const previousTotalBorrowStable = reserveArgs.totalBorrowsStable;

  //updating reserve borrows stable
  const updatedTotalBorrowsStable = parseFloat(reserveArgs.totalBorrowsStable.toString()) - parseFloat(amount.toString());
  var updatedCurrentAverageStableBorrowRate = 0;
  if (updatedTotalBorrowsStable == 0) {
    updatedCurrentAverageStableBorrowRate = 0; //no income if there are no stable rate borrows
    return;
  }

  //update the average stable rate
  //weighted average of all the borrows
  const weightedLastBorrow = parseFloat(amount.toString()) * parseFloat(rate.toString());
  const weightedPreviousTotalBorrows = parseFloat(previousTotalBorrowStable.toString()) * updatedCurrentAverageStableBorrowRate;

  assert(
    weightedPreviousTotalBorrows >= weightedLastBorrow,
    "The amounts to subtract don't match"
  );

  updatedCurrentAverageStableBorrowRate = (weightedPreviousTotalBorrows - weightedLastBorrow) / updatedTotalBorrowsStable;

  const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  const updatedReserve = new Reserve(reserve.toString(), reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, reserveArgs.lastUpdateTimestamp, reserveArgs.lastUpdateTimelastLiquidityCumulativeIndexstamp, reserveArgs.lastLiquidityCumulativeIndex, reserveArgs.currentLiquidityRate, new u256(updatedTotalBorrowsStable), reserveArgs.totalBorrowsVariable, reserveArgs.currentVariableBorrowRate, reserveArgs.currentStableBorrowRate, new u256(updatedCurrentAverageStableBorrowRate), reserveArgs.lastVariableBorrowCumulativeIndex);
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function increaseTotalBorrowsVariable(reserve: Address, amount: u256): void {
  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const updatedTotalBorrowsVariable = new u256(parseFloat(reserveArgs.totalBorrowsVariable.toString()) + parseFloat(amount.toString()));

  const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  const updatedReserve = new Reserve(reserve.toString(), reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, reserveArgs.lastUpdateTimestamp, reserveArgs.lastUpdateTimelastLiquidityCumulativeIndexstamp, reserveArgs.lastLiquidityCumulativeIndex, reserveArgs.currentLiquidityRate, reserveArgs.totalBorrowsStable, updatedTotalBorrowsVariable, reserveArgs.currentVariableBorrowRate, reserveArgs.currentStableBorrowRate, reserveArgs.currentAverageStableBorrowRate, reserveArgs.lastVariableBorrowCumulativeIndex);
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());

}

function decreaseTotalBorrowsVariable(reserve: Address, amount: u256): void {
  const reserveData = getReserve(new Args().add(reserve.toString()).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  assert(
    reserveArgs.totalBorrowsVariable >= amount,
    "The amount that is being subtracted from the variable total borrows is incorrect"
  );
  const updatedTotalBorrowsVariable = new u256(parseFloat(reserveArgs.totalBorrowsVariable.toString()) - parseFloat(amount.toString()));

  const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  const updatedReserve = new Reserve(reserve.toString(), reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, reserveArgs.lastUpdateTimestamp, reserveArgs.lastUpdateTimelastLiquidityCumulativeIndexstamp, reserveArgs.lastLiquidityCumulativeIndex, reserveArgs.currentLiquidityRate, reserveArgs.totalBorrowsStable, updatedTotalBorrowsVariable, reserveArgs.currentVariableBorrowRate, reserveArgs.currentStableBorrowRate, reserveArgs.currentAverageStableBorrowRate, reserveArgs.lastVariableBorrowCumulativeIndex);
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function calculateLinearInterest(rate: u256, lastUpdateTimestamp: u256): u256 {
  const timeDifference = timestamp() - parseFloat(lastUpdateTimestamp.toString());

  const timeDelta = timeDifference / SECONDS_PER_YEAR;

  return new u256((parseFloat(rate.toString()) * timeDelta) + ONE_UNIT);
}

export function calculateCompoundedInterest(rate: u256, lastUpdateTimestamp: u256): u256 {
  const timeDifference = timestamp() - parseFloat(lastUpdateTimestamp.toString());

  const ratePerSecond = parseFloat(rate.toString()) / SECONDS_PER_YEAR;

  return new u256((ratePerSecond + ONE_UNIT) ** (timeDifference));

}

export function getTotalBorrows(totalBorrowsStable: u256, totalBorrowsVariable: u256): u256 {
  return new u256(parseFloat(totalBorrowsStable.toString()) + parseFloat(totalBorrowsVariable.toString()));
}

function updateReserveInterestRatesAndTimestampInternal(reserve: string, liquidityAdded: u256, liquidityTaken: u256) {

  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();

  const interestRateStrategyAddress = new IReserveInterestRateStrategy(new Address(reserveArgs.interestCalcAddress));

  // (const newLiquidityRate, uint256 newStableRate, uint256 newVariableRate) = interestRateStrategyAddress().calculateInterestRates(,
  const res = interestRateStrategyAddress.calculateInterestRates(
    u64(getReserveAvailableLiquidity(new Args().add(reserve).serialize()).toString()) + u64(liquidityAdded.toString()) - u64(liquidityTaken.toString()),
    u64(reserveArgs.totalBorrowsStable.toString()),
    u64(reserveArgs.totalBorrowsVariable.toString()),
    u64(reserveArgs.currentAverageStableBorrowRate.toString())
  );

  const newLiquidityRate = res[0];
  const newStableRate = res[1];
  const newVariableRate = res[2];

  const updatedCurrentLiquidityRate = new u256(newLiquidityRate);
  const updatedCurrentStableBorrowRate = new u256(newStableRate);
  const updatedCurrentVariableBorrowRate = new u256(newVariableRate);

  //solium-disable-next-line
  const updatedLastUpdateTimestamp = new u256(timestamp());

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(reserve, reserveArgs.name, reserveArgs.symbol, reserveArgs.decimals, reserveArgs.mTokenAddress, reserveArgs.interestCalcAddress, reserveArgs.baseLTV, reserveArgs.LiquidationThreshold, reserveArgs.LiquidationBonus, updatedLastUpdateTimestamp, reserveArgs.lastUpdateTimelastLiquidityCumulativeIndexstamp, reserveArgs.lastLiquidityCumulativeIndex, updatedCurrentLiquidityRate, reserveArgs.totalBorrowsStable, reserveArgs.totalBorrowsVariable, updatedCurrentVariableBorrowRate, updatedCurrentStableBorrowRate, reserveArgs.currentAverageStableBorrowRate, reserveArgs.lastVariableBorrowCumulativeIndex);
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());

}

function setUserUseReserveAsCollateral(reserve: Address, user: Address, useAsCollateral: bool) {
  const userData = getUserReserve(new Args().add(user.toString()).add(reserve.toString()).serialize())
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const updatedUseAsCollateral = useAsCollateral;

  const storageKey = `${USER_KEY}_${user.toString()}_${reserve.toString()}`;
  const updatedUserReserve = new UserReserve(user.toString(), userArgs.principalBorrowBalance, userArgs.lastVariableBorrowCumulativeIndex, userArgs.originationFee, userArgs.stableBorrowRate, userArgs.lastUpdateTimestamp, updatedUseAsCollateral);

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());
}
