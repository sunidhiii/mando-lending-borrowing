import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Args, ArrayType, MassaUnits, fromMAS } from '@massalabs/massa-web3';
import { CONNREFUSED } from 'dns';

// Load .env file content into process.env
dotenv.config();

// Get the URL for a public JSON RPC API endpoint from the environment variables
const publicApi = process.env.JSON_RPC_URL_PUBLIC;
if (!publicApi) {
  throw new Error('Missing JSON_RPC_URL_PUBLIC in .env file');
}

// Get the secret key for the wallet to be used for the deployment from the environment variables
const secretKey = process.env.WALLET_SECRET_KEY;
if (!secretKey) {
  throw new Error('Missing WALLET_SECRET_KEY in .env file');
}

// Create an account using the private key
const deployerAccount = await WalletClient.getAccountFromSecretKey(secretKey);

// Obtain the current file name and directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));

/**
 * Deploy one or more smart contracts.
 *
 * @remarks
 * Multiple smart contracts can be deployed by adding more objects to the array.
 * In this example one contract located at 'build/main.wasm' is deployed with
 * 0.1 MASSA and an argument 'Test'.
 *
 * After all deployments, it terminates the process.
 */
(async () => {
  // await deploySC(
  //   publicApi, // JSON RPC URL
  //   deployerAccount, // account deploying the smart contract(s)
  //   [
  //     // {
  //     //   data: readFileSync(path.join(__dirname, 'build', 'ReserveToken.wasm')), // smart contract bytecode
  //     //   coins: fromMAS(1), // coins for deployment 63000000
  //     //   args: new Args().addString("MyToken").addString("MySymbol").addU8(9).addU256(BigInt(100000)), // arguments for deployment
  //     // } as ISCData,
  //     {
  //       data: readFileSync(path.join(__dirname, 'build', 'LendingPool.wasm')), // smart contract bytecode
  //       coins: fromMAS(1), // coins for deployment 63000000
  //       args: new Args().addString('AS1Jucbg6GFKnyrmyzhMWaooZwKcG4743nGGAkvHEQVoDPQbwBeF'), // core smart contract address
  //       protoPaths: [], // proto files for deployment
  //     } as ISCData,
  //     // {
  //     //   data: readFileSync(path.join(__dirname, 'build', 'LendingCore.wasm')), // smart contract bytecode
  //     //   coins: fromMAS(33.9), // coins for deployment 63000000
  //     //   args: new Args().addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayType.U8), // arguments for deployment
  //     //   // protoPaths: [], // proto files for deployment
  //     // } as ISCData,
  //     // Additional smart contracts can be added here for deployment
  //   ],
  //   0n, // fees for deployment
  //   4_200_000_000n, // max gas for deployment
  //   true, // if true, waits for the first event before returning
  // );
  // process.exit(0); // terminate the process after deployment(s)

  // })();


  {
    // const FeeProviderContract: ISCData = {    // AS12siiezjR5th6NDJAf2dVxCX3c9AdPnL1ZpQXjU2QzkYBjnhNC2
    //   data: readFileSync(path.join(__dirname, 'build', 'FeeProvider.wasm')), // smart contract bytecode
    //   coins: fromMAS(1), // coins for deployment 63000000
    //   args: new Args(), // arguments for deployment
    // }; 
    // const PriceOracleContract: ISCData = {      // AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69
    //   data: readFileSync(path.join(__dirname, "build", "PriceOracle.wasm")),
    //   coins: BigInt(3) * fromMAS(0.1),
    // };
    // const InterestStrategyContract: ISCData = {    // AS17MpgjV2F2ZaY9KZQ2uCDXC8cmeZtD6nm4M3r76LSmXMDggjr7
    //   data: readFileSync(path.join(__dirname, "build", "ReserveInterestRateStrategy.wasm")),
    //   coins: BigInt(3) * fromMAS(0.1),
    //   args: new Args().addU64(0n).addU64(80000000n).addU64(1000000000n).addU64(100000000n).addU64(1000000000n).addString('AS1LGwzLFK3Yj4cHQQerX8iLXDUnLACf9F5reASfFjitVfiVZG6g'), // arguments for deployment
    // };
    // const AddressProviderContract: ISCData = {    // AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp
    //   data: readFileSync(path.join(__dirname, "build", "LendingAddressProvider.wasm")),
    //   coins: fromMAS(0.1), // coins for deployment
    //   args: new Args(), // arguments for deployment   
    // };
    // const DataProviderContract: ISCData = {       // AS12nQVHGDUS7hCVAi125AdjUHcrHQA4Mo6XAMSbcLd28J6TJXqC8
    //   data: readFileSync(path.join(__dirname, "build", "LendingDataProvider.wasm")),
    //   coins: fromMAS(0.63), // coins for deployment
    //   args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp').addString('AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69'), // arguments for deployment   
    // };
    const PoolContract: ISCData = {              // AS18f4zBvy5HHAqUGMfhaJpbiKhrM4KEyJRhorkyZpgZVHjtka7a
      data: readFileSync(path.join(__dirname, 'build', 'LendingPool.wasm')), // smart contract bytecode
      coins: fromMAS(0.68), // coins for deployment 63000000
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // core smart contract address
      protoPaths: [], // proto files for deployment
    };
    // const CoreContract: ISCData = {        // AS1NQ9vZdZakpH9Fq7nJaEHMe9VvkzQ4vRMzCwJ9YFVMSMYV7xnd       // AS18gnDx3UYsr7D3bd2XMzn1R2XjQBWcQnUMHFkpmW6nYcchjKZ3
    //   data: readFileSync(path.join(__dirname, 'build', 'LendingCore.wasm')), // smart contract bytecode
    //   coins: fromMAS(50), // coins for deployment 63000000
    //   args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp').addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayType.U8), // arguments for deployment
    //   // protoPaths: [], // proto files for deployment
    // };
    // const mToken1: ISCData = {               // AS1bPdVQK3LQy5zGD8qf6cDQ1Eh8D9dU6riPQmWq9XTAVJam78vN
    //   data: readFileSync(path.join(__dirname, 'build', 'mToken1.wasm')), // smart contract bytecode
    //   coins: fromMAS(0.1), // coins for deployment 63000000
    //   args: new Args().addU8(9).addU256(1000000000000000n), // arguments for deployment
    //   // protoPaths: [], // proto files for deployment
    // };
    // const testAgain: ISCData = {               // AS1WxmcceUVSKhHS7dq48oaAVZY3CLPEXzfTUzbvb9j3a3bdW66M
    //   data: readFileSync(path.join(__dirname, 'build', 'testAgain.wasm')), // smart contract bytecode
    //   coins: fromMAS(0.001), // coins for deployment 63000000
    // };
    // const reserveToken: ISCData = {               // AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva
    //   data: readFileSync(path.join(__dirname, 'build', 'ReserveToken.wasm')), // smart contract bytecode
    //   coins: fromMAS(1), // coins for deployment 63000000
    //   args: new Args().addString('myToken').addString('MTOKEN').addU8(9).addU256(1000000000000000n), // arguments for deployment
    // };
    /// In the brackets you can specify the SCs you want to deploy
    await deploySC(publicApi, deployerAccount, [PoolContract], BigInt(100), BigInt(4_200_000_000), true);
  }
  process.exit(0); // terminate the process after deployment(s)
})();
