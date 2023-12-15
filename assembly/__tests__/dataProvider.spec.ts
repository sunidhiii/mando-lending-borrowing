import { changeCallStack, resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { setPriceOracle, setAddressProvider } from '../contracts/LendingDataProvider';
import { constructor } from '../contracts/FeeProvider';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS1BQyhbAEJefm5ADSPF35ZeyNxWxvgpHZyFK7CBy1GfzQ1ACuYV';
const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';
const oracle = 'AS12dZz5n7F41dSAvBQvTMrtFmWbuCkEiWVYZJytdxXfvpswpwB69';

function switchUser(user: string): void {
    changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
    resetStorage();
    setDeployContext(user1Address);
    constructor(
        new Args()
            .add(provider)
            .add(oracle)
            .serialize(),
    );
});

describe('update price oracle', () => {
    switchUser(user2Address);

    throws('Should fail because the owner is not the tx emitter', () => {
        setPriceOracle(new Args().add(oracle).serialize())
    });

    throws('Should fail because the owner is not the tx emitter', () => {
        setAddressProvider(new Args().add(provider).serialize())
    });
});

