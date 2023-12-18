import { resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { deposit, constructor, borrow, repay } from '../contracts/LendingPool';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const user1Address = 'AS12nG4GWCz4KoxqF8PaJ68TA9zXG91Cb7x4C8B7n7Wxvh3DRNAW9';

const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';
const reserve = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(new Args().add(provider).serialize());
});

const amount: u64 = 1000000;

describe('deposit tokens', () => {
  throws('should fail to deposit tokens because of low balance', () => {
    deposit(new Args().add(reserve).add(amount).serialize());
  });
});

describe('borrow tokens', () => {
  throws('invaid interest rate mode selected', () => {
    borrow(new Args().add(reserve).add(amount).add(0).serialize());
  });

  throws('not enough liquidity available in this reserve', () => {
    borrow(new Args().add(reserve).add(u64.MAX_VALUE).add(1).serialize());
  });
});

describe('repay tokens', () => {
  throws('the user doesnt have any borrow pending', () => {
    repay(new Args().add(reserve).add(amount).serialize());
  });
});
