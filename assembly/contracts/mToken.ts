import { Address, Context, generateEvent, Storage, createEvent, callerHasWriteAccess, sendMessage } from '@massalabs/massa-as-sdk';
import { Args, bytesToString, bytesToU256, bytesToU64, stringToBytes, u256ToBytes, u64ToBytes } from '@massalabs/as-types';
import { _balance, _setBalance, _approve, _allowance } from '../helpers/token-internals';
import { u256 } from 'as-bignum/assembly';
import { _mint } from '../helpers/mint-internals';
import { _burn, _decreaseTotalSupply } from '../helpers/burn-internals';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider';
import { ILendingDataProvider } from '../interfaces/ILendingDataProvider';
import { ILendingCore } from '../interfaces/ILendingCore';
import { ILendingPool } from '../interfaces/ILendingPool';
import { ONE_UNIT } from './FeeProvider';
import { IRouter } from '../interfaces/IRouter';
import { IERC20 } from '../interfaces/IERC20';
import { onlyOwner } from '../helpers/ownership';

const TRANSFER_EVENT_NAME = 'TRANSFER';
const APPROVAL_EVENT_NAME = 'APPROVAL';
const BURN_EVENT = 'BURN';

export const NAME_KEY = stringToBytes('NAME');
export const SYMBOL_KEY = stringToBytes('SYMBOL');
export const TOTAL_SUPPLY_KEY = stringToBytes('TOTAL_SUPPLY');
export const DECIMALS_KEY = stringToBytes('DECIMALS');
export const UNDERLYINGASSET_KEY = stringToBytes('UNDERLYINGASSET');
export const ADDRESS_PROVIDER_KEY = stringToBytes('ADDRPROVIDER');

export const USDC = new Address("AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9");
export const WMAS = new Address("AS1JKtvk4HDkxoL8XSCF4XFtzXdWsVty7zVu4yjbWAjS58tP9KzJ");
export const ROUTER = new Address("AS12ZhJYEffSWWyp7XvCoEMKFBnbXw5uwp6S3cY2xbEr76W3VL3Dk");
export const FACTORY = new Address("AS1pLmABmGWUTBoaMPwThauUy75PQi8WW29zVYMHbU54ep1o9Hbf");

/**
 * Initialize the ERC20 contract
 * Can be called only once
 *
 * @example
 * ```typescript
 *   constructor(
 *   new Args()
 *     .add('TOKEN_NAME')
 *     .add('TOKEN_SYMBOL')
 *     .add(3) // decimals
 *     .add(1000) // total supply
 *     .serialize(),
 *   );
 * ```
 *
 * @param stringifyArgs - Args object serialized as a string containing:
 * - the token name (string)
 * - the token symbol (string).
 * - the decimals (u8).
 * - the totalSupply (u256)
 * - first owner (address)e
 */
export function constructor(stringifyArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess(), 'Caller is not allowed');

  const args = new Args(stringifyArgs);

  // initialize token name
  const name = args.nextString().expect('Error while initializing tokenName');
  Storage.set(NAME_KEY, stringToBytes(name));

  // initialize token symbol
  const symbol = args
    .nextString()
    .expect('Error while initializing tokenSymbol');
  Storage.set(SYMBOL_KEY, stringToBytes(symbol));

  // initialize token decimals
  const decimals = args
    .nextU8()
    .expect('Error while initializing tokenDecimals');
  Storage.set(DECIMALS_KEY, [decimals]);

  // initialize totalSupply
  const totalSupply = args
    .nextU256()
    .expect('Error while initializing totalSupply');
  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(totalSupply));

  // const user = args.nextString().expect('Error while initializing owner');
  // setOwner(new Args().add(user).serialize());
  // _setBalance(new Address(user), totalSupply);

  // underlying asset
  const underLyingAsset = args
    .nextString()
    .expect('Error while initializing underlying asset');
  Storage.set(UNDERLYINGASSET_KEY, stringToBytes(underLyingAsset));

  // data provider address
  const addressProvider = args.nextString().expect('Error while initializing addressProvider');
  Storage.set(
    ADDRESS_PROVIDER_KEY,
    stringToBytes(addressProvider),
  );
}

/**
 * Returns the version of this smart contract.
 * This versioning is following the best practices defined in https://semver.org/.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token version
 */
export function version(_: StaticArray<u8>): StaticArray<u8> {
  return stringToBytes('0.0.0');
}

// ======================================================== //
// ====                 TOKEN ATTRIBUTES               ==== //
// ======================================================== //

/**
 * Returns the name of the token.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token name.
 */
export function name(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(NAME_KEY);
}

/** Returns the symbol of the token.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns token symbol.
 */
export function symbol(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(SYMBOL_KEY);
}

/**
 * Returns the total token supply.
 *
 * The number of tokens that were initially minted.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns u256
 */
export function totalSupplyInternal(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(TOTAL_SUPPLY_KEY);
}

/**
 * Returns the maximum number of digits being part of the fractional part
 * of the token when using a decimal representation.
 *
 * @param _ - unused see https://github.com/massalabs/massa-sc-std/issues/18
 * @returns
 */
export function decimals(_: StaticArray<u8>): StaticArray<u8> {
  return Storage.get(DECIMALS_KEY);
}

// ==================================================== //
// ====                 BALANCE                    ==== //
// ==================================================== //


// export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
//   const args = new Args(binaryArgs);

//   const addr = new Address(
//     args.nextString().expect('Address argument is missing or invalid'),
//   );

//   return u256ToBytes(_balance(addr));
// }


// export function totalSupply(_: StaticArray<u8>): StaticArray<u8> {
//   return Storage.get(TOTAL_SUPPLY_KEY);
// }

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //

/**
 * Transfers tokens from the caller's account to the recipient's account.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the recipient's account (address)
 * - the number of tokens (u256).
 */
function transferInternal(binaryArgs: StaticArray<u8>): void {
  const owner = Context.caller();

  const args = new Args(binaryArgs);
  const toAddress = new Address(
    args.nextString().expect('receiverAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('transferInternal amount argument is missing or invalid');

  _transfer(owner, toAddress, amount);

  generateEvent(
    createEvent(TRANSFER_EVENT_NAME, [
      owner.toString(),
      toAddress.toString(),
      amount.toString(),
    ]),
  );
}

/**
 * Transfers tokens from the caller's account to the recipient's account.
 *
 * @param from - sender address
 * @param to - recipient address
 * @param amount - number of token to transfer
 *
 * @returns true if the transfer is successful
 */
function _transfer(from: Address, to: Address, amount: u256): void {
  const currentFromBalance = _balance(from);
  const currentToBalance = _balance(to);
  // @ts-ignore
  const newToBalance = currentToBalance + amount;

  assert(currentFromBalance >= amount, 'Transfer failed: insufficient funds');
  assert(newToBalance >= currentToBalance, 'Transfer failed: overflow');
  // @ts-ignore
  _setBalance(from, currentFromBalance - amount);
  _setBalance(to, newToBalance);
}

// ==================================================== //
// ====                 ALLOWANCE                  ==== //
// ==================================================== //

/**
 * Returns the allowance set on the owner's account for the spender.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the owner's account (address)
 * - the spender's account (address).
 */
export function allowance(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const owner = new Address(
    args.nextString().expect('owner argument is missing or invalid'),
  );
  const spenderAddress = new Address(
    args.nextString().expect('spenderAddress argument is missing or invalid'),
  );

  return u256ToBytes(_allowance(owner, spenderAddress));
}

/**
 * Increases the allowance of the spender on the owner's account by the amount.
 *
 * This function can only be called by the owner.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the spender's account (address);
 * - the amount (u256).
 */
export function increaseAllowance(binaryArgs: StaticArray<u8>): void {
  const owner = Context.caller();

  const args = new Args(binaryArgs);
  const spenderAddress = new Address(
    args.nextString().expect('spenderAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('increaseAllowance amount argument is missing or invalid');

  // @ts-ignore
  let newAllowance = _allowance(owner, spenderAddress) + amount;
  if (newAllowance < amount) {
    newAllowance = u256.Max;
  }

  _approve(owner, spenderAddress, newAllowance);

  generateEvent(
    createEvent(APPROVAL_EVENT_NAME, [
      owner.toString(),
      spenderAddress.toString(),
      newAllowance.toString(),
    ]),
  );
}

/**
 * Decreases the allowance of the spender the on owner's account by the amount.
 *
 * This function can only be called by the owner.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the spender's account (address);
 * - the amount (u256).
 */
export function decreaseAllowance(binaryArgs: StaticArray<u8>): void {
  const owner = Context.caller();

  const args = new Args(binaryArgs);
  const spenderAddress = new Address(
    args.nextString().expect('spenderAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('decreaseAllowance amount argument is missing or invalid');

  const current = _allowance(owner, spenderAddress);

  let newAllowance = u256.Zero;

  if (current > amount) {
    // @ts-ignore
    newAllowance = current - amount;
  }

  _approve(owner, spenderAddress, newAllowance);

  generateEvent(
    createEvent(APPROVAL_EVENT_NAME, [
      owner.toString(),
      spenderAddress.toString(),
      newAllowance.toString(),
    ]),
  );
}

/**
 * Transfers token ownership from the owner's account to the recipient's account
 * using the spender's allowance.
 *
 * This function can only be called by the spender.
 * This function is atomic:
 * - both allowance and transfer are executed if possible;
 * - or if allowance or transfer is not possible, both are discarded.
 *
 * @param binaryArgs - Args object serialized as a string containing:
 * - the owner's account (address);
 * - the recipient's account (address);
 * - the amount (u256).
 */
export function transferFrom(binaryArgs: StaticArray<u8>): void {
  const spenderAddress = Context.caller();

  const args = new Args(binaryArgs);
  const owner = new Address(
    args.nextString().expect('ownerAddress argument is missing or invalid'),
  );
  const recipient = new Address(
    args.nextString().expect('recipientAddress argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('transferFrom amount argument is missing or invalid');

  const spenderAllowance = _allowance(owner, spenderAddress);

  assert(
    spenderAllowance >= amount,
    'transferFrom failed: insufficient allowance',
  );

  _transfer(owner, recipient, amount);

  // @ts-ignore
  _approve(owner, spenderAddress, spenderAllowance - amount);

  generateEvent(
    createEvent(TRANSFER_EVENT_NAME, [
      owner.toString(),
      recipient.toString(),
      amount.toString(),
    ]),
  );
}

/**
*  Mint tokens on the recipient address.
*  Restricted to the owner of the contract.
*
* @param binaryArgs - `Args` serialized StaticArray<u8> containing:
* - the recipient's account (address)
* - the amount of tokens to mint (u256).
*/
export function mint(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  _mint(binaryArgs);
}

/**
 * Burn tokens from the caller address
 *
 * @param binaryArgs - byte string with the following format:
 * - the amount of tokens to burn obn the caller address (u256).
 */
export function burn(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const amount = args
    .nextU256()
    .expect('burn amount argument is missing or invalid');

  _decreaseTotalSupply(amount);

  _burn(Context.caller(), amount);

  generateEvent(
    `${BURN_EVENT}: ${amount.toString()} tokens from ${Context.caller().toString()}`,
  );
}

/**
 * Burn tokens from the caller address
 *
 * @param binaryArgs - byte string with the following format:
 * - the owner of the tokens to be burned (string).
 * - the amount of tokens to burn on the caller address (u256).
 *
 */
export function burnFrom(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const owner = new Address(
    args.nextString().expect('owner argument is missing or invalid'),
  );
  const amount = args
    .nextU256()
    .expect('burnFrom amount argument is missing or invalid');

  const spenderAllowance = _allowance(owner, Context.caller());

  assert(spenderAllowance >= amount, 'burnFrom failed: insufficient allowance');

  _decreaseTotalSupply(amount);

  _burn(owner, amount);

  // @ts-ignore
  _approve(owner, Context.caller(), spenderAllowance - amount);

  generateEvent(
    `${BURN_EVENT}: ${amount.toString()} tokens from ${owner.toString()}`,
  );
}

export function redeem(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const amount =
    args.nextU64().expect('Amount argument is missing or invalid');

  assert(amount > 0, "Amount to redeem needs to be > 0");

  //cumulates the balance of the user
  const arr = cumulateBalanceInternal(Context.caller());

  const currentBalance: u64 = arr[1];

  let amountToRedeem: u64 = amount;

  //if amount is greater than current balance, the user wants to redeem everything
  if (amount > currentBalance) {
    amountToRedeem = currentBalance;
  }

  assert(amountToRedeem <= currentBalance, "User cannot redeem more than the available balance");

  const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY))

  const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
  const dataProvider = new ILendingDataProvider(new Address(addressProvider.getDataProvider()));
  const isTransferAllowed = dataProvider.balanceDecreaseAllowed(underLyingAsset, Context.caller().toString(), amountToRedeem)

  //check that the user is allowed to redeem the amount
  assert(isTransferAllowed, "Transfer cannot be allowed.");

  // burns tokens equivalent to the amount requested
  burn(new Args().add(u256.fromU64(amountToRedeem)).serialize());

  // executes redeem of the underlying asset
  const pool = new ILendingPool(new Address(addressProvider.getLendingPool()));

  const mTokenBalanceAfterRedeem = currentBalance > amountToRedeem ? currentBalance - amountToRedeem : 0;

  pool.redeemUnderlying(
    underLyingAsset,
    Context.caller().toString(),
    amountToRedeem,
    mTokenBalanceAfterRedeem
  );

  generateEvent(`Balance redeem: ${amountToRedeem} tokens left to ${mTokenBalanceAfterRedeem} tokens`)

}

export function mintOnDeposit(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);

  const user = new Address(args.nextString().expect('user argument is missing or invalid'));
  const amount =
    args.nextU64().expect('mintOnDeposit amount argument is missing or invalid');

  //cumulates the balance of the user
  const arr = cumulateBalanceInternal(user);

  const balanceIncrease: u64 = arr[2];
  // const index = arr[2];

  //mint an equivalent amount of tokens to cover the new deposit
  _mint(new Args().add(user.toString()).add(u256.fromU64(amount)).serialize());

  generateEvent(`Balance increased after mint ${balanceIncrease} tokens`)

}

// to-do
export function burnOnLiquidation(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);
  const user = new Address(args.nextString().expect('user argument is missing or invalid'));

  const amount =
    args.nextU64().expect('burnOnLiquidation amount argument is missing or invalid');

  //cumulates the balance of the user
  const arr = cumulateBalanceInternal(user);

  const currentBalance = arr[1];
  const balanceIncrease = arr[2];

  //burns the requested amount of tokens
  burnFrom(new Args().add(user).add(u256.fromU64(amount)).serialize());

  generateEvent(`Balance decreased after mint from ${currentBalance} tokens to ${balanceIncrease} tokens`)

}

export function transferOnLiquidation(binaryArgs: StaticArray<u8>): void {
  onlyLendingPool();

  const args = new Args(binaryArgs);
  const from = new Address(
    args.nextString().expect('from argument is missing or invalid'));
  const to = new Address(
    args.nextString().expect('to argument is missing or invalid'));
  const amount =
    args.nextU64().expect('transferOnLiquidation amount argument is missing or invalid');

  _transfer(from, to, u256.fromU64(amount));
}

export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const addr = new Address(
    args.nextString().expect('Address argument is missing or invalid'),
  );

  const currentPrincipalBalance = _balance(addr);

  if (u64.parse(currentPrincipalBalance.toString()) == 0) {
    return u256ToBytes(u256.Zero);
  }

  const balance = calculateCumulatedBalanceInternal(
    addr.toString(),
    currentPrincipalBalance
  )

  return u256ToBytes(balance);
}

export function principalBalanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);

  const addr = new Address(
    args.nextString().expect('Address argument is missing or invalid'),
  );

  return u256ToBytes(_balance(addr));
}

export function totalSupply(): StaticArray<u8> {

  const currentSupplyPrincipal = bytesToU256(Storage.get(TOTAL_SUPPLY_KEY));

  if (u64.parse(currentSupplyPrincipal.toString()) == 0) {
    return u256ToBytes(u256.Zero);
  }

  const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY))
  const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const totalSupply = f64.parse(currentSupplyPrincipal.toString()) * (f64(core.getNormalizedIncome(underLyingAsset)) / f64(ONE_UNIT));

  return u256ToBytes(u256.fromF64(totalSupply));
}

export function getUserIndex(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();
  const storageKey = `USER_INDEX_${user}`;

  if (!Storage.has(stringToBytes(storageKey))) {
    Storage.set(stringToBytes(storageKey), u64ToBytes(0));
  }

  return Storage.get(stringToBytes(storageKey));
}

export function setAddressProvider(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  Storage.set(
    ADDRESS_PROVIDER_KEY,
    stringToBytes(provider),
  );
}

export function setUnderLyingAsset(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const underLyingAsset = args.nextString().expect('Error while initializing underlying asset');

  Storage.set(UNDERLYINGASSET_KEY, stringToBytes(underLyingAsset));
}

export function setMyKey(binaryArgs: StaticArray<number>) {
  const args = new Args(binaryArgs);
  const key = args.nextString().unwrap();
  const value = args.nextU64().unwrap();

  onlyLendingPool();
  
  Storage.set(stringToBytes(key), u64ToBytes(value))
}

function calculateCumulatedBalanceInternal(_user: string, _balance: u256): u256 {
  const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY));
  const normalizedIncome = core.getNormalizedIncome(underLyingAsset);

  // const storageKey = `USER_INDEX_${_user}`;
  // const userIndex = bytesToU64(Storage.get(stringToBytes(storageKey)));
  const userIndex = bytesToU64(getUserIndex(new Args().add(_user.toString()).serialize()));

  let cumulatedBal: f64 = 0;
  if (userIndex > 0) {
    cumulatedBal = f64.parse(_balance.toString()) * (f64(normalizedIncome) / f64(userIndex));
  }
  // const cumulatedBal = u256.fromU64(u64.parse(_balance.toString()) * 10 / 10);
  return u256.fromF64(cumulatedBal);
}

function cumulateBalanceInternal(user: Address): Array<u64> {

  // const args = new Args(binaryArgs)
  // const user = new Address(args.nextString().unwrap());

  const previousPrincipalBal = _balance(user);
  const balanceIncrease = u64.parse(bytesToU256(balanceOf(new Args().add(user.toString()).serialize())).toString()) > u64.parse(previousPrincipalBal.toString()) ? u64.parse(bytesToU256(balanceOf(new Args().add(user.toString()).serialize())).toString()) - u64.parse(previousPrincipalBal.toString()) : 0;

  const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY));
  const isAutoRewardEnabled = core.getUserReserve(user, underLyingAsset).autonomousRewardStrategyEnabled;
  
  const symbol = new IERC20(new Address(underLyingAsset)).symbol();
  
  if (balanceIncrease > 0) {
    if (isAutoRewardEnabled && (symbol == 'USDC' || symbol == 'WETH')) {
      swapTokensAndAddDeposit(user.toString());
    } else {
      _mint(new Args().add(user.toString()).add(u256.fromU64(balanceIncrease)).serialize());
    }
  }

  const index = core.getNormalizedIncome(underLyingAsset)
  
  const storageKey = `USER_INDEX_${user.toString()}`;
  Storage.set(stringToBytes(storageKey), u64ToBytes(index));

  generateEvent(`Balance ${previousPrincipalBal} increased to ${u64.parse(previousPrincipalBal.toString()) + balanceIncrease} tokens`)

  return [u64.parse(previousPrincipalBal.toString()), (u64.parse(previousPrincipalBal.toString()) + balanceIncrease), (balanceIncrease)];
}

function sendFuturOperation(user: string): void {
  const functionName = 'swapTokensAndAddDeposit';
  const address = Context.callee();
  const validityStartPeriod = Context.currentPeriod();
  const validityStartThread = Context.currentThread();

  let validityEndPeriod = validityStartPeriod + 5;
  let validityEndThread = validityStartThread + 1;
  
  const msg = new Args().add(user).serialize();
  const filterAddress: Address = new Address();
  const filterKey: StaticArray<u8> = new StaticArray<u8>(0);

  if (validityEndThread >= 32) {
    ++validityEndPeriod;
    validityEndThread = 0;
  }
  const maxGas = 1_000_000_000; // gas for smart contract execution
  const rawFee = 0;
  const coins = 0; // coins that can be used inside SC

  // Send the message
  sendMessage(
    address,
    functionName,
    validityStartPeriod,
    validityStartThread,
    validityEndPeriod,
    u8(validityEndThread),
    maxGas,
    rawFee,
    coins,
    msg,
    filterAddress,
    filterKey
  );

  generateEvent(
    `Next update planned on period ${validityStartPeriod.toString()} thread: ${validityStartThread.toString()}`,
  );
}

function swapTokensAndAddDeposit(user: string): void {
  let binStep: u64 = 0;

  const router = new IRouter(ROUTER);
  // const factory = new IFactory(FACTORY);
  const wmas = new IERC20(WMAS);
  // const usdc = new IERC20(USDC);
  const underLyingAsset = new Address(bytesToString(Storage.get(UNDERLYINGASSET_KEY)));
  const deadline = Context.timestamp() + 5000;
  const path = [new IERC20(underLyingAsset), wmas];

  const symbol = new IERC20(underLyingAsset).symbol();
  if (symbol.toUpperCase() == 'USDC') {
    binStep = 20;
  } else if (symbol.toUpperCase() == 'WETH') {
    binStep = 15;
  } else {
    return;
  }

  const previousPrincipalBal = _balance(new Address(user));
  const amount = u64.parse(bytesToU256(balanceOf(new Args().add(user.toString()).serialize())).toString()) - u64.parse(previousPrincipalBal.toString());

  const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
  const pool = new ILendingPool(new Address(addressProvider.getLendingPool()));
  const core = new ILendingCore(new Address(addressProvider.getCore()));

  const amountIn = amount;

  // new IERC20(USDC).transferFrom(Context.caller(), Context.callee(), amountIn);
  // const pair = factory.getLBPairInformation(underLyingAsset, wmas._origin, binStep).pair;

  core.transferToUser(underLyingAsset, Context.callee(), amountIn);
  new IERC20(underLyingAsset).increaseAllowance(router._origin, amountIn);
  const amountOut: u64 = router.swapExactTokensForTokens(amountIn, 0, [binStep], path, Context.callee(), deadline);

  new IERC20(wmas._origin).increaseAllowance(core._origin, amountOut);
  pool.depositRewards((wmas._origin).toString(), user, amountOut);
  core.transferToReserve(wmas._origin, Context.callee(), amountOut);

  sendFuturOperation(user);
  generateEvent(`Received ${amountOut} ${(wmas._origin).toString()} for ${amountIn} ${underLyingAsset} and deposited in the pool.`);

}

function onlyLendingPool(): void {
  const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
  const pool = new Address(addressProvider.getLendingPool());

  assert(Context.caller() === pool, 'Caller is not Lending pool');
}

// function swapTokens(amount: u64): void {
//     const binStep: u64 = 100;
//     const router = new IRouter(ROUTER);
//     // const factory = new IFactory(FACTORY);
//     const wmas = new IERC20(WMAS);
//     const usdc = new IERC20(USDC);
//     // const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
//     // const wmas_is_y = pair.getTokenY()._origin == wmas._origin;
//     // const swapForY = wmas_is_y;
//     const amountIn = router.getSwapIn(pair, amount * ONE_UNIT, swapForY).amountIn;
//     const path = [usdc, wmas];
//     const deadline = Context.timestamp() + 5000;
//     router.swapExactTokensForTokens(amountIn, 0, [binStep], path, Context.callee(), deadline);
//     generateEvent(`DEBUG: Bought ${amount} WMAS for ${amountIn} USDC`);
// }
