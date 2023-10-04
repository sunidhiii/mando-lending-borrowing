import { Args, bytesToU64, fixedSizeArrayToBytes, stringToBytes, u64ToBytes } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { onlyOwner } from '../helpers/ownership';

export const ONE_UNIT: u64 = 10 ** 9;
export const OPTIMAL_UTILIZATION_RATE: u64 = 800000000;
export const EXCESS_UTILIZATION_RATE: u64 = 200000000;

export const baseVariableBorrowRateKey = stringToBytes('BASE_VARIABLE_BORROW_RATE'); // 0
export const variableRateSlope1Key = stringToBytes('VARIABLE_SLOPE1');  // 0.08
export const variableRateSlope2Key = stringToBytes('VARIABLE_SLOPE2');  // 1
export const stableRateSlope1Key = stringToBytes('STABLE_SLOPE1');      // 0.1
export const stableRateSlope2Key = stringToBytes('STABLE_SLOPE2');      // 1
export const reserveKey = stringToBytes('RESERVE');

/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param args - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    assert(callerHasWriteAccess());

    const args = new Args(binaryArgs);
    // const provider = args.nextString().unwrap();

    // Storage.set(
    //     'PROVIDER_ADDR',
    //     provider
    // );

    //   const core = provider.getCore();
    //   // const core = new Args(call(provider, 'getCore', new Args(), 0))
    //   Storage.set(
    //     'CORE_ADDR',
    //     core.toString(),
    //   );

    const baseVariableBorrowRate = args.nextU64().expect('baseVariableBorrowRate argument is missing or invalid');
    const variableRateSlope1 = args.nextU64().expect('variableRateSlope1 argument is missing or invalid');
    const variableRateSlope2 = args.nextU64().expect('variableRateSlope2 argument is missing or invalid');
    const stableRateSlope1 = args.nextU64().expect('stableRateSlope1 argument is missing or invalid');
    const stableRateSlope2 = args.nextU64().expect('stableRateSlope2 argument is missing or invalid');
    const reserve = args.nextString().expect('reserve argument is missing or invalid');

    Storage.set(baseVariableBorrowRateKey, u64ToBytes(baseVariableBorrowRate));
    Storage.set(variableRateSlope1Key, u64ToBytes(variableRateSlope1));
    Storage.set(variableRateSlope2Key, u64ToBytes(variableRateSlope2));
    Storage.set(stableRateSlope1Key, u64ToBytes(stableRateSlope1));
    Storage.set(stableRateSlope2Key, u64ToBytes(stableRateSlope2));
    Storage.set(reserveKey, stringToBytes(reserve));

    generateEvent(`Interest Rate Strategy constructor called with all details.`);

    return [];
}

export function getBaseVariableBorrowRate(): StaticArray<u8> {
    const baseVariableBorrowRate = Storage.get(baseVariableBorrowRateKey);
    return baseVariableBorrowRate;
}

export function getVariableRateSlope1(): StaticArray<u8> {
    const variableRateSlope1 = Storage.get(variableRateSlope1Key);
    return variableRateSlope1;
}

export function getVariableRateSlope2(): StaticArray<u8> {
    const variableRateSlope2 = Storage.get(variableRateSlope2Key);
    return variableRateSlope2;
}

export function getStableRateSlope1(): StaticArray<u8> {
    const stableRateSlope1 = Storage.get(stableRateSlope1Key);
    return stableRateSlope1;
}

export function getStableRateSlope2(): StaticArray<u8> {
    const stableRateSlope2 = Storage.get(stableRateSlope2Key);
    return stableRateSlope2;
}

export function calculateInterestRates(binaryArgs: StaticArray<u8>): StaticArray<u8> {

    const args = new Args(binaryArgs);
    // const reserve = new Address(args.nextString().unwrap());
    const availableLiquidity = args.nextU64().unwrap();
    const totalBorrowsStable = args.nextU64().unwrap();
    const totalBorrowsVariable = args.nextU64().unwrap();
    const averageStableBorrowRate = args.nextU64().unwrap();

    const totalBorrows: u64 = totalBorrowsStable + totalBorrowsVariable;

    const utilizationRate = (totalBorrows == 0 && availableLiquidity == 0)
        ? 0
        : totalBorrows * ONE_UNIT / (availableLiquidity + totalBorrows);

    // let currentStableBorrowRate = ILendingRateOracle(addressesProvider.getLendingRateOracle())
    //     .getMarketBorrowRate(_reserve);

    let currentStableBorrowRate: u64 = 1 * ONE_UNIT;
    const baseVariableBorrowRate = bytesToU64(Storage.get(baseVariableBorrowRateKey));
    const stableRateSlope1 = bytesToU64(Storage.get(stableRateSlope1Key));
    const stableRateSlope2 = bytesToU64(Storage.get(stableRateSlope2Key));
    const variableRateSlope1 = bytesToU64(Storage.get(variableRateSlope1Key));
    const variableRateSlope2 = bytesToU64(Storage.get(variableRateSlope2Key));

    let currentVariableBorrowRate: u64 = 1 * ONE_UNIT;

    if (utilizationRate > OPTIMAL_UTILIZATION_RATE) {
        const excessUtilizationRateRatio: u64 = (utilizationRate - OPTIMAL_UTILIZATION_RATE) 
            / EXCESS_UTILIZATION_RATE;

        currentStableBorrowRate = (currentStableBorrowRate - stableRateSlope1 + 
            stableRateSlope2) * excessUtilizationRateRatio;

        currentVariableBorrowRate = (baseVariableBorrowRate + variableRateSlope1 +
            variableRateSlope2) * excessUtilizationRateRatio;
    } else {
        currentStableBorrowRate = ((currentStableBorrowRate + stableRateSlope1) * utilizationRate) / OPTIMAL_UTILIZATION_RATE;
        currentVariableBorrowRate = ((baseVariableBorrowRate + utilizationRate) / OPTIMAL_UTILIZATION_RATE) * variableRateSlope1;
    }

    const overAllBorrow: u64 = getOverallBorrowRateInternal(totalBorrowsStable, totalBorrowsVariable, currentVariableBorrowRate, averageStableBorrowRate);

    const currentLiquidityRate: u64 = overAllBorrow * utilizationRate;

    // let interestData: Array<u64> = new Array(3)

    // interestData.push(currentLiquidityRate);
    // interestData.push(currentStableBorrowRate);
    // interestData.push(currentVariableBorrowRate);

    generateEvent(`Data ${currentLiquidityRate} , ${currentStableBorrowRate}, ${currentVariableBorrowRate}`)

    return new Args().add<Array<u64>>([currentLiquidityRate, currentStableBorrowRate, currentVariableBorrowRate]).serialize();
}

function getOverallBorrowRateInternal(totalBorrowsStable: u64, totalBorrowsVariable: u64, currentVariableBorrowRate: u64, currentAverageStableBorrowRate: u64): u64 {

    const totalBorrows: u64 = totalBorrowsStable + totalBorrowsVariable;

    if (totalBorrows == 0) {
        return 0;
    }

    const weightedVariableRate = (totalBorrowsVariable * currentVariableBorrowRate) / ONE_UNIT;

    const weightedStableRate = (totalBorrowsStable * currentAverageStableBorrowRate) / ONE_UNIT;

    const overallBorrowRate = (weightedVariableRate + weightedStableRate) / totalBorrows;

    return overallBorrowRate;
}


