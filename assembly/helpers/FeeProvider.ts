import { Args } from '@massalabs/as-types';
import { Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { onlyOwner } from './ownership';

const ONE_UNIT = 10 ** 9;
export const ORIGNATION_FEE = 0.0025;

export function constructor(_: StaticArray<u8>): void {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    assert(callerHasWriteAccess());
    Storage.set(ORIGNATION_FEE, ORIGNATION_FEE * ONE_UNIT);
}

export function updateFee(binaryArgs: StaticArray<u8>): void {
    const args = new Args(binaryArgs);
    const fee = args.nextF64().expect('Fee is missing or invalid');

    onlyOwner();
    // Then we create our key/value pair and store it.
    Storage.set(
        ORIGNATION_FEE,
        fee
    );

    // Here we generate an event that indicates the changes that are made.
    generateEvent('Updated origination fee to' + args.nextF64().unwrap() + "'");
}

export function getLoanOriginationFeePercentage(): f64 {
    const fee = Storage.get(ORIGNATION_FEE);
    return fee;
}

export function calculateLoanOriginationFee(binaryArgs: StaticArray<u8>): f64 {
    const args = new Args(binaryArgs);
    const amount = args.nextU256().expect('amount is missing or invalid');

    const fee = getLoanOriginationFeePercentage();

    return f64(parseFloat(amount.toString()) * (fee));
}
