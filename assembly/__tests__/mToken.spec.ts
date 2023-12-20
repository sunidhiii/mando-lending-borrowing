import {
  Address,
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import {
  Args,
  stringToBytes,
  u8toByte,
  u256ToBytes,
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
  totalSupplyKey,
  mint,
} from '../contracts/mToken';
import { u256 } from 'as-bignum/assembly';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12vbS69oT2feTaPGff3xprnUkhrP1vgnvgpjTD2akYNwwf4NTzZ';

const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const TOKEN_NAME = 'Mando Interest bearing USD Coin';
const TOKEN_SYMBOL = 'mUSDC';
const DECIMALS: u8 = 9;
const TOTAL_SUPPLY: u256 = new u256(0);
const underlyingAsset = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';
const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
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
    expect(totalSupplyKey([])).toStrictEqual(u256ToBytes(TOTAL_SUPPLY)));

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

const mintAmount: u256 = new u256(5000);

describe('MToken: Modifiers', () => {
  throws('Tries to invoke mintOnDeposit', () => {
    mintOnDeposit(new Args().add(user2Address).add(mintAmount).serialize());
  });

  throws('Tries to invoke setMyKey', () => {
    setMyKey(new Args().add('key').add(10).serialize());
  });
});

describe('mint mToken to U2', () => {
  test('should mint mToken', () => {
    mint(new Args().add(user2Address).add(mintAmount).serialize());
    // // check balance of U2
    expect(
      principalBalanceOf(new Args().add(user2Address).serialize()),
    ).toStrictEqual(u256ToBytes(mintAmount));

    // check totalSupply update
    expect(totalSupplyKey([])).toStrictEqual(
      // @ts-ignore
      u256ToBytes(mintAmount + TOTAL_SUPPLY),
    );
  });
});

const burnAmount: u256 = new u256(5000);

describe('burn mToken from U1', () => {
  throws('fails to burn because no balance', () => {
    burn(new Args().add(burnAmount).serialize());
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
