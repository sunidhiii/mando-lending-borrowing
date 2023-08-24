import { call, Context, createSC, Storage, Address, transferCoins, balance } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, fixedSizeArrayToBytes, stringToBytes } from '@massalabs/as-types';
import { onlyOwner } from '../helpers/ownership';
// import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { IERC20 } from '../interfaces/IERC20';

const ONE_UNIT = 10 ** 9;
const RESERVE_KEY = 'RESERVE_KEY';
const USER_KEY = 'RESERVE_KEY';

export const ORIGNATION_FEE = 0.0025 * 10 ** 9;
export const MAS = 'EeeEeeEeeeeEeeeeeEeeeeeeEeeeeeeEEeeeeeeEeeeEeeeeeeEee';

// enum InterestRateMode { NONE, STABLE, VARIABLE }

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
class Reserve implements Serializable {
  constructor(
    public addr: Address = new Address(),
    public name: string = '',
    public symbol: string = '',
    public decimals: u64 = 0,
    public mTokenAddress: Address = new Address(),
    public interestCalcAddress: Address = new Address(),
    public baseLTV: u64 = 0,
    public LiquidationThreshold: u64 = 0,
    public LiquidationBonus: u64 = 0,
  ) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.addr);
    args.add(this.name);
    args.add(this.symbol);
    args.add(this.decimals);
    args.add(this.mTokenAddress);
    args.add(this.interestCalcAddress);
    args.add(this.baseLTV);
    args.add(this.LiquidationThreshold);
    args.add(this.LiquidationBonus);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);

    const addr = args.nextString();
    if (addr.isErr()) {
      return new Result(0, "Can't deserialize the addr");
    }
    this.addr = new Address(addr.unwrap());

    const name = args.nextString();
    if (name.isErr()) {
      return new Result(0, "Can't deserialize the name");
    }
    this.name = name.unwrap();

    const symbol = args.nextString();
    if (symbol.isErr()) {
      return new Result(0, "Can't deserialize the symbol");
    }
    this.symbol = symbol.unwrap();

    const decimals = args.nextU64();
    if (decimals.isErr()) {
      return new Result(0, "Can't deserialize the decimals");
    }
    this.decimals = decimals.unwrap();

    const mTokenAddress = args.nextString();
    if (mTokenAddress.isErr()) {
      return new Result(0, "Can't deserialize the mTokenAddress");
    }
    this.mTokenAddress = new Address(mTokenAddress.unwrap());

    const interestCalcAddress = args.nextString();
    if (interestCalcAddress.isErr()) {
      return new Result(0, "Can't deserialize the interestCalcAddress");
    }
    this.interestCalcAddress = new Address(interestCalcAddress.unwrap());

    const baseLTV = args.nextU64();
    if (baseLTV.isErr()) {
      return new Result(0, "Can't deserialize the baseLTV");
    }
    this.baseLTV = baseLTV.unwrap();

    const LiquidationThreshold = args.nextU64();
    if (LiquidationThreshold.isErr()) {
      return new Result(0, "Can't deserialize the LiquidationThreshold");
    }
    this.LiquidationThreshold = LiquidationThreshold.unwrap();

    const LiquidationBonus = args.nextU64();
    if (LiquidationBonus.isErr()) {
      return new Result(0, "Can't deserialize the LiquidationBonus");
    }
    this.LiquidationBonus = LiquidationBonus.unwrap();

    return new Result(args.offset);
  }
}

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

  onlyOwner();

  // convert the binary input to Args
  const args: Args = new Args(binaryArgs);

  // safely unwrap the request data
  let reserve: Reserve = args.nextSerializable<Reserve>().unwrap();

  let mToken_contract_code = Storage.get(stringToBytes('mToken_contract_code'));
  let mToken_addr = createSC(mToken_contract_code);
  call(mToken_addr, 'constructor', args.add(Context.caller().toString()), 10 * ONE_UNIT);
  
  reserve.mTokenAddress = mToken_addr;
  call(reserve.mTokenAddress, 'constructor', new Args().add('name').add('symbol').add(9).add(1000000*ONE_UNIT).add(Context.caller().toString()), 10 * ONE_UNIT);
  
  // let mToken_contract_code = args.nextUint8Array().unwrap();
  // reserve.mTokenAddress = createSC(new Args().add(mToken_contract_code).serialize());

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserve.addr}`;

  // check reserve does not already exist
  const reserveExists = Storage.has(storageKey);
  assert(!reserveExists, 'Reserve already exists');

  // save reserve to storage
  Storage.set(stringToBytes(storageKey), reserve.serialize());

  addReserveToList(reserve.addr);

}

export function getReserve(binaryArgs: StaticArray<u8>): Reserve {
  // convert the binary input to Args
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${RESERVE_KEY}_${reserveAddr}`;

  // check reserve must already exist
  const reserveExists = Storage.has(storageKey);
  assert(reserveExists, 'Reserve does not exist');

  // get the serialized reserve info
  const data = Storage.get(stringToBytes(storageKey));

  return new Args(data).nextSerializable<Reserve>().unwrap();
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
  const reserveExists = Storage.has(storageKey);
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
  const reserveAddr = args.nextString().unwrap();

  // assemble the storage key
  const storageKey = `${USER_KEY}_${userReserve.addr}_${reserveAddr}`;

  // check reserve does not already exist
  const userExists = Storage.has(storageKey);
  assert(!userExists, 'User already exists');

  // save reserve to storage
  Storage.set(stringToBytes(storageKey), userReserve.serialize());

  // addReserveToList(reserve.addr);

}

export function getUser(binaryArgs: StaticArray<u8>): UserReserve {
  const args = new Args(binaryArgs);

  const userAddr = args.nextString().unwrap();
  const reserveAddr = args.nextString().unwrap();

  const storageKey = `${USER_KEY}_${userAddr}_${reserveAddr}`;

  // check reserve must already exist
  const userExists = Storage.has(storageKey);
  assert(userExists, 'User does not exist');

  // get the serialized reserve info
  const data = Storage.get(stringToBytes(storageKey));

  return new Args(data).nextSerializable<UserReserve>().unwrap();
}

export function userExists(binaryArgs: StaticArray<u8>): bool {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const user = args.nextString().unwrap();
  const reserve = args.nextString().unwrap();

  const storageKey = `${USER_KEY}_${user}_${reserve}`;

  // check reserve must already exist
  if (Storage.has(storageKey)) {
    return true
  } else { return false; }

}

function addReserveToList(reserve: Address): void {
  
  if (!Storage.has(stringToBytes('ALL_RESERVES'))) {
    Storage.set(stringToBytes('ALL_RESERVES'), new Args().add<Array<string>>([]).serialize());
  }
  
  const storageKey = `${RESERVE_KEY}_${reserve}`;
  if (!Storage.has(storageKey)) {
    // let reserveArr = Storage.get('ALL_RESERVES');
    // var array_data: string[] = reserveArr.split(',');
    // array_data.push(reserve.toString());
    // Storage.set('ALL_RESERVES', array_data.toString());
    
    let reserveArr = new Args(Storage.get(stringToBytes('ALL_RESERVES'))).nextStringArray().unwrap();
    reserveArr.push(reserve.toString());
    Storage.set(stringToBytes('ALL_RESERVES'), new Args().add<Array<string>>(reserveArr).serialize());
  }

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
  const amount = args.nextU64().unwrap();

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= amount, "Not enough sent coins");
    transferCoins(Context.callee(), amount);
  } else {
    assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve.toString())).transferFrom(new Address(user), Context.callee(), amount);
  }

}

export function transferToUser(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

  if (reserve == MAS) {
    transferCoins(new Address(user), amount);
  } else {
    new IERC20(new Address(reserve.toString())).transfer(new Address(user), amount);
  }

}

export function updateStateOnDeposit(binaryArgs: StaticArray<u8>): void {

  const args = new Args(binaryArgs);

  const reserve = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

  if (reserve == MAS) {
    assert(Context.transferredCoins() >= amount, "Not enough sent coins");
    transferCoins(Context.callee(), amount);
  } else {
    assert(Context.transferredCoins() == 0, "User is sending Massa along with tokens");
    new IERC20(new Address(reserve.toString())).transfer(Context.callee(), amount);
  }

}

export function getReserveAvailableLiquidity(binaryArgs: StaticArray<u8>): u64 {
  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  
  let bal: u64 = 0;

  if (reserve.toString() == MAS) {
    bal = u64(balance());
  } else {
    bal = u64(new IERC20(new Address(reserve.toString())).balanceOf(Context.callee()));
  }

  return u64(bal);
}

export function getUserBasicReserveData(binaryArgs: StaticArray<u8>): u64 {

  const args = new Args(binaryArgs);
  const reserve = args.nextString().unwrap();
  const user = args.nextString().unwrap();

  // const reserveData: Reserve = getReserve(stringToBytes(reserve));
  // const userData: UserReserve = getUser(new Args().add(user).add(reserve).serialize());

  const underlyingBalance: u64 = getUserUnderlyingAssetBalance(new Address(reserve), new Address(user));

  return underlyingBalance;
  
}

function getUserUnderlyingAssetBalance(reserve: Address, user: Address): u64 {
  const args = new Args().add(reserve).serialize();
  const mToken = new IERC20(getReserve(args).mTokenAddress);
  return u64(mToken.balanceOf(user));
}
