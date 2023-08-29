import { Serializable, Args, Result } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

export default class UserReserve implements Serializable {
    constructor(
      public addr: string = '',
      public principalBorrowBalance: u256 = new u256(0),
      public lastVariableBorrowCumulativeIndex: u256 = new u256(0),
      public originationFee: u256 = new u256(0),
      public stableBorrowRate: u256 = new u256(0),
      public lastUpdateTimestamp: u256 = new u256(0),
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
      this.addr = addr.unwrap();
  
      const principalBorrowBalance = args.nextU256();
      if (principalBorrowBalance.isErr()) {
        return new Result(0, "Can't deserialize the principalBorrowBalance");
      }
      this.principalBorrowBalance = principalBorrowBalance.unwrap();
  
      const lastVariableBorrowCumulativeIndex = args.nextU256();
      if (lastVariableBorrowCumulativeIndex.isErr()) {
        return new Result(0, "Can't deserialize the lastVariableBorrowCumulativeIndex");
      }
      this.lastVariableBorrowCumulativeIndex = lastVariableBorrowCumulativeIndex.unwrap();
  
      const originationFee = args.nextU256();
      if (originationFee.isErr()) {
        return new Result(0, "Can't deserialize the originationFee");
      }
      this.originationFee = originationFee.unwrap();
  
      const stableBorrowRate = args.nextU256();
      if (stableBorrowRate.isErr()) {
        return new Result(0, "Can't deserialize the stableBorrowRate");
      }
      this.stableBorrowRate = stableBorrowRate.unwrap();
  
      const lastUpdateTimestamp = args.nextU256();
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