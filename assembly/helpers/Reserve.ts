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
  
      return new Result(args.offset);
    }
}