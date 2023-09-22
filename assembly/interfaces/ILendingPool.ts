import { Amount, Args, Result, Serializable, byteToBool, bytesToU256, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { u256 } from 'as-bignum/assembly';

export class ILendingPool {

  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param {Address} at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  redeemUnderlying(reserve: Address, user: Address, amount: u256, mTokenBalanceAfterRedeem: u256): void {
    // const arg = new Args().add(reserve);
    call(this._origin, "redeemUnderlying", new Args().add(reserve).add(user).add(amount).add(mTokenBalanceAfterRedeem), 0);
  }

}