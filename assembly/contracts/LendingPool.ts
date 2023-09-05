
import { call, Address, Context, Storage, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, bytesToString, stringToBytes, u256ToBytes, u64ToBytes } from '@massalabs/as-types';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import { IERC20 } from '../interfaces/IERC20';
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { u256 } from 'as-bignum/assembly';

const ONE_UNIT = 10 ** 9;

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

  // const args = new Args(providerAddress);
  // const provider = new ILendingAddressProvider(new Address(args.nextString().expect('Provider Address argument is missing or invalid')))

  // Storage.set(
  //     'PROVIDER_ADDR',
  //     args.nextString().unwrap(),
  // );

  // const core = provider.getCore();
  const core = new Args(providerAddress).nextString().unwrap();
  Storage.set(
    'CORE_ADDR',
    core.toString(),
  );

  // const feeProvider = provider.getFeeProvider();
  // Storage.set(
  //     'FEE_PROVIDER',
  //     feeProvider.toString(),
  // );

  return [];
}


/**
 * @param _ - not used
 * @returns the emitted event serialized in bytes
 */
export function deposit(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const amount = args.nextU256().expect('No amount provided');
  const core = new ILendingCore(new Address(Storage.get('CORE_ADDR')));

  // to-do Update states for deposit
  // core.updateStateOnDeposit();

  // const mTokenData = call(new Address(Storage.get('CORE_ADDR')), "getReserve", new Args().add(reserve), 10 * ONE_UNIT);
  // const mTokenAddr = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  // const mToken = new IERC20(new Address(mTokenAddr.mTokenAddress));
  const mToken = new IERC20(new Address(core.getReserve(new Address(reserve)).mTokenAddress));

  const userReserve = new UserReserve(Context.caller().toString(), new u256(0), new u256(0), new u256(0), new u256(0), new u256(0), true);
  // call(new Address(Storage.get('CORE_ADDR')), "initUser", new Args().add(userReserve).add(reserve), 10 * ONE_UNIT);
  core.initUser(userReserve, new Address(reserve));

  mToken.mint(Context.caller(), amount);
  core.transferToReserve(new Address(reserve), Context.caller(), amount);

  generateEvent(`Deposited ${amount} to the pool`);
}

export function borrow(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const amount = args.nextU256().expect('No amount provided');

  const core = new ILendingCore(new Address(Storage.get('CORE_ADDR')));
  const availableLiq = core.getReserveAvailableLiquidity(new Address(reserve));

  assert(availableLiq >= amount, 'Not enough liquidity');

  core.updateStateOnBorrow(Context.caller(), new Address(reserve), amount);
  core.transferToUser(new Address(reserve), Context.caller(), amount);

  generateEvent(`Borrowed ${amount} amount from the pool`);

}

export function redeemUnderlying(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const user = args.nextString().expect('No user address provided');
  const amount = args.nextU256().expect('No amount provided');

  const core = new ILendingCore(new Address(Storage.get('CORE_ADDR')));
  const availableLiq = core.getReserveAvailableLiquidity(new Address(reserve));

  assert(availableLiq >= amount, 'Not enough liquidity');

  // update State On Redeem
  // core.updateStateOnRedeem(Context.caller(), new Address(reserve), amount);
  core.transferToUser(new Address(reserve), Context.caller(), amount);

}

export function repay(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().expect('No reserve address provided');
  const user = args.nextString().expect('No user address provided');
  const amount = args.nextU64().expect('No amount provided');

  const core = new ILendingCore(new Address(Storage.get('CORE_ADDR')));
  const availableLiq: u256 = core.getReserveAvailableLiquidity(new Address(reserve));

  const data = new Args(core.getUserBorrowBalances(new Address(reserve), new Address(user)));

  const principalBorrowBalance = data.nextU64().unwrap();
  const compoundedBorrowBalance = data.nextU64().unwrap();
  const borrowBalanceIncrease = data.nextU64().unwrap();

  const userOriginationFee = core.getUserReserve(new Address(user), new Address(reserve)).originationFee;

  assert(compoundedBorrowBalance > 0, "The user does not have any borrow pending");

  let paybackAmount = compoundedBorrowBalance + u64.parse(userOriginationFee.toString());

  if (amount < paybackAmount) {
    paybackAmount = amount;
  }

  if (paybackAmount <= u64.parse(userOriginationFee.toString())) {
    // core.updateStateOnRepay(
    //   _reserve,
    //   _onBehalfOf,
    //   0,
    //   vars.paybackAmount,
    //   vars.borrowBalanceIncrease,
    //   false
    // );

    core.transferFeeToOwner(
      new Address(reserve),
      Context.caller(),
      userOriginationFee)
  }

  let paybackAmountMinusFees = paybackAmount - u64.parse(userOriginationFee.toString());

  // core.updateStateOnRepay(
  //   reserve,
  //   Context.caller(),
  //   paybackAmountMinusFees,
  //   userOriginationFee,
  //   borrowBalanceIncrease,
  //   compoundedBorrowBalance == paybackAmountMinusFees
  // );

  // if the user didn't repay the origination fee, transfer the fee to the fee collection address
  if (u64.parse(userOriginationFee.toString()) > 0) {
    core.transferFeeToOwner(
      new Address(reserve),
      Context.caller(),
      userOriginationFee)
  }

  //sending the total msg.value if the transfer is ETH.
  //the transferToReserve() function will take care of sending the
  //excess ETH back to the caller
  core.transferToReserve(
    new Address(reserve),
    Context.caller(),
    new u256(paybackAmountMinusFees)
  );



}
