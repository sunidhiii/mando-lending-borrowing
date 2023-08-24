import { Args } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { onlyOwner } from '../helpers/ownership';

// const OWNER_ADDR = 'OWNER_ADDR';

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

/**
 * @returns true if the caller is the creator of the SC
 */
// function _onlyOwner(): bool {
//   if (!Storage.has(OWNER_ADDR)) {
//     return false;
//   }
//   return Context.caller().toString() == Storage.get(OWNER_ADDR);
// }

/**
 * This functions changes the core address.
 *
 * @param _args - The serialized arguments that should contain core smart contract address.
 *
 * @returns none
 *
 */
// export function calculateUserGlobalData(user: StaticArray<u8>): void {

//   assert(_onlyOwner(), 'The caller is not the owner of the contract');
//   // onlyOwner();

//   // Then we create our key/value pair and store it.
//   const core = new ILendingCore(new Address(Storage.get('coreAddress')));

//   const reserves: string[] = core.viewAllReserves();

//   for (let i = 0; i < reserves.length; i++) {
//     let currentReserve = reserves[i];

//     let compoundedLiquidityBalance,
//     let compoundedBorrowBalance,
//     let originationFee,
//     let userUsesReserveAsCollateral = core.getUserBasicReserveData(vars.currentReserve, _user);

//     if (vars.compoundedLiquidityBalance == 0 && vars.compoundedBorrowBalance == 0) {
//       continue;
//     }

//     //fetch reserve data
//     (
//       vars.reserveDecimals,
//       vars.baseLtv,
//       vars.liquidationThreshold,
//       vars.usageAsCollateralEnabled
//     ) = core.getReserveConfiguration(vars.currentReserve);

//     vars.tokenUnit = 10 ** vars.reserveDecimals;
//     vars.reserveUnitPrice = oracle.getAssetPrice(vars.currentReserve);

//     //liquidity and collateral balance
//     if (vars.compoundedLiquidityBalance > 0) {
//         uint256 liquidityBalanceETH = vars
//         .reserveUnitPrice
//         .mul(vars.compoundedLiquidityBalance)
//         .div(vars.tokenUnit);
//       totalLiquidityBalanceETH = totalLiquidityBalanceETH.add(liquidityBalanceETH);

//       if (vars.usageAsCollateralEnabled && vars.userUsesReserveAsCollateral) {
//         totalCollateralBalanceETH = totalCollateralBalanceETH.add(liquidityBalanceETH);
//         currentLtv = currentLtv.add(liquidityBalanceETH.mul(vars.baseLtv));
//         currentLiquidationThreshold = currentLiquidationThreshold.add(
//           liquidityBalanceETH.mul(vars.liquidationThreshold)
//         );
//       }
//     }

//     if (vars.compoundedBorrowBalance > 0) {
//       totalBorrowBalanceETH = totalBorrowBalanceETH.add(
//         vars.reserveUnitPrice.mul(vars.compoundedBorrowBalance).div(vars.tokenUnit)
//       );
//       totalFeesETH = totalFeesETH.add(
//         vars.originationFee.mul(vars.reserveUnitPrice).div(vars.tokenUnit)
//       );
//     }
//   }

//   currentLtv = totalCollateralBalanceETH > 0 ? currentLtv.div(totalCollateralBalanceETH) : 0;
//   currentLiquidationThreshold = totalCollateralBalanceETH > 0
//     ? currentLiquidationThreshold.div(totalCollateralBalanceETH)
//     : 0;

//   healthFactor = calculateHealthFactorFromBalancesInternal(
//     totalCollateralBalanceETH,
//     totalBorrowBalanceETH,
//     totalFeesETH,
//     currentLiquidationThreshold
//   );
//   healthFactorBelowThreshold = healthFactor < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;


// }

/**
 * This functions retrieves the core address.
 *
 * @returns The serialized address found.
 *
 */
export function getCore(): Address {

  // We check if the entry exists.
  const address = Storage.get('coreAddress');
  return new Address(address);

}

export function setLendingPool(poolAddress: StaticArray<u8>): void {

  const args = new Args(poolAddress);  // First we deserialize our arguments.

  // assert(_onlyOwner(), 'The caller is not the owner of the contract');
  onlyOwner();

  Storage.set(
    'poolAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of lending pool to" + args.nextString().unwrap() + "'");

}

export function getLendingPool(): Address {

  // We check if the entry exists.
  const address = Storage.get('poolAddress');
  return new Address(address);

}

export function setConfigurator(configuratorAddress: StaticArray<u8>): void {

  const args = new Args(configuratorAddress);  // First we deserialize our arguments.

  // assert(_onlyOwner(), 'The caller is not the owner of the contract');
  onlyOwner();

  Storage.set(
    'configuratorAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of lending pool configuratorAddress to" + args.nextString().unwrap() + "'");
}

export function getConfigurator(): Address {

  // We check if the entry exists.
  const address = Storage.get('configuratorAddress');
  return new Address(address);

}

export function setFeeProvider(feeProviderAddress: StaticArray<u8>): void {

  const args = new Args(feeProviderAddress);  // First we deserialize our arguments.

  // assert(_onlyOwner(), 'The caller is not the owner of the contract');
  onlyOwner();

  Storage.set(
    'feeProviderAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of lending pool feeProviderAddress to" + args.nextString().unwrap() + "'");
}

export function getFeeProvider(): Address {

  // We check if the entry exists.
  const address = Storage.get('feeProviderAddress');
  return new Address(address);

}
