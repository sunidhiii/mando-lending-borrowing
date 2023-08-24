// import MessageResponse from "./interfaces/MessageResponse";
import {
    ClientFactory,
    WalletClient,
    DefaultProviderUrls, Args, ArrayType, strToBytes, bytesToStr, fromMAS, IProvider, ProviderType
} from "@massalabs/massa-web3";
import { readFileSync } from 'fs';
import path from 'path';

// create a base account for signing transactions
const baseAccount = {
    address: "AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa",
    secretKey: "S124xpCaad7hPhvezhHp2sSxb56Dpi2oufcp2m2NtkdPjgxFXNon",
    publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
};

// let CONTRACT_ADDRESS = 'AS1GmRjJciniFFCo4ikexRFTwRfobZVJ3tLuXbocWYnJTUAAmi66';
let CONTRACT_ADDRESS = 'AS12SHcxwF4U4Wk4YvxPQGEETWe5kdL5X87xNKvburLiihv12aSdq';
let TOKEN_ADDRESS = '';

const publicApi = "https://buildnet.massa.net/api/v2:33035";

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

async function addReserveData() {

    const client = await createClient();

    try {
        // let mToken_code = memory.buffer;
        let args = new Args();
        args.addString('AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa');
        args.addString('MyTestToken');
        args.addU64(BigInt(0));
        args.addString('AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa');
        args.addString('AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa');
        args.addU64(BigInt(0));
        args.addU64(BigInt(0));
        args.addU64(BigInt(0));
        args.addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayType.U8);
        if (client) {
            await client
                .smartContracts()
                .callSmartContract({
                    targetAddress: CONTRACT_ADDRESS,
                    functionName: "addReserve",
                    parameter: args.serialize(),
                    maxGas: BigInt(1000000),
                    coins: BigInt(0.001),
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

// async function viewReserveData() {

//     const client = await createClient();

//     try {
//         let args = new Args();
//         if (client) {
//             await client
//                 .smartContracts()
//                 .readSmartContract({
//                     maxGas: BigInt(1000000),
//                     targetAddress: CONTRACT_ADDRESS,
//                     targetFunction: "viewAllReserves",
//                     parameter: args.serialize(),
//                 })
//                 .then((res) => {
//                     console.log("OpId: ", res);
//                 });
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }

// async function getBalance(account: string) {
//     const client = await createClient();
//     try {
//         if (client) {
//             await client
//                 .smartContracts()
//                 .readSmartContract({
//                     maxGas: BigInt(1000000),
//                     targetAddress: TOKEN_ADDRESS,
//                     targetFunction: "balanceOf",
//                     parameter: new Args().addString(account).serialize(),
//                 }).then((res) => {
//                     console.log("OpId: ", res);
//                 });
//         }
//     } catch (error) {
//         console.error(error);
//     }
// }

async function readContractData() {

    const client = await createClient();

    try {
        let args = new Args();
        if (client) {
            let res = await client
            .publicApi()
            .getDatastoreEntries([
              { address: CONTRACT_ADDRESS, key: strToBytes("OWNER") },
            ]);
          if (res[0].candidate_value) {
            let greetingDecoded = bytesToStr(res[0].candidate_value);
            console.log("greetingDecoded", greetingDecoded);
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
                    targetAddress: CONTRACT_ADDRESS,
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
                    targetAddress: CONTRACT_ADDRESS,
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

// setCoreAddress();
getCoreAddress();
// createClient();
