import { Amount, Args, bytesToF64 } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { u256 } from 'as-bignum/assembly';

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

  updateFee(fee: f64): void {
    // const arg = new Args().add(reserve);
    call(this._origin, "updateFee", new Args().add(fee), 0);
  }

  getLoanOriginationFeePercentage(): f64 {
    // const arg = new Args().add(reserve);
    return bytesToF64(call(this._origin, "getLoanOriginationFeePercentage", new Args(), 0));
  }

  calculateLoanOriginationFee(amount: u256): f64 {
    // const arg = new Args().add(reserve);
    return bytesToF64(call(this._origin, "calculateLoanOriginationFee", new Args().add(amount), 0));
  }

}