import { Amount, Args, Result, Serializable, byteToBool, bytesToFixedSizeArray, bytesToSerializableObjectArray, bytesToU256, bytesToU64, stringToBytes } from "@massalabs/as-types";
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

  calculateUserHealthFactorBelowThresh(totalCollateralBalanceUSD: u64, totalBorrowBalanceUSD: u64, totalFeesUSD: u64, currentLiquidationThreshold: u8): bool {
    return byteToBool(call(this._origin, "calculateUserHealthFactorBelowThresh", new Args().add(totalCollateralBalanceUSD).add(totalBorrowBalanceUSD).add(totalFeesUSD).add(currentLiquidationThreshold), 0));
  }

  calculateCollateralNeededInUSD(reserve: string, amount: u64, fee: u64, userCurrentBorrowBalancUSD: u64, userCurrentFeesUSD: u64, userCurrentLtv: u8): u64 {
    return bytesToU64(call(this._origin, "calculateCollateralNeededInUSD", new Args().add(reserve).add(amount).add(fee).add(userCurrentBorrowBalancUSD).add(userCurrentFeesUSD).add(userCurrentLtv), 0));
  }

  balanceDecreaseAllowed(underlyingAssetAddress: string, user: string, amount: u64): bool {
    return byteToBool(call(this._origin, "balanceDecreaseAllowed", new Args().add(underlyingAssetAddress).add(user).add(amount), 0));
  }
}