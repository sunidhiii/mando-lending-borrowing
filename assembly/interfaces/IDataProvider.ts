import { Amount, Args, Result, Serializable, byteToBool, bytesToFixedSizeArray, bytesToSerializableObjectArray, bytesToU256, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import Reserve from '../helpers/Reserve';
import { u256 } from 'as-bignum/assembly';

export class IDataProvider {

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

  calculateUserGlobalData(reserve: Address, user: Address): void {
    
  }

  balanceDecreaseAllowed(underlyingAssetAddress: Address, user: Address, amount: u256): bool {
    return byteToBool(call(this._origin, "balanceDecreaseAllowed", new Args().add(underlyingAssetAddress).add(user).add(amount), 0));
  }
}