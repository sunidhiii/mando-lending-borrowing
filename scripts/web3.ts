// import MessageResponse from "./interfaces/MessageResponse";
import { ClientFactory, WalletClient, IDeserializedResult, ISerializable, DefaultProviderUrls, Args, ArrayType, strToBytes, bytesToStr, fromMAS, IProvider, ProviderType, bytesToU256, EOperationStatus, Client, bytesToArray, byteToBool, bytesToU64, bytesToU32 } from "@massalabs/massa-web3";
import pollAsyncEvents from './pollAsyncEvent';

// create a base account for signing transactions
// const baseAccount = {
//     address: "AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY",
//     secretKey: "S1EWN2vx8fBXAqfVT48wMHRK2yuH6fF7kK2Usgz9W4KrMFqhjRn",
//     publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
// };
const baseAccount = {
    address: "AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8",
    secretKey: "S1a1rC1Aar9gEe8VwpWtN5MTaxaKXqrj6vGr9a3WDxbRMDC8spM",
    publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
};

let FEE_ADDRESS = 'AS1ia2Edh5YihVdwQEx3yh8rwUEGyHeJLw43wW9iLeUbdXcJmYjM';        // 'AS1oehDh1LzsoxLDL4JicSXSimWADvGMJ9kxm8SDLVG7RqMCmup8';
// const token address = 'AS1LGwzLFK3Yj4cHQQerX8iLXDUnLACf9F5reASfFjitVfiVZG6g'; // AS12f7ENiyqABrC4yTeAsKVyneRyG1MJ1w7dy6xFo5tn3xmytBMNz
let PRICE_ORACLE = 'AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69';
let ADDRESS_PROVIDER = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';
let DATA_PROVIDER = 'AS1NjRH7veorj724LGP9UPXhRus93wgSWQ9aAhV8bKZBRkEYah1E'      // 'AS12nQVHGDUS7hCVAi125AdjUHcrHQA4Mo6XAMSbcLd28J6TJXqC8';
let INTEREST_ADDRESS = 'AS19jFaWTJbfUzYQ4Bi76AWQnDMhJYmA75ZzBFFHMjyV17aJhBbT';
let CORE_ADDRESS = 'AS1Z5w5aih25NyXRvWoE844qMFSZ5aqPx5woirkKACi9ge2gGJ65'        //'AS1NQ9vZdZakpH9Fq7nJaEHMe9VvkzQ4vRMzCwJ9YFVMSMYV7xnd';
let RESERVE_ADDRESS = 'AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva';   // Sepolia WETH
const mToken = 'AS1x5QZVeHdTrNjKscAbQZYV8j8esQYc7ZqSeV9Mv9vkGXFZNCF2'  // 'AS12ekfV6gxJVmQs5AaGYTTdsbEGckmXrUoegDvMGa5npyt6tvXac' //'AS1vF3vKxN81W6RKUvep6cfu8KpHrYibbEFfVdmxymLMr3TWDV5e'  // 'AS12aSoy5PrWUkbPmTUwTPTgL7RCaoGatwnr7veM5SbuJQhAJoc7G'           // 'AS12N6m2X4njM5AAbgKnahJtYAuHqyd96xRgexzn8P7oh1JBifCSg';
const POOL_ADDRESS = 'AS1jYV7oyrWYsk5E9ksPFYAzn5oqNmiD96kbrVtQoQpLa9Yu5ZsL'     // 'AS18f4zBvy5HHAqUGMfhaJpbiKhrM4KEyJRhorkyZpgZVHjtka7a';  

const publicApi = "https://buildnet.massa.net/api/v2:33035";

class UserReserve implements ISerializable<UserReserve> {
    constructor(
        public addr: string = '',
        public principalBorrowBalance: number = 0,
        public lastVariableBorrowCumulativeIndex: number = 0,
        public originationFee: number = 0,
        public stableBorrowRate: number = 0,
        public lastUpdateTimestamp: number = 0,
        public useAsCollateral: boolean = false,
        public autonomousRewardStrategyEnabled: boolean = false,
    ) { }

    serialize(): Uint8Array {
        const args = new Args();
        args.addString(this.addr);
        args.addU64(BigInt(this.principalBorrowBalance));
        args.addU64(BigInt(this.lastVariableBorrowCumulativeIndex));
        args.addU64(BigInt(this.originationFee));
        args.addU64(BigInt(this.stableBorrowRate));
        args.addU64(BigInt(this.lastUpdateTimestamp));
        args.addBool(this.useAsCollateral);
        args.addBool(this.autonomousRewardStrategyEnabled);
        return new Uint8Array(args.serialize());
    }

    deserialize(data: Uint8Array, offset: number): IDeserializedResult<UserReserve> {
        const args = new Args(data, offset);

        this.addr = args.nextString();
        this.principalBorrowBalance = parseInt(args.nextU64().toString());
        this.lastVariableBorrowCumulativeIndex = parseInt(args.nextU64().toString());
        this.originationFee = parseInt(args.nextU64().toString());
        this.stableBorrowRate = parseInt(args.nextU64().toString());
        this.lastUpdateTimestamp = parseInt(args.nextU64().toString());
        this.useAsCollateral = args.nextBool();
        this.autonomousRewardStrategyEnabled = args.nextBool();

        return { instance: this, offset: args.getOffset() };
    }
}
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
        public lastLiquidityCumulativeIndex: number = 1000000000,
        public currentLiquidityRate: number = 0,
        public totalBorrowsStable: number = 0,
        public totalBorrowsVariable: number = 0,
        public currentVariableBorrowRate: number = 0,
        public currentStableBorrowRate: number = 0,
        public currentAverageStableBorrowRate: number = 0,
        public lastVariableBorrowCumulativeIndex: number = 1000000000,

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
    const account = await WalletClient.getAccountFromSecretKey(
        baseAccount.secretKey
    );

    // const client = await ClientFactory.createCustomClient(
    //     [
    //       { url: publicApi, type: ProviderType.PUBLIC } as IProvider,
    //     ],
    //     false,
    //     account,
    // );

    const client = await ClientFactory.createDefaultClient(
        DefaultProviderUrls.BUILDNET,
        false,
        account
    );

    return client;
}

async function setPrice() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: PRICE_ORACLE,
                    functionName: "setPrice",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getPrice() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: PRICE_ORACLE,
                    targetFunction: "getPrice",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                }).then((res) => {
                    console.log("OpId: ", bytesToU64(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getOriginationFee() {
    const client = await createClient();
    try {
        const keyy = 'ORIGNATION_FEE';
        if (client) {
            let res = await client
                .publicApi()
                .getDatastoreEntries([
                    { address: FEE_ADDRESS, key: strToBytes(keyy) },
                ]);
            if (res[0].candidate_value) {
                console.log("Reserve data", bytesToStr(res[0].candidate_value));
                // return data;
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function setLendingPoolAddress() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: ADDRESS_PROVIDER,
                    functionName: "setLendingPool",
                    parameter: new Args()
                        .addString(POOL_ADDRESS)
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function setCoreAddress() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: ADDRESS_PROVIDER,
                    functionName: "setCore",
                    parameter: new Args()
                        .addString(CORE_ADDRESS)
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function setDataProviderAddress() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: ADDRESS_PROVIDER,
                    functionName: "setDataProvider",
                    parameter: new Args()
                        .addString(DATA_PROVIDER)
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function setFeeProviderAddress() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: ADDRESS_PROVIDER,
                    functionName: "setFeeProvider",
                    parameter: new Args()
                        .addString(FEE_ADDRESS)
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function addUserData() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: CORE_ADDRESS,
                    functionName: "initUser",
                    parameter: new Args().addSerializable<UserReserve>(new UserReserve(
                        'AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa',
                        0,
                        0,
                        0,
                        0,
                        0,
                        true))
                        .addString(RESERVE_ADDRESS).serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(10),
                    fee: BigInt(0),
                })
                .then((res) => {
                    console.log("OpId: ", res);
                    // const status = client.smartContracts().getOperationStatus(res).then((res) => console.log(EOperationStatus[res]));
                    const status = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("status", status);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getStatus(opId: string) {

    const client = await createClient();
    if (client) {
        const status = await client.smartContracts().getOperationStatus(opId);
        console.log(EOperationStatus[status]);
    }
}

async function viewAllReserves() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "viewAllReserves",
                    parameter: new Args().serialize(),
                }).then((res) => {
                    let reservesData = new Args(res.returnValue).nextArray(ArrayType.STRING);
                    console.log("All reserves", reservesData);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function viewUserData() {

    const client = await createClient();
    const keyy = 'USER_KEY_AU128AUqaffMz68FmEPw6upvS8M75sti9xYEzgGjHY9JcEpX6D4RL_AS12f7ENiyqABrC4yTeAsKVyneRyG1MJ1w7dy6xFo5tn3xmytBMNz';

    try {
        if (client) {
            let res = await client
                .publicApi()
                .getDatastoreEntries([
                    { address: CORE_ADDRESS, key: strToBytes(keyy) },
                ]);
            if (res[0].candidate_value) {
                const data = new UserReserve(res[0].candidate_value.toString()).deserialize(res[0].candidate_value, 0)
                console.log("Reserve data", data);
                // return data;
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function addReserveData() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: CORE_ADDRESS,
                    functionName: "initReserve",
                    parameter: new Args()
                        .addSerializable<Reserve>(new Reserve(
                            RESERVE_ADDRESS,
                            'usdc',
                            'USDC',
                            9,
                            '',
                            INTEREST_ADDRESS,
                            60,
                            75,
                            125,
                            0,
                            1000000000,
                            0,
                            0,
                            0,
                            0,
                            0,
                            0,
                            1000000000
                        ))
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(72),
                    fee: fromMAS(0),
                })
                .then((res) => {
                    console.log("OpId: ", res);
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    // const status = client.smartContracts().getOperationStatus(res)
                    //     .then((res) =>
                    //                         );

                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function viewReserveData() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getReserve",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                })
                .then((res) => {
                    // const data1 = res.returnValue;
                    const data = new Reserve(res.returnValue.toString()).deserialize(res.returnValue, 0)
                    console.log("OpId: ", data);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getUserReserve() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getUserReserve",
                    parameter: new Args()
                        .addString(baseAccount.address)
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                })
                .then((res) => {
                    // const data1 = res.returnValue;
                    const data = new UserReserve(res.returnValue.toString()).deserialize(res.returnValue, 0)
                    console.log("OpId: ", data);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

// async function viewReserveData1(reserve: string) {

//     const client = await createClient();
//     const keyy = 'RESERVE_KEY_AS1LGwzLFK3Yj4cHQQerX8iLXDUnLACf9F5reASfFjitVfiVZG6g';

//     try {
//         if (client) {
//             let res = await client
//                 .publicApi()
//                 .getDatastoreEntries([
//                     { address: CORE_ADDRESS, key: strToBytes(keyy) },
//                 ]);
//             if (res[0].candidate_value) {
//                 const data = new Reserve(res[0].candidate_value.toString()).deserialize(res[0].candidate_value, 326)
//                 console.log("Reserve data", data);
//                 // return data;
//             }
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }

async function checkAllowance() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: RESERVE_ADDRESS,
                    targetFunction: "allowance",
                    parameter: new Args()
                        .addString(baseAccount.address)
                        .addString(CORE_ADDRESS)
                        .serialize(),
                })
                .then((res) => {
                    console.log("OpId: ", bytesToU256(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function approve() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: RESERVE_ADDRESS,
                    functionName: "increaseAllowance",
                    parameter: new Args()
                        .addString(CORE_ADDRESS)
                        .addU256(1000000000000000n)
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    // const status = client.smartContracts().getOperationStatus(res)
                    //     .then((res) =>
                    //         console.log(EOperationStatus[res])
                    //     );
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                    // return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function approveMToken() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: mToken,
                    functionName: "increaseAllowance",
                    parameter: new Args()
                        .addString(mToken)
                        .addU256(1000000n)
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    // const status = client.smartContracts().getOperationStatus(res)
                    //     .then((res) =>
                    //         console.log(EOperationStatus[res])
                    //     );
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                    // return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function test() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: INTEREST_ADDRESS,
                    functionName: "calculateInterestRates",
                    parameter: new Args()
                        // .addString(RESERVE_ADDRESS)
                        // .addString(baseAccount.address)
                        // .addU256(21000000n)
                        .addU64(1000000000n).addU64(10000n).addU64(0n).addU64(1000000000n)
                        // .addU256(57n).addU256(1n).addU256(10n).addU256(10n).addU256(10n)
                        .serialize(),
                    maxGas: fromMAS(1),
                    coins: fromMAS(1),
                    fee: BigInt(0),
                }).then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    // let reservesData = bytesToArray(res.returnValue, ArrayType.U64);
                    // let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    // console.log("Contrat balance", reservesData);
                    console.log("op ID", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function testt() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateUserGlobalData",
                    parameter: new Args()
                        // .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        // .addU256(10000n)
                        // .addU64(22530503454n).addU64(16177956n).addU64(0n).addU64(75n)
                        // .addU256(16894997405n).addU256(1408727907n).addU256(2519950n).addU8(75)
                        // .addU256(1n).addU256(200n).addU256(1153772431n).addU256(2519950n).addU8(60)
                        .serialize(),
                }).then((res) => {
                    // let reservesData = bytesToArray(res.returnValue, ArrayType.U64);
                    let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    console.log("Contrat balance", reservesData);
                    // console.log("Contrat balance", byteToBool(res.returnValue));
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function calculateUserGlobalData() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateUserGlobalData",
                    parameter: new Args()
                        // .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .serialize(),
                }).then((res) => {
                    let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    console.log("User global data:", reservesData);
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function calculateUserData() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateUserData",
                    parameter: new Args()
                        // .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .serialize(),
                }).then((res) => {
                    let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    console.log("User data:", reservesData);
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function getHealthFactor() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateUserHealthFactorBelowThresh",
                    parameter: new Args()
                        // .addString(RESERVE_ADDRESS)
                        // .addString(baseAccount.address)
                        // .addU256(10000n)
                        .addU64(7504695155n).addU64(16504112839n).addU64(0n).addU8(75)
                        // .addU256(16894997405n).addU256(1408727907n).addU256(2519950n).addU8(75)
                        // .addU256(1n).addU256(200n).addU256(1153772431n).addU256(2519950n).addU8(60)
                        .serialize(),
                }).then((res) => {
                    // let reservesData = bytesToArray(res.returnValue, ArrayType.U64);
                    // let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    // console.log("Contrat balance", reservesData);
                    console.log("Health factor below threshold? ", byteToBool(res.returnValue));
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function getUserBasicReserveData() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getUserBasicReserveData",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .serialize(),
                }).then((res) => {
                    let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    console.log("User Basic Reserve Data: ", reservesData);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getReserveAvailableLiquiditySupply() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getReserveAvailableLiquidity",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                }).then((res) => {
                    console.log("Rserve available liquidity", bytesToU64(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getNormalizedIncome() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getNormalizedIncome",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .serialize(),
                }).then((res) => {
                    console.log("Normalized Income:", bytesToU64(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getUserBorrowBalances() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getUserBorrowBalances",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .serialize(),
                }).then((res) => {
                    let reservesData = new Args(res.returnValue).nextArray(ArrayType.U64);
                    console.log("User Borrow balances:", reservesData);
                });
        } // User Borrow balances: [ 2099008071911n, 13273547856707n, 11174539784796n ] 9317039828084
    } catch (error) {
        console.error(error);
    }
}

async function balanceDecreaseAllowed() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "balanceDecreaseAllowed",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .addU64(1000000000000n)
                        .serialize(),
                }).then((res) => {
                    console.log("Balance Decrease allowed? ", byteToBool(res.returnValue));
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function getUtilizationRate() {
    const client = await createClient();
    try {
        const reserve = await client
            .smartContracts()
            .readSmartContract({
                maxGas: fromMAS(0.1),
                targetAddress: CORE_ADDRESS,
                targetFunction: "getReserve",
                parameter: new Args()
                    .addString(RESERVE_ADDRESS)
                    .serialize(),
            })
        const reserveData = new Reserve(reserve.returnValue.toString()).deserialize(reserve.returnValue, 0)

        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getReserveAvailableLiquidity",
                    parameter: new Args().addString(RESERVE_ADDRESS).serialize(),
                })
                .then((res) => {
                    const totalBorrows =
                        reserveData.instance.totalBorrowsStable +
                        reserveData.instance.totalBorrowsVariable;
                    console.log(
                        `total borrow ${totalBorrows} ${bytesToU64(res.returnValue)}`
                    );
                    let utilization: number =
                        !totalBorrows || !bytesToU64(res.returnValue)
                            ? 0.0
                            : totalBorrows /
                            (Number(bytesToU64(res.returnValue)) + totalBorrows);
                    console.log(utilization);
                    console.log(
                        "Rserve available liquidity",
                        bytesToU64(res.returnValue),
                        utilization
                    );
                    // setUtilizationRate(utilization);
                    // setAvailableLiquidity(String(toMAS(bytesToU64(res.returnValue))));
                    // return bytesToU256(res.returnValue);
                    // console.log("Reserve data", utilization);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function calculateCollateralNeededInUSD() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateCollateralNeededInUSD",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addU64(1000000000n)
                        .addU64(0n).addU64(16504112839n).addU64(0n).addU8(60)
                        .serialize(),
                }).then((res) => {
                    let reservesData = bytesToU64(res.returnValue);
                    console.log("Collateral Need in USD", reservesData);
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function calculateUserCollateralNeededInUSD(amount: number) {
    const client = await createClient();
    try {
        if (client) {
            const user = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateUserGlobalData",
                    parameter: new Args()
                        .addString(baseAccount.address)
                        .serialize(),
                })

            let userData: Array<number> = new Args(user.returnValue).nextArray(ArrayType.U64);
            // console.log("User Data:", userData[1], userData[2], userData[3], userData[4]);

            const fee = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: FEE_ADDRESS,
                    targetFunction: "calculateLoanOriginationFee",
                    parameter: new Args()
                        .addU64(BigInt(fromMAS(amount)))
                        .serialize(),
                })
            let borrowFee = bytesToU64(fee.returnValue);

            const collateral = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.2),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateCollateralNeededInUSD",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addU64(BigInt(fromMAS(amount)))
                        .addU64(BigInt(borrowFee)).addU64(BigInt(userData[2])).addU64(BigInt(userData[3])).addU8(Number(userData[4]))
                        .serialize(),
                })
            const collateralNeeded = bytesToU64(collateral.returnValue);
            console.log("Collateral Needed In USD:", collateralNeeded);
            // return collateralNeeded;
        }
    } catch (error) {
        console.error(error);
    }
}

async function calculateCollateralNeeded() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateCollateralNeeded",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addU64(1000000000n)
                        .addU64(0n).addU64(16504112839n).addU64(0n).addU8(60)
                        .serialize(),
                }).then((res) => {
                    let reservesData = bytesToU64(res.returnValue);
                    console.log("Collateral Need in USD", reservesData);
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function calculateAvailableBorrowsUSD() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateAvailableBorrowsUSD",
                    parameter: new Args()
                        .addU64(2023101527600n).addU64(941580603586n).addU64(0n).addU64(60n)
                        .serialize(),
                }).then((res) => {
                    let reservesData = bytesToU64(res.returnValue);
                    console.log("Available borrows USD:", reservesData);
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function getUserAvailableBorrows() {
    const client = await createClient();
    try {
        if (client) {
            const user = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateUserData",
                    parameter: new Args()
                        .addString(baseAccount.address)
                        .serialize(),
                })

            let userData: Array<number> = new Args(user.returnValue).nextArray(ArrayType.U64);
            // console.log("User Data:", userData[1], userData[2], userData[3], userData[4]);

            const availableBorrows = await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.002),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateAvailableBorrows",
                    parameter: new Args()
                        .addU64(BigInt(userData[1])).addU64(BigInt(userData[2])).addU64(BigInt(userData[3])).addU64(BigInt(userData[4]))
                        .serialize(),
                })
            const userAvailableBorrows = bytesToU64(availableBorrows.returnValue);
            console.log("User Available Borrows:", userAvailableBorrows);
            // return userAvailableBorrows;
        }
    } catch (error) {
        console.error(error);
    }
}

async function calculateAvailableBorrows() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.1),
                    targetAddress: DATA_PROVIDER,
                    targetFunction: "calculateAvailableBorrows",
                    parameter: new Args()
                        .addU64(5046483899999n).addU64(931552346630n).addU64(0n).addU64(60n)
                        .serialize(),
                }).then((res) => {
                    let reservesData = bytesToU64(res.returnValue);
                    console.log("Available borrows:", reservesData);
                });
        } // 
    } catch (error) {
        console.error(error);
    }
}

async function deposit() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: POOL_ADDRESS,
                    functionName: "deposit",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .addU64(BigInt(fromMAS(11)))
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(10),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    // console.log("OpId: ", res);
                    return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getUserCurrentBorrowRateMode() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: 'getUserCurrentBorrowRateMode',
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .serialize(),
                })
                .then((res) => {
                    console.log("User CurrentBorrow Rate Mode", bytesToU32(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getUserCurrentBorrowRate() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: CORE_ADDRESS,
                    functionName: "deposit",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS)
                        .addString(baseAccount.address)
                        .addU64(BigInt(fromMAS(100)))
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(10),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    // console.log("OpId: ", res);
                    return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

// async function checkStatus() {
//     const depo = deposit();
//     const client = await createClient();
//     const status = await client
//         .smartContracts()
//         .awaitRequiredOperationStatus(depo, EOperationStatus.FINAL)
//     if (status !== EOperationStatus.FINAL)
//         throw new Error("Transaction failed")
// }

async function transferToReserve() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: CORE_ADDRESS,
                    functionName: "transferToReserve",
                    parameter: new Args()
                        .addString('AS12f7ENiyqABrC4yTeAsKVyneRyG1MJ1w7dy6xFo5tn3xmytBMNz')
                        .addString('AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY')
                        .addU256(BigInt(12))
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(0),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                    // return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function borrow(reserve: string, amount: number, type: number) {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: POOL_ADDRESS,
                    functionName: "borrow",
                    parameter: new Args()
                        .addString(reserve)
                        .addU64(BigInt(amount))
                        .addU8(type)
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(10),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                    // return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function repay(reserve: string) {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: POOL_ADDRESS,
                    functionName: "repay",
                    parameter: new Args()
                        .addString(reserve)
                        .addU64(500000000n)
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(10),
                    fee: fromMAS(0), // 388008570  5101457714250
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                    // return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function redeemUnderlying() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: mToken,
                    functionName: "redeem",
                    parameter: new Args()
                        .addU64(BigInt(fromMAS(1)))
                        .serialize(),
                    maxGas: 4_294_967_295n,
                    coins: fromMAS(1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                    // return res;
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getOwner() {

    const client = await createClient();
    const keyy = 'OWNER';
    try {
        if (client) {
            let res = await client
                .publicApi()
                .getDatastoreEntries([
                    { address: ADDRESS_PROVIDER, key: strToBytes(keyy) },
                ]);
            if (res[0].candidate_value) {
                console.log("Owner data", bytesToStr(res[0].candidate_value));
                // return data;
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function getName() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.001),
                    targetAddress: RESERVE_ADDRESS,
                    targetFunction: "name",
                    parameter: new Args().serialize(),
                }).then((res) => {
                    console.log("OpId: ", new Args(res.returnValue).nextString());
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getMTokenBalance(account: string) {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: mToken,
                    targetFunction: "balanceOf",
                    parameter: new Args().addString(account).serialize(),
                }).then((res) => {
                    console.log("MToken balance", bytesToU256(res.returnValue));
                    // return bytesToU256(res.returnValue);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getMTokenTotalSupply() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: mToken,
                    targetFunction: "totalSupply",
                    parameter: new Args().serialize(),
                }).then((res) => {
                    console.log("MToken Total Supply", bytesToU256(res.returnValue));
                    // return bytesToU256(res.returnValue); 5014925727293n 4602411245n
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getBalance(account: string) {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.001),
                    targetAddress: RESERVE_ADDRESS,
                    targetFunction: "balanceOf",
                    parameter: new Args().addString(account).serialize(),
                }).then((res) => {
                    console.log("User Balance", bytesToU256(res.returnValue));
                    // return bytesToU256(res.returnValue);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function calculateLoanOriginationFee() {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(1),
                    targetAddress: FEE_ADDRESS,
                    targetFunction: "calculateLoanOriginationFee",
                    parameter: new Args().addU64(1n).serialize(),
                }).then((res) => {
                    console.log("LoanOriginationFee", bytesToU256(res.returnValue));
                    // return bytesToU256(res.returnValue);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getMasBalance(account: string) {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.001),
                    targetAddress: RESERVE_ADDRESS,
                    targetFunction: "balanceOf",
                    parameter: new Args().addString(account).serialize(),
                }).then((res) => {
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function readContractData() {

    const client = await createClient();
    // const keyy = strToBytes("USER_KEY");
    // const keyy = `USER_KEY_${baseAccount.address}_${RESERVE_ADDRESS}`;
    const keyy = 'BALANCEAU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';
    // const keyy = `$'USER_KEY_'${baseAccount.address}_${RESERVE_ADDRESS}`;

    try {
        if (client) {
            let res = await client
                .publicApi()
                .getDatastoreEntries([
                    { address: mToken, key: strToBytes(keyy) },
                ]);
            if (res[0].candidate_value) {
                // let data = bytesToStr(res[0].candidate_value);
                // const data = new UserReserve(res[0].candidate_value.toString()).deserialize(res[0].candidate_value, 217)
                console.log("greetingDecoded", bytesToU256(res[0].candidate_value));
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function checkUserExists() {

    const client = await createClient();
    const keyy = `USER_KEY_${baseAccount.address}_${RESERVE_ADDRESS}`;

    try {
        if (client) {
            let res = await client
                .publicApi()
                .getDatastoreEntries([
                    { address: CORE_ADDRESS, key: strToBytes(keyy) },
                ]);
            if (res[0].candidate_value) {
                console.log("User exists?", byteToBool(res[0].candidate_value));
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function readContractDataPool() {

    const client = await createClient();
    // const keyy = strToBytes("USER_KEY");
    const keyy = "USER_KEY_AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8_AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva";

    try {
        let args = new Args();
        if (client) {
            let res = await client
                .publicApi()
                .getDatastoreEntries([
                    { address: CORE_ADDRESS, key: strToBytes(keyy) },
                ]);
            if (res[0].candidate_value) {
                // let data = bytesToStr(res[0].candidate_value);
                const data = new UserReserve(res[0].candidate_value.toString()).deserialize(res[0].candidate_value, 217)
                console.log("greetingDecoded", data);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function setCore() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: CORE_ADDRESS,
                    functionName: "setCore",
                    parameter: new Args()
                        .addString('AS1GmRjJciniFFCo4ikexRFTwRfobZVJ3tLuXbocWYnJTUAAmi66')
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function setUserAutonomousRewardStrategy() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: CORE_ADDRESS,
                    functionName: "setUserAutonomousRewardStrategy",
                    parameter: new Args()
                        .addString(RESERVE_ADDRESS).addString(baseAccount.address).addBool(true)
                        .serialize(),
                    coins: fromMAS(1),
                    fee: BigInt(0),
                })
                .then((res) => {
                    // const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getCoreAddress() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.001),
                    targetAddress: ADDRESS_PROVIDER,
                    targetFunction: "getCore",
                    parameter: new Args().serialize(),
                })
                .then((res) => {
                    console.log("OpId: ", bytesToStr(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getVariableRateSlope1() {

    const client = await createClient();

    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.001),
                    targetAddress: INTEREST_ADDRESS,
                    targetFunction: "getVariableRateSlope1",
                    parameter: new Args().serialize(),
                })
                .then((res) => {
                    console.log("OpId: ", bytesToStr(res.returnValue));
                });
        }
    } catch (error) {
        console.error(error);
    }
}

const main = async () => {
    console.log("Initializing a new Reserve in the pool..........................")
    await addReserveData();

    console.log("Reserve has been succefully added!")
    await viewReserveData();

    console.log("Depositing in the pool..........................................")

    console.log("Approving Token.....");
    await approve();

    console.log("Depositing 12 tokens in the Pool.....");
    await deposit();

    console.log("View User Data ....!")
    await viewUserData();

    console.log("user wallet")
    await getBalance(baseAccount.address);

    console.log("mToken minted on user wallet")
    await getMTokenBalance(baseAccount.address);

    console.log("Reserve Balance increased after deposit")
    await getReserveAvailableLiquiditySupply()

    console.log("Borrowing from the pool...........................................")

    console.log("Approving mToken for burning.....");
    await approveMToken();

    console.log("Borrowing 10 tokens from the pool.....");
    await borrow(RESERVE_ADDRESS, 10, 1);

    console.log("User Data after borrow .........");
    await viewUserData();

    console.log("User Token Balance after borrow......")
    await getBalance(baseAccount.address);

    console.log("mToken burned from user wallet.....")
    await getMTokenBalance(baseAccount.address);

    console.log("Reserve Balance decreased after borrow")
    await getReserveAvailableLiquiditySupply()

}

async function test1() {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    maxGas: 4_294_967_295n,
                    targetAddress: 'AS1NBfCjMLg53kDzTHrxX2gyopGcCNBH6WT8WLkqb4yeVWwKeNXo',
                    functionName: "testing4",
                    parameter: new Args().serialize(),
                    coins: fromMAS(0.01),
                    fee: BigInt(0),
                })
                .then((res) => {
                    const events = pollAsyncEvents(client, res).then((result) => console.log(result.events[0].data));
                    console.log("OpId: ", res);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

// main();

// setCore();
// getCoreAddress();
// createClient();
// readContractData();
// readContractDataPool();
// addReserveData();
// viewReserveData();
// getName();
// addUserData();
// viewAllReserves();
// userExists();
// checkAllowance();
// approveMToken()
// approve();
// deposit();
// test();
// testt();
// calculateUserGlobalData();
// calculateUserData();
// getHealthFactor()
// balanceDecreaseAllowed();
// calculateCollateralNeededInUSD()
// calculateCollateralNeeded()
// calculateAvailableBorrowsUSD();
// calculateAvailableBorrows();
// getUserBorrowBalances();
// getReserveAvailableLiquiditySupply();
// getNormalizedIncome();
// getUserBasicReserveData();
// transferToReserve() 187018757n 104450016n
// borrow(RESERVE_ADDRESS, 532215472767, 2); // 530565261273n
// repay(RESERVE_ADDRESS);
// getBalance(baseAccount.address);
// getBalance(CORE_ADDRESS);

// setPrice();
// getPrice();
// getOriginationFee();
// calculateLoanOriginationFee();
// getOwner()
// setCoreAddress()
// setLendingPoolAddress();
// setFeeProviderAddress();
// setDataProviderAddress(); 

// getVariableRateSlope1()

// getUserReserve();
redeemUnderlying();
// getMTokenBalance(baseAccount.address);
// getMTokenTotalSupply();
// checkUserExists();
// getUserAvailableBorrows();
// getUtilizationRate();
// calculateUserCollateralNeededInUSD(1000000);
// setUserAutonomousRewardStrategy();

// getStatus('O12rSTeWTHVi29stABThqgW9rN3UnGQ5bZYMEcYtxRFRywoSnMBN');

// test1();

//  principalBorrowBalance: 1030752000n,