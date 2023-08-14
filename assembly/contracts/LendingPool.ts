// The entry file of your WebAssembly module.
import { call, Address, Context, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes } from '@massalabs/as-types';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param binaryArgs - Arguments serialized with Args
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

    const feeProvider = provider.getFeeProvider();
    Storage.set(
        'FEE_PROVIDER',
        feeProvider.toString(),
    );

    return [];
}

/**
 * @param _ - not used
 * @returns the emitted event serialized in bytes
 */
export function deposit(_: StaticArray<u8>): StaticArray<u8> {
    const message = "I'm an event!";
    generateEvent(message);
    return stringToBytes(message);
}

export function borrow(_: StaticArray<u8>): StaticArray<u8> {
    const message = "I'm an event!";
    generateEvent(message);
    return stringToBytes(message);
}

export function redeemUnderlying(_: StaticArray<u8>): StaticArray<u8> {
    const message = "I'm an event!";
    generateEvent(message);
    return stringToBytes(message);
}

export function repay(_: StaticArray<u8>): StaticArray<u8> {
    const message = "I'm an event!";
    generateEvent(message);
    return stringToBytes(message);
}
