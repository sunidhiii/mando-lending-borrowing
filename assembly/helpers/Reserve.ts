import { Serializable, Args, Result } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

export default class Reserve implements Serializable {
    constructor(
      public addr: string = '',
      public name: string = '',
      public symbol: string = '',
      public decimals: u256 = new u256(0),
      public mTokenAddress: string = '',
      public interestCalcAddress: string = '',
      public baseLTV: u256 = new u256(0),
      public LiquidationThreshold: u256 = new u256(0),
      public LiquidationBonus: u256 = new u256(0),
      public lastUpdateTimestamp: u256 = new u256(0),
      public lastUpdateTimelastLiquidityCumulativeIndexstamp: u256 = new u256(0),
      public lastLiquidityCumulativeIndex: u256 = new u256(0),
      public currentLiquidityRate: u256 = new u256(0),
      public totalBorrowsStable: u256 = new u256(0),
      public totalBorrowsVariable: u256 = new u256(0),
      public currentVariableBorrowRate: u256 = new u256(0),
      public currentStableBorrowRate: u256 = new u256(0),
      public currentAverageStableBorrowRate: u256 = new u256(0),
      public lastVariableBorrowCumulativeIndex: u256 = new u256(0),
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
      args.add(this.lastUpdateTimestamp);
      args.add(this.lastUpdateTimelastLiquidityCumulativeIndexstamp);
      args.add(this.lastLiquidityCumulativeIndex);
      args.add(this.currentLiquidityRate);
      args.add(this.totalBorrowsStable);
      args.add(this.totalBorrowsVariable);
      args.add(this.currentVariableBorrowRate);
      args.add(this.currentStableBorrowRate);
      args.add(this.currentAverageStableBorrowRate);
      args.add(this.lastVariableBorrowCumulativeIndex);
      return args.serialize();
    }
  
    public deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
      const args = new Args(data, offset);
  
      const addr = args.nextString();
      if (addr.isErr()) {
        return new Result(0, "Can't deserialize the addr");
      }
      this.addr = addr.unwrap();
  
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
  
      const decimals = args.nextU256();
      if (decimals.isErr()) {
        return new Result(0, "Can't deserialize the decimals");
      }
      this.decimals = decimals.unwrap();
  
      const mTokenAddress = args.nextString();
      if (mTokenAddress.isErr()) {
        return new Result(0, "Can't deserialize the mTokenAddress");
      }
      this.mTokenAddress = mTokenAddress.unwrap();
  
      const interestCalcAddress = args.nextString();
      if (interestCalcAddress.isErr()) {
        return new Result(0, "Can't deserialize the interestCalcAddress");
      }
      this.interestCalcAddress = interestCalcAddress.unwrap();
  
      const baseLTV = args.nextU256();
      if (baseLTV.isErr()) {
        return new Result(0, "Can't deserialize the baseLTV");
      }
      this.baseLTV = baseLTV.unwrap();
  
      const LiquidationThreshold = args.nextU256();
      if (LiquidationThreshold.isErr()) {
        return new Result(0, "Can't deserialize the LiquidationThreshold");
      }
      this.LiquidationThreshold = LiquidationThreshold.unwrap();
  
      const LiquidationBonus = args.nextU256();
      if (LiquidationBonus.isErr()) {
        return new Result(0, "Can't deserialize the LiquidationBonus");
      }
      this.LiquidationBonus = LiquidationBonus.unwrap();
  
      const lastUpdateTimestamp = args.nextU256();
      if (lastUpdateTimestamp.isErr()) {
        return new Result(0, "Can't deserialize the lastUpdateTimestamp");
      }
      this.lastUpdateTimestamp = lastUpdateTimestamp.unwrap();
  
      const lastUpdateTimelastLiquidityCumulativeIndexstamp = args.nextU256();
      if (lastUpdateTimelastLiquidityCumulativeIndexstamp.isErr()) {
        return new Result(0, "Can't deserialize the lastUpdateTimelastLiquidityCumulativeIndexstamp");
      }
      this.lastUpdateTimelastLiquidityCumulativeIndexstamp = lastUpdateTimelastLiquidityCumulativeIndexstamp.unwrap();
  
      const lastLiquidityCumulativeIndex = args.nextU256();
      if (lastLiquidityCumulativeIndex.isErr()) {
        return new Result(0, "Can't deserialize the lastLiquidityCumulativeIndex");
      }
      this.lastLiquidityCumulativeIndex = lastLiquidityCumulativeIndex.unwrap();

      const currentLiquidityRate = args.nextU256();
      if (currentLiquidityRate.isErr()) {
        return new Result(0, "Can't deserialize the currentLiquidityRate");
      }
      this.currentLiquidityRate = currentLiquidityRate.unwrap();
  
      const totalBorrowsStable = args.nextU256();
      if (totalBorrowsStable.isErr()) {
        return new Result(0, "Can't deserialize the totalBorrowsStable");
      }
      this.totalBorrowsStable = totalBorrowsStable.unwrap();
  
      const totalBorrowsVariable = args.nextU256();
      if (totalBorrowsVariable.isErr()) {
        return new Result(0, "Can't deserialize the totalBorrowsVariable");
      }
      this.totalBorrowsVariable = totalBorrowsVariable.unwrap();

      const currentVariableBorrowRate = args.nextU256();
      if (currentVariableBorrowRate.isErr()) {
        return new Result(0, "Can't deserialize the currentVariableBorrowRate");
      }
      this.currentVariableBorrowRate = currentVariableBorrowRate.unwrap();
  
      const currentStableBorrowRate = args.nextU256();
      if (currentStableBorrowRate.isErr()) {
        return new Result(0, "Can't deserialize the currentStableBorrowRate");
      }
      this.currentStableBorrowRate = currentStableBorrowRate.unwrap();
      
      const currentAverageStableBorrowRate = args.nextU256();
      if (currentAverageStableBorrowRate.isErr()) {
        return new Result(0, "Can't deserialize the currentAverageStableBorrowRate");
      }
      this.currentAverageStableBorrowRate = currentAverageStableBorrowRate.unwrap();
  
      const lastVariableBorrowCumulativeIndex = args.nextU256();
      if (lastVariableBorrowCumulativeIndex.isErr()) {
        return new Result(0, "Can't deserialize the lastVariableBorrowCumulativeIndex");
      }
      this.lastVariableBorrowCumulativeIndex = lastVariableBorrowCumulativeIndex.unwrap();
      
  
      return new Result(args.offset);
    }
}