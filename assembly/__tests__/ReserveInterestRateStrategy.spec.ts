import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import {
  calculateInterestRates,
  constructor,
  setBaseVariableBorrowRate,
  setReserve,
  setStableRateSlope1,
  setStableRateSlope2,
  setVariableRateSlope1,
  setVariableRateSlope2,
} from '../contracts/ReserveInterestRateStrategy';
import { u256 } from 'as-bignum/assembly';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS1jZ41Rc4mNNZdjxgeNCS8vgG1jTLsu1n2J7cexLHZ88D9i4vzS';

const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const underlyingAsset = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  const amount: u64 = 100;

  resetStorage();
  setDeployContext(user1Address);
  constructor(
    new Args()
      .add(amount)
      .add(amount)
      .add(amount)
      .add(amount)
      .add(amount)
      .add(underlyingAsset)
      .serialize(),
  );
});

describe('interestRate modifiers', () => {
  switchUser(user2Address);

  throws('Tries to invoke setBaseVariableBorrowRate', () => {
    setBaseVariableBorrowRate(new Args().add(100000000).serialize());
  });

  throws('Tries to invoke setStableRateSlope1', () => {
    setStableRateSlope1(new Args().add(100000000).serialize());
  });

  throws('Tries to invoke setStableRateSlope2', () => {
    setStableRateSlope2(new Args().add(100000000).serialize());
  });

  throws('Tries to invoke setStableRateSlope2', () => {
    setStableRateSlope2(new Args().add(100000000).serialize());
  });

  throws('Tries to invoke setVariableRateSlope1', () => {
    setVariableRateSlope1(new Args().add(100000000).serialize());
  });

  throws('Tries to invoke setVariableRateSlope2', () => {
    setVariableRateSlope2(new Args().add(100000000).serialize());
  });

  throws('Tries to invoke setReserve', () => {
    setReserve(new Args().add(100000000).serialize());
  });
});

const amount = new u256(5000, 0, 1);

describe('calculate interest rate', () => {
  throws('sending wrong serialized arguments', () => {
    calculateInterestRates(
      new Args().add(amount).add(amount).add(amount).add(amount).serialize(),
    );
  });
});
