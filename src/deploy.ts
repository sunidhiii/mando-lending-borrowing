import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deploySC, WalletClient, ISCData } from '@massalabs/massa-sc-deployer';
import { Args, ArrayTypes, MassaUnits, fromMAS } from '@massalabs/massa-web3';
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
  //     //   args: new Args().addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayTypes.U8), // arguments for deployment
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
    // const FeeProviderContract: ISCData = {    // AS1ia2Edh5YihVdwQEx3yh8rwUEGyHeJLw43wW9iLeUbdXcJmYjM      // AS1oehDh1LzsoxLDL4JicSXSimWADvGMJ9kxm8SDLVG7RqMCmup8
    //   data: readFileSync(path.join(__dirname, 'build', 'FeeProvider.wasm')), // smart contract bytecode
    //   coins: fromMAS(1), // coins for deployment 63000000
    //   args: new Args(), // arguments for deployment
    // }; 
    // // const PriceOracleContract: ISCData = {      // AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69
    // //   data: readFileSync(path.join(__dirname, "build", "PriceOracle.wasm")),
    // //   coins: BigInt(3) * fromMAS(0.1),
    // // };
    const InterestStrategyContract: ISCData = {   // AS19jFaWTJbfUzYQ4Bi76AWQnDMhJYmA75ZzBFFHMjyV17aJhBbT    // AS128sfzGpR8TSTEXD8bE6ThVyb6XHDK4rccKsS8jttrKXtbYjRp7
      data: readFileSync(path.join(__dirname, "build", "ReserveInterestRateStrategy.wasm")),
      coins: BigInt(3) * fromMAS(0.1),
      args: new Args().addU64(0n).addU64(80000000n).addU64(1000000000n).addU64(100000000n).addU64(1000000000n).addString('AS1JKtvk4HDkxoL8XSCF4XFtzXdWsVty7zVu4yjbWAjS58tP9KzJ'), // arguments for deployment
    };
    // const AddressProviderContract: ISCData = {    // AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp
    //   data: readFileSync(path.join(__dirname, "build", "LendingAddressProvider.wasm")),
    //   coins: fromMAS(0.1), // coins for deployment
    //   args: new Args(), // arguments for deployment   
    // };
    const DataProviderContract: ISCData = {     // AS1C1oBKxq1nKZeHKGs8AbjNH2yF3pyEMh1iCPAVuSuaKJBj2P4r       // AS17fkjQMzwBtBPMUJLVH1g2YhMmYK5uArwjoYqDeu2z4g59nbdX   // AS12ui9SXJSEVgnovXidY741tLxrnt6QALL6zkkoLuKVgKctf2mrE   // AS12nQVHGDUS7hCVAi125AdjUHcrHQA4Mo6XAMSbcLd28J6TJXqC8
      data: readFileSync(path.join(__dirname, "build", "LendingDataProvider.wasm")),
      coins: fromMAS(0.63), // coins for deployment
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp').addString('AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69'), // arguments for deployment   
    };
    const PoolContract: ISCData = {      // AS12oqaNnQcfu4QiwabEtEeiXAmDD8eTRctfpnWDzB4enpWrF3MJA               // AS1j2cS3rxUku66RdfEegjS1XR9faHpMDQKimPBseMkhu6UNsMW9           // AS177n5fut3EfvN4LaXbebrqSBUVXHAvTWG84YN51wcN658KQb2F       // AS1Z7UjqsSNqe6HwwtnNWDpuCCTXX7M4gP8ygeqNa1hjefojv9nL
      data: readFileSync(path.join(__dirname, 'build', 'LendingPool.wasm')), // smart contract bytecode
      coins: fromMAS(0.68), // coins for deployment 63000000
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // core smart contract address
      protoPaths: [], // proto files for deployment
    };
    const CoreContract: ISCData = {      //AS19rMy7hLAEQdaZ7Zxa4jv3FWX8m3o6xL1C6G1EyBGTatkkLqDT                // AS13x3KS3GmmxCyvuX8zsxxyf3vYRHgK2yM9v6rwWHHmJsP2R73o   // AS1nSbi3hRQneZxU91WFfNRMAdXsdHN65YssmDiN7ZSmZzxRxjkc  // AS123Ejj5mLZdsy6guKtZaKusi6GmF61gcD2aDBKNFsiCVZCCaZnb    // AS1NQ9vZdZakpH9Fq7nJaEHMe9VvkzQ4vRMzCwJ9YFVMSMYV7xnd       // AS18gnDx3UYsr7D3bd2XMzn1R2XjQBWcQnUMHFkpmW6nYcchjKZ3
      data: readFileSync(path.join(__dirname, 'build', 'LendingCore.wasm')), // smart contract bytecode
      coins: fromMAS(69), // coins for deployment 63000000
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp').addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayTypes.U8), // arguments for deployment
      // protoPaths: [], // proto files for deployment
    };
    // const mToken1: ISCData = {               // AS1bPdVQK3LQy5zGD8qf6cDQ1Eh8D9dU6riPQmWq9XTAVJam78vN
    //   data: readFileSync(path.join(__dirname, 'build', 'mToken1.wasm')), // smart contract bytecode
    //   coins: fromMAS(0.1), // coins for deployment 63000000
    //   args: new Args().addU8(9).addU256(1000000000000000n), // arguments for deployment
    //   // protoPaths: [], // proto files for deployment
    // };
    const testAgain: ISCData = {               // AS1WxmcceUVSKhHS7dq48oaAVZY3CLPEXzfTUzbvb9j3a3bdW66M
      data: readFileSync(path.join(__dirname, 'build', 'testAgain.wasm')), // smart contract bytecode
      coins: fromMAS(1), // coins for deployment 63000000
      // args: new Args().addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayTypes.U8), // arguments for deployment
    };
    // const reserveToken: ISCData = {               // AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva
    //   data: readFileSync(path.join(__dirname, 'build', 'mToken.wasm')), // smart contract bytecode
    //   coins: fromMAS(1), // coins for deployment 63000000
    //   args: new Args().addString('name').addString('symbol').addU8(9).addU256(0n).addString('AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9').addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // arguments for deployment
    // };
    /// In the brackets you can specify the SCs you want to deploy
    await deploySC(publicApi, deployerAccount, [testAgain], BigInt(100), BigInt(4_200_000_000), true);
  }
  process.exit(0); // terminate the process after deployment(s) (526.812910514
})();
