import { generateEvent, Context, callerHasWriteAccess, Storage, Address } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { onlyOwner } from '../helpers/ownership';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'

const ONE_UNIT = 10 ** 9;
const RESERVE_KEY = 'RESERVE_KEY';

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
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param providerAddress - Arguments serialized with Args
 */
export function constructor(providerAddress: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return [];
  }

  const args = new Args(providerAddress);
  const provider = new ILendingAddressProvider(new Address(args.nextString().expect('Provider Address argument is missing or invalid')))

  Storage.set(
      'PROVIDER_ADDR',
      args.nextString().unwrap(),
  );
  generateEvent(`Constructor called with provider address ${provider}`);
  return [];
}

export function initReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserve: Reserve = args.nextSerializable<Reserve>().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserve.addr}`;

  // check reserve does not already exist
  const reserveExists = Storage.has(storageKey);
  assert(!reserveExists, 'Reserve already exists');

  // save reserve to storage
  Storage.set(stringToBytes(storageKey), reserve.serialize());
}

export function getReserve(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(storageKey);
  assert(reserveExists, 'Reserve does not exist');

  // get the serialized reserve info
  return Storage.get(stringToBytes(storageKey));
}

export function deleteReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();
  
  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(storageKey);
  assert(reserveExists, 'Reserve does not exist');

  // delete the serialized reserve info
  return Storage.del(stringToBytes(storageKey));
}
