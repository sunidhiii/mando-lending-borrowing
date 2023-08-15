import { Args, Result, Serializable, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";

export class IToken {

    _origin: Address;

    /**
     * Wraps a smart contract exposing standard token FFI.
     *
     * @param {Address} at - Address of the smart contract.
     */
    constructor(at: Address) {
        this._origin = at;
    }

    initReserve(binaryArgs: StaticArray<u8>): void {
        const arg = new Args(binaryArgs);
        call(this._origin, "initReserve", arg, 0);
    }

    getReserve(binaryArgs: StaticArray<u8>): Reserve {
        const result = call(this._origin, "getReserve", new Args(), 0);
        const reserveData = new Args(result).nextSerializable<Reserve>().unwrap();
        return reserveData;
    }

    deleteReserve(binaryArgs: StaticArray<u8>): void {
        const arg = new Args(binaryArgs);
        call(this._origin, "deleteReserve", arg, 0);
    }

}