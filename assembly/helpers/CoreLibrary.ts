import { generateEvent, Context, callerHasWriteAccess, Storage, Address } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { onlyOwner } from './ownership';

const ONE_UNIT = 10 ** 9;
export const ORIGNATION_FEE = 0.0025 * 10 ** 9;
enum InterestRateMode {NONE, STABLE, VARIABLE}

class UserReserve implements Serializable {
    constructor(
      public principalBorrowBalance: u64 = 0,
      public lastVariableBorrowCumulativeIndex: u64 = 0,
      public originationFee: u64 = 0,
      public stableBorrowRate: u64 = 0,
      public lastUpdateTimestamp: u64 = 0,
      public useAsCollateral: bool = false,
    ) { }
  
    public serialize(): StaticArray<u8> {
      const args = new Args();
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
    args.add(this.interestCalcAddress);
    args.add(this.baseLTV);
    args.add(this.LiquidationThreshold);
    args.add(this.LiquidationBonus);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
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

/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param args - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(_: StaticArray<u8>): void {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    assert(callerHasWriteAccess());

    Storage.set(ORIGNATION_FEE, ORIGNATION_FEE * ONE_UNIT);
}

/**
 * This functions changes the core address.
 *
 * @param _args - The serialized arguments that should contain core smart contract address.
 *
 * @returns none
 *
 */
export function updateFee(fee: StaticArray<u8>): void {
    const args = new Args(fee);

    onlyOwner();

    // Then we create our key/value pair and store it.
    Storage.set(
        ORIGNATION_FEE,
        args.nextF64().expect('Fee is missing or invalid'),
    );

    // Here we generate an event that indicates the changes that are made.
    generateEvent('Updated fee of to' + args.nextU64().unwrap() + "'");
}

/**
 * This functions retrieves the core address.
 *
 * @returns The serialized address found.
 *
 */
export function getFee(): u64 {
    // We check if the entry exists.
    const fee = Storage.get(ORIGNATION_FEE);
    return fee;
}
