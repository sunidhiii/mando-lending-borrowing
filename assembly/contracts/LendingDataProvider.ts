import { Args } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { onlyOwner } from '../helpers/ownership';
import { u256 } from 'as-bignum/assembly';

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
export function constructor(providerAddress: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return [];
  }

  const args = new Args(providerAddress);
  const provider = new ILendingAddressProvider(new Address(args.nextString().expect('Provider Address argument is missing or invalid')))

  Storage.set(
    'PROVIDER_ADDR',
    args.nextString().unwrap(),
  );

  const core = provider.getCore();
  // const core = new Args(call(provider, 'getCore', new Args(), 0))
  Storage.set(
    'CORE_ADDR',
    core.toString(),
  );

  return [];
}

export function calculateUserGlobalData(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  // onlyOwner();

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();

  // Then we create our key/value pair and store it.
  const core = new ILendingCore(new Address(Storage.get('CORE_ADDR')));

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
    const usageAsCollateralEnabled = true;

    const tokenUnit = 10 ** parseInt(reserveDecimals.toString());
    // const reserveUnitPrice = oracle.getAssetPrice(vars.currentReserve);
    const reserveUnitPrice = 100;

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
    totalCollateralBalanceETH,
    totalBorrowBalanceETH,
    totalFeesETH,
    currentLiquidationThreshold
  );

  const healthFactorBelowThreshold = parseFloat(healthFactor.toString()) < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;

  return [totalLiquidityBalanceETH, totalCollateralBalanceETH, totalBorrowBalanceETH, totalFeesETH, currentLtv, currentLiquidationThreshold, healthFactor]
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

export function balanceDecreaseAllowed(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);

  const underlyingAssetAddress = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const core = new ILendingCore(new Address(Storage.get('CORE_ADDR')));

  const reserveData = core.getReserve(new Address(underlyingAssetAddress));
  const decimals = reserveData.decimals;
  const reserveLiquidationThreshold = reserveData.LiquidationThreshold;
  const reserveUsageAsCollateralEnabled = true;

  const userGolbalData = calculateUserGlobalData(new Args().add(user).serialize());

  if (borrowBalanceETH == 0) {
    return true; //no borrows - no reasons to block the transfer
  }

  IPriceOracleGetter oracle = IPriceOracleGetter(addressesProvider.getPriceOracle());

  vars.amountToDecreaseETH = oracle.getAssetPrice(_reserve).mul(_amount).div(
    10 ** vars.decimals
  );

  vars.collateralBalancefterDecrease = vars.collateralBalanceETH.sub(
    vars.amountToDecreaseETH
  );

  //if there is a borrow, there can't be 0 collateral
  if (vars.collateralBalancefterDecrease == 0) {
    return false;
  }

  vars.liquidationThresholdAfterDecrease = vars
    .collateralBalanceETH
    .mul(vars.currentLiquidationThreshold)
    .sub(vars.amountToDecreaseETH.mul(vars.reserveLiquidationThreshold))
    .div(vars.collateralBalancefterDecrease);

  const healthFactorAfterDecrease = calculateHealthFactorFromBalancesInternal(
    vars.collateralBalancefterDecrease,
    vars.borrowBalanceETH,
    vars.totalFeesETH,
    vars.liquidationThresholdAfterDecrease
  );

  return healthFactorAfterDecrease > HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
}

function calculateCollateralNeededInETH(
  address _reserve,
  uint256 _amount,
  uint256 _fee,
  uint256 _userCurrentBorrowBalanceTH,
  uint256 _userCurrentFeesETH,
  uint256 _userCurrentLtv
) external view returns(uint256) {
  uint256 reserveDecimals = core.getReserveDecimals(_reserve);

  IPriceOracleGetter oracle = IPriceOracleGetter(addressesProvider.getPriceOracle());

  uint256 requestedBorrowAmountETH = oracle
    .getAssetPrice(_reserve)
    .mul(_amount.add(_fee))
    .div(10 ** reserveDecimals); //price is in ether

  //add the current already borrowed amount to the amount requested to calculate the total collateral needed.
  uint256 collateralNeededInETH = _userCurrentBorrowBalanceTH
    .add(_userCurrentFeesETH)
    .add(requestedBorrowAmountETH)
    .mul(100)
    .div(_userCurrentLtv); //LTV is calculated in percentage

  return collateralNeededInETH;

}

function calculateAvailableBorrowsETHInternal(collateralBalanceETH: u256, borrowBalanceETH: u256, totalFeesETH: u256, ltv: u256): u256 {

  var availableBorrowsETH = new u256(parseFloat(collateralBalanceETH.toString()) * parseFloat(ltv.toString()) / 100); //ltv is in percentage

  if (availableBorrowsETH < borrowBalanceETH) {
    return new u256(0);
  }

  availableBorrowsETH = new u256(parseFloat(availableBorrowsETH.toString()) - (parseFloat(borrowBalanceETH.toString()) + parseFloat(totalFeesETH.toString())));
  //calculate fee
  // const borrowFee = IFeeProvider(addressesProvider.getFeeProvider())
  //     .calculateLoanOriginationFee(msg.sender, availableBorrowsETH);
  // return availableBorrowsETH.sub(borrowFee);
  return availableBorrowsETH;
}

function calculateHealthFactorFromBalancesInternal(collateralBalanceETH: u256, borrowBalanceETH: u256, totalFeesETH: u256, liquidationThreshold: u256): u256 {
  if (borrowBalanceETH == new u256(0)) return new u256(-1);

  const res = new u256(((parseFloat(collateralBalanceETH.toString()) * parseFloat(liquidationThreshold.toString())) / 100) / (parseFloat(borrowBalanceETH.toString()) + parseFloat(totalFeesETH.toString())));
  return res;
}

function getUserAccountData(address _user)
external
view
returns(
  uint256 totalLiquidityETH,
  uint256 totalCollateralETH,
  uint256 totalBorrowsETH,
  uint256 totalFeesETH,
  uint256 availableBorrowsETH,
  uint256 currentLiquidationThreshold,
  uint256 ltv,
  uint256 healthFactor
)
{
  (
    totalLiquidityETH,
    totalCollateralETH,
    totalBorrowsETH,
    totalFeesETH,
    ltv,
    currentLiquidationThreshold,
    healthFactor,

  ) = calculateUserGlobalData(_user);

  availableBorrowsETH = calculateAvailableBorrowsETHInternal(
    totalCollateralETH,
    totalBorrowsETH,
    totalFeesETH,
    ltv
  );
}

function getUserReserveData(address _reserve, address _user)
external
view
returns(
  uint256 currentATokenBalance,
  uint256 currentBorrowBalance,
  uint256 principalBorrowBalance,
  uint256 borrowRateMode,
  uint256 borrowRate,
  uint256 liquidityRate,
  uint256 originationFee,
  uint256 variableBorrowIndex,
  uint256 lastUpdateTimestamp,
  bool usageAsCollateralEnabled
)
{
  currentATokenBalance = AToken(core.getReserveATokenAddress(_reserve)).balanceOf(_user);
  CoreLibrary.InterestRateMode mode = core.getUserCurrentBorrowRateMode(_reserve, _user);
  (principalBorrowBalance, currentBorrowBalance, ) = core.getUserBorrowBalances(
    _reserve,
    _user
  );

  //default is 0, if mode == CoreLibrary.InterestRateMode.NONE
  if (mode == CoreLibrary.InterestRateMode.STABLE) {
    borrowRate = core.getUserCurrentStableBorrowRate(_reserve, _user);
  } else if (mode == CoreLibrary.InterestRateMode.VARIABLE) {
    borrowRate = core.getReserveCurrentVariableBorrowRate(_reserve);
  }

  borrowRateMode = uint256(mode);
  liquidityRate = core.getReserveCurrentLiquidityRate(_reserve);
  originationFee = core.getUserOriginationFee(_reserve, _user);
  variableBorrowIndex = core.getUserVariableBorrowCumulativeIndex(_reserve, _user);
  lastUpdateTimestamp = core.getUserLastUpdate(_reserve, _user);
  usageAsCollateralEnabled = core.isUserUseReserveAsCollateralEnabled(_reserve, _user);
}