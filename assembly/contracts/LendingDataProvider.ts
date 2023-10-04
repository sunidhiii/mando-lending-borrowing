import { Args, boolToByte, bytesToFixedSizeArray, bytesToString, fixedSizeArrayToBytes, u256ToBytes } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { onlyOwner } from '../helpers/ownership';
import { u256 } from 'as-bignum/assembly';
import { IFeeProvider } from '../interfaces/IFeeProvider';
import { IPriceOracle } from '../interfaces/IPriceOracle';

// const OWNER_ADDR = 'OWNER_ADDR';

export const HEALTH_FACTOR_LIQUIDATION_THRESHOLD: u64 = 1000000000;

/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param args - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return;
  }

  const args = new Args(binaryArgs);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');
  const oracle = args.nextString().expect('Oracle Address argument is missing or invalid');

  Storage.set(
    'ADDRESS_PROVIDER_ADDR',
    provider,
  );

  Storage.set(
    'PRICE_ORACLE',
    oracle,
  );

  generateEvent(`Data provider constructor called`)

}

export function calculateUserGlobalData(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  // onlyOwner();

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();

  // Then we create our key/value pair and store it.
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const reserves: string[] = core.viewAllReserves();

  var totalLiquidityBalanceETH: u64 = 0;
  var totalCollateralBalanceETH: u64 = 0;
  var currentLtv: u64 = 0;
  var currentLiquidationThreshold: u64 = 0;
  var totalBorrowBalanceETH: u64 = 0;
  var totalFeesETH: u64 = 0;

  for (let i = 0; i < reserves.length; i++) {
    let currentReserve = reserves[i];

    let userBasicReservedata = core.getUserBasicReserveData(currentReserve, user);
    let compoundedLiquidityBalance = userBasicReservedata[0];
    let compoundedBorrowBalance = userBasicReservedata[1];
    let originationFee = userBasicReservedata[2];

    if (compoundedLiquidityBalance == 0 && compoundedBorrowBalance == 0) {
      continue;
    }

    const reserveData = core.getReserve(new Address(currentReserve));
    const reserveDecimals = reserveData.decimals;
    const reserveBaseLTV = reserveData.baseLTV;
    const liquidationThreshold = reserveData.LiquidationThreshold;

    const userData = core.getUserReserve(new Address(user), new Address(currentReserve));
    const usageAsCollateralEnabled = userData.useAsCollateral;

    const tokenUnit = 10 ** reserveDecimals;

    const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));

    const reserveUnitPrice = oracle.getPrice(new Address(currentReserve));

    //liquidity and collateral balance
    if (compoundedLiquidityBalance > 0) {
      let liquidityBalanceETH = (reserveUnitPrice * u64.parse(compoundedLiquidityBalance.toString())) / tokenUnit;
      totalLiquidityBalanceETH = totalLiquidityBalanceETH + liquidityBalanceETH;

      if (usageAsCollateralEnabled) {
        totalCollateralBalanceETH = totalCollateralBalanceETH + liquidityBalanceETH;
        currentLtv = currentLtv + (liquidityBalanceETH * u64.parse(reserveBaseLTV.toString()));
        currentLiquidationThreshold = currentLiquidationThreshold + (liquidityBalanceETH * u64.parse(liquidationThreshold.toString()));
      }
    }

    if (compoundedBorrowBalance > 0) {
      totalBorrowBalanceETH = ((totalBorrowBalanceETH + reserveUnitPrice) * u64.parse(compoundedBorrowBalance.toString()) / (tokenUnit));
      totalFeesETH = (totalFeesETH + (u64.parse(originationFee.toString()) * reserveUnitPrice) / tokenUnit);
    }
  }

  currentLtv = totalCollateralBalanceETH > 0 ? currentLtv / totalCollateralBalanceETH : 0;
  currentLiquidationThreshold = totalCollateralBalanceETH > 0
    ? currentLiquidationThreshold / totalCollateralBalanceETH
    : 0;

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    totalCollateralBalanceETH,
    totalBorrowBalanceETH,
    totalFeesETH,
    currentLiquidationThreshold
  );

  // const healthFactorBelowThreshold = u64.parse(healthFactor.toString()) < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
  let userGlobalData: Array<u64> = new Array(7)

  userGlobalData[0] = totalLiquidityBalanceETH;
  userGlobalData[1] = totalCollateralBalanceETH;
  userGlobalData[2] = totalBorrowBalanceETH;
  userGlobalData[3] = totalFeesETH;
  userGlobalData[4] = currentLtv;
  userGlobalData[5] = currentLiquidationThreshold;
  userGlobalData[6] = healthFactor;

  generateEvent(`User global data: ${reserves}, ${reserves.length} and ${totalBorrowBalanceETH}`);

  return new Args().add(userGlobalData).serialize();
}

export function calculateUserHealthFactorBelowThresh(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const totalCollateralBalanceETH = args.nextU256().unwrap();
  const totalBorrowBalanceETH = args.nextU256().unwrap();
  const totalFeesETH = args.nextU256().unwrap();
  const currentLiquidationThreshold = args.nextU256().unwrap();

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    u64.parse(totalCollateralBalanceETH.toString()),
    u64.parse(totalBorrowBalanceETH.toString()),
    u64.parse(totalFeesETH.toString()),
    u64.parse(currentLiquidationThreshold.toString())
  );

  const healthFactorBelowThreshold = healthFactor < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;

  return boolToByte(healthFactorBelowThreshold);
}

export function balanceDecreaseAllowed(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);

  const underlyingAssetAddress = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const reserveData = core.getReserve(new Address(underlyingAssetAddress));
  const decimals = reserveData.decimals;
  const reserveLiquidationThreshold = reserveData.LiquidationThreshold;
  const reserveUsageAsCollateralEnabled = true;

  const userData = core.getUserReserve(new Address(user), new Address(underlyingAssetAddress));
  const usageAsCollateralEnabled: bool = userData.useAsCollateral;

  if (!reserveUsageAsCollateralEnabled || !usageAsCollateralEnabled) {
    return boolToByte(true); //if reserve is not used as collateral, no reasons to block the transfer
  }

  const userGolbalData: Array<u64> = new Args(calculateUserGlobalData(new Args().add(user).serialize())).nextFixedSizeArray<u64>().unwrap();
  const collateralBalanceETH = userGolbalData[1];
  const borrowBalanceETH = userGolbalData[2];
  const totalFeesETH = userGolbalData[3];
  const currentLiquidationThreshold = userGolbalData[4];

  if (borrowBalanceETH == 0) {
    return boolToByte(true); //no borrows - no reasons to block the transfer
  }

  const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));

  const amountToDecreaseETH = (oracle.getPrice(new Address(underlyingAssetAddress)) * u64.parse(amount.toString())) / 10 ** decimals;

  const collateralBalancefterDecrease: u64 = collateralBalanceETH > amountToDecreaseETH ? collateralBalanceETH - amountToDecreaseETH : 0;

  //if there is a borrow, there can't be 0 collateral
  if (collateralBalancefterDecrease == 0) {
    return boolToByte(false);
  }

  const aData = (collateralBalanceETH * currentLiquidationThreshold);
  const bData = (amountToDecreaseETH * u64.parse(reserveLiquidationThreshold.toString()));
  const finalData = aData > bData ? aData - bData : 0;
  const liquidationThresholdAfterDecrease = finalData / (collateralBalancefterDecrease);

  const healthFactorAfterDecrease = calculateHealthFactorFromBalancesInternal(
    collateralBalancefterDecrease,
    borrowBalanceETH,
    totalFeesETH,
    liquidationThresholdAfterDecrease
  );

  return boolToByte(healthFactorAfterDecrease > HEALTH_FACTOR_LIQUIDATION_THRESHOLD);
}

export function calculateCollateralNeededInETH(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();
  const fee = args.nextU256().unwrap();
  const userCurrentBorrowBalanceTH = args.nextU256().unwrap();
  const userCurrentFeesETH = args.nextU256().unwrap();
  const userCurrentLtv = args.nextU256().unwrap();

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const reserveData = core.getReserve(new Address(reserve));
  const reserveDecimals = reserveData.decimals;

  const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));

  const requestedBorrowAmountETH = oracle.getPrice(new Address(reserve)) * ((u64.parse(amount.toString()) + u64.parse(fee.toString()))) / (10 ** reserveDecimals); //price is in Mas

  //add the current already borrowed amount to the amount requested to calculate the total collateral needed.
  let collateralNeededInETH: u256 = u256.Zero;
  if (userCurrentLtv > u256.Zero) {
    collateralNeededInETH = u256.fromU64(((u64.parse(userCurrentBorrowBalanceTH.toString()) + u64.parse(userCurrentFeesETH.toString()) + (requestedBorrowAmountETH)) * 100) / u64.parse(userCurrentLtv.toString())); //LTV is calculated in percentage
  }

  return u256ToBytes(collateralNeededInETH);
}

export function calculateAvailableBorrowsETHInternal(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const collateralBalanceETH = args.nextU256().unwrap();
  const borrowBalanceETH = args.nextU256().unwrap();
  const totalFeesETH = args.nextU256().unwrap();
  const ltv = args.nextU256().unwrap();

  var availableBorrowsETH = u256.fromU64(u64.parse(collateralBalanceETH.toString()) * u64.parse(ltv.toString()) / 100); //ltv is in percentage

  if (availableBorrowsETH < borrowBalanceETH) {
    return u256ToBytes(u256.Zero);
  }

  const totalBorrow = u64.parse(availableBorrowsETH.toString()) > u64.parse(borrowBalanceETH.toString()) ? u64.parse(availableBorrowsETH.toString()) - u64.parse(borrowBalanceETH.toString()) : 0;
  availableBorrowsETH = u256.fromU64((totalBorrow + u64.parse(totalFeesETH.toString())));

  //calculate fee
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const feeProvider = new IFeeProvider(new Address(addressProvider.getFeeProvider()));

  const borrowFee = u64(feeProvider.calculateLoanOriginationFee(availableBorrowsETH));
  const availableBorrows: u256 = u64.parse(availableBorrowsETH.toString()) > borrowFee ? u256.fromU64(u64.parse(availableBorrowsETH.toString()) - borrowFee) : u256.Zero;
  return u256ToBytes(availableBorrows);
  // return availableBorrowsETH;
}

function calculateHealthFactorFromBalancesInternal(collateralBalanceETH: u64, borrowBalanceETH: u64, totalFeesETH: u64, liquidationThreshold: u64): u64 {
  if (borrowBalanceETH == 0) return 0;

  let res: u64 = 0;
  if((borrowBalanceETH + totalFeesETH) > 0) {
    res = ((collateralBalanceETH * liquidationThreshold / 100) / (borrowBalanceETH + totalFeesETH));
  }
  return res;
}