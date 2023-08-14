import { Args } from '@massalabs/as-types';
import {
    Address,
    Context,
    Storage,
    callerHasWriteAccess,
    generateEvent,
} from '@massalabs/massa-as-sdk';
import {
    caller,
    isDeployingContract,
} from '@massalabs/massa-as-sdk/assembly/std/context';

import { onlyOwner } from './ownership';

const ONE_UNIT = 10 ** 9;
export const ORIGNATION_FEE = 0.0025 * 10 ** 9;

/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param args - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(_: StaticArray<u8>): void {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    assert(callerHasWriteAccess());

    Storage.set(ORIGNATION_FEE, ORIGNATION_FEE * ONE_UNIT);
}

/**
 * This functions changes the core address.
 *
 * @param _args - The serialized arguments that should contain core smart contract address.
 *
 * @returns none
 *
 */
export function updateFee(fee: StaticArray<u8>): void {
    const args = new Args(fee);

    onlyOwner();

    // Then we create our key/value pair and store it.
    Storage.set(
        ORIGNATION_FEE,
        args.nextF64().expect('Fee is missing or invalid'),
    );

    // Here we generate an event that indicates the changes that are made.
    generateEvent('Updated fee of to' + args.nextU64().unwrap() + "'");
}

/**
 * This functions retrieves the core address.
 *
 * @returns The serialized address found.
 *
 */
export function getFee(): u64 {
    // We check if the entry exists.
    const fee = Storage.get(ORIGNATION_FEE);
    return fee;
}
