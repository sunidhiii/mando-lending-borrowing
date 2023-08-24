
import { call, Address, Context, Storage } from '@massalabs/massa-as-sdk';
import { Args, Serializable } from '@massalabs/as-types';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { IERC20 } from '../interfaces/IERC20';
// import { UserReserve, Reserve } from '../contracts/LendingCore';

class UserReserve implements Serializable {
    constructor(
      public addr: Address = new Address(),
      public principalBorrowBalance: u64 = 0,
      public lastVariableBorrowCumulativeIndex: u64 = 0,
      public originationFee: u64 = 0,
      public stableBorrowRate: u64 = 0,
      public lastUpdateTimestamp: u64 = 0,
      public useAsCollateral: bool = false,
    ) { }
  
    public serialize(): StaticArray<u8> {
      const args = new Args();
      args.add(this.addr);
      args.add(this.principalBorrowBalance);
      args.add(this.lastVariableBorrowCumulativeIndex);
      args.add(this.originationFee);
      args.add(this.stableBorrowRate);
      args.add(this.lastUpdateTimestamp);
      args.add(this.useAsCollateral);
      return args.serialize();
    }
  
    public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
      const args = new Args(data, offset);
  
      const addr = args.nextString();
      if (addr.isErr()) {
        return new Result(0, "Can't deserialize the addr");
      }
      this.addr = new Address(addr.unwrap());
  
      const principalBorrowBalance = args.nextU64();
      if (principalBorrowBalance.isErr()) {
        return new Result(0, "Can't deserialize the principalBorrowBalance");
      }
      this.principalBorrowBalance = u64(principalBorrowBalance.unwrap());
  
      const lastVariableBorrowCumulativeIndex = args.nextU64();
      if (lastVariableBorrowCumulativeIndex.isErr()) {
        return new Result(0, "Can't deserialize the lastVariableBorrowCumulativeIndex");
      }
      this.lastVariableBorrowCumulativeIndex = lastVariableBorrowCumulativeIndex.unwrap();
  
      const originationFee = args.nextU64();
      if (originationFee.isErr()) {
        return new Result(0, "Can't deserialize the originationFee");
      }
      this.originationFee = originationFee.unwrap();
  
      const stableBorrowRate = args.nextU64();
      if (stableBorrowRate.isErr()) {
        return new Result(0, "Can't deserialize the stableBorrowRate");
      }
      this.stableBorrowRate = stableBorrowRate.unwrap();
  
      const lastUpdateTimestamp = args.nextU64();
      if (lastUpdateTimestamp.isErr()) {
        return new Result(0, "Can't deserialize the lastUpdateTimestamp");
      }
      this.lastUpdateTimestamp = lastUpdateTimestamp.unwrap();
  
      const useAsCollateral = args.nextBool();
      if (useAsCollateral.isErr()) {
        return new Result(0, "Can't deserialize the useAsCollateral");
      }
      this.useAsCollateral = useAsCollateral.unwrap();
  
      return new Result(args.offset);
    }
}

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param binaryArgs - Arguments serialized with Args
 */
export function constructor(providerAddress: StaticArray<u8>): StaticArray<u8> {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.
    if (!Context.isDeployingContract()) {
        return [];
    }

    const args = new Args(providerAddress);
    const provider = new ILendingAddressProvider(new Address(args.nextString().expect('Provider Address argument is missing or invalid')))

    Storage.set(
        'PROVIDER_ADDR',
        args.nextString().unwrap(),
    );

    const core = provider.getCore();
    // const core = new Args(call(provider, 'getCore', new Args(), 0))
    Storage.set(
        'CORE_ADDR',
        core.toString(),
    );

    const feeProvider = provider.getFeeProvider();
    Storage.set(
        'FEE_PROVIDER',
        feeProvider.toString(),
    );

    return [];
}

/**
 * @param _ - not used
 * @returns the emitted event serialized in bytes
 */
export function deposit(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);
    const reserve = args.nextString().expect('No reserve address provided');
    const amount = args.nextU64().expect('No amount provided');
    const core = new ILendingCore(new Address(Storage.get('CORE_ADDRESS')));

    // to-do Update states for deposit


    const mToken = new IERC20(core.getReserve(new Address(reserve)).mTokenAddress);
    // const reserve = core.getReserve(new Address(reserve)).addr;

    const doesExist: bool = core.userExists(Context.caller(), new Address(reserve));
    if(!doesExist) {
        const userReserve: UserReserve = new UserReserve(Context.caller(), 0, 0, 0, 0, 0, false);
        // core.initUser(userReserve, new Address(reserve));
        call(new Address(Storage.get('CORE_ADDRESS')), "initReserve", new Args().add(userReserve).add(reserve), 0);
    }

    mToken.mint(Context.caller(), amount);
    core.transferToReserve(new Address(reserve), Context.caller(), amount);

    return [];
}

export function borrow(binaryArgs: StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);
    const reserve = args.nextString().expect('No reserve address provided');
    const amount = args.nextU64().expect('No amount provided');

    const core = new ILendingCore(new Address(Storage.get('CORE_ADDRESS')));
    const availableLiq = core.getReserveAvailableLiquidity(new Address(reserve));

    assert(availableLiq >= amount, 'Not enough liquidity');

    core.transferToUser(new Address(reserve), Context.caller(), amount);;

    return [];
}

// export function redeemUnderlying(_: StaticArray<u8>): StaticArray<u8> {
//     const message = "I'm an event!";
//     generateEvent(message);
//     return stringToBytes(message);
// }

// export function repay(_: StaticArray<u8>): StaticArray<u8> {
//     const message = "I'm an event!";
//     generateEvent(message);
//     return stringToBytes(message);
// }
