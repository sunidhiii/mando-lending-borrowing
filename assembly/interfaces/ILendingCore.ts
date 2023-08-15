import { Args, Result, Serializable, stringToBytes } from "@massalabs/as-types";
import { Address, Context, call } from "@massalabs/massa-as-sdk";

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

    initReserve(binaryArgs: StaticArray<u8>): void {
        const arg = new Args(binaryArgs);
        call(this._origin, "initReserve", arg, 0);
    }

    getReserve(binaryArgs: StaticArray<u8>): Reserve {
        const result = call(this._origin, "getReserve", new Args(), 0);
        const reserveData = new Args(result).nextSerializable<Reserve>().unwrap();
        return reserveData;
    }

    deleteReserve(binaryArgs: StaticArray<u8>): void {
        const arg = new Args(binaryArgs);
        call(this._origin, "deleteReserve", arg, 0);
    }

}