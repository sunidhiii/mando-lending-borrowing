import {
  ClientFactory,
  WalletClient,
  IDeserializedResult,
  ISerializable,
  DefaultProviderUrls,
  Args,
  fromMAS,
} from '@massalabs/massa-web3';

// create a base account for signing transactions

let CORE_ADDRESS = 'AS12mPMppiXh1RNWLLxpgexDZPhjGTukaeovjvrMzUPsexFXnbM2y';
let RESERVE_ADDRESS = 'AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva';

class Reserve implements ISerializable<Reserve> {
  constructor(
    public addr: string = '',
    public name: string = '',
    public symbol: string = '',
    public decimals: number = 9,
    public mTokenAddress: string = '',
    public interestCalcAddress: string = '',
    public baseLTV: number = 0, // 75
    public LiquidationThreshold: number = 0, // 80
    public LiquidationBonus: number = 0, // 105
    public lastUpdateTimestamp: number = 0,
    public lastLiquidityCumulativeIndex: number = 1000000000,
    public currentLiquidityRate: number = 0,
    public totalBorrowsStable: number = 0,
    public totalBorrowsVariable: number = 0,
    public currentVariableBorrowRate: number = 0,
    public currentStableBorrowRate: number = 0,
    public currentAverageStableBorrowRate: number = 0,
    public lastVariableBorrowCumulativeIndex: number = 1000000000,
  ) {}

  serialize(): Uint8Array {
    const args = new Args();
    args.addString(this.addr);
    args.addString(this.name);
    args.addString(this.symbol);
    args.addU8(this.decimals);
    args.addString(this.mTokenAddress);
    args.addString(this.interestCalcAddress);
    args.addU8(this.baseLTV);
    args.addU8(this.LiquidationThreshold);
    args.addU8(this.LiquidationBonus);
    args.addU64(BigInt(this.lastUpdateTimestamp));
    args.addU64(BigInt(this.lastLiquidityCumulativeIndex));
    args.addU64(BigInt(this.currentLiquidityRate));
    args.addU64(BigInt(this.totalBorrowsStable));
    args.addU64(BigInt(this.totalBorrowsVariable));
    args.addU64(BigInt(this.currentVariableBorrowRate));
    args.addU64(BigInt(this.currentStableBorrowRate));
    args.addU64(BigInt(this.currentAverageStableBorrowRate));
    args.addU64(BigInt(this.lastVariableBorrowCumulativeIndex));

    return new Uint8Array(args.serialize());
  }

  deserialize(data: Uint8Array, offset: number): IDeserializedResult<Reserve> {
    const args = new Args(data, offset);
    this.addr = args.nextString();
    this.name = args.nextString();
    this.symbol = args.nextString();
    this.decimals = parseInt(args.nextU8().toString());
    this.mTokenAddress = args.nextString();
    this.interestCalcAddress = args.nextString();
    this.baseLTV = parseInt(args.nextU8().toString());
    this.LiquidationThreshold = parseInt(args.nextU8().toString());
    this.LiquidationBonus = parseInt(args.nextU8().toString());
    this.lastUpdateTimestamp = parseInt(args.nextU64().toString());
    this.lastLiquidityCumulativeIndex = parseInt(args.nextU64().toString());
    this.currentLiquidityRate = parseInt(args.nextU64().toString());
    this.totalBorrowsStable = parseInt(args.nextU64().toString());
    this.totalBorrowsVariable = parseInt(args.nextU64().toString());
    this.currentVariableBorrowRate = parseInt(args.nextU64().toString());
    this.currentStableBorrowRate = parseInt(args.nextU64().toString());
    this.currentAverageStableBorrowRate = parseInt(args.nextU64().toString());
    this.lastVariableBorrowCumulativeIndex = parseInt(args.nextU64().toString());

    return { instance: this, offset: args.getOffset() };
  }
}

async function createClient() {
  const account = await WalletClient.getAccountFromSecretKey('baseAccount.secretKey');

  const client = await ClientFactory.createDefaultClient(DefaultProviderUrls.BUILDNET, false, account);
  return client;
}

async function getCurrentAPY() {
  const client = await createClient();
  try {
    if (client) {
      const reserveArgs = await client.smartContracts().readSmartContract({
        maxGas: fromMAS(0.0006),
        targetAddress: CORE_ADDRESS,
        targetFunction: 'getReserve',
        parameter: new Args().addString(RESERVE_ADDRESS).serialize(),
      });
      const reserveData = new Reserve(reserveArgs.returnValue.toString()).deserialize(reserveArgs.returnValue, 0);

      const currentLiquidityRate = reserveData.instance.currentLiquidityRate;
      const currentVariableBorrowRate = reserveData.instance.currentVariableBorrowRate;

      console.log('Current Liquidity rate(APY)', currentLiquidityRate);
      console.log('Current Variable Borrow rate', currentVariableBorrowRate);
      return [currentLiquidityRate, currentVariableBorrowRate];
    }
  } catch (error) {
    console.error(error);
  }
}

getCurrentAPY();
