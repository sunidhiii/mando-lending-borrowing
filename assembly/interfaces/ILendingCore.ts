import { Amount, Args, Result, Serializable, byteToBool, bytesToFixedSizeArray, bytesToU256, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { u256 } from 'as-bignum/assembly';

const ONE_UNIT = 10 ** 9;
export class ILendingCore {

  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param {Address} at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  initReserve(reserve: StaticArray<u8>): void {
    // const arg = new Args().add(reserve);
    call(this._origin, "initReserve", new Args(reserve), 0);
  }

  getReserve(reserve: Address): Reserve {
    const result = call(this._origin, "getReserve", new Args().add(reserve), 0);
    const reserveData = new Args(result).nextSerializable<Reserve>().unwrap();
    return reserveData;
  }

  deleteReserve(reserve: Address): void {
    const arg = new Args().add(reserve);
    call(this._origin, "deleteReserve", arg, 0);
  }

  initUser(userReserve: UserReserve, reserve: Address): void {
    const arg = new Args().add(userReserve).add(reserve);
    call(this._origin, "initUser", arg, 10*ONE_UNIT);
  }

  getUserReserve(_user: Address, _reserve: Address): UserReserve {
    const result = call(this._origin, "getUserReserve", new Args().add(_user).add(_reserve), 0);
    const userData = new Args(result).nextSerializable<UserReserve>().unwrap();
    return userData;
  }

  transferToReserve(_reserve: Address, _user: Address, _amount: u256): void {
    const args = new Args().add(_reserve).add(_user).add(_amount);
    call(this._origin, "transferToReserve", args, 0);
  }

  transferFeeToOwner(_reserve: Address, _user: Address, _amount: u256): void {
    const args = new Args().add(_reserve).add(_user).add(_amount);
    call(this._origin, "transferFeeToOwner", args, 0);
  }

  transferToUser(_reserve: Address, _user: Address, _amount: u256): void {
    const args = new Args().add(_reserve).add(_user).add(_amount);
    call(this._origin, "transferToUser", args, 0);
  }

  viewAllReserves(): string[] {
    // let reserves = call(this._origin, "viewAllReserves", new Args(), 0);
    // let reservesData: string[] = reserves.toString().split(',');
    // let reservesData = new Args(reserves).nextStringArray().unwrap();
    // return reservesData;

    return bytesToFixedSizeArray<string>(call(this._origin, "viewAllReserves", new Args(), 0));
  }

  getReserveAvailableLiquidity(reserve: Address): u256 {
    return bytesToU256(call(this._origin, "getReserveAvailableLiquidity", new Args().add(reserve), 0));
  }

  getUserBorrowBalances(reserve: Address, user: Address): StaticArray<u64> {
    return bytesToFixedSizeArray<u64>(call(this._origin, "getUserBorrowBalances", new Args().add(reserve).add(user), 0));
  }

  updateStateOnBorrow(_user: Address, _reserve: Address, _amount: u256): void {
    const args = new Args().add(_user).add(_reserve).add(_amount);
    call(this._origin, "updateStateOnBorrow", args, 0);
  }

  updateStateOnRepay(_reserve: Address, _user: Address, _amount: u256): void {
    const args = new Args().add(_reserve).add(_user).add(_amount);
    call(this._origin, "updateStateOnRepay", args, 0);
  }

  updateStateOnRedeem(_reserve: Address, _user: Address, _amount: u256): void {
    const args = new Args().add(_reserve).add(_user).add(_amount);
    call(this._origin, "updateStateOnRedeem", args, 0);
  }

  getNormalizedIncome(reserve: string): u256 {
    return bytesToU256(call(this._origin, "getNormalizedIncome", new Args().add(reserve), 0));
  }

  getUserBasicReserveData(reserve: string, user: string): StaticArray<u256> {
    return bytesToFixedSizeArray<u256>(call(this._origin, "getUserBasicReserveData", new Args().add(reserve).add(user), 0));
  }

}