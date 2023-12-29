import { Serializable, Args, Result } from '@massalabs/as-types';

export default class Reserve implements Serializable {
  constructor(
    public addr: string = '',
    public name: string = '',
    public symbol: string = '',
    public decimals: u8 = 9,
    public mTokenAddress: string = '',
    public interestCalcAddress: string = '',
    public baseLTV: u8 = 0, // 75
    public LiquidationThreshold: u8 = 0, // 80
    public LiquidationBonus: u8 = 0, // 105
    public lastUpdateTimestamp: u64 = 0,
    public lastLiquidityCumulativeIndex: u64 = 1000000000,
    public currentLiquidityRate: u64 = 0,
    public totalBorrowsStable: u64 = 0,
    public totalBorrowsVariable: u64 = 0,
    public currentVariableBorrowRate: u64 = 0,
    public currentStableBorrowRate: u64 = 0,
    public currentAverageStableBorrowRate: u64 = 0,
    public lastVariableBorrowCumulativeIndex: u64 = 1000000000,
  ) {}

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
    this.addr = addr.expect('address argument is missing or invalid');

    const name = args.nextString();
    if (name.isErr()) {
      return new Result(0, "Can't deserialize the name");
    }
    this.name = name.expect('name argument is missing or invalid');

    const symbol = args.nextString();
    if (symbol.isErr()) {
      return new Result(0, "Can't deserialize the symbol");
    }
    this.symbol = symbol.expect('symbol argument is missing or invalid');

    const decimals = args.nextU8();
    if (decimals.isErr()) {
      return new Result(0, "Can't deserialize the decimals");
    }
    this.decimals = decimals.expect('decimals argument is missing or invalid');

    const mTokenAddress = args.nextString();
    if (mTokenAddress.isErr()) {
      return new Result(0, "Can't deserialize the mTokenAddress");
    }
    this.mTokenAddress = mTokenAddress.expect(
      'mTokenAddress argument is missing or invalid',
    );

    const interestCalcAddress = args.nextString();
    if (interestCalcAddress.isErr()) {
      return new Result(0, "Can't deserialize the interestCalcAddress");
    }
    this.interestCalcAddress = interestCalcAddress.expect(
      'interestCalcAddress argument is missing or invalid',
    );

    const baseLTV = args.nextU8();
    if (baseLTV.isErr()) {
      return new Result(0, "Can't deserialize the baseLTV");
    }
    this.baseLTV = baseLTV.expect('baseLTV argument is missing or invalid');

    const LiquidationThreshold = args.nextU8();
    if (LiquidationThreshold.isErr()) {
      return new Result(0, "Can't deserialize the LiquidationThreshold");
    }
    this.LiquidationThreshold = LiquidationThreshold.expect(
      'LiquidationThreshold argument is missing or invalid',
    );

    const LiquidationBonus = args.nextU8();
    if (LiquidationBonus.isErr()) {
      return new Result(0, "Can't deserialize the LiquidationBonus");
    }
    this.LiquidationBonus = LiquidationBonus.expect(
      'LiquidationBonus argument is missing or invalid',
    );

    const lastUpdateTimestamp = args.nextU64();
    if (lastUpdateTimestamp.isErr()) {
      return new Result(0, "Can't deserialize the lastUpdateTimestamp");
    }
    this.lastUpdateTimestamp = lastUpdateTimestamp.expect(
      'lastUpdateTimestamp argument is missing or invalid',
    );

    const lastLiquidityCumulativeIndex = args.nextU64();
    if (lastLiquidityCumulativeIndex.isErr()) {
      return new Result(
        0,
        "Can't deserialize the lastLiquidityCumulativeIndex",
      );
    }
    this.lastLiquidityCumulativeIndex = lastLiquidityCumulativeIndex.expect(
      'lastLiquidityCumulativeIndex argument is missing or invalid',
    );

    const currentLiquidityRate = args.nextU64();
    if (currentLiquidityRate.isErr()) {
      return new Result(0, "Can't deserialize the currentLiquidityRate");
    }
    this.currentLiquidityRate = currentLiquidityRate.expect(
      'currentLiquidityRate argument is missing or invalid',
    );

    const totalBorrowsStable = args.nextU64();
    if (totalBorrowsStable.isErr()) {
      return new Result(0, "Can't deserialize the totalBorrowsStable");
    }
    this.totalBorrowsStable = totalBorrowsStable.expect(
      'totalBorrowsStable argument is missing or invalid',
    );

    const totalBorrowsVariable = args.nextU64();
    if (totalBorrowsVariable.isErr()) {
      return new Result(0, "Can't deserialize the totalBorrowsVariable");
    }
    this.totalBorrowsVariable = totalBorrowsVariable.expect(
      'totalBorrowsVariable argument is missing or invalid',
    );

    const currentVariableBorrowRate = args.nextU64();
    if (currentVariableBorrowRate.isErr()) {
      return new Result(0, "Can't deserialize the currentVariableBorrowRate");
    }
    this.currentVariableBorrowRate = currentVariableBorrowRate.expect(
      'currentVariableBorrowRate argument is missing or invalid',
    );

    const currentStableBorrowRate = args.nextU64();
    if (currentStableBorrowRate.isErr()) {
      return new Result(0, "Can't deserialize the currentStableBorrowRate");
    }
    this.currentStableBorrowRate = currentStableBorrowRate.expect(
      'currentStableBorrowRate argument is missing or invalid',
    );

    const currentAverageStableBorrowRate = args.nextU64();
    if (currentAverageStableBorrowRate.isErr()) {
      return new Result(
        0,
        "Can't deserialize the currentAverageStableBorrowRate",
      );
    }
    this.currentAverageStableBorrowRate = currentAverageStableBorrowRate.expect(
      'currentAverageStableBorrowRate argument is missing or invalid',
    );

    const lastVariableBorrowCumulativeIndex = args.nextU64();
    if (lastVariableBorrowCumulativeIndex.isErr()) {
      return new Result(
        0,
        "Can't deserialize the lastVariableBorrowCumulativeIndex",
      );
    }
    this.lastVariableBorrowCumulativeIndex =
      lastVariableBorrowCumulativeIndex.expect(
        'lastVariableBorrowCumulativeIndex argument is missing or invalid',
      );

    return new Result(args.offset);
  }
}
