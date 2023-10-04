import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Args, ArrayType, MassaUnits, fromMAS } from '@massalabs/massa-web3';

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
    // const PriceOracleContract: ISCData = {      // AS125wZb7wjevMy6yqBJQJG1rpkZKmstp4usG6DrMA8WVTzKWwDEb
    //   data: readFileSync(path.join(__dirname, "build", "PriceOracle.wasm")),
    //   coins: BigInt(3) * fromMAS(0.1),
    // };
    // const InterestStrategyContract: ISCData = {    // AS12h9de74HXj8LJMgF4VJ4pWuYoUnVYghqo9boBu5dtDpBUsThtL
    //   data: readFileSync(path.join(__dirname, "build", "ReserveInterestRateStrategy.wasm")),
    //   coins: BigInt(3) * fromMAS(0.1),
    //   args: new Args().addU64(10n).addU64(80000000n).addU64(1000000000n).addU64(100000000n).addU64(1000000000n).addString('AS1LGwzLFK3Yj4cHQQerX8iLXDUnLACf9F5reASfFjitVfiVZG6g'), // arguments for deployment
    // };
    // const AddressProviderContract: ISCData = {    // AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp
    //   data: readFileSync(path.join(__dirname, "build", "LendingAddressProvider.wasm")),
    //   coins: fromMAS(0.1), // coins for deployment
    //   args: new Args(), // arguments for deployment   
    // };
    // const DataProviderContract: ISCData = {       // AS1Btm291vXk4wuxFezb8Ek48rJ55qgz86HcXAYKdY2ADa6PYYPT
    //   data: readFileSync(path.join(__dirname, "build", "LendingDataProvider.wasm")),
    //   coins: fromMAS(0.63), // coins for deployment
    //   args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp').addString('AS125wZb7wjevMy6yqBJQJG1rpkZKmstp4usG6DrMA8WVTzKWwDEb'), // arguments for deployment   
    // };
    // const PoolContract: ISCData = {              // AS1yFgenirS6FTJEn3XBZPYuw4ACGU5gVAEmCbnSvQ44ss5H8Rwm
    //   data: readFileSync(path.join(__dirname, 'build', 'LendingPool.wasm')), // smart contract bytecode
    //   coins: fromMAS(0.68), // coins for deployment 63000000
    //   args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // core smart contract address
    //   protoPaths: [], // proto files for deployment
    // };
    const CoreContract: ISCData = {               // AS1cJGwbKMfb7NJzC8oSdNwQwWpLF4aoRTS6yjFrLk7uAddqdtF3
      data: readFileSync(path.join(__dirname, 'build', 'LendingCore.wasm')), // smart contract bytecode
      coins: fromMAS(50), // coins for deployment 63000000
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp').addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayType.U8), // arguments for deployment
      // protoPaths: [], // proto files for deployment
    };
    // const mToken: ISCData = {               // AS1PGLcs2Nh5yP8hgwL2JPTQ2hHBaNWND5ZtqdyzHyAsaKC3YrAi
    //   data: readFileSync(path.join(__dirname, 'build', 'mToken.wasm')), // smart contract bytecode
    //   coins: fromMAS(11), // coins for deployment 63000000
    //   args: new Args().addString('mToken').addString('MTOKEN').addU8(9).addU256(100000000n).addString('AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8').addString('AS1LGwzLFK3Yj4cHQQerX8iLXDUnLACf9F5reASfFjitVfiVZG6g').addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // arguments for deployment
    //   // protoPaths: [], // proto files for deployment
    // };
    // const test: ISCData = {               // AS1PGLcs2Nh5yP8hgwL2JPTQ2hHBaNWND5ZtqdyzHyAsaKC3YrAi
    //   data: readFileSync(path.join(__dirname, 'build', 'testAgain.wasm')), // smart contract bytecode
    //   coins: fromMAS(0.001), // coins for deployment 63000000
    // };
    /// In the brackets you can specify the SCs you want to deploy
    await deploySC(publicApi, deployerAccount, [CoreContract], BigInt(100), BigInt(4_200_000_000), true);
  }
  process.exit(0); // terminate the process after deployment(s)
})();
