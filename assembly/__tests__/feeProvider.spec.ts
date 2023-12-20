import {
  changeCallStack,
  resetStorage,
  setDeployContext,
} from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { constructor, updateFee } from '../contracts/FeeProvider';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12B1DwnrebRVv3CcusrmGsSJKqpqQ372mYS4iS4jBm1LrqkxtT3';
const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';

const ORIGNATION_FEE: u64 = 2500000;

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
  resetStorage();
  setDeployContext(user1Address);
  constructor(new Args().add(provider).serialize());
});

describe('update loan origination Fee', () => {
  switchUser(user2Address);

  throws('Should fail because the owner is not the tx emitter', () => {
    updateFee(new Args().add(ORIGNATION_FEE).serialize());
  });
});
