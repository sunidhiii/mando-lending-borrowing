import {
  call,
  Context,
  createSC,
  Storage,
  Address,
  transferCoins,
  balance,
  generateEvent,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  bytesToU32,
  bytesToU64,
  stringToBytes,
  u32ToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import { IERC20 } from '../interfaces/IERC20';
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { u256 } from 'as-bignum/assembly';
import { timestamp } from '@massalabs/massa-as-sdk/assembly/std/context';
import { IReserveInterestRateStrategy } from '../interfaces/IReserveInterestStrategy';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider';

const ONE_UNIT = 10 ** 9;
const RESERVE_KEY = 'RESERVE_KEY';
const USER_KEY = 'USER_KEY';
const SECONDS_PER_YEAR = 31536000;

export const ORIGNATION_FEE = 200000;
export const MAS = 'EeeEeeEeeeeEeeeeeEeeeeeeEeeeeeeEEeeeeeeEeeeEeeeeeeEee';

export enum InterestRateMode {
  NONE,
  STABLE,
  VARIABLE,
}

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param binaryArgs - Arguments serialized with Args
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return;
  }

  const args = new Args(binaryArgs);
  const provider = args
    .nextString()
    .expect('Provider Address argument is missing or invalid');

  Storage.set('ADDRESS_PROVIDER_ADDR', provider);

  let mTokenContractCode = args.nextFixedSizeArray<u8>().unwrap();
  Storage.set(
    stringToBytes('mToken_contract_code'),
    StaticArray.fromArray(mTokenContractCode),
  );

  generateEvent(`Constructor called with mToken contract code.`);
}

export function initReserve(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  let reserve: Reserve = args.nextSerializable<Reserve>().unwrap();

  let mTokenContractCode = Storage.get(stringToBytes('mToken_contract_code'));
  let mTokenAddr = createSC(mTokenContractCode);

  const provider = Storage.get('ADDRESS_PROVIDER_ADDR');
  const name = 'Mando Interest bearing '.concat(
    new IERC20(new Address(reserve.addr)).name(),
  );
  const symbol = 'm' + new IERC20(new Address(reserve.addr)).symbol();

  call(
    mTokenAddr,
    'constructor',
    new Args()
      .add(name)
      .add(symbol)
      .add(u8(9))
      .add(u256.Zero)
      .add(reserve.addr)
      .add(provider),
    10 * ONE_UNIT,
  );

  reserve.name = new IERC20(new Address(reserve.addr)).name();
  reserve.symbol = new IERC20(new Address(reserve.addr)).symbol();
  reserve.decimals = new IERC20(new Address(reserve.addr)).decimals();
  reserve.mTokenAddress = mTokenAddr.toString();

  if (reserve.lastLiquidityCumulativeIndex == 0) {
    reserve.lastLiquidityCumulativeIndex = ONE_UNIT;
  }
  if (reserve.lastVariableBorrowCumulativeIndex == 0) {
    reserve.lastVariableBorrowCumulativeIndex = ONE_UNIT;
  }

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserve.addr}`;

  // check reserve does not already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(!reserveExists, 'Reserve already exists');

  // save reserve to storage
  Storage.set(stringToBytes(storageKey), reserve.serialize());

  addReserveToList(reserve.addr);

  generateEvent(
    'ReserveCreated: ' +
      'addr: ' +
      reserve.addr.toString() +
      ', name: ' +
      reserve.name.toString() +
      ', symbol: ' +
      reserve.symbol.toString() +
      ', decimals: ' +
      reserve.decimals.toString() +
      ', mTokenAddress: ' +
      reserve.mTokenAddress.toString() +
      ', interestCalcAddress: ' +
      reserve.interestCalcAddress.toString() +
      ', baseLTV: ' +
      reserve.baseLTV.toString() +
      ', LiquidationThreshold: ' +
      reserve.LiquidationThreshold.toString() +
      ', LiquidationBonus: ' +
      reserve.LiquidationBonus.toString() +
      ', lastUpdateTimestamp: ' +
      reserve.lastUpdateTimestamp.toString() +
      ', lastLiquidityCumulativeIndex: ' +
      reserve.lastLiquidityCumulativeIndex.toString() +
      ', currentLiquidityRate: ' +
      reserve.currentLiquidityRate.toString() +
      ', totalBorrowsStable: ' +
      reserve.totalBorrowsStable.toString() +
      ', totalBorrowsVariable: ' +
      reserve.totalBorrowsVariable.toString() +
      ', currentVariableBorrowRate: ' +
      reserve.currentVariableBorrowRate.toString() +
      ', currentStableBorrowRate: ' +
      reserve.currentStableBorrowRate.toString() +
      ', currentAverageStableBorrowRate: ' +
      reserve.currentAverageStableBorrowRate.toString() +
      ', lastVariableBorrowCumulativeIndex: ' +
      reserve.lastVariableBorrowCumulativeIndex.toString(),
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
  onlyLendingPool();

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
      'UserReserveCreated: ' +
        'addr: ' +
        userReserve.addr.toString() +
        ', reserve: ' +
        reserve.toString() +
        ', principalBorrowBalance: ' +
        userReserve.principalBorrowBalance.toString() +
        ', lastVariableBorrowCumulativeIndex: ' +
        userReserve.lastVariableBorrowCumulativeIndex.toString() +
        ', originationFee: ' +
        userReserve.originationFee.toString() +
        ', stableBorrowRate: ' +
        userReserve.stableBorrowRate.toString() +
        ', lastUpdateTimestamp: ' +
        userReserve.lastUpdateTimestamp.toString() +
        ', useAsCollateral: ' +
        userReserve.useAsCollateral.toString() +
        ', autonomousRewardStrategyEnabled: ' +
        userReserve.autonomousRewardStrategyEnabled.toString(),
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
}

export function viewAllReserves(): StaticArray<u8> {
  let reserveArr = Storage.get(stringToBytes('ALL_RESERVES'));
  return reserveArr;
}

export function transferToReserve(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

  // onlyLendingPoolOrOverlyingAsset(reserve);

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= amount, 'Not enough sent coins');
    transferCoins(Context.callee(), amount);
  } else {
    // assert(Context.transferredCoins() == 0, "User is sending MAS along with tokens");
    new IERC20(new Address(reserve)).transferFrom(
      new Address(user),
      Context.callee(),
      u256.from(amount),
    );
  }
}

export function transferFeeToOwner(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

  const addressProvider = Storage.get('ADDRESS_PROVIDER_ADDR');
  const owner = new ILendingAddressProvider(
    new Address(addressProvider),
  ).getOwner();

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= amount, 'Not enough sent coins');
    transferCoins(new Address(owner), amount);
  } else {
    // assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve)).transferFrom(
      new Address(user),
      new Address(owner),
      u256.from(amount),
    );
  }
}

export function transferToUser(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

  onlyLendingPoolOrOverlyingAsset(reserve);

  if (reserve == MAS) {
    transferCoins(new Address(user), amount);
  } else {
    new IERC20(new Address(reserve)).transfer(
      new Address(user),
      u256.from(amount),
    );
  }
}

export function updateStateOnBorrow(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amountBorrowed = args.nextU64().unwrap();
  const borrowFee = args.nextU64().unwrap();
  const rateMode = args.nextU8().unwrap();

  const data = new Args(
    getUserBorrowBalances(new Args().add(reserve).add(user).serialize()),
  )
    .nextFixedSizeArray<u64>()
    .unwrap();
  const principalBorrowBalance = data[0];
  // const compoundedBalance = data[1];
  const balanceIncrease = data[2];

  updateReserveStateOnBorrowInternal(
    reserve,
    user,
    principalBorrowBalance,
    balanceIncrease,
    amountBorrowed,
    rateMode,
  );

  updateUserStateOnBorrowInternal(
    reserve,
    user,
    amountBorrowed,
    balanceIncrease,
    borrowFee,
    rateMode,
  );

  updateReserveInterestRatesAndTimestampInternal(reserve, 0, amountBorrowed);
}

export function updateStateOnRepay(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const paybackAmountMinusFees = args.nextU64().unwrap();
  const originationFeeRepaid = args.nextU64().unwrap();
  const balanceIncrease = args.nextU64().unwrap();
  const repaidWholeLoan = args.nextBool().unwrap();

  updateReserveStateOnRepayInternal(
    reserve,
    user,
    paybackAmountMinusFees,
    balanceIncrease,
  );
  updateUserStateOnRepayInternal(
    reserve,
    user,
    paybackAmountMinusFees,
    originationFeeRepaid,
    balanceIncrease,
    repaidWholeLoan,
  );

  updateReserveInterestRatesAndTimestampInternal(
    reserve,
    paybackAmountMinusFees,
    0,
  );
}

export function updateStateOnRedeem(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amountRedeemed = args.nextU64().unwrap();
  const userRedeemedEverything = args.nextBool().unwrap();

  updateCumulativeIndexes(reserve);
  updateReserveInterestRatesAndTimestampInternal(reserve, 0, amountRedeemed);

  // if user redeemed everything the useReserveAsCollateral flag is reset
  if (userRedeemedEverything) {
    setUserUseReserveAsCollateral(reserve, user, false);
  }
}

export function updateStateOnDeposit(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();
  const isFirstDeposit = args.nextBool().unwrap();

  updateCumulativeIndexes(reserve);
  updateReserveInterestRatesAndTimestampInternal(reserve, amount, 0);

  if (isFirstDeposit) {
    setUserUseReserveAsCollateral(reserve, user, true);
  }
}

export function getReserveAvailableLiquidity(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();

  let bal: u64 = 0;

  if (reserve == MAS) {
    bal = balance();
  } else {
    const amount = new IERC20(new Address(reserve)).balanceOf(Context.callee());
    bal = u64.parse(amount.toString());
  }

  return u64ToBytes(bal);
}

export function getReserveTotalLiquidity(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();

  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const reserveAvailableLiq = bytesToU64(
    getReserveAvailableLiquidity(new Args().add(reserve).serialize()),
  );
  const reserveTotalBorrows = getTotalBorrows(
    reserveArgs.totalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
  );

  const reserveTotalLiquidity = reserveAvailableLiq + reserveTotalBorrows;
  return u64ToBytes(reserveTotalLiquidity);
}

export function getUserBasicReserveData(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const underlyingBalance = getUserUnderlyingAssetBalance(reserve, user);
  let userReserveData: Array<u64> = new Array(3);
  userReserveData[0] = underlyingBalance;

  const compoundedBal = getCompoundedBorrowBalance(reserve, user);
  userReserveData[1] = compoundedBal;
  userReserveData[2] = userArgs.originationFee;

  generateEvent(
    `User basic reserve data: ${underlyingBalance}, ${compoundedBal} and ${userArgs.originationFee}`,
  );

  return new Args().add(userReserveData).serialize();
}

export function getUserBorrowBalances(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  let userBorrows: Array<u64> = new Array(3);

  let principal = userArgs.principalBorrowBalance;
  const compoundBal = getCompoundedBorrowBalance(reserve, user);

  userBorrows[0] = principal;
  userBorrows[1] = compoundBal;
  const balIncrease = compoundBal > principal ? compoundBal - principal : 0;
  userBorrows[2] = balIncrease;

  return new Args().add(userBorrows).serialize();
}

export function getNormalizedIncome(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const cumulated = u64(
    calculateLinearInterest(
      reserveArgs.currentLiquidityRate,
      reserveArgs.lastUpdateTimestamp,
    ) *
      (f64(reserveArgs.lastLiquidityCumulativeIndex) / f64(ONE_UNIT)),
  );
  return u64ToBytes(cumulated);
}

export function getUserCurrentBorrowRateMode(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  if (userArgs.principalBorrowBalance == 0) {
    return u32ToBytes(InterestRateMode.NONE);
  }

  return userArgs.stableBorrowRate > 0
    ? u32ToBytes(InterestRateMode.STABLE)
    : u32ToBytes(InterestRateMode.VARIABLE);
}

export function setUserAutonomousRewardStrategy(
  binaryArgs: StaticArray<u8>,
): void {
  // onlyUser
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const autonomousRewardStrategy = args.nextBool().unwrap();

  const userData = getUserReserve(
    new Args().add(Context.caller().toString()).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const updatedAutonomousRewardStrategyEnabled = autonomousRewardStrategy;

  const storageKey = `${USER_KEY}_${Context.caller().toString()}_${reserve}`;
  const updatedUserReserve = new UserReserve(
    Context.caller().toString(),
    userArgs.principalBorrowBalance,
    userArgs.lastVariableBorrowCumulativeIndex,
    userArgs.originationFee,
    userArgs.stableBorrowRate,
    userArgs.lastUpdateTimestamp,
    userArgs.useAsCollateral,
    updatedAutonomousRewardStrategyEnabled,
  );

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());
}

export function setAddressProvider(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);
  const provider = args
    .nextString()
    .expect('Provider Address argument is missing or invalid');

  Storage.set('ADDRESS_PROVIDER_ADDR', provider);
}

export function setMTokenContractCode(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);

  const mTokenContractCode = args.nextFixedSizeArray<u8>().unwrap();
  Storage.set(
    stringToBytes('mToken_contract_code'),
    StaticArray.fromArray(mTokenContractCode),
  );
}

function addReserveToList(reserve: string): void {
  if (!Storage.has(stringToBytes('ALL_RESERVES'))) {
    Storage.set(
      stringToBytes('ALL_RESERVES'),
      new Args().add<Array<string>>([]).serialize(),
    );
  }

  let reserveArr = new Args(Storage.get(stringToBytes('ALL_RESERVES')))
    .nextStringArray()
    .unwrap();
  reserveArr.push(reserve);
  Storage.set(
    stringToBytes('ALL_RESERVES'),
    new Args().add<Array<string>>(reserveArr).serialize(),
  );
}

function getUserUnderlyingAssetBalance(reserve: string, user: string): u64 {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const mTokenAddr = new IERC20(new Address(reserveArgs.mTokenAddress));
  return u64.parse(mTokenAddr.balanceOf(new Address(user)).toString());
}

/**
 * This functions updates the cumulative indexes.
 *
 * @returns The serialized address found.
 *
 */
function updateCumulativeIndexes(reserve: string): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const totalBorrows = getTotalBorrows(
    reserveArgs.totalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
  );

  var updatedLastLiquidityCumulativeIndex =
    reserveArgs.lastLiquidityCumulativeIndex;
  var updatedLastVariableBorrowCumulativeIndex =
    reserveArgs.lastVariableBorrowCumulativeIndex;
  if (totalBorrows > 0) {
    // only cumulating if there is any income being produced
    const cumulatedLiquidityInterest = calculateLinearInterest(
      reserveArgs.currentLiquidityRate,
      reserveArgs.lastUpdateTimestamp,
    );
    updatedLastLiquidityCumulativeIndex = u64(
      cumulatedLiquidityInterest *
        (f64(reserveArgs.lastLiquidityCumulativeIndex) / f64(ONE_UNIT)),
    );
    const cumulatedVariableBorrowInterest = calculateCompoundedInterest(
      reserveArgs.currentVariableBorrowRate,
      reserveArgs.lastUpdateTimestamp,
    );
    updatedLastVariableBorrowCumulativeIndex = u64(
      cumulatedVariableBorrowInterest *
        (f64(reserveArgs.lastVariableBorrowCumulativeIndex) / f64(ONE_UNIT)),
    );
  }

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(
    reserve,
    reserveArgs.name,
    reserveArgs.symbol,
    reserveArgs.decimals,
    reserveArgs.mTokenAddress,
    reserveArgs.interestCalcAddress,
    reserveArgs.baseLTV,
    reserveArgs.LiquidationThreshold,
    reserveArgs.LiquidationBonus,
    reserveArgs.lastUpdateTimestamp,
    updatedLastLiquidityCumulativeIndex,
    reserveArgs.currentLiquidityRate,
    reserveArgs.totalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
    reserveArgs.currentVariableBorrowRate,
    reserveArgs.currentStableBorrowRate,
    reserveArgs.currentAverageStableBorrowRate,
    updatedLastVariableBorrowCumulativeIndex,
  );

  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function updateReserveStateOnRepayInternal(
  reserve: string,
  user: string,
  paybackAmountMinusFees: u64,
  balanceIncrease: u64,
): void {
  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const borrowRateMode: InterestRateMode = bytesToU32(
    getUserCurrentBorrowRateMode(new Args().add(reserve).add(user).serialize()),
  );

  // update the indexes
  updateCumulativeIndexes(reserve);

  // compound the cumulated interest to the borrow balance and then subtracting the payback amount
  if (borrowRateMode == InterestRateMode.STABLE) {
    increaseTotalBorrowsStableAndUpdateAverageRate(
      reserve,
      balanceIncrease,
      userArgs.stableBorrowRate,
    );

    decreaseTotalBorrowsStableAndUpdateAverageRate(
      reserve,
      paybackAmountMinusFees,
      userArgs.stableBorrowRate,
    );
  } else {
    increaseTotalBorrowsVariable(reserve, balanceIncrease);
    decreaseTotalBorrowsVariable(reserve, paybackAmountMinusFees);
  }
}

function updateUserStateOnRepayInternal(
  reserve: string,
  user: string,
  paybackAmountMinusFees: u64,
  originationFeeRepaid: u64,
  balanceIncrease: u64,
  repaidWholeLoan: bool,
): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  // update the user principal borrow balance, adding the cumulated interest and then subtracting the payback amount
  const updatedPrincipalBorrowBalance: u64 =
    userArgs.principalBorrowBalance + balanceIncrease > paybackAmountMinusFees
      ? userArgs.principalBorrowBalance +
        balanceIncrease -
        paybackAmountMinusFees
      : 0;
  let updatedLastVariableBorrowCumulativeIndex =
    reserveArgs.lastVariableBorrowCumulativeIndex;

  // if the balance decrease is equal to the previous principal (user is repaying the whole loan)
  // and the rate mode is stable, we reset the interest rate mode of the user
  let updatedStableBorrowRate = userArgs.stableBorrowRate;
  if (repaidWholeLoan) {
    updatedStableBorrowRate = 0;
    updatedLastVariableBorrowCumulativeIndex = 0;
  }
  const updatedOriginationFee: u64 =
    userArgs.originationFee > originationFeeRepaid
      ? userArgs.originationFee - originationFeeRepaid
      : 0;

  const updatedLastUpdateTimestamp = timestamp();

  const storageKey = `${USER_KEY}_${user}_${reserve}`;
  const updatedUserReserve = new UserReserve(
    user,
    updatedPrincipalBorrowBalance,
    updatedLastVariableBorrowCumulativeIndex,
    updatedOriginationFee,
    updatedStableBorrowRate,
    updatedLastUpdateTimestamp,
    userArgs.useAsCollateral,
    userArgs.autonomousRewardStrategyEnabled,
  );

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());
}

function updateUserStateOnBorrowInternal(
  reserve: string,
  user: string,
  amountBorrowed: u64,
  balanceIncrease: u64,
  fee: u64,
  rateMode: InterestRateMode,
): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  let updatedStableBorrowRate = userArgs.stableBorrowRate;
  let updatedLastVariableBorrowCumulativeIndex =
    userArgs.lastVariableBorrowCumulativeIndex;

  if (rateMode == InterestRateMode.STABLE) {
    // stable
    // reset the user variable index, and update the stable rate
    updatedStableBorrowRate = reserveArgs.currentStableBorrowRate;
    updatedLastVariableBorrowCumulativeIndex = 0;
  } else if (rateMode == InterestRateMode.VARIABLE) {
    // variable
    // reset the user stable rate, and store the new borrow index
    updatedStableBorrowRate = 0;
    updatedLastVariableBorrowCumulativeIndex =
      reserveArgs.lastVariableBorrowCumulativeIndex;
  } else {
    abort('Invalid borrow rate mode');
  }
  // increase the principal borrows and the origination fee
  const updatedPrincipalBorrowBalance =
    userArgs.principalBorrowBalance + amountBorrowed + balanceIncrease;
  const updatedOriginationFee = userArgs.originationFee + fee;

  const updatedLastUpdateTimestamp = timestamp();

  const storageKey = `${USER_KEY}_${user}_${reserve}`;
  const updatedUserReserve = new UserReserve(
    user,
    updatedPrincipalBorrowBalance,
    updatedLastVariableBorrowCumulativeIndex,
    updatedOriginationFee,
    updatedStableBorrowRate,
    updatedLastUpdateTimestamp,
    userArgs.useAsCollateral,
    userArgs.autonomousRewardStrategyEnabled,
  );

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());
}

function updateReserveTotalBorrowsByRateModeInternal(
  reserve: string,
  user: string,
  principalBalance: u64,
  balanceIncrease: u64,
  amountBorrowed: u64,
  newBorrowRateMode: InterestRateMode,
): void {
  const previousRateMode: InterestRateMode = bytesToU32(
    getUserCurrentBorrowRateMode(new Args().add(reserve).add(user).serialize()),
  );

  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  if (previousRateMode == InterestRateMode.STABLE) {
    const userData = getUserReserve(
      new Args().add(user).add(reserve).serialize(),
    );
    const userArgs = new Args(userData)
      .nextSerializable<UserReserve>()
      .unwrap();

    decreaseTotalBorrowsStableAndUpdateAverageRate(
      reserve,
      principalBalance,
      userArgs.stableBorrowRate,
    );
  } else if (previousRateMode == InterestRateMode.VARIABLE) {
    decreaseTotalBorrowsVariable(reserve, principalBalance);
  }

  const newPrincipalAmount =
    principalBalance + balanceIncrease + amountBorrowed;
  if (newBorrowRateMode == InterestRateMode.STABLE) {
    increaseTotalBorrowsStableAndUpdateAverageRate(
      reserve,
      newPrincipalAmount,
      reserveArgs.currentStableBorrowRate,
    );
  } else if (newBorrowRateMode == InterestRateMode.VARIABLE) {
    increaseTotalBorrowsVariable(reserve, newPrincipalAmount);
  } else {
    abort('Invalid new borrow rate mode');
  }
}

function updateReserveStateOnBorrowInternal(
  reserve: string,
  user: string,
  principalBorrowBalance: u64,
  balanceIncrease: u64,
  amountBorrowed: u64,
  rateMode: InterestRateMode,
): void {
  updateCumulativeIndexes(reserve);

  // increasing reserve total borrows to account for the new borrow balance of the user
  updateReserveTotalBorrowsByRateModeInternal(
    reserve,
    user,
    principalBorrowBalance,
    balanceIncrease,
    amountBorrowed,
    rateMode,
  );
}

function getCompoundedBorrowBalance(reserve: string, user: string): u64 {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  if (userArgs.principalBorrowBalance == 0) return 0;

  let principalBorrowBalanceRay = userArgs.principalBorrowBalance;
  let compoundedBalance: u64 = 0;
  let cumulatedInterest: f64 = 0.0;

  if (userArgs.stableBorrowRate > 0) {
    cumulatedInterest = calculateCompoundedInterest(
      userArgs.stableBorrowRate,
      userArgs.lastUpdateTimestamp,
    );
  } else {
    // variable interest
    if (userArgs.lastVariableBorrowCumulativeIndex > 0) {
      const compInterest = calculateCompoundedInterest(
        reserveArgs.currentVariableBorrowRate,
        reserveArgs.lastUpdateTimestamp,
      );
      cumulatedInterest =
        (compInterest * f64(reserveArgs.lastVariableBorrowCumulativeIndex)) /
        f64(userArgs.lastVariableBorrowCumulativeIndex);
    }
  }

  compoundedBalance = u64(
    (f64(principalBorrowBalanceRay) * cumulatedInterest) / f64(ONE_UNIT),
  );

  if (compoundedBalance == userArgs.principalBorrowBalance) {
    if (userArgs.lastUpdateTimestamp != timestamp()) {
      return userArgs.principalBorrowBalance;
    }
  }

  return compoundedBalance;
}

function increaseTotalBorrowsStableAndUpdateAverageRate(
  reserve: string,
  amount: u64,
  rate: u64,
): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const previousTotalBorrowStable = reserveArgs.totalBorrowsStable;
  // updating reserve borrows stable
  const updatedTotalBorrowsStable = reserveArgs.totalBorrowsStable + amount;

  // update the average stable rate
  // weighted average of all the borrows
  const weightedLastBorrow = f64(amount) * f64(rate);
  const weightedPreviousTotalBorrows =
    f64(previousTotalBorrowStable) *
    f64(reserveArgs.currentAverageStableBorrowRate);

  let updatedCurrentAverageStableBorrowRate: u64 =
    reserveArgs.currentAverageStableBorrowRate;

  if (updatedTotalBorrowsStable > 0) {
    updatedCurrentAverageStableBorrowRate = u64(
      (weightedLastBorrow + weightedPreviousTotalBorrows) /
        f64(updatedTotalBorrowsStable),
    );
  }

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(
    reserve,
    reserveArgs.name,
    reserveArgs.symbol,
    reserveArgs.decimals,
    reserveArgs.mTokenAddress,
    reserveArgs.interestCalcAddress,
    reserveArgs.baseLTV,
    reserveArgs.LiquidationThreshold,
    reserveArgs.LiquidationBonus,
    reserveArgs.lastUpdateTimestamp,
    reserveArgs.lastLiquidityCumulativeIndex,
    reserveArgs.currentLiquidityRate,
    updatedTotalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
    reserveArgs.currentVariableBorrowRate,
    reserveArgs.currentStableBorrowRate,
    updatedCurrentAverageStableBorrowRate,
    reserveArgs.lastVariableBorrowCumulativeIndex,
  );
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function decreaseTotalBorrowsStableAndUpdateAverageRate(
  reserve: string,
  amount: u64,
  rate: u64,
): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  assert(
    reserveArgs.totalBorrowsStable >= amount,
    'Invalid amount to decrease',
  );

  const previousTotalBorrowStable = reserveArgs.totalBorrowsStable;

  // updating reserve borrows stable
  const updatedTotalBorrowsStable =
    reserveArgs.totalBorrowsStable > amount
      ? reserveArgs.totalBorrowsStable - amount
      : 0;
  var updatedCurrentAverageStableBorrowRate: u64 =
    reserveArgs.currentAverageStableBorrowRate;
  if (updatedTotalBorrowsStable == 0) {
    updatedCurrentAverageStableBorrowRate = 0; // no income if there are no stable rate borrows
    return;
  }

  // update the average stable rate
  // weighted average of all the borrows
  const weightedLastBorrow = f64(amount) * f64(rate);
  const weightedPreviousTotalBorrows =
    f64(previousTotalBorrowStable) * f64(updatedCurrentAverageStableBorrowRate);

  assert(
    weightedPreviousTotalBorrows >= weightedLastBorrow,
    "The amounts to subtract don't match",
  );

  if (updatedTotalBorrowsStable > 0) {
    const weightedFinalBorrow: f64 =
      weightedPreviousTotalBorrows > weightedLastBorrow
        ? weightedPreviousTotalBorrows - weightedLastBorrow
        : 0.0;
    updatedCurrentAverageStableBorrowRate = u64(
      weightedFinalBorrow / f64(updatedTotalBorrowsStable),
    );
  }

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(
    reserve,
    reserveArgs.name,
    reserveArgs.symbol,
    reserveArgs.decimals,
    reserveArgs.mTokenAddress,
    reserveArgs.interestCalcAddress,
    reserveArgs.baseLTV,
    reserveArgs.LiquidationThreshold,
    reserveArgs.LiquidationBonus,
    reserveArgs.lastUpdateTimestamp,
    reserveArgs.lastLiquidityCumulativeIndex,
    reserveArgs.currentLiquidityRate,
    updatedTotalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
    reserveArgs.currentVariableBorrowRate,
    reserveArgs.currentStableBorrowRate,
    updatedCurrentAverageStableBorrowRate,
    reserveArgs.lastVariableBorrowCumulativeIndex,
  );
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function increaseTotalBorrowsVariable(reserve: string, amount: u64): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const updatedTotalBorrowsVariable = reserveArgs.totalBorrowsVariable + amount;

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(
    reserve,
    reserveArgs.name,
    reserveArgs.symbol,
    reserveArgs.decimals,
    reserveArgs.mTokenAddress,
    reserveArgs.interestCalcAddress,
    reserveArgs.baseLTV,
    reserveArgs.LiquidationThreshold,
    reserveArgs.LiquidationBonus,
    reserveArgs.lastUpdateTimestamp,
    reserveArgs.lastLiquidityCumulativeIndex,
    reserveArgs.currentLiquidityRate,
    reserveArgs.totalBorrowsStable,
    updatedTotalBorrowsVariable,
    reserveArgs.currentVariableBorrowRate,
    reserveArgs.currentStableBorrowRate,
    reserveArgs.currentAverageStableBorrowRate,
    reserveArgs.lastVariableBorrowCumulativeIndex,
  );
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function decreaseTotalBorrowsVariable(reserve: string, amount: u64): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  assert(
    reserveArgs.totalBorrowsVariable >= amount,
    'The amount that is being subtracted from the variable total borrows is incorrect',
  );

  const updatedTotalStableBorrows =
    reserveArgs.totalBorrowsVariable > amount
      ? reserveArgs.totalBorrowsVariable - amount
      : 0;
  const updatedTotalBorrowsVariable = updatedTotalStableBorrows;

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(
    reserve,
    reserveArgs.name,
    reserveArgs.symbol,
    reserveArgs.decimals,
    reserveArgs.mTokenAddress,
    reserveArgs.interestCalcAddress,
    reserveArgs.baseLTV,
    reserveArgs.LiquidationThreshold,
    reserveArgs.LiquidationBonus,
    reserveArgs.lastUpdateTimestamp,
    reserveArgs.lastLiquidityCumulativeIndex,
    reserveArgs.currentLiquidityRate,
    reserveArgs.totalBorrowsStable,
    updatedTotalBorrowsVariable,
    reserveArgs.currentVariableBorrowRate,
    reserveArgs.currentStableBorrowRate,
    reserveArgs.currentAverageStableBorrowRate,
    reserveArgs.lastVariableBorrowCumulativeIndex,
  );
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function calculateLinearInterest(rate: u64, lastUpdateTimestamp: u64): f64 {
  const timeDifference = timestamp() - lastUpdateTimestamp;

  const timeDelta =
    (f64(timeDifference) * f64(ONE_UNIT)) / f64(SECONDS_PER_YEAR);

  return (f64(rate) * timeDelta) / f64(ONE_UNIT) + f64(ONE_UNIT);
}

function calculateCompoundedInterest(rate: u64, lastUpdateTimestamp: u64): f64 {
  const exp = timestamp() - lastUpdateTimestamp;
  if (exp == 0) {
    return f64(ONE_UNIT);
  }
  const expMinusOne = exp - 1;
  const expMinusTwo = exp > 2 ? exp - 2 : 0;

  const ratePerSecond = f64(rate) / f64(SECONDS_PER_YEAR);

  const basePowerTwo = (ratePerSecond * ratePerSecond) / f64(ONE_UNIT);
  const basePowerThree = (basePowerTwo * ratePerSecond) / f64(ONE_UNIT);

  const secondTerm = (f64(exp) * f64(expMinusOne) * basePowerTwo) / 2.0;
  const thirdTerm =
    (f64(exp) * f64(expMinusOne) * f64(expMinusTwo) * basePowerThree) / 6.0;

  return f64(ONE_UNIT) + ratePerSecond * f64(exp) + secondTerm + thirdTerm;
}

function getTotalBorrows(
  totalBorrowsStable: u64,
  totalBorrowsVariable: u64,
): u64 {
  return totalBorrowsStable + totalBorrowsVariable;
}

function updateReserveInterestRatesAndTimestampInternal(
  reserve: string,
  liquidityAdded: u64,
  liquidityTaken: u64,
): void {
  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();

  const interestRateStrategyAddress = new IReserveInterestRateStrategy(
    new Address(reserveArgs.interestCalcAddress),
  );

  const reserveLiq = bytesToU64(
    getReserveAvailableLiquidity(new Args().add(reserve).serialize()),
  );

  const totalLiq: u64 =
    reserveLiq + liquidityAdded > liquidityTaken
      ? reserveLiq + liquidityAdded - liquidityTaken
      : 0;

  const res: Array<u64> = interestRateStrategyAddress.calculateInterestRates(
    totalLiq,
    reserveArgs.totalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
    reserveArgs.currentAverageStableBorrowRate,
  );

  const newLiquidityRate = res[0];
  const newStableRate = res[1];
  const newVariableRate = res[2];

  const updatedCurrentLiquidityRate = newLiquidityRate;
  const updatedCurrentStableBorrowRate = newStableRate;
  const updatedCurrentVariableBorrowRate = newVariableRate;

  const updatedLastUpdateTimestamp = timestamp();

  const storageKey = `${RESERVE_KEY}_${reserve}`;
  const updatedReserve = new Reserve(
    reserve,
    reserveArgs.name,
    reserveArgs.symbol,
    reserveArgs.decimals,
    reserveArgs.mTokenAddress,
    reserveArgs.interestCalcAddress,
    reserveArgs.baseLTV,
    reserveArgs.LiquidationThreshold,
    reserveArgs.LiquidationBonus,
    updatedLastUpdateTimestamp,
    reserveArgs.lastLiquidityCumulativeIndex,
    updatedCurrentLiquidityRate,
    reserveArgs.totalBorrowsStable,
    reserveArgs.totalBorrowsVariable,
    updatedCurrentVariableBorrowRate,
    updatedCurrentStableBorrowRate,
    reserveArgs.currentAverageStableBorrowRate,
    reserveArgs.lastVariableBorrowCumulativeIndex,
  );
  Storage.set(stringToBytes(storageKey), updatedReserve.serialize());
}

function setUserUseReserveAsCollateral(
  reserve: string,
  user: string,
  useAsCollateral: bool,
): void {
  const userData = getUserReserve(
    new Args().add(user).add(reserve).serialize(),
  );
  const userArgs = new Args(userData).nextSerializable<UserReserve>().unwrap();

  const updatedUseAsCollateral = useAsCollateral;

  const storageKey = `${USER_KEY}_${user}_${reserve}`;
  const updatedUserReserve = new UserReserve(
    user,
    userArgs.principalBorrowBalance,
    userArgs.lastVariableBorrowCumulativeIndex,
    userArgs.originationFee,
    userArgs.stableBorrowRate,
    userArgs.lastUpdateTimestamp,
    updatedUseAsCollateral,
    userArgs.autonomousRewardStrategyEnabled,
  );

  Storage.set(stringToBytes(storageKey), updatedUserReserve.serialize());
}

function onlyOwner(): void {
  const addressProvider = Storage.get('ADDRESS_PROVIDER_ADDR');
  const owner = new ILendingAddressProvider(
    new Address(addressProvider),
  ).getOwner();

  assert(Context.caller().toString() === owner, 'Caller is not the owner');
}

function onlyLendingPool(): void {
  const addressProvider = new ILendingAddressProvider(
    new Address(Storage.get('ADDRESS_PROVIDER_ADDR')),
  );
  const pool = new Address(addressProvider.getLendingPool());

  assert(Context.caller() === pool, 'Caller is not lending pool');
}

function onlyLendingPoolOrOverlyingAsset(reserve: string): void {
  const addressProvider = new ILendingAddressProvider(
    new Address(Storage.get('ADDRESS_PROVIDER_ADDR')),
  );
  const pool = new Address(addressProvider.getLendingPool());

  const reserveData = getReserve(new Args().add(reserve).serialize());
  const reserveArgs = new Args(reserveData)
    .nextSerializable<Reserve>()
    .unwrap();
  const mToken = new Address(reserveArgs.mTokenAddress);

  assert(
    Context.caller() === pool || Context.caller() === mToken,
    'Caller is not lending pool or overlying asset',
  );
}
