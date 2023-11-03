import { Args, Result, Serializable } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import { TokenWrapper } from "../helpers/TokenWrapper";
import { u256 } from 'as-bignum/assembly';

export class IERC20 extends TokenWrapper implements Serializable {
    constructor(origin: Address = new Address()) {
        super(origin);
    }

    init(name: string, symbol: string, decimals: u8, supply: u256): void {
        const args = new Args().add(name).add(symbol).add(decimals).add(supply);
        call(this._origin, "constructor", args, 0);
    }

    serialize(): StaticArray<u8> {
        return this._origin.serialize();
    }

    deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
        return this._origin.deserialize(data, offset);
    }

    // OVERRIDE WRAPPER

    notEqual(other: IERC20): bool {
        return this._origin.notEqual(other._origin);
    }

    equals(other: IERC20): bool {
        return this._origin.equals(other._origin);
    }
    
}