import {
  Address,
  mockScCall,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  stringToBytes,
  u8toByte,
  u256ToBytes,
  u64ToBytes,
} from '@massalabs/as-types';
import {
  principalBalanceOf,
  name,
  symbol,
  decimals,
  constructor,
  mintOnDeposit,
  setMyKey,
  burn,
  redeem,
  totalSupplyInternal,
  mint,
} from '../contracts/mToken';
import { u256 } from 'as-bignum/assembly';
import { IERC20 } from '../interfaces/IERC20';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12vbS69oT2feTaPGff3xprnUkhrP1vgnvgpjTD2akYNwwf4NTzZ';
const user2Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';

const TOKEN_NAME = 'Mando Interest bearing USD Coin';
const TOKEN_SYMBOL = 'mUSDC';
const DECIMALS: u8 = 9;
const TOTAL_SUPPLY: u256 = new u256(0);
const underlyingAsset = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';
const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';

function initToken(): IERC20 {
  const tokenAddr = new Address(contractAddr);

  return new IERC20(tokenAddr);
}

beforeAll(() => {
  resetStorage();
  setDeployContext(user2Address);
  constructor(
    new Args()
      .add(TOKEN_NAME)
      .add(TOKEN_SYMBOL)
      .add(DECIMALS)
      .add(TOTAL_SUPPLY)
      .add(underlyingAsset)
      .add(provider)
      .serialize(),
  );
});

describe('Initialization', () => {
  test('total supply is properly initialized', () =>
    expect(totalSupplyInternal([])).toStrictEqual(u256ToBytes(TOTAL_SUPPLY)));

  test('token name is properly initialized', () =>
    expect(name([])).toStrictEqual(stringToBytes(TOKEN_NAME)));

  test('symbol is properly initialized', () =>
    expect(symbol([])).toStrictEqual(stringToBytes(TOKEN_SYMBOL)));

  test('decimals is properly initialized', () =>
    expect(decimals([])).toStrictEqual(u8toByte(DECIMALS)));
});

describe('BalanceOf', () => {
  test('Check an empty balance', () =>
    expect(
      principalBalanceOf(new Args().add(contractAddr).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero)));

  test('Check balance of invalid address', () => {
    const invalidAddress = new Address('A12AZDefef');
    expect(
      principalBalanceOf(new Args().add(invalidAddress.toString()).serialize()),
    ).toStrictEqual(u256ToBytes(u256.Zero));
  });
});

const mintOnDepositAmount: u64 = 100000;
const mintAmount: u256 = new u256(5000);

describe('MToken: Modifiers', () => {
  throws('Tries to invoke mintOnDeposit', () => {
    mintOnDeposit(
      new Args().add(user2Address).add(mintOnDepositAmount).serialize(),
    );
  });

  throws('Tries to invoke setMyKey', () => {
    setMyKey(new Args().add('user2Address').add(10).serialize());
  });

  throws('Tries to invoke mint', () => {
    mint(new Args().add(user2Address).add(mintAmount).serialize());
  });
});

describe('mint mToken to U3', () => {
  test('should mint mToken', () => {
    const token = initToken();
    const mockValue = new Args().serialize();
    mockScCall(mockValue);

    token.mint(new Address(user2Address), mintAmount);

    // check balance of U2
    const bal: u64 = 5000;
    const balance = u64ToBytes(bal);
    mockScCall(balance);
    expect(token.balanceOf(new Address(user2Address))).toBe(bal);

    // check totalSupply update
    const finalSupply =
      u64.parse(mintAmount.toString()) + u64.parse(TOTAL_SUPPLY.toString());
    const totalSupply = u64ToBytes(finalSupply);
    mockScCall(totalSupply);
    expect(token.totalSupply()).toBe(
      // @ts-ignore
      finalSupply,
    );
  });
});

const burnAmount: u64 = 5000;

describe('burn mToken from U1', () => {
  test('should burn mToken', () => {
    const token = initToken();
    const mockValueMint = new Args().serialize();
    mockScCall(mockValueMint);
    token.mint(new Address(user2Address), mintAmount);

    const mockValue = new Args().serialize();
    mockScCall(mockValue);
    token.burn(burnAmount);

    // check balance of U2
    const finalValue = u64.parse(TOTAL_SUPPLY.toString()) - burnAmount;
    const totalValue = u64ToBytes(finalValue);
    mockScCall(totalValue);
    expect(token.balanceOf(new Address(user2Address))).toBe(finalValue);

    // check totalSupply update
    mockScCall(totalValue);
    expect(token.totalSupply()).toBe(finalValue);
  });
});

describe('Fails burn mToken', () => {
  throws('Fails to burn because of underflow ', () =>
    burn(new Args().add(u256.Max).serialize()),
  );
});

describe('redeem tokens from pool', () => {
  throws('tries to redeem 0 amount', () => {
    redeem(new Args().add(0).serialize());
  });

  throws('tries to redeem more than available balance', () => {
    redeem(new Args().add(u64.MAX_VALUE).serialize());
  });
});
