import { Args } from "@massalabs/as-types";
import { Address, call } from "@massalabs/massa-as-sdk";

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

  depositRewards(reserve: string, user: string, amount: u64): void {
    call(this._origin, "depositRewards", new Args().add(reserve).add(user).add(amount), 2);
  }

  redeemUnderlying(reserve: string, user: string, amount: u64, mTokenBalanceAfterRedeem: u64): void {
    // const arg = new Args().add(reserve);
    call(this._origin, "redeemUnderlying", new Args().add(reserve).add(user).add(amount).add(mTokenBalanceAfterRedeem), 2);
  }

}