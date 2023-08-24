// import MessageResponse from "./interfaces/MessageResponse";
import {
    ClientFactory,
    WalletClient,
    DefaultProviderUrls, Args, ArrayType, strToBytes, bytesToStr } from "@massalabs/massa-web3";
import { readFileSync } from 'fs';
import path from 'path';

// create a base account for signing transactions
const baseAccount = {
    address: "AU139TmwoP6w5mgUQrpF9s49VXeFGXmN1SiuX5HEtzcGmuJAoXFa",
    secretKey: "S124xpCaad7hPhvezhHp2sSxb56Dpi2oufcp2m2NtkdPjgxFXNon",
    publicKey: "P1zir4oncNbkuQFkZyU4TjfNzR5BotZzf4hGVE4pCNwCb6Z2Kjn",
};

let CONTRACT_ADDRESS = 'AS1GmRjJciniFFCo4ikexRFTwRfobZVJ3tLuXbocWYnJTUAAmi66';
let TOKEN_ADDRESS = '';

async function createClient() {
    const account = await WalletClient.getAccountFromSecretKey(
        baseAccount.secretKey
    );

    const client = await ClientFactory.createDefaultClient(
        DefaultProviderUrls.TESTNET,
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

async function viewReserveData() {

    const client = await createClient();

    try {
        let args = new Args();
        if (client) {
            await client
                .smartContracts()
                .readSmartContract({
                    maxGas: BigInt(1000000),
                    targetAddress: CONTRACT_ADDRESS,
                    targetFunction: "viewAllReserves",
                    parameter: args.serialize(),
                })
                .then((res) => {
                    console.log("OpId: ", res);
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
                    maxGas: BigInt(1000000),
                    targetAddress: TOKEN_ADDRESS,
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

async () => {

}
