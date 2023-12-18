import {
  Address,
  changeCallStack,
  mockScCall,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { constructor, updateFee } from '../contracts/FeeProvider';
import { IFeeProvider } from '../interfaces/IFeeProvider';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12B1DwnrebRVv3CcusrmGsSJKqpqQ372mYS4iS4jBm1LrqkxtT3';
const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';

const ORIGNATION_FEE: u64 = 2500000;
const NEW_ORIGNATION_FEE: u64 = 4500000;

function initProvider(): IFeeProvider {
  const feeContractAddr = new Address(contractAddr);

  return new IFeeProvider(feeContractAddr);
}

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
});

describe('update loan origination Fee', () => {
  constructor(new Args().add(provider).serialize());

  switchUser(user2Address);

  throws('Should fail because the owner is not the tx emitter', () => {
    updateFee(new Args().add(ORIGNATION_FEE).serialize());
  });

  test('update new fee', () => {
    const contract = initProvider();
    const mockValue: StaticArray<u8> = new Args().serialize();
    mockScCall(mockValue);
    contract.updateFee(NEW_ORIGNATION_FEE);
  });
});

describe('calculate loan origination Fee', () => {
  test('calculate fee', () => {
    const amount: u64 = 100000;

    const fee: u64 = 250;
    const contract = initProvider();
    const mockValue: StaticArray<u8> = new Args().add(250).serialize();
    mockScCall(mockValue);
    expect(contract.calculateLoanOriginationFee(amount)).toStrictEqual(fee);
  });
});
