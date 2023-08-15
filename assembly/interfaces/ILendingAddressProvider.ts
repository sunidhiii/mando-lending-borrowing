import { Args, Result, Serializable, stringToBytes } from "@massalabs/as-types";
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

    getCore(): Address {
        const result = new Args(call(this._origin, "getCore", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

    setLendingPool(poolAddress: StaticArray<u8>): void {
        const arg = new Args(poolAddress);
        call(this._origin, "setLendingPool", arg, 0);
    }

    getLendingPool(): Address {
        const result = new Args(call(this._origin, "getLendingPool", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }
    
    setConfigurator(configuratorAddress: StaticArray<u8>): void {
        const arg = new Args(configuratorAddress);
        call(this._origin, "setConfigurator", arg, 0);
    }

    getConfigurator(): Address {
        const result = new Args(call(this._origin, "getConfigurator", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

    setFeeProvider(feeProviderAddress: StaticArray<u8>): void {
        const arg = new Args(feeProviderAddress);
        call(this._origin, "setConfigurator", arg, 0);
    }

    getFeeProvider(): Address {
        const result = new Args(call(this._origin, "getFeeProvider", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

}