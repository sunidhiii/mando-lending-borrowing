import { Amount, Args, bytesToFixedSizeArray, bytesToU64 } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import { u256 } from 'as-bignum/assembly';

export class ITest {

  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param {Address} at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  arrU64(amount: u256): Array<u64> {
    // const arg = new Args().add(reserve);
    return new Args(call(this._origin, "arrU64", new Args().add(amount), 0)).nextFixedSizeArray<u64>().unwrap();
  }

  arrU64Again(amount: u256): Array<u64> {
    // const arg = new Args().add(reserve);
    return bytesToFixedSizeArray<u64>(call(this._origin, "arrU64Again", new Args().add(amount), 0));
  }

  arrU64Again1(amount: u256): Array<u64> {
    // const arg = new Args().add(reserve);
    return bytesToFixedSizeArray<u64>(call(this._origin, "arrU64Again1", new Args().add(amount), 0));
  }

  arrU64Again2(amount: u256): Array<u64> {  // Worked
    // const arg = new Args().add(reserve);
    return new Args(call(this._origin, "arrU64Again1", new Args().add(amount), 0)).nextFixedSizeArray<u64>().unwrap();
  }

}