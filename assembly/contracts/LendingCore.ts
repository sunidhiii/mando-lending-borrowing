import { call, Context, createSC, Storage, Address, transferCoins, balance, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, bytesToString, fixedSizeArrayToBytes, serializableObjectsArrayToBytes, stringToBytes } from '@massalabs/as-types';
import { onlyOwner, ownerAddress } from '../helpers/ownership';
// import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { IERC20 } from '../interfaces/IERC20';
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';
import { Object } from 'assemblyscript/std/assembly/bindings/dom';
import { u256 } from 'as-bignum/assembly';

const ONE_UNIT = 10 ** 9;
const RESERVE_KEY = 'RESERVE_KEY';
const USER_KEY = 'USER_KEY';

export const ORIGNATION_FEE = 0.0025 * 10 ** 9;
export const MAS = 'EeeEeeEeeeeEeeeeeEeeeeeeEeeeeeeEEeeeeeeEeeeEeeeeeeEee';

// enum InterestRateMode { NONE, STABLE, VARIABLE }

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param providerAddress - Arguments serialized with Args
 */
export function constructor(args: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return;
  }

  // const args = new Args(providerAddress);
  // const provider = new ILendingAddressProvider(new Address(args.nextString().expect('Provider Address argument is missing or invalid')))

  // Storage.set(
  //   'PROVIDER_ADDR',
  //   args.nextString().unwrap(),
  // );

  let mToken_contract_code = new Args(args).nextFixedSizeArray<u8>().unwrap();
  Storage.set(stringToBytes('mToken_contract_code'), StaticArray.fromArray(mToken_contract_code));

  // generateEvent(`Constructor called with provider address ${provider}`);
}

export function initReserve(binaryArgs: StaticArray<u8>): void {

  // onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  let reserve: Reserve = args.nextSerializable<Reserve>().unwrap();

  let mToken_contract_code = Storage.get(stringToBytes('mToken_contract_code'));
  let mToken_addr = createSC(mToken_contract_code);
  call(mToken_addr, 'constructor', new Args().add('mTokenName').add('mTokenSymbol').add(u8(9)).add(new u256(100000000)).add(Context.caller()), 10 * ONE_UNIT);
  // call(mToken_addr, 'constructor', new Args().add(Context.caller().toString()), 10 * ONE_UNIT);

  reserve.mTokenAddress = mToken_addr.toString();

  // let mToken_contract_code = args.nextUint8Array().unwrap();
  // reserve.mTokenAddress = createSC(new Args().add(mToken_contract_code).serialize());

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserve.addr}`;

  // check reserve does not already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(!reserveExists, 'Reserve already exists');

  // save reserve to storage
  Storage.set(stringToBytes(storageKey), reserve.serialize());

  addReserveToList(reserve.addr);

  generateEvent(
    'ReserveCreated : ' +
    ', addr:' +
    reserve.addr.toString() +
    ', name:' +
    reserve.name.toString() +
    ', symbol:' +
    reserve.symbol.toString() +
    ', decimals:' +
    reserve.decimals.toString() +
    ', mTokenAddress:' +
    reserve.mTokenAddress.toString() +
    ', interestCalcAddress:' +
    reserve.interestCalcAddress.toString() +
    ', baseLTV:' +
    reserve.baseLTV.toString() +
    'LiquidationThreshold: ' +
    reserve.LiquidationThreshold.toString() +
    'LiquidationBonus: ' +
    reserve.LiquidationBonus.toString(),
  );

}

export function getReserve(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(reserveExists, 'Reserve does not exist');

  // get the serialized reserve info
  return Storage.get(stringToBytes(storageKey));

  // return new Args(data).nextSerializable<Reserve>().unwrap();
}

export function deleteReserve(binaryArgs: StaticArray<u8>): void {

  onlyOwner();

  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(stringToBytes(storageKey));
  assert(reserveExists, 'Reserve does not exist');

  // delete the serialized reserve info
  return Storage.del(stringToBytes(storageKey));
}

export function initUser(binaryArgs: StaticArray<u8>): void {

  // onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  let userReserve: UserReserve = args.nextSerializable<UserReserve>().unwrap();
  const reserve = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${USER_KEY}_${userReserve.addr}_${reserve}`;

  // check reserve does not already exist
  const userExists = Storage.has(stringToBytes(storageKey));
  // assert(!userExists, 'User already exists');
  if (!userExists) {
    // save reserve to storage
    Storage.set(stringToBytes(storageKey), userReserve.serialize());

    generateEvent(
      'UserReserveCreated : ' +
      ', addr:' +
      userReserve.addr.toString() +
      ', principalBorrowBalance:' +
      userReserve.principalBorrowBalance.toString() +
      ', lastVariableBorrowCumulativeIndex:' +
      userReserve.lastVariableBorrowCumulativeIndex.toString() +
      ', originationFee:' +
      userReserve.originationFee.toString() +
      ', stableBorrowRate:' +
      userReserve.stableBorrowRate.toString() +
      ', lastUpdateTimestamp:' +
      userReserve.lastUpdateTimestamp.toString() +
      ', useAsCollateral:' +
      userReserve.useAsCollateral.toString(),
    );
  }

}

export function getUserReserve(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  const userAddr = args.nextString().unwrap();
  const reserveAddr = args.nextString().unwrap();

  const storageKey = `${USER_KEY}_${userAddr}_${reserveAddr}`;

  // check reserve must already exist
  const userExists = Storage.has(stringToBytes(storageKey));
  assert(userExists, 'User does not exist');

  // get the serialized reserve info
  return Storage.get(stringToBytes(storageKey));

  // return new Args(data).nextSerializable<UserReserve>().unwrap();
}

function addReserveToList(reserve: string): void {

  if (!Storage.has(stringToBytes('ALL_RESERVES'))) {
    Storage.set(stringToBytes('ALL_RESERVES'), new Args().add<Array<string>>([]).serialize());
  }

  // const storageKey = `${RESERVE_KEY}_${reserve.toString()}`;
  // if (!Storage.has(storageKey)) {
  // let reserveArr = Storage.get('ALL_RESERVES');
  // var array_data: string[] = reserveArr.split(',');
  // array_data.push(reserve.toString());
  // Storage.set('ALL_RESERVES', array_data.toString());

  let reserveArr = new Args(Storage.get(stringToBytes('ALL_RESERVES'))).nextStringArray().unwrap();
  reserveArr.push(reserve);
  Storage.set(stringToBytes('ALL_RESERVES'), new Args().add<Array<string>>(reserveArr).serialize());
  // }

}

export function viewAllReserves(): string[] {
  // let reserveArr = Storage.get('ALL_RESERVES');
  // var array_data: string[] = reserveArr.split(',');

  let reserveArr = new Args(Storage.get(stringToBytes('ALL_RESERVES'))).nextStringArray().unwrap();
  return reserveArr;
}

export function transferToReserve(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= u64.parse(amount.toString()), "Not enough sent coins");
    transferCoins(Context.callee(), u64.parse(amount.toString()));
  } else {
    assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve)).transferFrom(new Address(user), Context.callee(), amount);
  }

}

export function transferFeeToOwner(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const owner = ownerAddress(new Args().serialize());

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= u64.parse(amount.toString()), "Not enough sent coins");
    transferCoins(new Address(bytesToString(owner)), u64.parse(amount.toString()));
  } else {
    assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve)).transferFrom(new Address(user), new Address(bytesToString(owner)), amount);
  }

}

export function transferToUser(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  if (reserve == MAS) {
    // transferCoins(new Address(user), u64(amount));
  } else {
    new IERC20(new Address(reserve)).transfer(new Address(user), amount);
  }

}

export function updateStateOnBorrow(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();
  const reserve = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const mTokenData = getReserve(new Args().add(reserve).serialize());
  const mTokenAddr = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  const mToken = new IERC20(new Address(mTokenAddr.mTokenAddress));
  mToken.transferFrom(new Address(user), Context.callee(), amount);
  mToken.burn(amount);

  const reserveData = getUserReserve(new Args().add(user).add(reserve).serialize())
  const userBorrowBalData = new Args(reserveData).nextSerializable<UserReserve>().unwrap();

  let userBorrowBal: u256 = userBorrowBalData.principalBorrowBalance;
  userBorrowBal = new u256(u64.parse(amount.toString()) + u64.parse(userBorrowBal.toString()));

  const storageKey = `${USER_KEY}_${user}_${reserve}`;
  const userReserve = new UserReserve(user, userBorrowBal, new u256(0), new u256(0), new u256(0), new u256(0), true);

  Storage.set(stringToBytes(storageKey), userReserve.serialize());

}

export function updateStateOnRepay(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();
  const reserve = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const mTokenData = getReserve(new Args().add(reserve).serialize());
  const mTokenAddr = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  const mToken = new IERC20(new Address(mTokenAddr.mTokenAddress));
  mToken.transferFrom(new Address(user), Context.callee(), amount);
  mToken.burn(amount);

  const reserveData = getUserReserve(new Args().add(user).add(reserve).serialize())
  const userBorrowBalData = new Args(reserveData).nextSerializable<UserReserve>().unwrap();

  let userBorrowBal: u256 = userBorrowBalData.principalBorrowBalance;
  userBorrowBal = new u256(u64.parse(amount.toString()) + u64.parse(userBorrowBal.toString()));

  const storageKey = `${USER_KEY}_${user}_${reserve}`;
  const userReserve = new UserReserve(user, userBorrowBal, new u256(0), new u256(0), new u256(0), new u256(0), true);

  Storage.set(stringToBytes(storageKey), userReserve.serialize());

}

export function updateStateOnRedeem(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);
  const user = args.nextString().unwrap();
  const reserve = args.nextString().unwrap();
  const amount = args.nextU256().unwrap();

  const mTokenData = getReserve(new Args().add(reserve).serialize());
  const mTokenAddr = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  const mToken = new IERC20(new Address(mTokenAddr.mTokenAddress));
  mToken.transferFrom(new Address(user), Context.callee(), amount);
  mToken.burn(amount);

  const reserveData = getUserReserve(new Args().add(user).add(reserve).serialize())
  const userBorrowBalData = new Args(reserveData).nextSerializable<UserReserve>().unwrap();

  let userBorrowBal: u256 = userBorrowBalData.principalBorrowBalance;
  userBorrowBal = new u256(u64.parse(amount.toString()) + u64.parse(userBorrowBal.toString()));

  const storageKey = `${USER_KEY}_${user}_${reserve}`;
  const userReserve = new UserReserve(user, userBorrowBal, new u256(0), new u256(0), new u256(0), new u256(0), true);

  Storage.set(stringToBytes(storageKey), userReserve.serialize());

}

// export function updateStateOnDeposit(binaryArgs: StaticArray<u8>): void {

//   const args = new Args(binaryArgs);

//   const reserve = args.nextString().unwrap();
//   const amount = args.nextU256().unwrap();

//   if (reserve == MAS) {
//     assert(Context.transferredCoins() >= u64(amount), "Not enough sent coins");
//     transferCoins(Context.callee(), u64(amount));
//   } else {
//     assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
//     new IERC20(new Address(reserve)).transfer(Context.callee(), amount);
//   }

// }

export function getReserveAvailableLiquidity(binaryArgs: StaticArray<u8>): u256 {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();

  let bal = new u256(0);

  if (reserve == MAS) {
    bal = new u256(balance());
  } else {
    bal = new IERC20(new Address(reserve)).balanceOf(Context.callee());
  }

  return bal;
}

export function getUserBasicReserveData(binaryArgs: StaticArray<u8>): u256 {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  // const reserveData: Reserve = getReserve(stringToBytes(reserve));
  // const userData: UserReserve = getUserReserve(new Args().add(user).add(reserve).serialize());

  const underlyingBalance = getUserUnderlyingAssetBalance(new Address(reserve), new Address(user));

  return underlyingBalance;

}

function getUserUnderlyingAssetBalance(reserve: Address, user: Address): u256 {
  const args = new Args().add(reserve).serialize();
  const mTokenData = getReserve(args);
  const mToken = new Args(mTokenData).nextSerializable<Reserve>().unwrap();
  const mTokenAddr = new IERC20(new Address(mToken.mTokenAddress));
  return mTokenAddr.balanceOf(user);
}

export function getUserBorrowBalances(binaryArgs: StaticArray<u8>): StaticArray<u64> {
  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  const userData = getUserReserve(new Args().add(user).add(reserve).serialize())
  const userBorrowBalData = new Args(userData).nextSerializable<UserReserve>().unwrap();
  
  let userBorrows = new Array<u64>()

  let principal = u64.parse(userBorrowBalData.principalBorrowBalance.toString());
  // const compoundBal: u256 = new u256(core.getCompoundedBorrowBalance(user, reserve));
  const compoundBal = u64.parse('10');

  userBorrows.push(principal);
  userBorrows.push(compoundBal);
  const balIncrease = u64.parse(compoundBal.toString()) - u64.parse(principal.toString());
  userBorrows.push(balIncrease);

  return userBorrows;
}
