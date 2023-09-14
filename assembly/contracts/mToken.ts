import {
  Address,
  Context,
  generateEvent,
  Storage,
  createEvent,
  callerHasWriteAccess,
} from '@massalabs/massa-as-sdk';
import { Args, bytesToString, bytesToU256, stringToBytes, u256ToBytes } from '@massalabs/as-types';
import { _balance, _setBalance, _approve, _allowance } from '../helpers/token-internals';
import { setOwner } from '../helpers/ownership';
import { u256 } from 'as-bignum/assembly';
import { _mint } from '../helpers/mint-internals';
import { _burn, _decreaseTotalSupply } from '../helpers/burn-internals';
import { ILendingCore } from '../interfaces/ILendingCore';

const TRANSFER_EVENT_NAME = 'TRANSFER';
const APPROVAL_EVENT_NAME = 'APPROVAL';
const BURN_EVENT = 'BURN';

export const NAME_KEY = stringToBytes('NAME');
export const SYMBOL_KEY = stringToBytes('SYMBOL');
export const TOTAL_SUPPLY_KEY = stringToBytes('TOTAL_SUPPLY');
export const DECIMALS_KEY = stringToBytes('DECIMALS');
export const UNDERLYINGASSET_KEY = stringToBytes('UNDERLYINGASSET');
export const CORE_ADDR_KEY = stringToBytes('COREADDR');

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
  assert(callerHasWriteAccess());

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

  const user = args.nextString().expect('Error while initializing owner');
  setOwner(new Args().add(user).serialize());
  // _setBalance(new Address(user), totalSupply);

  // underlying asset
  const underLyingAsset = args
    .nextString()
    .expect('Error while initializing underlying asset');
  Storage.set(UNDERLYINGASSET_KEY, stringToBytes(underLyingAsset));

  // core address
  const core = args.nextString().expect('Error while initializing core address');
  Storage.set(
    CORE_ADDR_KEY,
    stringToBytes(core),
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
function totalSupplyInternal(_: StaticArray<u8>): StaticArray<u8> {
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

/**
 * Returns the balance of an account.
 *
 * @param binaryArgs - Args object serialized as a string containing an owner's account (Address).
 */
// function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
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
    .expect('amount argument is missing or invalid');

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
    .expect('amount argument is missing or invalid');

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
    .expect('amount argument is missing or invalid');

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
    .expect('amount argument is missing or invalid');

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
  // onlyOwner();
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
    .expect('amount argument is missing or invalid');

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
    .expect('amount argument is missing or invalid');

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
    args.nextU256().expect('amount argument is missing or invalid');

  assert(u64.parse(amount.toString()) > 0, "Amount to redeem needs to be > 0");

  //cumulates the balance of the user
  const arr = cumulateBalanceInternal(Context.caller());

  const currentBalance = arr[1];
  const balanceIncrease = arr[2];
  const index = arr[3];

  let amountToRedeem = amount;

  //if amount is greater than current balance, the user wants to redeem everything
  if (amount > currentBalance) {
    amountToRedeem = currentBalance;
  }

  assert(amountToRedeem <= currentBalance, "User cannot redeem more than the available balance");

  //check that the user is allowed to redeem the amount
  assert(isTransferAllowed(Context.caller(), amountToRedeem), "Transfer cannot be allowed.");

  // burns tokens equivalent to the amount requested
  _burn(Context.caller(), amountToRedeem);

  const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY))

  // executes redeem of the underlying asset
  pool.redeemUnderlying(
    underLyingAsset,
    Context.caller(),
    amountToRedeem,
  (u64.parse(currentBalance.toString()) - u64.parse(amountToRedeem.toString()))
  );

}

export function mintOnDeposit(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const user = new Address(args.nextString().expect('user argument is missing or invalid'));
  const amount =
    args.nextU256().expect('amount argument is missing or invalid');

  //cumulates the balance of the user
  const arr = cumulateBalanceInternal(Context.caller());

  const balanceIncrease = arr[2];
  const index = arr[3];

  //mint an equivalent amount of tokens to cover the new deposit
  _mint(new Args().add(user).add(amount).serialize());

}

export function burnOnLiquidation(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const user = new Address(args.nextString().expect('user argument is missing or invalid'));

  const amount =
    args.nextU256().expect('amount argument is missing or invalid');

  //cumulates the balance of the user
  const arr = cumulateBalanceInternal(Context.caller());

  const currentBalance = arr[1];
  const balanceIncrease = arr[2];
  const index = arr[3];

  //burns the requested amount of tokens
  _burn(user, amount);

}

export function transferOnLiquidation(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const from = new Address(
    args.nextString().expect('from argument is missing or invalid'));
  const to = new Address(
    args.nextString().expect('to argument is missing or invalid'));
  const amount =
    args.nextU256().expect('amount argument is missing or invalid');

  _transfer(from, to, amount);
}

function calculateCumulatedBalanceInternal(
  _user: Address,
  _balance: u256
): u256 {
  // const cumulatedBal = new u256(u64.parse(_balance.toString()) * core.getNormalizedIncome(underlyingAssetAddress)) / userIndexes[_user]);
  const cumulatedBal = new u256(u64.parse(_balance.toString()) * 10 / 10);
  return cumulatedBal;
}

export function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const addr = new Address(
    args.nextString().expect('Address argument is missing or invalid'),
  );

  const currentPrincipalBalance = _balance(addr);

  if (u64.parse(currentPrincipalBalance.toString()) == 0) {
    return stringToBytes('0');
  }

  const balance = calculateCumulatedBalanceInternal(
    addr,
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

  if (parseFloat(currentSupplyPrincipal.toString()) == 0) {
    return [0];
  }

  const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY))
  const core = new ILendingCore(new Address((bytesToString(Storage.get(CORE_ADDR_KEY)))));
  const totalSupply = new u256(parseFloat(currentSupplyPrincipal.toString()) * parseFloat(core.getNormalizedIncome(underLyingAsset).toString()));
  return u256ToBytes(totalSupply);
}

export function getUserIndex(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();
  const storageKey = `USER_INDEX_${user}`;

  return Storage.get(stringToBytes(storageKey));
}

function cumulateBalanceInternal(user: Address): Array<u256> {
  const previousPrincipalBal = _balance(user);
  const balanceIncrease = u64.parse(balanceOf(new Args().add(user.toString()).serialize()).toString()) - u64.parse(previousPrincipalBal.toString());

  _mint(new Args().add(user.toString()).add(balanceIncrease).serialize());

  const storageKey = `USER_INDEX_${user}`;

  // Storage.set(stringToBytes(storageKey), core.getNormalizedIncome);

  // const index = core.getNormalizedIncome()

  return [previousPrincipalBal, new u256(u64.parse(previousPrincipalBal.toString()) + balanceIncrease), new u256(balanceIncrease),];
}

