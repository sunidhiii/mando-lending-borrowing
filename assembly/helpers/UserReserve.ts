import { Serializable, Args, Result } from '@massalabs/as-types';

export default class UserReserve implements Serializable {
  constructor(
    public addr: string = '',
    public principalBorrowBalance: u64 = 0,
    public lastVariableBorrowCumulativeIndex: u64 = 0,
    public originationFee: u64 = 0,
    public stableBorrowRate: u64 = 0,
    public lastUpdateTimestamp: u64 = 0,
    public useAsCollateral: bool = false,
    public autonomousRewardStrategyEnabled: bool = false,
  ) {}

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.addr);
    args.add(this.principalBorrowBalance);
    args.add(this.lastVariableBorrowCumulativeIndex);
    args.add(this.originationFee);
    args.add(this.stableBorrowRate);
    args.add(this.lastUpdateTimestamp);
    args.add(this.useAsCollateral);
    args.add(this.autonomousRewardStrategyEnabled);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);

    const addr = args.nextString();
    if (addr.isErr()) {
      return new Result(0, "Can't deserialize the addr");
    }
    this.addr = addr.expect('address argument is missing or invalid');

    const principalBorrowBalance = args.nextU64();
    if (principalBorrowBalance.isErr()) {
      return new Result(0, "Can't deserialize the principalBorrowBalance");
    }
    this.principalBorrowBalance = principalBorrowBalance.expect(
      'principalBorrowBalance argument is missing or invalid',
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

    const originationFee = args.nextU64();
    if (originationFee.isErr()) {
      return new Result(0, "Can't deserialize the originationFee");
    }
    this.originationFee = originationFee.expect(
      'originationFee argument is missing or invalid',
    );

    const stableBorrowRate = args.nextU64();
    if (stableBorrowRate.isErr()) {
      return new Result(0, "Can't deserialize the stableBorrowRate");
    }
    this.stableBorrowRate = stableBorrowRate.expect(
      'stableBorrowRate argument is missing or invalid',
    );

    const lastUpdateTimestamp = args.nextU64();
    if (lastUpdateTimestamp.isErr()) {
      return new Result(0, "Can't deserialize the lastUpdateTimestamp");
    }
    this.lastUpdateTimestamp = lastUpdateTimestamp.expect(
      'lastUpdateTimestamp argument is missing or invalid',
    );

    const useAsCollateral = args.nextBool();
    if (useAsCollateral.isErr()) {
      return new Result(0, "Can't deserialize the useAsCollateral");
    }
    this.useAsCollateral = useAsCollateral.expect(
      'useAsCollateral argument is missing or invalid',
    );

    const autonomousRewardStrategyEnabled = args.nextBool();
    if (autonomousRewardStrategyEnabled.isErr()) {
      return new Result(
        0,
        "Can't deserialize the autonomousRewardStrategyEnabled",
      );
    }
    this.autonomousRewardStrategyEnabled =
      autonomousRewardStrategyEnabled.expect(
        'autonomousRewardStrategyEnabled argument is missing or invalid',
      );

    return new Result(args.offset);
  }
}
