import { Args, Result, Serializable, byteToBool, bytesToFixedSizeArray, bytesToU64, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";
// import { UserReserve, Reserve } from '../contracts/LendingCore';

class UserReserve implements Serializable {
  constructor(
    public addr: Address = new Address(),
    public principalBorrowBalance: u64 = 0,
    public lastVariableBorrowCumulativeIndex: u64 = 0,
    public originationFee: u64 = 0,
    public stableBorrowRate: u64 = 0,
    public lastUpdateTimestamp: u64 = 0,
    public useAsCollateral: bool = false,
  ) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.addr);
    args.add(this.principalBorrowBalance);
    args.add(this.lastVariableBorrowCumulativeIndex);
    args.add(this.originationFee);
    args.add(this.stableBorrowRate);
    args.add(this.lastUpdateTimestamp);
    args.add(this.useAsCollateral);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);

    const addr = args.nextString();
    if (addr.isErr()) {
      return new Result(0, "Can't deserialize the addr");
    }
    this.addr = new Address(addr.unwrap());

    const principalBorrowBalance = args.nextU64();
    if (principalBorrowBalance.isErr()) {
      return new Result(0, "Can't deserialize the principalBorrowBalance");
    }
    this.principalBorrowBalance = u64(principalBorrowBalance.unwrap());

    const lastVariableBorrowCumulativeIndex = args.nextU64();
    if (lastVariableBorrowCumulativeIndex.isErr()) {
      return new Result(0, "Can't deserialize the lastVariableBorrowCumulativeIndex");
    }
    this.lastVariableBorrowCumulativeIndex = lastVariableBorrowCumulativeIndex.unwrap();

    const originationFee = args.nextU64();
    if (originationFee.isErr()) {
      return new Result(0, "Can't deserialize the originationFee");
    }
    this.originationFee = originationFee.unwrap();

    const stableBorrowRate = args.nextU64();
    if (stableBorrowRate.isErr()) {
      return new Result(0, "Can't deserialize the stableBorrowRate");
    }
    this.stableBorrowRate = stableBorrowRate.unwrap();

    const lastUpdateTimestamp = args.nextU64();
    if (lastUpdateTimestamp.isErr()) {
      return new Result(0, "Can't deserialize the lastUpdateTimestamp");
    }
    this.lastUpdateTimestamp = lastUpdateTimestamp.unwrap();

    const useAsCollateral = args.nextBool();
    if (useAsCollateral.isErr()) {
      return new Result(0, "Can't deserialize the useAsCollateral");
    }
    this.useAsCollateral = useAsCollateral.unwrap();

    return new Result(args.offset);
  }
}
class Reserve implements Serializable {
  constructor(
    public addr: Address = new Address(),
    public name: string = '',
    public symbol: string = '',
    public decimals: u64 = 0,
    public mTokenAddress: Address = new Address(),
    public interestCalcAddress: Address = new Address(),
    public baseLTV: u64 = 0,
    public LiquidationThreshold: u64 = 0,
    public LiquidationBonus: u64 = 0,
  ) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.addr);
    args.add(this.name);
    args.add(this.symbol);
    args.add(this.decimals);
    args.add(this.mTokenAddress);
    args.add(this.interestCalcAddress);
    args.add(this.baseLTV);
    args.add(this.LiquidationThreshold);
    args.add(this.LiquidationBonus);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);

    const addr = args.nextString();
    if (addr.isErr()) {
      return new Result(0, "Can't deserialize the addr");
    }
    this.addr = new Address(addr.unwrap());

    const name = args.nextString();
    if (name.isErr()) {
      return new Result(0, "Can't deserialize the name");
    }
    this.name = name.unwrap();

    const symbol = args.nextString();
    if (symbol.isErr()) {
      return new Result(0, "Can't deserialize the symbol");
    }
    this.symbol = symbol.unwrap();

    const decimals = args.nextU64();
    if (decimals.isErr()) {
      return new Result(0, "Can't deserialize the decimals");
    }
    this.decimals = decimals.unwrap();

    const mTokenAddress = args.nextString();
    if (mTokenAddress.isErr()) {
      return new Result(0, "Can't deserialize the mTokenAddress");
    }
    this.mTokenAddress = new Address(mTokenAddress.unwrap());

    const interestCalcAddress = args.nextString();
    if (interestCalcAddress.isErr()) {
      return new Result(0, "Can't deserialize the interestCalcAddress");
    }
    this.interestCalcAddress = new Address(interestCalcAddress.unwrap());

    const baseLTV = args.nextU64();
    if (baseLTV.isErr()) {
      return new Result(0, "Can't deserialize the baseLTV");
    }
    this.baseLTV = baseLTV.unwrap();

    const LiquidationThreshold = args.nextU64();
    if (LiquidationThreshold.isErr()) {
      return new Result(0, "Can't deserialize the LiquidationThreshold");
    }
    this.LiquidationThreshold = LiquidationThreshold.unwrap();

    const LiquidationBonus = args.nextU64();
    if (LiquidationBonus.isErr()) {
      return new Result(0, "Can't deserialize the LiquidationBonus");
    }
    this.LiquidationBonus = LiquidationBonus.unwrap();

    return new Result(args.offset);
  }
}
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
    call(this._origin, "initUser", arg, 0);
  }

  getUser(_user: Address, _reserve: Address): UserReserve {
    const result = call(this._origin, "getUser", new Args().add(_user).add(_reserve), 0);
    const userData = new Args(result).nextSerializable<UserReserve>().unwrap();
    return userData;
  }

  userExists(_user: Address, _reserve: Address): bool {
    return byteToBool(call(this._origin, "userExists", new Args().add(_user).add(_reserve), 0));
  }

  transferToReserve(_reserve: Address, _user: Address, _amount: u64): void {
    const args = new Args().add(_reserve).add(_user).add(_amount);
    call(this._origin, "transferToReserve", args, 0);
  }

  transferToUser(_reserve: Address, _user: Address, _amount: u64): void {
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

  getReserveAvailableLiquidity(reserve: Address): u64 {
    return bytesToU64(call(this._origin, "getReserveAvailableLiquidity", new Args().add(reserve), 0));
  }

}