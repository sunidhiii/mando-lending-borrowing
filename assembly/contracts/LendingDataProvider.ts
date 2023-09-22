import { Args, bytesToString } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { onlyOwner } from '../helpers/ownership';
import { u256 } from 'as-bignum/assembly';
import { IFeeProvider } from '../interfaces/IFeeProvider';
import { IPriceOracle } from '../interfaces/IPriceOracle';

// const OWNER_ADDR = 'OWNER_ADDR';

export const HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1 * 10 ** 9;

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

}

export function calculateUserGlobalData(binaryArgs: StaticArray<u8>): StaticArray<u64> {

  // onlyOwner();

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();

  // Then we create our key/value pair and store it.
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(addressProvider.getCore());

  const reserves: string[] = core.viewAllReserves();

  var totalLiquidityBalanceETH = 0;
  var totalCollateralBalanceETH = 0;
  var currentLtv = 0;
  var currentLiquidationThreshold = 0;
  var totalBorrowBalanceETH = 0;
  var totalFeesETH = 0;

  for (let i = 0; i < reserves.length; i++) {
    let currentReserve = reserves[i];

    let userbasicReservedata = core.getUserBasicReserveData(currentReserve, user);
    let compoundedLiquidityBalance = userbasicReservedata[0];
    let compoundedBorrowBalance = userbasicReservedata[1];
    let originationFee = userbasicReservedata[2];

    if (compoundedLiquidityBalance == new u256(0) && compoundedBorrowBalance == new u256(0)) {
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
    if (compoundedLiquidityBalance > new u256(0)) {
      let liquidityBalanceETH = (reserveUnitPrice * parseFloat(compoundedLiquidityBalance.toString())) / tokenUnit;
      totalLiquidityBalanceETH = totalLiquidityBalanceETH + liquidityBalanceETH;

      if (usageAsCollateralEnabled) {
        totalCollateralBalanceETH = totalCollateralBalanceETH + liquidityBalanceETH;
        currentLtv = currentLtv + (liquidityBalanceETH * parseFloat(reserveBaseLTV.toString()));
        currentLiquidationThreshold = currentLiquidationThreshold + (liquidityBalanceETH * parseFloat(liquidationThreshold.toString()));
      }
    }

    if (compoundedBorrowBalance > new u256(0)) {
      totalBorrowBalanceETH = totalBorrowBalanceETH + reserveUnitPrice * (parseFloat(compoundedBorrowBalance.toString()) / (tokenUnit));
      totalFeesETH = totalFeesETH + ((parseFloat(originationFee.toString()) * reserveUnitPrice) / tokenUnit);
    }
  }

  currentLtv = totalCollateralBalanceETH > 0 ? currentLtv / totalCollateralBalanceETH : 0;
  currentLiquidationThreshold = totalCollateralBalanceETH > 0
    ? currentLiquidationThreshold / totalCollateralBalanceETH
    : 0;

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    new u256(totalCollateralBalanceETH),
    new u256(totalBorrowBalanceETH),
    new u256(totalFeesETH),
    new u256(currentLiquidationThreshold)
  );

  // const healthFactorBelowThreshold = parseFloat(healthFactor.toString()) < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;

  return [totalLiquidityBalanceETH, totalCollateralBalanceETH, totalBorrowBalanceETH, totalFeesETH, currentLtv, currentLiquidationThreshold, parseFloat(healthFactor.toString())]
}

export function calculateUserHealthFactorBelowThresh(binaryArgs: StaticArray<u8>): bool {

  const args = new Args(binaryArgs);
  const totalCollateralBalanceETH = args.nextU256().unwrap();
  const totalBorrowBalanceETH = args.nextU256().unwrap();
  const totalFeesETH = args.nextU256().unwrap();
  const currentLiquidationThreshold = args.nextU256().unwrap();

  const healthFactor = calculateHealthFactorFromBalancesInternal(
    totalCollateralBalanceETH,
    totalBorrowBalanceETH,
    totalFeesETH,
    currentLiquidationThreshold
  );

  const healthFactorBelowThreshold = parseFloat(healthFactor.toString()) < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;

  return healthFactorBelowThreshold;
}

export function balanceDecreaseAllowed(binaryArgs: StaticArray<u8>): bool {

  const args = new Args(binaryArgs);

  const underlyingAssetAddress = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(addressProvider.getCore());

  const reserveData = core.getReserve(new Address(underlyingAssetAddress));
  const decimals = reserveData.decimals;
  const reserveLiquidationThreshold = reserveData.LiquidationThreshold;
  const reserveUsageAsCollateralEnabled = true;

  const userData = core.getUserReserve(new Address(user), new Address(underlyingAssetAddress));
  const usageAsCollateralEnabled = userData.useAsCollateral;

  if (!reserveUsageAsCollateralEnabled || !usageAsCollateralEnabled) {
    return true; //if reserve is not used as collateral, no reasons to block the transfer
  }

  const userGolbalData = calculateUserGlobalData(new Args().add(user).serialize());
  const collateralBalanceETH = userGolbalData[1];
  const borrowBalanceETH = userGolbalData[2];
  const totalFeesETH = userGolbalData[3];
  const currentLiquidationThreshold = userGolbalData[4];

  if (borrowBalanceETH == 0) {
    return true; //no borrows - no reasons to block the transfer
  }

  const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));

  const amountToDecreaseETH = (oracle.getPrice(new Address(underlyingAssetAddress)) * u64(amount.toString())) / decimals;

  const collateralBalancefterDecrease = collateralBalanceETH - amountToDecreaseETH;

  //if there is a borrow, there can't be 0 collateral
  if (collateralBalancefterDecrease == 0) {
    return false;
  }

  const liquidationThresholdAfterDecrease = ((collateralBalanceETH * currentLiquidationThreshold) - (amountToDecreaseETH * parseFloat(reserveLiquidationThreshold.toString()))) / (collateralBalancefterDecrease);

  const healthFactorAfterDecrease = calculateHealthFactorFromBalancesInternal(
    new u256(collateralBalancefterDecrease),
    new u256(borrowBalanceETH),
    new u256(totalFeesETH),
    new u256(liquidationThresholdAfterDecrease)
  );

  return parseFloat(healthFactorAfterDecrease.toString()) > HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
}

export function calculateCollateralNeededInETH(binaryArgs: StaticArray<u8>): u256 {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();
  const fee = args.nextU256().unwrap();
  const userCurrentBorrowBalanceTH = args.nextU256().unwrap();
  const userCurrentFeesETH = args.nextU256().unwrap();
  const userCurrentLtv = args.nextU256().unwrap();

  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(addressProvider.getCore());

  const reserveData = core.getReserve(new Address(reserve));
  const reserveDecimals = reserveData.decimals;

  const oracle = new IPriceOracle(new Address(Storage.get('PRICE_ORACLE')));

  const requestedBorrowAmountETH = oracle.getPrice(new Address(reserve)) * (u64(amount.toString()) + u64(fee.toString())) / (10 ** reserveDecimals); //price is in Mass

  //add the current already borrowed amount to the amount requested to calculate the total collateral needed.
  const collateralNeededInETH = new u256((u64(userCurrentBorrowBalanceTH.toString()) + u64(userCurrentFeesETH.toString()) + (requestedBorrowAmountETH) * 100) / u64(userCurrentLtv.toString())); //LTV is calculated in percentage

  return collateralNeededInETH;
}

export function calculateAvailableBorrowsETHInternal(collateralBalanceETH: u256, borrowBalanceETH: u256, totalFeesETH: u256, ltv: u256): u256 {

  var availableBorrowsETH = new u256(parseFloat(collateralBalanceETH.toString()) * parseFloat(ltv.toString()) / 100); //ltv is in percentage

  if (availableBorrowsETH < borrowBalanceETH) {
    return new u256(0);
  }

  availableBorrowsETH = new u256(parseFloat(availableBorrowsETH.toString()) - (parseFloat(borrowBalanceETH.toString()) + parseFloat(totalFeesETH.toString())));

  //calculate fee
  const addressProvider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const feeProvider = new IFeeProvider(addressProvider.getFeeProvider());

  const borrowFee = feeProvider.calculateLoanOriginationFee(availableBorrowsETH);
  return new u256(f64(availableBorrowsETH.toString()) - borrowFee);
  // return availableBorrowsETH;
}

function calculateHealthFactorFromBalancesInternal(collateralBalanceETH: u256, borrowBalanceETH: u256, totalFeesETH: u256, liquidationThreshold: u256): u256 {
  if (borrowBalanceETH == new u256(0)) return new u256(-1);

  const res = new u256(((parseFloat(collateralBalanceETH.toString()) * parseFloat(liquidationThreshold.toString())) / 100) / (parseFloat(borrowBalanceETH.toString()) + parseFloat(totalFeesETH.toString())));
  return res;
}