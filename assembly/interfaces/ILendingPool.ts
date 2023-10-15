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

  deposit(reserve: string, user: string, amount: u64): void {
    call(this._origin, "deposit", new Args().add(reserve).add(user).add(amount), 0);
  }

  redeemUnderlying(reserve: string, user: string, amount: u64, mTokenBalanceAfterRedeem: u64): void {
    // const arg = new Args().add(reserve);
    call(this._origin, "redeemUnderlying", new Args().add(reserve).add(user).add(amount).add(mTokenBalanceAfterRedeem), 0);
  }

}