
import { Address, Context, Storage, call, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, u64ToBytes } from '@massalabs/as-types';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { IERC20 } from '../interfaces/IERC20';
import UserReserve from '../helpers/UserReserve';
import { ILendingDataProvider } from '../interfaces/ILendingDataProvider';
import { IFeeProvider } from '../interfaces/IFeeProvider';
import { InterestRateMode } from './LendingCore';
import { u256 } from 'as-bignum/assembly';
import { u64 } from 'assemblyscript/std/assembly/builtins';

// const ONE_UNIT = 10 ** 9;

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
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  Storage.set(
    'ADDRESS_PROVIDER_ADDR',
    provider
  );

  // const core = provider.getCore();
  // const core = new Args(providerAddress).nextString().unwrap();
  // Storage.set(
  //   'CORE_ADDR',
  //   core.toString(),
  // );

  // const feeProvider = provider.getFeeProvider();
  // Storage.set(
  //     'FEE_PROVIDER',
  //     feeProvider.toString(),
  // );

  generateEvent(`Pool contract called with address provider.`);

}

export function deposit(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const amount = args.nextU64().expect('No amount provided');

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const userReserve = new UserReserve(Context.caller().toString(), 0, 0, 0, 0, 0, true, false);
  // call(new Address(Storage.get('CORE_ADDR')), "initUser", new Args().add(userReserve).add(reserve), 10 * ONE_UNIT);
  core.initUser(userReserve, reserve);

  const mToken = new IERC20(new Address(core.getReserve(reserve).mTokenAddress));
  const isFirstDeposit: bool = mToken.balanceOf(Context.caller()) == 0;

  // to-do Update states for deposit
  core.updateStateOnDeposit(reserve, Context.caller().toString(), amount, isFirstDeposit);

  // const mTokenData = call(new Address(Storage.get('CORE_ADDR')), "getReserve", new Args().add(reserve), 10 * ONE_UNIT);
  // const mTokenAddr = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  // const mToken = new IERC20(new Address(mTokenAddr.mTokenAddress));

  mToken.mintOnDeposit(Context.caller(), amount);
  core.transferToReserve(new Address(reserve), Context.caller(), amount);

  generateEvent(`Deposited ${amount} tokens to the pool with first deposit ${isFirstDeposit}`);

}

export function borrow(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const amount = args.nextU64().expect('No amount provided');
  const interestRateMode = args.nextU8().expect('No interest rate mode provided');

  assert(interestRateMode == 1 || interestRateMode == 2, "Invalid interest rate mode selected");

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const availableLiquidity = core.getReserveAvailableLiquidity(reserve);
  assert(availableLiquidity >= amount, 'Not enough liquidity available in this reserve');

  const dataProvider = new ILendingDataProvider(new Address(addressProvider.getDataProvider()));
  const userData = dataProvider.calculateUserGlobalData(Context.caller().toString());
  const userCollateralBalanceUSD = userData[1];
  const userBorrowBalanceUSD = userData[2];
  const userTotalFeesUSD = userData[3];
  const currentLtv = userData[4];
  const currentLiquidationThreshold = userData[5];

  const healthFactorBelowThreshold = dataProvider.calculateUserHealthFactorBelowThresh(userCollateralBalanceUSD, userBorrowBalanceUSD, userTotalFeesUSD, u8(currentLiquidationThreshold));

  assert(userCollateralBalanceUSD > 0, "The collateral balance is 0");
  assert(!healthFactorBelowThreshold, "The borrower can already be liquidated so he cannot borrow more");

  const feeProvider = new IFeeProvider(new Address(addressProvider.getFeeProvider()))

  const borrowFee = feeProvider.calculateLoanOriginationFee(amount);
  assert(borrowFee > 0, "The amount to borrow is too small");

  const amountOfCollateralNeededUSD = dataProvider.calculateCollateralNeededInUSD(reserve, amount, borrowFee, userBorrowBalanceUSD, userTotalFeesUSD, u8(currentLtv));
  assert(amountOfCollateralNeededUSD <= userCollateralBalanceUSD, "There is not enough collateral to cover a new borrow");

  if (interestRateMode == InterestRateMode.STABLE) {
    // assert(core.isUserAllowedToBorrowAtStable(reserve, Context.caller(), amount), "User cannot borrow the selected amount with a stable rate");

    // const maxLoanPercent = parametersProvider.getMaxStableRateBorrowSizePercent();
    const maxLoanSizeStable = u64((f64(availableLiquidity) * f64(25)) / f64(100));

    assert(amount <= maxLoanSizeStable, "User is trying to borrow too much liquidity at a stable rate");
  }

  //all conditions passed - borrow is accepted (vars.finalUserBorrowRate, vars.borrowBalanceIncrease)
  core.updateStateOnBorrow(reserve, Context.caller().toString(), amount, borrowFee, interestRateMode);

  core.transferToUser(new Address(reserve), Context.caller(), amount);

  generateEvent(`Borrowed ${amount} tokens from the pool`);

}

export function repay(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const amount = args.nextU64().expect('No amount provided');

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const data = core.getUserBorrowBalances(reserve, Context.caller().toString());
  // const principalBorrowBalance = data[0];
  const compoundedBorrowBalance = data[1];
  const borrowBalanceIncrease = data[2];

  const userOriginationFee = core.getUserReserve(Context.caller(), reserve).originationFee;

  assert(compoundedBorrowBalance > 0, "The user does not have any borrow pending");

  let paybackAmount = compoundedBorrowBalance + userOriginationFee;

  if (amount < paybackAmount) {
    paybackAmount = amount;
  }

  if (paybackAmount <= userOriginationFee) {
    core.updateStateOnRepay(reserve, Context.caller().toString(), 0, paybackAmount, borrowBalanceIncrease, false);
    core.transferFeeToOwner(reserve, Context.caller(), paybackAmount)

    generateEvent(`Repayed ${amount} tokens to the pool`);
    // return;
  }
  else {
    let paybackAmountMinusFees = paybackAmount - userOriginationFee;
    core.updateStateOnRepay(reserve, Context.caller().toString(), paybackAmountMinusFees, userOriginationFee, borrowBalanceIncrease, (compoundedBorrowBalance == paybackAmountMinusFees));

    // if the user didn't repay the origination fee, transfer the fee to the fee collection address
    if (userOriginationFee > 0) {
      core.transferFeeToOwner(reserve, Context.caller(), userOriginationFee)
    }

    //sending the total msg.value if the transfer is USD.
    //the transferToReserve() function will take care of sending the
    //excess USD back to the caller
    core.transferToReserve(new Address(reserve), Context.caller(), paybackAmountMinusFees);

    generateEvent(`Repayed ${amount} tokens to the pool`);
  }

}

export function redeemUnderlying(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const user = args.nextString().expect('No reserve address provided');
  const amount = args.nextU64().expect('No amount provided');
  const mTokenBalanceAfterRedeem = args.nextU64().expect('No after balance provided');

  onlyOverlyingAsset(reserve);

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const availableLiq = core.getReserveAvailableLiquidity(reserve);

  assert(availableLiq >= amount, 'Not enough liquidity');

  // update State On Redeem
  core.updateStateOnRedeem(reserve, user, amount, mTokenBalanceAfterRedeem == 0);
  core.transferToUser(new Address(reserve), new Address(user), amount);

  generateEvent(`Redeemed ${amount} tokens from the pool`);

}

export function depositRewards(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const user = args.nextString().expect('No user address provided');
  const amount = args.nextU64().expect('No amount provided');

  // onlyOverlyingAsset(reserve);
  // onlyOverlyingAssetOrBaseToken();

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const userReserve = new UserReserve(user, 0, 0, 0, 0, 0, true, false);
  core.initUser(userReserve, reserve);

  const rewardMToken = new Address(core.getReserve(reserve).mTokenAddress);
  const isFirstDeposit: bool = new IERC20(rewardMToken).balanceOf(Context.caller()) == 0;

  core.updateStateOnDeposit(reserve, user, amount, isFirstDeposit);

  const storageKey = `RESERVE_KEY_${reserve}`;
  const reserveExists = Storage.hasOf(core._origin, stringToBytes(storageKey));
  assert(reserveExists, "Base token reserve doesn't exist!")

  new IERC20(rewardMToken).mint(new Address(user), u256.fromU64(amount));

  const userIndexStorageKey = `USER_INDEX_${user}`;
  const index = core.getNormalizedIncome(reserve)
  call(rewardMToken, 'setMyKey', new Args().add(userIndexStorageKey).add(index), 10)

  generateEvent(`Deposited ${amount} base tokens to the pool`);

}

// function setUserUseReserveAsCollateral(address _reserve, bool _useAsCollateral)
// external
// nonReentrant
// onlyActiveReserve(_reserve)
// onlyUnfreezedReserve(_reserve)
// {
// uint256 underlyingBalance = core.getUserUnderlyingAssetBalance(_reserve, msg.sender);

// require(underlyingBalance > 0, "User does not have any liquidity deposited");

// require(
//     dataProvider.balanceDecreaseAllowed(_reserve, msg.sender, underlyingBalance),
//     "User deposit is already being used as collateral"
// );

// core.setUserUseReserveAsCollateral(_reserve, msg.sender, _useAsCollateral);

// if (_useAsCollateral) {
//     emit ReserveUsedAsCollateralEnabled(_reserve, msg.sender);
// } else {
//     emit ReserveUsedAsCollateralDisabled(_reserve, msg.sender);
// }
// }

export function setAddressProvider(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  Storage.set(
    'ADDRESS_PROVIDER_ADDR',
    provider,
  );
}

function onlyOwner(): void {
  const addressProvider = Storage.get('ADDRESS_PROVIDER_ADDR');
  const owner = new ILendingAddressProvider(new Address(addressProvider)).getOwner();

  assert(Context.caller().toString() === owner, 'Caller is not the owner');
}

function onlyOverlyingAsset(reserve: string): void {

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const mToken = new Address(core.getReserve(reserve).mTokenAddress);

  assert(Context.caller() === mToken, 'Caller is not the overlying asset');
}
