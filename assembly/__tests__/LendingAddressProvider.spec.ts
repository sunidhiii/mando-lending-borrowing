import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import { Args, bytesToString, stringToBytes } from '@massalabs/as-types';
import {
  constructor,
  getConfigurator,
  getCore,
  getDataProvider,
  getLendingPool,
  setConfigurator,
  setCore,
  setDataProvider,
  setLendingPool,
} from '../contracts/LendingAddressProvider';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';
const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const core = 'AS12nG4GWCz4KoxqF8PaJ68TA9zXG91Cb7x4C8B7n7Wxvh3DRNAW9';
const pool = 'AS16bskhBwAMmN17ojPhsTgSbQL4peJ6vpwwRumaMuRartFXns7K';
const configurator = 'AS12nG4GWCz4KoxqF8PaJ68TA9zXG91Cb7x4C8B7n7Wxvh3DRNAW9';
const dataProvider = 'AS1BQyhbAEJefm5ADSPF35ZeyNxWxvgpHZyFK7CBy1GfzQ1ACuYV';

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(new Args().serialize());
});

describe('update smart contract addresses ', () => {
  test('set configurator', () => {
    setConfigurator(new Args().add(configurator).serialize());
    expect(bytesToString(getConfigurator())).toBe(configurator);
  });

  test('set configurator', () => {
    setCore(new Args().add(core).serialize());
    expect(bytesToString(getCore())).toBe(core);
  });

  test('set configurator', () => {
    setLendingPool(new Args().add(pool).serialize());
    expect(bytesToString(getLendingPool())).toBe(pool);
  });

  test('set configurator', () => {
    setDataProvider(new Args().add(dataProvider).serialize());
    expect(bytesToString(getDataProvider())).toBe(dataProvider);
  });
});

describe('update smart contract addresses fail', () => {
  switchUser(user2Address);

  throws('Should fail because the owner is not the tx emitter', () => {
    setCore(new Args().add(core).serialize());
  });

  throws('Should fail because the owner is not the tx emitter', () => {
    setLendingPool(new Args().add(core).serialize());
  });

  throws('Should fail because the owner is not the tx emitter', () => {
    setDataProvider(new Args().add(core).serialize());
  });

  throws('Should fail because the owner is not the tx emitter', () => {
    setConfigurator(new Args().add(core).serialize());
  });
});
