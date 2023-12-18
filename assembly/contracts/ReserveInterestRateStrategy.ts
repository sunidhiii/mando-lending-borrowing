import {
  Args,
  bytesToU64,
  stringToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import {
  Context,
  Storage,
  callerHasWriteAccess,
  generateEvent,
} from '@massalabs/massa-as-sdk';
import { setOwner, onlyOwner } from '../helpers/ownership';

export const ONE_UNIT: f64 = 1000000000.0;
export const OPTIMAL_UTILIZATION_RATE: f64 = 800000000.0; // 0.8
export const EXCESS_UTILIZATION_RATE: f64 = 200000000.0; // 0.2

export const baseVariableBorrowRateKey = stringToBytes(
  'BASE_VARIABLE_BORROW_RATE',
); // 0
export const variableRateSlope1Key = stringToBytes('VARIABLE_SLOPE1'); // 0.08
export const variableRateSlope2Key = stringToBytes('VARIABLE_SLOPE2'); // 1
export const stableRateSlope1Key = stringToBytes('STABLE_SLOPE1'); // 0.1
export const stableRateSlope2Key = stringToBytes('STABLE_SLOPE2'); // 1
export const reserveKey = stringToBytes('RESERVE');

/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param binaryArgs - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess(), 'Caller is not allowed');

  const args = new Args(binaryArgs);

  const baseVariableBorrowRate = args
    .nextU64()
    .expect('baseVariableBorrowRate argument is missing or invalid');
  const variableRateSlope1 = args
    .nextU64()
    .expect('variableRateSlope1 argument is missing or invalid');
  const variableRateSlope2 = args
    .nextU64()
    .expect('variableRateSlope2 argument is missing or invalid');
  const stableRateSlope1 = args
    .nextU64()
    .expect('stableRateSlope1 argument is missing or invalid');
  const stableRateSlope2 = args
    .nextU64()
    .expect('stableRateSlope2 argument is missing or invalid');
  const reserve = args
    .nextString()
    .expect('reserve argument is missing or invalid');

  Storage.set(baseVariableBorrowRateKey, u64ToBytes(baseVariableBorrowRate));
  Storage.set(variableRateSlope1Key, u64ToBytes(variableRateSlope1));
  Storage.set(variableRateSlope2Key, u64ToBytes(variableRateSlope2));
  Storage.set(stableRateSlope1Key, u64ToBytes(stableRateSlope1));
  Storage.set(stableRateSlope2Key, u64ToBytes(stableRateSlope2));
  Storage.set(reserveKey, stringToBytes(reserve));

  setOwner(new Args().add(Context.caller()).serialize());

  generateEvent(`Interest Rate Strategy constructor called with all details.`);
}

export function setBaseVariableBorrowRate(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);
  const baseVariableBorrowRate = args
    .nextU64()
    .expect('baseVariableBorrowRate argument is missing or invalid');

  Storage.set(baseVariableBorrowRateKey, u64ToBytes(baseVariableBorrowRate));
}

export function setVariableRateSlope1(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);

  const variableRateSlope1 = args
    .nextU64()
    .expect('variableRateSlope1 argument is missing or invalid');
  Storage.set(variableRateSlope1Key, u64ToBytes(variableRateSlope1));
}

export function setVariableRateSlope2(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);

  const variableRateSlope2 = args
    .nextU64()
    .expect('variableRateSlope2 argument is missing or invalid');
  Storage.set(variableRateSlope2Key, u64ToBytes(variableRateSlope2));
}

export function setStableRateSlope1(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);

  const stableRateSlope1 = args
    .nextU64()
    .expect('stableRateSlope1 argument is missing or invalid');
  Storage.set(stableRateSlope1Key, u64ToBytes(stableRateSlope1));
}

export function setStableRateSlope2(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);

  const stableRateSlope2 = args
    .nextU64()
    .expect('stableRateSlope2 argument is missing or invalid');
  Storage.set(stableRateSlope2Key, u64ToBytes(stableRateSlope2));
}

export function setReserve(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs);

  const reserve = args
    .nextString()
    .expect('reserve argument is missing or invalid');
  Storage.set(reserveKey, stringToBytes(reserve));
}

export function calculateInterestRates(
  binaryArgs: StaticArray<u8>,
): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const availableLiquidity = args.nextU64().unwrap();
  const totalBorrowsStable = args.nextU64().unwrap();
  const totalBorrowsVariable = args.nextU64().unwrap();
  const averageStableBorrowRate = args.nextU64().unwrap();

  const totalBorrows: u64 = totalBorrowsStable + totalBorrowsVariable;

  const utilizationRate =
    totalBorrows == 0 && availableLiquidity == 0
      ? 0.0
      : (f64(totalBorrows) / f64(availableLiquidity + totalBorrows)) * ONE_UNIT;

  // let currentStableBorrowRate = ILendingRateOracle(addressesProvider.getLendingRateOracle())
  //     .getMarketBorrowRate(_reserve);

  let currentStableBorrowRate: u64 = 1 * u64(ONE_UNIT);
  const baseVariableBorrowRate = bytesToU64(
    Storage.get(baseVariableBorrowRateKey),
  );
  const stableRateSlope1 = bytesToU64(Storage.get(stableRateSlope1Key));
  const stableRateSlope2 = bytesToU64(Storage.get(stableRateSlope2Key));
  const variableRateSlope1 = bytesToU64(Storage.get(variableRateSlope1Key));
  const variableRateSlope2 = bytesToU64(Storage.get(variableRateSlope2Key));

  let currentVariableBorrowRate: u64 = 0;

  if (utilizationRate > OPTIMAL_UTILIZATION_RATE) {
    const excessUtilizationRateRatio: f64 =
      (f64(utilizationRate - OPTIMAL_UTILIZATION_RATE) /
        EXCESS_UTILIZATION_RATE) *
      ONE_UNIT;

    currentStableBorrowRate = u64(
      f64(currentStableBorrowRate) +
        (f64(stableRateSlope1) + f64(stableRateSlope2)) *
          f64(excessUtilizationRateRatio / ONE_UNIT),
    );

    currentVariableBorrowRate = u64(
      f64(baseVariableBorrowRate) +
        (f64(variableRateSlope1) + f64(variableRateSlope2)) *
          f64(excessUtilizationRateRatio / ONE_UNIT),
    );
  } else {
    currentStableBorrowRate = u64(
      f64(currentStableBorrowRate) +
        f64(stableRateSlope1) * f64(utilizationRate / OPTIMAL_UTILIZATION_RATE),
    );
    currentVariableBorrowRate = u64(
      f64(baseVariableBorrowRate) +
        f64(variableRateSlope1) *
          f64(utilizationRate / OPTIMAL_UTILIZATION_RATE),
    );
  }

  const overAllBorrow: f64 = getOverallBorrowRateInternal(
    totalBorrowsStable,
    totalBorrowsVariable,
    currentVariableBorrowRate,
    averageStableBorrowRate,
  );

  const currentLiquidityRate: u64 = u64(
    overAllBorrow * f64(utilizationRate / ONE_UNIT),
  );

  generateEvent(
    `Interest Rate Data: ${utilizationRate}, ${currentLiquidityRate}, ${currentStableBorrowRate}, 
            ${currentVariableBorrowRate}`,
  );

  return new Args()
    .add<Array<u64>>([
      currentLiquidityRate,
      currentStableBorrowRate,
      currentVariableBorrowRate,
    ])
    .serialize();
}

function getOverallBorrowRateInternal(
  totalBorrowsStable: u64,
  totalBorrowsVariable: u64,
  currentVariableBorrowRate: u64,
  currentAverageStableBorrowRate: u64,
): f64 {
  const totalBorrows: f64 = f64(totalBorrowsStable) + f64(totalBorrowsVariable);

  if (totalBorrows == 0.0) {
    return 0.0;
  }

  const weightedVariableRate =
    f64(totalBorrowsVariable) * (f64(currentVariableBorrowRate) / ONE_UNIT);
  const weightedStableRate =
    f64(totalBorrowsStable) * (f64(currentAverageStableBorrowRate) / ONE_UNIT);
  const overallBorrowRate =
    ((weightedVariableRate + weightedStableRate) / totalBorrows) * ONE_UNIT;

  return overallBorrowRate;
}
