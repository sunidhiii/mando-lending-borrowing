import { generateEvent, Context, callerHasWriteAccess, Storage, Address, call } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { setOwner, onlyOwner } from '../helpers/ownership';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
// import { Reserve } from '../contracts/LendingCore';
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
 * @param _args - Arguments serialized with Args
 */
export function constructor(providerAddress: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensure that this function can't be called in the future.
  // If you remove this check someone could call your constructor function and reset your SC.
  if (!callerHasWriteAccess()) {
    return [];
  }

  setOwner(new Args().add(Context.caller()).serialize());

  const args = new Args(providerAddress);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  Storage.set(
      'PROVIDER_ADDR',
      provider,
  );

  generateEvent(
    `Constructor called on contract ${Context.callee().toString()}`,
  );

  return [];
}

// function createInitialMusicShop(): void {
//   const musicAlbum = new MusicAlbum('1', 'CD', 'Nirvana', 'Nevermind', 1991);
//   Storage.set(
//     stringToBytes(`${MUSIC_ALBUM_KEY}_${musicAlbum.id}`),
//     musicAlbum.serialize(),
//   );
// }

export function addReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();

  const provider = new ILendingAddressProvider(new Address(Storage.get('PROVIDER_ADDR')));
  // const core = new ILendingCore(provider.getCore());
  const core = provider.getCore()

  const args: Args = new Args(binaryArgs);
  const reserveData = args.nextSerializable<Reserve>().unwrap();
  
  // core.initReserve(new Args().add(reserveData).serialize());
  call(core, "initReserve", new Args().add(reserveData), 0);

}

// export function viewReserve(binaryArgs: StaticArray<u8>): Reserve {
//   // convert the binary input to Args
//   const provider = new ILendingAddressProvider(new Address(Storage.get('PROVIDER_ADDR')));
//   const core = new ILendingCore(provider.getCore());
  
//   const args: Args = new Args(binaryArgs);
//   const reserveAddr = new Address(args.nextString().unwrap());

//   const reserve = core.getReserve(reserveAddr);
//   return reserve;
// }

export function removeReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();

  const provider = new ILendingAddressProvider(new Address(Storage.get('PROVIDER_ADDR')));
  const core = new ILendingCore(provider.getCore());
  
  const args: Args = new Args(binaryArgs);
  const reserveAddr = new Address(args.nextString().unwrap());

  core.deleteReserve(reserveAddr);
}

