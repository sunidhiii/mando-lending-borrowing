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
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider';
import { ILendingDataProvider } from '../interfaces/ILendingDataProvider';
import { ILendingCore } from '../interfaces/ILendingCore';
import { ILendingPool } from '../interfaces/ILendingPool';

const TRANSFER_EVENT_NAME = 'TRANSFER';
const APPROVAL_EVENT_NAME = 'APPROVAL';
const BURN_EVENT = 'BURN';

export const NAME_KEY = stringToBytes('NAME');
export const SYMBOL_KEY = stringToBytes('SYMBOL');
export const TOTAL_SUPPLY_KEY = stringToBytes('TOTAL_SUPPLY');
export const DECIMALS_KEY = stringToBytes('DECIMALS');
export const UNDERLYINGASSET_KEY = stringToBytes('UNDERLYINGASSET');
export const ADDRESS_PROVIDER_KEY = stringToBytes('ADDRPROVIDER');

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


function balanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);

    const addr = new Address(
        args.nextString().expect('Address argument is missing or invalid'),
    );

    const balance = calculateCumulatedBalanceInternal(
        addr,
        _balance(addr)
    )

    return u256ToBytes(balance);
}


// export function totalSupply(_: StaticArray<u8>): StaticArray<u8> {
//   return Storage.get(TOTAL_SUPPLY_KEY);
// }

// ==================================================== //
// ====                 TRANSFER                   ==== //
// ==================================================== //


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
        .expect('burn amount argument is missing or invalid');

    _decreaseTotalSupply(amount);

    _burn(Context.caller(), amount);

    generateEvent(
        `${BURN_EVENT}: ${amount.toString()} tokens from ${Context.caller().toString()}`,
    );
}



export function mintOnDeposit(binaryArgs: StaticArray<u8>): void {

    const args = new Args(binaryArgs);

    const user = args.nextString().expect('user argument is missing or invalid');
    const amount =
        args.nextU256().expect('mintOnDeposit amount argument is missing or invalid');

    //cumulates the balance of the user
    // const arr = cumulateBalanceInternal(Context.caller());

    // const balanceIncrease = arr[1];
    // const index = arr[2];

    //mint an equivalent amount of tokens to cover the new deposit
    _mint(new Args().add(user).add(amount).serialize());

    generateEvent(`Balance increased after mint tokens`)

}


export function principalBalanceOf(binaryArgs: StaticArray<u8>): StaticArray<u8> {

    const args = new Args(binaryArgs);

    const addr = new Address(
        args.nextString().expect('Address argument is missing or invalid'),
    );

    return u256ToBytes(_balance(addr));
}

export function getUserIndex(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);
    const user = args.nextString().unwrap();
    const storageKey = `USER_INDEX_${user}`;

    if (!Storage.has(stringToBytes(storageKey))) {
        Storage.set(stringToBytes(storageKey), u256ToBytes(u256.Zero));
    }
    generateEvent(`Dataas = > ${Storage.get(stringToBytes(storageKey))}`)
    return Storage.get(stringToBytes(storageKey));
}

function calculateCumulatedBalanceInternal(
    _user: Address,
    _balance: u256
): u256 {
    // const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
    // const core = new ILendingCore(new Address(addressProvider.getCore()));

    // const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY));
    // const normalizedIncome = core.getNormalizedIncome(underLyingAsset);
    const userIndex = bytesToString(getUserIndex(new Args().add(_user.toString()).serialize()));
    const normalizedIncome: u256 = new u256(1000000000);

    let cumulatedBal: u256 = u256.Zero;
    if (u64.parse(userIndex) > 0) {
        cumulatedBal = u256.fromU64((u64.parse(_balance.toString()) * u64.parse(normalizedIncome.toString())) / u64.parse(userIndex));
    }
    // const cumulatedBal = u256.fromU64(u64.parse(_balance.toString()) * 10 / 10);
    return cumulatedBal;
}

function cumulateBalanceInternal(user: Address): Array<u64> {

    // const args = new Args(binaryArgs)
    // const user = new Address(args.nextString().unwrap());

    const previousPrincipalBal = _balance(user);
    const balanceIncrease = u64.parse(balanceOf(new Args().add(user.toString()).serialize()).toString()) - u64.parse(previousPrincipalBal.toString());

    if (balanceIncrease > 0) {
        _mint(new Args().add(user.toString()).add(u256.fromU64(balanceIncrease)).serialize());
    }

    // const addressProvider = new ILendingAddressProvider(new Address((bytesToString(Storage.get(ADDRESS_PROVIDER_KEY)))));
    // const core = new ILendingCore(new Address(addressProvider.getCore()));

    // const underLyingAsset = bytesToString(Storage.get(UNDERLYINGASSET_KEY));
    // const index = core.getNormalizedIncome(underLyingAsset)
    const index: u256 = new u256(1000000000);

    const storageKey = `USER_INDEX_${user.toString()}`;
    Storage.set(stringToBytes(storageKey), u256ToBytes(index));

    generateEvent(`Dataaa => ${u64.parse(previousPrincipalBal.toString())} ${(u64.parse(previousPrincipalBal.toString()) + balanceIncrease)} ${balanceIncrease}`)
    return [u64.parse(previousPrincipalBal.toString()), (u64.parse(previousPrincipalBal.toString()) + balanceIncrease), (balanceIncrease)];
}


