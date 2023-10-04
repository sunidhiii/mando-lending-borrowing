import { Args, Result, Serializable, bytesToString, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";

export class ILendingAddressProvider {

    _origin: Address;

    /**
     * Wraps a smart contract exposing standard token FFI.
     *
     * @param {Address} at - Address of the smart contract.
     */
    constructor(at: Address) {
        this._origin = at;
    }

    setCore(coreAddress: StaticArray<u8>): void {
        const arg = new Args(coreAddress);
        call(this._origin, "setCore", arg, 0);
    }

    getCore(): string {
        return bytesToString(call(this._origin, "getCore", new Args(), 0));
    }

    setLendingPool(poolAddress: StaticArray<u8>): void {
        const arg = new Args(poolAddress);
        call(this._origin, "setLendingPool", arg, 0);
    }

    getLendingPool(): string {
        return bytesToString(call(this._origin, "getLendingPool", new Args(), 0));
    }
    
    setConfigurator(configuratorAddress: StaticArray<u8>): void {
        const arg = new Args(configuratorAddress);
        call(this._origin, "setConfigurator", arg, 0);
    }

    getConfigurator(): string {
        return bytesToString(call(this._origin, "getConfigurator", new Args(), 0));
    }

    setDataProvider(dataProviderAddress: StaticArray<u8>): void {
        const arg = new Args(dataProviderAddress);
        call(this._origin, "setDataProvider", arg, 0);
    }

    getDataProvider(): string {
        return bytesToString(call(this._origin, "getDataProvider", new Args(), 0));
    }

    setFeeProvider(feeProviderAddress: StaticArray<u8>): void {
        const arg = new Args(feeProviderAddress);
        call(this._origin, "setConfigurator", arg, 0);
    }

    getFeeProvider(): string {
        return bytesToString(call(this._origin, "getFeeProvider", new Args(), 0));
    }

}