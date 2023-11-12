import { Args, u64ToBytes } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { IERC20 } from '../interfaces/IERC20';
import { ILendingCore } from '../interfaces/ILendingCore';

export function constructor(): void {
    
    const reserve = 'AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9';
    const core = new ILendingCore(new Address('AS19rMy7hLAEQdaZ7Zxa4jv3FWX8m3o6xL1C6G1EyBGTatkkLqDT'));
    const mToken = new IERC20(new Address(core.getReserve(reserve).mTokenAddress));
    const isFirstDeposit: boolean = mToken.balanceOf(Context.caller()) == 0;

    generateEvent(`${isFirstDeposit}`);

}
