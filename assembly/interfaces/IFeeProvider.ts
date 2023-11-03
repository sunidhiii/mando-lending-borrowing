import { Args, bytesToU64 } from "@massalabs/as-types";
import { Address, call } from "@massalabs/massa-as-sdk";

export class IFeeProvider {

  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param {Address} at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  updateFee(fee: u64): void {
    // const arg = new Args().add(reserve);
    call(this._origin, "updateFee", new Args().add(fee), 0);
  }

  // getLoanOriginationFeePercentage(): u64 {
  //   // const arg = new Args().add(reserve);
  //   return bytesToU64(call(this._origin, "getLoanOriginationFeePercentage", new Args(), 0));
  // }

  calculateLoanOriginationFee(amount: u64): u64 {
    return bytesToU64(call(this._origin, "calculateLoanOriginationFee", new Args().add(amount), 0));
  }

}