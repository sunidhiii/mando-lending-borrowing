import { Args, bytesToU64, stringToBytes, u64ToBytes } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider';

export const ORIGNATION_FEE: u64 = 2500000;   // 100000000000
export const ONE_UNIT: u64 = 10 ** 9;

export function constructor(binaryArgs: StaticArray<u8>): void {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    assert(callerHasWriteAccess());

    const args = new Args(binaryArgs);
    const provider = args.nextString().expect('Provider Address argument is missing or invalid');

    Storage.set(
      'ADDRESS_PROVIDER_ADDR',
      provider,
    );

    Storage.set(stringToBytes('ORIGNATION_FEE'), u64ToBytes(ORIGNATION_FEE));
    generateEvent(`Fee Provider called with origination fee.`);

}

export function updateFee(binaryArgs: StaticArray<u8>): void {

    onlyOwner();

    const args = new Args(binaryArgs);
    const fee = args.nextU64().unwrap();

    // Then we create our key/value pair and store it.
    Storage.set(
        stringToBytes('ORIGNATION_FEE'),
        u64ToBytes(fee)
    );

    // Here we generate an event that indicates the changes that are made.
    generateEvent(`Updated origination fee to ${fee}`);
}

export function getLoanOriginationFeePercentage(): StaticArray<u8> {
    const fee = Storage.get(stringToBytes('ORIGNATION_FEE'));
    return fee;
}

export function calculateLoanOriginationFee(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);
    const amount = args.nextU64().expect('amount is missing or invalid');

    const fee = bytesToU64(getLoanOriginationFeePercentage());
    return u64ToBytes(u64(f64(amount) * (f64(fee) / f64(ONE_UNIT))));
}

function onlyOwner(): void {
    const addressProvider = Storage.get('ADDRESS_PROVIDER_ADDR');
    const owner = new ILendingAddressProvider(new Address(addressProvider)).getOwner();
  
    assert(Context.caller().toString() === owner, 'Caller is not the owner');
}
