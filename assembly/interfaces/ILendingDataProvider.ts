import { Amount, Args, Result, Serializable, byteToBool, bytesToFixedSizeArray, bytesToSerializableObjectArray, bytesToU256, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
import Reserve from '../helpers/Reserve';
import { u256 } from 'as-bignum/assembly';

export class ILendingDataProvider {

  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param {Address} at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  calculateUserGlobalData(user: string): Array<u64> {
    return new Args(call(this._origin, "calculateUserGlobalData", new Args().add(user), 0)).nextFixedSizeArray<u64>().unwrap();
  }

  calculateUserHealthFactorBelowThresh(totalCollateralBalanceETH: u256, totalBorrowBalanceETH: u256, totalFeesETH: u256, currentLiquidationThreshold: u8): bool {
    return byteToBool(call(this._origin, "calculateUserHealthFactorBelowThresh", new Args().add(totalCollateralBalanceETH).add(totalBorrowBalanceETH).add(totalFeesETH).add(currentLiquidationThreshold), 0));
  }

  calculateCollateralNeededInETH(reserve: string, amount: u256, fee: u256, userCurrentBorrowBalanceTH: u256, userCurrentFeesETH: u256, userCurrentLtv: u8): u256 {
    return bytesToU256(call(this._origin, "calculateCollateralNeededInETH", new Args().add(reserve).add(amount).add(fee).add(userCurrentBorrowBalanceTH).add(userCurrentFeesETH).add(userCurrentLtv), 0));
  }

  balanceDecreaseAllowed(underlyingAssetAddress: string, user: string, amount: u256): bool {
    return byteToBool(call(this._origin, "balanceDecreaseAllowed", new Args().add(underlyingAssetAddress).add(user).add(amount), 0));
  }
}