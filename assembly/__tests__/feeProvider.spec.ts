import { changeCallStack, resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { Args, bytesToString, bytesToU64, u64ToBytes } from '@massalabs/as-types';
import { calculateLoanOriginationFee, constructor, getLoanOriginationFeePercentage, updateFee, } from '../contracts/FeeProvider';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12B1DwnrebRVv3CcusrmGsSJKqpqQ372mYS4iS4jBm1LrqkxtT3';
const user1Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user2Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';

const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';

function switchUser(user: string): void {
    changeCallStack(user + ' , ' + contractAddr);
}

const ORIGNATION_FEE: u64 = 2500000;
const NEW_ORIGNATION_FEE: u64 = 3000000;

beforeAll(() => {
    resetStorage();
    setDeployContext(user1Address);
    constructor(
        new Args()
            .add(provider).serialize()
    );
});

describe('update loan origination Fee', () => {

    switchUser(user1Address);

    test('update new fee', () => {
        updateFee(new Args().add(NEW_ORIGNATION_FEE).serialize());

        expect(
            (getLoanOriginationFeePercentage()),
        ).toStrictEqual(u64ToBytes(ORIGNATION_FEE));
    });

    switchUser(user2Address);

    throws('Should fail because the owner is not the tx emitter', () => {
        updateFee(new Args().add(ORIGNATION_FEE).serialize())
    });
});

describe('calculate loan origination Fee', () => {
    test('calculate fee', () => {

        const amount: u64 = 100000;
        const ONE_UNIT = 10 ** 9;
        const originationFee = u64((f64(amount) * f64(ORIGNATION_FEE)) / f64(ONE_UNIT));

        expect(
            calculateLoanOriginationFee(new Args().add(amount).serialize()),
        ).toStrictEqual(u64ToBytes(originationFee));
    });
});
