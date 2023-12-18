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
  {
    const FeeProviderContract: ISCData = {
      // AS12B1DwnrebRVv3CcusrmGsSJKqpqQ372mYS4iS4jBm1LrqkxtT3
      data: readFileSync(path.join(__dirname, 'build', 'FeeProvider.wasm')), // smart contract bytecode
      coins: fromMAS(1),
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // arguments for deployment
    };
    const PriceOracleContract: ISCData = {
      // AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69
      data: readFileSync(path.join(__dirname, 'build', 'PriceOracle.wasm')),
      coins: BigInt(3) * fromMAS(0.1),
    };
    const InterestStrategyContract: ISCData = {
      // AS19jFaWTJbfUzYQ4Bi76AWQnDMhJYmA75ZzBFFHMjyV17aJhBbT
      data: readFileSync(path.join(__dirname, 'build', 'ReserveInterestRateStrategy.wasm')),
      coins: BigInt(3) * fromMAS(0.1),
      args: new Args()
        .addU64(0n)
        .addU64(80000000n)
        .addU64(1000000000n)
        .addU64(100000000n)
        .addU64(1000000000n)
        .addString('AS1JKtvk4HDkxoL8XSCF4XFtzXdWsVty7zVu4yjbWAjS58tP9KzJ'), // arguments for deployment
    };
    const AddressProviderContract: ISCData = {
      // AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp
      data: readFileSync(path.join(__dirname, 'build', 'LendingAddressProvider.wasm')),
      coins: fromMAS(0.1), // coins for deployment
      args: new Args(), // arguments for deployment
    };
    const DataProviderContract: ISCData = {
      // AS1BQyhbAEJefm5ADSPF35ZeyNxWxvgpHZyFK7CBy1GfzQ1ACuYV
      data: readFileSync(path.join(__dirname, 'build', 'LendingDataProvider.wasm')),
      coins: fromMAS(0.63),
      args: new Args()
        .addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp')
        .addString('AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69'), // arguments for deployment
    };
    const PoolContract: ISCData = {
      // AS16bskhBwAMmN17ojPhsTgSbQL4peJ6vpwwRumaMuRartFXns7K
      data: readFileSync(path.join(__dirname, 'build', 'LendingPool.wasm')), // smart contract bytecode
      coins: fromMAS(0.68),
      args: new Args().addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp'), // core smart contract address
      protoPaths: [], // proto files for deployment
    };
    const CoreContract: ISCData = {
      // AS12nG4GWCz4KoxqF8PaJ68TA9zXG91Cb7x4C8B7n7Wxvh3DRNAW9
      data: readFileSync(path.join(__dirname, 'build', 'LendingCore.wasm')), // smart contract bytecode
      coins: fromMAS(69), // coins for deployment 63000000
      args: new Args()
        .addString('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp')
        .addArray([...readFileSync(path.join(__dirname, 'build', 'mToken.wasm'))], ArrayTypes.U8), 
    };
    /// In the brackets you can specify the SCs you want to deploy
    await deploySC(publicApi, deployerAccount, [], BigInt(100), BigInt(3_980_167_295), true);
  }
  process.exit(0); // terminate the process after deployment(s) (526.812910514
})();
