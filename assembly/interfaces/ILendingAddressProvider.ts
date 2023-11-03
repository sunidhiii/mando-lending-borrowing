import { Args, NoArg, bytesToString } from "@massalabs/as-types";
import { Address, Storage, call } from "@massalabs/massa-as-sdk";

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

    setCore(coreAddress: string): void {
        const arg = new Args().add(coreAddress);
        call(this._origin, "setCore", arg, 0);
    }

    getCore(): string {
        return bytesToString(call(this._origin, "getCore", NoArg, 0));
    }

    setLendingPool(poolAddress: string): void {
        const arg = new Args().add(poolAddress);
        call(this._origin, "setLendingPool", arg, 0);
    }

    getLendingPool(): string {
        return bytesToString(call(this._origin, "getLendingPool", NoArg, 0));
    }
    
    setConfigurator(configuratorAddress: string): void {
        const arg = new Args().add(configuratorAddress);
        call(this._origin, "setConfigurator", arg, 0);
    }

    getConfigurator(): string {
        return bytesToString(call(this._origin, "getConfigurator", NoArg, 0));
    }

    setDataProvider(dataProviderAddress: string): void {
        const arg = new Args().add(dataProviderAddress);
        call(this._origin, "setDataProvider", arg, 0);
    }

    getDataProvider(): string {
        return bytesToString(call(this._origin, "getDataProvider", NoArg, 0));
    }

    setFeeProvider(feeProviderAddress: string): void {
        const arg = new Args().add(feeProviderAddress);
        call(this._origin, "setConfigurator", arg, 0);
    }

    getFeeProvider(): string {
        return bytesToString(call(this._origin, "getFeeProvider", NoArg, 0));
    }

    getOwner(): string {
        return Storage.getOf(this._origin, 'OWNER');
    }

}