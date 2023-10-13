// import MessageResponse from "./interfaces/MessageResponse";
import { ClientFactory, WalletClient, IDeserializedResult, ISerializable, DefaultProviderUrls, Args, ArrayType, strToBytes, bytesToStr, fromMAS, IProvider, ProviderType, bytesToU256, EOperationStatus, Client, bytesToArray, byteToBool, bytesToU64 } from "@massalabs/massa-web3";

// create a base account for signing transactions
const baseAccount = {
    address: "AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8",
    secretKey: "S1a1rC1Aar9gEe8VwpWtN5MTaxaKXqrj6vGr9a3WDxbRMDC8spM",
    publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
};

let INTEREST_ADDRESS = 'AS17MpgjV2F2ZaY9KZQ2uCDXC8cmeZtD6nm4M3r76LSmXMDggjr7';
let CORE_ADDRESS = 'AS1yjSWbpK8nDL5Hmagj5kXoaQvMhXGv8PdDWTvPD6sCqtHdKJB4'
let RESERVE_ADDRESS = 'AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva';

class Reserve implements ISerializable<Reserve> {
    constructor(
        public addr: string = "",
        public name: string = "",
        public symbol: string = "",
        public decimals: number = 9,
        public mTokenAddress: string = "",
        public interestCalcAddress: string = "",
        public baseLTV: number = 0,                                              // 75
        public LiquidationThreshold: number = 0,                                 // 80
        public LiquidationBonus: number = 0,                                     // 105
        public lastUpdateTimestamp: number = 0,
        public lastLiquidityCumulativeIndex: bigint = 1000000000n,
        public currentLiquidityRate: bigint = 0n,
        public totalBorrowsStable: bigint = 0n,
        public totalBorrowsVariable: bigint = 0n,
        public currentVariableBorrowRate: bigint = 0n,
        public currentStableBorrowRate: bigint = 0n,
        public currentAverageStableBorrowRate: bigint = 0n,
        public lastVariableBorrowCumulativeIndex: bigint = 1000000000n,

    ) { }

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
        args.addU256(BigInt(this.lastLiquidityCumulativeIndex));
        args.addU256(BigInt(this.currentLiquidityRate));
        args.addU256(BigInt(this.totalBorrowsStable));
        args.addU256(BigInt(this.totalBorrowsVariable));
        args.addU256(BigInt(this.currentVariableBorrowRate));
        args.addU256(BigInt(this.currentStableBorrowRate));
        args.addU256(BigInt(this.currentAverageStableBorrowRate));
        args.addU256(BigInt(this.lastVariableBorrowCumulativeIndex));
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
        this.lastLiquidityCumulativeIndex = BigInt(args.nextU256().toString());
        this.currentLiquidityRate = BigInt(args.nextU256().toString());
        this.totalBorrowsStable = BigInt(args.nextU256().toString());
        this.totalBorrowsVariable = BigInt(args.nextU256().toString());
        this.currentVariableBorrowRate = BigInt(args.nextU256().toString());
        this.currentStableBorrowRate = BigInt(args.nextU256().toString());
        this.currentAverageStableBorrowRate = BigInt(args.nextU256().toString());
        this.lastVariableBorrowCumulativeIndex = BigInt(args.nextU256().toString());

        return { instance: this, offset: args.getOffset() };
    }
}

async function createClient() {
    const account = await WalletClient.getAccountFromSecretKey(
        baseAccount.secretKey
    );

    const client = await ClientFactory.createDefaultClient(
        DefaultProviderUrls.BUILDNET,
        false,
        account
    );

    return client;
}

async function getCurrentAPY() {
    const client = await createClient();
    try {
        if (client) {
            const reserveLiquidity = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getReserveAvailableLiquidity",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                })
            const reserveTotalLiquidity = bytesToU256(reserveLiquidity.returnValue);
            const reserveCurrentTotalLiquidity = parseInt(reserveTotalLiquidity.toString())
            console.log("Reserve total liquidity:", reserveCurrentTotalLiquidity)

            const reserveArgs = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getReserve",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                })
            const reserveData = new Reserve(reserveArgs.returnValue.toString()).deserialize(reserveArgs.returnValue, 0)

            const reserveTotalBorrowsStable = parseInt(reserveData.instance.totalBorrowsStable.toString())
            const reserveTotalBorrowsVariable = parseInt(reserveData.instance.totalBorrowsVariable.toString())
            const reserveCurrentAverageStableBorrowRate = parseInt(reserveData.instance.currentAverageStableBorrowRate.toString())
            console.log("Reserve data:", reserveTotalBorrowsStable, reserveTotalBorrowsVariable, reserveCurrentAverageStableBorrowRate)

            const reserveInterest = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: INTEREST_ADDRESS,
                    targetFunction: "calculateInterestRates",
                    parameter: new Args()
                        .addU64(BigInt(reserveCurrentTotalLiquidity)).addU64(BigInt(reserveTotalBorrowsStable)).addU64(BigInt(reserveTotalBorrowsVariable)).addU64(BigInt(reserveCurrentAverageStableBorrowRate))
                        .serialize(),
                })
            const reserveInterestRates = new Args(reserveInterest.returnValue).nextArray(ArrayType.U64);
            const currentLiquidityRate = reserveInterestRates[0];
            console.log("Current Liquidity rate(APY)", currentLiquidityRate);
            return currentLiquidityRate;
        }
    } catch (error) {
        console.error(error);
    }
}

getCurrentAPY()

