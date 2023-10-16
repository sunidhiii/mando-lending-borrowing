import { Args, boolToByte, u64ToBytes } from '@massalabs/as-types';
import { Address, Context, Storage, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { onlyOwner } from '../helpers/ownership';
import { IFeeProvider } from '../interfaces/IFeeProvider';
import { IPriceOracle } from '../interfaces/IPriceOracle';
import { ONE_UNIT } from './FeeProvider';

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

  var totalLiquidityBalanceUSD: f64 = 0.0;
  var totalCollateralBalanceUSD: f64 = 0.0;
  var currentLtv: f64 = 0.0;
  var currentLiquidationThreshold: f64 = 0.0;
  var totalBorrowBalanceUSD: f64 = 0.0;
  var totalFeesUSD: f64 = 0.0;

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
      let liquidityBalanceUSD = (f64(reserveUnitPrice) * f64(compoundedLiquidityBalance)) / f64(tokenUnit);
      totalLiquidityBalanceUSD = totalLiquidityBalanceUSD + liquidityBalanceUSD;

      if (usageAsCollateralEnabled) {
        totalCollateralBalanceUSD = totalCollateralBalanceUSD + liquidityBalanceUSD;
        currentLtv = currentLtv + (liquidityBalanceUSD * f64(reserveBaseLTV));
        currentLiquidationThreshold = currentLiquidationThreshold + (liquidityBalanceUSD * f64(liquidationThreshold));
      }
    }

    if (compoundedBorrowBalance > 0) {
      totalBorrowBalanceUSD = totalBorrowBalanceUSD + ((f64(reserveUnitPrice) * f64(compoundedBorrowBalance)) / f64(tokenUnit));
      totalFeesUSD = totalFeesUSD + ((f64(originationFee) * f64(reserveUnitPrice)) / f64(tokenUnit));
    }
  }

  currentLtv = totalCollateralBalanceUSD > 0 ? currentLtv / totalCollateralBalanceUSD : 0.0;
  currentLiquidationThreshold = totalCollateralBalanceUSD > 0 ? (currentLiquidationThreshold / totalCollateralBalanceUSD) : 0.0;

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    totalCollateralBalanceUSD,
    totalBorrowBalanceUSD,
    totalFeesUSD,
    f32(currentLiquidationThreshold)
  );

  // const healthFactorBelowThreshold = u64.parse(healthFactor.toString()) < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
  let userGlobalData: Array<u64> = new Array(7)

  userGlobalData[0] = u64(totalLiquidityBalanceUSD);
  userGlobalData[1] = u64(totalCollateralBalanceUSD);
  userGlobalData[2] = u64(totalBorrowBalanceUSD);
  userGlobalData[3] = u64(totalFeesUSD);
  userGlobalData[4] = u64(currentLtv);
  userGlobalData[5] = u64(currentLiquidationThreshold);
  userGlobalData[6] = u64(healthFactor);

  generateEvent(`User global data: ${reserves}, ${reserves.length} and ${totalBorrowBalanceUSD}`);

  return new Args().add(userGlobalData).serialize();
}

export function calculateUserHealthFactorBelowThresh(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const totalCollateralBalanceUSD = args.nextU64().unwrap();
  const totalBorrowBalanceUSD = args.nextU64().unwrap();
  const totalFeesUSD = args.nextU64().unwrap();
  const currentLiquidationThreshold = args.nextU8().unwrap();

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    f64(totalCollateralBalanceUSD),
    f64(totalBorrowBalanceUSD),
    f64(totalFeesUSD),
    f32(currentLiquidationThreshold)
  );

  const healthFactorBelowThreshold = healthFactor < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;

  return boolToByte(healthFactorBelowThreshold);
}

export function balanceDecreaseAllowed(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);

  const underlyingAssetAddress = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

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
  const collateralBalanceUSD = userGolbalData[1];
  const borrowBalanceUSD = userGolbalData[2];
  const totalFeesUSD = userGolbalData[3];
  const currentLiquidationThreshold = userGolbalData[5];

  if (borrowBalanceUSD == 0) {
    return boolToByte(true); //no borrows - no reasons to block the transfer
  }

  const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));
  const amountToDecreaseUSD = (f64(oracle.getPrice(new Address(underlyingAssetAddress))) * f64(amount)) / f64(10 ** decimals);

  const collateralBalanceAfterDecrease: f64 = f64(collateralBalanceUSD) > amountToDecreaseUSD ? f64(collateralBalanceUSD) - amountToDecreaseUSD : 0.0;

  //if there is a borrow, there can't be 0 collateral
  if (collateralBalanceAfterDecrease == 0.0) {
    return boolToByte(false);
  }

  const aData = (f64(collateralBalanceUSD) * f32(currentLiquidationThreshold));
  const bData = (f64(amountToDecreaseUSD) * f32(reserveLiquidationThreshold));
  const finalData = aData > bData ? aData - bData : 0.0;
  const liquidationThresholdAfterDecrease = finalData / collateralBalanceAfterDecrease;

  const healthFactorAfterDecrease = calculateHealthFactorFromBalancesInternal(
    collateralBalanceAfterDecrease,
    f64(borrowBalanceUSD),
    f64(totalFeesUSD),
    f32(liquidationThresholdAfterDecrease)
  );

  return boolToByte(healthFactorAfterDecrease > HEALTH_FACTOR_LIQUIDATION_THRESHOLD);
}

export function calculateCollateralNeededInUSD(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();
  const fee = args.nextU64().unwrap();
  const userCurrentBorrowBalanceUSD = args.nextU64().unwrap();
  const userCurrentFeesUSD = args.nextU64().unwrap();
  const userCurrentLtv = args.nextU8().unwrap();

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const reserveData = core.getReserve(new Address(reserve));
  const reserveDecimals = reserveData.decimals;

  const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));
  const requestedBorrowAmountUSD = (f64(oracle.getPrice(new Address(reserve))) * f64(amount + fee)) / f64(10 ** reserveDecimals); //price is in Mas

  //add the current already borrowed amount to the amount requested to calculate the total collateral needed.
  let collateralNeededInUSD: u64 = 0;
  if (userCurrentLtv > 0) {
    collateralNeededInUSD = u64(((f64(userCurrentBorrowBalanceUSD) + f64(userCurrentFeesUSD) + requestedBorrowAmountUSD) * 100.0) / f64(userCurrentLtv)); //LTV is calculated in percentage
  }

  return u64ToBytes(collateralNeededInUSD);
}

export function calculateAvailableBorrowsUSD(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const collateralBalanceUSD = args.nextU64().unwrap();
  const borrowBalanceUSD = args.nextU64().unwrap();
  const totalFeesUSD = args.nextU64().unwrap();
  const ltv = args.nextU8().unwrap();

  var availableBorrowsUSD: u64 = u64((f64(collateralBalanceUSD) * f64(ltv)) / 100.0); //ltv is in percentage

  if (availableBorrowsUSD < borrowBalanceUSD) {
    return u64ToBytes(0);
  }

  // const totalBorrow = u64.parse(availableBorrowsUSD.toString()) - u64.parse(borrowBalanceUSD.toString());
  if (availableBorrowsUSD > (borrowBalanceUSD + totalFeesUSD)) {
    availableBorrowsUSD = availableBorrowsUSD - (borrowBalanceUSD + totalFeesUSD);
  }

  //calculate fee
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const feeProvider = new IFeeProvider(new Address(addressProvider.getFeeProvider()));

  const borrowFee = u64(feeProvider.calculateLoanOriginationFee(availableBorrowsUSD));
  const availableBorrows: u64 = availableBorrowsUSD - borrowFee;
  return u64ToBytes(availableBorrows);
  // return availableBorrowsUSD;
}

export function calculateUserData(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();

  // Then we create our key/value pair and store it.
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const reserves: string[] = core.viewAllReserves();

  var totalLiquidityBalance: f64 = 0.0;
  var totalCollateralBalance: f64 = 0.0;
  var currentLtv: f64 = 0.0;
  var currentLiquidationThreshold: f64 = 0.0;
  var totalBorrowBalance: f64 = 0.0;
  var totalFees: f64 = 0.0;

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
    const reserveBaseLTV = reserveData.baseLTV;
    const liquidationThreshold = reserveData.LiquidationThreshold;

    const userData = core.getUserReserve(new Address(user), new Address(currentReserve));
    const usageAsCollateralEnabled = userData.useAsCollateral;

    //liquidity and collateral balance
    if (compoundedLiquidityBalance > 0) {
      totalLiquidityBalance = totalLiquidityBalance + f64(compoundedLiquidityBalance);

      if (usageAsCollateralEnabled) {
        totalCollateralBalance = totalCollateralBalance + f64(compoundedLiquidityBalance);
        currentLtv = currentLtv + (f64(compoundedLiquidityBalance) * f64(reserveBaseLTV));
        currentLiquidationThreshold = currentLiquidationThreshold + (f64(compoundedLiquidityBalance) * f64(liquidationThreshold));
      }
    }

    if (compoundedBorrowBalance > 0) {
      totalBorrowBalance = totalBorrowBalance + f64(compoundedBorrowBalance);
      totalFees = totalFees + f64(originationFee);
    }
  }

  currentLtv = totalCollateralBalance > 0 ? currentLtv / totalCollateralBalance : 0.0;
  currentLiquidationThreshold = totalCollateralBalance > 0 ? (currentLiquidationThreshold / totalCollateralBalance) : 0.0;

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    totalCollateralBalance,
    totalBorrowBalance,
    totalFees,
    f32(currentLiquidationThreshold)
  );

  // const healthFactorBelowThreshold = u64.parse(healthFactor.toString()) < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
  let userGlobalData: Array<u64> = new Array(7)

  userGlobalData[0] = u64(totalLiquidityBalance);
  userGlobalData[1] = u64(totalCollateralBalance);
  userGlobalData[2] = u64(totalBorrowBalance);
  userGlobalData[3] = u64(totalFees);
  userGlobalData[4] = u64(currentLtv);
  userGlobalData[5] = u64(currentLiquidationThreshold);
  userGlobalData[6] = u64(healthFactor);

  generateEvent(`User global data: ${reserves}, ${reserves.length} and ${totalBorrowBalance}`);

  return new Args().add(userGlobalData).serialize();
}

export function calculateAvailableBorrows(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const collateralBalance = args.nextU64().unwrap();
  const borrowBalance = args.nextU64().unwrap();
  const totalFees = args.nextU64().unwrap();
  const ltv = args.nextU8().unwrap();

  var availableBorrows: u64 = u64((f64(collateralBalance) * f64(ltv)) / 100.0); // ltv is in   

  if (availableBorrows < borrowBalance) {
    return u64ToBytes(0);
  }

  // const totalBorrow = u64.parse(availableBorrows.toString()) - u64.parse(borrowBalance.toString());
  if (availableBorrows > (borrowBalance + totalFees)) {
    availableBorrows = availableBorrows - (borrowBalance + totalFees);
  }

  //calculate fee
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const feeProvider = new IFeeProvider(new Address(addressProvider.getFeeProvider()));

  const borrowFee = u64(feeProvider.calculateLoanOriginationFee(availableBorrows));
  const totalAvailableBorrows: u64 = availableBorrows - borrowFee;
  return u64ToBytes(totalAvailableBorrows);
  // return availableBorrowsUSD;
}

export function calculateCollateralNeeded(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const amount = args.nextU64().unwrap();
  const fee = args.nextU64().unwrap();
  const userCurrentBorrowBalance = args.nextU64().unwrap();
  const userCurrentFees = args.nextU64().unwrap();
  const userCurrentLtv = args.nextU8().unwrap();

  // const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));

  const requestedBorrowAmount = (amount + fee)               //price is in Mas

  //add the current already borrowed amount to the amount requested to calculate the total collateral needed.
  let collateralNeeded: u64 = 0;
  if (userCurrentLtv > 0) {
    collateralNeeded = u64((f64(userCurrentBorrowBalance + userCurrentFees + requestedBorrowAmount) * 100.0) / f64(userCurrentLtv)); //LTV is calculated in percentage
  }

  return u64ToBytes(collateralNeeded);
}

export function setAddressProvider(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  Storage.set(
    'ADDRESS_PROVIDER_ADDR',
    provider,
  );
}

export function setPriceOracle(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const oracle = args.nextString().expect('Oracle Address argument is missing or invalid');

  Storage.set(
    'PRICE_ORACLE',
    oracle,
  );
}

function calculateHealthFactorFromBalancesInternal(collateralBalanceUSD: f64, borrowBalanceUSD: f64, totalFeesUSD: f64, liquidationThreshold: f32): u64 {
  if (borrowBalanceUSD == 0.0) return u64.MAX_VALUE;

  let res: u64 = 0;
  if ((borrowBalanceUSD + totalFeesUSD) > 0.0) {
    res = u64((((collateralBalanceUSD * liquidationThreshold) / 100.0) / (borrowBalanceUSD + totalFeesUSD)) * f64(ONE_UNIT));
  }
  return res;
}