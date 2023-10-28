import { Args, u64ToBytes } from '@massalabs/as-types';
import { Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { onlyOwner } from '../helpers/ownership';

export const ORIGNATION_FEE: u64 = 2500000;   // 100000000000
export const ONE_UNIT: u64 = 10 ** 9;

export function constructor(_: StaticArray<u8>): void {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    assert(callerHasWriteAccess());
    Storage.set('ORIGNATION_FEE', ORIGNATION_FEE.toString());

    generateEvent(`Fee Provider called with origination fee.`);

}

export function updateFee(binaryArgs: StaticArray<u8>): void {

    // onlyOwner();

    const args = new Args(binaryArgs);
    const fee = args.nextU64().unwrap();

    // Then we create our key/value pair and store it.
    Storage.set(
        'ORIGNATION_FEE',
        fee.toString()
    );

    // Here we generate an event that indicates the changes that are made.
    generateEvent('Updated origination fee to');
}

function getLoanOriginationFeePercentage(): u64 {
    const fee = Storage.get('ORIGNATION_FEE');
    return u64.parse(fee);
}

export function calculateLoanOriginationFee(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);
    const amount = args.nextU64().expect('amount is missing or invalid');

    const fee = getLoanOriginationFeePercentage();
    return u64ToBytes(u64(f64(amount) * (f64(fee) / f64(ONE_UNIT))));
}
