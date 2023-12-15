import { Address, changeCallStack, resetStorage, setDeployContext } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, u8toByte, bytesToU256, u256ToBytes } from '@massalabs/as-types';
import { deposit, constructor, borrow } from '../contracts/LendingPool';
import { u256 } from 'as-bignum/assembly';

import Reserve from '../helpers/Reserve';
import { principalBalanceOf } from '../contracts/mToken';

// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const contractAddr = 'AS12vbS69oT2feTaPGff3xprnUkhrP1vgnvgpjTD2akYNwwf4NTzZ';

const user1Address = 'AS12nG4GWCz4KoxqF8PaJ68TA9zXG91Cb7x4C8B7n7Wxvh3DRNAW9';
const user2Address = 'AU1cdD4zohQR5ZBd6oprfwaqkeAJXCV9b8TcpevDif7RdmfKMbWY';
const user3Address = 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8';
const user4Address = 'AS16bskhBwAMmN17ojPhsTgSbQL4peJ6vpwwRumaMuRartFXns7K';

const TOTAL_SUPPLY: u256 = new u256(0);
const provider = 'AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp';
const reserve = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';

function switchUser(user: string): void {
    changeCallStack(user + ' , ' + contractAddr);
}

beforeAll(() => {
    resetStorage();
    setDeployContext(user1Address);
    constructor(
        new Args()
            .add(provider)
            .serialize(),
    );
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
        borrow(new Args().add(reserve).add(amount).add(u64.MAX_VALUE).serialize());
    });

});