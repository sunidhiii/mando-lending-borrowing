// import MessageResponse from "./interfaces/MessageResponse";
import {
    ClientFactory, WalletClient, IDeserializedResult, ISerializable, DefaultProviderUrls, Args, ArrayType, strToBytes, bytesToStr, fromMAS, IProvider, ProviderType, bytesToU256, EOperationStatus, Client, bytesToArray, byteToBool
} from "@massalabs/massa-web3";
import pollAsyncEvents from './pollAsyncEvent';
import { base58Decode } from "@massalabs/massa-web3/dist/esm/utils/Xbqcrypto";
import { readFileSync } from 'fs';
import path from 'path';

// create a base account for signing transactions
const baseAccount = {
    address: "AU128AUqaffMz68FmEPw6upvS8M75sti9xYEzgGjHY9JcEpX6D4RL",
    secretKey: "S1DzdH332QrnjSaLgnK1iwDHqtf4k58tg6HAnoM5t2j1UhVrVnQ",
    publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
};

// let CONTRACT_ADDRESS = 'AS12SHcxwF4U4Wk4YvxPQGEETWe5kdL5X87xNKvburLiihv12aSdq';
let TOKEN_ADDRESS = 'AS1VaBK2mFkaPvjAp2uR4TgrdxUHC4N19PvJMsosKeSZWwmHVvL9';
// let RESERVE_ADDRESS = 'AS1LGwzLFK3Yj4cHQQerX8iLXDUnLACf9F5reASfFjitVfiVZG6g';
let RESERVE_ADDRESS = 'AS12f7ENiyqABrC4yTeAsKVyneRyG1MJ1w7dy6xFo5tn3xmytBMNz';   // Sepolia WETH
let CORE_ADDRESS = 'AS1Jucbg6GFKnyrmyzhMWaooZwKcG4743nGGAkvHEQVoDPQbwBeF';
// const mToken = 'AS12tbjdcKMyXgwUdUSiQBW1Zh9oD3hiCwzDZiAH7cfZgH9E5w9gJ';
const mToken = 'AS12FarV3yUcRj6LSxLK1Vm7mwdxBJCKvVK2AoFjZNPtuRFcPcCcd';
const POOL_ADDRESS = 'AS1UdPdsJ1hc46Wajdd3HsAhXpkLbw7iF6roHVq2cTF59bY37bHH';

const publicApi = "https://buildnet.massa.net/api/v2:33035";

class UserReserve implements ISerializable<UserReserve> {
    constructor(
        public addr: string = '',
        public principalBorrowBalance: bigint = 0n,
        public lastVariableBorrowCumulativeIndex: bigint = 0n,
        public originationFee: bigint = 0n,
        public stableBorrowRate: bigint = 0n,
        public lastUpdateTimestamp: bigint = 0n,
        public useAsCollateral: boolean = false,
    ) { }

    serialize(): Uint8Array {
        const args = new Args();
        args.addString(this.addr);
        args.addU256(BigInt(this.principalBorrowBalance));
        args.addU256(BigInt(this.lastVariableBorrowCumulativeIndex));
        args.addU256(BigInt(this.originationFee));
        args.addU256(BigInt(this.stableBorrowRate));
        args.addU256(BigInt(this.lastUpdateTimestamp));
        args.addBool(this.useAsCollateral);
        return new Uint8Array(args.serialize());
    }

    deserialize(data: Uint8Array, offset: number): IDeserializedResult<UserReserve> {
        const args = new Args(data, offset);

        this.addr = args.nextString();
        this.principalBorrowBalance = BigInt(args.nextU256().toString());
        this.lastVariableBorrowCumulativeIndex = BigInt(args.nextU256().toString());
        this.originationFee = BigInt(args.nextU256().toString());
        this.stableBorrowRate = BigInt(args.nextU256().toString());
        this.lastUpdateTimestamp = BigInt(args.nextU256().toString());
        this.useAsCollateral = args.nextBool();

        return { instance: this, offset: args.getOffset() };
    }
}
class Reserve implements ISerializable<Reserve> {
    constructor(
        public addr: string = "",
        public name: string = "",
        public symbol: string = "",
        public decimals: number = 0,
        public mTokenAddress: string = "",
        public interestCalcAddress: string = "",
        public baseLTV: bigint = 0n,
        public LiquidationThreshold: bigint = 0n,
        public LiquidationBonus: bigint = 0n
    ) { }

    serialize(): Uint8Array {
        const args = new Args();
        args.addString(this.addr);
        args.addString(this.name);
        args.addString(this.symbol);
        args.addU8(this.decimals);
        args.addString(this.mTokenAddress);
        args.addString(this.interestCalcAddress);
        args.addU256(BigInt(this.baseLTV));
        args.addU256(BigInt(this.LiquidationThreshold));
        args.addU256(BigInt(this.LiquidationBonus));
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
        this.baseLTV = BigInt(args.nextU256().toString());
        this.LiquidationThreshold = BigInt(args.nextU256().toString());
        this.LiquidationBonus = BigInt(args.nextU256().toString());

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
                        BigInt(0),
                        BigInt(0),
                        BigInt(0),
                        BigInt(0),
                        BigInt(0),
                        true))
                        .addString(RESERVE_ADDRESS).serialize(),
                    maxGas: 4_200_000_000n,
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

// async function viewUserData1() {

//     const client = await createClient();
//     try {
//         if (client) {
//             await client
//                 .smartContracts()
//                 .readSmartContract({
//                     maxGas: fromMAS(0.01),
//                     targetAddress: CORE_ADDRESS,
//                     targetFunction: "getUser",
//                     parameter: new Args()
//                         .addString('AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8')
//                         .addString(RESERVE_ADDRESS)
//                         .serialize()
//                 })
//                 .then((res) => {
//                     // const data = new Args(res.returnValue)
//                     const data = new UserReserve(res.returnValue.toString()).deserialize(res.returnValue, 0)
//                     console.log("OpId: ", data);
//                 });
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }

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
                            'MyToken',
                            'MySymbol',
                            9,
                            '',
                            'AS13Vg3V5xaomzXfJK87gnkhZAor7yj2HAJgY36WbCnQXfMVdQ1h',
                            BigInt(10),
                            BigInt(20),
                            BigInt(70)
                        ))
                        .serialize(),
                    maxGas: 4_200_000_000n,
                    coins: fromMAS(50),
                    fee: BigInt(0),
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
                    targetAddress: mToken,
                    targetFunction: "allowance",
                    parameter: new Args()
                        .addString('AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8')
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
                        .addU256(1000000n)
                        .serialize(),
                    maxGas: 4_200_000_000n,
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
                        .addString(CORE_ADDRESS)
                        .addU256(1000000n)
                        .serialize(),
                    maxGas: 4_200_000_000n,
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

async function deposit(reserve: string, amount: number) {

    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: POOL_ADDRESS,
                    functionName: "deposit",
                    parameter: new Args()
                        .addString(reserve)
                        .addU256(BigInt(amount))
                        .serialize(),
                    maxGas: 4_200_000_000n,
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

async function borrow(reserve: string, amount: number) {

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
                        .addU256(BigInt(amount))
                        .serialize(),
                    maxGas: 4_200_000_000n,
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
                    maxGas: fromMAS(0.001),
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

async function getReserveAvailableLiquiditySupply(reserve: string) {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getReserveAvailableLiquidity",
                    parameter: new Args().addString(reserve).serialize(),
                }).then((res) => {
                    console.log("Rserve available liquidity", bytesToU256(res.returnValue));
                    // return bytesToU256(res.returnValue);
                });
        }
    } catch (error) {
        console.error(error);
    }
}

async function getUserBasicReserveData(account: string) {
    const client = await createClient();
    try {
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: fromMAS(0.01),
                    targetAddress: CORE_ADDRESS,
                    targetFunction: "getUserBasicReserveData",
                    parameter: new Args().addString(RESERVE_ADDRESS).addString(account).serialize(),
                }).then((res) => {
                    console.log("OpId: ", bytesToU256(res.returnValue));
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
    const keyy = "ALL_RESERVES";

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
                // const data = new UserReserve(res[0].candidate_value.toString()).deserialize(res[0].candidate_value, 217)
                console.log("greetingDecoded", bytesToArray((res[0].candidate_value), 0));
            }
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
                    maxGas: 4_200_000_000n,
                    targetAddress: CORE_ADDRESS,
                    functionName: "setCore",
                    parameter: new Args()
                        .addString('AS1GmRjJciniFFCo4ikexRFTwRfobZVJ3tLuXbocWYnJTUAAmi66')
                        .serialize(),
                    coins: fromMAS(0.1),
                    fee: BigInt(0),
                })
                .then((res) => {
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
                    targetAddress: CORE_ADDRESS,
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

const main = async () => {
    console.log("Initializing a new Reserve in the pool..........................")
    await addReserveData();

    console.log("Reserve has been succefully added!")
    await viewReserveData();

    console.log("Depositing in the pool..........................................")

    console.log("Approving Token.....");
    await approve();

    console.log("Depositing 12 tokens in the Pool.....");
    await deposit(RESERVE_ADDRESS, 12);

    console.log("View User Data ....!")
    await viewUserData();

    console.log("user wallet")
    await getBalance(baseAccount.address);

    console.log("mToken minted on user wallet")
    await getMTokenBalance(baseAccount.address);

    console.log("Reserve Balance increased after deposit")
    await getReserveAvailableLiquiditySupply(RESERVE_ADDRESS)

    console.log("Borrowing from the pool...........................................")

    console.log("Approving mToken for burning.....");
    await approveMToken();

    console.log("Borrowing 10 tokens from the pool.....");
    await borrow(RESERVE_ADDRESS, 10);

    console.log("User Data after borrow .........");
    await viewUserData();

    console.log("User Token Balance after borrow......")
    await getBalance(baseAccount.address);

    console.log("mToken burned from user wallet.....")
    await getMTokenBalance(baseAccount.address);

    console.log("Reserve Balance decreased after borrow")
    await getReserveAvailableLiquiditySupply(RESERVE_ADDRESS)

}

// main();

// setCoreAddress();
// getCoreAddress();
// createClient();
// readContractData();
// addReserveData();
// viewReserveData()
// getName();
// addUserData();
// viewUserData1();
// userExists();
// checkAllowance();
// approveMToken()
// approve();
// deposit('AS12f7ENiyqABrC4yTeAsKVyneRyG1MJ1w7dy6xFo5tn3xmytBMNz', 12);
// borrow(RESERVE_ADDRESS, 10);
// getReserveAvailableLiquiditySupply();
// getUserBasicReserveData('AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa');
// getBalance('AU128AUqaffMz68FmEPw6upvS8M75sti9xYEzgGjHY9JcEpX6D4RL');

// getStatus('O12br6G8gGxjDFHvEQHEgX1bRmu7Vf2St3PwcFypK1MtJkVtuGZm');
