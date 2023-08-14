import { Args, Result, Serializable } from "@massalabs/as-types";
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

    getCore(): Address {
        const result = new Args(call(this._origin, "getCore", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

    getLendingPool(): Address {
        const result = new Args(call(this._origin, "getLendingPool", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

    getConfigurator(): Address {
        const result = new Args(call(this._origin, "getConfigurator", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

    getFeeProvider(): Address {
        const result = new Args(call(this._origin, "getFeeProvider", new Args(), 0));
        return new Address(result.nextString().unwrap());
    }

}