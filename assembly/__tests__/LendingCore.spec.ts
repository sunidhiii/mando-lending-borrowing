import {
  Address,
  Storage,
  changeCallStack,
  mockScCall,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import {
  constructor,
  initReserve,
  initUser,
  setAddressProvider,
  transferFeeToOwner,
  transferToUser,
  updateStateOnBorrow,
  updateStateOnDeposit,
  updateStateOnRedeem,
  updateStateOnRepay,
} from '../contracts/LendingCore';
import UserReserve from '../helpers/UserReserve';
import Reserve from '../helpers/Reserve';
import { ILendingCore } from '../interfaces/ILendingCore';
const readFile = '../../src/readFileTest';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12nG4GWCz4KoxqF8PaJ68TA9zXG91Cb7x4C8B7n7Wxvh3DRNAW9';
const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';
const reserve = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';
const INTEREST_ADDRESS = 'AS1jZ41Rc4mNNZdjxgeNCS8vgG1jTLsu1n2J7cexLHZ88D9i4vzS';

function initProvider(): ILendingCore {
  const coreContractAddr = new Address(contractAddr);

  return new ILendingCore(coreContractAddr);
}

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(new Args().add(provider).add(readFile).serialize());
});

describe('core modifiers', () => {
  switchUser(user2Address);

  throws('Should fail because the lending pool is not the tx emitter', () => {
    transferFeeToOwner(
      new Args().add(reserve).add(user2Address).add(10000000).serialize(),
    );
  });

  throws('Should fail because the lending pool is not the tx emitter', () => {
    transferToUser(
      new Args().add(reserve).add(user2Address).add(10000000).serialize(),
    );
  });

  throws('Should fail because the lending pool is not the tx emitter', () => {
    updateStateOnBorrow(
      new Args()
        .add(reserve)
        .add(user2Address)
        .add(10000000)
        .add(2500)
        .add(1)
        .serialize(),
    );
  });

  throws('Should fail because the lending pool is not the tx emitter', () => {
    updateStateOnRepay(
      new Args()
        .add(reserve)
        .add(user2Address)
        .add(10000000)
        .add(10000)
        .add(200)
        .add(true)
        .serialize(),
    );
  });

  throws('Should fail because the lending pool is not the tx emitter', () => {
    updateStateOnRedeem(new Args().add(provider).serialize());
  });

  throws('Should fail because the lending pool is not the tx emitter', () => {
    updateStateOnDeposit(
      new Args()
        .add(reserve)
        .add(user2Address)
        .add(10000000)
        .add(false)
        .serialize(),
    );
  });

  throws('Should fail because the owner is not the tx emitter', () => {
    setAddressProvider(new Args().add(provider).serialize());
  });
});

describe('init user', () => {
  const amt: u64 = 0;
  throws('should fail because the lending pool is not the tx emitter', () => {
    const userReserve = new UserReserve(
      user2Address,
      amt,
      amt,
      amt,
      amt,
      amt,
      true,
      false,
    );
    initUser(new Args().add(userReserve).add(reserve).serialize());
  });

  test('existence of user reserve', () => {
    const key = `USER_KEY_${user2Address}_${reserve}`;
    expect(Storage.hasOf(new Address(contractAddr), key)).toStrictEqual(false);
  });
});

describe('existence of reserve', () => {
  throws('should fail because the owner is not the tx emitter', () => {
    const reserveObj = new Reserve(
      reserve,
      '',
      '',
      0,
      '',
      INTEREST_ADDRESS,
      60,
      75,
      125,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );
    initReserve(new Args().add(reserveObj).serialize());
  });

  test('initializing a reserve', () => {
    switchUser(user1Address);

    const key = `RESERVE_KEY_${reserve}`;
    expect(Storage.hasOf(new Address(contractAddr), key)).toStrictEqual(false);

    const contract = initProvider();
    const mockValue: StaticArray<u8> = new Args().serialize();
    mockScCall(mockValue);
    const reserveObj = new Reserve(
      reserve,
      '',
      '',
      0,
      '',
      INTEREST_ADDRESS,
      60,
      75,
      125,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    );

    contract.initReserve(reserveObj);
  });
});
